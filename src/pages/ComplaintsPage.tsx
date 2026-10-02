import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquareWarning, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/context/ToastContext';
import { getStoreComplaints } from '@/api/complaints';
import { ApiError } from '@/lib/apiClient';
import { COMPLAINT_PAGE_SIZE, ComplaintStatus, complaintStatusTone } from '@/lib/complaintStatus';
import { formatDateTime } from '@/lib/format';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { PERMISSION } from '@/lib/permissions';
import type { ComplaintListItemDto } from '@/types/api';

type Tab = 'all' | 'open' | 'inProgress' | 'resolved';

const TABS: { key: Tab; label: string; status: number | null }[] = [
  { key: 'all', label: 'All', status: null },
  { key: 'open', label: 'Open', status: ComplaintStatus.Open },
  { key: 'inProgress', label: 'In Progress', status: ComplaintStatus.InProgress },
  { key: 'resolved', label: 'Resolved', status: ComplaintStatus.Resolved },
];

export function ComplaintsPage() {
  return (
    <PermissionPage
      title="Complaints"
      subtitle="Customer tickets for your store"
      permissionId={PERMISSION.ChatWithCustomer}
    >
      <ComplaintsBoard />
    </PermissionPage>
  );
}

function ComplaintsBoard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('all');
  const [items, setItems] = useState<ComplaintListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const status = TABS.find((t) => t.key === tab)?.status ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [list, open] = await Promise.all([
        getStoreComplaints({
          status,
          page,
          pageSize: COMPLAINT_PAGE_SIZE,
        }),
        getStoreComplaints({
          status: ComplaintStatus.Open,
          page: 1,
          pageSize: 1,
        }),
      ]);
      setItems(list.items ?? []);
      setTotalCount(list.totalCount ?? 0);
      setOpenCount(open.totalCount ?? 0);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load complaints';
      setError(message);
      toast(message, 'error');
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [status, page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / COMPLAINT_PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Complaints"
        subtitle="Customer tickets for your store"
        actions={
          <Button
            variant="outline"
            icon={<RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => void load()}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              setTab(item.key);
              setPage(1);
            }}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              tab === item.key
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
            }`}
          >
            {item.label}
            {item.key === 'open' && openCount > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === 'open' ? 'bg-white/20 text-white' : 'bg-danger text-white'
                }`}
              >
                {openCount}
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-sm text-ink-500">
          {loading ? '…' : `${totalCount} ticket${totalCount === 1 ? '' : 's'}`}
        </span>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="Could not load complaints"
          description={error}
          actionLabel="Try again"
          onAction={() => void load()}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareWarning className="size-7" />}
          title="No complaints"
          description="Tickets matching this filter will appear here."
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((c) => (
              <button
                key={c.complaint_id}
                type="button"
                onClick={() => navigate(`/complaints/${c.complaint_id}`)}
                className="w-full rounded-2xl border border-ink-100 bg-surface p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-xs font-semibold text-brand-600">
                      {c.complaint_number}
                    </p>
                    <p className="mt-0.5 font-display text-base font-bold text-ink-900">
                      {c.order_number}
                    </p>
                  </div>
                  <Badge tone={complaintStatusTone(c.status)}>{c.status_text}</Badge>
                </div>
                <p className="mt-2 text-sm font-medium text-ink-800">
                  {c.customer_name || 'Customer'}
                  {c.customer_phone ? (
                    <span className="font-normal text-ink-500"> · {c.customer_phone}</span>
                  ) : null}
                </p>
                {c.last_message_preview && (
                  <p className="mt-1 line-clamp-2 text-sm text-ink-500">{c.last_message_preview}</p>
                )}
                <p className="mt-2 text-xs text-ink-400">{formatDateTime(c.updated_at)}</p>
              </button>
            ))}
          </div>
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
