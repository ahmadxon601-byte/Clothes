import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { ProductCard } from '../../components/ProductCard';
import { EmptyState } from '../../components/EmptyState';
import { Chips } from '../../components/Chips';
import { ArrowLeft, Trash2, Heart } from 'lucide-react';
import { api } from '../../../lib/api';

type FavItem = {
    id: number;
    product_id: string;
    title: string;
    base_price: string;
    image_url: string | null;
    brand: string;
};

const FALLBACK = 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400';

export function Favorites() {
    const [items, setItems]   = useState<FavItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadFavs = () => {
        setLoading(true);
        api.get<FavItem[]>('/api/favorites')
            .then(setItems)
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadFavs(); }, []);

    const removeItem = async (id: number) => {
        await api.delete(`/api/favorites/${id}`);
        setItems(prev => prev.filter(i => i.id !== id));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#00C853] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Sevimlilar"
                leftIcon={<ArrowLeft className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                onMenuClick={() => navigate(-1)}
                rightIcon={null}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                {items.length === 0 ? (
                    <EmptyState
                        icon={<Heart className="w-12 h-12 text-gray-300" />}
                        title="No favorites yet"
                        description="Save products you love here"
                        actionText="Browse Products"
                        onAction={() => navigate('/')}
                    />
                ) : (
                    <>
                        <div className="overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5 mb-1">
                            <Chips options={['All']} activeOption="All" />
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            {items.map(item => (
                                <ProductCard
                                    key={item.id}
                                    title={item.title}
                                    price={`$${Number(item.base_price).toFixed(2)}`}
                                    brand={item.brand}
                                    imageUrl={item.image_url ?? FALLBACK}
                                    isFavorite
                                    onClick={() => navigate(`/products/${item.product_id}`)}
                                    actionIcon={
                                        <div className="w-[34px] h-[34px] rounded-full bg-white flex items-center justify-center">
                                            <Trash2 className="w-[16px] h-[16px] text-red-500" strokeWidth={2.2} />
                                        </div>
                                    }
                                    onFavoriteClick={() => removeItem(item.id)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </main>

            <BottomNav activeTab="favorites" />
        </div>
    );
}
