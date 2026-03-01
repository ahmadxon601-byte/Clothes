'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  BadgeAlert,
  Bell,
  Boxes,
  ChartLine,
  FileClock,
  Files,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Package,
  Settings,
  Shield,
  ShoppingBag,
  Store,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { cn } from '../../shared/lib/utils';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
};

const primaryNav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, mobile: true },
  { href: '/admin/applications', label: 'Applications', icon: Files, mobile: true },
  { href: '/admin/products', label: 'Products', icon: ShoppingBag, mobile: true },
  { href: '/admin/shops', label: 'Shops', icon: Store, mobile: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

const moreNav: NavItem[] = [
  { href: '/admin/categories', label: 'Categories', icon: Boxes },
  { href: '/admin/banners', label: 'Banners', icon: Bell },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { href: '/admin/reports', label: 'Reports', icon: BadgeAlert },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/roles', label: 'Roles', icon: Shield },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: FileClock },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200',
        active ? 'bg-[var(--admin-pill)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]' : 'text-[var(--admin-muted)] hover:bg-[var(--admin-pill)]'
      )}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl border border-[var(--admin-border)] transition-colors',
          active ? 'bg-[var(--admin-accent)]/20 text-[var(--admin-accent)]' : 'bg-[var(--admin-card)]'
        )}
      >
        <Icon className='size-4' />
      </span>
      <span className='text-sm font-medium'>{item.label}</span>
    </Link>
  );
}

function MoreMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[70] bg-black/50'
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className='fixed inset-x-0 bottom-0 z-[71] rounded-t-[24px] border border-[var(--admin-border)] bg-[var(--admin-card)] p-4 pb-8 shadow-[var(--admin-shadow)]'
          >
            <div className='mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--admin-border)]' />
            <p className='mb-3 text-sm font-semibold text-[var(--admin-text)]'>More</p>
            <div className='grid grid-cols-2 gap-2'>
              {moreNav.map((item) => (
                <NavLink key={item.href} item={item} onClick={onClose} />
              ))}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function MobileBottomNav({ onMore }: { onMore: () => void }) {
  const pathname = usePathname();
  const mobileItems = primaryNav.filter((item) => item.mobile);

  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 border-t border-[var(--admin-border)] bg-[var(--admin-card)]/95 px-2 py-2 backdrop-blur xl:hidden'>
      <div className='grid grid-cols-5 gap-1'>
        {mobileItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors',
                active ? 'bg-[var(--admin-pill)] text-[var(--admin-text)]' : 'text-[var(--admin-muted)]'
              )}
            >
              <Icon className='size-4' />
              {item.label}
            </Link>
          );
        })}
        <button onClick={onMore} className='flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-[var(--admin-muted)]'>
          <Menu className='size-4' />
          More
        </button>
      </div>
    </nav>
  );
}

export function AdminShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAdminAuth();
  const { theme, setTheme } = useTheme();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    }
  }, [loading, router, user]);

  const subtitle = useMemo(() => {
    if (pathname.includes('/products')) return 'Product moderation and publishing flow';
    if (pathname.includes('/applications')) return 'Review incoming shop applications';
    if (pathname.includes('/shops')) return 'Manage shops, activation and suspension';
    return 'Clothes MP admin workspace';
  }, [pathname]);

  if (loading) {
    return <div className='grid min-h-screen place-items-center bg-[var(--admin-bg)] text-[var(--admin-muted)]'>Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className='min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]'>
      <aside className='fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-[var(--admin-border)] bg-[var(--admin-card)] p-4 xl:flex xl:flex-col'>
        <div className='mb-4 rounded-2xl bg-[var(--admin-pill)] p-3'>
          <p className='text-xl font-extrabold'>Clothes MP</p>
          <p className='text-xs text-[var(--admin-muted)]'>Admin Panel</p>
        </div>
        <div className='space-y-1 overflow-y-auto pr-1'>
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <div className='my-2 h-px bg-[var(--admin-border)]' />
          {moreNav.filter((item) => !primaryNav.some((base) => base.href === item.href)).map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>
        <button
          onClick={() => {
            logout();
            router.replace('/admin/login');
          }}
          className='mt-auto rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-3 text-left text-sm text-[var(--admin-muted)] transition hover:-translate-y-0.5'
        >
          Sign out
        </button>
      </aside>

      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-[60] bg-black/50 xl:hidden'
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-y-0 left-0 z-[61] w-[260px] border-r border-[var(--admin-border)] bg-[var(--admin-card)] p-4 xl:hidden'
            >
              <div className='mb-4 flex items-center justify-between'>
                <p className='text-lg font-bold'>Clothes MP</p>
                <button onClick={() => setDrawerOpen(false)} className='rounded-xl border border-[var(--admin-border)] p-2'>
                  <X className='size-4' />
                </button>
              </div>
              <div className='space-y-1'>
                {[...primaryNav, ...moreNav].map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />
                ))}
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className='xl:pl-[260px]'>
        <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/90 px-4 backdrop-blur md:px-6'>
          <button onClick={() => setDrawerOpen(true)} className='rounded-xl border border-[var(--admin-border)] p-2 xl:hidden'>
            <Menu className='size-4' />
          </button>
          <div className='min-w-0'>
            <h1 className='truncate text-lg font-bold'>{title}</h1>
            <p className='hidden text-xs text-[var(--admin-muted)] md:block'>{subtitle}</p>
          </div>
          <div className='ml-auto flex items-center gap-2'>
            {actions}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5'
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className='px-4 pb-24 pt-4 md:px-6 xl:pb-6'
        >
          {children}
        </motion.main>
      </div>

      <MobileBottomNav onMore={() => setMoreOpen(true)} />
      <MoreMenuSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </div>
  );
}

export const adminNavigation = { primaryNav, moreNav };
export const adminOverviewCards = [
  { title: 'Users', value: '2.4k', icon: Users },
  { title: 'Products', value: '9.8k', icon: ShoppingBag },
  { title: 'Shops', value: '438', icon: Store },
  { title: 'Moderation', value: '112', icon: Activity },
  { title: 'Reports', value: '37', icon: ChartLine },
  { title: 'Orders', value: '1.9k', icon: Package },
];
