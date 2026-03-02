const rawBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
const BASE = rawBase ? rawBase.replace(/\/+$/, "") : "";
const DEV_ADMIN_TOKEN = "dev_admin_token";

function isDevRuntime(): boolean {
  return Boolean(import.meta.env.DEV);
}

function isDbConnectionErrorMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("database connection error") ||
    m.includes("password authentication failed") ||
    m.includes("connect econnrefused")
  );
}

function isAuthError(status: number, message: string): boolean {
  const m = message.toLowerCase();
  return status === 401 || status === 403 || m.includes("unauthorized") || m.includes("forbidden");
}

function buildEmptyPagination(search: URLSearchParams) {
  const page = Number(search.get("page") ?? "1") || 1;
  const limit = Number(search.get("limit") ?? "20") || 20;
  return { page, limit, total: 0, pages: 1 };
}

function getDevFallback(url: string, method: string): unknown | null {
  const [path, query = ""] = url.split("?");
  const search = new URLSearchParams(query);
  const m = method.toUpperCase();

  if (path === "/api/auth/login" && m === "POST") {
    return {
      token: DEV_ADMIN_TOKEN,
      user: {
        id: "dev-admin",
        name: "Dev Admin",
        email: "admin@clothes.uz",
        role: "admin",
      },
    };
  }

  if (path === "/api/auth/me" && m === "GET") {
    const token = localStorage.getItem("admin_token");
    if (token === DEV_ADMIN_TOKEN) {
      return {
        id: "dev-admin",
        name: "Dev Admin",
        email: "admin@clothes.uz",
        role: "admin",
      };
    }
    return null;
  }

  if (path === "/api/admin/stats" && m === "GET") {
    return {
      users_count: 1,
      products_count: 0,
      stores_count: 0,
      pending_seller_requests: 0,
    };
  }

  if (path === "/api/admin/users" && m === "GET") {
    return {
      users: [
        {
          id: "dev-admin",
          name: "Dev Admin",
          email: "admin@clothes.uz",
          role: "admin",
          created_at: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, pages: 1 },
    };
  }

  if (path.startsWith("/api/admin/users/") && (m === "PUT" || m === "DELETE")) {
    return { ok: true };
  }

  if (path === "/api/admin/stores" && m === "GET") {
    return { stores: [], pagination: buildEmptyPagination(search) };
  }

  if (path.startsWith("/api/admin/stores/") && (m === "PATCH" || m === "DELETE")) {
    return { ok: true };
  }

  if (path === "/api/admin/products" && m === "GET") {
    return { products: [], pagination: buildEmptyPagination(search) };
  }

  if (path.startsWith("/api/admin/products/") && (m === "PATCH" || m === "DELETE")) {
    return { ok: true };
  }

  if (path === "/api/admin/seller-requests" && m === "GET") {
    return { requests: [], pagination: buildEmptyPagination(search) };
  }

  if (path.startsWith("/api/admin/seller-requests/") && m === "PUT") {
    return { ok: true };
  }

  if (path === "/api/categories" && m === "GET") {
    return { categories: [] };
  }

  if (path === "/api/health" && m === "GET") {
    return { status: "degraded", time: new Date().toISOString(), env: "dev-fallback" };
  }

  return null;
}

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('admin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
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
    if (isDevRuntime()) {
      const fallback = getDevFallback(url, method);
      if (fallback !== null) return fallback as T;
    }
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
    const message = json?.error ?? json?.message ?? fallbackMessage;
    if (isDevRuntime() && (isDbConnectionErrorMessage(String(message)) || isAuthError(res.status, String(message)))) {
      const fallback = getDevFallback(url, method);
      if (fallback !== null) return fallback as T;
    }
    throw new Error(message);
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
