"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function SuccessPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus !== "true") {
      router.push("/")
    } else {
      setIsAuthenticated(true)
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    router.push("/")
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#14181c] p-4 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <CheckCircle className="h-20 w-20 text-[#00c030]" />
        </div>
        <h1 className="mb-4 text-3xl font-bold">Autenticado com Sucesso!</h1>
        <p className="mb-8 text-gray-400">Você foi autenticado com sucesso e agora tem acesso ao sistema.</p>
        <Button onClick={handleLogout} className="bg-[#00c030] text-white hover:bg-[#00a328]">
          Sair
        </Button>
      </div>
    </main>
  )
}
