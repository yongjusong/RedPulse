# RedPulse 아키텍처 및 특허 심사용 도면 명세 (Architecture & Flow)

이 문서는 특허 출원 및 논문 작성을 위한 시각적 도면(Flowchart, Architecture Diagram, DFD)을 포함하고 있습니다. 마크다운 기반의 Mermaid 문법으로 작성되어 있어, 손쉽게 이미지 파일로 변환하여 명세서에 첨부할 수 있습니다.

---

## 도면 1. RedPulse 전체 시스템 컴포넌트 구조도 (System Architecture Diagram)

백엔드 엔진과 프론트엔드 대시보드 간의 데이터 흐름, 그리고 Virtual Mode와 Telemetry Mode가 어떻게 상호작용하는지 보여주는 전체 시스템 흐름도입니다.

```mermaid
graph TD
    %% 사용자 영역
    subgraph Client [사용자 인터페이스 프론트엔드 - React/Vite]
        UI[웹 대시보드 UI]
        Conf_V[가상 컴포넌트 설정\n- 용량, TLC/QLC, 읽기/쓰기 비율]
        Conf_T[Telemetry 설정\n- 단기 1시간 fio 실측된 WAF 수치 데이터]
        UI -->|Mode 1 선택| Conf_V
        UI -->|Mode 2 선택| Conf_T
    end

    %% API 게이트웨이
    API[FastAPI 라우터 Gateway]
    Conf_V -->|POST /simulate| API
    Conf_T -->|POST /extrapolate| API

    %% 백엔드 로직 영역
    subgraph Backend [파이썬 기반 코어 엔진 영역]
        subgraph Engine [Rule-based 시뮬레이터]
            Model_Storage[물리적 드라이브 모델\n- TLC, QLC, Hybrid 계층]
            Physics[시계열 기반 마모 연산 수학 엔진]
            Model_Storage <--> Physics
        end

        subgraph ML [AI 기반 Extrapolation 모델]
            RF_Model[사전 학습된 Random Forest 예측 모델\n.pkl 파일 로드]
        end
    end

    API -->|라우팅| Physics
    API -->|라우팅| RF_Model

    Physics -->|Time-Series RUL\n순수 가상 수명 곡선| Res_V[가상 시점 기반 응답]
    RF_Model -->|Telemetry 기반 추론\n실측 기반 수명 곡선| Res_T[AI 외삽 추론 응답]

    Res_V --> UI
    Res_T --> UI
```

---

## 도면 2. 시스템 데이터 흐름도 (Data Flow Diagram - DFD)

ML 파이프라인과 순수 가상 엔진으로 입력과 출력이 흐르는 과정에서 데이터가 가공 및 변환되는 논리적 정보의 상호작용 단계들을 보여줍니다.

```mermaid
flowchart LR
    subgraph "External Entities"
        User(데이터센터 엔지니어)
    end
    
    subgraph "Data Input/Interface"
        Input{데이터 수신 및 분류}
    end

    subgraph "Data Processing (Backend)"
        Gen[가상 트래픽 및 워크로드 생성기]
        WAF_Calc[WAF / Cache Hit 수학 연산기]
        ML_Pred[머신러닝 데이터 외삽 엔진]
    end
    
    subgraph "Data Storage"
        ModelDB[(.pkl AI 모델 웨이트)]
    end

    User -- "1. 가상 스펙(Mode 1) 입력" --> Input
    User -- "2. 실측 텔레메트리(Mode 2) 입력" --> Input
    
    Input -- "가상 설정 제원 (용량, RW비율)" --> Gen
    Gen -- "Virtual I/O Block Stream" --> WAF_Calc
    WAF_Calc -- "물리적 감쇄 계산" --> WAF_Calc
    WAF_Calc -- "매일 건강감소율(%) 곡선 점들" --> User
    
    Input -- "단기 실측 WAF/HitRatio" --> ML_Pred
    ModelDB -- "가중치 및 패턴 파라미터 로드" --> ML_Pred
    ML_Pred -- "Extrapolated 예측일수 (RUL)" --> User
```

---

## 도면 3. 하이브리드 SSD 수명 외삽(Extrapolation) 머신러닝 파이프라인 흐름도

이 도면은 특허의 핵심 청구항이 될 **"대규모 가상 공간에서 합성된 노후화 로그와 사용자의 짧은 단기 텔레메트리 값을 결합하여 미래의 잔여 수명을 외삽 추론하는 방법"**을 명확하게 표현합니다.

```mermaid
sequenceDiagram
    participant P as 파이썬 물리 시뮬레이션 엔진
    participant DB as CSV 스토리지 (합성 데이터셋)
    participant AI as Scikit-Learn 머신러닝 모델
    participant U as 실제 이용자 (엔지니어)
    
    Note over P, AI: [Phase 1] 백그라운드 사전 학습 (Pre-training)
    P->>P: 10만 개 이상의 랜덤 가상 시나리오\n(TLC/QLC/캐시 조합) 초고속 파괴 실험 진행
    P->>DB: 초기 발견 WAF 기록, 전체 수명(가상) 일수 DUMP
    DB->>AI: 방대한 노후화 곡선 데이터 셋 입력 (Features & Labels)
    AI->>AI: Random Forest 기반 궤적 패턴 학습 및 가중치 업데이트
    
    Note over AI, U: [Phase 2] 사용자 환경 실측 (Telemetry Extrapolation)
    U->>U: 실제 서버에 타겟 SSD 장착 후\n1시간 단기 가혹 테스트 (fio) 진행
    U->>AI: 실측 데이터 (관측된 WAF 2.5, 캐시 적중률 80% 등) API 전송 전송
    AI->>AI: 사전 학습된 수만 개의 파도 패턴 중\n가장 근접한 붕괴 궤적 매칭 및 보정
    AI-->>U: "이 상태라면 1480일 뒤 고장이 발생할 것입니다." (수명 종료일 외삽 반환)
```

---

### 도면 해석 및 특허 활용 팁
- **도면 1**은 `발명의 구성` 파트에 적합합니다. 웹 클라이언트부터 게이트웨이를 거쳐 두 가지 엔진(물리, ML)으로 분기되는 아키텍처를 잘 설명합니다.
- **도면 2 (DFD)**는 `데이터 처리 과정도` 파트에 적합합니다. 각 데이터 셋이 사용자로부터 들어와서 어디에 가공되고 어떻게 응답으로 나가는지 데이터의 순수 생애 주기를 보여줍니다.
- **도면 3**은 `발명의 실시예(동작 순서도)` 파트에 핵심으로 들어갑니다. **Phase 1(합성 데이터로 무한 파괴 실험 및 선행 학습)** 단계가 존재한다는 점이 기존 기술과의 차별성을 돋보이게 합니다.
