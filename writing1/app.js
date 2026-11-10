// Firebase SDK (CDN 모듈 방식 - 빌드 도구 없이 바로 실행 가능)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  getIdToken,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  getDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  deleteField,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 서울문영여자중학교 보안 명렬표(무키 AES-256-GCM 금고 & Firestore 서버 보호) 및 헬퍼 함수 불러오기
import {
  STUDENT_ROSTER,
  CLASSES_BY_GRADE,
  findStudentByEmail,
  setRuntimeRoster
} from "./students.js?v=2";

// ============================================================================
// 1. 환경 설정 (서울문영여중 공식 Google 로그인 연동 cloze-a8e6c Firebase 프로젝트)
// ============================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBigleCLtdsGEMaDLnBI7A3jq97W8dRcRE",
  authDomain: "cloze-a8e6c.firebaseapp.com",
  projectId: "cloze-a8e6c",
  storageBucket: "cloze-a8e6c.firebasestorage.app",
  messagingSenderId: "410570182902",
  appId: "1:410570182902:web:bec24c8663fe35e5e2dcd7"
};

// 서울문영여자중학교 공식 도메인 및 교사(관리자) 이메일 목록 설정
const ALLOWED_DOMAIN = "smy.ms.kr";
const TEACHER_EMAILS = [
  "tfellow@smy.ms.kr",
  "tfellow@gmail.com",
  "engwords@gmail.com",
  "engwords@smy.ms.kr"
];

// ★ 보안: Gemini API 키는 학생 브라우저에 절대 보내지 않아요.
// 학생 답안 채점은 이 서버 함수(Supabase Edge Function)가 키를 대신 들고 Gemini 에 물어봐요.
// 함수가 아직 없으면 내장 정밀 채점 엔진으로 자동 전환돼요.
const GEMINI_PROXY_URL = "https://jkxdhyvnrvsiokbbbjtu.supabase.co/functions/v1/writing1-grade";

// 교사 전용 저장소 (Firestore 보안 규칙으로 교사만 읽고 쓸 수 있어요)
const PRIVATE_CONFIG_PATH = ["writing1_private", "config"];
const STUDENT_DIR_COLLECTION = "writing1_students";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: "select_account"
});

// ============================================================================
// 2. 교사 출제 한국어 제시문 기본 세트 (1·2·3학년 및 공통 과제)
// ============================================================================
const PROMPTS_STORAGE_KEY = "MY_WRITING_KOREAN_PROMPTS_V1";
const DEFAULT_KOREAN_PROMPTS = [
  {
    id: "kp-1",
    targetGrade: "1",
    targetClass: "all",
    timeLimitSec: 180,
    active: true,
    title: "[1학년] 좋아하는 계절과 이유 말하기",
    koreanPrompt: "내가 가장 좋아하는 계절은 봄인데, 왜냐하면 아름다운 꽃들이 피기 때문이다.",
    targetGrammar: "because (이유를 나타내는 접속사)",
    referenceAnswer: "My favorite season is spring because beautiful flowers bloom."
  },
  {
    id: "kp-2",
    targetGrade: "2",
    targetClass: "all",
    timeLimitSec: 180,
    active: true,
    title: "[2학년] 목적을 나타내는 so that 구문 영작",
    koreanPrompt: "나는 아픈 동물들을 도울 수 있도록 수의사가 되고 싶다.",
    targetGrammar: "so that (~할 수 있도록 / ~하기 위해서)",
    referenceAnswer: "I want to be a veterinarian so that I can help sick animals."
  },
  {
    id: "kp-3",
    targetGrade: "3",
    targetClass: "all",
    timeLimitSec: 180,
    active: true,
    title: "[3학년] 가주어-진주어(It ~ to부정사) 구문 영작",
    koreanPrompt: "전 세계 사람들과 소통하기 위해 영어를 배우는 것은 중요하다.",
    targetGrammar: "It is ~ to부정사 (가주어-진주어)",
    referenceAnswer: "It is important to learn English to communicate with people around the world."
  },
  {
    id: "kp-4",
    targetGrade: "all",
    targetClass: "all",
    timeLimitSec: 0,
    active: true,
    title: "[공통] 경험 및 느낀 점 표현하기 (현재완료)",
    koreanPrompt: "나는 경복궁에 가본 적이 있는데, 한복을 입어 본 것은 정말 특별한 경험이었다.",
    targetGrammar: "have been to (현재완료 경험)",
    referenceAnswer: "I have been to Gyeongbokgung Palace, and wearing Hanbok was a really special experience."
  }
];

let koreanPrompts = [];
let currentWritingMode = "korean_prompt"; // "korean_prompt" | "free"

function loadKoreanPromptsFromStorage() {
  try {
    const saved = localStorage.getItem(PROMPTS_STORAGE_KEY);
    koreanPrompts = saved ? JSON.parse(saved) : [...DEFAULT_KOREAN_PROMPTS];
  } catch (e) {
    koreanPrompts = [...DEFAULT_KOREAN_PROMPTS];
  }
}
loadKoreanPromptsFromStorage();

function saveKoreanPromptsToStorage() {
  localStorage.setItem(PROMPTS_STORAGE_KEY, JSON.stringify(koreanPrompts));
}

// 현재 로그인한 사용자 및 명렬표 매칭 상태 보관
let currentUser = null;
let currentStudentInfo = null;
let allTeacherSubmissions = [];
let currentFilteredSubmissions = [];
let classAvgChart = null;
let studentFreqChart = null;

// 명렬표의 모든 학생 성명(185명)을 길이 역순으로 정렬 (클라이언트 측 개인정보 마스킹용)
const ALL_STUDENT_NAMES = Array.from(
  new Set(STUDENT_ROSTER.map((s) => s.name))
).sort((a, b) => b.length - a.length);

/**
 * [보안] 클라이언트 측 학생 개인정보(PII) 자동 마스킹 함수
 */
function maskPersonalInfoClient(text, studentName = "") {
  if (!text) return "";
  let masked = text;
  if (studentName && studentName.trim().length > 0) {
    const escaped = studentName.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    masked = masked.replace(new RegExp(escaped, "gi"), "[STUDENT_NAME]");
  }
  for (const name of ALL_STUDENT_NAMES) {
    if (masked.includes(name)) {
      masked = masked.split(name).join("[STUDENT_NAME]");
    }
  }
  masked = masked.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]");
  masked = masked.replace(/\b(?:2026)?[1-3]0[1-4][0-3]\d\b/g, "[STUDENT_ID]");
  masked = masked.replace(/01[016789]-?\d{3,4}-?\d{4}/g, "[PHONE]");
  masked = masked.replace(/\b(my name is|i am|i'm)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi, "$1 [STUDENT_NAME]");
  masked = masked.replace(/[1-3]학년\s*[1-4]반\s*\d{1,2}번/g, "[STUDENT_ID]");
  return masked;
}

// 한->영 핵심 어휘 및 의미 매칭 사전 (참고 모범답안이 없을 때도 한국어 제시문의 의미를 정밀 채점)
const KO_EN_CONCEPT_DICT = [
  { ko: ["꽃", "꽃들"], en: ["flower", "flowers", "blossom", "blossoms"], label: "꽃(flower)" },
  { ko: ["아름다", "예쁜", "예쁘", "멋진", "멋지", "고운"], en: ["beautiful", "pretty", "lovely", "wonderful", "nice", "gorgeous"], label: "아름다운/멋진(beautiful/pretty)" },
  { ko: ["계절"], en: ["season", "seasons"], label: "계절(season)" },
  { ko: ["봄"], en: ["spring"], label: "봄(spring)" },
  { ko: ["여름"], en: ["summer"], label: "여름(summer)" },
  { ko: ["가을"], en: ["fall", "autumn"], label: "가을(fall/autumn)" },
  { ko: ["겨울"], en: ["winter"], label: "겨울(winter)" },
  { ko: ["피다", "피기", "피어"], en: ["bloom", "blooms", "blossom", "come out"], label: "꽃이 피다(bloom)" },
  { ko: ["좋아하", "가장 좋아하는", "제일 좋아하는"], en: ["favorite", "like", "love", "prefer", "best"], label: "좋아하는(favorite/like)" },
  { ko: ["왜냐하면", "때문"], en: ["because", "since", "as", "because of"], label: "이유(because)" },
  { ko: ["아픈", "다친", "병든"], en: ["sick", "ill", "injured", "hurt"], label: "아픈(sick)" },
  { ko: ["동물"], en: ["animal", "animals", "pet", "pets"], label: "동물(animal)" },
  { ko: ["돕", "도와", "구하"], en: ["help", "helps", "save", "assist", "care"], label: "돕다(help)" },
  { ko: ["수의사"], en: ["vet", "veterinarian", "animal doctor"], label: "수의사(vet/veterinarian)" },
  { ko: ["의사"], en: ["doctor", "physician"], label: "의사(doctor)" },
  { ko: ["선생님", "교사"], en: ["teacher"], label: "교사(teacher)" },
  { ko: ["되고 싶다", "원한다", "바란다"], en: ["want", "would like", "hope", "wish"], label: "~하고 싶다(want to)" },
  { ko: ["세계", "세상"], en: ["world", "global"], label: "세계(world)" },
  { ko: ["사람"], en: ["people", "person", "others"], label: "사람들(people)" },
  { ko: ["소통", "대화", "이야기"], en: ["communicate", "talk", "speak", "converse", "share"], label: "소통하다(communicate/talk)" },
  { ko: ["영어"], en: ["english"], label: "영어(English)" },
  { ko: ["배우", "학습", "공부"], en: ["learn", "learning", "study", "studying", "master"], label: "배우다/공부하다(learn/study)" },
  { ko: ["중요하", "중요한", "소중"], en: ["important", "essential", "vital", "matter", "valuable"], label: "중요한(important)" },
  { ko: ["경복궁", "궁궐", "고궁"], en: ["gyeongbokgung", "palace"], label: "경복궁(Gyeongbokgung Palace)" },
  { ko: ["한복"], en: ["hanbok"], label: "한복(Hanbok)" },
  { ko: ["입다", "입어", "착용"], en: ["wear", "wearing", "wore", "worn", "try on", "put on"], label: "입다(wear)" },
  { ko: ["특별한", "색다른"], en: ["special", "unique", "memorable", "unforgettable"], label: "특별한(special)" },
  { ko: ["경험", "체험"], en: ["experience", "experiences", "memory"], label: "경험(experience)" },
  { ko: ["가본 적", "해본 적"], en: ["have been", "has been", "have visited", "have tried"], label: "경험(~해본 적이 있다: have been/tried)" },
  { ko: ["친구"], en: ["friend", "friends", "classmate"], label: "친구(friend)" },
  { ko: ["학교"], en: ["school"], label: "학교(school)" },
  { ko: ["학생"], en: ["student", "students"], label: "학생(student)" },
  { ko: ["책", "독서"], en: ["book", "books", "read", "reading"], label: "책/독서(book/read)" },
  { ko: ["운동", "체육"], en: ["exercise", "sport", "sports", "work out", "workout"], label: "운동(exercise)" },
  { ko: ["건강"], en: ["health", "healthy", "fit"], label: "건강(health/healthy)" },
  { ko: ["환경", "자연", "지구"], en: ["environment", "nature", "earth", "planet"], label: "환경/지구(environment/earth)" },
  { ko: ["보호", "지키"], en: ["protect", "save", "keep", "preserve"], label: "보호하다(protect/save)" },
  { ko: ["행복", "기쁜", "기쁘", "즐거"], en: ["happy", "happiness", "glad", "joyful", "pleased", "fun"], label: "행복한/기쁜(happy/glad)" },
  { ko: ["슬픈", "슬프"], en: ["sad", "upset", "unhappy"], label: "슬픈(sad)" },
  { ko: ["날씨"], en: ["weather", "day"], label: "날씨(weather/day)" },
  { ko: ["하늘"], en: ["sky"], label: "하늘(sky)" },
  { ko: ["바다"], en: ["sea", "ocean", "beach"], label: "바다(sea/ocean)" },
  { ko: ["강아지", "개"], en: ["dog", "dogs", "puppy", "puppies"], label: "강아지(dog/puppy)" },
  { ko: ["고양이"], en: ["cat", "cats", "kitten"], label: "고양이(cat)" },
  { ko: ["빠른", "빨리"], en: ["fast", "quick", "quickly"], label: "빠른(fast/quick)" },
  { ko: ["키가 큰", "높은"], en: ["tall", "high"], label: "키가 큰/높은(tall/high)" },
  { ko: ["어려운", "어렵", "힘든"], en: ["difficult", "hard", "tough"], label: "어려운(difficult/hard)" },
  { ko: ["쉬운", "쉽"], en: ["easy", "simple"], label: "쉬운(easy)" },
  { ko: ["재미있", "흥미"], en: ["interesting", "fun", "exciting", "funny"], label: "재미있는(interesting/fun)" },
  { ko: ["친절", "착한"], en: ["kind", "nice", "friendly", "sweet"], label: "친절한(kind/nice)" },
  { ko: ["똑똑", "영리"], en: ["smart", "clever", "wise", "intelligent"], label: "똑똑한(smart/clever)" },
  { ko: ["건물", "빌딩"], en: ["building", "buildings", "tower"], label: "건물/빌딩(building)", pos: "명사", dictWord: "building", dictMeaning: "건물, 빌딩" },
  { ko: ["키가 큰", "높은", "높구", "높다", "높아"], en: ["tall", "high"], label: "높은/키가 큰(tall/high)", pos: "형용사", dictWord: "tall / high", dictMeaning: "(건물·나무·키가) 높은, 키가 큰" },
  { ko: ["큰", "크구", "거대한"], en: ["big", "large", "huge", "great"], label: "큰(big/large/huge)", pos: "형용사", dictWord: "large / huge", dictMeaning: "큰, 거대한" },
  { ko: ["작은", "작구"], en: ["small", "little", "tiny"], label: "작은(small/little)", pos: "형용사", dictWord: "small / little", dictMeaning: "작은, 아담한" },
  { ko: ["소년", "남자아이"], en: ["boy", "boys"], label: "소년(boy)", pos: "명사", dictWord: "boy", dictMeaning: "소년, 남자아이" },
  { ko: ["소녀", "여자아이"], en: ["girl", "girls"], label: "소녀(girl)", pos: "명사", dictWord: "girl", dictMeaning: "소녀, 여자아이" },
  { ko: ["아이", "어린이"], en: ["child", "children", "kid", "kids"], label: "아이(child/kid)", pos: "명사", dictWord: "child (복수: children)", dictMeaning: "아이, 어린이" },
  { ko: ["달리", "달려", "뛰어"], en: ["run", "runs", "ran", "running"], label: "달리다(run)", pos: "동사", dictWord: "run", dictMeaning: "달리다, 뛰다" },
  { ko: ["음식", "요리"], en: ["food", "dish", "meal", "cook"], label: "음식(food)", pos: "명사", dictWord: "food / dish", dictMeaning: "음식, 요리" },
  { ko: ["음악", "노래"], en: ["music", "song", "sing"], label: "음악/노래(music/song)", pos: "명사", dictWord: "music / song", dictMeaning: "음악, 노래" },
  { ko: ["영화"], en: ["movie", "film"], label: "영화(movie)", pos: "명사", dictWord: "movie", dictMeaning: "영화" },
  { ko: ["여행"], en: ["trip", "travel", "journey", "tour"], label: "여행(trip/travel)", pos: "명사/동사", dictWord: "travel / trip", dictMeaning: "여행하다, 여행" },
  { ko: ["가족", "부모님"], en: ["family", "parents", "parent"], label: "가족/부모님(family/parents)", pos: "명사", dictWord: "family / parents", dictMeaning: "가족, 부모님" },
  { ko: ["시간"], en: ["time", "hour"], label: "시간(time)", pos: "명사", dictWord: "time", dictMeaning: "시간" },
  { ko: ["미래", "꿈"], en: ["future", "dream", "dreams"], label: "미래/꿈(future/dream)", pos: "명사", dictWord: "dream / future", dictMeaning: "꿈, 미래" },
  { ko: ["세금"], en: ["tax", "taxes"], label: "세금(tax/taxes)", pos: "명사", dictWord: "tax (복수: taxes)", dictMeaning: "세금" },
  { ko: ["지불", "비용을 대다", "돈을 내다"], en: ["pay", "pays", "paid", "pay for"], label: "지불하다/비용을 대다(pay for)", pos: "숙어/동사", dictWord: "pay for ~", dictMeaning: "~에 대한 비용을 지불하다(대다)" },
  { ko: ["깨끗한", "맑은", "청정한"], en: ["clean", "clear", "fresh"], label: "깨끗한(clean)", pos: "형용사", dictWord: "clean", dictMeaning: "깨끗한, 청결한" },
  { ko: ["공기"], en: ["air"], label: "공기(air)", pos: "명사", dictWord: "air", dictMeaning: "공기, 대기" },
  { ko: ["필요", "필요로"], en: ["need", "needs", "needed"], label: "필요로 하다(need)", pos: "동사", dictWord: "need", dictMeaning: "필요로 하다, 필요하다" }
];

// 영작 모범답안 단어별 정확 한국어 뜻 사전 (핵심 및 추천 어휘 자동 추출용)
const EN_WORD_MEANING_DICT = {
  tax: { word: "tax (복수: taxes)", meaning: "세금 (명사)" },
  taxes: { word: "taxes (단수: tax)", meaning: "세금 (명사)" },
  pay: { word: "pay for ~", meaning: "~에 대한 비용을 지불하다, 대다 (숙어/동사)" },
  pays: { word: "pay for ~", meaning: "~에 대한 비용을 지불하다, 대다 (숙어/동사)" },
  clean: { word: "clean", meaning: "깨끗한, 맑은 (형용사)" },
  air: { word: "air", meaning: "공기 (셀 수 없는 명사)" },
  need: { word: "need", meaning: "필요로 하다 (동사)" },
  needs: { word: "need", meaning: "필요로 하다 (동사)" },
  which: { word: "which / that (관계대명사)", meaning: "선행사(사물)를 수식하는 관계대명사 (목적격일 때 생략 가능)" },
  favorite: { word: "favorite", meaning: "가장 좋아하는 (형용사/명사)" },
  season: { word: "season", meaning: "계절 (명사)" },
  spring: { word: "spring", meaning: "봄 (명사)" },
  summer: { word: "summer", meaning: "여름 (명사)" },
  autumn: { word: "autumn / fall", meaning: "가을 (명사)" },
  fall: { word: "fall / autumn", meaning: "가을 (명사)" },
  winter: { word: "winter", meaning: "겨울 (명사)" },
  beautiful: { word: "beautiful", meaning: "아름다운, 예쁜 (형용사)" },
  pretty: { word: "pretty", meaning: "예쁜, 귀여운 (형용사)" },
  flower: { word: "flower", meaning: "꽃 (명사)" },
  flowers: { word: "flower", meaning: "꽃 (명사)" },
  bloom: { word: "bloom", meaning: "(꽃이) 피다, 개화하다 (동사)" },
  blooms: { word: "bloom", meaning: "(꽃이) 피다, 개화하다 (동사)" },
  blossom: { word: "blossom", meaning: "(나무의) 꽃이 피다 (동사/명사)" },
  veterinarian: { word: "veterinarian (vet)", meaning: "수의사, 동물 의사 (명사)" },
  vet: { word: "vet (veterinarian)", meaning: "수의사 (명사)" },
  sick: { word: "sick", meaning: "아픈, 병든 (형용사)" },
  animal: { word: "animal", meaning: "동물 (명사)" },
  animals: { word: "animal", meaning: "동물 (명사)" },
  help: { word: "help", meaning: "돕다, 도와주다 (동사)" },
  important: { word: "important", meaning: "중요한, 소중한 (형용사)" },
  essential: { word: "essential", meaning: "필수적인, 매우 중요한 (형용사)" },
  learn: { word: "learn", meaning: "배우다, 익히다 (동사)" },
  study: { word: "study", meaning: "공부하다, 연구하다 (동사)" },
  communicate: { word: "communicate with ~", meaning: "~와 소통하다, 의사소통하다 (숙어)" },
  people: { word: "people", meaning: "사람들 (복수명사)" },
  world: { word: "around the world", meaning: "전 세계에, 세계 곳곳의 (숙어)" },
  palace: { word: "palace", meaning: "궁전, 고궁 (명사)" },
  gyeongbokgung: { word: "Gyeongbokgung Palace", meaning: "경복궁 (고유명사)" },
  wear: { word: "wear (과거: wore)", meaning: "(옷·한복 등을) 입다, 착용하다 (동사)" },
  wearing: { word: "wearing (동명사)", meaning: "입는 것, 착용하는 것 (명사구)" },
  special: { word: "special", meaning: "특별한, 남다른 (형용사)" },
  experience: { word: "experience", meaning: "경험, 체험 (명사)" },
  tall: { word: "tall", meaning: "(건물·나무·키가) 높은, 키가 큰 (형용사)" },
  high: { word: "high / tall", meaning: "높은 (건물·탑에는 주로 tall 사용)" },
  building: { word: "building", meaning: "건물, 빌딩 (명사)" },
  buildings: { word: "building", meaning: "건물, 빌딩 (명사)" },
  tower: { word: "tower", meaning: "탑, 타워 (명사)" },
  kind: { word: "kind", meaning: "친절한, 다정한 (형용사)" },
  smart: { word: "smart / clever", meaning: "똑똑한, 영리한 (형용사)" },
  clever: { word: "clever", meaning: "영리한, 기발한 (형용사)" },
  fast: { word: "fast", meaning: "빠른, 빠르게 (형용사/부사)" },
  quick: { word: "quick", meaning: "빠른, 재빠른 (형용사)" },
  protect: { word: "protect", meaning: "보호하다, 지키다 (동사)" },
  environment: { word: "environment", meaning: "환경, 자연환경 (명사)" },
  earth: { word: "the Earth", meaning: "지구 (명사)" },
  healthy: { word: "healthy", meaning: "건강한 (형용사)" },
  exercise: { word: "exercise", meaning: "운동하다, 운동 (동사/명사)" },
  happy: { word: "happy", meaning: "행복한, 기쁜 (형용사)" },
  weather: { word: "weather", meaning: "날씨 (셀 수 없는 명사 - a/an을 쓰지 않음)" },
  friend: { word: "friend", meaning: "친구 (명사)" },
  friends: { word: "friend", meaning: "친구 (명사)" },
  delicious: { word: "delicious", meaning: "매우 맛있는 (형용사)" },
  interesting: { word: "interesting", meaning: "흥미로운, 재미있는 (형용사)" },
  exciting: { word: "exciting", meaning: "신나는, 흥미진진한 (형용사)" },
  difficult: { word: "difficult / hard", meaning: "어려운, 힘든 (형용사)" },
  easy: { word: "easy", meaning: "쉬운 (형용사)" },
  future: { word: "future", meaning: "미래, 장래 (명사)" },
  dream: { word: "dream", meaning: "꿈, 장래희망 (명사/동사)" }
};

/**
 * [독립적 모범 답안 생성기]
 * 학생의 답안(correctedText)을 절대 복사하지 않고,
 * 교사의 한국어 제시문(koreanPrompt) + 목표 문법(targetGrammar) + 교사 참고답안/신경망 번역으로부터
 * 표준 모범 영작 답안을 독립적으로 생성합니다.
 */
function synthesizeModelAnswerFromKorean({
  koreanPrompt = "",
  targetGrammar = "",
  referenceAnswer = "",
  autoTranslatedRef = ""
}) {
  const tgLower = (targetGrammar || "").toLowerCase();
  const koText = (koreanPrompt || "").trim();
  const refTrimmed = (referenceAnswer || "").trim();
  const autoTrimmed = (autoTranslatedRef || "").trim();

  const isExclamatoryPrompt =
    tgLower.includes("what") ||
    tgLower.includes("how") ||
    tgLower.includes("감탄") ||
    /구나\s*!|네요\s*!|얼마나\s+|참\s+.*구나/.test(koText);

  // 1) 감탄문 과제인 경우: What 감탄문과 How 감탄문 표준 정답을 모두 생성하여 학생 답안과 명확히 구분·비교되도록 제공
  if (isExclamatoryPrompt) {
    // 1-A. 만약 교사가 이미 두 가지 형태를 모두 적어둔 경우 그대로 반환
    if (refTrimmed && /what\b/i.test(refTrimmed) && /how\b/i.test(refTrimmed)) {
      return refTrimmed;
    }

    // 1-B. 교사 참고 답안 또는 자동번역 문장에서 형용사(adj)와 명사(noun) 추출 시도
    let adj = "";
    let noun = "";
    let isPlural = false;
    let uncountable = false;

    const sourceForParse = refTrimmed || autoTrimmed;
    if (sourceForParse) {
      // 패턴 1: What a(n) [adj] [noun] (it is)!
      const mWhat = sourceForParse.match(/What\s+(?:(a|an)\s+)?([a-z]+)\s+([a-z]+)(?:\s+(?:it|they|this|that)\s+(?:is|are|was|were))?\s*[.!?]*$/i);
      // 패턴 2: How [adj] the/this/that [noun] is/are!
      const mHow = sourceForParse.match(/How\s+([a-z]+)\s+(?:the|this|that)\s+([a-z]+)\s+(?:is|are|was|were)\s*[.!?]*$/i);
      // 패턴 3: 평서문 번역 결과 예: "That building is so high!" / "The building is very tall!" / "This flower is really pretty!"
      const mDecl = sourceForParse.match(/(?:the|that|this|a|an)\s+([a-z]+)\s+(?:is|are|was|were)\s+(?:so|very|really|truly|quite)?\s*([a-z]+)/i);

      if (mWhat) {
        adj = mWhat[2].toLowerCase();
        noun = mWhat[3].toLowerCase();
      } else if (mHow) {
        adj = mHow[1].toLowerCase();
        noun = mHow[2].toLowerCase();
      } else if (mDecl) {
        noun = mDecl[1].toLowerCase();
        adj = mDecl[2].toLowerCase();
      }
    }

    // 1-C. 한국어 제시문 사전 매칭으로 형용사·명사 보강 (예: "높은/키가 큰" -> tall, "건물/빌딩" -> building)
    const koAdjectives = [
      { keys: ["높은", "높구", "높다", "높아", "키가 큰", "키 큰"], en: "tall" },
      { keys: ["아름다", "예쁜", "예쁘", "고운"], en: "beautiful" },
      { keys: ["멋진", "멋지", "훌륭"], en: "wonderful" },
      { keys: ["귀여운", "귀엽"], en: "cute" },
      { keys: ["친절", "착한", "다정"], en: "kind" },
      { keys: ["똑똑", "영리", "현명"], en: "smart" },
      { keys: ["빠른", "빨리", "빠르"], en: "fast" },
      { keys: ["큰", "크구", "거대한"], en: "big" },
      { keys: ["작은", "작구"], en: "small" },
      { keys: ["재미있", "흥미"], en: "interesting" },
      { keys: ["신나", "신난"], en: "exciting" },
      { keys: ["맛있", "맛있는"], en: "delicious" },
      { keys: ["특별"], en: "special" },
      { keys: ["행복", "기쁜", "즐거"], en: "happy" },
      { keys: ["슬픈", "슬프"], en: "sad" },
      { keys: ["어려운", "어렵", "힘든"], en: "difficult" },
      { keys: ["쉬운", "쉽"], en: "easy" },
      { keys: ["좋은", "좋구", "맑은"], en: "nice" }
    ];
    const koNouns = [
      { keys: ["건물", "빌딩"], en: "building" },
      { keys: ["탑", "타워"], en: "tower" },
      { keys: ["꽃들"], en: "flowers", plural: true },
      { keys: ["꽃"], en: "flower" },
      { keys: ["강아지", "개"], en: "dog" },
      { keys: ["고양이"], en: "cat" },
      { keys: ["소년", "남자아이"], en: "boy" },
      { keys: ["소녀", "여자아이"], en: "girl" },
      { keys: ["아이", "어린이"], en: "child" },
      { keys: ["학생"], en: "student" },
      { keys: ["선생님", "교사"], en: "teacher" },
      { keys: ["친구"], en: "friend" },
      { keys: ["책"], en: "book" },
      { keys: ["영화"], en: "movie" },
      { keys: ["노래"], en: "song" },
      { keys: ["음악"], en: "music", uncountable: true },
      { keys: ["날씨"], en: "weather", uncountable: true },
      { keys: ["음식"], en: "food", uncountable: true },
      { keys: ["하늘"], en: "sky" },
      { keys: ["바다"], en: "sea" },
      { keys: ["집"], en: "house" },
      { keys: ["차", "자동차"], en: "car" },
      { keys: ["나무"], en: "tree" },
      { keys: ["공원"], en: "park" },
      { keys: ["학교"], en: "school" }
    ];

    for (const item of koAdjectives) {
      if (item.keys.some((k) => koText.includes(k))) {
        adj = item.en;
        break;
      }
    }
    for (const item of koNouns) {
      if (item.keys.some((k) => koText.includes(k))) {
        noun = item.en;
        isPlural = Boolean(item.plural);
        uncountable = Boolean(item.uncountable);
        break;
      }
    }

    // 건물(building)과 high가 조합된 경우 더 자연스러운 tall로 보정
    if (noun === "building" && adj === "high") {
      adj = "tall";
    }

    if (adj && noun) {
      const article = isPlural || uncountable ? "" : /^[aeiou]/i.test(adj) ? "an " : "a ";
      const pron = isPlural ? "they are" : "it is";
      const beVerb = isPlural ? "are" : "is";
      const whatForm = `What ${article}${adj} ${noun} ${pron}!`;
      const howForm = `How ${adj} the ${noun} ${beVerb}!`;

      const onlyWhat = tgLower.includes("what") && !tgLower.includes("how");
      const onlyHow = tgLower.includes("how") && !tgLower.includes("what");

      if (onlyWhat) return `${whatForm} (참고 How 감탄문: ${howForm})`;
      if (onlyHow) return `${howForm} (참고 What 감탄문: ${whatForm})`;
      return `[What 감탄문] ${whatForm}  /  [How 감탄문] ${howForm}`;
    }

    if (refTrimmed) return refTrimmed;
  }

  // 2) 교사가 입력한 참고 모범답안이 있는 경우: 복수 정답(/, |, ;, 줄바꿈) 및 관계대명사(which/that/생략) 자동 확장 적용
  if (refTrimmed) {
    if (refTrimmed.includes("[What 감탄문]") || refTrimmed.includes("(참고")) {
      return refTrimmed;
    }
    const expanded = parseAndExpandReferenceAnswers(refTrimmed);
    return expanded.length > 1 ? expanded.join(" / ") : refTrimmed;
  }

  // 3) 실시간 신경망 번역 결과(autoTranslatedRef)가 있는 경우 문장부호/대소문자 정돈 및 복수 정답 자동 확장 후 반환
  if (autoTrimmed) {
    let cleaned = autoTrimmed.replace(/\s+/g, " ").trim();
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    if (!/[.!?]$/.test(cleaned)) {
      cleaned += isExclamatoryPrompt ? "!" : ".";
    }
    const expandedAuto = parseAndExpandReferenceAnswers(cleaned);
    return expandedAuto.length > 1 ? expandedAuto.join(" / ") : cleaned;
  }

  // 4) 오프라인 상태에서 한국어 제시문의 핵심 개념어로 기본 모범 문장 조합
  return "제시된 한국어 문장의 주어·동사와 핵심 목표 표현을 포함하여 완전한 영어 문장으로 작성해 보세요.";
}

/**
 * [과제 맞춤형 핵심 및 추천 어휘 생성기]
 * 무관한 고정 문구(sentence structure, expression 등)를 완전히 배제하고,
 * 현재 한국어 제시문(koreanPrompt), 목표 문법(targetGrammar), 모범 답안(modelAnswer)에서
 * 실제 학습해야 할 핵심 구문 공식과 필수 영어 어휘만 정확하게 추출합니다.
 */
function buildRelevantVocabularyList({
  koreanPrompt = "",
  targetGrammar = "",
  modelAnswer = "",
  missingConceptLabels = []
}) {
  const suggestions = [];
  const usedKeys = new Set();
  const tgLower = (targetGrammar || "").toLowerCase();
  const koText = (koreanPrompt || "").trim();
  const firstModelSentence = (modelAnswer || "")
    .replace(/\[What 감탄문\]\s*/g, "")
    .split(/\s*\/\s*|\s*\(참고/)[0]
    .trim();

  // 1순위: 목표 문법/구문 공식 및 의미 안내
  if (tgLower.includes("what") || tgLower.includes("how") || tgLower.includes("감탄")) {
    const whatExMatch = modelAnswer.match(/What\s+[^/!]+!/i);
    const howExMatch = modelAnswer.match(/How\s+[^/!)✨]+!/i);
    suggestions.push({
      word: "What + a(n) + 형용사 + 명사 + 주어 + 동사!",
      meaning: "명사를 강조하는 감탄문 어순 ('참 ~한 …구나!')",
      example: whatExMatch ? whatExMatch[0].trim() : "What a tall building it is!"
    });
    suggestions.push({
      word: "How + 형용사/부사 + 주어 + 동사!",
      meaning: "형용사·부사를 강조하는 감탄문 어순 ('얼마나 ~한지!') — 주어 뒤에 반드시 동사(is/are)가 와야 함",
      example: howExMatch ? howExMatch[0].trim() : "How tall the building is!"
    });
    usedKeys.add("what");
    usedKeys.add("how");
  } else if (tgLower.includes("so that")) {
    suggestions.push({
      word: "so that + 주어 + can + 동사원형",
      meaning: "~할 수 있도록, ~하기 위해서 (목적을 나타내는 접속사 구문)",
      example: firstModelSentence || "I want to be a veterinarian so that I can help sick animals."
    });
    usedKeys.add("so that");
  } else if (/it\s*~?\s*to|가주어/i.test(targetGrammar)) {
    suggestions.push({
      word: "It is + 형용사 + to + 동사원형 ~",
      meaning: "~하는 것은 …하다 (가주어 It - 진주어 to부정사 구문)",
      example: firstModelSentence || "It is important to learn English to communicate with people."
    });
    usedKeys.add("it is");
  } else if (tgLower.includes("because")) {
    suggestions.push({
      word: "because + 주어 + 동사",
      meaning: "왜냐하면 ~이기 때문에 (원인·이유를 나타내는 접속사)",
      example: firstModelSentence || "My favorite season is spring because beautiful flowers bloom."
    });
    usedKeys.add("because");
  } else if (tgLower.includes("have been") || tgLower.includes("현재완료")) {
    suggestions.push({
      word: "have/has been to + 장소",
      meaning: "~에 가본 적이 있다 (현재완료 경험 용법)",
      example: firstModelSentence || "I have been to Gyeongbokgung Palace."
    });
    usedKeys.add("have been");
  } else if (targetGrammar && targetGrammar.trim()) {
    suggestions.push({
      word: targetGrammar.trim(),
      meaning: "이번 영작 과제의 핵심 목표 문법·표현",
      example: firstModelSentence || modelAnswer
    });
  }

  // 2순위: 한국어 제시문(koreanPrompt)에 매칭된 실제 핵심 어휘 추가
  if (koText) {
    for (const item of KO_EN_CONCEPT_DICT) {
      if (item.ko.some((k) => koText.includes(k))) {
        const mainEn = item.dictWord || item.en[0];
        if (usedKeys.has(mainEn.toLowerCase())) continue;
        usedKeys.add(mainEn.toLowerCase());

        const dictEntry = EN_WORD_MEANING_DICT[item.en[0].toLowerCase()];
        const wordTitle = dictEntry ? dictEntry.word : `${item.en.slice(0, 2).join(" / ")}`;
        const wordMeaning = dictEntry
          ? dictEntry.meaning
          : item.dictMeaning || `${item.label.replace(/\([^)]*\)/g, "")} (제시문 핵심 어휘)`;
        const isMissing = missingConceptLabels.includes(item.label);

        suggestions.push({
          word: isMissing ? `⚠️ ${wordTitle} (보완 권장)` : wordTitle,
          meaning: wordMeaning,
          example: firstModelSentence || modelAnswer
        });
      }
    }
  }

  // 3순위: 모범 답안(modelAnswer)에 포함된 주요 영단어 사전 풀이 추가
  const modelTokens = (modelAnswer.toLowerCase().match(/[a-z]+/g) || []);
  for (const token of modelTokens) {
    if (suggestions.length >= 5) break;
    const entry = EN_WORD_MEANING_DICT[token];
    if (entry && !usedKeys.has(entry.word.toLowerCase()) && !usedKeys.has(token)) {
      usedKeys.add(entry.word.toLowerCase());
      usedKeys.add(token);
      suggestions.push({
        word: entry.word,
        meaning: entry.meaning,
        example: firstModelSentence || modelAnswer
      });
    }
  }

  return suggestions.slice(0, 5);
}

// 영어 동의어/어근 정규화 헬퍼 (모범답안 비교 시 동일 의미 인정)
const EN_SYNONYM_GROUPS = [
  ["vet", "veterinarian"],
  ["beautiful", "pretty", "lovely", "gorgeous"],
  ["tall", "high"],
  ["big", "large", "huge"],
  ["small", "little", "tiny"],
  ["autumn", "fall"],
  ["bloom", "blooms", "blossom", "blossoms"],
  ["important", "essential", "vital"],
  ["communicate", "talk", "converse"],
  ["trip", "travel", "journey"],
  ["sick", "ill", "injured"],
  ["happy", "glad", "pleased", "joyful"],
  ["smart", "clever", "intelligent"],
  ["fast", "quick", "quickly"],
  ["hard", "difficult"]
];

function normalizeEnWord(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return "";
  for (const group of EN_SYNONYM_GROUPS) {
    if (group.includes(w)) return group[0];
  }
  // 명사인 building, morning, evening, spring, thing 등은 -ing 제거에서 제외
  if (
    w.length > 4 &&
    w.endsWith("ing") &&
    !["building", "morning", "evening", "spring", "feeling", "nothing", "something", "everything", "anything"].includes(w)
  ) {
    return w.slice(0, -3);
  }
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("is")) return w.slice(0, -1);
  return w;
}

