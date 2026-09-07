import { describe, it, expect } from 'vitest';
import {
  descriptionForPs2iodbSlug,
  displayNameForPs2iodbTitle,
  formatPs2iodbContributorDescription,
  parsePs2iodbContributors,
  parsePs2iodbTitleContributors,
  parsePs2iodbTitles,
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
  public static Mkca = new Contributor('mkca');
}
`;

  const titlesSrc = `
new Game(\`.hack//Infection Part 1\`, \`dothackinfection\`, 3, [Contributors.ItzCookieX, Contributors.Cajas], 2),
new Game(\`Code Breaker v9.2\`, \`codebreakerv9.2\`, 1, Contributors.Oddworld2001),
new Icon(g, \`Save Data\`, \`acecombat5-normalsave\`, 1, Contributors.Cajas),
new Icon(g, \`Game Data\`, \`katamaridamacy\`, 1, Contributors.Issung),
new Icon(g, 'Game Data', 'talesoftheabyss', 1, Contributors.Rikineko),
new Icon(g, \`Europe, USA\`, \`jurassicparkoperationgenesis-eu+us\`, 1, Contributors.Mkca, null),
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
    expect(descriptionForPs2iodbSlug('codebreakerv9.2', bySlug)).toBe('Contributed by Oddworld-2001');
    expect(descriptionForPs2iodbSlug('jurassicparkoperationgenesis-eu+us', bySlug)).toBe('Contributed by mkca');
  });
});

describe('parsePs2iodbTitles', () => {
  const titlesSrc = `
new Game(\`10 Pin: Champions Alley\`, () => null),
new Game(\`18 Wheeler American Pro Trucker\`),
new Game(\`.hack//Infection Part 1\`, \`dothackinfection\`, 3, [Contributors.ItzCookieX, Contributors.Cajas], 2),
new Game(\`Ace Combat 5: The Unsung War\`, g => [
 new Icon(g, \`Save Data\`, \`acecombat5-normalsave\`, 1, Contributors.Cajas),
 new Icon(g, \`100% Completion\`, \`acecombat5-100pc\`, 1, Contributors.ItzCookieX),
]),
new Game(\`Tales of the Abyss\`, g => [
 new Icon(g, \`Game Data\`, 'talesoftheabyss', 1, Contributors.Rikineko),
]),
`;

  it('maps slugs to game and icon names, skipping titles with no assets', () => {
    const bySlug = parsePs2iodbTitles(titlesSrc);
    expect(bySlug.has('10 Pin: Champions Alley')).toBe(false);
    expect([...bySlug.keys()].sort()).toEqual([
      'acecombat5-100pc',
      'acecombat5-normalsave',
      'dothackinfection',
      'talesoftheabyss',
    ]);
    expect(bySlug.get('dothackinfection')).toEqual({
      slug: 'dothackinfection',
      gameName: '.hack//Infection Part 1',
      iconName: '.hack//Infection Part 1',
    });
    expect(bySlug.get('acecombat5-normalsave')).toEqual({
      slug: 'acecombat5-normalsave',
      gameName: 'Ace Combat 5: The Unsung War',
      iconName: 'Save Data',
    });
    expect(bySlug.get('acecombat5-100pc')).toEqual({
      slug: 'acecombat5-100pc',
      gameName: 'Ace Combat 5: The Unsung War',
      iconName: '100% Completion',
    });
    expect(bySlug.get('talesoftheabyss')).toEqual({
      slug: 'talesoftheabyss',
      gameName: 'Tales of the Abyss',
      iconName: 'Game Data',
    });
  });

  it('uses the game name alone when the icon is the title itself', () => {
    expect(displayNameForPs2iodbTitle({
      slug: 'dothackinfection',
      gameName: '.hack//Infection Part 1',
      iconName: '.hack//Infection Part 1',
    })).toBe('.hack//Infection Part 1');
  });

  it('disambiguates variant icons with the icon name', () => {
    expect(displayNameForPs2iodbTitle({
      slug: 'acecombat5-100pc',
      gameName: 'Ace Combat 5: The Unsung War',
      iconName: '100% Completion',
    })).toBe('Ace Combat 5: The Unsung War (100% Completion)');
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
