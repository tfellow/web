/* MY Sentence Gym · 화면: 홈(범위·게임 고르기), 오답 노트, 내 문장 세트 */
(function () {
"use strict";
const SG = window.SG, { $, $$, esc, LS } = SG;
SG.pages = {};

/* ---------- 홈 ---------- */
SG.pages.home = () => {
  const p = SG.pickState();
  const sets = SG.sets();
  if (p.set && !sets.find(s => s.id === p.set)) { p.set = null; SG.savePick(p); }
  const units = SG.KEYS.filter(k => SG.UNITS[k].g === p.g);
  const stats = SG.stats.all();
  const pool = SG.pool(p);
  const noteN = SG.note.items().length;
  $("#main").innerHTML = `
  <section class="card hero">
    <h2>오늘은 어떤 문장으로 운동할까요? 🏋️</h2>
    <p>교과서 본문 · In Context 대화 · 문법 예문으로 하는 문장 게임</p>
    <div class="pick">
      ${sets.length ? `<div><label class="k">문장 자료</label><div class="chips">
        <button class="chip ${p.set ? "" : "on"}" data-set="">📗 교과서</button>
        ${sets.map(s => `<button class="chip ${p.set === s.id ? "on" : ""}" data-set="${esc(s.id)}">📝 ${esc(s.title)} <small>${s.lines.length}</small></button>`).join("")}
      </div></div>` : ""}
      <div class="${p.set ? "hidden" : ""}">
        <label class="k">학년</label>
        <div class="chips">${[1, 2].map(g => `<button class="chip ${p.g === g ? "on" : ""}" data-g="${g}">${g}학년</button>`).join("")}</div>
      </div>
      <div class="${p.set ? "hidden" : ""}">
        <label class="k">단원 (여러 개 고를 수 있어요)</label>
        <div class="chips units">${units.map(k => { const U = SG.UNITS[k]; return `<button class="chip ${p.units.includes(k) ? "on" : ""}" data-u="${k}" title="${esc(U.title)}">${U.u}과 <small>${esc(U.title)}</small></button>`; }).join("")}</div>
      </div>
      <div class="${p.set ? "hidden" : ""}">
        <label class="k">자료</label>
        <div class="chips">${[["r", "📖 본문"], ["c", "💬 In Context 대화"], ["gr", "🧠 문법 예문"]].map(([s, n]) => `<button class="chip ${p.src[s] ? "on" : ""}" data-src="${s}">${n}</button>`).join("")}</div>
      </div>
      <div>
        <label class="k">한 판 문제 수</label>
        <div class="chips">${[5, 10, 15, 20, 99].map(n => `<button class="chip ${p.n === n ? "on" : ""}" data-n="${n}">${n === 99 ? "전부" : n + "문제"}</button>`).join("")}</div>
      </div>
    </div>
    <p class="range">🎯 ${esc(SG.rangeLabel(p))} · <b>${pool.length}</b>문장</p>
  </section>
  ${p.set ? "" : grammarFocus(p)}
  <div class="games">${SG.GAMES.map(g => {
    const st = stats[g.id];
    const n = g.page ? pool.length : pool.filter(it => g.ok(it)).length;
    return `<a class="gcard ${n ? "" : "off"}" href="#/play/${g.id}">
      <div class="g-emoji">${g.emoji}</div>
      <div class="g-body"><h3>${esc(g.name)}</h3><p>${esc(g.desc)}</p>
      <div class="g-meta"><span class="pill gold">${esc(g.bench)}</span>${n ? `<span class="pill">${n}문장</span>` : `<span class="pill bad">문장 없음</span>`}${st ? `<span class="pill ok">최고 ${st.best}%</span>` : ""}</div></div></a>`;
  }).join("")}</div>
  <div class="card tip"><b>📕 오답 노트</b> ${noteN ? `틀린 문장 ${noteN}개가 모여 있어요. <a href="#/review">다시 풀기 →</a>` : "틀린 문장은 자동으로 여기에 모여요."}
    <span class="muted small">· 기록은 이 기기 브라우저에만 저장돼요.</span></div>`;

  const save = () => { SG.savePick(p); SG.pages.home(); };
  $$("[data-set]").forEach(b => b.onclick = () => { p.set = b.dataset.set || null; save(); });
  $$("[data-g]").forEach(b => b.onclick = () => { p.g = +b.dataset.g; p.units = [SG.KEYS.find(k => SG.UNITS[k].g === p.g)]; save(); });
  $$("[data-u]").forEach(b => b.onclick = () => {
    const k = b.dataset.u, i = p.units.indexOf(k);
    if (i >= 0) { if (p.units.length > 1) p.units.splice(i, 1); else return SG.toast("단원을 하나 이상 골라 주세요"); }
    else p.units.push(k);
    p.units.sort(); save();
  });
  $$("[data-src]").forEach(b => b.onclick = () => {
    const s = b.dataset.src; const on = Object.keys(p.src).filter(k => p.src[k]);
    if (p.src[s] && on.length === 1) return SG.toast("자료를 하나 이상 골라 주세요");
    p.src = { ...p.src, [s]: p.src[s] ? 0 : 1 }; save();
  });
  $$("[data-n]").forEach(b => b.onclick = () => { p.n = +b.dataset.n; save(); });
};
function grammarFocus(p) {
  const rows = p.units.map(k => SG.UNITS[k]).filter(Boolean);
  if (!rows.length) return "";
  return `<div class="card focus"><h3>🧠 이번 범위의 핵심 문법</h3>
    <div class="focus-list">${rows.map(U => `<div><span class="pill">${U.g}-${U.u}</span> ${U.grammar.map(esc).join(" · ")}</div>`).join("")}</div></div>`;
}

/* ---------- 오답 노트 ---------- */
SG.pages.review = () => {
  const items = SG.note.items(), w = SG.note.all();
  const qGames = SG.GAMES.filter(g => !g.page && g.id !== "match" && g.id !== "order" && g.id !== "next");
  $("#main").innerHTML = `<div class="card"><h2>📕 오답 노트 <span class="muted small">${items.length}문장</span></h2>
    ${items.length ? `<p class="muted small">게임을 골라 틀린 문장만 다시 풀어요. 처음에 바로 맞히면 노트에서 빠져요(졸업!).</p>
    <div class="row-btns">${qGames.map(g => {
      const n = items.filter(it => g.ok(it)).length;
      return `<a class="btn ${n ? "" : "disabled-a"}" href="#/review-play/${g.id}">${g.emoji} ${esc(g.name)} <small class="muted">${n}</small></a>`;
    }).join("")}</div>` : `<p class="muted">아직 틀린 문장이 없어요. 게임을 하다 틀린 문장은 여기에 자동으로 모여요.</p>`}
  </div>
  ${items.length ? `<div class="card"><ul class="note-list">${items.map(it => `<li>
    ${SG.ttsBar(it.en, true)}
    <div><b>${esc(it.en)}</b><br><span class="muted small">${esc(it.ko)}</span>
    <div class="small"><span class="pill">${it.src === "t" ? "내 세트" : `${it.g}-${it.u} ${SG.SRC_NAME[it.src]}`}</span> <span class="pill bad">${w[it.id].n}번 틀림</span></div>
    ${it.grammar ? `<div class="small muted">📘 ${esc(it.grammar)}</div>` : ""}</div>
    <button class="btn sm" data-del="${esc(it.id)}" title="노트에서 빼기">✕</button></li>`).join("")}</ul>
    <div class="row-btns"><button class="btn sm red" id="clearAll">오답 노트 비우기</button></div></div>` : ""}`;
  $$("[data-del]").forEach(b => b.onclick = () => { SG.note.remove(b.dataset.del); SG.pages.review(); });
  const ca = $("#clearAll"); if (ca) ca.onclick = () => { if (confirm("오답 노트를 모두 비울까요? 되돌릴 수 없어요.")) { LS.set("wrong", {}); SG.pages.review(); } };
};

/* ---------- 내 문장 세트 (교사용 붙여 넣기 → 공유 링크) ---------- */
function parseLines(text) {
  return text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(l => {
    let en = l, ko = "";
    const m = l.split(/\s*[|\t]\s*/);
    if (m.length >= 2) { en = m[0]; ko = m.slice(1).join(" "); }
    else { const k = l.search(/[가-힣]/); if (k > 0) { en = l.slice(0, k).trim(); ko = l.slice(k).trim(); } }
    en = en.replace(/^\s*(\d+[.)]|[-•·])\s*/, "");
    return [en, ko];
  }).filter(l => /[A-Za-z]/.test(l[0]) && l[0].split(/\s+/).length >= 2);
}
function parseGroups(text) {
  return text.split(/[,;\n]+/).map(g => g.split("/").map(w => w.trim()).filter(Boolean)).filter(g => g.length >= 2);
}
SG.pages.sets = () => {
  const sets = SG.sets();
  $("#main").innerHTML = `<div class="card"><h2>📝 내 문장 세트 만들기 <span class="pill gold">선생님용</span></h2>
    <p class="muted small">새 본문이나 학습지 문장을 붙여 넣으면 모든 게임이 그 문장으로 자동으로 만들어져요. 공유 링크를 학생에게 보내면 학생 기기에서 바로 열려요. (서버에 저장하지 않아요: 문장은 링크 안에 들어 있어요)</p>
    <label class="k">세트 이름</label><input type="text" id="st" placeholder="예: 2-3 Grammar 학습지" maxlength="60" style="width:100%">
    <label class="k">문장 (한 줄에 하나: <code>영어 문장 | 한국어 뜻</code>, 뜻은 없어도 돼요)</label>
    <textarea id="sl" rows="9" placeholder="Sam has a friend who is from Canada. | Sam에게는 캐나다 출신 친구가 있어.&#10;I'm looking for a house which has a pool. | 나는 수영장이 있는 집을 찾고 있어."></textarea>
    <label class="k">타깃 문법 묶음 (선택) — 이 낱말이 나오면 서로 바꿔서 [A / B] 문제를 만들어요</label>
    <input type="text" id="sg" placeholder="예: who/which, is/are, much/very (한 낱말끼리)" style="width:100%">
    <p class="muted small">묶음 외에도 be동사·조동사 뒤 동사원형·3인칭 -s·불규칙 과거·대명사·a/an·비교급을 자동으로 찾아 함정 보기를 만들어요.</p>
    <div id="sprev" class="small"></div>
    <div class="row-btns"><button class="btn" id="spv">미리 보기</button><button class="btn navy" id="ssave">세트 저장</button></div>
  </div>
  <div class="card"><h3>저장한 세트</h3>${sets.length ? `<ul class="note-list">${sets.map(s => `<li><div><b>${esc(s.title)}</b> <span class="muted small">${s.lines.length}문장${s.groups && s.groups.length ? " · 묶음 " + esc(s.groups.map(g => g.join("/")).join(", ")) : ""}${s.shared ? " · 받은 세트" : ""}</span></div>
      <div class="row-btns" style="margin:0"><button class="btn sm navy" data-use="${esc(s.id)}">▶ 이 세트로 놀기</button><button class="btn sm" data-link="${esc(s.id)}">🔗 공유 링크 복사</button><button class="btn sm" data-del="${esc(s.id)}">✕</button></div></li>`).join("")}</ul>` : `<p class="muted">아직 없어요.</p>`}</div>`;
  const read = () => ({ title: $("#st").value.trim() || "내 문장 세트", lines: parseLines($("#sl").value), groups: parseGroups($("#sg").value) });
  $("#spv").onclick = () => {
    const d = read();
    if (!d.lines.length) { $("#sprev").innerHTML = `<p class="err">영어 문장을 한 줄에 하나씩 넣어 주세요.</p>`; return; }
    const tmp = SG.registerSet({ id: "preview", ...d });
    $("#sprev").innerHTML = `<p><b>${d.lines.length}문장</b>을 읽었어요. 문법 함정 예시:</p><ul>${tmp.items.slice(0, 8).map(it => {
      const c = SG.candidates(it)[0];
      return `<li>${esc(it.en)} ${it.ko ? `<span class="muted">/ ${esc(it.ko)}</span>` : `<span class="pill bad">뜻 없음 → 문장 조립·매칭에서 뜻이 빈칸</span>`}<br>${c ? `<span class="pill ok">${esc(c.right)} ↔ ${esc(c.wrongs.join(", "))}</span>` : `<span class="pill">함정 없음 (어법 게임에선 빠져요)</span>`}</li>`;
    }).join("")}</ul>`;
  };
  $("#ssave").onclick = () => {
    const d = read();
    if (!d.lines.length) return SG.toast("영어 문장을 넣어 주세요");
    const all = LS.get("sets", []); const set = { id: Date.now().toString(36), ...d };
    all.push(set); LS.set("sets", all); SG.registerSet(set);
    SG.toast("저장했어요"); SG.pages.sets();
  };
  $$("[data-use]").forEach(b => b.onclick = () => { const p = SG.pickState(); p.set = b.dataset.use; SG.savePick(p); location.hash = "#/"; });
  $$("[data-del]").forEach(b => b.onclick = () => { if (!confirm("이 세트를 지울까요?")) return; LS.set("sets", LS.get("sets", []).filter(s => s.id !== b.dataset.del)); SG.pages.sets(); });
  $$("[data-link]").forEach(b => b.onclick = async () => {
    const s = LS.get("sets", []).find(x => x.id === b.dataset.link);
    const url = location.origin + location.pathname + "#set=" + SG.encodeSet(s);
    try { await navigator.clipboard.writeText(url); SG.toast(`링크를 복사했어요 (${url.length}자)`); }
    catch (e) { prompt("이 링크를 복사하세요", url); }
  });
};
})();
