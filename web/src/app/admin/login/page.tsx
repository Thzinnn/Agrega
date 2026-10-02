"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema) as any, // Cast temporário devido ao conflito de tipos
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setError(null);
      await api.post('/auth/login', data);
      router.push('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao realizar login. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-60 flex flex-col justify-center items-center p-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg border border-brand-30 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-brand-text mb-2">Acesso Restrito</h1>
          <p className="text-brand-muted">Painel de Administração do Agrega</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">E-mail</label>
            <input
              {...register('email')}
              type="email"
              className="w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 bg-brand-60"
              placeholder="admin@admin.com"
            />
            {errors.email && <span className="text-red-500 text-sm mt-1 block">{errors.email.message}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-text mb-1">Senha</label>
            <input
              {...register('password')}
              type="password"
              className="w-full px-4 py-3 rounded-xl border border-brand-30 focus:outline-none focus:ring-2 focus:ring-brand-10 bg-brand-60"
              placeholder="••••••••"
            />
            {errors.password && <span className="text-red-500 text-sm mt-1 block">{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-10 text-white font-bold py-3 px-4 rounded-xl hover:bg-brand-10/90 transition-colors flex items-center justify-center mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    </div>
  );
}
