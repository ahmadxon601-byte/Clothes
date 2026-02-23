
interface SectionHeaderProps {
    title: string;
    onSeeAll?: () => void;
}

export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-4 mt-6">
            <h2 className="text-[20px] font-extrabold text-[#111827] tracking-tight">{title}</h2>
            {onSeeAll && (
                <button
                    onClick={onSeeAll}
                    className="text-sm font-bold text-[#00C853] hover:text-[#00C853]/80 active:scale-95 transition-all"
                >
                    See All
                </button>
            )}
        </div>
    );
}
