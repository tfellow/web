import { gate, db, $, $$, esc, toast, copyText, playUrl, uniqueCode, toDate, toLocalInput } from "./common.js";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, isWord, autoBlanks, splitSentences, remapBlanks, contextOf, shuffle, shuffledPerm, splitChunks, fitsChunks, wordKey, wordPrimary, autoChunks, autoKeepCap, chipText } from "./core.js";

const ctx = await gate({ teacherOnly: true });
const app = $("#app");
const P = new URLSearchParams(location.search);
const DEFAULT_SETTINGS = {
  answerMode: "bank", hintFirst: false, hintLen: false, caseSensitive: false,
  timeLimitMin: 0, maxAttempts: 0, showAnswers: true, showBoard: true,
  open: true, deadline: null, tts: true, wordIgnorePunct: true,
  wordInput: "both", wordChunk: "word", wordChunkN: 2
};
const CHUNK_MODES = { word: "단어 하나씩", n: "몇 단어씩", phrase: "의미 단위 (끊어 읽기)", count: "문장마다 몇 묶음" };
let id = P.get("id");
let code = null;
let T = {
  title: "", folder: "", mode: ["order", "words"].includes(P.get("mode")) ? P.get("mode") : "cloze",
  text: "", blanks: [], accepted: {}, distractors: [], sentences: [], words: [],
  settings: { ...DEFAULT_SETTINGS }
};
const A = { start: 2, every: 7, minLen: 3, keepFirst: true, skipFunction: true };
let tokens = [];
let dirty = false;

if (id) {
  const s = await getDoc(doc(db, "tests", id));
  if (!s.exists() || s.data().ownerUid !== ctx.user.uid) {
    app.innerHTML = `<div class="card narrow"><h2>테스트를 찾을 수 없습니다</h2><a class="btn" href="index.html">첫 화면</a></div>`;
    throw new Error("not found");
  }
  const d = s.data();
  T = { ...T, ...d, accepted: d.accepted || {}, distractors: d.distractors || [], sentences: d.sentences || [], words: d.words || [], blanks: d.blanks || [], settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } };
  code = d.code;
}
tokens = tokenize(T.text);
render();

window.addEventListener("beforeunload", e => { if (dirty) { e.preventDefault(); e.returnValue = ""; } });
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
});

function markDirty() {
  dirty = true;
  const s = $("#saveState");
  if (s) s.textContent = "저장 안 됨";
}

function render() {
  app.innerHTML = `
  <div class="container wide">
    <div class="row between wrap sticky-bar">
      <div class="row wrap grow">
        <input id="title" class="title-input grow" placeholder="테스트 제목 (예: Lesson 7 50-Word Summary)" value="${esc(T.title)}">
        <input id="folder" placeholder="폴더 (예: 1학년 Lesson 7)" value="${esc(T.folder || "")}" class="folder-input">
      </div>
      <div class="row wrap">
        <span class="muted small" id="saveState">${dirty ? "저장 안 됨" : ""}</span>
        <button class="btn" id="printBtn">학습지 인쇄</button>
        <button class="btn" id="previewBtn">미리보기</button>
        <button class="btn primary" id="saveBtn">저장 (Ctrl+S)</button>
      </div>
    </div>
    ${code ? `<div class="card row wrap between">
      <div>학생 입장 코드 <b class="mono big-code">${esc(code)}</b></div>
      <div class="row wrap">
        <button class="btn small" id="copyLink">학생 링크 복사</button>
        <a class="btn small" href="results.html?id=${id}">결과 보기</a>
        <a class="btn small" href="live.html?id=${id}" target="_blank">실시간 순위 화면</a>
      </div></div>` : ""}
    <div class="tabs" id="modeTabs">
      <button data-m="cloze" class="${T.mode === "cloze" ? "on" : ""}">빈칸 채우기</button>
      <button data-m="order" class="${T.mode === "order" ? "on" : ""}">문장 순서 맞추기</button>
      <button data-m="words" class="${T.mode === "words" ? "on" : ""}">어순 배열</button>
    </div>
    <div class="card ${T.mode === "words" ? "hidden" : ""}" id="textCard">
      <h3>1. 본문</h3>
      <textarea id="text" rows="7" placeholder="본문을 붙여 넣으세요.">${esc(T.text)}</textarea>
      <p class="muted small" id="textInfo"></p>
    </div>
    <div id="modePanel"></div>
    <div class="card" id="settingsPanel"></div>
  </div>`;
  $("#title").oninput = e => { T.title = e.target.value; markDirty(); };
  $("#folder").oninput = e => { T.folder = e.target.value; markDirty(); };
  $("#saveBtn").onclick = save;
  $("#previewBtn").onclick = openPreview;
  $("#printBtn").onclick = printWorksheet;
  const cl = $("#copyLink");
  if (cl) cl.onclick = () => copyText(playUrl(code));
  $$("#modeTabs button").forEach(b => {
    b.onclick = () => {
      T.mode = b.dataset.m;
      $$("#modeTabs button").forEach(x => x.classList.toggle("on", x === b));
      markDirty();
      $("#textCard").classList.toggle("hidden", T.mode === "words");
      renderModePanel();
      renderSettings();
    };
  });
  let timer = null;
  $("#text").oninput = e => {
    clearTimeout(timer);
    timer = setTimeout(() => onTextChange(e.target.value), 300);
  };
  updateTextInfo();
  renderModePanel();
  renderSettings();
}

