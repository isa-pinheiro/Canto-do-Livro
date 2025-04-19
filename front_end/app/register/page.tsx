'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem!');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Tentando registrar usuário:', formData);
      
      const response = await fetch('http://localhost:8000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          disabled: false
        }),
      });

      console.log('Resposta do servidor:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Usuário registrado com sucesso:', data);
        router.push('/login');
      } else {
        const errorData = await response.json();
        console.error('Erro no registro:', errorData);
        setError(errorData.detail || 'Erro ao registrar usuário');
      }
    } catch (error) {
      console.error('Erro ao registrar:', error);
      setError('Erro ao conectar com o servidor. Verifique se o servidor está rodando.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1d232a] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Registrar</h1>
          <p className="mt-2 text-gray-400">Crie sua conta para começar</p>
        </div>
        <Card className="border-0 bg-[#1d232a] text-white shadow-lg">
          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-gray-300">
                    Nome de Usuário
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Usuário"
                    className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-300">
                    Nome Completo
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="Nome completo"
                    className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Email"
                    className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Senha"
                    className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirmar senha"
                    className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
                  />
                </div>
                {error && <p className="text-sm text-[#ff6b6b]">{error}</p>}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col">
              <Button 
                type="submit" 
                className="w-full bg-[#8F00FF] text-white hover:bg-[#8F00FF]" 
                disabled={isLoading}
              >
                {isLoading ? "Registrando..." : "Registrar"}
              </Button>
              <div className="mt-4 text-center text-sm text-gray-400">
                Já tem uma conta?{" "}
                <a href="/login" className="text-[#8F00FF] hover:underline">
                  Faça login
                </a>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 