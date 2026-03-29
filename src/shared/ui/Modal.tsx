'use client';
import { useEffect } from 'react';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />
            <div className="relative z-10 w-full sm:w-[90%] sm:max-w-md bg-[var(--color-tg-bg)] sm:rounded-2xl rounded-t-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
                <div className="flex items-center justify-between p-4 border-b border-[var(--color-tg-hint)]/10">
                    <h2 className="text-lg font-semibold text-[var(--color-tg-text)]">{title}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full bg-[var(--color-tg-secondary-bg)] text-[var(--color-tg-hint)]">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4 overflow-y-auto overscroll-contain">
                    {children}
                </div>
            </div>
        </div>
    );
}
