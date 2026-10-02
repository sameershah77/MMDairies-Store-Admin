import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:brightness-110 shadow-sm shadow-brand-500/25 disabled:opacity-50',
  secondary: 'bg-ink-100 text-ink-800 hover:bg-ink-200 disabled:opacity-50',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 disabled:opacity-50',
  danger: 'bg-danger text-white hover:brightness-110 shadow-sm disabled:opacity-50',
  outline:
    'border border-ink-200 bg-surface text-ink-700 hover:bg-ink-50 disabled:opacity-50',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-5 text-base gap-2 rounded-xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
