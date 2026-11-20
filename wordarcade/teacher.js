// MY Word Arcade — 교사 화면 (📊 통계 · 📚 단어장 · ⚙️ 설정)
(function () {
  "use strict";
  var WA = window.WA, $ = WA.$, $$ = WA.$$, esc = WA.esc, state = WA.state;
  var XLSX_URL = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  var T = { tab: WA.lget("wa.tTab", "stats"), range: "week", grade: "", cls: "", game: "", roster: null, plays: null, sort: "score", draft: null };
  var DAY = 864e5;

  WA.viewTeacher = function () {
    $("#main").innerHTML = '<div class="tabs">' + [["stats", "📊 학생 통계"], ["words", "😵 취약 어휘"], ["banks", "📚 단어장"], ["settings", "⚙️ 설정"]].map(function (t) {
      return '<button data-t="' + t[0] + '"' + (T.tab === t[0] ? ' class="on"' : "") + ">" + t[1] + "</button>"; }).join("") + '</div><div id="tv"></div>';
    $$(".tabs button").forEach(function (b) { b.onclick = function () { T.tab = b.dataset.t; WA.lset("wa.tTab", T.tab); WA.viewTeacher(); }; });
    ({ stats: viewStats, words: viewWords, banks: viewBanks, settings: viewSettings })[T.tab]();
  };

  function sid(r) { return r && r.grade ? String(r.grade) + String(r.class_no).padStart(2, "0") + String(r.student_no).padStart(2, "0") : ""; }
  function loadRoster() {
    if (T.roster) return Promise.resolve(T.roster);
    return WA.rpc("wa_roster").then(function (rows) { var m = {}; (rows || []).forEach(function (r) { m[r.email] = r; }); T.roster = m; return m; });
  }
  function since() {
    var d = new Date(Date.now() + 9 * 3600e3); d.setUTCHours(0, 0, 0, 0); var t = d.getTime() - 9 * 3600e3;
    if (T.range === "today") return new Date(t).toISOString();
    if (T.range === "week") return new Date(t - ((new Date(t + 9 * 3600e3).getUTCDay() + 6) % 7) * DAY).toISOString();
    if (T.range === "month") return new Date(t - 29 * DAY).toISOString();
    return "2000-01-01T00:00:00Z";
  }
  function loadPlays() {
    return WA.all(function () { return WA.client().from("wa_plays").select("id,user_id,email,game,mode,bank,lessons,n,ok,score,ms,hints,extra,created_at").gte("created_at", since()).order("created_at", { ascending: false }); });
  }
  function filters(withGame) {
    var R = T.roster || {}, grades = {}, classes = {};
    Object.keys(R).forEach(function (e) { var r = R[e]; if (r.grade) { grades[r.grade] = 1; if (!T.grade || String(r.grade) === T.grade) classes[r.class_no] = 1; } });
    return '<div class="filters">' +
      '<select id="fr">' + [["today", "오늘"], ["week", "이번 주"], ["month", "최근 30일"], ["all", "전체 기간"]].map(function (o) { return '<option value="' + o[0] + '"' + (T.range === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select>" +
      '<select id="fg"><option value="">전체 학년</option>' + Object.keys(grades).sort().map(function (g) { return '<option value="' + g + '"' + (T.grade === g ? " selected" : "") + ">" + g + "학년</option>"; }).join("") + "</select>" +
      '<select id="fc"><option value="">전체 반</option>' + Object.keys(classes).sort(function (a, b) { return a - b; }).map(function (c) { return '<option value="' + c + '"' + (T.cls === c ? " selected" : "") + ">" + c + "반</option>"; }).join("") + "</select>" +
      (withGame ? '<select id="fgm"><option value="">전체 게임</option>' + WA.order.map(function (id) { return '<option value="' + id + '"' + (T.game === id ? " selected" : "") + ">" + WA.games[id].icon + " " + esc(WA.games[id].name) + "</option>"; }).join("") + "</select>" : "") +
      '<button class="btn sm" id="fre">🔄 새로고침</button></div>';
  }
  function bindFilters(redraw) {
    $("#fr").onchange = function () { T.range = this.value; T.plays = null; redraw(); };
    $("#fg").onchange = function () { T.grade = this.value; T.cls = ""; redraw(); };
    $("#fc").onchange = function () { T.cls = this.value; redraw(); };
    if ($("#fgm")) $("#fgm").onchange = function () { T.game = this.value; redraw(); };
    $("#fre").onclick = function () { T.plays = null; T.roster = null; redraw(); };
  }
  function inClass(email) {
    var r = (T.roster || {})[email];
    if (!T.grade && !T.cls) return true;
    if (!r) return false;
    return (!T.grade || String(r.grade) === T.grade) && (!T.cls || String(r.class_no) === T.cls);
  }
  function csv(name, rows) {
    var text = "﻿" + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/csv" })); a.download = name; a.click();
  }

  // ---------- 📊 학생 통계 ----------
  function viewStats() {
    var tv = $("#tv"); tv.innerHTML = '<div class="card center muted">불러오는 중…</div>';
    Promise.all([loadRoster(), T.plays ? T.plays : loadPlays().then(function (p) { T.plays = p; return p; })]).then(function () {
      var R = T.roster, P = T.plays.filter(function (p) { return inClass(p.email) && (!T.game || p.game === T.game); });
      var by = {};
      P.forEach(function (p) {
        var s = by[p.email] || (by[p.email] = { email: p.email, plays: 0, n: 0, ok: 0, score: 0, ms: 0, hints: 0, last: p.created_at, games: {} });
        s.plays++; s.n += p.n; s.ok += p.ok; s.score += p.score; s.ms += p.ms; s.hints += p.hints; s.games[p.game] = (s.games[p.game] || 0) + 1;
        if (p.created_at > s.last) s.last = p.created_at;
      });
      var list = Object.keys(by).map(function (e) { var s = by[e], r = R[e] || {}; s.sid = sid(r); s.name = r.name || ""; s.acc = WA.pct(s.ok, s.n); return s; });
      var key = T.sort; list.sort(function (a, b) { return key === "sid" ? (a.sid || "z").localeCompare(b.sid || "z") : (b[key] || 0) - (a[key] || 0); });
      var per = {}; P.forEach(function (p) { var x = per[p.game] || (per[p.game] = { plays: 0, n: 0, ok: 0, ms: 0, users: {} }); x.plays++; x.n += p.n; x.ok += p.ok; x.ms += p.ms; x.users[p.email] = 1; });
      var tot = P.reduce(function (a, p) { a.n += p.n; a.ok += p.ok; a.ms += p.ms; return a; }, { n: 0, ok: 0, ms: 0 });
      tv.innerHTML = '<div class="card">' + filters(true) +
        '<div class="kpis"><div class="kpi"><b>' + list.length + '명</b><span>참여 학생</span></div><div class="kpi"><b>' + P.length + '판</b><span>게임 수</span></div><div class="kpi"><b>' + WA.pct(tot.ok, tot.n) + '%</b><span>평균 정답률</span></div><div class="kpi"><b>' + WA.sec(tot.ms) + "</b><span>총 학습 시간</span></div></div>" +
        '<h3>게임별</h3><div class="tbl-wrap"><table class="tbl"><tr><th>게임</th><th>학생</th><th>판</th><th>정답률</th><th>평균 시간</th></tr>' +
        WA.order.map(function (id) { var x = per[id], g = WA.games[id]; return x ? "<tr><td>" + g.icon + " " + esc(g.name) + "</td><td>" + Object.keys(x.users).length + "</td><td>" + x.plays + "</td><td>" + WA.pct(x.ok, x.n) + "%</td><td>" + WA.sec(x.ms / x.plays) + "</td></tr>" : ""; }).join("") + "</table></div></div>" +
        '<div class="card"><div class="filters"><h3 style="margin:0;margin-right:auto">학생별 (' + list.length + '명)</h3><button class="btn sm" id="csv">⬇️ CSV</button></div>' +
        '<div class="tbl-wrap"><table class="tbl"><tr>' + [["sid", "학번"], ["", "이름"], ["plays", "판"], ["score", "점수 합"], ["acc", "정답률"], ["ms", "시간"], ["hints", "힌트"], ["last", "마지막"]].map(function (h) { return "<th" + (h[0] ? ' data-s="' + h[0] + '"' : "") + ">" + h[1] + (T.sort === h[0] ? " ▼" : "") + "</th>"; }).join("") + "</tr>" +
        list.map(function (s) { return '<tr class="click" data-e="' + esc(s.email) + '"><td>' + (s.sid || '<span class="muted small">' + esc(s.email.split("@")[0]) + "</span>") + "</td><td>" + esc(s.name) + "</td><td>" + s.plays + "</td><td>" + WA.num(s.score) + "</td><td>" + s.acc + "%</td><td>" + WA.sec(s.ms) + "</td><td>" + s.hints + "</td><td>" + new Date(s.last).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" }) + "</td></tr>"; }).join("") +
        "</table></div>" + (list.length ? "" : '<p class="center muted">이 기간에 기록이 없어요.</p>') + "</div>";
      bindFilters(viewStats);
      $$("th[data-s]").forEach(function (th) { th.onclick = function () { T.sort = th.dataset.s; viewStats(); }; });
      $$("tr[data-e]").forEach(function (tr) { tr.onclick = function () { student(tr.dataset.e); }; });
      $("#csv").onclick = function () {
        csv("word-arcade-students.csv", [["학번", "이름", "이메일", "판", "점수합", "문제수", "맞힌수", "정답률", "시간(초)", "힌트", "마지막"]].concat(list.map(function (s) {
          return [s.sid, s.name, s.email, s.plays, s.score, s.n, s.ok, s.acc, Math.round(s.ms / 1000), s.hints, s.last]; })));
      };
    }).catch(function (e) { tv.innerHTML = '<div class="card err">' + esc(WA.errMsg(e)) + "</div>"; });
  }
  function student(email) {
    var r = (T.roster || {})[email] || {}, P = T.plays.filter(function (p) { return p.email === email; });
    WA.overlay('<div class="filters"><h2 style="margin:0;margin-right:auto">' + esc(sid(r)) + " " + esc(r.name || email) + '</h2><button class="btn sm" data-close>닫기</button></div><div id="sw" class="muted">틀린 단어 불러오는 중…</div>' +
      '<h3 style="margin-top:12px">게임 기록 (' + P.length + ')</h3><div class="tbl-wrap"><table class="tbl"><tr><th>날짜</th><th>게임</th><th>단원</th><th>점수</th><th>맞힘</th><th>시간</th></tr>' +
      P.slice(0, 80).map(function (p) { var g = WA.games[p.game] || { icon: "", name: p.game }; var b = WA.bank(p.bank); return "<tr><td>" + new Date(p.created_at).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) + "</td><td>" + g.icon + " " + esc(g.name) + "</td><td>" + esc(b ? b.name : p.bank) + " " + esc(p.lessons) + "</td><td>" + p.score + "</td><td>" + p.ok + "/" + p.n + "</td><td>" + WA.sec(p.ms) + "</td></tr>"; }).join("") + "</table></div>");
    WA.sel(WA.client().from("wa_wordstat").select("bank,word,tries,wrong,last_ok").eq("email", email).gt("wrong", 0).order("wrong", { ascending: false }).range(0, 59)).then(function (rows) {
      $("#sw").innerHTML = rows.length ? "<h3>😵 많이 틀린 단어</h3>" + rows.map(function (x) { return '<span class="pill ' + (x.last_ok ? "ok" : "bad") + '" style="margin:2px">' + esc(x.word) + " " + x.wrong + "/" + x.tries + "</span>"; }).join("") : "틀린 단어가 없어요.";
    }).catch(function (e) { $("#sw").textContent = WA.errMsg(e); });
  }

  // ---------- 😵 취약 어휘 ----------
  function viewWords() {
    var tv = $("#tv"); tv.innerHTML = '<div class="card center muted">불러오는 중…</div>';
    var bank = T.wbank || state.sel.bank || (state.banks[0] && state.banks[0].id);
    loadRoster().then(function () {
      var emails = null;
      if (T.grade || T.cls) emails = Object.keys(T.roster).filter(inClass);
      return WA.rpc("wa_word_top", { p_bank: bank, p_emails: emails, p_min: 3 });
    }).then(function (rows) {
      var b = WA.bank(bank), byW = {}; (b ? b.words : []).forEach(function (w) { byW[w.w] = w; });
      var lesson = T.wlesson || "";
      rows = (rows || []).filter(function (r) { return !lesson || (byW[r.word] && String(byW[r.word].l) === lesson); });
      tv.innerHTML = '<div class="card"><p class="small muted">학생들이 게임에서 처음에 틀린 비율이 높은 단어예요. 3번 이상 나온 단어만 보여요. (기간 필터 없음, 누적)</p>' + filters(false).replace('<select id="fr">', '<select id="fr" class="hidden">') +
        '<div class="filters"><select id="wb">' + state.banks.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === bank ? " selected" : "") + ">" + esc(x.name) + "</option>"; }).join("") + "</select>" +
        '<select id="wl"><option value="">전체 단원</option>' + WA.lessonsOf(b).map(function (x) { return '<option value="' + x.l + '"' + (lesson === String(x.l) ? " selected" : "") + ">" + x.l + "과</option>"; }).join("") + "</select>" +
        '<button class="btn sm" id="csv">⬇️ CSV</button></div>' +
        '<div class="tbl-wrap"><table class="tbl"><tr><th>#</th><th>단어</th><th>뜻</th><th>단원</th><th>틀린 비율</th><th>틀림/나옴</th><th>학생 수</th></tr>' +
        rows.map(function (r, k) { var it = byW[r.word] || {}; return "<tr><td>" + (k + 1) + "</td><td><b>" + esc(r.word) + "</b></td><td>" + esc(WA.ko(it)) + "</td><td>" + (it.l || "") + "</td><td><span class=\"bar\" style=\"width:" + Math.round(r.rate) + 'px"></span>' + r.rate + "%</td><td>" + r.wrong + " / " + r.tries + "</td><td>" + r.students + "</td></tr>"; }).join("") +
        "</table></div>" + (rows.length ? "" : '<p class="center muted">아직 자료가 충분하지 않아요.</p>') + "</div>";
      bindFilters(viewWords);
      $("#wb").onchange = function () { T.wbank = this.value; T.wlesson = ""; viewWords(); };
      $("#wl").onchange = function () { T.wlesson = this.value; viewWords(); };
      $("#csv").onclick = function () { csv("word-arcade-weak-words.csv", [["단어", "뜻", "단원", "틀린비율", "틀림", "나옴", "학생수"]].concat(rows.map(function (r) { var it = byW[r.word] || {}; return [r.word, WA.ko(it), it.l, r.rate, r.wrong, r.tries, r.students]; }))); };
    }).catch(function (e) { tv.innerHTML = '<div class="card err">' + esc(WA.errMsg(e)) + "</div>"; });
  }

  // ---------- 📚 단어장 ----------
  var COLS = { g: ["grade", "학년"], l: ["lesson", "단원", "과", "unit"], n: ["no.", "no", "번호"], w: ["words", "word", "단어", "영어"], ko: ["한글 뜻", "뜻", "meaning", "한국어 뜻"], def: ["영영풀이", "definition", "영영 풀이"], ex: ["예문", "example", "sentence"], exKo: ["예문 해석", "해석", "translation"] };
  function parseRows(rows) {
    var head = -1, map = {};
    for (var i = 0; i < Math.min(rows.length, 10) && head < 0; i++) {
      var r = rows[i].map(function (v) { return WA.low(v); });
      var m = {}; Object.keys(COLS).forEach(function (k) { var j = r.findIndex(function (c) { return COLS[k].indexOf(c) >= 0; }); if (j >= 0) m[k] = j; });
      if (m.w != null && m.ko != null) { head = i; map = m; }
    }
    if (head < 0) throw new Error("첫 줄에 words(단어), 한글 뜻 열 이름이 있어야 해요.");
    var out = [], warn = [];
    rows.slice(head + 1).forEach(function (r, k) {
      var get = function (key) { return map[key] == null ? "" : String(r[map[key]] == null ? "" : r[map[key]]).replace(/\s+/g, " ").trim(); };
      var w = get("w"); if (!w) return;
      var it = { g: +get("g") || 0, l: +get("l") || 1, n: +get("n") || out.length + 1, w: w, ko: get("ko"), def: get("def"), ex: get("ex"), exKo: get("exKo") };
      out.push(it);
      var line = head + k + 2;
      if (!it.def) warn.push(line + "행 " + w + ": 영영풀이 없음 (크로스워드·짝짓기 영영풀이에서 빠져요)");
      if (!it.ex) warn.push(line + "행 " + w + ": 예문 없음 (빈칸·어순·암호에서 빠져요)");
      else if (!WA.cloze(it)) warn.push(line + "행 " + w + ": 예문에서 단어를 못 찾음 (빈칸 스펠링에서 빠져요)");
    });
    var seen = {}; out.forEach(function (it) { if (seen[it.w]) warn.push(it.w + ": 같은 단어가 두 번 있어요"); seen[it.w] = 1; });
    return { words: out, warn: warn };
  }
  function viewBanks() {
    var tv = $("#tv");
    tv.innerHTML = '<div class="card"><h2>📚 단어장</h2><p class="small muted">기본 단어장(1·2학년)은 앱 안에 들어 있어요. 엑셀/CSV를 올리면 새 단어장이 생기고, <b>id</b>를 g1·g2 로 하면 기본 단어장을 바꿔요.</p>' +
      '<div class="tbl-wrap"><table class="tbl"><tr><th>id</th><th>이름</th><th>학년</th><th>단어</th><th>단원</th><th>상태</th><th></th></tr>' +
      state.banks.map(function (b) { return "<tr><td>" + esc(b.id) + "</td><td>" + esc(b.name) + "</td><td>" + (b.grade || "") + "</td><td>" + b.words.length + "</td><td>" + WA.lessonsOf(b).length + "</td><td>" + (b.builtin ? '<span class="pill">기본</span>' : b.active === false ? '<span class="pill bad">숨김</span>' : '<span class="pill ok">올림</span>') + "</td><td>" +
        '<button class="btn sm" data-dl="' + esc(b.id) + '">JSON</button> ' + (b.builtin ? "" : '<button class="btn sm" data-tg="' + esc(b.id) + '">' + (b.active === false ? "보이기" : "숨기기") + '</button> <button class="btn sm" data-del="' + esc(b.id) + '">삭제</button>') + "</td></tr>"; }).join("") + "</table></div></div>" +
      '<div class="card"><h2>⬆️ 단어장 올리기</h2><p class="small muted">열 이름: <b>grade · lesson · no. · words · 한글 뜻 · 영영풀이 · 예문 · 예문 해석</b> (지금 쓰는 출판사 엑셀 그대로 돼요). 첫 번째 시트를 읽어요.</p>' +
      '<input type="file" id="file" accept=".xlsx,.xls,.csv"><div id="draft"></div></div>';
    $$("[data-dl]").forEach(function (b) { b.onclick = function () { var x = WA.bank(b.dataset.dl); var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify({ id: x.id, name: x.name, grade: x.grade, words: x.words }, null, 1)], { type: "application/json" })); a.download = x.id + ".json"; a.click(); }; });
    $$("[data-tg]").forEach(function (b) { b.onclick = function () { var x = WA.bank(b.dataset.tg); WA.sel(WA.client().from("wa_banks").update({ active: x.active === false }).eq("id", x.id).select()).then(reloadBanks).catch(err); }; });
    $$("[data-del]").forEach(function (b) { b.onclick = function () { if (!confirm(b.dataset.del + " 단어장을 지울까요? (학생 기록은 남아요)")) return; WA.sel(WA.client().from("wa_banks").delete().eq("id", b.dataset.del).select()).then(reloadBanks).catch(err); }; });
    $("#file").onchange = function () {
      var f = this.files[0]; if (!f) return;
      loadXLSX().then(function () { return f.arrayBuffer(); }).then(function (buf) {
        var wb = XLSX.read(buf, { type: "array" }), ws = wb.Sheets[wb.SheetNames[0]];
        var res = parseRows(XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }));
        var g = res.words[0] && res.words[0].g;
        T.draft = res; showDraft(f.name.replace(/\.[^.]+$/, ""), g);
      }).catch(err);
    };
  }
  function showDraft(fname, grade) {
    var d = T.draft, b = { words: d.words };
    $("#draft").innerHTML = '<div style="margin-top:12px"><p><b>' + d.words.length + "개</b> 단어 · 단원별: " + WA.lessonsOf(b).map(function (x) { return x.l + "과 " + x.n; }).join(", ") + "</p>" +
      (d.warn.length ? '<details><summary class="err">확인할 것 ' + d.warn.length + "개</summary><ul class=\"small\">" + d.warn.slice(0, 80).map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul></details>" : '<p class="pill ok">문제없어요</p>') +
      '<div class="tbl-wrap" style="max-height:260px;margin:8px 0"><table class="tbl"><tr><th>과</th><th>단어</th><th>뜻</th><th>영영풀이</th><th>예문</th></tr>' + d.words.slice(0, 40).map(function (w) { return "<tr><td>" + w.l + "</td><td>" + esc(w.w) + "</td><td>" + esc(w.ko) + "</td><td>" + esc(w.def.slice(0, 40)) + "</td><td>" + esc(w.ex.slice(0, 40)) + "</td></tr>"; }).join("") + "</table></div>" +
      '<div class="filters"><label>id <input type="text" id="bid" value="' + (grade ? "g" + grade + "-" + new Date().getFullYear() : "custom-" + Date.now().toString(36)) + '" style="width:150px"></label>' +
      '<label>이름 <input type="text" id="bname" value="' + esc(grade ? grade + "학년 단어 (" + fname.slice(0, 20) + ")" : fname.slice(0, 30)) + '" style="width:240px"></label>' +
      '<label>학년 <input type="text" id="bgr" value="' + (grade || "") + '" style="width:60px"></label><button class="btn navy" id="bsave">저장</button></div></div>';
    $("#bsave").onclick = function () {
      var id = $("#bid").value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
      if (!id) return WA.toast("id 를 써 주세요 (영어 소문자·숫자·-)");
      if (WA.bank(id) && !confirm(id + " 단어장을 새 내용으로 바꿀까요?")) return;
      WA.sel(WA.client().from("wa_banks").upsert({ id: id, name: $("#bname").value.trim() || id, grade: +$("#bgr").value || null, words: d.words, active: true, updated_at: new Date().toISOString() }).select())
        .then(function () { T.draft = null; WA.toast("저장했어요"); return reloadBanks(); }).catch(err);
    };
  }
  function reloadBanks() { return WA.loadBanks().then(viewBanks); }
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve();
    return new Promise(function (ok, no) { var s = document.createElement("script"); s.src = XLSX_URL; s.onload = ok; s.onerror = function () { no(new Error("엑셀 읽기 도구를 불러오지 못했어요")); }; document.head.appendChild(s); });
  }
  function err(e) { WA.toast(WA.errMsg(e)); console.warn(e); }

  // ---------- ⚙️ 설정 ----------
  function viewSettings() {
    var s = state.settings, on = function (v) { return v === true || v === "true"; };
    $("#tv").innerHTML = '<div class="card"><h2>⚙️ 설정</h2>' +
      sw("open", "기록 저장 열기", "끄면 학생은 연습만 하고 점수가 저장되지 않아요.", on(s.open)) +
      sw("allow_external", "학교 밖 계정 허용", "켜면 @smy.ms.kr 이 아닌 구글 계정도 쓸 수 있어요. (기본: 끔)", on(s.allow_external)) +
      '<p class="small muted" style="margin-top:12px">관리자: tfellow@gmail.com · tfellow@smy.ms.kr · engwords@smy.ms.kr · hist1026@gmail.com (다른 앱과 같은 is_admin 목록)</p>' +
      '<h3 style="margin-top:14px">🧹 기록 지우기</h3><p class="small muted">시험 삼아 한 기록을 지울 때 써요. 되돌릴 수 없어요.</p><div class="filters"><input type="text" id="delE" placeholder="학생 이메일" style="width:260px"><button class="btn red sm" id="delB">이 학생 기록 모두 지우기</button></div></div>';
    $$("[data-sw]").forEach(function (el) { el.onchange = function () {
      var k = el.dataset.sw, v = el.checked;
      WA.sel(WA.client().from("wa_settings").upsert({ key: k, value: v, updated_at: new Date().toISOString() }).select()).then(function () { s[k] = v; WA.toast("저장했어요"); }).catch(err);
    }; });
    $("#delB").onclick = function () {
      var e = WA.low($("#delE").value); if (!e) return;
      if (!confirm(e + " 의 게임 기록과 오답 기록을 모두 지울까요? 되돌릴 수 없어요.")) return;
      Promise.all([WA.sel(WA.client().from("wa_plays").delete().eq("email", e).select("id")), WA.sel(WA.client().from("wa_wordstat").delete().eq("email", e).select("word"))])
        .then(function (r) { T.plays = null; WA.toast("지웠어요: 게임 " + r[0].length + "판, 단어 " + r[1].length + "개"); }).catch(err);
    };
  }
  function sw(k, t, d, v) { return '<label class="sw"><div><b>' + t + '</b><div class="small muted">' + d + '</div></div><input type="checkbox" data-sw="' + k + '"' + (v ? " checked" : "") + "></label>"; }
})();
