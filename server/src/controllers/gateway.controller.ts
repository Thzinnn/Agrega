import { Context } from 'hono';
import { PrismaClient } from '@prisma/client';
import {
  gatewayIngestEnvelopeSchema,
  GatewayIngestPayload,
} from '../schemas/gateway.schema.js';
import { gatewayDispatcher } from '../services/gateway-dispatcher.service.js';
import { trafficLimiter, TrafficOverloadedError } from '../services/traffic-limiter.service.js';
import { scraperAuditService } from '../services/scraper-audit.service.js';
import { auditLogQuerySchema } from '../schemas/scraper-raw.schema.js';
import { logger } from '../utils/logger.js';

export class GatewayController {
  /**
   * Ponto de entrada universal do Gateway para qualquer scraper ou parceiro
   */
  async ingest(c: Context): Promise<Response> {
    let rawBody: unknown;
    try {
      rawBody = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          message: 'Payload inválido: corpo da requisição deve ser um JSON válido',
        },
        400
      );
    }

    const parseResult = gatewayIngestEnvelopeSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return c.json(
        {
          success: false,
          message: 'Formato de envelope inválido',
          errors: parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
        },
        400
      );
    }

    const payload: GatewayIngestPayload = parseResult.data;
    const prisma = c.get('prisma') as PrismaClient;

    try {
      const response = await gatewayDispatcher.dispatch(prisma, payload);
      const httpStatus = response.status === 'PROCESSED' ? 200 : 202;
      return c.json(response, httpStatus);
    } catch (err: unknown) {
      if (err instanceof TrafficOverloadedError) {
        c.header('Retry-After', '3');
        return c.json(
          {
            success: false,
            message: err.message,
            status: 'RATE_LIMITED',
          },
          429
        );
      }

      const msg = err instanceof Error ? err.message : String(err);
      logger.error('[GatewayController] Erro inesperado na ingestão:', err);
      return c.json(
        {
          success: false,
          message: `Falha no processamento do gateway: ${msg}`,
          status: 'FAILED',
        },
        500
      );
    }
  }

  /**
   * Métricas unificadas de tráfego, concorrência e auditoria
   */
  async getMetrics(c: Context): Promise<Response> {
    const traffic = trafficLimiter.getMetrics();
    const audit = scraperAuditService.query({ limit: 1 });

    return c.json(
      {
        success: true,
        data: {
          traffic,
          scraperMetrics: audit.metrics,
        },
      },
      200
    );
  }

  /**
   * Consulta de rastreabilidade e trilha de execução por traces
   */
  async getTraces(c: Context): Promise<Response> {
    const rawQuery = c.req.query();
    const query = auditLogQuerySchema.parse(rawQuery);
    const result = scraperAuditService.query(query);

    return c.json(
      {
        success: true,
        total: result.total,
        logs: result.logs,
      },
      200
    );
  }
}

export const gatewayController = new GatewayController();
