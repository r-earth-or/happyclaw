import { api } from './client';

interface FeishuAuthorizeResponse {
  authorizeUrl: string;
}

export async function getFeishuAuthUrl(): Promise<string> {
  const data = await api.get<FeishuAuthorizeResponse>('/api/auth/feishu/authorize');
  return data.authorizeUrl;
}
