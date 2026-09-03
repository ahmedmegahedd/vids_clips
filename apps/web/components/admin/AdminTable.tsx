"use client";

import { EmptyState } from "@/components/admin/EmptyState";
import { cx } from "@/lib/cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  emptyTitle,
  emptyBody,
  emptyAction,
  page,
  pageSize = 10,
  total,
  onPageChange,
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  emptyTitle: string;
  emptyBody: string;
  emptyAction?: { label: string; onClick: () => void };
  page: number;
  pageSize?: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="admin-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[860px] w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--line)] bg-[var(--bg)]/60 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
              {columns.map((col) => (
                <th key={col.key} className={cx("px-4 py-3 whitespace-nowrap", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={cx(
                  "border-b border-[var(--line)] last:border-0",
                  onRowClick && "cursor-pointer hover:bg-[var(--bg)]/70",
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cx("px-4 py-3 align-middle", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <EmptyState title={emptyTitle} body={emptyBody} action={emptyAction} />}
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-3 text-xs text-ink-soft">
          <span>
            Showing {(page - 1) * pageSize + (rows.length ? 1 : 0)}–{(page - 1) * pageSize + rows.length} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-lg p-1.5 hover:bg-[var(--bg-warm)] disabled:opacity-40" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 tabular-nums">
              {page} / {pages}
            </span>
            <button type="button" className="rounded-lg p-1.5 hover:bg-[var(--bg-warm)] disabled:opacity-40" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
