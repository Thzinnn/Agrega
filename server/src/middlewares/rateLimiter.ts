import { Context, Next } from 'hono';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (options: { limit: number; windowMs: number }) => {
  return async (c: Context, next: Next) => {
    // Get IP from Cloudflare or fallback
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    
    const now = Date.now();
    const clientRecord = requestCounts.get(ip);

    if (clientRecord) {
      if (now > clientRecord.resetTime) {
        // Reset window
        clientRecord.count = 1;
        clientRecord.resetTime = now + options.windowMs;
      } else {
        clientRecord.count++;
        if (clientRecord.count > options.limit) {
          return c.json({
            success: false,
            message: 'Too Many Requests',
            error: 'Muitas requisições. Tente novamente mais tarde.',
          }, 429);
        }
      }
    } else {
      requestCounts.set(ip, {
        count: 1,
        resetTime: now + options.windowMs,
      });
    }

    return next();
  };
};
