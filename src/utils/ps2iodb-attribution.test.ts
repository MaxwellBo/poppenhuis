import { describe, it, expect } from 'vitest';
import {
  descriptionForPs2iodbSlug,
  formatPs2iodbContributorDescription,
  parsePs2iodbContributors,
  parsePs2iodbTitleContributors,
  ps2iodbSlugFromStorage,
} from './ps2iodb-attribution';

describe('formatPs2iodbContributorDescription', () => {
  it('matches PS2IODB\'s single-contributor line', () => {
    expect(formatPs2iodbContributorDescription([
      { name: 'Cajas' },
    ])).toBe('Contributed by Cajas');
  });

  it('links contributors that have a URL', () => {
    expect(formatPs2iodbContributorDescription([
      { name: 'Issung', link: 'https://x.com/IssunGee' },
    ])).toBe('Contributed by [Issung](https://x.com/IssunGee)');
  });

  it('joins multiple names with commas and an ampersand, like the PS2IODB header', () => {
    expect(formatPs2iodbContributorDescription([
      { name: 'ItzCookieX', link: 'https://x.com/chocomuku' },
      { name: 'Cajas' },
    ])).toBe('Contributed by [ItzCookieX](https://x.com/chocomuku) & Cajas');
  });
});

describe('parsePs2iodb attribution sources', () => {
  const contributorsSrc = `
export class Contributors {
  public static Issung = new Contributor('Issung', 'https://x.com/IssunGee');
  public static Cajas = new Contributor('Cajas');
  public static ItzCookieX = new Contributor('ItzCookieX', 'https://x.com/chocomuku');
  public static Oddworld2001= new Contributor('Oddworld-2001');
  public static Rikineko = new Contributor('rikineko');
}
`;

  const titlesSrc = `
new Game(\`.hack//Infection Part 1\`, \`dothackinfection\`, 3, [Contributors.ItzCookieX, Contributors.Cajas], 2),
new Icon(g, \`Save Data\`, \`acecombat5-normalsave\`, 1, Contributors.Cajas),
new Icon(g, \`Game Data\`, \`katamaridamacy\`, 1, Contributors.Issung),
new Icon(g, 'Game Data', 'talesoftheabyss', 1, Contributors.Rikineko),
`;

  it('parses contributor names and optional links', () => {
    const byKey = parsePs2iodbContributors(contributorsSrc);
    expect(byKey.Issung).toEqual({ name: 'Issung', link: 'https://x.com/IssunGee' });
    expect(byKey.Cajas).toEqual({ name: 'Cajas' });
    expect(byKey.Oddworld2001).toEqual({ name: 'Oddworld-2001' });
  });

  it('maps icon slugs to contributors', () => {
    const byKey = parsePs2iodbContributors(contributorsSrc);
    const bySlug = parsePs2iodbTitleContributors(titlesSrc, byKey);
    expect(descriptionForPs2iodbSlug('dothackinfection', bySlug)).toBe(
      'Contributed by [ItzCookieX](https://x.com/chocomuku) & Cajas',
    );
    expect(descriptionForPs2iodbSlug('acecombat5-normalsave', bySlug)).toBe('Contributed by Cajas');
    expect(descriptionForPs2iodbSlug('katamaridamacy', bySlug)).toBe(
      'Contributed by [Issung](https://x.com/IssunGee)',
    );
    expect(descriptionForPs2iodbSlug('talesoftheabyss', bySlug)).toBe('Contributed by rikineko');
  });
});

describe('ps2iodbSlugFromStorage', () => {
  it('extracts the icon code from a PS2IODB URL', () => {
    expect(ps2iodbSlugFromStorage('https://ps2iodb.com/icon/acecombatzero')).toBe('acecombatzero');
  });

  it('ignores non-PS2IODB locations', () => {
    expect(ps2iodbSlugFromStorage('https://archive.org/details/100-completed')).toBeUndefined();
  });
});
