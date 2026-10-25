(function () {
  "use strict";

  var SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (비밀 키는 절대 넣지 않음)
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SCHOOL_LABEL = "서울문영여자중학교";
  var ASSET_V = "5"; // 파일을 고칠 때마다 index.html 과 여기 숫자를 같이 올려요
  var LEVELS = ["A1", "A2", "B1", "B2", "C1"];
  var MEDALS = {
    gold: { em: "🥇", name: "금메달" },
    silver: { em: "🥈", name: "은메달" },
    bronze: { em: "🥉", name: "동메달" }
  };

  var sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  var $app = document.getElementById("app");
  var $who = document.getElementById("who");
  var state = { user: null, profile: null, isAdmin: false, bookTab: "story", revealed: {}, shelf: { level: "all", status: "all", q: "" } };
  var timer = null;
  var contentLoads = {};

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function findBook(id) { return (window.BOOKS || []).filter(function (b) { return b.id === id; })[0]; }
  function levelOf(b) { return String((b && b.cefr) || "").toUpperCase().slice(0, 2); }
  // 책 본문은 열 때만 불러와요 (목록은 books.js, 본문은 books/<id>.js)
  function loadContent(id) {
    if (window.BOOK_CONTENT && window.BOOK_CONTENT[id]) return Promise.resolve(window.BOOK_CONTENT[id]);
    if (contentLoads[id]) return contentLoads[id];
    contentLoads[id] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = "books/" + encodeURIComponent(id) + ".js?v=" + ASSET_V;
      s.onload = function () {
        if (window.BOOK_CONTENT && window.BOOK_CONTENT[id]) resolve(window.BOOK_CONTENT[id]);
        else { delete contentLoads[id]; reject(new Error("책 내용을 찾지 못했어요.")); }
      };
      s.onerror = function () { delete contentLoads[id]; reject(new Error("책 내용을 불러오지 못했어요. 잠시 뒤 다시 해 주세요.")); };
      document.head.appendChild(s);
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
  function cleanMsg(m) { return String(m || "").replace(/^[a-z]+:\s*/i, ""); }
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
      (state.isAdmin ? '<span class="badge school">교사</span>' : "") +
      '<b class="nick">' + esc(p.nickname || "") + "</b></div>" +
      '<div class="whobtn"><button class="btn ghost small" id="nickbtn">✏️ 닉네임</button>' +
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
    ov.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:70;display:flex;align-items:center;justify-content:center;padding:16px";
    ov.innerHTML =
      '<div class="card" style="max-width:380px;width:100%;margin:0"><h2>✏️ 닉네임 바꾸기</h2>' +
      '<p class="muted">2~12글자로 원하는 이름을 정해 보세요. 순위표에 이 이름이 보여요. 부적절한 이름은 선생님이 바꿀 수 있어요.</p>' +
      '<input id="nickin" maxlength="12" style="width:100%;padding:8px;border:1px solid var(--line);border-radius:10px;font:inherit" value="' + esc((state.profile && state.profile.nickname) || "") + '">' +
      '<div class="err" id="nickerr"></div>' +
      '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="nicksave">저장</button><button class="btn ghost" id="nickrand">🎲 랜덤 이름</button><button class="btn ghost" id="nickcancel">취소</button></div></div>';
    document.body.appendChild(ov);
    var input = document.getElementById("nickin");
    input.focus(); input.select();
    function done(nick) {
      state.profile.nickname = nick; renderWho(); ov.remove(); toast("닉네임: " + nick);
      if ((location.hash || "#/") === "#/") route();
    }
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
  function medalBox(em, n, label) {
    return '<div class="medal"><span class="em">' + em + '</span><span class="n">' + n + '</span><div class="muted">' + label + "</div></div>";
  }
  async function renderHome() {
    loading();
    var res = await Promise.all([sb.rpc("my_summary"), sb.rpc("leaderboard"), sb.from("books").select("id,featured")]);
    if (res[0].error) throw res[0].error;
    var sum = res[0].data || { books: [], gold: 0, silver: 0, bronze: 0, stars: 0, words: 0 };
    var board = res[1].data || [];
    var featured = {};
    (res[2].data || []).forEach(function (r) { if (r.featured) featured[r.id] = true; });
    var byId = {};
    (sum.books || []).forEach(function (b) { byId[b.book_id] = b; });
    var books = window.BOOKS || [];
    function st(b) { var r = byId[b.id]; return !r ? "new" : (r.medal ? "done" : "trying"); }
    var done = books.filter(function (b) { return st(b) === "done"; }).length;
    var pct = books.length ? Math.round((done / books.length) * 100) : 0;

    function card(b) {
      var r = byId[b.id];
      var medal = r && r.medal;
      return '<div class="book ' + (st(b) === "new" ? "todo" : "") + '" style="background:' + esc(b.color) + '" data-id="' + esc(b.id) + '">' +
        (medal ? '<div class="stamp-corner">' + MEDALS[medal].em + "</div>" : "") +
        '<div class="cover">' + esc(b.emoji) + "</div>" +
        '<div><div class="t">' + esc(b.title) + '</div><div class="a">' + esc(b.titleKo) + " · " + esc(b.authorKo) + "</div></div>" +
        '<div><span class="lv">' + esc(levelOf(b)) + " · " + b.words + "단어" + (b.country ? " · " + esc(b.country) : "") + "</span>" +
        '<div class="a" style="margin-top:4px">' + (r ? "최고 " + r.best + "/" + r.total + " · " + r.attempts + "회 도전" + (r.star ? " ⭐" : "") : "아직 도전 전") + "</div></div></div>";
    }
    function section(title, list, note) {
      if (!list.length) return "";
      return '<div class="card"><h2>' + title + "</h2>" + (note ? '<p class="muted">' + note + "</p>" : "") +
        '<div class="shelf">' + list.map(card).join("") + "</div></div>";
    }
    function bindCards(root) {
      Array.prototype.forEach.call(root.querySelectorAll(".book"), function (el) {
        el.onclick = function () { state.bookTab = "story"; location.hash = "#/book/" + encodeURIComponent(el.getAttribute("data-id")); };
      });
    }

    // 수준별 진행도
    var lvRows = LEVELS.map(function (lv) {
      var inLv = books.filter(function (b) { return levelOf(b) === lv; });
      if (!inLv.length) return "";
      var d = inLv.filter(function (b) { return st(b) === "done"; }).length;
      return '<div class="lvrow"><span class="lvname">' + lv + '</span><div class="progress sm"><div style="width:' + Math.round((d / inLv.length) * 100) + '%"></div></div><span class="lvcount">' + d + "/" + inLv.length + "</span></div>";
    }).join("");

    // 추천 영역
    var featuredList = books.filter(function (b) { return featured[b.id]; });
    var trying = books.filter(function (b) { return st(b) === "trying"; });
    var doneLv = books.filter(function (b) { return st(b) === "done"; }).map(function (b) { return LEVELS.indexOf(levelOf(b)); });
    var cur = doneLv.length ? Math.max.apply(null, doneLv) : -1;
    var rec = books.filter(function (b) { return st(b) === "new" && !featured[b.id]; }).sort(function (a, b) {
      var ka = LEVELS.indexOf(levelOf(a)), kb = LEVELS.indexOf(levelOf(b));
      function key(k) { return cur < 0 ? k : (k >= cur ? k - cur : cur - k + 0.5); }
      return key(ka) - key(kb);
    }).slice(0, 3);

    var boardHtml = board.length
      ? "<ol>" + board.map(function (r, i) {
          var rk = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1;
          return '<li><span class="rk">' + rk + '</span><span class="nm">' + esc(r.nickname) + '</span><span class="ms">🥇' + r.gold + " 🥈" + r.silver + " 🥉" + r.bronze + " ⭐" + r.stars + "</span></li>";
        }).join("") + "</ol>"
      : '<p class="muted">아직 순위가 없어요. 첫 메달의 주인공이 되어 보세요!</p>';

    var show = state.profile && state.profile.show_on_board;
    var isSchool = state.profile && state.profile.role === "school";
    var S = state.shelf;
    function pillsHtml() {
      var lv = [["all", "전체", books.length]].concat(LEVELS.map(function (l) {
        return [l, l, books.filter(function (b) { return levelOf(b) === l; }).length];
      }));
      var stt = [["all", "전체"], ["new", "안 읽음"], ["trying", "도전 중"], ["done", "완료"]];
      return '<div class="pills" id="lvpills">' + lv.map(function (x) {
        return '<button class="pill ' + (S.level === x[0] ? "on" : "") + (x[2] ? "" : " empty") + '" data-lv="' + x[0] + '">' + x[1] + " <small>" + x[2] + "</small></button>";
      }).join("") + '</div><div class="pills" id="stpills">' + stt.map(function (x) {
        return '<button class="pill ' + (S.status === x[0] ? "on" : "") + '" data-st="' + x[0] + '">' + x[1] + "</button>";
      }).join("") + "</div>";
    }

    $app.innerHTML =
      '<div class="card"><h2>🛂 내 독서 여권</h2>' +
      "<div><b>" + done + " / " + books.length + "</b> 작품 완료 <span class=\"muted\">(60점 이상이면 완료)</span></div>" +
      '<div class="progress"><div style="width:0%" id="bar"></div></div>' +
      '<div class="muted">읽은 단어 수: <b>' + (sum.words || 0).toLocaleString() + "</b> 단어</div>" +
      (lvRows ? '<div class="lvbox">' + lvRows + "</div>" : "") + "<br>" +
      '<div class="medals">' + medalBox("🥇", sum.gold || 0, "금메달") + medalBox("🥈", sum.silver || 0, "은메달") + medalBox("🥉", sum.bronze || 0, "동메달") + medalBox("⭐", sum.stars || 0, "무힌트") + "</div></div>" +
      section("🌟 선생님 추천", featuredList, "선생님이 골라 준 책이에요.") +
      section("🔥 이어서 도전하기", trying, "아직 메달을 받지 못한 책이에요. 한 번 더 도전해 볼까요?") +
      section("🧭 다음에 읽을 책", rec, cur < 0 ? "쉬운 책부터 시작해 보세요." : "내 수준에 맞춰 골랐어요.") +
      '<div class="card"><h2>📚 책장</h2>' + pillsHtml() +
      '<input id="q" class="search" type="search" placeholder="🔍 제목, 작가, 나라 검색" value="' + esc(S.q) + '"><div id="shelfres"></div></div>' +
      '<div class="card board"><h2>🏆 메달 순위 TOP 10</h2>' + boardHtml +
      '<p class="muted" style="margin-top:10px">금 → 은 → 동 → ⭐ 순으로 정렬돼요. 순위에는 닉네임이 보여요.' + (isSchool ? "" : " (외부 이용자는 순위에 나오지 않아요.)") + "</p>" +
      (isSchool ? '<label class="muted"><input type="checkbox" id="showboard" ' + (show ? "checked" : "") + "> 내 닉네임을 순위표에 보이기</label>" : "") + "</div>";

    function drawShelf() {
      var q = S.q.trim().toLowerCase();
      var list = books.filter(function (b) {
        if (S.level !== "all" && levelOf(b) !== S.level) return false;
        if (S.status !== "all" && st(b) !== S.status) return false;
        if (q) {
          var hay = [b.title, b.titleKo, b.author, b.authorKo, b.country].join(" ").toLowerCase();
          if (hay.indexOf(q) < 0) return false;
        }
        return true;
      });
      var html;
      if (!list.length) {
        html = '<p class="muted">' + (S.level !== "all" && S.status === "all" && !q ? S.level + " 수준의 책은 아직 준비 중이에요." : "조건에 맞는 책이 없어요.") + "</p>";
      } else if (S.status === "all" && !q) {
        var open = list.filter(function (b) { return st(b) !== "done"; });
        var dn = list.filter(function (b) { return st(b) === "done"; });
        html = (open.length ? '<div class="shelf">' + open.map(card).join("") + "</div>" : '<p class="muted">읽을 책을 모두 완료했어요! 🎉</p>') +
          (dn.length ? '<details class="donebox"><summary>🏅 완료한 책 ' + dn.length + '권</summary><div class="shelf" style="margin-top:10px">' + dn.map(card).join("") + "</div></details>" : "");
      } else {
        html = '<p class="muted">' + list.length + '권</p><div class="shelf">' + list.map(card).join("") + "</div>";
      }
      var box = document.getElementById("shelfres");
      box.innerHTML = html;
      bindCards(box);
    }
    drawShelf();
    bindCards($app);
    Array.prototype.forEach.call(document.querySelectorAll("#lvpills .pill"), function (el) {
      el.onclick = function () {
        S.level = el.getAttribute("data-lv");
        Array.prototype.forEach.call(document.querySelectorAll("#lvpills .pill"), function (o) { o.classList.toggle("on", o === el); });
        drawShelf();
      };
    });
    Array.prototype.forEach.call(document.querySelectorAll("#stpills .pill"), function (el) {
      el.onclick = function () {
        S.status = el.getAttribute("data-st");
        Array.prototype.forEach.call(document.querySelectorAll("#stpills .pill"), function (o) { o.classList.toggle("on", o === el); });
        drawShelf();
      };
    });
    document.getElementById("q").oninput = function () { S.q = this.value; drawShelf(); };

    setTimeout(function () { var bar = document.getElementById("bar"); if (bar) bar.style.width = pct + "%"; }, 80);
    var cb = document.getElementById("showboard");
    if (cb) cb.onchange = async function () {
      var r = await sb.rpc("set_show_on_board", { p_show: cb.checked });
      if (r.error) return toast("설정을 바꾸지 못했어요");
      state.profile.show_on_board = cb.checked; toast(cb.checked ? "순위표에 보여요" : "순위표에서 숨겼어요");
      renderHome();
    };
  }

  /* ---------- 책 읽기 ---------- */
  function revealBtn(key, label, hintIdx) {
    return '<button class="btn ghost small reveal" data-k="' + key + '"' + (hintIdx != null ? ' data-hint="' + hintIdx + '"' : "") + ">" + label + "</button>";
  }
  async function renderBook(id) {
    var b = findBook(id);
    if (!b) return showError("책을 찾을 수 없어요.");
    loading();
    var got = await Promise.all([loadContent(id), sb.rpc("my_hint_count", { p_book_id: id })]);
    var c = got[0];
    var hintCount = got[1].data || 0;
    var rv = state.revealed[id] || (state.revealed[id] = {});
    var tabs = [["story", "📖 이야기"], ["analysis", "🔎 분석"], ["chars", "🎭 인물"], ["vocab", "🔤 단어장"]];
    var body = "";
    if (state.bookTab === "story") {
      body = '<div class="hintnote">처음에는 영어만 보여요. 어려운 단락은 <b>🇰🇷 한국어 보기</b>를 눌러 힌트를 볼 수 있어요. ' +
        "이 책에서 번역을 한 번도 보지 않고 퀴즈를 통과하면 <b>⭐ 무힌트 보너스</b>를 받아요! " +
        "(지금까지 본 번역: <b>" + hintCount + "</b>개 단락)</div>" +
        c.story.map(function (p, i) {
          var key = "p" + i;
          return '<div class="para"><div>' + esc(p.en) + "</div>" +
            (rv[key] ? '<div class="ko">' + esc(p.ko) + "</div>" : revealBtn(key, "🇰🇷 한국어 보기 (힌트)", i)) + "</div>";
        }).join("");
    } else if (state.bookTab === "analysis") {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.analysis.map(function (a, i) {
        var key = "a" + i;
        return '<div class="kv"><b>' + esc(a.label) + "</b>" + esc(a.en) +
          (rv[key] ? '<div class="muted">' + esc(a.ko) + "</div>" : "<div>" + revealBtn(key, "🇰🇷 보기") + "</div>") + "</div>";
      }).join("");
    } else if (state.bookTab === "chars") {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.characters.map(function (ch, i) {
        var key = "c" + i;
        return '<div class="kv"><b>' + esc(ch.name) + "</b>" + esc(ch.en) +
          (rv[key] ? '<div class="muted">' + esc(ch.ko) + "</div>" : "<div>" + revealBtn(key, "🇰🇷 보기") + "</div>") + "</div>";
      }).join("");
    } else {
      body = '<p class="muted">분석·인물·단어장의 한국어는 힌트로 세지 않아요.</p>' + c.vocab.map(function (g, gi) {
        return "<h3>" + esc(g.level) + '</h3><div class="scroll"><table><tr><th>단어</th><th>뜻</th><th>영영 풀이</th></tr>' +
          g.items.map(function (w, wi) {
            var key = "v" + gi + "-" + wi;
            return "<tr><td><b>" + esc(w[0]) + '</b> <span class="muted">' + esc(w[1]) + "</span></td><td>" +
              (rv[key] ? esc(w[2]) : revealBtn(key, "뜻 보기")) + "</td><td>" + esc(w[3]) + "</td></tr>";
          }).join("") + "</table></div>";
      }).join("");
    }
    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button>' +
      "<h2 style=\"margin-top:12px\">" + esc(b.emoji) + " " + esc(b.title) + "</h2>" +
      '<div class="muted">' + esc(b.titleKo) + " · " + esc(b.author) + " (" + esc(b.authorKo) + ")</div>" +
      '<div style="margin:8px 0"><span class="badge school">CEFR ' + esc(b.cefr) + '</span> <span class="badge external">Lexile ' + esc(b.lexile) + '</span> <span class="badge school">AR ' + esc(b.ar) + '</span> <span class="badge external">' + b.words + "단어</span>" +
      (b.country ? ' <span class="badge school">' + esc(b.country) + "</span>" : "") + "</div></div>" +
      '<div class="card"><div class="tabs">' + tabs.map(function (t) { return '<button data-t="' + t[0] + '" class="' + (state.bookTab === t[0] ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>" + body +
      '<div class="center" style="margin-top:18px"><button class="btn" id="goquiz">다 읽었어요 · 퀴즈 풀기 ✏️</button></div></div>';
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("goquiz").onclick = function () { location.hash = "#/quiz/" + encodeURIComponent(b.id); };
    Array.prototype.forEach.call(document.querySelectorAll(".tabs button"), function (el) {
      el.onclick = function () { state.bookTab = el.getAttribute("data-t"); renderBook(id).catch(showError); };
    });
    Array.prototype.forEach.call(document.querySelectorAll(".reveal"), function (el) {
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
      '<div class="card"><button class="btn ghost small" id="toread">← 읽기로</button>' +
      "<h2 style=\"margin-top:12px\">✏️ " + esc(b.title) + " 퀴즈</h2>" +
      '<p class="muted">총 ' + qs.length + "문항 · 문제와 보기 순서는 매번 달라져요. 한 번 제출하면 10분 뒤에 다시 도전할 수 있어요." +
      (info.best != null ? " (내 최고 점수: " + info.best + "/" + info.total + ")" : "") + "</p>" +
      '<div class="hintnote">' + (hintCount === 0 ? "지금까지 번역을 보지 않았어요. 이대로 통과하면 <b>⭐ 무힌트 보너스</b>!" : "번역을 본 단락: <b>" + hintCount + "</b>개 (이 책에서는 ⭐ 무힌트 보너스를 받을 수 없어요)") + "</div>" +
      qs.map(function (q, i) {
        return '<div class="q"><div class="qt">' + (i + 1) + ". " + esc(q.question) + "</div>" +
          q.choices.map(function (c) {
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
    var starMsg = r.star ? '<p><b>⭐ 무힌트 보너스를 받았어요!</b></p>'
      : (medal && r.hints > 0 ? '<p class="muted">번역을 본 단락이 ' + r.hints + '개라서 이번에는 ⭐ 보너스가 없어요. 다음 책에서는 영어로만 도전해 봐요!</p>' : "");
    $app.innerHTML =
      '<div class="card result"><h2>' + esc(b.title) + "</h2>" +
      '<div class="stamp ' + (medal || "none") + '"><span class="em">' + (medal ? MEDALS[medal].em : "📘") + "</span><span>" + (medal ? MEDALS[medal].name : "도전 중") + "</span></div>" +
      '<div style="font-size:2rem;font-weight:800">' + r.score + " / " + r.total + (r.star ? " ⭐" : "") + "</div>" +
      "<p><b>" + msg + "</b></p>" + starMsg +
      '<p class="muted">' + r.attempt + "번째 도전 · 내 최고 점수 " + r.best + "/" + r.total + (better ? " (" + MEDALS[r.best_medal].name + " 유지)" : "") + "</p>" +
      '<p class="muted">같은 책은 10분 뒤에 다시 도전할 수 있어요.</p>' +
      '<button class="btn" id="tohome">책장으로</button> <button class="btn ghost" id="reread">다시 읽기</button></div>';
    document.getElementById("tohome").onclick = function () { location.hash = "#/"; };
    document.getElementById("reread").onclick = function () { location.hash = "#/book/" + encodeURIComponent(b.id); };
    if (medal === "gold") confetti(70); else if (medal) confetti(30);
    if (r.star) setTimeout(function () { confetti(40); }, 600);
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
    var res = await Promise.all([sb.rpc("admin_overview"), sb.rpc("admin_scores"), sb.rpc("admin_hint_stats"), sb.from("books").select("id,featured")]);
    for (var k = 0; k < 3; k++) if (res[k].error) throw res[k].error;
    var ov = res[0].data || [], sc = res[1].data || [], hs = res[2].data || [];
    var feat = {};
    (res[3].data || []).forEach(function (r) { feat[r.id] = !!r.featured; });
    var hsBooks = {};
    hs.forEach(function (h) { hsBooks[h.book_id] = 1; });
    await Promise.all(Object.keys(hsBooks).map(function (bid) { return loadContent(bid).catch(function () { return null; }); }));
    var classes = {};
    ov.forEach(function (r) { classes[r.grade ? r.grade + "-" + r.class_no : "미지정"] = 1; });
    var opts = '<option value="">전체</option>' + Object.keys(classes).sort().map(function (c) { return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");

    var hintRows = hs.map(function (h) {
      var bk = findBook(h.book_id);
      var cont = window.BOOK_CONTENT && window.BOOK_CONTENT[h.book_id];
      var para = cont && cont.story[h.para] ? cont.story[h.para].en.slice(0, 60) + "…" : "";
      return "<tr><td>" + esc(bk ? bk.titleKo : h.book_id) + "</td><td>" + (h.para + 1) + "단락</td><td>" + esc(para) + "</td><td>" + h.students + "명</td><td>" + h.clicks + "회</td></tr>";
    }).join("");
    var featRows = (window.BOOKS || []).map(function (b) {
      return '<label style="display:block;padding:4px 0"><input type="checkbox" class="featcb" data-id="' + esc(b.id) + '" ' + (feat[b.id] ? "checked" : "") + "> " + esc(b.emoji) + " " + esc(b.title) + ' <span class="muted">(' + esc(levelOf(b)) + ")</span></label>";
    }).join("");

    $app.innerHTML =
      '<div class="card"><button class="btn ghost small" id="tohome">← 책장</button><h2 style="margin-top:12px">👩‍🏫 교사 화면</h2>' +
      '<div class="muted">가입한 사용자 ' + ov.length + "명 · 퀴즈 기록 " + sc.length + "건</div><br>" +
      '반 선택 <select id="cls">' + opts + '</select> <button class="btn ghost small" id="csv1">요약 CSV</button> <button class="btn ghost small" id="csv2">작품별 점수 CSV</button>' +
      '<div class="scroll" style="margin-top:12px"><table id="tbl"></table></div>' +
      '<p class="muted">닉네임이 부적절하면 ✏️로 바꾸거나 ↺로 랜덤 이름으로 되돌릴 수 있어요.</p></div>' +
      '<div class="card"><h2>🌟 선생님 추천 책</h2><p class="muted">체크한 책은 학생 책장 맨 위 "선생님 추천" 칸에 나와요.</p>' + featRows + "</div>" +
      '<div class="card"><h2>🇰🇷 단락별 번역(힌트) 열람</h2><p class="muted">학생들이 어느 단락에서 한국어 번역을 많이 봤는지 보여 줘요. 어려운 단락을 찾는 데 쓸 수 있어요.</p>' +
      (hintRows ? '<div class="scroll"><table><tr><th>작품</th><th>단락</th><th>내용</th><th>본 학생 수</th><th>누른 횟수</th></tr>' + hintRows + "</table></div>" : '<p class="muted">아직 기록이 없어요.</p>') + "</div>" +
      '<div class="card"><h2>📋 명단 올리기</h2><p class="muted">한 줄에 한 명: <code>이메일,이름,학년,반,번호</code> (엑셀에서 복사해 붙여넣어도 돼요). 이미 가입한 학생에게도 바로 적용돼요.</p>' +
      '<textarea id="roster" placeholder="student005@smy.ms.kr,문영학생5,1,2,5"></textarea><br><button class="btn" id="saveroster">명단 저장</button></div>';

    Array.prototype.forEach.call(document.querySelectorAll(".featcb"), function (cb) {
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
      Array.prototype.forEach.call(document.querySelectorAll(".nick-edit"), function (el) {
        el.onclick = async function () {
          var v = window.prompt("새 닉네임 (비우면 랜덤 이름으로 초기화)", el.getAttribute("data-n"));
          if (v === null) return;
          var r = await sb.rpc("admin_set_nickname", { p_email: el.getAttribute("data-e"), p_nick: v });
          if (r.error) return toast("저장 실패: " + r.error.message);
          toast("닉네임을 바꿨어요"); renderTeacher();
        };
      });
      Array.prototype.forEach.call(document.querySelectorAll(".nick-reset"), function (el) {
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
