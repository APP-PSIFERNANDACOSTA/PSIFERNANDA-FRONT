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
}

export const googleOAuthService = new GoogleOAuthService();
export default googleOAuthService;
