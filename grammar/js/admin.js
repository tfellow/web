/* MY Grammar 교사 화면 */
(function () {
  "use strict";
  var C = window.MG_CONFIG, api = MG.api, A = api.admin, esc = MG.esc, $ = MG.$, $$ = MG.$$;
  var $app = $("#app");
  var D = { players: [], topics: [], questions: [], stamps: [], badges: [], certs: [], topicBy: {}, qBy: {}, pBy: {} };
  var P = { key: "7", from: null, to: null };
  var sortState = {};

  boot();
  async function boot() {
    try {
      var session = await api.session();
      if (!session) return renderLogin();
      var me = await api.me();
      if (!me.allowed || !me.is_admin) return renderNotAdmin(me.email || (session.user && session.user.email));
      D.me = me.player;
      await loadBase();
      renderChrome();
      setPeriod("7");
      window.addEventListener("hashchange", route);
      route();
    } catch (e) { err(e); }
  }
  async function loadBase() {
    var r = await Promise.all([A.players(), A.topics(), A.questions(), A.table("mg_stamps"), A.table("mg_badges"), A.table("mg_certs")]);
    D.players = r[0]; D.topics = r[1]; D.questions = r[2]; D.stamps = r[3]; D.badges = r[4]; D.certs = r[5];
    D.topicBy = {}; D.topics.forEach(function (t) { D.topicBy[t.code] = t; });
    D.qBy = {}; D.questions.forEach(function (q) { D.qBy[q.id] = q; });
    D.pBy = {}; D.players.forEach(function (p) { D.pBy[p.id] = p; });
  }
  function err(e) { console.error(e); $app.innerHTML = '<div class="card"><h2>문제가 생겼어요</h2><p class="err">' + esc(e.message || e) + "</p><p class=\"small muted\">처음이라면 README의 'Supabase SQL 실행' 단계를 먼저 해 주세요.</p></div>"; }
  function renderLogin(msg) {
    $app.innerHTML = '<div class="card login">' + MG.mascot() + "<h1>교사 화면</h1><p class=\"muted\">MY Grammar 관리자 계정으로 로그인하세요.</p>" +
      (MG.DEMO ? '<button class="btn primary" id="demo-in">체험 모드로 들어가기</button>' : '<div id="gbtn"></div>') + '<div class="err" id="lerr">' + esc(msg || "") + "</div></div>";
    if (MG.DEMO) $("#demo-in").onclick = async function () { await api.signInDemo(); location.reload(); };
    else MG.renderGoogleButton($("#gbtn"), function (m) { $("#lerr").textContent = m; });
  }
  function renderNotAdmin(email) {
    $app.innerHTML = '<div class="card login"><h2>관리자만 들어올 수 있어요</h2><p><b>' + esc(email || "") + "</b> 계정은 관리자 목록에 없어요.</p>" +
      '<div class="row gap" style="justify-content:center"><a class="btn" href="./">학생 화면으로</a><button class="btn primary" id="so">다른 계정으로 로그인</button></div></div>';
    $("#so").onclick = MG.signOut;
  }

  /* ---------- 틀 ---------- */
  var NAV = [["#/", "📊", "대시보드"], ["#/students", "👩‍🎓", "학생별"], ["#/classes", "🏫", "반별"], ["#/qstats", "🎯", "문제별 통계"],
    ["#/questions", "🗂️", "문제 관리"], ["#/add", "➕", "문제 추가"], ["#/topics", "📖", "단원 관리"], ["#/certs", "🎓", "인증서"], ["#/settings", "⚙️", "설정"]];
  function renderChrome() {
    $("#sidenav").innerHTML = NAV.map(function (n) { return '<a href="' + n[0] + '" data-nav="' + n[0] + '"><span class="em">' + n[1] + "</span>" + n[2] + "</a>"; }).join("") +
      '<div class="sep"></div><a href="./' + (MG.DEMO ? "?demo=1" : "") + '"><span class="em">🎒</span>학생 화면</a><a href="guide.html" target="_blank"><span class="em">📘</span>학생 설명서</a><a href="#" id="so"><span class="em">🚪</span>로그아웃</a>';
    $("#so").onclick = function (e) { e.preventDefault(); MG.signOut(); };
    $("#chips").innerHTML = '<span class="chip hide-sm">👩‍🏫 ' + esc(D.me.email) + "</span>";
    if (MG.DEMO) document.body.insertAdjacentHTML("beforeend", '<div class="demo-flag">체험 모드</div>');
    var st = document.createElement("style");
    st.textContent = "@media (max-width:820px){.shell{padding-bottom:40px}}.adm-tabs{display:none;gap:6px;overflow-x:auto;margin:-4px 0 14px;padding-bottom:4px}.adm-tabs a{flex-shrink:0;padding:8px 12px;border-radius:999px;border:1px solid var(--line);background:var(--paper);text-decoration:none;color:var(--ink);font-weight:700;font-size:.88rem}.adm-tabs a.on{background:var(--brand);color:var(--on-brand);border-color:var(--brand)}@media (max-width:820px){.adm-tabs{display:flex}}";
    document.head.appendChild(st);
  }
  function route() {
    var h = location.hash || "#/", base = "#/" + (h.slice(2).split("/")[0] || "");
    $$("[data-nav]").forEach(function (a) { a.classList.toggle("on", a.getAttribute("data-nav") === base); });
    window.scrollTo(0, 0);
    $$(".overlay").forEach(function (o) { o.remove(); });
    var arg = decodeURIComponent(h.slice(2).split("/")[1] || "");
    var f = { "#/": dash, "#/students": students, "#/classes": classes, "#/qstats": qstats, "#/questions": questions, "#/add": addPage, "#/topics": topics, "#/certs": certs, "#/settings": settings }[base] || dash;
    $app.innerHTML = '<nav class="adm-tabs">' + NAV.map(function (n) { return '<a href="' + n[0] + '" class="' + (n[0] === base ? "on" : "") + '">' + n[1] + " " + n[2] + "</a>"; }).join("") + '<a href="./' + (MG.DEMO ? "?demo=1" : "") + '">🎒 학생 화면</a></nav><div id="page"><div class="loading">불러오는 중…</div></div>';
    Promise.resolve(f(arg)).catch(function (e) { $("#page").innerHTML = '<p class="err">' + esc(e.message) + "</p>"; });
  }
  function page(html) { $("#page").innerHTML = html; }

  /* ---------- 기간 ---------- */
  function setPeriod(key, f, t) {
    P.key = key;
    var now = new Date(), kst = MG.kstDate();
    var start = function (d) { return new Date(d + "T00:00:00+09:00"); };
    P.to = new Date(now.getTime() + 60e3);
    if (key === "today") P.from = start(kst);
    else if (key === "7") P.from = start(MG.kstDate(Date.now() - 6 * 864e5));
    else if (key === "30") P.from = start(MG.kstDate(Date.now() - 29 * 864e5));
    else if (key === "sem") { var m = +kst.slice(5, 7), y = kst.slice(0, 4); P.from = start(m >= 8 ? y + "-08-01" : m >= 3 ? y + "-03-01" : (y - 1) + "-08-01"); }
    else if (key === "all") P.from = new Date("2020-01-01T00:00:00Z");
    else if (key === "custom") { P.from = start(f); P.to = new Date(new Date(t + "T00:00:00+09:00").getTime() + 864e5); }
  }
  function periodBar(onChange) {
    var keys = [["today", "오늘"], ["7", "최근 7일"], ["30", "최근 30일"], ["sem", "이번 학기"], ["all", "전체"]];
    var html = '<div class="card" style="padding:12px 16px"><div class="row gap wrap"><b>기간</b>' + keys.map(function (k) {
      return '<button class="pill ' + (P.key === k[0] ? "on" : "") + '" data-pk="' + k[0] + '">' + k[1] + "</button>";
    }).join("") + '<span class="row gap wrap"><input type="date" id="pf" style="width:auto;max-width:150px" value="' + MG.kstDate(P.from) + '"> ~ <input type="date" id="pt" style="width:auto;max-width:150px" value="' + MG.kstDate(P.to.getTime() - 61e3) + '"><button class="btn sm" id="papply">적용</button></span></div></div>';
    setTimeout(function () {
      $$("[data-pk]").forEach(function (b) { b.onclick = function () { setPeriod(b.getAttribute("data-pk")); onChange(); }; });
      var ap = $("#papply"); if (ap) ap.onclick = function () { setPeriod("custom", $("#pf").value, $("#pt").value); onChange(); };
    });
    return html;
  }
  function F() { return P.from.toISOString(); } function T() { return P.to.toISOString(); }

  /* ---------- 표 도우미 ---------- */
  function table(id, cols, rows, opts) {
    opts = opts || {};
    var s = sortState[id];
    if (s) {
      var c = cols.filter(function (x) { return x.k === s.k; })[0];
      if (c) rows = rows.slice().sort(function (a, b) {
        var va = c.v ? c.v(a) : a[c.k], vb = c.v ? c.v(b) : b[c.k];
        if (va == null) return 1; if (vb == null) return -1;
        return (va > vb ? 1 : va < vb ? -1 : 0) * s.d;
      });
    }
    var lim = opts.limit || 500;
    return '<div class="tablewrap" id="' + id + '" style="max-height:' + (opts.h || "70vh") + '"><table><thead><tr>' + cols.map(function (c) {
      return '<th data-sort="' + c.k + '" class="' + (c.num ? "num" : "") + '">' + c.label + (s && s.k === c.k ? (s.d > 0 ? " ▲" : " ▼") : "") + "</th>";
    }).join("") + "</tr></thead><tbody>" + (rows.length ? rows.slice(0, lim).map(function (r, i) {
      return '<tr class="' + (opts.click ? "click" : "") + '" data-i="' + (opts.key ? esc(r[opts.key]) : i) + '">' + cols.map(function (c) {
        var v = c.v ? c.v(r) : r[c.k];
        return '<td class="' + (c.num ? "num " : "") + (c.wrap ? "wrapcell" : "") + '">' + (c.f ? c.f(r, v) : esc(v == null ? "" : v)) + "</td>";
      }).join("") + "</tr>";
    }).join("") : '<tr><td colspan="' + cols.length + '" class="empty">자료가 없어요</td></tr>') + "</tbody></table></div>" +
      (rows.length > lim ? '<p class="small muted">앞의 ' + lim + "개만 보여요. CSV로 내려받으면 전체를 볼 수 있어요.</p>" : "");
  }
  function bindTable(id, rerender, onClick) {
    var el = $("#" + id); if (!el) return;
    $$("th[data-sort]", el).forEach(function (th) {
      th.onclick = function () { var k = th.getAttribute("data-sort"), s = sortState[id]; sortState[id] = { k: k, d: s && s.k === k ? -s.d : -1 }; rerender(); };
    });
    if (onClick) $$("tbody tr[data-i]", el).forEach(function (tr) { tr.onclick = function (e) { if (e.target.closest("button,input,a")) return; onClick(tr.getAttribute("data-i")); }; });
  }
  function accTag(r, n) { if (!n) return '<span class="muted">-</span>'; var p = MG.pct(r, n); return '<span class="tag ' + (p >= 80 ? "ok" : p < 50 ? "bad" : "brand") + '">' + p + "%</span>"; }
  function sid(p) { return p && p.grade ? p.grade + "-" + (p.class_no || "?") + "-" + (p.student_no || "?") : "-"; }
  function students_() { return D.players.filter(function (p) { return !isAdminEmail(p.email); }); }
  var adminEmails = null;
  function isAdminEmail(e) { return adminEmails ? adminEmails.indexOf(e) >= 0 : /^tfellow@/.test(e || ""); }
  function qText(q) { return q ? String(q.prompt).replace(/[\[\]]/g, "") : "(삭제된 문제)"; }

  /* ---------- 대시보드 ---------- */
  async function dash() {
    var r = await Promise.all([A.byStudent(F(), T()), A.byDay(F(), T()), A.byQuestion(F(), T())]);
    var bs = r[0], days = r[1], bq = r[2];
    var att = bs.reduce(function (n, x) { return n + +x.attempts; }, 0), cor = bs.reduce(function (n, x) { return n + +x.correct; }, 0);
    var stu = students_(), todayRow = days.filter(function (d) { return String(d.day).slice(0, 10) === MG.kstDate(); })[0];
    var inP = function (t) { var x = new Date(t).getTime(); return x >= P.from.getTime() && x < P.to.getTime(); };
    var newStamps = D.stamps.filter(function (s) { return inP(s.earned_at); }).length, newCerts = D.certs.filter(function (c) { return inP(c.issued_at); }).length;
    // 단원별
    var byT = {};
    bq.forEach(function (x) { var q = D.qBy[x.question_id]; if (!q) return; var t = byT[q.topic_code] = byT[q.topic_code] || { a: 0, c: 0 }; t.a += +x.attempts; t.c += +x.correct; });
    var tlist = Object.keys(byT).map(function (k) { return { code: k, a: byT[k].a, c: byT[k].c, p: MG.pct(byT[k].c, byT[k].a) }; }).sort(function (a, b) { return a.p - b.p; });
    var hard = bq.filter(function (x) { return x.attempts >= 3 && D.qBy[x.question_id]; }).sort(function (a, b) { return a.correct / a.attempts - b.correct / b.attempts; }).slice(0, 6);
    var top = bs.slice().sort(function (a, b) { return b.xp - a.xp; }).filter(function (x) { return D.pBy[x.user_id] && !isAdminEmail(D.pBy[x.user_id].email); }).slice(0, 10);
    var activeQ = D.questions.filter(function (q) { return q.active; }).length;
    page(periodBar(dash) +
      '<div class="kpis mb"><div class="kpi"><b>' + stu.length + '</b><span>가입 학생</span></div><div class="kpi"><b>' + bs.length + '</b><span>기간 중 활동 학생</span></div>' +
      '<div class="kpi"><b>' + att + '</b><span>푼 문제 수</span></div><div class="kpi"><b>' + MG.pct(cor, att) + '%</b><span>정답률</span></div>' +
      '<div class="kpi"><b>' + (todayRow ? todayRow.users : 0) + '</b><span>오늘 공부한 학생</span></div><div class="kpi"><b>' + newStamps + " / " + newCerts + '</b><span>새 스탬프 / 인증서</span></div>' +
      '<div class="kpi"><b>' + activeQ + '</b><span>공개 문제 수</span></div><div class="kpi"><b>' + D.topics.filter(function (t) { return t.active; }).length + '</b><span>공개 단원 수</span></div></div>' +
      '<div class="card"><h2>📈 날짜별 학습량 <span class="sub">막대 = 푼 문제 수, 숫자 = 학생 수</span></h2>' + dayChart(days) + "</div>" +
      '<div class="grid g2"><div class="card"><h2>🧩 단원별 정답률 <span class="sub">낮은 순</span></h2>' + (tlist.length ? tlist.slice(0, 10).map(function (t) {
        return '<div class="weak"><span class="lbl">' + esc((D.topicBy[t.code] || {}).title || t.code) + '</span><div class="bar grow"><i style="width:' + t.p + "%;background:" + (t.p < 50 ? "var(--bad)" : t.p < 80 ? "var(--brand)" : "var(--ok)") + '"></i></div><b class="num" style="width:90px">' + t.p + "% <span class=\"muted small\">(" + t.a + ")</span></b></div>";
      }).join("") : '<p class="muted">기간 중 기록이 없어요.</p>') + "</div>" +
      '<div class="card"><h2>🏅 기간 XP Top 10</h2>' + (top.length ? '<ol class="rank-list">' + top.map(function (x, i) {
        var p = D.pBy[x.user_id];
        return '<li><span class="no">' + (i + 1) + '</span><span class="grow"><b>' + esc(p.real_name || p.email) + '</b> <span class="muted small">' + esc(p.nickname || "") + " · " + sid(p) + '</span></span><b class="num">' + x.xp + " XP</b></li>";
      }).join("") + "</ol>" : '<p class="muted">기록이 없어요.</p>') + "</div></div>" +
      '<div class="card"><h2>⚠️ 학생들이 가장 어려워한 문제</h2>' + (hard.length ? hard.map(function (x) {
        var q = D.qBy[x.question_id];
        return '<div class="ex"><span class="tag bad">' + MG.pct(x.correct, x.attempts) + '%</span><div class="grow"><div class="en">' + esc(qText(q)) + '</div><div class="ko">' + esc((D.topicBy[q.topic_code] || {}).title || "") + " · 정답 " + esc(q.answer) + (x.top_wrong ? ' · 가장 많은 오답 "' + esc(x.top_wrong) + '"' : "") + " · " + x.attempts + "회</div></div></div>";
      }).join("") : '<p class="muted">3번 이상 풀린 문제가 아직 없어요.</p>') + "</div>");
  }
  function dayChart(days) {
    if (!days.length) return '<p class="muted">기록이 없어요.</p>';
    var W = 900, H = 220, pad = 28, n = days.length, max = Math.max.apply(null, days.map(function (d) { return +d.attempts; })) || 1;
    var bw = Math.max(4, (W - pad * 2) / n - 4);
    var bars = days.map(function (d, i) {
      var h = ((+d.attempts) / max) * (H - 60), x = pad + i * ((W - pad * 2) / n), y = H - 30 - h, acc = MG.pct(d.correct, d.attempts);
      return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + h + '" rx="3" fill="var(--brand)" opacity=".85"><title>' + String(d.day).slice(0, 10) + ": " + d.attempts + "문제, 정답률 " + acc + "%, 학생 " + d.users + "명</title></rect>" +
        (n <= 31 ? '<text x="' + (x + bw / 2) + '" y="' + (y - 4) + '" text-anchor="middle">' + d.users + "</text>" : "") +
        (n <= 16 || i % Math.ceil(n / 12) === 0 ? '<text x="' + (x + bw / 2) + '" y="' + (H - 12) + '" text-anchor="middle">' + String(d.day).slice(5, 10) + "</text>" : "");
    }).join("");
    return '<svg class="chart" viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="날짜별 학습량">' + '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + (H - 30) + '" y2="' + (H - 30) + '" stroke="var(--line)"/>' + bars + "</svg>";
  }

  /* ---------- 학생별 ---------- */
  var stuFilter = { q: "", cls: "" };
  async function students(arg) {
    if (arg) stuFilter.cls = arg;
    var bs = await A.byStudent(F(), T()), by = {};
    bs.forEach(function (x) { by[x.user_id] = x; });
    var stCnt = {}, ceCnt = {};
    D.stamps.forEach(function (s) { stCnt[s.user_id] = (stCnt[s.user_id] || 0) + 1; });
    D.certs.forEach(function (s) { ceCnt[s.user_id] = (ceCnt[s.user_id] || 0) + 1; });
    var rows = students_().map(function (p) {
      var b = by[p.id] || {};
      return Object.assign({}, p, { sid: sid(p), lv: MG.levelOf(p.xp), pa: +b.attempts || 0, pc: +b.correct || 0, pxp: +b.xp || 0, pd: +b.days || 0, st: stCnt[p.id] || 0, ce: ceCnt[p.id] || 0, sortSid: (p.grade || 9) * 10000 + (p.class_no || 99) * 100 + (p.student_no || 99) });
    });
    var classes = {}; rows.forEach(function (r) { if (r.grade) classes[r.grade + "-" + r.class_no] = 1; });
    function draw() {
      var q = stuFilter.q.toLowerCase();
      var list = rows.filter(function (r) {
        return (!stuFilter.cls || r.grade + "-" + r.class_no === stuFilter.cls) && (!q || [r.real_name, r.nickname, r.email, r.sid].join(" ").toLowerCase().indexOf(q) >= 0);
      });
      if (!sortState.stu) list.sort(function (a, b) { return a.sortSid - b.sortSid; });
      $("#stuwrap").innerHTML = '<p class="small muted">' + list.length + "명 · 기간 활동 " + list.filter(function (r) { return r.pa; }).length + "명</p>" + table("stu", [
        { k: "sortSid", label: "학년-반-번호", f: function (r) { return r.sid; } },
        { k: "real_name", label: "실명", f: function (r) { return "<b>" + esc(r.real_name || "-") + "</b>"; } },
        { k: "nickname", label: "닉네임" },
        { k: "lv", label: "레벨", num: true, f: function (r) { return MG.titleOf(r.lv).em + " " + r.lv; } },
        { k: "xp", label: "누적 XP", num: true },
        { k: "pa", label: "기간 풀이", num: true },
        { k: "pacc", label: "기간 정답률", num: true, v: function (r) { return r.pa ? r.pc / r.pa : null; }, f: function (r) { return accTag(r.pc, r.pa); } },
        { k: "pd", label: "학습일", num: true },
        { k: "streak", label: "연속", num: true, f: function (r) { return r.streak ? "🔥" + r.streak : "-"; } },
        { k: "st", label: "스탬프", num: true },
        { k: "ce", label: "인증서", num: true },
        { k: "last_at", label: "마지막 활동", f: function (r) { return r.last_at ? MG.kstTime(r.last_at) : "-"; } },
        { k: "email", label: "이메일", f: function (r) { return '<span class="small muted">' + esc(r.email) + "</span>"; } }
      ], list, { click: true, key: "id" });
      bindTable("stu", draw, function (id) { studentModal(id); });
      $("#stucsv").onclick = function () {
        MG.download("MY_Grammar_학생_" + MG.kstDate() + ".csv", MG.csv([["학년", "반", "번호", "실명", "닉네임", "이메일", "레벨", "누적XP", "기간풀이", "기간정답", "기간정답률", "학습일", "연속", "최고연속", "스탬프", "인증서", "마지막활동"]].concat(list.map(function (r) {
          return [r.grade, r.class_no, r.student_no, r.real_name, r.nickname, r.email, r.lv, r.xp, r.pa, r.pc, r.pa ? MG.pct(r.pc, r.pa) + "%" : "", r.pd, r.streak, r.best_streak, r.st, r.ce, r.last_at ? MG.kstTime(r.last_at) : ""];
        }))), "text/csv;charset=utf-8");
      };
    }
    page(periodBar(students) + '<div class="card"><div class="row gap wrap mb"><input id="stuq" placeholder="🔍 이름, 닉네임, 이메일 검색" style="max-width:320px" value="' + esc(stuFilter.q) + '">' +
      '<select id="stucls" style="width:auto"><option value="">전체 반</option>' + Object.keys(classes).sort().map(function (k) { return "<option" + (stuFilter.cls === k ? " selected" : "") + ' value="' + k + '">' + k.replace("-", "학년 ") + "반</option>"; }).join("") + "</select>" +
      '<button class="btn sm" id="stucsv">⬇️ CSV (엑셀)</button></div><div id="stuwrap"></div><p class="small muted">학생을 누르면 자세한 기록과 정보 수정 화면이 열려요. 제목을 누르면 정렬돼요.</p></div>');
    $("#stuq").oninput = function () { stuFilter.q = this.value; draw(); };
    $("#stucls").onchange = function () { stuFilter.cls = this.value; draw(); };
    draw();
  }

  async function studentModal(id) {
    var p = D.pBy[id]; if (!p) return;
    var ov = MG.modal('<div class="loading">불러오는 중…</div>', { wide: true });
    var sh = $(".sheet", ov);
    var r = await Promise.all([A.studentTopics(id), A.recentAttempts(id)]);
    var tp = r[0], rec = r[1];
    var myStamps = D.stamps.filter(function (s) { return s.user_id === id; }), myBadges = D.badges.filter(function (s) { return s.user_id === id; }), myCerts = D.certs.filter(function (s) { return s.user_id === id; });
    var li = MG.levelInfo(p.xp);
    sh.innerHTML = '<button class="x" aria-label="닫기">✕</button><h2>' + esc(p.real_name || "-") + ' <span class="muted" style="font-size:1rem">' + esc(p.nickname || "") + " · " + sid(p) + "</span></h2>" +
      '<p class="small muted">' + esc(p.email) + " · " + li.title.em + " Lv." + li.lv + " · " + p.xp + " XP · 🔥 " + p.streak + "일 (최고 " + p.best_streak + "일) · 최고 콤보 " + p.combo_best + " · 목표 달성 " + p.goal_days + "일</p>" +
      '<div class="card" style="box-shadow:none"><h2>✏️ 정보 수정</h2><div class="grid g3"><div><label>실명</label><input id="e_rn" value="' + esc(p.real_name || "") + '"></div><div><label>닉네임</label><input id="e_nn" value="' + esc(p.nickname || "") + '"></div>' +
      '<div class="grid g3" style="grid-template-columns:repeat(3,1fr)"><div><label>학년</label><input id="e_g" type="number" value="' + (p.grade || "") + '"></div><div><label>반</label><input id="e_c" type="number" value="' + (p.class_no || "") + '"></div><div><label>번호</label><input id="e_n" type="number" value="' + (p.student_no || "") + '"></div></div></div>' +
      '<div class="row gap mt"><button class="btn primary sm" id="e_save">저장</button><span class="err" id="e_err"></span></div></div>' +
      '<div class="grid g2"><div><h2>🧩 단원별 정답률</h2>' + (tp.length ? tp.sort(function (a, b) { return a.correct / a.attempts - b.correct / b.attempts; }).map(function (t) {
        var pc = MG.pct(t.correct, t.attempts);
        return '<div class="weak"><span class="lbl">' + esc((D.topicBy[t.topic_code] || {}).title || t.topic_code) + '</span><div class="bar grow"><i style="width:' + pc + "%;background:" + (pc < 50 ? "var(--bad)" : pc < 80 ? "var(--brand)" : "var(--ok)") + '"></i></div><b class="num" style="width:80px">' + pc + '% <span class="small muted">(' + t.attempts + ")</span></b></div>";
      }).join("") : '<p class="muted">기록 없음</p>') + "</div>" +
      "<div><h2>🏷️ 스탬프 " + myStamps.length + "개</h2><p>" + (myStamps.map(function (s) { return '<span class="tag brand">' + esc((D.topicBy[s.topic_code] || {}).title || s.topic_code) + "</span>"; }).join(" ") || '<span class="muted">없음</span>') + "</p>" +
      "<h2>🎖️ 배지 " + myBadges.length + "개</h2><p>" + (myBadges.map(function (b) { var d = MG.badge(b.code); return '<span class="tag" title="' + esc(d.desc) + '">' + d.em + " " + esc(d.name) + "</span>"; }).join(" ") || '<span class="muted">없음</span>') + "</p>" +
      "<h2>🎓 인증서 " + myCerts.length + "개</h2>" + (myCerts.map(function (c, i) { return '<button class="btn sm" data-c="' + i + '">🎓 ' + esc(c.title) + "</button> "; }).join("") || '<span class="muted">없음</span>') + "</div></div>" +
      '<h2 class="mt">🕘 최근 풀이 40개</h2>' + table("rec", [
        { k: "created_at", label: "시간", f: function (a) { return MG.kstTime(a.created_at); } },
        { k: "mode", label: "모드", f: function (a) { return esc(MG.MODES[a.mode] || a.mode || ""); } },
        { k: "q", label: "문제", wrap: true, f: function (a) { return esc(qText(D.qBy[a.question_id])); } },
        { k: "answer", label: "학생 답" },
        { k: "is_correct", label: "결과", f: function (a) { return a.is_correct ? '<span class="tag ok">정답</span>' : '<span class="tag bad">오답</span>'; } },
        { k: "xp", label: "XP", num: true }
      ], rec, { h: "40vh" });
    $(".x", sh).onclick = function () { ov.remove(); };
    $$("[data-c]", sh).forEach(function (b) { b.onclick = function () { MG.showCert(myCerts[+b.getAttribute("data-c")], whoOf(p)); }; });
    $("#e_save", sh).onclick = async function () {
      var patch = { real_name: $("#e_rn").value.trim() || null, nickname: $("#e_nn").value.trim() || null, grade: +$("#e_g").value || null, class_no: +$("#e_c").value || null, student_no: +$("#e_n").value || null };
      try { await A.updatePlayer(id, patch); Object.assign(p, patch); MG.toast("저장했어요"); ov.remove(); route(); }
      catch (e) { $("#e_err").textContent = /duplicate|unique/i.test(e.message) ? "이미 쓰는 닉네임이에요." : e.message; }
    };
  }
  function whoOf(p) { return { name: p.real_name, nickname: p.nickname, grade: p.grade, class_no: p.class_no }; }

  /* ---------- 반별 ---------- */
  async function classes() {
    var bs = await A.byStudent(F(), T()), by = {};
    bs.forEach(function (x) { by[x.user_id] = x; });
    var stCnt = {}; D.stamps.forEach(function (s) { stCnt[s.user_id] = (stCnt[s.user_id] || 0) + 1; });
    var g = {};
    students_().forEach(function (p) {
      var k = p.grade ? p.grade + "-" + p.class_no : "미지정", b = by[p.id] || {};
      var c = g[k] = g[k] || { key: k, members: 0, active: 0, a: 0, c: 0, pxp: 0, xp: 0, st: 0, streak: 0 };
      c.members++; if (b.attempts) c.active++; c.a += +b.attempts || 0; c.c += +b.correct || 0; c.pxp += +b.xp || 0; c.xp += p.xp; c.st += stCnt[p.id] || 0; if (p.streak >= 3) c.streak++;
    });
    var rows = Object.keys(g).map(function (k) { var c = g[k]; c.acc = c.a ? c.c / c.a : null; c.avg = Math.round(c.pxp / c.members); c.stAvg = Math.round((c.st / c.members) * 10) / 10; c.part = MG.pct(c.active, c.members); return c; })
      .sort(function (a, b) { return a.key < b.key ? -1 : 1; });
    function draw() {
      $("#clswrap").innerHTML = table("cls", [
        { k: "key", label: "반", f: function (c) { return "<b>" + esc(c.key.replace("-", "학년 ") + (c.key === "미지정" ? "" : "반")) + "</b>"; } },
        { k: "members", label: "학생 수", num: true },
        { k: "active", label: "활동 학생", num: true, f: function (c) { return c.active + ' <span class="muted small">(' + c.part + "%)</span>"; } },
        { k: "a", label: "푼 문제", num: true },
        { k: "acc", label: "정답률", num: true, f: function (c) { return accTag(c.c, c.a); } },
        { k: "avg", label: "1인당 기간 XP", num: true },
        { k: "xp", label: "누적 XP 합", num: true },
        { k: "stAvg", label: "1인당 스탬프", num: true },
        { k: "streak", label: "3일+ 연속 학생", num: true }
      ], rows, { click: true, key: "key" });
      bindTable("cls", draw, function (k) { stuFilter.cls = k === "미지정" ? "" : k; location.hash = "#/students"; });
    }
    page(periodBar(classes) + '<div class="card"><h2>🏫 반별 통계</h2><div id="clswrap"></div><p class="small muted">반을 누르면 그 반 학생 목록으로 가요.</p>' +
      '<button class="btn sm mt" id="clscsv">⬇️ CSV</button></div>');
    draw();
    $("#clscsv").onclick = function () {
      MG.download("MY_Grammar_반별_" + MG.kstDate() + ".csv", MG.csv([["반", "학생수", "활동학생", "푼문제", "정답률", "1인당기간XP", "누적XP합", "1인당스탬프"]].concat(rows.map(function (c) { return [c.key, c.members, c.active, c.a, c.a ? MG.pct(c.c, c.a) + "%" : "", c.avg, c.xp, c.stAvg]; }))), "text/csv");
    };
  }

  /* ---------- 문제별 통계 ---------- */
  var qsTopic = "";
  async function qstats() {
    var bq = await A.byQuestion(F(), T());
    var rows = bq.map(function (x) { var q = D.qBy[x.question_id] || {}; return Object.assign({}, x, { q: q, topic: q.topic_code, acc: x.attempts ? x.correct / x.attempts : null }); });
    // 단원별
    var byT = {};
    rows.forEach(function (r) { var t = byT[r.topic] = byT[r.topic] || { code: r.topic, a: 0, c: 0, n: 0 }; t.a += +r.attempts; t.c += +r.correct; t.n++; });
    var trows = Object.keys(byT).map(function (k) { var t = byT[k]; t.acc = t.a ? t.c / t.a : null; t.title = (D.topicBy[k] || {}).title || k; return t; });
    function draw() {
      var list = rows.filter(function (r) { return !qsTopic || r.topic === qsTopic; });
      if (!sortState.qs) list.sort(function (a, b) { return a.acc - b.acc; });
      $("#qswrap").innerHTML = table("qs", [
        { k: "question_id", label: "번호", num: true },
        { k: "topic", label: "단원", f: function (r) { return esc((D.topicBy[r.topic] || {}).title || r.topic || ""); } },
        { k: "type", label: "유형", v: function (r) { return r.q.qtype; }, f: function (r) { return esc(MG.QTYPES[r.q.qtype] || ""); } },
        { k: "prompt", label: "문제", wrap: true, v: function (r) { return r.q.prompt; }, f: function (r) { return esc(qText(r.q)); } },
        { k: "answer", label: "정답", v: function (r) { return r.q.answer; } },
        { k: "attempts", label: "시도", num: true },
        { k: "users", label: "학생 수", num: true },
        { k: "acc", label: "정답률", num: true, f: function (r) { return accTag(r.correct, r.attempts); } },
        { k: "top_wrong", label: "가장 많은 오답" }
      ], list, { click: true, key: "question_id" });
      bindTable("qs", draw, function (id) { editQuestion(D.qBy[id]); });
    }
    page(periodBar(qstats) + '<div class="card"><h2>🧩 단원별</h2>' + table("ts", [
      { k: "title", label: "단원" }, { k: "n", label: "풀린 문제 수", num: true }, { k: "a", label: "시도", num: true },
      { k: "acc", label: "정답률", num: true, f: function (t) { return accTag(t.c, t.a); } }
    ], trows, { h: "40vh" }) + "</div>" +
      '<div class="card"><h2>🎯 문제별 <span class="sub">정답률 낮은 순 · 누르면 문제 수정</span></h2><select id="qst" style="max-width:320px" class="mb"><option value="">전체 단원</option>' +
      D.topics.map(function (t) { return '<option value="' + esc(t.code) + '"' + (qsTopic === t.code ? " selected" : "") + ">" + esc(t.code + " " + t.title) + "</option>"; }).join("") + '</select><div id="qswrap"></div></div>');
    bindTable("ts", qstats);
    $("#qst").onchange = function () { qsTopic = this.value; draw(); };
    draw();
  }

  /* ---------- 문제 관리 ---------- */
  var qf = { topic: "", type: "", act: "", q: "" };
  function questions() {
    // 탑재 현황
    var stat = D.topics.map(function (t) {
      var qs = D.questions.filter(function (q) { return q.topic_code === t.code; });
      var o = { t: t, total: qs.length, act: qs.filter(function (q) { return q.active; }).length };
      Object.keys(MG.QTYPES).forEach(function (k) { o[k] = qs.filter(function (q) { return q.qtype === k; }).length; });
      [1, 2, 3].forEach(function (d) { o["d" + d] = qs.filter(function (q) { return q.difficulty === d; }).length; });
      return o;
    });
    var recent = D.questions.filter(function (q) { return Date.now() - new Date(q.created_at).getTime() < 7 * 864e5; }).length;
    page('<div class="card"><div class="row between wrap gap"><h2>📦 문제 탑재 현황</h2><div class="row gap wrap"><a class="btn sm primary" href="#/add">➕ 문제 추가 · 일괄 등록</a><button class="btn sm" id="exp">⬇️ 전체 내보내기 (TSV)</button></div></div>' +
      '<p class="small muted">전체 ' + D.questions.length + "문제 · 공개 " + D.questions.filter(function (q) { return q.active; }).length + "문제 · 최근 7일 추가 " + recent + "문제</p>" +
      '<div class="tablewrap" style="max-height:50vh"><table><thead><tr><th>단원</th><th>공개</th><th class="num">공개/전체</th>' + Object.keys(MG.QTYPES).map(function (k) { return '<th class="num">' + MG.QTYPES[k] + "</th>"; }).join("") + '<th class="num">쉬움·보통·어려움</th></tr></thead><tbody>' +
      stat.map(function (s) {
        return '<tr><td><b>' + esc(s.t.code) + "</b> " + esc(s.t.title) + "</td><td>" + (s.t.active ? '<span class="tag ok">공개</span>' : '<span class="tag">숨김</span>') + '</td><td class="num">' + (s.act < 3 ? '<span class="tag bad">' + s.act + "</span>" : s.act) + "/" + s.total + "</td>" +
          Object.keys(MG.QTYPES).map(function (k) { return '<td class="num">' + (s[k] || '<span class="muted">0</span>') + "</td>"; }).join("") + '<td class="num">' + s.d1 + " · " + s.d2 + " · " + s.d3 + "</td></tr>";
      }).join("") + '</tbody></table></div><p class="small muted">공개 문제가 3개 미만인 단원은 스탬프를 받을 수 없어요 (빨간색).</p></div>' +
      '<div class="card"><h2>🗂️ 문제 목록</h2><div class="row gap wrap mb"><select id="f_t" style="width:auto"><option value="">전체 단원</option>' + D.topics.map(function (t) { return '<option value="' + esc(t.code) + '">' + esc(t.code + " " + t.title) + "</option>"; }).join("") + "</select>" +
      '<select id="f_y" style="width:auto"><option value="">전체 유형</option>' + Object.keys(MG.QTYPES).map(function (k) { return '<option value="' + k + '">' + MG.QTYPES[k] + "</option>"; }).join("") + "</select>" +
      '<select id="f_a" style="width:auto"><option value="">공개+숨김</option><option value="1">공개만</option><option value="0">숨김만</option></select><input id="f_q" placeholder="🔍 문제 검색" style="max-width:260px"></div><div id="qlist"></div></div>');
    $("#f_t").value = qf.topic; $("#f_y").value = qf.type; $("#f_a").value = qf.act; $("#f_q").value = qf.q;
    function list() {
      var q = qf.q.toLowerCase();
      return D.questions.filter(function (x) {
        return (!qf.topic || x.topic_code === qf.topic) && (!qf.type || x.qtype === qf.type) && (qf.act === "" || String(x.active ? 1 : 0) === qf.act) &&
          (!q || (x.prompt + " " + x.answer + " " + (x.explanation || "")).toLowerCase().indexOf(q) >= 0);
      });
    }
    function draw() {
      var l = list();
      $("#qlist").innerHTML = '<p class="small muted">' + l.length + "문제</p>" + table("ql", [
        { k: "id", label: "번호", num: true },
        { k: "topic_code", label: "단원" },
        { k: "qtype", label: "유형", f: function (r) { return esc(MG.QTYPES[r.qtype]); } },
        { k: "prompt", label: "문제", wrap: true, f: function (r) { return esc(r.prompt); } },
        { k: "answer", label: "정답" },
        { k: "difficulty", label: "난이도", num: true, f: function (r) { return "★".repeat(r.difficulty); } },
        { k: "active", label: "공개", f: function (r) { return '<button class="btn sm ' + (r.active ? "" : "ghost") + '" data-tog="' + r.id + '">' + (r.active ? "✅ 공개" : "🙈 숨김") + "</button>"; } },
        { k: "source", label: "출처" }
      ], l, { click: true, key: "id" });
      bindTable("ql", draw, function (id) { editQuestion(D.qBy[id]); });
      $$("[data-tog]").forEach(function (b) {
        b.onclick = async function () {
          var q = D.qBy[b.getAttribute("data-tog")];
          try { await A.updateQuestion(q.id, { active: !q.active }); q.active = !q.active; draw(); } catch (e) { MG.toast(e.message, "bad"); }
        };
      });
    }
    $("#f_t").onchange = function () { qf.topic = this.value; draw(); };
    $("#f_y").onchange = function () { qf.type = this.value; draw(); };
    $("#f_a").onchange = function () { qf.act = this.value; draw(); };
    $("#f_q").oninput = function () { qf.q = this.value; draw(); };
    $("#exp").onclick = function () { MG.download("MY_Grammar_문제_" + MG.kstDate() + ".tsv", toTSV(list(), true), "text/tab-separated-values;charset=utf-8"); };
    draw();
  }
  var COLS = ["topic_code", "qtype", "prompt", "choices", "answer", "explanation", "difficulty", "source"];
  function toTSV(list, withId) {
    var clean = function (v) { v = v == null ? "" : String(v); return /[\t\n"]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var head = (withId ? ["id"] : []).concat(COLS, withId ? ["active"] : []);
    return [head.join("\t")].concat(list.map(function (q) {
      return (withId ? [q.id] : []).concat([q.topic_code, q.qtype, q.prompt, (q.choices || []).join("|"), q.answer, q.explanation, q.difficulty, q.source], withId ? [q.active ? "TRUE" : "FALSE"] : []).map(clean).join("\t");
    })).join("\n");
  }

  /* 문제 1개 추가·수정 */
  function qForm(q) {
    q = q || { topic_code: qf.topic || (D.topics[0] || {}).code, qtype: "mc", difficulty: 2, active: true, choices: ["", "", "", ""] };
    var ch = (q.choices || []).concat(["", "", "", "", ""]).slice(0, Math.max(4, (q.choices || []).length));
    return '<div class="grid g2"><div><label>단원</label><select id="q_t">' + D.topics.map(function (t) { return '<option value="' + esc(t.code) + '"' + (t.code === q.topic_code ? " selected" : "") + ">" + esc(t.code + " " + t.title) + "</option>"; }).join("") + "</select></div>" +
      '<div><label>유형</label><select id="q_y">' + Object.keys(MG.QTYPES).map(function (k) { return '<option value="' + k + '"' + (k === q.qtype ? " selected" : "") + ">" + MG.QTYPES[k] + "</option>"; }).join("") + "</select></div></div>" +
      '<label>문제 <span class="muted small" id="q_hint"></span></label><textarea id="q_p" style="min-height:80px;font-family:inherit;font-size:1rem">' + esc(q.prompt || "") + "</textarea>" +
      '<div id="q_chwrap"><label>보기 (객관식)</label><div class="grid g2">' + ch.map(function (c, i) { return '<input class="q_c" placeholder="보기 ' + (i + 1) + '" value="' + esc(c) + '">'; }).join("") + "</div></div>" +
      '<div id="q_pickwrap" style="display:none"><label>틀린 부분을 눌러 정답으로 정해요</label><div class="err-sent card" id="q_pick" style="font-size:1.1rem;padding:10px 14px"></div></div>' +
      '<label>정답 <span class="muted small" id="q_ahint"></span></label><input id="q_a" value="' + esc(q.answer || "") + '">' +
      '<label>해설 (틀렸을 때 학생에게 보여요)</label><input id="q_e" value="' + esc(q.explanation || "") + '">' +
      '<div class="grid g3"><div><label>난이도</label><select id="q_d">' + [1, 2, 3].map(function (d) { return "<option value=\"" + d + '"' + (d === q.difficulty ? " selected" : "") + ">" + ["쉬움 ★", "보통 ★★", "어려움 ★★★"][d - 1] + "</option>"; }).join("") + "</select></div>" +
      '<div><label>출처</label><input id="q_s" value="' + esc(q.source || "") + '" placeholder="예: 교과서 3과, 문제집 p.24"></div>' +
      '<div><label>공개</label><select id="q_act"><option value="1"' + (q.active ? " selected" : "") + '>공개</option><option value="0"' + (q.active ? "" : " selected") + ">숨김</option></select></div></div>" +
      '<div class="err" id="q_err"></div>';
  }
  var HINTS = {
    mc: ["", "보기 중 하나와 똑같이 적어요"],
    ox: ["참·거짓을 판단할 문장이나 질문", "O 또는 X"],
    blank: ["빈칸은 ___ (밑줄 3개)", "정답이 여러 개면 | 로 구분 (예: is not|isn't)"],
    order: ["우리말 뜻을 적어요", "완성된 영어 문장 (띄어쓰기 단위로 단어 카드가 만들어져요)"],
    error: ["틀린 부분이 들어간 문장을 그대로 써요. 학생이 고를 부분만 [대괄호]로 감싸도 되고, 그냥 쓰면 모든 단어를 고를 수 있어요.", "위 문장에서 틀린 부분을 누르면 저절로 들어가요"]
  };
  function bindQForm(root) {
    var upd = function () {
      var y = $("#q_y", root).value;
      $("#q_chwrap", root).style.display = y === "mc" ? "" : "none";
      $("#q_hint", root).textContent = HINTS[y][0]; $("#q_ahint", root).textContent = HINTS[y][1];
      $("#q_pickwrap", root).style.display = y === "error" ? "" : "none";
      if (y === "error") drawPick();
    };
    // 틀린 곳 찾기: 학생 화면처럼 문장을 보여 주고, 선생님도 눌러서 정답을 골라요.
    var drawPick = function () {
      var pr = $("#q_p", root).value.replace(/[［【〔]/g, "[").replace(/[］】〕]/g, "]"), ans = $("#q_a", root).value.trim();
      var bracketed = /\[[^\]]+\]/.test(pr), i = 0;
      var parts = bracketed ? MG.parseError(pr) : pr.split(/([A-Za-z][A-Za-z'’-]*)/).map(function (t, k) { return k % 2 ? { t: t, pick: true } : { t: t }; });
      var box = $("#q_pick", root);
      if (!parts.some(function (x) { return x.pick; })) { box.innerHTML = '<span class="muted small">위에 문장을 쓰면 여기에 나와요.</span>'; return; }
      box.innerHTML = parts.map(function (x) {
        return x.pick ? '<button type="button" class="err-part' + (x.t === ans ? " wrong" : "") + '" data-i="' + (i++) + '">' + esc(x.t) + "</button>" : esc(x.t);
      }).join("");
      $$("#q_pick .err-part", root).forEach(function (b) {
        b.onclick = function () {
          if (!bracketed) $("#q_p", root).value = parts.map(function (x) { return x.pick ? "[" + x.t + "]" : x.t; }).join("");
          $("#q_a", root).value = b.textContent; drawPick();
        };
      });
    };
    $("#q_p", root).addEventListener("input", function () { if ($("#q_y", root).value === "error") drawPick(); });
    $("#q_a", root).addEventListener("input", function () { if ($("#q_y", root).value === "error") drawPick(); });
    $("#q_y", root).onchange = upd; upd();
  }
  function readQForm(root) {
    var y = $("#q_y", root).value;
    var row = { topic_code: $("#q_t", root).value, qtype: y, prompt: $("#q_p", root).value.trim(), answer: $("#q_a", root).value.trim(), explanation: $("#q_e", root).value.trim() || null,
      difficulty: +$("#q_d", root).value, source: $("#q_s", root).value.trim() || null, active: $("#q_act", root).value === "1",
      choices: y === "mc" ? $$(".q_c", root).map(function (i) { return i.value.trim(); }).filter(Boolean) : null };
    var e = validate(row); if (e) throw new Error(e);
    return row;
  }
  // 대괄호 없이 문장만 쓴 경우: 정답(틀린 부분)이 문장에 있으면 모든 단어를 고를 수 있게 [ ]로 감싸요.
  function autoBracket(prompt, ans) {
    if (/[\[\]]/.test(prompt)) return null;
    var a = String(ans).split(/\s*(?:→|->|=>|⇒)\s*/)[0].replace(/^[\("'“‘]+|[\)"'”’]+$/g, "").trim();
    if (!a) return null;
    var low = prompt.toLowerCase(), at = -1, re = new RegExp("(^|[^A-Za-z'])" + a.toLowerCase().replace(/[.*+?^${}()|\\]/g, "\\$&") + "(?=$|[^A-Za-z'])"), m = re.exec(low);
    if (m) at = m.index + m[1].length; else return null;
    var wrap = function (seg) { return seg.replace(/[A-Za-z][A-Za-z'’-]*/g, function (w) { return "[" + w + "]"; }); };
    return wrap(prompt.slice(0, at)) + "[" + prompt.substr(at, a.length) + "]" + wrap(prompt.slice(at + a.length));
  }
  // 틀린 곳 찾기 정답 읽기: "go", "[go]", "3", "③", "go → goes" 모두 받아요.
  function resolveErrorAnswer(ans, parts) {
    var a = String(ans).trim(), fix = null;
    var arrow = a.split(/\s*(?:→|->|=>|⇒)\s*/);
    if (arrow.length > 1) { a = arrow[0]; fix = arrow.slice(1).join(" ").trim() || null; }
    a = a.replace(/^[\[\("'“‘]+|[\]\)"'”’]+$/g, "").trim();
    var circ = "①②③④⑤⑥⑦⑧⑨".indexOf(a.charAt(0));
    var n = circ >= 0 && a.length === 1 ? circ + 1 : (/^\d$/.test(a) ? +a : 0);
    if (n >= 1 && n <= parts.length && !parts.some(function (p) { return p.t === a; })) return { text: parts[n - 1].t, fix: fix };
    var hit = parts.filter(function (p) { return p.t === a; })[0] || parts.filter(function (p) { return MG.norm(p.t) === MG.norm(a); })[0];
    return hit ? { text: hit.t, fix: fix } : null;
  }
  function validate(r) {
    if (!D.topicBy[r.topic_code]) return "단원 코드 '" + r.topic_code + "' 가 없어요. 먼저 단원을 만들어 주세요.";
    if (!MG.QTYPES[r.qtype]) return "유형은 mc, ox, blank, order, error 중 하나여야 해요.";
    if (!r.prompt) return "문제를 적어 주세요.";
    if (!r.answer) return "정답을 적어 주세요.";
    if (r.qtype === "mc") {
      if (!r.choices || r.choices.length < 2) return "객관식은 보기가 2개 이상 필요해요.";
      if (!r.choices.some(function (c) { return MG.norm(c) === MG.norm(r.answer); })) return "정답이 보기 중에 없어요.";
    }
    if (r.qtype === "ox" && !/^[OX]$/i.test(r.answer)) return "O/X 문제의 정답은 O 또는 X 예요.";
    if (r.qtype === "ox") r.answer = r.answer.toUpperCase();
    if (r.qtype === "order" && r.answer.split(/\s+/).length < 2) return "배열 문제의 정답은 두 단어 이상이어야 해요.";
    if (r.qtype === "error") {
      // 문장 속 틀린 부분은 일부러 넣은 거라 그대로 둬요. 괄호 모양과 정답 적는 방식만 너그럽게 맞춰요.
      r.prompt = r.prompt.replace(/[［【〔]/g, "[").replace(/[］】〕]/g, "]");
      var parts = MG.parseError(r.prompt).filter(function (p) { return p.pick; });
      if (parts.length < 2) { var auto = autoBracket(r.prompt, r.answer); if (auto) { r.prompt = auto; parts = MG.parseError(r.prompt).filter(function (p) { return p.pick; }); } }
      if (parts.length < 2) return "틀린 곳 찾기는 학생이 고를 부분을 [대괄호]로 2개 이상 감싸 주세요. 예: She [go] to [school] [every] day.";
      var fixed = resolveErrorAnswer(r.answer, parts);
      if (!fixed) return "정답은 [대괄호] 안의 틀린 부분 하나를 그대로 적어 주세요 (번호도 돼요). 지금 고를 수 있는 부분: " +
        parts.map(function (p, i) { return (i + 1) + ") " + p.t; }).join(" · ");
      if (fixed.fix && !r.explanation) r.explanation = fixed.text + " → " + fixed.fix;
      r.answer = fixed.text;
    }
    if (r.qtype === "blank" && !/_{2,}/.test(r.prompt)) return "빈칸 문제에는 ___ 를 넣어 주세요.";
    if (!(r.difficulty >= 1 && r.difficulty <= 3)) r.difficulty = 2;
    return null;
  }
  function editQuestion(q) {
    if (!q) return MG.toast("삭제된 문제예요.");
    var ov = MG.modal("<h2>✏️ 문제 수정 <span class=\"muted\" style=\"font-size:1rem\">#" + q.id + "</span></h2>" + qForm(q) +
      '<div class="row gap mt between wrap"><button class="btn danger sm" id="q_del">🗑️ 삭제</button><div class="row gap"><button class="btn" id="q_prev">👀 미리보기</button><button class="btn primary" id="q_save">저장</button></div></div>', { wide: true });
    bindQForm(ov);
    $("#q_prev", ov).onclick = function () { try { preview(readQForm(ov)); } catch (e) { $("#q_err", ov).textContent = e.message; } };
    $("#q_save", ov).onclick = async function () {
      try { var row = readQForm(ov); await A.updateQuestion(q.id, row); Object.assign(q, row); MG.toast("저장했어요"); ov.remove(); route(); }
      catch (e) { $("#q_err", ov).textContent = e.message; }
    };
    $("#q_del", ov).onclick = async function () {
      if (!confirm("이 문제를 삭제할까요? 학생들의 풀이 기록도 함께 지워져요.\n기록을 남기려면 '숨김'을 쓰세요.")) return;
      try { await A.deleteQuestion(q.id); await loadBase(); ov.remove(); route(); MG.toast("삭제했어요"); } catch (e) { $("#q_err", ov).textContent = e.message; }
    };
  }
  function preview(r) {
    var body = '<div class="qprompt">' + esc(r.prompt) + "</div>";
    if (r.qtype === "mc") body += '<div class="choices">' + r.choices.map(function (c, i) { return '<div class="choice ' + (MG.norm(c) === MG.norm(r.answer) ? "right" : "") + '"><span class="n">' + (i + 1) + "</span>" + esc(c) + "</div>"; }).join("") + "</div>";
    if (r.qtype === "ox") body += '<div class="ox"><div class="choice ' + (r.answer === "O" ? "right" : "") + '">O</div><div class="choice ' + (r.answer === "X" ? "right" : "") + '">X</div></div>';
    if (r.qtype === "blank") body += '<input class="blank-in" value="' + esc(r.answer.split("|").join(" / ")) + '" disabled>';
    if (r.qtype === "order") body += '<div class="order-pool">' + MG.shuffle(r.answer.split(/\s+/)).map(function (w) { return '<span class="word">' + esc(w) + "</span>"; }).join("") + '</div><p class="small muted mt">정답: ' + esc(r.answer) + "</p>";
    if (r.qtype === "error") body = '<div class="err-sent">' + MG.parseError(r.prompt).map(function (p) { return p.pick ? '<span class="err-part ' + (p.t === r.answer ? "wrong" : "") + '">' + esc(p.t) + "</span>" : esc(p.t); }).join("") + "</div>";
    MG.modal('<h2>👀 학생 화면 미리보기</h2><div class="qcard"><span class="qtype">' + MG.QTYPES[r.qtype] + "</span>" + body + (r.explanation ? '<div class="feedback ok"><div class="exp">💡 ' + esc(r.explanation) + "</div></div>" : "") + "</div>", { wide: true });
  }

  /* ---------- 문제 추가 (하나 · 일괄 · AI) ---------- */
  function addPage() {
    var tmpl = toTSV([{ topic_code: "M1-01-1", qtype: "mc", prompt: "They ___ my classmates.", choices: ["am", "is", "are", "be"], answer: "are", explanation: "They(복수) → are", difficulty: 1, source: "교과서 1과" },
      { topic_code: "M1-01-1", qtype: "blank", prompt: "She ___ my best friend.", answer: "is", explanation: "She → is", difficulty: 1, source: "" },
      { topic_code: "M1-01-1", qtype: "ox", prompt: "\"We is happy.\" 는 올바른 문장이다.", answer: "X", explanation: "We → are", difficulty: 1 },
      { topic_code: "M1-01-1", qtype: "order", prompt: "그들은 교실에 있다.", answer: "They are in the classroom.", explanation: "be동사: ~에 있다", difficulty: 2 },
      { topic_code: "M1-01-1", qtype: "error", prompt: "My parents [is] [very] [kind] [to me].", answer: "is", explanation: "My parents(복수) → are", difficulty: 2 }]);
    page('<div class="card"><h2>➕ 문제 하나 추가</h2>' + qForm() + '<div class="row gap mt" style="justify-content:flex-end"><button class="btn" id="q_prev">👀 미리보기</button><button class="btn primary" id="q_add">추가하기</button></div></div>' +
      '<div class="card"><h2>📋 여러 문제 한꺼번에 등록 <span class="sub">구글 시트 · 엑셀에서 복사해 붙여넣기</span></h2>' +
      '<p class="small">1) <button class="linkbtn" id="tmpl">양식(TSV) 내려받기</button> 를 구글 시트나 엑셀에서 열어요. 2) 한 줄에 한 문제씩 채워요. 3) 표 전체(제목 줄 포함)를 복사해서 아래에 붙여 넣어요.<br>' +
      '열 순서: <span class="kbd">' + COLS.join(" · ") + '</span> · 객관식 보기는 <span class="kbd">|</span> 로 구분 (예: am|is|are|be). 맨 앞에 <span class="kbd">id</span> 열이 있으면 그 번호의 문제를 <b>수정</b>해요 (문제 관리 → 내보내기 파일을 고쳐서 다시 올릴 때).</p>' +
      '<textarea id="bulk" placeholder="여기에 붙여넣기 (또는 아래에서 CSV/TSV 파일 선택)"></textarea>' +
      '<div class="row gap wrap mt"><input type="file" id="bulkfile" accept=".csv,.tsv,.txt" style="width:auto"><button class="btn" id="bulkcheck">🔎 확인하기</button><button class="btn primary" id="bulkgo" disabled>등록하기</button></div><div id="bulkres" class="mt"></div></div>' +
      '<div class="card"><h2>🤖 AI로 문제 만들기 <span class="sub">Gemini · Claude</span></h2>' +
      '<p class="small">아래에서 단원과 개수를 고르고 <b>프롬프트 복사</b> → Gemini 또는 Claude에 붙여넣기 → 나온 표를 위의 일괄 등록 칸에 붙여넣고 <b>확인하기</b>를 누르세요. 문제집·참고서 사진이나 PDF를 함께 올리면 그 내용을 바탕으로 만들어 줘요. <b>등록 전에 꼭 정답을 검토해 주세요.</b></p>' +
      '<div class="grid g3"><div><label>단원</label><select id="ai_t">' + D.topics.map(function (t) { return '<option value="' + esc(t.code) + '">' + esc(t.code + " " + t.title) + "</option>"; }).join("") + "</select></div>" +
      '<div><label>문제 수</label><input id="ai_n" type="number" value="15" min="5" max="50"></div><div><label>난이도</label><select id="ai_d"><option value="섞어서">섞어서</option><option value="쉬움(1)">쉬움</option><option value="보통(2)">보통</option><option value="어려움(3)">어려움</option></select></div></div>' +
      '<label>추가 요청 (선택)</label><input id="ai_x" placeholder="예: 교과서 3과 본문 표현을 활용해 줘 / 서술형 대비 배열 문제를 많이">' +
      '<div class="row gap wrap mt"><button class="btn primary" id="ai_copy">📋 프롬프트 복사</button><a class="btn" href="https://gemini.google.com/app" target="_blank" rel="noopener">Gemini 열기</a><a class="btn" href="https://claude.ai/new" target="_blank" rel="noopener">Claude 열기</a></div>' +
      '<textarea id="ai_p" class="mt" readonly style="min-height:120px"></textarea></div>');
    bindQForm($("#page"));
    $("#q_prev").onclick = function () { try { preview(readQForm($("#page"))); } catch (e) { $("#q_err").textContent = e.message; } };
    $("#q_add").onclick = async function () {
      try { var row = readQForm($("#page")); row.created_by = D.me.email; await A.insertQuestions([row]); await loadBase(); MG.toast("추가했어요 ✅"); $("#q_p").value = ""; $("#q_a").value = ""; $("#q_e").value = ""; $$(".q_c").forEach(function (i) { i.value = ""; }); $("#q_err").textContent = ""; }
      catch (e) { $("#q_err").textContent = e.message; }
    };
    $("#tmpl").onclick = function () { MG.download("MY_Grammar_문제양식.tsv", tmpl, "text/tab-separated-values;charset=utf-8"); };
    $("#bulkfile").onchange = function () {
      var f = this.files[0]; if (!f) return;
      var rd = new FileReader(); rd.onload = function () { $("#bulk").value = String(rd.result).replace(/^﻿/, ""); $("#bulkcheck").click(); }; rd.readAsText(f, "utf-8");
    };
    var parsed = [];
    $("#bulkcheck").onclick = function () {
      parsed = parseBulk($("#bulk").value);
      var ok = parsed.filter(function (r) { return !r.err; }), bad = parsed.filter(function (r) { return r.err; }), dup = ok.filter(function (r) { return r.dup; });
      $("#bulkres").innerHTML = '<p><b>' + parsed.length + "줄</b> 중 등록 가능 <span class=\"tag ok\">" + ok.length + "</span> · 오류 <span class=\"tag bad\">" + bad.length + "</span>" + (dup.length ? " · 이미 있는 문제와 같음 <span class=\"tag\">" + dup.length + "</span> (건너뜀)" : "") + "</p>" +
        table("bk", [{ k: "line", label: "줄", num: true }, { k: "st", label: "상태", f: function (r) { return r.err ? '<span class="tag bad">' + esc(r.err) + "</span>" : r.dup ? '<span class="tag">중복</span>' : r.row.id ? '<span class="tag brand">수정</span>' : '<span class="tag ok">새 문제</span>'; } },
          { k: "t", label: "단원", v: function (r) { return r.row.topic_code; } }, { k: "y", label: "유형", v: function (r) { return r.row.qtype; } },
          { k: "p", label: "문제", wrap: true, v: function (r) { return r.row.prompt; } }, { k: "a", label: "정답", v: function (r) { return r.row.answer; } }], parsed, { h: "50vh" });
      $("#bulkgo").disabled = !ok.filter(function (r) { return !r.dup; }).length;
    };
    $("#bulkgo").onclick = async function () {
      var go = parsed.filter(function (r) { return !r.err && !r.dup; }).map(function (r) { return r.row; });
      var ins = go.filter(function (r) { return !r.id; }).map(function (r) { r.created_by = D.me.email; return r; }), ups = go.filter(function (r) { return r.id; });
      this.disabled = true;
      try {
        for (var i = 0; i < ins.length; i += 200) await A.insertQuestions(ins.slice(i, i + 200));
        for (var j = 0; j < ups.length; j += 200) await A.upsertQuestions(ups.slice(j, j + 200));
        await loadBase();
        $("#bulkres").innerHTML = '<p class="tag ok" style="font-size:1rem">✅ 새 문제 ' + ins.length + "개 등록, " + ups.length + "개 수정했어요. 학생 화면에 바로 나와요.</p>";
        $("#bulk").value = "";
      } catch (e) { $("#bulkres").insertAdjacentHTML("afterbegin", '<p class="err">' + esc(e.message) + "</p>"); this.disabled = false; }
    };
    var mk = function () { $("#ai_p").value = aiPrompt($("#ai_t").value, +$("#ai_n").value || 15, $("#ai_d").value, $("#ai_x").value); };
    ["ai_t", "ai_n", "ai_d", "ai_x"].forEach(function (id) { $("#" + id).oninput = mk; $("#" + id).onchange = mk; });
    mk();
    $("#ai_copy").onclick = function () {
      var t = $("#ai_p"); t.select();
      (navigator.clipboard ? navigator.clipboard.writeText(t.value) : Promise.reject()).then(function () { MG.toast("복사했어요! AI 채팅창에 붙여넣으세요."); }, function () { document.execCommand("copy"); MG.toast("복사했어요!"); });
    };
  }
  function aiPrompt(code, n, diff, extra) {
    var t = D.topicBy[code] || {};
    return "너는 한국 중학교 영어 교사를 돕는 문법 문제 출제 전문가야.\n" +
      "단원: " + code + " " + (t.unit_title ? "[대단원 " + (t.unit_no || "") + " " + t.unit_title + "] " : "") + (t.title || "") + " (" + (MG.GRADES[t.grade] || "") + ")\n" +
      "단원 핵심: " + String(t.summary || "").replace(/\*\*/g, "").replace(/\n/g, " / ") + "\n\n" +
      "이 단원으로 문제 " + n + "개를 만들어 줘. 난이도: " + diff + ".\n" +
      "유형을 골고루 섞어 줘: mc(4지선다), ox(참/거짓), blank(빈칸, 문제에 ___ 표시), order(우리말 뜻을 주고 영어 문장 배열), error(틀린 곳 찾기: 고를 부분 4개를 [대괄호]로 감싸고 그중 하나만 틀리게).\n" +
      (t.grade === 4 ? "고등학교 모의고사·수능 어법 문제 스타일로, 고1 수준 어휘를 쓰고" : "한국 중학생 수준의 쉬운 어휘") + "와 자연스러운 상황을 쓰고, 해설은 한국어로 짧게(왜 그 답인지).\n" +
      (extra ? "추가 요청: " + extra + "\n" : "") +
      "\n출력 형식(아주 중요): 아래 8개 열의 탭(Tab)으로 구분된 표만 코드 블록 하나에 출력해. 첫 줄은 제목 줄 그대로.\n" +
      COLS.join("\t") + "\n" +
      "- topic_code: 항상 " + code + "\n- qtype: mc / ox / blank / order / error 중 하나\n- choices: mc 일 때만 보기 4개를 | 로 구분 (예: am|is|are|be), 나머지는 비워 둠\n" +
      "- answer: mc는 보기와 똑같은 글자, ox는 O 또는 X, blank는 정답 단어(여러 개 허용 시 | 로 구분), order는 완성 문장, error는 대괄호 안의 틀린 부분 그대로\n" +
      "- difficulty: 1(쉬움) 2(보통) 3(어려움)\n- source: AI 생성\n" +
      "칸 안에서는 줄바꿈과 탭을 쓰지 마. 정답이 하나뿐인지 두 번 검토해 줘.";
  }
  // 따옴표를 지원하는 TSV/CSV 해석
  function parseDelimited(text) {
    var first = text.split("\n")[0], d = first.indexOf("\t") >= 0 ? "\t" : ",";
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"' && cell === "") q = true;
      else if (ch === d) { row.push(cell); cell = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += ch;
    }
    if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (c) { return c.trim(); }); });
  }
  var TYPE_ALIAS = { "객관식": "mc", "선택": "mc", "ox": "ox", "o/x": "ox", "빈칸": "blank", "빈칸채우기": "blank", "배열": "order", "단어배열": "order", "틀린곳": "error", "오류": "error", "틀린곳찾기": "error" };
  function parseBulk(text) {
    var rows = parseDelimited(String(text || "").replace(/^```\w*\n?|```\s*$/gm, ""));
    if (!rows.length) return [];
    var head = rows[0].map(function (h) { return h.trim().toLowerCase(); }), idx = {}, start = 0;
    if (head.indexOf("prompt") >= 0 || head.indexOf("topic_code") >= 0) { head.forEach(function (h, i) { idx[h] = i; }); start = 1; }
    else COLS.forEach(function (c, i) { idx[c] = i; });
    var exist = {};
    D.questions.forEach(function (q) { exist[q.topic_code + "|" + MG.norm(q.prompt)] = q.id; });
    var seen = {};
    return rows.slice(start).map(function (r, k) {
      var g = function (c) { return idx[c] == null ? "" : String(r[idx[c]] || "").trim(); };
      var y = g("qtype").toLowerCase().replace(/\s/g, "");
      var row = { topic_code: g("topic_code").toUpperCase(), qtype: TYPE_ALIAS[y] || y, prompt: g("prompt"), answer: g("answer"), explanation: g("explanation") || null,
        difficulty: parseInt(g("difficulty"), 10) || 2, source: g("source") || null, choices: g("choices") ? g("choices").split("|").map(function (s) { return s.trim(); }).filter(Boolean) : null };
      if (row.qtype !== "mc") row.choices = null;
      var id = parseInt(g("id"), 10); if (id) row.id = id;
      if (idx.active != null) row.active = !/^(false|0|n|no|숨김|x)$/i.test(g("active"));
      var e = validate(row), key = row.topic_code + "|" + MG.norm(row.prompt);
      var dup = !row.id && (exist[key] || seen[key]);
      seen[key] = 1;
      return { line: k + start + 1, row: row, err: e, dup: !!dup };
    });
  }

  /* ---------- 단원 관리 ---------- */
  function topics() {
    var cnt = {}; D.questions.forEach(function (q) { cnt[q.topic_code] = (cnt[q.topic_code] || 0) + (q.active ? 1 : 0); });
    var stc = {}; D.stamps.forEach(function (s) { stc[s.topic_code] = (stc[s.topic_code] || 0) + 1; });
    page('<div class="card"><div class="row between wrap gap"><h2>📖 단원 관리</h2><button class="btn primary sm" id="tnew">➕ 새 단원</button></div>' +
      table("tp", [
        { k: "sort_order", label: "순서", num: true }, { k: "code", label: "코드", f: function (t) { return "<b>" + esc(t.code) + "</b>"; } },
        { k: "grade", label: "학년", f: function (t) { return esc(MG.GRADES[t.grade] || "-"); } },
        { k: "unit_no", label: "대단원", f: function (t) { return t.unit_no != null ? t.unit_no + ". " + esc(t.unit_title || "") : esc(t.category || ""); } },
        { k: "title", label: "제목", wrap: true }, { k: "n", label: "공개 문제", num: true, v: function (t) { return cnt[t.code] || 0; } },
        { k: "s", label: "스탬프 받은 학생", num: true, v: function (t) { return stc[t.code] || 0; } },
        { k: "active", label: "공개", f: function (t) { return t.active ? '<span class="tag ok">공개</span>' : '<span class="tag">숨김</span>'; } }
      ], D.topics, { click: true, key: "code" }) + '<p class="small muted">단원을 누르면 설명·예문·꿀팁을 고칠 수 있어요. 학생은 \'공개\' 단원만 볼 수 있어요. 코드 규칙: M1-01-2 = 중1 대단원 1 소단원 2, H-04-2 = 고등·수능 대단원 4 소단원 2</p></div>');
    bindTable("tp", topics, function (code) { editTopic(D.topicBy[code]); });
    $("#tnew").onclick = function () { editTopic(null); };
  }
  function editTopic(t) {
    var isNew = !t; t = t || { grade: 1, active: true, sort_order: 0 };
    var ov = MG.modal("<h2>" + (isNew ? "➕ 새 단원" : "✏️ 단원 수정") + "</h2>" +
      '<div class="grid g3"><div><label>코드 (예: M1-03-4)</label><input id="t_code" value="' + esc(t.code || "") + '"' + (isNew ? "" : " disabled") + '></div><div><label>학년</label><select id="t_g">' +
      Object.keys(MG.GRADES).map(function (g) { return '<option value="' + g + '"' + (+g === t.grade ? " selected" : "") + ">" + MG.GRADES[g] + "</option>"; }).join("") + "</select></div>" +
      '<div><label>대단원 번호 · 소단원 번호</label><div class="row gap"><input id="t_un" type="number" value="' + (t.unit_no != null ? t.unit_no : "") + '"><input id="t_sn" type="number" value="' + (t.sub_no != null ? t.sub_no : "") + '"></div></div></div>' +
      '<label>대단원 제목</label><input id="t_cat" value="' + esc(t.unit_title || t.category || "") + '" placeholder="예: be동사, 수동태">' +
      '<div class="grid g2"><div><label>제목</label><input id="t_title" value="' + esc(t.title || "") + '"></div><div><label>영어 제목</label><input id="t_en" value="' + esc(t.title_en || "") + '"></div></div>' +
      '<label>개념 설명 <span class="small muted">줄바꿈 가능, **굵게**</span></label><textarea id="t_sum" style="font-family:inherit;font-size:.95rem">' + esc(t.summary || "") + "</textarea>" +
      '<label>예문 <span class="small muted">한 줄에 하나, "영어 | 해석"</span></label><textarea id="t_ex" style="font-family:inherit;font-size:.95rem">' + esc(t.examples || "") + "</textarea>" +
      '<label>시험 꿀팁</label><input id="t_tip" value="' + esc(t.tip || "") + '">' +
      '<div class="grid g2"><div><label>순서</label><input id="t_so" type="number" value="' + (t.sort_order || 0) + '"></div><div><label>공개</label><select id="t_act"><option value="1"' + (t.active ? " selected" : "") + '>공개</option><option value="0"' + (t.active ? "" : " selected") + ">숨김</option></select></div></div>" +
      '<div class="err" id="t_err"></div><div class="row gap mt between">' + (isNew ? "<span></span>" : '<button class="btn danger sm" id="t_del">삭제</button>') + '<button class="btn primary" id="t_save">저장</button></div>', { wide: true });
    $("#t_save", ov).onclick = async function () {
      var un = $("#t_un", ov).value, sn = $("#t_sn", ov).value, ut = $("#t_cat", ov).value.trim() || null;
      var row = { code: ($("#t_code", ov).value || "").trim().toUpperCase(), grade: +$("#t_g", ov).value, unit_no: un === "" ? null : +un, sub_no: sn === "" ? null : +sn, unit_title: ut, category: ut, title: $("#t_title", ov).value.trim(),
        title_en: $("#t_en", ov).value.trim() || null, summary: $("#t_sum", ov).value, examples: $("#t_ex", ov).value, tip: $("#t_tip", ov).value.trim() || null, sort_order: +$("#t_so", ov).value || ((un === "" ? 0 : +un) * 10 + (sn === "" ? 0 : +sn)), active: $("#t_act", ov).value === "1" };
      if (!row.code || !row.title) { $("#t_err", ov).textContent = "코드와 제목은 꼭 필요해요."; return; }
      if (isNew && D.topicBy[row.code]) { $("#t_err", ov).textContent = "이미 있는 코드예요."; return; }
      try { if (isNew) await A.upsertTopics([row]); else { delete row.code; await A.updateTopic(t.code, row); } await loadBase(); ov.remove(); route(); MG.toast("저장했어요"); }
      catch (e) { $("#t_err", ov).textContent = e.message; }
    };
    var del = $("#t_del", ov);
    if (del) del.onclick = async function () {
      if (D.questions.some(function (q) { return q.topic_code === t.code; })) { $("#t_err", ov).textContent = "이 단원에 문제가 있어서 삭제할 수 없어요. '숨김'으로 바꿔 주세요."; return; }
      if (!confirm("단원을 삭제할까요?")) return;
      try { await A.deleteTopic(t.code); await loadBase(); ov.remove(); route(); } catch (e) { $("#t_err", ov).textContent = e.message; }
    };
  }

  /* ---------- 인증서 ---------- */
  function certs() {
    var rows = D.certs.map(function (c) { var p = D.pBy[c.user_id] || {}; return Object.assign({}, c, { p: p, sid: sid(p), name: p.real_name, nick: p.nickname, sortSid: (p.grade || 9) * 10000 + (p.class_no || 99) * 100 + (p.student_no || 99) }); })
      .sort(function (a, b) { return new Date(b.issued_at) - new Date(a.issued_at); });
    page('<div class="card"><div class="row between wrap gap"><h2>🎓 발급된 인증서 <span class="sub">' + rows.length + '장</span></h2><button class="btn primary sm" id="cprint">🖨️ 선택한 인증서 인쇄</button></div>' +
      '<p class="small muted">학생이 조건을 채우면 자동으로 발급되고, 학생의 \'나\' 화면에서 이미지로 저장·인쇄할 수 있어요. 발급 조건: Lv.5 / Lv.10 / Lv.15, 스탬프 5개 / 10개 / 전 단원, 30일 연속 학습.</p>' +
      '<label class="row gap" style="font-weight:600"><input type="checkbox" id="call" style="width:auto"> 모두 선택</label>' +
      table("ce", [
        { k: "sel", label: "선택", f: function (c) { return '<input type="checkbox" class="csel" value="' + c.id + '" style="width:auto">'; } },
        { k: "issued_at", label: "발급일", f: function (c) { return MG.kstDate(c.issued_at); } },
        { k: "sortSid", label: "학년-반-번호", f: function (c) { return c.sid; } },
        { k: "name", label: "실명" }, { k: "nick", label: "닉네임" }, { k: "title", label: "인증서" }, { k: "serial", label: "번호" },
        { k: "v", label: "", f: function (c) { return '<button class="btn sm" data-cv="' + c.id + '">보기</button>'; } }
      ], rows) + "</div>");
    bindTable("ce", certs);
    $$("[data-cv]").forEach(function (b) { b.onclick = function () { var c = rows.filter(function (x) { return String(x.id) === b.getAttribute("data-cv"); })[0]; MG.showCert(c, whoOf(c.p)); }; });
    $("#call").onchange = function () { var v = this.checked; $$(".csel").forEach(function (x) { x.checked = v; }); };
    $("#cprint").onclick = function () {
      var ids = $$(".csel").filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
      if (!ids.length) return MG.toast("인쇄할 인증서를 선택해 주세요.");
      MG.printCerts(rows.filter(function (c) { return ids.indexOf(String(c.id)) >= 0; }).map(function (c) { return { cert: c, who: whoOf(c.p) }; }));
    };
  }

  /* ---------- 설정 ---------- */
  async function settings() {
    var r = await Promise.all([A.settings(), A.admins()]), s = r[0], ad = r[1];
    adminEmails = ad.map(function (a) { return a.email; });
    page('<div class="card"><h2>🔐 로그인 허용 범위</h2><label class="row gap" style="font-weight:600"><input type="checkbox" id="s_ext" style="width:auto"' + (s.allow_external === "true" ? " checked" : "") + "> 학교 밖 구글 계정도 이용 허용 (외부 이용자 옵션)</label>" +
      '<p class="small muted">끄면 @' + esc(s.school_domain || C.SCHOOL_DOMAIN) + " 계정과 관리자만 들어올 수 있어요. 켜도 외부 이용자는 순위표·반 대항전에는 나오지 않아요.</p></div>" +
      '<div class="card"><h2>🎯 학습 설정</h2><div class="grid g2"><div><label>하루 목표 문제 수</label><input id="s_goal" type="number" min="5" max="200" value="' + esc(s.daily_goal || "20") + '"></div>' +
      '<div><label>학교 도메인</label><input id="s_dom" value="' + esc(s.school_domain || C.SCHOOL_DOMAIN) + '"></div></div>' +
      '<label>학생 홈 화면 공지</label><input id="s_notice" value="' + esc(s.notice || "") + '" placeholder="예: 이번 주는 현재완료 집중 주간! 스탬프 받은 친구는 수행평가 가산점 🎁">' +
      '<button class="btn primary mt" id="s_save">저장</button></div>' +
      '<div class="card"><h2>👩‍🏫 관리자</h2>' + ad.map(function (a) { return '<div class="row gap between" style="padding:6px 0;border-bottom:1px dashed var(--line)"><span>' + esc(a.email) + '</span><button class="btn sm danger" data-rm="' + esc(a.email) + '">삭제</button></div>'; }).join("") +
      '<div class="row gap mt"><input id="s_newad" placeholder="추가할 관리자 이메일"><button class="btn" id="s_addad">추가</button></div><p class="small muted">관리자는 이 교사 화면에 들어올 수 있고, 학생 실명을 볼 수 있어요.</p></div>' +
      '<div class="card"><h2>🔗 바로가기</h2><div class="row gap wrap"><a class="btn sm" href="./" target="_blank">학생 화면</a><a class="btn sm" href="guide.html" target="_blank">학생 사용 설명서</a>' +
      '<a class="btn sm" href="' + esc(C.SUPABASE_DASHBOARD) + '" target="_blank" rel="noopener">Supabase 대시보드</a><a class="btn sm" href="https://github.com/tfellow/web/tree/main/grammar" target="_blank" rel="noopener">설정 가이드 (README)</a></div>' +
      (MG.DEMO ? '<button class="btn danger sm mt" id="s_reset">체험 데이터 초기화</button>' : "") + "</div>");
    $("#s_ext").onchange = async function () { try { await A.setSetting("allow_external", this.checked ? "true" : "false"); MG.toast(this.checked ? "외부 계정 허용" : "학교 계정만 허용"); } catch (e) { MG.toast(e.message, "bad"); } };
    $("#s_save").onclick = async function () {
      try { await A.setSetting("daily_goal", String(+$("#s_goal").value || 20)); await A.setSetting("school_domain", $("#s_dom").value.trim()); await A.setSetting("notice", $("#s_notice").value.trim()); MG.toast("저장했어요"); }
      catch (e) { MG.toast(e.message, "bad"); }
    };
    $("#s_addad").onclick = async function () {
      var e = $("#s_newad").value.trim(); if (!/@/.test(e)) return MG.toast("이메일을 확인해 주세요.");
      try { await A.addAdmin(e); route(); } catch (x) { MG.toast(x.message, "bad"); }
    };
    $$("[data-rm]").forEach(function (b) {
      b.onclick = async function () {
        var e = b.getAttribute("data-rm");
        if (e === D.me.email) return MG.toast("지금 로그인한 계정은 지울 수 없어요.");
        if (!confirm(e + " 를 관리자에서 뺄까요?")) return;
        try { await A.removeAdmin(e); route(); } catch (x) { MG.toast(x.message, "bad"); }
      };
    });
    var rs = $("#s_reset"); if (rs) rs.onclick = function () { if (confirm("체험 데이터를 처음 상태로 되돌릴까요?")) { api.reset(); location.reload(); } };
  }

  // 관리자 목록을 미리 불러와 통계에서 교사 계정을 빼요
  A.admins().then(function (ad) { adminEmails = ad.map(function (a) { return a.email; }); }).catch(function () {});
})();
