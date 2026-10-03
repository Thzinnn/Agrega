import { Hono } from 'hono';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from './auth.routes.js';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

export const adminRoutes = new Hono<{ Variables: { prisma: PrismaClient; user: any } }>();

adminRoutes.use('*', authMiddleware);

adminRoutes.use('*', async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'ADMIN') {
    throw new AppError('Acesso negado. Apenas administradores.', 403);
  }
  await next();
});

// ==========================================
// METRICS & DASHBOARD
// ==========================================
adminRoutes.get('/metrics', async (c) => {
  const prisma = c.get('prisma');

  const [totalJobs, activeJobs, totalClicks, jobsBySource] = await Promise.all([
    prisma.job.count(),
    prisma.job.count({ where: { isActive: true } }),
    prisma.job.aggregate({ _sum: { clicksCount: true } }),
    prisma.job.groupBy({
      by: ['source'],
      _count: true,
    }),
  ]);

  const topJobs = await prisma.job.findMany({
    orderBy: { clicksCount: 'desc' },
    take: 5,
    select: { id: true, title: true, company: true, clicksCount: true, source: true },
  });

  return c.json({
    success: true,
    data: {
      totalJobs,
      activeJobs,
      inactiveJobs: totalJobs - activeJobs,
      totalClicks: totalClicks._sum?.clicksCount || 0,
      jobsBySource: jobsBySource.map(j => ({ source: j.source, count: j._count })),
      topJobs,
    },
  });
});

// ==========================================
// JOBS CRUD
// ==========================================
adminRoutes.get('/jobs', async (c) => {
  const prisma = c.get('prisma');
  // Force interactive transaction to ensure BEGIN/COMMIT are emitted, bypassing Hyperdrive cache
  const jobs = await prisma.$transaction(async (tx) => {
    return tx.job.findMany({
      where: { id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache
      orderBy: { createdAt: 'desc' },
    });
  });
  return c.json({ success: true, data: jobs });
});

adminRoutes.patch('/jobs/:id/soft-delete', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const job = await prisma.job.update({
    where: { id },
    data: { isActive: false },
  });
  return c.json({ success: true, data: job });
});

adminRoutes.patch('/jobs/:id/activate', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const job = await prisma.job.update({
    where: { id },
    data: { isActive: true },
  });
  return c.json({ success: true, data: job });
});

adminRoutes.delete('/jobs/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  await prisma.job.delete({ where: { id } });
  return c.json({ success: true });
});

// ==========================================
// FILTERS CRUD
// ==========================================
adminRoutes.get('/filters', async (c) => {
  const prisma = c.get('prisma');
  // Wrap in transaction to completely bypass Hyperdrive cache for Admin queries
  // Force interactive transaction to ensure BEGIN/COMMIT are emitted, bypassing Hyperdrive cache
  const columns = await prisma.$transaction(async (tx) => {
    return tx.jobCustomColumn.findMany({
      where: { isFilterable: true, isActive: true, id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache
      orderBy: { name: 'asc' },
    });
  });
  
  const OPTION_LABELS: Record<string, string> = {
    REMOTE: 'Remoto',
    HYBRID: 'Híbrido',
    ON_SITE: 'Presencial',
    FUNDAMENTAL_INCOMPLETE: 'Ensino Fundamental - Incompleto',
    FUNDAMENTAL_COMPLETE: 'Ensino Fundamental - Completo',
    MEDIO_INCOMPLETE: 'Ensino Médio - Incompleto',
    MEDIO_COMPLETE: 'Ensino Médio - Completo',
    SUPERIOR_INCOMPLETE: 'Graduação - Incompleta',
    SUPERIOR_COMPLETE: 'Graduação - Completa',
    POS_GRADUACAO: 'Pós-graduação',
    MESTRADO: 'Mestrado',
    DOUTORADO: 'Doutorado',
    CLT: 'CLT',
    PJ: 'PJ',
    OTHER: 'Outros'
  };

  const categories = columns.map(col => ({
    id: col.id,
    name: col.name,
    slug: col.slug,
    options: col.options.map(opt => ({
      id: opt,
      label: OPTION_LABELS[opt] || opt,
      value: opt,
    })),
  }));

  return c.json({ success: true, data: categories });
});

adminRoutes.post('/filters/categories', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const cat = await prisma.filterCategory.create({
    data: { name: body.name, slug: body.slug }
  });
  return c.json({ success: true, data: cat }, 201);
});

