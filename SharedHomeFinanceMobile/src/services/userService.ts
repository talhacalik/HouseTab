import apiClient from './apiClient';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  photoUrl?: string;
  avatarEmoji?: string;
  avatarColor?: string;
  firebaseUid: string;
}

export interface UserSettings {
  language: 'TR' | 'EN';
  theme: 'LIGHT' | 'DARK';
  notificationEnabled: boolean;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get<ApiResponse<UserProfile>>('/users/me');
  return res.data.data;
}

export interface AvatarUpdateRequest {
  avatarEmoji?: string;
  avatarColor?: string;
}

export async function updateProfile(name: string, photoUrl?: string): Promise<UserProfile> {
  const res = await apiClient.put<ApiResponse<UserProfile>>('/users/me', { name, photoUrl });
  return res.data.data;
}

export async function updateAvatar(data: AvatarUpdateRequest): Promise<UserProfile> {
  const res = await apiClient.put<ApiResponse<UserProfile>>('/users/me/avatar', data);
  return res.data.data;
}

export async function getUserSettings(): Promise<UserSettings> {
  const res = await apiClient.get<ApiResponse<UserSettings>>('/users/settings');
  return res.data.data;
}

export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const res = await apiClient.put<ApiResponse<UserSettings>>('/users/settings', settings);
  return res.data.data;
}

export async function updateFcmToken(fcmToken: string): Promise<void> {
  await apiClient.put('/users/me/fcm-token', { fcmToken });
}
