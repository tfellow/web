import { gate, db, $, $$, esc, toast, fmtSec, fmtDate, classOf, pickPerStudent, rankSort, tsNum, copyText, playUrl, modeBadge } from "./common.js";
import { collection, query, where, onSnapshot, doc, getDoc, deleteDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize, contextOf, norm, wordKey, isWordCorrect, fitsChunks, wordPrimary, wordStartOf, splitChunks } from "./core.js";

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
const BL = test.mode === "cloze" || !test.mode ? (test.blanks || []) : [];
const NB = BL.length;
let WORDS = isCloze ? (test.words || []) : [];
const Q = isCloze ? NB + WORDS.length : test.sentences.length;
const ignorePunct = () => test.settings?.wordIgnorePunct !== false;
// k번 문항의 답·정답 여부 (어순 배열은 제출 기록마다 시작 자리가 저장되어 있음)
function at(s, k) {
  if (!isCloze || k < NB) return { a: s.answers?.[k], ok: !!s.correct?.[k] };
  const ws = wordStartOf(s);
  if (ws == null) return { a: undefined, ok: false, none: true };
  return { a: s.answers?.[ws + k - NB], ok: !!s.correct?.[ws + k - NB] };
}
const wordText = (it, a) => (isBlank(a) ? "" : a + (it.end || ""));

app.innerHTML = `
<div class="container wide">
  <div class="card">
    <div class="row between wrap">
      <div>
        <div class="muted small">결과</div>
        <h2 class="m0">${esc(test.title)}</h2>
        <div class="muted small">${modeBadge(test)} · ${Q}${isCloze ? "문항" : "문장"} · 코드 <b class="mono">${esc(test.code)}</b> · ${test.settings?.open === false ? "응시 닫힘" : "응시 가능"}</div>
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
  ${WORDS.length ? `<div class="card" id="wordCard">
    <div class="row between wrap"><h3>어순 배열 — 등록되지 않은 답</h3><button class="btn small" id="regrade">어순 배열 다시 채점</button></div>
    <p class="muted small">학생이 단어를 모두 써서 만든 답 가운데 정답 목록에 없는 답입니다. 맞는 문장이면 <b>정답으로 인정</b>을 누르세요. 다른 정답으로 저장되고, 이미 제출한 학생의 점수도 바로 다시 매겨집니다. (실시간 순위 화면에도 반영)</p>
    <div id="wordReview"></div></div>` : ""}
</div>`;

