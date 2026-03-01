import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../lib/api';
import { AppCard } from '../components/ui/AppCard';
import { IconButton } from '../components/ui/IconButton';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'seller' | 'admin';
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const ROLE_OPTIONS: Array<User['role']> = ['user', 'seller', 'admin'];

export default function Roles() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ users: User[]; pagination: Pagination }>('/api/admin/users?page=1&limit=100');
      setUsers(res.users ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateRole(user: User, role: User['role']) {
    if (role === user.role) return;
    setSavingId(user.id);
    try {
      await api.put(`/api/admin/users/${user.id}`, { role });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role } : u));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Role yangilanmadi');
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main tracking-tight">Roles</h2>
          <p className="text-sm text-muted font-medium mt-1">Foydalanuvchilar rollarini boshqarish.</p>
        </div>
        <IconButton onClick={load} variant="soft" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </IconButton>
      </div>

      {error && <AppCard className="p-4 text-red-500 border-red-500/30">{error}</AppCard>}

      <AppCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto app-scrollbar">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-pill border-b border-border">
              <tr>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted">Foydalanuvchi</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted">Email</th>
                <th className="px-6 py-4 text-xs uppercase tracking-wider text-muted">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-none">
                  <td className="px-6 py-4 font-medium">{u.name || '-'}</td>
                  <td className="px-6 py-4 text-muted">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) => updateRole(u, e.target.value as User['role'])}
                      className="px-3 py-2 rounded-xl bg-pill border border-border text-main outline-none focus:ring-2 focus:ring-accent/40"
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AppCard>
    </div>
  );
}
