import apiClient from '@/lib/api-client';
import type {
  Payment,
  PaymentsResponse,
  PaymentResponse,
  CreatePaymentData,
  UpdatePaymentData,
} from '@/types/payment';

class PaymentService {
  /**
   * Get all payments for the logged psychologist
   */
  async getAll(params?: {
    patient_id?: number;
    start_date?: string;
    end_date?: string;
    payment_method?: string;
  }): Promise<Payment[]> {
    const response = await apiClient.get<PaymentsResponse>(
      '/payments',
      { params }
    );
    return response.payments;
  }

  /**
   * Get a specific payment
   */
  async getById(id: number): Promise<Payment> {
    const response = await apiClient.get<PaymentResponse>(
      `/payments/${id}`
    );
    return response.payment;
  }

  /**
   * Create a new payment
   */
  async create(data: CreatePaymentData): Promise<Payment> {
    const response = await apiClient.post<PaymentResponse>(
      '/payments',
      data
    );
    return response.payment;
  }

  /**
   * Update a payment
   */
  async update(id: number, data: UpdatePaymentData): Promise<Payment> {
    const response = await apiClient.put<PaymentResponse>(
      `/payments/${id}`,
      data
    );
    return response.payment;
  }

  /**
   * Delete a payment
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(`/payments/${id}`);
  }

  /**
   * Download receipt PDF
   */
  async downloadReceipt(id: number): Promise<void> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/payments/${id}/download`, {
          responseType: 'blob',
        });

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      throw error;
    }
  }

  /**
   * Get patient's own payments (for patient portal)
   */
  async getMyPayments(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<Payment[]> {
    const response = await apiClient.get<PaymentsResponse>(
      '/patient/payments',
      { params }
    );
    return response.payments;
  }

  /**
   * Get patient's receipt
   */
  async getMyReceipt(id: number): Promise<Payment> {
    const response = await apiClient.get<PaymentResponse>(
      `/patient/payments/${id}`
    );
    return response.payment;
  }

  /**
   * Download patient's receipt PDF
   */
  async downloadMyReceipt(id: number): Promise<void> {
    try {
      const response = await apiClient
        .getAxiosInstance()
        .get(`/patient/payments/${id}/download`, {
          responseType: 'blob',
        });

      // Create blob URL and open in new tab
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `recibo_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar PDF:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
export default paymentService;

