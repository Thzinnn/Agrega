# Changelog

## [Unreleased]

### [BUGFIX] - 2026-10-02
- **Descrição:** Correção no algoritmo de parsing de salários na API de Ingestão para extrair faixas salariais (min e max) e evitar concatenação de valores. Ajuste na heurística de extração de requisitos para ignorar títulos de seções e evitar sobreposição com campos nativos. Implementação de uma heurística inteligente que rastreia todo o texto da descrição da vaga procurando termos como "ensino superior", "médio completo", etc, e preenche nativamente a coluna `education` do banco de dados na inserção via Scraper. Realocação do bloco "Descrição Completa" no `JobDetailsModal` para aparecer logo acima dos contatos.
- **Escopo:** `/server` e `/web`
- **Arquivos Afetados:** `server/src/services/job.service.ts`, `web/src/components/JobDetailsModal.tsx`

### [FACT] - 2026-10-02
- **Descrição:** Adição de barra de pesquisa textual e filtros avançados (Status Ativo/Inativo e Origem Manual/Scraper) com resposta em tempo real na página de gerenciamento de vagas do painel Admin. Alteração da configuração do banco de dados (via script interno) para tornar o preenchimento de Escolaridade opcional nos envios do Scraper.
- **Escopo:** `/server` e `/web`
- **Arquivos Afetados:** `web/src/app/admin/jobs/page.tsx`

### [FEAT] - 2026-10-02
- **Descrição:** Implementação do **Auto-Preenchimento Retroativo (Retroactive Sync)**. Agora, sempre que o usuário criar uma nova "Opção" para uma coluna ou filtro no Painel Admin (ex: adicionar a opção "Híbrido Flex" na modalidade, ou "CNH B" numa coluna dinâmica de CNH), o sistema rodará um script no backend, invisível ao usuário, que escaneia a `description` de TODAS as vagas já existentes no banco. Caso o nome dessa nova opção seja encontrado no texto da vaga, e o campo da vaga estiver vazio (ou sem essa opção), o sistema o preencherá automaticamente.
- **Escopo:** `/server` (Rotas Admin)
- **Arquivos Afetados:** `server/src/routes/admin.routes.ts`

### [FEAT]
- Infraestrutura de ingestão externa via API (`POST /api/v1/jobs/ingest`) para receber dados de vagas em lote por robô de web scraping em Python.
- Painel Administrativo Completo (`/admin`) implementado com rotas protegidas e autenticação.
- Dashboard analítico consolidando totais de cliques e separação de vagas por `MANUAL` ou `SCRAPER` utilizando Recharts.
- CRUD completo de Vagas no Admin (Tabela) com funcionalidade de inativação controlada (Soft Delete) e Atualização Otimista (Optimistic UI) sem latência de rede.
- Implementação de `ConfirmModal` unificado e sistema de Toasts para feedback visual instantâneo de ações em todo o painel Admin.
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

### [TEST & FIXES]
- TDD de rotas protegidas no Frontend (Next.js): Login protegido, Dashboards e Vagas implementados.
- Testes unitários do Frontend (`vitest` + `react-testing-library`) atingindo aprovação completa de 100% cobrindo o Modal de Vagas, SidebarFilters e os estados de exclusão na Tabela de Vagas.
- Validação estrita sem uso de tipagem genérica perigosa ou `any` não fundamentado (`npx tsc --noEmit` limpo em ambos `/server` e `/web`).
- Bypass total de Cache (Cloudflare CDN e Hyperdrive) nas rotas privadas `/admin` garantindo leituras frescas do banco através da injeção de timestamps (Interactive Transactions Hack).

### [MODIFY]
- Refatoração do `seed.ts` para prover dados massivos e espalhados temporalmente (90 dias) que sustentam o gráfico comparativo do Dashboard.
- Refatoração total do sistema de Filtros no `SidebarFilters.tsx` para consumir o `dbFilters`.
- Tratamento de TS estrito nos serviços e modais de detalhe das vagas.

### [MODIFY] - 2026-10-01
- **Descrição:** Refatoração do Modal de Criação de Opções de Filtro e correções de tipagem estrita (remoção de `any`).
- **Escopo:** `/web` e `/server`
- **Arquivos Afetados:** `web/src/app/admin/filters/page.tsx`, `server/src/schemas/job.schema.ts`, `server/src/services/job.service.ts`
