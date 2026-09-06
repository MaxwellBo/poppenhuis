#!/usr/bin/env npx tsx
/**
 * Import notable PS2 save icons from PS2IODB's exported OBJ + PNG meshes.
 *
 *   npx tsx scripts/import-ps2iodb.ts
 *   npx tsx scripts/import-ps2iodb.ts --ids baldurs-gate-dark-alliance
 *   npx tsx scripts/import-ps2iodb.ts --refresh
 */

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { GAME_META, PS2IODB_IMPORTS } from './ps2-icon-meta.ts';
import {
  parsePs2iodbAnim,
  ps2iodbAnimClip,
  ps2iodbObjUvToGltf,
  ps2iodbTransformedShape,
  ps2VertexColor,
  ps2VertexColorScale,
} from '../src/utils/ps2-icon.ts';
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

export function parseObj(text: string): {
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
    const [u, v] = ps2iodbObjUvToGltf(t[0], t[1]);
    outUv.push(u, v);
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

export function objToGlb(
  objText: string,
  png: Uint8Array | null,
  name: string,
  animText?: string | null,
): Uint8Array {
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

  const anim = animText ? parsePs2iodbAnim(animText) : null;
  const clip = anim ? ps2iodbAnimClip(anim) : null;
  const canMorph = clip !== null
    && anim !== null
    && anim.frames[0].vertexData.length === mesh.positions.length;
  const nMorph = canMorph && anim ? anim.frames.length - 1 : 0;
  const morphs: number[][] = [];
  const morphMin: number[][] = [];
  const morphMax: number[][] = [];
  if (canMorph && anim) {
    const base = ps2iodbTransformedShape(anim.frames[0].vertexData);
    for (let s = 1; s < anim.frames.length; s++) {
      const shape = ps2iodbTransformedShape(anim.frames[s].vertexData);
      const delta = new Array<number>(shape.length);
      const mn = [Infinity, Infinity, Infinity];
      const mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < vCount; i++) {
        const dx = shape[i * 3] - base[i * 3];
        const dy = shape[i * 3 + 1] - base[i * 3 + 1];
        const dz = shape[i * 3 + 2] - base[i * 3 + 2];
        delta[i * 3] = dx;
        delta[i * 3 + 1] = dy;
        delta[i * 3 + 2] = dz;
        mn[0] = Math.min(mn[0], dx); mn[1] = Math.min(mn[1], dy); mn[2] = Math.min(mn[2], dz);
        mx[0] = Math.max(mx[0], dx); mx[1] = Math.max(mx[1], dy); mx[2] = Math.max(mx[2], dz);
      }
      morphs.push(delta);
      morphMin.push(mn);
      morphMax.push(mx);
    }
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
  const morphViews = morphs.map((m) =>
    addView(new Uint8Array(new Float32Array(m).buffer), 12, 34962)
  );
  const nrmView = addView(new Uint8Array(new Float32Array(mesh.normals).buffer), 12, 34962);
  const uvView = addView(new Uint8Array(new Float32Array(mesh.uvs).buffer), 8, 34962);
  const colView = addView(new Uint8Array(new Float32Array(colors).buffer), 12, 34962);
  let timeView = -1;
  let weightView = -1;
  if (canMorph && clip) {
    timeView = addView(new Uint8Array(new Float32Array(clip.times).buffer));
    weightView = addView(new Uint8Array(new Float32Array(clip.weights).buffer));
  }
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

  const accessors: object[] = [
    { name: 'POSITION', bufferView: posView, componentType: 5126, count: vCount, type: 'VEC3', min: posMin, max: posMax },
  ];
  for (let i = 0; i < nMorph; i++) {
    accessors.push({
      name: `MORPH_${i}`,
      bufferView: morphViews[i],
      componentType: 5126,
      count: vCount,
      type: 'VEC3',
      min: morphMin[i],
      max: morphMax[i],
    });
  }
  const nrmAcc = accessors.length;
  accessors.push({ name: 'NORMAL', bufferView: nrmView, componentType: 5126, count: vCount, type: 'VEC3' });
  const uvAcc = accessors.length;
  accessors.push({ name: 'TEXCOORD_0', bufferView: uvView, componentType: 5126, count: vCount, type: 'VEC2' });
  const colAcc = accessors.length;
  accessors.push({ name: 'COLOR_0', bufferView: colView, componentType: 5126, count: vCount, type: 'VEC3' });
  let timeAcc = -1;
  let weightAcc = -1;
  if (canMorph && clip) {
    timeAcc = accessors.length;
    accessors.push({
      name: 'animTime',
      bufferView: timeView,
      componentType: 5126,
      count: clip.times.length,
      type: 'SCALAR',
      min: [clip.times[0]],
      max: [clip.times[clip.times.length - 1]],
    });
    weightAcc = accessors.length;
    accessors.push({
      name: 'animWeights',
      bufferView: weightView,
      componentType: 5126,
      count: clip.weights.length,
      type: 'SCALAR',
    });
  }

  const primitive: Record<string, unknown> = {
    attributes: {
      POSITION: 0,
      NORMAL: nrmAcc,
      TEXCOORD_0: uvAcc,
      COLOR_0: colAcc,
    },
    material: 0,
  };
  if (nMorph > 0) {
    primitive.targets = morphViews.map((_, i) => ({ POSITION: 1 + i }));
  }

  const gltf: Record<string, unknown> = {
    asset: { version: '2.0', generator: 'poppenhuis ps2-icon-to-glb' },
    extensionsUsed: ['KHR_materials_unlit'],
    scene: 0,
    scenes: [{ nodes: [0], name }],
    nodes: [{ mesh: 0, name }],
    meshes: [{
      name,
      primitives: [primitive],
      weights: nMorph > 0 ? new Array(nMorph).fill(0) : undefined,
    }],
    materials: [material],
    accessors,
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
  if (canMorph && timeAcc >= 0) {
    gltf.animations = [{
      name: 'idle',
      samplers: [{ input: timeAcc, output: weightAcc, interpolation: 'LINEAR' }],
      channels: [{ sampler: 0, target: { node: 0, path: 'weights' } }],
    }];
  }
  return packGlb(gltf, bin);
}

function pickObj(dir: string): { obj: string; png: string | null; anim: string | null; formalName: string } | null {
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
  const animName = files.includes(`${stem}.anim`) ? `${stem}.anim` : files.find((f) => f.endsWith('.anim')) ?? null;
  return {
    obj: join(dir, objName),
    png: pngName ? join(dir, pngName) : null,
    anim: animName ? join(dir, animName) : null,
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

function parseArgs(argv: string[]): { refreshIds: Set<string> | null; refreshAll: boolean } {
  const refreshAll = argv.includes('--refresh');
  const idIdx = argv.indexOf('--ids');
  const refreshIds = idIdx >= 0
    ? new Set(argv[idIdx + 1]?.split(',').filter(Boolean) ?? [])
    : null;
  return { refreshIds, refreshAll };
}

function main() {
  const { refreshIds, refreshAll } = parseArgs(process.argv.slice(2));
  console.log('Loading PS2IODB contributor credits...');
  const bySlug = loadPs2iodbContributorsBySlug();

  const existingIds = new Set(PS2_SAVE_ICONS_COLLECTION.items.map((i) => i.id));
  const wanted = PS2IODB_IMPORTS.filter((t) => {
    if (refreshIds) return refreshIds.has(t.id);
    if (refreshAll) return existingIds.has(t.id);
    return !existingIds.has(t.id);
  });
  if (refreshIds) {
    for (const id of refreshIds) {
      if (!PS2IODB_IMPORTS.some((t) => t.id === id)) {
        console.warn(`unknown id ${id}`);
      }
    }
  }
  console.log(`Importing ${wanted.length} PS2IODB icons (${existingIds.size} already in archive)`);
  ensureSparseCheckout(wanted.map((t) => t.slug));

  mkdirSync(GOLDENS, { recursive: true });
  const added: ArchiveItem[] = [];
  const refreshed = new Map<string, Partial<ArchiveItem>>();

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
    const animText = picked.anim ? readFileSync(picked.anim, 'utf8') : null;
    const filename = `${ASSET_PREFIX}_${title.id}.glb`;
    const outPath = join(GOLDENS, filename);
    let animated = false;
    let animShapes = 0;
    let animVerts = 0;
    try {
      writeFileSync(outPath, objToGlb(objText, png, picked.formalName, animText));
      if (animText) {
        const anim = parsePs2iodbAnim(animText);
        const mesh = parseObj(objText);
        animated = ps2iodbAnimClip(anim) !== null
          && anim.frames[0].vertexData.length === mesh.positions.length;
        animShapes = anim.frames.length;
        animVerts = mesh.positions.length / 3;
      }
    } catch (err) {
      console.warn(`convert failed ${title.slug}: ${(err as Error).message}`);
      continue;
    }
    const material = animated
      ? ['PS2 icon mesh', '128×128 texture', 'vertex morph animation']
      : ['PS2 icon mesh', '128×128 texture'];
    const captureMethod = animated
      ? 'Converted from PS2IODB-exported icon mesh with vertex animation'
      : 'Converted from PS2IODB-exported icon mesh';
    const customFields = animated
      ? { shapes: String(animShapes), vertices: String(animVerts), frames: String(animShapes) }
      : undefined;
    if (existingIds.has(title.id)) {
      const patch: Partial<ArchiveItem> = { captureMethod, material };
      if (customFields) patch.customFields = customFields;
      refreshed.set(title.id, patch);
      console.log(`${animated ? 'anim' : 'upd '} ${title.id.padEnd(36)} ${basename(picked.obj)}`);
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
      captureMethod,
      material,
      customFields,
    });
    console.log(`${animated ? 'anim' : 'ok  '} ${title.id.padEnd(36)} ${basename(picked.obj)}`);
  }

  const items: ArchiveItem[] = [
    ...PS2_SAVE_ICONS_COLLECTION.items.map((item) => {
      const patch = refreshed.get(item.id);
      if (!patch) return { ...item };
      const next = { ...item, ...patch };
      if (!patch.customFields && !next.material?.includes('vertex morph animation')) {
        delete next.customFields;
      }
      return next;
    }),
    ...added,
  ].map((item) => withPs2iodbDescription(item, bySlug));
  items.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync('src/ps2-archive.ts', emitArchive(items));
  const credited = items.filter((item) => item.description).length;
  console.log(`\nWrote ${added.length} new GLBs; archive now has ${items.length} items (${credited} with PS2IODB credits)`);
}

const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('import-ps2iodb.ts') ||
  process.argv[1].endsWith('import-ps2iodb.js')
);
if (isDirectRun) {
  main();
}
