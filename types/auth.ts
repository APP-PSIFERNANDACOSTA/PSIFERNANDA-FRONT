export type UserRole = 'psychologist' | 'patient'

export interface User {
    id: number
    name: string
    email: string
    role: UserRole
    phone?: string
    cpf?: string
    crp?: string
    is_active: boolean
    email_verified_at?: string
    created_at: string
    updated_at: string
}

export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    name: string
    email: string
    password: string
    password_confirmation: string
    role?: UserRole
    phone?: string
    cpf?: string
    crp?: string
}

export interface AuthResponse {
    success: boolean
    message?: string
    user?: User
    token?: string
    errors?: Record<string, string[]>
}

export interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
}

