// 체험 모드 저장소: 이 브라우저의 localStorage에 모든 데이터를 저장합니다.
// 교사 통계 화면을 바로 체험할 수 있도록 가상의 학생 데이터를 함께 만듭니다.
import { ls, dayKey, dayNum, dayNumToKey, weekKey, seeded } from '../lib/util.js';
import { freshStats, INTERVALS, MASTER_BOX } from '../lib/game.js';
import { BUILTIN_BOOKS } from '../data/books.js';

const KEY = 'vocab.demo.v1';
let db = null;
let authCb = () => { };

function load() {
  db = ls.get(KEY, null);
  if (!db || !db.users) { db = { users: {}, progress: {}, results: [], books: {}, session: null }; seedDemo(); persist(); }
}
let t;
function persist() { clearTimeout(t); t = setTimeout(() => ls.set(KEY, db), 150); }

const NAMES = ['김하늘', '이서준', '박지우', '최하은', '정민준', '강서연', '조도윤', '윤지아', '장시우', '임수아', '한예준', '오채원', '서주원', '신다은', '권하준', '황유나', '안지호', '송서윤', '전건우', '홍소율', '유은우', '고예린', '문태윤', '양가은', '손현우', '배나연', '백승민', '허지유', '남도현', '노하린', '심준서', '곽민서'];

function seedDemo() {
  const rnd = seeded(20261101);
  const book = BUILTIN_BOOKS[0];
  const today = dayNum();
  let i = 0;
  for (let c = 1; c <= 4; c++) {
    for (let k = 1; k <= 8; k++, i++) {
      const uid = `demo-s-${c}-${k}`;
      const dil = 0.08 + rnd() * 0.82; // 성실도
      const stopAt = rnd() < 0.2 ? today - 3 - Math.floor(rnd() * 8) : today + 1; // 최근 학습을 멈춘 학생
      const skill = 0.55 + rnd() * 0.4; // 정답률
      const st = freshStats();
      const prog = {};
      const reach = Math.max(1, Math.round(dil * 8)); // 진도 단원
      const pool = book.words.filter(w => w.lesson <= reach);
      let ptr = 0;
      let streak = 0, best = 0, prevActive = false, lastDay = null;
      for (let d = today - 34; d <= today; d++) {
        const active = d < stopAt && rnd() < dil;
        if (!active) { prevActive = false; streak = 0; continue; }
        streak = prevActive ? streak + 1 : 1; best = Math.max(best, streak); prevActive = true; lastDay = d;
        const n = 10 + Math.floor(rnd() * 40 * dil + 5);
        let c2 = 0, nw = 0;
        for (let q = 0; q < n; q++) {
          const w = pool[ptr < pool.length && rnd() < 0.5 ? ptr++ : Math.floor(rnd() * Math.max(1, ptr))];
          if (!w) continue;
          const ok = rnd() < skill;
          const s = prog[w.id] || (nw++, { b: 0, s: 0, c: 0, w: 0 });
          s.s++; if (ok) { s.c++; s.b = Math.min(5, s.b + (rnd() < .5 ? 2 : 1)); c2++; } else { s.w++; s.b = 1; }
          s.d = d + INTERVALS[s.b]; s.l = (d * 86400000) + 3600000 * 16; prog[w.id] = s;
        }
        const xp = c2 * 10 + (n - c2) * 2 + nw * 3;
        st.days[dayNumToKey(d)] = { xp, n, c: c2, w: nw, t: n * 7 };
        st.xp += xp;
        if (d >= dayNum() - ((new Date().getDay() + 6) % 7)) st.weekXp += xp;
      }
      st.weekKey = weekKey();
      st.streak = (lastDay !== null && lastDay >= today - 1) ? streak : 0;
      st.bestStreak = best; st.lastDay = lastDay !== null ? dayNumToKey(lastDay) : null;
      st.learned = Object.keys(prog).length;
      st.mastered = Object.values(prog).filter(s => s.b >= MASTER_BOX).length;
      const tests = [];
      for (let l = 1; l <= reach; l++) {
        if (rnd() < 0.75) {
          const total = 20, score = Math.max(4, Math.min(20, Math.round(total * (skill + (rnd() - .5) * .25))));
          const wrong = book.words.filter(w => w.lesson === l).sort(() => rnd() - .5).slice(0, total - score).map(w => w.id);
          tests.push({ id: `r-${uid}-${l}`, uid, name: NAMES[i], grade: 2, classNo: c, number: k, bookId: book.id, lesson: l, score, total, pct: Math.round(score / total * 100), wrong, ts: Date.now() - Math.floor(rnd() * 30) * 86400000, sec: 200 + Math.floor(rnd() * 300) });
        }
      }
      st.counters = { tests: tests.length, perfect: tests.filter(x => x.score === x.total).length, goals: Math.floor(best / 2) };
      for (const b of ['first', 'w50', 'w100', 's3', 's7']) if ((b === 'first') || (b === 'w50' && st.learned >= 50) || (b === 'w100' && st.learned >= 100) || (b === 's3' && best >= 3) || (b === 's7' && best >= 7)) st.badges[b] = Date.now();
      db.users[uid] = { uid, role: 'student', name: NAMES[i], grade: 2, classNo: c, number: k, demo: true, createdAt: Date.now() - 40 * 86400000, stats: st };
      db.progress[uid] = { [book.id]: prog };
      db.results.push(...tests);
    }
  }
}

