import { apiRequest } from '@/lib/apiClient';
import type { StoreTodayDashboardDto } from '@/types/dashboard';

export function getStoreTodayDashboard() {
  return apiRequest<StoreTodayDashboardDto>('/api/v1/Dashboard/store-today');
}
