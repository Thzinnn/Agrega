import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import {
  GatewayIngestPayload,
  GatewayResponse,
  GatewayImagePayload,
  GatewayTextJobsPayload,
  GatewayRawTextPayload,
} from '../schemas/gateway.schema.js';
import { IngestJobItem } from '../schemas/job.schema.js';
import { jobService } from './job.service.js';
import { analyzeImageJob } from '../scraper/image-extractor.js';
import { scraperAuditService } from './scraper-audit.service.js';
import { trafficLimiter } from './traffic-limiter.service.js';

export class GatewayDispatcherService {
  /**
   * Ponto central de despacho polimórfico do Gateway Universal
   */
  async dispatch(prisma: PrismaClient, payload: GatewayIngestPayload): Promise<GatewayResponse> {
    const startTime = Date.now();
    const gatewayTraceId = `gw_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    // Adquire slot no Traffic Load Balancer para proteger conexões
    const releaseSlot = await trafficLimiter.acquireSlot();

    try {
      scraperAuditService.log({
        traceId: gatewayTraceId,
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: `kind_${payload.kind}`,
        details: `Gateway recebeu requisição [${payload.kind}] da origem [${payload.source}]`,
      });

      switch (payload.kind) {
        case 'IMAGE':
          return await this.handleImage(prisma, payload, gatewayTraceId, startTime);
        case 'TEXT_JOBS':
          return await this.handleTextJobs(prisma, payload, gatewayTraceId, startTime);
        case 'RAW_TEXT':
          return await this.handleRawText(prisma, payload, gatewayTraceId, startTime);
      }
    } finally {
      releaseSlot();
    }
  }

  /**
   * 1. Processador de Imagens (WhatsApp Panfletos / Redes Sociais)
   */
  private async handleImage(
    prisma: PrismaClient,
    payload: GatewayImagePayload,
    gatewayTraceId: string,
    startTime: number
  ): Promise<GatewayResponse> {
    const tempDir = os.tmpdir();
    const tempFileName = payload.fileName
      ? `gw_${Date.now()}_${path.basename(payload.fileName)}`
      : `gw_raw_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
    const tempFilePath = path.join(tempDir, tempFileName);

    try {
      if (payload.imageBase64) {
        const cleanBase64 = payload.imageBase64.includes(',')
          ? payload.imageBase64.split(',')[1] ?? ''
          : payload.imageBase64;
        await fs.promises.writeFile(tempFilePath, Buffer.from(cleanBase64, 'base64'));
      } else if (payload.imageUrl) {
        const fetchRes = await fetch(payload.imageUrl);
        if (!fetchRes.ok) {
          throw new Error(`Falha ao baixar imagem remota (HTTP ${fetchRes.status})`);
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        await fs.promises.writeFile(tempFilePath, Buffer.from(arrayBuf));
      }

      const outcome = await analyzeImageJob(tempFilePath, {
        traceId: gatewayTraceId,
        allowDiscard: false,
      });

      let publishedToSite = false;

      if (payload.directPublish && outcome.status === 'PROCESSED' && prisma) {
        const ingestRes = await jobService.ingestJobs(prisma, [outcome.job]);
        publishedToSite = ingestRes.processed > 0;
      }

      const duration = Date.now() - startTime;

      return {
        success: true,
        gatewayTraceId,
        kind: 'IMAGE',
        source: payload.source,
        status: outcome.status === 'ERROR' ? 'FAILED' : outcome.status,
        summary: {
          received: 1,
          processed: outcome.status === 'PROCESSED' ? 1 : 0,
          discarded: outcome.status === 'DISCARDED' ? 1 : 0,
          duplicatesSkipped: 0,
          publishedToSite,
        },
        data: outcome.status === 'PROCESSED' ? outcome.job : undefined,
        discardReason: outcome.status === 'DISCARDED' ? outcome.reason : undefined,
        metrics: {
          queueLatencyMs: 0,
          executionDurationMs: duration,
        },
      };
    } finally {
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }

  /**
   * 2. Processador de Vagas Estruturadas em Lote (Indeed, Gupy, LinkedIn)
   */
  private async handleTextJobs(
    prisma: PrismaClient,
    payload: GatewayTextJobsPayload,
    gatewayTraceId: string,
    startTime: number
  ): Promise<GatewayResponse> {
    const rawJobs = payload.jobs;
    const validJobsToProcess: IngestJobItem[] = [];
    let duplicatesSkipped = 0;

    for (const job of rawJobs) {
      // Gera fingerprint de conteúdo para deduplicação rápida
      const contentFingerprint = crypto
        .createHash('sha256')
        .update(`${job.id_vaga || ''}_${job.titulo}_${job.empresa}_${job.local}`)
        .digest('hex');

      if (trafficLimiter.checkAndRecordHash(contentFingerprint)) {
        duplicatesSkipped++;
        continue;
      }

      validJobsToProcess.push({
        ...job,
        source: job.source || payload.source,
      });
    }

    let publishedToSite = false;
    let processedCount = 0;

    if (payload.directPublish && validJobsToProcess.length > 0 && prisma) {
      const ingestRes = await jobService.ingestJobs(prisma, validJobsToProcess);
      processedCount = ingestRes.processed;
      publishedToSite = ingestRes.processed > 0;
    } else {
      processedCount = validJobsToProcess.length;
    }

    scraperAuditService.log({
      traceId: gatewayTraceId,
      stage: 'INGEST',
      status: 'PROCESSED',
      fileName: `batch_${payload.source}`,
      details: `Lote de vagas processado: ${processedCount} vagas salvas, ${duplicatesSkipped} duplicatas puladas`,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      gatewayTraceId,
      kind: 'TEXT_JOBS',
      source: payload.source,
      status: processedCount > 0 ? 'PROCESSED' : 'PARTIAL',
      summary: {
        received: rawJobs.length,
        processed: processedCount,
        discarded: 0,
        duplicatesSkipped,
        publishedToSite,
      },
      data: {
        processedCount,
        rejectedCount: rawJobs.length - processedCount - duplicatesSkipped,
      },
      metrics: {
        queueLatencyMs: 0,
        executionDurationMs: duration,
      },
    };
  }

  /**
   * 3. Processador de Mensagens de Texto Bruto (WhatsApp Nicolas)
   */
  private async handleRawText(
    prisma: PrismaClient,
    payload: GatewayRawTextPayload,
    gatewayTraceId: string,
    startTime: number
  ): Promise<GatewayResponse> {
    const text = payload.rawText.trim();

    // Heurística de triagem de relevância para mensagens de grupos
    const isJobRelated =
      text.toLowerCase().includes('vaga') ||
      text.toLowerCase().includes('contrata') ||
      text.toLowerCase().includes('salário') ||
      text.toLowerCase().includes('currículo') ||
      text.toLowerCase().includes('oportunidade');

    if (!isJobRelated) {
      scraperAuditService.log({
        traceId: gatewayTraceId,
        stage: 'DISCARD',
        status: 'DISCARDED',
        fileName: 'raw_text_whatsapp',
        discardReason: 'Mensagem de texto sem relação com anúncios de emprego',
        details: 'Texto bruto descartado pelo Smart Relevance Guard',
      });

      return {
        success: true,
        gatewayTraceId,
        kind: 'RAW_TEXT',
        source: payload.source,
        status: 'DISCARDED',
        summary: {
          received: 1,
          processed: 0,
          discarded: 1,
          duplicatesSkipped: 0,
          publishedToSite: false,
        },
        discardReason: 'Mensagem sem termos relacionados a emprego ou oportunidades',
        metrics: {
          queueLatencyMs: 0,
          executionDurationMs: Date.now() - startTime,
        },
      };
    }

    // Extração heurística simples de título e telefone
    const phoneMatch = text.match(/(?:\(?\d{2}\)?\s*)?(?:9\s*)?\d{4}[-\s]?\d{4}/);
    const phone = payload.contactPhone || (phoneMatch ? phoneMatch[0] : null);

    const firstLine = text.split('\n')[0]?.replace(/[*_~]/g, '').trim() || 'Oportunidade WhatsApp';
    const title = firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
    const hash = crypto.createHash('sha256').update(text).digest('hex').substring(0, 16);

    const structuredJob: IngestJobItem = {
      id_vaga: `wpp-txt-${hash}`,
      titulo: title,
      empresa: payload.originGroup || 'Anúncio WhatsApp',
      local: 'Litoral Norte, SP',
      descricao: text,
      tipo_vaga: 'CLT',
      link: phone ? `https://wa.me/55${phone.replace(/\D/g, '')}` : undefined,
      contactPhone: phone || undefined,
      source: payload.source,
    };

    let publishedToSite = false;
    if (payload.directPublish && prisma) {
      const res = await jobService.ingestJobs(prisma, [structuredJob]);
      publishedToSite = res.processed > 0;
    }

    scraperAuditService.log({
      traceId: gatewayTraceId,
      stage: 'INGEST',
      status: 'PROCESSED',
      fileName: 'raw_text_whatsapp',
      details: `Texto de vaga do WhatsApp normalizado com sucesso: ${title}`,
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      gatewayTraceId,
      kind: 'RAW_TEXT',
      source: payload.source,
      status: 'PROCESSED',
      summary: {
        received: 1,
        processed: 1,
        discarded: 0,
        duplicatesSkipped: 0,
        publishedToSite,
      },
      data: structuredJob,
      metrics: {
        queueLatencyMs: 0,
        executionDurationMs: duration,
      },
    };
  }
}

export const gatewayDispatcher = new GatewayDispatcherService();
