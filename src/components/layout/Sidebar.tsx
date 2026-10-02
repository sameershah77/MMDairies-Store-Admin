import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Truck,
  Bike,
  CheckCircle2,
  CircleX,
  Package,
  BarChart3,
  MessageSquareWarning,
  Star,
  ChevronLeft,
  X,
  ShoppingBag,
} from 'lucide-react';
import { useSidebar } from '@/context/SidebarContext';
import { BrandMark } from '@/components/brand/BrandMark';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/orders/create', label: 'Create Order', icon: ShoppingBag },
  { to: '/live-orders', label: 'Live Orders', icon: Radio },
  { to: '/running-orders', label: 'Running Orders', icon: Truck },
  { to: '/out-for-delivery', label: 'Out for Delivery', icon: Bike },
  { to: '/completed-orders', label: 'Completed Orders', icon: CheckCircle2 },
  { to: '/cancelled-orders', label: 'Cancelled Orders', icon: CircleX },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/complaints', label: 'Complaints', icon: MessageSquareWarning },
  { to: '/feedbacks', label: 'Feedbacks', icon: Star },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const { collapsed, mobileOpen, setMobileOpen, toggleCollapsed } = useSidebar();

  const content = (
    <aside
      className={`flex h-full flex-col border-r border-ink-100 bg-surface transition-all duration-300 ${
        collapsed ? 'w-[76px]' : 'w-[260px]'
      }`}
    >
      <div className={`flex h-16 items-center gap-2 border-b border-ink-100 px-3 ${collapsed ? 'justify-center' : 'px-4'}`}>
        {collapsed ? (
          <BrandMark showName={false} size="sm" />
        ) : (
          <BrandMark size="sm" subtitle="Store Admin" className="min-w-0 flex-1" />
        )}
        <button
          type="button"
          className="ml-auto rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="size-[18px] shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="hidden border-t border-ink-100 p-3 lg:block">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 transition hover:bg-ink-50 hover:text-ink-800 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <ChevronLeft className={`size-4 transition ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">{content}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 z-10 shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}
