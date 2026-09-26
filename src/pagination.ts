/** Current page stays in this many steps of the range head before the head advances. */
const HEAD_STRIDE = 5;
/** Page numbers shown starting at the head, including the head. */
const WINDOW_LENGTH = 11;

export type PageToken = number | 'ellipsis';

/**
 * A range of upcoming page numbers.
 * Pages 0–4 show `0 1 2 3 4 5 6 7 8 9 10 ...`.
 * Page 5 makes 5 the head: `... 5 6 7 8 9 10 11 12 13 14 15 ...`.
 * The head then advances every five pages, so the current page is never the end of the list.
 */
export function visiblePageTokens(currentPage: number, totalPages: number): PageToken[] {
  if (totalPages <= 0) return [];
  const lastPage = totalPages - 1;
  const page = Math.min(Math.max(0, currentPage), lastPage);
  const head = Math.floor(page / HEAD_STRIDE) * HEAD_STRIDE;
  const end = Math.min(lastPage, head + WINDOW_LENGTH - 1);
  const tokens: PageToken[] = [];
  if (head > 0) tokens.push('ellipsis');
  for (let n = head; n <= end; n++) tokens.push(n);
  if (end < lastPage) tokens.push('ellipsis');
  return tokens;
}
