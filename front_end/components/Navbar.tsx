'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, User, Search } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm" role="navigation" aria-label="Navegação principal">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-purple-900 font-heading text-xl" aria-label="Página inicial">
              <BookOpen className="h-6 w-6" aria-hidden="true" />
              <span>Canto do Livro</span>
            </Link>
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
              Perfil
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 