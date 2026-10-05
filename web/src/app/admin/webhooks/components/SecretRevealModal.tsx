'use client';

interface SecretRevealModalProps {
  isOpen: boolean;
  secret: string;
  onClose: () => void;
}

export function SecretRevealModal({ isOpen, secret, onClose }: SecretRevealModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    alert('Segredo copiado para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border-2 border-orange-500">
        <div className="bg-orange-500 px-6 py-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            ⚠️ Atenção: Guarde este Segredo!
          </h3>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Este é o <strong>Segredo HMAC (Secret)</strong> do seu Webhook. Por motivos de segurança (para evitar vazamentos em caso de roubo de banco de dados), ele <strong>nunca mais será exibido novamente</strong> nesta tela.
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Copie o valor abaixo e salve no seu sistema/script de forma segura:
          </p>

          <div className="flex items-center gap-2 mt-4">
            <code className="flex-1 bg-gray-100 dark:bg-gray-900 p-3 rounded text-sm break-all font-mono text-gray-800 dark:text-green-400 border border-gray-200 dark:border-gray-700">
              {secret}
            </code>
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded transition-colors"
            >
              Copiar
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
          >
            Já salvei, fechar
          </button>
        </div>
      </div>
    </div>
  );
}
