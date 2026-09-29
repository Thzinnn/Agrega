import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SidebarFilters } from '../SidebarFilters';

const defaultFilters = {
  workplaceType: [],
  hasSalary: false,
  education: [],
  contractTypes: [],
  minSalary: '',
  maxSalary: '',
};

describe('SidebarFilters Component', () => {
  it('renders correctly with default values', () => {
    render(<SidebarFilters filters={defaultFilters} onChange={() => {}} />);
    
    expect(screen.getByLabelText(/Apenas Remoto/i)).not.toBeChecked();
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
    
    // Procura por um checkbox de escolaridade que exista no SidebarFilters, ex: "Graduação Completa" ou similar
    // O texto exato renderizado no SidebarFilters é "Graduação - Completa", mas o regex acha parte.
    const educationCheck = screen.getByLabelText(/Graduação - Completa/i);
    await userEvent.click(educationCheck);
    
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      education: ['SUPERIOR_COMPLETE']
    }));
  });
});
