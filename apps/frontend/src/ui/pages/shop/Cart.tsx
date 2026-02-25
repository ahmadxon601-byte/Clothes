import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Stepper } from '../../components/Stepper';
import { BottomSheetBar } from '../../components/BottomSheetBar';
import { EmptyState } from '../../components/EmptyState';
import { Trash2, ShoppingCart } from 'lucide-react';
import { api } from '../../../lib/api';

type CartItem = {
    id: number;
    title: string;
    size: string | null;
    color: string | null;
    unit_price: string;
    quantity: number;
    image_url: string | null;
    store_name: string;
};

type CartData = {
    items: CartItem[];
    subtotal: number;
    delivery: number;
    total: number;
};

const FALLBACK = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=200';

export function Cart() {
    const [cart, setCart]       = useState<CartData | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadCart = useCallback(() => {
        setLoading(true);
        api.get<CartData>('/api/cart')
            .then(setCart)
            .catch(() => setCart(null))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => { loadCart(); }, [loadCart]);

    const removeItem = async (id: number) => {
        await api.delete(`/api/cart/${id}`);
        loadCart();
    };

    const updateQty = async (id: number, quantity: number) => {
        await api.patch(`/api/cart/${id}`, { quantity });
        loadCart();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const items = cart?.items ?? [];

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <TopBar title="My Cart" />
                <EmptyState
                    icon={<ShoppingCart className="w-12 h-12 text-gray-300" />}
                    title="Your cart is empty"
                    description="Add some items to get started"
                    actionText="Browse Products"
                    onAction={() => navigate('/')}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-32 font-sans">
            <TopBar title="My Cart" />

            <main className="max-w-md mx-auto px-4 pt-6">
                <div className="space-y-4 mb-8">
                    {items.map(item => (
                        <div key={item.id} className="bg-white p-3 rounded-[24px] flex gap-4 shadow-sm border border-gray-100">
                            <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                                <img src={item.image_url ?? FALLBACK} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 py-1 flex flex-col">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-gray-900 text-sm">{item.title}</h3>
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-red-400 hover:text-red-500 active:scale-90 transition-transform"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-auto">
                                    {[item.size && `Size: ${item.size}`, item.color && `Color: ${item.color}`]
                                        .filter(Boolean).join(' | ') || item.store_name}
                                </p>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-gray-900">${Number(item.unit_price).toFixed(2)}</span>
                                    <div className="scale-90 origin-bottom-right">
                                        <Stepper
                                            value={item.quantity}
                                            onChange={(v) => updateQty(item.id, v)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Subtotal</span>
                        <span className="text-gray-900 font-bold">${cart!.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 font-medium">Delivery</span>
                        <span className="text-gray-900 font-bold">${cart!.delivery.toFixed(2)}</span>
                    </div>
                    <div className="h-px w-full bg-gray-100 my-2" />
                    <div className="flex justify-between">
                        <span className="text-gray-900 font-bold text-lg">Total Amount</span>
                        <span className="text-gray-900 font-extrabold text-xl">${cart!.total.toFixed(2)}</span>
                    </div>
                </div>
            </main>

            <BottomSheetBar
                totalLabel="Total"
                totalPrice={`$${cart!.total.toFixed(2)}`}
                buttonText="Checkout"
                onButtonClick={() => navigate('/checkout')}
            />
        </div>
    );
}
