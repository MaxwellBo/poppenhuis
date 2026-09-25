#!/usr/bin/env npx tsx
/**
 * Enrich scripts/ps2-icon-meta.ts GAME_META with developer / HQ city / first
 * PS2 release for every icon in the PS2IODB catalog, using Wikidata.
 *
 *   npx tsx scripts/enrich-ps2-meta.ts [--sample N] [--limit N] [--refresh] [--retry-misses]
 *
 * Results are cached in scripts/.ps2-wikidata-cache.json so reruns are fast.
 * Existing hand-curated GAME_META entries are never overwritten.
 *
 * After updating GAME_META, src/ps2-archive.ts items missing manufacturer /
 * manufactureLocation / releaseDate are patched in place (no GLB rebuild).
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { GAME_META } from './ps2-icon-meta.ts';
import { parsePs2iodbTitles } from '../src/utils/ps2iodb-attribution.ts';

const TITLES_URL = 'https://raw.githubusercontent.com/Issung/PS2IODB/main/website/src/model/Titles.ts';
const CACHE_PATH = join(import.meta.dirname, '.ps2-wikidata-cache.json');
const META_PATH = join(import.meta.dirname, 'ps2-icon-meta.ts');
const ARCHIVE_PATH = join(import.meta.dirname, '..', 'src', 'ps2-archive.ts');

const PS2_QID = 'Q10680';
const US_QID = 'Q30';
const UK_QID = 'Q145';
const US_STATE_QID = 'Q35657';
const UK_COUNTRIES: Record<string, string> = {
  Q21: 'England',
  Q22: 'Scotland',
  Q25: 'Wales',
  Q26: 'Northern Ireland',
};

/** P31 values that count as "a video game" for candidate filtering. */
const GAME_INSTANCE_QIDS = new Set([
  'Q7889', // video game
  'Q272658', // expansion pack? (also used for games)
  'Q211548', // video game compilation? (approx)
  'Q15620886', // video game remake
  'Q1145789', // video game collection
  'Q112144412', // video game (recent split)
  'Q208850', // video game character? no — keep list tight below
]);

const GAME_INSTANCE_ALLOW = new Set([
  'Q7889',
  'Q272658',
  'Q211548',
  'Q15620886',
  'Q1145789',
  'Q112144412',
  'Q15690487',
  'Q27452436',
  'Q135627287',
]);

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Cache {
  games: Record<string, { qid: string | null; label?: string; pool?: string[] }>;
  entities: Record<string, any>;
}

function loadCache(): Cache {
  if (existsSync(CACHE_PATH)) {
    try {
      const raw = JSON.parse(readFileSync(CACHE_PATH, 'utf8')) as Cache;
      // Slim any legacy full-entity entries to keep the cache small
      for (const [qid, ent] of Object.entries(raw.entities ?? {})) {
        raw.entities[qid] = slimEntity(ent);
      }
      return raw;
    } catch { /* ignore */ }
  }
  return { games: {}, entities: {} };
}

function saveCache(cache: Cache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 1));
}

async function fetchJson(url: string, retries = 3): Promise<any> {
  let lastErr: unknown = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'poppenhuis-ps2-meta/1.0 (https://github.com/maxwellbo/poppenhuis)' },
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

async function searchGame(name: string): Promise<Array<{ id: string; label?: string; description?: string }>> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=en&format=json&type=item&limit=8`;
  const data = await fetchJson(url);
  return (data.search ?? []).map((s: any) => ({ id: s.id, label: s.label, description: s.description }));
}

function slimEntity(ent: any): any {
  const keepClaims = ['P31', 'P178', 'P123', 'P400', 'P577', 'P159', 'P17', 'P131'];
  const claims: Record<string, any> = {};
  for (const p of keepClaims) {
    if (ent?.claims?.[p]) claims[p] = ent.claims[p];
  }
  return {
    labels: ent?.labels?.en ? { en: ent.labels.en } : {},
    descriptions: ent?.descriptions?.en ? { en: ent.descriptions.en } : {},
    claims,
  };
}

async function getEntities(qids: string[], cache: Cache): Promise<Record<string, any>> {
  const missing = qids.filter((q) => !cache.entities[q]);
  for (let i = 0; i < missing.length; i += 50) {
    const batch = missing.slice(i, i + 50);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&format=json&languages=en&props=labels|descriptions|claims`;
    const data = await fetchJson(url);
    for (const [qid, ent] of Object.entries<any>(data.entities ?? {})) {
      if (!ent?.missing) cache.entities[qid] = slimEntity(ent);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  const out: Record<string, any> = {};
  for (const q of qids) if (cache.entities[q]) out[q] = cache.entities[q];
  return out;
}

