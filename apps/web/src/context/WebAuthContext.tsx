'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const TOKEN_KEY = 'marketplace_token';
const API_BASE = '';

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'seller' | 'admin';
    created_at: string;
};

export type StoreStatus =
    | { status: 'none' }
    | { status: 'pending'; request: { id: string; store_name: string; created_at: string } }
    | { status: 'rejected'; request: { id: string; store_name: string; admin_note: string | null } }
    | { status: 'approved'; store: { id: string; name: string; description: string | null; phone: string | null; address: string | null; created_at: string } };

type WebAuthContextType = {
    user: AuthUser | null;
    loading: boolean;
    storeStatus: StoreStatus | null;
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshUser: () => Promise<void>;
    refreshStore: () => Promise<void>;
};

const WebAuthContext = createContext<WebAuthContextType | null>(null);

function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}

function saveToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path: string, options?: RequestInit, token?: string | null) {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string>),
    };
    const t = token ?? getToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
    const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, json };
}

export function WebAuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [storeStatus, setStoreStatus] = useState<StoreStatus | null>(null);

    const refreshStore = useCallback(async () => {
        const token = getToken();
        if (!token) { setStoreStatus(null); return; }
        try {
            const { ok, json } = await apiFetch('/stores/my', undefined, token);
            if (ok && json?.data) {
                setStoreStatus(json.data as StoreStatus);
            } else {
                setStoreStatus({ status: 'none' });
            }
        } catch {
            setStoreStatus({ status: 'none' });
        }
    }, []);

    const refreshUser = useCallback(async () => {
        const token = getToken();
        if (!token) { setUser(null); setLoading(false); return; }
        try {
            const { ok, json } = await apiFetch('/auth/me', undefined, token);
            if (ok && json?.data) {
                setUser(json.data as AuthUser);
                await refreshStore();
            } else {
                clearToken();
                setUser(null);
                setStoreStatus(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, [refreshStore]);

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    const login = async (email: string, password: string) => {
        const { ok, json } = await apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
        if (!ok) throw new Error(json?.error ?? json?.message ?? 'Login failed');
        const token = json?.data?.token ?? json?.token;
        if (!token) throw new Error('No token returned');
        saveToken(token);
        const userData = json?.data?.user ?? json?.user;
        if (userData) {
            setUser(userData as AuthUser);
            await refreshStore();
        } else {
            await refreshUser();
        }
    };

    const register = async (name: string, email: string, password: string) => {
        const { ok, json } = await apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });
        if (!ok) throw new Error(json?.error ?? json?.message ?? 'Registration failed');
        const token = json?.data?.token ?? json?.token;
        if (!token) throw new Error('No token returned');
        saveToken(token);
        const userData = json?.data?.user ?? json?.user;
        if (userData) {
            setUser(userData as AuthUser);
            setStoreStatus({ status: 'none' });
        } else {
            await refreshUser();
        }
    };

    const logout = () => {
        clearToken();
        setUser(null);
        setStoreStatus(null);
    };

    return (
        <WebAuthContext.Provider value={{ user, loading, storeStatus, login, register, logout, refreshUser, refreshStore }}>
            {children}
        </WebAuthContext.Provider>
    );
}

export function useWebAuth() {
    const ctx = useContext(WebAuthContext);
    if (!ctx) throw new Error('useWebAuth must be used inside WebAuthProvider');
    return ctx;
}
