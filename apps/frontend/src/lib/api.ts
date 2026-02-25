const BASE = (import.meta.env.VITE_API_BASE_URL as string) ?? '';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    ...init,
    headers: { ...getHeaders(), ...(init?.headers ?? {}) },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? 'Request failed');
  return json.data as T;
}

export const api = {
  get:    <T>(url: string)                 => request<T>(url),
  post:   <T>(url: string, body: unknown)  => request<T>(url, { method: 'POST',  body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown)  => request<T>(url, { method: 'PUT',   body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown)  => request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(url: string)                 => request<T>(url, { method: 'DELETE' }),
};
