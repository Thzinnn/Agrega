import { Context } from 'hono';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';

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
    }, error.statusCode as any);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return c.json({
      success: false,
      message: 'Não foi possível conectar ao banco de dados PostgreSQL.',
      errors: [
        'O servidor do PostgreSQL não está rodando ou a variável DATABASE_URL no server/.env está inacessível.',
        'Verifique se o PostgreSQL está em execução na porta 5432 ou configure uma URL de banco na nuvem (ex: Supabase ou Neon).',
      ],
    }, 503);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return c.json({
        success: false,
        message: 'Registro não encontrado no banco de dados',
      }, 404);
    }

    if (error.code === 'P2002') {
      return c.json({
        success: false,
        message: 'Já existe um registro com os valores informados',
      }, 409);
    }
  }

  console.error('Unhandled Error:', error);

  return c.json({
    success: false,
    message: 'Erro interno no servidor',
    error: error.message,
    stack: error.stack
  }, 500);
};
