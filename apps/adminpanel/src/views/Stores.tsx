'use client';

import { useEffect, useState, useCallback } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../context/I18nContext";
import { DataTable } from "../components/ui/DataTable";
import { CardList } from "../components/ui/CardList";
import { IconButton } from "../components/ui/IconButton";
import { SearchPill } from "../components/ui/SearchPill";

interface Store {
  id: string;
  name: string;
  description: string;
  phone: string;
  address: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  product_count: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Stores() {
  const { t } = useI18n();
  const [stores, setStores] = useState<Store[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      const res = await api.get<{ stores: Store[]; pagination: Pagination }>(`/api/admin/stores?${params}`);
      setStores(res.stores);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [page, search, t]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  async function deleteStore(id: string, name: string) {
    if (!confirm(t("stores.deleteConfirm", { name }))) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/stores/${id}`);
      setStores((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleActive(store: Store) {
    try {
      await api.patch(`/api/admin/stores/${store.id}`, { is_active: !store.is_active });
      setStores((prev) => prev.map((s) => (s.id === store.id ? { ...s, is_active: !s.is_active } : s)));
    } catch (e) {
      alert(e instanceof Error ? e.message : t("common.error"));
    }
  }

  const columns = [
    {
      header: t("stores.title"),
      cell: (s: Store) => (
        <div className="flex flex-col">
          <span className="font-semibold text-main">{s.name}</span>
          {s.address && <span className="text-xs text-muted mt-0.5">{s.address}</span>}
        </div>
      ),
    },
    {
      header: t("stores.owner"),
      cell: (s: Store) => (
        <div className="flex flex-col">
          <span className="font-medium text-main">{s.owner_name}</span>
          <span className="text-xs text-muted mt-0.5">{s.owner_email}</span>
        </div>
      ),
    },
    { header: t("stores.phone"), cell: (s: Store) => s.phone || "-" },
    { header: t("stores.products"), cell: (s: Store) => <span className="font-medium text-main">{s.product_count}</span> },
    {
      header: t("stores.status"),
      cell: (s: Store) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(s);
          }}
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-colors ${
            s.is_active ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-600 hover:bg-red-500/20"
          }`}
        >
          {s.is_active ? t("common.active") : t("common.inactive")}
        </button>
      ),
    },
    {
      header: t("users.actions"),
      cell: (s: Store) => (
        <IconButton
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            deleteStore(s.id, s.name);
          }}
          disabled={deletingId === s.id}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
          title={t("users.actions")}
        >
          <Trash2 size={16} />
        </IconButton>
      ),
    },
  ];

  const cardItems = stores.map((s) => ({
    id: s.id,
    title: s.name,
    subtitle: s.owner_name,
    status: {
      label: s.is_active ? t("common.active") : t("common.inactive"),
      value: s.is_active ? ("active" as const) : ("rejected" as const),
    },
    metadata: `${t("stores.products")}: ${s.product_count} | ${t("stores.phone")}: ${s.phone || "-"}`,
    onAction: () => deleteStore(s.id, s.name),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-main tracking-tight">{t("stores.title")}</h2>
        <div className="flex items-center gap-3">
          <IconButton onClick={fetchStores} variant="soft" disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <SearchPill placeholder={t("stores.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} containerClassName="w-full md:max-w-md" />
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl font-medium text-sm">{error}</div>}

      {isMobile ? (
        <CardList items={cardItems} emptyMessage={loading ? t("common.loading") : t("stores.empty")} />
      ) : (
        <DataTable data={stores} columns={columns} keyExtractor={(s) => s.id} isLoading={loading} emptyMessage={t("stores.empty")} />
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 flex-wrap">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-10 h-10 rounded-full font-medium transition-all duration-200 ${p === page ? "bg-accent text-white shadow-md" : "bg-pill text-main hover:bg-border"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {pagination && <div className="text-center text-sm font-medium text-muted">{t("stores.total", { count: pagination.total })}</div>}
    </div>
  );
}

