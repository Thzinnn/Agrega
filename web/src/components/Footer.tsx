'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  // Esconder no painel de admin
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-100 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Agrega. Todos os direitos reservados.
        </div>
        <div className="flex space-x-6">
          <Link 
            href="/termos" 
            className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            Termos de Uso
          </Link>
          <Link 
            href="/privacidade" 
            className="text-sm text-gray-500 hover:text-brand-600 transition-colors"
          >
            Política de Privacidade
          </Link>
        </div>
      </div>
    </footer>
  );
}
