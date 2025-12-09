import apiClient from '@/lib/api-client';
import type {
  Session,
  SessionsResponse,
  SessionResponse,
  CreateMultipleSessionsData,
  UpdateSessionData,
} from '@/types/session';

class SessionService {
  /**
   * Get all sessions for the logged psychologist (for calendar)
   */
  async getAllSessions(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      '/sessions',
      { params }
    );
    return response.sessions;
  }

  /**
   * Get all sessions for a patient
   */
  async getPatientSessions(
    patientId: number,
    params?: {
      status?: string;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      `/patients/${patientId}/sessions`,
      { params }
    );
    return response.sessions;
  }

  /**
   * Get a specific session
   */
  async getSession(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.get<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}`
    );
    return response.session;
  }

  /**
   * Create multiple sessions at once
   */
  async createSessions(
    patientId: number,
    data: CreateMultipleSessionsData
  ): Promise<Session[]> {
    const response = await apiClient.post<SessionsResponse>(
      `/patients/${patientId}/sessions`,
      data
    );
    return response.sessions;
  }

  /**
   * Update a session
   */
  async updateSession(
    patientId: number,
    sessionId: number,
    data: UpdateSessionData
  ): Promise<Session> {
    const response = await apiClient.put<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}`,
      data
    );
    return response.session;
  }

  /**
   * Mark session as completed
   */
  async markAsCompleted(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.post<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}/complete`
    );
    return response.session;
  }

  /**
   * Mark session as no show (falta)
   */
  async markAsNoShow(patientId: number, sessionId: number): Promise<Session> {
    const response = await apiClient.post<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}/no-show`
    );
    return response.session;
  }

  /**
   * Reschedule a session
   */
  async reschedule(
    patientId: number,
    sessionId: number,
    data: { session_date: string; duration?: number | null; notes?: string | null }
  ): Promise<Session> {
    const response = await apiClient.post<SessionResponse>(
      `/patients/${patientId}/sessions/${sessionId}/reschedule`,
      data
    );
    return response.session;
  }

  /**
   * Delete a session
   */
  async deleteSession(patientId: number, sessionId: number): Promise<void> {
    await apiClient.delete(`/patients/${patientId}/sessions/${sessionId}`);
  }

  /**
   * Get patient's own sessions (for patient portal)
   */
  async getMySessions(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<Session[]> {
    const response = await apiClient.get<SessionsResponse>(
      '/patient/sessions',
      { params }
    );
    return response.sessions;
  }
}

export const sessionService = new SessionService();
export default sessionService;

