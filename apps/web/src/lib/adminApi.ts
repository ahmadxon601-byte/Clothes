import {
  adminUserSchema,
  applicationSchema,
  auditLogSchema,
  bannerSchema,
  orderSchema,
  paginationSchema,
  productSchema,
  statsSchema,
  storeSchema,
  userSchema,
  type AdminUser,
  type Application,
  type AuditLog,
  type Banner,
  type Order,
  type Pagination,
  type Product,
  type Stats,
  type StoreItem,
  type User,
} from './schemas/admin';
import { z } from 'zod';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
export const TOKEN_STORAGE_KEY = process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY ?? 'admin_token';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

function token(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function makeUrl(path: string, params?: QueryParams): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalized}`, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });
  }

  if (!API_BASE && typeof window !== 'undefined') {
    return url.pathname + url.search;
  }

  return `${url.pathname}${url.search}`.startsWith('//') ? url.toString() : `${API_BASE}${url.pathname}${url.search}`;
}

async function request<T>(path: string, options: RequestInit = {}, schema?: z.ZodTypeAny): Promise<T> {
  const res = await fetch(makeUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token() ? { Authorization: `Bearer ${token()}` } : {}),
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error ?? body?.message ?? `Request failed (${res.status})`);
  }

  const data = body?.data ?? body;
  return schema ? (schema.parse(data) as T) : (data as T);
}

const paged = <T extends z.ZodTypeAny>(key: string, item: T) =>
  z.object({
    [key]: z.array(item),
    pagination: paginationSchema,
  }) as z.ZodType<{ [K in typeof key]: z.infer<T>[] } & { pagination: Pagination }>;

export const adminApi = {
  getMe: () => request<AdminUser>('/api/auth/me', {}, adminUserSchema),
  login: (email: string, password: string) =>
    request(
      '/api/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      z.object({ token: z.string(), user: adminUserSchema })
    ),
  adminLogin: (login: string, password: string) =>
    request(
      '/api/auth/admin-login',
      { method: 'POST', body: JSON.stringify({ login, password }) },
      z.object({ token: z.string(), user: adminUserSchema })
    ),
  updateProfile: (name: string) =>
    request('/api/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/api/auth/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  promoteToAdmin: (id: string, login: string, password: string) =>
    request(`/api/admin/users/${id}/promote`, { method: 'POST', body: JSON.stringify({ login, password }) }),

  getStats: () => request<Stats>('/api/admin/stats', {}, statsSchema),
  getApplications: (params: QueryParams) => request<{ requests: Application[]; pagination: Pagination }>('/api/admin/seller-requests?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('requests', applicationSchema)),
  updateApplication: (id: string, payload: { status: 'approved' | 'rejected'; reason?: string }) =>
    request(`/api/admin/seller-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        action: payload.status === 'approved' ? 'approve' : 'reject',
        note: payload.reason,
      }),
    }),

  getProducts: (params: QueryParams) => request<{ products: Product[]; pagination: Pagination }>('/api/admin/products?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('products', productSchema)),
  updateProduct: (id: string, payload: Record<string, unknown>) => request(`/api/admin/products/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getStores: (params: QueryParams) => request<{ stores: StoreItem[]; pagination: Pagination }>('/api/admin/stores?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('stores', storeSchema)),
  updateStore: (id: string, payload: Record<string, unknown>) => request(`/api/admin/stores/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getUsers: (params: QueryParams) => request<{ users: User[]; pagination: Pagination }>('/api/admin/users?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('users', userSchema)),
  updateUser: (id: string, payload: Record<string, unknown>) => request(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  getOrders: (params: QueryParams) => request<{ orders: Order[]; pagination: Pagination }>('/api/admin/orders?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('orders', orderSchema)),
  updateOrderStatus: (id: string, status: string) => request('/api/admin/orders', { method: 'PATCH', body: JSON.stringify({ id, status }) }),

  getBanners: (params: QueryParams) => request<{ banners: Banner[]; pagination: Pagination }>('/api/admin/banners?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('banners', bannerSchema)),
  createBanner: (payload: { title: string; is_active: boolean; product_ids: string[] }) =>
    request<{ banner: Banner }>('/api/admin/banners', { method: 'POST', body: JSON.stringify(payload) }),
  updateBanner: (id: string, payload: { title?: string; is_active?: boolean; product_ids?: string[] }) =>
    request<{ banner: Banner }>(`/api/admin/banners/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteBanner: (id: string) =>
    request<{ message: string }>(`/api/admin/banners/${id}`, { method: 'DELETE' }),

  getAuditLogs: (params: QueryParams) => request<{ logs: AuditLog[]; pagination: Pagination }>('/api/admin/audit-logs?' + new URLSearchParams(params as Record<string, string>).toString(), {}, paged('logs', auditLogSchema)),

  createCategory: (payload: { name: string; slug: string }) =>
    request('/api/admin/categories', { method: 'POST', body: JSON.stringify(payload) }),
  updateCategory: (id: string, payload: { name?: string; slug?: string }) =>
    request(`/api/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCategory: (id: string) =>
    request(`/api/admin/categories/${id}`, { method: 'DELETE' }),

  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};

export type { AdminUser, Application, AuditLog, Banner, Order, Pagination, Product, Stats, StoreItem, User };




