const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const BASE = rawBase ? rawBase.replace(/\/+$/, "") : "";

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);
  let res: Response;
  try {
    res = await fetch(`${BASE}${url}`, {
      ...init,
      headers: { ...getHeaders(), ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Server javob bermadi (timeout). Backendni tekshiring.');
    }
    if (error instanceof TypeError) {
      throw new Error('Backendga ulanib bo`lmadi. `npm run dev:backend` ni ishga tushiring yoki `VITE_API_BASE_URL` ni tekshiring.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const fallbackMessage =
      (text && !text.trim().startsWith('<!DOCTYPE') ? text : '').slice(0, 180) ||
      `Server xatosi (${res.status}). Backend loglarini tekshiring.`;
    throw new Error(json?.error ?? json?.message ?? fallbackMessage);
  }

  return (json?.data ?? json) as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
