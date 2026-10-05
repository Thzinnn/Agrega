# Agrega - Plataforma de Agregação de Vagas

O **Agrega** é um buscador avançado de vagas e talentos desenhado para escalar no *Edge*. Construído sob uma arquitetura de monorepo, o projeto separa rigidamente as responsabilidades entre uma API serverless de ultra-baixa latência e uma interface client-side dinâmica, reativa e Otimizada para SEO.

Projetado do zero para ser "Production-Ready", o Agrega vai além de um simples CRUD, incorporando defesa em profundidade, resiliência de dados e automação de operações de infraestrutura.

---

## 🚀 Visão Geral e Stack Tecnológico

A plataforma roda majoritariamente no ecossistema da **Cloudflare** (Pages & Workers) e no banco de dados Serverless **Neon PostgreSQL**.

### 💻 Frontend Corporativo (`/web`)
- **Framework:** Next.js (App Router) otimizado para SSR e SEO.
- **Linguagem:** TypeScript estrito.
- **Interface e UI:** Tailwind CSS, Radix UI e Framer Motion para microinterações (modais com `layoutId`).
- **Resiliência:** Skeletons globais, Boundaries de Erro defensivos (`global-error.tsx`, `error.tsx`) e página `not-found.tsx` alinhados com a marca.
- **Validação Isolada:** Zod + React Hook Form garantem que payloads incorretos sequer batam na rede.

### ⚙️ Engine da API (`/server`)
- **Runtime:** Hono (desenhado para Cloudflare Workers, suportando Web Standards puros).
- **ORM & DB:** Prisma conectado via Edge Adapter ao PostgreSQL do Neon.
- **Validação Nativa:** Esquemas Zod validam rigorosamente inserções massivas, regras lógicas (ex: `salario_min` < `salario_max`) e bloqueiam "Mass Assignments".
- **Logs:** Utilitário interno de logs padronizados em JSON estruturado para fácil ingestão via DataDog/Cloudflare.

---

## 🛡️ Defesa e Segurança (Hardening)

O Agrega possui camadas estritas de mitigação contra vulnerabilidades Top 10 OWASP:
- **Zero LocalStorage (Anti-XSS/Hijacking):** Autenticação trafega exclusivamente em sessões via **Cookies HTTP-Only**, `Secure` e `SameSite=Lax`.
- **Prevenção de CSRF:** Middleware de servidor que impõe a presença cruzada dos cabeçalhos `Origin` e `Referer` em rotas de mutação (`POST`, `PUT`, `DELETE`).
- **Isolamento de Uploads:** Arquivos passando pela API são escaneados por "Magic Bytes" reais, limitados a 5MB, blindando a hospedagem de execução de malware disfarçados de imagem.
- **Headers Blindados:** Injeção via `next.config.ts` mitigando iframing abusivo (`X-Frame-Options: DENY`), mime sniffing (`nosniff`) e políticas rigorosas de referência.
- **Rate Limiting:** Contenção de requisições maliciosas utilizando identificadores de IP, impedindo brute-forces em endpoints sensíveis e no login do administrador.

---

## ☁️ Deploy e Operação (Production-Grade)

Sendo concebido para rodar no Edge, a gerência é atômica:

### 1. Staging e Ambientes (CI/CD)
Toda PR gera uma URL única de Preview via Cloudflare Pages.
O gerenciamento de segredos para a API no Cloudflare Worker é feito via CLI:
```bash
npx wrangler secret put DATABASE_URL
```

### 2. Recuperação de Desastres (PITR)
Nenhum script frágil de `pg_dump` é utilizado. O Neon gerencia **Point-In-Time Recovery (PITR)**. Se o banco de dados for corrompido, a equipe de operações consegue restaurar o DB para qualquer milissegundo do passado usando a aba "Restore" no painel.

### 3. Estratégia de Rollback
As regressões de software são mitigadas com reversão instantânea:
- **Frontend:** Acesse o painel do Cloudflare Pages e promova a build anterior com "Retry deployment".
- **Backend:** Retrações na API são atômicas e demoram milissegundos via:
  ```bash
  npx wrangler rollback <DEPLOY_ID>
  ```

### 4. Gestão Administrativa
O painel (`/admin`) suporta operações retroativas assíncronas (via `ctx.waitUntil` do Cloudflare).
*Nota:* Por segurança, **não existe** "Esqueci minha senha" por e-mail para o administrador master. Em caso de bloqueio, o DB Admin deve se conectar ao Neon e atualizar o Hash via bcrypt, ou usar o script restrito via CLI local: `npx tsx src/scripts/seed.ts`.

