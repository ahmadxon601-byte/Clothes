import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';
import { BannerCard } from '../../components/BannerCard';
import { SectionHeader } from '../../components/SectionHeader';
import { ProductCard } from '../../components/ProductCard';
import { SearchBar } from '../../components/SearchBar';
import { Chips } from '../../components/Chips';
import { Moon, Globe } from 'lucide-react';

const FILTERS = ['All', 'Jackets', 'Shirts', 'Pants'];

const PRODUCTS = [
    { id: 1, title: 'Oversized Wool Coat', price: '$149', brand: 'Loro Piana', imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400', isFavorite: true, badgeText: 'ONLY 3 LEFT' },
    { id: 2, title: 'Cashmere Knit Sweater', price: '$89', brand: 'Theory', imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400' },
    { id: 3, title: 'Classic Tailored Trousers', price: '$120', brand: 'Zegna', imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400' },
    { id: 4, title: 'Leather Chelsea Boots', price: '$195', brand: 'Santoni', imageUrl: 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400' },
];

export function Home() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Clothes MP"
                leftIcon={<Moon className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                rightIcon={<Globe className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                <div className="mb-5">
                    <SearchBar placeholder="Search luxury menswear..." />
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
                        <Chips options={FILTERS} activeOption="All" />
                    </div>
                </div>

                <div className="mb-4">
                    <SectionHeader title="Special for you" onSeeAll={() => { }} />
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                        {PRODUCTS.map(product => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                </div>
            </main>

            <BottomNav activeTab="home" />
        </div>
    );
}
