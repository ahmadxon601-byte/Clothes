'use client';

import { Eye, Pencil, Plus, Search, Shield, ShieldOff, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  EmptyState,
  FilterBar,
  MobileCard,
  MobileCardList,
  SkeletonRows,
  StatusBadge,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../src/features/admin/components/DataViews';
import { ReasonDialog } from '../../../src/features/admin/components/ReasonDialog';
import { useUserMutation, useUsers } from '../../../src/features/admin/components/hooks';
import { useToast } from '../../../src/shared/ui/useToast';
import { adminApi } from '../../../src/lib/adminApi';
import type { User } from '../../../src/lib/adminApi';

export default function UsersPage() {
  const { t } = useAdminI18n();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const [targetUser, setTargetUser] = useState<{ id: string; banned: boolean } | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '' });
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [createError, setCreateError] = useState('');

  const query = useUsers({ page, limit: 16, search, role });
  const mutation = useUserMutation();
  const { showToast } = useToast();

  const qc = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: (id: string) => adminApi.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });

  const createMut = useMutation({
    mutationFn: (data: { name: string; email: string; password: string; role: string }) =>
      adminApi.post('/api/admin/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'user' });
      setCreateError('');
      showToast({ message: 'Foydalanuvchi yaratildi', type: 'success' });
    },
    onError: (e: Error) => setCreateError(e.message),
  });

  const openEdit = (user: User) => {
    setEditForm({ name: user.name, role: user.role });
    setEditUser(user);
  };

  return (
    <AdminShell
      title={t('users.title')}
      actions={
        <button onClick={() => { setCreateForm({ name: '', email: '', password: '', role: 'user' }); setCreateError(''); setCreateOpen(true); }} className='admin-btn flex items-center gap-2 px-4 py-2 text-sm'>
          <Plus className='size-4' /> Yangi foydalanuvchi
        </button>
      }
    >
      <AdminPageSection title={t('users.management')} description={t('users.managementDesc')} />

      <FilterBar>
        <div className='relative min-w-[240px] flex-1'>
          <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('users.search')} className='admin-input pl-10' />
        </div>
        <select className='admin-input max-w-[220px]' value={role} onChange={(e) => setRole(e.target.value)}>
          <option value=''>{t('common.allRoles')}</option>
          <option value='user'>{t('roles.user')}</option>
          <option value='seller'>Seller</option>
          <option value='admin'>Admin</option>
        </select>
      </FilterBar>

      {query.isLoading ? (
        <SkeletonRows />
      ) : (query.data?.users.length ?? 0) === 0 ? (
        <EmptyState title={t('users.empty')} description={t('users.emptyDesc')} />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('roles.user')}</TH>
                  <TH>{t('common.role')}</TH>
                  <TH>{t('users.added')}</TH>
                  <TH>{t('common.status')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {query.data?.users.map((item) => {
                  const banned = Boolean(item.is_banned);
                  return (
                    <TR key={item.id}>
                      <TD>
                        <p className='font-semibold'>{item.name || '-'}</p>
                        <p className='text-xs text-[var(--admin-muted)]'>{item.email}</p>
                      </TD>
                      <TD>{item.role}</TD>
                      <TD>{new Date(item.created_at).toLocaleDateString()}</TD>
                      <TD>
                        <StatusBadge label={banned ? t('common.banned') : t('common.active')} tone={banned ? 'danger' : 'success'} />
                      </TD>
                      <TD className='text-right'>
                        <div className='inline-flex items-center gap-1.5'>
                          {/* View */}
                          <button
                            title="Ko'rish"
                            onClick={() => setViewUser(item)}
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors'
                          >
                            <Eye size={14} />
                          </button>
                          {/* Edit */}
                          <button
                            title="Tahrirlash"
                            onClick={() => openEdit(item)}
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-[var(--admin-fg)] transition-colors'
                          >
                            <Pencil size={14} />
                          </button>
                          {/* Ban/Unban */}
                          <button
                            title={banned ? t('common.unban') : t('common.ban')}
                            disabled={item.role === 'admin'}
                            onClick={() => setTargetUser({ id: item.id, banned })}
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-amber-500 disabled:opacity-40 transition-colors'
                          >
                            {banned ? <Shield size={14} /> : <ShieldOff size={14} />}
                          </button>
                          {/* Delete */}
                          <button
                            title="O'chirish"
                            disabled={item.role === 'admin'}
                            onClick={() => setDeleteUser(item)}
                            className='flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)] hover:text-rose-500 disabled:opacity-40 transition-colors'
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {query.data?.users.map((item) => {
              const banned = Boolean(item.is_banned);
              return (
                <MobileCard key={item.id}>
                  <div className='flex items-start justify-between gap-2'>
                    <div>
                      <p className='font-semibold'>{item.name || '-'}</p>
                      <p className='text-sm text-[var(--admin-muted)]'>{item.email}</p>
                    </div>
                    <StatusBadge label={banned ? t('common.banned') : t('common.active')} tone={banned ? 'danger' : 'success'} />
                  </div>
                  <div className='mt-2 flex items-center justify-between text-xs text-[var(--admin-muted)]'>
                    <span>{item.role}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className='mt-3 grid grid-cols-4 gap-2'>
                    <button onClick={() => setViewUser(item)} className='flex items-center justify-center gap-1 rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold'>
                      <Eye size={12} />
                    </button>
                    <button onClick={() => openEdit(item)} className='flex items-center justify-center gap-1 rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold'>
                      <Pencil size={12} />
                    </button>
                    <button
                      disabled={item.role === 'admin'}
                      onClick={() => setTargetUser({ id: item.id, banned })}
                      className='flex items-center justify-center gap-1 rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold disabled:opacity-40'
                    >
                      {banned ? <Shield size={12} /> : <ShieldOff size={12} />}
                    </button>
                    <button
                      disabled={item.role === 'admin'}
                      onClick={() => setDeleteUser(item)}
                      className='flex items-center justify-center gap-1 rounded-full bg-rose-500/10 border border-rose-500/30 py-2 text-xs font-semibold text-rose-500 disabled:opacity-40'
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </MobileCard>
              );
            })}
          </MobileCardList>
        </>
      )}

      <div className='mt-4 flex justify-end gap-2'>
        <button disabled={page <= 1} className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm disabled:opacity-50' onClick={() => setPage((prev) => Math.max(prev - 1, 1))}>
          {t('common.previous')}
        </button>
        <button className='rounded-full border border-[var(--admin-border)] px-4 py-2 text-sm' onClick={() => setPage((prev) => prev + 1)}>
          {t('common.next')}
        </button>
      </div>

      {/* Ban/Unban dialog */}
      <ReasonDialog
        open={Boolean(targetUser)}
        title={targetUser?.banned ? t('users.unbanTitle') : t('users.banTitle')}
        confirmLabel={targetUser?.banned ? t('common.unban') : t('common.ban')}
        onClose={() => setTargetUser(null)}
        onConfirm={async (reason) => {
          if (!targetUser) return;
          await mutation.mutateAsync({ id: targetUser.id, payload: { is_banned: !targetUser.banned, reason } });
          showToast({ message: targetUser.banned ? t('users.unbannedMsg') : t('users.bannedMsg'), type: targetUser.banned ? 'success' : 'error' });
          setTargetUser(null);
        }}
      />

      {/* View modal */}
      {viewUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setViewUser(null)} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]'>
              <X size={14} />
            </button>
            <h2 className='mb-4 text-base font-bold'>Foydalanuvchi ma'lumotlari</h2>
            <div className='space-y-3 text-sm'>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Ism</span>
                <span className='font-semibold'>{viewUser.name || '—'}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Email</span>
                <span className='font-semibold'>{viewUser.email}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Rol</span>
                <span className='font-semibold capitalize'>{viewUser.role}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Holat</span>
                <StatusBadge label={viewUser.is_banned ? t('common.banned') : t('common.active')} tone={viewUser.is_banned ? 'danger' : 'success'} />
              </div>
              {viewUser.ban_reason && (
                <div className='flex justify-between gap-2'>
                  <span className='text-[var(--admin-muted)]'>Sabab</span>
                  <span className='text-right font-semibold text-rose-500'>{viewUser.ban_reason}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-[var(--admin-muted)]'>Qo'shilgan</span>
                <span className='font-semibold'>{new Date(viewUser.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setEditUser(null)} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]'>
              <X size={14} />
            </button>
            <h2 className='mb-4 text-base font-bold'>Tahrirlash</h2>
            <div className='space-y-3'>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Ism</span>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className='admin-input w-full'
                />
              </label>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Rol</span>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm((p) => ({ ...p, role: e.target.value }))}
                  className='admin-input w-full'
                >
                  <option value='user'>User</option>
                  <option value='seller'>Seller</option>
                </select>
              </label>
            </div>
            <div className='mt-5 flex gap-2'>
              <button onClick={() => setEditUser(null)} className='flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm'>
                Bekor
              </button>
              <button
                onClick={async () => {
                  await mutation.mutateAsync({ id: editUser.id, payload: { name: editForm.name.trim() || undefined, role: editForm.role || undefined } });
                  showToast({ message: 'Yangilandi', type: 'success' });
                  setEditUser(null);
                }}
                className='flex-1 rounded-full bg-[var(--admin-accent)] py-2 text-sm font-semibold text-white'
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create user modal */}
      {createOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <button onClick={() => setCreateOpen(false)} className='absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-muted)]'>
              <X size={14} />
            </button>
            <h2 className='mb-4 text-base font-bold'>Yangi foydalanuvchi</h2>
            <div className='space-y-3'>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Ism</span>
                <input value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} className='admin-input w-full' placeholder="To'liq ism" />
              </label>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Email</span>
                <input type='email' value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} className='admin-input w-full' placeholder='email@example.com' />
              </label>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Parol</span>
                <input type='password' value={createForm.password} onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))} className='admin-input w-full' placeholder='Kamida 6 ta belgi' />
              </label>
              <label className='block'>
                <span className='mb-1 block text-xs font-semibold text-[var(--admin-muted)]'>Rol</span>
                <select value={createForm.role} onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))} className='admin-input w-full'>
                  <option value='user'>User</option>
                  <option value='seller'>Seller</option>
                  <option value='admin'>Admin</option>
                </select>
              </label>
            </div>
            {createError && <p className='mt-2 text-xs text-rose-500'>{createError}</p>}
            <div className='mt-5 flex gap-2'>
              <button onClick={() => setCreateOpen(false)} className='flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm'>Bekor</button>
              <button
                disabled={createMut.isPending || !createForm.name.trim() || !createForm.email.trim() || createForm.password.length < 6}
                onClick={() => createMut.mutate(createForm)}
                className='flex-1 rounded-full bg-[var(--admin-accent)] py-2 text-sm font-semibold text-white disabled:opacity-50'
              >
                {createMut.isPending ? '...' : 'Yaratish'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteUser && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
          <div className='admin-card relative w-full max-w-sm p-6'>
            <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500'>
              <Trash2 size={22} />
            </div>
            <h2 className='text-base font-bold'>Foydalanuvchini o'chirish</h2>
            <p className='mt-1 text-sm text-[var(--admin-muted)]'>
              <span className='font-semibold text-[var(--admin-fg)]'>{deleteUser.name || deleteUser.email}</span> o'chirilsinmi? Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className='mt-5 flex gap-2'>
              <button onClick={() => setDeleteUser(null)} className='flex-1 rounded-full border border-[var(--admin-border)] py-2 text-sm'>
                Bekor
              </button>
              <button
                onClick={async () => {
                  await deleteMut.mutateAsync(deleteUser.id);
                  showToast({ message: "O'chirildi", type: 'error' });
                  setDeleteUser(null);
                }}
                className='flex-1 rounded-full bg-rose-500 py-2 text-sm font-semibold text-white'
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
