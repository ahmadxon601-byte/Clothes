import { useEffect, useState } from 'react';
import { Users, ShoppingBag, Store, FileCheck } from 'lucide-react';
import { api } from '../lib/api';

interface Stats {
  users_count: number;
  products_count: number;
  stores_count: number;
  pending_seller_requests: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.FC<{ size?: number; color?: string }>;
  color: string;
  bg: string;
}

function StatCard({ label, value, icon: Icon, color, bg }: StatCardProps) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: 24,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 52, height: 52, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#1e293b' }}>{value.toLocaleString()}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Stats>('/api/admin/stats')
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  if (error) return <ErrorBox message={error} />;
  if (!stats) return <Spinner />;

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard label="Foydalanuvchilar" value={stats.users_count} icon={Users} color="#3b82f6" bg="#eff6ff" />
        <StatCard label="Mahsulotlar" value={stats.products_count} icon={ShoppingBag} color="#10b981" bg="#f0fdf4" />
        <StatCard label="Do'konlar" value={stats.stores_count} icon={Store} color="#f59e0b" bg="#fffbeb" />
        <StatCard label="Kutilayotgan so'rovlar" value={stats.pending_seller_requests} icon={FileCheck} color="#ef4444" bg="#fef2f2" />
      </div>

      <div style={{ marginTop: 32, background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Tezkor havolalar</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {[
            { href: '/users', label: 'Foydalanuvchilarni boshqarish', color: '#3b82f6' },
            { href: '/products', label: 'Mahsulotlarni boshqarish', color: '#10b981' },
            { href: '/stores', label: 'Do\'konlarni boshqarish', color: '#f59e0b' },
            { href: '/seller-requests', label: 'Seller so\'rovlari', color: '#ef4444' },
            { href: '/orders', label: 'Barcha buyurtmalar', color: '#8b5cf6' },
          ].map(link => (
            <a key={link.href} href={link.href} style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500,
              color: '#fff', background: link.color, display: 'inline-block',
            }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '14px 18px', color: '#dc2626' }}>
      Xatolik: {message}
    </div>
  );
}
