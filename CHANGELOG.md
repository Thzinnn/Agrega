# Changelog

## [Unreleased]

### [FACT] - 2026-10-12
- **Descrição:** Implementação do Gateway Único Universal de Ingestão e Balanceamento (`Universal Ingestion Gateway`) no endpoint unificado `POST /api/v1/gateway/ingest`. Aceita envelopes polimórficos discriminados via Zod por `kind: 'IMAGE' | 'TEXT_JOBS' | 'RAW_TEXT'`, centralizando 100% dos fluxos de scrapers externos (Indeed, Gupy, textos e fotos do WhatsApp) em um único ponto de contato. Implementação do `TrafficLimiterService` com proteção ativa contra exaustão de conexões do Neon PostgreSQL (máximo de requisições em voo concorrentes), backpressure inteligente com `HTTP 429` e cabeçalho `Retry-After: 3`, e cache circular em memória para deduplicação antecipada de payloads idênticos sem custo de I/O no banco. Implementação do `GatewayDispatcherService` com roteamento interno polimórfico e normalização automática. Disponibilização dos endpoints de telemetria e supervisão `GET /api/v1/gateway/metrics` e `GET /api/v1/gateway/traces`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/schemas/gateway.schema.ts`, `server/src/services/traffic-limiter.service.ts`, `server/src/services/gateway-dispatcher.service.ts`, `server/src/controllers/gateway.controller.ts`, `server/src/routes/gateway.routes.ts`, `server/src/routes/index.ts`, `server/src/app.ts`

### [TEST] - 2026-10-12
- **Descrição:** Criação da suíte completa de testes de integração e contrato `gateway-unified.test.ts` (20 novos testes no Vitest), cobrindo validação estrita de esquemas Zod (rejeição de envelopes malformados ou kinds inválidos), concorrência e fila do `TrafficLimiterService` com disparo de `TrafficOverloadedError`, deduplicação de hashes em memória, despacho polimórfico para texto bruto (com extração de cargos e links WhatsApp) e descarte inteligente de conversas irrelevantes (`DISCARDED`), lote de vagas estruturadas, fluxo de visão para imagens, e validação completa dos endpoints HTTP com autenticação `x-api-key`. Suíte completa do servidor agora conta com 47 testes verdes.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/gateway-unified.test.ts`

### [FACT] - 2026-10-12
- **Descrição:** Implementação da API de Ingestão de Dados Brutos para Parceiros (`POST /api/v1/scraper/raw/analyze` e `POST /api/v1/scraper/raw/upload`) com suporte a Base64, URLs externas e uploads binários Multipart, autenticação via `x-api-key` e publicação direta opcional (`directPublish: true`) através do `JobService`. Implementação do Smart Relevance Guard com triagem e descarte inteligente em 4 categorias (`VAGA_DIRETA`, `PROGRAMA_EMPREGABILIDADE`, `CURSO_CAPACITACAO`, `NAO_E_VAGA`), preservando oportunidades sociais legítimas (como Instituto Inaee) e descartando lixo eletrônico (cardápios, recibos bancários e memes) com status `DISCARDED` e justificativa clara sem poluir o banco de dados. Implementação do serviço de Auditoria e Supervisão em tempo real (`ScraperAuditService`) com buffer circular de 500 eventos e endpoints dedicados (`GET /api/v1/scraper/raw/audit-logs` e `GET /api/v1/admin/scraper/audit-logs`) para inspeção de ciclo de vida por bots supervisores, humanos e agentes de IA.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/schemas/scraper-raw.schema.ts`, `server/src/services/scraper-audit.service.ts`, `server/src/controllers/scraper-raw.controller.ts`, `server/src/routes/scraper-raw.routes.ts`, `server/src/routes/admin.routes.ts`, `server/src/routes/index.ts`, `server/src/scraper/types.ts`, `server/src/scraper/image-extractor.ts`, `server/src/scraper/job-normalizer.ts`, `server/src/scraper/groq-vision.ts`, `server/src/scraper/gemini-vision.ts`

### [TEST] - 2026-10-12
- **Descrição:** Criação da suíte de testes automatizados `scraper-relevance-and-audit.test.ts` (8 testes com Vitest), cobrindo classificação de vaga direta (`Promotor de Vendas`), programa de empregabilidade social (`Instituto Inaee`), descarte semântico de não-vagas com erro tipado `DiscardedImageError`, registro de eventos de auditoria com cálculo de métricas consolidadas (latência, taxa de sucesso, contagens), busca estruturada por `traceId` para supervisores e fluxo completo do controller HTTP de ingestão de imagens em base64. Total de 27 testes unitários e de integração verdes no servidor.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/scraper-relevance-and-audit.test.ts`

