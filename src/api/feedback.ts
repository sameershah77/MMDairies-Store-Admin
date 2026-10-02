import { apiRequest } from '@/lib/apiClient';
import type { FeedbackListItemDto, PagedResultDto } from '@/types/api';

export function getAllFeedbacks(page = 1, pageSize = 10) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest<PagedResultDto<FeedbackListItemDto>>(
    `/api/v1/Feedback/GetAllFeedbacks?${params.toString()}`,
  );
}
