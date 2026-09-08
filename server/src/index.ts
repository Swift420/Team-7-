import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  mockOverview,
  mockTimeSeries,
  mockCategories,
  mockRegional,
  mockPerformance,
  mockTrafficSources
} from './data/mockData.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'data-visualisation-server'
  });
});

// KPI Overview
app.get('/api/metrics/overview', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockOverview
  });
});

// Time Series Data (Revenue, Profit, Expenses)
app.get('/api/metrics/timeseries', (req: Request, res: Response) => {
  const range = (req.query.range as string) || '12m';
  let data = [...mockTimeSeries];

  if (range === '6m') {
    data = data.slice(6);
  } else if (range === '3m') {
    data = data.slice(9);
  }

  res.json({
    success: true,
    range,
    data
  });
});

// Revenue Category Breakdown (Pie / Donut)
app.get('/api/metrics/categories', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockCategories
  });
});

// Regional Sales / Performance (Bar chart)
app.get('/api/metrics/regional', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockRegional
  });
});

// Operational Performance Radar Chart
app.get('/api/metrics/performance', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockPerformance
  });
});

// Traffic Sources
app.get('/api/metrics/traffic', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockTrafficSources
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Data Visualisation Server is running on http://localhost:${PORT}`);
});
