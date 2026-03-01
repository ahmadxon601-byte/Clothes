import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

interface Option {
    label: string;
    value: string;
}

export interface SegmentedControlProps {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    name?: string;
}

export const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange, className, name }) => {
    const defaultId = useId();
    const layoutId = `segmented-control-active-${name || defaultId}`;

    return (
        <div className={cn('relative flex bg-pill p-1 rounded-full items-center', className)}>
            {options.map((option) => {
                const isActive = value === option.value;
                return (
                    <button
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'relative z-10 flex-1 px-4 py-1.5 text-sm font-medium transition-colors duration-200 outline-none rounded-full',
                            isActive ? 'text-main' : 'text-muted hover:text-main'
                        )}
                    >
                        {isActive && (
                            <motion.div
                                layoutId={layoutId}
                                className="absolute inset-0 bg-card rounded-full shadow-sm border border-border/50"
                                transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                            />
                        )}
                        <span className="relative z-20">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
};
