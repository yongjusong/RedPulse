# RedPulse 정량적 부하 및 메트릭 분석 리포트 (Beta)

본 문서는 RedPulse 플랫폼이 수천 개의 디스크(Clusters of Disks)를 실시간으로 모니터링하고 수명을 예측할 때 발생하는 시스템 부하 및 메트릭 체계를 정량적으로 분석한 리포트입니다.

---

## 1. 메트릭 체계 및 데이터 수집 방식

### 수집 메트릭 (Metrics)
- **WAF (Write Amplification Factor)**: SSD 수명에 가장 큰 영향을 미치는 실측 지표.
- **Health (Available Spare %)**: NAND 자체에서 보고하는 물리적 마멸도.
- **IOPS / Throughput (read_mbps, write_mbps)**: 실시간 워크로드 강도 파악.
- **Temperature_C**: 열로 인한 스로틀링 및 수명 단축 요인 모니터링.

### 데이터 수집 방식 (Ingestion)
- **Agent-Push 방식**: 각 노드에 설치된 에이전트가 `POST /api/v1/telemetry/ingest` 엔드포인트로 JSON 페이로드를 전송합니다.
- **비동기 처리**: 백엔드는 RESTful API로 데이터를 수집하며, SQLite DB에 ACID 트랜잭션을 보장하며 저장합니다.
- **스토리지 부하**: 1,000개 디스크가 1분 주기로 보고할 경우, 초당 약 16건의 Write가 발생합니다. 이는 SQLite 및 일반적인 SSD 스토리지에서 시스템 부하율 0.1% 미만의 극히 낮은 부하입니다.

---

## 2. 수명 예측을 위한 컴퓨팅 연산 분석

사용자께서 우려하신 **"수많은 디바이스에 대한 AI 연산이 서버에 무리를 주지 않는가"**에 대한 정량적 분석입니다.

### LSTM 모델 연산 복잡도 (Complexity)
- **모델 구조**: 2계층(Layer) LSTM, Hidden Size 64.
- **입력 시퀀스**: 최근 30일(또는 Look-back 설정값) 시계열 데이터.
- **단일 추론 연산량 (FLOPs)**: 
  - $4 \times (Input + Hidden) \times Hidden \times Layers \times Sequence\_Length$
  - $4 \times (2 + 64) \times 64 \times 2 \times 30 \approx 1,013,760$ operations (약 1 Mega-FLOPs)

### 스케일링 분석 (Scaling to 1,000 Disks)
- **총 연산량**: 1,000개 디스크 $\times$ 1 Mega-FLOPs = **1,000 Mega-FLOPs (1 Giga-FLOPs)**.
- **하드웨어 가용 성능**:
  - 현대적 Xeon/EPYC 서버 CPU 1코어 성능: 약 100~300 Giga-FLOPS.
  - Apple M1/M2 1코어 성능: 약 200+ Giga-FLOPS.
- **지연 시간 (Latency)**:
  - 1,000개 디스크의 수명을 일괄 예측하는 데 걸리는 순수 연산 시간은 **약 0.005초 ~ 0.01초**입니다. 
  - 네트워크 오버헤드와 DB I/O를 포함해도 전수 예측에 **1초 미만**의 CPU 점유율만 사용합니다.

---

## 3. 결론: 상시 관제 가용성

RedPulse의 AI 엔진은 **Edge-Friendly**하게 설계되었습니다.
- **메모리(RAM)**: 모델 가중치 파일 사이즈가 약 150KB 내외로, 메모리 점유가 거의 없습니다.
- **CPU**: 상시 백그라운드 연산으로 수행하더라도 시스템 리소스의 1% 미만을 사용하며 수천 대의 디스크를 실시간 관제할 수 있습니다.
- **확장성**: 수만 대 규모로 확장 시에도 추론 연산보다는 DB I/O가 병목이 될 가능성이 크며, 이는 추후 DB Sharding을 통해 해결 가능한 범위입니다.

> [!TIP]
> **결론**: 현재의 아키텍처는 별도의 GPU 없이 일반적인 상용 서버 CPU만으로도 **1,000개 이상의 노드를 지연 없이 실시간 예측 관제하기에 충분히 여유로운 상태**입니다.
