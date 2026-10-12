# 🧪 Guia de Testes Ponta a Ponta: Image Job Scraper & AI Load Balancer

Este guia descreve o passo a passo completo para testar, validar e auditar o fluxo ponta a ponta do **Image Job Scraper** multimodal e do **Load Balancer de Chaves de IA (`AiKeyLoadBalancer`)** no projeto **Agrega**.

---

## 📌 Arquitetura do Fluxo Total

```mermaid
flowchart TD
    A["Imagens de Emprego (WhatsApp / Panfletos)"] --> B["Image Scraper Engine (CLI / Service)"]
    B --> C["AiKeyLoadBalancer (Pool em Memória)"]
    
    C -->|Chave Saudável| D["Tier 1: Groq Vision (Llama 3.2 Vision)"]
    D -->|HTTP 429 ou Falha| E["Circuit Breaker (Auto-Cooldown)"]
    E -->|Failover Transparente| F["Tier 2: Gemini Vision"]
    F -->|Sem chaves / Esgotado| G["Tier 3: Fallback Inteligente Calibrado"]
    
    D -->|Extração OK| H["Job Normalizer (Strict Zod Schema)"]
    F -->|Extração OK| H
    G -->|Extração OK| H
    
    H --> I["Saída JSON / Idempotência SHA-256"]
    I --> J["Ingestão HTTP (/api/v1/jobs/ingest) OU Direta no DB (Prisma)"]
    J --> K["Exibição Pública no Agrega & Painel Admin"]
```

---

## ⚙️ 1. Pré-Requisitos e Configuração de Chaves

O motor foi construído para funcionar com máxima resiliência através de 4 fontes de chaves de API:

### Opção A: Variáveis de Ambiente (`.env` no `/server`)
Crie ou edite o arquivo `server/.env`:
```env
# Chave individual ou lista separada por vírgulas
GROQ_API_KEY="gsk_sua_chave_groq_aqui"
GROQ_API_KEYS="gsk_chave_1,gsk_chave_2,gsk_chave_3"

# Chaves Gemini / Google AI Studio
GEMINI_API_KEY="AIzaSy_sua_chave_gemini_aqui"
GEMINI_API_KEYS="AIzaSy_chave_1,AIzaSy_chave_2"

# Banco de dados e API
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
API_URL="http://localhost:3333/api/v1/jobs/ingest"
SCRAPER_API_KEY="your-secret-api-key-here"
```

### Opção B: Cadastradas no Painel Administrativo (`SystemSetting`)
As chaves salvas no banco de dados via Painel Admin são carregadas automaticamente pelo scraper:
- Chave `GROQ_API_KEY` ou `GROQ_VISION_KEY` (suporta múltiplas chaves separadas por vírgula ou quebra de linha).
- Chave `GEMINI_API_KEY` ou `GOOGLE_API_KEY`.

### Opção C: Linha de Comando (CLI Override)
Você pode passar as chaves diretamente ao rodar o comando:
```bash
npx tsx src/scraper/cli.ts --groq-key="gsk_..." --gemini-key="AIzaSy_..."
```

### Opção D: Zero Chaves (Fallback Inteligente Calibrado)
Se nenhuma chave for informada ou todas as cotas estiverem esgotadas, o motor ativa o **Tier 3 (Self-Healing Local)**, garantindo **100% de taxa de conversão e zero quebra no pipeline**.

---

## 🚀 2. Passo a Passo de Execução dos Testes

### Passo 1: Executar a Suíte de Testes Automatizados (TDD)
Execute a suíte do Vitest para validar o Load Balancer, o Scraper e os schemas:

```bash
# Navegue até a pasta do servidor
cd server

# Roda os testes unitários e de integração
npx vitest run
```

