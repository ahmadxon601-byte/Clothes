import { useState, useEffect } from 'react';
import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { Chips } from '../../components/Chips';
import { EmptyState } from '../../components/EmptyState';
import { Package } from 'lucide-react';
import { api } from '../../../lib/api';

type Order = {
    id: string;
    status: string;
    total_price: string;
    created_at: string;
    items_count: number;
    first_image: string | null;
};

const STATUS_LABEL: Record<string, string> = {
    pending:    'Pending',
    processing: 'Processing',
    shipped:    'In Transit',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
};

const STATUS_CLASS: Record<string, string> = {
    pending:    'bg-gray-100 text-gray-700',
    processing: 'bg-blue-100 text-blue-700',
    shipped:    'bg-amber-100 text-amber-700',
    delivered:  'bg-lime-100 text-lime-700',
    cancelled:  'bg-red-100 text-red-700',
};

const FILTER_MAP: Record<string, string[]> = {
    Ongoing:   ['pending', 'processing', 'shipped'],
    Completed: ['delivered'],
    Cancelled: ['cancelled'],
};

const FALLBACK = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200';

export function OrdersList() {
    const [orders, setOrders]     = useState<Order[]>([]);
    const [loading, setLoading]   = useState(true);
    const [activeFilter, setFilter] = useState('Ongoing');

    useEffect(() => {
        setLoading(true);
        api.get<Order[]>('/api/orders')
            .then(setOrders)
            .catch(() => setOrders([]))
            .finally(() => setLoading(false));
    }, []);

    const filtered = orders.filter(o => FILTER_MAP[activeFilter]?.includes(o.status));

    const fmt = (dt: string) =>
        new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="My Orders" />

            <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md pt-4 pb-2 border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 overflow-x-auto scrollbar-hide pb-2">
                    <Chips
                        options={['Ongoing', 'Completed', 'Cancelled']}
                        activeOption={activeFilter}
                        onOptionSelect={setFilter}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center pt-20">
                    <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={<Package className="w-12 h-12 text-gray-300" />}
                    title="No orders yet"
                    description="Your orders will appear here"
                />
            ) : (
                <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
                    {filtered.map(order => (
                        <div key={order.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 mb-4">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                                <div>
                                    <p className="text-gray-900 font-bold text-sm">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                                    <p className="text-gray-500 font-medium text-xs">{fmt(order.created_at)}</p>
                                </div>
                                <span className={`px-3 py-1 text-xs font-bold rounded-full ${STATUS_CLASS[order.status] ?? 'bg-gray-100 text-gray-700'}`}>
                                    {STATUS_LABEL[order.status] ?? order.status}
                                </span>
                            </div>

                            <div className="flex gap-4 mb-4">
                                <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                                    <img src={order.first_image ?? FALLBACK} alt="Order" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <p className="text-gray-500 font-medium text-sm mb-1">{order.items_count} Items</p>
                                    <p className="text-gray-900 font-extrabold text-lg">${Number(order.total_price).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 py-3 rounded-full border border-gray-200 text-gray-900 font-bold text-sm active:bg-gray-50">
                                    Details
                                </button>
                                {order.status === 'shipped' && (
                                    <button className="flex-1 py-3 rounded-full bg-gray-900 text-white font-bold text-sm shadow-md active:scale-95 transition-transform">
                                        Track
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </main>
            )}

            <BottomNav activeTab="profile" />
        </div>
    );
}
