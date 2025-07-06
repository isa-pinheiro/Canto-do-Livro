'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/Navbar";
import { ReactNode } from 'react';

// Lista de rotas onde a navbar deve aparecer
const navbarRoutes = ['/bookshelf', '/search', '/profile', '/dashboard', '/chatbot'];

interface PageLayoutProps {
  children: ReactNode;
}

export function PageLayout({ children }: PageLayoutProps) {
  const pathname = usePathname();
  const showNavbar = navbarRoutes.includes(pathname);

  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  );
} 