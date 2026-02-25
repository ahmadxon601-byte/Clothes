'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { adminApi } from '../lib/adminApi';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminAuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthCtx | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }

    adminApi.get<AdminUser>('/api/auth/me')
      .then((u) => {
        if (u.role !== 'admin') {
          localStorage.removeItem('admin_token');
          setUser(null);
        } else {
          setUser(u);
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await adminApi.post<{ token: string; user: AdminUser }>(
      '/api/auth/login',
      { email, password }
    );
    if (res.user.role !== 'admin') throw new Error("Admin huquqi yo'q");
    localStorage.setItem('admin_token', res.token);
    setUser(res.user);
  }

  function logout() {
    localStorage.removeItem('admin_token');
    setUser(null);
  }

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return ctx;
}
