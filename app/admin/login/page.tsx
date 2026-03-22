'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAdminAuth } from '../../../src/context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login, user, loading, telegramAccessLoading, telegramAccessChecked, telegramAllowed, telegramAccessError } = useAdminAuth();
  const router = useRouter();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [initData, setInitData] = useState('');

  useEffect(() => {
    setInitData(window.Telegram?.WebApp?.initData ?? '');
  }, []);

  useEffect(() => {
    if (!loading && (!initData || telegramAccessChecked) && user) {
      router.replace('/admin/dashboard');
    }
  }, [initData, loading, router, telegramAccessChecked, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(loginValue, password, initData || undefined);
      router.replace('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className='grid min-h-screen place-items-center bg-[var(--admin-bg)] p-4'>
      <section className='admin-card w-full max-w-md p-6'>
        <div className='mb-6 text-center'>
          <p className='text-2xl font-extrabold'>Qulaymarket.Uz</p>
          <p className='text-sm text-[var(--admin-muted)]'>Admin login</p>
        </div>

        {telegramAccessLoading ? <p className='mb-4 text-sm text-[var(--admin-muted)]'>Telegram access tekshirilmoqda...</p> : null}
        {!telegramAllowed ? (
          <p className='rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-500'>
            {telegramAccessError || "Sizga admin panelga kirish ruxsati berilmagan"}
          </p>
        ) : null}

        <form onSubmit={onSubmit} className='space-y-3'>
          <label className='block text-sm'>
            <span className='mb-1 inline-block text-[var(--admin-muted)]'>Login</span>
            <div className='relative'>
              <User className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
              <input className='admin-input pl-10' value={loginValue} onChange={(e) => setLoginValue(e.target.value)} type='text' required disabled={telegramAccessLoading || !telegramAllowed} />
            </div>
          </label>

          <label className='block text-sm'>
            <span className='mb-1 inline-block text-[var(--admin-muted)]'>Password</span>
            <div className='relative'>
              <Lock className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
              <input
                className='admin-input pl-10 pr-11'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPassword ? 'text' : 'password'}
                required
                disabled={telegramAccessLoading || !telegramAllowed}
              />
              <button
                type='button'
                onClick={() => setShowPassword((prev) => !prev)}
                className='absolute right-3 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center text-[var(--admin-muted)] transition hover:text-[var(--admin-fg)]'
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
              </button>
            </div>
          </label>

          {error ? <p className='rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-500'>{error}</p> : null}

          <button
            type='submit'
            disabled={submitting || telegramAccessLoading || !telegramAllowed}
            className='w-full rounded-full bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--admin-accent-hover)] disabled:opacity-60'
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

