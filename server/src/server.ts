import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = serve({
  fetch: app.fetch,
  port: env.PORT,
}, (info) => {
  console.log(`🚀 Servidor rodando com sucesso em http://localhost:${info.port}`);
  console.log(`📡 Endpoints disponíveis:`);
  console.log(`   - GET  http://localhost:${info.port}/health`);
  console.log(`   - GET  http://localhost:${info.port}/api/v1/jobs`);
  console.log(`   - GET  http://localhost:${info.port}/api/v1/jobs/:id`);
  console.log(`   - POST http://localhost:${info.port}/api/v1/jobs`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor graciosamente...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      console.log('🔌 Conexão com o banco Prisma desconectada.');
      process.exit(0);
    } catch (err) {
      console.error('Erro ao desconectar Prisma:', err);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