function onTextChange(v) {
  const old = tokens;
  T.text = v;
  tokens = tokenize(v);
  const r = remapBlanks(old, tokens, T.blanks, T.accepted);
  T.blanks = r.blanks;
  T.accepted = r.accepted;
  if (r.lost) toast(`본문이 바뀌어 빈칸 ${r.lost}개가 없어졌습니다.`, "warn");
  markDirty();
  updateTextInfo();
  if (T.mode === "cloze") renderTokens();
}

function updateTextInfo() {
  const w = tokens.filter(isWord).length;
  const s = splitSentences(T.text).length;
  $("#textInfo").textContent = T.text.trim() ? `단어 ${w}개 · 문장 ${s}개` : "";
}

function renderModePanel() {
  if (T.mode === "cloze") renderCloze();
  else if (T.mode === "order") renderOrder();
  else $("#modePanel").innerHTML = "";
  if (T.mode !== "order") {
    $("#modePanel").insertAdjacentHTML("beforeend", `<div class="card" id="wordsPanel"></div>`);
    renderWords();
  }
}

// ---------- 빈칸 채우기 ----------
function renderCloze() {
  $("#modePanel").innerHTML = `
  <div class="card">
    <h3>2. 빈칸 만들기</h3>
    <div class="auto-box row wrap">
      <label class="inline">시작 단어 <input type="number" id="aStart" min="1" value="${A.start}"></label>
      <label class="inline">몇 단어마다 <input type="number" id="aEvery" min="1" value="${A.every}"></label>
      <label class="inline">최소 글자 수 <input type="number" id="aMin" min="1" value="${A.minLen}"></label>
      <label class="check"><input type="checkbox" id="aFirst" ${A.keepFirst ? "checked" : ""}> 첫 문장은 그대로</label>
      <label class="check"><input type="checkbox" id="aFunc" ${A.skipFunction ? "checked" : ""}> a, the, is 같은 기능어 건너뛰기</label>
      <button class="btn primary" id="autoBtn">자동 빈칸 만들기</button>
      <button class="btn" id="clearBtn">빈칸 모두 지우기</button>
    </div>
    <p class="muted small">아래 본문에서 <b>단어를 클릭하면 빈칸</b>이 되고, <b>빈칸을 다시 클릭하면 원래 단어</b>로 돌아갑니다.</p>
    <div id="tokenView" class="token-view"></div>
    <p><b id="blankCount"></b></p>
  </div>
  <div class="card">
    <h3>3. 정답과 허용 답안</h3>
    <p class="muted small">허용 답안: 정답 말고도 맞게 처리할 답을 쉼표로 구분해 적습니다. (예: color, colour) 대소문자와 끝의 마침표는 기본적으로 무시합니다.</p>
    <div id="blankList"></div>
    <h4>오답 보기 단어</h4>
    <p class="muted small">'단어 고르기' 방식에서 정답 단어와 함께 섞여 나옵니다. 쉼표로 구분합니다.</p>
    <input id="distractors" placeholder="예: sweet, sour, round" value="${esc((T.distractors || []).join(", "))}">
  </div>`;
  $("#autoBtn").onclick = () => {
    A.start = $("#aStart").value; A.every = $("#aEvery").value; A.minLen = $("#aMin").value;
    A.keepFirst = $("#aFirst").checked; A.skipFunction = $("#aFunc").checked;
    if (T.blanks.length && !confirm("지금 있는 빈칸을 지우고 새로 만들까요?")) return;
    T.blanks = autoBlanks(tokens, A);
    T.accepted = {};
    markDirty();
    renderTokens();
    toast(`빈칸 ${T.blanks.length}개를 만들었습니다.`);
  };
  $("#clearBtn").onclick = () => {
    if (!T.blanks.length || !confirm("빈칸을 모두 지울까요?")) return;
    T.blanks = []; T.accepted = {};
    markDirty(); renderTokens();
  };
  $("#distractors").oninput = e => {
    T.distractors = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
    markDirty();
  };
  $("#tokenView").onclick = e => {
    const s = e.target.closest(".tok");
    if (s) toggleBlank(+s.dataset.i);
  };
  renderTokens();
}

