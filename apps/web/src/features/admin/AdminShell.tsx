'use client';
import { useState, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu, X, LogOut, BarChart2, Users,
  ShoppingBag, Store, FileCheck, Package, ChevronRight,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NAV = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart2 },
  { path: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { path: '/admin/products', label: 'Mahsulotlar', icon: ShoppingBag },
  { path: '/admin/stores', label: "Do'konlar", icon: Store },
  { path: '/admin/seller-requests', label: "Seller so'rovlari", icon: FileCheck },
  { path: '/admin/orders', label: 'Buyurtmalar', icon: Package },
];

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, color: '#fff',
      boxShadow: '0 2px 8px rgba(99,102,241,0.35)',
    }}>
      {initials || 'A'}
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/admin/login');
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spin" style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%', margin: '0 auto 12px' }} />
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Yuklanmoqda...</div>
      </div>
    </div>
  );

  if (!user) return null;

  const currentNav = NAV.find(n => n.path === pathname);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>

      {/* Sidebar */}
      <aside style={{
        width: open ? 260 : 0, minWidth: open ? 260 : 0,
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1), min-width 0.25s cubic-bezier(0.4,0,0.2,1)',
        position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 100,
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
              <span style={{ fontSize: 16 }}>⚙️</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#f8fafc', letterSpacing: '-0.02em' }}>Admin Panel</div>
              <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Clothes Marketplace</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>Menyu</div>
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = pathname === path;
            return (
              <Link key={path} href={path} className={`admin-nav-link${active ? ' active' : ''}`} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                color: active ? '#fff' : '#94a3b8',
                fontSize: 14, fontWeight: active ? 600 : 400,
                marginBottom: 3, textDecoration: 'none',
                whiteSpace: 'nowrap', position: 'relative',
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                  <Icon size={15} />
                </div>
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight size={13} style={{ opacity: 0.7 }} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: 'rgba(255,255,255,0.04)' }}>
            <Avatar name={user.name || user.email} size={32} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name || 'Admin'}</div>
              <div style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
            </div>
          </div>
          <button onClick={() => { logout(); router.push('/admin/login'); }} className="admin-nav-link" style={{
            display: 'flex', alignItems: 'center', gap: 10,
            width: '100%', padding: '9px 12px', borderRadius: 10,
            border: 'none', cursor: 'pointer', background: 'transparent',
            color: '#f87171', fontSize: 13, fontWeight: 500, textAlign: 'left',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(248,113,113,0.1)', flexShrink: 0 }}>
              <LogOut size={14} />
            </div>
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div style={{ flex: 1, marginLeft: open ? 260 : 0, transition: 'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <header style={{
          height: 64, background: '#fff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center', padding: '0 24px',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
        }}>
          <button onClick={() => setOpen(!open)} style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8,
            cursor: 'pointer', color: '#64748b', flexShrink: 0,
            transition: 'all 0.15s',
          }}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>

          <div style={{ marginLeft: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            {currentNav && (
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <currentNav.icon size={14} color="#fff" />
              </div>
            )}
            <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a' }}>
              {currentNav?.label ?? 'Admin Panel'}
            </span>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', background: '#f8fafc', padding: '5px 12px', borderRadius: 20, border: '1px solid #f1f5f9' }}>
              {new Date().toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <Avatar name={user.name || user.email} size={32} />
          </div>
        </header>

        {/* Page content */}
        <main className="admin-fade-in" style={{ flex: 1, padding: '28px 28px' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
