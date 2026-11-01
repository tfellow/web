// 학습/퀴즈/테스트 진행 화면
import { fullscreen, go, refreshTop } from '../main.js';
import { S, record, bonus, newBadges, flush, progressOf, stats } from '../lib/state.js';
import { makeQ, typeForBox, clozeOf, checkSpell, QTYPES } from '../lib/quiz.js';
import { esc, speak, sfx, vibrate, shuffle, confetti, prefs, toast, pct, el } from '../lib/util.js';
import { XP, BADGES } from '../lib/game.js';

const posTag = w => w.pos ? `<span class="pos">${esc(w.pos)}</span>` : '';
const spk = (t, cls = '') => `<button class="icon-btn speak ${cls}" data-say="${esc(t)}" aria-label="발음 듣기"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg></button>`;

export function wordCardHTML(w) {
  const cz = clozeOf(w);
  const ex = cz ? `${esc(cz.before)}<mark>${esc(cz.hit)}</mark>${esc(cz.after)}` : esc(w.ex);
  return `<div class="wc">
    <div class="wc-head"><b class="hw">${esc(w.word)}</b>${posTag(w)}${spk(w.word)}</div>
    <div class="wc-ko">${esc(w.ko)}</div>
    ${w.en ? `<div class="wc-en"><span class="lbl">영영풀이</span>${esc(w.en)}</div>` : ''}
    ${w.ex ? `<div class="wc-ex"><span class="lbl">예문</span><p>${ex} ${spk(w.ex, 'sm')}</p><p class="muted">${esc(w.exKo)}</p></div>` : ''}
  </div>`;
}

/**
 * opts: { title, words, pool, mode: 'smart'|'type'|'test', qtype, back: [route, params] }
 */
export function startSession(opts) {
  fullscreen(stage => run(stage, opts));
}

function buildQueue({ words, pool, mode, qtype }) {
  const map = S.progress[words[0]?.bookId] || {};
  const q = [];
  if (mode === 'test') {
    const types = ['ko', 'en', 'def', 'cloze', 'spell'];
    words.forEach((w, i) => q.push(makeQ(w, types[i % types.length], pool)));
    return shuffle(q);
  }
  for (const w of words) {
    const st = (S.progress[w.bookId] || {})[w.id];
    if (mode === 'smart' && !(st && st.s > 0)) q.push({ intro: true, word: w });
    q.push(makeQ(w, mode === 'smart' ? typeForBox(st?.b || 0, w) : qtype, pool));
  }
  return q;
}

