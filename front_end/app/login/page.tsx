'use client';

import LoginForm from "@/components/login-form";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1d232a] p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white">Login</h1>
          <p className="mt-2 text-gray-400">Entre com suas credenciais</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
} 