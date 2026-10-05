'use client';

import { Webhook } from '@/types/webhook';

interface WebhookTableProps {
  data: Webhook[];
  actions: {
    onEdit: (webhook: Webhook) => void;
    onDelete: (id: string) => void;
    onRotate: (id: string) => void;
    onViewLogs: (webhook: Webhook) => void;
  };
}

export function WebhookTable({ data, actions }: WebhookTableProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 text-center rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">Nenhum webhook cadastrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Nome & Evento
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Último Recebimento
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((wh) => (
            <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {wh.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {wh.event}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  wh.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {wh.isActive ? 'Ativo' : 'Inativo'}
                </span>
                {wh.lastStatus && (
                  <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    wh.lastStatus === 'SUCCESS' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                  }`}>
                    {wh.lastStatus}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {wh.lastReceivedAt ? new Date(wh.lastReceivedAt).toLocaleString() : 'Nunca'}
                <div className="text-xs mt-1">Total: {wh.totalReceived} reqs</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => actions.onViewLogs(wh)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 mr-4"
                  title="Ver logs de entrega"
                >
                  Logs
                </button>
                <button
                  onClick={() => actions.onEdit(wh)}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 mr-4"
                >
                  Editar
                </button>
                <button
                  onClick={() => actions.onRotate(wh.id)}
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-900 dark:hover:text-orange-300 mr-4"
                  title="Gerar novo segredo"
                >
                  Girar Chave
                </button>
                <button
                  onClick={() => actions.onDelete(wh.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