function toggleBlank(i) {
  const k = T.blanks.indexOf(i);
  if (k >= 0) { T.blanks.splice(k, 1); delete T.accepted[i]; }
  else { T.blanks.push(i); T.blanks.sort((a, b) => a - b); }
  markDirty();
  renderTokens();
}

function renderTokens() {
  const tv = $("#tokenView");
  if (!tv) return;
  const bmap = new Map(T.blanks.map((b, k) => [b, k]));
  if (!tokens.length) tv.innerHTML = `<p class="muted">본문을 먼저 붙여 넣으세요.</p>`;
  else tv.innerHTML = tokens.map((t, i) => {
    if (isWord(t)) return bmap.has(i)
      ? `<span class="tok blank" data-i="${i}" data-n="${bmap.get(i) + 1}">${esc(t)}</span>`
      : `<span class="tok" data-i="${i}">${esc(t)}</span>`;
    if (/\n/.test(t)) return "<br>".repeat(Math.min(2, (t.match(/\n/g) || []).length));
    return esc(t);
  }).join("");
  $("#blankCount").textContent = `빈칸 ${T.blanks.length}개`;
  renderBlankList();
  renderWordItems();
}

function renderBlankList() {
  const el = $("#blankList");
  if (!el) return;
  if (!T.blanks.length) { el.innerHTML = `<p class="muted">아직 빈칸이 없습니다.</p>`; return; }
  el.innerHTML = `<table class="tbl"><thead><tr><th>#</th><th>정답</th><th>앞뒤 문장</th><th>허용 답안 (쉼표 구분)</th><th></th></tr></thead><tbody>
    ${T.blanks.map((b, k) => `<tr>
      <td>${k + 1}</td><td><b>${esc(tokens[b])}</b></td>
      <td class="muted small">${esc(contextOf(tokens, b))}</td>
      <td><input class="acc" data-i="${b}" value="${esc((T.accepted[b] || []).join(", "))}" placeholder="없음"></td>
      <td><button class="btn small ghost" data-rm="${b}">빼기</button></td></tr>`).join("")}
  </tbody></table>`;
  $$(".acc", el).forEach(inp => {
    inp.oninput = () => {
      const v = inp.value.split(",").map(s => s.trim()).filter(Boolean);
      if (v.length) T.accepted[inp.dataset.i] = v; else delete T.accepted[inp.dataset.i];
      markDirty();
    };
  });
  $$("[data-rm]", el).forEach(b => { b.onclick = () => toggleBlank(+b.dataset.rm); });
}

// ---------- 문장 순서 ----------
function renderOrder() {
  if (!T.sentences.length && T.text.trim()) T.sentences = splitSentences(T.text);
  $("#modePanel").innerHTML = `
  <div class="card">
    <h3>2. 문장 나누기</h3>
    <p class="muted small">한 줄에 한 문장씩 적습니다. 자동으로 나눈 뒤 필요하면 직접 고치세요. (Mr. 같은 약어 때문에 잘못 나뉠 수 있습니다.) 두 문장을 한 줄에 묶으면 한 덩어리로 움직입니다. 학생에게는 순서가 섞여 나옵니다.</p>
    <div class="row"><button class="btn primary" id="splitBtn">본문에서 문장 자동 나누기</button></div>
    <textarea id="sentences" rows="10">${esc(T.sentences.join("\n"))}</textarea>
    <p><b id="sentCount">${T.sentences.length}문장</b></p>
  </div>`;
  $("#splitBtn").onclick = () => {
    if (T.sentences.length && !confirm("지금 목록을 지우고 본문에서 다시 나눌까요?")) return;
    T.sentences = splitSentences(T.text);
    $("#sentences").value = T.sentences.join("\n");
    $("#sentCount").textContent = T.sentences.length + "문장";
    markDirty();
  };
  $("#sentences").oninput = e => {
    T.sentences = e.target.value.split("\n").map(s => s.trim()).filter(Boolean);
    $("#sentCount").textContent = T.sentences.length + "문장";
    markDirty();
  };
}

