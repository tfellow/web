/* MY Sentence Master (sentence2/) — 로그인 · DB · 교사 통계 브리지
 * 게임 파일(js/…)은 고치지 않고 window.SMS.integration.setAdapter 로만 연결해요. (INTEGRATION_HANDOFF.md 방식 A)
 *  - 로그인: 다른 MY 앱과 같은 Google(GIS) → Supabase(tfellow-web) 세션 (한 번 로그인하면 모든 MY 앱 공유)
 *  - 권한: 학교 계정(@smy.ms.kr) + 관리자(public.is_admin). 외부 계정은 교사 통계 → 설정에서 켤 때만
 *  - 학생 계정이면 #btn-open-teacher(교사 스튜디오) 숨김. 관리자에게만 📊 학습 통계 버튼
 *  - sms:activity → sms_log (묶어서 전송, 끊기면 기기에 보관 후 재전송)
 *  - sms:stats-updated / sms:wrong-updated → sms_save_profile
 *  - 교사 스튜디오 커스텀 단원 → sms_lessons (학생 단원 목록에 나타남)
 */
(function () {
  "use strict";
  var GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
  var SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
  var SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
  var SCHOOL = "@smy.ms.kr";
  var K_STATS = "sms_stats_v1", K_WRONG = "sms_wrong_v1", K_CUSTOM = "sms_custom_lessons_v1";
  var K_OWNER = "sms2_owner";
  var MODES = { scramble: "🧩 어순 배열", blind: "🙈 4단계 암기", drill: "⚡ 문법 드릴", dictation: "🎧 듣기·쉐도잉", error: "🔍 오류 탐정", chat: "💬 대화 롤플레이" };
  var CATS = { grammar: "📘 문법", reading: "📖 읽기 본문", incontext: "💬 In Context" };

  var SMS = window.SMS || {};
  var storage = SMS.storage, integration = SMS.integration;
  if (!storage || !integration) { console.error("[sentence2 bridge] SMS 가 먼저 로드되어야 해요"); return; }

  var $ = function (s, el) { return (el || document).querySelector(s); };
  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function low(s) { return String(s || "").toLowerCase().trim(); }
  function lget(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function lrm(k) { try { localStorage.removeItem(k); } catch (e) {} }
  function toast(m, t) { if (SMS.toast) SMS.toast(m, t); }
  function missingSql(err) { return /sms_|schema cache|does not exist|42P01|42883|PGRST20[25]/i.test(((err && err.message) || "") + ((err && err.code) || "")); }
  function hakbun(email, r) { // 5자리 학번 (학년+반2+번호2)
    if (r && r.grade && r.class_no && r.student_no) return "" + r.grade + String(r.class_no).padStart(2, "0") + String(r.student_no).padStart(2, "0");
    var m = String(email || "").match(/^\d{4}(\d{5})@/); return m ? m[1] : "";
  }

  var sb = null;
  function client() {
    if (!sb) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } }); // 기본 저장 키 = 다른 MY 앱과 같은 세션
    return sb;
  }
  var me = { uid: "", email: "", name: "", grade: "", classNo: "", studentNo: "", admin: false, school: false, allowExternal: false, sqlMissing: false };

  // ---------------------------------------------------------------- 화면: 잠금 막 · 헤더 버튼
  var teacherBtn = document.getElementById("btn-open-teacher");
  if (teacherBtn) teacherBtn.classList.add("hidden"); // 관리자 확인 전에는 숨김

  var gate = document.createElement("div");
  gate.id = "s2-gate";
  gate.innerHTML = '<div class="s2-gate-card"><img src="../assets/myeverse/logo.svg" alt="" width="64" height="64">' +
    '<h2>MY Sentence Master</h2><p class="s2-sub">교과서 문장 완전 정복 · 6가지 문장 게임</p><div id="s2-gate-body"><p class="s2-muted">불러오는 중…</p></div></div>';
  document.body.appendChild(gate);
  function gateMsg(html) { $("#s2-gate-body").innerHTML = html; gate.classList.remove("hidden"); }
  function gateHide() { gate.classList.add("hidden"); }

  function drawGsi(target) {
    (function draw() {
      if (!window.google || !google.accounts || !google.accounts.id) return setTimeout(draw, 300);
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: function (r) {
          gateMsg('<p class="s2-muted">로그인하는 중…</p>');
          client().auth.signInWithIdToken({ provider: "google", token: r.credential }).then(function (res) {
            if (res.error) return showLogin("로그인하지 못했어요: " + res.error.message);
            boot();
          });
        }
      });
      var el = document.getElementById(target);
      if (el) google.accounts.id.renderButton(el, { theme: "filled_blue", size: "large", text: "signin_with", locale: "ko", shape: "pill" });
    })();
  }
  function showLogin(msg) {
    gateMsg((msg ? '<p class="s2-err">' + esc(msg) + "</p>" : "") +
      '<div id="s2-gsi" class="s2-gsi"></div><p class="s2-muted s2-small">학교 구글 계정(' + SCHOOL + ")으로 로그인하세요.<br>한 번 로그인하면 다른 MY 앱도 함께 로그인돼요.</p>");
    drawGsi("s2-gsi");
  }

  function addHeaderButtons() {
    var bar = $(".stats-bar");
    if (!bar || $("#s2-account")) return;
    if (me.admin) {
      var st = document.createElement("button");
      st.className = "btn-teacher s2-stats-btn"; st.id = "s2-open-stats"; st.type = "button";
      st.innerHTML = "<span>📊</span> 학습 통계";
      st.onclick = openStats;
      bar.appendChild(st);
    }
    var acc = document.createElement("button");
    acc.className = "icon-btn s2-account"; acc.id = "s2-account"; acc.type = "button";
    acc.title = me.email + " · 눌러서 로그아웃";
    acc.textContent = (me.name || me.email.split("@")[0]).slice(0, 6);
    acc.onclick = logout;
    bar.appendChild(acc);
  }
  function logout() {
    if (!confirm((me.name || me.email) + " 계정에서 로그아웃할까요?\n(이 기기의 다른 MY 앱도 함께 로그아웃돼요)")) return;
    flush(true).then(function () {
      [K_STATS, K_WRONG, K_CUSTOM, K_OWNER].forEach(lrm); // 같은 태블릿을 쓰는 다음 학생에게 기록이 보이지 않게
      return client().auth.signOut({ scope: "local" });
    }).then(function () { location.reload(); });
  }

  // ---------------------------------------------------------------- 시작
  function boot() {
    client().auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return showLogin();
      me.uid = s.user.id; me.email = low(s.user.email);
      return client().rpc("sms_access").then(function (res) {
        if (res.error) {
          if (!missingSql(res.error)) throw res.error;
          me.sqlMissing = true; // SQL 실행 전: 관리자만 기기 저장으로 미리 써 볼 수 있어요
          return client().rpc("is_admin").then(function (a) {
            me.admin = !!a.data; me.school = me.email.endsWith(SCHOOL);
            if (!me.admin) return gateMsg('<p>🛠️ 아직 준비 중인 앱이에요.</p><p class="s2-muted s2-small">선생님이 설정을 마치면 바로 쓸 수 있어요.</p>');
            return start();
          });
        }
        var a = res.data || {};
        me.admin = !!a.admin; me.school = !!a.school; me.allowExternal = !!a.allow_external;
        me.name = a.name || ""; me.grade = a.grade || ""; me.classNo = a.class_no || ""; me.studentNo = a.student_no || "";
        if (!a.ok) {
          gateMsg('<p class="s2-err">학교 계정(' + SCHOOL + ")으로 로그인해 주세요.</p><p class=\"s2-muted s2-small\">지금 계정: " + esc(me.email) + "</p>" +
            '<div id="s2-gsi" class="s2-gsi"></div><button class="btn btn-ghost btn-sm" id="s2-out">이 계정 로그아웃</button>');
          drawGsi("s2-gsi");
          $("#s2-out").onclick = function () { client().auth.signOut({ scope: "local" }).then(function () { location.reload(); }); };
          return;
        }
        return start();
      });
    }).catch(function (e) {
      console.error(e);
      gateMsg('<p class="s2-err">연결하지 못했어요. 인터넷을 확인하고 새로고침해 주세요.</p><p class="s2-muted s2-small">' + esc(e.message || e) + "</p>");
    });
  }

  // 로그인 사용자의 기록을 DB에서 불러와 게임에 넣어요
  function loadInitialState() {
    if (lget(K_OWNER, "") !== me.uid) { [K_STATS, K_WRONG, K_CUSTOM].forEach(lrm); } // 다른 사람이 쓰던 기기
    lset(K_OWNER, me.uid);
    var defaults = { xp: 0, streak: 0, bestStreak: 0, masteredIds: [], sfxEnabled: true };
    if (me.sqlMissing) return Promise.resolve({ stats: storage.getStats(), wrongNotes: storage.getWrongNotes(), customLessons: storage.getCustomLessons() });
    var pProf = client().from("sms_profile").select("stats,wrong_notes").eq("user_id", me.uid).maybeSingle();
    var pLes = client().from("sms_lessons").select("id,data").order("updated_at");
    return Promise.all([pProf, pLes]).then(function (r) {
      if (r[0].error) throw r[0].error;
      if (r[1].error) throw r[1].error;
      var prof = r[0].data, dbLessons = (r[1].data || []).map(function (x) { var l = x.data || {}; l.id = x.id; l.isCustom = true; return l; });
      var localStats = storage.getStats(), localWrong = storage.getWrongNotes(), localCustom = storage.getCustomLessons();
      var stats = prof ? Object.assign({}, defaults, prof.stats) : Object.assign({}, defaults, localStats);
      var wrong = prof ? (prof.wrong_notes || []) : localWrong;
      if (!prof && (localStats.xp || localWrong.length)) setTimeout(function () { saveProfileNow(); }, 500); // 첫 로그인: 이 기기 기록을 계정으로
      var custom = dbLessons;
      if (me.admin) { // 교사 기기에만 있던 단원은 DB로 올려요
        var ids = {}; dbLessons.forEach(function (l) { ids[l.id] = 1; });
        localCustom.forEach(function (l) { if (l && l.id && !ids[l.id]) { custom.push(l); upsertLesson(l); } });
      }
      return { stats: stats, wrongNotes: wrong, customLessons: custom };
    });
  }

  function start() {
    var initial = loadInitialState();
    integration.setAdapter({
      getCurrentUser: function () {
        return { uid: me.uid, email: me.email, name: me.name, grade: me.grade, classRoom: me.classNo, studentNo: me.studentNo, role: me.admin ? "teacher" : "student" };
      },
      loadInitialState: function () { return initial; },
      onActivity: function (d) { queueActivity(d); },
      onStatsSync: function () { scheduleProfile(); },
      onWrongUpdate: function () { scheduleProfile(); }
    });
    initial.then(function () {
      setTimeout(function () { // hydrate(게임 화면 갱신)가 끝난 다음
        if (me.admin && teacherBtn) teacherBtn.classList.remove("hidden");
        if (!me.admin && teacherBtn) teacherBtn.remove(); // 학생: 교사 스튜디오 완전히 제거
        addHeaderButtons();
        patchLessons();
        patchBlindWrong();
        if (me.sqlMissing) banner("🛠️ 관리자 미리보기: supabase_sentence2.sql 을 아직 실행하지 않아서 기록이 이 기기에만 저장돼요.");
        gateHide();
        flush();
      }, 0);
    }).catch(function (e) {
      console.error(e);
      gateMsg('<p class="s2-err">기록을 불러오지 못했어요. 새로고침해 주세요.</p><p class="s2-muted s2-small">' + esc(e.message || e) + "</p>");
    });
  }
  function banner(text) {
    if (!text) return;
    var b = document.createElement("div"); b.className = "s2-banner"; b.textContent = text;
    var app = document.getElementById("app"); app.insertBefore(b, app.firstChild.nextSibling);
  }

  // ---------------------------------------------------------------- 기록 전송
  var curMode = "dashboard", curCtx = {};
  var origSetContext = storage.setContext;
  storage.setContext = function (ctx) { curCtx = Object.assign({}, curCtx, ctx); curMode = curCtx.mode || curMode; return origSetContext.apply(this, arguments); };

  function pendKey() { return "sms2_pending_" + me.uid; }
  function queueActivity(d) {
    if (!me.uid) return;
    var c = d.context || {};
    var q = lget(pendKey(), []);
    q.push({ ts: d.timestamp, result: d.result, sentenceId: d.sentenceId || "", lessonId: c.lessonId || "", category: c.category || "", mode: c.mode || "", xpDelta: d.xpDelta || 0 });
    if (q.length > 3000) q = q.slice(-3000);
    lset(pendKey(), q);
    clearTimeout(flushT); flushT = setTimeout(flush, 2500);
  }
  var flushT = null, flushing = null;
  function flush() {
    if (!me.uid || me.sqlMissing) return Promise.resolve();
    if (flushing) return flushing;
    var q = lget(pendKey(), []);
    if (!q.length) return Promise.resolve();
    var batch = q.slice(0, 300);
    flushing = client().rpc("sms_log", { p_events: batch }).then(function (r) {
      if (r.error) throw r.error;
      var rest = lget(pendKey(), []).slice(batch.length);
      lset(pendKey(), rest);
      flushing = null;
      if (rest.length) return flush();
    }).catch(function (e) {
      console.warn("[sentence2] 기록 전송 실패 — 기기에 보관했다가 다시 보낼게요", e);
      flushing = null;
      clearTimeout(flushT); flushT = setTimeout(flush, 20000);
    });
    return flushing;
  }
  setInterval(flush, 15000);
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") { flush(); if (profT) saveProfileNow(); } });
  window.addEventListener("online", flush);

  var profT = null;
  function scheduleProfile() { clearTimeout(profT); profT = setTimeout(saveProfileNow, 1500); }
  function saveProfileNow() {
    clearTimeout(profT); profT = null;
    if (!me.uid || me.sqlMissing) return Promise.resolve();
    return client().rpc("sms_save_profile", { p_stats: storage.getStats(), p_wrong: storage.getWrongNotes() }).then(function (r) {
      if (r.error) { console.warn("[sentence2] 요약 저장 실패", r.error); profT = setTimeout(saveProfileNow, 20000); }
    });
  }

  // 4단계 암기(blind)는 틀려도 오답 이벤트를 보내지 않아서, 그 모드에서 콤보가 끊기면 오답 1회로 세요
  function patchBlindWrong() {
    var orig = storage.resetStreak;
    storage.resetStreak = function () {
      var out = orig.apply(this, arguments);
      if (curMode === "blind") queueActivity({ timestamp: new Date().toISOString(), result: "wrong", sentenceId: "", context: curCtx, xpDelta: 0 });
      return out;
    };
  }

  // ---------------------------------------------------------------- 커스텀 단원 → DB (관리자)
  function upsertLesson(l) {
    if (me.sqlMissing || !me.admin || !l || !l.id) return;
    client().from("sms_lessons").upsert({ id: l.id, data: l, created_by: me.email, updated_at: new Date().toISOString() }).then(function (r) {
      if (r.error) { console.warn(r.error); toast("단원을 서버에 저장하지 못했어요: " + r.error.message, "error"); }
    });
  }
  function patchLessons() {
    if (!me.admin) return;
    var add = storage.addCustomLesson, del = storage.deleteCustomLesson;
    storage.addCustomLesson = function (lesson) { var out = add.apply(this, arguments); upsertLesson(lesson); return out; };
    storage.deleteCustomLesson = function (id) {
      var out = del.apply(this, arguments);
      if (!me.sqlMissing) client().from("sms_lessons").delete().eq("id", id).then(function (r) { if (r.error) toast("서버에서 지우지 못했어요: " + r.error.message, "error"); });
      return out;
    };
  }

  // ================================================================ 📊 교사용 학습 통계
  var S = { since: "all", cls: "", lesson: "", data: null, roster: [], sort: "hakbun" };
  function lessonsAll() { return (SMS.BUILTIN_LESSONS || []).concat(storage.getCustomLessons()); }
  function sinceDate() {
    if (S.since === "all") return null;
    var days = { today: 0, d7: 6, d30: 29 }[S.since];
    var d = new Date(Date.now() + 9 * 3600e3 - days * 864e5); return d.toISOString().slice(0, 10);
  }

  function openStats() {
    var m = $("#s2-stats");
    if (!m) {
      m = document.createElement("div");
      m.id = "s2-stats"; m.className = "modal-backdrop"; m.setAttribute("role", "dialog");
      m.innerHTML = '<div class="modal-card modal-xl s2-stats-card"><div class="modal-header"><div><h2>📊 학습 통계</h2><p class="modal-subtitle">학생들이 푼 문장 기록을 모아 보여 줘요. (문항 기록은 몇 초 뒤에 서버에 모여요)</p></div>' +
        '<button class="modal-close" id="s2-stats-close" aria-label="닫기">✕</button></div><div class="modal-body" id="s2-stats-body"></div></div>';
      document.body.appendChild(m);
      $("#s2-stats-close").onclick = function () { m.classList.add("hidden"); };
      m.addEventListener("click", function (e) { if (e.target === m) m.classList.add("hidden"); });
    }
    m.classList.remove("hidden");
    loadStats();
  }
  function loadStats() {
    var body = $("#s2-stats-body");
    if (me.sqlMissing) { body.innerHTML = '<p class="s2-err">Supabase SQL Editor 에서 sentence2/supabase_sentence2.sql 을 먼저 실행해 주세요.</p>'; return; }
    body.innerHTML = '<p class="s2-muted">불러오는 중…</p>';
    flush().then(function () {
      return Promise.all([
        client().rpc("sms_admin_data", { p_since: sinceDate() }),
        S.roster.length ? { data: S.roster } : client().from("roster").select("email,name,grade,class_no,student_no").range(0, 4999)
      ]);
    }).then(function (r) {
      if (r[0].error) throw r[0].error;
      S.data = r[0].data || { profiles: [], items: [], daily: [] };
      S.roster = (r[1] && r[1].data) || [];
      renderStats();
    }).catch(function (e) { body.innerHTML = '<p class="s2-err">불러오지 못했어요: ' + esc(e.message || e) + "</p>"; });
  }

  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function bar(p, cls) { return '<div class="s2-bar"><div class="s2-bar-fill ' + (cls || "") + '" style="width:' + Math.max(0, Math.min(100, p)) + '%"></div></div>'; }

  function computeStats() {
    var D = S.data, rosterBy = {};
    S.roster.forEach(function (p) { rosterBy[low(p.email)] = p; });
    var lessons = lessonsAll(), sentBy = {}, lessonIds = {};
    lessons.forEach(function (l) { (l.sentences || []).forEach(function (s) { sentBy[s.id] = { en: s.en, ko: s.ko, lesson: l, cat: s.category }; }); });
    var curLesson = S.lesson ? lessons.filter(function (l) { return l.id === S.lesson; })[0] : null;
    var totalSent = curLesson ? (curLesson.sentences || []).length : Object.keys(sentBy).length;
    var inLesson = function (lid) { return !S.lesson || lid === S.lesson; };
    var clsOf = function (email) {
      var r = rosterBy[email]; if (r && r.grade && r.class_no) return r.grade + "-" + r.class_no;
      var h = hakbun(email); return h ? h[0] + "-" + (+h.slice(1, 3)) : "";
    };
    var inCls = function (email) { return !S.cls || clsOf(email) === S.cls; };

    var people = {};
    function P(email) {
      email = low(email);
      if (!people[email]) { var r = rosterBy[email]; people[email] = { email: email, r: r, name: r ? r.name : "", hak: hakbun(email, r), xp: 0, mastered: 0, ok: 0, ng: 0, last: "", wn: 0 }; }
      return people[email];
    }
    var modeAgg = {}, catAgg = {}, dayAgg = {};
    (D.daily || []).forEach(function (d) {
      var e = low(d.e); if (!inCls(e) || !inLesson(d.l)) return;
      var p = P(e); p.ok += d.ok; p.ng += d.ng; if (d.d > p.last) p.last = d.d;
      var mk = d.m || "?"; modeAgg[mk] = modeAgg[mk] || { ok: 0, ng: 0, who: {} }; modeAgg[mk].ok += d.ok; modeAgg[mk].ng += d.ng; modeAgg[mk].who[e] = 1;
      var ck = d.c && d.c !== "all" ? d.c : ""; if (ck) { catAgg[ck] = catAgg[ck] || { ok: 0, ng: 0 }; catAgg[ck].ok += d.ok; catAgg[ck].ng += d.ng; }
      dayAgg[d.d] = dayAgg[d.d] || { ok: 0, ng: 0, who: {} }; dayAgg[d.d].ok += d.ok; dayAgg[d.d].ng += d.ng; dayAgg[d.d].who[e] = 1;
    });
    // 영역 'all'(전체 탭)에서 푼 문항은 문장의 실제 영역으로 다시 나눠요
    var catItems = {};
    (D.items || []).forEach(function (it) {
      var e = low(it.e); if (!inCls(e) || !inLesson(it.l)) return;
      var c = (sentBy[it.s] && sentBy[it.s].cat) || it.c; if (!c || c === "all") return;
      catItems[c] = catItems[c] || { ok: 0, ng: 0 }; catItems[c].ok += it.ok; catItems[c].ng += it.ng;
    });
    (D.profiles || []).forEach(function (pr) {
      var e = low(pr.e); if (!inCls(e)) return;
      var st = pr.stats || {}, ids = st.masteredIds || [];
      var has = people[e] || (!S.lesson && S.since === "all");
      if (!has) return;
      var p = P(e); p.xp = st.xp || 0; p.wn = pr.wn || 0;
      p.mastered = ids.filter(function (id) { return sentBy[id] && (!S.lesson || sentBy[id].lesson.id === S.lesson); }).length;
    });
    var wrongBy = {};
    (D.items || []).forEach(function (it) {
      var e = low(it.e); if (!inCls(e) || !inLesson(it.l) || !it.ng) return;
      var w = wrongBy[it.s] = wrongBy[it.s] || { id: it.s, ng: 0, ok: 0, who: {}, modes: {} };
      w.ng += it.ng; w.ok += it.ok; w.who[e] = 1; w.modes[it.m] = (w.modes[it.m] || 0) + it.ng;
    });
    var top = Object.keys(wrongBy).map(function (k) { return wrongBy[k]; }).filter(function (w) { return w.id; })
      .sort(function (a, b) { return Object.keys(b.who).length - Object.keys(a.who).length || b.ng - a.ng; }).slice(0, 5);
    return { people: Object.keys(people).map(function (k) { return people[k]; }), modeAgg: modeAgg, catAgg: Object.keys(catItems).length ? catItems : catAgg, dayAgg: dayAgg, top: top, sentBy: sentBy, totalSent: totalSent, clsOf: clsOf };
  }

  function renderStats() {
    var body = $("#s2-stats-body"), C = computeStats();
    var classes = {}; S.roster.forEach(function (p) { if (p.grade && p.class_no) classes[p.grade + "-" + p.class_no] = 1; });
    var clsList = Object.keys(classes).sort(function (a, b) { var x = a.split("-"), y = b.split("-"); return x[0] - y[0] || x[1] - y[1]; });
    var people = C.people.slice().sort(function (a, b) {
      if (S.sort === "xp") return b.xp - a.xp;
      if (S.sort === "acc") return pct(b.ok, b.ok + b.ng) - pct(a.ok, a.ok + a.ng);
      if (S.sort === "n") return (b.ok + b.ng) - (a.ok + a.ng);
      return (a.hak || "z" + a.email).localeCompare(b.hak || "z" + b.email);
    });
    var tOk = 0, tNg = 0; people.forEach(function (p) { tOk += p.ok; tNg += p.ng; });
    var active = people.filter(function (p) { return p.ok + p.ng > 0; }).length;
    var avgProg = people.length ? Math.round(people.reduce(function (t, p) { return t + pct(p.mastered, C.totalSent); }, 0) / people.length) : 0;

    var h = '<div class="s2-filters">' +
      '<label>기간 <select id="s2-f-since">' + [["all", "전체"], ["today", "오늘"], ["d7", "최근 7일"], ["d30", "최근 30일"]].map(function (o) { return '<option value="' + o[0] + '"' + (S.since === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label>" +
      '<label>학급 <select id="s2-f-cls"><option value="">전체</option>' + clsList.map(function (c) { return '<option value="' + c + '"' + (S.cls === c ? " selected" : "") + ">" + c.replace("-", "학년 ") + "반</option>"; }).join("") + "</select></label>" +
      '<label>단원 <select id="s2-f-lesson"><option value="">전체 단원</option>' + lessonsAll().map(function (l) { return '<option value="' + esc(l.id) + '"' + (S.lesson === l.id ? " selected" : "") + ">[" + esc(l.grade) + "] " + esc(l.title) + "</option>"; }).join("") + "</select></label>" +
      '<button class="btn btn-secondary btn-sm" id="s2-reload">🔄 새로고침</button><button class="btn btn-secondary btn-sm" id="s2-csv">⬇️ CSV</button></div>';

    h += '<div class="s2-cards">' +
      card("👩‍🎓 참여 학생", active + "명") + card("📝 푼 문항", (tOk + tNg) + "개") +
      card("✅ 정답률", pct(tOk, tOk + tNg) + "%") + card("🏁 평균 진도", avgProg + "%", "마스터 문장 / " + C.totalSent + "문장") + "</div>";

    h += '<div class="s2-grid2"><section class="s2-sec"><h3>🎮 게임별 참여 · 정답률</h3>' + aggTable(C.modeAgg, MODES, true) + "</section>" +
      '<section class="s2-sec"><h3>🧭 영역별 오답률</h3>' + catTable(C.catAgg) + "</section></div>";

    h += '<section class="s2-sec"><h3>📌 많이 틀린 문장 TOP 5</h3>' + (C.top.length ? '<ol class="s2-top">' + C.top.map(function (w) {
      var s = C.sentBy[w.id] || {}, who = Object.keys(w.who).length;
      var ms = Object.keys(w.modes).sort(function (a, b) { return w.modes[b] - w.modes[a]; }).map(function (m) { return (MODES[m] || m) + " " + w.modes[m]; }).join(" · ");
      return "<li><div class=\"s2-top-en\">" + esc(s.en || w.id) + "</div><div class=\"s2-muted s2-small\">" + esc(s.ko || "") + "</div>" +
        '<div class="s2-small">❌ ' + w.ng + "회 · 틀린 학생 " + who + "명 · " + esc(ms) + (s.lesson ? " · " + esc(s.lesson.grade + " " + s.lesson.title) : "") + "</div></li>";
    }).join("") + "</ol>" : '<p class="s2-muted">아직 틀린 문장 기록이 없어요.</p>') + "</section>";

    h += '<section class="s2-sec"><div class="s2-sec-head"><h3>👩‍🎓 학생별 기록 (' + people.length + '명)</h3><label class="s2-small">정렬 <select id="s2-f-sort">' +
      [["hakbun", "학번"], ["xp", "XP"], ["n", "푼 문항"], ["acc", "정답률"]].map(function (o) { return '<option value="' + o[0] + '"' + (S.sort === o[0] ? " selected" : "") + ">" + o[1] + "</option>"; }).join("") + "</select></label></div>" +
      '<div class="s2-table-wrap"><table class="s2-table"><thead><tr><th>학번</th><th>이름</th><th>XP</th><th>진도 (마스터)</th><th>푼 문항</th><th>정답률</th><th>오답 노트</th><th>최근</th></tr></thead><tbody>' +
      (people.length ? people.map(function (p) {
        var n = p.ok + p.ng, pg = pct(p.mastered, C.totalSent), ac = pct(p.ok, n);
        return "<tr><td>" + esc(p.hak || "—") + "</td><td>" + esc(p.name || p.email) + "</td><td>" + p.xp + "</td>" +
          '<td class="s2-prog">' + bar(pg) + "<span>" + p.mastered + "/" + C.totalSent + " (" + pg + "%)</span></td><td>" + n + "</td>" +
          '<td class="' + (n ? (ac >= 80 ? "s2-hi" : ac >= 60 ? "s2-mid" : "s2-lo") : "") + '">' + (n ? ac + "%" : "—") + "</td><td>" + p.wn + "</td><td>" + esc(p.last ? p.last.slice(5).replace("-", "/") : "—") + "</td></tr>";
      }).join("") : '<tr><td colspan="8" class="s2-muted">이 조건의 기록이 없어요.</td></tr>') + "</tbody></table></div></section>";

    h += '<section class="s2-sec"><h3>⚙️ 설정</h3><label class="s2-switch"><input type="checkbox" id="s2-ext"' + (me.allowExternal ? " checked" : "") + '> 외부 구글 계정(' + SCHOOL + ' 가 아닌 계정)도 쓸 수 있게 허용</label>' +
      '<p class="s2-muted s2-small">끄면 학교 계정과 관리자만 들어올 수 있어요. 서버(Supabase)에서도 같은 기준으로 막아요.</p></section>';
    body.innerHTML = h;

    $("#s2-f-since").onchange = function () { S.since = this.value; loadStats(); };
    $("#s2-f-cls").onchange = function () { S.cls = this.value; renderStats(); };
    $("#s2-f-lesson").onchange = function () { S.lesson = this.value; renderStats(); };
    $("#s2-f-sort").onchange = function () { S.sort = this.value; renderStats(); };
    $("#s2-reload").onclick = loadStats;
    $("#s2-csv").onclick = function () { downloadCsv(people, C); };
    $("#s2-ext").onchange = function () {
      var on = this.checked, box = this;
      client().from("sms_settings").upsert({ key: "allow_external", value: on, updated_at: new Date().toISOString() }).then(function (r) {
        if (r.error) { box.checked = !on; return toast("저장하지 못했어요: " + r.error.message, "error"); }
        me.allowExternal = on; toast(on ? "외부 계정 허용을 켰어요." : "외부 계정 허용을 껐어요.", "success");
      });
    };
  }
  function card(t, v, sub) { return '<div class="s2-card"><div class="s2-card-t">' + t + '</div><div class="s2-card-v">' + v + "</div>" + (sub ? '<div class="s2-muted s2-small">' + sub + "</div>" : "") + "</div>"; }
  function aggTable(agg, names, withWho) {
    var keys = Object.keys(names).filter(function (k) { return agg[k]; }).concat(Object.keys(agg).filter(function (k) { return !names[k]; }));
    if (!keys.length) return '<p class="s2-muted">아직 기록이 없어요.</p>';
    return '<table class="s2-mini"><tbody>' + keys.map(function (k) {
      var a = agg[k], n = a.ok + a.ng, p = pct(a.ok, n);
      return "<tr><td>" + esc(names[k] || k) + "</td><td>" + (withWho ? Object.keys(a.who).length + "명 · " : "") + n + "문항</td><td class=\"s2-barcell\">" + bar(p, "ok") + "</td><td>" + p + "%</td></tr>";
    }).join("") + "</tbody></table>";
  }
  function catTable(agg) {
    var keys = Object.keys(CATS).filter(function (k) { return agg[k]; });
    if (!keys.length) return '<p class="s2-muted">아직 기록이 없어요.</p>';
    return '<table class="s2-mini"><tbody>' + keys.map(function (k) {
      var a = agg[k], n = a.ok + a.ng, p = pct(a.ng, n);
      return "<tr><td>" + CATS[k] + "</td><td>" + n + "문항</td><td class=\"s2-barcell\">" + bar(p, "ng") + "</td><td>오답 " + p + "%</td></tr>";
    }).join("") + "</tbody></table>";
  }
  function downloadCsv(people, C) {
    var rows = [["학번", "이름", "이메일", "학급", "XP", "마스터 문장", "전체 문장", "진도(%)", "푼 문항", "정답", "오답", "정답률(%)", "오답 노트", "최근"]];
    people.forEach(function (p) { var n = p.ok + p.ng; rows.push([p.hak, p.name, p.email, C.clsOf(p.email), p.xp, p.mastered, C.totalSent, pct(p.mastered, C.totalSent), n, p.ok, p.ng, n ? pct(p.ok, n) : "", p.wn, p.last]); });
    var csv = "﻿" + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? "" : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "sentence2_통계_" + new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) + ".csv"; a.click();
  }

  // 시작
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.SMS2 = { me: me, flush: flush }; // 디버그용
})();
