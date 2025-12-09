import apiClient from "@/lib/api-client"
import type { SessionReport } from "@/types/session-report"

class SessionReportService {
  async exists(patientId: number, sessionId: number): Promise<{ exists: boolean; reportId?: number }> {
    const response = await apiClient.get(`/patients/${patientId}/sessions/${sessionId}/report/exists`)
    return response.data
  }

  async get(patientId: number, sessionId: number): Promise<SessionReport> {
    const response = await apiClient.get(`/patients/${patientId}/sessions/${sessionId}/report`)
    return response.data.data
  }

  async getAll(patientId: number): Promise<SessionReport[]> {
    const response = await apiClient.get(`/patients/${patientId}/reports`)
    return response.data.data
  }

  async create(patientId: number, sessionId: number, data: { title?: string; content: string }): Promise<SessionReport> {
    const response = await apiClient.post(`/patients/${patientId}/sessions/${sessionId}/report`, data)
    return response.data.data
  }

  async update(patientId: number, sessionId: number, data: { title?: string; content?: string }): Promise<SessionReport> {
    const response = await apiClient.put(`/patients/${patientId}/sessions/${sessionId}/report`, data)
    return response.data.data
  }
}

// Criar instância e exportar
const sessionReportService = new SessionReportService()

// Exportar como named export primeiro
export { sessionReportService }

// Depois exportar como default
export default sessionReportService
