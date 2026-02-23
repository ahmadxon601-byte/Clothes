import { TopBar } from '../../components/TopBar';
import { Chips } from '../../components/Chips';

const SELLER_ORDERS = [
    { id: '1025', customer: 'John Doe', items: 3, total: '$245.00', status: 'New', time: '10 mins ago' },
    { id: '1024', customer: 'Sarah Jenkins', items: 1, total: '$45.00', status: 'Processing', time: '2 hours ago' },
    { id: '1023', customer: 'Mike Ross', items: 2, total: '$180.00', status: 'Shipped', time: 'Yesterday' },
    { id: '1022', customer: 'Emma Watson', items: 1, total: '$120.00', status: 'Delivered', time: 'Oct 20' },
];

export function Orders() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="Store Orders" />

            <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md pt-4 pb-2 border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 overflow-x-auto scrollbar-hide pb-2">
                    <Chips options={['All', 'New', 'Processing', 'Shipped', 'Delivered']} activeOption="All" />
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
                {SELLER_ORDERS.map(order => (
                    <div key={order.id} className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Order #{order.id}</p>
                                <p className="text-xs font-medium text-gray-400 mt-0.5">{order.time}</p>
                            </div>
                            <span className={`px-3 py-1 text-[10px] font-bold rounded-full 
                 ${order.status === 'New' ? 'bg-red-100 text-red-700' : ''}
                 ${order.status === 'Processing' ? 'bg-amber-100 text-amber-700' : ''}
                 ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : ''}
                 ${order.status === 'Delivered' ? 'bg-lime-100 text-lime-700' : ''}
               `}>
                                {order.status}
                            </span>
                        </div>

                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-[16px]">
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-1">Customer</p>
                                <p className="text-sm font-bold text-gray-900">{order.customer}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-medium mb-1">{order.items} items</p>
                                <p className="text-sm font-extrabold text-gray-900">{order.total}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}
