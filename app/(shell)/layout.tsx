'use client';

import Link from 'next/link';
import { Globe, LogIn, Moon, Package, Search, Store, Sun, User } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WebAuthProvider, useWebAuth } from '../../src/context/WebAuthContext';
import { useSettingsStore } from '../../src/features/settings/model';
import { isTelegramRoute, TELEGRAM_ROUTES } from '../../src/shared/config/constants';
import { useTranslation } from '../../src/shared/lib/i18n';
import { cn } from '../../src/shared/lib/utils';
import { useWebI18n } from '../../src/shared/lib/webI18n';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { AuthModal } from '../../src/shared/ui/AuthModal';
import { SupportChatModal } from '../../src/shared/ui/SupportChatModal';
import { ToastProvider } from '../../src/shared/ui/Toast';

function ShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const isTelegram = isTelegramRoute(pathname);
    const hasHeader = hasUnifiedHeader(pathname);
    const isCompactMobileHeader = false;
    const { w } = useWebI18n();
    const { t } = useTranslation();
    const settings = useSettingsStore((s) => s.settings);
    const loadSettings = useSettingsStore((s) => s.loadSettings);
    const updateSettings = useSettingsStore((s) => s.updateSettings);
    const { user, storeStatus, logout } = useWebAuth();
    const [langOpen, setLangOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
    const [supportOpen, setSupportOpen] = useState(false);
    const [hideWebHeader, setHideWebHeader] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [footerCategories, setFooterCategories] = useState<Array<{ id: string; name: string; name_uz?: string | null; name_ru?: string | null; name_en?: string | null; parent_id?: string | null }>>([]);
    const langRef = useRef<HTMLDivElement>(null);
    const mobileUserMenuRef = useRef<HTMLDivElement>(null);
    const desktopUserMenuRef = useRef<HTMLDivElement>(null);
    const isDark = settings.themeMode === 'dark';
    const closeMenus = () => {
        setLangOpen(false);
        setUserMenuOpen(false);
    };
    const navigateTo = (href: string) => {
        closeMenus();
        router.push(href);
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        const onDocClick = (event: PointerEvent) => {
            const target = event.target as Node;
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangOpen(false);
            }
            const isInsideMobileUserMenu = mobileUserMenuRef.current?.contains(target) ?? false;
            const isInsideDesktopUserMenu = desktopUserMenuRef.current?.contains(target) ?? false;
            if (!isInsideMobileUserMenu && !isInsideDesktopUserMenu) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', onDocClick);
        return () => document.removeEventListener('pointerdown', onDocClick);
    }, []);

    useEffect(() => {
        const openSupport = () => setSupportOpen(true);
        window.addEventListener('open-support-chat', openSupport);
        return () => window.removeEventListener('open-support-chat', openSupport);
    }, []);

    useEffect(() => {
        const handleVisibility = (event: Event) => {
            const customEvent = event as CustomEvent<{ hidden?: boolean }>;
            setHideWebHeader(Boolean(customEvent.detail?.hidden));
        };

        window.addEventListener('web-shell-header-visibility', handleVisibility);
        return () => window.removeEventListener('web-shell-header-visibility', handleVisibility);
    }, []);

    useEffect(() => {
        if (isTelegram) return;
        fetch('/api/categories')
            .then((r) => r.json())
            .then((json) => {
                const rows = json?.data?.categories ?? json?.categories ?? [];
                setFooterCategories(Array.isArray(rows) ? rows.filter((item) => !item.parent_id) : []);
            })
            .catch(() => setFooterCategories([]));
    }, [isTelegram]);

    if (!mounted) {
        return (
            <div className="min-h-[100dvh] w-full bg-[#f8f9fb] text-[#111111] dark:bg-[#0f0f0f] dark:text-white">
                <main className="w-full" suppressHydrationWarning>
                    {children}
                </main>
            </div>
        );
    }

    if (!isTelegram) {
        const WEB_LINKS = {
            HOME: '/',
            SHOPS: '/shops',
            CLOTHING: '/clothing',
            FOOTWEAR: '/footwear',
            PRODUCTS: '/products',
            STORE_APPLY: '/open-store',
            MY_STORE: '/my-store',
            SEARCH: '/products',
            PROFILE: '/profile',
        };

        const storeApproved = storeStatus?.status === 'approved';
        const links = [
            { href: WEB_LINKS.HOME, label: w.navbar.home },
            { href: WEB_LINKS.SHOPS, label: w.navbar.shops },
            { href: WEB_LINKS.CLOTHING, label: w.footer.categories },
            { href: WEB_LINKS.PRODUCTS, label: t.products_page_title },
            { href: '/favorites', label: t.favorites },
        ];
        const languages = [
            { code: 'uz', label: "O'zbek" },
            { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
            { code: 'en', label: 'English' },
        ] as const;

        type FooterItem = {
            key?: string;
            label: string;
            href?: string;
            onClick?: () => void;
        };

        type FooterGroup = {
            title: string;
            items: FooterItem[];
        };

        const footerGroups: FooterGroup[] = [
            { title: w.footer.customerService, items: [{ label: w.footer.helpCenter, onClick: () => setSupportOpen(true) }] },
            {
                title: w.footer.categories,
                items: footerCategories.map((category) => ({
                    key: category.id,
                    href: `/products?category=${category.id}`,
                    label: settings.language === 'ru'
                        ? (category.name_ru || category.name)
                        : settings.language === 'en'
                            ? (category.name_en || category.name)
                            : (category.name_uz || category.name),
                })),
            },
        ];

        const toggleTheme = () => {
            const nextTheme = settings.themeMode === 'dark' ? 'light' : 'dark';
            document.documentElement.classList.toggle('dark', nextTheme === 'dark');
            updateSettings({ themeMode: nextTheme });
        };
        const selectLanguage = (code: 'uz' | 'ru' | 'en') => {
            updateSettings({ language: code });
            setLangOpen(false);
        };

        return (
            <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8f9fb] text-[#111111] dark:bg-[#0f0f0f] dark:text-white">
                <ToastProvider />
                <AuthModal
                    open={authModal.open}
                    onClose={() => setAuthModal({ open: false, tab: 'login' })}
                    defaultTab={authModal.tab}
                />
                <SupportChatModal
                    open={supportOpen}
                    onClose={() => setSupportOpen(false)}
                    onRequireAuth={() => {
                        setSupportOpen(false);
                        setAuthModal({ open: true, tab: 'login' });
                    }}
                />

                <header
                    className={cn(
                        "fixed inset-x-0 top-0 z-[160] isolate bg-transparent px-2 py-2 sm:px-3 md:py-3",
                        hideWebHeader && 'hidden',
                    )}
                >
                    <div className={cn(
                        "relative z-[170] mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_auto] items-center rounded-[24px] border border-black/10 bg-[rgba(255,255,255,0.82)] shadow-[0_24px_45px_-30px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/12 dark:bg-[rgba(18,18,18,0.72)] md:grid-cols-[auto_1fr_auto] md:gap-4 md:rounded-full md:px-6",
                        isCompactMobileHeader ? 'gap-2 px-2.5 py-2 sm:px-4' : 'gap-3 px-3 py-2.5 sm:px-4 lg:py-2',
                    )}>
                        <Link href={WEB_LINKS.HOME} className={cn(
                            "min-w-0 truncate pr-2 font-black tracking-tight text-[#13ec37] dark:text-[#5df57a] sm:text-[19px] md:text-[24px] xl:text-[26px]",
                            isCompactMobileHeader ? 'max-w-[120px] text-[15px]' : 'text-[17px]',
                        )}>
                            Qulaymarket.Uz
                        </Link>

                        <nav className="hidden min-w-0 items-center justify-self-center gap-5 lg:flex xl:gap-9">
                            {links.map((link) => {
                                const currentPath = pathname ?? '/';
                                const active = link.href === '/' ? currentPath === '/' : currentPath.startsWith(link.href);
                                return (
                                    <Link
                                        key={`${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative whitespace-nowrap pb-1.5 text-[19px] font-semibold text-[#4b5563] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[#13ec37] after:transition-transform after:duration-200 hover:text-[#111827] hover:after:scale-x-100 dark:text-[#d1d5db] dark:hover:text-white',
                                            active && 'text-[#13ec37] after:scale-x-100 dark:text-[#5df57a]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="flex items-center justify-end gap-1.5 sm:gap-2 lg:hidden">
                            <button
                                type="button"
                                onClick={() => window.location.href = WEB_LINKS.SEARCH}
                                aria-label={t.search}
                                className={cn(
                                    "inline-flex shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c] sm:h-10 sm:w-10",
                                    isCompactMobileHeader ? 'h-8 w-8' : 'h-9 w-9',
                                )}
                            >
                                <Search className={cn("shrink-0 sm:h-[17px] sm:w-[17px]", isCompactMobileHeader ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                            </button>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label={t.theme}
                                className={cn(
                                    "inline-flex shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c] sm:h-10 sm:w-10",
                                    isCompactMobileHeader ? 'h-8 w-8' : 'h-9 w-9',
                                )}
                            >
                                {isDark ? <Sun className={cn("sm:h-[17px] sm:w-[17px]", isCompactMobileHeader ? 'h-3.5 w-3.5' : 'h-4 w-4')} /> : <Moon className={cn("sm:h-[17px] sm:w-[17px]", isCompactMobileHeader ? 'h-3.5 w-3.5' : 'h-4 w-4')} />}
                            </button>

                            <button
                                type="button"
                                onClick={() => selectLanguage(settings.language === 'uz' ? 'ru' : settings.language === 'ru' ? 'en' : 'uz')}
                                title={w.navbar.lang}
                                className={cn(
                                    "inline-flex shrink-0 items-center justify-center rounded-full border border-[#13ec37]/25 bg-[#effff2] font-semibold text-[#0d8f2a] shadow-[0_10px_20px_-16px_rgba(19,236,55,0.72)] dark:border-[#13ec37]/25 dark:bg-[#112315] dark:text-[#72f58a] sm:h-10 sm:min-w-10 sm:px-3",
                                    isCompactMobileHeader ? 'h-8 min-w-8 px-2 text-[10px]' : 'h-9 min-w-9 px-2.5 text-[11px]',
                                )}
                            >
                                {(settings.language ?? 'uz').toUpperCase()}
                            </button>

                            {user ? (
                                <div className="relative shrink-0" ref={mobileUserMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setUserMenuOpen((prev) => !prev)}
                                        className={cn(
                                            "inline-flex shrink-0 items-center gap-2 rounded-full bg-[#13ec37] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c] sm:h-10",
                                            isCompactMobileHeader ? 'h-8 w-8 justify-center rounded-full p-0' : 'h-9 max-w-[132px] px-3 text-[12px]',
                                        )}
                                        aria-label={t.profile}
                                    >
                                        <span className={cn(
                                            "inline-flex items-center justify-center rounded-full bg-white/20 font-black",
                                            isCompactMobileHeader ? 'h-6 w-6 text-[10px]' : 'h-6 w-6 text-[11px]',
                                        )}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className={cn("truncate", isCompactMobileHeader && 'hidden')}>{user.name}</span>
                                    </button>
                                        {userMenuOpen && (
                                            <div
                                                className="absolute right-0 z-[260] mt-3 w-56 touch-manipulation overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] pointer-events-auto dark:border-white/10 dark:bg-[#1a1a1a]"
                                                onPointerDown={(event) => event.stopPropagation()}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                <div className="border-b border-black/8 px-5 py-4 dark:border-white/10">
                                                    <p className="text-[13px] font-bold text-[#111111] dark:text-white">{user.name}</p>
                                                    <p className="mt-0.5 text-[11px] text-[#6b7280]">{user.email}</p>
                                                </div>
                                                <div className="p-2">
                                                    <button
                                                        type="button"
                                                        onPointerDown={(event) => event.stopPropagation()}
                                                        onClick={() => navigateTo('/profile')}
                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                    >
                                                        <User size={15} />
                                                        {t.profile}
                                                    </button>
                                                    {storeApproved && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onPointerDown={(event) => event.stopPropagation()}
                                                                onClick={() => navigateTo('/my-store')}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                            >
                                                                <Store size={15} />
                                                                {t.my_store}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onPointerDown={(event) => event.stopPropagation()}
                                                                onClick={() => navigateTo('/my-products')}
                                                                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                            >
                                                                <Package size={15} />
                                                                {t.my_products}
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onPointerDown={(event) => event.stopPropagation()}
                                                        onClick={() => {
                                                            logout();
                                                            setUserMenuOpen(false);
                                                        }}
                                                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 active:bg-red-50 dark:hover:bg-red-500/10 dark:active:bg-red-500/10"
                                                    >
                                                        {t.logout}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#13ec37] px-3.5 text-[12px] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c] sm:h-10 sm:px-4"
                                >
                                    Kirish
                                </button>
                            )}
                        </div>

                        <div className={cn(
                            "col-span-2 border-t border-black/8 pt-2 lg:hidden dark:border-white/10",
                            isCompactMobileHeader && 'hidden',
                        )}>
                                <nav className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
                                    {links.map((link) => {
                                        const currentPath = pathname ?? '/';
                                        const active = link.href === '/' ? currentPath === '/' : currentPath.startsWith(link.href);
                                        return (
                                        <Link
                                            key={`mobile-${link.href}-${link.label}`}
                                            href={link.href}
                                            className={cn(
                                                'shrink-0 rounded-full px-4 py-2 text-[12px] font-semibold transition-colors duration-200 sm:text-[13px]',
                                                active
                                                    ? 'bg-[#effff2] text-[#0d8f2a] dark:bg-[#112315] dark:text-[#72f58a]'
                                                    : 'bg-black/[0.03] text-[#4b5563] hover:bg-black/[0.05] dark:bg-white/[0.05] dark:text-[#d1d5db] dark:hover:bg-white/[0.08]',
                                            )}
                                        >
                                            {link.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="hidden items-center justify-end gap-2 lg:flex xl:gap-3">
                            <button
                                type="button"
                                onClick={() => window.location.href = WEB_LINKS.SEARCH}
                                aria-label={t.search}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                            >
                                <Search className="h-5 w-5 shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label={t.theme}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                            >
                                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </button>

                            <div className="relative shrink-0" ref={langRef}>
                                <button
                                    type="button"
                                    onClick={() => setLangOpen((prev) => !prev)}
                                    title={w.navbar.lang}
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                >
                                    <Globe className="h-5 w-5" />
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 z-[220] mt-2 w-36 overflow-hidden rounded-[18px] border border-[#13ec37]/20 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] dark:bg-[#111411]">
                                        {languages.map((language) => (
                                            <button
                                                key={language.code}
                                                type="button"
                                                onClick={() => selectLanguage(language.code)}
                                                className={cn(
                                                    'block w-full px-4 py-3 text-left text-[13px] font-semibold transition-colors',
                                                    settings.language === language.code
                                                        ? 'bg-[#effff2] text-[#0d8f2a] dark:bg-[#16351d] dark:text-[#72f58a]'
                                                        : 'text-[#111111] hover:bg-[#f5fff7] dark:text-white dark:hover:bg-[#16351d]',
                                                )}
                                            >
                                                {language.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {user ? (
                                <div className="relative shrink-0" ref={desktopUserMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setUserMenuOpen((prev) => !prev)}
                                        className="inline-flex h-10 items-center gap-3 rounded-full bg-[#13ec37] px-4 text-[14px] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                        aria-label={t.profile}
                                    >
                                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-[14px] font-black">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="max-w-[140px] truncate">{user.name}</span>
                                    </button>
                                    {userMenuOpen && (
                                        <div className="absolute right-0 z-[220] mt-3 w-56 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1a1a1a]">
                                            <div className="border-b border-black/8 px-5 py-4 dark:border-white/10">
                                                <p className="text-[13px] font-bold text-[#111111] dark:text-white">{user.name}</p>
                                                <p className="mt-0.5 text-[11px] text-[#6b7280]">{user.email}</p>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    type="button"
                                                    onClick={() => navigateTo('/profile')}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                >
                                                    <User size={15} />
                                                    {t.profile}
                                                </button>
                                                {storeApproved && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => navigateTo('/my-store')}
                                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                        >
                                                            <Store size={15} />
                                                            {t.my_store}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => navigateTo('/my-products')}
                                                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] active:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10"
                                                        >
                                                            <Package size={15} />
                                                            {t.my_products}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        logout();
                                                        setUserMenuOpen(false);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 active:bg-red-50 dark:hover:bg-red-500/10 dark:active:bg-red-500/10"
                                                >
                                                    {t.logout}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                    className="inline-flex h-10 shrink-0 items-center gap-3 rounded-full bg-[#13ec37] px-5 text-[14px] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                >
                                    <LogIn size={17} />
                                    {t.login_required}
                                </button>
                            )}
                        </div>
                    </div>

                </header>

                <main
                    className={cn(
                        "relative z-0 w-full overflow-x-hidden",
                        hideWebHeader ? 'pt-0' : isCompactMobileHeader ? 'pt-[72px] sm:pt-[90px] md:pt-[152px] lg:pt-[88px]' : 'pt-[138px] sm:pt-[146px] md:pt-[152px] lg:pt-[88px]',
                    )}
                >
                    {children}
                </main>

                <footer className="mt-12 border-t border-black/10 bg-white dark:border-white/10 dark:bg-[#111111]">
                    <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:px-5 md:px-6 md:py-14">
                        <div className="grid gap-10 border-b border-black/10 pb-10 dark:border-white/10 sm:grid-cols-2 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                            <div>
                                <h3 className="text-[30px] font-black tracking-tight">Qulaymarket</h3>
                                <p className="mt-3 max-w-sm text-[14px] leading-7 text-[#6b7280] dark:text-[#9ca3af]">{w.footer.desc}</p>
                            </div>
                            {footerGroups.map((group) => (
                                <div key={group.title}>
                                    <h4 className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#111111] dark:text-white">{group.title}</h4>
                                    <div className="mt-4 space-y-3">
                                        {group.items.map((item) =>
                                            item.href ? (
                                                <Link key={item.key || item.href || `${group.title}-${item.label}`} href={item.href} className="block text-[14px] text-[#6b7280] transition-colors hover:text-[#111111] dark:text-[#9ca3af] dark:hover:text-white">
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <button
                                                    key={item.key || `${group.title}-${item.label}`}
                                                    type="button"
                                                    onClick={item.onClick}
                                                    className="block text-[14px] text-[#6b7280] transition-colors hover:text-[#111111] dark:text-[#9ca3af] dark:hover:text-white"
                                                >
                                                    {item.label}
                                                </button>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        );
    }

    return (
        <div className="flex min-h-[100dvh] w-full justify-center bg-[var(--color-bg)]">
            <div className="relative h-[100dvh] min-h-[100dvh] w-full max-w-[540px] overflow-hidden bg-[var(--color-bg)] md:border-x md:border-[var(--color-border)] md:shadow-2xl">
                <ToastProvider />
                <AuthModal
                    open={authModal.open}
                    onClose={() => setAuthModal({ open: false, tab: 'login' })}
                    defaultTab={authModal.tab}
                />
                <SupportChatModal
                    open={supportOpen}
                    onClose={() => setSupportOpen(false)}
                    onRequireAuth={() => {
                        setSupportOpen(false);
                        setAuthModal({ open: true, tab: 'login' });
                    }}
                />
                <AppHeader />
                <main
                    className={cn(
                        'absolute inset-0 overflow-y-auto overflow-x-hidden animate-in fade-in duration-300 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch]',
                        pathname === TELEGRAM_ROUTES.PROFILE_SUPPORT ? 'pb-0' : 'pb-[var(--shell-nav-total)]',
                        hasHeader ? 'pt-[var(--shell-header-total)]' : 'pt-0',
                    )}
                >
                    {children}
                </main>
                <BottomNav />
            </div>
        </div>
    );
}

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    return (
        <WebAuthProvider>
            <ShellInner>{children}</ShellInner>
        </WebAuthProvider>
    );
}
