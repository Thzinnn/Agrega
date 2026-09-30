import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | undefined;

export function initializePrisma(connectionString?: string): PrismaClient {
  if (globalThis.prismaGlobal) {
    prismaInstance = globalThis.prismaGlobal;
    return prismaInstance;
  }

  if (prismaInstance) {
    return prismaInstance;
  }

  // Fallback to process.env.DATABASE_URL if no connection string is provided
  // In Cloudflare Workers environment, process.env might not be populated natively
  const dbUrl = connectionString || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined);

  if (!dbUrl) {
    throw new Error('Database connection string is required (via env.HYPERDRIVE or DATABASE_URL)');
  }

  const pool = new Pool({ connectionString: dbUrl });
  const adapter = new PrismaPg(pool);

  prismaInstance = new PrismaClient({
    adapter,
    log: (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') ? ['query', 'error', 'warn'] : ['error'],
  });

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    globalThis.prismaGlobal = prismaInstance;
  }

  return prismaInstance;
}

// Export a proxy to maintain compatibility with existing controllers and services
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!prismaInstance) {
      initializePrisma();
    }
    return (prismaInstance as any)[prop];
  },
});
