import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
} from '@tanstack/react-table';
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from './LoadingSkeleton';
import EmptyState from './EmptyState';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    isLoading?: boolean;
    pagination?: {
        pageIndex: number;
        pageSize: number;
        total: number;
        onPageChange: (page: number) => void;
        onPageSizeChange: (pageSize: number) => void;
    };
    hidePagination?: boolean;
    emptyMessage?: React.ReactNode;
    rowSelection?: Record<string, boolean>;
    onRowSelectionChange?: (rowSelection: Record<string, boolean>) => void;
}

export default function DataTable<TData, TValue>({
    columns,
    data,
    isLoading = false,
    pagination,
    hidePagination = false,
    emptyMessage = 'Aucune donnée disponible',
    rowSelection,
    onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);

    // Internal state for selection if not controlled (optional, but for now let's assume controlled if props provided)
    // Actually useReactTable handles this well.

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: setSorting,
        onRowSelectionChange: (updater) => {
            if (onRowSelectionChange) {
                // Updater can be a function or value. usage: setRowSelection(updater)
                // We need to handle it. React Table uses updater pattern similar to setState.
                if (typeof updater === 'function') {
                    onRowSelectionChange(updater(rowSelection || {}));
                } else {
                    onRowSelectionChange(updater);
                }
            }
        },
        state: {
            sorting,
            rowSelection: rowSelection || {},
        },
        manualPagination: !!pagination,
        pageCount: pagination ? Math.ceil(pagination.total / pagination.pageSize) : undefined,
    });

    if (isLoading) {
        return <TableSkeleton rows={5} />;
    }

    if (!data.length) {
        if (typeof emptyMessage === 'string') {
            return <EmptyState title={emptyMessage} />;
        }
        return <>{emptyMessage}</>;
    }

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : table.getPageCount();
    const currentPage = pagination ? pagination.pageIndex : table.getState().pagination.pageIndex;

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="rounded-md border">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={
                                                    header.column.getCanSort()
                                                        ? 'flex items-center gap-2 cursor-pointer select-none hover:text-foreground'
                                                        : ''
                                                }
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <ArrowUpDown className="w-4 h-4" />
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-t hover:bg-muted/30 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <td key={cell.id} className="px-4 py-3 text-sm">
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!hidePagination && (pagination || table.getPageCount() > 1) && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {pagination ? (
                            <>
                                Page {currentPage + 1} sur {totalPages} ({pagination.total} résultats)
                            </>
                        ) : (
                            <>
                                Page {currentPage + 1} sur {totalPages}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination ? pagination.onPageChange(0) : table.setPageIndex(0)}
                            disabled={currentPage === 0}
                        >
                            <ChevronsLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination ? pagination.onPageChange(currentPage - 1) : table.previousPage()}
                            disabled={currentPage === 0}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination ? pagination.onPageChange(currentPage + 1) : table.nextPage()}
                            disabled={currentPage >= totalPages - 1}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => pagination ? pagination.onPageChange(totalPages - 1) : table.setPageIndex(totalPages - 1)}
                            disabled={currentPage >= totalPages - 1}
                        >
                            <ChevronsRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
