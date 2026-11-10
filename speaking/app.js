// MY Speaking — 교과서 대화문을 듣고(TTS) 따라 말하면(음성 인식) 단어 일치율로 점수를 보여 주는 앱
// 녹음은 저장하지 않아요. 크롬 음성 인식(구글)이 바꾼 글자와 점수만 Supabase(sp_attempts)에 저장해요.
(function () {
  "use strict";
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
  // 로그인 없는 체험 모드(?demo=1). 지금은 꺼 둠 — 다시 켜려면 true 로
  var DEMO_ENABLED = false;
  var DEMO = DEMO_ENABLED && new URLSearchParams(location.search).has("demo");
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var KST = 9 * 3600e3, DAY = 864e5;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function low(s) { return String(s || "").toLowerCase().trim(); }
  function kday(ms) { return new Date(ms + KST).toISOString().slice(0, 10); }
  function when(ms) {
    if (!ms) return "";
    var d = Math.floor((Date.parse(kday(Date.now()) + "T00:00:00+09:00") - Date.parse(kday(ms) + "T00:00:00+09:00")) / DAY);
    return d <= 0 ? "오늘" : d === 1 ? "어제" : d < 7 ? d + "일 전" : kday(ms).slice(5).replace("-", "/");
  }
  function lget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var toastT;
  function toast(m) { var el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.add("hidden"); }, 3200); }
  function sCls(s) { return s >= 90 ? "s-hi" : s >= 70 ? "s-mid" : "s-lo"; }

  // ======================================================================
  //  채점: 인식된 문장과 원래 문장을 단어 단위로 맞춰 봐요 (최장 공통 부분열)
  // ======================================================================
  var CONTR = {
    "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "he's": "he is", "she's": "she is", "it's": "it is",
    "that's": "that is", "what's": "what is", "where's": "where is", "who's": "who is", "how's": "how is", "there's": "there is", "here's": "here is",
    "let's": "let us", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "can not", "cannot": "can not", "won't": "will not",
    "isn't": "is not", "aren't": "are not", "wasn't": "was not", "weren't": "were not", "haven't": "have not", "hasn't": "has not", "hadn't": "had not",
    "couldn't": "could not", "shouldn't": "should not", "wouldn't": "would not", "mustn't": "must not",
    "i'll": "i will", "you'll": "you will", "we'll": "we will", "they'll": "they will", "he'll": "he will", "she'll": "she will", "it'll": "it will",
    "i've": "i have", "you've": "you have", "we've": "we have", "they've": "they have", "i'd": "i would", "you'd": "you would", "he'd": "he would",
    "she'd": "she would", "we'd": "we would", "they'd": "they would", "gonna": "going to", "wanna": "want to", "ok": "okay", "o.k.": "okay"
  };
  var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  function numWords(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
    if (n < 1000) return ONES[Math.floor(n / 100)] + " hundred" + (n % 100 ? " " + numWords(n % 100) : "");
    return String(n);
  }
  // 표시용 단어(원문)와 비교용 단어(정규화)를 함께 만들어요
  function tokens(text) {
    var out = [];
    String(text || "").replace(/[’‘`]/g, "'").split(/\s+/).forEach(function (raw) {
      if (!raw) return;
      var w = low(raw).replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
      if (!w) { out.push({ raw: raw, keys: [] }); return; }
      var parts = CONTR[w] ? CONTR[w].split(" ") : /^\d+$/.test(w) ? numWords(+w).split(" ") : [w.replace(/-/g, " ")];
      var keys = [];
      parts.join(" ").split(/[\s-]+/).forEach(function (p) { p = p.replace(/'/g, ""); if (p) keys.push(p); });
      out.push({ raw: raw, keys: keys });
    });
    return out;
  }
  function flat(tk) { var a = []; tk.forEach(function (t, i) { t.keys.forEach(function (k) { a.push({ k: k, i: i }); }); }); return a; }
  function align(target, said) {
    var T = flat(tokens(target)), S = flat(tokens(said)).map(function (x) { return x.k; });
    var n = T.length, m = S.length, dp = [];
    for (var i = 0; i <= n; i++) { dp.push(new Array(m + 1).fill(0)); }
    for (i = n - 1; i >= 0; i--) for (var j = m - 1; j >= 0; j--)
      dp[i][j] = T[i].k === S[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var hit = new Array(n).fill(false); i = 0; j = 0;
    while (i < n && j < m) { if (T[i].k === S[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++; }
    var matched = hit.filter(Boolean).length;
    var okTok = {}; T.forEach(function (t, x) { okTok[t.i] = (okTok[t.i] !== false) && hit[x]; });
    return { score: n ? Math.round(matched / n * 100) : 0, okTok: okTok, matched: matched, total: n };
  }
  function bestOf(target, alts) {
    var best = null;
    alts.forEach(function (a) { var r = align(target, a); r.said = a; if (!best || r.score > best.score) best = r; });
    return best;
  }
  function renderWords(text, okTok) {
    return tokens(text).map(function (t, i) {
      if (!okTok || !t.keys.length) return esc(t.raw);
      return '<span class="' + (okTok[i] ? "ok" : "miss") + '">' + esc(t.raw) + "</span>";
    }).join(" ");
  }

  // ======================================================================
  //  듣기 (TTS)
  // ======================================================================
  var voices = [];
  function loadVoices() { voices = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(function (v) { return /^en/i.test(v.lang); }); voices.sort(function (a, b) { return (b.lang === "en-US") - (a.lang === "en-US"); }); }
  if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function speak(text, spIdx) {
    return new Promise(function (res) {
      if (!window.speechSynthesis) return res();
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = state.rate;
      if (voices.length) u.voice = voices[(spIdx || 0) % voices.length];
      // 크롬에서 가끔 끝 신호(onend)가 안 오는 문제가 있어서, 문장 길이만큼 기다린 뒤에도 넘어가요
      var done = false, fin = function () { if (!done) { done = true; clearTimeout(t); res(); } };
      var t = setTimeout(fin, 1500 + text.split(/\s+/).length * 600 / state.rate);
      u.onend = u.onerror = fin;
      speechSynthesis.speak(u);
    });
  }

  // ======================================================================
  //  말하기 (음성 인식)
  // ======================================================================
  var rec = null;
  function listen(onInterim) {
    return new Promise(function (res, rej) {
      if (!SR) return rej(new Error("unsupported"));
      if (window.speechSynthesis) speechSynthesis.cancel();
      rec = new SR();
      rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 5; rec.continuous = false;
      var alts = [], err = null;
      rec.onresult = function (e) {
        var r = e.results[e.results.length - 1];
        if (r.isFinal) { alts = []; for (var k = 0; k < r.length; k++) alts.push(r[k].transcript); }
        else if (onInterim) onInterim(r[0].transcript);
      };
      rec.onerror = function (e) { err = e.error; };
      rec.onend = function () { rec = null; if (alts.length) res(alts); else rej(new Error(err || "no-speech")); };
      try { rec.start(); } catch (e) { rej(e); }
    });
  }
  function stopListen() { if (rec) try { rec.stop(); } catch (e) {} }
  function micMsg(e) {
    var c = e && e.message;
    if (c === "unsupported") return "이 브라우저는 음성 인식을 지원하지 않아요. 크롬(Chrome)으로 열어 주세요.";
    if (c === "not-allowed" || c === "service-not-allowed") return "마이크 사용이 막혀 있어요. 주소창 왼쪽 🔒 → 마이크 → 허용으로 바꿔 주세요.";
    if (c === "no-speech") return "목소리가 들리지 않았어요. 마이크 가까이에서 다시 말해 보세요.";
    if (c === "network") return "인터넷 연결이 불안정해요. 잠시 뒤 다시 해 보세요.";
    if (c === "aborted") return "";
    return "음성 인식이 멈췄어요 (" + c + "). 다시 해 보세요.";
  }

  // ======================================================================
  //  대화문 붙여 넣기 해석
  //    A: Hi, Minsu. | 안녕, 민수.     (화자: 영어 | 한국어 해석 — 해석은 선택)
  //    화자 없는 줄은 앞 줄에 이어 붙여요.
  // ======================================================================
  function parseDialog(text) {
    var lines = [];
    String(text || "").split(/\r?\n/).forEach(function (raw) {
      var s = raw.trim(); if (!s) return;
      var m = s.match(/^([A-Za-z가-힣][A-Za-z가-힣0-9 .'\-]{0,20}?)\s*[:：]\s*(.+)$/);
      var who = "", body = s;
      if (m && m[1].trim().split(/\s+/).length <= 3 && !/^\d/.test(m[2])) { who = m[1].trim(); body = m[2]; }
      var ko = "", bar = body.indexOf("|");
      if (bar >= 0) { ko = body.slice(bar + 1).trim(); body = body.slice(0, bar).trim(); }
      if (!who && lines.length && !ko) { lines[lines.length - 1].text += " " + body; return; }
      if (!body) return;
      lines.push({ who: who, text: body, ko: ko });
    });
    return lines;
  }
  function speakers(lines) { var a = []; lines.forEach(function (l) { if (l.who && a.indexOf(l.who) < 0) a.push(l.who); }); return a; }
  function spColor(i) { return "var(--sp" + (i % 5) + ")"; }

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
  var DEMO_SETS = [
    { id: 1, title: "Listen & Talk A — Making Plans", lesson: "1-3", grade: 1, published: true, sort: 0, lines: parseDialog(
      "Minsu: What are you going to do this weekend? | 이번 주말에 뭐 할 거야?\nJenny: I'm going to visit my grandmother. | 할머니 댁에 갈 거야.\nMinsu: That sounds nice. Where does she live? | 좋겠다. 어디 사셔?\nJenny: She lives in Busan. | 부산에 사셔.\nMinsu: Have a great time! | 즐거운 시간 보내!") },
    { id: 2, title: "Communication — Asking for Help", lesson: "2-4", grade: 2, published: true, sort: 1, lines: parseDialog(
      "A: Can you help me with my homework?\nB: Sure. What do you need?\nA: I don't understand this math problem.\nB: Let's solve it together.") },
  ];
  var store = DEMO ? {
    sets: function () { return Promise.resolve(lget("sp.demo.sets", DEMO_SETS)); },
    saveSet: function (s) { var a = lget("sp.demo.sets", DEMO_SETS); if (s.id) a = a.map(function (x) { return x.id === s.id ? s : x; }); else { s.id = Date.now(); a.push(s); } lset("sp.demo.sets", a); return Promise.resolve(s); },
    deleteSet: function (id) { lset("sp.demo.sets", lget("sp.demo.sets", DEMO_SETS).filter(function (x) { return x.id !== id; })); return Promise.resolve(); },
    myAttempts: function () { return Promise.resolve(lget("sp.demo.att", []).filter(function (a) { return a.email === state.email; })); },
    addAttempt: function (a) { var x = lget("sp.demo.att", []); a.created_at = new Date().toISOString(); x.push(a); lset("sp.demo.att", x); return Promise.resolve(); },
    setAttempts: function (id) {
      var real = lget("sp.demo.att", []).filter(function (a) { return a.set_id === id; });
      var fake = [], seed = id * 7; function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
      var set = lget("sp.demo.sets", DEMO_SETS).filter(function (s) { return s.id === id; })[0];
      for (var n = 1; n <= 20; n++) { if (rnd() < .25) continue; for (var l = 0; l < (set ? set.lines.length : 4); l++) { if (rnd() < .3) continue; var tries = 1 + Math.floor(rnd() * 3); for (var t = 0; t < tries; t++) fake.push({ email: "2026" + (set && set.grade || 1) + "01" + String(n).padStart(2, "0") + "@smy.ms.kr", line_idx: l, score: Math.min(100, 50 + Math.floor(rnd() * 55)), created_at: new Date(Date.now() - rnd() * 6 * DAY).toISOString() }); } }
      return Promise.resolve(real.concat(fake));
    },
    roster: function () { var a = []; for (var g = 1; g <= 2; g++) for (var n = 1; n <= 20; n++) a.push({ email: "2026" + g + "01" + String(n).padStart(2, "0") + "@smy.ms.kr", name: "학생" + n, grade: g, class_no: 1, student_no: n }); return Promise.resolve(a); },
  } : {
    sets: function () { return client().from("sp_sets").select("*").order("sort").order("id").then(function (r) { if (r.error) throw r.error; return r.data; }); },
    saveSet: function (s) {
      var row = { title: s.title, lesson: s.lesson, grade: s.grade, lines: s.lines, published: s.published, sort: s.sort || 0, updated_at: new Date().toISOString() };
      var q = s.id ? client().from("sp_sets").update(row).eq("id", s.id) : client().from("sp_sets").insert(row);
      return q.select().single().then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    deleteSet: function (id) { return client().from("sp_sets").delete().eq("id", id).then(function (r) { if (r.error) throw r.error; }); },
    myAttempts: function () { return all(function () { return client().from("sp_attempts").select("set_id,line_idx,score,created_at").eq("user_id", state.uid); }); },
    addAttempt: function (a) { return client().from("sp_attempts").insert(a).then(function (r) { if (r.error) throw r.error; }); },
    setAttempts: function (id) { return all(function () { return client().from("sp_attempts").select("email,line_idx,score,created_at").eq("set_id", id); }); },
    roster: function () { return client().from("roster").select("email,name,grade,class_no,student_no").range(0, 4999).then(function (r) { if (r.error) throw r.error; return r.data; }); },
  };

  // ======================================================================
  //  상태 · 로그인
  // ======================================================================
  var state = { email: "", uid: "", admin: false, sets: [], att: [], rate: lget("sp.rate", 0.9), showKo: lget("sp.ko", false), grade: lget("sp.grade", ""), ready: false, tablesMissing: false };

  function showLogin(msg) {
    $("#main").innerHTML = '<div class="card center"><h2>🎤 교과서 대화문, 듣고 따라 말해요</h2>' +
      '<p class="muted">원어민 목소리로 듣고, 따라 말하면 몇 단어를 정확하게 말했는지 바로 알려 줘요.</p>' +
      (msg ? '<p class="err">' + esc(msg) + "</p>" : "") +
      '<div id="gsi" style="display:flex;justify-content:center;margin-top:12px"></div>' +
      '<p class="small muted" style="margin-top:14px">학교 구글 계정(@smy.ms.kr)으로 로그인하세요.</p></div>';
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
      state.email = "202610101@smy.ms.kr"; state.admin = true;
      $("#banner").innerHTML = '<div class="demo-banner">🧪 체험 모드예요. 기록은 이 기기에만 저장돼요. 마이크와 스피커로 실제처럼 연습해 볼 수 있어요.</div>';
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
        if (!state.email.endsWith("@smy.ms.kr") && !state.admin) return showLogin("학교 계정(@smy.ms.kr)으로 로그인해 주세요. 지금: " + state.email);
        if (state.admin) $("#tLink").classList.remove("hidden");
        return loadData();
      });
    });
  }
  function loadData() {
    return Promise.all([store.sets(), store.myAttempts()]).then(function (r) {
      state.sets = r[0] || []; state.att = r[1] || []; state.ready = true; state.tablesMissing = false;
    }).catch(function (e) {
      console.warn(e); state.ready = true; state.tablesMissing = true; state.err = e.message;
    }).then(route);
  }
  function myGrade() { var m = state.email.match(/^\d{4}(\d)\d{4}@/); return m ? +m[1] : ""; }

  // ======================================================================
  //  화면 이동
  // ======================================================================
  window.addEventListener("hashchange", route);
  function route() {
    if (!state.ready) return;
    stopListen(); if (window.speechSynthesis) speechSynthesis.cancel(); runToken++;
    var h = location.hash.replace(/^#\/?/, "").split("/");
    if (state.tablesMissing) return viewMissing();
    if (h[0] === "set" && h[1]) return viewPractice(+h[1]);
    if (h[0] === "teacher" && state.admin) {
      if (h[1] === "edit") return viewEdit(h[2] ? +h[2] : 0);
      if (h[1] === "results" && h[2]) return viewResults(+h[2]);
      return viewTeacher();
    }
    viewHome();
  }
  function viewMissing() {
    $("#main").innerHTML = state.admin
      ? '<div class="card"><h2>처음 한 번만 설정해 주세요 🛠️</h2><p>Supabase에 말하기 연습 표가 아직 없어요. <b>SQL Editor</b>에서 <code>speaking/supabase_speaking.sql</code> 내용을 붙여 넣고 <b>Run</b>을 눌러 주세요. (학생 페이지 표를 만들 때와 같은 방법이에요.)</p><p class="small muted">' + esc(state.err || "") + "</p></div>"
      : '<div class="card center"><h2>곧 열려요 🛠️</h2><p class="muted">선생님이 말하기 연습을 준비하고 있어요.</p></div>';
  }

  // ---------- 학생: 대화문 목록 ----------
  function bestMap(att) { // "setId:line" → 최고점
    var m = {}; att.forEach(function (a) { var k = a.set_id + ":" + a.line_idx; if (!(k in m) || a.score > m[k]) m[k] = a.score; }); return m;
  }
  function setProgress(set, bm) {
    var n = set.lines.length, done = 0, sum = 0;
    for (var i = 0; i < n; i++) { var b = bm[set.id + ":" + i]; if (b != null) { done++; sum += b; } }
    return { n: n, done: done, avg: n ? Math.round(sum / n) : 0 };
  }
  function viewHome() {
    var g = state.grade === "" ? myGrade() : state.grade;
    var sets = state.sets.filter(function (s) { return s.published || state.admin; });
    var grades = [""].concat([1, 2, 3].filter(function (x) { return sets.some(function (s) { return s.grade === x; }); }));
    if (grades.indexOf(g) < 0) g = "";
    var list = sets.filter(function (s) { return !g || !s.grade || s.grade === g; });
    var bm = bestMap(state.att);
    var lastBy = {}; state.att.forEach(function (a) { var t = Date.parse(a.created_at); if (!(lastBy[a.set_id] > t)) lastBy[a.set_id] = t; });
    var support = SR ? "" : '<div class="card err">⚠️ 이 브라우저는 음성 인식을 지원하지 않아요. <b>크롬(Chrome)</b>으로 열어 주세요. 듣기는 할 수 있어요.</div>';
    $("#main").innerHTML = support +
      '<div class="tabs" id="gtabs">' + grades.map(function (x) { return '<button data-g="' + x + '" class="' + (x === g ? "on" : "") + '">' + (x ? x + "학년" : "전체") + "</button>"; }).join("") + "</div>" +
      (list.length ? '<div class="sets">' + list.map(function (s) {
        var p = setProgress(s, bm);
        return '<a class="set" href="#/set/' + s.id + '"><div><span class="pill">' + esc(s.lesson || "") + '</span> ' + (s.grade ? '<span class="pill gold">' + s.grade + "학년</span>" : "") + (s.published ? "" : ' <span class="pill off">비공개</span>') + "</div>" +
          '<div class="t">' + esc(s.title) + '</div><div class="small muted">' + s.lines.length + "줄 · " + speakers(s.lines).join(", ") + "</div>" +
          '<div class="bar"><i style="width:' + p.avg + '%"></i></div><div class="small muted">' + (p.done ? p.done + "/" + p.n + "줄 연습 · 평균 최고점 " + p.avg + "점 · " + when(lastBy[s.id]) : "아직 연습 전") + "</div></a>";
      }).join("") + "</div>" : '<div class="card center muted">아직 연습할 대화문이 없어요.' + (state.admin ? ' <a href="#/teacher/edit">대화문을 붙여 넣어 보세요.</a>' : "") + "</div>") +
      '<p class="note">🔒 녹음은 저장되지 않아요. 말한 내용을 글자로 바꾸기 위해 크롬(구글) 음성 인식을 쓰고, 인식된 글자와 점수만 저장돼요.</p>';
    $$("#gtabs button").forEach(function (b) { b.onclick = function () { state.grade = b.dataset.g ? +b.dataset.g : ""; lset("sp.grade", state.grade); viewHome(); }; });
  }

  // ---------- 학생: 연습 ----------
  var runToken = 0;
  function viewPractice(id) {
    var set = state.sets.filter(function (s) { return s.id === id; })[0];
    if (!set) { $("#main").innerHTML = '<div class="card center muted">대화문을 찾을 수 없어요. <a href="#/">목록으로</a></div>'; return; }
    var sps = speakers(set.lines), hasKo = set.lines.some(function (l) { return l.ko; });
    var ui = { mode: "line", role: sps[0] || "", busy: false };
    var last = {}; // line → {score, said, okTok}
    function bm() { return bestMap(state.att.filter(function (a) { return a.set_id === id; })); }

    function draw() {
      var b = bm(), p = setProgress(set, b);
      $("#main").innerHTML =
        '<div class="card"><div class="small"><a href="#/">← 목록</a></div><h2 style="margin-top:4px">' + esc(set.title) + ' <span class="pill">' + esc(set.lesson || "") + "</span></h2>" +
        '<div class="summary"><span>연습한 줄 <b>' + p.done + "/" + p.n + '</b></span><span>평균 최고점 <b class="' + sCls(p.avg) + '">' + p.avg + "</b>점</span></div></div>" +
        '<div class="card sticky"><div class="ctrl">' +
        '<div class="seg" id="modeSeg"><button data-m="line" class="' + (ui.mode === "line" ? "on" : "") + '">한 줄씩</button><button data-m="role" class="' + (ui.mode === "role" ? "on" : "") + '">역할 연기</button><button data-m="listen" class="' + (ui.mode === "listen" ? "on" : "") + '">전체 듣기</button></div>' +
        (ui.mode === "role" ? '<label>내 역할 <select id="roleSel">' + sps.map(function (s) { return '<option ' + (s === ui.role ? "selected" : "") + ">" + esc(s) + "</option>"; }).join("") + "</select></label>" : "") +
        (ui.mode !== "line" ? '<button class="btn ' + (ui.busy ? "red" : "gold") + '" id="runBtn">' + (ui.busy ? "■ 멈추기" : "▶ 시작") + "</button>" : "") +
        '<label>속도 <input type="range" id="rate" min="0.6" max="1.2" step="0.1" value="' + state.rate + '" style="width:110px"> <span id="rateV">' + state.rate.toFixed(1) + "</span></label>" +
        (hasKo ? '<label><input type="checkbox" id="koCb" ' + (state.showKo ? "checked" : "") + "> 한국어 뜻</label>" : "") +
        "</div>" + (ui.mode === "role" ? '<p class="note" style="margin:6px 0 0">컴퓨터가 다른 역할을 읽고, 내 차례가 되면 마이크가 저절로 켜져요.</p>' : "") + "</div>" +
        '<div class="lines">' + set.lines.map(function (l, i) {
          var si = sps.indexOf(l.who), r = last[i], best = b[id + ":" + i];
          return '<div class="ln' + (ui.mode === "role" && l.who === ui.role ? " mine" : "") + '" id="ln' + i + '">' +
            (l.who ? '<span class="who" style="background:' + spColor(si) + '">' + esc(l.who) + "</span>" : "") +
            '<div class="txt">' + renderWords(l.text, r && r.okTok) + "</div>" +
            (l.ko ? '<div class="ko' + (state.showKo ? "" : " hidden") + '">' + esc(l.ko) + "</div>" : "") +
            '<div class="acts"><button class="btn sm" data-say="' + i + '">🔊 듣기</button><button class="btn sm navy" data-mic="' + i + '"' + (SR ? "" : " disabled") + '>🎤 따라 말하기</button>' +
            '<span class="best">' + (best != null ? '최고 <span class="' + sCls(best) + '">' + best + "</span>점" : '<span class="muted small">아직 안 함</span>') + "</span></div>" +
            '<div class="heard' + (r ? "" : " hidden") + '" id="hd' + i + '">' + (r ? heardHtml(r) : "") + "</div></div>";
        }).join("") + "</div>" +
        '<p class="note">🔒 녹음은 저장되지 않아요. 인식된 글자와 점수만 저장돼요. 초록 = 정확히 들린 단어, 빨강 = 빠지거나 다르게 들린 단어.</p>';
      bind();
    }
    function heardHtml(r) { return '들린 말: <b>' + esc(r.said) + '</b> → <span class="score ' + sCls(r.score) + '">' + r.score + "점</span> (" + r.matched + "/" + r.total + "단어)"; }
    function bind() {
      $$("#modeSeg button").forEach(function (b) { b.onclick = function () { stopRun(); ui.mode = b.dataset.m; draw(); }; });
      var rs = $("#roleSel"); if (rs) rs.onchange = function () { ui.role = rs.value; draw(); };
      var rb = $("#runBtn"); if (rb) rb.onclick = function () { if (ui.busy) stopRun(); else run(); };
      var rt = $("#rate"); rt.oninput = function () { state.rate = +rt.value; $("#rateV").textContent = state.rate.toFixed(1); lset("sp.rate", state.rate); };
      var kc = $("#koCb"); if (kc) kc.onchange = function () { state.showKo = kc.checked; lset("sp.ko", state.showKo); $$(".ln .ko").forEach(function (k) { k.classList.toggle("hidden", !state.showKo); }); };
      $$("[data-say]").forEach(function (b) { b.onclick = function () { var i = +b.dataset.say; mark(i); speak(set.lines[i].text, sps.indexOf(set.lines[i].who)); }; });
      $$("[data-mic]").forEach(function (b) { b.onclick = function () { if (rec) { stopListen(); return; } sayLine(+b.dataset.mic, "line").catch(function () { draw(); }); }; });
    }
    function mark(i) { $$(".ln.now").forEach(function (x) { x.classList.remove("now"); }); var el = $("#ln" + i); if (el) { el.classList.add("now"); el.scrollIntoView({ behavior: "smooth", block: "center" }); } }
    function sayLine(i, mode) {
      var btn = $('[data-mic="' + i + '"]'), hd = $("#hd" + i);
      mark(i);
      if (btn) { btn.classList.add("red", "mic-live"); btn.textContent = "■ 듣는 중… (누르면 멈춤)"; }
      hd.classList.remove("hidden"); hd.innerHTML = '<span class="muted">🎙️ 말해 보세요…</span>';
      return listen(function (t) { hd.innerHTML = '<span class="muted">🎙️ ' + esc(t) + "</span>"; }).then(function (alts) {
        var r = bestOf(set.lines[i].text, alts); last[i] = r;
        var a = { email: state.email, set_id: id, line_idx: i, said: r.said.slice(0, 300), score: r.score, mode: mode };
        state.att.push({ set_id: id, line_idx: i, score: r.score, created_at: new Date().toISOString() });
        return store.addAttempt(a).catch(function (e) { toast("점수를 저장하지 못했어요: " + e.message); }).then(function () { return r; });
      }).catch(function (e) {
        var m = micMsg(e); hd.innerHTML = m ? '<span class="err">' + esc(m) + "</span>" : "";
        if (e && (e.message === "not-allowed" || e.message === "unsupported")) throw e;
        return null;
      }).then(function (r) {
        if (r) { var y = window.scrollY; draw(); window.scrollTo(0, y); mark(i); }
        else if (btn) { btn.classList.remove("red", "mic-live"); btn.textContent = "🎤 따라 말하기"; }
        return r;
      });
    }
    function stopRun() { runToken++; ui.busy = false; stopListen(); if (window.speechSynthesis) speechSynthesis.cancel(); }
    function run() {
      var tok = ++runToken; ui.busy = true; draw();
      var i = 0;
      function step() {
        if (tok !== runToken) return;
        if (i >= set.lines.length) { ui.busy = false; draw(); toast(ui.mode === "role" ? "역할 연기 끝! 👏" : "끝까지 들었어요."); return; }
        var l = set.lines[i], idx = i; i++;
        mark(idx);
        if (ui.mode === "role" && l.who === ui.role) {
          sayLine(idx, "role").then(function () { if (tok === runToken) { var rb = $("#runBtn"); if (rb) { rb.textContent = "■ 멈추기"; rb.className = "btn red"; } setTimeout(step, 700); } }, function () { stopRun(); draw(); });
        } else speak(l.text, sps.indexOf(l.who)).then(function () { setTimeout(step, 350); });
      }
      step();
    }
    draw();
  }

  // ---------- 교사: 대화문 관리 ----------
  function viewTeacher() {
    var sets = state.sets.slice();
    $("#main").innerHTML = '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h2 style="margin:0">👩‍🏫 대화문 관리</h2><a class="btn gold" href="#/teacher/edit">＋ 새 대화문 붙여 넣기</a></div>' +
      '<p class="note">공개한 대화문만 학생에게 보여요. [결과]에서 학생별 연습 기록을 볼 수 있어요.</p>' +
      (sets.length ? '<div class="tbl-wrap"><table><thead><tr><th>단원</th><th>제목</th><th>학년</th><th>줄</th><th>공개</th><th></th></tr></thead><tbody>' + sets.map(function (s) {
        return "<tr><td>" + esc(s.lesson || "") + "</td><td><a href='#/set/" + s.id + "'>" + esc(s.title) + "</a></td><td>" + (s.grade ? s.grade + "학년" : "전체") + '</td><td class="num">' + s.lines.length +
          '</td><td><label><input type="checkbox" data-pub="' + s.id + '" ' + (s.published ? "checked" : "") + '> 공개</label></td><td style="white-space:nowrap"><a class="btn sm" href="#/teacher/edit/' + s.id + '">편집</a> <a class="btn sm navy" href="#/teacher/results/' + s.id + '">결과</a></td></tr>';
      }).join("") + "</tbody></table></div>" : '<div class="center muted">아직 대화문이 없어요.</div>') + "</div>";
    $$("[data-pub]").forEach(function (c) { c.onchange = function () {
      var s = state.sets.filter(function (x) { return x.id === +c.dataset.pub; })[0]; s.published = c.checked;
      store.saveSet(s).then(function () { toast(c.checked ? "학생에게 공개했어요" : "비공개로 바꿨어요"); }, function (e) { toast("저장 실패: " + e.message); c.checked = !c.checked; });
    }; });
  }
  function viewEdit(id) {
    var s = id ? state.sets.filter(function (x) { return x.id === id; })[0] : null;
    if (id && !s) { location.hash = "#/teacher"; return; }
    var text = s ? s.lines.map(function (l) { return (l.who ? l.who + ": " : "") + l.text + (l.ko ? " | " + l.ko : ""); }).join("\n") : "";
    $("#main").innerHTML = '<div class="card"><div class="small"><a href="#/teacher">← 대화문 관리</a></div><h2 style="margin-top:4px">' + (s ? "대화문 고치기" : "새 대화문 붙여 넣기") + '</h2><div class="form">' +
      '<div class="row"><label>단원 (예: 1-3)<input id="eLesson" value="' + esc(s ? s.lesson : "") + '" maxlength="20"></label>' +
      '<label>학년<select id="eGrade"><option value="">전 학년</option>' + [1, 2, 3].map(function (g) { return '<option value="' + g + '" ' + (s && s.grade === g ? "selected" : "") + ">" + g + "학년</option>"; }).join("") + "</select></label>" +
      '<label>순서 (작을수록 위)<input id="eSort" type="number" value="' + (s ? s.sort || 0 : state.sets.length) + '"></label></div>' +
      '<label>제목<input id="eTitle" value="' + esc(s ? s.title : "") + '" maxlength="80" placeholder="예: Listen & Talk A — Making Plans"></label>' +
      '<label>대화문 붙여 넣기<textarea id="eText" placeholder="Minsu: What are you going to do this weekend? | 이번 주말에 뭐 할 거야?\nJenny: I\'m going to visit my grandmother.">' + esc(text) + "</textarea></label>" +
      '<p class="note" style="margin:0">한 줄에 한 사람의 말: <b>이름: 영어 문장</b>. 한국어 뜻은 선택이고 <b>|</b> 뒤에 써요. 이름 없이 시작하는 줄은 앞 줄에 이어 붙여요.</p>' +
      '<label style="flex-direction:row;align-items:center"><input type="checkbox" id="ePub" ' + (s && s.published ? "checked" : "") + "> 학생에게 공개</label>" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn navy" id="eSave">저장</button>' + (s ? '<button class="btn" id="eDel">삭제</button>' : "") + "</div></div></div>" +
      '<div class="card preview"><h3>미리보기 <span class="small muted" id="pvN"></span></h3><div class="lines" id="pv"></div></div>';
    function pv() {
      var ls = parseDialog($("#eText").value), sps = speakers(ls);
      $("#pvN").textContent = ls.length + "줄 · 등장인물 " + (sps.join(", ") || "없음");
      $("#pv").innerHTML = ls.map(function (l) { return '<div class="ln">' + (l.who ? '<span class="who" style="background:' + spColor(sps.indexOf(l.who)) + '">' + esc(l.who) + "</span>" : "") + '<div class="txt">' + esc(l.text) + "</div>" + (l.ko ? '<div class="ko">' + esc(l.ko) + "</div>" : "") + "</div>"; }).join("") || '<div class="muted">대화문을 붙여 넣으면 여기에 보여요.</div>';
    }
    $("#eText").oninput = pv; pv();
    $("#eSave").onclick = function () {
      var lines = parseDialog($("#eText").value), title = $("#eTitle").value.trim();
      if (!title) return toast("제목을 써 주세요.");
      if (!lines.length) return toast("대화문을 붙여 넣어 주세요.");
      var row = { id: s ? s.id : undefined, title: title, lesson: $("#eLesson").value.trim(), grade: $("#eGrade").value ? +$("#eGrade").value : null, lines: lines, published: $("#ePub").checked, sort: +$("#eSort").value || 0 };
      if (s && JSON.stringify(s.lines.map(function (l) { return l.text; })) !== JSON.stringify(lines.map(function (l) { return l.text; })) && !confirm("문장을 바꾸면 줄 번호가 달라져서 예전 점수가 다른 줄에 붙을 수 있어요. 저장할까요?")) return;
      $("#eSave").disabled = true;
      store.saveSet(row).then(function (saved) {
        toast("저장했어요");
        return store.sets().then(function (a) { state.sets = a; location.hash = "#/teacher"; });
      }, function (e) { $("#eSave").disabled = false; toast("저장 실패: " + e.message); });
    };
    if (s) $("#eDel").onclick = function () {
      if (!confirm("'" + s.title + "' 대화문을 지울까요? 학생 연습 기록도 함께 지워져요.")) return;
      store.deleteSet(s.id).then(function () { return store.sets(); }).then(function (a) { state.sets = a; toast("지웠어요"); location.hash = "#/teacher"; }, function (e) { toast("삭제 실패: " + e.message); });
    };
  }
  function viewResults(id) {
    var s = state.sets.filter(function (x) { return x.id === id; })[0];
    if (!s) { location.hash = "#/teacher"; return; }
    $("#main").innerHTML = '<div class="card center muted">기록을 불러오는 중…</div>';
    Promise.all([store.setAttempts(id), store.roster().catch(function () { return []; })]).then(function (r) {
      var att = r[0], roster = r[1], by = {};
      att.forEach(function (a) {
        var e = low(a.email), x = by[e] || (by[e] = { best: {}, n: 0, last: 0 });
        x.n++; if (!(x.best[a.line_idx] >= a.score)) x.best[a.line_idx] = a.score;
        var t = Date.parse(a.created_at); if (t > x.last) x.last = t;
      });
      var people = {}; roster.forEach(function (p) { if (!s.grade || p.grade === s.grade) people[low(p.email)] = p; });
      Object.keys(by).forEach(function (e) { if (!people[e]) { var m = e.match(/^\d{4}(\d)(\d{2})(\d{2})@/); people[e] = { email: e, name: "", grade: m ? +m[1] : null, class_no: m ? +m[2] : null, student_no: m ? +m[3] : null }; } });
      var classes = {}; Object.keys(people).forEach(function (e) { var p = people[e]; if (p.class_no) classes[p.grade + "-" + p.class_no] = 1; });
      var cf = lget("sp.cls", "");
      var N = s.lines.length;
      function rows() {
        return Object.keys(people).map(function (e) { return people[e]; }).filter(function (p) { return !cf || (p.grade + "-" + p.class_no) === cf; })
          .sort(function (a, b) { return (a.grade || 9) - (b.grade || 9) || (a.class_no || 99) - (b.class_no || 99) || (a.student_no || 99) - (b.student_no || 99); })
          .map(function (p) {
            var x = by[low(p.email)], done = x ? Object.keys(x.best).length : 0, sum = 0;
            if (x) Object.keys(x.best).forEach(function (k) { sum += x.best[k]; });
            return { p: p, done: done, avg: Math.round(sum / N), n: x ? x.n : 0, last: x ? x.last : 0 };
          });
      }
      var lineStat = s.lines.map(function (l, i) {
        var bests = Object.keys(by).map(function (e) { return by[e].best[i]; }).filter(function (v) { return v != null; });
        return { i: i, l: l, n: bests.length, avg: bests.length ? Math.round(bests.reduce(function (a, b) { return a + b; }, 0) / bests.length) : null };
      });
      function draw() {
        var rs = rows();
        $("#main").innerHTML = '<div class="card"><div class="small"><a href="#/teacher">← 대화문 관리</a></div><h2 style="margin-top:4px">📊 ' + esc(s.title) + ' <span class="pill">' + esc(s.lesson || "") + "</span></h2>" +
          '<div class="ctrl"><label>반 <select id="cf"><option value="">전체</option>' + Object.keys(classes).sort(function (a, b) { return a.localeCompare(b, undefined, { numeric: true }); }).map(function (k) { return '<option value="' + k + '" ' + (k === cf ? "selected" : "") + ">" + k.replace("-", "학년 ") + "반</option>"; }).join("") + "</select></label>" +
          '<button class="btn sm" id="csv">⬇️ CSV</button><span class="small muted">평균 최고점 = 줄마다 가장 잘한 점수의 평균 (안 한 줄은 0점)</span></div>' +
          '<div class="tbl-wrap" style="margin-top:8px"><table><thead><tr><th>학생</th><th>연습한 줄</th><th>평균 최고점</th><th>말한 횟수</th><th>마지막</th></tr></thead><tbody>' +
          rs.map(function (r) { return "<tr><td>" + esc(r.p.name || r.p.email) + ' <span class="small muted">' + (r.p.grade ? r.p.grade + "-" + r.p.class_no + "-" + r.p.student_no : "") + '</span></td><td class="num">' + r.done + "/" + N + '</td><td class="num"><span class="score ' + (r.done ? sCls(r.avg) : "") + '">' + (r.done ? r.avg : "—") + '</span></td><td class="num">' + r.n + '</td><td class="small">' + when(r.last) + "</td></tr>"; }).join("") +
          "</tbody></table></div></div>" +
          '<div class="card"><h3>줄별 평균 (어려운 문장 찾기)</h3><div class="tbl-wrap"><table><thead><tr><th>#</th><th>문장</th><th>연습한 학생</th><th>평균 최고점</th></tr></thead><tbody>' +
          lineStat.map(function (x) { return '<tr><td class="num">' + (x.i + 1) + "</td><td>" + (x.l.who ? "<b>" + esc(x.l.who) + ":</b> " : "") + esc(x.l.text) + '</td><td class="num">' + x.n + '</td><td class="num"><span class="score ' + (x.avg != null ? sCls(x.avg) : "") + '">' + (x.avg != null ? x.avg : "—") + "</span></td></tr>"; }).join("") +
          "</tbody></table></div></div>";
        $("#cf").onchange = function () { cf = $("#cf").value; lset("sp.cls", cf); draw(); };
        $("#csv").onclick = function () {
          var q = function (v) { return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"'; };
          var out = [["학년", "반", "번호", "이름", "이메일", "연습한 줄", "전체 줄", "평균 최고점", "말한 횟수", "마지막"].map(q).join(",")].concat(rs.map(function (r) {
            return [r.p.grade, r.p.class_no, r.p.student_no, r.p.name, r.p.email, r.done, N, r.done ? r.avg : "", r.n, r.last ? kday(r.last) : ""].map(q).join(",");
          }));
          var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + out.join("\r\n")], { type: "text/csv;charset=utf-8" }));
          a.download = "말하기_" + (s.lesson || s.id) + "_" + kday(Date.now()) + ".csv"; a.click();
        };
      }
      draw();
    }).catch(function (e) { $("#main").innerHTML = '<div class="card err">기록을 불러오지 못했어요: ' + esc(e.message) + "</div>"; });
  }

  if (DEMO) window.__sp = { align: align, parseDialog: parseDialog, bestOf: bestOf };
  boot();
})();
