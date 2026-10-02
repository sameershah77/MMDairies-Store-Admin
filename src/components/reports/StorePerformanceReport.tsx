import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  CircleX,
  Clock,
  Heart,
  Hourglass,
  IndianRupee,
  Package,
  ShoppingBag,
  Star,
  TrendingUp,
  UserRound,
  Users,
  UserX,
} from 'lucide-react';
import { StatCard } from '@/components/ui/PageHeader';
import { useChartTheme } from '@/hooks/useChartTheme';
import { formatCurrency, formatNumber } from '@/data/mockData';
import type { ReportPerformanceDto } from '@/types/reports';

const RFM_COLORS: Record<string, string> = {
  Champion: '#0d7377',
  Loyal: '#16a34a',
  New: '#e8a838',
  AtRisk: '#ea580c',
  Lost: '#94a3b8',
  NeverOrdered: '#647084',
};

const RFM_LABELS: Record<string, string> = {
  Champion: 'Champion',
  Loyal: 'Loyal',
  New: 'New',
  AtRisk: 'At risk',
  Lost: 'Lost',
  NeverOrdered: 'Never ordered',
};

function isSameDay(from: string, to: string) {
  return from.slice(0, 10) === to.slice(0, 10);
}

export function StorePerformanceReport({ report }: { report: ReportPerformanceDto }) {
  const chart = useChartTheme();
  const [productMetric, setProductMetric] = useState<'units' | 'revenue'>('units');
  const todayLike = isSameDay(report.from, report.to);
  const prefix = todayLike ? "Today's " : '';

  const topChartData = [...report.top_products]
    .sort((a, b) =>
      productMetric === 'units' ? b.units - a.units : b.revenue - a.revenue,
    )
    .slice(0, 5)
    .map((p) => ({
      label: p.product_name,
      bar: productMetric === 'units' ? p.units : p.revenue,
    }));

  const categoryChartMinWidth = Math.max(
    360,
    report.category_revenue.length * 88,
  );

  const mostFavorited = report.most_favorited.slice(0, 5);

  const rfmChart = report.rfm_segments.map((s) => ({
    label: RFM_LABELS[s.segment] ?? s.segment,
    value: s.count,
    color: RFM_COLORS[s.segment] ?? chart.brand,
  }));

  const hourlyChart = report.hourly_orders.map((h) => ({
    label: h.label,
    value: h.orders,
  }));

  return (
    <>
      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard
          label={`${prefix}Revenue`}
          value={formatCurrency(report.revenue)}
          icon={<IndianRupee className="size-5" />}
          tone="brand"
        />
        <StatCard
          label={`${prefix}Orders`}
          value={formatNumber(report.orders)}
          icon={<ShoppingBag className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Average Order Value"
          value={formatCurrency(report.aov)}
          icon={<TrendingUp className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Total Products Sold"
          value={formatNumber(report.products_sold)}
          icon={<Package className="size-5" />}
          tone="ink"
        />
        <StatCard
          label="Cancel rate"
          value={`${report.cancel_rate_percent}%`}
          hint={`${formatNumber(report.cancelled_orders)} cancelled`}
          icon={<CircleX className="size-5" />}
          tone="danger"
        />
        <StatCard
          label="Pending / in progress"
          value={formatNumber(report.pending_orders)}
          hint="Live open orders"
          icon={<Hourglass className="size-5" />}
          tone="accent"
        />
        <StatCard
          label="Avg feedback"
          value={
            report.avg_feedback_rating == null
              ? '—'
              : report.avg_feedback_rating.toFixed(1)
          }
          hint={`${formatNumber(report.feedback_count)} reviews in range`}
          icon={<Star className="size-5" />}
          tone="success"
        />
      </div>

      <div className="mt-4 grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-surface px-5 py-4 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              Morning rush · 6–11 AM
            </p>
            <p className="font-display text-lg font-bold text-ink-900">
              {formatNumber(report.morning_rush_orders)} orders
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-surface px-5 py-4 shadow-sm">
          <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300">
            <Clock className="size-5" />
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wide text-ink-400 uppercase">
              Evening rush · 4–11 PM
            </p>
            <p className="font-display text-lg font-bold text-ink-900">
              {formatNumber(report.evening_rush_orders)} orders
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-display text-base font-bold text-ink-900">
            Category-wise Revenue
          </h2>
          <p className="mb-4 text-xs text-ink-400">
            All categories · scroll horizontally when needed
          </p>
          {report.category_revenue.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-400">No delivered sales in this range</p>
          ) : (
            <div className="overflow-x-auto pb-1">
              <div style={{ minWidth: categoryChartMinWidth }}>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={report.category_revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: chart.tick, fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      interval={0}
                    />
                    <YAxis
                      tick={{ fill: chart.tick, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `₹${v / 1000}k`}
                    />
                    <Tooltip
                      formatter={(v) => [formatCurrency(Number(v)), 'Revenue']}
                      contentStyle={chart.tooltip}
                    />
                    <Bar dataKey="value" fill={chart.brand} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">
                Top Selling Products
              </h2>
              <p className="text-xs text-ink-400">
                {productMetric === 'units'
                  ? 'Top 5 by units sold'
                  : 'Top 5 by revenue'}
              </p>
            </div>
            <div className="flex rounded-lg border border-ink-200 p-0.5">
              <button
                type="button"
                onClick={() => setProductMetric('units')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  productMetric === 'units'
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-500 hover:bg-ink-50'
                }`}
              >
                Units
              </button>
              <button
                type="button"
                onClick={() => setProductMetric('revenue')}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                  productMetric === 'revenue'
                    ? 'bg-brand-500 text-white'
                    : 'text-ink-500 hover:bg-ink-50'
                }`}
              >
                Revenue
              </button>
            </div>
          </div>
          {topChartData.length === 0 ? (
            <p className="py-16 text-center text-sm text-ink-400">No products sold in this range</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topChartData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: chart.tick, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    productMetric === 'revenue' ? `₹${v / 1000}k` : String(v)
                  }
                />
                <YAxis
                  dataKey="label"
                  type="category"
                  width={100}
                  tick={{ fill: chart.tickMuted, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [
                    productMetric === 'revenue'
                      ? formatCurrency(Number(v))
                      : formatNumber(Number(v)),
                    productMetric === 'revenue' ? 'Revenue' : 'Sold',
                  ]}
                  contentStyle={chart.tooltip}
                />
                <Bar dataKey="bar" fill={chart.brandSoft} radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-1 font-display text-base font-bold text-ink-900">
            Hourly Sales Analysis
          </h2>
          <p className="mb-4 text-xs text-ink-400">
            Order volume by hour of day (6 AM – 11 PM)
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={hourlyChart}>
              <defs>
                <linearGradient id="hourlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={chart.brandSoft} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={chart.brandSoft} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
              <XAxis
                dataKey="label"
                tick={{ fill: chart.tick, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fill: chart.tick, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chart.tooltip} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={chart.brand}
                strokeWidth={2.5}
                fill="url(#hourlyFill)"
                name="Orders"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-8 mb-4">
        <h2 className="font-display text-lg font-bold text-ink-900">Customers · RFM · Favorites</h2>
        <p className="text-sm text-ink-500">Recency, frequency, spend and wishlist demand</p>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
        <StatCard
          label="Assigned customers"
          value={formatNumber(report.assigned_customers)}
          hint="Mapped to this store (+ walk-in)"
          icon={<Users className="size-5" />}
          tone="brand"
        />
        <StatCard
          label="Active buyers"
          value={formatNumber(report.active_buyers)}
          hint="Delivered order in selected range"
          icon={<UserRound className="size-5" />}
          tone="success"
        />
        <StatCard
          label="Never ordered"
          value={formatNumber(report.never_ordered)}
          hint="Assigned, no delivered order yet"
          icon={<UserX className="size-5" />}
          tone="ink"
        />
        <StatCard
          label="At risk"
          value={formatNumber(report.at_risk)}
          hint="Last order 31–90 days ago"
          icon={<AlertTriangle className="size-5" />}
          tone="accent"
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <h2 className="mb-1 font-display text-base font-bold text-ink-900">RFM segments</h2>
          <p className="mb-4 text-xs text-ink-400">
            Recency, frequency and spend for this store
          </p>
          <div className="grid gap-4 sm:grid-cols-2 sm:items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={rfmChart}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={2}
                >
                  {rfmChart.map((row) => (
                    <Cell key={row.label} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, name) => [formatNumber(Number(v)), String(name)]}
                  contentStyle={chart.tooltip}
                />
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-2">
              {rfmChart.map((row) => (
                <li
                  key={row.label}
                  className="flex items-center justify-between gap-3 text-sm"
                >
                  <span className="flex items-center gap-2 text-ink-700">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: row.color }}
                    />
                    {row.label}
                  </span>
                  <span className="font-semibold text-ink-900">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm">
          <div className="mb-1 flex items-center gap-2">
            <Heart className="size-4 text-brand-500" />
            <h2 className="font-display text-base font-bold text-ink-900">Most favorited</h2>
          </div>
          <p className="mb-4 text-xs text-ink-400">Top 5 wishlist products</p>
          {mostFavorited.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">No favorites yet</p>
          ) : (
            <ul className="space-y-3">
              {mostFavorited.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-800">
                      {p.product_name}
                    </p>
                    <p className="text-xs text-ink-400">{p.category_name || '—'}</p>
                  </div>
                  <span className="text-sm font-bold text-ink-900">
                    {formatNumber(p.favorites_count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
