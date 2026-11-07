/**
 * 서울문영여자중학교(smy.ms.kr) 보안 학생 명렬표 모듈 (Firestore 서버 보안 + 무키(Zero-Key) AES-256-GCM 금고)
 * - 이 파일(students.js)에는 학생 실명·학번·이메일 평문은 물론 복호화 키(Key)도 일절 포함되어 있지 않습니다.
 * - 명렬표 데이터는 오직 Google Cloud Firestore 보안 문서(vocab_books/_settings.writing1_roster)에서
 *   학교 계정(@smy.ms.kr) 또는 교사 관리자 인증을 통과한 세션에만 제공됩니다.
 */

const ENCRYPTED_ROSTER_VAULT = {"s":"hD+PbfVOxIWsyvzzxahWKA==","iv":"1CcJT5CS+lbBV4+q","ct":"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"};

// 런타임 메모리에만 유지되는 명렬표 (비로그인 상태에서는 빈 배열)
export let STUDENT_ROSTER = [];
let STUDENT_BY_EMAIL = {};

export function setRuntimeRoster(list = []) {
  if (!Array.isArray(list)) return;
  const normalized = list
    .map((item) => {
      if (typeof item === "string" && item.includes(":")) {
        const [rawId, ...nameParts] = item.split(":");
        const sId = String(rawId || "").trim();
        const name = nameParts.join(":").trim();
        if (!/^\d{5}$/.test(sId) || !name) return null;
        return {
          grade: Number(sId[0]),
          classNum: Number(sId.slice(1, 3)),
          number: Number(sId.slice(3, 5)),
          name,
          studentId: sId,
          email: `2026${sId}@smy.ms.kr`
        };
      }
      if (Array.isArray(item)) {
        const sId = String(item[0] || "").trim();
        const name = String(item[1] || "").trim();
        if (!/^\d{5}$/.test(sId) || !name) return null;
        return {
          grade: Number(sId[0]),
          classNum: Number(sId.slice(1, 3)),
          number: Number(sId.slice(3, 5)),
          name,
          studentId: sId,
          email: `2026${sId}@smy.ms.kr`
        };
      }
      if (item && item.studentId && item.name) {
        const sId = String(item.studentId).trim();
        return {
          grade: Number(item.grade || sId[0]),
          classNum: Number(item.classNum || sId.slice(1, 3)),
          number: Number(item.number || sId.slice(3, 5)),
          name: String(item.name).trim(),
          studentId: sId,
          email: String(item.email || `2026${sId}@smy.ms.kr`).toLowerCase()
        };
      }
      return null;
    })
    .filter(Boolean);

  STUDENT_ROSTER.length = 0;
  STUDENT_ROSTER.push(...normalized);
  STUDENT_BY_EMAIL = Object.fromEntries(
    STUDENT_ROSTER.map((s) => [String(s.email || "").toLowerCase(), s])
  );
}

/**
 * 교사가 입력한 보안 암호(소스코드에 저장되지 않음)로 금고를 복호화하여
 * Firestore가 허용하는 1차원 문자열 배열(["10101:이름", ...])을 반환합니다.
 */
export async function decryptRosterVaultWithTeacherCode(passphrase) {
  if (!passphrase || !window.crypto?.subtle) return null;
  try {
    const enc = new TextEncoder();
    const dec = new TextDecoder();
    const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

    const salt = b64ToBytes(ENCRYPTED_ROSTER_VAULT.s);
    const iv = b64ToBytes(ENCRYPTED_ROSTER_VAULT.iv);
    const ct = b64ToBytes(ENCRYPTED_ROSTER_VAULT.ct);

    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(`SMY_TEACHER_SECRET_V2::${String(passphrase).trim()}`),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 120000,
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
    // Firestore는 2차원 중첩 배열([[학번, 이름]])을 허용하지 않으므로 1차원 문자열 배열(["10101:이름"])로 변환
    const flatStringList = compactList.map((entry) =>
      Array.isArray(entry) ? `${entry[0]}:${entry[1]}` : String(entry)
    );
    setRuntimeRoster(flatStringList);
    return flatStringList;
  } catch (e) {
    return null;
  }
}

/**
 * 이메일로 학생 정보 조회 (Firestore 보안 명렬표 또는 이메일 패턴 2026GCNN@smy.ms.kr + Google 프로필 자동 파싱)
 */
export function findStudentByEmail(email, googleDisplayName = "") {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Firestore 보안 명렬표에서 정확히 일치하는 학생 반환
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
