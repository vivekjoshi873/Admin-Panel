import { api } from '@/shared/api/client';

export type AnalyticsParams = {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
};

export async function getAnalyticsSnapshot(params?: AnalyticsParams): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics', { params });
  return data?.data ?? data;
}
