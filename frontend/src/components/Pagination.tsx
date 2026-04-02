'use client';

import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PaginationProps {
    totalCount: number;
    pageSize: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function Pagination({
    totalCount,
    pageSize,
    currentPage,
    onPageChange,
    className
}: PaginationProps) {
    const totalPages = Math.ceil(totalCount / pageSize);

    if (totalPages <= 1) return null;

    const renderPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Complex logic for many pages (1 ... 4 5 6 ... 10)
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === '...') {
                return (
                    <div key={`dots-${index}`} className="flex h-9 w-9 items-center justify-center">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                    </div>
                );
            }

            const active = page === currentPage;
            return (
                <Button
                    key={page}
                    variant={active ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onPageChange(page as number)}
                    className={cn(
                        "h-9 w-9 rounded-xl font-bold transition-all",
                        active 
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
                            : "text-slate-600 hover:bg-slate-100 hover:text-indigo-600"
                    )}
                >
                    {page}
                </Button>
            );
        });
    };

    return (
        <div className={cn("flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4", className)}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing <span className="text-slate-700">{Math.min((currentPage - 1) * pageSize + 1, totalCount)}</span> to <span className="text-slate-700">{Math.min(currentPage * pageSize, totalCount)}</span> of <span className="text-slate-700">{totalCount}</span> results
            </p>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="h-9 w-9 rounded-xl p-0"
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                    {renderPageNumbers()}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="h-9 w-9 rounded-xl p-0"
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
