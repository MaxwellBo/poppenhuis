#!/usr/bin/env npx tsx
/**
 * Convert PS2 save icons (.ico/.icn, or EMS .psu saves that contain them) to GLB.
 *
 *   npx tsx scripts/ps2-icon-to-glb.ts path/to/icon.ico
 *   npx tsx scripts/ps2-icon-to-glb.ts --batch /tmp/ps2-saves/extracted
 */

import { createHash } from 'crypto';
import { execFileSync } from 'child_process';
import { mkdirSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'fs';
import { basename, dirname, extname, join, relative } from 'path';
import {
  asciiTitle,
  encodePng,
  parseIconSys,
  parsePsu,
  parsePs2Icon,
  ps2IconToGlb,
  textureToRgba,
  type Ps2Icon,
} from '../src/utils/ps2-icon.ts';
import {
  AR_PLACEHOLDER_IDS,
  AR_PLACEHOLDER_PNG_SHA1,
  COLLECTION_DESCRIPTION,
  GAME_META,
} from './ps2-icon-meta.ts';

const AR_IDS = new Set<string>(AR_PLACEHOLDER_IDS);

function isArPlaceholder(icon: Ps2Icon, id: string): boolean {
  if (AR_IDS.has(id)) return true;
  if (!icon.texture || icon.vertexCount !== 36) return false;
  const png = encodePng(128, 128, textureToRgba(icon.texture));
  const digest = createHash('sha1').update(png).digest('hex');
  return digest.startsWith(AR_PLACEHOLDER_PNG_SHA1);
}

const DISPLAY_NAMES: Record<string, string> = {
  'ac04save-data': 'Ace Combat 04',
  'gran-turismo-4game-data': 'Gran Turismo 4',
  'gta3': 'Grand Theft Auto III',
  'gta-vicecity': 'Grand Theft Auto: Vice City',
  'gta-vcs': 'Grand Theft Auto: Vice City Stories',
  'sanandreas': 'Grand Theft Auto: San Andreas',
  'mgs2-15525plant-cleared': 'Metal Gear Solid 2',
  'mgs3-game-data001': 'Metal Gear Solid 3',
  'shadowof-the-colossus': 'Shadow of the Colossus',
  'thps3-skatereduardo': "Tony Hawk's Pro Skater 3",
  'thps3-options-and-pro-careers': "Tony Hawk's Pro Skater 3 (options)",
  'thps4-skatereduardo': "Tony Hawk's Pro Skater 4",
  'thps4-careereduardo': "Tony Hawk's Pro Skater 4 (career)",
  'thug-skatereduardo': "Tony Hawk's Underground",
  'thug-2-skatereduardo': "Tony Hawk's Underground 2",
  'thug-2-graphicgraphic': "Tony Hawk's Underground 2 (graphic)",
  'thaw-progresseduardo': "Tony Hawk's American Wasteland",
  'thaw-graphicgrafiti': "Tony Hawk's American Wasteland (graphic)",
  'sly-raccoon': 'Sly Cooper and the Thievius Raccoonus',
  'sly-2': 'Sly 2: Band of Thieves',
  'sly-3': 'Sly 3: Honor Among Thieves',
  'canis-canem-edit': 'Bully',
  'the-returnof-the-king': 'The Lord of the Rings: The Return of the King',
  'prince-of-persiasot-00-0332': 'Prince of Persia: The Sands of Time',
  'tomb-raideraodsave-data': 'Tomb Raider: The Angel of Darkness',
  'zneo': 'Dragon Ball Z: Sparking! NEO',
  'nfsu-2eduardo': 'Need for Speed Underground 2',
  'killzoneeduardo': 'Killzone',
  'moh-frontline-eduardo': 'Medal of Honor: Frontline',
  'moh-vanguardeduardo': 'Medal of Honor: Vanguard',
  'moh-rising-sunben': 'Medal of Honor: Rising Sun',
  'moheaeduardo': 'Medal of Honor: European Assault',
  'harrypotter': "Harry Potter and the Philosopher's Stone",
  'harry-potter-pf': "Harry Potter and the Philosopher's Stone",
  'harry-potter-pda': "Harry Potter and the Chamber of Secrets",
  'outrun-2006coast2coast': 'OutRun 2006: Coast 2 Coast',
  'timesplitters-2saved-maps': 'TimeSplitters 2',
  'xiii-dataxiii': 'XIII',
  'motogp3file1': 'MotoGP 3',
  'maximo2e': 'Maximo vs Army of Zin',
  'silent-hill-3-file': 'Silent Hill 3',
  'desa-gameeduardo': "Disney's Extreme Skate Adventure",
  'd3-profileeduardo': 'Drakengard',
  'mmv4-options': 'Micro Machines v4',
  'cel-damage-eduardo': 'Cel Damage: Overdrive',
  "katamari-damacy": "Katamari Damacy",
  "we-love-katamari": "We Love Katamari",
  "god-of-war": "God of War",
  "god-of-war-2": "God of War II",
  "ico": "ICO",
  "okami": "Ōkami",
  "persona-3": "Persona 3",
  "persona-4": "Persona 4",
  "kingdom-hearts": "Kingdom Hearts",
  "kingdom-hearts-2": "Kingdom Hearts II",
  "final-fantasy-x": "Final Fantasy X",
  "final-fantasy-xii": "Final Fantasy XII",
  "devil-may-cry": "Devil May Cry",
  "devil-may-cry-3": "Devil May Cry 3",
  "resident-evil-4": "Resident Evil 4",
  "silent-hill-2": "Silent Hill 2",
  "burnout-3": "Burnout 3: Takedown",
  "ssx-3": "SSX 3",
  "guitar-hero": "Guitar Hero",
  "psychonauts": "Psychonauts",
  "viewtiful-joe": "Viewtiful Joe",
  "dark-cloud": "Dark Cloud",
  "dark-chronicle": "Dark Chronicle",
  "frequency": "Frequency",
  "amplitude": "Amplitude",
  "killer7": "killer7",
  "god-hand": "God Hand",
  "the-warriors": "The Warriors",
  "manhunt": "Manhunt",
  "zone-of-the-enders-2": "Zone of the Enders: The 2nd Runner",
  "crash-twinsanity": "Crash Twinsanity",
  "simpsons-hit-and-run": "The Simpsons: Hit & Run",
  "black": "Black",
  "soulcalibur-2": "Soulcalibur II",
  "ace-combat-5": "Ace Combat 5",
  "fatal-frame": "Fatal Frame",
  "onimusha": "Onimusha: Warlords",
  "red-dead-revolver": "Red Dead Revolver",
  "shadow-of-rome": "Shadow of Rome",
  "ape-escape-3": "Ape Escape 3",
  "blood-will-tell": "Blood Will Tell",
  "burnout-revenge": "Burnout Revenge",
  "ape-escape-2": "Ape Escape 2",
  "clock-tower-3": "Clock Tower 3",
  "devil-may-cry-2": "Devil May Cry 2",
  "disgaea": "Disgaea: Hour of Darkness",
  "dragon-quest-viii": "Dragon Quest VIII",
  "fatal-frame-2": "Fatal Frame II",
  "fatal-frame-3": "Fatal Frame III",
  "final-fantasy-x-2": "Final Fantasy X-2",
  "gitaroo-man": "Gitaroo Man",
  "gran-turismo-3": "Gran Turismo 3",
  "guitar-hero-2": "Guitar Hero II",
  "haunting-ground": "Haunting Ground",
  "hitman-2": "Hitman 2: Silent Assassin",
  "kuon": "Kuon",
  "max-payne-2": "Max Payne 2",
  "midnight-club-3": "Midnight Club 3: DUB Edition",
  "need-for-speed-most-wanted": "Need for Speed: Most Wanted",
  "odin-sphere": "Odin Sphere",
  "okage": "Okage: Shadow King",
  "parappa-2": "PaRappa the Rapper 2",
  "persona-3-fes": "Persona 3 FES",
  "resident-evil-code-veronica": "Resident Evil Code: Veronica X",
  "rogue-galaxy": "Rogue Galaxy",
  "rule-of-rose": "Rule of Rose",
  "smt-nocturne": "Shin Megami Tensei: Nocturne",
  "silent-hill-4": "Silent Hill 4",
  "siren": "Siren",
  "soulcalibur-3": "Soulcalibur III",
  "space-channel-5-part-2": "Space Channel 5: Part 2",
  "ssx-tricky": "SSX Tricky",
  "star-wars-battlefront-2": "Star Wars: Battlefront II",
  "tales-of-the-abyss": "Tales of the Abyss",
  "splinter-cell-chaos-theory": "Splinter Cell: Chaos Theory",
  "timesplitters-future-perfect": "TimeSplitters: Future Perfect",
  "wipeout-fusion": "WipEout Fusion",
  "xenosaga": "Xenosaga Episode I",
  'spiderman-2': 'Spider-Man 2',
  'ace-combat-zero': 'Ace Combat Zero',
  'armored-core-3': 'Armored Core 3',
  'ar-tonelico': 'Ar tonelico: Melody of Elemia',
  'auto-modellista': 'Auto Modellista',
  'baldurs-gate-dark-alliance': "Baldur's Gate: Dark Alliance",
  'bloodrayne': 'BloodRayne',
  'burnout-2': 'Burnout 2: Point of Impact',
  'call-of-duty-finest-hour': 'Call of Duty: Finest Hour',
  'capcom-vs-snk-2': 'Capcom vs. SNK 2',
  'castlevania-curse-of-darkness': 'Castlevania: Curse of Darkness',
  'castlevania-lament-of-innocence': 'Castlevania: Lament of Innocence',
  'champions-of-norrath': 'Champions of Norrath',
  'cold-fear': 'Cold Fear',
  'crash-wrath-of-cortex': 'Crash Bandicoot: The Wrath of Cortex',
  'crazy-taxi': 'Crazy Taxi',
  'dead-or-alive-2': 'Dead or Alive 2',
  'def-jam-fight-for-ny': 'Def Jam: Fight for NY',
  'digital-devil-saga': 'Shin Megami Tensei: Digital Devil Saga',
  'digital-devil-saga-2': 'Shin Megami Tensei: Digital Devil Saga 2',
  'dirge-of-cerberus': 'Dirge of Cerberus: Final Fantasy VII',
  'disgaea-2': 'Disgaea 2: Cursed Memories',
  'hack-infection': '.hack//Infection',
  'dragon-ball-z-budokai-3': 'Dragon Ball Z: Budokai 3',
  'drakengard-2': 'Drakengard 2',
  'driver-3': 'Driver 3',
  'genji': 'Genji: Dawn of the Samurai',
  'getaway-black-monday': 'The Getaway: Black Monday',
  'godfather': 'The Godfather',
  'gradius-v': 'Gradius V',
  'gta-lcs': 'Grand Theft Auto: Liberty City Stories',
  'guilty-gear-x2': 'Guilty Gear X2',
  'guitar-hero-3': 'Guitar Hero III: Legends of Rock',
  'hitman-blood-money': 'Hitman: Blood Money',
  'jak-x': 'Jak X: Combat Racing',
  'kingdom-hearts-re-com': 'Kingdom Hearts Re:Chain of Memories',
  'klonoa-2': "Klonoa 2: Lunatea's Veil",
  'lego-star-wars': 'Lego Star Wars',
  'manhunt-2': 'Manhunt 2',
  'mark-of-kri': 'The Mark of Kri',
  'mortal-kombat-deception': 'Mortal Kombat: Deception',
  'nba-street-vol-2': 'NBA Street Vol. 2',
  'need-for-speed-carbon': 'Need for Speed: Carbon',
  'onimusha-2': "Onimusha 2: Samurai's Destiny",
  'onimusha-3': 'Onimusha 3: Demon Siege',
  'phantom-brave': 'Phantom Brave',
  'primal': 'Primal',
  'prince-of-persia-two-thrones': 'Prince of Persia: The Two Thrones',
  'prince-of-persia-warrior-within': 'Prince of Persia: Warrior Within',
  'psi-ops': 'Psi-Ops: The Mindgate Conspiracy',
  'punisher': 'The Punisher',
  'radiata-stories': 'Radiata Stories',
  'red-faction-2': 'Red Faction II',
  'resident-evil-outbreak': 'Resident Evil Outbreak',
  'ridge-racer-v': 'Ridge Racer V',
  'scarface': 'Scarface: The World Is Yours',
  'second-sight': 'Second Sight',
  'shadow-hearts': 'Shadow Hearts',
  'shadow-hearts-covenant': 'Shadow Hearts: Covenant',
  'shinobi': 'Shinobi',
  'siren-2': 'Siren 2',
  'socom': 'SOCOM U.S. Navy SEALs',
  'spider-man': 'Spider-Man',
  'spongebob-bikini-bottom': 'SpongeBob SquarePants: Battle for Bikini Bottom',
  'star-ocean-3': 'Star Ocean: Till the End of Time',
  'suffering': 'The Suffering',
  'suikoden-v': 'Suikoden V',
  'tekken-tag': 'Tekken Tag Tournament',
  'tenchu-wrath-of-heaven': 'Tenchu: Wrath of Heaven',
  'timesplitters-1': 'TimeSplitters',
  'true-crime-streets-of-la': 'True Crime: Streets of LA',
  'twisted-metal-black': 'Twisted Metal: Black',
  'urban-reign': 'Urban Reign',
  'viewtiful-joe-2': 'Viewtiful Joe 2',
  'virtua-fighter-4': 'Virtua Fighter 4',
  'wwe-here-comes-the-pain': "WWE SmackDown! Here Comes the Pain",
  'xenosaga-2': 'Xenosaga Episode II',
  'xenosaga-3': 'Xenosaga Episode III',
  'yakuza': 'Yakuza',
  'yakuza-2': 'Yakuza 2',
  'zone-of-the-enders': 'Zone of the Enders',
};

function prettyName(id: string, title: string): string {
  return DISPLAY_NAMES[id] ?? title;
}

/** Asset filename prefix (keeps existing GLBs stable). */
const ASSET_PREFIX = 'ps2_save-icons';
const COLLECTION_ID = 'ps2-save-icons';
const GOLDENS = 'public/assets/goldens';

interface ConvertedItem {
  id: string;
  name: string;
  model: string;
  alt: string;
  formalName?: string;
  manufacturer: string;
  manufactureLocation?: string;
  releaseDate?: string;
  captureMethod: string;
  material: string[];
  customFields: Record<string, string>;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function decodeSjis(raw: Uint8Array): string {
  try {
    const text = execFileSync(
      'python3',
      ['-c', "import sys; sys.stdout.write(sys.stdin.buffer.read().decode('shift_jis', errors='replace'))"],
      { input: Buffer.from(raw) },
    ).toString();
    return text.replace(/\u0000/g, '').normalize('NFKC').replace(/\s+/g, ' ').trim();
  } catch {
    return asciiTitle(raw, 0);
  }
}

function slugify(name: string): string {
  const s = name
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return s.slice(0, 60) || 'icon';
}

function hashBytes(data: Uint8Array): string {
  return createHash('sha1').update(data).digest('hex');
}

function loadIconsFromFile(path: string): { icon: Ps2Icon; title: string; filename: string; bytes: Uint8Array }[] {
  const ext = extname(path).toLowerCase();
  const buf = new Uint8Array(readFileSync(path));
  if (ext === '.ico' || ext === '.icn') {
    return [{ icon: parsePs2Icon(buf), title: basename(path, ext), filename: basename(path), bytes: buf }];
  }
  if (ext === '.psu') {
    const files = parsePsu(buf);
    const sysFile = files.find((f) => f.name.toLowerCase() === 'icon.sys');
    let preferred = '';
    let title = basename(dirname(path));
    if (sysFile && sysFile.data.length >= 452) {
      try {
        const sys = parseIconSys(sysFile.data);
        preferred = sys.normal;
        const decoded = decodeSjis(sys.titleRaw);
        if (decoded) title = decoded;
      } catch {
        // ignore malformed icon.sys
      }
    }
    const iconFiles = files.filter((f) => /\.(ico|icn)$/i.test(f.name));
    const chosen = preferred
      ? iconFiles.filter((f) => f.name.toLowerCase() === preferred.toLowerCase())
      : iconFiles;
    const use = chosen.length > 0 ? chosen : iconFiles;
    const out: { icon: Ps2Icon; title: string; filename: string; bytes: Uint8Array }[] = [];
    for (const file of use) {
      try {
        out.push({
          icon: parsePs2Icon(file.data),
          title,
          filename: file.name,
          bytes: file.data,
        });
      } catch (err) {
        console.warn(`skip ${path} / ${file.name}: ${(err as Error).message}`);
      }
    }
    return out;
  }
  return [];
}

function tsString(s: string): string {
  return JSON.stringify(s);
}

function emitManifest(items: ConvertedItem[]): string {
  const itemSrc = items.map((item) => {
    const fields = [
      `        id: ${tsString(item.id)},`,
      `        name: ${tsString(item.name)},`,
      `        model: ${tsString(item.model)},`,
      `        usdzModel: ${tsString(item.model.replace('/assets/goldens/', '/assets/derived/').replace(/\.glb$/, '.usdz'))},`,
      `        og: ${tsString(item.model.replace('/assets/goldens/', '/assets/derived/').replace(/\.glb$/, '.png'))},`,
      `        alt: ${tsString(item.alt)},`,
      item.formalName ? `        formalName: ${tsString(item.formalName)},` : '',
      `        manufacturer: ${tsString(item.manufacturer)},`,
      item.manufactureLocation ? `        manufactureLocation: ${tsString(item.manufactureLocation)},` : '',
      item.releaseDate ? `        releaseDate: ${tsString(item.releaseDate)},` : '',
      `        acquisitionDate: "2026 September 4",`,
      `        storageLocation: ${tsString(item.id === 'rez' ? 'https://github.com/int-0/mymcplus' : 'https://archive.org/details/100-completed')},`,
      `        captureMethod: ${tsString(item.captureMethod)},`,
      `        material: ${JSON.stringify(item.material)},`,
      `        customFields: { shapes: ${tsString(item.customFields.shapes)}, vertices: ${tsString(item.customFields.vertices)}, frames: ${tsString(item.customFields.frames)} },`,
    ].filter(Boolean);
    return `      {\n${fields.join('\n')}\n      }`;
  }).join(',\n');

  return `/** Generated by scripts/ps2-icon-to-glb.ts — PlayStation 2 memory-card browser icons. */
export const PS2_SAVE_ICONS_COLLECTION = {
  id: ${tsString(COLLECTION_ID)},
  name: "PS2 save icons",
  og: ${tsString(`/assets/derived/mbo_${COLLECTION_ID}_og.png`)},
  description: ${tsString(COLLECTION_DESCRIPTION)},
  items: [
${itemSrc}
  ]
};
`;
}

function convertOne(input: string, output: string) {
  const loaded = loadIconsFromFile(input);
  if (loaded.length === 0) {
    throw new Error(`No PS2 icon found in ${input}`);
  }
  const { icon, title } = loaded[0];
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, ps2IconToGlb(icon, title));
  console.log(`Wrote ${output} (${icon.animationShapes} shapes, ${icon.vertexCount} verts, ${icon.frames.length} frames)`);
}

function batch(root: string) {
  const files = walk(root).filter((p) => {
    const ext = extname(p).toLowerCase();
    return ext === '.psu' || ext === '.ico' || ext === '.icn';
  });
  const seen = new Set<string>();
  const usedIds = new Set<string>();
  const items: ConvertedItem[] = [];
  mkdirSync(GOLDENS, { recursive: true });

  for (const file of files) {
    let loaded;
    try {
      loaded = loadIconsFromFile(file);
    } catch (err) {
      console.warn(`skip ${relative(root, file)}: ${(err as Error).message}`);
      continue;
    }
    for (const entry of loaded) {
      const digest = hashBytes(entry.bytes);
      if (seen.has(digest)) continue;
      seen.add(digest);

      let id = slugify(entry.title);
      if (usedIds.has(id)) {
        const fromFile = slugify(entry.filename.replace(/\.(ico|icn)$/i, ''));
        id = usedIds.has(`${id}-${fromFile}`) ? `${id}-${digest.slice(0, 6)}` : `${id}-${fromFile}`;
      }
      usedIds.add(id);

      if (isArPlaceholder(entry.icon, id)) {
        const stale = join(GOLDENS, `${ASSET_PREFIX}_${id}.glb`);
        try { unlinkSync(stale); } catch { /* no previous file */ }
        console.log(`skip AR placeholder ${id}`);
        continue;
      }

      const filename = `${ASSET_PREFIX}_${id}.glb`;
      const outPath = join(GOLDENS, filename);
      try {
        writeFileSync(outPath, ps2IconToGlb(entry.icon, entry.title));
      } catch (err) {
        console.warn(`convert failed ${file}: ${(err as Error).message}`);
        continue;
      }

      const animated = entry.icon.animationShapes > 1 && entry.icon.frames.length > 0;
      const name = prettyName(id, entry.title || id);
      const game = GAME_META[id];
      items.push({
        id,
        name,
        model: `/assets/goldens/${filename}`,
        alt: `PlayStation 2 memory card icon for ${name}`,
        formalName: entry.filename,
        manufacturer: game?.manufacturer ?? 'various PlayStation 2 developers',
        manufactureLocation: game?.manufactureLocation,
        releaseDate: game?.releaseDate,
        captureMethod: 'Converted from PS2 save icon (.ico/.icn) vertex animation',
        material: animated
          ? ['PS2 icon mesh', '128×128 A1B5G5R5 texture', 'vertex morph animation']
          : ['PS2 icon mesh', '128×128 A1B5G5R5 texture'],
        customFields: {
          shapes: String(entry.icon.animationShapes),
          vertices: String(entry.icon.vertexCount),
          frames: String(entry.icon.frames.length),
        },
      });
      console.log(`${animated ? 'anim' : 'stat'} ${id.padEnd(40)} ${entry.icon.animationShapes}sh ${entry.icon.vertexCount}v  ${entry.title}`);
    }
  }

  items.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync('src/ps2-archive.ts', emitManifest(items));
  console.log(`\nWrote ${items.length} GLBs and src/ps2-archive.ts`);
}

function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--batch' && args[1]) {
    batch(args[1]);
    return;
  }
  if (args.length === 1 || (args.length === 3 && args[1] === '-o')) {
    const input = args[0];
    const output = args[1] === '-o' ? args[2] : input.replace(/\.[^.]+$/, '.glb');
    convertOne(input, output);
    return;
  }
  console.error('Usage: tsx scripts/ps2-icon-to-glb.ts <icon.ico|save.psu> [-o out.glb]');
  console.error('       tsx scripts/ps2-icon-to-glb.ts --batch <dir>');
  process.exit(1);
}

main();
