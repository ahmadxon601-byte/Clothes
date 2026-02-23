
interface ChipsProps {
    options: string[];
    activeOption?: string;
    onOptionSelect?: (option: string) => void;
}

export function Chips({ options, activeOption, onOptionSelect }: ChipsProps) {
    return (
        <div className="flex gap-2.5">
            {options.map((option) => {
                const isActive = option === activeOption;
                return (
                    <button
                        key={option}
                        onClick={() => onOptionSelect?.(option)}
                        className={`
              whitespace-nowrap px-6 py-2.5 rounded-[40px] text-[15px] font-semibold transition-all active:scale-95
              ${isActive
                                ? 'bg-[#111827] text-white shadow-sm'
                                : 'bg-white text-gray-500 border border-white hover:border-gray-200'
                            }
            `}
                    >
                        {option}
                    </button>
                );
            })}
        </div>
    );
}
