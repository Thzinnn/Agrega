import { PrismaClient, WorkplaceType, JobLevel, ContractType } from '@prisma/client';

const prisma = new PrismaClient();

const sampleJobs = [
  {
    title: 'Analista de Logística Sênior',
    company: 'TechFlow Brasil',
    description:
      'Estamos em busca de um Analista de Logística Sênior para liderar otimizações de cadeia de suprimentos e fluxos de distribuição nacional. Responsável pelo gerenciamento de indicadores (KPIs), negociação de fretes e integração com sistemas ERP/WMS.',
    location: 'São José dos Campos, SP',
    workplaceType: WorkplaceType.HYBRID,
    level: JobLevel.SENIOR,
    contractType: ContractType.CLT,
    benefits: 'R$ 6.500 – R$ 8.000',
    salaryMin: 6500,
    salaryMax: 8000,
    applicationUrl: 'https://techflow.example.com/carreiras/analista-logistica',
    source: 'MANUAL',
    isActive: true,
  },
  {
    title: 'Gerente de Projetos',
    company: 'Horizon Digital',
    description:
      'Buscamos Gerente de Projetos com experiência comprovada em metodologias ágeis (Scrum/Kanban) para conduzir squads multidisciplinares de produtos digitais e desenvolvimento de software corporativo.',
    location: 'Belo Horizonte, MG',
    workplaceType: WorkplaceType.REMOTE,
    level: JobLevel.LEAD,
    contractType: ContractType.CLT,
    benefits: 'R$ 12.000+',
    salaryMin: 12000,
    salaryMax: null,
    applicationUrl: 'https://horizondigital.example.com/jobs/gerente-projetos',
    source: 'MANUAL',
    isActive: true,
  },
  {
    title: 'Desenvolvedor Front-end Pleno',
    company: 'Studio Alpha',
    description:
      'Vaga para Desenvolvedor Front-end Pleno focado em interfaces de alto impacto e performance. Stack principal: React, Next.js (App Router), TypeScript, Tailwind CSS e integração com APIs REST e GraphQL.',
    location: 'São Paulo, SP',
    workplaceType: WorkplaceType.HYBRID,
    level: JobLevel.MID,
    contractType: ContractType.CLT,
    benefits: 'Salário a combinar',
    salaryMin: null,
    salaryMax: null,
    applicationUrl: 'https://studioalpha.example.com/vagas/frontend-pleno',
    source: 'MANUAL',
    isActive: true,
  },
  {
    title: 'Assistente Administrativo',
    company: 'Norte & Sul Serviços',
    description:
      'Apoio nas rotinas diárias do departamento financeiro e de compras, emissão de notas fiscais, atendimento a clientes e fornecedores e controle de planilhas operacionais.',
    location: 'Caraguatatuba, SP',
    workplaceType: WorkplaceType.ON_SITE,
    level: JobLevel.JUNIOR,
    contractType: ContractType.CLT,
    benefits: 'R$ 2.400 + VA + VT',
    salaryMin: 2400,
    salaryMax: 2400,
    applicationUrl: 'https://nortesul.example.com/vagas/assistente-adm',
    source: 'MANUAL',
    isActive: true,
  },
  {
    title: 'Engenheiro de Software Backend Sênior',
    company: 'FinTech Prime',
    description:
      'Projetar, desenvolver e sustentar microsserviços escaláveis e tolerantes a falhas no setor financeiro. Experiência profunda com Node.js, TypeScript, PostgreSQL, Redis, filas/RabbitMQ e Docker.',
    location: 'Remoto (Brasil)',
    workplaceType: WorkplaceType.REMOTE,
    level: JobLevel.SENIOR,
    contractType: ContractType.PJ,
    benefits: 'R$ 15.000 – R$ 18.000',
    salaryMin: 15000,
    salaryMax: 18000,
    applicationUrl: 'https://fintechprime.example.com/careers/backend-senior',
    source: 'MANUAL',
    isActive: true,
  },
  {
    title: 'Estágio em Desenvolvimento Web',
    company: 'InovaTech Soluções',
    description:
      'Oportunidade para estudantes de Ciência da Computação, Engenharia de Software ou correlatas para atuar no desenvolvimento e manutenção de aplicações web modernas com mentoria contínua.',
    location: 'Campinas, SP',
    workplaceType: WorkplaceType.HYBRID,
    level: JobLevel.INTERN,
    contractType: ContractType.OTHER,
    benefits: 'Bolsa R$ 1.800 + VR',
    salaryMin: 1800,
    salaryMax: 1800,
    applicationUrl: 'https://inovatech.example.com/vagas/estagio-web',
    source: 'MANUAL',
    isActive: true,
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  for (const job of sampleJobs) {
    await prisma.job.create({
      data: job,
    });
  }

  console.log(`✅ Seed concluído! ${sampleJobs.length} vagas cadastradas com sucesso.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
