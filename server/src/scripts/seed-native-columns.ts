import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const nativeColumns = [
  { slug: 'title', name: 'Título da Vaga', type: 'STRING', isRequired: true, isNative: true, isFilterable: true },
  { slug: 'company', name: 'Empresa', type: 'STRING', isRequired: true, isNative: true, isFilterable: true },
  { slug: 'location', name: 'Localização', type: 'STRING', isRequired: true, isNative: true, isFilterable: true },
  { slug: 'workplaceType', name: 'Modalidade', type: 'STRING', isRequired: true, isNative: true, isFilterable: true, options: ['REMOTE', 'HYBRID', 'ON_SITE'] },
  { slug: 'contractType', name: 'Tipo de Contrato', type: 'STRING', isRequired: true, isNative: true, isFilterable: true, options: ['CLT', 'PJ', 'OTHER'] },
  { slug: 'education', name: 'Escolaridade', type: 'STRING', isRequired: false, isNative: true, isFilterable: true, options: ['FUNDAMENTAL_INCOMPLETE', 'FUNDAMENTAL_COMPLETE', 'MEDIO_INCOMPLETE', 'MEDIO_COMPLETE', 'SUPERIOR_INCOMPLETE', 'SUPERIOR_COMPLETE', 'POS_GRADUACAO', 'MESTRADO', 'DOUTORADO'] },
  { slug: 'description', name: 'Descrição', type: 'STRING', isRequired: true, isNative: true, isFilterable: false },
  { slug: 'requirements', name: 'Requisitos', type: 'STRING', isRequired: false, isNative: true, isFilterable: false },
  { slug: 'salary', name: 'Salário (Base)', type: 'NUMBER', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'benefits', name: 'Benefícios', type: 'STRING', isRequired: false, isNative: true, isFilterable: false },
  { slug: 'hasVA', name: 'Vale Alimentação', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'hasVR', name: 'Vale Refeição', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'hasVT', name: 'Vale Transporte', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'hasLifeInsurance', name: 'Seguro de Vida', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'hasMedicalInsurance', name: 'Plano de Saúde', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
  { slug: 'hasDentalInsurance', name: 'Plano Odonto', type: 'BOOLEAN', isRequired: false, isNative: true, isFilterable: true },
];

async function seed() {
  console.log('Seeding native columns...');
  for (const col of nativeColumns) {
    const existing = await prisma.jobCustomColumn.findUnique({ where: { slug: col.slug } });
    if (!existing) {
      await prisma.jobCustomColumn.create({
        data: {
          slug: col.slug,
          name: col.name,
          // @ts-ignore
          type: col.type,
          isRequired: col.isRequired,
          isNative: col.isNative,
          isFilterable: col.isFilterable,
          options: col.options || [],
        },
      });
      console.log(`✅ Criado: ${col.slug}`);
    } else {
      console.log(`⏩ Já existe: ${col.slug}`);
    }
  }
  console.log('✅ Seed finalizado.');
}

seed().finally(() => prisma.$disconnect());
