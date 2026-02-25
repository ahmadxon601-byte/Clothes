'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '../../src/context/AdminAuthContext';

export default function AdminIndex() {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) router.replace('/admin/dashboard');
      else router.replace('/admin/login');
    }
  }, [user, loading, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div style={{ fontSize: 14, color: '#64748b' }}>Yuklanmoqda...</div>
    </div>
  );
}
