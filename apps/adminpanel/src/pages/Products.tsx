import { useEffect, useState, useCallback } from 'react';
import { Trash2, RefreshCw, Eye } from 'lucide-react';
import { api } from '../lib/api';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { DataTable } from '../components/ui/DataTable';
import { CardList } from '../components/ui/CardList';
import { StatusBadge } from '../components/ui/StatusBadge';
import { IconButton } from '../components/ui/IconButton';
import { SearchPill } from '../components/ui/SearchPill';

interface Product {
  id: string;
  name: string;
  base_price: number;
  sku: string;
  views: number;
  is_active: boolean;
  created_at: string;
  category_name: string;
  store_name: string;
  thumbnail: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isMobile = useMediaQuery('(max-width: 767px)');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search) params.set('search', search);
      const res = await api.get<{ products: Product[]; pagination: Pagination }>(
        `/api/admin/products?${params}`
      );
      setProducts(res.products);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xatolik');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`"${name}" mahsulotini o'chirasizmi?`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/products/${id}`);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'O\'chirishda xatolik');
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(product: Product) {
    try {
      await api.patch(`/api/admin/products/${product.id}`, { is_active: !product.is_active });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Xatolik');
    }
  }

  const columns = [
    {
      header: 'Rasm',
      cell: (p: Product) => (
        p.thumbnail ? (
          <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-pill flex items-center justify-center border border-border/50">
            <Eye size={16} className="text-muted" />
          </div>
        )
      )
    },
    {
      header: 'Nomi',
      cell: (p: Product) => (
        <div className="flex flex-col">
          <span className="font-semibold text-main">{p.name}</span>
          <span className="text-xs text-muted mt-0.5">{p.sku}</span>
        </div>
      )
    },
    { header: 'Narx', cell: (p: Product) => `${Number(p.base_price).toLocaleString()} so'm` },
    { header: 'Kategoriya', accessorKey: 'category_name' as keyof Product },
    { header: 'Do\'kon', accessorKey: 'store_name' as keyof Product },
    { header: 'Ko\'rishlar', cell: (p: Product) => <span className="text-muted font-medium">{p.views}</span> },
    {
      header: 'Status',
      cell: (p: Product) => (
        <button
          onClick={(e) => { e.stopPropagation(); toggleActive(p); }}
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ${p.is_active ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 hover:bg-red-500/20'
            }`}
        >
          {p.is_active ? 'Faol' : 'Nofaol'}
        </button>
      )
    },
    {
      header: 'Amallar',
      cell: (p: Product) => (
        <IconButton
          size="sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); deleteProduct(p.id, p.name); }}
          disabled={deletingId === p.id}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          title="O'chirish"
        >
          <Trash2 size={16} />
        </IconButton>
      )
    }
  ];

  const cardItems = products.map(p => ({
    id: p.id,
    title: p.name,
    subtitle: `${Number(p.base_price).toLocaleString()} so'm • ${p.category_name || 'Kategoriyasiz'}`,
    status: {
      label: p.is_active ? 'Faol' : 'Nofaol',
      value: p.is_active ? 'active' as const : 'rejected' as const
    },
    metadata: `Do'kon: ${p.store_name || '—'} | SKU: ${p.sku}`,
    onAction: () => deleteProduct(p.id, p.name)
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-main tracking-tight">Mahsulotlar</h2>
        <div className="flex items-center gap-3">
          <IconButton onClick={fetchProducts} variant="soft" disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <SearchPill
          placeholder="Nom yoki SKU qidirish..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          containerClassName="w-full md:max-w-md"
        />
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl font-medium text-sm">
          {error}
        </div>
      )}

      {isMobile ? (
        <CardList items={cardItems} emptyMessage={loading ? "Yuklanmoqda..." : "Mahsulot topilmadi"} />
      ) : (
        <DataTable
          data={products}
          columns={columns}
          keyExtractor={p => p.id}
          isLoading={loading}
          emptyMessage="Mahsulot topilmadi"
        />
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-full font-medium transition-all duration-200 ${p === page
                  ? 'bg-accent text-white shadow-md'
                  : 'bg-pill text-main hover:bg-border'
                }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {pagination && (
        <div className="text-center text-sm font-medium text-muted">
          Jami: {pagination.total} ta mahsulot
        </div>
      )}
    </div>
  );
}
