import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initializePrisma } from './lib/prisma.js';
import { PrismaClient } from '@prisma/client';

type Bindings = {
  HYPERDRIVE?: { connectionString: string };
  DATABASE_URL?: string;
  JWT_SECRET?: string;
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

app.use('*', async (c, next) => {
  const dbUrl = c.env?.HYPERDRIVE?.connectionString || c.env?.DATABASE_URL || process.env.DATABASE_URL;
  
  if (dbUrl) {
    const { prisma, pool } = initializePrisma(dbUrl);
    c.set('prisma', prisma);
    
    await next();

    if (pool) {
      const execCtx = c.executionCtx || c.env as unknown as { waitUntil?: (p: Promise<unknown>) => void };
      if (execCtx && 'waitUntil' in execCtx && typeof execCtx.waitUntil === 'function') {
        execCtx.waitUntil(pool.end());
      } else {
        // Run asynchronously in Node
        pool.end().catch(console.error);
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
    console.log('Running daily cron job for job expiration...');
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
        console.log(`Deactivated ${result.count} expired jobs.`);
      } catch (error) {
        console.error('Error running cron job:', error);
      } finally {
        if (pool) {
          ctx.waitUntil(pool.end());
        }
      }
    }
  }
};
