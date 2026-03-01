import React from 'react';
import { cn } from '../../lib/utils';
import { motion, HTMLMotionProps } from 'framer-motion';

interface AppCardProps extends HTMLMotionProps<'div'> {
    children: React.ReactNode;
    interactive?: boolean;
}

export const AppCard = React.forwardRef<HTMLDivElement, AppCardProps>(
    ({ className, children, interactive = false, ...props }, ref) => {
        return (
            <motion.div
                ref={ref}
                whileHover={interactive ? { y: -2, scale: 0.995 } : undefined}
                className={cn(
                    'bg-card rounded-2xl border border-border p-6 shadow-premium transition-shadow duration-200',
                    interactive && 'cursor-pointer hover:shadow-premium-hover',
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
AppCard.displayName = 'AppCard';
