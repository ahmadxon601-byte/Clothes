import { TopBar } from '../../components/TopBar';
import { Plus, MoreVertical } from 'lucide-react';

const SELLER_PRODUCTS = [
    { id: 1, title: 'Graphic Tee Space', price: '$35.00', stock: 45, status: 'Active', img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=200' },
    { id: 2, title: 'Utility Cargo Pants', price: '$85.00', stock: 12, status: 'Active', img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=200' },
    { id: 3, title: 'Oversized Hoodie', price: '$65.00', stock: 0, status: 'Out of Stock', img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=200' },
];

export function Products() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="My Products" />

            <main className="max-w-md mx-auto px-4 pt-6">
                <button className="w-full bg-lime-400 text-[#1a2e05] font-bold py-4 rounded-full flex items-center justify-center gap-2 mb-6 active:scale-95 transition-transform shadow-sm">
                    <Plus className="w-5 h-5" /> Add New Product
                </button>

                <div className="space-y-4">
                    {SELLER_PRODUCTS.map(product => (
                        <div key={product.id} className="bg-white p-3 rounded-[24px] flex gap-4 shadow-sm border border-gray-100 relative">
                            <button className="absolute top-3 right-3 text-gray-400 active:bg-gray-50 p-1 rounded-full">
                                <MoreVertical className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 rounded-[16px] overflow-hidden bg-gray-100 shrink-0">
                                <img src={product.img} alt={product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 py-1 flex flex-col pr-6">
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{product.title}</h3>
                                <p className="text-xs text-gray-500 font-medium mb-auto">Stock: {product.stock}</p>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-extrabold text-gray-900">{product.price}</span>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full
                    ${product.status === 'Active' ? 'bg-lime-100 text-lime-700' : 'bg-red-100 text-red-700'}
                  `}>
                                        {product.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
