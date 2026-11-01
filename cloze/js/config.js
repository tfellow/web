// ===== 1) Firebase 설정값 =====
// Firebase 콘솔 > 프로젝트 설정 > 내 앱(웹) > SDK 설정 및 구성 > "구성" 값을 그대로 붙여 넣으세요.
export const firebaseConfig = {
  apiKey: "AIzaSyBigleCLtdsGEMaDLnBI7A3jq97W8dRcRE",
  authDomain: "cloze-a8e6c.firebaseapp.com",
  projectId: "cloze-a8e6c",
  storageBucket: "cloze-a8e6c.firebasestorage.app",
  messagingSenderId: "410570182902",
  appId: "1:410570182902:web:bec24c8663fe35e5e2dcd7"
};

// ===== 2) 학교 계정 도메인 =====
export const SCHOOL_DOMAIN = "smy.ms.kr";

// ===== 3) 교사 계정 =====
// 여기 적힌 계정만 교사로 로그인됩니다. firestore.rules 파일에도 똑같이 적어야 합니다.
// 학교 계정이 아닌 주소(예: gmail)를 적어도 교사로 로그인할 수 있습니다.
export const TEACHER_EMAILS = [
  "tfellow@gmail.com",
  "tfellow@smy.ms.kr"
];

export const APP_NAME = "SMY Cloze";
