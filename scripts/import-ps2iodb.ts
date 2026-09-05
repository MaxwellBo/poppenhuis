#!/usr/bin/env npx tsx
/**
 * Import notable PS2 save icons from PS2IODB's exported OBJ + PNG meshes.
 *
 *   npx tsx scripts/import-ps2iodb.ts
 *   npx tsx scripts/import-ps2iodb.ts --attribution-only
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { GAME_META, PS2IODB_IMPORTS } from './ps2-icon-meta.ts';
import { ps2VertexColor, ps2VertexColorScale } from '../src/utils/ps2-icon.ts';
import { PS2_SAVE_ICONS_COLLECTION } from '../src/ps2-archive.ts';
import {
  descriptionForPs2iodbSlug,
  parsePs2iodbContributors,
  parsePs2iodbTitleContributors,
  ps2iodbSlugFromStorage,
  type Ps2iodbContributor,
} from '../src/utils/ps2iodb-attribution.ts';

const REPO = 'https://github.com/Issung/PS2IODB.git';
const SPARSE = '/tmp/ps2iodb';
const GOLDENS = 'public/assets/goldens';
const ASSET_PREFIX = 'ps2_save-icons';
const COLLECTION_ID = 'ps2-save-icons';
const PINNED_IDS = ['jak-and-daxter', 'jak-ii', 'jak-3'];

interface ArchiveItem {
  id: string;
  name: string;
  model: string;
  usdzModel?: string;
  og?: string;
  alt?: string;
  description?: string;
  formalName?: string;
  manufacturer?: string;
  manufactureLocation?: string;
  releaseDate?: string;
  acquisitionDate?: string;
  storageLocation?: string;
  captureMethod?: string;
  material?: string[];
  customFields?: Record<string, string | undefined>;
}

function packGlb(json: object, binary: Uint8Array): Uint8Array {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const pad = (n: number) => (4 - (n % 4)) % 4;
  const jsonPad = pad(jsonBytes.length);
  const binPad = pad(binary.length);
  const jsonChunkLen = jsonBytes.length + jsonPad;
  const binChunkLen = binary.length + binPad;
  const total = 12 + 8 + jsonChunkLen + 8 + binChunkLen;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonChunkLen, true);
  view.setUint32(16, 0x4e4f534a, true);
  out.set(jsonBytes, 20);
  out.fill(0x20, 20 + jsonBytes.length, 20 + jsonChunkLen);
  const binHeader = 20 + jsonChunkLen;
  view.setUint32(binHeader, binChunkLen, true);
  view.setUint32(binHeader + 4, 0x004e4942, true);
  out.set(binary, binHeader + 8);
  return out;
}

function parseObj(text: string): {
  positions: number[];
  normals: number[];
  uvs: number[];
  colors: number[];
} {
  const pos: number[][] = [];
  const nrm: number[][] = [];
  const tex: number[][] = [];
  const col: number[][] = [];
  const outPos: number[] = [];
  const outNrm: number[] = [];
  const outUv: number[] = [];
  const outCol: number[] = [];

  const emit = (vi: number, vti: number, vni: number) => {
    const p = pos[vi] ?? [0, 0, 0];
    const n = nrm[vni] ?? [0, 1, 0];
    const t = tex[vti] ?? [0, 0];
    const c = col[vi] ?? [0.5, 0.5, 0.5];
    outPos.push(p[0], p[1], p[2]);
    const nlen = Math.hypot(n[0], n[1], n[2]) || 1;
    outNrm.push(n[0] / nlen, n[1] / nlen, n[2] / nlen);
    outUv.push(t[0], t[1]);
    outCol.push(c[0], c[1], c[2]);
  };

  const parseIndex = (token: string, count: number): number => {
    const n = parseInt(token, 10);
    if (!n) return -1;
    return n < 0 ? count + n : n - 1;
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    const tag = parts[0];
    if (tag === 'v') {
      const x = Number(parts[1]), y = Number(parts[2]), z = Number(parts[3]);
      pos.push([x, y, z]);
      if (parts.length >= 7) {
        col.push([Number(parts[4]), Number(parts[5]), Number(parts[6])]);
      } else {
        col.push([0.5, 0.5, 0.5]);
      }
    } else if (tag === 'vn') {
      nrm.push([Number(parts[1]), Number(parts[2]), Number(parts[3])]);
    } else if (tag === 'vt') {
      tex.push([Number(parts[1]), Number(parts[2])]);
    } else if (tag === 'f') {
      const corners = parts.slice(1).map((tok) => {
        const [v, vt, vn] = tok.split('/');
        return {
          vi: parseIndex(v, pos.length),
          vti: vt ? parseIndex(vt, tex.length) : -1,
          vni: vn ? parseIndex(vn, nrm.length) : -1,
        };
      });
      for (let i = 1; i + 1 < corners.length; i++) {
        emit(corners[0].vi, corners[0].vti, corners[0].vni);
        emit(corners[i].vi, corners[i].vti, corners[i].vni);
        emit(corners[i + 1].vi, corners[i + 1].vti, corners[i + 1].vni);
      }
    }
  }

  return { positions: outPos, normals: outNrm, uvs: outUv, colors: outCol };
}

function objToGlb(objText: string, png: Uint8Array | null, name: string): Uint8Array {
  const mesh = parseObj(objText);
  const vCount = mesh.positions.length / 3;
  if (vCount < 3) throw new Error('OBJ has no triangles');

  const bytes = new Uint8Array(vCount * 4);
  for (let i = 0; i < vCount; i++) {
    bytes[i * 4] = Math.round(Math.max(0, Math.min(1, mesh.colors[i * 3])) * 255);
    bytes[i * 4 + 1] = Math.round(Math.max(0, Math.min(1, mesh.colors[i * 3 + 1])) * 255);
    bytes[i * 4 + 2] = Math.round(Math.max(0, Math.min(1, mesh.colors[i * 3 + 2])) * 255);
    bytes[i * 4 + 3] = 255;
  }
  const scale = ps2VertexColorScale({ colorData: bytes, vertexCount: vCount, texture: png });
  const colors: number[] = [];
  for (let i = 0; i < vCount; i++) {
    const [r, g, b] = ps2VertexColor(bytes[i * 4], bytes[i * 4 + 1], bytes[i * 4 + 2], scale);
    colors.push(r, g, b);
  }

  const posMin = [Infinity, Infinity, Infinity];
  const posMax = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < vCount; i++) {
    const x = mesh.positions[i * 3], y = mesh.positions[i * 3 + 1], z = mesh.positions[i * 3 + 2];
    posMin[0] = Math.min(posMin[0], x); posMin[1] = Math.min(posMin[1], y); posMin[2] = Math.min(posMin[2], z);
    posMax[0] = Math.max(posMax[0], x); posMax[1] = Math.max(posMax[1], y); posMax[2] = Math.max(posMax[2], z);
  }

  const binParts: Uint8Array[] = [];
  const views: Array<{ offset: number; length: number; stride?: number; target?: number }> = [];
  let binOffset = 0;
  const addView = (data: Uint8Array, stride?: number, target?: number) => {
    const offset = binOffset;
    binParts.push(data);
    binOffset += data.byteLength;
    views.push({ offset, length: data.byteLength, stride, target });
    return views.length - 1;
  };

  const posView = addView(new Uint8Array(new Float32Array(mesh.positions).buffer), 12, 34962);
  const nrmView = addView(new Uint8Array(new Float32Array(mesh.normals).buffer), 12, 34962);
  const uvView = addView(new Uint8Array(new Float32Array(mesh.uvs).buffer), 8, 34962);
  const colView = addView(new Uint8Array(new Float32Array(colors).buffer), 12, 34962);
  let imgView = -1;
  if (png) imgView = addView(png);

  const bin = new Uint8Array(binOffset);
  let w = 0;
  for (const part of binParts) { bin.set(part, w); w += part.byteLength; }

  const material: Record<string, unknown> = {
    name: 'ps2-icon',
    pbrMetallicRoughness: { metallicFactor: 0, roughnessFactor: 1, baseColorFactor: [1, 1, 1, 1] },
    extensions: { KHR_materials_unlit: {} },
  };
  if (png) (material.pbrMetallicRoughness as Record<string, unknown>).baseColorTexture = { index: 0 };

  const gltf: Record<string, unknown> = {
    asset: { version: '2.0', generator: 'poppenhuis ps2-icon-to-glb' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0,
    scenes: [{ nodes: [0], name }],
    nodes: [{ mesh: 0, name }],
    meshes: [{
      name,
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2, COLOR_0: 3 },
        material: 0,
      }],
    }],
    materials: [material],
    accessors: [
      { name: 'POSITION', bufferView: posView, componentType: 5126, count: vCount, type: 'VEC3', min: posMin, max: posMax },
      { name: 'NORMAL', bufferView: nrmView, componentType: 5126, count: vCount, type: 'VEC3' },
      { name: 'TEXCOORD_0', bufferView: uvView, componentType: 5126, count: vCount, type: 'VEC2' },
      { name: 'COLOR_0', bufferView: colView, componentType: 5126, count: vCount, type: 'VEC3' },
    ],
    bufferViews: views.map((v) => ({
      buffer: 0,
      byteOffset: v.offset,
      byteLength: v.length,
      ...(v.stride ? { byteStride: v.stride } : {}),
      ...(v.target ? { target: v.target } : {}),
    })),
    buffers: [{ byteLength: bin.byteLength }],
  };
  if (png) {
    gltf.images = [{ bufferView: imgView, mimeType: 'image/png' }];
    gltf.samplers = [{ magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }];
    gltf.textures = [{ source: 0, sampler: 0 }];
  }
  return packGlb(gltf, bin);
}

function pickObj(dir: string): { obj: string; png: string | null; formalName: string } | null {
  const files = readdirSync(dir);
  const objs = files.filter((f) => f.endsWith('.obj'));
  if (objs.length === 0) return null;
  let preferred = '';
  const sysPath = join(dir, 'iconsys.json');
  if (existsSync(sysPath)) {
    try {
      const sys = JSON.parse(readFileSync(sysPath, 'utf8')) as { normal?: string };
      if (sys.normal) preferred = `${sys.normal}.obj`;
    } catch { /* ignore */ }
  }
  const objName = objs.includes(preferred) ? preferred : objs.sort()[0];
  const stem = objName.replace(/\.obj$/, '');
  const pngName = files.includes(`${stem}.png`) ? `${stem}.png` : files.find((f) => f.endsWith('.png')) ?? null;
  return {
    obj: join(dir, objName),
    png: pngName ? join(dir, pngName) : null,
    formalName: stem,
  };
}

