import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Admin Settings & Load Balancer Page', () => {
  const mockAiPool = {
    totalKeys: 2,
    healthyKeys: 1,
    cooldownKeys: 1,
    exhaustedKeys: 0,
    recommendedConcurrency: 4,
    keys: [
      {
        id: 'groq_key_1',
        provider: 'groq',
        maskedKey: 'gsk_...a1b2',
        status: 'HEALTHY',
        totalRequests: 42,
        totalSuccess: 40,
        totalRateLimits: 2,
        activeInflight: 0,
        avgLatencyMs: 310,
        cooldownRemainingSeconds: 0,
      },
      {
        id: 'groq_key_2',
        provider: 'groq',
        maskedKey: 'gsk_...c3d4',
        status: 'COOLDOWN',
        totalRequests: 18,
        totalSuccess: 15,
        totalRateLimits: 3,
        activeInflight: 0,
        avgLatencyMs: 290,
        cooldownRemainingSeconds: 45,
      },
    ],
  };

  const mockGatewayTraffic = {
    traffic: {
      inflight: 1,
      maxConcurrent: 8,
      totalRequests: 120,
      rejectedRequests: 0,
      deduplicatedCount: 14,
      avgLatencyMs: 18,
      cachedHashesCount: 14,
    },
    scraperMetrics: {
      totalReceived: 50,
      processedCount: 45,
      discardedCount: 5,
      failedCount: 0,
      successRatePercent: 90,
      avgLatencyMs: 240,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar estado de carregamento inicialmente', () => {
    (api.get as import('vitest').Mock).mockReturnValue(new Promise(() => {}));
    render(<SettingsPage />);
    expect(screen.getByText('Carregando métricas dos balanceadores...')).toBeInTheDocument();
  });

  it('deve renderizar os dados do AI Key Load Balancer e do Gateway Traffic com sucesso', async () => {
    (api.get as import('vitest').Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/settings/ai-pool')) {
        return Promise.resolve({ data: { success: true, data: mockAiPool } });
      }
      if (url.includes('/gateway/metrics')) {
        return Promise.resolve({ data: { success: true, data: mockGatewayTraffic } });
      }
      return Promise.reject(new Error(`URL não mockada: ${url}`));
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Load Balancer de Chaves de IA')).toBeInTheDocument();
      expect(screen.getByText('Gateway Único de Tráfego')).toBeInTheDocument();
      expect(screen.getByText('gsk_...a1b2')).toBeInTheDocument();
      expect(screen.getByText('gsk_...c3d4')).toBeInTheDocument();
      expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      expect(screen.getByText('COOLDOWN')).toBeInTheDocument();
      expect(screen.getAllByText('14').length).toBeGreaterThanOrEqual(1);
    });
  });

  it('deve enviar nova chave de API através do formulário de SystemSetting', async () => {
    (api.get as import('vitest').Mock).mockImplementation((url: string) => {
      if (url.includes('/admin/settings/ai-pool')) {
        return Promise.resolve({ data: { success: true, data: mockAiPool } });
      }
      if (url.includes('/gateway/metrics')) {
        return Promise.resolve({ data: { success: true, data: mockGatewayTraffic } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    (api.post as import('vitest').Mock).mockResolvedValueOnce({
      data: { success: true, data: { id: 'setting_1', key: 'GROQ_API_KEY_3' } },
    });

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Ex: gsk_... ou AIza...')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('Ex: gsk_... ou AIza...');
    fireEvent.change(input, { target: { value: 'gsk_test_new_key_12345' } });

    const submitBtn = screen.getByRole('button', { name: /Salvar Chave/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/admin/settings',
        expect.objectContaining({
          value: 'gsk_test_new_key_12345',
        })
      );
    });
  });
});