function normalizeSentenceForCompare(str) {
  return (str || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[.!?,;:"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * [복수 정답 파싱 및 문법적 동치 문장(관계대명사 which/that/생략, 감탄문 What/How 등) 자동 확장기]
 * 교사가 슬래시(/), 세로선(|), 세미콜론(;), 줄바꿈(\n) 등으로 구분해 입력한 여러 개의 정답을 개별 후보 배열로 분리하고,
 * 단일 정답만 입력된 경우에도 목적격 관계대명사(which / that / 생략) 등 표준 복수 정답을 자동으로 확장합니다.
 */
function parseAndExpandReferenceAnswers(rawRefStr = "") {
  if (!rawRefStr || !rawRefStr.trim()) return [];

  // 1) /, |, ;, 줄바꿈으로 구분된 복수 정답 분리
  const rawParts = rawRefStr
    .split(/\s*(?:\/|\||;|\n)\s*/)
    .map((s) =>
      s
        .replace(/^\[[^\]]+\]\s*/g, "")
        .replace(/^\(참고[^)]*\)\s*/g, "")
        .replace(/\s*\(참고[^)]*\)\s*$/g, "")
        .trim()
    )
    .filter((s) => s.length >= 2 && /[a-zA-Z]/.test(s));

  const expandedSet = new Set();
  const resultList = [];

  const addCandidate = (sentence) => {
    const clean = sentence.replace(/\s+/g, " ").trim();
    const norm = normalizeSentenceForCompare(clean);
    if (norm && !expandedSet.has(norm)) {
      expandedSet.add(norm);
      resultList.push(clean);
    }
  };

  for (const part of rawParts) {
    addCandidate(part);

    // 2) 목적격 관계대명사 (선행사 + which/that/whom + 대명사주어(I/we/you/they/he/she) + 동사) 자동 3종(which / that / 생략) 확장!
    // 예: "Taxes pay for the clean air which we need."
    //  -> "Taxes pay for the clean air which we need."
    //  -> "Taxes pay for the clean air that we need."
    //  -> "Taxes pay for the clean air we need." (목적격 관계대명사 생략)
    const objRelMatch = part.match(
      /^(.*?\b[a-z]+)\s+(which|that|whom|who)\s+((?:i|we|you|they|he|she)\s+[a-z]+.*)$/i
    );
    if (objRelMatch) {
      const prefix = objRelMatch[1];
      const relPron = objRelMatch[2].toLowerCase();
      const suffix = objRelMatch[3];
      if (relPron === "which" || relPron === "that") {
        addCandidate(`${prefix} which ${suffix}`);
        addCandidate(`${prefix} that ${suffix}`);
        addCandidate(`${prefix} ${suffix}`);
      } else if (relPron === "whom" || relPron === "who") {
        addCandidate(`${prefix} whom ${suffix}`);
        addCandidate(`${prefix} who ${suffix}`);
        addCandidate(`${prefix} that ${suffix}`);
        addCandidate(`${prefix} ${suffix}`);
      }
    }
  }

  return resultList;
}

/**
 * [방법 ②: 채점 엄격도 3단계 메타데이터 헬퍼]
 * - strict (🎯 서술형 칼채점): 내신 서술형 기준, 관사·단복수·어순 100% 일치 시에만 만점, 오류 감점 1.35배 강화
 * - standard (⚖️ 표준 정밀 채점): 핵심 구문·어순·수일치·관사 정밀 검사 (기본값)
 * - fluency (🌱 의미 소통 격려): 기초반 연습용, 경미한 관사 실수 감점 완화(0.7배), 핵심 어순·동사 중심 평가
 */
function getStrictnessMeta(strictness = "standard") {
  if (strictness === "strict") {
    return {
      mode: "strict",
      label: "🎯 서술형 칼채점 (100% 완벽 일치형)",
      shortLabel: "🎯 서술형 칼채점",
      penaltyMultiplier: 1.35,
      allowArticleSwap: false
    };
  }
  if (strictness === "fluency") {
    return {
      mode: "fluency",
      label: "🌱 의미 소통 격려 (기초 연습용)",
      shortLabel: "🌱 격려 채점",
      penaltyMultiplier: 0.65,
      allowArticleSwap: true
    };
  }
  return {
    mode: "standard",
    label: "⚖️ 표준 정밀 채점",
    shortLabel: "⚖️ 표준 채점",
    penaltyMultiplier: 1.0,
    allowArticleSwap: true
  };
}

/**
 * [방법 ③: 모범 답안 자동 구문 블록(Chunk Slot) 분해기]
 * 교사가 별도로 슬롯을 나누지 않아도, 영어 문장을 주어+동사부 / 핵심구문부 / 전치사구 / 관계사·접속사절 단위로 자동 분해합니다.
 */
function decomposeSentenceIntoChunks(sentence = "") {
  const cleaned = (sentence || "")
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  const words = cleaned.split(" ");
  if (words.length <= 4) return [cleaned.replace(/[.!?]+$/g, "")];

  const chunks = [];
  let current = [];

  const boundaryStarters = new Set([
    "in", "for", "on", "at", "with", "from", "into", "around", "about", "all",
    "which", "that", "who", "whom", "because", "when", "if", "while", "although"
  ]);

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const wl = w.toLowerCase().replace(/[^a-z]/g, "");
    const nextWl = (words[i + 1] || "").toLowerCase().replace(/[^a-z]/g, "");

    // "so that" 또는 "all over" 구문 경계
    if (
      ((wl === "so" && nextWl === "that") || (wl === "all" && nextWl === "over")) &&
      current.length >= 2
    ) {
      chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
      current = [w];
      continue;
    }

    // "like + 명사" (be like ~ 구문에서 주어+be동사 뒤의 핵심 구문 분리)
    if (wl === "like" && i >= 2 && current.length >= 2 && /^(are|is|was|were|am)$/i.test(words[i - 1])) {
      chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
      current = [w];
      continue;
    }

    // "to + 동사원형" (가주어-진주어 또는 목적의 to부정사구 경계, 단 want to / have to / need to는 앞 동사와 묶음)
    if (
      wl === "to" &&
      i >= 2 &&
      current.length >= 2 &&
      !/^(want|wants|wanted|need|needs|needed|have|has|had|like|likes|try|tried|been)$/i.test(
        words[i - 1].replace(/[^a-zA-Z]/g, "")
      )
    ) {
      chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
      current = [w];
      continue;
    }

    // 전치사구 / 관계사절 경계 (앞 블록이 최소 2단어 이상 모였을 때 분리, 단 all은 all over일 때만 위에서 분리)
    if (wl !== "all" && boundaryStarters.has(wl) && current.length >= 2 && i < words.length - 1) {
      chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
      current = [w];
      continue;
    }

    current.push(w);

    // 문장 종결 부호(., !, ?)가 있으면 해당 문장 끝에서 블록 분리!
    if (/[.!?]$/.test(w) && current.length >= 2 && i < words.length - 1) {
      chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current.join(" ").replace(/[.!?]+$/g, ""));
  }

  return chunks.filter(Boolean);
}

/**
 * [구문 블록(Chunk Slot)별 학생 답안 달성도 정밀 진단기 (철자·어순·관사·단복수 통합 검사)]
 */
function evaluateChunkSlotAlignment(studentText, candSentence, allowArticleSwap = true) {
  const chunks = decomposeSentenceIntoChunks(candSentence);
  const studentNorm = normalizeSentenceForCompare(studentText);
  const studentFlex = studentNorm.replace(/\b(a|an|the)\b/g, "DET");
  const studentExactWordSet = new Set(studentNorm.match(/[a-z]+/g) || []);
  const studentStemSet = new Set(Array.from(studentExactWordSet).map(normalizeEnWord));

  return chunks.map((chunk, idx) => {
    const chunkNorm = normalizeSentenceForCompare(chunk);
    const chunkFlex = chunkNorm.replace(/\b(a|an|the)\b/g, "DET");
    const chunkWords = chunkNorm.match(/[a-z]+/g) || [];

    // ★ 철자(Spelling), 단복수, 어순이 100% 정확히 포함되어야 pass!
    const exactHit =
      studentNorm.includes(chunkNorm) || (allowArticleSwap && studentFlex.includes(chunkFlex));

    if (exactHit) {
      return {
        index: idx + 1,
        chunk,
        status: "pass",
        detail: "철자·어순·형태 정확"
      };
    }

    // 어떤 단어가 철자 오류이거나 누락되었는지 추적
    const missingExactWords = chunkWords.filter(
      (w) => !studentExactWordSet.has(w) && !(allowArticleSwap && /^(a|an|the)$/.test(w))
    );
    const matchedWordsCount = chunkWords.filter(
      (w) => studentExactWordSet.has(w) || studentStemSet.has(normalizeEnWord(w))
    ).length;

    if (matchedWordsCount >= Math.max(1, Math.ceil(chunkWords.length * 0.5))) {
      const fixHint =
        missingExactWords.length > 0
          ? `철자·형태 오류 → '${missingExactWords.slice(0, 2).join(", ")}' 확인`
          : "어순·관사 오류";
      return {
        index: idx + 1,
        chunk,
        status: "warn",
        detail: fixHint
      };
    }

    return {
      index: idx + 1,
      chunk,
      status: "fail",
      detail: "구문 누락"
    };
  });
}

/**
 * [방법 ⑤: 학생 답안 vs 모범 답안 단어별 1:1 시각적 비교(Visual Diff) & 구문 블록 진단 HTML 생성기]
 */
