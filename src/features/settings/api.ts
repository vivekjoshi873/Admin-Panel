import { api } from '@/shared/api/client';

export async function getSettingsSidebar(): Promise<any> {
  const { data } = await api.get('/api/v1/admin/settings/sidebar');
  return data?.data ?? data;
}

export async function getSettingsCategories(): Promise<any[]> {
  const { data } = await api.get('/api/v1/admin/settings/categories');
  const body = data?.data ?? data;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data)) return body.data;
  if (Array.isArray(body?.items)) return body.items;
  return [];
}

export async function createSettingsCategory(payload: any): Promise<any> {
  const { data } = await api.post('/api/v1/admin/settings/categories', payload);
  return data?.data ?? data;
}

export async function updateSettingsCategory(categoryIdOrUuid: string, payload: any): Promise<any> {
  const { data } = await api.patch(`/api/v1/admin/settings/categories/${categoryIdOrUuid}`, payload);
  return data?.data ?? data;
}

export async function deleteSettingsCategory(categoryIdOrUuid: string): Promise<void> {
  await api.delete(`/api/v1/admin/settings/categories/${categoryIdOrUuid}`);
}

export async function getSettingsGroup(slug: string): Promise<any> {
  const { data } = await api.get(`/api/v1/admin/settings/group/${slug}`);
  return data?.data ?? data;
}

export async function updateSettingsGroup(slug: string, values: Record<string, unknown>): Promise<any> {
  const { data } = await api.put(`/api/v1/admin/settings/group/${slug}`, { values });
  return data?.data ?? data;
}
