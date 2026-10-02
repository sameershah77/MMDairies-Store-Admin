import { apiRequest } from '@/lib/apiClient';
import type { ReportPerformanceDto, ReportPerformanceQuery } from '@/types/reports';

export function getReportPerformance(query: ReportPerformanceQuery) {
  const params = new URLSearchParams();
  params.set('from', query.from);
  params.set('to', query.to);
  if (query.storeId?.trim()) params.set('storeId', query.storeId.trim());

  return apiRequest<ReportPerformanceDto>(
    `/api/v1/Reports/performance?${params.toString()}`,
  );
}
