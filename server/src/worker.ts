import serverlessExpress from '@codegenie/serverless-express';
import { app } from './app.js';
import { initializePrisma } from './lib/prisma.js';

let serverlessExpressInstance: any;

export default {
  async fetch(request: Request, env: any, ctx: any): Promise<Response> {
    // Configura o Prisma com a connection string do Hyperdrive, se disponível em ambiente de produção/worker
    if (env?.HYPERDRIVE?.connectionString) {
      initializePrisma(env.HYPERDRIVE.connectionString);
    } else {
      // Fallback para variáveis de ambiente locais/dev
      initializePrisma();
    }

    if (!serverlessExpressInstance) {
      // Encapsula o app Express existente
      serverlessExpressInstance = serverlessExpress({ app });
    }

    // Passa o controle para o handler gerado pelo serverless-express
    // Nota: Dependendo da versão e configuração, pode ser necessário um event source mapping 
    // ou transformar a Request do Fetch API em um evento suportado.
    return serverlessExpressInstance(request, ctx);
  }
};
