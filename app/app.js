(function () {
  "use strict";

  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SCHOOL_LABEL = "서울문영여자중학교";
  var ASSET_V = "19"; // 파일을 고칠 때마다 index.html 과 여기 숫자를 같이 올려요
  var BASE = window.APP_BASE || ""; // 미리보기용. 실제 사이트에서는 비어 있음
  var LIBS = {
    d3: "https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js",
    topo: "https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js",
    world: "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json"
  };
  var MEDALS = {
    gold: { em: "🥇", name: "금메달" },
    silver: { em: "🥈", name: "은메달" },
    bronze: { em: "🥉", name: "동메달" }
  };
  // 레벨 로드: 한 수준에서 책 3권(책이 그보다 적으면 전부)을 메달로 완료하면 칭호를 받아요
  var LEVELS = ["A1", "A2", "B1", "B2", "C1"];
  var LEVEL_INFO = {
    A1: { em: "🌱", name: "새싹 독자" },
    A2: { em: "🧭", name: "꼬마 탐험가" },
    B1: { em: "🎒", name: "용감한 여행자" },
    B2: { em: "🗺️", name: "노련한 모험가" },
    C1: { em: "🌍", name: "세계 시민" }
  };
  var LEVEL_GOAL = 3;
  var WEEK_GOAL = 1; // 주간 목표: 한 주에 메달 받은 작품 수
  // 책의 country 값 → 지도 이름(world-atlas), 한국어, 국기, 핀 위치(경도, 위도)
  var COUNTRIES = {
    "Czechoslovakia": { map: "Czechia", ko: "체코", iso: "CZ", at: [15.5, 49.8] },
    "Czechia": { map: "Czechia", ko: "체코", iso: "CZ", at: [15.5, 49.8] },
    "United States": { map: "United States of America", ko: "미국", iso: "US", at: [-98, 39] },
    "United Kingdom": { map: "United Kingdom", ko: "영국", iso: "GB", at: [-1.8, 52.8] },
    "France": { map: "France", ko: "프랑스", iso: "FR", at: [2.4, 46.6] },
    "Germany": { map: "Germany", ko: "독일", iso: "DE", at: [10.4, 51.1] },
    "Italy": { map: "Italy", ko: "이탈리아", iso: "IT", at: [12.6, 42.8] },
    "Spain": { map: "Spain", ko: "스페인", iso: "ES", at: [-3.7, 40.3] },
    "Russia": { map: "Russia", ko: "러시아", iso: "RU", at: [45, 56] },
    "Japan": { map: "Japan", ko: "일본", iso: "JP", at: [138.3, 36.2] },
    "China": { map: "China", ko: "중국", iso: "CN", at: [104, 35] },
    "South Korea": { map: "South Korea", ko: "한국", iso: "KR", at: [127.8, 36.4] },
    "Korea": { map: "South Korea", ko: "한국", iso: "KR", at: [127.8, 36.4] },
    "Ireland": { map: "Ireland", ko: "아일랜드", iso: "IE", at: [-8, 53.2] },
    "Iceland": { map: "Iceland", ko: "아이슬란드", iso: "IS", at: [-18.6, 64.9] },
    "Canada": { map: "Canada", ko: "캐나다", iso: "CA", at: [-100, 57] },
    "India": { map: "India", ko: "인도", iso: "IN", at: [79, 22] },
    "Norway": { map: "Norway", ko: "노르웨이", iso: "NO", at: [9, 61] },
    "Sweden": { map: "Sweden", ko: "스웨덴", iso: "SE", at: [15.5, 62] },
    "Denmark": { map: "Denmark", ko: "덴마크", iso: "DK", at: [9.5, 56] },
    "Netherlands": { map: "Netherlands", ko: "네덜란드", iso: "NL", at: [5.3, 52.2] },
    "Belgium": { map: "Belgium", ko: "벨기에", iso: "BE", at: [4.5, 50.6] },
    "Austria": { map: "Austria", ko: "오스트리아", iso: "AT", at: [14.5, 47.6] },
    "Switzerland": { map: "Switzerland", ko: "스위스", iso: "CH", at: [8.2, 46.8] },
    "Poland": { map: "Poland", ko: "폴란드", iso: "PL", at: [19.4, 52] },
    "Greece": { map: "Greece", ko: "그리스", iso: "GR", at: [22, 39.5] },
    "Portugal": { map: "Portugal", ko: "포르투갈", iso: "PT", at: [-8.2, 39.6] },
    "Turkey": { map: "Turkey", ko: "튀르키예", iso: "TR", at: [35, 39] },
    "Egypt": { map: "Egypt", ko: "이집트", iso: "EG", at: [30, 26.5] },
    "Nigeria": { map: "Nigeria", ko: "나이지리아", iso: "NG", at: [8, 9.5] },
    "Brazil": { map: "Brazil", ko: "브라질", iso: "BR", at: [-52, -10] },
    "Colombia": { map: "Colombia", ko: "콜롬비아", iso: "CO", at: [-73.5, 4] },
    "Chile": { map: "Chile", ko: "칠레", iso: "CL", at: [-71, -33] },
    "Argentina": { map: "Argentina", ko: "아르헨티나", iso: "AR", at: [-64, -34] },
    "Mexico": { map: "Mexico", ko: "멕시코", iso: "MX", at: [-102, 23.5] },
    "Cuba": { map: "Cuba", ko: "쿠바", iso: "CU", at: [-79.5, 21.8] },
    "Algeria": { map: "Algeria", ko: "알제리", iso: "DZ", at: [2.6, 28] },
    "Romania": { map: "Romania", ko: "루마니아", iso: "RO", at: [25, 45.9] },
    "Australia": { map: "Australia", ko: "호주", iso: "AU", at: [134, -25] }
  };
  // 대륙 배지: 각 대륙에 첫 여권 도장을 찍으면 받아요 (지도 이름 → 대륙)
  var CONTINENTS = [
    { id: "EU", name: "유럽", em: "🏰" }, { id: "AS", name: "아시아", em: "🏯" }, { id: "NA", name: "북아메리카", em: "🗽" },
    { id: "SA", name: "남아메리카", em: "🦙" }, { id: "AF", name: "아프리카", em: "🦁" }, { id: "OC", name: "오세아니아", em: "🦘" }
  ];
  var CONT_OF = {
    "Czechia": "EU", "United Kingdom": "EU", "France": "EU", "Germany": "EU", "Italy": "EU", "Spain": "EU", "Russia": "EU",
    "Ireland": "EU", "Iceland": "EU", "Norway": "EU", "Sweden": "EU", "Denmark": "EU", "Netherlands": "EU", "Belgium": "EU",
    "Austria": "EU", "Switzerland": "EU", "Poland": "EU", "Greece": "EU", "Portugal": "EU",
    "Turkey": "AS", "Japan": "AS", "China": "AS", "South Korea": "AS", "India": "AS",
    "United States of America": "NA", "Canada": "NA", "Mexico": "NA", "Cuba": "NA", "Algeria": "AF", "Romania": "EU",
    "Brazil": "SA", "Colombia": "SA", "Chile": "SA", "Argentina": "SA",
    "Egypt": "AF", "Nigeria": "AF", "Australia": "OC"
  };

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, bookTab: "story", revealed: {}, shelf: { level: "all", status: "all", q: "", country: "" } };
  var timer = null;
  var contentLoads = {};
  var scriptLoads = {};
  var worldCache = null;

  /* ---------- 도우미 ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function findBook(id) { return (window.BOOKS || []).filter(function (b) { return b.id === id; })[0]; }
  function levelOf(b) { return String((b && b.cefr) || "").toUpperCase().slice(0, 2); }
  function countryOf(b) { return (b && COUNTRIES[b.country]) || null; }
  function countryKo(b) { var c = countryOf(b); return c ? c.ko : (b && b.country) || ""; }
  // 여권 도장 후보 나라 (첫 번째 = 작가 나라 = 기본값)
  function placesOf(b) { return b && b.places && b.places.length ? b.places : (b && b.country ? [b.country] : []); }
  function sameCountry(a, b) { var x = COUNTRIES[a], y = COUNTRIES[b]; return a === b || (!!x && !!y && x.map === y.map); }
  function countryLabel(key) { var c = COUNTRIES[key]; return c ? flag(c.iso) + " " + esc(c.ko) : esc(key); }
  // 내가 이 책으로 찍은 도장 나라 (고르지 않았으면 작가 나라)
  function stampOf(b, r) {
    var p = placesOf(b);
    return r && r.stamp && p.indexOf(r.stamp) >= 0 ? r.stamp : p[0];
  }
  // 국기 이모지는 Windows에서 글자(FR, GB)로 보여서 작은 이미지로 표시해요
  function flag(iso) {
    if (!iso || !/^[A-Za-z]{2}$/.test(iso)) return "🌐";
    return '<img class="flag" src="https://flagcdn.com/w40/' + iso.toLowerCase() + '.png" alt="" loading="lazy">';
  }
  function loadScript(src) {
    if (scriptLoads[src]) return scriptLoads[src];
    scriptLoads[src] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve;
      s.onerror = function () { delete scriptLoads[src]; reject(new Error("load " + src)); };
      document.head.appendChild(s);
    });
    return scriptLoads[src];
  }
  // 책 본문은 열 때만 불러와요 (목록은 books.js, 본문은 books/<id>.js)
  function loadContent(id) {
    if (window.BOOK_CONTENT && window.BOOK_CONTENT[id]) return Promise.resolve(window.BOOK_CONTENT[id]);
    if (contentLoads[id]) return contentLoads[id];
    contentLoads[id] = loadScript(BASE + "books/" + encodeURIComponent(id) + ".js?v=" + ASSET_V).then(function () {
      if (window.BOOK_CONTENT && window.BOOK_CONTENT[id]) return window.BOOK_CONTENT[id];
      throw new Error("책 내용을 찾지 못했어요.");
    }, function () {
      delete contentLoads[id];
      throw new Error("책 내용을 불러오지 못했어요. 잠시 뒤 다시 해 주세요.");
    });
    return contentLoads[id];
  }
  function toast(msg) {
    var t = document.createElement("div");
    t.className = "toast"; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }
  function fmtDate(s) {
    if (!s) return "-";
    var d = new Date(s);
    return (d.getMonth() + 1) + "/" + d.getDate() + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }
  function addDays(iso, n) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  // 하루 연속 독서: 메달(60점 이상)을 받은 날(서울 시간)이 독서한 날이에요. 오늘 아직 안 했어도 어제까지 이어졌으면 불꽃은 살아 있어요.
  function dayStreak(data) {
    var today = (data && data.today) || new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    var list = (data && data.days) || [];
    var set = {};
    list.forEach(function (d) { set[d] = 1; });
    var doneToday = !!set[today];
    var from = doneToday ? today : addDays(today, -1);
    var n = 0;
    while (set[addDays(from, -n)]) n++;
    var best = 0, run = 0, prev = null;
    list.slice().sort().forEach(function (d) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; prev = d; if (run > best) best = run; });
    var week = [];
    for (var i = 6; i >= 0; i--) { var d = addDays(today, -i); week.push({ d: d, on: !!set[d], today: i === 0 }); }
    return { n: n, today: doneToday, best: Math.max(best, n), week: week, ok: !!data };
  }
  var DOW = ["일", "월", "화", "수", "목", "금", "토"];
  function streakCardHtml(ds) {
    var msg = ds.today ? "오늘 " + ds.n + "일째 연속 독서 완료! 내일도 이어 가요."
      : ds.n ? ds.n + "일 연속 독서 중! 오늘 메달을 받으면 " + (ds.n + 1) + "일째가 돼요."
      : "오늘 메달 하나로 연속 독서를 시작해 보세요.";
    var sub = ds.today ? "불꽃이 켜졌어요 🔥" : ds.n ? "자정이 지나면 불꽃이 꺼져요." : "메달(60점 이상)을 받은 날이 독서한 날로 기록돼요.";
    return '<div class="card streak-card' + (ds.today ? " lit" : ds.n ? " warn" : " off") + '">' +
      '<div class="sc-flame"><span class="fl">🔥</span><b>' + ds.n + "</b><small>일째</small></div>" +
      '<div class="sc-body"><b>' + msg + '</b><div class="muted">' + sub + (ds.best ? " · 최고 기록 " + ds.best + "일" : "") + "</div>" +
      '<div class="sc-week">' + ds.week.map(function (w) {
        return '<div class="sd' + (w.on ? " on" : "") + (w.today ? " now" : "") + '"><div class="dot">' + (w.on ? "🔥" : "") + "</div>" + (w.today ? "오늘" : DOW[new Date(w.d + "T00:00:00Z").getUTCDay()]) + "</div>";
      }).join("") + "</div></div></div>";
  }
  function cleanMsg(m) { return String(m || "").replace(/^[a-z]+:\s*/i, ""); }
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function loading() { $app.innerHTML = '<p class="muted center" style="padding:40px 0">불러오는 중...</p>'; }
  function showError(e) {
    $app.innerHTML = '<div class="card"><h2>문제가 생겼어요</h2><p class="err">' + esc(e && e.message ? e.message : e) + '</p><button class="btn" id="back">처음으로</button></div>';
    document.getElementById("back").onclick = function () { location.hash = "#/"; route(); };
  }
  function confetti(count) {
    var colors = ["#e9c46a", "#2d5291", "#e0577a", "#2fa36b", "#c8962a"];
    for (var i = 0; i < count; i++) {
      var c = document.createElement("div");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.8 + "s";
      document.body.appendChild(c);
      setTimeout((function (el) { return function () { el.remove(); }; })(c), 3500);
    }
  }
  function each(sel, fn, root) { Array.prototype.forEach.call((root || document).querySelectorAll(sel), fn); }
  function isStudentSchool() { return state.profile && state.profile.role === "school"; }

  /* ---------- 로그인 ---------- */
  function waitGoogle(fn) {
    if (window.google && google.accounts && google.accounts.id) fn();
    else setTimeout(function () { waitGoogle(fn); }, 200);
  }
  function renderLogin(msg) {
    clearTimer();
    $who.classList.add("hidden");
    $app.innerHTML =
      '<div class="card login"><img class="emblem" src="emblem.png" width="240" height="213" alt="서울문영여자중학교 교표"><div class="kicker" style="margin-top:10px">MOONYOUNG READING PASSPORT</div><h2>문영 독서 여권</h2>' +
      "<p>세계문학을 영어로 읽고, 퀴즈를 풀고, 메달과 스탬프를 모아 보세요.</p>" +
      '<div id="gbtn"></div>' +
      '<p style="font-size:.88rem">학교 계정(@smy.ms.kr)으로 로그인하세요.</p>' +
      '<a class="btn gold small guide-link" href="guide.html" target="_blank" rel="noopener">📘 처음이라면? 사용 설명서 보기</a>' +
      '<div class="err">' + esc(msg || "") + "</div></div>" +
      '<div class="feature-row">' +
      '<div class="feature"><div class="em">📚</div><b>영어로 먼저 읽기</b><span class="muted">어려운 단락만 한국어 힌트</span></div>' +
      '<div class="feature"><div class="em">🥇</div><b>메달과 ⭐ 보너스</b><span class="muted">힌트 없이 통과하면 별</span></div>' +
      '<div class="feature"><div class="em">🗺️</div><b>세계 문학 지도</b><span class="muted">읽은 나라에 스탬프</span></div></div>';
    waitGoogle(function () {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogle });
      google.accounts.id.renderButton(document.getElementById("gbtn"), { theme: "outline", size: "large", text: "signin_with", locale: "ko", shape: "pill" });
    });
  }
  async function onGoogle(resp) {
    var r = await sb.auth.signInWithIdToken({ provider: "google", token: resp.credential });
    if (r.error) renderLogin("로그인에 실패했어요: " + r.error.message);
  }
  async function signOut() {
    await sb.auth.signOut();
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    state.user = null; state.profile = null; state.isAdmin = false; state.revealed = {};
    location.hash = "#/";
    boot();
  }

  /* ---------- 시작 ---------- */
  async function boot() {
    try {
      var s = await sb.auth.getSession();
      var session = s.data && s.data.session;
      if (!session) { state.user = null; renderLogin(); return; }
      state.user = session.user;
      var p = await sb.from("profiles").select("*").eq("id", state.user.id).maybeSingle();
      state.profile = p.data;
      var a = await sb.rpc("is_admin");
      state.isAdmin = !!a.data;
      renderWho();
      route();
    } catch (e) { showError(e); }
  }
  function renderWho() {
    var p = state.profile || {};
    var isSchool = p.role === "school";
    $who.innerHTML =
      '<div class="whoinfo"><span class="badge ' + (isSchool ? "school" : "external") + '">' + (isSchool ? SCHOOL_LABEL : "외부 이용자") + "</span>" +
      (state.isAdmin ? '<span class="badge gold">교사</span>' : "") +
      '<b class="nick">' + esc(p.nickname || "") + "</b></div>" +
      '<div class="whobtn"><a class="btn ghost small guide-link" href="guide.html" target="_blank" rel="noopener">📘 설명서</a><button class="btn ghost small" id="nickbtn">✏️ 닉네임</button>' +
      (state.isAdmin ? '<button class="btn ghost small" id="goteacher">👩‍🏫 교사 화면</button>' : "") +
      '<button class="btn ghost small" id="signout">로그아웃</button></div>';
    $who.classList.remove("hidden");
    document.getElementById("nickbtn").onclick = openNickDialog;
    document.getElementById("signout").onclick = signOut;
    var gt = document.getElementById("goteacher");
    if (gt) gt.onclick = function () { location.hash = "#/teacher"; };
  }
  function openNickDialog() {
    var ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML =
      '<div class="card"><h2>✏️ 닉네임 바꾸기</h2>' +
      '<p class="muted">2~12글자로 원하는 이름을 정해 보세요. 순위표에 이 이름이 보여요. 부적절한 이름은 선생님이 바꿀 수 있어요.</p>' +
      '<input id="nickin" maxlength="12" value="' + esc((state.profile && state.profile.nickname) || "") + '">' +
      '<div class="err" id="nickerr"></div>' +
      '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="nicksave">저장</button><button class="btn ghost" id="nickrand">🎲 랜덤 이름</button><button class="btn ghost" id="nickcancel">취소</button></div></div>';
    document.body.appendChild(ov);
    var input = document.getElementById("nickin");
    input.focus(); input.select();
    function done(nick) {
      state.profile.nickname = nick; renderWho(); ov.remove(); toast("닉네임: " + nick);
      if ((location.hash || "#/") === "#/") route();
    }
    ov.onclick = function (e) { if (e.target === ov) ov.remove(); };
    document.getElementById("nickcancel").onclick = function () { ov.remove(); };
    document.getElementById("nickrand").onclick = async function () {
      var r = await sb.rpc("reroll_nickname");
      if (r.error) return (document.getElementById("nickerr").textContent = cleanMsg(r.error.message));
      done(r.data);
    };
    document.getElementById("nicksave").onclick = async function () {
      var r = await sb.rpc("set_nickname", { p_nick: input.value });
      if (r.error) return (document.getElementById("nickerr").textContent = cleanMsg(r.error.message));
      done(r.data);
    };
    input.onkeydown = function (e) { if (e.key === "Enter") document.getElementById("nicksave").click(); };
  }

  /* ---------- 라우터 ---------- */
  function route() {
    clearTimer();
    if (!state.user) return;
    var h = location.hash || "#/";
    var m = h.match(/^#\/(book|quiz)\/(.+)$/);
    var go;
    if (m && m[1] === "book") go = renderBook(decodeURIComponent(m[2]));
    else if (m && m[1] === "quiz") go = renderQuiz(decodeURIComponent(m[2]));
    else if (h === "#/teacher") go = renderTeacher();
    else go = renderHome();
    Promise.resolve(go).catch(showError);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  document.getElementById("home-link").onclick = function () { location.hash = "#/"; };

  /* ---------- 홈 ---------- */
  async function renderHome() {
    loading();
    var calls = [sb.rpc("my_summary"), sb.rpc("leaderboard"), sb.from("books").select("id,featured"), sb.rpc("my_days")];
    if (isStudentSchool() && state.profile.grade) calls.push(sb.rpc("class_progress"));
    var res = await Promise.all(calls);
    if (res[0].error) throw res[0].error;
    var sum = res[0].data || {};
    var board = res[1].data || [];
    var featured = {};
    (res[2].data || []).forEach(function (r) { if (r.featured) featured[r.id] = true; });
    var ds = dayStreak(res[3] && !res[3].error ? res[3].data : null);
    var cls = res[4] && !res[4].error ? res[4].data : null;

    var byId = {};
    (sum.books || []).forEach(function (b) { byId[b.book_id] = b; });
    state.summary = sum;
    var books = window.BOOKS || [];
    function st(b) { var r = byId[b.id]; return !r ? "new" : (r.medal ? "done" : "trying"); }

    // 내 여권 도장 · 여행한 나라 · 대륙 배지
    var myStamp = {};
    books.forEach(function (b) { var r = byId[b.id]; if (r && r.medal) myStamp[b.id] = stampOf(b, r); });
    var visited = {};
    Object.keys(myStamp).forEach(function (bid) { var c = COUNTRIES[myStamp[bid]]; visited[c ? c.map : myStamp[bid]] = true; });
    var visitedN = Object.keys(visited).length;
    var contDone = {};
    Object.keys(visited).forEach(function (m) { if (CONT_OF[m]) contDone[CONT_OF[m]] = true; });
    var contN = Object.keys(contDone).length;
    var done = books.filter(function (b) { return st(b) === "done"; }).length;
    var pct = books.length ? Math.round((done / books.length) * 100) : 0;

    // 레벨 로드 계산
    var lvData = LEVELS.map(function (lv) {
      var inLv = books.filter(function (b) { return levelOf(b) === lv; });
      var d = inLv.filter(function (b) { return st(b) === "done"; }).length;
      var need = Math.min(LEVEL_GOAL, inLv.length);
      return { lv: lv, total: inLv.length, done: d, earned: inLv.length > 0 && d >= need };
    });
    var earned = lvData.filter(function (x) { return x.earned; });
    var title = earned.length ? earned[earned.length - 1] : null;
    var currentLv = (lvData.filter(function (x) { return x.total > 0 && !x.earned; })[0] || {}).lv;

    // 주간 목표 · 연속 주
    var weeks = sum.weeks || [];
    var wset = {};
    weeks.forEach(function (w) { wset[w] = 1; });
    var ws = sum.week_start || new Date().toISOString().slice(0, 10);
    var weekBooks = sum.week_books || 0;
    var start = wset[ws] ? ws : addDays(ws, -7);
    var streak = 0;
    while (wset[addDays(start, -7 * streak)]) streak++;
    var weekDots = [];
    for (var i = 7; i >= 0; i--) {
      var d0 = addDays(ws, -7 * i);
      weekDots.push('<div class="wk ' + (wset[d0] ? "on " : "") + (i === 0 ? "now" : "") + '"><div class="dot">' + (wset[d0] ? "🔥" : "") + "</div>" + (i === 0 ? "이번 주" : Number(d0.slice(5, 7)) + "/" + Number(d0.slice(8, 10))) + "</div>");
    }

    function card(b) {
      var r = byId[b.id];
      var medal = r && r.medal;
      var c = countryOf(b);
      return '<div class="book ' + (st(b) === "new" ? "todo" : "") + '" style="background:' + esc(b.color) + '" data-id="' + esc(b.id) + '">' +
        (medal ? '<div class="stamp-corner' + (r.star ? " star" : "") + '">' + MEDALS[medal].em + "</div>" : "") +
        '<div class="cover">' + esc(b.emoji) + "</div>" +
        '<div><div class="t">' + esc(b.title) + '</div><div class="a">' + esc(b.titleKo) + " · " + esc(b.authorKo) + "</div></div>" +
        '<div><span class="lv-tag">' + esc(levelOf(b)) + " · " + b.words + "단어" + (c ? " · " + flag(c.iso) + " " + esc(c.ko) : "") + "</span>" +
        '<div class="st">' + (r ? "최고 " + r.best + "/" + r.total + " · " + r.attempts + "회 도전" : "아직 도전 전") + "</div></div></div>";
    }
    function section(title, sub, list, note) {
      if (!list.length) return "";
      return '<div class="card"><h2>' + title + (sub ? '<span class="sub">' + sub + "</span>" : "") + "</h2>" + (note ? '<p class="muted" style="margin-top:-6px">' + note + "</p>" : "") +
        '<div class="shelf">' + list.map(card).join("") + "</div></div>";
    }
    function bindCards(root) {
      each(".book", function (el) {
        el.onclick = function () { state.bookTab = "story"; location.hash = "#/book/" + encodeURIComponent(el.getAttribute("data-id")); };
      }, root);
    }

    var featuredList = books.filter(function (b) { return featured[b.id]; });
    var trying = books.filter(function (b) { return st(b) === "trying"; });
    var doneLv = books.filter(function (b) { return st(b) === "done"; }).map(function (b) { return LEVELS.indexOf(levelOf(b)); });
    var cur = doneLv.length ? Math.max.apply(null, doneLv) : -1;
    var rec = books.filter(function (b) { return st(b) === "new" && !featured[b.id]; }).sort(function (a, b) {
      function key(k) { return cur < 0 ? k : (k >= cur ? k - cur : cur - k + 0.5); }
      return key(LEVELS.indexOf(levelOf(a))) - key(LEVELS.indexOf(levelOf(b)));
    }).slice(0, 4);

    var nick = (state.profile && state.profile.nickname) || "";
    var show = state.profile && state.profile.show_on_board;
    var isSchool = isStudentSchool();
    var medalRing = function (em, n, label) {
      return '<div class="pp-medal ' + (n ? "on" : "") + '"><div class="ring">' + em + (n ? '<span class="cnt">' + n + "</span>" : "") + "</div><small>" + label + "</small></div>";
    };

    var html =
      '<section class="passport"><div class="pp-head"><div class="pp-emblem"><img src="emblem.png" width="240" height="213" alt="서울문영여자중학교 교표"></div><div>' +
      '<div class="pp-kicker">MOONYOUNG READING PASSPORT</div><div class="pp-name">' + esc(nick) + "</div>" +
      '<div class="pp-level">' + (title ? LEVEL_INFO[title.lv].em + " " + title.lv + " " + LEVEL_INFO[title.lv].name : "여행 준비 중 · 첫 메달에 도전해 보세요") + "</div></div></div>" +
      '<div class="pp-stats"><div class="pp-stat"><b>' + done + "/" + books.length + "</b><span>작품 완료</span></div>" +
      '<div class="pp-stat"><b>' + (sum.words || 0).toLocaleString() + "</b><span>읽은 단어</span></div>" +
      '<div class="pp-stat"><b>' + (ds.n ? "🔥" + ds.n + "일" : "-") + "</b><span>연속 독서</span></div>" +
      '<div class="pp-stat"><b>🌍 ' + visitedN + "</b><span>여행한 나라</span></div></div>" +
      '<div class="progress"><div id="bar"></div></div>' +
      '<div class="pp-medals">' + medalRing("🥇", sum.gold || 0, "금메달") + medalRing("🥈", sum.silver || 0, "은메달") + medalRing("🥉", sum.bronze || 0, "동메달") + medalRing("⭐", sum.stars || 0, "무힌트") + "</div></section>" +
      (ds.ok ? streakCardHtml(ds) : "") +

      '<div class="grid2"><div class="card"><h2>🎯 이번 주 목표<span class="sub">한 주에 ' + WEEK_GOAL + "작품</span></h2>" +
      '<div class="goal-big"><div class="icon">' + (weekBooks >= WEEK_GOAL ? "✅" : "📖") + "</div><div><b>" +
      (weekBooks >= WEEK_GOAL ? "이번 주 목표 달성! (" + weekBooks + "작품)" : "이번 주에 한 작품 완료해 볼까요?") + '</b><div class="muted">' +
      (streak ? "🏆 " + streak + "주 연속 주간 목표 달성 중이에요." : "메달을 받으면 이번 주에 불이 켜져요.") + "</div></div></div>" +
      '<div class="weeks">' + weekDots.join("") + "</div></div>" +
      (cls
        ? '<div class="card"><h2>🤝 우리 반 함께 읽기<span class="sub">' + cls.grade + "학년 " + cls.class_no + "반</span></h2>" +
          '<div class="class-words">' + Number(cls.words || 0).toLocaleString() + " <small>/ " + Number(cls.goal || 0).toLocaleString() + " 단어</small></div>" +
          '<div class="progress navy" style="margin-top:8px"><div id="clsbar"></div></div>' +
          '<div class="class-nums"><span>참여 ' + (cls.active || 0) + "/" + (cls.members || 0) + "명</span><span>메달 " + (cls.medals || 0) + "개</span></div></div>"
        : '<div class="card"><h2>🧭 오늘의 추천</h2><p class="muted">' + (rec.length ? "아래 \"다음에 읽을 책\"에서 하나 골라 시작해 보세요." : "모든 책에 도전했어요. 새 책을 기다려 주세요!") + "</p></div>") +
      "</div>" +

      '<div class="card"><h2>🛤️ 레벨 로드<span class="sub">수준별 ' + LEVEL_GOAL + "작품 완료 시 칭호</span></h2><div class=\"road\">" +
      lvData.map(function (x) {
        var info = LEVEL_INFO[x.lv];
        return '<div class="lv ' + (x.total ? "has " : "") + (x.earned ? "earned " : "") + (x.lv === currentLv ? "current" : "") + '"><div class="circle">' + info.em + '</div><div class="code">' + x.lv + '</div><div class="name">' + info.name + '</div><div class="count">' + (x.total ? x.done + "/" + Math.min(LEVEL_GOAL, x.total) : "준비 중") + "</div></div>";
      }).join("") + "</div></div>" +

      section("🌟 선생님 추천", "", featuredList, "선생님이 골라 준 책이에요.") +
      section("🔥 이어서 도전하기", "", trying, "아직 메달을 받지 못한 책이에요. 한 번 더 도전해 볼까요?") +
      section("🧭 다음에 읽을 책", "", rec, cur < 0 ? "쉬운 책부터 시작해 보세요." : "내 수준에 맞춰 골랐어요.") +

      '<div class="card" id="mapcard"><h2>🗺️ 세계 문학 지도<span class="sub">나라를 누르면 그 나라 책만 보여요</span></h2>' +
      (cls ? '<div class="seg" id="mapseg"><button data-m="me">🛂 내 지도</button><button data-m="class">🤝 우리 반 지도</button></div>' : "") +
      '<div class="mapbox" id="worldmap"><div class="map-loading">지도를 펼치는 중...</div></div>' +
      '<div class="legend" id="maplegend"></div>' +
      '<div class="chips" id="countrychips"></div>' +
      '<div class="conts-title">🏅 대륙 배지 <span class="muted">' + contN + "/" + CONTINENTS.length + "</span></div>" +
      '<div class="conts">' + CONTINENTS.map(function (c) {
        return '<div class="cont ' + (contDone[c.id] ? "on" : "") + '"><div class="em">' + c.em + "</div><b>" + c.name + "</b><small>" + (contDone[c.id] ? "첫 도장 완료!" : "아직이에요") + "</small></div>";
      }).join("") + "</div></div>" +

      '<div class="card" id="shelfcard"><h2>📚 책장</h2><div class="pills" id="lvpills"></div><div class="pills" id="stpills"></div>' +
      '<input id="q" class="search" type="search" placeholder="🔍 제목, 작가, 나라 검색" value="' + esc(state.shelf.q) + '">' +
      '<div id="shelfres"></div></div>' +

      '<div class="card board"><h2>🏆 메달 순위 TOP 10</h2>' +
      (board.length
        ? "<ol>" + board.map(function (r, i) {
            var rk = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
            return '<li class="' + (i < 3 ? "top3 " : "") + (r.nickname === nick ? "me" : "") + '"><span class="rk">' + rk + '</span><span class="nm">' + esc(r.nickname) + '</span><span class="ms">🥇' + r.gold + " 🥈" + r.silver + " 🥉" + r.bronze + " ⭐" + r.stars + "</span></li>";
          }).join("") + "</ol>"
        : '<p class="muted">아직 순위가 없어요. 첫 메달의 주인공이 되어 보세요!</p>') +
      '<p class="muted" style="margin-top:10px">금 → 은 → 동 → ⭐ 순으로 정렬돼요. 순위에는 닉네임만 보여요.' + (isSchool ? "" : " (외부 이용자는 순위에 나오지 않아요.)") + "</p>" +
      (isSchool ? '<label class="muted"><input type="checkbox" id="showboard" ' + (show ? "checked" : "") + "> 내 닉네임을 순위표에 보이기</label>" : "") + "</div>";
    $app.innerHTML = html;

    // 책장
    var S = state.shelf;
    function drawPills() {
      var lv = [["all", "전체", books.length]].concat(LEVELS.map(function (l) { return [l, l, books.filter(function (b) { return levelOf(b) === l; }).length]; }));
      var stt = [["all", "전체"], ["new", "안 읽음"], ["trying", "도전 중"], ["done", "완료"]];
      document.getElementById("lvpills").innerHTML = lv.map(function (x) {
        return '<button class="pill ' + (S.level === x[0] ? "on" : "") + (x[2] ? "" : " empty") + '" data-lv="' + x[0] + '">' + x[1] + " <small>" + x[2] + "</small></button>";
      }).join("");
      document.getElementById("stpills").innerHTML = stt.map(function (x) {
        return '<button class="pill ' + (S.status === x[0] ? "on" : "") + '" data-st="' + x[0] + '">' + x[1] + "</button>";
      }).join("");
      each("#lvpills .pill", function (el) { el.onclick = function () { S.level = el.getAttribute("data-lv"); drawPills(); drawShelf(); }; });
      each("#stpills .pill", function (el) { el.onclick = function () { S.status = el.getAttribute("data-st"); drawPills(); drawShelf(); }; });
    }
    function drawShelf() {
      var q = S.q.trim().toLowerCase();
      var list = books.filter(function (b) {
        if (S.level !== "all" && levelOf(b) !== S.level) return false;
        if (S.status !== "all" && st(b) !== S.status) return false;
        if (S.country && !placesOf(b).some(function (k) { return sameCountry(k, S.country); })) return false;
        if (q) {
          var hay = [b.title, b.titleKo, b.author, b.authorKo, b.country, countryKo(b)].join(" ").toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
      var note = "";
      if (S.country) {
        var c = COUNTRIES[S.country];
        note = '<div class="filter-note"><span class="badge navy">' + (c ? flag(c.iso) + " " + esc(c.ko) : esc(S.country)) + ' 책만 보는 중</span><button class="btn ghost small" id="clearcountry">✕ 전체 보기</button></div>';
      }
      var out;
      if (!list.length) {
        out = '<p class="muted">' + (S.level !== "all" && S.status === "all" && !q && !S.country ? S.level + " 수준의 책은 아직 준비 중이에요." : "조건에 맞는 책이 없어요.") + "</p>";
      } else if (S.status === "all" && !q && !S.country) {
        var open = list.filter(function (b) { return st(b) !== "done"; });
        var dn = list.filter(function (b) { return st(b) === "done"; });
        out = (open.length ? '<div class="shelf">' + open.map(card).join("") + "</div>" : '<p class="muted">읽을 책을 모두 완료했어요! 🎉</p>') +
          (dn.length ? '<details class="donebox"><summary>🏅 완료한 책 ' + dn.length + '권</summary><div class="shelf" style="margin-top:12px">' + dn.map(card).join("") + "</div></details>" : "");
      } else {
        out = '<p class="muted" style="margin-top:-4px">' + list.length + '권</p><div class="shelf">' + list.map(card).join("") + "</div>";
      }
      var box = document.getElementById("shelfres");
      box.innerHTML = note + out;
      bindCards(box);
      var cc = document.getElementById("clearcountry");
      if (cc) cc.onclick = function () { pickCountry(""); };
      each("#countrychips .chip", function (el) { el.classList.toggle("on", !!S.country && sameCountry(el.getAttribute("data-c"), S.country)); });
      each("#worldmap .cty", function (el) { el.classList.toggle("sel", !!S.country && sameCountry(el.getAttribute("data-c"), S.country)); });
    }
    function pickCountry(key) {
      S.country = S.country === key ? "" : key;
      drawShelf();
      if (S.country) document.getElementById("shelfcard").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    drawPills();
    drawShelf();
    bindCards($app);
    document.getElementById("q").oninput = function () { S.q = this.value; drawShelf(); };

    // 지도 데이터: 내 지도 = 내가 찍은 도장, 우리 반 지도 = 반 친구들 도장 합계(누가 찍었는지는 보이지 않음)
    var ORDER = { gold: 3, silver: 2, bronze: 1 };
    var MEDAL_FILL = { gold: "#d4a017", silver: "#8d99ab", bronze: "#b8702e" };
    function myEntries() {
      var by = {};
      books.forEach(function (b) {
        placesOf(b).forEach(function (k, idx) {
          var info = COUNTRIES[k];
          if (!info) return;
          var e = by[info.map] || (by[info.map] = { key: k, info: info, books: 0, stamps: 0, best: null, author: false });
          e.books++;
          if (idx === 0) e.author = true;
        });
        var r = byId[b.id];
        var si = r && r.medal ? COUNTRIES[myStamp[b.id]] : null;
        if (si && by[si.map]) {
          var e2 = by[si.map];
          e2.stamps++; e2.key = myStamp[b.id];
          if (!e2.best || ORDER[r.medal] > ORDER[e2.best]) e2.best = r.medal;
        }
      });
      return Object.keys(by).map(function (m) {
        var e = by[m];
        return { key: e.key, info: e.info, level: e.stamps ? 3 : 0, done: e.stamps > 0,
          pin: e.stamps ? MEDALS[e.best].em : (e.author ? "📘" : ""), pinFill: e.stamps ? MEDAL_FILL[e.best] : "#2d5291",
          title: e.info.ko + (e.stamps ? " · 내 도장 " + e.stamps + "개" : " · 관련 책 " + e.books + "권"),
          chip: e.stamps ? MEDALS[e.best].em + " " + e.stamps : e.books + "권" };
      });
    }
    function classEntries() {
      var by = {};
      ((cls && cls.countries) || []).forEach(function (x) {
        var info = COUNTRIES[x.country];
        if (!info) return;
        var e = by[info.map] || (by[info.map] = { key: x.country, info: info, count: 0 });
        e.count += x.count;
      });
      books.forEach(function (b) {
        placesOf(b).forEach(function (k) { var info = COUNTRIES[k]; if (info && !by[info.map]) by[info.map] = { key: k, info: info, count: 0 }; });
      });
      var max = 1;
      Object.keys(by).forEach(function (m) { max = Math.max(max, by[m].count); });
      return Object.keys(by).map(function (m) {
        var e = by[m];
        return { key: e.key, info: e.info, level: e.count ? Math.max(1, Math.ceil((e.count / max) * 3)) : 0, done: e.count > 0,
          pin: e.count ? String(e.count) : "", pinFill: "#2d5291", count: true,
          title: e.info.ko + " · 우리 반 도장 " + e.count + "개", chip: "도장 " + e.count };
      });
    }
    var mapMode = cls && state.mapMode === "class" ? "class" : "me";
    function drawMapUI() {
      var entries = mapMode === "class" ? classEntries() : myEntries();
      document.getElementById("maplegend").innerHTML = mapMode === "class"
        ? '<span><i style="background:#f6dfa0"></i>도장 조금</span><span><i style="background:#e0a92e"></i>도장 많이</span><span><i style="background:#b9c9ea"></i>아직 아무도 안 간 나라</span>'
        : '<span><i style="background:#ebc35a"></i>내 도장을 찍은 나라</span><span><i style="background:#b9c9ea"></i>관련 책이 있는 나라</span>';
      entries.sort(function (a, b) { return (b.done ? 1 : 0) - (a.done ? 1 : 0); });
      document.getElementById("countrychips").innerHTML = entries.map(function (e) {
        return '<button class="chip ' + (e.done ? "done" : "") + '" data-c="' + esc(e.key) + '">' + flag(e.info.iso) + " " + esc(e.info.ko) + " <small>" + esc(e.chip) + "</small></button>";
      }).join("");
      each("#countrychips .chip", function (el) { el.onclick = function () { pickCountry(el.getAttribute("data-c")); }; });
      each("#mapseg button", function (el) { el.classList.toggle("on", el.getAttribute("data-m") === mapMode); });
      drawWorldMap(entries, pickCountry).then(function () { drawShelf(); }, function () {});
    }
    each("#mapseg button", function (el) {
      el.onclick = function () { mapMode = state.mapMode = el.getAttribute("data-m"); drawMapUI(); };
    });
    drawMapUI();

    setTimeout(function () {
      var bar = document.getElementById("bar"); if (bar) bar.style.width = pct + "%";
      var cb = document.getElementById("clsbar"); if (cb && cls) cb.style.width = Math.min(100, Math.round((cls.words || 0) / Math.max(1, cls.goal || 1) * 100)) + "%";
    }, 80);
    var sbx = document.getElementById("showboard");
    if (sbx) sbx.onchange = async function () {
      var r = await sb.rpc("set_show_on_board", { p_show: sbx.checked });
      if (r.error) return toast("설정을 바꾸지 못했어요");
      state.profile.show_on_board = sbx.checked; toast(sbx.checked ? "순위표에 보여요" : "순위표에서 숨겼어요");
      renderHome();
    };
  }

  /* ---------- 세계 지도 ---------- */
  // entries: [{ key, info, level(0~3), pin, pinFill, title, count }]
  async function drawWorldMap(clist, onPick) {
    var box = document.getElementById("worldmap");
    if (!box) return;
    try {
      await loadScript(LIBS.d3);
      await loadScript(LIBS.topo);
      if (!worldCache) worldCache = await fetch(LIBS.world).then(function (r) { if (!r.ok) throw new Error("map"); return r.json(); });
    } catch (e) {
      box.innerHTML = '<div class="map-loading">지도를 불러오지 못했어요. 아래 나라 버튼으로 골라 보세요.</div>';
      throw e;
    }
    if (!document.body.contains(box)) return;
    var feats = topojson.feature(worldCache, worldCache.objects.countries).features.filter(function (f) { return f.properties.name !== "Antarctica"; });
    var W = 960, H = 470;
    var proj = d3.geoNaturalEarth1().fitExtent([[6, 6], [W - 6, H - 6]], { type: "FeatureCollection", features: feats });
    var path = d3.geoPath(proj);
    var byMap = {};
    clist.forEach(function (c) { if (c.info) byMap[c.info.map] = c; });
    var paths = feats.map(function (f) {
      var c = byMap[f.properties.name];
      var cls = c ? (c.level ? "cty lv" + c.level : "cty has") : "cty";
      return '<path class="' + cls + '" d="' + path(f) + '"' + (c ? ' data-c="' + esc(c.key) + '"' : "") + "><title>" + esc(c ? c.title : f.properties.name) + "</title></path>";
    }).join("");
    // 핀 위치: 유럽처럼 가까운 나라는 핀이 겹치지 않게 조금씩 밀어내고, 원래 위치까지 선을 그어요
    var R = 13, GAP = 2 * R + 4;
    var pinList = clist.filter(function (c) { return c.info && c.info.at && c.pin; }).map(function (c) {
      var p = proj(c.info.at);
      return p ? { c: c, ox: p[0], oy: p[1], x: p[0], y: p[1] } : null;
    }).filter(Boolean);
    for (var it = 0; it < 60; it++) {
      for (var a = 0; a < pinList.length; a++) {
        for (var b2 = a + 1; b2 < pinList.length; b2++) {
          var P = pinList[a], Q = pinList[b2];
          var dx = Q.x - P.x, dy = Q.y - P.y, dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          if (dist < GAP) {
            var push = (GAP - dist) / 2, ux = dx / dist, uy = dy / dist;
            if (dist < 0.02) { ux = Math.cos(a + b2); uy = Math.sin(a + b2); }
            P.x -= ux * push; P.y -= uy * push; Q.x += ux * push; Q.y += uy * push;
          }
        }
      }
    }
    var pins = pinList.map(function (p) {
      var c = p.c;
      var moved = Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy) > 3;
      return (moved ? '<line x1="' + p.ox.toFixed(1) + '" y1="' + p.oy.toFixed(1) + '" x2="' + p.x.toFixed(1) + '" y2="' + p.y.toFixed(1) + '" stroke="#2d5291" stroke-width="1.2" stroke-dasharray="2 2"></line><circle cx="' + p.ox.toFixed(1) + '" cy="' + p.oy.toFixed(1) + '" r="2.5" fill="#2d5291"></circle>' : "") +
        '<g class="pin' + (c.count ? " count" : "") + '" data-c="' + esc(c.key) + '" transform="translate(' + p.x.toFixed(1) + "," + p.y.toFixed(1) + ')"><circle r="' + R + '" fill="' + c.pinFill + '"></circle><text y="1">' + esc(c.pin) + "</text><title>" + esc(c.title) + "</title></g>";
    }).join("");
    box.innerHTML = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="세계 문학 지도">' + paths + pins + "</svg>";
    each("[data-c]", function (el) { el.onclick = function () { onPick(el.getAttribute("data-c")); }; }, box);
  }

  /* ---------- 책 읽기 ---------- */
  function revealBtn(key, label, hintIdx) {
    return '<button class="btn ghost small reveal" data-k="' + key + '"' + (hintIdx != null ? ' data-hint="' + hintIdx + '"' : "") + ">" + label + "</button>";
  }
  // 여권 도장: 메달을 받은 책은 후보 나라 중 한 곳을 골라 도장을 찍고, 나중에 바꿀 수 있어요
  function myRecord(bookId) {
    return ((state.summary && state.summary.books) || []).filter(function (x) { return x.book_id === bookId; })[0] || null;
  }
  function stampBoxHtml(b, r) {
    var p = placesOf(b).filter(function (k) { return COUNTRIES[k]; });
    if (!p.length) return "";
    var cur = r && r.medal ? stampOf(b, r) : null;
    var head = cur ? "🛂 내 여권 도장: <b>" + countryLabel(cur) + "</b>" : "🛂 메달을 받으면 여권에 도장을 찍을 수 있어요";
    var sub = p.length > 1 ? (cur ? "다른 나라로 바꿀 수 있어요 (첫 번째는 작가의 나라예요)" : "후보 나라 (첫 번째는 작가의 나라예요)") : "작가의 나라예요";
    return '<div class="stampbox"><div class="sb-head">' + head + '</div><div class="sb-sub">' + sub + '</div><div class="chips">' +
      p.map(function (k, i) {
        return '<button class="chip' + (k === cur ? " on" : "") + '" data-stamp="' + esc(k) + '"' + (cur && p.length > 1 ? "" : " disabled") + ">" + countryLabel(k) + (i === 0 ? " <small>작가</small>" : "") + "</button>";
      }).join("") + "</div></div>";
  }
  function bindStampBox(b, after) {
    each(".stampbox [data-stamp]", function (el) {
      el.onclick = async function () {
        var k = el.getAttribute("data-stamp");
        each(".stampbox [data-stamp]", function (x) { x.disabled = true; });
        var res = await sb.rpc("set_stamp", { p_book_id: b.id, p_country: k });
        if (res.error) { toast("도장을 바꾸지 못했어요: " + cleanMsg(res.error.message)); return after(); }
        var r = myRecord(b.id);
        if (r) r.stamp = k;
        toast("🛂 " + (COUNTRIES[k] ? COUNTRIES[k].ko : k) + "에 도장을 찍었어요!");
        after();
      };
    });
  }
  async function renderBook(id) {
    var b = findBook(id);
    if (!b) return showError("책을 찾을 수 없어요.");
    if (!document.getElementById("bookbody")) loading();
    var got = await Promise.all([loadContent(id), sb.rpc("my_hint_count", { p_book_id: id }), state.summary ? null : sb.rpc("my_summary")]);
    if (got[2] && !got[2].error) state.summary = got[2].data || {};
    var c = got[0];
    var hintCount = got[1].data || 0;
    var rv = state.revealed[id] || (state.revealed[id] = {});
    var tabs = [["story", "📖 이야기"], ["analysis", "🔎 분석"], ["chars", "🎭 인물"], ["vocab", "🔤 단어장"]];
    var body = "";
    if (state.bookTab === "story") {
      body = '<div class="hintnote">처음에는 영어만 보여요. 어려운 단락은 <b>💬 한국어 보기</b>로 힌트를 볼 수 있어요. ' +
        "이 책에서 번역을 한 번도 보지 않고 퀴즈를 통과하면 <b>⭐ 무힌트 보너스</b>! " +
        "(지금까지 본 번역: <b>" + hintCount + "</b>개 단락)</div>" +
        c.story.map(function (p, i) {
          var key = "p" + i;
          return '<div class="para"><div class="num">' + (i + 1) + '</div><div class="body"><div class="en">' + esc(p.en) + "</div>" +
            (rv[key] ? '<div class="ko">' + esc(p.ko) + "</div>" : revealBtn(key, "💬 한국어 보기 (힌트)", i)) + "</div></div>";
        }).join("");
    } else if (state.bookTab === "analysis") {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.analysis.map(function (a, i) {
        var key = "a" + i;
        return '<div class="kv"><b>' + esc(a.label) + "</b>" + esc(a.en) +
          (rv[key] ? '<div class="muted" style="margin-top:4px">' + esc(a.ko) + "</div>" : "<div>" + revealBtn(key, "💬 보기") + "</div>") + "</div>";
      }).join("");
    } else if (state.bookTab === "chars") {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.characters.map(function (ch, i) {
        var key = "c" + i;
        return '<div class="kv"><b>' + esc(ch.name) + "</b>" + esc(ch.en) +
          (rv[key] ? '<div class="muted" style="margin-top:4px">' + esc(ch.ko) + "</div>" : "<div>" + revealBtn(key, "💬 보기") + "</div>") + "</div>";
      }).join("");
    } else {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.vocab.map(function (g, gi) {
        return '<h3 class="vocab-h">' + esc(g.level) + '</h3><div class="scroll"><table><tr><th>단어</th><th>뜻</th><th>영영 풀이</th></tr>' +
          g.items.map(function (w, wi) {
            var key = "v" + gi + "-" + wi;
            return "<tr><td><b>" + esc(w[0]) + '</b> <span class="muted">' + esc(w[1]) + "</span></td><td>" +
              (rv[key] ? esc(w[2]) : revealBtn(key, "뜻 보기")) + "</td><td>" + esc(w[3]) + "</td></tr>";
          }).join("") + "</table></div>";
      }).join("");
    }
    var cinfo = countryOf(b);
    var scrollY = window.scrollY;
    $app.innerHTML =
      '<div class="book-hero" style="background:' + esc(b.color) + '"><button class="btn ghost small" id="tohome">← 책장</button>' +
      '<div class="cover" style="margin-top:10px">' + esc(b.emoji) + "</div><h2>" + esc(b.title) + "</h2>" +
      '<div class="by">' + esc(b.titleKo) + " · " + esc(b.author) + " (" + esc(b.authorKo) + ")</div>" +
      '<div class="tags"><span>CEFR ' + esc(b.cefrLabel || b.cefr) + "</span>" + (b.lexile ? "<span>Lexile " + esc(b.lexile) + "</span>" : "") + (b.ar ? "<span>AR " + esc(b.ar) + "</span>" : "") + "<span>" + b.words + "단어</span>" +
      (cinfo ? "<span>" + flag(cinfo.iso) + " " + esc(cinfo.ko) + "</span>" : "") + "</div>" + stampBoxHtml(b, myRecord(b.id)) + "</div>" +
      '<div class="card" id="bookbody"><div class="tabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.bookTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>" + body +
      '<div class="quiz-cta"><button class="btn gold big" id="goquiz">다 읽었어요 · 퀴즈 풀기 ✏️</button></div></div>';
    window.scrollTo(0, scrollY);
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("goquiz").onclick = function () { location.hash = "#/quiz/" + encodeURIComponent(b.id); };
    bindStampBox(b, function () { renderBook(id).catch(showError); });
    each(".tabs button", function (el) {
      el.onclick = function () { state.bookTab = el.getAttribute("data-t"); renderBook(id).catch(showError); };
    });
    each(".reveal", function (el) {
      el.onclick = async function () {
        el.disabled = true;
        var hint = el.getAttribute("data-hint");
        if (hint != null) {
          var r = await sb.rpc("log_hint", { p_book_id: id, p_para: parseInt(hint, 10) });
          if (r.error) { el.disabled = false; return toast("기록하지 못했어요. 다시 눌러 주세요."); }
        }
        rv[el.getAttribute("data-k")] = true;
        renderBook(id).catch(showError);
      };
    });
  }

  /* ---------- 퀴즈 ---------- */
  async function renderQuiz(id) {
    var b = findBook(id);
    if (!b) return showError("책을 찾을 수 없어요.");
    loading();
    var res = await Promise.all([sb.rpc("quiz_status", { p_book_id: id }), sb.rpc("my_hint_count", { p_book_id: id })]);
    if (res[0].error) throw res[0].error;
    var info = res[0].data || {};
    var hintCount = res[1].data || 0;
    var wait = info.next_allowed_at ? new Date(info.next_allowed_at).getTime() - Date.now() : 0;
    if (wait > 0) return renderWait(b, info);

    var qz = await sb.rpc("get_quiz", { p_book_id: id });
    if (qz.error) throw qz.error;
    var qs = qz.data || [];
    if (!qs.length) return showError("이 책의 퀴즈가 아직 없어요.");

    $app.innerHTML =
      '<div class="book-hero" style="background:' + esc(b.color) + '"><button class="btn ghost small" id="toread">← 읽기로</button>' +
      "<h2 style=\"margin-top:12px\">✏️ " + esc(b.title) + " 퀴즈</h2>" +
      '<div class="by">총 ' + qs.length + "문항 · 문제와 보기 순서는 매번 달라져요 · 제출 후 10분 뒤 재도전" +
      (info.best != null ? " · 내 최고 " + info.best + "/" + info.total : "") + "</div></div>" +
      '<div class="hintnote">' + (hintCount === 0 ? "지금까지 번역을 보지 않았어요. 이대로 통과하면 <b>⭐ 무힌트 보너스</b>!" : "번역을 본 단락: <b>" + hintCount + "</b>개 (이 책에서는 ⭐ 무힌트 보너스를 받을 수 없어요)") + "</div>" +
      qs.map(function (q, i) {
        return '<div class="q" id="q' + q.no + '"><div class="qt"><span class="qn">' + (i + 1) + "</span>" + esc(q.question) + "</div>" +
          q.choices.map(function (c) {
            return '<label class="opt"><input type="radio" name="q' + q.no + '" value="' + esc(c) + '"><span>' + esc(c) + "</span></label>";
          }).join("") + "</div>";
      }).join("") +
      '<div class="submitbar"><span class="answered-count" id="answered">0 / ' + qs.length + '</span><button class="btn gold big" id="submit">제출하기</button></div><div class="err center" id="qerr"></div>';

    document.getElementById("toread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(id); };
    function countAnswered() {
      var n = qs.filter(function (q) { return document.querySelector('input[name="q' + q.no + '"]:checked'); }).length;
      document.getElementById("answered").textContent = n + " / " + qs.length;
    }
    each(".opt input", function (inp) {
      inp.onchange = function () {
        each('input[name="' + inp.name + '"]', function (o) { o.parentNode.classList.toggle("sel", o.checked); });
        inp.closest(".q").classList.add("answered");
        countAnswered();
      };
    });
    document.getElementById("submit").onclick = async function () {
      var answers = {}, missing = [];
      qs.forEach(function (q, i) {
        var el = document.querySelector('input[name="q' + q.no + '"]:checked');
        if (el) answers[q.no] = el.value; else missing.push(i + 1);
      });
      var err = document.getElementById("qerr");
      if (missing.length) {
        err.textContent = "아직 답하지 않은 문항: " + missing.join(", ") + "번";
        var first = qs[missing[0] - 1];
        document.getElementById("q" + first.no).scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      this.disabled = true; err.textContent = "";
      var r = await sb.rpc("submit_quiz", { p_book_id: id, p_answers: answers });
      if (r.error) {
        this.disabled = false;
        if (/cooldown/.test(r.error.message)) { toast("아직 대기 시간이에요"); return renderQuiz(id); }
        err.textContent = "제출하지 못했어요: " + cleanMsg(r.error.message); return;
      }
      renderResult(b, r.data);
    };
  }
  function renderWait(b, info) {
    var target = new Date(info.next_allowed_at).getTime();
    $app.innerHTML =
      '<div class="card center" style="padding:28px 16px"><div style="font-size:2.6rem">⏳</div><h2 style="justify-content:center">잠깐 쉬어 가요</h2>' +
      '<p class="muted">다시 도전하려면 조금 기다려야 해요. 그동안 책을 한 번 더 읽어 볼까요?</p>' +
      '<div class="score-big" id="cd"></div>' +
      '<p class="muted">내 최고 점수: ' + info.best + "/" + info.total + "</p>" +
      '<button class="btn" id="reread">📖 다시 읽기</button> <button class="btn ghost" id="tohome">책장으로</button></div>';
    document.getElementById("reread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(b.id); };
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    function tick() {
      var left = Math.max(0, target - Date.now());
      var m = Math.floor(left / 60000), s = Math.floor((left % 60000) / 1000);
      var cd = document.getElementById("cd");
      if (cd) cd.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
      if (left <= 0) { clearTimer(); renderQuiz(b.id).catch(showError); }
    }
    tick(); clearTimer(); timer = setInterval(tick, 1000);
  }
  function renderResult(b, r) {
    var medal = r.medal;
    var msg = medal === "gold" ? "만점! 금메달이에요 🎉" : medal === "silver" ? "훌륭해요! 은메달이에요" : medal === "bronze" ? "잘했어요! 동메달이에요" : "아쉬워요. 60점부터 메달을 받아요. 다시 도전해 봐요!";
    var better = r.best_medal && r.best_medal !== medal;
    var c = countryOf(b);
    var starMsg = r.star ? '<p><b>⭐ 무힌트 보너스를 받았어요!</b></p>'
      : (medal && r.hints > 0 ? '<p class="muted">번역을 본 단락이 ' + r.hints + "개라서 이번에는 ⭐ 보너스가 없어요. 다음 책에서는 영어로만 도전해 봐요!</p>" : "");
    $app.innerHTML =
      '<div class="card result"><h2 style="justify-content:center">' + esc(b.title) + "</h2>" +
      '<div class="stamp ' + (medal || "none") + '"><span class="em">' + (medal ? MEDALS[medal].em : "📘") + "</span><span>" + (medal ? MEDALS[medal].name : "도전 중") + "</span></div>" +
      '<div class="score-big">' + r.score + " / " + r.total + (r.star ? " ⭐" : "") + "</div>" +
      "<p><b>" + msg + "</b></p>" + starMsg +
      '<div id="resstreak"></div><div id="resstamp"></div>' +
      '<p class="muted">' + r.attempt + "번째 도전 · 내 최고 점수 " + r.best + "/" + r.total + (better ? " (" + MEDALS[r.best_medal].name + " 유지)" : "") + " · 같은 책은 10분 뒤 다시 도전할 수 있어요.</p>" +
      '<div style="margin-top:14px"><button class="btn" id="tohome">책장으로</button> <button class="btn ghost" id="reread">다시 읽기</button></div></div>';
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("reread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(b.id); };
    if (medal === "gold") confetti(70); else if (medal) confetti(30);
    if (r.star) setTimeout(function () { confetti(40); }, 600);
    sb.rpc("my_days").then(function (d) {
      var box = document.getElementById("resstreak");
      if (d.error || !box) return;
      var s = dayStreak(d.data);
      if (s.today) box.innerHTML = '<div class="res-streak"><span>🔥</span><b>' + s.n + "일째 연속 독서!</b>" + (s.n > 1 ? " 오늘도 불꽃을 지켰어요." : " 내일도 이어 가 봐요.") + "</div>";
      else if (s.n) box.innerHTML = '<div class="res-streak"><span>🔥</span><b>' + s.n + "일 연속 독서 중</b> · 오늘 메달을 받으면 " + (s.n + 1) + "일째가 돼요.</div>";
    });
    // 새 기록으로 요약을 다시 받아 도장 고르기를 보여 줘요
    state.summary = null;
    if (!r.best_medal && !medal) return;
    function drawStamp() {
      var box = document.getElementById("resstamp");
      if (!box) return;
      box.innerHTML = stampBoxHtml(b, myRecord(b.id));
      bindStampBox(b, drawStamp);
    }
    sb.rpc("my_summary").then(function (s) {
      if (s.error) return;
      state.summary = s.data || {};
      drawStamp();
    });
  }

  /* ---------- 교사 화면 ---------- */
  function csvCell(v) {
    v = v == null ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; // 엑셀 수식 방지
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function csvDownload(name, rows) {
    var text = rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
    a.download = name; a.click();
  }
  async function renderTeacher() {
    if (!state.isAdmin) { location.hash = "#/"; return; }
    loading();
    var res = await Promise.all([sb.rpc("admin_overview"), sb.rpc("admin_scores"), sb.rpc("admin_hint_stats"), sb.from("books").select("id,featured"), sb.rpc("admin_question_stats")]);
    for (var k = 0; k < 3; k++) if (res[k].error) throw res[k].error;
    var ov = res[0].data || [], sc = res[1].data || [], hs = res[2].data || [];
    var qstats = (res[4] && !res[4].error && res[4].data) || [];
    var feat = {};
    (res[3].data || []).forEach(function (r) { feat[r.id] = !!r.featured; });
    var hsBooks = {};
    hs.forEach(function (h) { hsBooks[h.book_id] = 1; });
    await Promise.all(Object.keys(hsBooks).map(function (bid) { return loadContent(bid).catch(function () { return null; }); }));
    var classes = {};
    ov.forEach(function (r) { classes[r.grade ? r.grade + "-" + r.class_no : "미지정"] = 1; });
    var opts = '<option value="">전체</option>' + Object.keys(classes).sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    var school = ov.filter(function (r) { return r.role === "school"; });
    var activeN = ov.filter(function (r) { return r.attempts > 0; }).length;
    var totalMedals = ov.reduce(function (n, r) { return n + r.gold + r.silver + r.bronze; }, 0);

    var hintRows = hs.map(function (h) {
      var bk = findBook(h.book_id);
      var cont = window.BOOK_CONTENT && window.BOOK_CONTENT[h.book_id];
      var para = cont && cont.story[h.para] ? cont.story[h.para].en.slice(0, 60) + "…" : "";
      return "<tr><td>" + esc(bk ? bk.titleKo : h.book_id) + "</td><td>" + (h.para + 1) + "단락</td><td>" + esc(para) + "</td><td>" + h.students + "명</td><td>" + h.clicks + "회</td></tr>";
    }).join("");
    var qRows = qstats.filter(function (q) { return q.attempts > 0; }).map(function (q) {
      q.rate = Math.round((q.correct / q.attempts) * 100); return q;
    }).sort(function (a, b) { return a.rate - b.rate; }).slice(0, 20).map(function (q) {
      var bk = findBook(q.book_id);
      return "<tr><td>" + esc(bk ? bk.titleKo : q.book_id) + "</td><td>" + q.no + '번</td><td class="qtext">' + esc(q.question) + "</td><td>" + q.attempts + '회</td><td><div class="rate ' + (q.rate < 50 ? "low" : "") + '"><div class="progress sm"><div style="width:' + q.rate + '%"></div></div><b>' + q.rate + "%</b></div></td></tr>";
    }).join("");
    var featRows = (window.BOOKS || []).map(function (b) {
      return '<label style="display:block;padding:5px 0"><input type="checkbox" class="featcb" data-id="' + esc(b.id) + '" ' + (feat[b.id] ? "checked" : "") + "> " + esc(b.emoji) + " " + esc(b.title) + ' <span class="muted">(' + esc(levelOf(b)) + ")</span></label>";
    }).join("");

    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button><h2 style="margin-top:12px">👩‍🏫 교사 화면</h2>' +
      '<div class="pp-stats three" style="margin:4px 0 14px"><div class="kv center" style="margin:0"><b>' + school.length + '</b><span class="muted">가입한 학교 학생</span></div>' +
      '<div class="kv center" style="margin:0"><b>' + activeN + '</b><span class="muted">퀴즈에 도전한 사람</span></div>' +
      '<div class="kv center" style="margin:0"><b>' + totalMedals + '</b><span class="muted">받은 메달</span></div></div>' +
      '반 선택 <select id="cls">' + opts + '</select> <button class="btn ghost small" id="csv1">요약 CSV</button> <button class="btn ghost small" id="csv2">작품별 점수 CSV</button>' +
      '<div class="scroll" style="margin-top:12px"><table id="tbl"></table></div>' +
      '<p class="muted">닉네임이 부적절하면 ✏️로 바꾸거나 ↺로 랜덤 이름으로 되돌릴 수 있어요.</p></div>' +
      '<div class="card"><h2>📉 정답률이 낮은 문항</h2><p class="muted">학생들이 많이 틀린 문항부터 보여 줘요 (응시 기록 기준, 최대 20개).</p>' +
      (qRows ? '<div class="scroll"><table><tr><th>작품</th><th>문항</th><th>문제</th><th>응시</th><th>정답률</th></tr>' + qRows + "</table></div>" : '<p class="muted">아직 응시 기록이 없어요.</p>') + "</div>" +
      '<div class="card"><h2>💬 단락별 번역(힌트) 열람</h2><p class="muted">학생들이 어느 단락에서 한국어 번역을 많이 봤는지 보여 줘요.</p>' +
      (hintRows ? '<div class="scroll"><table><tr><th>작품</th><th>단락</th><th>내용</th><th>본 학생 수</th><th>누른 횟수</th></tr>' + hintRows + "</table></div>" : '<p class="muted">아직 기록이 없어요.</p>') + "</div>" +
      '<div class="card"><h2>🌟 선생님 추천 책</h2><p class="muted">체크한 책은 학생 책장 맨 위 "선생님 추천" 칸에 나와요.</p>' + featRows + "</div>" +
      '<div class="card"><h2>📋 명단 올리기</h2><p class="muted">한 줄에 한 명: <code>이메일,이름,학년,반,번호</code> (엑셀에서 복사해 붙여넣어도 돼요). 이미 가입한 학생에게도 바로 적용돼요.</p>' +
      '<textarea id="roster" placeholder="202610101@smy.ms.kr,이름,1,1,1"></textarea><br><button class="btn" id="saveroster" style="margin-top:8px">명단 저장</button></div>';

    each(".featcb", function (cb) {
      cb.onchange = async function () {
        var r = await sb.from("books").update({ featured: cb.checked }).eq("id", cb.getAttribute("data-id"));
        if (r.error) { cb.checked = !cb.checked; return toast("저장 실패: " + r.error.message); }
        toast(cb.checked ? "추천 책으로 지정했어요" : "추천을 해제했어요");
      };
    });

    function draw() {
      var f = document.getElementById("cls").value;
      var rows = ov.filter(function (r) { return !f || (r.grade ? r.grade + "-" + r.class_no : "미지정") === f; });
      document.getElementById("tbl").innerHTML =
        "<tr><th>학년-반-번호</th><th>이름</th><th>닉네임</th><th>구분</th><th>완료</th><th>🥇</th><th>🥈</th><th>🥉</th><th>⭐</th><th>단어</th><th>도전</th><th>최근</th></tr>" +
        rows.map(function (r) {
          return "<tr><td>" + (r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no : "-") + "</td><td>" + esc(r.name || r.email) + "</td>" +
            "<td>" + esc(r.nickname || "") + ' <button class="btn ghost small nick-edit" data-e="' + esc(r.email) + '" data-n="' + esc(r.nickname || "") + '">✏️</button>' +
            '<button class="btn ghost small nick-reset" data-e="' + esc(r.email) + '">↺</button></td><td>' + (r.role === "school" ? "학교" : "외부") +
            "</td><td>" + r.completed + "</td><td>" + r.gold + "</td><td>" + r.silver + "</td><td>" + r.bronze + "</td><td>" + r.stars + "</td><td>" + r.words + "</td><td>" + r.attempts + "</td><td>" + fmtDate(r.last_activity) + "</td></tr>";
        }).join("");
      each(".nick-edit", function (el) {
        el.onclick = async function () {
          var v = window.prompt("새 닉네임 (비우면 랜덤 이름으로 초기화)", el.getAttribute("data-n"));
          if (v === null) return;
          var r = await sb.rpc("admin_set_nickname", { p_email: el.getAttribute("data-e"), p_nick: v });
          if (r.error) return toast("저장 실패: " + r.error.message);
          toast("닉네임을 바꿨어요"); renderTeacher();
        };
      });
      each(".nick-reset", function (el) {
        el.onclick = async function () {
          var r = await sb.rpc("admin_set_nickname", { p_email: el.getAttribute("data-e"), p_nick: "" });
          if (r.error) return toast("저장 실패: " + r.error.message);
          toast("랜덤 이름으로 되돌렸어요"); renderTeacher();
        };
      });
    }
    draw();
    document.getElementById("cls").onchange = draw;
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("csv1").onclick = function () {
      csvDownload("독서현황.csv", [["이메일", "이름", "닉네임", "구분", "학년", "반", "번호", "완료", "금", "은", "동", "무힌트별", "단어", "도전", "최근활동"]].concat(
        ov.map(function (r) { return [r.email, r.name, r.nickname, r.role, r.grade, r.class_no, r.student_no, r.completed, r.gold, r.silver, r.bronze, r.stars, r.words, r.attempts, r.last_activity]; })));
    };
    document.getElementById("csv2").onclick = function () {
      csvDownload("작품별점수.csv", [["이메일", "이름", "학년", "반", "번호", "작품", "최고점수", "만점", "도전횟수", "메달", "무힌트별", "본번역단락", "최근"]].concat(
        sc.map(function (r) { return [r.email, r.name, r.grade, r.class_no, r.student_no, r.book_id, r.best, r.total, r.attempts, r.medal, r.star ? "O" : "", r.hints, r.last_at]; })));
    };
    document.getElementById("saveroster").onclick = async function () {
      var lines = document.getElementById("roster").value.split(/\r?\n/);
      var rows = [];
      lines.forEach(function (line) {
        var p = line.split(/[,\t]/).map(function (x) { return x.trim(); });
        if (p.length < 5 || p[0].indexOf("@") < 0) return;
        rows.push({ email: p[0].toLowerCase(), name: p[1], grade: parseInt(p[2], 10) || null, class_no: parseInt(p[3], 10) || null, student_no: parseInt(p[4], 10) || null });
      });
      if (!rows.length) return toast("올릴 줄이 없어요. 형식을 확인해 주세요.");
      var u = await sb.from("roster").upsert(rows, { onConflict: "email" });
      if (u.error) return toast("저장 실패: " + u.error.message);
      var a = await sb.rpc("apply_roster");
      toast("명단 " + rows.length + "명 저장 · 가입자 " + (a.data || 0) + "명에게 적용");
      renderTeacher();
    };
  }

  sb.auth.onAuthStateChange(function (evt, session) {
    if (evt === "SIGNED_IN" && session && (!state.user || state.user.id !== session.user.id)) setTimeout(boot, 0);
    if (evt === "SIGNED_OUT") setTimeout(boot, 0);
  });
  boot();
})();
