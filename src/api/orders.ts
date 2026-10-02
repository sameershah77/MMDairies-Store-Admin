import { apiRequest } from '@/lib/apiClient';
import type {
  CancelOrderRequest,
  OrderDetailsDto,
  OrderListItemDto,
  PagedResultDto,
  PlaceWalkInOrderRequest,
  PlaceWalkInOrderResponse,
  StoreOrdersQuery,
  TransferOrderRequest,
  UpdateOrderStatusRequest,
} from '@/types/api';

export function getAllOrdersByStoreId(query: StoreOrdersQuery) {
  const params = new URLSearchParams();
  if (query.storeId?.trim()) params.set('storeId', query.storeId.trim());
  params.set('statuses', query.statuses);
  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  params.set('page', String(query.page ?? 1));
  params.set('pageSize', String(query.pageSize ?? 20));
  if (query.search?.trim()) params.set('search', query.search.trim());

  return apiRequest<PagedResultDto<OrderListItemDto>>(
    `/api/v1/Order/GetAllOrdersByStoreId?${params.toString()}`,
  );
}

export function getOrderByOrderId(orderId: string) {
  return apiRequest<OrderDetailsDto>(`/api/v1/Order/GetOrderByOrderId/${orderId}`);
}

export function placeWalkInOrder(body: PlaceWalkInOrderRequest) {
  return apiRequest<PlaceWalkInOrderResponse>('/api/v1/Order/PlaceWalkInOrder', {
    method: 'POST',
    body,
  });
}

export function updateOrderStatus(body: UpdateOrderStatusRequest) {
  return apiRequest<OrderDetailsDto>('/api/v1/Order/UpdateOrderStatus', {
    method: 'PUT',
    body,
  });
}

export type ThermalPrintMode = 'token' | 'bill' | 'both';

export function requestThermalPrint(body: { orderId: string; mode: ThermalPrintMode }) {
  return apiRequest<{ order_id: string; store_id: string; mode: string }>(
    '/api/v1/Order/RequestThermalPrint',
    {
      method: 'POST',
      body: {
        orderId: body.orderId,
        mode: body.mode,
      },
    },
  );
}

export function cancelOrder(body: CancelOrderRequest) {
  return apiRequest<OrderDetailsDto>('/api/v1/Order/CancelOrder', {
    method: 'POST',
    body,
  });
}

export function transferOrder(body: TransferOrderRequest) {
  return apiRequest<OrderDetailsDto>('/api/v1/Order/TransferOrder', {
    method: 'POST',
    body,
  });
}
