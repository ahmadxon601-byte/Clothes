'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Bookmark, MessageCircleQuestion, Settings, Check, Store } from 'lucide-react';
import { useTelegram } from '../../../src/telegram/useTelegram';
import { mockApi } from '../../../src/services/mockServer';
import { useAppRoutes } from '../../../src/shared/config/useAppRoutes';
import { cn } from '../../../src/shared/lib/utils';
import { useTranslation } from '../../../src/shared/lib/i18n';

export default function TelegramProfilePage() {
    const { user } = useTelegram();
    const { t } = useTranslation();
    const routes = useAppRoutes();

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
    const username = user?.username ? `@${user.username}` : (user?.id ? `ID: ${user.id}` : 'Telegram user');
    const phone = (() => {
        if (typeof window === 'undefined') return '+998-xxx-xx-xx';
        const keys = ['tg_phone', 'clothes_phone', 'user_phone', 'phone'];
        for (const key of keys) {
            const value = localStorage.getItem(key);
            if (value && value.trim()) return value.trim();
        }
        return user ? 'Telefon yuborilmagan' : '+998-xxx-xx-xx';
    })();

    const menuItems = [
        { label: t.favorites, sub: t.saved_products, icon: Bookmark, href: routes.FAVORITES, iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
        { label: t.help_faq, sub: t.answers_to_questions, icon: MessageCircleQuestion, href: '#', iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
        { label: t.settings, sub: t.language_theme_security, icon: Settings, href: routes.SETTINGS, iconBg: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]' },
    ];

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)]">
            <div className="px-6 space-y-4">
                <div className="bg-[var(--color-surface)] rounded-[28px] p-5 shadow-sm border border-[var(--color-border)] flex flex-col items-center">
                    <div className="relative">
                        <div className="w-20 h-20 rounded-full border-[2px] border-[var(--color-primary)] p-0.5 overflow-hidden bg-[var(--color-surface2)]">
                            {user?.photo_url ? (
                                <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmad" alt="Ahmad" className="w-full h-full object-cover rounded-full" />
                            )}
                        </div>
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-[var(--color-primary)] border-2 border-[var(--color-surface)] rounded-full flex items-center justify-center text-[var(--color-primary-contrast)]">
                            <Check size={12} strokeWidth={4} />
                        </div>
                    </div>
                    <h2 className="mt-3 text-[19px] font-bold text-[var(--color-text)] text-center leading-tight">{profileName}</h2>
                    <p className="text-[13px] text-[var(--color-hint)] font-medium">{t.user}</p>

                    <div className="mt-5 flex flex-wrap justify-center gap-2 w-full">
                        <div className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[13px] font-medium text-[var(--color-text)] shadow-sm">
                            {phone}
                        </div>
                        <div className="px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full text-[13px] font-medium text-[var(--color-text)] shadow-sm">
                            {username}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center justify-between px-4 py-3.5 bg-[var(--color-surface)] rounded-[20px] shadow-sm border border-[var(--color-border)] active:scale-[0.98] transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className={cn("w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]")}>
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[var(--color-text)] leading-tight">{item.label}</p>
                                    <p className="text-[11px] text-[var(--color-hint)] font-medium">{item.sub}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-[var(--color-hint)] opacity-30" />
                        </Link>
                    ))}
                </div>

                <div className="bg-[var(--color-surface)] rounded-[28px] p-6 shadow-sm border border-[var(--color-border)]">
                    <h3 className="text-[17px] font-bold text-[var(--color-text)]">{t.is_store_owner}</h3>
                    <p className="mt-1.5 text-[13px] text-[var(--color-hint)] font-medium leading-relaxed">
                        {t.list_products_manage_stock}<br />
                        <span className="text-[11px] opacity-70">{t.activation_after_approval}</span>
                    </p>

                    <div className="mt-6 flex gap-2.5">
                        <Link
                            href={routes.STORE_APPLY}
                            className="flex-1 h-12 flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-contrast)] rounded-full text-[14px] font-bold shadow-[0_4px_12px_rgba(26,229,80,0.25)] active:scale-95 transition-all"
                        >
                            <Store size={16} className="mr-2" />
                            {t.add_store}
                        </Link>
                        <Link
                            href={routes.STORE_STATUS}
                            className="flex-1 h-12 flex items-center justify-center bg-[var(--color-surface)] border-[1.5px] border-[var(--color-border)] text-[var(--color-text)] rounded-full text-[14px] font-bold active:scale-95 transition-all shadow-sm"
                        >
                            <Settings size={16} className="mr-2" />
                            {t.seller_panel}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
