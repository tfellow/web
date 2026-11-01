import { gate, db, $, $$, esc, toast, copyText, playUrl, uniqueCode, toDate, toLocalInput } from "./common.js";
import { doc, getDoc, addDoc, updateDoc, collection, serverTimestamp, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, isWord, autoBlanks, splitSentences, remapBlanks, contextOf, shuffle, shuffledPerm } from "./core.js";

const ctx = await gate({ teacherOnly: true });
const app = $("#app");
const P = new URLSearchParams(location.search);
const DEFAULT_SETTINGS = {
  answerMode: "bank", hintFirst: false, hintLen: false, caseSensitive: false,
  timeLimitMin: 0, maxAttempts: 0, showAnswers: true, showBoard: true,
  open: true, deadline: null, tts: true
};
let id = P.get("id");
let code = null;
let T = {
  title: "", folder: "", mode: P.get("mode") === "order" ? "order" : "cloze",
  text: "", blanks: [], accepted: {}, distractors: [], sentences: [],
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
  T = { ...T, ...d, accepted: d.accepted || {}, distractors: d.distractors || [], sentences: d.sentences || [], blanks: d.blanks || [], settings: { ...DEFAULT_SETTINGS, ...(d.settings || {}) } };
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
    </div>
    <div class="card">
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
  if (T.mode === "cloze") renderCloze(); else renderOrder();
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

// ---------- 설정 ----------
function renderSettings() {
  const S = T.settings;
  const cl = T.mode === "cloze";
  const dl = S.deadline ? toLocalInput(toDate(S.deadline)) : "";
  $("#settingsPanel").innerHTML = `
    <h3>${cl ? 4 : 3}. 응시 설정</h3>
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
    </div>`;
  const panel = $("#settingsPanel");
  $$("[data-s]", panel).forEach(c => { c.onchange = () => { S[c.dataset.s] = c.checked; markDirty(); }; });
  $$("[data-n]", panel).forEach(c => { c.oninput = () => { S[c.dataset.n] = Math.max(0, parseFloat(c.value) || 0); markDirty(); }; });
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
  if (T.mode === "cloze" && !T.blanks.length) { toast("빈칸을 1개 이상 만드세요.", "err"); return false; }
  if (T.mode === "order" && T.sentences.length < 2) { toast("문장이 2개 이상 필요합니다.", "err"); return false; }
  const accepted = {};
  T.blanks.forEach(b => { if (T.accepted[b]?.length) accepted[b] = T.accepted[b]; });
  const data = {
    title: T.title, folder: T.folder, mode: T.mode, text: T.text,
    blanks: T.blanks, accepted, distractors: T.distractors || [], sentences: T.sentences || [],
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
  if (T.mode === "cloze") {
    total = T.blanks.length;
    const bmap = new Map(T.blanks.map((b, k) => [b, k]));
    const bank = shuffle([...T.blanks.map(b => tokens[b]), ...(T.distractors || [])]);
    const textHtml = tokens.map((t, i) => (bmap.has(i) ? `<span class="pb">(${bmap.get(i) + 1}) ____________</span>` : (/\n/.test(t) ? "<br>" : esc(t)))).join("");
    const key = T.blanks.map(b => `<li>${esc(tokens[b])}${(T.accepted[b] || []).length ? ` <small>(${esc(T.accepted[b].join(", "))})</small>` : ""}</li>`).join("");
    body = `${T.settings.answerMode !== "type" ? `<div class="bank">${bank.map(esc).join(" &nbsp;/&nbsp; ")}</div>` : ""}<div class="txt">${textHtml}</div><div class="page"><h2>정답 — ${esc(T.title)}</h2><ol>${key}</ol></div>`;
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
