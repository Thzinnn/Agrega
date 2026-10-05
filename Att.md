# Plano: Webhooks de Entrada Configuráveis (Atualização Automática de Vagas)

## 1. Diagnóstico do projeto

Monorepo `server/` (Hono + Prisma + Neon, Cloudflare Workers) e `web/` (Next.js). O backend já segue `Rotas -> Middlewares -> Controllers -> Services`.

| Achado | Impacto no plano |
|---|---|
| Não existe nenhum webhook hoje. | Construir do zero. |
| `POST /api/v1/jobs/ingest` é autenticado por `x-api-key` (chave única global, `SCRAPER_API_KEY`). | Serve de base. O `ingestJobs` (upsert por `sourceJobId`) será reaproveitado. |
| `csrfMiddleware` roda em `*` e exige `Origin`/`Referer` em todo POST. | Chamadas servidor-a-servidor não enviam `Origin` e tomam 403. O webhook precisa de bypass explícito. |
| `ingestJobs` aceita item inválido em silêncio (descarta sem informar). | O webhook deve devolver `received/processed/rejected` com motivos. |
| Rate limiter é em memória, por isolate. | Aceitável como primeira barreira. Idempotência e HMAC são a defesa real. |
| `ingest` usa `any[]` e comparação simples de chave (`!==`). | Não vou mexer (blast radius). O webhook novo usa tipos estritos e comparação em tempo constante. |
| `wrangler.toml`, `next.config.ts`, `.nvmrc` e `web/package.json` são protegidos pela Constitution. | Você respondeu "seguir o padrão", então **não serão tocados**. |

> [!WARNING]
> Possível bug existente: `/jobs/ingest` também passa pelo CSRF. Se o robô Python não envia `Origin`, ele já toma 403 em produção. Vale confirmar. Não vou alterar sem você pedir.

## 2. Decisões (suas respostas)

- Tipo: **webhooks de entrada** com assinatura HMAC.
- Configuração: **painel `/admin/webhooks` + CRUD na API**, salvo no banco (nova tabela Prisma).
- Ação coberta: **upsert de vagas** por `sourceJobId`. O handler será um registro de eventos, então `job.deactivate` etc. entram depois sem retrabalho.
- Infra: sem mudanças em `wrangler.toml`.

## 3. Contrato do endpoint (o "redondinho")

```
POST /api/v1/webhooks/receive/:webhookId
Headers:
  X-Agrega-Timestamp: <unix seconds>
  X-Agrega-Signature: sha256=<hex>
  X-Agrega-Delivery:  <id único da entrega>   (idempotência)
Assinatura = HMAC_SHA256(secret, `${timestamp}.${rawBody}`)
Body: { "event": "job.upsert", "jobs": [ ...mesmo formato do ingest... ] }
```

| Situação | Status | Corpo |
|---|---|---|
| Webhook inexistente | `404` | `{success:false,message}` |
| Webhook desativado | `403` | idem |
| Header ausente ou timestamp fora de ±5 min | `401` | idem |
| Assinatura inválida (comparação em tempo constante) | `401` | idem |
| Entrega repetida (`X-Agrega-Delivery`) | `200` | `{success:true,duplicate:true}` |
| JSON inválido ou evento desconhecido | `400` | `{success:false,message,errors?}` |
| Sucesso | `200` | `{success:true,data:{received,processed,rejected:[{index,reason}]}}` |

O padrão de resposta segue o do projeto (`{ success:false, message, errors? }`).

## 4. Backend (`/server`)

### Banco (Prisma, migration nova)
- `Webhook`: `id`, `name`, `secret`, `event` (`job.upsert`), `isActive`, `totalReceived`, `lastReceivedAt`, `lastStatus`, `createdAt`, `updatedAt`.
- `WebhookDelivery`: `id`, `webhookId` (FK, cascade), `deliveryId` (`@@unique([webhookId, deliveryId])`), `status` (`SUCCESS | FAILED | REJECTED`), `processed`, `error`, `createdAt`.
- O segredo fica em texto no banco (HMAC precisa do valor bruto). Ele é exibido **uma vez** na criação e na rotação, e nunca volta em listagens.

### Camadas
```
routes/webhook.routes.ts            -> receive (público, HMAC) 
routes/admin.routes.ts              -> CRUD em /admin/webhooks (JWT + ADMIN, já existente)
middlewares/webhookSignature.ts     -> valida timestamp, HMAC e idempotência
controllers/webhook.controller.ts   -> HTTP e status codes
services/webhook.service.ts         -> CRUD, rotação de segredo, logs de entrega
services/webhook.handlers.ts        -> registro { 'job.upsert': handler } reusando jobService.ingestJobs
schemas/webhook.schema.ts           -> Zod (payload, criar/editar webhook)
utils/hmac.ts                       -> sign/verify via Web Crypto (funciona em Workers e Node 20)
```

### Endpoints de administração (`/api/v1/admin/webhooks`)
| Método | Rota | Função |
|---|---|---|
| GET | `/` | Lista (sem segredo) |
| POST | `/` | Cria e devolve o segredo uma vez |
| PUT | `/:id` | Edita nome, evento, ativo |
| POST | `/:id/rotate-secret` | Gera novo segredo |
| DELETE | `/:id` | Remove |
| GET | `/:id/deliveries` | Últimas entregas e status |

