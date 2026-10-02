import { OrderStatus, type OrderStatusCode } from '@/types/api';

export { OrderStatus };

export const DEFAULT_PAGE_SIZE = 20;

/** Statuses query string per board */
export const BOARD_STATUSES = {
  live: String(OrderStatus.Placed),
  running: `${OrderStatus.Accepted},${OrderStatus.Preparing}`,
  outForDelivery: String(OrderStatus.OutForDelivery),
  completed: String(OrderStatus.Delivered),
  cancelled: String(OrderStatus.Cancelled),
} as const;

export type BoardKey = keyof typeof BOARD_STATUSES;

export function statusMatchesBoard(status: number, board: BoardKey): boolean {
  switch (board) {
    case 'live':
      return status === OrderStatus.Placed;
    case 'running':
      return status === OrderStatus.Accepted || status === OrderStatus.Preparing;
    case 'outForDelivery':
      return status === OrderStatus.OutForDelivery;
    case 'completed':
      return status === OrderStatus.Delivered;
    case 'cancelled':
      return status === OrderStatus.Cancelled;
    default:
      return false;
  }
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function yesterdayIsoDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export const ETA_MINUTE_OPTIONS: { value: string; label: string; minutes: number }[] = [
  { value: '10', label: 'Reach in 10 Minutes', minutes: 10 },
  { value: '15', label: 'Reach in 15 Minutes', minutes: 15 },
  { value: '20', label: 'Reach in 20 Minutes', minutes: 20 },
  { value: '30', label: 'Reach in 30 Minutes', minutes: 30 },
];

export function isOrderStatus(n: number): n is OrderStatusCode {
  return Object.values(OrderStatus).includes(n as OrderStatusCode);
}
