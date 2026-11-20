# Claude 인계: 기존 앱과 공통 로그인 연결

## 이번 게시 범위

2026-11-21 소유자가 Codex에 새 앱 게시를 요청했고, 기존 앱과 로그인·DB 연결은 Claude에게 맡기기로 했습니다. 이 문서는 연동을 이미 수행했다는 뜻이 아닙니다.

- 저장소: `tfellow/web`, 브랜치: `master`
- 대상 폴더: `my-english-arcade/`
- 게임 주소: https://tfellow.github.io/web/my-english-arcade/
- **별개의 기존 `wordarcade/` 앱을 덮어쓰거나 통합하지 않았습니다.**
- 기존 홈페이지, 공통 자산, 다른 앱, 원격 DB, Google OAuth 설정을 변경하지 않았습니다.
- 현재 학생 데이터는 브라우저 localStorage에만 저장합니다. 공개 소스에 학생 결과나 테스트 이력은 포함하지 않습니다.

## 소유자가 요구한 권한

- 관리자: `tfellow@gmail.com`, `tfellow@smy.ms.kr` 모두 허용.
- 학생: 기본적으로 확인된 학교 Google 계정 `@smy.ms.kr`만 허용.
- 외부 Google 학생 계정 허용은 관리자 옵션. 서버에서도 접근 제한을 강제.
- 공통 로그인을 연결할 때 다른 앱의 로그인/로그아웃 동작과 세션 저장 구조를 먼저 확인.
- DB 프로젝트·테이블명과 기존 앱 영향 범위를 소유자와 최종 확인한 후 적용.

## 코드 연결 지점

| 파일 / 함수 | 현재 역할 |
|---|---|
| `config.js` | 공개 Supabase URL/key는 빈 문자열. 관리자·학교 도메인 안내값 |
| `app.js`: `initCloud`, `login`, `establish` | Supabase SDK 생성, Google OAuth, 서버 권한 확인, 인증 상태 반영 |
| `app.js`: `myKey`, `finish`, `syncPending` | 인증 UUID별 로컬 기록 구분, 세션 완료 저장, 서버 재전송 |
| `app.js`: `teacher`, `fetchCloud` | 관리자 UI와 서버 결과 조회 |
| `core.js`: `validateSession`, `summarize`, `weakItems` | 결과 형식 검증, 최초 응답 기준 채점/오답 집계 |
| `backend/supabase.sql` | 미실행 초안. `myea_sessions`, `myea_settings`, `myea_is_admin`, `myea_can_access` |
| `data/schema.json`, `data/result-schema.json` | 문항 / 제출 결과 JSON 구조 |

로컬 데이터 접두사는 `myEnglishArcade.v1`, Supabase 인증 저장 키는 `myea.auth.v1`입니다. 후자는 다른 앱과의 충돌을 막으려고 분리한 것이며, **공통 로그인 세션을 이미 공유하는 구성은 아닙니다.** 기존 앱이 사용하는 프로젝트·저장 키·인증 모듈을 확인한 뒤 필요한 어댑터를 적용하세요. 임의로 여러 키에 토큰을 복사하거나 다른 앱의 세션을 지우지 마세요.

`config.js`의 학교 도메인·관리자 배열만 수정한다고 서버 권한이 바뀌지는 않습니다. 현재 SQL 초안의 서버 함수에도 동일한 기준이 정의되어 있으므로 최종 인증 구조에서 권한의 기준을 일관되게 유지해야 합니다. 비밀키, service_role key, Google client secret은 공개 소스에 넣지 마세요.

## 데이터 / 권한 주의점

- SQL 초안은 아직 어떤 프로젝트에서도 실행하지 않았고 실제 RLS 테스트도 미완료입니다. 기존 공통 DB 구조가 있다면 검토 없이 이 SQL을 그대로 실행하지 마세요.
- 학생은 본인 결과 INSERT/SELECT만, 관리자는 전체 SELECT와 외부 계정 옵션 UPDATE를 허용하는 초안입니다.
- 비로그인 기록은 본인 인증 전 결과이므로 로그인한 사람에게 자동 귀속시키지 않습니다.
- 제출 기록 ID를 이용해 네트워크 재전송 시 중복을 방지합니다.
- 학번·별명은 학생 입력, 권한의 주체는 인증 UUID입니다.
- 현재 점수는 자기주도 복습용 클라이언트 채점입니다. 시험 부정 방지용 서버 채점은 별도 범위입니다.
- 기기 저장 모드의 교사실은 보안 로그인이 없는 로컬 도구입니다. 학교 전체 학생 데이터는 연동 완료 전 수집하지 않습니다.

## 연동 후 확인 및 다음 수정

