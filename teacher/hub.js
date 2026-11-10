// MY Teacher Hub — 여러 앱의 학생 기록을 한 화면에 모아 보는 교사용 페이지
// 각 앱의 기록은 선생님 계정으로 "읽기만" 해요. 쓰는 곳은 딱 두 군데예요:
//   1) 🎁 보상: 선생님이 [지급]을 누르면 Class123 학생 카드에 으쓱을 더하고, 지급 기록을 class123_plus/hub_rewards 에 남겨요.
//   2) 📤 학생 페이지: 학생별 요약을 Supabase hub_summary 표에 올려요 (학생은 자기 줄만 읽어요).
// 저장소
//   Supabase (tfellow-web)       : 독서 여권, MY Grammar, Quiz Queens(구글 시트, Supabase 로그인으로 확인)
//   Firebase cloze-a8e6c          : 단어숲, MY Cloze, AI 영작문(writing1)
//   Firebase my-kahoot-smy (RTDB) : MY Kahoot, Class123 Plus, 보상 규칙·지급 기록
const FB_VER = "10.12.2";
const TEACHERS = ["tfellow@gmail.com", "tfellow@smy.ms.kr", "engwords@smy.ms.kr"];
const SCHOOL = "@smy.ms.kr";
const GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";
const SB_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
const SB_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키
const QUIZ_GAS = "https://script.google.com/macros/s/AKfycbzem2As4a_5FqOJ5KTF49AiVgT8M4h_cDrOEMMlZZmEvbD-bHZD-RSDDKHOKL3o_copYQ/exec";
const FB_CLOZE = {
  apiKey: "AIzaSyBigleCLtdsGEMaDLnBI7A3jq97W8dRcRE", authDomain: "cloze-a8e6c.firebaseapp.com", projectId: "cloze-a8e6c",
  storageBucket: "cloze-a8e6c.firebasestorage.app", messagingSenderId: "410570182902", appId: "1:410570182902:web:bec24c8663fe35e5e2dcd7",
};
const FB_KAHOOT = {
  apiKey: "AIzaSyDE-zsT6njzKpoGLl3Izw0CxPcpDepcO4g", authDomain: "my-kahoot-smy.firebaseapp.com",
  databaseURL: "https://my-kahoot-smy-default-rtdb.firebaseio.com", projectId: "my-kahoot-smy",
  storageBucket: "my-kahoot-smy.firebasestorage.app", messagingSenderId: "905782620870", appId: "1:905782620870:web:c8a52bb0ec186ddba71dc7",
};
const C123_WS = "tfellow_workspace";        // Class123 자료 (Class123 앱이 통째로 저장하는 곳)
const HUB_PATH = "class123_plus/hub_rewards"; // 보상 규칙·지급 기록 (Class123 자료와 따로)

const APPS = [
  { id: "passport", name: "독서 여권", icon: "📖", src: "sb", url: "../app/" },
  { id: "grammar", name: "문법", icon: "✏️", src: "sb", url: "../grammar/" },
  { id: "quiz", name: "Quiz Queens", icon: "👑", src: "sb", url: "../quiz/", cumulative: true },
  { id: "vocab", name: "단어숲", icon: "🌳", src: "fc", url: "../danuhsup/" },
  { id: "cloze", name: "Cloze", icon: "🧩", src: "fc", url: "../cloze/" },
  { id: "writing", name: "영작문", icon: "✍️", src: "fc", url: "../writing1/" },
  { id: "speaking", name: "말하기", icon: "🎤", src: "sb", url: "../speaking/" },
  { id: "level", name: "레벨 테스트", icon: "🧭", src: "sb", url: "../level/" },
  { id: "kahoot", name: "Kahoot", icon: "⚡", src: "fk", url: "../kahoot/" },
  { id: "c123", name: "Class123", icon: "⭐", src: "fk", url: "../class123/", cumulative: true },
];
const APP = Object.fromEntries(APPS.map(a => [a.id, a]));
const SOURCES = {
  sb: { name: "Supabase", desc: "독서 여권 · 문법 · Quiz Queens · 말하기 · 레벨 테스트 · 학생 명단" },
  fc: { name: "Firebase (Cloze)", desc: "단어숲 · Cloze · 영작문" },
  fk: { name: "Firebase (Kahoot)", desc: "Kahoot · Class123 · 보상" },
};

// 보상 규칙에 쓸 수 있는 기준 (min = 점수 기준이 있는 것)
const METRICS = {
  passport_medal: { app: "passport", name: "독서 여권 메달 받은 책", unit: "권" },
  passport_gold: { app: "passport", name: "독서 여권 금메달 받은 책", unit: "권" },
  grammar_stamp: { app: "grammar", name: "문법 단원 스탬프", unit: "개" },
  vocab_test: { app: "vocab", name: "단어숲 단원 테스트", unit: "회", min: 90, minUnit: "% 이상" },
  cloze_test: { app: "cloze", name: "Cloze 테스트", unit: "회", min: 100, minUnit: "% 이상" },
  writing_submit: { app: "writing", name: "영작문 제출", unit: "편", min: 0, minUnit: "점 이상" },
  kahoot_top3: { app: "kahoot", name: "Kahoot 수업 퀴즈 3등 안", unit: "회" },
  kahoot_top10: { app: "kahoot", name: "Kahoot 수업 퀴즈 10등 안", unit: "회" },
  kahoot_hw: { app: "kahoot", name: "Kahoot 과제", unit: "회", min: 80, minUnit: "% 이상" },
};
const DEFAULT_RULES = [
  { metric: "passport_medal", every: 5, give: 1, label: "독서 여권 메달 5권" },
  { metric: "passport_gold", every: 1, give: 1, label: "독서 여권 금메달" },
  { metric: "grammar_stamp", every: 3, give: 1, label: "문법 스탬프 3개" },
  { metric: "vocab_test", min: 90, every: 3, give: 1, label: "단어숲 90점 3회" },
  { metric: "cloze_test", min: 100, every: 1, give: 1, label: "Cloze 만점" },
  { metric: "writing_submit", min: 0, every: 3, give: 1, label: "영작문 3편 제출" },
  { metric: "kahoot_top3", every: 1, give: 1, label: "Kahoot 3등 안" },
  { metric: "kahoot_hw", min: 80, every: 3, give: 1, label: "Kahoot 과제 80점 3회" },
];

// 로그인 없는 체험 모드(?demo=1). 지금은 꺼 둠 — 다시 켜려면 true 로
const DEMO_ENABLED = false;
const DEMO = DEMO_ENABLED && new URLSearchParams(location.search).has("demo");
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const low = s => String(s || "").toLowerCase().trim();
const isTeacher = e => TEACHERS.includes(low(e));
const toList = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const isMedal = m => m === "gold" || m === "silver" || m === "bronze";
const pct = (s, t) => t > 0 ? Math.round((s / t) * 100) : null;
const ekey = e => low(e).replace(/[.#$\[\]\/]/g, "_");
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- 시간 (한국 시간 기준) ----------
const KST = 9 * 3600e3, DAY = 864e5;
const kday = ms => new Date(ms + KST).toISOString().slice(0, 10);
const kstart = d => Date.parse(d + "T00:00:00+09:00");
function fmtWhen(ms) {
  if (!ms) return "—";
  const d = Math.floor((kstart(kday(Date.now())) - kstart(kday(ms))) / DAY);
  if (d <= 0) return "오늘 " + new Date(ms + KST).toISOString().slice(11, 16);
  if (d === 1) return "어제";
  if (d < 7) return d + "일 전";
  return kday(ms).slice(5).replace("-", "/");
}
function toMs(v) {
  if (!v) return 0;
  if (typeof v === "number") return v < 1e12 ? v * 1000 : v;
  if (typeof v.toMillis === "function") return v.toMillis();
  if (typeof v === "object" && "seconds" in v) return v.seconds * 1000;
  const t = Date.parse(v);
  return Number.isFinite(t) ? t : parseKoDate(v);
}
// "2026. 11. 3. 오후 2:13:00" 같은 한국어 날짜
function parseKoDate(s) {
  const m = String(s || "").match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2})?:?(\d{2})?/);
  if (!m) return 0;
  let h = num(m[5]); if (m[4] === "오후" && h < 12) h += 12; if (m[4] === "오전" && h === 12) h = 0;
  const p = n => String(n).padStart(2, "0");
  return Date.parse(`${m[1]}-${p(m[2])}-${p(m[3])}T${p(h)}:${p(num(m[6]))}:00+09:00`) || 0;
}
function rangeOf(period, from, to) {
  const now = Date.now(), t0 = kstart(kday(now));
  switch (period) {
    case "today": return [t0, Infinity];
    case "week": { const dow = new Date(t0 + KST).getUTCDay(); return [t0 - ((dow + 6) % 7) * DAY, Infinity]; }
    case "7d": return [t0 - 6 * DAY, Infinity];
    case "month": return [kstart(kday(now).slice(0, 8) + "01"), Infinity];
    case "30d": return [t0 - 29 * DAY, Infinity];
    case "custom": return [from ? kstart(from) : 0, to ? kstart(to) + DAY : Infinity];
    default: return [0, Infinity];
  }
}
const periodRange = () => rangeOf(state.f.period, state.f.from, state.f.to);
const periodLabel = () => ({ today: "오늘", week: "이번 주", "7d": "최근 7일", month: "이번 달", "30d": "최근 30일", all: "전체 기간", custom: "선택 기간" })[state.f.period];

// ---------- 상태 ----------
const state = {
  src: { sb: { st: "off" }, fc: { st: "off" }, fk: { st: "off" } },
  people: new Map(),      // email → {email,name,grade,cls,no,roster}
  events: [],             // {e,a,t,k,title,s,n,p,medal,book,rank,of}
  byEmail: null,          // email → events (필요할 때 만들어요)
  snap: {},               // app → Map(email → 누적 값)
  gCache: new Map(),      // 문법 기간 통계 (서버 계산): "from-to" → Map(email → {...})
  f: { grade: "", cls: "", period: "week", from: "", to: "", q: "" },
  tab: "class",
  sort: { key: "no", dir: 1 },
  hidden: new Set(load("hub.hidden", [])),
  idleDays: 7,
  hub: { rules: {}, granted: {}, log: {}, hidden: {} }, hubLoaded: false,
  c123Map: new Map(),     // email → {ck, cid, sid, cname}
  pub: { st: "", at: 0, msg: "" },
};
APPS.forEach(a => state.snap[a.id] = new Map());
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
let toastT;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add("hidden"), 3500); }

// ---------- 학생 명단 ----------
// 실제 학생 = 독서 여권 명단(roster, 약 180명)에 있는 학생 + 어느 앱이든 실제 기록이 있는 학교 계정.
// 다른 앱의 명단(Kahoot, writing1 등)에는 연습용 가짜 학생이 섞여 있어서 이름·학번을 채우는 데만 써요.
// 학교 이메일 9자리 = 입학연도(4) + 학년(1) + 반(2) + 번호(2)  예) 202610101 → 1학년 1반 1번
function fromEmail(email) {
  const m = low(email).match(/^(\d{4})(\d)(\d{2})(\d{2})@smy\.ms\.kr$/);
  return m ? { grade: +m[2], cls: +m[3], no: +m[4] } : {};
}
function person(email, info = {}, strong = false) {
  email = low(email);
  if (!email.endsWith(SCHOOL) || isTeacher(email)) return null;
  let p = state.people.get(email);
  if (!p) { p = { email, name: "", grade: null, cls: null, no: null, roster: false, ...fromEmail(email) }; state.people.set(email, p); }
  if (strong) { p.roster = true; rosterN = -1; }
  for (const k of ["name", "grade", "cls", "no"]) {
    const v = info[k];
    if (v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v))) continue;
    if (strong || !p[k]) p[k] = k === "name" ? String(v).trim() : num(v) || p[k];
  }
  return p;
}
function addEvent(ev) { if (!ev.e || !ev.t) return; ev.e = low(ev.e); if (!person(ev.e)) return; state.events.push(ev); state.byEmail = null; }
function clearApps(ids) {
  state.events = state.events.filter(e => !ids.includes(e.a)); state.byEmail = null;
  ids.forEach(id => state.snap[id] = new Map());
  if (ids.includes("grammar")) state.gCache.clear();
}
function evsOf(email) {
  if (!state.byEmail) { state.byEmail = new Map(); for (const e of state.events) (state.byEmail.get(e.e) || state.byEmail.set(e.e, []).get(e.e)).push(e); }
  return state.byEmail.get(email) || [];
}

