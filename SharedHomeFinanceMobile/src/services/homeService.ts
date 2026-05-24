import apiClient from './apiClient';

export interface Home {
  id: number;
  name: string;
  memberCount: number;
  role: 'OWNER' | 'MEMBER';
  inviteCode: string;
}

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export async function getMyHomes(): Promise<Home[]> {
  const res = await apiClient.get<ApiResponse<Home[]>>('/homes/my');
  return res.data.data;
}

export async function createHome(
  name: string,
  defaultSplitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM',
  allowMemberExpenseEdit: boolean,
): Promise<Home> {
  const res = await apiClient.post<ApiResponse<Home>>('/homes', {
    name,
    defaultSplitType,
    allowMemberExpenseEdit,
  });
  return res.data.data;
}

export async function joinHome(inviteCode: string): Promise<Home> {
  const res = await apiClient.post<ApiResponse<Home>>('/invitations/join', { inviteCode });
  return res.data.data;
}

export interface HomeDetail extends Home {
  defaultSplitType: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';
  allowMemberExpenseEdit: boolean;
  description?: string;
  createdAt?: string;
  totalExpense?: number;
}

export interface Member {
  id: number;
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  avatarEmoji?: string;
  avatarColor?: string;
}

export async function getHome(homeId: number): Promise<HomeDetail> {
  const res = await apiClient.get<ApiResponse<HomeDetail>>(`/homes/${homeId}`);
  return res.data.data;
}

export async function leaveHome(homeId: number): Promise<void> {
  await apiClient.delete(`/homes/${homeId}/leave`);
}

export async function removeMember(homeId: number, userId: number): Promise<void> {
  await apiClient.delete(`/homes/${homeId}/members/${userId}`);
}

export async function inviteMember(homeId: number, email: string): Promise<void> {
  await apiClient.post(`/homes/${homeId}/invitations`, { email });
}

export async function getMembers(homeId: number): Promise<Member[]> {
  const res = await apiClient.get<ApiResponse<Member[]>>(`/homes/${homeId}/members`);
  return res.data.data;
}

export interface UpdateHomeRequest {
  name: string;
  description?: string;
  defaultSplitType?: 'EQUAL' | 'PERCENTAGE' | 'CUSTOM';
  allowMemberExpenseEdit?: boolean;
}

export async function updateHome(homeId: number, data: UpdateHomeRequest): Promise<HomeDetail> {
  const res = await apiClient.put<ApiResponse<HomeDetail>>(`/homes/${homeId}`, data);
  return res.data.data;
}

export interface InvitationResponse {
  id: number;
  inviteCode: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export async function generateInviteCode(homeId: number): Promise<InvitationResponse> {
  const response = await apiClient.post<{ data: InvitationResponse }>(
    `/homes/${homeId}/invitations/generate-code`
  );
  return response.data.data;
}

export async function getActiveInvitation(homeId: number): Promise<InvitationResponse> {
  const response = await apiClient.get<{ data: InvitationResponse }>(
    `/homes/${homeId}/invitations/active-code`
  );
  return response.data.data;
}
