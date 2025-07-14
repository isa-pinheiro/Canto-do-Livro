'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, User, Search, Bell } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      fetchNotifications();
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/users/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        aria-label="Notificações"
        className="relative p-2 rounded-full hover:bg-purple-100"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-6 w-6 text-purple-900" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <div className="font-bold mb-2">Notificações</div>
          {loading ? (
            <div>Carregando...</div>
          ) : notifications.length === 0 ? (
            <div className="text-gray-500">Sem notificações.</div>
          ) : (
            <ul className="space-y-2 max-h-60 overflow-y-auto">
              {notifications.map((n, i) => (
                <li key={i} className="text-sm text-gray-800 border-b last:border-b-0 pb-2">
                  {n.message || n.content || JSON.stringify(n)}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm" role="navigation" aria-label="Navegação principal">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-purple-900 font-heading text-xl select-none cursor-default" aria-label="Página inicial">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
              <span>Canto do Livro</span>
            </div>
            <Link
              href="/bookshelf"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/bookshelf'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
              aria-current={pathname === '/bookshelf' ? 'page' : undefined}
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              Minha Estante
            </Link>
            {/* Novo link para o Feed */}
            <Link
              href="/feed"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/feed'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
              aria-current={pathname === '/feed' ? 'page' : undefined}
            >
              <BookOpen className="h-5 w-5" aria-hidden="true" />
              Feed
            </Link>
            <Link
              href="/chatbot"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/chatbot'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
              aria-current={pathname === '/chatbot' ? 'page' : undefined}
            >
              🤖 Bot de Recomendação
            </Link>
            <Link
              href="/search"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/search'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
              aria-current={pathname === '/search' ? 'page' : undefined}
            >
              <Search className="h-5 w-5" aria-hidden="true" />
              Pesquisar Usuários
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <NotificationPopover />
            <Link
              href="/profile"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/profile'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
              aria-current={pathname === '/profile' ? 'page' : undefined}
            >
              <User className="h-5 w-5" aria-hidden="true" />
              Meu Perfil
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}