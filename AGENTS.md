# MYeVerse 작업 규칙 (AI 도구용)

이 저장소(tfellow/web)는 GitHub Pages로 https://tfellow.github.io/web/ 에 바로 배포돼요.
ChatGPT·Codex, Antigravity·Gemini, Claude 등 이 저장소에서 작업하는 모든 AI 도구는 아래 규칙을 지켜 주세요.
작업 전에 담당표 `TEAM.md`와 작업 기록 `WORKLOG.md`도 꼭 읽어요.

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
13. **자료 수**: 첫 페이지 카드에 글·단어·문제 수가 나와요. 셀 자료가 있는 앱이면 `myeverse/tools/count-content.mjs`(파일) 또는 `myeverse/supabase_content_counts.sql`(DB)에 세는 코드를, `myeverse/stats.js`의 `LABELS`에 표시 이름을 넣어요. `myeverse/stats.json`은 매일 자동으로 갱신되니 손으로 고치지 않아요. 카드 설명에는 바뀔 수 있는 자료 수를 쓰지 않아요.
14. **데이터베이스**: SQL 파일은 앱 폴더에 두고 RLS를 켜요. 학생은 자기 기록만, 관리자는 전체를 읽을 수 있게 해요. SQL은 선생님이 Supabase에서 직접 실행하니, 실행이 필요하면 분명하게 알려 줘요.

## 저장소 작업

- 시작하기 전에 `git pull --ff-only`로 최신 상태를 받아요.
- 커밋할 때는 바꾼 파일만 이름을 정확히 적어서 올려요 (`git add .` 금지). 학생 명단 같은 개인정보 파일이 실수로 올라간 적이 있어요.
- **`★Claude★\deploy.ps1`은 실행하거나 베껴 쓰지 않아요.** 오래된 `★Claude★\app`으로 저장소 `app/`을 덮어써 최신 변경이 되돌아가고, `git add -A`로 다른 작업자의 파일까지 올라가요. 저장소 파일을 직접 고쳐요.
- 다른 작업자가 커밋하지 않고 남겨 둔 파일은 건드리지 않아요.
- 비밀 키(서비스 키, 비밀번호 등)는 절대 커밋하지 않아요. Supabase의 publishable 키만 코드에 둘 수 있어요.
- 기존 앱의 데이터 이름(표 이름, Firebase 경로, localStorage 키)은 화면 이름이 바뀌어도 그대로 둬요. 바꾸면 학생 기록이 사라져요.

## 여러 AI가 함께 작업할 때 (충돌 방지)

Claude, ChatGPT·Codex, Antigravity·Gemini가 같은 사이트를 고쳐요. 서로의 작업을 덮어쓰지 않도록 아래 순서를 꼭 지켜요.

1. **원본은 이 저장소 하나예요.** 앱이 한 번 이 저장소(`tfellow/web`)에 올라간 뒤에는 저장소 파일만 원본이에요.
   - `★Antigravity★`, `★ChatGPT★` 같은 각자 작업 폴더에 남은 옛 사본으로 저장소 파일을 **통째로 덮어쓰지 않아요.** 저장소에 올라간 뒤에 Claude가 붙인 로그인·DB·등록 코드가 사라져요.
   - 앱을 고칠 때는 저장소 파일을 직접 고쳐요. 각자 폴더에서 고쳤다면, 저장소 파일과 비교해서 **바뀐 부분만** 옮겨요.
2. **담당표 `TEAM.md`를 먼저 봐요.**
   - 게임·문제·화면 같은 앱 내용은 그 앱을 만든 AI가 우선 담당해요.
   - 로그인·관리자 확인·DB(SQL)·공용 파일(`assets/`, `teacher/`, `me/`, `privacy.html`)은 Claude 담당이에요. 담당이 아니면 직접 바꾸지 말고 `WORKLOG.md`의 "요청"에 적어요.
3. **시작 전 확인**: `git pull --ff-only` 다음에 `git status`를 봐요.
   - 내가 고칠 폴더에 **다른 AI가 커밋하지 않은 변경**이 있으면 멈추고 선생님께 알려요. 덮어쓰거나 되돌리지 않아요.
   - `WORKLOG.md`의 "지금 작업 중"에 같은 폴더가 있으면 끝날 때까지 기다리거나 선생님께 물어요.
4. **작업 중 표시**: 시작할 때 `WORKLOG.md`의 "지금 작업 중"에 한 줄 적고, 끝나면 지워요.
5. **끝나면 기록**: `WORKLOG.md`의 "기록" 맨 위에 한 줄을 남겨요 (날짜 · AI · 폴더 · 한 일 · 커밋). 다음 AI가 이걸 보고 이어서 작업해요.
6. **커밋 메시지**: 맨 앞에 누가 했는지 적어요. 예: `[Codex] wordrush: ...`, `[Antigravity] class123: ...`, `[Claude] teacher: ...`
7. **새 버전을 넘겨줄 때**: 이미 올라간 앱의 새 버전을 만들었다면, 저장소에 있는 로그인 코드(`config.js`, 로그인 부분, `*.sql`)는 그대로 두고 앱 내용만 바꿔요. 어디가 로그인 코드인지 모르겠으면 바꾸기 전에 물어봐요.
8. **올리기 전 확인**: 로그인이 되는지, 기록이 Teacher Hub에 나오는지 봐요. 공용 파일(`assets/` 등)을 바꿨다면 다른 앱 두세 개도 열어서 깨지지 않았는지 확인해요.
