'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAdminAuth } from '../../../src/context/AdminAuthContext';

export default function AdminLoginPage() {
  const { login, user, loading } = useAdminAuth();
  const router = useRouter();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && user) {
      router.replace('/admin/dashboard');
    }
  }, [loading, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(loginValue, password);
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
          <p className='text-2xl font-extrabold'>Aksiya.uz</p>
          <p className='text-sm text-[var(--admin-muted)]'>Admin login</p>
        </div>

        <form onSubmit={onSubmit} className='space-y-3'>
          <label className='block text-sm'>
            <span className='mb-1 inline-block text-[var(--admin-muted)]'>Login</span>
            <div className='relative'>
              <User className='pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--admin-muted)]' />
              <input className='admin-input pl-10' value={loginValue} onChange={(e) => setLoginValue(e.target.value)} type='text' required />
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
            disabled={submitting}
            className='w-full rounded-full bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--admin-accent-hover)] disabled:opacity-60'
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

