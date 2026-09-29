import { Router } from 'express';
import { jobRoutes } from './job.routes.js';

export const routes = Router();

// Health check endpoint
routes.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// V1 API Routes
routes.use('/api/v1/jobs', jobRoutes);
