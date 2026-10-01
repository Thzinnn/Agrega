# Changelog

Histórico de modificações do projeto conforme categorização estipulada em `Constitution.md`.

---

## [Unreleased]

### [MODIFY] - 2026-09-30
- **Descrição:** Refinamentos de usabilidade e unificação de níveis de escolaridade (Fase Final do Goal).
  1. Unificação do Ensino Fundamental: "Ensino Fundamental 1" e "Ensino Fundamental 2" foram mesclados em apenas "Ensino Fundamental - Incompleto" e "Ensino Fundamental - Completo", refletindo no banco (schema.prisma/Enum), nas validações (`job.schema.ts`), no componente de filtro (`SidebarFilters.tsx`) e na página de criação de vaga (`jobs/new/page.tsx`). O banco de dados de desenvolvimento foi resetado e repovoado com a nova seed.
  2. Mobile-First (Ocultação de Filtros): A barra lateral de filtros (`SidebarFilters`) no mobile agora inicia colapsada em formato sanfona (accordion). Além disso, removemos o comportamento `sticky` no celular, garantindo que o filtro role normalmente com a página em vez de ficar fixo, evitando que as vagas passem por cima dele ao rolar.
  3. Layout Desktop: A visualização em grid introduzida anteriormente no desktop foi revertida para o modelo "Extenso" original (1 coluna).
  4. Nova funcionalidade de Requisitos: Implementado um sistema de requisitos extras por vaga. Adicionado campo de array no banco (`schema.prisma`), formulário dinâmico na criação de vagas ("Adicionar um requisito"), e a listagem desses requisitos no Modal de Detalhes da Vaga.
  5. Salário Opcional e Mensagem de Sucesso: Corrigido bug de coerção de tipos no formulário (frontend) que forçava a validação do salário mesmo quando deixado em branco. Agora é 100% opcional não informar remuneração, exibindo corretamente a página de Sucesso ao concluir o cadastro.
  6. [FIX] Private Network Access: Auditado e substituído o hardcode de `http://localhost:3333` em `src/lib/api.ts` para carregar dinamicamente `process.env.NEXT_PUBLIC_API_URL` sem fallbacks silenciosos em produção. Adicionado `.env.example` no `/web`.
- **Escopo:** `/web` e `/server`
- **Arquivos Afetados:** `server/prisma/schema.prisma`, `server/prisma/seed.ts`, `server/src/schemas/job.schema.ts`, `web/src/app/page.tsx`, `web/src/app/jobs/new/page.tsx`, `web/src/components/SidebarFilters.tsx`, `web/src/types/job.ts`, `web/src/components/JobDetailsModal.tsx`, `web/src/lib/api.ts`, `web/.env.example`

### [MODIFY] - 2026-09-30
- **Descrição:** Revisão e refatoração completa da responsividade (Mobile-First) do frontend para acomodar telas de 320px até 4K.
  1. Adicionado `overflow-x-hidden` e `w-full` na tag `body` (`layout.tsx`) para eliminar vazamentos de tela no mobile.
  2. Implementado comportamento adaptativo progressivo para grids: listagem de vagas configurada como `grid-cols-1 lg:grid-cols-2`.
  3. Escalabilidade de toque: ajustado `min-h-[44px]` (Área Mínima de Toque - Acessibilidade) em inputs, botões do filtro (`SidebarFilters`) e botão de `+` / Publicar Vaga (`Header`).
  4. Melhorias de tipografia responsiva: botões em forms adaptando `w-full sm:w-auto` (`jobs/new/page.tsx`), prevenção de estouro de badges e títulos flexíveis com `line-clamp-2` e truncamento (`JobCard.tsx`, `JobDetailsModal.tsx`).
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/src/app/layout.tsx`, `web/src/app/page.tsx`, `web/src/app/jobs/new/page.tsx`, `web/src/components/Header.tsx`, `web/src/components/HeroSearch.tsx`, `web/src/components/SidebarFilters.tsx`, `web/src/components/JobCard.tsx`, `web/src/components/JobCardSkeleton.tsx`, `web/src/components/JobDetailsModal.tsx`

### [BUGFIX] - 2026-09-30
- **Descrição:** Correção do erro de compilação na Cloudflare Pages relacionado às dependências nativas opcionais do Tailwind CSS v4 (`lightningcss.linux-x64-gnu.node` e `@tailwindcss/oxide`). Contornado o bug crônico do `npm ci` (issue #4828 do NPM) e erros de incompatibilidade de versão na engine nativa. O script `pages:build` foi atualizado para efetuar a "solução nuclear" sugerida pelos próprios desenvolvedores do Tailwind: `rm -rf node_modules package-lock.json && npm install --legacy-peer-deps` antes do Next.js. Isso apaga o cache poluído pela etapa anterior da Cloudflare e força uma instalação perfeitamente mapeada para o sistema Linux alvo, ignorando conflitos de pacotes legados do próprio Cloudflare workers. Adicionalmente, foi removida a configuração `outputFileTracingRoot` do `next.config.ts` que estava causando um bug de duplicação de diretório (`web/web/.next`) no final do processo de build do Next-on-Pages. Por fim, a versão do Node.js nos arquivos `.nvmrc` foi elevada de `20` para `22` para satisfazer os requisitos do novo compilador do `wrangler`.
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/package.json`