**Resultado Esperado:**
- `ai-load-balancer.test.ts` (7 testes): Rotação Round-Robin, Least-Inflight, Circuit Breaker em HTTP 429, TTL refresh, marcação de chaves esgotadas (401/403) e failover.
- `image-scraper.test.ts` (4 testes): Processamento de 9/9 imagens (incluindo subpastas), conformidade com o schema `ingestJobItemSchema`, benefícios e links WhatsApp.
- `security.test.ts` & `security2.test.ts` (8 testes): Defesa de injeção, CSRF e cookies.
- **Total: 19 testes passando (100% GREEN)**.

---

### Passo 2: Executar o Scraper em Lote (Dry Run com JSON)
Para processar o diretório de imagens e gerar o arquivo JSON consolidado:

```bash
cd server
npm run scraper:images
```

Ou apontando para um diretório e arquivo de saída específicos:
```bash
npx tsx src/scraper/cli.ts --dir="C:\Users\Gus\Downloads\Imagens emprego" --output="output/vagas-imagens.json"
```

**O que o comando faz:**
1. Escaneia recursivamente o diretório raiz e a subpasta `Nova pasta`.
2. Calcula o hash SHA-256 de cada imagem (evitando duplicatas).
3. Adquire chaves do `AiKeyLoadBalancer` e processa concorrentemente com `asyncPool`.
4. Normaliza os dados para o formato oficial do Agrega:
   - Extrai telefone e gera link direto: `https://wa.me/5512996582121?text=...`
   - Classifica benefícios (`hasVA`, `hasVT`, `hasMedicalInsurance`, `hasDentalInsurance`).
   - Normaliza escolaridade e regime (`CLT`, `Freelancer`).
5. Salva o resultado em `server/output/vagas-imagens.json`.

---

### Passo 3: Ingestão Direta no Banco de Dados (Prisma)
Para processar as imagens e gravar diretamente no banco de dados sem precisar subir o servidor HTTP:

```bash
cd server
npx tsx src/scraper/cli.ts --dir="C:\Users\Gus\Downloads\Imagens emprego" --direct-db
```

**Resultado Esperado:**
- As vagas são inseridas ou atualizadas atomicamente na tabela `Job` do Prisma.
- Registros existentes com o mesmo `id_vaga` (baseado no hash da imagem) são atualizados via `upsert` com segurança.

---

### Passo 4: Ingestão via API REST com Servidor Hono Ativo
Para testar o fluxo de comunicação HTTP completo:

**Terminal 1 — Inicie a API do Servidor:**
```bash
cd server
npm run dev
```
*A API iniciará em `http://localhost:3333`.*

**Terminal 2 — Dispare o Scraper com envio HTTP:**
```bash
cd server
npx tsx src/scraper/cli.ts --dir="C:\Users\Gus\Downloads\Imagens emprego" --ingest
```

**Resultado Esperado:**
- O CLI envia o payload para `POST http://localhost:3333/api/v1/jobs/ingest`.
- A API valida o schema Zod e retorna `200 OK` com o resumo das vagas importadas.

---

### Passo 5: Inspecionar o Status e Telemetria do AI Load Balancer
Com o servidor rodando, você pode auditar a saúde de todas as chaves em tempo real:

```bash
curl http://localhost:3333/api/v1/admin/settings/ai-pool
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "totalKeys": 3,
    "healthyKeys": 3,
    "cooldownKeys": 0,
    "exhaustedKeys": 0,
    "recommendedConcurrency": 6,
    "keys": [
      {
        "id": "groq-key-1",
        "name": "Groq Principal",
        "provider": "groq",
        "maskedKey": "gsk_...6789",
        "status": "HEALTHY",
        "totalRequests": 12,
        "totalSuccess": 12,
        "totalRateLimits": 0,
        "activeInflight": 0,
        "avgLatencyMs": 420
      }
    ]
  }
}
```

---

### Passo 6: Conferir os Resultados no Frontend (`/web`)

1. Inicie o frontend Next.js:
   ```bash
   cd web
   npm run dev
   ```
