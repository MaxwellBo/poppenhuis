import { describe, it, expect } from 'vitest';
import { visiblePageTokens } from '../pagination';

describe('visiblePageTokens', () => {
  it('shows a window around the current page with ellipses for skipped pages', () => {
    expect(visiblePageTokens(50, 152)).toEqual([
      'ellipsis',
      45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
      'ellipsis',
    ]);
  });

  it('omits the leading ellipsis at the start of the range', () => {
    expect(visiblePageTokens(0, 152)).toEqual([
      0, 1, 2, 3, 4, 5,
      'ellipsis',
    ]);
  });

  it('omits the trailing ellipsis at the end of the range', () => {
    expect(visiblePageTokens(151, 152)).toEqual([
      'ellipsis',
      146, 147, 148, 149, 150, 151,
    ]);
  });

  it('lists every page when the whole range fits in the window', () => {
    expect(visiblePageTokens(3, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(visiblePageTokens(0, 2)).toEqual([0, 1]);
  });

  it('returns no tokens when there are no pages', () => {
    expect(visiblePageTokens(0, 0)).toEqual([]);
  });
});