function run(stage, opts) {
  const { words, pool, mode, title } = opts;
  const isTest = mode === 'test';
  const queue = buildQueue(opts);
  const total = queue.filter(x => !x.intro).length;
  let idx = 0, done = 0, correctN = 0, combo = 0, bestCombo = 0, xpGain = 0;
  const startedAt = Date.now();
  const results = new Map(); // wordId -> {w, ok}
  const requeued = new Set();
  const testAnswers = [];

  stage.innerHTML = `
    <div class="sess">
      <div class="sess-top">
        <button class="icon-btn" id="quit" aria-label="그만하기">✕</button>
        <div class="bar"><i id="prog"></i></div>
        <span class="combo" id="combo"></span>
        ${isTest ? '<span class="timer" id="timer">0:00</span>' : `<span class="xpchip" id="xpc">+0</span>`}
      </div>
      <div class="sess-title">${esc(title || '')}</div>
      <div class="q" id="q"></div>
      <div class="fb" id="fb" hidden></div>
    </div>`;
  const qBox = stage.querySelector('#q'), fb = stage.querySelector('#fb');
  stage.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) { e.stopPropagation(); speak(s.dataset.say); } });
  stage.querySelector('#quit').onclick = () => {
    if (done === 0) return exit();
    const m = el(`<div class="confirm"><p>${isTest ? '테스트를 그만두면 결과가 저장되지 않아요.' : '여기까지 한 기록은 저장돼요.'} 그만할까요?</p><div class="row2"><button class="btn" data-k>계속하기</button><button class="btn danger" data-q>그만하기</button></div></div>`);
    stage.appendChild(m);
    m.querySelector('[data-k]').onclick = () => m.remove();
    m.querySelector('[data-q]').onclick = () => { m.remove(); isTest ? exit() : finish(); };
  };
  let tInt;
  if (isTest) tInt = setInterval(() => { const s = Math.floor((Date.now() - startedAt) / 1000); const t = stage.querySelector('#timer'); if (t) t.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; }, 1000);

  function exit() { clearInterval(tInt); flush(); const [r, p] = opts.back || ['learn']; go(r, p); }
  function progress() {
    stage.querySelector('#prog').style.width = `${(done / (total + requeued.size)) * 100}%`;
    stage.querySelector('#combo').innerHTML = combo >= 3 && !isTest ? `🔥 ${combo} 콤보` : '';
    const x = stage.querySelector('#xpc'); if (x) x.textContent = `+${xpGain} XP`;
  }

  function next() {
    fb.hidden = true; fb.className = 'fb';
    if (idx >= queue.length) return finish();
    const item = queue[idx++];
    progress();
    if (item.intro) return showIntro(item.word);
    showQ(item);
  }

  function showIntro(w) {
    qBox.innerHTML = `<div class="intro"><span class="badge-new">새 단어</span>${wordCardHTML(w)}<button class="btn primary big" id="gotit">외웠어요, 문제 풀기</button></div>`;
    if (prefs.autoSpeak) speak(w.word);
    qBox.querySelector('#gotit').onclick = () => { sfx('tap'); next(); };
  }

  function showQ(q) {
    const w = q.word;
    let prompt = '';
    switch (q.type) {
      case 'ko': prompt = `<p class="ask">알맞은 뜻을 고르세요</p><div class="big-word">${esc(w.word)} ${spk(w.word)}</div>`; break;
      case 'en': prompt = `<p class="ask">이 뜻의 영어 단어는?</p><div class="big-ko">${posTag(w)} ${esc(w.ko)}</div>`; break;
      case 'def': prompt = `<p class="ask">영영풀이에 맞는 단어는?</p><div class="def">${posTag(w)} ${esc(w.en)}</div>`; break;
      case 'listen': prompt = `<p class="ask">듣고 알맞은 뜻을 고르세요</p><button class="listen-btn" data-say="${esc(w.word)}" aria-label="다시 듣기"><svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 4V5L7 9zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg><span>다시 듣기</span></button>`; break;
      case 'cloze': { const c = clozeOf(w); prompt = `<p class="ask">빈칸에 들어갈 말은?</p><div class="cloze">${esc(c.before)}<span class="blank">${'_'.repeat(Math.max(4, Math.min(10, c.hit.length)))}</span>${esc(c.after)}</div><p class="muted">${esc(w.exKo)}</p>`; break; }
      case 'spell': prompt = `<p class="ask">영어로 쓰세요</p><div class="big-ko">${posTag(w)} ${esc(w.ko)}</div>${w.en ? `<div class="def sm">${esc(w.en)}</div>` : ''}`; break;
    }
    let answer = '';
    if (q.type === 'spell') {
      answer = `<form class="spell" id="sp" autocomplete="off">
        <input id="spi" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="여기에 입력" aria-label="영어 철자">
        <div class="row2">${isTest ? '' : '<button type="button" class="btn" id="hint">힌트</button>'}<button class="btn primary">확인</button></div>
        ${isTest ? '' : `<p class="hintline" id="hl"></p>`}</form>`;
    } else {
      answer = `<div class="opts ${q.options.some(o => o.text.length > 18) ? 'long' : ''}">${q.options.map((o, i) => `<button class="opt" data-i="${i}"><kbd>${i + 1}</kbd><span>${esc(o.text)}</span></button>`).join('')}</div>`;
    }
    qBox.innerHTML = `<div class="qcard qt-${q.type}">${prompt}</div>${answer}`;
    if (q.type === 'listen' || (q.type === 'ko' && prefs.autoSpeak)) setTimeout(() => speak(w.word), 150);

    let answered = false;
    const submit = (ok, given, closeMsg) => {
      if (answered) return; answered = true;
      grade(q, ok, given, closeMsg);
    };
    if (q.type === 'spell') {
      const inp = qBox.querySelector('#spi'); setTimeout(() => inp.focus(), 50);
      let hints = 0;
      qBox.querySelector('#hint')?.addEventListener('click', () => {
        hints++; const ww = w.word; const shown = ww.slice(0, Math.min(ww.length - 1, hints));
        qBox.querySelector('#hl').textContent = `힌트: ${shown}${ww.slice(shown.length).replace(/[a-zA-Z]/g, '_')}  (${ww.replace(/ /g, '').length}글자)`;
      });
      qBox.querySelector('#sp').addEventListener('submit', e => {
        e.preventDefault(); const v = inp.value.trim(); if (!v) return;
        const r = checkSpell(v, w);
        if (r === 'close' && !isTest && !inp.dataset.closeOnce) { inp.dataset.closeOnce = 1; toast('아까워요! 철자를 한 번 더 확인해 보세요.'); return; }
        submit(r === 'ok' || r === 'close', v);
      });
    } else {
      qBox.querySelectorAll('.opt').forEach(b => b.onclick = () => {
        const o = q.options[+b.dataset.i];
        if (!isTest) {
          b.classList.add(o.correct ? 'right' : 'wrong');
          if (!o.correct) qBox.querySelector(`.opt[data-i="${q.options.findIndex(x => x.correct)}"]`).classList.add('right');
        } else b.classList.add('picked');
        qBox.querySelectorAll('.opt').forEach(x => x.disabled = true);
        submit(o.correct, o.text);
      });
    }
  }
  // 숫자키 1~4 선택 지원 (태블릿 키보드)
  const onKey = e => { if (/^[1-4]$/.test(e.key) && !e.target.closest('input')) qBox.querySelector(`.opt[data-i="${+e.key - 1}"]`)?.click(); if (e.key === 'Enter' && !fb.hidden) fb.querySelector('.fb-next')?.click(); };
  addEventListener('keydown', onKey);

  function grade(q, ok, given) {
    const w = q.word;
    done++;
    const xp = record(w, ok, { kind: q.type });
    if (!results.has(w.id) || !ok) results.set(w.id, { w, ok: results.has(w.id) ? results.get(w.id).ok && ok : ok });
    if (ok) { correctN++; combo++; bestCombo = Math.max(bestCombo, combo); xpGain += xp; } else { combo = 0; xpGain += xp; }
    refreshTop();
    if (isTest) { testAnswers.push({ id: w.id, ok, given }); sfx('tap'); return setTimeout(next, 250); }
    sfx(ok ? (combo > 0 && combo % 5 === 0 ? 'combo' : 'ok') : 'bad');
    if (!ok) vibrate(80);
    if (!ok && !requeued.has(w.id)) { requeued.add(w.id); queue.push(makeQ(w, q.type === 'spell' ? 'en' : q.type, pool)); }
    progress();
    fb.hidden = false;
    fb.className = `fb ${ok ? 'good' : 'bad'}`;
    fb.innerHTML = ok
      ? `<div class="fb-in"><div><b>${combo >= 3 ? `🔥 ${combo} 콤보!` : pick(['정답!', '좋아요!', '훌륭해요!', '완벽해요!'])}</b> <span class="muted">+${xp} XP</span><div class="fb-word">${esc(w.word)} · ${esc(w.ko)}</div></div><button class="btn primary fb-next">계속</button></div>`
      : `<div class="fb-in"><div><b>정답은 <u>${esc(w.word)}</u></b>${posTag(w)}<div class="fb-word">${esc(w.ko)}</div>${w.ex ? `<div class="fb-ex">${esc(w.ex)} ${spk(w.ex, 'sm')}</div>` : ''}</div><button class="btn primary fb-next">계속</button></div>`;
    fb.querySelector('.fb-next').onclick = () => { next(); };
    if (prefs.autoSpeak && !ok) speak(w.word);
    if (ok) { clearTimeout(fb._t); fb._t = setTimeout(() => { if (!fb.hidden && fb.classList.contains('good')) next(); }, 1100); }
  }

  async function finish() {
    clearInterval(tInt);
    removeEventListener('keydown', onKey);
    const answered = isTest ? testAnswers.length : done;
    const rightN = isTest ? testAnswers.filter(a => a.ok).length : correctN;
    const p = pct(rightN, answered);
    const st = stats();
    let bonusXp = answered >= 5 ? XP.sessionBonus : 0;
    const counters = { bestCombo };
    if (isTest) {
      counters.tests = 1;
      if (rightN === answered && answered >= 10) { counters.perfect = 1; bonusXp += XP.perfectBonus; }
      const u = S.user;
      await S.store.addResult({ uid: u.uid, name: u.name, grade: u.grade, classNo: u.classNo, number: u.number, bookId: words[0].bookId, lesson: opts.lesson ?? 'mix', score: rightN, total: answered, pct: p, wrong: testAnswers.filter(a => !a.ok).map(a => a.id), ts: Date.now(), sec: Math.round((Date.now() - startedAt) / 1000) }).catch(e => toast('결과 저장 실패: ' + e.message, 'bad'));
    }
    if (opts.review) counters.reviews = 1;
    bonus(bonusXp, counters);
    xpGain += bonusXp;
    const badges = newBadges();
    await flush();
    refreshTop();
    if (p >= 80 && answered >= 5) { sfx('win'); confetti(); }
    const list = isTest ? testAnswers.map(a => ({ w: words.find(x => x.id === a.id) || pool.find(x => x.id === a.id), ok: a.ok, given: a.given })) : [...results.values()];
    const wrong = list.filter(x => !x.ok).map(x => x.w);
    const msg = p === 100 ? '완벽해요! 🎉' : p >= 80 ? '아주 잘했어요!' : p >= 60 ? '좋아요, 조금만 더!' : '틀린 단어를 다시 연습해 봐요';
    stage.innerHTML = `
      <div class="result">
        <div class="ring big" style="--p:${p}"><div><b>${isTest ? `${rightN}/${answered}` : `${p}%`}</b><small>${isTest ? `${p}점` : '정답률'}</small></div></div>
        <h2>${msg}</h2>
        <div class="res-stats">
          <div><b>+${xpGain}</b><span>XP</span></div>
          <div><b>${bestCombo}</b><span>최고 콤보</span></div>
          <div><b>${Math.max(1, Math.round((Date.now() - startedAt) / 60000))}분</b><span>학습 시간</span></div>
          <div><b>🔥 ${st.streak}</b><span>연속 학습</span></div>
        </div>
        ${badges.length ? `<div class="new-badges">${badges.map(b => `<div class="nb"><span>${b.icon}</span><b>${b.name}</b><small>새 배지!</small></div>`).join('')}</div>` : ''}
        <div class="res-list">${list.map(x => `<div class="rl ${x.ok ? 'ok' : 'no'}"><span class="mk">${x.ok ? '✓' : '✗'}</span><b>${esc(x.w.word)}</b><span>${esc(x.w.ko)}</span>${!x.ok && x.given ? `<small class="muted">내 답: ${esc(x.given)}</small>` : ''}</div>`).join('')}</div>
        <div class="res-actions">
          ${wrong.length ? '<button class="btn primary big" id="again-wrong">틀린 단어 다시 연습</button>' : ''}
          <button class="btn big" id="again">한 번 더</button>
          <button class="btn big ghost" id="done">끝내기</button>
        </div>
      </div>`;
    if (badges.length) setTimeout(() => sfx('combo'), 600);
    stage.querySelector('#again-wrong')?.addEventListener('click', () => startSession({ ...opts, mode: 'smart', words: wrong, title: '틀린 단어 다시 연습', review: false }));
    stage.querySelector('#again').onclick = () => startSession({ ...opts, words: shuffle(opts.words) });
    stage.querySelector('#done').onclick = exit;
  }

  next();
  return () => { clearInterval(tInt); removeEventListener('keydown', onKey); };
}
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

