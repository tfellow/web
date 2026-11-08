// 정답보기 (교사, 전자칠판용) — 빈칸을 그대로 보여 주고, 전체/개별/순서대로 정답 공개
import { gate, db, $, $$, esc, modeBadge } from "./common.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, shuffledPerm, shuffle, wordPrimary } from "./core.js";

const ctx = await gate({ teacherOnly: true });
const app = $("#app");
const id = new URLSearchParams(location.search).get("id");
let test = null;
try {
  if (id) {
    const s = await getDoc(doc(db, "tests", id));
    if (s.exists() && s.data().ownerUid === ctx.user.uid) test = s.data();
  }
} catch (e) { console.error(e); }
if (!test) {
  app.innerHTML = `<div class="card narrow"><h2>테스트를 찾을 수 없습니다</h2><a class="btn" href="index.html">첫 화면</a></div>`;
  throw new Error("not found");
}

const FS_KEY = "answers-font";
const FONT_MIN = 16, FONT_MAX = 48;
let font = 26;
try { font = parseInt(localStorage.getItem(FS_KEY), 10) || 26; } catch {}

const isOrder = test.mode === "order";
const tokens = isOrder ? [] : tokenize(test.text);
const blanks = test.mode === "cloze" || !test.mode ? (test.blanks || []) : [];
const WORDS = isOrder ? [] : (test.words || []);
const NB = blanks.length;
const wShuf = WORDS.map(w => shuffle(w.chunks || [])); // 섞인 단어 (화면용)
const n = isOrder ? test.sentences.length : NB + WORDS.length;
const perm = isOrder ? shuffledPerm(n) : []; // 화면에 보이는 섞인 순서 (A, B, C …)
const letter = pos => "(" + String.fromCharCode(65 + pos) + ")";
const shown = new Array(n).fill(false);
let current = -1;

app.innerHTML = `
<div class="ans-wrap">
  <div class="ans-top">
    <div class="ptitle">${esc(test.title)} ${modeBadge(test)}</div>
    <div id="aProg"></div>
    <div class="row wrap">
      <button class="btn" id="aPrev" title="← 키">◀ 이전</button>
      <button class="btn primary" id="aNext" title="→ 키 또는 스페이스바">다음 ▶</button>
      <button class="btn" id="aAll">정답 모두 보기</button>
      <button class="btn" id="aReset">처음부터</button>
      <button class="btn" id="aSmaller" title="글자 작게">가-</button>
      <button class="btn" id="aBigger" title="글자 크게">가+</button>
      <button class="btn" id="aFull">전체 화면</button>
    </div>
  </div>
  <p class="muted small ans-help">빈칸을 누르면 그 칸의 정답이 보이고, 다시 누르면 숨겨집니다. → 키·스페이스바는 1번부터 차례로 정답을 보여 주고, ← 키는 마지막에 보인 정답을 다시 숨깁니다.</p>
  <div id="aBody"></div>
</div>`;

function draw() {
  if (isOrder) {
    $("#aBody").innerHTML = `
      <div class="ans-passage" id="aPassage">
        <h3 class="m0">섞인 문장</h3>
        <ol class="ans-shuffled">${perm.map((si, pos) => `<li><b>${letter(pos)}</b> ${esc(test.sentences[si])}</li>`).join("")}</ol>
        <h3>올바른 순서</h3>
        <ol class="ans-order">${test.sentences.map((s, k) => `<li class="aslot-row" data-row="${k}"><span class="aslot" data-k="${k}" data-n="${k + 1}"></span><span class="ans-sent"></span></li>`).join("")}</ol>
      </div>`;
    $$("#aBody .aslot-row").forEach(el => { el.onclick = () => toggle(+el.dataset.row); });
  } else {
    const bmap = new Map(blanks.map((b, k) => [b, k]));
    const wHtml = WORDS.length ? `${NB ? `<h3 class="ans-wh">어순 배열</h3>` : ""}<ol class="ans-order">${WORDS.map((w, j) => `<li class="ans-wrow" data-row="${NB + j}">
        <div class="ans-wq"><b>${NB + j + 1}.</b> ${wShuf[j].map(c => `<span class="ans-wchip">${esc(c)}</span>`).join("")}</div>
        <div><span class="aslot wide" data-k="${NB + j}" data-n="${NB + j + 1}"></span>${(w.alts || []).length ? `<div class="ans-walt small"></div>` : ""}</div></li>`).join("")}</ol>` : "";
    $("#aBody").innerHTML = `<div class="ans-passage" id="aPassage">${!NB ? wHtml : tokens.map((t, i) => {
      if (/\n/.test(t)) return "<br>".repeat(Math.min(2, (t.match(/\n/g) || []).length));
      if (!bmap.has(i)) return esc(t);
      const k = bmap.get(i);
      const alt = (test.accepted?.[i] || []).join(", ");
      return `<span class="aslot" data-k="${k}" data-n="${k + 1}" style="min-width:${t.length + 2}ch"${alt ? ` title="다른 정답: ${esc(alt)}"` : ""}></span>`;
    }).join("") + wHtml}</div>`;
    $$("#aBody .aslot").forEach(el => { el.onclick = () => toggle(+el.dataset.k); });
  }
  $("#aPassage").style.fontSize = font + "px";
  refresh();
}

