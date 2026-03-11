'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Bell,
  Boxes,
  ChartLine,
  FileClock,
  Files,
  Globe,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  Store,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useAdminI18n } from '../../context/AdminI18nContext';
import { cn } from '../../shared/lib/utils';
import { useAdminSSE } from './components/hooks';

export type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  mobile?: boolean;
};

const primaryNav: NavItem[] = [
  { href: '/admin/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, mobile: true },
  { href: '/admin/applications', labelKey: 'nav.applications', icon: Files, mobile: true },
  { href: '/admin/products', labelKey: 'nav.products', icon: ShoppingBag, mobile: true },
  { href: '/admin/shops', labelKey: 'nav.shops', icon: Store, mobile: true },
  { href: '/admin/users', labelKey: 'nav.users', icon: Users },
];

const moreNav: NavItem[] = [
  { href: '/admin/categories', labelKey: 'nav.categories', icon: Boxes },
  { href: '/admin/banners', labelKey: 'nav.banners', icon: Bell },
  { href: '/admin/audit-logs', labelKey: 'nav.auditLogs', icon: FileClock },
  { href: '/admin/settings', labelKey: 'nav.settings', icon: Settings },
];

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const pathname = usePathname();
  const { t } = useAdminI18n();
  const active = pathname === item.href;
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200',
        active
          ? 'bg-[var(--admin-pill)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]'
          : 'text-[var(--admin-muted)] hover:bg-[var(--admin-pill)]',
      )}
    >
      <span
        className={cn(
          'grid size-9 place-items-center rounded-xl border border-[var(--admin-border)] transition-colors',
          active ? 'bg-[var(--admin-accent)]/20 text-[var(--admin-accent)]' : 'bg-[var(--admin-card)]',
        )}
      >
        <Icon className='size-4' />
      </span>
      <span className='text-sm font-medium'>{t(item.labelKey)}</span>
    </Link>
  );
}

function MoreMenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useAdminI18n();
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
            <p className='mb-3 text-sm font-semibold text-[var(--admin-text)]'>{t('layout.more')}</p>
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
  const { t } = useAdminI18n();
  const mobileItems = primaryNav.filter((item) => item.mobile);

  return (
    <nav className='fixed inset-x-0 bottom-0 z-50 border-t border-[var(--admin-border)] bg-[var(--admin-card)]/95 px-2 py-2 backdrop-blur min-[1000px]:hidden'>
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
                active ? 'bg-[var(--admin-pill)] text-[var(--admin-text)]' : 'text-[var(--admin-muted)]',
              )}
            >
              <Icon className='size-4' />
              {t(item.labelKey)}
            </Link>
          );
        })}
        <button
          onClick={onMore}
          className='flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium text-[var(--admin-muted)]'
        >
          <Menu className='size-4' />
          {t('layout.more')}
        </button>
      </div>
    </nav>
  );
}

