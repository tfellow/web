// 교사 화면: 대시보드(반별), 학생별, 단어 분석, 테스트, 단어장 관리
import { S } from '../lib/state.js';
import { allBooks, getBook, getWord, normalizeBook, rowsFromSheet, setCustomBooks, bookSettings, setBookSettings, originalName, removeBook } from '../data/books.js';
import { teacherImg } from '../lib/teacher.js';
import { levelOf, liveStreak, isMastered, isSeen, BADGES, BOX_LABEL } from '../lib/game.js';
import { esc, dayNum, dayNumToKey, keyToDayNum, pct, avg, sum, modal, toast, fmtDate, daysAgoText, downloadCSV, ls, speak } from '../lib/util.js';
import { heatmap } from './student.js';
import { logout } from '../main.js';
import { APP } from '../config.js';

// ---------- 필터 & 데이터 ----------
const F = Object.assign({ grade: 2, classNo: '', bookId: 'g2-park', range: 30 }, ls.get('vocab.tfilter', {}));
const cache = new Map();
async function data() {
  if (!getBook(F.bookId)) F.bookId = allBooks()[0].id;
  const key = JSON.stringify([F.grade, F.classNo, F.bookId]);
  if (!cache.has(key)) cache.set(key, (async () => {
    const students = (await S.store.listStudents({ grade: F.grade, classNo: F.classNo })).sort((a, b) => +sid(a) - +sid(b));
    const progress = await S.store.listProgress(students.map(s => s.uid), F.bookId);
    const results = (await S.store.listResults({ grade: F.grade, classNo: F.classNo })).filter(r => r.bookId === F.bookId);
    return { students, progress, results, book: getBook(F.bookId) };
  })());
  return cache.get(key);
}
export const clearCache = () => cache.clear();

// 학생 1명 요약 지표
function metrics(u, prog, results, book, range) {
  const s = u.stats || {}, since = dayNum() - range + 1;
  const days = Object.entries(s.days || {}).filter(([k]) => keyToDayNum(k) >= since).map(([, d]) => d);
  const words = Object.values(prog || {});
  const my = results.filter(r => r.uid === u.uid);
  const lastTs = s.lastDay ? keyToDayNum(s.lastDay) : null;
  return {
    u, activeDays: days.filter(d => d.xp > 0).length, xp: sum(days, d => d.xp), answers: sum(days, d => d.n),
    acc: sum(days, d => d.n) ? pct(sum(days, d => d.c), sum(days, d => d.n)) : null,
    minutes: Math.round(sum(days, d => d.t) / 60),
    learned: words.filter(isSeen).length, mastered: words.filter(isMastered).length, total: book.words.length,
    streak: liveStreak(s), best: s.bestStreak || 0, totalXp: s.xp || 0, level: levelOf(s.xp || 0).lv,
    tests: my.length, testAvg: my.length ? Math.round(avg(my, r => r.pct)) : null,
    inactive: lastTs == null ? 999 : dayNum() - lastTs, lastDay: s.lastDay, badges: Object.keys(s.badges || {}).length,
  };
}

function filterBar(main, rerender) {
  const books = allBooks();
  const bar = document.createElement('div'); bar.className = 'tfilter';
  bar.innerHTML = `
    <label>학년<select id="fg">${APP.grades.map(g => `<option ${g == F.grade ? 'selected' : ''} value="${g}">${g}학년</option>`).join('')}</select></label>
    <label>반<select id="fc"><option value="">전체 반</option>${Array.from({ length: APP.classesPerGrade }, (_, i) => i + 1).map(c => `<option ${c == F.classNo ? 'selected' : ''} value="${c}">${c}반</option>`).join('')}</select></label>
    <label>단어장<select id="fb">${books.map(b => `<option ${b.id === F.bookId ? 'selected' : ''} value="${b.id}">${esc(b.short || b.title)}</option>`).join('')}</select></label>
    <label>기간<select id="fr">${[[7, '최근 7일'], [14, '최근 14일'], [30, '최근 30일'], [90, '최근 90일']].map(([v, t]) => `<option ${v == F.range ? 'selected' : ''} value="${v}">${t}</option>`).join('')}</select></label>
    <button class="icon-btn" id="frefresh" title="새로고침" aria-label="새로고침">↻</button>`;
  main.prepend(bar);
  const upd = () => { F.grade = +bar.querySelector('#fg').value; F.classNo = bar.querySelector('#fc').value; F.bookId = bar.querySelector('#fb').value; F.range = +bar.querySelector('#fr').value; ls.set('vocab.tfilter', F); rerender(); };
  bar.querySelectorAll('select').forEach(s => s.onchange = upd);
  bar.querySelector('#frefresh').onclick = () => { clearCache(); rerender(); };
}
const scopeName = () => `${F.grade}학년 ${F.classNo ? F.classNo + '반' : '전체'}`;
const loading = main => { main.insertAdjacentHTML('beforeend', '<div class="empty" id="ld">통계를 계산하는 중…</div>'); };