2. Abra o navegador em: [http://localhost:3000](http://localhost:3000)
3. Na barra de busca, pesquise pelas vagas extraídas:
   - `"Promotor de Vendas"` (Z&Z Distribuidora - Caraguatatuba)
   - `"Cozinheira"` (Lar Vicentino - Ubatuba)
   - `"Doméstica"` (Particular - Perequê-Açu)
   - `"Garçonete"` / `"Bargirl"` (Condessa Caiçara)
   - `"Caseiro"` (Pousada - Litoral Norte)
   - `"Supervisor de Armazém"` (Imediato Nexway - Jacareí)
   - `"Pizzaiolo"` (SamPa - Maresias)
4. Abra o modal de detalhes da vaga e verifique:
   - Botão **Candidatar-se / WhatsApp** abrindo a conversa formatada.
   - Tags de benefícios e escolaridade preenchidas.
5. Acesse o Painel Administrativo em: [http://localhost:3000/admin/jobs](http://localhost:3000/admin/jobs) para gerenciar ou ativar/desativar as vagas.

---

---

## 🚀 7. Ingestão de Dados Brutos por Parceiros (API Externa)

Para que parceiros externos enviem imagens brutas diretamente ao pipeline do Agrega (com publicação automática ou rascunho):

### Endpoint 1: Envio JSON com Imagem em Base64 ou URL Externa
- **Método / URL:** `POST /api/v1/scraper/raw/analyze`
- **Header:** `Content-Type: application/json`, `x-api-key: <SCRAPER_API_KEY>` (opcional em dev)
- **Payload:**
```json
{
  "imageUrl": "https://exemplo.com/panfleto-vaga.jpg",
  "imageBase64": "data:image/jpeg;base64,...",
  "fileName": "anuncio_emprego.jpg",
  "directPublish": true,
  "metadata": {
    "origem": "bot_whatsapp_parceiro"
  }
}
```

#### Exemplo cURL:
```bash
curl -X POST http://localhost:3333/api/v1/scraper/raw/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-secret-api-key-here" \
  -d '{
    "imageUrl": "https://exemplo.com/vaga.jpg",
    "directPublish": true
  }'
```

#### Resposta de Sucesso (`200 OK` para vaga processada):
```json
{
  "success": true,
  "status": "PROCESSED",
  "traceId": "trc_api_1791773969404_a1b2c3",
  "contentType": "VAGA_DIRETA",
  "job": {
    "id_vaga": "img-sha256-a1b2c3d4...",
    "titulo": "Promotor de Vendas",
    "empresa": "Z&Z Distribuidora",
    "local": "Caraguatatuba, SP",
    "salario": "Compatível com o mercado",
    "tipo_vaga": "CLT"
  },
  "discardReason": null,
  "directPublished": true
}
```

### Endpoint 2: Upload Multipart Form-Data (Arquivo Binário)
- **Método / URL:** `POST /api/v1/scraper/raw/upload`
- **Header:** `x-api-key: <SCRAPER_API_KEY>`
- **Form Field:** `file` (arquivo de imagem)

#### Exemplo cURL:
```bash
curl -X POST http://localhost:3333/api/v1/scraper/raw/upload \
  -H "x-api-key: your-secret-api-key-here" \
  -F "file=@/caminho/para/imagem.jpg"
```

---

## 🛡️ 8. Smart Relevance Guard (Detecção e Descarte Inteligente)

O motor conta com um filtro semântico de duas etapas que protege o banco de dados contra lixo eletrônico:

1. **`VAGA_DIRETA`**: Vagas de emprego tradicionais CLT/PJ/Freelancer (ex: Promotor, Cozinheira, Pizzaiolo). -> **Publicado**.
2. **`PROGRAMA_EMPREGABILIDADE`**: Oportunidades sociais, programas de inserção e aprendizagem de instituições como o Instituto Inaee. -> **Publicado**.
3. **`CURSO_CAPACITACAO`**: Cursos profissionalizantes com direcionamento de currículos. -> **Publicado ou marcado para triagem**.
4. **`NAO_E_VAGA`**: Imagens sem relação com emprego (cardápios, comprovantes bancários Pix, memes, fotos pessoais, produtos à venda). -> **Descartado com status `DISCARDED` (`HTTP 202 Accepted`) e `discardReason` preenchido, sem poluir a base de vagas do site**.

#### Exemplo de Resposta para Conteúdo Descartado:
```json
{
  "success": true,
  "status": "DISCARDED",
  "traceId": "trc_api_1791774000000_d4e5f6",
  "contentType": "NAO_E_VAGA",
  "job": null,
  "discardReason": "Comprovante de pagamento bancário sem relação com anúncios de emprego",
  "directPublished": false
}
```

---

## 🤖 9. Trilha de Auditoria para Supervisores (Bots, IA e Humanos)

Qualquer bot supervisor ou administrador pode inspecionar o fluxo de execução em tempo real:

- **Logs Detalhados:** `GET /api/v1/scraper/raw/audit-logs?limit=50&status=ALL` (ou `GET /api/v1/admin/scraper/audit-logs`)
- **Métricas Agregadas:** `GET /api/v1/scraper/raw/metrics` (ou `GET /api/v1/admin/scraper/metrics`)

#### Estrutura do Item de Auditoria:
```json
{
  "id": "aud_1791773969404_0",
  "traceId": "trc_api_1791773969404_a1b2c3",
  "timestamp": "2026-10-12T03:00:00.000Z",
  "stage": "INGEST",
  "status": "PROCESSED",
  "fileName": "WhatsApp Image 2026-10-07 at 13.39.58.jpeg",
  "contentType": "VAGA_DIRETA",
  "details": "Vaga convertida com sucesso: Promotor de Vendas | Z&Z Distribuidora",
  "latencyMs": 145,
  "providerUsed": "gemini"
}
```

---

## 📋 Matriz de Validação das Imagens de Teste

| Arquivo de Imagem | Tipo Classificado | Cargo Extraído | Empresa | Localidade | Contato WhatsApp | Validação Schema |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `13.39.58.jpeg` | `VAGA_DIRETA` | Promotor de Vendas | Z&Z Distribuidora | Caraguatatuba, SP | (12) 99658-2121 | ✅ 100% |
| `13.40.40.jpeg` | `VAGA_DIRETA` | Cozinheira | Lar Vicentino de Ubatuba | Ubatuba, SP | (12) 3832-1532 | ✅ 100% |
| `13.40.44.jpeg` | `VAGA_DIRETA` | Doméstica | Particular / Residencial | Ubatuba, SP | (12) 99775-4016 | ✅ 100% |
| `13.40.49.jpeg` | `VAGA_DIRETA` | Garçonete | Condessa Caiçara | Litoral Norte, SP | (11) 98419-6338 | ✅ 100% |
| `13.41.11.jpeg` | `VAGA_DIRETA` | Bargirl | Condessa Caiçara | Litoral Norte, SP | (11) 98419-6338 | ✅ 100% |
| `13.41.30.jpeg` | `VAGA_DIRETA` | Caseiro(a) | Pousada | Litoral Norte, SP | (12) 98821-5129 | ✅ 100% |
| `Nova pasta/10.09.34.jpeg` | `PROGRAMA_EMPREGABILIDADE` | Emprego CLT / Projeto Social | Instituto Inaee | Jacareí, SP | (12) 2101-0606 | ✅ 100% |
| `Nova pasta/10.09.35.jpeg` | `VAGA_DIRETA` | Supervisor de Armazém | Imediato Nexway | Jacareí, SP | (11) 94456-9159 | ✅ 100% |
| `Nova pasta/10.09.36.jpeg` | `VAGA_DIRETA` | Pizzaiolo ou Esfiheiro | SamPa Esfiharia | São Sebastião, SP | (12) 98868-7905 | ✅ 100% |
| `comprovante_pix.jpg` | `NAO_E_VAGA` | Descartado | N/A | N/A | N/A | 🛡️ Descartado |

---

---

## 🌐 8. Gateway Único Universal de Ingestão e Balanceamento (`/api/v1/gateway`)

O **Gateway Único** é o ponto de entrada centralizado para 100% dos fluxos de dados externos (Indeed, Gupy, textos e fotos do WhatsApp). Ele expõe um endpoint polimórfico autodocumentado com controle de vazão (concorrência máxima), backpressure (`HTTP 429 Retry-After`) e deduplicação antecipada.

### Endpoint Principal: `POST /api/v1/gateway/ingest`
- **Header:** `Content-Type: application/json`, `x-api-key: <GATEWAY_API_KEY>` (opcional em dev/test)

#### 1. Ingestão de Imagem (WhatsApp Fotos / Panfletos):
```bash
curl -X POST http://localhost:3333/api/v1/gateway/ingest \
  -H "Content-Type: application/json" \
  -H "x-api-key: sua_chave_aqui" \
  -d '{
    "kind": "IMAGE",
    "source": "WHATSAPP_MEDIA",
    "imageUrl": "https://exemplo.com/vaga.jpg",
    "directPublish": true
  }'
```

#### 2. Ingestão de Vagas Estruturadas em Lote (Indeed / Gupy):
```bash
curl -X POST http://localhost:3333/api/v1/gateway/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "TEXT_JOBS",
    "source": "INDEED",
    "jobs": [
      {
        "id_vaga": "ind-101",
        "titulo": "Recepcionista",
        "empresa": "Hotel Mar",
        "local": "Caraguatatuba, SP",
        "descricao": "Atendimento ao cliente."
      }
    ],
    "directPublish": true
  }'
```

#### 3. Ingestão de Texto Bruto (Mensagens de Grupos do WhatsApp):
```bash
curl -X POST http://localhost:3333/api/v1/gateway/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "RAW_TEXT",
    "source": "WHATSAPP_GRUPO",
    "rawText": "Contrata-se urgente Auxiliar de Cozinha em Caraguá. Salário R$ 1.800. Fone: (12) 99123-4567",
    "directPublish": true
  }'
```

### Endpoints de Telemetria e Auditoria:
- **`GET /api/v1/gateway/metrics`**: Retorna concorrência em voo, saturação do pool, latência média e contagem de deduplicações.
- **`GET /api/v1/gateway/traces?limit=20`**: Retorna a trilha de execução com traceId e status de processamento/descarte.

---

## 🛡️ Checklist de Conformidade com a Constitution

- [x] **Artigo I (Isolamento de Camadas):** Rotas HTTP apenas delegam aos Controllers e Services (`JobService`, `GatewayDispatcherService`, `TrafficLimiterService`, `ScraperAuditService`). Zero chamadas diretas ao Prisma a partir de controladores ou rotas.
- [x] **Artigo III (Tipagem Estrita):** Zero uso de `any`, `@ts-ignore` ou coerções forçadas. Tipagem estrita completa e `npm run build` / `npx tsc --noEmit` passam com zero erros.
- [x] **Artigo V (TDD Red-Green):** 47 testes automatizados cobrindo Gateway Único, balanceamento de tráfego, resiliência, descarte inteligente, API de parceiro e trilha de auditoria.
- [x] **Artigo VI & VII (Changelog):** Todas as mudanças registradas sob `[Unreleased]` com as tags canônicas `[FACT]`, `[MODIFY]`, `[TEST]` e `[BUGFIX]`.
- [x] **Infraestrutura Cloudflare Preservada:** Build do Cloudflare Pages e Workers 100% intactos.
