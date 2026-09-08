import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { liquidRouter } from './routes/liquidRoutes.js';
import {
  mockOverview,
  mockTimeSeries,
  mockCategories,
  mockRegional,
  mockPerformance,
  mockTrafficSources
} from './data/mockData.js';

dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Mount Liquid Story Engine API routes
app.use('/api/liquid', liquidRouter);

// Audio stream endpoint (returns a valid silent MP3 frame buffer if file does not exist on disk)
app.get('/api/audio/:filename', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'audio/mpeg');
  res.setHeader('Accept-Ranges', 'bytes');
  // Minimal valid silent MP3 frame (MPEG-1 Layer 3, 128 kbps, 44.1 kHz, stereo)
  const silentMp3Frame = Buffer.from([
    0xff, 0xfb, 0x90, 0x64, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  res.send(silentMp3Frame);
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'nzz-pulse-server'
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

// Only listen if not imported by a test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NZZ Pulse Server is running on http://localhost:${PORT}`);
  });
}
