/** How many page numbers appear in one "page" of the pager. */
const PAGES_PER_PAGE = 10;

export type PageToken = number | 'ellipsis';

/**
 * Page numbers in fixed blocks of ten.
 * Page 0 shows `0 1 2 3 4 5 6 7 8 9 ...`, page 10 shows `... 10 11 12 13 14 15 16 17 18 19 ...`.
 */
export function visiblePageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return [];
  const lastPage = totalPages - 1;
  const page = Math.min(Math.max(0, currentPage), lastPage);
  const groupStart = Math.floor(page / PAGES_PER_PAGE) * PAGES_PER_PAGE;
  const groupEnd = Math.min(lastPage, groupStart + PAGES_PER_PAGE - 1);
  const tokens: PageToken[] = [];
  if (groupStart > 0) tokens.push('ellipsis');
  for (let n = groupStart; n <= groupEnd; n++) tokens.push(n);
  if (groupEnd < lastPage) tokens.push('ellipsis');
  return tokens;
}
