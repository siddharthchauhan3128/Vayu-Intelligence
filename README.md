# Vayu — Urban Air Quality Intelligence Platform

> AI-powered urban air quality intelligence system for Indian metros — moving cities from reactive monitoring to proactive, evidence-based intervention.

![Vayu Dashboard](https://img.shields.io/badge/Status-Active%20Development-22C55E?style=flat-square) ![Node](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js) ![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python) ![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react) ![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

---

## The Problem

India's air quality crisis kills **1.67 million people annually** (Lancet Planetary Health, 2024). Despite 900+ CAAQMS monitoring stations deployed under the National Clean Air Programme, only 31% of cities have any actionable multi-agency response protocols linked to those readings.

**The data exists. The intelligence layer to act on it does not.**

City administrators need more than dashboards — they need:
- **Geospatial attribution** — which sources are responsible at this location, right now
- **Predictive forecasting** — what will AQI be in 24–72 hours at ward level
- **Enforcement intelligence** — where to deploy inspectors for maximum impact

---

## Screenshots      

### Live AQI Intelligence Dashboard
![Vayu Dashboard](docs/screenshots/Dashboard.png)

### Ward Detail — Source Attribution + AI Agent  
![Ward Detail](docs/screenshots/ward-details.png)

### 72-Hour Predictive Forecast
![Forecast Chart](docs/screenshots/forecast.png)

## What Vayu Does

Vayu fuses real-time AQI station data, satellite imagery, meteorological feeds, and ML models to give city administrators a live intelligence platform — not just a chart.

### Core Features

**Live Ward-Level AQI Map**
Real-time choropleth map across Mumbai, Delhi, Bengaluru, and Kolkata. AQI data ingested every 5 minutes from CPCB stations via data.gov.in API. WebSocket pushes live updates to all connected clients every 60 seconds.

**72-Hour AQI Forecasting**
ML model (Prophet + XGBoost diurnal pattern) generates ward-level AQI forecasts at 6-hour intervals. Accounts for time-of-day patterns, rush hours, meteorological conditions, and seasonal trends.

**Source Attribution Engine**
XGBoost classifier attributes pollution by source category — vehicle emissions, construction dust, industrial stacks, waste burning — based on land use type, wind direction, and time of day. Displayed as an interactive donut chart per ward.

**3 Autonomous AI Agents (Gemini API)**
- **Attribution Agent** — explains in plain English why a specific ward has its current AQI, with local Indian city context
- **Enforcement Agent** — prioritises which emission sources to inspect first based on violation history and pollution contribution
- **Advisory Agent** — generates multilingual health advisories in Hindi, Kannada, and Tamil for citizen communication

**NASA FIRMS Satellite Fire Layer**
Real satellite fire hotspot data overlaid on the map. Shows active fires within range that may be contributing to downwind ward pollution.

**Multi-City Comparison**
Side-by-side AQI trend comparison across all 4 metros — enabling city administrators to learn from interventions that worked elsewhere.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Leaflet.js, Recharts |
| Backend API | Node.js 20, Express.js, WebSocket (ws) |
| ML Service | Python 3.11, FastAPI, XGBoost, scikit-learn |
| Database | PostgreSQL 16 + TimescaleDB (time-series), PostGIS (spatial) |
| Cache | Redis 7 (pub/sub + query cache) |
| AI Agents | Anthropic Gemini API (gemini-flash-3.5) |
| Data Sources | CPCB/data.gov.in, OpenWeatherMap, NASA FIRMS |
| Infrastructure | Docker Compose, Nginx |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│         Leaflet Map · Recharts · WebSocket client        │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP + WebSocket
┌─────────────────────▼───────────────────────────────────┐
│                  Node.js / Express                       │
│   REST API · WebSocket Server · Cron Jobs · AI Agents   │
│                  Gemini API (3 agents)                   │
└──────┬──────────────┬──────────────┬────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼────────┐
│  PostgreSQL  │ │   Redis    │ │ Python ML   │
│ TimescaleDB  │ │  Cache +   │ │   Service   │
│   PostGIS    │ │  Pub/Sub   │ │  FastAPI    │
└─────────────┘ └────────────┘ └─────────────┘
       ▲
┌──────┴──────────────────────────────────────────────────┐
│                   Data Sources                           │
│   CPCB AQI · OpenWeatherMap · NASA FIRMS · OSM          │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
vayu-intelligence/
├── backend/                  # Node.js + Express
│   └── src/
│       ├── agents/           # AI agents
│       │   ├── attributionAgent.js
│       │   ├── enforcementAgent.js
│       │   └── advisoryAgent.js
│       ├── routes/           # REST API routes
│       ├── services/         # CPCB, weather, satellite ingestion
│       ├── websocket/        # Real-time WebSocket server
│       └── db/               # PostgreSQL pool + schema
├── ml-service/               # Python + FastAPI
│   └── app/
│       ├── models/           # Forecasting + attribution models
│       └── routers/          # ML API endpoints
├── frontend/                 # React + Vite
│   └── src/
│       ├── components/       # Map, Dashboard, Charts
│       └── hooks/            # useWebSocket
├── infra/                    # Docker Compose + DB schema
│   ├── docker-compose.yml
│   └── init.sql
└── data/                     # Ward GeoJSON + historical AQI CSVs
```

---

## Getting Started

### Prerequisites
- Docker Desktop
- Git

### Setup in 3 commands

```bash
git clone https://github.com/YOUR_USERNAME/vayu-intelligence.git
cd vayu-intelligence

# Add your API keys to .env (copy from .env.example)
cp .env.example .env

cd infra && docker compose up --build
```

### Environment Variables

Create a `.env` file in the root with:

```env
# API Keys
GEMINI_API_KEY=sk-ant-...
OPENWEATHER_KEY=...
NASA_FIRMS_KEY=...
DATA_GOV_KEY=...

# Database
POSTGRES_USER=vayu
POSTGRES_PASSWORD=vayu_dev_2025
POSTGRES_DB=vayu_db
DATABASE_URL=postgresql://vayu:vayu_dev_2025@postgres:5432/vayu_db

# Redis
REDIS_URL=redis://redis:6379

# Services
ML_SERVICE_URL=http://ml-service:8000
NODE_PORT=3001
NODE_ENV=development
```

### Verify everything is running

```
http://localhost:3001/health   → {"status":"ok","service":"vayu-backend"}
http://localhost:8000/health   → {"status":"ok","service":"vayu-ml"}
http://localhost:5173          → Vayu dashboard
```

---

## API Reference

### Wards
```
GET  /api/wards?city=mumbai          # All wards with latest AQI
GET  /api/wards/:id                  # Single ward detail
```

### Forecasting
```
GET  /api/forecast/:wardId           # 72h AQI forecast (12 data points)
```

### Attribution
```
GET  /api/attribution/:wardId        # ML source attribution breakdown
```

### AI Agents
```
POST /api/agent/attribute/:wardId    # Claude explains ward pollution
POST /api/agent/enforce              # Enforcement priority queue
POST /api/agent/advisory/:wardId     # Multilingual health advisory
```

### ML Service (Internal)
```
POST /ml/forecast                    # AQI time-series forecast
POST /ml/attribute                   # Source category attribution
POST /ml/dispersion                  # Gaussian plume dispersion
```

---

## Data Sources

| Source | Data | Frequency |
|---|---|---|
| CPCB / data.gov.in | Live AQI from 900+ stations | Every 5 min |
| OpenWeatherMap | Wind, humidity, temperature | Every 30 min |
| NASA FIRMS | Satellite fire hotspots | Every 30 min |
| OpenStreetMap | Ward boundaries, land use | Static |

---

## Cities Supported

| City | Wards | Avg AQI (2024) |
|---|---|---|
| Mumbai | 8 (expanding) | 187 |
| Delhi | 4 (expanding) | 318 |
| Bengaluru | Coming Day 12 | 124 |
| Kolkata | Coming Day 12 | 229 |

---

## Impact

- **1.67 million** premature deaths annually from air pollution in India
- **24 of 50** most polluted cities are Tier 1/2 urban centres
- Only **31%** of monitored cities have actionable response protocols
- Vayu provides the missing intelligence layer between data and action

---

## Built With

Independently developed as part of a smart cities hackathon submission focused on environmental intelligence and public health for urban India.

**Devloper:** Siddharth Chauhan
**Stack:** Node.js · Python · React · PostgreSQL · TimescaleDB · Redis · Claude AI · Docker

---

## License

MIT License — see [LICENSE](LICENSE) for details.