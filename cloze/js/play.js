import { gate, db, $, $$, esc, toast, fmtSec, fmtDate, toDate, pickPerStudent, rankSort, MODE_LABEL } from "./common.js";
import { collection, query, where, getDocs, doc, getDoc, addDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, isCorrect, shuffle, shuffledPerm, PALETTE } from "./core.js";

const ctx = await gate({ needProfile: true });
const app = $("#app");
const P = new URLSearchParams(location.search);
const preview = P.get("preview") === "1" || ctx.teacher;

let test = null, testId = null;
try {
  if (P.get("id")) {
    const s = await getDoc(doc(db, "tests", P.get("id")));
    if (s.exists()) { testId = s.id; test = s.data(); }
  } else if (P.get("code")) {
    const s = await getDocs(query(collection(db, "tests"), where("code", "==", P.get("code").trim().toUpperCase())));
    if (!s.empty) { testId = s.docs[0].id; test = s.docs[0].data(); }
  }
} catch (e) { console.error(e); }

if (!test || test.deleted) {
  app.innerHTML = `<div class="card narrow center"><h2>테스트를 찾을 수 없습니다</h2><p class="muted">코드를 다시 확인하세요.</p><a class="btn primary" href="index.html">코드 다시 입력</a></div>`;
  throw new Error("test not found");
}

const S = { answerMode: "bank", timeLimitMin: 0, maxAttempts: 0, showAnswers: true, showBoard: true, tts: true, ...(test.settings || {}) };
const tokens = tokenize(test.text);
const SKEY = `cloze:${testId}:${ctx.user.uid}`;
const deadline = S.deadline ? toDate(S.deadline) : null;
let mySubs = [];
if (!preview) {
  try {
    const s = await getDocs(query(collection(db, "submissions"), where("testId", "==", testId), where("uid", "==", ctx.user.uid)));
    mySubs = s.docs.map(d => d.data());
  } catch (e) { console.error(e); }
}
let R = null;
let timerId = null;

const isClosed = () => !preview && (S.open === false || (deadline && Date.now() > deadline.getTime()));
const isMaxed = () => !preview && S.maxAttempts > 0 && mySubs.length >= S.maxAttempts;
const count = () => (test.mode === "order" ? test.sentences.length : test.blanks.length);

function loadSaved() {
  if (preview) return null;
  try {
    const v = JSON.parse(localStorage.getItem(SKEY));
    return v && v.startedAt ? v : null;
  } catch { return null; }
}
function saveProgress() {
  if (!R || R.practice || R.submitted || preview) return;
  localStorage.setItem(SKEY, JSON.stringify({ startedAt: R.startedAt, leave: R.leave, vals: R.vals, chips: R.chips, order: R.order }));
}

startScreen();

// ================= 시작 화면 =================
function startScreen() {
  const best = mySubs.length ? mySubs.reduce((m, s) => (s.score > m.score ? s : m)) : null;
  const saved = loadSaved();
  const closed = isClosed(), maxed = isMaxed();
  app.innerHTML = `<div class="container narrow-ish"><div class="card center">
    ${preview ? `<p class="alert warn">미리보기 모드입니다. 기록이 저장되지 않습니다.</p>` : ""}
    <h1>${esc(test.title)}</h1>
    <p><span class="badge ${test.mode === "order" ? "purple" : "blue"}">${MODE_LABEL[test.mode]}</span> ${count()}${test.mode === "order" ? "문장" : "문항"}</p>
    <ul class="info-list">
      <li>시간 제한: ${S.timeLimitMin > 0 ? S.timeLimitMin + "분 (끝나면 자동 제출)" : "없음"}</li>
      <li>제출 횟수: ${S.maxAttempts > 0 ? `${mySubs.length} / ${S.maxAttempts}회 사용` : `제한 없음 (지금까지 ${mySubs.length}회)`}</li>
      ${deadline ? `<li>마감: ${fmtDate(deadline)}</li>` : ""}
      ${best ? `<li>내 최고 점수: <b>${best.score} / ${best.total}</b></li>` : ""}
    </ul>
    <p class="muted small">순위표에는 닉네임 <b>${esc(ctx.profile?.nickname || "")}</b>(으)로 표시됩니다.<br>풀고 있을 때 다른 앱이나 탭으로 나가면 그 횟수가 선생님께 기록됩니다.</p>
    ${closed ? `<p class="alert err">응시가 마감되었습니다.</p>`
      : maxed ? `<p class="alert">제출 횟수를 모두 사용했습니다.</p>`
      : `<button class="btn primary big" id="startBtn">${saved ? "이어서 풀기" : "시작하기"}</button>`}
    ${S.showBoard && !preview ? `<div id="board" class="mt left"></div>` : ""}
    <p class="mt"><a href="index.html">첫 화면으로</a></p>
  </div></div>`;
  const sb = $("#startBtn");
  if (sb) sb.onclick = () => startRun();
  if (S.showBoard && !preview) renderBoard($("#board"));
}

