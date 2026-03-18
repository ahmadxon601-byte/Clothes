'use client';
import { useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    danger?: boolean;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "O'chirish", onConfirm, onCancel, danger = true }: Props) {
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[1500] flex items-end sm:items-center justify-center px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-sm rounded-[24px] bg-[var(--color-surface,#fff)] dark:bg-[#1a1a1a] p-6 shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                    {danger ? <Trash2 size={22} className="text-red-500" /> : <AlertTriangle size={22} className="text-amber-500" />}
                </div>
                {title && <h3 className="text-[17px] font-bold text-center text-[var(--color-text,#111)] dark:text-white mb-1">{title}</h3>}
                <p className="text-[13px] text-center text-[var(--color-hint,#6b7280)] leading-relaxed">{message}</p>
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-11 rounded-full border border-[var(--color-border,#e5e7eb)] dark:border-white/10 text-[13px] font-bold text-[var(--color-text,#111)] dark:text-white active:scale-95 transition-all"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`flex-1 h-11 rounded-full text-[13px] font-bold text-white active:scale-95 transition-all ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
