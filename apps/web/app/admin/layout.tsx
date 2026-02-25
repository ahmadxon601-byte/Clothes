'use client';
import { AdminAuthProvider } from '../../src/context/AdminAuthContext';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      maxWidth: '100vw', zIndex: 9999, overflow: 'auto',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#0f172a',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }

        .admin-nav-link { transition: all 0.15s ease; }
        .admin-nav-link:hover { background: rgba(255,255,255,0.08) !important; }
        .admin-nav-link.active { background: linear-gradient(135deg, #6366f1, #8b5cf6) !important; color: #fff !important; box-shadow: 0 4px 12px rgba(99,102,241,0.35); }

        .admin-table tr:hover td { background: #f8fafc; }
        .admin-table tr { transition: background 0.1s; }

        .admin-btn-icon { transition: all 0.15s ease; }
        .admin-btn-icon:hover { transform: scale(1.1); opacity: 0.85; }

        .admin-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .admin-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }

        .admin-badge { display: inline-flex; align-items: center; gap: 4px; }

        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        select:focus { border-color: #6366f1 !important; outline: none; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .admin-fade-in { animation: fadeIn 0.25s ease; }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>
      <AdminAuthProvider>
        {children}
      </AdminAuthProvider>
    </div>
  );
}
