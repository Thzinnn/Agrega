import { Context } from 'hono';
import { jobService } from '../services/job.service.js';
import { CreateJobInput, JobQueryInput, JobIdParam } from '../schemas/job.schema.js';
import { PrismaClient } from '@prisma/client';

export class JobController {
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
    const body = c.get('valid_body') as CreateJobInput;
    const createdJob = await jobService.createJob(prisma, body);
    return c.json({
      success: true,
      data: createdJob,
    }, 201);
  }
}

export const jobController = new JobController();
