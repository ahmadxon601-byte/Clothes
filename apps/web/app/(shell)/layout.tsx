'use client';

import Link from 'next/link';
import { Facebook, Globe, Heart, Instagram, Moon, Search, Sun, User, Youtube, LogIn, UserPlus, Store } from 'lucide-react';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { AuthModal } from '../../src/shared/ui/AuthModal';
import { WebAuthProvider, useWebAuth } from '../../src/context/WebAuthContext';
import { usePathname } from 'next/navigation';
import { cn } from '../../src/shared/lib/utils';
import { isTelegramRoute } from '../../src/shared/config/constants';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../src/features/settings/model';
import { type WebLanguage, useWebI18n } from '../../src/shared/lib/webI18n';

function ShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTelegram = isTelegramRoute(pathname);
    const hasHeader = hasUnifiedHeader(pathname);
    const { w } = useWebI18n();
    const { settings, loadSettings, updateSettings } = useSettingsStore();
    const { user, storeStatus, logout } = useWebAuth();
    const [langOpen, setLangOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' });
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
            if (langRef.current && !langRef.current.contains(event.target as Node)) setLangOpen(false);
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setUserMenuOpen(false);
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
            STORE_APPLY: '/open-store',
            MY_STORE: '/my-store',
            SEARCH: '/clothing',
            FAVORITES: '/favorites',
            PROFILE: '/profile',
        };

        const storeApproved = storeStatus?.status === 'approved';
        const storePending = storeStatus?.status === 'pending';

        const baseLinks = [
            { href: WEB_LINKS.HOME, label: w.navbar.home },
            { href: WEB_LINKS.SHOPS, label: w.navbar.shops },
            { href: WEB_LINKS.CLOTHING, label: w.navbar.clothing },
            { href: WEB_LINKS.FOOTWEAR, label: w.navbar.footwear },
        ];

        // Show store-related nav link only if logged in
        const storeLink = user
            ? storeApproved
                ? { href: WEB_LINKS.MY_STORE, label: "Mening Do'konim" }
                : storePending
                    ? null  // pending — no nav link, shown in profile area
                    : { href: WEB_LINKS.STORE_APPLY, label: w.navbar.openStore }
            : null;

        const links = storeLink ? [...baseLinks, storeLink] : baseLinks;

        const langOptions: WebLanguage[] = ['uz', 'ru', 'en'];
        const langLabels: Record<WebLanguage, string> = { uz: "O'zbek", en: 'English', ru: 'Русский' };

        const footerGroups = [
            { title: w.footer.about, items: [{ href: WEB_LINKS.HOME, label: w.footer.aboutClothes }, { href: WEB_LINKS.SHOPS, label: w.footer.ourStory }, { href: WEB_LINKS.SHOPS, label: w.footer.careers }] },
            { title: w.footer.customerService, items: [{ href: WEB_LINKS.SHOPS, label: w.footer.helpCenter }, { href: WEB_LINKS.SHOPS, label: w.footer.shipping }, { href: WEB_LINKS.SHOPS, label: w.footer.returns }] },
            { title: w.footer.categories, items: [{ href: WEB_LINKS.CLOTHING, label: w.footer.men }, { href: WEB_LINKS.CLOTHING, label: w.footer.women }, { href: WEB_LINKS.FOOTWEAR, label: w.footer.shoes }] },
        ];

        const iconBtnClass = "flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] dark:border-white/15 dark:bg-white/10 dark:hover:text-white max-[380px]:h-8 max-[380px]:w-8 md:h-10 md:w-10";

        return (
            <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8f9fb] text-[#111111] dark:bg-[#0f0f0f] dark:text-white">
                <ToastProvider />
                <AuthModal
                    open={authModal.open}
                    onClose={() => setAuthModal({ open: false, tab: 'login' })}
                    defaultTab={authModal.tab}
                />
                <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#111111]/80">
                    <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:h-[84px]">
                        <Link href={WEB_LINKS.HOME} className="text-[24px] font-black leading-none tracking-tight text-[#111111] dark:text-white md:text-[30px]">
                            Clothes<span className="text-[#00c853]">.</span>
                        </Link>
                        <nav className="hidden items-center gap-8 lg:flex">
                            {links.map((link) => {
                                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative text-[13px] font-bold uppercase tracking-[0.14em] transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#00c853] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-white hover:after:w-full',
                                            active ? 'text-[#111111] dark:text-white after:w-full' : 'text-[#6b7280] dark:text-[#9ca3af]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                            {storePending && user && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-orange-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                    Kutilmoqda
                                </span>
                            )}
                        </nav>
                        <div className="flex items-center gap-1 text-[#6b7280] dark:text-[#9ca3af] md:gap-2">
                            {/* Language */}
                            <div className="relative" ref={langRef}>
                                <button onClick={() => setLangOpen((p) => !p)} aria-label={w.navbar.lang} className={iconBtnClass}>
                                    <Globe className="h-[16px] w-[16px] max-[380px]:h-[14px] max-[380px]:w-[14px]" />
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[22px] border border-black/8 bg-[#f4f5f7] shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] z-50 dark:border-white/10 dark:bg-[#1a1a1a] md:w-48">
                                        {langOptions.map((code) => (
                                            <button
                                                key={code}
                                                onClick={() => { updateSettings({ language: code }); setLangOpen(false); }}
                                                className={cn(
                                                    'block w-full px-6 py-4 text-left transition-all duration-200',
                                                    settings.language === code ? 'bg-[#17e235] text-[#031f0b]' : 'text-[#111111] hover:bg-white/70 dark:text-white dark:hover:bg-white/10',
                                                )}
                                            >
                                                <span className="text-[16px] font-black leading-none tracking-tight">{langLabels[code]}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {/* Theme */}
                            <button onClick={() => updateSettings({ themeMode: isDark ? 'light' : 'dark' })} aria-label="Toggle theme" className={iconBtnClass}>
                                {isDark ? <Sun className="h-[15px] w-[15px]" /> : <Moon className="h-[15px] w-[15px]" />}
                            </button>
                            {/* Search */}
                            <Link href={WEB_LINKS.SEARCH} aria-label="Search" className={iconBtnClass}>
                                <Search className="h-[15px] w-[15px]" />
                            </Link>
                            {/* Favorites — requires auth */}
                            {user ? (
                                <Link href={WEB_LINKS.FAVORITES} aria-label="Favorites" className={iconBtnClass}>
                                    <Heart className="h-[15px] w-[15px]" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                    aria-label="Favorites"
                                    className={iconBtnClass}
                                >
                                    <Heart className="h-[15px] w-[15px]" />
                                </button>
                            )}
                            {/* Auth area */}
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenuOpen((p) => !p)}
                                        className={cn(iconBtnClass, 'bg-[#111111] text-white hover:bg-[#333333] dark:bg-white/15 dark:text-white dark:hover:bg-white/25')}
                                        aria-label="Profile"
                                    >
                                        <span className="text-[12px] font-black">{user.name.charAt(0).toUpperCase()}</span>
                                    </button>
                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[20px] border border-black/8 bg-white shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] z-50 dark:border-white/10 dark:bg-[#1a1a1a]">
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
                                                    <Link
                                                        href="/my-store"
                                                        onClick={() => setUserMenuOpen(false)}
                                                        className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#111111] transition-colors hover:bg-[#f3f4f6] dark:text-white dark:hover:bg-white/10"
                                                    >
                                                        <Store size={15} />
                                                        Mening Do'konim
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => { logout(); setUserMenuOpen(false); }}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                                                >
                                                    Chiqish
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => setAuthModal({ open: true, tab: 'login' })}
                                        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-black/10 bg-white/70 px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-[#111111] transition-all hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] dark:border-white/15 dark:bg-white/10 dark:text-white md:h-10 md:px-4"
                                    >
                                        <LogIn size={13} />
                                        Kirish
                                    </button>
                                    <button
                                        onClick={() => setAuthModal({ open: true, tab: 'register' })}
                                        className="hidden md:inline-flex h-9 items-center gap-1.5 rounded-full bg-[#00c853] px-4 text-[11px] font-bold uppercase tracking-[0.1em] text-[#06200f] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.8)] md:h-10"
                                    >
                                        <UserPlus size={13} />
                                        Ro'yxat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Mobile nav links */}
                    <div className="mx-auto w-full max-w-[1280px] px-4 pb-3 lg:hidden">
                        <div className="no-scrollbar flex w-full items-center gap-4 overflow-x-auto">
                            {links.map((link) => {
                                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`mobile-${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative shrink-0 py-1 text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 sm:text-[12px] sm:tracking-[0.14em] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#00c853] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-white hover:after:w-full',
                                            active ? 'text-[#111111] dark:text-white after:w-full' : 'text-[#6b7280] dark:text-[#9ca3af]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                            {storePending && user && (
                                <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-orange-600">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                                    Kutilmoqda
                                </span>
                            )}
                        </div>
                    </div>
                </header>
                <main className="w-full overflow-x-hidden">{children}</main>
                <footer className="mt-12 border-t border-black/10 bg-white dark:border-white/10 dark:bg-[#111111]">
                    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:py-14">
                        <div className="grid gap-10 border-b border-black/10 pb-10 dark:border-white/10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                            <div>
                                <h3 className="text-[30px] font-black tracking-tight">Clothes<span className="text-[#00c853]">.</span></h3>
                                <p className="mt-3 max-w-sm text-[14px] leading-7 text-[#6b7280] dark:text-[#9ca3af]">{w.footer.desc}</p>
                                <div className="mt-5 flex items-center gap-2 text-[#6b7280] dark:text-[#9ca3af]">
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111] dark:border-white/15 dark:hover:text-white"><Instagram size={16} /></button>
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111] dark:border-white/15 dark:hover:text-white"><Facebook size={16} /></button>
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111] dark:border-white/15 dark:hover:text-white"><Youtube size={16} /></button>
                                </div>
                            </div>
                            {footerGroups.map((group) => (
                                <div key={group.title}>
                                    <h4 className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#111111] dark:text-white">{group.title}</h4>
                                    <div className="mt-4 space-y-3">
                                        {group.items.map((item) => (
                                            <Link key={`${group.title}-${item.label}`} href={item.href} className="block text-[14px] text-[#6b7280] transition-colors hover:text-[#111111] dark:text-[#9ca3af] dark:hover:text-white">{item.label}</Link>
                                        ))}
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
