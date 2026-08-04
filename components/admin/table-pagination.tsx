import Link from "next/link";
import { Button } from "@/components/ui/button";

type TablePaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Base path without query, e.g. /dashboard/patients */
  basePath: string;
  /** Current query params to preserve (excluding page) */
  query: Record<string, string | undefined>;
};

function buildHref(
  basePath: string,
  query: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  params.set("page", String(page));
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
}: TablePaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          render={
            page <= 1 ? undefined : (
              <Link href={buildHref(basePath, query, page - 1)} />
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
              <Link href={buildHref(basePath, query, page + 1)} />
            )
          }
        >
          Next
        </Button>
      </div>
    </div>
  );
}
