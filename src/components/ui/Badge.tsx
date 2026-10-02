import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  tone?: 'success' | 'danger' | 'warning' | 'neutral' | 'brand';
  className?: string;
}

const tones = {
  success:
    'bg-green-50 text-green-700 ring-green-200 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30',
  danger:
    'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/30',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30',
  neutral: 'bg-ink-100 text-ink-600 ring-ink-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200 dark:text-brand-400',
};

export function Badge({ children, tone = 'neutral', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { tone: BadgeProps['tone']; label: string }> = {
    active: { tone: 'success', label: 'Active' },
    inactive: { tone: 'neutral', label: 'Inactive' },
    pending: { tone: 'warning', label: 'Pending' },
    accepted: { tone: 'brand', label: 'Accepted' },
    preparing: { tone: 'warning', label: 'Preparing' },
    out_for_delivery: { tone: 'brand', label: 'Out for Delivery' },
    delivered: { tone: 'success', label: 'Delivered' },
    cancelled: { tone: 'danger', label: 'Cancelled' },
  };
  const item = map[status] || { tone: 'neutral' as const, label: status };
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