function buildWordByWordDiffHtml(studentText, bestCandidate, chunkAnalysis = [], isExactMatch = false) {
  if (!bestCandidate) return "";

  const cleanStudent = (studentText || "").replace(/\s+/g, " ").trim();
  const cleanCand = (bestCandidate || "").replace(/\s+/g, " ").trim();

  if (isExactMatch) {
    const passChunksHtml = (chunkAnalysis || [])
      .map(
        (c) =>
          `<span class="chunk-slot-pill pass">✅ ${c.index}구간: ${c.chunk}</span>`
      )
      .join("");
    return `
      <div class="diff-tokens-line">
        <span class="diff-token diff-ins">🌟 모범 답안과 단어·어순·수일치·관사가 100% 완벽하게 일치합니다!</span>
      </div>
      ${passChunksHtml ? `<div class="chunk-slots-wrap">${passChunksHtml}</div>` : ""}
    `;
  }

  const sTokens = cleanStudent.replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);
  const cTokens = cleanCand.replace(/[.!?]+$/, "").split(/\s+/).filter(Boolean);

  // LCS 역추적을 통한 단어별 1:1 정렬 Diff 계산 (대소문자/문장부호 제거 후 철자 정확 일치 기준)
  const normToken = (t) => t.toLowerCase().replace(/[^a-z']/g, "");
  const m = sTokens.length;
  const n = cTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (normToken(sTokens[i - 1]) === normToken(cTokens[j - 1])) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const diffOps = [];
  let i = m;
  let j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && normToken(sTokens[i - 1]) === normToken(cTokens[j - 1])) {
      diffOps.unshift({ type: "match", text: sTokens[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffOps.unshift({ type: "ins", text: cTokens[j - 1] });
      j--;
    } else {
      diffOps.unshift({ type: "del", text: sTokens[i - 1] });
      i--;
    }
  }

  const tokensHtml = diffOps
    .map((op) => {
      if (op.type === "match") {
        return `<span class="diff-token diff-match">${op.text}</span>`;
      }
      if (op.type === "del") {
        return `<span class="diff-token diff-del" title="학생 답안 내 오류 또는 어순 불일치 단어">${op.text}</span>`;
      }
      return `<span class="diff-token diff-ins" title="모범 답안의 올바른 위치·표현">+${op.text}</span>`;
    })
    .join("");

  const chunksHtml = (chunkAnalysis || [])
    .map((c) => {
      const icon = c.status === "pass" ? "✅" : c.status === "warn" ? "⚠️" : "❌";
      return `<span class="chunk-slot-pill ${c.status}" title="${c.detail}">${icon} ${c.index}구간: ${c.chunk} <small>(${c.detail})</small></span>`;
    })
    .join("");

  return `
    <div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.35rem;">
      🔎 <strong>단어별 1:1 어순·형태 대조:</strong>
      <span style="color:#b91c1c;text-decoration:line-through;margin-left:0.35rem;">취소선(빨강)=오류·어순이탈</span>
      <span style="color:#15803d;font-weight:700;margin-left:0.35rem;">+초록색=올바른 위치·보완어</span>
      <span style="color:#334155;margin-left:0.35rem;">회색=정확히 일치</span>
    </div>
    <div class="diff-tokens-line">${tokensHtml}</div>
    ${
      chunksHtml
        ? `<div style="font-size: 0.78rem; color: #64748b; margin-bottom: 0.3rem;">🧩 <strong>구문 블록(Chunk Slot) 달성 진단:</strong></div><div class="chunk-slots-wrap">${chunksHtml}</div>`
        : ""
    }
  `;
}

/**
 * [학생 답안 vs 복수 정답 후보군 1:N 최적 매칭 비교기]
 * 여러 개의 복수 정답 후보 중 학생이 작성한 답안과 가장 일치도가 높은 후보(bestCandidate)를 찾아
 * 다른 복수 정답에만 있는 단어(예: 3번째 생략형 정답을 썼는데 1번째 정답의 which가 없다고 감점하는 현상)로 인해
 * 억울하게 감점되지 않도록 1:1 최적 비교 결과를 반환합니다.
 */
function findBestMatchingReferenceCandidate(studentText, candidateList = [], strictness = "standard") {
  if (!candidateList || candidateList.length === 0) {
    return null;
  }

  const strictMeta = getStrictnessMeta(strictness);
  const studentNorm = normalizeSentenceForCompare(studentText);
  const studentWordsSeq = studentNorm.match(/[a-z]+/g) || [];
  const studentRawLower = (studentText || "").toLowerCase();
  const studentTokens = new Set(studentWordsSeq.map(normalizeEnWord));

  const stopWords = new Set([
    "the", "a", "an", "to", "of", "in", "on", "at", "for", "with", "and",
    "so", "very", "really", "that", "this", "it", "they", "is", "are", "was", "were",
    "what", "how"
  ]);

  let bestResult = null;

  for (let i = 0; i < candidateList.length; i++) {
    const cand = candidateList[i];
    const candNorm = normalizeSentenceForCompare(cand);
    const candWordsSeq = candNorm.match(/[a-z]+/g) || [];

    // 1) 완전 일치 여부 확인 (서술형 칼채점 모드에서는 관사 a/the 교체도 불허하고 100% 일치해야 함)
    const studentArticleFlex = studentNorm.replace(/\b(a|an|the)\b/g, "DET");
    const candArticleFlex = candNorm.replace(/\b(a|an|the)\b/g, "DET");
    const isExactMatch =
      studentNorm === candNorm ||
      (strictMeta.allowArticleSwap && studentArticleFlex === candArticleFlex);

    const chunkAnalysis = evaluateChunkSlotAlignment(
      studentText,
      cand,
      strictMeta.allowArticleSwap
    );

    if (isExactMatch) {
      return {
        bestCandidate: cand,
        matchedIndex: i,
        isExactMatch: true,
        refRatio: 1.0,
        missingRefWords: [],
        wordOrderInversions: [],
        missingArticles: [],
        numberMismatches: [],
        chunkAnalysis
      };
    }

    // 2) 해당 후보 문장의 핵심 단어(Content Words) 대비 일치율 계산
    const candContentWords = Array.from(
      new Set(candWordsSeq.filter((w) => !stopWords.has(w) && w.length >= 2))
    );

    let hitCount = 0;
    const missing = [];
    for (const cw of candContentWords) {
      const normCw = normalizeEnWord(cw);
      if (studentTokens.has(normCw) || studentRawLower.includes(cw)) {
        hitCount += 1;
      } else {
        missing.push(cw);
      }
    }

    // 3) ★ 어순 뒤바뀜(Word Order Inversion) 정밀 검출!
    // 예: 모범답안은 "like money"인데 학생이 "money like"로 쓴 경우
    const wordOrderInversions = [];
    for (let j = 0; j < candWordsSeq.length - 1; j++) {
      const w1 = candWordsSeq[j];
      const w2 = candWordsSeq[j + 1];
      if (w1 === w2) continue;
      const reversedRegex = new RegExp(`\\b${w2}\\s+${w1}\\b`, "i");
      const correctRegex = new RegExp(`\\b${w1}\\s+${w2}\\b`, "i");
      if (reversedRegex.test(studentNorm) && !correctRegex.test(studentNorm)) {
        wordOrderInversions.push({
          wrong: `${w2} ${w1}`,
          right: `${w1} ${w2}`
        });
      }
    }

    // 또한 LCS(최장 공통 부분수열) 기반 전체 어순 일치율 계산
    const dp = Array.from({ length: candWordsSeq.length + 1 }, () =>
      Array(studentWordsSeq.length + 1).fill(0)
    );
    for (let r = 1; r <= candWordsSeq.length; r++) {
      for (let c = 1; c <= studentWordsSeq.length; c++) {
        if (normalizeEnWord(candWordsSeq[r - 1]) === normalizeEnWord(studentWordsSeq[c - 1])) {
          dp[r][c] = dp[r - 1][c - 1] + 1;
        } else {
          dp[r][c] = Math.max(dp[r - 1][c], dp[r][c - 1]);
        }
      }
    }
    const lcsLen = dp[candWordsSeq.length][studentWordsSeq.length];
    const orderRatio = candWordsSeq.length > 0 ? lcsLen / candWordsSeq.length : 1.0;

    // 4) ★ 관사(a/an/the) 누락 정밀 검출!
    const missingArticles = [];
    const prepArtNounRegex = /\b(in|for|on|at|to|with|as|of|like|into|from)\s+(a|an|the)\s+([a-z]+)\b/gi;
    let pam;
    while ((pam = prepArtNounRegex.exec(candNorm)) !== null) {
      const prep = pam[1];
      const art = pam[2];
      const noun = pam[3];
      const barePrepNounRegex = new RegExp(`\\b${prep}\\s+${noun}\\b`, "i");
      const withDetRegex = new RegExp(`\\b${prep}\\s+(?:a|an|the|my|your|his|her|its|our|their|this|that)\\s+${noun}\\b`, "i");
      if (barePrepNounRegex.test(studentNorm) && !withDetRegex.test(studentNorm)) {
        missingArticles.push({
          wrong: `${prep} ${noun}`,
          right: `${prep} ${art} ${noun}`
        });
      }
    }

    // 5) ★ 단수·복수(Number) 불일치 정밀 검출!
    const numberMismatches = [];
    for (const cw of candWordsSeq) {
      if (cw.length >= 4 && (cw.endsWith("s") && !cw.endsWith("ss") && !cw.endsWith("is"))) {
        const singularForm = cw.endsWith("es") ? cw.slice(0, -2) : cw.slice(0, -1);
        const hasExactPlural = new RegExp(`\\b${cw}\\b`, "i").test(studentNorm);
        const hasSingularInstead =
          new RegExp(`\\b${singularForm}\\b`, "i").test(studentNorm) ||
          new RegExp(`\\b${cw.slice(0, -1)}\\b`, "i").test(studentNorm);
        if (!hasExactPlural && hasSingularInstead) {
          const matchedWrong = studentWordsSeq.find(
            (sw) => sw === singularForm || sw === cw.slice(0, -1)
          );
          if (matchedWrong) {
            numberMismatches.push({
              wrong: matchedWrong,
              right: cw
            });
          }
        }
      }
    }

    const baseRatio = candContentWords.length > 0 ? hitCount / candContentWords.length : 1.0;
    const combinedRefRatio = Math.min(baseRatio, baseRatio * 0.7 + orderRatio * 0.3);

    const lenDiff = Math.abs(studentWordsSeq.length - candWordsSeq.length);
    const scoreMetric =
      combinedRefRatio * 100 -
      wordOrderInversions.length * 8 -
      missingArticles.length * 4 -
      numberMismatches.length * 5 -
      lenDiff * 0.5;

    if (!bestResult || scoreMetric > bestResult.scoreMetric) {
      bestResult = {
        bestCandidate: cand,
        matchedIndex: i,
        isExactMatch: false,
        refRatio: combinedRefRatio,
        missingRefWords: missing,
        wordOrderInversions,
        missingArticles,
        numberMismatches,
        chunkAnalysis,
        scoreMetric
      };
    }
  }

  return bestResult;
}

function evaluateWritingLocally({
  mode,
  topic,
  koreanPrompt,
  targetGrammar,
  referenceAnswer,
  strictness = "standard",
  autoTranslatedRef = "",
  ltMatches = [],
  geminiResult = null,
  content,
  studentName
}) {
  const strictMeta = getStrictnessMeta(strictness);
  // ★ 학생 답안과 완전히 독립적으로 한국어 제시문 + 목표 문법에서 표준 모범 답안 생성
  const independentModelAnswer = synthesizeModelAnswerFromKorean({
    koreanPrompt,
    targetGrammar,
    referenceAnswer,
    autoTranslatedRef
  });

  if (!content || content === "(제한시간 초과로 미작성 상태에서 자동 발송됨)") {
    return {
      cefrLevel: "A1",
      score: 0,
      meaningAccuracy: 0,
      targetExpressionUsed: false,
      rubric: { meaning: 0, target: 0, grammar: 0, mechanics: 0 },
      correctedText: "(제한시간 내 작성된 영어 문장이 없습니다.)",
      modelAnswer: independentModelAnswer,
      grammarFeedback: [
        {
          original: "(미작성 시간초과)",
          corrected: independentModelAnswer,
          explanation: "제한시간이 종료되어 미작성 상태로 자동 제출되었습니다. 모범 답안을 확인하고 다시 도전해 보세요!"
        }
      ],
      vocabularySuggestions: buildRelevantVocabularyList({
        koreanPrompt,
        targetGrammar,
        modelAnswer: independentModelAnswer,
        missingConceptLabels: []
      }),
      overallComment:
        "제한시간 동안 작성된 영작문이 없어 0점으로 자동 발송되었습니다. 아래 추천 모범 답안과 핵심 어휘를 확인해 보세요!"
    };
  }

  const safeContent = maskPersonalInfoClient(content, studentName).trim();
  const words = safeContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const englishWordsOnly = safeContent.match(/[a-zA-Z']+/g) || [];
  const hasKoreanChars = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(safeContent);

  if (englishWordsOnly.length === 0) {
    return {
      cefrLevel: "A1",
      score: 0,
      meaningAccuracy: 0,
      targetExpressionUsed: false,
      rubric: { meaning: 0, target: 0, grammar: 0, mechanics: 0 },
      correctedText: "(영어 단어가 인식되지 않았습니다.)",
      modelAnswer: independentModelAnswer,
      grammarFeedback: [
        {
          original: safeContent,
          corrected: independentModelAnswer,
          explanation: "영어 단어가 인식되지 않았습니다. 한국어 제시문의 의미를 영어 주어+동사 문장으로 작성해 주세요!"
        }
      ],
      vocabularySuggestions: buildRelevantVocabularyList({
        koreanPrompt,
        targetGrammar,
        modelAnswer: independentModelAnswer,
        missingConceptLabels: []
      }),
      overallComment: "영어 문장이 입력되지 않아 0점으로 처리되었습니다. 추천 모범 영작 답안과 핵심 어휘를 참고해 영어로 작성해 보세요!"
    };
  }

  const grammarFeedback = [];
  let correctedText = safeContent.replace(/\s+/g, " ").trim();

  // ============================================================================
  // [4영역] 표기법·대소문자·축약형·문장부호 검사 (10점 만점)
  // ============================================================================
  let mechanicsScore = 10;
  const mechanicsIssues = [];

  if (/^[a-z]/.test(correctedText)) {
    mechanicsScore -= 3;
    mechanicsIssues.push("첫 글자 대문자 표기");
    correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
  }
  if (/\bi\b/.test(correctedText)) {
    mechanicsScore -= 2;
    mechanicsIssues.push("1인칭 대명사 'I' 대문자 표기");
    correctedText = correctedText.replace(/\bi\b/g, "I");
  }
  if (/\b(dont|cant|wont|didnt|doesnt|isnt|arent|wasnt|werent|havent|hasnt|im)\b/i.test(correctedText)) {
    mechanicsScore -= 2;
    mechanicsIssues.push("축약형 아포스트로피(') 표기");
    correctedText = correctedText
      .replace(/\bdont\b/gi, "don't")
      .replace(/\bcant\b/gi, "can't")
      .replace(/\bwont\b/gi, "won't")
      .replace(/\bdidnt\b/gi, "didn't")
      .replace(/\bdoesnt\b/gi, "doesn't")
      .replace(/\bisnt\b/gi, "isn't")
      .replace(/\barent\b/gi, "aren't")
      .replace(/\bwasnt\b/gi, "wasn't")
      .replace(/\bwerent\b/gi, "weren't")
      .replace(/\bhavent\b/gi, "haven't")
      .replace(/\bhasnt\b/gi, "hasn't")
      .replace(/\bim\b/gi, "I'm");
  }

  const isExclamatoryTarget =
    /what|how|감탄/i.test(targetGrammar || "") ||
    /^(what|how)\b/i.test(correctedText) ||
    (koreanPrompt && koreanPrompt.includes("!"));

  if (!/[.!?]$/.test(correctedText)) {
    mechanicsScore -= 3;
    mechanicsIssues.push(isExclamatoryTarget ? "감탄부호(!) 누락" : "마침표(.) 등 문장부호 누락");
    correctedText += isExclamatoryTarget ? "!" : ".";
  } else if (isExclamatoryTarget && /^(what|how)\b/i.test(correctedText) && correctedText.endsWith(".")) {
    mechanicsScore -= 1;
    mechanicsIssues.push("감탄문 끝 문장부호(!) 권장");
    correctedText = correctedText.slice(0, -1) + "!";
  }
  mechanicsScore = Math.max(0, mechanicsScore);

  if (mechanicsIssues.length > 0) {
    grammarFeedback.push({
      original: safeContent,
      corrected: correctedText,
      explanation: `[표기/문장부호 교정] ${mechanicsIssues.join(", ")} 부분을 올바른 영어 표기법에 맞게 다듬었습니다.`
    });
  }

  // ============================================================================
  // [3영역] 일반 영문법 및 어순 정밀 검사 (20점 만점)
  // ============================================================================
  let grammarScore = 20;
  let missingMainVerbPenaltyApplied = false;

  if (hasKoreanChars) {
    grammarScore -= 8;
    grammarFeedback.push({
      original: safeContent.match(/[가-힣]+/g)?.join(", ") || "한국어 포함",
      corrected: "영어 표현으로 변환 필요",
      explanation: "[미번역 한국어 포함] 영작문 안에 한국어가 그대로 남아 있습니다. 모든 단어를 영어로 영작해 주세요."
    });
  }

  // 3-1. 문장 내 본동사(Finite Verb) 존재 여부 정밀 확인 (building, morning 같은 -ing 명사는 절대 동사로 오인하지 않음!)
  const finiteVerbsRegex =
    /\b(am|is|are|was|were|be|been|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|like|likes|liked|love|loves|loved|want|wants|wanted|need|needs|help|helps|helped|learn|learns|learned|study|studies|studied|go|goes|went|gone|come|comes|came|make|makes|made|take|takes|took|see|sees|saw|seen|know|knows|knew|think|thinks|thought|get|gets|got|give|gives|gave|find|finds|found|tell|tells|told|work|works|worked|call|calls|try|tries|tried|ask|asks|feel|feels|felt|become|becomes|became|leave|leaves|left|put|puts|mean|means|keep|keeps|kept|let|lets|begin|begins|began|seem|seems|show|shows|hear|hears|heard|play|plays|played|run|runs|ran|move|moves|live|lives|lived|believe|believes|bring|brings|happen|happens|write|writes|wrote|written|sit|sits|sat|stand|stands|lose|loses|lost|pay|pays|meet|meets|met|include|includes|continue|continues|set|sets|change|changes|lead|leads|understand|understands|watch|watches|watched|follow|follows|stop|stops|create|creates|speak|speaks|spoke|read|reads|allow|allows|add|adds|spend|spends|spent|grow|grows|grew|open|opens|walk|walks|walked|win|wins|won|offer|offers|remember|remembers|consider|considers|appear|appears|buy|buys|bought|wait|waits|serve|serves|die|dies|send|sends|sent|expect|expects|build|builds|built|stay|stays|stayed|fall|falls|fell|cut|cuts|reach|reaches|kill|kills|remain|remains|suggest|suggests|raise|raises|pass|passes|sell|sells|sold|require|requires|report|reports|decide|decides|pull|pulls|bloom|blooms|bloomed|wear|wears|wore|worn|visit|visited|visits|communicate|communicates|protect|protects|exercise|exercises|eat|eats|ate|drink|drinks|drank|sleep|sleeps|slept|sing|sings|sang|swim|swims|swam|teach|teaches|taught|fly|flies|flew|shine|shines|shone|smile|smiles|smiled|cry|cries|cried|laugh|laughs|laughed|cook|cooks|cooked|clean|cleans|cleaned|wash|washes|washed|drive|drives|drove|ride|rides|rode)\b/i;

  const hasFiniteVerb = finiteVerbsRegex.test(correctedText);
  if (!hasFiniteVerb) {
    grammarScore -= 10;
    missingMainVerbPenaltyApplied = true;
  }

  // 3-2. 주어-동사 수일치 (Subject-Verb Agreement) 검사
  const svaRules = [
    {
      pattern: /\bI\s+(is|are|was|has|does)\b/g,
      fix: (m, v) => `I ${v === "is" || v === "are" ? "am" : v === "has" ? "have" : v === "does" ? "do" : "was"}`,
      desc: "주어 'I' 뒤에는 'am'(현재) 또는 'have/do'를 사용해야 합니다."
    },
    {
      pattern: /\b(he|she|it)\s+(are|am|were|have|do|want|like|love|need|help|bloom|go|run|look)\b/gi,
      fix: (m, subj, v) => {
        const vl = v.toLowerCase();
        const map = {
          are: "is",
          am: "is",
          were: "was",
          have: "has",
          do: "does",
          want: "wants",
          like: "likes",
          love: "loves",
          need: "needs",
          help: "helps",
          bloom: "blooms",
          go: "goes",
          run: "runs",
          look: "looks"
        };
        return `${subj} ${map[vl] || v}`;
      },
      desc: "3인칭 단수 주어(he/she/it) 뒤에는 단수 동사(is/was/has/does 또는 동사원형+s/es)를 써야 합니다."
    },
    {
      pattern: /\b(they|we|you)\s+(is|was|has|does|wants|likes|loves|helps|goes|blooms|runs|looks)\b/gi,
      fix: (m, subj, v) => {
        const vl = v.toLowerCase();
        const map = {
          is: "are",
          was: "were",
          has: "have",
          does: "do",
          wants: "want",
          likes: "like",
          loves: "love",
          helps: "help",
          goes: "go",
          blooms: "bloom",
          runs: "run",
          looks: "look"
        };
        return `${subj} ${map[vl] || v}`;
      },
      desc: "복수 주어(we/you/they) 뒤에는 복수 동사(are/were/have/do 또는 동사원형)를 써야 합니다."
    },
    {
      // 일반 단수 명사 주어(예: Tax, Water, Money, The building 등 -s로 끝나지 않는 단수 명사) + 복수 동사(are/were/have/do) 수일치 오류 검사
      pattern: /^(?:(The|This|That|My|Your|His|Her|Our|Their|A|An)\s+)?([A-Za-z]+)\s+(are|were|have|do)\b/i,
      check: (m, det, noun) => {
        const nl = (noun || "").toLowerCase();
        const pluralExceptions = new Set([
          "you", "we", "they", "people", "children", "men", "women", "teeth", "feet", "mice",
          "police", "cattle", "both", "many", "few", "several", "these", "those",
          "there", "here", "what", "how", "where", "when", "why", "who"
        ]);
        if (pluralExceptions.has(nl)) return false;
        if (nl.endsWith("s") && !nl.endsWith("ss") && !nl.endsWith("us") && nl !== "news") return false;
        return true;
      },
      fix: (m, det, noun, v) => {
        const vl = v.toLowerCase();
        const prefix = det ? `${det} ${noun}` : noun;
        const map = { are: "is", were: "was", have: "has", do: "does" };
        return `${prefix} ${map[vl] || v}`;
      },
      desc: "단수 명사 주어 뒤에는 복수 동사(are/were/have/do)를 쓸 수 없습니다. 주어를 복수형(-s/es)으로 쓰거나 단수 동사(is/was/has/does)로 일치시켜야 합니다."
    },
    {
      // be동사 + 일반동사 원형 이중동사 오류 (단, 'be like ~ (~와 같다)'에서 like는 전치사이므로 제외!)
      pattern: /\b(am|is|are|was|were)\s+(love|want|need|know|have|go|come|bloom|help|learn|think|run|pay)\b/gi,
      fix: (m, beV, mainV) => mainV,
      desc: "[이중 동사 오류] be동사(am/is/are)와 일반동사 원형을 나란히 함께 쓸 수 없습니다. 일반동사만 단독으로 사용하세요."
    },
    {
      pattern: /\b(can|could|will|would|should|must|may|to)\s+([a-z]+(s|ed|ing))\b/gi,
      check: (m) => !/\bto\s+(bed|morning|evening|spring|feeling|something|nothing|everything|anything|building|painting|reading|school|work)\b/i.test(m),
      fix: (m, aux, verb) => {
        const base = verb
          .replace(/ing$/i, "")
          .replace(/ed$/i, "")
          .replace(/es$/i, "")
          .replace(/s$/i, "");
        return `${aux} ${base}`;
      },
      desc: "조동사(can/will/should 등)나 to부정사(to) 뒤에는 반드시 '동사원형'이 와야 합니다."
    },
    {
      pattern: /\ba\s+([aeiou][a-z]+)\b/gi,
      check: (m, word) => !/^(university|uniform|unique|useful|user|european|one)\b/i.test(word),
      fix: (m, word) => `an ${word}`,
      desc: "모음 소리(a, e, i, o, u)로 시작하는 단어 앞에는 부정관사 'a' 대신 'an'을 씁니다."
    },
    {
      pattern: /\ban\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi,
      check: (m, word) => !/^(hour|honest|honor)\b/i.test(word),
      fix: (m, word) => `a ${word}`,
      desc: "자음 소리로 시작하는 단어 앞에는 부정관사 'an' 대신 'a'를 씁니다."
    }
  ];

  // ★ 중복 감점 방지(Deduplication)용 토큰 집합:
  // 내장 수일치/어순/관사/단복수 규칙에서 이미 감점한 단어는 외부 LanguageTool 엔진에서 이중 감점하지 않음!
  const penalizedTokens = new Set();
  const markTokensPenalized = (str) => {
    const toks = (String(str || "").toLowerCase().match(/[a-z]+/g) || []);
    toks.forEach((t) => {
      penalizedTokens.add(t);
      penalizedTokens.add(normalizeEnWord(t));
    });
  };

  for (const rule of svaRules) {
    const match = correctedText.match(rule.pattern);
    if (match) {
      if (
        rule.check &&
        !correctedText
          .replace(rule.pattern, (m, g1, g2) => (rule.check(m, g1, g2) ? "HIT" : m))
          .includes("HIT")
      ) {
        continue;
      }
      const before = correctedText;
      correctedText = correctedText.replace(rule.pattern, rule.fix);
      if (before !== correctedText) {
        grammarScore -= Math.round(6 * strictMeta.penaltyMultiplier);
        markTokensPenalized(match[0]);
        grammarFeedback.push({
          original: match[0],
          corrected: correctedText,
          explanation: `[문법 교정] ${rule.desc}`
        });
      }
    }
  }

  // ============================================================================
  // [2영역] 핵심 목표 표현/구문 구조 정밀 검사 (30점 만점)
  // ============================================================================
  let targetScore = 30;
  let targetExpressionUsed = true;
  let generatedAlternativeModel = "";
  let incompleteSentenceStructure = false;
  const tgLower = (targetGrammar || "").toLowerCase();

  // 감탄문 과제 여부: 목표문법에 What/How/감탄이 있거나, 학생이 What/How 감탄문으로 작성한 경우
  const isExclamatoryCheck =
    tgLower.includes("what") ||
    tgLower.includes("how") ||
    tgLower.includes("감탄") ||
    (/^(what|how)\b/i.test(correctedText) && correctedText.endsWith("!"));

  if (mode === "korean_prompt" && (isExclamatoryCheck || (targetGrammar && targetGrammar.trim()))) {
    if (isExclamatoryCheck) {
      const startsWithWhat = /^what\b/i.test(correctedText);
      const startsWithHow = /^how\b/i.test(correctedText);

      // 교사가 What만 지정했는데 How를 썼거나, How만 지정했는데 What을 쓴 경우 체크
      const teacherOnlyWhat = tgLower.includes("what") && !tgLower.includes("how");
      const teacherOnlyHow = tgLower.includes("how") && !tgLower.includes("what");

      if (!startsWithWhat && !startsWithHow) {
        targetExpressionUsed = false;
        targetScore = 5;
        grammarFeedback.push({
          original: correctedText,
          corrected:
            referenceAnswer ||
            "What + a/an + 형용사 + 명사 + 주어 + 동사! / How + 형용사 + 주어 + 동사!",
          explanation: `[핵심 구문 누락] 감탄문 목표 표현(What 또는 How)으로 문장을 시작해야 합니다.`
        });
      } else if (teacherOnlyWhat && startsWithHow) {
        targetExpressionUsed = false;
        targetScore -= 12;
        grammarFeedback.push({
          original: correctedText,
          corrected: referenceAnswer || "What a/an + 형용사 + 명사 + 주어 + 동사!",
          explanation: `[목표 표현 불일치] 이번 과제의 목표 표현은 'What' 감탄문입니다. 'What a/an + 형용사 + 명사 + 주어 + 동사!' 형태로 작성해 보세요.`
        });
      } else if (teacherOnlyHow && startsWithWhat) {
        targetExpressionUsed = false;
        targetScore -= 12;
        grammarFeedback.push({
          original: correctedText,
          corrected: referenceAnswer || "How + 형용사/부사 + 주어 + 동사!",
          explanation: `[목표 표현 불일치] 이번 과제의 목표 표현은 'How' 감탄문입니다. 'How + 형용사/부사 + 주어 + 동사!' 형태로 작성해 보세요.`
        });
      }

      if (startsWithHow) {
        // ★ How 감탄문 정밀 구문 검사 (How + 형용사/부사 + 주어 + 동사!)
        // 오류 1: How tall the building! 처럼 주어(the building / this flower / it / he / she 등)만 쓰고 끝에 동사(is/are)를 빠뜨린 경우!
        const howMissingVerbMatch = correctedText.match(
          /^How\s+([a-z]+)\s+((?:the|this|that|my|your|his|her|our|their)\s+([a-z]+)|(it|he|she|they|we|you|i))\s*[.!?]*$/i
        );
        // 오류 2: How a beautiful flower it is! 처럼 How 뒤에 a/an + 형용사 + 명사를 쓴 경우
        const howWithArticleNounMatch = correctedText.match(
          /^How\s+(?:a|an)\s+([a-z]+)\s+([a-z]+)(?:\s+(it|this|that|he|she)\s+(is|was))?\s*[.!?]*$/i
        );
        // 오류 3: How tall building! 또는 How tall building it is! 처럼 관사(the)도 없이 형용사+명사를 바로 쓴 경우
        const howBareNounMatch = correctedText.match(
          /^How\s+([a-z]+)\s+(?!it\b|he\b|she\b|they\b|we\b|you\b|i\b|the\b|this\b|that\b|my\b|your\b)([a-z]+)(?:\s+(it|this|that)\s+(is|was))?\s*[.!?]*$/i
        );
        // 오류 4: How tall is the building! 처럼 의문문 어순(동사+주어 도치)으로 쓴 경우
        const howInvertedMatch = correctedText.match(
          /^How\s+([a-z]+)\s+(is|are|was|were)\s+((?:the|this|that|my|your|his|her|our|their)\s+[a-z]+|it|he|she|they|we|you)\s*[.!?]*$/i
        );

        if (howMissingVerbMatch) {
          const adj = howMissingVerbMatch[1];
          const fullSubj = howMissingVerbMatch[2];
          const headNoun = (howMissingVerbMatch[3] || howMissingVerbMatch[4] || "").toLowerCase();
          const isPlural =
            headNoun === "they" ||
            headNoun === "we" ||
            headNoun === "you" ||
            (headNoun.endsWith("s") && !headNoun.endsWith("ss"));
          const expectedVerb = headNoun === "i" ? "am" : isPlural ? "are" : "is";
          const art = /^[aeiou]/i.test(adj) ? "an" : "a";
          const fixedHow = `How ${adj} ${fullSubj} ${expectedVerb}!`;
          const fixedWhat =
            howMissingVerbMatch[3] && !isPlural
              ? `What ${art} ${adj} ${howMissingVerbMatch[3]} it is!`
              : "";

          targetScore -= 12;
          incompleteSentenceStructure = true;
          if (!missingMainVerbPenaltyApplied) {
            grammarScore -= 10;
            missingMainVerbPenaltyApplied = true;
          }

          grammarFeedback.push({
            original: correctedText,
            corrected: fixedWhat ? `${fixedHow} (또는 ${fixedWhat})` : fixedHow,
            explanation: `[How 감탄문 동사(${expectedVerb}) 누락] 'How + 형용사(${adj}) + 주어(${fullSubj}) + 동사(${expectedVerb})!' 어순에서 주어 뒤에 동사 '${expectedVerb}'가 빠졌습니다! 영어 문장은 반드시 동사가 있어야 완성됩니다.`
          });
          correctedText = fixedHow;
          if (fixedWhat) {
            generatedAlternativeModel = `${fixedHow}  (💡 What 감탄문 변환: ${fixedWhat})`;
          }
        } else if (howWithArticleNounMatch) {
          const adj = howWithArticleNounMatch[1];
          const noun = howWithArticleNounMatch[2];
          const v = howWithArticleNounMatch[4] || "is";
          const art = /^[aeiou]/i.test(adj) ? "an" : "a";
          const fixedHow = `How ${adj} the ${noun} ${v}!`;
          const fixedWhat = `What ${art} ${adj} ${noun} it ${v}!`;

          targetScore -= 12;
          grammarScore -= 6;
          incompleteSentenceStructure = true;
          grammarFeedback.push({
            original: correctedText,
            corrected: `${fixedHow} (또는 ${fixedWhat})`,
            explanation:
              "[How vs What 감탄문 혼동 교정] 'How' 뒤에는 'a/an + 형용사 + 명사'가 올 수 없습니다! 'How + 형용사 + the + 명사 + 동사!' 또는 'What + a/an + 형용사 + 명사 + 주어 + 동사!'로 써야 합니다."
          });
          correctedText = fixedHow;
          generatedAlternativeModel = `${fixedHow}  (💡 What 감탄문 변환: ${fixedWhat})`;
        } else if (howInvertedMatch) {
          const adj = howInvertedMatch[1];
          const v = howInvertedMatch[2];
          const subj = howInvertedMatch[3];
          const fixedHow = `How ${adj} ${subj} ${v}!`;

          targetScore -= 10;
          grammarScore -= 6;
          grammarFeedback.push({
            original: correctedText,
            corrected: fixedHow,
            explanation: `[감탄문 어순 도치 교정] 감탄문 끝은 의문문 어순(${v} ${subj})이 아니라 평서문 어순(${subj} ${v})으로 써야 합니다!`
          });
          correctedText = fixedHow;
        } else if (howBareNounMatch && !finiteVerbsRegex.test(howBareNounMatch[2])) {
          const adj = howBareNounMatch[1];
          const noun = howBareNounMatch[2];
          const art = /^[aeiou]/i.test(adj) ? "an" : "a";
          const fixedHow = `How ${adj} the ${noun} is!`;
          const fixedWhat = `What ${art} ${adj} ${noun} it is!`;

          targetScore -= 12;
          grammarScore -= 8;
          incompleteSentenceStructure = true;
          grammarFeedback.push({
            original: correctedText,
            corrected: `${fixedHow} (또는 ${fixedWhat})`,
            explanation: `[감탄문 구조 오류] 'How ${adj} ${noun}' 형태는 문법에 맞지 않습니다. 'How ${adj} the ${noun} is!' 또는 'What ${art} ${adj} ${noun} it is!'로 작성해야 합니다.`
          });
          correctedText = fixedHow;
          generatedAlternativeModel = `${fixedHow}  (💡 What 감탄문 변환: ${fixedWhat})`;
        } else {
          // 올바른 How 감탄문인지 최종 확인 (How + 형용사/부사 + 주어 + 동사!)
          const howFullMatch = correctedText.match(
            /^How\s+([a-z]+)\s+(?:the|this|that|my|your|his|her|our|their)\s+([a-z]+)\s+(is|are|was|were)\s*[.!?]*$/i
          );
          if (howFullMatch) {
            const adj = howFullMatch[1].toLowerCase();
            const noun = howFullMatch[2].toLowerCase();
            const v = howFullMatch[3].toLowerCase();
            const art = /^[aeiou]/i.test(adj) ? "an" : "a";
            if (!noun.endsWith("s")) {
              generatedAlternativeModel = `${correctedText}  (💡 What 감탄문 변환: What ${art} ${adj} ${noun} it ${v === "was" ? "was" : "is"}!)`;
            }
          } else if (/^How\s+[a-z]+\s*[.!?]*$/i.test(correctedText) && (koreanPrompt || "").trim().split(/\s+/).length >= 3) {
            // 제시문에는 주어가 있는데 How tall! 처럼 2단어로만 줄여 쓴 경우
            targetScore -= 8;
            incompleteSentenceStructure = true;
            grammarFeedback.push({
              original: correctedText,
              corrected: referenceAnswer || `${correctedText.replace(/[.!?]+$/, "")} it is!`,
              explanation:
                "[주어+동사 생략 주의] 한국어 제시문의 주어와 동사까지 생략하지 않고 'How + 형용사 + 주어 + 동사!'로 완전하게 영작해야 만점을 받을 수 있습니다."
            });
          }
        }
      } else if (startsWithWhat) {
        // ★ What 감탄문 정밀 구문 검사 (What + a/an + 형용사 + 명사 + 주어 + 동사!)
        // 오류 1: What tall the building is! 또는 What tall it is! 처럼 명사 없이 What을 쓴 경우
        const whatInsteadOfHowMatch = correctedText.match(
          /^What\s+([a-z]+)\s+((?:the|this|that|my|your)\s+[a-z]+|it|he|she|they)\s+(is|are|was|were)\s*[.!?]*$/i
        );
        // 오류 2: What a tall building it! 처럼 끝에 주어(it/they/this/that)만 쓰고 동사(is/are)를 빠뜨린 경우
        const whatMissingVerbMatch = correctedText.match(
          /^What\s+(?:(a|an)\s+)?([a-z]+)\s+([a-z]+)\s+(it|they|this|that)\s*[.!?]*$/i
        );
        // 오류 3: What a beautiful flower is it! 처럼 의문문 어순(is it)으로 쓴 경우
        const whatInvertedMatch = /\b(is|are|was|were)\s+(it|they|this|that|he|she)\s*[.!?]*$/i.test(
          correctedText
        );
        // 오류 4: What beautiful flower it is! 처럼 단수 가산명사 앞 관사 a/an을 빠뜨린 경우
        const whatNoArticleMatch = correctedText.match(
          /^What\s+(?!a\b|an\b)([a-z]+)\s+([a-z]+)(?:\s+(it|this|that|he|she)\s+(is|was))?\s*[.!?]*$/i
        );

        if (whatInsteadOfHowMatch) {
          const adj = whatInsteadOfHowMatch[1];
          const subj = whatInsteadOfHowMatch[2];
          const v = whatInsteadOfHowMatch[3];
          const fixedHow = `How ${adj} ${subj} ${v}!`;

          targetScore -= 14;
          grammarScore -= 6;
          incompleteSentenceStructure = true;
          grammarFeedback.push({
            original: correctedText,
            corrected: fixedHow,
            explanation: `[What vs How 감탄문 선택 오류] 'a/an + 형용사 + 명사'가 아니라 형용사(${adj}) 뒤에 바로 주어(${subj})가 올 때는 'What'이 아니라 'How'를 써야 합니다!`
          });
          correctedText = fixedHow;
        } else {
          if (whatMissingVerbMatch) {
            const art = whatMissingVerbMatch[1] || (/^[aeiou]/i.test(whatMissingVerbMatch[2]) ? "an" : "a");
            const adj = whatMissingVerbMatch[2];
            const noun = whatMissingVerbMatch[3];
            const pron = whatMissingVerbMatch[4].toLowerCase();
            const v = pron === "they" ? "are" : "is";
            const fixedWhat = `What ${art} ${adj} ${noun} ${pron} ${v}!`;

            targetScore -= 12;
            incompleteSentenceStructure = true;
            if (!missingMainVerbPenaltyApplied) {
              grammarScore -= 10;
              missingMainVerbPenaltyApplied = true;
            }
            grammarFeedback.push({
              original: correctedText,
              corrected: fixedWhat,
              explanation: `[What 감탄문 동사(${v}) 누락] 주어 '${pron}' 뒤에 동사 '${v}'가 빠졌습니다! 'What + a/an + 형용사 + 명사 + 주어 + 동사!' 어순을 완성해 주세요.`
            });
            correctedText = fixedWhat;
          } else if (whatInvertedMatch) {
            targetScore -= 10;
            grammarScore -= 6;
            const fixedOrder = correctedText.replace(
              /\b(is|are|was|were)\s+(it|they|this|that|he|she)(\s*[.!?]*)$/i,
              "$2 $1$3"
            );
            grammarFeedback.push({
              original: correctedText,
              corrected: fixedOrder,
              explanation:
                "[감탄문 어순 교정] 감탄문 끝의 주어+동사는 의문문 어순(is it)이 아니라 평서문 어순(it is)으로 써야 합니다!"
            });
            correctedText = fixedOrder;
          } else if (whatNoArticleMatch) {
            const adj = whatNoArticleMatch[1];
            const noun = whatNoArticleMatch[2];
            const hasSubjVerb = Boolean(whatNoArticleMatch[3]);
            const isPluralOrUncountable =
              (noun.endsWith("s") && !noun.endsWith("ss")) ||
              /^(weather|music|water|news|information|advice|time|food|money|air|fun)$/i.test(noun);

            if (!isPluralOrUncountable) {
              targetScore -= 10;
              grammarScore -= 4;
              const article = /^[aeiou]/i.test(adj) ? "an" : "a";
              let fixedArticle = correctedText.replace(/^What\s+/i, `What ${article} `);
              if (!hasSubjVerb) {
                targetScore -= 6;
                incompleteSentenceStructure = true;
                fixedArticle = fixedArticle.replace(/[.!?]*$/, " it is!");
              }
              grammarFeedback.push({
                original: correctedText,
                corrected: fixedArticle,
                explanation: `[What 감탄문 관사(${article}) 누락] 셀 수 있는 단수 명사(${noun})가 있는 What 감탄문은 'What + ${article} + 형용사(${adj}) + 명사(${noun}) + it is!' 어순으로 써야 합니다.`
              });
              correctedText = fixedArticle;
            }
          } else if (
            /^What\s+(?:a|an)\s+([a-z]+)\s+([a-z]+)\s*[.!?]*$/i.test(correctedText) &&
            (koreanPrompt || "").trim().split(/\s+/).length >= 3
          ) {
            // What a tall building! 처럼 끝에 it is를 생략한 경우: 경미한 감점(-6점) 및 완전한 문장 안내
            targetScore -= 6;
            incompleteSentenceStructure = true;
            const fullWhat = correctedText.replace(/[.!?]*$/, " it is!");
            grammarFeedback.push({
              original: correctedText,
              corrected: fullWhat,
              explanation:
                "[주어+동사(it is) 보완 권장] 구어체에서는 'it is'를 생략하기도 하지만, 서술형 영작 평가에서는 'What + a/an + 형용사 + 명사 + it is!'까지 완전한 문장으로 쓰는 것이 정확합니다."
            });
            correctedText = fullWhat;
          }

          // 완벽한 What 감탄문인 경우 How 변환 모범답안도 함께 생성
          const whatFullMatch = correctedText.match(
            /^What\s+(?:a|an)\s+([a-z]+)\s+([a-z]+)(?:\s+it\s+is)?\s*[.!?]*$/i
          );
          if (whatFullMatch) {
            const adj = whatFullMatch[1].toLowerCase();
            const noun = whatFullMatch[2].toLowerCase();
            generatedAlternativeModel = `${correctedText}  (💡 How 감탄문 변환: How ${adj} the ${noun} is!)`;
          }
        }
      }
    } else if (/it\s*~?\s*to|가주어/i.test(targetGrammar)) {
      const hasItIsTo = /\bit\s+(is|was)\s+[a-z]+(?:\s+(?:for|of)\s+[a-z]+)?\s+to\s+[a-z]+/i.test(
        correctedText
      );
      if (!hasItIsTo) {
        targetExpressionUsed = /\bit\b/i.test(correctedText) && /\bto\b/i.test(correctedText);
        targetScore = targetExpressionUsed ? 18 : 6;
        grammarFeedback.push({
          original: correctedText,
          corrected: referenceAnswer || "It is + 형용사 + to + 동사원형 ~",
          explanation:
            "[가주어-진주어 구문 점검] 'It is + 형용사 + to + 동사원형(~하는 것은 …하다)' 어순이 정확히 이어지는지 확인해 보세요."
        });
      }
    } else if (/so\s+that/i.test(targetGrammar)) {
      const hasSoThatModal = /\bso\s+that\s+[a-z]+\s+(can|could|will|would|may|might)\s+[a-z]+/i.test(
        correctedText
      );
      const hasSoThat = /\bso\s+that\b/i.test(correctedText);
      if (!hasSoThat) {
        targetExpressionUsed = false;
        targetScore = 6;
        grammarFeedback.push({
          original: correctedText,
          corrected: referenceAnswer || "~ so that + 주어 + can + 동사원형",
          explanation: `[핵심 구문 누락] 목적을 나타내는 'so that + 주어 + can + 동사원형(~할 수 있도록)' 표현을 사용해 보세요.`
        });
      } else if (!hasSoThatModal) {
        targetScore = 20;
        grammarFeedback.push({
          original: correctedText,
          corrected: referenceAnswer || correctedText,
          explanation:
            "[so that 구문 보완] 'so that' 뒤에는 '주어 + can(또는 could/will) + 동사원형'이 오면 훨씬 자연스러운 문장이 됩니다."
        });
      }
    } else {
      // ★ 복수 정답 후보(또는 목적격 관계대명사 생략 후보)와 1:1 매칭 여부 먼저 확인
      const candidateListForTarget = parseAndExpandReferenceAnswers(
        referenceAnswer && referenceAnswer.trim() ? referenceAnswer : independentModelAnswer
      );
      const bestTargetCand = findBestMatchingReferenceCandidate(correctedText, candidateListForTarget);

      // 목적격 관계대명사 생략 구조(명사 + 대명사주어 I/we/you/they/he/she + 동사)인지 확인
      const hasOmittedObjRelClause =
        /\b[a-z]+\s+(i|we|you|they|he|she)\s+(need|needs|needed|want|wants|wanted|like|likes|liked|love|loves|loved|know|knows|knew|have|has|had|see|saw|met|meet|buy|bought|made|make|use|used)\b/i.test(
          correctedText
        );

      if (bestTargetCand && bestTargetCand.isExactMatch) {
        // 복수 정답 후보 중 하나와 정확히 일치하면 목표 구문 100% 달성!
        targetExpressionUsed = true;
        targetScore = 30;
      } else {
        const englishKeywords = targetGrammar
          .toLowerCase()
          .replace(/\([^)]*\)/g, "")
          .split(/[,/|~]+/)
          .map((k) => k.trim())
          .filter((k) => /^[a-z\s']+$/i.test(k) && k.length >= 2);

        if (englishKeywords.length > 0) {
          targetExpressionUsed =
            englishKeywords.some((kw) => correctedText.toLowerCase().includes(kw)) ||
            ((/관계대명사|목적격|which|that|whom/i.test(targetGrammar) ||
              candidateListForTarget.length > 1) &&
              hasOmittedObjRelClause);

          if (!targetExpressionUsed) {
            targetScore = 8;
            grammarFeedback.push({
              original: `목표 표현(${targetGrammar}) 미사용`,
              corrected: independentModelAnswer || referenceAnswer || correctedText,
              explanation: `[목표 표현 누락] 선생님이 지정하신 핵심 표현("${targetGrammar}")을 포함하여 영작해 보세요!`
            });
          }
        }
      }
    }
  }

  // 만약 일반 문장에서도 본동사가 누락되었고 아직 동사 누락 피드백이 들어가지 않았다면 추가
  if (!hasFiniteVerb && grammarFeedback.length === 0) {
    grammarFeedback.push({
      original: safeContent,
      corrected: independentModelAnswer || `${correctedText.replace(/[.!?]+$/, "")} is ...`,
      explanation:
        "[동사(Verb) 누락 오류] 영어 문장에는 주어의 상태나 동작을 나타내는 동사(is/are/일반동사 등)가 반드시 포함되어야 합니다."
    });
  }

  targetScore = Math.max(0, targetScore);
  grammarScore = Math.max(0, grammarScore);

  // ============================================================================
  // [1영역] 한국어 제시문 의미 전달 정확도 산출 (40점 만점 / 의미 전달력 0~100%)
  // ★ 복수 정답(/, |, ;, 줄바꿈 구분) 지원: 전체 합산이 아니라 개별 정답 후보들과 1:1 비교 후
  //    학생 답안과 가장 일치율이 높은 정답 후보(bestCandidate)를 기준으로 채점합니다!
  // ============================================================================
  let meaningAccuracy = 100;
  let meaningScore = 40;
  const missingConceptLabels = [];
  const effectiveRef =
    referenceAnswer && referenceAnswer.trim()
      ? referenceAnswer.trim()
      : independentModelAnswer || (autoTranslatedRef || "").trim();

  const candidateAnswers = parseAndExpandReferenceAnswers(effectiveRef);
  const bestCandidateMatch = findBestMatchingReferenceCandidate(
    safeContent,
    candidateAnswers,
    strictness
  );

  if (mode === "korean_prompt") {
    // 만약 복수 정답 후보 중 어느 하나와 정확히 일치한다면 의미 전달력 100%(40점 만점) 즉시 부여!
    if (bestCandidateMatch && bestCandidateMatch.isExactMatch) {
      meaningAccuracy = 100;
      meaningScore = 40;
    } else {
      // 교정 후 문장이 아니라 학생이 실제 작성한 원문(safeContent) 기준으로 의미 전달력 평가!
      const studentTokens = new Set(
        (safeContent.toLowerCase().match(/[a-z]+/g) || []).map(normalizeEnWord)
      );
      const studentRawLower = safeContent.toLowerCase();

      // 1-A. 한국어 제시문(koreanPrompt)에서 핵심 개념 추출 후 학생 영작문 포함 여부 검사
      const matchedKoreanConcepts = [];
      if (koreanPrompt && koreanPrompt.trim()) {
        for (const item of KO_EN_CONCEPT_DICT) {
          if (item.ko.some((k) => koreanPrompt.includes(k))) {
            matchedKoreanConcepts.push(item);
          }
        }
      }

      let koConceptHit = 0;
      for (const concept of matchedKoreanConcepts) {
        const hit = concept.en.some(
          (enWord) =>
            studentRawLower.includes(enWord) || studentTokens.has(normalizeEnWord(enWord))
        );
        if (hit) {
          koConceptHit += 1;
        } else {
          missingConceptLabels.push(concept.label);
        }
      }

      // 1-B. 복수 정답 후보들 중 학생 문장과 가장 가까운 후보(bestCandidateMatch)의 핵심 단어 일치율 사용!
      const refRatio = bestCandidateMatch ? bestCandidateMatch.refRatio : null;
      const missingRefWords = bestCandidateMatch ? bestCandidateMatch.missingRefWords : [];

      const koRatio =
        matchedKoreanConcepts.length > 0 ? koConceptHit / matchedKoreanConcepts.length : null;

      if (refRatio !== null && koRatio !== null) {
        const combinedRatio = Math.max(refRatio, koRatio * 0.85 + refRatio * 0.15);
        meaningAccuracy = Math.round(combinedRatio * 100);
      } else if (koRatio !== null) {
        meaningAccuracy = Math.round(koRatio * 100);
      } else if (refRatio !== null) {
        meaningAccuracy = Math.round(refRatio * 100);
      } else {
        const expectedMinWords = Math.max(3, Math.round((koreanPrompt || "").split(/\s+/).length * 0.9));
        const lengthRatio = Math.min(1, wordCount / expectedMinWords);
        meaningAccuracy = Math.round(
          (lengthRatio * 0.5 + (targetScore / 30) * 0.3 + (grammarScore / 20) * 0.2) * 100
        );
      }

      if (meaningAccuracy < 25) {
        targetScore = Math.min(targetScore, 8);
        grammarScore = Math.min(grammarScore, 10);
      }

      if (!hasFiniteVerb || incompleteSentenceStructure) {
        meaningAccuracy = Math.max(0, meaningAccuracy - 15);
      }

      // ★ 1-C. 모범 답안 후보(bestCandidateMatch) 대비 어순 도치, 관사 누락, 단수·복수 불일치, 구문 블록(Chunk) 정밀 감점!
      if (bestCandidateMatch && !bestCandidateMatch.isExactMatch) {
        const {
          bestCandidate,
          wordOrderInversions = [],
          missingArticles = [],
          numberMismatches = [],
          chunkAnalysis = []
        } = bestCandidateMatch;

        // (1) 어순 뒤바뀜 (예: "money like" -> "like money")
        if (wordOrderInversions.length > 0) {
          grammarScore = Math.max(0, grammarScore - Math.round(8 * strictMeta.penaltyMultiplier));
          targetScore = Math.max(0, targetScore - Math.round(6 * strictMeta.penaltyMultiplier));
          meaningAccuracy = Math.max(0, meaningAccuracy - Math.round(10 * strictMeta.penaltyMultiplier));
          wordOrderInversions.forEach((inv) => {
            markTokensPenalized(inv.wrong);
            markTokensPenalized(inv.right);
          });
          const invDesc = wordOrderInversions
            .map((inv) => `'${inv.wrong}' → '${inv.right}'`)
            .join(", ");
          grammarFeedback.push({
            original: wordOrderInversions.map((i) => i.wrong).join(", "),
            corrected: bestCandidate,
            explanation: `[어순 오류 교정] 영어 어순이 뒤바뀌었습니다(${invDesc}). 전치사·수식어 어순을 모범 답안('${bestCandidate}')과 같이 바로잡아야 합니다.`
          });
          correctedText = bestCandidate;
        }

        // (2) 관사 누락 (예: "in piggy bank" -> "in a piggy bank")
        if (missingArticles.length > 0) {
          grammarScore = Math.max(0, grammarScore - Math.round(5 * strictMeta.penaltyMultiplier));
          meaningAccuracy = Math.max(0, meaningAccuracy - Math.round(4 * strictMeta.penaltyMultiplier));
          missingArticles.forEach((a) => {
            markTokensPenalized(a.wrong);
            markTokensPenalized(a.right);
          });
          const artDesc = missingArticles
            .map((a) => `'${a.wrong}' → '${a.right}'`)
            .join(", ");
          grammarFeedback.push({
            original: missingArticles.map((a) => a.wrong).join(", "),
            corrected: bestCandidate,
            explanation: `[관사(a/an/the) 누락 교정] 셀 수 있는 단수 명사 앞에 관사가 빠졌습니다(${artDesc}).`
          });
          correctedText = bestCandidate;
        }

        // (3) 단수·복수 형태 불일치 (예: "Tax are" -> "Taxes are")
        if (numberMismatches.length > 0) {
          grammarScore = Math.max(0, grammarScore - Math.round(6 * strictMeta.penaltyMultiplier));
          meaningAccuracy = Math.max(0, meaningAccuracy - Math.round(4 * strictMeta.penaltyMultiplier));
          numberMismatches.forEach((n) => {
            markTokensPenalized(n.wrong);
            markTokensPenalized(n.right);
          });
          const numDesc = numberMismatches
            .map((n) => `'${n.wrong}' → '${n.right}'`)
            .join(", ");
          grammarFeedback.push({
            original: numberMismatches.map((n) => n.wrong).join(", "),
            corrected: bestCandidate,
            explanation: `[단수·복수 수일치 교정] 문맥 및 동사와 어울리는 명사의 단수/복수 형태를 확인하세요(${numDesc}).`
          });
          correctedText = bestCandidate;
        }

        // (4) 구문 블록(Chunk Slot) 불일치 점검 (위 3가지 외에 구문 블록이 깨지거나 서술형 칼채점 모드에서 불일치하는 경우)
        const brokenChunks = chunkAnalysis.filter((c) => c.status !== "pass");
        if (
          brokenChunks.length > 0 &&
          wordOrderInversions.length === 0 &&
          missingArticles.length === 0 &&
          numberMismatches.length === 0
        ) {
          const chunkPenalty = Math.round(
            Math.min(10, brokenChunks.length * 4) * strictMeta.penaltyMultiplier
          );
          grammarScore = Math.max(0, Math.min(16, grammarScore - chunkPenalty));
          meaningAccuracy = Math.max(0, Math.min(92, meaningAccuracy - chunkPenalty));
          const brokenListStr = brokenChunks.map((c) => `'${c.chunk}'`).join(", ");
          grammarFeedback.push({
            original: safeContent,
            corrected: bestCandidate,
            explanation: `[구문 블록(Chunk) 어순·표현 점검] 모범 답안의 핵심 구문 블록(${brokenListStr})과 어순 또는 전치사·관사 형태에 차이가 있습니다.`
          });
          correctedText = bestCandidate;
        } else if (
          wordOrderInversions.length === 0 &&
          missingArticles.length === 0 &&
          numberMismatches.length === 0 &&
          missingConceptLabels.length === 0 &&
          missingRefWords.length === 0
        ) {
          grammarScore = Math.min(grammarScore, strictness === "strict" ? 14 : 16);
          meaningAccuracy = Math.min(meaningAccuracy, strictness === "strict" ? 88 : 92);
          grammarFeedback.push({
            original: safeContent,
            corrected: bestCandidate,
            explanation: `[모범답안 정밀 대조] 핵심 단어는 포함되었으나 표준 모범 답안('${bestCandidate}')과 세부 표현에 차이가 있습니다.`
          });
          correctedText = bestCandidate;
        }
      }

      if (missingConceptLabels.length > 0) {
        grammarFeedback.push({
          original: `의미 누락/불일치 (${missingConceptLabels.join(", ")})`,
          corrected: bestCandidateMatch?.bestCandidate || independentModelAnswer,
          explanation: `[의미 전달 점검] 한국어 제시문에 있는 ${missingConceptLabels.join(
            ", "
          )}의 의미가 영어 문장에서 확인되지 않았습니다.`
        });
      } else if (missingRefWords.length > 0 && meaningAccuracy < 85) {
        grammarFeedback.push({
          original: safeContent,
          corrected: bestCandidateMatch?.bestCandidate || independentModelAnswer,
          explanation: `[모범답안 비교] 가장 가까운 정답('${
            bestCandidateMatch?.bestCandidate || independentModelAnswer
          }') 대비 핵심 어휘(${missingRefWords.slice(0, 4).join(", ")})를 보완해 보세요.`
        });
      }

      meaningAccuracy = Math.min(100, Math.max(0, meaningAccuracy));
      meaningScore = Math.round((meaningAccuracy / 100) * 40);
    }
  } else {
    meaningAccuracy = Math.min(100, Math.max(50, 70 + Math.min(30, wordCount)));
    if (!hasFiniteVerb) meaningAccuracy = Math.max(30, meaningAccuracy - 20);
    meaningScore = Math.round((meaningAccuracy / 100) * 40);
  }

  // ============================================================================
  // [방법 ④: LanguageTool 외부 영문법·철자 엔진 이중 검증 (중복 감점 방지 & correctedText 즉시 교정 반영!)]
  // 이미 내장 엔진(수일치/어순/관사/단복수/대소문자)이 감점한 단어는 절대 중복 감점하지 않으며,
  // 발견된 철자·어휘·문법 오류(예: populer -> popular, word -> world)를 correctedText와 1:1 비교표에 즉시 반영합니다!
  // ============================================================================
  let hasExternalSpellingOrGrammarError = false;
  if (Array.isArray(ltMatches) && ltMatches.length > 0) {
    let ltAddedCount = 0;
    for (const m of ltMatches) {
      if (ltAddedCount >= 5) break;
      const ruleId = String(m.rule?.id || "").toUpperCase();
      // 대소문자/공백 등 이미 4영역(mechanics)에서 처리한 규칙은 건너뜀
      if (
        ruleId.includes("UPPERCASE") ||
        ruleId.includes("WHITESPACE") ||
        ruleId.includes("PUNCTUATION")
      ) {
        continue;
      }
      const badSpan = safeContent.slice(m.offset, m.offset + m.length).trim();
      const replacement = (m.replacements?.[0]?.value || "").trim();
      if (!badSpan || !replacement || badSpan.toLowerCase() === replacement.toLowerCase()) {
        continue;
      }
      // 만약 교사 모범 답안에 해당 표현이 그대로 들어있다면 오탐이므로 건너뜀
      if (
        bestCandidateMatch?.bestCandidate &&
        bestCandidateMatch.bestCandidate.toLowerCase().includes(badSpan.toLowerCase())
      ) {
        continue;
      }
      // 이미 내장 규칙에서 감점된 단어가 포함되어 있다면 중복 감점(Double-Penalty) 스킵!
      const spanWords = badSpan.toLowerCase().match(/[a-z]+/g) || [];
      const alreadyPenalized = spanWords.some(
        (w) => penalizedTokens.has(w) || penalizedTokens.has(normalizeEnWord(w))
      );
      if (alreadyPenalized) continue;

      markTokensPenalized(badSpan);
      ltAddedCount += 1;
      hasExternalSpellingOrGrammarError = true;
      if (bestCandidateMatch) {
        bestCandidateMatch.isExactMatch = false;
      }

      // ★ 학생 교정 문장(correctedText)에 철자/어휘 교정 사항을 실제로 치환 반영!
      const escapedBad = badSpan.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      correctedText = correctedText.replace(new RegExp(escapedBad, "i"), replacement);

      grammarScore = Math.max(0, grammarScore - Math.round(4 * strictMeta.penaltyMultiplier));
      meaningAccuracy = Math.max(0, meaningAccuracy - Math.round(3 * strictMeta.penaltyMultiplier));
      meaningScore = Math.round((meaningAccuracy / 100) * 40);

      grammarFeedback.push({
        original: badSpan,
        corrected: replacement,
        explanation: `[철자·영문법 정밀 교정] '${badSpan}' 표현을 '${replacement}'(으)로 고치면 철자·문법상 정확합니다. (${m.message})`
      });
    }
  }

  // ============================================================================
  // [방법 ①: Gemini AI 실시간 심층 첨삭 결합 (활성화 시)]
  // 내장 엔진의 엄격한 만점 게이트(isExactMatch)를 유지하면서 AI의 심층 설명과 교정을 결합합니다.
  // ============================================================================
  if (geminiResult && typeof geminiResult === "object") {
    if (Array.isArray(geminiResult.feedbackItems)) {
      for (const gf of geminiResult.feedbackItems.slice(0, 3)) {
        if (gf && gf.explanation) {
          if (
            gf.original &&
            gf.corrected &&
            gf.original.trim().toLowerCase() !== gf.corrected.trim().toLowerCase()
          ) {
            hasExternalSpellingOrGrammarError = true;
            if (bestCandidateMatch) bestCandidateMatch.isExactMatch = false;
            const escOrig = gf.original.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            if (new RegExp(escOrig, "i").test(correctedText)) {
              correctedText = correctedText.replace(new RegExp(escOrig, "i"), gf.corrected.trim());
            }
          }
          grammarFeedback.push({
            original: gf.original || safeContent,
            corrected: gf.corrected || bestCandidateMatch?.bestCandidate || correctedText,
            explanation: `🤖 [Gemini AI 심층 첨삭] ${gf.explanation}`
          });
        }
      }
    }
    if (
      typeof geminiResult.score === "number" &&
      !(bestCandidateMatch && bestCandidateMatch.isExactMatch)
    ) {
      const currentDetScore = meaningScore + targetScore + grammarScore + mechanicsScore;
      if (geminiResult.score < currentDetScore) {
        const diff = Math.min(10, currentDetScore - geminiResult.score);
        grammarScore = Math.max(0, grammarScore - Math.ceil(diff / 2));
      }
    }
  }

  // 교정 사항이 하나도 없는 완벽한 문장일 때만 격려 피드백 추가
  if (grammarFeedback.length === 0 && !hasExternalSpellingOrGrammarError) {
    if (candidateAnswers.length > 1 && bestCandidateMatch && bestCandidateMatch.isExactMatch) {
      const otherCandidates = candidateAnswers.filter(
        (_, idx) => idx !== bestCandidateMatch.matchedIndex
      );
      grammarFeedback.push({
        original: safeContent,
        corrected: correctedText,
        explanation: `🌟 총 ${candidateAnswers.length}개의 복수 정답 중 [${
          bestCandidateMatch.matchedIndex + 1
        }번 정답: "${
          bestCandidateMatch.bestCandidate
        }"]과 100% 완벽하게 일치합니다! (다른 가능한 정답 표현: ${otherCandidates.join(" / ")})`
      });
    } else {
      grammarFeedback.push({
        original: safeContent,
        corrected: correctedText,
        explanation:
          "🌟 한국어 제시문의 의미 전달, 핵심 목표 구문 어순, 철자 및 주어-동사 수일치, 문장부호까지 모두 100% 완벽하게 작성했습니다!"
      });
    }
  }

  // ============================================================================
  // 종합 점수(100점 만점) = 의미 전달(40) + 목표 표현(30) + 영문법·어순(20) + 표기·부호(10)
  // ============================================================================
  const totalScore = Math.min(
    100,
    Math.max(0, meaningScore + targetScore + grammarScore + mechanicsScore)
  );

  const cefrLevel =
    totalScore >= 95 && wordCount >= 10
      ? "B1+"
      : totalScore >= 85 && wordCount >= 6
      ? "B1"
      : totalScore >= 70
      ? "A2+"
      : totalScore >= 50
      ? "A2"
      : "A1";

  const finalModelAnswer =
    mode === "korean_prompt"
      ? independentModelAnswer
      : referenceAnswer && referenceAnswer.trim()
      ? referenceAnswer.trim()
      : generatedAlternativeModel || correctedText;

  // ★ 1:1 시각적 비교(Visual Diff) 및 구문 블록(Chunk) 진단에 사용할 최종 기준 문장 결정:
  // 모범 답안 후보가 존재하고 학생 원문과 다르면 모범 답안 후보를 사용하고,
  // 자유 영작이거나 철자 교정(populer -> popular, word -> world 등)이 반영된 경우에는 교정 완료 문장(correctedText)과 비교!
  const diffTargetSentence =
    mode === "korean_prompt" &&
    bestCandidateMatch?.bestCandidate &&
    normalizeSentenceForCompare(bestCandidateMatch.bestCandidate) !==
      normalizeSentenceForCompare(safeContent)
      ? bestCandidateMatch.bestCandidate
      : correctedText;

  const isTrulyExact =
    !hasExternalSpellingOrGrammarError &&
    (mode === "korean_prompt" && bestCandidateMatch
      ? bestCandidateMatch.isExactMatch
      : normalizeSentenceForCompare(safeContent) ===
        normalizeSentenceForCompare(diffTargetSentence));

  const finalChunkAnalysis = evaluateChunkSlotAlignment(
    safeContent,
    diffTargetSentence,
    strictMeta.allowArticleSwap
  );

  const visualDiffHtml = buildWordByWordDiffHtml(
    safeContent,
    diffTargetSentence,
    finalChunkAnalysis,
    isTrulyExact
  );

  const relevantVocabList = buildRelevantVocabularyList({
    koreanPrompt,
    targetGrammar,
    modelAnswer: finalModelAnswer,
    missingConceptLabels
  });

  let overallComment = "";
  if (geminiResult?.overallComment) {
    overallComment = `🤖 [${strictMeta.shortLabel} · 총점 ${totalScore}점] ${geminiResult.overallComment}`;
  } else if (totalScore >= 95) {
    overallComment = `💯 [${strictMeta.shortLabel} · 총점 ${totalScore}점] 제시문의 의미 전달(${meaningScore}/40점), 목표 구문 활용(${targetScore}/30점), 영문법 어순(${grammarScore}/20점), 표기법(${mechanicsScore}/10점) 모두 완벽합니다! 최고예요! 👏`;
  } else if (totalScore >= 80) {
    overallComment = `👍 [${strictMeta.shortLabel} · 총점 ${totalScore}점] 핵심 의미를 잘 전달했으나 세부 항목(의미 ${meaningScore}/40, 목표구문 ${targetScore}/30, 문법 ${grammarScore}/20, 표기 ${mechanicsScore}/10)에서 아쉬운 부분을 1:1 비교표와 교정 노트로 확인해 보세요!`;
  } else {
    overallComment = `💡 [${strictMeta.shortLabel} · 총점 ${totalScore}점] 제시문과 어휘·어순 일치도를 높여 보세요(의미 ${meaningScore}/40, 목표구문 ${targetScore}/30, 문법 ${grammarScore}/20, 표기 ${mechanicsScore}/10). 위 1:1 시각적 비교표와 추천 모범 영작 답안을 참고해 다시 도전해 보세요!`;
  }

  return {
    cefrLevel,
    score: totalScore,
    meaningAccuracy,
    targetExpressionUsed,
    strictnessMode: strictMeta.mode,
    strictnessLabel: strictMeta.label,
    visualDiffHtml,
    rubric: {
      meaning: meaningScore,
      target: targetScore,
      grammar: grammarScore,
      mechanics: mechanicsScore
    },
    correctedText,
    modelAnswer: finalModelAnswer,
    grammarFeedback,
    vocabularySuggestions: relevantVocabList,
    overallComment
  };
}

// ============================================================================
// 3. DOM 요소 참조 및 모드 전환 탭 이벤트
// ============================================================================
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const userInfoText = document.getElementById("user-info-text");

const viewLogin = document.getElementById("view-login");
const viewStudent = document.getElementById("view-student");
const viewTeacher = document.getElementById("view-teacher");

const tabModeKorean = document.getElementById("tab-mode-korean");
const tabModeFree = document.getElementById("tab-mode-free");
const boxKoreanPrompt = document.getElementById("box-korean-prompt");
const boxFreeTopic = document.getElementById("box-free-topic");
const selectKoreanMission = document.getElementById("select-korean-mission");
const displayKoreanSentence = document.getElementById("display-korean-sentence");
const displayTargetGrammar = document.getElementById("display-target-grammar");

const essayTopic = document.getElementById("essay-topic");
const essayContent = document.getElementById("essay-content");
const wordCountNum = document.getElementById("word-count-num");
const btnSubmitEssay = document.getElementById("btn-submit-essay");

// 학생 모드 전환: [🇰🇷➡️🇺🇸 선생님 한국어 제시문 영작] vs [📝 자유 주제 영작]
tabModeKorean.addEventListener("click", () => {
  currentWritingMode = "korean_prompt";
  tabModeKorean.classList.add("active");
  tabModeFree.classList.remove("active");
  boxKoreanPrompt.classList.remove("hidden");
  boxFreeTopic.classList.add("hidden");
  document.getElementById("label-essay-content").textContent = "🇺🇸 제시문을 보고 영어로 영작하기";
  essayContent.placeholder = "위에 제시된 한국어 문장의 의미와 핵심 표현을 살려 영어로 작성해 보세요!";
  updateSelectedKoreanMissionDetail();
});

tabModeFree.addEventListener("click", () => {
  stopMissionTimer();
  currentWritingMode = "free";
  tabModeFree.classList.add("active");
  tabModeKorean.classList.remove("active");
  boxFreeTopic.classList.remove("hidden");
  boxKoreanPrompt.classList.add("hidden");
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;
  document.getElementById("label-essay-content").textContent = "📝 자유 영작문 본문 작성 (Essay)";
  essayContent.placeholder = "자유롭게 영어로 글을 작성해 보세요! (50~150단어 권장)";
});

// ============================================================================
// [제한시간 타이머 & 시간 초과 시 자동 강제 제출 제어]
// ============================================================================
let missionTimerInterval = null;
let remainingSeconds = 0;
let isTimerRunning = false;
let currentTimedMissionId = null;

const timerControlBar = document.getElementById("timer-control-bar");
const timerStatusLabel = document.getElementById("timer-status-label");
const timerCountdownEl = document.getElementById("timer-countdown");

function formatMMSS(sec) {
  const s = Math.max(0, Math.floor(sec));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function stopMissionTimer() {
  if (missionTimerInterval) {
    clearInterval(missionTimerInterval);
    missionTimerInterval = null;
  }
  isTimerRunning = false;
  timerControlBar?.classList.remove("urgent");
}

function startMissionTimer(limitSec, missionId = null) {
  stopMissionTimer();
  remainingSeconds = Number(limitSec) || 0;
  currentTimedMissionId = missionId || selectKoreanMission.value;
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;

  if (remainingSeconds <= 0) {
    timerControlBar?.classList.add("hidden");
    return;
  }

  timerControlBar?.classList.remove("hidden");
  isTimerRunning = true;
  if (timerStatusLabel) {
    timerStatusLabel.textContent = "⏳ 남은 제한시간 (00:00 도달 시 작성한 내용 자동 강제 발송):";
  }
  if (timerCountdownEl) {
    timerCountdownEl.textContent = formatMMSS(remainingSeconds);
  }
  if (remainingSeconds <= 30) {
    timerControlBar?.classList.add("urgent");
  }

  missionTimerInterval = setInterval(() => {
    // 학생 화면이 아닌 경우(로그아웃/교사화면 전환 등) 타이머 중지
    if (viewStudent.classList.contains("hidden")) {
      stopMissionTimer();
      return;
    }
    remainingSeconds -= 1;
    if (timerCountdownEl) {
      timerCountdownEl.textContent = formatMMSS(remainingSeconds);
    }
    if (remainingSeconds <= 30) {
      timerControlBar?.classList.add("urgent");
    }
    if (remainingSeconds <= 0) {
      stopMissionTimer();
      // 제한시간 종료 -> 그때까지 작성한 내용 즉시 강제 발송!
      submitEssayProcess({ isForcedByTimeout: true });
    }
  }, 1000);
}

// 학생 화면의 한국어 제시문 드롭다운 렌더링 (교사가 공개 체크한 과제 중 본인 학년/반 + 공통 과제만 표시)
function renderStudentKoreanMissions() {
  const studentGrade = currentStudentInfo ? String(currentStudentInfo.grade) : "all";
  const studentClass = currentStudentInfo ? String(currentStudentInfo.classNum) : "all";

  // 1) 교사가 공개 체크(active !== false)한 과제만
  // 2) 본인 학년(또는 전학년 공통) 과제만
  // 3) 본인 반(또는 전체 반 공통) 과제만 필터링
  const myVisiblePrompts = koreanPrompts.filter((p) => {
    if (p.active === false) return false;
    const pGrade = String(p.targetGrade || "all");
    const pClass = String(p.targetClass || "all");
    const gradeMatch = studentGrade === "all" || pGrade === "all" || pGrade === studentGrade;
    const classMatch = studentClass === "all" || pClass === "all" || pClass === studentClass;
    return gradeMatch && classMatch;
  });

  // 정렬: 1순위 선생님이 새로 등록한 클라우드 과제 -> 2순위 우리 반 전용 과제 -> 3순위 우리 학년 과제
  const sortedPrompts = [...myVisiblePrompts].sort((a, b) => {
    const aIsCustom = !String(a.id).startsWith("kp-") ? -1 : 0;
    const bIsCustom = !String(b.id).startsWith("kp-") ? -1 : 0;
    if (aIsCustom !== bIsCustom) return aIsCustom - bIsCustom;

    const aClassMatch = String(a.targetClass || "all") === studentClass ? -1 : 0;
    const bClassMatch = String(b.targetClass || "all") === studentClass ? -1 : 0;
    if (aClassMatch !== bClassMatch) return aClassMatch - bClassMatch;

    const aGradeMatch = String(a.targetGrade || "all") === studentGrade ? -1 : 0;
    const bGradeMatch = String(b.targetGrade || "all") === studentGrade ? -1 : 0;
    if (aGradeMatch !== bGradeMatch) return aGradeMatch - bGradeMatch;

    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });

  if (sortedPrompts.length === 0) {
    stopMissionTimer();
    selectKoreanMission.innerHTML = `<option value="">현재 선생님이 공개한 우리 반(${studentGrade}학년 ${studentClass}반) 과제가 없습니다.</option>`;
    displayKoreanSentence.textContent = "선생님이 과제를 공개(체크)하시면 여기에 즉시 표시됩니다.";
    displayTargetGrammar.textContent = "-";
    timerControlBar?.classList.add("hidden");
    essayContent.disabled = false;
    btnSubmitEssay.disabled = false;
    return;
  }

  const prevSelected = selectKoreanMission.value;
  selectKoreanMission.innerHTML = sortedPrompts
    .map((p) => {
      const isNew = !String(p.id).startsWith("kp-");
      const prefix = isNew ? "🆕 " : "";
      const classTag = p.targetClass && p.targetClass !== "all" ? `[${p.targetGrade}-${p.targetClass}반] ` : "";
      const limitNum = Number(p.timeLimitSec) || 0;
      const timeTag =
        limitNum > 0
          ? limitNum % 60 === 0
            ? ` (⏱️${limitNum / 60}분)`
            : ` (⏱️${limitNum}초)`
          : " (시간제한 없음)";
      return `<option value="${p.id}">${prefix}${classTag}${p.title}${timeTag}</option>`;
    })
    .join("");

  if (sortedPrompts.some((p) => p.id === prevSelected)) {
    selectKoreanMission.value = prevSelected;
  }

  // 이미 같은 과제의 타이머가 돌고 있는 중이면 제시문 텍스트만 갱신하고 타이머는 유지
  if (isTimerRunning && currentTimedMissionId === selectKoreanMission.value) {
    const currentMission = koreanPrompts.find((p) => p.id === selectKoreanMission.value);
    if (currentMission) {
      displayKoreanSentence.textContent = `"${currentMission.koreanPrompt}"`;
      displayTargetGrammar.textContent = currentMission.targetGrammar || "자유 표현 (의미가 통하도록 영작)";
    }
    return;
  }

  updateSelectedKoreanMissionDetail();
}

selectKoreanMission.addEventListener("change", () => {
  stopMissionTimer();
  essayContent.value = "";
  wordCountNum.textContent = "0";
  updateSelectedKoreanMissionDetail();
});

// 학생의 기존 제출 내역 캐시 (과제별 제출 횟수 제한 확인용)
let studentSubmissionsCache = [];

function getStudentUsedAttemptsForMission(mission) {
  if (!mission || !currentUser) return 0;
  const uid = currentUser.uid;
  const studentId = currentStudentInfo?.studentId || "";
  const localSaved = (() => {
    try {
      return JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
    } catch (e) {
      return [];
    }
  })();

  const combined = [...studentSubmissionsCache, ...localSaved];
  const seenKeys = new Set();
  let count = 0;

  for (const rec of combined) {
    if (!rec) continue;
    const isMyRec =
      (uid && rec.uid === uid) || (studentId && studentId !== "미등록" && rec.studentId === studentId);
    if (!isMyRec) continue;

    const matchMission =
      (rec.missionId && rec.missionId === mission.id) ||
      (rec.topic === mission.title && rec.koreanPrompt === mission.koreanPrompt);
    if (!matchMission) continue;

    // 동일 제출 중복 카운트 방지 (createdAtMs 기준 2초 이내 동일 내용 하나로 취급)
    const dedupKey = `${Math.round((rec.createdAtMs || rec.ts || 0) / 2000)}_${rec.originalContent || ""}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);
    count++;
  }
  return count;
}

function formatMaxAttemptsLabel(maxAttempts) {
  const n = maxAttempts === undefined || maxAttempts === null ? 1 : Number(maxAttempts);
  if (n <= 0) return "♾️ 무제한";
  return `🔒 ${n}회 제한`;
}

function updateSelectedKoreanMissionDetail() {
  stopMissionTimer();
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;
  btnSubmitEssay.textContent = "🤖 AI 채점 및 피드백 받기";

  const selectedId = selectKoreanMission.value;
  const mission = koreanPrompts.find((p) => p.id === selectedId);
  const strictBadgeEl = document.getElementById("display-strictness-badge");
  const attemptsBadgeEl = document.getElementById("display-attempts-badge");

  if (!mission) {
    displayKoreanSentence.textContent = "등록된 한국어 제시문이 없습니다.";
    displayTargetGrammar.textContent = "-";
    timerControlBar?.classList.add("hidden");
    if (strictBadgeEl) {
      strictBadgeEl.className = "strictness-pill standard";
      strictBadgeEl.textContent = "⚖️ 표준 정밀 채점";
    }
    if (attemptsBadgeEl) {
      attemptsBadgeEl.className = "strictness-pill strict";
      attemptsBadgeEl.textContent = "🔒 제출 기회: 1회";
    }
    return;
  }

  // 한국어 제시문, 핵심 목표 표현, 채점 엄격도 배지를 즉시 표시
  displayKoreanSentence.textContent = `"${mission.koreanPrompt}"`;
  displayTargetGrammar.textContent = mission.targetGrammar || "자유 표현 (의미가 통하도록 영작)";

  if (strictBadgeEl) {
    const sMeta = getStrictnessMeta(mission.strictness || "standard");
    strictBadgeEl.className = `strictness-pill ${sMeta.mode}`;
    strictBadgeEl.textContent = sMeta.label;
  }

  // 제출 허용 횟수 확인 (기본값 1회, 0이면 무제한, 교사 테스트 모드는 횟수 무제한 허용)
  const maxAttempts =
    mission.maxAttempts === undefined || mission.maxAttempts === null ? 1 : Number(mission.maxAttempts);
  const usedAttempts = getStudentUsedAttemptsForMission(mission);
  const isTeacherTesting = currentStudentInfo?.studentId === "TEACHER";

  if (attemptsBadgeEl) {
    if (maxAttempts <= 0) {
      attemptsBadgeEl.className = "strictness-pill fluency";
      attemptsBadgeEl.textContent = `♾️ 제출 횟수: 무제한 허용 (현재 ${usedAttempts}회 제출)`;
    } else {
      const remain = Math.max(0, maxAttempts - usedAttempts);
      attemptsBadgeEl.className = remain > 0 ? "strictness-pill standard" : "strictness-pill strict";
      attemptsBadgeEl.textContent =
        remain > 0
          ? `🔒 제출 기회: ${usedAttempts} / ${maxAttempts}회 (남은 기회 ${remain}회)`
          : `🔒 제출 완료: ${usedAttempts} / ${maxAttempts}회 (추가 제출 불가)`;
    }
  }

  // 이미 허용된 제출 횟수를 모두 소진한 경우 (학생 계정일 때) 입력창 및 채점 버튼 잠금
  if (!isTeacherTesting && maxAttempts > 0 && usedAttempts >= maxAttempts) {
    timerControlBar?.classList.add("hidden");
    essayContent.disabled = true;
    btnSubmitEssay.disabled = true;
    btnSubmitEssay.textContent = `🔒 제출 완료 (${usedAttempts}/${maxAttempts}회 제출 완료 — 추가 제출 불가)`;
    return;
  }

  const limitSec = Number(mission.timeLimitSec) || 0;
  if (limitSec > 0 && currentWritingMode === "korean_prompt") {
    timerControlBar?.classList.remove("hidden");
    // 학생 화면이 열려 있을 때 자동으로 제한시간 타이머 카운트다운 시작!
    if (!viewStudent.classList.contains("hidden")) {
      startMissionTimer(limitSec, mission.id);
    } else {
      if (timerCountdownEl) timerCountdownEl.textContent = formatMMSS(limitSec);
    }
  } else {
    timerControlBar?.classList.add("hidden");
  }
}

// ============================================================================
// 4. 사용자 인증 (Google 로그인 및 @smy.ms.kr 도메인 + 명렬표 자동 매칭)
// ============================================================================
async function triggerGoogleLogin() {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google 로그인 실패:", error);
    alert("로그인 중 오류가 발생했습니다: " + error.message);
  }
}

btnLogin.addEventListener("click", triggerGoogleLogin);
document.getElementById("btn-hero-login")?.addEventListener("click", triggerGoogleLogin);

btnLogout.addEventListener("click", async () => {
  stopMissionTimer();
  await signOut(auth);
});

const btnTeacherToggleView = document.getElementById("btn-teacher-toggle-view");

btnTeacherToggleView?.addEventListener("click", () => {
  if (!currentUser) return;
  const isShowingTeacher = !viewTeacher.classList.contains("hidden");
  if (isShowingTeacher) {
    // 교사가 학생 화면으로 전환하여 모든 학년/반 과제를 채점 테스트할 수 있도록 설정
    currentStudentInfo = {
      grade: "all",
      classNum: "all",
      number: 0,
      name: currentUser.displayName || "교사테스트",
      studentId: "TEACHER",
      email: (currentUser.email || "").toLowerCase()
    };
    document.getElementById("student-id").value = "교사테스트";
    document.getElementById("student-grade").value = "전학년";
    document.getElementById("student-class").value = "전체반";
    document.getElementById("student-number").value = "-";
    document.getElementById("student-name").value = currentStudentInfo.name;

    viewTeacher.classList.add("hidden");
    viewStudent.classList.remove("hidden");
    btnTeacherToggleView.textContent = "👩‍🏫 교사 관리 화면으로 돌아가기";
    renderStudentKoreanMissions();
    loadStudentHistory();
  } else {
    stopMissionTimer();
    viewStudent.classList.add("hidden");
    viewTeacher.classList.remove("hidden");
    btnTeacherToggleView.textContent = "✍️ 학생 화면으로 채점 테스트";
    renderTeacherPromptsTable();
    loadTeacherDashboard();
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    currentStudentInfo = null;
    setRuntimeRoster([]); // 로그아웃 상태에서는 런타임 메모리에서도 명렬표 즉시 초기화
    userInfoText.textContent = "로그인이 필요합니다";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    btnTeacherToggleView?.classList.add("hidden");
    viewLogin.classList.remove("hidden");
    viewStudent.classList.add("hidden");
    viewTeacher.classList.add("hidden");
    return;
  }

  const email = (user.email || "").toLowerCase();
  const emailDomain = email.split("@")[1];
  const isRegisteredTeacher = TEACHER_EMAILS.includes(email);

  if (!isRegisteredTeacher && emailDomain !== ALLOWED_DOMAIN) {
    setRuntimeRoster([]);
    alert(`접근 제한: 서울문영여자중학교 계정(@${ALLOWED_DOMAIN}) 또는 등록된 교사 관리자 계정으로만 로그인이 가능합니다.`);
    await signOut(auth);
    return;
  }

  currentUser = user;
  if (isRegisteredTeacher) {
    // 교사: 교사 전용 저장소에서 명렬표와 Gemini 키를 불러와요 (예전 위치에 남아 있으면 옮기고 지워요)
    await loadTeacherPrivateConfig();
  } else {
    // 학생: 예전에 브라우저에 저장된 키가 있으면 지워요
    geminiApiKey = "";
    try { localStorage.removeItem("MY_WRITING_GEMINI_KEY"); } catch (e) {}
  }
  await loadKoreanPromptsFromCloud();
  let matchedStudent = findStudentByEmail(email, user.displayName || "");
  if (!isRegisteredTeacher) {
    const own = await lookupOwnStudentEntry(email);
    if (own) matchedStudent = { ...(matchedStudent || {}), ...own };
  }

  // 교사 화면은 등록된 교사 이메일만 열 수 있어요
  const isTeacher = isRegisteredTeacher;

  if (isTeacher) {
    userInfoText.textContent = `${user.displayName || email} (교사 관리자)`;
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    if (btnTeacherToggleView) {
      btnTeacherToggleView.classList.remove("hidden");
      btnTeacherToggleView.textContent = "✍️ 학생 화면으로 채점 테스트";
    }
    viewLogin.classList.add("hidden");
    viewTeacher.classList.remove("hidden");
    viewStudent.classList.add("hidden");

    subscribeKoreanPromptsFromCloud();
    renderTeacherPromptsTable();
    populateRosterDropdown();
    await loadTeacherDashboard();
  } else {
    btnTeacherToggleView?.classList.add("hidden");
    currentStudentInfo = matchedStudent || {
      grade: 1,
      classNum: 1,
      number: 1,
      name: user.displayName || "학생",
      studentId: "미등록",
      email
    };

    // 만약 명렬표나 Google 프로필에 한글 실명이 아직 없다면, 같은 프로젝트(MY Cloze / 단어숲)의 본인 보안 프로필에서 실명 조회
    if (!currentStudentInfo.name || currentStudentInfo.name === "학생") {
      try {
        const [uSnap, vSnap] = await Promise.allSettled([
          getDoc(doc(db, "users", user.uid)),
          getDoc(doc(db, "vocab_users", user.uid))
        ]);
        const clozeName = uSnap.status === "fulfilled" && uSnap.value.exists() ? uSnap.value.data()?.realName : "";
        const vocabName = vSnap.status === "fulfilled" && vSnap.value.exists() ? vSnap.value.data()?.name : "";
        if (clozeName || vocabName) {
          currentStudentInfo.name = (clozeName || vocabName).trim();
        }
      } catch (e) {
        // 무시
      }
    }

    const studentName = currentStudentInfo.name || user.displayName || "학생";
    currentStudentInfo.name = studentName;

    userInfoText.textContent = `${currentStudentInfo.grade}학년 ${currentStudentInfo.classNum}반 ${currentStudentInfo.number}번 ${studentName} (${currentStudentInfo.studentId})`;

    document.getElementById("student-id").value = currentStudentInfo.studentId;
    document.getElementById("student-grade").value = String(currentStudentInfo.grade);
    document.getElementById("student-class").value = String(currentStudentInfo.classNum);
    document.getElementById("student-number").value = currentStudentInfo.number;
    document.getElementById("student-name").value = studentName;

    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    viewLogin.classList.add("hidden");
    viewStudent.classList.remove("hidden");
    viewTeacher.classList.add("hidden");

    subscribeKoreanPromptsFromCloud();
    renderStudentKoreanMissions();
    await loadStudentHistory();
  }
});

// ============================================================================
// 5. 교사 한국어 제시문 출제/삭제 및 학생 실시간 동기화 (cloze-a8e6c 완벽 호환)
// ============================================================================
// ★ 중요: cloze-a8e6c 프로젝트의 기존 Firestore 보안 규칙(firestore.rules)에서
// 교사 쓰기 및 전교생(@smy.ms.kr) 읽기가 허용되고, MY Cloze 및 단어숲 단어장 목록에
// 절대 영향을 주지 않는 `vocab_books/_settings` 문서의 `writing1_prompts` 필드를 사용합니다.
let unsubscribePrompts = null;

// Gemini AI 하이브리드 채점 설정 상태 (로컬 및 클라우드 동기화)
let geminiApiKey = localStorage.getItem("MY_WRITING_GEMINI_KEY") || "";
let geminiAiEnabled = localStorage.getItem("MY_WRITING_GEMINI_ENABLED") !== "false";

function updateGeminiConfigUI() {
  const keyInput = document.getElementById("input-gemini-api-key");
  const chkEnable = document.getElementById("chk-enable-gemini-ai");
  const pill = document.getElementById("gemini-status-pill");
  const vaultStatus = document.getElementById("roster-vault-status-text");
  if (keyInput && geminiApiKey && !keyInput.value) {
    keyInput.value = geminiApiKey;
  }
  if (chkEnable) {
    chkEnable.checked = geminiAiEnabled;
  }
  if (pill) {
    if (geminiApiKey && geminiAiEnabled) {
      pill.textContent = "🤖 Gemini AI 하이브리드 가동 중 ▾";
      pill.style.background = "#dcfce7";
      pill.style.color = "#15803d";
      pill.style.borderColor = "#86efac";
    } else {
      pill.textContent = "🤖 Gemini AI & 보안 명렬표 설정 ▾";
      pill.style.background = "#eff6ff";
      pill.style.color = "#1d4ed8";
      pill.style.borderColor = "#bfdbfe";
    }
  }
  if (vaultStatus) {
    if (STUDENT_ROSTER.length > 0) {
      vaultStatus.textContent = `✅ 교사 전용 저장소에 ${STUDENT_ROSTER.length}명 등록됨`;
      vaultStatus.style.color = "#15803d";
    } else {
      vaultStatus.textContent = "⚠️ 미등록 (오른쪽 버튼으로 '학번 이름' 목록 파일을 올려 주세요)";
      vaultStatus.style.color = "#b45309";
    }
  }
}

document.getElementById("btn-sync-secure-roster")?.addEventListener("click", () => {
  document.getElementById("input-roster-file")?.click();
});

document.getElementById("input-roster-file")?.addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  ev.target.value = "";
  if (!file) return;
  if (!currentUser || !TEACHER_EMAILS.includes((currentUser.email || "").toLowerCase())) {
    return alert("교사 계정으로 로그인해야 명렬표를 올릴 수 있어요.");
  }
  const compactList = parseRosterText(await file.text());
  if (compactList.length === 0) {
    return alert("❌ 파일에서 '학번 이름' 줄을 찾지 못했어요. 예: 10101 김문영");
  }
  if (!confirm(`학생 ${compactList.length}명을 교사 전용 저장소에 올릴까요? (기존 명렬표는 바뀝니다)`)) return;
  try {
    setRuntimeRoster(compactList);
    await setDoc(
      doc(db, ...PRIVATE_CONFIG_PATH),
      { roster: compactList, updatedAt: Date.now() },
      { merge: true }
    );
    await writeStudentDirectory(STUDENT_ROSTER);
    updateGeminiConfigUI();
    populateRosterDropdown();
    applyTeacherFilters();
    alert(`✅ 학생 ${STUDENT_ROSTER.length}명 명렬표를 교사 전용 저장소에 올렸어요. 학생은 자기 이름만 볼 수 있어요.`);
  } catch (e) {
    alert("저장 중 오류가 발생했습니다: " + e.message);
  }
});

document.getElementById("btn-save-gemini-config")?.addEventListener("click", async () => {
  const keyInput = document.getElementById("input-gemini-api-key");
  const chkEnable = document.getElementById("chk-enable-gemini-ai");
  geminiApiKey = (keyInput?.value || "").trim();
  geminiAiEnabled = chkEnable ? chkEnable.checked : true;
  localStorage.setItem("MY_WRITING_GEMINI_KEY", geminiApiKey);
  localStorage.setItem("MY_WRITING_GEMINI_ENABLED", String(geminiAiEnabled));
  updateGeminiConfigUI();
  try {
    await syncPromptsToCloudDoc();
    alert(
      geminiApiKey && geminiAiEnabled
        ? "✅ Gemini AI 실시간 하이브리드 채점이 활성화되어 클라우드에 동기화되었습니다!"
        : "✅ 채점 엔진 설정이 저장되었습니다. (내장 4대 정밀 엔진 + LanguageTool 이중 검증으로 작동합니다.)"
    );
  } catch (e) {
    alert("✅ 설정이 브라우저에 저장되었습니다.");
  }
});

function mergeCloudPromptsWithDefaults(cloudPrompts, hasBeenCustomized) {
  if (hasBeenCustomized) {
    return cloudPrompts.map((p) => ({
      targetClass: "all",
      timeLimitSec: 180,
      strictness: "standard",
      maxAttempts: 1,
      active: true,
      ...p
    }));
  }
  const cloudIds = new Set(cloudPrompts.map((p) => p.id));
  const defaultFiltered = DEFAULT_KOREAN_PROMPTS.filter((p) => !cloudIds.has(p.id));
  return [...cloudPrompts, ...defaultFiltered].map((p) => ({
    targetClass: "all",
    timeLimitSec: 180,
    strictness: "standard",
    maxAttempts: 1,
    active: true,
    ...p
  }));
}

function subscribeKoreanPromptsFromCloud() {
  if (unsubscribePrompts) return;
  try {
    const settingsDocRef = doc(db, "vocab_books", "_settings");
    unsubscribePrompts = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.writing1_geminiEnabled === "boolean") {
            geminiAiEnabled = data.writing1_geminiEnabled;
            localStorage.setItem("MY_WRITING_GEMINI_ENABLED", String(geminiAiEnabled));
          }
          if (data.writing1_geminiKey !== undefined || data.writing1_roster !== undefined) {
            migrateLegacySecrets(data);
          }
          updateGeminiConfigUI();

          if (Array.isArray(data.writing1_prompts)) {
            koreanPrompts = mergeCloudPromptsWithDefaults(
              data.writing1_prompts,
              Boolean(data.writing1_fullSync)
            );
            saveKoreanPromptsToStorage();
          }
        }
        renderTeacherPromptsTable();
        renderStudentKoreanMissions();
      },
      (err) => {
        console.warn("실시간 과제 구독 대신 1회 조회를 수행합니다:", err);
        loadKoreanPromptsFromCloud();
      }
    );
  } catch (e) {
    loadKoreanPromptsFromCloud();
  }
}

async function loadKoreanPromptsFromCloud() {
  try {
    const settingsDocRef = doc(db, "vocab_books", "_settings");
    const snap = await getDoc(settingsDocRef);
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.writing1_geminiEnabled === "boolean") {
        geminiAiEnabled = data.writing1_geminiEnabled;
        localStorage.setItem("MY_WRITING_GEMINI_ENABLED", String(geminiAiEnabled));
      }
      if (data.writing1_geminiKey !== undefined || data.writing1_roster !== undefined) {
        await migrateLegacySecrets(data);
      }
      updateGeminiConfigUI();

      if (Array.isArray(data.writing1_prompts)) {
        koreanPrompts = mergeCloudPromptsWithDefaults(
          data.writing1_prompts,
          Boolean(data.writing1_fullSync)
        );
        saveKoreanPromptsToStorage();
      }
    }
  } catch (e) {
    loadKoreanPromptsFromStorage();
  }
}

async function syncPromptsToCloudDoc() {
  if (!currentUser || currentUser.isDemo) return false;
  const isRegistered = TEACHER_EMAILS.includes((currentUser.email || "").toLowerCase());
  // 1) 교사 전용 저장소에 먼저 저장해요 (보안 규칙이 아직 없으면 실패할 수 있어요)
  let privateSaved = false;
  if (isRegistered) {
    try {
      const priv = { geminiKey: geminiApiKey || "", updatedAt: Date.now() };
      if (STUDENT_ROSTER.length > 0) {
        priv.roster = STUDENT_ROSTER.map((st) => `${st.studentId}:${st.name}`);
      }
      await setDoc(doc(db, ...PRIVATE_CONFIG_PATH), priv, { merge: true });
      privateSaved = true;
    } catch (e) {
      console.warn("교사 전용 저장소에 저장하지 못했어요 (Firestore 보안 규칙을 확인해 주세요):", e);
    }
  }
  // 2) 학생도 읽는 설정 문서에는 과제만 저장해요.
  //    키·명렬표가 교사 전용 저장소에 안전하게 옮겨졌을 때만 예전 자리에서 지워요.
  const pub = {
    id: "_settings",
    writing1_prompts: koreanPrompts,
    writing1_geminiEnabled: Boolean(geminiAiEnabled),
    writing1_fullSync: true,
    writing1_updatedAt: Date.now()
  };
  if (privateSaved) {
    pub.writing1_geminiKey = deleteField();
    pub.writing1_roster = deleteField();
  }
  await setDoc(doc(db, "vocab_books", "_settings"), pub, { merge: true });
  return true;
}

// ---------------------------------------------------------------------------
// 교사 전용 저장소: 명렬표 + Gemini 키
// ---------------------------------------------------------------------------
async function loadTeacherPrivateConfig() {
  try {
    const snap = await getDoc(doc(db, ...PRIVATE_CONFIG_PATH));
    if (snap.exists()) {
      const data = snap.data();
      if (typeof data.geminiKey === "string") {
        geminiApiKey = data.geminiKey;
        localStorage.setItem("MY_WRITING_GEMINI_KEY", geminiApiKey);
      }
      if (Array.isArray(data.roster) && data.roster.length > 0) {
        setRuntimeRoster(data.roster);
      }
    }
  } catch (e) {
    console.warn("교사 전용 설정을 불러오지 못했어요:", e);
  }
}

// 예전에 학생도 읽을 수 있는 문서(vocab_books/_settings)에 저장했던 키·명렬표를
// 교사가 접속하면 교사 전용 저장소로 옮기고 원래 자리에서는 지워요.
let legacyMigrationRunning = false;
async function migrateLegacySecrets(data) {
  if (!currentUser || !TEACHER_EMAILS.includes((currentUser.email || "").toLowerCase())) return;
  if (legacyMigrationRunning) return;
  legacyMigrationRunning = true;
  try {
    const update = { updatedAt: Date.now() };
    if (typeof data.writing1_geminiKey === "string" && data.writing1_geminiKey) {
      geminiApiKey = data.writing1_geminiKey;
      update.geminiKey = geminiApiKey;
      localStorage.setItem("MY_WRITING_GEMINI_KEY", geminiApiKey);
    } else if (geminiApiKey) {
      update.geminiKey = geminiApiKey;
    }
    const legacyRoster = Array.isArray(data.writing1_roster) ? data.writing1_roster : [];
    if (legacyRoster.length > 0) {
      setRuntimeRoster(legacyRoster);
      update.roster = legacyRoster;
    }
    await setDoc(doc(db, ...PRIVATE_CONFIG_PATH), update, { merge: true });
    if (legacyRoster.length > 0) await writeStudentDirectory(STUDENT_ROSTER);
    await setDoc(
      doc(db, "vocab_books", "_settings"),
      { writing1_geminiKey: deleteField(), writing1_roster: deleteField() },
      { merge: true }
    );
    populateRosterDropdown();
    updateGeminiConfigUI();
  } catch (e) {
    console.warn("예전 설정을 옮기지 못했어요:", e);
  } finally {
    legacyMigrationRunning = false;
  }
}

// 학생 한 명씩 자기 줄만 읽을 수 있도록 이메일별 문서로 나눠 저장해요
async function writeStudentDirectory(list) {
  const rows = (list || []).filter((s) => s && s.email && s.studentId && s.name);
  for (let i = 0; i < rows.length; i += 400) {
    const batch = writeBatch(db);
    rows.slice(i, i + 400).forEach((s) => {
      batch.set(doc(db, STUDENT_DIR_COLLECTION, String(s.email).toLowerCase()), {
        studentId: s.studentId,
        name: s.name,
        updatedAt: Date.now()
      });
    });
    await batch.commit();
  }
}

async function lookupOwnStudentEntry(email) {
  try {
    const snap = await getDoc(doc(db, STUDENT_DIR_COLLECTION, String(email).toLowerCase()));
    if (!snap.exists()) return null;
    const d = snap.data();
    const sId = String(d.studentId || "");
    if (!/^\d{5}$/.test(sId)) return null;
    return {
      grade: Number(sId[0]),
      classNum: Number(sId.slice(1, 3)),
      number: Number(sId.slice(3, 5)),
      studentId: sId,
      name: String(d.name || "").trim() || "학생",
      email: String(email).toLowerCase()
    };
  } catch (e) {
    return null;
  }
}

// "10101 김문영", "10101,김문영", "10101:김문영" 같은 줄을 읽어요
function parseRosterText(text) {
  const out = [];
  const seen = new Set();
  String(text || "").split(/\r?\n/).forEach((line) => {
    const m = line.match(/(?:2026)?([1-3]\d{4})\D+([가-힣A-Za-z][가-힣A-Za-z ]{0,19})/);
    if (!m || seen.has(m[1])) return;
    seen.add(m[1]);
    out.push(`${m[1]}:${m[2].trim()}`);
  });
  return out;
}

function formatLimitLabel(sec) {
  const n = Number(sec) || 0;
  if (n <= 0) return "제한없음";
  if (n % 60 === 0) return `⏱️ ${n / 60}분`;
  return `⏱️ ${n}초`;
}

let editingPromptId = null;

function resetPromptEditorForm() {
  editingPromptId = null;
  document.getElementById("editing-prompt-banner")?.classList.add("hidden");
  document.getElementById("btn-cancel-edit-prompt")?.classList.add("hidden");
  const btnAdd = document.getElementById("btn-add-prompt");
  if (btnAdd) btnAdd.textContent = "➕ 과제 저장";
  document.getElementById("new-prompt-title").value = "";
  document.getElementById("new-prompt-target").value = "";
  document.getElementById("new-prompt-korean").value = "";
  document.getElementById("new-prompt-answer").value = "";
  const strictEl = document.getElementById("new-prompt-strictness");
  if (strictEl) strictEl.value = "standard";
  const maxAttEl = document.getElementById("new-prompt-maxattempts");
  if (maxAttEl) maxAttEl.value = "1";
}

document.getElementById("btn-cancel-edit-prompt")?.addEventListener("click", () => {
  resetPromptEditorForm();
  renderTeacherPromptsTable();
});

function renderTeacherPromptsTable() {
  updateGeminiConfigUI();
  const tbody = document.getElementById("teacher-prompts-tbody");
  if (!tbody) return;

  if (koreanPrompts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center">등록된 한국어 제시문 과제가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = koreanPrompts
    .map((p) => {
      const gradeLabel = p.targetGrade === "all" ? "전학년" : `${p.targetGrade}학년`;
      const classLabel =
        !p.targetClass || p.targetClass === "all" ? "전체 반 공통" : `${p.targetClass}반 전용`;
      const isActive = p.active !== false;
      const isEditingThis = editingPromptId === p.id;
      const sMeta = getStrictnessMeta(p.strictness || "standard");
      const maxAtt = p.maxAttempts === undefined || p.maxAttempts === null ? 1 : Number(p.maxAttempts);
      const activeBadge = isActive
        ? `<div style="font-size:0.7rem;color:#16a34a;font-weight:700;margin-top:2px;">공개중</div>`
        : `<div style="font-size:0.7rem;color:#94a3b8;font-weight:600;margin-top:2px;">비공개(대기)</div>`;
      const limitBadge = `<span class="badge-cefr" style="background:${
        Number(p.timeLimitSec) > 0 ? "#fef3c7;color:#b45309" : "#f1f5f9;color:#475569"
      }">${formatLimitLabel(p.timeLimitSec)}</span><br/><span class="strictness-pill ${
        sMeta.mode
      }" style="margin-top:4px;font-size:0.7rem;padding:1px 6px;">${
        sMeta.shortLabel
      }</span><br/><span class="strictness-pill ${
        maxAtt <= 0 ? "fluency" : "strict"
      }" style="margin-top:3px;font-size:0.68rem;padding:1px 6px;">${formatMaxAttemptsLabel(maxAtt)}</span>`;

      const rowStyle = isEditingThis
        ? "background: #eff6ff; outline: 2px solid #3b82f6;"
        : isActive
        ? ""
        : "opacity: 0.62; background: #f8fafc;";

      return `
        <tr style="${rowStyle}">
          <td class="text-center">
            <input type="checkbox" class="toggle-switch toggle-prompt-active" data-id="${p.id}" ${
        isActive ? "checked" : ""
      } title="체크하면 해당 학년/반 학생 화면에 즉시 공개됩니다" />
            ${activeBadge}
          </td>
          <td><strong>${gradeLabel}</strong><br/><span style="font-size:0.78rem;color:#2563eb;font-weight:600;">${classLabel}</span></td>
          <td>${limitBadge}</td>
          <td><strong>${p.title}</strong></td>
          <td><strong>${p.koreanPrompt}</strong></td>
          <td>${p.targetGrammar || "-"}</td>
          <td>${p.referenceAnswer || "-"}</td>
          <td style="white-space: nowrap;">
            <button type="button" class="btn btn-outline btn-edit-prompt" data-id="${p.id}" style="padding: 0.3rem 0.55rem; font-size: 0.8rem; margin-right: 0.25rem; color: #2563eb; border-color: #93c5fd;">✏️ 수정</button>
            <button type="button" class="btn btn-outline btn-delete-prompt" data-id="${p.id}" style="padding: 0.3rem 0.55rem; font-size: 0.8rem; color: #dc2626; border-color: #fca5a5;">🗑️ 삭제</button>
          </td>
        </tr>
      `;
    })
    .join("");

  // 체크박스(학생 공개 토글) 이벤트 연결
  tbody.querySelectorAll(".toggle-prompt-active").forEach((chk) => {
    chk.addEventListener("change", async () => {
      const targetId = chk.getAttribute("data-id");
      const targetPrompt = koreanPrompts.find((p) => p.id === targetId);
      if (!targetPrompt) return;
      targetPrompt.active = chk.checked;
      saveKoreanPromptsToStorage();
      try {
        await syncPromptsToCloudDoc();
      } catch (e) {
        console.warn("클라우드 공개 상태 동기화 실패:", e);
      }
      renderTeacherPromptsTable();
      renderStudentKoreanMissions();
    });
  });

  // 수정 버튼 이벤트 연결
  tbody.querySelectorAll(".btn-edit-prompt").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-id");
      const targetPrompt = koreanPrompts.find((p) => p.id === targetId);
      if (!targetPrompt) return;

      editingPromptId = targetPrompt.id;
      const gradeEl = document.getElementById("new-prompt-grade");
      const classEl = document.getElementById("new-prompt-class");
      const limitEl = document.getElementById("new-prompt-timelimit");
      const strictEl = document.getElementById("new-prompt-strictness");
      const maxAttEl = document.getElementById("new-prompt-maxattempts");
      const activeEl = document.getElementById("new-prompt-active");

      if (gradeEl) {
        gradeEl.value = String(targetPrompt.targetGrade || "all");
        gradeEl.dispatchEvent(new Event("change"));
      }
      if (classEl) {
        classEl.value = String(targetPrompt.targetClass || "all");
      }
      if (limitEl) {
        const secStr = String(Number(targetPrompt.timeLimitSec) || 0);
        if (![...limitEl.options].some((o) => o.value === secStr)) {
          const customOpt = document.createElement("option");
          customOpt.value = secStr;
          customOpt.textContent = formatLimitLabel(secStr);
          limitEl.appendChild(customOpt);
        }
        limitEl.value = secStr;
      }
      if (strictEl) {
        strictEl.value = targetPrompt.strictness || "standard";
      }
      if (maxAttEl) {
        const attStr = String(
          targetPrompt.maxAttempts === undefined || targetPrompt.maxAttempts === null
            ? 1
            : Number(targetPrompt.maxAttempts)
        );
        if (![...maxAttEl.options].some((o) => o.value === attStr)) {
          const customAttOpt = document.createElement("option");
          customAttOpt.value = attStr;
          customAttOpt.textContent = formatMaxAttemptsLabel(attStr);
          maxAttEl.appendChild(customAttOpt);
        }
        maxAttEl.value = attStr;
      }
      if (activeEl) {
        activeEl.checked = targetPrompt.active !== false;
      }

      document.getElementById("new-prompt-title").value = targetPrompt.title || "";
      document.getElementById("new-prompt-target").value = targetPrompt.targetGrammar || "";
      document.getElementById("new-prompt-korean").value = targetPrompt.koreanPrompt || "";
      document.getElementById("new-prompt-answer").value = targetPrompt.referenceAnswer || "";

      document.getElementById("editing-prompt-banner")?.classList.remove("hidden");
      document.getElementById("btn-cancel-edit-prompt")?.classList.remove("hidden");
      const btnAdd = document.getElementById("btn-add-prompt");
      if (btnAdd) btnAdd.textContent = "💾 수정 내용 저장";

      renderTeacherPromptsTable();
      document.querySelector(".prompt-manager-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      document.getElementById("new-prompt-korean")?.focus();
    });
  });

  // 삭제 버튼 이벤트 연결
  tbody.querySelectorAll(".btn-delete-prompt").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-id");
      if (editingPromptId === targetId) {
        resetPromptEditorForm();
      }
      koreanPrompts = koreanPrompts.filter((p) => p.id !== targetId);
      saveKoreanPromptsToStorage();
      try {
        await syncPromptsToCloudDoc();
      } catch (e) {
        // 기본 예시이거나 로컬 전용 과제인 경우 무시
      }
      renderTeacherPromptsTable();
      renderStudentKoreanMissions();
    });
  });
}

