import apiClient from '@/lib/api-client';
import type {
  HealthReceipt,
  HealthReceiptResponse,
  HealthReceiptsResponse,
  UpdateHealthReceiptData,
} from '@/types/health-receipt';

class HealthReceiptService {
  async getAll(params?: {
    status?: 'pending' | 'issued';
    patient_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{ receipts: HealthReceipt[]; pending_count: number }> {
    const response = await apiClient.get<HealthReceiptsResponse>('/health-receipts', { params });
    return {
      receipts: response.receipts,
      pending_count: response.pending_count,
    };
  }

  async getById(id: number): Promise<HealthReceipt> {
    const response = await apiClient.get<HealthReceiptResponse>(`/health-receipts/${id}`);
    return response.receipt;
  }

  async update(id: number, data: UpdateHealthReceiptData): Promise<HealthReceipt> {
    const response = await apiClient.put<HealthReceiptResponse>(`/health-receipts/${id}`, data);
    return response.receipt;
  }

  async issue(id: number, proof: File): Promise<HealthReceipt> {
    const formData = new FormData();
    formData.append('proof', proof);

    console.log('[HealthReceiptService] POST issue', {
      id,
      fileName: proof.name,
      fileSize: proof.size,
      fileType: proof.type,
      formDataEntries: Array.from(formData.entries()).map(([k, v]) =>
        v instanceof File ? [k, `File: ${v.name} (${v.size}b)`] : [k, v]
      ),
    });

    let response;
    try {
      response = await apiClient.getAxiosInstance().post<HealthReceiptResponse>(
        `/health-receipts/${id}/issue`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      console.error('[HealthReceiptService] Falha no POST issue', { status, message, validationErrors, err });
      // Monta mensagem de erro legível com detalhes de validação se houver
      if (validationErrors) {
        const details = Object.values(validationErrors).flat().join(' | ');
        throw Object.assign(new Error(details), { response: err.response });
      }
      throw err;
    }

    console.log('[HealthReceiptService] Resposta issue', response.data);
    return response.data.receipt;
  }

  async downloadProof(id: number): Promise<void> {
    const response = await apiClient.getAxiosInstance().get(`/health-receipts/${id}/proof`, {
      responseType: 'blob',
    });

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : 'pdf';

    // Tenta pegar nome do Content-Disposition (só funciona se CORS expõe o header)
    const disposition = (response.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const serverFilename = match ? match[1].replace(/['"]/g, '').trim() : null;

    const filename = serverFilename || `recibo_saude_${id}.${ext}`;

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  async downloadMyHealthReceipt(paymentId: number): Promise<void> {
    const response = await apiClient.getAxiosInstance().get(
      `/patient/payments/${paymentId}/health-receipt/download`,
      { responseType: 'blob' }
    );

    const contentType = (response.headers['content-type'] as string) || 'application/pdf';
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('jpeg') || contentType.includes('jpg')
      ? 'jpg'
      : 'pdf';

    const disposition = (response.headers['content-disposition'] as string) || '';
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    const serverFilename = match ? match[1].replace(/['"]/g, '').trim() : null;

    const filename = serverFilename || `recibo_saude_${paymentId}.${ext}`;

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}

export const healthReceiptService = new HealthReceiptService();
export default healthReceiptService;
