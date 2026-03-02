'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, User, Home, Store } from 'lucide-react';
import { APP_ROUTES } from '../config/constants';
import { cn } from '../lib/utils';

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: APP_ROUTES.HOME, icon: Home, label: 'Products' },
        { href: APP_ROUTES.PRODUCTS, icon: Store, label: 'Stores' },
        { href: APP_ROUTES.FAVORITES, icon: Heart, label: 'Favorites' },
        { href: APP_ROUTES.PROFILE, icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed inset-x-0 mx-auto bottom-0 w-full max-w-[500px] z-50 px-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pointer-events-none md:hidden">
            <div className="mx-auto w-[92%] max-w-[372px] h-[60px] bg-[var(--color-nav-bg)] rounded-[30px] shadow-[0_6px_25px_rgba(0,0,0,0.12)] border border-[var(--color-nav-border)] glass-blur pointer-events-auto">
                <div className="flex items-center justify-between h-full px-2.5 relative">
                    {links.map((link) => {
                        const isActive =
                            link.href === APP_ROUTES.HOME
                                ? pathname === APP_ROUTES.HOME || pathname === APP_ROUTES.STORES
                                : pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300",
                                    isActive ? "z-10" : "text-[var(--color-nav-icon)]"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-11 h-11 bg-[var(--color-nav-active-bg)] rounded-full shadow-[0_4px_12px_rgba(26,229,80,0.25)] animate-in zoom-in duration-300" />
                                    </div>
                                )}
                                <Icon
                                    size={19}
                                    className={cn(
                                        "relative z-20 transition-all duration-300",
                                        isActive ? "text-[var(--color-nav-active-icon)] scale-110" : "hover:text-[var(--color-text)]"
                                    )}
                                />
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
