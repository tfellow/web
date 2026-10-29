(function () {
  "use strict";

  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SCHOOL_LABEL = "서울문영여자중학교";
  var ASSET_V = "47"; // 파일을 고칠 때마다 index.html 과 여기 숫자를 같이 올려요
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
  // A0 = Pre-A1 (화면에는 lvName()으로 "Pre-A1"이라고 보여요)
  var LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1"];
  var LEVEL_INFO = {
    A0: { em: "🌰", name: "씨앗 독자" },
    A1: { em: "🌱", name: "새싹 독자" },
    A2: { em: "🧭", name: "꼬마 탐험가" },
    B1: { em: "🎒", name: "용감한 여행자" },
    B2: { em: "🗺️", name: "노련한 모험가" },
    C1: { em: "🌍", name: "세계 시민" }
  };
  var LEVEL_GOAL = 3;
  // 내 레벨 찾기: 단계별 샘플 책(80% 이상이면 통과), 레벨 올리기 기준
  var LEVEL_SAMPLES = { A0: "the-little-red-hen", A1: "the-happy-prince", A2: "the-old-man-and-the-sea", B1: "the-giver" };
  var PLACE_PASS = 0.8;
  var LEVEL_UP_BOOKS = 10;
  var LEVEL_UP_AVG = 80;
  // 독서 칭호: 메달 받은 책 권수에 따라 받아요. 200권부터는 100권마다 Master Reader 단계가 올라가요
  var READ_TITLES = [
    { n: 1, em: "🎒", en: "Traveler", ko: "여행자" },
    { n: 3, em: "🧭", en: "Explorer", ko: "탐험가" },
    { n: 10, em: "⛵", en: "Voyager", ko: "항해자" },
    { n: 20, em: "🗺️", en: "Navigator", ko: "길잡이" },
    { n: 30, em: "🏔️", en: "Adventurer", ko: "모험가" },
    { n: 50, em: "🌍", en: "Globetrotter", ko: "세계 여행가" },
    { n: 100, em: "📜", en: "Story Keeper", ko: "이야기 수호자" },
    { n: 150, em: "🔭", en: "Pathfinder", ko: "개척자" }
  ];
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  function readTitleAt(i) {
    if (i < READ_TITLES.length) return READ_TITLES[i];
    var k = i - READ_TITLES.length; // 0 → 200권
    return { n: 200 + k * 100, em: "👑", en: "Master Reader " + (ROMAN[k] || k + 1), ko: "마스터 리더 " + (k + 1) + "단계" };
  }
  function readTitle(n) {
    var i = -1;
    while (n >= readTitleAt(i + 1).n) i++;
    return { cur: i >= 0 ? readTitleAt(i) : null, next: readTitleAt(i + 1), idx: i };
  }
  function readTitleLabel(t) { return t ? t.em + " " + t.en + " " + t.ko : ""; }
  // 칭호 인증서: 칭호마다 색과 문구가 달라요 (Master Reader는 금색)
  var CERT_STYLES = [
    { a: "#2f7d5b", b: "#e6f4ec", line: "첫 메달로 독서 여행을 시작했어요." },
    { a: "#2d6fa3", b: "#e5f0fa", line: "세 권의 이야기 속을 탐험했어요." },
    { a: "#1f5f8b", b: "#e2eef7", line: "열 권의 바다를 건너 항해했어요." },
    { a: "#7a4fa0", b: "#f0e9f7", line: "스무 권의 길을 스스로 찾아 걸었어요." },
    { a: "#a0522d", b: "#f8ece4", line: "서른 권의 산을 넘은 모험가예요." },
    { a: "#c0392b", b: "#fbe9e7", line: "쉰 권으로 세계를 여행했어요." },
    { a: "#6d4c41", b: "#f3ece6", line: "백 권의 이야기를 마음에 간직했어요." },
    { a: "#283593", b: "#e8eaf6", line: "백오십 권, 새로운 길을 여는 개척자예요." }
  ];
  function certStyle(i) { return CERT_STYLES[i] || { a: "#a07816", b: "#fbf3dc", line: "책과 함께하는 여정의 마스터예요." }; }
  function openCertificate(i) {
    var t = readTitleAt(i), cs = certStyle(i);
    var nick = (state.profile && state.profile.nickname) || "";
    var d = new Date(), date = d.getFullYear() + ". " + (d.getMonth() + 1) + ". " + d.getDate() + ".";
    var ov = document.createElement("div");
    ov.className = "overlay cert-ov";
    ov.innerHTML =
      '<div class="cert-wrap">' +
      '<div class="cert" style="--ca:' + cs.a + ";--cb:" + cs.b + '">' +
      '<div class="cert-in"><div class="cert-top"><img src="emblem.png" alt="" width="60" height="53"><div><b>MY READING PASSPORT</b><small>문영 독서 여권 · MOONYOUNG</small></div></div>' +
      '<div class="cert-kind">CERTIFICATE OF ACHIEVEMENT · 독서 칭호 인증서</div>' +
      '<div class="cert-em">' + t.em + "</div>" +
      '<div class="cert-title">' + esc(t.en) + "</div><div class=\"cert-ko\">" + esc(t.ko) + "</div>" +
      '<div class="cert-name" id="certname">' + esc(nick) + "</div>" +
      '<p class="cert-text">This certifies that the reader above has finished <b>' + t.n + " books</b> with medals <br>and earned the title of <b>" + esc(t.en) + "</b>.</p>" +
      '<p class="cert-text ko">위 독서가는 메달 받은 책 <b>' + t.n + "권</b>을 읽고 <b>" + esc(t.ko) + "</b> 칭호를 받았습니다. <br>" + esc(cs.line) + "</p>" +
      '<div class="cert-foot"><span>' + date + '</span><span class="cert-seal">' + t.em + '<small>MY</small></span><span>서울문영여자중학교<br>MY Reading Passport</span></div></div></div>' +
      '<div class="cert-tools"><label>인증서에 넣을 이름 <input id="certin" maxlength="20" value="' + esc(nick) + '" placeholder="이름 또는 닉네임"></label>' +
      '<div class="cert-btns"><button class="btn gold" id="certprint">🖨️ 인쇄 · PDF로 저장</button><button class="btn ghost" id="certclose">닫기</button></div>' +
      '<p class="muted">이름은 저장되지 않고 이 인증서에만 들어가요. 인쇄 창에서 “PDF로 저장”을 고르면 파일로 받을 수 있어요.</p></div></div>';
    document.body.appendChild(ov);
    document.body.classList.add("cert-open");
    function close() { ov.remove(); document.body.classList.remove("cert-open"); }
    ov.onclick = function (e) { if (e.target === ov) close(); };
    document.getElementById("certclose").onclick = close;
    document.getElementById("certin").oninput = function () { document.getElementById("certname").textContent = this.value; };
    document.getElementById("certprint").onclick = function () { window.print(); };
  }
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
    "Finland": { map: "Finland", ko: "핀란드", iso: "FI", at: [26, 64] },
    "Denmark": { map: "Denmark", ko: "덴마크", iso: "DK", at: [9.5, 56] },
    "Netherlands": { map: "Netherlands", ko: "네덜란드", iso: "NL", at: [5.3, 52.2] },
    "Belgium": { map: "Belgium", ko: "벨기에", iso: "BE", at: [4.5, 50.6] },
    "Austria": { map: "Austria", ko: "오스트리아", iso: "AT", at: [14.5, 47.6] },
    "Switzerland": { map: "Switzerland", ko: "스위스", iso: "CH", at: [8.2, 46.8] },
    "Poland": { map: "Poland", ko: "폴란드", iso: "PL", at: [19.4, 52] },
    "Greece": { map: "Greece", ko: "그리스", iso: "GR", at: [22, 39.5] },
    "Portugal": { map: "Portugal", ko: "포르투갈", iso: "PT", at: [-8.2, 39.6] },
    "Georgia": { map: "Georgia", ko: "조지아", iso: "GE", at: [43.5, 42.2] },
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
    "Ukraine": { map: "Ukraine", ko: "우크라이나", iso: "UA", at: [31.5, 49] },
    "Israel": { map: "Israel", ko: "이스라엘", iso: "IL", at: [35, 31.5] },
    "Iran": { map: "Iran", ko: "이란", iso: "IR", at: [53, 32.5] },
    "Sri Lanka": { map: "Sri Lanka", ko: "스리랑카", iso: "LK", at: [80.7, 7.8] },
    "Ghana": { map: "Ghana", ko: "가나", iso: "GH", at: [-1, 7.9] },
    "Ethiopia": { map: "Ethiopia", ko: "에티오피아", iso: "ET", at: [39.5, 9] },
    "Malawi": { map: "Malawi", ko: "말라위", iso: "MW", at: [34.3, -13.3] },
    "South Africa": { map: "South Africa", ko: "남아프리카공화국", iso: "ZA", at: [24, -29] },
    "Peru": { map: "Peru", ko: "페루", iso: "PE", at: [-75, -9.5] },
    "Iraq": { map: "Iraq", ko: "이라크", iso: "IQ", at: [43.7, 33] },
    "Mongolia": { map: "Mongolia", ko: "몽골", iso: "MN", at: [103, 46.8] },
    "Vietnam": { map: "Vietnam", ko: "베트남", iso: "VN", at: [106, 16] },
    "Philippines": { map: "Philippines", ko: "필리핀", iso: "PH", at: [122, 12.5] },
    "New Zealand": { map: "New Zealand", ko: "뉴질랜드", iso: "NZ", at: [172, -41.5] },
    "Australia": { map: "Australia", ko: "호주", iso: "AU", at: [134, -25] }
  };
  // 대륙 배지: 각 대륙에 첫 여권 도장을 찍으면 받아요 (지도 이름 → 대륙)
  var CONTINENTS = [
    { id: "EU", name: "유럽", em: "🏰" }, { id: "AS", name: "아시아", em: "🏯" }, { id: "NA", name: "북아메리카", em: "🗽" },
    { id: "SA", name: "남아메리카", em: "🦙" }, { id: "AF", name: "아프리카", em: "🦁" }, { id: "OC", name: "오세아니아", em: "🦘" }
  ];
  var CONT_OF = {
    "Czechia": "EU", "United Kingdom": "EU", "France": "EU", "Germany": "EU", "Italy": "EU", "Spain": "EU", "Russia": "EU",
    "Ireland": "EU", "Iceland": "EU", "Norway": "EU", "Sweden": "EU", "Finland": "EU", "Denmark": "EU", "Netherlands": "EU", "Belgium": "EU",
    "Austria": "EU", "Switzerland": "EU", "Poland": "EU", "Greece": "EU", "Portugal": "EU",
    "Turkey": "AS", "Georgia": "AS", "Japan": "AS", "China": "AS", "South Korea": "AS", "India": "AS",
    "United States of America": "NA", "Canada": "NA", "Mexico": "NA", "Cuba": "NA", "Algeria": "AF", "Romania": "EU", "Ukraine": "EU", "Israel": "AS", "Iran": "AS", "Sri Lanka": "AS",
    "Brazil": "SA", "Colombia": "SA", "Chile": "SA", "Argentina": "SA",
    "Egypt": "AF", "Nigeria": "AF", "Ghana": "AF", "Ethiopia": "AF", "Malawi": "AF", "South Africa": "AF",
    "Peru": "SA", "Iraq": "AS", "Mongolia": "AS", "Vietnam": "AS", "Philippines": "AS", "Australia": "OC", "New Zealand": "OC"
  };

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, bookTab: "story", revealed: {}, shelf: { level: "all", status: "all", q: "", country: "", theme: "", genre: "" } };
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
  function levelOf(b) { var c = String((b && b.cefr) || "").toUpperCase(); return c.indexOf("PRE") === 0 ? "A0" : c.slice(0, 2); }
  function lvName(l) { return l === "A0" ? "Pre-A1" : l; }
  function countryOf(b) { return (b && COUNTRIES[b.country]) || null; }
  function countryKo(b) { var c = countryOf(b); return c ? c.ko : (b && b.country) || ""; }
  // 여권 도장 후보 나라 (첫 번째 = 작가 나라 = 기본값)
  function placesOf(b) { return b && b.places && b.places.length ? b.places : (b && b.country ? [b.country] : []); }
  function tagsOf(b) {
    var raw = (window.BOOK_THEMES || {})[b && b.id] || "";
    var p = raw.split("|");
    return { themes: p[0] ? p[0].split(",") : [], genre: p[1] || "" };
  }
  function themeDef(id) { return (window.THEME_DEFS || []).filter(function (t) { return t.id === id; })[0]; }
  function genreDef(id) { return (window.GENRE_DEFS || []).filter(function (g) { return g.id === id; })[0]; }
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
      '<div class="card login"><img class="emblem" src="emblem.png" width="240" height="213" alt="서울문영여자중학교 교표"><div class="kicker" style="margin-top:10px">문영 독서 여권</div><h2>MY Reading Passport</h2>' +
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
    var rt = readTitle(done);

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
        '<div><span class="lv-tag">' + esc(lvName(levelOf(b))) + " · " + b.words + "단어" + (c ? " · " + flag(c.iso) + " " + esc(c.ko) : "") + "</span>" +
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
    // 내 레벨: 학생이 정한 레벨(없으면 샘플 책 결과로 추천)
    var myLv = (state.profile && state.profile.reading_level) || "";
    function pctOf(r) { return r && r.total ? r.best / r.total : 0; }
    var sampleLvs = Object.keys(LEVEL_SAMPLES);
    var suggestLv = sampleLvs[0];
    for (var si = 0; si < sampleLvs.length; si++) {
      var sr = byId[LEVEL_SAMPLES[sampleLvs[si]]];
      if (sr && pctOf(sr) >= PLACE_PASS) suggestLv = sampleLvs[si]; else break;
    }
    var nextLvOf = function (lv) {
      var i = LEVELS.indexOf(lv) + 1;
      while (i < LEVELS.length && !books.some(function (b) { return levelOf(b) === LEVELS[i]; })) i++;
      return i < LEVELS.length ? LEVELS[i] : "";
    };
    var lvDoneList = myLv ? books.filter(function (b) { return levelOf(b) === myLv && st(b) === "done"; }) : [];
    var lvAvg = lvDoneList.length ? Math.round(lvDoneList.reduce(function (s, b) { return s + pctOf(byId[b.id]); }, 0) / lvDoneList.length * 100) : 0;
    var nextLv = myLv ? nextLvOf(myLv) : "";
    var readyUp = !!(myLv && nextLv && lvDoneList.length >= LEVEL_UP_BOOKS && lvAvg >= LEVEL_UP_AVG);
    function hashStr(s) { var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000; return h; }
    var dayKey = new Date().toISOString().slice(0, 10);
    var unread = books.filter(function (b) { return st(b) === "new" && !featured[b.id]; });
    var rec;
    if (myLv) {
      var pick = function (lv, n) { return unread.filter(function (b) { return levelOf(b) === lv; }).sort(function (a, b) { return hashStr(a.id + dayKey) - hashStr(b.id + dayKey); }).slice(0, n); };
      rec = pick(myLv, nextLv ? 3 : 4).concat(nextLv ? pick(nextLv, 1) : []);
      if (rec.length < 4) rec = rec.concat(unread.filter(function (b) { return rec.indexOf(b) < 0; }).slice(0, 4 - rec.length));
    } else {
      rec = unread.sort(function (a, b) {
        function key(k) { return cur < 0 ? k : (k >= cur ? k - cur : cur - k + 0.5); }
        return key(LEVELS.indexOf(levelOf(a))) - key(LEVELS.indexOf(levelOf(b)));
      }).slice(0, 4);
    }
    var lvAvail = LEVELS.filter(function (l) { return books.some(function (b) { return levelOf(b) === l; }); });
    var levelCardHtml =
      '<div class="card" id="levelcard"><h2>🔎 내 레벨<span class="sub">레벨에 맞춰 책을 추천해요</span></h2>' +
      (myLv
        ? '<div class="lv-now"><div class="lv-badge">' + LEVEL_INFO[myLv].em + "<b>" + lvName(myLv) + "</b></div><div><b>지금 내 레벨은 " + lvName(myLv) + " · " + esc(LEVEL_INFO[myLv].name) + "</b>" +
          '<div class="muted">이 레벨 메달 ' + lvDoneList.length + "권 · 평균 " + lvAvg + "점" + (nextLv ? " · " + lvName(nextLv) + "(으)로 올라가려면 메달 " + LEVEL_UP_BOOKS + "권, 평균 " + LEVEL_UP_AVG + "점 이상" : "") + "</div></div></div>" +
          (nextLv ? '<div class="progress"><div id="lvupbar"></div></div>' : "") +
          (readyUp ? '<div class="lv-up">🎉 ' + lvName(nextLv) + "(으)로 올라갈 준비가 됐어요! <button class=\"btn gold small\" id=\"lvupbtn\">" + lvName(nextLv) + "(으)로 올리기</button></div>" : "") +
          '<p class="muted" style="margin:10px 0 0">아래 “다음에 읽을 책”은 ' + lvName(myLv) + " 책 위주로" + (nextLv ? ", 한 권은 " + lvName(nextLv) + " 도전 책으로" : "") + ' 골랐어요. <button class="linkbtn" id="lvchange">레벨 바꾸기</button></p>'
        : '<p class="muted" style="margin-top:-4px">단계별 샘플 책을 읽고 퀴즈를 풀어 보세요. <b>8점 이상</b>이면 다음 단계에 도전해요. 결과를 보고 내 레벨을 정하면, 그 레벨 책을 먼저 추천해 줘요.</p>' +
          '<div class="lv-steps">' + sampleLvs.map(function (lv, i) {
            var b = findBook(LEVEL_SAMPLES[lv]); var r = byId[LEVEL_SAMPLES[lv]];
            var pass = r && pctOf(r) >= PLACE_PASS;
            var open = i === 0 || (byId[LEVEL_SAMPLES[sampleLvs[i - 1]]] && pctOf(byId[LEVEL_SAMPLES[sampleLvs[i - 1]]]) >= PLACE_PASS);
            return '<div class="lv-step ' + (pass ? "pass" : "") + (open ? "" : " locked") + '"><div class="lv-step-h">' + LEVEL_INFO[lv].em + " <b>" + lvName(lv) + "</b> 샘플</div>" +
              '<div class="lv-step-t">' + (b ? esc(b.emoji) + " " + esc(b.title) : "") + "</div>" +
              '<div class="muted">' + (r ? "최고 " + r.best + "/" + r.total + (pass ? " · 통과 ✅" : " · 8점이 안 돼요") : open ? "아직 안 풀었어요" : "🔒 앞 단계를 통과하면 열려요") + "</div>" +
              (open && b ? '<button class="btn ghost small lv-go" data-id="' + esc(b.id) + '">' + (r ? "다시 풀기" : "읽고 풀기") + "</button>" : "") + "</div>";
          }).join("") + "</div>" +
          '<div class="lv-pick"><span>추천 레벨: <b>' + lvName(suggestLv) + "</b></span> <button class=\"btn gold small lv-set\" data-lv=\"" + suggestLv + '">' + lvName(suggestLv) + "(으)로 정하기</button></div>") +
      '<div class="lv-manual" id="lvmanual"' + (myLv ? " hidden" : "") + '><span class="muted">직접 고르기:</span> ' + lvAvail.map(function (l) {
        return '<button class="pill lv-set ' + (l === myLv ? "on" : "") + '" data-lv="' + l + '">' + LEVEL_INFO[l].em + " " + lvName(l) + "</button>";
      }).join("") + "</div></div>";

    var nick = (state.profile && state.profile.nickname) || "";
    var show = state.profile && state.profile.show_on_board;
    var isSchool = isStudentSchool();
    var medalRing = function (em, n, label) {
      return '<div class="pp-medal ' + (n ? "on" : "") + '"><div class="ring">' + em + (n ? '<span class="cnt">' + n + "</span>" : "") + "</div><small>" + label + "</small></div>";
    };

    var html =
      '<section class="passport"><div class="pp-head"><div class="pp-emblem"><img src="emblem.png" width="240" height="213" alt="서울문영여자중학교 교표"></div><div>' +
      '<div class="pp-kicker">MY READING PASSPORT</div><div class="pp-name">' + esc(nick) + "</div>" +
      '<div class="pp-level">' + (rt.cur ? readTitleLabel(rt.cur) : "여행 준비 중 · 첫 메달에 도전해 보세요") + "</div>" +
      (title ? '<div class="pp-sublevel">' + LEVEL_INFO[title.lv].em + " " + lvName(title.lv) + " " + LEVEL_INFO[title.lv].name + "</div>" : "") + "</div></div>" +
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

      '<div class="card"><h2>🏅 독서 칭호<span class="sub">메달 받은 책 권수로 올라가요</span></h2>' +
      '<div class="rt-now"><div class="rt-em">' + (rt.cur ? rt.cur.em : "🛫") + '</div><div><b>' + (rt.cur ? esc(rt.cur.en) + " · " + esc(rt.cur.ko) : "아직 칭호가 없어요") + "</b>" +
      '<div class="muted">메달 ' + done + "권 · 다음 칭호 " + rt.next.em + " " + esc(rt.next.en) + "까지 " + (rt.next.n - done) + "권</div></div>" +
      (rt.cur ? '<button class="btn gold small rt-cert" data-i="' + rt.idx + '">🎓 인증서</button>' : "") + "</div>" +
      '<div class="progress"><div id="rtbar"></div></div>' +
      '<div class="rt-ladder">' + READ_TITLES.concat([readTitleAt(READ_TITLES.length)]).map(function (t, i) {
        var on = done >= t.n;
        return '<' + (on ? 'button class="rt on rt-cert" data-i="' + i + '" title="인증서 보기"' : 'div class="rt' + (i === rt.idx + 1 ? " next" : "") + '"') + '><div class="em">' + t.em + "</div><b>" + t.n + "권</b><small>" + esc(t.ko) + "</small>" + (on ? '<i class="rt-c">🎓</i>' : "") + "</" + (on ? "button" : "div") + ">";
      }).join("") + "</div>" + (rt.cur ? '<p class="muted" style="margin:6px 0 0">받은 칭호를 누르면 인증서를 볼 수 있어요.</p>' : "") + "</div>" +

      '<div class="card"><h2>🎨 테마 여행<span class="sub">주제로 책 고르기</span></h2><div class="theme-grid">' +
      (window.THEME_DEFS || []).map(function (t) {
        var n = books.filter(function (b) { return tagsOf(b).themes.indexOf(t.id) >= 0; }).length;
        var d = books.filter(function (b) { return st(b) === "done" && tagsOf(b).themes.indexOf(t.id) >= 0; }).length;
        return '<button class="theme-tile" data-theme="' + t.id + '"><span class="em">' + t.em + "</span><b>" + esc(t.name) + "</b><small>" + d + "/" + n + "권</small></button>";
      }).join("") + "</div></div>" +

      '<div class="card"><h2>🛤️ 레벨 로드<span class="sub">수준별 ' + LEVEL_GOAL + "작품 완료 시 칭호</span></h2><div class=\"road\">" +
      lvData.map(function (x) {
        var info = LEVEL_INFO[x.lv];
        return '<div class="lv ' + (x.total ? "has " : "") + (x.earned ? "earned " : "") + (x.lv === currentLv ? "current" : "") + '"><div class="circle">' + info.em + '</div><div class="code">' + lvName(x.lv) + '</div><div class="name">' + info.name + '</div><div class="count">' + (x.total ? x.done + "/" + Math.min(LEVEL_GOAL, x.total) : "준비 중") + "</div></div>";
      }).join("") + "</div></div>" +

      section("🌟 선생님 추천", "", featuredList, "선생님이 골라 준 책이에요.") +
      section("🔥 이어서 도전하기", "", trying, "아직 메달을 받지 못한 책이에요. 한 번 더 도전해 볼까요?") +
      levelCardHtml +
      section("🧭 다음에 읽을 책", myLv ? lvName(myLv) + " 레벨" : "", rec, myLv ? "내 레벨 책 3권과 도전 책 1권이에요. 날마다 바뀌어요." : cur < 0 ? "쉬운 책부터 시작해 보세요. 위에서 내 레벨을 찾아보세요." : "내 수준에 맞춰 골랐어요.") +

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
      '<div class="pills" id="gnpills"></div><div class="pills theme-pills" id="thpills"></div>' +
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
      var lv = [["all", "전체", books.length]].concat(LEVELS.map(function (l) { return [l, lvName(l), books.filter(function (b) { return levelOf(b) === l; }).length]; }));
      var stt = [["all", "전체"], ["new", "안 읽음"], ["trying", "도전 중"], ["done", "완료"]];
      document.getElementById("lvpills").innerHTML = lv.map(function (x) {
        return '<button class="pill ' + (S.level === x[0] ? "on" : "") + (x[2] ? "" : " empty") + '" data-lv="' + x[0] + '">' + x[1] + " <small>" + x[2] + "</small></button>";
      }).join("");
      document.getElementById("stpills").innerHTML = stt.map(function (x) {
        return '<button class="pill ' + (S.status === x[0] ? "on" : "") + '" data-st="' + x[0] + '">' + x[1] + "</button>";
      }).join("");
      var gn = [["", "모든 장르"]].concat((window.GENRE_DEFS || []).map(function (g) { return [g.id, g.name]; }));
      document.getElementById("gnpills").innerHTML = gn.map(function (x) {
        var n = x[0] ? books.filter(function (b) { return tagsOf(b).genre === x[0]; }).length : books.length;
        return n ? '<button class="pill ' + (S.genre === x[0] ? "on" : "") + '" data-gn="' + x[0] + '">' + esc(x[1]) + " <small>" + n + "</small></button>" : "";
      }).join("");
      document.getElementById("thpills").innerHTML = '<button class="pill ' + (!S.theme ? "on" : "") + '" data-th="">모든 테마</button>' +
        (window.THEME_DEFS || []).map(function (t) {
          return '<button class="pill ' + (S.theme === t.id ? "on" : "") + '" data-th="' + t.id + '">' + t.em + " " + esc(t.name) + "</button>";
        }).join("");
      each("#gnpills .pill", function (el) { el.onclick = function () { S.genre = el.getAttribute("data-gn"); drawPills(); drawShelf(); }; });
      each("#thpills .pill", function (el) { el.onclick = function () { S.theme = el.getAttribute("data-th"); drawPills(); drawShelf(); }; });
      each("#lvpills .pill", function (el) { el.onclick = function () { S.level = el.getAttribute("data-lv"); drawPills(); drawShelf(); }; });
      each("#stpills .pill", function (el) { el.onclick = function () { S.status = el.getAttribute("data-st"); drawPills(); drawShelf(); }; });
    }
    function drawShelf() {
      var q = S.q.trim().toLowerCase();
      var list = books.filter(function (b) {
        if (S.level !== "all" && levelOf(b) !== S.level) return false;
        if (S.status !== "all" && st(b) !== S.status) return false;
        if (S.country && !placesOf(b).some(function (k) { return sameCountry(k, S.country); })) return false;
        var tg = tagsOf(b);
        if (S.theme && tg.themes.indexOf(S.theme) < 0) return false;
        if (S.genre && tg.genre !== S.genre) return false;
        if (q) {
          var hay = [b.title, b.titleKo, b.author, b.authorKo, b.country, countryKo(b)].concat(tg.themes.map(function (t) { var d = themeDef(t); return d ? d.name : ""; }), [genreDef(tg.genre) ? genreDef(tg.genre).name : ""]).join(" ").toLowerCase();
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
      if (S.theme) {
        var td = themeDef(S.theme);
        note += '<div class="filter-note"><span class="badge navy">' + (td ? td.em + " " + esc(td.name) : "") + ' 테마</span><button class="btn ghost small" id="cleartheme">✕ 테마 해제</button></div>';
      }
      if (!list.length) {
        out = '<p class="muted">' + (S.level !== "all" && S.status === "all" && !q && !S.country && !S.theme && !S.genre ? S.level + " 수준의 책은 아직 준비 중이에요." : "조건에 맞는 책이 없어요.") + "</p>";
      } else if (S.status === "all" && !q && !S.country && !S.theme && !S.genre) {
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
      var ct = document.getElementById("cleartheme");
      if (ct) ct.onclick = function () { S.theme = ""; drawPills(); drawShelf(); };
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
    each(".theme-tile", function (el) {
      el.onclick = function () {
        S.theme = el.getAttribute("data-theme"); S.level = "all"; S.status = "all"; S.genre = ""; S.country = ""; S.q = "";
        document.getElementById("q").value = "";
        drawPills(); drawShelf();
        document.getElementById("shelfcard").scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
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
      var rb = document.getElementById("rtbar"); if (rb) { var lo = rt.cur ? rt.cur.n : 0; rb.style.width = Math.round(((done - lo) / Math.max(1, rt.next.n - lo)) * 100) + "%"; }
      var lb = document.getElementById("lvupbar"); if (lb) lb.style.width = Math.min(100, Math.round(Math.min(1, lvDoneList.length / LEVEL_UP_BOOKS) * 100)) + "%";
      var cb = document.getElementById("clsbar"); if (cb && cls) cb.style.width = Math.min(100, Math.round((cls.words || 0) / Math.max(1, cls.goal || 1) * 100)) + "%";
    }, 80);
    async function setMyLevel(lv) {
      var r = await sb.rpc("set_my_level", { p_level: lv });
      if (r.error) return toast("레벨을 저장하지 못했어요");
      state.profile.reading_level = lv;
      toast(lvName(lv) + " 레벨로 정했어요"); renderHome();
    }
    each(".lv-set", function (el) { el.onclick = function () { setMyLevel(el.getAttribute("data-lv")); }; });
    each(".rt-cert", function (el) { el.onclick = function () { openCertificate(Number(el.getAttribute("data-i"))); }; });
    each(".lv-go", function (el) { el.onclick = function () { state.bookTab = "story"; location.hash = "#/book/" + encodeURIComponent(el.getAttribute("data-id")); }; });
    var lub = document.getElementById("lvupbtn"); if (lub) lub.onclick = function () { setMyLevel(nextLv); };
    var lvc = document.getElementById("lvchange"); if (lvc) lvc.onclick = function () { var m = document.getElementById("lvmanual"); m.hidden = !m.hidden; };
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
      '<div class="tags"><span>CEFR ' + esc(b.cefrLabel || lvName(levelOf(b))) + "</span>" + (b.lexile ? "<span>Lexile " + esc(b.lexile) + "</span>" : "") + (b.ar ? "<span>AR " + esc(b.ar) + "</span>" : "") + "<span>" + b.words + "단어</span>" +
      (cinfo ? "<span>" + flag(cinfo.iso) + " " + esc(cinfo.ko) + "</span>" : "") + "</div>" +
      (function () {
        var tg = tagsOf(b), g = genreDef(tg.genre);
        var chips = (g ? ["<span>" + esc(g.name) + "</span>"] : []).concat(tg.themes.map(function (t) { var d = themeDef(t); return d ? "<span>" + d.em + " " + esc(d.name) + "</span>" : ""; }));
        return chips.length ? '<div class="tags theme-tags">' + chips.join("") + "</div>" : "";
      })() + stampBoxHtml(b, myRecord(b.id)) + "</div>" +
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
    function medalCount() { return ((state.summary && state.summary.books) || []).filter(function (x) { return x.medal && findBook(x.book_id); }).length; }
    var hadSummary = !!state.summary, prevDone = medalCount();
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
      var now = readTitle(medalCount());
      if (hadSummary && now.cur && now.idx > readTitle(prevDone).idx) {
        var box = document.getElementById("resstreak");
        if (!box) return;
        var nt = document.createElement("div");
        nt.className = "res-title";
        nt.innerHTML = '<span class="em">' + now.cur.em + "</span><div><b>새 칭호를 받았어요! " + esc(now.cur.en) + " · " + esc(now.cur.ko) + '</b><div class="muted">메달 ' + now.cur.n + "권 달성</div></div>" +
          '<button class="btn gold small" id="rescert">🎓 인증서 받기</button>';
        box.parentNode.insertBefore(nt, box);
        document.getElementById("rescert").onclick = function () { openCertificate(now.idx); };
        setTimeout(function () { confetti(60); }, 900);
      }
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
  // 교사 화면: 반별 현황 · 학생 · 작품 · TOP 10 · 문항/힌트 · 설정 탭
  async function renderTeacher() {
    if (!state.isAdmin) { location.hash = "#/"; return; }
    loading();
    var res = await Promise.all([sb.rpc("admin_overview"), sb.rpc("admin_scores"), sb.rpc("admin_hint_stats"), sb.from("books").select("id,featured"),
      sb.rpc("admin_question_stats"), sb.rpc("admin_extras"), sb.rpc("leaderboard"), sb.from("profiles").select("email,reading_level")]);
    var lvByEmail = {};
    ((res[7] && !res[7].error && res[7].data) || []).forEach(function (p) { if (p.reading_level) lvByEmail[String(p.email || "").toLowerCase()] = p.reading_level; });
    for (var k = 0; k < 3; k++) if (res[k].error) throw res[k].error;
    var ov = res[0].data || [], sc = res[1].data || [], hs = res[2].data || [];
    var qstats = (res[4] && !res[4].error && res[4].data) || [];
    var ex = (res[5] && !res[5].error && res[5].data) || {};
    var board = (res[6] && !res[6].error && res[6].data) || [];
    var feat = {};
    (res[3].data || []).forEach(function (r) { feat[r.id] = !!r.featured; });
    var books = window.BOOKS || [];
    var settings = ex.settings || {};
    var goalWords = parseInt(settings.class_goal_words, 10) || 10000;
    var roster = ex.roster || [];
    var weekStart = ex.week_start || "";
    function low(s) { return String(s || "").toLowerCase(); }
    function clsKey(r) { return r.grade ? r.grade + "-" + r.class_no : "미지정"; }
    function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
    function rateBar(p) { return '<div class="rate ' + (p < 50 ? "low" : "") + '"><div class="progress sm"><div style="width:' + Math.min(100, p) + '%"></div></div><b>' + p + "%</b></div>"; }

    // 학생별 추가 정보 (연속 독서, 이번 주 목표, 나라, 대륙, 칭호)
    var exBy = {};
    (ex.students || []).forEach(function (s) { exBy[low(s.email)] = s; });
    var scBy = {};
    sc.forEach(function (r) { (scBy[low(r.email)] = scBy[low(r.email)] || []).push(r); });
    var lvTotal = {};
    books.forEach(function (b) { var lv = levelOf(b); lvTotal[lv] = (lvTotal[lv] || 0) + 1; });
    var info = {};
    ov.forEach(function (r) {
      var e = exBy[low(r.email)] || {};
      var ds = dayStreak({ today: ex.today, days: e.days || [] });
      var maps = {}, conts = {};
      (e.stamps || []).forEach(function (s) {
        var c = COUNTRIES[s.country], m = c ? c.map : s.country;
        maps[m] = 1; if (CONT_OF[m]) conts[CONT_OF[m]] = 1;
      });
      var lvDone = {};
      (scBy[low(r.email)] || []).forEach(function (x) { if (x.medal) { var lv = levelOf(findBook(x.book_id)); lvDone[lv] = (lvDone[lv] || 0) + 1; } });
      var title = null;
      LEVELS.forEach(function (lv) { if (lvTotal[lv] && (lvDone[lv] || 0) >= Math.min(LEVEL_GOAL, lvTotal[lv])) title = lv; });
      info[low(r.email)] = {
        ds: ds, week: (e.days || []).some(function (d) { return d >= weekStart; }), countries: Object.keys(maps), conts: Object.keys(conts).length,
        title: title, show: e.show !== false, weekTries: e.week_tries || 0, myLv: lvByEmail[low(r.email)] || ""
      };
    });

    // 반 목록 (명단 + 가입자)
    var classes = {};
    roster.forEach(function (r) { classes[clsKey(r)] = 1; });
    ov.forEach(function (r) { classes[clsKey(r)] = 1; });
    var classList = Object.keys(classes).sort(function (a, b) {
      if (a === "미지정") return 1; if (b === "미지정") return -1;
      var x = a.split("-").map(Number), y = b.split("-").map(Number);
      return x[0] - y[0] || x[1] - y[1];
    });
    var opts = '<option value="">전체</option>' + classList.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c === "미지정" ? c : c.replace("-", "학년 ") + "반") + "</option>"; }).join("");

    // 반별 통계
    function classStats(key) {
      var mem = ov.filter(function (r) { return clsKey(r) === key; });
      var ros = roster.filter(function (r) { return clsKey(r) === key; });
      var s = { key: key, roster: ros.length, joined: mem.length, active: 0, medalists: 0, gold: 0, silver: 0, bronze: 0, stars: 0, words: 0, completed: 0, week: 0, streak: 0, countries: {}, notJoined: ros.filter(function (r) { return !r.joined; }) };
      mem.forEach(function (r) {
        var i = info[low(r.email)];
        if (r.attempts > 0) s.active++;
        if (r.completed > 0) s.medalists++;
        s.gold += r.gold; s.silver += r.silver; s.bronze += r.bronze; s.stars += r.stars; s.words += r.words; s.completed += r.completed;
        if (i.week) s.week++;
        if (i.ds.n > 0) s.streak++;
        i.countries.forEach(function (c) { s.countries[c] = 1; });
      });
      s.size = Math.max(s.roster, s.joined);
      return s;
    }
    var allStats = classList.map(classStats);
    var school = ov.filter(function (r) { return r.role === "school"; });
    var activeN = ov.filter(function (r) { return r.attempts > 0; }).length;
    var totalMedals = ov.reduce(function (n, r) { return n + r.gold + r.silver + r.bronze; }, 0);
    var weekN = ov.filter(function (r) { return info[low(r.email)].week; }).length;
    var streakN = ov.filter(function (r) { return info[low(r.email)].ds.n > 0; }).length;
    var notJoinedN = roster.filter(function (r) { return !r.joined; }).length;
    function stat(n, label) { return '<div class="kv center" style="margin:0"><b>' + n + '</b><span class="muted">' + label + "</span></div>"; }

    var TABS = [["class", "📊 반별 현황"], ["students", "👤 학생"], ["books", "📚 작품"], ["board", "🏅 TOP 10"], ["quiz", "🧩 문항·힌트"], ["settings", "⚙️ 설정"]];
    state.tTab = state.tTab || "class";
    state.tCls = state.tCls || "";

    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button><h2 style="margin-top:12px">👩‍🏫 교사 화면</h2>' +
      '<div class="tstats">' + stat(school.length, "가입한 학교 학생") + stat(activeN, "퀴즈에 도전한 사람") + stat(totalMedals, "받은 메달") +
      stat(weekN, "이번 주 목표 달성") + stat(streakN, "🔥 연속 독서 중") + stat(notJoinedN, "명단 중 미가입") + "</div></div>" +
      '<div class="tabs" id="ttabs">' + TABS.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.tTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      '<div id="tbody"></div>';

    function clsPicker() { return '<label class="muted" style="margin-right:6px">반 선택</label><select id="cls">' + opts + "</select>"; }
    function bindCls(fn) {
      var el = document.getElementById("cls");
      if (!el) return;
      el.value = state.tCls;
      el.onchange = function () { state.tCls = el.value; fn(); };
    }
    function inCls(r) { return !state.tCls || clsKey(r) === state.tCls; }

    // 📊 반별 현황
    function drawClass() {
      var rows = allStats.filter(function (s) { return s.key !== "미지정" || s.joined; });
      var nj = allStats.filter(function (s) { return s.notJoined.length; });
      document.getElementById("tbody").innerHTML =
        '<div class="card"><h2>📊 반별 현황<span class="sub">반 목표 ' + goalWords.toLocaleString() + "단어</span></h2>" +
        '<p class="muted" style="margin-top:-6px">참여 = 퀴즈에 한 번 이상 도전, 메달 = 메달 받은 작품이 1개 이상인 학생. 반 목표는 학생 화면 “우리 반 함께 읽기”와 같은 기준(메달 받은 작품의 단어 수)이에요.</p>' +
        '<div class="scroll"><table><tr><th>반</th><th>명단</th><th>가입</th><th>참여</th><th>메달 학생</th><th>🥇</th><th>🥈</th><th>🥉</th><th>⭐</th><th>1인 평균 완료</th><th>읽은 단어 · 반 목표</th><th>이번 주 목표</th><th>🔥 연속 중</th><th>🌍 나라</th></tr>' +
        rows.map(function (s) {
          return '<tr><td><b>' + esc(s.key) + "</b></td><td>" + s.roster + "</td><td>" + s.joined + "</td><td>" + s.active + " <span class=\"muted\">(" + pct(s.active, s.size) + "%)</span></td><td>" + s.medalists +
            "</td><td>" + s.gold + "</td><td>" + s.silver + "</td><td>" + s.bronze + "</td><td>" + s.stars + "</td><td>" + (s.joined ? (s.completed / s.joined).toFixed(1) : "0") +
            "</td><td>" + s.words.toLocaleString() + rateBar(pct(s.words, goalWords)) + "</td><td>" + s.week + "명</td><td>" + s.streak + "명</td><td>" + Object.keys(s.countries).length + "</td></tr>";
        }).join("") + "</table></div>" +
        '<p style="margin-top:10px"><button class="btn ghost small" id="csv0">반별 현황 CSV</button></p></div>' +
        '<div class="card"><h2>🙋 아직 가입하지 않은 학생<span class="sub">명단 기준</span></h2>' +
        (nj.length ? nj.map(function (s) {
          return '<p style="margin:6px 0"><b>' + esc(s.key) + "</b> <span class=\"muted\">(" + s.notJoined.length + "명)</span> " + s.notJoined.map(function (r) { return esc(r.student_no + "번 " + (r.name || "")); }).join(", ") + "</p>";
        }).join("") : '<p class="muted">명단의 모든 학생이 가입했어요.</p>') + "</div>";
      document.getElementById("csv0").onclick = function () {
        csvDownload("반별현황.csv", [["반", "명단", "가입", "참여", "메달학생", "금", "은", "동", "무힌트별", "평균완료", "읽은단어", "반목표", "이번주목표달성", "연속독서중", "나라수"]].concat(rows.map(function (s) {
          return [s.key, s.roster, s.joined, s.active, s.medalists, s.gold, s.silver, s.bronze, s.stars, s.joined ? (s.completed / s.joined).toFixed(1) : 0, s.words, goalWords, s.week, s.streak, Object.keys(s.countries).length];
        })));
      };
    }

    // 👤 학생
    function drawStudents() {
      document.getElementById("tbody").innerHTML =
        '<div class="card"><h2>👤 학생별 기록</h2>' + clsPicker() + ' <button class="btn ghost small" id="csv1">요약 CSV</button> <button class="btn ghost small" id="csv2">작품별 점수 CSV</button>' +
        '<p class="muted">이름을 누르면 작품별 기록을 볼 수 있어요. 🔥은 오늘까지 이어진 연속 독서(메달 받은 날), ✅는 이번 주 목표 달성, 🙈는 TOP 10에서 이름을 숨긴 학생이에요.</p>' +
        '<div class="scroll"><table id="tbl"></table></div>' +
        '<p class="muted">닉네임이 부적절하면 ✏️로 바꾸거나 ↺로 랜덤 이름으로 되돌릴 수 있어요.</p></div>';
      function draw() {
        var rows = ov.filter(inCls).sort(function (a, b) { return (a.grade || 99) - (b.grade || 99) || (a.class_no || 99) - (b.class_no || 99) || (a.student_no || 999) - (b.student_no || 999); });
        document.getElementById("tbl").innerHTML =
          "<tr><th>학년-반-번호</th><th>이름</th><th>닉네임</th><th>구분</th><th>완료</th><th>🥇</th><th>🥈</th><th>🥉</th><th>⭐</th><th>단어</th><th>🔥 연속</th><th>최고</th><th>이번 주</th><th>🌍</th><th>대륙</th><th>칭호</th><th>도전</th><th>최근</th></tr>" +
          rows.map(function (r) {
            var i = info[low(r.email)];
            return "<tr><td>" + (r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no : "-") + '</td><td><button class="linkbtn stu" data-e="' + esc(r.email) + '">' + esc(r.name || r.email) + "</button></td>" +
              "<td>" + esc(r.nickname || "") + (i.show ? "" : " 🙈") + ' <button class="btn ghost small nick-edit" data-e="' + esc(r.email) + '" data-n="' + esc(r.nickname || "") + '">✏️</button>' +
              '<button class="btn ghost small nick-reset" data-e="' + esc(r.email) + '">↺</button></td><td>' + (r.role === "school" ? "학교" : "외부") +
              "</td><td>" + r.completed + "</td><td>" + r.gold + "</td><td>" + r.silver + "</td><td>" + r.bronze + "</td><td>" + r.stars + "</td><td>" + r.words +
              "</td><td>" + (i.ds.n ? (i.ds.today ? "🔥" : "") + i.ds.n + "일" : "-") + "</td><td>" + (i.ds.best ? i.ds.best + "일" : "-") + "</td><td>" + (i.week ? "✅" : "") +
              "</td><td>" + i.countries.length + "</td><td>" + i.conts + "/6</td><td>" + (readTitle(r.completed || 0).cur ? readTitle(r.completed || 0).cur.em + " " + esc(readTitle(r.completed || 0).cur.en) : "-") + (i.title ? " · " + lvName(i.title) : "") + (i.myLv ? " · 🔎" + lvName(i.myLv) : "") + "</td><td>" + r.attempts + "</td><td>" + fmtDate(r.last_activity) + "</td></tr>";
          }).join("");
        each(".stu", function (el) { el.onclick = function () { openStudent(el.getAttribute("data-e")); }; });
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
      bindCls(draw);
      document.getElementById("csv1").onclick = function () {
        csvDownload("독서현황.csv", [["이메일", "이름", "닉네임", "구분", "학년", "반", "번호", "완료", "금", "은", "동", "무힌트별", "단어", "연속독서(일)", "최고연속(일)", "이번주목표", "나라수", "대륙수", "독서칭호", "레벨칭호", "내레벨", "TOP10공개", "도전", "최근활동"]].concat(
          ov.filter(inCls).map(function (r) {
            var i = info[low(r.email)];
            return [r.email, r.name, r.nickname, r.role, r.grade, r.class_no, r.student_no, r.completed, r.gold, r.silver, r.bronze, r.stars, r.words, i.ds.n, i.ds.best, i.week ? "O" : "", i.countries.length, i.conts, (readTitle(r.completed || 0).cur || {}).en || "", i.title || "", i.myLv || "", i.show ? "O" : "X", r.attempts, r.last_activity];
          })));
      };
      document.getElementById("csv2").onclick = function () {
        csvDownload("작품별점수.csv", [["이메일", "이름", "학년", "반", "번호", "작품", "수준", "최고점수", "만점", "도전횟수", "메달", "무힌트별", "본번역단락", "최근"]].concat(
          sc.filter(inCls).map(function (r) { var b = findBook(r.book_id); return [r.email, r.name, r.grade, r.class_no, r.student_no, b ? b.titleKo : r.book_id, b ? levelOf(b) : "", r.best, r.total, r.attempts, r.medal, r.star ? "O" : "", r.hints, r.last_at]; })));
      };
    }

    // 학생 상세 (작품별 기록)
    function openStudent(email) {
      var r = ov.filter(function (x) { return low(x.email) === low(email); })[0];
      if (!r) return;
      var i = info[low(email)];
      var list = (scBy[low(email)] || []).slice().sort(function (a, b) { return String(b.last_at).localeCompare(String(a.last_at)); });
      var o = document.createElement("div");
      o.className = "overlay";
      o.innerHTML = '<div class="card wide"><h2>' + esc(r.name || r.email) + ' <span class="muted" style="font-size:.9rem">' + esc(r.nickname || "") + "</span></h2>" +
        '<p class="muted">' + (r.grade ? r.grade + "학년 " + r.class_no + "반 " + r.student_no + "번 · " : "") + "완료 " + r.completed + "작품 · 🔥 " + i.ds.n + "일 연속 (최고 " + i.ds.best + "일) · 🌍 " + i.countries.length + "개 나라" +
        (readTitle(r.completed || 0).cur ? " · " + readTitleLabel(readTitle(r.completed || 0).cur) : "") +
        (i.title ? " · " + LEVEL_INFO[i.title].em + " " + LEVEL_INFO[i.title].name : "") + "</p>" +
        (i.countries.length ? '<p style="margin:4px 0 10px">' + i.countries.map(function (m) {
          var key = Object.keys(COUNTRIES).filter(function (k) { return COUNTRIES[k].map === m; })[0];
          return key ? countryLabel(key) : esc(m);
        }).join(" · ") + "</p>" : "") +
        (list.length ? '<div class="scroll" style="max-height:55vh;overflow-y:auto"><table><tr><th>작품</th><th>수준</th><th>최고</th><th>메달</th><th>⭐</th><th>도전</th><th>번역 본 단락</th><th>최근</th></tr>' + list.map(function (x) {
          var b = findBook(x.book_id);
          return "<tr><td>" + esc(b ? b.titleKo : x.book_id) + "</td><td>" + esc(b ? lvName(levelOf(b)) : "") + "</td><td>" + x.best + "/" + x.total + "</td><td>" + (x.medal ? MEDALS[x.medal].em : "") + "</td><td>" + (x.star ? "⭐" : "") + "</td><td>" + x.attempts + "</td><td>" + (x.hints || 0) + "</td><td>" + fmtDate(x.last_at) + "</td></tr>";
        }).join("") + "</table></div>" : '<p class="muted">아직 퀴즈 기록이 없어요.</p>') +
        '<div style="margin-top:12px"><button class="btn" id="stuclose">닫기</button></div></div>';
      document.body.appendChild(o);
      o.onclick = function (e) { if (e.target === o) o.remove(); };
      document.getElementById("stuclose").onclick = function () { o.remove(); };
    }

    // 📚 작품
    function drawBooks() {
      document.getElementById("tbody").innerHTML =
        '<div class="card"><h2>📚 작품별 현황</h2>' + clsPicker() + ' <button class="btn ghost small" id="csv3">작품별 현황 CSV</button>' +
        '<p class="muted">도전한 학생이 많은 순서예요. 평균 점수는 학생별 최고 점수의 평균이에요.</p><div class="scroll"><table id="btbl"></table></div><p class="muted" id="bnone"></p></div>';
      var rowsCache = [];
      function draw() {
        var by = {};
        sc.filter(inCls).forEach(function (r) {
          var s = by[r.book_id] = by[r.book_id] || { tried: 0, medal: 0, gold: 0, sum: 0, stars: 0, hints: 0 };
          s.tried++; if (r.medal) s.medal++; if (r.medal === "gold") s.gold++;
          s.sum += r.total ? r.best / r.total : 0; if (r.star) s.stars++; s.hints += r.hints || 0;
        });
        rowsCache = books.filter(function (b) { return by[b.id]; }).map(function (b) { return { b: b, s: by[b.id] }; })
          .sort(function (x, y) { return y.s.tried - x.s.tried || y.s.medal - x.s.medal; });
        document.getElementById("btbl").innerHTML = "<tr><th>작품</th><th>수준</th><th>도전 학생</th><th>메달 학생</th><th>🥇</th><th>평균 점수</th><th>⭐ 무힌트</th><th>평균 번역 단락</th></tr>" +
          rowsCache.map(function (x) {
            var avg = Math.round((x.s.sum / x.s.tried) * 100);
            return "<tr><td>" + esc(x.b.emoji) + " " + esc(x.b.titleKo) + "</td><td>" + esc(lvName(levelOf(x.b))) + "</td><td>" + x.s.tried + "</td><td>" + x.s.medal + " <span class=\"muted\">(" + pct(x.s.medal, x.s.tried) + "%)</span></td><td>" + x.s.gold +
              "</td><td>" + rateBar(avg) + "</td><td>" + x.s.stars + "</td><td>" + (x.s.hints / x.s.tried).toFixed(1) + "</td></tr>";
          }).join("");
        var none = books.length - rowsCache.length;
        document.getElementById("bnone").textContent = none ? "아직 아무도 도전하지 않은 작품: " + none + "권" : "";
      }
      draw();
      bindCls(draw);
      document.getElementById("csv3").onclick = function () {
        csvDownload("작품별현황.csv", [["작품", "영어 제목", "수준", "도전학생", "메달학생", "금메달", "평균점수(%)", "무힌트별", "평균번역단락"]].concat(rowsCache.map(function (x) {
          return [x.b.titleKo, x.b.title, levelOf(x.b), x.s.tried, x.s.medal, x.s.gold, Math.round((x.s.sum / x.s.tried) * 100), x.s.stars, (x.s.hints / x.s.tried).toFixed(1)];
        })));
      };
    }

    // 🏅 TOP 10 (학생 화면과 같은 순위)
    function drawBoard() {
      var nickTo = {};
      ov.forEach(function (r) { if (r.nickname) nickTo[r.nickname] = r; });
      document.getElementById("tbody").innerHTML =
        '<div class="card board"><h2>🏅 메달 순위 TOP 10</h2><p class="muted">학생 화면과 같은 순위예요. 학교 학생 중 이름 공개를 켠 학생만 나와요. 교사 화면에서만 실명이 함께 보여요.</p>' +
        (board.length ? "<ol>" + board.map(function (r, i) {
          var rk = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
          var who = nickTo[r.nickname];
          return '<li class="' + (i < 3 ? "top3" : "") + '"><span class="rk">' + rk + '</span><span class="nm">' + esc(r.nickname) +
            (who ? ' <span class="muted" style="font-size:.85rem">' + esc((who.grade ? who.grade + "-" + who.class_no + " " : "") + (who.name || "")) + "</span>" : "") +
            '</span><span class="ms">🥇' + r.gold + " 🥈" + r.silver + " 🥉" + r.bronze + " ⭐" + r.stars + "</span></li>";
        }).join("") + "</ol>" : '<p class="muted">아직 메달을 받은 학생이 없어요.</p>') + "</div>";
    }

    // 🧩 문항·힌트
    async function drawQuiz() {
      var hsBooks = {};
      hs.forEach(function (h) { hsBooks[h.book_id] = 1; });
      document.getElementById("tbody").innerHTML = '<p class="muted center" style="padding:20px 0">불러오는 중...</p>';
      await Promise.all(Object.keys(hsBooks).map(function (bid) { return loadContent(bid).catch(function () { return null; }); }));
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
        return "<tr><td>" + esc(bk ? bk.titleKo : q.book_id) + "</td><td>" + q.no + '번</td><td class="qtext">' + esc(q.question) + "</td><td>" + q.attempts + "회</td><td>" + rateBar(q.rate) + "</td></tr>";
      }).join("");
      if (state.tTab !== "quiz") return;
      document.getElementById("tbody").innerHTML =
        '<div class="card"><h2>📉 정답률이 낮은 문항</h2><p class="muted">학생들이 많이 틀린 문항부터 보여 줘요 (응시 기록 기준, 최대 20개).</p>' +
        (qRows ? '<div class="scroll"><table><tr><th>작품</th><th>문항</th><th>문제</th><th>응시</th><th>정답률</th></tr>' + qRows + "</table></div>" : '<p class="muted">아직 응시 기록이 없어요.</p>') + "</div>" +
        '<div class="card"><h2>💬 단락별 번역(힌트) 열람</h2><p class="muted">학생들이 어느 단락에서 한국어 번역을 많이 봤는지 보여 줘요.</p>' +
        (hintRows ? '<div class="scroll"><table><tr><th>작품</th><th>단락</th><th>내용</th><th>본 학생 수</th><th>누른 횟수</th></tr>' + hintRows + "</table></div>" : '<p class="muted">아직 기록이 없어요.</p>') + "</div>";
    }

    // ⚙️ 설정
    function drawSettings() {
      var ext = settings.allow_external === "true";
      var featRows = books.map(function (b) {
        return '<label style="display:block;padding:5px 0"><input type="checkbox" class="featcb" data-id="' + esc(b.id) + '" ' + (feat[b.id] ? "checked" : "") + "> " + esc(b.emoji) + " " + esc(b.title) + ' <span class="muted">(' + esc(b.titleKo) + " · " + esc(lvName(levelOf(b))) + ")</span></label>";
      }).join("");
      document.getElementById("tbody").innerHTML =
        '<div class="card"><h2>🎯 반 목표 단어 수</h2><p class="muted">학생 화면 “우리 반 함께 읽기”의 목표예요. 반 친구들이 메달 받은 작품의 단어 수를 모아 이 숫자에 도전해요.</p>' +
        '<input id="goalin" type="number" min="100" step="100" value="' + goalWords + '" style="width:140px;padding:7px 10px;border:1px solid var(--line);border-radius:10px"> 단어 <button class="btn small" id="goalsave">저장</button></div>' +
        '<div class="card"><h2>🌐 외부 이용자 퀴즈</h2><label><input type="checkbox" id="extcb" ' + (ext ? "checked" : "") + "> 학교 계정이 아닌 사람(개인 Gmail)도 퀴즈를 풀 수 있게 하기</label>" +
        '<p class="muted">끄면 학교 계정(@smy.ms.kr)과 교사만 퀴즈를 풀 수 있어요. 외부 이용자는 어느 경우에도 TOP 10에 나오지 않아요.</p></div>' +
        '<div class="card"><h2>👩‍🏫 교사 계정 관리</h2><p class="muted">여기 있는 Google 계정으로 로그인하면 교사 화면이 열려요. 교사는 학생 실명·점수를 보고 설정을 바꿀 수 있으니 꼭 필요한 분만 추가해 주세요. 지금 로그인한 본인 계정과 마지막 남은 교사 계정은 지울 수 없어요.</p>' +
        '<div id="adminlist" class="muted">불러오는 중...</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><input id="adminin" type="email" placeholder="teacher@gmail.com" style="flex:1;min-width:200px;padding:7px 10px;border:1px solid var(--line);border-radius:10px"><button class="btn small" id="adminadd">교사 추가</button></div></div>' +
        '<div class="card"><h2>🌟 선생님 추천 책</h2><p class="muted">체크한 책은 학생 책장 맨 위 “선생님 추천” 칸에 나와요.</p><div style="max-height:420px;overflow-y:auto">' + featRows + "</div></div>" +
        '<div class="card"><h2>📋 명단 올리기</h2><p class="muted">한 줄에 한 명: <code>이메일,이름,학년,반,번호</code> (엑셀에서 복사해 붙여넣어도 돼요). 이미 가입한 학생에게도 바로 적용돼요.</p>' +
        '<textarea id="roster" placeholder="202610101@smy.ms.kr,이름,1,1,1"></textarea><br><button class="btn" id="saveroster" style="margin-top:8px">명단 저장</button></div>';
      async function loadAdmins() {
        var box = document.getElementById("adminlist");
        if (!box) return;
        var r = await sb.rpc("admin_list_admins");
        if (r.error) { box.textContent = "불러오지 못했어요: " + cleanMsg(r.error.message); return; }
        var list = r.data || [];
        box.className = "";
        box.innerHTML = '<div class="scroll"><table><tr><th>이메일</th><th>상태</th><th></th></tr>' + list.map(function (a) {
          return "<tr><td>" + esc(a.email) + (a.me ? ' <span class="badge gold">나</span>' : "") + "</td><td>" + (a.joined ? "로그인한 적 있음" : '<span class="muted">아직 로그인 전</span>') + "</td><td>" +
            (a.me || list.length <= 1 ? "" : '<button class="btn ghost small admindel" data-e="' + esc(a.email) + '">삭제</button>') + "</td></tr>";
        }).join("") + "</table></div>";
        each(".admindel", function (b) {
          b.onclick = async function () {
            var e = b.getAttribute("data-e");
            if (!window.confirm(e + " 계정의 교사 권한을 없앨까요?")) return;
            var d = await sb.rpc("admin_remove_admin", { p_email: e });
            if (d.error) return toast("삭제 실패: " + cleanMsg(d.error.message));
            toast(e + " 교사 권한을 없앴어요"); loadAdmins();
          };
        });
      }
      loadAdmins();
      document.getElementById("adminadd").onclick = async function () {
        var inp = document.getElementById("adminin"), e = inp.value.trim().toLowerCase();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return toast("이메일 주소를 정확히 넣어 주세요.");
        if (!window.confirm(e + " 계정을 교사로 추가할까요? 이 계정은 학생 실명과 점수를 볼 수 있어요.")) return;
        var r = await sb.rpc("admin_add_admin", { p_email: e });
        if (r.error) return toast("추가 실패: " + cleanMsg(r.error.message));
        inp.value = ""; toast(e + " 계정을 교사로 추가했어요"); loadAdmins();
      };
      document.getElementById("goalsave").onclick = async function () {
        var v = parseInt(document.getElementById("goalin").value, 10);
        if (!(v >= 100)) return toast("100 이상의 숫자를 넣어 주세요.");
        var r = await sb.rpc("admin_set_setting", { p_key: "class_goal_words", p_value: String(v) });
        if (r.error) return toast("저장 실패: " + r.error.message);
        settings.class_goal_words = String(v); goalWords = v; toast("반 목표를 " + v.toLocaleString() + "단어로 바꿨어요");
      };
      document.getElementById("extcb").onchange = async function () {
        var cb = this;
        var r = await sb.rpc("admin_set_setting", { p_key: "allow_external", p_value: cb.checked ? "true" : "false" });
        if (r.error) { cb.checked = !cb.checked; return toast("저장 실패: " + r.error.message); }
        settings.allow_external = cb.checked ? "true" : "false";
        toast(cb.checked ? "외부 이용자도 퀴즈를 풀 수 있어요" : "학교 계정만 퀴즈를 풀 수 있어요");
      };
      each(".featcb", function (cb) {
        cb.onchange = async function () {
          var r = await sb.from("books").update({ featured: cb.checked }).eq("id", cb.getAttribute("data-id"));
          if (r.error) { cb.checked = !cb.checked; return toast("저장 실패: " + r.error.message); }
          feat[cb.getAttribute("data-id")] = cb.checked;
          toast(cb.checked ? "추천 책으로 지정했어요" : "추천을 해제했어요");
        };
      });
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

    var DRAW = { "class": drawClass, students: drawStudents, books: drawBooks, board: drawBoard, quiz: drawQuiz, settings: drawSettings };
    function show(t) {
      state.tTab = t;
      each("#ttabs button", function (b) { b.classList.toggle("on", b.getAttribute("data-t") === t); });
      var p = DRAW[t]();
      if (p && p.catch) p.catch(showError);
    }
    each("#ttabs button", function (b) { b.onclick = function () { show(b.getAttribute("data-t")); }; });
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    show(state.tTab);
  }

  sb.auth.onAuthStateChange(function (evt, session) {
    if (evt === "SIGNED_IN" && session && (!state.user || state.user.id !== session.user.id)) setTimeout(boot, 0);
    if (evt === "SIGNED_OUT") setTimeout(boot, 0);
  });
  boot();
})();
