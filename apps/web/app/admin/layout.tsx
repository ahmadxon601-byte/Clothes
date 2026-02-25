'use client';
import { ReactNode } from 'react';
import { AdminAuthProvider } from '../../src/context/AdminAuthContext';
import { ThemeProvider, useTheme } from '../../src/context/ThemeContext';

function ThemeWrapper({ children }: { children: ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        position: 'fixed', inset: 0, width: '100vw', height: '100vh',
        maxWidth: '100vw', zIndex: 9999, overflow: 'auto',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      {children}
    </div>
  );
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }

        /* ── CSS Variables ── */
        [data-theme="light"] {
          --adm-bg:      #f0f4f8;
          --adm-card:    #ffffff;
          --adm-hover:   #f8fafc;
          --adm-border:  #e8edf2;
          --adm-border2: #dde3ea;
          --adm-th:      #f4f7fa;
          --adm-inp:     #ffffff;
          --adm-topbar:  #ffffff;
          --adm-t1:      #0f172a;
          --adm-t2:      #374151;
          --adm-t3:      #64748b;
          --adm-t4:      #94a3b8;
          --adm-shadow:  0 1px 8px rgba(0,0,0,0.06);
          --adm-sidebar-bg: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        }
        [data-theme="dark"] {
          --adm-bg:      #0d1117;
          --adm-card:    #161b22;
          --adm-hover:   #1c2333;
          --adm-border:  #30363d;
          --adm-border2: #3d444d;
          --adm-th:      #13191f;
          --adm-inp:     #0d1117;
          --adm-topbar:  #161b22;
          --adm-t1:      #e6edf3;
          --adm-t2:      #c9d1d9;
          --adm-t3:      #8b949e;
          --adm-t4:      #6e7681;
          --adm-shadow:  0 1px 8px rgba(0,0,0,0.4);
          --adm-sidebar-bg: linear-gradient(180deg, #010409 0%, #0d1117 100%);
        }

        /* ── Scrollbar ── */
        [data-theme="light"] ::-webkit-scrollbar-track { background: #f1f5f9; }
        [data-theme="light"] ::-webkit-scrollbar-thumb { background: #cbd5e1; }
        [data-theme="dark"]  ::-webkit-scrollbar-track { background: #161b22; }
        [data-theme="dark"]  ::-webkit-scrollbar-thumb { background: #30363d; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { border-radius: 3px; }

        /* ── Nav links ── */
        .admin-nav-link { transition: all 0.15s ease; }
        [data-theme="light"] .admin-nav-link:hover { background: rgba(255,255,255,0.08) !important; }
        [data-theme="dark"]  .admin-nav-link:hover { background: rgba(255,255,255,0.06) !important; }
        .admin-nav-link.active {
          background: linear-gradient(135deg, #6366f1, #8b5cf6) !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(99,102,241,0.35);
        }

        /* ── Tables ── */
        .admin-table tr { transition: background 0.1s; }
        [data-theme="light"] .admin-table tr:hover td { background: var(--adm-hover); }
        [data-theme="dark"]  .admin-table tr:hover td { background: var(--adm-hover); }

        /* ── Buttons & cards ── */
        .admin-btn-icon { transition: all 0.15s ease; }
        .admin-btn-icon:hover { transform: scale(1.1); opacity: 0.85; }
        .admin-stat-card { transition: transform 0.2s, box-shadow 0.2s; }
        .admin-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; }

        /* ── Inputs ── */
        input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        select:focus { border-color: #6366f1 !important; outline: none; }

        /* ── Animations ── */
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .admin-fade-in { animation: fadeIn 0.25s ease; }
        .spin { animation: spin 0.7s linear infinite; }

        /* ── Theme toggle button ── */
        .theme-toggle {
          width: 36px; height: 20px; border-radius: 10px; border: none; cursor: pointer;
          position: relative; transition: background 0.25s;
        }
        [data-theme="light"] .theme-toggle { background: #e2e8f0; }
        [data-theme="dark"]  .theme-toggle { background: #6366f1; }
        .theme-toggle::after {
          content: ''; position: absolute; top: 2px; left: 2px;
          width: 16px; height: 16px; border-radius: 50%; background: #fff;
          transition: transform 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        [data-theme="dark"] .theme-toggle::after { transform: translateX(16px); }

        /* ── Quick link cards (dashboard) ── */
        a.admin-quick-link {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 14px; border-radius: 10px; text-decoration: none;
          transition: all 0.15s; font-size: 13px; font-weight: 500;
        }
        [data-theme="dark"] a.admin-quick-link { color: var(--adm-t2) !important; }

        /* ── Skeleton pulses ── */
        @keyframes shimmer { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
        .admin-skeleton { animation: shimmer 1.4s ease infinite; }
        [data-theme="light"] .admin-skeleton { background: #e8edf2 !important; }
        [data-theme="dark"]  .admin-skeleton { background: #1c2333 !important; }
      `}</style>
      <ThemeWrapper>
        <AdminAuthProvider>
          {children}
        </AdminAuthProvider>
      </ThemeWrapper>
    </ThemeProvider>
  );
}
