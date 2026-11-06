import { gate, db, $, $$, esc, toast, fmtSec, fmtDate, classOf, pickPerStudent, rankSort, tsNum, copyText, playUrl, MODE_LABEL } from "./common.js";
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, contextOf, norm } from "./core.js";

const ctx = await gate({ teacherOnly: true });
const app = $("#app");
const id = new URLSearchParams(location.search).get("id");
const V = { pick: "best", cls: "__all", name: "real", sort: "no" };
let test = null, tokens = [], subs = [];
const charts = {};

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
tokens = tokenize(test.text);
const isCloze = test.mode !== "order";
const Q = isCloze ? test.blanks.length : test.sentences.length;

app.innerHTML = `
<div class="container wide">
  <div class="card">
    <div class="row between wrap">
      <div>
        <div class="muted small">결과</div>
        <h2 class="m0">${esc(test.title)}</h2>
        <div class="muted small">${MODE_LABEL[test.mode]} · ${Q}${isCloze ? "문항" : "문장"} · 코드 <b class="mono">${esc(test.code)}</b> · ${test.settings?.open === false ? "응시 닫힘" : "응시 가능"}</div>
      </div>
      <div class="row wrap">
        <button class="btn small" id="copy">학생 링크 복사</button>
        <a class="btn small" href="live.html?id=${id}" target="_blank">실시간 순위 화면</a>
        <a class="btn small" href="editor.html?id=${id}">편집</a>
        <button class="btn small primary" id="csv">CSV 내려받기</button>
      </div>
    </div>
    <div class="row wrap filters">
      <label class="inline">보기 <select id="fPick"><option value="best">학생별 최고 점수</option><option value="first">학생별 첫 제출</option><option value="all">모든 제출</option></select></label>
      <label class="inline">반 <select id="fCls"><option value="__all">전체</option></select></label>
      <label class="inline">이름 표시 <select id="fName"><option value="real">실명</option><option value="nick">닉네임</option><option value="both">실명 (닉네임)</option></select></label>
      <span class="muted small" id="liveInfo">불러오는 중…</span>
    </div>
  </div>
  <div class="cards" id="summary"></div>
  <div class="two">
    <div class="card"><h3>${isCloze ? "문항별 정답 / 오답" : "자리별 정답 / 오답"}</h3><div class="chart-box"><canvas id="qChart"></canvas></div></div>
    <div class="card"><h3>점수 분포</h3><div class="chart-box"><canvas id="dChart"></canvas></div></div>
  </div>
  <div class="card"><h3>순위표</h3><div id="rank"></div></div>
  <div class="card">
    <div class="row between wrap"><h3>학생별 결과</h3>
      <label class="inline">정렬 <select id="fSort"><option value="no">학번순</option><option value="score">점수순</option><option value="time">제출 시각순</option></select></label></div>
    <div id="students"></div>
  </div>
  <div class="card"><h3>${isCloze ? "문항별 결과" : "자리별 결과"}</h3><div id="questions"></div></div>
</div>`;

$("#copy").onclick = () => copyText(playUrl(test.code));
$("#csv").onclick = exportCsv;
$("#fPick").onchange = e => { V.pick = e.target.value; renderAll(); };
$("#fCls").onchange = e => { V.cls = e.target.value; renderAll(); };
$("#fName").onchange = e => { V.name = e.target.value; renderAll(); };
$("#fSort").onchange = e => { V.sort = e.target.value; renderStudents(current()); };

onSnapshot(
  query(collection(db, "submissions"), where("ownerUid", "==", ctx.user.uid), where("testId", "==", id)),
  snap => {
    subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    $("#liveInfo").textContent = `전체 제출 ${subs.length}건 · 학생이 제출하면 바로 반영됩니다`;
    updateClassOptions();
    renderAll();
  },
  err => {
    console.error(err);
    $("#liveInfo").textContent = "불러오기 실패: " + (err.code || err.message);
  }
);

