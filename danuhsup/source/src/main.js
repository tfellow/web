import { isFirebaseConfigured, APP } from './config.js';
import { S, flush, stats } from './lib/state.js';
import { setCustomBooks } from './data/books.js';
import { $, el, esc, toast } from './lib/util.js';
import { liveStreak, freshStats } from './lib/game.js';
import { mascot } from './lib/mascot.js';
import { renderLogin, renderProfileSetup } from './views/login.js';
import * as student from './views/student.js';
import * as teacher from './views/teacher.js';

const root = document.getElementById('app');
let current = null;

// ---------- 라우터 ----------
const ROUTES = {
  home: student.home, learn: student.learn, lesson: student.lesson, rank: student.rank, me: student.me,
  t_dash: teacher.dash, t_students: teacher.students, t_words: teacher.words, t_tests: teacher.tests, t_books: teacher.books,
};
const TABS = {
  student: [['home', '홈', 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z'], ['learn', '학습', 'M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h6z'], ['rank', '랭킹', 'M8 21V11H3v10zM15 21V4H9v17zM21 21v-7h-5v7z'], ['me', '내 기록', 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9a8 8 0 0 1 16 0z']],
  teacher: [['t_dash', '대시보드', 'M3 13h8V3H3zm0 8h8v-6H3zm10 0h8V11h-8zm0-18v6h8V3z'], ['t_students', '학생별', 'M16 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4zM8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-3 0-7 1.5-7 4.5V20h7m8-7c-3.3 0-8 1.7-8 5v2h16v-2c0-3.3-4.7-5-8-5z'], ['t_words', '단어 분석', 'M4 6h16M4 12h10M4 18h7'], ['t_tests', '테스트', 'M9 11l3 3 8-8M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9'], ['t_books', '단어장', 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5']],
};

export function go(name, params = {}) {
  if (current?.cleanup) try { current.cleanup(); } catch { }
  const u = S.user; if (!u) return;
  const fn = ROUTES[name] || (u.role === 'teacher' ? teacher.dash : student.home);
  shell(u.role === 'teacher' ? 'teacher' : 'student', name);
  const main = $('#main');
  main.innerHTML = '';
  main.scrollTop = 0; window.scrollTo(0, 0);
  current = { name, params };
  const r = fn(main, params, go);
  if (r && r.then) r.then(x => { if (x && typeof x === 'function') current.cleanup = x; }).catch(e => { console.error(e); main.innerHTML = `<div class="empty">문제가 생겼어요: ${esc(e.message)}</div>`; });
  else if (typeof r === 'function') current.cleanup = r;
  try { history.replaceState(null, '', '#' + name.replace('_', '-')); } catch { }
}
// 전체화면 학습(탭바 숨김)
export function fullscreen(render) {
  if (current?.cleanup) try { current.cleanup(); } catch { }
  root.innerHTML = '<main id="stage" class="stage"></main>';
  current = { name: 'stage' };
  const r = render($('#stage'));
  if (typeof r === 'function') current.cleanup = r;
}

function shell(kind, active) {
  if (!$('#main') || root.dataset.kind !== kind) {
    root.dataset.kind = kind;
    const tabs = TABS[kind].map(([id, label, d]) => `<button class="tab" data-go="${id}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg><span>${label}</span></button>`).join('');
    root.innerHTML = `
      <header class="topbar">
        <div class="brand"><span class="logo" aria-hidden="true">${logo}</span><b>${esc(APP.appName)}</b>${kind === 'teacher' ? '<span class="pill">교사</span>' : ''}${S.store.mode === 'demo' ? '<span class="pill demo" title="이 기기에만 저장되는 체험 모드">체험</span>' : ''}</div>
        <div class="top-stats" id="topStats"></div>
      </header>
      <nav class="tabs" aria-label="메뉴">${tabs}</nav>
      <main id="main" class="main"></main>`;
    root.querySelector('.tabs').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  }
  root.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.go === active || (active === 'lesson' && b.dataset.go === 'learn')));
  refreshTop();
}
export function refreshTop() {
  const box = $('#topStats'); if (!box || !S.user) return;
  if (S.user.role === 'teacher') { box.innerHTML = `<span class="who">${esc(S.user.name || S.user.email || '')}</span>`; return; }
  const st = stats();
  box.innerHTML = `<span class="chip streak ${liveStreak(st) ? 'lit' : ''}" title="연속 학습일">🔥 <b>${liveStreak(st)}</b></span><span class="chip xp" title="경험치">⭐ <b>${(st.xp || 0).toLocaleString()}</b></span>`;
}

export const logo = mascot('happy', 38);

// ---------- 시작 ----------
async function boot() {
  root.innerHTML = `<div class="boot">${mascot('happy', 110, 'bob')}<p>숲길을 여는 중…</p></div>`;
  let store;
  if (isFirebaseConfigured()) {
    try { store = (await import('./store/firebase.js')).firebaseStore; await store.init(); }
    catch (e) { console.error(e); toast('서버 연결에 실패해 체험 모드로 시작합니다.', 'bad'); store = null; }
  }
  if (!store) { store = (await import('./store/local.js')).localStore; await store.init(); }
  S.store = store;
  // 교사가 올린 단어장은 로그인한 사람만 읽을 수 있으므로, 로그인할 때마다 불러옴
  // (예전에는 앱을 열 때 한 번만 불러와서, 로그아웃 후 다시 로그인하면 올린 단어장이 안 보였음)
  const loadBooks = async () => {
    try { setCustomBooks(await store.listBooks()); }
    catch (e) { console.warn('books', e); toast('선생님이 올린 단어장을 불러오지 못했어요. 새로고침해 주세요.', 'bad'); }
  };
  store.onAuth(async user => {
    S.user = user; S.progress = {};
    if (!user) { root.dataset.kind = ''; return renderLogin(root, store); }
    await loadBooks();
    if (S.user !== user) return;
    user.stats = user.stats || freshStats();
    if (user.needsProfile || (user.role === 'student' && !user.grade)) return renderProfileSetup(root, store, user, () => start());
    start();
  });
}
function start() {
  const want = (location.hash || '').slice(1).replace('-', '_');
  const isT = S.user.role === 'teacher';
  // 단원 화면처럼 정보가 더 필요한 화면은 주소만으로 다시 열 수 없으므로 학습 목록으로 보냄
  const ok = ROUTES[want] && want.startsWith('t_') === isT;
  go(want === 'lesson' ? 'learn' : ok ? want : (isT ? 't_dash' : 'home'));
}
export async function logout() { await flush(); await S.store.signOut(); }

boot();

// 오프라인 지원: 한 번 열어 두면 인터넷이 끊겨도 앱이 열리고 학습할 수 있어요 (https 에서만)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(e => console.warn('sw', e)));
}
