import { z } from 'zod';

// Enums removed to allow dynamic values

// Base schema para validação de Vagas.
// IMPORTANTE: Todas as validações visuais do Frontend e sanitizações do Backend derivam deste núcleo (Zod).
export const baseJobSchema = z
  .object({
    // Regra de Negócio: O título não pode ser malicioso ou vazio
    title: z.string({ required_error: 'Título da vaga é obrigatório' }).min(3, 'Título deve ter pelo menos 3 caracteres').max(120),
    company: z.string({ required_error: 'Nome da empresa é obrigatório' }).min(2, 'Empresa deve ter pelo menos 2 caracteres').max(100),
    description: z.string({ required_error: 'Descrição é obrigatória' }).min(10, 'Descrição deve ter pelo menos 10 caracteres'),
    location: z.string({ required_error: 'Localização é obrigatória' }).min(2, 'Localização deve ter pelo menos 2 caracteres').max(100),
    workplaceType: z.string(),
    education: z.preprocess((val) => (val === '' ? null : val), z.string().nullable().optional()),
    requirements: z.array(z.string().min(1, 'Requisito não pode ser vazio')).default([]).optional(),
    contractType: z.string().default('CLT'),
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
    // Segurança: Regex força links de candidatura legítimos, evitando injeções javascript:alert()
    applicationUrl: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().url('Link de candidatura deve ser uma URL válida').regex(/^https?:\/\//i, 'O link deve obrigatoriamente iniciar com http:// ou https://').optional()),
    contactEmail: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().email('E-mail inválido').optional()),
    contactPhone: z
      .preprocess((val) => (val === '' ? undefined : val), z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Telefone inválido, use apenas números e os caracteres +, -, ()').optional()),
    source: z.string().default('MANUAL').optional(),
    isActive: z.boolean().default(true).optional(),
    customData: z.record(z.unknown()).optional(),
  });

/**
 * Validação de Submissão de Vaga (Core)
 * Mitiga:
 * 1. "Vagas Fantasma": Força a exigência de que ao menos 1 meio de contato (URL, Email ou Telefone) exista.
 * 2. "Inconsistência Salarial": Proíbe a submissão matemática impossível onde Teto < Piso.
 * 3. "Conflito de Remuneração": Proíbe fixar um salário E ao mesmo tempo uma faixa salarial.
 */
export const createJobSchema = baseJobSchema
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

/**
 * Filtro de Vagas Públicas (Prevenção contra Mass Assignment)
 * Por que foi feito: Se deixássemos a rota pública salvar dados brutos, 
 * um hacker enviaria no JSON o campo `isActive: true` (aprovando a própria vaga)
 * ou `source: 'LINKEDIN'`, além de poluir o banco.
 * Como mitiga: O `.omit()` do Zod arranca esses atributos da requisição 
 * mesmo que o usuário os envie, garantindo aprovação manual obrigatória.
 * O `.extend` força a presença obrigatória do token do Cloudflare Turnstile (Anti-Bot).
 */
export const createPublicJobSchema = baseJobSchema
  .omit({
    source: true,
    isActive: true,
    customData: true,
  })
  .extend({
    turnstileToken: z.string({ required_error: 'Token de verificação humana é obrigatório' }),
  })
  .strict('Propriedades não permitidas no payload')
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

export type CreatePublicJobInput = z.infer<typeof createPublicJobSchema>;

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
    .pipe(z.array(z.string()).optional()),
  education: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim());
    })
    .pipe(z.array(z.string()).optional()),
  contractType: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((val) => {
      if (!val) return undefined;
      const arr = Array.isArray(val) ? val : val.split(',');
      return arr.map((item) => item.trim());
    })
    .pipe(z.array(z.string()).optional()),
  minSalary: z.coerce.number().nonnegative().optional(),
  maxSalary: z.coerce.number().nonnegative().optional(),
  hasSalary: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  orderBy: z.enum(['recent', 'relevant']).default('recent'),
}).catchall(z.unknown());

export type JobQueryInput = z.infer<typeof jobQuerySchema>;

export const jobIdParamSchema = z.object({
  id: z.string().min(1, 'ID da vaga é obrigatório'),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;

export const ingestJobItemSchema = z.object({
  id_vaga: z.string(),
  titulo: z.string(),
  empresa: z.string(),
  local: z.string(),
  salario: z.string().optional().nullable(),
  tipo_vaga: z.string().optional().nullable(),
  turno_horario: z.string().optional().nullable(),
  beneficios: z.string().optional().nullable(),
  descricao: z.string(),
  link: z.string().url().optional().nullable().or(z.literal('')),
  data_coleta: z.string().optional().nullable(),
}).catchall(z.unknown());

export type IngestJobItem = z.infer<typeof ingestJobItemSchema>;
