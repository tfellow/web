// ===== 1) Supabase 설정값 (독서 여권과 같은 프로젝트 tfellow-web) =====
// 공개해도 되는 키예요. 보안은 supabase_cloze.sql 의 보안 규칙(RLS)이 맡아요.
// (2026-11 Firebase Firestore 에서 Supabase 로 옮겼어요. 예전 기록은 migrate.html 로 옮겨요.)
export const SUPABASE_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co";
export const SUPABASE_KEY = "sb_publishable_XVHSc-RymsF_LYq4crnwag_heNOynBF";
export const GOOGLE_CLIENT_ID = "359186883636-p0v5hfmvii2b91a4d9cccn5099bbsl0c.apps.googleusercontent.com";

// ===== 2) 학교 계정 도메인 =====
export const SCHOOL_DOMAIN = "smy.ms.kr";

// ===== 3) 교사 계정 =====
// 화면 표시용이에요. 실제 권한은 Supabase 의 admins 표(public.is_admin())가 정해요.
// 교사를 더 추가할 때는 독서 여권 교사 화면 → ⚙️ 설정 → 교사 계정 관리에서 추가하고, 여기에도 적어 주세요.
export const TEACHER_EMAILS = [
  "tfellow@gmail.com",
  "tfellow@smy.ms.kr",
  "engwords@smy.ms.kr",
  "hist1026@gmail.com"
];

export const APP_NAME = "MY Cloze";