// ======================================================================
//  Supabase: 독서 여권 · 문법 · Quiz Queens
// ======================================================================
let sb = null;
function sbClient() {
  if (!sb) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
  return sb;
}
async function sbAll(make) { // 1000줄씩 끝까지 읽기
  const out = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await make().range(from, from + 999);
    if (error) throw error;
    out.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return out;
}
async function sbStart(interactive) {
  const S = state.src.sb;
  const c = sbClient();
  const { data } = await c.auth.getSession();
  if (!data.session) { S.st = "off"; renderConn(); if (interactive) showGsi(); return; }
  S.email = data.session.user.email;
  const adm = await c.rpc("is_admin");
  if (adm.error || !adm.data) { S.st = "err"; S.err = `${S.email} 은(는) 독서 여권 교사 계정이 아니에요.`; renderConn(); return; }
  await sbLoad();
}
function showGsi() {
  const slot = document.getElementById("gsi-sb");
  if (!slot || !window.google?.accounts?.id) { setTimeout(showGsi, 400); return; }
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async resp => {
      const r = await sbClient().auth.signInWithIdToken({ provider: "google", token: resp.credential });
      if (r.error) { state.src.sb = { st: "err", err: r.error.message }; renderConn(); return; }
      sbStart(false);
    },
  });
  slot.innerHTML = "";
  google.accounts.id.renderButton(slot, { theme: "outline", size: "medium", text: "signin_with", locale: "ko" });
}
async function sbLoad() {
  const S = state.src.sb, c = sbClient();
  S.st = "load"; S.err = ""; S.warn = []; renderConn();
  clearApps(["passport", "grammar", "quiz", "speaking", "level"]);
  const warn = (what, e) => { console.warn(what, e); S.warn.push(`${what}: ${e?.message || e}`); };

  try { // 명단 (독서 여권의 roster 표 = 실제 학생 명단)
    let rows;
    const r = await c.from("roster").select("email,name,grade,class_no,student_no").range(0, 4999);
    if (r.error) { const x = await c.rpc("admin_extras"); if (x.error) throw x.error; rows = x.data?.roster || []; } else rows = r.data;
    rows.forEach(s => person(s.email, { name: s.name, grade: s.grade, cls: s.class_no, no: s.student_no }, true));
    S.roster = rows.length;
  } catch (e) { warn("명단", e); }

  try { // 독서 여권 퀴즈 기록
    const titles = {};
    try { const b = await c.from("books").select("id,title").range(0, 4999); (b.data || []).forEach(x => titles[x.id] = x.title); } catch {}
    const rows = await sbAll(() => c.rpc("admin_attempts"));
    rows.forEach(a => addEvent({ e: a.email, a: "passport", t: toMs(a.attempt_at), k: "quiz", title: titles[a.book_id] || a.book_id, s: a.score, n: a.total, p: pct(a.score, a.total), medal: a.medal, book: a.book_id }));
  } catch (e) { warn("독서 여권", e); }

  try { // MY Grammar
    const players = await sbAll(() => c.from("mg_players").select("id,email,real_name,grade,class_no,student_no,xp,streak,best_streak,last_at"));
    state.mgIds = new Map(players.map(p => [p.id, low(p.email)]));
    players.forEach(p => {
      if (!person(p.email, { name: p.real_name, grade: p.grade, cls: p.class_no, no: p.student_no })) return;
      state.snap.grammar.set(low(p.email), { xp: num(p.xp), streak: num(p.streak), last: toMs(p.last_at), stamps: 0 });
    });
    const stamps = await sbAll(() => c.from("mg_stamps").select("user_id,topic_code,earned_at"));
    stamps.forEach(s => {
      const email = state.mgIds.get(s.user_id); if (!email) return;
      const g = state.snap.grammar.get(email); if (g) g.stamps++;
      addEvent({ e: email, a: "grammar", t: toMs(s.earned_at), k: "stamp", title: "단원 스탬프 " + s.topic_code });
    });
  } catch (e) { warn("문법", e); }

  try { // MY Speaking (말하기 연습) — 표가 아직 없으면(SQL 실행 전) 조용히 넘어가요
    const sets = await sbAll(() => c.from("sp_sets").select("id,title,lesson"));
    const st = Object.fromEntries(sets.map(x => [x.id, x]));
    const rows = await sbAll(() => c.from("sp_attempts").select("email,set_id,line_idx,score,created_at"));
    rows.forEach(a => { const x = st[a.set_id] || {}; addEvent({ e: a.email, a: "speaking", t: toMs(a.created_at), k: "line", title: `${x.lesson ? x.lesson + " " : ""}${x.title || "대화문"} · ${a.line_idx + 1}번 줄`, s: a.score, p: a.score, set: a.set_id, line: a.line_idx }); });
  } catch (e) { if (!/sp_sets|sp_attempts|schema cache|does not exist|42P01|PGRST205/i.test((e.message || "") + (e.code || ""))) warn("말하기", e); }

  try { // MY Level Test (레벨 테스트) — 표가 아직 없으면(SQL 실행 전) 조용히 넘어가요
    const rows = await sbAll(() => c.from("lt_attempts").select("email,finished_at,overall_cefr,overall_sub,vocab_size,lexile,ar"));
    rows.forEach(a => addEvent({ e: a.email, a: "level", t: toMs(a.finished_at), k: "test", title: "레벨 테스트", cefr: a.overall_cefr, sub: a.overall_sub, lex: a.lexile, ar: a.ar, vsize: a.vocab_size }));
  } catch (e) { if (!/lt_attempts|schema cache|does not exist|42P01|PGRST205/i.test((e.message || "") + (e.code || ""))) warn("레벨 테스트", e); }

  try { // Quiz Queens (구글 시트) — Supabase 로그인 토큰으로 선생님임을 확인해요
    const { data } = await c.auth.getSession();
    const res = await fetch(QUIZ_GAS, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "getInitialData", token: data.session?.access_token }) });
    const j = await res.json();
    toList(j.users).forEach(u => {
      const email = low(u.email);
      if (!person(email, { name: u.name })) return;
      const answered = num(u.totalAnswered), correct = num(u.correctCount);
      if (!answered && !num(u.xp)) return;
      state.snap.quiz.set(email, { xp: num(u.xp), level: num(u.level), answered, acc: answered ? pct(correct, answered) : null, streak: num(u.streak), last: toMs(u.updatedAt) });
    });
  } catch (e) { warn("Quiz Queens", e); }

  S.st = "ok"; renderConn(); await ensureGrammar(); render(); maybePublish();
}
async function ensureGrammar(range = periodRange()) {
  if (DEMO || state.src.sb.st !== "ok") return null;
  const [a, b] = range, key = a + "-" + (Number.isFinite(b) ? b : "inf");
  if (state.gCache.has(key)) return state.gCache.get(key);
  try {
    const from = new Date(a || Date.parse("2000-01-01")).toISOString();
    const to = new Date(Number.isFinite(b) ? b : Date.now() + DAY).toISOString();
    const rows = await sbAll(() => sbClient().rpc("mg_admin_by_student", { p_from: from, p_to: to }));
    const m = new Map();
    rows.forEach(r => { const e = state.mgIds?.get(r.user_id); if (e) m.set(e, { attempts: num(r.attempts), correct: num(r.correct), xp: num(r.xp), days: num(r.days), last: toMs(r.last_at) }); });
    state.gCache.set(key, m);
    return m;
  } catch (e) { console.warn("문법 기간 통계", e); return null; }
}
function grammarFor(range) {
  const [a, b] = range;
  if (DEMO) {
    const m = new Map();
    for (const [e, list] of state.demoGrammar || []) { const g = list.filter(r => r.t >= a && r.t < b); if (g.length) m.set(e, { attempts: g.length, correct: g.filter(r => r.ok).length, xp: g.length * 10 }); }
    return m;
  }
  return state.gCache.get(a + "-" + (Number.isFinite(b) ? b : "inf")) || null;
}

// ======================================================================
//  Firebase (공통)
// ======================================================================
const fbApps = {};
async function fbInit(id) {
  if (fbApps[id]) return fbApps[id];
  const [{ initializeApp }, A] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-auth.js`),
  ]);
  // Cloze 쪽은 기본 이름([DEFAULT])을 써서 같은 주소의 단어숲·Cloze 로그인 상태를 그대로 이어받아요.
  const app = id === "fc" ? initializeApp(FB_CLOZE) : initializeApp(FB_KAHOOT, "kahoot");
  const auth = A.getAuth(app);
  const user = await new Promise(res => { const off = A.onAuthStateChanged(auth, u => { off(); res(u); }); });
  return (fbApps[id] = { app, auth, A, user });
}
async function fbStart(id, interactive, hint) {
  const S = state.src[id];
  try {
    const f = await fbInit(id);
    if (interactive && (!f.user || hint)) {
      if (f.user) await f.A.signOut(f.auth);
      const p = new f.A.GoogleAuthProvider();
      p.setCustomParameters(hint ? { login_hint: hint, prompt: "select_account" } : { prompt: "select_account" });
      f.user = (await f.A.signInWithPopup(f.auth, p)).user;
    }
    if (!f.user) { S.st = "off"; renderConn(); return; }
    S.email = f.user.email;
    if (!isTeacher(f.user.email)) { S.st = "err"; S.err = `${f.user.email} 은(는) 교사 계정이 아니에요. 로그아웃 후 다시 연결하세요.`; renderConn(); return; }
    await (id === "fc" ? fcLoad(f) : fkLoad(f));
  } catch (e) {
    console.warn(id, e);
    S.st = "err"; S.err = e.code === "auth/popup-blocked" ? "팝업이 막혔어요. 주소창 오른쪽에서 팝업을 허용해 주세요." : (e.message || String(e));
    renderConn();
  }
}
async function fbSignOut(id) {
  const f = fbApps[id]; if (!f) return;
  await f.A.signOut(f.auth); f.user = null; state.src[id] = { st: "off" };
  clearApps(APPS.filter(a => a.src === id).map(a => a.id));
  if (id === "fk") { state.c123Raw = null; state.hubLoaded = false; }
  renderConn(); render();
}

// ---------- 단어숲 · Cloze · 영작문 (Firestore) ----------
async function fcLoad(f) {
  const S = state.src.fc;
  S.st = "load"; S.err = ""; S.warn = []; renderConn();
  clearApps(["vocab", "cloze", "writing"]);
  const F = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-firestore.js`);
  const db = F.getFirestore(f.app);
  const warn = (what, e) => { console.warn(what, e); S.warn.push(`${what}: ${e?.code || e?.message || e}`); };
  const uidEmail = new Map();
  const no5 = no => /^\d{5}$/.test(String(no || "")) ? { grade: +String(no)[0], cls: +String(no).slice(1, 3), no: +String(no).slice(3) } : {};

  try { // Cloze 프로필 (학번 5자리 · 실명)
    (await F.getDocs(F.collection(db, "users"))).forEach(d => {
      const u = d.data(); if (!u.email) return;
      uidEmail.set(d.id, low(u.email));
      person(u.email, { name: u.realName, ...no5(u.studentNo) });
    });
  } catch (e) { warn("Cloze 프로필", e); }

  try { // 단어숲 학생 + 누적 통계
    (await F.getDocs(F.query(F.collection(db, "vocab_users"), F.where("role", "==", "student")))).forEach(d => {
      const u = d.data(); if (!u.email) return;
      uidEmail.set(d.id, low(u.email));
      if (!person(u.email, { name: u.name, grade: u.grade, cls: u.classNo, no: u.number })) return;
      const st = u.stats || {};
      if (!num(st.xp) && !st.lastDay) return;
      state.snap.vocab.set(low(u.email), { xp: num(st.xp), streak: num(st.streak), learned: num(st.learned), mastered: num(st.mastered), last: st.lastDay ? kstart(st.lastDay) + 12 * 3600e3 : 0 });
    });
  } catch (e) { warn("단어숲 학생", e); }

  try { // 단어숲 단원 테스트 + 영작문 제출 (같은 컬렉션)
    (await F.getDocs(F.collection(db, "vocab_results"))).forEach(d => {
      const r = d.data();
      if (r.appTag === "writing1_submission" || r.bookId === "__writing1__") {
        person(r.studentEmail, { name: r.studentName, grade: r.grade, cls: r.classNum, no: r.studentNumber });
        addEvent({ e: r.studentEmail, a: "writing", t: toMs(r.createdAtMs || r.ts), k: "essay", title: r.topic || r.koreanPrompt || "영작문", s: num(r.score), cefr: r.cefrLevel });
      } else {
        const email = uidEmail.get(r.uid); if (!email) return;
        const p = r.pct ?? pct(r.score, r.total);
        addEvent({ e: email, a: "vocab", t: toMs(r.ts), k: "test", title: `${r.bookId || "단어장"} ${r.lesson === "mix" ? "섞어서" : (r.lesson ?? "") + "과"}`, s: r.score, n: r.total, p });
      }
    });
  } catch (e) { warn("단어숲 결과", e); }

  // Cloze 제출: 보안 규칙상 "로그인한 계정이 만든 테스트"의 제출만 읽을 수 있어요.
  // 테스트에는 만든 사람 이메일(ownerEmail)이 있어서, 다른 교사 계정으로 만든 테스트가 있으면 알려 줘요.
  S.clozeOther = {};
  try {
    (await F.getDocs(F.collection(db, "tests"))).forEach(d => {
      const o = low(d.data().ownerEmail);
      if (o && o !== low(f.user.email)) S.clozeOther[o] = (S.clozeOther[o] || 0) + 1;
    });
  } catch (e) { warn("Cloze 테스트 목록", e); }
  {
    try {
      (await F.getDocs(F.query(F.collection(db, "submissions"), F.where("ownerUid", "==", f.user.uid)))).forEach(d => {
        const s = d.data();
        person(s.email, { name: s.realName, ...no5(s.studentNo) });
        addEvent({ e: s.email, a: "cloze", t: toMs(s.submittedAt) || toMs(s.startedAt), k: "test", title: s.testTitle || s.testCode, s: s.score, n: s.total, p: pct(s.score, s.total) });
      });
    } catch (e) { warn("Cloze 제출", e); }
  }

  S.st = "ok"; renderConn(); render(); maybePublish();
}

