// MY Teacher Hub — 여러 앱의 학생 기록을 한 화면에 모아 보는 교사용 페이지 (읽기 전용)
// 데이터는 각 앱의 저장소에서 선생님 계정으로 "읽기만" 합니다. 어떤 앱의 기록도 바꾸지 않아요.
//   Supabase (tfellow-web)       : 독서 여권, MY Grammar, Quiz Queens(구글 시트, Supabase 로그인으로 확인)
//   Firebase cloze-a8e6c          : 단어숲, MY Cloze, AI 영작문(writing1)
//   Firebase my-kahoot-smy (RTDB) : MY Kahoot, Class123 Plus
const FB_VER = "10.12.2";
const TEACHERS = ["tfellow@gmail.com", "tfellow@smy.ms.kr"];
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
const C123_WS = "tfellow_workspace";

const APPS = [
  { id: "passport", name: "독서 여권", icon: "📖", src: "sb", url: "../app/" },
  { id: "grammar", name: "문법", icon: "✏️", src: "sb", url: "../grammar/admin.html" },
  { id: "quiz", name: "Quiz Queens", icon: "👑", src: "sb", url: "../quiz/", cumulative: true },
  { id: "vocab", name: "단어숲", icon: "🌳", src: "fc", url: "../danuhsup/" },
  { id: "cloze", name: "Cloze", icon: "🧩", src: "fc", url: "../cloze/" },
  { id: "writing", name: "영작문", icon: "✍️", src: "fc", url: "../writing1/" },
  { id: "kahoot", name: "Kahoot", icon: "⚡", src: "fk", url: "../kahoot/" },
  { id: "c123", name: "Class123", icon: "⭐", src: "fk", url: "../class123/", cumulative: true },
];
const APP = Object.fromEntries(APPS.map(a => [a.id, a]));
const SOURCES = {
  sb: { name: "Supabase", desc: "독서 여권 · 문법 · Quiz Queens" },
  fc: { name: "Firebase (Cloze)", desc: "단어숲 · Cloze · 영작문" },
  fk: { name: "Firebase (Kahoot)", desc: "Kahoot · Class123" },
};

const DEMO = new URLSearchParams(location.search).has("demo");
const $ = s => document.querySelector(s);
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const low = s => String(s || "").toLowerCase().trim();
const isTeacher = e => TEACHERS.includes(low(e));
const toList = v => Array.isArray(v) ? v.filter(Boolean) : (v && typeof v === "object" ? Object.values(v).filter(Boolean) : []);
const num = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const isMedal = m => m === "gold" || m === "silver" || m === "bronze";
const pct = (s, t) => t > 0 ? Math.round((s / t) * 100) : null;

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
  return Number.isFinite(t) ? t : 0;
}
// "2026. 11. 3. 오후 2:13:00" 같은 한국어 날짜
function parseKoDate(s) {
  const m = String(s || "").match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2})?:?(\d{2})?/);
  if (!m) return 0;
  let h = num(m[5]); if (m[4] === "오후" && h < 12) h += 12; if (m[4] === "오전" && h === 12) h = 0;
  const p = n => String(n).padStart(2, "0");
  return Date.parse(`${m[1]}-${p(m[2])}-${p(m[3])}T${p(h)}:${p(num(m[6]))}:00+09:00`) || 0;
}
function periodRange() {
  const f = state.f, now = Date.now(), t0 = kstart(kday(now));
  switch (f.period) {
    case "today": return [t0, Infinity];
    case "week": { const dow = new Date(t0 + KST).getUTCDay(); return [t0 - ((dow + 6) % 7) * DAY, Infinity]; }
    case "7d": return [t0 - 6 * DAY, Infinity];
    case "month": return [kstart(kday(now).slice(0, 8) + "01"), Infinity];
    case "30d": return [t0 - 29 * DAY, Infinity];
    case "custom": return [f.from ? kstart(f.from) : 0, f.to ? kstart(f.to) + DAY : Infinity];
    default: return [0, Infinity];
  }
}
const periodLabel = () => ({ today: "오늘", week: "이번 주", "7d": "최근 7일", month: "이번 달", "30d": "최근 30일", all: "전체 기간", custom: "선택 기간" })[state.f.period];

