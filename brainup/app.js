// MY Brain Up — 화면 (로그인 · 홈 · 문제 풀기 · 순위 · 내 기록 · 교사 화면)
// 문제 고르기와 채점은 Supabase 함수(bu_next, bu_answer)가 해요. 정답은 답을 낸 뒤에만 내려와요.
(function () {
  "use strict";
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
  var XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  var BU = window.BU, CATS = BU.CATS, CAT = BU.CAT;
  var DAY = 864e5, KST = 9 * 3600e3;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function low(s) { return String(s || "").toLowerCase().trim(); }
  function kday(ms) { return new Date((ms == null ? Date.now() : ms) + KST).toISOString().slice(0, 10); }
  function weekStart() { var d = new Date(Date.now() + KST); var w = (d.getUTCDay() + 6) % 7; return kday(Date.now() - w * DAY); }
  function addDays(day, n) { return kday(Date.parse(day + "T00:00:00Z") - KST + n * DAY + 12 * 3600e3); }
  function lget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function num(n) { return Number(n || 0).toLocaleString("ko-KR"); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : 0; }
  var toastT;
  function toast(m) { var el = $("#toast"); el.textContent = m; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(function () { el.classList.add("hidden"); }, 3000); }
  function catPill(id) { var c = CAT[id] || { icon: "❓", name: id, color: "#888" }; return '<span class="pill" style="background:' + c.color + '1a;color:' + c.color + '">' + c.icon + " " + esc(c.name) + "</span>"; }
  function langPill(l) { return l === "en" ? '<span class="pill gold">🌏 English</span>' : ""; }
  function errMsg(e) {
    var m = (e && (e.message || e.details)) || String(e);
    var map = { BU_CLOSED: "지금은 퀴즈가 닫혀 있어요. 선생님이 열어 주시면 풀 수 있어요.", BU_DENIED: "학교 계정으로 로그인해 주세요.", BU_LIMIT: "오늘은 다 썼어요. 내일 다시 3번씩 생겨요.",
      BU_NO_TICKET: "문제를 다시 불러올게요.", BU_NO_SKIP: "오늘의 10문제에서는 건너뛸 수 없어요.", BU_NO_PROFILE: "닉네임을 먼저 정해 주세요." };
    for (var k in map) if (m.indexOf(k) >= 0) return map[k];
    return m;
  }
  function isMissing(e) { return /bu_|schema cache|does not exist|42P01|42883|PGRST20[25]/i.test(((e && e.message) || "") + ((e && e.code) || "")); }

  // ======================================================================
  //  Supabase
  // ======================================================================
  var sb = null;
  function client() { return sb || (sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } })); }
  function rpc(name, args) { return client().rpc(name, args || {}).then(function (r) { if (r.error) throw r.error; return r.data; }); }
  function sel(q) { return q.then(function (r) { if (r.error) throw r.error; return r.data || []; }); }
  function all(make) {
    var out = [];
    function page(from) { return make().range(from, from + 999).then(function (r) { if (r.error) throw r.error; out = out.concat(r.data || []); return (r.data || []).length < 1000 ? out : page(from + 1000); }); }
    return page(0);
  }

  // ======================================================================
  //  상태 · 로그인
  // ======================================================================
  var DEF_SET = { open: true, english_ratio: 0.2, english_day: "", allow_external: false, timer: true, crown_rate: 0.05 };
  var state = { email: "", uid: "", admin: false, settings: DEF_SET, profile: null, daily: [], wrongN: 0, ready: false,
    qtype: lget("bu.qtype", ""), boardTab: "week", tTab: lget("bu.tTab", "upload") };

  function showLogin(msg) {
    $("#nav").classList.add("hidden");
    $("#main").innerHTML = '<div class="card center"><div style="font-size:64px">🧠</div><h2>풀수록 똑똑해지는 MY Brain Up</h2>' +
      '<p class="muted">시작 버튼을 누르면 8개 분야에서 랜덤으로 문제가 나와요.<br>객관식 · 단답형 · 쉬운 영어 문제로 상식 퀸에 도전해 보세요!</p>' +
      '<div class="dots" style="justify-content:center">' + CATS.map(function (c) { return '<span class="pill" style="background:' + c.color + '1a;color:' + c.color + '">' + c.icon + " " + c.short + "</span>"; }).join("") + "</div>" +
      (msg ? '<p class="err">' + esc(msg) + "</p>" : "") +
      '<div id="gsi" style="display:flex;justify-content:center;margin-top:14px"></div>' +
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
    client().auth.getSession().then(function (r) {
      var s = r.data.session;
      if (!s) return showLogin();
      state.email = low(s.user.email); state.uid = s.user.id;
      $("#out").classList.remove("hidden");
      $("#out").onclick = function () { client().auth.signOut().then(function () { location.hash = ""; location.reload(); }); };
      return rpc("is_admin").then(function (a) {
        state.admin = !!a;
        if (state.admin) $("#tLink").classList.remove("hidden");
        return loadAll();
      });
    }).catch(function (e) { $("#main").innerHTML = '<div class="card err">' + esc(errMsg(e)) + "</div>"; });
  }
  function loadSettings() {
    return sel(client().from("bu_settings").select("key,value")).then(function (rows) {
      var s = Object.assign({}, DEF_SET); rows.forEach(function (x) { s[x.key] = x.value; }); state.settings = s;
    });
  }
  function loadMine() {
    return Promise.all([
      sel(client().from("bu_profile").select("*").eq("user_id", state.uid)),
      sel(client().from("bu_daily").select("day,n,ok,pts,mc_n,mc_ok,sa_n,sa_ok,en_n,en_ok,cats,d10").eq("user_id", state.uid).order("day", { ascending: true }).range(0, 4999)),
      client().from("bu_qstate").select("qid", { count: "exact", head: true }).eq("user_id", state.uid).eq("last_ok", false)
    ]).then(function (r) {
      state.profile = r[0][0] || null; state.daily = r[1]; state.wrongN = r[2].count || 0;
    });
  }
  function loadAll() {
    return loadSettings().then(loadMine).then(function () { state.ready = true; state.missing = false; })
      .catch(function (e) { console.warn(e); state.ready = true; state.missing = true; state.err = e.message; })
      .then(function () {
        var school = state.email.endsWith("@smy.ms.kr"), ext = state.settings.allow_external === true || state.settings.allow_external === "true";
        if (!school && !state.admin && !ext) return showLogin("학교 계정(@smy.ms.kr)으로 로그인해 주세요. 지금: " + state.email);
        $("#nav").classList.remove("hidden");
        route();
      });
  }

  // ======================================================================
  //  화면 이동
  // ======================================================================
  window.addEventListener("hashchange", route);
  function route() {
    if (!state.ready) return;
    stopTimer(); closeOverlay();
    window.scrollTo(0, 0);
    var h = location.hash.replace(/^#\/?/, "").split("/");
    $$("#nav a").forEach(function (a) { a.classList.toggle("on", a.dataset.r === (h[0] === "play" || h[0] === "daily" || h[0] === "review" ? "" : h[0])); });
    if (state.missing) return viewMissing();
    if (!state.profile && h[0] !== "teacher") return viewNick(true);
    if (h[0] === "play") return startPlay("random", h[1] || "");
    if (h[0] === "daily") return startPlay("daily", "");
    if (h[0] === "review") return startPlay("review", "");
    if (h[0] === "board") return viewBoard();
    if (h[0] === "me") return viewMe();
    if (h[0] === "nick") return viewNick(false);
    if (h[0] === "teacher" && state.admin) return viewTeacher();
    viewHome();
  }
  function viewMissing() {
    $("#main").innerHTML = state.admin
      ? '<div class="card"><h2>처음 한 번만 설정해 주세요 🛠️</h2><p>Supabase에 Brain Up 표가 아직 없어요. <b>SQL Editor</b>에서 <code>brainup/supabase_brainup.sql</code> 내용을 붙여 넣고 <b>Run</b>을 눌러 주세요.</p><p class="small muted">' + esc(state.err || "") + "</p></div>"
      : '<div class="card center"><h2>곧 열려요 🛠️</h2><p class="muted">선생님이 MY Brain Up을 준비하고 있어요.</p></div>';
  }

  // ---------- 닉네임 ----------
  function viewNick(first) {
    var cur = state.profile ? state.profile.nickname : "";
    $("#main").innerHTML = '<div class="card center"><div style="font-size:52px">🧠</div><h2>' + (first ? "반가워요! 닉네임을 정해 주세요" : "닉네임 바꾸기") + "</h2>" +
      '<p class="muted">순위표에는 실명 대신 <b>닉네임</b>만 보여요. (선생님은 실명도 볼 수 있어요)<br>친구를 놀리거나 실명이 드러나는 닉네임은 안 돼요.</p>' +
      '<form id="nickF" class="sa" style="max-width:420px;margin:14px auto 0"><input id="nickI" maxlength="12" placeholder="예: 브레인퀸, 상식요정" value="' + esc(cur) + '" required><button class="btn navy">저장</button></form>' +
      (first ? "" : '<div class="row-btns" style="justify-content:center"><a class="btn" href="#/me">취소</a></div>') + "</div>";
    $("#nickI").focus();
    $("#nickF").onsubmit = function (ev) {
      ev.preventDefault();
      var v = $("#nickI").value.trim();
      if (!v) return;
      rpc("bu_set_nick", { p_nick: v }).then(loadMine).then(function () { toast("닉네임: " + state.profile.nickname); location.hash = "#/"; route(); })
        .catch(function (e) { toast(errMsg(e)); });
    };
  }

  // ======================================================================
  //  내 기록 계산
  // ======================================================================
  function sumRows(rows) {
    var t = { n: 0, ok: 0, pts: 0, mc_n: 0, mc_ok: 0, sa_n: 0, sa_ok: 0, en_n: 0, en_ok: 0, cats: {} };
    rows.forEach(function (r) {
      ["n", "ok", "pts", "mc_n", "mc_ok", "sa_n", "sa_ok", "en_n", "en_ok"].forEach(function (k) { t[k] += +r[k] || 0; });
      Object.keys(r.cats || {}).forEach(function (c) { var a = t.cats[c] || [0, 0]; a[0] += +r.cats[c][0] || 0; a[1] += +r.cats[c][1] || 0; t.cats[c] = a; });
    });
    return t;
  }
  function streakOf(days) {
    var set = {}; days.forEach(function (d) { set[d] = 1; });
    var today = kday(), cur = 0, d = set[today] ? today : addDays(today, -1);
    while (set[d]) { cur++; d = addDays(d, -1); }
    var best = 0, run = 0, prev = null;
    days.slice().sort().forEach(function (x) { run = prev && addDays(prev, 1) === x ? run + 1 : 1; best = Math.max(best, run); prev = x; });
    return { cur: cur, best: best, today: !!set[today] };
  }
  function my() {
    var rows = state.daily.filter(function (r) { return r.n > 0 || (r.d10 || []).length; });
    var today = kday(), ws = weekStart();
    var tr = rows.filter(function (r) { return r.day === today; })[0] || { n: 0, ok: 0, pts: 0, d10: [] };
    return { total: sumRows(rows), week: sumRows(rows.filter(function (r) { return r.day >= ws; })), today: tr, streak: streakOf(rows.map(function (r) { return r.day; })), rows: rows };
  }
  function itemsLeft(k) {
    var it = (state.profile && state.profile.items) || {};
    return it.day === kday() ? 3 - (+it[k] || 0) : 3;
  }
  function englishDay() { var v = state.settings.english_day; return v && v === kday(); }

  // ======================================================================
  //  홈
  // ======================================================================
  function viewHome() {
    var m = my(), p = state.profile, d10 = m.today.d10 || [];
    var html = "";
    if (englishDay()) html += '<div class="card eday">🌏 오늘은 <b>English Day</b>! 모든 문제가 쉬운 영어로 나오고, 맞히면 <b>+1점 보너스</b>예요.</div>';
    html += '<div class="card hero"><h2>' + esc(p.nickname) + "님, 오늘도 Brain Up! 🧠</h2>" +
      '<p>' + (m.streak.today ? "오늘 " + m.today.n + "문제 풀었어요. 계속 가 볼까요?" : m.streak.cur ? "🔥 " + m.streak.cur + "일 연속 도전 중! 오늘도 이어 가요." : "시작 버튼을 누르면 바로 문제가 나와요.") + "</p>" +
      '<div class="stats"><span>🔥 연속 ' + m.streak.cur + "일</span><span>⭐ 이번 주 " + num(m.week.pts) + "점</span><span>✅ 정답률 " + pct(m.total.ok, m.total.n) + "%</span><span>🏅 배지 " + (p.badges || []).length + "/8</span></div>" +
      '<div class="seg" id="seg">' + [["", "🎲 랜덤"], ["mc", "✅ 객관식"], ["sa", "✏️ 단답형"]].map(function (x) { return '<button type="button" data-t="' + x[0] + '" class="' + (state.qtype === x[0] ? "on" : "") + '">' + x[1] + "</button>"; }).join("") + "</div><br>" +
      '<button class="start" id="go">▶ START</button>' +
      '<p class="small" style="margin:14px 0 0;opacity:.8">객관식 1점 · 단답형 2점 · 영어 문제 +1점 · 가끔 👑 왕관 찬스!</p></div>';

    html += '<div class="grid2">';
    html += '<div class="card"><h2>📅 오늘의 10문제</h2><p class="muted small">전교생이 오늘 같은 10문제를 풀어요. 하루 한 번, 끝까지 풀면 +3점!</p>' +
      '<div class="dots">' + Array.apply(null, Array(10)).map(function (_, i) { return "<i class='" + (d10[i] === 1 ? "o" : d10[i] === 0 ? "x" : "") + "'></i>"; }).join("") + "</div>" +
      (d10.length >= 10 ? '<p><b>' + d10.filter(function (x) { return x === 1; }).length + ' / 10</b> 맞혔어요!</p><div class="row-btns"><button class="btn gold" id="share">📋 결과 복사해서 자랑하기</button></div>'
        : '<div class="row-btns"><a class="btn navy" href="#/daily">' + (d10.length ? "▶ 이어서 풀기 (" + d10.length + "/10)" : "▶ 도전하기") + "</a></div>") + "</div>";
    html += '<div class="card"><h2>📝 오답 다시 풀기</h2><p class="muted small">틀린 문제를 다시 맞히면 오답 노트에서 빠져요.</p>' +
      '<p style="font-size:28px;font-weight:800;margin:6px 0;color:var(--navy)">' + state.wrongN + '<span class="small muted"> 문제</span></p>' +
      '<div class="row-btns">' + (state.wrongN ? '<a class="btn navy" href="#/review">▶ 다시 풀기</a>' : "") + '<a class="btn" href="#/me">📊 오답 노트 보기</a></div></div>';
    html += "</div>";

    html += '<div class="card" style="margin-top:12px"><h2>🏅 분야 배지 <span class="small muted">그 분야를 10번 맞히면 받아요</span></h2>' + badgeGrid(m.total) + "</div>";
    $("#main").innerHTML = html;
    $$("#seg button").forEach(function (b) { b.onclick = function () { state.qtype = b.dataset.t; lset("bu.qtype", state.qtype); $$("#seg button").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    $("#go").onclick = function () { location.hash = "#/play/" + (state.qtype || "any"); };
    if ($("#share")) $("#share").onclick = function () { shareDaily(d10); };
  }
  function badgeGrid(total) {
    var owned = (state.profile && state.profile.badges) || [];
    return '<div class="badges">' + CATS.map(function (c) {
      var have = owned.indexOf(c.id) >= 0, ok = (total.cats[c.id] || [0, 0])[1];
      return '<div class="badge ' + (have ? "" : "lock") + '" title="' + esc(c.name) + '"><div class="ic">' + c.bicon + "</div><b>" + esc(c.badge) + "</b><small>" + (have ? c.icon + " " + esc(c.short) : esc(c.short) + " " + Math.min(ok, 10) + "/10") + "</small></div>";
    }).join("") + "</div>";
  }
  function shareDaily(d10) {
    var okN = d10.filter(function (x) { return x === 1; }).length;
    var txt = "🧠 MY Brain Up " + kday().slice(5).replace("-", "/") + " 오늘의 10문제 " + okN + "/10\n" + d10.map(function (x) { return x === 1 ? "🟩" : "🟥"; }).join("") + "\n#BrainUp #MOONYOUNG";
    (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(function () { toast("복사했어요! 친구에게 붙여 넣어 보세요."); }, function () { prompt("복사해서 쓰세요", txt); });
  }

  // ======================================================================
  //  문제 풀기
  // ======================================================================
  var play = null, timerT = null;
  function stopTimer() { clearInterval(timerT); timerT = null; }
  function closeOverlay() { var o = $("#overlay"); o.classList.add("hidden"); o.innerHTML = ""; }
  function overlay(html) { var o = $("#overlay"); o.innerHTML = '<div class="modal">' + html + "</div>"; o.classList.remove("hidden"); return o; }

  function startPlay(mode, qtype) {
    play = { mode: mode, qtype: qtype === "mc" || qtype === "sa" ? qtype : null, q: null, res: null, sess: { n: 0, ok: 0, pts: 0 }, busy: false };
    nextQ();
  }
  // 라벨은 "지금 이 문제"의 모드로 보여 줘요 (풀던 다른 모드 문제가 먼저 나올 수 있어서)
  function modeLabel() { var m = (play.q && play.q.mode) || play.mode; return m === "daily" ? "📅 오늘의 10문제" : m === "review" ? "📝 오답 다시 풀기" : play.qtype === "mc" ? "✅ 객관식" : play.qtype === "sa" ? "✏️ 단답형" : "🎲 랜덤"; }
  function nextQ() {
    stopTimer();
    $("#main").innerHTML = '<div class="card center muted">문제를 고르는 중… 🎲</div>';
    rpc("bu_next", { p_mode: play.mode, p_qtype: play.qtype }).then(function (q) {
      if (q.crown) return showCrown();
      if (q.daily_done) return loadMine().then(function () { viewDailyDone(); });
      if (q.empty) return viewEmpty();
      // 다른 모드에서 풀다 만 문제가 있으면 그 문제만 먼저 풀고, 다음부터는 고른 모드로 돌아가요
      if (q.resumed && q.mode && q.mode !== play.mode) toast("풀다 만 문제가 있어서 그 문제부터 마무리할게요.");
      play.q = q; play.res = null; play.hint = q.hint || null; play.removed = q.fifty || [];
      play.order = shuffle([0, 1, 2, 3].slice(0, (q.choices || []).length));
      play.deadline = Date.now() + (q.left == null ? q.limit : q.left) * 1000;
      renderQ();
    }).catch(function (e) {
      if (isMissing(e)) { state.missing = true; state.err = e.message; return viewMissing(); }
      if (/BU_NO_PROFILE/.test(e.message)) return viewNick(true);
      $("#main").innerHTML = '<div class="card center"><p class="err">' + esc(errMsg(e)) + '</p><div class="row-btns" style="justify-content:center"><a class="btn" href="#/">홈으로</a><button class="btn navy" id="again">다시 시도</button></div></div>';
      $("#again").onclick = nextQ;
    });
  }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function viewEmpty() {
    var msg = play.mode === "review" ? "오답 노트가 비어 있어요. 멋져요! 🎉" : "아직 문제가 없어요. 선생님이 문제를 올리면 풀 수 있어요.";
    $("#main").innerHTML = '<div class="card center"><div style="font-size:48px">' + (play.mode === "review" ? "🎉" : "📭") + "</div><h2>" + msg + '</h2><div class="row-btns" style="justify-content:center"><a class="btn navy" href="#/">홈으로</a></div></div>';
  }

  function renderQ() {
    var q = play.q, c = CAT[q.category] || {}, en = q.lang === "en";
    var html = '<div class="play-top"><span class="pill">' + modeLabel() + (q.idx ? " " + q.idx + "/10" : "") + "</span>" + catPill(q.category) + langPill(q.lang) +
      '<span class="pill ' + (q.qtype === "sa" ? "gold" : "") + '">' + (q.qtype === "sa" ? "✏️ 단답형 2점" : "✅ 객관식 1점") + (en ? " +1" : "") + "</span>" +
      '<span class="sp"></span><span class="small muted">이번 판 ' + play.sess.ok + "/" + play.sess.n + " · +" + play.sess.pts + "점</span></div>";
    html += '<div class="timer" id="tm"><i style="width:100%"></i></div>';
    html += '<div class="card qcard" style="border-top:5px solid ' + (c.color || "#888") + '">';
    html += '<div class="qtext ' + (en ? "en" : "") + '" ' + (en ? 'lang="en"' : "") + ">" + esc(q.question) + "</div>";
    html += '<div id="kohint">' + (play.hint ? '<div class="kohint">💬 ' + esc(play.hint) + "</div>" : "") + "</div>";
    if (q.qtype === "mc") {
      html += '<div class="choices" id="ch">' + play.order.map(function (oi, k) {
        var gone = play.removed.indexOf(oi + 1) >= 0;
        return '<button class="choice' + (gone ? " gone" : "") + '" data-i="' + (oi + 1) + '"' + (gone ? " disabled" : "") + ' lang="' + (en ? "en" : "ko") + '"><span class="no">' + (k + 1) + "</span><span>" + esc(q.choices[oi]) + "</span></button>";
      }).join("") + "</div>";
    } else {
      html += '<form class="sa" id="saF"><input id="saI" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="send" placeholder="' + (en ? "Type your answer" : "정답을 입력하세요") + '"><button class="btn navy">제출</button></form>';
    }
    html += '<div class="items" id="items">' +
      (q.qtype === "mc" ? '<button class="btn sm" id="i50"' + (play.removed.length || itemsLeft("fifty") <= 0 ? " disabled" : "") + ">✂️ 50:50 (" + itemsLeft("fifty") + ")</button>" : "") +
      (play.mode !== "daily" ? '<button class="btn sm" id="iSkip"' + (itemsLeft("skip") <= 0 ? " disabled" : "") + ">⏭️ 건너뛰기 (" + itemsLeft("skip") + ")</button>" : "") +
      (en && q.has_ko && !play.hint ? '<button class="btn sm" id="iKo">💬 한국어 보기 <span class="small muted">(보너스 −1)</span></button>' : "") +
      '<span class="sp" style="flex:1"></span><a class="btn sm" href="#/">그만하기</a></div>';
    html += '<div id="res"></div></div>';
    $("#main").innerHTML = html;

    if (q.qtype === "mc") $$("#ch .choice").forEach(function (b) { b.onclick = function () { submit(b.dataset.i, b); }; });
    else { $("#saF").onsubmit = function (ev) { ev.preventDefault(); submit($("#saI").value); }; setTimeout(function () { var i = $("#saI"); if (i) i.focus(); }, 50); }
    if ($("#i50")) $("#i50").onclick = useFifty;
    if ($("#iSkip")) $("#iSkip").onclick = useSkip;
    if ($("#iKo")) $("#iKo").onclick = useHint;
    tick(); timerT = setInterval(tick, 250);
  }
  function tick() {
    if (!play || play.res) return stopTimer();
    var left = Math.max(0, play.deadline - Date.now()), frac = left / (play.q.limit * 1000);
    var el = $("#tm"); if (!el) return stopTimer();
    el.firstChild.style.width = (frac * 100).toFixed(1) + "%";
    el.classList.toggle("low", left < 8000);
    if (left <= 0) { stopTimer(); submit("", null, true); }
  }
  function submit(given, btn, timeUp) {
    if (play.busy || play.res) return;
    if (!timeUp && play.q.qtype === "sa" && !String(given).trim()) { $("#saI").classList.add("shake"); setTimeout(function () { $("#saI").classList.remove("shake"); }, 400); return; }
    play.busy = true; stopTimer();
    $$("#ch .choice, #saF button, #saI, #items button").forEach(function (x) { x.disabled = true; });
    rpc("bu_answer", { p_given: String(given) }).then(function (r) {
      play.busy = false; play.res = r; play.given = given;
      play.sess.n++; if (r.ok) play.sess.ok++; play.sess.pts += r.points || 0;
      showResult(r, timeUp);
    }).catch(function (e) {
      play.busy = false;
      toast(errMsg(e));
      setTimeout(nextQ, 800);
    });
  }
  function showResult(r, timeUp) {
    if (r.gone) { toast("이 문제는 지워졌어요. 다음 문제로 갈게요."); return nextQ(); }
    var en = r.lang === "en", h = "";
    if (r.qtype === "mc") {
      $$("#ch .choice").forEach(function (b) {
        if (b.dataset.i === String(r.answer)) b.classList.add("right");
        else if (b.dataset.i === String(play.given)) b.classList.add("wrong");
      });
    }
    var ansText = r.qtype === "mc" ? (r.choices || [])[+r.answer - 1] : String(r.answer || "").split("|").join(" / ");
    h += '<div class="result ' + (r.ok ? "ok" : "no") + '">';
    h += r.ok ? '<h3>⭕ 정답! <span class="pop">+' + r.points + "점</span></h3>" : "<h3>" + (timeUp || r.timeout ? "⏰ 시간이 끝났어요" : "❌ 아쉬워요!") + "</h3>";
    if (!r.ok || r.qtype === "sa") h += "<p>정답: <b>" + esc(ansText) + "</b>" + (r.qtype === "sa" && !r.ok && play.given ? ' <span class="small muted">(내 답: ' + esc(play.given) + ")</span>" : "") + "</p>";
    if (r.explain) h += "<p>💡 " + esc(r.explain) + "</p>";
    if (en && r.ko) h += '<p class="small">💬 ' + esc(r.ko) + "</p>";
    if (r.mode === "daily" && r.d10len >= 10) h += "<p>🎉 오늘의 10문제 완주! <b>+3점</b> 보너스가 들어 있어요.</p>";
    h += '<div class="row-btns"><button class="btn navy big" id="nx">' + (r.mode === "daily" && r.d10len >= 10 ? "결과 보기 ▶" : "다음 문제 ▶") + '</button><a class="btn" href="#/">홈으로</a></div></div>';
    $("#res").innerHTML = h;
    $("#items").classList.add("hidden");
    var top = $(".play-top .small"); if (top) top.textContent = "이번 판 " + play.sess.ok + "/" + play.sess.n + " · +" + play.sess.pts + "점";
    $("#nx").onclick = r.mode === "daily" && r.d10len >= 10 ? function () { loadMine().then(viewDailyDone); } : nextQ;
    $("#nx").focus();
    // 내 기록(홈 화면용)은 조용히 새로 불러와요
    loadMine().then(function () { if (r.new_badge) showBadge(r.new_badge); }).catch(function () {});
  }
  function showBadge(id) {
    var c = CAT[id]; if (!c) return;
    var o = overlay('<div class="big pop">' + c.bicon + "</div><h2>새 배지: " + esc(c.badge) + "!</h2><p>" + c.icon + " " + esc(c.name) + " 분야를 10번 맞혔어요. 대단해요!</p>" +
      '<div class="row-btns" style="justify-content:center"><button class="btn navy" id="ok">좋아요!</button></div>');
    $("#ok", o).onclick = closeOverlay;
  }
  function useFifty() {
    rpc("bu_fifty").then(function (r) {
      play.removed = r.removed || [];
      if (state.profile) { var it = state.profile.items || {}; if (it.day !== kday()) it = { day: kday(), fifty: 0, skip: 0 }; it.fifty = (+it.fifty || 0) + 1; state.profile.items = it; }
      $$("#ch .choice").forEach(function (b) { if (play.removed.indexOf(+b.dataset.i) >= 0) { b.classList.add("gone"); b.disabled = true; } });
      $("#i50").disabled = true; $("#i50").textContent = "✂️ 50:50 (" + itemsLeft("fifty") + ")";
    }).catch(function (e) { toast(errMsg(e)); });
  }
  function useSkip() {
    rpc("bu_skip").then(function () {
      if (state.profile) { var it = state.profile.items || {}; if (it.day !== kday()) it = { day: kday(), fifty: 0, skip: 0 }; it.skip = (+it.skip || 0) + 1; state.profile.items = it; }
      nextQ();
    }).catch(function (e) { toast(errMsg(e)); });
  }
  function useHint() {
    rpc("bu_hint").then(function (r) {
      play.hint = r.ko;
      $("#kohint").innerHTML = '<div class="kohint">💬 ' + esc(r.ko) + "</div>";
      $("#iKo").remove();
    }).catch(function (e) { toast(errMsg(e)); });
  }
  function showCrown() {
    var owned = (state.profile && state.profile.badges) || [];
    var left = CATS.filter(function (c) { return owned.indexOf(c.id) < 0; });
    $("#main").innerHTML = '<div class="card center muted">👑</div>';
    var o = overlay('<div class="big pop">👑</div><h2>왕관 찬스!</h2><p>축하해요! 문제 없이 <b>배지 하나</b>를 바로 가질 수 있어요.<br>갖고 싶은 분야를 골라 보세요.</p>' +
      '<div class="crown-grid">' + left.map(function (c) { return '<button data-c="' + c.id + '"><span class="ic">' + c.bicon + "</span>" + esc(c.badge) + '<br><span class="small muted">' + c.icon + " " + esc(c.short) + "</span></button>"; }).join("") + "</div>");
    $$(".crown-grid button", o).forEach(function (b) {
      b.onclick = function () {
        rpc("bu_claim_crown", { p_cat: b.dataset.c }).then(function () { return loadMine(); }).then(function () {
          var c = CAT[b.dataset.c];
          o.innerHTML = '<div class="modal"><div class="big pop">' + c.bicon + "</div><h2>" + esc(c.badge) + ' 배지를 받았어요!</h2><div class="row-btns" style="justify-content:center"><button class="btn navy" id="ok">계속 풀기 ▶</button></div></div>';
          $("#ok", o).onclick = function () { closeOverlay(); nextQ(); };
        }).catch(function (e) { toast(errMsg(e)); closeOverlay(); nextQ(); });
      };
    });
  }
  function viewDailyDone() {
    var d10 = my().today.d10 || [], okN = d10.filter(function (x) { return x === 1; }).length;
    $("#main").innerHTML = '<div class="card center"><div style="font-size:56px">' + (okN === 10 ? "👑" : okN >= 7 ? "🏆" : "📅") + "</div><h2>오늘의 10문제 " + okN + " / 10</h2>" +
      '<div class="dots" style="justify-content:center">' + d10.map(function (x) { return "<i class='" + (x === 1 ? "o" : "x") + "'></i>"; }).join("") + "</div>" +
      '<p class="muted">' + (okN === 10 ? "만점이에요! 오늘의 상식 퀸!" : "내일 또 새로운 10문제가 나와요.") + "</p>" +
      '<div class="row-btns" style="justify-content:center"><button class="btn gold" id="share">📋 결과 복사</button><a class="btn navy" href="#/play/any">🎲 랜덤 문제 더 풀기</a><a class="btn" href="#/">홈으로</a></div></div>';
    $("#share").onclick = function () { shareDaily(d10); };
  }

  // ======================================================================
  //  순위
  // ======================================================================
  function className(g, c) { return g && c ? g + "-" + c : "-"; }
  function viewBoard() {
    var tabs = [["week", "⭐ 이번 주"], ["all", "🏆 전체"], ["acc", "🎯 정답률"], ["class", "🏫 반 대항전"]];
    $("#main").innerHTML = '<div class="tabs" id="btabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.boardTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + '</div><div id="board" class="card"><p class="muted">불러오는 중…</p></div>';
    $$("#btabs button").forEach(function (b) { b.onclick = function () { state.boardTab = b.dataset.t; viewBoard(); }; });
    var tab = state.boardTab;
    rpc("bu_board", { p_scope: tab }).then(function (rows) {
      var desc = { week: "이번 주(월요일부터) 점수 순위예요. 월요일마다 새로 시작해요!", all: "지금까지 모은 점수 순위예요.", acc: "20문제 이상 푼 사람만 들어가요. 정답률이 같으면 많이 푼 사람이 먼저예요.", class: "이번 주 반 점수 ÷ 반 학생 수 = 1인당 평균 점수로 겨뤄요. 반 친구들이 많이 참여할수록 유리해요!" }[tab];
      var h = '<p class="small muted" style="margin-top:0">' + desc + "</p>";
      if (!rows.length) { $("#board").innerHTML = h + '<p class="center muted">아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!</p>'; return; }
      var medal = function (r) { return r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : r; };
      if (tab === "class") {
        h += '<div class="tbl-wrap"><table><tr><th>순위</th><th>반</th><th class="num">1인당 평균</th><th class="num">참여</th><th class="num">반 점수</th><th class="num">정답률</th></tr>' +
          rows.map(function (r) { return "<tr><td class='medal'>" + medal(r.rank) + "</td><td><b>" + className(r.grade, r.class_no) + "</b></td><td class='num'><b>" + r.avg_pts + "</b>점</td><td class='num'>" + r.players + "/" + r.size + "명</td><td class='num'>" + num(r.pts) + "</td><td class='num'>" + pct(r.ok, r.n) + "%</td></tr>"; }).join("") + "</table></div>";
      } else {
        h += '<div class="tbl-wrap"><table><tr><th>순위</th><th>닉네임</th>' + (state.admin ? "<th>이름</th>" : "") + '<th>반</th><th class="num">' + (tab === "acc" ? "정답률" : "점수") + '</th><th class="num">' + (tab === "acc" ? "점수" : "정답률") + '</th><th class="num">푼 문제</th><th class="num">🏅</th></tr>' +
          rows.map(function (r) {
            return "<tr class='" + (r.me ? "me" : "") + "'><td class='medal'>" + medal(r.rank) + "</td><td>" + esc(r.nickname) + (r.me ? " (나)" : "") + "</td>" + (state.admin ? "<td>" + esc(r.name || r.email || "") + "</td>" : "") +
              "<td>" + className(r.grade, r.class_no) + "</td><td class='num'><b>" + (tab === "acc" ? r.acc + "%" : num(r.pts)) + "</b></td><td class='num'>" + (tab === "acc" ? num(r.pts) : r.acc + "%") + "</td><td class='num'>" + num(r.n) + "</td><td class='num'>" + r.badges + "</td></tr>";
          }).join("") + "</table></div>";
      }
      $("#board").innerHTML = h;
    }).catch(function (e) { $("#board").innerHTML = '<p class="err">' + esc(errMsg(e)) + "</p>"; });
  }

  // ======================================================================
  //  내 기록
  // ======================================================================
  function viewMe() {
    var m = my(), t = m.total, p = state.profile;
    var h = '<div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0;flex:1">📊 ' + esc(p.nickname) + "님의 기록</h2><a class='btn sm' href='#/nick'>✏️ 닉네임 바꾸기</a></div>" +
      '<div class="kpis" style="margin-top:12px">' +
      kpi(num(t.pts) + "점", "모은 점수") + kpi(num(t.n), "푼 문제") + kpi(pct(t.ok, t.n) + "%", "정답률") +
      kpi("🔥 " + m.streak.cur + "일", "연속 도전 (최고 " + m.streak.best + "일)") + kpi(pct(t.mc_ok, t.mc_n) + "%", "객관식 " + t.mc_ok + "/" + t.mc_n) +
      kpi(pct(t.sa_ok, t.sa_n) + "%", "단답형 " + t.sa_ok + "/" + t.sa_n) + kpi(pct(t.en_ok, t.en_n) + "%", "🌏 영어 " + t.en_ok + "/" + t.en_n) + "</div></div>";

    h += '<div class="card"><h2>📚 분야별 정답률</h2><div class="bars">' + CATS.map(function (c) {
      var a = t.cats[c.id] || [0, 0], pr = pct(a[1], a[0]);
      return '<div class="bar"><span>' + c.icon + " " + esc(c.short) + '</span><span class="tr"><i style="width:' + pr + "%;background:" + c.color + '"></i></span><span class="small">' + (a[0] ? pr + "% (" + a[1] + "/" + a[0] + ")" : "-") + "</span></div>";
    }).join("") + "</div></div>";

    var days = []; for (var i = 13; i >= 0; i--) days.push(addDays(kday(), -i));
    var byDay = {}; m.rows.forEach(function (r) { byDay[r.day] = r; });
    var mx = Math.max.apply(null, days.map(function (d) { return (byDay[d] || {}).n || 0; }).concat([1]));
    h += '<div class="card"><h2>📅 최근 2주</h2><div class="days">' + days.map(function (d) {
      var r = byDay[d] || { n: 0 };
      return '<div title="' + d + " · " + r.n + '문제"><span>' + (r.n || "") + '</span><i style="height:' + Math.round(70 * r.n / mx) + 'px"></i><span>' + d.slice(8) + "</span></div>";
    }).join("") + "</div></div>";

    h += '<div class="card"><h2>🏅 분야 배지</h2>' + badgeGrid(t) + "</div>";
    h += '<div class="card"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><h2 style="margin:0;flex:1">📝 오답 노트</h2>' + (state.wrongN ? '<a class="btn navy sm" href="#/review">▶ 오답 다시 풀기</a>' : "") + '</div><div id="wrong" style="margin-top:10px"><p class="muted">불러오는 중…</p></div></div>';
    $("#main").innerHTML = h;
    rpc("bu_wrong_list").then(function (list) {
      if (!list.length) { $("#wrong").innerHTML = '<p class="muted">틀린 문제가 없어요. 🎉</p>'; return; }
      $("#wrong").innerHTML = list.map(function (w) {
        var ans = w.qtype === "mc" ? (w.choices || [])[+w.answer - 1] : String(w.answer).split("|").join(" / ");
        return '<details class="wrong-item"><summary>' + (CAT[w.category] || {}).icon + " " + esc(w.question) + "</summary>" +
          "<p>정답: <b>" + esc(ans) + "</b></p>" + (w.explain ? "<p>💡 " + esc(w.explain) + "</p>" : "") + (w.lang === "en" && w.ko ? '<p class="small">💬 ' + esc(w.ko) + "</p>" : "") + "</details>";
      }).join("");
    }).catch(function (e) { $("#wrong").innerHTML = '<p class="err">' + esc(errMsg(e)) + "</p>"; });
  }
  function kpi(v, l) { return '<div class="kpi"><b>' + v + "</b><span>" + l + "</span></div>"; }

  // ======================================================================
  //  교사 화면
  // ======================================================================
  var T = { questions: null, qstats: null, roster: null, upload: null };
  function viewTeacher() {
    var tabs = [["upload", "📤 문제 올리기"], ["questions", "📚 문제 목록"], ["students", "👩‍🎓 학생 기록"], ["settings", "⚙️ 설정"]];
    $("#main").innerHTML = '<div class="tabs" id="ttabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.tTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + '</div><div id="tbody"></div>';
    $$("#ttabs button").forEach(function (b) { b.onclick = function () { state.tTab = b.dataset.t; lset("bu.tTab", state.tTab); viewTeacher(); }; });
    (({ upload: tUpload, questions: tQuestions, students: tStudents, settings: tSettings })[state.tTab] || tUpload)();
  }
  function loadQuestions(force) {
    if (T.questions && !force) return Promise.resolve(T.questions);
    return all(function () { return client().from("bu_questions").select("id,category,qtype,lang,question,choices,answer,explain,ko,grade,level,active,batch,created_at").order("id", { ascending: false }); })
      .then(function (q) { T.questions = q; return q; });
  }
  function loadXlsx() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = XLSX_URL; s.onload = function () { ok(window.XLSX); }; s.onerror = function () { no(new Error("엑셀 도구를 불러오지 못했어요")); }; document.head.appendChild(s); });
  }

  // ---------- 📤 문제 올리기 ----------
  function tUpload() {
    var po = lget("bu.promptOpt", { cat: "", count: 20, grade: "", enRatio: 0.3, saRatio: 0.3, topic: "" });
    var h = '<div class="card"><h2>1. 문제 만들기 (제미나이 · 챗지피티)</h2>' +
      '<p class="small muted">조건을 고르고 <b>프롬프트 복사</b>를 눌러 AI에게 붙여 넣으세요. AI가 만든 표를 그대로 복사해서 아래 <b>2번</b>에 붙여 넣으면 돼요. 엑셀 템플릿에 직접 써도 돼요.</p>' +
      '<div class="form"><div class="row">' +
      '<label>분야<select id="pCat"><option value="">8개 분야 골고루</option>' + CATS.map(function (c) { return '<option value="' + c.id + '"' + (po.cat === c.id ? " selected" : "") + ">" + c.icon + " " + c.name + "</option>"; }).join("") + "</select></label>" +
      '<label>개수<input id="pCnt" type="number" min="5" max="50" value="' + po.count + '"></label>' +
      '<label>학년<select id="pGr"><option value="">1~3학년</option><option' + (po.grade == 1 ? " selected" : "") + '>1</option><option' + (po.grade == 2 ? " selected" : "") + '>2</option><option' + (po.grade == 3 ? " selected" : "") + ">3</option></select></label>" +
      '<label>영어 문제 비율<select id="pEn">' + [0, 0.2, 0.3, 0.5, 1].map(function (v) { return '<option value="' + v + '"' + (+po.enRatio === v ? " selected" : "") + ">" + Math.round(v * 100) + "%</option>"; }).join("") + "</select></label>" +
      '<label>단답형 비율<select id="pSa">' + [0, 0.2, 0.3, 0.5, 1].map(function (v) { return '<option value="' + v + '"' + (+po.saRatio === v ? " selected" : "") + ">" + Math.round(v * 100) + "%</option>"; }).join("") + "</select></label>" +
      "</div>" +
      '<label>주제나 단원 (선택)<input id="pTopic" placeholder="예: 1학년 과학 · 물질의 상태 / 세계의 수도 / 올림픽" value="' + esc(po.topic || "") + '"></label></div>' +
      '<div class="row-btns"><button class="btn gold" id="pCopy">📋 프롬프트 복사</button><button class="btn" id="pShow">👀 프롬프트 보기</button><button class="btn" id="tpl">📥 엑셀 템플릿 받기</button></div>' +
      '<div id="pBox" class="prompt-box hidden" style="margin-top:10px"></div></div>';

    h += '<div class="card"><h2>2. 올리기</h2>' +
      '<div class="drop" id="drop"><p style="margin:0 0 8px">📄 엑셀(.xlsx)이나 CSV 파일을 여기에 끌어 놓거나</p><label class="btn navy"><input type="file" id="file" accept=".xlsx,.xls,.csv" hidden>파일 고르기</label></div>' +
      '<div class="form" style="margin-top:12px"><label>또는 AI가 만든 표를 그대로 붙여 넣기<textarea id="paste" placeholder="| 분야 | 형식 | 언어 | 문제 | 보기1 | ... 표를 통째로 복사해서 붙여 넣으세요"></textarea></label></div>' +
      '<div class="row-btns"><button class="btn navy" id="check">🔍 검사하기</button></div></div>';
    h += '<div id="preview"></div>';
    $("#tbody").innerHTML = h;

    function opts() {
      var o = { cat: $("#pCat").value, count: +$("#pCnt").value || 20, grade: $("#pGr").value, enRatio: +$("#pEn").value, saRatio: +$("#pSa").value, topic: $("#pTopic").value.trim() };
      lset("bu.promptOpt", o); return o;
    }
    $("#pCopy").onclick = function () { var t = BU.buildPrompt(opts()); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast("프롬프트를 복사했어요. AI에게 붙여 넣으세요!"); }, function () { $("#pBox").textContent = t; $("#pBox").classList.remove("hidden"); }); };
    $("#pShow").onclick = function () { $("#pBox").textContent = BU.buildPrompt(opts()); $("#pBox").classList.toggle("hidden"); };
    $("#tpl").onclick = function () {
      loadXlsx().then(function (X) {
        var wb = X.utils.book_new();
        var ws = X.utils.aoa_to_sheet([BU.HEADERS].concat(BU.EXAMPLES));
        ws["!cols"] = [10, 8, 8, 46, 12, 12, 12, 12, 14, 30, 30, 6, 6].map(function (w) { return { wch: w }; });
        X.utils.book_append_sheet(wb, ws, "문제");
        var g = X.utils.aoa_to_sheet(BU.GUIDE); g["!cols"] = [{ wch: 12 }, { wch: 90 }];
        X.utils.book_append_sheet(wb, g, "쓰는 법");
        X.writeFile(wb, "MY_Brain_Up_문제_템플릿.xlsx");
      }).catch(function (e) { toast(e.message); });
    };
    var drop = $("#drop");
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add("over"); };
    drop.ondragleave = function () { drop.classList.remove("over"); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove("over"); if (e.dataTransfer.files[0]) readFile(e.dataTransfer.files[0]); };
    $("#file").onchange = function () { if (this.files[0]) readFile(this.files[0]); };
    $("#check").onclick = function () {
      var t = $("#paste").value;
      if (!t.trim()) return toast("붙여 넣은 표가 없어요.");
      checkRows(BU.aoaToRows(BU.textToAoa(t)), "붙여넣기");
    };
    if (T.upload) renderPreview();
  }
  function readFile(f) {
    var name = f.name.replace(/\.[^.]+$/, "");
    if (/\.csv$/i.test(f.name)) { f.text().then(function (t) { checkRows(BU.aoaToRows(BU.textToAoa(t)), name); }); return; }
    loadXlsx().then(function (X) {
      return f.arrayBuffer().then(function (buf) {
        var wb = X.read(buf, { type: "array" });
        var sh = wb.Sheets[wb.SheetNames.indexOf("문제") >= 0 ? "문제" : wb.SheetNames[0]];
        checkRows(BU.aoaToRows(X.utils.sheet_to_json(sh, { header: 1, raw: false, defval: "" })), name);
      });
    }).catch(function (e) { toast("파일을 읽지 못했어요: " + e.message); });
  }
  function checkRows(rows, batch) {
    if (!rows.length) return toast("문제를 찾지 못했어요. 첫 줄에 '분야 | 형식 | ... | 문제' 머리글이 있는지 확인해 주세요.");
    $("#preview").innerHTML = '<div class="card muted">검사하는 중…</div>';
    loadQuestions(true).then(function (qs) {
      var ex = new Set(qs.map(function (q) { return BU.norm(q.question); }));
      T.upload = { rows: BU.validate(rows, ex), batch: batch + " · " + kday().slice(5) };
      renderPreview();
    }).catch(function (e) { $("#preview").innerHTML = '<div class="card err">' + esc(errMsg(e)) + "</div>"; });
  }
  function renderPreview() {
    var U = T.upload, rows = U.rows;
    var bad = rows.filter(function (r) { return r.errors.length; }).length, warn = rows.filter(function (r) { return !r.errors.length && r.warns.length; }).length, good = rows.length - bad;
    var h = '<div class="card"><h2>3. 검사 결과</h2><p><span class="pill ok">✅ 올릴 수 있음 ' + good + '</span> <span class="pill gold">⚠️ 그중 확인 필요 ' + warn + '</span> <span class="pill bad">❌ 고쳐야 함 ' + bad + "</span></p>" +
      '<p class="small muted">❌ 줄은 올라가지 않아요. 파일을 고쳐서 다시 올리면 돼요. ⚠️ 줄은 올라가지만 한 번 읽어 봐 주세요.</p>' +
      '<div class="form"><div class="row"><label>묶음 이름 (나중에 한꺼번에 지울 때 써요)<input id="batch" value="' + esc(U.batch) + '"></label><button class="btn navy" id="up"' + (good ? "" : " disabled") + ">📤 " + good + "문제 올리기</button></div></div>" +
      '<div class="tbl-wrap" style="margin-top:10px"><table><tr><th>줄</th><th>상태</th><th>분야</th><th>형식</th><th>문제 · 보기 · 정답</th><th>해설 · 번역</th></tr>' +
      rows.map(function (r) {
        var st = r.errors.length ? '<span class="st-err">❌ ' + r.errors.map(esc).join("<br>❌ ") + "</span>" : r.warns.length ? '<span class="st-warn">⚠️ ' + r.warns.map(esc).join("<br>⚠️ ") + "</span>" : '<span class="st-ok">✅</span>';
        var body = esc(r.question || "");
        if (r.qtype === "mc" && r.choices) body += '<div class="sub">' + r.choices.map(function (c, i) { return (String(i + 1) === r.answer ? "<b style='color:var(--ok)'>" : "") + (i + 1) + ") " + esc(c) + (String(i + 1) === r.answer ? " ✔</b>" : ""); }).join(" · ") + "</div>";
        else body += '<div class="sub">정답: <b>' + esc(String(r.answer || "").split("|").join(" / ")) + "</b></div>";
        return "<tr class='" + (r.errors.length ? "err-row" : "") + "'><td>" + r.line + "</td><td class='small'>" + st + "</td><td>" + (r.category ? catPill(r.category) : "-") + "</td><td class='small'>" + (r.qtype === "sa" ? "단답형" : "객관식") + (r.lang === "en" ? "<br>🌏 영어" : "") + "</td><td class='q'>" + body + "</td><td class='small'>" + esc(r.explain || "") + (r.ko ? "<div class='sub'>💬 " + esc(r.ko) + "</div>" : "") + "</td></tr>";
      }).join("") + "</table></div></div>";
    $("#preview").innerHTML = h;
    $("#up").onclick = function () {
      var ok = rows.filter(function (r) { return !r.errors.length; }), batch = $("#batch").value.trim() || U.batch;
      var data = ok.map(function (r) { return { category: r.category, qtype: r.qtype, lang: r.lang, question: r.question, choices: r.choices, answer: r.answer, explain: r.explain, ko: r.ko, grade: r.grade, level: r.level, batch: batch }; });
      $("#up").disabled = true; $("#up").textContent = "올리는 중…";
      var chunks = []; for (var i = 0; i < data.length; i += 200) chunks.push(data.slice(i, i + 200));
      chunks.reduce(function (p, c) { return p.then(function () { return sel(client().from("bu_questions").insert(c)); }); }, Promise.resolve())
        .then(function () { toast("✅ " + data.length + "문제를 올렸어요!"); T.upload = null; T.questions = null; state.tTab = "questions"; lset("bu.tTab", "questions"); viewTeacher(); })
        .catch(function (e) { toast("올리지 못했어요: " + errMsg(e)); $("#up").disabled = false; $("#up").textContent = "📤 다시 올리기"; });
    };
  }

  // ---------- 📚 문제 목록 ----------
  var QF = { cat: "", lang: "", qtype: "", batch: "", q: "", act: "" };
  function tQuestions() {
    $("#tbody").innerHTML = '<div class="card muted">불러오는 중…</div>';
    Promise.all([loadQuestions(false), rpc("bu_qstats")]).then(function (r) {
      T.qstats = r[1] || {};
      renderQList();
    }).catch(function (e) { $("#tbody").innerHTML = '<div class="card err">' + esc(errMsg(e)) + "</div>"; });
  }
  function renderQList() {
    var qs = T.questions, st = T.qstats;
    var batches = []; qs.forEach(function (q) { if (q.batch && batches.indexOf(q.batch) < 0) batches.push(q.batch); });
    var f = qs.filter(function (q) {
      return (!QF.cat || q.category === QF.cat) && (!QF.lang || q.lang === QF.lang) && (!QF.qtype || q.qtype === QF.qtype) && (!QF.batch || q.batch === QF.batch) &&
        (!QF.act || String(q.active) === QF.act) && (!QF.q || (q.question + " " + (q.choices || []).join(" ") + " " + q.answer).toLowerCase().indexOf(QF.q.toLowerCase()) >= 0);
    });
    var cnt = {}; qs.forEach(function (q) { if (q.active) cnt[q.category] = (cnt[q.category] || 0) + 1; });
    var h = '<div class="card"><h2>📚 문제 ' + qs.length + '개 <span class="small muted">(켜진 문제 ' + qs.filter(function (q) { return q.active; }).length + "개 · 영어 " + qs.filter(function (q) { return q.lang === "en" && q.active; }).length + "개)</span></h2>" +
      '<div class="dots">' + CATS.map(function (c) { return '<span class="pill" style="background:' + c.color + '1a;color:' + c.color + '">' + c.icon + " " + c.short + " " + (cnt[c.id] || 0) + "</span>"; }).join("") + "</div>" +
      '<div class="filters">' +
      '<select class="fsel" id="fCat"><option value="">모든 분야</option>' + CATS.map(function (c) { return '<option value="' + c.id + '"' + (QF.cat === c.id ? " selected" : "") + ">" + c.icon + " " + c.name + "</option>"; }).join("") + "</select>" +
      '<select class="fsel" id="fType"><option value="">모든 형식</option><option value="mc"' + (QF.qtype === "mc" ? " selected" : "") + '>객관식</option><option value="sa"' + (QF.qtype === "sa" ? " selected" : "") + ">단답형</option></select>" +
      '<select class="fsel" id="fLang"><option value="">모든 언어</option><option value="ko"' + (QF.lang === "ko" ? " selected" : "") + '>한국어</option><option value="en"' + (QF.lang === "en" ? " selected" : "") + ">영어</option></select>" +
      '<select class="fsel" id="fAct"><option value="">켜짐+꺼짐</option><option value="true"' + (QF.act === "true" ? " selected" : "") + '>켜진 문제</option><option value="false"' + (QF.act === "false" ? " selected" : "") + ">꺼진 문제</option></select>" +
      '<select class="fsel" id="fBatch"><option value="">모든 묶음</option>' + batches.map(function (b) { return '<option' + (QF.batch === b ? " selected" : "") + ">" + esc(b) + "</option>"; }).join("") + "</select>" +
      '<input class="fsel" id="fQ" placeholder="🔍 검색" value="' + esc(QF.q) + '">' + "</div>" +
      (QF.batch ? '<div class="row-btns" style="margin-top:0;margin-bottom:10px"><button class="btn red sm" id="delBatch">🗑️ 이 묶음 ' + f.length + "문제 모두 지우기</button></div>" : "") +
      '<div class="tbl-wrap"><table><tr><th>분야</th><th>문제 · 정답</th><th class="num">푼 학생</th><th class="num">정답률</th><th>켜기</th><th></th></tr>' +
      f.slice(0, 300).map(function (q) {
        var s = st[q.id] || [0, 0, 0], ans = q.qtype === "mc" ? (q.choices || [])[+q.answer - 1] : String(q.answer).split("|").join(" / ");
        return "<tr><td>" + catPill(q.category) + '<div class="sub">' + (q.qtype === "sa" ? "단답형" : "객관식") + (q.lang === "en" ? " · 🌏" : "") + (q.grade ? " · " + q.grade + "학년" : "") + "</div></td>" +
          "<td class='q'>" + esc(q.question) + '<div class="sub">정답: <b>' + esc(ans) + "</b>" + (q.explain ? " · 💡 " + esc(q.explain) : "") + "</div>" + (q.ko ? '<div class="sub">💬 ' + esc(q.ko) + "</div>" : "") + '<div class="sub">' + esc(q.batch || "") + "</div></td>" +
          "<td class='num'>" + s[0] + "</td><td class='num'>" + (s[1] ? pct(s[2], s[1]) + "%" : "-") + "</td>" +
          '<td><label class="switch"><input type="checkbox" data-act="' + q.id + '"' + (q.active ? " checked" : "") + "><span></span></label></td>" +
          '<td><button class="btn sm" data-del="' + q.id + '">🗑️</button></td></tr>';
      }).join("") + "</table></div>" + (f.length > 300 ? '<p class="small muted">처음 300개만 보여요. 검색이나 필터로 좁혀 보세요.</p>' : "") +
      '<p class="small muted">정답률이 아주 낮거나(20% 미만) 아주 높은(95% 이상) 문제는 정답이나 보기를 한 번 확인해 보세요. 고칠 문제는 끄거나 지운 뒤 다시 올리면 돼요.</p></div>';
    $("#tbody").innerHTML = h;
    var re = function () { QF.cat = $("#fCat").value; QF.qtype = $("#fType").value; QF.lang = $("#fLang").value; QF.act = $("#fAct").value; QF.batch = $("#fBatch").value; QF.q = $("#fQ").value.trim(); renderQList(); };
    ["#fCat", "#fType", "#fLang", "#fAct", "#fBatch"].forEach(function (s) { $(s).onchange = re; });
    $("#fQ").onkeydown = function (e) { if (e.key === "Enter") re(); };
    $("#fQ").onblur = function () { if ($("#fQ").value.trim() !== QF.q) re(); };
    $$("[data-act]").forEach(function (c) {
      c.onchange = function () {
        var id = +c.dataset.act, v = c.checked;
        sel(client().from("bu_questions").update({ active: v }).eq("id", id)).then(function () { T.questions.forEach(function (q) { if (q.id === id) q.active = v; }); toast(v ? "문제를 켰어요" : "문제를 껐어요 (학생에게 안 나와요)"); })
          .catch(function (e) { toast(errMsg(e)); c.checked = !v; });
      };
    });
    $$("[data-del]").forEach(function (b) {
      b.onclick = function () {
        var id = +b.dataset.del;
        if (!confirm("이 문제를 지울까요? 학생들의 이 문제 기록(오답 노트)도 같이 지워져요.")) return;
        sel(client().from("bu_questions").delete().eq("id", id)).then(function () { T.questions = T.questions.filter(function (q) { return q.id !== id; }); renderQList(); toast("지웠어요"); }).catch(function (e) { toast(errMsg(e)); });
      };
    });
    if ($("#delBatch")) $("#delBatch").onclick = function () {
      if (!confirm("'" + QF.batch + "' 묶음의 " + f.length + "문제를 모두 지울까요? 되돌릴 수 없어요.")) return;
      sel(client().from("bu_questions").delete().eq("batch", QF.batch)).then(function () { T.questions = T.questions.filter(function (q) { return q.batch !== QF.batch; }); QF.batch = ""; renderQList(); toast("묶음을 지웠어요"); }).catch(function (e) { toast(errMsg(e)); });
    };
  }

  // ---------- 👩‍🎓 학생 기록 ----------
  var SF = { period: "week", cls: "", from: "", to: "" };
  function tStudents() {
    $("#tbody").innerHTML = '<div class="card muted">불러오는 중…</div>';
    Promise.all([
      all(function () { return client().from("bu_daily").select("email,day,n,ok,pts,mc_n,mc_ok,sa_n,sa_ok,en_n,en_ok,cats,d10"); }),
      all(function () { return client().from("bu_profile").select("email,nickname,badges"); }),
      T.roster ? Promise.resolve(T.roster) : sel(client().from("roster").select("email,name,grade,class_no,student_no").range(0, 4999))
    ]).then(function (r) { T.daily = r[0]; T.profiles = r[1]; T.roster = r[2]; renderStudents(); })
      .catch(function (e) { $("#tbody").innerHTML = '<div class="card err">' + esc(errMsg(e)) + "</div>"; });
  }
  function periodRange() {
    var t = kday();
    if (SF.period === "today") return [t, t];
    if (SF.period === "week") return [weekStart(), t];
    if (SF.period === "month") return [t.slice(0, 8) + "01", t];
    if (SF.period === "custom") return [SF.from || "2000-01-01", SF.to || t];
    return ["2000-01-01", "2999-12-31"];
  }
  function studentRows() {
    var rg = periodRange(), byE = {};
    var ros = {}; T.roster.forEach(function (x) { ros[low(x.email)] = x; });
    var prof = {}; T.profiles.forEach(function (x) { prof[low(x.email)] = x; });
    T.daily.forEach(function (d) { var e = low(d.email); (byE[e] = byE[e] || []).push(d); });
    var emails = Object.keys(Object.assign({}, byE, prof));
    if (SF.cls) emails = Object.keys(Object.assign({}, ros, byE)).filter(function (e) { var x = ros[e]; return x && x.grade + "-" + x.class_no === SF.cls; });
    return emails.map(function (e) {
      var rows = byE[e] || [], inP = rows.filter(function (d) { return d.day >= rg[0] && d.day <= rg[1]; }), s = sumRows(inP), all_ = sumRows(rows), x = ros[e] || {}, p = prof[e] || {};
      return { email: e, name: x.name || "", grade: x.grade, cls: x.class_no, no: x.student_no, nick: p.nickname || "", badges: (p.badges || []).length,
        s: s, all: all_, streak: streakOf(rows.filter(function (d) { return d.n > 0; }).map(function (d) { return d.day; })),
        last: rows.reduce(function (m, d) { return d.day > m ? d.day : m; }, ""), d10: inP.filter(function (d) { return (d.d10 || []).length >= 10; }).length };
    }).sort(function (a, b) { return (a.grade || 9) - (b.grade || 9) || (a.cls || 99) - (b.cls || 99) || (a.no || 999) - (b.no || 999) || b.s.pts - a.s.pts; });
  }
  function renderStudents() {
    var classes = []; T.roster.forEach(function (x) { var k = x.grade + "-" + x.class_no; if (x.grade && classes.indexOf(k) < 0) classes.push(k); });
    classes.sort(function (a, b) { var p = a.split("-"), q = b.split("-"); return p[0] - q[0] || p[1] - q[1]; });
    var rows = studentRows(), active = rows.filter(function (r) { return r.s.n > 0; });
    var tot = sumRows(active.map(function (r) { return r.s; }).map(function (s) { return Object.assign({}, s, { cats: {} }); }));
    var h = '<div class="card"><h2>👩‍🎓 학생 기록</h2><div class="filters">' +
      '<select class="fsel" id="sP">' + [["today", "오늘"], ["week", "이번 주"], ["month", "이번 달"], ["all", "전체"], ["custom", "기간 선택"]].map(function (p) { return '<option value="' + p[0] + '"' + (SF.period === p[0] ? " selected" : "") + ">" + p[1] + "</option>"; }).join("") + "</select>" +
      (SF.period === "custom" ? '<input type="date" class="fsel" id="sF" value="' + SF.from + '"><input type="date" class="fsel" id="sT" value="' + SF.to + '">' : "") +
      '<select class="fsel" id="sC"><option value="">참여한 학생 모두</option>' + classes.map(function (c) { return '<option' + (SF.cls === c ? " selected" : "") + ">" + c + "</option>"; }).join("") + "</select>" +
      '<button class="btn sm" id="csv">📥 CSV 받기</button></div>' +
      '<div class="kpis">' + kpi(active.length + "명", "참여 학생") + kpi(num(tot.n), "푼 문제") + kpi(pct(tot.ok, tot.n) + "%", "정답률") + kpi(pct(tot.en_ok, tot.en_n) + "%", "🌏 영어 정답률 (" + num(tot.en_n) + ")") + "</div>" +
      '<div class="tbl-wrap" style="margin-top:12px"><table><tr><th>반</th><th>번호</th><th>이름</th><th>닉네임</th><th class="num">점수</th><th class="num">푼 문제</th><th class="num">정답률</th><th class="num">단답형</th><th class="num">영어</th><th class="num">10문제 완주</th><th class="num">연속</th><th class="num">🏅</th><th>최근</th></tr>' +
      rows.map(function (r) {
        var s = r.s;
        return "<tr><td>" + className(r.grade, r.cls) + "</td><td>" + (r.no || "") + "</td><td>" + esc(r.name || r.email) + "</td><td>" + esc(r.nick) + "</td><td class='num'><b>" + num(s.pts) + "</b></td><td class='num'>" + num(s.n) + "</td><td class='num'>" + (s.n ? pct(s.ok, s.n) + "%" : "-") + "</td>" +
          "<td class='num'>" + (s.sa_n ? s.sa_ok + "/" + s.sa_n : "-") + "</td><td class='num'>" + (s.en_n ? s.en_ok + "/" + s.en_n : "-") + "</td><td class='num'>" + (r.d10 || "") + "</td><td class='num'>" + (r.streak.cur ? "🔥" + r.streak.cur : "") + "</td><td class='num'>" + r.badges + "</td><td class='small'>" + (r.last ? r.last.slice(5).replace("-", ".") : "") + "</td></tr>";
      }).join("") + "</table></div>" + (rows.length ? "" : '<p class="muted center">아직 기록이 없어요.</p>') + "</div>";

    // 분야별 정답률 (전체 학생)
    var cats = sumRows(T.daily.filter(function (d) { var rg = periodRange(); return d.day >= rg[0] && d.day <= rg[1]; })).cats;
    h += '<div class="card"><h2>📚 분야별 정답률 <span class="small muted">(이 기간, 전체 학생)</span></h2><div class="bars">' + CATS.map(function (c) {
      var a = cats[c.id] || [0, 0], pr = pct(a[1], a[0]);
      return '<div class="bar"><span>' + c.icon + " " + esc(c.short) + '</span><span class="tr"><i style="width:' + pr + "%;background:" + c.color + '"></i></span><span class="small">' + (a[0] ? pr + "% (" + num(a[0]) + ")" : "-") + "</span></div>";
    }).join("") + "</div></div>";
    $("#tbody").innerHTML = h;
    $("#sP").onchange = function () { SF.period = this.value; if (SF.period === "custom" && !SF.from) { SF.from = weekStart(); SF.to = kday(); } renderStudents(); };
    $("#sC").onchange = function () { SF.cls = this.value; renderStudents(); };
    if ($("#sF")) { $("#sF").onchange = function () { SF.from = this.value; renderStudents(); }; $("#sT").onchange = function () { SF.to = this.value; renderStudents(); }; }
    $("#csv").onclick = function () {
      var rg = periodRange();
      var head = ["반", "번호", "이름", "이메일", "닉네임", "점수", "푼 문제", "맞힌 문제", "정답률(%)", "객관식 정답", "객관식", "단답형 정답", "단답형", "영어 정답", "영어", "10문제 완주(일)", "연속 도전(일)", "최고 연속(일)", "배지", "최근 날짜", "누적 점수"];
      var lines = [head].concat(rows.map(function (r) { var s = r.s; return [className(r.grade, r.cls), r.no || "", r.name, r.email, r.nick, s.pts, s.n, s.ok, pct(s.ok, s.n), s.mc_ok, s.mc_n, s.sa_ok, s.sa_n, s.en_ok, s.en_n, r.d10, r.streak.cur, r.streak.best, r.badges, r.last, r.all.pts]; }));
      var csv = "﻿" + lines.map(function (l) { return l.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      a.download = "BrainUp_학생기록_" + (SF.period === "all" ? "전체" : rg[0] + "_" + rg[1]) + (SF.cls ? "_" + SF.cls : "") + ".csv"; a.click();
    };
  }

  // ---------- ⚙️ 설정 ----------
  function tSettings() {
    var s = state.settings, on = function (v) { return v === true || v === "true"; };
    var ratio = Math.round((+s.english_ratio || 0) * 100);
    var h = '<div class="card"><h2>⚙️ 설정</h2>' +
      sw("open", "퀴즈 열기", "끄면 학생들이 문제를 풀 수 없어요. (순위·기록은 볼 수 있어요)", on(s.open)) +
      '<div class="chk"><div><b>🌏 English Day (오늘만)</b><span class="small muted">켜면 오늘 하루 모든 랜덤 문제와 오늘의 10문제가 영어로 나와요. 내일이 되면 저절로 꺼져요.<br>오늘의 10문제를 이미 누가 풀기 시작했다면 그 10문제는 바뀌지 않아요.</span></div><label class="switch"><input type="checkbox" id="eday"' + (englishDay() ? " checked" : "") + "><span></span></label></div>" +
      '<div class="chk"><div><b>영어 문제 비율 <span id="erv">' + ratio + '%</span></b><span class="small muted">랜덤 문제 중 영어 문제가 나올 확률이에요. 영어 문제가 부족하면 한국어 문제로 채워요.</span><input type="range" id="er" min="0" max="100" step="10" value="' + ratio + '" style="width:100%;margin-top:6px"></div></div>' +
      sw("timer", "시간 제한", "객관식 30초, 단답형 45초 (영어 문제는 +10초). 끄면 10분까지 기다려요.", on(s.timer)) +
      sw("allow_external", "학교 밖 계정 허용", "켜면 @smy.ms.kr 이 아닌 구글 계정도 풀 수 있어요. (기본: 끔)", on(s.allow_external)) +
      '<div class="chk"><div><b>👑 왕관 찬스 확률 <span id="crv">' + Math.round((+s.crown_rate || 0) * 100) + '%</span></b><span class="small muted">랜덤 문제를 받을 때 이 확률로 왕관 찬스가 나와요. (한 사람당 하루 1번까지)</span><input type="range" id="cr" min="0" max="20" step="1" value="' + Math.round((+s.crown_rate || 0) * 100) + '" style="width:100%;margin-top:6px"></div></div>' +
      "</div>";
    h += '<div class="card"><h2>🧹 기록 정리</h2><p class="small muted">새 학기에 순위를 처음부터 다시 시작하고 싶을 때 써요. 문제는 지워지지 않아요.</p><div class="row-btns"><button class="btn red" id="reset">모든 학생 기록 지우기</button></div></div>';
    $("#tbody").innerHTML = h;
    $$("[data-sw]").forEach(function (c) { c.onchange = function () { setSetting(c.dataset.sw, c.checked); }; });
    $("#eday").onchange = function () { setSetting("english_day", this.checked ? kday() : ""); };
    $("#er").oninput = function () { $("#erv").textContent = this.value + "%"; };
    $("#er").onchange = function () { setSetting("english_ratio", +this.value / 100); };
    $("#cr").oninput = function () { $("#crv").textContent = this.value + "%"; };
    $("#cr").onchange = function () { setSetting("crown_rate", +this.value / 100); };
    $("#reset").onclick = function () {
      if (prompt("모든 학생의 점수·기록·오답 노트를 지워요. 되돌릴 수 없어요.\n계속하려면 '지우기'라고 입력하세요.") !== "지우기") return;
      Promise.all([sel(client().from("bu_daily").delete().gte("day", "2000-01-01")), sel(client().from("bu_qstate").delete().gte("qid", 0))])
        .then(function () { return sel(client().from("bu_profile").update({ badges: [], crown_day: null }).neq("email", "")); })
        .then(function () { toast("기록을 지웠어요"); return loadMine(); }).catch(function (e) { toast(errMsg(e)); });
    };
  }
  function sw(k, t, d, v) { return '<div class="chk"><div><b>' + t + '</b><span class="small muted">' + d + '</span></div><label class="switch"><input type="checkbox" data-sw="' + k + '"' + (v ? " checked" : "") + "><span></span></label></div>"; }
  function setSetting(k, v) {
    sel(client().from("bu_settings").upsert({ key: k, value: v })).then(function () { state.settings[k] = v; toast("저장했어요"); }).catch(function (e) { toast(errMsg(e)); });
  }

  // 키보드: 객관식 1~4, 다음 문제 Enter
  document.addEventListener("keydown", function (e) {
    if (!play || !$(".qcard")) return;
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (play.res && e.key === "Enter" && $("#nx")) { e.preventDefault(); $("#nx").click(); return; }
    if (!play.res && play.q && play.q.qtype === "mc" && /^[1-4]$/.test(e.key)) { var b = $$("#ch .choice")[+e.key - 1]; if (b && !b.disabled) b.click(); }
  });

  boot();
})();
