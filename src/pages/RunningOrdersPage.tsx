import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { OrderBoardTable } from '@/components/orders/OrderBoardTable';
import { usePagedStoreOrders } from '@/hooks/usePagedStoreOrders';
import { BOARD_STATUSES } from '@/lib/orderStatus';
import { PERMISSION } from '@/lib/permissions';

export function RunningOrdersPage() {
  return (
    <PermissionPage
      title="Running Orders"
      subtitle="Accepted and preparing orders"
      permissionId={PERMISSION.ViewRunningOrders}
    >
      <RunningOrdersBoard />
    </PermissionPage>
  );
}

function RunningOrdersBoard() {
  const [search, setSearch] = useState('');
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
    board: 'running',
    statuses: BOARD_STATUSES.running,
    search,
  });

  return (
    <div>
      <PageHeader
        title="Running Orders"
        subtitle="Accepted and preparing orders"
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order no. or customer name"
          containerClassName="w-full max-w-sm"
        />
        <span className="text-sm text-ink-500">
          <span className="font-semibold text-ink-800">{loading ? '…' : totalCount} running</span>
          <span className="text-xs text-ink-400">
            {' '}
            · Realtime {isConnected ? 'on' : 'off'}
          </span>
        </span>
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
          title="No running orders"
          description={
            search.trim()
              ? 'No orders match this search.'
              : 'Accepted orders being prepared will appear here.'
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
