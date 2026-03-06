'use client';

import Link from 'next/link';
import { Facebook, Globe, Heart, Instagram, Search, User, Youtube } from 'lucide-react';
import { BottomNav } from '../../src/shared/ui/BottomNav';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { AppHeader, hasUnifiedHeader } from '../../src/shared/ui/AppHeader';
import { usePathname } from 'next/navigation';
import { cn } from '../../src/shared/lib/utils';
import { isTelegramRoute } from '../../src/shared/config/constants';
import { useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '../../src/features/settings/model';
import { type WebLanguage, useWebI18n } from '../../src/shared/lib/webI18n';

export default function ShellLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isTelegram = isTelegramRoute(pathname);
    const hasHeader = hasUnifiedHeader(pathname);
    const { w } = useWebI18n();
    const { settings, loadSettings, updateSettings } = useSettingsStore();
    const [langOpen, setLangOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    useEffect(() => {
        const onDocClick = (event: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(event.target as Node)) {
                setLangOpen(false);
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
            STORE_APPLY: '/open-store',
            SEARCH: '/clothing',
            FAVORITES: '/favorites',
            PROFILE: '/profile',
        };

        const links = [
            { href: WEB_LINKS.HOME, label: w.navbar.home },
            { href: WEB_LINKS.SHOPS, label: w.navbar.shops },
            { href: WEB_LINKS.CLOTHING, label: w.navbar.clothing },
            { href: WEB_LINKS.FOOTWEAR, label: w.navbar.footwear },
            { href: WEB_LINKS.STORE_APPLY, label: w.navbar.openStore },
        ];
        const langOptions: WebLanguage[] = ['uz', 'ru', 'en'];
        const langLabels: Record<WebLanguage, string> = {
            uz: "O'zbek",
            en: 'English',
            ru: 'Русский',
        };

        const footerGroups = [
            {
                title: w.footer.about,
                items: [
                    { href: WEB_LINKS.HOME, label: w.footer.aboutClothes },
                    { href: WEB_LINKS.SHOPS, label: w.footer.ourStory },
                    { href: WEB_LINKS.SHOPS, label: w.footer.careers },
                ],
            },
            {
                title: w.footer.customerService,
                items: [
                    { href: WEB_LINKS.SHOPS, label: w.footer.helpCenter },
                    { href: WEB_LINKS.SHOPS, label: w.footer.shipping },
                    { href: WEB_LINKS.SHOPS, label: w.footer.returns },
                ],
            },
            {
                title: w.footer.categories,
                items: [
                    { href: WEB_LINKS.CLOTHING, label: w.footer.men },
                    { href: WEB_LINKS.CLOTHING, label: w.footer.women },
                    { href: WEB_LINKS.FOOTWEAR, label: w.footer.shoes },
                ],
            },
        ];

        return (
            <div className="relative min-h-[100dvh] w-full overflow-x-hidden bg-[#f8f9fb] text-[#111111]">
                <ToastProvider />
                <header className="sticky top-0 z-30 border-b border-black/5 bg-white/70 backdrop-blur-xl">
                    <div className="mx-auto flex h-[72px] w-full max-w-[1280px] items-center justify-between px-4 md:h-[84px]">
                        <Link href={WEB_LINKS.HOME} className="text-[24px] font-black leading-none tracking-tight text-[#111111] md:text-[30px]">
                            Clothes<span className="text-[#00c853]">.</span>
                        </Link>
                        <nav className="hidden items-center gap-8 lg:flex">
                            {links.map((link) => {
                                const active = link.href === '/'
                                    ? pathname === '/'
                                    : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative text-[13px] font-bold uppercase tracking-[0.14em] transition-all duration-300 after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#00c853] after:transition-all after:duration-300 hover:text-[#111111] hover:after:w-full',
                                            active ? 'text-[#111111] after:w-full' : 'text-[#6b7280]',
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                        </nav>
                        <div className="flex items-center gap-1 text-[#6b7280] md:gap-2">
                            <div className="relative" ref={langRef}>
                                <button
                                    onClick={() => setLangOpen((prev) => !prev)}
                                    aria-label={w.navbar.lang}
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] max-[380px]:h-8 max-[380px]:w-8 md:h-10 md:w-10"
                                >
                                    <Globe className="h-[16px] w-[16px] max-[380px]:h-[14px] max-[380px]:w-[14px]" />
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-[22px] border border-black/8 bg-[#f4f5f7] shadow-[0_24px_46px_-22px_rgba(0,0,0,0.35)] z-50 md:w-48">
                                        {langOptions.map((code) => (
                                            <button
                                                key={code}
                                                onClick={() => { updateSettings({ language: code }); setLangOpen(false); }}
                                                className={cn(
                                                    'block w-full px-6 py-4 text-left transition-all duration-200',
                                                    settings.language === code
                                                        ? 'bg-[#17e235] text-[#031f0b]'
                                                        : 'text-[#111111] hover:bg-white/70',
                                                )}
                                            >
                                                <span className="text-[16px] font-black leading-none tracking-tight">
                                                    {langLabels[code]}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <Link href={WEB_LINKS.SEARCH} aria-label="Search" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] max-[380px]:h-8 max-[380px]:w-8 md:h-10 md:w-10"><Search className="h-[15px] w-[15px] max-[380px]:h-[13px] max-[380px]:w-[13px]" /></Link>
                            <Link href={WEB_LINKS.FAVORITES} aria-label="Favorites" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] max-[380px]:h-8 max-[380px]:w-8 md:h-10 md:w-10"><Heart className="h-[15px] w-[15px] max-[380px]:h-[13px] max-[380px]:w-[13px]" /></Link>
                            <Link href={WEB_LINKS.PROFILE} aria-label="Profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00c853]/40 hover:text-[#111111] hover:shadow-[0_10px_30px_-12px_rgba(0,200,83,0.7)] max-[380px]:h-8 max-[380px]:w-8 md:h-10 md:w-10"><User className="h-[15px] w-[15px] max-[380px]:h-[13px] max-[380px]:w-[13px]" /></Link>
                        </div>
                    </div>
                    <div className="mx-auto w-full max-w-[1280px] px-4 pb-3 lg:hidden">
                        <div className="grid w-full grid-cols-5 items-center gap-2">
                            {links.map((link) => {
                                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                                return (
                                    <Link
                                        key={`mobile-${link.href}-${link.label}`}
                                        href={link.href}
                                        className={cn(
                                            'relative block min-w-0 whitespace-nowrap py-1 text-center text-[10px] font-bold uppercase tracking-[0.1em] transition-all duration-300 sm:text-[12px] sm:tracking-[0.14em] after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-[#00c853] after:transition-all after:duration-300 hover:text-[#111111] hover:after:w-full',
                                            active ? 'text-[#111111] after:w-full' : 'text-[#6b7280]',
                                        )}
                                    >
                                        <span className="block truncate">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </header>
                <main className="w-full overflow-x-hidden">{children}</main>
                <footer className="mt-12 border-t border-black/10 bg-white">
                    <div className="mx-auto w-full max-w-[1280px] px-4 py-10 md:py-14">
                        <div className="grid gap-10 border-b border-black/10 pb-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
                            <div>
                                <h3 className="text-[30px] font-black tracking-tight">
                                    Clothes<span className="text-[#00c853]">.</span>
                                </h3>
                                <p className="mt-3 max-w-sm text-[14px] leading-7 text-[#6b7280]">
                                    {w.footer.desc}
                                </p>
                                <div className="mt-5 flex items-center gap-2 text-[#6b7280]">
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111]"><Instagram size={16} /></button>
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111]"><Facebook size={16} /></button>
                                    <button className="rounded-full border border-black/10 p-2 transition-colors hover:border-[#00c853]/40 hover:text-[#111111]"><Youtube size={16} /></button>
                                </div>
                            </div>
                            {footerGroups.map((group) => (
                                <div key={group.title}>
                                    <h4 className="text-[14px] font-bold uppercase tracking-[0.1em] text-[#111111]">{group.title}</h4>
                                    <div className="mt-4 space-y-3">
                                        {group.items.map((item) => (
                                            <Link key={`${group.title}-${item.label}`} href={item.href} className="block text-[14px] text-[#6b7280] transition-colors hover:text-[#111111]">
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-10 grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                            <div>
                                <h4 className="text-[18px] font-extrabold">{w.footer.newsletterTitle}</h4>
                                <p className="mt-1 text-[14px] text-[#6b7280]">{w.footer.newsletterDesc}</p>
                            </div>
                            <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-black/10 bg-[#f8f9fb] p-2">
                                <input
                                    type="email"
                                    placeholder={w.footer.emailPlaceholder}
                                    className="h-10 w-full bg-transparent px-3 text-[14px] text-[#111111] outline-none placeholder:text-[#9ca3af]"
                                />
                                <button className="inline-flex h-10 items-center rounded-full bg-[#00c853] px-5 text-[12px] font-black uppercase tracking-[0.12em] text-[#06200f] transition-all duration-300 hover:shadow-[0_14px_28px_-12px_rgba(0,200,83,0.8)]">
                                    {w.footer.subscribe}
                                </button>
                            </div>
                        </div>
                        <p className="mt-8 text-[12px] text-[#9ca3af]">&copy; {new Date().getFullYear()} Clothes Marketplace. {w.footer.rights}</p>
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
