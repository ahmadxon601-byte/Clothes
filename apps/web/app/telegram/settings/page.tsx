'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Check, Trash2, Moon, Sun, Smartphone, Globe } from 'lucide-react';
import { useSettingsStore } from '../../../src/features/settings/model';
import { mockApi } from '../../../src/services/mockServer';
import { useToast } from '../../../src/shared/ui/useToast';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { cn } from '../../../src/shared/lib/utils';

const THEME_OPTIONS = [
    { value: 'light' as const, icon: Sun, labelKey: 'light' as const },
    { value: 'dark' as const, icon: Moon, labelKey: 'dark' as const },
    { value: 'auto' as const, icon: Smartphone, labelKey: 'system' as const },
];

const LANG_OPTIONS = [
    { value: 'uz' as const, label: "O'zbek", flag: '🇺🇿' },
    { value: 'ru' as const, label: 'Русский', flag: '🇷🇺' },
    { value: 'en' as const, label: 'English', flag: '🇬🇧' },
];

export default function TelegramSettingsPage() {
    const { settings, updateSettings } = useSettingsStore();
    const { showToast } = useToast();
    const { t } = useTranslation();
    const router = useRouter();
    const [clearing, setClearing] = useState(false);

    const handleClear = async () => {
        setClearing(true);
        try {
            mockApi.resetAllData();
            showToast({ message: t.reset_success, type: 'success' });
            setTimeout(() => window.location.reload(), 1500);
        } catch {
            showToast({ message: t.error_occurred, type: 'error' });
            setClearing(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-[var(--color-bg)] max-w-[500px] mx-auto">

            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-3 px-3 py-3 bg-[var(--color-bg)]/90 backdrop-blur-md border-b border-[var(--color-border)]">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 flex items-center justify-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] active:scale-95 transition-all"
                >
                    <ChevronLeft size={18} />
                </button>
                <h1 className="text-[16px] font-bold text-[var(--color-text)]">{t.settings}</h1>
            </div>

            <div className="flex flex-col gap-4 p-3 pt-4">

                {/* Theme section */}
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1">
                        {t.appearance}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                        {THEME_OPTIONS.map(({ value, icon: Icon, labelKey }) => {
                            const isActive = settings.themeMode === value;
                            return (
                                <button
                                    key={value}
                                    onClick={() => updateSettings({ themeMode: value })}
                                    className={cn(
                                        'flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95',
                                        isActive
                                            ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)]'
                                            : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-hint)]'
                                    )}
                                >
                                    <Icon size={22} />
                                    <span className={cn('text-[11px] font-bold', isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]')}>
                                        {t[labelKey]}
                                    </span>
                                    {isActive && (
                                        <div className="absolute top-2 right-2" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Language section */}
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1">
                        {t.language}
                    </p>
                    <div className="flex flex-col bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden">
                        {LANG_OPTIONS.map(({ value, label, flag }, i) => {
                            const isActive = settings.language === value;
                            return (
                                <button
                                    key={value}
                                    onClick={() => updateSettings({ language: value })}
                                    className={cn(
                                        'flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[var(--color-surface2)] text-left',
                                        i !== LANG_OPTIONS.length - 1 ? 'border-b border-[var(--color-border)]' : ''
                                    )}
                                >
                                    <span className="text-[20px] leading-none">{flag}</span>
                                    <span className={cn(
                                        'flex-1 text-[14px] font-semibold',
                                        isActive ? 'text-[var(--color-text)]' : 'text-[var(--color-hint)]'
                                    )}>
                                        {label}
                                    </span>
                                    {isActive && <Check size={17} className="text-[var(--color-primary)]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Data section */}
                <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[var(--color-hint)] mb-2 ml-1">
                        {t.data}
                    </p>
                    <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-4">
                        <p className="text-[12px] text-[var(--color-hint)] leading-relaxed mb-4">
                            {t.reset_description}
                        </p>
                        <button
                            onClick={handleClear}
                            disabled={clearing}
                            className="w-full h-11 flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 text-[var(--color-danger)] text-[13px] font-bold active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {clearing ? (
                                <div className="w-4 h-4 border-2 border-[var(--color-danger)]/30 border-t-[var(--color-danger)] rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                            {t.clear_data}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
