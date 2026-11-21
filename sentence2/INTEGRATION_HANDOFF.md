# Sentence Master Studio — 기존 사이트 로그인·통계 연동 인수인계 명세서

이 문서는 `sentence-master-studio/` 웹앱을 **기존 학습 사이트의 로그인 시스템 및 교사용 통계 대시보드**에 연동하기 위한 공식 인터페이스 명세입니다.  
모든 게임 모듈(6종)은 개별 수정할 필요 없이 **`js/utils/storage.js`의 단일 연동 레이어(`window.SMS.integration`)**를 통해 이벤트를 발행하고 초기 데이터를 주입받도록 설계되어 있습니다.

---

## 1. 앱 구성 요약
- **경로**: `sentence-master-studio/` (빌드 도구 없는 순수 HTML/CSS/Vanilla JS, 전역 네임스페이스 `window.SMS`)
- **진입점**: `index.html`
- **단원/영역 구조**:
  - `lessonId`: 예) `'g1-l1'`, `'g2-l1'`, 또는 교사 추가 `'custom-...'`
  - `category`: `'all' | 'grammar' | 'reading' | 'incontext'`
  - `mode`: `'dashboard' | 'scramble' | 'blind' | 'drill' | 'dictation' | 'error' | 'chat'`
- **로컬 저장소 키 (기본 폴백)**:
  - `sms_stats_v1`: `{ xp, streak, bestStreak, masteredIds, sfxEnabled }`
  - `sms_wrong_v1`: 오답 노트 배열 (최대 60건)
  - `sms_custom_lessons_v1`: 교사 스튜디오 커스텀 단원 배열

---

## 2. 연동 방식 (2가지 중 선택)

### 방식 A. 동일 페이지/앱 내 직접 연동 (어댑터 등록 — 추천)
`index.html`의 스크립트 로드 직후(또는 기존 사이트의 로그인 완료 콜백에서) `window.SMS.integration.setAdapter(...)`를 호출합니다.

```html
<!-- index.html 하단 app.js 로드 이후에 연동 스크립트 1개만 추가 -->
<script src="/existing-site/auth-and-stats-bridge.js"></script>
```

```javascript
// auth-and-stats-bridge.js 예시
window.SMS.integration.setAdapter({
  // 1) 현재 로그인된 학생 정보 반환 (모든 이벤트에 자동 첨부됨)
  getCurrentUser() {
    return {
      uid: currentUser.uid,          // 또는 학번
      name: currentUser.displayName,
      grade: currentUser.grade,      // 예: '1' | '2'
      classRoom: currentUser.classRoom
    };
  },

  // 2) 로그인 직후 DB에서 기존 학습 기록 불러오기 (Promise 지원)
  async loadInitialState() {
    const doc = await fetchStudentSentenceMasterData(currentUser.uid);
    return {
      stats: doc?.stats,                 // { xp, streak, bestStreak, masteredIds, sfxEnabled }
      wrongNotes: doc?.wrongNotes,       // [...]
      customLessons: doc?.customLessons  // (선택) 교사가 배포한 커스텀 단원
    };
  },

  // 3) 문항 1개 정답/오답 발생 시 호출 → 통계 로그 적재용
  async onActivity(detail) {
    // detail 구조는 아래 3절 참조
    await saveActivityLogToDB(detail);
  },

  // 4) XP / 콤보 / 마스터 문장 갱신 시 호출 → 학생 요약 프로필 동기화용
  async onStatsSync(detail) {
    await saveStatsSummaryToDB(detail.user?.uid, detail.stats);
  },

  // 5) 오답 노트 변경 시 호출 → 오답 목록 동기화용
  async onWrongUpdate(detail) {
    await saveWrongNotesToDB(detail.user?.uid, detail.wrongNotes);
  }
});
```

---

### 방식 B. `<iframe>` 임베드 연동 (`postMessage`)
기존 사이트 안에 `<iframe src="/sentence-master-studio/index.html">`로 띄우는 경우, 별도 코드 수정 없이 `postMessage`로 양방향 통신이 가능합니다.

1. **부모 → 자식 (DB 데이터 주입)**:
```javascript
iframe.contentWindow.postMessage({
  type: 'sms:hydrate',
  payload: {
    stats: dbStats,
    wrongNotes: dbWrongNotes,
    customLessons: dbCustomLessons
  }
}, '*');
```

