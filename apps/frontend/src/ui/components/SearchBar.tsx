import { Search } from 'lucide-react';

interface SearchBarProps {
    placeholder?: string;
}

export function SearchBar({ placeholder = 'Search clothes...' }: SearchBarProps) {
    return (
        <div className="flex items-center w-full">
            <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-[22px] flex items-center pointer-events-none">
                    <Search className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                </div>
                <input
                    type="text"
                    className="w-full bg-white text-[#6b7280] text-[15px] font-medium rounded-full pl-[56px] pr-5 py-[18px] outline-none focus:ring-2 focus:ring-[#00C853] transition-all placeholder:text-gray-400/80 shadow-sm"
                    placeholder={placeholder}
                    defaultValue=""
                />
            </div>
        </div>
    );
}
