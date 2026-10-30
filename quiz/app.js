// ============================================================================
// QUIZ QUEENS (퀴즈 퀸즈) - 서울문영여자중학교 (Seoul Moonyoung Girls' Middle School)
// Main Application Logic (app.js v1.1.0)
// ============================================================================

const ADMIN_EMAILS = ['tfellow@gmail.com', 'tfellow@smy.ms.kr'];
const ALLOWED_SCHOOL_DOMAIN = '@smy.ms.kr';
const GOOGLE_CLIENT_ID = '359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com';
const SUPABASE_URL = 'https://jkxdhyvnrvsiokbbbjtu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF';

let sbClient = null;
try {
  if (window.supabase && window.supabase.createClient) {
    sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {}

const STORAGE_KEYS = {
  CURRENT_USER: 'qq_current_user_v11',
  ALL_USERS: 'qq_all_users_v11',
  QUIZ_LOGS: 'qq_quiz_logs_v11',
  CUSTOM_QUESTIONS: 'qq_custom_questions_v11',
  GAS_URL: 'qq_gas_webapp_url_v11',
  SHOW_DEMO: 'qq_show_demo_v11',
  SOUND_ON: 'qq_sound_on_v11'
};

// 룰렛 7개 슬라이스 구성 (6대 분야 + 왕관 찬스)
const ROULETTE_SLICES = [
  ...CATEGORIES,
  {
    id: 'crown',
    name: '왕관 찬스',
    shortName: '왕관찬스',
    icon: '👑',
    color: '#F59E0B',
    lightColor: '#FEF3C7',
    mascotName: '로열 크라운',
    mascotEmoji: '👑'
  }
];

let state = {
  currentUser: null,
  allUsers: {},
  quizLogs: [], // { date: 'YYYY-MM-DD', email, classId, category, isCorrect }
  questions: [],
  gasUrl: '',
  showDemoData: true,
  soundEnabled: true,
  adminPeriod: 'all', // today, thisWeek, thisMonth, last7, last30, customDay, all
  adminSubTab: 'class',
  wheelRotation: 0,
  isSpinning: false,
  currentQuiz: {
    questionObj: null,
    categoryObj: null,
    timerId: null,
    timeLeft: 20,
    maxTime: 20,
    answered: false,
    used5050: false,
    usedTime: false,
    usedSkip: false
  },
  activeCertificateTarget: null
};

// ============================================================================
// 1. 날짜 유틸리티 & 연속 도전 일수(Streak) 계산
// ============================================================================
function getLocalDateStr(dateObj = new Date()) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateNDaysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return getLocalDateStr(d);
}

function getDayOfWeekKor(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()] || '';
}

function updateStreakOnQuizSolve(user) {
  const today = getLocalDateStr();
  const yesterday = getDateNDaysAgoStr(1);

  if (!Array.isArray(user.studyDates)) {
    user.studyDates = [];
  }
  if (!user.studyDates.includes(today)) {
    user.studyDates.push(today);
  }

  if (user.lastStudyDate === today) {
    // 오늘 이미 문제를 푼 경우 연속일 유지
    user.streakDays = Math.max(1, user.streakDays || 1);
  } else if (user.lastStudyDate === yesterday) {
    user.streakDays = (user.streakDays || 1) + 1;
  } else {
    user.streakDays = 1;
  }

  user.lastStudyDate = today;
  user.maxStreakDays = Math.max(user.maxStreakDays || 1, user.streakDays);
}

// ============================================================================
// 2. 효과음 합성기 (Web Audio API)
// ============================================================================
let audioCtx = null;
function playTone(freq, duration = 0.12, type = 'sine', volume = 0.12) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

function playSoundEffect(kind) {
  if (!state.soundEnabled) return;
  if (kind === 'spin') {
    [440, 523, 659, 784].forEach((f, idx) => setTimeout(() => playTone(f, 0.09, 'triangle', 0.1), idx * 70));
  } else if (kind === 'correct') {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => setTimeout(() => playTone(f, 0.15, 'sine', 0.15), idx * 80));
  } else if (kind === 'wrong') {
    [300, 240].forEach((f, idx) => setTimeout(() => playTone(f, 0.22, 'sawtooth', 0.1), idx * 140));
  } else if (kind === 'levelup') {
    [523, 659, 784, 987, 1046, 1318].forEach((f, idx) => setTimeout(() => playTone(f, 0.18, 'triangle', 0.16), idx * 90));
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  localStorage.setItem(STORAGE_KEYS.SOUND_ON, JSON.stringify(state.soundEnabled));
  const btn = document.getElementById('soundToggleBtn');
  if (btn) btn.textContent = state.soundEnabled ? '🔊' : '🔇';
  showToast(state.soundEnabled ? '🔊 효과음이 켜졌습니다.' : '🔇 효과음이 꺼졌습니다.');
}

// ============================================================================
// 3. 초기화 및 데모 데이터 (1-1 ~ 3-4 11개 학급 + 최근 30일 일별 로그)
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
  initSelectOptions();
  loadPersistentState();
  drawRouletteWheel();
  renderDirectCategoryChips();

  const customDateInput = document.getElementById('adminCustomDateInput');
  if (customDateInput) customDateInput.value = getLocalDateStr();

  initGoogleSignInButton();

  if (state.currentUser) {
    closeLoginModal();
    refreshAllUI();
  } else {
    openLoginModal();
  }

  if (state.gasUrl) {
    syncWithGoogleSheets(false);
  }
});

function initSelectOptions() {
  const loginClassSelect = document.getElementById('loginClass');
  const rankClassSelect = document.getElementById('studentRankClassFilter');
  const adminClassSelect = document.getElementById('adminStudentClassFilter');

  if (loginClassSelect) {
    loginClassSelect.innerHTML = SCHOOL_CLASSES.map(
      c => `<option value="${c.classId}" ${c.classId === '2-2' ? 'selected' : ''}>${c.classId} (${c.grade}학년 ${c.classNo}반)</option>`
    ).join('');
  }

  const filterHtml =
    `<option value="all">전체 학급 (1-1 ~ 3-4)</option>` +
    SCHOOL_CLASSES.map(c => `<option value="${c.classId}">${c.classId}</option>`).join('');

  if (rankClassSelect) rankClassSelect.innerHTML = filterHtml;
  if (adminClassSelect) adminClassSelect.innerHTML = filterHtml;
}

function createEmptyCategoryStats() {
  const catStats = {};
  CATEGORIES.forEach(c => {
    catStats[c.id] = { solved: 0, correct: 0 };
  });
  return catStats;
}

function createUserProfile({ email, name, nickname, classId, studentNo, isAdmin = false }) {
  const today = getLocalDateStr();
  return {
    email: email.toLowerCase().trim(),
    name: (name || '김문영').trim(),
    nickname: (nickname || name || '개나리퀸').trim(),
    classId: classId || '2-2',
    studentNo: Number(studentNo) || 1,
    isAdmin: isAdmin || ADMIN_EMAILS.includes(email.toLowerCase().trim()),
    xp: 0,
    level: 1,
    totalSolved: 0,
    totalCorrect: 0,
    combo: 0,
    maxCombo: 0,
    streakDays: 1,
    maxStreakDays: 1,
    lastStudyDate: today,
    studyDates: [today],
    crownGauge: 0,
    mascots: [],
    certificates: [],
    categoryStats: createEmptyCategoryStats(),
    solvedQuestionIds: [],
    updatedAt: new Date().toISOString()
  };
}

let cachedDemoData = null;
function getDemoDataset() {
  if (cachedDemoData) return cachedDemoData;

  const samples = [
    { email: 'smy101@smy.ms.kr', nickname: '개나리요정', name: '김나리', classId: '1-1', studentNo: 3, xp: 460, solved: 38, correct: 33, maxCombo: 11, streak: 5, maxStreak: 7, mascots: ['school', 'curriculum', 'world'], certs: [3, 5], catBias: 'school' },
    { email: 'smy102@smy.ms.kr', nickname: '별빛소녀', name: '이수빈', classId: '1-1', studentNo: 12, xp: 240, solved: 24, correct: 19, maxCombo: 6, streak: 2, maxStreak: 4, mascots: ['school'], certs: [3], catBias: 'culture' },
    { email: 'smy103@smy.ms.kr', nickname: '우주탐험가', name: '박하은', classId: '1-2', studentNo: 5, xp: 520, solved: 42, correct: 36, maxCombo: 14, streak: 6, maxStreak: 6, mascots: ['school', 'science', 'culture'], certs: [3, 5], catBias: 'science' },
    { email: 'smy104@smy.ms.kr', nickname: '지혜의샘', name: '최윤서', classId: '1-2', studentNo: 18, xp: 310, solved: 29, correct: 24, maxCombo: 8, streak: 3, maxStreak: 5, mascots: ['curriculum', 'economy'], certs: [3], catBias: 'curriculum' },
    { email: 'smy105@smy.ms.kr', nickname: '월드트래블러', name: '정다은', classId: '1-3', studentNo: 7, xp: 640, solved: 50, correct: 44, maxCombo: 16, streak: 8, maxStreak: 9, mascots: ['school', 'curriculum', 'world', 'culture'], certs: [3, 5], catBias: 'world' },
    { email: 'smy201@smy.ms.kr', nickname: '경제대통령', name: '강지민', classId: '2-1', studentNo: 2, xp: 980, solved: 74, correct: 66, maxCombo: 19, streak: 11, maxStreak: 11, mascots: ['school', 'curriculum', 'economy', 'world', 'science'], certs: [3, 5, 10], catBias: 'economy' },
    { email: 'smy202@smy.ms.kr', nickname: '신바람여왕', name: '조은채', classId: '2-2', studentNo: 9, xp: 1150, solved: 86, correct: 78, maxCombo: 23, streak: 14, maxStreak: 14, mascots: ['school', 'curriculum', 'economy', 'world', 'science', 'culture'], certs: [3, 5, 10], catBias: 'school' },
    { email: 'smy203@smy.ms.kr', nickname: '뮤즈아트', name: '윤서연', classId: '2-2', studentNo: 15, xp: 490, solved: 40, correct: 34, maxCombo: 10, streak: 4, maxStreak: 6, mascots: ['school', 'culture'], certs: [3, 5], catBias: 'culture' },
    { email: 'smy204@smy.ms.kr', nickname: '노바사이언스', name: '장예린', classId: '2-3', studentNo: 11, xp: 730, solved: 58, correct: 49, maxCombo: 13, streak: 7, maxStreak: 8, mascots: ['curriculum', 'science', 'world'], certs: [3, 5], catBias: 'science' },
    { email: 'smy205@smy.ms.kr', nickname: '황금프리즘', name: '임소율', classId: '2-4', studentNo: 4, xp: 610, solved: 48, correct: 41, maxCombo: 12, streak: 5, maxStreak: 7, mascots: ['school', 'economy', 'culture'], certs: [3, 5], catBias: 'economy' },
    { email: 'smy301@smy.ms.kr', nickname: '그랜드퀸채원', name: '한채원', classId: '3-1', studentNo: 1, xp: 1540, solved: 112, correct: 103, maxCombo: 28, streak: 19, maxStreak: 19, mascots: ['school', 'curriculum', 'economy', 'world', 'science', 'culture'], certs: [3, 5, 10, 15], catBias: 'curriculum' },
    { email: 'smy302@smy.ms.kr', nickname: '오대양탐험대', name: '오지우', classId: '3-2', studentNo: 8, xp: 1020, solved: 79, correct: 70, maxCombo: 17, streak: 9, maxStreak: 12, mascots: ['school', 'curriculum', 'world', 'science'], certs: [3, 5, 10], catBias: 'world' },
    { email: 'smy303@smy.ms.kr', nickname: '미래과학자', name: '서민주', classId: '3-3', studentNo: 6, xp: 890, solved: 68, correct: 59, maxCombo: 15, streak: 6, maxStreak: 10, mascots: ['school', 'economy', 'science'], certs: [3, 5], catBias: 'science' },
    { email: 'smy304@smy.ms.kr', nickname: '문영보물창고', name: '신유나', classId: '3-4', studentNo: 14, xp: 1280, solved: 95, correct: 86, maxCombo: 21, streak: 15, maxStreak: 15, mascots: ['school', 'curriculum', 'economy', 'world', 'culture'], certs: [3, 5, 10], catBias: 'school' }
  ];

  const usersMap = {};
  const demoLogs = [];

  samples.forEach((s, sIdx) => {
    const u = createUserProfile({
      email: s.email,
      name: s.name,
      nickname: s.nickname,
      classId: s.classId,
      studentNo: s.studentNo,
      isAdmin: false
    });
    u.xp = s.xp;
    u.level = Math.floor(s.xp / 100) + 1;
    u.totalSolved = s.solved;
    u.totalCorrect = s.correct;
    u.combo = Math.min(5, s.maxCombo);
    u.maxCombo = s.maxCombo;
    u.streakDays = s.streak;
    u.maxStreakDays = s.maxStreak;
    u.mascots = s.mascots;
    u.certificates = s.certs;
    u.isDemo = true;

    // 연속 일수에 맞춰 studyDates 채우기
    u.studyDates = [];
    for (let d = 0; d < s.streak; d++) {
      u.studyDates.push(getDateNDaysAgoStr(d));
    }

    // 6개 분야 통계 및 최근 20일간 일별 로그 생성 (기간별 통계/일별 추이/주간 리포트 작동용)
    const baseSolved = Math.floor(s.solved / 6);
    const baseCorrect = Math.floor(s.correct / 6);
    let logCounter = 0;

    CATEGORIES.forEach((cat, idx) => {
      const extraS = cat.id === s.catBias ? (s.solved - baseSolved * 6) : 0;
      const extraC = cat.id === s.catBias ? (s.correct - baseCorrect * 6) : 0;
      const cSolved = Math.max(1, baseSolved + extraS);
      const cCorrect = Math.min(cSolved, Math.max(1, baseCorrect + extraC - (idx % 2 === 0 ? 0 : 1)));
      u.categoryStats[cat.id] = { solved: cSolved, correct: cCorrect };

      for (let k = 0; k < cSolved; k++) {
        // 최근 18일 내로 골고루 분산 (오늘, 이번주, 지난주, 이번달에 모두 데이터가 있도록 구성)
        const daysAgo = (logCounter + sIdx) % 18;
        const dateStr = getDateNDaysAgoStr(daysAgo);
        demoLogs.push({
          date: dateStr,
          email: u.email,
          classId: u.classId,
          category: cat.id,
          isCorrect: k < cCorrect,
          isDemo: true
        });
        logCounter++;
      }
    });

    usersMap[u.email] = u;
  });

  cachedDemoData = { usersMap, demoLogs };
  return cachedDemoData;
}

