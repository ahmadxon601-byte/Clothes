import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { Chips } from '../../components/Chips';
import { ProductCard } from '../../components/ProductCard';
import { SlidersHorizontal } from 'lucide-react';

const SUB_CATEGORIES = ['T-Shirts', 'Hoodies', 'Jackets', 'Pants', 'Shorts'];

const REAL_PRODUCTS = [
    { id: 1, title: 'Graphic Tee Space', price: '$35.00', brand: 'Urban', imageUrl: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400' },
    { id: 2, title: 'Utility Cargo Pants', price: '$85.00', brand: 'TechWear', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', isFavorite: true },
    { id: 3, title: 'Oversized Hoodie', price: '$65.00', brand: 'Cozy', imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400' },
    { id: 4, title: 'Vintage Leather Jacket', price: '$125.00', brand: 'Retro', imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400' },
];

export function CategoryDetails() {
    return (
        <div className="min-h-screen bg-white pb-24 font-sans">
            <TopBar title="Clothing" />

            <div className="sticky top-14 z-30 bg-white/90 backdrop-blur-md pt-4 pb-2 border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Clothing</h1>
                    <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 active:bg-gray-50">
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

                <div className="max-w-md mx-auto px-4 overflow-x-auto scrollbar-hide pb-2">
                    <Chips options={SUB_CATEGORIES} activeOption="T-Shirts" />
                </div>
            </div>

            <main className="max-w-md mx-auto px-4 pt-6">
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                    {REAL_PRODUCTS.map(product => (
                        <ProductCard key={product.id} {...product} />
                    ))}
                </div>
            </main>

            <BottomNav activeTab="search" />
        </div>
    );
}
