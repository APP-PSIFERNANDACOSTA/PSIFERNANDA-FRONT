"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Lock, Mail, AlertCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, logout, user, isAuthenticated } = useAuth()
  const router = useRouter()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user && !isLoading) {
      if (user.role === 'psychologist') {
        router.push('/dashboard')
      } else {
        router.push('/portal')
      }
    }
  }, [isAuthenticated, user, isLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const result = await login({ email, password })

    if (!result.success) {
      setError(result.message || "E-mail ou senha incorretos")
    }
    // O setIsLoading(false) é gerenciado pelo auth-context no finally
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-32 w-60 items-center justify-center">
            <Image
              src="/logo.png"
              alt="Logo"
              width={400}
              height={200}
              className="object-contain"
            />
          </div>
          <CardDescription className="text-muted-foreground">
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-border text-primary" />
                <span className="text-muted-foreground">Lembrar-me</span>
              </label>
              <a href="#" className="text-primary hover:underline">
                Esqueceu a senha?
              </a>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={isLoading}
              style={{ 
                backgroundColor: 'var(--color-primary-fixed)',
                color: 'white',
                borderColor: 'var(--color-primary-fixed)'
              }}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          {isAuthenticated && (
            <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 mb-4">
                <p className="text-sm text-blue-600">
                  Você já está logado como <strong>{user?.name}</strong>
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => logout()}
                  className="mt-2"
                >
                  Fazer Logout
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
