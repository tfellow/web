// ===== 설정 파일 =====
// 서버 저장소: Supabase (tfellow-web). 독서 여권 등 다른 MY 앱과 같은 프로젝트·같은 구글 로그인을 써요.
// 2026-11 Firebase Firestore 에서 옮겼어요 (표: cloze/supabase_cloze.sql 의 ds_ 표). 공개해도 되는 키예요.
// url 이 비어 있으면 앱은 "체험 모드"(이 기기 브라우저에만 저장)로 동작합니다.
export const supabaseConfig = {
  url: 'https://jkxdhyvnrvsiokbbbjtu.supabase.co',
  key: 'sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF',
  googleClientId: '359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com',
};

export const APP = {
  schoolName: '서울문영여자중학교',
  appName: '단어숲',
  // 교사 계정 이메일 (화면 표시용). 실제 권한은 Supabase admins 표(public.is_admin())가 정해요.
  teacherEmails: ['tfellow@gmail.com', 'tfellow@smy.ms.kr', 'engwords@smy.ms.kr', 'hist1026@gmail.com'],
  // 학번+비밀번호 로그인 (Supabase 판에서는 쓰지 않아요)
  studentIdLogin: false,
  // 학번 로그인용 내부 이메일 도메인 (실제 메일이 오가지 않습니다)
  studentEmailDomain: 'students.vocab-app.local',
  // 구글 로그인 허용 도메인 (예: 'school.go.kr'). 비워 두면 모든 구글 계정 허용
  allowedGoogleDomain: 'smy.ms.kr',
  grades: [1, 2, 3],
  classesPerGrade: 10,
  // Gemini(AI 예문/암기법): Supabase 판에서는 쓰지 않아요 (Firebase AI Logic 전용이었어요)
  enableGemini: false,
};

export const isServerConfigured = () => !!supabaseConfig.url;
