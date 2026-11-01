# 단어숲 — 학교 영어 어휘 학습 웹앱

휴대폰·태블릿에서 쓰는 어휘 학습 + 테스트 웹앱입니다. 설치 없이 브라우저로 접속하고, "홈 화면에 추가"하면 앱처럼 쓸 수 있습니다.

- **체험 모드**: `src/config.js`의 `apiKey`가 비어 있으면 기록이 그 기기 브라우저에만 저장됩니다. 교사 화면에는 가상의 학생 32명 데이터가 들어 있습니다.
- **운영 모드**: Firebase(구글)를 연결하면 학생 기록이 서버에 저장되고, 선생님이 어느 기기에서든 반 전체 통계를 볼 수 있습니다.

## 현재 설치 상태 (서울문영여자중학교)

- 주소: https://tfellow.github.io/web/danuhsup/
- GitHub 저장소 `tfellow/web` 의 `danuhsup/` 폴더에 들어 있고, 다른 앱처럼 master 에 올라가면 바로 공개됩니다.
- Firebase 는 **SMY Cloze 와 같은 프로젝트(cloze-a8e6c)** 를 함께 씁니다. 단어숲 데이터는 `vocab_` 로 시작하는 컬렉션에만 저장되어 Cloze 데이터와 섞이지 않습니다.
- 로그인: 학교 구글 계정(@smy.ms.kr). 교사: tfellow@gmail.com, tfellow@smy.ms.kr
- **처음 한 번 할 일**: Firebase 콘솔 → Firestore Database → 규칙 탭에 `firestore.rules` 내용을 통째로 붙여 넣고 [게시]. (Cloze 규칙이 포함된 합본이라 Cloze 도 그대로 작동합니다.)

### 고치는 방법
`source/` 폴더가 원본 코드입니다. 고친 뒤 `cd source && npm install && node build.mjs` 를 실행하면 `source/dist/` 가 만들어지고, 그 안의 파일을 `danuhsup/` 로 복사하면 됩니다.

## 기능 한눈에 보기

| 학생 | 교사 |
|---|---|
| 스마트 학습(새 단어 → 객관식 → 철자까지 단계별, 간격 반복 복습) | 대시보드: 오늘 학습 인원, 7일 참여율, 평균 정답률, 테스트 평균 |
| 단어 카드(뒤집기·스와이프, 자동 발음) | 일별 학습 학생 수, 단원별 암기율·학습률·테스트 평균 |
| 퀴즈 6종: 뜻 고르기, 단어 고르기, 영영풀이, 듣고 고르기, 예문 빈칸, 철자 쓰기 | 반별 비교표(참여율, XP, 학습/암기 단어, 정답률, 테스트, 연속일) |
| 짝 맞추기 게임(시간 기록) | 관심 필요 학생(3일 이상 미접속, 정답률 낮음), 칭찬할 학생 |
| 단원 테스트 20문항 → 결과가 교사에게 전달 | 학생별 표(정렬·검색) + 개인 상세(학습 달력, 단원 진도, 자주 틀리는 단어, 테스트 기록, 배지) |
| 오늘의 복습, 오답 노트, 즐겨찾기, 랜덤 20 | 단어 분석: 오답률 높은 단어 순위(단원별) |
| 연속 학습일(+보호권), 하루 목표, XP·레벨, 배지 22종, 반/학년 주간 랭킹 | 테스트 결과: 학생 × 단원 점수표, 최근 응시 |
| 학습 달력, 테스트 기록, 발음(미국/영국, 속도) 설정 | 단어장 업로드(엑셀/CSV), CSV 내보내기(구글 시트로 열기) |

## 단어장 형식

지금 쓰시는 엑셀과 같은 머리글이면 교사 화면 → 단어장에서 그대로 올릴 수 있습니다.

`grade | lesson | no. | words | 한글 뜻 | 영영풀이 | 예문 | 예문 해석`

품사는 `n. 수족관`처럼 뜻 앞에 쓰면 자동으로 분리됩니다.

## 다른 학교에서 새로 설치할 때 (Firebase, 무료 요금제로 충분)

1. https://console.firebase.google.com 에서 구글 계정으로 **프로젝트 만들기** (애널리틱스는 꺼도 됩니다).
2. **Authentication → 시작하기 → 로그인 방법**에서 `Google`을 사용 설정합니다.
   - (선택) 구글 계정이 없는 학생을 위해 학번+비밀번호 로그인을 켜려면 `이메일/비밀번호`도 사용 설정하고 `src/config.js`의 `studentIdLogin`을 `true`로 바꿉니다.
3. **Firestore Database → 데이터베이스 만들기**: 위치는 `asia-northeast3 (서울)`, 프로덕션 모드로 만듭니다.
4. **프로젝트 설정(톱니바퀴) → 내 앱 → 웹(</>)** 앱을 추가하고, 나오는 `firebaseConfig` 값을 `src/config.js`에 붙여 넣습니다.
5. `src/config.js`의 `teacherEmails`와 `firestore.rules`의 `TEACHERS()`에 선생님 구글 이메일을 넣습니다(두 곳 똑같이).
6. `.firebaserc`의 프로젝트 ID를 바꿉니다.
7. 컴퓨터에 Node.js(https://nodejs.org)를 설치하고, 이 폴더에서:
   ```
   npm install
   npm run build
   npx firebase-tools login
   npx firebase-tools deploy
   ```
   끝나면 `https://<프로젝트ID>.web.app` 주소가 나옵니다. 이 주소를 학생들에게 알려 주세요.

학교 구글 계정만 허용하려면 `src/config.js`의 `allowedGoogleDomain`에 학교 도메인을 적습니다.

### 알아 두실 점
- 학생은 처음 구글 로그인할 때 이름·학년·반·번호를 한 번 입력합니다.
- 학생은 다른 학생의 상세 기록을 볼 수 없고, 랭킹에는 이름·XP·연속일만 공개됩니다.
- Gemini(AI 예문/암기 요령): Firebase 콘솔 → AI Logic을 켠 뒤 `enableGemini: true`로 바꾸면 단어 상세 창에 버튼이 나타납니다.

## 폴더 구조

```
src/config.js          설정 (Firebase 값, 교사 이메일, 학교 이름)
src/data/              단어장 (g2-park.json = 첨부 엑셀 356단어)
src/lib/game.js        간격 반복, XP·레벨, 연속 학습, 배지 규칙
src/lib/quiz.js        문제 생성기 (예문 빈칸 자동 생성 포함)
src/store/local.js     체험 모드 저장소 (+가상 학생 데이터)
src/store/firebase.js  운영 모드 저장소 (Auth + Firestore)
src/views/             화면 (로그인, 학생, 학습 진행, 교사)
firestore.rules        보안 규칙
build.mjs              빌드 → dist/ (배포용), demo/ (단일 파일 체험판)
```
