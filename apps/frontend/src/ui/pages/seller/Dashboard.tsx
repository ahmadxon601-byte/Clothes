import { TopBar } from '../../components/TopBar';
import { DollarSign, Package, TrendingUp, Users } from 'lucide-react';

export function Dashboard() {
    const STATS = [
        { title: 'Total Revenue', value: '$12,450', prefix: '+15%', icon: DollarSign, color: 'text-lime-600', bg: 'bg-lime-100' },
        { title: 'Total Orders', value: '145', prefix: '+5%', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'Active Products', value: '42', prefix: '0%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-100' },
        { title: 'Total Customers', value: '890', prefix: '+12%', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="Seller Dashboard" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    {STATS.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <div key={i} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <h3 className="text-gray-500 font-medium text-xs mb-1">{stat.title}</h3>
                                <div className="flex items-end gap-2">
                                    <span className="text-gray-900 font-extrabold text-xl">{stat.value}</span>
                                    <span className="text-lime-600 font-bold text-xs mb-1">{stat.prefix}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Orders</h2>
                    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className={`p-4 flex justify-between items-center ${i !== 2 ? 'border-b border-gray-100' : ''}`}>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Order #102{i}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-1">2 items • $145.00</p>
                                </div>
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                                    Pending
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
