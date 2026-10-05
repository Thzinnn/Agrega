import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WebhookTable } from '../WebhookTable';
import { Webhook } from '@/types/webhook';

const mockActions = {
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onRotate: vi.fn(),
  onViewLogs: vi.fn(),
};

const mockWebhooks: Webhook[] = [
  {
    id: '1',
    name: 'Scraper Python',
    event: 'job.upsert',
    isActive: true,
    totalReceived: 42,
    lastReceivedAt: new Date().toISOString(),
    lastStatus: 'SUCCESS',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Scraper Desativado',
    event: 'job.upsert',
    isActive: false,
    totalReceived: 0,
    lastReceivedAt: null,
    lastStatus: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

describe('WebhookTable', () => {
  it('renders empty state when no data is provided', () => {
    render(<WebhookTable data={[]} actions={mockActions} />);
    expect(screen.getByText(/Nenhum webhook cadastrado/i)).toBeDefined();
  });

  it('renders webhook items', () => {
    render(<WebhookTable data={mockWebhooks} actions={mockActions} />);
    expect(screen.getByText('Scraper Python')).toBeDefined();
    expect(screen.getByText('Scraper Desativado')).toBeDefined();
    expect(screen.getByText('Ativo')).toBeDefined();
    expect(screen.getByText('Inativo')).toBeDefined();
  });

  it('calls correct actions on button clicks', () => {
    render(<WebhookTable data={mockWebhooks} actions={mockActions} />);
    
    const logsBtns = screen.getAllByText('Logs');
    fireEvent.click(logsBtns[0]);
    expect(mockActions.onViewLogs).toHaveBeenCalledWith(mockWebhooks[0]);

    const editBtns = screen.getAllByText('Editar');
    fireEvent.click(editBtns[0]);
    expect(mockActions.onEdit).toHaveBeenCalledWith(mockWebhooks[0]);

    const rotateBtns = screen.getAllByText('Girar Chave');
    fireEvent.click(rotateBtns[0]);
    expect(mockActions.onRotate).toHaveBeenCalledWith(mockWebhooks[0].id);

    const deleteBtns = screen.getAllByText('Excluir');
    fireEvent.click(deleteBtns[0]);
    expect(mockActions.onDelete).toHaveBeenCalledWith(mockWebhooks[0].id);
  });
});
