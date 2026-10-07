# Changelog

## [Unreleased]

### [FACT] - 2026-10-06
- **Descrição:** Rota auxiliar `GET /api/v1/jobs/schema` implementada para expor o DMMF do modelo `Job` do Prisma (nomes, tipos e obrigatoriedade dos campos). Permite que agentes de IA leiam a estrutura da tabela dinamicamente antes de enviar o payload de ingestão.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/controllers/job.controller.ts`, `server/src/routes/job.routes.ts`, `server/src/__tests__/schema.test.ts`

### [FEAT] - 2026-10-05
- **Webhooks de Entrada Configuráveis**: Substituído o robô Python hardcoded (com API Key) por um sistema de Webhooks dinâmicos no Painel Admin. Permite criar conexões de entrada com autenticação baseada em assinatura de payloads via Web Crypto API (HMAC-SHA256).
- **Trilha de Auditoria (Logs) e Idempotência**: Adicionado armazenamento das últimas 50 entregas de cada webhook no painel (`WebhookDelivery`), rastreando status de sucesso e falhas unitárias no lote (`ingestJobs`). Webhooks agora possuem proteção nativa contra Replay Attacks e bloqueio dinâmico para webhooks inativos.
- **CSRF Bypass Seletivo**: Adicionado bypass explícito no `csrfMiddleware` estritamente para a rota `/api/v1/webhooks/receive/*`, para permitir a comunicação Server-to-Server com origens desnecessárias, enquanto o restante da API mutável continua protegida pelo OWASP CSRF Defense.

### [FEAT] - 2026-10-02
- **Páginas Institucionais:** Adicionadas páginas estáticas de Política de Privacidade (`/privacidade`) e Termos de Uso (`/termos`) com diretrizes transparentes sobre coleta de dados e takes de responsabilidade de scrape e agregação.
- **Error Boundaries:** Criados `error.tsx` e `global-error.tsx` no Next.js App Router para captura graciosa de falhas, com botões de fallback ('Tentar Novamente' e 'Voltar para Início').
- **Página 404 Customizada:** Criado `not-found.tsx` alinhado ao Design System do projeto para melhorar a experiência do usuário ao acessar links quebrados.

### [MODIFY] - 2026-10-02
- **Logs Estruturados:** Refatorado o uso disperso de `console.log` e `console.error` no back-end para utilizar um utilitário próprio de logging estruturado (JSON, levels INFO/WARN/ERROR), garantindo anonimização e melhoria para ingestão no Cloudflare/Datadog.

### [DOCS] - 2026-10-02
- **Guias Operacionais Avançados:** Documentadas no `README.md` estratégias de Point-in-Time Recovery (PITR) para o Neon, rollback de deploys em 1 clique via Wrangler CLI/Pages e fluxo de reset de senha (recuperação de acesso hardcoded).

### [SECURITY] - 2026-10-02
- **Prevenção de Session Hijacking e CSRF (TEST 1)**: Removida qualquer utilização de `localStorage` para tokens JWT no front-end. Toda a autenticação agora utiliza Cookies de Sessão estritos (`HttpOnly: true`, `Secure: true`, `SameSite: Lax`). Implementado o `csrfMiddleware` no back-end para proteger rotas de mutação (`POST`, `PUT`, `PATCH`, `DELETE`) validando rigorosamente as origens (Origin/Referer).
- **Cabeçalhos de Segurança HTTP (TEST 3)**: Injetados cabeçalhos de defesa na resposta do Next.js via `next.config.ts`, incluindo `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy` e `Permissions-Policy`.
- **Mitigação de Abuso de Uploads e Magic Bytes (TEST 4)**: Desenvolvido `uploadValidationMiddleware` para interceptar requisições `multipart/form-data`. O middleware impõe tamanho máximo de 5MB por arquivo e inspeciona os Magic Bytes (assinatura binária) para garantir que apenas arquivos reais JPEG, PNG ou WebP sejam aceitos.
- **Mass Assignment Mitigado (TEST-01)**: Definido schema `createPublicJobSchema` e payload interno padronizado para criação de vagas na rota pública, forçando valores seguros (`source: MANUAL`, `isActive: true`, etc).
- **Proteção contra Abuso (TEST-02)**: Implementado `rateLimiter` (máx. 5 req/min por IP) e verificação do Cloudflare Turnstile no payload público.
- **Vazamento de Stack Trace (TEST-03)**: Handler de erros globais atualizado para retornar 400 sem stack trace interno em casos de JSON malformado e não expor o stack trace em erros 500.
- **Injeção de Protocolo URI (TEST-04)**: Aplicada validação Zod strict via `regex(/^https?:\/\//i)` na propriedade `applicationUrl`, rejeitando protocolos perigosos como `javascript:`.

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
