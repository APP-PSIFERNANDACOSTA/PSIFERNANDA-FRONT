"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import authService from "@/services/auth-service"
import { User, LoginCredentials, RegisterData } from "@/types/auth"

interface AuthContextType {
  user: User | null
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; message?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string; errors?: any }>
  logout: () => Promise<void>
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      console.log('🔄 Carregando usuário do localStorage...')
      const storedUser = authService.getStoredUser()
      const token = authService.getToken()
      
      console.log('👤 Usuário armazenado:', storedUser ? 'Presente' : 'Ausente')
      console.log('🔑 Token armazenado:', token ? 'Presente' : 'Ausente')

      if (storedUser && token) {
        console.log('✅ Dados encontrados, verificando token...')
        // Verify token is still valid by fetching current user
        const currentUser = await authService.getCurrentUser()
        if (currentUser) {
          console.log('✅ Token válido, usuário carregado:', currentUser.name)
          setUser(currentUser)
        } else {
          console.log('❌ Token inválido, limpando dados...')
          // Token invalid, clear data
          authService.logout()
        }
      } else {
        console.log('❌ Dados não encontrados no localStorage')
      }
      setIsLoading(false)
    }

    loadUser()
  }, [])

  /**
   * Login user with email and password
   */
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await authService.login(credentials)

      if (response.success && response.user) {
        setUser(response.user)

        // Redirect based on user role with a small delay to ensure state is updated
        setTimeout(() => {
          if (response.user!.role === 'psychologist') {
            router.push('/dashboard')
          } else {
            router.push('/portal')
          }
        }, 100)

        return { success: true }
      }

      return {
        success: false,
        message: response.message || 'Email ou senha inválidos',
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao fazer login. Tente novamente.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Register new user
   */
  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authService.register(data)

      if (response.success && response.user) {
        setUser(response.user)

        // Redirect based on user role with a small delay to ensure state is updated
        setTimeout(() => {
          if (response.user!.role === 'psychologist') {
            router.push('/dashboard')
          } else {
            router.push('/portal')
          }
        }, 100)

        return { success: true }
      }

      return {
        success: false,
        message: response.message || 'Erro ao criar conta',
        errors: response.errors,
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao criar conta. Tente novamente.',
      }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Logout user
   */
  const logout = async () => {
    setIsLoading(true)
    await authService.logout()
    setUser(null)
    router.push('/')
    setIsLoading(false)
  }

  const value = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

