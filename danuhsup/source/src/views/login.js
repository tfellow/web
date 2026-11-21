import { APP } from '../config.js';
import { esc, toast, el } from '../lib/util.js';
import { mascot } from '../lib/mascot.js';
import { allBooks } from '../data/books.js';

const gradeOpts = (v) => APP.grades.map(g => `<option value="${g}" ${g == v ? 'selected' : ''}>${g}학년</option>`).join('');
const classOpts = (v) => Array.from({ length: APP.classesPerGrade }, (_, i) => i + 1).map(c => `<option value="${c}" ${c == v ? 'selected' : ''}>${c}반</option>`).join('');

export function renderLogin(root, store) {
  const demo = store.mode === 'demo';
  // 로그인 화면 단어: 열 때마다 단어장에서 무작위로 하나
  const pool = allBooks().flatMap(b => b.words);
  const hw = pool.length ? pool[Math.floor(Math.random() * pool.length)] : { word: 'aquarium', pos: 'n.', ko: '수족관' };
  root.innerHTML = `
  <div class="login">
    <section class="login-hero">
      ${mascot('cheer', 128, 'bob')}
      <h1>${esc(APP.appName)}</h1>
      <p class="tag">매일 조금씩, 단어가 자라는 숲<br><small>${esc(APP.schoolName)} 영어 어휘 학습</small></p>
      <div class="hero-card" aria-hidden="true">
        ${hw.pos ? `<span class="pos">${esc(hw.pos)}</span>` : ''}<b class="hw">${esc(hw.word)}</b><span class="ko">${esc(hw.ko)}</span>
      </div>
    </section>
    <section class="login-box">
      ${demo ? `
        <div class="notice">체험 모드입니다. 기록은 이 기기의 브라우저에만 저장되고, 교사 화면에는 가상의 학생 32명 데이터가 들어 있어요.</div>
        <form id="demoStudent" class="card form">
          <h2>학생으로 시작</h2>
          <label>이름<input id="dn" required maxlength="12" value="체험학생" autocomplete="off"></label>
          <div class="row3">
            <label>학년<select id="dg">${gradeOpts(2)}</select></label>
            <label>반<select id="dc">${classOpts(3)}</select></label>
            <label>번호<input id="dnum" type="number" min="1" max="40" value="15" required></label>
          </div>
          <button class="btn primary big">학습 시작하기</button>
        </form>
        <div class="card form">
          <h2>교사로 둘러보기</h2>
          <p class="muted">반별·개인별 통계, 어려운 단어 분석, 단어장 업로드를 확인할 수 있어요.</p>
          <button class="btn big" id="demoTeacher">교사 대시보드 열기</button>
        </div>
        <button class="link" id="resetDemo">체험 데이터 처음 상태로 되돌리기</button>
      ` : `
        <div class="card form">
          <h2>로그인</h2>
          ${store.denied ? `<div class="notice">${esc(store.denied)} 계정은 사용할 수 없어요. 학교 구글 계정(@${esc(APP.allowedGoogleDomain || '')})으로 로그인해 주세요.</div><button class="btn big" id="switch">다른 계정으로 로그인</button>` : `<div id="gsi" class="gsi-box"><span class="muted small">로그인 버튼을 불러오는 중…</span></div>`}
          ${APP.studentIdLogin ? `
          <div class="or"><span>또는 학번으로</span></div>
          <form id="sid">
            <label>학번 <small class="muted">(예: 2학년 3반 15번 → 20315)</small><input id="sidv" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" required autocomplete="username"></label>
            <label>비밀번호 <small class="muted">(6자 이상)</small><input id="pw" type="password" minlength="6" required autocomplete="current-password"></label>
            <div class="row2"><button class="btn primary" data-mode="login">로그인</button><button class="btn" data-mode="register">처음 사용 (가입)</button></div>
          </form>
` : `<p class="muted small">학교 구글 계정(@${esc(APP.allowedGoogleDomain || '')})으로 로그인하세요. 처음 한 번만 학년·반·번호를 확인하면 돼요.</p>`}
        </div>`}
      <p class="guide-links"><a href="guide/student.html" target="_blank" rel="noopener">📘 학생 설명서</a> · <a href="guide/teacher.html" target="_blank" rel="noopener">교사 설명서</a></p>
    </section>
  </div>`;

  if (demo) {
    root.querySelector('#demoStudent').addEventListener('submit', e => {
      e.preventDefault();
      store.demoLogin('student', { name: root.querySelector('#dn').value.trim(), grade: root.querySelector('#dg').value, classNo: root.querySelector('#dc').value, number: root.querySelector('#dnum').value });
    });
    root.querySelector('#demoTeacher').onclick = () => store.demoLogin('teacher');
    root.querySelector('#resetDemo').onclick = () => { store.resetDemo(); toast('체험 데이터를 초기화했어요.'); };
  } else {
    const sw = root.querySelector('#switch');
    if (sw) sw.onclick = () => store.signOut();
    const box = root.querySelector('#gsi');
    if (box) {
      if (store.renderGoogleButton) store.renderGoogleButton(box).catch(e => { box.innerHTML = `<span class="bad-text">${esc(e.message)}</span>`; });
      else box.innerHTML = '<button class="btn google big" id="google">구글 계정으로 로그인</button>', box.querySelector('#google').onclick = async () => { try { await store.signInGoogle(); } catch (e) { toast(esc(e.message), 'bad'); } };
    }
    let mode = 'login';
    if (APP.studentIdLogin) root.querySelectorAll('#sid button').forEach(b => b.onclick = () => { mode = b.dataset.mode; });
    if (APP.studentIdLogin) root.querySelector('#sid').addEventListener('submit', async e => {
      e.preventDefault();
      const id = root.querySelector('#sidv').value.trim(), pw = root.querySelector('#pw').value;
      if (!/^\d{5}$/.test(id)) return toast('학번 5자리를 입력해 주세요.', 'bad');
      sessionStorage.setItem('vocab.sid', id);
      try { await store.signInStudent({ id, pw, register: mode === 'register' }); } catch (err) { toast(esc(err.message), 'bad'); }
    });
  }
}

