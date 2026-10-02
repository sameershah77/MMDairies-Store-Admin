import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PermissionDenied } from '@/components/ui/PermissionDenied';
import { StorePerformanceReport } from '@/components/reports/StorePerformanceReport';
import { getReportPerformance } from '@/api/reports';
import { ApiError } from '@/lib/apiClient';
import { PERMISSION, permissionRequiredMessage } from '@/lib/permissions';
import type { ReportPerformanceDto } from '@/types/reports';
import { useAuth } from '@/context/AuthContext';

function todayIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function ReportsPage() {
  const { profile, hasPermission } = useAuth();
  const canView = hasPermission(PERMISSION.ViewReport);
  const [from, setFrom] = useState(todayIso);
  const [to, setTo] = useState(todayIso);
  const [report, setReport] = useState<ReportPerformanceDto | null>(null);
  const [loading, setLoading] = useState(canView);
  const [error, setError] = useState(canView ? '' : permissionRequiredMessage(PERMISSION.ViewReport));

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      setReport(null);
      setError(permissionRequiredMessage(PERMISSION.ViewReport));
      return;
    }

    let cancelled = false;
    const t = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getReportPerformance({
          from,
          to,
          storeId: profile.storeId || undefined,
        });
        if (!cancelled) setReport(data);
      } catch (err) {
        if (!cancelled) {
          setReport(null);
          setError(err instanceof ApiError ? err.message : 'Failed to load report');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [canView, from, to, profile.storeId]);

  const isToday = from === todayIso() && to === todayIso();

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={
          isToday
            ? "Today's store performance report"
            : 'Store performance for selected range'
        }
      />

      {!canView ? (
        <PermissionDenied message={error || permissionRequiredMessage(PERMISSION.ViewReport)} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-500">From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-500">To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-10 rounded-xl border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-400 [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                const t = todayIso();
                setFrom(t);
                setTo(t);
              }}
              className="h-10 rounded-xl border border-ink-200 px-3 text-sm font-semibold text-ink-600 hover:bg-ink-50"
            >
              Today
            </button>
          </div>

          {loading && (
            <p className="mb-4 text-sm text-ink-500">Loading report…</p>
          )}

          {error && !loading && (
            <PermissionDenied message={error} />
          )}

          {report && !loading && (
            <>
              <p className="mb-4 text-sm text-ink-500">
                Showing reports for{' '}
                <span className="font-semibold text-ink-700">{report.from}</span> to{' '}
                <span className="font-semibold text-ink-700">{report.to}</span>
                {report.scope.store_name ? (
                  <>
                    {' · '}
                    <span className="font-semibold text-ink-700">{report.scope.store_name}</span>
                  </>
                ) : null}
                {' · '}
                {report.orders} delivered
                {isToday ? ' today' : ' in this range'}
                {' · '}
                {report.pending_orders} pending
              </p>
              <StorePerformanceReport report={report} />
            </>
          )}
        </>
      )}
    </div>
  );
}