function updateClassOptions() {
  const sel = $("#fCls");
  const set = [...new Set(subs.map(s => classOf(s.studentNo)))].sort((a, b) => a.localeCompare(b, "ko", { numeric: true }));
  sel.innerHTML = `<option value="__all">전체</option>` + set.map(c => `<option ${c === V.cls ? "selected" : ""}>${esc(c)}</option>`).join("");
  if (V.cls !== "__all" && !set.includes(V.cls)) V.cls = "__all";
}

function current() {
  let list = subs;
  if (V.cls !== "__all") list = list.filter(s => classOf(s.studentNo) === V.cls);
  return pickPerStudent(list, V.pick);
}
// withNo: 실명 앞에 학번을 붙임 (학번 칸이 바로 옆에 있는 표에서는 false)
function nameOf(s, withNo = true) {
  if (V.name === "nick") return esc(s.nickname || "");
  const real = esc(withNo ? `${s.studentNo || ""} ${s.realName || ""}`.trim() : s.realName || "");
  if (V.name === "both") return `${real} <span class="muted">(${esc(s.nickname || "")})</span>`;
  return real;
}
const isBlank = v => v == null || v === "";

function renderAll() {
  const list = current();
  renderSummary(list);
  renderCharts(list);
  renderRank(list);
  renderStudents(list);
  renderQuestions(list);
}

function renderSummary(list) {
  const n = new Set(list.map(s => s.uid)).size;
  const card = (label, val, sub = "") => `<div class="card metric"><div class="mlabel">${label}</div><div class="mval">${val}</div><div class="msub muted small">${sub}</div></div>`;
  if (!list.length) {
    $("#summary").innerHTML = card("학생 수", 0, "아직 제출이 없습니다");
    return;
  }
  const avg = list.reduce((a, s) => a + s.score, 0) / list.length;
  const max = Math.max(...list.map(s => s.score));
  const nMax = list.filter(s => s.score === max).length;
  const fastest = list.slice().sort((a, b) => (a.timeSec ?? 1e9) - (b.timeSec ?? 1e9))[0];
  const avgT = list.reduce((a, s) => a + (s.timeSec || 0), 0) / list.length;
  const leave = list.filter(s => (s.leaveCount || 0) > 0).length;
  $("#summary").innerHTML =
    card("학생 수", n, V.pick === "all" ? `제출 ${list.length}건` : "") +
    card("평균 점수", `${avg.toFixed(1)} <small>/ ${Q}</small>`, `${Math.round((avg / Q) * 100)}%`) +
    card("최고 점수", `${max} <small>/ ${Q}</small>`, `${nMax}명`) +
    card("가장 빠름", fmtSec(fastest.timeSec), nameOf(fastest)) +
    card("평균 시간", fmtSec(avgT), "") +
    card("화면 이탈", `${leave}<small>명</small>`, "응시 중 다른 앱·탭으로 이동");
}

function renderCharts(list) {
  if (typeof Chart === "undefined") return;
  const labels = [...Array(Q).keys()].map(i => (isCloze ? "Q" : "") + (i + 1));
  const ok = Array(Q).fill(0), no = Array(Q).fill(0), blank = Array(Q).fill(0);
  list.forEach(s => {
    for (let k = 0; k < Q; k++) {
      if (s.correct?.[k]) ok[k]++;
      else if (isCloze && isBlank(s.answers?.[k])) blank[k]++;
      else no[k]++;
    }
  });
  const dist = Array(Q + 1).fill(0);
  list.forEach(s => { if (s.score >= 0 && s.score <= Q) dist[s.score]++; });
  const grid = { color: "#e5e7eb" };
  const qData = {
    labels,
    datasets: [
      { label: "정답", data: ok, backgroundColor: "#2563eb" },
      { label: "오답", data: no, backgroundColor: "#9ca3af" },
      ...(isCloze ? [{ label: "무응답", data: blank, backgroundColor: "#e5e7eb" }] : [])
    ]
  };
  const dData = { labels: dist.map((_, i) => String(i)), datasets: [{ label: "학생 수", data: dist, backgroundColor: "#2563eb" }] };
  if (charts.q) { charts.q.data = qData; charts.q.update(); }
  else charts.q = new Chart($("#qChart"), {
    type: "bar", data: qData,
    options: {
      maintainAspectRatio: false,
      scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid } },
      plugins: { legend: { position: "bottom" } }
    }
  });
  if (charts.d) { charts.d.data = dData; charts.d.update(); }
  else charts.d = new Chart($("#dChart"), {
    type: "bar", data: dData,
    options: {
      maintainAspectRatio: false,
      scales: { x: { title: { display: true, text: "점수" }, grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: "학생 수" }, grid } },
      plugins: { legend: { display: false } }
    }
  });
}

