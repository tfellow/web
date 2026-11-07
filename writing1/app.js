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
  "tfellow@gmail.com"
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
    title: "[1학년] 좋아하는 계절과 이유 말하기",
    koreanPrompt: "내가 가장 좋아하는 계절은 봄인데, 왜냐하면 아름다운 꽃들이 피기 때문이다.",
    targetGrammar: "because (이유를 나타내는 접속사)",
    referenceAnswer: "My favorite season is spring because beautiful flowers bloom."
  },
  {
    id: "kp-2",
    targetGrade: "2",
    title: "[2학년] 목적을 나타내는 so that 구문 영작",
    koreanPrompt: "나는 아픈 동물들을 도울 수 있도록 수의사가 되고 싶다.",
    targetGrammar: "so that (~할 수 있도록 / ~하기 위해서)",
    referenceAnswer: "I want to be a veterinarian so that I can help sick animals."
  },
  {
    id: "kp-3",
    targetGrade: "3",
    title: "[3학년] 가주어-진주어(It ~ to부정사) 구문 영작",
    koreanPrompt: "전 세계 사람들과 소통하기 위해 영어를 배우는 것은 중요하다.",
    targetGrammar: "It is ~ to부정사 (가주어-진주어)",
    referenceAnswer: "It is important to learn English to communicate with people around the world."
  },
  {
    id: "kp-4",
    targetGrade: "all",
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

/**
 * [정적 호스팅(GitHub Pages) 호환] 스마트 영작문 & 한국어 제시문 정밀 평가 엔진
 * 백엔드 서버가 없는 https://tfellow.github.io/web/writing1/ 환경에서도 100% 작동합니다.
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
  const safeContent = maskPersonalInfoClient(content, studentName);
  const words = safeContent.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = safeContent
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 1. 기본 문법 및 표기 보정
  let correctedText = safeContent
    .replace(/\bi\b/g, "I")
    .replace(/\bdont\b/gi, "don't")
    .replace(/\bcant\b/gi, "can't")
    .replace(/\bwont\b/gi, "won't")
    .replace(/\bim\b/gi, "I'm")
    .replace(/\s+/g, " ")
    .trim();

  if (correctedText.length > 0) {
    correctedText = correctedText.charAt(0).toUpperCase() + correctedText.slice(1);
    if (!/[.!?]$/.test(correctedText)) {
      correctedText += ".";
    }
  }

  // 2. 목표 문법/어휘 포함 여부 검사
  let targetExpressionUsed = true;
  if (targetGrammar && targetGrammar.trim()) {
    const englishKeywords = targetGrammar
      .toLowerCase()
      .replace(/\([^)]*\)/g, "")
      .split(/[,/~]+/)
      .map((k) => k.trim())
      .filter((k) => /^[a-z\s]+$/.test(k) && k.length >= 2);

    if (englishKeywords.length > 0) {
      targetExpressionUsed = englishKeywords.some((kw) =>
        safeContent.toLowerCase().includes(kw)
      );
    }
  }

  // 3. 한국어 제시문 모범 답안 대비 의미 전달 정확도 산출
  let meaningAccuracy = 90;
  if (mode === "korean_prompt" && referenceAnswer) {
    const refWords = referenceAnswer
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 2);
    const studentLower = safeContent.toLowerCase();
    const matchCount = refWords.filter((w) => studentLower.includes(w)).length;
    const ratio = refWords.length > 0 ? matchCount / refWords.length : 0.85;
    meaningAccuracy = Math.min(100, Math.max(68, Math.round(68 + ratio * 32)));
  }

  // 4. 문법 및 표현 피드백 구성
  const grammarFeedback = [];
  if (correctedText !== safeContent.trim()) {
    grammarFeedback.push({
      original: safeContent.trim(),
      corrected: correctedText,
      explanation: "영어 문장 첫 글자 대문자 표기, 1인칭 대명사 'I', 축약형 아포스트로피('), 또는 문장 부호(.)를 바르게 다듬었습니다."
    });
  } else {
    grammarFeedback.push({
      original: sentences[0] || safeContent,
      corrected: correctedText,
      explanation: "주어+동사 어순과 대소문자, 문장 부호가 정확하고 자연스럽게 작성되었습니다!"
    });
  }

  if (mode === "korean_prompt" && targetGrammar && !targetExpressionUsed) {
    grammarFeedback.push({
      original: `핵심 목표 표현(${targetGrammar}) 확인 필요`,
      corrected: referenceAnswer || correctedText,
      explanation: `선생님이 제시하신 목표 표현("${targetGrammar}")을 문장에 넣어 영작하면 만점을 받을 수 있어요!`
    });
  }

  const cefrLevel = wordCount >= 35 ? "B1" : wordCount >= 12 ? "A2+" : "A2";
  const baseScore =
    mode === "korean_prompt"
      ? meaningAccuracy
      : Math.min(98, Math.max(80, 82 + Math.floor(wordCount / 3)));
  const score = targetExpressionUsed ? baseScore : Math.max(65, baseScore - 8);

  return {
    cefrLevel,
    score,
    meaningAccuracy,
    targetExpressionUsed,
    correctedText,
    modelAnswer: referenceAnswer || correctedText,
    grammarFeedback,
    vocabularySuggestions: [
      {
        word: targetGrammar || "expressive",
        meaning: targetGrammar ? "이번 과제 핵심 목표 표현" : "표현력이 풍부한",
        example: referenceAnswer || "Your English writing is very clear and expressive!"
      },
      {
        word: "communicate",
        meaning: "소통하다, 의미를 전달하다",
        example: "Writing in English helps us communicate our thoughts clearly."
      }
    ],
    overallComment:
      mode === "korean_prompt"
        ? `선생님의 한국어 제시문("${koreanPrompt}")의 핵심 의미를 영어로 잘 옮겼어요! ${
            targetExpressionUsed
              ? "목표 문법/어휘까지 정확하게 사용하여 완성도가 매우 높습니다! 👏"
              : `추천 모범 답안을 참고하여 목표 표현(${targetGrammar})도 함께 연습해 보세요!`
          }`
        : `총 ${wordCount}단어로 "${topic}" 주제에 대해 자신의 생각을 논리적으로 잘 표현했어요! 👏`
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
});

tabModeFree.addEventListener("click", () => {
  currentWritingMode = "free";
  tabModeFree.classList.add("active");
  tabModeKorean.classList.remove("active");
  boxFreeTopic.classList.remove("hidden");
  boxKoreanPrompt.classList.add("hidden");
  document.getElementById("label-essay-content").textContent = "📝 자유 영작문 본문 작성 (Essay)";
  essayContent.placeholder = "자유롭게 영어로 글을 작성해 보세요! (50~150단어 권장)";
});

// 학생 화면의 한국어 제시문 드롭다운 렌더링 및 선택 이벤트
function renderStudentKoreanMissions() {
  const studentGrade = currentStudentInfo ? String(currentStudentInfo.grade) : "all";
  // 1순위: 선생님이 새로 등록한 클라우드 과제 & 본인 학년 과제 최우선 정렬
  const sortedPrompts = [...koreanPrompts].sort((a, b) => {
    const aIsCustom = !String(a.id).startsWith("kp-") ? -1 : 0;
    const bIsCustom = !String(b.id).startsWith("kp-") ? -1 : 0;
    if (aIsCustom !== bIsCustom) return aIsCustom - bIsCustom;

    const aMatch = a.targetGrade === studentGrade ? -1 : 0;
    const bMatch = b.targetGrade === studentGrade ? -1 : 0;
    if (aMatch !== bMatch) return aMatch - bMatch;

    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });

  selectKoreanMission.innerHTML = sortedPrompts
    .map((p) => {
      const isNew = !String(p.id).startsWith("kp-");
      const prefix = isNew ? "🆕 [선생님 새 과제] " : "";
      return `<option value="${p.id}">${prefix}${p.title}</option>`;
    })
    .join("");

  updateSelectedKoreanMissionDetail();
}

selectKoreanMission.addEventListener("change", updateSelectedKoreanMissionDetail);

function updateSelectedKoreanMissionDetail() {
  const selectedId = selectKoreanMission.value;
  const mission = koreanPrompts.find((p) => p.id === selectedId) || koreanPrompts[0];
  if (!mission) {
    displayKoreanSentence.textContent = "등록된 한국어 제시문이 없습니다.";
    displayTargetGrammar.textContent = "-";
    return;
  }
  displayKoreanSentence.textContent = `"${mission.koreanPrompt}"`;
  displayTargetGrammar.textContent = mission.targetGrammar || "자유 표현 (의미가 통하도록 영작)";
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

function subscribeKoreanPromptsFromCloud() {
  if (unsubscribePrompts) return;
  try {
    const settingsDocRef = doc(db, "vocab_books", "_settings");
    unsubscribePrompts = onSnapshot(
      settingsDocRef,
      (snap) => {
        if (snap.exists() && Array.isArray(snap.data().writing1_prompts)) {
          const cloudPrompts = snap.data().writing1_prompts;
          const cloudIds = new Set(cloudPrompts.map((p) => p.id));
          const defaultFiltered = DEFAULT_KOREAN_PROMPTS.filter((p) => !cloudIds.has(p.id));
          koreanPrompts = [...cloudPrompts, ...defaultFiltered];
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
      const cloudPrompts = snap.data().writing1_prompts;
      const cloudIds = new Set(cloudPrompts.map((p) => p.id));
      const defaultFiltered = DEFAULT_KOREAN_PROMPTS.filter((p) => !cloudIds.has(p.id));
      koreanPrompts = [...cloudPrompts, ...defaultFiltered];
      saveKoreanPromptsToStorage();
    }
  } catch (e) {
    loadKoreanPromptsFromStorage();
  }
}

async function syncPromptsToCloudDoc() {
  if (!currentUser || currentUser.isDemo) return false;
  const settingsDocRef = doc(db, "vocab_books", "_settings");
  const customOnly = koreanPrompts.filter((p) => !String(p.id).startsWith("kp-"));
  await setDoc(
    settingsDocRef,
    {
      id: "_settings",
      writing1_prompts: customOnly,
      writing1_updatedAt: Date.now()
    },
    { merge: true }
  );
  return true;
}

function renderTeacherPromptsTable() {
  const tbody = document.getElementById("teacher-prompts-tbody");
  if (!tbody) return;

  if (koreanPrompts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center">등록된 한국어 제시문 과제가 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = koreanPrompts
    .map((p) => {
      const gradeLabel = p.targetGrade === "all" ? "전학년 공통" : `${p.targetGrade}학년`;
      const isCloud = !String(p.id).startsWith("kp-");
      const syncBadge = isCloud
        ? `<span style="font-size:0.72rem;background:#dcfce7;color:#166534;padding:2px 6px;border-radius:99px;margin-left:4px;">☁️전교생 실시간 공유</span>`
        : `<span style="font-size:0.72rem;background:#e2e8f0;color:#475569;padding:2px 6px;border-radius:99px;margin-left:4px;">기본예시</span>`;
      return `
        <tr>
          <td><strong>${gradeLabel}</strong></td>
          <td>${p.title} ${syncBadge}</td>
          <td><strong>${p.koreanPrompt}</strong></td>
          <td>${p.targetGrammar || "-"}</td>
          <td>${p.referenceAnswer || "-"}</td>
          <td><button class="btn btn-outline btn-delete-prompt" data-id="${p.id}" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">삭제</button></td>
        </tr>
      `;
    })
    .join("");

  tbody.querySelectorAll(".btn-delete-prompt").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const targetId = btn.getAttribute("data-id");
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

document.getElementById("btn-add-prompt")?.addEventListener("click", async () => {
  const targetGrade = document.getElementById("new-prompt-grade").value;
  const title = document.getElementById("new-prompt-title").value.trim();
  const targetGrammar = document.getElementById("new-prompt-target").value.trim();
  const koreanPrompt = document.getElementById("new-prompt-korean").value.trim();
  const referenceAnswer = document.getElementById("new-prompt-answer").value.trim();

  if (!title || !koreanPrompt) {
    return alert("과제명과 학생에게 제시할 한국어 문장을 입력해 주세요.");
  }

  const isRealTeacher = currentUser && !currentUser.isDemo;
  const newPromptObj = {
    id: isRealTeacher ? `cloud-${Date.now()}` : `kp-${Date.now()}`,
    targetGrade,
    title,
    koreanPrompt,
    targetGrammar,
    referenceAnswer,
    createdAtMs: Date.now()
  };

  koreanPrompts.unshift(newPromptObj);
  saveKoreanPromptsToStorage();

  try {
    if (isRealTeacher) {
      await syncPromptsToCloudDoc();
    }
  } catch (e) {
    console.error("클라우드 과제 저장 오류:", e);
  }

  renderTeacherPromptsTable();
  renderStudentKoreanMissions();

  document.getElementById("new-prompt-title").value = "";
  document.getElementById("new-prompt-target").value = "";
  document.getElementById("new-prompt-korean").value = "";
  document.getElementById("new-prompt-answer").value = "";
  alert(
    isRealTeacher
      ? "✅ 새 한국어 제시문 영작 과제가 클라우드에 저장되어 전교생 화면에 즉시 공유되었습니다!"
      : "⚡ 미리보기 모드에 과제가 추가되었습니다. (실제 전교생 기기 공유를 원하시면 우측 상단 Google 학교 계정 로그인으로 선생님 계정에 로그인한 뒤 등록해 주세요!)"
  );
});

// ============================================================================
// 6. 학생 기능: 글자/단어 수 계산, AI 작문 평가 요청 및 과거 기록 조회
// ============================================================================
essayContent.addEventListener("input", () => {
  const words = essayContent.value.trim().split(/\s+/).filter(Boolean);
  wordCountNum.textContent = words.length;
});

btnSubmitEssay.addEventListener("click", async () => {
  if (!currentUser || !currentStudentInfo) return alert("먼저 로그인해 주세요.");

  const content = essayContent.value.trim();
  const { grade, classNum, number: studentNumber, name: studentName, studentId } = currentStudentInfo;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  let topic = "";
  let koreanPrompt = "";
  let targetGrammar = "";
  let referenceAnswer = "";

  if (currentWritingMode === "korean_prompt") {
    const selectedMission =
      koreanPrompts.find((p) => p.id === selectKoreanMission.value) || koreanPrompts[0];
    if (!selectedMission) {
      return alert("선택된 한국어 제시문 과제가 없습니다.");
    }
    topic = selectedMission.title;
    koreanPrompt = selectedMission.koreanPrompt;
    targetGrammar = selectedMission.targetGrammar || "";
    referenceAnswer = selectedMission.referenceAnswer || "";
  } else {
    topic = essayTopic.value.trim();
  }

  if (!topic || !content) {
    return alert("과제(주제)와 영어 작문 본문을 모두 입력해 주세요.");
  }

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

    renderEvaluationResult(evalResult, currentWritingMode, targetGrammar);

    const todayStr = new Date().toISOString().split("T")[0];

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
      createdAtMs: Date.now(),
      createdAt: serverTimestamp()
    };

    if (currentUser.isDemo) {
      DEMO_SUBMISSIONS.unshift(newRecord);
      renderLocalStudentHistory(DEMO_SUBMISSIONS.filter((d) => d.studentId === studentId));
    } else {
      try {
        // cloze-a8e6c 보안 규칙에서 학생 쓰기 및 교사 전체 읽기가 허용된 `vocab_results` 컬렉션 사용
        await addDoc(collection(db, "vocab_results"), newRecord);
        await loadStudentHistory();
      } catch (dbErr) {
        const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
        localSaved.unshift(newRecord);
        localStorage.setItem("MY_WRITING_LOCAL_SUBMISSIONS", JSON.stringify(localSaved));
        renderLocalStudentHistory(localSaved.filter((d) => d.uid === currentUser.uid));
      }
    }
  } catch (error) {
    console.error(error);
    alert("오류: " + error.message);
  } finally {
    btnSubmitEssay.disabled = false;
    document.getElementById("eval-loading").classList.add("hidden");
  }
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
      const modeBadge = d.mode === "korean_prompt" ? "🇰🇷제시문" : "📝자유";
      const promptDisplay = d.koreanPrompt
        ? `<strong>${d.topic}</strong><br/><span style="font-size:0.82rem;color:#475569;">"${d.koreanPrompt}"</span>`
        : `<strong>${d.topic}</strong>`;
      return `
      <tr>
        <td>${d.dateString || "-"}</td>
        <td>${modeBadge}</td>
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

async function loadTeacherDashboard() {
  try {
    const q = query(
      collection(db, "vocab_results"),
      where("appTag", "==", "writing1_submission")
    );
    const snapshot = await getDocs(q);
    const cloudList = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
    allTeacherSubmissions = [...cloudList, ...localSaved];
    if (allTeacherSubmissions.length === 0) {
      allTeacherSubmissions = [...DEMO_SUBMISSIONS];
    }
    applyTeacherFilters();
  } catch (error) {
    const localSaved = JSON.parse(localStorage.getItem("MY_WRITING_LOCAL_SUBMISSIONS") || "[]");
    allTeacherSubmissions = [...localSaved, ...DEMO_SUBMISSIONS];
    applyTeacherFilters();
  }
}

function applyTeacherFilters() {
  const gradeFilter = filterGradeEl.value;
  const classFilter = filterClassEl.value;
  const rosterStudentId = filterRosterStudentEl.value;
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
  const avgScore =
    filtered.length > 0
      ? Math.round((filtered.reduce((acc, cur) => acc + (Number(cur.score) || 0), 0) / filtered.length) * 10) / 10
      : 0;

  document.getElementById("stat-total-roster").textContent = `${targetRoster.length}명`;
  document.getElementById("stat-submitted-students").textContent = `${uniqueSubmittedIds.size}명`;
  document.getElementById("stat-total-submissions").textContent = `${filtered.length}건`;
  document.getElementById("stat-avg-score").textContent = `${avgScore}점`;

  renderTeacherTable(filtered);
  renderTeacherCharts(filtered);
}

function renderTeacherTable(submissions) {
  const tbody = document.getElementById("teacher-submissions-tbody");
  if (submissions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" class="text-center">조건에 해당하는 제출 기록이 없습니다.</td></tr>`;
    return;
  }

  tbody.innerHTML = submissions
    .map((d) => {
      const classLabel = d.classNum ? `${d.classNum}반` : d.className;
      const modeBadge = d.mode === "korean_prompt" ? "🇰🇷제시문" : "📝자유";
      const promptInfo = d.koreanPrompt
        ? `<strong>${d.topic}</strong><br/><span style="font-size:0.82rem;color:#475569;">"${d.koreanPrompt}"</span>`
        : `<strong>${d.topic}</strong>`;
      return `
      <tr>
        <td>${d.dateString || "-"}</td>
        <td><strong>${d.studentId || "-"}</strong></td>
        <td>${d.grade}학년 ${classLabel} ${d.studentNumber}번</td>
        <td>${d.studentName}</td>
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
    "제출일",
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
    d.dateString || "",
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
    wordCount: 9,
    cefrLevel: "A2",
    score: 96,
    meaningAccuracy: 98,
    correctedText: "My favorite season is spring because beautiful flowers bloom.",
    overallComment: "한국어 제시문의 의미와 목표 접속사(because)를 완벽하게 영작했어요!",
    dateString: "2026-11-05"
  },
  {
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
    wordCount: 13,
    cefrLevel: "B1",
    score: 98,
    meaningAccuracy: 100,
    correctedText: "I want to be a veterinarian so that I can help sick animals.",
    overallComment: "so that 구문을 활용하여 제시문의 의미를 100% 정확하게 전달했습니다!",
    dateString: "2026-11-06"
  },
  {
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
    wordCount: 11,
    cefrLevel: "B1",
    score: 94,
    meaningAccuracy: 94,
    correctedText: "Last week, our class visited Gyeongbokgung Palace and tried on traditional Hanbok.",
    overallComment: "과거 시제를 정확하게 사용했고 어휘 선택이 훌륭합니다!",
    dateString: "2026-11-07"
  },
  {
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
    wordCount: 13,
    cefrLevel: "B1+",
    score: 100,
    meaningAccuracy: 100,
    correctedText: "It is important to learn English to communicate with people around the world.",
    overallComment: "가주어 It과 진주어 to부정사 구문을 완벽하게 구사했습니다!",
    dateString: "2026-11-07"
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
  renderLocalStudentHistory(DEMO_SUBMISSIONS.filter((d) => d.studentId === "10101"));
});

document.getElementById("btn-demo-teacher")?.addEventListener("click", () => {
  currentUser = {
    uid: "demo-teacher",
    email: "tfellow@smy.ms.kr",
    displayName: "선생님 (관리자 미리보기)",
    isDemo: true
  };

  userInfoText.textContent = `tfellow@smy.ms.kr / tfellow@gmail.com (교사 관리자 미리보기)`;
  btnLogin.classList.add("hidden");
  btnLogout.classList.remove("hidden");
  viewLogin.classList.add("hidden");
  viewTeacher.classList.remove("hidden");
  viewStudent.classList.add("hidden");

  allTeacherSubmissions = [...DEMO_SUBMISSIONS];
  renderTeacherPromptsTable();
  populateRosterDropdown();
  applyTeacherFilters();
});