adminRoutes.post('/filters/options', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const column = await prisma.jobCustomColumn.findUnique({ where: { id: body.filterCategoryId } });
  if (!column) throw new AppError('Column not found', 404);

  const updatedOptions = [...column.options, body.value];
  const col = await prisma.jobCustomColumn.update({
    where: { id: body.filterCategoryId },
    data: { options: Array.from(new Set(updatedOptions)) },
  });

  // Roda o auto-preenchimento retroativo assincronamente (background)
  // Utiliza waitUntil para garantir que o Cloudflare Workers/Vercel mantenha a execução
  const syncPromise = syncJobCustomColumnOption(prisma, col, body.value);
  if (c.executionCtx && c.executionCtx.waitUntil) {
    c.executionCtx.waitUntil(syncPromise);
  } else {
    // Fallback para Node.js puro sem waitUntil
    syncPromise.catch((err) => logger.error('Sync promise error', err));
  }

  return c.json({ success: true, data: col }, 201);
});

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Processamento Retroativo Assíncrono (Sync Job)
 * Por que foi feito: Quando um Admin cria uma nova "Opção" em uma categoria de Filtro dinâmico
 * e associa ela a uma string ou regex (ex: Mapear a palavra 'Pleno' para a opção 'Mid-Level'), 
 * as vagas antigas no banco precisam ser reclassificadas sem travar a requisição HTTP do Admin.
 * Como funciona: A função varre o banco em lotes (skip/take) no background do Cloudflare (via ctx.waitUntil), 
 * aplicando a nova flag/tag dentro do JSON 'customData' das vagas antigas que batem com a nova regra.
 */
async function syncJobCustomColumnOption(prisma: any, column: any, optionValue: string) {
  try {
    let skip = 0;
    const take = 100;
    let hasMore = true;

    while (hasMore) {
      const jobs = await prisma.job.findMany({
        skip,
        take,
        select: { id: true, description: true, workplaceType: true, education: true, contractType: true, customData: true }
      });

      if (jobs.length < take) {
        hasMore = false;
      }

      for (const job of jobs) {
        if (!job.description) continue;
        const desc = job.description.toLowerCase();
        
        // Match exato (com bordas de palavras) ou apenas includes
        const searchRegex = new RegExp(`\\b${escapeRegExp(optionValue.toLowerCase())}\\b`, 'i');
        
        if (searchRegex.test(desc) || desc.includes(optionValue.toLowerCase())) {
           if (column.isNative) {
             if (column.slug === 'workplaceType' && (!job.workplaceType || job.workplaceType === 'ON_SITE')) {
                await prisma.job.update({ where: { id: job.id }, data: { workplaceType: optionValue } });
             } else if (column.slug === 'education' && !job.education) {
                await prisma.job.update({ where: { id: job.id }, data: { education: optionValue } });
             } else if (column.slug === 'contractType' && (!job.contractType || job.contractType === 'CLT')) {
                await prisma.job.update({ where: { id: job.id }, data: { contractType: optionValue } });
             }
           } else {
             const customData = (job.customData as Record<string, any>) || {};
             let currentValue = customData[column.slug];
             let shouldUpdate = false;
             
             if (column.type === 'LIST') {
               if (!Array.isArray(currentValue)) currentValue = currentValue ? [currentValue] : [];
               if (!currentValue.includes(optionValue)) {
                 currentValue.push(optionValue);
                 customData[column.slug] = currentValue;
                 shouldUpdate = true;
               }
             } else {
               if (!currentValue) {
                 customData[column.slug] = optionValue;
                 shouldUpdate = true;
               }
             }

             if (shouldUpdate) {
               await prisma.job.update({ where: { id: job.id }, data: { customData } });
             }
           }
        }
      }
      skip += take;
    }
  } catch (err) {
    logger.error('Retroactive sync failed:', err);
  }
}

adminRoutes.delete('/filters/categories/:id', async (c) => {
  const prisma = c.get('prisma');
  await prisma.filterCategory.delete({ where: { id: c.req.param('id') } });
  return c.json({ success: true });
});

adminRoutes.post('/filters/options/delete', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const column = await prisma.jobCustomColumn.findUnique({ where: { id: body.categoryId } });
  if (!column) throw new AppError('Column not found', 404);

  const updatedOptions = column.options.filter(opt => !body.values.includes(opt));
  await prisma.jobCustomColumn.update({
    where: { id: body.categoryId },
    data: { options: updatedOptions },
  });
  return c.json({ success: true });
});

// ==========================================
// USERS CRUD
// ==========================================
adminRoutes.get('/users', async (c) => {
  const prisma = c.get('prisma');
  // Force interactive transaction
  const users = await prisma.$transaction(async (tx) => {
    return tx.user.findMany({
      where: { id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
  });
  return c.json({ success: true, data: users });
});

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string(),
  role: z.enum(['ADMIN']).default('ADMIN'),
});

adminRoutes.post('/users', async (c) => {
  const prisma = c.get('prisma');
  const rawBody = await c.req.json();
  const data = userSchema.parse(rawBody);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    throw new AppError('Email já está em uso', 400);
  }

  const hash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: hash,
      role: data.role,
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return c.json({ success: true, data: user }, 201);
});

const userUpdateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional().or(z.literal('')),
  name: z.string(),
  role: z.enum(['ADMIN']).default('ADMIN'),
});

adminRoutes.put('/users/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const rawBody = await c.req.json();
  const data = userUpdateSchema.parse(rawBody);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing && existing.id !== id) {
    throw new AppError('Email já está em uso', 400);
  }

  let hash;
  if (data.password && data.password.trim() !== '') {
    hash = await bcrypt.hash(data.password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email: data.email,
      name: data.name,
      role: data.role as 'ADMIN',
      ...(hash ? { password: hash } : {})
    },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
  });

  return c.json({ success: true, data: user });
});

adminRoutes.delete('/users/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const userPayload = c.get('user');

  // Cannot delete oneself
  if (userPayload.sub === id) {
    throw new AppError('Você não pode excluir a sua própria conta', 400);
  }

  const count = await prisma.user.count();
  if (count <= 1) {
    throw new AppError('Não é possível excluir o único usuário do sistema', 400);
  }

  await prisma.user.delete({ where: { id } });
  return c.json({ success: true });
});

// ==========================================
// JOBS FULL CRUD (CREATE / UPDATE)
// ==========================================

const jobCreateSchema = z.object({
  title: z.string(),
  company: z.string(),
  description: z.string(),
  location: z.string(),
  workplaceType: z.string(),
  education: z.string().optional().nullable(),
  contractType: z.string().default('CLT'),
  requirements: z.array(z.string()).default([]),
  benefits: z.string().nullable().optional(),
  hasVA: z.boolean().default(false),
  hasVR: z.boolean().default(false),
  hasVT: z.boolean().default(false),
  hasLifeInsurance: z.boolean().default(false),
  hasMedicalInsurance: z.boolean().default(false),
  hasDentalInsurance: z.boolean().default(false),
  salary: z.number().nullable().optional(),
  salaryMin: z.number().nullable().optional(),
  salaryMax: z.number().nullable().optional(),
  applicationUrl: z.string().nullable().optional(),
  contactEmail: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  source: z.enum(['MANUAL', 'SCRAPER']).default('MANUAL'),
  customData: z.any().optional(),
});

adminRoutes.post('/jobs', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const data = jobCreateSchema.parse(body);
  
  const job = await prisma.job.create({
    data: {
      ...data,
      customData: data.customData || {},
    },
  });
  return c.json({ success: true, data: job }, 201);
});

adminRoutes.put('/jobs/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const body = await c.req.json();
  const data = jobCreateSchema.partial().parse(body);

  const job = await prisma.job.update({
    where: { id },
    data,
  });
  return c.json({ success: true, data: job });
});

// ==========================================
// CUSTOM COLUMNS CRUD
// ==========================================

adminRoutes.get('/columns', async (c) => {
  const prisma = c.get('prisma');
  const columns = await prisma.$transaction(async (tx) => {
    return tx.jobCustomColumn.findMany({
      where: { id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache
      orderBy: { createdAt: 'asc' },
    });
  });
  return c.json({ success: true, data: columns });
});

const customColumnSchema = z.object({
  name: z.string(),
  slug: z.string(),
  type: z.enum(['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'LIST']),
  section: z.enum(['BASIC', 'CONTACT', 'CLASSIFICATION', 'REMUNERATION', 'REQUIREMENTS', 'DESCRIPTION', 'ADDITIONAL']).default('ADDITIONAL'),
  isRequired: z.boolean().default(false),
  isActive: z.boolean().default(true).optional(),
  isFilterable: z.boolean().default(false),
  options: z.array(z.string()).default([]),
});

adminRoutes.post('/columns', async (c) => {
  const prisma = c.get('prisma');
  const body = await c.req.json();
  const data = customColumnSchema.parse(body);
  
  const existing = await prisma.jobCustomColumn.findUnique({ where: { slug: data.slug } });
  if (existing) {
    throw new AppError('Já existe uma coluna com este identificador (slug).', 400);
  }

  const column = await prisma.jobCustomColumn.create({ data });
  return c.json({ success: true, data: column }, 201);
});

adminRoutes.put('/columns/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  const body = await c.req.json();
  const data = customColumnSchema.partial().parse(body);

  const column = await prisma.jobCustomColumn.update({
    where: { id },
    data,
  });
  return c.json({ success: true, data: column });
});

adminRoutes.delete('/columns/:id', async (c) => {
  const prisma = c.get('prisma');
  const id = c.req.param('id');
  await prisma.jobCustomColumn.delete({ where: { id } });
  return c.json({ success: true });
});

