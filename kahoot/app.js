/**
 * ============================================================================
 * MY Kahoot (Seoul Moonyoung Girls' Middle School - 서울문영여자중학교)
 * 실시간 스피드 퀴즈 & 교사용 통계/학생명단 화이트리스트 관리 시스템
 * ============================================================================
 */

const MYKahoot = (() => {
  // 앱 버전: 고칠 때마다 올려요 (화면 위 v 표시에 쓰여요). 바뀐 내용은 README.md 맨 아래 '버전 기록'에 적어요.
  const APP_VERSION = '1.1';

  // 로컬 스토리지 키 정의
  const STORAGE_KEYS = {
    QUIZ_SETS: 'my_kahoot_quiz_sets_v1',
    ROSTER: 'my_kahoot_student_roster_v1',
    HISTORY: 'my_kahoot_quiz_history_v1',
    SETTINGS: 'my_kahoot_settings_v1',
    FIREBASE_CFG: 'my_kahoot_firebase_cfg_v1',
    LIVE_ROOM: 'my_kahoot_live_room_v1'
  };

  // 멀티탭/새창 실시간 연동 채널 (같은 PC에서 전자칠판 창 <-> 학생 테스트 창 즉시 연동)
  const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('my_kahoot_live_channel') : null;

  // 기본 보안 및 수업 설정 (@smy.ms.kr 도메인 및 사전 등록 명단 전용 로그인)
  let settings = {
    allowedDomain: '@smy.ms.kr',
    strictRosterOnly: true,
    showQuestionsOnStudent: true,
    soundEnabled: true
  };

  // 사전 등록 학생 명단 (학년, 반, 번호, 이름, 이메일)
  let studentRoster = [];

  // 퀴즈 세트 목록 및 현재 선택된 퀴즈 인덱스
  let quizSets = [];
  let selectedQuizIndex = 0;
  let editingQuestionIndex = -1;

  // 완료된 퀴즈 세션 히스토리 (교사 통계 대시보드용)
  let quizHistory = [];

  // Firebase 기본 클라우드 설정 (my-kahoot-smy 프로젝트 자동 연결)
  const DEFAULT_FIREBASE_CONFIG = {
    apiKey: 'AIzaSyDE-zsT6njzKpoGLl3Izw0CxPcpDepcO4g',
    authDomain: 'my-kahoot-smy.firebaseapp.com',
    databaseURL: 'https://my-kahoot-smy-default-rtdb.firebaseio.com',
    projectId: 'my-kahoot-smy',
    storageBucket: 'my-kahoot-smy.firebasestorage.app',
    messagingSenderId: '905782620870',
    appId: '1:905782620870:web:c8a52bb0ec186ddba71dc7'
  };

  // 교사 계정 (이 계정으로 Google 로그인해야 교사 페이지·전자칠판·명단을 쓸 수 있어요)
  const TEACHER_EMAILS = ['tfellow@gmail.com', 'tfellow@smy.ms.kr', 'engwords@smy.ms.kr'];
  // 예전 주소(Firebase Hosting)와 새 주소(GitHub Pages)
  const OLD_HOST = 'my-kahoot-smy.web.app';
  const NEW_BASE_URL = 'https://tfellow.github.io/web/kahoot/';
  const SAMPLE_HISTORY_LABEL = '2026-10-28 14:20 (2학년 7반)';
  let teacherDataReady = false;
  let teacherDataPushTimer = null;
  let authUser = null;
  let resolveAuthReady = null;
  const authReady = new Promise(r => { resolveAuthReady = r; });
  let teacherRosterSubscribed = false;
  let hostWriteWarned = false;

  // Firebase 인스턴스 상태
  let firebaseApp = null;
  let firebaseAuth = null;
  let firebaseDb = null;
  let isFirebaseConnected = false;
  let currentFirebasePinRef = null;
  let currentFirebasePin = '';

  // 현재 진행 중인 라이브 퀴즈방 상태 (호스트용)
  let liveRoom = {
    pin: '',
    quizId: '',
    quizTitle: '',
    status: 'IDLE', // IDLE | LOBBY | QUESTION | RESULT | SCOREBOARD | PODIUM
    currentQIndex: 0,
    questionStartedAt: 0,
    timeLimit: 20,
    timerInterval: null,
    botTimers: [],
    players: {}, // key: emailId -> { grade, classNum, studentNum, name, email, score, streak, maxStreak, prevRank, answers: { [qIdx]: { choice, timeSec, correct, points, streakBonus } } }
    showAllFinalRanks: false // 기본값 false: 1등~10등만 표시, 버튼 클릭 시 true로 전체 표시
  };

  // 현재 접속한 학생 상태 (학생 뷰용)
  let currentStudent = {
    verified: false,
    grade: 2,
    classNum: 7,
    studentNum: 1,
    name: '',
    email: '',
    pin: '',
    lastAnsweredQIndex: -1
  };

  // ==================== Web Audio API 사운드 효과 & BGM 합성기 ====================
  const SoundFX = (() => {
    let ctx = null;
    let bgmTimer = null;
    let bgmStep = 0;

    function getCtx() {
      if (!settings.soundEnabled) return null;
      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) ctx = new AudioCtx();
      }
      if (ctx && ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function playTone(freq, duration = 0.15, type = 'triangle', gainVal = 0.12, delay = 0) {
      const c = getCtx();
      if (!c) return;
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime + delay);
      gain.gain.setValueAtTime(gainVal, c.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(c.currentTime + delay);
      osc.stop(c.currentTime + delay + duration);
    }

    function playJoinPop() {
      playTone(523.25, 0.1, 'sine', 0.15, 0);
      playTone(659.25, 0.14, 'sine', 0.15, 0.08);
    }

    function playTick(urgent = false) {
      playTone(urgent ? 880 : 440, 0.08, 'square', urgent ? 0.12 : 0.07, 0);
    }

    function playReveal() {
      playTone(392.0, 0.12, 'triangle', 0.16, 0);
      playTone(523.25, 0.15, 'triangle', 0.18, 0.1);
      playTone(659.25, 0.28, 'triangle', 0.2, 0.2);
    }

    function playFanfare() {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((n, idx) => {
        playTone(n, 0.25, 'triangle', 0.2, idx * 0.14);
      });
    }

    function startLobbyBGM() {
      stopBGM();
      if (!settings.soundEnabled) return;
      // 경쾌한 카훗풍 베이스라인 루프
      const melody = [261.63, 329.63, 392.00, 329.63, 293.66, 369.99, 440.00, 369.99];
      bgmStep = 0;
      bgmTimer = setInterval(() => {
        if (!settings.soundEnabled) return;
        const freq = melody[bgmStep % melody.length];
        playTone(freq, 0.18, 'triangle', 0.06, 0);
        bgmStep++;
      }, 320);
    }

    function stopBGM() {
      if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
    }

    return { playJoinPop, playTick, playReveal, playFanfare, startLobbyBGM, stopBGM };
  })();

  // ==================== 초기 샘플 데이터 생성 ====================
  function getDefaultRoster() {
    const names7 = [
      '김서연', '이서윤', '박지우', '최서현', '정하은',
      '강민서', '조하윤', '윤지유', '장채원', '임수아',
      '한지아', '오지민', '서다은', '신예은', '권수빈',
      '황지안', '안소율', '송예린', '전유나', '홍시은'
    ];
    const roster = names7.map((name, i) => ({
      grade: 2,
      classNum: 7,
      studentNum: i + 1,
      name,
      email: `207${String(i + 1).padStart(2, '0')}@smy.ms.kr`
    }));

    // 반별 누적 비교 시연을 위해 2학년 6반 샘플 학생 5명 추가
    const names6 = ['김가은', '이나은', '박다인', '최아린', '정소윤'];
    names6.forEach((name, i) => {
      roster.push({
        grade: 2,
        classNum: 6,
        studentNum: i + 1,
        name,
        email: `206${String(i + 1).padStart(2, '0')}@smy.ms.kr`
      });
    });

    return roster;
  }

  function getDefaultQuizSets() {
    return [
      {
        id: 'quiz_moonyoung_sample_1',
        title: '서울문영여중 2학년 영어·교양 스피드 퀴즈 (Taxes & School)',
        createdAt: '2026-10-28',
        questions: [
          {
            question: '우리 학교(서울문영여자중학교)의 영문 이니셜을 딴 이 실시간 퀴즈 프로그램의 이름은?',
            options: ['MY Kahoot', 'SM Kahoot', 'Girl Kahoot', 'Seoul Quiz'],
            answer: 0,
            timeLimit: 20,
            multiplier: 1,
            explanation: 'Moonyoung의 이니셜 MY를 활용한 MY Kahoot입니다!'
          },
          {
            question: 'Citizens pay ______ to the government to fund public services such as schools and roads.',
            options: ['tuition', 'taxes', 'fines', 'tips'],
            answer: 1,
            timeLimit: 20,
            multiplier: 1,
            explanation: '세금(taxes)은 학교, 도로 등 공공 서비스를 위해 정부에 납부하는 비용입니다.'
          },
          {
            question: '물이 액체에서 기체(수증기)로 상태가 변할 때 주변에서 흡수하는 열에너지는?',
            options: ['응고열', '액화열', '기화열', '융해열'],
            answer: 2,
            timeLimit: 15,
            multiplier: 1,
            explanation: '액체가 기체로 기화할 때 흡수하는 열을 기화열이라고 합니다.'
          },
          {
            question: '다음 중 문맥상 어법이 올바른 영어 문장은 무엇일까요?',
            options: [
              'She don\'t like coffee.',
              'He goes to school by bus every day.',
              'They was happy yesterday.',
              'I have saw that movie.'
            ],
            answer: 1,
            timeLimit: 20,
            multiplier: 1,
            explanation: '3인칭 단수 주어 He 뒤에는 현재시제 동사 goes가 옵니다.'
          },
          {
            question: '[🔥2배 점수 마지막 문제!] 일차함수 y = 3x - 6 의 그래프에서 x절편과 y절편의 합은?',
            options: ['-4', '4', '-6', '2'],
            answer: 0,
            timeLimit: 20,
            multiplier: 2,
            explanation: 'x절편은 2, y절편은 -6이므로 두 값의 합은 2 + (-6) = -4입니다.'
          }
        ]
      }
    ];
  }

  // ==================== 로컬 스토리지 로드 및 저장 ====================
  function loadStateFromStorage() {
    try {
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (savedSettings) settings = { ...settings, ...JSON.parse(savedSettings) };

      const savedRoster = localStorage.getItem(STORAGE_KEYS.ROSTER);
      studentRoster = savedRoster ? JSON.parse(savedRoster) : getDefaultRoster();

      const savedQuizzes = localStorage.getItem(STORAGE_KEYS.QUIZ_SETS);
      quizSets = savedQuizzes ? JSON.parse(savedQuizzes) : getDefaultQuizSets();

      // 이미 업로드된 '시간을 나타내는 부사절' (공식 카훗 템플릿) 문항들의 정답/시간 자동 보정
      const correctAnswersForAdverbClause = [0, 1, 1, 3, 0, 2, 1, 2, 0, 1]; // 1번, 2번, 2번, 4번, 1번, 3번, 2번, 3번, 1번, 2번
      let repaired = false;
      quizSets.forEach(qs => {
        if (qs.title && qs.title.includes('부사절') && Array.isArray(qs.questions)) {
          qs.questions.forEach((q, idx) => {
            if (idx < correctAnswersForAdverbClause.length && q.answer !== correctAnswersForAdverbClause[idx]) {
              q.answer = correctAnswersForAdverbClause[idx];
              q.timeLimit = 30;
              repaired = true;
            }
          });
        }
      });
      if (repaired) {
        localStorage.setItem(STORAGE_KEYS.QUIZ_SETS, JSON.stringify(quizSets));
      }

      const savedHistory = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (savedHistory) {
        quizHistory = JSON.parse(savedHistory);
      } else {
        quizHistory = [];
        createInitialSampleHistory();
      }
    } catch (e) {
      console.error('데이터 로드 중 오류:', e);
      studentRoster = getDefaultRoster();
      quizSets = getDefaultQuizSets();
    }
  }

  function saveStateToStorage() {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (!authUser || isTeacherEmail(authUser.email)) {
      localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(studentRoster));
    }
    localStorage.setItem(STORAGE_KEYS.QUIZ_SETS, JSON.stringify(quizSets));
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(quizHistory));
    scheduleTeacherDataPush();
  }

  // 퀴즈 세트·수업 기록·설정을 선생님 전용 서버 공간에 저장해요 (다른 컴퓨터·새 주소에서도 그대로 보여요).
  function scheduleTeacherDataPush() {
    if (!teacherDataReady || !isFirebaseConnected || !firebaseDb || !(authUser && isTeacherEmail(authUser.email))) return;
    clearTimeout(teacherDataPushTimer);
    teacherDataPushTimer = setTimeout(pushTeacherData, 800);
  }

  function cloudSafe(v) {
    return JSON.parse(JSON.stringify(v === undefined ? null : v));
  }

  function pushTeacherData() {
    if (!firebaseDb) return Promise.resolve();
    try {
      return firebaseDb.ref('teacherData').set({
        quizSets: cloudSafe(quizSets),
        quizHistory: cloudSafe(quizHistory),
        settings: cloudSafe(settings),
        updatedAt: new Date().toISOString()
      }).then(() => true).catch(err => { console.warn('teacherData 저장 실패', err); return false; });
    } catch (err) {
      console.warn('teacherData 저장 실패', err);
      return Promise.resolve(false);
    }
  }

  function toList(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v && typeof v === 'object') return Object.values(v).filter(Boolean);
    return [];
  }

  // 로그인할 때 이 컴퓨터 기록과 서버 기록을 합쳐요. 같은 퀴즈(id)는 서버 쪽을 써요.
  async function syncTeacherDataOnLogin() {
    if (!isFirebaseConnected || !firebaseDb) return;
    let cloud = null;
    try {
      cloud = (await firebaseDb.ref('teacherData').once('value')).val();
    } catch (err) {
      console.warn('teacherData 읽기 실패', err);
      return;
    }
    const defaultIds = new Set(getDefaultQuizSets().map(q => q.id));
    const cloudQuizzes = toList(cloud && cloud.quizSets).map(q => ({ ...q, questions: toList(q.questions) }));
    const cloudHistory = toList(cloud && cloud.quizHistory);

    const mergedQuizzes = [...cloudQuizzes];
    const seenQuiz = new Set(cloudQuizzes.map(q => q.id));
    quizSets.forEach(q => {
      if (!q || seenQuiz.has(q.id)) return;
      if (cloudQuizzes.length > 0 && defaultIds.has(q.id)) return; // 새 컴퓨터의 기본 샘플 퀴즈는 올리지 않아요
      mergedQuizzes.push(q);
      seenQuiz.add(q.id);
    });

    const mergedHistory = [...cloudHistory];
    const seenSess = new Set(cloudHistory.map(h => h.sessionId));
    quizHistory.forEach(h => {
      if (!h || seenSess.has(h.sessionId)) return;
      if (cloudHistory.length > 0 && h.playedAt === SAMPLE_HISTORY_LABEL) return;
      mergedHistory.push(h);
      seenSess.add(h.sessionId);
    });

    if (mergedQuizzes.length > 0) quizSets = mergedQuizzes;
    quizHistory = mergedHistory;
    if (cloud && cloud.settings) settings = { ...settings, ...cloud.settings };
    if (selectedQuizIndex >= quizSets.length) selectedQuizIndex = 0;

    teacherDataReady = true;
    saveStateToStorage();
    const saved = await pushTeacherData();

    if (document.getElementById('view-teacher')?.classList.contains('active')) {
      renderQuizSetList();
      renderQuestionEditorList();
      renderStatsDashboard();
    }

    if (window.location.hostname === OLD_HOST) {
      if (!saved) {
        alert('서버에 저장하지 못했어요. 인터넷 연결을 확인하고 새로고침(Ctrl+F5)한 뒤 다시 시도해 주세요. 이 컴퓨터의 기록은 그대로 있어요.');
        return;
      }
      alert(`퀴즈 ${quizSets.length}개와 수업 기록 ${quizHistory.length}건을 서버에 저장했어요.\n이제 새 주소로 이동할게요:\n${NEW_BASE_URL}`);
      window.location.href = NEW_BASE_URL;
    }
  }

  // 초기 실행 시 교사 대시보드 통계를 바로 확인해볼 수 있도록 샘플 이력 1건 생성
  function createInitialSampleHistory() {
    const sampleQuiz = quizSets[0];
    if (!sampleQuiz) return;
    const class7Students = studentRoster.filter(s => s.classNum === 7);
    const sessionRecord = buildSimulatedSessionRecord(sampleQuiz, class7Students, SAMPLE_HISTORY_LABEL);
    quizHistory.unshift(sessionRecord);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(quizHistory));
  }

  // ==================== 스피드 점수 & 연속 정답(Streak) 계산 공식 ====================
  /**
   * 빨리 맞힐수록 높은 점수를 부여하는 MY Kahoot 핵심 스피드 점수 계산 함수
   * @param {boolean} isCorrect 정답 여부
   * @param {number} elapsedSec 문제 출제 후 선택까지 걸린 시간(초, 소수점 2자리)
   * @param {number} timeLimit 문항 제한시간(초)
   * @param {number} multiplier 점수 배수 (기본 1, 2배 찬스 2)
   * @param {number} newStreak 이번 문항 포함 연속 정답 횟수
   */
  function calculateSpeedScore(isCorrect, elapsedSec, timeLimit, multiplier = 1, newStreak = 0) {
    if (!isCorrect) {
      return { basePoints: 0, streakBonus: 0, totalPoints: 0 };
    }
    const clampedTime = Math.max(0, Math.min(elapsedSec, timeLimit));
    const speedRatio = 1 - (clampedTime / timeLimit) * 0.5; // 0초일 때 100%, 제한시간 직전일 때 50%
    const basePoints = Math.round(1000 * multiplier * speedRatio);

    let streakBonus = 0;
    if (newStreak === 2) streakBonus = 100;
    else if (newStreak === 3) streakBonus = 200;
    else if (newStreak === 4) streakBonus = 300;
    else if (newStreak >= 5) streakBonus = 500;

    return {
      basePoints,
      streakBonus,
      totalPoints: basePoints + streakBonus
    };
  }

  // ==================== 화면 전환 및 초기화 ====================
  function switchMainView(viewName) {
    if ((viewName === 'teacher' || viewName === 'host') && !isTeacherSignedIn()) {
      requireTeacher(() => switchMainView(viewName));
      return;
    }
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.add('active');

    if (viewName !== 'host') {
      SoundFX.stopBGM();
    }

    if (viewName === 'teacher') {
      renderQuizSetList();
      renderQuestionEditorList();
      populateRosterClassFilter();
      renderStudentRosterTable();
      renderStatsDashboard();
    }
  }

  function openStudentViewSmart() {
    if (currentStudent.verified && currentStudent.pin) {
      switchMainView('student');
      syncStudentScreenWithRoom();
    } else {
      switchMainView('landing');
    }
  }

  function openTeacherTab(tabName) {
    if (!isTeacherSignedIn()) {
      requireTeacher(() => openTeacherTab(tabName));
      return;
    }
    switchMainView('teacher');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const btn = document.getElementById(`tabBtn-${tabName}`);
    const pane = document.getElementById(`tabPane-${tabName}`);
    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');

    if (tabName === 'stats') {
      renderStatsDashboard();
    } else if (tabName === 'roster') {
      populateRosterClassFilter();
      renderStudentRosterTable();
    } else if (tabName === 'homework') {
      loadTeacherHomework();
    }
  }

  function toggleSound() {
    settings.soundEnabled = !settings.soundEnabled;
    const btn = document.getElementById('btnSoundToggle');
    if (btn) {
      btn.textContent = settings.soundEnabled ? '🔊 효과음/BGM 켜짐' : '🔇 음소거됨';
    }
    if (!settings.soundEnabled) SoundFX.stopBGM();
    saveStateToStorage();
  }

  // ==================== 학생 명단(@smy.ms.kr) 관리 & 엑셀 입출력 ====================
  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
  }

  // Firebase Realtime Database 키에는 마침표(.) 등을 사용할 수 없으므로 안전하게 치환
  function emailToKey(email) {
    return normalizeEmail(email).replace(/[.#$\[\]\/]/g, '_');
  }

  // Firebase RTDB는 빈 객체({})를 저장하지 않으므로, 수신/병합 시 항상 answers 객체를 보장
  function ensurePlayerShape(p, fallbackKey = '') {
    if (!p || typeof p !== 'object') return null;
    const cleanEmail = normalizeEmail(p.email || fallbackKey);
    return {
      ...p,
      email: cleanEmail,
      score: Number(p.score) || 0,
      streak: Number(p.streak) || 0,
      maxStreak: Number(p.maxStreak) || 0,
      prevRank: Number(p.prevRank) || 0,
      answers: (p.answers && typeof p.answers === 'object') ? p.answers : {}
    };
  }

  function isHostActive() {
    return Boolean(document.getElementById('view-host')?.classList.contains('active'));
  }

  function findStudentByEmail(email) {
    const clean = normalizeEmail(email);
    if (!clean) return null;
    return studentRoster.find(s => normalizeEmail(s.email) === clean) || null;
  }

  function populateRosterClassFilter() {
    const sel = document.getElementById('rosterFilterClass');
    if (!sel) return;
    const currentVal = sel.value || 'ALL';
    const classKeys = Array.from(new Set(studentRoster.map(s => `${s.grade}-${s.classNum}`))).sort();
    sel.innerHTML = `<option value="ALL">전체 학년/반 보기 (${studentRoster.length}명)</option>` +
      classKeys.map(k => {
        const [g, c] = k.split('-');
        const cnt = studentRoster.filter(s => `${s.grade}-${s.classNum}` === k).length;
        return `<option value="${k}">${g}학년 ${c}반 (${cnt}명)</option>`;
      }).join('');
    if (classKeys.includes(currentVal)) sel.value = currentVal;
  }

  function renderStudentRosterTable() {
    const tbody = document.getElementById('studentRosterTbody');
    const filterVal = document.getElementById('rosterFilterClass')?.value || 'ALL';
    const searchVal = (document.getElementById('rosterSearchInput')?.value || '').trim().toLowerCase();
    const countBadge = document.getElementById('rosterTotalCountBadge');

    if (countBadge) countBadge.textContent = `총 ${studentRoster.length}명 등록됨`;
    if (!tbody) return;

    // 학생별 누적 참여 횟수 계산
    const participationMap = {};
    quizHistory.forEach(session => {
      (session.results || []).forEach(r => {
        const em = normalizeEmail(r.email);
        participationMap[em] = (participationMap[em] || 0) + 1;
      });
    });

    const filtered = studentRoster
      .slice()
      .sort((a, b) => (a.grade - b.grade) || (a.classNum - b.classNum) || (a.studentNum - b.studentNum))
      .filter(s => {
        if (filterVal !== 'ALL' && `${s.grade}-${s.classNum}` !== filterVal) return false;
        if (searchVal) {
          const hay = `${s.grade}-${s.classNum} ${s.name} ${s.email}`.toLowerCase();
          if (!hay.includes(searchVal)) return false;
        }
        return true;
      });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--my-text-muted);">조건에 맞는 학생이 없습니다. 엑셀 양식으로 학생 명단을 업로드하거나 상단에서 추가해 주세요.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const code = `${s.grade}${String(s.classNum).padStart(2, '0')}${String(s.studentNum).padStart(2, '0')}`;
      const pCount = participationMap[normalizeEmail(s.email)] || 0;
      return `
        <tr>
          <td><strong>${s.grade}학년</strong></td>
          <td><strong>${s.classNum}반</strong></td>
          <td>${s.studentNum}번</td>
          <td><span class="badge badge-purple">${code}</span></td>
          <td><strong>${escapeHtml(s.name)}</strong></td>
          <td><code>${escapeHtml(s.email)}</code></td>
          <td><span class="badge ${pCount > 0 ? 'badge-green' : 'badge-gold'}">${pCount}회 참여</span></td>
          <td>
            <button class="btn btn-outline btn-sm" style="padding:0.25rem 0.55rem; color:var(--danger);" onclick="MYKahoot.removeStudentFromRoster('${escapeHtml(s.email)}')">삭제</button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function addSingleStudentToRoster() {
    const grade = parseInt(document.getElementById('addStuGrade').value, 10) || 2;
    const classNum = parseInt(document.getElementById('addStuClass').value, 10) || 7;
    const studentNum = parseInt(document.getElementById('addStuNum').value, 10) || 1;
    const name = document.getElementById('addStuName').value.trim();
    const email = normalizeEmail(document.getElementById('addStuEmail').value);

    if (!name || !email) {
      alert('학생 이름과 학교 이메일 주소를 모두 입력해 주세요.');
      return;
    }
    if (settings.allowedDomain && !email.endsWith(settings.allowedDomain.toLowerCase())) {
      if (!confirm(`입력하신 이메일(${email})이 학교 도메인(${settings.allowedDomain})과 다릅니다. 그래도 명단에 등록하시겠습니까?`)) {
        return;
      }
    }

    const existingIdx = studentRoster.findIndex(s => normalizeEmail(s.email) === email);
    const record = { grade, classNum, studentNum, name, email };
    if (existingIdx >= 0) {
      studentRoster[existingIdx] = record;
    } else {
      studentRoster.push(record);
    }

    saveStateToStorage();
    syncRosterToCloud();
    populateRosterClassFilter();
    renderStudentRosterTable();

    document.getElementById('addStuNum').value = studentNum + 1;
    document.getElementById('addStuName').value = '';
    document.getElementById('addStuEmail').value = '';
  }

  function removeStudentFromRoster(email) {
    const clean = normalizeEmail(email);
    studentRoster = studentRoster.filter(s => normalizeEmail(s.email) !== clean);
    saveStateToStorage();
    syncRosterToCloud();
    populateRosterClassFilter();
    renderStudentRosterTable();
  }

  function clearAllRoster() {
    if (!confirm('등록된 학생 명단을 모두 비우시겠습니까? (엑셀 파일로 언제든 다시 올릴 수 있습니다)')) return;
    studentRoster = [];
    saveStateToStorage();
    syncRosterToCloud();
    populateRosterClassFilter();
    renderStudentRosterTable();
  }

  // 학생 명단 엑셀 템플릿 다운로드
  function downloadRosterExcelTemplate() {
    if (typeof XLSX === 'undefined') {
      alert('엑셀 라이브러리를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const rows = [
      ['학년', '반', '번호', '이름', '이메일'],
      [2, 7, 1, '김서연', '20701@smy.ms.kr'],
      [2, 7, 2, '이서윤', '20702@smy.ms.kr'],
      [2, 7, 3, '박지우', '20703@smy.ms.kr']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '학생명단');
    XLSX.writeFile(wb, 'MY_Kahoot_서울문영여중_학생명단_템플릿.xlsx');
  }

  // 현재 등록된 전체 명단 엑셀로 내보내기
  function exportCurrentRosterToExcel() {
    if (typeof XLSX === 'undefined') return;
    const rows = [['학년', '반', '번호', '이름', '이메일']];
    studentRoster
      .slice()
      .sort((a, b) => (a.grade - b.grade) || (a.classNum - b.classNum) || (a.studentNum - b.studentNum))
      .forEach(s => {
        rows.push([s.grade, s.classNum, s.studentNum, s.name, s.email]);
      });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 16 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '서울문영여중_학생명단');
    XLSX.writeFile(wb, `MY_Kahoot_학생명단_${studentRoster.length}명.xlsx`);
  }

  // 학생 명단 엑셀(.xlsx/.csv) 업로드 처리
  function handleRosterExcelUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // 헤더 행 찾기 (학년, 반, 번호, 이름, 이메일)
        let headerRowIdx = 0;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowStr = rows[i].join(' ');
          if (rowStr.includes('이름') && (rowStr.includes('이메일') || rowStr.includes('계정') || rowStr.includes('메일'))) {
            headerRowIdx = i;
            break;
          }
        }

        const headers = rows[headerRowIdx].map(h => String(h).trim());
        const findCol = (keywords, fallback) => {
          const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
          return idx >= 0 ? idx : fallback;
        };

        const colGrade = findCol(['학년'], 0);
        const colClass = findCol(['반'], 1);
        const colNum = findCol(['번호', '번'], 2);
        const colName = findCol(['이름', '성명', '학생'], 3);
        const colEmail = findCol(['이메일', '메일', 'email', '계정'], 4);

        const parsedStudents = [];
        for (let r = headerRowIdx + 1; r < rows.length; r++) {
          const row = rows[r];
          if (!row || row.length === 0) continue;
          const name = String(row[colName] || '').trim();
          let email = normalizeEmail(row[colEmail] || '');
          if (!name || !email) continue;
          // 만약 이메일에 @가 없으면 자동으로 @smy.ms.kr 부착
          if (!email.includes('@')) {
            email = email + settings.allowedDomain;
          }
          const grade = parseInt(row[colGrade], 10) || 2;
          const classNum = parseInt(row[colClass], 10) || 1;
          const studentNum = parseInt(row[colNum], 10) || parsedStudents.length + 1;

          parsedStudents.push({ grade, classNum, studentNum, name, email });
        }

        if (parsedStudents.length === 0) {
          alert('엑셀 파일에서 유효한 학생 명단(학년, 반, 번호, 이름, 이메일)을 찾지 못했습니다.');
          return;
        }

        const replaceMode = confirm(
          `총 ${parsedStudents.length}명의 학생 명단을 읽었습니다.\n\n[확인]을 누르면 기존 명단을 새 명단으로 교체하고,\n[취소]를 누르면 기존 명단에 병합(추가/업데이트)합니다.`
        );

        if (replaceMode) {
          studentRoster = parsedStudents;
        } else {
          parsedStudents.forEach(ns => {
            const idx = studentRoster.findIndex(s => normalizeEmail(s.email) === ns.email);
            if (idx >= 0) studentRoster[idx] = ns;
            else studentRoster.push(ns);
          });
        }

        saveStateToStorage();
        syncRosterToCloud();
        populateRosterClassFilter();
        renderStudentRosterTable();
        alert(`성공적으로 ${parsedStudents.length}명의 서울문영여중 학생 명단이 등록되었습니다!`);
      } catch (err) {
        console.error(err);
        alert('학생 명단 엑셀 파일 처리 중 오류가 발생했습니다: ' + err.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ==================== 퀴즈 관리 & 엑셀 템플릿 업로드 ====================
  function renderQuizSetList() {
    const container = document.getElementById('quizSetListContainer');
    if (!container) return;

    container.innerHTML = quizSets.map((qSet, idx) => {
      const isSelected = idx === selectedQuizIndex;
      return `
        <div onclick="MYKahoot.selectQuizSet(${idx})" style="padding:0.9rem 1.1rem; border-radius:12px; border:2px solid ${isSelected ? 'var(--my-primary)' : 'var(--my-border)'}; background:${isSelected ? '#f4f0ff' : '#fff'}; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:0.75rem;">
          <div>
            <div style="font-weight:800; color:var(--my-primary-dark); font-size:0.98rem;">
              ${isSelected ? '✅ ' : ''}${escapeHtml(qSet.title)}
            </div>
            <div style="font-size:0.8rem; color:var(--my-text-muted); margin-top:0.2rem;">
              총 ${qSet.questions.length}문항 · 생성일: ${qSet.createdAt || '2026-10-28'}
            </div>
          </div>
          <div style="display:flex; gap:0.4rem;" onclick="event.stopPropagation()">
            <button class="btn btn-outline btn-sm" onclick="MYKahoot.renameQuizSet(${idx})">이름변경</button>
            ${quizSets.length > 1 ? `<button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="MYKahoot.deleteQuizSet(${idx})">삭제</button>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function selectQuizSet(idx) {
    selectedQuizIndex = idx;
    renderQuizSetList();
    renderQuestionEditorList();
  }

  function createNewQuizSet() {
    const title = prompt('새 퀴즈 세트의 제목을 입력하세요:', `서울문영여중 단원 마무리 퀴즈 (${quizSets.length + 1})`);
    if (!title) return;
    quizSets.push({
      id: 'quiz_' + Date.now(),
      title: title.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      questions: [
        {
          question: '새 문제를 입력해 주세요.',
          options: ['보기 1', '보기 2', '보기 3', '보기 4'],
          answer: 0,
          timeLimit: 20,
          multiplier: 1,
          explanation: ''
        }
      ]
    });
    selectedQuizIndex = quizSets.length - 1;
    saveStateToStorage();
    renderQuizSetList();
    renderQuestionEditorList();
  }

  function renameQuizSet(idx) {
    const current = quizSets[idx];
    if (!current) return;
    const nextTitle = prompt('퀴즈 세트 제목을 수정하세요:', current.title);
    if (nextTitle && nextTitle.trim()) {
      current.title = nextTitle.trim();
      saveStateToStorage();
      renderQuizSetList();
      renderQuestionEditorList();
    }
  }

  function deleteQuizSet(idx) {
    if (quizSets.length <= 1) return;
    if (!confirm(`'${quizSets[idx].title}' 퀴즈 세트를 삭제하시겠습니까?`)) return;
    quizSets.splice(idx, 1);
    selectedQuizIndex = Math.max(0, selectedQuizIndex - 1);
    saveStateToStorage();
    renderQuizSetList();
    renderQuestionEditorList();
  }

  function renderQuestionEditorList() {
    const qSet = quizSets[selectedQuizIndex];
    const titleEl = document.getElementById('currentQuizTitleDisplay');
    const container = document.getElementById('questionListContainer');
    if (!qSet || !container) return;

    if (titleEl) titleEl.textContent = `📝 ${qSet.title} (${qSet.questions.length}문항)`;

    const shapes = ['▲', '◆', '●', '■'];
    const colors = ['var(--ans-red)', 'var(--ans-blue)', 'var(--ans-yellow)', 'var(--ans-green)'];

    container.innerHTML = qSet.questions.map((q, qIdx) => {
      return `
        <div style="border:1px solid var(--my-border); border-radius:12px; padding:0.95rem 1.1rem; background:#fcfbfe;">
          <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:0.75rem; margin-bottom:0.65rem;">
            <div style="font-weight:800; font-size:0.96rem; color:var(--my-text);">
              <span class="badge badge-purple" style="margin-right:0.35rem;">Q${qIdx + 1}</span>
              ${q.multiplier === 2 ? '<span class="badge badge-gold" style="margin-right:0.35rem;">🔥 2배 점수</span>' : ''}
              <span class="badge" style="background:#e0f2fe; color:#0369a1; margin-right:0.35rem;">⏱️ ${q.timeLimit}초</span>
              ${escapeHtml(q.question)}
            </div>
            <div style="display:flex; gap:0.35rem; flex-shrink:0;">
              <button class="btn btn-outline btn-sm" onclick="MYKahoot.openQuestionModal(${qIdx})">편집</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="MYKahoot.deleteQuestion(${qIdx})">삭제</button>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:0.4rem; font-size:0.84rem;">
            ${q.options.map((opt, oIdx) => `
              <div style="padding:0.4rem 0.65rem; border-radius:8px; background:${q.answer === oIdx ? '#dcfce7' : '#f3f1f8'}; border:1.5px solid ${q.answer === oIdx ? '#16a34a' : 'transparent'}; font-weight:${q.answer === oIdx ? '800' : '600'};">
                <span style="color:${colors[oIdx]}; font-weight:900;">${shapes[oIdx]}</span>
                ${escapeHtml(opt)}
                ${q.answer === oIdx ? ' <span style="color:#15803d;">(정답 ✓)</span>' : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function openQuestionModal(qIdx) {
    editingQuestionIndex = qIdx;
    const qSet = quizSets[selectedQuizIndex];
    const modal = document.getElementById('questionEditModal');
    const title = document.getElementById('qModalTitle');

    if (qIdx >= 0 && qSet.questions[qIdx]) {
      const q = qSet.questions[qIdx];
      title.textContent = `Q${qIdx + 1} 문항 수정`;
      document.getElementById('qModalQuestion').value = q.question;
      document.getElementById('qModalOpt0').value = q.options[0] || '';
      document.getElementById('qModalOpt1').value = q.options[1] || '';
      document.getElementById('qModalOpt2').value = q.options[2] || '';
      document.getElementById('qModalOpt3').value = q.options[3] || '';
      document.getElementById('qModalAnswer').value = String(q.answer);
      document.getElementById('qModalTimeLimit').value = q.timeLimit || 20;
      document.getElementById('qModalMultiplier').value = String(q.multiplier || 1);
      document.getElementById('qModalExplanation').value = q.explanation || '';
    } else {
      title.textContent = '새 4지선다 문항 추가';
      document.getElementById('qModalQuestion').value = '';
      document.getElementById('qModalOpt0').value = '';
      document.getElementById('qModalOpt1').value = '';
      document.getElementById('qModalOpt2').value = '';
      document.getElementById('qModalOpt3').value = '';
      document.getElementById('qModalAnswer').value = '0';
      document.getElementById('qModalTimeLimit').value = 20;
      document.getElementById('qModalMultiplier').value = '1';
      document.getElementById('qModalExplanation').value = '';
    }
    modal.style.display = 'flex';
  }

  function closeQuestionModal() {
    document.getElementById('questionEditModal').style.display = 'none';
  }

  function saveQuestionFromModal() {
    const question = document.getElementById('qModalQuestion').value.trim();
    const opt0 = document.getElementById('qModalOpt0').value.trim();
    const opt1 = document.getElementById('qModalOpt1').value.trim();
    const opt2 = document.getElementById('qModalOpt2').value.trim();
    const opt3 = document.getElementById('qModalOpt3').value.trim();
    const answer = parseInt(document.getElementById('qModalAnswer').value, 10) || 0;
    const timeLimit = Math.max(5, Math.min(120, parseInt(document.getElementById('qModalTimeLimit').value, 10) || 20));
    const multiplier = parseInt(document.getElementById('qModalMultiplier').value, 10) === 2 ? 2 : 1;
    const explanation = document.getElementById('qModalExplanation').value.trim();

    if (!question || !opt0 || !opt1 || !opt2 || !opt3) {
      alert('문제 지문과 4개의 보기를 모두 입력해 주세요.');
      return;
    }

    const qObj = {
      question,
      options: [opt0, opt1, opt2, opt3],
      answer,
      timeLimit,
      multiplier,
      explanation
    };

    const qSet = quizSets[selectedQuizIndex];
    if (editingQuestionIndex >= 0) {
      qSet.questions[editingQuestionIndex] = qObj;
    } else {
      qSet.questions.push(qObj);
    }

    saveStateToStorage();
    renderQuizSetList();
    renderQuestionEditorList();
    closeQuestionModal();
  }

  function deleteQuestion(qIdx) {
    const qSet = quizSets[selectedQuizIndex];
    if (qSet.questions.length <= 1) {
      alert('최소 1개 이상의 문항이 있어야 합니다.');
      return;
    }
    qSet.questions.splice(qIdx, 1);
    saveStateToStorage();
    renderQuizSetList();
    renderQuestionEditorList();
  }

  // MY Kahoot 퀴즈 엑셀 템플릿 다운로드
  function downloadQuizExcelTemplate() {
    if (typeof XLSX === 'undefined') return;
    const rows = [
      ['번호', '문제', '보기1(▲빨강)', '보기2(◆파랑)', '보기3(●노랑)', '보기4(■초록)', '정답번호(1~4)', '제한시간(초)', '점수배수(1또는2)', '해설(선택)'],
      [1, '우리 학교(서울문영여자중학교)의 이니셜을 딴 이 퀴즈 프로그램의 이름은?', 'MY Kahoot', 'SM Kahoot', 'Girl Kahoot', 'Seoul Quiz', 1, 20, 1, 'Moonyoung의 이니셜 MY를 사용한 MY Kahoot입니다.'],
      [2, 'Citizens pay ______ to the government to fund public services.', 'tuition', 'taxes', 'fines', 'tips', 2, 20, 1, '세금(taxes)은 공공 서비스를 위해 납부하는 비용입니다.'],
      [3, '[보너스 2배 점수!] 일차함수 y = 2x + 3 의 그래프의 y절편은?', '-2', '2', '-3', '3', 4, 20, 2, 'x=0을 대입하면 y=3입니다.']
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 }, { wch: 44 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 },
      { wch: 15 }, { wch: 14 }, { wch: 16 }, { wch: 34 }
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MY_Kahoot_퀴즈');
    XLSX.writeFile(wb, 'MY_Kahoot_퀴즈_템플릿.xlsx');
  }

  // 퀴즈 엑셀(.xlsx / .csv) 업로드 (MY Kahoot 전용 양식 + 기존 퀴즈앤 '퀴즈 템플릿.xlsx' 자동 호환!)
  function handleQuizExcelUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        const parsedQuestions = [];

        // 1. 기존 '퀴즈 템플릿.xlsx' (QuizN 양식: 11행에 '퀴즈 유형 - 택1', 'Question (한글 최대 150자)') 인지 자동 감지
        const isQuizNFormat = rows.some(r => r.some(cell => String(cell).includes('퀴즈 유형') || String(cell).includes('QuizN')));

        if (isQuizNFormat) {
          rows.forEach((row) => {
            const firstCol = String(row[0] || '').trim();
            const qType = String(row[1] || '').trim();
            const qText = String(row[2] || '').trim();
            // '예시' 행은 건너뛰고 실제 번호(1, 2, 3...)에 작성된 문제만 추출
            if (firstCol === '예시' || !qText || qText === '내용을 입력해 주세요' || qText.includes('Question')) return;
            const opt1 = String(row[3] || '').trim();
            const opt2 = String(row[4] || '').trim();
            const opt3 = String(row[5] || '보기 3').trim();
            const opt4 = String(row[6] || '보기 4').trim();
            if (!opt1 || !opt2) return;

            const timeLimit = parseInt(row[7], 10) || 20;
            const ansRaw = String(row[8] || '1').trim();
            let ansIdx = (parseInt(ansRaw, 10) || 1) - 1;
            if (ansRaw.toUpperCase() === 'O') ansIdx = 0;
            if (ansRaw.toUpperCase() === 'X') ansIdx = 1;
            ansIdx = Math.max(0, Math.min(3, ansIdx));

            const doublePts = String(row[10] || '').toLowerCase() === 'on' ? 2 : 1;

            parsedQuestions.push({
              question: qText,
              options: [opt1, opt2, opt3 || '-', opt4 || '-'],
              answer: ansIdx,
              timeLimit: Math.max(5, Math.min(120, timeLimit)),
              multiplier: doublePts,
              explanation: ''
            });
          });
        } else {
          // 2. 공식 카훗 템플릿(Kahoot_Quiz_Template) & MY Kahoot 전용 템플릿 자동 감지 파싱
          let headerIdx = 0;
          for (let i = 0; i < Math.min(rows.length, 15); i++) {
            const joined = rows[i].join(' ').toLowerCase();
            if ((joined.includes('문제') && joined.includes('보기')) || (joined.includes('question') && joined.includes('answer'))) {
              headerIdx = i;
              break;
            }
          }

          const headerCells = (rows[headerIdx] || []).map(c => String(c || '').toLowerCase());
          const headerTimeCol = headerCells.findIndex(h => h.includes('time') || h.includes('시간'));
          const headerAnsCol = headerCells.findIndex(h => h.includes('correct') || h.includes('정답'));

          for (let r = headerIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!row || row.length < 5) continue;

            // 첫 번째 열이 단순 연번(1, 2, 3...)이고 두 번째 열이 문제 지문인 경우 offset = 1,
            // 첫 번째 열이 바로 문제 지문(공식 카훗 템플릿 등)인 경우 offset = 0
            const firstCellStr = String(row[0] ?? '').trim();
            const hasNumCol = /^\d+$/.test(firstCellStr) && String(row[1] || '').trim().length > 1;
            const offset = hasNumCol ? 1 : 0;

            const qText = String(row[offset] ?? '').trim();
            const opt1 = String(row[offset + 1] ?? '').trim();
            const opt2 = String(row[offset + 2] ?? '').trim();
            const opt3 = String(row[offset + 3] ?? '').trim();
            const opt4 = String(row[offset + 4] ?? '').trim();

            if (!qText || !opt1 || !opt2) continue;

            const valCol5 = parseInt(String(row[offset + 5] ?? '').split(',')[0].trim(), 10);
            const valCol6 = parseInt(String(row[offset + 6] ?? '').split(',')[0].trim(), 10);

            let rawAns = 1;
            let rawTime = 20;

            // A) 헤더에 'time/시간'과 'correct/정답' 열 위치가 명시된 경우
            if (headerAnsCol >= 0 && headerTimeCol >= 0) {
              rawAns = parseInt(String(row[headerAnsCol] ?? '').split(',')[0].trim(), 10) || 1;
              rawTime = parseInt(String(row[headerTimeCol] ?? '').trim(), 10) || 20;
            }
            // B) 공식 카훗 양식처럼 앞 열(offset+5)이 제한시간(>=5초)이고 뒷 열(offset+6)이 정답번호(1~4)인 경우 자동 감지!
            else if (valCol5 >= 5 && valCol6 >= 1 && valCol6 <= 4) {
              rawTime = valCol5;
              rawAns = valCol6;
            }
            // C) 기본 MY Kahoot 양식: 앞 열(offset+5)이 정답번호(1~4), 뒷 열(offset+6)이 제한시간
            else {
              rawAns = (valCol5 >= 1 && valCol5 <= 4) ? valCol5 : 1;
              rawTime = (valCol6 >= 5) ? valCol6 : 20;
            }

            const ansIdx = Math.max(0, Math.min(3, rawAns - 1));
            const timeLimit = Math.max(5, Math.min(240, rawTime));
            const multRaw = parseInt(row[offset + 7], 10) || 1;
            const multiplier = multRaw === 2 ? 2 : 1;
            const explanation = String(row[offset + 8] || '').trim();

            parsedQuestions.push({
              question: qText,
              options: [opt1, opt2, opt3 || '보기 3', opt4 || '보기 4'],
              answer: ansIdx,
              timeLimit,
              multiplier,
              explanation
            });
          }
        }

        if (parsedQuestions.length === 0) {
          alert('엑셀 파일에서 문제를 찾지 못했습니다. 템플릿의 필수 입력란(문제, 보기1~4, 정답번호)을 확인해 주세요.');
          return;
        }

        const baseName = file.name.replace(/\.(xlsx|xls|csv)$/i, '');
        quizSets.push({
          id: 'quiz_' + Date.now(),
          title: baseName,
          createdAt: new Date().toISOString().slice(0, 10),
          questions: parsedQuestions
        });
        selectedQuizIndex = quizSets.length - 1;
        saveStateToStorage();
        renderQuizSetList();
        renderQuestionEditorList();
        alert(`'${baseName}' 파일에서 총 ${parsedQuestions.length}문항을 성공적으로 불러왔습니다!`);
      } catch (err) {
        console.error(err);
        alert('퀴즈 파일 업로드 중 오류가 발생했습니다: ' + err.message);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // ==================== 로그인 확인 (교사 / 학생) ====================
  function isTeacherEmail(email) {
    return TEACHER_EMAILS.includes(normalizeEmail(email));
  }

  function isTeacherSignedIn() {
    // Firebase에 연결되지 않은 로컬(file://, 교실 PC 서버) 모드에서는 클라우드에 아무것도 올라가지 않으므로 그대로 허용해요.
    if (!isFirebaseConnected || !firebaseAuth) return true;
    return !!(authUser && authUser.emailVerified && isTeacherEmail(authUser.email));
  }

  let teacherLoginInFlight = false;
  async function requireTeacher(next) {
    await authReady;
    if (isTeacherSignedIn()) { next(); return; }
    if (teacherLoginInFlight) return;
    teacherLoginInFlight = true;
    try {
      if (!confirm('교사 페이지와 전자칠판은 선생님 Google 계정으로 로그인해야 열 수 있어요.\n지금 로그인할까요?')) return;
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await firebaseAuth.signInWithPopup(provider);
      authUser = cred.user;
      if (!isTeacherEmail(authUser && authUser.email)) {
        alert(`선생님 계정이 아니에요 (${authUser && authUser.email}). 교사 페이지는 ${TEACHER_EMAILS.join(', ')} 계정으로만 열 수 있어요.`);
        await firebaseAuth.signOut();
        authUser = null;
        return;
      }
      if (!authUser.emailVerified) {
        alert(`${authUser.email} 계정은 Google에서 '이메일 확인됨' 상태가 아니라서 교사 페이지를 열 수 없어요. 다른 선생님 계정(${TEACHER_EMAILS.join(', ')})으로 다시 로그인해 주세요.`);
        await firebaseAuth.signOut();
        authUser = null;
        return;
      }
      onTeacherSignedIn();
      teacherLoginInFlight = false;
      next();
    } catch (err) {
      alert(authErrorMessage(err));
    } finally {
      teacherLoginInFlight = false;
    }
  }

  function authErrorMessage(err) {
    const code = String(err && err.code || '');
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return '로그인 창이 닫혔어요. 다시 시도해 주세요.';
    if (code === 'auth/popup-blocked') return '팝업이 차단되었어요. 주소창 오른쪽의 팝업 차단 아이콘에서 허용한 뒤 다시 눌러 주세요.';
    if (code === 'auth/unauthorized-domain') return '이 주소는 Firebase 로그인 허용 도메인에 없어요. Firebase 콘솔 → Authentication → 설정 → 승인된 도메인에 추가해 주세요.';
    if (code === 'auth/operation-not-allowed') return 'Firebase 콘솔에서 Google 로그인이 꺼져 있어요.';
    return 'Google 로그인에 실패했어요: ' + (err && err.message ? err.message : code);
  }

  // 교사로 로그인되면 클라우드 명단을 받아 오고, 처음 한 번 학생별 조회용 명단(rosterByEmail)도 맞춰 둬요.
  function onTeacherSignedIn() {
    hostWriteWarned = false;
    if (!isFirebaseConnected || !firebaseDb || teacherRosterSubscribed) return;
    if (!isTeacherSignedIn()) return; // 이메일 확인 안 된 계정은 서버가 막으니 구독하지 않아요
    teacherRosterSubscribed = true;
    syncTeacherDataOnLogin();
    let first = true;
    firebaseDb.ref('schoolRoster').on('value', (snap) => {
      const cloudRoster = snap.val();
      const wasFirst = first;
      first = false;
      const cloudList = Array.isArray(cloudRoster) ? cloudRoster.filter(Boolean)
        : (cloudRoster && typeof cloudRoster === 'object' ? Object.values(cloudRoster).filter(Boolean) : []);
      // 5명 미만 명단은 학생 테스트 로그인으로 남은 것이라 묻지 않고 서버 명단을 받아요.
      const localIsSample = sameRoster(studentRoster, getDefaultRoster()) || studentRoster.length < 5;
      if (wasFirst && studentRoster.length > 0 && !localIsSample && !sameRoster(studentRoster, cloudList)) {
        // 이 PC 명단과 서버 명단이 다르면 선생님께 물어봐요 (말없이 덮어쓰지 않아요).
        const useLocal = confirm(`이 컴퓨터에 저장된 학생 명단(${studentRoster.length}명)과 서버 명단(${cloudList.length}명)이 달라요.\n\n[확인] 이 컴퓨터 명단(${studentRoster.length}명)을 서버에 올려요.\n[취소] 서버 명단(${cloudList.length}명)을 받아 와요.`);
        if (useLocal) { syncRosterToCloud(); return; }
      }
      if (cloudList.length > 0) {
        studentRoster = cloudList;
        localStorage.setItem(STORAGE_KEYS.ROSTER, JSON.stringify(studentRoster));
        if (wasFirst) writeRosterLookup();
        if (document.getElementById('studentRosterTbody')) {
          populateRosterClassFilter();
          renderStudentRosterTable();
        }
      } else if (wasFirst && studentRoster.length > 0 && !localIsSample) {
        // 클라우드가 비어 있고 이 PC에 명단이 있으면 올려요.
        syncRosterToCloud();
      }
    }, (err) => {
      // 읽기가 막히면 다음 로그인 때 다시 받아 오도록 풀어 둬요.
      console.warn('schoolRoster 읽기 실패', err);
      teacherRosterSubscribed = false;
    });
  }

  function stopTeacherSync() {
    if (!teacherRosterSubscribed) return;
    try { firebaseDb.ref('schoolRoster').off(); } catch (_) {}
    teacherRosterSubscribed = false;
    teacherDataReady = false;
  }

  function sameRoster(a, b) {
    if (a.length !== b.length) return false;
    const key = r => [normalizeEmail(r && r.email), r && r.name, r && r.grade, r && r.classNum, r && r.studentNum].join('|');
    const sa = a.map(key).sort(), sb = b.map(key).sort();
    return sa.every((v, i) => v === sb[i]);
  }

  // 학생이 자기 줄 하나만 읽을 수 있도록 이메일별로 나눠 저장해요.
  function writeRosterLookup() {
    if (!isFirebaseConnected || !firebaseDb || !isTeacherSignedIn()) return;
    const map = {};
    studentRoster.forEach(stu => {
      const key = emailToKey(stu && stu.email);
      if (key) map[key] = { grade: stu.grade, classNum: stu.classNum, studentNum: stu.studentNum, name: stu.name, email: normalizeEmail(stu.email) };
    });
    firebaseDb.ref('rosterByEmail').set(map).catch(() => {});
  }

  // 학생 로그인 후 명단에서 내 줄만 받아 와요 (다른 학생 명단은 기기에 남기지 않아요).
  async function loadOwnRosterEntry() {
    if (!authUser || !firebaseDb) return;
    if (isTeacherEmail(authUser.email)) return;
    let entry = null;
    try {
      const snap = await firebaseDb.ref('rosterByEmail/' + emailToKey(authUser.email)).once('value');
      entry = snap.val();
    } catch (_) {}
    studentRoster = entry ? [entry] : [];
    // 학생 한 명 줄은 이 기기에 저장하지 않아요 (같은 PC에서 선생님 명단을 덮어쓰지 않도록).
  }

  function watchAuthState() {
    if (!firebaseAuth) { resolveAuthReady(); return; }
    firebaseAuth.onAuthStateChanged(async (user) => {
      authUser = user || null;
      if (!authUser || !isTeacherSignedIn()) stopTeacherSync();
      if (authUser && isTeacherEmail(authUser.email)) {
        onTeacherSignedIn();
      } else if (authUser) {
        await loadOwnRosterEntry();
        const emailInput = document.getElementById('studentEmailInput');
        if (emailInput && authUser) emailInput.value = normalizeEmail(authUser.email);
        // 이미 로그인된 학생이면 바로 확인하고 과제 목록을 보여 줘요.
        if (findStudentByEmail(authUser.email) && verifyStudentEmailFromRoster()) loadStudentHomework();
      }
      if (authUser && (currentStudent.pin || liveRoom.pin)) {
        ensureFirebaseRoomSubscription(currentStudent.pin || liveRoom.pin);
      }
      resolveAuthReady();
    });
  }

  // ==================== 학생 구글 로그인(@smy.ms.kr) 및 사전등록 명단 검증 ====================
  function verifyEmailAgainstPolicy(email) {
    const clean = normalizeEmail(email);
    if (!clean) {
      return { ok: false, message: '학교 이메일 주소를 입력해 주세요.' };
    }

    const reqDomain = (settings.allowedDomain || '@smy.ms.kr').trim().toLowerCase();
    if (reqDomain && !clean.endsWith(reqDomain)) {
      return {
        ok: false,
        message: `서울문영여자중학교 전용 계정(${settings.allowedDomain})만 로그인할 수 있습니다.`
      };
    }

    const matched = findStudentByEmail(clean);
    if (settings.strictRosterOnly && !matched) {
      return {
        ok: false,
        message: `등록된 우리 학교 학생 명단에 없는 이메일(${clean})입니다. 선생님께 명단 등록을 확인해 주세요.`
      };
    }

    if (matched) {
      return {
        ok: true,
        student: matched,
        message: `✅ 인증 완료: ${matched.grade}학년 ${matched.classNum}반 ${matched.studentNum}번 ${matched.name} 학생 환영합니다!`
      };
    }

    // strictRosterOnly가 꺼져 있는 경우에만 임시 학번 부여
    return {
      ok: true,
      student: {
        grade: 2,
        classNum: 1,
        studentNum: 0,
        name: clean.split('@')[0],
        email: clean
      },
      message: `✅ 도메인 인증 완료 (${clean})`
    };
  }

  function verifyStudentEmailFromRoster() {
    const emailInput = document.getElementById('studentEmailInput');
    const infoBox = document.getElementById('studentMatchedInfo');
    if (!emailInput || !infoBox) return false;

    let result;
    if (isFirebaseConnected && firebaseAuth) {
      // 직접 입력한 이메일은 믿지 않아요. 실제로 Google 로그인한 계정만 확인해요.
      if (!authUser) {
        result = { ok: false, message: '먼저 위의 [학교 구글 계정으로 로그인] 버튼을 눌러 주세요.' };
      } else {
        emailInput.value = normalizeEmail(authUser.email);
        result = verifyEmailAgainstPolicy(authUser.email);
      }
    } else {
      result = verifyEmailAgainstPolicy(emailInput.value);
    }
    infoBox.style.display = 'block';

    if (result.ok) {
      infoBox.style.background = '#dcfce7';
      infoBox.style.color = '#15803d';
      infoBox.textContent = result.message;
      currentStudent = {
        ...currentStudent,
        verified: true,
        ...result.student
      };
      return true;
    } else {
      infoBox.style.background = '#fee2e2';
      infoBox.style.color = '#b91c1c';
      infoBox.textContent = '⛔ ' + result.message;
      currentStudent.verified = false;
      return false;
    }
  }

  async function handleStudentGoogleLogin() {
    const emailInput = document.getElementById('studentEmailInput');

    // Firebase가 없는 로컬(교실 PC 서버) 모드: 예전처럼 이메일 입력으로 확인해요.
    if (!isFirebaseConnected || !firebaseAuth) {
      verifyStudentEmailFromRoster();
      return;
    }
    if (!window.location.protocol.startsWith('http')) {
      alert('Google 로그인은 인터넷 주소(https://)로 접속했을 때만 할 수 있어요.');
      return;
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const params = { prompt: 'select_account' };
      if (settings.allowedDomain) params.hd = settings.allowedDomain.replace('@', '');
      provider.setCustomParameters(params);
      const cred = await firebaseAuth.signInWithPopup(provider);
      authUser = cred.user;
      if (emailInput) emailInput.value = normalizeEmail(authUser && authUser.email);
      await loadOwnRosterEntry();
      const ok = verifyStudentEmailFromRoster();
      if (!ok) {
        await firebaseAuth.signOut();
        authUser = null;
      } else {
        loadStudentHomework();
      }
    } catch (err) {
      const code = String(err && err.code || '');
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return;
      alert(authErrorMessage(err));
    }
  }

  function joinGameAsStudent() {
    const pinVal = (document.getElementById('studentPinInput')?.value || '').trim();
    if (!pinVal) {
      alert('전자칠판에 표시된 6자리 게임 PIN 번호를 입력해 주세요!');
      return;
    }

    if (!verifyStudentEmailFromRoster()) {
      return;
    }

    // 활성화된 방 PIN 번호 확인 (로컬/멀티탭 모드에서 현재 열린 방이 있으면 체크)
    const savedRoomRaw = localStorage.getItem(STORAGE_KEYS.LIVE_ROOM);
    if (savedRoomRaw) {
      const savedRoom = JSON.parse(savedRoomRaw);
      if (savedRoom.pin && savedRoom.pin === pinVal) {
        // 기존 방 정보(입장 학생 명단 등) 동기화
        liveRoom = { ...liveRoom, ...savedRoom };
      } else if (savedRoom.pin && savedRoom.status === 'LOBBY' && Object.keys(savedRoom.players || {}).length === 0) {
        // 아직 아무도 안 들어온 빈 방이면 학생이 입력한 PIN으로 맞춤
        liveRoom.pin = pinVal;
      } else {
        liveRoom.pin = pinVal;
      }
    } else {
      liveRoom.pin = pinVal;
    }

    if (!liveRoom.quizId) {
      const qSet = quizSets[selectedQuizIndex] || quizSets[0];
      liveRoom.quizId = qSet.id;
      liveRoom.quizTitle = qSet.title;
      liveRoom.status = 'LOBBY';
    }

    currentStudent.pin = pinVal;
    currentStudent.lastAnsweredQIndex = -1;

    // Firebase 실시간 방 구독 연결
    ensureFirebaseRoomSubscription(pinVal);

    // 학생 상태바 업데이트
    document.getElementById('stuBarClassNum').textContent = `${currentStudent.grade}-${currentStudent.classNum} ${currentStudent.studentNum}번`;
    document.getElementById('stuBarName').textContent = currentStudent.name;
    document.getElementById('stuBarStreak').textContent = '🔥 0연속';
    document.getElementById('stuBarScore').textContent = '0점';

    switchMainView('student');
    showStudentStage('waiting');

    // 호스트에게 학생 입장 이벤트 전송
    const joinPayload = {
      grade: currentStudent.grade,
      classNum: currentStudent.classNum,
      studentNum: currentStudent.studentNum,
      name: currentStudent.name,
      email: currentStudent.email
    };

    registerPlayerIntoLiveRoom(joinPayload);
    broadcastEvent('PLAYER_JOIN', joinPayload);
  }

  // ==================== 전자칠판 라이브 호스트 진행 (로비 -> 문제 -> 결과 -> 순위 -> 포디움 & 1~10등) ====================
  function quickStartDemoHost() {
    resumeOrStartHostScreen();
  }

  /**
   * 이미 입장한 학생이나 진행 중인 방이 있으면 그대로 유지하면서 전자칠판(호스트) 화면으로 전환하고,
   * 아직 생성된 방이 없을 때만 새 로비를 엽니다.
   */
  function resumeOrStartHostScreen() {
    const savedRoomRaw = localStorage.getItem(STORAGE_KEYS.LIVE_ROOM);
    if (savedRoomRaw) {
      try {
        const saved = JSON.parse(savedRoomRaw);
        if (isResumableRoom(saved)) {
          liveRoom = {
            ...liveRoom,
            ...saved,
            players: withoutBots({ ...(saved.players || {}), ...(liveRoom.players || {}) })
          };
        } else {
          // 오래됐거나 이미 끝난 방은 다시 열지 않음 (이전 게임 학생이 대기화면에 남지 않도록)
          liveRoom.status = 'IDLE';
          liveRoom.players = {};
        }
      } catch (_) {}
    }

    if (liveRoom.pin && liveRoom.status && liveRoom.status !== 'IDLE' && liveRoom.status !== 'PODIUM') {
      const qSet = quizSets.find(q => q.id === liveRoom.quizId) || quizSets[selectedQuizIndex] || quizSets[0];
      switchMainView('host');
      if (liveRoom.status === 'LOBBY') {
        showHostStage('lobby');
        SoundFX.startLobbyBGM();
      } else if (liveRoom.status === 'QUESTION' || liveRoom.status === 'RESULT') {
        showHostStage('question');
      } else if (liveRoom.status === 'SCOREBOARD') {
        showHostStage('scoreboard');
      } else if (liveRoom.status === 'PODIUM') {
        showHostStage('podium');
      }

      document.getElementById('hostPinDisplay').textContent = liveRoom.pin;
      document.getElementById('hostQuizTitleLobby').textContent = qSet.title;
      document.getElementById('hostQuizCountLobby').textContent = qSet.questions.length;
      document.getElementById('hostDomainNotice').textContent = settings.allowedDomain || '@smy.ms.kr';
      renderHostLobbyPlayers();
      renderHostQRCode(liveRoom.pin);
      ensureFirebaseRoomSubscription(liveRoom.pin);
      persistAndBroadcastRoomState();
      return;
    }

    startHostLobbyWithCurrentQuiz();
  }

  // 진행 중인 게임을 이어서 열지 판단: 문제 진행 중이면 3시간, 대기화면이면 20분 안에 저장된 방만 이어서 엽니다.
  function isResumableRoom(room) {
    if (!room || !room.pin || !room.status) return false;
    const age = Date.now() - Number(room.updatedAt || 0);
    if (room.status === 'QUESTION' || room.status === 'RESULT' || room.status === 'SCOREBOARD') {
      return age < 3 * 60 * 60 * 1000;
    }
    if (room.status === 'LOBBY') {
      return age < 20 * 60 * 1000 && Object.keys(withoutBots(room.players)).length > 0;
    }
    return false;
  }

  function withoutBots(players) {
    const out = {};
    Object.entries(players || {}).forEach(([k, p]) => {
      if (p && !p.isBot) out[k] = p;
    });
    return out;
  }

  function getSyncApiUrl() {
    if (window.location.protocol.startsWith('http') && window.location.port === '8765') {
      return `${window.location.origin}/api/room`;
    }
    return 'http://127.0.0.1:8765/api/room';
  }

  function startHostLobbyWithCurrentQuiz() {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    if (!qSet || !qSet.questions.length) {
      alert('출제할 문항이 없습니다.');
      return;
    }

    clearHostTimers();
    const pin = String(Math.floor(100000 + Math.random() * 900000));

    // 새 게임은 항상 빈 대기화면으로 시작합니다. 이전 게임 방은 서버에서 지웁니다.
    const oldPin = liveRoom && liveRoom.pin;
    if (oldPin && oldPin !== pin && isFirebaseConnected && firebaseDb && isTeacherSignedIn()) {
      firebaseDb.ref(`rooms/${oldPin}`).remove().catch(() => {});
    }
    const cleanPlayers = {};

    liveRoom = {
      pin,
      quizId: qSet.id + '_' + Date.now(),
      quizTitle: qSet.title,
      questions: JSON.parse(JSON.stringify(qSet.questions)), // ★ 새 문제 데이터를 방 상태에 직접 포함하여 학생 창에 100% 전달!
      roster: studentRoster,
      status: 'LOBBY',
      currentQIndex: 0,
      questionStartedAt: 0,
      timeLimit: qSet.questions[0]?.timeLimit || 20,
      timerInterval: null,
      botTimers: [],
      players: cleanPlayers,
      showAllFinalRanks: false,
      _lanIp: liveRoom._lanIp || '192.168.45.129'
    };

    // 화면 전환을 가장 먼저 수행하여 어떤 경우에도 즉시 화면이 열리도록 보장
    switchMainView('host');
    showHostStage('lobby');
    SoundFX.startLobbyBGM();

    // 학생 화면의 PIN 입력란에도 편의를 위해 자동 세팅
    const pinInput = document.getElementById('studentPinInput');
    if (pinInput) pinInput.value = pin;

    document.getElementById('hostPinDisplay').textContent = pin;
    document.getElementById('hostQuizTitleLobby').textContent = qSet.title;
    document.getElementById('hostQuizCountLobby').textContent = qSet.questions.length;
    document.getElementById('hostDomainNotice').textContent = settings.allowedDomain || '@smy.ms.kr';

    renderHostLobbyPlayers();
    renderHostQRCode(pin);

    ensureFirebaseRoomSubscription(pin);
    persistAndBroadcastRoomState('host_reset');
  }

  function renderHostQRCode(pin) {
    const qrBox = document.getElementById('hostQrCodeContainer');
    if (!qrBox) return;
    qrBox.innerHTML = '';
    try {
      // 기본값: 어디서나(LTE/5G/교실 와이파이) 즉시 접속 가능한 학생 전용 주소 (GitHub Pages)
      let qrUrl = `https://tfellow.github.io/web/kahoot/student.html?pin=${pin}`;
      if (window.location.protocol.startsWith('http') && !window.location.hostname.includes('127.0.0.1') && !window.location.hostname.includes('localhost')) {
        const baseStudentPath = window.location.pathname.replace(/index\.html$/i, '') + 'student.html';
        qrUrl = `${window.location.origin}${baseStudentPath}?pin=${pin}`;
      }

      if (typeof QRCode !== 'undefined') {
        new QRCode(qrBox, {
          text: qrUrl,
          width: 96,
          height: 96,
          colorDark: '#25076b',
          colorLight: '#ffffff',
          correctLevel: QRCode.CorrectLevel ? QRCode.CorrectLevel.L : 1
        });
      }
    } catch (err) {
      console.warn('QR 생성 폴백 처리:', err);
      qrBox.innerHTML = `<div style="width:96px;height:96px;display:flex;align-items:center;justify-content:center;font-weight:900;color:#25076b;font-size:0.85rem;text-align:center;">PIN<br/>${pin}</div>`;
    }
  }

  function showHostStage(stageName) {
    ['lobby', 'question', 'scoreboard', 'podium'].forEach(st => {
      const el = document.getElementById(`hostStage-${st}`);
      if (el) el.style.display = (st === stageName) ? 'flex' : 'none';
    });
  }

  function registerPlayerIntoLiveRoom(stu) {
    const cleanEmail = normalizeEmail(stu.email);
    const key = emailToKey(cleanEmail);
    if (!key) return;
    if (!liveRoom.players[key]) {
      liveRoom.players[key] = {
        grade: stu.grade,
        classNum: stu.classNum,
        studentNum: stu.studentNum,
        name: stu.name,
        email: cleanEmail,
        score: 0,
        streak: 0,
        maxStreak: 0,
        prevRank: 0,
        isBot: !!stu.isBot,
        answers: {}
      };
      SoundFX.playJoinPop();
    }
    fetch(getSyncApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _mode: 'player_join', player: liveRoom.players[key] })
    }).catch(() => {});

    if (isFirebaseConnected && firebaseDb && liveRoom.pin) {
      firebaseDb.ref(`rooms/${liveRoom.pin}/players/${key}`).set(liveRoom.players[key]).catch(() => {});
    }

    renderHostLobbyPlayers();
    updateHostAnswerCounter();
    if (isHostActive()) {
      persistAndBroadcastRoomState();
    }
  }

  function renderHostLobbyPlayers() {
    const grid = document.getElementById('hostLobbyPlayersGrid');
    const countEl = document.getElementById('hostLobbyPlayerCount');
    const playerArr = Object.values(liveRoom.players).sort((a, b) => a.studentNum - b.studentNum);

    if (countEl) countEl.textContent = playerArr.length;
    if (!grid) return;

    if (playerArr.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:2.5rem; background:rgba(255,255,255,0.08); border-radius:18px; font-size:1.15rem;">
          학생들이 스마트폰/태블릿에서 <strong>PIN 번호(${liveRoom.pin})</strong>로 입장하면 이곳에 실시간으로 학번과 이름이 표시됩니다.<br/>
        </div>
      `;
      return;
    }

    grid.innerHTML = playerArr.map(p => `
      <div class="player-chip">
        <span class="badge badge-gold">${p.grade}-${p.classNum} ${p.studentNum}번</span>
        <span>${escapeHtml(p.name)}</span>
      </div>
    `).join('');
  }

  function hostStartFirstQuestion() {
    if (Object.keys(liveRoom.players).length === 0) {
      alert('아직 입장한 학생이 없습니다. 학생이 PIN으로 입장하면 시작할 수 있어요.');
      return;
    }
    SoundFX.stopBGM();
    liveRoom.currentQIndex = 0;
    startHostQuestionAtIndex(0);
  }

  function startHostQuestionAtIndex(qIdx) {
    clearHostTimers();
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const q = qSet.questions[qIdx];
    if (!q) return;

    liveRoom.status = 'QUESTION';
    liveRoom.currentQIndex = qIdx;
    liveRoom.timeLimit = q.timeLimit || 20;
    liveRoom.questionStartedAt = Date.now();

    // 직전 순위 저장 (순위 상승폭 계산용)
    const rankedBefore = getSortedPlayers();
    rankedBefore.forEach((p, idx) => {
      p.prevRank = idx + 1;
    });

    showHostStage('question');

    document.getElementById('hostQIndexBadge').textContent = `문제 ${qIdx + 1} / ${qSet.questions.length}`;
    document.getElementById('hostQPointsBadge').textContent =
      q.multiplier === 2 ? '🔥 2배 점수 찬스! (최대 2,000점 + 연속보너스)' : '⚡ 스피드 배점: 최대 1,000점 + 연속보너스';
    document.getElementById('hostQuestionText').textContent = q.question;

    document.getElementById('hostBtnEndQuestionNow').style.display = 'inline-flex';
    document.getElementById('hostBtnNextStep').style.display = 'none';
    document.getElementById('hostQuestionLiveNotice').style.display = 'block';
    document.getElementById('hostResultDistWrap').style.display = 'none';

    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`hostAnsCard-${i}`);
      const txt = document.getElementById(`hostAnsText-${i}`);
      if (txt) txt.textContent = q.options[i] || '';
      if (card) {
        card.classList.remove('dimmed', 'correct-highlight');
      }
    }

    updateHostAnswerCounter();

    // 타이머 작동
    let remaining = liveRoom.timeLimit;
    const timerNumEl = document.getElementById('hostTimerNumber');
    if (timerNumEl) timerNumEl.textContent = remaining;

    liveRoom.timerInterval = setInterval(() => {
      remaining--;
      if (timerNumEl) timerNumEl.textContent = Math.max(0, remaining);
      SoundFX.playTick(remaining <= 5);
      if (remaining <= 0) {
        hostRevealAnswer();
      }
    }, 1000);

    persistAndBroadcastRoomState();
    syncStudentScreenWithRoom();
  }

  function recordPlayerAnswer(email, qIdx, choice, elapsedSec) {
    const cleanEmail = normalizeEmail(email);
    const key = emailToKey(cleanEmail);
    const player = liveRoom.players[key] || liveRoom.players[cleanEmail];
    if (!player || liveRoom.status !== 'QUESTION' || liveRoom.currentQIndex !== qIdx) return;
    if (!player.answers) player.answers = {};
    if (player.answers[qIdx]) return; // 이미 제출한 경우 무시

    const activeQuestions = (liveRoom.questions && liveRoom.questions.length)
      ? liveRoom.questions
      : (quizSets[selectedQuizIndex] || quizSets[0]).questions;
    const q = activeQuestions[qIdx];
    if (!q) return;
    const timeSec = Number(Math.max(0.1, Math.min(q.timeLimit, elapsedSec)).toFixed(2));
    const isCorrect = (choice === q.answer);

    if (isCorrect) {
      player.streak = (player.streak || 0) + 1;
      if (player.streak > (player.maxStreak || 0)) {
        player.maxStreak = player.streak;
      }
    } else {
      player.streak = 0;
    }

    const scoreRes = calculateSpeedScore(isCorrect, timeSec, q.timeLimit, q.multiplier || 1, player.streak);
    player.score += scoreRes.totalPoints;

    player.answers[qIdx] = {
      choice,
      timeSec,
      correct: isCorrect,
      basePoints: scoreRes.basePoints,
      streakBonus: scoreRes.streakBonus,
      points: scoreRes.totalPoints,
      streakNow: player.streak
    };

    liveRoom.players[key] = player;

    fetch(getSyncApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _mode: 'player_answer',
        email: cleanEmail,
        qIndex: qIdx,
        answerObj: player.answers[qIdx],
        score: player.score,
        streak: player.streak,
        maxStreak: player.maxStreak
      })
    }).catch(() => {});

    if (isFirebaseConnected && firebaseDb && liveRoom.pin) {
      firebaseDb.ref(`rooms/${liveRoom.pin}/players/${key}`).set(player).catch(() => {});
    }

    updateHostAnswerCounter();
    if (isHostActive()) {
      persistAndBroadcastRoomState();
    }

    // 모든 학생이 응답을 완료했으면 자동으로 즉시 정답 공개!
    if (isHostActive()) {
      const allPlayers = Object.values(liveRoom.players);
      const answeredCount = allPlayers.filter(p => p.answers?.[qIdx] !== undefined).length;
      if (allPlayers.length > 0 && answeredCount >= allPlayers.length) {
        setTimeout(() => {
          if (liveRoom.status === 'QUESTION' && liveRoom.currentQIndex === qIdx) {
            hostRevealAnswer();
          }
        }, 450);
      }
    }
  }

  function updateHostAnswerCounter() {
    const counterEl = document.getElementById('hostAnsweredCount');
    if (!counterEl) return;
    const allPlayers = Object.values(liveRoom.players || {});
    const answeredCount = allPlayers.filter(p => p?.answers?.[liveRoom.currentQIndex] !== undefined).length;
    counterEl.textContent = `${answeredCount} / ${allPlayers.length}`;
  }

  function hostRevealAnswer() {
    clearHostTimers();
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const activeQuestions = (liveRoom.questions && liveRoom.questions.length > 0)
      ? liveRoom.questions
      : qSet.questions;
    const q = activeQuestions[liveRoom.currentQIndex];
    if (!q) return;

    liveRoom.status = 'RESULT';
    SoundFX.playReveal();

    // 미응답 학생은 연속 정답(streak) 초기화 처리 (Firebase에서 빈 answers 객체가 생략된 경우에도 안전하게 초기화)
    Object.values(liveRoom.players || {}).forEach(p => {
      if (!p.answers || typeof p.answers !== 'object') {
        p.answers = {};
      }
      if (!p.answers[liveRoom.currentQIndex]) {
        p.streak = 0;
        p.answers[liveRoom.currentQIndex] = {
          choice: -1,
          timeSec: q.timeLimit,
          correct: false,
          basePoints: 0,
          streakBonus: 0,
          points: 0,
          streakNow: 0
        };
      }
    });

    document.getElementById('hostBtnEndQuestionNow').style.display = 'none';
    const nextBtn = document.getElementById('hostBtnNextStep');
    nextBtn.style.display = 'inline-flex';
    const isLast = (liveRoom.currentQIndex >= activeQuestions.length - 1);
    nextBtn.textContent = isLast ? '🏆 최종 시상대(포디움) 보기 ➡️' : '다음 (실시간 순위 발표) ➡️';

    // 정답 카드 하이라이트 & 오답 카드 흐리게
    for (let i = 0; i < 4; i++) {
      const card = document.getElementById(`hostAnsCard-${i}`);
      if (!card) continue;
      if (i === q.answer) {
        card.classList.add('correct-highlight');
        card.classList.remove('dimmed');
      } else {
        card.classList.add('dimmed');
        card.classList.remove('correct-highlight');
      }
    }

    // 선지별 응답 분포 막대그래프 렌더링
    document.getElementById('hostQuestionLiveNotice').style.display = 'none';
    const distWrap = document.getElementById('hostResultDistWrap');
    const barsBox = document.getElementById('hostDistBarsContainer');
    const expBox = document.getElementById('hostExplanationBox');
    distWrap.style.display = 'block';

    const counts = [0, 0, 0, 0];
    Object.values(liveRoom.players || {}).forEach(p => {
      const ans = p?.answers?.[liveRoom.currentQIndex];
      if (ans && ans.choice >= 0 && ans.choice <= 3) counts[ans.choice]++;
    });
    const maxCount = Math.max(1, ...counts);
    const shapes = ['▲', '◆', '●', '■'];
    const barColors = ['var(--ans-red)', 'var(--ans-blue)', 'var(--ans-yellow)', 'var(--ans-green)'];

    barsBox.innerHTML = counts.map((cnt, idx) => {
      const heightPct = Math.max(12, Math.round((cnt / maxCount) * 135));
      const isRight = (idx === q.answer);
      return `
        <div class="dist-col">
          <div class="dist-count">${cnt}명 ${isRight ? '✅' : ''}</div>
          <div class="dist-bar" style="height:${heightPct}px; background:${barColors[idx]}; opacity:${isRight ? '1' : '0.45'}; border:${isRight ? '3px solid #fff' : 'none'};"></div>
          <div class="dist-label">${shapes[idx]}</div>
        </div>
      `;
    }).join('');

    if (expBox) {
      expBox.style.display = q.explanation ? 'block' : 'none';
      expBox.innerHTML = q.explanation ? `💡 <strong>해설:</strong> ${escapeHtml(q.explanation)}` : '';
    }

    persistAndBroadcastRoomState();
    syncStudentScreenWithRoom();
  }

  function getSortedPlayers() {
    return Object.values(liveRoom.players).slice().sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // 동점일 경우 평균 응답 시간이 더 빠른 학생 우선
      const avgA = getPlayerAvgTime(a);
      const avgB = getPlayerAvgTime(b);
      return avgA - avgB;
    });
  }

  function getPlayerAvgTime(player) {
    const ansArr = Object.values(player.answers || {}).filter(a => a.choice >= 0);
    if (ansArr.length === 0) return 99.99;
    const sum = ansArr.reduce((acc, cur) => acc + (cur.timeSec || 0), 0);
    return Number((sum / ansArr.length).toFixed(2));
  }

  function hostGoToScoreboardOrPodium() {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const activeQuestions = (liveRoom.questions && liveRoom.questions.length > 0)
      ? liveRoom.questions
      : qSet.questions;
    const isLast = (liveRoom.currentQIndex >= activeQuestions.length - 1);
    if (isLast) {
      hostShowFinalPodium();
    } else {
      hostShowMidScoreboard();
    }
  }

  function hostShowMidScoreboard() {
    liveRoom.status = 'SCOREBOARD';
    showHostStage('scoreboard');

    const sorted = getSortedPlayers();
    const qIdx = liveRoom.currentQIndex;

    // 이번 라운드 최단시간 정답자(스피드왕) & 최대 순위 상승자 계산
    let fastestPlayer = null;
    let bestClimber = null;
    let maxClimb = 0;

    sorted.forEach((p, idx) => {
      const currentRank = idx + 1;
      const ans = p?.answers?.[qIdx];
      if (ans && ans.correct) {
        if (!fastestPlayer || ans.timeSec < (fastestPlayer.answers?.[qIdx]?.timeSec ?? 999)) {
          fastestPlayer = p;
        }
      }
      if (p.prevRank > 0) {
        const diff = p.prevRank - currentRank;
        if (diff > maxClimb) {
          maxClimb = diff;
          bestClimber = { player: p, diff };
        }
      }
    });

    const hlBox = document.getElementById('hostRoundHighlights');
    if (hlBox) {
      const badges = [];
      if (fastestPlayer && fastestPlayer.answers?.[qIdx]) {
        const t = Number(fastestPlayer.answers[qIdx].timeSec || 0).toFixed(2);
        badges.push(`
          <div style="background:rgba(255,184,0,0.22); border:2px solid var(--my-gold); padding:0.65rem 1.25rem; border-radius:999px; font-weight:800; font-size:1.05rem;">
            ⚡ 이번 문제 스피드왕: <strong>${fastestPlayer.grade}-${fastestPlayer.classNum} ${escapeHtml(fastestPlayer.name)}</strong> (${t}초 만에 정답!)
          </div>
        `);
      }
      if (bestClimber && bestClimber.diff >= 2) {
        badges.push(`
          <div style="background:rgba(255,51,119,0.25); border:2px solid #ff7aa8; padding:0.65rem 1.25rem; border-radius:999px; font-weight:800; font-size:1.05rem;">
            🚀 순위 급상승: <strong>${bestClimber.player.grade}-${bestClimber.player.classNum} ${escapeHtml(bestClimber.player.name)}</strong> (+${bestClimber.diff}계단 상승!)
          </div>
        `);
      }
      hlBox.innerHTML = badges.join('');
    }

    const listEl = document.getElementById('hostMidLeaderboardList');
    if (listEl) {
      const top5 = sorted.slice(0, 5);
      listEl.innerHTML = top5.map((p, idx) => {
        const ans = p?.answers?.[qIdx];
        const roundPts = ans ? ans.points : 0;
        return `
          <div class="lb-row">
            <div style="display:flex; align-items:center;">
              <span class="lb-rank-badge" style="background:${idx === 0 ? 'var(--my-gold)' : 'var(--my-primary)'}; color:${idx === 0 ? '#25076b' : '#fff'};">${idx + 1}</span>
              <span>${p.grade}-${p.classNum} ${p.studentNum}번 <strong>${escapeHtml(p.name)}</strong></span>
              ${p.streak >= 2 ? `<span class="streak-pill" style="margin-left:0.6rem;">🔥 ${p.streak}연속</span>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:0.8rem;">
              ${roundPts > 0 ? `<span style="color:var(--success); font-size:0.95rem;">+${roundPts.toLocaleString()}점</span>` : ''}
              <span style="font-size:1.3rem; color:var(--my-primary-dark);">${p.score.toLocaleString()}점</span>
            </div>
          </div>
        `;
      }).join('');
    }

    persistAndBroadcastRoomState();
  }

  function hostAdvanceToNextQuestion() {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const activeQuestions = (liveRoom.questions && liveRoom.questions.length > 0)
      ? liveRoom.questions
      : qSet.questions;
    const nextIdx = liveRoom.currentQIndex + 1;
    if (nextIdx < activeQuestions.length) {
      startHostQuestionAtIndex(nextIdx);
    } else {
      hostShowFinalPodium();
    }
  }

  // ==================== 최종 포디움(1~3위) & 기본 1~10등 표시 (+ 전체 등수 펼치기 버튼) ====================
  function hostShowFinalPodium() {
    clearHostTimers();
    liveRoom.status = 'PODIUM';
    liveRoom.showAllFinalRanks = false; // 항상 처음에는 1등~10등까지만 표시!
    showHostStage('podium');
    SoundFX.playFanfare();

    const sorted = getSortedPlayers();

    // 이번 퀴즈 결과를 교사용 통계 히스토리에 자동 저장
    saveCompletedQuizToHistory(sorted);

    // 1. 포디움 (2위 - 1위 - 3위 배치) 렌더링
    const podiumStage = document.getElementById('hostPodiumStage');
    const p1 = sorted[0];
    const p2 = sorted[1];
    const p3 = sorted[2];

    const buildPillar = (p, rankNum, medal) => {
      if (!p) return `<div class="podium-pillar podium-${rankNum}"></div>`;
      return `
        <div class="podium-pillar podium-${rankNum}">
          <div class="podium-avatar">
            <div style="font-size:0.82rem; font-weight:800; color:var(--my-text-muted);">${p.grade}학년 ${p.classNum}반 ${p.studentNum}번</div>
            <div style="font-size:1.35rem; font-weight:900; margin:0.15rem 0;">${escapeHtml(p.name)}</div>
            <div style="font-size:1.05rem; font-weight:900; color:var(--my-primary);">${p.score.toLocaleString()}점</div>
          </div>
          <div class="podium-box">
            <div style="font-size:2.6rem;">${medal}</div>
            <div style="font-size:1.5rem; margin-top:0.2rem;">${rankNum}위</div>
          </div>
        </div>
      `;
    };

    if (podiumStage) {
      podiumStage.innerHTML =
        buildPillar(p2, 2, '🥈') +
        buildPillar(p1, 1, '🥇') +
        buildPillar(p3, 3, '🥉');
    }

    // 2. 포디움 하단 순위표 렌더링 (기본 1등~10등만 표시, 버튼 클릭 시 전체 표시)
    renderFinalLeaderboardRows();

    persistAndBroadcastRoomState();
    syncStudentScreenWithRoom();
  }

  function renderFinalLeaderboardRows() {
    const sorted = getSortedPlayers();
    const listEl = document.getElementById('hostFinalLeaderboardList');
    const titleEl = document.getElementById('finalRankHeaderTitle');
    const toggleBtn = document.getElementById('btnToggleAllRanks');
    if (!listEl) return;

    const totalCount = sorted.length;
    const visiblePlayers = liveRoom.showAllFinalRanks ? sorted : sorted.slice(0, 10);

    if (titleEl) {
      titleEl.textContent = liveRoom.showAllFinalRanks
        ? `🌟 최종 전체 순위 발표 (1등 ~ ${totalCount}등 전원)`
        : `🌟 최종 순위 발표 (1등 ~ ${Math.min(10, totalCount)}등)`;
    }

    if (toggleBtn) {
      if (totalCount <= 10) {
        toggleBtn.style.display = 'none';
      } else {
        toggleBtn.style.display = 'inline-flex';
        toggleBtn.textContent = liveRoom.showAllFinalRanks
          ? '🔼 1등 ~ 10등까지만 접어서 보기'
          : `➕ 모든 등수 보기 (11등 ~ ${totalCount}등 전체 펼치기)`;
      }
    }

    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const qTotal = qSet.questions.length;

    listEl.innerHTML = visiblePlayers.map((p, idx) => {
      const rank = idx + 1;
      const correctCount = Object.values(p.answers || {}).filter(a => a.correct).length;
      const avgSec = getPlayerAvgTime(p);
      const medal = rank === 1 ? '🥇 ' : rank === 2 ? '🥈 ' : rank === 3 ? '🥉 ' : '';

      return `
        <div class="lb-row" style="border-left: 6px solid ${rank <= 3 ? 'var(--my-gold)' : rank <= 10 ? 'var(--my-primary)' : '#94a3b8'};">
          <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap;">
            <span class="lb-rank-badge" style="background:${rank <= 3 ? 'var(--my-gold)' : rank <= 10 ? 'var(--my-primary)' : '#64748b'}; color:${rank <= 3 ? '#25076b' : '#fff'};">
              ${rank}등
            </span>
            <span style="font-size:1.12rem;">
              ${medal}<strong>${p.grade}-${p.classNum} ${p.studentNum}번 ${escapeHtml(p.name)}</strong>
            </span>
            <span class="badge badge-purple">정답 ${correctCount}/${qTotal}</span>
            <span class="badge" style="background:#e0f2fe; color:#0369a1;">평균 ${avgSec}초</span>
            ${p.maxStreak >= 2 ? `<span class="badge badge-gold">🔥최대 ${p.maxStreak}연속</span>` : ''}
          </div>
          <div style="font-size:1.3rem; font-weight:900; color:var(--my-primary-dark);">
            ${p.score.toLocaleString()}점
          </div>
        </div>
      `;
    }).join('');
  }

  function toggleFullFinalLeaderboard() {
    liveRoom.showAllFinalRanks = !liveRoom.showAllFinalRanks;
    renderFinalLeaderboardRows();
  }

  function scrollToTop10Section() {
    const sec = document.getElementById('hostFinalLeaderboardSection');
    if (sec) sec.scrollIntoView({ behavior: 'smooth' });
  }

  function openTeacherStatsAfterGame() {
    openTeacherTab('stats');
  }

  /**
   * 키보드 화살표(→ / PageDown / Space) 또는 화면 우측 플로팅 화살표 버튼(❯)으로
   * 현재 전자칠판 단계에서 다음 단계로 즉시 넘어가는 통합 함수
   */
  function hostNextStepByArrow() {
    const hostView = document.getElementById('view-host');
    if (!hostView || !hostView.classList.contains('active')) return;

    if (liveRoom.status === 'LOBBY') {
      hostStartFirstQuestion();
    } else if (liveRoom.status === 'QUESTION') {
      hostRevealAnswer();
    } else if (liveRoom.status === 'RESULT') {
      hostGoToScoreboardOrPodium();
    } else if (liveRoom.status === 'SCOREBOARD') {
      hostAdvanceToNextQuestion();
    } else if (liveRoom.status === 'PODIUM') {
      toggleFullFinalLeaderboard();
      scrollToTop10Section();
    }
  }

  // 전자칠판 화면에서 키보드 오른쪽 화살표(→), 아래쪽 화살표(↓), 스페이스바, 프리젠터(PageDown) 입력 시 다음 단계 이동
  window.addEventListener('keydown', (e) => {
    const hostView = document.getElementById('view-host');
    if (!hostView || !hostView.classList.contains('active')) return;

    // 입력창(input, textarea, select) 포커스 중일 때는 무시
    const tag = (e.target?.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      hostNextStepByArrow();
    }
  });

  function clearHostTimers() {
    if (liveRoom.timerInterval) {
      clearInterval(liveRoom.timerInterval);
      liveRoom.timerInterval = null;
    }
    if (liveRoom.botTimers && liveRoom.botTimers.length) {
      liveRoom.botTimers.forEach(t => clearTimeout(t));
      liveRoom.botTimers = [];
    }
  }

  // ==================== 학생 모바일 컨트롤러 뷰 동작 ====================
  function showStudentStage(stageName) {
    ['waiting', 'pad', 'feedback'].forEach(st => {
      const el = document.getElementById(`stuStage-${st}`);
      if (el) el.style.display = (st === stageName) ? 'flex' : 'none';
    });
  }

  function refreshStudentPadText() {
    syncStudentScreenWithRoom();
  }

  function submitStudentAnswer(choiceIdx) {
    const savedRoomRaw = localStorage.getItem(STORAGE_KEYS.LIVE_ROOM);
    const activeRoom = savedRoomRaw ? JSON.parse(savedRoomRaw) : liveRoom;

    if (activeRoom.status !== 'QUESTION') return;
    if (currentStudent.lastAnsweredQIndex === activeRoom.currentQIndex) return;

    currentStudent.lastAnsweredQIndex = activeRoom.currentQIndex;
    const elapsedSec = Number(((Date.now() - activeRoom.questionStartedAt) / 1000).toFixed(2));

    // 즉시 피드백 대기 화면 표시
    const fbScreen = document.getElementById('stuStage-feedback');
    fbScreen.className = 'student-feedback-screen';
    document.getElementById('stuFeedbackEmoji').textContent = '⚡';
    document.getElementById('stuFeedbackTitle').textContent = `${elapsedSec}초 만에 응답 완료!`;
    document.getElementById('stuFeedbackPoints').textContent = '스피드 점수 계산 대기 중...';
    document.getElementById('stuFeedbackSub').textContent = '모든 친구들의 응답이 마감되면 정답 여부와 획득 점수가 공개됩니다!';
    showStudentStage('feedback');

    // 호스트에 응답 전달 (다른 창이나 스마트폰에서 열려 있을 때도 Firebase 및 localStorage를 통해 즉시 반영)
    const cleanEmail = normalizeEmail(currentStudent.email);
    const key = emailToKey(cleanEmail);
    liveRoom = {
      ...liveRoom,
      ...activeRoom,
      pin: activeRoom.pin || currentStudent.pin || liveRoom.pin,
      timerInterval: liveRoom.timerInterval,
      botTimers: liveRoom.botTimers,
      players: { ...(activeRoom.players || {}), ...(liveRoom.players || {}) }
    };
    if (!liveRoom.players[key]) {
      liveRoom.players[key] = {
        grade: currentStudent.grade,
        classNum: currentStudent.classNum,
        studentNum: currentStudent.studentNum,
        name: currentStudent.name,
        email: cleanEmail,
        score: 0,
        streak: 0,
        maxStreak: 0,
        prevRank: 0,
        isBot: false,
        answers: {}
      };
    }
    recordPlayerAnswer(currentStudent.email, activeRoom.currentQIndex, choiceIdx, elapsedSec);
    broadcastEvent('PLAYER_ANSWER', {
      email: currentStudent.email,
      qIndex: activeRoom.currentQIndex,
      choice: choiceIdx,
      elapsedSec
    });
  }

  function syncStudentScreenWithRoom() {
    const studentView = document.getElementById('view-student');
    if (!studentView || !studentView.classList.contains('active')) return;

    const savedRoomRaw = localStorage.getItem(STORAGE_KEYS.LIVE_ROOM);
    const room = savedRoomRaw ? JSON.parse(savedRoomRaw) : liveRoom;
    if (!room || !room.status) return;

    // 선생님이 새로운 퀴즈 세트로 방을 새로 열었을 때 학생의 이전 응답 인덱스 초기화!
    if (currentStudent.lastQuizId !== room.quizId || room.status === 'LOBBY') {
      currentStudent.lastQuizId = room.quizId;
      currentStudent.lastAnsweredQIndex = -1;
      currentStudent.pin = room.pin;
    }

    // ★ 가장 중요: 교사 창에서 보낸 실시간 room.questions(새로 등록한 문제들)를 최우선으로 사용!
    const fallbackQSet = quizSets.find(q => q.id === room.quizId) || quizSets[selectedQuizIndex] || quizSets[0];
    const activeQuestions = (room.questions && room.questions.length > 0)
      ? room.questions
      : fallbackQSet.questions;

    const cleanEmail = normalizeEmail(currentStudent.email);
    const myKey = emailToKey(cleanEmail);
    const myPlayer = room.players?.[myKey] || room.players?.[cleanEmail];

    if (myPlayer) {
      document.getElementById('stuBarStreak').textContent = `🔥 ${myPlayer.streak || 0}연속`;
      document.getElementById('stuBarScore').textContent = `${(myPlayer.score || 0).toLocaleString()}점`;
    }

    if (room.status === 'LOBBY') {
      showStudentStage('waiting');
      document.getElementById('stuWaitingTitle').textContent = '입장 완료! 대기 중...';
      document.getElementById('stuWaitingDesc').textContent =
        `[${room.quizTitle || '새 퀴즈'}]에 ${currentStudent.grade}학년 ${currentStudent.classNum}반 ${currentStudent.studentNum}번 ${currentStudent.name} 학생으로 등록되었습니다!`;
    } else if (room.status === 'QUESTION') {
      const q = activeQuestions[room.currentQIndex];
      if (!q) return;

      // 이미 이번 문제를 제출했는지 확인
      if (myPlayer?.answers?.[room.currentQIndex] !== undefined || currentStudent.lastAnsweredQIndex === room.currentQIndex) {
        showStudentStage('feedback');
        return;
      }

      showStudentStage('pad');
      document.getElementById('stuPadQNum').textContent = `문제 ${room.currentQIndex + 1} / ${activeQuestions.length}`;
      document.getElementById('stuPadSpeedHint').textContent =
        q.multiplier === 2 ? '🔥 2배 점수 찬스! 빨리 누를수록 최대 2,000점!' : '⚡ 빨리 누를수록 최대 1,000점!';

      const showText = document.getElementById('stuToggleShowText')?.checked && settings.showQuestionsOnStudent;
      const qBox = document.getElementById('stuPadQuestionText');
      if (qBox) {
        qBox.style.display = showText ? 'block' : 'none';
        qBox.textContent = q.question;
      }
      for (let i = 0; i < 4; i++) {
        const optEl = document.getElementById(`stuPadOpt-${i}`);
        if (optEl) {
          optEl.textContent = showText ? q.options[i] : '';
        }
      }
    } else if (room.status === 'RESULT' || room.status === 'SCOREBOARD') {
      showStudentStage('feedback');
      const ans = myPlayer?.answers?.[room.currentQIndex];
      const fbScreen = document.getElementById('stuStage-feedback');
      const shapes = ['▲ 1번', '◆ 2번', '● 3번', '■ 4번'];
      const q = activeQuestions[room.currentQIndex];

      if (ans && ans.correct) {
        fbScreen.className = 'student-feedback-screen correct';
        document.getElementById('stuFeedbackEmoji').textContent = '🎉';
        document.getElementById('stuFeedbackTitle').textContent = `정답입니다! (${ans.timeSec}초)`;
        document.getElementById('stuFeedbackPoints').textContent =
          `+${ans.points.toLocaleString()}점 획득! ${ans.streakBonus > 0 ? `(🔥연속정답 보너스 +${ans.streakBonus}점 포함)` : ''}`;
        document.getElementById('stuFeedbackSub').textContent = `현재 총점: ${(myPlayer.score || 0).toLocaleString()}점`;
      } else {
        fbScreen.className = 'student-feedback-screen wrong';
        document.getElementById('stuFeedbackEmoji').textContent = '💪';
        document.getElementById('stuFeedbackTitle').textContent = '아까워요! 다음 문제에서 역전해요!';
        document.getElementById('stuFeedbackPoints').textContent = `정답은 [${shapes[q?.answer || 0]}: ${q?.options?.[q?.answer || 0] || ''}] 이었습니다.`;
        document.getElementById('stuFeedbackSub').textContent = `현재 총점: ${(myPlayer?.score || 0).toLocaleString()}점`;
      }
    } else if (room.status === 'PODIUM') {
      showStudentStage('feedback');
      const fbScreen = document.getElementById('stuStage-feedback');
      fbScreen.className = 'student-feedback-screen';
      const sorted = Object.values(room.players || {}).sort((a, b) => b.score - a.score);
      const myRank = sorted.findIndex(p => emailToKey(p.email) === myKey) + 1;

      document.getElementById('stuFeedbackEmoji').textContent = '🏆';
      document.getElementById('stuFeedbackTitle').textContent = '수고했어요! 퀴즈 종료!';
      document.getElementById('stuFeedbackPoints').textContent =
        myRank > 0 ? `내 최종 순위: ${myRank}위 (${(myPlayer?.score || 0).toLocaleString()}점)` : '';
      document.getElementById('stuFeedbackSub').textContent = '전자칠판의 명예의 전당 시상식을 확인해 주세요!';
    }
  }

  // ==================== 멀티탭 & 서로 다른 크롬 프로필(학교/개인) & Firebase 실시간 동기화 ====================
  function persistAndBroadcastRoomState(mode = 'full') {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    // Firebase 키 안전 변환 및 answers 객체 보장
    const safePlayers = {};
    Object.entries(liveRoom.players || {}).forEach(([k, p]) => {
      const sk = emailToKey(p?.email || k);
      const shaped = ensurePlayerShape(p, k);
      if (sk && shaped) safePlayers[sk] = shaped;
    });
    liveRoom.players = safePlayers;

    const serializableRoom = {
      pin: liveRoom.pin,
      quizId: liveRoom.quizId,
      quizTitle: liveRoom.quizTitle,
      questions: (liveRoom.questions && liveRoom.questions.length > 0) ? liveRoom.questions : (qSet ? qSet.questions : []),
      status: liveRoom.status,
      currentQIndex: liveRoom.currentQIndex,
      questionStartedAt: liveRoom.questionStartedAt,
      timeLimit: liveRoom.timeLimit,
      players: safePlayers,
      updatedAt: Date.now()
    };
    localStorage.setItem(STORAGE_KEYS.LIVE_ROOM, JSON.stringify(serializableRoom));
    broadcastEvent('ROOM_STATE_UPDATE', serializableRoom);

    if (isHostActive() || mode === 'host_reset') {
      // 서로 다른 크롬 프로필(학교 계정 창 <-> 개인 계정 창) 및 와이파이 기기 간 실시간 브릿지 동기화
      fetch(getSyncApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _mode: mode, room: serializableRoom })
      }).catch(() => {});

      if (isFirebaseConnected && firebaseDb && liveRoom.pin) {
        firebaseDb.ref('activePin').set(liveRoom.pin).catch(() => {});
        if (mode === 'host_reset') {
          firebaseDb.ref(`rooms/${liveRoom.pin}`).set(serializableRoom).catch(warnHostWriteFailed);
        } else {
          firebaseDb.ref(`rooms/${liveRoom.pin}`).update(serializableRoom).catch(warnHostWriteFailed);
        }
      }
    }
  }

  // 전자칠판 진행이 서버에 저장되지 않으면(교사 로그인이 풀린 경우) 한 번 알려 줘요.
  function warnHostWriteFailed(err) {
    console.warn('방 상태 저장 실패', err);
    if (hostWriteWarned) return;
    hostWriteWarned = true;
    alert('선생님 로그인이 풀려서 게임 진행이 학생 폰에 전달되지 않고 있어요.\n\n같은 브라우저에서 학생 계정으로 로그인하면 선생님 로그인이 바뀌어요. 학생 테스트는 다른 기기나 시크릿 창에서 해 주세요.\n\n교사 페이지에서 tfellow@gmail.com으로 다시 로그인한 뒤 새 게임을 열어 주세요.');
  }

  function ensureFirebaseRoomSubscription(pin) {
    if (!isFirebaseConnected || !firebaseDb || !pin) return;
    if (currentFirebasePin === pin && currentFirebasePinRef) return;
    if (currentFirebasePinRef) {
      try { currentFirebasePinRef.off(); } catch (_) {}
    }
    currentFirebasePin = pin;
    currentFirebasePinRef = firebaseDb.ref(`rooms/${pin}`);
    currentFirebasePinRef.on('value', (snap) => {
      const fbRoom = snap.val();
      if (!fbRoom || !fbRoom.pin) return;

      const normalizedFbPlayers = {};
      Object.entries(fbRoom.players || {}).forEach(([k, pData]) => {
        const sk = emailToKey(pData?.email || k);
        const shaped = ensurePlayerShape(pData, k);
        if (sk && shaped) normalizedFbPlayers[sk] = shaped;
      });
      fbRoom.players = normalizedFbPlayers;

      if (isHostActive()) {
        if (fbRoom.pin === liveRoom.pin) {
          const prevCount = Object.keys(liveRoom.players || {}).length;
          Object.entries(normalizedFbPlayers).forEach(([sk, pData]) => {
            if (!liveRoom.players[sk]) {
              liveRoom.players[sk] = pData;
              SoundFX.playJoinPop();
            } else {
              liveRoom.players[sk] = ensurePlayerShape(liveRoom.players[sk], sk);
              const oldAns = Object.keys(liveRoom.players[sk].answers || {}).length;
              const newAns = Object.keys(pData.answers || {}).length;
              if (newAns > oldAns) {
                liveRoom.players[sk] = pData;
              }
            }
          });
          localStorage.setItem(STORAGE_KEYS.LIVE_ROOM, JSON.stringify({
            ...liveRoom,
            timerInterval: null,
            botTimers: []
          }));
          if (liveRoom.status === 'LOBBY' && Object.keys(liveRoom.players).length !== prevCount) {
            renderHostLobbyPlayers();
          } else if (liveRoom.status === 'QUESTION') {
            updateHostAnswerCounter();
            const allPlayers = Object.values(liveRoom.players);
            const answeredCount = allPlayers.filter(p => p?.answers?.[liveRoom.currentQIndex] !== undefined).length;
            if (allPlayers.length > 0 && answeredCount >= allPlayers.length) {
              hostRevealAnswer();
            }
          }
        }
      } else {
        if (fbRoom.roster && fbRoom.roster.length > 0) {
          studentRoster = fbRoom.roster;
        }
        liveRoom = {
          ...liveRoom,
          ...fbRoom,
          players: normalizedFbPlayers
        };
        localStorage.setItem(STORAGE_KEYS.LIVE_ROOM, JSON.stringify(fbRoom));
        syncStudentScreenWithRoom();
      }
    }, () => {
      // 로그인 전에는 방을 읽을 수 없어요. 로그인한 뒤 다시 연결할 수 있게 비워 둬요.
      if (currentFirebasePin === pin) {
        currentFirebasePin = '';
        currentFirebasePinRef = null;
      }
    });
  }

  function broadcastEvent(type, payload) {
    if (syncChannel) {
      syncChannel.postMessage({ type, payload });
    }
  }

  if (syncChannel) {
    syncChannel.onmessage = (ev) => {
      const { type, payload } = ev.data || {};
      if (type === 'PLAYER_JOIN') {
        if (document.getElementById('view-host')?.classList.contains('active')) {
          registerPlayerIntoLiveRoom(payload);
        }
      } else if (type === 'PLAYER_ANSWER') {
        if (document.getElementById('view-host')?.classList.contains('active')) {
          recordPlayerAnswer(payload.email, payload.qIndex, payload.choice, payload.elapsedSec);
        }
      } else if (type === 'ROOM_STATE_UPDATE') {
        syncStudentScreenWithRoom();
      }
    };
  }

  function syncHostWithStorageRoom() {
    const hostView = document.getElementById('view-host');
    if (!hostView || !hostView.classList.contains('active')) return;
    const savedRoomRaw = localStorage.getItem(STORAGE_KEYS.LIVE_ROOM);
    if (!savedRoomRaw) return;
    try {
      const saved = JSON.parse(savedRoomRaw);
      if (!saved || saved.pin !== liveRoom.pin) return;

      const prevPlayerCount = Object.keys(liveRoom.players || {}).length;
      const incomingPlayers = saved.players || {};

      // 새로 입장한 학생 및 제출된 답안 병합
      Object.entries(incomingPlayers).forEach(([em, rawData]) => {
        const sk = emailToKey(rawData?.email || em);
        const pData = ensurePlayerShape(rawData, em);
        if (!sk || !pData) return;
        if (!liveRoom.players[sk]) {
          liveRoom.players[sk] = pData;
          SoundFX.playJoinPop();
        } else {
          // 학생 창에서 제출한 답안/점수 동기화
          liveRoom.players[sk] = ensurePlayerShape(liveRoom.players[sk], sk);
          const existingAnswers = liveRoom.players[sk].answers || {};
          const incomingAnswers = pData.answers || {};
          if (Object.keys(incomingAnswers).length > Object.keys(existingAnswers).length) {
            liveRoom.players[sk] = pData;
          }
        }
      });

      if (liveRoom.status === 'LOBBY') {
        if (Object.keys(liveRoom.players).length !== prevPlayerCount) {
          renderHostLobbyPlayers();
        }
      } else if (liveRoom.status === 'QUESTION') {
        updateHostAnswerCounter();
        const allPlayers = Object.values(liveRoom.players);
        const answeredCount = allPlayers.filter(p => p?.answers?.[liveRoom.currentQIndex] !== undefined).length;
        if (allPlayers.length > 0 && answeredCount >= allPlayers.length) {
          hostRevealAnswer();
        }
      }
    } catch (_) {}
  }

  window.addEventListener('storage', (ev) => {
    if (ev.key === STORAGE_KEYS.LIVE_ROOM) {
      syncHostWithStorageRoom();
      syncStudentScreenWithRoom();
    }
  });

  // 크롬 file:// 환경 및 서로 다른 크롬 프로필(학교 프로필 창 <-> 개인 프로필 창)에서도 0.4초 이내에 실시간 동기화 작동
  setInterval(async () => {
    // Firebase 클라우드가 연결되어 있지 않은 오프라인 로컬 모드이거나 호스트 창일 때만 로컬 브릿지 폴백 조회
    if (!isFirebaseConnected || isHostActive()) {
      try {
        const res = await fetch(getSyncApiUrl());
        if (res.ok) {
          const remoteRoom = await res.json();
          if (remoteRoom && remoteRoom._lanIp && liveRoom._lanIp !== remoteRoom._lanIp) {
            liveRoom._lanIp = remoteRoom._lanIp;
          }
          if (remoteRoom && remoteRoom.pin) {
            if (isHostActive()) {
              // 호스트 창일 때: 원격 학생 목록만 병합
              if (remoteRoom.pin === liveRoom.pin && remoteRoom.players) {
                Object.entries(remoteRoom.players).forEach(([em, rawData]) => {
                  const sk = emailToKey(rawData?.email || em);
                  const pData = ensurePlayerShape(rawData, em);
                  if (!sk || !pData) return;
                  if (!liveRoom.players[sk] || Object.keys(pData.answers || {}).length > Object.keys(liveRoom.players[sk]?.answers || {}).length) {
                    liveRoom.players[sk] = pData;
                  }
                });
              }
            } else if (!isFirebaseConnected) {
              // 오프라인 로컬 모드 학생 창일 때만 로컬 서버 방 상태 적용
              if (remoteRoom.roster && remoteRoom.roster.length > 0) {
                studentRoster = remoteRoom.roster;
              }
              localStorage.setItem(STORAGE_KEYS.LIVE_ROOM, JSON.stringify(remoteRoom));
              const pinEl = document.getElementById('studentPinInput');
              if (pinEl) pinEl.value = remoteRoom.pin;
            }
          }
        }
      } catch (_) {}
    }
    syncHostWithStorageRoom();
    syncStudentScreenWithRoom();
  }, 450);

  // ==================== 교사용 통계 대시보드 & 엑셀 리포트 다운로드 ====================
  function buildSimulatedSessionRecord(quizSet, students, customLabel) {
    const qStats = quizSet.questions.map((q, qIdx) => ({
      qIndex: qIdx,
      question: q.question,
      options: q.options,
      answer: q.answer,
      counts: [0, 0, 0, 0],
      correctCount: 0,
      totalTimeSec: 0
    }));

    const studentResults = students.map(stu => {
      let totalScore = 0;
      let streak = 0;
      let maxStreak = 0;
      let correctCnt = 0;
      let timeSum = 0;
      const perQuestion = [];

      quizSet.questions.forEach((q, qIdx) => {
        const isCorrect = Math.random() < (qIdx === 3 ? 0.45 : 0.78); // 4번 문항을 매력적 오답 문항으로 시뮬레이션
        const choice = isCorrect ? q.answer : [0, 1, 2, 3].filter(c => c !== q.answer)[Math.floor(Math.random() * 3)];
        const timeSec = Number((1.2 + Math.random() * (q.timeLimit * 0.65)).toFixed(2));

        if (isCorrect) {
          streak++;
          if (streak > maxStreak) maxStreak = streak;
          correctCnt++;
        } else {
          streak = 0;
        }

        const sc = calculateSpeedScore(isCorrect, timeSec, q.timeLimit, q.multiplier || 1, streak);
        totalScore += sc.totalPoints;
        timeSum += timeSec;

        qStats[qIdx].counts[choice]++;
        if (isCorrect) qStats[qIdx].correctCount++;
        qStats[qIdx].totalTimeSec += timeSec;

        perQuestion.push({
          qIndex: qIdx,
          choice,
          correct: isCorrect,
          timeSec,
          points: sc.totalPoints
        });
      });

      return {
        grade: stu.grade,
        classNum: stu.classNum,
        studentNum: stu.studentNum,
        name: stu.name,
        email: stu.email,
        score: totalScore,
        correctCount: correctCnt,
        totalQuestions: quizSet.questions.length,
        accuracy: Math.round((correctCnt / quizSet.questions.length) * 100),
        avgTimeSec: Number((timeSum / quizSet.questions.length).toFixed(2)),
        maxStreak,
        perQuestion
      };
    });

    studentResults.sort((a, b) => b.score - a.score || a.avgTimeSec - b.avgTimeSec);

    return {
      sessionId: 'sess_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      quizId: quizSet.id,
      quizTitle: quizSet.title,
      playedAt: customLabel || new Date().toLocaleString('ko-KR'),
      totalPlayers: studentResults.length,
      questionStats: qStats,
      results: studentResults
    };
  }

  function saveCompletedQuizToHistory(sortedPlayers) {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    if (!qSet || sortedPlayers.length === 0) return;

    const qStats = qSet.questions.map((q, qIdx) => ({
      qIndex: qIdx,
      question: q.question,
      options: q.options,
      answer: q.answer,
      counts: [0, 0, 0, 0],
      correctCount: 0,
      totalTimeSec: 0
    }));

    const results = sortedPlayers.map(p => {
      let correctCnt = 0;
      let timeSum = 0;
      const perQuestion = qSet.questions.map((q, qIdx) => {
        const ans = p.answers?.[qIdx] || { choice: -1, correct: false, timeSec: q.timeLimit, points: 0 };
        if (ans.choice >= 0 && ans.choice <= 3) {
          qStats[qIdx].counts[ans.choice]++;
        }
        if (ans.correct) {
          correctCnt++;
          qStats[qIdx].correctCount++;
        }
        qStats[qIdx].totalTimeSec += (ans.timeSec || 0);
        timeSum += (ans.timeSec || 0);
        return {
          qIndex: qIdx,
          choice: ans.choice,
          correct: ans.correct,
          timeSec: ans.timeSec,
          points: ans.points
        };
      });

      return {
        grade: p.grade,
        classNum: p.classNum,
        studentNum: p.studentNum,
        name: p.name,
        email: p.email,
        score: p.score,
        correctCount: correctCnt,
        totalQuestions: qSet.questions.length,
        accuracy: Math.round((correctCnt / qSet.questions.length) * 100),
        avgTimeSec: Number((timeSum / qSet.questions.length).toFixed(2)),
        maxStreak: p.maxStreak || 0,
        perQuestion
      };
    });

    const record = {
      sessionId: 'sess_' + Date.now(),
      quizId: qSet.id,
      quizTitle: qSet.title,
      playedAt: new Date().toLocaleString('ko-KR'),
      totalPlayers: results.length,
      questionStats: qStats,
      results
    };

    quizHistory.unshift(record);
    saveStateToStorage();
  }

  function generateSampleQuizHistory() {
    const qSet = quizSets[selectedQuizIndex] || quizSets[0];
    const class7 = studentRoster.filter(s => s.classNum === 7);
    const targetStudents = class7.length > 0 ? class7 : studentRoster.slice(0, 20);
    const label = `${new Date().toLocaleDateString('ko-KR')} 수업 (${targetStudents[0]?.grade || 2}학년 ${targetStudents[0]?.classNum || 7}반 ${targetStudents.length}명)`;
    const rec = buildSimulatedSessionRecord(qSet, targetStudents, label);
    quizHistory.unshift(rec);
    saveStateToStorage();
    renderStatsDashboard();
  }

  function renderStatsDashboard() {
    const sessionSel = document.getElementById('statsSessionSelect');
    const classFilterSel = document.getElementById('statsClassFilter');
    if (!sessionSel) return;

    if (quizHistory.length === 0) {
      createInitialSampleHistory();
    }

    const prevSessionId = sessionSel.value;
    sessionSel.innerHTML = quizHistory.map((h, idx) =>
      `<option value="${h.sessionId}">[${idx + 1}] ${escapeHtml(h.playedAt)} - ${escapeHtml(h.quizTitle)} (${h.totalPlayers}명)</option>`
    ).join('');

    if (quizHistory.some(h => h.sessionId === prevSessionId)) {
      sessionSel.value = prevSessionId;
    }

    const currentSession = quizHistory.find(h => h.sessionId === sessionSel.value) || quizHistory[0];
    if (!currentSession) return;

    // 학급 필터 옵션 업데이트
    const prevClass = classFilterSel?.value || 'ALL';
    const classesInSession = Array.from(new Set(currentSession.results.map(r => `${r.grade}-${r.classNum}`))).sort();
    if (classFilterSel) {
      classFilterSel.innerHTML = `<option value="ALL">전체 학급 보기</option>` +
        classesInSession.map(c => {
          const [g, cl] = c.split('-');
          return `<option value="${c}">${g}학년 ${cl}반</option>`;
        }).join('');
      if (classesInSession.includes(prevClass)) classFilterSel.value = prevClass;
    }

    const activeClassFilter = classFilterSel?.value || 'ALL';
    const filteredResults = currentSession.results.filter(r =>
      activeClassFilter === 'ALL' ? true : `${r.grade}-${r.classNum}` === activeClassFilter
    );

    // 1. 상단 4대 요약 카드 업데이트
    const pCount = filteredResults.length;
    const avgAcc = pCount ? Math.round(filteredResults.reduce((a, b) => a + b.accuracy, 0) / pCount) : 0;
    const avgTime = pCount ? (filteredResults.reduce((a, b) => a + b.avgTimeSec, 0) / pCount).toFixed(2) : '0.00';
    const avgScore = pCount ? Math.round(filteredResults.reduce((a, b) => a + b.score, 0) / pCount) : 0;
    const topStudent = filteredResults[0];

    document.getElementById('statMetricPlayers').textContent = `${pCount}명`;
    document.getElementById('statMetricClassInfo').textContent =
      activeClassFilter === 'ALL' ? '참여 학급 전체' : `${activeClassFilter.replace('-', '학년 ')}반 학생`;
    document.getElementById('statMetricAccuracy').textContent = `${avgAcc}%`;
    document.getElementById('statMetricAvgTime').textContent = `${avgTime}초`;
    document.getElementById('statMetricAvgScore').textContent = `${avgScore.toLocaleString()}점`;
    document.getElementById('statMetricTopScorer').textContent =
      topStudent ? `1위: ${topStudent.grade}-${topStudent.classNum} ${topStudent.name} (${topStudent.score.toLocaleString()}점)` : '최고 득점자: -';

    // 2. 가장 많이 틀린 문항 워스트 3 렌더링
    const worstContainer = document.getElementById('worstQuestionsContainer');
    const qStatsWithRate = currentSession.questionStats.map(qs => {
      const totalPlayers = Math.max(1, currentSession.totalPlayers);
      const acc = Math.round((qs.correctCount / totalPlayers) * 100);
      const avgSec = (qs.totalTimeSec / totalPlayers).toFixed(2);
      return { ...qs, accuracy: acc, wrongRate: 100 - acc, avgSec };
    });

    const worst3 = qStatsWithRate.slice().sort((a, b) => a.accuracy - b.accuracy).slice(0, 3);
    const shapes = ['▲', '◆', '●', '■'];

    if (worstContainer) {
      worstContainer.innerHTML = worst3.map(w => `
        <div style="padding:0.9rem 1rem; border-radius:12px; background:#fff5f5; border:1px solid #fecaca;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.35rem;">
            <span class="badge badge-red">Q${w.qIndex + 1} · 정답률 ${w.accuracy}% (오답률 ${w.wrongRate}%)</span>
            <span style="font-size:0.8rem; color:var(--my-text-muted);">평균 응답: ${w.avgSec}초</span>
          </div>
          <div style="font-weight:800; font-size:0.95rem; margin-bottom:0.45rem;">${escapeHtml(w.question)}</div>
          <div style="font-size:0.82rem; color:#15803d; font-weight:800;">
            ✓ 정답: ${shapes[w.answer]} ${escapeHtml(w.options[w.answer] || '')}
          </div>
        </div>
      `).join('');
    }

    // 3. 문항별 상세 분석표 렌더링
    const qTbody = document.getElementById('questionStatsTbody');
    if (qTbody) {
      qTbody.innerHTML = qStatsWithRate.map(qs => {
        const total = Math.max(1, currentSession.totalPlayers);
        return `
          <tr>
            <td><strong>Q${qs.qIndex + 1}</strong></td>
            <td style="max-width:320px;"><strong>${escapeHtml(qs.question)}</strong></td>
            <td><span class="badge badge-green">${shapes[qs.answer]} ${escapeHtml(qs.options[qs.answer])}</span></td>
            <td>
              <span class="badge ${qs.accuracy >= 70 ? 'badge-green' : qs.accuracy >= 50 ? 'badge-gold' : 'badge-red'}">
                ${qs.accuracy}% (${qs.correctCount}/${currentSession.totalPlayers}명)
              </span>
            </td>
            <td>${qs.avgSec}초</td>
            ${[0, 1, 2, 3].map(i => {
              const cnt = qs.counts[i] || 0;
              const pct = Math.round((cnt / total) * 100);
              const isAns = (i === qs.answer);
              return `<td style="background:${isAns ? '#f0fdf4' : 'transparent'}; font-weight:${isAns ? '800' : '500'};">
                ${escapeHtml(qs.options[i])}<br/>
                <span style="font-size:0.8rem; color:${isAns ? '#15803d' : 'var(--my-text-muted)'};">${cnt}명 (${pct}%) ${isAns ? '✓' : ''}</span>
              </td>`;
            }).join('')}
          </tr>
        `;
      }).join('');
    }

    // 4. 학생별 성적표 렌더링
    const stuTbody = document.getElementById('studentStatsTbody');
    if (stuTbody) {
      stuTbody.innerHTML = filteredResults.map((r, idx) => {
        const oxBadges = (r.perQuestion || []).map((pq, qIdx) =>
          `<span title="Q${qIdx + 1}: ${pq.timeSec}초 (${pq.points}점)" style="display:inline-block; width:22px; height:22px; line-height:22px; text-align:center; border-radius:6px; margin-right:3px; font-size:0.75rem; font-weight:900; background:${pq.correct ? '#dcfce7' : '#fee2e2'}; color:${pq.correct ? '#15803d' : '#b91c1c'};">${pq.correct ? 'O' : 'X'}</span>`
        ).join('');

        return `
          <tr>
            <td><strong>${idx + 1}위</strong></td>
            <td><span class="badge badge-purple">${r.grade}-${r.classNum} ${r.studentNum}번</span></td>
            <td><strong>${escapeHtml(r.name)}</strong></td>
            <td><code>${escapeHtml(r.email)}</code></td>
            <td><strong style="color:var(--my-primary-dark); font-size:1rem;">${r.score.toLocaleString()}점</strong></td>
            <td>${r.correctCount} / ${r.totalQuestions}</td>
            <td><span class="badge ${r.accuracy >= 80 ? 'badge-green' : r.accuracy >= 50 ? 'badge-gold' : 'badge-red'}">${r.accuracy}%</span></td>
            <td>⚡ ${r.avgTimeSec}초</td>
            <td>🔥 ${r.maxStreak}연속</td>
            <td>${oxBadges}</td>
          </tr>
        `;
      }).join('');
    }

    // 5. 학급별 누적 비교 및 학생 성장 추이 렌더링
    renderClassComparisonAndStudentGrowth();
  }

  function renderClassComparisonAndStudentGrowth() {
    const classBox = document.getElementById('classComparisonContainer');
    const stuSelect = document.getElementById('studentGrowthSelect');
    if (!classBox || !stuSelect) return;

    // 모든 히스토리에서 학급별 평균 정답률과 평균 점수 집계
    const classAgg = {};
    quizHistory.forEach(sess => {
      (sess.results || []).forEach(r => {
        const key = `${r.grade}학년 ${r.classNum}반`;
        if (!classAgg[key]) classAgg[key] = { count: 0, scoreSum: 0, accSum: 0 };
        classAgg[key].count++;
        classAgg[key].scoreSum += r.score;
        classAgg[key].accSum += r.accuracy;
      });
    });

    const classEntries = Object.entries(classAgg);
    if (classEntries.length > 0) {
      classBox.innerHTML = classEntries.map(([cName, data]) => {
        const avgAcc = Math.round(data.accSum / data.count);
        const avgSc = Math.round(data.scoreSum / data.count);
        return `
          <div style="margin-bottom:0.65rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.86rem; font-weight:800; margin-bottom:0.25rem;">
              <span>🏫 ${cName} (누적 ${data.count}명 참여)</span>
              <span>평균 정답률 ${avgAcc}% · 평균 ${avgSc.toLocaleString()}점</span>
            </div>
            <div style="height:10px; background:#ede9fe; border-radius:999px; overflow:hidden;">
              <div style="width:${avgAcc}%; height:100%; background:linear-gradient(90deg, var(--my-primary), var(--my-accent));"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 학생 성장 추이 드롭다운 채우기
    const prevStu = stuSelect.value;
    stuSelect.innerHTML = studentRoster.map(s =>
      `<option value="${s.email}">${s.grade}-${s.classNum} ${s.studentNum}번 ${escapeHtml(s.name)}</option>`
    ).join('');
    if (studentRoster.some(s => s.email === prevStu)) {
      stuSelect.value = prevStu;
    }
    renderStudentGrowthTrend();
  }

  function renderStudentGrowthTrend() {
    const stuSelect = document.getElementById('studentGrowthSelect');
    const growthBox = document.getElementById('studentGrowthContainer');
    if (!stuSelect || !growthBox) return;

    const targetEmail = normalizeEmail(stuSelect.value);
    const records = [];

    quizHistory.slice().reverse().forEach(sess => {
      const found = (sess.results || []).find(r => normalizeEmail(r.email) === targetEmail);
      if (found) {
        records.push({
          playedAt: sess.playedAt,
          quizTitle: sess.quizTitle,
          score: found.score,
          accuracy: found.accuracy,
          avgTimeSec: found.avgTimeSec
        });
      }
    });

    if (records.length === 0) {
      growthBox.innerHTML = `<div style="font-size:0.85rem; color:var(--my-text-muted); padding:0.6rem 0;">아직 해당 학생의 퀴즈 참여 기록이 없습니다.</div>`;
      return;
    }

    growthBox.innerHTML = records.map((rec, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; padding:0.5rem 0.75rem; background:#f8f6fc; border-radius:8px; margin-bottom:0.4rem; font-size:0.84rem;">
        <div>
          <span class="badge badge-purple">${idx + 1}회차</span>
          <strong style="margin-left:0.35rem;">${escapeHtml(rec.quizTitle)}</strong>
        </div>
        <div style="font-weight:800;">
          정답률 <span style="color:var(--success);">${rec.accuracy}%</span> ·
          속도 <span>${rec.avgTimeSec}초</span> ·
          <span style="color:var(--my-primary);">${rec.score.toLocaleString()}점</span>
        </div>
      </div>
    `).join('');
  }

  // 현재 선택된 회차의 학생 성적표 & 문항 분석을 엑셀(.xlsx) 파일로 다운로드
  function exportSessionReportToExcel() {
    if (typeof XLSX === 'undefined') return;
    const sessionSel = document.getElementById('statsSessionSelect');
    const currentSession = quizHistory.find(h => h.sessionId === sessionSel?.value) || quizHistory[0];
    if (!currentSession) return;

    // 시트 1: 학생별 종합 성적표
    const stuRows = [
      ['순위', '학년', '반', '번호', '이름', '이메일', '총점', '정답수', '문항수', '정답률(%)', '평균응답시간(초)', '최대연속정답']
    ];
    currentSession.results.forEach((r, idx) => {
      stuRows.push([
        idx + 1, r.grade, r.classNum, r.studentNum, r.name, r.email,
        r.score, r.correctCount, r.totalQuestions, r.accuracy, r.avgTimeSec, r.maxStreak
      ]);
    });

    // 시트 2: 문항별 정답률 및 선지 분석
    const qRows = [
      ['문항번호', '문제', '정답번호', '정답률(%)', '평균응답시간(초)', '보기1 선택수', '보기2 선택수', '보기3 선택수', '보기4 선택수']
    ];
    currentSession.questionStats.forEach(qs => {
      const total = Math.max(1, currentSession.totalPlayers);
      const acc = Math.round((qs.correctCount / total) * 100);
      const avgSec = Number((qs.totalTimeSec / total).toFixed(2));
      qRows.push([
        qs.qIndex + 1, qs.question, qs.answer + 1, acc, avgSec,
        qs.counts[0] || 0, qs.counts[1] || 0, qs.counts[2] || 0, qs.counts[3] || 0
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet(stuRows);
    const ws2 = XLSX.utils.aoa_to_sheet(qRows);
    XLSX.utils.book_append_sheet(wb, ws1, '학생별_성적표');
    XLSX.utils.book_append_sheet(wb, ws2, '문항별_오답분석');

    const safeTitle = currentSession.quizTitle.replace(/[\\/:*?"<>|]/g, '_').slice(0, 25);
    XLSX.writeFile(wb, `MY_Kahoot_성적리포트_${safeTitle}.xlsx`);
  }

  // ==================== 보안 설정 및 Firebase 클라우드 연결 ====================
  function saveSecuritySettings() {
    const domInput = document.getElementById('settingAllowedDomain').value.trim();
    settings.allowedDomain = domInput.startsWith('@') ? domInput : '@' + domInput;
    settings.strictRosterOnly = document.getElementById('settingStrictRosterOnly').checked;
    settings.showQuestionsOnStudent = document.getElementById('settingShowQuestionsOnStudent').checked;

    document.getElementById('allowedDomainBadge').textContent = `${settings.allowedDomain} 전용`;
    saveStateToStorage();
    alert(`설정이 저장되었습니다!\n- 허용 도메인: ${settings.allowedDomain}\n- 사전 등록 학생 명단 전용 로그인: ${settings.strictRosterOnly ? '켜짐(ON)' : '꺼짐(OFF)'}`);
  }

  function connectFirebaseFromInput() {
    const raw = document.getElementById('firebaseConfigInput').value.trim();
    if (!raw) {
      alert('Firebase 설정(JSON)을 입력해 주세요.');
      return;
    }
    try {
      const cleaned = raw
        .replace(/const\s+firebaseConfig\s*=\s*/, '')
        .replace(/;$/, '');
      const cfg = JSON.parse(cleaned);
      initFirebaseWithConfig(cfg);
      localStorage.setItem(STORAGE_KEYS.FIREBASE_CFG, JSON.stringify(cfg));
      alert('Firebase 실시간 클라우드 및 Google 인증이 성공적으로 연결되었습니다!');
    } catch (err) {
      alert('Firebase 설정 형식을 확인해 주세요 (유효한 JSON 형식이어야 합니다): ' + err.message);
    }
  }

  function initFirebaseWithConfig(cfg) {
    if (typeof firebase === 'undefined' || !cfg || !cfg.apiKey) return;
    try {
      if (!firebase.apps.length) {
        firebaseApp = firebase.initializeApp(cfg);
      } else {
        firebaseApp = firebase.app();
      }
      firebaseAuth = firebase.auth();
      firebaseDb = firebase.database();
      isFirebaseConnected = true;

      const dot = document.getElementById('connStatusDot');
      const txt = document.getElementById('connStatusText');
      const pill = document.getElementById('firebaseStatusPill');
      if (dot) dot.classList.add('cloud');
      if (txt) txt.textContent = 'Firebase 클라우드 실시간 연결됨';
      if (pill) {
        pill.textContent = 'Firebase 클라우드 연결됨 (my-kahoot-smy)';
        pill.className = 'badge badge-green';
      }

      // 학생 명단은 이제 선생님만 받아요. 학생은 로그인한 뒤 자기 줄 하나만 받아요.
      watchAuthState();

      // 현재 교사가 연 최신 PIN 번호 실시간 감지 및 방 구독 연결
      firebaseDb.ref('activePin').on('value', (snap) => {
        const activePin = String(snap.val() || '').trim();
        if (activePin && !isHostActive()) {
          const pinEl = document.getElementById('studentPinInput');
          if (pinEl) {
            pinEl.value = activePin;
          }
          const pinChanged = currentStudent.pin && currentStudent.pin !== activePin;
          currentStudent.pin = activePin;
          liveRoom.pin = activePin;
          ensureFirebaseRoomSubscription(activePin);

          // 이미 로그인/입장 대기 중인 학생인데 교사가 새 방을 열었다면 자동으로 새 방에 학생 등록
          if (currentStudent.verified && pinChanged) {
            currentStudent.lastAnsweredQIndex = -1;
            registerPlayerIntoLiveRoom({
              grade: currentStudent.grade,
              classNum: currentStudent.classNum,
              studentNum: currentStudent.studentNum,
              name: currentStudent.name,
              email: currentStudent.email
            });
          }
        }
      });

      const urlPin = new URLSearchParams(window.location.search).get('pin');
      if (urlPin) {
        ensureFirebaseRoomSubscription(urlPin.trim());
      } else if (liveRoom.pin) {
        ensureFirebaseRoomSubscription(liveRoom.pin);
      }

    } catch (e) {
      console.warn('Firebase 초기화 참고:', e);
    }
  }

  function disconnectFirebase() {
    localStorage.removeItem(STORAGE_KEYS.FIREBASE_CFG);
    isFirebaseConnected = false;
    const dot = document.getElementById('connStatusDot');
    const txt = document.getElementById('connStatusText');
    const pill = document.getElementById('firebaseStatusPill');
    if (dot) dot.classList.remove('cloud');
    if (txt) txt.textContent = '실시간 동기화 준비됨';
    if (pill) {
      pill.textContent = '로컬/멀티탭 모드 작동 중';
      pill.className = 'badge badge-purple';
    }
    alert('로컬/멀티탭 실시간 모드로 전환되었습니다.');
  }

  function syncRosterToCloud() {
    if (isFirebaseConnected && firebaseDb && !(authUser && isTeacherEmail(authUser.email))) {
      alert('선생님 계정으로 로그인되어 있지 않아 명단이 서버에 저장되지 않았어요. 교사 페이지에서 로그인한 뒤 다시 올려 주세요.');
      return;
    }
    if (isFirebaseConnected && firebaseDb && authUser && isTeacherEmail(authUser.email)) {
      firebaseDb.ref('schoolRoster').set(studentRoster).catch(() => {});
      writeRosterLookup();
    }
  }

  // ==================== 📚 과제 모드 (학생이 혼자 스스로 풀기) ====================
  // homework/{id}: 선생님이 낸 과제 (문항·정답·해설, 대상 반, 마감일, 열림 여부)
  // homeworkResults/{id}/{학생키}: 학생 본인 결과 (본인만 쓰고 읽어요, 선생님은 전체를 봐요)
  let hwTeacherList = {};
  let hwTeacherResults = {};
  let hwSelectedId = '';
  let hwStudentList = {};
  let hwMyResults = {};
  let hwPlay = null;
  let hwPendingId = '';

  function hwArr(v) {
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object') return Object.keys(v).sort((a, b) => Number(a) - Number(b)).map(k => v[k]);
    return [];
  }

  function hwQuestions(hw) {
    return hwArr(hw && hw.questions).filter(Boolean).map(q => ({
      question: String(q.question || ''),
      options: [0, 1, 2, 3].map(i => String(hwArr(q.options)[i] ?? '')),
      answer: Number(q.answer) || 0,
      explanation: String(q.explanation || '')
    }));
  }

  function hwTargets(hw) {
    return hwArr(hw && hw.targets).map(t => String(t).trim()).filter(Boolean);
  }

  function hwTargetLabel(hw) {
    const t = hwTargets(hw);
    return t.length ? t.map(k => k.replace('-', '학년 ') + '반').join(', ') : '전체 학생';
  }

  function hwIsForStudent(hw, stu) {
    const t = hwTargets(hw);
    return t.length === 0 || t.includes(`${stu.grade}-${stu.classNum}`);
  }

  function hwLink(id) {
    const base = window.location.protocol.startsWith('http') ? new URL('student.html', window.location.href).href : NEW_BASE_URL + 'student.html';
    return `${base}?hw=${encodeURIComponent(id)}`;
  }

  function hwNeedsCloud() {
    if (isFirebaseConnected && firebaseDb) return true;
    alert('과제 기능은 인터넷(Firebase 클라우드)에 연결되어 있을 때만 쓸 수 있어요.');
    return false;
  }

  // ---------- 선생님: 과제 내기·관리·결과 보기 ----------
  async function loadTeacherHomework() {
    renderTeacherHomework();
    if (!isFirebaseConnected || !firebaseDb || !isTeacherSignedIn()) return;
    try {
      const [hwSnap, resSnap] = await Promise.all([
        firebaseDb.ref('homework').once('value'),
        firebaseDb.ref('homeworkResults').once('value')
      ]);
      hwTeacherList = hwSnap.val() || {};
      hwTeacherResults = resSnap.val() || {};
    } catch (err) {
      console.warn('과제 읽기 실패', err);
      const box = document.getElementById('hwTeacherListBox');
      if (box) box.innerHTML = '<p style="color:var(--danger); font-weight:700;">과제 목록을 읽지 못했어요. 데이터베이스 규칙이 아직 배포되지 않았거나 인터넷 연결이 끊겼을 수 있어요.</p>';
      return;
    }
    if (hwSelectedId && !hwTeacherList[hwSelectedId]) hwSelectedId = '';
    renderTeacherHomework();
  }

  function renderTeacherHomework() {
    const sel = document.getElementById('hwQuizSelect');
    if (sel) {
      const prev = sel.value;
      sel.innerHTML = quizSets.map((q, i) => `<option value="${i}">${escapeHtml(q.title)} (${toList(q.questions).length}문항)</option>`).join('');
      sel.value = (prev !== '' && quizSets[Number(prev)]) ? prev : String(selectedQuizIndex);
    }
    const box = document.getElementById('hwTeacherListBox');
    if (!box) return;
    const ids = Object.keys(hwTeacherList).sort((a, b) => String(hwTeacherList[b].createdAt || '').localeCompare(String(hwTeacherList[a].createdAt || '')));
    if (ids.length === 0) {
      box.innerHTML = '<p style="color:var(--my-text-muted);">아직 낸 과제가 없어요. 왼쪽에서 퀴즈를 골라 과제를 내 보세요.</p>';
    } else {
      box.innerHTML = ids.map(id => {
        const hw = hwTeacherList[id];
        const done = Object.keys(hwTeacherResults[id] || {}).length;
        const isSel = id === hwSelectedId;
        return `
          <div style="padding:0.8rem 1rem; border-radius:12px; border:2px solid ${isSel ? 'var(--my-primary)' : 'var(--my-border)'}; background:${isSel ? '#f4f0ff' : '#fff'}; display:flex; flex-direction:column; gap:0.45rem;">
            <div style="display:flex; justify-content:space-between; gap:0.5rem; flex-wrap:wrap; align-items:center;">
              <div style="font-weight:800; color:var(--my-primary-dark);">${escapeHtml(hw.title)}</div>
              <span class="badge ${hw.open ? 'badge-green' : 'badge-red'}">${hw.open ? '열림' : '마감'}</span>
            </div>
            <div style="font-size:0.8rem; color:var(--my-text-muted);">
              ${hwQuestions(hw).length}문항 · 대상: ${escapeHtml(hwTargetLabel(hw))}${hw.due ? ' · 마감일: ' + escapeHtml(hw.due) : ''} · 제출 ${done}명
            </div>
            <div style="display:flex; gap:0.35rem; flex-wrap:wrap;">
              <button class="btn btn-primary btn-sm" onclick="MYKahoot.selectHomework('${id}')">📋 결과 보기</button>
              <button class="btn btn-outline btn-sm" onclick="MYKahoot.copyHomeworkLink('${id}')">🔗 학생 링크 복사</button>
              <button class="btn btn-outline btn-sm" onclick="MYKahoot.previewHomework('${id}')">👀 미리 풀어보기</button>
              <button class="btn btn-outline btn-sm" onclick="MYKahoot.toggleHomeworkOpen('${id}')">${hw.open ? '⏸ 마감하기' : '▶ 다시 열기'}</button>
              <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="MYKahoot.deleteHomework('${id}')">삭제</button>
            </div>
          </div>`;
      }).join('');
    }
    renderTeacherHomeworkResults();
  }

  function hwResultRows(id) {
    const hw = hwTeacherList[id];
    if (!hw) return [];
    const results = hwTeacherResults[id] || {};
    const rows = [];
    const seen = new Set();
    studentRoster.forEach(stu => {
      if (!stu || !hwIsForStudent(hw, stu)) return;
      const key = emailToKey(stu.email);
      seen.add(key);
      rows.push({ ...stu, result: results[key] || null });
    });
    Object.keys(results).forEach(key => {
      if (seen.has(key)) return;
      const r = results[key];
      rows.push({ grade: r.grade, classNum: r.classNum, studentNum: r.studentNum, name: r.name, email: r.email, result: r });
    });
    rows.sort((a, b) => (a.grade - b.grade) || (a.classNum - b.classNum) || (a.studentNum - b.studentNum));
    return rows;
  }

  function hwFmtTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function renderTeacherHomeworkResults() {
    const box = document.getElementById('hwTeacherResultBox');
    if (!box) return;
    const hw = hwTeacherList[hwSelectedId];
    if (!hw) {
      box.innerHTML = '<p style="color:var(--my-text-muted);">과제의 [📋 결과 보기]를 누르면 학생별 결과가 여기에 나와요.</p>';
      return;
    }
    const rows = hwResultRows(hwSelectedId);
    const doneRows = rows.filter(r => r.result);
    const total = hwQuestions(hw).length;
    const avg = doneRows.length ? Math.round(doneRows.reduce((s, r) => s + (Number(r.result.bestScore) || 0), 0) / doneRows.length / Math.max(1, total) * 100) : 0;
    box.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:0.5rem; flex-wrap:wrap; margin-bottom:0.6rem;">
        <div style="font-weight:800; color:var(--my-primary-dark);">${escapeHtml(hw.title)}</div>
        <div style="display:flex; gap:0.4rem; flex-wrap:wrap;">
          <span class="badge badge-purple">제출 ${doneRows.length} / ${rows.length}명</span>
          <span class="badge badge-gold">최고점 평균 ${avg}%</span>
          <button class="btn btn-outline btn-sm" onclick="MYKahoot.loadTeacherHomework()">🔄 새로고침</button>
          <button class="btn btn-gold btn-sm" onclick="MYKahoot.exportHomeworkToExcel()">⬇️ 엑셀 저장</button>
        </div>
      </div>
      <div class="table-responsive" style="max-height:460px; overflow-y:auto;">
        <table class="data-table">
          <thead><tr><th>학년</th><th>반</th><th>번호</th><th>이름</th><th>상태</th><th>첫 점수</th><th>최고 점수</th><th>푼 횟수</th><th>마지막 제출</th></tr></thead>
          <tbody>
            ${rows.map(r => {
              const res = r.result;
              const late = res && hw.due && String(res.firstAt || '').slice(0, 10) > hw.due;
              return `<tr>
                <td>${escapeHtml(r.grade)}</td><td>${escapeHtml(r.classNum)}</td><td>${escapeHtml(r.studentNum)}</td><td>${escapeHtml(r.name)}</td>
                <td>${res ? `<span class="badge badge-green">완료</span>${late ? ' <span class="badge badge-gold">늦게</span>' : ''}` : '<span class="badge badge-red">아직</span>'}</td>
                <td>${res ? `${Number(res.firstScore) || 0} / ${total}` : '-'}</td>
                <td>${res ? `<strong>${Number(res.bestScore) || 0} / ${total}</strong>` : '-'}</td>
                <td>${res ? (Number(res.attempts) || 1) + '회' : '-'}</td>
                <td>${res ? hwFmtTime(res.lastAt) : '-'}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="9" style="text-align:center; color:var(--my-text-muted);">대상 학생이 없어요. 학생 명단을 확인해 주세요.</td></tr>'}
          </tbody>
        </table>
      </div>`;
  }

  async function createHomeworkFromQuiz() {
    if (!isTeacherSignedIn()) { requireTeacher(() => openTeacherTab('homework')); return; }
    if (!hwNeedsCloud()) return;
    const qSet = quizSets[Number(document.getElementById('hwQuizSelect')?.value)];
    const questions = hwQuestions(qSet);
    if (!qSet || questions.length === 0) { alert('문항이 있는 퀴즈를 골라 주세요.'); return; }
    const rawTargets = (document.getElementById('hwTargets')?.value || '').trim();
    const targets = rawTargets ? rawTargets.split(/[,\s]+/).map(t => t.trim()).filter(Boolean) : [];
    const bad = targets.filter(t => !/^\d+-\d+$/.test(t));
    if (bad.length) { alert(`대상 반은 "학년-반" 모양으로 써 주세요 (예: 2-7, 2-6). 잘못된 값: ${bad.join(', ')}`); return; }
    const due = document.getElementById('hwDue')?.value || '';
    const id = 'hw_' + Date.now().toString(36);
    const data = { title: qSet.title, quizId: qSet.id, questions, targets, due, open: true, createdAt: new Date().toISOString() };
    try {
      await firebaseDb.ref('homework/' + id).set(cloudSafe(data));
    } catch (err) {
      alert('과제를 저장하지 못했어요. 데이터베이스 규칙이 배포되었는지 확인해 주세요.\n' + (err && err.message ? err.message : ''));
      return;
    }
    hwSelectedId = id;
    await loadTeacherHomework();
    copyHomeworkLink(id, true);
  }

  function copyHomeworkLink(id, justCreated = false) {
    const link = hwLink(id);
    const msg = (justCreated ? '과제를 냈어요! 학생들은 학생 페이지에서 로그인하면 바로 과제 목록이 보여요.\n\n' : '') + '아래 링크를 학생들에게 보내면 바로 이 과제가 열려요:\n' + link;
    const done = () => alert(msg + '\n\n(링크를 복사해 두었어요)');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(done).catch(() => prompt(msg, link));
    } else {
      prompt(msg, link);
    }
  }

  function selectHomework(id) {
    hwSelectedId = id;
    renderTeacherHomework();
    document.getElementById('hwTeacherResultBox')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function toggleHomeworkOpen(id) {
    const hw = hwTeacherList[id];
    if (!hw || !hwNeedsCloud()) return;
    try {
      await firebaseDb.ref(`homework/${id}/open`).set(!hw.open);
      hw.open = !hw.open;
    } catch (err) { alert('바꾸지 못했어요: ' + (err && err.message ? err.message : '')); }
    renderTeacherHomework();
  }

  async function deleteHomework(id) {
    const hw = hwTeacherList[id];
    if (!hw || !hwNeedsCloud()) return;
    const n = Object.keys(hwTeacherResults[id] || {}).length;
    if (!confirm(`"${hw.title}" 과제를 지울까요?${n ? `\n학생 ${n}명의 결과도 함께 지워져요.` : ''}`)) return;
    try {
      await firebaseDb.ref('homework/' + id).remove();
      await firebaseDb.ref('homeworkResults/' + id).remove();
    } catch (err) { alert('지우지 못했어요: ' + (err && err.message ? err.message : '')); return; }
    delete hwTeacherList[id];
    delete hwTeacherResults[id];
    if (hwSelectedId === id) hwSelectedId = '';
    renderTeacherHomework();
  }

  function exportHomeworkToExcel() {
    const hw = hwTeacherList[hwSelectedId];
    if (!hw || typeof XLSX === 'undefined') return;
    const total = hwQuestions(hw).length;
    const rows = [['학년', '반', '번호', '이름', '이메일', '상태', '첫 점수', '최고 점수', '문항수', '푼 횟수', '처음 제출', '마지막 제출']];
    hwResultRows(hwSelectedId).forEach(r => {
      const res = r.result;
      rows.push([r.grade, r.classNum, r.studentNum, r.name, r.email, res ? '완료' : '아직',
        res ? Number(res.firstScore) || 0 : '', res ? Number(res.bestScore) || 0 : '', total,
        res ? Number(res.attempts) || 1 : '', res ? hwFmtTime(res.firstAt) : '', res ? hwFmtTime(res.lastAt) : '']);
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), '과제_결과');
    const safeTitle = String(hw.title).replace(/[\\/:*?"<>|]/g, '_').slice(0, 25);
    XLSX.writeFile(wb, `MY_Kahoot_과제결과_${safeTitle}.xlsx`);
  }

  function previewHomework(id) {
    const hw = hwTeacherList[id];
    if (!hw) return;
    startHomeworkPlay(id, hw, { preview: true });
  }

  // ---------- 학생: 과제 목록 ----------
  function ensureHwStudentBox() {
    let box = document.getElementById('hwStudentBox');
    if (box) return box;
    const card = document.querySelector('#view-landing .join-card');
    if (!card) return null;
    box = document.createElement('div');
    box.id = 'hwStudentBox';
    box.style.cssText = 'display:none; margin-top:1rem; text-align:left; border-top:2px dashed var(--my-border); padding-top:1rem;';
    card.appendChild(box);
    return box;
  }

  async function loadStudentHomework() {
    const box = ensureHwStudentBox();
    if (!box) return;
    if (!isFirebaseConnected || !firebaseDb || !authUser || !currentStudent.verified || isTeacherEmail(authUser.email)) {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    box.innerHTML = '<div style="font-weight:800; color:var(--my-primary-dark);">📚 내 과제 불러오는 중...</div>';
    let all = {};
    try {
      all = (await firebaseDb.ref('homework').once('value')).val() || {};
    } catch (err) {
      console.warn('과제 목록 읽기 실패', err);
      box.innerHTML = '<div style="font-weight:800; color:var(--my-primary-dark);">📚 혼자 풀기 과제</div><p style="font-size:0.85rem; color:var(--my-text-muted);">과제 목록을 불러오지 못했어요. 잠시 뒤 새로고침해 주세요.</p>';
      return;
    }
    hwStudentList = {};
    Object.keys(all).forEach(id => {
      const hw = all[id];
      if (hw && hw.open && hwIsForStudent(hw, currentStudent)) hwStudentList[id] = hw;
    });
    const key = emailToKey(authUser.email);
    const ids = Object.keys(hwStudentList).sort((a, b) => String(hwStudentList[b].createdAt || '').localeCompare(String(hwStudentList[a].createdAt || '')));
    await Promise.all(ids.map(async id => {
      try { hwMyResults[id] = (await firebaseDb.ref(`homeworkResults/${id}/${key}`).once('value')).val(); } catch (_) { hwMyResults[id] = null; }
    }));
    renderStudentHomeworkList(ids);
    if (hwPendingId && hwStudentList[hwPendingId]) {
      const id = hwPendingId;
      hwPendingId = '';
      startHomeworkPlay(id, hwStudentList[id]);
    } else if (hwPendingId) {
      alert('링크의 과제를 찾을 수 없어요. 선생님이 마감했거나 우리 반 과제가 아닐 수 있어요.');
      hwPendingId = '';
    }
  }

  function renderStudentHomeworkList(ids) {
    const box = ensureHwStudentBox();
    if (!box) return;
    const today = new Date().toISOString().slice(0, 10);
    box.innerHTML = `
      <div style="font-weight:900; color:var(--my-primary-dark); font-size:1.05rem; margin-bottom:0.25rem;">📚 혼자 풀기 과제</div>
      <p style="font-size:0.8rem; color:var(--my-text-muted); margin-bottom:0.6rem;">PIN 없이 혼자 풀 수 있어요. 시간 제한 없이 풀고 바로 정답과 해설을 확인해요.</p>
      ${ids.length === 0 ? '<p style="font-size:0.88rem; color:var(--my-text-muted);">지금 풀 과제가 없어요.</p>' : ids.map(id => {
        const hw = hwStudentList[id];
        const mine = hwMyResults[id];
        const total = hwQuestions(hw).length;
        const overdue = hw.due && hw.due < today;
        return `
          <div style="border:1.5px solid var(--my-border); border-radius:12px; padding:0.7rem 0.85rem; margin-bottom:0.5rem; display:flex; justify-content:space-between; align-items:center; gap:0.6rem;">
            <div style="min-width:0;">
              <div style="font-weight:800; color:var(--my-text);">${escapeHtml(hw.title)}</div>
              <div style="font-size:0.78rem; color:var(--my-text-muted);">${total}문항${hw.due ? ` · 마감 ${escapeHtml(hw.due)}${overdue ? ' (지남)' : ''}` : ''}${mine ? ` · ✅ 최고 ${Number(mine.bestScore) || 0}/${total} (${Number(mine.attempts) || 1}회)` : ' · 아직 안 풀었어요'}</div>
            </div>
            <button class="btn ${mine ? 'btn-outline' : 'btn-accent'} btn-sm" style="flex-shrink:0;" onclick="MYKahoot.openStudentHomework('${id}')">${mine ? '다시 풀기' : '풀기'}</button>
          </div>`;
      }).join('')}`;
  }

  function openStudentHomework(id) {
    const hw = hwStudentList[id];
    if (hw) startHomeworkPlay(id, hw);
  }

  // ---------- 과제 풀기 화면 ----------
  function ensureHwView() {
    let sec = document.getElementById('view-homework');
    if (sec) return sec;
    sec = document.createElement('section');
    sec.id = 'view-homework';
    sec.className = 'view-section';
    sec.innerHTML = `
      <div class="student-screen">
        <div class="student-status-bar">
          <div style="display:flex; align-items:center; gap:0.5rem; min-width:0;">
            <span class="badge badge-gold" id="hwBarMode">📚 과제</span>
            <span id="hwBarTitle" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;"></span>
          </div>
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <span style="background:#fff; color:var(--my-primary-dark); padding:0.25rem 0.7rem; border-radius:999px; font-weight:900;" id="hwBarProgress"></span>
            <button class="btn btn-ghost-light btn-sm" onclick="MYKahoot.exitHomework()">목록으로</button>
          </div>
        </div>
        <div id="hwBody" class="student-pad-container" style="max-width:820px; width:100%; margin:0 auto;"></div>
      </div>`;
    const anchor = document.getElementById('view-student');
    if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(sec, anchor.nextSibling);
    else document.body.appendChild(sec);
    return sec;
  }

  function startHomeworkPlay(id, hw, opts = {}) {
    const questions = hwQuestions(hw);
    if (questions.length === 0) { alert('이 과제에는 문항이 없어요.'); return; }
    const order = opts.only && opts.only.length ? opts.only.slice() : questions.map((_, i) => i);
    hwPlay = { id, hw, questions, order, pos: 0, picked: null, answers: {}, preview: !!opts.preview, wrongOnly: !!(opts.only && opts.only.length) };
    ensureHwView();
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('view-homework').classList.add('active');
    SoundFX.stopBGM();
    document.getElementById('hwBarMode').textContent = hwPlay.preview ? '👀 미리보기 (저장 안 됨)' : (hwPlay.wrongOnly ? '🔁 틀린 문제 다시' : '📚 과제');
    document.getElementById('hwBarTitle').textContent = hw.title || '';
    renderHwQuestion();
    window.scrollTo(0, 0);
  }

  const HW_COLORS = [['--ans-red', '▲'], ['--ans-blue', '◆'], ['--ans-yellow', '●'], ['--ans-green', '■']];

  function renderHwQuestion() {
    const body = document.getElementById('hwBody');
    if (!body || !hwPlay) return;
    const qIdx = hwPlay.order[hwPlay.pos];
    const q = hwPlay.questions[qIdx];
    const picked = hwPlay.picked;
    const answered = picked !== null;
    document.getElementById('hwBarProgress').textContent = `${hwPlay.pos + 1} / ${hwPlay.order.length}`;
    const isLast = hwPlay.pos === hwPlay.order.length - 1;
    body.innerHTML = `
      <div style="height:8px; background:rgba(255,255,255,0.15); border-radius:999px; overflow:hidden;">
        <div style="height:100%; width:${Math.round((hwPlay.pos + (answered ? 1 : 0)) / hwPlay.order.length * 100)}%; background:var(--my-gold);"></div>
      </div>
      <div style="font-size:0.9rem; font-weight:800; opacity:0.9;">문제 ${qIdx + 1}</div>
      <div class="student-question-box" style="text-align:left; white-space:pre-wrap;">${escapeHtml(q.question)}</div>
      <div class="student-pad-grid" style="min-height:0;">
        ${q.options.map((opt, i) => {
          if (!opt && i >= 2) return '';
          const [color, shape] = HW_COLORS[i];
          let style = `background:var(${color}); box-shadow:0 5px 0 var(${color}-dark); font-size:1.05rem; min-height:92px; flex-direction:row; justify-content:flex-start; text-align:left;`;
          if (answered) {
            if (i === q.answer) style += ' outline:5px solid #fff; outline-offset:2px;';
            else if (i === picked) style += ' opacity:0.55;';
            else style += ' opacity:0.3;';
          }
          const mark = answered ? (i === q.answer ? ' ✅' : (i === picked ? ' ❌' : '')) : '';
          return `<button class="student-pad-btn" style="${style}" ${answered ? 'disabled' : ''} onclick="MYKahoot.answerHomework(${i})">
            <span class="pad-shape" style="font-size:1.8rem;">${shape}</span><span>${escapeHtml(opt)}${mark}</span></button>`;
        }).join('')}
      </div>
      ${answered ? `
        <div style="background:${picked === q.answer ? '#dcfce7' : '#fee2e2'}; color:${picked === q.answer ? '#15803d' : '#b91c1c'}; border-radius:14px; padding:0.9rem 1.1rem; font-weight:800; line-height:1.5;">
          <div style="font-size:1.2rem;">${picked === q.answer ? '🎉 정답이에요!' : `😢 아쉬워요. 정답은 ${q.answer + 1}번 "${escapeHtml(q.options[q.answer])}"`}</div>
          ${q.explanation ? `<div style="color:var(--my-text); font-weight:600; margin-top:0.35rem;">💡 ${escapeHtml(q.explanation)}</div>` : ''}
        </div>
        <button class="btn btn-gold btn-lg" style="width:100%;" onclick="MYKahoot.nextHomeworkQuestion()">${isLast ? '🏁 결과 보기' : '다음 문제 ➡️'}</button>` : ''}`;
  }

  function answerHomework(choice) {
    if (!hwPlay || hwPlay.picked !== null) return;
    const qIdx = hwPlay.order[hwPlay.pos];
    hwPlay.picked = choice;
    hwPlay.answers[qIdx] = choice;
    const ok = choice === hwPlay.questions[qIdx].answer;
    if (ok) SoundFX.playReveal && SoundFX.playReveal();
    renderHwQuestion();
  }

  function nextHomeworkQuestion() {
    if (!hwPlay || hwPlay.picked === null) return;
    if (hwPlay.pos < hwPlay.order.length - 1) {
      hwPlay.pos += 1;
      hwPlay.picked = null;
      renderHwQuestion();
      window.scrollTo(0, 0);
    } else {
      finishHomework();
    }
  }

  async function finishHomework() {
    const p = hwPlay;
    const body = document.getElementById('hwBody');
    if (!p || !body) return;
    const wrong = p.order.filter(i => p.answers[i] !== p.questions[i].answer);
    const correct = p.order.length - wrong.length;
    const pct = Math.round(correct / p.order.length * 100);
    let saveNote = '';
    if (p.preview) {
      saveNote = '미리보기라서 결과는 저장하지 않았어요.';
    } else if (p.wrongOnly) {
      saveNote = '틀린 문제 다시 풀기는 연습이라 점수에 들어가지 않아요.';
    } else {
      saveNote = await saveHomeworkResult(p, correct, wrong);
    }
    if (pct >= 80 && SoundFX.playFanfare) SoundFX.playFanfare();
    document.getElementById('hwBarProgress').textContent = `${correct} / ${p.order.length}`;
    body.innerHTML = `
      <div style="text-align:center; padding:1rem 0;">
        <div style="font-size:3.5rem;">${pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 style="font-size:1.9rem; font-weight:900; margin:0.3rem 0;">${p.order.length}문제 중 ${correct}개 정답 (${pct}%)</h2>
        <p style="opacity:0.85; font-size:0.92rem;">${escapeHtml(saveNote)}</p>
      </div>
      ${wrong.length ? `
        <div style="background:#fff; color:var(--my-text); border-radius:16px; padding:1rem 1.1rem;">
          <div style="font-weight:900; color:var(--my-primary-dark); margin-bottom:0.5rem;">📝 틀린 문제 다시 보기</div>
          ${wrong.map(i => {
            const q = p.questions[i];
            return `<div style="border-top:1px solid var(--my-border); padding:0.6rem 0; line-height:1.5;">
              <div style="font-weight:800;">${i + 1}. ${escapeHtml(q.question)}</div>
              <div style="font-size:0.88rem; color:#b91c1c;">내 답: ${escapeHtml(q.options[p.answers[i]] ?? '')}</div>
              <div style="font-size:0.88rem; color:#15803d; font-weight:700;">정답: ${escapeHtml(q.options[q.answer])}</div>
              ${q.explanation ? `<div style="font-size:0.85rem; color:var(--my-text-muted);">💡 ${escapeHtml(q.explanation)}</div>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}
      <div style="display:flex; flex-direction:column; gap:0.6rem;">
        ${wrong.length ? `<button class="btn btn-accent btn-lg" style="width:100%;" onclick="MYKahoot.retryHomework(true)">🔁 틀린 문제만 다시 풀기 (${wrong.length}문제)</button>` : ''}
        <button class="btn btn-gold btn-lg" style="width:100%;" onclick="MYKahoot.retryHomework(false)">↩️ 처음부터 다시 풀기</button>
        <button class="btn btn-ghost-light btn-lg" style="width:100%;" onclick="MYKahoot.exitHomework()">📚 과제 목록으로</button>
      </div>`;
    p.lastWrong = wrong;
    window.scrollTo(0, 0);
  }

  async function saveHomeworkResult(p, correct, wrong) {
    if (!isFirebaseConnected || !firebaseDb || !authUser) return '인터넷에 연결되어 있지 않아 결과를 저장하지 못했어요.';
    const key = emailToKey(authUser.email);
    const ref = firebaseDb.ref(`homeworkResults/${p.id}/${key}`);
    const now = new Date().toISOString();
    try {
      const prev = (await ref.once('value')).val();
      const rec = {
        grade: currentStudent.grade,
        classNum: currentStudent.classNum,
        studentNum: currentStudent.studentNum,
        name: currentStudent.name,
        email: normalizeEmail(authUser.email),
        total: p.order.length,
        firstScore: prev ? Number(prev.firstScore) || 0 : correct,
        bestScore: Math.max(prev ? Number(prev.bestScore) || 0 : 0, correct),
        lastScore: correct,
        attempts: (prev ? Number(prev.attempts) || 0 : 0) + 1,
        firstAt: prev && prev.firstAt ? prev.firstAt : now,
        lastAt: now,
        lastWrong: wrong.map(i => i + 1).join(',')
      };
      await ref.set(rec);
      hwMyResults[p.id] = rec;
      return '✅ 결과가 선생님께 저장되었어요.';
    } catch (err) {
      console.warn('과제 결과 저장 실패', err);
      return '⚠️ 결과를 저장하지 못했어요. 인터넷 연결을 확인하고 다시 풀어 주세요.';
    }
  }

  function retryHomework(wrongOnly) {
    const p = hwPlay;
    if (!p) return;
    startHomeworkPlay(p.id, p.hw, { preview: p.preview, only: wrongOnly ? p.lastWrong : null });
  }

  function exitHomework() {
    const wasPreview = hwPlay && hwPlay.preview;
    hwPlay = null;
    if (wasPreview) {
      openTeacherTab('homework');
      return;
    }
    switchMainView('landing');
    loadStudentHomework();
  }

  // ==================== 유틸리티 & URL 파라미터 자동 감지 ====================
  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showMovedBanner() {
    const bar = document.createElement('div');
    bar.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fef3c7;color:#92400e;padding:0.7rem 1rem;font-weight:800;text-align:center;line-height:1.6;';
    bar.innerHTML = `📢 MY Kahoot 주소가 바뀌었어요: <a href="${NEW_BASE_URL}" style="color:#4c1d95;">${NEW_BASE_URL}</a><br/>` +
      '<button type="button" class="btn btn-primary btn-sm" id="movedTeacherBtn" style="margin-top:0.35rem;">선생님: 로그인해서 퀴즈·기록 옮기고 이동하기</button>';
    document.body.prepend(bar);
    const btn = document.getElementById('movedTeacherBtn');
    if (btn) btn.onclick = () => requireTeacher(() => {});
  }

  function initApp() {
    if (window.location.hostname === OLD_HOST && document.body && document.body.dataset.role === 'student-only') {
      // 학생은 바로 새 주소로 보내요 (PIN 유지)
      window.location.replace(NEW_BASE_URL + 'student.html' + window.location.search);
      return;
    }
    loadStateFromStorage();
    if (window.location.hostname === OLD_HOST) showMovedBanner();
    if (document.body && document.body.dataset.role === 'student-only') {
      // 예전 버전이 학생 기기에 저장해 둔 전체 명단을 지워요.
      studentRoster = [];
      localStorage.removeItem(STORAGE_KEYS.ROSTER);
    }

    // 저장된 보안 설정 UI 반영 (교사 페이지 요소가 있을 때만)
    const domEl = document.getElementById('settingAllowedDomain');
    if (domEl) domEl.value = settings.allowedDomain || '@smy.ms.kr';
    const strictEl = document.getElementById('settingStrictRosterOnly');
    if (strictEl) strictEl.checked = !!settings.strictRosterOnly;
    const showQEl = document.getElementById('settingShowQuestionsOnStudent');
    if (showQEl) showQEl.checked = !!settings.showQuestionsOnStudent;
    const badgeEl = document.getElementById('allowedDomainBadge');
    if (badgeEl) badgeEl.textContent = `${settings.allowedDomain} 전용`;

    // 저장된 Firebase 설정 또는 기본 my-kahoot-smy 클라우드 설정 자동 연결
    const savedFb = localStorage.getItem(STORAGE_KEYS.FIREBASE_CFG);
    let activeFbConfig = DEFAULT_FIREBASE_CONFIG;
    if (savedFb) {
      try {
        activeFbConfig = JSON.parse(savedFb);
      } catch (_) {}
    }
    const fbInput = document.getElementById('firebaseConfigInput');
    if (fbInput) {
      fbInput.value = JSON.stringify(activeFbConfig, null, 2);
    }
    initFirebaseWithConfig(activeFbConfig);
    if (!isFirebaseConnected) resolveAuthReady();

    document.querySelectorAll('.app-version').forEach(el => { el.textContent = 'v' + APP_VERSION; });

    // QR코드 스캔 등으로 ?pin=123456 접속 시 PIN 번호 자동 입력
    const params = new URLSearchParams(window.location.search);
    // 과제 링크(?hw=...)로 들어오면 로그인 뒤 바로 그 과제를 열어요.
    hwPendingId = (params.get('hw') || '').trim();
    if (hwPendingId) {
      const box = ensureHwStudentBox();
      if (box) {
        box.style.display = 'block';
        box.innerHTML = '<div style="font-weight:800; color:var(--my-primary-dark);">📚 과제 링크로 들어왔어요</div><p style="font-size:0.85rem; color:var(--my-text-muted);">학교 구글 계정으로 로그인하면 과제가 바로 열려요. (PIN은 입력하지 않아도 돼요)</p>';
      }
    }
    const urlPin = params.get('pin');
    if (urlPin) {
      const pinEl = document.getElementById('studentPinInput');
      if (pinEl) pinEl.value = urlPin;
    }

    renderQuizSetList();
    renderQuestionEditorList();
    populateRosterClassFilter();
    renderStudentRosterTable();
  }

  document.addEventListener('DOMContentLoaded', initApp);

  // 외부 노출 API
  return {
    switchMainView,
    openStudentViewSmart,
    resumeOrStartHostScreen,
    openTeacherTab,
    toggleSound,
    verifyStudentEmailFromRoster,
    handleStudentGoogleLogin,
    joinGameAsStudent,
    selectQuizSet,
    createNewQuizSet,
    renameQuizSet,
    deleteQuizSet,
    openQuestionModal,
    closeQuestionModal,
    saveQuestionFromModal,
    deleteQuestion,
    downloadQuizExcelTemplate,
    handleQuizExcelUpload,
    addSingleStudentToRoster,
    removeStudentFromRoster,
    clearAllRoster,
    renderStudentRosterTable,
    downloadRosterExcelTemplate,
    exportCurrentRosterToExcel,
    handleRosterExcelUpload,
    quickStartDemoHost,
    startHostLobbyWithCurrentQuiz,
    hostStartFirstQuestion,
    hostRevealAnswer,
    hostGoToScoreboardOrPodium,
    hostAdvanceToNextQuestion,
    toggleFullFinalLeaderboard,
    scrollToTop10Section,
    openTeacherStatsAfterGame,
    hostNextStepByArrow,
    refreshStudentPadText,
    submitStudentAnswer,
    renderStatsDashboard,
    renderStudentGrowthTrend,
    exportSessionReportToExcel,
    generateSampleQuizHistory,
    saveSecuritySettings,
    connectFirebaseFromInput,
    disconnectFirebase,
    loadTeacherHomework,
    createHomeworkFromQuiz,
    copyHomeworkLink,
    selectHomework,
    toggleHomeworkOpen,
    deleteHomework,
    exportHomeworkToExcel,
    previewHomework,
    openStudentHomework,
    answerHomework,
    nextHomeworkQuestion,
    retryHomework,
    exitHomework
  };
})();
