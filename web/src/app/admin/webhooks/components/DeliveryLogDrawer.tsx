'use client';

import { Webhook, WebhookDelivery } from '@/types/webhook';

interface DeliveryLogDrawerProps {
  isOpen: boolean;
  webhook: Webhook | null;
  deliveries: WebhookDelivery[];
  isLoading: boolean;
  onClose: () => void;
}

export function DeliveryLogDrawer({ isOpen, webhook, deliveries, isLoading, onClose }: DeliveryLogDrawerProps) {
  if (!isOpen || !webhook) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50">
      <div className="absolute inset-y-0 right-0 max-w-2xl w-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col transform transition-transform duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Logs: {webhook.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Últimas 50 entregas</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            ✕ Fechar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <span className="text-gray-500">Carregando logs...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              Nenhuma entrega registrada para este webhook.
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <div 
                  key={delivery.id} 
                  className={`border rounded-lg p-4 ${
                    delivery.status === 'SUCCESS' 
                      ? 'border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-900/10' 
                      : 'border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-900/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        delivery.status === 'SUCCESS' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {delivery.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {delivery.deliveryId}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                    <p><strong>Vagas processadas:</strong> {delivery.processed}</p>
                    {delivery.error && (
                      <div className="mt-2 p-2 bg-white/50 dark:bg-black/20 rounded border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 break-words text-xs font-mono">
                        {delivery.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
