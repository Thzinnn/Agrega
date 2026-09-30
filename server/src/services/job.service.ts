import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { CreateJobInput, JobQueryInput } from '../schemas/job.schema.js';
import { AppError } from '../errors/AppError.js';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    totalPages: number;
    limit: number;
  };
}

export class JobService {
  async listJobs(query: JobQueryInput): Promise<PaginatedResult<Prisma.JobGetPayload<object>>> {
    const {
      q,
      location,
      workplaceType,
      education,
      contractType,
      minSalary,
      maxSalary,
      hasSalary,
      page = 1,
      limit = 10,
      orderBy = 'recent',
    } = query;

    const where: Prisma.JobWhereInput = {
      isActive: true,
    };

    const andConditions: Prisma.JobWhereInput[] = [];

    // Text search in title, company or description
    if (q && q.trim().length > 0) {
      const searchTerm = q.trim();
      andConditions.push({
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { company: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
        ],
      });
    }

    // Location search
    if (location && location.trim().length > 0) {
      andConditions.push({
        location: { contains: location.trim(), mode: 'insensitive' },
      });
    }

    // Workplace types (e.g. REMOTE, HYBRID, ON_SITE)
    if (workplaceType && workplaceType.length > 0) {
      andConditions.push({
        workplaceType: { in: workplaceType },
      });
    }

    // Education level
    if (education && education.length > 0) {
      andConditions.push({
        education: { in: education },
      });
    }

    // Contract type (e.g. CLT, PJ, OTHER)
    if (contractType && contractType.length > 0) {
      andConditions.push({
        contractType: { in: contractType },
      });
    }

    // Salary filters - Range (minSalary / maxSalary)
    if (minSalary !== undefined) {
      andConditions.push({
        OR: [
          { salary: { gte: minSalary } },
          { salaryMax: { gte: minSalary } },
          { AND: [{ salaryMax: null, salary: null }, { salaryMin: { gte: minSalary } }] },
        ],
      });
    }

    if (maxSalary !== undefined) {
      andConditions.push({
        OR: [
          { salary: { lte: maxSalary } },
          { salaryMin: { lte: maxSalary } },
          { AND: [{ salaryMin: null, salary: null }, { salaryMax: { lte: maxSalary } }] },
        ],
      });
    }

    // Salary filter - Existence
    if (hasSalary === true) {
      andConditions.push({
        OR: [
          { salary: { not: null } },
          { salaryMin: { not: null } },
          { salaryMax: { not: null } },
        ],
      });
    } else if (hasSalary === false) {
      andConditions.push({
        salary: null,
        salaryMin: null,
        salaryMax: null,
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const total = await prisma.job.count({ where });
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    let orderCriteria: Prisma.JobOrderByWithRelationInput = { createdAt: 'desc' };
    if (orderBy === 'recent') {
      orderCriteria = { createdAt: 'desc' };
    }

    const jobs = await prisma.job.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderCriteria,
    });

    return {
      data: jobs,
      meta: {
        total,
        page,
        totalPages,
        limit,
      },
    };
  }

  async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || !job.isActive) {
      throw new AppError('Vaga não encontrada', 404);
    }

    return job;
  }

  async createJob(data: CreateJobInput) {
    const createdJob = await prisma.job.create({
      data: {
        title: data.title,
        company: data.company,
        description: data.description,
        location: data.location,
        workplaceType: data.workplaceType,
        education: data.education,
        requirements: data.requirements ?? [],
        contractType: data.contractType,
        benefits: data.benefits ?? null,
        hasVA: data.hasVA ?? false,
        hasVR: data.hasVR ?? false,
        hasVT: data.hasVT ?? false,
        hasLifeInsurance: data.hasLifeInsurance ?? false,
        hasMedicalInsurance: data.hasMedicalInsurance ?? false,
        hasDentalInsurance: data.hasDentalInsurance ?? false,
        salary: data.salary ?? null,
        salaryMin: data.salaryMin ?? null,
        salaryMax: data.salaryMax ?? null,
        applicationUrl: data.applicationUrl ?? null,
        contactEmail: data.contactEmail ?? null,
        contactPhone: data.contactPhone ?? null,
        source: data.source ?? 'MANUAL',
        isActive: data.isActive ?? true,
      },
    });

    return createdJob;
  }
}

export const jobService = new JobService();
