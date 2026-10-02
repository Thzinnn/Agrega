import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { sign, verify } from 'hono/jwt';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { AppError } from '../errors/AppError.js';
import { PrismaClient } from '@prisma/client';

export const authRoutes = new Hono<{ Variables: { prisma: PrismaClient; user: any }; Bindings: { JWT_SECRET: string } }>();

const getJwtSecret = (c: any) => c.env?.JWT_SECRET || process.env.JWT_SECRET || 'super-secret-jwt-key';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

authRoutes.post('/login', async (c) => {
  const prisma = c.get('prisma');
  const rawBody = await c.req.json();
  const { email, password } = loginSchema.parse(rawBody);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    throw new AppError('Credenciais inválidas', 401);
  }

  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const secret = getJwtSecret(c);
  const token = await sign(payload, secret, 'HS256');

  const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV !== 'development';
  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  const { password: _, ...userWithoutPassword } = user;

  return c.json({
    success: true,
    data: {
      user: userWithoutPassword,
      token,
    },
  });
});

authRoutes.post('/logout', (c) => {
  const isProd = process.env.NODE_ENV === 'production' || process.env.NODE_ENV !== 'development';
  deleteCookie(c, 'auth_token', {
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'None' : 'Lax',
  });
  return c.json({ success: true });
});

// Middleware to protect routes that require authentication
export const authMiddleware = async (c: any, next: any) => {
  let token = getCookie(c, 'auth_token');

  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    throw new AppError('Não autenticado', 401);
  }

  try {
    const secret = getJwtSecret(c);
    const payload = await verify(token, secret, 'HS256');
    c.set('user', payload);
    await next();
  } catch (error) {
    throw new AppError('Token inválido ou expirado', 401);
  }
};

authRoutes.get('/me', authMiddleware, async (c) => {
  const prisma = c.get('prisma');
  const userPayload = c.get('user');

  const user = await prisma.user.findUnique({
    where: { id: userPayload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  if (!user) {
    throw new AppError('Usuário não encontrado', 404);
  }

  return c.json({
    success: true,
    data: user,
  });
});
