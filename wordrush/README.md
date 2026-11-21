# MY Word Rush · 교과서 단어·문장 챌린지 (`wordrush/`)

서울문영여자중학교(MOONYOUNG) 영어 교과서 어휘·영영풀이·예문(중1 318개 + 중2 356개 = 총 674개)으로 즐기는 **8종 단어·문장 학습 게임 웹앱**입니다.

- **배포 경로**: `https://tfellow.github.io/web/wordrush/`
- **Supabase 접두어**: `wr_` (기존 `tfellow-web` 프로젝트 공유)
- **대상 기기**: Galaxy Tab S7 FE (Android Chrome), 스마트폰, 교사 PC 반응형
- **보안 정책**: 공개 체험(demo) 모드 없음 · `@smy.ms.kr` 학교 계정 및 `public.is_admin()` 교사 전용 (외부 계정 허용은 교사가 `wr_settings`에서 켤 때만 가능, 기본 OFF)

---

## 1. 탑재 게임 8종

### 기본 단어·문장 학습형 (4종)
1. **문맥 빈칸 & 스펠링 챌린지 (`cloze-spelling`)**: 예문 속 목표 단어 빈칸 추리·타이핑, 첫 글자/영영풀이 힌트, 오답 자동 재출제
2. **문장 어순 블록 조립기 (`unscramble`)**: 예문 단어 칩을 순서대로 탭하여 문장 완성, 다음 단어 힌트
3. **스피드 짝짓기 타임어택 (`speed-match`)**: `영단어↔한글뜻` / `영단어↔영영풀이` / `숙어·표현 집중` 3가지 모드
4. **영영풀이 퀴즈쇼 (`engdef-quiz`)**: 동일 품사 위주 4지선다 자동 생성, 키보드 `1~4` 단축키 및 터치 지원

### 퍼즐 & RPG 챌린지형 (4종)
5. **스펠스파이어 RPG 배틀 (`spellspire`)**: 10개 알파벳 타일로 교과서 단어를 조합해 슬라임→고블린→드래곤 보스를 처치 (단어 길이·콤보 비례 데미지)
6. **크립토그램 암호 해독 (`cryptogram`)**: 알파벳 치환 암호로 변환된 교과서 예문을 해석과 문맥으로 해독
7. **커넥션즈 (`connections`)**: 4×4(16개 단어)에서 같은 단원 또는 같은 품사 4개씩 4그룹 묶기 (기회 4번, 1개 차이 힌트)
8. **교과서 워들 & 스펠링 비 (`word-puzzle`)**: 6번 안에 단어를 추리하는 교과서 워들 + 7개 벌집 알파벳으로 단어를 찾는 스펠링 비

### 공통 학습 편의 기능
- **고품질 영/한 분리 TTS**: 영어는 Natural/Google 원어민 음성(미설치 OS에서는 온라인 원어민 오디오 자동 사용), 한국어는 한국어 음성으로 분리 재생 (`🔊 음성` 메뉴에서 속도·성우 선택 가능)
- **오답노트 집중 복습**: 틀린 단어가 자동 누적되어 `🔥 내 오답만 집중` 모드로 바로 재학습 가능
- **공용 앱 서랍 연동**: `../assets/my-apps.js?v=1` 포함

---

## 2. Supabase 표 & 함수 구조 (`supabase_wr.sql`)

무료 요금제(500MB) 용량 절약을 위해 **문항별 개별 로그를 쌓지 않고 집계 테이블만 사용**합니다. 모든 표에 RLS가 켜져 있으며 `anon` 접근은 차단됩니다.

### 1) `public.wr_daily` (학생 × KST 날짜 × 게임별 합계 — MY Teacher Hub 연동용)
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `email` | `text` (PK) | 학생/교사 소문자 이메일 |
| `day` | `date` (PK) | 한국시간(`Asia/Seoul`) 기준 날짜 |
| `game_id` | `text` (PK) | 게임 ID (`cloze-spelling`, `unscramble`, `speed-match`, `engdef-quiz`, `spellspire`, `cryptogram`, `connections`, `word-puzzle`) |
| `plays` | `int` | 해당 날짜·게임 완료 횟수 |
| `correct` | `int` | 누적 정답 문항 수 |
| `total` | `int` | 누적 풀이 문항 수 |
| `best_score` | `int` | 해당 날짜 최고 점수 |
| `total_sec` | `int` | 누적 학습 소요 시간(초) |
| `updated_at` | `timestamptz` | 최종 갱신 시각 |

> **MY Teacher Hub 연동 참고**: `email`, `day`, `plays`, `correct`, `total`, `best_score`, `total_sec` 컬럼을 `group by email, day` 로 합산하면 학생별 일일 학습량을 바로 표시할 수 있습니다.

