import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError.js';
import * as crypto from 'crypto';

export class WebhookService {
  private generateSecret(): string {
    return 'whsec_' + crypto.randomBytes(32).toString('hex');
  }

  async createWebhook(prisma: PrismaClient, data: { name: string; event?: string; isActive?: boolean }) {
    const secret = this.generateSecret();
    const webhook = await prisma.webhook.create({
      data: {
        name: data.name,
        event: data.event || 'job.upsert',
        isActive: data.isActive ?? true,
        secret
      }
    });
    return webhook;
  }

  async listWebhooks(prisma: PrismaClient) {
    const webhooks = await prisma.webhook.findMany({
      where: { id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache para Admins
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        event: true,
        isActive: true,
        totalReceived: true,
        lastReceivedAt: true,
        lastStatus: true,
        createdAt: true,
        updatedAt: true,
      }
    });
    return webhooks;
  }

  async getWebhook(prisma: PrismaClient, id: string) {
    const webhook = await prisma.webhook.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        event: true,
        isActive: true,
        totalReceived: true,
        lastReceivedAt: true,
        lastStatus: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!webhook) throw new AppError('Webhook not found', 404);
    return webhook;
  }

  async updateWebhook(prisma: PrismaClient, id: string, data: { name?: string; event?: string; isActive?: boolean }) {
    try {
      const webhook = await prisma.webhook.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          event: true,
          isActive: true,
          totalReceived: true,
          lastReceivedAt: true,
          lastStatus: true,
          createdAt: true,
          updatedAt: true,
        }
      });
      return webhook;
    } catch {
      throw new AppError('Webhook not found', 404);
    }
  }

  async deleteWebhook(prisma: PrismaClient, id: string) {
    try {
      await prisma.webhook.delete({ where: { id } });
    } catch {
      throw new AppError('Webhook not found', 404);
    }
  }

  async rotateSecret(prisma: PrismaClient, id: string) {
    const newSecret = this.generateSecret();
    try {
      const webhook = await prisma.webhook.update({
        where: { id },
        data: { secret: newSecret },
        select: { id: true, secret: true } // secret is returned once
      });
      return webhook;
    } catch {
      throw new AppError('Webhook not found', 404);
    }
  }

  async getDeliveries(prisma: PrismaClient, webhookId: string) {
    const deliveries = await prisma.webhookDelivery.findMany({
      where: { webhookId, id: { not: Date.now().toString() } }, // Bypass Hyperdrive cache
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return deliveries;
  }

  async logDelivery(prisma: PrismaClient, webhookId: string, deliveryId: string, status: 'SUCCESS' | 'FAILED' | 'REJECTED', processed: number, errorMsg?: string) {
    const now = new Date();
    await prisma.webhookDelivery.create({
      data: {
        webhookId,
        deliveryId,
        status,
        processed,
        error: errorMsg || null,
        createdAt: now
      }
    });

    await prisma.webhook.update({
      where: { id: webhookId },
      data: {
        totalReceived: { increment: 1 },
        lastReceivedAt: now,
        lastStatus: status
      }
    });
  }
}

export const webhookService = new WebhookService();
