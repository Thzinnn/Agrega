import { Request, Response, NextFunction } from 'express';
import { jobService } from '../services/job.service.js';
import { CreateJobInput, JobQueryInput, JobIdParam } from '../schemas/job.schema.js';

export class JobController {
  async listJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as unknown as JobQueryInput;
      const result = await jobService.listJobs(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as unknown as JobIdParam;
      const job = await jobService.getJobById(id);
      res.status(200).json({ data: job });
    } catch (error) {
      next(error);
    }
  }

  async createJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as CreateJobInput;
      const createdJob = await jobService.createJob(body);
      res.status(201).json({
        success: true,
        data: createdJob,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const jobController = new JobController();