function loadPersistentState() {
  try {
    const savedSound = localStorage.getItem(STORAGE_KEYS.SOUND_ON);
    if (savedSound !== null) state.soundEnabled = JSON.parse(savedSound);
    const soundBtn = document.getElementById('soundToggleBtn');
    if (soundBtn) soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';

    const savedShowDemo = localStorage.getItem(STORAGE_KEYS.SHOW_DEMO);
    if (savedShowDemo !== null) state.showDemoData = JSON.parse(savedShowDemo);
    const demoCheck = document.getElementById('toggleDemoDataCheckbox');
    if (demoCheck) demoCheck.checked = state.showDemoData;

    const savedGasUrl = localStorage.getItem(STORAGE_KEYS.GAS_URL);
    if (savedGasUrl) {
      state.gasUrl = savedGasUrl;
      const gasInput = document.getElementById('gasUrlInput');
      if (gasInput) gasInput.value = savedGasUrl;
    }

    const customQs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_QUESTIONS) || '[]');
    state.questions = [...DEFAULT_QUESTIONS, ...customQs];

    state.allUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.ALL_USERS) || '{}');
    state.quizLogs = JSON.parse(localStorage.getItem(STORAGE_KEYS.QUIZ_LOGS) || '[]');

    const savedCurrent = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
    if (savedCurrent && savedCurrent.email) {
      state.currentUser = state.allUsers[savedCurrent.email] || savedCurrent;
      state.allUsers[state.currentUser.email] = state.currentUser;
    }
  } catch (e) {
    console.error('상태 복원 오류:', e);
    state.questions = [...DEFAULT_QUESTIONS];
  }
}

function saveUserState() {
  if (state.currentUser) {
    state.currentUser.updatedAt = new Date().toISOString();
    state.allUsers[state.currentUser.email] = state.currentUser;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(state.currentUser));
  }
  localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(state.allUsers));
  localStorage.setItem(STORAGE_KEYS.QUIZ_LOGS, JSON.stringify(state.quizLogs));
}

// ============================================================================
// 4. 실제 Google 계정 로그인 (Google Identity Services + 학교 Supabase 명단 연동)
// ============================================================================
function parseJwtPayload(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function parseSchoolEmailPattern(email) {
  // 예: 202620315@smy.ms.kr 또는 20315@smy.ms.kr 등에서 학년·반·번호 자동 추출 시도
  const local = (email || '').split('@')[0];
  // 패턴 A: 연도4자리 + 학년(1~3) + 반(01~04 또는 1~4) + 번호(01~40)
  const m1 = local.match(/^(?:20\d{2})?([1-3])0?([1-4])(\d{2})$/);
  if (m1) {
    return {
      classId: `${m1[1]}-${Number(m1[2])}`,
      studentNo: Number(m1[3]) || 1
    };
  }
  return null;
}

function initGoogleSignInButton() {
  if (location.protocol === 'file:') {
    const notice = document.getElementById('localFileNoticeBox');
    if (notice) notice.style.display = 'block';
  }

  function tryRender() {
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredentialResponse
      });
      const wrap = document.getElementById('googleSignInBtnWrap');
      if (wrap) {
        wrap.innerHTML = '';
        google.accounts.id.renderButton(wrap, {
          theme: 'filled_blue',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          locale: 'ko',
          width: 280
        });
      }
    } else {
      setTimeout(tryRender, 250);
    }
  }
  tryRender();
}

async function handleGoogleCredentialResponse(response) {
  const errEl = document.getElementById('googleLoginErrorMsg');
  if (errEl) errEl.textContent = '';

  const payload = parseJwtPayload(response.credential);
  if (!payload || !payload.email) {
    if (errEl) errEl.textContent = 'Google 인증 정보를 읽지 못했습니다. 다시 시도해 주세요.';
    return;
  }

  const email = payload.email.toLowerCase().trim();
  const googleName = (payload.name || payload.given_name || '').trim();

  // Supabase 연동 확인 (기존 문영 독서 여권에 등록된 교사 권한 및 학생 학년·반·번호·실명·닉네임 자동 조회)
  let sbProfile = null;
  let sbIsAdmin = false;
  if (sbClient && sbClient.auth) {
    try {
      const authRes = await sbClient.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential
      });
      if (!authRes.error && authRes.data && authRes.data.user) {
        const uid = authRes.data.user.id;
        const [profRes, adminRes] = await Promise.all([
          sbClient.from('profiles').select('*').eq('id', uid).maybeSingle(),
          sbClient.rpc('is_admin')
        ]);
        if (profRes && profRes.data) sbProfile = profRes.data;
        if (adminRes && adminRes.data) sbIsAdmin = !!adminRes.data;
      }
    } catch (e) {
      console.warn('Supabase 프로필 조회 생략:', e);
    }
  }

  const isTeacherAdmin = ADMIN_EMAILS.includes(email) || sbIsAdmin;
  const isSchoolStudent = email.endsWith(ALLOWED_SCHOOL_DOMAIN) || (sbProfile && sbProfile.role === 'school');

  if (!isTeacherAdmin && !isSchoolStudent) {
    if (errEl) {
      errEl.innerHTML =
        `⚠️ <strong>${email}</strong> 계정은 학교 계정이 아닙니다.<br/>` +
        `학생은 <strong>@smy.ms.kr</strong> 학교 구글 계정으로 로그인해 주세요!`;
    }
    if (window.google && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
    return;
  }

  // 이미 퀴즈 퀸즈에 저장된 프로필이 있는 경우 즉시 로그인
  const existingLocal = state.allUsers[email];
  if (existingLocal && existingLocal.profileConfirmed) {
    existingLocal.isAdmin = isTeacherAdmin;
    loginWithProfile(existingLocal, true);
    return;
  }

  // 교사 계정인 경우 추가 입력 없이 즉시 교사 모드로 로그인
  if (isTeacherAdmin) {
    loginWithProfile({
      email,
      nickname: (sbProfile && sbProfile.nickname) || googleName || '문영선생님',
      name: (sbProfile && sbProfile.name) || googleName || '문영 선생님',
      classId: '2-2',
      studentNo: 1,
      isAdmin: true,
      profileConfirmed: true
    }, true);
    return;
  }

  // 학교 Supabase 명단(profiles)에 학년·반·번호·실명이 이미 등록된 학생이면 자동 세팅 후 닉네임/학급 확인 창 표시
  const parsedEmail = parseSchoolEmailPattern(email);
  const autoClassId =
    (sbProfile && sbProfile.grade && sbProfile.class_no ? `${sbProfile.grade}-${sbProfile.class_no}` : null) ||
    (existingLocal && existingLocal.classId) ||
    (parsedEmail && parsedEmail.classId) ||
    '1-1';
  const autoStudentNo =
    (sbProfile && sbProfile.student_no) ||
    (existingLocal && existingLocal.studentNo) ||
    (parsedEmail && parsedEmail.studentNo) ||
    1;
  const autoRealName =
    (sbProfile && sbProfile.name) ||
    (existingLocal && existingLocal.name) ||
    googleName ||
    '';
  const autoNickname =
    (existingLocal && existingLocal.nickname) ||
    (sbProfile && sbProfile.nickname) ||
    '';

  // 만약 Supabase 명단에 학년/반/번호/실명/닉네임이 모두 있으면 바로 로그인!
  if (sbProfile && sbProfile.grade && sbProfile.class_no && sbProfile.name && sbProfile.nickname) {
    loginWithProfile({
      email,
      nickname: sbProfile.nickname,
      name: sbProfile.name,
      classId: `${sbProfile.grade}-${sbProfile.class_no}`,
      studentNo: sbProfile.student_no || 1,
      isAdmin: false,
      profileConfirmed: true
    }, true);
    return;
  }

  // 최초 로그인 학생: 학급·번호·닉네임·실명 1회 확인 화면 노출
  showProfileSetupStep({
    email,
    classId: autoClassId,
    studentNo: autoStudentNo,
    nickname: autoNickname,
    name: autoRealName,
    canCancel: false
  });
}

function showProfileSetupStep({ email, classId, studentNo, nickname, name, canCancel }) {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.remove('hidden');

  document.getElementById('googleSignInStep').style.display = 'none';
  document.getElementById('profileSetupStep').style.display = 'block';

  document.getElementById('verifiedGoogleEmail').textContent = email;
  document.getElementById('loginEmail').value = email;
  document.getElementById('loginClass').value = SCHOOL_CLASSES.some(c => c.classId === classId) ? classId : '1-1';
  document.getElementById('loginNumber').value = studentNo || 1;
  document.getElementById('loginNickname').value = nickname || '';
  document.getElementById('loginName').value = name || '';

  const cancelBtn = document.getElementById('cancelProfileEditBtn');
  if (cancelBtn) cancelBtn.style.display = canCancel ? 'inline-flex' : 'none';
}

function openLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (!overlay) return;
  document.getElementById('googleSignInStep').style.display = 'block';
  document.getElementById('profileSetupStep').style.display = 'none';
  overlay.classList.remove('hidden');
  initGoogleSignInButton();
}

function openProfileEditModal() {
  if (!state.currentUser) {
    openLoginModal();
    return;
  }
  showProfileSetupStep({
    email: state.currentUser.email,
    classId: state.currentUser.classId,
    studentNo: state.currentUser.studentNo,
    nickname: state.currentUser.nickname,
    name: state.currentUser.name,
    canCancel: true
  });
}

function closeLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  if (overlay) overlay.classList.add('hidden');
}

function handleProfileSaveSubmit(event) {
  event.preventDefault();
  const emailRaw = document.getElementById('loginEmail').value.trim().toLowerCase();
  const classId = document.getElementById('loginClass').value;
  const studentNo = document.getElementById('loginNumber').value;
  const nickname = document.getElementById('loginNickname').value.trim();
  const name = document.getElementById('loginName').value.trim();

  const isTeacherAdmin = ADMIN_EMAILS.includes(emailRaw) || (state.currentUser && state.currentUser.isAdmin);

  loginWithProfile({
    email: emailRaw,
    nickname: nickname || name || '개나리퀸',
    name: name || '김문영',
    classId: classId || '1-1',
    studentNo: Number(studentNo) || 1,
    isAdmin: isTeacherAdmin,
    profileConfirmed: true
  }, true);
}

async function signOutGoogle() {
  try {
    if (sbClient && sbClient.auth) {
      await sbClient.auth.signOut();
    }
  } catch (e) {}
  if (window.google && google.accounts && google.accounts.id) {
    google.accounts.id.disableAutoSelect();
  }
  state.currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  openLoginModal();
  showToast('🚪 로그아웃되었습니다. Google 계정으로 다시 로그인해 주세요.');
}

function quickLogin(mode) {
  if (mode === 'student') {
    loginWithProfile({
      email: 'moonyoung07@smy.ms.kr',
      nickname: '개나리퀸',
      name: '김문영',
      classId: '2-2',
      studentNo: 7,
      isAdmin: false,
      profileConfirmed: true
    }, true);
  } else if (mode === 'teacher_smy') {
    loginWithProfile({
      email: 'tfellow@smy.ms.kr',
      nickname: '문영선생님',
      name: '문영 선생님',
      classId: '2-2',
      studentNo: 1,
      isAdmin: true,
      profileConfirmed: true
    }, true);
  } else if (mode === 'teacher_gmail') {
    loginWithProfile({
      email: 'tfellow@gmail.com',
      nickname: '관리자선생님',
      name: '문영 선생님',
      classId: '2-2',
      studentNo: 1,
      isAdmin: true,
      profileConfirmed: true
    }, true);
  }
}

