// MY Word Arcade — 공통 (로그인 · 단어장 · 화면 이동 · 결과 저장 · 내 기록 · 오답 노트)
// 게임 7개는 games.js, 교사 화면은 teacher.js 에 있어요.
(function () {
  "use strict";
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
  var BUILTIN = [{ id: "g1", file: "data/g1.json?v=1" }, { id: "g2", file: "data/g2.json?v=1" }];

  var WA = window.WA = { games: {}, order: [] };
  var $ = WA.$ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = WA.$$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = WA.esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var low = WA.low = function (s) { return String(s || "").toLowerCase().trim(); };
  WA.lget = function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  WA.lset = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  WA.num = function (n) { return Number(n || 0).toLocaleString("ko-KR"); };
  WA.pct = function (a, b) { return b ? Math.round(100 * a / b) : 0; };
  WA.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  WA.sec = function (ms) { var s = Math.round(ms / 1000); return s >= 60 ? Math.floor(s / 60) + "분 " + (s % 60) + "초" : s + "초"; };
  var toastT;
  WA.toast = function (m) { var el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.add("hidden"); }, 2600); };
  WA.overlay = function (html) { var o = $("#overlay"); o.innerHTML = '<div class="card">' + html + "</div>"; o.classList.remove("hidden"); o.onclick = function (e) { if (e.target === o || e.target.closest("[data-close]")) WA.closeOverlay(); }; return o; };
  WA.closeOverlay = function () { var o = $("#overlay"); o.classList.add("hidden"); o.innerHTML = ""; };
  function errMsg(e) {
    var m = (e && (e.message || e.details)) || String(e);
    var map = { WA_CLOSED: "지금은 게임이 닫혀 있어요. 선생님이 열어 주시면 기록이 저장돼요.", WA_DENIED: "학교 계정으로 로그인해 주세요.", WA_LIMIT: "오늘은 너무 많이 했어요. 내일 다시 해요!", WA_BAD: "기록 형식이 맞지 않아요." };
    for (var k in map) if (m.indexOf(k) >= 0) return map[k];
    return m;
  }
  WA.errMsg = errMsg;

  // ======================================================================
  //  단어 다루기
  // ======================================================================
  var POS_RE = /^\s*(n|v|a|ad|adj|adv|prep|conj|pron|int|phr)\.\s*/i;
  var POS_KO = { n: "명사", v: "동사", a: "형용사", adj: "형용사", ad: "부사", adv: "부사", prep: "전치사", conj: "접속사", pron: "대명사", int: "감탄사", phr: "숙어" };
  WA.pos = function (it) { var m = POS_RE.exec(it.ko || "") || POS_RE.exec(it.def || ""); return m ? m[1].toLowerCase() : (/\s/.test(it.w) ? "phr" : ""); };
  WA.posKo = function (it) { return POS_KO[WA.pos(it)] || ""; };
  WA.ko = function (it) { return String(it.ko || "").replace(POS_RE, ""); };
  WA.def = function (it) { return String(it.def || "").replace(POS_RE, "").replace(/^\w/, function (c) { return c.toLowerCase(); }); };
  // "ad, advertisement" → 정답 여러 개
  WA.answers = function (it) { return String(it.w).split(/\s*[,/]\s*/).map(function (s) { return s.replace(/\(.*?\)/g, "").trim(); }).filter(Boolean); };
  WA.main = function (it) { return WA.answers(it)[0]; };
  WA.isPhrase = function (it) { return /\s/.test(WA.main(it)); };
  WA.letters = function (it) { return WA.main(it).toLowerCase().replace(/[^a-z]/g, ""); };
  WA.norm = function (s) { return String(s || "").toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:"“”]/g, "").replace(/\s+/g, " ").trim(); };

  var BE = ["be", "am", "is", "are", "was", "were", "been", "being"];
  var IRR = { leave: "left", shake: "shook shaken", throw: "threw thrown", take: "took taken", fall: "fell fallen", come: "came", make: "made", set: "set", do: "did done does",
    go: "went gone goes", stick: "stuck", get: "got gotten", give: "gave given", have: "had has", see: "saw seen", eat: "ate eaten", write: "wrote written", ride: "rode ridden",
    run: "ran", swim: "swam", sing: "sang sung", buy: "bought", bring: "brought", think: "thought", catch: "caught", teach: "taught", find: "found", hold: "held", keep: "kept",
    sleep: "slept", feel: "felt", meet: "met", send: "sent", spend: "spent", build: "built", lose: "lost", win: "won", tell: "told", sell: "sold", say: "said", pay: "paid",
    lay: "laid", hang: "hung", begin: "began begun", break: "broke broken", choose: "chose chosen", drive: "drove driven", fly: "flew flown", grow: "grew grown", know: "knew known",
    draw: "drew drawn", wear: "wore worn", tear: "tore torn", hide: "hid hidden", bite: "bit bitten", rise: "rose risen", speak: "spoke spoken", steal: "stole stolen",
    wake: "woke woken", forget: "forgot forgotten", understand: "understood", stand: "stood", sit: "sat", lead: "led", feed: "fed", fight: "fought", dig: "dug", light: "lit",
    shoot: "shot", shine: "shone", spin: "spun", swing: "swung", become: "became", put: "put", cut: "cut", hit: "hit", let: "let", hurt: "hurt", cost: "cost", read: "read" };
  function tokMatch(tok, w) {
    tok = tok.toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z'-]/g, ""); w = w.toLowerCase();
    if (!tok) return false;
    if (w === "be") return BE.indexOf(tok) >= 0;
    if (tok === w) return true;
    if (IRR[w] && IRR[w].split(" ").indexOf(tok) >= 0) return true;
    if (w.length <= 3) return tok === w + "s" || tok === w + "ed" || tok === w + "es" || (w.length === 3 && tok.indexOf(w) === 0 && tok.length <= w.length + 3);
    var stem = w.replace(/(e|y)$/, "");
    return tok.indexOf(stem.slice(0, Math.max(3, stem.length - 1))) === 0 && tok.length <= w.length + 4;
  }
  // 예문에서 단어(활용형 포함)를 찾아 빈칸으로: {pre, ans, post} 또는 null
  WA.cloze = function (it) {
    var ex = String(it.ex || ""); if (!ex) return null;
    var toks = ex.split(/\s+/), cands = WA.answers(it);
    for (var c = 0; c < cands.length; c++) {
      var parts = cands[c].split(/\s+/);
      if (parts.some(function (p) { return /^(one's|someone|something|sb|sth|~|A|B)$/.test(p); })) continue;
      for (var i = 0; i + parts.length <= toks.length; i++) {
        var ok = true;
        for (var j = 0; j < parts.length; j++) if (!tokMatch(toks[i + j], parts[j])) { ok = false; break; }
        if (!ok) continue;
        var span = toks.slice(i, i + parts.length).join(" ");
        var m = /^([^A-Za-z]*)(.*?)([^A-Za-z']*)$/.exec(span);
        return { pre: toks.slice(0, i).join(" ") + (i ? " " : "") + m[1], ans: m[2], post: m[3] + (i + parts.length < toks.length ? " " : "") + toks.slice(i + parts.length).join(" ") };
      }
    }
    return null;
  };
  WA.tokens = function (s) { return String(s || "").trim().split(/\s+/).filter(Boolean); };

  // 목소리 (기기에 있는 영어 음성)
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang); });
    voice = vs.filter(function (v) { return /en[-_]US/i.test(v.lang) && /google|samsung|natural/i.test(v.name); })[0] || vs.filter(function (v) { return /en[-_]US/i.test(v.lang); })[0] || vs[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  WA.canSpeak = function () { return !!window.speechSynthesis; };
  WA.say = function (text, slow) {
    if (!window.speechSynthesis) return WA.toast("이 기기에서는 소리를 낼 수 없어요.");
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = "en-US"; if (voice) u.voice = voice; u.rate = slow ? 0.6 : 0.9;
    speechSynthesis.speak(u);
  };

  // ======================================================================
  //  Supabase · 로그인
  // ======================================================================
  var sb = null;
  function client() { return sb || (sb = window.WA_MOCK_CLIENT || window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } })); }
  WA.client = client;
  WA.rpc = function (name, args) { return client().rpc(name, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; }); };
  WA.sel = function (q) { return q.then(function (r) { if (r.error) throw r.error; return r.data || []; }); };
  WA.all = function (make) {
    var out = [];
    function page(from) { return make().range(from, from + 999).then(function (r) { if (r.error) throw r.error; out = out.concat(r.data || []); return (r.data || []).length < 1000 ? out : page(from + 1000); }); }
    return page(0);
  };

  var state = WA.state = { email: "", uid: "", admin: false, me: {}, settings: { open: true, allow_external: false }, banks: [], ready: false,
    sel: WA.lget("wa.sel", { bank: "", lessons: [], count: 10 }), plays: [], wrong: [] };

  function showLogin(msg) {
    $("#nav").classList.add("hidden");
    $("#main").innerHTML = '<div class="card center"><div style="font-size:64px">🕹️</div><h2>교과서 단어로 노는 MY Word Arcade</h2>' +
      '<p class="muted">짝짓기 · 빈칸 스펠링 · 어순 조립 · 듣기 · 크로스워드 · 스펠 배틀 · 암호 풀기<br>1·2학년 교과서 단어로 7가지 게임을 즐겨 보세요!</p>' +
      (msg ? '<p class="err">' + esc(msg) + "</p>" : "") +
      '<div id="gsi" style="display:flex;justify-content:center;margin-top:14px"></div>' +
      '<p class="small muted" style="margin-top:14px">학교 구글 계정(@smy.ms.kr)으로 로그인하세요.</p>' +
      '<p class="small muted"><a href="../privacy.html" target="_blank" rel="noopener">개인정보 안내</a> · 학번, 이름, 게임 점수와 틀린 단어만 저장해요.</p></div>';
    (function draw() {
      if (!window.google || !google.accounts || !google.accounts.id) return setTimeout(draw, 300);
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: function (r) {
        client().auth.signInWithIdToken({ provider: "google", token: r.credential }).then(function (res) {
          if (res.error) return showLogin("로그인하지 못했어요: " + res.error.message);
          boot();
        });
      } });
      google.accounts.id.renderButton($("#gsi"), { theme: "filled_blue", size: "large", text: "signin_with", locale: "ko", shape: "pill" });
    })();
  }

  function boot() {
    client().auth.getSession().then(function (r) {
      var s = r.data.session;
      if (!s) return showLogin();
      state.email = low(s.user.email); state.uid = s.user.id;
      $("#out").classList.remove("hidden");
      $("#out").onclick = function () { client().auth.signOut().then(function () { location.hash = ""; location.reload(); }); };
      return WA.rpc("is_admin").then(function (a) {
        state.admin = !!a;
        if (state.admin) $("#tLink").classList.remove("hidden");
        return loadAll();
      });
    }).catch(function (e) { $("#main").innerHTML = '<div class="card err">' + esc(errMsg(e)) + "</div>"; });
  }
  WA.loadSettings = function () {
    return WA.sel(client().from("wa_settings").select("key,value")).then(function (rows) {
      rows.forEach(function (x) { state.settings[x.key] = x.value; });
    });
  };
  WA.loadBanks = function () {
    var built = Promise.all(BUILTIN.map(function (b) { return fetch(b.file).then(function (r) { return r.json(); }).then(function (j) { j.builtin = true; return j; }); }));
    var db = WA.sel(client().from("wa_banks").select("id,name,grade,words,active,sort").order("sort")).catch(function () { return []; });
    return Promise.all([built, db]).then(function (r) {
      var list = r[0].slice();
      r[1].forEach(function (b) {
        var i = list.findIndex(function (x) { return x.id === b.id; });
        if (i >= 0) list[i] = b; else list.push(b);   // 같은 id 로 올리면 기본 단어장을 바꿔요
      });
      state.banks = list.filter(function (b) { return b.active !== false || state.admin; });
    });
  };
  WA.loadMine = function () {
    return Promise.all([
      WA.sel(client().from("wa_plays").select("id,game,mode,bank,lessons,n,ok,score,ms,hints,extra,created_at").eq("user_id", state.uid).order("created_at", { ascending: false }).range(0, 499)),
      WA.sel(client().from("wa_wordstat").select("bank,word,tries,wrong,last_ok,last_at").eq("user_id", state.uid).gt("wrong", 0).range(0, 1999))
    ]).then(function (r) { state.plays = r[0]; state.wrong = r[1]; });
  };
  function loadAll() {
    return Promise.all([WA.loadSettings(), WA.rpc("wa_me").then(function (m) { state.me = m || {}; })])
      .then(WA.loadBanks).then(WA.loadMine)
      .then(function () { state.ready = true; state.missing = false; })
      .catch(function (e) { console.warn(e); state.ready = true; state.missing = true; state.err = e.message; })
      .then(function () {
        var school = state.email.endsWith("@smy.ms.kr"), ext = state.settings.allow_external === true || state.settings.allow_external === "true";
        if (!school && !state.admin && !ext) return showLogin("학교 계정(@smy.ms.kr)으로 로그인해 주세요. 지금: " + state.email);
        if (!state.banks.length) state.missing = true;
        fixSel();
        $("#nav").classList.remove("hidden");
        route();
      });
  }
  function fixSel() {
    var s = state.sel;
    if (!WA.bank(s.bank)) {
      var g = state.me.grade, b = state.banks.filter(function (x) { return x.grade === g; })[0] || state.banks[0];
      s.bank = b ? b.id : ""; s.lessons = [];
    }
    if ([10, 20, 30].indexOf(s.count) < 0) s.count = 10;
  }
  WA.bank = function (id) { return state.banks.filter(function (b) { return b.id === id; })[0]; };
  WA.lessonsOf = function (b) { var m = {}; (b ? b.words : []).forEach(function (w) { m[w.l] = (m[w.l] || 0) + 1; }); return Object.keys(m).map(Number).sort(function (a, b) { return a - b; }).map(function (l) { return { l: l, n: m[l] }; }); };

  // 지금 고른 단원의 단어들 (review 이면 내 오답 단어)
  WA.pool = function (review) {
    var b = WA.bank(state.sel.bank); if (!b) return [];
    if (review) {
      var wr = {}; state.wrong.forEach(function (x) { if (x.bank === b.id && (!x.last_ok || x.wrong >= 2)) wr[x.word] = 1; });
      return b.words.filter(function (w) { return wr[w.w]; });
    }
    var ls = state.sel.lessons;
    return b.words.filter(function (w) { return !ls.length || ls.indexOf(w.l) >= 0; });
  };

  // ======================================================================
  //  화면 이동
  // ======================================================================
  var cleanup = null;
  WA.onLeave = function (fn) { cleanup = fn; };
  window.addEventListener("hashchange", route);
  function route() {
    if (!state.ready) return;
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    if (window.speechSynthesis) speechSynthesis.cancel();
    WA.closeOverlay(); window.scrollTo(0, 0);
    var h = location.hash.replace(/^#\/?/, "").split("/");
    $$("#nav a").forEach(function (a) { a.classList.toggle("on", a.dataset.r === (h[0] === "play" ? "" : h[0])); });
    if (state.missing && h[0] !== "teacher") return viewMissing();
    if (h[0] === "play") return play(h[1], false);
    if (h[0] === "review" && h[1] === "play") return play(h[2], true);
    if (h[0] === "review") return viewReview();
    if (h[0] === "me") return viewMe();
    if (h[0] === "teacher" && state.admin) return WA.viewTeacher();
    return viewHome();
  }
  WA.route = route;
  function viewMissing() {
    $("#main").innerHTML = '<div class="card center"><h2>아직 준비 중이에요</h2><p class="muted">선생님이 데이터베이스 설정(SQL)을 마치면 열려요.</p>' +
      (state.admin ? '<p class="small err">' + esc(state.err || "단어장이 없어요") + '</p><p class="small">supabase_wordarcade.sql 을 SQL Editor 에서 실행해 주세요.</p><a class="btn navy" href="#/teacher">👩‍🏫 교사 화면</a>' : "") + "</div>";
  }

  // ---------- 홈 ----------
  function viewHome() {
    var s = state.sel, b = WA.bank(s.bank), best = {};
    state.plays.forEach(function (p) { if (!best[p.game] || p.score > best[p.game]) best[p.game] = p.score; });
    var name = state.me.name || state.email.split("@")[0];
    var closed = state.settings.open === false || state.settings.open === "false";
    $("#main").innerHTML =
      '<div class="card hero"><h2>' + esc(name) + ' 님, 어떤 단어로 놀아 볼까요? 🎮</h2><p>학년(단어장)과 단원을 고르고 아래에서 게임을 골라요.</p>' +
      (closed ? '<p class="err" style="background:#fff;border-radius:10px;padding:6px 10px;margin-top:8px">지금은 선생님이 기록 저장을 멈춰 두었어요. 연습은 할 수 있어요.</p>' : "") +
      '<div class="pick"><div><label class="k">📚 단어장</label><div class="chips" id="banks">' +
      state.banks.map(function (x) { return '<button class="chip' + (x.id === s.bank ? " on" : "") + '" data-b="' + esc(x.id) + '">' + esc(x.name) + " <small>" + x.words.length + "</small></button>"; }).join("") + "</div></div>" +
      '<div><label class="k">📖 단원 (여러 개 고를 수 있어요)</label><div class="chips" id="lessons"><button class="chip' + (!s.lessons.length ? " on" : "") + '" data-l="all">전체</button>' +
      WA.lessonsOf(b).map(function (x) { return '<button class="chip' + (s.lessons.indexOf(x.l) >= 0 ? " on" : "") + '" data-l="' + x.l + '">' + x.l + "과 <small>" + x.n + "</small></button>"; }).join("") + "</div></div>" +
      '<div><label class="k">🔢 한 판 문제 수</label><div class="chips" id="count">' + [10, 20, 30].map(function (n) { return '<button class="chip' + (s.count === n ? " on" : "") + '" data-c="' + n + '">' + n + "개</button>"; }).join("") + "</div></div></div></div>" +
      '<div class="games">' + WA.order.map(function (id) {
        var g = WA.games[id];
        return '<button class="game" data-g="' + id + '"><span class="ic">' + g.icon + "</span><b>" + esc(g.name) + "</b><span>" + esc(g.desc) + "</span>" +
          (best[id] != null ? '<span class="best">🏅 최고 ' + WA.num(best[id]) + "점</span>" : '<span class="best muted">처음 도전!</span>') + "</button>";
      }).join("") + "</div>";
    $$("#banks .chip").forEach(function (el) { el.onclick = function () { s.bank = el.dataset.b; s.lessons = []; save(); }; });
    $$("#lessons .chip").forEach(function (el) { el.onclick = function () {
      if (el.dataset.l === "all") s.lessons = [];
      else { var l = +el.dataset.l, i = s.lessons.indexOf(l); if (i >= 0) s.lessons.splice(i, 1); else s.lessons.push(l); s.lessons.sort(function (a, b) { return a - b; }); }
      save();
    }; });
    $$("#count .chip").forEach(function (el) { el.onclick = function () { s.count = +el.dataset.c; save(); }; });
    $$(".game").forEach(function (el) { el.onclick = function () { location.hash = "#/play/" + el.dataset.g; }; });
    function save() { WA.lset("wa.sel", s); viewHome(); }
  }

  // ---------- 게임 시작 ----------
  function play(id, review) {
    var g = WA.games[id];
    if (!g) { location.hash = "#/"; return; }
    var pool = WA.pool(review);
    var b = WA.bank(state.sel.bank);
    var ctx = {
      id: id, review: review, bank: b, count: state.sel.count,
      lessons: review ? "review" : (state.sel.lessons.join(",") || "all"),
      all: b ? b.words : [],
      el: $("#main"),
      done: function (res) { finish(g, ctx, res); }
    };
    var need = g.min || 4;
    var usable = g.filter ? pool.filter(g.filter) : pool;
    if (usable.length < need) {
      ctx.el.innerHTML = '<div class="card center"><h2>' + g.icon + " " + esc(g.name) + '</h2><p class="muted">' +
        (review ? "오답 노트에 이 게임으로 풀 단어가 부족해요 (" + usable.length + "개). 다른 게임을 먼저 해 보세요!" : "고른 단원에 이 게임에 쓸 수 있는 단어가 부족해요 (" + usable.length + "개). 단원을 더 골라 주세요.") +
        '</p><a class="btn navy" href="#/' + (review ? "review" : "") + '">돌아가기</a></div>';
      return;
    }
    ctx.pool = ctx.basePool = usable;
    if (g.modes && !ctx.mode) return chooseMode(g, ctx);
    g.start(ctx);
  }
  function chooseMode(g, ctx) {
    ctx.el.innerHTML = '<div class="card center"><div style="font-size:52px">' + g.icon + "</div><h2>" + esc(g.name) + "</h2><p class=\"muted\">" + esc(g.how || g.desc) + '</p><div class="row-btns c">' +
      g.modes.map(function (m) { return '<button class="btn big navy" data-m="' + m[0] + '">' + m[1] + "</button>"; }).join("") +
      '</div><div class="row-btns c"><a class="btn sm" href="#/' + (ctx.review ? "review" : "") + '">← 돌아가기</a></div></div>';
    $$("[data-m]").forEach(function (el) { el.onclick = function () { ctx.mode = el.dataset.m; g.start(ctx); }; });
  }
  // 게임 화면 위쪽 막대
  WA.bar = function (ctx, g, extra) {
    return '<div class="gbar"><span class="t">' + g.icon + " " + esc(g.name) + (ctx.review ? ' <span class="pill bad">오답 복습</span>' : "") + "</span>" + (extra || "") +
      '<button class="btn sm" id="quit">그만하기</button></div>';
  };
  WA.bindQuit = function (ctx, onQuit) {
    var q = $("#quit"); if (!q) return;
    q.onclick = function () { if (confirm("그만할까요? 지금까지 한 것만 저장돼요.")) onQuit(); };
  };

  // ---------- 결과 ----------
  function finish(g, ctx, res) {
    var words = res.words || [];
    var payload = { game: ctx.id, mode: ctx.mode || res.mode || "", bank: ctx.bank.id, lessons: ctx.lessons,
      n: res.n != null ? res.n : words.length, ok: res.ok != null ? res.ok : words.filter(function (w) { return w.ok; }).length,
      score: Math.round(res.score || 0), ms: Math.round(res.ms || 0), hints: res.hints || 0, extra: res.extra || {},
      words: words.map(function (w) { return { w: w.w, ok: !!w.ok }; }) };
    var wrongs = words.filter(function (w) { return !w.ok; });
    var byW = {}; ctx.bank.words.forEach(function (w) { byW[w.w] = w; });
    var acc = WA.pct(payload.ok, payload.n);
    var msg = acc >= 90 ? "완벽해요! 🌟" : acc >= 70 ? "잘했어요! 👏" : acc >= 40 ? "좋아요, 조금만 더! 💪" : "괜찮아요, 다시 해 봐요! 🙂";
    ctx.el.innerHTML = '<div class="card result"><div style="font-size:50px">' + g.icon + "</div><h2>" + esc(g.name) + " 끝!</h2>" +
      '<div class="big">' + WA.num(payload.score) + '<small style="font-size:20px">점</small></div><p>' + msg + "</p>" +
      '<div class="kpis"><div class="kpi"><b>' + payload.ok + " / " + payload.n + '</b><span>한 번에 맞힘</span></div><div class="kpi"><b>' + acc + '%</b><span>정답률</span></div><div class="kpi"><b>' + WA.sec(payload.ms) + '</b><span>걸린 시간</span></div>' +
      (res.kpis || []).map(function (k) { return '<div class="kpi"><b>' + esc(k[1]) + "</b><span>" + esc(k[0]) + "</span></div>"; }).join("") + "</div>" +
      '<p class="small muted" id="saveMsg">기록 저장 중…</p>' +
      (wrongs.length ? "<h3>📕 다시 볼 단어 " + wrongs.length + '개</h3><div class="wlist">' + wrongs.map(function (w) { var it = byW[w.w] || { w: w.w }; return WA.wordRow(it); }).join("") + "</div>" : "") +
      '<div class="row-btns c"><button class="btn big gold" id="again">🔁 한 번 더</button>' + (wrongs.length ? '<button class="btn big navy" id="redo">📕 틀린 것만 다시</button>' : "") +
      '<a class="btn big" href="#/' + (ctx.review ? "review" : "") + '">🏠 처음으로</a></div></div>';
    WA.bindSpeak(ctx.el);
    $("#again").onclick = function () { var c = Object.assign({}, ctx); delete c.retry; c.pool = ctx.basePool; restart(g, c); };
    if ($("#redo")) $("#redo").onclick = function () {
      var c = Object.assign({}, ctx); var set = {}; wrongs.forEach(function (w) { set[w.w] = 1; });
      c.pool = ctx.bank.words.filter(function (w) { return set[w.w]; }); c.retry = true; restart(g, c);
    };
    if (!payload.n) { $("#saveMsg").textContent = ""; return; }
    WA.rpc("wa_submit", { p: payload }).then(function () {
      $("#saveMsg").textContent = "✅ 기록을 저장했어요.";
      return WA.loadMine();
    }).catch(function (e) { $("#saveMsg").textContent = "⚠️ " + errMsg(e); $("#saveMsg").className = "small err"; });
  }
  function restart(g, c) {
    c.el = $("#main"); c.done = function (res) { finish(g, c, res); };
    if (c.retry && c.pool.length < (g.min || 4)) {   // 틀린 단어가 너무 적으면 같은 단원 단어로 채워요
      var extra = WA.shuffle(c.basePool).filter(function (w) { return c.pool.indexOf(w) < 0; });
      c.pool = c.pool.concat(extra.slice(0, (g.min || 4) - c.pool.length));
    }
    g.start(c);
  }
  WA.wordRow = function (it, right) {
    return '<div class="witem"><button class="btn sm" data-say="' + esc(WA.main(it)) + '">🔊</button><b>' + esc(it.w) + '</b><span class="m">' + esc(WA.posKo(it)) + " " + esc(WA.ko(it)) + "</span>" +
      (it.ex ? '<span class="small muted" style="flex-basis:100%">' + esc(it.ex) + "</span>" : "") + (right ? '<span class="n">' + right + "</span>" : "") + "</div>";
  };
  WA.bindSpeak = function (el) { $$("[data-say]", el).forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); WA.say(b.dataset.say); }; }); };

  // ---------- 오답 노트 ----------
  function viewReview() {
    var b = WA.bank(state.sel.bank);
    var byW = {}; (b ? b.words : []).forEach(function (w) { byW[w.w] = w; });
    var list = state.wrong.filter(function (x) { return b && x.bank === b.id && byW[x.word]; })
      .sort(function (a, c) { return (a.last_ok - c.last_ok) || (c.wrong - a.wrong); });
    var active = list.filter(function (x) { return !x.last_ok || x.wrong >= 2; });
    $("#main").innerHTML = '<div class="card"><h2>📕 오답 노트 · ' + esc(b ? b.name : "") + '</h2><p class="muted small">틀린 적 있는 단어가 모여요. 마지막에 틀렸거나 2번 넘게 틀린 단어 <b>' + active.length + "개</b>로 게임을 다시 할 수 있어요. 다시 맞히면 ✅ 로 바뀌어요.</p>" +
      '<div class="chips" style="margin-bottom:10px">' + state.banks.map(function (x) { return '<button class="chip' + (x.id === state.sel.bank ? " on" : "") + '" data-b="' + esc(x.id) + '">' + esc(x.name) + "</button>"; }).join("") + "</div>" +
      (active.length ? '<div class="games" style="margin-bottom:14px">' + WA.order.map(function (id) { var g = WA.games[id]; return '<button class="game" style="min-height:90px" data-g="' + id + '"><span class="ic">' + g.icon + "</span><b>" + esc(g.name) + "</b></button>"; }).join("") + "</div>" : "") +
      (list.length ? '<div class="wlist">' + list.map(function (x) { return WA.wordRow(byW[x.word], (x.last_ok ? '<span class="pill ok">✅ 다시 맞힘</span> ' : "") + '<span class="pill bad">' + x.wrong + "번 틀림</span>"); }).join("") + "</div>" : '<p class="center muted">아직 틀린 단어가 없어요. 게임을 해 보세요! 🎮</p>') + "</div>";
    WA.bindSpeak($("#main"));
    $$("[data-b]").forEach(function (el) { el.onclick = function () { state.sel.bank = el.dataset.b; state.sel.lessons = []; WA.lset("wa.sel", state.sel); viewReview(); }; });
    $$(".game").forEach(function (el) { el.onclick = function () { location.hash = "#/review/play/" + el.dataset.g; }; });
  }

  // ---------- 내 기록 ----------
  function viewMe() {
    var P = state.plays, tot = { n: 0, ok: 0, ms: 0, score: 0 }, per = {};
    P.forEach(function (p) {
      tot.n += p.n; tot.ok += p.ok; tot.ms += p.ms; tot.score += p.score;
      var x = per[p.game] || (per[p.game] = { plays: 0, n: 0, ok: 0, best: 0, ms: 0 });
      x.plays++; x.n += p.n; x.ok += p.ok; x.ms += p.ms; x.best = Math.max(x.best, p.score);
    });
    var days = {}; P.forEach(function (p) { days[p.created_at.slice(0, 10)] = 1; });
    var top = state.wrong.slice().sort(function (a, b) { return b.wrong - a.wrong; }).slice(0, 10);
    var bankName = function (id) { var b = WA.bank(id); return b ? b.name : id; };
    var byW = {}; state.banks.forEach(function (b) { b.words.forEach(function (w) { byW[b.id + "|" + w.w] = w; }); });
    $("#main").innerHTML = '<div class="card"><h2>📊 내 기록</h2><div class="kpis">' +
      '<div class="kpi"><b>' + P.length + '판</b><span>게임한 횟수</span></div><div class="kpi"><b>' + Object.keys(days).length + '일</b><span>게임한 날</span></div>' +
      '<div class="kpi"><b>' + WA.num(tot.score) + '</b><span>모은 점수</span></div><div class="kpi"><b>' + WA.pct(tot.ok, tot.n) + '%</b><span>정답률</span></div><div class="kpi"><b>' + WA.sec(tot.ms) + "</b><span>공부한 시간</span></div></div>" +
      '<h3>게임별</h3><div class="tbl-wrap"><table class="tbl"><tr><th>게임</th><th>판</th><th>정답률</th><th>최고 점수</th><th>시간</th></tr>' +
      WA.order.map(function (id) { var x = per[id], g = WA.games[id]; return "<tr><td>" + g.icon + " " + esc(g.name) + "</td><td>" + (x ? x.plays : 0) + "</td><td>" + (x ? WA.pct(x.ok, x.n) + "%" : "-") + "</td><td>" + (x ? WA.num(x.best) : "-") + "</td><td>" + (x ? WA.sec(x.ms) : "-") + "</td></tr>"; }).join("") + "</table></div>" +
      (top.length ? '<h3 style="margin-top:14px">😵 많이 틀린 단어 TOP ' + top.length + '</h3><div class="wlist">' + top.map(function (x) { return WA.wordRow(byW[x.bank + "|" + x.word] || { w: x.word }, '<span class="pill bad">' + x.wrong + " / " + x.tries + "</span>"); }).join("") + "</div>" : "") +
      '<h3 style="margin-top:14px">최근 게임</h3><div class="tbl-wrap"><table class="tbl"><tr><th>날짜</th><th>게임</th><th>단어장 · 단원</th><th>점수</th><th>맞힘</th><th>시간</th></tr>' +
      P.slice(0, 30).map(function (p) { var g = WA.games[p.game] || { icon: "", name: p.game }; return "<tr><td>" + new Date(p.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "</td><td>" + g.icon + " " + esc(g.name) + "</td><td>" + esc(bankName(p.bank)) + " · " + (p.lessons === "review" ? "오답" : p.lessons === "all" ? "전체" : esc(p.lessons) + "과") + "</td><td>" + WA.num(p.score) + "</td><td>" + p.ok + "/" + p.n + "</td><td>" + WA.sec(p.ms) + "</td></tr>"; }).join("") +
      "</table></div>" + (P.length ? "" : '<p class="center muted">아직 기록이 없어요.</p>') + "</div>";
    WA.bindSpeak($("#main"));
  }

  document.addEventListener("DOMContentLoaded", function () { setTimeout(boot, 0); });
})();
