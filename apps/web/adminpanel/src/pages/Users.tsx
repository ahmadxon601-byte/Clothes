import { useEffect, useState, useCallback } from 'react';
import { Trash2, Search, RefreshCw } from 'lucide-react';
import { api } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      const res = await api.get<{ users: User[]; pagination: Pagination }>(
        `/api/admin/users?${params}`
      );
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, search, role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function deleteUser(id: string, name: string) {
    if (!confirm(`"${name}" foydalanuvchisini o'chirasizmi?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'O\'chirishda xatolik');
    } finally {
      setDeletingId(null);
    }
  }

  function roleColor(r: string) {
    if (r === 'admin') return { bg: '#fef2f2', color: '#dc2626' };
    if (r === 'seller') return { bg: '#fffbeb', color: '#d97706' };
    return { bg: '#f0fdf4', color: '#16a34a' };
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>Foydalanuvchilar</h2>
        <button onClick={fetchUsers} style={iconBtnStyle}><RefreshCw size={16} /></button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            placeholder="Ism yoki email qidirish..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ ...inputStyle, paddingLeft: 36 }}
          />
        </div>
        <select value={role} onChange={e => { setRole(e.target.value); setPage(1); }} style={selectStyle}>
          <option value="">Barcha rollar</option>
          <option value="user">User</option>
          <option value="seller">Seller</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={tableContainer}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc' }}>
              {['Ism', 'Email', 'Rol', 'Qo\'shilgan sana', 'Amallar'].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Yuklanmoqda...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Foydalanuvchi topilmadi</td></tr>
            ) : users.map(u => {
              const rc = roleColor(u.role);
              return (
                <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={tdStyle}>{u.name || '—'}</td>
                  <td style={tdStyle}>{u.email}</td>
                  <td style={tdStyle}>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: rc.bg, color: rc.color }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString('uz-UZ')}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => deleteUser(u.id, u.name)}
                      disabled={deletingId === u.id || u.role === 'admin'}
                      title={u.role === 'admin' ? 'Admin o\'chirib bo\'lmaydi' : 'O\'chirish'}
                      style={{ ...iconBtnStyle, color: '#ef4444', opacity: u.role === 'admin' ? 0.3 : 1 }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pagination && pagination.pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)} style={{
              ...pageBtnStyle,
              background: p === page ? '#3b82f6' : '#fff',
              color: p === page ? '#fff' : '#374151',
            }}>{p}</button>
          ))}
        </div>
      )}

      {pagination && (
        <div style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: '#94a3b8' }}>
          Jami: {pagination.total} ta foydalanuvchi
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 14px',
  border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, outline: 'none', background: '#fff', color: '#1e293b',
};
const selectStyle: React.CSSProperties = {
  padding: '9px 14px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 13, outline: 'none',
  background: '#fff', color: '#1e293b', cursor: 'pointer',
};
const tableContainer: React.CSSProperties = {
  background: '#fff', borderRadius: 12, overflow: 'auto',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
};
const thStyle: React.CSSProperties = {
  padding: '12px 16px', textAlign: 'left', fontWeight: 600,
  fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em',
  borderBottom: '1px solid #e2e8f0',
};
const tdStyle: React.CSSProperties = {
  padding: '12px 16px', color: '#374151',
};
const iconBtnStyle: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  padding: 6, borderRadius: 6, display: 'flex', alignItems: 'center',
  color: '#64748b',
};
const pageBtnStyle: React.CSSProperties = {
  width: 32, height: 32, border: '1px solid #e2e8f0',
  borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
};
const errorStyle: React.CSSProperties = {
  background: '#fef2f2', border: '1px solid #fecaca',
  borderRadius: 8, padding: '12px 16px', color: '#dc2626',
  marginBottom: 16, fontSize: 13,
};
