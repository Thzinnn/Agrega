'use client';

/**
 * Error Boundary Global (Root Level)
 * Por que foi feito: Este componente entra em cena quando um erro catastrófico acontece 
 * dentro do próprio `layout.tsx` (RootLayout), onde o `error.tsx` comum não alcançaria.
 * Como ele substitui toda a árvore DOM, ele deve conter suas próprias tags `<html>` e `<body>`.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro Crítico do Sistema</h2>
          <p className="text-gray-600 mb-8 max-w-md">
            Desculpe, ocorreu uma falha grave na renderização da aplicação.
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            Recarregar Aplicação
          </button>
        </div>
      </body>
    </html>
  );
}