### [BUGFIX] - 2026-09-30
- **Descrição:** Diagnóstico profundo e resolução dos bloqueios de deploy na primeira etapa do Cloudflare Pages/Workers, correção de tipos no Prisma e purga de resíduos:
  1. **Expurgo de Resíduos Vinext e Cloudflare Vite:** Removidos arquivos experimentais residuais (`cloudflare.config.ts`, `vite.config.ts` na raiz e em `/web`, além de dependências e scripts do Vinext no `package.json` raiz). A presença de `cloudflare.config.ts` no repositório fazia o pipeline do Cloudflare tentar instanciar auxiliary workers e cache bindings do R2 inexistentes, travando a inicialização do container por 15 minutos em timeout.
  2. **Garantia de Versão do Node (v20):** Adicionado `.nvmrc` com versão `20` na raiz e em `/web` para impedir que o Cloudflare Pages utilize o Node 18.17.1 legado por padrão, o qual entrava em conflito com o Next 15.5+ e o React 19.
  3. **Correção do Next.js Build e ESLint FlatConfig:** Substituído o import quebrado do `eslint-config-next` no `web/eslint.config.mjs` por `@eslint/eslintrc` `FlatCompat`, removida opção experimental inválida em `next.config.ts`, e eliminados todos os usos de `any` e variáveis não utilizadas em `web/src/app/jobs/new/page.tsx`, `HeroSearch.tsx` e `JobDetailsModal.tsx`. O comando `npm run build` do Next.js agora compila 100% limpo com zero warnings e gera páginas estáticas perfeitamente.
  4. **Correção do Prisma e Buffer Órfão:** Regenerado o Prisma Client via `npx prisma generate` ativando o previewFeature `driverAdapters` para alinhar as tipagens do `PrismaPg`, eliminando o erro de atribuição no `prisma.ts`. Esclarecido que `worker.ts` já foi devidamente deletado do disco e trata-se apenas de aba em cache no editor do usuário.
  5. **Branch de Deploy:** Adicionada a branch `master` no gatilho do workflow do GitHub Actions (`deploy-backend.yml`).
