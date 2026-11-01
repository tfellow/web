// ===== 설정 파일 =====
// Firebase 콘솔(https://console.firebase.google.com) → 프로젝트 설정 → 내 앱(웹)의 값을 붙여 넣으세요.
// (SMY Cloze 와 같은 Firebase 프로젝트를 함께 씁니다.) apiKey가 비어 있으면 앱은 "체험 모드"(이 기기 브라우저에만 저장)로 동작합니다.
export const firebaseConfig = {
  apiKey: 'AIzaSyBigleCLtdsGEMaDLnBI7A3jq97W8dRcRE',
  authDomain: 'cloze-a8e6c.firebaseapp.com',
  projectId: 'cloze-a8e6c',
  storageBucket: 'cloze-a8e6c.firebasestorage.app',
  messagingSenderId: '410570182902',
  appId: '1:410570182902:web:bec24c8663fe35e5e2dcd7',
};

export const APP = {
  schoolName: '서울문영여자중학교',
  appName: '단어숲',
  // 교사 계정 이메일 (구글 로그인). firestore.rules 의 목록과 똑같이 맞춰 주세요.
  teacherEmails: ['tfellow@gmail.com', 'tfellow@smy.ms.kr'],
  // 학번+비밀번호 로그인 사용 여부 (기본: 구글 로그인만 사용)
  studentIdLogin: false,
  // 학번 로그인용 내부 이메일 도메인 (실제 메일이 오가지 않습니다)
  studentEmailDomain: 'students.vocab-app.local',
  // 구글 로그인 허용 도메인 (예: 'school.go.kr'). 비워 두면 모든 구글 계정 허용
  allowedGoogleDomain: 'smy.ms.kr',
  grades: [1, 2, 3],
  classesPerGrade: 10,
  // Gemini(AI 예문/암기법) 사용 여부. Firebase 콘솔에서 AI Logic을 켠 뒤 true로 바꾸세요.
  enableGemini: false,
};

export const FIREBASE_VERSION = '10.12.2';
export const isFirebaseConfigured = () => !!firebaseConfig.apiKey;