function loginWithProfile({ email, nickname, name, classId, studentNo, isAdmin, profileConfirmed = true }) {
  const existing = state.allUsers[email];
  if (existing) {
    existing.nickname = nickname || existing.nickname || name;
    existing.name = name || existing.name;
    existing.classId = classId || existing.classId;
    existing.studentNo = studentNo || existing.studentNo;
    existing.isAdmin = isAdmin || ADMIN_EMAILS.includes(email);
    existing.profileConfirmed = profileConfirmed;
    state.currentUser = existing;
  } else {
    const created = createUserProfile({ email, nickname, name, classId, studentNo, isAdmin });
    created.profileConfirmed = profileConfirmed;
    state.currentUser = created;
  }

  saveUserState();
  closeLoginModal();
  refreshAllUI();

  if (state.currentUser.isAdmin) {
    showToast(`👩‍🏫 환영합니다, ${state.currentUser.name}님! 교사용 모드에서는 전교생의 닉네임과 실명을 모두 열람할 수 있습니다.`);
  } else {
    showToast(`🌼 환영합니다, ${state.currentUser.classId} [${state.currentUser.nickname}]님! (🔥 연속 ${state.currentUser.streakDays || 1}일째 도전 중)`);
  }
}

// ============================================================================
// 5. 탭 전환 및 전체 UI 갱신 (프라이버시 적용: 학생은 닉네임만, 교사는 닉네임+실명)
// ============================================================================
function switchTab(tabId) {
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  if (tabId === 'mystats') {
    renderMyStatsTab();
  } else if (tabId === 'ranking') {
    renderRankingTab();
  } else if (tabId === 'admin') {
    renderAdminTab();
  }
}

function switchAdminSubTab(subTabId) {
  state.adminSubTab = subTabId;
  document.querySelectorAll('.admin-subnav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.subtab === subTabId);
  });
  document.querySelectorAll('.admin-subpanel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `admin-sub-${subTabId}`);
  });
  renderAdminTab();
}

function getLevelTitleObj(level) {
  return (
    LEVEL_TITLES.find(t => level >= t.minLevel && level <= t.maxLevel) ||
    LEVEL_TITLES[LEVEL_TITLES.length - 1]
  );
}

/**
 * 학생 화면에서는 다른 학생의 닉네임만 반환하고,
 * 선생님(isAdmin) 화면에서는 `닉네임 (실명)`을 함께 반환합니다.
 */
function formatStudentDisplayName(studentObj, forceTeacherView = false) {
  const isTeacher = forceTeacherView || (state.currentUser && state.currentUser.isAdmin);
  const nick = studentObj.nickname || studentObj.name || '익명퀸';
  const real = studentObj.name || nick;
  if (isTeacher) {
    return `${nick} (${real})`;
  }
  return nick;
}

function refreshAllUI() {
  const user = state.currentUser;
  if (!user) return;

  const streak = user.streakDays || 1;
  const maxStreak = user.maxStreakDays || streak;

  // 상단 헤더 바
  document.getElementById('headerStreakPill').textContent = `🔥 연속 ${streak}일째`;
  document.getElementById('headerLevelBadge').textContent = `Lv.${user.level}`;
  document.getElementById('headerUserName').textContent =
    user.isAdmin ? `👩‍🏫 ${user.name}` : `${user.classId} ${user.nickname}`;

  // 선생님 전용 탭 표시 여부
  const adminBtn = document.getElementById('adminTabBtn');
  if (adminBtn) {
    adminBtn.style.display = user.isAdmin ? 'flex' : 'none';
  }

  // 좌측 프로필 카드 업데이트
  const titleObj = getLevelTitleObj(user.level);
  document.getElementById('profileAvatar').textContent = titleObj.badge;
  document.getElementById('profileNickname').textContent = user.nickname || user.name;
  document.getElementById('profileClassTag').textContent = user.classId;
  document.getElementById('profileRealNameSub').textContent = `실명(본인·교사만 열람): ${user.name} (${user.studentNo}번) | ${user.email}`;
  document.getElementById('profileTitleBadge').textContent = titleObj.title;

  // 연속 도전 일수 배너
  document.getElementById('profileStreakText').textContent = `연속 ${streak}일째 도전 중!`;
  document.getElementById('profileMaxStreakText').textContent = `최고 ${maxStreak}일`;

  // XP & 레벨 게이지
  const xpInCurrentLevel = user.xp % 100;
  document.getElementById('xpLevelText').textContent = `Lv.${user.level} (${xpInCurrentLevel} / 100 XP)`;
  document.getElementById('xpPercentText').textContent = `${xpInCurrentLevel}%`;
  document.getElementById('xpBarFill').style.width = `${xpInCurrentLevel}%`;

  const nextMilestone = CERTIFICATE_MILESTONE_LEVELS.find(m => m > user.level);
  const nextCertEl = document.getElementById('nextCertTargetText');
  if (nextMilestone) {
    const nextTitle = getLevelTitleObj(nextMilestone);
    nextCertEl.textContent = `🎖️ 다음 인증서: Lv.${nextMilestone} (${nextTitle.certName})`;
  } else {
    nextCertEl.textContent = `🌟 최고 레벨 인증서(Lv.30) 달성 완료!`;
  }

  // 미니 스탯 4칸
  const acc = user.totalSolved > 0 ? ((user.totalCorrect / user.totalSolved) * 100).toFixed(1) : '0.0';
  document.getElementById('miniTotalSolved').textContent = `${user.totalSolved}문항`;
  document.getElementById('miniAccuracy').textContent = `${acc}%`;
  document.getElementById('miniCombo').textContent = `${user.combo} / ${user.maxCombo}🔥`;
  document.getElementById('miniCertCount').textContent = `${streak}일 / ${user.certificates.length}장`;

  // 왕관 게이지 (0~3)
  document.getElementById('crownGaugeText').textContent = `(${user.crownGauge} / 3)`;
  for (let i = 1; i <= 3; i++) {
    const slot = document.getElementById(`crownSlot${i}`);
    if (slot) slot.classList.toggle('filled', i <= user.crownGauge);
  }

  // 6대 분야 마스코트 미니 그리드
  document.getElementById('mascotCountBadge').textContent = `${user.mascots.length} / 6 수집`;
  const mascotGrid = document.getElementById('mascotMiniGrid');
  if (mascotGrid) {
    mascotGrid.innerHTML = CATEGORIES.map(cat => {
      const collected = user.mascots.includes(cat.id);
      return `
        <div class="mascot-card ${collected ? 'collected' : ''}" title="${cat.mascotDesc}">
          <span class="mascot-emoji">${cat.mascotEmoji}</span>
          <span class="mascot-name">${cat.mascotName}</span>
          <span class="mascot-cat">${cat.shortName} ${collected ? '✅' : '🔒'}</span>
        </div>
      `;
    }).join('');
  }

  const comboBonus = Math.min(user.combo * 3, 30);
  document.getElementById('arenaComboPill').textContent =
    `🔥 현재 ${user.combo}연속 정답 중! (콤보 보너스 +${comboBonus} XP)`;

  const qCountEl = document.getElementById('adminTotalQCount');
  if (qCountEl) qCountEl.textContent = state.questions.length;
}

