# Feature: Advanced Time-Series AI Model

## 1. 개요 (Overview)
기존 Scikit-learn의 Random Forest 모델도 합성형 데이터를 기반으로 한 외삽에서는 훌륭한 성능을 나타내지만, 극도로 가변적인 딥러닝 기반 시계열 WAF 변화를 가장 높은 예측력으로 처리하기 위해서는 Sequence 모델의 도입이 필수적입니다.

## 2. 주요 기능 스펙
- **모델 아키텍처 업그레이드**
  - RNN/LSTM: 연속적인 IO 트래픽과 누적 WAF라는 시계열 구조 파악에 탁월함.
  - Transformer(Time-Series): 아주 긴 장기 과거 관측성을 바탕으로 장기 예측 노이즈를 덜어내는 것에 유효.
- **예측 타겟 (Target) 다변화**
  - 기존의 단일 산출물 "남은 일수" 뿐만 아니라, 특정 시점에 예상되는 P/E 사이클 손실량과 Upper/Lower Confidence Interval (신뢰 구간)을 동시에 반환.

## 3. 학습 및 배포 파이프라인 단계
1. **PyTorch 환경 구축**: 기존 Scikit-learn 중심이던 `backend/ai/model.py` 모듈 구조 확장.
2. **합성 시나리오 데이터 확보**: 기존 시뮬레이터(`simulator/engine.py`)를 통해 발생한 시계열 이벤트 데이터를 시퀀스 형태의 텐서 구조로 재가공.
3. **훈련 및 평가 (Training & Validation)**: 합성 데이터 및 실제 일부 고강도 Stress Test 궤적을 섞어 미세조정(Fine-tuning) 실험 진행.
4. **FastAPI 모듈 교체**: 모델 크기를 감안해 ONNX 등으로 경량화 Export 후 API 백엔드에 서빙.

## 4. 기대 효과
- 짧은 시간의 실측 데이터만으로도 AI가 워크로드의 주기성(예: 낮/밤의 I/O 변화율 차이 등) 패턴까지도 예측의 변수로서 고려할 수 있게 됩니다.
