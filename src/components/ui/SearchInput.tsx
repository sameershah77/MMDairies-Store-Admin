import { Search } from 'lucide-react';
import type { InputHTMLAttributes } from 'react';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string;
}

export function SearchInput({ containerClassName = '', className = '', ...props }: SearchInputProps) {
  return (
    <div className={`relative ${containerClassName}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
      <input
        type="search"
        className={`h-10 w-full rounded-xl border border-ink-200 bg-surface pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:ring-3 focus:ring-brand-500/15 ${className}`}
        {...props}
      />
    </div>
  );
}
