(function () {
  "use strict";

  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SCHOOL_LABEL = "서울문영여자중학교";
  var MEDALS = {
    gold: { em: "🥇", name: "금메달" },
    silver: { em: "🥈", name: "은메달" },
    bronze: { em: "🥉", name: "동메달" }
  };

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, bookTab: "story", showKo: true };
  var timer = null;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function findBook(id) { return (window.BOOKS || []).filter(function (b) { return b.id === id; })[0]; }
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
  function clearTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function loading() { $app.innerHTML = '<p class="muted center">불러오는 중...</p>'; }
  function showError(e) {
    $app.innerHTML = '<div class="card"><h2>문제가 생겼어요</h2><p class="err">' + esc(e && e.message ? e.message : e) + '</p><button class="btn" id="back">처음으로</button></div>';
    document.getElementById("back").onclick = function () { location.hash = "#/"; route(); };
  }
  function confetti(count) {
    var colors = ["#e0a800", "#5a4fcf", "#e0577a", "#2fa36b", "#3b82f6"];
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

  /* ---------- 로그인 ---------- */
  function waitGoogle(fn) {
    if (window.google && google.accounts && google.accounts.id) fn();
    else setTimeout(function () { waitGoogle(fn); }, 200);
  }
  function renderLogin(msg) {
    clearTimer();
    $who.classList.add("hidden");
    $app.innerHTML =
      '<div class="card login"><div class="big">📖</div><h2>문영 독서 여권</h2>' +
      '<p class="muted">세계문학을 읽고, 퀴즈를 풀고, 메달을 모아 보세요.</p>' +
      '<div id="gbtn"></div>' +
      '<p class="muted">학교 계정(@smy.ms.kr)으로 로그인하세요.</p>' +
      '<div class="err">' + esc(msg || "") + "</div></div>";
    waitGoogle(function () {
      google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogle });
      google.accounts.id.renderButton(document.getElementById("gbtn"), { theme: "outline", size: "large", text: "signin_with", locale: "ko" });
    });
  }
  async function onGoogle(resp) {
    var r = await sb.auth.signInWithIdToken({ provider: "google", token: resp.credential });
    if (r.error) renderLogin("로그인에 실패했어요: " + r.error.message);
  }
  async function signOut() {
    await sb.auth.signOut();
    if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect();
    state.user = null; state.profile = null; state.isAdmin = false;
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
    var html =
      '<span class="badge ' + (isSchool ? "school" : "external") + '">' + (isSchool ? SCHOOL_LABEL : "외부 이용자") + "</span>" +
      (state.isAdmin ? '<span class="badge school">교사</span>' : "") +
      "<b>" + esc(p.nickname || "") + "</b>" +
      '<button class="btn ghost small" id="reroll">🎲 닉네임 바꾸기</button>' +
      (state.isAdmin ? '<button class="btn ghost small" id="goteacher">교사 화면</button>' : "") +
      '<button class="btn ghost small" id="signout">로그아웃</button>';
    $who.innerHTML = html;
    $who.classList.remove("hidden");
    document.getElementById("reroll").onclick = async function () {
      var r = await sb.rpc("reroll_nickname");
      if (r.error) return toast("닉네임을 바꾸지 못했어요");
      state.profile.nickname = r.data; renderWho(); toast("새 닉네임: " + r.data);
      if ((location.hash || "#/") === "#/") route();
    };
    document.getElementById("signout").onclick = signOut;
    var gt = document.getElementById("goteacher");
    if (gt) gt.onclick = function () { location.hash = "#/teacher"; };
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
  function medalBox(key, n) {
    return '<div class="medal"><span class="em">' + MEDALS[key].em + '</span><span class="n">' + n + "</span><div class=\"muted\">" + MEDALS[key].name + "</div></div>";
  }
  async function renderHome() {
    loading();
    var res = await Promise.all([sb.rpc("my_summary"), sb.rpc("leaderboard")]);
    if (res[0].error) throw res[0].error;
    var sum = res[0].data || { books: [], gold: 0, silver: 0, bronze: 0, words: 0 };
    var board = res[1].data || [];
    var byId = {};
    (sum.books || []).forEach(function (b) { byId[b.book_id] = b; });
    var books = window.BOOKS || [];
    var done = books.filter(function (b) { return byId[b.id] && byId[b.id].medal; }).length;
    var pct = books.length ? Math.round((done / books.length) * 100) : 0;

    var shelf = books.map(function (b) {
      var r = byId[b.id];
      var medal = r && r.medal;
      return '<div class="book ' + (medal ? "" : "todo") + '" style="background:' + b.color + '" data-id="' + esc(b.id) + '">' +
        (medal ? '<div class="stamp-corner">' + MEDALS[medal].em + "</div>" : "") +
        '<div class="cover">' + b.emoji + "</div>" +
        '<div><div class="t">' + esc(b.title) + '</div><div class="a">' + esc(b.titleKo) + " · " + esc(b.authorKo) + "</div></div>" +
        '<div><span class="lv">' + esc(b.cefr) + " · " + b.words + "단어</span>" +
        '<div class="a" style="margin-top:4px">' + (r ? "최고 " + r.best + "/" + r.total + " · " + r.attempts + "회 도전" : "아직 도전 전") + "</div></div></div>";
    }).join("");

    var boardHtml = board.length
      ? "<ol>" + board.map(function (r, i) {
          var rk = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
          return '<li><span class="rk">' + rk + '</span><span class="nm">' + esc(r.nickname) + '</span><span class="ms">🥇' + r.gold + " 🥈" + r.silver + " 🥉" + r.bronze + "</span></li>";
        }).join("") + "</ol>"
      : '<p class="muted">아직 순위가 없어요. 첫 메달의 주인공이 되어 보세요!</p>';

    var show = state.profile && state.profile.show_on_board;
    var isSchool = state.profile && state.profile.role === "school";
    $app.innerHTML =
      '<div class="card"><h2>🛂 내 독서 여권</h2>' +
      "<div><b>" + done + " / " + books.length + "</b> 작품 완료 <span class=\"muted\">(60점 이상이면 완료)</span></div>" +
      '<div class="progress"><div style="width:0%" id="bar"></div></div>' +
      '<div class="muted">읽은 단어 수: <b>' + (sum.words || 0).toLocaleString() + "</b> 단어</div><br>" +
      '<div class="medals">' + medalBox("gold", sum.gold || 0) + medalBox("silver", sum.silver || 0) + medalBox("bronze", sum.bronze || 0) + "</div></div>" +
      '<div class="card"><h2>📚 책장</h2><div class="shelf">' + shelf + "</div></div>" +
      '<div class="card board"><h2>🏆 메달 순위 TOP 10</h2>' + boardHtml +
      '<p class="muted" style="margin-top:10px">순위에는 자동으로 만들어진 닉네임만 보여요. 금 → 은 → 동 순으로 정렬돼요.' + (isSchool ? "" : " (외부 이용자는 순위에 나오지 않아요.)") + "</p>" +
      (isSchool ? '<label class="muted"><input type="checkbox" id="showboard" ' + (show ? "checked" : "") + "> 내 닉네임을 순위표에 보이기</label>" : "") + "</div>";

    setTimeout(function () { var bar = document.getElementById("bar"); if (bar) bar.style.width = pct + "%"; }, 80);
    Array.prototype.forEach.call(document.querySelectorAll(".book"), function (el) {
      el.onclick = function () { state.bookTab = "story"; location.hash = "#/book/" + encodeURIComponent(el.getAttribute("data-id")); };
    });
    var cb = document.getElementById("showboard");
    if (cb) cb.onchange = async function () {
      var r = await sb.rpc("set_show_on_board", { p_show: cb.checked });
      if (r.error) return toast("설정을 바꾸지 못했어요");
      state.profile.show_on_board = cb.checked; toast(cb.checked ? "순위표에 보여요" : "순위표에서 숨겼어요");
      renderHome();
    };
  }

  /* ---------- 책 읽기 ---------- */
  async function renderBook(id) {
    var b = findBook(id);
    if (!b) return showError("책을 찾을 수 없어요.");
    var tabs = [["story", "📖 이야기"], ["analysis", "🔎 분석"], ["chars", "🎭 인물"], ["vocab", "🔤 단어장"]];
    var body = "";
    if (state.bookTab === "story") {
      body = '<label class="muted"><input type="checkbox" id="ko" ' + (state.showKo ? "checked" : "") + "> 한글 번역 보기</label><br><br>" +
        b.story.map(function (p) {
          return '<div class="para"><div>' + esc(p.en) + "</div>" + (state.showKo ? '<div class="ko">' + esc(p.ko) + "</div>" : "") + "</div>";
        }).join("");
    } else if (state.bookTab === "analysis") {
      body = b.analysis.map(function (a) {
        return '<div class="kv"><b>' + esc(a.label) + "</b>" + esc(a.en) + '<div class="muted">' + esc(a.ko) + "</div></div>";
      }).join("");
    } else if (state.bookTab === "chars") {
      body = b.characters.map(function (c) {
        return '<div class="kv"><b>' + esc(c.name) + "</b>" + esc(c.en) + '<div class="muted">' + esc(c.ko) + "</div></div>";
      }).join("");
    } else {
      body = b.vocab.map(function (g) {
        return "<h3>" + esc(g.level) + '</h3><div class="scroll"><table><tr><th>단어</th><th>뜻</th><th>영영 풀이</th></tr>' +
          g.items.map(function (w) { return "<tr><td><b>" + esc(w[0]) + '</b> <span class="muted">' + esc(w[1]) + "</span></td><td>" + esc(w[2]) + "</td><td>" + esc(w[3]) + "</td></tr>"; }).join("") +
          "</table></div>";
      }).join("");
    }
    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button>' +
      "<h2 style=\"margin-top:12px\">" + b.emoji + " " + esc(b.title) + "</h2>" +
      '<div class="muted">' + esc(b.titleKo) + " · " + esc(b.author) + " (" + esc(b.authorKo) + ")</div>" +
      '<div style="margin:8px 0"><span class="badge school">CEFR ' + esc(b.cefr) + '</span> <span class="badge external">Lexile ' + esc(b.lexile) + '</span> <span class="badge school">AR ' + esc(b.ar) + '</span> <span class="badge external">' + b.words + "단어</span></div></div>" +
      '<div class="card"><div class="tabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.bookTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>" + body +
      '<div class="center" style="margin-top:18px"><button class="btn" id="goquiz">다 읽었어요 · 퀴즈 풀기 ✏️</button></div></div>';
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("goquiz").onclick = function () { location.hash = "#/quiz/" + encodeURIComponent(b.id); };
    Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function (el) {
      el.onclick = function () { state.bookTab = el.getAttribute("data-t"); renderBook(id); };
    });
    var ko = document.getElementById("ko");
    if (ko) ko.onchange = function () { state.showKo = ko.checked; renderBook(id); };
  }

  /* ---------- 퀴즈 ---------- */
  async function renderQuiz(id) {
    var b = findBook(id);
    if (!b) return showError("책을 찾을 수 없어요.");
    loading();
    var st = await sb.rpc("quiz_status", { p_book_id: id });
    if (st.error) throw st.error;
    var info = st.data || {};
    var wait = info.next_allowed_at ? new Date(info.next_allowed_at).getTime() - Date.now() : 0;
    if (wait > 0) return renderWait(b, info);

    var qz = await sb.rpc("get_quiz", { p_book_id: id });
    if (qz.error) throw qz.error;
    var qs = qz.data || [];
    if (!qs.length) return showError("이 책의 퀴즈가 아직 없어요.");

    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="toread">← 읽기로</button>' +
      "<h2 style=\"margin-top:12px\">✏️ " + esc(b.title) + " 퀴즈</h2>" +
      '<p class="muted">총 ' + qs.length + "문항 · 문제와 보기 순서는 매번 달라져요. 한 번 제출하면 10분 뒤에 다시 도전할 수 있어요." +
      (info.best != null ? " (내 최고 점수: " + info.best + "/" + info.total + ")" : "") + "</p>" +
      qs.map(function (q, i) {
        return '<div class="q"><div class="qt">' + (i + 1) + ". " + esc(q.question) + "</div>" +
          q.choices.map(function (c, j) {
            return '<label class="opt"><input type="radio" name="q' + q.no + '" value="' + esc(c) + '">' + esc(c) + "</label>";
          }).join("") + "</div>";
      }).join("") +
      '<div class="center"><button class="btn" id="submit">제출하기</button><div class="err" id="qerr"></div></div></div>';

    document.getElementById("toread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(id); };
    Array.prototype.forEach.call(document.querySelectorAll(".opt input"), function (inp) {
      inp.onchange = function () {
        Array.prototype.forEach.call(document.querySelectorAll('input[name="' + inp.name + '"]'), function (o) { o.parentNode.classList.toggle("sel", o.checked); });
      };
    });
    document.getElementById("submit").onclick = async function () {
      var answers = {}, missing = 0;
      qs.forEach(function (q) {
        var el = document.querySelector('input[name="q' + q.no + '"]:checked');
        if (el) answers[q.no] = el.value; else missing++;
      });
      var err = document.getElementById("qerr");
      if (missing) { err.textContent = "아직 답하지 않은 문항이 " + missing + "개 있어요."; return; }
      this.disabled = true; err.textContent = "";
      var r = await sb.rpc("submit_quiz", { p_book_id: id, p_answers: answers });
      if (r.error) {
        this.disabled = false;
        if (/cooldown/.test(r.error.message)) { toast("아직 대기 시간이에요"); return renderQuiz(id); }
        err.textContent = "제출하지 못했어요: " + r.error.message; return;
      }
      renderResult(b, r.data);
    };
  }
  function renderWait(b, info) {
    var target = new Date(info.next_allowed_at).getTime();
    $app.innerHTML =
      '<div class="card center"><h2>⏳ 잠깐 쉬어 가요</h2>' +
      '<p class="muted">다시 도전하려면 조금 기다려야 해요. 그동안 책을 한 번 더 읽어 볼까요?</p>' +
      '<div style="font-size:2.2rem;font-weight:800" id="cd"></div>' +
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
    $app.innerHTML =
      '<div class="card result"><h2>' + esc(b.title) + "</h2>" +
      '<div class="stamp ' + (medal || "none") + '"><span class="em">' + (medal ? MEDALS[medal].em : "📘") + "</span><span>" + (medal ? MEDALS[medal].name : "도전 중") + "</span></div>" +
      '<div style="font-size:2rem;font-weight:800">' + r.score + " / " + r.total + "</div>" +
      "<p><b>" + msg + "</b></p>" +
      '<p class="muted">' + r.attempt + "번째 도전 · 내 최고 점수 " + r.best + "/" + r.total + (better ? " (" + MEDALS[r.best_medal].name + " 유지)" : "") + "</p>" +
      '<p class="muted">같은 책은 10분 뒤에 다시 도전할 수 있어요.</p>' +
      '<button class="btn" id="tohome">책장으로</button> <button class="btn ghost" id="reread">다시 읽기</button></div>';
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("reread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(b.id); };
    if (medal === "gold") confetti(70); else if (medal) confetti(30);
  }

  /* ---------- 교사 화면 ---------- */
  function csvDownload(name, rows) {
    var text = rows.map(function (r) { return r.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" }));
    a.download = name; a.click();
  }
  async function renderTeacher() {
    if (!state.isAdmin) { location.hash = "#/"; return; }
    loading();
    var res = await Promise.all([sb.rpc("admin_overview"), sb.rpc("admin_scores")]);
    if (res[0].error) throw res[0].error;
    if (res[1].error) throw res[1].error;
    var ov = res[0].data || [], sc = res[1].data || [];
    var classes = {};
    ov.forEach(function (r) { classes[r.grade ? r.grade + "-" + r.class_no : "미지정"] = 1; });
    var opts = '<option value="">전체</option>' + Object.keys(classes).sort().map(function (k) { return '<option value="' + esc(k) + '">' + esc(k) + "</option>"; }).join("");

    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button><h2 style="margin-top:12px">👩‍🏫 교사 화면</h2>' +
      '<div class="muted">가입한 사용자 ' + ov.length + "명 · 퀴즈 기록 " + sc.length + "건</div><br>" +
      '반 선택 <select id="cls">' + opts + '</select> <button class="btn ghost small" id="csv1">요약 CSV</button> <button class="btn ghost small" id="csv2">작품별 점수 CSV</button>' +
      '<div class="scroll" style="margin-top:12px"><table id="tbl"></table></div></div>' +
      '<div class="card"><h2>📋 명단 올리기</h2><p class="muted">한 줄에 한 명: <code>이메일,이름,학년,반,번호</code> (엑셀에서 복사해 붙여넣어도 돼요). 이미 가입한 학생에게도 바로 적용돼요.</p>' +
      '<textarea id="roster" placeholder="student005@smy.ms.kr,문영학생5,1,2,5"></textarea><br><button class="btn" id="saveroster">명단 저장</button></div>';

    function draw() {
      var f = document.getElementById("cls").value;
      var rows = ov.filter(function (r) { return !f || (r.grade ? r.grade + "-" + r.class_no : "미지정") === f; });
      document.getElementById("tbl").innerHTML =
        "<tr><th>학년-반-번호</th><th>이름</th><th>구분</th><th>완료</th><th>🥇</th><th>🥈</th><th>🥉</th><th>단어</th><th>도전</th><th>최근</th></tr>" +
        rows.map(function (r) {
          return "<tr><td>" + (r.grade ? r.grade + "-" + r.class_no + "-" + r.student_no : "-") + "</td><td>" + esc(r.name || r.email) + "</td><td>" + (r.role === "school" ? "학교" : "외부") +
            "</td><td>" + r.completed + "</td><td>" + r.gold + "</td><td>" + r.silver + "</td><td>" + r.bronze + "</td><td>" + r.words + "</td><td>" + r.attempts + "</td><td>" + fmtDate(r.last_activity) + "</td></tr>";
        }).join("");
    }
    draw();
    document.getElementById("cls").onchange = draw;
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("csv1").onclick = function () {
      csvDownload("독서현황.csv", [["이메일", "이름", "구분", "학년", "반", "번호", "완료", "금", "은", "동", "단어", "도전", "최근활동"]].concat(
        ov.map(function (r) { return [r.email, r.name, r.role, r.grade, r.class_no, r.student_no, r.completed, r.gold, r.silver, r.bronze, r.words, r.attempts, r.last_activity]; })));
    };
    document.getElementById("csv2").onclick = function () {
      csvDownload("작품별점수.csv", [["이메일", "이름", "학년", "반", "번호", "작품", "최고점수", "만점", "도전횟수", "메달", "최근"]].concat(
        sc.map(function (r) { return [r.email, r.name, r.grade, r.class_no, r.student_no, r.book_id, r.best, r.total, r.attempts, r.medal, r.last_at]; })));
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
