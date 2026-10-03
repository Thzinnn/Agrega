import { Context, Next } from 'hono';
import { AppError } from '../errors/AppError.js';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3333',
];

export const csrfMiddleware = async (c: Context, next: Next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(c.req.method)) {
    const origin = c.req.header('Origin');
    const referer = c.req.header('Referer');

    const originOrReferer = origin || referer;

    if (!originOrReferer) {
      throw new AppError('Acesso bloqueado por segurança (Missing Origin/Referer)', 403);
    }

    let isAllowed = false;

    for (const allowed of ALLOWED_ORIGINS) {
      if (originOrReferer.startsWith(allowed)) {
        isAllowed = true;
        break;
      }
    }

    if (!isAllowed) {
      if (originOrReferer.match(/^https:\/\/.*\.pages\.dev$/)) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      throw new AppError('Acesso bloqueado por segurança (Origem Inválida)', 403);
    }
  }

  await next();
};
