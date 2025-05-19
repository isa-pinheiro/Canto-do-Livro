"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!username.trim() || !password.trim()) {
      setError("Por favor, preencha todos os campos")
      setIsLoading(false)
      return
    }

    try {
      const formData = new URLSearchParams()
      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Credenciais inválidas. Verifique seu usuário e senha.")
        }
        
        try {
          const errorData = await response.json()
          throw new Error(errorData.detail || `Erro ao autenticar (${response.status})`)
        } catch {
          throw new Error(`Erro na comunicação com o servidor (${response.status})`)
        }
      }

      const tokenData = await response.json()
      
      // Armazena os tokens no localStorage
      localStorage.setItem('access_token', tokenData.access_token)
      localStorage.setItem('refresh_token', tokenData.refresh_token)
      
      // Redireciona para a estante
      router.push("/bookshelf")

    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setIsLoading(false)
    }
  }

  return (
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
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Usuário"
                className="border-gray-700 bg-[#2c3440] text-white placeholder:text-gray-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Senha"
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
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>
          <div className="mt-4 text-center text-sm text-gray-400">
            Não tem uma conta?{" "}
            <a href="/register" className="text-[#8F00FF] hover:underline">
              Registre-se
            </a>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}