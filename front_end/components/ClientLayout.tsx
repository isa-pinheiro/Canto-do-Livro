'use client';

import { usePathname } from 'next/navigation';
import { Navbar } from "@/components/Navbar";

// Lista de rotas onde a navbar não deve aparecer
const noNavbarRoutes = ['/', '/login', '/register'];

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNavbar = !noNavbarRoutes.includes(pathname);

  return (
    <main>
      {showNavbar && <Navbar />}
      {children}
    </main>
  );
} 