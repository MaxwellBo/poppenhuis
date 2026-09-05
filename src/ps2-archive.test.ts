import { describe, it, expect } from 'vitest';
import { PS2_SAVE_ICONS_COLLECTION } from './ps2-archive';
import { ps2iodbSlugFromStorage } from './utils/ps2iodb-attribution';

describe('PS2 save-icon archive', () => {
  it('puts PS2IODB contributor attribution in the description field', () => {
    const fromPs2iodb = PS2_SAVE_ICONS_COLLECTION.items.filter((item) =>
      ps2iodbSlugFromStorage(item.storageLocation),
    );
    expect(fromPs2iodb.length).toBeGreaterThan(0);
    const missing = fromPs2iodb.filter((item) => !item.description?.startsWith('Contributed by '));
    expect(missing.map((item) => item.id)).toEqual([]);
  });

  it('does not invent contributor credits for locally converted saves', () => {
    const local = PS2_SAVE_ICONS_COLLECTION.items.filter((item) =>
      item.storageLocation && !ps2iodbSlugFromStorage(item.storageLocation),
    );
    expect(local.length).toBeGreaterThan(0);
    expect(local.every((item) => !item.description)).toBe(true);
  });
});