// ---------- 어순 배열 ----------
// T.words: [{ s: 교사가 적은 문장, chunks: [단어 조각], end: 끝 문장부호, alts: [다른 정답], cap: 첫 단어 대문자 유지 (없으면 자동) }]
function chunkWith(chunks) {
  return autoChunks(chunks, T.settings.wordChunk || "word", T.settings.wordChunkN || 2);
}
function newWord(s) {
  const r = splitChunks(s);
  return { s, chunks: chunkWith(r.chunks), end: r.end, alts: [] };
}
function syncWords(lines) {
  const old = new Map();
  T.words.forEach(w => { if (!old.has(w.s)) old.set(w.s, []); old.get(w.s).push(w); });
  T.words = lines.map(s => old.get(s)?.shift() || newWord(s));
}
function keepCap(w) { return w.cap != null ? w.cap : autoKeepCap(w.chunks); }
function renderWords() {
  const el = $("#wordsPanel");
  if (!el) return;
  const main = T.mode === "words";
  el.innerHTML = `
    <h3>${main ? "2. 어순 배열 문제" : "4. 어순 배열 문제 (선택)"}</h3>
    <p class="muted small">한 줄에 한 문장씩 <b>문장만</b> 적으면 단어 조각은 자동으로 만들어지고, <b>한 문장이 한 문제</b>가 됩니다. 학생에게는 조각이 섞여 나옵니다. 끝의 마침표·물음표는 답 칸 끝에 고정되고, 첫 단어의 대문자는 소문자로 바꿔 보여 주어 (I·고유명사 제외) 첫 단어가 드러나지 않습니다. 학생이 답 칸 맨 앞에 놓은 조각은 자동으로 대문자로 시작합니다.${main ? "" : " 비워 두면 빈칸 문제만 나갑니다. 문제 번호는 빈칸 다음부터 이어집니다."}</p>
    ${T.text.trim() ? `<div class="row"><button class="btn" id="wFromText">본문에서 문장 가져오기</button></div>` : ""}
    <textarea id="wLines" rows="6" placeholder="예: I went to New York with my family last summer.">${esc(T.words.map(w => w.s).join("\n"))}</textarea>
    <div class="wtools row wrap">
      <b>자동 묶기</b>
      <select id="wcMode">${Object.entries(CHUNK_MODES).map(([k, v]) => `<option value="${k}" ${(T.settings.wordChunk || "word") === k ? "selected" : ""}>${v}</option>`).join("")}</select>
      <span id="wcNBox" class="${["n", "count"].includes(T.settings.wordChunk) ? "" : "hidden"}"><input type="number" id="wcN" min="2" max="10" value="${T.settings.wordChunkN || 2}" style="width:4.5em"> <span id="wcUnit">${T.settings.wordChunk === "count" ? "묶음" : "단어씩"}</span></span>
      <button class="btn small" id="wcApply">모든 문장에 적용</button>
    </div>
    <p class="muted small">의미 단위는 관사+명사 (the big tree), 전치사구 (with my family), 조동사+동사 (is going to visit), 자주 쓰는 표현 (a lot of), 고유명사 (New York)를 규칙으로 묶습니다. 완벽하지 않으니 아래에서 손으로 고치세요. 새로 적는 문장도 이 방식으로 나뉩니다.</p>
    <p class="muted small">아래에서 단어 사이의 <b>＋</b>를 누르면 두 단어가 한 덩어리로 묶이고 (예: New York), 묶인 덩어리를 누르면 다시 나뉩니다. 어순이 여러 가지로 맞을 수 있으면 <b>다른 정답 추가</b>에 적으세요.</p>
    <div id="wItems"></div>`;
  const ta = $("#wLines");
  let timer = null;
  ta.oninput = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      syncWords(ta.value.split("\n").map(s => s.trim()).filter(Boolean));
      markDirty();
      renderWordItems();
    }, 300);
  };
  const syncN = () => {
    const m = $("#wcMode").value;
    $("#wcNBox").classList.toggle("hidden", !["n", "count"].includes(m));
    $("#wcUnit").textContent = m === "count" ? "묶음" : "단어씩";
  };
  $("#wcMode").onchange = () => { T.settings.wordChunk = $("#wcMode").value; syncN(); markDirty(); };
  $("#wcN").oninput = () => { T.settings.wordChunkN = Math.max(2, Math.min(10, parseInt($("#wcN").value) || 2)); markDirty(); };
  $("#wcApply").onclick = () => {
    if (!T.words.length) return;
    if (!confirm(`모든 문장을 '${CHUNK_MODES[T.settings.wordChunk || "word"]}'(으)로 다시 나눕니다. 손으로 묶은 것은 없어집니다. 계속할까요?`)) return;
    T.words.forEach(w => { w.chunks = chunkWith(w.chunks); });
    markDirty();
    renderWordItems();
  };
  const ft = $("#wFromText");
  if (ft) ft.onclick = () => {
    if (T.words.length && !confirm("지금 목록을 지우고 본문에서 다시 가져올까요?")) return;
    syncWords(splitSentences(T.text));
    ta.value = T.words.map(w => w.s).join("\n");
    markDirty();
    renderWordItems();
  };
  $("#wItems").onclick = e => {
    const box = e.target.closest("[data-w]");
    if (!box) return;
    const w = T.words[+box.dataset.w];
    const j = e.target.closest("[data-join]"), sp = e.target.closest("[data-split]"), rm = e.target.closest("[data-rmalt]"), add = e.target.closest("[data-addalt]");
    const rc = e.target.closest("[data-rechunk]"), cp = e.target.closest("[data-cap]");
    if (cp) {
      w.cap = cp.checked;
    } else if (rc) {
      w.chunks = chunkWith(w.chunks);
    } else if (j) {
      const i = +j.dataset.join;
      w.chunks.splice(i, 2, w.chunks[i] + " " + w.chunks[i + 1]);
    } else if (sp) {
      const i = +sp.dataset.split;
      w.chunks.splice(i, 1, ...w.chunks[i].split(" "));
    } else if (rm) {
      w.alts.splice(+rm.dataset.rmalt, 1);
    } else if (add) {
      const inp = $(".alt-input", box);
      const v = splitChunks(inp.value).chunks.join(" ");
      if (!v) return;
      const keys = [wordPrimary(w), ...w.alts].map(a => wordKey(a, false));
      if (keys.includes(wordKey(v, false))) { toast("이미 있는 정답입니다.", "warn"); return; }
      if (!fitsChunks(v, w.chunks)) toast("단어 조각과 맞지 않는 답입니다. 그래도 추가했으니 확인하세요.", "warn");
      w.alts.push(v);
    } else return;
    markDirty();
    renderWordItems();
  };
  $("#wItems").onkeydown = e => {
    if (e.key === "Enter" && e.target.classList.contains("alt-input")) {
      e.preventDefault();
      $("[data-addalt]", e.target.closest("[data-w]")).click();
    }
  };
  renderWordItems();
}
function renderWordItems() {
  const el = $("#wItems");
  if (!el) return;
  const base = T.mode === "words" ? 0 : T.blanks.length;
  if (!T.words.length) { el.innerHTML = `<p class="muted">아직 문제가 없습니다.</p>`; return; }
  el.innerHTML = T.words.map((w, k) => `<div class="witem" data-w="${k}">
    <div class="row wrap"><b class="wnum">${base + k + 1}.</b>
      <div class="wchunks">${w.chunks.map((c, i) => `${i ? `<button class="wjoin" data-join="${i - 1}" title="앞 단어와 묶기">＋</button>` : ""}<span class="wchunk ${c.includes(" ") ? "grp" : ""}" ${c.includes(" ") ? `data-split="${i}" title="눌러서 나누기"` : ""}>${esc(c)}</span>`).join("")}${w.end ? `<span class="wend">${esc(w.end)}</span>` : ""}</div>
    </div>
    ${w.chunks.length < 2 ? `<p class="alert warn small">조각이 2개 이상이어야 합니다.</p>` : ""}
    <div class="row wrap small wprev"><span class="muted">학생 화면:</span> ${w.chunks.map((c, i) => `<span class="wpchip">${esc(chipText(w, i, { hidePunct: T.settings.wordIgnorePunct !== false }))}</span>`).join("")}
      <label class="check"><input type="checkbox" data-cap="1" ${keepCap(w) ? "checked" : ""}> 첫 단어 대문자 그대로 (I·고유명사)</label>
      <button class="btn small ghost" data-rechunk="1">이 문장만 다시 묶기</button></div>
    <div class="walts">
      <div class="small"><span class="badge green">정답</span> ${esc(wordPrimary(w))}${esc(w.end)}</div>
      ${w.alts.map((a, i) => `<div class="small"><span class="badge blue">다른 정답</span> ${esc(a)}${esc(w.end)}${fitsChunks(a, w.chunks) ? "" : ` <span class="badge amber">단어 조각과 안 맞음</span>`} <button class="btn small ghost danger" data-rmalt="${i}">삭제</button></div>`).join("")}
      <div class="row"><input class="alt-input" placeholder="다른 정답 (예: Last summer I went to New York with my family)"><button class="btn small" data-addalt="1">다른 정답 추가</button></div>
    </div></div>`).join("");
}

