
export function SkeletonCard() {
    return (
        <div className="w-full animate-pulse">
            <div className="relative aspect-[3/4] w-full rounded-[24px] bg-gray-200 mb-3"></div>
            <div className="px-1">
                <div className="h-3 bg-gray-200 rounded-full w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-3"></div>
                <div className="h-5 bg-gray-200 rounded-full w-1/2"></div>
            </div>
        </div>
    );
}

export function SkeletonList() {
    return (
        <div className="flex flex-col gap-4 animate-pulse">
            {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                    <div className="w-20 h-20 rounded-[16px] bg-gray-200 shrink-0"></div>
                    <div className="flex flex-col flex-1 py-1">
                        <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded-full w-1/2 mb-auto"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-1/4"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