// ---------- Kahoot · Class123 · 보상 (Realtime Database) ----------
let RT = null; // { D, db }
async function fkLoad(f) {
  const S = state.src.fk;
  S.st = "load"; S.err = ""; S.warn = []; renderConn();
  clearApps(["kahoot", "c123"]);
  const D = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`);
  const db = D.getDatabase(f.app);
  RT = { D, db };
  const read = async p => (await D.get(D.ref(db, p))).val();
  const warn = (what, e) => { console.warn(what, e); S.warn.push(`${what}: ${e?.code || e?.message || e}`); };

  try { toList(await read("schoolRoster")).forEach(s => person(s.email, { name: s.name, grade: s.grade, cls: s.classNum, no: s.studentNum })); }
  catch (e) { warn("Kahoot 명단", e); }

  try { // 수업 시간 라이브 퀴즈
    toList(await read("teacherData/quizHistory")).forEach(ss => {
      // Kahoot 의 "샘플 기록 만들기"는 sessionId 가 sess_시각_난수 이고 가짜 학생(예: 2학년 7반)으로 채워져요 → 빼요
      const sid = String(ss.sessionId || "");
      if (/^sess_\d+_\d+$/.test(sid) || String(ss.playedAt || "").includes("샘플")) return;
      const t = num((sid.match(/^sess_(\d+)/) || [])[1]) || parseKoDate(ss.playedAt);
      if (!t) return;
      const res = toList(ss.results).slice().sort((a, b) => num(b.score) - num(a.score));
      res.forEach((r, i) => {
        if (!r.email) return;
        person(r.email, { name: r.name, grade: r.grade, cls: r.classNum, no: r.studentNum });
        addEvent({ e: r.email, a: "kahoot", t, k: "live", title: ss.quizTitle || "라이브 퀴즈", s: r.correctCount, n: r.totalQuestions, p: num(r.accuracy), rank: i + 1, of: res.length });
      });
    });
  } catch (e) { warn("Kahoot 수업 기록", e); }

  try { // 스스로 풀기 과제
    const hw = (await read("homework")) || {};
    const all = (await read("homeworkResults")) || {};
    Object.entries(all).forEach(([hid, byStu]) => {
      const title = hw[hid]?.title || hw[hid]?.quizTitle || "Kahoot 과제";
      Object.values(byStu || {}).forEach(r => {
        if (!r?.email) return;
        person(r.email, { name: r.name, grade: r.grade, cls: r.classNum, no: r.studentNum });
        addEvent({ e: r.email, a: "kahoot", t: toMs(r.lastAt), k: "hw", title: title + " (과제)", s: num(r.bestScore), n: num(r.total), p: pct(num(r.bestScore), num(r.total)), tries: num(r.attempts) });
      });
    });
  } catch (e) { warn("Kahoot 과제", e); }

  try { await readC123(); } catch (e) { warn("Class123", e); }
  try { await loadHub(); } catch (e) { warn("보상 설정", e); }

  S.st = "ok"; renderConn(); render(); maybePublish();
}
async function readC123() {
  if (DEMO) return;
  const v = (await RT.D.get(RT.D.ref(RT.db, `class123_plus/${C123_WS}/classes`))).val();
  // 배열이든 객체든 원래 위치(키)를 기억해 둬요 (지급할 때 그 위치에 써요)
  state.c123Raw = v ? Object.entries(v).filter(([, c]) => c).map(([k, c]) => ({ ...c, _k: k })) : [];
}
// Class123 학생은 이메일이 없어서 반 이름(예: "2학년 3반")과 이름(또는 번호)으로 명단과 맞춰요
function matchC123() {
  state.snap.c123 = new Map(); state.c123Map = new Map(); state.c123Unmatched = [];
  const raw = state.c123Raw; if (!raw) return;
  const byKey = new Map(), byName = new Map();
  for (const p of state.people.values()) {
    if (p.grade && p.cls && p.no) { const k = `${p.grade}-${p.cls}-${p.no}`; if (!byKey.has(k) || p.roster) byKey.set(k, p); }
    if (p.name) { const k = `${p.grade}-${p.cls}-${p.name}`; const o = byName.get(k); byName.set(k, o === undefined ? p : (o && o.roster && !p.roster ? o : (p.roster && !(o && o.roster) ? p : null))); }
  }
  raw.forEach(c => {
    const nm = String(c.name || "");
    const g = num(c.grade) || num((nm.match(/(\d)\s*학년/) || [])[1]) || num((nm.match(/^(\d)\s*-\s*\d+/) || [])[1]);
    const cl = num((nm.match(/(\d+)\s*반/) || [])[1]) || num((nm.match(/^\d\s*-\s*(\d+)/) || [])[1]);
    toList(c.students).forEach(s => {
      const p = byName.get(`${g}-${cl}-${String(s.name || "").trim()}`) || byKey.get(`${g}-${cl}-${num(s.number)}`);
      if (!p) { state.c123Unmatched.push(`${nm} ${s.number}번 ${s.name}`); return; }
      const prev = state.snap.c123.get(p.email) || { e: 0, m: 0 };
      state.snap.c123.set(p.email, { e: prev.e + num(s.visibleEussuk), m: prev.m + num(s.visibleMeossuk) });
      if (!state.c123Map.has(p.email)) state.c123Map.set(p.email, { ck: c._k, cid: c.id, sid: s.id, cname: nm });
    });
  });
}

// ======================================================================
//  집계
// ======================================================================
// 실제 학생: 명단에 있거나(약 180명) 어느 앱이든 실제 기록이 있는 학교 계정
const isHidden = e => Object.values(state.hub.hidden || {}).includes(e);
// 명단 밖 계정은 다음 두 가지를 모두 만족해야 학생으로 봐요 (테스트·교직원 계정 걸러내기)
//   1) 이메일이 학번 9자리 (예: 202610101@smy.ms.kr) — englee@ 같은 계정은 빠져요
//   2) 명단을 불러왔다면, 그 학년·반이 명단에 실제로 있는 반 — 2학년 10반처럼 없는 반은 빠져요
let rosterCls = null, rosterN = -1;
function rosterClasses() {
  const n = state.people.size;
  if (rosterN !== n) { rosterN = n; rosterCls = new Set([...state.people.values()].filter(p => p.roster && p.grade && p.cls).map(p => p.grade + "-" + p.cls)); }
  return rosterCls;
}
function isReal(p, M) {
  if (isHidden(p.email)) return false;
  if (p.roster) return true;
  if (!((M.get(p.email)?.last || 0) > 0)) return false;
  if (!/^\d{9}@smy\.ms\.kr$/.test(p.email)) return false;
  const rc = rosterClasses();
  return !rc.size || rc.has(p.grade + "-" + p.cls);
}
// 테스트 계정 숨기기/다시 보이기 (보상 설정과 같은 곳에 저장)
async function setHidden(email, hide) {
  if (!DEMO && state.src.fk.st !== "ok") return toast("숨기기는 Firebase (Kahoot)를 연결해야 저장돼요.");
  const k = ekey(email);
  state.hub.hidden ||= {};
  if (hide) state.hub.hidden[k] = email; else delete state.hub.hidden[k];
  if (!DEMO) { try { await RT.D.set(RT.D.ref(RT.db, `${HUB_PATH}/hidden/${k}`), hide ? email : null); } catch (e) { return toast("저장 실패: " + e.message); } }
  toast(hide ? "숨겼어요. 표·보상·학생 페이지에서 빠져요." : "다시 보이게 했어요.");
  $("#modal").classList.add("hidden"); render(); maybePublish(true);
}
function visiblePeople(M) {
  const f = state.f, q = low(f.q);
  return [...state.people.values()].filter(p => isReal(p, M) &&
    (!f.grade || p.grade === +f.grade) && (!f.cls || p.cls === +f.cls) &&
    (!q || low(p.name).includes(q) || p.email.includes(q)));
}
function aggregate(range = periodRange()) {
  const [a, b] = range;
  const inP = t => t >= a && t < b;
  const M = new Map();
  const get = e => { let x = M.get(e); if (!x) { x = { apps: {}, last: 0, lastApp: {} }; M.set(e, x); } return x; };
  const slot = (x, id) => (x.apps[id] ||= { n: 0, ps: [], items: [] });
  for (const ev of state.events) {
    const x = get(ev.e);
    if (ev.t > x.last) x.last = ev.t;
    if (ev.t > (x.lastApp[ev.a] || 0)) x.lastApp[ev.a] = ev.t;
    if (ev.a === "passport" && isMedal(ev.medal)) (x.allMedals ||= new Set()).add(ev.book);
    if (!inP(ev.t)) continue;
    const s = slot(x, ev.a);
    s.n++; if (ev.p != null) s.ps.push(ev.p); s.items.push(ev);
  }
  // 누적형 기록의 마지막 활동 시각도 반영
  for (const id of ["grammar", "quiz", "vocab"]) for (const [e, v] of state.snap[id]) {
    if (!v.last) continue;
    const x = get(e); if (v.last > x.last) x.last = v.last; if (v.last > (x.lastApp[id] || 0)) x.lastApp[id] = v.last;
  }
  const g = grammarFor(range);
  if (g) for (const [e, r] of g) {
    if (!r.attempts) continue;
    const x = get(e), s = slot(x, "grammar");
    s.attempts = r.attempts; s.correct = r.correct; s.xp = r.xp;
    if (r.last && r.last > x.last) x.last = r.last;
  }
  for (const [e, v] of state.snap.quiz) if (inP(v.last)) slot(get(e), "quiz").touched = true;
  for (const [e, v] of state.snap.vocab) if (inP(v.last)) slot(get(e), "vocab").touched = true;
  return M;
}
function isActive(x, id) {
  const s = x?.apps[id]; if (!s) return false;
  if (id === "grammar") return (s.attempts || 0) > 0 || s.n > 0;
  return s.n > 0 || !!s.touched;
}
function kahootStats(items) {
  const live = items.filter(e => e.k === "live"), hw = items.filter(e => e.k === "hw");
  return { live: live.length, hw: hw.length, acc: avg(live.map(e => e.p)), top3: live.filter(e => e.rank <= 3).length, top10: live.filter(e => e.rank <= 10).length, best: live.length ? Math.min(...live.map(e => e.rank)) : null };
}
// 앱 한 칸에 보여 줄 값: main(정렬용 숫자), html, csv
function cell(id, email, x) {
  const s = x?.apps[id], on = isActive(x, id);
  const none = { main: -1, html: "—", csv: "", on: false };
  switch (id) {
    case "passport": {
      const medals = new Set((s?.items || []).filter(e => isMedal(e.medal)).map(e => e.book)).size;
      const gold = new Set((s?.items || []).filter(e => e.medal === "gold").map(e => e.book)).size;
      const all = x?.allMedals?.size || 0;
      if (!s && !all) return none;
      return { main: medals, on, html: `<span class="m">🏅${medals}</span><span class="sub">${s ? s.n + "회" : "0회"}${gold ? " · 금" + gold : ""} · 누적 ${all}</span>`, csv: `메달 ${medals} / 시도 ${s?.n || 0} / 누적 ${all}` };
    }
    case "grammar": {
      const g = state.snap.grammar.get(email);
      const att = s?.attempts || 0, acc = att ? pct(s.correct, att) : null, stamps = s?.n || 0;
      if (!g && !att && !stamps) return none;
      return { main: att, on, html: `<span class="m">${att}문제${acc != null ? " · " + acc + "%" : ""}</span><span class="sub">스탬프 +${stamps} · 누적 ${g?.stamps || 0}</span>`, csv: `${att}문제 ${acc ?? ""}% / 스탬프 ${stamps}` };
    }
    case "quiz": {
      const q = state.snap.quiz.get(email); if (!q) return none;
      return { main: q.xp, on, html: `<span class="m">XP ${q.xp.toLocaleString()}</span><span class="sub">${q.answered}문제${q.acc != null ? " · " + q.acc + "%" : ""} · ${fmtWhen(q.last)}</span>`, csv: `XP ${q.xp} / ${q.answered}문제 ${q.acc ?? ""}%` };
    }
    case "vocab": {
      const v = state.snap.vocab.get(email), n = s?.n || 0, a = avg(s?.ps || []);
      if (!v && !n) return none;
      return { main: n, on, html: `<span class="m">${n}회${a != null ? " · " + Math.round(a) + "%" : ""}</span><span class="sub">XP ${v?.xp ?? 0} · 🔥${v?.streak ?? 0} · 단어 ${v?.learned ?? 0}</span>`, csv: `테스트 ${n} ${a != null ? Math.round(a) + "%" : ""} / XP ${v?.xp ?? 0}` };
    }
    case "cloze": case "writing": {
      if (!s) return x?.lastApp[id] ? { ...none, html: `<span class="sub">${fmtWhen(x.lastApp[id])}</span>`, main: 0 } : none;
      const a = id === "cloze" ? avg(s.ps) : avg(s.items.map(e => e.s));
      const extra = id === "cloze" ? `만점 ${s.items.filter(e => e.n && e.s === e.n).length}` : (s.items.map(e => e.cefr).filter(Boolean).pop() || "");
      return { main: s.n, on, html: `<span class="m">${s.n}${id === "cloze" ? "회" : "편"}${a != null ? " · " + Math.round(a) + (id === "cloze" ? "%" : "점") : ""}</span><span class="sub">${esc(extra)}</span>`, csv: `${s.n} / ${a != null ? Math.round(a) : ""}` };
    }
    case "kahoot": {
      if (!s) return x?.lastApp[id] ? { ...none, html: `<span class="sub">${fmtWhen(x.lastApp[id])}</span>`, main: 0 } : none;
      const k = kahootStats(s.items);
      return { main: s.n, on, html: `<span class="m">${k.live}판${k.acc != null ? " · " + Math.round(k.acc) + "%" : ""}</span><span class="sub">🏆3위 안 ${k.top3} · 10위 안 ${k.top10} · 과제 ${k.hw}</span>`, csv: `수업 ${k.live} / 정답률 ${k.acc != null ? Math.round(k.acc) + "%" : ""} / 3위 안 ${k.top3} / 10위 안 ${k.top10} / 과제 ${k.hw}` };
    }
    case "speaking": {
      if (!s) return x?.lastApp[id] ? { ...none, html: `<span class="sub">${fmtWhen(x.lastApp[id])}</span>`, main: 0 } : none;
      const a = avg(s.ps), lines = new Set(s.items.map(e => e.set + ":" + e.line)).size;
      return { main: s.n, on, html: `<span class="m">${s.n}번${a != null ? " · " + Math.round(a) + "점" : ""}</span><span class="sub">${lines}줄 연습</span>`, csv: `${s.n}번 / 평균 ${a != null ? Math.round(a) : ""} / ${lines}줄` };
    }
    case "level": { // 레벨은 기간과 상관없이 가장 최근 결과를 보여 줘요
      const all = evsOf(email).filter(e => e.a === "level");
      if (!all.length) return none;
      const l = all.slice().sort((a, b) => b.t - a.t)[0];
      return { main: l.lex ?? 0, on, html: `<span class="m">${lvTxt(l)}</span><span class="sub">${lexTxt(l.lex)} · 단어 ${num(l.vsize).toLocaleString()}${all.length > 1 ? " · " + all.length + "회" : ""}</span>`, csv: `${lvTxt(l)} / ${lexTxt(l.lex)} / AR ${l.ar ?? ""} / 단어 ${l.vsize ?? ""}` };
    }
    case "c123": {
      const c = state.snap.c123.get(email); if (!c) return none;
      return { main: c.e, on: false, html: `<span class="m">⭐${c.e}</span><span class="sub">🌧️${c.m}</span>`, csv: `으쓱 ${c.e} / 머쓱 ${c.m}` };
    }
  }
  return none;
}
const shownApps = () => APPS.filter(a => !state.hidden.has(a.id));
const loadedApps = () => APPS.filter(a => DEMO || state.src[a.src].st === "ok");
const sortPeople = list => list.sort((a, b) => (a.grade || 99) - (b.grade || 99) || (a.cls || 99) - (b.cls || 99) || (a.no || 999) - (b.no || 999) || a.email.localeCompare(b.email));

// ======================================================================
//  🎁 보상 규칙 → 지급 대기함 → Class123
// ======================================================================
async function loadHub() {
  if (DEMO) return;
  const v = (await RT.D.get(RT.D.ref(RT.db, HUB_PATH))).val() || {};
  state.hub = { rules: v.rules || {}, granted: v.granted || {}, log: v.log || {}, hidden: v.hidden || {} };
  if (!Object.keys(state.hub.rules).length) { // 처음: 추천 규칙을 "꺼진 상태"로 만들어 둬요
    const today = kday(Date.now());
    DEFAULT_RULES.forEach((r, i) => { const id = "r" + (i + 1) + "_" + uid(); state.hub.rules[id] = { ...r, on: false, since: today, grade: "", order: i }; });
    await RT.D.set(RT.D.ref(RT.db, HUB_PATH + "/rules"), state.hub.rules);
  }
  state.hubLoaded = true;
}
async function saveRule(id, rule) {
  if (rule) state.hub.rules[id] = rule; else delete state.hub.rules[id];
  if (DEMO) return;
  await RT.D.set(RT.D.ref(RT.db, `${HUB_PATH}/rules/${id}`), rule || null);
}
// 규칙 기준에 맞는 기록 수 (규칙 시작일 이후만)
function ruleCount(rule, email) {
  const since = rule.since ? kstart(rule.since) : 0, min = num(rule.min);
  const evs = evsOf(email);
  switch (rule.metric) {
    case "passport_medal": case "passport_gold": {
      const first = new Map();
      evs.forEach(e => { if (e.a !== "passport") return; if (rule.metric === "passport_gold" ? e.medal !== "gold" : !isMedal(e.medal)) return; if (!first.has(e.book) || e.t < first.get(e.book)) first.set(e.book, e.t); });
      return [...first.values()].filter(t => t >= since).length;
    }
    case "grammar_stamp": return evs.filter(e => e.a === "grammar" && e.k === "stamp" && e.t >= since).length;
    case "vocab_test": return evs.filter(e => e.a === "vocab" && e.t >= since && num(e.p) >= min).length;
    case "cloze_test": return evs.filter(e => e.a === "cloze" && e.t >= since && num(e.p) >= min).length;
    case "writing_submit": return evs.filter(e => e.a === "writing" && e.t >= since && num(e.s) >= min).length;
    case "kahoot_top3": return evs.filter(e => e.a === "kahoot" && e.k === "live" && e.t >= since && e.rank <= 3).length;
    case "kahoot_top10": return evs.filter(e => e.a === "kahoot" && e.k === "live" && e.t >= since && e.rank <= 10).length;
    case "kahoot_hw": return evs.filter(e => e.a === "kahoot" && e.k === "hw" && e.t >= since && num(e.p) >= min).length;
  }
  return 0;
}
const ruleReady = r => r.on && METRICS[r.metric] && loadedApps().some(a => a.id === METRICS[r.metric].app);
const rulesSorted = () => Object.entries(state.hub.rules).sort((a, b) => num(a[1].order) - num(b[1].order) || a[0].localeCompare(b[0]));
function pendingList(M) {
  const out = [];
  const people = [...state.people.values()].filter(p => isReal(p, M));
  for (const [rid, r] of rulesSorted()) {
    if (!ruleReady(r)) continue;
    const every = Math.max(1, num(r.every)), give = Math.max(1, num(r.give));
    for (const p of people) {
      if (r.grade && p.grade !== +r.grade) continue;
      const c = ruleCount(r, p.email); if (!c) continue;
      const entitled = Math.floor(c / every) * give, got = num(state.hub.granted?.[rid]?.[ekey(p.email)]);
      if (entitled > got) out.push({ rid, r, p, count: c, n: entitled - got, got, target: state.c123Map.get(p.email) });
    }
  }
  return out;
}
function ruleText(r) {
  const m = METRICS[r.metric]; if (!m) return "알 수 없는 기준";
  return `${m.name}${m.min !== undefined && num(r.min) ? ` (${r.min}${m.minUnit})` : ""} ${r.every}${m.unit}마다 → 으쓱 ${r.give}`;
}
// 선택한 항목을 Class123 에 지급(또는 건너뛰기)
async function grant(items, skip) {
  if (!items.length) return;
  const ok = [], fail = [];
  const now = new Date(Date.now() + KST).toISOString();
  const stamp = now.slice(0, 10) + " " + now.slice(11, 16);
  if (!skip) {
    const byClass = new Map();
    items.forEach(it => { if (!it.target) { fail.push(it); return; } (byClass.get(it.target.ck) || byClass.set(it.target.ck, []).get(it.target.ck)).push(it); });
    for (const [ck, list] of byClass) {
      const batchId = "hub_" + uid();
      const apply = cur => {
        if (!cur || cur.id !== list[0].target.cid) return cur; // 반 순서가 바뀌었으면 손대지 않아요
        const students = Array.isArray(cur.students) ? cur.students : Object.values(cur.students || {});
        const hist = Array.isArray(cur.history) ? cur.history : Object.values(cur.history || {});
        const add = [];
        list.forEach(it => {
          const stu = students.find(s => s && s.id === it.target.sid); if (!stu) return;
          stu.visibleEussuk = num(stu.visibleEussuk) + it.n;
          cur.visibleClassEussuk = num(cur.visibleClassEussuk) + it.n;
          add.push({ id: "h_" + uid(), batchId, studentId: stu.id, studentName: stu.name, studentNumber: stu.number, cardId: "hub_auto", type: "eussuk", category: "앱 연동", icon: "🎁", cardTitle: it.r.label || METRICS[it.r.metric].name, count: it.n, memo: `MY Teacher Hub 자동 보상: ${ruleText(it.r)} (기록 ${it.count}${METRICS[it.r.metric].unit})`, important: false, timestamp: stamp });
        });
        cur.students = students; cur.history = [...add, ...hist];
        return cur;
      };
      try {
        if (DEMO) { const c = state.c123Raw.find(c => c._k === ck); apply(c); }
        else {
          const res = await RT.D.runTransaction(RT.D.ref(RT.db, `class123_plus/${C123_WS}/classes/${ck}`), apply);
          if (!res.committed || res.snapshot.val()?.id !== list[0].target.cid) throw new Error("class moved");
        }
        ok.push(...list);
      } catch (e) { console.warn("grant", e); fail.push(...list); }
    }
  } else ok.push(...items);
  // 지급(건너뛰기) 기록
  for (const it of ok) {
    const k = ekey(it.p.email);
    state.hub.granted[it.rid] ||= {};
    state.hub.granted[it.rid][k] = num(state.hub.granted[it.rid][k]) + it.n;
    const log = { t: Date.now(), email: it.p.email, name: it.p.name || "", rid: it.rid, label: it.r.label || METRICS[it.r.metric].name, n: it.n, skipped: !!skip, by: state.src.fk.email || "demo" };
    const lid = "l" + uid(); state.hub.log[lid] = log;
    if (!DEMO) {
      await RT.D.runTransaction(RT.D.ref(RT.db, `${HUB_PATH}/granted/${it.rid}/${k}`), v => num(v) + it.n);
      await RT.D.set(RT.D.ref(RT.db, `${HUB_PATH}/log/${lid}`), log);
    }
  }
  if (!DEMO) { try { await readC123(); } catch {} }
  toast(skip ? `${ok.length}건을 지급하지 않고 넘겼어요.` : `${ok.length}건 지급 완료${fail.length ? ` · ${fail.length}건은 Class123에서 학생을 못 찾아 남겨 뒀어요` : ""} 🎁`);
  render(); maybePublish(true);
}

// ======================================================================
//  📤 학생 페이지 (MY English Journey) 요약 올리기
// ======================================================================
let pubT = null;
function maybePublish(force) {
  if (DEMO) return;
  if (["sb", "fc", "fk"].some(id => state.src[id].st !== "ok")) return; // 셋 다 연결됐을 때만
  if (!force && state.pub.at && Date.now() - state.pub.at < 10 * 60e3) return;
  clearTimeout(pubT); pubT = setTimeout(publishSummaries, 1500);
}
function studentSummary(p, Mall, Mweek) {
  const x = Mall.get(p.email), w = Mweek.get(p.email), apps = {};
  const items = id => x?.apps[id]?.items || [];
  const last = id => x?.lastApp[id] || 0;
  const pass = items("passport");
  if (pass.length) apps.passport = { tries: pass.length, medals: new Set(pass.filter(e => isMedal(e.medal)).map(e => e.book)).size, gold: new Set(pass.filter(e => e.medal === "gold").map(e => e.book)).size, last: last("passport") };
  const g = state.snap.grammar.get(p.email); if (g) apps.grammar = { xp: g.xp, stamps: g.stamps, streak: g.streak, last: last("grammar") };
  const q = state.snap.quiz.get(p.email); if (q) apps.quiz = { xp: q.xp, level: q.level, answered: q.answered, acc: q.acc, last: q.last };
  const v = state.snap.vocab.get(p.email), vt = items("vocab");
  if (v || vt.length) apps.vocab = { xp: v?.xp || 0, streak: v?.streak || 0, learned: v?.learned || 0, mastered: v?.mastered || 0, tests: vt.length, avg: vt.length ? Math.round(avg(vt.map(e => num(e.p)))) : null, last: last("vocab") };
  const cz = items("cloze"); if (cz.length) apps.cloze = { n: cz.length, avg: Math.round(avg(cz.map(e => num(e.p)))), perfect: cz.filter(e => e.n && e.s === e.n).length, last: last("cloze") };
  const wr = items("writing"); if (wr.length) apps.writing = { n: wr.length, avg: Math.round(avg(wr.map(e => num(e.s)))), cefr: wr.slice().sort((a, b) => b.t - a.t)[0]?.cefr || "", last: last("writing") };
  const spk = items("speaking"); if (spk.length) apps.speaking = { n: spk.length, avg: Math.round(avg(spk.map(e => num(e.s)))), lines: new Set(spk.map(e => e.set + ":" + e.line)).size, last: last("speaking") };
  const lt = items("level").slice().sort((a, b) => b.t - a.t); if (lt.length) apps.level = { n: lt.length, cefr: lt[0].cefr, sub: lt[0].sub, lex: lt[0].lex, ar: lt[0].ar, vsize: lt[0].vsize, last: lt[0].t };
  const kh = items("kahoot"); if (kh.length) { const k = kahootStats(kh); apps.kahoot = { live: k.live, hw: k.hw, acc: k.acc != null ? Math.round(k.acc) : null, top3: k.top3, top10: k.top10, best: k.best, last: last("kahoot") }; }
  const c = state.snap.c123.get(p.email); if (c) apps.c123 = { e: c.e, m: c.m };
  const week = {}; APPS.forEach(a => { if (isActive(w, a.id)) week[a.id] = a.id === "grammar" ? (w.apps.grammar.attempts || w.apps.grammar.n) : (w.apps[a.id].n || 1); });
  const next = [];
  for (const [rid, r] of rulesSorted()) {
    if (!ruleReady(r) || (r.grade && p.grade !== +r.grade)) continue;
    const cnt = ruleCount(r, p.email), every = Math.max(1, num(r.every));
    next.push({ label: r.label || METRICS[r.metric].name, text: ruleText(r), have: cnt % every, need: every, give: num(r.give), app: METRICS[r.metric].app });
  }
  const rewards = Object.values(state.hub.log || {}).filter(l => l.email === p.email && !l.skipped).sort((a, b) => b.t - a.t).slice(0, 10).map(l => ({ t: l.t, label: l.label, n: l.n }));
  const recent = evsOf(p.email).slice().sort((a, b) => b.t - a.t).slice(0, 15).map(e => ({ a: e.a, t: e.t, title: String(e.title || "").slice(0, 60), v: evValue(e) }));
  return { name: p.name, grade: p.grade, cls: p.cls, no: p.no, apps, week, next, rewards, recent, last: x?.last || 0 };
}
async function publishSummaries() {
  state.pub = { st: "load", at: state.pub.at, msg: "학생 페이지 자료를 올리는 중…" }; renderPub();
  try {
    const wk = rangeOf("week"); await ensureGrammar(wk);
    const Mall = aggregate([0, Infinity]), Mweek = aggregate(wk);
    const rows = [...state.people.values()].filter(p => isReal(p, Mall)).map(p => ({ email: p.email, data: studentSummary(p, Mall, Mweek), updated_at: new Date().toISOString() }));
    for (let i = 0; i < rows.length; i += 100) {
      const { error } = await sbClient().from("hub_summary").upsert(rows.slice(i, i + 100), { onConflict: "email" });
      if (error) throw error;
    }
    // 이번 목록에 없는 줄(예: 예전에 올라간 연습용 가짜 학생)은 지워요
    const keep = new Set(rows.map(r => r.email));
    const old = await sbAll(() => sbClient().from("hub_summary").select("email"));
    const gone = old.map(r => r.email).filter(e => !keep.has(e));
    for (let i = 0; i < gone.length; i += 100) {
      const { error } = await sbClient().from("hub_summary").delete().in("email", gone.slice(i, i + 100));
      if (error) throw error;
    }
    state.pub = { st: "ok", at: Date.now(), msg: `학생 ${rows.length}명의 요약을 올렸어요.${gone.length ? ` (명단 밖 ${gone.length}줄 정리)` : ""}` };
  } catch (e) {
    console.warn("publish", e);
    const missing = /hub_summary|relation|schema cache|42P01|PGRST205/i.test(e.message || e.code || "");
    state.pub = { st: "err", at: Date.now(), msg: missing ? "Supabase에 hub_summary 표가 아직 없어요. teacher/supabase_hub_summary.sql 을 SQL Editor에서 한 번 실행해 주세요." : (e.message || String(e)) };
  }
  renderPub();
}
function renderPub() {
  const el = document.getElementById("pubBox"); if (!el) return;
  const s = state.pub;
  const chip = { ok: `<span class="chip ok">✅ 올림</span>`, load: `<span class="chip load">⏳ 올리는 중</span>`, err: `<span class="chip err">⚠️ 오류</span>` }[s.st] || `<span class="chip off">대기</span>`;
  el.innerHTML = `<div class="src-h"><b>📤 학생 페이지</b>${chip}</div>
    <div class="apps">학생이 <a href="../me/" target="_blank">MY English Journey</a>에서 자기 기록을 봐요. 세 저장소가 모두 연결되면 자동으로 올려요.</div>
    ${s.msg ? `<div class="${s.st === "err" ? "err-msg" : "small muted"}">${esc(s.msg)}${s.at && s.st === "ok" ? " · " + fmtWhen(s.at) : ""}</div>` : ""}
    <div><button class="btn sm navy" id="btnPub" ${["sb", "fc", "fk"].some(id => state.src[id].st !== "ok") ? "disabled" : ""}>지금 올리기</button></div>`;
  const b = document.getElementById("btnPub"); if (b) b.onclick = () => maybePublish(true);
}

// ======================================================================
//  화면
// ======================================================================
function renderConn() {
  const box = $("#conn");
  if (DEMO) { box.innerHTML = `<div class="demo-banner">🧪 체험 모드예요. 가상의 학생 기록으로 화면을 보여 줘요. 보상 지급도 이 화면 안에서만 해 볼 수 있어요. 실제 기록은 <a href="./">이 주소</a>에서 선생님 계정으로 연결하면 보여요.</div>`; return; }
  box.innerHTML = Object.entries(SOURCES).map(([id, d]) => {
    const S = state.src[id];
    const chip = { ok: `<span class="chip ok">✅ 연결됨</span>`, load: `<span class="chip load">⏳ 불러오는 중</span>`, err: `<span class="chip err">⚠️ 오류</span>`, off: `<span class="chip off">연결 안 됨</span>` }[S.st];
    let act = "";
    if (S.st === "off" || S.st === "err") act = id === "sb" ? `<div id="gsi-sb" class="gsi-slot"></div><button class="btn sm navy" data-conn="sb">Google로 연결</button>`
      : `<button class="btn sm navy" data-conn="${id}">Google로 연결</button>`;
    if (S.st === "ok") act = `<span class="small muted">${esc(S.email || "")}</span> <button class="btn sm" data-out="${id}">로그아웃</button>`;
    const other = id === "fc" && S.st === "ok" ? Object.entries(S.clozeOther || {}).filter(([e]) => isTeacher(e)) : [];
    const clozeNote = other.map(([e, n]) => `<div class="err-msg">${esc(e)} 계정으로 만든 Cloze 테스트 ${n}개의 제출은 지금 안 보여요(보안 규칙). <button class="btn sm" data-switch="${esc(e)}">${esc(e)}로 바꾸기</button></div>`).join("");
    return `<div class="card src"><div class="src-h"><b>${d.name}</b>${chip}</div><div class="apps">${d.desc}${id === "sb" && S.roster ? ` · 명단 ${S.roster}명` : ""}</div>
      ${S.err ? `<div class="err-msg">${esc(S.err)}</div>` : ""}
      ${(S.warn || []).map(w => `<div class="err-msg">일부 못 읽음 · ${esc(w)}</div>`).join("")}
      ${clozeNote}<div>${act}</div></div>`;
  }).join("") + `<div class="card src" id="pubBox"></div>`;
  renderPub();
  box.querySelectorAll("[data-conn]").forEach(b => b.onclick = () => {
    const id = b.dataset.conn;
    if (id === "sb") { b.remove(); showGsi(); toast("위의 Google 버튼을 눌러 선생님 계정으로 로그인하세요."); }
    else fbStart(id, true, id === "fc" ? "tfellow@smy.ms.kr" : ""); // Cloze 테스트는 학교 계정으로 로그인해 만들었어요
  });
  box.querySelectorAll("[data-switch]").forEach(b => b.onclick = () => fbStart("fc", true, b.dataset.switch));
  box.querySelectorAll("[data-out]").forEach(b => b.onclick = async () => {
    const id = b.dataset.out;
    if (id === "sb") { await sbClient().auth.signOut(); state.src.sb = { st: "off" }; clearApps(["passport", "grammar", "quiz", "speaking", "level"]); renderConn(); render(); }
    else fbSignOut(id);
  });
}

function renderFilters(M) {
  const real = [...state.people.values()].filter(p => isReal(p, M));
  const grades = [...new Set(real.map(p => p.grade).filter(Boolean))].sort();
  const g = $("#fGrade"), c = $("#fClass");
  g.innerHTML = `<option value="">전체</option>` + grades.map(x => `<option value="${x}" ${state.f.grade == x ? "selected" : ""}>${x}학년</option>`).join("");
  const classes = [...new Set(real.filter(p => !state.f.grade || p.grade === +state.f.grade).map(p => p.cls).filter(Boolean))].sort((a, b) => a - b);
  if (state.f.cls && !classes.includes(+state.f.cls)) state.f.cls = "";
  c.innerHTML = `<option value="">전체</option>` + classes.map(x => `<option value="${x}" ${state.f.cls == x ? "selected" : ""}>${x}반</option>`).join("");
  $("#appToggles").innerHTML = APPS.map(a => `<label><input type="checkbox" data-app="${a.id}" ${state.hidden.has(a.id) ? "" : "checked"}> ${a.icon} ${a.name}</label>`).join("");
  $("#appToggles").querySelectorAll("input").forEach(i => i.onchange = () => {
    i.checked ? state.hidden.delete(i.dataset.app) : state.hidden.add(i.dataset.app);
    save("hub.hidden", [...state.hidden]); render();
  });
}

function render() {
  matchC123();
  const M = aggregate();
  renderFilters(M);
  const people = visiblePeople(M);
  const apps = shownApps().filter(a => loadedApps().includes(a));
  renderKpis(people, M, apps);
  const pend = state.hubLoaded || DEMO ? pendingList(aggregate([0, Infinity])) : [];
  document.querySelectorAll("#tabs button").forEach(b => {
    b.classList.toggle("on", b.dataset.tab === state.tab);
    if (b.dataset.tab === "reward") b.innerHTML = `🎁 보상${pend.length ? ` <span class="badge">${pend.length}</span>` : ""}`;
  });
  const v = $("#view");
  if (state.tab === "reward") { v.innerHTML = viewReward(pend, M); bindView(); bindReward(pend); return; }
  if (!state.people.size) {
    v.innerHTML = `<div class="card empty">${DEMO ? "체험 자료를 만드는 중…" : "위에서 저장소를 하나 이상 연결하면 학생 기록이 여기에 모여요.<br><span class='small'>(같은 주소의 독서 여권·단어숲·Cloze에 이미 로그인했다면 자동으로 연결돼요.)</span>"}</div>`;
    return;
  }
  if (state.tab === "class") v.innerHTML = viewClass(people, M, apps);
  else if (state.tab === "students") v.innerHTML = viewStudents(people, M, apps);
  else if (state.tab === "idle") v.innerHTML = viewIdle(people, M);
  else v.innerHTML = viewFeed(people);
  bindView();
}

function renderKpis(people, M, apps) {
  const act = people.filter(p => apps.some(a => isActive(M.get(p.email), a.id)));
  let total = 0; const per = {};
  for (const p of people) { const x = M.get(p.email); if (!x) continue; for (const a of apps) { const s = x.apps[a.id]; const n = a.id === "grammar" ? (s?.attempts || 0) : (s?.n || 0); total += n; if (isActive(x, a.id)) per[a.id] = (per[a.id] || 0) + 1; } }
  const top = Object.entries(per).sort((a, b) => b[1] - a[1])[0];
  const idleN = people.filter(p => { const l = M.get(p.email)?.last || 0; return Date.now() - l > state.idleDays * DAY; }).length;
  $("#kpis").innerHTML = [
    ["학생", people.length + "명", state.f.grade ? `${state.f.grade}학년${state.f.cls ? " " + state.f.cls + "반" : ""}` : "명단 + 기록 있는 학생"],
    [periodLabel() + " 활동 학생", act.length + "명", people.length ? pct(act.length, people.length) + "%" : ""],
    [periodLabel() + " 활동 수", total.toLocaleString(), "퀴즈·테스트·제출 (문법은 문제 수)"],
    ["가장 많이 쓴 앱", top ? APP[top[0]].icon + " " + APP[top[0]].name : "—", top ? top[1] + "명 활동" : ""],
    [`${state.idleDays}일 넘게 쉼`, idleN + "명", "모든 앱 기준"],
  ].map(([k, v, s]) => `<div class="card kpi"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${s}</div></div>`).join("");
}

function viewClass(people, M, apps) {
  const groups = new Map();
  for (const p of people) { const k = p.grade && p.cls ? `${p.grade}-${p.cls}` : "기타"; (groups.get(k) || groups.set(k, []).get(k)).push(p); }
  const keys = [...groups.keys()].sort((a, b) => a === "기타" ? 1 : b === "기타" ? -1 : a.localeCompare(b, undefined, { numeric: true }));
  const rows = keys.map(k => {
    const list = groups.get(k), n = list.length;
    const anyAct = list.filter(p => apps.some(a => isActive(M.get(p.email), a.id))).length;
    const cells = apps.map(a => {
      const c = list.filter(p => isActive(M.get(p.email), a.id)).length;
      if (a.id === "c123") { const t = list.reduce((s, p) => s + (state.snap.c123.get(p.email)?.e || 0), 0); return `<td class="c"><span class="m">⭐${t}</span><span class="sub">1인 ${n ? (t / n).toFixed(1) : 0}</span></td>`; }
      return `<td class="c"><div class="pc"><div class="bar"><i style="width:${pct(c, n) || 0}%"></i></div><span>${c}/${n}</span></div></td>`;
    }).join("");
    const label = k === "기타" ? "학년·반 미확인" : `${k.split("-")[0]}학년 ${k.split("-")[1]}반`;
    return `<tr class="clickable" data-cls="${k}"><td class="name sticky-col">${label}</td><td class="num">${n}</td>
      <td class="c"><div class="pc"><div class="bar gold"><i style="width:${pct(anyAct, n) || 0}%"></i></div><span>${anyAct}/${n}</span></div></td>${cells}</tr>`;
  }).join("");
  return `<div class="card panel"><h2>반별 요약 · ${periodLabel()}</h2>
    <p class="note">막대는 ${periodLabel()}에 그 앱을 쓴 학생 비율이에요. 반을 누르면 그 반 학생 표로 가요. Class123은 누적 으쓱 합계예요.</p>
    <div class="tbl-wrap"><table><thead><tr><th class="sticky-col">반</th><th>인원</th><th>한 앱 이상</th>${apps.map(a => `<th>${a.icon} ${a.name}</th>`).join("")}</tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}

