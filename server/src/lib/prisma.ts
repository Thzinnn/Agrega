import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { logger } from '../utils/logger.js';
/**
 * Gerenciador de Conexão (DB Pool) para Cloudflare Workers / Serverless
 * Por que foi feito: Bancos relacionais tradicionais (PostgreSQL) morrem se receberem
 * milhares de conexões diretas (ex: uma conexão por request no Cloudflare).
 * Como mitiga: Instanciamos um Connection Pooler (`pg`) associado ao adaptador `@prisma/adapter-pg`.
 * Isso reaproveita conexões abertas no ciclo de vida do Worker, 
 * diminuindo drasticamente a latência TCP/SSL Handshake.
 */
export function initializePrisma(connectionString?: string): { prisma: PrismaClient, pool: Pool } {
  const dbUrl = connectionString || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    throw new Error('Database connection string is required (via env.HYPERDRIVE or DATABASE_URL)');
  }

  const pool = new Pool({ 
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
  });

  // PREVINE CRASHES se a conexão ociosa for derrubada antes do término
  pool.on('error', (err) => {
    logger.error('Ignored pool error:', err.message);
  });

  const adapter = new PrismaPg(pool);

  const prisma = new PrismaClient({
    adapter,
    log: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ? ['query', 'error', 'warn'] : ['error'],
  });

  return { prisma, pool };
}
