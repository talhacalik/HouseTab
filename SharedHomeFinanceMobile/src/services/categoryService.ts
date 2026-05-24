import apiClient from './apiClient';

export interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getCategories(homeId: number): Promise<Category[]> {
  const res = await apiClient.get<ApiResponse<Category[]>>(
    `/homes/${homeId}/categories`,
  );
  return res.data.data;
}
