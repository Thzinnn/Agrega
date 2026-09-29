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
O projeto utiliza a biblioteca `concurrently` configurada na raiz do monorepo para iniciar os dois pacotes em um único comando sem conflitos de portas.

Suba o backend e o frontend simultaneamente:
```bash
# Na raiz do repositório (d:\Nova pasta\Agrega)
npm run dev
```

- O **Frontend** iniciará na porta `3000`: [http://localhost:3000](http://localhost:3000)
- O **Backend** iniciará na porta `3333`: [http://localhost:3333](http://localhost:3333)

> **Nota:** Certifique-se de não possuir outros processos ativos nestas portas para evitar o erro `EADDRINUSE`.

---

## 🗂️ Estrutura de Diretórios (Resumo)

```text
/
├── server/                   # API Rest (Backend)
│   ├── prisma/               # Schemas e Seeds do ORM
│   ├── src/
│   │   ├── controllers/      # Roteamento lógico
│   │   ├── services/         # Regras de negócio principais
│   │   ├── schemas/          # Validações Zod estritas (Ex: Regras de contato e faixas salariais)
│   │   ├── middlewares/      # Tratamento de Erros (Ex: 503 db disconnect)
│   │   └── __tests__/        # Suítes de validações de regras de negócio
│   └── package.json
│
├── web/                      # Frontend Next.js
│   ├── src/
│   │   ├── app/              # Estrutura do App Router (Home, Jobs/New)
│   │   ├── components/       # Componentes React
│   │   ├── lib/              # Utilitários globais (Axios, API IBGE)
│   │   └── types/            # Interfaces (Totalmente sincronizadas com o backend)
│   └── package.json
│
├── Constitution.md           # Regras do projeto
├── CHANGELOG.md              # Log de progressões estruturadas
└── package.json              # Orquestração do Monorepo
```

---

## 🧩 Componentes e Funcionalidades Core

A aplicação possui validação fim-a-fim, formulários dinâmicos e UI reativa:
- **Dark Mode**: Suporte nativo a temas Claro/Escuro usando `next-themes` na regra de proporção visual 60/30/10 com o Primary Azul (`#2563EB`).
- **Formulários Estritos**: Implementados usando `react-hook-form` + `@hookform/resolvers/zod` para inferência exata e validações visuais antes de acionar a API (como o Regex de telefone, validação condicional de salários exatos vs. piso/teto).
- **Autocomplete IBGE**: Os formulários buscam cidades do estado de São Paulo de forma dinâmica da API pública de localidades do IBGE.
- **Microinterações**: O projeto utiliza **Framer Motion** (`layoutId`) para transição de Cards para Modais animados de Vagas, gerando fluidez nas interações.
- **Benefícios e Contato Condicional**: As listagens das vagas apresentam sub-emblemas para cada benefício habilitado (VA, VR, VT) e geram automações no "Entre em Contato" (como `mailto:` no e-mail e `wa.me/` no telefone).