function entityLabel(ent: any): string | undefined {
  return ent?.labels?.en?.value as string | undefined;
}

function claimEntityIds(ent: any, prop: string): string[] {
  const claims = ent?.claims?.[prop] ?? [];
  const ids: string[] = [];
  for (const c of claims) {
    const v = c?.mainsnak?.datavalue?.value;
    if (v && typeof v === 'object' && v.id) ids.push(v.id as string);
  }
  return ids;
}

/**
 * Entity ids for a statement property, current values first: rank=preferred,
 * then statements without an end-time qualifier (P582 end time / P576
 * dissolved), then the rest. Avoids historical countries (e.g. London's
 * P17 includes Roman Empire) winning over the current one.
 */
function currentEntityIds(ent: any, prop: string): string[] {
  const claims = ent?.claims?.[prop] ?? [];
  const scored: Array<{ id: string; score: number }> = [];
  for (const c of claims) {
    const v = c?.mainsnak?.datavalue?.value;
    if (!v || typeof v !== 'object' || !v.id) continue;
    const quals = c?.qualifiers ?? {};
    const ended = quals.P582 ?? quals.P576 ?? [];
    let score = 2;
    if (c?.rank === 'preferred') score = 0;
    else if (ended.length === 0) score = 1;
    scored.push({ id: v.id as string, score });
  }
  return scored.sort((a, b) => a.score - b.score).map((s) => s.id);
}

/** P31 QID for wards of Japan (e.g. Chūō-ku, Yodogawa-ku). */
const JAPAN_WARD_QID = 'Q137773';

function claimTimes(ent: any, prop: string): Array<{ time: string; precision: number }> {
  const claims = ent?.claims?.[prop] ?? [];
  const out: Array<{ time: string; precision: number }> = [];
  for (const c of claims) {
    const v = c?.mainsnak?.datavalue?.value;
    if (v && typeof v.time === 'string') out.push({ time: v.time, precision: v.precision ?? 11 });
  }
  return out;
}

function isVideoGame(ent: any): boolean {
  const ids = claimEntityIds(ent, 'P31');
  if (ids.some((id) => GAME_INSTANCE_ALLOW.has(id))) return true;
  const desc = ((ent?.descriptions?.en?.value ?? '') as string).toLowerCase();
  if (desc.includes('video game')) return true;
  // Fallback: has platform (P400) or developer (P178) claims → very likely a game
  if (ent?.claims?.P400 || ent?.claims?.P178) {
    if (GAME_INSTANCE_QIDS.size === 0) return true;
    return true;
  }
  return false;
}

function hasPs2(ent: any): boolean {
  return claimEntityIds(ent, 'P400').includes(PS2_QID);
}

