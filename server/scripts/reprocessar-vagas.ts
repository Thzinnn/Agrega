import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 [Data Migration] Iniciando re-processamento das vagas no banco de dados...');
  let skip = 0;
  const take = 100;
  let hasMore = true;
  let processedCount = 0;
  let updatedCount = 0;

  while (hasMore) {
    const jobs = await prisma.job.findMany({
      skip,
      take,
      select: {
        id: true,
        title: true,
        description: true,
        source: true,
        education: true,
        workplaceType: true,
      }
    });

    if (jobs.length === 0) {
      hasMore = false;
      break;
    }

    for (const job of jobs) {
      // Reprocessa apenas vagas que vieram do scraper para inferências automáticas
      if (job.source !== 'SCRAPER') {
        continue;
      }
      
      let hasUpdates = false;
      const updateData: any = {};

      if (job.description) {
        const descLower = job.description.toLowerCase();
        
        // 1. Re-processar Educação (Heurística Nativa)
        let inferredEducation: string | null = null;
        if (descLower.includes('doutorado')) inferredEducation = 'DOUTORADO';
        else if (descLower.includes('mestrado')) inferredEducation = 'MESTRADO';
        else if (descLower.includes('pós-graduação') || descLower.includes('pos-graduacao') || descLower.includes('pós graduação')) inferredEducation = 'POS_GRADUACAO';
        else if (descLower.includes('superior cursando') || descLower.includes('superior incompleto') || descLower.includes('graduação incompleta') || descLower.includes('ensino superior incompleto') || descLower.includes('ensino superior cursando')) inferredEducation = 'SUPERIOR_INCOMPLETE';
        else if (descLower.includes('ensino superior') || descLower.includes('superior completo') || descLower.includes('graduação completa')) inferredEducation = 'SUPERIOR_COMPLETE';
        else if (descLower.includes('ensino médio incompleto') || descLower.includes('ensino medio incompleto') || descLower.includes('ensino médio cursando') || descLower.includes('ensino medio cursando')) inferredEducation = 'MEDIO_INCOMPLETE';
        else if (descLower.includes('ensino médio') || descLower.includes('ensino medio') || descLower.includes('2º grau') || descLower.includes('segundo grau')) inferredEducation = 'MEDIO_COMPLETE';
        else if (descLower.includes('ensino fundamental incompleto')) inferredEducation = 'FUNDAMENTAL_INCOMPLETE';
        else if (descLower.includes('ensino fundamental') || descLower.includes('1º grau') || descLower.includes('primeiro grau')) inferredEducation = 'FUNDAMENTAL_COMPLETE';

        if (inferredEducation && job.education !== inferredEducation) {
          updateData.education = inferredEducation;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await prisma.job.update({
          where: { id: job.id },
          data: updateData
        });
        updatedCount++;
      }
      processedCount++;
    }

    skip += take;
  }

  console.log(`✅ Concluído! Processou ${processedCount} vagas do SCRAPER e atualizou ${updatedCount} delas com novas heurísticas.`);
}

main()
  .catch(e => {
    console.error('❌ Erro no script de migração de dados:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
