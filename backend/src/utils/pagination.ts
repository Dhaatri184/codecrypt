export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export function parsePaginationParams(query: any): Required<PaginationParams> {
  const page = Math.max(1, parseInt(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize) || 20));

  return { page, pageSize };
}

export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  const hasMore = page < totalPages;

  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasMore,
  };
}

export function calculateOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}
