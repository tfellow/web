# MY Brain Up (랜덤 상식 퀴즈)

https://tfellow.github.io/web/brainup/ · 교사 화면: `#/teacher` · 설명서: `guide.html`

START를 누르면 8개 분야(국어·문학, 영어, 수학, 사회·역사, 과학, 예술·체육, 경제·시사, IT·미래기술)에서 랜덤으로 문제가 나와요. 객관식/단답형/랜덤을 고를 수 있고, 어느 분야든 쉬운 영어 문제가 섞여 나와요.

## 처음 한 번
Supabase → SQL Editor → `supabase_brainup.sql` 붙여 넣고 Run. (독서 여권과 같은 프로젝트·로그인·`is_admin`·`roster` 사용)

## 파일
| 파일 | 내용 |
|---|---|
| `parse.js` | 분야 목록, 엑셀·붙여넣기 표 읽기, 올리기 전 검사(정답·보기·중복·쉬운 영어), AI 프롬프트 |
| `app.js` | 로그인 · 홈 · 문제 풀기 · 순위 · 내 기록 · 교사 화면 |
| `supabase_brainup.sql` | 표, RLS, 문제 고르기·채점 함수 |
| `guide.html` | 학생·교사 설명서 |
| `../.github/workflows/supabase-keepalive.yml` | 매일 `bu_ping` 호출 (무료 프로젝트 7일 정지 방지) |

## 서버(Supabase) 구조
- `bu_questions`: 문제. 교사만 직접 읽기·쓰기 (정답 포함). 학생은 `bu_next`로 정답 없는 문제만 받아요.
- `bu_ticket`: 학생마다 지금 풀고 있는 문제 1개. 새로고침해도 같은 문제, 시간이 지나면 오답 처리.
- `bu_next(mode, qtype)`: random(분야를 먼저 골고루 뽑고 → 그 분야에서 아직 못 맞힌 문제, 영어 비율 적용, 가끔 👑) / daily(그날 정해진 10문제, `bu_d10`) / review(틀린 문제).
- `bu_answer(given)`: 서버 채점. 객관식 1점, 단답형 2점(공백·문장부호·대소문자 무시, `|`로 여러 정답), 영어 +1(한국어 보기 안 썼을 때), 10문제 완주 +3.
- `bu_daily`: 학생×날짜 합계(푼 수·맞힌 수·점수·형식별·영어·분야별 `cats`, 오늘의 10문제 `d10`). 답 하나하나는 저장하지 않아요.
- `bu_qstate`: 학생×문제 상태(시도·정답 수·마지막 정답 여부). 오답 노트, 문제별 정답률.
- `bu_profile`: 닉네임, 배지, 왕관 찬스 날짜, 아이템 사용(하루 50:50 3번, 건너뛰기 3번).
- `bu_board(scope)`: week / all / acc(20문제 이상) / class(이번 주 반 점수 ÷ 반 인원).
- `bu_settings`: open, english_ratio, english_day(날짜 문자열 = 그날만), timer, allow_external, crown_rate.

## 문제 파일 형식 (13칸)
`분야 | 형식 | 언어 | 문제 | 보기1 | 보기2 | 보기3 | 보기4 | 정답 | 해설 | 한국어 번역 | 학년 | 난이도`
객관식 정답은 번호(①, A, 보기 글자도 알아봐요). 단답형 다른 정답은 `;` 또는 `|`.