// ================= 응시 =================
function startRun(opts = {}) {
  const saved = opts.practice ? null : loadSaved();
  R = {
    practice: !!opts.practice,
    locked: opts.locked || new Set(),
    startedAt: saved?.startedAt || Date.now(),
    leave: saved?.leave || 0,
    submitted: false, sel: null
  };
  if (test.mode === "cloze") setupCloze(saved); else setupOrder(saved);
  saveProgress();
  startTimer();
}

function shell(inner) {
  app.innerHTML = `<div class="play-wrap">
    <div class="play-top">
      <div class="ptitle">${esc(test.title)}${R.practice ? ` <span class="badge amber">연습 (기록 안 됨)</span>` : ""}${preview ? ` <span class="badge gray">미리보기</span>` : ""}</div>
      <div id="progress" class="muted small"></div>
      <div class="timer" id="timer"></div>
      <button class="btn primary" id="submitBtn">제출</button>
    </div>
    ${inner}
  </div>`;
  $("#submitBtn").onclick = () => submit(false);
}

// ---------- 빈칸 채우기 ----------
function setupCloze(saved) {
  const n = test.blanks.length;
  if (S.answerMode !== "type") {
    const words = [];
    test.blanks.forEach((b, k) => { if (!R.locked.has(k)) words.push(tokens[b]); });
    const ds = (test.distractors || []).filter(Boolean);
    R.chips = saved?.chips || shuffle([...words, ...ds]).map((w, i) => ({ id: i, w, color: PALETTE[i % PALETTE.length] }));
    R.vals = saved?.vals || new Array(n).fill(null);
  } else {
    R.vals = saved?.vals || new Array(n).fill("");
  }
  drawCloze();
}

function drawCloze() {
  const bank = S.answerMode !== "type";
  const bmap = new Map(test.blanks.map((b, k) => [b, k]));
  const maxLen = Math.max(...test.blanks.map(b => tokens[b].length), 4);
  const textHtml = tokens.map((t, i) => {
    if (bmap.has(i)) {
      const k = bmap.get(i);
      if (R.locked.has(k)) return `<span class="slot locked">${esc(t)}</span>`;
      if (bank) return `<span class="slot" data-k="${k}" data-n="${k + 1}"></span>`;
      const ph = (S.hintFirst ? t[0] + "…" : "") + (S.hintLen ? ` (${t.length})` : "");
      const width = S.hintLen ? t.length + 3 : maxLen + 2;
      return `<input class="slot-input" data-k="${k}" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="${esc(ph)}" style="width:${width}ch">`;
    }
    if (/\n/.test(t)) return "<br>";
    return esc(t);
  }).join("");
  shell(`${bank ? `<div class="bank" id="bank"></div>` : ""}
    <div class="passage" id="passage">${textHtml}</div>
    <p class="muted small center">${bank
      ? "단어를 누르고 빈칸을 누르세요. (빈칸을 먼저 눌러도 됩니다.) 채운 빈칸을 다시 누르면 단어가 돌아갑니다. 끌어다 놓아도 됩니다."
      : "빈칸에 알맞은 단어를 입력하세요. Enter를 누르면 다음 빈칸으로 넘어갑니다."}</p>`);
  if (bank) { bindBank(); refreshBank(); }
  else {
    const all = $$(".slot-input");
    all.forEach((inp, idx) => {
      const k = +inp.dataset.k;
      inp.value = R.vals[k] || "";
      inp.oninput = () => { R.vals[k] = inp.value; saveProgress(); updateProgress(); };
      inp.onkeydown = e => {
        if (e.key === "Enter") { e.preventDefault(); (all[idx + 1] || $("#submitBtn")).focus(); }
      };
    });
    updateProgress();
  }
}

