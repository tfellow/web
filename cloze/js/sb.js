// Supabase 연결 (2026-11 Firestore 에서 이전)
// 앱 코드가 예전 Firestore 함수 이름(doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
// collection, query, where, onSnapshot, serverTimestamp, Timestamp, writeBatch)을 그대로 쓰도록
// 같은 이름의 함수를 Supabase 위에 만들어 둔 파일이에요. 표는 supabase_cloze.sql 참고 (id, data jsonb).
import { SUPABASE_URL, SUPABASE_KEY } from "./config.js?v=3";

// 내 컴퓨터(127.0.0.1) 미리보기에서만 시험용 가짜 서버로 바꿀 수 있어요. 실제 주소에서는 항상 진짜 Supabase.
const SB_JS = (location.hostname === "127.0.0.1" && localStorage.getItem("sb.mockUrl")) || "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm";
const { createClient } = await import(SB_JS);

// 저장 키를 따로 정하지 않아서 독서 여권 등 다른 MY 앱과 로그인 상태를 함께 써요.
export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true } });
export const db = { sb };

const TABLE = { users: "cz_users", tests: "cz_tests", submissions: "cz_submissions", board: "cz_board", assignments: "cz_assignments" };
const SERVER_TS = "__SERVER_TS__";
export const serverTimestamp = () => SERVER_TS;
export const Timestamp = { fromDate: d => new Date(d).toISOString(), now: () => new Date().toISOString() };

function tableOf(name) {
  const t = TABLE[name];
  if (!t) throw new Error("알 수 없는 표: " + name);
  return t;
}
export function collection(_db, name) { return { name, table: tableOf(name), wheres: [] }; }
export function doc(_db, name, id) { return { name, table: tableOf(name), id: String(id) }; }
export function where(field, op, value) {
  if (op !== "==") throw new Error("where 는 == 만 쓸 수 있어요: " + op);
  return { field, value };
}
export function query(col, ...wheres) { return { ...col, wheres: [...(col.wheres || []), ...wheres] }; }

// Date → ISO 문자열, undefined 는 빼기 (Firestore ignoreUndefinedProperties 와 같게)
const clean = data => JSON.parse(JSON.stringify(data ?? {}));
const newId = () => {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const r = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(r, b => c[b % c.length]).join("");
};
function fail(e, what) {
  const err = new Error(`${what}: ${e?.message || e}`);
  const code = String(e?.code || "");
  err.code = code === "42501" || /row-level security|permission/i.test(e?.message || "") ? "permission-denied"
    : code === "PGRST301" || /JWT/i.test(e?.message || "") ? "unauthenticated" : (code || "unknown");
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
  const { error } = await sb.from(ref.table).upsert({ id: ref.id, data: d });
  if (error) throw fail(error, ref.name);
}
export async function addDoc(col, data) {
  const id = newId();
  const { error } = await sb.from(col.table).insert({ id, data: clean(data) });
  if (error) throw fail(error, col.name);
  return { id, ...doc(null, col.name, id) };
}
// "settings.open" 처럼 점으로 이어진 이름은 안쪽 값만 바꿔요
function applyPatch(base, patch) {
  const d = structuredClone(base);
  for (const [k, v] of Object.entries(clean(patch))) {
    const path = k.split(".");
    let o = d;
    for (const p of path.slice(0, -1)) { if (o[p] == null || typeof o[p] !== "object") o[p] = {}; o = o[p]; }
    o[path[path.length - 1]] = v;
  }
  return d;
}
export async function updateDoc(ref, patch) {
  const old = await readOne(ref);
  if (!old) { const e = new Error(ref.name + " 문서가 없어요."); e.code = "not-found"; throw e; }
  const { data, error } = await sb.from(ref.table).update({ data: applyPatch(old, patch) }).eq("id", ref.id).select("id");
  if (error) throw fail(error, ref.name);
  if (!data.length) throw fail({ code: "42501", message: "권한이 없어요." }, ref.name);
}
export async function deleteDoc(ref) {
  const { error } = await sb.from(ref.table).delete().eq("id", ref.id);
  if (error) throw fail(error, ref.name);
}
export function writeBatch() {
  const ops = [];
  return {
    update(ref, patch) { ops.push(() => updateDoc(ref, patch)); return this; },
    set(ref, data, o) { ops.push(() => setDoc(ref, data, o)); return this; },
    delete(ref) { ops.push(() => deleteDoc(ref)); return this; },
    async commit() { for (let i = 0; i < ops.length; i += 10) await Promise.all(ops.slice(i, i + 10).map(f => f())); },
  };
}

// 실시간: 처음 한 번 읽고, 표가 바뀌면(Supabase Realtime) 다시 읽어요. 실시간 연결이 안 되어도 15초마다 다시 읽어요.
let chanNo = 0;
export function onSnapshot(q, next, onErr) {
  let stopped = false, timer = null, busy = false, again = false;
  const run = async () => {
    if (stopped) return;
    if (busy) { again = true; return; }
    busy = true;
    try { const rows = await fetchRows(q); if (!stopped) next(new QuerySnap(rows)); }
    catch (e) { console.error(e); if (onErr) onErr(e); }
    busy = false;
    if (again) { again = false; run(); }
  };
  const soon = () => { clearTimeout(timer); timer = setTimeout(run, 400); };
  run();
  const ch = sb.channel(`cz-${q.table}-${++chanNo}`)
    .on("postgres_changes", { event: "*", schema: "public", table: q.table }, soon)
    .subscribe();
  const poll = setInterval(run, 15000);
  return () => { stopped = true; clearInterval(poll); clearTimeout(timer); sb.removeChannel(ch); };
}
