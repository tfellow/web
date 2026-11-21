// 실제 운영 저장소: Supabase (tfellow-web, 독서 여권 등 다른 MY 앱과 같은 프로젝트·같은 구글 로그인)
// 2026-11 Firebase Firestore 에서 옮겼어요. 표는 cloze/supabase_cloze.sql 의 "단어숲" 부분 (id, data jsonb).
//   ds_users/{이메일}             학생·교사 정보 + 학습 통계(stats)
//   ds_progress/{이메일|단어장}   단어별 암기 상태 { words: {wordId: {b,s,c,w,d,l}} }
//   ds_board/{이메일}             랭킹용 공개 요약 (이름, XP, 연속일 등만)
//   ds_results/{autoId}           단원 테스트 결과 (교사 통계용)
//   ds_books/{bookId}             교사가 올린 단어장 (+ _settings)
// 사람을 구분하는 uid 는 "소문자 이메일"이에요.
//
// 오프라인: 보낼 기록은 먼저 이 기기(localStorage)에 적어 두고 서버로 보내요. 인터넷이 끊겨 있으면
// 기기에 남아 있다가, 다시 연결되거나 앱을 다시 열 때 자동으로 보내요. 내 정보·암기 상태도 기기에 사본을 둬서
// 인터넷 없이 앱을 열어도 이어서 학습할 수 있어요.
import { supabaseConfig, APP } from '../config.js';
import { weekKey, toast } from '../lib/util.js';

// 내 컴퓨터(127.0.0.1) 미리보기에서만 시험용 가짜 서버로 바꿀 수 있어요. 실제 주소에서는 항상 진짜 Supabase.
const SB_JS = (location.hostname === '127.0.0.1' && localStorage.getItem('sb.mockUrl')) || 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';
const GIS_JS = 'https://accounts.google.com/gsi/client';
let sb = null, me = null, authCb = () => { };

const low = e => String(e || '').trim().toLowerCase();
const isTeacherEmail = e => APP.teacherEmails.map(low).includes(low(e));
const allowed = e => !APP.allowedGoogleDomain || low(e).endsWith('@' + APP.allowedGoogleDomain) || isTeacherEmail(e);

// ----- 기기 저장 (localStorage) -----
const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('저장 공간', e); } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
};
const kMe = uid => `ds.me.${uid}`;
const kProg = (uid, b) => `ds.prog.${uid}|${b}`;
const kPend = uid => `ds.pending.${uid}`;          // { user, progress: {bookId: map}, results: [{id, ...}] }
const pending = uid => LS.get(kPend(uid), { user: null, progress: {}, results: [] });

function boardDoc(u) {
  const s = u.stats || {};
  return { uid: u.uid, name: u.name, grade: u.grade, classNo: u.classNo, number: u.number, xp: s.xp || 0, weekXp: s.weekXp || 0, weekKey: s.weekKey || '', streak: s.streak || 0, lastDay: s.lastDay || null, learned: s.learned || 0, mastered: s.mastered || 0, badges: Object.keys(s.badges || {}).length };
}
const newId = () => {
  const c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(20)), b => c[b % c.length]).join('');
};
const clean = o => JSON.parse(JSON.stringify(o ?? {}));

// 권한 오류(보안 규칙)는 다시 보내도 소용없으므로 알려 주고, 그 밖의 오류(인터넷 끊김 등)는 기기에 두었다가 다시 보내요
const isAuthErr = e => e?.code === '42501' || e?.code === 'PGRST301' || /row-level security|JWT|permission/i.test(e?.message || '');
function err(e) { const x = new Error(e?.message || String(e)); x.code = isAuthErr(e) ? 'permission-denied' : (e?.code || 'network'); return x; }
async function q(p) { const { data, error } = await p; if (error) throw err(error); return data; }
async function all(build) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const rows = await q(build().order('id').range(from, from + 999));
    out.push(...rows);
    if (rows.length < 1000) return out;
  }
}

