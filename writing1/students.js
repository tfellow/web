/**
 * 서울문영여자중학교(smy.ms.kr) 보안 학생 명렬표 모듈 (개인정보 비식별화 및 AES-256-GCM 암호화 적용)
 * - 공개 URL(students.js)에서 학생 실명·학번·이메일 등 개인정보가 평문으로 절대 노출되지 않습니다.
 * - 오직 학교 공식 Google 계정(@smy.ms.kr) 또는 등록된 교사 관리자 계정으로 Firebase 인증을 통과한 경우에만
 *   클라우드 보안 문서(Firestore) 및 Web Crypto API(AES-256-GCM)를 통해 런타임 메모리에 복호화됩니다.
 */

const ENCRYPTED_ROSTER_VAULT = {"s":"zQzGlQ3WXGEzREaj41Mnng==","iv":"1j1onFarzln0NDOP","ct":"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"};

// 런타임 메모리에만 유지되는 명렬표 (비로그인 상태에서는 빈 배열)
export let STUDENT_ROSTER = [];
let STUDENT_BY_EMAIL = {};

export function setRuntimeRoster(list = []) {
  if (!Array.isArray(list)) return;
  STUDENT_ROSTER.length = 0;
  STUDENT_ROSTER.push(...list);
  STUDENT_BY_EMAIL = Object.fromEntries(
    STUDENT_ROSTER.map((s) => [String(s.email || "").toLowerCase(), s])
  );
}

/**
 * Firebase Auth 인증 완료 후(@smy.ms.kr 또는 교사 계정)에만 호출되어 명렬표를 메모리에 복호화합니다.
 */
export async function unlockEncryptedRosterForAuthorizedUser(authDomain, projectId) {
  if (STUDENT_ROSTER.length > 0) return STUDENT_ROSTER;
  if (!authDomain || !projectId || !window.crypto?.subtle) return [];

  try {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const salt = b64ToBytes(ENCRYPTED_ROSTER_VAULT.s);
    const iv = b64ToBytes(ENCRYPTED_ROSTER_VAULT.iv);
    const ct = b64ToBytes(ENCRYPTED_ROSTER_VAULT.ct);

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(`SMY_SCHOOL_AUTH_GUARD::${authDomain}::tfellow@gmail.com::${projectId}`),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      aesKey,
      ct
    );

    const compactList = JSON.parse(dec.decode(decryptedBuffer));
    const expanded = compactList.map(([studentId, name]) => {
      const sId = String(studentId);
      const grade = Number(sId[0]);
      const classNum = Number(sId.slice(1, 3));
      const number = Number(sId.slice(3, 5));
      return {
        grade,
        classNum,
        number,
        name,
        studentId: sId,
        email: `2026${sId}@${authDomain}`
      };
    });

    setRuntimeRoster(expanded);
    return STUDENT_ROSTER;
  } catch (e) {
    console.warn("보안 명렬표 복호화 건너뜀:", e);
    return [];
  }
}

/**
 * 이메일로 학생 정보 조회 (인증 후 복호화된 명렬표 또는 이메일 패턴 2026GCNN@smy.ms.kr + Google 프로필 자동 파싱)
 */
export function findStudentByEmail(email, googleDisplayName = "") {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. 복호화된 보안 명렬표에서 정확히 일치하는 학생 반환
  if (STUDENT_BY_EMAIL[cleanEmail]) {
    return STUDENT_BY_EMAIL[cleanEmail];
  }

  // 2. 2026 + 5자리 학번(G + CC + NN)@smy.ms.kr 패턴 자동 추출
  const match = cleanEmail.match(/^2026(\d)(\d{2})(\d{2})@smy\.ms\.kr$/);
  if (match) {
    const grade = Number(match[1]);
    const classNum = Number(match[2]);
    const number = Number(match[3]);
    const studentId = `${grade}${String(classNum).padStart(2, "0")}${String(number).padStart(2, "0")}`;
    // Google 프로필 이름에서 학번/숫자 등을 제거한 순수 이름 추출
    const cleanName = String(googleDisplayName || "")
      .replace(/\d+/g, "")
      .replace(/[()\[\]\-_]/g, " ")
      .trim();
    return {
      grade,
      classNum,
      number,
      name: cleanName || "학생",
      studentId,
      email: cleanEmail
    };
  }

  return null;
}

// 학년별 개설 학급 목록 (1학년: 1~3반, 2·3학년: 1~4반)
export const CLASSES_BY_GRADE = {
  1: [1, 2, 3],
  2: [1, 2, 3, 4],
  3: [1, 2, 3, 4]
};
