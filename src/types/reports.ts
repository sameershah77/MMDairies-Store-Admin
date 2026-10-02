/** Matches GET /api/v1/Reports/performance */

export interface ReportScopeDto {
  mode: string;
  store_id: string | null;
  store_name: string | null;
}

export interface ReportNamedAmountDto {
  label: string;
  value: number;
}

export interface ReportTopProductDto {
  product_id: string | null;
  product_name: string;
  category_name: string | null;
  units: number;
  revenue: number;
}

export interface ReportHourlyDto {
  hour: number;
  label: string;
  orders: number;
}

export interface ReportRfmSegmentDto {
  segment: string;
  count: number;
}

export interface ReportFavoriteProductDto {
  product_id: string;
  product_name: string;
  category_name: string | null;
  favorites_count: number;
}

export interface ReportStoreBreakdownDto {
  store_id: string;
  store_name: string;
  revenue: number;
  orders: number;
  aov: number;
  cancel_rate_percent: number;
  pending_orders: number;
  avg_feedback_rating: number | null;
  feedback_count: number;
}

export interface ReportPerformanceDto {
  scope: ReportScopeDto;
  from: string;
  to: string;
  revenue: number;
  orders: number;
  aov: number;
  products_sold: number;
  cancel_rate_percent: number;
  cancelled_orders: number;
  pending_orders: number;
  morning_rush_orders: number;
  evening_rush_orders: number;
  avg_feedback_rating: number | null;
  feedback_count: number;
  assigned_customers: number;
  active_buyers: number;
  never_ordered: number;
  at_risk: number;
  category_revenue: ReportNamedAmountDto[];
  top_products: ReportTopProductDto[];
  hourly_orders: ReportHourlyDto[];
  rfm_segments: ReportRfmSegmentDto[];
  most_favorited: ReportFavoriteProductDto[];
  stores?: ReportStoreBreakdownDto[] | null;
}

export interface ReportPerformanceQuery {
  from: string;
  to: string;
  storeId?: string;
}
