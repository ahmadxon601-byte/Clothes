import { Home, Search, Heart, User } from 'lucide-react';

interface BottomNavProps {
    activeTab?: 'home' | 'search' | 'favorites' | 'profile';
}

export function BottomNav({ activeTab = 'home' }: BottomNavProps) {
    const navItems = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'search', icon: Search, label: 'Search' },
        { id: 'favorites', icon: Heart, label: 'Favorites' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] px-4 mb-[26px]">
            <nav className="max-w-md mx-auto bg-[#F5F5F5] shadow-[0_4px_28px_rgba(0,0,0,0.06)] rounded-[32px] border border-gray-100 p-2 flex justify-between items-center">
                {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;

                    return (
                        <a
                            key={item.id}
                            href="#"
                            className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all duration-300 active:scale-95 ${isActive ? 'bg-[#00C853] text-[#111827] shadow-[0_2px_8px_rgba(0,200,83,0.3)]' : 'text-[#9CA3AF] hover:text-gray-600'
                                }`}
                        >
                            <Icon className={`w-[22px] h-[22px]`} strokeWidth={isActive ? 2.5 : 2} />
                            {/* Invisible label for accessibility */}
                            <span className="sr-only">{item.label}</span>
                        </a>
                    );
                })}
            </nav>
        </div>
    );
}
