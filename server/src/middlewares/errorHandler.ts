import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../errors/AppError.js';

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof ZodError) {
    const errorMessages = error.issues.map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    });

    res.status(400).json({
      success: false,
      message: 'Falha de validação nos dados fornecidos',
      errors: errorMessages,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(error.errors && error.errors.length > 0 ? { errors: error.errors } : {}),
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      success: false,
      message: 'Não foi possível conectar ao banco de dados PostgreSQL.',
      errors: [
        'O servidor do PostgreSQL não está rodando ou a variável DATABASE_URL no server/.env está inacessível.',
        'Verifique se o PostgreSQL está em execução na porta 5432 ou configure uma URL de banco na nuvem (ex: Supabase ou Neon).',
      ],
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      res.status(404).json({
        success: false,
        message: 'Registro não encontrado no banco de dados',
      });
      return;
    }

    if (error.code === 'P2002') {
      res.status(409).json({
        success: false,
        message: 'Já existe um registro com os valores informados',
      });
      return;
    }
  }

  console.error('Unhandled Error:', error);

  res.status(500).json({
    success: false,
    message: 'Erro interno no servidor',
  });
};
