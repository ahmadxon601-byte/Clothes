'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminApi, TOKEN_STORAGE_KEY, type AdminUser } from '../lib/adminApi';

interface AdminAuthCtx {
  user: AdminUser | null;
  loading: boolean;
  telegramAccessLoading: boolean;
  telegramAccessChecked: boolean;
  telegramAllowed: boolean;
  telegramAccessError: string;
  login: (login: string, password: string, initData?: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [telegramAccessLoading, setTelegramAccessLoading] = useState(false);
  const [telegramAccessChecked, setTelegramAccessChecked] = useState(false);
  const [telegramAllowed, setTelegramAllowed] = useState(true);
  const [telegramAccessError, setTelegramAccessError] = useState('');

  useEffect(() => {
    async function verifyTelegramAccess() {
      if (typeof window === 'undefined') return;
      const initData = window.Telegram?.WebApp?.initData;
      if (!initData) {
        setTelegramAllowed(true);
        setTelegramAccessError('');
        setTelegramAccessChecked(true);
        return;
      }

      setTelegramAccessLoading(true);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        await adminApi.checkTelegramAccess(initData, controller.signal);
        setTelegramAllowed(true);
        setTelegramAccessError('');
      } catch (error) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
        setTelegramAllowed(false);
        setTelegramAccessError(error instanceof Error ? error.message : 'Telegram access denied');
      } finally {
        clearTimeout(timeout);
        setTelegramAccessLoading(false);
        setTelegramAccessChecked(true);
      }
    }

    void verifyTelegramAccess();
  }, []);

  useEffect(() => {
    async function bootstrap() {
      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData && !telegramAccessChecked) {
        return;
      }

      if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData && !telegramAllowed) {
        setLoading(false);
        return;
      }

      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        setLoading(false);
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const admin = (await adminApi.getMe(controller.signal)) as AdminUser;
        if (admin.role !== 'admin') {
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          setUser(null);
          return;
        }
        setUser({ ...admin, name: admin.name ?? '' });
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setUser(null);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    }

    void bootstrap();
  }, [telegramAccessChecked, telegramAllowed]);

  async function login(login: string, password: string, initData?: string) {
    const result = (await adminApi.adminLogin(login, password, initData)) as { token: string; user: AdminUser };
    if (result.user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
    setUser({ ...result.user, name: result.user.name ?? '' });
  }

  function logout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, loading, telegramAccessLoading, telegramAccessChecked, telegramAllowed, telegramAccessError, login, logout }),
    [user, loading, telegramAccessLoading, telegramAccessChecked, telegramAllowed, telegramAccessError]
  );
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
