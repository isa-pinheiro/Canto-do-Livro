'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, User } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-purple-900 font-heading text-xl">
              <BookOpen className="h-6 w-6" />
              <span>Canto do Livro</span>
            </div>
            <Link
              href="/bookshelf"
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                pathname === '/bookshelf'
                  ? 'text-purple-900 bg-purple-50'
                  : 'text-purple-700 hover:text-purple-900 hover:bg-purple-50'
              }`}
            >
              <BookOpen className="h-5 w-5" />
              Minha Estante
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
            >
              <User className="h-5 w-5" />
              Perfil
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 