# Changelog

## [Unreleased]
### [FEAT]
- Infraestrutura de ingestão externa via API (`POST /api/v1/jobs/ingest`) para receber dados de vagas em lote por robô de web scraping em Python.
- Painel Administrativo Completo (`/admin`) implementado com rotas protegidas e autenticação.
- Dashboard analítico consolidando totais de cliques e separação de vagas por `MANUAL` ou `SCRAPER` utilizando Recharts.
- CRUD completo de Vagas no Admin (Tabela) com funcionalidade de inativação controlada (Soft Delete).
- Rotina automatizada de Cloudflare Cron Trigger (90 dias) adicionada no Hono para inativar vagas antigas.
- API dinâmica de categorias e opções (`GET /api/v1/filters`) injetada na Sidebar do site principal.
- Trackings atômicos de cliques configurados no botão de contato das vagas (`POST /api/v1/jobs/:id/click`).

### [SCHEMA]
- Adição dos modelos `User`, `FilterCategory` e `FilterOption` no Prisma.
- Novos campos no modelo `Job`: `isActive` (Boolean), `sourceJobId` (String unique), `originalUrl` (String), `workSchedule` (String), e mudança do campo `source` para tipo String nativo.

### [SECURITY]
- Criação e validação do JWT com HTTP-Only cookies nas rotas do Hono.
- Middleware de checagem RBAC `authMiddleware` garantindo apenas acesso a `Role.ADMIN` na API `/api/v1/admin/*` e nas telas frontend (`middleware.ts`).
- Hash de senhas gerenciado via `bcryptjs`.

### [TEST]
- TDD de rotas protegidas no Frontend (Next.js): Login protegido, Dashboards e Vagas implementados.
- Testes unitários do Frontend (`vitest` + `react-testing-library`) atingindo aprovação completa de 100% cobrindo o Modal de Vagas, SidebarFilters e os estados de exclusão na Tabela de Vagas.
- Validação estrita sem uso de tipagem genérica perigosa ou `any` não fundamentado (`npx tsc --noEmit` limpo em ambos `/server` e `/web`).

### [MODIFY]
- Refatoração do `seed.ts` para prover dados massivos e espalhados temporalmente (90 dias) que sustentam o gráfico comparativo do Dashboard.
- Refatoração total do sistema de Filtros no `SidebarFilters.tsx` para consumir o `dbFilters`.
- Tratamento de TS estrito nos serviços e modais de detalhe das vagas.

### [MODIFY] - 2026-10-01
- **Descrição:** Refatoração do Modal de Criação de Opções de Filtro e correções de tipagem estrita (remoção de `any`).
- **Escopo:** `/web` e `/server`
- **Arquivos Afetados:** `web/src/app/admin/filters/page.tsx`, `server/src/schemas/job.schema.ts`, `server/src/services/job.service.ts`