function renderRank(list) {
  const r = rankSort(pickPerStudent(list, "best")).slice(0, 10);
  if (!r.length) { $("#rank").innerHTML = `<p class="muted">아직 제출이 없습니다.</p>`; return; }
  $("#rank").innerHTML = `<table class="tbl"><thead><tr><th>순위</th><th>학번</th><th>이름</th><th class="r">점수</th><th class="r">시간</th></tr></thead><tbody>
    ${r.map((s, i) => `<tr><td>${i + 1}</td><td>${esc(s.studentNo || "")}</td><td>${nameOf(s, false)}</td><td class="r">${s.score}</td><td class="r">${fmtSec(s.timeSec)}</td></tr>`).join("")}
  </tbody></table>`;
}

function renderStudents(list) {
  const el = $("#students");
  if (!list.length) { el.innerHTML = `<p class="muted">아직 제출이 없습니다.</p>`; return; }
  const L = list.slice();
  if (V.sort === "score") rankSort(L);
  else if (V.sort === "time") L.sort((a, b) => tsNum(a.submittedAt) - tsNum(b.submittedAt));
  else L.sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo)) || tsNum(a.submittedAt) - tsNum(b.submittedAt));
  el.innerHTML = `<table class="tbl"><thead><tr><th>학번</th><th>이름</th><th>제출 시각</th><th class="r">점수</th><th class="r">틀림</th><th class="r">시간</th><th class="r">화면 이탈</th><th class="r">회차</th><th></th></tr></thead><tbody>
    ${L.map(s => `<tr class="srow" data-id="${s.id}">
      <td>${esc(s.studentNo || "")}</td><td>${nameOf(s, false)}</td><td>${fmtDate(s.submittedAt)}${s.autoSubmitted ? ` <span class="badge amber">자동 제출</span>` : ""}</td>
      <td class="r"><b>${s.score}</b> / ${s.total}</td><td class="r">${s.total - s.score}</td><td class="r">${fmtSec(s.timeSec)}</td>
      <td class="r ${(s.leaveCount || 0) > 0 ? "warn-text" : ""}">${s.leaveCount || 0}</td><td class="r">${s.attemptNo || 1}</td>
      <td class="nowrap"><button class="btn small ghost" data-open="${s.id}">답 보기</button><button class="btn small ghost danger" data-del="${s.id}">삭제</button></td></tr>
      <tr class="detail hidden" id="d-${s.id}"><td colspan="9">${detailHtml(s)}</td></tr>`).join("")}
  </tbody></table>`;
  $$("[data-open]", el).forEach(b => { b.onclick = () => $("#d-" + b.dataset.open).classList.toggle("hidden"); });
  $$("[data-del]", el).forEach(b => { b.onclick = () => delSub(b.dataset.del); });
}

function detailHtml(s) {
  if (isCloze) {
    return `<div class="ans-grid">${test.blanks.map((b, k) => {
      const g = s.answers?.[k];
      return `<div class="ans ${s.correct?.[k] ? "ok" : "no"}"><b>${k + 1}.</b> ${isBlank(g) ? "<i>(빈칸)</i>" : esc(g)}${s.correct?.[k] ? "" : ` <span class="muted">→ ${esc(tokens[b])}</span>`}</div>`;
    }).join("")}</div>`;
  }
  return `<ol class="rlist">${(s.answers || []).map((si, pos) => `<li class="${s.correct?.[pos] ? "ok" : "no"}">${esc(test.sentences[si] || "")}</li>`).join("")}</ol>`;
}