// ---------- 단어 카드(플래시카드) ----------
export function startCards({ title, words, back }) {
  fullscreen(stage => {
    let i = 0, flipped = false, front = 'en', known = 0, unknown = [];
    const order = [...words];
    stage.innerHTML = `<div class="sess cards">
      <div class="sess-top"><button class="icon-btn" id="quit" aria-label="닫기">✕</button><div class="bar"><i id="prog"></i></div><span class="count" id="cnt"></span></div>
      <div class="sess-title">${esc(title)} · 카드를 눌러 뒤집고, 옆으로 밀어 넘기세요</div>
      <div class="card-tools"><button class="chip-btn" id="sh">🔀 섞기</button><button class="chip-btn" id="fr">앞면: 영어</button><button class="chip-btn" id="sp">${prefs.autoSpeak ? '🔊 자동 발음 켜짐' : '🔇 자동 발음 꺼짐'}</button></div>
      <div class="flip-wrap"><div class="flip" id="card" tabindex="0"></div></div>
      <div class="row2 card-btns"><button class="btn big dontknow" id="no">😵 몰라요</button><button class="btn big know" id="yes">😎 알아요</button></div>
    </div>`;
    const card = stage.querySelector('#card');
    const exit = () => { flush(); const [r, p] = back || ['learn']; go(r, p); };
    stage.querySelector('#quit').onclick = exit;
    stage.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) { e.stopPropagation(); speak(s.dataset.say); } });
    const draw = () => {
      if (i >= order.length) return end();
      const w = order[i]; flipped = false;
      stage.querySelector('#prog').style.width = `${i / order.length * 100}%`;
      stage.querySelector('#cnt').textContent = `${i + 1}/${order.length}`;
      card.className = 'flip';
      card.innerHTML = `<div class="face f-front">${front === 'en' ? `<b class="hw xl">${esc(w.word)}</b>${posTag(w)}${spk(w.word)}` : `<div class="big-ko">${esc(w.ko)}</div>`}<small class="muted tap">눌러서 뒤집기</small></div><div class="face f-back">${wordCardHTML(w)}</div>`;
      if (prefs.autoSpeak && front === 'en') speak(w.word);
    };
    const flip = () => { flipped = !flipped; card.classList.toggle('on', flipped); if (flipped && front === 'ko') speak(order[i].word); };
    const answer = ok => {
      const w = order[i]; if (!w) return;
      record(w, ok, { kind: 'card' }); refreshTop();
      if (ok) known++; else unknown.push(w);
      card.classList.add(ok ? 'out-r' : 'out-l'); sfx(ok ? 'ok' : 'tap');
      setTimeout(() => { i++; draw(); }, 220);
    };
    card.onclick = e => { if (!e.target.closest('[data-say]')) flip(); };
    card.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flip(); } if (e.key === 'ArrowRight') answer(true); if (e.key === 'ArrowLeft') answer(false); };
    // 스와이프
    let sx = null, dx = 0;
    card.addEventListener('pointerdown', e => { sx = e.clientX; dx = 0; });
    card.addEventListener('pointermove', e => { if (sx == null) return; dx = e.clientX - sx; if (Math.abs(dx) > 8) card.style.transform = `translateX(${dx}px) rotate(${dx / 25}deg)`; });
    const up = () => { if (sx == null) return; card.style.transform = ''; if (Math.abs(dx) > 90) { card.onclick = null; answer(dx > 0); setTimeout(() => card.onclick = e => { if (!e.target.closest('[data-say]')) flip(); }, 300); } sx = null; };
    card.addEventListener('pointerup', up); card.addEventListener('pointercancel', up); card.addEventListener('pointerleave', up);
    stage.querySelector('#yes').onclick = () => answer(true);
    stage.querySelector('#no').onclick = () => answer(false);
    stage.querySelector('#sh').onclick = () => { order.splice(i, order.length - i, ...shuffle(order.slice(i))); draw(); };
    stage.querySelector('#fr').onclick = e => { front = front === 'en' ? 'ko' : 'en'; e.target.textContent = `앞면: ${front === 'en' ? '영어' : '한글'}`; draw(); };
    stage.querySelector('#sp').onclick = e => { prefs.autoSpeak = !prefs.autoSpeak; e.target.textContent = prefs.autoSpeak ? '🔊 자동 발음 켜짐' : '🔇 자동 발음 꺼짐'; };
    async function end() {
      bonus(order.length >= 5 ? XP.sessionBonus : 0); const badges = newBadges(); await flush(); refreshTop();
      stage.querySelector('.flip-wrap').innerHTML = `<div class="result in-cards"><div class="ring big" style="--p:${pct(known, order.length)}"><div><b>${known}/${order.length}</b><small>알아요</small></div></div>
        ${badges.length ? `<div class="new-badges">${badges.map(b => `<div class="nb"><span>${b.icon}</span><b>${b.name}</b><small>새 배지!</small></div>`).join('')}</div>` : ''}
        <div class="res-actions">${unknown.length ? `<button class="btn primary big" id="ag">모르는 ${unknown.length}단어 다시 보기</button><button class="btn big" id="qz">모르는 단어로 퀴즈</button>` : ''}<button class="btn big ghost" id="dn">끝내기</button></div></div>`;
      stage.querySelector('.card-btns').remove(); stage.querySelector('.card-tools').remove();
      stage.querySelector('#ag')?.addEventListener('click', () => startCards({ title, words: unknown, back }));
      stage.querySelector('#qz')?.addEventListener('click', () => startSession({ title: '모르는 단어 퀴즈', words: unknown, pool: words.length >= 4 ? words : unknown, mode: 'smart', back }));
      stage.querySelector('#dn').onclick = exit;
    }
    draw();
  });
}

