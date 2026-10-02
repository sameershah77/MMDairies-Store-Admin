/** Matches GET /api/v1/Dashboard/store-today */

export interface DashboardHourlyDto {
  hour: number;
  label: string;
  orders: number;
  cumulative_revenue: number;
}

export interface DashboardTopProductDto {
  product_id: string | null;
  product_name: string;
  units: number;
  revenue: number;
}

export interface StoreTodayDashboardDto {
  store_id: string;
  store_name: string | null;
  today: string;
  today_revenue: number;
  today_orders: number;
  live_orders: number;
  running_orders: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  cancel_rate_percent: number;
  hourly: DashboardHourlyDto[];
  top_products: DashboardTopProductDto[];
}
