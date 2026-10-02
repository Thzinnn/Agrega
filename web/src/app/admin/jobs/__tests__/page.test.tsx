import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import AdminJobsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('AdminJobsPage', () => {
  it('renders loading state initially', () => {
    (api.get as any).mockResolvedValueOnce({ data: { data: [] } });
    render(<AdminJobsPage />);
    expect(screen.getByText('Carregando vagas...')).toBeInTheDocument();
  });

  it('renders table with jobs', async () => {
    const mockJobs = [
      { id: '1', title: 'Developer', company: 'Tech', source: 'MANUAL', isActive: true, clicksCount: 10, createdAt: new Date().toISOString() },
      { id: '2', title: 'Designer', company: 'Art', source: 'SCRAPER', isActive: false, clicksCount: 5, createdAt: new Date().toISOString() }
    ];
    (api.get as any).mockResolvedValueOnce({ data: { data: mockJobs } });
    
    render(<AdminJobsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Developer')).toBeInTheDocument();
      expect(screen.getByText('Designer')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toBeInTheDocument();
      expect(screen.getByText('Inativo')).toBeInTheDocument();
    });
  });

  it('calls soft delete with confirmation', async () => {
    const mockJobs = [
      { id: '1', title: 'Developer', company: 'Tech', source: 'MANUAL', isActive: true, clicksCount: 10, createdAt: new Date().toISOString() }
    ];
    (api.get as any).mockResolvedValue({ data: { data: mockJobs } });
    (api.patch as any).mockResolvedValue({ data: { success: true } });
    
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    render(<AdminJobsPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Developer')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Inativar Vaga');
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/admin/jobs/1/soft-delete');
    });

    confirmSpy.mockRestore();
  });
});
