import { getInitials } from '@/lib/initials';

interface InitialsAvatarProps {
  name: string;
  className?: string;
}

export function InitialsAvatar({ name, className = '' }: InitialsAvatarProps) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-bold tracking-wide text-brand-700 ring-2 ring-brand-100 ${className}`}
      title={name}
    >
      {getInitials(name)}
    </span>
  );
}
