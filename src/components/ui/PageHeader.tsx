import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[1.75rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: 'brand' | 'accent' | 'success' | 'ink' | 'danger';
}

const toneMap = {
  brand: 'bg-brand-50 text-brand-600',
  accent: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  success: 'bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-300',
  ink: 'bg-ink-100 text-ink-600',
  danger: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

export function StatCard({ label, value, hint, icon, tone = 'brand' }: StatCardProps) {
  return (
    <div className="group rounded-2xl border border-ink-100 bg-surface p-5 shadow-sm shadow-ink-900/3 transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
          {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
        </div>
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105 ${toneMap[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
