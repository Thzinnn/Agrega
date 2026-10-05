"use client";

import { Toaster } from 'react-hot-toast';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { 
  LayoutDashboard, 
  Briefcase, 
  Filter, 
  Users, 
  LogOut, 
  Menu,
  X,
  Database,
  Webhook as WebhookIcon
} from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  


  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data);
      } catch {
        /**
         * LÓGICA DE DEFESA (Anti-Loop):
         * Se a API rejeitar (ex: cookie expirou no back-end ou o usuário foi deletado), 
         * o Front-end não pode simplesmente redirecionar para `/admin/login`, pois o `middleware.ts` 
         * do Next.js veria que o cookie físico ainda existe e te jogaria de volta pra cá, 
         * criando um Loop Infinito (Redirect Loop). 
         * Solução: Acionamos a rota de `/logout` para invalidar fisicamente o cookie 
         * antes de redirecionar para o login.
         */
        try {
          await api.post('/auth/logout', {});
        } catch {
          // ignora se falhar
        }
        
        if (pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }
    };

    // Só busca o usuário se estivermos numa página protegida e ainda não tivermos os dados
    if (pathname !== '/admin/login' && !user) {
      fetchUser();
    }
  }, [pathname, user, router]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {}
    router.push('/admin/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Vagas', path: '/admin/jobs', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'Colunas Dinâmicas', path: '/admin/columns', icon: <Database className="w-5 h-5" /> },
    { name: 'Filtros', path: '/admin/filters', icon: <Filter className="w-5 h-5" /> },
    { name: 'Webhooks', path: '/admin/webhooks', icon: <WebhookIcon className="w-5 h-5" /> },
    { name: 'Usuários', path: '/admin/users', icon: <Users className="w-5 h-5" /> },
  ];

  // Se for a tela de login, não renderiza o layout administrativo
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-60">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-brand-60 flex font-sans">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-brand-30 transform transition-transform duration-300 md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="h-16 flex items-center justify-between px-6 border-b border-brand-30">
            <span className="text-brand-10 font-bold text-xl">Agrega Admin</span>
            <button className="md:hidden text-brand-muted" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <nav className="flex-1 py-6 px-4 space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${
                    isActive 
                      ? 'bg-brand-10 text-white' 
                      : 'text-brand-text hover:bg-brand-60 hover:text-brand-10'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-brand-30">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-brand-30 flex items-center justify-between px-4 sm:px-8 z-30">
          <button 
            className="md:hidden text-brand-text hover:text-brand-10 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-brand-text capitalize">
              {menuItems.find(m => pathname === m.path || (m.path !== '/admin' && pathname.startsWith(m.path)))?.name || 'Painel'}
            </h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-brand-text">{user.name}</p>
                <p className="text-xs text-brand-muted">{user.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-brand-10 flex items-center justify-center text-white font-bold uppercase overflow-hidden">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0)
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 overflow-auto">
          {children}
        </main>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}
