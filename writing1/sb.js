// AI 영작문 튜터 ↔ Supabase 연결 (2026-11 Firebase 에서 이전)
// app.js 가 예전 Firebase 함수 이름(로그인: onAuthStateChanged, signOut, getIdToken / 저장: doc, getDoc,
// getDocs, setDoc, addDoc, deleteDoc, query, where, onSnapshot, serverTimestamp, deleteField, writeBatch)을
// 그대로 쓰도록 같은 이름의 함수를 Supabase 위에 만들어 둔 파일이에요. 표는 supabase_writing1.sql 참고.
// 로그인은 다른 MY 앱과 같은 학교 구글 계정(Google Identity Services → Supabase)이고, uid = 소문자 이메일이에요.
const SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
const SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF"; // 공개 키 (보안은 RLS 가 맡아요)
export const GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";

// 내 컴퓨터(127.0.0.1) 미리보기에서만 시험용 가짜 서버로 바꿀 수 있어요. 실제 주소에서는 항상 진짜 Supabase.
const SB_JS = (location.hostname === "127.0.0.1" && localStorage.getItem("sb.mockUrl")) || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm";
const { createClient } = await import(SB_JS);
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

// 예전 Firestore 컬렉션 이름 → Supabase 표
const TABLE = {
  vocab_results: "w1_submissions",   // 영작문 제출
  vocab_books: "w1_settings",        // _settings: 과제 목록·Gemini 사용 여부
  writing1_private: "w1_private",    // config: 명렬표·교사 시험용 키 (교사 전용)
  writing1_students: "w1_students",  // 이메일별 학번·이름
  users: "cz_users",                 // 실명 찾기 (MY Cloze 내 정보, 읽기만)
  vocab_users: "ds_users",           // 실명 찾기 (단어숲 학생 정보, 읽기만)
};

// ===================== 로그인 =====================
const listeners = new Set();
let current;            // undefined = 아직 모름, null = 로그아웃
const toUser = u => u ? { uid: String(u.email || "").toLowerCase(), email: String(u.email || "").toLowerCase(), displayName: u.user_metadata?.full_name || u.user_metadata?.name || "" } : null;
function emit(u) {
  const key = u ? u.email : null;
  if (current !== undefined && (current ? current.email : null) === key) return;
  current = u;
  listeners.forEach(cb => { try { cb(u); } catch (e) { console.error(e); } });
}
export const auth = { sb };
export function getAuth() { return auth; }
export function onAuthStateChanged(_auth, cb) {
  listeners.add(cb);
  // Firebase 처럼 조금 뒤에 알려요 (app.js 가 아래쪽 변수까지 다 준비한 다음에 불리도록)
  if (current !== undefined) setTimeout(() => { if (listeners.has(cb)) cb(current); }, 0);
  return () => listeners.delete(cb);
}
sb.auth.getSession().then(r => emit(toUser(r.data.session?.user)), () => emit(null));
sb.auth.onAuthStateChange((ev, s) => {
  if (ev === "SIGNED_OUT") emit(null);
  else if (ev === "SIGNED_IN" || ev === "INITIAL_SESSION") { if (s?.user) emit(toUser(s.user)); }
});
// 다른 MY 앱의 로그인까지 끊지 않도록 이 기기에서만 로그아웃해요
export async function signOut() {
  try { await sb.auth.signOut({ scope: "local" }); } catch (e) { console.warn(e); }
  try { window.google?.accounts?.id?.disableAutoSelect(); } catch {}
  emit(null);
}
export async function getIdToken() {
  const { data } = await sb.auth.getSession();
  return data.session?.access_token || "";
}
let gisLoading = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return gisLoading || (gisLoading = new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client"; s.async = true;
    s.onload = res; s.onerror = () => { gisLoading = null; rej(new Error("Google 로그인 프로그램을 불러오지 못했어요.")); };
    document.head.appendChild(s);
  }));
}
let gisReady = false;
// 로그인 버튼 자리에 Google 공식 버튼을 그려요 (로그인되면 onAuthStateChanged 가 불려요)
export async function renderGoogleButton(box, opts = {}) {
  if (!box) return;
  await loadGis();
  if (!gisReady) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async r => {
        const { data, error } = await sb.auth.signInWithIdToken({ provider: "google", token: r.credential });
        if (error) return alert("로그인 중 오류가 발생했습니다: " + error.message);
        emit(toUser(data.user));
      }
    });
    gisReady = true;
  }
  box.innerHTML = "";
  google.accounts.id.renderButton(box, { theme: "filled_blue", size: opts.size || "large", text: "signin_with", locale: "ko", shape: "pill" });
}

