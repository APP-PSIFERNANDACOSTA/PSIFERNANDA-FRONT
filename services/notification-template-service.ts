import apiClient from "@/lib/api-client";

export interface NotificationTemplate {
  id: number;
  type: string;
  channel: string;
  title_template: string;
  body_template: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SessionReminderRule {
  id?: number;
  channel: string;
  offset_minutes: number;
  title_template: string;
  body_template: string;
  enabled: boolean;
  window_minutes: number;
  created_at?: string;
  updated_at?: string;
}

interface TemplatesResponse {
  success: boolean;
  templates: NotificationTemplate[];
}

interface RulesResponse {
  success: boolean;
  rules: SessionReminderRule[];
}

class NotificationTemplateService {
  async getTemplates(channel: string = "push"): Promise<NotificationTemplate[]> {
    const response = await apiClient.get<TemplatesResponse>(
      `/notifications/templates?channel=${channel}`
    );
    return response.templates;
  }

  async updateTemplates(
    templates: Partial<NotificationTemplate>[],
    channel: string = "push"
  ): Promise<NotificationTemplate[]> {
    const response = await apiClient.put<TemplatesResponse>(
      `/notifications/templates?channel=${channel}`,
      { templates }
    );
    return response.templates;
  }

  async getRules(channel: string = "push"): Promise<SessionReminderRule[]> {
    const response = await apiClient.get<RulesResponse>(
      `/notifications/rules?channel=${channel}`
    );
    return response.rules;
  }

  async updateRules(
    rules: Partial<SessionReminderRule>[],
    channel: string = "push"
  ): Promise<SessionReminderRule[]> {
    const response = await apiClient.put<RulesResponse>(
      `/notifications/rules?channel=${channel}`,
      { rules }
    );
    return response.rules;
  }
}

export default new NotificationTemplateService();
