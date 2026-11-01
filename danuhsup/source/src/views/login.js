import { APP } from '../config.js';
import { esc, toast, el } from '../lib/util.js';
import { logo } from '../main.js';

const gradeOpts = (v) => APP.grades.map(g => `<option value="${g}" ${g == v ? 'selected' : ''}>${g}학년</option>`).join('');
const classOpts = (v) => Array.from({ length: APP.classesPerGrade }, (_, i) => i + 1).map(c => `<option value="${c}" ${c == v ? 'selected' : ''}>${c}반</option>`).join('');

export function renderLogin(root, store) {
  const demo = store.mode === 'demo';
  root.innerHTML = `
  <div class="login">
    <section class="login-hero">
      <span class="logo big">${logo}</span>
      <h1>${esc(APP.appName)}</h1>
      <p class="tag">매일 조금씩, 단어가 자라는 숲<br><small>${esc(APP.schoolName)} 영어 어휘 학습</small></p>
      <div class="hero-card" aria-hidden="true">
        <span class="pos">n.</span><b class="hw">aquarium</b><span class="ko">수족관</span>
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
          <button class="btn google big" id="google"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9C6.7 7.3 9.1 5.4 12 5.4z"/></svg> 구글 계정으로 로그인</button>
          ${APP.studentIdLogin ? `
          <div class="or"><span>또는 학번으로</span></div>
          <form id="sid">
            <label>학번 <small class="muted">(예: 2학년 3반 15번 → 20315)</small><input id="sidv" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" required autocomplete="username"></label>
            <label>비밀번호 <small class="muted">(6자 이상)</small><input id="pw" type="password" minlength="6" required autocomplete="current-password"></label>
            <div class="row2"><button class="btn primary" data-mode="login">로그인</button><button class="btn" data-mode="register">처음 사용 (가입)</button></div>
          </form>
` : `<p class="muted small">학교 또는 개인 구글 계정으로 로그인하세요. 처음 한 번만 학년·반·번호를 입력하면 돼요.</p>`}
        </div>`}
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
    root.querySelector('#google').onclick = async () => { try { await store.signInGoogle(); } catch (e) { toast(esc(e.message), 'bad'); } };
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
