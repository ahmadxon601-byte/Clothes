'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Bookmark, MessageCircleQuestion, Settings, Check, Store } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import { mockApi } from '../../../src/services/mockServer';
import { APP_ROUTES } from '../../../src/shared/config/constants';
import { useRouter } from 'next/navigation';
import { cn } from '../../../src/shared/lib/utils';
import { useTranslation } from '../../../src/shared/lib/i18n';

export default function ProfilePage() {
    const router = useRouter();
    const { user } = useTelegram();
    const { t } = useTranslation();

    useEffect(() => {
        const fetchStatus = async () => {
            const uid = user ? String(user.id) : 'mock_user_123';
            const application = await mockApi.getMyApplication(uid);
            if (application) {
                // Application found
            }
        };
        fetchStatus();
    }, [user]);

    const profileName = user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Ahmad';
    const username = user?.username || 'Telegram user name';

    const menuItems = [
        { label: t.favorites, sub: t.saved_products, icon: Bookmark, href: APP_ROUTES.FAVORITES, iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
        { label: t.help_faq, sub: t.answers_to_questions, icon: MessageCircleQuestion, href: '#', iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
        { label: t.settings, sub: t.language_theme_security, icon: Settings, href: APP_ROUTES.SETTINGS, iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
    ];

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] pb-32">
            {/* Header */}
            <header className="flex items-center justify-between px-6 pt-6 pb-4">
                <button
                    onClick={() => router.back()}
                    className="w-12 h-12 flex items-center justify-center bg-[var(--color-surface)] rounded-full shadow-sm text-[var(--color-text)]"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-[20px] font-bold text-[var(--color-text)]">{t.profile}</h1>
                <div className="w-12" />
            </header>

            <div className="px-6 space-y-4">
                {/* User Card */}
                <div className="bg-[var(--color-surface)] rounded-[32px] p-6 shadow-sm border border-[var(--color-border)] flex flex-col items-center">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-[2.5px] border-[var(--color-primary)] p-1 overflow-hidden bg-[var(--color-surface2)]">
                            {user?.photo_url ? (
                                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad" alt="Ahmad" className="w-full h-full object-cover rounded-full" />
                            )}
                        </div>
                        <div className="absolute bottom-1 right-1 w-6 h-6 bg-[var(--color-primary)] border-2 border-[var(--color-surface)] rounded-full flex items-center justify-center text-[var(--color-primary-contrast)]">
                            <Check size={14} strokeWidth={4} />
                        </div>
                    </div>
                    <h2 className="mt-4 text-[22px] font-bold text-[var(--color-text)] text-center leading-tight">{profileName}</h2>
                    <p className="text-[14px] text-[var(--color-hint)] font-medium">{t.user}</p>

                    <div className="mt-6 flex flex-wrap justify-center gap-3 w-full">
                        <div className="px-5 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[14px] font-medium text-[var(--color-text)] shadow-sm">
                            +998-xxx-xx-xx
                        </div>
                        <div className="px-5 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[14px] font-medium text-[var(--color-text)] shadow-sm">
                            {username}
                        </div>
                    </div>
                </div>

                {/* Menu List */}
                <div className="space-y-3">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center justify-between p-5 bg-[var(--color-surface)] rounded-[24px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn("w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]")}>
                                    <item.icon size={22} />
                                </div>
                                <div>
                                    <p className="text-[16px] font-bold text-[var(--color-text)] leading-tight">{item.label}</p>
                                    <p className="text-[12px] text-[var(--color-hint)] font-medium">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-[var(--color-hint)] opacity-30" />
                        </Link>
                    ))}
                </div>

                {/* Store Section Card */}
                <div className="bg-[var(--color-surface)] rounded-[32px] p-8 shadow-sm border border-[var(--color-border)]">
                    <h3 className="text-[18px] font-bold text-[var(--color-text)]">{t.is_store_owner}</h3>
                    <p className="mt-2 text-[14px] text-[var(--color-hint)] font-medium leading-relaxed">
                        {t.list_products_manage_stock}<br />
                        <span className="text-[12px] opacity-70">{t.activation_after_approval}</span>
                    </p>

                    <div className="mt-8 flex gap-3">
                        <Link
                            href={APP_ROUTES.STORE_APPLY}
                            className="flex-1 h-14 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-full text-[15px] font-bold shadow-[0_4px_12px_rgba(26,229,80,0.25)] active:scale-95 transition-all"
                        >
                            <Store size={18} className="mr-2" />
                            {t.add_store}
                        </Link>
                        <Link
                            href={APP_ROUTES.STORE_STATUS}
                            className="flex-1 h-14 flex items-center justify-center bg-[var(--color-surface)] border-[1.5px] border-[var(--color-border)] text-[var(--color-text)] rounded-full text-[15px] font-bold active:scale-95 transition-all shadow-sm"
                        >
                            <Settings size={18} className="mr-2" />
                            {t.seller_panel}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
