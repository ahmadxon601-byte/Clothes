'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, type ReactNode } from 'react';
import { ToastProvider } from '../../src/shared/ui/Toast';
import { AdminAuthProvider } from '../../src/context/AdminAuthContext';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <ThemeProvider attribute='class' defaultTheme='system' enableSystem>
      <QueryClientProvider client={queryClient}>
        <AdminAuthProvider>
          {children}
          <ToastProvider />
        </AdminAuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
