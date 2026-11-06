import { gate, db, $, esc, fmtSec, classOf, pickPerStudent, rankSort, tsNum, playUrl } from "./common.js";
import { collection, query, where, onSnapshot, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ctx = await gate({ teacherOnly: true, noHeader: true });
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
document.body.classList.add("live-body");
const SINCE_KEY = "live-since:" + id;
const V = { name: "nick", cls: "__all", top: 10, since: parseInt(localStorage.getItem(SINCE_KEY) || "0", 10) };
const url = playUrl(test.code);
let subs = [];
let prev = new Map();

app.innerHTML = `
<div class="live">
  <div class="live-top">
    <div>
      <div class="live-title">${esc(test.title)}</div>
      <div class="live-sub"><b id="cnt">0</b>명 제출 <span id="roundInfo" class="muted"></span></div>
    </div>
    <div class="live-ctrl">
      <select id="lName"><option value="nick">닉네임</option><option value="real">실명</option></select>
      <select id="lCls"><option value="__all">전체 반</option></select>
      <select id="lTop"><option value="10">상위 10명</option><option value="20">상위 20명</option><option value="999">전체</option></select>
      <button class="btn small" id="lRound">새 라운드 시작</button>
      <button class="btn small" id="lJoin">참여 안내 숨기기</button>
      <button class="btn small" id="lBig">코드·QR 크게 보기</button>
      <button class="btn small" id="lFull">전체 화면</button>
    </div>
  </div>
  <div class="live-main">
    <div class="live-join" id="joinPane">
      <div class="muted">참여 코드</div>
      <div class="live-code">${esc(test.code)}</div>
      <div id="qr"></div>
      <div class="live-url">${esc(url)}</div>
      <div class="muted small">학교 계정으로 로그인 → 코드 입력</div>
    </div>
    <div class="live-board" id="board"></div>
  </div>
</div>`;

if (window.QRCode) {
  try { new QRCode($("#qr"), { text: url, width: 640, height: 640 }); } catch (e) { console.warn(e); }
}
$("#lName").onchange = e => { V.name = e.target.value; render(); };
$("#lCls").onchange = e => { V.cls = e.target.value; render(); };
$("#lTop").onchange = e => { V.top = parseInt(e.target.value, 10); render(); };
$("#lRound").onclick = () => {
  if (V.since) {
    if (confirm("라운드를 끝내고 전체 기록을 볼까요? (취소를 누르면 지금부터 새 라운드를 시작합니다)")) V.since = 0;
    else V.since = Date.now();
  } else V.since = Date.now();
  localStorage.setItem(SINCE_KEY, String(V.since));
  prev = new Map();
  render();
};
$("#lJoin").onclick = e => {
  const p = $("#joinPane");
  p.classList.toggle("hidden");
  e.target.textContent = p.classList.contains("hidden") ? "참여 안내 보이기" : "참여 안내 숨기기";
};
$("#lBig").onclick = e => {
  const on = document.body.classList.toggle("live-bigqr");
  e.target.textContent = on ? "순위 보기" : "코드·QR 크게 보기";
  $("#lJoin").disabled = on;
};
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && document.body.classList.contains("live-bigqr")) $("#lBig").click();
});
$("#lFull").onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(() => {});
};

onSnapshot(
  query(collection(db, "submissions"), where("ownerUid", "==", ctx.user.uid), where("testId", "==", id)),
  snap => {
    subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const sel = $("#lCls");
    const set = [...new Set(subs.map(s => classOf(s.studentNo)))].sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
    sel.innerHTML = `<option value="__all">전체 반</option>` + set.map(c => `<option ${c === V.cls ? "selected" : ""}>${esc(c)}</option>`).join("");
    render();
  },
  err => { $("#board").innerHTML = `<p class="alert err">불러오기 실패: ${esc(err.code || err.message)}</p>`; }
);

function render() {
  let list = subs;
  if (V.since) list = list.filter(s => tsNum(s.submittedAt) >= V.since);
  if (V.cls !== "__all") list = list.filter(s => classOf(s.studentNo) === V.cls);
  const ranked = rankSort(pickPerStudent(list, "best"));
  $("#cnt").textContent = ranked.length;
  $("#roundInfo").textContent = V.since ? ` · ${new Date(V.since).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}부터 새 라운드` : "";
  if (!ranked.length) {
    $("#board").innerHTML = `<div class="live-empty">제출을 기다리는 중…</div>`;
    return;
  }
  const next = new Map();
  const rows = ranked.slice(0, V.top).map((s, i) => {
    const key = s.score + "|" + s.timeSec;
    next.set(s.uid, key);
    const isNew = prev.size > 0 && prev.get(s.uid) !== key;
    const nm = V.name === "real" ? esc(`${s.studentNo || ""} ${s.realName || ""}`.trim()) : esc(s.nickname || "");
    const pct = s.total ? Math.round((s.score / s.total) * 100) : 0;
    return `<div class="lrow ${i < 3 ? "top" + (i + 1) : ""} ${isNew ? "flash" : ""}">
      <div class="lrank">${i + 1}</div>
      <div class="lname">${nm}</div>
      <div class="lbar"><div style="width:${pct}%"></div></div>
      <div class="lscore">${s.score}<small>/${s.total}</small></div>
      <div class="ltime">${fmtSec(s.timeSec)}</div></div>`;
  });
  ranked.slice(V.top).forEach(s => next.set(s.uid, s.score + "|" + s.timeSec));
  prev = next.size ? next : prev;
  if (prev.size === 0) prev = new Map([["__init", ""]]);
  $("#board").innerHTML = rows.join("") + (ranked.length > V.top ? `<div class="muted center">외 ${ranked.length - V.top}명</div>` : "");
}
