import type { StoreApplication, UserInfo } from '../shared/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const USER_TOKEN_KEY = 'marketplace_token';
const STORE_APP_CACHE_KEY = 'marketplace_store_application';

type AuthMe = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  created_at: string;
};

function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

async function safeJson(res: Response): Promise<any> {
  return res.json().catch(() => ({}));
}

async function requestWithToken(path: string, token: string): Promise<Response> {
  return fetch(apiUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });
}

export async function ensureMarketplaceToken(user: UserInfo | null): Promise<string> {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(USER_TOKEN_KEY) : null;
  if (stored) {
    const meRes = await requestWithToken('/api/auth/me', stored);
    if (meRes.ok) return stored;
  }

  const baseId = user?.id ?? 123456;
  const email = `tg_${baseId}@clothes.local`;
  const password = `TgUser#${baseId}`;
  const name = user ? `${user.first_name} ${user.last_name ?? ''}`.trim() : 'Marketplace User';

  const loginRes = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (loginRes.ok) {
    const loginBody = await safeJson(loginRes);
    const token = loginBody?.data?.token ?? loginBody?.token;
    if (!token) throw new Error('Token not returned');
    localStorage.setItem(USER_TOKEN_KEY, token);
    return token;
  }

  const registerRes = await fetch(apiUrl('/api/auth/register'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!registerRes.ok && registerRes.status !== 409) {
    const body = await safeJson(registerRes);
    throw new Error(body?.error ?? body?.message ?? 'Register failed');
  }

  const retryLoginRes = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!retryLoginRes.ok) {
    const body = await safeJson(retryLoginRes);
    throw new Error(body?.error ?? body?.message ?? 'Login failed');
  }

  const retryBody = await safeJson(retryLoginRes);
  const token = retryBody?.data?.token ?? retryBody?.token;
  if (!token) throw new Error('Token not returned');
  localStorage.setItem(USER_TOKEN_KEY, token);
  return token;
}

export async function getMarketplaceMe(token: string): Promise<AuthMe> {
  const res = await requestWithToken('/api/auth/me', token);
  const body = await safeJson(res);
  if (!res.ok) throw new Error(body?.error ?? 'Unauthorized');
  return (body?.data ?? body) as AuthMe;
}

export function cachePendingStoreApplication(app: Omit<StoreApplication, 'status'>) {
  const payload: StoreApplication = { ...app, status: 'PENDING' };
  localStorage.setItem(STORE_APP_CACHE_KEY, JSON.stringify(payload));
}

export function readCachedStoreApplication(): StoreApplication | null {
  try {
    const raw = localStorage.getItem(STORE_APP_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoreApplication;
  } catch {
    return null;
  }
}

export function markCachedStoreApproved() {
  const cached = readCachedStoreApplication();
  if (!cached) return;
  localStorage.setItem(STORE_APP_CACHE_KEY, JSON.stringify({ ...cached, status: 'APPROVED' as const }));
}

export function clearCachedStoreApplication() {
  localStorage.removeItem(STORE_APP_CACHE_KEY);
}
