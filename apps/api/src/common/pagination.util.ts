export function paginate<T>(items: T[], page?: unknown, pageSize?: unknown) {
  const p = Math.max(1, Number(page) || 1);
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const start = (p - 1) * ps;
  return {
    items: items.slice(start, start + ps),
    total: items.length,
    page: p,
    pageSize: ps,
  };
}
