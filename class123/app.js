/* ==========================================================================
   Class123 Plus - 메인 애플리케이션 로직 (app.js)
   현재 버전: v1.4.0
   ========================================================================== */

const APP_VERSION = 'v1.8.0';
const STORAGE_KEY = 'CLASS123_PLUS_STATE_V1';

// 최근 부여 실행 취소(Undo) 제어 변수
let lastActionBatchId = null;
let undoToastTimer = null;

// 관리자 인증 설정
const ADMIN_EMAILS = ['tfellow@gmail.com', 'tfellow@smy.ms.kr'];
const AUTH_STORAGE_KEY = 'CLASS123_AUTH_USER_V1';
const ADMIN_PW_STORAGE_KEY = 'CLASS123_ADMIN_PW_V1';
const DEFAULT_ADMIN_PASSWORD = 'class123';

// 기본 추천 으쓱/머쓱 카드 정의
function getDefaultCards() {
  return [
    // 으쓱카드 (칭찬) - 선생님 맞춤 5종 기본 세팅
    { id: 'c_e1', type: 'eussuk', icon: '📒', category: '숙제', title: '숙제' },
    { id: 'c_e2', type: 'eussuk', icon: '🎮', category: 'Kahoot', title: 'Kahoot' },
    { id: 'c_e3', type: 'eussuk', icon: '🧩', category: 'QuizN', title: 'QuizN' },
    { id: 'c_e4', type: 'eussuk', icon: '🎤', category: '발표 우수', title: '발표 우수' },
    { id: 'c_e5', type: 'eussuk', icon: '🔍', category: '오류 발견', title: '오류 발견' },
    // 머쓱카드 (꾸중/주의) - 선생님 맞춤 3종 기본 세팅
    { id: 'c_m1', type: 'meossuk', icon: '⏰', category: '지각', title: '지각' },
    { id: 'c_m2', type: 'meossuk', icon: '🎒', category: '준비물', title: '준비물' },
    { id: 'c_m3', type: 'meossuk', icon: '⚠️', category: '수업태도 불량', title: '수업태도 불량' }
  ];
}

// 기본 단원/차시 진도표 템플릿
function getDefaultSyllabus() {
  return [
    { id: 'syl_1', order: '1차시', title: '오리엔테이션 및 학급·수업 규칙 안내' },
    { id: 'syl_2', order: '2차시', title: 'I-1. 단원 도입 및 핵심 개념 탐구 (1)' },
    { id: 'syl_3', order: '3차시', title: 'I-2. 핵심 개념 탐구 및 사례 분석 (2)' },
    { id: 'syl_4', order: '4차시', title: 'I-3. 탐구 활동 및 모둠 토의·발표' },
    { id: 'syl_5', order: '5차시', title: 'I-4. 단원 마무리 정리 및 형성평가' },
    { id: 'syl_6', order: '6차시', title: 'II-1. 새로운 단원 도입 및 핵심 주제 학습' }
  ];
}

// 초기 샘플 학급 생성 헬퍼
function createSampleClass(id, name, grade, rosterNames) {
  const students = rosterNames.map((item, idx) => ({
    id: `${id}_stu_${idx + 1}`,
    number: idx + 1,
    name: item.name,
    gender: item.gender || 'F',
    visibleEussuk: item.e || 0,
    visibleMeossuk: item.m || 0
  }));

  return {
    id,
    name,
    grade,
    motto: '서로 존중하고 배려하며 함께 성장하는 우리 반!',
    goalEggs: 20,
    goalReward: '🎉 즐거운 특별 자유시간 & 간식 파티!',
    bonusEggs: 0,
    deductEggOnMeossuk: false,
    visibleClassEussuk: students.reduce((acc, s) => acc + s.visibleEussuk, 0),
    visibleClassMeossuk: students.reduce((acc, s) => acc + s.visibleMeossuk, 0),
    students,
    pickedIds: [], // 랜덤 뽑기 중복 방지용 ID 배열
    history: [],   // 카드 부여 상세 기록 (점수 초기화 시에도 보존)
    progressRecords: {} // { [syllabusId]: { completed, date, note, nextTodo } }
  };
}

function createInitialState() {
  const sampleRoster1 = [
    { name: '강연지', gender: 'F', e: 5, m: 0 },
    { name: '고아라', gender: 'F', e: 4, m: 1 },
    { name: '권성완', gender: 'F', e: 3, m: 0 },
    { name: '김민지', gender: 'F', e: 8, m: 0 },
    { name: '김봄이', gender: 'F', e: 4, m: 0 },
    { name: '김주혁', gender: 'F', e: 2, m: 1 },
    { name: '김한누리', gender: 'F', e: 7, m: 0 },
    { name: '김혜영', gender: 'F', e: 3, m: 0 },
    { name: '김희지', gender: 'F', e: 5, m: 0 },
    { name: '박현', gender: 'F', e: 6, m: 1 },
    { name: '박지수', gender: 'F', e: 4, m: 0 },
    { name: '백영지', gender: 'F', e: 5, m: 0 },
    { name: '송지운', gender: 'F', e: 3, m: 0 },
    { name: '신하진', gender: 'F', e: 6, m: 0 },
    { name: '심연주', gender: 'F', e: 2, m: 0 },
    { name: '안진아', gender: 'F', e: 4, m: 0 },
    { name: '윤현지', gender: 'F', e: 9, m: 0 },
    { name: '이선형', gender: 'F', e: 5, m: 0 },
    { name: '이수현', gender: 'F', e: 6, m: 0 },
    { name: '이정한', gender: 'F', e: 7, m: 1 },
    { name: '이주영', gender: 'F', e: 3, m: 0 },
    { name: '이현성', gender: 'F', e: 4, m: 0 },
    { name: '전예나', gender: 'F', e: 5, m: 0 },
    { name: '정현수', gender: 'F', e: 8, m: 1 },
    { name: '정호윤', gender: 'F', e: 4, m: 0 },
    { name: '주진아', gender: 'F', e: 3, m: 0 },
    { name: '최보라', gender: 'F', e: 5, m: 0 },
    { name: '최시경', gender: 'F', e: 4, m: 0 },
    { name: '최승현', gender: 'F', e: 6, m: 0 }
  ];

  const class1 = createSampleClass('cls_1', '2학년 1반', '중학교 2학년', sampleRoster1);
  // 샘플 히스토리 및 진도 기록 추가
  const nowStr = new Date().toISOString().slice(0, 10);
  class1.history = [
    {
      id: 'h_1',
      studentId: class1.students[16].id,
      studentName: class1.students[16].name,
      studentNumber: class1.students[16].number,
      cardId: 'c_e2',
      type: 'eussuk',
      category: '참여',
      icon: '🎤',
      cardTitle: '발표를 자신있게 잘 했어요',
      count: 2,
      memo: '꼼꼼히 조사해 오고 발표 태도도 매우 훌륭했어요!',
      important: true,
      timestamp: `${nowStr} 10:15`
    },
    {
      id: 'h_2',
      studentId: class1.students[23].id,
      studentName: class1.students[23].name,
      studentNumber: class1.students[23].number,
      cardId: 'c_e1',
      type: 'eussuk',
      category: '집중',
      icon: '🎯',
      cardTitle: '수업 태도가 정말 좋아요',
      count: 2,
      memo: '모둠 토의에서 경청하는 자세가 돋보임',
      important: true,
      timestamp: `${nowStr} 10:22`
    },
    {
      id: 'h_3',
      studentId: class1.students[3].id,
      studentName: class1.students[3].name,
      studentNumber: class1.students[3].number,
      cardId: 'c_e5',
      type: 'eussuk',
      category: '최선',
      icon: '🏅',
      cardTitle: '최선을 다하는 자세가 훌륭해요',
      count: 1,
      memo: '',
      important: false,
      timestamp: `${nowStr} 10:30`
    }
  ];

  class1.progressRecords = {
    syl_1: { completed: true, date: nowStr, note: '모둠 구성 및 규칙 안내 완료', nextTodo: '교과서 12쪽 읽어오기' },
    syl_2: { completed: true, date: nowStr, note: '학생 참여도 높음, 질문 3건 해결', nextTodo: '학습지 1번 파일철 정리' }
  };

  const class2 = createSampleClass(
    'cls_2',
    '2학년 2반',
    '중학교 2학년',
    sampleRoster1.slice(0, 24).map(s => ({ ...s, e: Math.floor(Math.random() * 4), m: 0 }))
  );
  class2.progressRecords = {
    syl_1: { completed: true, date: nowStr, note: '오리엔테이션 완료', nextTodo: '교과서 챙겨오기' }
  };

  return {
    cardsVersion: 2,
    currentClassId: 'cls_1',
    currentView: 'students',
    scoreDisplayMode: 'ssukssuk', // 'ssukssuk' | 'both' | 'eussuk' | 'meossuk' | 'hidden'
    soundEnabled: true,
    darkMode: false,
    thermoSidebarMode: 'tree', // 'tree' | 'hof'
    thermoSidebarHidden: false,
    drawMode: 'random', // 'random' | 'flip'
    drawGenderFilter: 'ALL', // 'ALL' | 'F' | 'M'
    showProgressMatrix: false,
    cards: getDefaultCards(),
    syllabus: getDefaultSyllabus(),
    classes: [class1, class2]
  };
}

// 전역 상태 변수
let state = loadState();
let selectedStudentIds = new Set();
let giveModalMode = 'eussuk';
let giveModalTargetIds = [];
let giveModalQuantities = {}; // { [cardId]: count }
let lastPickedStudents = [];  // 랜덤 뽑기에서 방금 뽑힌 학생들
let flipCardOrder = [];       // 학생 섞기(카드 뒤집기)용 섞인 배열 [{ student, flipped }]
let classSetupMode = 'edit';  // 'new' | 'edit'
let tempSetupStudents = [];   // 모달 내 편집용 임시 학생 배열
let currentReportTarget = 'ALL'; // 'ALL' 또는 student.id

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.classes) && parsed.classes.length > 0) {
        if (parsed.cardsVersion !== 2) {
          parsed.cards = getDefaultCards();
          parsed.cardsVersion = 2;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (e) {
    console.warn('LocalStorage 불러오기 실패, 초기 상태를 생성합니다.', e);
  }
  return createInitialState();
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('LocalStorage 저장 오류:', e);
  }
}

function getVisibleClasses() {
  const visible = state.classes.filter(c => !c.hidden);
  return visible.length > 0 ? visible : [state.classes[0]];
}

function getCurrentClass() {
  const visible = getVisibleClasses();
  return visible.find(c => c.id === state.currentClassId) || visible[0];
}

// ==========================================================================
// Web Audio API 사운드 합성기 (외부 음원 파일 없이 모든 효과음 자체 생성)
// ==========================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!state.soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === 'eussuk') {
    // 밝고 경쾌한 마림바/벨 상승 아르페지오 화음 (도-미-솔-높은도)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.075);

      gain.gain.setValueAtTime(0.001, now + idx * 0.075);
      gain.gain.exponentialRampToValueAtTime(0.28, now + idx * 0.075 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.075 + 0.42);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.075);
      osc.stop(now + idx * 0.075 + 0.45);
    });
  } else if (type === 'meossuk') {
    // 아쉬운 하강 톤 (비구름 효과음)
    const notes = [349.23, 311.13, 261.63];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.16, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.35);
    });
  } else if (type === 'tick') {
    // 룰렛/뽑기 틱 소리
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } else if (type === 'flip') {
    // 카드 뒤집기 경쾌한 스냅 사운드
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.09);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  } else if (type === 'fanfare') {
    // 당첨 / 황금알 목표 달성 화려한 팡파레!
    const chord = [
      { f: 523.25, t: 0, d: 0.14 },
      { f: 659.25, t: 0.12, d: 0.14 },
      { f: 783.99, t: 0.24, d: 0.14 },
      { f: 1046.5, t: 0.36, d: 0.55 },
      { f: 783.99, t: 0.55, d: 0.14 },
      { f: 1046.5, t: 0.7, d: 0.7 }
    ];
    chord.forEach(n => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.26, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.02);
    });
  }
}

// ==========================================================================
// 캔버스 폭죽 & 별빛 파티클 엔진 (Confetti & Stars)
// ==========================================================================
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
let particles = [];
let confettiAnimId = null;

function resizeConfettiCanvas() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);
resizeConfettiCanvas();

function launchConfetti(mode = 'eussuk') {
  const colors = mode === 'eussuk'
    ? ['#fde047', '#3b82f6', '#10b981', '#f472b6', '#a855f7', '#fb923c']
    : ['#64748b', '#94a3b8', '#ef4444', '#475569'];

  const count = mode === 'goal' ? 160 : mode === 'eussuk' ? 85 : 35;

  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 260,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 22,
      vy: Math.random() * -18 - 6,
      size: Math.random() * 10 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 14,
      gravity: 0.42,
      alpha: 1
    });
  }

  if (!confettiAnimId) {
    animateConfetti();
  }
}

function animateConfetti() {
  confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.rotation += p.vRot;
    p.alpha -= 0.012;

    confettiCtx.save();
    confettiCtx.globalAlpha = Math.max(0, p.alpha);
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
    confettiCtx.restore();
  });

  particles = particles.filter(p => p.alpha > 0 && p.y < confettiCanvas.height + 40);
  if (particles.length > 0) {
    confettiAnimId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimId = null;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
}

// ==========================================================================
// 관리자 인증 및 로그인 게이트 시스템
// ==========================================================================
function getAdminPassword() {
  return localStorage.getItem(ADMIN_PW_STORAGE_KEY) || DEFAULT_ADMIN_PASSWORD;
}