2. **자식 → 부모 (학습 로그/통계 수신)**:
```javascript
window.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'sms:activity') {
    // 문항 단위 정답/오답 로그 저장
  } else if (type === 'sms:stats-updated') {
    // 요약 XP/마스터리 저장
  } else if (type === 'sms:wrong-updated') {
    // 오답 노트 저장
  }
});
```

---

## 3. 이벤트 페이로드 상세 스키마

### 3-1. `sms:activity` (문항별 정·오답 로그 — 통계 대시보드 핵심)
```json
{
  "app": "sentence-master-studio",
  "timestamp": "2026-11-21T12:34:56.789Z",
  "user": { "uid": "student_10101", "name": "김민지" },
  "context": {
    "lessonId": "g1-l1",
    "category": "grammar",
    "mode": "drill"
  },
  "result": "correct",
  "xpDelta": 15,
  "sentenceId": "g1-l1-g5",
  "totalXp": 120,
  "streak": 4
}
```
- 오답 시: `"result": "wrong"`, `"xpDelta": 0`, `"reason": "입력: \"record\" / 정답: \"records\" — ..."` 포함.

### 3-2. `sms:stats-updated` (학생 누적 요약)
```json
{
  "app": "sentence-master-studio",
  "timestamp": "...",
  "user": { ... },
  "context": { ... },
  "stats": {
    "xp": 120,
    "streak": 4,
    "bestStreak": 9,
    "masteredIds": ["g1-l1-g1", "g1-l1-g5"],
    "sfxEnabled": true
  }
}
```

### 3-3. `sms:wrong-updated` (오답 노트 스냅샷)
```json
{
  "app": "sentence-master-studio",
  "wrongNotes": [
    {
      "id": "g1-l1-g6",
      "en": "She doesn't clean her room.",
      "ko": "그녀는 자기 방을 청소하지 않아.",
      "grammarTip": "...",
      "count": 2,
      "updatedAt": 1763720000000
    }
  ]
}
```

---

## 4. 교사용 통계 대시보드 추천 집계 항목
`sms:activity` 로그를 기존 DB에 저장하면 아래 통계를 바로 산출할 수 있습니다.
- **학생별 진도율**: `stats.masteredIds` 중 해당 단원(`g1-l1-*`) 비율
- **게임 모드별 참여도 및 정답률**: `context.mode` (`scramble`, `blind`, `drill`, `dictation`, `error`, `chat`) 기준 `correct / (correct + wrong)`
- **영역별 취약점 분석**: `context.category` (`grammar`, `reading`, `incontext`)별 오답률
- **학급 공통 최다 오답 문장 TOP 5**: `result === 'wrong'`인 `sentenceId` 빈도 집계

---

## 5. 권한 제어 참고 (교사 스튜디오 버튼)
- 상단 `👩‍🏫 교사 스튜디오` 버튼 ID는 `#btn-open-teacher`입니다.
- 기존 사이트 로그인 정보에서 `role !== 'teacher'`(학생 계정)인 경우, 브릿지 스크립트에서 아래 한 줄로 학생 화면에서 교사 스튜디오 버튼을 숨길 수 있습니다.
```javascript
if (currentUser.role !== 'teacher') {
  document.getElementById('btn-open-teacher')?.classList.add('hidden');
}
```

---

## Claude 연동 기록 (2026-11-21 · 로컬 · 아직 미게시 · SQL 미실행)

- **게시 위치**: `web-repo/sentence2/` → https://tfellow.github.io/web/sentence2/ (기존 `/web/sentence/` = MY Sentence Gym 은 별개 앱, 그대로 둠)
- **게임 파일 무수정**: `js/` 아래 파일과 `styles.css` 는 Antigravity 원본 그대로. `index.html` 에는 제목·아이콘과 스크립트 태그만 추가.
- **추가 파일**
  - `bridge.js` — 방식 A(`SMS.integration.setAdapter`) 어댑터. 로그인 · 권한 · DB 저장 · 교사 통계 화면 전부 여기.
  - `bridge.css` — 브리지 화면 전용 (클래스 `s2-` 접두사).
  - `supabase_sentence2.sql` — 표·함수·RLS. 소유자가 Supabase SQL Editor 에서 한 번 실행해야 함.
