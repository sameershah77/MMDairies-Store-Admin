import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { OrderBoardTable } from '@/components/orders/OrderBoardTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { usePagedStoreOrders } from '@/hooks/usePagedStoreOrders';
import { BOARD_STATUSES, todayIsoDate, yesterdayIsoDate } from '@/lib/orderStatus';

type Filter = 'today' | 'yesterday' | 'custom';

export function CancelledOrdersPage() {
  const [filter, setFilter] = useState<Filter>('today');
  const [from, setFrom] = useState(todayIsoDate());
  const [to, setTo] = useState(todayIsoDate());
  const [search, setSearch] = useState('');

  const range = useMemo(() => {
    if (filter === 'today') {
      const d = todayIsoDate();
      return { from: d, to: d };
    }
    if (filter === 'yesterday') {
      const d = yesterdayIsoDate();
      return { from: d, to: d };
    }
    return { from, to };
  }, [filter, from, to]);

  const { items, page, setPage, totalCount, totalPages, loading, error, refresh, isConnected } =
    usePagedStoreOrders({
      board: 'cancelled',
      statuses: BOARD_STATUSES.cancelled,
      from: range.from,
      to: range.to,
      search,
    });

  const setFilterAndReset = (f: Filter) => {
    setFilter(f);
    setPage(1);
    if (f === 'today') {
      const d = todayIsoDate();
      setFrom(d);
      setTo(d);
    } else if (f === 'yesterday') {
      const d = yesterdayIsoDate();
      setFrom(d);
      setTo(d);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cancelled Orders"
        subtitle="Orders cancelled by admin or customer"
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-end gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order no. or customer name"
          containerClassName="w-full max-w-sm"
        />
        <div className="flex rounded-xl border border-ink-200 bg-surface p-1">
          {(
            [
              ['today', 'Today'],
              ['yesterday', 'Yesterday'],
              ['custom', 'Custom Range'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterAndReset(key)}
              className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition ${
                filter === key
                  ? 'bg-danger text-white shadow-sm'
                  : 'text-ink-600 hover:bg-ink-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {filter === 'custom' && (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-danger [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-danger [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </>
        )}

        <div className="ml-auto text-right">
          <p className="text-[10px] font-semibold tracking-wide text-danger uppercase">
            Cancelled orders · {totalCount} orders · RT {isConnected ? 'on' : 'off'}
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <EmptyState
          title="Could not load cancelled orders"
          description={error}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No cancelled orders"
          description={
            search.trim()
              ? 'No orders match this search.'
              : 'Cancelled orders for the selected date range will appear here.'
          }
        />
      ) : (
        <>
          <OrderBoardTable orders={items} showAccepted showEta cancelledStyle />
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={setPage}
            totalItems={totalCount}
          />
        </>
      )}
    </div>
  );
}
