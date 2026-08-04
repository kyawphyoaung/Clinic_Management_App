"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type SimplePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  basePath: string;
  query: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  query: Record<string, string | undefined>,
  page: number,
  pageSize?: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
  if (pageSize) params.set("pageSize", String(pageSize));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function SimplePaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  basePath,
  query,
}: SimplePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const queryWithoutPage = { ...query };
  delete queryWithoutPage.page;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          {Object.entries(queryWithoutPage).map(([k, v]) =>
            v ? <input key={k} type="hidden" name={k} value={v} /> : null
          )}
          <Label htmlFor="pageSize" className="text-xs text-muted-foreground">
            Rows
          </Label>
          <Select
            id="pageSize"
            name="pageSize"
            defaultValue={String(pageSize)}
            className="h-8 w-20"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
          <input type="hidden" name="page" value="1" />
        </form>
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={
            page <= 1 ? undefined : (
              <Link href={buildHref(basePath, queryWithoutPage, page - 1, pageSize)} />
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
            page >= totalPages
              ? undefined
              : (
                  <Link
                    href={buildHref(basePath, queryWithoutPage, page + 1, pageSize)}
                  />
                )
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
