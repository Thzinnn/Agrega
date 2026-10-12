import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import { app } from '../app.js';
import {
  gatewayIngestEnvelopeSchema,
  gatewayResponseSchema,
} from '../schemas/gateway.schema.js';
import {
  TrafficLimiterService,
  TrafficOverloadedError,
  trafficLimiter,
} from '../services/traffic-limiter.service.js';
import { gatewayDispatcher } from '../services/gateway-dispatcher.service.js';
import { scraperAuditService } from '../services/scraper-audit.service.js';
import { PrismaClient } from '@prisma/client';

describe('Gateway Único Universal de Ingestão e Balanceamento (Agrega Gateway V1)', () => {
  const imagesDir = 'C:\\Users\\Gus\\Downloads\\Imagens emprego';

  // Mock PrismaClient em memória para os testes de integração
  const mockPrisma = {
    job: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'job_test_1', ...args.data })),
      update: vi.fn().mockImplementation((args) => Promise.resolve({ id: 'job_test_1', ...args.data })),
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as PrismaClient;

  beforeEach(() => {
    scraperAuditService.clear();
    trafficLimiter.clear();
    delete process.env.GATEWAY_API_KEY;
    delete process.env.SCRAPER_API_KEY;
  });

  afterEach(() => {
    delete process.env.GATEWAY_API_KEY;
    delete process.env.SCRAPER_API_KEY;
  });

  describe('1. Validação de Contrato & Schemas Zod (Polimorfismo Discriminado)', () => {
    it('deve validar payload kind: "IMAGE" com imagem em base64', () => {
      const validImagePayload = {
        kind: 'IMAGE',
        source: 'WHATSAPP_MEDIA',
        imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileName: 'panfleto_padaria.jpg',
        directPublish: true,
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(validImagePayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.kind).toBe('IMAGE');
      }
    });

    it('deve rejeitar payload kind: "IMAGE" sem imageUrl e sem imageBase64', () => {
      const invalidImage = {
        kind: 'IMAGE',
        source: 'WHATSAPP_MEDIA',
        fileName: 'sem_imagem.jpg',
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(invalidImage);
      expect(parsed.success).toBe(false);
    });

    it('deve validar payload kind: "TEXT_JOBS" com lote de vagas Indeed', () => {
      const validTextJobsPayload = {
        kind: 'TEXT_JOBS',
        source: 'INDEED_SCRAPER',
        jobs: [
          {
            id_vaga: 'indeed-123',
            titulo: 'Assistente Administrativo',
            empresa: 'Litoral Contábil',
            local: 'São Sebastião, SP',
            descricao: 'Rotinas administrativas e emissão de notas fiscais.',
            tipo_vaga: 'CLT',
            salario: 'R$ 2.200,00',
          },
        ],
        directPublish: true,
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(validTextJobsPayload);
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.kind).toBe('TEXT_JOBS');
      }
    });

    it('deve rejeitar payload kind: "TEXT_JOBS" com lista vazia de vagas', () => {
      const emptyJobs = {
        kind: 'TEXT_JOBS',
        source: 'INDEED_SCRAPER',
        jobs: [],
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(emptyJobs);
      expect(parsed.success).toBe(false);
    });

    it('deve validar payload kind: "RAW_TEXT" com mensagem do WhatsApp', () => {
      const validRawText = {
        kind: 'RAW_TEXT',
        source: 'WHATSAPP_COMMUNITY',
        rawText: 'Vaga urgente: Atendente de Balcão. Comparecer com currículo na Av Central 100.',
        contactPhone: '12999998888',
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(validRawText);
      expect(parsed.success).toBe(true);
    });

    it('deve rejeitar kind não reconhecido', () => {
      const unknownKind = {
        kind: 'AUDIO_NOTE',
        source: 'WHATSAPP',
      };

      const parsed = gatewayIngestEnvelopeSchema.safeParse(unknownKind);
      expect(parsed.success).toBe(false);
    });
  });

  describe('2. Traffic Load Balancer & Proteção do Pool de Conexões', () => {
    it('deve adquirir e liberar slots de concorrência com sucesso', async () => {
      const limiter = new TrafficLimiterService(2, 500);

      const release1 = await limiter.acquireSlot();
      const release2 = await limiter.acquireSlot();

      const metricsInflight = limiter.getMetrics();
      expect(metricsInflight.inflight).toBe(2);

      release1();
      release2();

      const metricsReleased = limiter.getMetrics();
      expect(metricsReleased.inflight).toBe(0);
      expect(metricsReleased.totalRequests).toBe(2);
      expect(metricsReleased.rejectedRequests).toBe(0);
    });

    it('deve lançar TrafficOverloadedError quando a fila exceder a capacidade e estourar timeout', async () => {
      const limiter = new TrafficLimiterService(1, 50); // máx 1 concorrente, espera máx 50ms

      const release1 = await limiter.acquireSlot();

      // Tentativa de adquirir além do limite deve estourar o timeout
      await expect(limiter.acquireSlot()).rejects.toThrow(TrafficOverloadedError);

      const metrics = limiter.getMetrics();
      expect(metrics.rejectedRequests).toBe(1);

      release1();
    });

    it('deve deduplicar hashes de payloads idênticos em memória', () => {
      const limiter = new TrafficLimiterService();
      const hash = 'sha256_mock_hash_12345';

      const isFirstDuplicate = limiter.checkAndRecordHash(hash);
      expect(isFirstDuplicate).toBe(false); // Primeira vez, não é duplicata

      const isSecondDuplicate = limiter.checkAndRecordHash(hash);
      expect(isSecondDuplicate).toBe(true); // Segunda vez, é duplicata!

      const metrics = limiter.getMetrics();
      expect(metrics.deduplicatedCount).toBe(1);
    });
  });

  describe('3. Dispatcher Polimórfico - Execução de Fluxos Especializados', () => {
    it('deve processar fluxo kind: "RAW_TEXT" com vaga real e normalizar dados', async () => {
      const payload = {
        kind: 'RAW_TEXT' as const,
        source: 'WHATSAPP_GRUPO_EMPREGOS',
        rawText: 'Contrata-se urgente Auxiliar de Cozinha para quiosque em Caraguatatuba.\nSalário compatível + VT.\nInteressados chamar no WhatsApp (12) 98123-4567 com currículo.',
        contactPhone: '12981234567',
        directPublish: false,
      };

      const response = await gatewayDispatcher.dispatch(mockPrisma, payload);

      expect(response.success).toBe(true);
      expect(response.kind).toBe('RAW_TEXT');
      expect(response.status).toBe('PROCESSED');
      expect(response.summary.processed).toBe(1);
      expect(response.summary.discarded).toBe(0);
      expect(response.gatewayTraceId.startsWith('gw_')).toBe(true);

      const jobData = response.data as { titulo: string; contactPhone?: string; link?: string };
      expect(jobData.titulo).toContain('Auxiliar de Cozinha');
      expect(jobData.contactPhone).toBe('12981234567');
      expect(jobData.link).toBe('https://wa.me/5512981234567');
    });

    it('deve descartar inteligentemente kind: "RAW_TEXT" quando o conteúdo for spam ou conversa aleatória', async () => {
      const payload = {
        kind: 'RAW_TEXT' as const,
        source: 'WHATSAPP_GRUPO_EMPREGOS',
        rawText: 'Bom dia pessoal! Alguém sabe que horas abre a lotérica do centro hoje?',
        directPublish: false,
      };

      const response = await gatewayDispatcher.dispatch(mockPrisma, payload);

      expect(response.success).toBe(true);
      expect(response.kind).toBe('RAW_TEXT');
      expect(response.status).toBe('DISCARDED');
      expect(response.summary.discarded).toBe(1);
      expect(response.summary.processed).toBe(0);
      expect(response.discardReason).toContain('emprego ou oportunidades');
    });

    it('deve processar lote de vagas kind: "TEXT_JOBS" e registrar deduplicação', async () => {
      const payload = {
        kind: 'TEXT_JOBS' as const,
        source: 'INDEED_BATCH',
        jobs: [
          {
            id_vaga: 'ind-001',
            titulo: 'Recepcionista de Hotel',
            empresa: 'Pousada Mar Azul',
            local: 'Ilhabela, SP',
            descricao: 'Atendimento a hóspedes e check-in.',
          },
          {
            id_vaga: 'ind-002',
            titulo: 'Camareira',
            empresa: 'Pousada Mar Azul',
            local: 'Ilhabela, SP',
            descricao: 'Limpeza e organização de suítes.',
          },
        ],
        directPublish: false,
      };

      const response = await gatewayDispatcher.dispatch(mockPrisma, payload);

      expect(response.success).toBe(true);
      expect(response.kind).toBe('TEXT_JOBS');
      expect(response.status).toBe('PROCESSED');
      expect(response.summary.received).toBe(2);
      expect(response.summary.processed).toBe(2);
      expect(response.summary.duplicatesSkipped).toBe(0);

      // Enviando o mesmo lote novamente deve pular as duplicatas
      const responseRepeat = await gatewayDispatcher.dispatch(mockPrisma, payload);
      expect(responseRepeat.summary.duplicatesSkipped).toBe(2);
      expect(responseRepeat.summary.processed).toBe(0);
    });

    it('deve processar imagem real kind: "IMAGE" através do pipeline de visão', async () => {
      const sampleImgPath = path.join(imagesDir, 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg');
      const base64Data = (await fs.promises.readFile(sampleImgPath)).toString('base64');

      const payload = {
        kind: 'IMAGE' as const,
        source: 'WHATSAPP_MEDIA',
        imageBase64: `data:image/jpeg;base64,${base64Data}`,
        fileName: 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg',
        directPublish: false,
      };

      const response = await gatewayDispatcher.dispatch(mockPrisma, payload);

      expect(response.success).toBe(true);
      expect(response.kind).toBe('IMAGE');
      expect(response.status).toBe('PROCESSED');
      expect(response.summary.processed).toBe(1);

      const jobData = response.data as { titulo: string; empresa: string };
      expect(jobData.titulo).toBe('Promotor de Vendas');
      expect(jobData.empresa).toBe('Z&Z Distribuidora');
    }, 30000);
  });

  describe('4. Endpoints HTTP /api/v1/gateway (Integração Hono App)', () => {
    it('POST /api/v1/gateway/ingest - deve retornar 200 com contrato GatewayResponse para vaga em texto bruto', async () => {
      const res = await app.request('/api/v1/gateway/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'RAW_TEXT',
          source: 'TEST_AGENT',
          rawText: 'Contrata-se Motorista CNH D com experiência em entregas no Litoral Norte. Salário R$ 2.800. Fone: (12) 99777-6655',
          directPublish: false,
        }),
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(true);
      expect(json.status).toBe('PROCESSED');
      expect(json.kind).toBe('RAW_TEXT');

      // Validação estrita contra o schema de resposta
      const validation = gatewayResponseSchema.safeParse(json);
      expect(validation.success, JSON.stringify(validation)).toBe(true);
    });

    it('POST /api/v1/gateway/ingest - deve retornar 202 com status DISCARDED para conteúdo não relevante', async () => {
      const res = await app.request('/api/v1/gateway/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'RAW_TEXT',
          source: 'TEST_AGENT',
          rawText: 'Boa tarde! Alguém tem indicação de mecânico de confiança para trocar pastilha de freio?',
          directPublish: false,
        }),
      });

      expect(res.status).toBe(202);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(true);
      expect(json.status).toBe('DISCARDED');
      expect(json.summary.discarded).toBe(1);
    });

    it('POST /api/v1/gateway/ingest - deve retornar 400 se o JSON for inválido ou malformado', async () => {
      const res = await app.request('/api/v1/gateway/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'MALFORMED_JSON_STRING',
      });

      expect(res.status).toBe(400);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(false);
      expect(json.message).toContain('JSON válido');
    });

    it('POST /api/v1/gateway/ingest - deve retornar 401 quando GATEWAY_API_KEY estiver configurada e header não for fornecido', async () => {
      process.env.GATEWAY_API_KEY = 'super_secret_partner_key';

      const res = await app.request('/api/v1/gateway/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kind: 'RAW_TEXT',
          rawText: 'Vaga de teste com chave de api ativa',
        }),
      });

      expect(res.status).toBe(401);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(false);
      expect(json.message).toContain('Acesso negado');
    });

    it('POST /api/v1/gateway/ingest - deve aceitar requisição autenticada via x-api-key', async () => {
      process.env.GATEWAY_API_KEY = 'super_secret_partner_key';

      const res = await app.request('/api/v1/gateway/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'super_secret_partner_key',
        },
        body: JSON.stringify({
          kind: 'RAW_TEXT',
          rawText: 'Vaga de Vendedor Externo com carteira de clientes. Salário fixo + comissão. Contato (12) 99111-2222',
          directPublish: false,
        }),
      });

      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(true);
    });

    it('GET /api/v1/gateway/metrics - deve retornar métricas de saturação e tráfego em tempo real', async () => {
      const res = await app.request('/api/v1/gateway/metrics');

      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(true);
      expect(json.data.traffic).toBeDefined();
      expect(typeof json.data.traffic.inflight).toBe('number');
      expect(typeof json.data.traffic.maxConcurrent).toBe('number');
      expect(json.data.scraperMetrics).toBeDefined();
    });

    it('GET /api/v1/gateway/traces - deve retornar trilha de logs e eventos gravados pelo gateway', async () => {
      const res = await app.request('/api/v1/gateway/traces?limit=10');

      expect(res.status).toBe(200);
      const json = (await res.json()) as Record<string, any>;
      expect(json.success).toBe(true);
      expect(Array.isArray(json.logs)).toBe(true);
    });
  });
});