export function renderProfileSetup(root, store, user, done) {
  let sid = ''; try { sid = sessionStorage.getItem('vocab.sid') || ''; } catch { }
  // 학교 계정 아이디(예: 202620118@smy.ms.kr = 2026학년도 2학년 1반 18번)에서 학년·반·번호를 자동으로 채움
  const em = String(user.email || '').match(/^\d{4}(\d)(\d{2})(\d{2})@/);
  if (!sid && em) sid = em[1] + em[2] + em[3];
  const g = sid ? sid[0] : 2, c = sid ? +sid.slice(1, 3) : 1, n = sid ? +sid.slice(3, 5) : '';
  root.innerHTML = `<div class="login"><section class="login-box" style="margin:auto">
    <form class="card form" id="pf">
      <h2>처음 오셨네요! 정보를 알려 주세요</h2>
      <p class="muted">선생님이 반별 기록을 확인할 때 사용해요.</p>
      <label>이름<input id="pn" required maxlength="12" value="${esc(user.name || '')}"></label>
      <div class="row3">
        <label>학년<select id="pg">${gradeOpts(g)}</select></label>
        <label>반<select id="pc">${classOpts(c)}</select></label>
        <label>번호<input id="pnum" type="number" min="1" max="40" value="${n}" required></label>
      </div>
      <button class="btn primary big">시작하기</button>
      <button type="button" class="link" id="out">다른 계정으로 로그인</button>
    </form></section></div>`;
  root.querySelector('#out').onclick = () => store.signOut();
  root.querySelector('#pf').addEventListener('submit', async e => {
    e.preventDefault();
    Object.assign(user, { name: root.querySelector('#pn').value.trim(), grade: +root.querySelector('#pg').value, classNo: +root.querySelector('#pc').value, number: +root.querySelector('#pnum').value, role: user.role || 'student' });
    delete user.needsProfile;
    try { await store.saveUser(user); done(); } catch (err) { toast('저장 실패: ' + esc(err.message), 'bad'); }
  });
}
