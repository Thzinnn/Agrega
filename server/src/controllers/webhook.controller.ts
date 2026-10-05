import { Context } from 'hono';
import { PrismaClient } from '@prisma/client';
import { webhookHandlers } from '../services/webhook.handlers.js';
import { webhookPayloadSchema } from '../schemas/webhook.schema.js';
import { webhookService } from '../services/webhook.service.js';
import { logger } from '../utils/logger.js';

export class WebhookController {
  async receive(c: Context) {
    const prisma = c.get('prisma') as PrismaClient;
    const webhook = c.get('webhook');
    const deliveryId = c.get('deliveryId') as string;
    const rawBody = c.get('rawBody') as string;

    let bodyJson;
    try {
      bodyJson = JSON.parse(rawBody);
    } catch {
      await webhookService.logDelivery(prisma, webhook.id, deliveryId, 'REJECTED', 0, 'Invalid JSON body');
      return c.json({ success: false, message: 'Invalid JSON body' }, 400);
    }

    const parsed = webhookPayloadSchema.safeParse(bodyJson);
    if (!parsed.success) {
      await webhookService.logDelivery(prisma, webhook.id, deliveryId, 'REJECTED', 0, 'Invalid payload schema');
      return c.json({ success: false, message: 'Invalid payload format', errors: parsed.error.errors }, 400);
    }

    if (parsed.data.event !== webhook.event) {
      await webhookService.logDelivery(prisma, webhook.id, deliveryId, 'REJECTED', 0, `Event mismatch: Expected ${webhook.event}, got ${parsed.data.event}`);
      return c.json({ success: false, message: `Event mismatch. Expected ${webhook.event}` }, 400);
    }

    const handler = webhookHandlers[parsed.data.event];
    if (!handler) {
      await webhookService.logDelivery(prisma, webhook.id, deliveryId, 'REJECTED', 0, 'No handler registered for event');
      return c.json({ success: false, message: 'Unknown event' }, 400);
    }

    try {
      // Pass the raw parsed jobs to the handler
      const result = await handler(prisma, parsed.data);
      
      const hasRejects = result.rejected && result.rejected.length > 0;
      const status = result.processed > 0 || !hasRejects ? 'SUCCESS' : 'FAILED';
      
      await webhookService.logDelivery(
        prisma, 
        webhook.id, 
        deliveryId, 
        status, 
        result.processed, 
        hasRejects ? `Rejected ${result.rejected.length} items` : undefined
      );

      return c.json({
        success: true,
        data: result
      }, 200);

    } catch (error: any) {
      logger.error(`Webhook handling error for delivery ${deliveryId}:`, error);
      await webhookService.logDelivery(prisma, webhook.id, deliveryId, 'FAILED', 0, error.message || 'Internal error');
      return c.json({ success: false, message: 'Internal server error processing webhook' }, 500);
    }
  }
}

export const webhookController = new WebhookController();
