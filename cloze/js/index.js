import { gate, db, $, $$, esc, toast, fmtDate, fmtSec, copyText, playUrl, uniqueCode, MODE_LABEL, tsNum, editProfileModal } from "./common.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize } from "./core.js";

const ctx = await gate({ needProfile: true });
const app = $("#app");

// ================= 학생 =================
async function studentHome() {
  const p = ctx.profile;
  const preset = new URLSearchParams(location.search).get("code") || "";
  app.innerHTML = `
  <div class="container">
    <div class="card join center">
      <h2>테스트 참여하기</h2>
      <p class="muted">선생님이 알려 준 6자리 코드를 입력하세요.</p>
      <div class="row center"><input id="code" class="code-input" maxlength="6" placeholder="ABC123" autocomplete="off" value="${esc(preset)}"><button class="btn primary big" id="go">입장</button></div>
    </div>
    <div class="card">
      <div class="row between"><h3>내 정보</h3><button class="btn small" id="editP">수정</button></div>
      <p>닉네임 <b>${esc(p.nickname)}</b> · 학번 ${esc(p.studentNo)} · 이름 ${esc(p.realName)}</p>
      <p class="muted small">친구들에게는 닉네임만 보입니다.</p>
    </div>
    <div class="card"><h3>내 기록</h3><div id="mine"><div class="loading">불러오는 중…</div></div></div>
  </div>`;
  const go = () => {
    const c = $("#code").value.trim().toUpperCase();
    if (c.length < 4) return toast("코드를 확인하세요.", "err");
    location.href = "play.html?code=" + encodeURIComponent(c);
  };
  $("#go").onclick = go;
  $("#code").onkeydown = e => { if (e.key === "Enter") go(); };
  $("#code").oninput = e => { e.target.value = e.target.value.toUpperCase(); };
  $("#editP").onclick = () => editProfileModal(ctx);

  try {
    const snap = await getDocs(query(collection(db, "submissions"), where("uid", "==", ctx.user.uid)));
    const subs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!subs.length) { $("#mine").innerHTML = `<p class="muted">아직 기록이 없습니다.</p>`; return; }
    const by = new Map();
    for (const s of subs) { if (!by.has(s.testId)) by.set(s.testId, []); by.get(s.testId).push(s); }
    const rows = [...by.values()].map(arr => {
      arr.sort((a, b) => tsNum(b.submittedAt) - tsNum(a.submittedAt));
      const best = arr.reduce((m, s) => (s.score > m.score ? s : m), arr[0]);
      return { last: arr[0], best, n: arr.length };
    }).sort((a, b) => tsNum(b.last.submittedAt) - tsNum(a.last.submittedAt));
    $("#mine").innerHTML = `<table class="tbl"><thead><tr><th>테스트</th><th class="r">최고 점수</th><th class="r">최근 점수</th><th class="r">횟수</th><th>최근 제출</th><th></th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${esc(r.last.testTitle || "")}</td><td class="r">${r.best.score} / ${r.best.total}</td><td class="r">${r.last.score} / ${r.last.total}</td><td class="r">${r.n}</td><td>${fmtDate(r.last.submittedAt)}</td><td><a class="btn small" href="play.html?id=${r.last.testId}">열기</a></td></tr>`).join("")}
    </tbody></table>`;
  } catch (e) {
    console.error(e);
    $("#mine").innerHTML = `<p class="alert err">기록을 불러오지 못했습니다: ${esc(e.code || e.message)}</p>`;
  }
}

// ================= 교사 =================
let tests = [];
const SORTS = {
  updated: "최근 수정순",
  newest: "최신순 (만든 날짜)",
  oldest: "오래된 순 (만든 날짜)",
  title: "이름순 (가나다)",
  titleDesc: "이름 역순",
  manual: "직접 정렬 (끌어서 옮기기)"
};
const SORT_KEY = "cloze.teacher.sort";
function loadSort() {
  try { const v = localStorage.getItem(SORT_KEY); if (v && SORTS[v]) return v; } catch (e) {}
  return "updated";
}
function saveSort(v) { try { localStorage.setItem(SORT_KEY, v); } catch (e) {} }
const state = { folder: "__all", q: "", trash: false, sort: loadSort() };

async function teacherHome() {
  app.innerHTML = `
  <div class="container wide">
    <div class="row between wrap">
      <h2>내 테스트</h2>
      <div class="row wrap">
        <a class="btn primary" href="editor.html?mode=cloze">+ 빈칸 채우기 만들기</a>
        <a class="btn primary" href="editor.html?mode=order">+ 문장 순서 만들기</a>
      </div>
    </div>
    <div class="dash">
      <aside class="card side"><div id="folders"></div></aside>
      <section>
        <div class="row wrap toolbar">
          <input id="q" placeholder="제목·본문 검색" class="grow">
          <label class="sort-label small muted" for="sort">정렬</label>
          <select id="sort">${Object.entries(SORTS).map(([k, v]) => `<option value="${k}" ${state.sort === k ? "selected" : ""}>${v}</option>`).join("")}</select>
        </div>
        <p id="manualHint" class="manual-hint small" hidden>⠿ 손잡이를 끌어 순서를 바꾸거나 ◀ ▶ 버튼으로 한 칸씩 옮기세요. 바뀐 순서는 자동 저장됩니다.</p>
        <div id="grid" class="grid"><div class="loading">불러오는 중…</div></div>
      </section>
    </div>
  </div>`;
  $("#q").oninput = e => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); };
  $("#sort").onchange = e => { state.sort = e.target.value; saveSort(state.sort); renderGrid(); };
  await loadTests();
}

async function loadTests() {
  try {
    const snap = await getDocs(query(collection(db, "tests"), where("ownerUid", "==", ctx.user.uid)));
    tests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    $("#grid").innerHTML = `<p class="alert err">불러오지 못했습니다: ${esc(e.code || e.message)}<br>Firestore 보안 규칙과 교사 이메일 설정을 확인하세요.</p>`;
    return;
  }
  renderFolders();
  renderGrid();
}

function renderFolders() {
  const active = tests.filter(t => !t.deleted);
  const counts = {};
  active.forEach(t => { const f = t.folder || ""; counts[f] = (counts[f] || 0) + 1; });
  const names = Object.keys(counts).filter(Boolean).sort((a, b) => a.localeCompare(b, "ko"));
  const item = (key, label, n) => `<button class="folder ${state.folder === key && !state.trash ? "on" : ""}" data-f="${esc(key)}">${esc(label)}<span>${n}</span></button>`;
  $("#folders").innerHTML = `<h4>폴더</h4>` + item("__all", "전체", active.length) +
    (counts[""] ? item("", "폴더 없음", counts[""]) : "") +
    names.map(n => item(n, n, counts[n])).join("") +
    `<hr><button class="folder ${state.trash ? "on" : ""}" id="trashBtn">휴지통<span>${tests.length - active.length}</span></button>
     <p class="muted small">테스트의 [⋯ → 폴더 이동]에서 새 이름을 적으면 폴더가 생깁니다.</p>`;
  $$("#folders .folder[data-f]").forEach(b => {
    b.onclick = () => { state.folder = b.dataset.f; state.trash = false; renderFolders(); renderGrid(); };
  });
  $("#trashBtn").onclick = () => { state.trash = true; renderFolders(); renderGrid(); };
}

function preview(t) {
  if (t.mode === "order") return (t.sentences || []).slice(0, 4).map((s, i) => `${i + 1}. ${s}`).join("\n");
  const toks = tokenize(t.text);
  const bs = new Set(t.blanks || []);
  return toks.map((x, i) => (bs.has(i) ? "_____" : x)).join("").slice(0, 220);
}

function renderGrid() {
  let list = tests.filter(t => !!t.deleted === state.trash);
  if (!state.trash && state.folder !== "__all") list = list.filter(t => (t.folder || "") === state.folder);
  if (state.q) list = list.filter(t => ((t.title || "") + " " + (t.text || "")).toLowerCase().includes(state.q));
  sortList(list);
  const manual = state.sort === "manual" && !state.trash;
  $("#manualHint").hidden = !manual;
  $("#grid").classList.toggle("manual", manual);
  if (!list.length) {
    $("#grid").innerHTML = `<p class="muted">${state.trash ? "휴지통이 비어 있습니다." : "테스트가 없습니다. 위의 버튼으로 새로 만드세요."}</p>`;
    return;
  }
  $("#grid").innerHTML = list.map(t => {
    const open = t.settings?.open !== false;
    const n = t.mode === "order" ? (t.sentences || []).length + "문장" : (t.blanks || []).length + "문항";
    const actions = state.trash
      ? `<button class="btn small" data-a="restore">복원</button><button class="btn small danger" data-a="purge">영구 삭제</button>`
      : `<a class="btn small" href="editor.html?id=${t.id}">편집</a>
         <a class="btn small" href="results.html?id=${t.id}">결과</a>
         <a class="btn small" href="answers.html?id=${t.id}" target="_blank">정답보기</a>
         <a class="btn small" href="live.html?id=${t.id}" target="_blank">실시간 순위</a>
         <button class="btn small" data-a="link">링크</button>
         <details class="more"><summary class="btn small">⋯</summary><div class="menu">
           <button data-a="toggle">${open ? "응시 닫기" : "응시 열기"}</button>
           <button data-a="dup">복제</button>
           <button data-a="move">폴더 이동</button>
           <button data-a="trash">휴지통으로</button>
         </div></details>`;
    const handle = manual
      ? `<div class="reorder"><span class="grab" title="끌어서 순서 바꾸기">⠿</span><button class="btn small" data-m="-1" title="앞으로">◀</button><button class="btn small" data-m="1" title="뒤로">▶</button></div>`
      : "";
    return `<div class="tcard" data-id="${t.id}">${handle}
      <div class="thumb">${esc(preview(t))}</div>
      <div class="tbody">
        <div class="ttitle">${esc(t.title || "(제목 없음)")}</div>
        <div class="meta"><span class="badge ${t.mode === "order" ? "purple" : "blue"}">${MODE_LABEL[t.mode] || ""}</span> <span>${n}</span> <span class="badge ${open ? "green" : "gray"}">${open ? "응시 가능" : "닫힘"}</span></div>
        <div class="meta small muted">코드 <b class="mono">${esc(t.code)}</b> · ${fmtDate(t.updatedAt)}${t.folder ? ` · ${esc(t.folder)}` : ""}</div>
        <div class="actions">${actions}</div>
      </div></div>`;
  }).join("");
  $$("#grid [data-a]").forEach(b => {
    b.onclick = e => { e.preventDefault(); act(b.closest(".tcard").dataset.id, b.dataset.a); };
  });
  if (manual) setupReorder(list);
}

// ---------- 정렬 ----------
const byTitle = (a, b) => (a.title || "").localeCompare(b.title || "", "ko", { numeric: true });
// 직접 정렬: order 값이 있는 것은 그 순서대로, 아직 순서가 없는 새 테스트는 맨 앞에 (최신순)
function manualCmp(a, b) {
  const ha = typeof a.order === "number", hb = typeof b.order === "number";
  if (ha && hb) return a.order - b.order;
  if (ha !== hb) return ha ? 1 : -1;
  return tsNum(b.createdAt) - tsNum(a.createdAt);
}
function sortList(list) {
  const s = state.sort;
  if (s === "title") list.sort(byTitle);
  else if (s === "titleDesc") list.sort((a, b) => byTitle(b, a));
  else if (s === "newest") list.sort((a, b) => tsNum(b.createdAt) - tsNum(a.createdAt));
  else if (s === "oldest") list.sort((a, b) => tsNum(a.createdAt) - tsNum(b.createdAt));
  else if (s === "manual") list.sort(manualCmp);
  else list.sort((a, b) => tsNum(b.updatedAt) - tsNum(a.updatedAt));
  return list;
}

// id 를 target 앞/뒤로 옮긴 뒤 (휴지통 제외) 전체 순서를 다시 매겨 바뀐 것만 저장
async function moveTest(id, targetId, after) {
  if (id === targetId) return;
  const all = tests.filter(t => !t.deleted).sort(manualCmp);
  const from = all.findIndex(t => t.id === id);
  if (from < 0) return;
  const [item] = all.splice(from, 1);
  let to = all.findIndex(t => t.id === targetId);
  if (to < 0) return;
  if (after) to++;
  all.splice(to, 0, item);
  const changed = [];
  all.forEach((t, i) => { if (t.order !== i) { t.order = i; changed.push(t); } });
  renderGrid();
  if (!changed.length) return;
  try {
    for (let i = 0; i < changed.length; i += 450) {
      const batch = writeBatch(db);
      changed.slice(i, i + 450).forEach(t => batch.update(doc(db, "tests", t.id), { order: t.order }));
      await batch.commit();
    }
  } catch (e) {
    console.error(e);
    toast("순서 저장 실패: " + (e.code || e.message), "err");
    await loadTests();
  }
}

function setupReorder(list) {
  const grid = $("#grid");
  $$("#grid [data-m]").forEach(b => {
    b.onclick = e => {
      e.preventDefault();
      const id = b.closest(".tcard").dataset.id;
      const i = list.findIndex(t => t.id === id), d = +b.dataset.m, j = i + d;
      if (j < 0 || j >= list.length) return;
      moveTest(id, list[j].id, d > 0);
    };
  });
  $$("#grid .grab").forEach(h => {
    h.onpointerdown = e => {
      if (e.button) return;
      e.preventDefault();
      const card = h.closest(".tcard");
      const rect = card.getBoundingClientRect();
      const ghost = card.cloneNode(true);
      ghost.classList.add("ghost");
      ghost.style.width = rect.width + "px";
      ghost.style.height = rect.height + "px";
      const dx = e.clientX - rect.left, dy = e.clientY - rect.top;
      const place = (x, y) => { ghost.style.left = (x - dx) + "px"; ghost.style.top = (y - dy) + "px"; };
      place(e.clientX, e.clientY);
      document.body.appendChild(ghost);
      card.classList.add("dragging");
      grid.classList.add("drag-on");
      let drop = null;
      const clearMark = () => $$("#grid .drop-before, #grid .drop-after").forEach(c => c.classList.remove("drop-before", "drop-after"));
      const move = ev => {
        place(ev.clientX, ev.clientY);
        // 화면 위아래 가장자리에서 자동 스크롤
        if (ev.clientY < 60) window.scrollBy(0, -14); else if (ev.clientY > innerHeight - 60) window.scrollBy(0, 14);
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const over = el && el.closest("#grid .tcard");
        clearMark();
        drop = null;
        if (!over || over === card) return;
        const r = over.getBoundingClientRect();
        const after = ev.clientX > r.left + r.width / 2;
        over.classList.add(after ? "drop-after" : "drop-before");
        drop = { id: over.dataset.id, after };
      };
      const end = () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        ghost.remove();
        card.classList.remove("dragging");
        grid.classList.remove("drag-on");
        clearMark();
        if (drop) moveTest(card.dataset.id, drop.id, drop.after);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
    };
  });
}

async function act(id, a) {
  const t = tests.find(x => x.id === id);
  const ref = doc(db, "tests", id);
  try {
    if (a === "link") return copyText(playUrl(t.code));
    if (a === "toggle") {
      const open = t.settings?.open === false;
      await updateDoc(ref, { "settings.open": open, updatedAt: serverTimestamp() });
      toast(open ? "응시를 열었습니다." : "응시를 닫았습니다.");
    }
    if (a === "dup") {
      const { id: _omit, ...data } = t;
      data.title = (t.title || "") + " (복사본)";
      data.code = await uniqueCode();
      data.createdAt = serverTimestamp();
      data.updatedAt = serverTimestamp();
      data.deleted = false;
      delete data.order;
      await addDoc(collection(db, "tests"), data);
      toast("복제했습니다. 학생 기록은 복제되지 않습니다.");
    }
    if (a === "move") {
      const f = prompt("이동할 폴더 이름 (비우면 '폴더 없음')", t.folder || "");
      if (f === null) return;
      await updateDoc(ref, { folder: f.trim() });
    }
    if (a === "trash") { await updateDoc(ref, { deleted: true }); toast("휴지통으로 옮겼습니다. 학생은 응시할 수 없습니다."); }
    if (a === "restore") await updateDoc(ref, { deleted: false });
    if (a === "purge") {
      if (!confirm("영구 삭제할까요? 되돌릴 수 없습니다.")) return;
      await deleteDoc(ref);
    }
    await loadTests();
  } catch (e) {
    console.error(e);
    toast("실패: " + (e.code || e.message), "err");
  }
}

// 맨 아래에서 시작 (위의 const 선언들이 먼저 준비되도록)
if (ctx.teacher) teacherHome(); else studentHome();
