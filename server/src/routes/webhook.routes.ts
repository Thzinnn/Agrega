import { Hono } from 'hono';
import { webhookController } from '../controllers/webhook.controller.js';
import { webhookSignatureMiddleware } from '../middlewares/webhookSignature.js';
import { bodyLimit } from 'hono/body-limit';
import { rateLimiter } from '../middlewares/rateLimiter.js';

export const webhookRoutes = new Hono();

// 1MB body limit per Att.md specs
webhookRoutes.use('/receive/*', bodyLimit({
  maxSize: 1024 * 1024,
  onError: (c) => {
    return c.json({ success: false, message: 'Payload too large (Max 1MB)' }, 413);
  }
}));

// Rate limiter explicitly requested in Att.md for webhooks
webhookRoutes.use('/receive/*', rateLimiter({
  windowMs: 60 * 1000,
  limit: 120 // 120 req/min per IP
}));

webhookRoutes.use('/receive/:webhookId', webhookSignatureMiddleware);

webhookRoutes.post('/receive/:webhookId', webhookController.receive.bind(webhookController));