async function delSub(sid) {
  const s = subs.find(x => x.id === sid);
  if (!s || !confirm(`${s.studentNo || ""} ${s.realName} 학생의 제출 기록(${s.score}점)을 삭제할까요?`)) return;
  try {
    await deleteDoc(doc(db, "submissions", sid));
    try { await deleteDoc(doc(db, "board", sid)); } catch (e) { console.warn(e); }
    toast("삭제했습니다.");
  } catch (e) { toast("삭제 실패: " + (e.code || e.message), "err"); }
}

function renderQuestions(list) {
  const el = $("#questions");
  const rows = [];
  for (let k = 0; k < Q; k++) {
    let ok = 0, no = 0;
    const wrong = new Map();
    list.forEach(s => {
      if (s.correct?.[k]) { ok++; return; }
      no++;
      const g = s.answers?.[k];
      const key = isCloze ? (isBlank(g) ? "(빈칸)" : norm(g)) : String(g);
      wrong.set(key, (wrong.get(key) || 0) + 1);
    });
    const tot = ok + no;
    const rate = tot ? Math.round((ok / tot) * 100) : 0;
    const top = [...wrong.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([w, c]) => `${isCloze ? esc(w) : (w === "undefined" ? "-" : (parseInt(w, 10) + 1) + "번 문장")} <span class="muted">(${c})</span>`).join(", ");
    rows.push(`<tr class="${tot && rate < 50 ? "low" : ""}">
      <td>${k + 1}</td>
      <td class="small">${isCloze ? esc(contextOf(tokens, test.blanks[k])) : esc(test.sentences[k])}</td>
      ${isCloze ? `<td><b>${esc(tokens[test.blanks[k]])}</b></td>` : ""}
      <td class="r">${ok}</td><td class="r">${no}</td>
      <td><div class="rate"><div class="rate-bar" style="width:${rate}%"></div><span>${tot ? rate + "%" : "-"}</span></div></td>
      <td class="small">${top || "-"}</td></tr>`);
  }
  el.innerHTML = `<table class="tbl"><thead><tr><th>#</th><th>${isCloze ? "문맥" : "이 자리의 올바른 문장"}</th>${isCloze ? "<th>정답</th>" : ""}<th class="r">맞음</th><th class="r">틀림</th><th>정답률</th><th>${isCloze ? "자주 나온 오답" : "이 자리에 잘못 놓은 문장"}</th></tr></thead><tbody>${rows.join("")}</tbody></table>
    <p class="muted small">정답률 50% 미만 문항은 색으로 표시됩니다.</p>`;
}

function exportCsv() {
  const list = current().slice().sort((a, b) => String(a.studentNo).localeCompare(String(b.studentNo)));
  const head = ["학번", "반", "이름", "닉네임", "이메일", "제출 시각", "회차", "점수", "만점", "시간(초)", "화면 이탈", "자동 제출"];
  for (let k = 0; k < Q; k++) head.push(isCloze ? `Q${k + 1} (${tokens[test.blanks[k]]})` : `${k + 1}번째 자리`);
  const rows = list.map(s => {
    const r = [s.studentNo, classOf(s.studentNo), s.realName, s.nickname, s.email, fmtDate(s.submittedAt), s.attemptNo || 1, s.score, s.total, s.timeSec, s.leaveCount || 0, s.autoSubmitted ? "예" : ""];
    for (let k = 0; k < Q; k++) {
      const g = s.answers?.[k];
      const shown = isCloze ? (isBlank(g) ? "" : g) : (g == null ? "" : (g + 1) + "번 문장");
      r.push(`${s.correct?.[k] ? "O" : "X"} ${shown}`.trim());
    }
    return r;
  });
  const q = v => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = "\ufeff" + [head, ...rows].map(r => r.map(q).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `${test.title.replace(/[\\/:*?"<>|]/g, "_")}_결과.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
