import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { PS2_SAVE_ICONS_COLLECTION } from './ps2-archive';
import { ps2iodbSlugFromStorage } from './utils/ps2iodb-attribution';

describe('PS2 save-icon archive', () => {
  it('lists items alphabetically by name', () => {
    const names = PS2_SAVE_ICONS_COLLECTION.items.map((item) => item.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('is the full PS2IODB catalog, not a mixed local conversion', () => {
    expect(PS2_SAVE_ICONS_COLLECTION.items.length).toBeGreaterThan(800);
    const ids = PS2_SAVE_ICONS_COLLECTION.items.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain('crazytaxi');
    expect(ids).toContain('jakanddaxter1');
    expect(ids).not.toContain('crazy-taxi');
    expect(ids).not.toContain('jak-and-daxter');
    const notPs2iodb = PS2_SAVE_ICONS_COLLECTION.items.filter((item) =>
      !ps2iodbSlugFromStorage(item.storageLocation),
    );
    expect(notPs2iodb.map((item) => item.id)).toEqual([]);
  });

  it('puts PS2IODB contributor attribution in the description field', () => {
    const missing = PS2_SAVE_ICONS_COLLECTION.items.filter((item) =>
      !item.description?.startsWith('Contributed by '),
    );
    expect(missing.map((item) => item.id)).toEqual([]);
  });

  it('points each item at a golden GLB named after its PS2IODB slug', () => {
    const missing = PS2_SAVE_ICONS_COLLECTION.items.filter((item) => {
      const expected = `/assets/goldens/ps2_save-icons_${item.id}.glb`;
      return item.model !== expected || !existsSync(`public${expected}`);
    });
    expect(missing.map((item) => item.id)).toEqual([]);
  });
});