### Segurança
- `csrfMiddleware`: bypass **somente** para o prefixo `/api/v1/webhooks/receive/` (a autenticação ali é a assinatura). Teste garante que o resto continua bloqueado.
- Rate limit de 120 req/min por IP no `receive`.
- Limite de tamanho do body (ex.: 1 MB) antes do parse.
- Zod nos payloads e proibição de `any`, conforme a Constitution.
- Logs via `logger`, sem registrar segredo nem corpo completo.

## 5. Frontend (`/web`)

- Nova página `app/admin/webhooks/page.tsx`, no mesmo padrão das páginas Admin atuais (tabela, `ConfirmModal`, toasts, Tailwind azul).
- Componentes de apresentação puros (props `data/state/actions`): `WebhookTable`, `WebhookFormModal`, `SecretRevealModal` (copiar segredo, aviso "só aparece uma vez"), `DeliveryLogDrawer`.
- Item "Webhooks" no menu do `admin/layout.tsx`.
- Tipos em `web/src/types/webhook.ts`, sincronizados com o Prisma.
- Bloco "Como integrar" na UI com URL pronta e um exemplo de assinatura em Python.

## 6. Ordem de execução (TDD Red → Green → Refactor)

1. **Red**: testes Vitest em `server/src/__tests__/webhook.test.ts`:
   - HMAC válido e inválido.
   - Timestamp expirado.
   - Replay (mesmo `X-Agrega-Delivery`).
   - Webhook inativo ou inexistente.
   - Payload inválido.
   - CSRF não bloqueia `receive`, mas continua bloqueando as demais rotas.
   - Segredo nunca aparece na listagem.
2. **Green**: `utils/hmac`, schema Prisma + migration, service, middleware, controller, rotas.
3. **Refactor**: reduzir duplicação com o `ingest`. Mantenho o `ingest` intacto, só extraio o helper de parse se for seguro.
4. Frontend: testes de componentes, depois a página e o menu.
5. Rodar `tsc --noEmit` (server e web), `vitest` e `next build`.
6. **Docs**: `README.md` (seção Webhooks com exemplo de assinatura) e `server/.env.example`.
7. **CHANGELOG** `[Unreleased]`: um `[MODIFY]` cobrindo as duas camadas, com justificativa (exigido pela Constitution), mais `[TEST]` e `[DOCS]`.

## 7. Fora do escopo (posso fazer depois)

- Webhooks de saída e de deploy.
- Eventos de desativar, reprocessar e sincronizar filtros.
- Correção do `ingest` (CSRF, tipagem `any`).
- Rate limit distribuído (KV/Durable Object), que exigiria mexer no `wrangler.toml`.



## Pontos confirmados pelo usuário

1. O robô Python já funciona no `/jobs/ingest` em produção? Isso me diz se o CSRF está de fato bloqueando.

Resposta: Sim, ele está sendo bloqueado neste exato momento pelo CSRF! O motivo: Em server/src/app.ts, nós aplicamos o app.use('*', csrfMiddleware) de forma global. Quando o seu script Python (usando requests ou urllib) tenta dar o POST, ele não envia os headers de navegação (Origin ou Referer). Como o nosso csrfMiddleware exige explicitamente que o Origin/Referer bata com a lista de domínios permitidos (http://localhost:3000 ou *.pages.dev), a requisição do Python é sumariamente morta com erro 403 Acesso bloqueado por segurança (Missing Origin/Referer).

2. Ok manter apenas `job.upsert` na v1?

Resposta: Sim, é mais do que OK, é a melhor prática para V1! O motivo: O upsert (Update or Insert) torna o seu robô Python Idempotente. Se o script raspar o mesmo site de vagas duas vezes por acidente e mandar os mesmos dados pro Backend, o Prisma não vai crashar com Unique Constraint Error e nem vai criar vagas duplicadas sujando o banco. Ele simplesmente fará um update da vaga existente (ou ignorará se nada mudou). É a estratégia perfeita, robusta e barata para sincronização de dados externos.

3. Ok o segredo em texto no banco (exibido uma vez)? A alternativa é criptografá-lo com `JWT_SECRET`, o que dá um pouco mais de trabalho.

Resposta: Para a V1 (MVP), sim, é aceitável pelo baixíssimo risco (na pior das hipóteses, alguém descobre a chave e insere vagas de graça no seu site, o que não vaza dados de usuários). A abordagem arquitetural correta (para o futuro): Você mencionou "criptografar com JWT_SECRET", mas a abordagem real de mercado para API Keys não é a Criptografia reversível, e sim o Hashing Irreversível. Assim como fazemos com as senhas dos Admins, você mostraria o Token de API em texto puro apenas 1 vez na tela do Admin (quando ele gera a chave) e o banco de dados salvaria apenas um Hash do bcryptjs. Quando o script Python batesse no /ingest, você faria bcrypt.compare(apiKeyRecebida, hashNoBanco). É simples, não requer chaves de encriptação e é 100% seguro contra vazamento do banco de dados!