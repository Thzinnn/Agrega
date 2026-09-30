# Changelog

Histórico de modificações do projeto conforme categorização estipulada em `Constitution.md`.

---

## [Unreleased]

### [MODIFY] - 2026-09-29
- **Descrição:** Atualização visual da aplicação no Frontend.
  1. Cor primária (predominante) alterada para `#1C15A3`.
  2. Ícone (Briefcase) ao lado do título da aplicação removido da `Header`.
  3. Fonte global alterada de Geist para `Poppins` (pesos 100-900) via `next/font/google`.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/app/globals.css`, `web/src/components/Header.tsx`, `web/src/app/layout.tsx`

### [FEATURE] - 2026-09-29
- **Descrição:** Refatoração substancial do modelo de Vagas. 
  1. O Nível de Senioridade (Júnior, Pleno, Sênior) foi removido e substituído por **Escolaridade**, abrangendo 11 níveis (desde Ensino Fundamental 1 Incompleto até Doutorado).
  2. Implementação de salário exato (`salary`) isolado da faixa salarial (`salaryMin`/`salaryMax`), com validação que impede o preenchimento simultâneo.
  3. Desmembramento do campo de texto `benefits` em chaves booleanas independentes no banco de dados para os benefícios padrão: Vale Alimentação (VA), Vale Refeição (VR), Vale Transporte (VT), Seguro de Vida, Assistência Médica e Assistência Odontológica.
  4. O Autocomplete de Cidades (IBGE - São Paulo) foi implementado também no formulário de Criação de Vagas, garantindo padronização na entrada de dados de localidade.
  5. Os benefícios (VA, VR, VT, etc) agora são listados individualmente como tags (badges) nos cards das vagas, ao invés de um badge genérico "Benefícios".
  6. Múltiplos meios de contato: Foram adicionados campos de E-mail (`contactEmail`) e Telefone/WhatsApp (`contactPhone`) no banco de dados e formulário. O link de candidatura (`applicationUrl`) agora é opcional, porém a vaga exige pelo menos uma das três opções de contato para ser publicada. Esses meios são exibidos interativamente na seção "Entre em Contato" no final do Modal da Vaga.
- **Escopo:** `/server` e `/web`
- **Arquivos Afetados:** `server/prisma/schema.prisma`, `server/prisma/seed.ts`, `server/src/schemas/job.schema.ts`, `server/src/services/job.service.ts`, `web/src/types/job.ts`, `web/src/components/JobCard.tsx`, `web/src/components/JobDetailsModal.tsx`, `web/src/components/SidebarFilters.tsx`, `web/src/app/page.tsx`, `web/src/app/jobs/new/page.tsx`

### [BUGFIX] - 2026-09-29
- **Descrição:** Correções estritas de tipagem e persistência na aplicação após as mudanças do modelo de Vagas.
  1. Corrigida a omissão dos campos `contactEmail` e `contactPhone` na gravação do banco pelo `job.service.ts`.
  2. Resolvida incompatibilidade de tipagem entre `react-hook-form` e `@hookform/resolvers/zod` alterando o tratamento de inputs de salário para `z.coerce.number()`, e garantindo que o tipo base da form (JobFormValues) respeite `z.infer`.
  3. Removidos avisos e usos arbitrários de tipos `any` nos requests à API do IBGE nos componentes `HeroSearch` e no formulário de criação.
  4. Extensão da interface `BadgeProps` em `Badge.tsx` para suporte dinâmico a `className` customizados (HTMLAttributes).
  5. Atualização da importação de tipos `ThemeProviderProps` em `ThemeProvider.tsx` para adequação às versões modernas do `next-themes`.
- **Escopo:** `/server` e `/web`
- **Arquivos Afetados:** `server/src/services/job.service.ts`, `server/src/schemas/job.schema.ts`, `web/src/app/jobs/new/page.tsx`, `web/src/components/HeroSearch.tsx`, `web/src/components/ui/Badge.tsx`, `web/src/components/ThemeProvider.tsx`

### [TEST] - 2026-09-29
- **Descrição:** Refatoração nas suítes de testes Vitest (Front-end) e verificação E2E para refletirem o novo contrato da API de vagas (`EducationLevel`, individualização de benefícios e dados opcionais), totalizando 14 testes vitoriosos (100% Passing).
- **Escopo:** `/web/src/components/__tests__`
- **Arquivos Afetados:** `JobCard.test.tsx`, `JobDetailsModal.test.tsx`, `SidebarFilters.test.tsx`

### [DOCS] - 2026-09-29
- **Descrição:** Atualização da documentação base do monorepo, incluindo `README.md` com menções a `concurrently` e uso rigoroso do Zod, e alinhamento tático nas `Instructions.md`.


### [FEATURE] - 2026-09-29
- **Descrição:** Adição de Dark Mode à aplicação utilizando `next-themes` e `ThemeProvider`. Implementado o seletor dinâmico de tema (claro/escuro) diretamente no novo componente `Header`. O tema principal do design system foi redesenhado sob a regra 60/30/10, adotando um azul vibrante (`#2563EB`) como Primary.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/components/Header.tsx`, `web/src/components/ThemeProvider.tsx`, `web/src/app/globals.css`, `web/src/app/layout.tsx`