function tsString(s: string): string {
  return JSON.stringify(s);
}

function emitItem(item: ArchiveItem): string {
  const fields = [
    `        id: ${tsString(item.id)},`,
    `        name: ${tsString(item.name)},`,
    `        model: ${tsString(item.model)},`,
    item.usdzModel ? `        usdzModel: ${tsString(item.usdzModel)},` : '',
    item.og ? `        og: ${tsString(item.og)},` : '',
    item.alt ? `        alt: ${tsString(item.alt)},` : '',
    item.description ? `        description: ${tsString(item.description)},` : '',
    item.formalName ? `        formalName: ${tsString(item.formalName)},` : '',
    item.manufacturer ? `        manufacturer: ${tsString(item.manufacturer)},` : '',
    item.manufactureLocation ? `        manufactureLocation: ${tsString(item.manufactureLocation)},` : '',
    item.releaseDate ? `        releaseDate: ${tsString(item.releaseDate)},` : '',
    item.acquisitionDate ? `        acquisitionDate: ${tsString(item.acquisitionDate)},` : '',
    item.storageLocation ? `        storageLocation: ${tsString(item.storageLocation)},` : '',
    item.captureMethod ? `        captureMethod: ${tsString(item.captureMethod)},` : '',
    item.material ? `        material: ${JSON.stringify(item.material)},` : '',
    item.customFields
      ? `        customFields: { shapes: ${tsString(item.customFields.shapes ?? '')}, vertices: ${tsString(item.customFields.vertices ?? '')}, frames: ${tsString(item.customFields.frames ?? '')} },`
      : '',
  ].filter(Boolean);
  return `      {\n${fields.join('\n')}\n      }`;
}

