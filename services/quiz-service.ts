import apiClient from '@/lib/api-client'
import {
  Quiz,
  QuizAttempt,
  CreateQuizData,
  UpdateQuizData,
  SubmitQuizResponseData,
  QuizResponse,
  QuizzesResponse,
  QuizAttemptsResponse,
  SubmitQuizResponse,
} from '@/types/quiz'

class QuizService {
  private readonly basePath = '/quizzes'
  private readonly patientPath = '/patient/quizzes'

  /**
   * Get all quizzes for psychologists
   */
  async getAll(params?: {
    page?: number
    per_page?: number
    status?: string
    type?: string
  }): Promise<QuizzesResponse> {
    try {
      const response = await apiClient.get<QuizzesResponse>(this.basePath, {
        params,
      })
      return response
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao buscar quizzes',
      }
    }
  }

  /**
   * Get single quiz by ID
   */
  async getById(id: number): Promise<QuizResponse> {
    try {
      const response = await apiClient.get<QuizResponse>(`${this.basePath}/${id}`)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar quiz',
      }
    }
  }

  /**
   * Create new quiz
   */
  async create(data: CreateQuizData): Promise<QuizResponse> {
    try {
      const response = await apiClient.post<QuizResponse>(this.basePath, data)
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao criar quiz',
        errors: error.response?.data?.errors,
      }
    }
  }

  /**
   * Update quiz
   */
  async update(id: number, data: UpdateQuizData): Promise<QuizResponse> {
    try {
      const response = await apiClient.put<QuizResponse>(
        `${this.basePath}/${id}`,
        data
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar quiz',
        errors: error.response?.data?.errors,
      }
    }
  }

  /**
   * Delete quiz
   */
  async delete(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/${id}`)
      return { success: true, message: 'Quiz removido com sucesso' }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao remover quiz',
      }
    }
  }

  /**
   * Get available quizzes for patients
   */
  async getAvailableQuizzes(): Promise<{ success: boolean; quizzes?: Quiz[]; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; quizzes: Quiz[] }>(this.patientPath)
      return response
    } catch (error: any) {
      return {
        success: false,
        quizzes: [],
        message: error.response?.data?.message || 'Erro ao buscar quizzes disponíveis',
      }
    }
  }

  /**
   * Get patient responses for a specific quiz
   */
  async getPatientResponses(quizId: number, patientId: number): Promise<{
    success: boolean
    data?: {
      patient: any
      quiz: Quiz
      assignment: any
      attempts: any[]
      total_attempts: number
      latest_attempt: any
    }
    message?: string
  }> {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: {
          patient: any
          quiz: Quiz
          assignment: any
          attempts: any[]
          total_attempts: number
          latest_attempt: any
        }
      }>(`${this.basePath}/${quizId}/patient/${patientId}/responses`)
      
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar respostas do paciente',
      }
    }
  }

  /**
   * Generate questions with AI
   */
  async generateQuestionsWithAI(data: {
    type: string
    topic?: string
    count?: number
    question_type?: string
  }): Promise<{
    success: boolean
    data?: {
      questions: any[]
      generated_by: string
      prompt_used?: string
      message?: string
    }
    message?: string
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: {
          questions: any[]
          generated_by: string
          prompt_used?: string
          message?: string
        }
      }>(`${this.basePath}/generate-questions`, data)
      
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao gerar perguntas com IA',
      }
    }
  }

  /**
   * Generate complete quiz with AI (title, description, duration, questions)
   */
  async generateQuizWithAI(data: {
    topic: string
    type?: string
    question_count: number
  }): Promise<{
    success: boolean
    data?: {
      title: string
      description: string
      type: string
      duration_minutes: number
      questions: any[]
    }
    generated_by?: string
    message?: string
  }> {
    try {
      const response = await apiClient.post<{
        success: boolean
        data: {
          title: string
          description: string
          type: string
          duration_minutes: number
          questions: any[]
        }
        generated_by?: string
      }>(`${this.basePath}/generate-quiz`, data)
      
      return response
    } catch (error: any) {
      console.error('Error generating quiz with AI:', error)
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao gerar quiz com IA',
      }
    }
  }

  /**
   * Submit quiz responses
   */
  async submitResponse(quizId: number, data: SubmitQuizResponseData): Promise<SubmitQuizResponse> {
    try {
      const response = await apiClient.post<SubmitQuizResponse>(
        `${this.patientPath}/${quizId}/submit`,
        data
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao responder quiz',
        errors: error.response?.data?.errors,
      }
    }
  }

  /**
   * Get patient's quiz history
   */
  async getPatientHistory(params?: {
    page?: number
    per_page?: number
  }): Promise<QuizAttemptsResponse> {
    try {
      const response = await apiClient.get<QuizAttemptsResponse>(
        `${this.patientPath}/history`,
        { params }
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao buscar histórico',
      }
    }
  }

  /**
   * Get quiz attempts for psychologists
   */
  async getQuizAttempts(quizId: number, params?: {
    page?: number
    per_page?: number
    patient_id?: number
  }): Promise<QuizAttemptsResponse> {
    try {
      const response = await apiClient.get<QuizAttemptsResponse>(
        `${this.basePath}/${quizId}/attempts`,
        { params }
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao buscar tentativas do quiz',
      }
    }
  }

  /**
   * Get single attempt details
   */
  async getAttemptById(attemptId: number): Promise<{
    success: boolean
    attempt?: QuizAttempt
    message?: string
  }> {
    try {
      const response = await apiClient.get<{ success: boolean; attempt: QuizAttempt }>(
        `/quiz-attempts/${attemptId}`
      )
      return response
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao buscar tentativa',
      }
    }
  }

  /**
   * Search quizzes
   */
  async search(query: string): Promise<QuizzesResponse> {
    return this.getAll({ search: query })
  }

  /**
   * Get quizzes by type
   */
  async getByType(type: string): Promise<QuizzesResponse> {
    return this.getAll({ type })
  }

  /**
   * Get quizzes by status
   */
  async getByStatus(status: string): Promise<QuizzesResponse> {
    return this.getAll({ status })
  }

  /**
   * Calculate quiz score (client-side helper)
   */
  calculateScore(responses: Record<number, string>, maxScore: number): number {
    const totalScore = Object.values(responses).reduce((sum, val) => sum + Number.parseInt(val || '0'), 0)
    return Math.round((totalScore / maxScore) * 100)
  }

  /**
   * Get score interpretation (client-side helper)
   */
  getScoreInterpretation(score: number, type: string): {
    level: string
    color: string
    description: string
  } {
    const interpretations = {
      anxiety: [
        { min: 0, max: 24, level: 'Baixo', color: 'green' },
        { min: 25, max: 49, level: 'Leve', color: 'blue' },
        { min: 50, max: 74, level: 'Moderado', color: 'yellow' },
        { min: 75, max: 100, level: 'Alto', color: 'red' },
      ],
      sleep: [
        { min: 0, max: 30, level: 'Excelente', color: 'green' },
        { min: 31, max: 60, level: 'Bom', color: 'blue' },
        { min: 61, max: 80, level: 'Regular', color: 'yellow' },
        { min: 81, max: 100, level: 'Ruim', color: 'red' },
      ],
      mood: [
        { min: 0, max: 25, level: 'Muito Bom', color: 'green' },
        { min: 26, max: 50, level: 'Bom', color: 'blue' },
        { min: 51, max: 75, level: 'Regular', color: 'yellow' },
        { min: 76, max: 100, level: 'Ruim', color: 'red' },
      ],
    }

    const typeInterpretations = interpretations[type as keyof typeof interpretations] || interpretations.anxiety
    
    for (const range of typeInterpretations) {
      if (score >= range.min && score <= range.max) {
        return {
          level: range.level,
          color: range.color,
          description: `Seu resultado indica um nível ${range.level}.`,
        }
      }
    }

    return {
      level: 'Indefinido',
      color: 'gray',
      description: 'Não foi possível interpretar o resultado.',
    }
  }

  /**
   * Get quiz attempts for a specific quiz (for psychologists)
   */
  async getQuizAttempts(quizId: number): Promise<{ success: boolean; data?: QuizAttempt[]; message?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: QuizAttempt[] }>(`${this.basePath}/${quizId}/attempts`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao buscar tentativas do quiz',
      }
    }
  }
}

export const quizService = new QuizService()
export default quizService
