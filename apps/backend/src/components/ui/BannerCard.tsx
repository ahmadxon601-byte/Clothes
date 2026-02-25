import { ArrowRight } from "lucide-react";

interface BannerCardProps {
    title?: string;
    subtitle?: string;
    badge?: string;
    imageUrl?: string;
    onClick?: () => void;
}

export function BannerCard({
    title = "New Arrival",
    subtitle = "Discover the latest trends in fashion",
    badge = "Limited Offer",
    imageUrl = "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800",
    onClick
}: BannerCardProps) {
    return (
        <div
            onClick={onClick}
            className="w-full rounded-[24px] overflow-hidden cursor-pointer active:scale-[0.98] transition-transform flex"
        >
            <div className="bg-[#a3e635] p-5 flex flex-col justify-between w-[50%] relative min-h-[170px]">
                {badge && (
                    <span className="self-start inline-block px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full mb-3">
                        {badge}
                    </span>
                )}

                <div className="text-black mb-3">
                    <h2 className="text-[18px] font-extrabold mb-1 leading-[1.15]">{title}</h2>
                    {subtitle && <p className="text-black/80 text-[13px] font-medium leading-snug">{subtitle}</p>}
                </div>

                <div className="inline-flex items-center gap-2 text-[13px] font-bold text-white bg-black px-4 py-2 rounded-full self-start">
                    Shop Now <ArrowRight className="w-[14px] h-[14px]" />
                </div>

                <div className="absolute bottom-2 -right-3 flex items-center gap-1 z-20">
                    <div className="w-[4px] h-[4px] rounded-full bg-white/40"></div>
                    <div className="w-[12px] h-[4px] rounded-full bg-white relative -left-1"></div>
                </div>
            </div>

            <div className="w-[50%] bg-[#E8EDE6] relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
            </div>
        </div>
    );
}
