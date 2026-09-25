/** Pages shown on either side of the current page before the rest collapse to "...". */
const PAGE_NEIGHBOR_COUNT = 5;

export type PageToken = number | 'ellipsis';

/** Window of page numbers around the current page, with ellipses for skipped ranges. */
export function visiblePageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return [];
  const lastPage = totalPages - 1;
  const start = Math.max(0, currentPage - PAGE_NEIGHBOR_COUNT);
  const end = Math.min(lastPage, currentPage + PAGE_NEIGHBOR_COUNT);
  const tokens: PageToken[] = [];
  if (start > 0) tokens.push('ellipsis');
  for (let page = start; page <= end; page++) tokens.push(page);
  if (end < lastPage) tokens.push('ellipsis');
  return tokens;
}
