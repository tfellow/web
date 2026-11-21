# MY Sentence Gym · 교과서 문장 체육관

교과서(YBM 박준언 중1·중2) 문장으로 하는 문장 단위 게임 9종. 첫 화면: https://tfellow.github.io/web/sentence/

- 로그인·서버 저장 없음. 기록·오답 노트·내 문장 세트는 브라우저 localStorage(`sg_*`)에만 저장.
- 다른 앱 파일은 바꾸지 않아요. `../textbook/data/*.js`(본문 sentences·대화 context·irregulars)와 `../app/emblem.png`, `../assets/my-apps.js`를 읽기만 해요.

## 파일
- `data/grammar.js` — 교과서 Language 페이지(문법 Use 예문 + Practice 정답 문장) 16단원 210문장. 형식 `[포인트(0=A,1=B), 영어, 한국어, 목표 표현, [틀린 보기…]]`. 틀린 보기는 그 자리에 넣으면 문법적으로 틀리는 것만.
- `core.js` — 자료 불러오기, 함정 보기 자동 생성(`SG.candidates`), 세션 엔진(틀린 문장은 끝에 다시, 모두 통과해야 클리어), 소리(Web Speech), 오답 노트, 라우터, 세트 공유 링크(`#set=` base64url JSON).
- `games.js` — 문장 조립 · 빈칸 4단계 · 어법 고르기 · 틀린 곳 찾기 · 형태 바꾸기 · 받아쓰기 · 대화 이어가기 · 순서 맞추기 · 스피드 매칭
- `pages.js` — 홈(범위 고르기), 오답 노트, 내 문장 세트
- `guide.html` — 사용 설명서 (앱을 바꾸면 함께 고치기)

## 문법 예문 늘리기
`data/grammar.js`의 단원 키(`"2-3"`)에 줄을 더하면 돼요. 목표 표현은 문장 속에 처음 나오는 모양 그대로(대소문자 무관) 써요.
