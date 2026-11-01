// 학생 화면: 홈, 학습, 단원, 랭킹, 내 기록
import { S, stats, progressOf, dueWords, wrongWords, favWords, toggleFav, flush, scheduleSave } from '../lib/state.js';
import { allBooks, getBook, booksForGrade } from '../data/books.js';
import { levelOf, todayOf, liveStreak, BADGES, isMastered, isSeen, isDue, BOX_LABEL } from '../lib/game.js';
import { esc, speak, dayKey, dayNum, dayNumToKey, pct, prefs, savePrefs, modal, toast, sample, shuffle, fmtDate, ls } from '../lib/util.js';
import { startSession, startCards, startMatch, wordCardHTML, QTYPES } from './session.js';
import { logout, refreshTop } from '../main.js';
import { APP } from '../config.js';

const curBookId = () => { const saved = ls.get('vocab.book', null); const list = booksForGrade(S.user.grade); return (saved && list.find(b => b.id === saved)) ? saved : list[0].id; };
const say = root => root.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) { e.stopPropagation(); speak(s.dataset.say); } });
const spk = t => `<button class="icon-btn speak sm" data-say="${esc(t)}" aria-label="발음 듣기"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg></button>`;

function lessonStats(book, map, n) {
  const ws = book.words.filter(w => n == null || w.lesson === n);
  let seen = 0, mast = 0, due = 0;
  for (const w of ws) { const s = map[w.id]; if (isSeen(s)) seen++; if (isMastered(s)) mast++; if (isDue(s)) due++; }
  return { total: ws.length, seen, mast, due, words: ws, stars: mast / ws.length >= .9 ? 3 : mast / ws.length >= .6 ? 2 : mast / ws.length >= .3 ? 1 : 0 };
}
const stars = n => `<span class="stars" aria-label="별 ${n}개">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}">★</i>`).join('')}</span>`;

// ================= 홈 =================
export async function home(main, _, go) {
  const st = stats(), u = S.user;
  const lv = levelOf(st.xp), today = todayOf(st), streak = liveStreak(st);
  const bookId = curBookId(), book = getBook(bookId), map = await progressOf(bookId);
  const due = await dueWords();
  const nextLesson = book.lessons.find(l => lessonStats(book, map, l.n).seen < l.count) || book.lessons[0];
  const week = Array.from({ length: 7 }, (_, i) => { const d = dayNum() - ((new Date().getDay() + 6) % 7) + i; return { k: dayNumToKey(d), d, on: (st.days[dayNumToKey(d)]?.xp || 0) > 0, today: d === dayNum() }; });
  const last7 = Object.entries(st.days).filter(([k]) => k >= dayNumToKey(dayNum() - 6));
  const acc = pct(last7.reduce((s, [, d]) => s + d.c, 0), last7.reduce((s, [, d]) => s + d.n, 0));
  const wotd = book.words[(dayNum() * 7919) % book.words.length];
  const recent = Object.entries(st.badges).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => BADGES.find(b => b.id === id)).filter(Boolean);
  const goalP = Math.min(100, pct(today.xp, st.goal));
  const hour = new Date().getHours();
  const hi = hour < 12 ? '좋은 아침이에요' : hour < 18 ? '반가워요' : '오늘도 수고했어요';

  main.innerHTML = `
  <section class="hello">
    <div><p class="muted">${u.grade}학년 ${u.classNo}반 · Lv.${lv.lv} ${esc(lv.title)}</p><h1>${hi}, ${esc(u.name)}님</h1></div>
  </section>
  <section class="hero-row">
    <div class="panel streak-panel ${streak ? 'lit' : ''}">
      <div class="flame" aria-hidden="true">🔥</div>
      <div><b class="num">${streak}</b><span>일 연속 학습</span><p class="muted small">${today.xp > 0 ? '오늘도 성공! 내일도 이어가요' : streak ? '오늘 학습하면 연속 기록이 이어져요' : '오늘부터 새 기록을 시작해요'}</p></div>
      <div class="week">${week.map((d, i) => `<span class="${d.on ? 'on' : ''} ${d.today ? 'today' : ''}" title="${d.k}">${'월화수목금토일'[i]}</span>`).join('')}</div>
      ${st.freezes ? `<p class="muted small freeze">🧊 연속 학습 보호권 ${st.freezes}개 · 하루 빠져도 기록이 지켜져요</p>` : ''}
    </div>
    <div class="panel goal-panel">
      <div class="ring" style="--p:${goalP}"><div><b>${today.xp}</b><small>/ ${st.goal} XP</small></div></div>
      <div><b>오늘의 목표</b><p class="muted small">${goalP >= 100 ? '목표 달성! 🎯' : `${st.goal - today.xp} XP 남았어요`}</p><p class="muted small">오늘 ${today.n}문제 · 새 단어 ${today.w}개</p></div>
    </div>
  </section>
  <section class="cta-col">
    ${due.length ? `<button class="cta review" id="goReview"><span class="cta-ic">🔁</span><span><b>오늘의 복습 ${due.length}단어</b><small>잊어버리기 전에 다시 보면 오래 기억해요</small></span><span class="arr">›</span></button>` : ''}
    <button class="cta" id="goNext"><span class="cta-ic">🌱</span><span><b>${esc(book.short || book.title)} · ${esc(nextLesson.title)} 이어서 학습</b><small>새 단어 익히고 바로 퀴즈로 확인해요</small></span><span class="arr">›</span></button>
  </section>
  <section class="panel lvl">
    <div class="lvl-row"><b>Lv.${lv.lv} ${esc(lv.title)}</b><span class="muted small">다음 레벨까지 ${lv.need - lv.into} XP</span></div>
    <div class="bar"><i style="width:${pct(lv.into, lv.need)}%"></i></div>
  </section>
  <section class="tiles">
    <div class="tile"><b>${st.learned || 0}</b><span>학습한 단어</span></div>
    <div class="tile"><b>${st.mastered || 0}</b><span>암기 완료</span></div>
    <div class="tile"><b>${acc}%</b><span>7일 정답률</span></div>
    <div class="tile"><b>${(st.weekXp || 0).toLocaleString()}</b><span>이번 주 XP</span></div>
  </section>
  <section class="panel wotd">
    <p class="eyebrow">오늘의 단어 · ${esc(book.short || '')} L${wotd.lesson}</p>
    ${wordCardHTML(wotd)}
  </section>
  ${recent.length ? `<section class="panel"><div class="sec-h"><b>최근 받은 배지</b><button class="link" id="allB">모두 보기</button></div><div class="badge-row">${recent.map(b => `<div class="bdg on"><span>${b.icon}</span><small>${b.name}</small></div>`).join('')}</div></section>` : ''}
  `;
  say(main);
  main.querySelector('#goReview')?.addEventListener('click', () => startSession({ title: '오늘의 복습', words: sample(due, 20), pool: due.length >= 8 ? due : book.words, mode: 'smart', review: true, back: ['home'] }));
  main.querySelector('#goNext').onclick = () => go('lesson', { bookId, n: nextLesson.n });
  main.querySelector('#allB')?.addEventListener('click', () => go('me'));
}

// ================= 학습(단어장/단원 목록) =================
export async function learn(main, _, go) {
  const books = allBooks();
  const bookId = curBookId(), book = getBook(bookId), map = await progressOf(bookId);
  const all = lessonStats(book, map);
  const due = await dueWords(), wrong = await wrongWords(), favs = await favWords();
  main.innerHTML = `
    <div class="sec-h"><h1>학습</h1></div>
    <div class="chips" role="tablist">${books.map(b => `<button class="chip-btn ${b.id === bookId ? 'on' : ''}" data-book="${b.id}">${esc(b.short || b.title)}</button>`).join('')}</div>
    <section class="panel book-sum">
      <div><p class="eyebrow">${esc(book.publisher || '')} · ${book.grade}학년</p><h2>${esc(book.title)}</h2><p class="muted">${book.words.length}단어 · ${book.lessons.length}단원</p></div>
      <div class="ring" style="--p:${pct(all.mast, all.total)}"><div><b>${pct(all.mast, all.total)}%</b><small>암기</small></div></div>
    </section>
    <section class="decks">
      <button class="deck" data-deck="due"><b>🔁 오늘의 복습</b><span>${due.length}단어</span></button>
      <button class="deck" data-deck="wrong"><b>❗ 오답 노트</b><span>${wrong.length}단어</span></button>
      <button class="deck" data-deck="fav"><b>⭐ 즐겨찾기</b><span>${favs.length}단어</span></button>
      <button class="deck" data-deck="rand"><b>🎲 랜덤 20</b><span>전체 단원</span></button>
    </section>
    <h3 class="h3">단원</h3>
    <section class="lessons">${book.lessons.map(l => { const s = lessonStats(book, map, l.n); return `
      <button class="lesson" data-n="${l.n}">
        <div class="ln">L${l.n}</div>
        <div class="lmeta"><b>${esc(l.title)}</b><span class="muted small">${s.seen}/${s.total} 학습 · ${s.mast} 암기${s.due ? ` · <em>복습 ${s.due}</em>` : ''}</span>
        <div class="bar thin"><i class="seen" style="width:${pct(s.seen, s.total)}%"></i><i style="width:${pct(s.mast, s.total)}%"></i></div></div>
        ${stars(s.stars)}
      </button>`; }).join('')}</section>`;
  main.querySelectorAll('[data-book]').forEach(b => b.onclick = () => { ls.set('vocab.book', b.dataset.book); go('learn'); });
  main.querySelectorAll('[data-n]').forEach(b => b.onclick = () => go('lesson', { bookId, n: +b.dataset.n }));
  main.querySelectorAll('[data-deck]').forEach(b => b.onclick = () => {
    const k = b.dataset.deck;
    const words = k === 'due' ? due : k === 'wrong' ? wrong : k === 'fav' ? favs : sample(book.words, 20);
    if (!words.length) return toast(k === 'due' ? '오늘 복습할 단어가 없어요. 새 단어를 학습해 보세요!' : k === 'wrong' ? '틀린 단어가 없어요. 멋져요!' : '단어 목록에서 ☆를 눌러 즐겨찾기를 추가하세요.');
    const title = { due: '오늘의 복습', wrong: '오답 노트', fav: '즐겨찾기', rand: '랜덤 20' }[k];
    deckSheet(title, words.slice(0, 200), book.words, ['learn'], go, k === 'due');
  });
}

// 모드 선택 시트 (덱)
function deckSheet(title, words, pool, back, go, review) {
  const m = modal(`<h2>${esc(title)}</h2><p class="muted">${words.length}단어</p><div class="modes compact">${modeButtons(words)}</div>`);
  bindModes(m.el, { title, words, pool, back, review, close: m.close });
}
function modeButtons(words) {
  const many = words.length >= 4;
  return `
    <button class="mode rec" data-m="smart"><b>✨ 스마트 학습</b><small>새 단어 → 퀴즈 → 철자까지 단계별로</small></button>
    <button class="mode" data-m="cards"><b>🃏 단어 카드</b><small>뒤집고 넘기며 빠르게 훑기</small></button>
    ${many ? Object.entries(QTYPES).map(([k, q]) => `<button class="mode" data-m="q:${k}"><b>${q.icon} ${q.name}</b><small>${q.desc}</small></button>`).join('') : ''}
    ${words.length >= 3 ? '<button class="mode" data-m="match"><b>⏱️ 짝 맞추기</b><small>단어와 뜻을 빨리 연결하는 게임</small></button>' : ''}`;
}
function bindModes(box, { title, words, pool, back, review, close, lesson }) {
  box.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
    close && close();
    const m = b.dataset.m;
    const set = words.length > 15 && m !== 'cards' ? pickForStudy(words) : words;
    if (m === 'smart') startSession({ title, words: set, pool, mode: 'smart', back, review });
    else if (m === 'cards') startCards({ title, words, back });
    else if (m === 'match') startMatch({ title, words, back });
    else if (m === 'test') startSession({ title: `${title} 테스트`, words: sample(words, Math.min(20, words.length)), pool, mode: 'test', back, lesson });
    else startSession({ title: `${title} · ${QTYPES[m.slice(2)].name}`, words: set, pool, mode: 'type', qtype: m.slice(2), back });
  });
}
// 한 번에 12단어: 복습할 단어 → 익히는 중 → 새 단어 순
function pickForStudy(words) {
  const st = w => (S.progress[w.bookId] || {})[w.id];
  const due = shuffle(words.filter(w => isDue(st(w))));
  const learning = shuffle(words.filter(w => isSeen(st(w)) && !isDue(st(w)) && !isMastered(st(w))));
  const fresh = words.filter(w => !isSeen(st(w)));
  const mastered = shuffle(words.filter(w => isMastered(st(w)) && !isDue(st(w))));
  const out = [...due.slice(0, 6), ...learning.slice(0, 4)];
  for (const w of fresh) { if (out.length >= 12) break; if (out.filter(x => !isSeen(st(x))).length < 7) out.push(w); }
  for (const w of [...learning, ...mastered]) { if (out.length >= 12) break; if (!out.includes(w)) out.push(w); }
  return out;
}

// ================= 단원 상세 =================
export async function lesson(main, { bookId, n } = {}, go) {
  if (!getBook(bookId)) return go('learn');
  const book = getBook(bookId), map = await progressOf(bookId);
  const l = book.lessons.find(x => x.n === n) || book.lessons[0];
  const s = lessonStats(book, map, l.n);
  const myTests = (await S.store.myResults(S.user.uid)).filter(r => r.bookId === bookId && r.lesson == l.n);
  const best = myTests.length ? Math.max(...myTests.map(r => r.pct)) : null;
  let filter = 'all';
  // 뜻 가리기: 기본은 가림, 빈칸을 누르면 그 단어만 보임. 선택은 기기에 기억
  let hideKo = true; try { hideKo = localStorage.getItem('dn_hideKo') !== '0'; } catch { }
  const shown = new Set();
  main.innerHTML = `
    <button class="back" id="back">‹ 단원 목록</button>
    <section class="lesson-head">
      <div><p class="eyebrow">${esc(book.short || book.title)}</p><h1>Lesson ${l.n}</h1><p class="muted">${s.total}단어 · 학습 ${s.seen} · 암기 ${s.mast}${best != null ? ` · 최고 점수 ${best}점` : ''}</p></div>
      ${stars(s.stars)}
    </section>
    <div class="boxes" aria-label="암기 단계">${[0, 1, 2, 3, 4, 5].map(b => { const c = s.words.filter(w => (map[w.id]?.b || 0) === b && (b > 0 || !isSeen(map[w.id]))).length; return `<div class="bx b${b}" style="flex:${Math.max(c, .001)}" title="${BOX_LABEL[b]} ${c}">${c ? c : ''}</div>`; }).join('')}</div>
    <div class="box-legend"><span><i class="b0"></i>새 단어</span><span><i class="b2"></i>익히는 중</span><span><i class="b4"></i>암기 완료</span></div>
    <section class="modes">${modeButtons(s.words)}
      <button class="mode test" data-m="test"><b>📝 단원 테스트</b><small>20문제 · 결과가 선생님께 전달돼요</small></button>
    </section>
    <div class="sec-h"><h3 class="h3">단어 목록</h3>
      <button class="chip-btn ko-toggle" id="koT"></button>
      <div class="chips sm">${[['all', '전체'], ['new', '안 본 단어'], ['weak', '약한 단어'], ['mast', '암기 완료'], ['fav', '⭐']].map(([k, t]) => `<button class="chip-btn ${k === 'all' ? 'on' : ''}" data-f="${k}">${t}</button>`).join('')}</div></div>
    <ul class="wlist" id="wl"></ul>`;
  say(main);
  main.querySelector('#back').onclick = () => go('learn');
  bindModes(main.querySelector('.modes'), { title: `Lesson ${l.n}`, words: s.words, pool: book.words, back: ['lesson', { bookId, n: l.n }], lesson: l.n });
  const draw = () => {
    const ws = s.words.filter(w => { const st = map[w.id]; return filter === 'all' || (filter === 'new' && !isSeen(st)) || (filter === 'weak' && isSeen(st) && (st.b <= 2)) || (filter === 'mast' && isMastered(st)) || (filter === 'fav' && st?.f); });
    main.querySelector('#wl').innerHTML = ws.map(w => { const st = map[w.id]; return `
      <li class="wrow" data-id="${w.id}">
        <span class="dots" title="${BOX_LABEL[st?.b || 0]}">${[1, 2, 3, 4, 5].map(i => `<i class="${(st?.b || 0) >= i ? 'on' : ''}"></i>`).join('')}</span>
        <b class="hw">${esc(w.word)}</b><span class="pos">${esc(w.pos)}</span><span class="ko">${hideKo && !shown.has(w.id) ? `<button class="ko-blank" data-reveal="${w.id}" aria-label="뜻 보기"></button>` : esc(w.ko)}</span>
        ${spk(w.word)}<button class="icon-btn fav ${st?.f ? 'on' : ''}" data-fav="${w.id}" aria-label="즐겨찾기">${st?.f ? '★' : '☆'}</button>
      </li>`; }).join('') || '<li class="empty">해당하는 단어가 없어요.</li>';
    const t = main.querySelector('#koT'); t.textContent = hideKo ? '👀 뜻 모두 보기' : '🙈 뜻 가리기'; t.classList.toggle('on', !hideKo);
  };
  draw();
  main.querySelector('#koT').onclick = () => { hideKo = !hideKo; shown.clear(); try { localStorage.setItem('dn_hideKo', hideKo ? '1' : '0'); } catch { } draw(); };
  main.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { filter = b.dataset.f; main.querySelectorAll('[data-f]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  main.querySelector('#wl').addEventListener('click', e => {
    const r = e.target.closest('[data-reveal]');
    if (r) { shown.add(r.dataset.reveal); r.parentElement.textContent = s.words.find(x => x.id === r.dataset.reveal).ko; return; }
    const f = e.target.closest('[data-fav]');
    if (f) { const w = s.words.find(x => x.id === f.dataset.fav); const on = toggleFav(w); f.textContent = on ? '★' : '☆'; f.classList.toggle('on', on); return; }
    const row = e.target.closest('.wrow'); if (!row || e.target.closest('[data-say]')) return;
    wordModal(s.words.find(x => x.id === row.dataset.id));
  });
}

export function wordModal(w) {
  const st = (S.progress[w.bookId] || {})[w.id];
  const m = modal(`${wordCardHTML(w)}
    <p class="muted small">${st?.s ? `${BOX_LABEL[st.b]} · ${st.s}번 풀이 · 정답 ${st.c} / 오답 ${st.w}` : '아직 학습하지 않은 단어예요.'}</p>
    ${APP.enableGemini && S.store.ai ? `<div class="ai"><button class="btn" id="aiEx">✨ AI 예문 더 보기</button><button class="btn" id="aiMem">🧠 AI 암기 요령</button><div id="aiOut" class="ai-out"></div></div>` : ''}`);
  m.el.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) speak(s.dataset.say); });
  const ask = async (p) => { const o = m.el.querySelector('#aiOut'); o.textContent = '생각하는 중…'; try { o.textContent = await S.store.ai(p); } catch (e) { o.textContent = 'AI 응답을 받지 못했어요: ' + e.message; } };
  m.el.querySelector('#aiEx')?.addEventListener('click', () => ask(`중학교 2학년 학생을 위해 영어 단어 "${w.word}" (${w.ko})를 사용한 쉬운 영어 예문 3개를 만들고, 각 예문 아래에 한국어 해석을 달아 주세요. 번호 목록으로만 답하세요.`));
  m.el.querySelector('#aiMem')?.addEventListener('click', () => ask(`중학생이 영어 단어 "${w.word}" (뜻: ${w.ko})를 쉽게 외울 수 있는 재미있는 연상법이나 어원 설명을 한국어로 3문장 이내로 알려 주세요.`));
}

// ================= 랭킹 =================
export async function rank(main) {
  const u = S.user;
  let scope = 'class', metric = 'weekXp';
  const metrics = { weekXp: ['이번 주 XP', 'XP'], xp: ['누적 XP', 'XP'], streak: ['연속 학습', '일'], learned: ['학습 단어', '개'] };
  main.innerHTML = `<div class="sec-h"><h1>랭킹</h1></div>
    <div class="chips"><button class="chip-btn on" data-s="class">우리 반</button><button class="chip-btn" data-s="grade">${u.grade}학년 전체</button></div>
    <div class="chips sm">${Object.entries(metrics).map(([k, [t]]) => `<button class="chip-btn ${k === metric ? 'on' : ''}" data-mt="${k}">${t}</button>`).join('')}</div>
    <div id="rk"><div class="empty">불러오는 중…</div></div>
    <p class="muted small center">랭킹은 매주 월요일에 새로 시작해요. 이름 옆 숫자는 반-번호예요.</p>`;
  let cache = {};
  const draw = async () => {
    const key = scope;
    cache[key] = cache[key] || await S.store.board({ grade: u.grade, classNo: scope === 'class' ? u.classNo : null });
    const list = [...cache[key]].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
    // 오늘 반영 안 된 내 기록 보정
    const mine = list.find(x => x.uid === u.uid); if (mine) { const st = stats(); Object.assign(mine, { xp: st.xp, weekXp: st.weekXp, streak: liveStreak(st), learned: st.learned }); list.sort((a, b) => (b[metric] || 0) - (a[metric] || 0)); }
    const myRank = list.findIndex(x => x.uid === u.uid) + 1;
    const unit = metrics[metric][1];
    const top = list.slice(0, 3);
    main.querySelector('#rk').innerHTML = `
      ${myRank ? `<div class="panel me-rank"><b>${myRank}위</b><span>/ ${list.length}명</span><span class="muted">${myRank === 1 ? '1등이에요! 👑' : `${list[myRank - 2]?.name}님까지 ${(list[myRank - 2]?.[metric] || 0) - (list[myRank - 1]?.[metric] || 0)}${unit}`}</span></div>` : ''}
      <div class="podium">${[1, 0, 2].map(i => top[i] ? `<div class="pd p${i + 1} ${top[i].uid === u.uid ? 'me' : ''}"><span class="medal">${['🥇', '🥈', '🥉'][i]}</span><b>${esc(top[i].name)}</b><small>${(top[i][metric] || 0).toLocaleString()}${unit}</small><div class="pillar"></div></div>` : '<div></div>').join('')}</div>
      <ol class="rlist">${list.slice(3, 50).map((x, i) => `<li class="${x.uid === u.uid ? 'me' : ''}"><span class="rn">${i + 4}</span><b>${esc(x.name)}</b><small class="muted">${scope === 'grade' ? `${x.classNo}반` : `${x.number}번`}</small><span class="rv">${(x[metric] || 0).toLocaleString()}${unit}</span></li>`).join('')}</ol>`;
  };
  main.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { scope = b.dataset.s; main.querySelectorAll('[data-s]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  main.querySelectorAll('[data-mt]').forEach(b => b.onclick = () => { metric = b.dataset.mt; main.querySelectorAll('[data-mt]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  await draw();
}

// ================= 내 기록 =================
export async function me(main, _, go) {
  const u = S.user, st = stats(), lv = levelOf(st.xp);
  const results = await S.store.myResults(u.uid);
  const totalDays = Object.values(st.days).filter(d => d.xp > 0).length;
  const totalAns = Object.values(st.days).reduce((s, d) => s + d.n, 0), totalC = Object.values(st.days).reduce((s, d) => s + d.c, 0);
  main.innerHTML = `
    <section class="panel profile">
      <div class="avatar">${esc((u.name || '?').slice(-2))}</div>
      <div><h1>${esc(u.name)}</h1><p class="muted">${u.grade}학년 ${u.classNo}반 ${u.number}번</p><p><b>Lv.${lv.lv} ${esc(lv.title)}</b> · ${st.xp.toLocaleString()} XP</p></div>
    </section>
    <section class="tiles">
      <div class="tile"><b>${st.bestStreak || 0}일</b><span>최고 연속</span></div>
      <div class="tile"><b>${totalDays}일</b><span>총 학습일</span></div>
      <div class="tile"><b>${totalAns.toLocaleString()}</b><span>푼 문제</span></div>
      <div class="tile"><b>${pct(totalC, totalAns)}%</b><span>전체 정답률</span></div>
    </section>
    <section class="panel"><div class="sec-h"><b>학습 달력</b><span class="muted small">최근 16주</span></div>${heatmap(st.days, 16)}</section>
    <section class="panel"><div class="sec-h"><b>배지</b><span class="muted small">${Object.keys(st.badges).length} / ${BADGES.length}</span></div>
      <div class="badge-grid">${BADGES.map(b => `<div class="bdg ${st.badges[b.id] ? 'on' : ''}" title="${esc(b.desc)}"><span>${b.icon}</span><small>${b.name}</small><em>${esc(b.desc)}</em></div>`).join('')}</div></section>
    <section class="panel"><div class="sec-h"><b>테스트 기록</b></div>
      ${results.length ? `<ul class="tlist">${results.slice(0, 20).map(r => `<li><span>${esc(getBook(r.bookId)?.short || '')} ${r.lesson === 'mix' ? '종합' : `L${r.lesson}`}</span><b class="${r.pct >= 90 ? 'good' : r.pct < 60 ? 'bad' : ''}">${r.pct}점</b><small class="muted">${r.score}/${r.total} · ${fmtDate(r.ts)}</small></li>`).join('')}</ul>` : '<p class="muted">아직 응시한 테스트가 없어요. 단원 화면에서 테스트를 볼 수 있어요.</p>'}</section>
    <section class="panel settings"><div class="sec-h"><b>설정</b></div>
      <label class="set"><span>하루 목표</span><select id="goal">${[30, 50, 100, 150, 200].map(g => `<option value="${g}" ${g == st.goal ? 'selected' : ''}>${g} XP${g === 30 ? ' (가볍게)' : g === 50 ? ' (보통)' : g === 100 ? ' (열심히)' : g >= 150 ? ' (최고)' : ''}</option>`).join('')}</select></label>
      <label class="set"><span>효과음</span><input type="checkbox" id="snd" ${prefs.sound ? 'checked' : ''}></label>
      <label class="set"><span>자동 발음</span><input type="checkbox" id="asp" ${prefs.autoSpeak ? 'checked' : ''}></label>
      <label class="set"><span>발음 종류</span><select id="acc"><option value="en-US" ${prefs.accent === 'en-US' ? 'selected' : ''}>미국식</option><option value="en-GB" ${prefs.accent === 'en-GB' ? 'selected' : ''}>영국식</option></select></label>
      <label class="set"><span>발음 속도</span><select id="rate">${[[0.7, '느리게'], [0.9, '보통'], [1.1, '빠르게']].map(([v, t]) => `<option value="${v}" ${prefs.rate == v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <button class="btn" id="test-say">🔊 발음 들어 보기</button>
      <button class="btn danger ghost" id="logout">로그아웃</button>
    </section>`;
  main.querySelector('#goal').onchange = e => { st.goal = +e.target.value; S.userDirty = true; scheduleSave(200); toast('하루 목표를 바꿨어요.'); };
  main.querySelector('#snd').onchange = e => { prefs.sound = e.target.checked; savePrefs(); };
  main.querySelector('#asp').onchange = e => { prefs.autoSpeak = e.target.checked; savePrefs(); };
  main.querySelector('#acc').onchange = e => { prefs.accent = e.target.value; savePrefs(); };
  main.querySelector('#rate').onchange = e => { prefs.rate = +e.target.value; savePrefs(); };
  main.querySelector('#test-say').onclick = () => speak('Practice makes perfect.');
  main.querySelector('#logout').onclick = logout;
}

export function heatmap(days, weeks = 16) {
  const today = dayNum(), dow = (new Date().getDay() + 6) % 7;
  const start = today - dow - (weeks - 1) * 7;
  const max = Math.max(50, ...Object.values(days).map(d => d.xp || 0));
  let cells = '';
  for (let w = 0; w < weeks; w++) for (let d = 0; d < 7; d++) {
    const n = start + w * 7 + d; const k = dayNumToKey(n); const v = days[k]?.xp || 0;
    const lvl = n > today ? 'f' : v === 0 ? 0 : v < max * .25 ? 1 : v < max * .5 ? 2 : v < max * .75 ? 3 : 4;
    cells += `<i class="hx${lvl}" style="grid-column:${w + 1};grid-row:${d + 1}" title="${k} · ${v} XP"></i>`;
  }
  return `<div class="heat-wrap"><div class="heat-days"><span>월</span><span></span><span>수</span><span></span><span>금</span><span></span><span>일</span></div><div class="heat" style="grid-template-columns:repeat(${weeks},minmax(10px,18px))">${cells}</div></div>
  <div class="heat-legend"><span class="muted small">적게</span><i class="hx0"></i><i class="hx1"></i><i class="hx2"></i><i class="hx3"></i><i class="hx4"></i><span class="muted small">많이</span></div>`;
}
