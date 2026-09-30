import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'param';

export const validateRequest = (schema: ZodSchema, location: RequestLocation = 'body') => {
  return async (c: Context, next: Next) => {
    try {
      let data;
      if (location === 'body') {
        data = await c.req.json();
      } else if (location === 'query') {
        data = c.req.query();
      } else if (location === 'param') {
        data = c.req.param();
      }

      const parsed = schema.parse(data);
      c.set(`valid_${location}`, parsed);
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw error;
    }
  };
};
