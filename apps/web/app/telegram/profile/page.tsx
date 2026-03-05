'use client';

import { User, Heart, Settings, ChevronRight, Store } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import Link from 'next/link';

export default function TelegramProfilePage() {
    const { user } = useTelegram();

    const displayName = user
        ? [user.first_name, user.last_name].filter(Boolean).join(' ')
        : 'Mehmon';

    const menuItems = [
        {
            icon: Heart,
            label: 'Sevimlilar',
            href: '/telegram/favorites',
            color: '#ff3b30',
        },
        {
            icon: Store,
            label: "Do'kon ochish",
            href: '/telegram/store/apply',
            color: '#13EC37',
        },
        {
            icon: Settings,
            label: 'Sozlamalar',
            href: '/telegram/settings',
            color: '#909499',
        },
    ];

    return (
        <div className="flex flex-col min-h-full px-3 pt-6 pb-2 bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Avatar & Name */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-[var(--color-surface)] border-2 border-[var(--color-primary)] mb-3 flex items-center justify-center shadow-sm">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <User size={36} className="text-[var(--color-hint)]" />
                    )}
                </div>
                <h2 className="text-[18px] font-bold text-[var(--color-text)]">{displayName}</h2>
                {user?.username && (
                    <p className="text-[12px] text-[var(--color-hint)] mt-0.5">@{user.username}</p>
                )}
                {!user && (
                    <p className="text-[12px] text-[var(--color-hint)] mt-1">Telegram orqali kiring</p>
                )}
            </div>

            {/* Menu */}
            <div className="flex flex-col gap-2">
                {menuItems.map(({ icon: Icon, label, href, color }) => (
                    <Link
                        key={href}
                        href={href}
                        className="flex items-center gap-3 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] active:scale-[0.98] transition-transform duration-150"
                    >
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: color + '20' }}
                        >
                            <Icon size={18} style={{ color }} />
                        </div>
                        <span className="flex-1 text-[14px] font-semibold text-[var(--color-text)]">{label}</span>
                        <ChevronRight size={16} className="text-[var(--color-hint)]" />
                    </Link>
                ))}
            </div>

            {/* Telegram info */}
            {user && (
                <div className="mt-6 p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2">
                        Telegram ma'lumotlari
                    </p>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] text-[var(--color-hint)]">ID</span>
                            <span className="text-[12px] font-semibold text-[var(--color-text)]">{user.id}</span>
                        </div>
                        {user.language_code && (
                            <div className="flex items-center justify-between">
                                <span className="text-[12px] text-[var(--color-hint)]">Til</span>
                                <span className="text-[12px] font-semibold text-[var(--color-text)] uppercase">{user.language_code}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
