import apiClient from "@/lib/api-client";
import type { Message, MessagesResponse } from "@/types/message";

class MessageService {
  async getAll(): Promise<Message[]> {
    const client = apiClient.getAxiosInstance();
    const response = await client.get<MessagesResponse>("/messages");
    return response.data.messages || [];
  }

  async create(data: { title: string; body: string; patient_id: number | null | "all" }): Promise<Message> {
    const client = apiClient.getAxiosInstance();
    const response = await client.post<{ success: boolean; data: Message }>("/messages", data);
    return response.data.data;
  }

  async update(id: number, data: Partial<{ title: string; body: string; is_active: boolean }>): Promise<Message> {
    const client = apiClient.getAxiosInstance();
    const response = await client.put<{ success: boolean; data: Message }>(`/messages/${id}`, data);
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    const client = apiClient.getAxiosInstance();
    await client.delete(`/messages/${id}`);
  }

  async getMyMessages(): Promise<Message[]> {
    const client = apiClient.getAxiosInstance();
    const response = await client.get<MessagesResponse>("/patient/messages");
    return response.data.messages || [];
  }
}

const messageService = new MessageService();
export default messageService;




