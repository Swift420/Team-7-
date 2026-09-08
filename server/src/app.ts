import express, { ErrorRequestHandler } from 'express';
import path from 'node:path';
import cors from 'cors';
import multer from 'multer';
import { mockCategories, mockOverview, mockPerformance, mockRegional, mockTimeSeries, mockTrafficSources } from './data/mockData.js';
import { articleRouter } from './routes/articles.js';
import { ArticleValidationError } from './services/articleParser.js';
import { VisualizationAnalysisError } from './services/visualizationService.js';
import { storyMapRouter } from './routes/storyMap.js';
import { authRouter } from './routes/auth.js';

export const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
const qDataDir = process.env.Q_DATA_DIR || path.resolve(process.cwd(), '../VisualVelocity/input/q_data');
app.use('/api/visual-assets', express.static(qDataDir));
app.get('/api/health', (_req, res) => res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'data-visualisation-server' }));
app.use('/api/auth', authRouter);
app.use('/api/articles', articleRouter);
app.use('/api/story-map', storyMapRouter);
app.get('/api/metrics/overview', (_req, res) => res.json({ success: true, data: mockOverview }));
app.get('/api/metrics/timeseries', (req, res) => {
  const range = (req.query.range as string) || '12m';
  let data = [...mockTimeSeries];
  if (range === '6m') data = data.slice(6);
  else if (range === '3m') data = data.slice(9);
  res.json({ success: true, range, data });
});
app.get('/api/metrics/categories', (_req, res) => res.json({ success: true, data: mockCategories }));
app.get('/api/metrics/regional', (_req, res) => res.json({ success: true, data: mockRegional }));
app.get('/api/metrics/performance', (_req, res) => res.json({ success: true, data: mockPerformance }));
app.get('/api/metrics/traffic', (_req, res) => res.json({ success: true, data: mockTrafficSources }));

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ArticleValidationError) {
    res.status(400).json({ success: false, error: { code: 'ARTICLE_VALIDATION_ERROR', message: error.message, details: error.details } });
    return;
  }
  if (error instanceof multer.MulterError) {
    res.status(400).json({ success: false, error: { code: 'UPLOAD_ERROR', message: error.code === 'LIMIT_FILE_SIZE' ? 'Article file exceeds the 5 MB limit' : error.message } });
    return;
  }
  if (error instanceof VisualizationAnalysisError) {
    const status = error.code === 'AI_NOT_CONFIGURED' ? 503 : 502;
    res.status(status).json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }
  console.error(error);
  res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to process the request' } });
};
app.use(errorHandler);