let flushing = null, flushAgain = false, retryT = null;
async function flushPending() {
  if (!me || !sb) return;
  // 보내는 중에 새 기록이 생기면, 지금 것이 끝난 뒤 한 번 더 보내요
  if (flushing) { flushAgain = true; return flushing; }
  const uid = me.uid;
  flushing = (async () => {
    await null; // flushing 에 먼저 담긴 뒤 시작 (보낼 것이 없을 때 바로 끝나 버려 flushing 이 남는 문제 방지)
    const P = pending(uid);
    try {
      for (const [book, words] of Object.entries(P.progress)) {
        await q(sb.from('ds_progress').upsert({ id: `${uid}|${book}`, uid, book, data: { words, updatedAt: Date.now() } }));
        const cur = pending(uid); if (cur.progress[book] === words || JSON.stringify(cur.progress[book]) === JSON.stringify(words)) { delete cur.progress[book]; LS.set(kPend(uid), cur); }
      }
      if (P.user) {
        const u = P.user;
        await q(sb.from('ds_users').upsert({ id: uid, data: u }));
        if (u.role === 'student') await q(sb.from('ds_board').upsert({ id: uid, data: boardDoc(u) }));
        const cur = pending(uid); if (JSON.stringify(cur.user) === JSON.stringify(u)) { cur.user = null; LS.set(kPend(uid), cur); }
      }
      for (const r of P.results) {
        const { id, ...data } = r;
        await q(sb.from('ds_results').upsert({ id, data }));
        const cur = pending(uid); cur.results = cur.results.filter(x => x.id !== id); LS.set(kPend(uid), cur);
      }
    } catch (e) {
      console.warn('보내기 대기', e);
      if (e.code === 'permission-denied') toast('저장 권한이 없어요. 학교 계정으로 로그인했는지 확인해 주세요.', 'bad');
      else { clearTimeout(retryT); retryT = setTimeout(flushPending, 30000); } // 서버가 잠시 안 될 때 30초 뒤 다시
    } finally {
      flushing = null;
      if (flushAgain) { flushAgain = false; setTimeout(flushPending, 0); }
    }
  })();
  return flushing;
}
// 잠깐(4초) 기다려 보고, 그 안에 안 끝나면 "기기에 보관됨"으로 보고 넘어가요 (오프라인에서 화면이 멈추지 않게)
function settle(p, ms = 4000) {
  return new Promise(res => { const t = setTimeout(() => res('queued'), ms); p.finally(() => { clearTimeout(t); res('ok'); }); });
}
addEventListener('online', () => flushPending());

let gisLoading = null;
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve();
  return gisLoading || (gisLoading = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = GIS_JS; s.async = true;
    s.onload = res; s.onerror = () => { gisLoading = null; rej(new Error('Google 로그인 프로그램을 불러오지 못했어요. 인터넷 연결을 확인해 주세요.')); };
    document.head.appendChild(s);
  }));
}

