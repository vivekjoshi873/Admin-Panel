export type DashboardKpi = {
  label: string;
  value: number;
  previousValue?: number | null;
  changePercent?: number | null;
  format?: 'number' | 'currency' | 'percent';
};

export type RecentOrder = {
  id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: string;
};

export type DashboardResponse = {
  kpis: DashboardKpi[];
  recentOrders: RecentOrder[];
};

export type AnalyticsPeriod = '7d' | '30d' | '90d' | 'custom';

export type TimeseriesPoint = {
  date: string;
  value: number;
  label?: string;
};

export type RankedItem = {
  id: string;
  name: string;
  value: number;
  secondaryValue?: number | null;
  meta?: string | null;
};

export type AnalyticsOverview = {
  orders: number;
  revenue: number;
  customers: number;
  products: number;
  inventoryValue?: number;
};

export type AnalyticsBundle = {
  overview: AnalyticsOverview;
  timeseries: TimeseriesPoint[];
  topProducts: RankedItem[];
  topVendors: RankedItem[];
  topCustomers: RankedItem[];
};
