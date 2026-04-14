# RedPulse Future Features Roadmap

이 문서는 RedPulse 시뮬레이터의 장기적인 발전 방향과 신규 기능 구현 우선순위를 정의합니다.

## Phase 1: 실시간 데이터 수집 및 시뮬레이션 기반 강화 (Telemetry & Simulation)
**목표**: 사용자 편의성 극대화, 신뢰도 확보 및 데이터 수집 파이프라인 자동화.
- [PreFlight] **상용 디바이스 스펙 연동**: 삼성, 마이크론 등 실제 벤더의 SSD 제원(TBW, 스펙 시트)을 입력/불러오기하여 가상 시뮬레이션의 신뢰성을 대폭 향상.
- [LiveOps] **Linux Native 지원 (CLI/Daemon)**: 웹 UI뿐만 아니라 리눅스 터미널(Headless Server)에서도 실측 및 예측 기능을 즉시 구동할 수 있는 환경 제공.
- 실제 서버에 적용 가능한 경량 Daemon/Agent 개발
- 주기적인 `smartctl` 및 `fio/iostat` 로그 캡처
- 백엔드 FastAPI 서버 데이터 수신용 스트리밍 API 구축

### 📝 Task Checklist
- [x] FastAPI 백엔드 데이터 수신 엔드포인트 구축
- [x] Python 기반 Mock 에이전트 스크립트 작성
- [ ] 상용 드라이브 스펙 DB(JSON/CSV) 구축 및 가상 모드 입력 기능 개발
- [ ] 리눅스 터미널 환경을 위한 RedPulse 텍스트 기반 인터페이스(TUI/CLI) 래퍼 개발

## Phase 2: 다중 스토리지 클러스터 모니터링 (Cluster Dashboard)
**목표**: 엔터프라이즈 환경에서의 확장성 확보.
- 단일 디스크 1:1 진단에서, 수백 대의 노드 및 드라이브 상태를 한눈에 볼 수 있는 메인 대시보드
- 비정상 마모율을 보이는 디스크를 자동 그룹화 및 알림(Alerting)

### 📝 Task Checklist
- [ ] 백엔드: 다중 디바이스 시계열 데이터를 캐싱하기 위한 구조 개선 (Redis 검토)
- [ ] 프론트엔드: 기존 UI를 클러스터 뷰/그리드 뷰로 확장
- [ ] 프론트엔드: 필터링 및 드릴다운(Drill-down) 패널 개발
- [ ] 프론트엔드: 상태 관리 라이브러리(Redux/Zustand 등) 도입 및 연동

## Phase 3: AI 모델 고도화 (Deep Learning / Time-Series AI)
**목표**: 외삽(Extrapolation)의 예측 오차 최소화 및 장기 신뢰도 향상.
- Scikit-learn Random Forest 모델을 시계열에 특화된 LSTM, 1D-CNN 또는 향량 기반 Transformer 아키텍처로 대체
- 초기 쓰기 증폭(WAF) 스파이크(Spike)가 있을 때 모델이 이를 과대 해석하지 않도록 노이즈 대응 메커니즘 추가

### 📝 Task Checklist
- [ ] 딥러닝 훈련 환경(PyTorch) 세팅 및 시뮬레이션 합성 데이터 포맷팅
- [ ] LSTM / Transformer 기반의 시계열 예측 모델 프로토타입 훈련
- [ ] 기존 Scikit-learn 엔진과 신규 딥러닝 모델 간 앙상블 시스템 구축

## Phase 4: 엔터프라이즈 리포팅 및 TCO 분석 (Cost & ROI)
**목표**: 기업의 IT 예산 산정에 직접적인 도움 제공.
- SSD 교체 시기와 도입 가격을 계산하여 유지보수 총소유비용(TCO) 예측
- 임원진 보고를 위한 PDF / CSV 형태의 깔끔한 분석 보고서 자동 렌더링

### 📝 Task Checklist
- [ ] 재무(Finance) API 로직 추가 (디스크 단가 입력 및 TCO 산출 로직)
- [ ] 리포트 생성을 위한 프론트엔드 차트의 이미지 컴포넌트화(PDF 변환 라이브러리 적용)
- [ ] 월간 정리 보고서 배포 자동화(Cron/Celery 등) 스크립트 구현

---
*각 Phase별 상세 구현 스펙은 개별 마크다운 문서 참조.*
