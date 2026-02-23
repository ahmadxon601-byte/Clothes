import { TopBar } from '../../components/TopBar';
import { Tag, Plus, Clock } from 'lucide-react';

const PROMOS = [
    { id: 1, title: 'Summer Flash Sale', code: 'SUMMER50', discount: '50% OFF', active: true, validUntil: 'Aug 31, 2024' },
    { id: 2, title: 'Welcome Discount', code: 'NEW10', discount: '10% OFF', active: true, validUntil: 'No Expiry' },
    { id: 3, title: 'Black Friday', code: 'BF2023', discount: '70% OFF', active: false, validUntil: 'Expired' },
];

export function Promotions() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="Promotions" />

            <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
                <button className="w-full bg-lime-400 text-[#1a2e05] font-bold py-4 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm">
                    <Plus className="w-5 h-5" /> Create Promotion
                </button>

                <div className="space-y-4">
                    {PROMOS.map(promo => (
                        <div key={promo.id} className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-lime-50 rounded-bl-[100px] -z-0 opacity-50" />

                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0
                    ${promo.active ? 'bg-lime-100 text-lime-600' : 'bg-gray-100 text-gray-400'}
                  `}>
                                        <Tag className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-sm">{promo.title}</h3>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5 tracking-wider">{promo.code}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full
                  ${promo.active ? 'bg-lime-100 text-lime-700' : 'bg-gray-100 text-gray-500'}
                `}>
                                    {promo.active ? 'Active' : 'Expired'}
                                </span>
                            </div>

                            <div className="flex justify-between items-end relative z-10">
                                <span className="font-extrabold text-gray-900 text-xl">{promo.discount}</span>
                                <div className="flex items-center gap-1 text-gray-400 text-xs font-medium">
                                    <Clock className="w-3 h-3" />
                                    {promo.validUntil}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
