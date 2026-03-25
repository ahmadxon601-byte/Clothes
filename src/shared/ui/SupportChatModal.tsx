'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircleMore, Plus, Send, Smile, UserRound } from 'lucide-react';
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

function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const copy = useMemo(() => {
        if (language === 'ru') {
            return {
                title: 'Поддержка',
                subtitle: 'Чат с администратором магазина',
                empty: 'Напишите в поддержку, и ответ появится здесь.',
                placeholder: 'Напишите сообщение...',
                send: 'Отправить',
                loginTitle: 'Войдите, чтобы открыть чат поддержки',
                loginAction: 'Войти',
                admin: 'Support',
                you: 'Вы',
                loadError: 'Не удалось загрузить чат поддержки',
                sendError: 'Не удалось отправить сообщение',
            };
        }
        if (language === 'en') {
            return {
                title: 'Support',
                subtitle: 'Chat with store admin support',
                empty: 'Write to support and the reply will appear here.',
                placeholder: 'Type your message...',
                send: 'Send',
                loginTitle: 'Sign in to open support chat',
                loginAction: 'Sign in',
                admin: 'Support',
                you: 'You',
                loadError: 'Failed to load support chat',
                sendError: 'Failed to send message',
            };
        }
        return {
            title: 'Yordam markazi',
            subtitle: 'Admin bilan to‘g‘ridan to‘g‘ri chat',
            empty: 'Savolingizni yozing, javob shu yerda chiqadi.',
            placeholder: 'Xabaringizni yozing...',
            send: 'Yuborish',
            loginTitle: 'Support chatni ochish uchun tizimga kiring',
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

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = '0px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, [draft]);

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
                <div className='overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]'>
                    <div className='border-b border-[var(--color-border)] bg-[var(--color-surface)] p-5'>
                        <div className='mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]'>
                            <MessageCircleMore className='size-5' />
                        </div>
                        <p className='text-base font-bold text-[var(--color-text)]'>{copy.title}</p>
                        <p className='mt-1 text-sm leading-6 text-[var(--color-muted)]'>{copy.subtitle}</p>
                    </div>
                    <div className='bg-[var(--color-bg)] p-5 text-center'>
                        <p className='mb-4 text-sm font-semibold text-[var(--color-text)]'>{copy.loginTitle}</p>
                        <Button className='w-full' onClick={onRequireAuth}>
                            {copy.loginAction}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className='flex h-[min(72vh,680px)] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]'>
                    <div className='flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3'>
                        <div className='flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]'>
                            <UserRound className='size-5' />
                        </div>
                        <div className='min-w-0'>
                            <p className='truncate text-sm font-semibold text-[var(--color-text)]'>{copy.title}</p>
                            <p className='truncate text-xs text-[var(--color-muted)]'>{copy.subtitle}</p>
                        </div>
                    </div>

                    <div ref={scrollRef} className='soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--color-bg)] px-4 py-4'>
                        {loading ? (
                            <div className='flex h-40 items-center justify-center'>
                                <Loader2 className='size-5 animate-spin text-[var(--color-primary)]' />
                            </div>
                        ) : data.messages.length === 0 ? (
                            <div className='flex h-full min-h-[240px] items-center justify-center'>
                                <div className='max-w-[280px] text-center'>
                                    <div className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]'>
                                        <MessageCircleMore className='size-7' />
                                    </div>
                                    <p className='text-sm font-semibold text-[var(--color-text)]'>{copy.title}</p>
                                    <p className='mt-2 text-sm leading-6 text-[var(--color-muted)]'>{copy.empty}</p>
                                </div>
                            </div>
                        ) : (
                            <div className='space-y-3'>
                                {data.messages.map((message) => {
                                    const mine = message.sender_role === 'user';
                                    return (
                                        <div key={message.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`max-w-[78%] rounded-[18px] px-3 py-2 text-sm ${
                                                    mine
                                                        ? 'rounded-br-[6px] bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                                                        : 'rounded-bl-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                                }`}
                                            >
                                                <div className='flex items-end gap-2'>
                                                    <p className='min-w-0 flex-1 whitespace-pre-wrap break-words text-[13px] leading-5'>{message.body}</p>
                                                    <span className={`shrink-0 text-[10px] ${mine ? 'text-[var(--color-primary-contrast)]/70' : 'text-[var(--color-muted)]'}`}>
                                                        {formatMessageTime(message.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className='shrink-0 bg-[var(--color-bg)] px-4 pb-4 pt-3'>
                        <div className='flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface2)_92%,var(--color-surface))] px-4 py-2.5'>
                            <button
                                type='button'
                                className='flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)]'
                            >
                                <Plus className='size-5' />
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={copy.placeholder}
                                rows={1}
                                className='min-h-[24px] flex-1 resize-none overflow-hidden bg-transparent py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]'
                            />
                            <button
                                type='button'
                                className='flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)]'
                            >
                                <Smile className='size-5' />
                            </button>
                            <Button
                                className='h-11 w-11 shrink-0 rounded-full px-0 shadow-none'
                                onClick={sendMessage}
                                isLoading={sending}
                            >
                                <Send className='size-4' />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