function nextEmpty(from) {
  const n = R.vals.length;
  for (let d = 1; d <= n; d++) {
    const k = (from + d) % n;
    if (!R.locked.has(k) && R.vals[k] == null) return k;
  }
  return null;
}
function place(id, k) {
  R.vals = R.vals.map(v => (v === id ? null : v));
  R.vals[k] = id;
}

function bindBank() {
  const bankEl = $("#bank"), passage = $("#passage");
  bankEl.onclick = e => {
    const b = e.target.closest(".chip");
    if (!b) return;
    const id = +b.dataset.c;
    if (R.sel?.type === "blank") {
      const k = R.sel.k;
      place(id, k);
      const nk = nextEmpty(k);
      R.sel = nk == null ? null : { type: "blank", k: nk };
    } else if (R.sel?.type === "chip" && R.sel.id === id) R.sel = null;
    else R.sel = { type: "chip", id };
    refreshBank();
  };
  bankEl.ondragstart = e => {
    const b = e.target.closest(".chip");
    if (b) e.dataTransfer.setData("text/plain", "c" + b.dataset.c);
  };
  passage.onclick = e => {
    const s = e.target.closest(".slot[data-k]");
    if (!s) return;
    const k = +s.dataset.k;
    if (R.sel?.type === "chip") { place(R.sel.id, k); R.sel = null; }
    else if (R.vals[k] != null) { R.vals[k] = null; R.sel = null; }
    else R.sel = (R.sel?.type === "blank" && R.sel.k === k) ? null : { type: "blank", k };
    refreshBank();
  };
  passage.ondragover = e => { if (e.target.closest(".slot[data-k]")) e.preventDefault(); };
  passage.ondrop = e => {
    const s = e.target.closest(".slot[data-k]");
    if (!s) return;
    e.preventDefault();
    const d = e.dataTransfer.getData("text/plain");
    if (d.startsWith("c")) { place(+d.slice(1), +s.dataset.k); R.sel = null; refreshBank(); }
  };
}

function refreshBank() {
  const used = new Set(R.vals.filter(v => v != null));
  const left = R.chips.filter(c => !used.has(c.id));
  $("#bank").innerHTML = left.length
    ? left.map(c => `<button class="chip ${R.sel?.type === "chip" && R.sel.id === c.id ? "sel" : ""}" draggable="true" data-c="${c.id}" style="--c:${c.color}">${esc(c.w)}</button>`).join("")
    : `<span class="muted">모든 단어를 넣었습니다.</span>`;
  $$(".slot[data-k]").forEach(s => {
    const k = +s.dataset.k;
    const chip = R.vals[k] != null ? R.chips.find(c => c.id === R.vals[k]) : null;
    s.textContent = chip ? chip.w : "";
    s.classList.toggle("filled", !!chip);
    s.style.setProperty("--c", chip ? chip.color : "transparent");
    s.classList.toggle("sel", R.sel?.type === "blank" && R.sel.k === k);
  });
  saveProgress();
  updateProgress();
}

function updateProgress() {
  const el = $("#progress");
  if (!el) return;
  if (test.mode === "order") { el.textContent = `${R.order.length}문장`; return; }
  const need = test.blanks.length - R.locked.size;
  const filled = R.vals.filter((v, k) => !R.locked.has(k) && v != null && v !== "").length;
  el.textContent = `${filled} / ${need} 채움`;
}

