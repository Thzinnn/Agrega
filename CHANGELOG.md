# Changelog

Histórico de modificações do projeto conforme categorização estipulada em `Constitution.md`.

---

## [Unreleased]

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