// ===================== 저장 =====================
export const db = { sb };
const SERVER_TS = "__SERVER_TS__";
const DELETE = { __w1Delete: true };
export const serverTimestamp = () => SERVER_TS;
export const deleteField = () => DELETE;
function tableOf(name) { const t = TABLE[name]; if (!t) throw new Error("알 수 없는 표: " + name); return t; }
export function getFirestore() { return db; }
export function collection(_db, name) { return { name, table: tableOf(name), wheres: [] }; }
export function doc(_db, name, id) { return { name, table: tableOf(name), id: String(id), isDoc: true }; }
export function where(field, op, value) { if (op !== "==") throw new Error("where 는 == 만 써요"); return { field, value }; }
export function orderBy() { return null; }
export function query(col, ...ws) { return { ...col, wheres: [...(col.wheres || []), ...ws.filter(Boolean)] }; }

// undefined 는 빼고 Date 는 ISO 문자열로 (deleteField 표시는 그대로 둬요)
const clean = data => JSON.parse(JSON.stringify(data ?? {}, (k, v) => (v === DELETE ? { __w1Delete: true } : v)));
const isDel = v => v && typeof v === "object" && v.__w1Delete === true;
const newId = () => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), b => c[b % c.length]).join("");
};
function fail(e, what) {
  const err = new Error(`${what}: ${e?.message || e}`);
  const code = String(e?.code || "");
  err.code = code === "42501" || /row-level security|permission/i.test(e?.message || "") ? "permission-denied" : (code || "unknown");
  return err;
}
class DocSnap {
  constructor(id, data) { this.id = id; this._d = data; }
  exists() { return this._d != null; }
  data() { return this._d == null ? undefined : this._d; }
}
class QuerySnap {
  constructor(rows) { this.docs = rows.map(r => new DocSnap(r.id, r.data)); }
  get empty() { return this.docs.length === 0; }
  get size() { return this.docs.length; }
  forEach(fn) { this.docs.forEach(fn); }
}
async function fetchRows(q) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    let r = sb.from(q.table).select("id,data").order("id").range(from, from + 999);
    for (const w of q.wheres || []) r = w.field === "id" ? r.eq("id", String(w.value)) : r.eq(`data->>${w.field}`, String(w.value));
    const { data, error } = await r;
    if (error) throw fail(error, q.name);
    out.push(...data);
    if (data.length < 1000) return out;
  }
}
async function readOne(ref) {
  const { data, error } = await sb.from(ref.table).select("id,data").eq("id", ref.id).maybeSingle();
  if (error) throw fail(error, ref.name);
  return data ? data.data : null;
}
export async function getDoc(ref) { return new DocSnap(ref.id, await readOne(ref)); }
export async function getDocs(q) { return new QuerySnap(await fetchRows(q)); }
export async function setDoc(ref, data, opts = {}) {
  let d = clean(data);
  if (opts.merge) { const old = await readOne(ref); if (old) d = { ...old, ...d }; }
  for (const k of Object.keys(d)) if (isDel(d[k])) delete d[k];
  const { error } = await sb.from(ref.table).upsert({ id: ref.id, data: d });
  if (error) throw fail(error, ref.name);
}
export async function addDoc(col, data) {
  const id = newId();
  const d = clean(data);
  for (const k of Object.keys(d)) if (isDel(d[k])) delete d[k];
  const { error } = await sb.from(col.table).insert({ id, data: d });
  if (error) throw fail(error, col.name);
  return { id, ...doc(null, col.name, id) };
}
export async function deleteDoc(ref) {
  const { error } = await sb.from(ref.table).delete().eq("id", ref.id);
  if (error) throw fail(error, ref.name);
}
export function writeBatch() {
  const ops = [];
  return {
    set(ref, data, o) { ops.push(() => setDoc(ref, data, o)); return this; },
    delete(ref) { ops.push(() => deleteDoc(ref)); return this; },
    async commit() {
      // 같은 표에 넣는 set 은 한 번에 보내요 (명부 수백 줄)
      for (let i = 0; i < ops.length; i += 20) await Promise.all(ops.slice(i, i + 20).map(f => f()));
    },
  };
}
// 실시간: 처음 한 번 읽고, 표가 바뀌면(Supabase Realtime) 다시 읽어요. 연결이 안 되어도 20초마다 다시 읽어요.
let chanNo = 0;
export function onSnapshot(ref, next, onErr) {
  let stopped = false, timer = null, busy = false, again = false;
  const run = async () => {
    if (stopped) return;
    if (busy) { again = true; return; }
    busy = true;
    try {
      const snap = ref.isDoc ? new DocSnap(ref.id, await readOne(ref)) : new QuerySnap(await fetchRows(ref));
      if (!stopped) next(snap);
    } catch (e) { console.error(e); if (onErr) onErr(e); }
    busy = false;
    if (again) { again = false; run(); }
  };
  const soon = () => { clearTimeout(timer); timer = setTimeout(run, 400); };
  run();
  const ch = sb.channel(`w1-${ref.table}-${++chanNo}`)
    .on("postgres_changes", { event: "*", schema: "public", table: ref.table }, soon)
    .subscribe();
  const poll = setInterval(run, 20000);
  return () => { stopped = true; clearInterval(poll); clearTimeout(timer); sb.removeChannel(ch); };
}
