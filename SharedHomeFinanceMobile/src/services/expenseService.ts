import apiClient from './apiClient';

export interface Expense {
  id: number;
  title?: string;
  description: string;
  amount: number;
  category: string;
  categoryId: number;
  categoryName?: string;
  paidByName: string;
  paidById: number;
  date?: string;
  expenseDate?: string;
  notes?: string;
  createdByUserId: number;
  status?: string;
  allDebtsConfirmed?: boolean;
}

export interface ExpenseShare {
  userId: number;
  userName: string;
  amount: number;
  paid: boolean;
}

export interface ExpenseDetail extends Expense {
  categoryName: string;
  shares?: ExpenseShare[];
  cancelNote?: string;
}

export interface ExpensePage {
  content: Expense[];
  totalPages: number;
  totalElements: number;
}

export interface CreateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  categoryId: number;
  expenseDate: string;
  paidByUserId: number;
  participantIds?: number[] | null;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getExpenses(
  homeId: number,
  page = 0,
  size = 10,
): Promise<ExpensePage> {
  const res = await apiClient.get<ApiResponse<ExpensePage>>(
    `/homes/${homeId}/expenses`,
    { params: { page, size } },
  );
  return res.data.data;
}

export async function getExpense(
  homeId: number,
  expenseId: number,
): Promise<ExpenseDetail> {
  const res = await apiClient.get<ApiResponse<ExpenseDetail>>(
    `/homes/${homeId}/expenses/${expenseId}`,
  );
  return res.data.data;
}

export async function createExpense(
  homeId: number,
  data: CreateExpenseRequest,
): Promise<Expense> {
  const res = await apiClient.post<ApiResponse<Expense>>(
    `/homes/${homeId}/expenses`,
    data,
  );
  return res.data.data;
}

export interface ExpenseVersion {
  id: number;
  previousTitle?: string;
  previousAmount?: number;
  previousDescription?: string;
  editNote: string;
  editedByName: string;
  editedAt: string;
}

export async function getExpenseHistory(
  homeId: number,
  expenseId: number,
): Promise<ExpenseVersion[]> {
  const res = await apiClient.get<ApiResponse<ExpenseVersion[]>>(
    `/homes/${homeId}/expenses/${expenseId}/history`,
  );
  return res.data.data;
}

export interface UpdateExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  expenseDate: string;
  categoryId?: number;
  editNote: string;
}

export async function updateExpense(
  homeId: number,
  expenseId: number,
  data: UpdateExpenseRequest,
): Promise<ExpenseDetail> {
  const res = await apiClient.put<ApiResponse<ExpenseDetail>>(
    `/homes/${homeId}/expenses/${expenseId}`,
    data,
  );
  return res.data.data;
}

export async function cancelExpense(
  homeId: number,
  expenseId: number,
  cancelNote: string,
): Promise<void> {
  await apiClient.post(`/homes/${homeId}/expenses/${expenseId}/cancel`, { cancelNote });
}

export async function getExpensesByCategory(
  homeId: number,
  categoryId: number,
  page = 0,
  size = 10,
): Promise<ExpensePage> {
  const res = await apiClient.get<ApiResponse<ExpensePage>>(
    `/homes/${homeId}/expenses/category/${categoryId}`,
    { params: { page, size } },
  );
  return res.data.data;
}