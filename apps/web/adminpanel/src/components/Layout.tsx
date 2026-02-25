import { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, BarChart2, Users, ShoppingBag, Store, FileCheck, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: BarChart2 },
  { path: '/users', label: 'Foydalanuvchilar', icon: Users },
  { path: '/products', label: 'Mahsulotlar', icon: ShoppingBag },
  { path: '/stores', label: 'Do\'konlar', icon: Store },
  { path: '/seller-requests', label: 'Seller so\'rovlari', icon: FileCheck },
  { path: '/orders', label: 'Buyurtmalar', icon: Package },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const current = location.pathname;

  function handleNav(path: string) {
    navigate(path);
    if (window.innerWidth < 768) setSidebarOpen(false);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 0,
        minWidth: sidebarOpen ? 240 : 0,
        background: '#1e293b',
        color: '#e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s, min-width 0.2s',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
      }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#f8fafc' }}>⚙️ Admin Panel</div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{user?.email}</div>
        </div>

        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => handleNav(path)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                width: '100%', padding: '10px 12px',
                borderRadius: 8, border: 'none', cursor: 'pointer',
                background: current === path ? '#3b82f6' : 'transparent',
                color: current === path ? '#fff' : '#cbd5e1',
                fontSize: 14, textAlign: 'left',
                marginBottom: 2,
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '12px 8px', borderTop: '1px solid #334155' }}>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              width: '100%', padding: '10px 12px',
              borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'transparent', color: '#f87171',
              fontSize: 14, textAlign: 'left',
            }}
          >
            <LogOut size={16} />
            Chiqish
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, marginLeft: sidebarOpen ? 240 : 0, transition: 'margin-left 0.2s', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Topbar */}
        <header style={{
          height: 56, background: '#fff', borderBottom: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', padding: '0 20px',
          position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#64748b' }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <span style={{ marginLeft: 12, fontWeight: 600, color: '#1e293b' }}>
            {NAV_ITEMS.find(n => n.path === current)?.label ?? 'Admin Panel'}
          </span>
        </header>

        <main style={{ flex: 1, padding: '24px 20px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