// 단일 계열 막대 차트 (SVG). items: [{label, value, title}]
function bars(items, { max, unit = '', h = 200, fmt = v => v } = {}) {
  if (!items.length) return '<p class="muted">데이터가 없어요.</p>';
  const W = 600, top = 18, bot = 26, ch = h - top - bot;
  const M = max || Math.max(1, ...items.map(i => i.value || 0));
  const bw = Math.max(4, Math.min(40, (W - 30) / items.length * .7));
  const step = (W - 30) / items.length;
  const ticks = [0, M / 2, M];
  let s = `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">`;
  ticks.forEach(t => { const y = top + ch - (t / M) * ch; s += `<line x1="28" x2="${W}" y1="${y}" y2="${y}" class="grid"/><text x="24" y="${y + 3}" class="ax" text-anchor="end">${Math.round(t)}</text>`; });
  items.forEach((it, i) => {
    const v = it.value || 0, bh = Math.max(v ? 2 : 0, (v / M) * ch), x = 30 + i * step + (step - bw) / 2, y = top + ch - bh, rr = Math.min(4, bw / 2, bh);
    s += `<g class="bar-g"><rect x="${30 + i * step}" y="${top}" width="${step}" height="${ch}" class="hit"><title>${esc(it.title || `${it.label}: ${fmt(v)}${unit}`)}</title></rect>`;
    s += `<path d="M${x},${top + ch} V${y + rr} q0,-${rr} ${rr},-${rr} h${bw - 2 * rr} q${rr},0 ${rr},${rr} V${top + ch} Z" class="mark ${it.cls || ''}"/>`;
    if (it.showVal) s += `<text x="${x + bw / 2}" y="${y - 4}" class="val" text-anchor="middle">${fmt(v)}</text>`;
    s += `<text x="${x + bw / 2}" y="${h - 8}" class="ax" text-anchor="middle">${esc(it.label)}</text></g>`;
  });
  return `<div class="chart-wrap">${s}</svg></div>`;
}
// 5자리 학번 (예: 2학년 1반 18번 → 20118)
const sid = u => u && u.grade ? String(u.grade * 10000 + (u.classNo || 0) * 100 + (u.number || 0)) : '-';
const statusOf = p => p == null ? '' : p >= 80 ? 'good' : p >= 60 ? 'warn' : 'crit';

// ================= 대시보드 =================
// 선생님 한마디 편집: vocab_books/_settings 의 notice 필드 (학생은 읽기만 가능)
function noticeEditor(main, go) {
  const n = bookSettings().notice || {};
  main.insertAdjacentHTML('beforeend', `<section class="panel notice-edit">
    ${teacherImg('wave')}
    <form id="nform" class="form">
      <div class="sec-h"><h2>선생님 한마디</h2><span class="muted small">${n.text ? '학생 홈 맨 위에 보이는 중' : '학생 홈 맨 위에 선생님 캐릭터와 함께 보여요'}</span></div>
      <textarea id="ntext" maxlength="140" rows="2" placeholder="예: 이번 주 금요일에 L3 단원 테스트가 있어요. 오늘의 복습 꼭 하기!">${esc(n.text || '')}</textarea>
      <div class="row-inline wrap"><select id="ngrade" style="width:auto"><option value="0">전체 학년</option>${APP.grades.map(g => `<option value="${g}" ${+n.grade === g ? 'selected' : ''}>${g}학년만</option>`).join('')}</select>
      <button class="btn sm primary">올리기</button>${n.text ? '<button type="button" class="btn sm ghost" id="nclear">내리기</button>' : ''}</div>
    </form></section>`);
  const save = async notice => {
    const prev = bookSettings(), next = { ...prev, notice };
    setBookSettings(next);
    try { await S.store.saveBook({ ...next, id: '_settings', updatedAt: Date.now() }); toast(notice ? '학생 홈에 올렸어요.' : '한마디를 내렸어요.', 'good'); }
    catch (e) { setBookSettings(prev); toast('저장 실패: ' + e.message, 'bad'); }
    go('t_dash');
  };
  main.querySelector('#nform').addEventListener('submit', e => { e.preventDefault(); const text = main.querySelector('#ntext').value.trim(); if (!text) return save(null); save({ text, grade: +main.querySelector('#ngrade').value, from: (S.user.name || '').replace(/\s*선생님$/, ''), ts: Date.now() }); });
  main.querySelector('#nclear')?.addEventListener('click', () => save(null));
}

