import { Menu, ShoppingBag } from 'lucide-react';

interface TopBarProps {
    title?: string;
    onMenuClick?: () => void;
    onCartClick?: () => void;
    cartCount?: number;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export function TopBar({ title = 'Marketplace', onMenuClick, onCartClick, cartCount = 0, leftIcon, rightIcon }: TopBarProps) {
    return (
        <header className="sticky top-0 z-40 w-full bg-[#F5F5F5]/90 backdrop-blur-md">
            <div className="flex items-center justify-between px-5 h-24 max-w-md mx-auto pt-6 pb-2">
                <button
                    onClick={onMenuClick}
                    className="w-[52px] h-[52px] flex flex-shrink-0 items-center justify-center bg-white text-gray-900 rounded-full shadow-sm transition-colors active:scale-95"
                >
                    {leftIcon || <Menu className="w-5 h-5 flex-shrink-0" />}
                </button>

                <h1 className="text-[20px] font-extrabold text-[#111827] tracking-tight truncate flex-1 text-center px-4">
                    {title}
                </h1>

                {rightIcon !== null ? (
                    <button
                        onClick={onCartClick}
                        className="relative w-[52px] h-[52px] flex flex-shrink-0 items-center justify-center bg-white text-gray-900 rounded-full shadow-sm transition-colors active:scale-95"
                    >
                        {rightIcon || <ShoppingBag className="w-5 h-5 flex-shrink-0" />}
                        {cartCount > 0 && !rightIcon && (
                            <span className="absolute top-1 right-2 w-4 h-4 bg-[#00C853] text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </button>
                ) : (
                    <div className="w-[52px] h-[52px] flex-shrink-0" />
                )}
            </div>
        </header>
    );
}
