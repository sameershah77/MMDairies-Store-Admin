import { Plus, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAuth } from '@/context/AuthContext';

export function LiveOrdersPage() {
  return (
    <PermissionPage
      title="Live Orders"
      subtitle="Placed orders waiting for accept"
      permissionId={PERMISSION.ViewLiveOrders}
    >
      <LiveOrdersBoard />
    </PermissionPage>
  );
}

function LiveOrdersBoard() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(PERMISSION.CreateWalkInOrder);
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
    board: 'live',
    statuses: BOARD_STATUSES.live,
    search,
  });

  return (
    <div>
      <PageHeader
        title="Live Orders"
        subtitle="Placed orders waiting for accept"
        actions={
          <>
            {canCreate && (
              <Button
                icon={<Plus className="size-4" />}
                onClick={() => navigate('/orders/create')}
              >
                Create Order
              </Button>
            )}
            <Button
              variant="outline"
              icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={() => void refresh()}
              disabled={loading}
            >
              Refresh
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order no. or customer name"
          containerClassName="w-full max-w-sm"
        />
        <span className="live-dot size-2.5 rounded-full bg-green-500" />
        <p className="text-sm font-semibold text-ink-800">Incoming Queue</p>
        <span className="text-sm text-ink-500">
          {loading ? '…' : `${totalCount} live`}
        </span>
        <span className="text-xs text-ink-400">
          · Realtime {isConnected ? 'on' : 'off'}
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
          title="No live orders"
          description={
            search.trim()
              ? 'No orders match this search.'
              : 'Placed orders waiting for your action will appear here.'
          }
        />
      ) : (
        <>
          <OrderBoardTable orders={items} />
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