// ---------- 상태 ----------
const state = {
  src: { sb: { st: "off" }, fc: { st: "off" }, fk: { st: "off" } },
  people: new Map(),      // email → {email,name,grade,cls,no}
  events: [],             // {e,a,t,k,title,s,n,p,medal}
  snap: {},               // app → Map(email → 누적 값)
  grammarAgg: null,       // 기간별 문법 통계 (서버 계산)
  grammarKey: "",
  f: { grade: "", cls: "", period: "week", from: "", to: "", q: "" },
  tab: "class",
  sort: { key: "no", dir: 1 },
  hidden: new Set(load("hub.hidden", [])),
  idleDays: 7,
};
APPS.forEach(a => state.snap[a.id] = new Map());
function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
let toastT;
function toast(msg) { const el = $("#toast"); el.textContent = msg; el.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.add("hidden"), 3200); }

// ---------- 학생 명단 (여러 앱의 명단을 합쳐요) ----------
// 학교 이메일 9자리 = 입학연도(4) + 학년(1) + 반(2) + 번호(2)  예) 202610101 → 1학년 1반 1번
function fromEmail(email) {
  const m = low(email).match(/^(\d{4})(\d)(\d{2})(\d{2})@smy\.ms\.kr$/);
  return m ? { grade: +m[2], cls: +m[3], no: +m[4] } : {};
}
function person(email, info = {}, strong = false) {
  email = low(email);
  if (!email || isTeacher(email) || !email.includes("@")) return null;
  let p = state.people.get(email);
  if (!p) { p = { email, name: "", grade: null, cls: null, no: null, ...stripEmpty(fromEmail(email)) }; state.people.set(email, p); }
  for (const k of ["name", "grade", "cls", "no"]) {
    const v = info[k];
    if (v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v))) continue;
    if (strong || !p[k]) p[k] = k === "name" ? String(v).trim() : num(v) || p[k];
  }
  return p;
}
function stripEmpty(o) { return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "")); }
function addEvent(ev) { if (!ev.e || !ev.t || isTeacher(ev.e)) return; ev.e = low(ev.e); person(ev.e); state.events.push(ev); }
function clearApps(ids) {
  state.events = state.events.filter(e => !ids.includes(e.a));
  ids.forEach(id => state.snap[id] = new Map());
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
  clearApps(["passport", "grammar", "quiz"]);
  const warn = (what, e) => { console.warn(what, e); S.warn.push(`${what}: ${e?.message || e}`); };

  // 명단 (독서 여권의 roster 표가 가장 정확해요)
  try {
    let rows;
    const r = await c.from("roster").select("email,name,grade,class_no,student_no").range(0, 4999);
    if (r.error) { const x = await c.rpc("admin_extras"); if (x.error) throw x.error; rows = x.data?.roster || []; } else rows = r.data;
    rows.forEach(s => person(s.email, { name: s.name, grade: s.grade, cls: s.class_no, no: s.student_no }, true));
  } catch (e) { warn("명단", e); }

  // 독서 여권 퀴즈 기록
  try {
    let titles = {};
    try { const b = await c.from("books").select("id,title").range(0, 4999); (b.data || []).forEach(x => titles[x.id] = x.title); } catch {}
    const rows = await sbAll(() => c.rpc("admin_attempts"));
    rows.forEach(a => addEvent({ e: a.email, a: "passport", t: toMs(a.attempt_at), k: "quiz", title: titles[a.book_id] || a.book_id, s: a.score, n: a.total, p: pct(a.score, a.total), medal: a.medal, book: a.book_id }));
  } catch (e) { warn("독서 여권", e); }

  // MY Grammar
  try {
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
    state.grammarKey = ""; // 기간 통계 다시 받기
  } catch (e) { warn("문법", e); }

  // Quiz Queens (구글 시트) — Supabase 로그인 토큰으로 선생님임을 확인해요
  try {
    const { data } = await c.auth.getSession();
    const res = await fetch(QUIZ_GAS, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "getInitialData", token: data.session?.access_token }) });
    const j = await res.json();
    toList(j.users).forEach(u => {
      const email = low(u.email);
      if (!email.endsWith(SCHOOL) || !person(email, { name: u.name })) return;
      const answered = num(u.totalAnswered), correct = num(u.correctCount), t = toMs(u.updatedAt) || parseKoDate(u.updatedAt);
      state.snap.quiz.set(email, { xp: num(u.xp), level: num(u.level), answered, acc: answered ? pct(correct, answered) : null, streak: num(u.streak), last: t });
    });
  } catch (e) { warn("Quiz Queens", e); }

  S.st = "ok"; renderConn(); await ensureGrammar(); render();
}
async function ensureGrammar() {
  if (DEMO || state.src.sb.st !== "ok") return;
  const [a, b] = periodRange();
  const key = a + "-" + b;
  if (state.grammarKey === key) return;
  state.grammarKey = key;
  try {
    const from = new Date(a || Date.parse("2000-01-01")).toISOString();
    const to = new Date(Number.isFinite(b) ? b : Date.now() + DAY).toISOString();
    const rows = await sbAll(() => sbClient().rpc("mg_admin_by_student", { p_from: from, p_to: to }));
    const m = new Map();
    rows.forEach(r => { const e = state.mgIds?.get(r.user_id); if (e) m.set(e, { attempts: num(r.attempts), correct: num(r.correct), xp: num(r.xp), days: num(r.days), last: toMs(r.last_at) }); });
    state.grammarAgg = m;
  } catch (e) { console.warn("문법 기간 통계", e); state.grammarAgg = null; }
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
async function fbStart(id, interactive) {
  const S = state.src[id];
  try {
    const f = await fbInit(id);
    if (!f.user && interactive) {
      const p = new f.A.GoogleAuthProvider(); p.setCustomParameters({ prompt: "select_account" });
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
  clearApps(APPS.filter(a => a.src === id).map(a => a.id)); renderConn(); render();
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

  try { // Cloze 프로필 (학번 5자리 · 실명)
    (await F.getDocs(F.collection(db, "users"))).forEach(d => {
      const u = d.data(); if (!u.email) return;
      uidEmail.set(d.id, low(u.email));
      const no = String(u.studentNo || "");
      const info = /^\d{5}$/.test(no) ? { grade: +no[0], cls: +no.slice(1, 3), no: +no.slice(3) } : {};
      person(u.email, { name: u.realName, ...info });
    });
  } catch (e) { warn("Cloze 프로필", e); }

  try { // 단어숲 학생 + 누적 통계
    (await F.getDocs(F.query(F.collection(db, "vocab_users"), F.where("role", "==", "student")))).forEach(d => {
      const u = d.data(); if (!u.email) return;
      uidEmail.set(d.id, low(u.email));
      if (!person(u.email, { name: u.name, grade: u.grade, cls: u.classNo, no: u.number })) return;
      const st = u.stats || {};
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

  try { // Cloze 제출 (보안 규칙상 이 계정이 만든 테스트의 제출만 보여요)
    (await F.getDocs(F.query(F.collection(db, "submissions"), F.where("ownerUid", "==", f.user.uid)))).forEach(d => {
      const s = d.data();
      const no = String(s.studentNo || "");
      person(s.email, { name: s.realName, ...(/^\d{5}$/.test(no) ? { grade: +no[0], cls: +no.slice(1, 3), no: +no.slice(3) } : {}) });
      addEvent({ e: s.email, a: "cloze", t: toMs(s.submittedAt) || toMs(s.startedAt), k: "test", title: s.testTitle || s.testCode, s: s.score, n: s.total, p: pct(s.score, s.total) });
    });
  } catch (e) { warn("Cloze 제출", e); }

  S.st = "ok"; renderConn(); render();
}

// ---------- Kahoot · Class123 (Realtime Database) ----------
async function fkLoad(f) {
  const S = state.src.fk;
  S.st = "load"; S.err = ""; S.warn = []; renderConn();
  clearApps(["kahoot", "c123"]);
  const D = await import(`https://www.gstatic.com/firebasejs/${FB_VER}/firebase-database.js`);
  const db = D.getDatabase(f.app);
  const read = async p => (await D.get(D.ref(db, p))).val();
  const warn = (what, e) => { console.warn(what, e); S.warn.push(`${what}: ${e?.code || e?.message || e}`); };

  try { toList(await read("schoolRoster")).forEach(s => person(s.email, { name: s.name, grade: s.grade, cls: s.classNum, no: s.studentNum })); }
  catch (e) { warn("Kahoot 명단", e); }

  try { // 수업 시간 라이브 퀴즈
    toList(await read("teacherData/quizHistory")).forEach(ss => {
      const t = num(String(ss.sessionId || "").replace(/\D/g, "")) || parseKoDate(ss.playedAt);
      if (!t || String(ss.playedAt || "").includes("샘플")) return;
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

  try { // Class123 으쓱·머쓱 (누적)
    state.c123Raw = toList(await read(`class123_plus/${C123_WS}/classes`));
  } catch (e) { warn("Class123", e); }

  S.st = "ok"; renderConn(); render();
}
// Class123 학생은 이메일이 없어서 "학년·반·번호"(+이름)로 명단과 맞춰요
function matchC123() {
  state.snap.c123 = new Map();
  state.c123Unmatched = 0;
  const raw = state.c123Raw; if (!raw) return;
  const byKey = new Map(), byName = new Map();
  for (const p of state.people.values()) {
    if (p.grade && p.cls && p.no) byKey.set(`${p.grade}-${p.cls}-${p.no}`, p);
    if (p.name) { const k = `${p.grade}-${p.cls}-${p.name}`; byName.set(k, byName.has(k) ? null : p); }
  }
  raw.forEach(c => {
    const nm = String(c.name || "");
    const g = num(c.grade) || num((nm.match(/(\d)\s*학년/) || [])[1]) || num((nm.match(/^(\d)\s*-\s*\d+/) || [])[1]);
    const cl = num((nm.match(/(\d+)\s*반/) || [])[1]) || num((nm.match(/^\d\s*-\s*(\d+)/) || [])[1]);
    toList(c.students).forEach(s => {
      let p = byName.get(`${g}-${cl}-${String(s.name || "").trim()}`) || byKey.get(`${g}-${cl}-${num(s.number)}`);
      if (!p) { state.c123Unmatched++; return; }
      const prev = state.snap.c123.get(p.email) || { e: 0, m: 0 };
      state.snap.c123.set(p.email, { e: prev.e + num(s.visibleEussuk), m: prev.m + num(s.visibleMeossuk) });
    });
  });
}

// ======================================================================
//  집계
// ======================================================================
function visiblePeople() {
  const f = state.f, q = low(f.q);
  return [...state.people.values()].filter(p =>
    (!f.grade || p.grade === +f.grade) && (!f.cls || p.cls === +f.cls) &&
    (!q || low(p.name).includes(q) || p.email.includes(q)));
}
function aggregate() {
  const [a, b] = periodRange();
  const inP = t => t >= a && t < b;
  const M = new Map();
  const get = e => { let x = M.get(e); if (!x) { x = { apps: {}, last: 0, lastApp: {} }; M.set(e, x); } return x; };
  for (const ev of state.events) {
    const x = get(ev.e);
    if (ev.t > x.last) x.last = ev.t;
    if (ev.t > (x.lastApp[ev.a] || 0)) x.lastApp[ev.a] = ev.t;
    if (ev.a === "passport" && isMedal(ev.medal)) (x.allMedals ||= new Set()).add(ev.book);
    if (!inP(ev.t)) continue;
    const s = (x.apps[ev.a] ||= { n: 0, ps: [], items: [] });
    s.n++; if (ev.p != null) s.ps.push(ev.p); s.items.push(ev);
  }
  // 누적형 기록의 마지막 활동 시각도 반영
  for (const id of ["grammar", "quiz", "vocab"]) for (const [e, v] of state.snap[id]) {
    const x = get(e); if (v.last > x.last) x.last = v.last; if (v.last > (x.lastApp[id] || 0)) x.lastApp[id] = v.last;
  }
  if (state.grammarAgg) for (const [e, g] of state.grammarAgg) {
    if (!g.attempts) continue;
    const x = get(e); const s = (x.apps.grammar ||= { n: 0, ps: [], items: [] });
    s.attempts = g.attempts; s.correct = g.correct; s.xp = g.xp; s.days = g.days;
  }
  if (DEMO && state.demoGrammar) for (const [e, list] of state.demoGrammar) {
    const g = list.filter(r => inP(r.t)); if (!g.length) continue;
    const x = get(e); const s = (x.apps.grammar ||= { n: 0, ps: [], items: [] });
    s.attempts = g.length; s.correct = g.filter(r => r.ok).length; s.xp = g.reduce((t, r) => t + r.xp, 0);
  }
  for (const [e, v] of state.snap.quiz) if (inP(v.last)) { const x = get(e); x.apps.quiz ||= { n: 0, ps: [], items: [] }; x.apps.quiz.touched = true; }
  for (const [e, v] of state.snap.vocab) if (inP(v.last)) { const x = get(e); x.apps.vocab ||= { n: 0, ps: [], items: [] }; x.apps.vocab.touched = true; }
  return M;
}
function isActive(x, id) {
  const s = x?.apps[id]; if (!s) return false;
  if (id === "grammar") return (s.attempts || 0) > 0 || s.n > 0;
  return s.n > 0 || !!s.touched;
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
      const live = s.items.filter(e => e.k === "live"), hw = s.items.filter(e => e.k === "hw");
      const a = avg(s.ps), top3 = live.filter(e => e.rank <= 3).length;
      return { main: s.n, on, html: `<span class="m">${live.length}판${a != null ? " · " + Math.round(a) + "%" : ""}</span><span class="sub">과제 ${hw.length}${top3 ? " · 🏆" + top3 : ""}</span>`, csv: `수업 ${live.length} / 과제 ${hw.length} / ${a != null ? Math.round(a) + "%" : ""}` };
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
//  화면
// ======================================================================
function renderConn() {
  const box = $("#conn");
  if (DEMO) { box.innerHTML = `<div class="demo-banner">🧪 체험 모드예요. 가상의 학생 기록으로 화면을 보여 줘요. 실제 기록은 <a href="./">이 주소</a>에서 선생님 계정으로 연결하면 보여요.</div>`; return; }
  box.innerHTML = Object.entries(SOURCES).map(([id, d]) => {
    const S = state.src[id];
    const chip = { ok: `<span class="chip ok">✅ 연결됨</span>`, load: `<span class="chip load">⏳ 불러오는 중</span>`, err: `<span class="chip err">⚠️ 오류</span>`, off: `<span class="chip off">연결 안 됨</span>` }[S.st];
    let act = "";
    if (S.st === "off" || S.st === "err") act = id === "sb" ? `<div id="gsi-sb" class="gsi-slot"></div><button class="btn sm navy" data-conn="sb">Google로 연결</button>` : `<button class="btn sm navy" data-conn="${id}">Google로 연결</button>`;
    if (S.st === "ok") act = `<span class="small muted">${esc(S.email || "")}</span> <button class="btn sm" data-out="${id}">로그아웃</button>`;
    return `<div class="card src"><div class="src-h"><b>${d.name}</b>${chip}</div><div class="apps">${d.desc}</div>
      ${S.err ? `<div class="err-msg">${esc(S.err)}</div>` : ""}
      ${(S.warn || []).map(w => `<div class="err-msg">일부 못 읽음 · ${esc(w)}</div>`).join("")}
      ${id === "fc" && S.st === "ok" ? `<div class="note">Cloze는 ${esc(S.email)} 계정으로 만든 테스트의 제출만 보여요.</div>` : ""}
      <div>${act}</div></div>`;
  }).join("");
  box.querySelectorAll("[data-conn]").forEach(b => b.onclick = () => {
    const id = b.dataset.conn;
    if (id === "sb") { b.remove(); showGsi(); toast("위의 Google 버튼을 눌러 선생님 계정으로 로그인하세요."); }
    else fbStart(id, true);
  });
  box.querySelectorAll("[data-out]").forEach(b => b.onclick = async () => {
    const id = b.dataset.out;
    if (id === "sb") { await sbClient().auth.signOut(); state.src.sb = { st: "off" }; clearApps(["passport", "grammar", "quiz"]); renderConn(); render(); }
    else fbSignOut(id);
  });
}

function renderFilters() {
  const grades = [...new Set([...state.people.values()].map(p => p.grade).filter(Boolean))].sort();
  const g = $("#fGrade"), c = $("#fClass");
  g.innerHTML = `<option value="">전체</option>` + grades.map(x => `<option value="${x}" ${state.f.grade == x ? "selected" : ""}>${x}학년</option>`).join("");
  const classes = [...new Set([...state.people.values()].filter(p => !state.f.grade || p.grade === +state.f.grade).map(p => p.cls).filter(Boolean))].sort((a, b) => a - b);
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
  renderFilters();
  const M = aggregate();
  const people = visiblePeople();
  const apps = shownApps().filter(a => loadedApps().includes(a));
  renderKpis(people, M, apps);
  document.querySelectorAll("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.tab === state.tab));
  const v = $("#view");
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
    ["학생", people.length + "명", state.f.grade ? `${state.f.grade}학년${state.f.cls ? " " + state.f.cls + "반" : ""}` : "전체"],
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
  else if (key !== "no") list.sort((a, b) => dir * (cellsOf.get(b.email)[key]?.main - cellsOf.get(a.email)[key]?.main));
  else if (dir < 0) list.reverse();
  const ar = k => key === k ? `<span class="arrow">${dir > 0 ? "▼" : "▲"}</span>` : "";
  const head = `<tr><th class="sort sticky-col" data-sort="no">학생 ${ar("no")}</th><th class="sort" data-sort="act">활동 앱 ${ar("act")}</th>
    ${apps.map(a => `<th class="sort" data-sort="${a.id}">${a.icon} ${a.name}${a.cumulative ? " <span class='small'>(누적)</span>" : ""} ${ar(a.id)}</th>`).join("")}
    <th class="sort" data-sort="last">마지막 활동 ${ar("last")}</th></tr>`;
  const body = list.map(p => {
    const cs = cellsOf.get(p.email), x = M.get(p.email);
    const tag = p.grade && p.cls ? `${p.grade}-${p.cls}-${p.no ?? "?"}` : "";
    return `<tr><td class="name sticky-col"><button data-who="${esc(p.email)}">${esc(p.name || p.email.split("@")[0])}</button> <span class="small muted">${tag}</span></td>
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

function evLine(ev, showWho) {
  const p = state.people.get(ev.e), a = APP[ev.a];
  let val = "";
  if (ev.a === "passport") val = isMedal(ev.medal) ? ({ gold: "🥇", silver: "🥈", bronze: "🥉" }[ev.medal] || "🏅") + ` ${ev.s}/${ev.n}` : `${ev.s}/${ev.n}`;
  else if (ev.k === "stamp") val = "🏷️ 스탬프";
  else if (ev.a === "writing") val = `${ev.s}점${ev.cefr ? " · " + ev.cefr : ""}`;
  else if (ev.k === "live") val = `${ev.p}% · ${ev.rank}/${ev.of}등`;
  else if (ev.n) val = `${ev.s}/${ev.n}`;
  return `<li><span class="t">${kday(ev.t).slice(5).replace("-", "/")} ${new Date(ev.t + KST).toISOString().slice(11, 16)}</span><span class="ic">${a.icon}</span>
    <span>${showWho ? `<button class="who" data-who="${esc(ev.e)}" style="all:unset;cursor:pointer;font-weight:600;color:var(--navy)">${esc(p?.name || ev.e)}</button> · ` : ""}<span class="muted">${a.name}</span> ${esc(ev.title || "")}</span>
    <span class="val">${val}</span></li>`;
}
function viewFeed(people) {
  const [a, b] = periodRange();
  const who = new Set(people.map(p => p.email)), apps = new Set(shownApps().map(x => x.id));
  const list = state.events.filter(e => who.has(e.e) && apps.has(e.a) && e.t >= a && e.t < b).sort((x, y) => y.t - x.t);
  return `<div class="card panel"><h2>최근 활동 · ${periodLabel()} <span class="small muted">${list.length}건${list.length > 300 ? " 중 최근 300건" : ""}</span></h2>
    <p class="note">문법은 문제 하나하나 대신 스탬프만, Quiz Queens·Class123은 누적 기록이라 여기에 나오지 않아요.</p>
    ${list.length ? `<ul class="feed">${list.slice(0, 300).map(e => evLine(e, true)).join("")}</ul>` : `<div class="empty">이 기간에는 기록이 없어요.</div>`}</div>`;
}

function openStudent(email) {
  const p = state.people.get(email); if (!p) return;
  const M = aggregate(), x = M.get(email);
  const cards = APPS.filter(a => loadedApps().includes(a)).map(a => {
    const c = cell(a.id, email, x);
    return `<div class="app-card ${c.main < 0 ? "dim" : ""}"><div class="h">${a.icon} ${a.name}</div><div>${c.html.replace(/class="sub"/g, 'class="l" style="display:block"')}</div>
      <div class="l">마지막: ${fmtWhen(x?.lastApp[a.id])}</div></div>`;
  }).join("");
  const evs = state.events.filter(e => e.e === email).sort((a, b) => b.t - a.t);
  $("#modalBody").innerHTML = `<h2>${esc(p.name || email)}</h2>
    <div class="muted">${p.grade ? `${p.grade}학년 ${p.cls}반 ${p.no ?? "?"}번 · ` : ""}${esc(email)}</div>
    <p class="note">카드의 숫자는 ${periodLabel()} 기준이고, "누적"은 지금까지 전체예요.</p>
    <div class="app-cards">${cards}</div>
    <h3 style="margin:8px 0 4px;color:var(--navy)">전체 기록 <span class="small muted">${evs.length}건</span></h3>
    ${evs.length ? `<ul class="feed">${evs.slice(0, 200).map(e => evLine(e, false)).join("")}</ul>` : `<div class="empty">아직 기록이 없어요.</div>`}`;
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
  const M = aggregate(), people = sortPeople(visiblePeople()), apps = shownApps().filter(a => loadedApps().includes(a));
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
    const zeal = rnd(); if (zeal < 0.12) continue; // 아무 기록 없는 학생
    const T = () => now - Math.floor(rnd() * rnd() * 45 * DAY);
    for (let i = 0; i < zeal * 10; i++) { const [id, t] = pick(books); const s = 4 + Math.floor(rnd() * 7); addEvent({ e: email, a: "passport", t: T(), k: "quiz", title: t, book: id, s, n: 10, p: s * 10, medal: s === 10 ? "gold" : s >= 8 ? "silver" : s >= 6 ? "bronze" : "none" }); }
    const gl = []; for (let i = 0; i < zeal * 60; i++) gl.push({ t: T(), ok: rnd() < 0.75, xp: 10 }); state.demoGrammar.set(email, gl);
    state.snap.grammar.set(email, { xp: gl.length * 10, streak: Math.floor(zeal * 5), last: Math.max(0, ...gl.map(r => r.t)), stamps: Math.floor(zeal * 8) });
    for (let i = 0; i < zeal * 4; i++) addEvent({ e: email, a: "grammar", t: T(), k: "stamp", title: "단원 스탬프 " + pick(["1-1", "1-2", "2-3", "2-4"]) });
    if (rnd() < 0.7) { const ans = Math.floor(zeal * 300); state.snap.quiz.set(email, { xp: ans * 12, level: 1 + Math.floor(ans / 60), answered: ans, acc: 55 + Math.floor(rnd() * 40), last: T() }); }
    if (rnd() < 0.8) { state.snap.vocab.set(email, { xp: Math.floor(zeal * 900), streak: Math.floor(zeal * 9), learned: Math.floor(zeal * 300), mastered: Math.floor(zeal * 120), last: T() });
      for (let i = 0; i < zeal * 6; i++) { const s = 10 + Math.floor(rnd() * 11); addEvent({ e: email, a: "vocab", t: T(), k: "test", title: "중1 교과서 " + (1 + Math.floor(rnd() * 8)) + "과", s, n: 20, p: s * 5 }); } }
    for (let i = 0; i < zeal * 3; i++) { const s = 5 + Math.floor(rnd() * 11); addEvent({ e: email, a: "cloze", t: T(), k: "test", title: pick(["Lesson 2 빈칸", "Lesson 3 순서", "Lesson 3 빈칸"]), s, n: 15, p: pct(s, 15) }); }
    for (let i = 0; i < zeal * 2.5; i++) addEvent({ e: email, a: "writing", t: T(), k: "essay", title: pick(["My Weekend", "A Letter to My Future Self", "My Favorite Place"]), s: 60 + Math.floor(rnd() * 40), cefr: pick(["A1", "A2", "A2", "B1"]) });
    if (rnd() < 0.6) addEvent({ e: email, a: "kahoot", t: T(), k: "hw", title: "Lesson 3 단어 (과제)", s: 6 + Math.floor(rnd() * 5), n: 10, p: (6 + Math.floor(rnd() * 5)) * 10, tries: 1 });
  }
  // 반 전체가 함께 한 Kahoot 수업
  for (const g of [1, 2]) for (let c = 1; c <= 3; c++) for (let k = 0; k < 3; k++) {
    const t = now - Math.floor((2 + k * 9 + rnd() * 3) * DAY);
    const list = [...state.people.values()].filter(p => p.grade === g && p.cls === c && rnd() < 0.9).map(p => ({ p, sc: Math.floor(rnd() * 9000) }));
    list.sort((a, b) => b.sc - a.sc).forEach(({ p }, i) => { const cc = 4 + Math.floor(rnd() * 7); addEvent({ e: p.email, a: "kahoot", t, k: "live", title: `Lesson ${k + 2} Review`, s: cc, n: 10, p: cc * 10, rank: i + 1, of: list.length }); });
  }
  state.c123Raw = [];
  for (const g of [1, 2]) for (let c = 1; c <= 3; c++) state.c123Raw.push({ name: `${g}학년 ${c}반`, grade: String(g), students: [...state.people.values()].filter(p => p.grade === g && p.cls === c).map(p => ({ number: p.no, name: p.name, visibleEussuk: Math.floor(rnd() * 15), visibleMeossuk: Math.floor(rnd() * 3) })) });
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
if (DEMO) { buildDemo(); render(); }
else {
  render();
  // 이미 로그인된 저장소는 바로 불러와요 (팝업 없이)
  sbStart(false).catch(e => { state.src.sb = { st: "err", err: e.message }; renderConn(); });
  fbStart("fc", false);
  fbStart("fk", false);
}