// ============================================================================
// 6. 트리비아 크랙 스타일 7분할 룰렛 휠 그리기 및 회전
// ============================================================================
function drawRouletteWheel() {
  const canvas = document.getElementById('rouletteCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const radius = cx - 14;
  const sliceCount = ROULETTE_SLICES.length;
  const arc = (2 * Math.PI) / sliceCount;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ROULETTE_SLICES.forEach((slice, idx) => {
    const startAngle = idx * arc - Math.PI / 2 - arc / 2;
    const endAngle = startAngle + arc;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#FFFFFF';

    ctx.font = 'bold 34px "Pretendard", sans-serif';
    ctx.fillText(slice.icon, radius - 26, 12);

    ctx.font = '800 18px "Pretendard", sans-serif';
    ctx.fillText(slice.shortName, radius - 72, 7);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
}

function renderDirectCategoryChips() {
  const wrap = document.getElementById('directCategoryChips');
  if (!wrap) return;
  wrap.innerHTML = CATEGORIES.map(cat => `
    <button type="button" class="cat-chip-btn" onclick="startQuizByCategory('${cat.id}')">
      <span>${cat.icon}</span>
      <span>${cat.name}</span>
    </button>
  `).join('');
}

function spinRoulette() {
  if (state.isSpinning) return;
  state.isSpinning = true;

  const spinBtn = document.getElementById('spinBtn');
  if (spinBtn) spinBtn.disabled = true;

  playSoundEffect('spin');

  const sliceCount = ROULETTE_SLICES.length;
  const sliceDeg = 360 / sliceCount;
  const chosenIndex = Math.floor(Math.random() * sliceCount);
  const chosenSlice = ROULETTE_SLICES[chosenIndex];

  const extraSpins = (5 + Math.floor(Math.random() * 3)) * 360;
  const targetModAngle = (360 - chosenIndex * sliceDeg) % 360;
  const currentMod = state.wheelRotation % 360;
  let delta = targetModAngle - currentMod;
  if (delta < 0) delta += 360;

  const jitter = (Math.random() - 0.5) * (sliceDeg * 0.45);
  state.wheelRotation += extraSpins + delta + jitter;

  const canvas = document.getElementById('rouletteCanvas');
  canvas.style.transform = `rotate(${state.wheelRotation}deg)`;

  const statusText = document.getElementById('rouletteStatusText');
  statusText.textContent = '🎲 두구두구... 행운의 룰렛이 돌아가고 있습니다!';

  setTimeout(() => {
    state.isSpinning = false;
    if (spinBtn) spinBtn.disabled = false;

    if (chosenSlice.id === 'crown') {
      statusText.innerHTML = `👑 <strong>[왕관 찬스]</strong> 당첨! 원하는 분야의 마스코트를 획득하세요!`;
      openCrownSelectionModal();
    } else {
      statusText.innerHTML = `${chosenSlice.icon} <strong>[${chosenSlice.name}]</strong> 분야 당첨! 문제를 출제합니다.`;
      setTimeout(() => startQuizByCategory(chosenSlice.id), 450);
    }
  }, 3850);
}

// ============================================================================
// 7. 퀴즈 출제, 타이머, 찬스 아이템(3종) 및 채점 + 일별 로그 기록
// ============================================================================
function pickQuestionForCategory(categoryId) {
  const pool = state.questions.filter(q => q.category === categoryId);
  if (pool.length === 0) return state.questions[0];

  const solvedIds = state.currentUser ? state.currentUser.solvedQuestionIds : [];
  const unsolved = pool.filter(q => !solvedIds.includes(q.id));

  const targetPool = unsolved.length > 0 ? unsolved : pool;
  return targetPool[Math.floor(Math.random() * targetPool.length)];
}

function startQuizByCategory(categoryId) {
  const catObj = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  const questionObj = pickQuestionForCategory(catObj.id);

  state.currentQuiz = {
    questionObj,
    categoryObj: catObj,
    timerId: null,
    timeLeft: 20,
    maxTime: 20,
    answered: false,
    used5050: false,
    usedTime: false,
    usedSkip: false
  };

  const header = document.getElementById('quizModalHeader');
  header.style.background = catObj.color;
  document.getElementById('quizCatIcon').textContent = catObj.icon;
  document.getElementById('quizCatName').textContent = catObj.name;
  document.getElementById('quizDiffBadge').textContent = `난이도: ${questionObj.difficulty || '보통'}`;

  document.getElementById('quizQuestionText').textContent = `Q. ${questionObj.question}`;
  const optionsList = document.getElementById('quizOptionsList');
  optionsList.innerHTML = questionObj.options.map((optText, idx) => `
    <button type="button" class="quiz-option-btn" id="quizOptBtn_${idx + 1}" onclick="submitAnswer(${idx + 1})">
      <span class="opt-num">${idx + 1}</span>
      <span>${optText}</span>
    </button>
  `).join('');

  document.getElementById('lifeline5050').disabled = false;
  document.getElementById('lifelineTime').disabled = false;
  document.getElementById('lifelineSkip').disabled = false;
  document.getElementById('quizExplanationBox').classList.add('hidden');

  document.getElementById('quizModal').classList.remove('hidden');
  startQuizTimer();
}

function startQuizTimer() {
  clearInterval(state.currentQuiz.timerId);
  updateTimerUI();

  state.currentQuiz.timerId = setInterval(() => {
    if (state.currentQuiz.answered) {
      clearInterval(state.currentQuiz.timerId);
      return;
    }
    state.currentQuiz.timeLeft -= 0.25;
    if (state.currentQuiz.timeLeft <= 0) {
      state.currentQuiz.timeLeft = 0;
      updateTimerUI();
      clearInterval(state.currentQuiz.timerId);
      submitAnswer(-1);
    } else {
      updateTimerUI();
    }
  }, 250);
}

function updateTimerUI() {
  const { timeLeft, maxTime } = state.currentQuiz;
  document.getElementById('quizTimerBadge').textContent = `⏱️ ${Math.ceil(timeLeft)}초`;
  const pct = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  document.getElementById('quizTimerBar').style.width = `${pct}%`;
}

function useLifeline5050() {
  const q = state.currentQuiz;
  if (q.answered || q.used5050) return;
  q.used5050 = true;
  document.getElementById('lifeline5050').disabled = true;

  const wrongIndices = [1, 2, 3, 4].filter(n => n !== q.questionObj.answer);
  wrongIndices.sort(() => Math.random() - 0.5);
  wrongIndices.slice(0, 2).forEach(num => {
    const btn = document.getElementById(`quizOptBtn_${num}`);
    if (btn) {
      btn.disabled = true;
      btn.style.opacity = '0.32';
      btn.style.textDecoration = 'line-through';
    }
  });
  showToast('✂️ 50:50 찬스! 오답 2개가 제거되었습니다.');
}

function useLifelineTime() {
  const q = state.currentQuiz;
  if (q.answered || q.usedTime) return;
  q.usedTime = true;
  document.getElementById('lifelineTime').disabled = true;

  q.timeLeft += 10;
  q.maxTime = Math.max(q.maxTime, q.timeLeft);
  updateTimerUI();
  showToast('⏳ 제한 시간이 +10초 연장되었습니다!');
}

function useLifelineSkip() {
  const q = state.currentQuiz;
  if (q.answered || q.usedSkip) return;
  clearInterval(q.timerId);
  showToast('🔄 같은 분야의 다른 문제로 교체합니다!');
  startQuizByCategory(q.categoryObj.id);
  state.currentQuiz.usedSkip = true;
  document.getElementById('lifelineSkip').disabled = true;
}

function submitAnswer(selectedNum) {
  const q = state.currentQuiz;
  if (q.answered) return;
  q.answered = true;
  clearInterval(q.timerId);

  const correctNum = q.questionObj.answer;
  const isCorrect = selectedNum === correctNum;

  for (let i = 1; i <= 4; i++) {
    const btn = document.getElementById(`quizOptBtn_${i}`);
    if (!btn) continue;
    btn.disabled = true;
    if (i === correctNum) {
      btn.classList.add('correct');
    } else if (i === selectedNum && !isCorrect) {
      btn.classList.add('wrong');
    }
  }

  document.getElementById('lifeline5050').disabled = true;
  document.getElementById('lifelineTime').disabled = true;
  document.getElementById('lifelineSkip').disabled = true;

  const user = state.currentUser;
  const prevLevel = user.level;

  // 연속 도전 일수 갱신
  updateStreakOnQuizSolve(user);

  user.totalSolved += 1;
  if (!user.categoryStats[q.categoryObj.id]) {
    user.categoryStats[q.categoryObj.id] = { solved: 0, correct: 0 };
  }
  user.categoryStats[q.categoryObj.id].solved += 1;

  let earnedXp = 0;
  if (isCorrect) {
    playSoundEffect('correct');
    user.totalCorrect += 1;
    user.categoryStats[q.categoryObj.id].correct += 1;
    user.combo += 1;
    if (user.combo > user.maxCombo) user.maxCombo = user.combo;

    const comboBonus = Math.min((user.combo - 1) * 3, 30);
    earnedXp = 25 + comboBonus;
    user.xp += earnedXp;

    if (!user.solvedQuestionIds.includes(q.questionObj.id)) {
      user.solvedQuestionIds.push(q.questionObj.id);
    }

    user.crownGauge = Math.min(3, user.crownGauge + 1);
  } else {
    playSoundEffect('wrong');
    user.combo = 0;
    earnedXp = 5;
    user.xp += earnedXp;
  }

  user.level = Math.floor(user.xp / 100) + 1;

  // 일별/기간별 통계용 로그 저장
  state.quizLogs.push({
    date: getLocalDateStr(),
    email: user.email,
    classId: user.classId,
    category: q.categoryObj.id,
    isCorrect
  });

  // 마일스톤 레벨 인증서 자동 해금 확인
  let newlyUnlockedCertLevel = null;
  CERTIFICATE_MILESTONE_LEVELS.forEach(mLevel => {
    if (user.level >= mLevel && !user.certificates.includes(mLevel)) {
      user.certificates.push(mLevel);
      newlyUnlockedCertLevel = mLevel;
    }
  });

  saveUserState();
  refreshAllUI();

  if (state.gasUrl) {
    postToGoogleSheets({
      action: 'saveQuizLog',
      user,
      questionId: q.questionObj.id,
      category: q.categoryObj.id,
      isCorrect
    });
  }

  const expBox = document.getElementById('quizExplanationBox');
  const expTitle = document.getElementById('expResultTitle');
  const expText = document.getElementById('expText');

  if (isCorrect) {
    expTitle.style.color = '#059669';
    expTitle.textContent = `🎉 정답입니다! (+${earnedXp} XP 획득 | 🔥 ${user.combo}연속 정답!)`;
  } else if (selectedNum === -1) {
    expTitle.style.color = '#DC2626';
    expTitle.textContent = `⏰ 시간이 초과되었습니다! (도전 격려 +${earnedXp} XP | 정답: ${correctNum}번)`;
  } else {
    expTitle.style.color = '#DC2626';
    expTitle.textContent = `💡 아쉽네요! 정답은 ${correctNum}번입니다. (도전 격려 +${earnedXp} XP)`;
  }

  expText.textContent = `해설: ${q.questionObj.explanation}`;
  expBox.classList.remove('hidden');

  if (user.level > prevLevel) {
    setTimeout(() => playSoundEffect('levelup'), 300);
    showToast(`🎊 레벨 업! Lv.${user.level} 달성! (${getLevelTitleObj(user.level).title})`);
  }

  if (newlyUnlockedCertLevel) {
    setTimeout(() => {
      openCertificateModalForUser(user, newlyUnlockedCertLevel, true);
    }, 900);
  }
}

function closeQuizModal() {
  clearInterval(state.currentQuiz.timerId);
  document.getElementById('quizModal').classList.add('hidden');

  if (state.currentUser && state.currentUser.crownGauge >= 3) {
    setTimeout(() => openCrownSelectionModal(), 250);
  }
}

function closeQuizAndSpinAgain() {
  closeQuizModal();
  if (state.currentUser && state.currentUser.crownGauge >= 3) {
    return;
  }
  setTimeout(() => spinRoulette(), 250);
}

// ============================================================================
// 8. 왕관(Crown) 마스코트 획득 모달
// ============================================================================
function openCrownSelectionModal() {
  const user = state.currentUser;
  if (!user) return;

  const grid = document.getElementById('crownSelectGrid');
  grid.innerHTML = CATEGORIES.map(cat => {
    const owned = user.mascots.includes(cat.id);
    return `
      <button type="button" class="crown-choice-btn" onclick="claimCrownMascot('${cat.id}')">
        <span style="font-size:2.1rem;">${cat.mascotEmoji}</span>
        <div>
          <div style="font-size:0.9rem; font-weight:900; color:#1E1B4B;">
            ${cat.mascotName} ${owned ? '<span style="font-size:0.7rem; color:#10B981;">(보유중)</span>' : '<span style="font-size:0.7rem; color:#DB2777;">(NEW!)</span>'}
          </div>
          <div style="font-size:0.74rem; color:#64748B; font-weight:600;">${cat.icon} ${cat.name}</div>
        </div>
      </button>
    `;
  }).join('');

  document.getElementById('crownModal').classList.remove('hidden');
}

function claimCrownMascot(categoryId) {
  const user = state.currentUser;
  const cat = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];

  user.crownGauge = 0;
  user.xp += 30;
  user.level = Math.floor(user.xp / 100) + 1;

  if (!user.mascots.includes(categoryId)) {
    user.mascots.push(categoryId);
    showToast(`👑 축하합니다! [${cat.mascotName}] 마스코트를 도감에 수집했습니다! (+30 XP)`);
  } else {
    showToast(`👑 [${cat.mascotName}] 마스코트 응원 보너스로 +30 XP를 획득했습니다!`);
  }

  playSoundEffect('levelup');
  saveUserState();
  refreshAllUI();
  document.getElementById('crownModal').classList.add('hidden');
}

// ============================================================================
// 9. 레벨별 디지털 인증서 (서울문영여자중학교 공식 명칭 적용)
// ============================================================================
function openCertificatePreviewModal() {
  if (!state.currentUser) return;
  openCertificateModalForUser(state.currentUser, state.currentUser.level, false);
}

function openCertificateModalForUser(targetUser, certLevel, isAutoUnlock = false) {
  state.activeCertificateTarget = { user: targetUser, level: certLevel };
  const titleObj = getLevelTitleObj(certLevel);

  const heading = document.getElementById('certModalHeading');
  const sub = document.getElementById('certModalSub');
  if (isAutoUnlock) {
    heading.textContent = `🎊 축하합니다! Lv.${certLevel} 달성 디지털 인증서가 발급되었습니다!`;
  } else {
    heading.textContent = `📜 서울문영여자중학교 QUIZ QUEENS 공식 인증서`;
  }
  sub.textContent = `수여 대상: ${targetUser.classId} ${targetUser.nickname} (${targetUser.name}) | 호칭: ${titleObj.certName}`;

  renderCertificateCanvas(targetUser, certLevel);
  document.getElementById('certificateModal').classList.remove('hidden');

  if (isAutoUnlock && state.gasUrl) {
    sendCertificateByEmail(true);
  }
}

function closeCertificateModal() {
  document.getElementById('certificateModal').classList.add('hidden');
}

function renderCertificateCanvas(user, certLevel) {
  const canvas = document.getElementById('certificateCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const titleObj = getLevelTitleObj(certLevel);
  const acc = user.totalSolved > 0 ? ((user.totalCorrect / user.totalSolved) * 100).toFixed(1) : '100.0';
  const todayStr = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  const serialNo = `MOONYOUNG-QQ-${new Date().getFullYear()}-L${String(certLevel).padStart(2, '0')}-${String(user.studentNo || 1).padStart(2, '0')}`;

  // 1. 배경
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#FFFDF9');
  bgGrad.addColorStop(0.5, '#FFFBEB');
  bgGrad.addColorStop(1, '#FDF2F8');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // 2. 프레임
  ctx.strokeStyle = '#D97706';
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, W - 48, H - 48);

  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 3;
  ctx.strokeRect(38, 38, W - 76, H - 76);

  const corners = [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]];
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#F59E0B';
    ctx.fill();
  });

  // 3. 상단 일련번호 & 교훈
  ctx.fillStyle = '#64748B';
  ctx.font = '700 15px "Pretendard", sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`인증번호: ${serialNo}`, 65, 78);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7C3AED';
  ctx.fillText(`교훈: 경애(敬愛)와 신의(信義) · '신바람' 문영`, W - 65, 78);

  // 4. 타이틀 헤더
  ctx.textAlign = 'center';
  ctx.fillStyle = '#B45309';
  ctx.font = '800 19px "Pretendard", sans-serif';
  ctx.fillText('👑 SEOUL MOONYOUNG GIRLS’ MIDDLE SCHOOL · QUIZ QUEENS 👑', W / 2, 130);

  ctx.fillStyle = '#1E1B4B';
  ctx.font = '900 44px "Pretendard", sans-serif';
  ctx.fillText(`상 식 여 왕  레 벨  인 증 서`, W / 2, 188);

  // 5. 등급 배지 박스
  ctx.fillStyle = '#EDE9FE';
  ctx.beginPath();
  ctx.roundRect(W / 2 - 210, 212, 420, 48, 24);
  ctx.fill();
  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#5B21B6';
  ctx.font = '900 22px "Pretendard", sans-serif';
  ctx.fillText(`${titleObj.badge} Lv.${certLevel} 달성 — ${titleObj.certName}`, W / 2, 244);

  // 6. 학생 인적사항 (학급, 번호, 닉네임, 성명)
  ctx.fillStyle = '#334155';
  ctx.font = '800 23px "Pretendard", sans-serif';
  ctx.fillText(
    `학급: ${user.classId} (${user.studentNo}번)   |   닉네임: ${user.nickname || user.name}   |   성명: ${user.name}`,
    W / 2,
    310
  );

  ctx.font = '600 16px "Pretendard", sans-serif';
  ctx.fillStyle = '#64748B';
  ctx.fillText(`학교 계정: ${user.email}  |  부여 칭호: ${titleObj.title}  |  연속 도전: ${user.streakDays || 1}일`, W / 2, 344);

  // 7. 본문 문구
  ctx.fillStyle = '#1E293B';
  ctx.font = '700 21px "Pretendard", sans-serif';
  ctx.fillText(
    `위 학생은 서울문영여자중학교 『QUIZ QUEENS (퀴즈 퀸즈)』 무한도전에서`,
    W / 2,
    405
  );
  ctx.fillText(
    `끊임없는 탐구심과 지성으로 6대 분야 상식 퀴즈에 도전하여`,
    W / 2,
    438
  );
  ctx.fillText(
    `총 ${user.totalSolved}문항 풀이(정확도 ${acc}%, 연속 ${user.streakDays || 1}일 도전) 및 Lv.${certLevel}의`,
    W / 2,
    471
  );
  ctx.fillText(
    `자랑스러운 성취를 이루었기에 이 인증서를 수여합니다.`,
    W / 2,
    504
  );

  // 8. 날짜 및 서명/직인
  ctx.fillStyle = '#475569';
  ctx.font = '700 19px "Pretendard", sans-serif';
  ctx.fillText(todayStr, W / 2, 562);

  ctx.fillStyle = '#1E1B4B';
  ctx.font = '900 26px "Pretendard", sans-serif';
  ctx.fillText('서울문영여자중학교 퀴즈 퀸즈 운영위원회', W / 2, 610);

  const sealX = W - 150;
  const sealY = 585;
  ctx.beginPath();
  ctx.arc(sealX, sealY, 44, 0, Math.PI * 2);
  ctx.fillStyle = '#FEF3C7';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#F59E0B';
  ctx.stroke();

  ctx.fillStyle = '#B45309';
  ctx.font = '900 15px "Pretendard", sans-serif';
  ctx.fillText('서울문영', sealX, sealY - 4);
  ctx.fillText('퀴즈퀸즈인', sealX, sealY + 16);
}

