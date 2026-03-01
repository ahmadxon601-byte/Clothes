import React from 'react';
import { AppCard } from './AppCard';

export interface Column<T> {
    header: string;
    accessorKey?: keyof T;
    cell?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    emptyMessage?: React.ReactNode;
    onRowClick?: (item: T) => void;
}

export function DataTable<T>({ data, columns, keyExtractor, isLoading, emptyMessage = 'No data available', onRowClick }: DataTableProps<T>) {
    return (
        <AppCard className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-pill border-b border-border">
                        <tr>
                            {columns.map((col, idx) => (
                                <th key={idx} className="px-6 py-4 font-semibold text-muted tracking-wider uppercase text-xs">
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted">
                                    Loading data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr
                                    key={keyExtractor(row)}
                                    className={`border-b border-border last:border-none transition-colors duration-150 hover:bg-pill/50 ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {columns.map((col, idx) => (
                                        <td key={idx} className="px-6 py-4 text-main whitespace-nowrap">
                                            {col.cell ? col.cell(row) : (col.accessorKey ? String(row[col.accessorKey]) : null)}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </AppCard>
    );
}
