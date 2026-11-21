/* MY Sentence Gym · 게임 9종 */
(function () {
"use strict";
const SG = window.SG, { $, $$, esc, shuffle, LS } = SG;
const wc = it => SG.words(it.en).length;
const G = (def) => SG.GAMES.push(def);
const lc = s => SG.plain(s).toLowerCase();

/* ========== 1. 문장 조립 (듀오링고·배열 영문법) ========== */
function autoChunks(en) {
  const toks = en.trim().split(/\s+/), out = []; let cur = [];
  toks.forEach((t, i) => {
    cur.push(t);
    const restLen = toks.length - i - 1;
    if ((/[,;:]$/.test(t) || cur.length >= 3) && restLen > 0 && !(restLen === 1 && cur.length >= 3 && false)) { out.push(cur.join(" ")); cur = []; }
  });
  if (cur.length) { if (cur.length === 1 && out.length) out[out.length - 1] += " " + cur[0]; else out.push(cur.join(" ")); }
  return out;
}
G({
  id: "assemble", emoji: "🧩", name: "문장 조립", bench: "듀오링고 · 배열 영문법",
  desc: "한국어 뜻을 보고 영어 조각을 순서대로 눌러 문장을 완성해요. 문법 함정 조각이 섞여 있어요!",
  ok: it => wc(it) >= 3 && wc(it) <= 22,
  render(it, stage, done) {
    const mode = LS.get("asmMode", "chunk");
    let pieces = mode === "chunk" ? (it.chunk ? it.chunk.split(/\s*\/\s*/) : autoChunks(it.en)) : it.en.trim().split(/\s+/);
    if (mode === "chunk" && pieces.length < 3) pieces = it.en.trim().split(/\s+/);
    // 함정 조각: 문법 오답 보기로 만든다
    const traps = [];
    for (const c of SG.candidates(it).slice(0, 3)) {
      if (traps.length >= 2) break;
      const wrong = c.wrongs[0];
      if (mode === "word" || pieces.length === it.en.trim().split(/\s+/).length) {
        if (c.j - c.i === 1) { const t = SG.tokens(it.en)[c.i]; traps.push({ text: t.pre + wrong + t.post, cand: c, wrong }); }
      } else {
        const re = new RegExp("(^|[\\s(\"“])" + c.right.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/'/g, "['’]") + "(?=$|[\\s.,!?;:\"”)])", "i");
        const k = pieces.findIndex(p => re.test(p));
        if (k >= 0) { const m = pieces[k].match(re); const text = pieces[k].replace(re, m[1] + wrong); if (!pieces.includes(text)) traps.push({ text, cand: c, wrong }); }
      }
    }
    const bank = shuffle(pieces.map((t, i) => ({ t, real: i })).concat(traps.map((x, k) => ({ t: x.text, trap: k }))));
    const line = [];
    stage.innerHTML = `
      <div class="mode-row"><span class="muted small">조각:</span>
        <button class="chip-t ${mode === "chunk" ? "on" : ""}" data-m="chunk">덩어리 (쉬움)</button>
        <button class="chip-t ${mode === "word" ? "on" : ""}" data-m="word">낱말 (어려움)</button></div>
      <p class="prompt-ko">${esc(it.ko)}</p>
      <div class="line" id="line"><span class="ph">아래 조각을 순서대로 눌러요</span></div>
      <div class="bank" id="bank"></div>
      <div class="row-btns c">${SG.ttsBar(it.en, true)}<button class="btn" id="undo">↺ 처음부터</button><button class="btn navy" id="check" disabled>확인</button></div>
      ${traps.length ? `<p class="small muted center-t">⚠️ 쓰지 않는 함정 조각이 ${traps.length}개 있어요.</p>` : ""}`;
    const draw = () => {
      $("#line", stage).innerHTML = line.length ? line.map((b, i) => `<button class="tile in" data-i="${i}">${esc(b.t)}</button>`).join("") : `<span class="ph">아래 조각을 순서대로 눌러요</span>`;
      $("#bank", stage).innerHTML = bank.map((b, i) => `<button class="tile${b.used ? " used" : ""}" data-b="${i}" ${b.used ? "disabled" : ""}>${esc(b.t)}</button>`).join("");
      $("#check", stage).disabled = !line.length;
    };
    stage.onclick = e => {
      const m = e.target.closest("[data-m]");
      if (m) { LS.set("asmMode", m.dataset.m); this.render(it, stage, done); return; }
      const b = e.target.closest("[data-b]"); if (b && !b.disabled) { const x = bank[+b.dataset.b]; x.used = true; line.push(x); draw(); return; }
      const l = e.target.closest("[data-i]"); if (l && !l.disabled) { const x = line.splice(+l.dataset.i, 1)[0]; x.used = false; draw(); }
    };
    $("#undo", stage).onclick = () => { line.splice(0).forEach(x => x.used = false); draw(); };
    $("#check", stage).onclick = () => {
      $("#check", stage).disabled = true; $("#undo", stage).disabled = true;
      const got = SG.words(line.map(x => x.t).join(" ")).join(" "), want = SG.words(it.en).join(" ");
      const ok = got === want;
      const trap = line.find(x => x.trap != null);
      $("#line", stage).classList.add(ok ? "good" : "badline");
      let msg = "", hint = "";
      if (!ok && trap) { const t = traps[trap.trap]; msg = `함정 조각 '${esc(t.text)}'을(를) 썼어요. 맞는 말은 '${esc(t.cand.right)}'`; hint = t.cand.hint; }
      else if (!ok) msg = "순서가 달라요.";
      done(ok, { msg, hint });
    };
    draw();
  }
});

/* ========== 2. 빈칸 4단계 암기 (잽영어·이그잼포유·빔) ========== */
function blankSet(it, level) {
  const toks = SG.tokens(it.en), s = new Set();
  if (level === 4) { toks.forEach((t, i) => s.add(i)); return s; }
  if (level === 3) { toks.forEach((t, i) => { if (/[A-Za-z]{2,}/.test(t.core)) s.add(i); }); return s; }
  for (const c of SG.candidates(it)) for (let i = c.i; i < c.j; i++) s.add(i);
  if (level === 2) {
    const vocab = String(it.vocab || "").split(/[;；]/).map(x => (x.trim().match(/^[A-Za-z][A-Za-z' -]*?(?=\s+[^A-Za-z]|$)/) || [""])[0].trim().toLowerCase()).filter(Boolean);
    toks.forEach((t, i) => {
      const w = lc(t.core);
      if (!w) return;
      if (SG.baseOf(w) && !["be", "do", "have"].includes(SG.baseOf(w))) s.add(i);
      if (vocab.some(v => v === w || (v.split(" ").length === 1 && (w === v + "s" || w === v + "es" || w === v + "ed" || w === v + "ing")))) s.add(i);
    });
  }
  if (!s.size && level <= 2) { // 문법 자리가 없으면 가장 긴 낱말
    let best = -1, bl = 0; toks.forEach((t, i) => { if (/^[a-z]/.test(t.core) && t.core.length > bl) { bl = t.core.length; best = i; } }); if (best >= 0) s.add(best);
  }
  return s;
}
G({
  id: "blanks", emoji: "🙈", name: "빈칸 4단계 암기", bench: "잽영어 · 이그잼포유 M · 빔",
  desc: "본문을 단계별로 가리며 외워요. 빈칸을 누르면 2초 동안 보였다가 다시 숨어요. 직접 써 보기로 채점도!",
  page(pool) {
    const main = $("#main");
    let level = LS.get("blankLevel", 1), write = false;
    const groups = ["r", "c", "gr", "t"].map(s => [s, pool.filter(it => it.src === s).sort((a, b) => a.unit === b.unit ? a.order - b.order : a.unit < b.unit ? -1 : 1)]).filter(g => g[1].length);
    if (!groups.length) { main.innerHTML = `<div class="card center">고른 범위에 문장이 없어요. <a href="#/">← 범위 바꾸기</a></div>`; return; }
    const LV = ["전체 보기", "① 문법 빈칸", "② 동사·핵심어 빈칸", "③ 첫 글자 힌트", "④ 통문장"];
    const draw = () => {
      main.innerHTML = `<div class="play-top"><a class="btn sm" href="#/">← 게임 목록</a><h2 class="game-title" style="margin:0">🙈 빈칸 4단계 암기</h2></div>
      <div class="sticky-tools">
        <div class="tabs">${LV.map((n, i) => `<button data-lv="${i}" class="${i === level ? "on" : ""}">${n}</button>`).join("")}</div>
        <div class="row-btns" style="margin-top:0">
          <label class="switch"><input type="checkbox" id="wmode" ${write ? "checked" : ""} ${level === 0 ? "disabled" : ""}> ✍️ 직접 써 보기</label>
          <label class="switch"><input type="checkbox" id="kmode" ${LS.get("blankKo", true) ? "checked" : ""}> 해석 보기</label>
          ${write ? `<button class="btn navy sm" id="grade">채점하기</button><button class="btn sm" id="clear">지우기</button>` : `<span class="muted small">빈칸을 누르면 2초 동안 보여요</span>`}
        </div></div>
      <div id="sheet">${groups.map(([s, list]) => `<div class="card"><h3>${SG.SRC_NAME[s]} <span class="muted small">${list.length}문장</span></h3>
        ${list.map(it => row(it)).join("")}</div>`).join("")}</div>
      <div class="row-btns c"><a class="btn" href="#/">🏠 게임 목록</a></div>`;
      $$("[data-lv]").forEach(b => b.onclick = () => { level = +b.dataset.lv; LS.set("blankLevel", level); if (!level) write = false; draw(); });
      $("#wmode").onchange = e => { write = e.target.checked; draw(); };
      $("#kmode").onchange = e => { LS.set("blankKo", e.target.checked); $$(".s-ko").forEach(x => x.classList.toggle("hidden", !e.target.checked)); };
      if (write) {
        $("#grade").onclick = grade;
        $("#clear").onclick = () => { $$("#sheet input.fill, #sheet textarea").forEach(x => { x.value = ""; x.classList.remove("right", "wrong"); x.disabled = false; }); $$(".diff").forEach(d => d.innerHTML = ""); };
      }
    };
    const row = it => {
      const showKo = LS.get("blankKo", true) || level === 4;
      const spk = it.speaker ? `<b class="spk">${esc(it.speaker)}</b> ` : "";
      let body;
      if (level === 4) {
        body = write ? `<textarea class="whole" rows="2" data-id="${it.id}" placeholder="영어 문장 전체를 써 보세요" autocapitalize="off" autocomplete="off" spellcheck="false"></textarea><div class="diff" data-for="${it.id}"></div>`
          : `<button class="blank whole-b" data-ans="${esc(it.en)}">${"▁".repeat(Math.min(24, Math.max(6, it.en.length / 2 | 0)))}</button>`;
      } else {
        const bs = level ? blankSet(it, level) : new Set();
        body = SG.tokens(it.en).map((t, i) => {
          if (!bs.has(i)) return esc(t.raw);
          const ans = t.core;
          if (write) return `${esc(t.pre)}<input class="fill" data-ans="${esc(ans)}" size="${Math.max(3, ans.length)}" autocapitalize="off" autocomplete="off" spellcheck="false" ${level === 3 ? `placeholder="${esc(ans[0])}…"` : ""}>${esc(t.post)}`;
          const face = level === 3 ? esc(ans[0]) + "_".repeat(Math.max(1, ans.length - 1)) : "▁".repeat(Math.max(3, Math.min(10, ans.length)));
          return `${esc(t.pre)}<button class="blank" data-ans="${esc(ans)}">${face}</button>${esc(t.post)}`;
        }).join(" ");
      }
      return `<div class="srow">${SG.ttsBar(it.en, true)}<div class="s-main"><div class="s-en">${spk}${body}</div><div class="s-ko muted ${showKo ? "" : "hidden"}">${esc(it.ko)}</div></div></div>`;
    };
    const grade = () => {
      let right = 0, total = 0, empty = 0;
      $$("#sheet input.fill").forEach(x => {
        if (!x.value.trim()) { empty++; x.classList.toggle("right", false); x.classList.toggle("wrong", false); return; }
        total++; const ok = lc(x.value.trim()) === lc(x.dataset.ans); if (ok) right++; x.classList.toggle("right", ok); x.classList.toggle("wrong", !ok); if (!ok) x.title = x.dataset.ans;
      });
      $$("#sheet textarea.whole").forEach(x => {
        if (!x.value.trim()) { empty++; return; }
        total++; const it = SG.ITEMS[x.dataset.id]; const r = SG.diffWords(it.en, x.value);
        if (r.ok) right++; x.classList.toggle("right", r.ok); x.classList.toggle("wrong", !r.ok);
        $(`.diff[data-for="${CSS.escape(it.id)}"]`).innerHTML = x.value.trim() ? r.html : "";
      });
      SG.toast(total ? `쓴 ${total}개 중 ${right}개 정답${right === total ? " 🎉" : ""}${empty ? ` · 빈칸 ${empty}개 남음` : ""}` : "빈칸에 먼저 써 보세요", 2800);
    };
    if (!main._blankBound && (main._blankBound = true)) main.addEventListener("click", e => {
      const b = e.target.closest("button.blank"); if (!b || b._open) return;
      const face = b.innerHTML; b._open = true; b.classList.add("open"); b.textContent = b.dataset.ans;
      setTimeout(() => { b.innerHTML = face; b.classList.remove("open"); b._open = false; }, 2000);
    });
    draw();
  }
});

/* 낱말 비교 (받아쓰기·통문장 채점) */
SG.diffWords = (target, typed) => {
  const T = SG.tokens(target).filter(t => SG.normWord(t.core)), A = SG.words(typed);
  const t = T.map(x => SG.normWord(x.core)), n = t.length, m = A.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = t[i] === A[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const out = []; let i = 0, j = 0, hit = 0;
  while (i < n || j < m) {
    if (i < n && j < m && t[i] === A[j]) { out.push(`<span class="w-ok">${esc(T[i].raw)}</span>`); hit++; i++; j++; }
    else if (j < m && (i >= n || L[i][j + 1] >= L[i + 1][j])) { out.push(`<span class="w-extra" title="필요 없는 낱말">${esc(A[j])}</span>`); j++; }
    else { out.push(`<span class="w-miss" title="빠졌거나 틀린 낱말">${esc(T[i].raw)}</span>`); i++; }
  }
  return { ok: hit === n && m === n, hit, n, html: out.join(" ") };
};

/* ========== 3. 어법 고르기 (잽영어 어법 선택형) ========== */
G({
  id: "choice", emoji: "⚖️", name: "어법 고르기", bench: "잽영어 어법 선택 · 내신형",
  desc: "[ A / B ] 중 문법에 맞는 말을 골라요. 틀리면 왜 틀렸는지 바로 알려 줘요.",
  need: "문법 자료(be동사·시제·대명사 등)가 들어 있는 문장이 필요해요.",
  ok: it => SG.candidates(it).length > 0,
  render(it, stage, done) {
    const c = SG.pickCand(it);
    const opts = shuffle([c.right].concat(shuffle(c.wrongs).slice(0, 2)));
    const toks = SG.tokens(it.en);
    const a = toks[c.i], b = toks[c.j - 1];
    const before = toks.slice(0, c.i).map(t => esc(t.raw)).join(" "), after = toks.slice(c.j).map(t => esc(t.raw)).join(" ");
    stage.innerHTML = `${it.speaker ? `<p class="spk-line">💬 ${esc(it.speaker)}</p>` : ""}
      <p class="q-sent">${before} ${esc(a.pre)}<span class="slot">[ ${opts.map(esc).join(" / ")} ]</span>${esc(b.post)} ${after}</p>
      <p class="prompt-ko small">${esc(it.ko)}</p>
      <div class="opts">${opts.map(o => `<button class="opt" data-o="${esc(o)}">${esc(o)}</button>`).join("")}</div>`;
    $$(".opt", stage).forEach(btn => btn.onclick = () => {
      const ok = lc(btn.dataset.o) === lc(c.right);
      btn.classList.add(ok ? "right" : "wrong");
      if (!ok) $$(".opt", stage).forEach(x => { if (lc(x.dataset.o) === lc(c.right)) x.classList.add("right"); });
      done(ok, { msg: ok ? "" : `정답은 '${esc(c.right)}'`, hint: c.hint });
    });
  }
});

/* ========== 4. 틀린 곳 찾기 ========== */
G({
  id: "spot", emoji: "🔍", name: "틀린 곳 찾기", bench: "내신 어법 오류 찾기",
  desc: "문장 속에 문법이 틀린 낱말이 딱 하나 숨어 있어요. 찾아서 눌러요!",
  need: "문법 자료(be동사·시제·대명사 등)가 들어 있는 문장이 필요해요.",
  ok: it => SG.candidates(it).length > 0,
  render(it, stage, done) {
    const c = SG.pickCand(it), wrong = SG.pick(c.wrongs);
    const toks = SG.tokens(it.en);
    const pieces = [];
    toks.forEach((t, i) => {
      if (i === c.i) pieces.push({ text: t.pre + wrong + toks[c.j - 1].post, bad: true });
      else if (i > c.i && i < c.j) return;
      else pieces.push({ text: t.raw });
    });
    stage.innerHTML = `${it.speaker ? `<p class="spk-line">💬 ${esc(it.speaker)}</p>` : ""}
      <p class="muted small">문법이 틀린 낱말 하나를 눌러요.</p>
      <div class="words">${pieces.map((p, k) => `<button class="wbtn" data-k="${k}">${esc(p.text)}</button>`).join("")}</div>
      <p class="prompt-ko small">${esc(it.ko)}</p>`;
    $$(".wbtn", stage).forEach(btn => btn.onclick = () => {
      const p = pieces[+btn.dataset.k], ok = !!p.bad;
      btn.classList.add(ok ? "right" : "wrong");
      const badBtn = $$(".wbtn", stage).find(x => pieces[+x.dataset.k].bad);
      badBtn.classList.add("found"); badBtn.innerHTML = `<s>${esc(wrong)}</s> → ${esc(c.right)}`;
      done(ok, { msg: `'${esc(wrong)}' → '${esc(c.right)}'`, hint: c.hint });
    });
  }
});

/* ========== 5. 형태 바꾸기 (말해보카) ========== */
const BE_FORMS = new Set(["am", "is", "are", "was", "were"]);
const GER_PREV = new Set("like likes liked love loves loved enjoy enjoys enjoyed hate finish finished stop stopped keep kept start started about for of at by without in on".split(" "));
function formSlot(it) {
  if (it._form !== undefined) return it._form;
  const toks = SG.tokens(it.en);
  const mk = (i, kind) => {
    const right = toks[i].core, base = SG.baseOf(lc(right));
    if (!base || base === lc(right)) return null;
    return { i, right, base, kind };
  };
  if (it.src === "gr" && !/\s/.test(it.target)) {
    const c = SG.candidates(it)[0];
    if (c) { const f = mk(c.i, "gr"); if (f) return (it._form = f); }
  }
  const list = [];
  toks.forEach((t, i) => {
    const w = lc(t.core); if (!/^[a-z]+$/.test(w)) return;
    const base = SG.baseOf(w); if (!base || base === w) return;
    const p = i ? lc(toks[i - 1].core) : "";
    const prevClean = i ? !/[,.!?;:]$/.test(toks[i - 1].raw) : false;
    if (BE_FORMS.has(w) && i > 0 && prevClean) list.push(mk(i, "be"));
    else if (SG.LEX.irrPast[w] && i > 0) list.push(mk(i, "irr"));
    else if (/ing$/.test(w) && (BE_FORMS.has(p) || /['’](m|re|s)$/.test(toks[i - 1] ? toks[i - 1].core : "") || GER_PREV.has(p) || i === 0)) list.push(mk(i, "ing"));
    else if (/s$/.test(w) && ["he", "she", "it"].includes(p) && prevClean) list.push(mk(i, "s3"));
    else if (/ed$/.test(w) && i > 0 && prevClean) list.push(mk(i, "ed"));
  });
  const ok = list.filter(Boolean);
  return (it._form = ok.length ? ok[Math.random() * ok.length | 0] : null);
}
const FORM_HINT = {
  be: "be동사: 주어(I/단수/복수)와 시제(현재/과거)를 함께 봐요",
  irr: "불규칙 동사는 형태를 따로 외워요",
  ing: "be동사 뒤 진행형, 또는 '~하는 것'(동명사)은 동사-ing",
  s3: "주어가 he/she/it이고 현재면 동사에 -s/-es",
  ed: "과거·완료·수동태에는 동사-ed (과거분사)",
  gr: ""
};
G({
  id: "form", emoji: "✏️", name: "형태 바꾸기", bench: "말해보카",
  desc: "괄호 속 동사원형을 문장에 맞는 형태로 직접 써요. 틀리면 이유를 콕 집어 알려 줘요.",
  need: "동사 형태가 바뀌는 문장(과거·진행·3인칭 등)이 필요해요.",
  ok: it => !!formSlot(it),
  render(it, stage, done) {
    const f = formSlot(it); it._form = undefined; // 다음 번엔 다른 자리가 나올 수 있게
    const toks = SG.tokens(it.en);
    const html = toks.map((t, i) => i === f.i ? `${esc(t.pre)}<input class="fill big" id="fin" size="${Math.max(5, f.right.length + 1)}" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="${esc(f.base)}">${esc(t.post)}` : esc(t.raw)).join(" ");
    stage.innerHTML = `${it.speaker ? `<p class="spk-line">💬 ${esc(it.speaker)}</p>` : ""}
      <p class="q-sent">${html}</p>
      <p class="base-tag">( <b>${esc(f.base)}</b> ) → 알맞은 형태로</p>
      <p class="prompt-ko small">${esc(it.ko)}</p>
      <div class="row-btns c"><button class="btn navy big" id="go">확인</button></div>`;
    const inp = $("#fin", stage);
    setTimeout(() => inp.focus(), 50);
    const check = () => {
      const v = lc(inp.value.trim()); if (!v) { inp.focus(); return; }
      $("#go", stage).disabled = true;
      const right = lc(f.right);
      const irr = SG.LEX.irrBase[f.base];
      const alts = new Set([right]);
      if (irr) for (const r of Object.values(SG.UNITS).flatMap(U => U.irr)) if (lc(r[0]) === f.base) [r[1], r[2]].forEach(x => { const parts = lc(x).split("/").map(s => s.trim()); if (parts.includes(right)) parts.forEach(p => alts.add(p)); });
      const ok = alts.has(v);
      inp.classList.add(ok ? "right" : "wrong"); inp.disabled = true;
      let msg = "";
      if (!ok) {
        if (v === f.base) msg = `원형 '${esc(f.base)}' 그대로는 안 돼요 → <b>${esc(f.right)}</b>`;
        else if (SG.formsOf(f.base).includes(v)) msg = `'${esc(v)}'도 ${esc(f.base)}의 형태지만, 이 문장에는 <b>${esc(f.right)}</b>`;
        else msg = `철자를 확인해요 → <b>${esc(f.right)}</b>`;
      }
      let hint = f.kind === "gr" ? it.grammar : FORM_HINT[f.kind];
      if (f.kind === "irr" && irr) hint = "불규칙 동사: " + irr.line;
      done(ok, { msg, hint });
    };
    $("#go", stage).onclick = check;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); check(); } });
  }
});

/* ========== 6. 받아쓰기 (Cake) ========== */
G({
  id: "dictation", emoji: "🎧", name: "받아쓰기", bench: "Cake · 쉐도잉",
  desc: "소리만 듣고 문장을 써요. 느리게 듣기·3번 반복 가능. 틀린 낱말만 빨갛게 보여 줘요.",
  ok: it => wc(it) >= 3 && wc(it) <= 18,
  render(it, stage, done) {
    if (!SG.TTS.ok) { stage.innerHTML = `<p>이 브라우저는 읽어 주기를 지원하지 않아요. 크롬에서 열어 주세요.</p>`; return; }
    const id = SG.sayId(it.en);
    stage.innerHTML = `<p class="muted small">잘 듣고 들리는 문장을 그대로 써요. (대소문자·문장부호는 채점하지 않아요)</p>
      <div class="listen">
        <button class="btn navy big" data-say="${id}" data-rate="1">🔊 듣기</button>
        <button class="btn big" data-say="${id}" data-rate="0.7">🐢 느리게 0.7</button>
        <button class="btn big" data-say="${id}" data-rate="0.85" data-times="3">🔁 3번</button>
      </div>
      <details class="small"><summary>해석 힌트 보기</summary><p class="prompt-ko">${esc(it.ko)}</p></details>
      <textarea id="dic" rows="3" placeholder="여기에 써요" autocapitalize="sentences" autocomplete="off" spellcheck="false"></textarea>
      <div id="dres" class="diff"></div>
      <div class="row-btns c"><button class="btn navy big" id="go">확인</button></div>`;
    setTimeout(() => SG.TTS.say(it.en, 1), 250);
    $("#go", stage).onclick = () => {
      const v = $("#dic", stage).value; if (!v.trim()) { $("#dic", stage).focus(); return; }
      $("#go", stage).disabled = true;
      const r = SG.diffWords(it.en, v);
      $("#dres", stage).innerHTML = `<p class="small muted">초록 = 맞음 · 빨강 = 빠졌거나 틀림 · 회색 줄 = 필요 없는 낱말</p>${r.html}`;
      done(r.ok, { msg: r.ok ? "" : `${r.n}낱말 중 ${r.hit}개 맞음` });
    };
  }
});

/* ========== 7. 대화 이어가기 (In Context) ========== */
G({
  id: "next", emoji: "💬", name: "대화 이어가기", bench: "In Context 대화",
  desc: "대화를 읽고 다음에 올 말을 골라요. 자료에서 '대화'를 고르면 나와요.",
  need: "자료에서 '대화'를 골라 주세요.",
  ok: it => it.src === "c" && it.order >= 1 && wc(it) >= 2,
  render(it, stage, done) {
    const prev = it.dlg.slice(Math.max(0, it.order - 3), it.order);
    const others = [];
    for (const U of shuffle(Object.values(SG.UNITS))) { if (U.key === it.unit) continue; for (const x of shuffle(U.c)) { if (wc(x) >= 3 && Math.abs(wc(x) - wc(it)) <= 6 && lc(x.en) !== lc(it.en)) { others.push(x); break; } } if (others.length >= 2) break; }
    const opts = shuffle([it].concat(others));
    const spk = {}; let side = 0;
    const sideOf = s => (s in spk) ? spk[s] : (spk[s] = (side++) % 2);
    stage.innerHTML = `<div class="chat">${prev.map(x => `<div class="bub s${sideOf(x.speaker)}"><b>${esc(x.speaker)}</b>${esc(x.en)}</div>`).join("")}
      <div class="bub s${sideOf(it.speaker)} q"><b>${esc(it.speaker)}</b>❓</div></div>
      <div class="opts col">${opts.map((o, k) => `<button class="opt" data-k="${k}">${esc(o.en)}</button>`).join("")}</div>`;
    $$(".opt", stage).forEach(btn => btn.onclick = () => {
      const ok = opts[+btn.dataset.k] === it;
      btn.classList.add(ok ? "right" : "wrong");
      if (!ok) $$(".opt", stage)[opts.indexOf(it)].classList.add("right");
      done(ok, { msg: ok ? "" : "흐름에 맞는 말을 다시 확인해요." });
    });
  }
});

/* ========== 8. 순서 맞추기 ========== */
G({
  id: "order", emoji: "🔢", name: "순서 맞추기", bench: "내신 글의 순서",
  desc: "첫 문장 다음에 이어질 문장들을 순서대로 눌러요. 본문·대화 흐름 익히기!",
  need: "본문이나 대화를 골라 주세요(연속된 문장이 4개 이상 필요해요).",
  ok: it => it.src === "r" || it.src === "c" || it.src === "t",
  prepare(pool, n) {
    const by = {};
    for (const it of pool) { const k = it.src === "r" ? `${it.unit}-r-${it.chapter}` : it.src === "c" ? `${it.unit}-c` : `t-${it.set}`; (by[k] = by[k] || []).push(it); }
    let wins = [];
    for (const list of Object.values(by)) {
      list.sort((a, b) => a.order - b.order);
      for (let i = 0; i + 4 <= list.length; i += 4) wins.push(list.slice(i, i + 4));
    }
    if (!wins.length) { // 장 단위로 모자라면 단원 전체에서
      const by2 = {}; for (const it of pool) { const k = it.unit + it.src; (by2[k] = by2[k] || []).push(it); }
      for (const list of Object.values(by2)) { list.sort((a, b) => a.order - b.order); for (let i = 0; i + 4 <= list.length; i += 4) wins.push(list.slice(i, i + 4)); }
    }
    wins = shuffle(wins).slice(0, Math.max(3, Math.round(n / 3)));
    return wins.map(lines => ({ id: lines[0].id + "-w", lines, en: lines.map(l => l.en).join(" "), ko: lines.map(l => l.ko).join(" "), grammar: "" }));
  },
  noteItems: w => w.lines, noAnswer: true,
  render(w, stage, done) {
    const rest = w.lines.slice(1);
    let mix = shuffle(rest); let guard = 0;
    while (mix.every((x, i) => x === rest[i]) && guard++ < 10) mix = shuffle(rest);
    const picked = [];
    const line = x => `${x.speaker ? `<b class="spk">${esc(x.speaker)}</b> ` : ""}${esc(x.en)}`;
    const draw = () => {
      stage.innerHTML = `<p class="muted small">첫 문장 다음에 올 순서대로 눌러요. 다시 누르면 빠져요.</p>
        <ol class="olist"><li class="fixed">${line(w.lines[0])}</li>${picked.map((x, k) => `<li><button class="tile in wide" data-p="${k}">${line(x)}</button></li>`).join("")}</ol>
        <div class="bank col">${mix.map((x, k) => picked.includes(x) ? "" : `<button class="tile wide" data-m="${k}">${line(x)}</button>`).join("")}</div>
        <div class="row-btns c"><button class="btn navy big" id="go" ${picked.length === rest.length ? "" : "disabled"}>확인</button></div>`;
      $$("[data-m]", stage).forEach(b => b.onclick = () => { picked.push(mix[+b.dataset.m]); draw(); });
      $$("[data-p]", stage).forEach(b => b.onclick = () => { picked.splice(+b.dataset.p, 1); draw(); });
      $("#go", stage).onclick = () => {
        const ok = picked.every((x, i) => x === rest[i]);
        stage.innerHTML = `<ol class="olist">${w.lines.map((x, i) => `<li class="${i === 0 ? "fixed" : picked[i - 1] === x ? "good" : "badli"}">${line(x)}<br><span class="muted small">${esc(x.ko)}</span></li>`).join("")}</ol>`;
        done(ok, { msg: ok ? "" : "올바른 순서를 확인해요." });
      };
    };
    draw();
  }
});

/* ========== 9. 스피드 매칭 ========== */
G({
  id: "match", emoji: "⚡", name: "스피드 매칭", bench: "퀴즐렛 매치",
  desc: "영어 문장과 한국어 뜻을 짝지어요. 5쌍씩, 빠르고 정확하게!",
  ok: it => it.ko && wc(it) >= 2 && wc(it) <= 14,
  prepare(pool, n) {
    const list = shuffle(pool).slice(0, Math.max(10, n));
    const groups = [];
    for (let i = 0; i < list.length; i += 5) { const g = list.slice(i, i + 5); if (g.length >= 3) groups.push(g); else if (groups.length) groups[groups.length - 1].push(...g); else groups.push(g); }
    return groups.map((g, k) => ({ id: "m" + k + "-" + g[0].id, group: g, en: "", ko: "", grammar: "" }));
  },
  noAnswer: true,
  noteItems: m => m.missedItems && m.missedItems.length ? m.missedItems : m.group,
  render(m, stage, done) {
    m.missedItems = [];
    const L = shuffle(m.group), R = shuffle(m.group);
    let sel = null, left = m.group.length; const t0 = Date.now();
    stage.innerHTML = `<p class="muted small">왼쪽 영어와 오른쪽 뜻을 하나씩 눌러 짝지어요. <span id="clock" class="pill">0초</span></p>
      <div class="match"><div class="mcol">${L.map(x => `<button class="mbtn" data-side="L" data-id="${x.id}">${esc(x.en)}</button>`).join("")}</div>
      <div class="mcol">${R.map(x => `<button class="mbtn ko" data-side="R" data-id="${x.id}">${esc(x.ko)}</button>`).join("")}</div></div>`;
    const clock = setInterval(() => { const c = $("#clock", stage); if (!c) return clearInterval(clock); c.textContent = Math.round((Date.now() - t0) / 1000) + "초"; }, 500);
    $$(".mbtn", stage).forEach(b => b.onclick = () => {
      if (b.classList.contains("done")) return;
      if (!sel || sel.dataset.side === b.dataset.side) { if (sel) sel.classList.remove("sel"); sel = b; b.classList.add("sel"); if (b.dataset.side === "L") SG.TTS.say(SG.ITEMS[b.dataset.id] ? SG.ITEMS[b.dataset.id].en : b.textContent, 1); return; }
      const a = sel; sel = null; a.classList.remove("sel");
      if (a.dataset.id === b.dataset.id) { a.classList.add("done"); b.classList.add("done"); left--; if (!left) { clearInterval(clock); const sec = Math.round((Date.now() - t0) / 1000); done(!m.missedItems.length, { msg: `${sec}초!` }); } }
      else {
        [a, b].forEach(x => { x.classList.add("shake"); setTimeout(() => x.classList.remove("shake"), 450); });
        const it = m.group.find(x => x.id === (a.dataset.side === "L" ? a.dataset.id : b.dataset.id));
        if (it && !m.missedItems.includes(it)) m.missedItems.push(it);
      }
    });
  }
});
})();
