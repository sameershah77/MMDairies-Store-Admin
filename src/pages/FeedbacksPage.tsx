import { useCallback, useEffect, useState } from 'react';
import { Loader2, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { PermissionPage } from '@/components/permissions/PermissionPage';
import { useToast } from '@/context/ToastContext';
import { getAllFeedbacks } from '@/api/feedback';
import { ApiError } from '@/lib/apiClient';
import { formatDateTime } from '@/lib/format';
import { PERMISSION } from '@/lib/permissions';
import type { FeedbackListItemDto } from '@/types/api';

const PAGE_SIZE = 10;

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-4 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-ink-200'
          }`}
        />
      ))}
      <span className="ml-1.5 text-sm font-semibold text-ink-700">{rating}/5</span>
    </div>
  );
}

export function FeedbacksPage() {
  return (
    <PermissionPage
      title="Feedbacks"
      subtitle="Customer ratings and comments for your store"
      permissionId={PERMISSION.ViewFeedbacks}
    >
      <FeedbacksBoard />
    </PermissionPage>
  );
}

function FeedbacksBoard() {
  const { toast } = useToast();
  const [items, setItems] = useState<FeedbackListItemDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllFeedbacks(page, PAGE_SIZE);
      setItems(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to load feedback', 'error');
      setItems([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Feedbacks"
        subtitle="Customer ratings and comments for your store"
      />

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-ink-500">
          <Loader2 className="size-5 animate-spin" />
          Loading feedback...
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No feedback yet" description="Customer ratings will appear here." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.feedback_id}
                className="flex flex-col rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm"
              >
                <Stars rating={item.rating} />
                <p className="mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                  {item.body || '—'}
                </p>
                <div className="mt-4 space-y-1.5 border-t border-ink-100 pt-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-ink-400">Customer</span>
                    <span className="font-semibold text-ink-800">{item.customer_name || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-ink-400">Phone</span>
                    <span className="text-ink-700">{item.customer_phone || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-ink-400">Order</span>
                    <span className="text-ink-700">{item.order_number || '—'}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-ink-400">Date</span>
                    <span className="text-ink-600">{formatDateTime(item.created_at)}</span>
                  </div>
                </div>
              </article>
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
