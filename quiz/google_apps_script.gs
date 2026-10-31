/**
 * ============================================================================
 * QUIZ QUEENS (퀴즈 퀸즈) - 서울문영여자중학교 (Seoul Moonyoung Girls' Middle School)
 * Google Sheets 백엔드 스크립트 (google_apps_script.gs v2.0 - 8대 영역 & 학생출제 지원)
 * ============================================================================
 *
 * [특징 및 기능]
 * 1. 선생님 작업용 [영역별 개별 탭 8개] 지원 (난이도, 해설 없이 질문·보기1~4·정답만 간결 입력!)
 * 2. 상단 메뉴 [👑 퀴즈 퀸즈 > 🔄 영역별 탭 ➡️ 문제은행 자동 통합] 클릭 시 1초 만에 최종 취합!
 * 3. 웹앱은 오직 [문제은행] 1개 탭만 읽으므로 로딩 속도 0.2초 초고속 유지!
 * 4. 학생이 직접 낸 퀴즈 및 상호 평가(좋아요/나빠요) 실시간 동기화 지원!
 */

const SHEET_NAMES = {
  STUDENTS: '학생통계',
  MASTER_QUESTIONS: '문제은행',
  STUDENT_SUBMISSIONS: '학생출제_검토',
  LOGS: '풀이로그',
  CERTS: '인증서발급내역'
};

const CATEGORY_TABS = [
  { tabName: '1.학교상식', catId: 'school' },
  { tabName: '2.교과융합', catId: 'curriculum' },
  { tabName: '3.시사경제', catId: 'economy' },
  { tabName: '4.세계지리', catId: 'world' },
  { tabName: '5.과학미래', catId: 'science' },
  { tabName: '6.예술문화', catId: 'culture' },
  { tabName: '7.글로벌영어', catId: 'english' },
  { tabName: '8.문학고전', catId: 'literature' }
];

/**
 * 스프레드시트 열릴 때 상단 커스텀 메뉴 자동 생성
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('👑 퀴즈 퀸즈')
    .addItem('🔄 영역별 탭 내용 ➡️ [문제은행] 탭으로 자동 통합', 'syncCategoryTabsToQuestionBank')
    .addSeparator()
    .addItem('⚙️ 전체 시트 탭 초기 설정 (최초 1회)', 'setupSheets')
    .addToUi();
}

/**
 * 최초 1회 실행하여 필요한 시트 탭과 헤더를 자동으로 생성합니다.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 학생통계 시트
  let stuSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  if (!stuSheet) {
    stuSheet = ss.insertSheet(SHEET_NAMES.STUDENTS);
    stuSheet.appendRow([
      '이메일', '닉네임(공개)', '실명(교사용)', '학급(1-1~3-4)', '출석번호',
      '레벨', '경험치(XP)', '연속도전일수', '최고연속도전일',
      '총푼문제', '총정답수', '정확도(%)', '최고콤보',
      '수집마스코트JSON', '발급인증서JSON', '분야별통계JSON', '최근업데이트'
    ]);
    stuSheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#EDE9FE');
    stuSheet.getRange('D:D').setNumberFormat('@');
  }

  // 2. 최종 취합 [문제은행] 탭
  let masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  if (!masterSheet) {
    masterSheet = ss.insertSheet(SHEET_NAMES.MASTER_QUESTIONS);
    masterSheet.appendRow([
      '문항ID', '분야', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)',
      '출제자', '좋아요(👍)', '나빠요(👎)', '상태(정상/보류)'
    ]);
    masterSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#FEF3C7');
  }

  // 3. 학생 출제 검토 탭
  let subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
  if (!subSheet) {
    subSheet = ss.insertSheet(SHEET_NAMES.STUDENT_SUBMISSIONS);
    subSheet.appendRow([
      '등록일시', '문항ID', '분야', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호',
      '출제학생(이메일·실명)', '좋아요(👍)', '나빠요(👎)', '상태(정상/보류)'
    ]);
    subSheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#FCE7F3');
  }

  // 4. 선생님용 8대 영역별 개별 탭 생성 (난이도·해설 없이 간결한 7개 열!)
  CATEGORY_TABS.forEach(cat => {
    let catSheet = ss.getSheetByName(cat.tabName);
    if (!catSheet) {
      catSheet = ss.insertSheet(cat.tabName);
      catSheet.appendRow([
        '문항ID', '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)'
      ]);
      catSheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#E0F2FE');
    }
  });

  // 5. 풀이로그 시트
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
    logSheet.appendRow([
      '일시', '일자(YYYY-MM-DD)', '이메일', '학급', '닉네임', '실명',
      '분야', '문항ID', '정답여부', '현재레벨', '누적XP', '연속도전일수'
    ]);
    logSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#DCFCE7');
  }

  // 6. 인증서발급내역 시트
  let certSheet = ss.getSheetByName(SHEET_NAMES.CERTS);
  if (!certSheet) {
    certSheet = ss.insertSheet(SHEET_NAMES.CERTS);
    certSheet.appendRow([
      '발송일시', '수신이메일', '학급', '닉네임', '실명',
      '달성레벨', '인증서명', '부여칭호', '총푼문제', '정확도(%)'
    ]);
    certSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#F3E8FF');
  }
}

/**
 * [핵심 기능] 선생님이 작업하신 8개 개별 탭의 문제들을 [문제은행] 탭으로 자동 통합합니다.
 */