function viewStudents(people, M, apps) {
  const { key, dir } = state.sort;
  const cellsOf = new Map(people.map(p => [p.email, Object.fromEntries(apps.map(a => [a.id, cell(a.id, p.email, M.get(p.email))]))]));
  const actN = p => apps.filter(a => isActive(M.get(p.email), a.id)).length;
  let list = sortPeople(people.slice());
  if (key === "name") list.sort((a, b) => dir * (a.name || "").localeCompare(b.name || "", "ko"));
  else if (key === "last") list.sort((a, b) => dir * ((M.get(b.email)?.last || 0) - (M.get(a.email)?.last || 0)));
  else if (key === "act") list.sort((a, b) => dir * (actN(b) - actN(a)));
  else if (key !== "no" && cellsOf.get(list[0]?.email)?.[key]) list.sort((a, b) => dir * (cellsOf.get(b.email)[key].main - cellsOf.get(a.email)[key].main));
  else if (dir < 0) list.reverse();
  const ar = k => key === k ? `<span class="arrow">${dir > 0 ? "▼" : "▲"}</span>` : "";
  const head = `<tr><th class="sort sticky-col" data-sort="no">학생 ${ar("no")}</th><th class="sort" data-sort="act">활동 앱 ${ar("act")}</th>
    ${apps.map(a => `<th class="sort" data-sort="${a.id}">${a.icon} ${a.name}${a.cumulative ? " <span class='small'>(누적)</span>" : ""} ${ar(a.id)}</th>`).join("")}
    <th class="sort" data-sort="last">마지막 활동 ${ar("last")}</th></tr>`;
  const body = list.map(p => {
    const cs = cellsOf.get(p.email), x = M.get(p.email);
    const tag = p.grade && p.cls ? `${p.grade}-${p.cls}-${p.no ?? "?"}` : "";
    return `<tr><td class="name sticky-col"><button data-who="${esc(p.email)}">${esc(p.name || p.email.split("@")[0])}</button> <span class="small muted">${tag}</span>${p.roster ? "" : ` <span class="small muted" title="독서 여권 명단에 없는 학생">·명단 밖</span>`}</td>
      <td class="num">${actN(p)}</td>
      ${apps.map(a => { const c = cs[a.id]; return `<td class="c ${c.on ? "on" : ""} ${c.main < 0 ? "none" : ""}">${c.html}</td>`; }).join("")}
      <td class="small">${fmtWhen(x?.last)}</td></tr>`;
  }).join("");
  return `<div class="card panel"><h2>학생별 · ${periodLabel()} <span class="small muted">${list.length}명</span></h2>
    <p class="note">노란 칸 = ${periodLabel()}에 활동함. 머리글을 누르면 정렬돼요. 이름을 누르면 그 학생의 모든 기록을 볼 수 있어요.</p>
    <div class="tbl-wrap"><table><thead>${head}</thead><tbody>${body}</tbody></table></div></div>`;
}

