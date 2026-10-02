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

export function OutForDeliveryPage() {
  return (
    <PermissionPage
      title="Out for Delivery"
      subtitle="Orders currently out for delivery"
      permissionId={PERMISSION.ViewOutForDelivery}
    >
      <OutForDeliveryBoard />
    </PermissionPage>
  );
}

function OutForDeliveryBoard() {
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
    board: 'outForDelivery',
    statuses: BOARD_STATUSES.outForDelivery,
    search,
  });

  return (
    <div>
      <PageHeader
        title="Out for Delivery"
        subtitle="Orders currently out for delivery"
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
          <span className="font-semibold text-ink-800">
            {loading ? '…' : totalCount} out for delivery
          </span>
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
          title="No orders out for delivery"
          description={
            search.trim()
              ? 'No orders match this search.'
              : 'Orders marked out for delivery will appear here.'
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
