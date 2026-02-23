import { TopBar } from '../../components/TopBar';
import { BottomNav } from '../../components/BottomNav';

const CATEGORIES = [
    { id: 1, title: 'New Arrivals', items: '124 items', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400', size: 'large' },
    { id: 2, title: 'Clothing', items: '850 items', imageUrl: 'https://images.unsplash.com/photo-1534969688448-735998a4d4b1?w=400', size: 'small' },
    { id: 3, title: 'Shoes', items: '320 items', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400', size: 'small' },
    { id: 4, title: 'Accessories', items: '210 items', imageUrl: 'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=400', size: 'small' },
    { id: 5, title: 'Bags', items: '150 items', imageUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400', size: 'small' },
];

export function Categories() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            <TopBar title="Categories" />

            <main className="max-w-md mx-auto px-4 pt-6">
                <div className="grid grid-cols-2 gap-4">
                    {CATEGORIES.map((cat) => (
                        <div
                            key={cat.id}
                            className={`relative rounded-[24px] overflow-hidden cursor-pointer active:scale-95 transition-transform shadow-sm
                ${cat.size === 'large' ? 'col-span-2 aspect-[2/1]' : 'col-span-1 aspect-square'}
              `}
                        >
                            <img src={cat.imageUrl} alt={cat.title} className="absolute inset-0 w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/30" />
                            <div className="absolute inset-0 p-5 flex flex-col justify-end">
                                <h3 className="text-white font-bold text-xl mb-1">{cat.title}</h3>
                                <p className="text-white/80 font-medium text-sm">{cat.items}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <BottomNav activeTab="search" />
        </div>
    );
}