### [BUGFIX] - 2026-09-29
- **Descrição:** Correção do problema de renderização (corte) da lista do autocomplete de localização no componente `HeroSearch`. O comportamento foi corrigido realocando a propriedade `overflow-hidden` do container principal para o container absoluto de background, permitindo que o dropdown da lista sobreponha livremente os cards do feed de vagas, preservando a estética de bordas arredondadas da caixa de pesquisa.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/components/HeroSearch.tsx`

### [FEATURE] - 2026-09-29
- **Descrição:** Implementação do Autocomplete de Localização (Cidades) utilizando a API do IBGE no `HeroSearch`. A aplicação agora carrega ativamente as cidades de **São Paulo (SP)** e renderiza sugestões flutuantes em tempo real conforme a digitação do usuário, sem a utilização de datalist nativo.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/components/HeroSearch.tsx`

### [MODIFY] - 2026-09-29
- **Descrição:** Correção do validador de parâmetros de buscas da API (Express + Zod). Os filtros baseados em arrays (`workplaceType`, `level`, `contractType`) agora aceitam nativamente múltiplos valores vindos da query da URL, possibilitando pesquisas compostas precisas (ex: `Júnior` e `Pleno` ao mesmo tempo).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/schemas/job.schema.ts`

### [MODIFY] - 2026-09-29
- **Descrição:** Atualização da lógica de apresentação salarial nos cards e modal. A interface agora infere a exibição dos salários baseado na presença do `salaryMin` e/ou `salaryMax` gerando textos dinâmicos (ex: "R$ 5.000 - R$ 10.000", "A partir de R$ 5.000" ou "Até R$ 10.000"). Testes ajustados para cobrir essa modificação.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/components/JobCard.tsx`, `web/src/components/JobDetailsModal.tsx`, `web/src/types/job.ts`, `web/src/components/__tests__/JobCard.test.tsx`, `web/src/components/__tests__/JobDetailsModal.test.tsx`

### [MODIFY] - 2026-09-29
- **Descrição:** Atualização da engine Node.js do ambiente local (de `v18.20.4` para `v24.19.0 LTS`) utilizando o gerenciador nativo `winget`. A atualização foi necessária para suportar as engines do Next.js 15+ e do Tailwind CSS v4, que exigem Node.js `>= 20.9.0`. Com isso, a base de código do `/web` foi mantida no estado da arte (Next 16, React 19) e o script de inicialização voltou a funcionar.
- **Escopo:** `/web`, `ambiente`
- **Arquivos Afetados:** `web/package.json`

