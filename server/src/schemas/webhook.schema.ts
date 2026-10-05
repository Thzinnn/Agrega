import { z } from 'zod';
import { ingestJobItemSchema } from './job.schema.js';

export const webhookCreateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100),
  event: z.string().default('job.upsert'),
  isActive: z.boolean().default(true),
});

export const webhookUpdateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100).optional(),
  event: z.string().optional(),
  isActive: z.boolean().optional(),
});

// O payload esperado no momento de Receive
export const webhookPayloadSchema = z.object({
  event: z.string(),
  jobs: z.array(ingestJobItemSchema)
});
