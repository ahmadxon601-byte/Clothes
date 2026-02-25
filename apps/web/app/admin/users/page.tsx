'use client';
import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, RefreshCw, Users } from 'lucide-react';
import { AdminShell } from '../../../src/features/admin/AdminShell';
import { adminApi } from '../../../src/lib/adminApi';
import { s } from '../../../src/features/admin/styles';

interface User { id: string; name: string; email: string; role: string; created_at: string; }
interface Pagination { page: number; limit: number; total: number; pages: number; }

function RoleBadge({ role }: { role: string }) {
  const cfg = role === 'admin'
    ? { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' }
    : role === 'seller'
      ? { bg: '#fffbeb', color: '#d97706', dot: '#f59e0b' }
      : { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: cfg.bg, color: cfg.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
      {role}
    </span>
  );
}

function UserAvatar({ name }: { name: string }) {
  const initials = (name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
  const color = colors[initials.charCodeAt(0) % colors.length];
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const p = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) p.set('search', search);
      if (role) p.set('role', role);
      const res = await adminApi.get<{ users: User[]; pagination: Pagination }>(`/api/admin/users?${p}`);
      setUsers(res.users); setPagination(res.pagination);
    } catch (e) { setError(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setLoading(false); }
  }, [page, search, role]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function del(id: string, name: string) {
    if (!confirm(`"${name}" foydalanuvchisini o'chirasizmi?`)) return;
    setDeletingId(id);
    try { await adminApi.delete(`/api/admin/users/${id}`); setUsers(p => p.filter(u => u.id !== id)); }
    catch (e) { alert(e instanceof Error ? e.message : 'Xatolik'); }
    finally { setDeletingId(null); }
  }

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, alignItems: 'center' }}>
        <div>
          <h2 style={s.pageTitle}>Foydalanuvchilar</h2>
          {pagination && <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Jami {pagination.total} ta foydalanuvchi</p>}
        </div>
        <button onClick={fetchData} className="admin-btn-icon" style={{ ...s.iconBtn, background: '#f8fafc', border: '1px solid #f1f5f9', width: 36, height: 36, borderRadius: 10 }}>
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input placeholder="Ism yoki email qidirish..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...s.inp, paddingLeft: 38 }} />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} style={s.sel}>
          <option value="">Barcha rollar</option>
          <option value="user">👤 User</option>
          <option value="seller">🏪 Seller</option>
          <option value="admin">⚙️ Admin</option>
        </select>
      </div>

      {error && <div style={s.errBox}>⚠️ {error}</div>}

      <div style={s.tblWrap}>
        <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              {['Foydalanuvchi', 'Email', 'Rol', 'Qo\'shilgan', 'Amallar'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={s.empty}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <div className="spin" style={{ width: 18, height: 18, border: '2px solid #e2e8f0', borderTopColor: '#6366f1', borderRadius: '50%' }} />
                  Yuklanmoqda...
                </div>
              </td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={s.empty}>
                <Users size={40} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.2 }} />
                Foydalanuvchi topilmadi
              </td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UserAvatar name={u.name || u.email} />
                    <span style={{ fontWeight: 500, color: '#0f172a' }}>{u.name || '—'}</span>
                  </div>
                </td>
                <td style={{ ...s.td, color: '#64748b' }}>{u.email}</td>
                <td style={s.td}><RoleBadge role={u.role} /></td>
                <td style={{ ...s.td, color: '#94a3b8' }}>{new Date(u.created_at).toLocaleDateString('uz-UZ')}</td>
                <td style={s.td}>
                  <button onClick={() => del(u.id, u.name)} disabled={deletingId === u.id || u.role === 'admin'}
                    className="admin-btn-icon"
                    style={{ ...s.iconBtn, color: '#ef4444', opacity: u.role === 'admin' ? 0.25 : 1 }}
                    title={u.role === 'admin' ? 'Admin o\'chirib bo\'lmaydi' : "O'chirish"}>
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} page={page} setPage={setPage} />
    </AdminShell>
  );
}

function Pagination({ pagination, page, setPage }: { pagination: Pagination | null; page: number; setPage: (p: number) => void }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 20 }}>
      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
        <button key={p} onClick={() => setPage(p)} style={{
          ...s.pageBtn,
          background: p === page ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#fff',
          color: p === page ? '#fff' : '#64748b',
          boxShadow: p === page ? '0 2px 8px rgba(99,102,241,0.3)' : 'none',
          border: p === page ? '1px solid transparent' : '1px solid #e2e8f0',
        }}>{p}</button>
      ))}
    </div>
  );
}