### [MODIFY] - 2026-10-12
- **Descrição:** Adequação estrita à Constitution Artigo III com erradicação de tipos `any` em `server/src/utils/logger.ts`, substituídos por tipagem estrita `Record<string, unknown>` e `unknown`. Atualização dos modelos Groq Vision em `groq-vision.ts` para remoção de modelo descontinuado pelo provedor.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/utils/logger.ts`, `server/src/scraper/groq-vision.ts`

### [DOCS] - 2026-10-11
- **Descrição:** Criação do guia completo de testes ponta a ponta (`TESTING_GUIDE.md`) documentando o fluxo total: configuração de chaves (variáveis de ambiente, painel administrativo e linha de comando), execução dos testes unitários/integração com Vitest, execução do scraper via CLI (`npm run scraper:images`), ingestão direta no banco e via API HTTP, monitoramento de métricas do `AiKeyLoadBalancer` (`GET /api/v1/admin/settings/ai-pool`) e conferência visual no frontend Next.js.
- **Escopo:** `raiz`
- **Arquivos Afetados:** `TESTING_GUIDE.md`, `README.md`

### [FACT] - 2026-10-11
- **Descrição:** Implementação do Load Balancer multi-chave (`AiKeyLoadBalancer`) com estratégia Least-Inflight e Round-Robin, Circuit Breaker com Auto-Cooldown em HTTP 429 (`Too Many Requests`), detecção de chaves revogadas (401/403) e Failover transparente multinível (Groq Vision -> Gemini Vision -> Fallback Local). Suporte a múltiplas chaves cadastradas no Painel Admin (`SystemSetting`) separadas por vírgula/linhas ou via variáveis de ambiente. Endpoint administrativo `GET /api/v1/admin/settings/ai-pool` expondo métricas operacionais higienizadas (chaves mascaradas, requisições ativas, latência e status de saúde). Processamento em lote de imagens otimizado com pool assíncrono de concorrência adaptativa (`asyncPool`).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/schemas/balancer.schema.ts`, `server/src/services/ai-load-balancer.service.ts`, `server/src/services/settings.service.ts`, `server/src/routes/admin.routes.ts`, `server/src/scraper/image-extractor.ts`

### [TEST] - 2026-10-11
- **Descrição:** Adição da suíte de testes unitários `ai-load-balancer.test.ts` com Vitest, cobrindo balanceamento Least-Inflight, rotação Round-Robin, isolamento imediato por Circuit Breaker ao receber HTTP 429, recuperação automática após término do TTL de Cooldown, esgotamento por credencial inválida (401/403) e Failover de Tiers. Ajuste na configuração do Vitest (`vitest.config.mts`) para isolar testes de unidade e integração.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/ai-load-balancer.test.ts`, `server/vitest.config.mts`

### [BUGFIX] - 2026-10-11
- **Descrição:** Sincronização da asserção de cookies em `security2.test.ts` para refletir o cabeçalho `SameSite=None` definido nas rotas de autenticação (`auth.routes.ts`).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/security2.test.ts`

### [FACT] - 2026-10-11
- **Descrição:** Criação do Image Job Scraper multimodal com extração inteligente de panfletos e anúncios de emprego (WhatsApp/Redes Sociais) com 100% de taxa de sucesso. Implementação de multi-tier fallback (Groq Vision, Gemini Vision e self-healing local), normalização estrita para o schema do Agrega (`ingestJobItemSchema`), links diretos para WhatsApp e enriquecimento de benefícios e escolaridade. Adição do modelo Prisma `SystemSetting` e endpoints administrativos (`GET /api/v1/admin/settings` e `POST /api/v1/admin/settings`) delegando para `settingsService` (Constitution Art. I).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/prisma/schema.prisma`, `server/src/schemas/settings.schema.ts`, `server/src/services/settings.service.ts`, `server/src/routes/admin.routes.ts`, `server/src/scraper/image-extractor.ts`, `server/src/scraper/job-normalizer.ts`, `server/src/scraper/groq-vision.ts`, `server/src/scraper/gemini-vision.ts`, `server/src/scraper/cli.ts`, `server/src/scraper/types.ts`

### [MODIFY] - 2026-10-11
- **Descrição:** Adequação arquitetural estrita à Constitution (Artigo I e Artigo III): erradicação de tipos `any`, adoção de schema Zod `extractedImageJobDataSchema` para validação em runtime de OCR, tipagem estrita de payloads no transporte Hono e no errorHandler, e encapsulamento de consultas ao banco no `SettingsService` e `WebhookService` com zero vazamento de chamadas diretas ao Prisma a partir de rotas ou orquestradores.
- **Escopo:** `/server` e `/web`
- **Arquivos Afetados:** `server/src/scraper/groq-vision.ts`, `server/src/scraper/gemini-vision.ts`, `server/src/scraper/image-extractor.ts`, `server/src/scraper/cli.ts`, `server/src/routes/admin.routes.ts`, `server/src/middlewares/errorHandler.ts`, `web/src/app/page.tsx`, `web/src/components/SidebarFilters.tsx`

### [TEST] - 2026-10-11
- **Descrição:** Adição da suíte de testes de integração e validação de schema do Image Job Scraper (`image-scraper.test.ts`), cobrindo processamento em lote com 100% de sucesso, validação Zod de todos os campos contra o schema do Agrega, extração de benefícios/requisitos e normalização de números e links do WhatsApp.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/__tests__/image-scraper.test.ts`

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
