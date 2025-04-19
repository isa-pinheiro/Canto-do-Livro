'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1d232a] p-4">
      <div className="text-center space-y-8">
        <h1 className="text-6xl font-bold text-white">
          Canto do Livro
        </h1>
        <div className="space-y-4">
          <Button 
            onClick={() => router.push('/login')}
            className="w-64 bg-[#8F00FF] text-white hover:bg-[#8F00FF] text-lg h-12"
          >
            Entrar
          </Button>
          <Button 
            onClick={() => router.push('/register')}
            className="w-64 bg-[#2c3440] text-white hover:bg-[#2c3440] text-lg h-12"
            variant="outline"
          >
            Registrar
          </Button>
        </div>
      </div>
    </div>
  );
}