function downloadCertificatePNG() {
  const canvas = document.getElementById('certificateCanvas');
  if (!canvas) return;
  const target = state.activeCertificateTarget || { user: state.currentUser, level: state.currentUser.level };
  const link = document.createElement('a');
  link.download = `서울문영여자중학교_퀴즈퀸즈_인증서_${target.user.classId}_${target.user.nickname}_Lv${target.level}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('💾 고화질 인증서 이미지(PNG)가 다운로드되었습니다!');
}

async function sendCertificateByEmail(isSilentAuto = false) {
  const target = state.activeCertificateTarget || { user: state.currentUser, level: state.currentUser.level };
  const canvas = document.getElementById('certificateCanvas');
  const titleObj = getLevelTitleObj(target.level);

  if (!state.gasUrl) {
    if (!isSilentAuto) {
      alert(
        `📧 [학교 이메일(${target.user.email}) 발송 안내]\n\n` +
        `현재 로컬 단독 모드로 실행 중입니다.\n` +
        `선생님께서 [👩‍🏫 선생님 관리·통계 > ⚙️ 구글 시트 & 문제 추가] 탭에서 Google Apps Script 웹앱 URL을 연결하시면 학생의 @smy.ms.kr 이메일로 인증서 이미지가 자동 발송됩니다!\n\n` +
        `지금은 [💾 인증서 이미지(PNG) 다운로드] 버튼으로 즉시 저장하실 수 있습니다.`
      );
    }
    return;
  }

  const btn = document.getElementById('sendCertEmailBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '📨 이메일 발송 중...';
  }

  try {
    const imageBase64 = canvas ? canvas.toDataURL('image/png') : '';
    await postToGoogleSheets({
      action: 'sendCertificateEmail',
      email: target.user.email,
      name: target.user.name,
      nickname: target.user.nickname,
      classLabel: target.user.classId,
      level: target.level,
      certName: titleObj.certName,
      title: titleObj.title,
      totalSolved: target.user.totalSolved,
      accuracy: target.user.totalSolved > 0 ? ((target.user.totalCorrect / target.user.totalSolved) * 100).toFixed(1) : '100.0',
      imageBase64
    });
    showToast(`📧 ${target.user.email} 계정으로 [${titleObj.certName}] 이메일 발송을 요청했습니다!`);
  } catch (e) {
    showToast('⚠️ 이메일 발송 요청 중 오류가 발생했습니다.');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📧 학교 이메일(@smy.ms.kr)로 인증서 발송';
    }
  }
}

// ============================================================================
// 10. [탭 2] 📊 나의 상식 통계 & 레이더 차트 & 인증서 보관함
// ============================================================================
function renderMyStatsTab() {
  const user = state.currentUser;
  if (!user) return;

  const acc = user.totalSolved > 0 ? ((user.totalCorrect / user.totalSolved) * 100).toFixed(1) : '0.0';
  const streak = user.streakDays || 1;
  const maxStreak = user.maxStreakDays || streak;

  document.getElementById('statMyTotal').textContent = `${user.totalSolved}문항`;
  document.getElementById('statMyCorrectSub').textContent = `정답 ${user.totalCorrect}문항 / 오답 ${user.totalSolved - user.totalCorrect}문항`;
  document.getElementById('statMyAccuracy').textContent = `${acc}%`;
  document.getElementById('statMyStreak').textContent = `🔥 ${streak}일 연속`;
  document.getElementById('statMyMaxStreakSub').textContent = `최고 ${maxStreak}일 연속 / 최대 ${user.maxCombo}콤보`;
  document.getElementById('statMyCertAndMascot').textContent = `${user.certificates.length}장 / ${user.mascots.length}종`;

  let bestCatName = '아직 기록 없음';
  let bestCatRate = -1;
  CATEGORIES.forEach(cat => {
    const st = user.categoryStats[cat.id] || { solved: 0, correct: 0 };
    if (st.solved > 0) {
      const rate = (st.correct / st.solved) * 100;
      if (rate > bestCatRate) {
        bestCatRate = rate;
        bestCatName = `${cat.icon} ${cat.shortName} (${rate.toFixed(0)}%)`;
      }
    }
  });
  document.getElementById('statMyBestCat').textContent = `최강 분야: ${bestCatName}`;

  const progList = document.getElementById('categoryProgressList');
  progList.innerHTML = CATEGORIES.map(cat => {
    const st = user.categoryStats[cat.id] || { solved: 0, correct: 0 };
    const rate = st.solved > 0 ? ((st.correct / st.solved) * 100).toFixed(1) : '0.0';
    return `
      <div class="cat-progress-row">
        <div class="cat-progress-label">
          <span>${cat.icon} ${cat.name}</span>
          <span style="color:${cat.color};">${st.correct} / ${st.solved}문항 정답 (${rate}%)</span>
        </div>
        <div class="cat-progress-track">
          <div class="cat-progress-fill" style="width:${rate}%; background:${cat.color};"></div>
        </div>
      </div>
    `;
  }).join('');

  drawRadarChart(user);

  const vaultGrid = document.getElementById('certificateVaultGrid');
  vaultGrid.innerHTML = CERTIFICATE_MILESTONE_LEVELS.map(mLevel => {
    const unlocked = user.level >= mLevel || user.certificates.includes(mLevel);
    const tObj = getLevelTitleObj(mLevel);
    return `
      <div style="border:2px ${unlocked ? 'solid #F59E0B' : 'dashed #CBD5E1'}; background:${unlocked ? 'linear-gradient(180deg, #FFFFFF, #FFFBEB)' : '#F8FAFC'}; border-radius:16px; padding:1rem; text-align:center; opacity:${unlocked ? '1' : '0.6'};">
        <div style="font-size:1.85rem; margin-bottom:0.25rem;">${unlocked ? tObj.badge : '🔒'}</div>
        <div style="font-size:0.76rem; font-weight:800; color:#7C3AED;">목표 레벨 Lv.${mLevel}</div>
        <div style="font-size:0.92rem; font-weight:900; margin:0.2rem 0 0.35rem;">${tObj.certName}</div>
        <div style="font-size:0.74rem; color:#64748B; margin-bottom:0.7rem;">${tObj.title}</div>
        ${
          unlocked
            ? `<button type="button" class="btn-gold" style="width:100%; padding:0.42rem; font-size:0.78rem;" onclick="openCertificateModalForUser(state.currentUser, ${mLevel}, false)">📜 인증서 열람·저장·발송</button>`
            : `<span style="font-size:0.74rem; font-weight:700; color:#94A3B8;">Lv.${mLevel} 도달 시 자동 발급</span>`
        }
      </div>
    `;
  }).join('');
}

function drawRadarChart(user) {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2 + 6;
  const maxR = 110;

  ctx.clearRect(0, 0, W, H);

  [0.25, 0.5, 0.75, 1.0].forEach(scale => {
    ctx.beginPath();
    CATEGORIES.forEach((_, idx) => {
      const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
      const x = cx + Math.cos(angle) * maxR * scale;
      const y = cy + Math.sin(angle) * maxR * scale;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  CATEGORIES.forEach((cat, idx) => {
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR;
    const y = cy + Math.sin(angle) * maxR;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = '#CBD5E1';
    ctx.stroke();

    const labelX = cx + Math.cos(angle) * (maxR + 28);
    const labelY = cy + Math.sin(angle) * (maxR + 22);
    ctx.fillStyle = '#1E1B4B';
    ctx.font = '800 12px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${cat.icon}${cat.shortName}`, labelX, labelY + 4);
  });

  ctx.beginPath();
  CATEGORIES.forEach((cat, idx) => {
    const st = user.categoryStats[cat.id] || { solved: 0, correct: 0 };
    const accRatio = st.solved > 0 ? st.correct / st.solved : 0.12;
    const val = Math.max(0.12, accRatio);
    const angle = (Math.PI * 2 * idx) / 6 - Math.PI / 2;
    const x = cx + Math.cos(angle) * maxR * val;
    const y = cy + Math.sin(angle) * maxR * val;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(124, 58, 237, 0.28)';
  ctx.fill();
  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// ============================================================================
// 11. [탭 3] 🏆 학급별(1-1 ~ 3-4) & 개인별 랭킹 (학생은 닉네임만, 교사는 닉네임+실명)
// ============================================================================
function getCombinedStudentsList() {
  const combinedMap = {};
  if (state.showDemoData) {
    Object.assign(combinedMap, getDemoDataset().usersMap);
  }
  Object.values(state.allUsers).forEach(u => {
    if (u && u.email && !u.isAdmin) {
      combinedMap[u.email] = u;
    }
  });
  return Object.values(combinedMap);
}

function getCombinedLogsList() {
  let logs = [];
  if (state.showDemoData) {
    logs = [...getDemoDataset().demoLogs];
  }
  return [...logs, ...state.quizLogs];
}

function getAccuracyBadgeHtml(accNum) {
  const cls = accNum >= 80 ? 'acc-high' : accNum >= 60 ? 'acc-mid' : 'acc-low';
  return `<span class="accuracy-pill ${cls}">${accNum.toFixed(1)}%</span>`;
}

function renderRankingTab() {
  const students = getCombinedStudentsList();
  const isTeacher = state.currentUser && state.currentUser.isAdmin;

  // 11개 학급(1-1 ~ 3-4) 집계
  const classAgg = SCHOOL_CLASSES.map(c => {
    const members = students.filter(s => s.classId === c.classId);
    const totalSolved = members.reduce((sum, m) => sum + (m.totalSolved || 0), 0);
    const totalCorrect = members.reduce((sum, m) => sum + (m.totalCorrect || 0), 0);
    const accuracy = totalSolved > 0 ? (totalCorrect / totalSolved) * 100 : 0;
    const avgLevel = members.length > 0 ? members.reduce((sum, m) => sum + (m.level || 1), 0) / members.length : 1;
    const avgStreak = members.length > 0 ? members.reduce((sum, m) => sum + (m.streakDays || 1), 0) / members.length : 0;

    let bestCat = '-';
    let bestCatAcc = -1;
    CATEGORIES.forEach(cat => {
      const catSolved = members.reduce((s, m) => s + ((m.categoryStats?.[cat.id]?.solved) || 0), 0);
      const catCorrect = members.reduce((s, m) => s + ((m.categoryStats?.[cat.id]?.correct) || 0), 0);
      if (catSolved >= 3) {
        const r = (catCorrect / catSolved) * 100;
        if (r > bestCatAcc) {
          bestCatAcc = r;
          bestCat = `${cat.icon} ${cat.shortName} (${r.toFixed(0)}%)`;
        }
      }
    });

    return {
      ...c,
      activeCount: members.length,
      totalSolved,
      totalCorrect,
      accuracy,
      avgLevel,
      avgStreak,
      bestCat
    };
  });

  const schoolTotalSolved = classAgg.reduce((s, c) => s + c.totalSolved, 0);
  const schoolTotalCorrect = classAgg.reduce((s, c) => s + c.totalCorrect, 0);
  const schoolAvgAcc = schoolTotalSolved > 0 ? ((schoolTotalCorrect / schoolTotalSolved) * 100).toFixed(1) : '0.0';
  const topSolvedClass = [...classAgg].sort((a, b) => b.totalSolved - a.totalSolved)[0];
  const topAccClass = [...classAgg].filter(c => c.totalSolved >= 5).sort((a, b) => b.accuracy - a.accuracy)[0] || topSolvedClass;

  const summaryWrap = document.getElementById('schoolSummaryCards');
  if (summaryWrap) {
    summaryWrap.innerHTML = `
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#EDE9FE; color:#7C3AED;">🏫</div>
        <div class="stat-kpi-info">
          <div class="label">전교 누적 풀이 문항</div>
          <div class="value">${schoolTotalSolved.toLocaleString()}문항</div>
          <div class="sub">응시 학생 ${students.length}명</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#DCFCE7; color:#10B981;">🎯</div>
        <div class="stat-kpi-info">
          <div class="label">전교 평균 정답률</div>
          <div class="value">${schoolAvgAcc}%</div>
          <div class="sub">정답 ${schoolTotalCorrect.toLocaleString()}문항</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#FEF3C7; color:#D97706;">🔥</div>
        <div class="stat-kpi-info">
          <div class="label">최다 문제 풀이 학급</div>
          <div class="value">${topSolvedClass.classId}</div>
          <div class="sub">총 ${topSolvedClass.totalSolved}문항 돌파!</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#FCE7F3; color:#DB2777;">💎</div>
        <div class="stat-kpi-info">
          <div class="label">최고 정확도 학급</div>
          <div class="value">${topAccClass.classId}</div>
          <div class="sub">학급 정답률 ${topAccClass.accuracy.toFixed(1)}%</div>
        </div>
      </div>
    `;
  }

  // 학급 랭킹 정렬
  const gradeFilter = document.getElementById('classRankGradeFilter')?.value || 'all';
  const classSortBy = document.getElementById('classRankSortBy')?.value || 'classId';

  let filteredClasses = classAgg.filter(c => gradeFilter === 'all' || String(c.grade) === gradeFilter);
  if (classSortBy === 'classId') {
    filteredClasses.sort((a, b) => a.classId.localeCompare(b.classId));
  } else {
    filteredClasses.sort((a, b) => (b[classSortBy] || 0) - (a[classSortBy] || 0));
  }

  const classTbody = document.getElementById('classRankingTableBody');
  if (classTbody) {
    classTbody.innerHTML = filteredClasses.map((c, idx) => {
      const rankNum = idx + 1;
      const medalCls = rankNum <= 3 && classSortBy !== 'classId' ? `rank-${rankNum}` : '';
      return `
        <tr>
          <td><span class="rank-medal ${medalCls}">${rankNum}</span></td>
          <td><span class="profile-class-tag">${c.classId}</span></td>
          <td>${c.activeCount}명</td>
          <td><strong>${c.totalSolved.toLocaleString()}문항</strong></td>
          <td>${c.totalCorrect.toLocaleString()}문항</td>
          <td>${getAccuracyBadgeHtml(c.accuracy)}</td>
          <td>Lv.${c.avgLevel.toFixed(1)}</td>
          <td>🔥 ${c.avgStreak.toFixed(1)}일</td>
          <td>${c.bestCat}</td>
        </tr>
      `;
    }).join('');
  }

  // 개인별 랭킹 (프라이버시 적용: 학생에게는 닉네임만, 선생님에게는 닉네임+실명)
  const colHeader = document.getElementById('rankingNameColHeader');
  if (colHeader) {
    colHeader.textContent = isTeacher ? '닉네임 (실명 - 교사 열람)' : '닉네임';
  }

  const stuClassFilter = document.getElementById('studentRankClassFilter')?.value || 'all';
  const stuSortBy = document.getElementById('studentRankSortBy')?.value || 'xp';

  let filteredStudents = students.filter(s => stuClassFilter === 'all' || s.classId === stuClassFilter);
  filteredStudents.sort((a, b) => {
    if (stuSortBy === 'accuracy') {
      const accA = a.totalSolved >= 5 ? a.totalCorrect / a.totalSolved : -1;
      const accB = b.totalSolved >= 5 ? b.totalCorrect / b.totalSolved : -1;
      return accB - accA || b.totalSolved - a.totalSolved;
    }
    return (b[stuSortBy] || 0) - (a[stuSortBy] || 0);
  });

  const stuTbody = document.getElementById('studentRankingTableBody');
  if (stuTbody) {
    stuTbody.innerHTML = filteredStudents.map((s, idx) => {
      const rankNum = idx + 1;
      const medalCls = rankNum <= 3 ? `rank-${rankNum}` : '';
      const acc = s.totalSolved > 0 ? (s.totalCorrect / s.totalSolved) * 100 : 0;
      const tObj = getLevelTitleObj(s.level);
      const isMe = state.currentUser && s.email === state.currentUser.email;
      const displayName = formatStudentDisplayName(s, false);
      return `
        <tr style="${isMe ? 'background:#F5F3FF;' : ''}">
          <td><span class="rank-medal ${medalCls}">${rankNum}</span></td>
          <td><span class="profile-class-tag">${s.classId}</span></td>
          <td><strong>${displayName}</strong> ${isMe ? '<span style="font-size:0.72rem; color:#7C3AED;">(나)</span>' : ''}</td>
          <td><strong>Lv.${s.level}</strong> <span style="font-size:0.76rem; color:#DB2777;">${tObj.title}</span></td>
          <td>🔥 ${s.streakDays || 1}일</td>
          <td><strong>${s.totalSolved}문항</strong></td>
          <td>${s.totalCorrect}문항</td>
          <td>${getAccuracyBadgeHtml(acc)}</td>
          <td>${s.maxCombo}연속</td>
        </tr>
      `;
    }).join('');
  }
}

// ============================================================================
// 12. [탭 4] 👩‍🏫 교사용 통합 통계 센터 (기간별 필터 / 반별 / 주간 / 분야별 / 일별 / 학생별)
// ============================================================================
function setAdminPeriod(period) {
  state.adminPeriod = period;
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.period === period);
  });
  const customWrap = document.getElementById('customDateWrap');
  if (customWrap) {
    customWrap.style.display = period === 'customDay' ? 'flex' : 'none';
  }
  renderAdminTab();
}

