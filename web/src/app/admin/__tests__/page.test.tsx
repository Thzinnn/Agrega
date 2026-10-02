import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import DashboardPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    (api.get as import('vitest').Mock).mockReturnValue(new Promise(() => {}));
    render(<DashboardPage />);
    expect(screen.getByText('Carregando métricas...')).toBeInTheDocument();
  });

  it('renders metrics and chart correctly', async () => {
    const mockMetrics = {
      totalJobs: 100,
      activeJobs: 90,
      inactiveJobs: 10,
      totalClicks: 500,
      jobsBySource: [
        { source: 'MANUAL', count: 60 },
        { source: 'SCRAPER', count: 40 }
      ],
      topJobs: [
        { id: '1', title: 'Top Job', company: 'Top Co', clicksCount: 150, source: 'MANUAL' }
      ]
    };

    (api.get as import('vitest').Mock).mockResolvedValueOnce({ data: { data: mockMetrics } });
    
    render(<DashboardPage />);
    
    await waitFor(() => {
      // Check summary cards
      expect(screen.getByText('100')).toBeInTheDocument(); // total jobs
      expect(screen.getByText('90')).toBeInTheDocument();  // active jobs
      expect(screen.getByText('10')).toBeInTheDocument();  // inactive
      expect(screen.getByText('500')).toBeInTheDocument(); // total clicks
      
      // Check top jobs rendering
      expect(screen.getByText('Top Job')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      
      // Check chart title
      expect(screen.getByText('Origem das Vagas (Scraper vs Manual)')).toBeInTheDocument();
    });
  });
});
