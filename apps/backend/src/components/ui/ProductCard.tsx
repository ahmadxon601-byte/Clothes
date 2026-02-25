import { Heart } from 'lucide-react';

interface ProductCardProps {
    id: string;
    name: string;
    price: string | number;
    brand?: string;
    image: string;
    isFavorite?: boolean;
    badgeText?: string;
    actionIcon?: React.ReactNode;
    onFavoriteClick?: (id: string) => void;
    onClick?: (id: string) => void;
}

export function ProductCard({
    id,
    name,
    price,
    brand,
    image,
    isFavorite = false,
    badgeText,
    actionIcon,
    onFavoriteClick,
    onClick
}: ProductCardProps) {
    return (
        <div className="group cursor-pointer bg-white p-[14px] rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col h-full border border-gray-100/50" onClick={() => onClick?.(id)}>
            <div className="relative aspect-[4/5] w-full rounded-[24px] overflow-hidden mb-4 bg-[#F5F5F5] border border-gray-100/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onFavoriteClick?.(id);
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
                        <span className="bg-[#00C853] text-[#111827] text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-[0_2px_8px_rgba(0,200,83,0.3)] whitespace-nowrap tracking-wide leading-none">
                            {badgeText}
                        </span>
                    </div>
                )}
            </div>

            <div className="px-1 flex-grow flex flex-col">
                {brand && <p className="text-[11px] font-medium text-gray-400 mb-0.5">{brand}</p>}
                <h3 className="text-[14px] font-bold text-[#111827] leading-snug line-clamp-2 mb-2 flex-grow">{name}</h3>
                <p className="text-[16px] font-extrabold text-[#111827] mt-auto">${price}</p>
            </div>
        </div>
    );
}