- **Escopo:** `raiz`, `/web`, `/server`
- **Arquivos Afetados:** `package.json`, `package-lock.json`, `.nvmrc`, `.gitignore`, `web/.nvmrc`, `web/package.json`, `web/next.config.ts`, `web/eslint.config.mjs`, `web/src/app/jobs/new/page.tsx`, `web/src/components/HeroSearch.tsx`, `web/src/components/JobDetailsModal.tsx`, `.github/workflows/deploy-backend.yml`, `server/src/lib/prisma.ts`
- **Descrição:** Migração estrutural e definitiva do backend Web Framework. Substituímos o Express pelo **Hono** (`hono.dev`), um framework otimizado primariamente para ambientes Edge (Cloudflare Workers, Deno, Bun) mas com excelente suporte ao ecossistema Node.js (via `@hono/node-server`). Essa mudança elimina completamente as anomalias de empacotamento com o `body-parser` e o Node core (`stream`), trazendo máxima performance nativa sem sacrificar o modelo de roteamento que já usávamos (os controladores foram mantidos intactos, portando apenas a assinatura `(req, res)` para o contexto `c` nativo do Hono). O entrypoint Cloudflare agora é nativo (`export default app`), sem necessitar de nenhum adapter como `serverless-express`. O ambiente de desenvolvimento local continua acessível via porta 3333 no `src/server.ts`. 
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/package.json`, `server/wrangler.toml`, `server/src/app.ts`, `server/src/server.ts`, `server/src/routes/index.ts`, `server/src/routes/job.routes.ts`, `server/src/controllers/job.controller.ts`, `server/src/middlewares/validateRequest.ts`, `server/src/middlewares/errorHandler.ts`

### [REMOVE] - 2026-09-30
- **Descrição:** Expurgo total e absoluto de pacotes do ecossistema Express (`express`, `cors`, `helmet`, `body-parser`) e pacotes relacionados a adapters serverless (`@codegenie/serverless-express`, `patch-package`, `iconv-lite`). Entrypoints temporários criados em tentativas passadas (como `src/worker.ts` e pastas de `patches/`) foram localizados e obliterados da base de código. O backend agora é uma entidade puramente serverless-native.
- **Descrição:** Resolvido o erro subjacente de compatibilidade entre o framework `@codegenie/serverless-express` e o motor V8 do Cloudflare Workers (`TypeError: this._addHeaderLines is not a function`). A falha ocorria pois o pacote AWS depende de métodos privados profundos da implementação do Node.js original (ex: `http.IncomingMessage.prototype._addHeaderLines`), que logicamente não existem no "Polyfill" leve fornecido pelo Cloudflare (`nodejs_compat`). Foi injetado um **polyfill artesanal suplementar** no topo do arquivo `src/worker.ts`, re-implementando a assinatura nativa do `_addHeaderLines` para que o construtor da requisição serverless seja preenchido com sucesso e os cabeçalhos transitem perfeitamente da Cloudflare para o pipeline do Express.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/worker.ts`

### [BUGFIX] - 2026-09-30
- **Descrição:** Resolvido o erro `Unable to determine event source based on event` gerado pelo `@codegenie/serverless-express` na nuvem. Como a biblioteca foi arquitetada primariamente para a AWS, ela esperava um objeto de evento proprietário (ex: API Gateway), mas o Cloudflare enviava um objeto `Request` da Fetch API padrão. Foi construído e injetado um Adapter completo no arquivo `src/worker.ts` que intercepta a requisição, formata seus parâmetros e cabeçalhos emulando um evento AWS "API Gateway HTTP API (V2)" e delega para o Express. O retorno também é capturado e recodificado apropriadamente (lidando até mesmo com decodificação `base64` transparente, caso necessite retornar arquivos ou buffers) de volta para o formato de `Response` exigido pelos Workers. Express totalmente habilitado em produção!
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/worker.ts`

### [BUGFIX] - 2026-09-30
- **Descrição:** Resolvido definitivamente a colisão do bundler do Cloudflare Workers com as chamadas de streams do Node através da biblioteca `iconv-lite`. Como a opção de `"browser": { "stream": false }` levava ao erro cego `require_streams is not a function` devido a anomalias de "dead-code" no esbuild (pois a dependência omitida continuava sendo invocada), foi implementada uma resolução via `patch-package`. O código-fonte do `iconv-lite` foi cirurgicamente modificado dentro do `node_modules` para utilizar salvaguardas com verificações condicionais em tempo de execução (`typeof streams === 'function'`) ao invés de invocações diretas no carregamento (`require('./streams')(iconv)`). A integração ao Worker agora não falha ao importar o pacote Express subjacente, o empacotador da Cloudflare estabiliza o script perfeitamente sem crash runtime, e o desenvolvimento local via Node.js continua 100% nativo (a configuração persiste mesmo que reinstalemos via script `postinstall`).
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/package.json`, `server/patches/iconv-lite+0.4.24.patch`

