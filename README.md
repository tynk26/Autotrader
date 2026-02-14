# PROJECT OVERVIEW

<img width="1263" height="725" alt="Screenshot 2025-09-22 063931" src="https://github.com/user-attachments/assets/5581ff41-9cd3-4e2a-ad1c-2cbdbd7c6559" />
<img width="1268" height="725" alt="image" src="https://github.com/user-attachments/assets/42aab198-5e4c-4d24-b88c-f8cb8e7e6337" />
<img width="1268" height="725" alt="image" src="https://github.com/user-attachments/assets/fb8b025e-75a1-48f4-9e3f-b8ea6562f5a0" />

# 🚀 ALGO_V3

## 실시간 멀티 타임프레임 알고리즘 트레이딩 플랫폼

> VWAP + Fibonacci 기반 전략 검증을 위한  
> TradingView 스타일 GUI + IBKR 연동 자동매매 시스템

---

# 1. 📌 프로젝트 개요

ALGO_V3는 **실시간(또는 지연) 시장 데이터 기반의 알고리즘 트레이딩 플랫폼**입니다.  
프론트엔드(React)와 백엔드(FastAPI)를 완전히 분리한 구조로 설계되었으며,  
IBKR(Interactive Brokers) API와 연동하여 실제 주문 실행까지 가능합니다.

이 프로젝트는 단순한 전략 코드 구현을 넘어,

- 실시간 데이터 스트리밍
- 멀티 타임프레임(MTF) 지표 계산
- WebSocket 기반 차트 업데이트
- 주문 실행 및 체결 알림 처리
- 모듈형 대시보드 구조

까지 포함하는 **Full-stack Trading System**입니다.

---

# 2. 🎯 개발 목표

- ✅ VWAP + Fibonacci 기반 전략 실전 검증
- ✅ 멀티 타임프레임 Fractal 기반 구조 설계
- ✅ TradingView와 유사한 차트 UX 구현
- ✅ IBKR Paper / Live 전환 가능한 구조 설계
- ✅ 확장 가능한 모듈형 아키텍처 구축

---

# 3. 🏗️ 시스템 아키텍처

## 📊 데이터 흐름

Contract  
↓  
IBKR API (Market Data)  
↓  
FastAPI Backend  
↓  
WebSocket / REST API  
↓  
React Frontend Chart  
↓  
Indicator Overlay (VWAP / Fib / Fractals)  
↓  
Signal Generation  
↓  
Order Execution  
↓  
WebSocket Order Confirmation

---

# 4. 🖥️ Frontend 구조 (React + TypeScript)

### 주요 기술

- React
- TypeScript
- Lightweight Charts
- react-grid-layout
- WebSocket API

### 주요 기능

#### ✅ TradingView 스타일 차트

- Candlestick Chart
- Volume Overlay
- 실시간 Tick 반영
- Historical Data 로딩

#### ✅ 멀티 타임프레임 Fractal 표시

- 5-bar fractal 기반 significant high/low 탐지
- 타임프레임별 색상 구분
- WebSocket 기반 실시간 업데이트

#### ✅ VWAP & Fibonacci Overlay

- fractal anchor 기반 계산
- 0.382 / 0.618 레벨 자동 표시
- MTF 확장 구조 설계 완료

#### ✅ 대시보드 시스템

- 위젯 drag & resize
- 향후 Strategy Panel / Trade Log 확장 가능

---

# 5. ⚙️ Backend 구조 (FastAPI + ib_insync)

### 주요 기술

- Python 3.12
- FastAPI
- ib_insync
- asyncio
- WebSocket

### requirements.txt

```text
fastapi==0.114.2
uvicorn[standard]==0.30.6
ib-insync==0.9.86
python-dotenv==1.0.1
websockets==12.0
FastAPI, uvicorn, ib-insync, dotenv, websockets 등
ALGO_V3 백엔드 실행에 필요한 핵심 라이브러리입니다.

주요 API 엔드포인트
📌 REST
/api/history
과거 OHLCV 데이터 조회

MTF Fractal 계산 포함

/api/quote/snapshot
실시간 스냅샷 가격 조회

/api/order/place
IBKR 주문 실행

📌 WebSocket
/ws/stream
실시간 tick 스트리밍

/ws/indicators
MTF fractal / VWAP 데이터 전송

/ws/orders
주문 체결 상태 알림

6. 📂 프로젝트 구조
ALGO_V3/
│
├── backend/
│   ├── main.py
│   ├── strategy_engine.py
│   ├── contract_utils.py
│   ├── datafeed.py
│   ├── models.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TVChart.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── OrderTicket.tsx
│   │   │   ├── StrategySignalsPanel.tsx
│   │   │   └── TradeLog.tsx
│   │   │
│   │   ├── lib/
│   │   │   └── timeframes.ts
│   │   │
│   │   └── App.tsx
│   │
│   └── package.json
│
├── docker-compose.yml
├── backend/Dockerfile
├── frontend/Dockerfile
└── README.md
7. 🧠 핵심 알고리즘 로직
1️⃣ 5-Bar Fractal Engine
High: 중앙 캔들이 좌우 2개보다 높을 때

Low: 중앙 캔들이 좌우 2개보다 낮을 때

현재 TF + 상위 TF 동시 계산

WebSocket 스트리밍 구조 지원

2️⃣ MTF Fibonacci (0.382 / 0.618)
Fractal High/Low 기반 anchor 설정

자동 retracement 계산

Confluence zone 탐지 구조 설계

3️⃣ VWAP 기반 전략 구조
Anchor VWAP 설계

Session 기반 확장 가능

향후 multi-session VWAP 지원 예정

8. 🚀 실행 방법
1️⃣ 로컬 Python/Node 실행
Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
Frontend
cd frontend
npm install
npm run dev
2️⃣ Docker 기반 실행 (권장)
1️⃣ Docker Build & Up
docker compose up --build
2️⃣ 서비스 접근
Backend: http://localhost:8000

Frontend: http://localhost:5173

3️⃣ Docker 종료
docker compose down
```
