import { Context, Next } from 'hono';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'param';

/**
 * Interceptador de Validação (Zod Middleware)
 * Arquitetura Defensiva: Em vez de espalhar verificações 'if (!body.title)' por todos os Controllers,
 * criamos este Middleware. Ele intercepta a requisição na Borda (antes de chegar na lógica de negócio),
 * submete o JSON/Query ao schema do Zod (que fará o parse matemático e tipagem estrita).
 * 
 * Se o dado for inválido, ele dispara um 'ZodError' que é pego pelo 'errorHandler.ts',
 * abortando a requisição imediatamente (Fail Fast). Se passar, injeta o objeto limpo no Context ('c.set').
 */
export const validateRequest = (schema: ZodSchema, location: RequestLocation = 'body') => {
  return async (c: Context, next: Next) => {
    try {
      let data;
      if (location === 'body') {
        data = await c.req.json();
      } else if (location === 'query') {
        const queries = c.req.queries();
        data = {} as Record<string, string | string[]>;
        for (const [key, val] of Object.entries(queries)) {
           if (val !== undefined) {
             data[key] = (val.length === 1 ? val[0] : val) as string | string[];
           }
        }
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
