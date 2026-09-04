import { describe, it, expect } from 'vitest';
import { dump, load } from './yaml.ts';

describe('yaml helpers', () => {
  it('parses simple item frontmatter', () => {
    const parsed = load(`
manufacturer: Debbie
captureMethod: LiDAR
material:
  - clay
  - glaze
`);
    expect(parsed).toEqual({
      manufacturer: 'Debbie',
      captureMethod: 'LiDAR',
      material: ['clay', 'glaze'],
    });
  });

  it('round-trips an item-like object for edit links', () => {
    const item = {
      id: 'bear',
      name: 'bear',
      model: '/assets/goldens/bear.glb',
      manufacturer: 'Leaonie',
    };
    const parsed = load(dump(item));
    expect(parsed).toEqual(item);
  });
});
