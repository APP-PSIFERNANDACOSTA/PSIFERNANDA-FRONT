export type ExpenseStatus = 'pago';

export interface Expense {
  id: number;
  psychologist_id: number;
  title: string;
  description: string;
  amount: string;
  payment_date: string | null;
  status: ExpenseStatus;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateExpenseData {
  title: string;
  description: string;
  amount: number;
  payment_date?: string | null;
  payment_method?: string | null;
}

export interface UpdateExpenseData extends Partial<CreateExpenseData> {}

export interface UpdateExpenseStatusData {
  status: 'pago';
  payment_date?: string | null;
  payment_method?: string | null;
}

export interface ExpensesResponse {
  success: boolean;
  expenses: Expense[];
  message?: string;
}

export interface ExpenseResponse {
  success: boolean;
  expense: Expense;
  message?: string;
}

export interface FinancialSummaryResponse {
  success: boolean;
  summary: {
    period: {
      start_date: string | null;
      end_date: string | null;
      generated_at: string;
    };
    cash: {
      total_received: string;
      total_paid_expenses: string;
      net_profit: string;
    };
    forecast: {
      pending_expenses: string;
    };
  };
}

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
  pago: 'Pago',
};
