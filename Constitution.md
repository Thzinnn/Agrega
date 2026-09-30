# Constitution: Agregador de Vagas (Monorepo)

## Princípios Fundamentais

### I. Isolamento de Camadas e Não-Interferência (Limites do Monorepo)

Mantenha uma separação rigorosa entre a camada da API (`/server`) e a camada do cliente (`/web`).
Os pacotes não compartilham estado de execução em tempo de execução, gerenciadores de estado globais ou importações diretas de arquivos fora da orquestração de scripts da raiz do workspace.

Isole alterações visuais e de estilização estritamente em `/web`. Modificar uma classe do Tailwind, alterar a disposição de um componente ou mexer no estado de UI nunca deve impactar, tocar ou alterar assinaturas de rotas no backend, esquemas do Prisma ou regras de negócio do servidor.

No `/server`, imponha o fluxo em camadas: `Rotas` -> `Middlewares` (schemas Zod) -> `Controllers` -> `Services` (Lógica de Negócio Pura) -> `Repositories` / Prisma Client.
Os controladores tratam estritamente o transporte HTTP (`req`, `res`) e códigos de status. Chamadas diretas ao banco de dados a partir de controladores são estritamente proibidas.

### II. Interface Baseada em Componentes e Separação Visual (Presentational UI)

Construa cada elemento visual em `/web` como um componente funcional puramente apresentacional.
Um componente visual recebe dados e callbacks exclusivamente via props. Ele não deve ler stores do navegador, fazer chamadas fetch brutas ou interagir com fontes de dados externas diretamente.

Separe componentes genéricos ("peças de Lego" em `/web/src/components/`) de componentes de domínio da funcionalidade (`/web/src/features/` ou `/web/src/components/jobs/`).
Componentes genéricos (como modais base, campos de formulário e badges) devem ser agnósticos ao domínio.
Componentes de funcionalidade cuidam do mapeamento de atributos de negócio (como badges de salário ou tags de tipo de contrato) para esses componentes genéricos.

Agrupe as props dos componentes em `data`, `state` e `actions` para manter APIs previsíveis e enxutas.
Trate variações de interface (como cores de badges ou rótulos de contrato) usando tabelas de resolução de dados (lookups/records) em vez de aninhamentos de operadores ternários ou longas cadeias de `if`.

### III. Tipagem Estrita e Sincronização de Esquemas (OBRIGATÓRIO)

Utilize TypeScript em modo estrito (`strict`) em todo o monorepo.
O uso de `any`, `@ts-ignore` ou coerções forçadas de tipo (`as unknown as Type`) é estritamente proibido. Resolva tipos complexos utilizando uniões discriminadas, tipos genéricos ou validação via Zod.

Mantenha a sincronização de ponta a ponta entre os modelos de dados do Prisma (`/server/prisma/schema.prisma`) e as definições de domínio do frontend (`/web/src/types/job.ts`).
Tanto os comandos de build (`npm run build`) quanto as checagens de tipo (`tsc --noEmit`) em `/server` e `/web` devem rodar com zero erros.

### IV. Consistência Visual e Identidade do Design

Estilize as interfaces do frontend exclusivamente utilizando as classes utilitárias do Tailwind CSS.
Siga os contratos visuais definidos:

* Ações primárias da marca: Paleta azul sólida (`bg-blue-600`, `hover:bg-blue-700`).
* Destaque para Salário e Benefícios: Caixa verde esmeralda suave (`bg-emerald-50 text-emerald-700 border border-emerald-200`).
* Badges secundárias (Remoto, Híbrido, CLT): Variantes neutras em cinza/slate.
* Ícones: Renderizados exclusivamente a partir de `lucide-react`.
* Expansões e Modais: Animação fluida via Framer Motion utilizando `layoutId` para transformar suavemente o card no modal de detalhes expandido.

### V. Desenvolvimento Orientado a Testes (TDD Red-Green) (OBRIGATÓRIO)

A verificação automatizada é obrigatória para qualquer modificação funcional ou correção.
Siga rigorosamente o ciclo Red-Green-Refactor:

1. **Red (Vermelho):** Escreva primeiro o teste automatizado (unitário ou de integração) capturando o comportamento esperado ou a falha do bug. Confirme a falha do teste.
2. **Green (Verde):** Escreva a quantidade mínima de código necessária para fazer o teste passar.
3. **Refactor (Refatorar):** Limpe o código, elimine duplicações e otimize a estrutura mantendo toda a suíte de testes verde.

Nunca delete, desative ou comente testes existentes para silenciar falhas de compilação ou regressões.
Nenhuma tarefa é considerada concluída enquanto todas as checagens automatizadas pertinentes não passarem limpas.

