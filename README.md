# Data Visualisation Project

A fullstack data visualization dashboard built with **Node.js (Express + TypeScript)** and **React (Vite + TypeScript + Recharts)**.

---

## 📁 Project Structure

```text
data_visualistation/
├── package.json          # Root scripts to run both client and server
├── server/               # Node.js + Express backend
│   ├── src/
│   │   ├── data/         # Sample datasets (time series, categories, regional, etc.)
│   │   └── index.ts      # Express server with REST API endpoints
│   ├── tsconfig.json
│   └── package.json
└── client/               # React + TypeScript frontend
    ├── src/
    │   ├── components/   # Recharts visualization components (Area, Bar, Pie, Radar)
    │   ├── services/     # API service client connecting to Express
    │   ├── types/        # TypeScript data models
    │   ├── App.tsx       # Main analytics dashboard
    │   ├── App.css       # Clean modern dark theme styles
    │   └── main.tsx
    ├── vite.config.ts    # Configured with proxy to server (port 5001)
    └── package.json
```

---

## 🚀 Quick Start

From the root project folder:

```bash
# 1. Navigate into the project
cd /Users/davidapollos/documents/data_visualistation

# 2. Run both backend and frontend concurrently
npm run dev
```

- **Frontend (React)**: [http://localhost:3000](http://localhost:3000)
- **Backend API (Express)**: [http://localhost:5001](http://localhost:5001)

---

## 🛠 Available Scripts (from Root)

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts both server and client concurrently with hot reloading |
| `npm run dev:server` | Starts only the Express backend (`localhost:5001`) |
| `npm run dev:client` | Starts only the Vite React frontend (`localhost:3000`) |
| `npm run build` | Compiles TypeScript for both backend and frontend |
| `npm start` | Runs the compiled production Node backend |

---

## 📊 API Endpoints

- `GET /api/health` - Service health status
- `GET /api/metrics/overview` - KPI metrics (revenue, active users, conversion)
- `GET /api/metrics/timeseries?range=12m` - Monthly revenue, profit, targets
- `GET /api/metrics/categories` - Product stream distribution (donut chart)
- `GET /api/metrics/regional` - Quarterly regional breakdown (bar chart)
- `GET /api/metrics/performance` - Operational benchmarks (radar chart)
- `GET /api/metrics/traffic` - Traffic acquisition & bounce rates
