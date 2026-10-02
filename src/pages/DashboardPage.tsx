import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IndianRupee,
  ShoppingBag,
  Radio,
  Truck,
  CheckCircle2,
  Clock3,
  Ban,
  Package,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader, StatCard } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { StatCardSkeleton, TableSkeleton } from '@/components/ui/Skeleton';
import { useChartTheme } from '@/hooks/useChartTheme';
import { useAuth } from '@/context/AuthContext';
import { usePagedStoreOrders } from '@/hooks/usePagedStoreOrders';
import { getAllOrdersByStoreId } from '@/api/orders';
import { getStoreTodayDashboard } from '@/api/dashboard';
import { ApiError } from '@/lib/apiClient';
import {
  formatCurrency,
  formatNumber,
  formatTime,
  orderStatusTone,
} from '@/lib/format';
import { BOARD_STATUSES, OrderStatus } from '@/lib/orderStatus';
import { PERMISSION, permissionRequiredMessage } from '@/lib/permissions';
import type { StoreTodayDashboardDto } from '@/types/dashboard';
import type { OrderListItemDto } from '@/types/api';

function itemsLabel(order: OrderListItemDto): string {
  const name = order.preview_product_name?.trim() || 'Items';
  if (order.item_count > 1) return `${name} +${order.item_count - 1}`;
  return name;
}

function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-ink-400">
      {message}
    </div>
  );
}