function viewIdle(people, M) {
  const lim = Date.now() - state.idleDays * DAY;
  const groups = new Map();
  sortPeople(people.slice()).forEach(p => {
    const l = M.get(p.email)?.last || 0; if (l > lim) return;
    const k = p.grade && p.cls ? `${p.grade}학년 ${p.cls}반` : "학년·반 미확인";
    (groups.get(k) || groups.set(k, []).get(k)).push(p);
  });
  const sel = [3, 7, 14, 30].map(d => `<option value="${d}" ${d === state.idleDays ? "selected" : ""}>${d}일</option>`).join("");
  const cards = [...groups.entries()].map(([k, list]) => `<div class="card panel idle-cls"><h3>${k}<span class="small muted">${list.length}명</span></h3><ul>
    ${list.map(p => { const x = M.get(p.email); const used = APPS.filter(a => x?.lastApp[a.id]).map(a => a.icon).join(""); return `<li><span><button data-who="${esc(p.email)}">${esc(p.name || p.email)}</button> <span class="muted">${p.no ? p.no + "번" : ""}</span></span><span class="muted">${x?.last ? fmtWhen(x.last) + " " + used : "기록 없음"}</span></li>`; }).join("")}
  </ul></div>`).join("");
  return `<div class="card panel"><h2>관심 필요 · <select id="idleSel">${sel}</select> 넘게 어느 앱에서도 활동이 없는 학생</h2>
    <p class="note">"기록 없음"은 연결된 앱 어디에도 기록이 없는 학생이에요. 기간 필터와 상관없이 오늘 기준으로 계산해요.</p></div>
    ${cards ? `<div class="idle-grid">${cards}</div>` : `<div class="card empty">모두 ${state.idleDays}일 안에 활동했어요 👏</div>`}`;
}