function getStoredAuthUser() {
  const sessionUser = sessionStorage.getItem(AUTH_STORAGE_KEY);
  if (sessionUser) {
    try {
      return JSON.parse(sessionUser);
    } catch (e) {}
  }
  const localUser = localStorage.getItem(AUTH_STORAGE_KEY);
  if (localUser) {
    try {
      return JSON.parse(localUser);
    } catch (e) {}
  }
  return null;
}

function setStoredAuthUser(userObj, rememberMe = true) {
  const data = JSON.stringify(userObj);
  sessionStorage.setItem(AUTH_STORAGE_KEY, data);
  if (rememberMe) {
    localStorage.setItem(AUTH_STORAGE_KEY, data);
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function clearStoredAuthUser() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function checkAuthState() {
  const user = getStoredAuthUser();
  const overlay = document.getElementById('auth-gate-overlay');
  const userBadge = document.getElementById('auth-user-badge');
  const emailSpan = document.getElementById('auth-user-email');

  if (user && ADMIN_EMAILS.includes(user.email)) {
    // 인증 성공: 로그인 게이트 숨김 및 상단 관리자 뱃지 표시
    if (overlay) overlay.classList.add('hidden');
    if (userBadge) userBadge.style.display = 'inline-flex';
    if (emailSpan) emailSpan.textContent = user.email;
    return true;
  } else {
    // 미인증: 로그인 게이트 노출 & 상단 뱃지 숨김
    if (overlay) overlay.classList.remove('hidden');
    if (userBadge) userBadge.style.display = 'none';
    return false;
  }
}

// 1. 관리자 직접 로그인 (이메일 & 비밀번호)
function handleDirectLogin(e) {
  if (e) e.preventDefault();
  const selectEl = document.getElementById('admin-select-email');
  const passEl = document.getElementById('admin-pass-input');
  const rememberEl = document.getElementById('auth-remember-check');
  const alertBox = document.getElementById('auth-alert-box');

  const email = selectEl ? selectEl.value.trim() : '';
  const pass = passEl ? passEl.value : '';
  const remember = rememberEl ? rememberEl.checked : true;

  if (!ADMIN_EMAILS.includes(email)) {
    showAuthAlert('허가되지 않은 관리자 계정입니다.');
    return;
  }

  const expectedPass = getAdminPassword();
  if (pass !== expectedPass) {
    showAuthAlert('관리자 비밀번호가 일치하지 않습니다.');
    return;
  }

  // 로그인 성공
  setStoredAuthUser({ email, method: 'direct', loginAt: new Date().toISOString() }, remember);
  if (alertBox) alertBox.style.display = 'none';
  if (passEl) passEl.value = '';
  checkAuthState();
  playSound('eussuk');
  initApp();
}

function showAuthAlert(msg) {
  const alertBox = document.getElementById('auth-alert-box');
  if (alertBox) {
    alertBox.textContent = '⚠️ ' + msg;
    alertBox.style.display = 'block';
  }
}

// 2. Google OAuth 로그인
function startGoogleAuth() {
  const selectedEmail = prompt(
    'Google 계정으로 로그인합니다.\n인가된 관리자 계정(tfellow@gmail.com 또는 tfellow@smy.ms.kr)을 입력해 주세요:',
    'tfellow@gmail.com'
  );

  if (!selectedEmail) return;

  const trimmed = selectedEmail.trim();
  if (ADMIN_EMAILS.includes(trimmed)) {
    setStoredAuthUser({ email: trimmed, method: 'google', loginAt: new Date().toISOString() }, true);
    checkAuthState();
    playSound('fanfare');
    initApp();
  } else {
    alert(`접근 불가: [${selectedEmail}] 계정은 관리자로 등록되어 있지 않습니다.\n(허용 관리자: ${ADMIN_EMAILS.join(', ')})`);
  }
}

function handleGoogleCredentialResponse(response) {
  try {
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    const email = payload.email;

    if (ADMIN_EMAILS.includes(email)) {
      setStoredAuthUser({ email, name: payload.name, method: 'google', loginAt: new Date().toISOString() }, true);
      checkAuthState();
      playSound('fanfare');
      initApp();
    } else {
      alert(`접근 거부: [${email}]은 등록된 관리자 계정이 아닙니다.`);
    }
  } catch (err) {
    console.error('Google 로그인 디코딩 오류:', err);
  }
}

// 3. 로그아웃
function handleLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) return;
  clearStoredAuthUser();
  checkAuthState();
  playSound('tick');
}

// 4. 관리자 비밀번호 변경
function changeAdminPassword() {
  const newPwInput = document.getElementById('settings-new-admin-pw');
  const newPw = newPwInput ? newPwInput.value.trim() : '';
  if (!newPw || newPw.length < 4) {
    alert('새 관리자 비밀번호는 4자리 이상이어야 합니다.');
    return;
  }
  localStorage.setItem(ADMIN_PW_STORAGE_KEY, newPw);
  if (newPwInput) newPwInput.value = '';
  playSound('eussuk');
  alert('관리자 비밀번호가 성공적으로 변경되었습니다!');
}

// ==========================================================================
// 초기화 및 전체 렌더링
// ==========================================================================
function initApp() {
  if (!checkAuthState()) {
    return; // 로그인 인증 전에는 메인 앱 렌더링을 차단
  }

  if (state.darkMode) {
    document.body.classList.add('theme-dark');
  }
  updateTopControlsUI();
  renderClassSelector();
  switchView(state.currentView || 'students');
  shuffleFlipCards(false);
  updateUndoButtonUI();
}

function updateTopControlsUI() {
  const soundBtn = document.getElementById('btn-sound-toggle');
  if (soundBtn) {
    soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
    soundBtn.classList.toggle('active-toggle', state.soundEnabled);
  }

  const themeIcon = document.getElementById('btn-theme-toggle');
  const themeLabel = document.getElementById('label-theme-toggle');
  if (themeIcon) themeIcon.textContent = state.darkMode ? '☀️' : '🌙';
  if (themeLabel) themeLabel.textContent = state.darkMode ? '밝은테마' : '다크테마';

  const scoreSelect = document.getElementById('score-display-mode');
  if (scoreSelect) scoreSelect.value = state.scoreDisplayMode;
}

function renderClassSelector() {
  const select = document.getElementById('class-select');
  if (!select) return;
  const visibleClasses = getVisibleClasses();
  if (!visibleClasses.some(c => c.id === state.currentClassId)) {
    state.currentClassId = visibleClasses[0].id;
  }
  select.innerHTML = visibleClasses
    .map(c => `<option value="${c.id}" ${c.id === state.currentClassId ? 'selected' : ''}>🏫 ${escapeHtml(c.name)} (${c.students.length}명)</option>`)
    .join('');
}

function handleClassChange(classId) {
  state.currentClassId = classId;
  selectedStudentIds.clear();
  lastPickedStudents = [];
  saveState();
  shuffleFlipCards(false);
  renderCurrentView();
}

function syncNavActiveState() {
  const viewName = state.currentView;
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));

  if (viewName === 'students') {
    document.getElementById('top-tab-students')?.classList.add('active');
  } else if (viewName === 'luckydraw') {
    if (state.drawMode === 'flip') {
      document.getElementById('top-tab-flip')?.classList.add('active');
    } else {
      document.getElementById('top-tab-random')?.classList.add('active');
    }
  } else if (viewName === 'progress') {
    document.getElementById('top-tab-progress')?.classList.add('active');
  }

  // 좌측 툴바 활성화 (학급온도계, 리포트)
  document.querySelectorAll('.left-toolbar .tool-btn').forEach(btn => btn.classList.remove('active'));
  if (viewName === 'thermometer') {
    document.getElementById('left-btn-thermometer')?.classList.add('active');
  } else if (viewName === 'report') {
    document.getElementById('left-btn-report')?.classList.add('active');
  }
}

function switchView(viewName, drawSubMode = null) {
  state.currentView = viewName;
  if (viewName === 'luckydraw' && drawSubMode) {
    state.drawMode = drawSubMode;
  }
  saveState();

  syncNavActiveState();

  // 뷰 패널 전환
  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.remove('active'));
  const targetPanel = document.getElementById(`view-${viewName}`);
  if (targetPanel) targetPanel.classList.add('active');

  if (viewName === 'luckydraw') {
    switchDrawMode(state.drawMode || 'random');
  } else {
    renderCurrentView();
  }
}

function renderCurrentView() {
  renderClassSelector();
  updateHeaderSummary();

  if (state.currentView === 'students') {
    renderStudentsGrid();
  } else if (state.currentView === 'thermometer') {
    renderThermometerView();
  } else if (state.currentView === 'luckydraw') {
    renderLuckyDrawView();
  } else if (state.currentView === 'progress') {
    renderProgressView();
  } else if (state.currentView === 'report') {
    renderReportView();
  }
}

// ==========================================================================
// 황금알 개수 계산 함수 (으쓱 10회 = 황금알 1개 + 수동 보너스 - 머쓱 차감 옵션)
// ==========================================================================
function calculateTotalEggs(cls) {
  const autoEggs = Math.floor((cls.visibleClassEussuk || 0) / 10);
  const deductEggs = cls.deductEggOnMeossuk ? Math.floor((cls.visibleClassMeossuk || 0) / 10) : 0;
  return Math.max(0, autoEggs - deductEggs + (cls.bonusEggs || 0));
}

function updateHeaderSummary() {
  const cls = getCurrentClass();
  const totalEggs = calculateTotalEggs(cls);

  const titleEl = document.getElementById('current-class-title');
  if (titleEl) titleEl.textContent = `${cls.name}`;

  const eggEl = document.getElementById('header-egg-count');
  if (eggEl) eggEl.textContent = totalEggs;

  const eEl = document.getElementById('header-eussuk-count');
  if (eEl) eEl.textContent = cls.visibleClassEussuk || 0;

  const mEl = document.getElementById('header-meossuk-count');
  if (mEl) mEl.textContent = cls.visibleClassMeossuk || 0;
}

