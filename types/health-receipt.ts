export type HealthReceiptStatus = 'pending' | 'issued';

export interface HealthReceiptSummary {
  status: HealthReceiptStatus;
  available: boolean;
}

export interface HealthReceipt {
  id: number;
  payment_id: number;
  psychologist_id: number;
  status: HealthReceiptStatus;
  payer_cpf: string | null;
  payer_is_beneficiary: boolean;
  beneficiary_cpf: string | null;
  amount: string;
  payment_date: string;
  service_date: string;
  service_date_manually_set: boolean;
  occupation: string;
  professional_registration: string | null;
  description: string | null;
  proof_path: string | null;
  issued_at: string | null;
  missing_cpf: boolean;
  health_receipt: HealthReceiptSummary;
  created_at: string;
  updated_at: string;
  payment?: {
    id: number;
    receipt_number: string;
    patient?: {
      id: number;
      name: string;
      email: string;
      cpf: string | null;
    };
  };
}

export interface UpdateHealthReceiptData {
  payer_cpf?: string | null;
  payer_is_beneficiary?: boolean;
  beneficiary_cpf?: string | null;
  service_date?: string;
  description?: string | null;
  status?: HealthReceiptStatus;
}

export interface HealthReceiptsResponse {
  success: boolean;
  receipts: HealthReceipt[];
  pending_count: number;
  message?: string;
}

export interface HealthReceiptResponse {
  success: boolean;
  receipt: HealthReceipt;
  message?: string;
}

export const HEALTH_RECEIPT_STATUS_LABELS: Record<HealthReceiptStatus, string> = {
  pending: 'Pendente',
  issued: 'Emitido',
};
