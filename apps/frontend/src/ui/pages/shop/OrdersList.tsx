import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { Chips } from '../../components/Chips';

const ORDERS = [
    { id: '123456789', status: 'In Transit', date: 'Oct 24, 2023', items: 2, total: '$215.00', img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200' },
    { id: '123456788', status: 'Delivered', date: 'Sep 12, 2023', items: 1, total: '$45.00', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
    { id: '123456787', status: 'Cancelled', date: 'Aug 05, 2023', items: 3, total: '$180.00', img: 'https://images.unsplash.com/photo-1578932750294-f5075e85f44a?w=200' },
];

export function OrdersList() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="My Orders" />

            <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md pt-4 pb-2 border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 overflow-x-auto scrollbar-hide pb-2">
                    <Chips options={['Ongoing', 'Completed', 'Cancelled']} activeOption="Ongoing" />
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
                {ORDERS.map(order => (
                    <div key={order.id} className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 mb-4">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                            <div>
                                <p className="text-gray-900 font-bold text-sm">Order #{order.id}</p>
                                <p className="text-gray-500 font-medium text-xs">{order.date}</p>
                            </div>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full 
                 ${order.status === 'In Transit' ? 'bg-amber-100 text-amber-700' : ''}
                 ${order.status === 'Delivered' ? 'bg-lime-100 text-lime-700' : ''}
                 ${order.status === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
               `}>
                                {order.status}
                            </span>
                        </div>

                        <div className="flex gap-4 mb-4">
                            <div className="w-20 h-20 rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                                <img src={order.img} alt="Order item" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                                <p className="text-gray-500 font-medium text-sm mb-1">{order.items} Items</p>
                                <p className="text-gray-900 font-extrabold text-lg">{order.total}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button className="flex-1 py-3 rounded-full border border-gray-200 text-gray-900 font-bold text-sm active:bg-gray-50">
                                Details
                            </button>
                            {order.status === 'In Transit' && (
                                <button className="flex-1 py-3 rounded-full bg-gray-900 text-white font-bold text-sm shadow-md active:scale-95 transition-transform">
                                    Track
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </main>

            <BottomNav activeTab="profile" />
        </div>
    );
}
