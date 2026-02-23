import { Minus, Plus } from 'lucide-react';

interface StepperProps {
    value: number;
    onChange?: (value: number) => void;
    min?: number;
    max?: number;
}

export function Stepper({ value = 1, onChange, min = 1, max = 99 }: StepperProps) {
    const handleDec = () => {
        if (value > min) onChange?.(value - 1);
    };
    const handleInc = () => {
        if (value < max) onChange?.(value + 1);
    };

    return (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-full p-1.5 shadow-inner">
            <button
                onClick={handleDec}
                disabled={value <= min}
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-50 active:scale-95 transition-all outline-none"
            >
                <Minus className="w-4 h-4" />
            </button>

            <span className="w-8 text-center text-base font-bold text-gray-900">
                {value}
            </span>

            <button
                onClick={handleInc}
                disabled={value >= max}
                className="w-8 h-8 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-700 disabled:opacity-50 active:scale-95 transition-all outline-none"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}
