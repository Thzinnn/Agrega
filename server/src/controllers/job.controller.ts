import { Context } from 'hono';
import { jobService } from '../services/job.service.js';
import { CreateJobInput, JobQueryInput, JobIdParam } from '../schemas/job.schema.js';

export class JobController {
  async listJobs(c: Context) {
    const query = c.get('valid_query') as JobQueryInput;
    const result = await jobService.listJobs(query);
    return c.json(result, 200);
  }

  async getJobById(c: Context) {
    const { id } = c.get('valid_param') as JobIdParam;
    const job = await jobService.getJobById(id);
    return c.json({ data: job }, 200);
  }

  async createJob(c: Context) {
    const body = c.get('valid_body') as CreateJobInput;
    const createdJob = await jobService.createJob(body);
    return c.json({
      success: true,
      data: createdJob,
    }, 201);
  }
}

export const jobController = new JobController();
