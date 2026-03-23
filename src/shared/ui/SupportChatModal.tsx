'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Headset, Loader2, MessageCircleMore, Send, ShieldCheck } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useWebAuth } from '../../context/WebAuthContext';
import { useToast } from './useToast';
import { useSSERefetch } from '../hooks/useSSERefetch';
import { useWebI18n } from '../lib/webI18n';

type SupportMessage = {
    id: string;
    conversation_id: string;
    sender_role: 'user' | 'admin';
    sender_user_id: string | null;
    body: string;
    is_read: boolean;
    created_at: string;
};

type SupportPayload = {
    conversation: { id: string; status: string } | null;
    messages: SupportMessage[];
};

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

export function SupportChatModal({
    open,
    onClose,
    onRequireAuth,
}: {
    open: boolean;
    onClose: () => void;
    onRequireAuth: () => void;
}) {
    const { user } = useWebAuth();
    const { language } = useWebI18n();
    const { showToast } = useToast();
    const [data, setData] = useState<SupportPayload>({ conversation: null, messages: [] });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const copy = useMemo(() => {
        if (language === 'ru') {
            return {
                title: 'Поддержка',
                subtitle: 'Ответим по заказам, возвратам и работе магазина.',
                empty: 'Напишите в поддержку, и администратор ответит в этом чате.',
                placeholder: 'Напишите сообщение...',
                send: 'Отправить',
                loginTitle: 'Войдите, чтобы написать в поддержку',
                loginAction: 'Войти',
                admin: 'Поддержка',
                you: 'Вы',
                loadError: 'Не удалось загрузить чат поддержки',
                sendError: 'Не удалось отправить сообщение',
            };
        }
        if (language === 'en') {
            return {
                title: 'Support',
                subtitle: 'Get help with orders, returns, and store issues.',
                empty: 'Write to support and an admin will reply here.',
                placeholder: 'Type your message...',
                send: 'Send',
                loginTitle: 'Sign in to chat with support',
                loginAction: 'Sign in',
                admin: 'Support',
                you: 'You',
                loadError: 'Failed to load support chat',
                sendError: 'Failed to send message',
            };
        }
        return {
            title: 'Yordam markazi',
            subtitle: 'Buyurtma, qaytarish va do‘kon bo‘yicha savollarga shu yerda javob olasiz.',
            empty: 'Savolingizni yozing, admin shu chat ichida javob beradi.',
            placeholder: 'Xabaringizni yozing...',
            send: 'Yuborish',
            loginTitle: 'Support chat uchun tizimga kiring',
            loginAction: 'Kirish',
            admin: 'Support',
            you: 'Siz',
            loadError: 'Support chatni yuklab bo‘lmadi',
            sendError: 'Xabarni yuborib bo‘lmadi',
        };
    }, [language]);

    const loadConversation = useCallback(async () => {
        if (!user || !open) return;
        const token = getToken();
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch('/api/support', {
                headers: { Authorization: `Bearer ${token}` },
                cache: 'no-store',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error ?? copy.loadError);
            setData((body?.data ?? body) as SupportPayload);
        } catch (error) {
            showToast({ message: error instanceof Error ? error.message : copy.loadError, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [copy.loadError, open, showToast, user]);

    useEffect(() => {
        if (open && user) {
            void loadConversation();
        }
    }, [loadConversation, open, user]);

    useSSERefetch(['support'], () => {
        if (open && user) void loadConversation();
    });

    useEffect(() => {
        if (!open) return;
        const node = scrollRef.current;
        if (!node) return;
        node.scrollTop = node.scrollHeight;
    }, [data.messages, open]);

    const sendMessage = async () => {
        const message = draft.trim();
        if (!message || sending) return;
        if (!user) {
            onRequireAuth();
            return;
        }

        const token = getToken();
        if (!token) {
            onRequireAuth();
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/support', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ message }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error ?? copy.sendError);
            setDraft('');
            await loadConversation();
        } catch (error) {
            showToast({ message: error instanceof Error ? error.message : copy.sendError, type: 'error' });
        } finally {
            setSending(false);
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={copy.title}>
            {!user ? (
                <div className='space-y-4'>
                    <div className='overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface),var(--color-bg))]'>
                        <div className='border-b border-[var(--color-border)]/60 p-5'>
                            <div className='mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]'>
                                <Headset className='size-5' />
                            </div>
                            <p className='text-base font-bold text-[var(--color-text)]'>{copy.title}</p>
                            <p className='mt-1 text-sm leading-6 text-[var(--color-hint)]'>{copy.subtitle}</p>
                        </div>
                        <div className='p-5 text-center'>
                            <MessageCircleMore className='mx-auto mb-3 size-8 text-[var(--color-primary)]' />
                            <p className='text-sm font-semibold text-[var(--color-text)]'>{copy.loginTitle}</p>
                        </div>
                    </div>
                    <Button className='w-full' onClick={onRequireAuth}>
                        {copy.loginAction}
                    </Button>
                </div>
            ) : (
                <div className='space-y-4'>
                    <div className='overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,var(--color-surface),var(--color-bg))]'>
                        <div className='flex items-start justify-between gap-3 p-5'>
                            <div className='min-w-0'>
                                <div className='mb-2 flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]'>
                                    <Headset className='size-5' />
                                </div>
                                <p className='text-base font-bold text-[var(--color-text)]'>{copy.title}</p>
                                <p className='mt-1 text-sm leading-6 text-[var(--color-hint)]'>{copy.subtitle}</p>
                            </div>
                            <div className='shrink-0 rounded-full bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-600'>
                                Online
                            </div>
                        </div>
                        <div className='grid gap-2 border-t border-[var(--color-border)]/60 px-5 py-4 sm:grid-cols-2'>
                            <div className='rounded-2xl bg-[var(--color-bg)] px-4 py-3'>
                                <p className='text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--color-hint)]'>Support</p>
                                <p className='mt-1 text-sm font-medium text-[var(--color-text)]'>Jonli yordam</p>
                            </div>
                            <div className='rounded-2xl bg-[var(--color-bg)] px-4 py-3'>
                                <div className='flex items-center gap-2'>
                                    <ShieldCheck className='size-4 text-emerald-500' />
                                    <p className='text-sm font-medium text-[var(--color-text)]'>Admin bilan to‘g‘ridan-to‘g‘ri chat</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        className='max-h-[46vh] min-h-[280px] space-y-3 overflow-y-auto rounded-[28px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4'
                    >
                        {loading ? (
                            <div className='flex h-40 items-center justify-center'>
                                <Loader2 className='size-5 animate-spin text-[var(--color-primary)]' />
                            </div>
                        ) : data.messages.length === 0 ? (
                            <div className='flex h-full min-h-[240px] items-center justify-center'>
                                <div className='max-w-[280px] text-center'>
                                    <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]'>
                                        <MessageCircleMore className='size-7' />
                                    </div>
                                    <p className='text-sm font-semibold text-[var(--color-text)]'>{copy.title}</p>
                                    <p className='mt-2 text-sm leading-6 text-[var(--color-hint)]'>{copy.empty}</p>
                                </div>
                            </div>
                        ) : (
                            data.messages.map((message) => {
                                const mine = message.sender_role === 'user';
                                return (
                                    <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm shadow-sm ${
                                                mine
                                                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                                                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                            }`}
                                        >
                                            <p className='mb-1 text-[11px] font-semibold opacity-80'>
                                                {mine ? copy.you : copy.admin}
                                            </p>
                                            <p className='whitespace-pre-wrap break-words'>{message.body}</p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className='rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3'>
                        <div className='flex items-end gap-3'>
                            <textarea
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={copy.placeholder}
                                rows={2}
                                className='min-h-[64px] flex-1 resize-none rounded-[22px] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-text)] outline-none'
                            />
                            <Button className='h-12 shrink-0 px-5' onClick={sendMessage} isLoading={sending}>
                                <Send className='mr-2 size-4' />
                                {copy.send}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
