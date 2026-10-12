import { z } from 'zod';
import { contentTypeEnum } from '../scraper/types.js';

export const auditStageEnum = z.enum([
  'RECEIVED',
  'TRIAGE',
  'OCR_BALANCER',
  'VALIDATE',
  'INGEST',
  'DISCARD',
  'FAILOVER',
  'ERROR',
]);

export type AuditStage = z.infer<typeof auditStageEnum>;

export const auditStatusEnum = z.enum([
  'PROCESSED',
  'DISCARDED',
  'FAILED',
  'PENDING',
]);

export type AuditStatus = z.infer<typeof auditStatusEnum>;

/**
 * Schema de entrada para parceiros enviarem dados brutos em JSON
 */
export const rawImageIngestSchema = z
  .object({
    imageUrl: z.string().url('URL da imagem inválida').optional(),
    imageBase64: z.string().min(20, 'Base64 muito curto ou inválido').optional(),
    fileName: z.string().optional(),
    directPublish: z.boolean().default(true),
    metadata: z.record(z.string()).optional(),
  })
  .refine((data) => !!data.imageUrl || !!data.imageBase64, {
    message: 'É necessário fornecer imageUrl ou imageBase64 para análise',
  });

export type RawImageIngestPayload = z.infer<typeof rawImageIngestSchema>;

/**
 * Filtros de busca para logs de auditoria (Supervisor Bots / IA / Admin)
 */
export const auditLogQuerySchema = z.object({
  status: z.enum(['ALL', 'PROCESSED', 'DISCARDED', 'FAILED']).default('ALL'),
  stage: auditStageEnum.optional(),
  traceId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(50),
});

export type AuditLogQueryParams = z.infer<typeof auditLogQuerySchema>;

/**
 * Evento individual gravado na trilha de auditoria
 */
export const scraperAuditItemSchema = z.object({
  id: z.string(),
  traceId: z.string(),
  timestamp: z.string(),
  stage: auditStageEnum,
  status: auditStatusEnum,
  fileName: z.string(),
  contentType: contentTypeEnum.optional(),
  details: z.string(),
  latencyMs: z.number().optional(),
  jobId: z.string().optional(),
  discardReason: z.string().optional(),
  providerUsed: z.string().optional(),
});

export type ScraperAuditItem = z.infer<typeof scraperAuditItemSchema>;

/**
 * Resposta formatada para o painel de auditoria
 */
export const scraperAuditResponseSchema = z.object({
  success: z.boolean(),
  total: z.number(),
  metrics: z.object({
    totalReceived: z.number(),
    processedCount: z.number(),
    discardedCount: z.number(),
    failedCount: z.number(),
    successRatePercent: z.number(),
    avgLatencyMs: z.number(),
  }),
  logs: z.array(scraperAuditItemSchema),
});

export type ScraperAuditResponse = z.infer<typeof scraperAuditResponseSchema>;
