import { z } from 'zod';

export const workplaceTypeEnum = z.enum(['REMOTE', 'HYBRID', 'ON_SITE']);
export const educationLevelEnum = z.enum([
  'FUNDAMENTAL_INCOMPLETE',
  'FUNDAMENTAL_COMPLETE',
  'MEDIO_INCOMPLETE',
  'MEDIO_COMPLETE',
  'SUPERIOR_INCOMPLETE',
  'SUPERIOR_COMPLETE',
  'POS_GRADUACAO',
  'MESTRADO',
  'DOUTORADO',
]);
export const contractTypeEnum = z.enum(['CLT', 'PJ', 'OTHER']);

export const createJobSchema = z
  .object({
    title: z.string({ required_error: 'Título da vaga é obrigatório' }).min(3, 'Título deve ter pelo menos 3 caracteres').max(120),
    company: z.string({ required_error: 'Nome da empresa é obrigatório' }).min(2, 'Empresa deve ter pelo menos 2 caracteres').max(100),
    description: z.string({ required_error: 'Descrição é obrigatória' }).min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    location: z.string({ required_error: 'Localização é obrigatória' }).min(2, 'Localização deve ter pelo menos 2 caracteres').max(100),
    workplaceType: workplaceTypeEnum,
    education: educationLevelEnum,
    requirements: z.array(z.string().min(1, 'Requisito não pode ser vazio')).default([]).optional(),
    contractType: contractTypeEnum.default('CLT'),
    benefits: z
      .string()
      .trim()
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    hasVA: z.boolean().default(false).optional(),
    hasVR: z.boolean().default(false).optional(),
    hasVT: z.boolean().default(false).optional(),
    hasLifeInsurance: z.boolean().default(false).optional(),
    hasMedicalInsurance: z.boolean().default(false).optional(),
    hasDentalInsurance: z.boolean().default(false).optional(),
    salary: z
      .preprocess(
        (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
        z.number({ invalid_type_error: 'Salário deve ser um número' }).nonnegative('Salário não pode ser negativo').nullable().optional()
      ),
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
    applicationUrl: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().url('Link de candidatura deve ser uma URL válida').optional()),
    contactEmail: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().email('E-mail inválido').optional()),
    contactPhone: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Telefone inválido, use apenas números e os caracteres +, -, ()').optional()),
    source: z.string().default('MANUAL').optional(),
    isActive: z.boolean().default(true).optional(),
  })
  .refine(
    (data) => {
      const hasUrl = !!data.applicationUrl;
      const hasEmail = !!data.contactEmail;
      const hasPhone = !!data.contactPhone && data.contactPhone.trim() !== '';
      return hasUrl || hasEmail || hasPhone;
    },
    {
      message: 'Você deve informar pelo menos um meio de contato (Link, E-mail ou Telefone)',
      path: ['applicationUrl'],
    }
  )
  .refine(
    (data) => {
      // If exact salary is provided, min and max cannot be provided
      if (data.salary !== null && data.salary !== undefined) {
        if ((data.salaryMin !== null && data.salaryMin !== undefined) || (data.salaryMax !== null && data.salaryMax !== undefined)) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Se um salário fixo for informado, o piso e teto salarial não podem ser preenchidos.',
      path: ['salary'],
    }
  )
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
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim());
    })
    .pipe(z.array(workplaceTypeEnum).optional()),
  education: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim());
    })
    .pipe(z.array(educationLevelEnum).optional()),
  contractType: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim());
    })
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
