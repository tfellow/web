/**
 * ============================================================================
 * QUIZ QUEENS (퀴즈 퀸즈) - 서울문영여자중학교 (Seoul Moonyoung Girls' Middle School)
 * Google Sheets + Gmail 인증서 자동 발송 백엔드 스크립트 (google_apps_script.gs v1.1)
 * ============================================================================
 *
 * [설치 및 배포 방법 (3분 완성)]
 * 1. 구글 드라이브에서 새 [Google 스프레드시트]를 만듭니다 (권장 계정: tfellow@smy.ms.kr 또는 tfellow@gmail.com).
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 지우고 이 파일의 내용을 모두 복사해 붙여넣은 뒤 저장(Ctrl+S)합니다.
 * 4. 상단 함수 선택 드롭다운에서 `setupSheets`를 선택하고 [실행]을 한 번 눌러 4개의 시트 탭을 자동 생성합니다.
 * 5. 우측 상단 [배포] -> [새 배포] -> 유형: [웹 앱] 선택:
 *    - 다음 사용자 인증 정보로 실행: [나 (본인 계정)]
 *    - 액세스 권한이 있는 사용자: [모든 사용자]
 * 6. 배포 후 나오는 [웹 앱 URL (https://script.google.com/macros/s/.../exec)]을 복사하여
 *    퀴즈 퀸즈 웹앱의 [👩‍🏫 선생님 관리·통계 > ⚙️ 구글 시트 & 문제 추가] 탭에 붙여넣고 저장하면 즉시 연동됩니다!
 */

const SHEET_NAMES = {
  STUDENTS: '학생통계',
  QUESTIONS: '문제은행',
  LOGS: '풀이로그',
  CERTS: '인증서발급내역'
};

/**
 * 최초 1회 실행하여 필요한 시트 탭과 헤더를 자동으로 생성합니다.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. 학생통계 시트 (닉네임, 실명, 연속도전일수 모두 저장)
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
  }

  // 2. 문제은행 시트
  let qSheet = ss.getSheetByName(SHEET_NAMES.QUESTIONS);
  if (!qSheet) {
    qSheet = ss.insertSheet(SHEET_NAMES.QUESTIONS);
    qSheet.appendRow([
      '문항ID', '분야(school/curriculum/economy/world/science/culture)', '난이도',
      '질문', '보기1', '보기2', '보기3', '보기4', '정답번호(1~4)', '해설'
    ]);
    qSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#FEF3C7');
  }

  // 3. 풀이로그 시트 (기간별/일별 통계 분석용)
  let logSheet = ss.getSheetByName(SHEET_NAMES.LOGS);
  if (!logSheet) {
    logSheet = ss.insertSheet(SHEET_NAMES.LOGS);
    logSheet.appendRow([
      '일시', '일자(YYYY-MM-DD)', '이메일', '학급', '닉네임', '실명',
      '분야', '문항ID', '정답여부', '현재레벨', '누적XP', '연속도전일수'
    ]);
    logSheet.getRange(1, 1, 1, 12).setFontWeight('bold').setBackground('#DCFCE7');
  }

  // 4. 인증서발급내역 시트
  let certSheet = ss.getSheetByName(SHEET_NAMES.CERTS);
  if (!certSheet) {
    certSheet = ss.insertSheet(SHEET_NAMES.CERTS);
    certSheet.appendRow([
      '발송일시', '수신이메일', '학급', '닉네임', '실명',
      '달성레벨', '인증서명', '부여칭호', '총푼문제', '정확도(%)'
    ]);
    certSheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#FCE7F3');
  }
}

/**
 * GET 요청 처리: 학생 통계 목록 및 시트에 추가된 문제은행 반환
 */
