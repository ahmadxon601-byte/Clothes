import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { ProductCard } from '../../components/ProductCard';
import { Chips } from '../../components/Chips';
import { ArrowLeft, Trash2 } from 'lucide-react';

const FILTERS = ['All', 'Shirts', 'Shoes', 'Pants', 'Jackets'];

const FAVORITES = [
    { id: 1, title: 'Oversized Wool Coat', price: '$149', brand: 'Loro Piana', imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400', isFavorite: true, badgeText: 'ONLY 3 LEFT' },
    { id: 2, title: 'Cashmere Knit Sweater', price: '$89', brand: 'Theory', imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400', isFavorite: true },
    { id: 3, title: 'Classic Tailored Trousers', price: '$120', brand: 'Zegna', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400', isFavorite: true },
    { id: 4, title: 'Leather Chelsea Boots', price: '$195', brand: 'Santoni', imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400', isFavorite: true, badgeText: 'ONLY 2 LEFT' },
];

export function Favorites() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Sevimlilar"
                leftIcon={<ArrowLeft className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                rightIcon={null}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                <div className="overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 mb-1">
                    <Chips options={FILTERS} activeOption="All" />
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                    {FAVORITES.map(product => (
                        <ProductCard
                            key={product.id}
                            {...product}
                            actionIcon={
                                <div className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center">
                                    <Trash2 className="w-[16px] h-[16px] text-red-500" strokeWidth={2.2} />
                                </div>
                            }
                        />
                    ))}
                </div>
            </main>

            <BottomNav activeTab="favorites" />
        </div>
    );
}
