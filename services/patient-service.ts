import apiClient from "@/lib/api-client";
import type {
  Patient,
  CreatePatientData,
  UpdatePatientData,
  PatientsResponse,
  PatientResponse,
  GrantAccessResponse,
  UpcomingBirthdaysResponse,
  UpdatePortalPasswordPayload,
} from "@/types/patient";

class PatientService {
  async getAll(params?: {
    search?: string;
    status?: "active" | "inactive";
    page?: number;
    per_page?: number;
  }): Promise<PatientsResponse> {
    const response = await apiClient.get<PatientsResponse>("/patients", {
      params,
    });
    return response;
  }

  async getById(id: number): Promise<Patient> {
    const response = await apiClient.get<PatientResponse>(`/patients/${id}`);
    return response.patient;
  }

  /** Aniversários dos pacientes nos próximos N dias (pacientes ativos com data de nascimento) */
  async getUpcomingBirthdays(days: number = 60): Promise<UpcomingBirthdaysResponse> {
    const response = await apiClient.get<UpcomingBirthdaysResponse>(
      "/patients/birthdays/upcoming",
      { params: { days } }
    );
    return response;
  }

  async create(data: CreatePatientData): Promise<Patient> {
    const response = await apiClient.post<PatientResponse>("/patients", data);
    return response.patient;
  }

  async update(id: number, data: UpdatePatientData): Promise<Patient> {
    const response = await apiClient.put<PatientResponse>(
      `/patients/${id}`,
      data
    );
    return response.patient;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/patients/${id}`);
  }

  async grantPortalAccess(id: number): Promise<GrantAccessResponse> {
    const response = await apiClient.post<GrantAccessResponse>(
      `/patients/${id}/grant-access`
    );
    return response;
  }

  /** Psicólogo define nova senha do portal do paciente (sem senha atual do paciente) */
  async updatePortalPassword(
    id: number,
    data: UpdatePortalPasswordPayload
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.patch<{ success: boolean; message: string }>(
      `/patients/${id}/portal-password`,
      data
    );
  }

  // Patient portal methods (for patients to access their own data)
  async getMyProfile(): Promise<Patient> {
    console.log("🔍 Buscando perfil do paciente...");
    console.log(
      "🔑 Token atual:",
      localStorage.getItem("auth_token") ? "Presente" : "Ausente"
    );
    console.log("👤 Usuário atual:", localStorage.getItem("auth_user"));
    try {
      const response = await apiClient.get<PatientResponse>("/patient/profile");
      console.log("✅ Perfil carregado com sucesso:", response);
      return response.patient;
    } catch (error: any) {
      console.error("❌ Erro ao carregar perfil:", error);
      console.error("📊 Detalhes do erro:", {
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        message: error?.message,
      });
      throw error;
    }
  }

  async updateMyProfile(data: UpdatePatientData): Promise<Patient> {
    console.log("💾 Atualizando perfil do paciente...", data);
    try {
      const response = await apiClient.put<PatientResponse>(
        "/patient/profile",
        data
      );
      console.log("✅ Perfil atualizado com sucesso:", response);
      return response.patient;
    } catch (error) {
      console.error("❌ Erro ao atualizar perfil:", error);
      throw error;
    }
  }
}

export default new PatientService();
