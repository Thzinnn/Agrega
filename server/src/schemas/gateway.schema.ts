import { z } from 'zod';
import { ingestJobItemSchema } from './job.schema.js';

/**
 * 1. Payload de Imagem (WhatsApp / Panfletos / Redes Sociais)
 */
export const gatewayImagePayloadSchema = z.object({
  kind: z.literal('IMAGE'),
  source: z.string().default('WHATSAPP_MEDIA'),
  imageUrl: z.string().url('URL da imagem inválida').optional(),
  imageBase64: z.string().min(20, 'Base64 da imagem muito curto').optional(),
  fileName: z.string().optional(),
  directPublish: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type GatewayImagePayload = z.infer<typeof gatewayImagePayloadSchema>;

/**
 * 2. Payload de Vagas Estruturadas em Lote (Indeed, Gupy, LinkedIn, PATs)
 */
export const gatewayTextJobsPayloadSchema = z.object({
  kind: z.literal('TEXT_JOBS'),
  source: z.string().default('INDEED'),
  jobs: z.array(ingestJobItemSchema).min(1, 'Array de vagas não pode estar vazio'),
  directPublish: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type GatewayTextJobsPayload = z.infer<typeof gatewayTextJobsPayloadSchema>;

/**
 * 3. Payload de Texto Bruto (Mensagens cruas de texto de grupos do WhatsApp)
 */
export const gatewayRawTextPayloadSchema = z.object({
  kind: z.literal('RAW_TEXT'),
  source: z.string().default('WHATSAPP_TEXT'),
  rawText: z.string().min(10, 'Texto bruto muito curto para conter uma vaga'),
  contactPhone: z.string().optional(),
  originGroup: z.string().optional(),
  directPublish: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type GatewayRawTextPayload = z.infer<typeof gatewayRawTextPayloadSchema>;

/**
 * Envelope Mestre Polimórfico Discriminado
 */
export const gatewayIngestEnvelopeSchema = z
  .discriminatedUnion('kind', [
    gatewayImagePayloadSchema,
    gatewayTextJobsPayloadSchema,
    gatewayRawTextPayloadSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.kind === 'IMAGE' && !data.imageUrl && !data.imageBase64) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'imageUrl ou imageBase64 é obrigatório para kind=IMAGE',
        path: ['imageBase64'],
      });
    }
  });

export type GatewayIngestPayload = z.infer<typeof gatewayIngestEnvelopeSchema>;

/**
 * Schema de resposta padronizada do Gateway Universal
 */
export const gatewaySummarySchema = z.object({
  received: z.number(),
  processed: z.number(),
  discarded: z.number(),
  duplicatesSkipped: z.number(),
  publishedToSite: z.boolean(),
});

export const gatewayResponseSchema = z.object({
  success: z.boolean(),
  gatewayTraceId: z.string(),
  kind: z.enum(['IMAGE', 'TEXT_JOBS', 'RAW_TEXT']),
  source: z.string(),
  status: z.enum(['PROCESSED', 'DISCARDED', 'PARTIAL', 'FAILED']),
  summary: gatewaySummarySchema,
  data: z.unknown().optional(),
  discardReason: z.string().optional(),
  metrics: z.object({
    queueLatencyMs: z.number(),
    executionDurationMs: z.number(),
  }),
});

export type GatewayResponse = z.infer<typeof gatewayResponseSchema>;