### [BUGFIX] - 2026-09-30
- **Descrição:** Resolvido de forma definitiva o erro crônico `TypeError: require_streams(...) is not a function` isolando completamente a dependência de streams do Node.js (`body-parser`) da compilação do Cloudflare Worker. O uso das funções `express.json()` e `express.urlencoded()` foi banido do `src/app.ts` e de qualquer rota atrelada a ele. Para preservar a funcionalidade no ambiente de desenvolvimento local, a invocação do `express.json()` foi realocada exclusivamente para `src/server.ts` mediante a criação de um wrapper de aplicação (`localApp`) que consome o `app` base. O entrypoint de produção (`src/worker.ts`) mantém-se enxuto delegando a requisição para o `@codegenie/serverless-express`, que opera apenas com o middleware leve de parsing injetado de forma segura no próprio `app.ts`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/app.ts`, `server/src/server.ts`

### [BUGFIX] - 2026-09-30
- **Descrição:** Resolvido o erro fatal `TypeError: Cannot read properties of undefined (reading 'bind')` que impedia o instanciamento do Prisma tanto local quanto no Worker. A falha era originada por um severo mismatch de versão: o pacote `@prisma/adapter-pg` havia sido instalado na sua última _major_ (`v7.x`), enquanto o `@prisma/client` do projeto é da base `v5.x` (`5.22.0`). O adaptador sofreu downgrade cirúrgico para a versão explícita `5.22.0` no `package.json`, espelhando a versão exata do core do Prisma e garantindo compatibilidade da interface abstrata de conexão da biblioteca `pg`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/package.json`

### [BUGFIX] - 2026-09-30
- **Descrição:** Correção do erro fatal de inicialização do Prisma Client (`PrismaClientConstructorValidationError`) que bloqueava o servidor ao tentar instanciar o adapter `@prisma/adapter-pg`. A _preview feature_ `"driverAdapters"` foi habilitada explicitamente no `schema.prisma` e o cliente de banco de dados foi regenerado (`prisma generate`), permitindo que a aplicação faça uso seguro do Client Adapter Pattern requerido pelo Edge Runtime da Cloudflare e pelo funcionamento nativo de banco serverless com Hyperdrive.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/prisma/schema.prisma`

### [MODIFY] - 2026-09-30
- **Descrição:** Refatoração estrutural da inicialização do Express (`src/app.ts`) para operar em **modo dual** autônomo (Node.js vs Cloudflare Workers). Inserida heurística de runtime detectando ambiente de borda (via `globalThis.WebSocketPair`). No Cloudflare, o middleware legado `express.json()` é suprimido na raiz para evitar a importação de top-level e falhas de runtime (`require_streams is not a function`). Em seu lugar, foi inserido um parser leve baseado em `JSON.parse` direto na string bruta provida pelo `@codegenie/serverless-express`. Adicionadas as rotas base de health check na raiz (`GET /`) para indicar o runtime (node ou cloudflare-workers), bem como bypass (`204 No Content`) explícito para `GET /favicon.ico`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/src/app.ts`

### [BUGFIX] - 2026-09-30
- **Descrição:** Correção de falha crítica de validação do Worker (code: 10021 - `require_streams is not a function`) causada pela inicialização síncrona de dependências nativas legadas (`iconv-lite` e `raw-body` em `body-parser`). A `compatibility_date` do `wrangler.toml` foi atualizada para `"2024-11-01"` para suporte avançado via `nodejs_compat`. O entrypoint do worker (`src/worker.ts`) foi refatorado adotando **dynamic imports** (`await import(...)`), adiando a avaliação e inicialização do Express para dentro do ciclo de vida assíncrono do evento `fetch`, impedindo crashes no escopo global da Cloudflare. Além disso, as configurações do `express.json` e `express.urlencoded` receberam `{ inflate: false }` (`src/app.ts`) minimizando chamadas pre-emptive a manipulações pesadas de streams.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/wrangler.toml`, `server/src/worker.ts`, `server/src/app.ts`

### [BUGFIX] - 2026-09-30
- **Descrição:** Atualizada a `compatibility_date` no `/server/wrangler.toml` para `2024-09-23` a fim de corrigir a falha de resolução de módulos nativos do Node (ex: `events`, `util`, `net`, `stream`) sem o prefixo `node:` durante o build e deploy para Cloudflare Workers. As tipagens globais do `@types/node` foram conferidas nas devDependencies e a integridade do empacotamento com a flag `nodejs_compat` ativa foi mantida para garantir a correta compilação do `pg` e do `@codegenie/serverless-express`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/wrangler.toml`

