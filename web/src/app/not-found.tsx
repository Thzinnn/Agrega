import Link from 'next/link';

/**
 * Custom 404 Page (Not Found)
 * Por que foi feito: O Next.js exibe uma página de 404 muito técnica e padrão. 
 * Esta página sobrepõe isso para manter o usuário no ecossistema (Design System do Agrega), 
 * evitando frustração ao buscar vagas que já expiraram ou foram deletadas.
 */
export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <span className="text-6xl font-black text-brand-600 opacity-20">404</span>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Página não encontrada</h2>
      <p className="text-gray-600 mb-8 max-w-md">
        A página que você está procurando pode ter sido removida, mudou de nome ou está temporariamente indisponível.
      </p>
      <Link
        href="/"
        className="px-8 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
      >
        Voltar para o Início
      </Link>
    </div>
  );
}