두 관리자, 학교 학생 2명, 외부 계정 옵션 OFF/ON으로 로그인과 권한을 확인하세요. 타 학생 기록 조회/변경 차단, 계정 전환, 로그아웃 후 다른 앱 동작, 재전송 중복, 태블릿 화면도 확인하세요.

작업 완료 시 이 문서에 실제 사용한 공통 인증 파일·Supabase 프로젝트 식별자(비밀 제외)·테이블·RLS·저장 키·수정 파일·검증 결과·커밋을 기록해 주세요. 이후 Codex가 GitHub 최신 코드를 먼저 가져와 게임을 개선할 예정입니다. 이전 로컬 사본으로 원격 폴더 전체를 덮어쓰면 연동 변경이 사라질 수 있으므로 금지합니다.

현재 스펠링 챌린지는 문제 시작/다음 문제/힌트 후 입력칸에 자동 포커스를 줍니다. 게임 12종과 674개 교재 어휘를 유지해 주세요.

## Claude 연동 기록 (2026-11-21, 로컬 수정 · 아직 미게시 · SQL 미실행)

- 공통 인증 방식: 다른 MY 앱(독서 여권 · Brain Up · Word Arcade · Level · Speaking · Teacher Hub)과 동일.
  Google Identity Services 버튼 → `supabase.auth.signInWithIdToken`, supabase-js `2.49.4` UMD.
- Supabase 프로젝트: `tfellow-web` (`https://jkxdhyvnrvsiokbbbjtu.supabase.co`), publishable key (공개용)만 사용.
- 로그인 저장 키: **Supabase 기본 키 `sb-jkxdhyvnrvsiokbbbjtu-auth-token`** 으로 변경(`myea.auth.v1` 제거).
  tfellow.github.io 안의 모든 MY 앱이 한 세션을 공유하므로 한 번 로그인하면 됨.
- 권한 거부 시 `signOut()`을 부르지 않음(전역 로그아웃이 되어 다른 앱까지 끊김). 대신 "다른 계정으로 로그인" 버튼 표시.
  로그아웃 버튼은 `signOut({scope:'local'})` + "다른 MY 앱도 함께 로그아웃" 확인창.
- 관리자: 서버 공통 `public.is_admin()`(admins 표) 사용. 화면 표시용 목록은 config.js `adminEmails`(4개 계정).
  `myea_is_admin()`/`myea_can_access()`도 하드코딩 목록 대신 `public.is_admin()`을 부르도록 SQL 수정.
- SQL 미실행 상태(myea_ 함수 없음)이면: 학교 계정/관리자는 로그인되고 기록은 기기에 `pending`으로 보관 → SQL 실행 후 자동 전송.
- 충돌 점검(2026-11-21, 공개 키로 조회): `myea_settings`, `myea_sessions`, `myea_is_admin`, `myea_can_access` 모두 없음.
  폴더 `my-english-arcade/`는 `wordarcade/`(MY Word Arcade, 표 접두사 `wa_`)와 별개. 로컬 데이터 키 `myEnglishArcade.v1`는 다른 앱과 겹치지 않음.
- 수정 파일: `config.js`, `index.html`(GIS·supabase 스크립트, `#signin` 대화상자), `app.js`(login/establish/initCloud/계정 버튼/교사실 문구), `backend/supabase.sql`.
- 검증: 가짜 Supabase로 6가지 경우(학교 학생, 외부 계정 OFF/ON, 관리자, SQL 미실행 외부/학교) 확인. 실제 Google 로그인은 게시 후 확인 필요.
- 2026-11-21 추가: 소유자 확인 → `engwords@gmail.com`을 **이 앱 전용 관리자**로 추가(공통 admins 표는 변경 안 함).
  서버: `myea_is_admin()`/`myea_can_access()`에 이메일 조건 추가. 클라이언트: `myea_is_admin` 우선, SQL 실행 전엔 `is_admin` + config `appOnlyAdmins`.
  가짜 Supabase로 8가지 경우 재검증(engwords@gmail.com SQL 전/후 교사실 진입 확인, 전역 로그아웃 0회).
- 2026-11-21 게시: 커밋 `e105dee` (로그인 연동) GitHub Pages 반영 확인.
- 2026-11-21 SQL 실행: 소유자가 Supabase(tfellow-web) SQL 편집기에서 `backend/supabase.sql` 실행 → Success.
  외부 확인(공개 키, 비로그인): `myea_can_access`/`myea_is_admin` 함수, `myea_sessions`/`myea_settings` 표 모두 존재하며 anon 접근은 42501로 차단됨.
  남은 확인: 실제 Google 로그인(학교 학생 · 관리자 · 외부 계정 OFF/ON), 기록 서버 전송, 교사실 조회.
