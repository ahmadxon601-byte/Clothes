import { useEffect, useState, useCallback } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { api } from "../lib/api";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useI18n } from "../context/I18nContext";
import { DataTable } from "../components/ui/DataTable";
import { CardList } from "../components/ui/CardList";
import { StatusBadge } from "../components/ui/StatusBadge";
import { IconButton } from "../components/ui/IconButton";
import { SearchPill } from "../components/ui/SearchPill";
import { SegmentedControl } from "../components/ui/SegmentedControl";

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
  const { t } = useI18n();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);
      if (role !== "all") params.set("role", role);
      const res = await api.get<{ users: User[]; pagination: Pagination }>(`/api/admin/users?${params}`);
      setUsers(res.users);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("common.error"));
    } finally {
      setLoading(false);
    }
  }, [page, search, role, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function deleteUser(id: string, name: string) {
    if (!confirm(t("users.deleteConfirm", { name }))) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : t("common.deleteError"));
    } finally {
      setDeletingId(null);
    }
  }

  const getRoleBadge = (r: string) => {
    if (r === "admin") return <StatusBadge status="rejected" label="Admin" />;
    if (r === "seller") return <StatusBadge status="pending" label="Seller" />;
    return <StatusBadge status="active" label="User" />;
  };

  const columns = [
    { header: t("products.name"), cell: (u: User) => <span className="font-medium">{u.name || "-"}</span> },
    { header: t("login.email"), accessorKey: "email" as keyof User },
    { header: t("roles.role"), cell: (u: User) => getRoleBadge(u.role) },
    { header: t("users.added"), cell: (u: User) => new Date(u.created_at).toLocaleDateString("uz-UZ") },
    {
      header: t("users.actions"),
      cell: (u: User) => (
        <IconButton
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            deleteUser(u.id, u.name);
          }}
          disabled={deletingId === u.id || u.role === "admin"}
          className={u.role === "admin" ? "opacity-30 cursor-not-allowed" : "text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"}
          title={t("users.actions")}
        >
          <Trash2 size={16} />
        </IconButton>
      ),
    },
  ];

  const cardItems = users.map((u) => ({
    id: u.id,
    title: u.name || u.email,
    subtitle: u.name ? u.email : undefined,
    status: {
      label: u.role,
      value: u.role === "admin" ? ("rejected" as const) : u.role === "seller" ? ("pending" as const) : ("active" as const),
    },
    metadata: `${t("users.added")}: ${new Date(u.created_at).toLocaleDateString("uz-UZ")}`,
    onAction: u.role !== "admin" ? () => deleteUser(u.id, u.name) : undefined,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-main tracking-tight">{t("users.title")}</h2>
        <div className="flex items-center gap-3">
          <IconButton onClick={fetchUsers} variant="soft" disabled={loading}>
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </IconButton>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
        <SearchPill placeholder={t("users.search")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} containerClassName="w-full md:max-w-md" />
        <SegmentedControl
          options={[
            { label: t("users.all"), value: "all" },
            { label: "User", value: "user" },
            { label: "Seller", value: "seller" },
            { label: "Admin", value: "admin" },
          ]}
          value={role}
          onChange={(val) => { setRole(val); setPage(1); }}
          className="w-full md:w-auto overflow-x-auto"
        />
      </div>

      {error && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl font-medium text-sm">{error}</div>}

      {isMobile ? (
        <CardList items={cardItems} emptyMessage={loading ? t("common.loading") : t("users.empty")} />
      ) : (
        <DataTable data={users} columns={columns} keyExtractor={(u) => u.id} isLoading={loading} emptyMessage={t("users.empty")} />
      )}

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-10 h-10 rounded-full font-medium transition-all duration-200 ${p === page ? "bg-accent text-white shadow-md" : "bg-pill text-main hover:bg-border"}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {pagination && <div className="text-center text-sm font-medium text-muted">{t("users.total", { count: pagination.total })}</div>}
    </div>
  );
}

