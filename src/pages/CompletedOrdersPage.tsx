import { useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { OrderBoardTable } from '@/components/orders/OrderBoardTable';
import { SearchInput } from '@/components/ui/SearchInput';
import { usePagedStoreOrders } from '@/hooks/usePagedStoreOrders';
import { BOARD_STATUSES, todayIsoDate, yesterdayIsoDate } from '@/lib/orderStatus';
import { PERMISSION } from '@/lib/permissions';
import { formatCurrency } from '@/lib/format';

type Filter = 'today' | 'yesterday' | 'custom';

export function CompletedOrdersPage() {
  return (
    <PermissionPage
      title="Completed Orders"
      subtitle="Successfully delivered orders"
      permissionId={PERMISSION.ViewCompletedOrders}
    >
      <CompletedOrdersBoard />
    </PermissionPage>
  );
}

function CompletedOrdersBoard() {
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

  const {
    items,
    page,
    setPage,
    totalCount,
    totalPages,
    loading,
    error,
    refresh,
    isConnected,
  } = usePagedStoreOrders({
    board: 'completed',
    statuses: BOARD_STATUSES.completed,
    from: range.from,
    to: range.to,
    search,
  });

  const revenue = items.reduce((s, o) => s + o.grand_total, 0);

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
        title="Completed Orders"
        subtitle="Successfully delivered orders"
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
                  ? 'bg-brand-500 text-white shadow-sm'
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
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-400 [color-scheme:light] dark:[color-scheme:dark]"
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
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
          </>
        )}

        <div className="ml-auto text-right">
          <p className="text-[10px] font-semibold tracking-wide text-brand-500 uppercase">
            Page revenue · {totalCount} orders · RT {isConnected ? 'on' : 'off'}
          </p>
          <p className="font-display text-lg font-bold text-brand-700">
            {formatCurrency(revenue)}
          </p>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <EmptyState
          title="Could not load orders"
          description={error}
          actionLabel="Try again"
          onAction={() => void refresh()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No completed orders"
          description={
            search.trim()
              ? 'No orders match this search.'
              : 'Try another date filter to view past deliveries.'
          }
        />
      ) : (
        <>
          <OrderBoardTable orders={items} showAccepted showEta />
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
