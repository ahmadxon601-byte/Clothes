import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Tags } from 'lucide-react';
import { api } from '../lib/api';
import { AppCard } from '../components/ui/AppCard';
import { IconButton } from '../components/ui/IconButton';
import { SearchPill } from '../components/ui/SearchPill';
import { DataTable } from '../components/ui/DataTable';

interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ categories: Category[] }>('/api/categories');
      setCategories(res.categories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, query]);

  const columns = [
    { header: 'Nomi', cell: (c: Category) => <span className="font-semibold">{c.name}</span> },
    { header: 'Slug', cell: (c: Category) => <span className="font-mono text-xs text-muted">{c.slug}</span> },
    { header: 'Yaratilgan', cell: (c: Category) => <span className="text-sm text-muted">{new Date(c.created_at).toLocaleDateString('uz-UZ')}</span> },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-main tracking-tight">Categories</h2>
          <p className="text-sm text-muted font-medium mt-1">Katalog kategoriyalari ro'yxati.</p>
        </div>
        <IconButton onClick={load} variant="soft" disabled={loading}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </IconButton>
      </div>

      <AppCard className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <SearchPill placeholder="Nomi yoki slug..." value={query} onChange={(e) => setQuery(e.target.value)} containerClassName="w-full md:max-w-md" />
          <span className="inline-flex items-center gap-2 text-sm font-medium text-muted">
            <Tags size={16} />
            {filtered.length} ta kategoriya
          </span>
        </div>
      </AppCard>

      {error ? (
        <AppCard className="p-4 text-red-500 border-red-500/30">{error}</AppCard>
      ) : (
        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(c) => c.id}
          isLoading={loading}
          emptyMessage="Kategoriya topilmadi"
        />
      )}
    </div>
  );
}
