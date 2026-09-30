import { Hono } from 'hono';
import { jobRoutes } from './job.routes.js';

export const routes = new Hono();

// Health check endpoint
routes.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() }, 200);
});

// V1 API Routes
routes.route('/api/v1/jobs', jobRoutes);
