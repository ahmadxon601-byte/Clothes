import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

export interface IconButtonProps extends HTMLMotionProps<'button'> {
    size?: 'sm' | 'md' | 'lg';
    variant?: 'soft' | 'ghost' | 'primary';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    ({ className, size = 'md', variant = 'soft', children, ...props }, ref) => {

        const sizes = {
            sm: 'w-8 h-8',
            md: 'w-10 h-10',
            lg: 'w-12 h-12',
        };

        const variants = {
            soft: 'bg-pill text-main hover:bg-border',
            ghost: 'bg-transparent text-muted hover:bg-pill hover:text-main',
            primary: 'bg-accent text-white hover:bg-accent-hover shadow-md',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                    'inline-flex items-center justify-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent/50 flex-shrink-0',
                    sizes[size],
                    variants[variant],
                    className
                )}
                {...props}
            >
                {children}
            </motion.button>
        );
    }
);
IconButton.displayName = 'IconButton';
