'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { adminApi, TOKEN_STORAGE_KEY, type AdminUser } from '../lib/adminApi';

interface AdminAuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
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
  }, []);

  async function login(login: string, password: string) {
    const result = (await adminApi.adminLogin(login, password)) as { token: string; user: AdminUser };
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

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading]);
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
