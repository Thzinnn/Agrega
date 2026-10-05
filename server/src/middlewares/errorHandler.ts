import { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

/**
 * Central de Interceptação de Erros (Error Boundary do Backend)
 * Por que foi feito: Impedir vazamento de Stack Traces (que revelam detalhes do ambiente 
 * ou da estrutura do banco de dados para atacantes) e padronizar o payload de retorno para o Front-end.
 */
export const errorHandler = (
  error: Error,
  c: Context
) => {
  if (error instanceof ZodError) {
    const errorMessages = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    return c.json({
      success: false,
      message: 'Falha de validação nos dados fornecidos',
      errors: errorMessages,
    }, 400);
  }

  if (error instanceof AppError) {
    return c.json({
      success: false,
      message: error.message,
      ...(error.errors && error.errors.length > 0 ? { errors: error.errors } : {}),
    }, error.statusCode as ContentfulStatusCode);
  }

  // Cloudflare Workers (Edge) não exportam as classes de Erro na raiz do Prisma.
  // Usamos verificação estrutural (duck typing) via `.name` para compatibilidade.
  if (error.name === 'PrismaClientInitializationError') {
    return c.json({
      success: false,
      message: 'Não foi possível conectar ao banco de dados PostgreSQL.',
      errors: [
        'O servidor do PostgreSQL não está rodando ou a variável DATABASE_URL no server/.env está inacessível.',
        'Verifique se o PostgreSQL está em execução na porta 5432 ou configure uma URL de banco na nuvem (ex: Supabase ou Neon).',
      ],
    }, 503);
  }

  if (error.name === 'PrismaClientKnownRequestError') {
    const code = (error as { code?: string }).code;
    if (code === 'P2025') {
      return c.json({
        success: false,
        message: 'Registro não encontrado no banco de dados',
      }, 404);
    }

    if (code === 'P2002') {
      return c.json({
        success: false,
        message: 'Já existe um registro com os valores informados',
      }, 409);
    }
  }

  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    return c.json({
      success: false,
      error: 'Corpo da requisição inválido. Envie um JSON bem formatado.'
    }, 400);
  }

  // SEGURANÇA: O erro interno NÃO é repassado ao cliente.
  // Em vez disso, registramos de forma anônima e segura no logger estruturado
  logger.error('Unhandled Error', error, {
    path: c.req.path,
    method: c.req.method,
  });

  return c.json({
    success: false,
    message: 'Erro interno no servidor' // Mascaração de erro para o Front-end
  }, 500);
};
