import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { BannerCard } from '../../components/BannerCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ProductCard } from '../../components/ProductCard';
import { SearchBar } from '../../components/SearchBar';
import { Chips } from '../../components/Chips';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Moon, Globe } from 'lucide-react';
import { api } from '../../../lib/api';

type ApiProduct = {
    id: string;
    name: string;
    base_price: string;
    store_name: string;
    thumbnail: string | null;
    category_name: string | null;
};

type ApiCategory = { id: string; name: string };

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400';

export function Home() {
    const [products, setProducts]     = useState<ApiProduct[]>([]);
    const [categories, setCategories] = useState<ApiCategory[]>([]);
    const [activeFilter, setFilter]   = useState('All');
    const [loading, setLoading]       = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        api.get<{ name: string; id: string }[]>('/api/categories').then(setCategories).catch(() => {});
    }, []);

    useEffect(() => {
        setLoading(true);
        const catId = categories.find(c => c.name === activeFilter)?.id;
        const url = `/api/products?sort=newest${catId ? `&category=${catId}` : ''}`;
        api.get<{ products: ApiProduct[] }>(url)
            .then(d => setProducts(d.products))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, [activeFilter, categories]);

    const filterOptions = ['All', ...categories.map(c => c.name)];

    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Clothes MP"
                leftIcon={<Moon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                rightIcon={<Globe className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                <div className="mb-5">
                    <SearchBar placeholder="Search products..." />
                </div>

                <div className="mb-6">
                    <BannerCard
                        title="First Purchase Enjoy a Special Offer"
                        subtitle=""
                        badge="Limited Offer"
                        imageUrl="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400"
                    />
                </div>

                <div className="mb-8">
                    <div className="overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
                        <Chips
                            options={filterOptions}
                            activeOption={activeFilter}
                            onOptionSelect={setFilter}
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <SectionHeader title="Special for you" onSeeAll={() => navigate('/search')} />
                    {loading ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-center text-gray-400 py-10">No products found</p>
                    ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                            {products.map(p => (
                                <ProductCard
                                    key={p.id}
                                    title={p.name}
                                    price={`$${Number(p.base_price).toFixed(2)}`}
                                    brand={p.store_name}
                                    imageUrl={p.thumbnail ?? FALLBACK_IMG}
                                    onClick={() => navigate(`/products/${p.id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <BottomNav activeTab="home" />
        </div>
    );
}
