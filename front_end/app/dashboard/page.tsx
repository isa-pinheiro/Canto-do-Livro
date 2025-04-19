// app/dashboard/page.tsx
"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function Dashboard() {
  const router = useRouter()

  // Verifica se o usuário está autenticado
  useEffect(() => {
    const token = localStorage.getItem("access_token")
    if (!token) {
      router.push("/login")
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-[#1d232a] text-white flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Autenticação realizada com sucesso! ✅</h1>
        <p className="text-gray-300">Bem-vindo à área restrita do sistema</p>
        <Button 
          onClick={handleLogout}
          className="bg-[#8F00FF] hover:bg-[#8F00FF]"
        >
          Sair do Sistema
        </Button>
      </div>
    </div>
  )
}