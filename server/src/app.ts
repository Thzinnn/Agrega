import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { csrfMiddleware } from './middlewares/csrfMiddleware.js';
import { uploadValidationMiddleware } from './middlewares/uploadMiddleware.js';
import { initializePrisma } from './lib/prisma.js';
import { logger } from './utils/logger.js';
import { PrismaClient } from '@prisma/client';

type Bindings = {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  SCRAPER_API_KEY?: string;
};

type Variables = {
  prisma: PrismaClient;
};

export const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

app.use('*', csrfMiddleware);
app.use('*', uploadValidationMiddleware);

app.use('*', async (c, next) => {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
  await next();
});

app.use('*', async (c, next) => {
  const dbUrl = c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL || process.env.DATABASE_URL;
  
  if (dbUrl) {
    const { prisma, pool } = initializePrisma(dbUrl);
    c.set('prisma', prisma);
    
    await next();

    if (pool) {
      let waitUntilFn: ((p: Promise<unknown>) => void) | undefined = undefined;
      
      try {
        const execCtx = c.executionCtx;
        if (execCtx && typeof execCtx.waitUntil === 'function') {
          waitUntilFn = execCtx.waitUntil;
        }
      } catch (e) {
        // ignore ExecutionContext error in test environment
      }

      if (!waitUntilFn && c.env && typeof (c.env as any).waitUntil === 'function') {
        waitUntilFn = (c.env as any).waitUntil;
      }

      if (waitUntilFn) {
        waitUntilFn(pool.end());
      } else {
        // Run asynchronously in Node
        pool.end().catch((err) => logger.error('Error closing pool', err));
      }
    }
  } else {
    await next();
  }
});

// Basic health and control routes
app.get('/', (c) => c.json({ status: 'ok', runtime: 'edge/hono' }));
app.get('/favicon.ico', (c) => c.body(null, 204));

// Application routes
app.route('/', routes);

// Central error handler
app.onError(errorHandler);

export default {
  fetch: app.fetch,
  async scheduled(_event: unknown, env: Bindings, ctx: { waitUntil: (p: Promise<unknown>) => void }) {
    logger.info('Running daily cron job for job expiration...');
    const dbUrl = env?.HYPERDRIVE?.connectionString || env?.DATABASE_URL;
    
    if (dbUrl) {
      const { prisma, pool } = initializePrisma(dbUrl);
      
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      try {
        const result = await prisma.job.updateMany({
          where: {
            isActive: true,
            createdAt: { lt: ninetyDaysAgo }
          },
          data: { isActive: false }
        });
        logger.info(`Deactivated ${result.count} expired jobs.`);
      } catch (error) {
        logger.error('Error running cron job:', error);
      } finally {
        if (pool) {
          ctx.waitUntil(pool.end());
        }
      }
    }
  }
};
