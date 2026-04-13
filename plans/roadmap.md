# RedPulse Future Features Roadmap

이 문서는 RedPulse 시뮬레이터의 장기적인 발전 방향과 신규 기능 구현 우선순위를 정의합니다.

## Phase 1: 실시간 데이터 수집 자동화 (Telemetry Agent)
**목표**: 사용자 편의성 극대화 및 데이터 수집 파이프라인 자동화.
- 실제 서버에 적용 가능한 경량 Daemon/Agent 개발
- 주기적인 `smartctl` 및 `fio/iostat` 로그 캡처
- 백엔드 FastAPI 서버 데이터 수신용 스트리밍 API 구축

## Phase 2: 다중 스토리지 클러스터 모니터링 (Cluster Dashboard)
**목표**: 엔터프라이즈 환경에서의 확장성 확보.
- 단일 디스크 1:1 진단에서, 수백 대의 노드 및 드라이브 상태를 한눈에 볼 수 있는 메인 대시보드
- 비정상 마모율을 보이는 디스크를 자동 그룹화 및 알림(Alerting)

## Phase 3: AI 모델 고도화 (Deep Learning / Time-Series AI)
**목표**: 외삽(Extrapolation)의 예측 오차 최소화 및 장기 신뢰도 향상.
- Scikit-learn Random Forest 모델을 시계열에 특화된 LSTM, 1D-CNN 또는 향량 기반 Transformer 아키텍처로 대체
- 초기 쓰기 증폭(WAF) 스파이크(Spike)가 있을 때 모델이 이를 과대 해석하지 않도록 노이즈 대응 메커니즘 추가

## Phase 4: 엔터프라이즈 리포팅 및 TCO 분석 (Cost & ROI)
**목표**: 기업의 IT 예산 산정에 직접적인 도움 제공.
- SSD 교체 시기와 도입 가격을 계산하여 유지보수 총소유비용(TCO) 예측
- 임원진 보고를 위한 PDF / CSV 형태의 깔끔한 분석 보고서 자동 렌더링

---
*각 Phase별 상세 구현 스펙은 개별 마크다운 문서 참조.*