function doGet(e) {
  setupSheets();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

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
      solvedQuestionIds: [],
      updatedAt: String(r[16] || '')
    });
  }

  const qSheet = ss.getSheetByName(SHEET_NAMES.QUESTIONS);
  const qValues = qSheet.getDataRange().getValues();
  const questions = [];
  for (let i = 1; i < qValues.length; i++) {
    const r = qValues[i];
    if (!r[0] || !r[3]) continue;
    questions.push({
      id: String(r[0]),
      category: String(r[1] || 'school'),
      difficulty: String(r[2] || '보통'),
      question: String(r[3]),
      options: [String(r[4]), String(r[5]), String(r[6]), String(r[7])],
      answer: Number(r[8]) || 1,
      explanation: String(r[9] || '')
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', users, questions }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * POST 요청 처리: 학생 기록 저장, 문제 추가, 레벨 달성 인증서 이메일 발송
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
      const dateStr = Utilities.formatDate(now, 'Asia/Seoul', 'yyyy-MM-dd');
      logSheet.appendRow([
        now,
        dateStr,
        data.user.email,
        data.user.classId,
        data.user.nickname || data.user.name,
        data.user.name,
        data.category || '',
        data.questionId || '',
        data.isCorrect ? 'O' : 'X',
        data.user.level,
        data.user.xp,
        data.user.streakDays || 1
      ]);
    }
  } else if (action === 'addQuestion' && data.question) {
    const q = data.question;
    const qSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.QUESTIONS);
    qSheet.appendRow([
      q.id, q.category, q.difficulty, q.question,
      q.options[0], q.options[1], q.options[2], q.options[3],
      q.answer, q.explanation
    ]);
  } else if (action === 'sendCertificateEmail') {
    sendLevelCertificateEmail(data);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 학생 통계 시트에 학생 데이터를 업데이트하거나 새로 추가합니다.
 */
function upsertStudentRow(user) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.STUDENTS);
  const values = sheet.getDataRange().getValues();
  const acc = user.totalSolved > 0 ? ((user.totalCorrect / user.totalSolved) * 100).toFixed(1) : '0.0';

  const rowData = [
    user.email,
    user.nickname || user.name,
    user.name,
    user.classId,
    user.studentNo,
    user.level,
    user.xp,
    user.streakDays || 1,
    user.maxStreakDays || 1,
    user.totalSolved,
    user.totalCorrect,
    acc,
    user.maxCombo,
    JSON.stringify(user.mascots || []),
    JSON.stringify(user.certificates || []),
    JSON.stringify(user.categoryStats || {}),
    new Date().toISOString()
  ];

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]).toLowerCase() === String(user.email).toLowerCase()) {
      sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
      return;
    }
  }
  sheet.appendRow(rowData);
}

/**
 * 학생의 학교 이메일(@smy.ms.kr)로 고화질 레벨 인증서(PNG 첨부 + HTML 본문)를 자동 발송합니다.
 */
function sendLevelCertificateEmail(data) {
  const certSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAMES.CERTS);
  certSheet.appendRow([
    new Date(),
    data.email,
    data.classLabel,
    data.nickname || data.name,
    data.name,
    data.level,
    data.certName,
    data.title,
    data.totalSolved,
    data.accuracy
  ]);

  const subject = `👑 [서울문영여자중학교 QUIZ QUEENS] 축하합니다! ${data.name}(${data.nickname || data.name}) 학생의 Lv.${data.level} 인증서가 도착했습니다!`;
  const htmlBody = `
    <div style="font-family:'Malgun Gothic',sans-serif; max-width:600px; margin:0 auto; padding:24px; border:2px solid #7C3AED; border-radius:16px; background:#FFFDF9;">
      <h2 style="color:#6D28D9; text-align:center;">👑 서울문영여자중학교 QUIZ QUEENS (퀴즈 퀸즈)</h2>
      <p style="font-size:16px; color:#1E293B; line-height:1.6;">
        안녕하세요, <strong>${data.classLabel} ${data.name} (닉네임: ${data.nickname || data.name})</strong> 학생!<br/>
        서울문영여자중학교 (Seoul Moonyoung Girls' Middle School) 상식 여왕 무한도전 <strong>『QUIZ QUEENS』</strong>에서 끊임없는 탐구심으로
        <strong>Lv.${data.level} (${data.certName})</strong> 달성을 진심으로 축하합니다! 🎉
      </p>
      <div style="background:#F5F3FF; padding:16px; border-radius:12px; margin:16px 0;">
        <p style="margin:4px 0;">🏅 <strong>달성 레벨 및 인증서:</strong> Lv.${data.level} — ${data.certName}</p>
        <p style="margin:4px 0;">✨ <strong>부여된 호칭:</strong> ${data.title}</p>
        <p style="margin:4px 0;">📊 <strong>누적 성취 기록:</strong> 총 ${data.totalSolved}문항 도전 (정확도 ${data.accuracy}%)</p>
      </div>
      <p style="font-size:14px; color:#64748B;">
        ※ 첨부된 고화질 공식 인증서 이미지(PNG)를 다운로드하여 간직하세요!<br/>
        — 서울문영여자중학교 『신바람 문영』 퀴즈 퀸즈 운영위원회 —
      </p>
    </div>
  `;

  const mailOptions = {
    to: data.email,
    subject: subject,
    htmlBody: htmlBody
  };

  if (data.imageBase64 && data.imageBase64.indexOf('base64,') !== -1) {
    const base64Data = data.imageBase64.split('base64,')[1];
    const blob = Utilities.newBlob(
      Utilities.base64Decode(base64Data),
      'image/png',
      `서울문영여자중학교_퀴즈퀸즈_인증서_${data.name}_Lv${data.level}.png`
    );
    mailOptions.attachments = [blob];
  }

  MailApp.sendEmail(mailOptions);
}

function safeJsonParse(str, fallback) {
  try {
    return str ? JSON.parse(str) : fallback;
  } catch (e) {
    return fallback;
  }
}
