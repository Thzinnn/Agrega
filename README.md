# Agrega - Agregador de Vagas

Um agregador de vagas moderno e escalável, desenvolvido em formato de monorepo. O projeto foi construído seguindo rigorosos padrões de arquitetura e Desenvolvimento Orientado a Testes (TDD), separando as responsabilidades entre um backend ágil (Express + Prisma) e um frontend interativo e performático (Next.js App Router).

---

## 🚀 Tecnologias e Stack

O projeto utiliza tecnologias modernas divididas em dois pacotes principais dentro de um monorepo:

### **Backend (`/server`)**
- **Node.js** com **Express**
- **TypeScript**
- **Prisma ORM** (conectado a um PostgreSQL Serverless no **Neon.tech**)
- **Zod** para validação estrita de esquemas
- Padrão arquitetural em camadas (`Controllers`, `Services`, `Middlewares`, `Schemas`)

### **Frontend (`/web`)**
- **Next.js** (App Router)
- **React** e **TypeScript**
- **Tailwind CSS** para estilização utilitária e responsiva
- **Framer Motion** para microinterações e animações complexas (ex: modais de vagas com `layoutId`)
- **Lucide React** para ícones
- **Axios** para comunicação com a API

---

## 🛠️ Arquitetura e Regras de Desenvolvimento

O desenvolvimento deste projeto é estritamente governado pelo arquivo [`Constitution.md`](./Constitution.md), que define as seguintes regras (invariantes):

1. **Desenvolvimento Orientado a Testes (TDD)**: O fluxo obedece o ciclo _Red-Green-Refactor_. Todo código possui cobertura em `/server/src/__tests__`.
2. **Registro Contínuo (CHANGELOG)**: Toda modificação no sistema é versionada no [`CHANGELOG.md`](./CHANGELOG.md) seguindo uma taxonomia precisa (`[FACT]`, `[BUGFIX]`, `[MODIFY]`, `[TEST]`, `[DOCS]`).
3. **Proibição de Tipos Implícitos/`any`**: Todo o código TypeScript é tipado estritamente, sendo terminantemente proibido o uso do tipo `any`.
4. **Tratamento de Erros e Banco de Dados**: Proteções nativas foram adicionadas (ex: falhas de conexão de DB retornam status `503 Service Unavailable`).

---

## 📦 Como Instalar e Rodar Localmente

Siga os passos abaixo para configurar o ambiente de desenvolvimento local:

### 1. Pré-requisitos
- [Node.js](https://nodejs.org/en/) (Versão 20 ou 22 recomendada)
- Instância PostgreSQL (Recomendado: Neon.tech)

### 2. Configuração do Banco de Dados
Na pasta do servidor, crie o arquivo `.env` para apontar para o seu banco de dados:

```bash
cd server
cp .env.example .env
# Adicione a variável DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
```

### 3. Instalação de Dependências
Na raiz do monorepo, instale todas as dependências:
```bash
npm install
```

### 4. Setup do Prisma e Seed (Popular o banco)
Prepare o banco de dados com a estrutura de tabelas e alimente-o com algumas vagas iniciais:
```bash
cd server
npx prisma db push
npm run seed
```

### 5. Execução do Projeto
Por se tratar de um monorepo, você pode subir ambos (backend e frontend) em terminais distintos, ou a partir da raiz caso haja scripts unificados.

Para subir o **backend** (porta `3333`):
```bash
cd server
npm run dev
```

Para subir o **frontend** (porta padrão do Next.js `3000`):
```bash
cd web
npm run dev
```

Acesse o portal em: [http://localhost:3000](http://localhost:3000)

---

## 🗂️ Estrutura de Diretórios (Resumo)

```text
/
├── server/                   # API Rest (Backend)
│   ├── prisma/               # Schemas e Seeds do ORM
│   ├── src/
│   │   ├── controllers/      # Roteamento lógico
│   │   ├── services/         # Regras de negócio principais
│   │   ├── schemas/          # Validações Zod (Ex: Vagas e Salários opcionais)
│   │   ├── middlewares/      # Tratamento de Erros (Ex: 503 db disconnect)
│   │   └── __tests__/        # Suítes de validações
│   └── package.json
│
├── web/                      # Frontend Next.js
│   ├── src/
│   │   ├── app/              # Estrutura do App Router (Páginas principais)
│   │   ├── components/       # Componentes React (Badge, JobCard, JobDetailsModal, etc)
│   │   ├── lib/              # Utilitários globais (Configuração do Axios)
│   │   └── types/            # Interfaces exportadas/espelhadas do Backend
│   └── package.json
│
├── Constitution.md           # Regras do projeto
├── CHANGELOG.md              # Log de progressões estruturadas
└── package.json              # Orquestração do Monorepo
```

---

## 🧩 Componentes do Sistema (Fase 2+)

No frontend, a aplicação segue a arquitetura de **Atomic Design**, contendo componentes primários já configurados para performance:
- **`Badge`**: Etiqueta visual para indicar de forma amigável categorias salariais e benefícios.
- **`JobCard`**: Elemento base e interativo da vitrine.
- **`JobCardSkeleton`**: Feedback de loading durante chamadas de API (Pulse Animation).
- **`JobDetailsModal`**: Componente isolado e animado para os detalhes das vagas (Framer Motion `layoutId`).
