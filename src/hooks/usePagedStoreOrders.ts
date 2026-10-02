import { useCallback, useEffect, useState } from 'react';
import { getAllOrdersByStoreId } from '@/api/orders';
import { useAuth } from '@/context/AuthContext';
import { useOrderRealtime } from '@/context/OrderRealtimeContext';
import { ApiError } from '@/lib/apiClient';
import {
  DEFAULT_PAGE_SIZE,
  statusMatchesBoard,
  type BoardKey,
} from '@/lib/orderStatus';
import type { OrderChangedEventDto, OrderListItemDto } from '@/types/api';

function orderMatchesSearch(order: OrderListItemDto | null | undefined, search: string) {
  const q = search.trim().toLowerCase().replace(/^#/, '');
  if (!q) return true;
  if (!order) return false;
  return (
    (order.order_number || '').toLowerCase().includes(q) ||
    (order.receiver_name || '').toLowerCase().includes(q)
  );
}

interface UsePagedStoreOrdersOptions {
  board: BoardKey;
  statuses: string;
  from?: string;
  to?: string;
  pageSize?: number;
  enabled?: boolean;
  search?: string;
}

export function usePagedStoreOrders({
  board,
  statuses,
  from,
  to,
  pageSize = DEFAULT_PAGE_SIZE,
  enabled = true,
  search = '',
}: UsePagedStoreOrdersOptions) {
  const { profile } = useAuth();
  const { subscribe, isConnected } = useOrderRealtime();

  const [debouncedSearch, setDebouncedSearch] = useState(search.trim());
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const [items, setItems] = useState<OrderListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');

  const load = useCallback(
    async (pageToLoad = page, soft = false) => {
      if (!enabled) {
        setItems([]);
        setTotalCount(0);
        setError('');
        setLoading(false);
        return;
      }
      if (!soft) setLoading(true);
      setError('');
      try {
        const data = await getAllOrdersByStoreId({
          storeId: profile.storeId || null,
          statuses,
          from,
          to,
          page: pageToLoad,
          pageSize,
          search: debouncedSearch || undefined,
        });
        setItems(data.items ?? []);
        setTotalCount(data.totalCount ?? 0);
        setPage(data.page ?? pageToLoad);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load orders';
        setError(message);
        if (!soft) {
          setItems([]);
          setTotalCount(0);
        }
      } finally {
        if (!soft) setLoading(false);
      }
    },
    [enabled, profile.storeId, statuses, from, to, page, pageSize, debouncedSearch],
  );

  useEffect(() => {
    setPage(1);
  }, [statuses, from, to, profile.storeId, pageSize, debouncedSearch]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setTotalCount(0);
      setError('');
      setLoading(false);
      return;
    }
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when filters/page change
  }, [enabled, page, statuses, from, to, profile.storeId, pageSize, debouncedSearch]);

  // Soft refetch current page after reconnect
  useEffect(() => {
    if (enabled && isConnected) void load(page, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isConnected]);

  useEffect(() => {
    if (!enabled) return undefined;
    return subscribe((evt: OrderChangedEventDto) => {
      const order = evt.order;
      const matches =
        statusMatchesBoard(evt.new_status, board) && orderMatchesSearch(order, debouncedSearch);
      const wasOnBoard =
        evt.old_status != null ? statusMatchesBoard(evt.old_status, board) : false;

      if (wasOnBoard && !matches) {
        setItems((prev) => prev.filter((o) => o.order_id !== evt.order_id));
        setTotalCount((c) => Math.max(0, c - 1));
        return;
      }

      if (matches && order) {
        if (!wasOnBoard) setTotalCount((c) => c + 1);

        setItems((prev) => {
          const without = prev.filter((o) => o.order_id !== order.order_id);
          if (page === 1) {
            return [order, ...without].slice(0, pageSize);
          }
          const exists = prev.some((o) => o.order_id === order.order_id);
          if (exists) {
            return prev.map((o) => (o.order_id === order.order_id ? order : o));
          }
          return prev;
        });
      }
    });
  }, [enabled, subscribe, board, page, pageSize, debouncedSearch]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items,
    page,
    setPage,
    pageSize,
    totalCount,
    totalPages,
    loading,
    error,
    refresh: () => load(page),
    isConnected,
  };
}