export async function dash(main, params, go) {
  main.innerHTML = '';
  filterBar(main, () => go('t_dash'));
  noticeEditor(main, go);
  loading(main);
  const { students, progress, results, book } = await data();
  main.querySelector('#ld')?.remove();
  const M = students.map(u => metrics(u, progress[u.uid], results, book, F.range));
  const n = M.length;
  if (!n) { main.insertAdjacentHTML('beforeend', `<div class="empty">${scopeName()}에 가입한 학생이 아직 없어요.<br><small>학생들이 로그인할 때 학년·반·번호를 입력하면 여기에 나타나요.</small></div>`); return; }
  const today = dayNum();
  const activeToday = students.filter(u => (u.stats?.days?.[dayNumToKey(today)]?.xp || 0) > 0).length;
  const active7 = M.filter(m => m.inactive < 7).length;
  const rangeRes = results.filter(r => r.ts >= Date.now() - F.range * 86400000);
  // 일별 활동
  const span = Math.min(F.range, 30);
  const daily = Array.from({ length: span }, (_, i) => { const d = today - span + 1 + i, k = dayNumToKey(d); const c = students.filter(u => (u.stats?.days?.[k]?.xp || 0) > 0).length; return { label: i % Math.ceil(span / 10) === 0 || i === span - 1 ? `${+k.slice(5, 7)}/${+k.slice(8)}` : '', value: c, title: `${k} · ${c}명 학습 (${pct(c, n)}%)` }; });
  // 단원별 암기율
  const lessonBars = book.lessons.map(l => {
    const ws = book.words.filter(w => w.lesson === l.n);
    const p = Math.round(avg(students, u => pct(ws.filter(w => isMastered(progress[u.uid]?.[w.id])).length, ws.length)) || 0);
    const ls_ = Math.round(avg(students, u => pct(ws.filter(w => isSeen(progress[u.uid]?.[w.id])).length, ws.length)) || 0);
    const tr = results.filter(r => r.lesson == l.n);
    return { label: `L${l.n}`, value: p, seen: ls_, test: tr.length ? Math.round(avg(tr, r => r.pct)) : null, title: `Lesson ${l.n} · 평균 암기율 ${p}% · 학습률 ${ls_}%`, showVal: true };
  });
  // 반별 비교
  const classes = [...new Set(students.map(u => u.classNo))].sort((a, b) => a - b);
  const classRows = classes.map(c => {
    const cm = M.filter(m => m.u.classNo === c);
    const cr = rangeRes.filter(r => r.classNo === c);
    return { c, n: cm.length, act: pct(cm.filter(m => m.inactive < 7).length, cm.length), xp: Math.round(avg(cm, m => m.xp) || 0), learned: Math.round(avg(cm, m => m.learned) || 0), mastered: Math.round(avg(cm, m => m.mastered) || 0), acc: avg(cm, m => m.acc), test: cr.length ? Math.round(avg(cr, r => r.pct)) : null, streak: (avg(cm, m => m.streak) || 0).toFixed(1) };
  });
  const attention = M.filter(m => m.inactive >= 3).sort((a, b) => b.inactive - a.inactive);
  const lowAcc = M.filter(m => m.acc != null && m.acc < 60 && m.answers >= 20).sort((a, b) => a.acc - b.acc);
  const stars = [...M].sort((a, b) => b.xp - a.xp).slice(0, 5);
  const hard = hardWords(students, progress, book).slice(0, 8);

  main.insertAdjacentHTML('beforeend', `
    <div class="sec-h"><h1>${scopeName()} 대시보드</h1><span class="row-inline"><a class="btn sm ghost" href="guide/teacher.html" target="_blank" rel="noopener">📘 교사 설명서</a><button class="btn sm" id="csv">CSV 내보내기</button></span></div>
    <section class="tiles six">
      <div class="tile"><b>${n}</b><span>학생 수</span></div>
      <div class="tile"><b>${activeToday}</b><span>오늘 학습</span><small>${pct(activeToday, n)}%</small></div>
      <div class="tile"><b>${pct(active7, n)}%</b><span>7일 참여율</span><small>${active7}명</small></div>
      <div class="tile"><b>${Math.round(avg(M, m => m.learned))}</b><span>평균 학습 단어</span><small>/ ${book.words.length}</small></div>
      <div class="tile"><b>${Math.round(avg(M, m => m.acc) ?? 0)}%</b><span>평균 정답률</span><small>${F.range}일</small></div>
      <div class="tile"><b>${rangeRes.length ? Math.round(avg(rangeRes, r => r.pct)) + '점' : '-'}</b><span>테스트 평균</span><small>${rangeRes.length}회 응시</small></div>
    </section>
    <section class="grid2">
      <div class="panel"><div class="sec-h"><b>일별 학습 학생 수</b><span class="muted small">최근 ${span}일</span></div>${bars(daily, { max: n, unit: '명' })}</div>
      <div class="panel"><div class="sec-h"><b>단원별 평균 암기율</b><span class="muted small">암기 완료 = 4단계 이상</span></div>${bars(lessonBars, { max: 100, unit: '%' })}
        <table class="mini"><tr><th></th>${lessonBars.map(l => `<th>${l.label}</th>`).join('')}</tr><tr><td>학습률</td>${lessonBars.map(l => `<td>${l.seen}%</td>`).join('')}</tr><tr><td>테스트</td>${lessonBars.map(l => `<td class="${statusOf(l.test)}">${l.test ?? '-'}</td>`).join('')}</tr></table></div>
    </section>
    ${classes.length > 1 ? `<section class="panel"><div class="sec-h"><b>반별 비교</b><span class="muted small">반 이름을 누르면 그 반만 볼 수 있어요</span></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>반</th><th>학생</th><th>7일 참여율</th><th>평균 XP</th><th>학습 단어</th><th>암기 단어</th><th>정답률</th><th>테스트 평균</th><th>평균 연속일</th></tr></thead>
      <tbody>${classRows.map(r => `<tr><td><button class="link" data-class="${r.c}">${r.c}반</button></td><td>${r.n}</td><td><span class="meter"><i style="width:${r.act}%"></i></span>${r.act}%</td><td>${r.xp.toLocaleString()}</td><td>${r.learned}</td><td>${r.mastered}</td><td class="${statusOf(r.acc)}">${r.acc == null ? '-' : Math.round(r.acc) + '%'}</td><td class="${statusOf(r.test)}">${r.test ?? '-'}</td><td>${r.streak}</td></tr>`).join('')}</tbody></table></div></section>` : ''}
    <section class="grid3">
      <div class="panel"><div class="sec-h"><b>관심이 필요한 학생</b><span class="muted small">3일 이상 미접속</span></div>
        ${attention.length ? `<ul class="plist">${attention.slice(0, 10).map(m => `<li data-uid="${m.u.uid}"><b>${esc(m.u.name)}</b><small class="muted">${sid(m.u)}</small><span class="tag crit">${m.inactive >= 999 ? '미접속' : m.inactive + '일째'}</span></li>`).join('')}</ul>${attention.length > 10 ? `<p class="muted small">외 ${attention.length - 10}명</p>` : ''}` : '<p class="muted">모두 꾸준히 학습하고 있어요 👏</p>'}
        ${lowAcc.length ? `<div class="sec-h" style="margin-top:12px"><b>정답률이 낮은 학생</b></div><ul class="plist">${lowAcc.slice(0, 5).map(m => `<li data-uid="${m.u.uid}"><b>${esc(m.u.name)}</b><small class="muted">${sid(m.u)}</small><span class="tag warn">${m.acc}%</span></li>`).join('')}</ul>` : ''}</div>
      <div class="panel"><div class="sec-h"><b>칭찬할 학생</b><span class="muted small">${F.range}일 XP</span></div>
        <ul class="plist">${stars.map((m, i) => `<li data-uid="${m.u.uid}"><span class="rn">${i + 1}</span><b>${esc(m.u.name)}</b><small class="muted">${sid(m.u)}</small><span class="tag good">${m.xp.toLocaleString()} XP</span></li>`).join('')}</ul></div>
      <div class="panel"><div class="sec-h"><b>어려워하는 단어</b><button class="link" id="moreW">전체 보기</button></div>
        <ul class="plist">${hard.map(h => `<li><b>${esc(h.w.word)}</b><small class="muted">L${h.w.lesson} ${esc(h.w.ko)}</small><span class="tag crit">오답 ${h.rate}%</span></li>`).join('') || '<li class="muted">아직 데이터가 부족해요.</li>'}</ul></div>
    </section>`);
  main.querySelectorAll('[data-class]').forEach(b => b.onclick = () => { F.classNo = b.dataset.class; ls.set('vocab.tfilter', F); go('t_dash'); });
  main.querySelectorAll('[data-uid]').forEach(li => li.onclick = () => studentModal(li.dataset.uid));
  main.querySelector('#moreW').onclick = () => go('t_words');
  main.querySelector('#csv').onclick = () => exportCSV(M);
}

