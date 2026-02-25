import { Heart } from 'lucide-react';

interface ProductCardProps {
    title: string;
    price: string;
    brand?: string;
    imageUrl: string;
    isFavorite?: boolean;
    badgeText?: string;
    actionIcon?: React.ReactNode;
    onFavoriteClick?: () => void;
    onClick?: () => void;
} 



export function ProductCard({
    title,
    price,
    brand,
    imageUrl,
    isFavorite = false,
    badgeText,
    actionIcon,
    onFavoriteClick,
    onClick
}: ProductCardProps) {
    return (
        <div className="group cursor-pointer bg-white p-[14px] rounded-[32px] shadow-sm flex flex-col h-full border border-gray-100/50" onClick={onClick}>
            <div className="relative aspect-[4/5] w-full rounded-[24px] overflow-hidden mb-4 bg-[#F5F5F5] border border-gray-100/30">
                <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteClick?.();
                    }}
                    className={`
            absolute top-3 right-3 w-[34px] h-[34px] rounded-full flex items-center justify-center 
            bg-white shadow-sm border border-gray-100/50 transition-all active:scale-90 z-20
          `}
                >
                    {actionIcon || (
                        <Heart className={`w-[18px] h-[18px] ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} strokeWidth={isFavorite ? 2 : 2.5} />
                    )}
                </button>

                {badgeText && (
                    <div className="absolute bottom-3 left-3 z-10">
                        <span className="bg-[#00C853] text-[#111827] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-sm whitespace-nowrap tracking-wide">
                            {badgeText}
                        </span>
                    </div>
                )}
            </div>

            <div className="px-1 flex-grow flex flex-col">
                {brand && <p className="text-xs font-medium text-gray-400 mb-1">{brand}</p>}
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 flex-grow">{title}</h3>
                <p className="text-base font-extrabold text-gray-900 mt-auto">{price}</p>
            </div>
        </div>
    );
}