const wordAns = j => wordPrimary(WORDS[j]) + (WORDS[j].end || "");
const answerOf = k => (isOrder ? letter(perm.indexOf(k)) : k >= NB ? wordAns(k - NB) : tokens[blanks[k]]);

function refresh() {
  for (let k = 0; k < n; k++) {
    const el = $(`#aBody .aslot[data-k="${k}"]`);
    el.textContent = shown[k] ? answerOf(k) : "";
    el.classList.toggle("on", shown[k]);
    el.classList.toggle("cur", k === current);
    if (isOrder) el.parentElement.querySelector(".ans-sent").textContent = shown[k] ? test.sentences[k] : "";
    if (k >= NB && !isOrder) {
      const alt = el.parentElement.querySelector(".ans-walt"), w = WORDS[k - NB];
      if (alt) alt.textContent = shown[k] ? "다른 정답: " + w.alts.map(a => a + (w.end || "")).join(" / ") : "";
    }
  }
  const cnt = shown.filter(Boolean).length;
  $("#aProg").textContent = `${cnt} / ${n}`;
  $("#aAll").textContent = cnt === n ? "정답 모두 숨기기" : "정답 모두 보기";
  $("#aPrev").disabled = cnt === 0;
  $("#aNext").disabled = cnt === n;
}

function focusOn(k) {
  current = k;
  refresh();
  const el = $(`#aBody .aslot[data-k="${k}"]`);
  if (el) el.scrollIntoView({ block: "center", behavior: "smooth" });
}
function toggle(k) {
  shown[k] = !shown[k];
  if (shown[k]) focusOn(k);
  else { if (current === k) current = -1; refresh(); }
}
// 아직 안 보인 칸 중 가장 앞 번호부터 공개
function next() {
  const k = shown.indexOf(false);
  if (k < 0) return;
  shown[k] = true;
  focusOn(k);
}
// 보인 칸 중 가장 뒤 번호를 다시 숨김
function prev() {
  const k = shown.lastIndexOf(true);
  if (k < 0) return;
  shown[k] = false;
  const last = shown.lastIndexOf(true);
  if (last >= 0) focusOn(last); else { current = -1; refresh(); }
}
function setAll(v) { shown.fill(v); current = -1; refresh(); }
function setFont(d) {
  font = Math.min(FONT_MAX, Math.max(FONT_MIN, font + d));
  $("#aPassage").style.fontSize = font + "px";
  try { localStorage.setItem(FS_KEY, String(font)); } catch {}
}

// 버튼을 누른 뒤 포커스를 풀어 스페이스바가 버튼을 다시 누르지 않게 함
const btn = (sel, fn) => { $(sel).onclick = e => { fn(); e.currentTarget.blur(); }; };
btn("#aNext", next);
btn("#aPrev", prev);
btn("#aAll", () => setAll(shown.some(v => !v)));
btn("#aReset", () => { setAll(false); window.scrollTo({ top: 0, behavior: "smooth" }); });
btn("#aSmaller", () => setFont(-2));
btn("#aBigger", () => setFont(2));
btn("#aFull", () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
});

document.addEventListener("keydown", e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
  if (["ArrowRight", "ArrowDown", " ", "Spacebar", "Enter", "PageDown"].includes(e.key)) { e.preventDefault(); next(); }
  else if (["ArrowLeft", "ArrowUp", "Backspace", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
});

draw();
