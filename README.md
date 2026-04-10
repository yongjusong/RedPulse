# RedPulse (레드펄스) - AI-Based SSD Lifespan Simulator

RedPulse는 물리적인 자원과 시간을 소비하지 않고, 인공지능(AI)과 가상 시뮬레이션을 통해 다양한 스토리지 구성(TLC, QLC, Hybrid)의 **잔여 수명(RUL, Remaining Useful Life)**을 단 몇 초 만에 예측해내는 프리미엄 웹 기반 대시보드 도구입니다.

인프라 서버 관리자 및 스토리지 엔지니어들이 고가의 데이터센터 장비를 교체하거나, `dm-cache` 같은 Device-Mapper 기반 하이브리드 캐시를 도입하려 할 때, 해당 아키텍처가 실제로 수명 연장에 얼마나 도움을 주는지 직관적인 그래프로 증명할 수 있습니다.

## 🌟 주요 기능 (Features)

- **디바이스 토폴로지 시뮬레이션**: 순수 고내구성(TLC), 고용량(QLC), 그리고 캐시 계층을 두는 하이브리드(SLC+QLC) 방식 지원.
- **워크로드 커스터마이징**: 실제 데이터센터 환경처럼 매일 쓰고 지우는 용량(DWPD) 및 Random/Sequential 쓰기 비율을 자유롭게 설정.
- **AI 고속 시뮬레이션 알고리즘**: Write Amplification Factor (WAF)와 Cache Hit Ratio를 계산하여 수년 간의 노후화를 즉시 예측.
- **다크 모드 엔터프라이즈 대시보드**: 모던하고 세련된 UI를 통해 수명 저하(Health %) 궤적을 확인 가능.

---

## 🛠️ 기술 스택 (Tech Stack)

- **Backend**: Python 3, FastAPI, Scikit-Learn (AI Engine)
- **Frontend**: React 18, Vite, Recharts, CSS (Glassmorphism & Dark Mode)
- **Architecture**: REST API 방식의 느슨한 결합 (플랫폼 비종속)

---

## 🚀 설치 및 실행 방법 (How to Run)

본 프로젝트는 백엔드 서버와 프론트엔드 웹 앱이 분리되어 연동되는 구조입니다. 두 서버를 모두 실행시켜야 합니다.

### 1. 백엔드 서버 실행 (Python FastAPI)
AI 모델과 물리적 시뮬레이션 엔진을 구동합니다.

```bash
# 1. 백엔드 폴더로 이동
cd backend

# 2. 필수 패키지 설치 (가상 환경 사용 권장)
pip install -r requirements.txt

# 3. FastAPI 서버 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> 정상적으로 실행되면 `http://localhost:8000` 에서 API가 응답합니다.

### 2. 프론트엔드 실행 (React + Vite)
사용자 인터페이스 대시보드를 구동합니다. Node.js(`npm`)가 필요합니다.

```bash
# 1. 프론트엔드 폴더로 이동
cd frontend

# 2. 필수 의존성 패키지 설치
npm install

# 3. 로컬 개발 서버 실행
npm run dev
```
> 서버가 실행되면 터미널에 표시된 주소(예: `http://localhost:5173`)로 접속합니다.

---

## 📂 디렉토리 구조 (Directory Structure)

```text
redpulse/
├── backend/
│   ├── main.py              # FastAPI 진입점 및 API 라우터
│   ├── requirements.txt     # 파이썬 의존성
│   └── simulator/
│       ├── engine.py        # 시계열 물리 기반 수명 예측 시뮬레이터 엔진
│       └── storage_models.py# TLC, QLC, Hybrid 드라이브 마모 수학적 모델링
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx          # 메인 UI 레이아웃, 시뮬레이션 설정 및 차트
│       └── index.css        # 프리미엄 다크모드 테마 스타일시트
└── README.md                # 본 설명서
```

---

## 🔮 추후 계획 (Roadmap)
- [ ] Scikit-Learn 머신러닝 회귀 모델 본격 학습 및 정교화.
- [ ] 여러 스토리지를 동시에 실행하여 겹쳐서 비교하는 Overlay Chart 기능.
- [ ] 경영진 보고를 위한 PDF Report 내보내기 기능.
- [ ] `blktrace` 및 `fio` 실제 실무 로그 파일 업로드 및 분석 라우터.