const lvTxt = l => (l.cefr === "A0" ? "Pre-A1" : l.cefr || "") + (l.sub ? " " + l.sub : "");
const lexTxt = x => x == null ? "" : (x < 0 ? "BR" + Math.abs(x) : x) + "L";
function evValue(ev) {
  if (ev.a === "passport") return (isMedal(ev.medal) ? { gold: "🥇", silver: "🥈", bronze: "🥉" }[ev.medal] + " " : "") + `${ev.s}/${ev.n}`;
  if (ev.k === "stamp") return "🏷️ 스탬프";
  if (ev.a === "speaking") return `🎤 ${ev.s}점`;
  if (ev.a === "level") return `🧭 ${lvTxt(ev)} · ${lexTxt(ev.lex)}`;
  if (ev.a === "writing") return `${ev.s}점${ev.cefr ? " · " + ev.cefr : ""}`;
  if (ev.k === "live") return `${ev.p}% · ${ev.rank}/${ev.of}등`;
  if (ev.n) return `${ev.s}/${ev.n}`;
  return "";
}
function evLine(ev, showWho) {
  const p = state.people.get(ev.e), a = APP[ev.a];
  return `<li><span class="t">${kday(ev.t).slice(5).replace("-", "/")} ${new Date(ev.t + KST).toISOString().slice(11, 16)}</span><span class="ic">${a.icon}</span>
    <span>${showWho ? `<button class="who" data-who="${esc(ev.e)}">${esc(p?.name || ev.e)}</button> · ` : ""}<span class="muted">${a.name}</span> ${esc(ev.title || "")}</span>
    <span class="val">${evValue(ev)}</span></li>`;
}
function viewFeed(people) {
  const [a, b] = periodRange();
  const who = new Set(people.map(p => p.email)), apps = new Set(shownApps().map(x => x.id));
  const list = state.events.filter(e => who.has(e.e) && apps.has(e.a) && e.t >= a && e.t < b).sort((x, y) => y.t - x.t);
  return `<div class="card panel"><h2>최근 활동 · ${periodLabel()} <span class="small muted">${list.length}건${list.length > 300 ? " 중 최근 300건" : ""}</span></h2>
    <p class="note">문법은 문제 하나하나 대신 스탬프만, Quiz Queens·Class123은 누적 기록이라 여기에 나오지 않아요.</p>
    ${list.length ? `<ul class="feed">${list.slice(0, 300).map(e => evLine(e, true)).join("")}</ul>` : `<div class="empty">이 기간에는 기록이 없어요.</div>`}</div>`;
}

