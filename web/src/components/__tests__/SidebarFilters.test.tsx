import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SidebarFilters } from '../SidebarFilters';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const defaultFilters = {
  workplaceType: [],
  hasSalary: false,
  education: [],
  contractTypes: [],
  minSalary: '',
  maxSalary: '',
};

describe('SidebarFilters Component', () => {
  beforeEach(() => {
    (api.get as import('vitest').Mock).mockResolvedValue({
      data: {
        data: [
          {
            slug: 'workplaceType',
            name: 'Modelo de Trabalho',
            options: [{ label: 'Remoto', value: 'REMOTE' }]
          },
          {
            slug: 'education',
            name: 'Escolaridade',
            options: [{ label: 'Graduação - Completa', value: 'SUPERIOR_COMPLETE' }]
          }
        ]
      }
    });
  });

  it('renders correctly with default values', async () => {
    render(<SidebarFilters filters={defaultFilters} onChange={() => {}} />);
    
    expect(await screen.findByLabelText(/Apenas Remoto/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Com salário informado/i)).not.toBeChecked();
  });

  it('calls onChange when a toggle is clicked', async () => {
    const handleChange = vi.fn();
    render(<SidebarFilters filters={defaultFilters} onChange={handleChange} />);
    
    const remoteToggle = screen.getByLabelText(/Apenas Remoto/i);
    await userEvent.click(remoteToggle);
    
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      workplaceType: ['REMOTE']
    }));
  });

  it('calls onChange when education is checked', async () => {
    const handleChange = vi.fn();
    render(<SidebarFilters filters={defaultFilters} onChange={handleChange} />);
    
    // Agora aguardamos o carregamento da API mockada
    const educationCheck = await screen.findByLabelText(/Graduação - Completa/i);
    await userEvent.click(educationCheck);
    
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      education: ['SUPERIOR_COMPLETE']
    }));
  });
});