// ==========================================================================
// 뷰 1: 우리반 학생 카드 그리드 (깔끔한 번호 + 이름 + 점수 카드)
// ==========================================================================
function renderStudentsGrid() {
  const cls = getCurrentClass();
  const grid = document.getElementById('students-grid');
  if (!grid) return;

  if (cls.students.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; background:var(--surface-card); border-radius:24px; border:2px dashed var(--border-color);">
        <div style="font-size:3.5rem; margin-bottom:12px;">📋</div>
        <h3 class="font-display" style="font-size:1.5rem; margin-bottom:8px;">아직 등록된 학생이 없습니다</h3>
        <p style="color:var(--text-secondary); margin-bottom:18px;">엑셀이나 한글 명렬표를 복사해 붙여넣으면 1초 만에 학급이 완성됩니다!</p>
        <button class="btn btn-eussuk" onclick="openClassSetupModal('edit')">📋 명렬 붙여넣기로 학생 등록하기</button>
      </div>
    `;
    updateFloatingSelectionBar();
    return;
  }

  grid.innerHTML = cls.students
    .map(stu => {
      const isSelected = selectedStudentIds.has(stu.id);
      const ssukScore = (stu.visibleEussuk || 0) - (stu.visibleMeossuk || 0);
      let scoreHtml = '';

      if (state.scoreDisplayMode === 'ssukssuk') {
        scoreHtml = `<div class="student-score-badge ${ssukScore < 0 ? 'negative' : ''}"><span>🌱</span><span>${ssukScore}</span></div>`;
      } else if (state.scoreDisplayMode === 'both') {
        scoreHtml = `
          <div class="student-score-dual">
            <span class="dual-e"><span>⭐</span><span>${stu.visibleEussuk || 0}</span></span>
            <span class="dual-m"><span>🌧️</span><span>${stu.visibleMeossuk || 0}</span></span>
          </div>
        `;
      } else if (state.scoreDisplayMode === 'eussuk') {
        scoreHtml = `<div class="student-score-badge"><span>⭐</span><span>${stu.visibleEussuk || 0}</span></div>`;
      } else if (state.scoreDisplayMode === 'meossuk') {
        scoreHtml = `<div class="student-score-badge negative"><span>🌧️</span><span>${stu.visibleMeossuk || 0}</span></div>`;
      } else {
        scoreHtml = `<div class="student-score-badge" style="font-size:1rem; color:var(--text-muted);">•••</div>`;
      }

      const recentEussukCard = getRecentCardForType('eussuk');
      const recentMeossukCard = getRecentCardForType('meossuk');

      return `
        <div class="student-card gender-${stu.gender} ${isSelected ? 'selected' : ''}" onclick="toggleStudentSelect('${stu.id}')">
          <div class="student-card-top">
            ${scoreHtml}
          </div>

          <div class="student-card-name-row">
            <span class="student-num-circle">${stu.number}</span>
            <span class="student-card-name">${escapeHtml(stu.name)}</span>
          </div>

          <div class="student-quick-actions" onclick="event.stopPropagation();">
            <button class="quick-chip eussuk" onclick="giveQuickRecentCardToStudent('${stu.id}', 'eussuk')" title="최근 으쓱 항목 [${escapeHtml(recentEussukCard?.title || '으쓱')}] 즉시 부여">
              ⭐ 으쓱
            </button>
            <button class="quick-chip meossuk" onclick="giveQuickRecentCardToStudent('${stu.id}', 'meossuk')" title="최근 머쓱 항목 [${escapeHtml(recentMeossukCard?.title || '머쓱')}] 즉시 부여">
              🌧️ 머쓱
            </button>
          </div>
        </div>
      `;
    })
    .join('');

  updateFloatingSelectionBar();
}

// 최근 부여했던 으쓱/머쓱 카드 조회 헬퍼
function getRecentCardForType(type) {
  const typeCards = state.cards.filter(c => c.type === type);
  if (typeCards.length === 0) {
    return {
      id: `default_${type}`,
      type,
      icon: type === 'eussuk' ? '⭐' : '🌧️',
      category: type === 'eussuk' ? '칭찬' : '주의',
      title: type === 'eussuk' ? '으쓱' : '머쓱'
    };
  }

  // 1순위: 마지막으로 사용한 카드 ID 기록 확인
  const savedCardId = state.lastUsedCardIdByType?.[type];
  if (savedCardId) {
    const matched = typeCards.find(c => c.id === savedCardId);
    if (matched) return matched;
  }

  // 2순위: 현재 학급 히스토리에서 가장 최근 부여한 동일 타입 카드 확인
  const cls = getCurrentClass();
  const recentHistory = cls?.history?.find(h => h.type === type);
  if (recentHistory) {
    const matchedById = typeCards.find(c => c.id === recentHistory.cardId);
    if (matchedById) return matchedById;
    const matchedByTitle = typeCards.find(c => c.title === recentHistory.cardTitle);
    if (matchedByTitle) return matchedByTitle;
  }

  // 3순위: 기본 첫 번째 카드 반환
  return typeCards[0];
}

// 모달 창을 띄우지 않고 최근 주었던 항목으로 즉시 1장 부여 (단일 학생)
function giveQuickRecentCardToStudent(studentId, type = 'eussuk') {
  const cls = getCurrentClass();
  const stu = cls.students.find(s => s.id === studentId);
  if (!stu) return;

  const prevEggs = calculateTotalEggs(cls);
  const card = getRecentCardForType(type);
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const batchId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (type === 'eussuk') {
    stu.visibleEussuk = (stu.visibleEussuk || 0) + 1;
    cls.visibleClassEussuk = (cls.visibleClassEussuk || 0) + 1;
  } else {
    stu.visibleMeossuk = (stu.visibleMeossuk || 0) + 1;
    cls.visibleClassMeossuk = (cls.visibleClassMeossuk || 0) + 1;
  }

  if (!state.lastUsedCardIdByType) state.lastUsedCardIdByType = {};
  state.lastUsedCardIdByType[type] = card.id;

  cls.history.unshift({
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    batchId,
    studentId: stu.id,
    studentName: stu.name,
    studentNumber: stu.number,
    cardId: card.id,
    type: card.type,
    category: card.category,
    icon: card.icon,
    cardTitle: card.title,
    count: 1,
    memo: '',
    important: false,
    timestamp
  });

  lastActionBatchId = batchId;
  saveState();
  renderCurrentView();
  updateUndoButtonUI();

  // 랜덤뽑기 결과 화면 중인 경우 당첨자 카드의 쑥쑥점수도 즉시 갱신
  if (state.currentView === 'luckydraw' && state.drawMode === 'random' && lastPickedStudents.length > 0) {
    renderPickedWinners(lastPickedStudents);
  }

  showRewardCelebration({
    type: card.type,
    icon: card.icon,
    studentLabel: `${stu.number}번 ${stu.name}`,
    cardTitle: card.title,
    count: 1
  });

  showUndoToast(`${stu.name} 학생에게 ${card.title} (${type === 'eussuk' ? '으쓱' : '머쓱'}) 부여됨`, card.icon);

  const newEggs = calculateTotalEggs(cls);
  if (prevEggs < cls.goalEggs && newEggs >= cls.goalEggs) {
    setTimeout(() => {
      celebrateGoalAchievement();
    }, 1500);
  }
}

// 여러 학생에게 모달 없이 최근 주었던 항목으로 즉시 1장씩 부여 (다중 학생)
function giveQuickRecentCards(studentIds, type = 'eussuk') {
  if (!studentIds || studentIds.length === 0) {
    alert('대상이 선택되지 않았습니다!');
    return;
  }
  const cls = getCurrentClass();
  const targetStudents = cls.students.filter(s => studentIds.includes(s.id));
  if (targetStudents.length === 0) return;

  const prevEggs = calculateTotalEggs(cls);
  const card = getRecentCardForType(type);
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const batchId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  targetStudents.forEach(stu => {
    if (type === 'eussuk') {
      stu.visibleEussuk = (stu.visibleEussuk || 0) + 1;
      cls.visibleClassEussuk = (cls.visibleClassEussuk || 0) + 1;
    } else {
      stu.visibleMeossuk = (stu.visibleMeossuk || 0) + 1;
      cls.visibleClassMeossuk = (cls.visibleClassMeossuk || 0) + 1;
    }

    cls.history.unshift({
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${stu.id}`,
      batchId,
      studentId: stu.id,
      studentName: stu.name,
      studentNumber: stu.number,
      cardId: card.id,
      type: card.type,
      category: card.category,
      icon: card.icon,
      cardTitle: card.title,
      count: 1,
      memo: '',
      important: false,
      timestamp
    });
  });

  if (!state.lastUsedCardIdByType) state.lastUsedCardIdByType = {};
  state.lastUsedCardIdByType[type] = card.id;

  lastActionBatchId = batchId;
  saveState();
  renderCurrentView();
  updateUndoButtonUI();

  if (state.currentView === 'luckydraw' && state.drawMode === 'random' && lastPickedStudents.length > 0) {
    renderPickedWinners(lastPickedStudents);
  }

  const studentLabel = targetStudents.length === 1
    ? `${targetStudents[0].number}번 ${targetStudents[0].name}`
    : `${targetStudents[0].name} 외 ${targetStudents.length - 1}명`;

  showRewardCelebration({
    type: card.type,
    icon: card.icon,
    studentLabel,
    cardTitle: card.title,
    count: 1
  });

  showUndoToast(`${studentLabel}에게 ${card.title} (${type === 'eussuk' ? '으쓱' : '머쓱'}) 부여됨`, card.icon);

  const newEggs = calculateTotalEggs(cls);
  if (prevEggs < cls.goalEggs && newEggs >= cls.goalEggs) {
    setTimeout(() => {
      celebrateGoalAchievement();
    }, 1500);
  }
}

function toggleStudentSelect(studentId) {
  if (selectedStudentIds.has(studentId)) {
    selectedStudentIds.delete(studentId);
  } else {
    selectedStudentIds.add(studentId);
  }
  playSound('tick');
  renderStudentsGrid();
}

function toggleSelectAllStudents() {
  const cls = getCurrentClass();
  if (selectedStudentIds.size === cls.students.length && cls.students.length > 0) {
    selectedStudentIds.clear();
  } else {
    cls.students.forEach(s => selectedStudentIds.add(s.id));
  }
  playSound('tick');
  renderStudentsGrid();
}

function clearStudentSelection() {
  selectedStudentIds.clear();
  renderStudentsGrid();
}

function updateFloatingSelectionBar() {
  const bar = document.getElementById('floating-selection-bar');
  const badge = document.getElementById('selected-students-badge');
  const namesEl = document.getElementById('selected-students-names');
  if (!bar) return;

  const cls = getCurrentClass();
  const selectedList = cls.students.filter(s => selectedStudentIds.has(s.id));

  if (selectedList.length > 0) {
    bar.classList.add('visible');
    badge.textContent = `${selectedList.length}명 선택됨`;
    namesEl.textContent = selectedList.map(s => s.name).join(', ');
  } else {
    bar.classList.remove('visible');
  }
}

function changeScoreDisplayMode(mode) {
  state.scoreDisplayMode = mode;
  saveState();
  renderStudentsGrid();
}

// ==========================================================================
// 으쓱 / 머쓱 카드 부여 모달 및 애니메이션 처리
// ==========================================================================
function openGiveCardModalForSingle(studentId, mode = 'eussuk') {
  giveModalTargetIds = [studentId];
  openGiveCardModalWithTargets(giveModalTargetIds, mode);
}

function openGiveCardModal(mode = 'eussuk') {
  const cls = getCurrentClass();
  if (selectedStudentIds.size === 0) {
    alert('먼저 카드를 부여할 학생을 클릭해 선택해 주세요!');
    return;
  }
  giveModalTargetIds = Array.from(selectedStudentIds);
  openGiveCardModalWithTargets(giveModalTargetIds, mode);
}

function openGiveCardModalForSelectedOrAll() {
  const cls = getCurrentClass();
  if (selectedStudentIds.size > 0) {
    giveModalTargetIds = Array.from(selectedStudentIds);
  } else {
    giveModalTargetIds = cls.students.map(s => s.id);
  }
  openGiveCardModalWithTargets(giveModalTargetIds, 'eussuk');
}

function openGiveCardModalWithTargets(targetIds, mode = 'eussuk') {
  const cls = getCurrentClass();
  giveModalTargetIds = targetIds;
  giveModalMode = mode;
  giveModalQuantities = {};

  const targetStudents = cls.students.filter(s => targetIds.includes(s.id));
  const targetsEl = document.getElementById('give-modal-targets');
  if (targetStudents.length === cls.students.length && cls.students.length > 0) {
    targetsEl.innerHTML = `🎯 부여 대상: <strong style="color:var(--eussuk-blue);">우리 반 전체 학생 (${targetStudents.length}명)</strong>`;
  } else {
    targetsEl.innerHTML = `🎯 부여 대상 (${targetStudents.length}명): <strong style="color:var(--eussuk-blue);">${targetStudents.map(s => `${s.number}번 ${escapeHtml(s.name)}`).join(', ')}</strong>`;
  }

  document.getElementById('give-card-memo').value = '';
  document.getElementById('give-card-important').checked = false;

  switchGiveModalTab(mode);
  openModal('modal-give-card');
}

function switchGiveModalTab(mode) {
  giveModalMode = mode;
  giveModalQuantities = {};

  document.getElementById('tab-give-eussuk').classList.toggle('active', mode === 'eussuk');
  document.getElementById('tab-give-meossuk').classList.toggle('active', mode === 'meossuk');

  const confirmBtn = document.getElementById('btn-confirm-give-card');
  if (mode === 'eussuk') {
    confirmBtn.className = 'btn btn-eussuk';
    confirmBtn.innerHTML = '🌟 선택한 으쓱카드 부여하기';
  } else {
    confirmBtn.className = 'btn btn-meossuk';
    confirmBtn.innerHTML = '🌧️ 선택한 머쓱카드 부여하기';
  }

  renderGiveCardsGrid();
}

