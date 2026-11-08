# MY Teacher Hub · 통합 교사 현황

여러 앱의 학생 기록을 한 화면에서 보는 교사용 페이지예요. 각 앱의 저장소를 선생님 계정으로 **읽기만** 해요. 어떤 앱의 기록도 바꾸지 않아요.

- 주소: https://tfellow.github.io/web/teacher/
- 체험 모드 (가상 학생 기록): https://tfellow.github.io/web/teacher/?demo=1
- 교사 계정: tfellow@gmail.com, tfellow@smy.ms.kr

## 연결하는 저장소 (처음 한 번씩 Google 로그인)

| 저장소 | 앱 | 읽는 자료 |
|---|---|---|
| Supabase `tfellow-web` | 독서 여권 | `roster` 명단, `admin_attempts()` 퀴즈 기록, `books` 제목 |
| | MY Grammar | `mg_players`, `mg_stamps`, `mg_admin_by_student(기간)` |
| | Quiz Queens | Apps Script `getInitialData` (Supabase 토큰으로 교사 확인) |
| Firebase `cloze-a8e6c` | 단어숲 | `vocab_users`(누적 통계), `vocab_results`(단원 테스트) |
| | 영작문 writing1 | `vocab_results` 중 `appTag = writing1_submission` |
| | MY Cloze | `users`, `submissions` (**로그인한 계정이 만든 테스트만**: 보안 규칙) |
| Firebase `my-kahoot-smy` (RTDB) | MY Kahoot | `schoolRoster`, `teacherData/quizHistory`, `homework`, `homeworkResults` |
| | Class123 | `class123_plus/tfellow_workspace/classes` (으쓱·머쓱 누적) |

- 같은 주소(tfellow.github.io)의 독서 여권, 단어숲, Cloze에 이미 로그인되어 있으면 그 로그인을 그대로 이어받아요.
- 학생은 **이메일**로 묶어요. 학번 이메일 9자리(입학연도4 + 학년1 + 반2 + 번호2)로 학년·반·번호를 알아내고, 이름은 독서 여권 명단을 먼저 써요.
- Class123 학생에게는 이메일이 없어서 반 이름(예: "2학년 3반")과 이름(또는 번호)으로 명단과 맞춰요.

## 화면

- 📊 반별 요약: 기간 안에 앱별로 활동한 학생 비율
- 👤 학생별: 앱별 기록 한 줄 표, 정렬, 이름을 누르면 전체 기록
- 😴 관심 필요: N일 넘게 어느 앱에서도 활동이 없는 학생
- 🕒 최근 활동: 모든 앱의 기록을 시간 순서로
- CSV 내려받기, 표시할 앱 고르기, 기간(오늘·이번 주·최근 7일·이번 달·최근 30일·전체·직접)

## 다음 단계 (계획)

2단계: 규칙(예: 메달 5개 → 으쓱 1)에 따라 "지급 대기함"에 모으고, 선생님이 승인하면 Class123에 으쓱을 넣어요.
