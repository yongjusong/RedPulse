# RedPulse 머신러닝 학습 데이터 파이프라인 전략 (ML Strategy)

이 문서는 RedPulse 시뮬레이터가 SSD 수명을 예측하기 위해 어떤 머신러닝 모델 구조를 가지고 있으며, 어떤 데이터를 수집하여 모델을 고도화하는지 정의합니다.

## 1. 모델 아키텍처 개요

- **모델 종류**: Scikit-Learn을 이용한 Regression (다중 선형 회귀, Random Forest Regressor 등)
- **예측 타겟 (Target/Label)**: `Days_To_EOL` (SSD 수명인 Health가 0%에 도달하기까지 남은 가상의 일수)
- **학습 패러다임**: 
  - 기본 모델은 저희가 내부 엔진(`simulator/engine.py`)으로 무한 생성한 **합성 데이터(Synthetic Data)**로 Pre-train 합니다.
  - 사용자가 실측 환경에서 가져온 1~2시간 분량의 Telemetry 데이터가 입력되면, 이를 바탕으로 곡선을 미세조정(Fine-Tuning/Extrapolation)합니다.

## 2. 필수 학습 훈련 지표 (Features)

모델이 정확한 수명을 예측하기 위해 파라미터로 입력받는 Feature Data List 입니다.

### A. S.M.A.R.T. 및 커널 스토리지 지표 (핵심 상태 데이터)
1. **WAF (Write Amplification Factor)**: 논리 쓰기량 대비 물리 쓰기량의 증폭 비율. 가장 중요도가 높은 가중치이며, 랜덤 쓰기 비율에 따라 급변합니다.
2. **Current_PE_Cycles**: 시작 시점에 측정된 대상 SSD의 P/E 사이클 소모량.
3. **Available_Spare_Blocks**: 예비로 남은 블록 개수. (급격하게 떨어질 경우 WAF와 상관없이 고장이 임박했음을 의미)

### B. I/O 워크로드 패턴 지표 (환경적 요인)
1. **DWPD (Drive Writes Per Day)**: 장치가 하루에 전체 용량 대비 몇 번 덮어씌워지는지의 빈도.
2. **Random_Write_Ratio**: 전체 쓰기 중 4KB 등의 임의 접근 방식이 차지하는 비율 (QLC일수록 패널티 가중치가 높음).

### C. 하이브리드(Device-Mapper) 특화 지표 
순수 구성이 아닌 SLC와 QLC가 결합된 `dm-cache` 환경에서만 활성화되는 지표입니다.
1. **Cache_Hit_Ratio**: 짧은 시간 진행한 테스트(`fio` 등)에서 SLC 캐시가 랜덤 쓰기를 얼마나 방어했는지의 비율.
2. **Cache_Flush_Rate**: 캐시가 꽉 차서 뒤쪽 QLC로 데이터를 순차적으로 밀어낸 빈도. 이 수치가 치솟으면 캐시 용량이 해당 트래픽을 버티기엔 너무 작다는 의미(Thrashing)입니다.

---

## 3. 학습 및 추론 파이프라인 (2-Step)

### Step 1. 대규모 사전 학습 (Pre-training)
실제 SSD를 망가뜨릴 수 없으므로 파이썬 백엔드에서 **10만 개 이상의 시나리오 셋**을 자동 생성합니다.
1. 랜덤한 특성(TLC/QLC 여부, 읽기쓰기 비율 등)을 부여하고 수명이 0%가 될 때까지 딥-시뮬레이션을 강제 가동.
2. 이 과정에서 도출된 수만 개의 `[환경 데이터 Set, 건강 상태] -> [고장 날 때까지 걸린 최종 일수]` 쌍을 CSV로 덤프.
3. `RandomForestRegressor` 모델이 이 대규모 테이블을 학습하여 기본적인 물리적 수명 하락 법칙을 터득.

### Step 2. 초기 패턴 외삽 추론 (Extrapolation Inference)
실제 사용자는 1~2시간 동안 `fio` 등으로 뽑은 WAF와 트래픽 데이터만 API로 전송합니다.
1. 백엔드의 FastAPI 서버는 이 '찰나의 관측된 로우 데이터'를 Pre-train된 Random Forest 모델에 던집니다.
2. 모델은 과거 학습했던 수만 개의 곡선 파도 중 현재 고객의 데이터 패턴과 가장 유사한 몰락 궤적을 찾아내어, 향후 약 몇 년 뒤 수명이 종료될 것인지 즉각 추론(Extrapolation)해냅니다.
