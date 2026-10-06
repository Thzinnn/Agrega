import { PrismaClient } from '@prisma/client';
import { jobService } from './job.service.js';

export type WebhookHandlerResult = {
  received: number;
  processed: number;
  rejected: Array<{ index: number; reason: string }>;
};

type WebhookHandler = (prisma: PrismaClient, data: any) => Promise<WebhookHandlerResult>;

async function handleJobUpsert(prisma: PrismaClient, data: any): Promise<WebhookHandlerResult> {
  const jobs = Array.isArray(data) ? data : data.jobs || [];
  
  const result: WebhookHandlerResult = {
    received: jobs.length,
    processed: 0,
    rejected: []
  };

  if (jobs.length === 0) {
    return result;
  }

  try {
    const ingestResult = await jobService.ingestJobs(prisma, jobs);
    result.processed = ingestResult.processed;
    result.rejected = ingestResult.rejected || [];
  } catch (error: any) {
    result.rejected.push({ index: -1, reason: error.message || 'Unknown error' });
  }

  return result;
}

export const webhookHandlers: Record<string, WebhookHandler> = {
  'job.upsert': handleJobUpsert,
};