// ---------- 문장 순서 ----------
function setupOrder(saved) {
  R.order = saved?.order || shuffledPerm(test.sentences.length);
  R.sel = null;
  shell(`<p class="muted small center">문장을 올바른 순서로 배열하세요. 문장 두 개를 차례로 누르면 자리가 바뀝니다. 화살표나 끌어다 놓기로도 옮길 수 있습니다.</p><ol class="olist" id="olist"></ol>`);
  const L = $("#olist");
  L.onclick = e => {
    const li = e.target.closest(".ocard");
    if (!li) return;
    const pos = +li.dataset.p;
    const mv = e.target.closest("[data-mv]");
    if (mv) { swap(pos, pos + parseInt(mv.dataset.mv, 10)); R.sel = null; }
    else if (R.sel === null) R.sel = pos;
    else if (R.sel === pos) R.sel = null;
    else { swap(R.sel, pos); R.sel = null; }
    refreshOrder();
  };
  L.ondragstart = e => { const li = e.target.closest(".ocard"); if (li) e.dataTransfer.setData("text/plain", li.dataset.p); };
  L.ondragover = e => { if (e.target.closest(".ocard")) e.preventDefault(); };
  L.ondrop = e => {
    const li = e.target.closest(".ocard");
    if (!li) return;
    e.preventDefault();
    const from = parseInt(e.dataTransfer.getData("text/plain"), 10), to = +li.dataset.p;
    if (isNaN(from) || from === to) return;
    const [x] = R.order.splice(from, 1);
    R.order.splice(to, 0, x);
    R.sel = null;
    refreshOrder();
  };
  refreshOrder();
}
function swap(a, b) {
  if (b < 0 || b >= R.order.length) return;
  [R.order[a], R.order[b]] = [R.order[b], R.order[a]];
}
function refreshOrder() {
  const n = R.order.length;
  $("#olist").innerHTML = R.order.map((si, pos) => `<li class="ocard ${R.sel === pos ? "sel" : ""}" draggable="true" data-p="${pos}">
    <span class="onum">${pos + 1}</span><span class="otext">${esc(test.sentences[si])}</span>
    <span class="obtns"><button class="btn small ghost" data-mv="-1" ${pos === 0 ? "disabled" : ""}>▲</button><button class="btn small ghost" data-mv="1" ${pos === n - 1 ? "disabled" : ""}>▼</button></span></li>`).join("");
  saveProgress();
  updateProgress();
}

// ---------- 타이머, 화면 이탈 ----------
const clock = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
function startTimer() {
  clearInterval(timerId);
  const limit = !R.practice && S.timeLimitMin > 0 ? S.timeLimitMin * 60 : 0;
  let warned = false;
  const tick = () => {
    const el = $("#timer");
    const sec = (Date.now() - R.startedAt) / 1000;
    if (limit) {
      const left = limit - sec;
      if (el) { el.textContent = "남은 시간 " + clock(left); el.classList.toggle("warn", left <= 60); }
      if (left <= 60 && !warned) { warned = true; if (left > 0) toast("1분 남았습니다.", "warn"); }
      if (left <= 0 && !R.submitted) { clearInterval(timerId); toast("시간이 끝나 자동으로 제출합니다.", "warn"); submit(true); }
    } else if (el) el.textContent = clock(sec);
  };
  tick();
  timerId = setInterval(tick, 500);
}
document.addEventListener("visibilitychange", () => {
  if (!R || R.submitted || R.practice || preview) return;
  if (document.hidden) { R.leave++; saveProgress(); }
  else toast(`화면을 벗어난 기록이 남았습니다. (${R.leave}회)`, "warn");
});