// ---------- 설정 ----------
function renderSettings() {
  const S = T.settings;
  const cl = T.mode === "cloze";
  const dl = S.deadline ? toLocalInput(toDate(S.deadline)) : "";
  $("#settingsPanel").innerHTML = `
    <h3>${T.mode === "order" ? 3 : T.mode === "words" ? 3 : 5}. 응시 설정</h3>
    <div class="settings-grid">
      ${cl ? `<div>
        <div class="lbl">답 입력 방식</div>
        <label class="radio"><input type="radio" name="am" value="bank" ${S.answerMode !== "type" ? "checked" : ""}> 단어 고르기 (색깔 단어를 빈칸에 넣기)</label>
        <label class="radio"><input type="radio" name="am" value="type" ${S.answerMode === "type" ? "checked" : ""}> 직접 입력 (철자까지 평가)</label>
        <div id="typeOpts" class="sub ${S.answerMode === "type" ? "" : "hidden"}">
          <label class="check"><input type="checkbox" data-s="hintFirst" ${S.hintFirst ? "checked" : ""}> 첫 글자 힌트</label>
          <label class="check"><input type="checkbox" data-s="hintLen" ${S.hintLen ? "checked" : ""}> 글자 수 힌트</label>
          <label class="check"><input type="checkbox" data-s="caseSensitive" ${S.caseSensitive ? "checked" : ""}> 대소문자 구분</label>
        </div></div>` : ""}
      <div>
        <div class="lbl">시간 제한 (분, 0 = 없음)</div>
        <input type="number" min="0" max="120" step="0.5" data-n="timeLimitMin" value="${S.timeLimitMin || 0}">
        <p class="muted small">시간이 끝나면 자동으로 제출됩니다.</p>
        <div class="lbl">제출 횟수 제한 (0 = 무제한)</div>
        <input type="number" min="0" max="20" data-n="maxAttempts" value="${S.maxAttempts || 0}">
      </div>
      <div>
        <div class="lbl">마감 일시 (비우면 없음)</div>
        <input type="datetime-local" id="deadline" value="${dl}">
        <label class="check"><input type="checkbox" data-s="open" ${S.open !== false ? "checked" : ""}> 응시 열기</label>
      </div>
      <div>
        <label class="check"><input type="checkbox" data-s="showAnswers" ${S.showAnswers ? "checked" : ""}> 제출 후 정답 보여 주기</label>
        <label class="check"><input type="checkbox" data-s="showBoard" ${S.showBoard ? "checked" : ""}> 학생에게 순위표 보여 주기 (닉네임)</label>
        <label class="check"><input type="checkbox" data-s="tts" ${S.tts !== false ? "checked" : ""}> 제출 후 본문 듣기 (영어 음성, 정답 공개 시)</label>
      </div>
      ${T.mode !== "order" ? `<div>
        <div class="lbl">어순 배열 채점</div>
        <label class="check"><input type="checkbox" data-s="wordIgnorePunct" ${S.wordIgnorePunct !== false ? "checked" : ""}> 쉼표 등 문장부호는 무시하고 단어 순서만 채점</label>
        <p class="muted small">대소문자는 항상 무시합니다. 켜 두면 학생 단어 조각에서도 쉼표를 감춥니다. 끄면 쉼표가 조각에 붙어 나오고, 쉼표 위치까지 정답과 같아야 맞습니다.</p>
        <div class="lbl">학생이 조각을 놓는 방법</div>
        <label class="radio"><input type="radio" name="wi" value="both" ${(S.wordInput || "both") === "both" ? "checked" : ""}> 누르기 + 끌어 놓기 둘 다</label>
        <label class="radio"><input type="radio" name="wi" value="tap" ${S.wordInput === "tap" ? "checked" : ""}> 차례로 누르기만 (휴대폰 추천: 화면을 밀어도 조각이 안 움직임)</label>
        <label class="radio"><input type="radio" name="wi" value="drag" ${S.wordInput === "drag" ? "checked" : ""}> 끌어 놓기만</label>
      </div>` : ""}
    </div>`;
  const panel = $("#settingsPanel");
  $$("[data-s]", panel).forEach(c => { c.onchange = () => { S[c.dataset.s] = c.checked; markDirty(); if (c.dataset.s === "wordIgnorePunct") renderWordItems(); }; });
  $$("[data-n]", panel).forEach(c => { c.oninput = () => { S[c.dataset.n] = Math.max(0, parseFloat(c.value) || 0); markDirty(); }; });
  $$("input[name=wi]", panel).forEach(r => { r.onchange = () => { S.wordInput = r.value; markDirty(); }; });
  $$("input[name=am]", panel).forEach(r => {
    r.onchange = () => {
      S.answerMode = r.value;
      $("#typeOpts").classList.toggle("hidden", r.value !== "type");
      markDirty();
    };
  });
  $("#deadline").onchange = e => {
    S.deadline = e.target.value ? Timestamp.fromDate(new Date(e.target.value)) : null;
    markDirty();
  };
}

