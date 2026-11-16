(function () {
  "use strict";

  /* ---------- 설정 (기존 독서 여권·지식 여권과 같은 Supabase·Google 로그인) ---------- */
  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SCHOOL_LABEL = "서울문영여자중학교";
  var PREVIEW = window.METRO_PREVIEW || null; // 화면 미리보기용 (실제 사이트에서는 없음)

  var METRO = window.METRO || { lines: [] };
  var LV = ["A1", "A2", "B1", "B2", "C1", "C2"];
  var LV_COLOR = { A1: "#7cc576", A2: "#2fa84f", B1: "#2563c9", B2: "#6b3fc1", C1: "#c13f86", C2: "#b02a2a", none: "#9aa1ab" };
  var EXITS = [
    { id: "read", no: 1, name: "읽기", open: false },
    { id: "stats", no: 2, name: "분석", open: true },
    { id: "words", no: 3, name: "단어", open: false },
    { id: "story", no: 4, name: "줄거리", open: false },
    { id: "quiz", no: 5, name: "퀴즈", open: false }
  ];

  var sb = (!PREVIEW && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, progress: {}, units: {}, words: {}, read: { ko: false, chunk: false, open: {} }, vocabFilter: "core" };

  /* ---------- 도우미 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function each(sel, fn, root) { Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); }
  function byId(id) { return document.getElementById(id); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2200);
  }
  function lvTag(lv) { return '<span class="lv lv-' + (lv || "none") + '">' + (lv || "—") + "</span>"; }
  function lineLabel(l) { return l.label || (l.school + l.grade); }
  function stNo(s) { return s.no || String(s.unit); }
  function findStation(id) {
    for (var i = 0; i < METRO.lines.length; i++) {
      var l = METRO.lines[i];
      for (var k = 0; k < l.stations.length; k++) if (l.stations[k].id === id) return { line: l, st: l.stations[k], idx: k };
    }
    return null;
  }
  function cleanMsg(m) { return String(m || "").replace(/^external:\s*/, ""); }
  function normWord(s) { return String(s || "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]/g, "").trim(); }

  /* ---------- 소리 (브라우저 내장 영어 음성) ---------- */
  var voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices();
    voice = vs.filter(function (v) { return /en[-_]US/i.test(v.lang) && /Samantha|Google|Jenny|Aria|Natural/i.test(v.name); })[0] ||
      vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function speak(text, onend) {
    if (!window.speechSynthesis) { toast("이 브라우저는 음성 읽기를 지원하지 않아요"); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(String(text).replace(/[#*]/g, ""));
    u.lang = "en-US"; u.rate = 0.9; if (voice) u.voice = voice;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
  }

  /* ---------- 서버 ---------- */
  function rpc(name, args) {
    return sb.rpc(name, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  var api = {
    unit: function (id) {
      if (state.units[id]) return Promise.resolve(state.units[id]);
      var p = PREVIEW ? Promise.resolve(PREVIEW.units[id] || null) : rpc("tm_get_unit", { p_id: id });
      return p.then(function (c) { if (c) state.units[id] = c; return c; });
    },
    quiz: function (id) {
      if (PREVIEW) return Promise.resolve((PREVIEW.quiz[id] || []).map(function (q) { return { no: q.no, question: q.question, choices: q.choices.slice() }; }));
      return rpc("tm_get_quiz", { p_id: id });
    },
    submitQuiz: function (id, answers) {
      if (PREVIEW) {
        var qs = PREVIEW.quiz[id] || [], score = 0;
        var review = qs.map(function (q) { var a = q.choices[q.answer - 1], ok = answers[q.no] === a; if (ok) score++; return { no: q.no, answer: a, why: q.why, ids: q.ids, correct: ok }; });
        return Promise.resolve({ score: score, total: qs.length, best: score, review: review });
      }
      return rpc("tm_submit_quiz", { p_id: id, p_answers: answers });
    },
    saveSummary: function (id, stage, score, total) {
      if (PREVIEW) return Promise.resolve();
      return rpc("tm_save_summary", { p_id: id, p_stage: stage, p_score: score, p_total: total });
    },
    wordResult: function (id, word, ok) {
      var cur = (state.words[id] || {})[word] || { box: 0, wrong: 0 };
      var days = [0, 1, 2, 4, 7, 14];
      var box = ok ? Math.min(cur.box + 1, 5) : 0;
      var due = new Date(); due.setDate(due.getDate() + days[box]);
      state.words[id] = state.words[id] || {};
      state.words[id][word] = { box: box, wrong: cur.wrong + (ok ? 0 : 1), due: due.toISOString().slice(0, 10) };
      if (PREVIEW) return Promise.resolve();
      return rpc("tm_word_result", { p_id: id, p_word: word, p_ok: ok }).catch(function (e) { console.warn(e); });
    },
    myWords: function (id) {
      if (state.words[id]) return Promise.resolve(state.words[id]);
      if (PREVIEW) { state.words[id] = {}; return Promise.resolve(state.words[id]); }
      return rpc("tm_my_words", { p_id: id }).then(function (rows) {
        var m = {}; (rows || []).forEach(function (r) { m[r.word] = { box: r.box, wrong: r.wrong, due: r.due }; });
        state.words[id] = m; return m;
      });
    },
    progress: function () {
      if (PREVIEW) return Promise.resolve(PREVIEW.progress || {});
      return rpc("tm_my_progress");
    },
    adminScores: function () {
      if (PREVIEW) return Promise.resolve(PREVIEW.admin || []);
      return rpc("tm_admin_scores");
    }
  };

  /* ---------- 로그인 (기존 앱과 같은 방식: Google ID 토큰 → Supabase) ---------- */
  function waitGoogle(fn) {
    if (window.google && google.accounts && google.accounts.id) fn();
    else setTimeout(function () { waitGoogle(fn); }, 200);
  }
  function mountGoogle(el) {
    if (!el) return;
    if (PREVIEW) { el.innerHTML = '<button class="btn" type="button">Google 계정으로 로그인</button>'; return; }
    waitGoogle(function () {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogle });
      google.accounts.id.renderButton(el, { theme: "outline", size: "large", text: "signin_with", locale: "ko", shape: "pill" });
    });
  }
  async function onGoogle(resp) {
    var r = await sb.auth.signInWithIdToken({ provider: "google", token: resp.credential });
    if (r.error) { var e = byId("gateerr"); if (e) e.textContent = "로그인에 실패했어요: " + r.error.message; return; }
    await loadUser(); route();
  }
  async function signOut() {
    if (sb) await sb.auth.signOut();
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    state.user = null; state.profile = null; state.isAdmin = false; state.progress = {}; state.units = {}; state.words = {};
    renderWho(); location.hash = "#/"; route();
  }
  async function loadUser() {
    if (PREVIEW) {
      state.user = PREVIEW.user || null; state.profile = PREVIEW.profile || null; state.isAdmin = !!PREVIEW.isAdmin;
    } else {
      var s = await sb.auth.getSession();
      var session = s.data && s.data.session;
      if (!session) { state.user = null; renderWho(); return; }
      state.user = session.user;
      var p = await sb.from("profiles").select("*").eq("id", state.user.id).maybeSingle();
      state.profile = p.data;
      var a = await sb.rpc("is_admin");
      state.isAdmin = !!a.data;
    }
    if (state.user) { try { state.progress = (await api.progress()) || {}; } catch (e) { console.warn(e); state.progress = {}; } }
    renderWho();
  }
  function renderWho() {
    if (!state.user) { $who.innerHTML = '<a class="tbtn" href="#/login">로그인</a>'; return; }
    var p = state.profile || {};
    var nick = p.nickname || p.name || (state.user.email || "").split("@")[0];
    $who.innerHTML =
      '<span class="card-id"><i>' + esc((nick || "?").slice(0, 1)) + "</i>" + esc(nick) + (p.role === "school" ? "" : ' <span class="muted">· 외부</span>') + "</span>" +
      '<a class="tbtn" href="#/review">환승센터</a>' +
      (state.isAdmin ? '<a class="tbtn" href="#/teacher">교사 화면</a>' : "") +
      '<button class="tbtn" id="signout">로그아웃</button>';
    byId("signout").onclick = signOut;
  }
  function gateHTML(title) {
    return '<section class="gate">' +
      '<div class="gate-art"><div><h2>개찰구</h2><p>교과서 본문은 로그인한 이용자만 볼 수 있어요.</p></div>' +
      '<div class="turnstile"><span></span><span></span><span></span><span></span></div></div>' +
      '<div class="gate-body"><h3>' + esc(title || "로그인하고 승차하기") + "</h3>" +
      "<ul><li>본문 읽기, 문장별 해설, 원어민 음성</li><li>단어 플래시카드·짝 맞추기·철자·듣기와 복습 일정</li><li>줄거리 빈칸·순서 드래그앤드롭, 퀴즈</li></ul>" +
      '<div id="gbtn"></div><p class="muted" style="margin:0;font-size:.86rem">학교 계정(@smy.ms.kr)으로 로그인하세요. 분석 출구는 로그인 없이도 볼 수 있어요.</p>' +
      '<div class="err" id="gateerr"></div></div></section>';
  }

  /* ---------- 라우터 ---------- */
  function route() {
    if (window.speechSynthesis) speechSynthesis.cancel();
    var h = (location.hash || "#/").slice(1);
    var parts = h.split("?")[0].split("/").filter(Boolean);
    var query = {}; (h.split("?")[1] || "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) query[p[0]] = decodeURIComponent(p[1] || ""); });
    window.scrollTo(0, 0);
    try {
      if (!parts.length) return renderHome();
      if (parts[0] === "login") { $app.innerHTML = state.user ? "" : gateHTML(); if (state.user) location.hash = "#/"; else mountGoogle(byId("gbtn")); return; }
      if (parts[0] === "s" && parts[1]) return renderStation(parts[1], parts[2] || "read", query);
      if (parts[0] === "review") return renderReview();
      if (parts[0] === "teacher") return renderTeacher();
      renderHome();
    } catch (e) { showError(e); }
  }
  function showError(e) {
    console.error(e);
    $app.innerHTML = '<div class="panel"><h2>문제가 생겼어요</h2><p class="muted">' + esc(cleanMsg(e && e.message)) + '</p><a class="btn small" href="#/">노선도로</a></div>';
  }

  /* ---------- 첫 화면: 노선도 ---------- */
  function stationClass(id) {
    var p = state.progress[id];
    if (!p) return "";
    if (p.quiz != null && p.quizTotal && p.quiz === p.quizTotal && (p.stages || []).length >= 4) return "perfect";
    if (p.quiz != null || (p.stages || []).length) return "done";
    return "";
  }
  function dueTotal() {
    var n = 0; Object.keys(state.progress).forEach(function (k) { n += state.progress[k].due || 0; }); return n;
  }
  function renderHome() {
    var html = '<section class="hero"><div><h1>어느 역으로 갈까요?</h1><p>2022 개정 영어 교과서 본문을 노선도처럼 한 역씩 따라가요.</p></div>' +
      (state.user ? '<a class="transfer" href="#/review"><span class="ring">' + dueTotal() + '</span><span><b>환승센터</b><small>오늘 복습할 단어</small></span></a>' :
        '<a class="transfer" href="#/login"><span class="ring">→</span><span><b>개찰구</b><small>로그인하고 승차하기</small></span></a>') + "</section>";
    html += '<section class="metro">';
    METRO.lines.forEach(function (l) {
      var planned = l.status !== "open";
      var stations = planned ? [0, 1, 2, 3] : l.stations;
      html += '<div class="mline" style="--c:' + l.color + '">' +
        '<div class="mline-id"><span class="badge-line">' + esc(lineLabel(l)) + '</span><span><b>' + esc(l.course) + "</b><small>" +
        esc(planned ? (l.note || "준비 중") : l.publisher + (l.author ? "(" + l.author + ")" : "") + " · " + l.stations.length + "개 역") + "</small></span></div>" +
        '<div class="track' + (planned ? " planned" : "") + '" style="--n:' + stations.length + '">';
      stations.forEach(function (s, i) {
        if (planned) {
          html += '<div class="st ghost"><span class="dot"></span><span class="no">' + esc(lineLabel(l)) + "-" + (i + 1) + '</span><span class="txt"><span class="nm">' + (i === 0 ? "공사 중" : "") + "</span></span></div>";
          return;
        }
        html += '<a class="st ' + stationClass(s.id) + '" href="#/s/' + s.id + '/read" title="' + esc(s.unitTitle) + '">' +
          '<span class="dot"></span><span class="no">' + esc(lineLabel(l)) + "-" + stNo(s) + "</span>" +
          '<span class="txt"><span class="nm">' + esc(s.readingTitle) + '</span><span class="meta">' + s.stats.words + "w " + lvTag(s.stats.cefr) + "</span></span></a>";
      });
      html += "</div></div>";
    });
    html += '<div class="legend"><span><i class="dot"></i>아직 안 간 역</span><span><i class="dot done"></i>퀴즈나 줄거리를 푼 역</span><span><i class="dot perfect"></i>퀴즈 만점 + 줄거리 4단계 모두</span></div></section>';

    html += '<section class="board"><h3>Departures · 본문 분석표</h3><table><thead><tr><th>노선</th><th>본문</th><th>단어 수</th><th>CEFR</th><th class="hide-sm">Lexile</th></tr></thead><tbody>';
    METRO.lines.forEach(function (l) {
      l.stations.forEach(function (s) {
        html += '<tr data-go="#/s/' + s.id + '/stats" style="--c:' + l.color + '"><td><span class="pill">' + esc(lineLabel(l)) + "</span>" + stNo(s) + '</td><td class="t">' + esc(s.readingTitle) +
          "</td><td>" + s.stats.words + "</td><td>" + lvTag(s.stats.cefr) + '</td><td class="hide-sm">' + (s.stats.lexileOfficial ? s.stats.lexileOfficial + "L" : "≈" + s.stats.lexile + "L") + "</td></tr>";
      });
    });
    html += '</tbody></table><p class="muted" style="font-size:.74rem;margin:8px 0 0">단어 수는 제목·소제목 포함. CEFR·Lexile은 추정치(≈)이고, 공식 Lexile 지수를 받으면 그 값으로 바꿔 표시해요.</p></section>';
    $app.innerHTML = html;
    each("tr[data-go]", function (tr) { tr.onclick = function () { location.hash = tr.getAttribute("data-go"); }; });
  }

  /* ---------- 역 화면 ---------- */
  function renderStation(id, exit, query) {
    var f = findStation(id);
    if (!f) { location.hash = "#/"; return; }
    var l = f.line, s = f.st, prev = l.stations[f.idx - 1], next = l.stations[f.idx + 1];
    var ex = EXITS.filter(function (e) { return e.id === exit; })[0] || EXITS[0];
    var html = '<div style="--c:' + l.color + '">' +
      '<section class="sign"><div class="sign-top"><span class="badge-line">' + esc(lineLabel(l)) + '</span><div class="sign-name"><small>' +
      esc(l.publisher + " · " + l.course + " · " + (s.lesson || "Lesson " + s.unit) + " " + s.unitTitle + (s.pageRange ? " · p." + s.pageRange : "")) + "</small><h1>" + esc(s.readingTitle) + "</h1><p>" + esc(s.subtitleKo) + "</p></div></div>" +
      '<div class="sign-bar">' +
      (prev ? '<a href="#/s/' + prev.id + "/" + ex.id + '">← ' + esc(prev.readingTitle) + "</a>" : '<span class="off">← 출발역</span>') +
      '<span class="here">' + esc(lineLabel(l)) + "-" + stNo(s) + "</span>" +
      (next ? '<a class="next" href="#/s/' + next.id + "/" + ex.id + '">' + esc(next.readingTitle) + " →</a>" : '<span class="off next" style="text-align:right">종착역 →</span>') +
      "</div></section>" +
      '<nav class="exits">' + EXITS.map(function (e) {
        var locked = !e.open && !state.user;
        return '<a class="exitbtn' + (e.id === ex.id ? " on" : "") + '" href="#/s/' + id + "/" + e.id + '"><i>' + e.no + "</i>" + e.name + (locked ? ' <span class="lock">🔒</span>' : "") + "</a>";
      }).join("") + "</nav>" +
      '<div id="exitbody"><p class="loading">불러오는 중…</p></div></div>';
    $app.innerHTML = html;
    var body = byId("exitbody");
    if (ex.id === "stats") return drawStats(body, f);
    if (!state.user) { body.innerHTML = gateHTML("이 출구는 로그인해야 열려요"); mountGoogle(byId("gbtn")); return; }
    api.unit(id).then(function (c) {
      if (!c) { body.innerHTML = '<div class="panel"><h2>아직 열리지 않은 역이에요</h2><p class="muted">학교 계정으로 로그인한 학생만 본문을 볼 수 있어요. 교사가 서버에 본문을 등록했는지도 확인해 주세요.</p></div>'; return; }
      if (ex.id === "read") drawRead(body, f, c, query);
      else if (ex.id === "words") drawWords(body, f, c, query);
      else if (ex.id === "story") drawStory(body, f, c, query);
      else if (ex.id === "quiz") drawQuiz(body, f, c);
    }).catch(function (e) { body.innerHTML = '<div class="panel"><h2>본문을 불러오지 못했어요</h2><p class="muted">' + esc(cleanMsg(e.message)) + "</p></div>"; });
  }

  /* ----- 1번 출구: 읽기 ----- */
  function sentenceHTML(x, c) {
    var R = state.read;
    var cls = x.tag === "제목" ? " h" : (x.tag === "소제목" ? " sub" : "");
    var en = R.chunk && x.chunk ? esc(x.chunk).replace(/\s\/\s?/g, ' <span class="chunk">/</span> ') : esc(x.en);
    var html = '<button class="sent' + cls + (R.open[x.id] ? " open" : "") + '" data-sid="' + x.id + '" id="s' + x.id + '"><span class="sid">' + x.id + "</span>" + en +
      (R.ko ? '<span class="ko">' + esc(x.ko) + "</span>" : "") + "</button>";
    if (R.open[x.id]) {
      html += '<div class="note"><dl>' +
        "<dt>해석</dt><dd>" + esc(x.ko) + ' <button class="speak" data-say="' + esc(x.en) + '" aria-label="듣기">🔊</button></dd>' +
        "<dt>어휘</dt><dd>" + esc(x.vocab) + "</dd><dt>문법</dt><dd>" + esc(x.grammar) + "</dd><dt>의미</dt><dd>" + esc(x.meaning) + "</dd></dl></div>";
    }
    return html;
  }
  function drawRead(body, f, c, query) {
    var R = state.read;
    function paint() {
      var html = '<div class="panel"><div class="reader-tools">' +
        '<button class="tog' + (R.ko ? " on" : "") + '" id="tko">해석 보기</button>' +
        '<button class="tog' + (R.chunk ? " on" : "") + '" id="tchunk">끊어 읽기</button>' +
        '<button class="tog" id="tplay">🔊 전체 듣기</button>' +
        '<span class="muted" style="font-size:.82rem">문장을 누르면 어휘·문법·의미 해설이 열려요.</span></div>';
      var ch = 0;
      c.sentences.forEach(function (x) {
        if (x.chapter !== ch) { ch = x.chapter; html += '<div class="chapter"><b>' + String(ch).padStart(2, "0") + "</b>" + esc((c.chapters || [])[ch - 1] || "") + "</div>"; }
        html += sentenceHTML(x, c);
      });
      html += "</div>";
      if (c.overview) {
        html += '<div class="panel"><h2>이 역의 핵심</h2><div class="grid2"><div><b>주제</b><p style="margin:4px 0">' + esc(c.overview.topicEn) + '<br><span class="muted">' + esc(c.overview.topicKo) + "</span></p></div>" +
          "<div><b>요지</b><p style=\"margin:4px 0\">" + esc(c.overview.mainEn) + '<br><span class="muted">' + esc(c.overview.mainKo) + "</span></p></div></div></div>";
      }
      body.innerHTML = html;
      byId("tko").onclick = function () { R.ko = !R.ko; paint(); };
      byId("tchunk").onclick = function () { R.chunk = !R.chunk; paint(); };
      byId("tplay").onclick = playAll;
      each(".sent", function (b) { b.onclick = function () { var i = +b.getAttribute("data-sid"); R.open[i] = !R.open[i]; paint(); var el = byId("s" + i); if (el) el.focus(); }; });
      each("[data-say]", function (b) { b.onclick = function (e) { e.stopPropagation(); speak(b.getAttribute("data-say")); }; });
    }
    var playing = false;
    function playAll() {
      if (playing) { playing = false; speechSynthesis.cancel(); each(".speaking", function (e) { e.classList.remove("speaking"); }); return; }
      playing = true;
      var list = c.sentences.slice(), i = 0;
      (function step() {
        each(".speaking", function (e) { e.classList.remove("speaking"); });
        if (!playing || i >= list.length) { playing = false; return; }
        var x = list[i++], el = byId("s" + x.id);
        if (el) { el.classList.add("speaking"); el.scrollIntoView({ block: "center", behavior: "smooth" }); }
        speak(x.en, function () { setTimeout(step, 250); });
      })();
    }
    paint();
    if (query && query.s) {
      var el = byId("s" + query.s);
      if (el) { el.scrollIntoView({ block: "center" }); el.classList.add("flash"); }
    }
  }

  /* ----- 2번 출구: 분석 (전광판) ----- */
  function drawStats(body, f) {
    var s = f.st, st = s.stats, l = f.line;
    var dist = st.cefrDist, leveled = LV.reduce(function (a, k) { return a + dist[k]; }, 0);
    var bar = LV.map(function (k) { return dist[k] ? '<span style="width:' + (dist[k] / leveled * 100) + "%;background:" + LV_COLOR[k] + '" title="' + k + " " + dist[k] + '"></span>' : ""; }).join("");
    var leg = LV.map(function (k) { return dist[k] ? "<span><i style=\"background:" + LV_COLOR[k] + '"></i>' + k + " " + Math.round(dist[k] / leveled * 100) + "%</span>" : ""; }).join("") +
      (dist.none ? '<span><i style="background:' + LV_COLOR.none + '"></i>목록 외 ' + dist.none + "개</span>" : "");
    var lex = st.lexileOfficial ? st.lexileOfficial + "<small>L</small>" : "≈" + st.lexile + "<small>L</small>";
    var html = '<section class="dep"><div class="dep-head"><h2>Text Analysis · 본문 분석</h2><small>' + esc(l.publisher + " " + lineLabel(l) + "-" + stNo(s)) + "</small></div>" +
      '<div class="tiles">' +
      '<div class="tile"><div class="k">단어 수 (제목 포함)</div><div class="v">' + st.words + '</div><div class="s">제목 ' + st.titleWords + "단어 포함</div></div>" +
      '<div class="tile"><div class="k">문장 수</div><div class="v">' + st.sentences + '</div><div class="s">제목·소제목 제외</div></div>' +
      '<div class="tile"><div class="k">평균 문장 길이</div><div class="v">' + st.msl + '<small> 단어</small></div><div class="s">한 문장당</div></div>' +
      '<div class="tile"><div class="k">CEFR 수준 <span class="tag-est">추정</span></div><div class="v">' + st.cefr + '</div><div class="s">어휘 95%가 이 수준 이하</div></div>' +
      '<div class="tile"><div class="k">Lexile <span class="tag-est' + (st.lexileOfficial ? " tag-off" : "") + '">' + (st.lexileOfficial ? "공식" : "추정") + '</span></div><div class="v">' + lex + '</div><div class="s">' + (st.lexileOfficial ? "MetaMetrics 공식 지수" : "±100L 정도 차이 날 수 있어요") + "</div></div>" +
      '<div class="tile"><div class="k">단어장 · 퀴즈</div><div class="v">' + s.vocabCount + '<small> 단어</small></div><div class="s">퀴즈 ' + s.quizCount + "문항</div></div>" +
      "</div>" +
      '<div style="margin-top:14px"><div class="k" style="color:#8a96a8;font-size:.78rem">어휘 수준 분포 (CEFR-J 기준, 사람·나라 이름 제외)</div><div class="distbar">' + bar + '</div><div class="distleg">' + leg + "</div></div></section>";

    var maxW = Math.max.apply(null, l.stations.map(function (x) { return x.stats.words; }));
    var maxL = Math.max.apply(null, l.stations.map(function (x) { return x.stats.lexile; }));
    function rows(key, max, unit) {
      return l.stations.map(function (x) {
        return '<div class="cmp-row' + (x.id === s.id ? " me" : "") + '"><span>' + lineLabel(l) + "-" + x.unit + '</span><span class="b"><span style="width:' + (x.stats[key] / max * 100) + '%"></span></span><span class="n">' + (key === "lexile" ? "≈" : "") + x.stats[key] + unit + "</span></div>";
      }).join("");
    }
    html += '<div class="grid2" style="margin-top:16px"><div class="panel"><h3>같은 노선의 단어 수</h3><div class="cmp">' + rows("words", maxW, "") + "</div></div>" +
      '<div class="panel"><h3>같은 노선의 Lexile (추정)</h3><div class="cmp">' + rows("lexile", maxL, "L") + "</div></div></div>";
    html += '<div class="panel"><h3>핵심 문법</h3><p style="margin:0">' + s.coreGrammar.map(esc).join(" · ") + "</p></div>";
    html += '<div class="panel method"><details><summary>수치는 어떻게 계산했나요?</summary>' +
      "<p><b>단어 수</b>: 제목과 소제목을 포함해 본문에 나온 영어 낱말을 모두 셌어요. I’m, kilometers처럼 붙어 있는 말은 1단어, 숫자 4도 1단어예요.</p>" +
      "<p><b>CEFR (추정)</b>: 낱말을 기본형으로 바꿔 CEFR-J 단어 목록에서 수준을 찾고, 본문 낱말의 95%가 들어가는 가장 낮은 수준을 골랐어요. 사람·나라 이름과 목록에 없는 낱말(외래어, 음식 이름 등)은 계산에서 뺐어요.</p>" +
      "<p><b>Lexile (추정)</b>: Lexile®은 MetaMetrics의 공식 지표라 이 앱이 공식 값을 만들 수는 없어요. 평균 문장 길이와 음절 수로 구한 읽기 학년(Flesch-Kincaid)을 Lexile 범위로 바꾼 근삿값이에요. 공식 값을 알려 주시면 ‘공식’으로 바꿔 표시해요.</p></details></div>";
    body.innerHTML = html;
  }

  /* ----- 3번 출구: 단어 ----- */
  function exampleOf(c, v) {
    var x = c.sentences.filter(function (s) { return s.id === v.sid; })[0];
    if (!x) return "";
    var forms = (v.forms ? v.forms.split("–") : [v.w]).map(function (s) { return s.trim(); }).filter(Boolean);
    var html = esc(x.en), done = false;
    forms.concat([v.w.split(" ")[0]]).forEach(function (fw) {
      if (done) return;
      var re = new RegExp("\\b(" + fw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[a-z]*)", "i");
      if (re.test(html)) { html = html.replace(re, "<mark>$1</mark>"); done = true; }
    });
    return html;
  }
  function blankOf(c, v) {
    return exampleOf(c, v).replace(/<mark>[^<]*<\/mark>/, "<mark>_____</mark>");
  }
  function isCore(v) { return v.lv !== "A1"; }
  function boxesHTML(b) { var h = '<span class="boxes" title="외운 정도 ' + b + '/5">'; for (var i = 1; i <= 5; i++) h += "<i" + (i <= b ? ' class="on"' : "") + "></i>"; return h + "</span>"; }
  function drawWords(body, f, c, query) {
    var id = f.st.id;
    api.myWords(id).then(function () { paintWords(body, f, c, query && query.mode, query && query.filter); })
      .catch(function () { state.words[id] = {}; paintWords(body, f, c); });
  }
  function wordPool(id, c, filter) {
    var my = state.words[id] || {}, today = new Date().toISOString().slice(0, 10);
    return c.vocab.filter(function (v) {
      var w = my[v.w];
      if (filter === "core") return isCore(v);
      if (filter === "review") return w && w.box < 5 && (w.due <= today || w.wrong > 0);
      return true;
    });
  }
  function paintWords(body, f, c, mode, filter) {
    var id = f.st.id;
    if (filter) state.vocabFilter = filter;
    var my = state.words[id] || {};
    var pool = wordPool(id, c, state.vocabFilter);
    var mastered = c.vocab.filter(function (v) { return my[v.w] && my[v.w].box >= 4; }).length;
    var reviewN = wordPool(id, c, "review").length;
    var html = '<div class="panel"><div class="modes">' +
      '<button class="btn small" data-mode="flash">플래시카드</button>' +
      '<button class="btn small" data-mode="match">짝 맞추기</button>' +
      '<button class="btn small" data-mode="spell">철자 쓰기</button>' +
      '<button class="btn small" data-mode="listen">듣고 고르기</button>' +
      '<span class="muted" style="font-size:.84rem;align-self:center">외운 단어 ' + mastered + " / " + c.vocab.length + "</span></div>" +
      '<div class="vfilter">고를 단어: ' +
      [["core", "핵심 (A2 이상)"], ["all", "전체"], ["review", "복습할 단어 " + reviewN]].map(function (o) {
        return '<button class="tog' + (state.vocabFilter === o[0] ? " on" : "") + '" data-filter="' + o[0] + '">' + o[1] + "</button>";
      }).join("") + "</div>" +
      '<div class="vlist">' + (pool.length ? pool.map(function (v) {
        var w = my[v.w];
        return '<div class="vitem"><b>' + esc(v.w) + ' <button class="speak" data-say="' + esc(v.w) + '">🔊</button></b><span>' + lvTag(v.lv) + " " + boxesHTML(w ? w.box : 0) + "</span>" +
          (v.forms ? '<span class="forms">' + esc(v.forms) + "</span>" : "") + '<span class="ko">' + esc(v.ko) + '</span><span class="ex">' + exampleOf(c, v) + "</span></div>";
      }).join("") : '<p class="muted">고를 단어가 없어요. 다른 단어 묶음을 골라 보세요.</p>') + "</div></div>";
    body.innerHTML = html;
    each("[data-filter]", function (b) { b.onclick = function () { state.vocabFilter = b.getAttribute("data-filter"); paintWords(body, f, c); }; });
    each("[data-say]", function (b) { b.onclick = function () { speak(b.getAttribute("data-say")); }; });
    each("[data-mode]", function (b) { b.onclick = function () { startStudy(body, f, c, b.getAttribute("data-mode")); }; });
    if (mode) startStudy(body, f, c, mode);
  }
  function pickStudy(id, c, n) {
    var my = state.words[id] || {}, today = new Date().toISOString().slice(0, 10);
    var pool = wordPool(id, c, state.vocabFilter);
    if (!pool.length) pool = c.vocab.slice();
    function pr(v) { var w = my[v.w]; if (!w) return 1; if (w.due <= today) return 0 - w.wrong * 0.1; return 2 + w.box; }
    pool = shuffle(pool).sort(function (a, b) { return pr(a) - pr(b); });
    return pool.slice(0, n);
  }
  function startStudy(body, f, c, mode) {
    var id = f.st.id;
    var list = pickStudy(id, c, mode === "match" ? 6 : 10);
    var i = 0, right = 0;
    function back() { paintWords(body, f, c); }
    function finish() {
      body.innerHTML = '<div class="panel study"><p class="muted">학습 끝!</p><div class="result-big">' + right + " / " + list.length + "</div>" +
        '<p>맞힌 단어는 복습 날짜가 늦춰지고, 틀린 단어는 내일 다시 나와요.</p><div class="actions" style="justify-content:center"><button class="btn line" id="again">한 번 더</button><button class="btn ghost" id="back">단어 목록</button></div></div>';
      byId("again").onclick = function () { startStudy(body, f, c, mode); };
      byId("back").onclick = back;
    }
    function shell(inner) {
      return '<div class="panel study"><div class="progress"><span style="width:' + (i / list.length * 100) + '%"></span></div>' + inner +
        '<div class="actions" style="justify-content:center"><button class="btn ghost small" id="quit">그만하기</button></div></div>';
    }
    function bindQuit() { byId("quit").onclick = back; }
    function result(v, ok) { if (ok) right++; api.wordResult(id, v.w, ok); }
    function distractors(v, n) {
      return shuffle(c.vocab.filter(function (x) { return x.w !== v.w && x.ko !== v.ko; })).slice(0, n).map(function (x) { return x.ko; });
    }

    if (mode === "flash") {
      (function card() {
        if (i >= list.length) return finish();
        var v = list[i];
        body.innerHTML = shell('<div class="flash-card" id="fc"><div class="flash-inner">' +
          '<div class="flash-face"><span class="big">' + esc(v.w) + "</span>" + lvTag(v.lv) + '<span class="hint">눌러서 뜻 보기</span></div>' +
          '<div class="flash-face back"><span class="big" style="font-size:1.5rem">' + esc(v.ko) + "</span>" + (v.forms ? '<span class="muted">' + esc(v.forms) + "</span>" : "") + '<span class="spell-ex">' + exampleOf(c, v) + "</span></div></div></div>" +
          '<div class="actions" style="justify-content:center"><button class="btn ghost" id="no">몰라요</button><button class="btn line" id="yes">알아요</button><button class="btn ghost small" id="say">🔊</button></div>');
        bindQuit();
        speak(v.w);
        byId("fc").onclick = function () { byId("fc").classList.toggle("flip"); };
        byId("say").onclick = function () { speak(v.w); };
        byId("yes").onclick = function () { result(v, true); i++; card(); };
        byId("no").onclick = function () { result(v, false); i++; card(); };
      })();
    } else if (mode === "listen") {
      (function q() {
        if (i >= list.length) return finish();
        var v = list[i], opts = shuffle([v.ko].concat(distractors(v, 3)));
        body.innerHTML = shell('<p class="muted">잘 듣고 뜻을 고르세요</p><button class="btn exit" id="play" style="font-size:1.4rem;padding:16px 28px;margin-bottom:14px">🔊 다시 듣기</button>' +
          '<div class="choices">' + opts.map(function (o, k) { return '<button class="choice" data-k="' + k + '">' + esc(o) + "</button>"; }).join("") + "</div>");
        bindQuit();
        speak(v.w);
        byId("play").onclick = function () { speak(v.w); };
        each(".choice", function (b) {
          b.onclick = function () {
            var ok = opts[+b.getAttribute("data-k")] === v.ko;
            each(".choice", function (x) { x.disabled = true; if (opts[+x.getAttribute("data-k")] === v.ko) x.classList.add("ok"); });
            if (!ok) b.classList.add("no");
            result(v, ok);
            toast(v.w + " = " + v.ko);
            setTimeout(function () { i++; q(); }, ok ? 700 : 1500);
          };
        });
      })();
    } else if (mode === "spell") {
      (function q() {
        if (i >= list.length) return finish();
        var v = list[i], tries = 0;
        body.innerHTML = shell('<p class="muted">뜻을 보고 영어로 쓰세요</p><h2 style="margin:4px 0">' + esc(v.ko) + "</h2>" +
          '<p class="spell-ex">' + blankOf(c, v) + "</p>" +
          '<input class="spell-in" id="sp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(v.w.charAt(0)) + '…">' +
          '<div class="err" id="sperr"></div><div class="actions" style="justify-content:center"><button class="btn line" id="chk">확인</button><button class="btn ghost small" id="hint">힌트</button><button class="btn ghost small" id="say">🔊</button></div>');
        bindQuit();
        var inp = byId("sp"); inp.focus();
        function check() {
          var ok = normWord(inp.value) === normWord(v.w);
          if (ok) { inp.style.borderColor = "var(--ok)"; result(v, tries === 0); setTimeout(function () { i++; q(); }, 600); return; }
          tries++;
          inp.classList.add("wrong");
          byId("sperr").textContent = tries >= 2 ? "정답: " + v.w : "다시 한 번! (" + v.w.length + "글자)";
          if (tries >= 2) { result(v, false); setTimeout(function () { i++; q(); }, 1600); }
        }
        byId("chk").onclick = check;
        inp.onkeydown = function (e) { if (e.key === "Enter") check(); };
        byId("hint").onclick = function () { var n = Math.min(v.w.length, (inp.value.length || 0) + 1); inp.value = v.w.slice(0, n); inp.focus(); tries = Math.max(tries, 1); };
        byId("say").onclick = function () { speak(v.w); };
      })();
    } else if (mode === "match") {
      var tiles = shuffle(list.map(function (v, k) { return { k: k, t: v.w, side: "en" }; }).concat(list.map(function (v, k) { return { k: k, t: v.ko, side: "ko" }; })));
      var sel = null, left = list.length, misses = {}, t0 = Date.now();
      body.innerHTML = '<div class="panel study"><p class="muted">영어와 뜻을 짝지어 모두 지워 보세요</p><div class="match">' +
        tiles.map(function (x, n) { return '<button class="mtile" data-n="' + n + '">' + esc(x.t) + "</button>"; }).join("") +
        '</div><div class="actions" style="justify-content:center"><button class="btn ghost small" id="quit">그만하기</button></div></div>';
      bindQuit();
      each(".mtile", function (b) {
        b.onclick = function () {
          var x = tiles[+b.getAttribute("data-n")];
          if (x.side === "en") speak(x.t);
          if (!sel) { sel = b; b.classList.add("sel"); return; }
          if (sel === b) { b.classList.remove("sel"); sel = null; return; }
          var y = tiles[+sel.getAttribute("data-n")];
          if (y.k === x.k && y.side !== x.side) {
            b.classList.add("gone"); sel.classList.add("gone"); sel = null; left--;
            if (!misses[x.k]) right++;
            api.wordResult(id, list[x.k].w, !misses[x.k]);
            if (!left) { i = list.length; setTimeout(function () { finish(); toast(Math.round((Date.now() - t0) / 1000) + "초 걸렸어요"); }, 300); }
          } else {
            misses[x.k] = misses[y.k] = true;
            b.classList.add("wrong"); sel.classList.add("wrong");
            var a = sel; setTimeout(function () { a.classList.remove("wrong", "sel"); b.classList.remove("wrong"); }, 400); sel = null;
          }
        };
      });
    }
  }

  /* ----- 4번 출구: 줄거리 드래그앤드롭 ----- */
  // 칩을 끌어서 빈칸에 놓거나, 칩을 누른 뒤 빈칸을 눌러도 돼요 (휴대폰·전자칠판 모두 됨)
  function dnd(root) {
    var bank = root.querySelector(".bank"), picked = null;
    function clearPick() { if (picked) picked.classList.remove("picked"); picked = null; }
    function place(chip, slot) {
      if (!slot) { bank.appendChild(chip); return; }
      var old = slot.querySelector(".chip");
      var from = chip.parentElement;
      if (old && old !== chip) { if (from && from.classList.contains("slot")) from.appendChild(old); else bank.appendChild(old); }
      slot.appendChild(chip);
      each(".slot", function (s) { s.classList.remove("ok", "no"); }, root);
    }
    root.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip"), slot = e.target.closest(".slot");
      if (chip && chip.dataset.dragged) { delete chip.dataset.dragged; return; }
      if (chip) {
        if (picked === chip) { clearPick(); return; }
        if (picked && chip.parentElement.classList.contains("slot")) { place(picked, chip.parentElement); clearPick(); return; }
        clearPick(); picked = chip; chip.classList.add("picked"); return;
      }
      if (slot && picked) { place(picked, slot); clearPick(); return; }
      if (e.target.closest(".bank") && picked) { place(picked, null); clearPick(); }
    });
    root.addEventListener("pointerdown", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip || e.button > 0) return;
      var sx = e.clientX, sy = e.clientY, moving = false, ghost = null, over = null, ox = 0, oy = 0;
      function move(ev) {
        if (!moving && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
        ev.preventDefault();
        if (!moving) {
          moving = true; clearPick();
          var r = chip.getBoundingClientRect(); ox = sx - r.left; oy = sy - r.top;
          ghost = chip.cloneNode(true); ghost.classList.add("dragging"); document.body.appendChild(ghost);
          chip.style.opacity = ".3";
        }
        ghost.style.left = (ev.clientX - ox) + "px"; ghost.style.top = (ev.clientY - oy) + "px";
        var t = document.elementFromPoint(ev.clientX, ev.clientY);
        var s = t && (t.closest(".slot") || t.closest(".bank"));
        if (s !== over) { if (over) over.classList.remove("over"); over = s; if (over && over.classList.contains("slot")) over.classList.add("over"); }
      }
      function up() {
        document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
        if (!moving) return;
        chip.dataset.dragged = "1"; setTimeout(function () { delete chip.dataset.dragged; }, 50);
        chip.style.opacity = ""; ghost.remove();
        if (over) { over.classList.remove("over"); place(chip, over.classList.contains("slot") ? over : null); }
      }
      document.addEventListener("pointermove", move, { passive: false });
      document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    });
  }
  function sortable(ul) {
    ul.addEventListener("pointerdown", function (e) {
      var li = e.target.closest("li");
      if (!li || e.button > 0) return;
      e.preventDefault();
      li.classList.add("dragging");
      each("li", function (x) { x.classList.remove("ok", "no"); }, ul);
      function move(ev) {
        ev.preventDefault();
        var prev = li.previousElementSibling, next = li.nextElementSibling;
        if (prev) { var r = prev.getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { ul.insertBefore(li, prev); return; } }
        if (next) { var q = next.getBoundingClientRect(); if (ev.clientY > q.top + q.height / 2) { ul.insertBefore(next, li); } }
      }
      function up() {
        li.classList.remove("dragging");
        document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up); document.removeEventListener("pointercancel", up);
      }
      document.addEventListener("pointermove", move, { passive: false });
      document.addEventListener("pointerup", up); document.addEventListener("pointercancel", up);
    });
  }
  function chipsHTML(words) { return words.map(function (w) { return '<button class="chip" type="button">' + esc(w) + "</button>"; }).join(""); }
  function slotHTML(ans) { return '<span class="slot" data-a="' + esc(ans) + '"></span>'; }
  function blankParagraph(text, words) {
    var used = [], out = String(text);
    words.forEach(function (w) {
      var re = new RegExp("\\b" + String(w).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
      var m = out.match(re);
      if (m) { out = out.replace(re, "\u0000" + used.length + "\u0000"); used.push(m[0]); }
    });
    var html = esc(out).replace(/\u0000(\d+)\u0000/g, function (_, k) { return slotHTML(used[+k]); });
    return { html: html, used: used };
  }
  function drawStory(body, f, c) {
    var id = f.st.id, S = c.summaries || {}, steps = S.steps || [], sw = c.summaryWords || {};
    var cleared = {};
    ((state.progress[id] || {}).stages || []).forEach(function (n) { cleared[n] = true; });
    var STAGES = [
      { n: 1, name: "빈칸 채우기", d: "장면별 요약문의 빈칸에 알맞은 단어 카드를 넣어요." },
      { n: 2, name: "순서 맞추기", d: "장면 카드를 끌어서 이야기 순서대로 놓아요." },
      { n: 3, name: "50단어 요약", d: "50단어 요약문의 빈칸을 채워요." },
      { n: 4, name: "100단어 요약", d: "100단어 요약문의 빈칸을 채워요." }
    ];
    var cur = 1;
    for (var k = 1; k <= 4; k++) { if (!cleared[k]) { cur = k; break; } }
    function paint() {
      var st = STAGES[cur - 1];
      var html = '<div class="panel"><div class="stages">' + STAGES.map(function (x) {
        return '<button class="stage' + (cleared[x.n] ? " clear" : "") + (x.n === cur ? " on" : "") + '" data-st="' + x.n + '"><span class="d"></span>' + x.n + ". " + x.name + "</button>";
      }).join("") + '</div><p class="muted" style="margin:0 0 12px">' + st.d + "</p><div id=\"stagebody\"></div></div>";
      body.innerHTML = html;
      each("[data-st]", function (b) { b.onclick = function () { cur = +b.getAttribute("data-st"); paint(); }; });
      var sb = byId("stagebody");
      if (cur === 2) return orderStage(sb);
      blankStage(sb, cur);
    }
    function blankStage(root, n) {
      var inner = "", answers = [];
      if (n === 1) {
        steps.forEach(function (s, i) {
          var en = esc(s.en).replace(/\[([^\]]+)\]/g, function (_, w) { answers.push(w); return slotHTML(w); });
          inner += '<div class="sumstep"><span class="n">' + (i + 1) + "</span><div>" + en + "<small>" + esc(s.title) + "</small></div></div>";
        });
      } else {
        var text = n === 3 ? S.fifty : S.hundred, words = sw[n === 3 ? "50" : "100"] || [];
        var r = blankParagraph(text || "", words);
        answers = r.used;
        inner = '<p class="sumpara">' + r.html + '</p><p class="muted" style="font-size:.88rem">' + esc(n === 3 ? S.fiftyKo : S.hundredKo) + "</p>";
      }
      var pool = [].concat(sw["100"] || [], sw["50"] || [], sw["1"] || []);
      var lowAns = answers.map(function (a) { return a.toLowerCase(); });
      var extra = shuffle(pool.filter(function (w, i) { return lowAns.indexOf(w.toLowerCase()) < 0 && pool.indexOf(w) === i; })).slice(0, 2);
      root.innerHTML = '<div class="bank">' + chipsHTML(shuffle(answers.concat(extra))) + "</div>" + inner +
        '<div class="actions"><button class="btn line" id="check">정답 확인</button><button class="btn ghost small" id="reset">다시 섞기</button><span class="feedback" id="fb"></span></div>';
      dnd(root);
      byId("reset").onclick = function () { blankStage(root, n); };
      byId("check").onclick = function () {
        var slots = root.querySelectorAll(".slot"), ok = 0;
        each(".slot", function (s) {
          var chip = s.querySelector(".chip");
          var good = chip && chip.textContent.trim().toLowerCase() === s.getAttribute("data-a").toLowerCase();
          s.classList.toggle("ok", !!good); s.classList.toggle("no", !good);
          if (good) ok++;
        }, root);
        finishStage(n, ok, slots.length);
      };
    }
    function orderStage(root) {
      var items = steps.map(function (s, i) { return { i: i, t: s.en.replace(/\[([^\]]+)\]/g, "$1") }; });
      var mixed = shuffle(items);
      for (var g = 0; g < 5 && mixed.every(function (x, k) { return x.i === k; }); g++) mixed = shuffle(items);
      root.innerHTML = '<ul class="order" id="ord">' + mixed.map(function (x) {
        return '<li data-i="' + x.i + '"><span class="n">?</span><span>' + esc(x.t) + '</span><span class="grip">⋮⋮</span></li>';
      }).join("") + '</ul><div class="actions"><button class="btn line" id="check">정답 확인</button><span class="feedback" id="fb"></span></div>';
      var ul = byId("ord");
      sortable(ul);
      byId("check").onclick = function () {
        var ok = 0;
        Array.prototype.forEach.call(ul.children, function (li, k) {
          var good = +li.getAttribute("data-i") === k;
          li.classList.toggle("ok", good); li.classList.toggle("no", !good);
          li.querySelector(".n").textContent = good ? String(k + 1) : "?";
          if (good) ok++;
        });
        finishStage(2, ok, ul.children.length);
      };
    }
    function finishStage(n, ok, total) {
      var fb = byId("fb");
      if (ok === total) {
        fb.className = "feedback ok"; fb.textContent = "모두 맞았어요! 다음 단계로 출발해요.";
        cleared[n] = true;
        var p = state.progress[id] = state.progress[id] || {};
        p.stages = Object.keys(cleared).map(Number);
        api.saveSummary(id, n, ok, total).catch(function (e) { console.warn(e); });
        each(".stage", function (b) { if (+b.getAttribute("data-st") === n) b.classList.add("clear"); });
        if (n < 4) setTimeout(function () { cur = n + 1; paint(); }, 1200);
      } else {
        fb.className = "feedback no"; fb.textContent = total - ok + "곳이 달라요. 빨간 칸을 고쳐 보세요.";
        api.saveSummary(id, n, ok, total).catch(function () {});
      }
    }
    if (!steps.length) { body.innerHTML = '<div class="panel"><p class="muted">이 역에는 아직 줄거리 자료가 없어요.</p></div>'; return; }
    paint();
  }

  /* ----- 5번 출구: 퀴즈 ----- */
  function drawQuiz(body, f, c) {
    var id = f.st.id;
    api.quiz(id).then(function (qs) {
      if (!qs || !qs.length) { body.innerHTML = '<div class="panel"><p class="muted">퀴즈를 열 수 없어요. 학교 계정으로 로그인했는지 확인해 주세요.</p></div>'; return; }
      var ans = {};
      var html = '<div class="panel"><h2>Ticket Check · 퀴즈 ' + qs.length + "문항</h2>" + qs.map(function (q) {
        return '<div class="qcard" data-no="' + q.no + '"><h3><span class="n">' + q.no + "</span>" + esc(q.question) + '</h3><div class="choices">' +
          q.choices.map(function (o, k) { return '<button class="choice" data-v="' + esc(o) + '"><b class="cn">' + (k + 1) + "</b>" + esc(o) + "</button>"; }).join("") + "</div></div>";
      }).join("") + '<div class="actions"><button class="btn line" id="submit" disabled>제출하기</button><span class="muted" id="left"></span></div></div>';
      body.innerHTML = html;
      function upd() { var n = qs.length - Object.keys(ans).length; byId("left").textContent = n ? n + "문항 남았어요" : "모두 골랐어요"; byId("submit").disabled = n > 0; }
      upd();
      each(".qcard", function (card) {
        var no = card.getAttribute("data-no");
        each(".choice", function (b) {
          b.onclick = function () { each(".choice", function (x) { x.classList.remove("ok"); x.style.borderColor = ""; }, card); b.style.borderColor = "var(--ink)"; b.classList.add("ok"); ans[no] = b.getAttribute("data-v"); upd(); };
        }, card);
      });
      byId("submit").onclick = function () {
        byId("submit").disabled = true;
        api.submitQuiz(id, ans).then(function (r) {
          var p = state.progress[id] = state.progress[id] || {};
          p.quiz = Math.max(p.quiz || 0, r.score); p.quizTotal = r.total;
          var byNo = {}; (r.review || []).forEach(function (x) { byNo[x.no] = x; });
          var top = '<div class="ticket"><div><b>' + (r.score === r.total ? "만점 통과! 🎉" : "개찰 완료") + '</b><div class="muted" style="color:#aab">최고 기록 ' + r.best + " / " + r.total + '</div></div><div class="score">' + r.score + " / " + r.total + "</div></div>";
          var list = qs.map(function (q) {
            var rv = byNo[q.no] || {};
            var ev = (rv.ids || []).map(function (sid) { var x = c.sentences.filter(function (s) { return s.id === sid; })[0]; return x ? '<a href="#/s/' + id + "/read?s=" + sid + '">' + sid + ". " + esc(x.en) + "</a>" : ""; }).join("<br>");
            return '<div class="qcard"><h3><span class="n">' + q.no + "</span>" + esc(q.question) + "</h3>" +
              '<div class="choices">' + q.choices.map(function (o, k) { return '<div class="choice' + (o === rv.answer ? " ok" : (o === ans[q.no] ? " no" : "")) + '"><b class="cn">' + (k + 1) + "</b>" + esc(o) + "</div>"; }).join("") + "</div>" +
              '<div class="why">' + (rv.correct ? "✅ " : "❌ ") + esc(rv.why || "") + (ev ? '<span class="ev">' + ev + "</span>" : "") + "</div></div>";
          }).join("");
          body.innerHTML = top + '<div class="panel">' + list + '<div class="actions"><button class="btn line" id="retry">다시 풀기</button><a class="btn ghost" href="#/s/' + id + '/story">줄거리 출구로</a></div></div>';
          byId("retry").onclick = function () { drawQuiz(body, f, c); };
          window.scrollTo(0, 0);
        }).catch(function (e) { byId("submit").disabled = false; toast(cleanMsg(e.message)); });
      };
    }).catch(function (e) { body.innerHTML = '<div class="panel"><p class="muted">' + esc(cleanMsg(e.message)) + "</p></div>"; });
  }

  /* ---------- 환승센터: 오늘 복습 ---------- */
  function renderReview() {
    if (!state.user) { $app.innerHTML = gateHTML(); mountGoogle(byId("gbtn")); return; }
    var html = '<section class="hero"><div><h1>환승센터</h1><p>복습 날짜가 된 단어를 역별로 모았어요. 맞히면 상자가 올라가고, 틀리면 내일 다시 만나요.</p></div></section><div class="panel">';
    var any = false;
    METRO.lines.forEach(function (l) {
      l.stations.forEach(function (s) {
        var p = state.progress[s.id] || {};
        if (!p.due) return;
        any = true;
        html += '<div class="vitem" style="--c:' + l.color + ';margin-bottom:8px"><b><span class="badge-line" style="display:inline-grid;width:28px;height:28px;font-size:.7rem;vertical-align:middle">' + lineLabel(l) + "</span> " + esc(s.readingTitle) + '</b><a class="btn small line" href="#/s/' + s.id + '/words?mode=flash&filter=review">' + p.due + "개 복습</a></div>";
      });
    });
    if (!any) html += '<p class="muted">오늘 복습할 단어가 없어요. 노선도에서 새 역의 단어를 공부해 보세요.</p><a class="btn small" href="#/">노선도로</a>';
    $app.innerHTML = html + "</div>";
  }

  /* ---------- 교사 화면 ---------- */
  function renderTeacher() {
    if (!state.isAdmin) { location.hash = "#/"; return; }
    $app.innerHTML = '<section class="hero"><div><h1>관제실</h1><p>학생별·역별 퀴즈 최고점, 줄거리 단계, 외운 단어 수예요.</p></div></section><div class="panel" id="tbody"><p class="loading">불러오는 중…</p></div>';
    api.adminScores().then(function (rows) {
      var stations = []; METRO.lines.forEach(function (l) { l.stations.forEach(function (s) { stations.push({ l: l, s: s }); }); });
      var stu = {}, order = [];
      (rows || []).forEach(function (r) {
        var k = r.email;
        if (!stu[k]) { stu[k] = { r: r, u: {} }; order.push(k); }
        stu[k].u[r.unit_id] = r;
      });
      var classes = {}; order.forEach(function (k) { var r = stu[k].r; if (r.grade) classes[r.grade + "-" + r.class_no] = 1; });
      var sel = '<select id="cls"><option value="">전체 반</option>' + Object.keys(classes).sort().map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select>";
      function draw() {
        var cv = byId("cls") ? byId("cls").value : "";
        var keys = order.filter(function (k) { var r = stu[k].r; return !cv || (r.grade + "-" + r.class_no) === cv; });
        var h = '<div class="actions" style="margin:0 0 12px">' + sel + '<button class="btn small ghost" id="csv">CSV 내려받기</button><span class="muted" style="font-size:.84rem">원 안 숫자 = 퀴즈 최고점, 채운 원 = 만점</span></div>' +
          '<div class="scroll"><table class="tbl"><thead><tr><th>번호</th><th>이름</th>' + stations.map(function (x) { return '<th title="' + esc(x.s.readingTitle) + '">' + lineLabel(x.l) + "-" + stNo(x.s) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          keys.map(function (k) {
            var r = stu[k].r;
            return "<tr><td>" + (r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no : "-") + "</td><td>" + esc(r.name || r.email) + "</td>" +
              stations.map(function (x) {
                var u = stu[k].u[x.s.id];
                if (!u) return '<td class="c"></td>';
                var full = u.quiz_best != null && u.quiz_best === u.quiz_total;
                return '<td class="c" style="--c:' + x.l.color + '" title="줄거리 ' + (u.summary_stage || 0) + "단계 · 외운 단어 " + u.mastered + '"><span class="cell' + (u.quiz_best != null ? " q" : "") + (full ? " full" : "") + '">' + (u.quiz_best != null ? u.quiz_best : "·") + "</span></td>";
              }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>";
        if (!keys.length) h += '<p class="muted">아직 기록이 없어요.</p>';
        byId("tbody").innerHTML = h;
        if (cv) byId("cls").value = cv;
        byId("cls").onchange = draw;
        byId("csv").onclick = function () {
          var lines = [["email", "이름", "학년", "반", "번호", "역", "본문", "퀴즈최고", "문항수", "퀴즈횟수", "줄거리단계", "외운단어", "마지막"]];
          (rows || []).forEach(function (r) { var fs = findStation(r.unit_id); lines.push([r.email, r.name, r.grade, r.class_no, r.student_no, r.unit_id, fs ? fs.st.readingTitle : "", r.quiz_best, r.quiz_total, r.quiz_attempts, r.summary_stage, r.mastered, r.last_at]); });
          var csv = "﻿" + lines.map(function (row) { return row.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\n");
          var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "reading-metro.csv"; a.click();
        };
      }
      draw();
    }).catch(function (e) { byId("tbody").innerHTML = '<p class="muted">기록을 불러오지 못했어요: ' + esc(cleanMsg(e.message)) + "</p>"; });
  }

  /* ---------- 시작 ---------- */
  window.addEventListener("hashchange", route);
  if (sb) sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_OUT") { state.user = null; renderWho(); } });
  loadUser().then(route).catch(function (e) { console.warn(e); renderWho(); route(); });
})();
