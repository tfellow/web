/* MY Grammar 공통 코드: 도우미, 레벨·배지 정의, 데이터 연결(Supabase / 체험 모드), 인증서 그리기 */
(function () {
  "use strict";
  var C = window.MG_CONFIG;
  var MG = (window.MG = {});

  /* ---------- 도우미 ---------- */
  MG.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  // **굵게** 와 줄바꿈만 허용하는 아주 작은 서식
  MG.rich = function (s) {
    return MG.esc(s).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\n/g, "<br>");
  };
  MG.$ = function (sel, root) { return (root || document).querySelector(sel); };
  MG.$$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  MG.shuffle = function (a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  };
  MG.kstDate = function (d) { return new Date((d ? new Date(d) : new Date()).getTime() + 9 * 3600e3).toISOString().slice(0, 10); };
  MG.kstTime = function (d) { var s = new Date(new Date(d).getTime() + 9 * 3600e3).toISOString(); return s.slice(5, 10).replace("-", "/") + " " + s.slice(11, 16); };
  MG.pct = function (a, b) { return b ? Math.round((a / b) * 100) : 0; };
  MG.toast = function (msg, kind) {
    var t = document.createElement("div");
    t.className = "toast " + (kind || "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add("out"); }, 2200);
    setTimeout(function () { t.remove(); }, 2700);
  };
  MG.confetti = function (n) {
    var colors = ["#f2b632", "#6c4ce0", "#ef6f8f", "#2fb39a", "#4a8ef0"];
    for (var i = 0; i < (n || 60); i++) {
      var c = document.createElement("i");
      c.className = "confetti";
      c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * 0.7 + "s";
      c.style.transform = "rotate(" + Math.random() * 360 + "deg)";
      document.body.appendChild(c);
      setTimeout(function (el) { el.remove(); }.bind(null, c), 3600);
    }
  };
  MG.modal = function (html, opts) {
    opts = opts || {};
    var ov = document.createElement("div");
    ov.className = "overlay";
    ov.innerHTML = '<div class="sheet ' + (opts.wide ? "wide" : "") + '" role="dialog" aria-modal="true">' +
      (opts.noClose ? "" : '<button class="x" aria-label="닫기">✕</button>') + html + "</div>";
    document.body.appendChild(ov);
    function close() { ov.remove(); if (opts.onClose) opts.onClose(); }
    if (!opts.noClose) {
      ov.querySelector(".x").onclick = close;
      ov.addEventListener("click", function (e) { if (e.target === ov) close(); });
    }
    ov.close = close;
    return ov;
  };
  MG.mascot = function (cls) {
    return C.MASCOT ? '<img class="mascot ' + (cls || "") + '" src="' + MG.esc(C.MASCOT) + '" alt="">' : '<span class="mascot emoji ' + (cls || "") + '" aria-hidden="true">👑</span>';
  };
  MG.speak = function (text) {
    try {
      if (!window.speechSynthesis) return MG.toast("이 기기에서는 읽어 주기를 쓸 수 없어요.");
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US"; u.rate = 0.9;
      speechSynthesis.speak(u);
    } catch (e) {}
  };
  MG.download = function (name, text, type) {
    var blob = new Blob(["﻿" + text], { type: type || "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  };
  MG.csv = function (rows) {
    return rows.map(function (r) {
      return r.map(function (v) { v = v == null ? "" : String(v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(",");
    }).join("\r\n");
  };

  /* ---------- 레벨 · 배지 ---------- */
  MG.levelOf = function (xp) { return Math.max(1, Math.floor((1 + Math.sqrt(1 + (4 * Math.max(xp || 0, 0)) / 50)) / 2)); };
  MG.xpFor = function (lv) { return 50 * lv * (lv - 1); };
  MG.TITLES = [
    { min: 1, em: "🌱", en: "Grammar Seed", ko: "문법 씨앗" },
    { min: 3, em: "🌿", en: "Grammar Sprout", ko: "문법 새싹" },
    { min: 5, em: "🧭", en: "Grammar Explorer", ko: "문법 탐험가" },
    { min: 7, em: "💎", en: "Grammar Expert", ko: "문법 전문가" },
    { min: 10, em: "🏆", en: "Grammar Master", ko: "문법 마스터" },
    { min: 15, em: "👑", en: "Grammar Queen", ko: "문법 퀸" }
  ];
  MG.titleOf = function (lv) {
    var t = MG.TITLES[0];
    MG.TITLES.forEach(function (x) { if (lv >= x.min) t = x; });
    return t;
  };
  MG.levelInfo = function (xp) {
    var lv = MG.levelOf(xp), lo = MG.xpFor(lv), hi = MG.xpFor(lv + 1);
    return { lv: lv, title: MG.titleOf(lv), into: xp - lo, need: hi - lo, toNext: hi - xp, pct: Math.round(((xp - lo) / (hi - lo)) * 100) };
  };
  MG.BADGES = [
    { code: "first", em: "🎯", name: "첫 정답", desc: "처음으로 문제를 맞혔어요" },
    { code: "right50", em: "✏️", name: "50문제 정복", desc: "정답 50개" },
    { code: "right200", em: "📚", name: "200문제 정복", desc: "정답 200개" },
    { code: "right500", em: "🧠", name: "500문제 정복", desc: "정답 500개" },
    { code: "right1000", em: "🏅", name: "1000문제 전설", desc: "정답 1000개" },
    { code: "streak3", em: "🔥", name: "3일 연속", desc: "3일 연속 공부" },
    { code: "streak7", em: "☄️", name: "7일 연속", desc: "일주일 연속 공부" },
    { code: "streak30", em: "🌋", name: "30일 연속", desc: "한 달 연속 공부" },
    { code: "combo10", em: "⚡", name: "10 콤보", desc: "연속 10문제 정답" },
    { code: "combo25", em: "🌩️", name: "25 콤보", desc: "연속 25문제 정답" },
    { code: "review20", em: "🔁", name: "복습러", desc: "복습 문제 20개 정답" },
    { code: "review100", em: "♻️", name: "복습 장인", desc: "복습 문제 100개 정답" },
    { code: "goal1", em: "✅", name: "오늘 목표 달성", desc: "하루 목표를 처음 채웠어요" },
    { code: "goal10", em: "📅", name: "목표 10일", desc: "하루 목표를 10일 채웠어요" },
    { code: "stamp1", em: "🏷️", name: "첫 스탬프", desc: "단원 하나를 마스터" },
    { code: "stamp5", em: "🗂️", name: "스탬프 5개", desc: "단원 5개 마스터" },
    { code: "stamp10", em: "🏆", name: "스탬프 10개", desc: "단원 10개 마스터" },
    { code: "early", em: "🌅", name: "아침형 학습자", desc: "아침 5~8시에 공부" }
  ];
  MG.badge = function (code) { return MG.BADGES.filter(function (b) { return b.code === code; })[0] || { code: code, em: "🎖️", name: code, desc: "" }; };
  MG.QTYPES = { mc: "객관식", ox: "O / X", blank: "빈칸 채우기", order: "단어 배열", error: "틀린 곳 찾기" };
  MG.GRADES = { 1: "중1", 2: "중2", 3: "중3", 4: "고등·수능" };
  MG.GRADE_DESC = { 1: "기초 영문법 체계", 2: "구조 확장 및 문법 심화", 3: "고등 내신 연계 및 완성", 4: "고등학교 · 모의고사 · 수능 핵심 어법" };
  MG.MODES = { topic: "단원 학습", review: "복습", mix: "섞어 풀기", time: "타임어택" };

  /* ---------- 답 비교 (서버와 같은 규칙) ---------- */
  MG.norm = function (s) {
    return String(s == null ? "" : s).replace(/[’‘]/g, "'").replace(/[“”]/g, '"').toLowerCase().trim().replace(/\s+/g, " ").replace(/\s*[.?!]+$/, "");
  };
  MG.check = function (type, answer, given) {
    if (type === "ox") return String(given).trim().charAt(0).toUpperCase() === String(answer).trim().charAt(0).toUpperCase();
    return String(answer).split("|").some(function (a) { return MG.norm(a) === MG.norm(given); });
  };
  // error 문제: "She [go] to [school]." → 조각 목록
  MG.parseError = function (prompt) {
    var parts = [], re = /\[([^\]]+)\]/g, last = 0, m;
    while ((m = re.exec(prompt))) {
      if (m.index > last) parts.push({ t: prompt.slice(last, m.index) });
      parts.push({ t: m[1], pick: true });
      last = re.lastIndex;
    }
    if (last < prompt.length) parts.push({ t: prompt.slice(last) });
    return parts;
  };

  /* ---------- 데이터 연결 ---------- */
  var params = new URLSearchParams(location.search);
  MG.DEMO = params.has("demo") || !window.supabase;

  function rpcErr(r) {
    if (r.error) {
      var m = r.error.message || String(r.error);
      if (/NOT_ALLOWED/.test(m)) m = "학교 계정(@" + C.SCHOOL_DOMAIN + ")으로 로그인해 주세요.";
      throw new Error(m);
    }
    return r.data;
  }
  async function fetchAll(build) {
    var out = [], from = 0, size = 1000;
    for (;;) {
      var r = await build().range(from, from + size - 1);
      var d = rpcErr(r) || [];
      out = out.concat(d);
      if (d.length < size) return out;
      from += size;
    }
  }

  function SupaApi() {
    var sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_KEY);
    this.sb = sb;
    this.session = async function () { var s = await sb.auth.getSession(); return s.data && s.data.session; };
    this.signInGoogle = async function (credential) { return rpcErr(await sb.auth.signInWithIdToken({ provider: "google", token: credential })); };
    this.signOut = async function () { await sb.auth.signOut(); };
    this.me = async function () { return rpcErr(await sb.rpc("mg_me")); };
    this.setProfile = async function (nick, g, c, n) { return rpcErr(await sb.rpc("mg_set_profile", { p_nick: nick, p_grade: g, p_class: c, p_no: n })); };
    this.topics = async function () { return rpcErr(await sb.from("mg_topics_public").select("*").order("grade").order("sort_order").order("code")); };
    this.questions = async function (topic) {
      return fetchAll(function () { var q = sb.from("mg_questions_public").select("*").order("id"); return topic ? q.eq("topic_code", topic) : q; });
    };
    this.questionsByIds = async function (ids) {
      if (!ids.length) return [];
      return rpcErr(await sb.from("mg_questions_public").select("*").in("id", ids.slice(0, 200)));
    };
    this.submit = async function (qid, ans, mode) { return rpcErr(await sb.rpc("mg_submit", { p_qid: qid, p_answer: ans, p_mode: mode })); };
    this.myProgress = async function (uid) { return fetchAll(function () { return sb.from("mg_progress").select("*").eq("user_id", uid); }); };
    this.myStamps = async function (uid) { return rpcErr(await sb.from("mg_stamps").select("*").eq("user_id", uid)); };
    this.myBadges = async function (uid) { return rpcErr(await sb.from("mg_badges").select("*").eq("user_id", uid)); };
    this.myCerts = async function (uid) { return rpcErr(await sb.from("mg_certs").select("*").eq("user_id", uid).order("issued_at")); };
    this.myAttempts = async function (uid, days) {
      var since = new Date(Date.now() - days * 864e5).toISOString();
      return fetchAll(function () { return sb.from("mg_attempts").select("question_id,topic_code,is_correct,xp,mode,created_at").eq("user_id", uid).gte("created_at", since).order("created_at"); });
    };
    this.leaderboard = async function (period, grade) { return rpcErr(await sb.rpc("mg_leaderboard", { p_period: period, p_grade: grade || null })); };
    this.classBoard = async function (period) { return rpcErr(await sb.rpc("mg_class_board", { p_period: period })); };
    // 교사용
    this.admin = {
      players: function () { return fetchAll(function () { return sb.from("mg_players").select("*").order("grade").order("class_no").order("student_no"); }); },
      byStudent: async function (f, t) { return rpcErr(await sb.rpc("mg_admin_by_student", { p_from: f, p_to: t })); },
      byQuestion: async function (f, t) { return rpcErr(await sb.rpc("mg_admin_by_question", { p_from: f, p_to: t })); },
      byDay: async function (f, t) { return rpcErr(await sb.rpc("mg_admin_by_day", { p_from: f, p_to: t })); },
      studentTopics: async function (uid) { return rpcErr(await sb.rpc("mg_admin_student_topics", { p_user: uid })); },
      recentAttempts: async function (uid) { return rpcErr(await sb.from("mg_attempts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(40)); },
      table: function (name, order) { return fetchAll(function () { var q = sb.from(name).select("*"); return order ? q.order(order) : q; }); },
      topics: function () { return fetchAll(function () { return sb.from("mg_topics").select("*").order("grade").order("sort_order").order("code"); }); },
      questions: function () { return fetchAll(function () { return sb.from("mg_questions").select("*").order("id"); }); },
      insertQuestions: async function (rows) { return rpcErr(await sb.from("mg_questions").insert(rows).select("id")); },
      upsertQuestions: async function (rows) { return rpcErr(await sb.from("mg_questions").upsert(rows).select("id")); },
      updateQuestion: async function (id, patch) { return rpcErr(await sb.from("mg_questions").update(patch).eq("id", id)); },
      deleteQuestion: async function (id) { return rpcErr(await sb.from("mg_questions").delete().eq("id", id)); },
      upsertTopics: async function (rows) { return rpcErr(await sb.from("mg_topics").upsert(rows, { onConflict: "code" })); },
      updateTopic: async function (code, patch) { return rpcErr(await sb.from("mg_topics").update(patch).eq("code", code)); },
      deleteTopic: async function (code) { return rpcErr(await sb.from("mg_topics").delete().eq("code", code)); },
      updatePlayer: async function (id, patch) { return rpcErr(await sb.from("mg_players").update(patch).eq("id", id)); },
      settings: async function () { var d = rpcErr(await sb.from("mg_settings").select("*")); var o = {}; d.forEach(function (r) { o[r.key] = r.value; }); return o; },
      setSetting: async function (k, v) { return rpcErr(await sb.from("mg_settings").upsert({ key: k, value: v })); },
      admins: async function () { return rpcErr(await sb.from("mg_admins").select("*").order("email")); },
      addAdmin: async function (e) { return rpcErr(await sb.from("mg_admins").insert({ email: e.toLowerCase().trim() })); },
      removeAdmin: async function (e) { return rpcErr(await sb.from("mg_admins").delete().eq("email", e)); }
    };
  }

  /* ---------- 체험(데모) 모드: 이 기기 브라우저에만 저장 ---------- */
  var DKEY = "mg_demo_v2";
  function DemoApi() {
    var self = this, db;
    function save() { try { localStorage.setItem(DKEY, JSON.stringify(db)); } catch (e) {} }
    function load() {
      try { db = JSON.parse(localStorage.getItem(DKEY) || "null"); } catch (e) { db = null; }
      if (!db) { db = seed(); save(); }
    }
    function seed() {
      var S = window.MG_SAMPLE, d = {
        settings: { allow_external: "false", school_domain: C.SCHOOL_DOMAIN, daily_goal: "20", notice: "체험 모드예요. 기록은 이 기기에만 저장돼요." },
        admins: [{ email: "tfellow@gmail.com" }, { email: "tfellow@smy.ms.kr" }, { email: "demo@smy.ms.kr" }],
        players: [], attempts: [], progress: [], stamps: [], badges: [], certs: [], seq: { q: 0, a: 0, c: 0 }, loggedIn: false
      };
      d.topics = S.topics.map(function (t, i) { return Object.assign({ id: i + 1, active: true, created_at: new Date().toISOString() }, t); });
      d.questions = S.questions.map(function (q, i) {
        return { id: i + 1, topic_code: q.t, qtype: q.y, prompt: q.p, choices: q.c || null, answer: q.a, explanation: q.e, difficulty: q.d || 2, source: "MY Grammar 샘플", active: true, created_at: new Date().toISOString() };
      });
      d.seq.q = d.questions.length;
      db = d;
      // 가상의 반 친구들
      var nicks = ["별빛소녀", "문법요정", "QueenB", "민트초코", "해피바이러스", "영어천재", "코코넛", "달빛토끼", "Sunny", "구름빵", "레몬캔디", "피치", "Luna", "도토리", "체리블라썸", "하늘", "Mango", "토끼발"];
      var names = ["김서연", "이지우", "박하은", "최수아", "정민서", "강예린", "조윤아", "윤지민", "장서윤", "임하린", "한소율", "오채원", "서다인", "신유나", "권나연", "황시은", "안지아", "송예나"];
      nicks.forEach(function (n, i) {
        var id = "demo-" + i;
        d.players.push(newPlayer(id, "s" + (20260100 + i) + "@" + C.SCHOOL_DOMAIN, names[i], n, i < 12 ? 2 : 1, (i % 3) + 1, Math.floor(i / 3) + 1));
        var skill = 0.45 + Math.random() * 0.45, days = 3 + Math.floor(Math.random() * 12);
        for (var k = days; k >= 1; k--) {
          if (Math.random() < 0.3) continue;
          var n2 = 5 + Math.floor(Math.random() * 20);
          for (var j = 0; j < n2; j++) {
            var q = d.questions[Math.floor(Math.random() * d.questions.length)];
            var ok = Math.random() < skill * (q.difficulty === 3 ? 0.75 : 1);
            var when = new Date(Date.now() - k * 864e5 + j * 60e3);
            submitAs(id, q.id, ok ? q.answer.split("|")[0] : wrongOf(q), Math.random() < 0.2 ? "review" : "topic", when);
          }
        }
      });
      return d;
    }
    function wrongOf(q) {
      if (q.qtype === "ox") return q.answer === "O" ? "X" : "O";
      if (q.choices) { var w = q.choices.filter(function (c) { return c !== q.answer; }); return w[Math.floor(Math.random() * w.length)]; }
      if (q.qtype === "error") { var p = MG.parseError(q.prompt).filter(function (x) { return x.pick && x.t !== q.answer; }); return p.length ? p[0].t : "x"; }
      return "wrong";
    }
    function newPlayer(id, email, name, nick, g, c, n) {
      return { id: id, email: email, real_name: name, nickname: nick, grade: g, class_no: c, student_no: n, is_school: true, xp: 0, combo: 0, combo_best: 0, streak: 0, best_streak: 0, last_day: null, today_count: 0, goal_days: 0, created_at: new Date().toISOString(), last_at: null };
    }
    function player(id) { return db.players.filter(function (p) { return p.id === id; })[0]; }
    function isAdminEmail(e) { return db.admins.some(function (a) { return a.email === e; }); }
    function since(period) {
      var now = new Date(Date.now() + 9 * 3600e3);
      if (period === "week") { var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.getTime() - 9 * 3600e3; }
      if (period === "month") return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1) - 9 * 3600e3;
      return 0;
    }
    function submitAs(uid, qid, given, mode, when) {
      when = when || new Date();
      var p = player(uid), q = db.questions.filter(function (x) { return x.id === qid; })[0];
      var ok = MG.check(q.qtype, q.answer, given), today = MG.kstDate(when), goal = parseInt(db.settings.daily_goal, 10) || 20;
      var pr = db.progress.filter(function (x) { return x.user_id === uid && x.question_id === qid; })[0];
      var goalHit = false, xp;
      if (p.last_day !== today) {
        var y = MG.kstDate(new Date(when.getTime() - 864e5));
        p.streak = p.last_day === y ? p.streak + 1 : 1; p.today_count = 0; p.last_day = today;
      }
      p.today_count++;
      if (p.today_count === goal) { goalHit = true; p.goal_days++; }
      p.best_streak = Math.max(p.best_streak, p.streak);
      if (ok) {
        p.combo++; p.combo_best = Math.max(p.combo_best, p.combo);
        xp = 8 + q.difficulty * 2;
        if (pr && pr.right_n >= 2 && mode !== "review") xp = 3;
        if (mode === "review" && pr && pr.wrong_n > 0) xp += 5;
        xp += p.combo >= 10 ? 5 : p.combo >= 5 ? 3 : p.combo >= 3 ? 1 : 0;
      } else { p.combo = 0; xp = 1; }
      if (goalHit) xp += 30;
      var oldLv = MG.levelOf(p.xp);
      p.xp += xp; p.last_at = when.toISOString();
      var lv = MG.levelOf(p.xp);
      db.attempts.push({ id: ++db.seq.a, user_id: uid, question_id: qid, topic_code: q.topic_code, answer: String(given).slice(0, 300), is_correct: ok, mode: mode, xp: xp, created_at: when.toISOString() });
      var box = ok ? Math.min((pr ? pr.box : 0) + 1, 5) : 0, iv = [0, 1, 3, 7, 14, 30][box];
      if (!pr) { pr = { user_id: uid, question_id: qid, box: 0, right_n: 0, wrong_n: 0 }; db.progress.push(pr); }
      pr.box = box; pr.due_at = new Date(when.getTime() + iv * 864e5).toISOString(); pr.last_at = when.toISOString();
      if (ok) pr.right_n++; else pr.wrong_n++;
      var stamp = null, mine = function (arr) { return arr.filter(function (x) { return x.user_id === uid; }); };
      if (ok && !mine(db.stamps).some(function (s) { return s.topic_code === q.topic_code; })) {
        var tq = db.questions.filter(function (x) { return x.topic_code === q.topic_code && x.active; });
        var done = tq.filter(function (x) { return db.progress.some(function (g) { return g.user_id === uid && g.question_id === x.id && g.right_n > 0; }); }).length;
        if (tq.length >= 3 && done >= Math.ceil(tq.length * 0.8)) { db.stamps.push({ user_id: uid, topic_code: q.topic_code, earned_at: when.toISOString() }); stamp = q.topic_code; }
      }
      var att = mine(db.attempts), right = att.filter(function (a) { return a.is_correct; }).length;
      var rev = att.filter(function (a) { return a.is_correct && a.mode === "review"; }).length, sn = mine(db.stamps).length;
      var tn = db.topics.filter(function (t) { return t.active && db.questions.some(function (x) { return x.topic_code === t.code && x.active; }); }).length;
      var hour = new Date(when.getTime() + 9 * 3600e3).getUTCHours();
      var cand = [right >= 1 && "first", right >= 50 && "right50", right >= 200 && "right200", right >= 500 && "right500", right >= 1000 && "right1000",
        p.streak >= 3 && "streak3", p.streak >= 7 && "streak7", p.streak >= 30 && "streak30", p.combo >= 10 && "combo10", p.combo >= 25 && "combo25",
        rev >= 20 && "review20", rev >= 100 && "review100", p.goal_days >= 1 && "goal1", p.goal_days >= 10 && "goal10",
        sn >= 1 && "stamp1", sn >= 5 && "stamp5", sn >= 10 && "stamp10", hour >= 5 && hour <= 7 && "early"];
      var newB = [];
      cand.forEach(function (b) { if (b && !mine(db.badges).some(function (x) { return x.code === b; })) { db.badges.push({ user_id: uid, code: b, earned_at: when.toISOString() }); newB.push(b); } });
      var certs = [];
      [["level5", lv >= 5, "Level 5 달성 인증서", "Grammar Explorer · Lv.5"], ["level10", lv >= 10, "Level 10 달성 인증서", "Grammar Master · Lv.10"],
        ["level15", lv >= 15, "Level 15 달성 인증서", "Grammar Queen · Lv.15"], ["stamp5", sn >= 5, "문법 스탬프 5개 인증서", "문법 단원 5개 마스터"],
        ["stamp10", sn >= 10, "문법 스탬프 10개 인증서", "문법 단원 10개 마스터"], ["stampall", tn >= 5 && sn >= tn, "전 단원 완주 인증서", "모든 문법 단원 마스터"],
        ["streak30", p.streak >= 30, "30일 연속 학습 인증서", "30일 동안 하루도 빠짐없이 공부"]].forEach(function (c) {
        if (c[1] && !mine(db.certs).some(function (x) { return x.kind === c[0]; })) {
          var id = ++db.seq.c, cert = { id: id, user_id: uid, kind: c[0], title: c[2], detail: c[3], serial: "MYG-" + today.slice(0, 7).replace("-", "") + "-" + String(id).padStart(5, "0"), issued_at: when.toISOString() };
          db.certs.push(cert); certs.push(cert);
        }
      });
      return { correct: ok, answer: q.answer, explanation: q.explanation, xp: xp, total_xp: p.xp, old_level: oldLv, level: lv, combo: p.combo, streak: p.streak, today_count: p.today_count, goal_hit: goalHit, box: box, stamp: stamp, badges: newB, certs: certs };
    }
    function pubQ(q) {
      var ch = q.choices;
      if (q.qtype === "order") ch = MG.shuffle(q.answer.trim().split(/\s+/));
      return { id: q.id, topic_code: q.topic_code, qtype: q.qtype, prompt: q.prompt, choices: ch, difficulty: q.difficulty };
    }
    function activeQ() {
      var act = {}; db.topics.forEach(function (t) { if (t.active) act[t.code] = 1; });
      return db.questions.filter(function (q) { return q.active && act[q.topic_code]; });
    }
    function inRange(a, f, t) { var x = new Date(a.created_at).getTime(); return x >= new Date(f).getTime() && x < new Date(t).getTime(); }
    function group(arr, key) { var o = {}; arr.forEach(function (a) { var k = key(a); (o[k] = o[k] || []).push(a); }); return o; }
    function wait(v) { return new Promise(function (r) { setTimeout(function () { r(JSON.parse(JSON.stringify(v === undefined ? null : v))); }, 60); }); }
    var ME = "demo-me";
    load();

    this.isDemo = true;
    this.session = async function () { return db.loggedIn ? { user: { id: ME, email: "demo@" + C.SCHOOL_DOMAIN } } : null; };
    this.signInDemo = async function () { db.loggedIn = true; save(); };
    this.signOut = async function () { db.loggedIn = false; save(); };
    this.reset = function () { localStorage.removeItem(DKEY); };
    this.me = async function () {
      var p = player(ME);
      if (!p) { p = newPlayer(ME, "demo@" + C.SCHOOL_DOMAIN, "체험 학생", null, null, null, null); db.players.push(p); save(); }
      return wait({ allowed: true, is_admin: true, player: p, daily_goal: parseInt(db.settings.daily_goal, 10) || 20, notice: db.settings.notice, today: MG.kstDate() });
    };
    this.setProfile = async function (nick, g, c, n) {
      nick = String(nick || "").trim();
      if (nick.length < 2 || nick.length > 12) throw new Error("닉네임은 2~12글자로 정해 주세요.");
      if (db.players.some(function (p) { return p.id !== ME && (p.nickname || "").toLowerCase() === nick.toLowerCase(); })) throw new Error("이미 다른 친구가 쓰는 닉네임이에요.");
      var p = player(ME); p.nickname = nick; p.grade = g; p.class_no = c; p.student_no = n; save();
      return wait(p);
    };
    this.topics = async function () {
      var aq = activeQ();
      return wait(db.topics.filter(function (t) { return t.active; }).map(function (t) {
        return Object.assign({}, t, { q_count: aq.filter(function (q) { return q.topic_code === t.code; }).length });
      }).sort(function (a, b) { return a.grade - b.grade || a.sort_order - b.sort_order; }));
    };
    this.questions = async function (topic) { return wait(activeQ().filter(function (q) { return !topic || q.topic_code === topic; }).map(pubQ)); };
    this.questionsByIds = async function (ids) { return wait(activeQ().filter(function (q) { return ids.indexOf(q.id) >= 0; }).map(pubQ)); };
    this.submit = async function (qid, ans, mode) { var r = submitAs(ME, qid, ans, mode); save(); return wait(r); };
    this.myProgress = async function () { return wait(db.progress.filter(function (x) { return x.user_id === ME; })); };
    this.myStamps = async function () { return wait(db.stamps.filter(function (x) { return x.user_id === ME; })); };
    this.myBadges = async function () { return wait(db.badges.filter(function (x) { return x.user_id === ME; })); };
    this.myCerts = async function () { return wait(db.certs.filter(function (x) { return x.user_id === ME; })); };
    this.myAttempts = async function (uid, days) {
      var s = Date.now() - days * 864e5;
      return wait(db.attempts.filter(function (a) { return a.user_id === ME && new Date(a.created_at).getTime() >= s; }));
    };
    this.leaderboard = async function (period, grade) {
      var s = since(period);
      var rows = db.players.filter(function (p) { return p.nickname && p.is_school && (!grade || p.grade === grade); }).map(function (p) {
        var px = period === "all" ? p.xp : db.attempts.filter(function (a) { return a.user_id === p.id && new Date(a.created_at).getTime() >= s; }).reduce(function (n, a) { return n + a.xp; }, 0);
        return { nickname: p.nickname, grade: p.grade, class_no: p.class_no, xp: px, level: MG.levelOf(p.xp), is_me: p.id === ME };
      }).filter(function (r) { return r.xp > 0; }).sort(function (a, b) { return b.xp - a.xp; });
      return wait(rows.slice(0, 50));
    };
    this.classBoard = async function (period) {
      var s = since(period), me = player(ME) || {};
      var g = group(db.players.filter(function (p) { return p.is_school && p.grade && p.class_no; }), function (p) { return p.grade + "-" + p.class_no; });
      return wait(Object.keys(g).map(function (k) {
        var ps = g[k], ids = ps.map(function (p) { return p.id; });
        var at = db.attempts.filter(function (a) { return ids.indexOf(a.user_id) >= 0 && new Date(a.created_at).getTime() >= s; });
        var xp = at.reduce(function (n, a) { return n + a.xp; }, 0), act = {};
        at.forEach(function (a) { act[a.user_id] = 1; });
        return { grade: ps[0].grade, class_no: ps[0].class_no, members: ps.length, active: Object.keys(act).length, xp: xp, avg_xp: Math.round((xp / ps.length) * 10) / 10, is_mine: me.grade === ps[0].grade && me.class_no === ps[0].class_no };
      }).sort(function (a, b) { return b.avg_xp - a.avg_xp; }));
    };
    this.admin = {
      players: function () { return wait(db.players); },
      byStudent: function (f, t) {
        var g = group(db.attempts.filter(function (a) { return inRange(a, f, t); }), function (a) { return a.user_id; });
        return wait(Object.keys(g).map(function (k) {
          var a = g[k], days = {};
          a.forEach(function (x) { days[MG.kstDate(x.created_at)] = 1; });
          return { user_id: k, attempts: a.length, correct: a.filter(function (x) { return x.is_correct; }).length, xp: a.reduce(function (n, x) { return n + x.xp; }, 0), days: Object.keys(days).length, last_at: a[a.length - 1].created_at };
        }));
      },
      byQuestion: function (f, t) {
        var g = group(db.attempts.filter(function (a) { return inRange(a, f, t); }), function (a) { return a.question_id; });
        return wait(Object.keys(g).map(function (k) {
          var a = g[k], u = {}, w = {};
          a.forEach(function (x) { u[x.user_id] = 1; if (!x.is_correct) w[x.answer] = (w[x.answer] || 0) + 1; });
          var top = Object.keys(w).sort(function (x, y) { return w[y] - w[x]; })[0] || null;
          return { question_id: +k, attempts: a.length, correct: a.filter(function (x) { return x.is_correct; }).length, users: Object.keys(u).length, top_wrong: top };
        }));
      },
      byDay: function (f, t) {
        var g = group(db.attempts.filter(function (a) { return inRange(a, f, t); }), function (a) { return MG.kstDate(a.created_at); });
        return wait(Object.keys(g).sort().map(function (k) {
          var a = g[k], u = {};
          a.forEach(function (x) { u[x.user_id] = 1; });
          return { day: k, attempts: a.length, correct: a.filter(function (x) { return x.is_correct; }).length, users: Object.keys(u).length };
        }));
      },
      studentTopics: function (uid) {
        var g = group(db.attempts.filter(function (a) { return a.user_id === uid; }), function (a) { return a.topic_code; });
        return wait(Object.keys(g).map(function (k) { var a = g[k]; return { topic_code: k, attempts: a.length, correct: a.filter(function (x) { return x.is_correct; }).length, last_at: a[a.length - 1].created_at }; }));
      },
      recentAttempts: function (uid) { return wait(db.attempts.filter(function (a) { return a.user_id === uid; }).slice(-40).reverse()); },
      table: function (name) { return wait(db[name.replace(/^mg_/, "")] || []); },
      topics: function () { return wait(db.topics.slice().sort(function (a, b) { return (a.grade || 9) - (b.grade || 9) || a.sort_order - b.sort_order; })); },
      questions: function () { return wait(db.questions); },
      insertQuestions: function (rows) {
        var ids = rows.map(function (r) { var q = Object.assign({ active: true, difficulty: 2, created_at: new Date().toISOString() }, r, { id: ++db.seq.q }); db.questions.push(q); return { id: q.id }; });
        save(); return wait(ids);
      },
      upsertQuestions: function (rows) {
        var out = rows.map(function (r) {
          var ex = r.id && db.questions.filter(function (q) { return q.id === r.id; })[0];
          if (ex) { Object.assign(ex, r); return { id: ex.id }; }
          var q = Object.assign({ active: true, difficulty: 2, created_at: new Date().toISOString() }, r, { id: ++db.seq.q }); db.questions.push(q); return { id: q.id };
        });
        save(); return wait(out);
      },
      updateQuestion: function (id, patch) { db.questions.forEach(function (q) { if (q.id === id) Object.assign(q, patch); }); save(); return wait(null); },
      deleteQuestion: function (id) { db.questions = db.questions.filter(function (q) { return q.id !== id; }); save(); return wait(null); },
      upsertTopics: function (rows) {
        rows.forEach(function (r) {
          var ex = db.topics.filter(function (t) { return t.code === r.code; })[0];
          if (ex) Object.assign(ex, r); else db.topics.push(Object.assign({ id: db.topics.length + 1, active: true, sort_order: 0 }, r));
        });
        save(); return wait(null);
      },
      updateTopic: function (code, patch) {
        db.topics.forEach(function (t) { if (t.code === code) Object.assign(t, patch); });
        if (patch.code && patch.code !== code) db.questions.forEach(function (q) { if (q.topic_code === code) q.topic_code = patch.code; });
        save(); return wait(null);
      },
      deleteTopic: function (code) {
        if (db.questions.some(function (q) { return q.topic_code === code; })) return Promise.reject(new Error("이 단원에 문제가 있어서 삭제할 수 없어요. 먼저 '숨김'으로 바꾸세요."));
        db.topics = db.topics.filter(function (t) { return t.code !== code; }); save(); return wait(null);
      },
      updatePlayer: function (id, patch) { Object.assign(player(id), patch); save(); return wait(null); },
      settings: function () { return wait(db.settings); },
      setSetting: function (k, v) { db.settings[k] = v; save(); return wait(null); },
      admins: function () { return wait(db.admins); },
      addAdmin: function (e) { db.admins.push({ email: e.toLowerCase().trim() }); save(); return wait(null); },
      removeAdmin: function (e) { db.admins = db.admins.filter(function (a) { return a.email !== e; }); save(); return wait(null); }
    };
  }

  MG.api = MG.DEMO ? new DemoApi() : new SupaApi();
  MG.demoLink = function (page) { return (page || "./") + "?demo=1"; };

  /* ---------- 구글 로그인 ---------- */
  MG.renderGoogleButton = function (el, onError) {
    if (MG.DEMO) return;
    (function waitG() {
      if (!(window.google && google.accounts && google.accounts.id)) return setTimeout(waitG, 200);
      google.accounts.id.initialize({
        client_id: C.GOOGLE_CLIENT_ID,
        callback: async function (resp) {
          try { await MG.api.signInGoogle(resp.credential); location.reload(); }
          catch (e) { onError && onError("로그인에 실패했어요: " + e.message); }
        }
      });
      google.accounts.id.renderButton(el, { theme: "filled_blue", size: "large", text: "signin_with", locale: "ko", shape: "pill", width: 260 });
    })();
  };
  MG.signOut = async function () {
    await MG.api.signOut();
    try { google.accounts.id.disableAutoSelect(); } catch (e) {}
    location.href = location.pathname + (MG.DEMO ? "?demo=1" : "");
  };

  /* ---------- 인증서 ---------- */
  MG.drawCert = function (cert, who) {
    var W = 1600, H = 1131, cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var g = cv.getContext("2d");
    var font = '"Pretendard Variable", Pretendard, "Malgun Gothic", sans-serif';
    var disp = '"Bricolage Grotesque", "Pretendard Variable", Georgia, serif';
    g.fillStyle = "#fffdf6"; g.fillRect(0, 0, W, H);
    // 테두리
    g.strokeStyle = "#2d2266"; g.lineWidth = 18; g.strokeRect(40, 40, W - 80, H - 80);
    g.strokeStyle = "#d4a017"; g.lineWidth = 4; g.strokeRect(72, 72, W - 144, H - 144);
    // 모서리 장식
    g.fillStyle = "#d4a017";
    [[72, 72], [W - 72, 72], [72, H - 72], [W - 72, H - 72]].forEach(function (p) { g.beginPath(); g.arc(p[0], p[1], 14, 0, Math.PI * 2); g.fill(); });
    g.textAlign = "center";
    g.fillStyle = "#2d2266"; g.font = "800 40px " + disp; g.fillText("MY Grammar", W / 2, 170);
    g.fillStyle = "#b8860b"; g.font = "700 76px " + disp; g.fillText("CERTIFICATE OF ACHIEVEMENT", W / 2, 270);
    g.fillStyle = "#2d2266"; g.font = "700 46px " + font; g.fillText(cert.title, W / 2, 350);
    g.fillStyle = "#6a6480"; g.font = "500 30px " + font; g.fillText("This certifies that", W / 2, 440);
    g.fillStyle = "#1b1640"; g.font = "800 92px " + font; g.fillText(who.name || who.nickname || "", W / 2, 550);
    g.strokeStyle = "#d4a017"; g.lineWidth = 3; g.beginPath(); g.moveTo(W / 2 - 360, 580); g.lineTo(W / 2 + 360, 580); g.stroke();
    g.fillStyle = "#4b4570"; g.font = "500 30px " + font;
    var cls = who.grade ? who.grade + "학년 " + (who.class_no || "") + "반" + (who.nickname ? " · " + who.nickname : "") : (who.nickname || "");
    if (cls) g.fillText(cls, W / 2, 630);
    g.fillStyle = "#2d2266"; g.font = "700 38px " + font; g.fillText(cert.detail || "", W / 2, 715);
    g.fillStyle = "#4b4570"; g.font = "500 30px " + font;
    g.fillText("위 학생은 MY Grammar 영어 문법 학습에서 꾸준한 노력으로 위의 성취를 이루었기에 이 인증서를 드립니다.", W / 2, 785);
    var d = new Date(cert.issued_at || Date.now());
    var ds = d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    g.font = "600 32px " + font; g.fillStyle = "#1b1640"; g.fillText(ds, W / 2, 870);
    g.font = "700 36px " + font; g.fillText(C.SCHOOL_NAME + "  " + C.TEACHER_TITLE, W / 2, 940);
    g.font = "500 22px " + font; g.fillStyle = "#8a84a3"; g.fillText(C.SCHOOL_NAME_EN + "  ·  No. " + (cert.serial || "-"), W / 2, 1000);
    // 도장
    g.save(); g.translate(W - 290, 880); g.rotate(-0.18);
    g.strokeStyle = "rgba(200,40,60,.85)"; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 92, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 78, 0, Math.PI * 2); g.stroke();
    g.fillStyle = "rgba(200,40,60,.9)"; g.font = "800 34px " + disp; g.fillText("MY", 0, -12); g.font = "800 26px " + disp; g.fillText("GRAMMAR", 0, 24); g.font = "600 18px " + font; g.fillText("CERTIFIED", 0, 54);
    g.restore();
    // 왕관
    g.font = "90px serif"; g.fillText("👑", 230, 920);
    return cv;
  };
  MG.showCert = function (cert, who) {
    var ov = MG.modal('<h2>🎓 ' + MG.esc(cert.title) + '</h2><div class="cert-wrap"></div>' +
      '<div class="row gap wrap mt"><button class="btn primary" data-act="png">🖼️ 이미지로 저장</button><button class="btn" data-act="print">🖨️ 인쇄</button></div>', { wide: true });
    var draw = function () {
      var cv = MG.drawCert(cert, who);
      cv.className = "cert-canvas";
      var w = ov.querySelector(".cert-wrap"); w.innerHTML = ""; w.appendChild(cv);
      ov.querySelector('[data-act="png"]').onclick = function () {
        var a = document.createElement("a"); a.href = cv.toDataURL("image/png"); a.download = "MY_Grammar_" + (cert.serial || cert.kind) + ".png"; a.click();
      };
      ov.querySelector('[data-act="print"]').onclick = function () { MG.printCerts([{ cert: cert, who: who }]); };
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(draw);
  };
  MG.printCerts = function (list) {
    var w = window.open("", "_blank");
    if (!w) return MG.toast("팝업이 막혀 있어요. 팝업을 허용해 주세요.");
    var imgs = list.map(function (x) { return '<img src="' + MG.drawCert(x.cert, x.who).toDataURL("image/png") + '">'; }).join("");
    w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>MY Grammar 인증서</title><style>@page{size:A4 landscape;margin:0}body{margin:0}img{width:100%;display:block;page-break-after:always}</style></head><body>' + imgs + "<script>window.onload=function(){setTimeout(function(){print()},300)}<\/script></body></html>");
    w.document.close();
  };
})();
