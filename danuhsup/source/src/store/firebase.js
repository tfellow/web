// 실제 운영 저장소: Firebase Authentication + Cloud Firestore
// 컬렉션 구조 (같은 Firebase 프로젝트의 다른 앱과 겹치지 않도록 vocab_ 접두어 사용)
//   vocab_users/{uid}                    학생·교사 정보 + 학습 통계(stats)
//   vocab_users/{uid}/progress/{bookId}  단어별 암기 상태 { words: {wordId: {b,s,c,w,d,l}} }
//   vocab_board/{uid}                    랭킹용 공개 요약 (이름, XP, 연속일 등만)
//   vocab_results/{autoId}               단원 테스트 결과 (교사 통계용)
//   vocab_books/{bookId}                 교사가 업로드한 단어장
import { firebaseConfig, APP, FIREBASE_VERSION } from '../config.js';
import { weekKey, toast } from '../lib/util.js';

// Firestore 는 인터넷이 끊기면 쓰기를 기기에 보관했다가 다시 연결될 때 보냅니다.
// 그런데 서버 응답을 끝까지 기다리면 오프라인에서 화면이 멈추므로, 잠시 기다린 뒤에는
// "기기에 보관됨"으로 보고 넘어갑니다. 나중에 실패하면 그때 알려 줍니다.
function settle(p, ms = 4000) {
  return new Promise((res, rej) => {
    let done = false;
    const t = setTimeout(() => { done = true; res('queued'); }, ms);
    p.then(v => { if (!done) { done = true; clearTimeout(t); res(v); } },
      e => {
        if (!done) { done = true; clearTimeout(t); rej(e); return; }
        console.error(e);
        toast(e?.code === 'permission-denied' ? '저장 권한이 없어요. 학교 계정으로 로그인했는지 확인해 주세요.' : `기록을 서버에 보내지 못했어요. (${e?.code || e?.message || '알 수 없는 오류'})`, 'bad');
      });
  });
}

