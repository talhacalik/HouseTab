import apiClient from './apiClient';

export interface Debt {
  id: number;
  amount: number;
  status: 'PENDING' | 'MARKED_AS_PAID' | 'PAID' | 'CONFIRMED' | 'REJECTED';
  borrowerName: string;
  creditorName: string;
  borrowerAvatarEmoji?: string;
  borrowerAvatarColor?: string;
  creditorAvatarEmoji?: string;
  creditorAvatarColor?: string;
  borrowerId: number;
  creditorId: number;
  expenseTitle: string;
  expenseDate?: string;
  expenseId?: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getMyDebts(homeId: number): Promise<Debt[]> {
  const res = await apiClient.get<ApiResponse<Debt[]>>(`/homes/${homeId}/debts/my`);
  return res.data.data;
}

export async function getMyCredits(homeId: number): Promise<Debt[]> {
  const res = await apiClient.get<ApiResponse<Debt[]>>(`/homes/${homeId}/debts/credits`);
  return res.data.data;
}

export async function getExpenseDebts(homeId: number, expenseId: number): Promise<Debt[]> {
  const res = await apiClient.get<ApiResponse<Debt[]>>(
    `/homes/${homeId}/expenses/${expenseId}/debts`,
  );
  return res.data.data;
}

export async function getDebtById(homeId: number, debtId: number): Promise<Debt> {
  const res = await apiClient.get<ApiResponse<Debt>>(`/homes/${homeId}/debts/${debtId}`);
  return res.data.data;
}

export async function markAsPaid(homeId: number, debtId: number): Promise<void> {
  await apiClient.post(`/homes/${homeId}/debts/${debtId}/mark-as-paid`);
}

export async function confirmPayment(homeId: number, debtId: number): Promise<void> {
  await apiClient.post(`/homes/${homeId}/debts/${debtId}/confirm`);
}

export async function rejectPayment(homeId: number, debtId: number): Promise<void> {
  await apiClient.post(`/homes/${homeId}/debts/${debtId}/reject`);
}