// 학년 선택 시 반 선택 옵션 안내 연동 (1학년은 1~3반, 2·3학년은 1~4반)
document.getElementById("new-prompt-grade")?.addEventListener("change", (e) => {
  const gradeVal = e.target.value;
  const classSelect = document.getElementById("new-prompt-class");
  if (!classSelect) return;
  const opt4 = classSelect.querySelector('option[value="4"]');
  if (opt4) {
    opt4.disabled = gradeVal === "1";
    if (gradeVal === "1" && classSelect.value === "4") {
      classSelect.value = "all";
    }
  }
});

// 한국어 제시문 + 목표 문법으로부터 표준 모범 답안을 비동기로 자동 생성하는 헬퍼 (교사 과제 출제용)
async function generateModelAnswerForTeacher(koreanPrompt, targetGrammar) {
  let autoTranslatedRef = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(koreanPrompt)}&langpair=ko|en`,
      { signal: controller.signal }
    ).finally(() => clearTimeout(timer));
    if (res.ok) {
      const data = await res.json();
      if (data?.responseData?.translatedText) {
        autoTranslatedRef = data.responseData.translatedText;
      }
    }
  } catch (e) {
    // 네트워크 제한 시 내장 한->영 구문 합성기 사용
  }
  return synthesizeModelAnswerFromKorean({
    koreanPrompt,
    targetGrammar,
    referenceAnswer: "",
    autoTranslatedRef
  });
}

// [✨ 모범답안 자동완성] 버튼 클릭 이벤트
document.getElementById("btn-auto-generate-answer")?.addEventListener("click", async () => {
  const koreanPrompt = document.getElementById("new-prompt-korean")?.value.trim() || "";
  const targetGrammar = document.getElementById("new-prompt-target")?.value.trim() || "";
  const answerInput = document.getElementById("new-prompt-answer");
  const btnAuto = document.getElementById("btn-auto-generate-answer");

  if (!koreanPrompt) {
    return alert("먼저 학생에게 제시할 한국어 문장을 입력해 주세요.");
  }

  const origLabel = btnAuto.textContent;
  btnAuto.disabled = true;
  btnAuto.textContent = "⏳ 생성 중...";
  try {
    const generated = await generateModelAnswerForTeacher(koreanPrompt, targetGrammar);
    if (answerInput) {
      answerInput.value = generated;
    }
  } finally {
    btnAuto.disabled = false;
    btnAuto.textContent = origLabel;
  }
});

document.getElementById("btn-add-prompt")?.addEventListener("click", async () => {
  const targetGrade = document.getElementById("new-prompt-grade").value;
  const targetClass = document.getElementById("new-prompt-class")?.value || "all";
  const timeLimitSec = Number(document.getElementById("new-prompt-timelimit")?.value ?? 180);
  const strictness = document.getElementById("new-prompt-strictness")?.value || "standard";
  const maxAttemptsRaw = document.getElementById("new-prompt-maxattempts")?.value;
  const maxAttempts =
    maxAttemptsRaw === undefined || maxAttemptsRaw === "" ? 1 : Number(maxAttemptsRaw);
  const active = document.getElementById("new-prompt-active")?.checked ?? true;
  const title = document.getElementById("new-prompt-title").value.trim();
  const targetGrammar = document.getElementById("new-prompt-target").value.trim();
  const koreanPrompt = document.getElementById("new-prompt-korean").value.trim();
  let referenceAnswer = document.getElementById("new-prompt-answer").value.trim();

  if (!title || !koreanPrompt) {
    return alert("과제명과 학생에게 제시할 한국어 문장을 입력해 주세요.");
  }

  if (!referenceAnswer) {
    referenceAnswer = await generateModelAnswerForTeacher(koreanPrompt, targetGrammar);
  }

  const isRealTeacher = Boolean(currentUser);
  const isEditing = Boolean(editingPromptId);

  if (isEditing) {
    const idx = koreanPrompts.findIndex((p) => p.id === editingPromptId);
    if (idx !== -1) {
      koreanPrompts[idx] = {
        ...koreanPrompts[idx],
        targetGrade,
        targetClass,
        timeLimitSec,
        strictness,
        maxAttempts,
        active,
        title,
        koreanPrompt,
        targetGrammar,
        referenceAnswer,
        updatedAtMs: Date.now()
      };
    }
  } else {
    const newPromptObj = {
      id: isRealTeacher ? `cloud-${Date.now()}` : `kp-${Date.now()}`,
      targetGrade,
      targetClass,
      timeLimitSec,
      strictness,
      maxAttempts,
      active,
      title,
      koreanPrompt,
      targetGrammar,
      referenceAnswer,
      createdAtMs: Date.now()
    };
    koreanPrompts.unshift(newPromptObj);
  }

  saveKoreanPromptsToStorage();

  try {
    if (isRealTeacher) {
      await syncPromptsToCloudDoc();
    }
  } catch (e) {
    console.error("클라우드 과제 저장 오류:", e);
  }

  resetPromptEditorForm();
  renderTeacherPromptsTable();
  renderStudentKoreanMissions();

  const targetDesc = `${targetGrade === "all" ? "전학년" : targetGrade + "학년"} ${
    targetClass === "all" ? "전체 반" : targetClass + "반"
  }`;
  const sMeta = getStrictnessMeta(strictness);
  const attLabel = formatMaxAttemptsLabel(maxAttempts);
  const statusDesc = active ? "즉시 학생 공개(☑️)" : "비공개 보관(나중에 체크 시 공개)";
  alert(
    isEditing
      ? `✅ [${targetDesc} / ${formatLimitLabel(timeLimitSec)} / ${sMeta.shortLabel} / ${attLabel} / ${statusDesc}] 과제 수정 내용이 저장되었습니다!`
      : `✅ [${targetDesc} / ${formatLimitLabel(timeLimitSec)} / ${sMeta.shortLabel} / ${attLabel} / ${statusDesc}] 새 과제가 저장되었습니다!`
  );
});

// ============================================================================
// [방법 ①: Google Gemini AI 실시간 하이브리드 채점 호출 함수 (2초 타임아웃 & 자동 폴백)]
// ============================================================================
async function callGeminiHybridGrading({
  koreanPrompt,
  targetGrammar,
  referenceAnswer,
  strictness,
  studentContent,
  fetchWithTimeout
}) {
  if (!geminiAiEnabled || !studentContent) return null;
  try {
    const promptText = `당신은 한국 중학교 영어 서술형 채점 교사입니다.