// ---------- 저장 ----------
async function save() {
  T.title = $("#title").value.trim();
  T.folder = $("#folder").value.trim();
  if (!T.title) { toast("제목을 입력하세요.", "err"); $("#title").focus(); return false; }
  if (T.mode === "cloze" && !T.blanks.length && !T.words.length) { toast("빈칸이나 어순 배열 문제를 1개 이상 만드세요.", "err"); return false; }
  if (T.mode === "words" && !T.words.length) { toast("어순 배열 문장을 1개 이상 적으세요.", "err"); return false; }
  if (T.mode !== "order" && T.words.some(w => w.chunks.length < 2)) { toast("어순 배열 문제는 단어가 2개 이상이어야 합니다.", "err"); return false; }
  if (T.mode === "order" && T.sentences.length < 2) { toast("문장이 2개 이상 필요합니다.", "err"); return false; }
  const accepted = {};
  T.blanks.forEach(b => { if (T.accepted[b]?.length) accepted[b] = T.accepted[b]; });
  const data = {
    title: T.title, folder: T.folder, mode: T.mode, text: T.text,
    blanks: T.mode === "words" ? [] : T.blanks, accepted: T.mode === "words" ? {} : accepted, distractors: T.distractors || [], sentences: T.sentences || [],
    words: T.mode === "order" ? [] : T.words.map(w => ({ s: w.s, chunks: w.chunks, end: w.end || "", alts: w.alts || [], ...(w.cap != null ? { cap: w.cap } : {}) })),
    settings: { ...T.settings }, updatedAt: serverTimestamp()
  };
  const btn = $("#saveBtn");
  btn.disabled = true;
  try {
    if (id) {
      await updateDoc(doc(db, "tests", id), data);
      dirty = false;
      $("#saveState").textContent = "저장됨";
      toast("저장했습니다.");
    } else {
      code = await uniqueCode();
      const ref = await addDoc(collection(db, "tests"), {
        ...data, code, ownerUid: ctx.user.uid, ownerEmail: ctx.user.email, deleted: false, createdAt: serverTimestamp()
      });
      id = ref.id;
      history.replaceState(null, "", "editor.html?id=" + id);
      dirty = false;
      render();
      toast("저장했습니다. 학생 입장 코드: " + code);
    }
    return true;
  } catch (e) {
    console.error(e);
    toast("저장 실패: " + (e.code || e.message), "err");
    return false;
  } finally {
    const b = $("#saveBtn");
    if (b) b.disabled = false;
  }
}