$("#copy").onclick = () => copyText(playUrl(test.code));
$("#csv").onclick = exportCsv;
$("#fPick").onchange = e => { V.pick = e.target.value; renderAll(); };
$("#fCls").onchange = e => { V.cls = e.target.value; renderAll(); };
$("#fName").onchange = e => { V.name = e.target.value; renderAll(); };
$("#fSort").onchange = e => { V.sort = e.target.value; renderStudents(current()); };
if (WORDS.length) {
  $("#regrade").onclick = () => regrade(true);
  $("#wordReview").onclick = e => {
    const acc = e.target.closest("[data-accept]"), un = e.target.closest("[data-unalt]");
    if (acc) acceptAnswer(+acc.dataset.w, acc.dataset.accept);
    if (un) removeAlt(+un.dataset.w, +un.dataset.unalt);
  };
}

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
  renderWordReview();
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
      const x = at(s, k);
      if (x.none) continue;
      if (x.ok) ok[k]++;
      else if (isCloze && isBlank(x.a)) blank[k]++;
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
    const ws = wordStartOf(s);
    const wHtml = WORDS.length && ws != null ? `<div class="ans-list">${WORDS.map((it, j) => {
      const x = at(s, NB + j);
      return `<div class="ans ${x.ok ? "ok" : "no"}"><b>${NB + j + 1}.</b> ${isBlank(x.a) ? "<i>(빈칸)</i>" : esc(wordText(it, x.a))}${x.ok ? "" : ` <span class="muted">→ ${esc(wordPrimary(it) + (it.end || ""))}</span>`}</div>`;
    }).join("")}</div>` : "";
    return `${NB ? `<div class="ans-grid">${BL.map((b, k) => {
      const g = s.answers?.[k];
      return `<div class="ans ${s.correct?.[k] ? "ok" : "no"}"><b>${k + 1}.</b> ${isBlank(g) ? "<i>(빈칸)</i>" : esc(g)}${s.correct?.[k] ? "" : ` <span class="muted">→ ${esc(tokens[b])}</span>`}</div>`;
    }).join("")}</div>` : ""}${wHtml}`;
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
    const isW = isCloze && k >= NB, it = isW ? WORDS[k - NB] : null;
    list.forEach(s => {
      const x = at(s, k);
      if (x.none) return;
      if (x.ok) { ok++; return; }
      no++;
      const g = x.a;
      const key = isW ? (isBlank(g) ? "(빈칸)" : wordText(it, g)) : isCloze ? (isBlank(g) ? "(빈칸)" : norm(g)) : String(g);
      wrong.set(key, (wrong.get(key) || 0) + 1);
    });
    const tot = ok + no;
    const rate = tot ? Math.round((ok / tot) * 100) : 0;
    const top = [...wrong.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
      .map(([w, c]) => `${isCloze ? esc(w) : (w === "undefined" ? "-" : (parseInt(w, 10) + 1) + "번 문장")} <span class="muted">(${c})</span>`).join(", ");
    rows.push(`<tr class="${tot && rate < 50 ? "low" : ""}">
      <td>${k + 1}</td>
      <td class="small">${isW ? `<span class="badge teal">어순</span> ${esc((it.chunks || []).join(" / "))}` : isCloze ? esc(contextOf(tokens, BL[k])) : esc(test.sentences[k])}</td>
      ${isCloze ? `<td>${isW ? `<b>${esc(wordPrimary(it) + (it.end || ""))}</b>${(it.alts || []).length ? ` <span class="muted small">외 ${it.alts.length}개</span>` : ""}` : `<b>${esc(tokens[BL[k]])}</b>`}</td>` : ""}
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
  for (let k = 0; k < Q; k++) head.push(!isCloze ? `${k + 1}번째 자리` : k < NB ? `Q${k + 1} (${tokens[BL[k]]})` : `Q${k + 1} (어순)`);
  const rows = list.map(s => {
    const r = [s.studentNo, classOf(s.studentNo), s.realName, s.nickname, s.email, fmtDate(s.submittedAt), s.attemptNo || 1, s.score, s.total, s.timeSec, s.leaveCount || 0, s.autoSubmitted ? "예" : ""];
    for (let k = 0; k < Q; k++) {
      const x = at(s, k);
      if (x.none) { r.push(""); continue; }
      const g = x.a;
      const shown = isCloze ? (isBlank(g) ? "" : k >= NB ? wordText(WORDS[k - NB], g) : g) : (g == null ? "" : (g + 1) + "번 문장");
      r.push(`${x.ok ? "O" : "X"} ${shown}`.trim());
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

// ---------- 어순 배열: 등록되지 않은 답 → 정답 인정 → 다시 채점 ----------
function renderWordReview() {
  const el = $("#wordReview");
  if (!el) return;
  const ip = ignorePunct();
  el.innerHTML = WORDS.map((it, j) => {
    const k = NB + j;
    const groups = new Map();
    let partial = 0;
    subs.forEach(s => {
      const x = at(s, k);
      if (x.none || x.ok || isBlank(x.a)) return;
      if (!fitsChunks(x.a, it.chunks)) { partial++; return; }
      const key = wordKey(x.a, ip);
      const g = groups.get(key) || { text: x.a, n: 0, names: [] };
      g.n++;
      g.names.push(s.realName || s.nickname || "");
      groups.set(key, g);
    });
    const list = [...groups.values()].sort((a, b) => b.n - a.n);
    return `<div class="wrev">
      <div class="wrev-head"><b>${k + 1}.</b> ${esc(wordPrimary(it) + (it.end || ""))}</div>
      ${(it.alts || []).length ? `<div class="small">${it.alts.map((a, i) => `<span class="alt-tag">${esc(a + (it.end || ""))} <button class="btn small ghost danger" data-w="${j}" data-unalt="${i}" title="이 답을 다시 오답으로">인정 취소</button></span>`).join(" ")}</div>` : ""}
      ${list.length ? `<table class="tbl"><tbody>${list.map(g => `<tr><td>${esc(wordText(it, g.text))}</td><td class="r nowrap">${g.n}건</td><td class="small muted">${esc(g.names.slice(0, 4).join(", "))}${g.names.length > 4 ? " …" : ""}</td>
        <td class="r"><button class="btn small primary" data-w="${j}" data-accept="${esc(g.text)}">정답으로 인정</button></td></tr>`).join("")}</tbody></table>`
        : `<p class="muted small">등록되지 않은 완성 답이 없습니다.</p>`}
      ${partial ? `<p class="muted small">단어를 다 쓰지 않았거나 빠뜨린 답 ${partial}건은 제외했습니다.</p>` : ""}
    </div>`;
  }).join("");
}

async function saveWords(words) {
  await updateDoc(doc(db, "tests", id), { words, updatedAt: serverTimestamp() });
  test.words = words;
  WORDS = words;
}
async function acceptAnswer(j, text) {
  const it = WORDS[j];
  const v = splitChunks(text).chunks.join(" ");
  if (!confirm(`"${v}${it.end || ""}" 을(를) ${NB + j + 1}번의 정답으로 인정할까요?\n이미 제출한 학생의 점수도 다시 매깁니다.`)) return;
  const words = WORDS.map(w => ({ ...w, alts: [...(w.alts || [])] }));
  words[j].alts.push(v);
  try {
    await saveWords(words);
    await regrade(false);
  } catch (e) { console.error(e); toast("저장 실패: " + (e.code || e.message), "err"); }
}
async function removeAlt(j, i) {
  const it = WORDS[j];
  if (!confirm(`"${it.alts[i]}${it.end || ""}" 을(를) 정답 목록에서 뺄까요?\n이 답을 낸 학생은 오답으로 다시 채점됩니다.`)) return;
  const words = WORDS.map(w => ({ ...w, alts: [...(w.alts || [])] }));
  words[j].alts.splice(i, 1);
  try {
    await saveWords(words);
    await regrade(false);
  } catch (e) { console.error(e); toast("저장 실패: " + (e.code || e.message), "err"); }
}
// 지금의 정답 목록·채점 설정으로 모든 제출 기록의 어순 배열 문항을 다시 채점
async function regrade(ask) {
  if (ask && !confirm("지금 정답 목록과 채점 설정으로 어순 배열 문항을 모두 다시 채점할까요?")) return;
  const ip = ignorePunct();
  const jobs = [];
  for (const s of subs) {
    const ws = wordStartOf(s);
    if (ws == null || !Array.isArray(s.correct)) continue;
    const correct = s.correct.slice();
    let changed = false;
    WORDS.forEach((it, j) => {
      const a = s.answers?.[ws + j];
      if (a == null || ws + j >= correct.length) return;
      const c = isWordCorrect(a, it, ip);
      if (c !== !!correct[ws + j]) { correct[ws + j] = c; changed = true; }
    });
    if (!changed) continue;
    const score = correct.filter(Boolean).length;
    jobs.push((async () => {
      await updateDoc(doc(db, "submissions", s.id), { correct, score, regradedAt: serverTimestamp() });
      try { await updateDoc(doc(db, "board", s.id), { score }); } catch (e) { console.warn("board", e); }
    })());
  }
  const r = await Promise.allSettled(jobs);
  const fail = r.filter(x => x.status === "rejected");
  if (fail.length) {
    console.error(fail);
    toast(`${fail.length}건을 다시 채점하지 못했습니다. Firebase 보안 규칙을 새로 게시했는지 확인하세요.`, "err");
  } else toast(jobs.length ? `제출 ${jobs.length}건의 점수를 다시 매겼습니다.` : "점수가 바뀐 제출이 없습니다.");
  renderAll();
}
