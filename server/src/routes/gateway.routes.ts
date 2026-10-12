import { Hono, Context, Next } from 'hono';
import { gatewayController } from '../controllers/gateway.controller.js';

export const gatewayRoutes = new Hono();

/**
 * Middleware de Autenticação Unificada para Parceiros, Scrapers e Bots
 * Valida a chave através do header 'x-api-key' ou 'Authorization: Bearer <token>'
 * Se nenhuma chave estiver configurada no ambiente (dev/test), o acesso é livre.
 */
const partnerAuthMiddleware = async (c: Context, next: Next) => {
  const expectedKey =
    c.env?.GATEWAY_API_KEY ||
    process.env.GATEWAY_API_KEY ||
    c.env?.SCRAPER_API_KEY ||
    process.env.SCRAPER_API_KEY;

  if (!expectedKey) {
    return await next();
  }

  const apiKey =
    c.req.header('x-api-key') ||
    c.req.header('authorization')?.replace('Bearer ', '');

  if (apiKey !== expectedKey) {
    return c.json(
      {
        success: false,
        message: 'Acesso negado: forneça uma x-api-key válida para o Gateway de Ingestão',
      },
      401
    );
  }

  return await next();
};

// ==========================================
// ENDPOINT UNIVERSAL DE INGESTÃO POLIMÓRFICA
// ==========================================
// POST /ingest - Recebe IMAGE, TEXT_JOBS ou RAW_TEXT com roteamento automático
gatewayRoutes.post(
  '/ingest',
  partnerAuthMiddleware,
  gatewayController.ingest.bind(gatewayController)
);

// ==========================================
// ENDPOINTS DE TELEMETRIA, MÉTRICAS E TRACES
// ==========================================
// GET /metrics - Status do traffic load balancer, conexões em voo e latência média
gatewayRoutes.get(
  '/metrics',
  gatewayController.getMetrics.bind(gatewayController)
);

// GET /traces - Consulta do buffer circular de auditoria por traceId ou status
gatewayRoutes.get(
  '/traces',
  gatewayController.getTraces.bind(gatewayController)
);