function viewReward(pend, M) {
  if (!DEMO && state.src.fk.st !== "ok") return `<div class="card empty">보상 규칙과 지급 기록은 Kahoot·Class123 저장소에 있어요. 위에서 <b>Firebase (Kahoot)</b>를 먼저 연결해 주세요.</div>`;
  if (!state.hubLoaded && !DEMO) return `<div class="card empty">보상 설정을 불러오는 중…</div>`;
  const f = state.f;
  const show = pend.filter(it => (!f.grade || it.p.grade === +f.grade) && (!f.cls || it.p.cls === +f.cls) && (!f.q || low(it.p.name).includes(low(f.q))));
  const metricOpts = cur => Object.entries(METRICS).map(([k, m]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${APP[m.app].icon} ${m.name}</option>`).join("");
  const rules = rulesSorted().map(([id, r]) => {
    const m = METRICS[r.metric] || {}, ready = loadedApps().some(a => a.id === m.app);
    return `<tr data-rid="${id}" class="${r.on ? "" : "off"}">
      <td><label class="switch"><input type="checkbox" data-f="on" ${r.on ? "checked" : ""}><span></span></label></td>
      <td><input data-f="label" value="${esc(r.label || "")}" maxlength="30" class="in w-label"></td>
      <td><select data-f="metric" class="in">${metricOpts(r.metric)}</select>${ready ? "" : `<div class="small err-msg">이 앱 저장소가 아직 연결 안 됨</div>`}</td>
      <td>${m.min !== undefined ? `<input data-f="min" type="number" min="0" max="100" value="${num(r.min)}" class="in w-num"> <span class="small muted">${m.minUnit}</span>` : `<span class="muted">—</span>`}</td>
      <td><input data-f="every" type="number" min="1" value="${num(r.every) || 1}" class="in w-num"> <span class="small muted">${m.unit || ""}마다</span></td>
      <td>⭐ <input data-f="give" type="number" min="1" max="10" value="${num(r.give) || 1}" class="in w-num"></td>
      <td><select data-f="grade" class="in"><option value="">전 학년</option>${[1, 2, 3].map(g => `<option value="${g}" ${r.grade == g ? "selected" : ""}>${g}학년</option>`).join("")}</select></td>
      <td><input data-f="since" type="date" value="${esc(r.since || "")}" class="in"></td>
      <td><button class="btn sm" data-del="${id}" title="규칙 지우기">🗑️</button></td></tr>`;
  }).join("");
  const byStu = new Map();
  show.forEach(it => (byStu.get(it.p.email) || byStu.set(it.p.email, []).get(it.p.email)).push(it));
  const pendRows = sortPeople([...byStu.keys()].map(e => state.people.get(e))).map(p => byStu.get(p.email).map((it, i) => `
    <tr><td><input type="checkbox" class="pk" data-i="${pend.indexOf(it)}" ${it.target ? "checked" : ""}></td>
      <td class="name">${i ? "" : `<button data-who="${esc(p.email)}">${esc(p.name || p.email)}</button> <span class="small muted">${p.grade ? `${p.grade}-${p.cls}-${p.no}` : ""}</span>`}</td>
      <td>${esc(it.r.label || METRICS[it.r.metric].name)}<span class="sub small muted" style="display:block">${it.count}${METRICS[it.r.metric].unit} 달성 · 이미 ${it.got}개 받음</span></td>
      <td class="num"><b>⭐${it.n}</b></td>
      <td class="small">${it.target ? esc(it.target.cname) : `<span class="err-msg">Class123에서 못 찾음</span>`}</td></tr>`).join("")).join("");
  const logs = Object.values(state.hub.log || {}).sort((a, b) => b.t - a.t).slice(0, 60);
  return `<div class="card panel"><h2>🎁 보상 규칙</h2>
    <p class="note">켜진 규칙의 기준을 채운 학생이 아래 <b>지급 대기함</b>에 모여요. 선생님이 [지급]을 눌러야 Class123에 으쓱이 들어가요(자동으로 들어가지 않아요).
    <b>시작일</b> 이전의 기록은 세지 않아요. 예전 기록까지 인정하려면 시작일을 앞으로 당기세요. 같은 기록으로 두 번 받지 않아요.</p>
    <div class="tbl-wrap"><table class="rules"><thead><tr><th>켜기</th><th>이름 (Class123 카드 제목)</th><th>기준</th><th>점수 조건</th><th>몇 번마다</th><th>으쓱</th><th>대상</th><th>시작일</th><th></th></tr></thead>
    <tbody>${rules}</tbody></table></div>
    <div style="margin-top:8px"><button class="btn sm" id="addRule">＋ 규칙 추가</button></div></div>
  <div class="card panel"><h2>📥 지급 대기함 <span class="small muted">${show.length}건${show.length !== pend.length ? ` (필터 밖 ${pend.length - show.length}건)` : ""}</span></h2>
    ${show.length ? `<div class="pend-actions"><label><input type="checkbox" id="pkAll" checked> 모두 선택</label>
      <button class="btn gold" id="btnGrant">⭐ 선택한 학생에게 지급</button><button class="btn" id="btnSkip">지급하지 않고 넘기기</button></div>
      <div class="tbl-wrap"><table><thead><tr><th></th><th>학생</th><th>규칙</th><th>으쓱</th><th>Class123 반</th></tr></thead><tbody>${pendRows}</tbody></table></div>`
      : `<div class="empty">${Object.values(state.hub.rules).some(r => r.on) ? "지금은 받을 학생이 없어요." : "켜진 규칙이 없어요. 위에서 규칙을 켜 보세요."}</div>`}
    ${state.c123Unmatched?.length ? `<details class="note"><summary>Class123 학생 중 명단과 못 맞춘 ${state.c123Unmatched.length}명</summary>${state.c123Unmatched.map(esc).join(", ")}<br>Class123의 반 이름을 "1학년 3반"처럼, 학생 이름을 명단과 똑같이 맞추면 연결돼요.</details>` : ""}
  </div>
  ${Object.keys(state.hub.hidden || {}).length ? `<div class="card panel"><h2>🙈 숨긴 계정 <span class="small muted">${Object.keys(state.hub.hidden).length}개</span></h2>
    <p class="note">테스트 계정처럼 숨긴 계정은 표, 보상, 학생 페이지에서 빠져요.</p><ul class="feed">${Object.values(state.hub.hidden).map(e => { const p = state.people.get(e); return `<li><span class="t"></span><span class="ic">🙈</span><span><b>${esc(p?.name || "")}</b> ${esc(e)}</span><span><button class="btn sm" data-unhide="${esc(e)}">다시 보이기</button></span></li>`; }).join("")}</ul></div>` : ""}
  <div class="card panel"><h2>🧾 지급 기록 <span class="small muted">최근 ${logs.length}건</span></h2>
    ${logs.length ? `<ul class="feed">${logs.map(l => `<li><span class="t">${kday(l.t).slice(5).replace("-", "/")} ${new Date(l.t + KST).toISOString().slice(11, 16)}</span><span class="ic">${l.skipped ? "⏭️" : "🎁"}</span><span><b>${esc(l.name || l.email)}</b> · ${esc(l.label)}</span><span class="val">${l.skipped ? "넘김" : "⭐" + l.n}</span></li>`).join("")}</ul>` : `<div class="empty">아직 지급한 기록이 없어요.</div>`}</div>`;
}
function bindReward(pend) {
  const v = $("#view");
  v.querySelectorAll("tr[data-rid]").forEach(tr => {
    const id = tr.dataset.rid;
    tr.querySelectorAll("[data-f]").forEach(inp => inp.onchange = async () => {
      const r = { ...state.hub.rules[id] }, k = inp.dataset.f;
      r[k] = inp.type === "checkbox" ? inp.checked : inp.type === "number" ? num(inp.value) : inp.value;
      if (k === "metric") { const m = METRICS[r.metric]; r.min = m.min ?? 0; if (!r.label || Object.values(METRICS).some(x => r.label === x.name)) r.label = m.name; }
      if (k === "on" && r.on && !r.since) r.since = kday(Date.now());
      try { await saveRule(id, r); toast(k === "on" ? (r.on ? "규칙을 켰어요" : "규칙을 껐어요") : "저장했어요"); } catch (e) { toast("저장 실패: " + e.message); }
      render();
    });
  });
  v.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
    if (!confirm("이 규칙을 지울까요? (이미 지급한 기록은 남아요)")) return;
    await saveRule(b.dataset.del, null); render();
  });
  const add = $("#addRule"); if (add) add.onclick = async () => {
    const id = "r_" + uid();
    await saveRule(id, { metric: "passport_medal", every: 1, give: 1, label: METRICS.passport_medal.name, on: false, since: kday(Date.now()), grade: "", order: Object.keys(state.hub.rules).length });
    render();
  };
  v.querySelectorAll("[data-unhide]").forEach(b => b.onclick = () => setHidden(b.dataset.unhide, false));
  const all = $("#pkAll"); if (all) all.onchange = () => v.querySelectorAll(".pk").forEach(c => c.checked = all.checked);
  const picked = () => [...v.querySelectorAll(".pk:checked")].map(c => pend[+c.dataset.i]).filter(Boolean);
  const g = $("#btnGrant"); if (g) g.onclick = async () => {
    const list = picked().filter(it => it.target);
    if (!list.length) return toast("Class123에 있는 학생을 골라 주세요.");
    const total = list.reduce((s, it) => s + it.n, 0);
    if (!confirm(`${new Set(list.map(it => it.p.email)).size}명에게 으쓱 ${total}개를 Class123에 줄까요?`)) return;
    g.disabled = true; await grant(list, false);
  };
  const s = $("#btnSkip"); if (s) s.onclick = async () => {
    const list = picked(); if (!list.length) return;
    if (!confirm(`${list.length}건을 지급하지 않고 넘길까요? 이 기록으로는 다시 대기함에 나오지 않아요.`)) return;
    await grant(list, true);
  };
}

function openStudent(email) {
  const p = state.people.get(email); if (!p) return;
  const M = aggregate(), x = M.get(email);
  const cards = APPS.filter(a => loadedApps().includes(a)).map(a => {
    const c = cell(a.id, email, x);
    return `<div class="app-card ${c.main < 0 ? "dim" : ""}"><div class="h">${a.icon} ${a.name}</div><div>${c.html.replace(/class="sub"/g, 'class="l" style="display:block"')}</div>
      <div class="l">마지막: ${fmtWhen(x?.lastApp[a.id])}</div></div>`;
  }).join("");
  const evs = evsOf(email).slice().sort((a, b) => b.t - a.t);
  const rw = Object.values(state.hub.log || {}).filter(l => l.email === email && !l.skipped).sort((a, b) => b.t - a.t);
  $("#modalBody").innerHTML = `<h2>${esc(p.name || email)}</h2>
    <div class="muted">${p.grade ? `${p.grade}학년 ${p.cls}반 ${p.no ?? "?"}번 · ` : ""}${esc(email)}${p.roster ? "" : " · 독서 여권 명단에 없음"}</div>
    <div style="margin-top:6px"><button class="btn sm" id="btnHide">🙈 테스트 계정이라 숨기기</button></div>
    <p class="note">카드의 숫자는 ${periodLabel()} 기준이고, "누적"은 지금까지 전체예요.</p>
    <div class="app-cards">${cards}</div>
    ${rw.length ? `<p class="note">🎁 앱 연동 보상: ${rw.slice(0, 8).map(l => `${esc(l.label)} ⭐${l.n} (${kday(l.t).slice(5)})`).join(" · ")}</p>` : ""}
    <h3 style="margin:8px 0 4px;color:var(--navy)">전체 기록 <span class="small muted">${evs.length}건</span></h3>
    ${evs.length ? `<ul class="feed">${evs.slice(0, 200).map(e => evLine(e, false)).join("")}</ul>` : `<div class="empty">아직 기록이 없어요.</div>`}`;
  $("#btnHide").onclick = () => { if (confirm(`${p.name || email} (${email}) 계정을 숨길까요? 나중에 🎁 보상 탭 아래에서 다시 보이게 할 수 있어요.`)) setHidden(email, true); };
  $("#modal").classList.remove("hidden");
}

function bindView() {
  const v = $("#view");
  v.querySelectorAll("[data-who]").forEach(b => b.onclick = e => { e.stopPropagation(); openStudent(b.dataset.who); });
  v.querySelectorAll("th[data-sort]").forEach(th => th.onclick = () => {
    const k = th.dataset.sort; state.sort = { key: k, dir: state.sort.key === k ? -state.sort.dir : 1 }; render();
  });
  v.querySelectorAll("tr[data-cls]").forEach(tr => tr.onclick = () => {
    const k = tr.dataset.cls; if (k === "기타") return;
    const [g, c] = k.split("-"); state.f.grade = g; state.f.cls = c; state.tab = "students"; render();
  });
  const idle = $("#idleSel"); if (idle) idle.onchange = () => { state.idleDays = +idle.value; render(); };
}

function exportCsv() {
  const M = aggregate(), people = sortPeople(visiblePeople(M)), apps = shownApps().filter(a => loadedApps().includes(a));
  const q = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const rows = [["학년", "반", "번호", "이름", "이메일", ...apps.map(a => a.name), "마지막 활동"].map(q).join(",")];
  people.forEach(p => {
    const x = M.get(p.email);
    rows.push([p.grade, p.cls, p.no, p.name, p.email, ...apps.map(a => cell(a.id, p.email, x).csv), x?.last ? kday(x.last) : ""].map(q).join(","));
  });
  const blob = new Blob(["﻿" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `통합현황_${periodLabel().replace(/\s/g, "")}_${kday(Date.now())}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

// ======================================================================
//  체험 모드 (가상의 학생 기록)
// ======================================================================
function buildDemo() {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const fam = "김이박최정강조윤장임한오서신권황안송류홍".split(""), giv = ["서연", "지우", "하윤", "민서", "지민", "수아", "예린", "채원", "다은", "윤서", "유나", "소율", "가은", "하린", "서윤", "아린", "나연", "지아", "수빈", "예은"];
  const now = Date.now(); state.demoGrammar = new Map();
  const books = [["the-little-prince", "The Little Prince"], ["demian", "Demian"], ["the-giver", "The Giver"], ["animal-farm", "Animal Farm"], ["the-happy-prince", "The Happy Prince"], ["wonder", "Wonder"]];
  for (const g of [1, 2]) for (let c = 1; c <= 3; c++) for (let n = 1; n <= 24; n++) {
    const email = `2026${g}${String(c).padStart(2, "0")}${String(n).padStart(2, "0")}@smy.ms.kr`;
    person(email, { name: pick(fam) + pick(giv), grade: g, cls: c, no: n }, true);
    const zeal = rnd(); if (zeal < 0.12) continue;
    const T = () => now - Math.floor(rnd() * rnd() * 45 * DAY);
    for (let i = 0; i < zeal * 10; i++) { const [id, t] = pick(books); const s = 4 + Math.floor(rnd() * 7); addEvent({ e: email, a: "passport", t: T(), k: "quiz", title: t, book: id, s, n: 10, p: s * 10, medal: s === 10 ? "gold" : s >= 8 ? "silver" : s >= 6 ? "bronze" : "none" }); }
    const gl = []; for (let i = 0; i < zeal * 60; i++) gl.push({ t: T(), ok: rnd() < 0.75 }); state.demoGrammar.set(email, gl);
    state.snap.grammar.set(email, { xp: gl.length * 10, streak: Math.floor(zeal * 5), last: Math.max(0, ...gl.map(r => r.t)), stamps: Math.floor(zeal * 8) });
    for (let i = 0; i < zeal * 4; i++) addEvent({ e: email, a: "grammar", t: T(), k: "stamp", title: "단원 스탬프 " + pick(["1-1", "1-2", "2-3", "2-4"]) });
    if (rnd() < 0.7) { const ans = Math.floor(zeal * 300); state.snap.quiz.set(email, { xp: ans * 12, level: 1 + Math.floor(ans / 60), answered: ans, acc: 55 + Math.floor(rnd() * 40), last: T() }); }
    if (rnd() < 0.8) {
      state.snap.vocab.set(email, { xp: Math.floor(zeal * 900), streak: Math.floor(zeal * 9), learned: Math.floor(zeal * 300), mastered: Math.floor(zeal * 120), last: T() });
      for (let i = 0; i < zeal * 6; i++) { const s = 10 + Math.floor(rnd() * 11); addEvent({ e: email, a: "vocab", t: T(), k: "test", title: "중1 교과서 " + (1 + Math.floor(rnd() * 8)) + "과", s, n: 20, p: s * 5 }); }
    }
    for (let i = 0; i < zeal * 3; i++) { const s = 5 + Math.floor(rnd() * 11); addEvent({ e: email, a: "cloze", t: T(), k: "test", title: pick(["Lesson 2 빈칸", "Lesson 3 순서", "Lesson 3 빈칸"]), s, n: 15, p: pct(s, 15) }); }
    for (let i = 0; i < zeal * 2.5; i++) addEvent({ e: email, a: "writing", t: T(), k: "essay", title: pick(["My Weekend", "A Letter to My Future Self", "My Favorite Place"]), s: 60 + Math.floor(rnd() * 40), cefr: pick(["A1", "A2", "A2", "B1"]) });
    for (let i = 0; i < zeal * 8; i++) { const sc = 55 + Math.floor(rnd() * 46), ln = Math.floor(rnd() * 5); addEvent({ e: email, a: "speaking", t: T(), k: "line", title: `1-3 Listen & Talk A · ${ln + 1}번 줄`, s: sc, p: sc, set: 1, line: ln }); }
    if (rnd() < 0.85) { const lv = pick(["A1", "A2", "A2", "B1", "B1", "B2"]), lex = { A1: 380, A2: 600, B1: 820, B2: 1020 }[lv] + Math.floor(rnd() * 8) * 10; addEvent({ e: email, a: "level", t: T(), k: "test", title: "레벨 테스트", cefr: lv, sub: pick(["하", "중", "상"]), lex, ar: Math.round(lex / 160 * 10) / 10, vsize: { A1: 1200, A2: 2000, B1: 2800, B2: 3400 }[lv] + Math.floor(rnd() * 10) * 50 }); }
    if (rnd() < 0.6) { const s = 6 + Math.floor(rnd() * 5); addEvent({ e: email, a: "kahoot", t: T(), k: "hw", title: "Lesson 3 단어 (과제)", s, n: 10, p: s * 10, tries: 1 }); }
  }
  for (const g of [1, 2]) for (let c = 1; c <= 3; c++) for (let k = 0; k < 3; k++) {
    const t = now - Math.floor((2 + k * 9 + rnd() * 3) * DAY);
    const list = [...state.people.values()].filter(p => p.grade === g && p.cls === c && rnd() < 0.9).map(p => ({ p, sc: Math.floor(rnd() * 9000) }));
    list.sort((a, b) => b.sc - a.sc).forEach(({ p }, i) => { const cc = 4 + Math.floor(rnd() * 7); addEvent({ e: p.email, a: "kahoot", t, k: "live", title: `Lesson ${k + 2} Review`, s: cc, n: 10, p: cc * 10, rank: i + 1, of: list.length }); });
  }
  // 다른 앱 명단에만 있는 가짜 학생 (화면에 나오면 안 돼요)
  for (let i = 1; i <= 30; i++) person(`20263${String(9).padStart(2, "0")}${String(i).padStart(2, "0")}@smy.ms.kr`, { name: "샘플학생" + i });
  state.c123Raw = [];
  for (const g of [1, 2]) for (let c = 1; c <= 3; c++) state.c123Raw.push({ _k: String(state.c123Raw.length), id: `cls_${g}${c}`, name: `${g}학년 ${c}반`, grade: String(g), visibleClassEussuk: 0, history: [], students: [...state.people.values()].filter(p => p.grade === g && p.cls === c).map(p => ({ id: "stu_" + p.email.slice(0, 9), number: p.no, name: p.name, visibleEussuk: Math.floor(rnd() * 15), visibleMeossuk: Math.floor(rnd() * 3) })) });
  const since = kday(now - 60 * DAY);
  DEFAULT_RULES.forEach((r, i) => state.hub.rules["r" + i] = { ...r, on: i < 3 || i === 6, since, grade: "", order: i });
}

// ======================================================================
//  시작
// ======================================================================
function bindTop() {
  $("#tabs").onclick = e => { const b = e.target.closest("button[data-tab]"); if (!b) return; state.tab = b.dataset.tab; save("hub.tab", state.tab); render(); };
  $("#fGrade").onchange = e => { state.f.grade = e.target.value; state.f.cls = ""; render(); };
  $("#fClass").onchange = e => { state.f.cls = e.target.value; render(); };
  $("#fPeriod").onchange = async e => { state.f.period = e.target.value; $("#customRange").classList.toggle("hidden", state.f.period !== "custom"); await ensureGrammar(); render(); };
  $("#fFrom").onchange = async e => { state.f.from = e.target.value; await ensureGrammar(); render(); };
  $("#fTo").onchange = async e => { state.f.to = e.target.value; await ensureGrammar(); render(); };
  let qT; $("#fQ").oninput = e => { clearTimeout(qT); qT = setTimeout(() => { state.f.q = e.target.value; render(); }, 200); };
  $("#btnCsv").onclick = exportCsv;
  $("#btnConnect").onclick = () => { $("#conn").scrollIntoView({ behavior: "smooth" }); if (!DEMO && state.src.sb.st !== "ok") showGsi(); };
  $("#btnReload").onclick = () => {
    if (DEMO) return toast("체험 모드에서는 새로 불러올 기록이 없어요.");
    state.pub.at = 0;
    if (state.src.sb.st === "ok") sbLoad();
    if (state.src.fc.st === "ok") fcLoad(fbApps.fc);
    if (state.src.fk.st === "ok") fkLoad(fbApps.fk);
    toast("모든 앱의 기록을 다시 불러와요.");
  };
  $("#modalX").onclick = () => $("#modal").classList.add("hidden");
  $("#modal").onclick = e => { if (e.target.id === "modal") $("#modal").classList.add("hidden"); };
  document.addEventListener("keydown", e => { if (e.key === "Escape") $("#modal").classList.add("hidden"); });
}

state.tab = load("hub.tab", "class");
bindTop();
renderConn();
if (DEMO) { buildDemo(); render(); window.__hub = { state, aggregate, rangeOf, studentSummary }; }
else {
  render();
  // 이미 로그인된 저장소는 바로 불러와요 (팝업 없이)
  sbStart(false).catch(e => { state.src.sb = { st: "err", err: e.message }; renderConn(); });
  fbStart("fc", false);
  fbStart("fk", false);
}
// 앱 바로가기 상자: 접고 펼친 상태를 기억해요
{ const l = document.getElementById("launcher"); if (l) { l.open = load("hub.launcher", true); l.addEventListener("toggle", () => save("hub.launcher", l.open)); } }