export function DashboardPage() {
  const chart = useChartTheme();
  const { profile, hasPermission } = useAuth();
  const canViewLive = hasPermission(PERMISSION.ViewLiveOrders);
  const canViewRunning = hasPermission(PERMISSION.ViewRunningOrders);
  const canViewOfd = hasPermission(PERMISSION.ViewOutForDelivery);
  const canViewCompleted = hasPermission(PERMISSION.ViewCompletedOrders);

  const recentStatuses = [
    canViewLive ? String(OrderStatus.Placed) : null,
    canViewRunning ? String(OrderStatus.Accepted) : null,
    canViewRunning ? String(OrderStatus.Preparing) : null,
    canViewOfd ? String(OrderStatus.OutForDelivery) : null,
    canViewCompleted ? String(OrderStatus.Delivered) : null,
  ]
    .filter((status): status is string => status != null)
    .join(',');
  const [data, setData] = useState<StoreTodayDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentItems, setRecentItems] = useState<OrderListItemDto[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentError, setRecentError] = useState('');

  const live = usePagedStoreOrders({
    board: 'live',
    statuses: BOARD_STATUSES.live,
    pageSize: 4,
    enabled: canViewLive,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const result = await getStoreTodayDashboard();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!recentStatuses) {
      setRecentItems([]);
      setRecentError('');
      setRecentLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setRecentLoading(true);
      setRecentError('');
      try {
        const result = await getAllOrdersByStoreId({
          storeId: profile.storeId || null,
          statuses: recentStatuses,
          page: 1,
          pageSize: 5,
        });
        if (!cancelled) setRecentItems(result.items ?? []);
      } catch (err) {
        if (!cancelled) {
          setRecentItems([]);
          setRecentError(
            err instanceof ApiError ? err.message : 'Failed to load recent orders',
          );
        }
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [profile.storeId, recentStatuses]);

  const revenueChart =
    data?.hourly.map((h) => ({ label: h.label, value: h.cumulative_revenue })) ?? [];
  const ordersChart =
    data?.hourly.map((h) => ({ label: h.label, value: h.orders })) ?? [];
  const topProductsChart =
    data?.top_products.map((p) => ({
      label: p.product_name,
      value: p.units,
    })) ?? [];

  const hasRevenueActivity = revenueChart.some((h) => h.value > 0);
  const hasOrderActivity = ordersChart.some((h) => h.value > 0);

  const storeLabel = data?.store_name || profile.storeName || 'your store';

  const stats = data
    ? [
        {
          label: "Today's Revenue",
          value: formatCurrency(data.today_revenue),
          hint: 'Delivered today',
          icon: <IndianRupee className="size-5" />,
          tone: 'brand' as const,
        },
        {
          label: "Today's Orders",
          value: formatNumber(data.today_orders),
          hint: 'Delivered today',
          icon: <ShoppingBag className="size-5" />,
          tone: 'accent' as const,
        },
        {
          label: 'Live Orders',
          value: formatNumber(data.live_orders),
          hint: 'Awaiting action',
          icon: <Radio className="size-5" />,
          tone: 'success' as const,
        },
        {
          label: 'Running Orders',
          value: formatNumber(data.running_orders),
          hint: 'In progress',
          icon: <Truck className="size-5" />,
          tone: 'ink' as const,
        },
        {
          label: 'Completed',
          value: formatNumber(data.completed_orders),
          hint: 'Delivered today',
          icon: <CheckCircle2 className="size-5" />,
          tone: 'brand' as const,
        },
        {
          label: 'Pending',
          value: formatNumber(data.pending_orders),
          hint: 'Live + running',
          icon: <Clock3 className="size-5" />,
          tone: 'accent' as const,
        },
        {
          label: 'Cancel rate',
          value: `${data.cancel_rate_percent}%`,
          hint: `${formatNumber(data.cancelled_orders)} cancelled today`,
          icon: <Ban className="size-5" />,
          tone: 'ink' as const,
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={`Today's summary for ${storeLabel}${profile.zoneName ? ` · ${profile.zoneName}` : ''}`}
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 7 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <ChartCard title="Today's Revenue" subtitle="Cumulative delivered revenue (6 AM–11 PM)">
          {loading ? (
            <ChartEmpty message="Loading…" />
          ) : !hasRevenueActivity ? (
            <ChartEmpty message="No delivered revenue yet today" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.brand} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chart.brand} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chart.tick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    Number(v) >= 1000 ? `₹${Number(v) / 1000}k` : `₹${v}`
                  }
                />
                <Tooltip
                  formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                  contentStyle={chart.tooltip}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chart.brand}
                  strokeWidth={2.5}
                  fill="url(#revFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Hourly Orders" subtitle="Orders placed by hour (excl. cancelled)">
          {loading ? (
            <ChartEmpty message="Loading…" />
          ) : !hasOrderActivity ? (
            <ChartEmpty message="No orders placed yet today" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={ordersChart}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: chart.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: chart.tick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar
                  dataKey="value"
                  fill={chart.brandSoft}
                  radius={[8, 8, 0, 0]}
                  name="Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Top Selling Products" subtitle="Overall top 5 by units (this store)">
          {loading ? (
            <ChartEmpty message="Loading…" />
          ) : topProductsChart.length === 0 ? (
            <ChartEmpty message="No delivered products yet" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topProductsChart} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: chart.tick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={100}
                  tick={{ fill: chart.tickMuted, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chart.tooltip} />
                <Bar
                  dataKey="value"
                  fill={chart.accent}
                  radius={[0, 8, 8, 0]}
                  name="Sold"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">Live Orders</h2>
              <p className="text-xs text-ink-400">Awaiting your action</p>
            </div>
            <Link
              to="/live-orders"
              className="text-sm font-semibold text-brand-500 hover:text-brand-600"
            >
              View all
            </Link>
          </div>

          { !canViewLive ? (
            <p className="py-8 text-center text-sm text-red-600">
              {permissionRequiredMessage(PERMISSION.ViewLiveOrders)}
            </p>
          ) : live.error ? (
            <p className="py-8 text-center text-sm text-red-600">{live.error}</p>
          ) : live.loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-ink-50" />
              ))}
            </div>
          ) : live.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-400">No live orders right now</p>
          ) : (
            <ul className="space-y-3">
              {live.items.map((o) => (
                <li key={o.order_id}>
                  <Link
                    to={`/orders/${o.order_id}`}
                    className="flex items-center gap-3 rounded-xl border border-ink-50 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    {o.preview_image_url ? (
                      <img
                        src={o.preview_image_url}
                        alt=""
                        className="size-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex size-12 items-center justify-center rounded-xl bg-ink-50 text-ink-300">
                        <Package className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-800">
                        {itemsLabel(o)}
                      </p>
                      <p className="truncate text-xs text-ink-400">
                        {o.receiver_name?.trim() || 'Customer'} · {formatTime(o.created_at)}
                        {o.token > 0 ? ` · #${o.token}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-ink-900">
                      {formatCurrency(o.grand_total, o.currency || 'INR')}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-bold text-ink-900">Recent Orders</h2>
            <p className="text-xs text-ink-400">Latest activity at this store</p>
          </div>
          <Link
            to="/live-orders"
            className="text-sm font-semibold text-brand-500 hover:text-brand-600"
          >
            View boards
          </Link>
        </div>

        {!recentStatuses ? (
          <p className="py-8 text-center text-sm text-ink-400">
            Order board permissions are required to view recent orders.
          </p>
        ) : recentError ? (
          <p className="py-8 text-center text-sm text-red-600">{recentError}</p>
        ) : recentLoading ? (
          <TableSkeleton rows={5} />
        ) : recentItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400">No recent orders</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs font-semibold tracking-wide text-ink-400 uppercase">
                  <th className="pb-3 font-semibold">Order</th>
                  <th className="pb-3 font-semibold">Customer</th>
                  <th className="pb-3 font-semibold">Items</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Time</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentItems.map((o) => (
                  <tr key={o.order_id} className="border-b border-ink-50 last:border-0">
                    <td className="py-3">
                      <Link
                        to={`/orders/${o.order_id}`}
                        className="font-mono text-xs font-medium text-ink-800 hover:text-brand-600"
                      >
                        {o.order_number}
                      </Link>
                      {o.token > 0 ? (
                        <p className="text-xs text-ink-400">Token #{o.token}</p>
                      ) : null}
                    </td>
                    <td className="py-3 text-ink-600">
                      {o.receiver_name?.trim() || 'Customer'}
                    </td>
                    <td className="py-3 text-ink-600">{itemsLabel(o)}</td>
                    <td className="py-3 font-semibold text-ink-800">
                      {formatCurrency(o.grand_total, o.currency || 'INR')}
                    </td>
                    <td className="py-3 text-ink-500">{formatTime(o.created_at)}</td>
                    <td className="py-3">
                      <Badge tone={orderStatusTone(o.status)}>{o.status_text}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="font-display text-base font-bold text-ink-900">{title}</h2>
        <p className="text-xs text-ink-400">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