한국어 제시문: "${koreanPrompt || "자유 주제"}"
핵심 목표 문법: "${targetGrammar || "자유 표현"}"
교사 모범 답안(복수 정답 포함): "${referenceAnswer || ""}"
채점 엄격도: "${strictness}" (strict=100% 어순·관사·단복수 일치해야 만점, standard=표준 정밀 채점, fluency=격려 채점)
학생 답안: "${studentContent}"

어순 오류(예: money like vs like money), 단복수 수일치(예: Tax are vs Taxes are), 관사 누락(예: in piggy bank vs in a piggy bank), 동사 누락 등을 엄격히 검사하여 아래 JSON 형식으로만 응답하세요:
{
  "score": 0~100 사이 정수(오류가 하나라도 있으면 절대 100점 불가),
  "feedbackItems": [
    {"original": "학생 오류 부분", "corrected": "올바른 교정 표현", "explanation": "친절한 한국어 문법/어순 설명"}
  ],
  "overallComment": "학생을 위한 1~2문장 한국어 총평"
}`;

    const geminiBody = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });
    let res = null;
    // 1) 서버 함수 (키는 서버에만 있어요)
    try {
      const idToken = currentUser ? await getIdToken(currentUser) : "";
      if (idToken) {
        res = await fetchWithTimeout(
          GEMINI_PROXY_URL,
          {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
            body: geminiBody
          },
          6000
        );
      }
    } catch (e) {
      res = null;
    }
    // 2) 교사 화면에서 테스트할 때만: 교사 브라우저에 있는 키로 직접 호출
    if ((!res || !res.ok) && geminiApiKey && currentUser && TEACHER_EMAILS.includes((currentUser.email || "").toLowerCase())) {
      res = await fetchWithTimeout(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiApiKey },
          body: geminiBody
        },
        2200
      );
    }
    if (!res) return null;
    if (!res.ok) return null;
    const data = await res.json();
    const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) return null;
    return JSON.parse(rawJson);
  } catch (e) {
    // 타임아웃(2.2초) 또는 API 한도 초과 시 지연 없이 내장 정밀 엔진으로 즉시 폴백
    return null;
  }
}

// ============================================================================
// 6. 학생 기능: 글자/단어 수 계산, AI 작문 평가 요청 및 제한시간 강제 발송 처리
// ============================================================================
essayContent.addEventListener("input", () => {
  const words = essayContent.value.trim().split(/\s+/).filter(Boolean);
  wordCountNum.textContent = words.length;
});

let isSubmittingEssay = false;

async function submitEssayProcess({ isForcedByTimeout = false } = {}) {
  if (isSubmittingEssay) return;
  if (!currentUser || !currentStudentInfo) {
    if (!isForcedByTimeout) alert("먼저 로그인해 주세요.");
    return;
  }

  let rawContent = essayContent.value.trim();
  const { grade, classNum, number: studentNumber, name: studentName, studentId } = currentStudentInfo;

  let topic = "";
  let koreanPrompt = "";
  let targetGrammar = "";
  let referenceAnswer = "";
  let strictness = "standard";
  let missionTimeLimitSec = 0;
  let selectedMissionObj = null;

  if (currentWritingMode === "korean_prompt") {
    const selectedMission =
      koreanPrompts.find((p) => p.id === selectKoreanMission.value) || koreanPrompts[0];
    if (!selectedMission) {
      if (!isForcedByTimeout) alert("선택된 한국어 제시문 과제가 없습니다.");
      return;
    }
    selectedMissionObj = selectedMission;
    missionTimeLimitSec = Number(selectedMission.timeLimitSec) || 0;
    topic = selectedMission.title;
    koreanPrompt = selectedMission.koreanPrompt;
    targetGrammar = selectedMission.targetGrammar || "";
    referenceAnswer = selectedMission.referenceAnswer || "";
    strictness = selectedMission.strictness || "standard";

    // 제출 횟수 제한 검사 (기본 1회, 0이면 무제한, 교사 테스트 계정은 무제한 허용)
    const maxAttempts =
      selectedMission.maxAttempts === undefined || selectedMission.maxAttempts === null
        ? 1
        : Number(selectedMission.maxAttempts);
    const usedAttempts = getStudentUsedAttemptsForMission(selectedMission);
    const isTeacherTesting = studentId === "TEACHER";

    if (!isTeacherTesting && maxAttempts > 0 && usedAttempts >= maxAttempts) {
      stopMissionTimer();
      essayContent.disabled = true;
      btnSubmitEssay.disabled = true;
      btnSubmitEssay.textContent = `🔒 제출 완료 (${usedAttempts}/${maxAttempts}회 제출 완료 — 추가 제출 불가)`;
      if (!isForcedByTimeout) {
        alert(`이 과제는 최대 ${maxAttempts}회까지만 제출할 수 있습니다. (이미 ${usedAttempts}회 제출 완료)`);
      }
      return;
    }
  } else {
    topic = essayTopic.value.trim();
  }

  if (!isForcedByTimeout && (!topic || !rawContent)) {
    return alert("과제(주제)와 영어 작문 본문을 모두 입력해 주세요.");
  }

  // 타이머 중지 및 상태 표시 업데이트
  stopMissionTimer();
  if (isForcedByTimeout) {
    if (!rawContent) {
      rawContent = "(제한시간 초과로 미작성 상태에서 자동 발송됨)";
      essayContent.value = rawContent;
    }
    if (timerControlBar) {
      timerControlBar.classList.remove("hidden");
      timerControlBar.classList.add("urgent");
    }
    if (timerStatusLabel) {
      timerStatusLabel.textContent = "🚨 제한시간 종료! 그때까지 작성한 답안이 선생님께 자동 강제 발송되었습니다.";
    }
    if (timerCountdownEl) {
      timerCountdownEl.textContent = "00:00 (강제발송 완료)";
    }
  } else if (missionTimeLimitSec > 0) {
    if (timerStatusLabel) {
      timerStatusLabel.textContent = "✅ 제한시간 내에 영작 제출 및 채점을 완료했습니다!";
    }
  }

  const content = rawContent;
  const wordCount =
    content === "(제한시간 초과로 미작성 상태에서 자동 발송됨)"
      ? 0
      : content.split(/\s+/).filter(Boolean).length;

  isSubmittingEssay = true;
  btnSubmitEssay.disabled = true;
  document.getElementById("eval-empty").classList.add("hidden");
  document.getElementById("eval-result").classList.add("hidden");
  document.getElementById("eval-loading").classList.remove("hidden");

  try {
    let evalResult = null;
    let autoTranslatedRef = "";
    let ltMatches = [];
    let geminiResult = null;

    // 1. 실시간 신경망 번역 + LanguageTool 외부 문법 엔진 + Gemini AI(선택)를 병렬 호출 (최대 2.0초 타임아웃으로 지연 완벽 방지!)
    const fetchWithTimeout = (url, options = {}, ms = 2000) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), ms);
      return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timer));
    };

    await Promise.allSettled([
      (async () => {
        if (currentWritingMode === "korean_prompt" && koreanPrompt && (!referenceAnswer || !referenceAnswer.trim())) {
          const res = await fetchWithTimeout(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent(koreanPrompt)}&langpair=ko|en`,
            {},
            2000
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.responseData?.translatedText) {
              autoTranslatedRef = data.responseData.translatedText;
            }
          }
        }
      })(),
      (async () => {
        if (content && content !== "(제한시간 초과로 미작성 상태에서 자동 발송됨)") {
          const res = await fetchWithTimeout(
            "https://api.languagetool.org/v2/check",
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: `text=${encodeURIComponent(content)}&language=en-US`
            },
            2000
          );
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data?.matches)) {
              ltMatches = data.matches;
            }
          }
        }
      })(),
      (async () => {
        if (content && content !== "(제한시간 초과로 미작성 상태에서 자동 발송됨)") {
          geminiResult = await callGeminiHybridGrading({
            koreanPrompt,
            targetGrammar,
            referenceAnswer,
            strictness,
            studentContent: content,
            fetchWithTimeout
          });
        }
      })()
    ]);

    // 2. 5대 통합 정밀 채점 엔진 실행 (엄격도 3단계 + 구문 블록 매칭 + 1:1 Diff + LanguageTool 중복감점 방지 + Gemini AI 하이브리드)
    evalResult = evaluateWritingLocally({
      mode: currentWritingMode,
      topic,
      koreanPrompt,
      targetGrammar,
      referenceAnswer,
      strictness,
      autoTranslatedRef,
      ltMatches,
      geminiResult,
      content,
      studentName
    });

    if (isForcedByTimeout) {
      evalResult.overallComment =
        `⏰ [제한시간 종료 강제 발송] 제한시간이 지나 그때까지 작성한 내용("${content}")이 자동 제출되었습니다. ` +
        (evalResult.overallComment || "");
    }

    renderEvaluationResult(evalResult, currentWritingMode, targetGrammar);

    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];
    const timeStr = now.toTimeString().split(" ")[0].slice(0, 5);

    const newRecord = {
      appTag: "writing1_submission", // cloze-a8e6c vocab_results 컬렉션 내 영작문 제출 식별 태그
      bookId: "__writing1__", // 단어숲(danuhsup) 통계와 절대 섞이지 않도록 전용 bookId 부여
      missionId: selectedMissionObj?.id || "",
      ts: Date.now(),
      uid: currentUser.uid,
      studentEmail: currentUser.email.toLowerCase(),
      studentId,
      studentName,
      grade,
      classNum,
      className: `${classNum}반`,
      studentNumber,
      mode: currentWritingMode,
      topic,
      koreanPrompt,
      targetGrammar,
      originalContent: content,
      forcedTimeout: Boolean(isForcedByTimeout),
      wordCount,
      cefrLevel: evalResult.cefrLevel,
      score: evalResult.score,
      meaningAccuracy: evalResult.meaningAccuracy ?? evalResult.score,
      targetExpressionUsed: evalResult.targetExpressionUsed ?? true,
      correctedText: evalResult.correctedText,
      modelAnswer: evalResult.modelAnswer || evalResult.correctedText,
      grammarFeedback: evalResult.grammarFeedback,
      vocabularySuggestions: evalResult.vocabularySuggestions,
      overallComment: evalResult.overallComment,
      dateString: todayStr,
      submittedTimeStr: `${todayStr} ${timeStr}`,
      createdAtMs: Date.now(),
      createdAt: serverTimestamp()
    };

    // 브라우저 로컬 저장소에도 항상 백업 기록 (같은 기기에서 학생/교사 전환 시에도 100% 즉시 확인 가능)
    try {
      const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
      const { createdAt, ...serializableRecord } = newRecord;
      localSaved.unshift(serializableRecord);
      studentSubmissionsCache.unshift(serializableRecord);
      localStorage.setItem("MY_WRITING_LOCAL_SUBMISSIONS", JSON.stringify(localSaved.slice(0, 300)));
    } catch (storageErr) {
      console.warn("로컬 백업 저장 실패:", storageErr);
    }

    try {
      // cloze-a8e6c 보안 규칙에서 학생 쓰기 및 교사 전체 읽기가 허용된 `vocab_results` 컬렉션 사용
      await addDoc(collection(db, "vocab_results"), newRecord);
      await loadStudentHistory();
    } catch (dbErr) {
      const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
      renderLocalStudentHistory(localSaved.filter((d) => d.uid === currentUser.uid || d.studentId === studentId));
    }
  } catch (error) {
    console.error(error);
    alert("오류: " + error.message);
  } finally {
    isSubmittingEssay = false;
    document.getElementById("eval-loading").classList.add("hidden");

    // 제출 직후 남은 제출 횟수 갱신 및 횟수 소진 시 즉시 버튼 잠금!
    if (currentWritingMode === "korean_prompt" && selectedMissionObj) {
      const maxAttempts =
        selectedMissionObj.maxAttempts === undefined || selectedMissionObj.maxAttempts === null
          ? 1
          : Number(selectedMissionObj.maxAttempts);
      const usedAttempts = getStudentUsedAttemptsForMission(selectedMissionObj);
      const isTeacherTesting = currentStudentInfo?.studentId === "TEACHER";
      const attemptsBadgeEl = document.getElementById("display-attempts-badge");

      if (attemptsBadgeEl) {
        if (maxAttempts <= 0) {
          attemptsBadgeEl.className = "strictness-pill fluency";
          attemptsBadgeEl.textContent = `♾️ 제출 횟수: 무제한 허용 (현재 ${usedAttempts}회 제출)`;
        } else {
          const remain = Math.max(0, maxAttempts - usedAttempts);
          attemptsBadgeEl.className = remain > 0 ? "strictness-pill standard" : "strictness-pill strict";
          attemptsBadgeEl.textContent =
            remain > 0
              ? `🔒 제출 기회: ${usedAttempts} / ${maxAttempts}회 (남은 기회 ${remain}회)`
              : `🔒 제출 완료: ${usedAttempts} / ${maxAttempts}회 (추가 제출 불가)`;
        }
      }

      if (!isTeacherTesting && maxAttempts > 0 && usedAttempts >= maxAttempts) {
        essayContent.disabled = true;
        btnSubmitEssay.disabled = true;
        btnSubmitEssay.textContent = `🔒 제출 완료 (${usedAttempts}/${maxAttempts}회 제출 완료 — 추가 제출 불가)`;
      } else {
        essayContent.disabled = false;
        btnSubmitEssay.disabled = false;
        btnSubmitEssay.textContent = "🤖 AI 채점 및 피드백 받기";
      }
    } else {
      // 자유 작문 모드에서도 기본적으로 1회 제출 후 같은 주제는 버튼 잠금 (주제를 바꾸면 다시 활성화)
      const isTeacherTesting = currentStudentInfo?.studentId === "TEACHER";
      if (!isTeacherTesting) {
        btnSubmitEssay.disabled = true;
        btnSubmitEssay.textContent = "🔒 제출 완료 (1/1회 제출 완료)";
      } else {
        essayContent.disabled = false;
        btnSubmitEssay.disabled = false;
      }
    }
  }
}