- **로그인**: 다른 MY 앱과 같은 Google(GIS) → `supabase.auth.signInWithIdToken`, 프로젝트 `tfellow-web`, supabase-js 2.49.4, 기본 저장 키(모든 MY 앱 세션 공유).
  권한이 없으면 전역 `signOut` 하지 않고 안내 + "이 계정 로그아웃"(scope local). 헤더의 이름 버튼 = 로그아웃(확인창, 이 기기의 SMS 로컬 기록 삭제).
- **권한**: `sms_can()` = `public.is_admin()` 또는 `@smy.ms.kr` 또는 `sms_settings.allow_external = true`(기본 false, 교사 통계 → 설정에서 토글).
  학생이면 `#btn-open-teacher` 를 DOM 에서 제거, 관리자만 교사 스튜디오 + 📊 학습 통계 버튼.
- **공유 기기 보호**: `sms2_owner`(로컬) 가 로그인 uid 와 다르면 `sms_stats_v1 / sms_wrong_v1 / sms_custom_lessons_v1` 을 지우고 DB 값으로 hydrate.
- **DB (모두 `sms_` 접두사, 2026-11-21 충돌 없음 확인)**
  - `sms_profile(user_id, email, stats, wrong_notes)` ← `sms:stats-updated`, `sms:wrong-updated` (1.5초 모아서 `sms_save_profile` RPC)
  - `sms_items(user_id, sentence_id, mode, correct, wrong, …)` ← `sms:activity` (학생×문장×게임 누적 숫자, 문항마다 줄을 늘리지 않음)
  - `sms_daily(user_id, day, lesson_id, category, mode, correct, wrong, xp)` ← `sms:activity` (기간 통계 · Teacher Hub)
  - 위 두 표는 `sms_log(p_events)` RPC 로만 기록(본인 uid·이메일 고정, 1회 300건 제한). 전송 실패 시 `sms2_pending_<uid>` 에 보관 후 재전송.
  - `sms_lessons(id, data)` — 교사 스튜디오 커스텀 단원. 관리자 쓰기, 학생 읽기 → 학생 단원 목록에 나타남.
  - `sms_admin_data(p_since)` — 교사 통계용(관리자 전용, jsonb 로 한 번에).
- **브리지 보완(게임 파일은 그대로)**: `storage.setContext` 를 감싸 현재 모드 추적. `4단계 암기(blind)` 는 오답 시 `recordWrong` 을 부르지 않아서
  그 모드에서 `resetStreak` 가 불리면 오답 1회로 기록(문장 ID 없음 → 오답 TOP 5 에는 안 잡힘). 관리자일 때 `addCustomLesson/deleteCustomLesson` 을 감싸 DB 동기화.
- **교사 통계(앱 안 📊)**: 기간·학급·단원 필터, 참여 학생·푼 문항·정답률·평균 진도, 게임별 참여/정답률, 영역별 오답률, 많이 틀린 문장 TOP 5, 학생별 표(학번·XP·진도·정답률·오답 노트 수), CSV, 외부 계정 허용 설정.
- **Teacher Hub / 학생 페이지**: `teacher/hub.js` 에 `sentence2`(📝 문장 마스터) 칸 추가(sms_daily → 학생×날짜 이벤트), `teacher/index.html` 링크, `me/index.html` 카드. 보상(으쓱) 규칙은 추가하지 않음.
- **검증**: 가짜 Supabase 로 확인 — 로그인 화면, 이전 사용자 기록 삭제, 학생 버튼 숨김, 실제 문법 드릴 오답 기록, 모드별 기록·blind 오답 1회, 다른 기기 로그인 시 XP/오답/진도 복원,
  외부 계정 차단 → 허용 후 입장, 교사 커스텀 단원 DB 저장 → 학생 목록 표시, 통계 필터, SQL 미실행(학생 '준비 중', 관리자 기기 저장 미리보기), 375px 화면, 로그아웃. 실제 Google 로그인은 게시 후 확인 필요.
- **남은 일**: SQL 실행, 게시(push), 실제 로그인 확인, 첫 화면 카드 · `assets/my-apps.js` 서랍 · `privacy.html` 앱/저장 목록 추가.
- 이후 Antigravity 가 게임을 고칠 때: GitHub 최신 `sentence2/` 를 먼저 받아서 `bridge.js`, `bridge.css`, `supabase_sentence2.sql`, `index.html` 의 브리지 스크립트 태그를 지우지 말 것.
