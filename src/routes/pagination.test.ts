import { describe, it, expect } from 'vitest';
import { visiblePageTokens } from '../pagination';

describe('visiblePageTokens', () => {
  it('shows the first block of ten pages', () => {
    expect(visiblePageTokens(0, 152)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      'ellipsis',
    ]);
    expect(visiblePageTokens(9, 152)).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9,
      'ellipsis',
    ]);
  });

  it('shows the next block with ellipses on both sides', () => {
    expect(visiblePageTokens(10, 152)).toEqual([
      'ellipsis',
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      'ellipsis',
    ]);
    expect(visiblePageTokens(50, 152)).toEqual([
      'ellipsis',
      50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
      'ellipsis',
    ]);
  });

  it('shows the partial last block without a trailing ellipsis', () => {
    expect(visiblePageTokens(151, 152)).toEqual([
      'ellipsis',
      150, 151,
    ]);
  });

  it('lists every page when the collection fits in one block', () => {
    expect(visiblePageTokens(3, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(visiblePageTokens(0, 2)).toEqual([0, 1]);
    expect(visiblePageTokens(9, 10)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('returns no tokens when there are no pages', () => {
    expect(visiblePageTokens(0, 0)).toEqual([]);
  });
});
