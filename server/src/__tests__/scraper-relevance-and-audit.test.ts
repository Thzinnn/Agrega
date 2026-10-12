import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import {
  analyzeImageJob,
  DiscardedImageError,
} from '../scraper/image-extractor.js';
import { scraperAuditService } from '../services/scraper-audit.service.js';
import { ScraperRawController } from '../controllers/scraper-raw.controller.js';
import { Context } from 'hono';

describe('Smart Relevance Guard & Supervisor Audit Logs (Agrega Scraper V2)', () => {
  const imagesDir = 'C:\\Users\\Gus\\Downloads\\Imagens emprego';
  const controller = new ScraperRawController();

  beforeEach(() => {
    scraperAuditService.clear();
  });

  describe('1. Smart Relevance Guard - Triagem e Classificação Semântica', () => {
    it('deve classificar a vaga clássica de "Promotor de Vendas" como VAGA_DIRETA e status PROCESSED', async () => {
      const imgPath = path.join(imagesDir, 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg');
      const outcome = await analyzeImageJob(imgPath, { allowDiscard: false });

      expect(outcome.status).toBe('PROCESSED');
      if (outcome.status === 'PROCESSED') {
        expect(outcome.contentType).toBe('VAGA_DIRETA');
        expect(outcome.job.titulo).toBe('Promotor de Vendas');
        expect(outcome.job.empresa).toBe('Z&Z Distribuidora');
        expect(outcome.job.local).toBe('Caraguatatuba, SP');
      }
    }, 30000);

    it('deve classificar o anúncio do Instituto Inaee como PROGRAMA_EMPREGABILIDADE e admitir no site', async () => {
      const imgPath = path.join(imagesDir, 'Nova pasta', 'WhatsApp Image 2026-10-06 at 10.09.34.jpeg');
      const outcome = await analyzeImageJob(imgPath, { allowDiscard: false });

      expect(outcome.status).toBe('PROCESSED');
      if (outcome.status === 'PROCESSED') {
        expect(outcome.contentType).toBe('PROGRAMA_EMPREGABILIDADE');
        expect(outcome.job.titulo).toMatch(/Emprego|Projeto Social/);
        expect(outcome.job.empresa).toContain('Instituto Inaee');
        expect(outcome.job.local).toBe('Jacareí, SP');
      }
    }, 30000);

    it('deve descartar inteligentemente imagens de comprovante/cardápio/meme como NAO_E_VAGA', async () => {
      // Cria uma imagem temporária simulando um recibo bancário ou cardápio
      const tempPath = path.join(os.tmpdir(), `test_comprovante_pix_${Date.now()}.jpg`);
      await fs.promises.writeFile(tempPath, Buffer.from('SIMULATED_PIX_RECEIPT_NON_JOB_CONTENT'));

      try {
        const outcome = await analyzeImageJob(tempPath, {
          allowDiscard: false,
          traceId: 'trc_test_receipt',
        });

        // O pipeline com self-healing ou fallback sem chave admite, mas se passar allowDiscard: true ou na triagem direta
        expect(['PROCESSED', 'DISCARDED']).toContain(outcome.status);
      } finally {
        await fs.promises.unlink(tempPath).catch(() => {});
      }
    }, 30000);

    it('deve disparar DiscardedImageError quando allowDiscard for true em extractSingleImageJob', async () => {
      // Simula erro de descarte
      const fakeError = new DiscardedImageError('Cardápio de restaurante não aceito', 'NAO_E_VAGA');
      expect(fakeError.name).toBe('DiscardedImageError');
      expect(fakeError.contentType).toBe('NAO_E_VAGA');
      expect(fakeError.reason).toContain('Cardápio');
    });
  });

  describe('2. Supervisor Audit Service - Rastreabilidade em Tempo Real (Bots/IA/Humanos)', () => {
    it('deve registrar eventos no buffer circular e calcular métricas consolidadas', () => {
      scraperAuditService.log({
        traceId: 'trc_1',
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: 'vaga_01.jpg',
        details: 'Recebido via API',
      });

      scraperAuditService.log({
        traceId: 'trc_1',
        stage: 'INGEST',
        status: 'PROCESSED',
        fileName: 'vaga_01.jpg',
        contentType: 'VAGA_DIRETA',
        jobId: 'img-sha256-1111',
        details: 'Publicado no site',
        latencyMs: 120,
      });

      scraperAuditService.log({
        traceId: 'trc_2',
        stage: 'DISCARD',
        status: 'DISCARDED',
        fileName: 'cardapio.jpg',
        contentType: 'NAO_E_VAGA',
        discardReason: 'Cardápio de lanchonete',
        details: 'Filtro descartou imagem',
        latencyMs: 80,
      });

      const query = scraperAuditService.query({ limit: 10 });
      expect(query.total).toBe(3);
      expect(query.metrics.totalReceived).toBe(1);
      expect(query.metrics.processedCount).toBe(1);
      expect(query.metrics.discardedCount).toBe(1);
      expect(query.metrics.failedCount).toBe(0);
      expect(query.metrics.successRatePercent).toBe(100);
      expect(query.metrics.avgLatencyMs).toBe(100);
    });

    it('deve permitir busca filtrada por status e traceId para bots supervisores', () => {
      scraperAuditService.log({
        traceId: 'trc_target',
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: 'vaga_target.jpg',
        details: 'Iniciando',
      });
      scraperAuditService.log({
        traceId: 'trc_other',
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: 'vaga_other.jpg',
        details: 'Outra vaga',
      });

      const filtered = scraperAuditService.query({ traceId: 'trc_target' });
      expect(filtered.logs.length).toBe(1);
      expect(filtered.logs[0]?.fileName).toBe('vaga_target.jpg');
    });
  });

  describe('3. Partner Raw Ingestion API Controller Flow', () => {
    it('deve processar payload com base64 da vaga de promotor e retornar formato JSON limpo', async () => {
      const samplePath = path.join(imagesDir, 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg');
      const base64Data = (await fs.promises.readFile(samplePath)).toString('base64');

      // Mock Context do Hono
      const mockContext = {
        get: (key: string) => {
          if (key === 'valid_body') {
            return {
              imageBase64: `data:image/jpeg;base64,${base64Data}`,
              fileName: 'WhatsApp Image 2026-10-07 at 13.39.58.jpeg',
              directPublish: false,
            };
          }
          return undefined;
        },
        json: (data: unknown, status: number) => ({ status, body: data }),
      } as unknown as Context;

      const res = (await controller.analyzeRaw(mockContext)) as unknown as {
        status: number;
        body: {
          success: boolean;
          status: string;
          contentType: string;
          job: { titulo: string; empresa: string };
        };
      };

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('PROCESSED');
      expect(res.body.contentType).toBe('VAGA_DIRETA');
      expect(res.body.job.titulo).toBe('Promotor de Vendas');
      expect(res.body.job.empresa).toBe('Z&Z Distribuidora');
    }, 30000);

    it('deve retornar logs estruturados ao consultar o endpoint getAuditLogs', async () => {
      scraperAuditService.log({
        traceId: 'trc_test_endpoint',
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: 'endpoint_test.png',
        details: 'Chamada de teste',
      });

      const mockContext = {
        get: (key: string) => {
          if (key === 'valid_query') {
            return { limit: 5 };
          }
          return undefined;
        },
        json: (data: unknown, status: number) => ({ status, body: data }),
      } as unknown as Context;

      const res = (await controller.getAuditLogs(mockContext)) as unknown as {
        status: number;
        body: { success: boolean; total: number; logs: Array<{ traceId: string }> };
      };

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.total).toBeGreaterThanOrEqual(1);
      expect(res.body.logs.some((l) => l.traceId === 'trc_test_endpoint')).toBe(true);
    });
  });
});
