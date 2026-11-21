/* MY Sentence Gym · 문장 체육관 — 공통 기능
 * 자료: ../textbook/data/<학년>-<단원>.js (YBM 박준언 중1·2 본문·In Context 대화) + data/grammar.js (Language 페이지 예문)
 * 기록: 이 기기 브라우저(localStorage)에만 저장. 로그인·서버 저장 없음.
 */
(function () {
"use strict";
const SG = window.SG = {};
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
SG.$ = $; SG.$$ = $$;

/* ---------- 작은 도구 ---------- */
const esc = SG.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
SG.shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
SG.pick = a => a[Math.random() * a.length | 0];
const LS = SG.LS = {
  get(k, d) { try { const v = localStorage.getItem("sg_" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("sg_" + k, JSON.stringify(v)); } catch (e) { } }
};
// 비교용 정규화: 굽은 따옴표, 대소문자, 문장부호
const plain = SG.plain = s => String(s).replace(/[’‘`]/g, "'").replace(/[“”]/g, '"');
SG.normWord = w => plain(w).toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
SG.words = s => plain(s).split(/\s+/).map(SG.normWord).filter(Boolean);
SG.toast = (msg, ms = 1800) => { const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden"); clearTimeout(t._h); t._h = setTimeout(() => t.classList.add("hidden"), ms); };
SG.stripStar = s => String(s || "").replace(/★\s*/g, "");

/* ---------- 문장 소리 (Web Speech API) ---------- */
const TTS = SG.TTS = {
  voice: null,
  ok: "speechSynthesis" in window,
  init() {
    if (!this.ok) return;
    const pickV = () => {
      const vs = speechSynthesis.getVoices().filter(v => /^en(-|_)/i.test(v.lang));
      this.voice = vs.find(v => /en-US/i.test(v.lang) && /Google|Samantha|Natural/i.test(v.name)) || vs.find(v => /en-US/i.test(v.lang)) || vs[0] || null;
    };
    pickV(); speechSynthesis.onvoiceschanged = pickV;
  },
  say(text, rate = 1, times = 1) {
    if (!this.ok) { SG.toast("이 브라우저는 읽어 주기를 지원하지 않아요"); return; }
    speechSynthesis.cancel();
    const t = plain(text).replace(/\s*\/\s*/g, " ");
    for (let i = 0; i < times; i++) {
      const u = new SpeechSynthesisUtterance(t);
      u.lang = "en-US"; u.rate = rate; if (this.voice) u.voice = this.voice;
      speechSynthesis.speak(u);
    }
  }
};
const SAY = [];
SG.sayId = text => { SAY.push(text); return SAY.length - 1; };
// 문장 옆 소리 막대: [1.0x] [0.7x] [×3]
SG.ttsBar = (text, compact) => {
  const id = SG.sayId(text);
  return `<span class="tts${compact ? " compact" : ""}"><button class="tbtn" data-say="${id}" data-rate="1" title="보통 속도">🔊${compact ? "" : " 1.0"}</button><button class="tbtn" data-say="${id}" data-rate="0.7" title="느리게">🐢${compact ? "" : " 0.7"}</button><button class="tbtn" data-say="${id}" data-rate="0.9" data-times="3" title="세 번 반복">🔁${compact ? "" : " ×3"}</button></span>`;
};
document.addEventListener("click", e => {
  const b = e.target.closest("[data-say]"); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  TTS.say(SAY[+b.dataset.say] || "", +(b.dataset.rate || 1), +(b.dataset.times || 1));
});

/* ---------- 자료 불러오기 ---------- */
const RAW = {};
window.lessonLoaded = (g, u, d) => { RAW[g + "-" + u] = d; };
const loadScript = src => new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => rej(new Error(src)); document.head.appendChild(s); });
SG.UNITS = {};     // "1-3": {key,g,u,title,unitTitle,grammar:[..],r:[],c:[],gr:[],irr:[]}
SG.ITEMS = {};     // id → item
SG.KEYS = [];
const SKIP_TAGS = new Set(["제목", "부제", "소제목", "날짜"]);

SG.load = async () => {
  await loadScript("../textbook/data/catalog.js?v=1");
  const cat = (typeof catalog !== "undefined") ? catalog : window.catalog; // eslint-disable-line no-undef
  const keys = [];
  for (const g of ["1", "2"]) for (const m of (cat[g] || [])) keys.push([g, m]);
  await Promise.all(keys.map(([g, m]) => loadScript(`../textbook/data/${g}-${m.number}.js?v=1`).catch(() => null)));
  for (const [g, m] of keys) {
    const key = g + "-" + m.number, d = RAW[key]; if (!d) continue;
    const U = { key, g: +g, u: m.number, title: m.readingTitle, unitTitle: m.unitTitle, grammar: m.coreGrammar || [], r: [], c: [], gr: [], irr: d.irregulars || [] };
    (d.sentences || []).forEach(s => {
      if (SKIP_TAGS.has(s.tag) || SG.words(s.en).length < 3) return;
      add(U, "r", { id: `${key}-r${s.id}`, en: s.en, ko: s.ko, chunk: s.chunk, grammar: SG.stripStar(s.grammar), vocab: s.vocab, tag: s.tag, chapter: s.chapter, order: s.id });
    });
    (d.context || []).forEach((s, i) => {
      add(U, "c", { id: `${key}-c${i}`, en: s.en, ko: s.ko, speaker: s.speaker, grammar: SG.stripStar(s.grammar), vocab: s.vocab, order: i });
    });
    const G = (window.SG_GRAMMAR || {})[key];
    if (G) G.s.forEach((x, i) => {
      add(U, "gr", { id: `${key}-g${i}`, en: x[1], ko: x[2], target: x[3], wrongs: x[4], point: U.grammar[x[0]] || "", grammar: G.h[x[0]] || "", order: i });
    });
    SG.UNITS[key] = U; SG.KEYS.push(key);
  }
  SG.buildLex();
  loadCustomSets();
};
function add(U, src, it) {
  it.src = src; it.unit = U.key; it.g = U.g; it.u = U.u;
  if (src === "c") it.dlg = U.c; // 대화 묶음
  U[src].push(it); SG.ITEMS[it.id] = it;
}
SG.SRC_NAME = { r: "본문", c: "대화", gr: "문법", t: "내 세트" };

/* ---------- 내 문장 세트 (선생님이 붙여 넣은 문장) ---------- */
function loadCustomSets() {
  for (const set of LS.get("sets", [])) registerSet(set);
}
const registerSet = SG.registerSet = set => {
  const groups = (set.groups || []).map(g => g.map(w => w.toLowerCase()));
  set.items = set.lines.map((l, i) => {
    const it = { id: `t-${set.id}-${i}`, src: "t", set: set.id, en: l[0], ko: l[1] || "", grammar: "", groups, order: i };
    SG.ITEMS[it.id] = it; return it;
  });
  return set;
};
SG.sets = () => LS.get("sets", []).map(s => { const items = s.lines.map((l, i) => SG.ITEMS[`t-${s.id}-${i}`]).filter(Boolean); return { ...s, items }; });

/* ---------- 고른 범위의 문장 ---------- */
SG.pickState = () => {
  const p = LS.get("pick", null) || {};
  return { g: p.g || 1, units: p.units && p.units.length ? p.units : ["1-1"], src: p.src || { r: 1, c: 1, gr: 1 }, n: p.n || 10, set: p.set || null };
};
SG.savePick = p => LS.set("pick", p);
SG.pool = (p = SG.pickState()) => {
  if (p.set) { const s = SG.sets().find(x => x.id === p.set); if (s) return s.items.slice(); }
  const out = [];
  for (const k of p.units) { const U = SG.UNITS[k]; if (!U) continue; for (const s of ["r", "c", "gr"]) if (p.src[s]) out.push(...U[s]); }
  return out;
};
SG.rangeLabel = (p = SG.pickState()) => {
  if (p.set) { const s = SG.sets().find(x => x.id === p.set); if (s) return "📝 " + s.title; }
  const src = ["r", "c", "gr"].filter(s => p.src[s]).map(s => SG.SRC_NAME[s]).join("·");
  return `${p.units.map(k => k.replace("-", "학년 ") + "과").join(", ")} · ${src}`;
};

/* ---------- 오답 노트·기록 ---------- */
SG.note = {
  all() { return LS.get("wrong", {}); },
  add(it) { const w = this.all(); w[it.id] = { n: ((w[it.id] || {}).n || 0) + 1, t: Date.now() }; LS.set("wrong", w); },
  remove(id) { const w = this.all(); delete w[id]; LS.set("wrong", w); },
  items() { const w = this.all(); return Object.keys(w).map(id => SG.ITEMS[id]).filter(Boolean).sort((a, b) => w[b.id].t - w[a.id].t); }
};
SG.stats = {
  all() { return LS.get("stats", {}); },
  save(game, pct) { const s = this.all(); const x = s[game] || { plays: 0, best: 0 }; x.plays++; x.best = Math.max(x.best, pct); s[game] = x; LS.set("stats", s); }
};

/* ---------- 세션 엔진: 틀린 문장은 끝에서 다시, 모두 통과해야 클리어 ---------- */
SG.runSession = (game, items, opts = {}) => {
  const main = $("#main");
  const S = { game, total: items.length, queue: items.map(it => ({ it, missed: false })), firstOk: 0, cleared: 0, misses: [], startedAt: Date.now(), review: !!opts.review };
  const next = () => {
    if (!S.queue.length) return finish();
    const cur = S.queue.shift();
    const left = S.queue.length + 1, retry = S.queue.filter(q => q.missed).length + (cur.missed ? 1 : 0);
    main.innerHTML = `<div class="play-top">
        <a class="btn sm" href="#/">✕ 그만</a>
        <div class="bar"><i style="width:${Math.round(S.cleared / S.total * 100)}%"></i></div>
        <span class="pill">${left}문제 남음</span>${retry ? `<span class="pill bad">다시 ${retry}</span>` : ""}
      </div>
      <h2 class="game-title">${game.emoji} ${esc(game.name)}</h2>
      <div class="card play-card" id="stage"></div>`;
    const stage = $("#stage");
    if (cur.missed) stage.insertAdjacentHTML("beforebegin", `<div class="retry-flag">🔁 아까 틀린 문장이에요. 이번엔 맞혀 봐요!</div>`);
    game.render(cur.it, stage, (ok, fb) => {
      const noteItems = game.noteItems ? game.noteItems(cur.it) : [cur.it];
      if (ok) {
        S.cleared++;
        if (!cur.missed) { S.firstOk++; if (S.review) noteItems.forEach(x => SG.note.remove(x.id)); }
      } else {
        if (!cur.missed) { cur.missed = true; S.misses.push(...noteItems); noteItems.forEach(x => SG.note.add(x)); }
        S.queue.push(cur);
      }
      showFeedback(stage, ok, fb || {}, cur.it, next, game);
    });
  };
  const finish = () => {
    const pct = S.total ? Math.round(S.firstOk / S.total * 100) : 0;
    SG.stats.save(game.id, pct);
    const stars = pct >= 90 ? "⭐⭐⭐" : pct >= 70 ? "⭐⭐" : "⭐";
    const sec = Math.round((Date.now() - S.startedAt) / 1000);
    main.innerHTML = `<div class="card center finish">
      <div class="big-emoji">${pct === 100 ? "🏆" : "🎉"}</div>
      <h2>${esc(game.name)} 클리어!</h2>
      <p class="stars">${stars}</p>
      <p>처음에 맞힌 문장 <b>${S.firstOk}</b> / ${S.total} (${pct}%) · ${Math.floor(sec / 60)}분 ${sec % 60}초</p>
      ${S.misses.length ? `<p class="muted small">틀렸던 ${S.misses.length}문장은 오답 노트에 담았어요. 끝까지 다시 풀어서 모두 통과했어요!</p>
        <ul class="miss-list">${S.misses.map(it => `<li>${SG.ttsBar(it.en, true)} <span>${esc(it.en)}</span><br><span class="muted small">${esc(it.ko)}</span></li>`).join("")}</ul>` : `<p class="muted">한 번도 안 틀렸어요. 완벽해요!</p>`}
      <div class="row-btns c"><button class="btn navy big" id="again">🔄 한 번 더</button><a class="btn big" href="#/">🏠 다른 게임</a></div>
    </div>`;
    $("#again").onclick = () => SG.route(true);
  };
  next();
};
function showFeedback(stage, ok, fb, it, next, game) {
  const showAns = !game.noAnswer && it.en;
  const box = document.createElement("div");
  box.className = "feedback " + (ok ? "ok" : "bad");
  const hint = fb.hint ? `<p class="hint">💡 ${esc(fb.hint)}</p>` : "";
  const exp = !ok && it.grammar && it.grammar !== fb.hint ? `<p class="exp">📘 ${esc(it.grammar)}</p>` : "";
  box.innerHTML = `<div class="fb-head">${ok ? "⭕ 정답!" : "❌ 아쉬워요"}${fb.msg ? ` <span>${fb.msg}</span>` : ""}</div>
    ${hint}${exp}
    ${showAns ? `<div class="answer">${SG.ttsBar(it.en)} <b>${esc(it.en)}</b><br><span class="muted">${esc(it.ko)}</span></div>` : ""}
    ${!ok ? `<p class="small muted">이 문제는 끝에 한 번 더 나와요.</p>` : ""}
    <div class="row-btns c"><button class="btn navy big" id="nextBtn">다음 ▶</button></div>`;
  stage.appendChild(box);
  $$("button.opt, .tile, .wbtn, input.fill, textarea", stage).forEach(b => { if (!box.contains(b)) b.disabled = true; });
  const nb = $("#nextBtn"); nb.focus({ preventScroll: true });
  box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  nb.onclick = next;
  if (ok && showAns && LS.get("autoSay", true)) TTS.say(it.en, 1);
}

/* ---------- 문법 오답 보기 만들기 ---------- */
// 그 자리에 넣으면 '문법적으로 틀리는' 보기만 만든다 → 정답은 하나.
const VERB_LIST = ("accept act add agree allow answer arrive ask bake be become begin believe borrow bring brush build buy call carry catch change chat check cheer choose clean climb close collect come connect cook count create cry cut dance decide design die discover do draw dream drink drive drop eat enjoy enter experience explain fall feel fight fill find finish fix fly follow forget freeze get give go grow guess happen hate have hear help hide hit hold hope hug hurt imagine improve introduce invite join jump keep kick know laugh learn leave lend let like listen live look lose love make manage meet miss mix move need open order paint pass pay pick plan plant play post practice prepare press protect pull push put rain reach read record reduce relax remember repeat rest return ride ring run save say see sell send set share shop shout show sing sit sleep smell smile snore solve speak spend stand start stay stop stretch study swim take talk taste teach tell thank think throw tidy touch travel trust try turn understand use visit wait wake walk want wash watch water wear win wish work worry write").split(" ");
const VALID_REG = new Set("lie pay dream learn burn spell smell spill light wake hang dive shine prove show mow sew swell spoil leap kneel dwell lean knit speed fit wet quit bet".split(" "));
const DOUBLE = new Set("run sit swim stop get put cut shop plan chat begin hit jog win set drop clap nod hug skip step rub dig wrap forget".split(" "));
const NOUNISH_AFTER_TO = new Set("water work light rain snow fish place face change dance".split(" "));
const MODAL_WORDS = new Set("can could will would shall should may might must".split(" "));
const NOT_SUP = new Set("contest interest forest request harvest honest modest protest suggest arrest digest".split(" "));
const COLLECTIVE = new Set("family team class group club data staff audience crowd police people".split(" "));
const MODALS = new Set("can can't cannot will won't would wouldn't should shouldn't must may might could couldn't to don't doesn't didn't let's".split(" "));
const BE = { am: ["is", "are"], is: ["are"], are: ["is"], was: ["were"], were: ["was"] };
const AUX = { "don't": ["doesn't"], "doesn't": ["don't"], do: ["does"], does: ["do"], has: ["have"], have: ["has"] };
const PRON = { i: ["me"], me: ["I"], he: ["him"], him: ["he"], she: ["her"], her: ["she"], they: ["them"], them: ["they"], we: ["us"], us: ["we"], his: ["him"], their: ["them"], my: ["me"], our: ["us"] };
const DEM = { this: ["these"], these: ["this"], that: ["those"], those: ["that"] };
const HINT = {
  be: "be동사는 주어에 맞춰요: I–am, 단수–is/was, 복수·you–are/were",
  an: "a/an: 모음 소리 앞에는 an, 자음 소리 앞에는 a",
  aux: "do/does·have/has: 3인칭 단수 주어(he/she/it/단수 명사)에는 does·has",
  pron: "대명사 자리: 주어(I/he/she/we/they) · 목적어(me/him/her/us/them) · 소유격(my/his/her/our/their)",
  dem: "this/that + 단수, these/those + 복수",
  modal: "조동사(can/will…)·to·don't/didn't 뒤에는 동사원형",
  s3: "주어가 he/she/it이면 현재형 동사에 -s/-es",
  base: "주어가 I/you/we/they이면 현재형 동사에 -s를 붙이지 않아요",
  cmp: "비교급 + than: -er 또는 more ~ (둘을 함께 쓰지 않아요)",
  sup: "최상급: the + -est 또는 the most ~"
};
const PRIORITY = ["custom", "gr", "irr", "modal", "s3", "base", "be", "cmp", "sup", "aux", "dem", "pron", "an"];
const LEX = { irrPast: {}, base: new Set(VERB_LIST), forms: {}, irrBase: {} };

const s3 = v => v === "have" ? "has" : v === "be" ? "is" : /(s|sh|ch|x|z|o)$/.test(v) ? v + "es" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ies" : v + "s";
const reg = v => /e$/.test(v) ? v + "d" : /[^aeiou]y$/.test(v) ? v.slice(0, -1) + "ied" : DOUBLE.has(v) ? v + v.slice(-1) + "ed" : v + "ed";
const ing = v => v === "be" ? "being" : /ie$/.test(v) ? v.slice(0, -2) + "ying" : /[^aeio]e$/.test(v) && !/(ee|ye|oe)$/.test(v) ? v.slice(0, -1) + "ing" : DOUBLE.has(v) ? v + v.slice(-1) + "ing" : v + "ing";
const pastOf = v => (LEX.irrBase[v] && LEX.irrBase[v].past) || reg(v);
const deS = w => /ies$/.test(w) ? w.slice(0, -3) + "y" : /(ss|sh|ch|x|z|o)es$/.test(w) ? w.slice(0, -2) : /s$/.test(w) ? w.slice(0, -1) : null;
SG.s3 = s3; SG.ing = ing;

SG.buildLex = () => {
  for (const U of Object.values(SG.UNITS)) for (const r of U.irr) {
    const base = String(r[0]).toLowerCase().trim();
    const past = String(r[1]).toLowerCase().split("/").map(x => x.trim()).filter(Boolean);
    const pp = String(r[2]).toLowerCase().split("/").map(x => x.trim()).filter(Boolean);
    if (!/^[a-z]+$/.test(base) || base === "be" || MODAL_WORDS.has(base)) continue;
    LEX.base.add(base);
    LEX.irrBase[base] = { past: past[0], pp: pp[0], line: `${r[0]} – ${r[1]} – ${r[2]}` };
    for (const f of past.concat(pp)) if (f !== base && /^[a-z]+$/.test(f)) LEX.irrPast[f] = base;
  }
  for (const v of LEX.base) {
    const fs = new Set([v, s3(v), ing(v), pastOf(v), (LEX.irrBase[v] || {}).pp || reg(v)]);
    for (const f of fs) if (!LEX.forms[f] || f === v) LEX.forms[f] = v;
    LEX.forms[v] = v;
  }
  for (const f of ["am", "is", "are", "was", "were", "been", "being"]) LEX.forms[f] = "be";
  SG.LEX = LEX;
};
SG.baseOf = w => LEX.forms[String(w).toLowerCase()] || null;
SG.formsOf = base => {
  if (base === "be") return ["be", "am", "is", "are", "was", "were", "been", "being"];
  const x = LEX.irrBase[base] || {};
  return Array.from(new Set([base, s3(base), ing(base), pastOf(base), x.pp || reg(base)]));
};

// 문장을 낱말 토큰으로: {raw, pre, core, post}
SG.tokens = en => String(en).trim().split(/\s+/).map(raw => {
  const m = raw.match(/^([("“‘¿¡\[]*)(.*?)([.,!?;:")\]”…]*)$/) || ["", "", raw, ""];
  return { raw, pre: m[1], core: m[2], post: m[3] };
});
const lc = s => plain(s).toLowerCase();
const capAt = (toks, i) => i === 0 || /[.!?"“:]$/.test(toks[i - 1].raw);
const fitCase = (word, toks, i) => {
  if (word === "I") return "I";
  if (capAt(toks, i)) return word.charAt(0).toUpperCase() + word.slice(1);
  return /^I$/.test(toks[i].core) ? word : word.charAt(0).toLowerCase() + word.slice(1);
};
function findSpan(toks, target) {
  const tw = lc(target).split(/\s+/);
  for (let i = 0; i + tw.length <= toks.length; i++) {
    let ok = true;
    for (let k = 0; k < tw.length; k++) if (lc(toks[i + k].core) !== tw[k]) { ok = false; break; }
    if (ok) return [i, i + tw.length];
  }
  return null;
}

// 문장 하나에서 바꿀 수 있는 자리 목록
SG.candidates = it => {
  if (it._cands) return it._cands;
  const toks = SG.tokens(it.en), out = [];
  const push = (i, wrongs, kind, hint, j = i + 1) => {
    const right = toks.slice(i, j).map(t => t.core).join(" ");
    wrongs = Array.from(new Set(wrongs.filter(w => w && lc(w) !== lc(right)))).map(w => j - i === 1 ? fitCase(w, toks, i) : w);
    if (!wrongs.length || out.some(c => i < c.j && c.i < j)) return;
    out.push({ i, j, right, wrongs, kind, hint });
  };
  if (it.src === "gr") {
    const sp = findSpan(toks, it.target);
    if (sp) push(sp[0], it.wrongs, "gr", it.grammar, sp[1]);
    return (it._cands = out);
  }
  const found = [];
  toks.forEach((t, i) => {
    const w = lc(t.core); if (!/^[a-z']+$/.test(w)) return;
    const p = i > 0 ? lc(toks[i - 1].core) : "", p2 = i > 1 ? lc(toks[i - 2].core) : "";
    const n = i + 1 < toks.length ? lc(toks[i + 1].core) : "";
    const endsClause = /[,.!?;:]$/.test(toks[i - 1] ? toks[i - 1].raw : "");
    const prevClean = !endsClause;
    const add = (kind, wrongs, hint) => found.push({ i, wrongs, kind, hint: hint || HINT[kind] });
    // 선생님이 정한 묶음 (예: who/which)
    if (it.groups) for (const g of it.groups) if (g.includes(w)) add("custom", g.filter(x => x !== w), "같은 묶음 중 이 자리에 맞는 말을 골라요: " + g.join(" / "));
    if (BE[w] && prevClean && !COLLECTIVE.has(p)) add("be", BE[w]);
    const modalPrev = MODALS.has(p) ? p : (p === "not" && MODALS.has(p2) ? p2 : (/'ll$/.test(p) ? "will" : ""));
    if (modalPrev && prevClean && LEX.base.has(w) && !(modalPrev === "to" && NOUNISH_AFTER_TO.has(w))) {
      add("modal", w === "be" ? ["is", "are"] : w === "have" ? ["has", "had"] : [s3(w), pastOf(w)].filter(x => x !== w));
      return;
    }
    if (LEX.irrPast[w] && !modalPrev && w !== "did") {
      const b = LEX.irrPast[w];
      if (!VALID_REG.has(b) && reg(b) !== w) add("irr", [reg(b)], "불규칙 동사: " + LEX.irrBase[b].line);
    }
    if (["he", "she", "it"].includes(p) && prevClean) { const b = deS(w); if (b && LEX.base.has(b) && b !== "be" && b !== "have") add("s3", [b]); }
    if (["i", "you", "we", "they"].includes(p) && prevClean && LEX.base.has(w) && w !== "be" && w !== "have" && !LEX.irrPast[w] && !NOUNISH_AFTER_TO.has(w)) add("base", [s3(w)]);
    if (/[a-z]{3,}er$/.test(w) && n === "than") add("cmp", ["more " + w]);
    if (w === "more" && i + 2 < toks.length && lc(toks[i + 2].core) === "than") add("cmp", ["very", "most"]);
    if (/[a-z]{3,}est$/.test(w) && p === "the" && !NOT_SUP.has(w)) add("sup", ["most " + w]);
    if (AUX[w] && prevClean) add("aux", AUX[w]);
    if (DEM[w] && !t.post && n && /^[a-z]/.test(n)) add("dem", DEM[w]);
    if (PRON[w] && i > 0 && !(["and", "than", "as"].includes(p)) && !(w === "me" && i === 0)) add("pron", PRON[w]);
    if ((w === "a" || w === "an") && n && i + 1 < toks.length) add("an", [w === "a" ? "an" : "a"]);
  });
  found.sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind));
  for (const f of found) push(f.i, f.wrongs, f.kind, f.hint);
  return (it._cands = out);
};
// 후보 중 하나 고르기 (앞쪽 우선순위에서 조금 섞어서)
SG.pickCand = it => { const c = SG.candidates(it); if (!c.length) return null; return c[Math.random() * Math.min(2, c.length) | 0]; };
SG.applyCand = (it, cand, wrong) => {
  const toks = SG.tokens(it.en);
  const a = toks[cand.i], b = toks[cand.j - 1];
  const before = toks.slice(0, cand.i).map(t => t.raw), after = toks.slice(cand.j).map(t => t.raw);
  return { before, mid: a.pre + wrong + b.post, midCore: wrong, after };
};

/* ---------- 라우터 ---------- */
SG.GAMES = [];
SG.route = (force) => {
  const h = location.hash.replace(/^#\/?/, "");
  if (h.startsWith("set=")) return importSet(h.slice(4));
  if (TTS.ok) speechSynthesis.cancel();
  const [page, arg] = h.split("/");
  $$(".nav a").forEach(a => a.classList.toggle("on", (a.dataset.r || "") === (page === "play" ? "" : page)));
  window.scrollTo(0, 0);
  if (page === "play" || page === "review-play") return SG.startGame(arg, page === "review-play");
  if (page === "review") return SG.pages.review();
  if (page === "sets") return SG.pages.sets();
  return SG.pages.home();
};
window.addEventListener("hashchange", () => SG.route());

SG.startGame = (gid, review) => {
  const game = SG.GAMES.find(g => g.id === gid);
  if (!game) { location.hash = "#/"; return; }
  let pool = review ? SG.note.items() : SG.pool();
  if (game.page) return game.page(pool, review);
  pool = pool.filter(it => game.ok(it));
  const p = SG.pickState();
  if (!pool.length) {
    $("#main").innerHTML = `<div class="card center"><div class="big-emoji">🙈</div><p>${review ? "오답 노트에" : "고른 범위에"} 이 게임에 맞는 문장이 없어요.</p><p class="muted small">${esc(game.need || "단원이나 자료를 더 골라 보세요.")}</p><div class="row-btns c"><a class="btn navy" href="#/">← 범위 바꾸기</a></div></div>`;
    return;
  }
  const n = review ? Math.min(pool.length, 20) : (p.n === 99 ? pool.length : Math.min(p.n, pool.length));
  const items = (game.prepare ? game.prepare(pool, n) : SG.shuffle(pool).slice(0, n));
  if (!items.length) { $("#main").innerHTML = `<div class="card center"><p>문장이 모자라서 이 게임을 만들 수 없어요.</p><p class="muted small">${esc(game.need || "단원을 더 골라 보세요.")}</p><div class="row-btns c"><a class="btn navy" href="#/">← 범위 바꾸기</a></div></div>`; return; }
  SG.runSession(game, items, { review });
};

/* ---------- 세트 가져오기 (#set=…) ---------- */
SG.encodeSet = set => {
  const json = JSON.stringify({ t: set.title, l: set.lines, g: set.groups || [] });
  const b = btoa(unescape(encodeURIComponent(json)));
  return b.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
function importSet(code) {
  try {
    const json = decodeURIComponent(escape(atob(code.replace(/-/g, "+").replace(/_/g, "/"))));
    const d = JSON.parse(json);
    if (!Array.isArray(d.l) || !d.l.length) throw new Error("empty");
    const lines = d.l.slice(0, 200).map(l => [String(l[0] || "").slice(0, 300), String(l[1] || "").slice(0, 300)]).filter(l => l[0].trim());
    const sets = LS.get("sets", []);
    const sig = JSON.stringify(lines);
    let set = sets.find(s => JSON.stringify(s.lines) === sig);
    if (!set) {
      set = { id: Date.now().toString(36), title: String(d.t || "받은 문장 세트").slice(0, 60), lines, groups: (d.g || []).slice(0, 20).map(g => g.slice(0, 8).map(w => String(w).slice(0, 30))), shared: true };
      sets.push(set); LS.set("sets", sets); registerSet(set);
    }
    const p = SG.pickState(); p.set = set.id; SG.savePick(p);
    SG.toast(`'${set.title}' 문장 세트를 열었어요 (${lines.length}문장)`, 2600);
  } catch (e) { SG.toast("링크가 올바르지 않아요"); }
  history.replaceState(null, "", location.pathname + "#/");
  SG.route();
}

/* ---------- 시작 ---------- */
SG.boot = async () => {
  TTS.init();
  try { await SG.load(); }
  catch (e) { $("#main").innerHTML = `<div class="card center err">교과서 자료를 불러오지 못했어요. 인터넷 연결을 확인하고 새로고침해 주세요.</div>`; return; }
  $("#nav").classList.remove("hidden");
  SG.route();
};
})();
