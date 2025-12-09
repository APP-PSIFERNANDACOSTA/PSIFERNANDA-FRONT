import apiClient from '@/lib/api-client'
import { AuthResponse, LoginCredentials, RegisterData, User } from '@/types/auth'

class AuthService {
    /**
     * Register a new user
     */
    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/register', data)

            if (response.success && response.token) {
                this.saveAuthData(response.token, response.user!)
            }

            return response
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao registrar usuário',
                errors: error.response?.data?.errors,
            }
        }
    }

    /**
     * Login user
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        try {
            const response = await apiClient.post<AuthResponse>('/auth/login', credentials)

            if (response.success && response.token) {
                this.saveAuthData(response.token, response.user!)
            }

            return response
        } catch (error: any) {
            return {
                success: false,
                message: error.response?.data?.message || 'Erro ao fazer login',
                errors: error.response?.data?.errors,
            }
        }
    }

    /**
     * Logout user
     */
    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout')
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            this.clearAuthData()
        }
    }

    /**
     * Get current authenticated user
     */
    async getCurrentUser(): Promise<User | null> {
        try {
            console.log('🔍 Verificando usuário atual...')
            console.log('🔑 Token:', this.getToken() ? 'Presente' : 'Ausente')
            const response = await apiClient.get<{ success: boolean; user: User }>('/auth/me')
            console.log('✅ Usuário atual verificado:', response.user)
            return response.user
        } catch (error: any) {
            console.error('❌ Erro ao verificar usuário atual:', error)
            console.error('📊 Detalhes:', {
                status: error?.response?.status,
                message: error?.message,
                url: error?.config?.url
            })
            this.clearAuthData()
            return null
        }
    }

    /**
     * Save auth data to localStorage
     */
    private saveAuthData(token: string, user: User): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
            localStorage.setItem('auth_user', JSON.stringify(user))
            apiClient.setToken(token)
        }
    }

    /**
     * Clear auth data from localStorage
     */
    private clearAuthData(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
        }
    }

    /**
     * Get stored token
     */
    getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token')
        }
        return null
    }

    /**
     * Get stored user
     */
    getStoredUser(): User | null {
        if (typeof window !== 'undefined') {
            const userStr = localStorage.getItem('auth_user')
            return userStr ? JSON.parse(userStr) : null
        }
        return null
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        return !!this.getToken()
    }
}

export const authService = new AuthService()
export default authService