function syncCategoryTabsToQuestionBank() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  if (!masterSheet) {
    setupSheets();
    masterSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  }

  // 기존 문제은행에서 학생이 출제한 문제나 평가 수치(좋아요/나빠요/상태) 맵 보존
  const existingRows = masterSheet.getDataRange().getValues();
  const metaMap = {};
  for (let i = 1; i < existingRows.length; i++) {
    const r = existingRows[i];
    const qId = String(r[0]);
    if (qId) {
      metaMap[qId] = {
        author: r[8] || '선생님',
        likes: Number(r[9]) || 0,
        dislikes: Number(r[10]) || 0,
        status: r[11] || '정상'
      };
    }
  }

  const allCompiledRows = [];

  // 1) 8개 개별 탭에서 문제 읽어오기
  CATEGORY_TABS.forEach(cat => {
    const sheet = ss.getSheetByName(cat.tabName);
    if (!sheet) return;
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const qId = String(row[0] || '').trim();
      const question = String(row[1] || '').trim();
      if (!question) continue;

      const realId = qId || `${cat.catId}_${i}`;
      const meta = metaMap[realId] || { author: '선생님', likes: 0, dislikes: 0, status: '정상' };

      allCompiledRows.push([
        realId,
        cat.catId,
        question,
        String(row[2] || ''),
        String(row[3] || ''),
        String(row[4] || ''),
        String(row[5] || ''),
        Number(row[6]) || 1,
        meta.author,
        meta.likes,
        meta.dislikes,
        meta.status
      ]);
    }
  });

  // 2) 학생 출제 검토 시트에서 '정상' 상태인 승인된 문제도 함께 통합
  const subSheet = ss.getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
  if (subSheet) {
    const subValues = subSheet.getDataRange().getValues();
    for (let i = 1; i < subValues.length; i++) {
      const row = subValues[i];
      const qId = String(row[1] || '').trim();
      const catId = String(row[2] || 'school').trim();
      const question = String(row[3] || '').trim();
      const status = String(row[12] || '정상').trim();
      if (!question || status === '보류') continue;

      const meta = metaMap[qId] || {
        author: String(row[9] || '학생'),
        likes: Number(row[10]) || 0,
        dislikes: Number(row[11]) || 0,
        status: status
      };

      allCompiledRows.push([
        qId,
        catId,
        question,
        String(row[4] || ''),
        String(row[5] || ''),
        String(row[6] || ''),
        String(row[7] || ''),
        Number(row[8]) || 1,
        meta.author,
        meta.likes,
        meta.dislikes,
        meta.status
      ]);
    }
  }

  // 3) [문제은행] 탭 내용 전면 갱신
  if (masterSheet.getLastRow() > 1) {
    masterSheet.getRange(2, 1, masterSheet.getLastRow() - 1, 12).clearContent();
  }
  if (allCompiledRows.length > 0) {
    masterSheet.getRange(2, 1, allCompiledRows.length, 12).setValues(allCompiledRows);
  }

  SpreadsheetApp.getActiveSpreadsheet().toast(
    `✅ 총 ${allCompiledRows.length}개의 문제를 [문제은행] 탭으로 자동 통합했습니다!`,
    '통합 완료',
    5
  );
}

/**
 * GET 요청 처리: 학생 통계 목록 및 통합된 [문제은행] 반환 (초고속 단일 조회)
 */
