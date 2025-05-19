'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      router.push('/bookshelf');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      console.log('Iniciando tentativa de login...');
      console.log('Dados sendo enviados:', { username, password: '****' });

      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      console.log('Resposta do servidor:', response.status);
      
      let data;
      try {
        data = await response.json();
        console.log('Dados recebidos:', data);
      } catch (e) {
        console.error('Erro ao parsear resposta:', e);
        throw new Error('Erro ao processar resposta do servidor');
      }

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Email ou senha incorretos');
        } else if (response.status === 400) {
          throw new Error(data.detail || 'Usuário desabilitado');
        } else {
          throw new Error(data.detail || 'Erro ao fazer login');
        }
      }

      console.log('Login bem-sucedido');
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      router.push('/bookshelf');
    } catch (error) {
      console.error('Erro no login:', error);
      setError(error instanceof Error ? error.message : 'Erro ao fazer login');
      toast({
        title: "Erro no login",
        description: error instanceof Error ? error.message : 'Erro ao fazer login',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-purple-900">Canto do Livro</h1>
          <p className="mt-2 text-purple-700">Entre para acessar sua estante</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-purple-900">Nome de usuário</Label>
              <Input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-purple-900">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-900 hover:bg-purple-950 text-white"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Entrando...
              </div>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="text-center">
            <p className="text-purple-700">
              Não tem uma conta?{' '}
              <Link href="/register" className="text-purple-900 hover:text-purple-950 font-medium">
                Registre-se
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 