export const localStore = {
  mode: 'demo',
  async init() { load(); },
  onAuth(cb) { authCb = cb; cb(db.session ? db.users[db.session] : null); },
  current() { return db.session ? db.users[db.session] : null; },

  async demoLogin(role, prof = {}) {
    let uid;
    if (role === 'teacher') {
      uid = 'demo-teacher';
      db.users[uid] = db.users[uid] || { uid, role: 'teacher', name: '체험 선생님', email: 'teacher@example.com', createdAt: Date.now(), stats: freshStats() };
    } else {
      uid = `demo-me-${prof.grade}-${prof.classNo}-${prof.number}`;
      if (!db.users[uid]) db.users[uid] = { uid, role: 'student', name: prof.name, grade: +prof.grade, classNo: +prof.classNo, number: +prof.number, createdAt: Date.now(), stats: freshStats() };
      else db.users[uid].name = prof.name || db.users[uid].name;
    }
    db.session = uid; persist(); authCb(db.users[uid]); return db.users[uid];
  },
  async signOut() { db.session = null; persist(); authCb(null); },
  async resetDemo() { ls.del(KEY); load(); authCb(null); },

  async saveUser(u) { db.users[u.uid] = JSON.parse(JSON.stringify(u)); persist(); },
  async loadProgress(uid, bookId) { return JSON.parse(JSON.stringify((db.progress[uid] || {})[bookId] || {})); },
  async saveProgress(uid, bookId, map) { (db.progress[uid] = db.progress[uid] || {})[bookId] = map; persist(); },
  async addResult(r) { db.results.push({ id: 'r' + Date.now(), ...r }); persist(); },
  async myResults(uid) { return db.results.filter(r => r.uid === uid).sort((a, b) => b.ts - a.ts); },

  async board({ grade, classNo }) {
    return Object.values(db.users).filter(u => u.role === 'student' && u.grade == grade && (!classNo || u.classNo == classNo))
      .map(u => ({ uid: u.uid, name: u.name, grade: u.grade, classNo: u.classNo, number: u.number, xp: u.stats.xp, weekXp: u.stats.weekKey === weekKey() ? u.stats.weekXp : 0, streak: u.stats.streak, lastDay: u.stats.lastDay, learned: u.stats.learned, mastered: u.stats.mastered, badges: Object.keys(u.stats.badges || {}).length }));
  },

  // ----- 교사용 -----
  async listStudents({ grade, classNo }) {
    return Object.values(db.users).filter(u => u.role === 'student' && (!grade || u.grade == grade) && (!classNo || u.classNo == classNo));
  },
  async listProgress(uids, bookId) { const o = {}; for (const u of uids) o[u] = (db.progress[u] || {})[bookId] || {}; return o; },
  async listResults({ grade, classNo }) { return db.results.filter(r => (!grade || r.grade == grade) && (!classNo || r.classNo == classNo)); },
  async listBooks() { return Object.values(db.books); },
  async saveBook(b) { db.books[b.id] = b; persist(); },
  async deleteBook(id) { delete db.books[id]; persist(); },
  async deleteStudent(uid) { delete db.users[uid]; delete db.progress[uid]; db.results = db.results.filter(r => r.uid !== uid); persist(); },
};
export { dayKey };