btnSubmitEssay.addEventListener("click", () => {
  submitEssayProcess({ isForcedByTimeout: false });
});

function renderEvaluationResult(evalResult, mode, targetGrammar) {
  document.getElementById("eval-result").classList.remove("hidden");
  document.getElementById("res-cefr").textContent = evalResult.cefrLevel;
  document.getElementById("res-score").textContent = evalResult.score;
  document.getElementById("res-meaning").textContent = evalResult.meaningAccuracy ?? evalResult.score;
  document.getElementById("res-corrected").textContent = evalResult.correctedText;
  document.getElementById("res-model-answer").textContent =
    evalResult.modelAnswer || evalResult.correctedText;
  document.getElementById("res-comment").textContent = evalResult.overallComment;

  const rubricBox = document.getElementById("res-rubric-breakdown");
  if (rubricBox) {
    if (evalResult.rubric) {
      const r = evalResult.rubric;
      const sMode = evalResult.strictnessMode || "standard";
      const sLabel = evalResult.strictnessLabel || "⚖️ 표준 정밀 채점";
      rubricBox.classList.remove("hidden");
      rubricBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.45rem;">
          <div style="font-weight: 700; color: #1e293b;">📏 4대 영역 정밀 채점 내역 (총 ${evalResult.score}점 / 100점 만점)</div>
          <span class="strictness-pill ${sMode}">${sLabel}</span>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.4rem;">
          <div>• 의미·어휘 전달: <strong>${r.meaning}</strong> / 40점</div>
          <div>• 목표 구문 활용: <strong>${r.target}</strong> / 30점</div>
          <div>• 영문법·어순: <strong>${r.grammar}</strong> / 20점</div>
          <div>• 대소문자·부호: <strong>${r.mechanics}</strong> / 10점</div>
        </div>
      `;
    } else {
      rubricBox.classList.add("hidden");
    }
  }

  const diffSec = document.getElementById("sec-visual-diff");
  const diffBox = document.getElementById("res-visual-diff");
  if (diffSec && diffBox) {
    if (evalResult.visualDiffHtml) {
      diffSec.classList.remove("hidden");
      diffBox.innerHTML = evalResult.visualDiffHtml;
    } else {
      diffSec.classList.add("hidden");
    }
  }

  const targetBanner = document.getElementById("res-target-status");
  if (mode === "korean_prompt" && targetGrammar) {
    targetBanner.classList.remove("hidden", "pass", "warn");
    if (evalResult.targetExpressionUsed) {
      targetBanner.classList.add("pass");
      targetBanner.textContent = `🎯 핵심 목표 표현(${targetGrammar})을 정확하게 활용했습니다!`;
    } else {
      targetBanner.classList.add("warn");
      targetBanner.textContent = `💡 핵심 목표 표현(${targetGrammar})이 누락되었거나 다르게 쓰였어요. 모범 답안을 참고해 보세요!`;
    }
  } else {
    targetBanner.classList.add("hidden");
  }

  const grammarList = document.getElementById("res-grammar-list");
  grammarList.innerHTML = (evalResult.grammarFeedback || [])
    .map(
      (item) =>
        `<li><strong>${item.original} → ${item.corrected}</strong><br/><span>${item.explanation}</span></li>`
    )
    .join("");

  const vocabList = document.getElementById("res-vocab-list");
  if (vocabList) {
    vocabList.innerHTML = (evalResult.vocabularySuggestions || [])
      .map(
        (v) =>
          `<li><strong>${v.word}</strong> (${v.meaning})<br/><em>예: ${v.example}</em></li>`
      )
      .join("");
  }
}

function renderLocalStudentHistory(records) {
  const tbody = document.getElementById("student-history-tbody");
  if (!records || records.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center">아직 제출한 작문 기록이 없습니다.</td></tr>`;
    return;
  }
  tbody.innerHTML = records
    .map((d) => {
      const isForced = Boolean(d.forcedTimeout) || String(d.topic || "").includes("시간초과");
      const modeBadge = d.mode === "korean_prompt" ? "🇰🇷제시문" : "📝자유";
      const forcedTag = isForced
        ? `<br/><span style="display:inline-block;margin-top:3px;background:#fee2e2;color:#b91c1c;font-weight:700;padding:2px 6px;border-radius:4px;font-size:0.74rem;">🚨 ⏰ 시간초과 강제발송</span>`
        : `<br/><span style="display:inline-block;margin-top:3px;background:#dcfce7;color:#15803d;font-weight:600;padding:2px 6px;border-radius:4px;font-size:0.74rem;">✅ 정상제출</span>`;
      const promptDisplay = d.koreanPrompt
        ? `<strong>${d.topic}</strong><br/><span style="font-size:0.82rem;color:#475569;">"${d.koreanPrompt}"</span>`
        : `<strong>${d.topic}</strong>`;
      return `
      <tr style="${isForced ? "background:#fff5f5;" : ""}">
        <td>${d.submittedTimeStr || d.dateString || "-"}</td>
        <td>${modeBadge}${forcedTag}</td>
        <td>${promptDisplay}</td>
        <td>${d.originalContent || "-"}</td>
        <td>${d.cefrLevel}</td>
        <td><strong>${d.score}점</strong></td>
        <td>${d.overallComment}</td>
      </tr>
    `;
    })
    .join("");
}

async function loadStudentHistory() {
  try {
    const q = query(
      collection(db, "vocab_results"),
      where("uid", "==", currentUser.uid)
    );
    const snapshot = await getDocs(q);

    const cloudDocs = snapshot.docs
      .map((doc) => doc.data())
      .filter((d) => d.appTag === "writing1_submission")
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));

    if (cloudDocs.length === 0) {
      const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
      const myLocal = localSaved.filter((d) => d.uid === currentUser.uid);
      studentSubmissionsCache = myLocal;
      renderLocalStudentHistory(myLocal);
      updateSelectedKoreanMissionDetail();
      return;
    }

    studentSubmissionsCache = cloudDocs;
    renderLocalStudentHistory(cloudDocs);
    updateSelectedKoreanMissionDetail();
  } catch (error) {
    const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
    const myLocal = localSaved.filter((d) => d.uid === currentUser.uid);
    studentSubmissionsCache = myLocal;
    renderLocalStudentHistory(myLocal);
    updateSelectedKoreanMissionDetail();
  }
}

