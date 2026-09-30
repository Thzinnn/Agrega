import { serve } from '@hono/node-server';
import { app } from './app.js';
import { env } from './config/env.js';

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
    console.log('🔌 Conexões do Prisma já são gerenciadas por requisição. Servidor encerrado.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
