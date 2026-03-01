import React from 'react';
import { AppCard } from './AppCard';
import { StatusBadge } from './StatusBadge';
import { MoreVertical } from 'lucide-react';
import { IconButton } from './IconButton';

export interface CardListItemProps {
    id: string;
    title: string;
    subtitle?: string;
    status?: { label: string; value: 'active' | 'pending' | 'rejected' | 'neutral' };
    metadata?: React.ReactNode;
    onAction?: (id: string) => void;
}

export interface CardListProps {
    items: CardListItemProps[];
    emptyMessage?: string;
}

export const CardList: React.FC<CardListProps> = ({ items, emptyMessage = 'No items found' }) => {
    if (!items.length) {
        return (
            <div className="flex items-center justify-center p-8 bg-card rounded-2xl border border-border text-muted text-sm">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {items.map((item) => (
                <AppCard key={item.id} className="p-4" interactive>
                    <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-semibold text-main">{item.title}</h4>
                            {item.subtitle && <p className="text-xs text-muted font-medium">{item.subtitle}</p>}
                            {item.metadata && <div className="mt-2 text-xs text-muted">{item.metadata}</div>}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            {item.status && <StatusBadge status={item.status.value} label={item.status.label} />}
                            {item.onAction && (
                                <IconButton size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); item.onAction!(item.id); }}>
                                    <MoreVertical size={16} />
                                </IconButton>
                            )}
                        </div>
                    </div>
                </AppCard>
            ))}
        </div>
    );
};
