import { Hono, Context, Next } from 'hono';
import { scraperRawController } from '../controllers/scraper-raw.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  rawImageIngestSchema,
  auditLogQuerySchema,
} from '../schemas/scraper-raw.schema.js';

export const scraperRawRoutes = new Hono();

/**
 * Middleware de Autenticação para Parceiros e Bots Externos
 * Permite acesso se SCRAPER_API_KEY bater com o header x-api-key,
 * ou em ambiente de desenvolvimento/teste se nenhuma chave for estipulada.
 */
const partnerAuthMiddleware = async (c: Context, next: Next) => {
  const expectedKey = c.env?.SCRAPER_API_KEY || process.env.SCRAPER_API_KEY;
  if (!expectedKey) {
    return await next();
  }
  const apiKey = c.req.header('x-api-key') || c.req.header('authorization')?.replace('Bearer ', '');
  if (apiKey !== expectedKey) {
    return c.json(
      {
        success: false,
        message: 'Acesso negado: forneça uma x-api-key válida para a API de ingestão bruta',
      },
      401
    );
  }
  return await next();
};

// ==========================================
// ROTAS DE INGESTÃO BRUTA PARA PARCEIROS
// ==========================================

// POST /analyze - Envio de imagem bruta via JSON (Base64 ou URL)
scraperRawRoutes.post(
  '/analyze',
  partnerAuthMiddleware,
  validateRequest(rawImageIngestSchema, 'body'),
  scraperRawController.analyzeRaw.bind(scraperRawController)
);

// POST /upload - Envio de imagem bruta via Multipart/form-data (arquivo binário)
scraperRawRoutes.post(
  '/upload',
  partnerAuthMiddleware,
  scraperRawController.uploadRaw.bind(scraperRawController)
);

// ==========================================
// ROTAS DE AUDITORIA E SUPERVISÃO (BOTS / IA / ADMIN)
// ==========================================

// GET /audit-logs - Consulta trilha de logs e eventos estruturados
scraperRawRoutes.get(
  '/audit-logs',
  validateRequest(auditLogQuerySchema, 'query'),
  scraperRawController.getAuditLogs.bind(scraperRawController)
);

// GET /metrics - Métricas consolidadas de ingestão e balanceamento
scraperRawRoutes.get(
  '/metrics',
  scraperRawController.getMetrics.bind(scraperRawController)
);
