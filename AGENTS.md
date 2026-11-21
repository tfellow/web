# MYeVerse 작업 규칙 (AI 도구용)

이 저장소(tfellow/web)는 GitHub Pages로 https://tfellow.github.io/web/ 에 바로 배포돼요.
ChatGPT·Codex·Claude 등 이 저장소에서 작업하는 모든 AI 도구는 아래 규칙을 지켜 주세요.

## 사이트 기본

- 사이트 이름은 **MYeVerse** (My English Universe)예요. 첫 페이지는 `myeverse/index.html`이고, 루트 `index.html`은 그쪽으로 넘겨 주기만 해요.
- 화면에 **학교 이름이나 교표를 쓰지 않아요.** 학교를 말해야 하면 "우리 학교"라고 써요.
- 로고: `assets/myeverse/logo.svg` (보라색 행성 타일). `myeverse/logo.svg`는 같은 파일의 복사본이에요.
- 앱 이름: 영어로 "MY ○○" + 짧은 한국어 부제 (예: MY Word Forest · 단어숲).
- 화면 글은 한국어, 영어 학습 내용은 영어를 같이 보여 줘요.

## 새 앱을 만들 때: 아래가 모두 끝나야 완성이에요

1. **첫 페이지 등록**: `myeverse/index.html`에 앱 카드를 넣고, 앱 서랍 `assets/my-apps.js`의 `APPS` 목록에도 넣어요. `my-apps.js`를 바꾸면 이 파일을 불러오는 모든 페이지의 `?v=` 숫자를 올려요.
2. **같은 로그인**: 다른 앱과 같은 Supabase 프로젝트와 같은 Google 로그인(Google Identity Services, 같은 client ID)을 써요. 한 앱에서 로그인하면 다른 앱도 이어서 열려요.
3. **관리자**: SQL에서는 `public.is_admin()`(admins 표)으로 확인하고, JS의 관리자 목록은 기존 앱(예: `teacher/hub.js`)과 똑같이 맞춰요.
4. **학생 로그인**: 기본은 학교 계정(@smy.ms.kr)만이에요. 다른 이메일을 허용하는 설정은 만들되, **처음에는 꺼 둬요.**
5. **교사 화면**: 주소로 바로 열 수 있게 만들어요 (예: `#/teacher` 또는 `admin.html`).
6. **Teacher Hub (`teacher/`)**:
   - `teacher/index.html` 앱 바로가기에 등록하고, 교사 화면이 있으면 "교사" 표시 링크를 달아요.
   - `teacher/hub.js`에서 학생 기록을 모아요: `APPS` 목록, `sbLoad()` 안의 불러오기, `cell()`, `studentSummary()`, `evValue()`, 그리고 두 군데의 `clearApps([...])` 목록.
7. **학생 페이지 MY English Journey (`me/index.html`)**: `APPS` 목록과 앱별 기록 카드를 넣어요.
8. **기록은 서버에 저장해요.** 학생 이메일과 함께 Supabase에 저장해야 Teacher Hub와 학생 페이지에 나와요. 브라우저(localStorage)에만 저장하면 안 돼요.
9. **머리글 규칙**: 모든 페이지의 `</body>` 앞에 `<script src="../assets/myeverse-brand.js?v=3" defer></script>`를 넣어요 (폴더 깊이에 맞게 `../` 조정). 로고를 누르면 첫 페이지, 앱 이름을 누르면 앱 첫 화면으로 가요. 파비콘도 MYeVerse 로고를 써요.
10. **개인정보처리방침 (`privacy.html`)**: 적용 앱 목록과 "처리 위탁 및 저장 위치" 표에 새 앱을 넣어요.
11. **학생용 설명서**: `guide.html` 같은 설명서를 만들고, 앱을 고칠 때 함께 고쳐요.
12. **기기**: 학생은 주로 갤럭시 탭 S7 FE와 휴대폰(Chrome)을 써요. 터치하기 쉽고, 좁은 화면에서도 가로로 넘치지 않게 만들어요. 체험(demo) 모드는 꺼서 배포해요. 고친 CSS·JS에는 `?v=` 숫자를 올려요.
13. **데이터베이스**: SQL 파일은 앱 폴더에 두고 RLS를 켜요. 학생은 자기 기록만, 관리자는 전체를 읽을 수 있게 해요. SQL은 선생님이 Supabase에서 직접 실행하니, 실행이 필요하면 분명하게 알려 줘요.

## 저장소 작업

- 시작하기 전에 `git pull --ff-only`로 최신 상태를 받아요.
- 커밋할 때는 바꾼 파일만 이름을 정확히 적어서 올려요 (`git add .` 금지). 학생 명단 같은 개인정보 파일이 실수로 올라간 적이 있어요.
- 다른 작업자가 커밋하지 않고 남겨 둔 파일은 건드리지 않아요.
- 비밀 키(서비스 키, 비밀번호 등)는 절대 커밋하지 않아요. Supabase의 publishable 키만 코드에 둘 수 있어요.
- 기존 앱의 데이터 이름(표 이름, Firebase 경로, localStorage 키)은 화면 이름이 바뀌어도 그대로 둬요. 바꾸면 학생 기록이 사라져요.
