import {
  ScraperAuditItem,
  AuditLogQueryParams,
  ScraperAuditResponse,
} from '../schemas/scraper-raw.schema.js';
import { logger } from '../utils/logger.js';

export class ScraperAuditService {
  private buffer: ScraperAuditItem[] = [];
  private readonly maxBufferSize: number = 500;

  /**
   * Registra um evento na trilha de auditoria e emite log estruturado
   */
  log(event: Omit<ScraperAuditItem, 'id' | 'timestamp'>): ScraperAuditItem {
    const item: ScraperAuditItem = {
      ...event,
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };

    // Buffer circular
    this.buffer.unshift(item);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.length = this.maxBufferSize;
    }

    // Emissão em log estruturado para stdout (Datadog / Cloudflare / Bots)
    const logContext: Record<string, unknown> = {
      traceId: item.traceId,
      stage: item.stage,
      status: item.status,
      fileName: item.fileName,
      contentType: item.contentType,
      latencyMs: item.latencyMs,
      jobId: item.jobId,
      discardReason: item.discardReason,
      providerUsed: item.providerUsed,
    };

    if (item.status === 'FAILED') {
      logger.error(`[ScraperAudit] ${item.stage} -> ${item.details}`, undefined, logContext);
    } else if (item.status === 'DISCARDED') {
      logger.warn(`[ScraperAudit] ${item.stage} -> ${item.details}`, logContext);
    } else {
      logger.info(`[ScraperAudit] ${item.stage} -> ${item.details}`, logContext);
    }

    return item;
  }

  /**
   * Consulta os logs com filtros estruturados e cálculo de métricas
   */
  query(params: Partial<AuditLogQueryParams> = {}): ScraperAuditResponse {
    let filtered = [...this.buffer];

    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((i) => i.status === params.status);
    }

    if (params.stage) {
      filtered = filtered.filter((i) => i.stage === params.stage);
    }

    if (params.traceId) {
      filtered = filtered.filter((i) => i.traceId === params.traceId);
    }

    const total = filtered.length;
    const paginated = filtered.slice(0, params.limit || 50);

    const totalReceived = this.buffer.filter((i) => i.stage === 'RECEIVED').length || this.buffer.length;
    const processedCount = this.buffer.filter((i) => i.status === 'PROCESSED').length;
    const discardedCount = this.buffer.filter((i) => i.status === 'DISCARDED').length;
    const failedCount = this.buffer.filter((i) => i.status === 'FAILED').length;

    const latencies = this.buffer
      .filter((i) => typeof i.latencyMs === 'number' && i.latencyMs > 0)
      .map((i) => i.latencyMs as number);

    const avgLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((acc, cur) => acc + cur, 0) / latencies.length)
      : 0;

    const successRatePercent = totalReceived > 0
      ? Math.round((processedCount / totalReceived) * 100)
      : 100;

    return {
      success: true,
      total,
      metrics: {
        totalReceived,
        processedCount,
        discardedCount,
        failedCount,
        successRatePercent,
        avgLatencyMs,
      },
      logs: paginated,
    };
  }

  /**
   * Limpa os logs em memória (para testes)
   */
  clear(): void {
    this.buffer = [];
  }
}

export const scraperAuditService = new ScraperAuditService();