export function AdminShell({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAdminAuth();
  useAdminSSE();
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useAdminI18n();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin/login');
    }
  }, [loading, router, user]);

  const subtitle = useMemo(() => {
    if (pathname.includes('/products')) return t('dashboard.subtitle');
    if (pathname.includes('/applications')) return t('applications.subtitle');
    if (pathname.includes('/shops')) return t('stores.title');
    return 'Clothes MP admin workspace';
  }, [pathname, t]);

  if (loading) {
    return (
      <div className='grid min-h-screen place-items-center bg-[var(--admin-bg)] text-[var(--admin-muted)]'>
        {t('common.loading')}
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className='min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]'>
      {/* Sidebar — md+ dan doim ko'rinadi */}
      <aside className='fixed inset-y-0 left-0 z-40 hidden w-[260px] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-card)] p-4 min-[1000px]:flex'>
        <div className='mb-4 rounded-2xl bg-[var(--admin-pill)] p-3'>
          <p className='text-xl font-extrabold'>Clothes MP</p>
          <p className='text-xs text-[var(--admin-muted)]'>Admin Panel</p>
        </div>
        <div className='flex-1 space-y-1 overflow-y-auto pr-1'>
          {primaryNav.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <div className='my-2 h-px bg-[var(--admin-border)]' />
          {moreNav
            .filter((item) => !primaryNav.some((base) => base.href === item.href))
            .map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
        </div>
        <button
          onClick={() => {
            logout();
            router.replace('/admin/login');
          }}
          className='mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:-translate-y-0.5 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50'
        >
          {t('layout.logout')}
        </button>
      </aside>

      {/* Mobile drawer — faqat md dan kichik ekranlar uchun */}
      <AnimatePresence>
        {drawerOpen ? (
          <>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 z-[60] bg-black/50 min-[1000px]:hidden'
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2 }}
              className='fixed inset-y-0 left-0 z-[61] flex w-[260px] flex-col border-r border-[var(--admin-border)] bg-[var(--admin-card)] p-4 min-[1000px]:hidden'
            >
              <div className='mb-4 flex items-center justify-between'>
                <p className='text-lg font-bold'>Clothes MP</p>
                <button onClick={() => setDrawerOpen(false)} className='rounded-xl border border-[var(--admin-border)] p-2'>
                  <X className='size-4' />
                </button>
              </div>
              <div className='flex-1 space-y-1 overflow-y-auto'>
                {primaryNav.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />
                ))}
                <div className='my-2 h-px bg-[var(--admin-border)]' />
                {moreNav.map((item) => (
                  <NavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />
                ))}
              </div>
              <button
                onClick={() => {
                  logout();
                  router.replace('/admin/login');
                }}
                className='mt-4 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400'
              >
                {t('layout.logout')}
              </button>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      <div className='min-[1000px]:pl-[260px]'>
        <header className='sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-bg)]/90 px-4 backdrop-blur min-[1000px]:px-6'>
          <button
            onClick={() => setDrawerOpen(true)}
            className='rounded-xl border border-[var(--admin-border)] p-2 min-[1000px]:hidden'
          >
            <Menu className='size-4' />
          </button>
          <div className='min-w-0'>
            <h1 className='truncate text-lg font-bold'>{title}</h1>
            <p className='hidden text-xs text-[var(--admin-muted)] min-[1000px]:block'>{subtitle}</p>
          </div>

          <div className='ml-auto flex items-center gap-2'>
            {actions}

            {/* Language switcher */}
            <div className='relative'>
              <button
                onClick={() => setLangOpen(!langOpen)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition hover:-translate-y-0.5',
                  langOpen
                    ? 'border-[var(--admin-accent)] text-[var(--admin-accent)]'
                    : 'border-[var(--admin-border)] bg-[var(--admin-pill)] text-[var(--admin-muted)]',
                )}
              >
                <Globe className='size-3.5' />
                {locale.toUpperCase()}
              </button>
              <AnimatePresence>
                {langOpen && (
                  <>
                    <div className='fixed inset-0 z-40' onClick={() => setLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className='absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-card)] shadow-[var(--admin-shadow)]'
                    >
                      {(['uz', 'ru', 'en'] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => {
                            setLocale(lang);
                            setLangOpen(false);
                          }}
                          className={cn(
                            'w-full px-4 py-3 text-left text-sm font-medium transition-colors',
                            locale === lang
                              ? 'bg-[var(--admin-accent)] text-white'
                              : 'text-[var(--admin-text)] hover:bg-[var(--admin-pill)]',
                          )}
                        >
                          {t(`lang.${lang}`)}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className='rounded-full border border-[var(--admin-border)] bg-[var(--admin-pill)] p-2 transition hover:-translate-y-0.5'
            >
              {theme === 'dark' ? <Sun className='size-4' /> : <Moon className='size-4' />}
            </button>
          </div>
        </header>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className='px-4 pb-24 pt-4 min-[1000px]:px-6 min-[1000px]:pb-6'
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
  { titleKey: 'dashboard.users', icon: Users },
  { titleKey: 'dashboard.products', icon: ShoppingBag },
  { titleKey: 'dashboard.stores', icon: Store },
  { titleKey: 'dashboard.applications', icon: Activity },
  { titleKey: 'reports.title', icon: ChartLine },
  { titleKey: 'nav.orders', icon: Package },
];
