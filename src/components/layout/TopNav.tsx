import { useEffect, useRef, useState } from 'react';
import { LogOut, Menu, Moon, Sun, MapPin, Store, CircleUserRound, Phone, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InitialsAvatar } from '@/components/ui/InitialsAvatar';
import { useAuth } from '@/context/AuthContext';
import { useSidebar } from '@/context/SidebarContext';
import { useTheme } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';

export function TopNav() {
  const { profile, logout } = useAuth();
  const { setMobileOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);

  const contactPhones = profile.contactPhones ?? [];
  const contactEmails = profile.contactEmails ?? [];
  const hasContacts = contactPhones.length > 0 || contactEmails.length > 0;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (contactsRef.current && !contactsRef.current.contains(e.target as Node)) {
        setContactsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-100 bg-surface/90 px-4 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="rounded-xl p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="size-5" />
      </button>

      <div className="hidden min-w-0 flex-1 items-center gap-3 md:flex">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate font-brand text-lg leading-none text-ink-900 sm:text-xl">
            {profile.dairyName}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-x-2 text-[11px] text-ink-500">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3 shrink-0 text-brand-500" />
              <span className="truncate">{profile.zoneName}</span>
            </span>
            <span className="shrink-0 text-ink-300">·</span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Store className="size-3 shrink-0 text-brand-500" />
              <span className="truncate">{profile.storeName}</span>
            </span>
          </div>
        </div>

        {hasContacts ? (
          <div className="relative shrink-0" ref={contactsRef}>
            <button
              type="button"
              onClick={() => {
                setContactsOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-100 hover:text-brand-600"
              aria-expanded={contactsOpen}
              title="Store contacts"
            >
              <Phone className="size-3.5 text-brand-500" />
              <span className="hidden xl:inline">Contacts</span>
            </button>
            {contactsOpen && (
              <div className="absolute left-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-ink-100 bg-surface shadow-xl shadow-ink-900/10 animate-fade-up">
                <div className="border-b border-ink-100 px-4 py-2.5">
                  <p className="font-display text-sm font-bold text-ink-900">Store contacts</p>
                </div>
                <div className="space-y-2 px-4 py-3">
                  {contactPhones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2 truncate text-sm text-ink-700 hover:text-brand-600"
                      title={phone}
                    >
                      <Phone className="size-3.5 shrink-0 text-brand-500" />
                      <span className="truncate">{phone}</span>
                    </a>
                  ))}
                  {contactEmails.map((email) => (
                    <a
                      key={email}
                      href={`mailto:${email}`}
                      className="flex items-center gap-2 truncate text-sm text-ink-700 hover:text-brand-600"
                      title={email}
                    >
                      <Mail className="size-3.5 shrink-0 text-brand-500" />
                      <span className="truncate">{email}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl p-2 text-ink-600 transition hover:bg-ink-100 hover:text-brand-500"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl py-1 pr-1 pl-1 transition hover:bg-ink-50 sm:pl-2"
          >
            <span className="hidden text-right sm:block">
              <span className="block text-sm font-semibold text-ink-800">{profile.name}</span>
              <span className="block text-[11px] text-ink-400">Store Admin</span>
            </span>
            <InitialsAvatar name={profile.name} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-ink-100 bg-surface py-1 shadow-xl shadow-ink-900/10 animate-fade-up">
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
              >
                <CircleUserRound className="size-4 text-ink-400" /> Profile
              </button>
              <div className="my-1 border-t border-ink-100" />
              <button
                type="button"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-red-50 dark:hover:bg-red-500/10"
                onClick={async () => {
                  setProfileOpen(false);
                  await logout();
                  toast('Logged out successfully', 'info');
                  navigate('/login');
                }}
              >
                <LogOut className="size-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
