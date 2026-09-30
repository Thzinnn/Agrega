import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { initializePrisma } from './lib/prisma.js';
import { PrismaClient } from '@prisma/client';

type Bindings = {
  HYPERDRIVE: any;
  DATABASE_URL: string;
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
  // Inicializa o Prisma usando a connection string do Hyperdrive (se no Cloudflare)
  const dbUrl = c.env?.HYPERDRIVE ? (c.env.HYPERDRIVE as { connectionString: string }).connectionString : (c.env?.DATABASE_URL as string | undefined);
  
  if (dbUrl) {
    const { prisma, pool } = initializePrisma(dbUrl);
    c.set('prisma', prisma);
    
    await next();
    
    // Assegura que o socket do pool seja fechado ao fim da requisição
    // para evitar TCP half-open hangs no Cloudflare Workers
    if (pool) {
      c.executionCtx.waitUntil(pool.end());
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

export default app;
