'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/Navbar";
import { ReactNode } from 'react';

// Lista de rotas onde a navbar não deve aparecer
const noNavbarRoutes = ['/', '/login', '/register'];

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();
  const showNavbar = !noNavbarRoutes.includes(pathname);

  return (
    <main className="min-h-screen">
      {showNavbar && <Navbar />}
      {children}
    </main>
  );
} 