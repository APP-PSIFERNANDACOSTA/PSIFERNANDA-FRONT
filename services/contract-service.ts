import apiClient from "@/lib/api-client";
import type {
  Contract,
  CreateContractData,
  SignContractData,
  ContractResponse,
  ContractsResponse,
} from "@/types/contract";

class ContractService {
  /**
   * Get all contracts for the authenticated psychologist
   */
  async getAll(status?: string): Promise<ContractsResponse> {
    const params = status && status !== "all" ? { status } : {};
    const response = await apiClient.get<ContractsResponse>("/contracts", {
      params,
    });
    return response;
  }

  /**
   * Get a specific contract by ID
   */
  async getById(id: number): Promise<ContractResponse> {
    const response = await apiClient.get<ContractResponse>(`/contracts/${id}`);
    return response;
  }

  /**
   * Get contract by token (public route)
   */
  async getByToken(token: string): Promise<ContractResponse> {
    const response = await apiClient.get<ContractResponse>(
      `/contracts/token/${token}`
    );
    return response;
  }

  /**
   * Create a new contract
   */
  async create(data: CreateContractData): Promise<ContractResponse> {
    const response = await apiClient.post<ContractResponse>("/contracts", data);
    return response;
  }

  /**
   * Sign a contract (public route)
   */
  async sign(token: string, data: SignContractData): Promise<ContractResponse> {
    const response = await apiClient.post<ContractResponse>(
      `/contracts/token/${token}/sign`,
      data
    );
    return response;
  }

  /**
   * Resend contract link
   */
  async resend(id: number): Promise<void> {
    await apiClient.post(`/contracts/${id}/resend`);
  }

  /**
   * Inactivate contract
   */
  async inactivate(id: number): Promise<void> {
    await apiClient.post(`/contracts/${id}/inactivate`);
  }

  /**
   * Delete contract
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/contracts/${id}`);
  }

  /**
   * Get contracts for a specific patient
   */
  async getPatientContracts(patientId: number): Promise<ContractsResponse> {
    const response = await apiClient.get<ContractsResponse>(
      `/patients/${patientId}/contracts`
    );
    return response;
  }

  /**
   * Get contracts for the authenticated patient
   */
  async getMyContracts(): Promise<ContractsResponse> {
    const response = await apiClient.get<ContractsResponse>(
      "/patient/contracts/my"
    );
    return response;
  }

  /**
   * Download PDF for a contract (for psychologists)
   */
  async downloadPdf(id: number): Promise<void> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/contracts/${id}/pdf`, {
          responseType: "blob",
        });

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      throw error;
    }
  }

  /**
   * Download PDF for a contract (for patients)
   */
  async downloadMyContractPdf(id: number): Promise<void> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/contracts/${id}/pdf`, {
          responseType: "blob",
        });

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error("Erro ao baixar PDF:", error);
      throw error;
    }
  }

  /**
   * Upload psychologist signature
   */
  async uploadPsychologistSignature(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("signature", file);

    const response = await apiClient.post<{ url: string }>(
      "/user/signature",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  }

  /**
   * Delete psychologist signature
   */
  async deletePsychologistSignature(): Promise<void> {
    await apiClient.delete("/user/signature");
  }
}

export default new ContractService();
