
interface BottomSheetBarProps {
    totalPrice?: string;
    totalLabel?: string;
    buttonText: string;
    onButtonClick?: () => void;
}

export function BottomSheetBar({
    totalPrice = '$0.00',
    totalLabel = 'Total',
    buttonText,
    onButtonClick
}: BottomSheetBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 pb-[env(safe-area-inset-bottom)]">
            <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between gap-4">
                {totalPrice && (
                    <div className="flex flex-col">
                        <span className="text-sm text-gray-500 font-medium">{totalLabel}</span>
                        <span className="text-xl font-bold text-gray-900">{totalPrice}</span>
                    </div>
                )}

                <button
                    onClick={onButtonClick}
                    className="flex-1 bg-gray-900 text-white font-semibold py-3.5 px-6 flex items-center justify-center rounded-full active:scale-95 transition-transform"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
