/** PS2IODB contributor credit, matching the "Contributed by …" line on icon pages. */

export interface Ps2iodbContributor {
  name: string;
  link?: string;
}

const PS2IODB_ICON_URL = /^https:\/\/ps2iodb\.com\/icon\/([^/?#]+)/;

export function ps2iodbSlugFromStorage(storageLocation?: string): string | undefined {
  const match = storageLocation?.match(PS2IODB_ICON_URL);
  return match?.[1];
}

export function formatPs2iodbContributorDescription(contributors: Ps2iodbContributor[]): string {
  const names = contributors
    .filter((contributor) => contributor.name.trim())
    .map((contributor) => (
      contributor.link ? `[${contributor.name}](${contributor.link})` : contributor.name
    ));
  if (names.length === 0) return '';
  if (names.length === 1) return `Contributed by ${names[0]}`;
  const last = names[names.length - 1];
  return `Contributed by ${names.slice(0, -1).join(', ')} & ${last}`;
}

export function parsePs2iodbContributors(source: string): Record<string, Ps2iodbContributor> {
  const byKey: Record<string, Ps2iodbContributor> = {};
  const re = /public static (\w+)\s*=\s*new Contributor\('((?:\\'|[^'])*)'(?:,\s*'((?:\\'|[^'])*)')?\)/g;
  for (const match of source.matchAll(re)) {
    byKey[match[1]] = { name: match[2], ...(match[3] ? { link: match[3] } : {}) };
  }
  return byKey;
}

/** Map PS2IODB icon slug (the `/icon/:code` path) to its listed contributors. */
export function parsePs2iodbTitleContributors(
  titlesSource: string,
  contributorsByKey: Record<string, Ps2iodbContributor>,
): Map<string, Ps2iodbContributor[]> {
  const bySlug = new Map<string, Ps2iodbContributor[]>();
  const re = /[`']([A-Za-z0-9_.+-]+)[`']\s*,\s*[123]\s*,\s*(\[[^\]]*Contributors\.[^\]]*\]|Contributors\.\w+)/g;
  for (const match of titlesSource.matchAll(re)) {
    const slug = match[1];
    const keys = [...match[2].matchAll(/Contributors\.(\w+)/g)].map((m) => m[1]);
    const contributors = keys
      .map((key) => contributorsByKey[key])
      .filter((c): c is Ps2iodbContributor => Boolean(c));
    if (contributors.length > 0) bySlug.set(slug, contributors);
  }
  return bySlug;
}

export function descriptionForPs2iodbSlug(
  slug: string | undefined,
  bySlug: Map<string, Ps2iodbContributor[]>,
): string | undefined {
  if (!slug) return undefined;
  const contributors = bySlug.get(slug);
  if (!contributors?.length) return undefined;
  return formatPs2iodbContributorDescription(contributors);
}

/** One contributed PS2IODB icon: folder slug plus the game/icon names from Titles.ts. */
export interface Ps2iodbTitle {
  slug: string;
  gameName: string;
  iconName: string;
}

export function displayNameForPs2iodbTitle(title: Ps2iodbTitle): string {
  return title.iconName === title.gameName
    ? title.gameName
    : `${title.gameName} (${title.iconName})`;
}

/**
 * Map PS2IODB icon slug (the `/icon/:code` path) to game and icon names.
 * Covers `new Game(\`Name\`, \`slug\`, …)` and nested `new Icon(g, \`Name\`, \`slug\`, …)`.
 */
export function parsePs2iodbTitles(source: string): Map<string, Ps2iodbTitle> {
  const bySlug = new Map<string, Ps2iodbTitle>();
  const chunks = source.split(/new Game\(/);
  for (const chunk of chunks.slice(1)) {
    const nameMatch = chunk.match(/^\s*`([^`]+)`/);
    if (!nameMatch) continue;
    const gameName = nameMatch[1];
    const rest = chunk.slice(nameMatch[0].length);
    const slugMatch = rest.match(/^\s*,\s*(?:`([^`]+)`|'([^']+)')/);
    if (slugMatch) {
      const slug = slugMatch[1] ?? slugMatch[2];
      bySlug.set(slug, { slug, gameName, iconName: gameName });
      continue;
    }
    const iconRe = /new Icon\(\s*g\s*,\s*`([^`]+)`\s*,\s*(?:`([^`]+)`|'([^']+)')/g;
    for (const iconMatch of chunk.matchAll(iconRe)) {
      const slug = iconMatch[2] ?? iconMatch[3];
      bySlug.set(slug, { slug, gameName, iconName: iconMatch[1] });
    }
  }
  return bySlug;
}