function exportCSV(M) {
  downloadCSV(`단어학습_${scopeName()}_${dayNumToKey(dayNum())}.csv`, [
    ['학번', '학년', '반', '번호', '이름', `${F.range}일 학습일`, `${F.range}일 XP`, `${F.range}일 문제 수`, '정답률(%)', '학습 시간(분)', '학습 단어', '암기 단어', '현재 연속일', '최고 연속일', '레벨', '누적 XP', '테스트 횟수', '테스트 평균', '마지막 학습일'],
    ...M.map(m => [sid(m.u), m.u.grade, m.u.classNo, m.u.number, m.u.name, m.activeDays, m.xp, m.answers, m.acc ?? '', m.minutes, m.learned, m.mastered, m.streak, m.best, m.level, m.totalXp, m.tests, m.testAvg ?? '', m.lastDay || '']),
  ]);
  toast('CSV 파일을 내려받았어요. 구글 시트에서 [파일 → 가져오기]로 열 수 있어요.');
}

function hardWords(students, progress, book, lessonN) {
  const out = [];
  for (const w of book.words) {
    if (lessonN && w.lesson != lessonN) continue;
    let s = 0, wr = 0, who = 0, weak = 0;
    for (const u of students) { const st = progress[u.uid]?.[w.id]; if (st?.s) { s += st.s; wr += st.w; who++; if (st.b <= 2) weak++; } }
    if (s >= 3) out.push({ w, attempts: s, wrong: wr, rate: pct(wr, s), who, weak });
  }
  return out.sort((a, b) => b.rate - a.rate || b.wrong - a.wrong);
}

