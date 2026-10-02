import { Prisma, PrismaClient } from '@prisma/client';
import { CreateJobInput, JobQueryInput, IngestJobItem } from '../schemas/job.schema.js';
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
  async listJobs(prisma: PrismaClient, query: JobQueryInput): Promise<PaginatedResult<Prisma.JobGetPayload<object>>> {
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
      ...dynamicParams
    } = query;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const where: Prisma.JobWhereInput = {
      isActive: true,
      createdAt: {
        gte: ninetyDaysAgo,
      }
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

    Object.entries(dynamicParams).forEach(([key, val]) => {
      // Ignore technical parameters like _t (cache buster)
      if (key === '_t' || val === undefined || val === '') return;
      // split commas just in case, but validateRequest already handles array if passed as ?key=a&key=b
      let valuesArray: string[] = [];
      if (Array.isArray(val)) {
        valuesArray = val;
      } else if (typeof val === 'string') {
        valuesArray = val.split(',');
      }
      
      if (valuesArray.length > 0) {
        andConditions.push({
          OR: valuesArray.map(v => ({
            customData: {
              path: [key],
              equals: v
            }
          }))
        });
      }
    });

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

  async getJobById(prisma: PrismaClient, id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || !job.isActive) {
      throw new AppError('Vaga não encontrada', 404);
    }

    return job;
  }

  async createJob(prisma: PrismaClient, data: CreateJobInput) {
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
        customData: (data.customData ?? {}) as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    return createdJob;
  }

  async incrementClick(prisma: PrismaClient, id: string) {
    // Increment atomically
    const job = await prisma.job.update({
      where: { id },
      data: {
        clicksCount: {
          increment: 1,
        },
      },
    });
    return job;
  }

  async ingestJobs(prisma: PrismaClient, items: IngestJobItem[]) {
    let processed = 0;
    
    // Process sequentially or in batches. We use a simple loop for upsert.
    for (const item of items) {
      let parsedSalary: number | null = null;
      if (item.salario) {
        // Remove everything that is not a digit or comma (e.g. "R$ 2.500,00" -> "2500,00")
        const cleanStr = item.salario.replace(/[^\d,]/g, '');
        if (cleanStr) {
          // Replace comma with dot for valid float parsing
          const num = Number(cleanStr.replace(',', '.'));
          if (!isNaN(num) && num > 0) {
            parsedSalary = num;
          }
        }
      }

      let hasVA = false;
      let hasVR = false;
      let hasVT = false;
      let hasLifeInsurance = false;
      let hasMedicalInsurance = false;
      let hasDentalInsurance = false;
      let otherBenefits: string[] = [];

      if (item.beneficios) {
        // Split by comma or semicolon, trim, and remove empty strings
        const parts = item.beneficios.split(/[,;]/).map(b => b.trim()).filter(Boolean);
        
        for (const part of parts) {
          const pLower = part.toLowerCase();
          
          if (pLower.includes('vale-alimentação') || pLower.includes('vale alimentação') || pLower === 'va' || pLower.includes('vale alimentação/refeição')) {
            hasVA = true;
          } else if (pLower.includes('vale-refeição') || pLower.includes('vale refeição') || pLower === 'vr') {
            hasVR = true;
          } else if (pLower.includes('vale-transporte') || pLower.includes('vale transporte') || pLower === 'vt' || pLower.includes('auxílio transporte') || pLower.includes('auxilio transporte')) {
            hasVT = true;
          } else if (pLower.includes('seguro de vida')) {
            hasLifeInsurance = true;
          } else if (pLower.includes('assistência médica') || pLower.includes('assistencia medica') || pLower.includes('plano de saúde') || pLower.includes('plano de saude') || pLower.includes('convênio médico') || pLower.includes('convenio medico')) {
            hasMedicalInsurance = true;
          } else if (pLower.includes('assistência odontológica') || pLower.includes('assistencia odontologica') || pLower.includes('plano odontológico') || pLower.includes('plano odontologico') || pLower.includes('convênio odontológico') || pLower.includes('convenio odontologico')) {
            hasDentalInsurance = true;
          } else {
            otherBenefits.push(part);
          }
        }
      }

      const finalBenefitsString = otherBenefits.length > 0 ? otherBenefits.join(', ') : null;

      let workplaceType = 'ON_SITE';
      if (item.local) {
        const localLower = item.local.toLowerCase();
        if (localLower.includes('remoto')) {
          workplaceType = 'REMOTE';
        } else if (localLower.includes('híbrido') || localLower.includes('hibrido')) {
          workplaceType = 'HYBRID';
        }
      }

      // Extract Requirements from description using heuristics (Experience, tools, languages)
      let extractedRequirements: string[] = [];
      if (item.descricao) {
        // Split text by new lines or common bullet points
        const lines = item.descricao.split(/(?:\r?\n|•|- |\*)/);
        
        for (const line of lines) {
          const trimmed = line.trim();
          // Filter out lines that are too long (probably a full paragraph) or too short
          if (trimmed.length < 5 || trimmed.length > 200) continue;
          
          const lower = trimmed.toLowerCase();
          const isRequirement = 
            lower.includes('experiência') || lower.includes('experiencia') ||
            lower.includes('conhecimento') ||
            lower.includes('domínio') || lower.includes('dominio') ||
            lower.includes('noção') || lower.includes('noções') || lower.includes('nocao') || lower.includes('nocoes') ||
            lower.includes('inglês') || lower.includes('ingles') ||
            lower.includes('excel') ||
            lower.includes('pacote office') ||
            lower.includes('obrigatório') || lower.includes('obrigatorio') ||
            lower.includes('formação') || lower.includes('formacao') ||
            lower.includes('ensino superior') ||
            lower.includes('superior completo') ||
            lower.includes('cursando') ||
            lower.includes('habilidade');

          if (isRequirement) {
            // Capitalize first letter cleanly
            const cleanReq = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
            if (!extractedRequirements.includes(cleanReq)) {
              extractedRequirements.push(cleanReq);
            }
          }
        }
      }

      const upsertData = {
        title: item.titulo,
        company: item.empresa,
        location: item.local,
        description: item.descricao,
        salary: parsedSalary,
        contractType: item.tipo_vaga || 'CLT',
        workSchedule: item.turno_horario || null,
        benefits: finalBenefitsString,
        requirements: extractedRequirements,
        hasVA,
        hasVR,
        hasVT,
        hasLifeInsurance,
        hasMedicalInsurance,
        hasDentalInsurance,
        originalUrl: item.link || null,
        applicationUrl: item.link || null, // Ensure the frontend "Entre em Contato" button works
      };

      await prisma.job.upsert({
        where: { sourceJobId: item.id_vaga },
        update: {
          ...upsertData
        },
        create: {
          ...upsertData,
          sourceJobId: item.id_vaga,
          source: 'SCRAPER',
          isActive: true,
          clicksCount: 0,
          workplaceType: workplaceType,
        }
      });
      processed++;
    }
    
    return { success: true, processed };
  }
}

export const jobService = new JobService();