// ================= 제출 =================
async function submit(auto) {
  if (!R || R.submitted) return;
  if (!auto) {
    const empty = test.mode === "cloze" ? R.vals.filter((v, k) => !R.locked.has(k) && (v == null || v === "")).length : 0;
    if (!confirm(empty ? `빈칸 ${empty}개가 비어 있습니다. 그래도 제출할까요?` : "제출할까요?")) return;
  }
  R.submitted = true;
  clearInterval(timerId);
  const limit = S.timeLimitMin > 0 && !R.practice ? S.timeLimitMin * 60 : Infinity;
  const timeSec = Math.round(Math.min(limit, (Date.now() - R.startedAt) / 1000) * 10) / 10;
  let answers, correct;
  if (test.mode === "cloze") {
    answers = R.vals.map((v, k) => {
      if (R.locked.has(k)) return tokens[test.blanks[k]];
      if (S.answerMode !== "type") return v != null ? (R.chips.find(c => c.id === v)?.w || "") : "";
      return String(v || "").trim();
    });
    correct = test.blanks.map((b, k) => isCorrect(answers[k], tokens[b], (test.accepted || {})[b], S.caseSensitive));
  } else {
    answers = R.order.slice();
    correct = R.order.map((si, pos) => si === pos);
  }
  const score = correct.filter(Boolean).length, total = correct.length;
  const result = { answers, correct, score, total, timeSec, auto };
  if (R.practice || preview) { showResult(result); return; }

  const btn = $("#submitBtn");
  if (btn) { btn.disabled = true; btn.textContent = "제출 중…"; }
  const p = ctx.profile;
  const data = {
    testId, testTitle: test.title, testCode: test.code, ownerUid: test.ownerUid, mode: test.mode,
    uid: ctx.user.uid, email: ctx.user.email, studentNo: p.studentNo, realName: p.realName, nickname: p.nickname,
    answers, correct, score, total, timeSec, attemptNo: mySubs.length + 1,
    leaveCount: R.leave, autoSubmitted: !!auto, startedAt: new Date(R.startedAt), submittedAt: serverTimestamp()
  };
  try {
    const ref = await addDoc(collection(db, "submissions"), data);
    try {
      await setDoc(doc(db, "board", ref.id), {
        testId, ownerUid: test.ownerUid, uid: ctx.user.uid, nickname: p.nickname, score, total, timeSec, submittedAt: serverTimestamp()
      });
    } catch (e) { console.warn("board", e); }
    mySubs.push(data);
    localStorage.removeItem(SKEY);
    showResult(result);
  } catch (e) {
    console.error(e);
    R.submitted = false;
    if (btn) { btn.disabled = false; btn.textContent = "제출"; }
    toast("제출하지 못했습니다. 인터넷 연결을 확인하세요. (" + (e.code || e.message) + ")", "err");
    if (auto) setTimeout(() => submit(true), 3000);
  }
}

// ================= 결과 =================
function showResult(res) {
  const pct = Math.round((res.score / res.total) * 100);
  const reveal = S.showAnswers || preview;
  const wrongK = res.correct.map((c, k) => (c ? null : k)).filter(k => k !== null);
  const canAgain = !R.practice && !preview && !isClosed() && !isMaxed();
  app.innerHTML = `<div class="container narrow-ish">
    <div class="card center">
      ${R.practice ? `<span class="badge amber">연습 결과 (기록 안 됨)</span>` : preview ? `<span class="badge gray">미리보기 결과</span>` : `<span class="badge green">제출 완료</span>`}
      <div class="score-big">${res.score}<small> / ${res.total}</small></div>
      <div class="muted">${pct}% · ${fmtSec(res.timeSec)}${res.auto ? " · 시간 종료로 자동 제출" : ""}</div>
      <div class="row center wrap mt">
        ${wrongK.length && test.mode === "cloze" ? `<button class="btn primary" id="retryWrong">틀린 문제만 다시 풀기 (연습)</button>` : ""}
        ${wrongK.length && test.mode === "order" ? `<button class="btn primary" id="retryAll">다시 연습하기</button>` : ""}
        ${S.tts !== false && reveal ? `<button class="btn" id="ttsBtn">본문 듣기</button>` : ""}
        ${canAgain ? `<button class="btn" id="again">다시 도전 (기록됨)</button>` : ""}
        <a class="btn ghost" href="index.html">첫 화면</a>
      </div>
    </div>
    <div class="card"><h3>내 답 확인</h3>${reviewHtml(res, reveal)}</div>
    ${S.showBoard && !preview ? `<div class="card"><h3>순위표</h3><div id="board"></div></div>` : ""}
  </div>`;
  const rw = $("#retryWrong");
  if (rw) rw.onclick = () => {
    const locked = new Set(res.correct.map((c, k) => (c ? k : null)).filter(k => k !== null));
    startRun({ practice: true, locked });
  };
  const ra = $("#retryAll");
  if (ra) ra.onclick = () => startRun({ practice: true });
  const ag = $("#again");
  if (ag) ag.onclick = () => startScreen();
  const tb = $("#ttsBtn");
  if (tb) tb.onclick = () => speak(tb);
  if (S.showBoard && !preview) renderBoard($("#board"));
}

