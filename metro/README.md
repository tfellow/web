# MY Reading Metro · 문영 교과서 메트로

2022 개정 영어 교과서 본문을 지하철 노선도처럼 따라가며 읽는 앱이에요. 첫 화면: https://tfellow.github.io/web/metro/

- 노선 = 학년·교과서, 역 = 단원 본문. 지금은 YBM(박준언) 중1·중2 16개 역이 열려 있어요.
- 출구 다섯 개: ① 읽기(해석·끊어 읽기·문장 해설·음성) ② 분석 ③ 단어(플래시카드·짝 맞추기·철자·듣고 고르기, 간격 반복 복습) ④ 줄거리(빈칸 카드 드래그앤드롭 → 순서 맞추기 → 50단어 → 100단어) ⑤ 퀴즈(서버 채점, 근거 문장 링크)
- 로그인은 독서 여권·지식 여권과 같아요(Google → Supabase, 같은 profiles·교사 계정·외부 이용자 설정).
- 노선도와 분석 수치는 누구나 볼 수 있고, 본문·단어장·줄거리·퀴즈는 로그인한 이용자만 받을 수 있어요. 그래서 본문은 저장소에 두지 않고 Supabase(`tm_units`)에만 넣어요.

## 처음 한 번
1. Supabase SQL Editor에서 `metro/setup.sql` 실행 (기존 테이블·함수는 바꾸지 않아요)
2. 비공개로 받은 `metro_seed.sql` 실행 (본문·퀴즈 등록, 여러 번 실행해도 괜찮아요)

## 본문을 바꾸거나 늘릴 때
```
node metro/tools/build.mjs <비공개 출력 폴더>/ <비공개 퀴즈 폴더>/ <비공개 원본 폴더>/
```
- 저장소에 쓰는 것: `metro/catalog.js` (노선도·분석 수치, 본문 없음)
- 출력 폴더에만 쓰는 것: `metro_seed.sql` (Supabase 등록용), `metro_quiz.sql`, `metro_preview.js` (화면 미리보기용)
- YBM 중1·2 원본은 `textbook/data/<학년>-<단원>.js`에 있어요.
- 다른 교과서 본문은 저작권 때문에 저장소에 올리지 않고, 비공개 원본 폴더에 역마다 두 파일을 둬요.
  - `<역 id>.s.json`: `line`, `unit`, (스페셜 레슨이면 `no`: "S1", `lesson`), `meta`, `overview`, `chapters: [[이름, 쪽]]`, `s: [[장, 태그, "끊어 / 읽기 문장", 해석, 어휘, 문법, 의미]]`
  - `<역 id>.q.json`: `summaries`(6장면 + 50·100단어 요약), `summaryWords`, `quiz`(10문항, 정답을 `o`의 맨 앞에)
  - 노선은 `build.mjs`의 `LINES`에 `status: "src"`로 더하면, 원본이 있을 때만 노선도에 나타나요.

## 분석 수치
- 단어 수: 제목·소제목을 포함한 영어 낱말 수 (I’m = 1단어, 숫자도 1단어)
- CEFR (추정): CEFR-J Wordlist 1.5 + Octanove C1/C2 목록에서 낱말 수준을 찾고, 본문 낱말의 95%가 들어가는 가장 낮은 수준. 사람·나라 이름과 목록 외 낱말은 뺌
- Lexile (추정): 공식 Lexile®(MetaMetrics)이 아니에요. Flesch-Kincaid 학년 수준을 Lexile 범위로 바꾼 근삿값(±100L). 공식 값이 있으면 `catalog.js`의 `lexileOfficial`에 넣으면 ‘공식’으로 표시돼요.
- 단어 목록 출처: CEFR-J Wordlist Version 1.5 (Yukio Tono, TUFS, 무료 이용·출처 표기), Octanove Vocabulary Profile C1/C2 (CC BY-SA 4.0) — `tools/cefr/`
