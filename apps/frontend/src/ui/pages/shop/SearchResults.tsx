import { BottomNav } from '../../components/BottomNav';
import { SearchBar } from '../../components/SearchBar';
import { Chips } from '../../components/Chips';
import { TopBar } from '../../components/TopBar';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';

const FILTERS = ['Jackets', 'Shirts', 'Shoes', 'Pants'];

export function SearchResults() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] pb-32 font-sans selection:bg-[#00C853]/20">
            <TopBar
                title="Qidiruv"
                leftIcon={<ArrowLeft className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
                rightIcon={<SlidersHorizontal className="w-[22px] h-[22px] flex-shrink-0" strokeWidth={2.5} />}
            />

            <main className="max-w-md mx-auto px-5 pt-3">
                <div className="mb-5">
                    <SearchBar placeholder="Mahsulot qidirish" />
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <Chips options={FILTERS} />
                </div>
            </main>

            <BottomNav activeTab="search" />
        </div>
    );
}
