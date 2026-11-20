# MY Word Arcade (교과서 단어 게임)

주소(배포 후): https://tfellow.github.io/web/wordarcade/

## 파일
- `index.html`, `style.css` — 화면
- `core.js` — 로그인, 단어장, 홈, 결과 저장, 오답 노트, 내 기록
- `games.js` — 게임 7개 (match, spell, order, listen, cross, battle, crypto)
- `teacher.js` — 교사 화면 (학생 통계, 취약 어휘, 단어장 올리기, 설정)
- `data/g1.json`, `data/g2.json` — 기본 단어장 (출판사 엑셀에서 변환)
- `supabase_wordarcade.sql` — 표·함수 (모두 `wa_` 로 시작)
- `guide.html` — 설명서

## 데이터베이스 (Supabase tfellow-web, 다른 앱과 같은 로그인)
- `wa_plays` 한 판에 1행 · `wa_wordstat` 학생×단어 · `wa_banks` 올린 단어장 · `wa_settings`
- 함수: `wa_submit`, `wa_me`, `wa_roster`, `wa_word_top`, `wa_allowed`, `wa_set`, `wa_ping`
- 관리자는 기존 `is_admin()` 을 써요. 학생 이름·학번은 기존 `roster` 에서 읽기만 해요.

## 단어장 형식 (JSON)
```json
{ "id": "g1", "name": "1학년 교과서 단어", "grade": 1,
  "words": [ { "g": 1, "l": 1, "n": 1, "w": "active", "ko": "a. 활동적인",
               "def": "a. doing things that require physical movement and energy",
               "ex": "She is very active and friendly.", "exKo": "그녀는 매우 활동적이며 친절하다." } ] }
```
엑셀은 열 이름 `grade · lesson · no. · words · 한글 뜻 · 영영풀이 · 예문 · 예문 해석` 그대로 올리면 돼요.