const V = FIREBASE_VERSION;
let A, F, auth, fs, me = null, authCb = () => { };
const gs = m => import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${V}/firebase-${m}.js`);

function boardDoc(u) {
  const s = u.stats || {};
  return { uid: u.uid, name: u.name, grade: u.grade, classNo: u.classNo, number: u.number, xp: s.xp || 0, weekXp: s.weekXp || 0, weekKey: s.weekKey || '', streak: s.streak || 0, lastDay: s.lastDay || null, learned: s.learned || 0, mastered: s.mastered || 0, badges: Object.keys(s.badges || {}).length };
}
const isTeacherEmail = e => APP.teacherEmails.map(x => x.toLowerCase()).includes((e || '').toLowerCase());

export const firebaseStore = {
  mode: 'firebase',
  async init() {
    const [app, a, f] = await Promise.all([gs('app'), gs('auth'), gs('firestore')]);
    A = a; F = f;
    const fa = app.initializeApp(firebaseConfig);
    auth = A.getAuth(fa);
    fs = F.initializeFirestore(fa, { ignoreUndefinedProperties: true, localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
    this.app = fa;
    await new Promise(res => {
      A.onAuthStateChanged(auth, async user => {
        if (!user) { me = null; authCb(null); return res(); }
        const teacher = isTeacherEmail(user.email) && user.providerData.some(p => p.providerId === 'google.com');
        const snap = await F.getDoc(F.doc(fs, 'vocab_users', user.uid));
        if (snap.exists()) me = snap.data();
        else me = { uid: user.uid, email: user.email, name: user.displayName || '', role: teacher ? 'teacher' : 'student', needsProfile: !teacher, createdAt: Date.now() };
        if (teacher) { me.role = 'teacher'; delete me.needsProfile; me.name = me.name || user.displayName || '선생님'; }
        authCb(me); res();
      });
    });
  },
  onAuth(cb) { authCb = cb; cb(me); },
  current() { return me; },

  async signInGoogle() {
    const p = new A.GoogleAuthProvider();
    if (APP.allowedGoogleDomain) p.setCustomParameters({ hd: APP.allowedGoogleDomain });
    const r = await A.signInWithPopup(auth, p);
    if (APP.allowedGoogleDomain && !r.user.email.endsWith('@' + APP.allowedGoogleDomain) && !isTeacherEmail(r.user.email)) {
      await A.signOut(auth); throw new Error(`${APP.allowedGoogleDomain} 계정으로만 로그인할 수 있습니다.`);
    }
  },
  // 학번(예: 20315) + 비밀번호 로그인. 처음이면 가입 후 프로필 입력
  async signInStudent({ id, pw, register }) {
    const email = `s${id}@${APP.studentEmailDomain}`;
    try {
      if (register) await A.createUserWithEmailAndPassword(auth, email, pw);
      else await A.signInWithEmailAndPassword(auth, email, pw);
    } catch (e) {
      const m = { 'auth/email-already-in-use': '이미 가입된 학번입니다. 로그인해 주세요.', 'auth/invalid-credential': '학번 또는 비밀번호가 맞지 않습니다.', 'auth/wrong-password': '비밀번호가 맞지 않습니다.', 'auth/user-not-found': '가입되지 않은 학번입니다. 처음이면 "처음 사용" 을 눌러 주세요.', 'auth/weak-password': '비밀번호는 6자 이상이어야 합니다.', 'auth/too-many-requests': '시도가 너무 많습니다. 잠시 후 다시 해 주세요.' }[e.code];
      throw new Error(m || e.message);
    }
  },
  async signOut() { await A.signOut(auth); },

  async saveUser(u) {
    me = u;
    const clean = JSON.parse(JSON.stringify(u)); delete clean.needsProfile;
    const batch = F.writeBatch(fs);
    batch.set(F.doc(fs, 'vocab_users', u.uid), clean);
    if (u.role === 'student') batch.set(F.doc(fs, 'vocab_board', u.uid), boardDoc(u));
    await settle(batch.commit());
  },
  async loadProgress(uid, bookId) { const s = await F.getDoc(F.doc(fs, 'vocab_users', uid, 'progress', bookId)); return s.exists() ? (s.data().words || {}) : {}; },
  async saveProgress(uid, bookId, map) { await settle(F.setDoc(F.doc(fs, 'vocab_users', uid, 'progress', bookId), { words: map, updatedAt: Date.now() })); },
  async addResult(r) { await settle(F.addDoc(F.collection(fs, 'vocab_results'), r)); },
  async myResults(uid) {
    const q = F.query(F.collection(fs, 'vocab_results'), F.where('uid', '==', uid));
    return (await F.getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.ts - a.ts);
  },
  async board({ grade, classNo }) {
    const cs = [F.where('grade', '==', +grade)]; if (classNo) cs.push(F.where('classNo', '==', +classNo));
    const list = (await F.getDocs(F.query(F.collection(fs, 'vocab_board'), ...cs))).docs.map(d => d.data());
    const wk = weekKey(); list.forEach(b => { if (b.weekKey !== wk) b.weekXp = 0; });
    return list;
  },

  // ----- 교사용 -----
  async listStudents({ grade, classNo }) {
    const cs = [F.where('role', '==', 'student')];
    if (grade) cs.push(F.where('grade', '==', +grade));
    if (classNo) cs.push(F.where('classNo', '==', +classNo));
    return (await F.getDocs(F.query(F.collection(fs, 'vocab_users'), ...cs))).docs.map(d => d.data());
  },
  async listProgress(uids, bookId) {
    const out = {};
    await Promise.all(uids.map(async u => { out[u] = await this.loadProgress(u, bookId); }));
    return out;
  },
  async listResults({ grade, classNo }) {
    const cs = []; if (grade) cs.push(F.where('grade', '==', +grade)); if (classNo) cs.push(F.where('classNo', '==', +classNo));
    return (await F.getDocs(F.query(F.collection(fs, 'vocab_results'), ...cs))).docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async listBooks() { return (await F.getDocs(F.collection(fs, 'vocab_books'))).docs.map(d => d.data()); },
  async saveBook(b) { await F.setDoc(F.doc(fs, 'vocab_books', b.id), b); },
  async deleteBook(id) { await F.deleteDoc(F.doc(fs, 'vocab_books', id)); },
  async deleteStudent(uid) {
    // 로그인 계정 자체는 Firebase 콘솔 → Authentication 에서 삭제해야 합니다.
    await F.deleteDoc(F.doc(fs, 'vocab_board', uid));
    await F.deleteDoc(F.doc(fs, 'vocab_users', uid));
  },

  // ----- Gemini (Firebase AI Logic) -----
  async ai(prompt) {
    const ai = await gs('ai');
    const inst = ai.getAI(this.app, { backend: new ai.GoogleAIBackend() });
    const model = ai.getGenerativeModel(inst, { model: 'gemini-2.5-flash' });
    const r = await model.generateContent(prompt);
    return r.response.text();
  },
};
