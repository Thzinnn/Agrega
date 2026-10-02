import { Hono } from 'hono';
import { jobController } from '../controllers/job.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createJobSchema,
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

// POST /api/v1/jobs - Create a new job manually
jobRoutes.post(
  '/',
  validateRequest(createJobSchema, 'body'),
  jobController.createJob.bind(jobController)
);

// POST /api/v1/jobs/:id/click - Increment click count
jobRoutes.post(
  '/:id/click',
  validateRequest(jobIdParamSchema, 'param'),
  jobController.incrementClick.bind(jobController)
);