export const supabaseStore = {
  mode: 'supabase',
  async init() {
    const { createClient } = await import(/* @vite-ignore */ SB_JS);
    // storageKey 를 따로 정하지 않아 다른 MY 앱과 로그인 상태를 함께 써요
    sb = createClient(supabaseConfig.url, supabaseConfig.key, { auth: { persistSession: true, autoRefreshToken: true } });
    let user = null;
    try { user = (await sb.auth.getSession()).data.session?.user || null; } catch (e) { console.warn(e); }
    me = null;
    if (user && allowed(user.email)) {
      const uid = low(user.email);
      const teacher = isTeacherEmail(uid);
      let row = null, online = true;
      try { row = await q(sb.from('ds_users').select('data').eq('id', uid).maybeSingle()); }
      catch (e) { console.warn('내 정보', e); online = false; }
      const P = pending(uid);
      me = P.user || row?.data || (online ? null : LS.get(kMe(uid)));
      if (!me) me = { uid, email: uid, name: user.user_metadata?.full_name || user.user_metadata?.name || '', role: teacher ? 'teacher' : 'student', needsProfile: !teacher, createdAt: Date.now() };
      me.uid = uid; me.email = uid;
      if (teacher) { me.role = 'teacher'; delete me.needsProfile; me.name = me.name || user.user_metadata?.full_name || '선생님'; }
      else if (me.role !== 'student') me.role = 'student';
      if (!me.needsProfile) LS.set(kMe(uid), me);
      flushPending();
    } else if (user) {
      this.denied = low(user.email);
    }
    sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && me) { me = null; authCb(null); } });
  },
  onAuth(cb) { authCb = cb; cb(me); },
  current() { return me; },

  // 로그인 화면의 구글 버튼 자리에 Google 공식 버튼을 그려요 (로그인되면 새로고침)
  async renderGoogleButton(box) {
    await loadGis();
    google.accounts.id.initialize({
      client_id: supabaseConfig.googleClientId,
      callback: async r => {
        const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: r.credential });
        if (error) return toast('로그인 오류: ' + error.message, 'bad');
        location.reload();
      },
    });
    box.innerHTML = '';
    google.accounts.id.renderButton(box, { theme: 'filled_blue', size: 'large', text: 'signin_with', locale: 'ko', shape: 'pill' });
  },
  async signInGoogle() { throw new Error('구글 버튼을 눌러 로그인해 주세요.'); },
  async signInStudent() { throw new Error('학번 로그인은 지원하지 않아요. 학교 구글 계정으로 로그인해 주세요.'); },
  // 다른 MY 앱의 로그인까지 끊지 않도록 이 기기에서만 로그아웃해요
  async signOut() {
    await flushPending();
    try { await sb.auth.signOut({ scope: 'local' }); } catch (e) { console.warn(e); }
    try { window.google?.accounts?.id?.disableAutoSelect(); } catch { }
    me = null; this.denied = null; authCb(null);
  },

  async saveUser(u) {
    me = u;
    const c = clean(u); delete c.needsProfile;
    LS.set(kMe(u.uid), c);
    const P = pending(u.uid); P.user = c; LS.set(kPend(u.uid), P);
    await settle(flushPending());
  },
  async loadProgress(uid, bookId) {
    const P = pending(uid);
    if (P.progress[bookId]) return P.progress[bookId];
    try {
      const row = await q(sb.from('ds_progress').select('data').eq('id', `${uid}|${bookId}`).maybeSingle());
      const words = row?.data?.words || {};
      if (uid === me?.uid) LS.set(kProg(uid, bookId), words);
      return words;
    } catch (e) {
      if (uid === me?.uid) return LS.get(kProg(uid, bookId), {});
      throw e;
    }
  },
  async saveProgress(uid, bookId, map) {
    const words = clean(map);
    LS.set(kProg(uid, bookId), words);
    const P = pending(uid); P.progress[bookId] = words; LS.set(kPend(uid), P);
    await settle(flushPending());
  },
  async addResult(r) {
    const P = pending(r.uid); P.results.push({ id: newId(), ...clean(r) }); LS.set(kPend(r.uid), P);
    await settle(flushPending());
  },
  async myResults(uid) {
    let list = [];
    try { list = (await all(() => sb.from('ds_results').select('id,data').eq('uid', uid))).map(x => ({ id: x.id, ...x.data })); }
    catch (e) { console.warn(e); }
    const have = new Set(list.map(x => x.id));
    pending(uid).results.forEach(r => { if (!have.has(r.id)) list.push(r); });
    return list.sort((a, b) => b.ts - a.ts);
  },
  async board({ grade, classNo }) {
    const list = (await all(() => {
      let r = sb.from('ds_board').select('id,data').eq('data->>grade', String(+grade));
      if (classNo) r = r.eq('data->>classNo', String(+classNo));
      return r;
    })).map(x => x.data);
    const wk = weekKey(); list.forEach(b => { if (b.weekKey !== wk) b.weekXp = 0; });
    return list;
  },

  // ----- 교사용 -----
  async listStudents({ grade, classNo }) {
    return (await all(() => {
      let r = sb.from('ds_users').select('id,data').eq('role', 'student');
      if (grade) r = r.eq('data->>grade', String(+grade));
      if (classNo) r = r.eq('data->>classNo', String(+classNo));
      return r;
    })).map(x => ({ ...x.data, uid: x.id }));
  },
  async listProgress(uids, bookId) {
    const out = {};
    uids.forEach(u => { out[u] = {}; });
    for (let i = 0; i < uids.length; i += 100) {
      const part = uids.slice(i, i + 100);
      const rows = await all(() => sb.from('ds_progress').select('id,uid,data').eq('book', bookId).in('uid', part));
      rows.forEach(r => { out[r.uid] = r.data?.words || {}; });
    }
    return out;
  },
  async listResults({ grade, classNo }) {
    return (await all(() => {
      let r = sb.from('ds_results').select('id,data');
      if (grade) r = r.eq('data->>grade', String(+grade));
      if (classNo) r = r.eq('data->>classNo', String(+classNo));
      return r;
    })).map(x => ({ id: x.id, ...x.data }));
  },
  // 교사가 올린 단어장: 인터넷이 없으면 지난번에 받아 둔 사본을 써요
  async listBooks() {
    try {
      const list = (await all(() => sb.from('ds_books').select('id,data'))).map(x => x.data);
      LS.set('ds.books', list);
      return list;
    } catch (e) {
      const cached = LS.get('ds.books');
      if (cached && e.code !== 'permission-denied') return cached;
      throw e;
    }
  },
  async saveBook(b) { await q(sb.from('ds_books').upsert({ id: b.id, data: clean(b) })); },
  async deleteBook(id) { await q(sb.from('ds_books').delete().eq('id', id)); },
  async deleteStudent(uid) {
    // 구글 로그인 계정은 그대로 남아요. 학생이 다시 들어오면 정보 입력부터 다시 해요.
    await q(sb.from('ds_board').delete().eq('id', uid));
    await q(sb.from('ds_users').delete().eq('id', uid));
  },
};
