'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function usePagination<T>(items: T[], pageSize = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, currentPage, pageSize]);

  return {
    page: currentPage,
    pageCount,
    setPage,
    pagedItems,
    hasPrev: currentPage > 1,
    hasNext: currentPage < pageCount,
  };
}

type PaginationControlsProps = {
  page: number;
  pageCount: number;
  setPage: (page: number | ((page: number) => number)) => void;
  hasPrev: boolean;
  hasNext: boolean;
  total: number;
  visible: number;
};

export function PaginationControls({ page, pageCount, setPage, hasPrev, hasNext, total, visible }: PaginationControlsProps) {
  const pageNumbers = useMemo(() => {
    if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1) as (number | 'ellipsis')[];
    const pages: (number | 'ellipsis')[] = [1];
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(pageCount - 1, page + 1); i++) pages.push(i);
    if (page < pageCount - 2) pages.push('ellipsis');
    pages.push(pageCount);
    return pages;
  }, [page, pageCount]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <div className="flex items-center gap-1">
        <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={!hasPrev} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40" aria-label="Halaman sebelumnya">
          <ChevronLeft className="w-4 h-4" /> Sebelum
        </button>
        {pageNumbers.map((number, index) => number === 'ellipsis' ? (
          <span key={index} className="inline-flex w-10 items-center justify-center text-text-muted">…</span>
        ) : (
          <button key={index} onClick={() => setPage(number)} aria-current={number === page ? 'page' : undefined} className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${number === page ? 'bg-primary text-white' : 'border border-border bg-white text-text hover:bg-surface-variant'}`}>
            {number}
          </button>
        ))}
        <button onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={!hasNext} className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-variant disabled:opacity-40" aria-label="Halaman selanjutnya">
          Sesudah <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

type PaginatedTableProps = {
  columns: ReactNode;
  rows: ReactNode[];
  pageSize?: number;
  className?: string;
};

export function PaginatedTable({ columns, rows, pageSize = 10, className }: PaginatedTableProps) {
  const { page, setPage, pagedItems, pageCount, hasPrev, hasNext } = usePagination(rows, pageSize);

  return (
    <div className={`bg-surface-card border border-border rounded-xl overflow-hidden ${className ?? ''}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-muted border-b border-border bg-surface-variant/40">
              {columns}
            </tr>
          </thead>
          <tbody>
            {pagedItems}
          </tbody>
        </table>
      </div>
      <PaginationControls {...{
        page,
        pageCount,
        setPage,
        hasPrev,
        hasNext,
        total: rows.length,
        visible: pagedItems.length,
      }} />
    </div>
  );
}