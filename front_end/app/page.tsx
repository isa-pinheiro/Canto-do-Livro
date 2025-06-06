'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          router.push('/bookshelf');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        <h1 className="text-5xl font-bold text-purple-900 mb-4 font-heading">
          Bem-vindo ao Canto do Livro
        </h1>
        <p className="text-xl text-purple-700 mb-8 font-sans">
          Sua plataforma para organizar e compartilhar sua jornada literária
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.push('/register')}
            className="bg-purple-800 hover:bg-purple-900 text-white px-8 py-6 text-lg rounded-lg transition-all font-sans"
          >
            Criar Conta
          </Button>
          <Button
            onClick={() => router.push('/login')}
            variant="outline"
            className="border-2 border-purple-800 text-purple-800 hover:bg-purple-50 px-8 py-6 text-lg rounded-lg transition-all font-sans"
          >
            Entrar
          </Button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-purple-100">
            <h3 className="text-xl font-semibold mb-2 text-purple-900 font-heading">Organize seus livros</h3>
            <p className="text-purple-700 font-sans">Mantenha um registro organizado da sua biblioteca pessoal</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-purple-100">
            <h3 className="text-xl font-semibold mb-2 text-purple-900 font-heading">Compartilhe experiências</h3>
            <p className="text-purple-700 font-sans">Conecte-se com outros leitores e compartilhe suas leituras</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-purple-100">
            <h3 className="text-xl font-semibold mb-2 text-purple-900 font-heading">Descubra novos livros</h3>
            <p className="text-purple-700 font-sans">Encontre recomendações baseadas em seus interesses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
