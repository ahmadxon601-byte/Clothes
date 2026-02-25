'use client';
import { useEffect, useState } from 'react';
import { Users, ShoppingBag, Store, FileCheck, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface Stats {
  users_count: number;
  products_count: number;
  stores_count: number;
  pending_seller_requests: number;
}

const STAT_CONFIG = [
  { key: 'users_count' as const,             label: 'Foydalanuvchilar',    icon: Users,      from: '#6366f1', to: '#8b5cf6', href: '/admin/users' },
  { key: 'products_count' as const,          label: 'Mahsulotlar',         icon: ShoppingBag,from: '#10b981', to: '#059669', href: '/admin/products' },
  { key: 'stores_count' as const,            label: "Do'konlar",           icon: Store,      from: '#f59e0b', to: '#d97706', href: '/admin/stores' },
  { key: 'pending_seller_requests' as const, label: "Kutilayotgan so'rovlar",icon: FileCheck, from: '#ef4444', to: '#dc2626', href: '/admin/seller-requests' },
];

const QUICK_LINKS = [
  { href: '/admin/users',           label: 'Foydalanuvchilarni boshqarish', icon: Users,      color: '#6366f1' },
  { href: '/admin/products',        label: 'Mahsulotlarni boshqarish',      icon: ShoppingBag,color: '#10b981' },
  { href: '/admin/stores',          label: "Do'konlarni boshqarish",        icon: Store,      color: '#f59e0b' },
  { href: '/admin/seller-requests', label: "Seller so'rovlari",             icon: FileCheck,  color: '#ef4444' },
  { href: '/admin/orders',          label: 'Barcha buyurtmalar',            icon: ShoppingBag,color: '#8b5cf6' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get<Stats>('/api/admin/stats').then(setStats).catch(e => setError(e.message));
  }, []);

  return (
    <AdminShell>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--adm-t1)', letterSpacing: '-0.03em', marginBottom: 4 }}>
          Xush kelibsiz 👋
        </h1>
        <p style={{ fontSize: 14, color: 'var(--adm-t3)' }}>Marketplace statistikasi va tezkor amallar</p>
      </div>

      {error && <div style={s.errBox}>⚠️ {error}</div>}

      {/* Stat cards */}
      {!stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="admin-skeleton" style={{ ...s.card, padding: 24, height: 110 }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {STAT_CONFIG.map(({ key, label, icon: Icon, from, to, href }) => (
            <Link key={key} href={href} style={{ textDecoration: 'none' }}>
              <div className="admin-stat-card" style={{
                ...s.card,
                padding: '22px 24px',
                cursor: 'pointer', position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `linear-gradient(135deg, ${from}22, ${to}11)` }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${from}, ${to})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${from}44` }}>
                    <Icon size={20} color="#fff" />
                  </div>
                  <TrendingUp size={14} color="#10b981" />
                </div>
                <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--adm-t1)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {stats[key].toLocaleString()}
                </div>
                <div style={{ fontSize: 13, color: 'var(--adm-t3)', marginTop: 4, fontWeight: 500 }}>{label}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Quick links */}
      <div style={{ ...s.card, padding: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--adm-t1)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 4, height: 18, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 2, display: 'inline-block' }} />
          Tezkor havolalar
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {QUICK_LINKS.map(({ href, label, icon: Icon, color }) => (
            <Link key={href} href={href} className="admin-quick-link" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 14px', borderRadius: 10, border: `1px solid ${color}22`,
              background: `${color}0d`, textDecoration: 'none', transition: 'all 0.15s',
              color: 'var(--adm-t2)', fontSize: 13, fontWeight: 500,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={13} color={color} />
                </div>
                {label}
              </div>
              <ArrowRight size={13} color={color} />
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