async function openPreview() {
  if (!id || dirty) { if (!(await save())) return; }
  window.open("play.html?id=" + id + "&preview=1", "_blank");
}

// ---------- 학습지 인쇄 ----------
function printWorksheet() {
  T.title = $("#title").value.trim();
  const w = window.open("", "_blank");
  if (!w) return toast("팝업이 차단되었습니다. 팝업을 허용해 주세요.", "err");
  let body = "";
  let total = 0;
  if (T.mode !== "order") {
    total = T.mode === "words" ? 0 : T.blanks.length;
    const bmap = new Map(T.blanks.map((b, k) => [b, k]));
    const bank = shuffle([...T.blanks.map(b => tokens[b]), ...(T.distractors || [])]);
    const textHtml = tokens.map((t, i) => (bmap.has(i) ? `<span class="pb">(${bmap.get(i) + 1}) ____________</span>` : (/\n/.test(t) ? "<br>".repeat(t.split("\n").length - 1) : esc(t)))).join("");
    const key = T.blanks.map(b => `<li>${esc(tokens[b])}${(T.accepted[b] || []).length ? ` <small>(${esc(T.accepted[b].join(", "))})</small>` : ""}</li>`).join("");
    const base = total;
    total += T.words.length;
    const wq = T.words.map((w, k) => `<li value="${base + k + 1}"><div class="bank">${shuffle(w.chunks.map((_, i) => chipText(w, i, { hidePunct: T.settings.wordIgnorePunct !== false }))).map(esc).join(" &nbsp;/&nbsp; ")}</div>______________________________________________${esc(w.end)}</li>`).join("");
    const wkey = T.words.map((w, k) => `<li value="${base + k + 1}">${esc(wordPrimary(w) + w.end)}${w.alts.length ? ` <small>(${w.alts.map(a => esc(a + w.end)).join(" / ")})</small>` : ""}</li>`).join("");
    body = T.mode === "words" ? "" : `${T.settings.answerMode !== "type" ? `<div class="bank">${bank.map(esc).join(" &nbsp;/&nbsp; ")}</div>` : ""}<div class="txt">${textHtml}</div>`;
    if (T.words.length) body += `<h3>${T.mode === "words" ? "" : "어순 배열 — "}단어를 바르게 배열하여 문장을 완성하세요.</h3><ol>${wq}</ol>`;
    body += `<div class="page"><h2>정답 — ${esc(T.title)}</h2>${T.mode === "words" ? "" : `<ol>${key}</ol>`}${T.words.length ? `<ol>${wkey}</ol>` : ""}</div>`;
  } else {
    const n = T.sentences.length;
    total = n;
    const perm = shuffledPerm(n);
    const lab = i => (i < 26 ? String.fromCharCode(65 + i) : String(i + 1));
    body = `<p>다음 문장을 올바른 순서로 배열하세요.</p><ol type="A">${perm.map(i => `<li>${esc(T.sentences[i])}</li>`).join("")}</ol>
      <p>순서: ${T.sentences.map(() => "(&nbsp;&nbsp;&nbsp;&nbsp;)").join(" → ")}</p>
      <div class="page"><h2>정답 — ${esc(T.title)}</h2><p>${T.sentences.map((_, pos) => lab(perm.indexOf(pos))).join(" → ")}</p></div>`;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(T.title)}</title>
    <style>body{font-family:'Malgun Gothic',sans-serif;max-width:760px;margin:30px auto;line-height:2.2;font-size:16px;color:#000}
    h1{font-size:22px;margin:0 0 8px}.info{display:flex;gap:30px;border-bottom:1px solid #999;padding-bottom:4px}
    .bank{border:1px solid #333;padding:6px 12px;margin:14px 0;line-height:1.9}.page{page-break-before:always}
    button{padding:6px 14px;margin-bottom:10px}@media print{button{display:none}}</style></head>
    <body><button onclick="print()">인쇄</button><h1>${esc(T.title)}</h1>
    <div class="info"><span>학번: ________</span><span>이름: ____________</span><span>점수: ____ / ${total}</span></div>
    ${body}</body></html>`);
  w.document.close();
}
