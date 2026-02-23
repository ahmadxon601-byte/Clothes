import { TopBar } from '../../components/TopBar';
import { Stepper } from '../../components/Stepper';
import { BottomSheetBar } from '../../components/BottomSheetBar';
import { Trash2 } from 'lucide-react';

const CART_ITEMS = [
    { id: 1, title: 'Nike Air Force 1', subtitle: 'Size: 42 | Color: White', price: '$120.00', qty: 1, img: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200' },
    { id: 2, title: 'Essential Oversized Tee', subtitle: 'Size: M | Color: Black', price: '$45.00', qty: 2, img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
];

export function Cart() {
    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            <TopBar title="My Cart" />

            <main className="max-w-md mx-auto px-4 pt-6">
                <div className="space-y-4 mb-8">
                    {CART_ITEMS.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-[24px] flex gap-4 shadow-sm border border-gray-100">
                            <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                                <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 py-1 flex flex-col">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                                    <button className="text-red-400 hover:text-red-500 active:scale-90 transition-transform">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-auto">{item.subtitle}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-gray-900">{item.price}</span>
                                    <div className="scale-90 origin-bottom-right">
                                        <Stepper value={item.qty} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="text-gray-900 font-bold">$210.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Delivery</span>
                        <span className="text-gray-900 font-bold">$15.00</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Discount</span>
                        <span className="text-lime-600 font-bold">-$10.00</span>
                    </div>
                    <div className="h-px w-full bg-gray-100 my-2" />
                    <div className="flex justify-between">
                        <span className="text-gray-900 font-bold text-lg">Total Amount</span>
                        <span className="text-gray-900 font-extrabold text-xl">$215.00</span>
                    </div>
                </div>
            </main>

            <BottomSheetBar
                totalLabel="Total"
                totalPrice="$215.00"
                buttonText="Checkout"
            />
        </div>
    );
}
