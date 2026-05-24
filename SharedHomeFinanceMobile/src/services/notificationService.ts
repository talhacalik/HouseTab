import apiClient from './apiClient';

export interface Notification {
  id: number;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  type: string;
  referenceId?: number;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiClient.get<ApiResponse<Notification[]>>('/notifications');
  return res.data.data;
}

export async function markAsRead(id: number): Promise<void> {
  await apiClient.put(`/notifications/${id}/read`);
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.put('/notifications/read-all');
}

export async function deleteNotification(id: number): Promise<void> {
  await apiClient.delete(`/notifications/${id}`);
}
