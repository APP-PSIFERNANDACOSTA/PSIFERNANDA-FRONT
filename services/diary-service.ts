import apiClient from "@/lib/api-client";
import type {
  DiaryEntry,
  CreateDiaryEntryData,
  UpdateDiaryEntryData,
  DiaryResponse,
  DiaryEntriesResponse,
  DiaryFilters,
  WeeklyAnalysisResponse,
} from "@/types/diary";

class DiaryService {
  // Patient methods (for patients to manage their own entries)
  async getMyEntries(filters?: DiaryFilters): Promise<DiaryEntriesResponse> {
    const response = await apiClient.get<DiaryEntriesResponse>(
      "/patient/diary",
      { params: filters }
    );
    return response;
  }

  async create(data: CreateDiaryEntryData): Promise<DiaryEntry> {
    const response = await apiClient.post<DiaryResponse>(
      "/patient/diary",
      data
    );
    return response.entry;
  }

  async update(id: number, data: UpdateDiaryEntryData): Promise<DiaryEntry> {
    const response = await apiClient.put<DiaryResponse>(
      `/patient/diary/${id}`,
      data
    );
    return response.entry;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/patient/diary/${id}`);
  }

  // Psychologist methods (read-only access to all patient entries)
  async getAllEntries(filters?: DiaryFilters): Promise<DiaryEntriesResponse> {
    const response = await apiClient.get<DiaryEntriesResponse>("/diary", {
      params: filters,
    });
    return response;
  }

  async getPatientEntries(
    patientId: number,
    filters?: Omit<DiaryFilters, "patient_id">
  ): Promise<DiaryEntriesResponse> {
    const response = await apiClient.get<DiaryEntriesResponse>(
      `/patients/${patientId}/diary`,
      { params: filters }
    );
    return response;
  }

    async getEntry(id: number): Promise<DiaryResponse> {
        const response = await apiClient.get<DiaryResponse>(`/diary/${id}`);
        return response;
    }

    async analyzeWeekly(patientId: number, days: number = 7): Promise<WeeklyAnalysisResponse> {
        const response = await apiClient.post<WeeklyAnalysisResponse>(
            `/patients/${patientId}/diary/analyze-weekly`,
            { days }
        );
        return response;
    }
}

export default new DiaryService();
