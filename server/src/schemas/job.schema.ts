import { z } from 'zod';

export const workplaceTypeEnum = z.enum(['REMOTE', 'HYBRID', 'ON_SITE']);
export const jobLevelEnum = z.enum(['INTERN', 'JUNIOR', 'MID', 'SENIOR', 'LEAD']);
export const contractTypeEnum = z.enum(['CLT', 'PJ', 'OTHER']);

export const createJobSchema = z
  .object({
    title: z.string({ required_error: 'Título da vaga é obrigatório' }).min(3, 'Título deve ter pelo menos 3 caracteres').max(120),
    company: z.string({ required_error: 'Nome da empresa é obrigatório' }).min(2, 'Empresa deve ter pelo menos 2 caracteres').max(100),
    description: z.string({ required_error: 'Descrição é obrigatória' }).min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    location: z.string({ required_error: 'Localização é obrigatória' }).min(2, 'Localização deve ter pelo menos 2 caracteres').max(100),
    workplaceType: workplaceTypeEnum,
    level: jobLevelEnum,
    contractType: contractTypeEnum.default('CLT'),
    benefits: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    salaryMin: z
      .preprocess(
        (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
        z.number({ invalid_type_error: 'Salário mínimo deve ser um número' }).nonnegative('Salário mínimo não pode ser negativo').nullable().optional()
      ),
    salaryMax: z
      .preprocess(
        (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
        z.number({ invalid_type_error: 'Salário máximo deve ser um número' }).nonnegative('Salário máximo não pode ser negativo').nullable().optional()
      ),
    applicationUrl: z.string({ required_error: 'Link de candidatura é obrigatório' }).url('Link de candidatura deve ser uma URL válida'),
    source: z.string().default('MANUAL').optional(),
    isActive: z.boolean().default(true).optional(),
  })
  .refine(
    (data) => {
      if (data.salaryMin !== null && data.salaryMin !== undefined && data.salaryMax !== null && data.salaryMax !== undefined) {
        return data.salaryMax >= data.salaryMin;
      }
      return true;
    },
    {
      message: 'Salário máximo deve ser maior ou igual ao salário mínimo',
      path: ['salaryMax'],
    }
  );

export type CreateJobInput = z.infer<typeof createJobSchema>;

export const jobQuerySchema = z.object({
  q: z.string().trim().optional(),
  location: z.string().trim().optional(),
  workplaceType: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((item) => item.trim()) : undefined))
    .pipe(z.array(workplaceTypeEnum).optional()),
  level: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((item) => item.trim()) : undefined))
    .pipe(z.array(jobLevelEnum).optional()),
  contractType: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').map((item) => item.trim()) : undefined))
    .pipe(z.array(contractTypeEnum).optional()),
  minSalary: z.coerce.number().nonnegative().optional(),
  maxSalary: z.coerce.number().nonnegative().optional(),
  hasSalary: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  orderBy: z.enum(['recent', 'relevant']).default('recent'),
});

export type JobQueryInput = z.infer<typeof jobQuerySchema>;

export const jobIdParamSchema = z.object({
  id: z.string().min(1, 'ID da vaga é obrigatório'),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;
