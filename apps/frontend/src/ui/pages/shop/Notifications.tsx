import { TopBar } from '../../components/TopBar';
import { Bell, ShoppingBag, Tag } from 'lucide-react';

const NOTIFICATIONS = [
    { id: 1, type: 'order', title: 'Order Shipped', text: 'Your order #123456789 has shipped and is on its way.', date: 'Just now', unread: true },
    { id: 2, type: 'promo', title: 'Summer Sale is Here!', text: 'Get up to 50% off on premium streetwear. Limited time only.', date: '2 hours ago', unread: true },
    { id: 3, type: 'system', title: 'Password Changed', text: 'Your account password was updated successfully.', date: 'Yesterday', unread: false },
];

export function Notifications() {
    return (
        <div className="min-h-screen bg-white pb-10 font-sans">
            <TopBar title="Notifications" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
                {NOTIFICATIONS.map(notif => (
                    <div key={notif.id} className={`p-4 rounded-[24px] flex gap-4 transition-colors ${notif.unread ? 'bg-lime-50/50' : 'bg-white border border-gray-100 shadow-sm'}`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0
               ${notif.type === 'order' ? 'bg-blue-100 text-blue-600' : ''}
               ${notif.type === 'promo' ? 'bg-amber-100 text-amber-600' : ''}
               ${notif.type === 'system' ? 'bg-gray-100 text-gray-600' : ''}
             `}>
                            {notif.type === 'order' && <ShoppingBag className="w-5 h-5" />}
                            {notif.type === 'promo' && <Tag className="w-5 h-5" />}
                            {notif.type === 'system' && <Bell className="w-5 h-5" />}
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-gray-900 text-sm">{notif.title}</h3>
                                <span className="text-xs font-medium text-gray-400 ml-2 shrink-0">{notif.date}</span>
                            </div>
                            <p className="text-xs font-medium text-gray-500 leading-relaxed">{notif.text}</p>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}