// ============================================================================
// 7. 교사 대시보드 기능: 명렬표 연동 필터링, 제출 현황 집계, Chart.js & CSV 다운로드
// ============================================================================
const filterGradeEl = document.getElementById("filter-grade");
const filterClassEl = document.getElementById("filter-class");
const filterRosterStudentEl = document.getElementById("filter-roster-student");
const filterSubmitTypeEl = document.getElementById("filter-submit-type");

filterGradeEl.addEventListener("change", () => {
  const selectedGrade = filterGradeEl.value;
  updateClassDropdown(selectedGrade);
  populateRosterDropdown();
  applyTeacherFilters();
});

filterClassEl.addEventListener("change", () => {
  populateRosterDropdown();
  applyTeacherFilters();
});

filterRosterStudentEl.addEventListener("change", applyTeacherFilters);
filterSubmitTypeEl?.addEventListener("change", applyTeacherFilters);
document.getElementById("btn-apply-filter").addEventListener("click", applyTeacherFilters);

function updateClassDropdown(selectedGrade) {
  const currentClass = filterClassEl.value;
  if (selectedGrade === "all") {
    filterClassEl.innerHTML = `
      <option value="all">전체 반</option>
      <option value="1">1반</option>
      <option value="2">2반</option>
      <option value="3">3반</option>
      <option value="4">4반</option>
    `;
  } else {
    const classes = CLASSES_BY_GRADE[Number(selectedGrade)] || [1, 2, 3, 4];
    filterClassEl.innerHTML =
      `<option value="all">전체 반</option>` +
      classes.map((c) => `<option value="${c}">${c}반</option>`).join("");
  }
  if ([...filterClassEl.options].some((o) => o.value === currentClass)) {
    filterClassEl.value = currentClass;
  }
}

