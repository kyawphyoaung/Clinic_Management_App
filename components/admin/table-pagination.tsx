"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Base path without query, e.g. /dashboard/patients */
  basePath: string;
  /** Current query params to preserve (excluding page) */
  query: Record<string, string | undefined>;
  /** Show rows-per-page dropdown that updates `pageSize` query param */
  showPageSize?: boolean;
  pageSizeOptions?: number[];
};

function buildHref(
  basePath: string,
  query: Record<string, string | undefined>,
  overrides: Record<string, string | number>
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(overrides)) {
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function TablePagination({
  page,
  totalPages,
  total,
  pageSize,
  basePath,
  query,
  showPageSize = true,
  pageSizeOptions = [20, 50, 100],
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  function onPageSizeChange(nextSize: string) {
    const href = buildHref(basePath, query, { pageSize: nextSize, page: 1 });
    window.location.assign(href);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {from}–{to} of {total}
        </p>
        {showPageSize && (
          <div className="flex items-center gap-2">
            <Label
              htmlFor="pagination-pageSize"
              className="whitespace-nowrap text-sm text-muted-foreground"
            >
              Rows per page
            </Label>
            <Select
              id="pagination-pageSize"
              className="h-8 w-[4.5rem]"
              value={String(pageSize)}
              onChange={(e) => onPageSizeChange(e.target.value)}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={
            page <= 1 ? undefined : (
              <Link href={buildHref(basePath, query, { page: page - 1 })} />
            )
          }
        >
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          render={
            page >= totalPages ? undefined : (
              <Link href={buildHref(basePath, query, { page: page + 1 })} />
            )
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
