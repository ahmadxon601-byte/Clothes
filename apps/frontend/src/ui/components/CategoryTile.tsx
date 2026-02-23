
interface CategoryTileProps {
    title: string;
    imageUrl?: string;
    icon?: React.ReactNode;
    isActive?: boolean;
    onClick?: () => void;
}

export function CategoryTile({ title, imageUrl, icon, isActive, onClick }: CategoryTileProps) {
    return (
        <div
            onClick={onClick}
            className={`flex items-center justify-center px-6 py-3 rounded-full cursor-pointer active:scale-95 transition-all
                ${isActive ? 'bg-[#111827] shadow-md' : 'bg-white border border-gray-100 shadow-sm hover:bg-gray-50'}`}
        >
            <div className="hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-gray-600">{icon}</span>
                )}
            </div>
            <span className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                {title}
            </span>
        </div>
    );
}