function populateRosterDropdown() {
  const gradeFilter = filterGradeEl.value;
  const classFilter = filterClassEl.value;

  const matchingRoster = STUDENT_ROSTER.filter((s) => {
    if (gradeFilter !== "all" && String(s.grade) !== gradeFilter) return false;
    if (classFilter !== "all" && String(s.classNum) !== classFilter) return false;
    return true;
  });

  filterRosterStudentEl.innerHTML =
    `<option value="all">명렬표 학생 선택 (${matchingRoster.length}명 전체)</option>` +
    matchingRoster
      .map(
        (s) =>
          `<option value="${s.studentId}">[${s.studentId}] ${s.grade}-${s.classNum} ${s.number}번 ${s.name}</option>`
      )
      .join("");
}

let unsubscribeTeacherSubmissions = null;
let latestCloudSubmissions = [];

function mergeTeacherSubmissions(cloudList = []) {
  const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
  const combined = [...cloudList, ...localSaved];
  const seenKeys = new Set();
  const deduped = [];

  for (const item of combined) {
    const key = item.ts
      ? `ts-${item.ts}-${item.studentId || ""}`
      : `${item.studentId}-${item.topic}-${item.originalContent}-${item.dateString}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      deduped.push(item);
    }
  }

  return deduped.sort((a, b) => (b.createdAtMs || b.ts || 0) - (a.createdAtMs || a.ts || 0));
}

// 다른 탭에서 학생이 강제발송/제출했을 때 교사 화면 즉시 갱신
window.addEventListener("storage", (e) => {
  if (e.key === "MY_WRITING_LOCAL_SUBMISSIONS" && !viewTeacher.classList.contains("hidden")) {
    allTeacherSubmissions = mergeTeacherSubmissions(latestCloudSubmissions);
    applyTeacherFilters();
  }
});

async function loadTeacherDashboard() {
  // 1. 먼저 로컬 저장소 + 기본 데이터로 즉시 렌더링
  allTeacherSubmissions = mergeTeacherSubmissions(latestCloudSubmissions);
  applyTeacherFilters();

  // 2. 실시간 클라우드 제출 구독 (학생이 시간초과로 강제발송되면 새로고침 없이 교사 화면에 즉시 표시)
  if (!unsubscribeTeacherSubmissions && currentUser && !currentUser.isDemo) {
    try {
      const q = query(
        collection(db, "vocab_results"),
        where("appTag", "==", "writing1_submission")
      );
      unsubscribeTeacherSubmissions = onSnapshot(
        q,
        (snapshot) => {
          latestCloudSubmissions = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
          allTeacherSubmissions = mergeTeacherSubmissions(latestCloudSubmissions);
          applyTeacherFilters();
        },
        (err) => {
          console.warn("교사 대시보드 실시간 구독 대신 로컬/1회 조회를 사용합니다:", err);
        }
      );
    } catch (e) {
      // 정적/권한 제한 환경에서는 로컬 병합 결과 유지
    }
  }
}

function isForcedSubmissionRecord(item) {
  return Boolean(item.forcedTimeout) || String(item.topic || "").includes("시간초과");
}

function applyTeacherFilters() {
  const gradeFilter = filterGradeEl.value;
  const classFilter = filterClassEl.value;
  const rosterStudentId = filterRosterStudentEl.value;
  const submitTypeFilter = filterSubmitTypeEl?.value || "all";
  const keywordFilter = document.getElementById("filter-student").value.trim();
  const startDate = document.getElementById("filter-date-start").value;
  const endDate = document.getElementById("filter-date-end").value;

  const targetRoster = STUDENT_ROSTER.filter((s) => {
    if (gradeFilter !== "all" && String(s.grade) !== gradeFilter) return false;
    if (classFilter !== "all" && String(s.classNum) !== classFilter) return false;
    if (rosterStudentId !== "all" && s.studentId !== rosterStudentId) return false;
    return true;
  });

  const filtered = allTeacherSubmissions.filter((item) => {
    const itemClassNum = item.classNum || String(item.className || "").replace("반", "");
    if (gradeFilter !== "all" && String(item.grade) !== gradeFilter) return false;
    if (classFilter !== "all" && String(itemClassNum) !== classFilter) return false;
    if (rosterStudentId !== "all" && String(item.studentId) !== rosterStudentId) return false;

    const isForced = isForcedSubmissionRecord(item);
    if (submitTypeFilter === "forced" && !isForced) return false;
    if (submitTypeFilter === "normal" && isForced) return false;

    if (
      keywordFilter &&
      !String(item.studentName || "").includes(keywordFilter) &&
      !String(item.studentId || "").includes(keywordFilter)
    ) {
      return false;
    }
    if (startDate && item.dateString < startDate) return false;
    if (endDate && item.dateString > endDate) return false;
    return true;
  });

  currentFilteredSubmissions = filtered;

  const uniqueSubmittedIds = new Set(filtered.map((d) => d.studentId || d.studentEmail));
  const forcedCount = filtered.filter((d) => isForcedSubmissionRecord(d)).length;
  const avgScore =
    filtered.length > 0
      ? Math.round((filtered.reduce((acc, cur) => acc + (Number(cur.score) || 0), 0) / filtered.length) * 10) / 10
      : 0;

  document.getElementById("stat-total-roster").textContent = `${targetRoster.length}명`;
  document.getElementById("stat-submitted-students").textContent = `${uniqueSubmittedIds.size}명`;
  document.getElementById("stat-total-submissions").innerHTML = `${filtered.length}건 <span style="font-size:0.85rem;color:#dc2626;">(강제발송 ${forcedCount}건)</span>`;
  document.getElementById("stat-avg-score").textContent = `${avgScore}점`;

  renderTeacherTable(filtered);
  renderTeacherCharts(filtered);
}

function renderTeacherTable(submissions) {
  const tbody = document.getElementById("teacher-submissions-tbody");
  if (submissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10" class="text-center">조건에 해당하는 제출 기록이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = submissions
    .map((d) => {
      const classLabel = d.classNum ? `${d.classNum}반` : d.className;
      const modeBadge = d.mode === "korean_prompt" ? "🇰🇷제시문" : "📝자유";
      const isForced = isForcedSubmissionRecord(d);
      const statusBadge = isForced
        ? `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;font-weight:800;padding:4px 8px;border-radius:6px;font-size:0.78rem;white-space:nowrap;">🚨 ⏰ 시간초과 강제발송</span>`
        : `<span style="display:inline-block;background:#dcfce7;color:#15803d;border:1px solid #86efac;font-weight:700;padding:4px 8px;border-radius:6px;font-size:0.78rem;white-space:nowrap;">✅ 시간 내 정상제출</span>`;
      const promptInfo = d.koreanPrompt
        ? `<strong>${d.topic}</strong><br/><span style="font-size:0.82rem;color:#475569;">"${d.koreanPrompt}"</span>`
        : `<strong>${d.topic}</strong>`;
      return `
      <tr style="${isForced ? "background-color: #fff5f5;" : ""}">
        <td style="white-space:nowrap;">${d.submittedTimeStr || d.dateString || "-"}</td>
        <td>${statusBadge}</td>
        <td><strong>${d.studentId || "-"}</strong></td>
        <td>${d.grade}학년 ${classLabel} ${d.studentNumber}번</td>
        <td><strong>${d.studentName}</strong></td>
        <td>${modeBadge}</td>
        <td>${promptInfo}</td>
        <td>${d.originalContent || "-"}</td>
        <td><strong>${d.score}점</strong><br/><span style="font-size:0.8rem;color:#2563eb;">(의미 ${d.meaningAccuracy ?? d.score}%)</span></td>
        <td>${d.overallComment}</td>
      </tr>
    `;
    })
    .join("");
}

function renderTeacherCharts(submissions) {
  const classMap = {};
  const studentCountMap = {};

  submissions.forEach((d) => {
    const classNum = d.classNum || String(d.className || "").replace("반", "");
    const classKey = `${d.grade}학년 ${classNum}반`;
    if (!classMap[classKey]) classMap[classKey] = { sum: 0, count: 0 };
    classMap[classKey].sum += Number(d.score) || 0;
    classMap[classKey].count += 1;

    const studentKey = `${d.studentName}(${d.studentId || d.grade + "-" + classNum})`;
    studentCountMap[studentKey] = (studentCountMap[studentKey] || 0) + 1;
  });

  const classLabels = Object.keys(classMap).sort();
  const classAverages = classLabels.map((k) =>
    Math.round((classMap[k].sum / classMap[k].count) * 10) / 10
  );

  const sortedStudents = Object.entries(studentCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (classAvgChart) classAvgChart.destroy();
  if (studentFreqChart) studentFreqChart.destroy();

  const ctxClass = document.getElementById("chart-class-avg").getContext("2d");
  classAvgChart = new Chart(ctxClass, {
    type: "bar",
    data: {
      labels: classLabels,
      datasets: [
        {
          label: "학급 평균 점수 (100점 만점)",
          data: classAverages,
          backgroundColor: "#3b82f6"
        }
      ]
    },
    options: { scales: { y: { beginAtZero: true, max: 100 } } }
  });

  const ctxFreq = document.getElementById("chart-student-freq").getContext("2d");
  studentFreqChart = new Chart(ctxFreq, {
    type: "bar",
    data: {
      labels: sortedStudents.map((s) => s[0]),
      datasets: [
        {
          label: "제출 횟수 (회)",
          data: sortedStudents.map((s) => s[1]),
          backgroundColor: "#10b981"
        }
      ]
    },
    options: { scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
  });
}

// CSV 다운로드 기능
document.getElementById("btn-export-csv").addEventListener("click", () => {
  if (currentFilteredSubmissions.length === 0) {
    return alert("다운로드할 제출 기록이 없습니다.");
  }

  const headers = [
    "제출일시",
    "제출상태(강제발송여부)",
    "학번",
    "학년",
    "반",
    "번호",
    "성명",
    "유형",
    "과제명/주제",
    "한국어제시문",
    "학생영작문",
    "CEFR등급",
    "점수",
    "의미전달정확도",
    "AI총평"
  ];
  const rows = currentFilteredSubmissions.map((d) => [
    d.submittedTimeStr || d.dateString || "",
    isForcedSubmissionRecord(d) ? "시간초과 강제발송" : "시간내 정상제출",
    d.studentId || "",
    d.grade || "",
    d.classNum || d.className || "",
    d.studentNumber || "",
    d.studentName || "",
    d.mode === "korean_prompt" ? "한국어제시문영작" : "자유영작",
    `"${String(d.topic || "").replace(/"/g, '""')}"`,
    `"${String(d.koreanPrompt || "").replace(/"/g, '""')}"`,
    `"${String(d.originalContent || "").replace(/"/g, '""')}"`,
    d.cefrLevel || "",
    d.score || 0,
    d.meaningAccuracy ?? d.score ?? 0,
    `"${String(d.overallComment || "").replace(/"/g, '""')}"`
  ]);

  const csvContent =
    "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `서울문영여중_영작문기록_${new Date().toISOString().split("T")[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});
