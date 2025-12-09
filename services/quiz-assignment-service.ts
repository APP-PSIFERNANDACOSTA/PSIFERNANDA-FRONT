import apiClient from '@/lib/api-client'
import {
  PatientQuizAssignment,
  AssignQuizToPatientsData,
  AssignQuizToPatientsResponse,
  QuizAssignmentsResponse,
  UpdateAssignmentData,
  UpdateAssignmentResponse,
} from '@/types/quiz'

class QuizAssignmentService {
  private readonly basePath = '/quizzes'

  /**
   * Assign quiz to multiple patients
   */
  async assignToPatients(
    quizId: number, 
    data: AssignQuizToPatientsData
  ): Promise<AssignQuizToPatientsResponse> {
    try {
      const response = await apiClient.post<AssignQuizToPatientsResponse>(
        `${this.basePath}/${quizId}/assign`,
        data
      )
      return { success: true, ...response }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atribuir quiz aos pacientes',
        errors: error.response?.data?.errors,
      }
    }
  }

  /**
   * Get quiz assignments for psychologist
   */
  async getAssignments(params?: {
    status?: string
    quiz_id?: number
    patient_id?: number
    page?: number
    per_page?: number
  }): Promise<QuizAssignmentsResponse> {
    try {
      const response = await apiClient.get<QuizAssignmentsResponse>(
        `${this.basePath}/assignments`,
        { params }
      )
      
      return { success: true, data: response.data, meta: response.meta }
    } catch (error: any) {
      console.error('Erro ao buscar atribuições:', error)
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || 'Erro ao buscar atribuições',
      }
    }
  }

  /**
   * Update assignment status
   */
  async updateAssignment(
    assignmentId: number, 
    data: UpdateAssignmentData
  ): Promise<UpdateAssignmentResponse> {
    try {
      const response = await apiClient.put<UpdateAssignmentResponse>(
        `${this.basePath}/assignments/${assignmentId}`,
        data
      )
      return { success: true, ...response }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao atualizar atribuição',
        errors: error.response?.data?.errors,
      }
    }
  }

  /**
   * Remove assignment
   */
  async removeAssignment(assignmentId: number): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.delete(`${this.basePath}/assignments/${assignmentId}`)
      return { success: true, message: response.message || 'Atribuição removida com sucesso' }
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Erro ao remover atribuição',
      }
    }
  }

  /**
   * Get status badge color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'assigned':
        return 'blue'
      case 'in_progress':
        return 'yellow'
      case 'completed':
        return 'green'
      case 'expired':
        return 'red'
      default:
        return 'gray'
    }
  }

  /**
   * Get status label in Portuguese
   */
  getStatusLabel(status: string): string {
    switch (status) {
      case 'assigned':
        return 'Atribuído'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluído'
      case 'expired':
        return 'Expirado'
      default:
        return 'Desconhecido'
    }
  }

  /**
   * Check if assignment is overdue
   */
  isOverdue(dueDate?: string): boolean {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  /**
   * Format due date for display
   */
  formatDueDate(dueDate?: string): string {
    if (!dueDate) return 'Sem prazo'
    return new Date(dueDate).toLocaleDateString('pt-BR')
  }
}

export const quizAssignmentService = new QuizAssignmentService()
