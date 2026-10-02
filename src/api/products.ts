import { apiRequest } from '@/lib/apiClient';
import type {
  AddToInventoryRequest,
  ProductDetailsDto,
  ProductListItemDto,
  RemoveFromInventoryRequest,
  RemoveFromInventoryResultDto,
  StoreInventoryItemDto,
  UpdateInventoryQuantityRequest,
} from '@/types/api';

export function getAllProducts() {
  return apiRequest<ProductListItemDto[]>('/api/v1/Product/GetAllProducts');
}

export function getProductById(productId: string, storeId?: string | null) {
  const params = new URLSearchParams();
  if (storeId?.trim()) params.set('storeId', storeId.trim());
  const qs = params.toString();
  return apiRequest<ProductDetailsDto>(
    `/api/v1/Product/GetProductById/${productId}${qs ? `?${qs}` : ''}`,
  );
}

export function getProductInventoryByStoreId(storeId: string, isCustomer = false) {
  const params = new URLSearchParams({
    storeId,
    is_customer: String(isCustomer),
  });
  return apiRequest<ProductListItemDto[]>(
    `/api/v1/Product/GetProductInventoryByStoreId?${params.toString()}`,
  );
}

export function addToInventory(body: AddToInventoryRequest) {
  return apiRequest<StoreInventoryItemDto>('/api/v1/Product/AddToInventory', {
    method: 'POST',
    body,
  });
}

export function removeFromInventory(body: RemoveFromInventoryRequest) {
  return apiRequest<RemoveFromInventoryResultDto>('/api/v1/Product/RemoveFromInventory', {
    method: 'DELETE',
    body,
  });
}

export function updateInventoryQuantity(body: UpdateInventoryQuantityRequest) {
  return apiRequest<StoreInventoryItemDto>('/api/v1/Product/UpdateInventoryQuantity', {
    method: 'POST',
    body,
  });
}