### VI. Registro Obrigatório no Changelog (Append-Only) (OBRIGATÓRIO)

Mantenha o histórico de alterações no arquivo `CHANGELOG.md` localizado na raiz do repositório.
Toda modificação deve ser documentada sob a seção `[Unreleased]`, respeitando a taxonomia descrita no Artigo VII.
Nunca reescreva o histórico passado do changelog; adicione as entradas em ordem cronológica decrescente.

### VII. Taxonomia e Categorização de Mudanças

Toda alteração de código, arquitetura ou documentação deve ser registrada sob uma das seguintes categorias canônicas:

* `[FACT]` (Funcionalidade): Novo comportamento funcional, novas rotas de API, novos componentes de interface ou regras de negócio que não existiam previamente.
* `[BUGFIX]`: Resolução de comportamentos inesperados, exceções em tempo de execução, falhas em testes ou defeitos de renderização visual.
* `[MODIFY]`: Refatorações estruturais que alteram contratos, migrations de banco de dados, mudanças em limites arquiteturais ou revisões nesta `constitution.md`.
* `[TEST]`: Adição ou melhoria exclusiva em suítes de testes (unitários, integração ou ponta a ponta).
* `[DOCS]`: Atualizações em documentações do projeto, manuais de configuração ou referências arquiteturais.

#### Formato Padrão para Entradas no `CHANGELOG.md`:

```markdown
### [TIPO] - AAAA-MM-DD
- **Descrição:** Resumo conciso da modificação operacional ou técnica.
- **Escopo:** `/server`, `/web` ou `raiz`.
- **Arquivos Afetados:** Lista dos principais arquivos criados, movidos ou alterados.

```

---

## Restrições da Stack

* **Backend:** Hono, TypeScript (Strict), Prisma ORM, PostgreSQL.
* **Frontend:** Next.js (App Router, React 19/Server Components), TypeScript (Strict), Tailwind CSS.
* **Mecanismo de Validação:** Zod (obrigatório em todos os payloads HTTP, parâmetros de busca de URL e submissões de formulário).
* **Formulários e Estado do Cliente:** React Hook Form com `@hookform/resolvers/zod`.
* **Animações de Interface:** Framer Motion (transições de expansão do card para modal).
* **Ícones:** `lucide-react`.
* **Scripts do Monorepo:** Scripts de npm na raiz executados em paralelo com `concurrently` para subir `/server` e `/web`.

---

## Diretrizes Operacionais para Agentes de IA

> [!WARNING] Proibição Absoluta de `any`
> Nunca utilize `any` para contornar erros de tipagem do TypeScript. Se o tipo de uma carga de dados for desconhecido, valide e faça o parse por meio de um schema Zod antes de atribuir a variáveis de domínio.

> [!IMPORTANT] Barreira de Não-Interferência
> Ao realizar ajustes visuais ou alterar classes Tailwind em `/web`, não modifique arquivos em `/server`. Qualquer tarefa que exija alteração simultânea nas duas camadas deve ser categorizada formalmente como `[MODIFY]` e conter justificativa estrutural clara no `CHANGELOG.md`.

> [!TIP] Sequência Obrigatória de TDD
> Antes de implementar código de produção em `/server/src/services` ou `/web/src/components`, apresente o arquivo de teste correspondente e garanta o estado vermelho (falha). Apenas apresente o código de implementação após a definição do teste.

> [!NOTE] Atualização Automática do Changelog
> Nunca finalize um prompt, tarefa ou implementação de fase sem anexar a respectiva entrada categorizada (`[FACT]`, `[BUGFIX]`, `[MODIFY]`, `[TEST]`, `[DOCS]`) ao arquivo `CHANGELOG.md` na raiz do projeto.

> [!CAUTION] Preservação Inviolável da Infraestrutura Cloudflare
> **NUNCA** modifique arquivos sensíveis de configuração de build da Cloudflare ou Next.js (como as diretivas e scripts do `web/package.json` — especialmente o `pages:build` nuclear workaround —, `web/next.config.ts`, `server/wrangler.toml` ou os arquivos `.nvmrc`) a menos que o usuário solicite **EXPLICITAMENTE** sua alteração, declarando expressamente a justificativa. Essas configurações foram cirurgicamente elaboradas para bypassar bugs complexos de ambientes cross-platform (Windows/Linux) e dependências nativas (`Tailwind Oxide/LightningCSS`). Modificações não solicitadas por "limpeza" ou "otimização" irão quebrar silenciosamente os pipelines remotos de deploy.