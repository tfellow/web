// MY Level Test — 화면 (로그인 · 시험 진행 · 결과 보고서 · 교사 화면)
// 평가 계산은 engine.js, 문항은 bank.js 에 있어요. 기록은 Supabase lt_attempts 에 저장해요.
(function () {
  "use strict";
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
  // 로그인 없는 체험 모드(?demo=1). 지금은 꺼 둠 — 다시 켜려면 true 로 바꾸고 첫 화면(index.html)의 체험 링크 주석도 풀어요
  var DEMO_ENABLED = false;
  var DEMO = DEMO_ENABLED && new URLSearchParams(location.search).has("demo");
  var BANK = window.LT_BANK, LT = window.LT;
  var DAY = 864e5, KST = 9 * 3600e3;
  var VOCAB_PAGE = 15;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function low(s) { return String(s || "").toLowerCase().trim(); }
  function kday(ms) { return new Date(ms + KST).toISOString().slice(0, 10); }
  function fmtDate(t) { var d = new Date(Date.parse(t) + KST).toISOString(); return d.slice(0, 10).replace(/-/g, ".") + " " + d.slice(11, 16); }
  function lget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var toastT;
  function toast(m) { var el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.add("hidden"); }, 3200); }
  function mmss(sec) { sec = Math.max(0, Math.round(sec)); return Math.floor(sec / 60) + "분 " + String(sec % 60).padStart(2, "0") + "초"; }
  function num(n) { return Number(n || 0).toLocaleString("ko-KR"); }
  var lvName = LT.lvName;

  // ======================================================================
  //  레벨 설명
  // ======================================================================
  var LVINFO = {
    A0: { name: "입문", en: "Pre-A1", color: "#8fb35a", can: ["알파벳과 아주 쉬운 낱말(색깔, 동물, 가족)을 알아요.", "그림과 함께 있는 아주 짧은 문장을 읽을 수 있어요."], next: "be동사·일반동사 현재형 문장과 생활 낱말 500개를 익혀 보세요." },
    A1: { name: "기초", en: "Breakthrough", color: "#4f9d69", can: ["짧은 메모, 간단한 안내문, 쉬운 문장으로 된 이야기를 읽을 수 있어요.", "자기소개, 가족, 학교처럼 익숙한 주제의 표현을 이해해요."], next: "과거시제·비교 표현을 익히고, 짧은 그림책·리더스북을 많이 읽어 보세요." },
    A2: { name: "초급", en: "Waystage", color: "#2f8f9d", can: ["편지, 광고, 안내문처럼 일상적인 글에서 필요한 정보를 찾을 수 있어요.", "지난 일이나 경험을 이야기하는 글을 이해해요."], next: "현재완료·관계사·to부정사를 다지고, 쉬운 챕터북으로 글의 요지를 찾는 연습을 해 보세요." },
    B1: { name: "중급", en: "Threshold", color: "#2d5291", can: ["익숙한 주제의 글에서 요점과 글쓴이의 의견을 파악해요.", "청소년 소설을 사전의 도움을 조금 받아 읽을 수 있어요."], next: "가정법·수동태·분사구문을 익히고, 기사·논설문에서 주장과 근거를 나눠 보세요." },
    B2: { name: "중상급", en: "Vantage", color: "#6a3fa0", can: ["과학·사회 기사처럼 다소 어려운 글에서 주장과 근거를 구분해요.", "소설 속 인물의 마음과 숨은 뜻을 추론해요."], next: "도치·고급 연결어와 학술 어휘를 익히고, 원서 소설과 칼럼을 꾸준히 읽어 보세요." },
    C1: { name: "고급", en: "Effective", color: "#b3261e", can: ["길고 복잡한 글의 함축적인 의미와 글쓴이의 태도를 파악해요.", "원서 소설과 논설문을 거의 막힘없이 읽어요."], next: "다양한 분야의 원서와 에세이를 읽고, 영어로 요약·비평하는 글쓰기에 도전해 보세요." }
  };
  function lvColor(code) { return (LVINFO[code] || LVINFO.A2).color; }
  function lvPill(code, label) { return '<span class="lv" style="--c:' + lvColor(code) + '">' + esc(label || lvName(code)) + "</span>"; }

  // ======================================================================
  //  저장소: Supabase (실제) / localStorage (체험)
  // ======================================================================
  var sb = null;
  function client() { return sb || (sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } })); }
  function all(make) {
    var out = [];
    function page(from) {
      return make().range(from, from + 999).then(function (r) {
        if (r.error) throw r.error;
        out = out.concat(r.data || []);
        return (r.data || []).length < 1000 ? out : page(from + 1000);
      });
    }
    return page(0);
  }
  var DEF_SET = { open: true, retake_days: 14, allow_external: false, item_b: {}, unlock: {} };
  var COLS = "id,email,started_at,finished_at,duration_sec,overall_cefr,overall_sub,overall_theta,vocab_size,vocab_cefr,lang_cefr,read_cefr,lexile,ar,flags,result";
  var real = {
    settings: function () {
      return client().from("lt_settings").select("key,value").then(function (r) {
        if (r.error) throw r.error;
        var s = JSON.parse(JSON.stringify(DEF_SET)); (r.data || []).forEach(function (x) { s[x.key] = x.value; }); return s;
      });
    },
    setSetting: function (k, v) { return client().from("lt_settings").upsert({ key: k, value: v }).then(function (r) { if (r.error) throw r.error; }); },
    mine: function () { return client().from("lt_attempts").select(COLS).eq("email", state.email).order("finished_at", { ascending: false }).then(function (r) { if (r.error) throw r.error; return r.data || []; }); },
    save: function (row) { return client().from("lt_attempts").insert(row).select(COLS).single().then(function (r) { if (r.error) throw r.error; return r.data; }); },
    allAttempts: function (withResp) { return all(function () { return client().from("lt_attempts").select(COLS + (withResp ? ",responses" : "")).order("finished_at", { ascending: false }); }); },
    del: function (id) { return client().from("lt_attempts").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; }); },
    roster: function () { return client().from("roster").select("email,name,grade,class_no,student_no").range(0, 4999).then(function (r) { if (r.error) throw r.error; return r.data || []; }); },
    setPassport: function (lv) { return client().rpc("set_my_level", { p_level: lv }).then(function (r) { if (r.error) throw r.error; }); }
  };
  var demo = {
    settings: function () { return Promise.resolve(Object.assign({}, DEF_SET, lget("lt.demo.set", {}))); },
    setSetting: function (k, v) { var s = lget("lt.demo.set", {}); s[k] = v; lset("lt.demo.set", s); return Promise.resolve(); },
    mine: function () { return Promise.resolve(demoAll().filter(function (a) { return a.email === state.email; })); },
    save: function (row) { var a = lget("lt.demo.mine", []); row.id = Date.now(); row.finished_at = new Date().toISOString(); a.unshift(row); lset("lt.demo.mine", a); return Promise.resolve(row); },
    allAttempts: function () { return Promise.resolve(demoAll()); },
    del: function (id) { lset("lt.demo.mine", lget("lt.demo.mine", []).filter(function (a) { return a.id !== id; })); demoCache = null; return Promise.resolve(); },
    roster: function () { return Promise.resolve(demoRoster()); },
    setPassport: function () { return Promise.resolve(); }
  };
  var store = DEMO ? demo : real;

  // 체험 모드: 가상 학생 40명이 실제 알고리즘으로 시험을 친 결과를 만들어요
  var demoCache = null;
  function demoRoster() {
    var a = [], names = ["김하은", "이서윤", "박지우", "최수아", "정하린", "강예린", "조서연", "윤지아", "장민서", "임채원", "한유나", "오다인", "서가은", "신예서", "권소율", "황지민", "안나연", "송하율", "류은서", "홍시은"];
    for (var c = 1; c <= 2; c++) for (var n = 1; n <= 20; n++) a.push({ email: "202610" + c + String(n).padStart(2, "0") + "@smy.ms.kr", name: names[(n + c * 7) % 20], grade: 1, class_no: c, student_no: n });
    return a;
  }
  function demoAll() {
    if (!demoCache) {
      var rnd = LT.rng(20261110), out = [];
      demoRoster().forEach(function (p, i) {
        if (rnd() < 0.15) return;
        var th = -2.2 + 3.6 * rnd() + (p.class_no === 2 ? 0.3 : 0);
        var S = simulate(th, rnd), R = LT.finalize(S, BANK);
        var t = Date.now() - Math.floor(rnd() * 9) * DAY - Math.floor(rnd() * 6e6);
        out.push(rowFrom(p.email, S, R, new Date(t - (600 + rnd() * 400) * 1000).toISOString(), new Date(t).toISOString(), i + 1));
      });
      demoCache = out;
    }
    return lget("lt.demo.mine", []).concat(demoCache);
  }
  function simulate(th, rnd) {
    var S = newSession(Math.floor(rnd() * 1e9));
    var tv = th + 0.4 * (rnd() - 0.5) * 2, size = 0;
    for (var x = 0; x <= 9000; x += 50) if (LT.vocabTheta(x) <= tv) size = x;
    S.vocab.items.forEach(function (it) {
      if (it.band === 0) { if (rnd() < 0.06) S.vocab.marks[it.w] = true; return; }
      var mid = it.band <= 6 ? it.band * 1000 - 500 : 7500;
      if (rnd() < 1 / (1 + Math.exp((mid - size) / 500))) S.vocab.marks[it.w] = true;
    });
    S.vcheck.items = LT.buildChecks(BANK, S.vocab.items, S.vocab.marks, rnd);
    S.vcheck.ans = S.vcheck.items.map(function (c) { return rnd() < 0.85 ? c.right : c.o[0]; });
    var it; while ((it = LT.nextLang(S, BANK, rnd))) S.lang.resp.push({ id: it.id, b: it.b, tag: it.tag, sec: "lang", ms: 4000 + rnd() * 9000, ok: rnd() < LT.P(th, it.b) });
    var p; while ((p = LT.nextPassage(S, BANK, rnd))) {
      S.read.done.push(p.id);
      p.qs.forEach(function (q, i) { S.read.resp.push({ id: q.id, b: q.b, tag: q.tag, sec: "read", first: i === 0, words: wc(p.text), ms: i === 0 ? wc(p.text) * (250 + rnd() * 300) : 5000 + rnd() * 9000, ok: rnd() < LT.P(th, q.b) }); });
    }
    return S;
  }
  function wc(t) { return String(t).split(/\s+/).filter(Boolean).length; }

  // ======================================================================
  //  상태 · 로그인
  // ======================================================================
  var state = { email: "", uid: "", admin: false, settings: DEF_SET, mine: [], ready: false, missing: false, tTab: lget("lt.tTab", "results"), tClass: lget("lt.tClass", "") };

  function showLogin(msg) {
    $("#main").innerHTML = '<div class="card center login"><div class="hero-ico">🧭</div><h2>내 영어 레벨은 어디쯤일까?</h2>' +
      '<p class="muted">단어 · 문법 · 읽기 3단계, 12~15분이면 끝나요.<br>내 수준에 맞춰 문제가 바뀌는 <b>적응형 시험</b>이에요.</p>' +
      '<div class="chips"><span>CEFR</span><span>Lexile</span><span>AR</span><span>어휘 크기</span></div>' +
      (msg ? '<p class="err">' + esc(msg) + "</p>" : "") +
      '<div id="gsi" style="display:flex;justify-content:center;margin-top:12px"></div>' +
      '<p class="small muted" style="margin-top:14px">학교 구글 계정(@smy.ms.kr)으로 로그인하세요.' + (DEMO_ENABLED ? ' · <a href="?demo=1">체험해 보기</a>' : "") + "</p></div>";
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
    if (DEMO) {
      state.email = "202610199@smy.ms.kr"; state.admin = true;
      $("#banner").innerHTML = '<div class="demo-banner">🧪 체험 모드예요. 기록은 이 기기에만 저장되고, 교사 화면에는 가상 학생 결과가 보여요.</div>';
      $("#tLink").classList.remove("hidden");
      return loadData();
    }
    client().auth.getSession().then(function (r) {
      var s = r.data.session;
      if (!s) return showLogin();
      state.email = low(s.user.email); state.uid = s.user.id;
      $("#out").classList.remove("hidden");
      $("#out").onclick = function () { client().auth.signOut().then(function () { location.hash = ""; location.reload(); }); };
      return client().rpc("is_admin").then(function (a) {
        state.admin = !!a.data;
        if (state.admin) $("#tLink").classList.remove("hidden");
        return loadData();
      });
    });
  }
  function loadData() {
    return store.settings().then(function (s) {
      state.settings = s;
      return store.mine().then(function (m) { state.mine = m; });
    }).then(function () { state.ready = true; state.missing = false; })
      .catch(function (e) { console.warn(e); state.ready = true; state.missing = true; state.err = e.message; })
      .then(function () {
        var school = state.email.endsWith("@smy.ms.kr");
        if (!DEMO && !school && !state.admin && !(state.settings.allow_external === true || state.settings.allow_external === "true")) {
          return showLogin("학교 계정(@smy.ms.kr)으로 로그인해 주세요. 지금: " + state.email);
        }
        route();
      });
  }
  function itemB() { return state.settings.item_b || {}; }

  // ======================================================================
  //  화면 이동
  // ======================================================================
  window.addEventListener("hashchange", route);
  function route() {
    if (!state.ready) return;
    clearInterval(clockT);
    window.scrollTo(0, 0);
    var h = location.hash.replace(/^#\/?/, "").split("/");
    if (state.missing) return viewMissing();
    if (h[0] === "test") return viewTest();
    if (h[0] === "result") return viewMyResult(h[1]);
    if (h[0] === "about") return viewAbout();
    if (h[0] === "teacher" && state.admin) {
      if (h[1] === "student" && h[2]) return viewStudent(decodeURIComponent(h[2]));
      return viewTeacher();
    }
    viewHome();
  }
  function viewMissing() {
    $("#main").innerHTML = state.admin
      ? '<div class="card"><h2>처음 한 번만 설정해 주세요 🛠️</h2><p>Supabase에 레벨 테스트 표가 아직 없어요. <b>SQL Editor</b>에서 <code>level/supabase_level.sql</code> 내용을 붙여 넣고 <b>Run</b>을 눌러 주세요.</p><p class="small muted">' + esc(state.err || "") + "</p></div>"
      : '<div class="card center"><h2>곧 열려요 🛠️</h2><p class="muted">선생님이 레벨 테스트를 준비하고 있어요.</p></div>';
  }

  // ---------- 학생 홈 ----------
  function sessKey() { return "lt.session." + state.email; }
  // 다음 응시 가능 시각 (ms). 0 = 지금 가능. 교사가 학생별로 "재응시 허용"을 누르면 그 뒤로는 바로 가능해요
  function nextAllowedAt(email, lastIso) {
    var days = +state.settings.retake_days || 0;
    if (!lastIso || days <= 0) return 0;
    var un = (state.settings.unlock || {})[low(email)];
    if (un && Date.parse(un) > Date.parse(lastIso)) return 0;
    var next = Date.parse(lastIso) + days * DAY;
    return next > Date.now() ? next : 0;
  }
  function canStart() {
    if (state.admin) return { ok: true };
    var s = state.settings;
    if (s.open === false || s.open === "false") return { ok: false, msg: "지금은 레벨 테스트가 닫혀 있어요. 선생님이 열어 주시면 볼 수 있어요." };
    var last = state.mine[0], next = last ? nextAllowedAt(state.email, last.finished_at) : 0;
    if (next) return { ok: false, msg: "다음 응시는 " + kday(next).replace(/-/g, ".") + "부터 할 수 있어요. (재응시 간격 " + s.retake_days + "일)" };
    return { ok: true };
  }
  function viewHome() {
    var sess = lget(sessKey(), null), last = state.mine[0], cs = canStart();
    if (sess && Date.now() - sess.startedAt > 2 * DAY) { lset(sessKey(), null); sess = null; }
    var html = "";
    var pend = lget("lt.pending." + state.email, null);
    if (pend) html += '<div class="card warn-card"><b>⚠️ 저장되지 않은 결과가 있어요.</b> 인터넷이 끊겼을 때 끝낸 시험이에요. <button class="btn sm navy" id="retrySave">다시 저장</button></div>';
    html += '<div class="card intro">' +
      '<div class="intro-top"><div><h2>🧭 영어 레벨 테스트</h2><p class="muted">단어 → 문법·어휘 → 읽기, 세 단계로 내 영어 실력을 재요. 내 답에 따라 다음 문제의 난이도가 바뀌어서, 짧은 시간에 정확하게 레벨을 찾아 줘요.</p></div></div>' +
      '<div class="steps">' +
      '<div class="step"><b>1</b><div><h3>단어</h3><p>아는 단어 고르기 + 뜻 확인 · 약 3분</p></div></div>' +
      '<div class="step"><b>2</b><div><h3>문법·어휘</h3><p>빈칸 채우기 12문제 · 약 4분</p></div></div>' +
      '<div class="step"><b>3</b><div><h3>읽기</h3><p>짧은 글 5편, 10문제 · 약 6분</p></div></div>' +
      "</div>" +
      '<ul class="tips"><li>모르는 문제는 찍지 말고 <b>“잘 모르겠어요”</b>를 눌러요. 찍으면 결과가 오히려 부정확해져요.</li><li>사전·번역기 없이 혼자 풀어요. 중간에 나가도 이어서 할 수 있어요.</li></ul>' +
      '<div class="row-btns">' +
      (sess ? '<a class="btn navy big" href="#/test">▶ 이어서 하기</a><button class="btn" id="restart">처음부터 다시</button>'
        : cs.ok ? '<a class="btn navy big" href="#/test">▶ 시작하기</a>' : '<p class="note">' + esc(cs.msg) + "</p>") +
      '<a class="btn" href="#/about">평가 방법 알아보기</a></div></div>';
    if (last) {
      var R = last.result;
      html += '<div class="card"><h2>내 최근 결과 <span class="small muted">' + fmtDate(last.finished_at) + "</span></h2>" + miniSummary(R) +
        '<div class="row-btns"><a class="btn gold" href="#/result/' + last.id + '">📄 결과 보고서 보기</a></div></div>';
    }
    if (state.mine.length > 1) {
      html += '<div class="card"><h2>📈 나의 성장 기록</h2>' + growth(state.mine) + "</div>";
    }
    $("#main").innerHTML = html;
    if ($("#restart")) $("#restart").onclick = function () { if (confirm("지금까지 푼 것을 지우고 처음부터 다시 할까요?")) { lset(sessKey(), null); if (cs.ok) location.hash = "#/test"; else viewHome(); } };
    if ($("#retrySave")) $("#retrySave").onclick = function () { saveRow(pend); };
  }
  function miniSummary(R) {
    return '<div class="mini">' +
      '<div><span>종합</span>' + lvPill(R.overall.cefr, R.overall.label) + "</div>" +
      "<div><span>어휘 크기</span><b>" + num(R.vocab.size) + "</b> 단어</div>" +
      "<div><span>Lexile</span><b>" + LT.lexLabel(R.lexile) + "</b></div>" +
      "<div><span>AR</span><b>" + R.ar.toFixed(1) + "</b></div></div>";
  }
  function growth(list) {
    var arr = list.slice(0, 8).reverse();
    var rows = arr.map(function (a) {
      var t = a.overall_theta, pct = Math.max(2, Math.min(100, (t + 3) / 6.5 * 100));
      return '<div class="g-row"><span class="small muted">' + fmtDate(a.finished_at).slice(0, 10) + '</span><div class="g-bar"><i style="width:' + pct + "%;background:" + lvColor(a.overall_cefr) + '"></i></div><span>' + lvPill(a.overall_cefr, lvName(a.overall_cefr) + " " + (a.overall_sub || "")) + '</span><span class="small">' + LT.lexLabel(a.lexile) + "</span></div>";
    }).join("");
    return '<div class="growth">' + rows + "</div>";
  }

  // ======================================================================
  //  시험 진행
  // ======================================================================
  function newSession(seed) {
    var rnd = LT.rng(seed);
    return { v: 1, seed: seed, n: 0, startedAt: Date.now(), part: "intro1",
      vocab: { items: LT.buildVocab(BANK, rnd), marks: {}, page: 0 },
      vcheck: { items: [], ans: [], i: 0 },
      lang: { resp: [], cur: null },
      read: { resp: [], done: [], cur: null } };
  }
  function sRnd(S) { S.n = (S.n || 0) + 1; return LT.rng(S.seed + S.n * 7919); }
  var S = null, clockT = null, shownAt = 0, picked = null;
  function persist() { lset(sessKey(), S); }
  function totalSteps() { return 3 + 4 + LT.RULES.lang.max + LT.RULES.read.max * 2; }
  function doneSteps() {
    var past = S.part !== "intro1" && S.part !== "vocab";
    var v = past ? 3 : S.vocab.page;
    var chk = !past ? 0 : S.part === "vcheck" ? S.vcheck.i : 4;
    return v + chk + S.lang.resp.length + S.read.resp.length;
  }
  function viewTest() {
    S = lget(sessKey(), null);
    if (!S) {
      var cs = canStart();
      if (!cs.ok) { toast(cs.msg); location.hash = "#/"; return; }
      S = newSession(Math.floor(Math.random() * 1e9)); persist();
    }
    renderStep();
    clockT = setInterval(function () { var el = $("#clock"); if (el) el.textContent = "⏱ " + mmss((Date.now() - S.startedAt) / 1000); }, 1000);
  }
  function frame(partNo, partName, body) {
    var pct = Math.round(doneSteps() / totalSteps() * 100);
    return '<div class="testbar"><div class="tb-top"><span class="part">' + partNo + "단계 · " + partName + '</span><span id="clock" class="small muted">⏱ ' + mmss((Date.now() - S.startedAt) / 1000) + '</span><a class="small" href="#/">잠시 멈추기</a></div>' +
      '<div class="bar"><i style="width:' + pct + '%"></i></div></div>' + body;
  }
  function renderStep() {
    picked = null; shownAt = Date.now();
    if (S.part === "intro1") return intro(1, "단어", "아는 단어를 모두 골라요", "화면에 단어가 15개씩 3번 나와요. <b>뜻을 확실히 아는 단어만</b> 눌러 주세요.<br>진짜 영어 단어가 아닌 <b>가짜 단어</b>도 섞여 있어요. 모르는 단어를 누르면 점수가 깎여요.", "vocab");
    if (S.part === "vocab") return renderVocab();
    if (S.part === "vcheck") return renderCheck();
    if (S.part === "intro2") return intro(2, "문법·어휘", "빈칸에 알맞은 말을 골라요", "12문제예요. 맞히면 조금 더 어려운 문제, 틀리면 조금 더 쉬운 문제가 나와요.<br>어려운 문제가 나와도 괜찮아요. 내 레벨을 찾는 중이라는 뜻이에요.", "lang");
    if (S.part === "lang") return renderLang();
    if (S.part === "intro3") return intro(3, "읽기", "짧은 글을 읽고 답해요", "글 5편, 한 편에 2문제씩 나와요. 글은 문제를 푸는 동안 계속 보여요.<br>천천히 읽어도 괜찮아요. 읽는 시간도 참고로 재요.", "read");
    if (S.part === "read") return renderRead();
    if (S.part === "done") return finish();
  }
  function intro(no, name, title, text, next) {
    $("#main").innerHTML = frame(no, name, '<div class="card center intro-card"><div class="stepno">' + no + "</div><h2>" + title + '</h2><p class="muted">' + text + '</p><button class="btn navy big" id="go">시작 →</button></div>');
    $("#go").onclick = function () { S.part = next; persist(); renderStep(); };
  }
  // ---- 1단계: 단어 체크 ----
  function renderVocab() {
    var pg = S.vocab.page, items = S.vocab.items.slice(pg * VOCAB_PAGE, pg * VOCAB_PAGE + VOCAB_PAGE);
    var cnt = function () { return items.filter(function (it) { return S.vocab.marks[it.w]; }).length; };
    $("#main").innerHTML = frame(1, "단어", '<div class="card"><div class="q-head"><h2>뜻을 아는 단어를 모두 눌러요</h2><span class="pill">' + (pg + 1) + " / 3</span></div>" +
      '<p class="note">가짜 단어도 섞여 있어요. 확실히 아는 단어만 고르세요.</p>' +
      '<div class="words">' + items.map(function (it) { return '<button class="word' + (S.vocab.marks[it.w] ? " on" : "") + '" data-w="' + esc(it.w) + '">' + esc(it.w) + "</button>"; }).join("") + "</div>" +
      '<div class="row-btns end"><span class="small muted" id="cnt"></span><button class="btn navy big" id="next">' + (pg < 2 ? "다음 →" : "뜻 확인하러 가기 →") + "</button></div></div>");
    function upd() { $("#cnt").textContent = cnt() + "개 골랐어요"; }
    upd();
    $$(".word").forEach(function (b) {
      b.onclick = function () { var w = b.getAttribute("data-w"); if (S.vocab.marks[w]) delete S.vocab.marks[w]; else S.vocab.marks[w] = true; b.classList.toggle("on"); upd(); persist(); };
    });
    $("#next").onclick = function () {
      S.vocab.page++;
      if (S.vocab.page >= 3) {
        S.vcheck.items = LT.buildChecks(BANK, S.vocab.items, S.vocab.marks, sRnd(S));
        S.vcheck.ans = []; S.vcheck.i = 0;
        S.part = S.vcheck.items.length ? "vcheck" : "intro2";
      }
      persist(); renderStep();
    };
  }
  function renderCheck() {
    var i = S.vcheck.i, c = S.vcheck.items[i];
    $("#main").innerHTML = frame(1, "단어", '<div class="card"><div class="q-head"><h2>뜻 확인</h2><span class="pill">' + (i + 1) + " / " + S.vcheck.items.length + '</span></div><p class="note">안다고 고른 단어 중 몇 개만 확인할게요.</p>' +
      '<div class="check-word">' + esc(c.w) + "</div>" +
      '<div class="opts">' + c.o.map(function (o, k) { return '<button class="opt" data-k="' + k + '"><span class="key">' + (k + 1) + "</span>" + esc(o) + "</button>"; }).join("") + "</div>" +
      '<div class="row-btns end"><button class="btn" id="dk">잘 모르겠어요</button></div></div>');
    function answer(v) { S.vcheck.ans[i] = v; S.vcheck.i++; if (S.vcheck.i >= S.vcheck.items.length) S.part = "intro2"; persist(); renderStep(); }
    $$(".opt").forEach(function (b) { b.onclick = function () { answer(c.o[+b.getAttribute("data-k")]); }; });
    $("#dk").onclick = function () { answer(null); };
    keyOpts(function (k) { if (c.o[k]) answer(c.o[k]); });
  }
  // ---- 2단계: 문법·어휘 ----
  function renderLang() {
    var cur = S.lang.cur;
    if (!cur) {
      var it = LT.nextLang(S, BANK, sRnd(S), itemB());
      if (!it) { S.part = "intro3"; persist(); return renderStep(); }
      cur = S.lang.cur = { id: it.id, order: LT.shuffle([0, 1, 2, 3], sRnd(S)) }; persist();
    }
    var item = BANK.lang.filter(function (x) { return x.id === cur.id; })[0];
    var q = esc(item.q).replace("___", '<span class="blank">　　　</span>');
    $("#main").innerHTML = frame(2, "문법·어휘", '<div class="card"><div class="q-head"><h2>빈칸에 알맞은 말은?</h2><span class="pill">' + (S.lang.resp.length + 1) + " / " + LT.RULES.lang.max + "</span></div>" +
      '<div class="sentence">' + q + "</div>" + optsHtml(item.o, cur.order) + navHtml() + "</div>");
    bindOpts(item, cur.order, function (choice, dk) {
      var r = { id: item.id, b: LT.itemB(item, itemB()), tag: item.tag, sec: "lang", ms: Date.now() - shownAt, ok: choice === item.a, dk: dk || undefined, c: choice };
      S.lang.resp.push(r); S.lang.cur = null; persist(); renderStep();
    }, function (k) { var el = $('.opt[data-k="' + k + '"]'); return el && el.querySelector(".t").innerHTML; });
  }
  // ---- 3단계: 읽기 ----
  function renderRead() {
    var cur = S.read.cur;
    if (!cur) {
      var p = LT.nextPassage(S, BANK, sRnd(S), itemB());
      if (!p) { S.part = "done"; persist(); return renderStep(); }
      cur = S.read.cur = { pid: p.id, qi: 0, order: LT.shuffle([0, 1, 2, 3], sRnd(S)) }; S.read.done.push(p.id); persist();
    }
    var P = BANK.read.filter(function (x) { return x.id === cur.pid; })[0], q = P.qs[cur.qi];
    var n = S.read.done.length;
    $("#main").innerHTML = frame(3, "읽기", '<div class="read-grid"><article class="card passage"><div class="q-head"><h3>' + esc(P.title) + '</h3><span class="pill">글 ' + n + " / " + LT.RULES.read.max + "</span></div>" +
      '<div class="ptext">' + esc(P.text) + "</div></article>" +
      '<div class="card"><div class="q-head"><h2>Q' + (cur.qi + 1) + ".</h2><span class=\"pill gold\">문제 " + (S.read.resp.length + 1) + " / " + LT.RULES.read.max * 2 + "</span></div>" +
      '<div class="sentence small-s">' + esc(q.q).replace("___", '<span class="blank">　　　</span>') + "</div>" + optsHtml(q.o, cur.order) + navHtml() + "</div></div>");
    bindOpts(q, cur.order, function (choice, dk) {
      var r = { id: q.id, b: LT.itemB(q, itemB()), tag: q.tag, sec: "read", ms: Date.now() - shownAt, ok: choice === q.a, dk: dk || undefined, c: choice, first: cur.qi === 0 || undefined, words: cur.qi === 0 ? wc(P.text) : undefined };
      S.read.resp.push(r);
      if (cur.qi + 1 < P.qs.length) { cur.qi++; cur.order = LT.shuffle([0, 1, 2, 3], sRnd(S)); } else S.read.cur = null;
      persist(); renderStep();
    });
  }
  function optsHtml(o, order) {
    return '<div class="opts">' + order.map(function (k, pos) { return '<button class="opt" data-k="' + k + '"><span class="key">' + (pos + 1) + '</span><span class="t">' + esc(o[k]) + "</span></button>"; }).join("") + "</div>";
  }
  function navHtml() { return '<div class="row-btns end"><button class="btn" id="dk">잘 모르겠어요</button><button class="btn navy big" id="next" disabled>다음 →</button></div>'; }
  function bindOpts(item, order, done) {
    var opts = $$(".opt");
    function sel(k) { picked = k; opts.forEach(function (b) { b.classList.toggle("on", +b.getAttribute("data-k") === k); }); $("#next").disabled = false; }
    opts.forEach(function (b) { b.onclick = function () { sel(+b.getAttribute("data-k")); }; });
    $("#next").onclick = function () { if (picked != null) done(picked, false); };
    $("#dk").onclick = function () { done(-1, true); };
    keyOpts(function (pos) { if (order[pos] != null) sel(order[pos]); }, function () { if (picked != null) done(picked, false); });
  }
  var keyH = null;
  function keyOpts(onNum, onEnter) {
    if (keyH) document.removeEventListener("keydown", keyH);
    keyH = function (e) {
      if (!/^#\/test/.test(location.hash)) return;
      if (e.key >= "1" && e.key <= "4") onNum(+e.key - 1);
      else if (e.key === "Enter" && onEnter) onEnter();
    };
    document.addEventListener("keydown", keyH);
  }
  // ---- 끝: 채점·저장 ----
  function rowFrom(email, S2, R, startedIso, finishedIso, id) {
    return { id: id, email: email, started_at: startedIso, finished_at: finishedIso,
      duration_sec: Math.round((Date.parse(finishedIso || new Date().toISOString()) - Date.parse(startedIso)) / 1000),
      overall_cefr: R.overall.cefr, overall_sub: R.overall.sub, overall_theta: R.overall.theta,
      vocab_size: R.vocab.size, vocab_cefr: R.vocab.cefr, lang_cefr: R.lang.cefr, read_cefr: R.read.cefr,
      lexile: R.lexile, ar: R.ar, flags: R.flags, result: R,
      responses: { vocab: { items: S2.vocab.items, marks: S2.vocab.marks }, vcheck: { items: S2.vcheck.items.map(function (c) { return { w: c.w, band: c.band, right: c.right }; }), ans: S2.vcheck.ans }, lang: S2.lang.resp, read: S2.read.resp } };
  }
  function finish() {
    clearInterval(clockT);
    var R = LT.finalize(S, BANK, itemB());
    var row = rowFrom(state.email, S, R, new Date(S.startedAt).toISOString(), new Date().toISOString());
    delete row.id; delete row.finished_at;
    $("#main").innerHTML = '<div class="card center"><div class="hero-ico spin">🧭</div><h2>결과를 계산하고 있어요…</h2><p class="muted">문항 ' + R.items + "개의 응답으로 레벨을 추정하는 중이에요.</p></div>";
    lset("lt.pending." + state.email, row); lset(sessKey(), null);
    setTimeout(function () { saveRow(row); }, 700);
  }
  function saveRow(row) {
    store.save(row).then(function (saved) {
      lset("lt.pending." + state.email, null);
      state.mine.unshift(saved);
      location.hash = "#/result/" + saved.id;
    }).catch(function (e) {
      var m = String(e.message || e);
      if (/LT_COOLDOWN/.test(m)) { lset("lt.pending." + state.email, null); toast("재응시 간격이 지나지 않아 저장하지 않았어요."); showResult(row.result, { date: new Date().toISOString(), unsaved: true }); return; }
      if (/LT_CLOSED/.test(m)) { lset("lt.pending." + state.email, null); toast("레벨 테스트가 닫혀 있어 저장하지 않았어요."); showResult(row.result, { date: new Date().toISOString(), unsaved: true }); return; }
      toast("저장하지 못했어요. 인터넷을 확인하고 홈에서 ‘다시 저장’을 눌러 주세요.");
      showResult(row.result, { date: new Date().toISOString(), unsaved: true });
    });
  }

  // ======================================================================
  //  결과 보고서
  // ======================================================================
  function viewMyResult(id) {
    var a = state.mine.filter(function (x) { return String(x.id) === String(id); })[0] || state.mine[0];
    if (!a) { location.hash = "#/"; return; }
    showResult(a.result, { date: a.finished_at, dur: a.duration_sec, own: true });
  }
  function ladder(theta) {
    var pct = Math.max(1, Math.min(99, (theta + 3) / 7 * 100));
    var segs = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"].map(function (l) { return '<div class="seg-l" style="--c:' + (l === "C2" ? "#7a1c16" : lvColor(l)) + '"><span>' + (l === "C2" ? "C2" : lvName(l)) + "</span></div>"; }).join("");
    return '<div class="ladder"><div class="segs">' + segs + '</div><div class="marker" style="left:' + pct + '%"><span>나</span></div></div>';
  }
  function showResult(R, meta) {
    meta = meta || {};
    var o = R.overall, info = LVINFO[o.cefr] || LVINFO.A2;
    var range = o.lo === o.hi ? lvName(o.cefr) : lvName(o.lo) + " ~ " + lvName(o.hi);
    var warn = [];
    if (R.flags.indexOf("rapid") >= 0) warn.push("너무 빨리 고른 답이 많았어요. 그런 답은 점수 계산에서 뺐지만, 결과가 실제 실력과 다를 수 있어요.");
    if (R.flags.indexOf("vocab_overclaim") >= 0) warn.push("단어 체크에서 가짜 단어를 많이 골랐어요. 어휘 크기는 참고만 하고, 종합 레벨에는 거의 반영하지 않았어요.");
    if (R.flags.indexOf("vocab_check_low") >= 0) warn.push("안다고 고른 단어의 뜻 확인에서 많이 틀렸어요. 어휘 크기를 낮춰서 계산했어요.");
    var html = '<div class="report">' +
      '<div class="card rep-hero" style="--c:' + info.color + '">' +
      '<div class="rh-top"><div><p class="small muted">' + (meta.date ? fmtDate(meta.date) : "") + (meta.dur ? " · " + mmss(meta.dur) : "") + (meta.name ? " · " + esc(meta.name) : "") + '</p><h2>나의 영어 레벨</h2></div>' +
      '<img src="../app/emblem.png" alt="" width="44" height="39"></div>' +
      '<div class="big-lv"><span class="code">' + esc(lvName(o.cefr)) + '</span><span class="sub">' + esc(o.sub === "상+" ? "이상" : o.sub) + '</span><div><b>' + info.name + " · " + info.en + '</b><p class="small">CEFR 기준 · 가능 범위 ' + esc(range) + "</p></div></div>" +
      ladder(o.theta) +
      '<ul class="can">' + info.can.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>" +
      '<div class="tiles">' +
      tile("📚", "어휘 크기", num(R.vocab.size) + '<small> 단어</small>', lvPill(R.vocab.cefr, R.vocab.label), "아는 영어 단어 수 (뜻 확인 " + Math.round(R.vocab.check * 100) + "%)") +
      tile("✏️", "문법·어휘", lvPill(R.lang.cefr, R.lang.label), "", R.lang.ok + " / " + R.lang.n + " 정답 (어려운 문제일수록 점수가 커요)") +
      tile("📖", "읽기", lvPill(R.read.cefr, R.read.label), "", R.read.ok + " / " + R.read.n + " 정답" + (R.read.wpm >= 30 && R.read.wpm <= 500 ? " · 읽기 속도 약 " + R.read.wpm + " wpm" : "")) +
      tile("📏", "Lexile 지수", LT.lexLabel(R.lexile), "", "범위 " + LT.lexLabel(R.lexileRange[0]) + " ~ " + LT.lexLabel(R.lexileRange[1])) +
      tile("🎯", "AR 지수", R.ar.toFixed(1), "", "미국 학년 기준 약 " + R.ar.toFixed(1) + "학년 · 추천 책 범위(ZPD) " + R.zpd[0].toFixed(1) + " ~ " + R.zpd[1].toFixed(1)) +
      "</div>" +
      (warn.length ? '<div class="card warn-card">' + warn.map(function (w) { return "<p>⚠️ " + esc(w) + "</p>"; }).join("") + "</div>" : "") +
      '<div class="card"><h2>🔍 영역별 분석</h2>' + diagHtml(R.diag) + '<p class="next"><b>다음 레벨로 가려면</b> ' + esc(info.next) + "</p></div>" +
      '<div class="card" id="recs"><h2>📕 지금 읽기 좋은 책</h2><p class="muted small">MY Reading Passport에서 내 레벨에 맞는 책을 골랐어요.</p><div id="recList" class="recs muted">불러오는 중…</div></div>' +
      '<div class="card no-print"><div class="row-btns">' +
      (meta.own && !DEMO ? '<button class="btn gold" id="setPass">📘 독서 여권 내 레벨을 ' + esc(lvName(passLv(o.cefr))) + "로 설정</button>" : "") +
      '<button class="btn" onclick="window.print()">🖨️ 인쇄 · PDF</button>' +
      (meta.back ? '<a class="btn" href="' + meta.back + '">← 돌아가기</a>' : '<a class="btn" href="#/">홈으로</a>') +
      '<a class="btn" href="#/about">평가 방법</a></div>' + (meta.unsaved ? '<p class="err small">이 결과는 아직 저장되지 않았어요.</p>' : "") + "</div>" +
      '<p class="small muted center-t">※ CEFR·Lexile·AR 지수는 이 시험의 결과를 각 기준에 맞춰 환산한 값이에요. 공식 시험 점수는 아니에요.</p>' +
      "</div>";
    $("#main").innerHTML = html;
    if ($("#setPass")) $("#setPass").onclick = function () {
      store.setPassport(passLv(o.cefr)).then(function () { toast("독서 여권 레벨을 " + lvName(passLv(o.cefr)) + "로 정했어요"); }).catch(function () { toast("독서 여권에 한 번 로그인한 뒤 다시 눌러 주세요."); });
    };
    loadBooks(function (books) { fillRecs(books, R); });
  }
  function passLv(c) { return c === "C1" ? "B2" : c; }
  function tile(ico, name, main, pill, note) {
    return '<div class="tile"><div class="t-h">' + ico + " " + name + '</div><div class="t-main">' + main + "</div>" + (pill ? '<div class="t-pill">' + pill + "</div>" : "") + '<div class="t-note">' + note + "</div></div>";
  }
  function diagHtml(d) {
    function li(t, good) { var pct = Math.round(t.ok / t.n * 100); return '<li><span class="' + (good ? "g" : "w") + '">' + esc(t.name) + '</span><span class="small muted">' + t.ok + "/" + t.n + " (" + pct + "%)</span></li>"; }
    return '<div class="diag"><div><h3>💪 강점</h3><ul>' + (d.strong.length ? d.strong.map(function (t) { return li(t, true); }).join("") : '<li class="muted small">눈에 띄는 강점 영역을 찾기엔 문항이 적었어요.</li>') + "</ul></div>" +
      '<div><h3>🌱 보완하면 좋은 점</h3><ul>' + (d.weak.length ? d.weak.map(function (t) { return li(t, false); }).join("") : '<li class="muted small">특별히 약한 영역이 없어요. 고르게 잘했어요!</li>') + "</ul></div></div>" +
      '<p class="small muted">내 레벨에서 기대되는 정답률과 비교해서 고른 결과예요.</p>';
  }
  var booksCb = [];
  function loadBooks(cb) {
    if (window.BOOKS) return cb(window.BOOKS);
    booksCb.push(cb); if (booksCb.length > 1) return;
    var s = document.createElement("script"); s.src = "../app/books.js?lt=1";
    s.onload = function () { booksCb.forEach(function (f) { f(window.BOOKS || []); }); booksCb = []; };
    s.onerror = function () { booksCb.forEach(function (f) { f([]); }); booksCb = []; };
    document.head.appendChild(s);
  }
  function fillRecs(books, R) {
    var el = $("#recList"); if (!el) return;
    var lv = passLv(R.overall.cefr), lex = R.lexile;
    var pool = books.filter(function (b) { return (b.cefr === lv || (lv === "A0" && b.cefr === "A0")) && !/exam/.test(b.id); });
    var lexN = function (b) { var m = String(b.lexile || "").match(/-?\d+/); return m ? +m[0] * (/BR/i.test(b.lexile) ? -1 : 1) : null; };
    pool.sort(function (x, y) { var a = lexN(x), b = lexN(y); return (a == null ? 999 : Math.abs(a - lex)) - (b == null ? 999 : Math.abs(b - lex)); });
    var pick = pool.slice(0, 12), out = [];
    var rnd = LT.rng(Math.round(R.overall.theta * 1000) + 7);
    pick = LT.shuffle(pick, rnd).slice(0, 4);
    if (!pick.length) { el.innerHTML = '<p class="muted small">추천할 책을 불러오지 못했어요.</p>'; return; }
    el.classList.remove("muted");
    el.innerHTML = pick.map(function (b) {
      return '<a class="rec" href="../app/#/book/' + encodeURIComponent(b.id) + '" target="_blank" rel="noopener" style="--c:' + esc(b.color || "#2d5291") + '"><span class="emo">' + esc(b.emoji || "📘") + '</span><span><b>' + esc(b.title) + '</b><small>' + esc(b.titleKo || "") + " · " + esc(lvName(b.cefr)) + (b.lexile ? " · " + esc(b.lexile) : "") + "</small></span></a>";
    }).join("");
  }

  // ---------- 평가 방법 ----------
  function viewAbout() {
    $("#main").innerHTML = '<div class="card about"><h2>🧭 이 레벨 테스트는 어떻게 계산하나요?</h2>' +
      "<h3>1. 적응형 시험 (CAT)</h3><p>토플·듀오링고 영어 시험, 케임브리지 배치 시험처럼 <b>내 답에 따라 다음 문제가 바뀌어요</b>. 맞히면 더 어려운 문제, 틀리면 더 쉬운 문제가 나와서, 적은 문제로도 레벨을 정확하게 찾아요.</p>" +
      "<h3>2. 문항반응이론 (IRT)</h3><p>모든 문제에는 미리 정해 둔 <b>난이도</b>가 있어요. 몇 개 맞혔는지가 아니라 <b>어떤 난이도의 문제를 맞혔는지</b>로 실력(θ)을 추정해요. 4지선다는 찍어서 맞힐 확률(25%)도 계산에 넣어요. 그래서 찍기보다 <b>“잘 모르겠어요”</b>가 더 정확한 결과를 만들어요.</p>" +
      "<h3>3. 어휘 크기</h3><p>자주 쓰는 순서대로 나눈 단어 구간(1,000단어 ~ 9,000단어)에서 단어를 뽑아 아는지 물어요. 진짜가 아닌 <b>가짜 단어</b>를 골랐다면 그만큼 ‘아는 척’으로 보고 보정하고, 몇 단어는 <b>뜻 확인</b>을 해서 한 번 더 확인해요.</p>" +
      "<h3>4. 찍기 감지</h3><p>글을 읽을 시간도 없이 답을 고른 경우는 계산에서 빼요. 너무 많으면 결과에 표시돼요.</p>" +
      "<h3>5. 점수 환산</h3><table class=\"conv\"><tr><th>CEFR</th><th>설명</th><th>Lexile</th><th>AR</th><th>어휘 크기</th></tr>" +
      [["A0", "입문", "~200L", "~1.4", "~750"], ["A1", "기초", "200~450L", "1.4~2.7", "750~1,500"], ["A2", "초급", "450~700L", "2.7~4.3", "1,500~2,500"], ["B1", "중급", "700~950L", "4.3~6.4", "2,500~3,250"], ["B2", "중상급", "950~1150L", "6.4~9.4", "3,250~3,750"], ["C1", "고급", "1150~1350L", "9.4~10.8", "3,750~4,500"]]
        .map(function (r) { return "<tr><td>" + lvPill(r[0]) + "</td><td>" + r[1] + "</td><td>" + r[2] + "</td><td>" + r[3] + "</td><td>" + r[4] + "</td></tr>"; }).join("") + "</table>" +
      '<p class="small muted">CEFR은 유럽 공통 언어 기준, Lexile은 글과 독자의 읽기 수준을 같은 눈금으로 나타내는 지수, AR(ATOS)은 미국 학년으로 나타낸 책 레벨이에요. ZPD는 지금 읽으면 가장 많이 늘 수 있는 책 레벨 범위예요. 이 시험의 값은 각 기준에 맞춰 <b>환산한 값</b>이라 공식 점수와 조금 다를 수 있어요. 어휘 크기 기준은 Milton(2010)의 CEFR별 어휘 연구를 참고했어요.</p>' +
      "<h3>6. 문항은 점점 더 정확해져요</h3><p>학생들의 응답이 쌓이면 선생님이 문제 난이도를 실제 응답에 맞게 다시 계산(보정)할 수 있어요.</p>" +
      '<div class="row-btns"><a class="btn" href="#/">← 홈으로</a></div></div>';
  }

  // ======================================================================
  //  교사 화면
  // ======================================================================
  var T = { att: null, roster: null };
  function loadTeacher(withResp) {
    return Promise.all([store.allAttempts(withResp), store.roster().catch(function () { return []; })]).then(function (r) { T.att = r[0]; T.roster = r[1]; });
  }
  function rosterMap() { var m = {}; (T.roster || []).forEach(function (p) { m[low(p.email)] = p; }); return m; }
  function classKey(p) { return p ? p.grade + "-" + p.class_no : "기타"; }
  function viewTeacher() {
    var tabs = [["results", "📋 결과"], ["dist", "📊 분포"], ["items", "🧪 문항 분석"], ["settings", "⚙️ 설정"]];
    $("#main").innerHTML = '<div class="tabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '"' + (state.tTab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + '</div><div id="tBody" class="card muted">불러오는 중…</div>';
    $$(".tabs button").forEach(function (b) { b.onclick = function () { state.tTab = b.getAttribute("data-t"); lset("lt.tTab", state.tTab); viewTeacher(); }; });
    var need = state.tTab === "items";
    loadTeacher(need).then(function () {
      if (state.tTab === "dist") return tDist();
      if (state.tTab === "items") return tItems();
      if (state.tTab === "settings") return tSettings();
      tResults();
    }).catch(function (e) { $("#tBody").innerHTML = '<p class="err">불러오지 못했어요: ' + esc(e.message) + "</p>"; });
  }
  function latestBy() { var m = {}; T.att.forEach(function (a) { var e = low(a.email); if (!m[e]) m[e] = { last: a, n: 0 }; m[e].n++; }); return m; }
  function classes() { var s = {}; (T.roster || []).forEach(function (p) { s[classKey(p)] = 1; }); return Object.keys(s).sort(function (a, b) { var x = a.split("-"), y = b.split("-"); return x[0] - y[0] || x[1] - y[1]; }); }
  function classSel() {
    return '<select id="cls"><option value="">전체 반</option>' + classes().map(function (c) { return '<option value="' + c + '"' + (state.tClass === c ? " selected" : "") + ">" + c.replace("-", "학년 ") + "반</option>"; }).join("") + "</select>";
  }
  function bindClass(fn) { var s = $("#cls"); if (s) s.onchange = function () { state.tClass = s.value; lset("lt.tClass", state.tClass); fn(); }; }
  function people() {
    var rm = rosterMap(), lb = latestBy(), list = [];
    (T.roster || []).forEach(function (p) { if (state.tClass && classKey(p) !== state.tClass) return; list.push({ p: p, x: lb[low(p.email)] }); });
    if (!state.tClass) Object.keys(lb).forEach(function (e) { if (!rm[e]) list.push({ p: { email: e, name: "(명단 밖)", grade: 9, class_no: 99, student_no: 0 }, x: lb[e] }); });
    list.sort(function (a, b) { return a.p.grade - b.p.grade || a.p.class_no - b.p.class_no || a.p.student_no - b.p.student_no; });
    return list;
  }
  var PRESETS = [[0, "제한 없음"], [7, "1주"], [14, "2주"], [30, "1달"], [60, "2달"], [90, "3달"], [120, "한 학기"], [180, "6달"]];
  function daysTxt(d) { d = +d || 0; var p = PRESETS.filter(function (x) { return x[0] === d; })[0]; return d === 0 ? "제한 없음" : d + "일" + (p ? " (" + p[1] + ")" : ""); }
  function saveDays(days, after) {
    days = Math.max(0, Math.min(365, parseInt(days, 10) || 0));
    return store.setSetting("retake_days", days).then(function () { state.settings.retake_days = days; toast("재응시 간격을 " + daysTxt(days) + "로 정했어요"); if (after) after(); }).catch(function (e) { toast("저장 실패: " + e.message); });
  }
  function unlockEmails(emails, after) {
    var u = Object.assign({}, state.settings.unlock || {}), now = new Date().toISOString();
    emails.forEach(function (e) { u[low(e)] = now; });
    return store.setSetting("unlock", u).then(function () { state.settings.unlock = u; toast(emails.length + "명이 지금 바로 다시 볼 수 있어요"); if (after) after(); }).catch(function (e) { toast("저장 실패: " + e.message); });
  }
  function nextCell(email, a) {
    var n = nextAllowedAt(email, a.finished_at);
    return n ? '<span class="small">' + kday(n).slice(5).replace("-", "/") + "</span>" : '<span class="pill ok">가능</span>';
  }
  function daysOptions() {
    var cur = +state.settings.retake_days || 0, list = PRESETS.slice();
    if (!list.some(function (x) { return x[0] === cur; })) list.push([cur, cur + "일"]);
    return list.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === cur ? " selected" : "") + ">" + x[1] + (x[0] && x[1].indexOf("일") < 0 ? " · " + x[0] + "일" : "") + "</option>"; }).join("");
  }
  var FLAG_KO = { rapid: "빠른 찍기", vocab_overclaim: "단어 과다 체크", vocab_check_low: "뜻 확인 낮음" };
  function tResults() {
    var list = people(), took = list.filter(function (r) { return r.x; });
    var html = '<div class="t-head"><h2>학생별 최근 결과</h2><div class="row-btns">' + classSel() + '<button class="btn sm" id="csv">⬇️ CSV</button></div></div>' +
      '<div class="retake-bar"><span>🔁 재응시 간격</span><select id="rDays">' + daysOptions() + "</select>" +
      '<span class="small muted">첫 응시 후 이 기간이 지나야 다시 볼 수 있어요.</span><button class="btn sm" id="unlockAll">' + (state.tClass ? state.tClass.replace("-", "학년 ") + "반" : "전체") + " 지금 재응시 허용</button></div>" +
      '<p class="small muted">응시 ' + took.length + "명 / " + list.length + "명 · 이름을 누르면 상세 보고서와 지난 기록을 볼 수 있어요.</p>" +
      '<div class="tbl-wrap"><table><thead><tr><th>반-번호</th><th>이름</th><th>응시일</th><th>종합</th><th>어휘</th><th>문법</th><th>읽기</th><th>Lexile</th><th>AR</th><th>소요</th><th>횟수</th><th>다음 응시</th><th>주의</th></tr></thead><tbody>' +
      list.map(function (r) {
        var p = r.p, a = r.x && r.x.last;
        var cn = p.grade === 9 ? "-" : p.grade + "-" + p.class_no + "-" + p.student_no;
        if (!a) return '<tr class="dim"><td>' + cn + "</td><td>" + esc(p.name) + '</td><td colspan="11" class="small muted">아직 응시하지 않았어요</td></tr>';
        return "<tr><td>" + cn + '</td><td><a href="#/teacher/student/' + encodeURIComponent(p.email) + '">' + esc(p.name) + "</a></td><td>" + fmtDate(a.finished_at).slice(5, 16) + "</td><td>" + lvPill(a.overall_cefr, lvName(a.overall_cefr) + " " + (a.overall_sub || "")) +
          '</td><td class="num">' + num(a.vocab_size) + "</td><td>" + esc(lvName(a.lang_cefr)) + "</td><td>" + esc(lvName(a.read_cefr)) + '</td><td class="num">' + LT.lexLabel(a.lexile) + '</td><td class="num">' + (+a.ar).toFixed(1) + '</td><td class="num">' + Math.round((a.duration_sec || 0) / 60) + "분</td><td class=\"num\">" + r.x.n + "</td><td>" + nextCell(p.email, a) +
          "</td><td>" + (a.flags || []).map(function (f) { return '<span class="pill off">' + (FLAG_KO[f] || f) + "</span>"; }).join(" ") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
    $("#tBody").className = "card"; $("#tBody").innerHTML = html;
    bindClass(tResults);
    $("#rDays").onchange = function () { saveDays(this.value, tResults); };
    $("#unlockAll").onclick = function () {
      var em = took.filter(function (r) { return nextAllowedAt(r.p.email, r.x.last.finished_at); }).map(function (r) { return r.p.email; });
      if (!em.length) return toast("기다리는 학생이 없어요. 모두 지금 응시할 수 있어요.");
      if (confirm(em.length + "명이 재응시 간격과 관계없이 지금 바로 다시 볼 수 있게 할까요?")) unlockEmails(em, tResults);
    };
    $("#csv").onclick = function () {
      var rows = [["학년", "반", "번호", "이름", "이메일", "응시일", "종합CEFR", "세부", "theta", "어휘크기", "어휘CEFR", "문법CEFR", "읽기CEFR", "Lexile", "AR", "ZPD", "소요(분)", "응시횟수", "주의"]];
      list.forEach(function (r) {
        var p = r.p, a = r.x && r.x.last;
        rows.push([p.grade === 9 ? "" : p.grade, p.grade === 9 ? "" : p.class_no, p.student_no || "", p.name, p.email].concat(a ? [fmtDate(a.finished_at), lvName(a.overall_cefr), a.overall_sub, a.overall_theta, a.vocab_size, lvName(a.vocab_cefr), lvName(a.lang_cefr), lvName(a.read_cefr), LT.lexLabel(a.lexile), a.ar, a.result && a.result.zpd ? a.result.zpd.join("~") : "", Math.round((a.duration_sec || 0) / 60), r.x.n, (a.flags || []).map(function (f) { return FLAG_KO[f] || f; }).join(" ")] : []));
      });
      download("레벨테스트_" + (state.tClass || "전체") + "_" + kday(Date.now()) + ".csv", rows);
    };
  }
  function download(name, rows) {
    var csv = "﻿" + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; a.click();
  }
  function tDist() {
    var lb = latestBy(), rm = rosterMap(), groups = {};
    Object.keys(lb).forEach(function (e) { var p = rm[e]; if (!p) return; var k = classKey(p); (groups[k] = groups[k] || []).push(lb[e].last); });
    var keys = classes().filter(function (k) { return groups[k]; });
    var LVS = ["A0", "A1", "A2", "B1", "B2", "C1"];
    function row(name, arr) {
      var cnt = {}; LVS.forEach(function (l) { cnt[l] = 0; }); arr.forEach(function (a) { cnt[a.overall_cefr] = (cnt[a.overall_cefr] || 0) + 1; });
      var n = arr.length, avg = function (f) { return n ? arr.reduce(function (s, a) { return s + (+a[f] || 0); }, 0) / n : 0; };
      return '<div class="dist-row"><div class="d-name"><b>' + esc(name) + '</b><span class="small muted">' + n + "명</span></div>" +
        '<div class="stack">' + LVS.map(function (l) { return cnt[l] ? '<i style="flex:' + cnt[l] + ";background:" + lvColor(l) + '" title="' + lvName(l) + " " + cnt[l] + '명">' + (cnt[l] / n >= 0.08 ? lvName(l).replace("Pre-", "") + " " + cnt[l] : "") + "</i>" : ""; }).join("") + "</div>" +
        '<div class="d-avg small">평균 Lexile <b>' + LT.lexLabel(Math.round(avg("lexile") / 10) * 10) + "</b> · 어휘 <b>" + num(Math.round(avg("vocab_size") / 50) * 50) + "</b> · AR <b>" + avg("ar").toFixed(1) + "</b></div></div>";
    }
    var allArr = []; keys.forEach(function (k) { allArr = allArr.concat(groups[k]); });
    $("#tBody").className = "card";
    $("#tBody").innerHTML = '<h2>반별 레벨 분포 (최근 결과 기준)</h2><div class="legend">' + LVS.map(function (l) { return lvPill(l); }).join(" ") + "</div>" +
      (allArr.length ? row("전체", allArr) + keys.map(function (k) { return row(k.replace("-", "학년 ") + "반", groups[k]); }).join("") : '<p class="muted">아직 결과가 없어요.</p>') +
      '<p class="small muted">수준별 반 편성이나 모둠 구성, 독서 지도에 참고하세요.</p>';
  }
  function tItems() {
    var recs = T.att.map(function (a) { var r = a.responses || {}; return { theta: a.overall_theta, resp: (r.lang || []).concat(r.read || []) }; });
    var cal = LT.calibrate(recs, BANK), cur = itemB(), MIN = 20, GAP = 0.3;
    var lvOf = function (b) { return LT.cefrOf(b).code; };
    var nReady = cal.filter(function (c) { return c.n >= MIN && c.bNew != null && Math.abs(c.bNew - c.b) >= GAP; }).length;
    var html = '<div class="t-head"><h2>문항 분석 · 난이도 보정</h2><div class="row-btns"><button class="btn sm navy" id="apply"' + (nReady ? "" : " disabled") + ">보정 적용 (" + nReady + "문항)</button>" + (Object.keys(cur).length ? '<button class="btn sm" id="reset">보정 초기화</button>' : "") + "</div></div>" +
      '<p class="small muted">응답자 ' + recs.length + "명. 학생 실력(θ)을 고정하고 문항 난이도(b)를 다시 추정해요. 응답이 " + MIN + "개 이상이고 " + GAP + " 이상 차이 나는 문항만 보정해요. 지금 보정된 문항: " + Object.keys(cur).length + "개.</p>" +
      '<div class="tbl-wrap"><table><thead><tr><th>ID</th><th>레벨</th><th>문항</th><th>응답</th><th>정답률</th><th>기대</th><th>b</th><th>추정 b</th><th>평균 시간</th></tr></thead><tbody>' +
      cal.sort(function (x, y) { return x.b - y.b; }).map(function (c) {
        var diff = c.bNew != null ? c.bNew - c.b : 0, hot = c.n >= MIN && Math.abs(diff) >= GAP;
        return "<tr" + (c.n ? "" : ' class="dim"') + "><td>" + c.id + "</td><td>" + lvPill(lvOf(c.b)) + '</td><td class="q-cell">' + (DEMO ? '<span class="muted">(체험 모드에서는 숨김)</span>' : esc(c.q)) + '</td><td class="num">' + c.n + '</td><td class="num">' + (c.p == null ? "-" : Math.round(c.p * 100) + "%") + '</td><td class="num">' + (c.expP == null ? "-" : Math.round(c.expP * 100) + "%") + '</td><td class="num">' + (cur[c.id] != null ? "<b>" + cur[c.id] + "</b> <s class=\"small muted\">" + c.b + "</s>" : c.b) + '</td><td class="num' + (hot ? (diff > 0 ? " up" : " down") : "") + '">' + (c.bNew == null ? "-" : c.bNew + (hot ? (diff > 0 ? " ▲" : " ▼") : "")) + '</td><td class="num">' + (c.avgMs ? (c.avgMs / 1000).toFixed(1) + "초" : "-") + "</td></tr>";
      }).join("") + "</tbody></table></div>" +
      '<p class="small muted">정답률이 기대보다 낮으면(▲) 실제로 더 어려운 문제, 높으면(▼) 더 쉬운 문제예요. 보정 후 새로 보는 시험부터 반영돼요.</p>';
    $("#tBody").className = "card"; $("#tBody").innerHTML = html;
    $("#apply").onclick = function () {
      var nb = Object.assign({}, cur);
      cal.forEach(function (c) { if (c.n >= MIN && c.bNew != null && Math.abs(c.bNew - c.b) >= GAP) nb[c.id] = c.bNew; });
      store.setSetting("item_b", nb).then(function () { state.settings.item_b = nb; toast("난이도 보정을 적용했어요"); tItems(); }).catch(function (e) { toast("저장 실패: " + e.message); });
    };
    if ($("#reset")) $("#reset").onclick = function () { if (!confirm("보정값을 모두 지우고 처음 난이도로 돌릴까요?")) return; store.setSetting("item_b", {}).then(function () { state.settings.item_b = {}; toast("초기화했어요"); tItems(); }); };
  }
  function tSettings() {
    var s = state.settings, on = function (v) { return v === true || v === "true"; };
    $("#tBody").className = "card";
    $("#tBody").innerHTML = '<h2>설정</h2><div class="form">' +
      '<label class="chk"><input type="checkbox" id="sOpen"' + (on(s.open) ? " checked" : "") + "> 학생 응시 열기</label>" +
      '<label>재응시 간격 — 처음 응시한 뒤 다음 응시까지 기다리는 기간 (일, 0 = 제한 없음)<input type="number" id="sDays" min="0" max="365" value="' + (+s.retake_days || 0) + '"></label>' +
      '<div class="presets">' + PRESETS.map(function (x) { return '<button type="button" class="btn sm' + (x[0] === +s.retake_days ? " navy" : "") + '" data-d="' + x[0] + '">' + x[1] + "</button>"; }).join("") + "</div>" +
      '<p class="small muted" style="margin:0">지금: <b>' + daysTxt(s.retake_days) + '</b>. 바꾸면 이미 응시한 학생에게도 바로 적용돼요. 특정 학생만 먼저 다시 보게 하려면 결과 탭이나 학생 상세 화면의 <b>재응시 허용</b>을 누르세요.</p>' +
      '<label class="chk"><input type="checkbox" id="sExt"' + (on(s.allow_external) ? " checked" : "") + "> 학교 밖 계정(@smy.ms.kr 아닌 계정)도 응시 허용</label>" +
      '<div class="row-btns"><button class="btn navy" id="sSave">저장</button></div></div>' +
      '<p class="small muted">교사 계정은 설정과 관계없이 언제든 볼 수 있어요(시험 체험용). 교사 계정 관리는 독서 여권 교사 화면의 ⚙️ 설정에서 해요.</p>';
    $$(".presets [data-d]").forEach(function (b) { b.onclick = function () { $("#sDays").value = b.getAttribute("data-d"); $$(".presets .btn").forEach(function (x) { x.classList.toggle("navy", x === b); }); }; });
    $("#sSave").onclick = function () {
      var days = Math.max(0, Math.min(365, parseInt($("#sDays").value, 10) || 0));
      Promise.all([store.setSetting("open", $("#sOpen").checked), store.setSetting("retake_days", days), store.setSetting("allow_external", $("#sExt").checked)])
        .then(function () { state.settings.open = $("#sOpen").checked; state.settings.retake_days = days; state.settings.allow_external = $("#sExt").checked; toast("저장했어요"); })
        .catch(function (e) { toast("저장 실패: " + e.message); });
    };
  }
  function viewStudent(email) {
    $("#main").innerHTML = '<div class="card muted">불러오는 중…</div>';
    (T.att ? Promise.resolve() : loadTeacher(false)).then(function () {
      var p = rosterMap()[low(email)] || { name: email };
      var list = T.att.filter(function (a) { return low(a.email) === low(email); });
      if (!list.length) { $("#main").innerHTML = '<div class="card">기록이 없어요. <a href="#/teacher">← 교사 화면</a></div>'; return; }
      var sel = list[0];
      function draw() {
        showResult(sel.result, { date: sel.finished_at, dur: sel.duration_sec, name: (p.grade ? p.grade + "-" + p.class_no + "-" + p.student_no + " " : "") + p.name, back: "#/teacher" });
        var box = document.createElement("div"); box.className = "card no-print";
        box.innerHTML = "<h2>응시 기록 (" + list.length + "회)</h2>" + growth(list) +
          '<div class="row-btns">' + list.map(function (a, i) { return '<button class="btn sm' + (a === sel ? " navy" : "") + '" data-i="' + i + '">' + fmtDate(a.finished_at).slice(0, 10) + "</button>"; }).join("") + '<button class="btn sm red" id="del">이 기록 삭제</button></div>' +
          '<p class="small">🔁 다음 응시: ' + (function () { var n = nextAllowedAt(email, list[0].finished_at); return n ? "<b>" + kday(n).replace(/-/g, ".") + "</b>부터 (간격 " + daysTxt(state.settings.retake_days) + ') <button class="btn sm gold" id="unlock1">지금 재응시 허용</button>' : "<b>지금 가능</b>"; })() + "</p>" +
          '<p class="small muted">재응시 허용은 기록을 지우지 않고 바로 한 번 더 볼 수 있게 해요.</p>';
        $(".report").insertBefore(box, $(".report").children[1]);
        $$("[data-i]", box).forEach(function (b) { b.onclick = function () { sel = list[+b.getAttribute("data-i")]; draw(); }; });
        if ($("#unlock1")) $("#unlock1").onclick = function () { unlockEmails([email], draw); };
        $("#del").onclick = function () {
          if (!confirm(fmtDate(sel.finished_at) + " 기록을 삭제할까요? 되돌릴 수 없어요.")) return;
          store.del(sel.id).then(function () { T.att = T.att.filter(function (a) { return a.id !== sel.id; }); toast("삭제했어요"); location.hash = "#/teacher"; }).catch(function (e) { toast("삭제 실패: " + e.message); });
        };
      }
      draw();
    });
  }

  boot();
})();
