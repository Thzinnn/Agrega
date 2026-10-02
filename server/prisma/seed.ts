import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const generateDateInPast90Days = () => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 90));
  return date;
};

const sampleJobs = [
  {
    title: 'Analista de Logística Sênior',
    company: 'TechFlow Brasil',
    description: 'Estamos em busca de um Analista de Logística Sênior para liderar otimizações de cadeia de suprimentos e fluxos de distribuição nacional. Responsável pelo gerenciamento de indicadores (KPIs), negociação de fretes e integração com sistemas ERP/WMS.',
    location: 'São José dos Campos, SP',
    workplaceType: 'HYBRID',
    education: 'SUPERIOR_COMPLETE',
    requirements: ['Excel Avançado', 'Inglês Fluente', 'Experiência com ERP (SAP)'],
    contractType: 'CLT',
    benefits: 'Plano de Saúde, Gympass',
    hasVA: true,
    hasVR: true,
    hasVT: true,
    hasMedicalInsurance: true,
    salaryMin: 6500,
    salaryMax: 8000,
    salary: null,
    applicationUrl: 'https://techflow.example.com/carreiras/analista-logistica',
    contactEmail: 'vagas@techflow.example.com',
    source: 'MANUAL',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Gerente de Projetos',
    company: 'Horizon Digital',
    description: 'Buscamos Gerente de Projetos com experiência comprovada em metodologias ágeis (Scrum/Kanban) para conduzir squads multidisciplinares de produtos digitais e desenvolvimento de software corporativo.',
    location: 'Belo Horizonte, MG',
    workplaceType: 'REMOTE',
    education: 'POS_GRADUACAO',
    contractType: 'CLT',
    benefits: 'Bônus Anual',
    hasVR: true,
    hasMedicalInsurance: true,
    hasDentalInsurance: true,
    salaryMin: 12000,
    salaryMax: null,
    salary: null,
    applicationUrl: null,
    contactEmail: 'talentos@horizondigital.com',
    contactPhone: '31999999999',
    source: 'SCRAPER',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Desenvolvedor Front-end Pleno',
    company: 'Studio Alpha',
    description: 'Vaga para Desenvolvedor Front-end Pleno focado em interfaces de alto impacto e performance. Stack principal: React, Next.js (App Router), TypeScript, Tailwind CSS e integração com APIs REST e GraphQL.',
    location: 'São Paulo, SP',
    workplaceType: 'HYBRID',
    education: 'SUPERIOR_INCOMPLETE',
    contractType: 'CLT',
    benefits: null,
    hasVR: true,
    hasVT: true,
    hasMedicalInsurance: true,
    salaryMin: null,
    salaryMax: null,
    salary: null,
    applicationUrl: 'https://studioalpha.example.com/vagas/frontend-pleno',
    contactPhone: '11988887777',
    source: 'MANUAL',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Assistente Administrativo',
    company: 'Norte & Sul Serviços',
    description: 'Apoio nas rotinas diárias do departamento financeiro e de compras, emissão de notas fiscais, atendimento a clientes e fornecedores e controle de planilhas operacionais.',
    location: 'Caraguatatuba, SP',
    workplaceType: 'ON_SITE',
    education: 'MEDIO_COMPLETE',
    contractType: 'CLT',
    benefits: null,
    hasVA: true,
    hasVT: true,
    salaryMin: null,
    salaryMax: null,
    salary: 2400,
    applicationUrl: null,
    contactEmail: 'rh@nortesul.com.br',
    source: 'SCRAPER',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Engenheiro de Software Backend Sênior',
    company: 'FinTech Prime',
    description: 'Projetar, desenvolver e sustentar microsserviços escaláveis e tolerantes a falhas no setor financeiro. Experiência profunda com Node.js, TypeScript, PostgreSQL, Redis, filas/RabbitMQ e Docker.',
    location: 'Remoto (Brasil)',
    workplaceType: 'REMOTE',
    education: 'SUPERIOR_COMPLETE',
    contractType: 'PJ',
    benefits: 'Licença maternidade/paternidade estendida',
    salaryMin: 15000,
    salaryMax: 18000,
    salary: null,
    applicationUrl: 'https://fintechprime.example.com/careers/backend-senior',
    contactEmail: 'tech@fintechprime.com',
    source: 'MANUAL',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Estágio em Desenvolvimento Web',
    company: 'InovaTech Soluções',
    description: 'Oportunidade para estudantes de Ciência da Computação, Engenharia de Software ou correlatas para atuar no desenvolvimento e manutenção de aplicações web modernas com mentoria contínua.',
    location: 'Campinas, SP',
    workplaceType: 'HYBRID',
    education: 'SUPERIOR_INCOMPLETE',
    contractType: 'OTHER',
    benefits: null,
    hasVR: true,
    hasVT: true,
    salaryMin: null,
    salaryMax: null,
    salary: 1800,
    applicationUrl: 'https://inovatech.example.com/vagas/estagio-web',
    contactPhone: '19977776666',
    source: 'SCRAPER',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  },
  {
    title: 'Designer UX/UI Pleno',
    company: 'Criativa Hub',
    description: 'Estamos procurando um Designer de Produto Pleno para atuar em nossos sistemas web e aplicativos móveis. Necessário portfólio e domínio do Figma.',
    location: 'Florianópolis, SC',
    workplaceType: 'HYBRID',
    education: 'SUPERIOR_COMPLETE',
    contractType: 'CLT',
    benefits: 'Auxílio Home Office',
    hasVA: true,
    hasVR: true,
    hasMedicalInsurance: true,
    hasDentalInsurance: true,
    salaryMin: 5000,
    salaryMax: 7000,
    salary: null,
    applicationUrl: null,
    contactEmail: 'ux@criativahub.com.br',
    source: 'MANUAL',
    isActive: true,
    createdAt: generateDateInPast90Days(),
    clicksCount: Math.floor(Math.random() * 150),
  }
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');
  
  // Limpar banco
  await prisma.filterOption.deleteMany({});
  await prisma.filterCategory.deleteMany({});
  await prisma.job.deleteMany({});
  await prisma.user.deleteMany({});
  
  // Seed User
  const passwordHash = await bcrypt.hash('admin', 10);
  await prisma.user.create({
    data: {
      email: 'admin@admin.com',
      password: passwordHash,
      name: 'Administrador',
      role: 'ADMIN',
    }
  });

  await prisma.jobCustomColumn.deleteMany({ where: { isNative: true } });
  
  await prisma.jobCustomColumn.create({
    data: {
      name: 'Modalidade',
      slug: 'workplaceType',
      type: 'LIST',
      section: 'CLASSIFICATION',
      isRequired: true,
      isActive: true,
      isNative: true,
      isFilterable: true,
      options: ['REMOTE', 'HYBRID', 'ON_SITE']
    }
  });

  await prisma.jobCustomColumn.create({
    data: {
      name: 'Tipo de Contrato',
      slug: 'contractType',
      type: 'LIST',
      section: 'CLASSIFICATION',
      isRequired: true,
      isActive: true,
      isNative: true,
      isFilterable: true,
      options: ['CLT', 'PJ', 'OTHER']
    }
  });

  await prisma.jobCustomColumn.create({
    data: {
      name: 'Escolaridade',
      slug: 'education',
      type: 'LIST',
      section: 'CLASSIFICATION',
      isRequired: true,
      isActive: true,
      isNative: true,
      isFilterable: true,
      options: [
        'FUNDAMENTAL_INCOMPLETE',
        'FUNDAMENTAL_COMPLETE',
        'MEDIO_INCOMPLETE',
        'MEDIO_COMPLETE',
        'SUPERIOR_INCOMPLETE',
        'SUPERIOR_COMPLETE',
        'POS_GRADUACAO',
        'MESTRADO',
        'DOUTORADO',
      ]
    }
  });

  // Seed Jobs
  for (const job of sampleJobs) {
    await prisma.job.create({
      data: job,
    });
  }

  console.log(`✅ Seed concluído! Admin, Filtros e ${sampleJobs.length} vagas cadastradas com sucesso.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
