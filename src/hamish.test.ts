import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { FIRST_PARTY_MANIFEST } from './manifest';

describe('Hamish 3DS Home Menu collection', () => {
  const hamish = FIRST_PARTY_MANIFEST.find((user) => user.id === 'hamish');
  const collection = hamish?.collections.find((c) => c.id === '3ds-home-menu');

  it('is vendored as a first-party user', () => {
    expect(hamish?.name).toBe('Hamish');
    expect(collection?.name).toBe('3DS Home Menu');
    expect(collection?.items.map((item) => item.id).sort()).toEqual([
      'oot-3d',
      'super-mario-3d-land',
    ]);
  });

  it('points each item at a golden GLB in the repo', () => {
    expect(collection).toBeDefined();
    const missing = (collection?.items ?? []).filter((item) => {
      const expected = `/assets/goldens/hamish_3ds-home-menu_${item.id}.glb`;
      return item.model !== expected || !existsSync(`public${expected}`);
    });
    expect(missing.map((item) => item.id)).toEqual([]);
  });

  it('does not keep Firebase Storage URLs for models', () => {
    const remote = (collection?.items ?? []).filter((item) =>
      item.model.startsWith('http'),
    );
    expect(remote.map((item) => item.id)).toEqual([]);
  });
});