function reviewHtml(res, reveal) {
  if (test.mode === "cloze") {
    const bmap = new Map(test.blanks.map((b, k) => [b, k]));
    const html = tokens.map((t, i) => {
      if (!bmap.has(i)) return /\n/.test(t) ? "<br>" : esc(t);
      const k = bmap.get(i);
      const g = res.answers[k];
      if (res.correct[k]) return `<span class="rv ok">${esc(g)}</span>`;
      return `<span class="rv no">${g ? `<s>${esc(g)}</s>` : "(빈칸)"}${reveal ? ` → <b>${esc(t)}</b>` : ""}</span>`;
    }).join("");
    return `<div class="passage review">${html}</div>${reveal ? "" : `<p class="muted small">선생님이 정답 공개를 꺼 두었습니다. 틀린 곳만 표시합니다.</p>`}`;
  }
  const mine = res.answers.map((si, pos) => `<li class="${res.correct[pos] ? "ok" : "no"}">${esc(test.sentences[si])}</li>`).join("");
  const right = reveal ? `<h4>올바른 순서</h4><ol class="rlist">${test.sentences.map(s => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
  return `<h4>내 순서</h4><ol class="rlist">${mine}</ol>${right}`;
}

function speak(btn) {
  if (!("speechSynthesis" in window)) return toast("이 브라우저는 음성 읽기를 지원하지 않습니다.", "err");
  if (speechSynthesis.speaking) { speechSynthesis.cancel(); btn.textContent = "본문 듣기"; return; }
  const text = test.mode === "order" ? test.sentences.join(" ") : test.text;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.9;
  const v = speechSynthesis.getVoices().find(x => /^en[-_]US/i.test(x.lang));
  if (v) u.voice = v;
  u.onend = () => { btn.textContent = "본문 듣기"; };
  speechSynthesis.speak(u);
  btn.textContent = "듣기 멈춤";
}

async function renderBoard(el) {
  if (!el) return;
  el.innerHTML = `<div class="loading">순위표 불러오는 중…</div>`;
  const row = (x, i) => `<tr class="${x.uid === ctx.user.uid ? "me" : ""}"><td>${i + 1}</td><td>${esc(x.nickname)}</td><td class="r">${x.score} / ${x.total}</td><td class="r">${fmtSec(x.timeSec)}</td></tr>`;
  try {
    const s = await getDocs(query(collection(db, "board"), where("testId", "==", testId)));
    const list = rankSort(pickPerStudent(s.docs.map(d => d.data()), "best"));
    if (!list.length) { el.innerHTML = `<p class="muted">아직 기록이 없습니다.</p>`; return; }
    const me = list.findIndex(x => x.uid === ctx.user.uid);
    el.innerHTML = `<table class="tbl"><thead><tr><th>순위</th><th>닉네임</th><th class="r">점수</th><th class="r">시간</th></tr></thead><tbody>
      ${list.slice(0, 10).map(row).join("")}
      ${me >= 10 ? `<tr><td colspan="4" class="muted">…</td></tr>` + row(list[me], me) : ""}
      </tbody></table><p class="muted small">참여 ${list.length}명 · 각자 최고 기록 · 점수가 같으면 빠른 순</p>`;
  } catch (e) {
    console.error(e);
    el.innerHTML = `<p class="muted">순위표를 불러오지 못했습니다.</p>`;
  }
}
