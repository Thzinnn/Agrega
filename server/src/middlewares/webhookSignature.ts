import { Context, Next } from 'hono';
import { PrismaClient } from '@prisma/client';
import { verifyHmacSignature } from '../utils/hmac.js';

export const webhookSignatureMiddleware = async (c: Context, next: Next) => {
  const prisma = c.get('prisma') as PrismaClient;
  const webhookId = c.req.param('webhookId');
  
  if (!webhookId) {
    return c.json({ success: false, message: 'Webhook ID is missing' }, 400);
  }

  const timestampStr = c.req.header('x-agrega-timestamp');
  const signature = c.req.header('x-agrega-signature');
  const deliveryId = c.req.header('x-agrega-delivery');

  if (!timestampStr || !signature || !deliveryId) {
    return c.json({ success: false, message: 'Missing webhook headers' }, 401);
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return c.json({ success: false, message: 'Invalid timestamp' }, 401);
  }

  // Janela de ±5 minutos
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 300) {
    return c.json({ success: false, message: 'Request timestamp is outside the valid window (expirado)' }, 401);
  }

  const webhook = await prisma.webhook.findUnique({
    where: { id: webhookId }
  });

  if (!webhook) {
    return c.json({ success: false, message: 'Webhook not found' }, 404);
  }

  if (!webhook.isActive) {
    return c.json({ success: false, message: 'Webhook is inactive' }, 403);
  }

  // Idempotência
  const existingDelivery = await prisma.webhookDelivery.findUnique({
    where: {
      webhookId_deliveryId: {
        webhookId: webhook.id,
        deliveryId: deliveryId
      }
    }
  });

  if (existingDelivery) {
    // Retorna 200 imediatamente com flag duplicate
    return c.json({ success: true, duplicate: true, message: 'Delivery already processed' }, 200);
  }

  // Validar assinatura HMAC
  const rawBody = await c.req.text();
  const payload = `${timestampStr}.${rawBody}`;
  
  const isValid = await verifyHmacSignature(webhook.secret, payload, signature);
  if (!isValid) {
    return c.json({ success: false, message: 'Invalid HMAC signature' }, 401);
  }

  // Injetar contexto
  c.set('webhook', webhook);
  c.set('deliveryId', deliveryId);
  c.set('rawBody', rawBody); // Vamos re-parsear no controller
  
  return await next();
};
