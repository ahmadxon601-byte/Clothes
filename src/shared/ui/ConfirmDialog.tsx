'use client';
import { useEffect } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface Props {
    open: boolean;
    title?: string;
    message?: string;
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
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-4" onClick={onCancel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-sm rounded-[28px] border border-[var(--color-border,#e5e7eb)] bg-[var(--color-surface,#fff)] p-6 shadow-[0_24px_70px_-28px_rgba(0,0,0,0.55)]"
                onClick={e => e.stopPropagation()}
            >
                <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${danger ? 'bg-red-500/12' : 'bg-[var(--color-primary)]/12'}`}>
                    {danger ? <Trash2 size={22} className="text-red-500" /> : <AlertTriangle size={22} className="text-[var(--color-primary)]" />}
                </div>
                {title ? <h3 className="mb-1 text-center text-[20px] font-black text-[var(--color-text,#111)]">{title}</h3> : null}
                {message ? (
                    <p className="text-center text-[13px] leading-relaxed text-[var(--color-hint,#6b7280)]">{message}</p>
                ) : null}
                <div className="mt-5 flex gap-3">
                    <button
                        onClick={onCancel}
                        className="h-11 flex-1 rounded-full border border-[var(--color-border,#e5e7eb)] text-[13px] font-bold text-[var(--color-text,#111)] transition-all active:scale-95"
                    >
                        Bekor qilish
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`h-11 flex-1 rounded-full text-[13px] font-bold text-white transition-all active:scale-95 ${danger ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--color-primary)] hover:brightness-110'}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
