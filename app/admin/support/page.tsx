'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircleMore, Search, Send } from 'lucide-react';
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

export default function SupportPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState('');
  const listQuery = useQuery({
    queryKey: ['admin', 'support', 'conversations', search],
    queryFn: () => adminApi.get<{ conversations: SupportConversation[] }>(`/api/admin/support${search ? `?search=${encodeURIComponent(search)}` : ''}`),
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [detailQuery.data?.messages]);

  const selectedConversation = useMemo(
    () => listQuery.data?.conversations.find((item) => item.id === selectedId) ?? null,
    [listQuery.data?.conversations, selectedId]
  );

  const sendReply = async () => {
    const message = draft.trim();
    if (!message || !selectedId || replyMutation.isPending) return;
    await replyMutation.mutateAsync(message);
  };

  return (
    <AdminShell title='Support chat'>
      <AdminPageSection title='Support chat' description='Foydalanuvchilar bilan yozishmalar shu yerda boshqariladi.' />

      <div className='grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]'>
        <section className='admin-card overflow-hidden'>
          <div className='border-b border-[var(--admin-border)] p-4'>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder='Mijozni qidirish...'
                className='admin-input pl-10'
              />
            </div>
          </div>

          <div className='max-h-[70vh] overflow-y-auto'>
            {listQuery.isLoading ? (
              <div className='space-y-3 p-4'>
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className='h-20 animate-pulse rounded-2xl bg-[var(--admin-pill)]' />
                ))}
              </div>
            ) : (listQuery.data?.conversations.length ?? 0) === 0 ? (
              <EmptyState title='Chatlar yo‘q' description='Foydalanuvchi yordam markazi orqali yozganda shu yerda chiqadi.' />
            ) : (
              <div className='p-2'>
                {listQuery.data?.conversations.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`mb-2 flex w-full flex-col rounded-2xl border p-3 text-left transition-all ${
                      item.id === selectedId
                        ? 'border-[var(--admin-accent)] bg-[var(--admin-pill)]'
                        : 'border-[var(--admin-border)] bg-transparent hover:bg-[var(--admin-pill)]'
                    }`}
                  >
                    <div className='flex items-start justify-between gap-2'>
                      <div className='min-w-0'>
                        <p className='truncate text-sm font-semibold text-[var(--admin-text)]'>{item.user_name || item.user_email}</p>
                        <p className='truncate text-xs text-[var(--admin-muted)]'>{item.user_email}</p>
                      </div>
                      {item.unread_count > 0 ? (
                        <span className='rounded-full bg-rose-500 px-2 py-1 text-[10px] font-bold text-white'>{item.unread_count}</span>
                      ) : null}
                    </div>
                    <p className='mt-2 line-clamp-2 text-xs text-[var(--admin-muted)]'>{item.last_message || 'Yangi chat'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className='admin-card flex min-h-[70vh] flex-col overflow-hidden'>
          {!selectedId || !selectedConversation ? (
            <div className='flex flex-1 items-center justify-center p-8'>
              <div className='text-center text-[var(--admin-muted)]'>
                <MessageCircleMore className='mx-auto mb-3 size-8' />
                Chatni tanlang
              </div>
            </div>
          ) : (
            <>
              <div className='border-b border-[var(--admin-border)] p-4'>
                <p className='text-base font-bold text-[var(--admin-text)]'>{selectedConversation.user_name || selectedConversation.user_email}</p>
                <p className='text-sm text-[var(--admin-muted)]'>{selectedConversation.user_email}</p>
              </div>

              <div className='flex-1 space-y-3 overflow-y-auto bg-[var(--admin-bg)] p-4'>
                {detailQuery.isLoading ? (
                  <div className='space-y-3'>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div key={index} className='h-16 animate-pulse rounded-2xl bg-[var(--admin-pill)]' />
                    ))}
                  </div>
                ) : (
                  detailQuery.data?.messages.map((message) => {
                    const mine = message.sender_role === 'admin';
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                            mine
                              ? 'bg-[var(--admin-accent)] text-white'
                              : 'bg-[var(--admin-card)] text-[var(--admin-text)] border border-[var(--admin-border)]'
                          }`}
                        >
                          <p className='mb-1 text-[11px] font-semibold opacity-80'>{mine ? 'Support' : selectedConversation.user_name}</p>
                          <p className='whitespace-pre-wrap break-words'>{message.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className='border-t border-[var(--admin-border)] p-4'>
                <div className='flex gap-2'>
                  <textarea
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    rows={3}
                    placeholder='Javob yozing...'
                    className='admin-input min-h-[76px] flex-1 resize-none rounded-2xl'
                  />
                  <button
                    onClick={() => void sendReply()}
                    disabled={!draft.trim() || replyMutation.isPending}
                    className='flex h-12 items-center justify-center rounded-full bg-[var(--admin-accent)] px-5 text-sm font-semibold text-white disabled:opacity-50'
                  >
                    <Send className='mr-2 size-4' />
                    Yuborish
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminShell>
  );
}
