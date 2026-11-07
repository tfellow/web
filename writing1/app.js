// Firebase SDK (CDN 모듈 방식 - 빌드 도구 없이 바로 실행 가능)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
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
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 서울문영여자중학교 전체 명렬표(185명) 데이터 및 헬퍼 함수 불러오기
import {
  STUDENT_ROSTER,
  CLASSES_BY_GRADE,
  findStudentByEmail
} from "./students.js";

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
  "engwords@gmail.com"
];

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
  { ko: ["음식", "요리"], en: ["food", "dish", "meal", "cook"], label: "음식(food)" },
  { ko: ["음악", "노래"], en: ["music", "song", "sing"], label: "음악/노래(music/song)" },
  { ko: ["영화"], en: ["movie", "film"], label: "영화(movie)" },
  { ko: ["여행"], en: ["trip", "travel", "journey", "tour"], label: "여행(trip/travel)" },
  { ko: ["가족", "부모님"], en: ["family", "parents", "parent"], label: "가족/부모님(family/parents)" },
  { ko: ["시간"], en: ["time", "hour"], label: "시간(time)" },
  { ko: ["미래", "꿈"], en: ["future", "dream", "dreams"], label: "미래/꿈(future/dream)" }
];

// 영어 동의어/어근 정규화 헬퍼 (모범답안 비교 시 동일 의미 인정)
const EN_SYNONYM_GROUPS = [
  ["vet", "veterinarian"],
  ["beautiful", "pretty", "lovely", "gorgeous"],
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
  if (w.length > 4 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("es")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("is")) return w.slice(0, -1);
  return w;
}

/**
 * [정적 호스팅(GitHub Pages) & 로컬 서버 공통]
 * 4단계 루브릭 기반 한국어 제시문 & 영문법 정밀 평가 알고리즘
 * - 1영역: 의미 전달 정확도 (40점 만점) - 모범답안 어근/동의어 비교 + 한-영 개념 사전 매칭
 * - 2영역: 핵심 목표 표현/구문 정확도 (30점 만점) - 감탄문(What/How), 가주어(It~to), 목적(so that), 현재완료 등 구문 구조 정밀 검증
 * - 3영역: 일반 영문법 및 주어-동사 어순 (20점 만점) - 수일치, 관사(a/an), 조동사/to부정사 뒤 동사원형, 이중동사 오류 검출
 * - 4영역: 대소문자·철자·문장부호 완성도 (10점 만점)
 */
