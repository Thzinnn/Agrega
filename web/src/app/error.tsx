'use client';

import { useEffect } from 'react';

/**
 * Error Boundary Local (Next.js App Router)
 * Por que foi feito: Quando um Server Component (ou Client Component) abaixo desta rota lança uma exceção não tratada,
 * o Next.js normalmente mostraria a tela branca de erro do React ou do Next. 
 * Com isso, isolamos o crash, mantemos a navegação ativa (Header/Footer continuam) e mostramos 
 * um fallback amigável ao usuário.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service like Sentry
    console.error('Captured in ErrorBoundary:', error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-2xl mx-4 my-8 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Ops! Algo deu errado.</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        Nossa equipe já foi notificada ou você encontrou uma instabilidade temporária. 
        Tente novamente ou volte para o início.
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors shadow-md"
        >
          Tentar Novamente
        </button>
        <a
          href="/"
          className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-full font-medium hover:bg-gray-50 transition-colors shadow-sm"
        >
          Voltar ao Início
        </a>
      </div>
    </div>
  );
}