function emitArchive(items: ArchiveItem[]): string {
  return `/** Generated by scripts/ps2-icon-to-glb.ts — PlayStation 2 memory-card browser icons. */
export const PS2_SAVE_ICONS_COLLECTION = {
  id: ${tsString(COLLECTION_ID)},
  name: "PS2 save icons",
  og: ${tsString(`/assets/derived/mbo_${COLLECTION_ID}_og.png`)},
  description: ${tsString(PS2_SAVE_ICONS_COLLECTION.description ?? '')},
  items: [
${items.map(emitItem).join(',\n')}
  ]
};
`;
}

const TITLES_URL = 'https://raw.githubusercontent.com/Issung/PS2IODB/main/website/src/model/Titles.ts';
const CONTRIBUTORS_URL = 'https://raw.githubusercontent.com/Issung/PS2IODB/main/website/src/model/Contributors.ts';

function loadPs2iodbContributorsBySlug(): Map<string, Ps2iodbContributor[]> {
  const titles = execFileSync('curl', ['-fsSL', TITLES_URL], { encoding: 'utf8' });
  const contributorsSrc = execFileSync('curl', ['-fsSL', CONTRIBUTORS_URL], { encoding: 'utf8' });
  return parsePs2iodbTitleContributors(titles, parsePs2iodbContributors(contributorsSrc));
}