---

## 🧪 Suíte de Testes (TDD Rigoroso)

O Agrega obedece um fluxo contínuo de **Red-Green-Refactor**. O deploy na main é atrelado ao sucesso de três frentes de testes (Vitest):
1. **Regras de Negócio e Parser (`verify.ts`):** Garante a pureza e precisão dos parsers (ex: busca com filtragem multi-variáveis ou rejeição de URLs inválidas de candidaturas).
2. **Segurança Ofensiva (`security.test.ts`):** Tenta invadir ativamente a API (Mass assignment, bypasses de upload, injeções `javascript:`) para confirmar que os middlewares barram o tráfego.
3. **Frontend (Componentes e UI):** Afere a renderização fiel do Tailwind e do Radix sem comprometer interatividade.

---

## 🛠️ Executando Localmente (Para Desenvolvedores)

Se precisar testar a aplicação em um ambiente de desenvolvimento isolado:

**1. Dependências Iniciais**
- Node.js (V20+) e npm install.
- String de conexão PostgreSQL (Crie uma branch gratuita no Neon.tech).

**2. Setup de Variáveis**
Crie um `.env` dentro da pasta `/server`:
```env
DATABASE_URL="postgresql://user:pass@host/dev-branch?sslmode=require"
JWT_SECRET="segredo_super_seguro_dev"
```

**3. Migrations e Seed**
Sincronize o banco local e crie os dados base do projeto (inclui o usuário admin e colunas dinâmicas):
```bash
cd server
npx prisma db push
npm run seed
```

**4. Subindo o Monorepo**
Na raiz do repositório, rode o comando abaixo. Ele subirá o Front e a API simulando o *Cloudflare Workers* através do Wrangler local.
```bash
npm run dev
```

- **Frontend (Next):** [http://localhost:3000](http://localhost:3000)
- **Backend (Hono):** [http://localhost:3333](http://localhost:3333)

> O monitoramento de estado de sistema e todas as atualizações sistêmicas de engenharia seguem o documento de registro [CHANGELOG.md](./CHANGELOG.md).

## 🪝 Integração via Webhooks (Scrapers e Sistemas Externos)

A partir da V1, a ingestão de vagas por scrapers Python (ou qualquer outro sistema) deve ser feita via **Webhooks de Entrada**.

### Como Integrar
1. Acesse o Painel Admin > **Webhooks**.
2. Clique em **+ Novo Webhook**. Preencha o nome (ex: "Scraper Python").
3. Salve o **Secret HMAC** exibido. Ele é exibido *apenas uma vez*.
4. No seu Scraper, você enviará um `POST` para `/api/v1/webhooks/receive/:webhookId` assinando a carga útil (`body`) usando HMAC-SHA256 e a sua chave secreta.

### Exemplo em Python

```python
import time
import hmac
import hashlib
import uuid
import requests
import json

WEBHOOK_ID = "SEU_WEBHOOK_ID"
SECRET = "whsec_SUA_CHAVE_AQUI"
URL = f"https://sua-api.com/api/v1/webhooks/receive/{WEBHOOK_ID}"

payload = {
    "event": "job.upsert",
    "jobs": [
        {
            "id_vaga": "py-123",
            "titulo": "Desenvolvedor Python",
            "empresa": "Tech Solutions",
            "link_vaga": "https://tech.com/vagas/123",
            "descricao": "Vaga para atuar com Python e Django."
        }
    ]
}

# 1. Serializar JSON minimizado (sem espaços)
raw_body = json.dumps(payload, separators=(',', ':'))

# 2. Gerar Headers de Segurança
timestamp = str(int(time.time()))
delivery_id = str(uuid.uuid4())

# 3. Assinar o payload: timestamp + raw_body
message = f"{timestamp}.{raw_body}".encode('utf-8')
signature = hmac.new(SECRET.encode('utf-8'), message, hashlib.sha256).hexdigest()

headers = {
    "Content-Type": "application/json",
    "X-Agrega-Timestamp": timestamp,
    "X-Agrega-Signature": f"sha256={signature}",
    "X-Agrega-Delivery": delivery_id
}

resp = requests.post(URL, data=raw_body, headers=headers)
print(resp.status_code, resp.json())
```

Isso garante que:
- Replay Attacks são prevenidos através do bloqueio de `delivery_id` repetido e limite de relógio (±5 min).
- Apenas sistemas com a posse do segredo podem adicionar vagas (HMAC Signature Check).
- O CSRF é contornado de maneira controlada, sem abrir a API pública para vulnerabilidades web.
