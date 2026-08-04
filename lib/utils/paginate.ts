export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): {
  pageItems: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
} {
  const size = [20, 50, 100].includes(pageSize) ? pageSize : 20;
  const current = Math.max(1, page);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Math.min(current, totalPages);
  const start = (safePage - 1) * size;
  return {
    pageItems: items.slice(start, start + size),
    total,
    totalPages,
    page: safePage,
    pageSize: size,
  };
}
