import { Context } from 'hono';
import { jobService } from '../services/job.service.js';
import { logger } from '../utils/logger.js';
import { CreateJobInput, CreatePublicJobInput, JobQueryInput, JobIdParam, ingestJobItemSchema, IngestJobItem } from '../schemas/job.schema.js';
import { PrismaClient, Prisma } from '@prisma/client';

export class JobController {
  async getSchema(c: Context) {
    try {
      const prisma = c.get('prisma') as PrismaClient;
      const schema = await jobService.getSchema(prisma);
      return c.json({ success: true, data: schema }, 200);
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        return c.json({ success: false, message: error.message }, (error as any).statusCode);
      }
      logger.error('Error fetching schema:', error);
      return c.json({ success: false, message: 'Failed to fetch schema' }, 500);
    }
  }

  async listJobs(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const query = c.get('valid_query') as JobQueryInput;
    const result = await jobService.listJobs(prisma, query);
    return c.json(result, 200);
  }

  async getJobById(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const { id } = c.get('valid_param') as JobIdParam;
    const job = await jobService.getJobById(prisma, id);
    return c.json({ data: job }, 200);
  }

  async createJob(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const rawBody = c.get('valid_body');
    const body = rawBody as CreatePublicJobInput;

    // Validate Turnstile Token
    const token = body.turnstileToken;
    const secretKey = c.env?.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY || 'dummy-secret-for-tests';
    
    /**
     * Validação contra Botnets (Cloudflare Turnstile)
     * Por que foi feito: O formulário de "Nova Vaga" é público. Isso permite que bots de spam
     * saturem o banco de dados com lixo eletrônico rapidamente se automatizados (DDoS L7).
     * Como mitiga: O Front-end gera um token usando hardware telemetrics/PoW (sem CAPTCHA visual). 
     * O Back-end, de forma assíncrona, faz uma chamada server-to-server até o Cloudflare 
     * verificando se aquele token é autêntico, garantindo que foi um humano que preencheu.
     */
    // Skip verification ONLY if we are in testing mode and there is a specific test secret, 
    // or properly test against Cloudflare if real token is provided.
    // For local tests where we don't hit Cloudflare, we can mock it by accepting a dummy token.
    if (process.env.NODE_ENV !== 'test' || token !== 'test-valid-token') {
      try {
        const formData = new URLSearchParams();
        formData.append('secret', secretKey);
        formData.append('response', token);
        
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST',
          body: formData,
        });
        
        const verifyData = await verifyRes.json() as { success: boolean };
        if (!verifyData.success) {
          return c.json({ success: false, message: 'Falha na verificação de segurança' }, 403);
        }
      } catch (err) {
        return c.json({ success: false, message: 'Erro ao validar token de segurança' }, 500);
      }
    }

    /**
     * Sanitização Forte (Remediação TEST-01)
     * Além da validação via Zod (`createPublicJobSchema`), explicitamente forçamos valores 
     * internos (MANUAL) antes de salvar no prisma, blindando 100% contra Mass Assignment.
     */
    const { turnstileToken, ...jobData } = body;
    
    const finalJobData: CreateJobInput = {
      ...jobData,
      source: 'MANUAL',
      isActive: true,
    };

    const createdJob = await jobService.createJob(prisma, finalJobData);
    return c.json({
      success: true,
      data: createdJob,
    }, 201);
  }

  async incrementClick(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const { id } = c.get('valid_param') as JobIdParam;
    await jobService.incrementClick(prisma, id);
    return c.json({ success: true }, 200);
  }

  async getColumns(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const columns = await prisma.jobCustomColumn.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return c.json({ success: true, data: columns }, 200);
  }
  async ingestJobs(c: Context) {
    const apiKey = c.req.header('x-api-key');
    const expectedKey = c.env?.SCRAPER_API_KEY || process.env.SCRAPER_API_KEY;

    if (!expectedKey || apiKey !== expectedKey) {
      return c.json({ success: false, message: 'Unauthorized' }, 401);
    }

    const prisma = c.get('prisma') as PrismaClient;
    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    // Extract items whether it's an array, an object with 'jobs' array, or a single object
    let rawItems: any[] = [];
    if (Array.isArray(body)) {
      rawItems = body;
    } else if (body && Array.isArray(body.jobs)) {
      rawItems = body.jobs;
    } else if (body && typeof body === 'object') {
      rawItems = [body];
    } else {
      return c.json({ success: false, message: 'Invalid payload format' }, 400);
    }

    const validItems: IngestJobItem[] = [];
    
    for (const item of rawItems) {
      const parsed = ingestJobItemSchema.safeParse(item);
      if (parsed.success) {
        validItems.push(parsed.data);
      }
    }

    if (validItems.length === 0) {
      return c.json({ success: false, message: 'No valid jobs found in payload' }, 400);
    }

    try {
      const result = await jobService.ingestJobs(prisma, validItems);
      return c.json(result, 201);
    } catch (error) {
      logger.error('Ingest error:', error);
      return c.json({ success: false, message: 'Failed to process jobs' }, 500);
    }
  }
}

export const jobController = new JobController();
