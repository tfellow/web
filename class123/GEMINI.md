# Class123 Plus - 프로젝트 규칙 및 설정 가이드 (GEMINI.md)

## 1. 기본 언어 설정 (Language)
- 사용자와의 모든 대화, 안내, 설명, 결과 보고는 **항상 자연스러운 한국어(Korean)**로 진행합니다.
- 데이터 분석(성적표 등) 및 코드 작성 시에도 주석과 설명을 한국어로 작성합니다.

## 2. 관리자 인증 체계 (Admin Authentication)
- 본 애플리케이션은 인가된 교사만 로그인하여 사용할 수 있는 관리자 전용 웹앱입니다.
- **등록된 관리자 이메일 계정**:
  1. `tfellow@gmail.com` (Google 계정 / 개인)
  2. `tfellow@smy.ms.kr` (서울문영여자중학교 교직원 계정)
- 로그인하지 않은 사용자는 모든 학생 명렬, 보상, 진도표 데이터를 열람할 수 없도록 로그인 게이트(`auth-gate-overlay`)로 차단됩니다.
- 초기 관리자 마스터 비밀번호: `class123` (앱 내 ⚙️설정에서 변경 가능)

## 3. 버전 관리 및 설명서 동기화 규칙
- 웹앱(`index.html`, `styles.css`, `app.js`)을 사용자의 지시로 수정할 때마다 반드시 **버전 번호(예: `v1.5.0` → `v1.6.0`)를 업데이트**합니다.
- 파일이 수정되면 동적 사용 설명서(`manual.html`)와 버전 기록 문서(`CHANGELOG.md`)에도 **사용자의 프롬프트/지시사항, 변경된 기능 설명, 버전 히스토리**를 즉시 함께 반영합니다.

## 4. GitHub 및 웹 배포 안정성 유지 (공식 배포 주소 및 배포 규칙)
- **공식 서비스 웹 배포 URL**: `https://tfellow.github.io/web/class123`
- **배포 GitHub 저장소 로컬 경로**: `C:\Users\Rainbow\.copilot\repos\web` (원격: `https://github.com/tfellow/web.git`, 브랜치: `master`)
- **웹 자동 배포(게시) 프로세스**:
  - 웹앱 파일(`index.html`, `app.js`, `styles.css`, `manual.html`, `CHANGELOG.md`, `README.md`, `GEMINI.md`)을 수정할 때마다 배포 저장소의 `class123/` 하위 폴더로 즉시 복사하고,
  - `git commit` 및 `git push origin master`를 실행하여 `https://tfellow.github.io/web/class123` 웹 사이트에 항상 즉각 배포(게시)를 완료합니다.
- 외부 서버 백엔드 의존성 없이 GitHub Pages 또는 모든 정적 웹 호스팅 환경에서 100% 자율 동작하도록 클라이언트 사이드 아키텍처를 유지합니다.
- 로컬 스토리지(`LocalStorage`) 기반 자동 저장 및 JSON 백업/복원 기능을 영속적으로 보장합니다.
