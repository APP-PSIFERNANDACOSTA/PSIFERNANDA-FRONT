export type PaymentMethod = 'pix' | 'credit_card' | 'boleto';

export interface Payment {
  id: number;
  patient_id: number;
  psychologist_id: number;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  receipt_number: string;
  description: string | null;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  patient?: {
    id: number;
    name: string;
    email: string;
  };
  psychologist?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface CreatePaymentData {
  patient_id: number;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  description?: string | null;
}

export interface UpdatePaymentData {
  amount?: number;
  payment_date?: string;
  payment_method?: PaymentMethod;
  description?: string | null;
}

export interface PaymentsResponse {
  success: boolean;
  payments: Payment[];
  message?: string;
}

export interface PaymentResponse {
  success: boolean;
  payment: Payment;
  message?: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  credit_card: 'Cartão de Crédito',
  boleto: 'Boleto',
};

export const PAYMENT_METHOD_COLORS: Record<PaymentMethod, string> = {
  pix: 'bg-green-50 text-green-700 border-green-200',
  credit_card: 'bg-blue-50 text-blue-700 border-blue-200',
  boleto: 'bg-purple-50 text-purple-700 border-purple-200',
};