### [FEATURE] - 2026-09-29
- **Descrição:** Implementação da Home Page (Fase 3) com feed de vagas, campo de busca duplo (`HeroSearch`) e barra lateral de filtros colapsável (`SidebarFilters`). Navegação e filtros integrados via URL (`useSearchParams` e `useRouter` do Next.js) e consumindo a rota GET da API backend (`/api/v1/jobs`). Abertura animada do `JobDetailsModal` integrada aos cards.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/app/page.tsx`, `web/src/components/SidebarFilters.tsx`, `web/src/components/HeroSearch.tsx`, `web/src/components/__tests__/SidebarFilters.test.tsx`

### [TEST] - 2026-09-29
- **Descrição:** Configuração do ecossistema de testes unitários no frontend com Vitest, React Testing Library e happy-dom. Implementação de 11 suítes de testes cobrindo os componentes atômicos (`Badge`, `JobCard`, `JobCardSkeleton`, `JobDetailsModal`). Todos os testes estão passando (Verde).
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/vitest.config.ts`, `web/vitest.setup.ts`, `web/package.json`, `web/src/components/ui/__tests__/Badge.test.tsx`, `web/src/components/__tests__/JobCard.test.tsx`, `web/src/components/__tests__/JobCardSkeleton.test.tsx`, `web/src/components/__tests__/JobDetailsModal.test.tsx`

### [BUGFIX] - 2026-09-29
- **Descrição:** Correção da tipagem de props no `RootLayout` (`web/src/app/layout.tsx`), substituindo a referência inexistente `LayoutProps<"/">` por `Readonly<{ children: React.ReactNode }>`.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/app/layout.tsx`

### [FACT] - 2026-09-29
- **Descrição:** Inicialização do frontend com Next.js App Router, Tailwind CSS, TypeScript e configuração base de componentes (Badge, JobCard, JobCardSkeleton, JobDetailsModal), além da criação da tipagem `Job` espelhando o backend e a configuração do axios no `api.ts`.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/package.json`, `web/src/types/job.ts`, `web/src/lib/api.ts`, `web/src/components/ui/Badge.tsx`, `web/src/components/JobCard.tsx`, `web/src/components/JobCardSkeleton.tsx`, `web/src/components/JobDetailsModal.tsx`

### [MODIFY] - 2026-09-29
- **Descrição:** Integração e sincronização do Prisma com banco PostgreSQL Serverless na nuvem (Neon) e carga de seed com 6 oportunidades de emprego.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/.env`, `server/prisma/schema.prisma`, `server/prisma/seed.ts`

### [BUGFIX] - 2026-09-29
- **Descrição:** Tratamento gracioso de `PrismaClientInitializationError` no middleware central de erros retornando HTTP 503 quando o banco de dados estiver inacessível.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/middlewares/errorHandler.ts`

### [TEST] - 2026-09-29
- **Descrição:** Expansão da suíte de testes de validação para cobrir casos de vagas sem salário/benefícios (campos opcionais nulos) e os dois modos de filtro de salário (`hasSalary` e faixa salarial).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/verify.ts`

### [MODIFY] - 2026-09-29
- **Descrição:** Refatoração do schema Zod e do serviço de vagas para suportar benefícios e salários 100% opcionais (com sanitização de strings vazias para null) e suporte a filtragem dupla de salários (existência via boolean e faixa via min/max).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/schemas/job.schema.ts`, `server/src/services/job.service.ts`

### [FACT] - 2026-09-29
- **Descrição:** Implementação completa da Fase 0 (Setup do Monorepo) e Fase 1 (Backend com Express, TypeScript, Prisma, Zod e PostgreSQL).
- **Escopo:** `raiz`, `/server`
- **Arquivos Afetados:** `package.json`, `.gitignore`, `server/package.json`, `server/tsconfig.json`, `server/prisma/schema.prisma`, `server/prisma/migrations/20250101000000_init/migration.sql`, `server/prisma/seed.ts`, `server/src/server.ts`, `server/src/app.ts`, `server/src/routes/*`, `server/src/controllers/*`, `server/src/services/*`, `server/src/schemas/*`, `server/src/middlewares/*`, `server/src/lib/prisma.ts`
