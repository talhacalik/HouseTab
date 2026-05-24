import apiClient from './apiClient';

export interface MonthlyAnalytics {
  totalAmount: number;
  myShare: number;
  expenseCount: number;
}

export interface PersonalAnalytics {
  totalDebt: number;
  totalCredit: number;
}

export interface DebtSummaryItem {
  borrowerId: number;
  borrowerName: string;
  creditorId: number;
  creditorName: string;
  totalAmount: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getMonthlyAnalytics(homeId: number): Promise<MonthlyAnalytics> {
  const res = await apiClient.get<ApiResponse<MonthlyAnalytics>>(
    `/homes/${homeId}/analytics/monthly`,
  );
  return res.data.data;
}

export async function getPersonalAnalytics(homeId: number): Promise<PersonalAnalytics> {
  const res = await apiClient.get<ApiResponse<PersonalAnalytics>>(
    `/homes/${homeId}/analytics/personal`,
  );
  return res.data.data;
}

export async function getDebtSummary(homeId: number): Promise<DebtSummaryItem[]> {
  const res = await apiClient.get<ApiResponse<DebtSummaryItem[]>>(
    `/homes/${homeId}/debts/summary`,
  );
  return res.data.data;
}

export interface CategoryAnalytics {
  categoryId: number;
  categoryName: string;
  totalAmount: number;
  percentage: number;
}

export async function getCategoryAnalytics(homeId: number): Promise<CategoryAnalytics[]> {
  const res = await apiClient.get<ApiResponse<CategoryAnalytics[]>>(
    `/homes/${homeId}/analytics/categories`,
  );
  return res.data.data;
}
