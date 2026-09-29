import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { JobCard } from '../JobCard';
import { Job } from '@/types/job';

const mockJob: Job = {
  id: '1',
  title: 'Engenheiro de Software',
  company: 'Tech Corp',
  location: 'São Paulo, SP',
  description: 'Descrição completa da vaga',
  workplaceType: 'REMOTE',
  level: 'MID',
  contractType: 'CLT',
  salaryMin: 10000,
  salaryMax: 10000,
  applicationUrl: 'https://example.com',
  source: 'MANUAL',
  isActive: true,
  benefits: 'VR, VT, Plano de Saúde',
  createdAt: '2023-10-01T00:00:00.000Z',
  updatedAt: '2023-10-01T00:00:00.000Z',
};

describe('JobCard Component', () => {
  it('renders job basic information', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('Engenheiro de Software')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('São Paulo, SP')).toBeInTheDocument();
  });

  it('renders salary and benefits badges if provided', () => {
    render(<JobCard job={mockJob} />);
    
    expect(screen.getByText('R$ 10.000 - R$ 10.000')).toBeInTheDocument();
    expect(screen.getByText('Benefícios')).toBeInTheDocument();
  });

  it('does not render salary and benefits badges if null', () => {
    const jobWithoutOptionals: Job = { ...mockJob, salaryMin: null, salaryMax: null, benefits: null };
    render(<JobCard job={jobWithoutOptionals} />);
    
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
    expect(screen.queryByText('Benefícios')).not.toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<JobCard job={mockJob} onClick={handleClick} />);
    
    const card = screen.getByText('Engenheiro de Software').closest('div')?.parentElement;
    if (card) {
      await userEvent.click(card);
    }
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