function doGet(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 학생 통계 조회
  const stuSheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const stuValues = stuSheet.getDataRange().getValues();
  const users = [];
  for (let i = 1; i < stuValues.length; i++) {
    const r = stuValues[i];
    if (!r[0]) continue;
    users.push({
      email: String(r[0]),
      nickname: String(r[1] || r[2]),
      name: String(r[2] || r[1]),
      classId: String(r[3] || '2-2'),
      studentNo: Number(r[4]) || 1,
      level: Number(r[5]) || 1,
      xp: Number(r[6]) || 0,
      streakDays: Number(r[7]) || 1,
      maxStreakDays: Number(r[8]) || 1,
      totalSolved: Number(r[9]) || 0,
      totalCorrect: Number(r[10]) || 0,
      maxCombo: Number(r[12]) || 0,
      mascots: safeJsonParse(r[13], []),
      certificates: safeJsonParse(r[14], []),
      categoryStats: safeJsonParse(r[15], {}),
      updatedAt: String(r[16] || '')
    });
  }

  // [문제은행] 단일 조회
  const qSheet = ss.getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
  const qValues = qSheet.getDataRange().getValues();
  const questions = [];
  for (let i = 1; i < qValues.length; i++) {
    const r = qValues[i];
    if (!r[0] || !r[2]) continue;
    const status = String(r[11] || '정상');
    if (status === '보류') continue; // 보류된 문제는 출제 목록에서 제외

    questions.push({
      id: String(r[0]),
      category: String(r[1] || 'school'),
      question: String(r[2]),
      options: [String(r[3]), String(r[4]), String(r[5]), String(r[6])],
      answer: Number(r[7]) || 1,
      author: String(r[8] || '선생님'),
      likes: Number(r[9]) || 0,
      dislikes: Number(r[10]) || 0,
      status: status
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', users, questions }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리: 학생 기록 저장, 학생 출제 문제 등록, 상호 평가(좋아요/나빠요)
 */
function doPost(e) {
  setupSheets();
  const data = JSON.parse(e.postData.contents);
  const action = data.action;

  if (action === 'saveQuizLog' || action === 'syncUser') {
    if (data.user) {
      upsertStudentRow(data.user);
    }
    if (action === 'saveQuizLog' && data.user) {
      const logSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.LOGS);
      const now = new Date();
      logSheet.appendRow([
        now.toISOString(),
        now.toISOString().slice(0, 10),
        data.user.email,
        data.user.classId || '교사',
        data.user.nickname,
        data.user.name,
        data.category || '',
        data.questionId || '',
        data.isCorrect ? 'O' : 'X',
        data.user.level,
        data.user.xp,
        data.user.streakDays || 1
      ]);
    }
    return makeJsonResponse({ status: 'ok' });
  }

  // 학생 직접 문제 출제
  if (action === 'submitStudentQuestion' && data.question) {
    const q = data.question;
    const subSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.STUDENT_SUBMISSIONS);
    const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
    const now = new Date();
    const qId = q.id || `stu_${Date.now()}`;

    // 1) 학생출제_검토 시트에 기록
    subSheet.appendRow([
      now.toISOString(),
      qId,
      q.category,
      q.question,
      q.options[0],
      q.options[1],
      q.options[2],
      q.options[3],
      q.answer,
      q.author || '학생',
      0, 0, '정상'
    ]);

    // 2) 문제은행 탭에도 즉시 반영
    masterSheet.appendRow([
      qId,
      q.category,
      q.question,
      q.options[0],
      q.options[1],
      q.options[2],
      q.options[3],
      q.answer,
      q.author || '학생',
      0, 0, '정상'
    ]);

    return makeJsonResponse({ status: 'ok', id: qId });
  }

  // 상호 평가 (좋아요 / 나빠요 투표 및 자동 보류)
  if (action === 'voteQuestion' && data.questionId) {
    const masterSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.MASTER_QUESTIONS);
    const rows = masterSheet.getDataRange().getValues();
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === String(data.questionId)) {
        let likes = Number(rows[i][9]) || 0;
        let dislikes = Number(rows[i][10]) || 0;
        if (data.vote === 'like') likes++;
        if (data.vote === 'dislike') dislikes++;

        // 나빠요 3회 이상 시 자동 보류
        let status = rows[i][11] || '정상';
        if (dislikes >= 3) {
          status = '보류';
        }

        masterSheet.getRange(i + 1, 10, 1, 3).setValues([[likes, dislikes, status]]);
        break;
      }
    }
    return makeJsonResponse({ status: 'ok' });
  }

  return makeJsonResponse({ status: 'ignored' });
}

function upsertStudentRow(user) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.STUDENTS);
  const values = sheet.getDataRange().getValues();
  const email = String(user.email).toLowerCase().trim();

  let targetRow = -1;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase().trim() === email) {
      targetRow = i + 1;
      break;
    }
  }

  const rowData = [
    email,
    user.nickname || '',
    user.name || '',
    user.classId || '',
    user.studentNo || '',
    user.level || 1,
    user.xp || 0,
    user.streakDays || 1,
    user.maxStreakDays || 1,
    user.totalSolved || 0,
    user.totalCorrect || 0,
    user.totalSolved > 0 ? Math.round((user.totalCorrect / user.totalSolved) * 100) : 0,
    user.maxCombo || 0,
    JSON.stringify(user.mascots || []),
    JSON.stringify(user.certificates || []),
    JSON.stringify(user.categoryStats || {}),
    new Date().toISOString()
  ];

  if (targetRow !== -1) {
    sheet.getRange(targetRow, 1, 1, 17).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
}

function safeJsonParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

function makeJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
