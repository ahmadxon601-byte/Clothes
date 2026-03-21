'use client';
import { useToastStore } from './useToast';
import { cn } from '../lib/utils';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export function ToastProvider() {
    const toast = useToastStore(s => s.toast);

    if (!toast) return null;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-[400px]">
            <div
                className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-4",
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                        toast.type === 'info' ? 'bg-blue-500 text-white' :
                            'bg-[var(--color-tg-bg)] text-[var(--color-tg-text)] border border-[var(--color-tg-hint)]/20'
                )}
            >
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Info className="w-5 h-5" />}
                <p className="text-sm font-medium">{toast.message}</p>
            </div>
        </div>
    );
}
