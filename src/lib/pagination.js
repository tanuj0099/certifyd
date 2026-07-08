export function getPaginationParams(searchParams, maxPageSize = 50) {
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10) || 0);
  const pageSize = Math.min(
    maxPageSize,
    parseInt(searchParams.get('pageSize') ?? '20', 10) || 20
  );

  return {
    page,
    pageSize,
    from: page * pageSize,
    to: (page + 1) * pageSize - 1,
  };
}
