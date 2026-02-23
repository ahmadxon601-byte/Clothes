import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    actionText?: string;
    onAction?: () => void;
}

export function EmptyState({
    icon = <PackageOpen className="w-16 h-16 text-gray-300" />,
    title,
    description,
    actionText,
    onAction
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="mb-6 bg-gray-50 p-6 rounded-full">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            {description && (
                <p className="text-gray-500 text-sm max-w-xs mb-8">
                    {description}
                </p>
            )}
            {actionText && (
                <button
                    onClick={onAction}
                    className="bg-gray-900 text-white font-semibold py-3.5 px-8 rounded-full active:scale-95 transition-transform shadow-md"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
}
