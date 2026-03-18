'use client';

import { useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi, TOKEN_STORAGE_KEY } from '../../../lib/adminApi';

// ── SSE: real-time admin events ───────────────────────────────────────────────
// Listens to /api/admin/events (Server-Sent Events) and invalidates
// the relevant React Query caches when the server emits a change event.
export function useAdminSSE() {
  const qc = useQueryClient();
  const qcRef = useRef(qc);
  qcRef.current = qc;

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
    if (!token) return;

    const base = `${window.location.protocol}//${window.location.hostname}:3001`;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const keyMap: Record<string, string[]> = {
      seller_requests: ['admin', 'applications'],
      users:           ['admin', 'users'],
      products:        ['admin', 'products'],
      stores:          ['admin', 'stores'],
      categories:      ['admin', 'categories'],
      banners:         ['admin', 'banners'],
      orders:          ['admin', 'orders'],
    };

    const connect = () => {
      if (es) { try { es.close(); } catch {} }
      es = new EventSource(`${base}/api/admin/events?token=${encodeURIComponent(token)}`);

      es.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data) as { type?: string };
          if (!payload.type || payload.type === 'connected') return;
          const key = keyMap[payload.type];
          if (key) {
            qcRef.current.invalidateQueries({ queryKey: key });
            qcRef.current.invalidateQueries({ queryKey: ['admin', 'stats'] });
            qcRef.current.invalidateQueries({ queryKey: ['admin', 'audit-logs'] });
          }
        } catch {}
      };

      es.onerror = () => {
        try { es?.close(); } catch {}
        es = null;
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      try { es?.close(); } catch {}
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminApi.getStats() });
}

export function useApplications(params: Record<string, string | number>) {
  return useQuery({
    queryKey: ['admin', 'applications', params],
    queryFn: () => adminApi.getApplications(params),
    refetchOnWindowFocus: true,
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'approved' | 'rejected'; reason?: string }) =>
      adminApi.updateApplication(id, { status, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'applications'] });
      qc.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
  });
}

export function useProducts(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'products', params], queryFn: () => adminApi.getProducts(params) });
}

export function useProductMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => adminApi.updateProduct(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'products'] }),
  });
}

export function useStores(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'stores', params], queryFn: () => adminApi.getStores(params) });
}

export function useStoreMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => adminApi.updateStore(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'stores'] }),
  });
}

export function useUsers(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'users', params], queryFn: () => adminApi.getUsers(params) });
}

export function useUserMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => adminApi.updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
}

export function useOrders(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'orders', params], queryFn: () => adminApi.getOrders(params) });
}

export function useOrderMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateOrderStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'orders'] }),
  });
}

export function useBanners(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'banners', params], queryFn: () => adminApi.getBanners(params) });
}

export function useCreateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; is_active: boolean; product_ids: string[] }) =>
      adminApi.createBanner(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { title?: string; is_active?: boolean; product_ids?: string[] } }) =>
      adminApi.updateBanner(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBanner(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'banners'] }),
  });
}

export function useAuditLogs(params: Record<string, string | number>) {
  return useQuery({ queryKey: ['admin', 'audit-logs', params], queryFn: () => adminApi.getAuditLogs(params) });
}