function renderGiveCardsGrid() {
  const grid = document.getElementById('give-cards-grid');
  const filteredCards = state.cards.filter(c => c.type === giveModalMode);

  grid.innerHTML = filteredCards
    .map(card => {
      const qty = giveModalQuantities[card.id] || 0;
      const showSubCategory = card.category && card.category !== card.title;
      return `
        <div class="ssukssuk-card-item ${giveModalMode} ${qty > 0 ? 'has-count' : ''}" onclick="changeGiveCardQty('${card.id}', 1)">
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="card-emoji-circle">${qty > 0 ? `<strong style="font-size:1.25rem; color:${giveModalMode === 'eussuk' ? 'var(--eussuk-blue)' : 'var(--meossuk-red)'};">${qty}</strong>` : card.icon}</div>
            <div>
              ${showSubCategory ? `<div style="font-size:0.75rem; font-weight:800; color:var(--text-secondary);">${escapeHtml(card.category)}</div>` : ''}
              <div style="font-weight:800; font-size:1rem; word-break:keep-all;">${escapeHtml(card.title)}</div>
            </div>
          </div>
          <div class="card-count-controls" onclick="event.stopPropagation();">
            ${qty > 0 ? `<button class="qty-btn" onclick="changeGiveCardQty('${card.id}', -1)">-</button>` : ''}
            <button class="qty-btn" onclick="changeGiveCardQty('${card.id}', 1)">+</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function changeGiveCardQty(cardId, delta) {
  const current = giveModalQuantities[cardId] || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) {
    delete giveModalQuantities[cardId];
  } else {
    giveModalQuantities[cardId] = next;
  }
  playSound('tick');
  renderGiveCardsGrid();
}

function submitGiveCards() {
  const selectedCardIds = Object.keys(giveModalQuantities);
  if (selectedCardIds.length === 0) {
    alert('부여할 카드를 1장 이상 클릭해 선택해 주세요!');
    return;
  }

  const cls = getCurrentClass();
  const prevEggs = calculateTotalEggs(cls);
  const memo = document.getElementById('give-card-memo').value.trim();
  const important = document.getElementById('give-card-important').checked;
  const now = new Date();
  const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const batchId = `b_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  const targetStudents = cls.students.filter(s => giveModalTargetIds.includes(s.id));
  if (targetStudents.length === 0) return;

  let totalGivenCount = 0;
  let firstCardObj = null;

  targetStudents.forEach(stu => {
    selectedCardIds.forEach(cardId => {
      const card = state.cards.find(c => c.id === cardId);
      const count = giveModalQuantities[cardId];
      if (!card || !count) return;

      if (!firstCardObj) firstCardObj = card;
      if (!state.lastUsedCardIdByType) state.lastUsedCardIdByType = {};
      state.lastUsedCardIdByType[card.type] = card.id;
      totalGivenCount += count;

      if (card.type === 'eussuk') {
        stu.visibleEussuk = (stu.visibleEussuk || 0) + count;
        cls.visibleClassEussuk = (cls.visibleClassEussuk || 0) + count;
      } else {
        stu.visibleMeossuk = (stu.visibleMeossuk || 0) + count;
        cls.visibleClassMeossuk = (cls.visibleClassMeossuk || 0) + count;
      }

      cls.history.unshift({
        id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${stu.id}`,
        batchId,
        studentId: stu.id,
        studentName: stu.name,
        studentNumber: stu.number,
        cardId: card.id,
        type: card.type,
        category: card.category,
        icon: card.icon,
        cardTitle: card.title,
        count,
        memo,
        important,
        timestamp
      });
    });
  });

  lastActionBatchId = batchId;
  selectedStudentIds.clear();
  saveState();
  closeModal('modal-give-card');
  renderCurrentView();
  updateUndoButtonUI();

  // 화려한 보상 축하 팝업 & 사운드 실행
  const studentLabel = targetStudents.length === 1
    ? `${targetStudents[0].number}번 ${targetStudents[0].name}`
    : `${targetStudents[0].name} 외 ${targetStudents.length - 1}명`;

  const cardPerStudent = Object.values(giveModalQuantities).reduce((a, b) => a + b, 0);
  showRewardCelebration({
    type: giveModalMode,
    icon: firstCardObj ? firstCardObj.icon : '🌟',
    studentLabel,
    cardTitle: firstCardObj ? firstCardObj.title : '',
    count: cardPerStudent
  });

  showUndoToast(`${studentLabel}에게 카드 ${cardPerStudent}장 부여됨`, firstCardObj ? firstCardObj.icon : '🌱');

  // 황금알 목표 달성 시 추가 축하 팡파레!
  const newEggs = calculateTotalEggs(cls);
  if (prevEggs < cls.goalEggs && newEggs >= cls.goalEggs) {
    setTimeout(() => {
      celebrateGoalAchievement();
    }, 1500);
  }
}

function showRewardCelebration({ type, icon, studentLabel, cardTitle, count }) {
  const overlay = document.getElementById('reward-celebration-overlay');
  const banner = document.getElementById('celebration-banner');
  const iconEl = document.getElementById('celeb-icon');
  const badgeEl = document.getElementById('celeb-badge');
  const nameEl = document.getElementById('celeb-student-name');
  const titleEl = document.getElementById('celeb-card-title');

  iconEl.textContent = icon;
  nameEl.textContent = studentLabel;
  titleEl.textContent = cardTitle;

  if (type === 'eussuk') {
    banner.classList.remove('meossuk-mode');
    badgeEl.style.background = '#fde047';
    badgeEl.style.color = '#0f172a';
    badgeEl.textContent = `⭐ 으쓱카드 +${count}장 부여!`;
    titleEl.style.color = '#fde047';
    playSound('eussuk');
    launchConfetti('eussuk');
  } else {
    banner.classList.add('meossuk-mode');
    badgeEl.style.background = '#ef4444';
    badgeEl.style.color = '#ffffff';
    badgeEl.textContent = `🌧️ 머쓱카드 +${count}장 부여`;
    titleEl.style.color = '#fca5a5';
    playSound('meossuk');
    launchConfetti('meossuk');
  }

  overlay.classList.add('show');
  setTimeout(() => {
    overlay.classList.remove('show');
  }, 1550);
}

function celebrateGoalAchievement() {
  const cls = getCurrentClass();
  closeModal('modal-golden-egg');
  playSound('fanfare');
  launchConfetti('goal');
  showRewardCelebration({
    type: 'eussuk',
    icon: '🥚👑🎉',
    studentLabel: `${cls.name} 목표 달성!!`,
    cardTitle: `황금알 ${cls.goalEggs}개 달성! [${cls.goalReward}]`,
    count: cls.goalEggs
  });
}

// ==========================================================================
// 뷰 2: 학급 온도계 & 황금알 & 명예의 전당
// ==========================================================================
function renderThermometerView() {
  const cls = getCurrentClass();
  const totalEggs = calculateTotalEggs(cls);

  document.getElementById('class-motto-text').textContent = cls.motto || '서로 존중하고 배려하는 우리 반!';
  document.getElementById('thermo-egg-number').textContent = totalEggs;
  document.getElementById('thermo-total-eussuk').textContent = cls.visibleClassEussuk || 0;
  document.getElementById('thermo-total-meossuk').textContent = cls.visibleClassMeossuk || 0;

  // 최근 으쓱 받은 학생 트랙 (최대 8개)
  const recentNodesEl = document.getElementById('recent-praised-nodes');
  const recentEussukHistory = cls.history.filter(h => h.type === 'eussuk').slice(0, 8);

  if (recentEussukHistory.length === 0) {
    recentNodesEl.innerHTML = `
      <div style="grid-column: 1 / -1; color:rgba(255,255,255,0.85); text-align:center; padding:24px;">
        아직 으쓱카드를 받은 기록이 없습니다. 첫 번째 으쓱카드를 부여해 보세요! 🌟
      </div>
    `;
  } else {
    recentNodesEl.innerHTML = recentEussukHistory
      .map(h => `
        <div class="track-student-node">
          <span class="node-card-tag">${h.icon} ${escapeHtml(h.category)} +${h.count}</span>
          <div class="node-name">${escapeHtml(h.studentName)}</div>
          <div class="node-time">${h.timestamp.slice(5)}</div>
        </div>
      `)
      .join('');
  }

  // 우측 사이드바 표시/숨김
  const stageEl = document.getElementById('thermometer-stage');
  const rightSideEl = document.getElementById('thermo-right-sidebar');
  stageEl.classList.toggle('hide-sidebar', !!state.thermoSidebarHidden);
  rightSideEl.style.display = state.thermoSidebarHidden ? 'none' : 'flex';

  // 사과나무 온도계 게이지 업데이트
  const goal = Math.max(1, cls.goalEggs || 20);
  const ratio = Math.min(100, Math.round((totalEggs / goal) * 100));

  document.getElementById('tree-goal-number').textContent = goal;
  document.getElementById('tree-goal-reward').textContent = cls.goalReward || '즐거운 특별 보상 시간!';
  document.getElementById('tree-progress-fill').style.height = `${ratio}%`;
  document.getElementById('tree-climber-egg').style.bottom = `${Math.min(92, ratio)}%`;
  document.getElementById('tree-climber-egg').textContent = totalEggs;
  document.getElementById('tree-goal-percent').textContent = `${ratio}% (${totalEggs}/${goal}개)`;

  // 명예의 전당 Top 3 렌더링
  const hofCriteria = document.getElementById('hof-criteria-select')?.value || 'ssukssuk';
  const hofContainer = document.getElementById('hof-list-container');

  if (hofCriteria === 'cards') {
    // 가장 많이 부여된 으쓱카드 Top 3
    const cardCounts = {};
    cls.history.filter(h => h.type === 'eussuk').forEach(h => {
      cardCounts[h.cardId] = (cardCounts[h.cardId] || 0) + h.count;
    });
    const rankedCards = Object.entries(cardCounts)
      .map(([cid, cnt]) => {
        const cObj = state.cards.find(c => c.id === cid) || { icon: '⭐', category: '칭찬', title: '으쓱카드' };
        return { ...cObj, count: cnt };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const medals = ['🥇', '🥈', '🥉'];
    hofContainer.innerHTML = rankedCards.length === 0
      ? `<div style="color:#fff; text-align:center; padding:24px;">아직 부여된 으쓱카드가 없습니다.</div>`
      : rankedCards.map((c, idx) => `
          <div class="hof-rank-card rank-${idx + 1}">
            <div class="hof-medal">${medals[idx]}</div>
            <div class="hof-info">
              <div class="hof-name">${c.icon} ${escapeHtml(c.category)}</div>
              <div class="hof-sub">${escapeHtml(c.title)}</div>
            </div>
            <div class="hof-score">${c.count}회</div>
          </div>
        `).join('');
  } else {
    // 학생 순위 (쑥쑥점수 or 으쓱점수)
    const rankedStudents = [...cls.students]
      .map(s => ({
        ...s,
        ssuk: (s.visibleEussuk || 0) - (s.visibleMeossuk || 0),
        eussuk: s.visibleEussuk || 0
      }))
      .sort((a, b) => (hofCriteria === 'ssukssuk' ? b.ssuk - a.ssuk : b.eussuk - a.eussuk))
      .slice(0, 3);

    const medals = ['🥇', '🥈', '🥉'];
    hofContainer.innerHTML = rankedStudents.map((s, idx) => `
      <div class="hof-rank-card rank-${idx + 1}">
        <div class="hof-medal">${medals[idx]}</div>
        <div class="hof-info">
          <div class="hof-name">${s.number}번 ${escapeHtml(s.name)}</div>
          <div class="hof-sub">⭐으쓱 ${s.eussuk} · 🌧️머쓱 ${s.visibleMeossuk || 0}</div>
        </div>
        <div class="hof-score">${hofCriteria === 'ssukssuk' ? s.ssuk : s.eussuk}점</div>
      </div>
    `).join('');
  }
}

function switchThermoSidebarMode(mode) {
  state.thermoSidebarMode = mode;
  saveState();
  document.getElementById('side-btn-tree').classList.toggle('active', mode === 'tree');
  document.getElementById('side-btn-hof').classList.toggle('active', mode === 'hof');
  document.getElementById('sidebar-tree-view').style.display = mode === 'tree' ? 'flex' : 'none';
  document.getElementById('sidebar-hof-view').style.display = mode === 'hof' ? 'flex' : 'none';
  renderThermometerView();
}

function toggleThermoSidebar() {
  state.thermoSidebarHidden = !state.thermoSidebarHidden;
  saveState();
  renderThermometerView();
}

function editClassMotto() {
  const cls = getCurrentClass();
  const next = prompt('우리 반 한마디(학급 목표 문구)를 입력해 주세요:', cls.motto || '');
  if (next !== null && next.trim() !== '') {
    cls.motto = next.trim();
    saveState();
    renderThermometerView();
  }
}

function openGoldenEggModal() {
  const cls = getCurrentClass();
  const autoEggs = Math.floor((cls.visibleClassEussuk || 0) / 10);
  const totalEggs = calculateTotalEggs(cls);

  document.getElementById('egg-modal-current').textContent = totalEggs;
  document.getElementById('egg-modal-auto').textContent = autoEggs;
  document.getElementById('egg-modal-bonus').textContent = (cls.bonusEggs >= 0 ? `+${cls.bonusEggs}` : cls.bonusEggs);
  document.getElementById('egg-goal-count-input').value = cls.goalEggs || 20;
  document.getElementById('egg-goal-reward-input').value = cls.goalReward || '';
  document.getElementById('egg-deduct-on-meossuk').checked = !!cls.deductEggOnMeossuk;

  openModal('modal-golden-egg');
}

function adjustBonusEgg(delta) {
  const cls = getCurrentClass();
  cls.bonusEggs = (cls.bonusEggs || 0) + delta;
  playSound(delta > 0 ? 'eussuk' : 'meossuk');
  saveState();
  openGoldenEggModal();
  renderCurrentView();
}

function saveGoldenEggSettings() {
  const cls = getCurrentClass();
  cls.goalEggs = Math.max(1, parseInt(document.getElementById('egg-goal-count-input').value, 10) || 20);
  cls.goalReward = document.getElementById('egg-goal-reward-input').value.trim() || '즐거운 특별 보상 시간!';
  cls.deductEggOnMeossuk = document.getElementById('egg-deduct-on-meossuk').checked;
  saveState();
  closeModal('modal-golden-egg');
  renderCurrentView();
}

// ==========================================================================
// 뷰 3: 행운의 뽑기 (1. 학생 랜덤 뽑기 / 2. 학생 섞기·카드 뒤집기)
// ==========================================================================
function switchDrawMode(mode) {
  state.drawMode = mode;
  saveState();
  syncNavActiveState();

  document.getElementById('tab-draw-random').classList.toggle('active', mode === 'random');
  document.getElementById('tab-draw-flip').classList.toggle('active', mode === 'flip');
  document.getElementById('subview-draw-random').style.display = mode === 'random' ? 'block' : 'none';
  document.getElementById('subview-draw-flip').style.display = mode === 'flip' ? 'block' : 'none';

  if (mode === 'flip' && flipCardOrder.length === 0) {
    shuffleFlipCards(false);
  }
  renderLuckyDrawView();
}

function setDrawGenderFilter(gender) {
  state.drawGenderFilter = gender;
  saveState();
  document.querySelectorAll('.gender-seg-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gender === gender);
  });
  shuffleFlipCards(false);
  renderLuckyDrawView();
}

function getEligibleDrawStudents() {
  const cls = getCurrentClass();
  return cls.students.filter(s => {
    if (state.drawGenderFilter === 'F') return s.gender === 'F';
    if (state.drawGenderFilter === 'M') return s.gender === 'M';
    return true;
  });
}

function renderLuckyDrawView() {
  const cls = getCurrentClass();
  const eligible = getEligibleDrawStudents();
  const pickedSet = new Set(cls.pickedIds || []);
  const remaining = eligible.filter(s => !pickedSet.has(s.id));

  const remainText = document.getElementById('draw-remain-text');
  if (remainText) {
    remainText.textContent = `${remaining.length} / ${eligible.length}`;
  }

  if (state.drawMode === 'flip') {
    renderFlipCardsGrid();
  }
}

function resetDrawPool() {
  const cls = getCurrentClass();
  cls.pickedIds = [];
  lastPickedStudents = [];
  playSound('flip');
  saveState();
  renderLuckyDrawView();

  const stage = document.getElementById('picked-winners-stage');
  if (stage) {
    stage.innerHTML = `
      <div style="text-align:center; color:#fde047;">
        <div style="font-size:3.5rem; margin-bottom:10px;">🔄</div>
        <h3 class="font-display" style="font-size:1.6rem;">뽑기 대상이 모두 초기화되었습니다!</h3>
        <p style="color:#cbd5e1; margin-top:6px;">이제 모든 학생이 다시 공평하게 뽑기 대상에 포함됩니다.</p>
      </div>
    `;
  }
}

// 1~9명 랜덤 뽑기 실행 (슬롯머신 연출 + 중복 방지 + 즉시 카드 부여 연동)
function startRandomPick(count) {
  const cls = getCurrentClass();
  const eligible = getEligibleDrawStudents();

  if (eligible.length === 0) {
    alert('현재 성별 조건에 해당하는 학생이 없습니다!');
    return;
  }

  const pickCount = Math.min(count, eligible.length);
  if (!Array.isArray(cls.pickedIds)) cls.pickedIds = [];

  let unpicked = eligible.filter(s => !cls.pickedIds.includes(s.id));
  const winners = [];

  if (unpicked.length >= pickCount) {
    // 남은 인원에서 충분히 뽑을 수 있는 경우
    const shuffled = [...unpicked].sort(() => Math.random() - 0.5);
    winners.push(...shuffled.slice(0, pickCount));
    winners.forEach(w => cls.pickedIds.push(w.id));
  } else {
    // 남은 인원을 먼저 모두 뽑고, 풀을 초기화한 뒤 부족한 인원만큼 추가 뽑기
    winners.push(...unpicked);
    const needed = pickCount - winners.length;
    cls.pickedIds = winners.map(w => w.id);
    const freshPool = eligible.filter(s => !cls.pickedIds.includes(s.id)).sort(() => Math.random() - 0.5);
    const extra = freshPool.slice(0, needed);
    winners.push(...extra);
    extra.forEach(w => cls.pickedIds.push(w.id));
  }

  lastPickedStudents = winners;
  saveState();

  // 슬롯머신 롤링 연출
  const stage = document.getElementById('picked-winners-stage');
  let ticks = 0;
  const maxTicks = 8;

  const timer = setInterval(() => {
    ticks++;
    playSound('tick');
    const previewNames = Array.from({ length: pickCount }, () => {
      const rnd = eligible[Math.floor(Math.random() * eligible.length)];
      return rnd.name;
    });

    stage.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:3rem; margin-bottom:12px;">🎰</div>
        <div class="font-display" style="font-size:2.4rem; color:#fde047; letter-spacing:2px;">
          ${previewNames.join(' · ')}
        </div>
        <p style="color:#94a3b8; margin-top:8px;">두구두구... 행운의 주인공을 뽑는 중입니다!</p>
      </div>
    `;

    if (ticks >= maxTicks) {
      clearInterval(timer);
      playSound('fanfare');
      launchConfetti('eussuk');
      renderPickedWinners(winners);
      renderLuckyDrawView();
    }
  }, 65);
}

function renderPickedWinners(winners) {
  const stage = document.getElementById('picked-winners-stage');
  if (!stage) return;

  stage.innerHTML = `
    <div class="winners-grid">
      ${winners
        .map(
          w => `
        <div class="winner-spotlight-card">
          <div class="clover-crown">🍀</div>
          <div><span class="winner-num">${w.number}번</span></div>
          <div class="winner-name">${escapeHtml(w.name)}</div>
          <div style="font-size:0.82rem; color:#cbd5e1; margin-bottom:12px;">
            현재 쑥쑥점수: <strong style="color:#4ade80;">${(w.visibleEussuk || 0) - (w.visibleMeossuk || 0)}점</strong>
          </div>
          <div class="winner-individual-actions">
            <button class="btn btn-eussuk" style="padding:6px 10px; font-size:0.78rem;" onclick="giveQuickRecentCardToStudent('${w.id}', 'eussuk')" title="최근 으쓱 항목 즉시 부여">
              ⭐ 으쓱
            </button>
            <button class="btn btn-meossuk" style="padding:6px 10px; font-size:0.78rem;" onclick="giveQuickRecentCardToStudent('${w.id}', 'meossuk')" title="최근 머쓱 항목 즉시 부여">
              🌧️ 머쓱
            </button>
            <button class="btn btn-secondary" style="padding:6px 10px; font-size:0.78rem; background:rgba(255,255,255,0.18); color:#ffffff; border:1px solid rgba(255,255,255,0.35);" onclick="openGiveCardModalForSingle('${w.id}')" title="쑥쑥카드 목록에서 직접 선택하여 부여">
              🌱 카드선택
            </button>
          </div>
        </div>
      `
        )
        .join('')}
    </div>

    <div style="display:flex; gap:12px; flex-wrap:wrap; justify-content:center; align-items:center;">
      <button class="btn btn-gold" style="font-size:1rem; padding:11px 20px;" onclick="giveQuickRecentCards(lastPickedStudents.map(s => s.id), 'eussuk')" title="뽑힌 학생 전원에게 최근 으쓱 즉시 부여">
        ⭐ 최근 으쓱
      </button>
      <button class="btn btn-meossuk" style="font-size:1rem; padding:11px 20px;" onclick="giveQuickRecentCards(lastPickedStudents.map(s => s.id), 'meossuk')" title="뽑힌 학생 전원에게 최근 머쓱 즉시 부여">
        🌧️ 최근 머쓱
      </button>
      <button class="btn btn-green" style="font-size:1rem; padding:11px 20px;" onclick="openGiveCardModalWithTargets(lastPickedStudents.map(s => s.id), 'eussuk')" title="뽑힌 학생 전원에게 쑥쑥카드 목록에서 선택하여 부여">
        🌱 카드 선택
      </button>
      <button class="btn btn-secondary" style="font-size:1rem; padding:11px 20px;" onclick="startRandomPick(${winners.length})" title="같은 인원수만큼 다시 뽑기">
        🎲 다시 뽑기
      </button>
    </div>
  `;
}

// 모드 2: 학생 섞기 / 카드 뒤집기 (뒤집힌 학생 즉시 으쓱/머쓱 부여 포함!)
function shuffleFlipCards(withSound = true) {
  const eligible = getEligibleDrawStudents();
  const shuffled = [...eligible].sort(() => Math.random() - 0.5);
  flipCardOrder = shuffled.map((stu, idx) => ({
    order: idx + 1,
    studentId: stu.id,
    flipped: false
  }));
  if (withSound) playSound('flip');
  renderFlipCardsGrid();
}

function renderFlipCardsGrid() {
  const grid = document.getElementById('flip-cards-grid');
  if (!grid) return;

  const cls = getCurrentClass();
  if (flipCardOrder.length === 0 && cls.students.length > 0) {
    shuffleFlipCards(false);
    return;
  }

  grid.innerHTML = flipCardOrder
    .map((slot, idx) => {
      const stu = cls.students.find(s => s.id === slot.studentId);
      if (!stu) return '';
      const ssuk = (stu.visibleEussuk || 0) - (stu.visibleMeossuk || 0);

      return `
        <div class="flip-card-slot ${slot.flipped ? 'flipped' : ''}" onclick="toggleSingleFlipCard(${idx})">
          <div class="flip-card-inner">
            <!-- 뒷면 (덮인 상태) -->
            <div class="flip-card-front">
              <span class="card-order-badge">순서 ${slot.order}</span>
              <div class="clover-back-icon">🍀</div>
              <div class="font-display" style="font-size:1.05rem; color:#ffffff; margin-top:8px;">클릭해 뒤집기</div>
            </div>

            <!-- 앞면 (뒤집혀서 공개된 상태 + 즉시 으쓱/머쓱 버튼!) -->
            <div class="flip-card-back">
              <div class="flip-back-header">
                <span>#${slot.order}번째</span>
                <span>${stu.number}번 · 🌱${ssuk}점</span>
              </div>
              <div class="flip-student-name">${escapeHtml(stu.name)}</div>
              <div class="flip-reward-actions" onclick="event.stopPropagation();">
                <button class="flip-reward-btn eussuk" onclick="giveQuickRecentCardToStudent('${stu.id}', 'eussuk')" title="최근 으쓱 항목으로 즉시 1장 부여">
                  ⭐ 으쓱
                </button>
                <button class="flip-reward-btn meossuk" onclick="giveQuickRecentCardToStudent('${stu.id}', 'meossuk')" title="최근 머쓱 항목으로 즉시 1장 부여">
                  🌧️ 머쓱
                </button>
                <button class="flip-reward-btn select" onclick="openGiveCardModalForSingle('${stu.id}')" title="쑥쑥카드 목록에서 직접 선택하여 부여">
                  🌱 선택
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function toggleSingleFlipCard(index) {
  if (!flipCardOrder[index]) return;
  flipCardOrder[index].flipped = !flipCardOrder[index].flipped;
  playSound('flip');
  renderFlipCardsGrid();
}

function flipAllCards(flippedState) {
  flipCardOrder.forEach(slot => {
    slot.flipped = flippedState;
  });
  playSound('fanfare');
  renderFlipCardsGrid();
}

function giveCardToFlippedStudents(mode = 'eussuk') {
  const flippedIds = flipCardOrder.filter(slot => slot.flipped).map(slot => slot.studentId);
  if (flippedIds.length === 0) {
    alert('먼저 카드를 한 장 이상 클릭해 뒤집어 주세요!');
    return;
  }
  giveQuickRecentCards(flippedIds, mode);
}

// 뒤집힌 학생 전원에게 카드 선택 모달을 띄워 부여
function openGiveCardModalToFlipped() {
  const flippedIds = flipCardOrder.filter(slot => slot.flipped).map(slot => slot.studentId);
  if (flippedIds.length === 0) {
    alert('먼저 카드를 한 장 이상 클릭해 뒤집어 주세요!');
    return;
  }
  openGiveCardModalWithTargets(flippedIds, 'eussuk');
}

// ==========================================================================
// 뷰 4: 학급별 진도표 (체크리스트 + 진도 기록장 통합형)
// ==========================================================================
function renderProgressView() {
  const currentCls = getCurrentClass();
  const visibleClasses = getVisibleClasses();
  const totalSyllabus = state.syllabus.length;

  // 1. 전 학급 진도율 요약 카드 렌더링 (숨김 처리되지 않은 학급만 표시)
  const overviewEl = document.getElementById('progress-overview-cards');
  overviewEl.innerHTML = visibleClasses
    .map(cls => {
      const completedCount = state.syllabus.filter(s => cls.progressRecords?.[s.id]?.completed).length;
      const percent = totalSyllabus > 0 ? Math.round((completedCount / totalSyllabus) * 100) : 0;

      // 가장 최근 완료한 차시 찾기
      const lastCompleted = [...state.syllabus].reverse().find(s => cls.progressRecords?.[s.id]?.completed);

      return `
        <div class="class-progress-card ${cls.id === currentCls.id ? 'active-class' : ''}" onclick="handleClassChange('${cls.id}')">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong class="font-display" style="font-size:1.25rem;">🏫 ${escapeHtml(cls.name)}</strong>
            <span style="font-weight:900; color:var(--eussuk-blue);">${percent}% (${completedCount}/${totalSyllabus})</span>
          </div>
          <div class="progress-bar-track">
            <div class="progress-bar-fill" style="width:${percent}%;"></div>
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">
            최근 완료: <strong>${lastCompleted ? `${escapeHtml(lastCompleted.order)} ${escapeHtml(lastCompleted.title)}` : '아직 완료 차시 없음'}</strong>
          </div>
        </div>
      `;
    })
    .join('');

  // 2. 전 학급 비교 매트릭스 렌더링
  const matrixEl = document.getElementById('progress-matrix-container');
  matrixEl.style.display = state.showProgressMatrix ? 'block' : 'none';
  if (state.showProgressMatrix) {
    matrixEl.innerHTML = `
      <div style="padding:14px 20px; border-bottom:1px solid var(--border-color); font-weight:800;">
        📊 전 학급 단원/차시 완료 한눈에 비교 표 (칸을 클릭하면 즉시 완료 체크/해제됩니다)
      </div>
      <table class="syllabus-table">
        <thead>
          <tr>
            <th>차시</th>
            <th>단원 / 수업 주제</th>
            ${visibleClasses.map(c => `<th style="text-align:center;">${escapeHtml(c.name)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${state.syllabus
            .map(
              syl => `
            <tr>
              <td style="font-weight:800;">${escapeHtml(syl.order)}</td>
              <td style="font-weight:700;">${escapeHtml(syl.title)}</td>
              ${visibleClasses
                .map(c => {
                  const done = !!c.progressRecords?.[syl.id]?.completed;
                  const dateStr = c.progressRecords?.[syl.id]?.date || '';
                  return `
                    <td style="text-align:center; cursor:pointer;" onclick="toggleClassSyllabusCheck('${c.id}', '${syl.id}')">
                      <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-weight:800; font-size:0.82rem; background:${done ? 'rgba(16,185,129,0.18)' : 'var(--surface-subtle)'}; color:${done ? 'var(--primary-green-dark)' : 'var(--text-muted)'};">
                        ${done ? `✔ 완료 ${dateStr ? `(${dateStr.slice(5)})` : ''}` : '미완료'}
                      </span>
                    </td>
                  `;
                })
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  // 3. 현재 선택 학급 상세 진도 기록장 테이블 렌더링
  document.getElementById('progress-current-class-heading').textContent = `📝 [${currentCls.name}] 차시별 진도 체크 & 수업 기록장`;
  const tbody = document.getElementById('syllabus-table-body');

  if (!currentCls.progressRecords) currentCls.progressRecords = {};

  tbody.innerHTML = state.syllabus
    .map(syl => {
      const rec = currentCls.progressRecords[syl.id] || { completed: false, date: '', note: '', nextTodo: '' };
      return `
        <tr class="syllabus-row ${rec.completed ? 'completed' : ''}">
          <td style="text-align:center;">
            <button class="check-circle-btn ${rec.completed ? 'checked' : ''}" style="margin:0 auto;" onclick="toggleClassSyllabusCheck('${currentCls.id}', '${syl.id}')">
              ✔
            </button>
          </td>
          <td style="font-weight:800; color:var(--eussuk-blue);">${escapeHtml(syl.order)}</td>
          <td style="font-weight:800;">${escapeHtml(syl.title)}</td>
          <td>
            <input type="date" class="inline-input" value="${escapeHtml(rec.date || '')}" onchange="updateProgressField('${syl.id}', 'date', this.value)" />
          </td>
          <td>
            <input type="text" class="inline-input" placeholder="수업 진도 내용, 학생 반응, 특이사항 메모" value="${escapeHtml(rec.note || '')}" onchange="updateProgressField('${syl.id}', 'note', this.value)" />
          </td>
          <td>
            <input type="text" class="inline-input" placeholder="다음 시간 할 일 / 준비물 / 과제" value="${escapeHtml(rec.nextTodo || '')}" onchange="updateProgressField('${syl.id}', 'nextTodo', this.value)" />
          </td>
        </tr>
      `;
    })
    .join('');
}

function toggleProgressMatrixMode() {
  state.showProgressMatrix = !state.showProgressMatrix;
  saveState();
  renderProgressView();
}

function toggleClassSyllabusCheck(classId, syllabusId) {
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return;
  if (!cls.progressRecords) cls.progressRecords = {};
  const prev = cls.progressRecords[syllabusId] || { completed: false, date: '', note: '', nextTodo: '' };
  const nextCompleted = !prev.completed;
  const todayStr = new Date().toISOString().slice(0, 10);

  cls.progressRecords[syllabusId] = {
    ...prev,
    completed: nextCompleted,
    date: nextCompleted && !prev.date ? todayStr : prev.date
  };

  playSound(nextCompleted ? 'eussuk' : 'tick');
  saveState();
  renderProgressView();
}

function updateProgressField(syllabusId, field, value) {
  const cls = getCurrentClass();
  if (!cls.progressRecords) cls.progressRecords = {};
  if (!cls.progressRecords[syllabusId]) {
    cls.progressRecords[syllabusId] = { completed: false, date: '', note: '', nextTodo: '' };
  }
  cls.progressRecords[syllabusId][field] = value;
  saveState();
}

function addSingleSyllabusItemQuick() {
  const nextNum = state.syllabus.length + 1;
  const title = prompt(`${nextNum}차시 수업 단원/주제를 입력해 주세요:`, '');
  if (!title || !title.trim()) return;
  state.syllabus.push({
    id: `syl_${Date.now()}`,
    order: `${nextNum}차시`,
    title: title.trim()
  });
  saveState();
  renderProgressView();
}

function openSyllabusManageModal() {
  const text = state.syllabus.map(s => `${s.order} | ${s.title}`).join('\n');
  document.getElementById('syllabus-bulk-textarea').value = text;
  openModal('modal-syllabus-manage');
}

function saveSyllabusBulk() {
  const raw = document.getElementById('syllabus-bulk-textarea').value;
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    alert('최소 1개 이상의 차시를 입력해 주세요.');
    return;
  }

  state.syllabus = lines.map((line, idx) => {
    const existing = state.syllabus[idx];
    const id = existing ? existing.id : `syl_${Date.now()}_${idx}`;
    if (line.includes('|')) {
      const parts = line.split('|');
      return { id, order: parts[0].trim(), title: parts.slice(1).join('|').trim() };
    }
    return { id, order: `${idx + 1}차시`, title: line };
  });

  saveState();
  closeModal('modal-syllabus-manage');
  renderProgressView();
}

// ==========================================================================
// 뷰 5: 상세 리포트 & 도넛 차트 & 엑셀(CSV) 다운로드
// ==========================================================================
function renderReportView() {
  const cls = getCurrentClass();
  const listEl = document.getElementById('report-student-list');
  const mainEl = document.getElementById('report-main-panel');

  // 좌측 사이드바 렌더링
  listEl.innerHTML = `
    <div class="report-student-item ${currentReportTarget === 'ALL' ? 'active' : ''}" onclick="selectReportTarget('ALL')">
      <span>🏫 <strong>${escapeHtml(cls.name)} 전체 통계</strong></span>
      <span>🥚 ${calculateTotalEggs(cls)}</span>
    </div>
    <div style="height:1px; background:var(--border-color); margin:8px 0;"></div>
    ${cls.students
      .map(s => {
        const ssuk = (s.visibleEussuk || 0) - (s.visibleMeossuk || 0);
        return `
          <div class="report-student-item ${currentReportTarget === s.id ? 'active' : ''}" onclick="selectReportTarget('${s.id}')">
            <span>${s.number}번 ${escapeHtml(s.name)}</span>
            <span style="font-size:0.85rem;">🌱 ${ssuk} (⭐${s.visibleEussuk || 0}/🌧️${s.visibleMeossuk || 0})</span>
          </div>
        `;
      })
      .join('')}
  `;

  // 필터링된 히스토리
  const filteredHistory = currentReportTarget === 'ALL'
    ? cls.history
    : cls.history.filter(h => h.studentId === currentReportTarget);

  const totalEussuk = filteredHistory.filter(h => h.type === 'eussuk').reduce((a, h) => a + h.count, 0);
  const totalMeossuk = filteredHistory.filter(h => h.type === 'meossuk').reduce((a, h) => a + h.count, 0);
  const totalSsuk = totalEussuk - totalMeossuk;

  // 카테고리별 집계
  const eussukByCat = {};
  const meossukByCat = {};
  filteredHistory.forEach(h => {
    if (h.type === 'eussuk') {
      eussukByCat[h.category] = (eussukByCat[h.category] || 0) + h.count;
    } else {
      meossukByCat[h.category] = (meossukByCat[h.category] || 0) + h.count;
    }
  });

  // 가장 많이 받은 으쓱카드
  const bestCardEntry = Object.entries(eussukByCat).sort((a, b) => b[1] - a[1])[0];
  const bestCardText = bestCardEntry ? `${bestCardEntry[0]} (${bestCardEntry[1]}회)` : '아직 기록 없음';

  const targetTitle = currentReportTarget === 'ALL'
    ? `🏫 ${cls.name} 반 전체 누적 리포트`
    : (() => {
        const stu = cls.students.find(s => s.id === currentReportTarget);
        return stu ? `👤 ${stu.number}번 ${stu.name} 학생 상세 리포트` : '';
      })();

  // 중요 메모 필터링
  const importantMemos = filteredHistory.filter(h => h.important || h.memo);

  mainEl.innerHTML = `
    <!-- 상단 요약 카드 -->
    <div class="report-hero-card">
      <div>
        <h3 class="font-display" style="font-size:1.55rem; margin-bottom:6px;">${escapeHtml(targetTitle)}</h3>
        <div style="font-size:0.92rem; color:var(--text-secondary);">
          🌟 가장 돋보이는 강점(BEST 으쓱): <strong style="color:var(--eussuk-blue);">${escapeHtml(bestCardText)}</strong>
        </div>
      </div>

      <div class="equation-boxes">
        <div class="eq-badge eussuk">
          <span>⭐ 으쓱</span>
          <span class="eq-num">${totalEussuk}</span>
        </div>
        <strong style="font-size:1.5rem;">-</strong>
        <div class="eq-badge meossuk">
          <span>🌧️ 머쓱</span>
          <span class="eq-num">${totalMeossuk}</span>
        </div>
        <strong style="font-size:1.5rem;">=</strong>
        <div class="eq-badge ssukssuk">
          <span>🌱 누적 쑥쑥</span>
          <span class="eq-num">${totalSsuk}</span>
        </div>
      </div>
    </div>

    <!-- 카테고리별 통계 차트 -->
    <div class="charts-row">
      <div class="chart-box">
        <h4 style="font-weight:800; color:var(--eussuk-blue); margin-bottom:14px;">⭐ 카테고리별 으쓱 통계</h4>
        ${renderCategoryBars(eussukByCat, totalEussuk, 'eussuk')}
      </div>
      <div class="chart-box">
        <h4 style="font-weight:800; color:var(--meossuk-red); margin-bottom:14px;">🌧️ 카테고리별 머쓱 통계</h4>
        ${renderCategoryBars(meossukByCat, totalMeossuk, 'meossuk')}
      </div>
    </div>

    <!-- 중요 메모 및 전체 카드 이력 -->
    <div class="chart-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <h4 style="font-weight:800;">📌 메모 및 카드 부여 상세 이력 (${filteredHistory.length}건)</h4>
        ${
          filteredHistory.length > 0
            ? `<button class="btn-icon-pill" style="color:var(--meossuk-red); border-color:rgba(239,68,68,0.35);" onclick="clearReportHistory('${currentReportTarget}')">
                🗑️ ${currentReportTarget === 'ALL' ? '반 전체 상세 이력 모두 초기화' : '이 학생 상세 이력 모두 초기화'}
              </button>`
            : ''
        }
      </div>
      ${
        filteredHistory.length === 0
          ? `<div style="padding:24px; text-align:center; color:var(--text-muted);">아직 기록된 카드 부여 이력이 없습니다.</div>`
          : `<div style="display:flex; flex-direction:column; gap:10px; max-height:380px; overflow-y:auto;">
              ${filteredHistory
                .map(
                  h => `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-radius:14px; background:var(--surface-subtle); border-left:5px solid ${h.type === 'eussuk' ? 'var(--eussuk-blue)' : 'var(--meossuk-red)'};">
                  <div>
                    <div style="display:flex; align-items:center; gap:8px; font-weight:800;">
                      <span>${h.icon}</span>
                      <span>${h.studentNumber}번 ${escapeHtml(h.studentName)}</span>
                      <span style="font-size:0.8rem; padding:2px 8px; border-radius:999px; background:${h.type === 'eussuk' ? 'rgba(37,99,235,0.12)' : 'rgba(239,68,68,0.12)'}; color:${h.type === 'eussuk' ? 'var(--eussuk-blue)' : 'var(--meossuk-red)'};">
                        ${escapeHtml(h.category)} (${h.type === 'eussuk' ? `+${h.count}` : `-${h.count}`})
                      </span>
                      ${h.important ? `<span style="background:#fef08a; color:#854d0e; font-size:0.75rem; padding:2px 8px; border-radius:999px;">★ 중요메모</span>` : ''}
                    </div>
                    <div style="font-size:0.9rem; margin-top:4px;">${escapeHtml(h.cardTitle)}</div>
                    ${h.memo ? `<div style="font-size:0.86rem; color:var(--eussuk-blue); font-weight:700; margin-top:4px;">💬 메모: ${escapeHtml(h.memo)}</div>` : ''}
                  </div>
                  <div style="display:flex; align-items:center; gap:12px;">
                    <span style="font-size:0.78rem; color:var(--text-muted);">${h.timestamp}</span>
                    <button class="btn-icon-pill" onclick="deleteHistoryItem('${h.id}')" title="이 기록 삭제">🗑️</button>
                  </div>
                </div>
              `
                )
                .join('')}
            </div>`
      }
    </div>
  `;
}

function renderCategoryBars(catObj, total, mode) {
  const entries = Object.entries(catObj).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return `<div style="padding:20px; text-align:center; color:var(--text-muted);">기록이 없습니다.</div>`;
  }
  const barColor = mode === 'eussuk' ? 'linear-gradient(90deg, #3b82f6, #10b981)' : 'linear-gradient(90deg, #f87171, #dc2626)';
  return `
    <div style="display:flex; flex-direction:column; gap:10px;">
      ${entries
        .map(([cat, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.88rem; font-weight:800; margin-bottom:4px;">
                <span>${escapeHtml(cat)}</span>
                <span>${count}회 (${pct}%)</span>
              </div>
              <div class="progress-bar-track" style="margin:0; height:10px;">
                <div class="progress-bar-fill" style="width:${pct}%; background:${barColor};"></div>
              </div>
            </div>
          `;
        })
        .join('')}
    </div>
  `;
}

function selectReportTarget(target) {
  currentReportTarget = target;
  renderReportView();
}

// ==========================================================================
// 카드 부여 취소 (Undo) 및 이력 삭제/롤백 시스템
// ==========================================================================
function updateUndoButtonUI() {
  const btn = document.getElementById('btn-undo-action');
  if (!btn) return;
  const cls = getCurrentClass();
  const hasHistory = cls && cls.history && cls.history.length > 0;
  if (hasHistory) {
    btn.style.display = 'inline-flex';
    const topItem = cls.history[0];
    btn.title = `최근 부여 카드 취소: [${topItem.studentName}] ${topItem.category || ''} (단축키: Ctrl + Z)`;
  } else {
    btn.style.display = 'none';
  }
}

function showUndoToast(text, icon = '⭐') {
  const toast = document.getElementById('undo-toast');
  const iconEl = document.getElementById('undo-toast-icon');
  const textEl = document.getElementById('undo-toast-text');
  if (!toast) return;

  if (iconEl) iconEl.textContent = icon;
  if (textEl) textEl.textContent = text;

  toast.classList.add('show');

  if (undoToastTimer) clearTimeout(undoToastTimer);
  undoToastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 6000);
}

function hideUndoToast() {
  const toast = document.getElementById('undo-toast');
  if (toast) toast.classList.remove('show');
  if (undoToastTimer) clearTimeout(undoToastTimer);
}

// 1. 최근 부여 카드 1회 실행 취소 (Undo / Ctrl + Z) - 단일 및 전원 일괄 모두 완벽 롤백
function undoLastRewardAction() {
  const cls = getCurrentClass();
  if (!cls || !cls.history || cls.history.length === 0) {
    alert('취소할 카드 부여 이력이 없습니다.');
    return;
  }

  // 대상 batchId 결정 (직전 액션의 batchId 또는 최상단 항목의 batchId/id)
  let targetBatchId = lastActionBatchId;
  if (!targetBatchId) {
    targetBatchId = cls.history[0].batchId || cls.history[0].id;
  }

  // 동일한 부여 작업으로 묶인 모든 레코드 추출 (전원 일괄 부여 시 한 번에 롤백)
  let itemsToUndo = cls.history.filter(h => h.batchId && h.batchId === targetBatchId);
  if (itemsToUndo.length === 0) {
    itemsToUndo = [cls.history[0]];
  }

  // 학생 점수 & 학급 전체 점수 & 황금알 온도계 롤백
  itemsToUndo.forEach(item => {
    const stu = cls.students.find(s => s.id === item.studentId);
    const count = item.count || 1;
    if (stu) {
      if (item.type === 'eussuk') {
        stu.visibleEussuk = Math.max(0, (stu.visibleEussuk || 0) - count);
      } else {
        stu.visibleMeossuk = Math.max(0, (stu.visibleMeossuk || 0) - count);
      }
    }

    if (item.type === 'eussuk') {
      cls.visibleClassEussuk = Math.max(0, (cls.visibleClassEussuk || 0) - count);
    } else {
      cls.visibleClassMeossuk = Math.max(0, (cls.visibleClassMeossuk || 0) - count);
    }
  });

  // history 목록에서 롤백된 항목 제거
  const undoIds = new Set(itemsToUndo.map(i => i.id));
  cls.history = cls.history.filter(h => !undoIds.has(h.id));

  // 다음 실행 취소를 위해 직전 batchId 갱신
  lastActionBatchId = cls.history.length > 0 ? (cls.history[0].batchId || cls.history[0].id) : null;

  saveState();
  hideUndoToast();
  playSound('tick');
  renderCurrentView();

  if (state.currentView === 'luckydraw' && state.drawMode === 'random' && lastPickedStudents.length > 0) {
    renderPickedWinners(lastPickedStudents);
  }

  updateUndoButtonUI();

  const undoneNames = itemsToUndo.length === 1
    ? `${itemsToUndo[0].studentName}`
    : `${itemsToUndo[0].studentName} 외 ${itemsToUndo.length - 1}명`;
  const firstCard = itemsToUndo[0];
  const typeLabel = firstCard.type === 'eussuk' ? '으쓱' : '머쓱';
  alert(`↩️ [${undoneNames}] 학생의 "${firstCard.category || firstCard.cardTitle || '카드'}" (${typeLabel}) 부여가 성공적으로 취소되었습니다.`);
}

// 2. 리포트 상세 이력에서 특정 항목 1건 직접 취소/삭제 (점수 및 학급 온도계 동시 차감 복구)
function deleteHistoryItem(historyId) {
  const cls = getCurrentClass();
  const targetItem = cls.history.find(h => h.id === historyId);
  if (!targetItem) return;

  const typeLabel = targetItem.type === 'eussuk' ? '으쓱' : '머쓱';
  if (!confirm(`[${targetItem.studentNumber}번 ${targetItem.studentName}] 학생의 "${targetItem.category || targetItem.cardTitle}" (${typeLabel} ${targetItem.count}장) 기록을 취소/삭제하시겠습니까?\n\n* 학생 점수 및 학급 온도계 점수도 즉시 차감 복구됩니다.`)) {
    return;
  }

  // 점수 롤백
  const stu = cls.students.find(s => s.id === targetItem.studentId);
  const count = targetItem.count || 1;
  if (stu) {
    if (targetItem.type === 'eussuk') {
      stu.visibleEussuk = Math.max(0, (stu.visibleEussuk || 0) - count);
    } else {
      stu.visibleMeossuk = Math.max(0, (stu.visibleMeossuk || 0) - count);
    }
  }

  if (targetItem.type === 'eussuk') {
    cls.visibleClassEussuk = Math.max(0, (cls.visibleClassEussuk || 0) - count);
  } else {
    cls.visibleClassMeossuk = Math.max(0, (cls.visibleClassMeossuk || 0) - count);
  }

  // 이력에서 삭제
  cls.history = cls.history.filter(h => h.id !== historyId);
  saveState();
  playSound('tick');
  renderCurrentView();
  updateUndoButtonUI();
}

function clearReportHistory(target = 'ALL') {
  const cls = getCurrentClass();
  if (!cls.history || cls.history.length === 0) {
    alert('초기화할 상세 이력이 없습니다.');
    return;
  }

  if (target === 'ALL') {
    if (!confirm(`[${cls.name}]의 상세 리포트 이력(${cls.history.length}건)을 한 번에 모두 초기화하시겠습니까?\n(초기화된 상세 이력은 복구할 수 없습니다.)`)) {
      return;
    }
    cls.history = [];
  } else {
    const stu = cls.students.find(s => s.id === target);
    const stuName = stu ? `${stu.number}번 ${stu.name}` : '선택한 학생';
    if (!confirm(`[${stuName}]의 상세 리포트 이력을 모두 초기화하시겠습니까?`)) {
      return;
    }
    cls.history = cls.history.filter(h => h.studentId !== target);
  }

  playSound('flip');
  saveState();
  renderCurrentView();
}

// ==========================================================================
// 모달 2: 학급 생성 & 명렬 붙여넣기 & 성별 일괄 설정
// ==========================================================================
function openClassSetupModal(mode = 'edit') {
  classSetupMode = mode;
  const titleEl = document.getElementById('class-setup-modal-title');
  const deleteBtn = document.getElementById('btn-delete-class');

  if (mode === 'new') {
    titleEl.textContent = '➕ 새 학급 추가 & 명렬 붙여넣기';
    document.getElementById('setup-class-name').value = '';
    document.getElementById('setup-class-grade').value = '중학교';
    document.getElementById('setup-roster-textarea').value = '';
    tempSetupStudents = [];
    deleteBtn.style.display = 'none';
  } else {
    const cls = getCurrentClass();
    titleEl.textContent = `📋 [${cls.name}] 명렬 붙여넣기 & 학생/성별 관리`;
    document.getElementById('setup-class-name').value = cls.name;
    document.getElementById('setup-class-grade').value = cls.grade || '';
    document.getElementById('setup-roster-textarea').value = '';
    tempSetupStudents = cls.students.map(s => ({ ...s }));
    deleteBtn.style.display = state.classes.length > 1 ? 'inline-flex' : 'none';
  }

  renderSetupStudentsList();
  openModal('modal-class-setup');
}

// 명렬 텍스트 스마트 파서 (번호, 이름, 성별 자동 분리)
function parseRosterText(rawText) {
  const lines = rawText
    .split(/[\r\n,]+/)
    .map(l => l.trim())
    .filter(Boolean);

  return lines.map((line, idx) => {
    let cleaned = line.replace(/^\d+[\.\)\-\s\t]+/, '').trim();
    let gender = 'F';

    if (/\((남|남자|M)\)|\s+(남|남자|M)$/i.test(cleaned)) {
      gender = 'M';
      cleaned = cleaned.replace(/\((남|남자|M)\)|\s+(남|남자|M)$/i, '').trim();
    } else if (/\((여|여자|F)\)|\s+(여|여자|F)$/i.test(cleaned)) {
      gender = 'F';
      cleaned = cleaned.replace(/\((여|여자|F)\)|\s+(여|여자|F)$/i, '').trim();
    }

    return {
      id: `stu_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
      number: idx + 1,
      name: cleaned || `학생${idx + 1}`,
      gender,
      visibleEussuk: 0,
      visibleMeossuk: 0
    };
  });
}

function applyRosterPaste(mode = 'replace') {
  const raw = document.getElementById('setup-roster-textarea').value.trim();
  if (!raw) {
    alert('붙여넣을 학생 이름 목록을 입력창에 입력해 주세요!');
    return;
  }

  const parsed = parseRosterText(raw);
  if (mode === 'replace') {
    tempSetupStudents = parsed;
  } else {
    const startNum = tempSetupStudents.length + 1;
    parsed.forEach((p, idx) => {
      p.number = startNum + idx;
      tempSetupStudents.push(p);
    });
  }

  document.getElementById('setup-roster-textarea').value = '';
  playSound('eussuk');
  renderSetupStudentsList();
}

function fillSampleRoster() {
  document.getElementById('setup-roster-textarea').value = [
    '김민지', '이서연', '박지우', '최수빈', '정하윤',
    '강서현', '조민서', '윤채원', '장지유', '임수아',
    '한지민', '오예은', '서다은', '신유나', '권소율'
  ].join('\n');
}

function renderSetupStudentsList() {
  document.getElementById('setup-student-count').textContent = tempSetupStudents.length;
  const listEl = document.getElementById('setup-students-list');

  listEl.innerHTML = tempSetupStudents
    .map(
      (s, idx) => `
      <div style="display:flex; align-items:center; gap:6px; background:var(--surface-subtle); padding:8px 10px; border-radius:12px; border:1px solid var(--border-color);">
        <strong style="width:28px; font-size:0.82rem;">${idx + 1}.</strong>
        <input type="text" class="inline-input" style="padding:5px 8px; font-weight:700;" value="${escapeHtml(s.name)}" onchange="updateTempStudentName(${idx}, this.value)" />
        <button class="btn-icon-pill" style="padding:4px 8px; background:${s.gender === 'F' ? '#fce7f3' : '#e0f2fe'}; color:${s.gender === 'F' ? '#be185d' : '#0369a1'}; border:none;" onclick="toggleTempStudentGender(${idx})">
          ${s.gender === 'F' ? '여' : '남'}
        </button>
        <button class="btn-icon-pill" style="padding:4px 6px;" onclick="removeTempStudent(${idx})" title="삭제">✖</button>
      </div>
    `
    )
    .join('');
}

function updateTempStudentName(idx, val) {
  if (tempSetupStudents[idx]) tempSetupStudents[idx].name = val.trim();
}

function toggleTempStudentGender(idx) {
  if (!tempSetupStudents[idx]) return;
  tempSetupStudents[idx].gender = tempSetupStudents[idx].gender === 'F' ? 'M' : 'F';
  renderSetupStudentsList();
}

function setAllStudentGender(gender) {
  tempSetupStudents.forEach(s => {
    s.gender = gender;
  });
  renderSetupStudentsList();
}

function removeTempStudent(idx) {
  tempSetupStudents.splice(idx, 1);
  tempSetupStudents.forEach((s, i) => {
    s.number = i + 1;
  });
  renderSetupStudentsList();
}

function addOneStudentRow() {
  tempSetupStudents.push({
    id: `stu_${Date.now()}_${tempSetupStudents.length}`,
    number: tempSetupStudents.length + 1,
    name: `새 학생 ${tempSetupStudents.length + 1}`,
    gender: 'F',
    visibleEussuk: 0,
    visibleMeossuk: 0
  });
  renderSetupStudentsList();
}

function saveClassSetup() {
  // 만약 텍스트 영역에 붙여넣고 아직 적용 버튼을 안 누른 텍스트가 있다면 자동 반영
  const pendingText = document.getElementById('setup-roster-textarea').value.trim();
  if (pendingText && tempSetupStudents.length === 0) {
    tempSetupStudents = parseRosterText(pendingText);
  }

  const name = document.getElementById('setup-class-name').value.trim() || '행복한 우리 반';
  const grade = document.getElementById('setup-class-grade').value.trim() || '';

  tempSetupStudents.forEach((s, i) => {
    s.number = i + 1;
  });

  if (classSetupMode === 'new') {
    const newId = `cls_${Date.now()}`;
    const newCls = {
      id: newId,
      name,
      grade,
      motto: '서로 존중하고 배려하는 행복한 우리 반!',
      goalEggs: 20,
      goalReward: '🎉 즐거운 특별 자유시간 & 간식 파티!',
      bonusEggs: 0,
      deductEggOnMeossuk: false,
      visibleClassEussuk: 0,
      visibleClassMeossuk: 0,
      students: tempSetupStudents,
      pickedIds: [],
      history: [],
      progressRecords: {}
    };
    state.classes.push(newCls);
    state.currentClassId = newId;
  } else {
    const cls = getCurrentClass();
    cls.name = name;
    cls.grade = grade;
    cls.students = tempSetupStudents;
  }

  saveState();
  shuffleFlipCards(false);
  closeModal('modal-class-setup');
  renderCurrentView();
}

function deleteCurrentClass() {
  if (state.classes.length <= 1) {
    alert('최소 1개의 학급은 유지되어야 합니다.');
    return;
  }
  const cls = getCurrentClass();
  if (!confirm(`정말 [${cls.name}] 학급을 삭제하시겠습니까?`)) return;

  state.classes = state.classes.filter(c => c.id !== cls.id);
  state.currentClassId = state.classes[0].id;
  saveState();
  closeModal('modal-class-setup');
  renderCurrentView();
}

// ==========================================================================
// 모달 8: 학급관리 (학급 추가 · 이름 수정 · 순서 바꾸기 · 숨기기)
// ==========================================================================
let draggedClassIdx = null;

function openClassListModal() {
  const input = document.getElementById('quick-new-class-names');
  if (input) input.value = '';
  renderClassListEditor();
  openModal('modal-class-list');
}

function renderClassListEditor() {
  const countEl = document.getElementById('class-list-total-count');
  const container = document.getElementById('class-list-editor-rows');
  if (!container) return;

  const hiddenCount = state.classes.filter(c => c.hidden).length;
  if (countEl) {
    countEl.textContent = hiddenCount > 0 ? `${state.classes.length}개 중 ${hiddenCount}개 숨김` : `${state.classes.length}`;
  }

  container.innerHTML = state.classes
    .map((cls, idx) => {
      const isCurrent = cls.id === state.currentClassId;
      const isHidden = !!cls.hidden;
      return `
        <div
          draggable="true"
          ondragstart="handleClassDragStart(event, ${idx})"
          ondragover="handleClassDragOver(event)"
          ondrop="handleClassDrop(event, ${idx})"
          style="display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:14px; opacity:${isHidden ? '0.62' : '1'}; background:${isCurrent ? 'rgba(37, 99, 235, 0.08)' : 'var(--surface-subtle)'}; border:2px solid ${isCurrent ? 'var(--eussuk-blue)' : 'var(--border-color)'}; cursor:grab;"
        >
          <span style="font-size:1.2rem; color:var(--text-muted); cursor:grab; padding:0 4px;" title="드래그하여 학급 순서 변경">⠿</span>
          <strong style="width:24px; text-align:center; color:var(--text-secondary);">${idx + 1}</strong>

          <div style="flex:1; display:grid; grid-template-columns: 1.3fr 1fr; gap:8px;">
            <input
              type="text"
              class="inline-input"
              style="font-weight:800; font-size:0.98rem;"
              value="${escapeHtml(cls.name)}"
              placeholder="학급 이름 (예: 2학년 1반)"
              oninput="updateClassNameDirect('${cls.id}', this.value)"
            />
            <input
              type="text"
              class="inline-input"
              style="font-size:0.88rem;"
              value="${escapeHtml(cls.grade || '')}"
              placeholder="학년/과목 메모 (선택)"
              oninput="updateClassGradeDirect('${cls.id}', this.value)"
            />
          </div>

          <span style="font-size:0.82rem; font-weight:700; color:var(--text-secondary); min-width:52px; text-align:right;">
            👥 ${cls.students.length}명
          </span>

          <div style="display:flex; align-items:center; gap:5px;">
            <button
              class="btn-icon-pill"
              style="padding:6px 10px; background:${isHidden ? 'rgba(148,163,184,0.2)' : 'rgba(16,185,129,0.14)'}; color:${isHidden ? 'var(--text-secondary)' : 'var(--primary-green-dark)'}; border:none;"
              onclick="toggleClassHidden('${cls.id}')"
              title="${isHidden ? '숨김 해제하여 학급 목록에 다시 표시' : '이 학급을 목록에서 숨기기 (데이터는 보존됨)'}"
            >
              ${isHidden ? '🙈 숨김됨' : '👁️ 표시중'}
            </button>
            <button class="btn-icon-pill" style="padding:6px 8px;" onclick="moveClassOrder(${idx}, -1)" ${idx === 0 ? 'disabled style="opacity:0.35; padding:6px 8px;"' : ''} title="위로 이동">⬆️</button>
            <button class="btn-icon-pill" style="padding:6px 8px;" onclick="moveClassOrder(${idx}, 1)" ${idx === state.classes.length - 1 ? 'disabled style="opacity:0.35; padding:6px 8px;"' : ''} title="아래로 이동">⬇️</button>
            <button class="btn-icon-pill" onclick="openRosterForSpecificClass('${cls.id}')" title="이 학급의 학생 명렬 편집">📋 학생</button>
            <button class="btn-icon-pill" style="color:var(--meossuk-red);" onclick="deleteClassById('${cls.id}')" title="이 학급 영구 삭제">🗑️</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function handleClassDragStart(event, idx) {
  draggedClassIdx = idx;
  event.dataTransfer.effectAllowed = 'move';
}

function handleClassDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleClassDrop(event, targetIdx) {
  event.preventDefault();
  if (draggedClassIdx === null || draggedClassIdx === targetIdx) return;
  const [moved] = state.classes.splice(draggedClassIdx, 1);
  state.classes.splice(targetIdx, 0, moved);
  draggedClassIdx = null;
  playSound('tick');
  saveState();
  renderClassListEditor();
  renderCurrentView();
}

function toggleClassHidden(classId) {
  const target = state.classes.find(c => c.id === classId);
  if (!target) return;

  if (!target.hidden) {
    const visibleCount = state.classes.filter(c => !c.hidden).length;
    if (visibleCount <= 1) {
      alert('최소 1개의 학급은 화면에 표시되어야 합니다.');
      return;
    }
    target.hidden = true;
    if (state.currentClassId === classId) {
      const nextVisible = state.classes.find(c => !c.hidden);
      if (nextVisible) state.currentClassId = nextVisible.id;
    }
  } else {
    target.hidden = false;
  }

  playSound('tick');
  saveState();
  renderClassListEditor();
  renderCurrentView();
}

function updateClassNameDirect(classId, newName) {
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return;
  cls.name = newName.trim() || '이름 없는 학급';
  saveState();
  renderClassSelector();
  updateHeaderSummary();
}

function updateClassGradeDirect(classId, newGrade) {
  const cls = state.classes.find(c => c.id === classId);
  if (!cls) return;
  cls.grade = newGrade.trim();
  saveState();
}

function moveClassOrder(index, direction) {
  const targetIdx = index + direction;
  if (targetIdx < 0 || targetIdx >= state.classes.length) return;
  const temp = state.classes[index];
  state.classes[index] = state.classes[targetIdx];
  state.classes[targetIdx] = temp;
  playSound('tick');
  saveState();
  renderClassListEditor();
  renderCurrentView();
}

function addClassesQuick() {
  const input = document.getElementById('quick-new-class-names');
  const raw = input.value.trim();
  if (!raw) {
    alert('추가할 학급 이름을 입력해 주세요! (예: 2학년 3반, 2학년 4반)');
    return;
  }

  const names = raw.split(/[\r\n,]+/).map(n => n.trim()).filter(Boolean);
  names.forEach((name, idx) => {
    const newId = `cls_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 5)}`;
    state.classes.push({
      id: newId,
      name,
      grade: '',
      motto: '서로 존중하고 배려하는 행복한 우리 반!',
      goalEggs: 20,
      goalReward: '🎉 즐거운 특별 자유시간 & 간식 파티!',
      bonusEggs: 0,
      deductEggOnMeossuk: false,
      visibleClassEussuk: 0,
      visibleClassMeossuk: 0,
      students: [],
      pickedIds: [],
      history: [],
      progressRecords: {}
    });
  });

  input.value = '';
  playSound('eussuk');
  saveState();
  renderClassListEditor();
  renderCurrentView();
}

function openRosterForSpecificClass(classId) {
  state.currentClassId = classId;
  saveState();
  closeModal('modal-class-list');
  renderCurrentView();
  openClassSetupModal('edit');
}

function deleteClassById(classId) {
  if (state.classes.length <= 1) {
    alert('최소 1개의 학급은 유지되어야 합니다.');
    return;
  }
  const target = state.classes.find(c => c.id === classId);
  if (!target) return;
  if (!confirm(`정말 [${target.name}] 학급을 삭제하시겠습니까?`)) return;

  state.classes = state.classes.filter(c => c.id !== classId);
  if (state.currentClassId === classId) {
    state.currentClassId = state.classes[0].id;
  }
  saveState();
  renderClassListEditor();
  renderCurrentView();
}

function saveAndCloseClassListModal() {
  saveState();
  closeModal('modal-class-list');
  renderCurrentView();
}

// ==========================================================================
// 모달 4 & 5: 맞춤형 카드 관리 및 점수 초기화
// ==========================================================================
function openSettingsModal() {
  renderSettingsCardLists();
  openModal('modal-settings');
}

function renderSettingsCardLists() {
  const eList = document.getElementById('settings-eussuk-list');
  const mList = document.getElementById('settings-meossuk-list');

  eList.innerHTML = state.cards
    .filter(c => c.type === 'eussuk')
    .map(
      c => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface-subtle); padding:10px 14px; border-radius:12px;">
        <span><strong>${c.icon} ${c.category && c.category !== c.title ? `[${escapeHtml(c.category)}] ` : ''}${escapeHtml(c.title)}</strong></span>
        <button class="btn-icon-pill" onclick="deleteCustomCard('${c.id}')">✖</button>
      </div>
    `
    )
    .join('');

  mList.innerHTML = state.cards
    .filter(c => c.type === 'meossuk')
    .map(
      c => `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--surface-subtle); padding:10px 14px; border-radius:12px;">
        <span><strong>${c.icon} ${c.category && c.category !== c.title ? `[${escapeHtml(c.category)}] ` : ''}${escapeHtml(c.title)}</strong></span>
        <button class="btn-icon-pill" onclick="deleteCustomCard('${c.id}')">✖</button>
      </div>
    `
    )
    .join('');
}

function addCustomCard() {
  const type = document.getElementById('new-card-type').value;
  const icon = document.getElementById('new-card-icon').value;
  const title = document.getElementById('new-card-title').value.trim();
  const category = document.getElementById('new-card-category').value.trim() || title;

  if (!title) {
    alert('카드 문구를 입력해 주세요!');
    return;
  }

  state.cards.push({
    id: `c_${Date.now()}`,
    type,
    icon,
    category,
    title
  });

  document.getElementById('new-card-category').value = '';
  document.getElementById('new-card-title').value = '';
  saveState();
  renderSettingsCardLists();
  if (document.getElementById('modal-give-card').classList.contains('open')) {
    renderGiveCardsGrid();
  }
}

function deleteCustomCard(cardId) {
  state.cards = state.cards.filter(c => c.id !== cardId);
  saveState();
  renderSettingsCardLists();
}

function resetDefaultCards() {
  state.cards = getDefaultCards();
  saveState();
  renderSettingsCardLists();
}

function openResetScoresModal() {
  openModal('modal-reset-scores');
}

function resetVisibleScores(scope) {
  const cls = getCurrentClass();
  cls.students.forEach(s => {
    s.visibleEussuk = 0;
    s.visibleMeossuk = 0;
  });

  if (scope === 'all') {
    cls.visibleClassEussuk = 0;
    cls.visibleClassMeossuk = 0;
    cls.bonusEggs = 0;
  }

  playSound('flip');
  saveState();
  closeModal('modal-reset-scores');
  renderCurrentView();
}

// ==========================================================================
// 엑셀(CSV) 다운로드 3종 & JSON 파일 백업/복원
// ==========================================================================
function downloadCSVFile(filename, rows) {
  const BOM = '\uFEFF';
  const csvContent =
    BOM +
    rows
      .map(row =>
        row
          .map(cell => {
            const str = String(cell ?? '').replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(',')
      )
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportStudentSummaryCSV() {
  const cls = getCurrentClass();
  const rows = [['번호', '이름', '성별', '현재 으쓱점수', '현재 머쓱점수', '현재 쑥쑥점수', '누적 부여 횟수(리포트 기준)']];

  cls.students.forEach(s => {
    const ssuk = (s.visibleEussuk || 0) - (s.visibleMeossuk || 0);
    const totalHistoryCount = cls.history.filter(h => h.studentId === s.id).reduce((a, h) => a + h.count, 0);
    rows.push([s.number, s.name, s.gender === 'F' ? '여' : '남', s.visibleEussuk || 0, s.visibleMeossuk || 0, ssuk, totalHistoryCount]);
  });

  downloadCSVFile(`${cls.name}_학생별_점수요약.csv`, rows);
}

function exportFullHistoryCSV() {
  const cls = getCurrentClass();
  const rows = [['일시', '학급명', '번호', '학생이름', '구분', '카테고리', '카드내용', '수량', '중요메모여부', '메모내용']];

  cls.history.forEach(h => {
    rows.push([
      h.timestamp,
      cls.name,
      h.studentNumber,
      h.studentName,
      h.type === 'eussuk' ? '으쓱(칭찬)' : '머쓱(주의)',
      h.category,
      h.cardTitle,
      h.count,
      h.important ? '★중요' : '',
      h.memo || ''
    ]);
  });

  downloadCSVFile(`${cls.name}_상세리포트_이력.csv`, rows);
}

function exportProgressCSV() {
  const rows = [['학급명', '차시', '단원/수업주제', '완료여부', '수업날짜', '진도내용 및 특이사항 메모', '다음 시간 할 일']];

  state.classes.forEach(cls => {
    state.syllabus.forEach(syl => {
      const rec = cls.progressRecords?.[syl.id] || {};
      rows.push([
        cls.name,
        syl.order,
        syl.title,
        rec.completed ? '완료' : '미완료',
        rec.date || '',
        rec.note || '',
        rec.nextTodo || ''
      ]);
    });
  });

  downloadCSVFile(`전학급_통합진도표_${new Date().toISOString().slice(0, 10)}.csv`, rows);
}

function openBackupModal() {
  openModal('modal-backup');
}

function downloadBackupJSON() {
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Class123_Plus_백업_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function restoreBackupJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      if (!imported || !Array.isArray(imported.classes)) {
        throw new Error('올바른 백업 파일 형식이 아닙니다.');
      }
      state = imported;
      saveState();
      closeModal('modal-backup');
      initApp();
      alert('백업 데이터를 성공적으로 복원했습니다!');
    } catch (err) {
      alert('백업 파일 불러오기 실패: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// ==========================================================================
// 공통 유틸리티 (사운드/테마/깜깜이/모달/HTML 이스케이프)
// ==========================================================================
function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  updateTopControlsUI();
  if (state.soundEnabled) playSound('eussuk');
}

function toggleTheme() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle('theme-dark', state.darkMode);
  saveState();
  updateTopControlsUI();
}

function toggleBlackout(active) {
  document.getElementById('blackout-screen').classList.toggle('active', active);
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 전역 키보드 단축키 (Ctrl + Z 실행 취소)
window.addEventListener('keydown', e => {
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
    return; // 입력 필드 안에서의 텍스트 편집 단축키는 방해하지 않음
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undoLastRewardAction();
  }
});

// 앱 시작
document.addEventListener('DOMContentLoaded', initApp);