function getPeriodDateRange(period = state.adminPeriod) {
  const today = new Date();
  const todayStr = getLocalDateStr(today);

  if (period === 'today') {
    return { start: todayStr, end: todayStr, label: `오늘 (${todayStr})` };
  }
  if (period === 'thisWeek') {
    const day = today.getDay(); // 0(일)~6(토)
    const diffToMon = day === 0 ? 6 : day - 1;
    const mon = new Date(today);
    mon.setDate(today.getDate() - diffToMon);
    const startStr = getLocalDateStr(mon);
    return { start: startStr, end: todayStr, label: `이번 주 (${startStr} ~ ${todayStr})` };
  }
  if (period === 'thisMonth') {
    const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    return { start: startStr, end: todayStr, label: `이번 달 (${startStr} ~ ${todayStr})` };
  }
  if (period === 'last7') {
    const startStr = getDateNDaysAgoStr(6);
    return { start: startStr, end: todayStr, label: `최근 7일 (${startStr} ~ ${todayStr})` };
  }
  if (period === 'last30') {
    const startStr = getDateNDaysAgoStr(29);
    return { start: startStr, end: todayStr, label: `최근 30일 (${startStr} ~ ${todayStr})` };
  }
  if (period === 'customDay') {
    const customVal = document.getElementById('adminCustomDateInput')?.value || todayStr;
    return { start: customVal, end: customVal, label: `특정 일자 (${customVal})` };
  }
  return { start: '2000-01-01', end: '2099-12-31', label: '전체 누적 (All Time)' };
}

function getFilteredLogsByPeriod(period = state.adminPeriod) {
  const { start, end } = getPeriodDateRange(period);
  return getCombinedLogsList().filter(l => l.date >= start && l.date <= end);
}

function toggleDemoStudents(checked) {
  state.showDemoData = checked;
  localStorage.setItem(STORAGE_KEYS.SHOW_DEMO, JSON.stringify(checked));
  renderAdminTab();
  renderRankingTab();
  showToast(checked ? '📊 1-1 ~ 3-4 예시 학생 데이터가 포함되었습니다.' : '📊 실제 접속한 학생 데이터만 표시합니다.');
}

function renderAdminTab() {
  const rangeInfo = getPeriodDateRange(state.adminPeriod);
  const labelEl = document.getElementById('adminPeriodLabel');
  if (labelEl) labelEl.textContent = `조회 기준: ${rangeInfo.label}`;

  const students = getCombinedStudentsList();
  const periodLogs = getFilteredLogsByPeriod(state.adminPeriod);

  // 선택 기간 핵심 KPI 4칸
  const activeEmailSet = new Set(periodLogs.map(l => l.email));
  const periodSolved = periodLogs.length;
  const periodCorrect = periodLogs.filter(l => l.isCorrect).length;
  const periodAcc = periodSolved > 0 ? ((periodCorrect / periodSolved) * 100).toFixed(1) : '0.0';
  const avgStreak = students.length > 0
    ? (students.reduce((s, u) => s + (u.streakDays || 1), 0) / students.length).toFixed(1)
    : '0.0';

  const kpiWrap = document.getElementById('adminKpiCards');
  if (kpiWrap) {
    kpiWrap.innerHTML = `
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#EDE9FE; color:#7C3AED;">👩‍🎓</div>
        <div class="stat-kpi-info">
          <div class="label">기간 내 응시 학생수</div>
          <div class="value">${activeEmailSet.size}명 <span style="font-size:0.82rem; color:#64748B;">/ 총 ${students.length}명</span></div>
          <div class="sub">${rangeInfo.label}</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#FEF3C7; color:#D97706;">📝</div>
        <div class="stat-kpi-info">
          <div class="label">기간 내 푼 퀴즈 수</div>
          <div class="value">${periodSolved.toLocaleString()}문항</div>
          <div class="sub">정답 ${periodCorrect.toLocaleString()}문항</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#DCFCE7; color:#10B981;">🎯</div>
        <div class="stat-kpi-info">
          <div class="label">기간 내 평균 정답률</div>
          <div class="value">${periodAcc}%</div>
          <div class="sub">6대 분야 통합 정확도</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#FFF7ED; color:#EA580C;">🔥</div>
        <div class="stat-kpi-info">
          <div class="label">전교 평균 연속 도전일</div>
          <div class="value">${avgStreak}일 연속</div>
          <div class="sub">최장 연속 도전: ${Math.max(1, ...students.map(s => s.maxStreakDays || 1))}일</div>
        </div>
      </div>
    `;
  }

  renderAdminClassSubPanel(students, periodLogs);
  renderAdminWeeklySubPanel(students);
  renderAdminCategorySubPanel(periodLogs);
  renderAdminDailySubPanel();
  renderAdminStudentSubPanel(students, periodLogs);
}

// [서브패널 1] 반별 현황 (1-1 ~ 3-4)
function renderAdminClassSubPanel(students, periodLogs) {
  const tbody = document.getElementById('adminClassTableBody');
  if (!tbody) return;

  tbody.innerHTML = SCHOOL_CLASSES.map(c => {
    const classStudents = students.filter(s => s.classId === c.classId);
    const classLogs = periodLogs.filter(l => l.classId === c.classId);
    const activeCount = new Set(classLogs.map(l => l.email)).size;
    const solved = classLogs.length;
    const correct = classLogs.filter(l => l.isCorrect).length;
    const acc = solved > 0 ? (correct / solved) * 100 : 0;
    const avgLevel = classStudents.length > 0
      ? (classStudents.reduce((s, u) => s + (u.level || 1), 0) / classStudents.length).toFixed(1)
      : '1.0';
    const avgStreak = classStudents.length > 0
      ? (classStudents.reduce((s, u) => s + (u.streakDays || 1), 0) / classStudents.length).toFixed(1)
      : '0.0';

    const catCells = CATEGORIES.map(cat => {
      const cLogs = classLogs.filter(l => l.category === cat.id);
      if (cLogs.length === 0) return `<td style="color:#94A3B8; font-size:0.76rem;">-</td>`;
      const cCorr = cLogs.filter(l => l.isCorrect).length;
      const r = Math.round((cCorr / cLogs.length) * 100);
      return `<td style="font-size:0.78rem;"><strong>${r}%</strong> <span style="color:#64748B;">(${cCorr}/${cLogs.length})</span></td>`;
    }).join('');

    return `
      <tr>
        <td><span class="profile-class-tag">${c.classId}</span></td>
        <td><strong>${activeCount}명</strong> <span style="color:#64748B; font-size:0.75rem;">(등록 ${classStudents.length}명)</span></td>
        <td><strong>${solved.toLocaleString()}문항</strong></td>
        <td>${correct.toLocaleString()}문항</td>
        <td>${getAccuracyBadgeHtml(acc)}</td>
        <td>Lv.${avgLevel}</td>
        <td>🔥 ${avgStreak}일</td>
        ${catCells}
      </tr>
    `;
  }).join('');
}