### 2) `public.wr_word_stats` (학생 × 단어별 누적 오답률)
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `email` | `text` (PK) | 학생 소문자 이메일 |
| `word_id` | `text` (PK) | 단어 ID (예: `G1-L1-1`) |
| `grade` | `int` | 학년 (1~3) |
| `lesson` | `int` | 단원 번호 |
| `word` | `text` | 영단어 |
| `attempts` | `int` | 총 시도 횟수 |
| `correct` | `int` | 정답 횟수 |
| `wrong` | `int` | 오답 횟수 |
| `last_wrong_at` | `timestamptz` | 최근 오답 시각 |
| `updated_at` | `timestamptz` | 최종 갱신 시각 |

### 3) `public.wr_leaderboard` (랭킹용 집계 표)
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `email` | `text` (PK) | 내부 식별자 (RPC 응답에는 절대 노출되지 않음) |
| `game_id` | `text` (PK) | 게임 ID |
| `display_name` | `text` | 표시용 이름/학번 (예: `1-3 김문영`) |
| `grade` | `int` | 학년 |
| `best_score` | `int` | 해당 게임 최고 점수 |
| `total_plays` | `int` | 누적 플레이 횟수 |
| `updated_at` | `timestamptz` | 최종 갱신 시각 |

### 4) `public.wr_settings` (앱 전역 설정 1줄)
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `int` (PK, `=1`) | 싱글톤 설정 ID |
| `allow_external` | `boolean` | 외부 구글 계정 허용 여부 (기본 `false`) |
| `updated_by` | `text` | 마지막 변경 교사 이메일 |
| `updated_at` | `timestamptz` | 최종 변경 시각 |

### 5) `public.wr_custom_sets` (교사 커스텀 단어장 — 1단어장 = 1줄 JSONB)
| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `id` | `text` (PK) | 단어장 ID |
| `title` | `text` | 단어장 제목 (예: `중3 1단원`) |
| `grade` | `int` | 학년 |
| `lesson` | `int` | 단원 |
| `items` | `jsonb` | 어휘 객체 배열 |
| `created_by` | `text` | 등록 교사 이메일 |
| `updated_at` | `timestamptz` | 최종 수정 시각 |

### 6) 주요 RPC 함수
- `public.wr_ping()` — 설치 확인용 (`true` 반환)
- `public.wr_can_use()` — 관리자 / `@smy.ms.kr` / `allow_external=true` 여부 확인
- `public.wr_record_session(...)` — 게임 종료 시 `wr_daily`, `wr_word_stats`, `wr_leaderboard` 를 한 번에 원자적 저장
- `public.wr_get_leaderboard(p_game_id, p_limit)` — 이메일을 제외하고 `display_name`, `grade`, `best_score`, `total_plays`만 안전하게 반환
- `public.wr_teacher_weak_words(p_grade, p_lesson, p_limit)` — `is_admin()` 교사 전용 전체 학생 취약 단어 TOP 집계

---

## 3. 교사가 해야 할 일 (배포 순서)

1. **Supabase SQL 실행 (최초 1회, 여러 번 실행해도 안전)**:
   - Supabase 대시보드(`tfellow-web`) → **SQL Editor**에서 `wordrush/supabase_wr.sql` 전체를 붙여넣고 실행(Run)합니다.
2. **GitHub Pages 배포**:
   - `tfellow/web` 저장소의 루트에 `wordrush/` 폴더를 그대로 복사하고 커밋/푸시합니다. (다른 폴더는 수정하지 않음)
   - 배포 후 `https://tfellow.github.io/web/wordrush/` 로 접속합니다.
3. **교사 화면 확인**:
   - 교사 계정으로 로그인하면 상단에 **`👩‍🏫 교사`** 탭이 자동 표시됩니다.
   - 상단 상태 배지가 **`✅ Supabase wr_ 정상`** 으로 뜨면 설치 완료입니다!
   - 이 탭에서 **외부 계정 허용 ON/OFF**, **학생별 학습 현황 CSV 다운로드**, **단원별 취약 어휘 TOP**, **중3·커스텀 단어장 CSV/JSON 업로드**를 모두 관리할 수 있습니다.

---

## 4. 새 엑셀 어휘 파일 추가 방법 (선택)
프로젝트 루트에 새 엑셀(`.xlsx`)을 두고 아래 스크립트를 실행하면 `wordrush/data/vocab.json`과 `wordrush/data/vocab-data.js`가 자동 갱신됩니다.
```bash
python wordrush/scripts/convert_excel.py
```
(또는 웹앱 내 `👩‍🏫 교사` 탭의 **커스텀 단어장 DB 관리**에서 CSV/JSON을 바로 업로드할 수도 있습니다.)
