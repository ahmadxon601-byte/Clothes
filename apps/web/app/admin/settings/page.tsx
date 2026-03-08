'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminI18n } from '../../../src/context/AdminI18nContext';
import { useAdminAuth } from '../../../src/context/AdminAuthContext';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import {
  AdminPageSection,
  DesktopTable,
  EmptyState,
  MobileCard,
  MobileCardList,
  SkeletonRows,
  Table,
  TD,
  TH,
  THead,
  TR,
} from '../../../src/features/admin/components/DataViews';
import { adminApi } from '../../../src/lib/adminApi';
import { useToast } from '../../../src/shared/ui/useToast';

// ── Profile section ───────────────────────────────────────────────────────────
function ProfileSection() {
  const { t } = useAdminI18n();
  const { user } = useAdminAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const updateProfile = useMutation({
    mutationFn: () => adminApi.updateProfile(name),
    onSuccess: () => showToast({ message: t('settings.profileUpdated'), type: 'success' }),
    onError: (e: Error) => showToast({ message: e.message, type: 'error' }),
  });

  const changePwd = useMutation({
    mutationFn: () => adminApi.changePassword(currentPwd, newPwd),
    onSuccess: () => {
      showToast({ message: t('settings.pwdChanged'), type: 'success' });
      setCurrentPwd('');
      setNewPwd('');
    },
    onError: (e: Error) => showToast({ message: e.message, type: 'error' }),
  });

  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      {/* Name update */}
      <div className='admin-card p-5'>
        <h3 className='mb-4 text-sm font-semibold'>{t('settings.profile')}</h3>
        <p className='mb-4 text-xs text-[var(--admin-muted)]'>{t('settings.profileDesc')}</p>
        <div className='space-y-3'>
          <div>
            <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.yourName')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='admin-input'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.yourEmail')}</label>
            <input value={user?.email ?? ''} readOnly className='admin-input opacity-60' />
          </div>
          <button
            disabled={!name.trim() || updateProfile.isPending}
            onClick={() => updateProfile.mutate()}
            className='rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50'
          >
            {updateProfile.isPending ? t('common.loading') : t('settings.updateProfile')}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className='admin-card p-5'>
        <h3 className='mb-4 text-sm font-semibold'>{t('settings.changePwd')}</h3>
        <div className='space-y-3'>
          <div>
            <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.currentPwd')}</label>
            <input
              type='password'
              value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)}
              className='admin-input'
            />
          </div>
          <div>
            <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.newPwd')}</label>
            <input
              type='password'
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              className='admin-input'
            />
          </div>
          <button
            disabled={!currentPwd || newPwd.length < 6 || changePwd.isPending}
            onClick={() => changePwd.mutate()}
            className='rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50'
          >
            {changePwd.isPending ? t('common.loading') : t('settings.changePwd')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add admin dialog ──────────────────────────────────────────────────────────
function AddAdminDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useAdminI18n();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'select' | 'credentials'>('select');

  const users = useQuery({
    queryKey: ['admin', 'users-nonadmin', search],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 50, search, role: '' }),
    enabled: open,
  });

  const nonAdmins = users.data?.users.filter((u) => u.role !== 'admin') ?? [];

  const promote = useMutation({
    mutationFn: () => adminApi.promoteToAdmin(selectedId, login, password),
    onSuccess: () => {
      showToast({ message: t('settings.promoteSuccess'), type: 'success' });
      qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      handleClose();
    },
    onError: (e: Error) => showToast({ message: e.message, type: 'error' }),
  });

  function handleClose() {
    onClose();
    setSelectedId('');
    setSelectedName('');
    setLogin('');
    setPassword('');
    setSearch('');
    setStep('select');
  }

  if (!open) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'>
      <div className='admin-card w-full max-w-md p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <h2 className='text-base font-semibold'>{t('settings.addAdmin')}</h2>
          {/* Step indicator */}
          <div className='flex items-center gap-1.5 text-xs text-[var(--admin-muted)]'>
            <span className={step === 'select' ? 'font-bold text-[var(--admin-accent)]' : ''}>1. Foydalanuvchi</span>
            <span>→</span>
            <span className={step === 'credentials' ? 'font-bold text-[var(--admin-accent)]' : ''}>2. Kirish ma&apos;lumotlari</span>
          </div>
        </div>

        {step === 'select' ? (
          <>
            {/* Search */}
            <div className='relative mb-3'>
              <Search className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('users.search')}
                className='admin-input pl-10'
                autoFocus
              />
            </div>

            {/* User list */}
            <div className='max-h-64 overflow-y-auto rounded-2xl border border-[var(--admin-border)]'>
              {users.isLoading ? (
                <p className='py-6 text-center text-sm text-[var(--admin-muted)]'>{t('common.loading')}</p>
              ) : nonAdmins.length === 0 ? (
                <p className='py-6 text-center text-sm text-[var(--admin-muted)]'>Foydalanuvchilar topilmadi</p>
              ) : (
                nonAdmins.map((u) => (
                  <button
                    key={u.id}
                    type='button'
                    onClick={() => {
                      setSelectedId(u.id);
                      setSelectedName(u.name || u.email);
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--admin-pill)] ${
                      selectedId === u.id ? 'bg-[var(--admin-accent)]/10 border-l-2 border-[var(--admin-accent)]' : ''
                    }`}
                  >
                    <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-pill)] text-xs font-bold text-[var(--admin-muted)]'>
                      {(u.name || u.email).charAt(0).toUpperCase()}
                    </div>
                    <div className='min-w-0 flex-1'>
                      <p className='truncate text-sm font-semibold'>{u.name || '—'}</p>
                      <p className='truncate text-xs text-[var(--admin-muted)]'>{u.email}</p>
                    </div>
                    <span className='shrink-0 rounded-full bg-[var(--admin-pill)] px-2 py-0.5 text-xs capitalize text-[var(--admin-muted)]'>{u.role}</span>
                  </button>
                ))
              )}
            </div>

            <div className='mt-5 flex justify-end gap-3'>
              <button onClick={handleClose} className='rounded-full border border-[var(--admin-border)] px-5 py-2 text-xs font-semibold'>
                {t('common.reject')}
              </button>
              <button
                disabled={!selectedId}
                onClick={() => setStep('credentials')}
                className='rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50'
              >
                Keyingi →
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Selected user badge */}
            <div className='mb-4 flex items-center gap-2 rounded-xl bg-[var(--admin-pill)] px-4 py-2.5'>
              <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)]/20 text-xs font-bold text-[var(--admin-accent)]'>
                {selectedName.charAt(0).toUpperCase()}
              </div>
              <span className='text-sm font-semibold'>{selectedName}</span>
              <button onClick={() => setStep('select')} className='ml-auto text-xs text-[var(--admin-muted)] hover:text-[var(--admin-fg)]'>
                O&apos;zgartirish
              </button>
            </div>

            <div className='space-y-3'>
              <div>
                <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.adminLogin')}</label>
                <input
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  className='admin-input w-full'
                  placeholder='admin_username'
                  autoFocus
                />
              </div>
              <div>
                <label className='mb-1 block text-xs text-[var(--admin-muted)]'>{t('settings.adminPassword')}</label>
                <input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='admin-input w-full'
                  placeholder='••••••'
                />
              </div>
            </div>

            <div className='mt-5 flex justify-end gap-3'>
              <button onClick={() => setStep('select')} className='rounded-full border border-[var(--admin-border)] px-5 py-2 text-xs font-semibold'>
                ← Orqaga
              </button>
              <button
                disabled={login.length < 2 || password.length < 6 || promote.isPending}
                onClick={() => promote.mutate()}
                className='rounded-full bg-[var(--admin-accent)] px-5 py-2 text-xs font-semibold text-white disabled:opacity-50'
              >
                {promote.isPending ? t('common.loading') : t('settings.addAdmin')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Admins section ────────────────────────────────────────────────────────────
function AdminsSection() {
  const { t } = useAdminI18n();
  const { user: me } = useAdminAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const qc = useQueryClient();

  const admins = useQuery({
    queryKey: ['admin', 'admins'],
    queryFn: () => adminApi.getUsers({ page: 1, limit: 100, role: 'admin' }),
  });

  const demote = useMutation({
    mutationFn: (id: string) => adminApi.updateUser(id, { role: 'user' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'admins'] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e: Error) => console.error(e),
  });

  return (
    <>
      <AdminPageSection
        title={t('settings.admins')}
        description={t('settings.adminsDesc')}
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className='rounded-full bg-[var(--admin-accent)] px-4 py-2 text-xs font-semibold text-white'
          >
            + {t('settings.addAdmin')}
          </button>
        }
      />

      {admins.isLoading ? (
        <SkeletonRows />
      ) : (admins.data?.users.length ?? 0) === 0 ? (
        <EmptyState title={t('settings.noAdmins')} description='' />
      ) : (
        <>
          <DesktopTable>
            <Table>
              <THead>
                <tr>
                  <TH>{t('roles.user')}</TH>
                  <TH>{t('settings.adminLogin')}</TH>
                  <TH>{t('users.added')}</TH>
                  <TH className='text-right'>{t('users.actions')}</TH>
                </tr>
              </THead>
              <tbody>
                {admins.data?.users.map((item) => (
                  <TR key={item.id}>
                    <TD>
                      <p className='text-xs text-[var(--admin-muted)]'>{item.email}</p>
                    </TD>
                    <TD>
                      <p className='font-semibold'>{item.name || '-'}</p>
                    </TD>
                    <TD>{new Date(item.created_at).toLocaleDateString()}</TD>
                    <TD className='text-right'>
                      <button
                        disabled={item.id === me?.id || demote.isPending}
                        className='rounded-full border border-[var(--admin-border)] px-3 py-1 text-xs disabled:opacity-40'
                        onClick={() => demote.mutate(item.id)}
                      >
                        {t('settings.removeAdmin')}
                      </button>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </DesktopTable>

          <MobileCardList>
            {admins.data?.users.map((item) => (
              <MobileCard key={item.id}>
                <div className='flex items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold'>{item.name || '-'}</p>
                    <p className='text-sm text-[var(--admin-muted)]'>{item.email}</p>
                  </div>
                  <span className='rounded-full bg-[var(--admin-pill)] px-2 py-0.5 text-xs'>Admin</span>
                </div>
                <p className='mt-2 text-xs text-[var(--admin-muted)]'>{new Date(item.created_at).toLocaleDateString()}</p>
                {item.id !== me?.id && (
                  <button
                    disabled={demote.isPending}
                    className='mt-3 w-full rounded-full border border-[var(--admin-border)] py-2 text-xs font-semibold disabled:opacity-40'
                    onClick={() => demote.mutate(item.id)}
                  >
                    {t('settings.removeAdmin')}
                  </button>
                )}
              </MobileCard>
            ))}
          </MobileCardList>
        </>
      )}

      <AddAdminDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { t } = useAdminI18n();
  return (
    <AdminShell title={t('settings.title')}>
      <AdminPageSection title={t('settings.profile')} description={t('settings.profileDesc')} />
      <ProfileSection />

      <div className='mt-6'>
        <AdminsSection />
      </div>
    </AdminShell>
  );
}
