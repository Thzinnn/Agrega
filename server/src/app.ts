import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return origin; // Allow non-CORS requests
      if (origin === 'http://localhost:3000' || /^https:\/\/.*\.pages\.dev$/.test(origin)) {
        return origin;
      }
      return null;
    },
    credentials: true,
  })
);

// Basic health and control routes
app.get('/', (c) => c.json({ status: 'ok', runtime: 'edge/hono' }));
app.get('/favicon.ico', (c) => c.body(null, 204));

// Application routes
app.route('/', routes);

// Central error handler
app.onError(errorHandler);

export default app;
