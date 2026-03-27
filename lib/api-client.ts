import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

class ApiClient {
    private client: AxiosInstance

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            withCredentials: false,
        })

        this.setupInterceptors()
    }

    private setupInterceptors() {
        // Request interceptor - Add token to requests
        this.client.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                const token = this.getToken()
                console.log('🔑 API Client - Token encontrado:', token ? 'SIM' : 'NÃO')
                console.log('🌐 API Client - URL:', config.url)
                console.log('🌐 API Client - Base URL:', config.baseURL)
                console.log('🌐 API Client - URL completa:', `${config.baseURL}${config.url}`)
                
                // Se for FormData, remover Content-Type para deixar o Axios definir automaticamente
                // Mas manter o header se já estiver definido corretamente
                if (config.data instanceof FormData && config.headers) {
                    // Remover apenas se for o Content-Type padrão 'application/json'
                    if (config.headers['Content-Type'] === 'application/json') {
                        delete config.headers['Content-Type']
                    }
                    console.log('📦 API Client - FormData detectado, Content-Type será definido automaticamente')
                    console.log('📦 API Client - FormData entries:', Array.from(config.data.entries()).map(([k, v]) => [k, v instanceof File ? `File: ${v.name}` : v]))
                }
                
                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`
                    console.log('🔑 API Client - Token adicionado aos headers')
                }
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor - Handle errors globally
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                // Log detalhes do erro para debug
                if (error.response) {
                    console.error('❌ Erro na resposta da API:', {
                        status: error.response.status,
                        statusText: error.response.statusText,
                        url: error.config?.url,
                        method: error.config?.method,
                        data: error.response.data,
                    })
                } else if (error.request) {
                    console.error('❌ Erro na requisição (sem resposta):', {
                        url: error.config?.url,
                        method: error.config?.method,
                    })
                } else {
                    console.error('❌ Erro ao configurar requisição:', error.message)
                }

                if (error.response?.status === 401) {
                    // Token expired or invalid
                    this.removeToken()
                    if (typeof window !== 'undefined') {
                        window.location.href = '/'
                    }
                }
                return Promise.reject(error)
            }
        )
    }

    private getToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('auth_token')
        }
        return null
    }

    private removeToken(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
        }
    }

    public setToken(token: string): void {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token)
        }
    }

    public getAxiosInstance(): AxiosInstance {
        return this.client
    }

    // HTTP Methods
    async get<T>(url: string, config = {}) {
        const response = await this.client.get<T>(url, config)
        return response.data
    }

    async post<T>(url: string, data = {}, config = {}) {
        const response = await this.client.post<T>(url, data, config)
        return response.data
    }

    async put<T>(url: string, data = {}, config = {}) {
        const response = await this.client.put<T>(url, data, config)
        return response.data
    }

    async patch<T>(url: string, data = {}, config = {}) {
        const response = await this.client.patch<T>(url, data, config)
        return response.data
    }

    async delete<T>(url: string, config = {}) {
        const response = await this.client.delete<T>(url, config)
        return response.data
    }
}

export const apiClient = new ApiClient()
export default apiClient