function evaluateWritingLocally({
  mode,
  topic,
  koreanPrompt,
  targetGrammar,
  referenceAnswer,
  content,
  studentName
}) {
  if (!content || content === "(제한시간 초과로 미작성 상태에서 자동 발송됨)") {
    return {
      cefrLevel: "A1",
      score: 0,
      meaningAccuracy: 0,
      targetExpressionUsed: false,
      rubric: { meaning: 0, target: 0, grammar: 0, mechanics: 0 },
      correctedText: "(제한시간 내 작성된 영어 문장이 없습니다.)",
      modelAnswer:
        referenceAnswer ||
        "제시된 한국어 문장의 핵심 주어와 동사를 먼저 파악한 뒤 시간 내에 작성을 시작해 보세요.",
      grammarFeedback: [
        {
          original: "(미작성 시간초과)",
          corrected: referenceAnswer || "모범 답안 참고",
          explanation: "제한시간이 종료되어 미작성 상태로 자동 제출되었습니다. 모범 답안을 확인하고 다시 도전해 보세요!"
        }
      ],
      vocabularySuggestions: [],
      overallComment:
        "제한시간 동안 작성된 영작문이 없어 0점으로 자동 발송되었습니다. [타이머 재시작]을 눌러 모범 답안 표현을 연습해 보세요!"
    };
  }

  const safeContent = maskPersonalInfoClient(content, studentName).trim();
  const words = safeContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const englishWordsOnly = safeContent.match(/[a-zA-Z']+/g) || [];
  const hasKoreanChars = /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(safeContent);

  // 영어가 아예 없거나 무의미한 글자(예: asdf, 한글만 입력)인 경우 즉시 감점 처리
  if (englishWordsOnly.length === 0) {
    return {
      cefrLevel: "A1",
      score: 5,
      meaningAccuracy: 0,
      targetExpressionUsed: false,
      rubric: { meaning: 0, target: 0, grammar: 2, mechanics: 3 },
      correctedText: referenceAnswer || "Please write your sentence in English.",
      modelAnswer: referenceAnswer || "제시된 한국어 문장을 영어 단어로 바꾸어 작성해 보세요.",
      grammarFeedback: [
        {
          original: safeContent,
          corrected: referenceAnswer || "영어 문장으로 작성 필요",
          explanation: "영어 단어가 인식되지 않았습니다. 한국어 제시문의 의미를 영어 주어+동사 문장으로 작성해 주세요!"
        }
      ],
      vocabularySuggestions: [],
      overallComment: "영어 문장이 입력되지 않아 채점이 제한되었습니다. 제시된 목표 표현을 활용해 영어로 다시 작성해 보세요!"
    };
  }

  const grammarFeedback = [];
  let correctedText = safeContent.replace(/\s+/g, " ").trim();
  const lowerContent = correctedText.toLowerCase();

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
    // 감탄문인데 마침표로 끝낸 경우 자연스럽게 ! 권장 (감점은 1점만)
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

  if (hasKoreanChars) {
    grammarScore -= 8;
    grammarFeedback.push({
      original: safeContent.match(/[가-힣]+/g)?.join(", ") || "한국어 포함",
      corrected: "영어 표현으로 변환 필요",
      explanation: "[미번역 한국어 포함] 영작문 안에 한국어가 그대로 남아 있습니다. 모든 단어를 영어로 영작해 주세요."
    });
  }

  // 3-1. 문장 내 동사 존재 여부 확인
  const commonVerbsRegex =
    /\b(am|is|are|was|were|be|been|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|like|likes|liked|love|loves|loved|want|wants|wanted|need|needs|help|helps|helped|learn|learns|learned|study|studies|studied|go|goes|went|gone|come|comes|came|make|makes|made|take|takes|took|see|sees|saw|seen|know|knows|knew|think|thinks|thought|get|gets|got|give|gives|gave|find|finds|found|tell|tells|told|work|works|worked|call|calls|try|tries|tried|ask|asks|feel|feels|felt|become|becomes|became|leave|leaves|left|put|puts|mean|means|keep|keeps|kept|let|lets|begin|begins|began|seem|seems|show|shows|hear|hears|heard|play|plays|played|run|runs|ran|move|moves|live|lives|lived|believe|believes|bring|brings|happen|happens|write|writes|wrote|written|sit|sits|sat|stand|stands|lose|loses|lost|pay|pays|meet|meets|met|include|includes|continue|continues|set|sets|change|changes|lead|leads|understand|understands|watch|watches|watched|follow|follows|stop|stops|create|creates|speak|speaks|spoke|read|reads|allow|allows|add|adds|spend|spends|spent|grow|grows|grew|open|opens|walk|walks|walked|win|wins|won|offer|offers|remember|remembers|consider|considers|appear|appears|buy|buys|bought|wait|waits|serve|serves|die|dies|send|sends|sent|expect|expects|build|builds|built|stay|stays|stayed|fall|falls|fell|cut|cuts|reach|reaches|kill|kills|remain|remains|suggest|suggests|raise|raises|pass|passes|sell|sells|sold|require|requires|report|reports|decide|decides|pull|pulls|bloom|blooms|bloomed|wear|wears|wore|worn|visit|visited|visits|communicate|communicates|protect|protects|exercise|exercises|eat|eats|ate|drink|drinks|drank|sleep|sleeps|slept|sing|sings|sang|swim|swims|swam|teach|teaches|taught|fly|flies|flew)\b/i;

  if (!commonVerbsRegex.test(correctedText) && !/\b[a-z]+(ed|ing|es)\b/i.test(correctedText)) {
    grammarScore -= 10;
    grammarFeedback.push({
      original: correctedText,
      corrected: referenceAnswer || `${correctedText.replace(/[.!?]+$/, "")} is ...`,
      explanation: "[동사 누락 주의] 영어 문장에는 주어의 상태나 동작을 나타내는 동사(be동사 또는 일반동사)가 반드시 포함되어야 합니다."
    });
  }

  // 3-2. 주어-동사 수일치 (Subject-Verb Agreement) 검사
  const svaRules = [
    {
      pattern: /\bI\s+(is|are|was|has|does)\b/g,
      fix: (m, v) => `I ${v === "is" || v === "are" ? "am" : v === "has" ? "have" : v === "does" ? "do" : "was"}`,
      desc: "주어 'I' 뒤에는 'am'(현재) 또는 'have/do'를 사용해야 합니다."
    },
    {
      pattern: /\b(he|she|it)\s+(are|am|were|have|do|want|like|love|need|help|bloom|go)\b/gi,
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
          go: "goes"
        };
        return `${subj} ${map[vl] || v}`;
      },
      desc: "3인칭 단수 주어(he/she/it) 뒤에는 단수 동사(is/was/has/does 또는 동사원형+s/es)를 써야 합니다."
    },
    {
      pattern: /\b(they|we|you)\s+(is|was|has|does|wants|likes|loves|helps|goes|blooms)\b/gi,
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
          blooms: "bloom"
        };
        return `${subj} ${map[vl] || v}`;
      },
      desc: "복수 주어(we/you/they) 뒤에는 복수 동사(are/were/have/do 또는 동사원형)를 써야 합니다."
    },
    {
      pattern: /\b(am|is|are|was|were)\s+(like|love|want|need|know|have|go|come|bloom|help|learn|think)\b/gi,
      fix: (m, beV, mainV) => mainV,
      desc: "[이중 동사 오류] be동사(am/is/are)와 일반동사 원형을 나란히 함께 쓸 수 없습니다. 일반동사만 단독으로 사용하세요."
    },
    {
      pattern: /\b(can|could|will|would|should|must|may|to)\s+([a-z]+(s|ed|ing))\b/gi,
      check: (m) => !/\bto\s+(bed|morning|evening|spring|feeling|something|nothing|everything|anything|building|painting|reading)\b/i.test(m),
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
      desc: "모음 소리(a, e, i, o, u)로 시작하는 단수 명사 앞에는 부정관사 'a' 대신 'an'을 씁니다."
    },
    {
      pattern: /\ban\s+([bcdfghjklmnpqrstvwxyz][a-z]+)\b/gi,
      check: (m, word) => !/^(hour|honest|honor)\b/i.test(word),
      fix: (m, word) => `a ${word}`,
      desc: "자음 소리로 시작하는 단수 명사 앞에는 부정관사 'an' 대신 'a'를 씁니다."
    }
  ];

  for (const rule of svaRules) {
    const match = correctedText.match(rule.pattern);
    if (match) {
      if (rule.check && ! correctedText.replace(rule.pattern, (m, g1, g2) => (rule.check(m, g1, g2) ? "HIT" : m)).includes("HIT")) {
        continue;
      }
      const before = correctedText;
      correctedText = correctedText.replace(rule.pattern, rule.fix);
      if (before !== correctedText) {
        grammarScore -= 6;
        grammarFeedback.push({
          original: match[0],
          corrected: correctedText,
          explanation: `[문법 교정] ${rule.desc}`
        });
      }
    }
  }
  grammarScore = Math.max(0, grammarScore);

  // ============================================================================
  // [2영역] 핵심 목표 표현/구문 구조 정밀 검사 (30점 만점)
  // ============================================================================
  let targetScore = 30;
  let targetExpressionUsed = true;
  let generatedAlternativeModel = "";
  const tgLower = (targetGrammar || "").toLowerCase();

  if (mode === "korean_prompt" && targetGrammar && targetGrammar.trim()) {
    // Case A: 감탄문 (What / How) 정밀 구문 판별
    if (tgLower.includes("what") && tgLower.includes("how")) {
      const startsWithWhat = /^what\b/i.test(correctedText);
      const startsWithHow = /^how\b/i.test(correctedText);

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
      } else if (startsWithWhat) {
        // What 감탄문 어순: What + (a/an) + 형용사 + 명사 (+ 주어 + 동사)!
        // 1) 의문문 어순 오류 검사 (예: What a beautiful flower is it!)
        if (/\b(is|are|was|were)\s+(it|they|this|that|he|she)\s*[.!?]*$/i.test(correctedText)) {
          targetScore -= 10;
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
        }

        // 2) 단수 가산명사 앞 a/an 누락 검사 (예: What beautiful flower it is!)
        const whatNoArticleMatch = correctedText.match(
          /^What\s+(?!a\b|an\b)([a-z]+)\s+([a-z]+)(?:\s+(it|this|that|he|she)\s+(is|was))?/i
        );
        if (whatNoArticleMatch) {
          const adj = whatNoArticleMatch[1];
          const noun = whatNoArticleMatch[2];
          const isPluralOrUncountable =
            /s$/i.test(noun) ||
            /^(weather|music|water|news|information|advice|time|food|money|air|fun)$/i.test(noun);
          if (!isPluralOrUncountable) {
            targetScore -= 8;
            const article = /^[aeiou]/i.test(adj) ? "an" : "a";
            const fixedArticle = correctedText.replace(/^What\s+/i, `What ${article} `);
            grammarFeedback.push({
              original: correctedText,
              corrected: fixedArticle,
              explanation: `[What 감탄문 관사 교정] 셀 수 있는 단수 명사(${noun})가 있는 What 감탄문은 'What + ${article} + 형용사(${adj}) + 명사(${noun}) + 주어 + 동사!' 어순으로 써야 합니다.`
            });
            correctedText = fixedArticle;
          }
        }

        // What 감탄문을 완벽히 쓴 경우 -> How 감탄문 변환식도 모범답안에 함께 제시!
        const whatFullMatch = correctedText.match(
          /^What\s+(?:a|an)\s+([a-z]+)\s+([a-z]+)(?:\s+it\s+is)?\s*[.!?]*$/i
        );
        if (whatFullMatch) {
          const adj = whatFullMatch[1].toLowerCase();
          const noun = whatFullMatch[2].toLowerCase();
          generatedAlternativeModel = `${correctedText}  (💡 How 감탄문 변환: How ${adj} the ${noun} is!)`;
        }
      } else if (startsWithHow) {
        // How 감탄문에서 실수로 How a beautiful flower it is! 처럼 쓴 경우 검출
        const howWithNounMatch = correctedText.match(
          /^How\s+(?:a|an)\s+([a-z]+)\s+([a-z]+)\s+(it|this|that|he|she)\s+(is|was)\s*[.!?]*$/i
        );
        if (howWithNounMatch) {
          targetScore -= 12;
          const adj = howWithNounMatch[1];
          const noun = howWithNounMatch[2];
          const v = howWithNounMatch[4];
          const fixedHow = `How ${adj} the ${noun} ${v}!`;
          const fixedWhat = `What ${/^[aeiou]/i.test(adj) ? "an" : "a"} ${adj} ${noun} ${howWithNounMatch[3]} ${v}!`;
          grammarFeedback.push({
            original: correctedText,
            corrected: `${fixedHow} (또는 ${fixedWhat})`,
            explanation:
              "[How vs What 감탄문 혼동 교정] 'How' 뒤에는 'a/an + 형용사 + 명사'가 올 수 없고 'How + 형용사/부사 + 주어 + 동사!' 어순이어야 합니다."
          });
          correctedText = fixedHow;
        } else {
          const howFullMatch = correctedText.match(
            /^How\s+([a-z]+)\s+(?:the|this|that)\s+([a-z]+)\s+is\s*[.!?]*$/i
          );
          if (howFullMatch) {
            const adj = howFullMatch[1].toLowerCase();
            const noun = howFullMatch[2].toLowerCase();
            const art = /^[aeiou]/i.test(adj) ? "an" : "a";
            generatedAlternativeModel = `${correctedText}  (💡 What 감탄문 변환: What ${art} ${adj} ${noun} it is!)`;
          }
        }
      }
    } else if (/it\s*~?\s*to|가주어/i.test(targetGrammar)) {
      // Case B: 가주어-진주어 (It is ~ to부정사)
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
      // Case C: 목적 구문 (so that + 주어 + can/could/will + 동사원형)
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
      // Case D: 일반 목표 어휘/문법 키워드 검사
      const englishKeywords = targetGrammar
        .toLowerCase()
        .replace(/\([^)]*\)/g, "")
        .split(/[,/~]+/)
        .map((k) => k.trim())
        .filter((k) => /^[a-z\s']+$/i.test(k) && k.length >= 2);

      if (englishKeywords.length > 0) {
        targetExpressionUsed = englishKeywords.some((kw) =>
          correctedText.toLowerCase().includes(kw)
        );
        if (!targetExpressionUsed) {
          targetScore = 8;
          grammarFeedback.push({
            original: `목표 표현(${targetGrammar}) 미사용`,
            corrected: referenceAnswer || correctedText,
            explanation: `[목표 표현 누락] 선생님이 지정하신 핵심 표현("${targetGrammar}")을 포함하여 영작해 보세요!`
          });
        }
      }
    }
  }
  targetScore = Math.max(0, targetScore);

  // ============================================================================
  // [1영역] 한국어 제시문 의미 전달 정확도 산출 (40점 만점 / 의미 전달력 0~100%)
  // ============================================================================
  let meaningAccuracy = 100;
  let meaningScore = 40;
  const missingConceptLabels = [];

  if (mode === "korean_prompt") {
    const studentTokens = new Set(
      (correctedText.toLowerCase().match(/[a-z]+/g) || []).map(normalizeEnWord)
    );
    const studentRawLower = correctedText.toLowerCase();

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

    // 1-B. 교사 참고 모범 답안(referenceAnswer)이 있는 경우: 어근/동의어 일치율 정밀 계산
    const stopWords = new Set(["the", "a", "an", "to", "of", "in", "on", "at", "for", "with", "and"]);
    let refRatio = null;
    const missingRefWords = [];

    if (referenceAnswer && referenceAnswer.trim()) {
      const refRawWords = (referenceAnswer.toLowerCase().match(/[a-z]+/g) || []).filter(
        (w) => !stopWords.has(w)
      );
      if (refRawWords.length > 0) {
        let hitCount = 0;
        for (const rw of refRawWords) {
          const normRw = normalizeEnWord(rw);
          if (studentTokens.has(normRw) || studentRawLower.includes(rw)) {
            hitCount += 1;
          } else {
            missingRefWords.push(rw);
          }
        }
        refRatio = hitCount / refRawWords.length;
      }
    }

    const koRatio =
      matchedKoreanConcepts.length > 0 ? koConceptHit / matchedKoreanConcepts.length : null;

    if (refRatio !== null && koRatio !== null) {
      const combinedRatio = Math.max(refRatio, koRatio * 0.9 + refRatio * 0.1);
      meaningAccuracy = Math.round(combinedRatio * 100);
    } else if (refRatio !== null) {
      meaningAccuracy = Math.round(refRatio * 100);
    } else if (koRatio !== null) {
      meaningAccuracy = Math.round(koRatio * 100);
    } else {
      // 사전에 없는 새로운 한국어 문장이고 모범답안도 비어 있는 경우:
      // 문장 구조(주어+동사+목표표현)와 단어 수 충실도로 의미 전달력 산출
      const expectedMinWords = Math.max(3, Math.round((koreanPrompt || "").split(/\s+/).length * 0.9));
      const lengthRatio = Math.min(1, wordCount / expectedMinWords);
      meaningAccuracy = Math.round(
        (lengthRatio * 0.6 + (targetScore / 30) * 0.25 + (grammarScore / 20) * 0.15) * 100
      );
    }

    // 누락된 의미 어휘가 있으면 구체적으로 피드백에 안내!
    if (missingConceptLabels.length > 0) {
      grammarFeedback.push({
        original: `의미 누락/불일치 (${missingConceptLabels.join(", ")})`,
        corrected: referenceAnswer || `핵심 어휘(${missingConceptLabels.join(", ")}) 반영 필요`,
        explanation: `[의미 전달 점검] 한국어 제시문에 있는 ${missingConceptLabels.join(
          ", "
        )}의 의미가 영어 문장에서 확인되지 않았습니다.`
      });
    } else if (missingRefWords.length > 0 && meaningAccuracy < 85) {
      grammarFeedback.push({
        original: correctedText,
        corrected: referenceAnswer,
        explanation: `[모범답안 비교] 모범 답안의 핵심 어휘(${missingRefWords
          .slice(0, 4)
          .join(", ")})를 활용하면 제시문의 의미를 더 정확하게 전달할 수 있습니다.`
      });
    }

    meaningAccuracy = Math.min(100, Math.max(0, meaningAccuracy));
    meaningScore = Math.round((meaningAccuracy / 100) * 40);
  } else {
    // 자유 영작(free) 모드인 경우 분량 및 문장 다양성 반영
    meaningAccuracy = Math.min(100, Math.max(50, 70 + Math.min(30, wordCount)));
    meaningScore = Math.round((meaningAccuracy / 100) * 40);
  }

  // 교정 사항이 하나도 없는 완벽한 문장일 때 격려 피드백 추가
  if (grammarFeedback.length === 0) {
    grammarFeedback.push({
      original: safeContent,
      corrected: correctedText,
      explanation:
        "🌟 한국어 제시문의 의미 전달, 핵심 목표 구문 어순, 주어-동사 수일치, 문장부호까지 모두 100% 완벽하게 작성했습니다!"
    });
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
    referenceAnswer && referenceAnswer.trim()
      ? referenceAnswer
      : generatedAlternativeModel || correctedText;

  let overallComment = "";
  if (totalScore >= 95) {
    overallComment = `💯 [총점 ${totalScore}점] 제시문의 의미 전달(${meaningScore}/40점), 목표 구문 활용(${targetScore}/30점), 영문법 어순(${grammarScore}/20점), 표기법(${mechanicsScore}/10점) 모두 완벽합니다! 최고예요! 👏`;
  } else if (totalScore >= 80) {
    overallComment = `👍 [총점 ${totalScore}점] 핵심 의미를 잘 전달했으나 세부 항목(의미 ${meaningScore}/40, 목표구문 ${targetScore}/30, 문법 ${grammarScore}/20, 표기 ${mechanicsScore}/10)에서 아쉬운 부분을 교정 노트로 확인해 보세요!`;
  } else {
    overallComment = `💡 [총점 ${totalScore}점] 제시문과 어휘·구문 일치도를 높여 보세요(의미 ${meaningScore}/40, 목표구문 ${targetScore}/30, 문법 ${grammarScore}/20, 표기 ${mechanicsScore}/10). 아래 교정 설명과 모범 답안을 참고해 다시 도전해 보세요!`;
  }

  return {
    cefrLevel,
    score: totalScore,
    meaningAccuracy,
    targetExpressionUsed,
    rubric: {
      meaning: meaningScore,
      target: targetScore,
      grammar: grammarScore,
      mechanics: mechanicsScore
    },
    correctedText,
    modelAnswer: finalModelAnswer,
    grammarFeedback,
    vocabularySuggestions: [
      {
        word: targetGrammar || "sentence structure",
        meaning: targetGrammar ? "이번 과제 핵심 목표 표현/구문" : "영어 문장 구조",
        example: finalModelAnswer
      },
      ...(missingConceptLabels.length > 0
        ? [
            {
              word: missingConceptLabels.join(", "),
              meaning: "한국어 제시문에서 보완이 필요한 핵심 어휘",
              example: referenceAnswer || "제시문의 핵심 단어를 영작에 꼭 포함해 보세요."
            }
          ]
        : [
            {
              word: "expression",
              meaning: "표현, 어구",
              example: "Using the target expression accurately makes your writing shine!"
            }
          ])
    ],
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
const btnStartTimedMission = document.getElementById("btn-start-timed-mission");
const btnTestTimeout5s = document.getElementById("btn-test-timeout-5s");

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
  if (btnStartTimedMission) {
    btnStartTimedMission.classList.remove("hidden");
    btnStartTimedMission.textContent = "🔄 타이머 재시작";
  }
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

btnStartTimedMission?.addEventListener("click", () => {
  const selectedId = selectKoreanMission.value;
  const mission = koreanPrompts.find((p) => p.id === selectedId);
  if (!mission) return;
  const limitSec = Number(mission.timeLimitSec) || 180;
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;
  essayContent.focus();
  startMissionTimer(limitSec, mission.id);
});

// 5초 뒤 강제발송 즉시 테스트 버튼 (교사/학생이 시간 초과 자동 제출 동작을 5초 만에 바로 확인 가능)
btnTestTimeout5s?.addEventListener("click", () => {
  const selectedId = selectKoreanMission.value;
  const mission = koreanPrompts.find((p) => p.id === selectedId);
  if (!mission) return;
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;
  essayContent.focus();
  startMissionTimer(5, mission.id);
});

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

function updateSelectedKoreanMissionDetail() {
  stopMissionTimer();
  essayContent.disabled = false;
  btnSubmitEssay.disabled = false;

  const selectedId = selectKoreanMission.value;
  const mission = koreanPrompts.find((p) => p.id === selectedId);
  if (!mission) {
    displayKoreanSentence.textContent = "등록된 한국어 제시문이 없습니다.";
    displayTargetGrammar.textContent = "-";
    timerControlBar?.classList.add("hidden");
    return;
  }

  // 한국어 제시문과 핵심 목표 표현을 즉시 표시하고 입력창과 AI 채점 버튼을 항상 활성화
  displayKoreanSentence.textContent = `"${mission.koreanPrompt}"`;
  displayTargetGrammar.textContent = mission.targetGrammar || "자유 표현 (의미가 통하도록 영작)";

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
btnLogin.addEventListener("click", async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error("Google 로그인 실패:", error);
    alert("로그인 중 오류가 발생했습니다: " + error.message);
  }
});

btnLogout.addEventListener("click", async () => {
  stopMissionTimer();
  if (currentUser?.isDemo) {
    currentUser = null;
    currentStudentInfo = null;
    userInfoText.textContent = "로그인이 필요합니다";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    viewLogin.classList.remove("hidden");
    viewStudent.classList.add("hidden");
    viewTeacher.classList.add("hidden");
    return;
  }
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    currentUser = null;
    currentStudentInfo = null;
    userInfoText.textContent = "로그인이 필요합니다";
    btnLogin.classList.remove("hidden");
    btnLogout.classList.add("hidden");
    viewLogin.classList.remove("hidden");
    viewStudent.classList.add("hidden");
    viewTeacher.classList.add("hidden");
    return;
  }

  const email = (user.email || "").toLowerCase();
  const emailDomain = email.split("@")[1];
  const isRegisteredTeacher = TEACHER_EMAILS.includes(email);

  if (!isRegisteredTeacher && emailDomain !== ALLOWED_DOMAIN) {
    alert(`접근 제한: 서울문영여자중학교 계정(@${ALLOWED_DOMAIN}) 또는 등록된 교사 관리자 계정으로만 로그인이 가능합니다.`);
    await signOut(auth);
    return;
  }

  currentUser = user;
  const matchedStudent = findStudentByEmail(email);

  const isTeacher =
    isRegisteredTeacher || (!matchedStudent && !/^2026\d{5}@smy\.ms\.kr$/.test(email));

  if (isTeacher) {
    userInfoText.textContent = `${user.displayName || email} (교사 관리자)`;
    btnLogin.classList.add("hidden");
    btnLogout.classList.remove("hidden");
    viewLogin.classList.add("hidden");
    viewTeacher.classList.remove("hidden");
    viewStudent.classList.add("hidden");

    await loadKoreanPromptsFromCloud();
    subscribeKoreanPromptsFromCloud();
    renderTeacherPromptsTable();
    populateRosterDropdown();
    await loadTeacherDashboard();
  } else {
    currentStudentInfo = matchedStudent || {
      grade: 1,
      classNum: 1,
      number: 1,
      name: user.displayName || "학생",
      studentId: "미등록",
      email
    };

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

    await loadKoreanPromptsFromCloud();
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

function mergeCloudPromptsWithDefaults(cloudPrompts, hasBeenCustomized) {
  if (hasBeenCustomized) {
    return cloudPrompts.map((p) => ({
      targetClass: "all",
      timeLimitSec: 180,
      active: true,
      ...p
    }));
  }
  const cloudIds = new Set(cloudPrompts.map((p) => p.id));
  const defaultFiltered = DEFAULT_KOREAN_PROMPTS.filter((p) => !cloudIds.has(p.id));
  return [...cloudPrompts, ...defaultFiltered].map((p) => ({
    targetClass: "all",
    timeLimitSec: 180,
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
        if (snap.exists() && Array.isArray(snap.data().writing1_prompts)) {
          const data = snap.data();
          koreanPrompts = mergeCloudPromptsWithDefaults(
            data.writing1_prompts,
            Boolean(data.writing1_fullSync)
          );
          saveKoreanPromptsToStorage();
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
    if (snap.exists() && Array.isArray(snap.data().writing1_prompts)) {
      const data = snap.data();
      koreanPrompts = mergeCloudPromptsWithDefaults(
        data.writing1_prompts,
        Boolean(data.writing1_fullSync)
      );
      saveKoreanPromptsToStorage();
    }
  } catch (e) {
    loadKoreanPromptsFromStorage();
  }
}

async function syncPromptsToCloudDoc() {
  if (!currentUser || currentUser.isDemo) return false;
  const settingsDocRef = doc(db, "vocab_books", "_settings");
  await setDoc(
    settingsDocRef,
    {
      id: "_settings",
      writing1_prompts: koreanPrompts,
      writing1_fullSync: true,
      writing1_updatedAt: Date.now()
    },
    { merge: true }
  );
  return true;
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
}

document.getElementById("btn-cancel-edit-prompt")?.addEventListener("click", () => {
  resetPromptEditorForm();
  renderTeacherPromptsTable();
});

function renderTeacherPromptsTable() {
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
      const activeBadge = isActive
        ? `<div style="font-size:0.7rem;color:#16a34a;font-weight:700;margin-top:2px;">공개중</div>`
        : `<div style="font-size:0.7rem;color:#94a3b8;font-weight:600;margin-top:2px;">비공개(대기)</div>`;
      const limitBadge = `<span class="badge-cefr" style="background:${
        Number(p.timeLimitSec) > 0 ? "#fef3c7;color:#b45309" : "#f1f5f9;color:#475569"
      }">${formatLimitLabel(p.timeLimitSec)}</span>`;

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

document.getElementById("btn-add-prompt")?.addEventListener("click", async () => {
  const targetGrade = document.getElementById("new-prompt-grade").value;
  const targetClass = document.getElementById("new-prompt-class")?.value || "all";
  const timeLimitSec = Number(document.getElementById("new-prompt-timelimit")?.value ?? 180);
  const active = document.getElementById("new-prompt-active")?.checked ?? true;
  const title = document.getElementById("new-prompt-title").value.trim();
  const targetGrammar = document.getElementById("new-prompt-target").value.trim();
  const koreanPrompt = document.getElementById("new-prompt-korean").value.trim();
  const referenceAnswer = document.getElementById("new-prompt-answer").value.trim();

  if (!title || !koreanPrompt) {
    return alert("과제명과 학생에게 제시할 한국어 문장을 입력해 주세요.");
  }

  const isRealTeacher = currentUser && !currentUser.isDemo;
  const isEditing = Boolean(editingPromptId);

  if (isEditing) {
    const idx = koreanPrompts.findIndex((p) => p.id === editingPromptId);
    if (idx !== -1) {
      koreanPrompts[idx] = {
        ...koreanPrompts[idx],
        targetGrade,
        targetClass,
        timeLimitSec,
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
  const statusDesc = active ? "즉시 학생 공개(☑️)" : "비공개 보관(나중에 체크 시 공개)";
  alert(
    isEditing
      ? `✅ [${targetDesc} / ${formatLimitLabel(timeLimitSec)} / ${statusDesc}] 과제 수정 내용이 저장되었습니다!`
      : isRealTeacher
      ? `✅ [${targetDesc} / ${formatLimitLabel(timeLimitSec)} / ${statusDesc}] 새 과제가 저장되었습니다!`
      : `⚡ 미리보기 모드에 [${targetDesc} / ${formatLimitLabel(timeLimitSec)}] 과제가 추가되었습니다.`
  );
});

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
  let missionTimeLimitSec = 0;

  if (currentWritingMode === "korean_prompt") {
    const selectedMission =
      koreanPrompts.find((p) => p.id === selectKoreanMission.value) || koreanPrompts[0];
    if (!selectedMission) {
      if (!isForcedByTimeout) alert("선택된 한국어 제시문 과제가 없습니다.");
      return;
    }
    missionTimeLimitSec = Number(selectedMission.timeLimitSec) || 0;
    topic = selectedMission.title;
    koreanPrompt = selectedMission.koreanPrompt;
    targetGrammar = selectedMission.targetGrammar || "";
    referenceAnswer = selectedMission.referenceAnswer || "";
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
    if (btnStartTimedMission) {
      btnStartTimedMission.classList.remove("hidden");
      btnStartTimedMission.textContent = "🔄 타이머 재시작";
    }
  } else if (missionTimeLimitSec > 0) {
    if (timerStatusLabel) {
      timerStatusLabel.textContent = "✅ 제한시간 내에 영작 제출 및 채점을 완료했습니다!";
    }
    if (btnStartTimedMission) {
      btnStartTimedMission.classList.remove("hidden");
      btnStartTimedMission.textContent = "🔄 타이머 재시작";
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

    // 1. 로컬 Node.js 서버(/api/evaluate)가 실행 중인 경우 호출, GitHub Pages 정적 환경인 경우 내장 평가 엔진 즉시 실행
    try {
      const response = await fetch("./api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: currentWritingMode,
          topic,
          koreanPrompt,
          targetGrammar,
          referenceAnswer,
          content,
          studentName,
          grade
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.success) {
          evalResult = data.evaluation;
        }
      }
    } catch (networkErr) {
      // GitHub Pages (https://tfellow.github.io/web/writing1/) 정적 호스팅 환경에서는 클라이언트 평가 엔진 사용
    }

    if (!evalResult) {
      evalResult = evaluateWritingLocally({
        mode: currentWritingMode,
        topic,
        koreanPrompt,
        targetGrammar,
        referenceAnswer,
        content,
        studentName
      });
    }

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
      localStorage.setItem("MY_WRITING_LOCAL_SUBMISSIONS", JSON.stringify(localSaved.slice(0, 300)));
    } catch (storageErr) {
      console.warn("로컬 백업 저장 실패:", storageErr);
    }

    if (currentUser.isDemo) {
      const { createdAt, ...demoRecord } = newRecord;
      DEMO_SUBMISSIONS.unshift(demoRecord);
      renderLocalStudentHistory(DEMO_SUBMISSIONS.filter((d) => d.studentId === studentId));
    } else {
      try {
        // cloze-a8e6c 보안 규칙에서 학생 쓰기 및 교사 전체 읽기가 허용된 `vocab_results` 컬렉션 사용
        await addDoc(collection(db, "vocab_results"), newRecord);
        await loadStudentHistory();
      } catch (dbErr) {
        const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
        renderLocalStudentHistory(localSaved.filter((d) => d.uid === currentUser.uid || d.studentId === studentId));
      }
    }
  } catch (error) {
    console.error(error);
    alert("오류: " + error.message);
  } finally {
    isSubmittingEssay = false;
    essayContent.disabled = false;
    btnSubmitEssay.disabled = false;
    document.getElementById("eval-loading").classList.add("hidden");
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
      rubricBox.classList.remove("hidden");
      rubricBox.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 0.35rem; color: #1e293b;">📏 4대 영역 정밀 채점 내역 (총 ${evalResult.score}점 / 100점 만점)</div>
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
  vocabList.innerHTML = (evalResult.vocabularySuggestions || [])
    .map(
      (v) =>
        `<li><strong>${v.word}</strong> (${v.meaning})<br/><em>예: ${v.example}</em></li>`
    )
    .join("");
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
      renderLocalStudentHistory(localSaved.filter((d) => d.uid === currentUser.uid));
      return;
    }

    renderLocalStudentHistory(cloudDocs);
  } catch (error) {
    const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
    renderLocalStudentHistory(localSaved.filter((d) => d.uid === currentUser.uid));
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
  const combined = [...cloudList, ...localSaved, ...DEMO_SUBMISSIONS];
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

// ============================================================================
// 8. 빠른 화면 미리보기 (Firebase 로그인 전에도 브라우저에서 즉시 체험 가능)
// ============================================================================
const DEMO_SUBMISSIONS = [
  {
    ts: 1794039900000,
    uid: "demo-10102",
    studentEmail: "202610102@smy.ms.kr",
    studentId: "10102",
    studentName: "김서연",
    grade: 1,
    classNum: 1,
    className: "1반",
    studentNumber: 2,
    mode: "korean_prompt",
    topic: "[1학년] 좋아하는 계절과 이유 말하기",
    koreanPrompt: "내가 가장 좋아하는 계절은 봄인데, 왜냐하면 아름다운 꽃들이 피기 때문이다.",
    originalContent: "My favorite season is spring because",
    forcedTimeout: true,
    wordCount: 6,
    cefrLevel: "A1",
    score: 68,
    meaningAccuracy: 55,
    correctedText: "My favorite season is spring because beautiful flowers bloom.",
    overallComment: "⏰ [제한시간 종료 강제 발송] 제한시간이 지나 그때까지 작성한 내용(\"My favorite season is spring because\")이 자동 제출되었습니다. 뒷부분(beautiful flowers bloom)까지 완성해 보세요!",
    dateString: "2026-11-07",
    submittedTimeStr: "2026-11-07 18:35",
    createdAtMs: 1794039900000
  },
  {
    ts: 1794030000000,
    uid: "demo-10101",
    studentEmail: "202610101@smy.ms.kr",
    studentId: "10101",
    studentName: "김나은",
    grade: 1,
    classNum: 1,
    className: "1반",
    studentNumber: 1,
    mode: "korean_prompt",
    topic: "[1학년] 좋아하는 계절과 이유 말하기",
    koreanPrompt: "내가 가장 좋아하는 계절은 봄인데, 왜냐하면 아름다운 꽃들이 피기 때문이다.",
    originalContent: "My favorite season is spring because beautiful flowers bloom.",
    forcedTimeout: false,
    wordCount: 9,
    cefrLevel: "A2",
    score: 96,
    meaningAccuracy: 98,
    correctedText: "My favorite season is spring because beautiful flowers bloom.",
    overallComment: "한국어 제시문의 의미와 목표 접속사(because)를 완벽하게 영작했어요!",
    dateString: "2026-11-05",
    submittedTimeStr: "2026-11-05 14:20",
    createdAtMs: 1794030000000
  },
  {
    ts: 1794033000000,
    uid: "demo-10219",
    studentEmail: "202610219@smy.ms.kr",
    studentId: "10219",
    studentName: "강예은",
    grade: 1,
    classNum: 2,
    className: "2반",
    studentNumber: 19,
    mode: "korean_prompt",
    topic: "[2학년] 목적을 나타내는 so that 구문 영작",
    koreanPrompt: "나는 아픈 동물들을 도울 수 있도록 수의사가 되고 싶다.",
    originalContent: "I want to be a veterinarian so that I can help sick animals.",
    forcedTimeout: false,
    wordCount: 13,
    cefrLevel: "B1",
    score: 98,
    meaningAccuracy: 100,
    correctedText: "I want to be a veterinarian so that I can help sick animals.",
    overallComment: "so that 구문을 활용하여 제시문의 의미를 100% 정확하게 전달했습니다!",
    dateString: "2026-11-06",
    submittedTimeStr: "2026-11-06 11:10",
    createdAtMs: 1794033000000
  },
  {
    ts: 1794036000000,
    uid: "demo-20416",
    studentEmail: "202620416@smy.ms.kr",
    studentId: "20416",
    studentName: "김민서",
    grade: 2,
    classNum: 4,
    className: "4반",
    studentNumber: 16,
    mode: "free",
    topic: "A Memorable School Trip",
    koreanPrompt: "",
    originalContent: "Last week our class went to Gyeongbokgung Palace and wore Hanbok.",
    forcedTimeout: false,
    wordCount: 11,
    cefrLevel: "B1",
    score: 94,
    meaningAccuracy: 94,
    correctedText: "Last week, our class visited Gyeongbokgung Palace and tried on traditional Hanbok.",
    overallComment: "과거 시제를 정확하게 사용했고 어휘 선택이 훌륭합니다!",
    dateString: "2026-11-07",
    submittedTimeStr: "2026-11-07 09:45",
    createdAtMs: 1794036000000
  },
  {
    ts: 1794038000000,
    uid: "demo-30101",
    studentEmail: "202630101@smy.ms.kr",
    studentId: "30101",
    studentName: "김규람",
    grade: 3,
    classNum: 1,
    className: "1반",
    studentNumber: 1,
    mode: "korean_prompt",
    topic: "[3학년] 가주어-진주어(It ~ to부정사) 구문 영작",
    koreanPrompt: "전 세계 사람들과 소통하기 위해 영어를 배우는 것은 중요하다.",
    originalContent: "It is important to learn English to communicate with people around the world.",
    forcedTimeout: false,
    wordCount: 13,
    cefrLevel: "B1+",
    score: 100,
    meaningAccuracy: 100,
    correctedText: "It is important to learn English to communicate with people around the world.",
    overallComment: "가주어 It과 진주어 to부정사 구문을 완벽하게 구사했습니다!",
    dateString: "2026-11-07",
    submittedTimeStr: "2026-11-07 13:15",
    createdAtMs: 1794038000000
  }
];

document.getElementById("btn-demo-student")?.addEventListener("click", () => {
  const sampleStudent = findStudentByEmail("202610101@smy.ms.kr");
  currentUser = {
    uid: "demo-10101",
    email: sampleStudent.email,
    displayName: sampleStudent.name,
    isDemo: true
  };
  currentStudentInfo = sampleStudent;

  userInfoText.textContent = `[미리보기] ${sampleStudent.grade}학년 ${sampleStudent.classNum}반 ${sampleStudent.number}번 ${sampleStudent.name} (${sampleStudent.studentId})`;
  document.getElementById("student-id").value = sampleStudent.studentId;
  document.getElementById("student-grade").value = String(sampleStudent.grade);
  document.getElementById("student-class").value = String(sampleStudent.classNum);
  document.getElementById("student-number").value = sampleStudent.number;
  document.getElementById("student-name").value = sampleStudent.name;

  btnLogin.classList.add("hidden");
  btnLogout.classList.remove("hidden");
  viewLogin.classList.add("hidden");
  viewStudent.classList.remove("hidden");
  viewTeacher.classList.add("hidden");

  renderStudentKoreanMissions();
  const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
  const myHistory = [...localSaved, ...DEMO_SUBMISSIONS].filter((d) => d.studentId === "10101");
  renderLocalStudentHistory(myHistory);
});

document.getElementById("btn-demo-teacher")?.addEventListener("click", () => {
  stopMissionTimer();
  currentUser = {
    uid: "demo-teacher",
    email: "tfellow@smy.ms.kr",
    displayName: "선생님 (관리자 미리보기)",
    isDemo: true
  };

  userInfoText.textContent = `tfellow@smy.ms.kr / tfellow@gmail.com / engwords@gmail.com (교사 관리자 미리보기)`;
  btnLogin.classList.add("hidden");
  btnLogout.classList.remove("hidden");
  viewLogin.classList.add("hidden");
  viewTeacher.classList.remove("hidden");
  viewStudent.classList.add("hidden");

  renderTeacherPromptsTable();
  populateRosterDropdown();
  loadTeacherDashboard();
});
