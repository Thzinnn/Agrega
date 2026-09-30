import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

export function initializePrisma(connectionString?: string): { prisma: PrismaClient, pool: Pool } {
  const dbUrl = connectionString || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    throw new Error('Database connection string is required (via env.HYPERDRIVE or DATABASE_URL)');
  }

  const pool = new Pool({ 
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
    query_timeout: 15000,
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ? ['query', 'error', 'warn'] : ['error'],
  });

  return { prisma, pool };
}
