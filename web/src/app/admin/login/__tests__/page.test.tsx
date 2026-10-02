import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LoginPage from '../page';
import { api } from '@/lib/api';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('LoginPage', () => {
  it('renders login form correctly', () => {
    render(<LoginPage />);
    expect(screen.getByPlaceholderText('admin@admin.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar no Painel/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    (api.post as import('vitest').Mock).mockRejectedValueOnce({
      response: { data: { message: 'Credenciais inválidas' } },
    });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@admin.com'), { target: { value: 'admin@admin.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });

  it('calls api.post on valid submission', async () => {
    (api.post as import('vitest').Mock).mockResolvedValueOnce({ data: { success: true } });

    render(<LoginPage />);
    
    fireEvent.change(screen.getByPlaceholderText('admin@admin.com'), { target: { value: 'admin@admin.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar no Painel/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'admin@admin.com',
        password: 'admin',
      });
    });
  });
});
