import { api } from '@/shared/api/client';

export async function getAnalyticsOverview(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics', { params });
  return data?.data ?? data;
}

export async function getAnalyticsOrders(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/orders', { params });
  return data?.data ?? data;
}

export async function getAnalyticsRevenue(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/revenue', { params });
  return data?.data ?? data;
}

export async function getAnalyticsInventory(): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/inventory');
  return data?.data ?? data;
}

export async function getAnalyticsProducts(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/products', { params });
  return data?.data ?? data;
}

export async function getAnalyticsCustomers(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any> {
  const { data } = await api.get('/api/v1/admin/analytics/customers', { params });
  return data?.data ?? data;
}

export async function getAnalyticsTimeseries(params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}): Promise<any[]> {
  const { data } = await api.get('/api/v1/admin/analytics/timeseries', { params });
  const body = data?.data ?? data;
  return Array.isArray(body) ? body : body?.data ?? [];
}
