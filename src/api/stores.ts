import { apiRequest } from '@/lib/apiClient';
import type { StoreListItemDto } from '@/types/api';

export function getAllStores() {
  return apiRequest<StoreListItemDto[]>('/api/v1/Store/GetAllStores');
}
