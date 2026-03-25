'use client';

import Link from 'next/link';
import { Globe, LogIn, Moon, Package, Search, Store, Sun, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { WebAuthProvider, useWebAuth } from '../../src/context/WebAuthContext';
import { useSettingsStore } from '../../src/features/settings/model';
import { isTelegramRoute } from '../../src/shared/config/constants';
import { cn } from '../../src/shared/lib/utils';
import { useWebI18n } from '../../src/shared/lib/webI18n';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { AuthModal } from '../../src/shared/ui/AuthModal';
import { SupportChatModal } from '../../src/shared/ui/SupportChatModal';
import { ToastProvider } from '../../src/shared/ui/Toast';

function ShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTelegram = isTelegramRoute(pathname);
    const hasHeader = hasUnifiedHeader(pathname);
    const { w } = useWebI18n();
    const settings = useSettingsStore((s) => s.settings);
    const loadSettings = useSettingsStore((s) => s.loadSettings);
    const updateSettings = useSettingsStore((s) => s.updateSettings);
    const { user, storeStatus, logout } = useWebAuth();
    const [langOpen, setLangOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
    const [supportOpen, setSupportOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const isDark = settings.themeMode === 'dark';

    useEffect(() => {
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        const onDocClick = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangOpen(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

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
            { href: WEB_LINKS.HOME, label: 'Bosh Sahifa' },
            { href: WEB_LINKS.SHOPS, label: "Do'konlar" },
            { href: WEB_LINKS.CLOTHING, label: 'Kategoriyalar' },
            { href: WEB_LINKS.PRODUCTS, label: 'Mahsulotlar' },
        ];
        const languages = [
            { code: 'uz', label: "O'zbek" },
            { code: 'ru', label: '\u0420\u0443\u0441\u0441\u043a\u0438\u0439' },
            { code: 'en', label: 'English' },
        ] as const;

        type FooterItem = {
            label: string;
            href?: string;
            onClick?: () => void;
        };

        type FooterGroup = {
            title: string;
            items: FooterItem[];
        };

        const footerGroups: FooterGroup[] = [
            { title: w.footer.about, items: [{ href: WEB_LINKS.HOME, label: w.footer.aboutBrand }, { href: WEB_LINKS.SHOPS, label: w.footer.ourStory }, { href: WEB_LINKS.STORE_APPLY, label: w.footer.careers }] },
            { title: w.footer.customerService, items: [{ label: w.footer.helpCenter, onClick: () => setSupportOpen(true) }] },
            { title: w.footer.categories, items: [{ href: WEB_LINKS.CLOTHING, label: w.footer.men }, { href: WEB_LINKS.CLOTHING, label: w.footer.women }, { href: WEB_LINKS.FOOTWEAR, label: w.footer.shoes }] },
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

                <header className="fixed inset-x-0 top-0 z-[160] isolate bg-transparent px-2 py-3">
                    <div className="mx-auto grid w-full max-w-[1232px] grid-cols-[auto_1fr_auto] items-center gap-4 rounded-full border border-white/10 bg-[rgba(18,18,18,0.58)] px-4 py-2.5 shadow-[0_24px_45px_-30px_rgba(15,23,42,0.5)] backdrop-blur-2xl dark:border-white/12 dark:bg-[rgba(18,18,18,0.62)] md:px-6">
                        <Link href={WEB_LINKS.HOME} className="shrink-0 text-[18px] font-black tracking-tight text-[#13ec37] dark:text-[#5df57a] md:text-[21px]">
                            Qulaymarket.Uz
                        </Link>

                        <nav className="hidden items-center justify-self-center gap-6 xl:flex">
                            {links.map((link) => {
                                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative whitespace-nowrap pb-1 text-[14px] font-semibold text-[#4b5563] transition-colors duration-200 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-[#13ec37] after:transition-transform after:duration-200 hover:text-[#111827] hover:after:scale-x-100 dark:text-[#d1d5db] dark:hover:text-white',
                                            active && 'text-[#13ec37] after:scale-x-100 dark:text-[#5df57a]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="hidden items-center justify-end gap-3 lg:flex">
                            <button
                                type="button"
                                onClick={() => window.location.href = WEB_LINKS.SEARCH}
                                aria-label="Mahsulotlarni qidirish"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                            </button>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                            >
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>

                            <div className="relative shrink-0" ref={langRef}>
                                <button
                                    type="button"
                                    onClick={() => setLangOpen((prev) => !prev)}
                                    title="Tilni almashtirish"
                                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                >
                                    <Globe className="h-4 w-4" />
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 z-[170] mt-2 w-36 overflow-hidden rounded-[18px] border border-[#13ec37]/20 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] dark:bg-[#111411]">
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
                                <div className="relative shrink-0" ref={userMenuRef}>
                                    <button
                                        type="button"
                                        onClick={() => setUserMenuOpen((prev) => !prev)}
                                        className="inline-flex h-10 items-center gap-2 rounded-full bg-[#13ec37] px-3.5 text-[14px] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                        aria-label="Profile"
                                    >
                                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[12px] font-black">
                                            {user.name.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="max-w-[140px] truncate">{user.name}</span>
                                    </button>
                                    {userMenuOpen && (
                                        <div className="absolute right-0 z-[170] mt-3 w-56 overflow-hidden rounded-[22px] border border-black/8 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] dark:border-white/10 dark:bg-[#1a1a1a]">
                                            <div className="border-b border-black/8 px-5 py-4 dark:border-white/10">
                                                <p className="text-[13px] font-bold text-[#111111] dark:text-white">{user.name}</p>
                                                <p className="mt-0.5 text-[11px] text-[#6b7280]">{user.email}</p>
                                            </div>
                                            <div className="p-2">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                                                >
                                                    <User size={15} />
                                                    Profil
                                                </Link>
                                                {storeApproved && (
                                                    <>
                                                        <Link
                                                            href="/my-store"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                                                        >
                                                            <Store size={15} />
                                                            Mening Do&apos;konim
                                                        </Link>
                                                        <Link
                                                            href="/my-products"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                                                        >
                                                            <Package size={15} />
                                                            Mening Mahsulotlarim
                                                        </Link>
                                                    </>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        logout();
                                                        setUserMenuOpen(false);
                                                    }}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    Chiqish
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                    className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[#13ec37] px-6 text-[14px] font-semibold text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                                >
                                    <LogIn size={15} />
                                    Kirish
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mx-auto flex w-full max-w-[1232px] flex-col gap-3 px-4 pt-3 lg:hidden">
                        <button
                            type="button"
                            onClick={() => window.location.href = WEB_LINKS.SEARCH}
                            aria-label="Mahsulotlarni qidirish"
                            className="inline-flex h-10 w-10 items-center justify-center self-end rounded-full bg-[#13ec37] text-[#06200f] shadow-[0_16px_28px_-18px_rgba(19,236,55,0.72)] transition-all duration-300 hover:bg-[#0fd430] dark:bg-[#13ec37] dark:text-[#06200f] dark:hover:bg-[#38f05c]"
                        >
                            <Search className="h-4 w-4 shrink-0" />
                        </button>

                        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto rounded-full border border-white/10 bg-[rgba(18,18,18,0.58)] px-4 py-3 shadow-[0_14px_30px_-24px_rgba(15,23,42,0.45)] backdrop-blur-2xl dark:border-white/12 dark:bg-[rgba(18,18,18,0.62)]">
                            {links.map((link) => {
                                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`mobile-${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors duration-200',
                                            active ? 'bg-[#effff2] text-[#0d8f2a] dark:bg-[#0f2012] dark:text-[#72f58a]' : 'text-[#4b5563] dark:text-[#d1d5db]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => selectLanguage(settings.language === 'uz' ? 'ru' : settings.language === 'ru' ? 'en' : 'uz')}
                                title="Tilni almashtirish"
                                className="inline-flex h-9 shrink-0 items-center rounded-full border border-[#13ec37]/20 bg-[#effff2] px-3 text-[12px] font-semibold text-[#0d8f2a] dark:border-[#13ec37]/20 dark:bg-[#0f2012] dark:text-[#72f58a]"
                            >
                                {(settings.language ?? 'uz').toUpperCase()}
                            </button>

                            <button
                                type="button"
                                onClick={toggleTheme}
                                aria-label="Toggle theme"
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#13ec37] text-[#06200f] dark:bg-[#13ec37] dark:text-[#06200f]"
                            >
                                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </button>

                            {!user && (
                                <button
                                    type="button"
                                    onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                    className="inline-flex h-9 shrink-0 items-center rounded-full bg-[#13ec37] px-4 text-[13px] font-semibold text-[#06200f] dark:bg-[#13ec37] dark:text-[#06200f]"
                                >
                                    Kirish
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="relative z-0 w-full overflow-x-hidden pt-[112px] lg:pt-[88px]">{children}</main>

                <footer className="mt-12 border-t border-black/10 bg-white dark:border-white/10 dark:bg-[#111111]">
                    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:py-14">
                        <div className="grid gap-10 border-b border-black/10 pb-10 dark:border-white/10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
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
                                                <Link key={`${group.title}-${item.label}`} href={item.href} className="block text-[14px] text-[#6b7280] transition-colors hover:text-[#111111] dark:text-[#9ca3af] dark:hover:text-white">
                                                    {item.label}
                                                </Link>
                                            ) : (
                                                <button
                                                    key={`${group.title}-${item.label}`}
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
            <div className="relative h-[100dvh] min-h-[100dvh] w-full max-w-[500px] overflow-hidden bg-[var(--color-bg)] md:border-x md:border-[var(--color-border)] md:shadow-2xl">
                <ToastProvider />
                <AppHeader />
                <main
                    className={cn(
                        'absolute inset-0 overflow-y-auto overflow-x-hidden animate-in fade-in duration-300 [overscroll-behavior-y:contain] [-webkit-overflow-scrolling:touch] pb-[var(--shell-nav-total)]',
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
