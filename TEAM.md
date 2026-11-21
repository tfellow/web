# MYeVerse 담당표 (누가 무엇을 맡나요)

이 저장소에는 세 AI가 함께 작업해요: **Claude**, **ChatGPT·Codex**, **Antigravity·Gemini**.
작업 규칙은 `AGENTS.md`의 "여러 AI가 함께 작업할 때"를 따르고, 작업 기록은 `WORKLOG.md`에 남겨요.

## 1. 공용 영역 — Claude 담당

여러 앱이 같이 쓰는 부분이에요. 하나가 잘못되면 **모든 앱**의 로그인이나 화면이 깨질 수 있어요.
다른 AI는 이 부분을 직접 바꾸지 말고 `WORKLOG.md`의 "요청" 칸에 적어 주세요.
급하게 꼭 바꿔야 했다면, 바꾼 내용을 기록하고 선생님께 "Claude 확인 필요"라고 알려 주세요.

| 무엇 | 어디 |
|---|---|
| 앱마다 있는 로그인·관리자 확인 코드 | 각 앱의 `config.js`, `sb.js`, `auth*.js`, 로그인 부분 |
| 데이터베이스(Supabase) | 각 앱의 `*.sql`, 표 이름, 저장 방식 |
| 공용 파일 | `assets/` 전체 (`my-apps.js` 앱 서랍, `myeverse-brand.js`, 로고) |
| 교사·학생 기록 모음 | `teacher/` (Teacher Hub), `me/` (MY English Journey) |
| 사이트 문서 | `index.html`, `privacy.html`, `AGENTS.md`, `TEAM.md` |

## 2. 앱별 담당

"앱 내용"은 게임·문제·화면 디자인·설명서예요. **만든 AI가 우선 담당**해요.
로그인과 기록 저장은 어느 앱이든 1번 공용 영역이라 Claude가 맡아요.

| 폴더 | 앱 | 처음 만든 AI | 앱 내용 담당 |
|---|---|---|---|
| `myeverse/` | MYeVerse 첫 페이지 | ChatGPT | ChatGPT (새 앱 카드 추가만 Claude) |
| `my-english-arcade/` | MY English Arcade | Codex | Codex (로그인 기록: `AUTH-HANDOFF.md`) |
| `textbook/` | 교과서 수업실 | ChatGPT | ChatGPT |
| `wordrush/` | MY Word Rush | Antigravity | Antigravity |
| `writing1/` | MY Writing Tutor (영작문) | Antigravity | Antigravity |
| `class123/` | MY Class | Antigravity | Antigravity (학생 백업 파일은 절대 커밋 금지) |
| `quiz/`, `quiz-queens/` | Quiz Queens | Antigravity | Antigravity |
| `app/` | MY Reading Passport | 선생님 업로드 | Claude |
| `cloze/`, `danuhsup/` | MY Cloze, MY Word Forest | Claude | Claude |
| `brainup/`, `grammar/`, `level/`, `metro/`, `history/` | Brain Up, 문법, Level Test, Reading Metro, History Museum | Claude | Claude |
| `quizshow/`, `kahoot/`, `reading2/`, `speaking/` | Quiz Show, Kahoot, Knowledge Passport, Speaking | Claude | Claude |
| `sentence/`, `wordarcade/` | Sentence Gym, Word Arcade | Claude | Claude |

처음 만든 AI가 확실하지 않은 앱은 선생님이 알려 주시면 고쳐요.

## 3. 고칠 일이 생기면 누구에게?

- **게임·문제·화면을 고칠 때** → 표의 "앱 내용 담당" AI에게 맡기는 게 가장 안전해요.
  다른 AI에게 맡겨도 돼요. 그 AI가 `WORKLOG.md`에 기록을 남기면 다음 AI가 이어서 알 수 있어요.
- **로그인, 기록 저장, Teacher Hub, 첫 페이지·앱 서랍 등록** → Claude
- **어디가 문제인지 모를 때** → Claude에게 먼저 물어보세요. 원인을 찾은 뒤 어느 AI가 고치면 좋을지 알려 드려요.
- **다른 AI가 만든 새 앱을 사이트에 올릴 때** → 그 AI가 앱을 만들고, Claude가 로그인·DB·등록(첫 페이지, 앱 서랍, Teacher Hub, 학생 페이지, 개인정보처리방침)을 붙여서 올려요.
