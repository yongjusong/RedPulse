# Feature: Real-time Telemetry Agent (Daemon)

## 1. 개요 (Overview)
기존 RedPulse는 사용자가 수동으로 Telemetry 데이터를 입력해야 하는 번거로움이 있었습니다. 본 에이전트는 사용자의 실제 스토리지 서버에 설치되어 주기적으로 디스크 S.M.A.R.T 지표와 IO 트래픽을 수집하여 RedPulse 백엔드로 전송합니다.

## 2. 주요 기능 스펙
- **데이터 수집기 (Collector)**
  - `nvme-cli`, `smartctl` 출력 파싱 (WAF, P/E Cycles, Temperature, Available Spare 등).
  - 리눅스 `iostat` 또는 `dmsetup status` 를 통한 하이브리드 캐시 히트율/IOPS 수집.
- **경량성 (Lightweight)**
  - 언어: Python(단일 바이너리 패키징) 또는 Go 언어로 작성하여 의존성을 최소화.
  - 메모리 사용량 50MB 이하, CPU 점유율 1% 미만 유지.
- **데이터 전송 인프라 (Transmitter)**
  - 안정적 송신을 위해 백엔드의 `/api/v1/telemetry/ingest` 와 같은 엔드포인트에 주기적 (예: 1시간 단위) HTTPS POST 요청 전송.
  - 네트워크 단절 대비 로컬 버퍼링(로컬 SQLite / JSON 로깅) 및 자동 재전송 기능 포함.

## 3. 구현 단계
1. **Agent 프로토타입 작성**: Python 베이스로 `subprocess`를 활용한 OS 지표 파싱 클래스 개발.
2. **FastAPI 백엔드 라우터 확장**: 에이전트로부터 전송된 JSON 형태의 시계열 데이터를 받아 DB에 쌓는 파이프라인 개발.
3. **Agent 로컬 빌드 및 패키징**: `PyInstaller` 또는 Go 컴파일을 통해 타겟 서버에서 의존성 설치 없이 실행되도록 구성.
4. **End-to-End 연동 테스트**: VM에 에이전트를 설치 후 백엔드에 WAF 곡선이 실시간으로 변동되는지 웹 대시보드를 통해 검증.

## 4. 고려 사항 (Gotchas)
- 보안 통신 과정 (HTTPS, API Key Auth, MTLS)
- 권한 문제: `smartctl`이나 `iostat` 실행을 위한 루트 권한(sudo) 혹은 적절한 사용자 그룹 권한 부여.
