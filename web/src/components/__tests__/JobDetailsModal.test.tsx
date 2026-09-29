import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { JobDetailsModal } from '../JobDetailsModal';
import { Job } from '@/types/job';

const mockJob: Job = {
  id: '1',
  title: 'Engenheiro de Software',
  company: 'Tech Corp',
  location: 'São Paulo, SP',
  description: 'Descrição completa da vaga',
  workplaceType: 'REMOTE',
  education: 'SUPERIOR_COMPLETE',
  contractType: 'CLT',
  salary: null,
  salaryMin: 10000,
  salaryMax: 10000,
  applicationUrl: 'https://example.com',
  contactEmail: null,
  contactPhone: null,
  source: 'MANUAL',
  isActive: true,
  benefits: 'Plano de Saúde',
  hasVA: true,
  hasVR: true,
  hasVT: false,
  hasLifeInsurance: false,
  hasMedicalInsurance: false,
  hasDentalInsurance: false,
  createdAt: '2023-10-01T00:00:00.000Z',
  updatedAt: '2023-10-01T00:00:00.000Z',
};

describe('JobDetailsModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<JobDetailsModal job={mockJob} isOpen={false} onClose={() => {}} />);
    expect(screen.queryByText('Engenheiro de Software')).not.toBeInTheDocument();
  });

  it('renders correctly when isOpen is true', () => {
    render(<JobDetailsModal job={mockJob} isOpen={true} onClose={() => {}} />);
    expect(screen.getByText('Engenheiro de Software')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Descrição completa da vaga')).toBeInTheDocument();
    expect(screen.getByText('R$ 10.000 - R$ 10.000')).toBeInTheDocument();
    expect(screen.getByText('Plano de Saúde')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(<JobDetailsModal job={mockJob} isOpen={true} onClose={handleClose} />);
    
    // The close button has an X icon inside it. We can find it by its role.
    const closeButtons = screen.getAllByRole('button');
    // Assuming the first button is the close button
    await userEvent.click(closeButtons[0]);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
