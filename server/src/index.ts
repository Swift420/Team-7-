import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { liquidRouter } from './routes/liquidRoutes.js';
dotenv.config();

export const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Mount Liquid Story Engine API routes
app.use('/api/liquid', liquidRouter);

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'nzz-pulse-server'
  });
});

// Only listen if not imported by a test runner
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 NZZ Pulse Server is running on http://localhost:${PORT}`);
  });
}