function withPs2iodbDescription(
  item: ArchiveItem,
  bySlug: Map<string, Ps2iodbContributor[]>,
): ArchiveItem {
  const slug = ps2iodbSlugFromStorage(item.storageLocation);
  if (!slug) return item;
  const description = descriptionForPs2iodbSlug(slug, bySlug);
  if (!description) {
    console.warn(`no PS2IODB contributors for ${slug} (${item.id})`);
    return item;
  }
  return { ...item, description };
}

function ensureSparseCheckout(slugs: string[]) {
  if (!existsSync(join(SPARSE, '.git'))) {
    console.log('Cloning PS2IODB (sparse)...');
    execFileSync('git', ['clone', '--depth', '1', '--filter=blob:none', '--sparse', REPO, SPARSE], { stdio: 'inherit' });
  }
  const paths = slugs.map((s) => `website/public/icons/${s}`);
  execFileSync('git', ['-C', SPARSE, 'sparse-checkout', 'set', ...paths], { stdio: 'inherit' });
}

function main() {
  const attributionOnly = process.argv.includes('--attribution-only');
  console.log('Loading PS2IODB contributor credits...');
  const bySlug = loadPs2iodbContributorsBySlug();

  const added: ArchiveItem[] = [];
  if (!attributionOnly) {
    const existingIds = new Set(PS2_SAVE_ICONS_COLLECTION.items.map((i) => i.id));
    const wanted = PS2IODB_IMPORTS.filter((t) => !existingIds.has(t.id));
    console.log(`Importing ${wanted.length} PS2IODB icons (${existingIds.size} already in archive)`);
    ensureSparseCheckout(wanted.map((t) => t.slug));

    mkdirSync(GOLDENS, { recursive: true });

    for (const title of wanted) {
      const dir = join(SPARSE, 'website/public/icons', title.slug);
      if (!existsSync(dir)) {
        console.warn(`missing ${title.slug}`);
        continue;
      }
      const picked = pickObj(dir);
      if (!picked) {
        console.warn(`no OBJ in ${title.slug}`);
        continue;
      }
      const objText = readFileSync(picked.obj, 'utf8');
      const png = picked.png ? new Uint8Array(readFileSync(picked.png)) : null;
      const filename = `${ASSET_PREFIX}_${title.id}.glb`;
      const outPath = join(GOLDENS, filename);
      try {
        writeFileSync(outPath, objToGlb(objText, png, picked.formalName));
      } catch (err) {
        console.warn(`convert failed ${title.slug}: ${(err as Error).message}`);
        continue;
      }
      const game = GAME_META[title.id];
      added.push({
        id: title.id,
        name: title.name,
        model: `/assets/goldens/${filename}`,
        usdzModel: `/assets/derived/${ASSET_PREFIX}_${title.id}.usdz`,
        og: `/assets/derived/${ASSET_PREFIX}_${title.id}.png`,
        alt: `PlayStation 2 memory card icon for ${title.name}`,
        formalName: picked.formalName,
        manufacturer: game?.manufacturer ?? 'various PlayStation 2 developers',
        manufactureLocation: game?.manufactureLocation,
        releaseDate: game?.releaseDate,
        acquisitionDate: '2026 September 5',
        storageLocation: `https://ps2iodb.com/icon/${title.slug}`,
        captureMethod: 'Converted from PS2IODB-exported icon mesh',
        material: ['PS2 icon mesh', '128×128 texture'],
      });
      console.log(`ok   ${title.id.padEnd(36)} ${basename(picked.obj)}`);
    }
  }

  const items: ArchiveItem[] = [
    ...PS2_SAVE_ICONS_COLLECTION.items.map((item) => ({ ...item })),
    ...added,
  ].map((item) => withPs2iodbDescription(item, bySlug));
  items.sort((a, b) => {
    const ai = PINNED_IDS.indexOf(a.id);
    const bi = PINNED_IDS.indexOf(b.id);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.name.localeCompare(b.name);
  });
  writeFileSync('src/ps2-archive.ts', emitArchive(items));
  const credited = items.filter((item) => item.description).length;
  if (attributionOnly) {
    console.log(`Wrote contributor descriptions for ${credited} of ${items.length} archive items`);
  } else {
    console.log(`\nWrote ${added.length} new GLBs; archive now has ${items.length} items (${credited} with PS2IODB credits)`);
  }
}

main();
