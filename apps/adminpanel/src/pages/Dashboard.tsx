import { useEffect, useState } from 'react';
import { Users, ShoppingBag, Store, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../lib/api';
import { useTheme } from '../context/ThemeContext';
import { AppCard } from '../components/ui/AppCard';
import { cn } from '../lib/utils';

interface Stats {
  users_count: number;
  products_count: number;
  stores_count: number;
  pending_seller_requests: number;
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.FC<{ size?: number; className?: string }>;
  iconBgColor: string;
  iconColorClass: string;
}

function StatCard({ label, value, icon: Icon, iconBgColor, iconColorClass }: StatCardProps) {
  return (
    <AppCard interactive className="flex items-center gap-5 p-5">
      <div
        className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", iconBgColor)}
      >
        <Icon size={26} className={iconColorClass} />
      </div>
      <div>
        <div className="text-sm text-muted font-medium mb-1">{label}</div>
        <div className="text-2xl font-bold text-main">{value.toLocaleString()}</div>
      </div>
    </AppCard>
  );
}

// Sample mock data for chart
const data = [
  { name: 'Mon', value: 340 },
  { name: 'Tue', value: 250 },
  { name: 'Wed', value: 200 },
  { name: 'Thu', value: 220 },
  { name: 'Fri', value: 200 },
  { name: 'Sat', value: 60 },
  { name: 'Sun', value: 250 },
];

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const { theme } = useTheme();

  useEffect(() => {
    api.get<Stats>('/api/admin/stats')
      .then(setStats)
      .catch(e => setError(e.message));
  }, []);

  if (error) return (
    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-600 rounded-2xl max-w-xl">
      <AlertCircle size={20} />
      <span className="font-medium text-sm">Xatolik: {error}</span>
    </div>
  );

  if (!stats) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4 text-muted">
      <Loader2 size={32} className="animate-spin text-accent" />
      <span className="text-sm font-medium">Loading statistics...</span>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-main mb-2 tracking-tight">Dashboard Overview</h2>
        <p className="text-muted text-sm md:text-base font-medium">Realtime metrics and reports for Clothes MP.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard
          label="Users"
          value={stats.users_count}
          icon={Users}
          iconBgColor="bg-blue-500/15"
          iconColorClass="text-blue-600 dark:text-blue-500"
        />
        <StatCard
          label="Products"
          value={stats.products_count}
          icon={ShoppingBag}
          iconBgColor="bg-violet-500/15"
          iconColorClass="text-violet-600 dark:text-violet-500"
        />
        <StatCard
          label="Stores"
          value={stats.stores_count}
          icon={Store}
          iconBgColor="bg-amber-500/15"
          iconColorClass="text-amber-600 dark:text-amber-500"
        />
        <StatCard
          label="Applications"
          value={stats.pending_seller_requests}
          icon={FileCheck}
          iconBgColor="bg-emerald-500/15"
          iconColorClass="text-emerald-600 dark:text-emerald-500"
        />
      </div>

      <AppCard className="p-6 md:p-8">
        <h3 className="text-lg font-bold text-main mb-6">Platform Growth</h3>
        <div className="w-full h-[320px] md:h-[400px] min-w-0 min-h-[320px] md:min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'var(--border-main)' : 'var(--border-main)'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: '1px solid var(--border-main)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  boxShadow: 'var(--shadow-premium)',
                  padding: '12px 16px',
                  fontWeight: 600
                }}
              />
              <Area
                type="basis"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </AppCard>
    </div>
  );
}