// [서브패널 2] 주간 리포트 (최근 7일 vs 이전 7일 비교)
function renderAdminWeeklySubPanel(students) {
  const allLogs = getCombinedLogsList();
  const todayStr = getLocalDateStr();
  const thisWeekStart = getDateNDaysAgoStr(6);
  const prevWeekStart = getDateNDaysAgoStr(13);
  const prevWeekEnd = getDateNDaysAgoStr(7);

  const thisWeekLogs = allLogs.filter(l => l.date >= thisWeekStart && l.date <= todayStr);
  const prevWeekLogs = allLogs.filter(l => l.date >= prevWeekStart && l.date <= prevWeekEnd);

  const highlightBox = document.getElementById('adminWeeklyHighlightBox');
  if (highlightBox) {
    const twUsers = new Set(thisWeekLogs.map(l => l.email)).size;
    const twSolved = thisWeekLogs.length;
    const pwSolved = prevWeekLogs.length;
    const diff = twSolved - pwSolved;
    const diffStr = diff >= 0 ? `+${diff}문항 증가 📈` : `${diff}문항 감소`;

    // 주간 전교 MVP 학생 계산
    const countByEmail = {};
    thisWeekLogs.forEach(l => {
      countByEmail[l.email] = (countByEmail[l.email] || 0) + 1;
    });
    let mvpStudent = students[0];
    let mvpCount = 0;
    students.forEach(s => {
      if ((countByEmail[s.email] || 0) > mvpCount) {
        mvpCount = countByEmail[s.email];
        mvpStudent = s;
      }
    });

    highlightBox.innerHTML = `
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#EDE9FE; color:#7C3AED;">📅</div>
        <div class="stat-kpi-info">
          <div class="label">최근 7일 총 풀이 수</div>
          <div class="value">${twSolved.toLocaleString()}문항</div>
          <div class="sub">전주(${pwSolved}문항) 대비 ${diffStr}</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#DCFCE7; color:#10B981;">🙋‍♀️</div>
        <div class="stat-kpi-info">
          <div class="label">최근 7일 응시 학생</div>
          <div class="value">${twUsers}명</div>
          <div class="sub">기간: ${thisWeekStart} ~ ${todayStr}</div>
        </div>
      </div>
      <div class="stat-kpi-card">
        <div class="stat-kpi-icon" style="background:#FEF3C7; color:#D97706;">👑</div>
        <div class="stat-kpi-info">
          <div class="label">이번 주 전교 다독다풀 MVP</div>
          <div class="value" style="font-size:1.12rem;">${mvpStudent ? `${mvpStudent.classId} ${mvpStudent.nickname} (${mvpStudent.name})` : '-'}</div>
          <div class="sub">최근 7일간 ${mvpCount}문항 도전!</div>
        </div>
      </div>
    `;
  }

  const tbody = document.getElementById('adminWeeklyTableBody');
  if (!tbody) return;

  tbody.innerHTML = SCHOOL_CLASSES.map(c => {
    const cwLogs = thisWeekLogs.filter(l => l.classId === c.classId);
    const pwLogs = prevWeekLogs.filter(l => l.classId === c.classId);
    const cwActive = new Set(cwLogs.map(l => l.email)).size;
    const cwSolved = cwLogs.length;
    const pwSolved = pwLogs.length;
    const diff = cwSolved - pwSolved;
    const cwCorrect = cwLogs.filter(l => l.isCorrect).length;
    const cwAcc = cwSolved > 0 ? (cwCorrect / cwSolved) * 100 : 0;

    // 반별 MVP 찾기
    const classMembers = students.filter(s => s.classId === c.classId);
    let topMember = null;
    let topCnt = 0;
    classMembers.forEach(m => {
      const cnt = cwLogs.filter(l => l.email === m.email).length;
      if (cnt > topCnt) {
        topCnt = cnt;
        topMember = m;
      }
    });

    const diffBadge = diff > 0
      ? `<span style="color:#059669; font-weight:800;">▲ +${diff}</span>`
      : diff < 0
      ? `<span style="color:#DC2626; font-weight:800;">▼ ${diff}</span>`
      : `<span style="color:#64748B;">- 0</span>`;

    return `
      <tr>
        <td><span class="profile-class-tag">${c.classId}</span></td>
        <td>${cwActive}명</td>
        <td><strong>${cwSolved}문항</strong></td>
        <td>${pwSolved}문항</td>
        <td>${diffBadge}</td>
        <td>${getAccuracyBadgeHtml(cwAcc)}</td>
        <td>${topMember ? `<strong>${topMember.nickname}</strong> (${topMember.name}, ${topCnt}문항)` : '-'}</td>
      </tr>
    `;
  }).join('');
}

// [서브패널 3] 분야별 통계
function renderAdminCategorySubPanel(periodLogs) {
  const tbody = document.getElementById('adminCategoryTableBody');
  if (!tbody) return;

  tbody.innerHTML = CATEGORIES.map(cat => {
    const qBankCount = state.questions.filter(q => q.category === cat.id).length;
    const catLogs = periodLogs.filter(l => l.category === cat.id);
    const activeUsers = new Set(catLogs.map(l => l.email)).size;
    const solved = catLogs.length;
    const correct = catLogs.filter(l => l.isCorrect).length;
    const acc = solved > 0 ? (correct / solved) * 100 : 0;

    const gradeAccs = [1, 2, 3].map(g => {
      const gLogs = catLogs.filter(l => String(l.classId).startsWith(`${g}-`));
      if (gLogs.length === 0) return '-';
      const gCorr = gLogs.filter(l => l.isCorrect).length;
      return `${((gCorr / gLogs.length) * 100).toFixed(1)}% (${gCorr}/${gLogs.length})`;
    });

    return `
      <tr>
        <td><strong>${cat.icon} ${cat.name}</strong></td>
        <td>${qBankCount}문항</td>
        <td>${activeUsers}명</td>
        <td><strong>${solved.toLocaleString()}문항</strong></td>
        <td>${correct.toLocaleString()}문항</td>
        <td>${getAccuracyBadgeHtml(acc)}</td>
        <td>${gradeAccs[0]}</td>
        <td>${gradeAccs[1]}</td>
        <td>${gradeAccs[2]}</td>
      </tr>
    `;
  }).join('');
}

// [서브패널 4] 일별 추이 (Daily Trend Canvas 차트 + 테이블)
function getDailyTrendRows(daysCount = 14) {
  const allLogs = getCombinedLogsList();
  const rows = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const dStr = getDateNDaysAgoStr(i);
    const dLogs = allLogs.filter(l => l.date === dStr);
    const activeStudents = new Set(dLogs.map(l => l.email)).size;
    const solved = dLogs.length;
    const correct = dLogs.filter(l => l.isCorrect).length;
    const acc = solved > 0 ? (correct / solved) * 100 : 0;

    // 가장 활발한 학급
    const classCounts = {};
    const catCounts = {};
    dLogs.forEach(l => {
      classCounts[l.classId] = (classCounts[l.classId] || 0) + 1;
      catCounts[l.category] = (catCounts[l.category] || 0) + 1;
    });
    const topClass = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0];
    const topCatEntry = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
    const topCatObj = topCatEntry ? CATEGORIES.find(c => c.id === topCatEntry[0]) : null;

    rows.push({
      date: dStr,
      dayKor: getDayOfWeekKor(dStr),
      activeStudents,
      solved,
      correct,
      acc,
      topClassStr: topClass ? `${topClass[0]} (${topClass[1]}문항)` : '-',
      topCatStr: topCatObj ? `${topCatObj.icon} ${topCatObj.shortName} (${topCatEntry[1]}문항)` : '-'
    });
  }
  return rows;
}

function renderAdminDailySubPanel() {
  const rows = getDailyTrendRows(14);
  drawDailyTrendChart(rows);

  const tbody = document.getElementById('adminDailyTableBody');
  if (!tbody) return;

  tbody.innerHTML = [...rows].reverse().map(r => `
    <tr>
      <td><strong>${r.date} (${r.dayKor})</strong></td>
      <td><strong>${r.activeStudents}명</strong></td>
      <td><strong>${r.solved.toLocaleString()}문항</strong></td>
      <td>${r.correct.toLocaleString()}문항</td>
      <td>${getAccuracyBadgeHtml(r.acc)}</td>
      <td>${r.topClassStr}</td>
      <td>${r.topCatStr}</td>
    </tr>
  `).join('');
}

