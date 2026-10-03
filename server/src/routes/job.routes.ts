import { Hono } from 'hono';
import { jobController } from '../controllers/job.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { rateLimiter } from '../middlewares/rateLimiter.js';
import {
  createPublicJobSchema,
  jobQuerySchema,
  jobIdParamSchema,
} from '../schemas/job.schema.js';

export const jobRoutes = new Hono();

// GET /api/v1/jobs - List jobs with dynamic filters and pagination
// GET /api/v1/jobs/columns - Get active columns
jobRoutes.get(
  '/columns',
  jobController.getColumns.bind(jobController)
);

jobRoutes.get(
  '/',
  validateRequest(jobQuerySchema, 'query'),
  jobController.listJobs.bind(jobController)
);

// GET /api/v1/jobs/:id - Get job by ID
jobRoutes.get(
  '/:id',
  validateRequest(jobIdParamSchema, 'param'),
  jobController.getJobById.bind(jobController)
);

// POST /api/v1/jobs/ingest - Ingest jobs from external scraper
jobRoutes.post(
  '/ingest',
  jobController.ingestJobs.bind(jobController)
);

/**
 * POST /api/v1/jobs - Rota Pública de Submissão de Vagas
 * SEGURANÇA: Esta é a rota mais sensível do sistema (Formulário Aberto).
 * 1. `rateLimiter(5 requisições / minuto)`: Previne Scripts que disparam requisições infinitas e estourariam o BD.
 * 2. `validateRequest(createPublicJobSchema)`: O Zod bloqueia Mass Assignment (como `isActive: true`) e injeta Turnstile (Anti-Bot).
 */
jobRoutes.post(
  '/',
  rateLimiter({ limit: 5, windowMs: 60 * 1000 }), // 5 requests per minute per IP
  validateRequest(createPublicJobSchema, 'body'),
  jobController.createJob.bind(jobController)
);

// POST /api/v1/jobs/:id/click - Increment click count
jobRoutes.post(
  '/:id/click',
  validateRequest(jobIdParamSchema, 'param'),
  jobController.incrementClick.bind(jobController)
);
