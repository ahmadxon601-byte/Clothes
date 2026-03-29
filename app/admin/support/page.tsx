'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Paperclip,
  CheckCheck,
  MessageCircleMore,
  Plus,
  SendHorizonal,
  Smile,
  UserRound,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { AdminPageSection, EmptyState } from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';

type SupportConversation = {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  status: 'open' | 'closed';
  last_message_at: string;
  created_at: string;
  last_message: string;
  unread_count: number;
};

type SupportMessage = {
  id: string;
  conversation_id: string;
  sender_role: 'user' | 'admin';
  sender_user_id: string | null;
  body: string;
  is_read: boolean;
  created_at: string;
};

type SupportConversationDetails = {
  conversation: SupportConversation;
  messages: SupportMessage[];
};

function isImageMessage(value: string) {
  const trimmed = value.trim();
  return trimmed.startsWith('data:image/')
    || trimmed.startsWith('/uploads/')
    || /^https?:\/\/.+\.(png|jpe?g|webp|gif)(\?.*)?$/i.test(trimmed);
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function SupportPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [showConversationList, setShowConversationList] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const listQuery = useQuery({
    queryKey: ['admin', 'support', 'conversations'],
    queryFn: () => adminApi.get<{ conversations: SupportConversation[] }>('/api/admin/support'),
  });

  const detailQuery = useQuery({
    queryKey: ['admin', 'support', 'conversation', selectedId],
    queryFn: () => adminApi.get<SupportConversationDetails>(`/api/admin/support/${selectedId}`),
    enabled: Boolean(selectedId),
  });

  useEffect(() => {
    const conversations = listQuery.data?.conversations ?? [];
    if (!conversations.length) {
      setSelectedId('');
      return;
    }

    if (!selectedId || !conversations.some((item) => item.id === selectedId)) {
      setSelectedId(conversations[0].id);
    }
  }, [listQuery.data?.conversations, selectedId]);

  const replyMutation = useMutation({
    mutationFn: (message: string) => adminApi.post(`/api/admin/support/${selectedId}`, { message }),
    onSuccess: async () => {
      setDraft('');
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin', 'support'] }),
        qc.invalidateQueries({ queryKey: ['admin', 'stats'] }),
      ]);
    },
  });

  const selectedConversation = useMemo(
    () => listQuery.data?.conversations.find((item) => item.id === selectedId) ?? null,
    [listQuery.data?.conversations, selectedId]
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detailQuery.data?.messages]);

  useEffect(() => {
    if (!detailQuery.data || !selectedId || showConversationList) return;
    void qc.invalidateQueries({ queryKey: ['admin', 'support', 'nav-unread'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'support', 'conversations'] });
  }, [detailQuery.data, selectedId, showConversationList, qc]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  }, [draft]);

  const sendReply = async () => {
    const message = draft.trim();
    if (!message || !selectedId || replyMutation.isPending) return;
    await replyMutation.mutateAsync(message);
  };

  return (
    <AdminShell title='Support chat'>
      <div className='px-4 pt-4 min-[1000px]:px-6'>
        <AdminPageSection title='Support chat' description='Yozishmalar admin panel uslubida boshqariladi.' />
      </div>

      {(listQuery.data?.conversations.length ?? 0) === 0 && !listQuery.isLoading ? (
        <div className='px-4 min-[1000px]:px-6'>
          <EmptyState title='Chatlar yo‘q' description='Yangi support yozishmasi kelganda shu yerda ko‘rinadi.' />
        </div>
      ) : showConversationList || !selectedConversation ? (
        <div className='h-full w-full overflow-hidden px-4 pb-4 min-[1000px]:px-6 min-[1000px]:pb-6'>
          <section className='admin-card flex h-full flex-col overflow-hidden rounded-[28px]'>
            <div className='border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-5 py-4'>
              <p className='text-[15px] font-semibold text-[var(--admin-text)]'>Chats</p>
            </div>

            <div className='soft-scrollbar min-h-0 flex-1 overflow-y-auto bg-[var(--admin-bg)] p-3'>
              {listQuery.data?.conversations.map((item) => (
                <button
                  key={item.id}
                  type='button'
                  data-admin-nav='true'
                  onClick={() => {
                    setSelectedId(item.id);
                    setShowConversationList(false);
                  }}
                  className='mb-2 flex w-full items-center gap-3 rounded-[20px] border border-transparent bg-[var(--admin-card)] px-4 py-3 text-left hover:border-[var(--admin-border)] hover:bg-[var(--admin-pill)]'
                >
                  <div className='flex size-11 shrink-0 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--admin-accent)_16%,var(--admin-pill))] text-[var(--admin-accent)]'>
                    <UserRound className='size-5.5' />
                  </div>
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-center justify-between gap-3'>
                      <p className='truncate text-[14px] font-semibold text-[var(--admin-text)]'>
                        {item.user_name || item.user_email}
                      </p>
                      {item.unread_count > 0 ? (
                        <span className='flex min-w-5 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1.5 py-0.5 text-[10px] font-semibold text-white'>
                          {item.unread_count}
                        </span>
                      ) : null}
                    </div>
                    <p className='truncate text-[12px] text-[var(--admin-muted)]'>{item.last_message || 'Yangi chat'}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className='h-full w-full overflow-hidden px-4 pb-4 min-[1000px]:px-6 min-[1000px]:pb-6'>
          <section className='admin-card relative flex h-full flex-col overflow-hidden rounded-[28px]'>
            <div className='flex items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-5 py-4'>
              <div className='flex min-w-0 items-center gap-3'>
                <button
                  type='button'
                  data-admin-nav='true'
                  onClick={() => setShowConversationList(true)}
                  className='flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--admin-muted)] hover:bg-[var(--admin-pill)]'
                >
                  <ArrowLeft className='size-4' />
                </button>
                <div className='flex size-11 items-center justify-center rounded-full bg-[color:color-mix(in_oklab,var(--admin-accent)_16%,var(--admin-pill))] text-[var(--admin-accent)]'>
                  <UserRound className='size-5.5' />
                </div>
                <div className='min-w-0'>
                  <p className='truncate text-[15px] font-semibold text-[var(--admin-text)]'>
                    {selectedConversation?.user_name || selectedConversation?.user_email || 'Support chat'}
                  </p>
                </div>
              </div>
            </div>

            <div className='soft-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto bg-[var(--admin-bg)] px-5 py-5 pb-28 sm:px-6'>
              {detailQuery.isLoading ? (
                <div className='space-y-4'>
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className='h-24 animate-pulse rounded-[26px] bg-[var(--admin-pill)]' />
                  ))}
                </div>
              ) : (
                <>
                  {detailQuery.data?.messages.map((message) => {
                    const mine = message.sender_role === 'admin';

                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[72%] sm:max-w-[38%] ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`relative w-fit min-w-0 rounded-[16px] px-3 py-2 ${
                              mine
                                ? 'rounded-br-[6px] bg-[var(--admin-accent)] text-white'
                                : 'rounded-bl-[6px] border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text)]'
                            }`}
                          >
                            <span
                              aria-hidden
                              className={`absolute bottom-0 h-3 w-3 ${
                                mine
                                  ? 'right-0 translate-x-[7px] bg-[var(--admin-accent)] [clip-path:polygon(0_0,100%_100%,0_100%)]'
                                  : 'left-0 -translate-x-[7px] bg-[var(--admin-card)] [clip-path:polygon(100%_0,100%_100%,0_100%)]'
                              }`}
                            />
                            <div className='flex items-end justify-end gap-2'>
                              <div className='min-w-0 flex-1'>
                                {isImageMessage(message.body) ? (
                                  <img src={message.body} alt='attachment' className='max-h-64 rounded-[12px] object-contain' />
                                ) : (
                                  <p className='whitespace-pre-wrap break-words text-[12px] leading-5'>{message.body}</p>
                                )}
                              </div>
                              <div className={`shrink-0 whitespace-nowrap text-[9px] ${mine ? 'text-white/80' : 'text-[var(--admin-muted)]'}`}>
                                <span>{formatMessageTime(message.created_at)}</span>
                                {mine ? <CheckCheck className='ml-1 inline size-3 text-white/85 align-[-1px]' /> : null}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 py-5'>
              {attachmentsOpen ? (
                <div className='pointer-events-auto mb-3 flex'>
                  <button
                    type='button'
                    data-admin-nav='true'
                    onClick={() => {
                      setAttachmentsOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className='admin-card flex items-center gap-3 rounded-[18px] px-4 py-3 text-[15px] text-[var(--admin-text)]'
                  >
                    <Paperclip className='size-4 text-[var(--admin-muted)]' />
                    <span>Add photo and files</span>
                  </button>
                </div>
              ) : null}
              <div className='admin-card pointer-events-auto flex items-center gap-3 rounded-full bg-[var(--admin-card)] px-5 py-3'>
                <input
                  ref={fileInputRef}
                  type='file'
                  multiple
                  className='hidden'
                  accept='image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar'
                />
                <button
                  type='button'
                  data-admin-nav='true'
                  onClick={() => setAttachmentsOpen((current) => !current)}
                  className='flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--admin-muted)]'
                >
                  <Plus className='size-5' />
                </button>

                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={1}
                  placeholder='Type your message...'
                  className='min-h-[28px] w-full resize-none overflow-hidden bg-transparent py-2 text-[15px] text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-muted)]'
                />

                <button
                  type='button'
                  data-admin-nav='true'
                  className='flex size-10 shrink-0 items-center justify-center rounded-full text-[var(--admin-muted)]'
                >
                  <Smile className='size-5' />
                </button>

                <button
                  type='button'
                  data-admin-nav='true'
                  onClick={() => void sendReply()}
                  disabled={!draft.trim() || replyMutation.isPending}
                  className='flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)] text-white disabled:opacity-50'
                >
                  <SendHorizonal className='size-5' />
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </AdminShell>
  );
}
