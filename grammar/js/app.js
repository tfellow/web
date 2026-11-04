/* MY Grammar 학생 화면 */
(function () {
  "use strict";
  var C = window.MG_CONFIG, api = MG.api, esc = MG.esc, $ = MG.$, $$ = MG.$$;
  var $app = $("#app");
  var S = { me: null, isAdmin: false, goal: 20, notice: "", topics: [], topicBy: {}, allQ: [], qBy: {}, prog: {}, stamps: {}, badges: {}, certs: [], run: null };
  var timer = null;

  /* ---------- 시작 ---------- */
  boot();
  async function boot() {
    try {
      var session = await api.session();
      if (!session) return renderLogin();
      var me = await api.me();
      if (!me.allowed) return renderBlocked(me.email);
      S.me = me.player; S.isAdmin = me.is_admin; S.goal = me.daily_goal; S.notice = me.notice;
      await loadAll();
      renderChrome();
      window.addEventListener("hashchange", route);
      route();
      if (!S.me.nickname) openProfile(true);
    } catch (e) { showError(e); }
  }
  async function loadAll() {
    var r = await Promise.all([api.topics(), api.questions(), api.myProgress(S.me.id), api.myStamps(S.me.id), api.myBadges(S.me.id), api.myCerts(S.me.id)]);
    S.topics = r[0]; S.topicBy = {}; S.topics.forEach(function (t) { S.topicBy[t.code] = t; });
    S.allQ = r[1].filter(function (q) { return S.topicBy[q.topic_code]; }); S.qBy = {}; S.allQ.forEach(function (q) { S.qBy[q.id] = q; });
    S.prog = {}; r[2].forEach(function (p) { S.prog[p.question_id] = p; });
    S.stamps = {}; r[3].forEach(function (s) { S.stamps[s.topic_code] = s; });
    S.badges = {}; r[4].forEach(function (b) { S.badges[b.code] = b; });
    S.certs = r[5];
  }
  function showError(e) {
    console.error(e);
    $app.innerHTML = '<div class="card"><h2>앗, 문제가 생겼어요</h2><p class="muted">' + esc(e.message || e) + '</p><button class="btn primary" onclick="location.reload()">다시 시도</button> <button class="btn ghost" id="so">로그아웃</button></div>';
    var so = $("#so"); if (so) so.onclick = MG.signOut;
  }

  /* ---------- 로그인 ---------- */
  function renderLogin(msg) {
    $("#shell").style.display = "block";
    $("#sidenav").innerHTML = ""; $("#bottomnav").innerHTML = "";
    $app.innerHTML = '<div class="card login">' + MG.mascot() +
      '<h1>MY Grammar</h1><p class="muted">' + esc(C.SCHOOL_NAME) + ' 영어 문법 학습실</p>' +
      "<p>개념을 배우고, 문제를 풀고, 스탬프와 레벨을 모아 <b>Grammar Queen</b>에 도전해요!</p>" +
      (MG.DEMO ? '<button class="btn primary" id="demo-in">🎮 체험 모드로 시작하기</button><p class="small muted mt">체험 모드: 로그인 없이 써 보는 연습판이에요. 기록은 이 기기에만 저장돼요.</p>'
        : '<div id="gbtn"></div><p class="small">학교 구글 계정(<b>@' + esc(C.SCHOOL_DOMAIN) + "</b>)으로 로그인하세요.</p>") +
      '<div class="err" id="lerr">' + esc(msg || "") + "</div>" +
      '<div class="row gap wrap" style="justify-content:center"><a class="btn sm" href="guide.html" target="_blank" rel="noopener">📘 사용 설명서</a>' +
      (MG.DEMO ? "" : '<a class="btn sm ghost" href="?demo=1">🎮 로그인 없이 체험하기</a>') + "</div>" +
      '<div class="features"><div><span class="em">📖</span><b>개념 + 예문</b><br><span class="muted">듣기까지 한 번에</span></div><div><span class="em">🔁</span><b>똑똑한 복습</b><br><span class="muted">잊을 때쯤 다시</span></div><div><span class="em">🏆</span><b>스탬프 · 레벨</b><br><span class="muted">인증서 자동 발급</span></div></div></div>';
    if (MG.DEMO) $("#demo-in").onclick = async function () { await api.signInDemo(); location.reload(); };
    else MG.renderGoogleButton($("#gbtn"), function (m) { $("#lerr").textContent = m; });
  }
  function renderBlocked(email) {
    $app.innerHTML = '<div class="card login">' + MG.mascot() + "<h2>학교 계정으로 로그인해 주세요</h2>" +
      "<p><b>" + esc(email) + "</b> 계정은 지금 사용할 수 없어요.<br>학교 계정(@" + esc(C.SCHOOL_DOMAIN) + ")으로 다시 로그인해 주세요.</p>" +
      '<button class="btn primary" id="so">다른 계정으로 로그인</button></div>';
    $("#so").onclick = MG.signOut;
  }

  /* ---------- 틀 ---------- */
  var NAV = [["#/", "🏠", "홈"], ["#/learn", "📖", "학습"], ["#/review", "🔁", "복습"], ["#/rank", "🏆", "순위"], ["#/me", "🙋", "나"]];
  function renderChrome() {
    var side = NAV.map(function (n) { return '<a href="' + n[0] + '" data-nav="' + n[0] + '"><span class="em">' + n[1] + "</span>" + n[2] + "</a>"; }).join("");
    $("#sidenav").innerHTML = side + '<div class="sep"></div><a href="guide.html" target="_blank" rel="noopener"><span class="em">📘</span>사용 설명서</a>' +
      (S.isAdmin ? '<a href="admin.html' + (MG.DEMO ? "?demo=1" : "") + '"><span class="em">👩‍🏫</span>교사 화면</a>' : "") +
      '<a href="#" id="so"><span class="em">🚪</span>로그아웃</a>';
    $("#bottomnav").innerHTML = side;
    $("#so").onclick = function (e) { e.preventDefault(); MG.signOut(); };
    if (MG.DEMO && !$(".demo-flag")) document.body.insertAdjacentHTML("beforeend", '<div class="demo-flag">체험 모드</div>');
    renderChips();
  }
  function renderChips() {
    var li = MG.levelInfo(S.me.xp);
    $("#chips").innerHTML = '<span class="chip fire" title="연속 학습">🔥 ' + (S.me.last_day === MG.kstDate() || S.me.last_day === MG.kstDate(Date.now() - 864e5) ? S.me.streak : 0) + "일</span>" +
      '<span class="chip lv">' + li.title.em + " Lv." + li.lv + "</span>" +
      '<span class="chip gold hide-sm">⭐ ' + S.me.xp + " XP</span>" +
      '<button class="avatar-btn" id="avbtn" title="내 정보">' + esc((S.me.nickname || "?").slice(0, 1)) + "</button>";
    $("#avbtn").onclick = function () { location.hash = "#/me"; };
  }
  function setNav(h) {
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-nav") === h); });
  }
  function route() {
    stopTimer();
    var h = location.hash || "#/", parts = h.slice(2).split("/");
    window.scrollTo(0, 0);
    $$(".overlay").forEach(function (o) { o.remove(); });
    var base = "#/" + (parts[0] || "");
    setNav(base === "#/topic" ? "#/learn" : base === "#/quiz" ? (parts[1] === "review" || parts[1] === "wrong" ? "#/review" : "#/learn") : base);
    if (S.run && base !== "#/quiz") S.run = null;
    switch (parts[0] || "") {
      case "": return renderHome();
      case "learn": return renderLearn(parseInt(parts[1], 10));
      case "topic": return renderTopic(decodeURIComponent(parts[1] || ""));
      case "review": return renderReview();
      case "rank": return renderRank(parts[1] || "week");
      case "me": return renderMe();
      case "quiz": return startQuiz(parts[1], decodeURIComponent(parts[2] || ""));
      default: renderHome();
    }
  }

  /* ---------- 계산 도우미 ---------- */
  function today() { return MG.kstDate(); }
  function todayCount() { return S.me.last_day === today() ? S.me.today_count : 0; }
  function topicStat(code) {
    var qs = S.allQ.filter(function (q) { return q.topic_code === code; });
    var solved = 0, tried = 0, r = 0, w = 0;
    qs.forEach(function (q) { var p = S.prog[q.id]; if (p) { tried++; if (p.right_n > 0) solved++; r += p.right_n; w += p.wrong_n; } });
    return { total: qs.length, solved: solved, tried: tried, acc: r + w ? Math.round((r / (r + w)) * 100) : null, attempts: r + w };
  }
  function dueList() {
    var now = Date.now();
    return Object.keys(S.prog).map(function (k) { return S.prog[k]; })
      .filter(function (p) { return S.qBy[p.question_id] && new Date(p.due_at).getTime() <= now; })
      .sort(function (a, b) { return a.box - b.box || new Date(a.due_at) - new Date(b.due_at); });
  }
  function wrongList() {
    return Object.keys(S.prog).map(function (k) { return S.prog[k]; })
      .filter(function (p) { return S.qBy[p.question_id] && p.wrong_n > 0 && p.box < 3; })
      .sort(function (a, b) { return a.box - b.box || b.wrong_n - a.wrong_n; });
  }
  function myGradeTopics() {
    var g = S.me.grade && S.me.grade <= 3 ? S.me.grade : 1;
    return S.topics.filter(function (t) { return t.grade === g; });
  }
  function nextTopic() {
    var list = myGradeTopics().concat(S.topics);
    return list.filter(function (t) { return !S.stamps[t.code] && t.q_count > 0; })[0] || S.topics[0];
  }
  function weakTopics() {
    return S.topics.map(function (t) { return Object.assign({ t: t }, topicStat(t.code)); })
      .filter(function (x) { return x.attempts >= 3 && x.acc < 80; })
      .sort(function (a, b) { return a.acc - b.acc; });
  }
  function stampHtml(code, on) {
    return on ? '<span class="st on">MY<br>' + esc(code) + "<br>✔</span>" : '<span class="st">' + esc(code.split("-")[1] || "?") + "</span>";
  }

  /* ---------- 홈 ---------- */
  function renderHome() {
    var li = MG.levelInfo(S.me.xp), tc = todayCount(), due = dueList().length, nt = nextTopic();
    var stampN = Object.keys(S.stamps).length;
    var gp = Math.min(100, MG.pct(tc, S.goal));
    var recent = Object.keys(S.badges).map(function (k) { return S.badges[k]; }).sort(function (a, b) { return new Date(b.earned_at) - new Date(a.earned_at); }).slice(0, 6);
    var weak = weakTopics()[0];
    $app.innerHTML =
      (S.notice ? '<div class="notice">📢 ' + esc(S.notice) + "</div>" : "") +
      '<div class="card hero">' + MG.mascot() +
      '<div class="xpwrap"><div class="t">' + li.title.em + " " + esc(li.title.en) + " · " + esc(li.title.ko) + "</div>" +
      "<h1>" + esc(S.me.nickname || "친구") + "님, 오늘도 한 문제씩!</h1>" +
      '<div class="row gap" style="align-items:center"><div class="grow"><div class="xpbar"><i style="width:' + li.pct + '%"></i></div>' +
      '<div class="t small">Lv.' + li.lv + " → Lv." + (li.lv + 1) + "까지 " + li.toNext + " XP</div></div>" +
      '<div class="ring" style="--p:' + gp + '" title="오늘 목표"><b>' + tc + "/" + S.goal + "<br><small>오늘</small></b></div></div>" +
      '<div class="hero-stats"><span>⭐ ' + S.me.xp + " XP</span><span>🔥 " + (S.me.last_day === today() || S.me.last_day === MG.kstDate(Date.now() - 864e5) ? S.me.streak : 0) + "일 연속</span><span>🏷️ 스탬프 " + stampN + "/" + S.topics.length + "</span></div></div></div>" +
      '<div class="tiles">' +
      '<button class="tile ' + (due ? "hl" : "") + '" data-go="#/quiz/review">' + (due ? '<span class="cnt">' + due + "</span>" : "") + '<span class="em">🔁</span><b>오늘의 복습</b><small>' + (due ? "잊기 전에 다시 풀어요" : "지금은 복습할 문제가 없어요") + "</small></button>" +
      '<button class="tile" data-go="#/topic/' + encodeURIComponent(nt ? nt.code : "") + '"><span class="em">📖</span><b>이어서 학습</b><small>' + esc(nt ? nt.title : "단원 준비 중") + "</small></button>" +
      '<button class="tile" data-go="#/quiz/mix"><span class="em">🎲</span><b>섞어 풀기 도전</b><small>여러 단원을 섞어서 10문제</small></button>' +
      '<button class="tile" data-go="#/quiz/time"><span class="em">⏱️</span><b>60초 타임어택</b><small>최고 기록 ' + bestTime() + "개</small></button></div>" +
      '<div class="grid g2">' +
      '<div class="card"><h2>🎖️ 최근 받은 배지</h2>' + (recent.length ? '<div class="badges">' + recent.map(function (b) { var d = MG.badge(b.code); return '<div class="bdg"><span class="em">' + d.em + "</span><b>" + esc(d.name) + "</b></div>"; }).join("") + "</div>" : '<p class="muted">첫 문제를 맞히면 첫 배지를 받아요!</p>') +
      '<a class="btn sm mt" href="#/me">모든 배지 보기</a></div>' +
      '<div class="card"><h2>💡 오늘의 추천</h2>' +
      (weak ? "<p><b>" + esc(weak.t.title) + "</b> 정답률이 " + weak.acc + "%예요. 개념을 다시 보고 연습해 볼까요?</p><button class=\"btn primary\" data-go=\"#/topic/" + encodeURIComponent(weak.t.code) + '">약점 연습하기</button>'
        : "<p>아직 약한 단원이 없어요. 새 단원에 도전해 스탬프를 모아 보세요!</p><button class=\"btn primary\" data-go=\"#/learn\">단원 보러 가기</button>") +
      '<p class="small muted mt">틀린 문제는 자동으로 복습 목록에 들어가고, 맞힐수록 1일 → 3일 → 7일 → 14일 → 30일 간격으로 다시 나와요.</p></div></div>' +
      '<div class="card" id="mini-rank"><h2>🏆 이번 주 순위 <span class="sub">닉네임으로만 보여요</span></h2><div class="loading">…</div></div>';
    bindGo();
    api.leaderboard("week", null).then(function (rows) {
      var el = $("#mini-rank .loading"); if (!el) return;
      el.outerHTML = rows.length ? rankList(rows.slice(0, 5)) + '<a class="btn sm mt" href="#/rank">전체 순위 보기</a>' : '<p class="muted">이번 주 첫 번째 주인공이 되어 보세요!</p>';
    }).catch(function () {});
  }
  function bindGo(root) {
    $$("[data-go]", root).forEach(function (b) {
      b.onclick = function () { var h = b.getAttribute("data-go"); if (location.hash === h) route(); else location.hash = h; };
    });
  }
  function bestKey() { return "mg_best_time_" + S.me.id; }
  function bestTime() { try { return parseInt(localStorage.getItem(bestKey()) || "0", 10); } catch (e) { return 0; } }

  /* ---------- 학습 (단원 목록) ---------- */
  function renderLearn(g) {
    var grades = Object.keys(S.topics.reduce(function (o, t) { o[t.grade || 0] = 1; return o; }, {})).map(Number).sort();
    if (!g || grades.indexOf(g) < 0) g = grades.indexOf(S.me.grade) >= 0 ? S.me.grade : grades[0];
    var list = S.topics.filter(function (t) { return (t.grade || 0) === g; });
    $app.innerHTML = '<h2>📖 문법 단원</h2><div class="tabs">' + grades.map(function (x) {
      return '<button class="' + (x === g ? "on" : "") + '" data-go="#/learn/' + x + '">' + esc(MG.GRADES[x] || "기타") + "</button>";
    }).join("") + "</div>" +
      (list.length ? '<div class="grid auto">' + list.map(function (t) {
        var st = topicStat(t.code);
        return '<button class="topic" data-go="#/topic/' + encodeURIComponent(t.code) + '">' + stampHtml(t.code, S.stamps[t.code]) +
          '<div class="grow"><span class="code">' + esc(t.code) + " · " + esc(t.category || "") + "</span><b>" + esc(t.title) + "</b>" +
          '<div class="bar ' + (S.stamps[t.code] ? "ok" : "") + '" style="margin:6px 0 2px"><i style="width:' + MG.pct(st.solved, st.total) + '%"></i></div>' +
          '<span class="small muted">' + st.solved + "/" + st.total + "문제" + (st.acc != null ? " · 정답률 " + st.acc + "%" : "") + "</span></div></button>";
      }).join("") + "</div>" : '<div class="empty">아직 단원이 없어요.</div>');
    bindGo();
  }

  /* ---------- 단원 설명 ---------- */
  function renderTopic(code) {
    var t = S.topicBy[code];
    if (!t) { $app.innerHTML = '<div class="empty">단원을 찾을 수 없어요.</div>'; return; }
    var st = topicStat(code);
    var ex = String(t.examples || "").split("\n").filter(Boolean).map(function (l) {
      var p = l.split("|"), en = p[0].trim();
      return '<div class="ex"><button class="say" data-say="' + esc(en) + '" aria-label="듣기">🔊</button><div><div class="en">' + esc(en) + '</div><div class="ko">' + esc((p[1] || "").trim()) + "</div></div></div>";
    }).join("");
    $app.innerHTML = '<a class="linkbtn" href="#/learn/' + (t.grade || "") + '">← 단원 목록</a>' +
      '<div class="card lesson mt"><div class="row between wrap gap"><div><span class="qtype">' + esc(MG.GRADES[t.grade] || "") + " · " + esc(t.category || "") + "</span><h2 style=\"font-size:1.5rem\">" + esc(t.title) + (t.title_en ? ' <span class="muted" style="font-size:1rem">' + esc(t.title_en) + "</span>" : "") + "</h2></div>" +
      '<div class="topic" style="width:auto;box-shadow:none;border:0;padding:0">' + stampHtml(code, S.stamps[code]) + "</div></div>" +
      '<div class="summary">' + MG.rich(t.summary || "") + "</div></div>" +
      (ex ? '<div class="card"><h2>🗣️ 예문 <span class="sub">🔊 를 눌러 들어 보세요</span></h2>' + ex + "</div>" : "") +
      (t.tip ? '<div class="tip mb">💡 ' + MG.rich(t.tip) + "</div>" : "") +
      '<div class="card"><div class="row between wrap gap"><div><b>문제 ' + st.total + "개</b> · 맞힌 문제 " + st.solved + "개" + (st.acc != null ? " · 정답률 " + st.acc + "%" : "") +
      '<div class="small muted">' + (S.stamps[code] ? "🎉 스탬프를 받은 단원이에요. 복습으로 실력을 지켜요!" : "문제의 80%를 맞히면 스탬프를 받아요.") + "</div></div>" +
      '<button class="btn primary" data-go="#/quiz/topic/' + encodeURIComponent(code) + '"' + (st.total ? "" : " disabled") + ">✏️ 문제 풀기</button></div></div>";
    bindGo();
    $$("[data-say]").forEach(function (b) { b.onclick = function () { MG.speak(b.getAttribute("data-say")); }; });
  }

  /* ---------- 복습 ---------- */
  function renderReview() {
    var due = dueList(), wr = wrongList();
    $app.innerHTML = '<h2>🔁 복습</h2>' +
      '<div class="tiles" style="grid-template-columns:repeat(2,minmax(0,1fr))">' +
      '<button class="tile ' + (due.length ? "hl" : "") + '" data-go="#/quiz/review">' + (due.length ? '<span class="cnt">' + due.length + "</span>" : "") + '<span class="em">⏰</span><b>오늘의 복습</b><small>잊어버릴 때가 된 문제를 다시 풀어요 (복습 정답 +5 XP 보너스)</small></button>' +
      '<button class="tile" data-go="#/quiz/wrong"><span class="em">📕</span><b>오답 노트 풀기</b><small>아직 익숙하지 않은 문제 ' + wr.length + "개</small></button></div>" +
      '<div class="card"><h2>📕 오답 노트</h2>' + (wr.length ? '<div class="tablewrap"><table><thead><tr><th>단원</th><th>문제</th><th class="num">틀림</th><th>상자</th></tr></thead><tbody>' +
        wr.slice(0, 60).map(function (p) {
          var q = S.qBy[p.question_id], t = S.topicBy[q.topic_code];
          return "<tr><td>" + esc(t ? t.title : q.topic_code) + '</td><td class="wrapcell">' + esc(q.prompt.replace(/[\[\]]/g, "").slice(0, 80)) + '</td><td class="num">' + p.wrong_n + "</td><td>" + boxLabel(p.box) + "</td></tr>";
        }).join("") + "</tbody></table></div>" : '<p class="muted">틀린 문제가 없어요. 대단해요! 👏</p>') +
      '<p class="small muted mt">📦 복습 상자: 맞히면 다음 상자로 올라가고 다시 나오는 간격이 길어져요 (0 → 1일 → 3일 → 7일 → 14일 → 30일). 틀리면 0번 상자로 돌아가요.</p></div>';
    bindGo();
  }
  function boxLabel(b) { return '<span class="tag ' + (b === 0 ? "bad" : b >= 3 ? "ok" : "brand") + '">' + b + "번 상자</span>"; }

  /* ---------- 문제 풀기 ---------- */
  function pickTopic(code) {
    var qs = S.allQ.filter(function (q) { return q.topic_code === code; }), now = Date.now();
    var pr = function (q) { var p = S.prog[q.id]; if (!p) return 0; if (p.box === 0) return 1; if (new Date(p.due_at).getTime() <= now) return 2; return 3; };
    return MG.shuffle(MG.shuffle(qs).sort(function (a, b) { return pr(a) - pr(b); }).slice(0, 10));
  }
  function poolTopics() {
    var tried = S.topics.filter(function (t) { return topicStat(t.code).tried > 0; });
    return tried.length >= 2 ? tried : myGradeTopics().length ? myGradeTopics() : S.topics;
  }
  function pickMix(n) {
    var by = {};
    poolTopics().forEach(function (t) { by[t.code] = MG.shuffle(S.allQ.filter(function (q) { return q.topic_code === t.code; })); });
    var codes = MG.shuffle(Object.keys(by)), out = [];
    for (var round = 0; out.length < n && round < 50; round++) {
      codes.forEach(function (c) { if (out.length < n && by[c][round]) out.push(by[c][round]); });
    }
    return out;
  }
  function startQuiz(mode, arg) {
    var list = [], title = "";
    if (mode === "topic") { list = pickTopic(arg); title = (S.topicBy[arg] || {}).title || arg; }
    else if (mode === "review") { list = dueList().slice(0, 15).map(function (p) { return S.qBy[p.question_id]; }); title = "오늘의 복습"; }
    else if (mode === "wrong") { list = MG.shuffle(wrongList().slice(0, 15)).map(function (p) { return S.qBy[p.question_id]; }); title = "오답 노트"; mode = "review"; }
    else if (mode === "mix") { list = pickMix(10); title = "섞어 풀기"; }
    else if (mode === "time") { list = pickMix(80); title = "60초 타임어택"; }
    else if (mode === "retry") { list = (S.lastWrong || []).map(function (id) { return S.qBy[id]; }).filter(Boolean); title = "틀린 문제 다시"; mode = "review"; }
    list = list.filter(Boolean);
    if (!list.length) {
      $app.innerHTML = '<div class="card empty">' + MG.mascot() + "<h2>" + (mode === "review" ? "지금은 복습할 문제가 없어요 🎉" : "풀 문제가 없어요") + '</h2><p>새 단원을 공부하면 복습 문제가 생겨요.</p><button class="btn primary" data-go="#/learn">단원 보러 가기</button></div>';
      return bindGo();
    }
    S.run = { mode: mode, title: title, list: list, i: 0, right: 0, xp: 0, combo: 0, comboBest: 0, results: [], badges: [], stamps: [], certs: [], lvUp: null, start: Date.now(), timeLeft: mode === "time" ? 60 : null, over: false };
    if (mode === "time") {
      timer = setInterval(function () {
        if (!S.run) return stopTimer();
        S.run.timeLeft--;
        var t = $("#qtimer"); if (t) t.textContent = "⏱ " + Math.max(0, S.run.timeLeft);
        if (S.run.timeLeft <= 0) { stopTimer(); S.run.over = true; finishQuiz(); }
      }, 1000);
    }
    renderQ();
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  function renderQ() {
    var R = S.run, q = R.list[R.i], t = S.topicBy[q.topic_code] || {};
    var total = R.mode === "time" ? null : R.list.length;
    var head = '<div class="qhead"><button class="btn sm ghost" id="quit">✕</button>' +
      (total ? '<div class="bar"><i style="width:' + MG.pct(R.i, total) + '%"></i></div><b>' + (R.i + 1) + "/" + total + "</b>" : '<div class="grow"><b>' + R.right + "개 정답</b></div>") +
      '<span class="combo" id="qcombo">' + (R.combo >= 2 ? "🔥 x" + R.combo : "") + "</span>" +
      (R.mode === "time" ? '<span class="timer" id="qtimer">⏱ ' + R.timeLeft + "</span>" : "") + "</div>";
    var body = "";
    var prompt = q.qtype === "error" ? "" : '<div class="qprompt">' + esc(q.prompt) + "</div>";
    if (q.qtype === "mc") {
      body = prompt + '<div class="choices">' + MG.shuffle(q.choices || []).map(function (c, i) {
        return '<button class="choice" data-a="' + esc(c) + '"><span class="n">' + (i + 1) + "</span><span>" + esc(c) + "</span></button>";
      }).join("") + "</div>";
    } else if (q.qtype === "ox") {
      body = prompt + '<div class="ox"><button class="choice" data-a="O" style="color:var(--ok)">O</button><button class="choice" data-a="X" style="color:var(--bad)">X</button></div>';
    } else if (q.qtype === "blank") {
      body = prompt + '<input class="blank-in" id="blank" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="빈칸에 들어갈 말">' +
        '<div class="qactions"><button class="btn ghost" id="idk">잘 모르겠어요</button><button class="btn primary" id="ok">확인</button></div>';
    } else if (q.qtype === "order") {
      body = '<div class="qprompt">' + esc(q.prompt) + '</div><div class="order-line" id="line"></div><div class="order-pool" id="pool">' +
        (q.choices || []).map(function (w, i) { return '<button class="word" data-i="' + i + '">' + esc(w) + "</button>"; }).join("") + "</div>" +
        '<div class="qactions"><button class="btn ghost" id="reset">↺ 다시</button><button class="btn ghost" id="idk">잘 모르겠어요</button><button class="btn primary" id="ok" disabled>확인</button></div>';
    } else if (q.qtype === "error") {
      var n = 0;
      body = '<div class="small muted mb">어법상 <b>틀린</b> 부분을 눌러 주세요.</div><div class="err-sent">' + MG.parseError(q.prompt).map(function (p) {
        return p.pick ? '<button class="err-part" data-a="' + esc(p.t) + '"><sup>' + "①②③④⑤⑥"[n++] + "</sup>" + esc(p.t) + "</button>" : esc(p.t);
      }).join("") + "</div>";
    }
    $app.innerHTML = '<div class="quiz">' + head + '<div class="card qcard" id="qcard"><span class="qtype">' + esc(MG.QTYPES[q.qtype]) + " · " + esc(t.title || "") + "</span>" + body + '<div id="fb"></div></div></div>';
    $("#quit").onclick = function () {
      if (R.results.length && !confirm("그만할까요? 지금까지 푼 기록은 저장되어 있어요.")) return;
      stopTimer(); R.results.length ? finishQuiz() : history.back();
    };
    $$(".choice, .err-part").forEach(function (b) { b.onclick = function () { answer(b.getAttribute("data-a"), b); }; });
    if (q.qtype === "blank") {
      var inp = $("#blank"); inp.focus();
      inp.onkeydown = function (e) { if (e.key === "Enter" && inp.value.trim()) answer(inp.value); };
      $("#ok").onclick = function () { if (inp.value.trim()) answer(inp.value); else inp.focus(); };
      $("#idk").onclick = function () { answer(""); };
    }
    if (q.qtype === "order") {
      var picked = [];
      var draw = function () {
        $("#line").innerHTML = picked.map(function (i, k) { return '<button class="word" data-k="' + k + '">' + esc(q.choices[i]) + "</button>"; }).join("");
        $$("#pool .word").forEach(function (b) { b.classList.toggle("used", picked.indexOf(+b.getAttribute("data-i")) >= 0); });
        $$("#line .word").forEach(function (b) { b.onclick = function () { picked.splice(+b.getAttribute("data-k"), 1); draw(); }; });
        $("#ok").disabled = picked.length !== q.choices.length;
      };
      $$("#pool .word").forEach(function (b) { b.onclick = function () { var i = +b.getAttribute("data-i"); if (picked.indexOf(i) < 0) { picked.push(i); draw(); } }; });
      $("#reset").onclick = function () { picked = []; draw(); };
      $("#ok").onclick = function () { answer(picked.map(function (i) { return q.choices[i]; }).join(" ")); };
      $("#idk").onclick = function () { answer(""); };
    }
  }

  var busy = false;
  async function answer(given, el) {
    var R = S.run; if (!R || busy || R.over) return;
    var q = R.list[R.i];
    busy = true;
    $$("#qcard button, #qcard input").forEach(function (b) { b.disabled = true; });
    var res;
    try { res = await api.submit(q.id, given, R.mode === "time" ? "time" : R.mode); }
    catch (e) {
      busy = false;
      $$("#qcard button, #qcard input").forEach(function (b) { b.disabled = false; });
      return MG.toast("저장하지 못했어요: " + e.message, "bad");
    }
    busy = false;
    if (!S.run || S.run !== R) return;
    // 상태 갱신
    R.results.push({ q: q, ok: res.correct, given: given });
    R.xp += res.xp; R.combo = res.correct ? R.combo + 1 : 0; R.comboBest = Math.max(R.comboBest, R.combo);
    if (res.correct) R.right++;
    S.me.xp = res.total_xp; S.me.streak = res.streak; S.me.today_count = res.today_count; S.me.last_day = today(); S.me.combo = res.combo;
    var p = S.prog[q.id] || { question_id: q.id, right_n: 0, wrong_n: 0 };
    p.box = res.box; p.due_at = new Date(Date.now() + [0, 1, 3, 7, 14, 30][res.box] * 864e5).toISOString();
    if (res.correct) p.right_n++; else p.wrong_n++;
    S.prog[q.id] = p;
    if (res.stamp) { S.stamps[res.stamp] = { topic_code: res.stamp, earned_at: new Date().toISOString() }; R.stamps.push(res.stamp); MG.toast("🏷️ 스탬프 획득! " + ((S.topicBy[res.stamp] || {}).title || res.stamp)); }
    (res.badges || []).forEach(function (b) { S.badges[b] = { code: b, earned_at: new Date().toISOString() }; R.badges.push(b); MG.toast(MG.badge(b).em + " 배지 획득: " + MG.badge(b).name); });
    (res.certs || []).forEach(function (c) { S.certs.push(c); R.certs.push(c); });
    if (res.level > res.old_level) { R.lvUp = res.level; MG.toast("🎉 레벨 업! Lv." + res.level); }
    if (res.goal_hit) MG.toast("✅ 오늘 목표 " + S.goal + "문제 달성! +30 XP");
    renderChips();
    // 화면 표시
    var fl = document.createElement("div"); fl.className = "xpfloat"; fl.textContent = "+" + res.xp + " XP"; document.body.appendChild(fl); setTimeout(function () { fl.remove(); }, 1000);
    $("#qcombo").textContent = R.combo >= 2 ? "🔥 x" + R.combo : "";
    markChoices(q, res, given);
    if (!res.correct) { $("#qcard").classList.add("shake"); try { navigator.vibrate && navigator.vibrate(80); } catch (e) {} }
    var ansText = res.answer.split("|").join(" / ");
    $("#fb").innerHTML = '<div class="feedback ' + (res.correct ? "ok" : "no") + '"><div class="big">' + (res.correct ? pick(["정답! 🎉", "완벽해요! ✨", "좋아요! 👍", "멋져요! 💜"]) : "아쉬워요 😢") +
      ' <span class="small">+' + res.xp + " XP</span></div>" +
      (res.correct ? "" : '<div class="ans">정답: ' + esc(ansText) + "</div>") +
      (res.explanation ? '<div class="exp">💡 ' + esc(res.explanation) + "</div>" : "") + "</div>" +
      '<div class="qactions">' + (q.qtype === "order" ? '<button class="btn ghost" id="sayans">🔊 문장 듣기</button>' : "") +
      '<button class="btn primary" id="next">' + (R.mode !== "time" && R.i + 1 >= R.list.length ? "결과 보기" : "다음 →") + "</button></div>";
    if ($("#sayans")) $("#sayans").onclick = function () { MG.speak(res.answer.split("|")[0]); };
    var next = $("#next");
    next.onclick = goNext; next.focus({ preventScroll: true });
    $("#fb").scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (R.mode === "time" && res.correct) setTimeout(function () { if (S.run === R && R.results.length === R.i + 1) goNext(); }, 650);
  }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function markChoices(q, res, given) {
    var right = res.answer.split("|");
    $$(".choice, .err-part").forEach(function (b) {
      var a = b.getAttribute("data-a");
      if (right.some(function (r) { return MG.norm(r) === MG.norm(a); }) || (q.qtype === "ox" && a === res.answer.charAt(0).toUpperCase())) b.classList.add("right");
      else if (a === given) b.classList.add("wrong");
    });
  }
  function goNext() {
    var R = S.run; if (!R || R.over) return;
    R.i++;
    if (R.i >= R.list.length) {
      if (R.mode === "time") { R.list = R.list.concat(pickMix(40)); }
      else return finishQuiz();
    }
    renderQ();
  }

  function finishQuiz() {
    var R = S.run; if (!R) return;
    stopTimer(); R.over = true;
    var n = R.results.length, wrong = R.results.filter(function (r) { return !r.ok; });
    S.lastWrong = wrong.map(function (r) { return r.q.id; });
    var newBest = false;
    if (R.mode === "time" && R.right > bestTime()) { try { localStorage.setItem(bestKey(), String(R.right)); } catch (e) {} newBest = true; }
    var secs = Math.round((Date.now() - R.start) / 1000);
    $app.innerHTML = '<div class="quiz"><div class="card result">' + MG.mascot() +
      "<h2>" + esc(R.title) + " 완료!</h2>" +
      '<div class="score">' + R.right + (R.mode === "time" ? "개" : " / " + n) + "</div>" +
      (newBest ? '<p><b>🎉 타임어택 최고 기록!</b></p>' : "") +
      '<div class="kpis mt"><div class="kpi"><b>' + MG.pct(R.right, n) + '%</b><span>정답률</span></div><div class="kpi"><b>+' + R.xp + '</b><span>얻은 XP</span></div>' +
      '<div class="kpi"><b>🔥 ' + R.comboBest + '</b><span>최고 콤보</span></div><div class="kpi"><b>' + Math.floor(secs / 60) + ":" + String(secs % 60).padStart(2, "0") + '</b><span>걸린 시간</span></div></div>' +
      '<div class="row gap wrap mt" style="justify-content:center">' +
      (wrong.length ? '<button class="btn primary" data-go="#/quiz/retry">📕 틀린 ' + wrong.length + "문제 다시 풀기</button>" : "") +
      (R.mode === "topic" && R.list[0] ? '<button class="btn" data-go="#/topic/' + encodeURIComponent(R.list[0].topic_code) + '">단원으로</button>' : "") +
      '<button class="btn" id="again">한 번 더</button><button class="btn ghost" data-go="#/">홈</button></div></div>' +
      '<div class="card"><h2>📝 푼 문제</h2>' + R.results.map(function (r) {
        return '<div class="ex"><span style="font-size:1.2rem">' + (r.ok ? "✅" : "❌") + '</span><div><div class="en">' + esc(r.q.prompt.replace(/[\[\]]/g, "")) + "</div>" +
          (r.ok ? "" : '<div class="ko">내 답: ' + esc(r.given || "(모르겠어요)") + "</div>") + "</div></div>";
      }).join("") + "</div></div>";
    bindGo();
    $("#again").onclick = function () { S.run = null; route(); };
    if (R.right / Math.max(n, 1) >= 0.8 && n >= 5) MG.confetti(50);
    celebrate(R);
  }
  function celebrate(R) {
    var queue = [];
    if (R.lvUp) {
      var t = MG.titleOf(R.lvUp);
      queue.push('<div class="celebrate"><div class="big-em">' + t.em + "</div><h2>레벨 업! Lv." + R.lvUp + "</h2><p><b>" + esc(t.en) + "</b> · " + esc(t.ko) + "</p><p class=\"muted\">다음 레벨까지 " + MG.levelInfo(S.me.xp).toNext + " XP</p></div>");
    }
    R.stamps.forEach(function (c) {
      queue.push('<div class="celebrate"><div class="stampbook" style="grid-template-columns:1fr;max-width:140px;margin:0 auto"><div class="stampbox on">' + stampHtml(c, true) + '</div></div><h2 class="mt">스탬프 획득!</h2><p><b>' + esc((S.topicBy[c] || {}).title || c) + "</b> 단원을 마스터했어요.</p></div>");
    });
    if (R.badges.length) queue.push('<div class="celebrate"><h2>🎖️ 새 배지</h2><div class="badges">' + R.badges.map(function (b) { var d = MG.badge(b); return '<div class="bdg"><span class="em">' + d.em + "</span><b>" + esc(d.name) + "</b>" + esc(d.desc) + "</div>"; }).join("") + "</div></div>");
    R.certs.forEach(function (c) { queue.push({ cert: c }); });
    (function next() {
      var item = queue.shift(); if (!item) return;
      if (item.cert) {
        MG.confetti(90);
        var ov = MG.modal('<div class="celebrate"><div class="big-em">🎓</div><h2>인증서가 발급됐어요!</h2><p><b>' + esc(item.cert.title) + "</b></p><p class=\"muted\">'나' 화면에서 언제든 다시 볼 수 있어요.</p>" +
          '<button class="btn gold" id="seecert">인증서 보기</button></div>', { onClose: next });
        $("#seecert", ov).onclick = function () { ov.remove(); MG.showCert(item.cert, whoMe()); next(); };
        return;
      }
      MG.confetti(40);
      MG.modal(item + '<div class="row mt" style="justify-content:center"><button class="btn primary" data-close>좋아요!</button></div>', { onClose: next });
      var b = $$(".overlay [data-close]").pop(); b.onclick = function () { b.closest(".overlay").close(); };
    })();
  }
  function whoMe() { return { name: S.me.real_name, nickname: S.me.nickname, grade: S.me.grade, class_no: S.me.class_no }; }

  /* ---------- 순위 ---------- */
  function rankList(rows, offset) {
    return '<ol class="rank-list">' + rows.map(function (r, i) {
      var t = MG.titleOf(r.level);
      return '<li class="' + (r.is_me ? "me" : "") + '"><span class="no">' + ((offset || 0) + i + 1) + '</span><span class="grow"><b>' + esc(r.nickname) + "</b> " + (r.is_me ? '<span class="tag brand">나</span>' : "") +
        '<br><span class="small muted">' + t.em + " Lv." + r.level + (r.grade ? " · " + r.grade + "학년" : "") + '</span></span><b class="num">' + r.xp + " XP</b></li>";
    }).join("") + "</ol>";
  }
  async function renderRank(period) {
    var grade = S.rankGrade || null;
    var tabs = [["week", "이번 주"], ["month", "이번 달"], ["all", "전체"], ["class", "반 대항전"]];
    $app.innerHTML = '<h2>🏆 순위</h2><div class="tabs">' + tabs.map(function (t) { return '<button class="' + (t[0] === period ? "on" : "") + '" data-go="#/rank/' + t[0] + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      (period === "class" ? "" : '<div class="tabs">' + [[null, "전체 학년"], [1, "중1"], [2, "중2"], [3, "중3"]].map(function (g) { return '<button class="pill ' + (g[0] === grade ? "on" : "") + '" data-g="' + (g[0] || "") + '">' + g[1] + "</button>"; }).join("") + "</div>") +
      '<div class="card" id="rk"><div class="loading">불러오는 중…</div></div>';
    bindGo();
    $$("[data-g]").forEach(function (b) { b.onclick = function () { S.rankGrade = parseInt(b.getAttribute("data-g"), 10) || null; renderRank(period); }; });
    try {
      if (period === "class") {
        var cb = await api.classBoard("week");
        $("#rk").innerHTML = "<h2>🏫 이번 주 반 대항전 <span class=\"sub\">반 친구 1명당 평균 XP</span></h2>" + (cb.length ? '<ol class="rank-list">' + cb.map(function (r, i) {
          return '<li class="' + (r.is_mine ? "me" : "") + '"><span class="no">' + (i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1) + '</span><span class="grow"><b>' + r.grade + "학년 " + r.class_no + "반</b>" + (r.is_mine ? ' <span class="tag brand">우리 반</span>' : "") +
            '<br><span class="small muted">참여 ' + r.active + "/" + r.members + "명 · 합계 " + r.xp + ' XP</span></span><b class="num">' + r.avg_xp + "</b></li>";
        }).join("") + "</ol>" : '<p class="muted">아직 기록이 없어요.</p>') + '<p class="small muted mt">반 평균이라서 친구들이 다 함께 참여할수록 올라가요! 🤝</p>';
        return;
      }
      var rows = await api.leaderboard(period, grade);
      if (!rows.length) { $("#rk").innerHTML = '<p class="empty">아직 기록이 없어요. 첫 번째 주인공이 되어 보세요!</p>'; return; }
      var top = rows.slice(0, 3), order = [top[1], top[0], top[2]];
      $("#rk").innerHTML = '<div class="podium">' + order.map(function (r, i) {
        if (!r) return "<div></div>";
        var place = [2, 1, 3][i];
        return '<div class="pod p' + place + '"><div class="medal">' + ["🥇", "🥈", "🥉"][place - 1] + "</div><b>" + esc(r.nickname) + "</b><span>" + r.xp + " XP</span></div>";
      }).join("") + "</div>" + rankList(rows.slice(3), 3) +
        (rows.some(function (r) { return r.is_me; }) ? "" : '<p class="small muted mt">내 닉네임이 아직 50위 안에 없어요. 조금만 더 풀면 올라갈 수 있어요!</p>');
    } catch (e) { $("#rk").innerHTML = '<p class="err">' + esc(e.message) + "</p>"; }
  }

  /* ---------- 나 ---------- */
  function renderMe() {
    var li = MG.levelInfo(S.me.xp);
    var r = 0, w = 0, solved = 0;
    Object.keys(S.prog).forEach(function (k) { var p = S.prog[k]; r += p.right_n; w += p.wrong_n; if (p.right_n > 0) solved++; });
    var weak = weakTopics().slice(0, 4);
    $app.innerHTML =
      '<div class="card"><div class="row gap wrap between"><div class="row gap"><div class="avatar-btn" style="width:64px;height:64px;font-size:1.6rem;display:grid;place-items:center">' + esc((S.me.nickname || "?").slice(0, 1)) + "</div>" +
      '<div><h2 style="margin:0">' + esc(S.me.nickname || "닉네임 없음") + "</h2>" +
      '<div class="muted small">' + esc(S.me.real_name || "") + (S.me.grade ? " · " + S.me.grade + "학년 " + (S.me.class_no || "?") + "반 " + (S.me.student_no || "?") + "번" : "") + "</div>" +
      '<div class="small">' + li.title.em + " " + esc(li.title.en) + " · Lv." + li.lv + "</div></div></div>" +
      '<button class="btn" id="edit">✏️ 닉네임·반 바꾸기</button></div>' +
      '<div class="bar gold mt"><i style="width:' + li.pct + '%"></i></div><div class="small muted">다음 레벨까지 ' + li.toNext + " XP</div></div>" +
      '<div class="kpis mb"><div class="kpi"><b>' + S.me.xp + '</b><span>누적 XP</span></div><div class="kpi"><b>' + solved + '</b><span>맞혀 본 문제</span></div>' +
      '<div class="kpi"><b>' + MG.pct(r, r + w) + '%</b><span>전체 정답률</span></div><div class="kpi"><b>' + S.me.best_streak + '일</b><span>최고 연속 학습</span></div>' +
      '<div class="kpi"><b>' + S.me.combo_best + '</b><span>최고 콤보</span></div><div class="kpi"><b>' + S.me.goal_days + '일</b><span>목표 달성</span></div></div>' +
      (weak.length ? '<div class="card"><h2>🩹 약한 단원</h2>' + weak.map(function (x) {
        return '<div class="weak"><span class="lbl">' + esc(x.t.title) + '</span><div class="bar grow"><i style="width:' + x.acc + '%;background:var(--bad)"></i></div><b class="num" style="width:44px">' + x.acc + '%</b><button class="btn sm" data-go="#/topic/' + encodeURIComponent(x.t.code) + '">연습</button></div>';
      }).join("") + "</div>" : "") +
      '<div class="card"><h2>🎓 내 인증서 <span class="sub">' + S.certs.length + "개</span></h2>" + (S.certs.length ? '<div class="grid auto">' + S.certs.map(function (c, i) {
        return '<button class="tile" data-cert="' + i + '"><span class="em">🎓</span><b>' + esc(c.title) + "</b><small>" + esc(c.detail || "") + "<br>" + MG.kstDate(c.issued_at) + "</small></button>";
      }).join("") + "</div>" : '<p class="muted">레벨 5 달성, 스탬프 5개, 30일 연속 학습 등을 이루면 인증서가 자동으로 발급돼요.</p>') + "</div>" +
      '<div class="card"><h2>🏷️ 스탬프 북 <span class="sub">' + Object.keys(S.stamps).length + "/" + S.topics.length + '</span></h2><div class="stampbook">' + S.topics.map(function (t) {
        return '<div class="stampbox ' + (S.stamps[t.code] ? "on" : "") + '">' + stampHtml(t.code, S.stamps[t.code]) + esc(t.title) + "</div>";
      }).join("") + "</div></div>" +
      '<div class="card"><h2>🎖️ 배지 <span class="sub">' + Object.keys(S.badges).length + "/" + MG.BADGES.length + '</span></h2><div class="badges">' + MG.BADGES.map(function (b) {
        return '<div class="bdg ' + (S.badges[b.code] ? "" : "off") + '"><span class="em">' + b.em + "</span><b>" + esc(b.name) + "</b>" + esc(b.desc) + "</div>";
      }).join("") + "</div></div>" +
      '<div class="card"><h2>🧭 레벨 칭호</h2><div class="badges">' + MG.TITLES.map(function (t) {
        return '<div class="bdg ' + (li.lv >= t.min ? "" : "off") + '"><span class="em">' + t.em + "</span><b>" + esc(t.en) + "</b>Lv." + t.min + "+</div>";
      }).join("") + "</div></div>";
    bindGo();
    $("#edit").onclick = function () { openProfile(false); };
    $$("[data-cert]").forEach(function (b) { b.onclick = function () { MG.showCert(S.certs[+b.getAttribute("data-cert")], whoMe()); }; });
  }

  /* ---------- 프로필 (닉네임 · 반) ---------- */
  var NICK_A = ["반짝이는", "용감한", "슬기로운", "상큼한", "씩씩한", "빛나는", "행복한", "든든한", "명랑한", "똑똑한"];
  var NICK_B = ["유니콘", "펭귄", "여우", "고래", "토끼", "부엉이", "판다", "돌고래", "별", "다람쥐"];
  function openProfile(first) {
    var m = S.me;
    var ov = MG.modal("<h2>" + (first ? "👋 반가워요! 처음 설정을 해 볼까요?" : "✏️ 내 정보 바꾸기") + "</h2>" +
      '<p class="small muted">닉네임은 순위표에 보이는 이름이에요. 실명은 선생님만 볼 수 있어요.</p>' +
      '<label for="pn">닉네임 (2~12글자)</label><div class="row gap"><input id="pn" maxlength="12" value="' + esc(m.nickname || "") + '"><button class="btn" id="rnd" title="랜덤">🎲</button></div>' +
      '<div class="grid g3 mt" style="grid-template-columns:repeat(3,1fr)"><div><label for="pg">학년</label><select id="pg"><option value="">-</option>' + [1, 2, 3].map(function (g) { return "<option" + (m.grade === g ? " selected" : "") + ">" + g + "</option>"; }).join("") + "</select></div>" +
      '<div><label for="pc">반</label><input id="pc" type="number" inputmode="numeric" min="1" max="20" value="' + (m.class_no || "") + '"></div>' +
      '<div><label for="pno">번호</label><input id="pno" type="number" inputmode="numeric" min="1" max="50" value="' + (m.student_no || "") + '"></div></div>' +
      '<div class="err" id="perr"></div><button class="btn primary block mt" id="psave">저장하기</button>', { noClose: first });
    var nick = $("#pn", ov);
    if (!m.nickname) nick.value = pick(NICK_A) + pick(NICK_B) + Math.floor(Math.random() * 90 + 10);
    $("#rnd", ov).onclick = function () { nick.value = pick(NICK_A) + pick(NICK_B) + Math.floor(Math.random() * 90 + 10); };
    $("#psave", ov).onclick = async function () {
      var g = parseInt($("#pg", ov).value, 10) || null, c = parseInt($("#pc", ov).value, 10) || null, n = parseInt($("#pno", ov).value, 10) || null;
      if (!g || !c || !n) { $("#perr", ov).textContent = "학년, 반, 번호를 모두 입력해 주세요."; return; }
      try {
        var p = await api.setProfile(nick.value, g, c, n);
        Object.assign(S.me, p); ov.remove(); renderChips(); MG.toast("저장했어요!"); route();
      } catch (e) { $("#perr", ov).textContent = e.message; }
    };
  }
})();
