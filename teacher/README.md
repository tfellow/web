# MY Teacher Hub · 통합 교사 현황

여러 앱의 학생 기록을 한 화면에서 보는 교사용 페이지예요. 각 앱의 저장소를 선생님 계정으로 **읽기만** 해요. 어떤 앱의 기록도 바꾸지 않아요.

- 주소: https://tfellow.github.io/web/teacher/
- 체험 모드 (가상 학생 기록): 지금 꺼 둠 (hub.js 의 DEMO_ENABLED)
- 교사 계정: tfellow@gmail.com, tfellow@smy.ms.kr

## 연결하는 저장소 (처음 한 번씩 Google 로그인)

| 저장소 | 앱 | 읽는 자료 |
|---|---|---|
| Supabase `tfellow-web` | 독서 여권 | `roster` 명단, `admin_attempts()` 퀴즈 기록, `books` 제목 |
| | MY Grammar | `mg_players`, `mg_stamps`, `mg_admin_by_student(기간)` |
| | Quiz Queens | Apps Script `getInitialData` (Supabase 토큰으로 교사 확인) |
| | MY Brain Up | `bu_daily` 학생×날짜 합계 (하루 1줄 = 기록 1개: 푼 문제·맞힌 문제·점수·영어·오늘의 10문제). 보상 기준: 맞힌 문제, 10문제 완주, 도전한 날 |
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

- 학생 수: 독서 여권 명단(roster, 약 180명)에 있는 학생 + 어느 앱이든 실제 기록이 있는 학교 계정만 보여요. Kahoot·writing1 명단의 연습용 가짜 학생은 이름·학번을 채우는 데만 쓰고 화면에는 안 나와요.
- Cloze: 보안 규칙상 연결한 교사 계정으로 만든 테스트의 제출만 읽어요. 다른 교사 계정으로 만든 테스트가 있으면 (테스트의 ownerEmail로 확인) 그 계정으로 바꾸는 버튼이 나와요.
- Kahoot: 수업 퀴즈 판수, 정답률, 3등 안·10등 안 횟수, 과제 수.

## 🎁 보상 (2단계)

- 규칙 예: "독서 여권 메달 5권마다 → 으쓱 1", "Kahoot 3등 안 1회마다 → 으쓱 1". 처음에는 추천 규칙 8개가 **꺼진 상태**로 만들어져요.
- 규칙마다 켜기/끄기, 점수 조건(예: 단어숲 90% 이상), 몇 번마다, 으쓱 개수, 대상 학년, **시작일**(그 전 기록은 세지 않음)을 정해요.
- 기준을 채운 학생은 **지급 대기함**에 모여요. 선생님이 [지급]을 눌러야 Class123에 들어가요. [지급하지 않고 넘기기]도 있어요.
- Class123에는 원래 으쓱과 똑같이 들어가요: 학생 으쓱 +n, 반 으쓱 +n(알 계산 포함), 기록 카드 "🎁 앱 연동"(메모에 규칙 내용).
- 규칙·지급 기록: RTDB `class123_plus/hub_rewards` (`rules`, `granted/{규칙}/{이메일키}`, `log`). Class123 앱이 통째로 저장하는 `class123_plus/tfellow_workspace`와 따로 있어서 지워지지 않아요.
- 같은 기록으로 두 번 받지 않아요: 규칙별로 "받을 수 있는 수 − 이미 받은 수"만 대기함에 나와요.

## 📤 학생 페이지 MY English Journey (3단계)

- 주소: https://tfellow.github.io/web/me/ (체험 모드 `?demo=1` 은 지금 꺼 둠, DEMO_ENABLED)
- 학생은 학교 계정 한 번 로그인(독서 여권과 같은 로그인)으로 자기 기록만 봐요: 이번 주 공부한 앱, 받은 으쓱, 다음 으쓱까지 남은 양, 앱별 기록, 최근 기록.
- 선생님이 Teacher Hub에서 세 저장소를 모두 연결하면 학생별 요약을 Supabase `hub_summary` 표에 자동으로 올려요(10분에 한 번, [지금 올리기]도 있어요).
- **처음 한 번**: Supabase SQL Editor에서 `teacher/supabase_hub_summary.sql`을 실행해 표를 만들어요. 학생은 자기 줄만 읽고, 쓰기는 교사만 할 수 있어요.
- 선생님 계정으로 열면 학생 이메일을 넣어 그 학생 화면을 미리 볼 수 있어요.
