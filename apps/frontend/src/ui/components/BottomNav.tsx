import { Home, Search, Heart, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BottomNavProps {
    activeTab?: 'home' | 'search' | 'favorites' | 'profile';
}

const NAV_ITEMS = [
    { id: 'home',      icon: Home,   label: 'Home',      to: '/' },
    { id: 'search',    icon: Search, label: 'Search',    to: '/search' },
    { id: 'favorites', icon: Heart,  label: 'Favorites', to: '/favorites' },
    { id: 'profile',   icon: User,   label: 'Profile',   to: '/profile' },
] as const;

export function BottomNav({ activeTab }: BottomNavProps) {
    const { pathname } = useLocation();

    const resolveActive = (id: string, to: string) => {
        if (activeTab) return activeTab === id;
        if (to === '/') return pathname === '/';
        return pathname.startsWith(to);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] px-4 mb-[26px]">
            <nav className="max-w-md mx-auto bg-[#F5F5F5] shadow-[0_4px_28px_rgba(0,0,0,0.06)] rounded-[32px] border border-gray-100 p-2 flex justify-between items-center">
                {NAV_ITEMS.map(({ id, icon: Icon, label, to }) => {
                    const isActive = resolveActive(id, to);
                    return (
                        <Link
                            key={id}
                            to={to}
                            className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all duration-300 active:scale-95 ${
                                isActive
                                    ? 'bg-[#00C853] text-[#111827] shadow-[0_2px_8px_rgba(0,200,83,0.3)]'
                                    : 'text-[#9CA3AF] hover:text-gray-600'
                            }`}
                        >
                            <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                            <span className="sr-only">{label}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
