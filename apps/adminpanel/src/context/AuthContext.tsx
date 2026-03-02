'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../lib/api';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthCtx {
  user: AdminUser | null;
  loading: boolean;
  login: (loginValue: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) { setLoading(false); return; }

    api.get<AdminUser>('/api/auth/me')
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

  async function login(loginValue: string, password: string) {
    const res = await api.post<{ token: string; user: AdminUser }>(
      '/api/auth/admin-login',
      { login: loginValue, password }
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
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
