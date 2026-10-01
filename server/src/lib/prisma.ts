import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Cache global para reutilizar conexões entre requisições em serverless/edge
let cachedPrisma: PrismaClient | null = null;
let cachedPool: Pool | null = null;

export function initializePrisma(connectionString?: string): { prisma: PrismaClient, pool: Pool } {
  // Se já temos a instância cacheadas, reaproveita
  if (cachedPrisma && cachedPool) {
    return { prisma: cachedPrisma, pool: cachedPool };
  }

  const dbUrl = connectionString || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    throw new Error('Database connection string is required (via env.HYPERDRIVE or DATABASE_URL)');
  }

  const pool = new Pool({ 
    connectionString: dbUrl,
    // Timers recomendados para ambientes serverless
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    max: 10, // Limite conservador de conexões por isolate
  });

  // PREVINE CRASHES: O Hyperdrive ou a infraestrutura serverless pode fechar conexões ociosas.
  // Se não tratarmos os eventos 'error' do pool, o 'pg' lançará uma exceção não tratada e dará crash no Worker.
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    // Não precisamos fazer nada, o 'pg' vai descartar a conexão e criar uma nova quando necessário.
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ? ['query', 'error', 'warn'] : ['error'],
  });

  cachedPrisma = prisma;
  cachedPool = pool;

  return { prisma, pool };
}
