'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Heart, User } from 'lucide-react';
import { APP_ROUTES } from '../config/constants';
import { cn } from '../lib/utils';

export function BottomNav() {
    const pathname = usePathname();

    const links = [
        { href: APP_ROUTES.HOME, icon: Home, label: 'Home' },
        { href: '/search', icon: Search, label: 'Search' },
        { href: APP_ROUTES.FAVORITES, icon: Heart, label: 'Favorites' },
        { href: APP_ROUTES.PROFILE, icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-[400px] h-[72px] bg-[var(--color-nav-bg)] rounded-[40px] z-50 shadow-[0_10px_35px_rgba(0,0,0,0.2)] border border-[var(--color-nav-border)] backdrop-blur-lg">
            <div className="flex items-center justify-between h-full px-2 relative">
                {links.map((link) => {
                    const isActive = pathname === link.href;
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
                                    <div className="w-14 h-14 bg-[var(--color-nav-active-bg)] rounded-full shadow-[0_6px_20px_rgba(26,229,80,0.4)] animate-in zoom-in duration-300" />
                                </div>
                            )}
                            <Icon
                                size={22}
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
    );
}