function formatWikidataTime(time: string, precision: number): string | null {
  const m = time.match(/^\+?(-?\d+)-(\d\d)-(\d\d)/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (precision <= 9 || (month === 0 && day === 0)) return `${year}`;
  if (precision === 10 || day === 0) return `${year} ${MONTHS[month - 1] ?? month}`;
  return `${year} ${MONTHS[month - 1] ?? month} ${day}`;
}

function earliestRelease(ent: any): string | undefined {
  const times = claimTimes(ent, 'P577');
  if (times.length === 0) return undefined;
  const parsed = times
    .map((t) => ({ ...t, formatted: formatWikidataTime(t.time, t.precision) }))
    .filter((t) => t.formatted)
    .sort((a, b) => (a.time < b.time ? -1 : 1));
  return parsed[0]?.formatted ?? undefined;
}

/** Walk P131 (located in) chain to find a US state or UK constituent country. */
async function findRegion(hqQid: string, cache: Cache): Promise<{ city: string; region: string } | null> {
  const ents = await getEntities([hqQid], cache);
  let hqEnt = ents[hqQid];
  if (!hqEnt) return null;
  let city = entityLabel(hqEnt);
  if (!city) return null;

  // Japanese wards (Chūō-ku, Yodogawa-ku, …) resolve to the parent city
  // (Osaka, …) to match the "Osaka, Japan" style of hand-written entries.
  const hqTypes = claimEntityIds(hqEnt, 'P31');
  if (hqTypes.includes(JAPAN_WARD_QID) || city.endsWith('-ku')) {
    const parentIds = claimEntityIds(hqEnt, 'P131');
    if (parentIds[0]) {
      const pEnts = await getEntities([parentIds[0]], cache);
      const parentLabel = entityLabel(pEnts[parentIds[0]]);
      if (parentLabel) {
        hqEnt = pEnts[parentIds[0]];
        city = parentLabel;
      }
    }
  }

  const countryIds = currentEntityIds(hqEnt, 'P17');
  const countryId = countryIds[0];
  if (!countryId) {
    // No direct country — walk P131 parents looking for country-level info
    return { city, region: '' };
  }
  const cEnts = await getEntities([countryId], cache);
  const countryLabel = entityLabel(cEnts[countryId]) ?? '';

  if (city === countryLabel) return { city: countryLabel, region: '' };

  if (countryId === US_QID) {
    // Walk P131 chain for a US state
    let frontier = claimEntityIds(hqEnt, 'P131');
    const seen = new Set<string>([hqQid]);
    for (let depth = 0; depth < 4 && frontier.length > 0; depth++) {
      const batch = await getEntities(frontier, cache);
      const next: string[] = [];
      for (const [qid, ent] of Object.entries(batch)) {
        const types = claimEntityIds(ent, 'P31');
        if (types.includes(US_STATE_QID)) return { city, region: entityLabel(ent) ?? '' };
        for (const p of claimEntityIds(ent, 'P131')) {
          if (!seen.has(p)) { seen.add(p); next.push(p); }
        }
      }
      frontier = next;
    }
    return { city, region: 'United States' };
  }

  if (countryId === UK_QID) {
    // Walk P131 chain for constituent country
    let frontier = claimEntityIds(hqEnt, 'P131');
    const seen = new Set<string>([hqQid]);
    for (let depth = 0; depth < 4 && frontier.length > 0; depth++) {
      const batch = await getEntities(frontier, cache);
      const next: string[] = [];
      for (const [qid, ent] of Object.entries(batch)) {
        if (UK_COUNTRIES[qid]) return { city, region: UK_COUNTRIES[qid] };
        for (const p of claimEntityIds(ent, 'P131')) {
          if (!seen.has(p)) { seen.add(p); next.push(p); }
        }
      }
      frontier = next;
    }
    return { city, region: countryLabel };
  }

  return { city, region: countryLabel };
}

async function resolveGameMeta(
  gameName: string,
  cache: Cache,
): Promise<{ manufacturer: string; manufactureLocation: string; releaseDate: string } | null> {
  const cached = cache.games[gameName];
  let qid: string | null | undefined = cached?.qid;

  if (qid === undefined) {
    let candidates: Array<{ id: string; description?: string }> = [];
    try {
      candidates = await searchGame(gameName);
    } catch {
      cache.games[gameName] = { qid: null };
      return null;
    }
    if (candidates.length === 0) {
      cache.games[gameName] = { qid: null };
      return null;
    }
    const ents = await getEntities(candidates.map((c) => c.id), cache);
    const gameEnts = Object.entries(ents).filter(([, e]) => isVideoGame(e));
    if (gameEnts.length === 0) {
      cache.games[gameName] = { qid: null };
      return null;
    }
    const withPs2 = gameEnts.filter(([, e]) => hasPs2(e));
    const pool = withPs2.length > 0 ? withPs2 : gameEnts;
    // Prefer exact label match (case-insensitive), else first candidate order
    const norm = gameName.toLowerCase().trim();
    const exact = pool.find(([qid2]) => (entityLabel(ents[qid2]) ?? '').toLowerCase() === norm);
    const ranked = exact ? [exact[0], ...pool.map(([q]) => q).filter((q) => q !== exact[0])] : pool.map(([q]) => q);
    qid = ranked[0];
    cache.games[gameName] = { qid, label: entityLabel(ents[qid]), pool: ranked };
  }

  if (!qid) return null;
  // Walk ranked candidates until one yields full metadata (a series or
  // disambiguation entity may match the name but lack P178/P577).
  const pool = cached?.pool ?? (cache.games[gameName]?.pool ?? []);
  const tryQids = [qid, ...pool.filter((o) => o !== qid)];
  for (const tryQid of tryQids) {
    const meta = await metaFromEntity(tryQid, cache);
    if (meta) {
      if (tryQid !== qid) cache.games[gameName] = { qid: tryQid, label: entityLabel(cache.entities[tryQid]), pool };
      return meta;
    }
  }
  return null;
}

async function metaFromEntity(
  tryQid: string,
  cache: Cache,
): Promise<{ manufacturer: string; manufactureLocation: string; releaseDate: string } | null> {
  const ents = await getEntities([tryQid], cache);
  const gameEnt = ents[tryQid];
  if (!gameEnt) return null;

  const devIds = claimEntityIds(gameEnt, 'P178');
  const pubIds = claimEntityIds(gameEnt, 'P123');
  const studioId = devIds[0] ?? pubIds[0];
  const releaseDate = earliestRelease(gameEnt);
  if (!studioId || !releaseDate) return null;

  const sEnts = await getEntities([studioId], cache);
  const manufacturer = entityLabel(sEnts[studioId]);
  if (!manufacturer) return null;

  const hqIds = currentEntityIds(sEnts[studioId], 'P159');
  let manufactureLocation = '';
  if (hqIds[0]) {
    const loc = await findRegion(hqIds[0], cache);
    if (loc && loc.city && loc.region) manufactureLocation = `${loc.city}, ${loc.region}`;
    else if (loc) manufactureLocation = loc.city;
  }
  if (!manufactureLocation) return null;

  return { manufacturer, manufactureLocation, releaseDate };
}

async function loadTitlesSource(): Promise<string> {
  const localCandidates = [
    '/tmp/ps2iodb/website/src/model/Titles.ts',
    '/tmp/Titles.ts',
  ];
  for (const p of localCandidates) {
    try {
      if (existsSync(p)) return readFileSync(p, 'utf8');
    } catch { /* ignore */ }
  }
  const res = await fetch(TITLES_URL);
  if (!res.ok) throw new Error(`Failed to fetch Titles.ts: ${res.status}`);
  const text = await res.text();
  writeFileSync('/tmp/Titles.ts', text);
  return text;
}

function tsString(s: string): string {
  return JSON.stringify(s);
}

function tsEscapeSingle(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function serializeMeta(
  original: string,
  merged: Record<string, { manufacturer: string; manufactureLocation: string; releaseDate: string }>,
  addedKeys: string[],
): string {
  // Preserve the original file verbatim; append new entries before the final `};`
  const sorted = [...addedKeys].sort((a, b) => a.localeCompare(b));
  const lines = sorted.map(
    (k) => `  '${tsEscapeSingle(k)}': { manufacturer: '${tsEscapeSingle(merged[k].manufacturer)}', manufactureLocation: '${tsEscapeSingle(merged[k].manufactureLocation)}', releaseDate: '${tsEscapeSingle(merged[k].releaseDate)}' },`,
  );
  const closeIdx = original.lastIndexOf('};');
  if (closeIdx < 0) throw new Error('Could not find closing of GAME_META');
  return `${original.slice(0, closeIdx)}${lines.join('\n')}${lines.length > 0 ? '\n' : ''}${original.slice(closeIdx)}`;
}

function gameMetaForSlug(slug: string, meta: Record<string, { manufacturer: string; manufactureLocation: string; releaseDate: string }>) {
  if (meta[slug]) return meta[slug];
  const compact = slug.replace(/-/g, '');
  for (const [key, value] of Object.entries(meta)) {
    if (key.replace(/-/g, '') === compact) return value;
  }
  return undefined;
}

async function main() {
  const args = process.argv.slice(2);
  const sampleIdx = args.indexOf('--sample');
  const limitIdx = args.indexOf('--limit');
  const sample = sampleIdx >= 0 ? Number(args[sampleIdx + 1]) : 0;
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;
  const refresh = args.includes('--refresh');
  const retryMisses = args.includes('--retry-misses');

  const cache = refresh ? { games: {}, entities: {} } : loadCache();
  if (retryMisses) {
    // Clear failed lookups (and pool-less successes, which predate candidate
    // fallback) so they resolve again with current logic. Entities stay cached.
    for (const [game, entry] of Object.entries(cache.games)) {
      if (!entry.qid || !entry.pool) delete cache.games[game];
    }
  }
  const titlesSource = await loadTitlesSource();
  const titles = parsePs2iodbTitles(titlesSource);

  // Unique game names needing lookup (skip slugs already covered by GAME_META)
  const slugToGame = new Map<string, string>();
  for (const [slug, title] of titles) slugToGame.set(slug, title.gameName);

  const gameNames = [...new Set(slugToGame.values())].sort();
  console.log(`${slugToGame.size} slugs, ${gameNames.length} distinct game names`);

  // Skip game names whose slugs are all already covered by hand-curated GAME_META
  const gameToSlugsEarly = new Map<string, string[]>();
  for (const [slug, game] of slugToGame) {
    if (!gameToSlugsEarly.has(game)) gameToSlugsEarly.set(game, []);
    gameToSlugsEarly.get(game)!.push(slug);
  }
  const uncovered = gameNames.filter((g) =>
    (gameToSlugsEarly.get(g) ?? []).some((s) => !gameMetaForSlug(s, GAME_META)),
  );
  console.log(`${uncovered.length}/${gameNames.length} game names need enrichment`);
  const todo = uncovered.slice(0, Math.min(uncovered.length, sample || limit));
  console.log(`Resolving ${todo.length} game names via Wikidata…`);

  const found: Record<string, { manufacturer: string; manufactureLocation: string; releaseDate: string }> = {};
  let ok = 0;
  let fail = 0;
  const CONCURRENCY = 5;
  for (let i = 0; i < todo.length; i += CONCURRENCY) {
    const batch = todo.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map((g) => resolveGameMeta(g, cache).catch(() => null)));
    batch.forEach((g, bi) => {
      const meta = results[bi];
      if (meta) { found[g] = meta; ok++; }
      else fail++;
    });
    if ((i / CONCURRENCY) % 20 === 0) {
      saveCache(cache);
      console.log(`  ${Math.min(i + CONCURRENCY, todo.length)}/${todo.length} ok=${ok} miss=${fail}`);
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  saveCache(cache);
  console.log(`Wikidata: ok=${ok} miss=${fail}`);

  // Map game name -> slugs, then merge with existing GAME_META (existing wins)
  const merged: Record<string, { manufacturer: string; manufactureLocation: string; releaseDate: string }> = { ...GAME_META };
  const gameToSlugs = gameToSlugsEarly;
  let added = 0;
  for (const [game, meta] of Object.entries(found)) {
    for (const slug of gameToSlugs.get(game) ?? []) {
      if (!merged[slug]) { merged[slug] = meta; added++; }
    }
  }
  console.log(`Adding ${added} new slug entries (total ${Object.keys(merged).length})`);
  const addedKeys = Object.keys(merged).filter((k) => !(k in GAME_META));
  const originalMeta = readFileSync(META_PATH, 'utf8');
  writeFileSync(META_PATH, serializeMeta(originalMeta, merged, addedKeys));

  // Patch archive items missing metadata, inserting fields in canonical
  // position (after formalName/alt/description, matching hand-written items).
  const archive = readFileSync(ARCHIVE_PATH, 'utf8');
  const lines = archive.split('\n');
  const out: string[] = [];
  let patched = 0;
  let curId: string | null = null;
  let blockStart = -1;
  let blockHasManufacturer = false;
  for (const line of lines) {
    const idMatch = line.match(/id: "([^"]+)"/);
    if (idMatch && line.includes('id:')) {
      curId = idMatch[1] === 'ps2-save-icons' ? null : idMatch[1];
      blockStart = out.length;
      blockHasManufacturer = false;
    }
    if (curId && line.includes('manufacturer:')) blockHasManufacturer = true;
    if (curId && /^\s*\},?\s*$/.test(line) && blockStart >= 0 && out.length - blockStart > 3) {
      const meta = !blockHasManufacturer ? gameMetaForSlug(curId, merged) : undefined;
      if (meta) {
        // Insert after formalName > alt > description > name > model, else at end.
        let at = out.length;
        for (const key of ['formalName:', 'alt:', 'description:', 'name:', 'model:']) {
          for (let j = out.length - 1; j > blockStart; j--) {
            if (out[j].includes(key)) { at = j + 1; break; }
          }
          if (at !== out.length) break;
          at = out.length;
        }
        // If anchor search failed, at stays at end; recompute properly:
        at = out.length;
        for (const key of ['formalName:', 'alt:', 'description:']) {
          let foundAt = -1;
          for (let j = blockStart; j < out.length; j++) {
            if (out[j].includes(key)) foundAt = j + 1;
          }
          if (foundAt > 0) { at = foundAt; break; }
        }
        const indent = '        ';
        const inject = [
          `${indent}manufacturer: ${tsString(meta.manufacturer)},`,
          `${indent}manufactureLocation: ${tsString(meta.manufactureLocation)},`,
          `${indent}releaseDate: ${tsString(meta.releaseDate)},`,
        ];
        out.splice(at, 0, ...inject);
        patched++;
      }
      curId = null; blockStart = -1; blockHasManufacturer = false;
      out.push(line);
      continue;
    }
    out.push(line);
  }
  writeFileSync(ARCHIVE_PATH, out.join('\n'));
  console.log(`Patched ${patched} archive items`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
