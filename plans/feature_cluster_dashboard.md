# Feature: Multi-drive & Cluster Dashboard

## 1. 개요 (Overview)
엔터프라이즈 환경에서 관리하는 수십/수백 대의 노드 속 스토리지 풀 전체의 남은 수명을 모니터링하기 위해 프론트엔드 대시보드를 확장합니다.

## 2. 주요 기능 스펙
- **클러스터 뷰 (Overview View)**
  - 각 스토리지 노드를 벌집 형태(Honeycomb) 또는 랙 단위 그리드로 표시.
  - RUL(Remaining Useful Life) 위험도에 따라 직관적인 색상 (Green, Yellow, Red) 표기.
- **그룹 단위 필터링 및 검색**
  - "잔여 수명 10% 미만인 디스크만 보기", "WAF가 비정상적으로 높은 노드 검색" 기능 구현.
- **드릴다운 분석 (Drill-down)**
  - 특정 Red 컬러 경고 상태의 디스크를 클릭하면, 기존 RedPulse의 단일 디스크 수명 궤적 그래프 및 AI 예측 원인을 상세 팝업 패널이나 새 페이지 뷰로 띄워줌.

## 3. 프론트엔드 (React) 설계 사항
- **UI 라이브러리 및 컴포넌트**
  - 기존 Glassmorphism 컨셉 유지 (Dark Mode).
  - 그리드 및 그룹핑에 적합한 가상화(Virtualization) 리스트 렌더링 도입 (`react-window` 등).
  - 전체 상태 관리는 Redux Toolkit(RTK Query 권장)을 사용하여 다수의 디스크 상태를 주기적으로 Polling 적용 (또는 WebSocket을 통한 이벤트 기반 스트리밍).

## 4. 백엔드 설계 사항
- 다중 디바이스 조회를 위한 상태 요약 API 개설.
- 주기적인 에이전트 데이터 수신 시, 각 디바이스별 마지막 측정 상태(State Snapshot)에 대한 캐싱(Redis 계층 도입 고려)으로 DB 쿼리 부하 최소화.
