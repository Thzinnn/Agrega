import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';

export const filterRoutes = new Hono<{ Variables: { prisma: PrismaClient } }>();

// GET /api/v1/filters - Get all active filter categories and options
/**
 * Hub Dinâmico de Filtros (Polimorfismo Frontend)
 * Por que foi feito: O painel de vagas do Agrega é 100% customizável pelo cliente. 
 * Esta rota puxa todas as colunas "Filtraveis" (isFilterable: true) do Prisma e injeta opções 
 * de dicionário nativo e opções de tabela dinâmica, mesclando tudo num Payload que a Sidebar (Frontend) consome.
 */
filterRoutes.get('/', async (c) => {
  const prisma = c.get('prisma');
  
  const columns = await prisma.jobCustomColumn.findMany({
    where: { isFilterable: true, isActive: true },
    orderBy: { name: 'asc' },
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
