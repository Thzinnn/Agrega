import { createJobSchema, jobQuerySchema, jobIdParamSchema } from '../schemas/job.schema.js';

console.log('🧪 Iniciando testes de validação dos Schemas e Regras de Negócio...');

// Test 1: Valid Job Creation with full salary
const validJob = {
  title: 'Engenheiro de Software Full Stack',
  company: 'Tech Solutions',
  description: 'Desenvolvimento de sistemas escaláveis com Node.js e React.',
  location: 'São Paulo, SP',
  workplaceType: 'REMOTE',
  education: 'SUPERIOR_COMPLETE',
  contractType: 'CLT',
  benefits: 'R$ 15.000 + Benefícios',
  salaryMin: 12000,
  salaryMax: 15000,
  contactEmail: 'rh@techsolutions.com',
};

const parseValidResult = createJobSchema.safeParse(validJob);
if (!parseValidResult.success) {
  console.error('❌ Falha no Teste 1 (validJob):', parseValidResult.error.format());
  process.exit(1);
}
console.log('✅ Teste 1: Validação de criação de vaga válida passou com sucesso.');

// Test 2: Valid Job Creation WITHOUT salary and WITHOUT benefits (optional fields)
const jobWithoutSalary = {
  title: 'Designer de Produto',
  company: 'Studio Design',
  description: 'Criação de fluxos de usuário e design system.',
  location: 'Remoto',
  workplaceType: 'REMOTE',
  education: 'MEDIO_COMPLETE',
  contractType: 'PJ',
  applicationUrl: 'https://studiodesign.example.com/jobs/designer',
  benefits: '', // string vazia vinda de formulário
  salaryMin: '', // string vazia vinda de formulário
  salaryMax: null,
};

const parseNoSalaryResult = createJobSchema.safeParse(jobWithoutSalary);
if (!parseNoSalaryResult.success) {
  console.error('❌ Falha no Teste 2 (jobWithoutSalary):', parseNoSalaryResult.error.format());
  process.exit(1);
}

if (parseNoSalaryResult.data.benefits !== null || parseNoSalaryResult.data.salaryMin !== null || parseNoSalaryResult.data.salaryMax !== null) {
  console.error('❌ Falha no Teste 2: campos opcionais não foram convertidos para null:', parseNoSalaryResult.data);
  process.exit(1);
}
console.log('✅ Teste 2: Cadastro de vaga SEM salário e SEM benefícios (opcionais) aceito e tratado como null.');

// Test 3: Invalid Salary Range (salaryMax < salaryMin)
const invalidSalaryJob = {
  ...validJob,
  salaryMin: 10000,
  salaryMax: 8000,
};

const parseSalaryResult = createJobSchema.safeParse(invalidSalaryJob);
if (parseSalaryResult.success) {
  console.error('❌ Falha no Teste 3: Deveria rejeitar salaryMax < salaryMin');
  process.exit(1);
}
console.log('✅ Teste 3: Rejeição de salário máximo menor que mínimo passou com sucesso.');

// Test 4: Invalid URL
const invalidUrlJob = {
  ...validJob,
  contactEmail: undefined,
  applicationUrl: 'not-a-valid-url',
};

const parseUrlResult = createJobSchema.safeParse(invalidUrlJob);
if (parseUrlResult.success) {
  console.error('❌ Falha no Teste 4: Deveria rejeitar URL inválida');
  process.exit(1);
}
console.log('✅ Teste 4: Rejeição de URL inválida passou com sucesso.');

// Test 4b: No Contact Method Given
const noContactJob = {
  ...validJob,
  contactEmail: undefined,
  contactPhone: '',
  applicationUrl: '',
};

const parseNoContactResult = createJobSchema.safeParse(noContactJob);
if (parseNoContactResult.success) {
  console.error('❌ Falha no Teste 4b: Deveria rejeitar vaga sem nenhum contato');
  process.exit(1);
}
console.log('✅ Teste 4b: Rejeição de vaga sem meios de contato passou com sucesso.');

// Test 4c: Exact salary WITH salaryMin
const invalidExactSalaryJob = {
  ...validJob,
  salary: 13000,
  salaryMin: 12000,
  salaryMax: null,
};

const parseInvalidExactSalaryResult = createJobSchema.safeParse(invalidExactSalaryJob);
if (parseInvalidExactSalaryResult.success) {
  console.error('❌ Falha no Teste 4c: Deveria rejeitar salary junto com salaryMin/Max');
  process.exit(1);
}
console.log('✅ Teste 4c: Rejeição de salário fixo com piso/teto passou com sucesso.');

// Test 5: Query Parsing with comma-separated enums & hasSalary: "true"
const rawQueryParams1 = {
  q: '  Engenheiro  ',
  workplaceType: 'REMOTE,HYBRID',
  education: 'MEDIO_COMPLETE,SUPERIOR_INCOMPLETE',
  contractType: 'CLT,PJ',
  minSalary: '5000',
  maxSalary: '12000',
  hasSalary: 'true',
  page: '2',
  limit: '20',
};

const parsedQuery1 = jobQuerySchema.safeParse(rawQueryParams1);
if (!parsedQuery1.success) {
  console.error('❌ Falha no Teste 5 (Query Parsing 1):', parsedQuery1.error.format());
  process.exit(1);
}

if (
  parsedQuery1.data.q !== 'Engenheiro' ||
  parsedQuery1.data.page !== 2 ||
  parsedQuery1.data.limit !== 20 ||
  parsedQuery1.data.hasSalary !== true ||
  parsedQuery1.data.minSalary !== 5000 ||
  parsedQuery1.data.maxSalary !== 12000 ||
  parsedQuery1.data.workplaceType?.length !== 2
) {
  console.error('❌ Falha na transformação do Teste 5:', parsedQuery1.data);
  process.exit(1);
}
console.log('✅ Teste 5: Filtro por faixa de salário (5000-12000) e hasSalary=true passou com sucesso.');

// Test 6: Query Parsing with hasSalary: "false" (Vagas "A combinar" / sem salário especificado)
const rawQueryParams2 = {
  hasSalary: 'false',
};

const parsedQuery2 = jobQuerySchema.safeParse(rawQueryParams2);
if (!parsedQuery2.success || parsedQuery2.data.hasSalary !== false) {
  console.error('❌ Falha no Teste 6 (hasSalary false):', parsedQuery2);
  process.exit(1);
}
console.log('✅ Teste 6: Filtro de vagas sem salário (hasSalary=false) aceito com sucesso.');

// Test 7: JobIdParam validation
const validIdParam = jobIdParamSchema.safeParse({ id: 'c9b4e3e2-8d7b-4a5e-9f3b-1b2c3d4e5f6a' });
const invalidIdParam = jobIdParamSchema.safeParse({ id: '' });
if (!validIdParam.success || invalidIdParam.success) {
  console.error('❌ Falha no Teste 7 (JobIdParam validation)');
  process.exit(1);
}
console.log('✅ Teste 7: Validação de ID da vaga passou com sucesso.');

console.log('\n🎉 Todos os 7 testes de regras de validação passaram com sucesso!');
