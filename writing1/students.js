/**
 * 서울문영여자중학교 학생 명렬표 도우미
 * - 이 파일에는 학생 이름·학번·이메일이 전혀 들어 있지 않아요 (암호문도 없어요).
 * - 명렬표는 Firestore 의 교사 전용 문서(writing1_private/config)에만 저장되고,
 *   학생은 자기 한 줄(writing1_students/{이메일})만 읽을 수 있어요.
 */

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