// ---------- 짝 맞추기 게임 ----------
export function startMatch({ title, words, back }) {
  fullscreen(stage => {
    const set = shuffle(words).slice(0, 6);
    if (set.length < 3) { toast('짝 맞추기는 단어가 3개 이상 필요해요.'); const [r, p] = back; go(r, p); return; }
    const tiles = shuffle([...set.map(w => ({ id: w.id, t: w.word, k: 'en' })), ...set.map(w => ({ id: w.id, t: w.ko, k: 'ko' }))]);
    const t0 = Date.now(); let sel = null, left = set.length, miss = 0, tInt;
    stage.innerHTML = `<div class="sess match"><div class="sess-top"><button class="icon-btn" id="quit" aria-label="닫기">✕</button><div class="sess-title" style="margin:0">${esc(title)} · 짝 맞추기</div><span class="timer" id="tm">0.0초</span></div>
      <div class="mgrid">${tiles.map((x, i) => `<button class="mt ${x.k}" data-i="${i}">${esc(x.t)}</button>`).join('')}</div></div>`;
    const exit = () => { clearInterval(tInt); const [r, p] = back; go(r, p); };
    stage.querySelector('#quit').onclick = exit;
    tInt = setInterval(() => stage.querySelector('#tm').textContent = `${((Date.now() - t0) / 1000).toFixed(1)}초`, 100);
    stage.querySelector('.mgrid').addEventListener('click', e => {
      const b = e.target.closest('.mt'); if (!b || b.classList.contains('gone')) return;
      const x = tiles[+b.dataset.i];
      if (x.k === 'en') speak(x.t);
      if (!sel) { sel = b; b.classList.add('sel'); return; }
      if (sel === b) { b.classList.remove('sel'); sel = null; return; }
      const y = tiles[+sel.dataset.i];
      if (x.id === y.id && x.k !== y.k) {
        sfx('ok'); [b, sel].forEach(n => { n.classList.remove('sel'); n.classList.add('gone'); }); sel = null;
        if (--left === 0) win();
      } else {
        sfx('bad'); miss++; [b, sel].forEach(n => { n.classList.add('shake'); setTimeout(() => n.classList.remove('shake', 'sel'), 400); }); sel = null;
      }
    });
    async function win() {
      clearInterval(tInt);
      const sec = Math.round((Date.now() - t0) / 100) / 10 + miss; // 실수 1번 = +1초
      const best = stats().counters.matchBest;
      bonus(set.length * 5, { matchBest: sec });
      const badges = newBadges(); await flush(); refreshTop();
      if (!best || sec < best) { confetti(); sfx('win'); }
      stage.querySelector('.mgrid').outerHTML = `<div class="result in-cards"><h2>${sec}초</h2><p class="muted">실수 ${miss}번 (1번당 +1초)</p><p>${!best || sec < best ? '🏆 새 최고 기록!' : `최고 기록 ${best}초`}</p>
       ${badges.length ? `<div class="new-badges">${badges.map(b => `<div class="nb"><span>${b.icon}</span><b>${b.name}</b><small>새 배지!</small></div>`).join('')}</div>` : ''}
       <div class="res-actions"><button class="btn primary big" id="ag">다시 하기</button><button class="btn big ghost" id="dn">끝내기</button></div></div>`;
      stage.querySelector('#ag').onclick = () => startMatch({ title, words, back });
      stage.querySelector('#dn').onclick = exit;
    }
    return () => clearInterval(tInt);
  });
}

export { QTYPES, BADGES, progressOf };
