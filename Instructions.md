# Master Prompt: Agregador de Vagas (Monorepo Full Stack)

## 1. Visão Geral e Arquitetura do Repositório
Você é um engenheiro de software full stack sênior e irá implementar uma plataforma de agregação e busca de vagas de emprego.
O projeto utiliza a arquitetura **Monorepo** simples com duas aplicações principais na raiz:

```text
vagas-aggregator/
├── package.json           # Orquestração de scripts (concurrently)
├── .gitignore
├── server/                # Backend (Hono + TypeScript + Prisma + PostgreSQL + Cloudflare Workers)
└── web/                   # Frontend (Next.js App Router + TypeScript + Tailwind CSS)

2. Stack Tecnológica Obrigatória
Backend (/server)
Runtime & Linguagem: Node.js com TypeScript

Framework HTTP: Hono (Edge/Cloudflare Workers Native)

Banco de Dados & ORM: PostgreSQL com Prisma ORM

Validação de Schemas: Zod

Segurança & CORS: hono/cors, dotenv

Frontend (/web)
Framework: Next.js (App Router, Server Components para páginas e SSR de SEO)

Linguagem: TypeScript

Estilização: Tailwind CSS

Animações & Transições: Framer Motion (para transição suave do Card -> Modal via layoutId)

Formulários: React Hook Form + @hookform/resolvers/zod

Ícones: Lucide React

Cliente HTTP: Fetch nativo ou cliente centralizado em /lib/api.ts

3. Diretrizes Rígidas de Desenvolvimento
Tipagem Estrita: Proibido o uso de any. Tipagens de entidades devem ser consistentes entre API e Web.

Separação em Camadas no Backend:

controllers/: Recebimento de requisições, parsing e respostas HTTP com status corretos.

services/: Regras de negócio, filtros dinâmicos e paginação.

repositories/ ou instância centralizada do Prisma Client em src/lib/prisma.ts.

middlewares/: Validação com Zod e manipulador central de erros.

Padrão de Resposta da API:

Sucesso com paginação: { data: [...], meta: { total, page, totalPages, limit } }

Erro: { success: false, message: string, errors?: string[] }

UX do Frontend:

Mobile-first e responsivo.

Sincronização dos filtros de busca diretamente na URL (?q=...&level=...&workplace=...).

Estados explícitos de carregamento (Skeletons), estado vazio (nenhuma vaga encontrada) e tratamento de erros.

4. Especificações de Design e Interface (UI/UX)
Estrutura Visual da Página Principal (/)
Header & Hero:

Barra superior com logo, links de navegação e botão para publicar/inserir vaga.

Barra de busca com dois inputs integrados: busca textual ("Cargo ou empresa") e localização ("Cidade ou estado"), acompanhados de botão primário de ação.

Layout em 2 Colunas (Desktop):

Coluna Esquerda (Sidebar de Filtros estilo Mercado Livre):

Toggles rápidos (ex.: "Apenas Remoto", "Com salário informado").

Filtros colapsáveis com checkboxes ou links de seleção: Tipo de Contrato (CLT, PJ, Estágio), Nível (Júnior, Pleno, Sênior, etc.) e Faixa Salarial (inputs de mínimo e máximo com botão de confirmação).

No Mobile: Esta barra lateral deve ser recolhida em um botão "Filtros" que aciona uma gaveta deslizante (Drawer / Sheet).

Coluna Direita (Feed de Vagas):

Cabeçalho exibindo total de oportunidades encontradas e seletor de ordenação ("Mais recentes", "Mais relevantes").

Lista vertical de cards de vagas.

Comportamento do JobCard:

Visual Fechado (Resumo do Card):

Título da vaga destacado em negrito.

Nome da empresa e Cidade/Estado com ícone ou avatar da empresa à esquerda.

Tag de Destaque Verde (bg-emerald-50 text-emerald-700 border border-emerald-200): Destinada exclusivamente ao salário ou aos principais benefícios/modelo de remuneração.

Badges secundárias discretas para modalidade (Remoto, Híbrido, Presencial) e tipo de contratação (CLT, PJ).

Data relativa de publicação ("há 2h", "há 1 dia") e ícone de favoritar à direita.

Ação de Clique (Expansão para Modal):

O clique em qualquer parte do card dispara a abertura de um modal animado usando Framer Motion (layoutId), criando o efeito de expansão contínua do próprio card.

Conteúdo do Modal: Detalhes completos da vaga, descrição integral, requisitos, informações da empresa, data exata de postagem. No rodapé, uma seção "Entre em Contato" exibindo de forma interativa todos os métodos informados pela empresa: Link externo seguro (target="_blank"), E-mail (mailto:) e Telefone/WhatsApp (wa.me/).

5. Passo a Passo de Execução para a IA
Fase 0: Setup da Raiz e Monorepo
Criar o diretório raiz do projeto e configurar o package.json principal:

{
  "name": "vagas-aggregator",
  "private": true,
  "scripts": {
    "dev:server": "npm --prefix server run dev",
    "dev:web": "npm --prefix web run dev",
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:web\""
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}

Criar .gitignore ignorando node_modules, .env, .next e pastas de build.

Fase 1: Backend & Modelagem de Dados (/server)
Inicializar TypeScript (tsconfig.json) e instalar dependências (hono, @hono/node-server, @prisma/client, zod, dotenv).

Configurar o arquivo prisma/schema.prisma com o modelo Job:

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum WorkplaceType {
  REMOTE
  HYBRID
  ON_SITE
}

enum EducationLevel {
  FUNDAMENTAL_1_INCOMPLETE
  FUNDAMENTAL_1_COMPLETE
  FUNDAMENTAL_2_INCOMPLETE
  FUNDAMENTAL_2_COMPLETE
  MEDIO_INCOMPLETE
  MEDIO_COMPLETE
  SUPERIOR_INCOMPLETE
  SUPERIOR_COMPLETE
  POS_GRADUACAO
  MESTRADO
  DOUTORADO
}

enum ContractType {
  CLT
  PJ
  OTHER
}

model Job {
  id                  String        @id @default(uuid())
  title               String
  company             String
  description         String        @db.Text
  location            String
  workplaceType       WorkplaceType
  education           EducationLevel
  contractType        ContractType  @default(CLT)
  benefits            String?
  hasVA               Boolean       @default(false)
  hasVR               Boolean       @default(false)
  hasVT               Boolean       @default(false)
  hasLifeInsurance    Boolean       @default(false)
  hasMedicalInsurance Boolean       @default(false)
  hasDentalInsurance  Boolean       @default(false)
  salary              Float?
  salaryMin           Float?
  salaryMax           Float?
  applicationUrl      String?
  contactEmail        String?
  contactPhone        String?
  source              String        @default("MANUAL")
  isActive            Boolean       @default(true)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([workplaceType])
  @@index([education])
  @@index([contractType])
  @@index([createdAt(sort: Desc)])
}

Executar migration inicial com Prisma (npx prisma migrate dev --name init).

Implementar rotas e validações Zod:

GET /api/v1/jobs: Listagem com filtros dinâmicos (q, location, workplaceType, level, contractType, minSalary, maxSalary) e paginação (page, limit).

GET /api/v1/jobs/:id: Detalhes completos da vaga para o modal/página.

POST /api/v1/jobs: Cadastro manual de vaga validado com Zod.

Fase 2: Componentes Base do Frontend (/web)
Inicializar aplicação Next.js com App Router, TypeScript e Tailwind CSS.

Instalar dependências: framer-motion, lucide-react, react-hook-form, @hookform/resolvers, zod.

Configurar tipos TypeScript em src/types/job.ts espelhando a entidade do backend.

Criar componentes atômicos:

Badge: Variação verde destacada para benefícios/salário e neutra para modalidades.

JobCard: Card fechado conforme especificações visuais.

JobCardSkeleton: Carregamento esqueleto com efeito shimmer.

SidebarFilters: Filtros verticais com toggles e seletores de contrato, modalidade e nível.

JobDetailsModal: Modal de visualização expandida animado via framer-motion.

Fase 3: Telas e Integração
Home (src/app/page.tsx):

Integrar layout em duas colunas (Sidebar de filtros à esquerda + Feed à direita).

Gerenciar estado dos filtros sincronizado com a URL através de useSearchParams e useRouter.

Implementar o disparo da expansão do card para o modal ao clicar.

Página de Cadastro (src/app/jobs/new/page.tsx):

Formulário completo usando React Hook Form e Zod.

Campos: Título, Empresa, Local (Autocomplete IBGE), Modalidade, Escolaridade (11 níveis), Tipo de Contrato, Benefícios Padrão (VA, VR, VT, Seguro, Saúde, Odonto), Salário Exato vs Piso/Teto (com validação condicional), Meios de Contato (Link, E-mail, Telefone) e Descrição.

Validações em tempo real e redirecionamento para a Home após publicação bem-sucedida.

6. Regras de Resposta para a IA
Execute uma fase por vez.

Antes de apresentar o código, forneça os comandos exatos de terminal (npm install ...) necessários para a respectiva fase.

Não utilize tipagens vagas como any.

Garanta que as classes do Tailwind sigam a identidade visual limpa (azul para ações principais, fundo em tons neutros claros e box verde para benefícios/salário).