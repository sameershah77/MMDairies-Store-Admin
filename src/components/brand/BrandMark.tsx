import mainLogo from '@/assets/brand/main_logo.png';

interface BrandMarkProps {
  /** Show wordmark next to logo */
  showName?: boolean;
  /** Light text for dark backgrounds */
  light?: boolean;
  /** Compact for sidebar / mobile */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  subtitle?: string;
}

const sizeMap = {
  sm: { logo: 'size-8', name: 'text-base', gap: 'gap-2.5' },
  md: { logo: 'size-10', name: 'text-xl', gap: 'gap-3' },
  lg: { logo: 'size-12', name: 'text-2xl', gap: 'gap-3' },
} as const;

export function BrandMark({
  showName = true,
  light = false,
  size = 'md',
  className = '',
  subtitle,
}: BrandMarkProps) {
  const s = sizeMap[size];
  return (
    <div className={`flex min-w-0 items-center ${s.gap} ${className}`}>
      <img
        src={mainLogo}
        alt="M M Dairy"
        className={`${s.logo} shrink-0 object-contain`}
      />
      {showName ? (
        <div className="min-w-0">
          <p
            className={`font-brand leading-none ${s.name} ${
              light ? 'text-white' : 'text-ink-900'
            }`}
          >
            M M Dairy
          </p>
          {subtitle ? (
            <p
              className={`mt-1 text-[11px] font-medium tracking-wide uppercase ${
                light ? 'text-brand-100' : 'text-brand-500'
              }`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
