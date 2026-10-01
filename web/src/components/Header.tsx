"use client";

import { Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-brand-30/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <span className="text-xl font-bold tracking-tight text-brand-text">
            Agrega
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/jobs/new"
            className="flex items-center justify-center gap-2 bg-brand-10 hover:bg-brand-10-hover text-white px-3 sm:px-4 py-2 min-h-[44px] min-w-[44px] rounded-xl font-bold transition-all shadow-sm active:scale-95 text-sm"
            aria-label="Publicar Vaga"
          >
            <span className="hidden sm:inline">Publicar Vaga</span>
            <span className="sm:hidden text-lg leading-none">+</span>
          </Link>

          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-brand-60 text-brand-text transition-colors focus:outline-none focus:ring-2 focus:ring-brand-10"
              aria-label="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
