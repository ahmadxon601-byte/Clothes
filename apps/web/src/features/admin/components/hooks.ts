'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../../lib/adminApi';

export function useAdminStats() {
  return useQuery({ queryKey: ['admin', 'stats'], queryFn: () => adminApi.getStats() });
}

export function useApplications(params: Record<string, string | number>) {
  return useQuery({
    queryKey: ['admin', 'applications', params],
    queryFn: () => adminApi.getApplications(params),
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
