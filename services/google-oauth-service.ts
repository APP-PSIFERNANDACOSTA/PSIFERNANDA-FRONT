import apiClient from '@/lib/api-client';

class GoogleOAuthService {
  /**
   * Get authorization URL for Google OAuth
   */
  async getAuthUrl(redirectTo?: string): Promise<string> {
    const params = redirectTo ? { redirect_to: redirectTo } : {};
    const response = await apiClient.get<{ success: boolean; auth_url: string }>('/google/oauth/url', { params });
    if (!response.success || !response.auth_url) {
      throw new Error('Não foi possível obter URL de autenticação');
    }
    return response.auth_url;
  }

  /**
   * Check if Google Calendar is connected
   */
  async getStatus(): Promise<{ connected: boolean; expired: boolean }> {
    const response = await apiClient.get<{ success: boolean; connected: boolean; expired: boolean }>('/google/oauth/status');
    return {
      connected: response.connected || false,
      expired: response.expired || false,
    };
  }

  /**
   * Disconnect Google Calendar
   */
  async disconnect(): Promise<void> {
    await apiClient.post('/google/oauth/disconnect');
  }

  /**
   * Get events from Google Calendar for a date range (manual import - calls Google API)
   */
  async getCalendarEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    const response = await apiClient.get<{ success: boolean; events: GoogleCalendarEvent[] }>(
      '/google/calendar/events',
      { params: { start_date: startDate, end_date: endDate } }
    );
    if (!response.success || !response.events) return [];
    return response.events;
  }

  /**
   * Get stored imported events from backend (no Google API call)
   */
  async getImportedEvents(startDate: string, endDate: string): Promise<GoogleCalendarEvent[]> {
    const response = await apiClient.get<{ success: boolean; events: GoogleCalendarEvent[] }>(
      '/google/calendar/imported-events',
      { params: { start_date: startDate, end_date: endDate } }
    );
    if (!response.success || !response.events) return [];
    return response.events;
  }

  /**
   * Save imported events to backend (persist after first import)
   */
  async storeImportedEvents(events: GoogleCalendarEvent[]): Promise<void> {
    await apiClient.post('/google/calendar/imported-events', {
      events: events.map(e => ({
        id: e.id,
        summary: e.summary,
        description: e.description,
        start: e.start,
        end: e.end,
        colorId: e.colorId,
        htmlLink: e.htmlLink,
        hangoutLink: e.hangoutLink ?? e.meetLink,
      })),
    });
  }

  /**
   * Cria no Google Calendar eventos para sessões locais que ainda não têm vínculo (google_event_id).
   */
  async pushSessionsToCalendar(): Promise<PushSessionsToCalendarResponse> {
    return apiClient.post<PushSessionsToCalendarResponse>('/google/calendar/push-sessions', {});
  }
}

export interface PushSessionsToCalendarResponse {
  success: boolean;
  message?: string;
  created?: number;
  skipped_already_linked?: number;
  examined?: number;
  failed?: number;
  errors?: Array<{ session_id: number; message: string }>;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string | null;
  start: string;
  end: string;
  colorId?: string | null;
  htmlLink?: string;
  hangoutLink?: string; // Link da chamada Google Meet
  meetLink?: string; // Fallback de link de videoconferência
}

export const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
