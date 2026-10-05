'use client';

import { useState, useEffect } from 'react';
import { Webhook, WebhookCreateInput, WebhookUpdateInput } from '@/types/webhook';

interface WebhookFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: WebhookCreateInput | WebhookUpdateInput) => void;
  webhook?: Webhook | null;
  isLoading?: boolean;
}

export function WebhookFormModal({ isOpen, onClose, onSubmit, webhook, isLoading }: WebhookFormModalProps) {
  const [name, setName] = useState('');
  const [event, setEvent] = useState('job.upsert');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (webhook) {
      setName(webhook.name);
      setEvent(webhook.event);
      setIsActive(webhook.isActive);
    } else {
      setName('');
      setEvent('job.upsert');
      setIsActive(true);
    }
  }, [webhook, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {webhook ? 'Editar Webhook' : 'Novo Webhook'}
          </h3>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({ name, event, isActive });
        }}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nome (Identificação)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
                placeholder="Ex: Robô Python Vagas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Evento
              </label>
              <select
                value={event}
                onChange={(e) => setEvent(e.target.value)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-white"
              >
                <option value="job.upsert">job.upsert</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Na V1, suportamos apenas a sincronização de vagas.</p>
            </div>

            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Webhook Ativo
              </label>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
