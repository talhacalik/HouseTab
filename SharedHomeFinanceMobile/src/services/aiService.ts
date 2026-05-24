import apiClient from './apiClient';

export interface MonthlyReportResponse {
  homeId: number;
  year: number;
  month: number;
  language: string;
  report: string;
}

export interface CategorySuggestionResponse {
  suggestedCategory: string;
  reasoning: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function generateMonthlyReport(
  homeId: number,
  language: string,
  year?: number,
  month?: number,
): Promise<MonthlyReportResponse> {
  const res = await apiClient.post<ApiResponse<MonthlyReportResponse>>(
    '/ai/monthly-report',
    { homeId, language, year, month },
  );
  return res.data.data;
}

export async function getMonthlyReports(homeId: number): Promise<MonthlyReportResponse[]> {
  const res = await apiClient.get<ApiResponse<MonthlyReportResponse[]>>(
    `/ai/monthly-reports/${homeId}`,
  );
  return res.data.data;
}

export async function suggestCategory(title: string): Promise<CategorySuggestionResponse> {
  const res = await apiClient.post<ApiResponse<CategorySuggestionResponse>>(
    '/ai/suggest-category',
    { title },
  );
  return res.data.data;
}
