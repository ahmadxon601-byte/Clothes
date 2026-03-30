'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, MessageCircleMore, Pencil, Plus, Send, Smile, UserRound } from 'lucide-react';
import { getApiToken, setApiToken, telegramWebAppAuth } from '../../../../src/lib/apiClient';
import { useToast } from '../../../../src/shared/ui/useToast';
import { useSSERefetch } from '../../../../src/shared/hooks/useSSERefetch';
import { useWebI18n } from '../../../../src/shared/lib/webI18n';
import { useTelegram } from '../../../../src/telegram/useTelegram';
import { clearTelegramLoggedOut, isTelegramLoggedOutByUser } from '../../../../src/lib/telegramAuthState';

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

const STICKERS = ['🙂', '🔥', '👍', '🙏', '💚', '🎉'];

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

export default function TelegramSupportPage() {
    const router = useRouter();
    const { language, w } = useWebI18n();
    const { showToast } = useToast();
    const { WebApp, isReady } = useTelegram();
    const copy = useMemo(() => w.supportChat, [w.supportChat]);
    const [data, setData] = useState<SupportPayload>({ conversation: null, messages: [] });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [draft, setDraft] = useState('');
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [stickersOpen, setStickersOpen] = useState(false);
    const [token, setToken] = useState<string | null>(() => getApiToken());
    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const ensureTelegramAuth = useCallback(async () => {
        const initData = WebApp?.initData;
        if (!initData || isTelegramLoggedOutByUser()) {
            return getApiToken();
        }

        try {
            const nextToken = await telegramWebAppAuth(initData);
            clearTelegramLoggedOut();
            setApiToken(nextToken);
            setToken(nextToken);
            return nextToken;
        } catch {
            return getApiToken();
        }
    }, [WebApp?.initData]);

    const loadConversation = useCallback(async () => {
        const authToken = token ?? await ensureTelegramAuth();
        if (!authToken) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/support', {
                headers: { Authorization: `Bearer ${authToken}` },
                cache: 'no-store',
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error ?? copy.loadError);
            setData((body?.data ?? body) as SupportPayload);
            setToken(authToken);
        } catch (error) {
            showToast({ message: error instanceof Error ? error.message : copy.loadError, type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [copy.loadError, ensureTelegramAuth, showToast, token]);

    useEffect(() => {
        if (!isReady) return;
        void loadConversation();
    }, [isReady, loadConversation]);

    useSSERefetch(['support'], () => {
        void loadConversation();
    });

    useEffect(() => {
        const node = scrollRef.current;
        if (!node) return;
        node.scrollTop = node.scrollHeight;
    }, [data.messages]);

    useEffect(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.style.height = '0px';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }, [draft]);

    const sendMessage = async (rawMessage?: string) => {
        const message = (rawMessage ?? draft).trim();
        const authToken = token ?? getApiToken();
        if (!message || !authToken || sending) return;

        setSending(true);
        try {
            const res = await fetch('/api/support', {
                method: editingMessageId ? 'PATCH' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
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
        const authToken = token ?? getApiToken();
        if (!authToken) return;

        setUploadingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { Authorization: `Bearer ${authToken}` },
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
        <div className="flex min-h-full flex-col bg-[var(--color-bg)]">
            <div className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-header-bg)]/95 px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+10px)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm transition-all active:scale-95"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[18px] font-black text-[var(--color-text)]">{copy.title}</p>
                        <p className="truncate text-[12px] text-[var(--color-hint)]">{copy.subtitle}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+14px)] pt-4">
                <div className="flex flex-1 flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_20px_50px_-32px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-primary)]/14 text-[var(--color-primary)]">
                            <UserRound size={20} />
                        </div>
                        <div>
                            <p className="text-[17px] font-black text-[var(--color-text)]">{copy.title}</p>
                            <p className="text-[12px] text-[var(--color-hint)]">{copy.subtitle}</p>
                        </div>
                    </div>

                    <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto bg-[var(--color-bg)] px-4 py-4">
                        {loading ? (
                            <div className="flex h-full min-h-[320px] items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
                            </div>
                        ) : data.messages.length === 0 ? (
                            <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center">
                                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/12 text-[var(--color-primary)]">
                                    <MessageCircleMore size={30} />
                                </div>
                                <p className="text-[26px] font-black text-[var(--color-text)]">{copy.title}</p>
                                <p className="mt-3 max-w-[260px] text-[15px] leading-7 text-[var(--color-hint)]">{copy.empty}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {data.messages.map((message) => {
                                    const mine = message.sender_role === 'user';
                                    return (
                                        <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`relative max-w-[82%] rounded-[22px] px-4 py-3 ${
                                                mine
                                                    ? 'rounded-br-[8px] bg-[var(--color-primary)] text-[var(--color-primary-contrast)]'
                                                    : 'rounded-bl-[8px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)]'
                                            }`}>
                                                {mine ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDraft(message.body);
                                                            setEditingMessageId(message.id);
                                                            setStickersOpen(false);
                                                        }}
                                                        className="absolute -left-8 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-hint)] transition hover:text-[var(--color-text)]"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                ) : null}
                                                {isImageMessage(message.body) ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={message.body} alt="attachment" className="max-h-72 rounded-[16px] object-contain" />
                                                ) : (
                                                    <p className="whitespace-pre-wrap break-words text-[14px] leading-6">{message.body}</p>
                                                )}
                                                <div className={`mt-2 text-right text-[11px] ${mine ? 'text-[var(--color-primary-contrast)]/70' : 'text-[var(--color-hint)]'}`}>
                                                    {formatMessageTime(message.created_at, language)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-4 pt-3">
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
                            <div className="mb-3 grid grid-cols-6 gap-2 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                                {STICKERS.map((sticker) => (
                                    <button
                                        key={sticker}
                                        type="button"
                                        onClick={() => {
                                            setDraft((prev) => `${prev}${sticker}`);
                                            setStickersOpen(false);
                                        }}
                                        className="flex h-10 items-center justify-center rounded-xl text-xl transition hover:bg-[var(--color-surface)]"
                                    >
                                        {sticker}
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        {editingMessageId ? (
                            <div className="mb-3 flex items-center justify-between rounded-[18px] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[12px] text-[var(--color-hint)]">
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

                        <div className="flex items-end gap-2 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingFile}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-hint)] transition hover:bg-[var(--color-surface)]"
                            >
                                {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                            </button>
                            <textarea
                                ref={textareaRef}
                                value={draft}
                                onChange={(event) => setDraft(event.target.value)}
                                placeholder={copy.placeholder}
                                rows={1}
                                className="min-h-[24px] flex-1 resize-none overflow-hidden bg-transparent py-2 text-[14px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-hint)]"
                            />
                            <button
                                type="button"
                                onClick={() => setStickersOpen((prev) => !prev)}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-hint)] transition hover:bg-[var(--color-surface)]"
                            >
                                <Smile className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => void sendMessage()}
                                disabled={sending || (!draft.trim() && !editingMessageId)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-primary-contrast)] shadow-[0_12px_25px_-12px_rgba(26,229,80,0.6)] transition disabled:opacity-50"
                            >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
