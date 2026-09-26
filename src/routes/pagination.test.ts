import { describe, it, expect } from 'vitest';
import { visiblePageTokens } from '../pagination';

const firstRange = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'ellipsis'];
const fromFive = ['ellipsis', 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 'ellipsis'];

describe('visiblePageTokens', () => {
  it('shows 0 through 10 while the current page is 0, 1, 2, 3, or 4', () => {
    for (const page of [0, 1, 2, 3, 4]) {
      expect(visiblePageTokens(page, 152)).toEqual(firstRange);
    }
  });

  it('makes 5 the head and keeps later pages visible', () => {
    for (const page of [5, 6, 7, 8, 9]) {
      expect(visiblePageTokens(page, 152)).toEqual(fromFive);
    }
  });

  it('advances the head at page 10 so that page is not the end of the list', () => {
    expect(visiblePageTokens(10, 152)).toEqual([
      'ellipsis',
      10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      'ellipsis',
    ]);
  });

  it('shows a partial tail without a trailing ellipsis', () => {
    expect(visiblePageTokens(148, 152)).toEqual([
      'ellipsis',
      145, 146, 147, 148, 149, 150, 151,
    ]);
    expect(visiblePageTokens(151, 152)).toEqual(['ellipsis', 150, 151]);
  });

  it('lists every page when the collection fits in the window', () => {
    expect(visiblePageTokens(3, 8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    expect(visiblePageTokens(0, 2)).toEqual([0, 1]);
    expect(visiblePageTokens(4, 11)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('returns no tokens when there are no pages', () => {
    expect(visiblePageTokens(0, 0)).toEqual([]);
  });
});
