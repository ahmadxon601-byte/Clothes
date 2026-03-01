import React from 'react';
import { Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface SearchPillProps extends HTMLMotionProps<'input'> {
    containerClassName?: string;
}

export const SearchPill = React.forwardRef<HTMLInputElement, SearchPillProps>(
    ({ className, containerClassName, ...props }, ref) => {
        return (
            <div className={cn('relative flex items-center w-full max-w-xs', containerClassName)}>
                <Search className="absolute left-3.5 text-muted" size={16} strokeWidth={2} />
                <motion.input
                    ref={ref}
                    whileFocus={{ scale: 1.01 }}
                    className={cn(
                        'w-full bg-pill border border-transparent text-sm text-main placeholder:text-muted rounded-full py-2 pl-10 pr-4 outline-none transition-all duration-200 focus:bg-card focus:border-border focus:ring-4 focus:ring-accent/10 focus:shadow-sm',
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);
SearchPill.displayName = 'SearchPill';
