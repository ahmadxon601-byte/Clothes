"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, Heart, User } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { id: "home", href: "/", label: "Home", icon: Home },
    { id: "cart", href: "/checkout", label: "Basket", icon: ShoppingBag },
    { id: "favorites", href: "/favorites", label: "Favorites", icon: Heart },
    { id: "profile", href: "/profile", label: "Profile", icon: User }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] px-4 mb-[26px] pointer-events-none">
      <nav className="max-w-md mx-auto bg-[#F5F5F5] shadow-[0_4px_28px_rgba(0,0,0,0.06)] rounded-[32px] border border-gray-100 p-2 flex justify-between items-center pointer-events-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === '/' && pathname === '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={`relative flex items-center justify-center w-[52px] h-[52px] rounded-full transition-all duration-300 active:scale-95 ${isActive
                  ? 'bg-[#00C853] text-[#111827] shadow-[0_2px_8px_rgba(0,200,83,0.3)]'
                  : 'text-[#9CA3AF] hover:text-gray-600'
                }`}
              aria-label={item.label}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
