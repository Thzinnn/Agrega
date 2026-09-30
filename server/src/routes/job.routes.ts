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

// POST /api/v1/jobs - Create a new job manually
jobRoutes.post(
  '/',
  validateRequest(createJobSchema, 'body'),
  jobController.createJob.bind(jobController)
);
