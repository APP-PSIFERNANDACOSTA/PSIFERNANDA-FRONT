import apiClient from "@/lib/api-client";
import type {
  Record,
  RecordResponse,
  RecordsResponse,
  CreateRecordData,
  UpdateRecordData,
} from "@/types/record";

class RecordService {
  async getAll(params?: { patient_id?: number; search?: string }): Promise<Record[]> {
    const response = await apiClient.get<RecordsResponse>("/records", { params });
    return response.data;
  }

  async getById(id: number): Promise<Record> {
    const response = await apiClient.get<RecordResponse>(`/records/${id}`);
    return response.data;
  }

  async getPatientRecords(patientId: number): Promise<Record[]> {
    const response = await apiClient.get<RecordsResponse>(
      `/patients/${patientId}/records`
    );
    return response.data;
  }

  async create(data: CreateRecordData): Promise<Record> {
    const response = await apiClient.post<RecordResponse>("/records", data);
    return response.data;
  }

  async update(id: number, data: UpdateRecordData): Promise<Record> {
    const response = await apiClient.put<RecordResponse>(`/records/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/records/${id}`);
  }
}

const recordService = new RecordService();
export default recordService;