function drawDailyTrendChart(rows) {
  const canvas = document.getElementById('dailyTrendCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const padL = 48;
  const padR = 24;
  const padT = 32;
  const padB = 42;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const maxSolved = Math.max(10, ...rows.map(r => r.solved));
  const stepX = chartW / Math.max(1, rows.length - 1);

  // 가로 보조선
  [0, 0.5, 1].forEach(ratio => {
    const y = padT + chartH * (1 - ratio);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '700 11px "Pretendard", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(maxSolved * ratio)}`, padL - 8, y + 4);
  });

  // 막대(응시 학생 수 * 3 스케일) + 꺾은선(푼 퀴즈 수)
  rows.forEach((r, idx) => {
    const x = padL + idx * stepX;
    const barH = (r.solved / maxSolved) * chartH;
    const y = padT + chartH - barH;

    // 막대
    ctx.fillStyle = 'rgba(124, 58, 237, 0.22)';
    ctx.beginPath();
    ctx.roundRect(x - 12, y, 24, barH, 6);
    ctx.fill();

    // 날짜 라벨
    ctx.fillStyle = '#475569';
    ctx.font = '700 11px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(r.date.slice(5), x, H - 16);
  });

  // 꺾은선
  ctx.beginPath();
  rows.forEach((r, idx) => {
    const x = padL + idx * stepX;
    const y = padT + chartH - (r.solved / maxSolved) * chartH;
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = '#7C3AED';
  ctx.lineWidth = 3;
  ctx.stroke();

  // 포인트 및 수치
  rows.forEach((r, idx) => {
    const x = padL + idx * stepX;
    const y = padT + chartH - (r.solved / maxSolved) * chartH;
    ctx.beginPath();
    ctx.arc(x, y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#EC4899';
    ctx.fill();

    ctx.fillStyle = '#1E1B4B';
    ctx.font = '800 11px "Pretendard", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${r.solved}문항(${r.activeStudents}명)`, x, y - 9);
  });
}

// [서브패널 5] 학생별 통계 (닉네임 + 실명 + 기간 내 풀이 + 연속일)
function renderAdminStudentSubPanel(students, periodLogs) {
  const classFilter = document.getElementById('adminStudentClassFilter')?.value || 'all';
  const sortBy = document.getElementById('adminStudentSortBy')?.value || 'classNo';
  const query = (document.getElementById('adminSearchInput')?.value || '').trim().toLowerCase();

  // 학생별 기간 내 풀이 수 매핑
  const periodCountByEmail = {};
  periodLogs.forEach(l => {
    periodCountByEmail[l.email] = (periodCountByEmail[l.email] || 0) + 1;
  });

  let filtered = students.filter(s => {
    if (classFilter !== 'all' && s.classId !== classFilter) return false;
    if (!query) return true;
    return (
      (s.nickname || '').toLowerCase().includes(query) ||
      (s.name || '').toLowerCase().includes(query) ||
      (s.classId || '').toLowerCase().includes(query) ||
      (s.email || '').toLowerCase().includes(query)
    );
  });

  filtered.sort((a, b) => {
    if (sortBy === 'periodSolved') {
      return (periodCountByEmail[b.email] || 0) - (periodCountByEmail[a.email] || 0);
    }
    if (sortBy === 'totalSolved') {
      return (b.totalSolved || 0) - (a.totalSolved || 0);
    }
    if (sortBy === 'accuracy') {
      const accA = a.totalSolved > 0 ? a.totalCorrect / a.totalSolved : 0;
      const accB = b.totalSolved > 0 ? b.totalCorrect / b.totalSolved : 0;
      return accB - accA;
    }
    if (sortBy === 'streakDays') {
      return (b.streakDays || 1) - (a.streakDays || 1);
    }
    return a.classId.localeCompare(b.classId) || (a.studentNo - b.studentNo);
  });

  const tbody = document.getElementById('adminStudentTableBody');
  if (!tbody) return;

  tbody.innerHTML = filtered.map(s => {
    const acc = s.totalSolved > 0 ? (s.totalCorrect / s.totalSolved) * 100 : 0;
    const pSolved = periodCountByEmail[s.email] || 0;

    const catCells = CATEGORIES.map(cat => {
      const st = s.categoryStats?.[cat.id] || { solved: 0, correct: 0 };
      if (st.solved === 0) return `<td style="color:#94A3B8; font-size:0.75rem;">-</td>`;
      const r = Math.round((st.correct / st.solved) * 100);
      return `<td style="font-size:0.76rem;"><strong>${r}%</strong><br/><span style="color:#64748B;">(${st.correct}/${st.solved})</span></td>`;
    }).join('');

    return `
      <tr>
        <td><span class="profile-class-tag">${s.classId}</span></td>
        <td>${s.studentNo}번</td>
        <td><strong style="color:#7C3AED;">${s.nickname || s.name}</strong></td>
        <td>
          <strong>${s.name}</strong><br/>
          <span style="font-size:0.71rem; color:#64748B;">${s.email}</span>
        </td>
        <td><strong>Lv.${s.level}</strong></td>
        <td>🔥 ${s.streakDays || 1}일 <span style="font-size:0.71rem; color:#64748B;">(최고 ${s.maxStreakDays || 1}일)</span></td>
        <td><strong style="color:#D97706;">${pSolved}문항</strong></td>
        <td><strong>${s.totalSolved}문항</strong></td>
        <td>${getAccuracyBadgeHtml(acc)}</td>
        ${catCells}
        <td>
          <button type="button" class="btn-chip" onclick="inspectStudentCertificate('${s.email}')">
            📜 인증서
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function inspectStudentCertificate(email) {
  const students = getCombinedStudentsList();
  const target = students.find(s => s.email === email);
  if (!target) return;
  openCertificateModalForUser(target, target.level, false);
}

function handleAddQuestion(event) {
  event.preventDefault();
  const category = document.getElementById('newQCategory').value;
  const answer = Number(document.getElementById('newQAnswer').value);
  const question = document.getElementById('newQText').value.trim();
  const opt1 = document.getElementById('newQOpt1').value.trim();
  const opt2 = document.getElementById('newQOpt2').value.trim();
  const opt3 = document.getElementById('newQOpt3').value.trim();
  const opt4 = document.getElementById('newQOpt4').value.trim();
  const explanation = document.getElementById('newQExp').value.trim();

  const newQ = {
    id: `custom_${Date.now()}`,
    category,
    difficulty: '보통',
    question,
    options: [opt1, opt2, opt3, opt4],
    answer,
    explanation
  };

  state.questions.push(newQ);
  const customQs = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_QUESTIONS) || '[]');
  customQs.push(newQ);
  localStorage.setItem(STORAGE_KEYS.CUSTOM_QUESTIONS, JSON.stringify(customQs));

  if (state.gasUrl) {
    postToGoogleSheets({ action: 'addQuestion', question: newQ });
  }

  document.getElementById('addQuestionForm').reset();
  refreshAllUI();
  showToast(`✨ 새 문제가 추가되었습니다! (현재 총 ${state.questions.length}문항)`);
}

// ============================================================================
// 13. 교사용 6종 CSV(엑셀) 다운로드 센터 (한글 깨짐 방지 UTF-8 BOM 적용)
// ============================================================================
function triggerCsvDownload(filename, headers, rows) {
  const escapedRows = rows.map(r =>
    r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csvContent = '\uFEFF' + [headers.join(','), ...escapedRows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  showToast(`📥 [${filename}] 다운로드가 완료되었습니다!`);
}

// 1) 반별 현황 CSV
function exportClassStatusCSV() {
  const students = getCombinedStudentsList();
  const periodLogs = getFilteredLogsByPeriod(state.adminPeriod);
  const rangeInfo = getPeriodDateRange(state.adminPeriod);

  const headers = [
    '조회기간', '학급', '등록학생수', '응시학생수', '푼퀴즈수', '정답수', '반정답률(%)',
    '평균레벨', '평균연속도전일',
    '우리학교상식_정답률', '교과융합_정답률', '시사경제_정답률', '세계문화지리_정답률', '과학미래기술_정답률', '예술대중문화_정답률'
  ];

  const rows = SCHOOL_CLASSES.map(c => {
    const classStudents = students.filter(s => s.classId === c.classId);
    const classLogs = periodLogs.filter(l => l.classId === c.classId);
    const activeCount = new Set(classLogs.map(l => l.email)).size;
    const solved = classLogs.length;
    const correct = classLogs.filter(l => l.isCorrect).length;
    const acc = solved > 0 ? ((correct / solved) * 100).toFixed(1) : '0.0';
    const avgLevel = classStudents.length > 0
      ? (classStudents.reduce((s, u) => s + (u.level || 1), 0) / classStudents.length).toFixed(1)
      : '1.0';
    const avgStreak = classStudents.length > 0
      ? (classStudents.reduce((s, u) => s + (u.streakDays || 1), 0) / classStudents.length).toFixed(1)
      : '0.0';

    const catRates = CATEGORIES.map(cat => {
      const cLogs = classLogs.filter(l => l.category === cat.id);
      if (cLogs.length === 0) return '-';
      const cCorr = cLogs.filter(l => l.isCorrect).length;
      return `${((cCorr / cLogs.length) * 100).toFixed(1)}% (${cCorr}/${cLogs.length})`;
    });

    return [
      rangeInfo.label, c.classId, classStudents.length, activeCount,
      solved, correct, acc, avgLevel, avgStreak, ...catRates
    ];
  });

  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_반별현황_${getLocalDateStr()}.csv`, headers, rows);
}

// 2) 주간 리포트 CSV
function exportWeeklyReportCSV() {
  const students = getCombinedStudentsList();
  const allLogs = getCombinedLogsList();
  const todayStr = getLocalDateStr();
  const thisWeekStart = getDateNDaysAgoStr(6);
  const prevWeekStart = getDateNDaysAgoStr(13);
  const prevWeekEnd = getDateNDaysAgoStr(7);

  const thisWeekLogs = allLogs.filter(l => l.date >= thisWeekStart && l.date <= todayStr);
  const prevWeekLogs = allLogs.filter(l => l.date >= prevWeekStart && l.date <= prevWeekEnd);

  const headers = [
    '주간기준', '학급', '이번주_응시학생수', '이번주_푼퀴즈수', '지난주_푼퀴즈수',
    '전주대비_증감', '이번주_정답률(%)', '주간학급MVP_닉네임', '주간학급MVP_실명', 'MVP_풀이수'
  ];

  const rows = SCHOOL_CLASSES.map(c => {
    const cwLogs = thisWeekLogs.filter(l => l.classId === c.classId);
    const pwLogs = prevWeekLogs.filter(l => l.classId === c.classId);
    const cwActive = new Set(cwLogs.map(l => l.email)).size;
    const cwSolved = cwLogs.length;
    const pwSolved = pwLogs.length;
    const diff = cwSolved - pwSolved;
    const cwCorrect = cwLogs.filter(l => l.isCorrect).length;
    const cwAcc = cwSolved > 0 ? ((cwCorrect / cwSolved) * 100).toFixed(1) : '0.0';

    const classMembers = students.filter(s => s.classId === c.classId);
    let topMember = null;
    let topCnt = 0;
    classMembers.forEach(m => {
      const cnt = cwLogs.filter(l => l.email === m.email).length;
      if (cnt > topCnt) {
        topCnt = cnt;
        topMember = m;
      }
    });

    return [
      `${thisWeekStart}~${todayStr}`, c.classId, cwActive, cwSolved, pwSolved,
      diff, cwAcc, topMember ? topMember.nickname : '-', topMember ? topMember.name : '-', topCnt
    ];
  });

  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_주간리포트_${todayStr}.csv`, headers, rows);
}

// 3) 분야별 통계 CSV
function exportCategoryStatsCSV() {
  const periodLogs = getFilteredLogsByPeriod(state.adminPeriod);
  const rangeInfo = getPeriodDateRange(state.adminPeriod);

  const headers = [
    '조회기간', '분야ID', '분야명', '보유문항수', '응시학생수',
    '푼퀴즈수', '정답수', '전체정답률(%)', '1학년_정답률', '2학년_정답률', '3학년_정답률'
  ];

  const rows = CATEGORIES.map(cat => {
    const qBankCount = state.questions.filter(q => q.category === cat.id).length;
    const catLogs = periodLogs.filter(l => l.category === cat.id);
    const activeUsers = new Set(catLogs.map(l => l.email)).size;
    const solved = catLogs.length;
    const correct = catLogs.filter(l => l.isCorrect).length;
    const acc = solved > 0 ? ((correct / solved) * 100).toFixed(1) : '0.0';

    const gradeAccs = [1, 2, 3].map(g => {
      const gLogs = catLogs.filter(l => String(l.classId).startsWith(`${g}-`));
      if (gLogs.length === 0) return '-';
      const gCorr = gLogs.filter(l => l.isCorrect).length;
      return `${((gCorr / gLogs.length) * 100).toFixed(1)}%`;
    });

    return [
      rangeInfo.label, cat.id, cat.name, qBankCount, activeUsers,
      solved, correct, acc, gradeAccs[0], gradeAccs[1], gradeAccs[2]
    ];
  });

  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_분야별통계_${getLocalDateStr()}.csv`, headers, rows);
}

// 4) 일별 추이 CSV
function exportDailyTrendCSV() {
  const rowsData = getDailyTrendRows(30).reverse();
  const headers = ['일자', '요일', '응시학생수', '푼퀴즈수', '정답수', '일평균정답률(%)', '최다참여학급', '최다풀이분야'];
  const rows = rowsData.map(r => [
    r.date, r.dayKor, r.activeStudents, r.solved, r.correct, r.acc.toFixed(1), r.topClassStr, r.topCatStr
  ]);
  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_일별추이_최근30일_${getLocalDateStr()}.csv`, headers, rows);
}

// 5) 학생별 상세 통계 (닉네임 + 실명 + 연속 도전일) CSV
function exportStudentStatsCSV() {
  const students = getCombinedStudentsList();
  const periodLogs = getFilteredLogsByPeriod(state.adminPeriod);
  const rangeInfo = getPeriodDateRange(state.adminPeriod);

  const periodCountByEmail = {};
  periodLogs.forEach(l => {
    periodCountByEmail[l.email] = (periodCountByEmail[l.email] || 0) + 1;
  });

  const headers = [
    '조회기간', '학급', '출석번호', '닉네임(공개)', '실명(교사용)', '이메일',
    '레벨', '경험치(XP)', '연속도전일수', '최고연속도전일',
    '기간내_푼퀴즈수', '누적_푼퀴즈수', '누적_정답수', '전체정확도(%)', '최고콤보',
    '우리학교상식_풀이', '우리학교상식_정답',
    '교과융합_풀이', '교과융합_정답',
    '시사경제_풀이', '시사경제_정답',
    '세계지리_풀이', '세계지리_정답',
    '과학미래_풀이', '과학미래_정답',
    '예술문화_풀이', '예술문화_정답',
    '수집마스코트수', '발급인증서레벨'
  ];

  const rows = students.map(s => {
    const acc = s.totalSolved > 0 ? ((s.totalCorrect / s.totalSolved) * 100).toFixed(1) : '0.0';
    return [
      rangeInfo.label,
      s.classId,
      s.studentNo,
      s.nickname || s.name,
      s.name,
      s.email,
      s.level,
      s.xp,
      s.streakDays || 1,
      s.maxStreakDays || 1,
      periodCountByEmail[s.email] || 0,
      s.totalSolved,
      s.totalCorrect,
      acc,
      s.maxCombo,
      s.categoryStats?.school?.solved || 0, s.categoryStats?.school?.correct || 0,
      s.categoryStats?.curriculum?.solved || 0, s.categoryStats?.curriculum?.correct || 0,
      s.categoryStats?.economy?.solved || 0, s.categoryStats?.economy?.correct || 0,
      s.categoryStats?.world?.solved || 0, s.categoryStats?.world?.correct || 0,
      s.categoryStats?.science?.solved || 0, s.categoryStats?.science?.correct || 0,
      s.categoryStats?.culture?.solved || 0, s.categoryStats?.culture?.correct || 0,
      s.mascots?.length || 0,
      (s.certificates || []).join('/')
    ];
  });

  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_학생별통계_${getLocalDateStr()}.csv`, headers, rows);
}

// 6) 전체 문제은행 CSV
function exportQuestionsCSV() {
  const headers = ['문항ID', '분야ID', '난이도', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호', '해설'];
  const rows = state.questions.map(q => [
    q.id, q.category, q.difficulty || '보통', q.question,
    q.options[0], q.options[1], q.options[2], q.options[3],
    q.answer, q.explanation
  ]);
  triggerCsvDownload(`서울문영여자중학교_퀴즈퀸즈_문제은행_${state.questions.length}문항.csv`, headers, rows);
}

// ============================================================================
// 14. 구글 시트 (Google Apps Script) 클라우드 연동
// ============================================================================
function saveGasUrl() {
  const url = document.getElementById('gasUrlInput').value.trim();
  state.gasUrl = url;
  localStorage.setItem(STORAGE_KEYS.GAS_URL, url);

  const box = document.getElementById('gasStatusBox');
  if (!url) {
    box.textContent = '현재 상태: 로컬 스마트 저장소 모드 (구글 시트 URL 미설정)';
    showToast('구글 시트 URL이 해제되었습니다.');
    return;
  }

  box.textContent = `✅ 구글 시트 웹앱 URL 저장됨: 실시간 연동 활성화 (${url.slice(0, 45)}...)`;
  syncWithGoogleSheets(true);
}

async function postToGoogleSheets(payload) {
  if (!state.gasUrl) return null;
  try {
    const res = await fetch(state.gasUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    return res;
  } catch (e) {
    console.warn('Google Sheets 전송 실패:', e);
    return null;
  }
}

async function syncWithGoogleSheets(showNotification = true) {
  if (!state.gasUrl) {
    if (showNotification) {
      alert('먼저 [⚙️ 구글 시트 & 문제 추가] 탭에서 Google Apps Script 배포 URL을 입력해 주세요!');
    }
    return;
  }

  if (showNotification) showToast('🔄 구글 시트와 데이터 동기화를 진행합니다...');

  if (state.currentUser) {
    await postToGoogleSheets({ action: 'syncUser', user: state.currentUser });
  }

  try {
    const res = await fetch(`${state.gasUrl}?action=getInitialData`);
    if (res.ok) {
      const data = await res.json();
      if (data.users && Array.isArray(data.users)) {
        data.users.forEach(u => {
          if (u.email) state.allUsers[u.email] = u;
        });
        saveUserState();
      }
      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        const existingIds = new Set(state.questions.map(q => q.id));
        data.questions.forEach(q => {
          if (!existingIds.has(q.id)) state.questions.push(q);
        });
      }
      refreshAllUI();
      if (showNotification) showToast('✅ 구글 시트 데이터 동기화가 완료되었습니다!');
    }
  } catch (e) {
    if (showNotification) {
      showToast('📤 현재 기록을 구글 시트로 전송했습니다!');
    }
  }
}

function showToast(message) {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast-msg';
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.3s';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}
