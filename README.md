# Sturvixa AI

An enterprise-grade, real-time SaaS platform built with a high-performance modern tech stack. InsightForge AI empowers organizations with lightning-fast data ingestion, highly-scalable backend services, and a stunning, responsive Glassmorphism UI.

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS & Vanilla CSS (Glassmorphism, Dark Mode)
- **Authentication**: NextAuth.js (Role-Based Access Control)
- **Real-Time**: Native WebSocket client for live telemetry streaming

### Backend
- **Framework**: FastAPI (Python 3.11)
- **Database**: NeonDB (Serverless PostgreSQL) + SQLAlchemy ORM
- **Caching**: Redis & fastapi-cache2
- **Background Tasks**: Celery distributed task queue
- **Real-Time**: Async WebSockets

### DevOps & Infrastructure
- **Containerization**: Docker & Docker Compose (Multi-container orchestration)
- **Optimization**: Next.js Standalone build & Alpine Python Slim images
- **CI/CD**: GitHub Actions (Linting, Build Testing, Docker Verification)

---

## 🌟 Key Features

1. **Enterprise Data Pipeline (ETL)**
   Offloads processing of 140,000+ data rows to Celery background workers to keep the main thread unblocked. Fast, efficient, and reliable data ingestion into a cloud-hosted Postgres database.

2. **Ultra-Low Latency Caching**
   Heavy SQL analytical aggregations are cached seamlessly via Redis, reducing repeated request latencies by over 80%.

3. **Live Telemetry Streams**
   Pulsing real-time server telemetry widgets built on a bidirectional WebSocket connection to eliminate HTTP polling constraints.

4. **Premium UI/UX Design**
   Stunning user interface featuring custom CSS variables, dynamic bento-box grids, smooth micro-animations, and responsive accessibility across all devices.

5. **Production-Ready CI/CD**
   A robust GitHub Actions pipeline ensures code quality via flake8 and automatically tests Node.js/Docker builds on every push.

---

## 🛠️ Local Deployment via Docker

Running the entire stack requires just a single command via Docker Compose.

### Prerequisites
- Docker & Docker Compose
- `.env` files populated in both `backend/` and `frontend/` (NeonDB URI, NextAuth Secret, Redis URL)

### Quick Start
```bash
# Clone the repository
git clone https://github.com/daya-2619/InsightForge-AI3.git
cd InsightForge-AI3

# Build and deploy the quad-stack (Redis, Celery, FastAPI, Next.js)
docker-compose up --build -d
```
- **Frontend App**: `http://localhost:3000`
- **FastAPI Docs**: `http://localhost:8000/docs`

---
*Developed with enterprise scalability and premium aesthetics in mind.*
