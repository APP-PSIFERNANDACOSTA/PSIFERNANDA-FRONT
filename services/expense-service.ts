import apiClient from '@/lib/api-client';
import type {
  CreateExpenseData,
  Expense,
  ExpenseResponse,
  ExpensesResponse,
  FinancialSummaryResponse,
  UpdateExpenseData,
  UpdateExpenseStatusData,
} from '@/types/expense';

class ExpenseService {
  async getAll(params?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    search?: string;
  }): Promise<Expense[]> {
    const response = await apiClient.get<ExpensesResponse>('/expenses', { params });
    return response.expenses;
  }

  async create(data: CreateExpenseData): Promise<Expense> {
    const response = await apiClient.post<ExpenseResponse>('/expenses', data);
    return response.expense;
  }

  async update(id: number, data: UpdateExpenseData): Promise<Expense> {
    const response = await apiClient.put<ExpenseResponse>(`/expenses/${id}`, data);
    return response.expense;
  }

  async updateStatus(id: number, data: UpdateExpenseStatusData): Promise<Expense> {
    const response = await apiClient.patch<ExpenseResponse>(`/expenses/${id}/status`, data);
    return response.expense;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/expenses/${id}`);
  }

  async getFinancialSummary(params?: { start_date?: string; end_date?: string }) {
    const response = await apiClient.get<FinancialSummaryResponse>('/financial/summary', { params });
    return response.summary;
  }
}

const expenseService = new ExpenseService();
export default expenseService;
