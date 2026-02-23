'use client';
import { useState } from 'react';
import { useSettingsStore } from '../../../src/features/settings/model';
import { mockApi } from '../../../src/services/mockServer';
import { Button } from '../../../src/shared/ui/Button';
import { useToast } from '../../../src/shared/ui/useToast';
import { Trash2, Check, ChevronLeft } from 'lucide-react';
import { useTranslation } from '../../../src/shared/lib/i18n';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { settings, updateSettings } = useSettingsStore();
    const { showToast } = useToast();
    const [clearing, setClearing] = useState(false);
    const { t } = useTranslation();
    const router = useRouter();

    const handleClear = async () => {
        setClearing(true);
        try {
            mockApi.resetAllData();
            showToast({ message: t.reset_success, type: 'success' });
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (e) {
            showToast({ message: t.error_occurred, type: 'error' });
            setClearing(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full">
            <div className="sticky top-0 z-10 bg-[var(--color-bg)] px-4 py-4 border-b border-[var(--color-border)] flex items-center gap-3">
                <button onClick={() => router.back()} className="text-[var(--color-text)]">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-[var(--color-text)]">{t.settings}</h1>
            </div>

            <div className="p-4 space-y-6">
                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-hint)] uppercase tracking-wider mb-3 ml-2">{t.appearance}</h3>
                    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm border border-[var(--color-border)]">
                        {(['auto', 'light', 'dark'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => updateSettings({ themeMode: mode })}
                                className="w-full flex items-center justify-between p-4 active:bg-[var(--color-surface2)] border-b border-[var(--color-border)] last:border-0 transition-colors text-left"
                            >
                                <span className="capitalize text-[var(--color-text)]">
                                    {mode === 'dark' ? t.dark : mode === 'light' ? t.light : t.system} {t.theme}
                                </span>
                                {settings.themeMode === mode && <Check size={20} className="text-[var(--color-primary)]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-hint)] uppercase tracking-wider mb-3 ml-2">{t.language}</h3>
                    <div className="bg-[var(--color-surface)] rounded-2xl overflow-hidden shadow-sm border border-[var(--color-border)]">
                        {(['uz', 'en', 'ru'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => updateSettings({ language: lang })}
                                className="w-full flex items-center justify-between p-4 active:bg-[var(--color-surface2)] border-b border-[var(--color-border)] last:border-0 transition-colors"
                            >
                                <span className="uppercase text-[var(--color-text)]">{lang === 'uz' ? 'O\'zbek' : lang === 'ru' ? 'Русский' : 'English'}</span>
                                {settings.language === lang && <Check size={20} className="text-[var(--color-primary)]" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-semibold text-[var(--color-hint)] uppercase tracking-wider mb-3 ml-2">{t.data}</h3>
                    <div className="bg-[var(--color-surface)] rounded-2xl p-4 shadow-sm border border-[var(--color-border)]">
                        <p className="text-sm text-[var(--color-hint)] mb-4 leading-relaxed font-medium">
                            {t.reset_description}
                        </p>
                        <Button
                            variant="outline"
                            className="w-full text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/10"
                            onClick={handleClear}
                            isLoading={clearing}
                        >
                            <Trash2 size={18} className="mr-2" />
                            {t.clear_data}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
