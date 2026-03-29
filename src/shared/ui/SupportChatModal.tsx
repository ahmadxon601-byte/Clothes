'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MessageCircleMore, Pencil, Plus, Send, Smile, UserRound } from 'lucide-react';
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

const STICKERS = ['😀', '😂', '😍', '🔥', '👍', '👏', '🎉', '❤️', '😎', '🤝', '🙏', '💚'];

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('marketplace_token');
}

function formatMessageTime(value: string, locale: string) {
    return new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function isImageMessage(value: string) {
    const trimmed = value.trim();
    return trimmed.startsWith('data:image/')
        || trimmed.startsWith('/uploads/')
        || /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(trimmed);
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
    const { language, w } = useWebI18n();
    const { showToast } = useToast();
    const [data, setData] = useState<SupportPayload>({ conversation: null, messages: [] });
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [draft, setDraft] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [stickersOpen, setStickersOpen] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const copy = useMemo(() => w.supportChat, [w.supportChat]);

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

    const sendMessage = async (rawMessage?: string) => {
        const message = (rawMessage ?? draft).trim();
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
                method: editingMessageId ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editingMessageId ? { id: editingMessageId, message } : { message }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error ?? copy.sendError);
            if (!rawMessage) setDraft('');
            setEditingMessageId(null);
            setStickersOpen(false);
            await loadConversation();
        } catch (error) {
            showToast({ message: error instanceof Error ? error.message : copy.sendError, type: 'error' });
        } finally {
            setSending(false);
        }
    };

    const uploadFile = async (file: File) => {
        const token = getToken();
        if (!token) {
            onRequireAuth();
            return;
        }

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            const body = await res.json().catch(() => ({}));
            const url = body?.data?.url ?? body?.url;
            if (!res.ok || !url) throw new Error(body?.error ?? body?.message ?? copy.uploadError);
            await sendMessage(String(url));
        } catch (error) {
            showToast({ message: error instanceof Error ? error.message : copy.uploadError, type: 'error' });
        } finally {
            setUploadingFile(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Modal isOpen={open} onClose={onClose} title={copy.title}>
            {!user ? (
                <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className="border-b border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                        <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                            <MessageCircleMore className="size-5" />
                        </div>
                        <p className="text-base font-bold text-[var(--color-text)]">{copy.title}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">{copy.subtitle}</p>
                    </div>
                    <div className="bg-[var(--color-bg)] p-5 text-center">
                        <p className="mb-4 text-sm font-semibold text-[var(--color-text)]">{copy.loginTitle}</p>
                        <Button className="w-full" onClick={onRequireAuth}>
                            {copy.loginAction}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex h-[min(72vh,680px)] flex-col overflow-hidden rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                            <UserRound className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--color-text)]">{copy.title}</p>
                            <p className="truncate text-xs text-[var(--color-muted)]">{copy.subtitle}</p>
                        </div>
                    </div>

                    <div ref={scrollRef} className="soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--color-bg)] px-4 py-4">
                        {loading ? (
                            <div className="flex h-40 items-center justify-center">
                                <Loader2 className="size-5 animate-spin text-[var(--color-primary)]" />
                            </div>
                        ) : data.messages.length === 0 ? (
                            <div className="flex h-full min-h-[240px] items-center justify-center">
                                <div className="max-w-[280px] text-center">
                                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                                        <MessageCircleMore className="size-7" />
                                    </div>
                                    <p className="text-sm font-semibold text-[var(--color-text)]">{copy.title}</p>
                                    <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy.empty}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.messages.map((message) => {
                                    const mine = message.sender_role === 'user';
                                    return (
                                        <div key={message.id} className={`flex w-full ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`relative max-w-[78%] rounded-[18px] px-3 py-2 ${
                                                    mine
                                                        ? 'rounded-br-[6px] bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                                                        : 'rounded-bl-[6px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                                }`}
                                            >
                                                <div className="flex items-end gap-2">
                                                    <div className="min-w-0 flex-1">
                                                        {isImageMessage(message.body) ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img src={message.body} alt="attachment" className="max-h-64 rounded-[14px] object-contain" />
                                                        ) : (
                                                            <p className="whitespace-pre-wrap break-words text-[13px] leading-5">{message.body}</p>
                                                        )}
                                                    </div>
                                                    <span className={`shrink-0 text-[10px] ${mine ? 'text-[var(--color-primary-contrast)]/70' : 'text-[var(--color-muted)]'}`}>
                                                        {formatMessageTime(message.created_at, language)}
                                                    </span>
                                                </div>
                                                {mine && !sending ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDraft(message.body);
                                                            setEditingMessageId(message.id);
                                                            setStickersOpen(false);
                                                        }}
                                                        aria-label={copy.edit}
                                                        className="absolute -left-6 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text)]/55 transition hover:text-[var(--color-text)] focus:text-[var(--color-text)]"
                                                    >
                                                        <Pencil className="size-3" />
                                                    </button>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 bg-[var(--color-bg)] px-4 pb-4 pt-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void uploadFile(file);
                            }}
                        />
                        {stickersOpen ? (
                            <div className="mb-3 grid grid-cols-6 gap-2 rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                                {STICKERS.map((sticker) => (
                                    <button
                                        key={sticker}
                                        type="button"
                                        onClick={() => {
                                            setDraft((prev) => `${prev}${sticker}`);
                                            setStickersOpen(false);
                                        }}
                                        className="flex h-10 items-center justify-center rounded-xl text-xl transition hover:bg-[var(--color-surface2)]"
                                    >
                                        {sticker}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        {editingMessageId ? (
                            <div className="mb-3 flex items-center justify-between rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-muted)]">
                                <span>{copy.edit}</span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingMessageId(null);
                                        setDraft('');
                                    }}
                                    className="font-semibold text-[var(--color-text)]"
                                >
                                    {copy.cancelEdit}
                                </button>
                            </div>
                        ) : null}
                        <div className="flex items-center gap-3 rounded-full border border-[var(--color-border)] bg-[color:color-mix(in_oklab,var(--color-surface2)_92%,var(--color-surface))] px-4 py-2.5">
                            <button
                                type="button"
                                className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)]"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingFile}
                            >
                                {uploadingFile ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={copy.placeholder}
                                rows={1}
                                className="min-h-[24px] flex-1 resize-none overflow-hidden bg-transparent py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-muted)]"
                            />
                            <button
                                type="button"
                                className="flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--color-muted)]"
                                onClick={() => setStickersOpen((prev) => !prev)}
                            >
                                <Smile className="size-5" />
                            </button>
                            <Button
                                className="h-11 w-11 shrink-0 rounded-full px-0 shadow-none"
                                onClick={() => void sendMessage()}
                                isLoading={sending}
                                aria-label={editingMessageId ? copy.save : copy.placeholder}
                            >
                                <Send className="size-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}
