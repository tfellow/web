(function () {
  "use strict";

  /* ---------- 설정 (독서 여권·지식 여권·Reading Metro 와 같은 Supabase·Google 로그인) ---------- */
  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var PREVIEW = window.MUSEUM_PREVIEW || null; // 화면 미리보기용 (실제 사이트에서는 없음)

  var M = window.MUSEUM || { books: [], halls: [], scale: [0, 1] };
  var CORNERS = [
    { id: "read", ic: "📜", name: "해설 읽기" },
    { id: "source", ic: "🏺", name: "사료·유물" },
    { id: "cards", ic: "🃏", name: "인물·개념 카드" },
    { id: "puzzle", ic: "⏳", name: "연표·인과" },
    { id: "quiz", ic: "🏅", name: "확인 퀴즈" }
  ];
  var PUZZLES = [
    { id: "order", name: "연표 순서" },
    { id: "chain", name: "원인 → 사건 → 결과" },
    { id: "pair", name: "나란히 짝" }
  ];

  var sb = (!PREVIEW && window.supabase) ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, progress: {}, rooms: {}, cards: {}, answers: {}, noteOpen: false };

  /* ---------- 안내도 색인 ---------- */
  var BOOK = {}, HALL = {}, ROOM = {}, OPEN = [];
  M.books.forEach(function (b) { BOOK[b.id] = b; });
  M.halls.forEach(function (h) {
    HALL[h.id] = h;
    h.rooms.forEach(function (r, i) { ROOM[r.id] = { r: r, h: h, b: BOOK[h.book], i: i }; if (r.open) OPEN.push(r.id); });
  });

  /* ---------- 도우미 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function each(sel, fn, root) { Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); }
  function byId(id) { return document.getElementById(id); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function shuffledApart(a, keyFn) { // 원래 순서와 다르게 섞기
    if (a.length < 2) return a.slice();
    for (var k = 0; k < 8; k++) { var s = shuffle(a); if (s.some(function (x, i) { return keyFn(x) !== keyFn(a[i]); })) return s; }
    return a.slice().reverse();
  }
  function toast(msg) {
    var t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }
  function cleanMsg(m) { return String(m || "").replace(/^external:\s*/, ""); }
  function yearLabel(y) {
    if (y == null) return "";
    if (y < 0) return "기원전 " + (-y);
    return String(y);
  }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function reRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
  function roomLabel(id) { var x = ROOM[id]; return x ? x.b.name + " " + x.h.no + "-" + x.r.no : id; }

  // 글자 크기 (기기마다 기억)
  var FS = [0.94, 1, 1.08, 1.18];
  var fsIdx = +(lsGet("hm_fs") || 1); if (!(fsIdx >= 0 && fsIdx < FS.length)) fsIdx = 1;
  function applyFs() { document.documentElement.style.setProperty("--fs", FS[fsIdx] + "rem"); }
  applyFs();

  /* ---------- 서버 ---------- */
  function rpc(name, args) {
    return sb.rpc(name, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  var pv = { attempts: {}, cards: {}, answers: {} }; // 미리보기 기록 (메모리)
  function pvProgress() {
    var out = {};
    OPEN.forEach(function (id) {
      var a = pv.attempts[id] || {}, cs = pv.cards[id] || {}, an = pv.answers[id] || {};
      var today = new Date().toISOString().slice(0, 10);
      out[id] = { quiz: a.quiz == null ? null : a.quiz, quizTotal: a.quizTotal || null, puzzles: Object.keys(a.puzzles || {}),
        answers: Object.keys(an).length, mastered: Object.keys(cs).filter(function (k) { return cs[k].box >= 4; }).length,
        due: Object.keys(cs).filter(function (k) { return cs[k].due <= today && cs[k].box < 5; }).length };
    });
    return out;
  }
  var api = {
    room: function (id) {
      if (state.rooms[id]) return Promise.resolve(state.rooms[id]);
      var p = PREVIEW ? Promise.resolve(PREVIEW.units[id] || null) : rpc("hm_get_room", { p_id: id });
      return p.then(function (c) { if (c) state.rooms[id] = c; return c; });
    },
    quiz: function (id) {
      if (PREVIEW) return Promise.resolve((PREVIEW.quiz[id] || []).map(function (q) { return { no: q.no, question: q.question, choices: q.choices.slice() }; }));
      return rpc("hm_get_quiz", { p_id: id });
    },
    submitQuiz: function (id, answers) {
      if (PREVIEW) {
        var qs = PREVIEW.quiz[id] || [], score = 0;
        var review = qs.map(function (q) { var a = q.choices[q.answer - 1], ok = answers[q.no] === a; if (ok) score++; return { no: q.no, answer: a, why: q.why, pid: q.pid, correct: ok }; });
        var at = pv.attempts[id] = pv.attempts[id] || {};
        at.quiz = Math.max(at.quiz || 0, score); at.quizTotal = qs.length;
        return Promise.resolve({ score: score, total: qs.length, best: at.quiz, review: review });
      }
      return rpc("hm_submit_quiz", { p_id: id, p_answers: answers });
    },
    savePuzzle: function (id, stage, score, total) {
      if (PREVIEW) { var at = pv.attempts[id] = pv.attempts[id] || {}; at.puzzles = at.puzzles || {}; if (score === total) at.puzzles[stage] = 1; return Promise.resolve(); }
      return rpc("hm_save_puzzle", { p_id: id, p_stage: stage, p_score: score, p_total: total });
    },
    cardResult: function (id, card, ok) {
      var cur = (state.cards[id] || {})[card] || { box: 0, wrong: 0 };
      var days = [0, 1, 2, 4, 7, 14];
      var box = ok ? Math.min(cur.box + 1, 5) : 0;
      var due = new Date(); due.setDate(due.getDate() + days[box]);
      state.cards[id] = state.cards[id] || {};
      state.cards[id][card] = { box: box, wrong: cur.wrong + (ok ? 0 : 1), due: due.toISOString().slice(0, 10) };
      if (PREVIEW) { pv.cards[id] = state.cards[id]; return Promise.resolve(); }
      return rpc("hm_card_result", { p_id: id, p_card: card, p_ok: ok }).catch(function (e) { console.warn(e); });
    },
    myCards: function (id) {
      if (state.cards[id]) return Promise.resolve(state.cards[id]);
      if (PREVIEW) { state.cards[id] = pv.cards[id] || {}; return Promise.resolve(state.cards[id]); }
      return rpc("hm_my_cards", { p_id: id }).then(function (rows) {
        var m = {}; (rows || []).forEach(function (r) { m[r.card] = { box: r.box, wrong: r.wrong, due: r.due }; });
        state.cards[id] = m; return m;
      });
    },
    myAnswers: function (id) {
      if (state.answers[id]) return Promise.resolve(state.answers[id]);
      if (PREVIEW) { state.answers[id] = pv.answers[id] || {}; return Promise.resolve(state.answers[id]); }
      return rpc("hm_my_answers", { p_id: id }).then(function (rows) {
        var m = {}; (rows || []).forEach(function (r) { m[r.source + "/" + r.no] = r.answer; });
        state.answers[id] = m; return m;
      });
    },
    saveAnswer: function (id, source, no, text) {
      state.answers[id] = state.answers[id] || {};
      state.answers[id][source + "/" + no] = text;
      if (PREVIEW) { pv.answers[id] = state.answers[id]; return Promise.resolve(); }
      return rpc("hm_save_answer", { p_id: id, p_source: source, p_no: no, p_text: text });
    },
    progress: function () {
      if (PREVIEW) return Promise.resolve(pvProgress());
      return rpc("hm_my_progress");
    },
    adminScores: function () {
      if (PREVIEW) return Promise.resolve([]);
      return rpc("hm_admin_scores");
    },
    adminAnswers: function (id) {
      if (PREVIEW) return Promise.resolve([]);
      return rpc("hm_admin_answers", { p_id: id });
    }
  };
  function refreshProgress() {
    if (!state.user) return Promise.resolve();
    return api.progress().then(function (p) { state.progress = p || {}; }).catch(function (e) { console.warn(e); });
  }

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
    state.user = null; state.profile = null; state.isAdmin = false; state.progress = {}; state.rooms = {}; state.cards = {}; state.answers = {};
    renderWho(); location.hash = "#/"; route();
  }
  async function loadUser() {
    if (PREVIEW) {
      state.user = PREVIEW.user || { id: "preview", email: "preview@smy.ms.kr" };
      state.profile = PREVIEW.profile || { name: "미리보기", role: "school" };
      state.isAdmin = !!PREVIEW.isAdmin;
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
    await refreshProgress();
    renderWho();
  }
  function renderWho() {
    if (!state.user) { $who.innerHTML = '<a class="tbtn" href="#/login">입장하기</a>'; return; }
    var p = state.profile || {};
    var nick = p.nickname || p.name || (state.user.email || "").split("@")[0];
    $who.innerHTML =
      '<span class="card-id"><i>' + esc((nick || "?").slice(0, 1)) + '</i><span class="nick">' + esc(nick) + (p.role === "school" ? "" : ' <span class="muted">· 외부</span>') + "</span></span>" +
      '<a class="tbtn" href="#/stamps">관람 수첩</a>' +
      (state.isAdmin ? '<a class="tbtn" href="#/teacher">교사 화면</a>' : "") +
      '<button class="tbtn" id="signout">나가기</button>';
    byId("signout").onclick = signOut;
  }
  function gateHTML(title) {
    return '<section class="gate">' +
      '<div class="gate-art"><div><h2>매표소</h2><p>교과서 전시 자료는 로그인한 관람객만 볼 수 있어요.</p></div>' +
      '<div class="columns"><i></i><i></i><i></i><i></i><i></i></div></div>' +
      '<div class="gate-body"><h3>' + esc(title || "로그인하고 입장하기") + "</h3>" +
      "<ul><li>해설 읽기: 용어 풀이, 필기 노트 빈칸, 생각 질문</li><li>사료·유물: 사료를 읽고 내 답 쓰기, 예시 답안 비교</li><li>인물·개념 카드 복습, 연표·인과 퍼즐, 확인 퀴즈와 관람 도장</li></ul>" +
      '<div id="gbtn"></div><p class="muted" style="margin:0;font-size:.86rem">학교 계정(@smy.ms.kr)으로 로그인하세요. 전시 안내도와 연표는 로그인 없이도 볼 수 있어요.</p>' +
      '<div class="err" id="gateerr"></div></div></section>';
  }

  /* ---------- 라우터 ---------- */
  function route() {
    var h = (location.hash || "#/").slice(1);
    var parts = h.split("?")[0].split("/").filter(Boolean);
    var query = {}; (h.split("?")[1] || "").split("&").forEach(function (kv) { var p = kv.split("="); if (p[0]) query[p[0]] = decodeURIComponent(p[1] || ""); });
    if (!query.p) window.scrollTo(0, 0);
    try {
      if (!parts.length) return renderHome();
      if (parts[0] === "login") { if (state.user) { location.hash = "#/"; return; } $app.innerHTML = gateHTML(); mountGoogle(byId("gbtn")); return; }
      if (parts[0] === "h" && parts[1]) return renderHall(parts[1]);
      if (parts[0] === "r" && parts[1]) return renderRoom(parts[1], parts[2] || "read", query);
      if (parts[0] === "stamps") return renderStamps();
      if (parts[0] === "teacher") return renderTeacher();
      renderHome();
    } catch (e) { showError(e); }
  }
  function showError(e) {
    console.error(e);
    $app.innerHTML = '<div class="panel"><h2>문제가 생겼어요</h2><p class="muted">' + esc(cleanMsg(e && e.message)) + '</p><a class="btn small" href="#/">로비로</a></div>';
  }

  /* ---------- 관람 기록 ---------- */
  function roomState(id) {
    var p = state.progress[id];
    if (!p) return "";
    var full = p.quiz != null && p.quizTotal && p.quiz === p.quizTotal;
    if (full && (p.puzzles || []).length >= PUZZLES.length && p.answers > 0) return "gold";
    if (p.quiz != null && p.quizTotal && p.quiz >= Math.ceil(p.quizTotal * 0.8)) return "stamp";
    if (p.quiz != null || (p.puzzles || []).length || p.answers || p.mastered) return "visit";
    return "";
  }
  var STATE_LABEL = { "": "아직 관람 전", visit: "관람 중", stamp: "관람 도장", gold: "금빛 도장" };
  function stampCount() {
    var n = 0; OPEN.forEach(function (id) { var s = roomState(id); if (s === "stamp" || s === "gold") n++; }); return n;
  }
  function dueTotal() { var n = 0; Object.keys(state.progress).forEach(function (k) { n += state.progress[k].due || 0; }); return n; }

  /* ---------- 로비: 두 줄 연표 + 두 전시동 ---------- */
  var TL_W = 1500;
  function xOf(y) {
    var S = M.scale, seg = TL_W / (S.length - 1);
    if (y <= S[0]) return 0;
    for (var i = 1; i < S.length; i++) if (y <= S[i]) return seg * (i - 1) + seg * (y - S[i - 1]) / (S[i] - S[i - 1]);
    return TL_W;
  }
  function laneHTML(book) {
    var halls = M.halls.filter(function (h) { return h.book === book.id && h.from != null; });
    var rowsEnd = [-1e9, -1e9], html = '<div class="tl-lane ' + book.id + '"><span class="tl-lane-label">' + esc(book.wing) + " · " + esc(book.name) + "</span>";
    halls.forEach(function (h) {
      var x1 = xOf(h.from), x2 = Math.max(xOf(h.to), x1 + 96);
      var row = rowsEnd[0] <= x1 + 2 ? 0 : (rowsEnd[1] <= x1 + 2 ? 1 : (rowsEnd[0] < rowsEnd[1] ? 0 : 1));
      rowsEnd[row] = x2 + 4;
      html += '<a class="tl-block" href="#/h/' + h.id + '" style="left:' + x1.toFixed(1) + "px;width:" + (x2 - x1).toFixed(1) + "px;top:" + (24 + row * 38) + "px;background:" + h.color + '" title="' + esc(h.no + ". " + h.title) + '">' +
        "<b>" + esc(h.no + ". " + h.title) + "</b><small>" + esc(yearLabel(h.from) + " ~ " + (h.to >= 2025 ? "오늘" : yearLabel(h.to))) + "</small></a>";
    });
    return html + "</div>";
  }
  function timelineHTML() {
    var ticks = M.scale.map(function (y) {
      return '<span class="tl-tick" style="left:' + xOf(y).toFixed(1) + 'px">' + esc(y === 0 ? "기원후 1" : y >= 2025 ? "오늘" : yearLabel(y)) + "</span>";
    }).join("");
    var w = M.books.filter(function (b) { return b.id === "w"; })[0], k = M.books.filter(function (b) { return b.id === "k"; })[0];
    return '<section class="tl"><div class="tl-head"><h2>두 줄 연표: 같은 시기, 세계와 우리</h2><span class="muted" style="font-size:.84rem">전시관을 누르면 들어가요</span></div>' +
      '<div class="tl-scroll" id="tlscroll"><div class="tl-canvas">' + laneHTML(w) + '<div class="tl-axis">' + ticks + "</div>" + laneHTML(k) + "</div></div>" +
      '<p class="tl-hint">옆으로 밀어 보세요. 오래된 시대일수록 눈금 간격을 줄였어요.</p></section>';
  }
  function hallRowHTML(h) {
    var dots = h.rooms.map(function (r) {
      var s = r.open ? roomState(r.id) : "";
      return '<span class="dot ' + (r.open ? "open " : "") + s + '" title="' + esc(r.no + "실 " + r.title + (r.open ? " · " + STATE_LABEL[s] : " · 준비 중")) + '"><i></i>' + r.no + "실</span>";
    }).join("");
    var open = h.rooms.filter(function (r) { return r.open; }).length;
    return '<a class="hall-row" href="#/h/' + h.id + '"><div class="t"><span class="no">' + esc(h.no) + '</span><span class="nm">' + esc(h.title) + "</span>" +
      (open ? ' <span class="chip" style="min-height:22px;font-size:.72rem">' + open + "실 개관</span>" : "") + '</div><div class="rooms">' + dots + "</div></a>";
  }
  function renderHome() {
    var html = '<section class="hero"><div><h1>오늘은 어느 시대를 관람할까요?</h1><p>역사 ①(세계사)과 역사 ②(한국사)를 한 박물관에서 나란히 걸어요.</p></div>' +
      (state.user ? '<a class="passport" href="#/stamps"><span class="seal">' + stampCount() + '</span><span><b>관람 수첩</b><small>받은 도장 · 복습할 카드 ' + dueTotal() + "장</small></span></a>" :
        '<a class="passport" href="#/login"><span class="seal">入</span><span><b>매표소</b><small>로그인하고 입장하기</small></span></a>') + "</section>";
    html += timelineHTML();
    html += '<section class="wings">';
    M.books.forEach(function (b) {
      html += '<div class="wing ' + b.id + '"><div class="wing-head"><h2>' + esc(b.wing) + "</h2><small>" + esc(b.name) + " · 전시관 " + M.halls.filter(function (h) { return h.book === b.id; }).length + "개</small></div>" +
        M.halls.filter(function (h) { return h.book === b.id; }).map(hallRowHTML).join("") + "</div>";
    });
    html += "</section>";
    html += '<div class="legend"><span class="dot"><i></i>준비 중</span><span class="dot open"><i></i>개관</span><span class="dot visit"><i></i>관람 중</span><span class="dot stamp"><i></i>관람 도장 (퀴즈 8점 이상)</span><span class="dot gold"><i></i>금빛 도장 (퀴즈 만점 + 퍼즐 3개 + 사료 탐구)</span></div>';
    $app.innerHTML = html;
    // 처음에는 시범 전시실이 보이도록 살짝 밀어 둬요
    var sc = byId("tlscroll"); if (sc && sc.scrollLeft === 0) sc.scrollLeft = Math.max(0, xOf(-1000) - 40);
  }

  /* ---------- 전시관 ---------- */
  function renderHall(hid) {
    var h = HALL[hid]; if (!h) { location.hash = "#/"; return; }
    var b = BOOK[h.book];
    var html = '<div class="crumbs"><a href="#/">로비</a>›<span>' + esc(b.wing) + "</span></div>" +
      '<section class="hall-hero" style="background:' + h.color + '"><div class="no">' + esc(h.no) + "</div><h1>" + esc(h.title) + "</h1><p>" + esc(b.name) + " · " + esc(b.sub) +
      (h.from != null ? " · " + esc(yearLabel(h.from)) + " ~ " + esc(h.to >= 2025 ? "오늘" : yearLabel(h.to)) : "") + "</p></section>";
    html += '<div class="room-grid">' + h.rooms.map(function (r) {
      var s = r.open ? roomState(r.id) : "";
      return '<a class="room-card' + (r.open ? "" : " closed") + '" href="#/r/' + r.id + '/read">' +
        (s === "stamp" || s === "gold" ? '<span class="stamp-mark' + (s === "gold" ? " gold" : "") + '">관람<br>완료</span>' : "") +
        '<span class="rno">' + esc(h.no) + "관 " + r.no + "실 · 교과서 " + r.page + "쪽</span><h3>" + esc(r.title) + "</h3>" +
        "<ol>" + r.cases.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ol>" +
        '<span class="state"><span>' + (r.open ? "🔓 개관" : "🔒 준비 중") + "</span><span class=\"muted\">" + (r.open ? STATE_LABEL[s] : "") + "</span></span></a>";
    }).join("") + "</div>";
    if (h.events && h.events.length) {
      html += '<div class="panel" style="margin-top:16px"><h2 style="font-size:1.1rem">이 전시관의 연표</h2><ul class="ev-list">' +
        h.events.map(function (e) { return '<li><span class="y">' + esc(yearLabel(e[0])) + "</span> " + esc(e[1]) + "</li>"; }).join("") + "</ul></div>";
    }
    var other = M.halls.filter(function (x) { return x.book !== h.book && x.from != null && h.from != null && x.from < h.to && x.to > h.from; });
    if (other.length) {
      html += '<div class="panel"><h2 style="font-size:1.1rem">같은 시기 ' + esc(BOOK[other[0].book].wing) + "</h2><div class=\"actions\" style=\"margin:0\">" +
        other.map(function (x) { return '<a class="parallel" href="#/h/' + x.id + '"><span class="tag ' + x.book + '">' + esc(BOOK[x.book].name) + "</span>" + esc(x.no + ". " + x.title) + "</a>"; }).join("") + "</div></div>";
    }
    $app.innerHTML = html;
  }

  /* ---------- 전시실 ---------- */
  function renderRoom(id, corner, query) {
    var x = ROOM[id]; if (!x) { location.hash = "#/"; return; }
    var r = x.r, h = x.h, b = x.b;
    var cn = CORNERS.filter(function (c) { return c.id === corner; })[0] || CORNERS[0];
    var p = state.progress[id] || {};
    var head = '<div class="crumbs"><a href="#/">로비</a>›<span>' + esc(b.wing) + '</span>›<a href="#/h/' + h.id + '">' + esc(h.no + ". " + h.title) + "</a></div>" +
      '<div class="room-head"><div><span class="meta"><span class="tag ' + b.id + '">' + esc(b.name) + "</span> " + esc(h.no) + "관 " + r.no + "실 · 교과서 " + r.page + "쪽" + (r.era ? " · " + esc(r.era) : "") + "</span>" +
      "<h1>" + esc(r.title) + "</h1></div>" +
      (r.parallel && ROOM[r.parallel] ? '<a class="parallel" href="#/r/' + r.parallel + "/" + cn.id + '">↔ <span class="tag ' + ROOM[r.parallel].b.id + '">' + esc(ROOM[r.parallel].b.sub) + " 나란히 보기</span>" + esc(ROOM[r.parallel].r.title) + "</a>" : "") + "</div>";
    if (!r.open) {
      $app.innerHTML = head + '<div class="panel"><h2>준비 중인 전시실이에요</h2><p class="muted">곧 문을 열어요. 이 전시실에서 볼 진열장이에요.</p><ol>' +
        r.cases.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + '</ol><div class="actions"><a class="btn small ghost" href="#/h/' + h.id + '">전시관으로</a></div></div>';
      return;
    }
    var done = { read: false, source: p.answers > 0, cards: p.mastered > 0, puzzle: (p.puzzles || []).length >= PUZZLES.length, quiz: p.quiz != null && p.quizTotal && p.quiz >= Math.ceil(p.quizTotal * 0.8) };
    var nav = '<nav class="corners">' + CORNERS.map(function (c, i) {
      return '<a class="corner' + (c.id === cn.id ? " on" : "") + '" href="#/r/' + id + "/" + c.id + '"><span class="ic">' + c.ic + "</span><span>" + (i + 1) + ". " + esc(c.name) + (done[c.id] ? ' <i class="done"></i>' : "") + "</span></a>";
    }).join("") + "</nav>";
    if (!state.user) { $app.innerHTML = head + gateHTML("로그인하고 " + r.no + "실 입장하기"); mountGoogle(byId("gbtn")); return; }
    $app.innerHTML = head + nav + '<div id="body"><p class="loading">진열장을 여는 중…</p></div>';
    var body = byId("body");
    api.room(id).then(function (c) {
      if (!c) { body.innerHTML = '<div class="panel"><h2>아직 전시 자료가 없어요</h2><p class="muted">선생님이 자료를 올리면 열려요.</p></div>'; return; }
      ({ read: drawRead, source: drawSources, cards: drawCards, puzzle: drawPuzzle, quiz: drawQuiz })[cn.id](body, id, c, query || {});
    }).catch(function (e) { body.innerHTML = '<div class="panel"><h2>전시 자료를 불러오지 못했어요</h2><p class="muted">' + esc(cleanMsg(e.message)) + "</p></div>"; });
  }

  /* ---------- 1. 해설 읽기 ---------- */
  function blanksHTML(s) {
    return esc(s).replace(/\[\[(.+?)\]\]/g, function (_, a) { return '<button type="button" class="blank' + (state.noteOpen ? " show" : "") + '">' + a + "</button>"; });
  }
  function noteHTML(n) {
    var h = '<div class="note"><h4>✎ 필기 노트 · ' + esc(n.title) + "<span>빈칸을 눌러 확인</span></h4>";
    if (n.rows) h += "<table>" + n.rows.map(function (row) { return "<tr><th>" + esc(row[0]) + "</th><td>" + blanksHTML(row[1]) + "</td></tr>"; }).join("") + "</table>";
    if (n.table) h += '<div class="scroll"><table><tr>' + n.table.head.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr>" +
      n.table.rows.map(function (row) { return "<tr>" + row.map(function (c, i) { return i ? "<td>" + blanksHTML(c) + "</td>" : "<th>" + esc(c) + "</th>"; }).join("") + "</tr>"; }).join("") + "</table></div>";
    if (n.flow) h += '<div class="flow">' + n.flow.map(function (s, i) { return (i ? '<span class="arrow">→</span>' : "") + '<span class="st">' + blanksHTML(s) + "</span>"; }).join("") + "</div>";
    return h + "</div>";
  }
  function markTerms(text, terms, used) {
    var html = esc(text);
    terms.forEach(function (t, i) {
      if (used[t.w]) return;
      var re = new RegExp(reRe(esc(t.w)));
      if (re.test(html)) {
        // 이미 만든 버튼 안을 건드리지 않도록 태그 밖에서만 바꿔요
        var done = false;
        html = html.split(/(<[^>]+>[^<]*<\/button>)/).map(function (part) {
          if (done || part.charAt(0) === "<") return part;
          return part.replace(re, function (m) { done = true; return '<button type="button" class="term" data-t="' + i + '">' + m + "</button>"; });
        }).join("");
        if (done) used[t.w] = 1;
      }
    });
    return html;
  }
  function drawRead(body, id, c, query) {
    var terms = (c.terms || []).slice().sort(function (a, b) { return b.w.length - a.w.length; });
    var html = '<div class="tools"><button class="btn small ghost" id="fsm" aria-label="글자 작게">가−</button><button class="btn small ghost" id="fsp" aria-label="글자 크게">가+</button>' +
      '<button class="btn small ghost" id="nopen">' + (state.noteOpen ? "빈칸 다시 가리기" : "필기 노트 빈칸 모두 열기") + "</button></div>";
    if (c.intro) {
      html += '<div class="panel intro"><h3>그때, 그곳에는?</h3><p style="margin:0">' + esc(c.intro.t) + '</p><p class="q">' + esc(c.intro.q) + "</p>" +
        (c.intro.model ? '<details class="ask"><summary>생각 예시 보기</summary><p>' + esc(c.intro.model) + "</p></details>" : "") + "</div>";
    }
    (c.sections || []).forEach(function (s) {
      var used = {};
      html += '<section class="case"><div class="case-head"><span class="cno">진열장 ' + s.no + "</span><h2>" + esc(s.title) + "</h2>" +
        (s.goals ? '<ul class="goals">' + s.goals.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") + "</ul>" : "") +
        (s.keys ? '<div class="keys">' + s.keys.map(function (k) { return "<span><b>" + esc(k[0]) + "</b>" + k[1].map(esc).join(" · ") + "</span>"; }).join("") + "</div>" : "") +
        '</div><div class="case-body">';
      (s.paras || []).forEach(function (pa) {
        html += '<div class="para" id="' + esc(pa.id) + '">' + (pa.h ? "<h3>" + esc(pa.h) + "</h3>" : "") + "<p>" + markTerms(pa.t, terms, used) + '</p><div class="tslot"></div>' +
          (pa.side ? '<details class="side"><summary>더 알아보기</summary>' + esc(pa.side) + "</details>" : "") +
          (pa.link && ROOM[pa.link.room] ? '<a class="plink" href="#/r/' + pa.link.room + '/read">↔ ' + esc(pa.link.label) + "</a>" : "") + "</div>";
      });
      (s.notes || []).forEach(function (n) { html += noteHTML(n); });
      if (s.asks && s.asks.length) html += '<div class="asks">' + s.asks.map(function (a) { return '<details class="ask"><summary>' + esc(a.q) + "</summary><p>" + esc(a.a) + "</p></details>"; }).join("") + "</div>";
      html += "</div></section>";
    });
    html += '<div class="actions" style="justify-content:center"><a class="btn" href="#/r/' + id + '/source">다음 코너: 사료·유물 →</a></div>';
    body.innerHTML = html;

    byId("fsm").onclick = function () { fsIdx = Math.max(0, fsIdx - 1); lsSet("hm_fs", fsIdx); applyFs(); };
    byId("fsp").onclick = function () { fsIdx = Math.min(FS.length - 1, fsIdx + 1); lsSet("hm_fs", fsIdx); applyFs(); };
    byId("nopen").onclick = function () {
      state.noteOpen = !state.noteOpen;
      each(".blank", function (x) { x.classList.toggle("show", state.noteOpen); }, body);
      this.textContent = state.noteOpen ? "빈칸 다시 가리기" : "필기 노트 빈칸 모두 열기";
    };
    each(".blank", function (x) { x.onclick = function () { x.classList.toggle("show"); }; }, body);
    each(".term", function (btn) {
      btn.onclick = function () {
        var t = terms[+btn.getAttribute("data-t")], slot = btn.closest(".para").querySelector(".tslot");
        if (slot.getAttribute("data-open") === t.w) { slot.innerHTML = ""; slot.removeAttribute("data-open"); return; }
        slot.setAttribute("data-open", t.w);
        slot.innerHTML = '<div class="termbox"><b>' + esc(t.w) + "</b>" + (t.hz ? '<span class="hz">' + esc(t.hz) + "</span>" : "") + "<div>" + esc(t.d) + "</div></div>";
      };
    }, body);
    if (query.p) setTimeout(function () { var el = byId(query.p); if (el) { el.scrollIntoView({ behavior: "smooth", block: "start" }); el.classList.add("flash"); } }, 60);
  }

  /* ---------- 2. 사료·유물 ---------- */
  function drawSources(body, id, c) {
    api.myAnswers(id).catch(function () { return {}; }).then(function (mine) {
      mine = mine || {};
      var html = '<p class="muted" style="margin-top:0">사료를 꼼꼼히 읽고 내 생각을 먼저 써 보세요. 저장하면 예시 답안이 열려요. 선생님도 내 답을 볼 수 있어요.</p>';
      (c.sources || []).forEach(function (s) {
        html += '<article class="src" id="src-' + esc(s.id) + '"><div class="src-head"><span class="kind">' + esc(s.kind || "사료") + "</span><h3>" + esc(s.title) + "</h3>" +
          '<a class="btn small ghost" style="margin-left:auto" href="#/r/' + id + "/read?p=" + esc(s.pid) + '">본문에서 찾기</a></div>' +
          "<blockquote>" + esc(s.t) + "</blockquote>" + (s.cite ? "<cite>- " + esc(s.cite) + "</cite>" : "") + '<div class="qs">';
        (s.qs || []).forEach(function (q, i) {
          var key = s.id + "/" + (i + 1), saved = mine[key];
          html += '<div class="sq" data-s="' + esc(s.id) + '" data-n="' + (i + 1) + '"><label for="a-' + esc(s.id) + "-" + i + '">' + (i + 1) + ". " + esc(q.q) + "</label>" +
            (q.hint ? '<p class="hint">💡 ' + esc(q.hint) + "</p>" : "") +
            '<textarea id="a-' + esc(s.id) + "-" + i + '" maxlength="1000" placeholder="내 생각을 써 보세요">' + esc(saved || "") + "</textarea>" +
            '<div class="actions" style="margin-top:6px"><button class="btn small save">' + (saved ? "고쳐서 저장" : "저장하고 예시 답안 보기") + '</button><span class="err"></span></div>' +
            '<div class="model"' + (saved ? "" : " hidden") + "><b>예시 답안</b> " + esc(q.model) + "</div></div>";
        });
        html += "</div></article>";
      });
      html += '<div class="actions" style="justify-content:center"><a class="btn" href="#/r/' + id + '/cards">다음 코너: 인물·개념 카드 →</a></div>';
      body.innerHTML = html;
      each(".sq", function (box) {
        var btn = box.querySelector(".save"), ta = box.querySelector("textarea"), er = box.querySelector(".err");
        btn.onclick = function () {
          var v = ta.value.trim();
          if (v.length < 2) { er.textContent = "한두 문장이라도 써 보세요."; ta.focus(); return; }
          btn.disabled = true; er.textContent = "";
          api.saveAnswer(id, box.getAttribute("data-s"), +box.getAttribute("data-n"), v).then(function () {
            box.querySelector(".model").hidden = false; btn.textContent = "고쳐서 저장"; toast("저장했어요");
            refreshProgress();
          }).catch(function (e) { er.textContent = "저장하지 못했어요: " + cleanMsg(e.message); })
            .then(function () { btn.disabled = false; });
        };
      }, body);
    });
  }

  /* ---------- 3. 인물·개념 카드 ---------- */
  function boxesHTML(n) { var h = '<span class="boxes" title="외운 정도 ' + n + '/5">'; for (var i = 1; i <= 5; i++) h += "<i" + (i <= n ? ' class="on"' : "") + "></i>"; return h + "</span>"; }
  function drawCards(body, id, c, query) {
    api.myCards(id).catch(function () { state.cards[id] = {}; return {}; }).then(function () { paintCards(body, id, c, query.f || "all"); });
  }
  function paintCards(body, id, c, filter) {
    var my = state.cards[id] || {}, today = new Date().toISOString().slice(0, 10);
    var types = []; (c.cards || []).forEach(function (k) { if (types.indexOf(k.t) < 0) types.push(k.t); });
    var list = (c.cards || []).filter(function (k) { return filter === "all" || k.t === filter; });
    var due = (c.cards || []).filter(function (k) { var m = my[k.n]; return m && m.due <= today && m.box < 5; }).length;
    var mastered = (c.cards || []).filter(function (k) { return my[k.n] && my[k.n].box >= 4; }).length;
    body.innerHTML = '<div class="cards-top"><div class="filters">' + [["all", "전체 " + (c.cards || []).length]].concat(types.map(function (t) { return [t, t]; })).map(function (o) {
      return '<button data-f="' + esc(o[0]) + '"' + (o[0] === filter ? ' class="on"' : "") + ">" + esc(o[1]) + "</button>"; }).join("") + "</div>" +
      '<span class="muted" style="font-size:.86rem">외운 카드 ' + mastered + " / " + (c.cards || []).length + (due ? " · 오늘 복습 " + due + "장" : "") + "</span></div>" +
      '<div class="actions" style="margin:0 0 14px"><button class="btn" data-m="flip">카드 뒤집기</button><button class="btn ghost" data-m="pick">설명 보고 이름 고르기</button>' +
      (due ? '<button class="btn brass" data-m="due">복습할 카드 ' + due + "장</button>" : "") + "</div>" +
      '<div class="cgrid">' + list.map(function (k) { var m = my[k.n]; return '<div class="ccard"><span class="ty">' + esc(k.t) + " " + boxesHTML(m ? m.box : 0) + "</span><h4>" + esc(k.n) + "</h4><p>" + esc(k.d) + "</p></div>"; }).join("") + "</div>" +
      '<div class="actions" style="justify-content:center;margin-top:18px"><a class="btn" href="#/r/' + id + '/puzzle">다음 코너: 연표·인과 →</a></div>';
    each("[data-f]", function (b) { b.onclick = function () { paintCards(body, id, c, b.getAttribute("data-f")); }; }, body);
    each("[data-m]", function (b) { b.onclick = function () { startStudy(body, id, c, b.getAttribute("data-m"), filter); }; }, body);
  }
  function pickCards(id, c, filter, onlyDue) {
    var my = state.cards[id] || {}, today = new Date().toISOString().slice(0, 10);
    var pool = (c.cards || []).filter(function (k) { return filter === "all" || k.t === filter; });
    if (onlyDue) pool = (c.cards || []).filter(function (k) { var m = my[k.n]; return m && m.due <= today && m.box < 5; });
    function pr(k) { var m = my[k.n]; if (!m) return 1; if (m.due <= today) return 0 - m.wrong * 0.1; return 2 + m.box; }
    return shuffle(pool).sort(function (a, b) { return pr(a) - pr(b); }).slice(0, 10);
  }
  function maskName(d, n) {
    var core = n.replace(/\(.+?\)/g, "").trim();
    return d.split(core).join("○○");
  }
  function startStudy(body, id, c, mode, filter) {
    var list = pickCards(id, c, filter, mode === "due"), i = 0, right = 0;
    if (mode === "due") mode = "flip";
    if (!list.length) { toast("고를 카드가 없어요"); return; }
    function back() { paintCards(body, id, c, filter); refreshProgress(); }
    function shell(inner) {
      body.innerHTML = '<div class="study"><div class="study-top"><span>' + (i + 1) + " / " + list.length + '</span><button class="btn small ghost" id="quit">그만하기</button></div>' + inner + "</div>";
      byId("quit").onclick = back;
    }
    function result(k, ok) { if (ok) right++; api.cardResult(id, k.n, ok); }
    function finish() {
      body.innerHTML = '<div class="panel result"><div class="big">' + right + " / " + list.length + '</div><p>맞힌 카드는 상자가 한 칸씩 올라가고, 다음 복습 날짜가 늦춰져요.</p><div class="actions" style="justify-content:center"><button class="btn" id="again">한 번 더</button><button class="btn ghost" id="done">카드 목록</button></div></div>';
      byId("again").onclick = function () { startStudy(body, id, c, mode, filter); };
      byId("done").onclick = back;
    }
    if (mode === "flip") {
      (function card() {
        if (!document.body.contains(body)) return; // 다른 화면으로 나갔으면 멈춰요
        if (i >= list.length) return finish();
        var k = list[i];
        shell('<div class="flip" id="fc" role="button" tabindex="0" aria-label="카드 뒤집기"><div class="flip-in"><div class="face"><span class="ty">' + esc(k.t) + "</span><h3>" + esc(k.n) + '</h3><p class="muted">어떤 ' + esc(k.t) + "인지 떠올린 뒤 눌러 보세요</p></div>" +
          '<div class="face back"><span class="ty">' + esc(k.t) + " · " + esc(k.n) + "</span><p>" + esc(k.d) + "</p></div></div></div>" +
          '<div class="actions" style="justify-content:center"><button class="btn ghost" id="no">다시 볼래요</button><button class="btn" id="yes">알았어요</button></div>');
        var fc = byId("fc");
        fc.onclick = function () { fc.classList.toggle("on"); };
        fc.onkeydown = function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fc.classList.toggle("on"); } };
        byId("yes").onclick = function () { result(k, true); i++; card(); };
        byId("no").onclick = function () { result(k, false); i++; card(); };
      })();
    } else {
      (function q() {
        if (!document.body.contains(body)) return; // 다른 화면으로 나갔으면 멈춰요
        if (i >= list.length) return finish();
        var k = list[i];
        var same = (c.cards || []).filter(function (x) { return x.n !== k.n && x.t === k.t; });
        var others = (c.cards || []).filter(function (x) { return x.n !== k.n && x.t !== k.t; });
        var wrong = shuffle(same).concat(shuffle(others)).slice(0, 3).map(function (x) { return x.n; });
        var opts = shuffle([k.n].concat(wrong));
        shell('<div class="prompt"><span class="muted" style="font-size:.8rem">' + esc(k.t) + "</span><br>" + esc(maskName(k.d, k.n)) + "</div>" +
          '<div class="choices">' + opts.map(function (o, n) { return '<button class="choice" data-n="' + n + '">' + esc(o) + "</button>"; }).join("") + "</div>");
        each(".choice", function (b) {
          b.onclick = function () {
            var ok = opts[+b.getAttribute("data-n")] === k.n;
            each(".choice", function (x) { x.disabled = true; if (opts[+x.getAttribute("data-n")] === k.n) x.classList.add("ok"); });
            if (!ok) b.classList.add("no");
            result(k, ok);
            setTimeout(function () { i++; q(); }, ok ? 700 : 1600);
          };
        }, body);
      })();
    }
  }

  /* ---------- 4. 연표·인과 ---------- */
  function drawPuzzle(body, id, c, query) {
    var tab = query.t && PUZZLES.some(function (p) { return p.id === query.t; }) ? query.t : "order";
    var solved = (state.progress[id] || {}).puzzles || [];
    body.innerHTML = '<div class="ptabs">' + PUZZLES.map(function (p) {
      return '<button data-t="' + p.id + '"' + (p.id === tab ? ' class="on"' : "") + ">" + esc(p.name) + (solved.indexOf(p.id) >= 0 ? '<span class="ok">✔</span>' : "") + "</button>"; }).join("") + '</div><div id="pz"></div>' +
      '<div class="actions" style="justify-content:center;margin-top:18px"><a class="btn" href="#/r/' + id + '/quiz">다음 코너: 확인 퀴즈 →</a></div>';
    each("[data-t]", function (b) { b.onclick = function () { location.hash = "#/r/" + id + "/puzzle?t=" + b.getAttribute("data-t"); }; }, body);
    var pz = byId("pz");
    ({ order: puzzleOrder, chain: puzzleChain, pair: puzzlePair })[tab](pz, id, c);
  }
  function savePuzzle(id, stage, score, total) {
    return api.savePuzzle(id, stage, score, total).then(refreshProgress).catch(function (e) { console.warn(e); });
  }
  function puzzleOrder(pz, id, c) {
    var items = (c.order || []).map(function (o, i) { return { k: i, o: o }; });
    var cur = shuffledApart(items, function (x) { return x.k; }), pick = -1, checked = false;
    function paint() {
      pz.innerHTML = '<p class="muted" style="margin-top:0">사건을 <b>오래된 것부터</b> 차례로 놓아 보세요. 두 사건을 차례로 누르면 자리가 바뀌어요. ▲▼로 옮길 수도 있어요.</p>' +
        '<ol class="olist' + (checked ? " checked" : "") + '">' + cur.map(function (x, i) {
          var cls = i === pick ? "pick" : ""; if (checked) cls = x.k === i ? "ok" : "no";
          return '<li class="' + cls + '" data-i="' + i + '"><span class="n">' + (i + 1) + '</span><span class="tx">' + esc(x.o.t) + '<span class="yr">' + esc(x.o.label) + "</span></span>" +
            (checked ? "" : '<span class="mv"><button data-u="' + i + '" aria-label="위로">▲</button><button data-d="' + i + '" aria-label="아래로">▼</button></span>') + "</li>";
        }).join("") + "</ol>" +
        '<div class="actions">' + (checked ? '<button class="btn" id="again">다시 섞기</button>' : '<button class="btn" id="check">확인하기</button>') + '<span id="msg" class="muted"></span></div>';
      if (!checked) {
        each(".olist li", function (li) {
          li.onclick = function (e) {
            if (e.target.closest("button")) return;
            var i = +li.getAttribute("data-i");
            if (pick < 0) pick = i; else if (pick === i) pick = -1; else { var t = cur[pick]; cur[pick] = cur[i]; cur[i] = t; pick = -1; }
            paint();
          };
        }, pz);
        each("[data-u]", function (b) { b.onclick = function () { var i = +b.getAttribute("data-u"); if (i > 0) { var t = cur[i - 1]; cur[i - 1] = cur[i]; cur[i] = t; } pick = -1; paint(); }; }, pz);
        each("[data-d]", function (b) { b.onclick = function () { var i = +b.getAttribute("data-d"); if (i < cur.length - 1) { var t = cur[i + 1]; cur[i + 1] = cur[i]; cur[i] = t; } pick = -1; paint(); }; }, pz);
        byId("check").onclick = function () {
          checked = true;
          var score = cur.filter(function (x, i) { return x.k === i; }).length;
          paint();
          byId("msg").textContent = score === cur.length ? "모두 맞았어요! 🎉" : cur.length + "개 중 " + score + "개가 제자리예요. 연도를 보고 다시 해 보세요.";
          savePuzzle(id, "order", score, cur.length);
        };
      } else {
        byId("again").onclick = function () { cur = shuffledApart(items, function (x) { return x.k; }); checked = false; pick = -1; paint(); };
      }
    }
    paint();
  }
  // 칸 채우기 공통: 아래 카드 묶음에서 하나를 누르고, 빈칸을 누르면 들어가요
  function slotGame(pz, opts) {
    var chips = shuffle(opts.chips.map(function (t, i) { return { i: i, t: t }; }));
    var fill = {}, pick = null, checked = false;
    function inSlot(ci) { return Object.keys(fill).some(function (s) { return fill[s] === ci; }); }
    function paint() {
      var pool = chips.filter(function (x) { return !inSlot(x.i); });
      pz.innerHTML = '<p class="muted" style="margin-top:0">' + opts.help + "</p>" +
        '<div class="pool" aria-label="카드 묶음">' + (pool.length ? pool.map(function (x) { return '<button class="pchip' + (pick === x.i ? " pick" : "") + '" data-c="' + x.i + '">' + esc(x.t) + "</button>"; }).join("") : '<span class="muted">모두 놓았어요. 확인해 보세요.</span>') + "</div>" +
        opts.board(function (slotId) {
          var ci = fill[slotId], cls = "slot" + (ci != null ? " filled" : "");
          if (checked) cls += opts.answer[slotId] === ci ? " ok" : " no";
          return '<button class="' + cls + '" data-s="' + slotId + '">' + (ci != null ? esc(opts.chips[ci]) : '<span class="muted">여기에 놓기</span>') + "</button>";
        }) +
        '<div class="actions">' + (checked ? '<button class="btn" id="again">다시 하기</button>' : '<button class="btn" id="check"' + (Object.keys(fill).length < Object.keys(opts.answer).length ? " disabled" : "") + '>확인하기</button><button class="btn ghost" id="clear">모두 빼기</button>') +
        '<span id="msg" class="muted"></span></div>';
      if (checked) { byId("again").onclick = function () { fill = {}; pick = null; checked = false; chips = shuffle(chips); paint(); }; return; }
      each(".pchip", function (b) { b.onclick = function () { var ci = +b.getAttribute("data-c"); pick = pick === ci ? null : ci; paint(); }; }, pz);
      each(".slot", function (b) {
        b.onclick = function () {
          var s = b.getAttribute("data-s");
          if (pick != null) { fill[s] = pick; pick = null; } else if (fill[s] != null) { delete fill[s]; }
          paint();
        };
      }, pz);
      byId("clear").onclick = function () { fill = {}; pick = null; paint(); };
      byId("check").onclick = function () {
        checked = true;
        var keys = Object.keys(opts.answer), score = keys.filter(function (s) { return opts.answer[s] === fill[s]; }).length;
        paint();
        byId("msg").textContent = score === keys.length ? "모두 맞았어요! 🎉" : keys.length + "칸 중 " + score + "칸을 맞혔어요.";
        opts.done(score, keys.length);
      };
    }
    paint();
  }
  function puzzleChain(pz, id, c) {
    var ch = c.chain || [], chips = [], answer = {};
    ch.forEach(function (x, i) { answer["e" + i] = chips.length; chips.push(x.e); answer["r" + i] = chips.length; chips.push(x.r); });
    slotGame(pz, {
      chips: chips, answer: answer,
      help: "원인을 보고, 그래서 <b>무슨 일이 일어났고</b> 그 <b>결과</b>는 어땠는지 카드를 골라 놓아 보세요.",
      board: function (slot) {
        return ch.map(function (x, i) {
          return '<div class="chain"><div class="ccell fixed"><small>원인</small>' + esc(x.c) + '</div><span class="arrow">→</span><div class="ccell" style="padding:0"><small style="padding:6px 12px 0">사건</small>' + slot("e" + i) +
            '</div><span class="arrow">→</span><div class="ccell" style="padding:0"><small style="padding:6px 12px 0">결과</small>' + slot("r" + i) + "</div></div>";
        }).join("");
      },
      done: function (s, t) { savePuzzle(id, "chain", s, t); }
    });
  }
  function puzzlePair(pz, id, c) {
    var ps = c.pairs || [], chips = ps.map(function (x) { return x.w; }), answer = {};
    ps.forEach(function (x, i) { answer["w" + i] = i; });
    slotGame(pz, {
      chips: chips, answer: answer,
      help: "같은 시기에 <b>세계</b>에서는 무슨 일이 있었을까요? 한국사 사건 옆에 세계사 카드를 놓아 보세요.",
      board: function (slot) {
        return '<div class="pairs"><div class="pair-head"><span class="y">시기</span><span class="k">한국사</span><span class="w">세계사</span></div>' + ps.map(function (x, i) {
          return '<div class="pair"><span class="yr">' + esc(x.y) + '</span><div class="kk">' + esc(x.k) + "</div>" + slot("w" + i) + "</div>";
        }).join("") + "</div>";
      },
      done: function (s, t) { savePuzzle(id, "pair", s, t); }
    });
  }

  /* ---------- 5. 확인 퀴즈 ---------- */
  function drawQuiz(body, id) {
    body.innerHTML = '<p class="loading">문제를 꺼내는 중…</p>';
    api.quiz(id).then(function (qs) {
      if (!qs || !qs.length) { body.innerHTML = '<div class="panel"><p class="muted">아직 퀴즈가 없어요.</p></div>'; return; }
      var ans = {};
      function paint() {
        var n = Object.keys(ans).length;
        body.innerHTML = '<p class="muted" style="margin-top:0">' + qs.length + "문항 · 8문항 이상 맞히면 관람 도장, 만점이면 금빛 도장에 한 걸음 더 가까워져요.</p>" +
          qs.map(function (q, i) {
            return '<div class="panel qcard"><span class="qn">문제 ' + (i + 1) + "</span><h3>" + esc(q.question) + '</h3><div class="choices">' +
              q.choices.map(function (o, k) { return '<button class="choice' + (ans[q.no] === o ? " sel" : "") + '" data-q="' + q.no + '" data-k="' + k + '">' + "①②③④".charAt(k) + " " + esc(o) + "</button>"; }).join("") + "</div></div>";
          }).join("") +
          '<div class="actions" style="justify-content:center"><button class="btn brass" id="submit"' + (n < qs.length ? " disabled" : "") + ">제출하기 (" + n + "/" + qs.length + ")</button></div>";
        each(".choice", function (b) {
          b.onclick = function () {
            var q = qs.filter(function (x) { return x.no === +b.getAttribute("data-q"); })[0];
            ans[q.no] = q.choices[+b.getAttribute("data-k")];
            each('.choice[data-q="' + q.no + '"]', function (x) { x.classList.toggle("sel", x === b); }, body);
            var s = byId("submit"), m = Object.keys(ans).length; s.disabled = m < qs.length; s.textContent = "제출하기 (" + m + "/" + qs.length + ")";
          };
        }, body);
        byId("submit").onclick = function () {
          this.disabled = true;
          api.submitQuiz(id, ans).then(function (res) { showReview(res); refreshProgress(); })
            .catch(function (e) { toast("제출하지 못했어요: " + cleanMsg(e.message)); byId("submit").disabled = false; });
        };
      }
      function showReview(res) {
        var rv = {}; (res.review || []).forEach(function (x) { rv[x.no] = x; });
        var gold = res.score === res.total, pass = res.score >= Math.ceil(res.total * 0.8);
        body.innerHTML = '<div class="panel result"><div class="score-seal' + (gold ? " gold" : "") + '"><span><b>' + res.score + "</b><br>/ " + res.total + "</span></div>" +
          "<p>" + (gold ? "만점이에요! 퍼즐 세 개와 사료 탐구까지 마치면 금빛 도장을 받아요." : pass ? "관람 도장을 받았어요! 🎖️" : "8문항 이상 맞히면 관람 도장을 받아요. 해설을 다시 읽고 도전해 보세요.") +
          (res.best != null ? ' <span class="muted">(최고 ' + res.best + "점)</span>" : "") + '</p><div class="actions" style="justify-content:center"><button class="btn" id="retry">다시 풀기</button><a class="btn ghost" href="#/h/' + ROOM[id].h.id + '">전시관으로</a></div></div>' +
          qs.map(function (q, i) {
            var r = rv[q.no] || {};
            return '<div class="panel qcard"><span class="qn">문제 ' + (i + 1) + " " + (r.correct ? "⭕" : "❌") + "</span><h3>" + esc(q.question) + '</h3><div class="choices">' +
              q.choices.map(function (o, k) { var cls = o === r.answer ? " ok" : (o === ans[q.no] ? " no" : ""); return '<button class="choice' + cls + '" disabled>' + "①②③④".charAt(k) + " " + esc(o) + "</button>"; }).join("") +
              '</div><div class="why">' + esc(r.why || "") + (r.pid ? ' <a href="#/r/' + id + "/read?p=" + esc(r.pid) + '">본문 보기 →</a>' : "") + "</div></div>";
          }).join("");
        byId("retry").onclick = function () { ans = {}; drawQuiz(body, id); };
        window.scrollTo(0, 0);
      }
      paint();
    }).catch(function (e) { body.innerHTML = '<div class="panel"><p class="muted">퀴즈를 불러오지 못했어요: ' + esc(cleanMsg(e.message)) + "</p></div>"; });
  }

  /* ---------- 관람 수첩 ---------- */
  function renderStamps() {
    if (!state.user) { location.hash = "#/login"; return; }
    refreshProgress().then(function () {
      var html = '<section class="hero"><div><h1>관람 수첩</h1><p>전시실마다 받은 도장과 복습할 카드예요.</p></div><span class="passport"><span class="seal">' + stampCount() + "</span><span><b>받은 도장</b><small>개관한 전시실 " + OPEN.length + "곳</small></span></span></section>";
      html += '<div class="room-grid">' + OPEN.map(function (id) {
        var x = ROOM[id], p = state.progress[id] || {}, s = roomState(id);
        return '<div class="room-card">' + (s === "stamp" || s === "gold" ? '<span class="stamp-mark' + (s === "gold" ? " gold" : "") + '">' + (s === "gold" ? "금빛<br>도장" : "관람<br>도장") + "</span>" : "") +
          '<span class="rno"><span class="tag ' + x.b.id + '">' + esc(x.b.name) + "</span> " + esc(x.h.no) + "관 " + x.r.no + "실</span><h3>" + esc(x.r.title) + "</h3>" +
          '<ul style="margin:4px 0 0;padding-left:1.2em;font-size:.88rem">' +
          "<li>확인 퀴즈 최고 " + (p.quiz != null ? p.quiz + " / " + p.quizTotal : "—") + "</li><li>퍼즐 " + (p.puzzles || []).length + " / " + PUZZLES.length + "</li><li>사료 답 " + (p.answers || 0) + "개</li><li>외운 카드 " + (p.mastered || 0) + "장</li></ul>" +
          '<div class="actions" style="margin-top:auto">' + (p.due ? '<a class="btn small brass" href="#/r/' + id + '/cards">복습 ' + p.due + "장</a>" : "") + '<a class="btn small ghost" href="#/r/' + id + '/read">입장</a></div></div>';
      }).join("") + "</div>";
      $app.innerHTML = html;
    });
  }

  /* ---------- 교사 화면 ---------- */
  function renderTeacher() {
    if (!state.isAdmin) { location.hash = "#/"; return; }
    $app.innerHTML = '<section class="hero"><div><h1>학예실</h1><p>학생별·전시실별 퀴즈 최고점, 퍼즐, 사료 답, 외운 카드예요.</p></div></section>' +
      '<div class="panel" id="tbody"><p class="loading">불러오는 중…</p></div>' +
      '<div class="panel"><h2 style="font-size:1.1rem">사료 탐구 답 모아 보기</h2><div class="actions" style="margin:0 0 10px"><select id="aroom">' +
      OPEN.map(function (id) { return '<option value="' + id + '">' + esc(roomLabel(id) + " " + ROOM[id].r.title) + "</option>"; }).join("") + '</select><button class="btn small" id="aload">불러오기</button></div><div id="alist"></div></div>';
    api.adminScores().then(function (rows) {
      var stu = {}, order = [];
      (rows || []).forEach(function (r) { if (!stu[r.email]) { stu[r.email] = { r: r, u: {} }; order.push(r.email); } stu[r.email].u[r.room_id] = r; });
      var classes = {}; order.forEach(function (k) { var r = stu[k].r; if (r.grade) classes[r.grade + "-" + r.class_no] = 1; });
      function draw() {
        var cv = byId("cls") ? byId("cls").value : "";
        var keys = order.filter(function (k) { var r = stu[k].r; return !cv || (r.grade + "-" + r.class_no) === cv; });
        var h = '<div class="actions" style="margin:0 0 12px"><select id="cls"><option value="">전체 반</option>' + Object.keys(classes).sort().map(function (c) { return "<option>" + c + "</option>"; }).join("") + "</select>" +
          '<button class="btn small ghost" id="csv">CSV 내려받기</button><span class="muted" style="font-size:.84rem">원 안 숫자 = 퀴즈 최고점, 채운 원 = 만점. 칸에 손가락을 대면 퍼즐·사료·카드 기록이 보여요.</span></div>' +
          '<div class="scroll"><table class="tbl"><thead><tr><th>번호</th><th>이름</th>' + OPEN.map(function (id) { return '<th title="' + esc(ROOM[id].r.title) + '">' + esc(roomLabel(id)) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          keys.map(function (k) {
            var r = stu[k].r;
            return "<tr><td>" + (r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no : "-") + "</td><td>" + esc(r.name || r.email) + "</td>" + OPEN.map(function (id) {
              var u = stu[k].u[id]; if (!u) return '<td class="c"></td>';
              var full = u.quiz_best != null && u.quiz_best === u.quiz_total;
              return '<td class="c" title="퍼즐 ' + u.puzzles + "/3 · 사료 답 " + u.answers + " · 외운 카드 " + u.mastered + '"><span class="cell' + (u.quiz_best != null ? " q" : "") + (full ? " full" : "") + '">' + (u.quiz_best != null ? u.quiz_best : "·") + "</span></td>";
            }).join("") + "</tr>";
          }).join("") + "</tbody></table></div>" + (keys.length ? "" : '<p class="muted">아직 기록이 없어요.</p>');
        byId("tbody").innerHTML = h;
        if (cv) byId("cls").value = cv;
        byId("cls").onchange = draw;
        byId("csv").onclick = function () {
          var lines = [["email", "이름", "학년", "반", "번호", "전시실", "제목", "퀴즈최고", "문항수", "퀴즈횟수", "퍼즐", "사료답", "외운카드", "마지막"]];
          (rows || []).forEach(function (r) { lines.push([r.email, r.name, r.grade, r.class_no, r.student_no, r.room_id, ROOM[r.room_id] ? ROOM[r.room_id].r.title : "", r.quiz_best, r.quiz_total, r.quiz_attempts, r.puzzles, r.answers, r.mastered, r.last_at]); });
          var csv = "﻿" + lines.map(function (row) { return row.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\n");
          var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "history-museum.csv"; a.click();
        };
      }
      draw();
    }).catch(function (e) { byId("tbody").innerHTML = '<p class="muted">기록을 불러오지 못했어요: ' + esc(cleanMsg(e.message)) + "</p>"; });
    byId("aload").onclick = function () {
      var id = byId("aroom").value, out = byId("alist");
      out.innerHTML = '<p class="loading">불러오는 중…</p>';
      Promise.all([api.room(id), api.adminAnswers(id)]).then(function (res) {
        var c = res[0] || {}, rows = res[1] || [];
        if (!rows.length) { out.innerHTML = '<p class="muted">아직 낸 답이 없어요.</p>'; return; }
        out.innerHTML = (c.sources || []).map(function (s) {
          return (s.qs || []).map(function (q, i) {
            var list = rows.filter(function (r) { return r.source_id === s.id && r.q_no === i + 1; });
            if (!list.length) return "";
            return '<h3 style="font-size:1rem;margin:14px 0 6px">' + esc(s.title) + " · " + (i + 1) + ". " + esc(q.q) + ' <span class="muted" style="font-size:.8rem">(' + list.length + "명)</span></h3>" +
              list.map(function (r) { return '<div class="ans"><span class="who2">' + esc((r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no + " " : "") + (r.name || r.email)) + "</span><p>" + esc(r.answer) + "</p></div>"; }).join("");
          }).join("");
        }).join("");
      }).catch(function (e) { out.innerHTML = '<p class="muted">불러오지 못했어요: ' + esc(cleanMsg(e.message)) + "</p>"; });
    };
  }

  /* ---------- 시작 ---------- */
  window.addEventListener("hashchange", route);
  if (sb) sb.auth.onAuthStateChange(function (ev) { if (ev === "SIGNED_OUT") { state.user = null; renderWho(); } });
  loadUser().then(route).catch(function (e) { console.warn(e); renderWho(); route(); });
})();
