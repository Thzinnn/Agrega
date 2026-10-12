import { z } from 'zod';

export const providerTypeSchema = z.enum(['groq', 'gemini']);
export type ProviderType = z.infer<typeof providerTypeSchema>;

export const keyHealthStatusSchema = z.enum(['HEALTHY', 'COOLDOWN', 'EXHAUSTED', 'DISABLED']);
export type KeyHealthStatus = z.infer<typeof keyHealthStatusSchema>;

export const managedAiKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  provider: providerTypeSchema,
  maskedKey: z.string(),
  status: keyHealthStatusSchema,
  consecutiveFailures: z.number().int().nonnegative(),
  totalRequests: z.number().int().nonnegative(),
  totalSuccess: z.number().int().nonnegative(),
  totalRateLimits: z.number().int().nonnegative(),
  cooldownUntil: z.number().nonnegative(),
  activeInflight: z.number().int().nonnegative(),
  lastUsedAt: z.number().nullable(),
  avgLatencyMs: z.number().nonnegative(),
});

export type ManagedAiKey = z.infer<typeof managedAiKeySchema>;

export interface KeyReleaseResult {
  success: boolean;
  statusCode?: number;
  retryAfterSeconds?: number;
  latencyMs?: number;
  error?: string;
}

export const aiPoolStatusSchema = z.object({
  totalKeys: z.number().int().nonnegative(),
  healthyKeys: z.number().int().nonnegative(),
  cooldownKeys: z.number().int().nonnegative(),
  exhaustedKeys: z.number().int().nonnegative(),
  recommendedConcurrency: z.number().int().positive(),
  keys: z.array(managedAiKeySchema),
});

export type AiPoolStatus = z.infer<typeof aiPoolStatusSchema>;