// ================= 학생별 =================
export async function students(main, params, go) {
  main.innerHTML = '';
  filterBar(main, () => go('t_students'));
  loading(main);
  const { students, progress, results, book } = await data();
  main.querySelector('#ld')?.remove();
  const M = students.map(u => metrics(u, progress[u.uid], results, book, F.range));
  let sortK = 'num', dir = 1, q = '';
  const cols = [['num', '학번'], ['name', '이름'], ['activeDays', '학습일'], ['xp', 'XP'], ['acc', '정답률'], ['learned', '학습 단어'], ['mastered', '암기'], ['streak', '연속'], ['testAvg', '테스트'], ['inactive', '마지막 학습']];
  main.insertAdjacentHTML('beforeend', `
    <div class="sec-h"><h1>학생별 기록 <small class="muted">${scopeName()} · ${M.length}명</small></h1>
      <div class="row-inline"><input id="q" class="search" placeholder="이름 검색" aria-label="이름 검색"><button class="btn sm" id="csv">CSV</button></div></div>
    <p class="muted small">기간: 최근 ${F.range}일 · 이름을 누르면 자세한 기록을 볼 수 있어요. 열 제목을 누르면 정렬돼요.</p>
    <div class="tbl-wrap"><table class="tbl sortable"><thead><tr>${cols.map(([k, t]) => `<th data-k="${k}">${t}</th>`).join('')}</tr></thead><tbody id="tb"></tbody></table></div>`);
  const val = (m, k) => k === 'num' ? +sid(m.u) : k === 'name' ? m.u.name : m[k] ?? -1;
  const draw = () => {
    const list = M.filter(m => !q || m.u.name.includes(q)).sort((a, b) => { const x = val(a, sortK), y = val(b, sortK); return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
    main.querySelector('#tb').innerHTML = list.map(m => `<tr data-uid="${m.u.uid}">
      <td>${sid(m.u)}</td><td><button class="link">${esc(m.u.name)}</button></td><td>${m.activeDays}일</td><td>${m.xp.toLocaleString()}</td>
      <td class="${statusOf(m.acc)}">${m.acc == null ? '-' : m.acc + '%'}</td>
      <td><span class="meter"><i style="width:${pct(m.learned, m.total)}%"></i></span>${m.learned}</td><td>${m.mastered}</td><td>${m.streak ? '🔥' + m.streak : '0'}</td>
      <td class="${statusOf(m.testAvg)}">${m.testAvg ?? '-'}</td><td class="${m.inactive >= 3 ? 'crit' : ''}">${m.inactive >= 999 ? '없음' : daysAgoText(Date.now() - m.inactive * 86400000)}</td></tr>`).join('');
    main.querySelectorAll('th[data-k]').forEach(th => th.className = th.dataset.k === sortK ? (dir > 0 ? 'asc' : 'desc') : '');
  };
  main.querySelector('thead').onclick = e => { const th = e.target.closest('th'); if (!th) return; if (sortK === th.dataset.k) dir *= -1; else { sortK = th.dataset.k; dir = ['num', 'name', 'inactive'].includes(sortK) ? 1 : -1; } draw(); };
  main.querySelector('#tb').onclick = e => { const tr = e.target.closest('tr'); if (tr) studentModal(tr.dataset.uid); };
  main.querySelector('#q').oninput = e => { q = e.target.value.trim(); draw(); };
  main.querySelector('#csv').onclick = () => exportCSV(M);
  draw();
}

async function studentModal(uid) {
  const { students, progress, results, book } = await data();
  const u = students.find(x => x.uid === uid); if (!u) return;
  const m = metrics(u, progress[uid], results, book, F.range);
  const prog = progress[uid] || {};
  const my = results.filter(r => r.uid === uid).sort((a, b) => b.ts - a.ts);
  const weak = book.words.map(w => ({ w, st: prog[w.id] })).filter(x => x.st?.w > 0).sort((a, b) => b.st.w - a.st.w || a.st.b - b.st.b).slice(0, 15);
  const s = u.stats || {};
  const lessonRows = book.lessons.map(l => { const ws = book.words.filter(w => w.lesson === l.n); const seen = ws.filter(w => isSeen(prog[w.id])).length, mast = ws.filter(w => isMastered(prog[w.id])).length; const t = my.filter(r => r.lesson == l.n); return { l, total: ws.length, seen, mast, best: t.length ? Math.max(...t.map(r => r.pct)) : null }; });
  modal(`
    <div class="sm-head"><div class="avatar">${esc(u.name.slice(-2))}</div><div><h2>${esc(u.name)}</h2><p class="muted">${u.grade}학년 ${u.classNo}반 ${u.number}번 · Lv.${m.level} · 누적 ${m.totalXp.toLocaleString()} XP · 배지 ${m.badges}개</p></div></div>
    <section class="tiles six">
      <div class="tile"><b>${m.activeDays}일</b><span>${F.range}일 중 학습</span></div>
      <div class="tile"><b>${m.acc ?? '-'}${m.acc != null ? '%' : ''}</b><span>정답률</span></div>
      <div class="tile"><b>${m.minutes}분</b><span>학습 시간</span></div>
      <div class="tile"><b>${m.learned}</b><span>학습 단어</span></div>
      <div class="tile"><b>🔥${m.streak}</b><span>연속 (최고 ${m.best})</span></div>
      <div class="tile"><b>${m.testAvg ?? '-'}</b><span>테스트 평균</span></div>
    </section>
    <div class="panel flat"><div class="sec-h"><b>학습 달력</b><span class="muted small">마지막 학습: ${s.lastDay || '없음'}</span></div>${heatmap(s.days || {}, 16)}</div>
    <div class="grid2">
      <div class="panel flat"><b>단원별 진도</b><table class="tbl compact"><thead><tr><th>단원</th><th>학습</th><th>암기</th><th>최고 점수</th></tr></thead><tbody>${lessonRows.map(r => `<tr><td>L${r.l.n}</td><td><span class="meter"><i style="width:${pct(r.seen, r.total)}%"></i></span>${r.seen}/${r.total}</td><td>${r.mast}</td><td class="${statusOf(r.best)}">${r.best ?? '-'}</td></tr>`).join('')}</tbody></table></div>
      <div class="panel flat"><b>자주 틀리는 단어</b>${weak.length ? `<ul class="plist">${weak.map(x => `<li><b>${esc(x.w.word)}</b><small class="muted">${esc(x.w.ko)}</small><span class="tag crit">✗${x.st.w}</span><span class="tag">${BOX_LABEL[x.st.b]}</span></li>`).join('')}</ul>` : '<p class="muted">틀린 단어가 없어요.</p>'}</div>
    </div>
    <div class="panel flat"><b>테스트 기록</b>${my.length ? `<table class="tbl compact"><thead><tr><th>날짜</th><th>단원</th><th>점수</th><th>소요</th><th>틀린 단어</th></tr></thead><tbody>${my.map(r => `<tr><td>${fmtDate(r.ts)}</td><td>${r.lesson === 'mix' ? '종합' : 'L' + r.lesson}</td><td class="${statusOf(r.pct)}">${r.pct}점 (${r.score}/${r.total})</td><td>${Math.round((r.sec || 0) / 60)}분</td><td class="small">${(r.wrong || []).map(id => esc(getWord(id)?.word || '')).join(', ')}</td></tr>`).join('')}</tbody></table>` : '<p class="muted">응시 기록이 없어요.</p>'}</div>
    <div class="panel flat"><b>배지</b><div class="badge-row">${BADGES.filter(b => s.badges?.[b.id]).map(b => `<div class="bdg on" title="${esc(b.desc)}"><span>${b.icon}</span><small>${b.name}</small></div>`).join('') || '<span class="muted">아직 없어요</span>'}</div></div>
  `, { wide: true });
}

// ================= 단어 분석 =================
export async function words(main, params, go) {
  main.innerHTML = '';
  filterBar(main, () => go('t_words'));
  loading(main);
  const { students, progress, book } = await data();
  main.querySelector('#ld')?.remove();
  let lessonN = '';
  main.insertAdjacentHTML('beforeend', `
    <div class="sec-h"><h1>단어 분석 <small class="muted">${scopeName()}</small></h1>
      <label class="row-inline">단원 <select id="wl"><option value="">전체</option>${book.lessons.map(l => `<option value="${l.n}">L${l.n}</option>`).join('')}</select></label></div>
    <p class="muted small">오답률 = 학생들이 이 단어를 틀린 횟수 ÷ 푼 횟수. 수업 시간에 다시 짚어 줄 단어를 고를 때 활용하세요.</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>단어</th><th>뜻</th><th>단원</th><th>오답률</th><th>푼 횟수</th><th>학습한 학생</th><th>아직 약한 학생</th><th></th></tr></thead><tbody id="tb"></tbody></table></div>`);
  const draw = () => {
    const list = hardWords(students, progress, book, lessonN);
    main.querySelector('#tb').innerHTML = list.map((h, i) => `<tr><td>${i + 1}</td><td><b>${esc(h.w.word)}</b> <span class="pos">${esc(h.w.pos)}</span></td><td>${esc(h.w.ko)}</td><td>L${h.w.lesson}</td>
      <td class="${h.rate >= 40 ? 'crit' : h.rate >= 25 ? 'warn' : ''}"><span class="meter red"><i style="width:${h.rate}%"></i></span>${h.rate}%</td><td>${h.attempts}</td><td>${h.who}/${students.length}</td><td>${h.weak}명</td><td><button class="icon-btn sm" data-say="${esc(h.w.word)}" aria-label="발음">🔊</button></td></tr>`).join('') || '<tr><td colspan="9" class="muted">아직 데이터가 부족해요.</td></tr>';
  };
  main.querySelector('#wl').onchange = e => { lessonN = e.target.value; draw(); };
  main.addEventListener('click', e => { const s = e.target.closest('[data-say]'); if (s) speak(s.dataset.say); });
  draw();
}

// ================= 테스트 =================
export async function tests(main, params, go) {
  main.innerHTML = '';
  filterBar(main, () => go('t_tests'));
  loading(main);
  const { students, results, book } = await data();
  main.querySelector('#ld')?.remove();
  const L = book.lessons;
  const cell = (uid, n) => { const t = results.filter(r => r.uid === uid && r.lesson == n); return t.length ? { best: Math.max(...t.map(r => r.pct)), cnt: t.length, last: t.sort((a, b) => b.ts - a.ts)[0] } : null; };
  const recent = [...results].sort((a, b) => b.ts - a.ts).slice(0, 30);
  main.insertAdjacentHTML('beforeend', `
    <div class="sec-h"><h1>테스트 결과 <small class="muted">${scopeName()}</small></h1><button class="btn sm" id="csv">CSV</button></div>
    <section class="tiles">${L.map(l => { const t = results.filter(r => r.lesson == l.n); const takers = new Set(t.map(r => r.uid)).size; return `<div class="tile"><b class="${statusOf(t.length ? avg(t, r => r.pct) : null)}">${t.length ? Math.round(avg(t, r => r.pct)) : '-'}</b><span>L${l.n} 평균</span><small>${takers}/${students.length}명 응시</small></div>`; }).join('')}</section>
    <div class="panel"><div class="sec-h"><b>학생 × 단원 최고 점수</b><span class="muted small"><i class="sw good"></i>80 이상 <i class="sw warn"></i>60~79 <i class="sw crit"></i>60 미만</span></div>
    <div class="tbl-wrap"><table class="tbl matrix"><thead><tr><th>학번</th><th>이름</th>${L.map(l => `<th>L${l.n}</th>`).join('')}<th>평균</th></tr></thead>
    <tbody>${students.map(u => { const cs = L.map(l => cell(u.uid, l.n)); const v = cs.filter(Boolean); return `<tr><td>${sid(u)}</td><td>${esc(u.name)}</td>${cs.map(c => `<td class="hm ${c ? statusOf(c.best) : ''}" title="${c ? `${c.cnt}회 응시` : '미응시'}">${c ? c.best : '·'}</td>`).join('')}<td><b>${v.length ? Math.round(avg(v, c => c.best)) : '-'}</b></td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="panel"><div class="sec-h"><b>최근 응시</b></div>
    <div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>일시</th><th>학생</th><th>단원</th><th>점수</th><th>틀린 단어</th></tr></thead><tbody>${recent.map(r => `<tr><td>${fmtDate(r.ts)}</td><td>${sid(r)} ${esc(r.name)}</td><td>${r.lesson === 'mix' ? '종합' : 'L' + r.lesson}</td><td class="${statusOf(r.pct)}">${r.pct}점</td><td class="small">${(r.wrong || []).slice(0, 8).map(id => esc(getWord(id)?.word || '')).join(', ')}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">아직 응시 기록이 없어요.</td></tr>'}</tbody></table></div></div>`);
  main.querySelector('#csv').onclick = () => downloadCSV(`테스트결과_${scopeName()}.csv`, [['일시', '학번', '학년', '반', '번호', '이름', '단원', '점수', '맞은 수', '문항 수', '소요(초)', '틀린 단어'], ...results.sort((a, b) => a.ts - b.ts).map(r => [new Date(r.ts).toLocaleString('ko-KR'), sid(r), r.grade, r.classNo, r.number, r.name, r.lesson, r.pct, r.score, r.total, r.sec, (r.wrong || []).map(id => getWord(id)?.word || '').join(' / ')])]);
}

// ================= 단어장 관리 =================
export async function books(main, params, go) {
  const list = allBooks();
  const card = (b, i) => `<div class="panel book" data-id="${b.id}">
      <div class="book-order"><button class="icon-btn sm" data-up="${b.id}" aria-label="위로" ${i === 0 ? 'disabled' : ''}>▲</button><button class="icon-btn sm" data-down="${b.id}" aria-label="아래로" ${i === list.length - 1 ? 'disabled' : ''}>▼</button></div>
      <div class="book-info"><p class="eyebrow">${i + 1}번째 · ${b.grade}학년 · ${esc(b.publisher || '')}</p><div class="row-inline wrap"><b>${esc(b.title)}</b><span class="pill" title="학생 화면 버튼 이름">${esc(b.short || '')}</span></div><p class="muted small">${b.words.length}단어 · ${b.lessons.length}단원 ${b.builtin ? '· 기본 내장' : ''}</p>
        <form class="rename form" data-rename="${b.id}" hidden><div class="row2"><label>단어장 이름<input name="title" required value="${esc(b.title)}"></label><label>짧은 이름 (학생 버튼)<input name="short" maxlength="12" value="${esc(b.short || '')}"></label></div><div class="row-inline"><button class="btn sm primary">이름 저장</button><button type="button" class="btn sm ghost" data-cancel>취소</button>${bookSettings().names?.[b.id] ? `<button type="button" class="btn sm ghost" data-reset="${b.id}">원래 이름으로</button>` : ''}</div></form>
      </div>
      <div class="book-act"><button class="btn sm" data-edit="${b.id}">이름 바꾸기</button>${b.builtin ? '' : `<button class="btn sm danger ghost" data-del="${b.id}">삭제</button>`}</div></div>`;
  main.innerHTML = `
    <div class="sec-h"><h1>단어장 관리</h1></div>
    <p class="muted">▲▼ 로 순서를 바꾸면 학생 학습 화면의 단어장 버튼도 같은 순서로 나와요. 학생에게 처음 선택되는 단어장은 지금처럼 자기 학년 단어장이에요.</p>
    <section class="book-list">${list.map(card).join('')}</section>
    <section class="panel">
      <h2>새 단어장 추가</h2>
      <p class="muted">지금 쓰고 계신 엑셀과 같은 형식(첫 줄 머리글: <code>grade, lesson, no., words, 한글 뜻, 영영풀이, 예문, 예문 해석</code>)이면 그대로 올릴 수 있어요. 품사(n., v., adj.)는 뜻 앞에 붙여 쓰면 자동으로 나눠요.</p>
      <form id="up" class="form">
        <div class="row3"><label>단어장 이름<input id="bt" required placeholder="예: 중3 영어 New Words"></label><label>짧은 이름<input id="bs" placeholder="예: 중3 (박)" maxlength="12"></label><label>학년<select id="bg">${APP.grades.map(g => `<option value="${g}">${g}학년</option>`).join('')}</select></label></div>
        <label>출판사/메모<input id="bp" placeholder="예: 출판사 교과서"></label>
        <label class="file">엑셀(.xlsx) 또는 CSV 파일<input type="file" id="bf" accept=".xlsx,.xls,.csv" required></label>
        <div id="prev"></div>
        <button class="btn primary" id="save" disabled>단어장 저장</button>
      </form>
    </section>
    <section class="panel"><h2>계정</h2><p class="muted small">${esc(S.user.email || '')} · ${S.store.mode === 'demo' ? '체험 모드 (이 기기에만 저장)' : 'Firebase 연결됨'}</p><button class="btn danger ghost" id="logout">로그아웃</button></section>`;
  let parsed = null;
  main.querySelector('#logout').onclick = logout;
  main.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
    if (b.dataset.confirm !== '1') { b.dataset.confirm = '1'; b.textContent = '정말 삭제'; return; }
    await S.store.deleteBook(b.dataset.del); removeBook(b.dataset.del); toast('단어장을 삭제했어요.'); go('t_books');
  });
  // 이름·순서 저장: vocab_books/_settings 한 문서
  const saveSettings = async (next, msg) => {
    const prev = bookSettings();
    setBookSettings(next);
    try { await S.store.saveBook({ ...next, id: '_settings', updatedAt: Date.now() }); clearCache(); toast(msg, 'good'); }
    catch (err) { setBookSettings(prev); toast('저장 실패: ' + err.message, 'bad'); }
    go('t_books');
  };
  const move = (id, d) => {
    const ids = list.map(b => b.id), i = ids.indexOf(id), j = i + d;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    saveSettings({ ...bookSettings(), order: ids }, '순서를 바꿨어요.');
  };
  main.querySelectorAll('[data-up]').forEach(b => b.onclick = () => move(b.dataset.up, -1));
  main.querySelectorAll('[data-down]').forEach(b => b.onclick = () => move(b.dataset.down, 1));
  main.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { const f = main.querySelector(`[data-rename="${b.dataset.edit}"]`); f.hidden = !f.hidden; if (!f.hidden) f.elements.title.focus(); });
  main.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => { b.closest('form').hidden = true; });
  main.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => { const st = bookSettings(); delete st.names[b.dataset.reset]; saveSettings(st, '원래 이름으로 돌렸어요.'); });
  main.querySelectorAll('[data-rename]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const id = f.dataset.rename, o = originalName(id), title = f.elements.title.value.trim(), short = f.elements.short.value.trim() || title.slice(0, 10);
    const st = bookSettings(); st.names = st.names || {};
    if (title === o.title && short === o.short) delete st.names[id]; else st.names[id] = { title, short };
    saveSettings(st, '단어장 이름을 바꿨어요.');
  }));
  main.querySelector('#bf').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    try {
      let aoa;
      if (/\.csv$/i.test(f.name)) aoa = parseCSV(await f.text());
      else { const XLSX = await loadXLSX(); const wb = XLSX.read(await f.arrayBuffer()); aoa = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }); }
      parsed = rowsFromSheet(aoa);
      if (parsed.grade) main.querySelector('#bg').value = parsed.grade;
      const lessons = [...new Set(parsed.rows.map(r => r.l))];
      main.querySelector('#prev').innerHTML = `<p class="good">✓ ${parsed.rows.length}단어 · ${lessons.length}단원을 읽었어요. 미리보기:</p><div class="tbl-wrap"><table class="tbl compact"><tr><th>단원</th><th>단어</th><th>품사</th><th>뜻</th><th>영영풀이</th></tr>${parsed.rows.slice(0, 6).map(r => `<tr><td>${r.l}</td><td>${esc(r.w)}</td><td>${esc(r.p)}</td><td>${esc(r.k)}</td><td class="small">${esc(r.e)}</td></tr>`).join('')}</table></div>`;
      main.querySelector('#save').disabled = false;
    } catch (err) { main.querySelector('#prev').innerHTML = `<p class="crit">파일을 읽지 못했어요: ${esc(err.message)}</p>`; }
  };
  main.querySelector('#up').addEventListener('submit', async e => {
    e.preventDefault(); if (!parsed) return;
    const title = main.querySelector('#bt').value.trim();
    const id = 'b' + Date.now().toString(36);
    const meta = { id, title, short: main.querySelector('#bs').value.trim() || title.slice(0, 10), grade: +main.querySelector('#bg').value, publisher: main.querySelector('#bp').value.trim(), rows: parsed.rows, createdAt: Date.now() };
    try { await S.store.saveBook(meta); setCustomBooks([meta]); clearCache(); toast('단어장을 추가했어요. 학생 화면 학습 탭에 바로 나타나요.', 'good'); go('t_books'); }
    catch (err) { toast('저장 실패: ' + esc(err.message), 'bad'); }
  });
}
function parseCSV(t) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"' && t[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; } else cur += c; }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  if (rows[0]?.[0]) rows[0][0] = rows[0][0].replace(/^﻿/, '');
  return rows;
}
function loadXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => rej(new Error('엑셀 읽기 도구를 불러오지 못했어요. CSV로 저장해서 올려 주세요.')); document.head.appendChild(s); });
}