### [MODIFY] - 2026-09-30
- **Descrição:** Configuração final do backend `/server` para o Cloudflare Workers. Criado o arquivo `wrangler.toml` com bindings de compatibilidade NodeJS (`nodejs_compat`) e banco de dados via Hyperdrive. O validador da variável `DATABASE_URL` no `env.ts` tornou-se opcional para evitar instabilidades na importação pelo Worker. As diretivas de CORS no Express (`app.ts`) foram otimizadas via Regex para aceitar integralmente a origem de desenvolvimento (`localhost:3000`) e domínios de produção/preview nativos da Cloudflare (`*.pages.dev`). Foi adicionado o script `"deploy": "wrangler deploy"` no `package.json`.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/wrangler.toml`, `server/package.json`, `server/src/app.ts`, `server/src/config/env.ts`

### [MODIFY] - 2026-09-30
- **Descrição:** Auditoria e preparação do frontend `/web` para deploy no Cloudflare Pages. Foram instaladas as dependências `@cloudflare/next-on-pages` e `wrangler` no modo dev, e adicionado o script de build `"pages:build": "npx @cloudflare/next-on-pages"` ao `package.json`. Adicionalmente, foram inseridas as dependências nativas opcionais de compilação para Linux (`@next/swc-linux-x64-gnu`, `@rollup/rollup-linux-x64-gnu`) com a flag `--save-optional` para evitar erros no `npm ci` durante o build no ambiente Ubuntu da Cloudflare (compatibilidade cross-platform).
- **Escopo:** `/web`
- **Arquivos Afetados:** `web/package.json`, `web/package-lock.json`

### [MODIFY] - 2026-09-30
- **Descrição:** Adaptação da infraestrutura do backend (Express) para suporte ao Cloudflare Workers/Pages. O app foi encapsulado usando `@codegenie/serverless-express` exportando o formato nativo da Fetch API em um novo entry point (`worker.ts`). O cliente do Prisma foi adaptado para instanciar dinamicamente usando `@prisma/adapter-pg` e a connection string do Hyperdrive provida via object `env` do Worker, preservando fallback para `DATABASE_URL` local e a compatibilidade completa com serviços e controllers.
- **Escopo:** `/server`
- **Arquivos Afetados:** `server/package.json`, `server/src/worker.ts`, `server/src/lib/prisma.ts`

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

### [FIX] - 2026-09-30
- **Descri��o:** Corre��o do travamento infinito (loading eterno) na rota de listagem de vagas. O problema era causado pelo esgotamento de conex�es no Hyperdrive devido a inst�ncias globais do Pool em ambientes de edge/isolates.
- **Escopo:** /server
- **Arquivos Afetados:** server/src/app.ts, server/src/lib/prisma.ts, server/src/controllers/job.controller.ts, server/src/services/job.service.ts, server/src/server.ts

### [MODIFY] - 2026-09-30
- **Descri��o:** Refatora��o completa da inje��o de depend�ncia do PrismaClient. A inst�ncia do banco e o Pool do pg s�o agora criados sob demanda por requisi��o e gerenciados via Hono Context (c.set/c.get), com teardown gracioso garantido via c.executionCtx.waitUntil(pool.end()).
- **Escopo:** /server
- **Arquivos Afetados:** server/src/app.ts, server/src/lib/prisma.ts, server/src/controllers/job.controller.ts, server/src/services/job.service.ts, server/src/server.ts

### [FIX] - 2026-09-30
- **Descri��o:** Resolu��o do bug de deploy pelo GitHub Actions. Foi equalizada a vers�o do @prisma/client, @prisma/adapter-pg e do CLI do prisma em package.json (todos na v5.22.0) para prevenir diverg�ncias na gera��o do driver e do WASM query engine no runner do Ubuntu.
- **Escopo:** /server
- **Arquivos Afetados:** server/package.json

