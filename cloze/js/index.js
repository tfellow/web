import { gate, db, $, $$, esc, toast, fmtDate, fmtSec, copyText, playUrl, uniqueCode, MODE_LABEL, tsNum, editProfileModal } from "./common.js";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { tokenize } from "./core.js";

const ctx = await gate({ needProfile: true });
const app = $("#app");
if (ctx.teacher) teacherHome(); else studentHome();

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
const state = { folder: "__all", q: "", trash: false, sort: "updated" };

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
          <select id="sort"><option value="updated">최근 수정순</option><option value="created">만든 순</option><option value="title">이름순</option></select>
        </div>
        <div id="grid" class="grid"><div class="loading">불러오는 중…</div></div>
      </section>
    </div>
  </div>`;
  $("#q").oninput = e => { state.q = e.target.value.trim().toLowerCase(); renderGrid(); };
  $("#sort").onchange = e => { state.sort = e.target.value; renderGrid(); };
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
  if (state.sort === "title") list.sort((a, b) => (a.title || "").localeCompare(b.title || "", "ko"));
  else {
    const f = state.sort === "created" ? "createdAt" : "updatedAt";
    list.sort((a, b) => tsNum(b[f]) - tsNum(a[f]));
  }
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
    return `<div class="tcard" data-id="${t.id}">
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
