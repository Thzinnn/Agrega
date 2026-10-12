import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { Context } from 'hono';
import { PrismaClient } from '@prisma/client';
import { jobService } from '../services/job.service.js';
import { analyzeImageJob } from '../scraper/image-extractor.js';
import { scraperAuditService } from '../services/scraper-audit.service.js';
import {
  RawImageIngestPayload,
  AuditLogQueryParams,
  rawImageIngestSchema,
  auditLogQuerySchema,
} from '../schemas/scraper-raw.schema.js';
import { logger } from '../utils/logger.js';

export class ScraperRawController {
  /**
   * Endpoint de análise de dados brutos enviados via JSON (Base64 ou URL de Imagem)
   * Usado por parceiros externos para submeter imagens diretamente ao pipeline do Agrega.
   */
  async analyzeRaw(c: Context): Promise<Response> {
    const rawBody = c.get('valid_body') as RawImageIngestPayload;
    const body = rawImageIngestSchema.parse(rawBody);

    const traceId = `trc_api_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const tempDir = os.tmpdir();
    const tempFileName = body.fileName
      ? `agrega_${Date.now()}_${path.basename(body.fileName)}`
      : `agrega_raw_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.jpg`;
    const tempFilePath = path.join(tempDir, tempFileName);

    scraperAuditService.log({
      traceId,
      stage: 'RECEIVED',
      status: 'PENDING',
      fileName: body.fileName || tempFileName,
      details: body.imageUrl
        ? `Recebida URL externa para análise: ${body.imageUrl}`
        : 'Recebido payload em Base64 para decodificação e análise',
    });

    try {
      // 1. Obter os bytes da imagem
      if (body.imageBase64) {
        const cleanBase64 = body.imageBase64.includes(',')
          ? body.imageBase64.split(',')[1] ?? ''
          : body.imageBase64;
        const buffer = Buffer.from(cleanBase64, 'base64');
        await fs.promises.writeFile(tempFilePath, buffer);
      } else if (body.imageUrl) {
        const fetchRes = await fetch(body.imageUrl);
        if (!fetchRes.ok) {
          throw new Error(`Falha ao baixar imagem da URL fornecida (HTTP ${fetchRes.status})`);
        }
        const arrayBuf = await fetchRes.arrayBuffer();
        await fs.promises.writeFile(tempFilePath, Buffer.from(arrayBuf));
      } else {
        return c.json(
          {
            success: false,
            message: 'Nenhuma fonte de imagem fornecida (imageUrl ou imageBase64)',
          },
          400
        );
      }

      // 2. Executar pipeline de OCR, Load Balancer e Smart Relevance Guard
      const outcome = await analyzeImageJob(tempFilePath, {
        traceId,
        allowDiscard: false,
      });

      let publishedToSite = false;

      // 3. Publicação direta no site caso seja uma vaga ou oportunidade válida
      if (body.directPublish && outcome.status === 'PROCESSED') {
        const prisma = c.get('prisma') as PrismaClient;
        if (prisma) {
          const ingestRes = await jobService.ingestJobs(prisma, [outcome.job]);
          publishedToSite = ingestRes.processed > 0;
          logger.info(
            `[ScraperRawController] Vaga publicada automaticamente: ${outcome.job.titulo} | status: ${publishedToSite}`
          );
        }
      }

      return c.json(
        {
          success: true,
          status: outcome.status,
          traceId,
          contentType: outcome.status !== 'ERROR' ? outcome.contentType : undefined,
          job: outcome.status === 'PROCESSED' ? outcome.job : null,
          discardReason: outcome.status === 'DISCARDED' ? outcome.reason : null,
          directPublished: publishedToSite,
        },
        outcome.status === 'PROCESSED' ? 200 : 202
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      scraperAuditService.log({
        traceId,
        stage: 'ERROR',
        status: 'FAILED',
        fileName: body.fileName || tempFileName,
        details: `Erro no processamento da API de parceiro: ${errorMsg}`,
      });
      logger.error('[ScraperRawController] Erro ao analisar imagem bruta:', error);
      return c.json(
        {
          success: false,
          traceId,
          status: 'FAILED',
          error: errorMsg,
        },
        500
      );
    } finally {
      // Limpeza higiênica do arquivo temporário
      await fs.promises.unlink(tempFilePath).catch(() => {});
    }
  }

  /**
   * Endpoint de upload Multipart (form-data com arquivo 'file')
   * Permite que bots e parceiros enviem o binário do arquivo diretamente
   */
  async uploadRaw(c: Context): Promise<Response> {
    const traceId = `trc_up_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const tempDir = os.tmpdir();

    try {
      const body = await c.req.parseBody();
      const uploadedFile = body['file'];

      if (!uploadedFile || typeof uploadedFile === 'string') {
        return c.json(
          {
            success: false,
            message: 'Campo "file" obrigatório contendo o arquivo de imagem',
          },
          400
        );
      }

      const fileObj = uploadedFile as unknown as File;
      const originalName = fileObj.name || `upload_${Date.now()}.jpg`;
      const tempFilePath = path.join(
        tempDir,
        `agrega_up_${Date.now()}_${path.basename(originalName)}`
      );

      const arrayBuffer = await fileObj.arrayBuffer();
      await fs.promises.writeFile(tempFilePath, Buffer.from(arrayBuffer));

      scraperAuditService.log({
        traceId,
        stage: 'RECEIVED',
        status: 'PENDING',
        fileName: originalName,
        details: `Arquivo de imagem binário recebido via Multipart (${fileObj.size} bytes)`,
      });

      const outcome = await analyzeImageJob(tempFilePath, {
        traceId,
        allowDiscard: false,
      });

      const prisma = c.get('prisma') as PrismaClient;
      let publishedToSite = false;

      if (outcome.status === 'PROCESSED' && prisma) {
        const ingestRes = await jobService.ingestJobs(prisma, [outcome.job]);
        publishedToSite = ingestRes.processed > 0;
      }

      // Limpeza temporária
      await fs.promises.unlink(tempFilePath).catch(() => {});

      return c.json(
        {
          success: true,
          status: outcome.status,
          traceId,
          contentType: outcome.status !== 'ERROR' ? outcome.contentType : undefined,
          job: outcome.status === 'PROCESSED' ? outcome.job : null,
          discardReason: outcome.status === 'DISCARDED' ? outcome.reason : null,
          directPublished: publishedToSite,
        },
        outcome.status === 'PROCESSED' ? 200 : 202
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      scraperAuditService.log({
        traceId,
        stage: 'ERROR',
        status: 'FAILED',
        fileName: 'multipart_upload',
        details: `Falha no processamento de upload multipart: ${errorMsg}`,
      });
      return c.json(
        {
          success: false,
          traceId,
          status: 'FAILED',
          error: errorMsg,
        },
        500
      );
    }
  }

  /**
   * Endpoint de Auditoria e Trilha de Execução (Logs estruturados para Supervisor Bot, IA e Humanos)
   */
  async getAuditLogs(c: Context): Promise<Response> {
    const rawQuery = c.get('valid_query') as AuditLogQueryParams | undefined;
    const query = auditLogQuerySchema.parse(rawQuery || {});

    const response = scraperAuditService.query(query);
    return c.json(response, 200);
  }

  /**
   * Endpoint de Métricas do Scraper e Balancer
   */
  async getMetrics(c: Context): Promise<Response> {
    const stats = scraperAuditService.query({ limit: 1 });
    return c.json(
      {
        success: true,
        metrics: stats.metrics,
      },
      200
    );
  }
}

export const scraperRawController = new ScraperRawController();
