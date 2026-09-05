/**
 * PlayStation 2 save-icon (.ico/.icn) parser and GLB exporter.
 *
 * Icons are vertex-animated meshes stored on memory cards. Each vertex carries
 * one position per "shape"; the BIOS blends those shapes using per-frame
 * (time, value) keys. We turn shapes into glTF morph targets and keys into a
 * looping `weights` animation that model-viewer can autoplay.
 *
 * Format references: Martin Akesson, "PS2 Icon Format v0.5"; icondumper2;
 * PS2IODB's ps2icon.ts / ModelViewRenderer.
 */

import { deflateSync } from 'zlib';

const MAGIC = 0x010000;
const ANIM_TAG = 0x01;
const FIXED = 4096;
const TEX_W = 128;
const TEX_H = 128;
const TEX_BYTES = TEX_W * TEX_H * 2;
const PSU_DIRENT = 512;
const PSU_CLUSTER = 1024;

export interface FrameKey {
  time: number;
  value: number;
}

export interface AnimationFrame {
  shapeId: number;
  keys: FrameKey[];
}

export interface Ps2Icon {
  animationShapes: number;
  textureType: number;
  vertexCount: number;
  /** [shape][vertex][xyz] as int16 fixed-point */
  vertexData: Int16Array;
  normalData: Int16Array;
  uvData: Int16Array;
  colorData: Uint8Array;
  frameLength: number;
  animSpeed: number;
  frames: AnimationFrame[];
  /** 16-bit A1B5G5R5 pixels, 128×128 */
  texture: Uint8Array | null;
}

export class Ps2IconError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Ps2IconError';
  }
}

export function parsePs2Icon(data: Uint8Array): Ps2Icon {
  if (data.length < 20) {
    throw new Ps2IconError('File too small to be a PS2 icon');
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let o = 0;
  const magic = view.getUint32(o, true); o += 4;
  const animationShapes = view.getUint32(o, true); o += 4;
  const textureType = view.getUint32(o, true); o += 4;
  o += 4; // reserved
  const vertexCount = view.getUint32(o, true); o += 4;

  if (magic !== MAGIC) {
    throw new Ps2IconError(`Invalid magic 0x${magic.toString(16)}`);
  }
  if (animationShapes < 1 || animationShapes > 16) {
    throw new Ps2IconError(`Unreasonable shape count ${animationShapes}`);
  }
  if (vertexCount < 3 || vertexCount % 3 !== 0) {
    throw new Ps2IconError(`Vertex count ${vertexCount} is not a triangle multiple`);
  }

  const stride = 8 * animationShapes + 16;
  if (data.length < o + vertexCount * stride) {
    throw new Ps2IconError('File truncated in vertex data');
  }

  const vertexData = new Int16Array(animationShapes * vertexCount * 3);
  const normalData = new Int16Array(vertexCount * 3);
  const uvData = new Int16Array(vertexCount * 2);
  const colorData = new Uint8Array(vertexCount * 4);

  for (let i = 0; i < vertexCount; i++) {
    for (let s = 0; s < animationShapes; s++) {
      const vo = (s * vertexCount + i) * 3;
      vertexData[vo] = view.getInt16(o, true); o += 2;
      vertexData[vo + 1] = view.getInt16(o, true); o += 2;
      vertexData[vo + 2] = view.getInt16(o, true); o += 2;
      o += 2; // padding
    }
    normalData[i * 3] = view.getInt16(o, true); o += 2;
    normalData[i * 3 + 1] = view.getInt16(o, true); o += 2;
    normalData[i * 3 + 2] = view.getInt16(o, true); o += 2;
    o += 2;
    uvData[i * 2] = view.getInt16(o, true); o += 2;
    uvData[i * 2 + 1] = view.getInt16(o, true); o += 2;
    colorData[i * 4] = view.getUint8(o); o += 1;
    colorData[i * 4 + 1] = view.getUint8(o); o += 1;
    colorData[i * 4 + 2] = view.getUint8(o); o += 1;
    colorData[i * 4 + 3] = view.getUint8(o); o += 1;
  }

  if (data.length < o + 20) {
    throw new Ps2IconError('File truncated in animation header');
  }
  const animTag = view.getUint32(o, true); o += 4;
  const frameLength = view.getUint32(o, true); o += 4;
  const animSpeed = view.getFloat32(o, true); o += 4;
  o += 4; // play offset
  const frameCount = view.getUint32(o, true); o += 4;
  if (animTag !== ANIM_TAG) {
    throw new Ps2IconError(`Invalid animation tag 0x${animTag.toString(16)}`);
  }

  const frames: AnimationFrame[] = [];
  for (let f = 0; f < frameCount; f++) {
    if (data.length < o + 8) {
      throw new Ps2IconError('File truncated in animation frames');
    }
    const shapeId = view.getUint32(o, true); o += 4;
    const keyCount = view.getUint32(o, true); o += 4;
    const keys: FrameKey[] = [];
    for (let k = 0; k < keyCount; k++) {
      if (data.length < o + 8) {
        throw new Ps2IconError('File truncated in frame keys');
      }
      keys.push({
        time: view.getFloat32(o, true),
        value: view.getFloat32(o + 4, true),
      });
      o += 8;
    }
    frames.push({ shapeId, keys });
  }

  let texture: Uint8Array | null = null;
  const flagged = (textureType & 0b0100) !== 0;
  const compressed = (textureType & 0b1000) !== 0;
  const remaining = data.length - o;
  // Bit 2 is "has texture" in the common docs, but several retail icons
  // (Ace Combat 5, ICO, …) leave it clear and still append a 128×128 TIM.
  // If a full uncompressed payload is sitting at the end, take it.
  if (flagged || remaining >= TEX_BYTES) {
    texture = (compressed && flagged)
      ? decompressTexture(view, o, data.length)
      : readUncompressedTexture(data, o);
    if (!flagged && textureIsEmpty(texture)) {
      texture = null;
    }
  }

  return {
    animationShapes,
    textureType,
    vertexCount,
    vertexData,
    normalData,
    uvData,
    colorData,
    frameLength,
    animSpeed,
    frames,
    texture,
  };
}

function textureIsEmpty(texture: Uint8Array): boolean {
  let nonempty = 0;
  for (let i = 0; i < texture.length; i += 2) {
    if ((texture[i] | (texture[i + 1] << 8)) !== 0) nonempty++;
    if (nonempty > 8) return false;
  }
  return true;
}

function readUncompressedTexture(data: Uint8Array, offset: number): Uint8Array {
  const out = new Uint8Array(TEX_BYTES);
  const n = Math.min(TEX_BYTES, Math.max(0, data.length - offset));
  out.set(data.subarray(offset, offset + n));
  return out;
}

function decompressTexture(view: DataView, offset: number, length: number): Uint8Array {
  if (length < offset + 4) {
    throw new Ps2IconError('File truncated in compressed texture header');
  }
  const compressedSize = view.getUint32(offset, true);
  offset += 4;
  if (length < offset + compressedSize || compressedSize % 2 !== 0) {
    throw new Ps2IconError('Corrupt compressed texture');
  }

  const out = new Uint8Array(TEX_BYTES);
  let dst = 0;
  let src = offset;
  const end = offset + compressedSize;

  while (src + 2 <= end && dst < TEX_BYTES) {
    let code = view.getUint16(src, true);
    src += 2;
    // Katamari icons insert a stray 0 codeword.
    if (code === 0 && src + 2 <= end) {
      code = view.getUint16(src, true);
      src += 2;
    }
    if (code >= 0xfe00) {
      const count = 0x10000 - code;
      for (let i = 0; i < count && dst < TEX_BYTES && src + 2 <= end; i++) {
        out[dst++] = view.getUint8(src++);
        out[dst++] = view.getUint8(src++);
      }
    } else {
      if (src + 2 > end) break;
      const b0 = view.getUint8(src++);
      const b1 = view.getUint8(src++);
      for (let i = 0; i < code && dst < TEX_BYTES; i++) {
        out[dst++] = b0;
        out[dst++] = b1;
      }
    }
  }
  return out;
}

/** A1B5G5R5 (PS2 TIM) → RGBA8888. */
export function textureToRgba(texture: Uint8Array): Uint8Array {
  const rgba = new Uint8Array(TEX_W * TEX_H * 4);
  for (let i = 0; i < TEX_W * TEX_H; i++) {
    const px = texture[i * 2] | (texture[i * 2 + 1] << 8);
    const r = px & 0x1f;
    const g = (px >> 5) & 0x1f;
    const b = (px >> 10) & 0x1f;
    const a = (px >> 15) & 1;
    rgba[i * 4] = (r << 3) | (r >> 2);
    rgba[i * 4 + 1] = (g << 3) | (g >> 2);
    rgba[i * 4 + 2] = (b << 3) | (b >> 2);
    rgba[i * 4 + 3] = a ? 255 : 255;
  }
  return rgba;
}

function fp(v: number): number {
  return v / FIXED;
}

/**
 * PS2 vertex colours are 8-bit channels used as a GS modulate.
 * 0x80 is 1.0 (the hardware effectively does `texture * color * 2`).
 * Authors who filled the full 0–255 range meant 255 = 1.0, not 2.0.
 *
 * A flat dim grey on a textured icon is almost always leftover lighting
 * (THPS, GTA, …). Multiplying the TIM by ~0.25 makes the model look
 * untextured / crushed; skip the modulate in that case.
 */
export function ps2VertexColorScale(icon: Pick<Ps2Icon, 'colorData' | 'vertexCount' | 'texture'>): number {
  let minC = 255;
  let maxC = 0;
  let maxChroma = 0;
  for (let i = 0; i < icon.vertexCount; i++) {
    const r = icon.colorData[i * 4];
    const g = icon.colorData[i * 4 + 1];
    const b = icon.colorData[i * 4 + 2];
    minC = Math.min(minC, r, g, b);
    maxC = Math.max(maxC, r, g, b);
    maxChroma = Math.max(maxChroma, Math.max(r, g, b) - Math.min(r, g, b));
  }
  const flat = maxC - minC <= 8;
  if (icon.texture && flat && maxChroma <= 8 && maxC <= 136) {
    return 0; // signal: emit white
  }
  return maxC > 160 ? 255 : 128;
}

export function ps2VertexColor(r: number, g: number, b: number, scale: number): [number, number, number] {
  if (scale === 0) return [1, 1, 1];
  return [r / scale, g / scale, b / scale];
}

/**
 * Vertex transform used by PS2IODB's three.js ModelViewRenderer (animateV1/V2)
 * and OBJ exporter: `(-x, -y, z)`. That is Y-up with the same facing as
 * https://ps2iodb.com — 180° around Y relative to a pure Y-down→Y-up flip.
 */
export function ps2IconXform(x: number, y: number, z: number): [number, number, number] {
  return [-x, -y, z];
}

/**
 * PS2IODB's OBJ exporter writes a vertically flipped PNG (OpenGL, `y = 127 - row`).
 * Three.js undoes that with Texture.flipY when loading OBJ/MTL. glTF samples
 * images from the top-left with flipY disabled, so invert V to match.
 */
export function ps2iodbObjUvToGltf(u: number, v: number): [number, number] {
  return [u, 1 - v];
}

export function evalPs2AnimKeys(keys: FrameKey[], t: number): number {
  if (keys.length === 0) return 0;
  if (t <= keys[0].time) return keys[0].value;
  const last = keys[keys.length - 1];
  if (t >= last.time) return last.value;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (a.time <= t && t < b.time) {
      const dt = b.time - a.time;
      if (dt === 0) return a.value;
      const u = (t - a.time) / dt;
      return (1 - u) * a.value + u * b.value;
    }
  }
  return last.value;
}

/** Blend-shape morph weights (shape 1..) matching PS2IODB ModelViewRenderer.animateV2. */
export function ps2iodbBlendMorphWeights(
  frames: Array<{ keys: FrameKey[] }>,
  frameTime: number,
): number[] {
  const n = frames.length;
  const shapeW = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    shapeW[i] += evalPs2AnimKeys(frames[i].keys, frameTime);
  }
  const sum = shapeW.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < n; i++) shapeW[i] /= sum;
  } else if (n > 0) {
    shapeW[0] = 1;
  }
  return shapeW.slice(1);
}

/** Sequential-shape duration used by ModelViewRenderer.animateV1. */
export const PS2IODB_V1_SECONDS_PER_FRAME = 0.15;

export interface Ps2iodbAnimFrame {
  shapeId?: number;
  keys: FrameKey[];
  vertexData: number[];
}

export interface Ps2iodbAnim {
  version?: number;
  frameLength: number;
  animSpeed: number;
  frames: Ps2iodbAnimFrame[];
}

export function parsePs2iodbAnim(text: string): Ps2iodbAnim {
  let data: Ps2iodbAnim;
  try {
    data = JSON.parse(text) as Ps2iodbAnim;
  } catch {
    throw new Ps2IconError('PS2IODB .anim is not JSON');
  }
  if (!data || !Array.isArray(data.frames) || data.frames.length === 0) {
    throw new Ps2IconError('PS2IODB .anim has no frames');
  }
  return data;
}

export function ps2iodbShapesDiffer(frames: Array<{ vertexData: number[] }>): boolean {
  if (frames.length < 2) return false;
  const a = frames[0].vertexData;
  for (let i = 1; i < frames.length; i++) {
    const b = frames[i].vertexData;
    if (b.length !== a.length) return true;
    for (let j = 0; j < a.length; j++) {
      if (Math.abs(a[j] - b[j]) > 1e-6) return true;
    }
  }
  return false;
}

/** Apply the three.js `(-x, -y, z)` transform to a flat PS2IODB vertex array. */
export function ps2iodbTransformedShape(vertexData: number[]): number[] {
  const out = new Array<number>(vertexData.length);
  for (let i = 0; i < vertexData.length; i += 3) {
    const [x, y, z] = ps2IconXform(vertexData[i], vertexData[i + 1], vertexData[i + 2]);
    out[i] = x;
    out[i + 1] = y;
    out[i + 2] = z;
  }
  return out;
}

/** glTF morph-weight clip matching PS2IODB animateV1 / animateV2. */
export function ps2iodbAnimClip(anim: Ps2iodbAnim): { times: number[]; weights: number[] } | null {
  if (anim.frames.length < 2 || !ps2iodbShapesDiffer(anim.frames)) return null;
  const nMorph = anim.frames.length - 1;
  const isV1 = anim.version === undefined;
  if (isV1) {
    const times: number[] = [];
    const weights: number[] = [];
    for (let i = 0; i <= anim.frames.length; i++) {
      times.push(i * PS2IODB_V1_SECONDS_PER_FRAME);
      const w = new Array<number>(nMorph).fill(0);
      if (i > 0 && i < anim.frames.length) w[i - 1] = 1;
      weights.push(...w);
    }
    return { times, weights };
  }
  const speed = anim.animSpeed > 0.001 ? anim.animSpeed : 1;
  const frameLength = anim.frameLength > 0 ? anim.frameLength : 1;
  const uniq = new Set<number>([0, frameLength]);
  for (const frame of anim.frames) {
    for (const key of frame.keys ?? []) uniq.add(key.time);
  }
  const frameTimes = [...uniq].filter((t) => t >= 0 && t <= frameLength).sort((a, b) => a - b);
  const times: number[] = [];
  const weights: number[] = [];
  for (const ft of frameTimes) {
    times.push(ft / (60 * speed));
    weights.push(...ps2iodbBlendMorphWeights(anim.frames, ft));
  }
  if (times.length >= 2) {
    const firstW = weights.slice(0, nMorph);
    const lastW = weights.slice(-nMorph);
    const same = firstW.every((v, i) => Math.abs(v - lastW[i]) < 1e-5);
    if (!same) {
      times.push(frameLength / (60 * speed));
      weights.push(...firstW);
    }
  }
  return { times, weights };
}

function morphWeightsAt(icon: Ps2Icon, frameTime: number): number[] {
  const n = icon.animationShapes;
  const shapeW = new Array<number>(n).fill(0);
  for (const frame of icon.frames) {
    const id = Math.min(Math.max(frame.shapeId, 0), n - 1);
    shapeW[id] += evalPs2AnimKeys(frame.keys, frameTime);
  }
  const sum = shapeW.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let i = 0; i < n; i++) shapeW[i] /= sum;
  } else {
    shapeW[0] = 1;
  }
  // glTF morph i is shape i+1; base mesh is shape 0 (the remainder).
  return shapeW.slice(1);
}

export function ps2IconToGlb(icon: Ps2Icon, name = 'Icon'): Uint8Array {
  const vCount = icon.vertexCount;
  const nMorph = Math.max(0, icon.animationShapes - 1);
  const animated = nMorph > 0 && icon.frames.length > 0 && icon.frameLength > 0;

  const colorScale = ps2VertexColorScale(icon);

  const positions: number[] = [];
  const morphs: number[][] = Array.from({ length: nMorph }, () => []);
  const normals: number[] = [];
  const uvs: number[] = [];
  const colors: number[] = [];
  const posMin = [Infinity, Infinity, Infinity];
  const posMax = [-Infinity, -Infinity, -Infinity];
  const morphMin: number[][] = Array.from({ length: nMorph }, () => [Infinity, Infinity, Infinity]);
  const morphMax: number[][] = Array.from({ length: nMorph }, () => [-Infinity, -Infinity, -Infinity]);

  for (let i = 0; i < vCount; i++) {
    const b = (0 * vCount + i) * 3;
    const [x, y, z] = ps2IconXform(fp(icon.vertexData[b]), fp(icon.vertexData[b + 1]), fp(icon.vertexData[b + 2]));
    positions.push(x, y, z);
    posMin[0] = Math.min(posMin[0], x); posMin[1] = Math.min(posMin[1], y); posMin[2] = Math.min(posMin[2], z);
    posMax[0] = Math.max(posMax[0], x); posMax[1] = Math.max(posMax[1], y); posMax[2] = Math.max(posMax[2], z);

    for (let s = 1; s <= nMorph; s++) {
      const so = (s * vCount + i) * 3;
      const [sx, sy, sz] = ps2IconXform(fp(icon.vertexData[so]), fp(icon.vertexData[so + 1]), fp(icon.vertexData[so + 2]));
      const dx = sx - x;
      const dy = sy - y;
      const dz = sz - z;
      morphs[s - 1].push(dx, dy, dz);
      const mn = morphMin[s - 1];
      const mx = morphMax[s - 1];
      mn[0] = Math.min(mn[0], dx); mn[1] = Math.min(mn[1], dy); mn[2] = Math.min(mn[2], dz);
      mx[0] = Math.max(mx[0], dx); mx[1] = Math.max(mx[1], dy); mx[2] = Math.max(mx[2], dz);
    }

    const [nx, ny, nz] = ps2IconXform(fp(icon.normalData[i * 3]), fp(icon.normalData[i * 3 + 1]), fp(icon.normalData[i * 3 + 2]));
    const nlen = Math.hypot(nx, ny, nz) || 1;
    normals.push(nx / nlen, ny / nlen, nz / nlen);

    // glTF UV origin is top-left, same as the PNG we embed. Do not flip:
    // 1-u mirrored logos (GRAN TURISMO read back-to-front); 1-v flipped them.
    uvs.push(fp(icon.uvData[i * 2]), fp(icon.uvData[i * 2 + 1]));

    const [cr, cg, cb] = ps2VertexColor(
      icon.colorData[i * 4],
      icon.colorData[i * 4 + 1],
      icon.colorData[i * 4 + 2],
      colorScale,
    );
    colors.push(cr, cg, cb);
  }

  let animTimes: number[] = [];
  let animWeights: number[] = [];
  if (animated) {
    const speed = icon.animSpeed > 0.001 ? icon.animSpeed : 1;
    const times = new Set<number>([0, icon.frameLength]);
    for (const frame of icon.frames) {
      for (const key of frame.keys) times.add(key.time);
    }
    const frameTimes = [...times].filter((t) => t >= 0 && t <= icon.frameLength).sort((a, b) => a - b);
    for (const ft of frameTimes) {
      animTimes.push(ft / (60 * speed));
      animWeights.push(...morphWeightsAt(icon, ft));
    }
    // Loop: last sample matches first so LINEAR wrap doesn't hitch.
    if (animTimes.length >= 2) {
      const firstW = animWeights.slice(0, nMorph);
      const lastW = animWeights.slice(-nMorph);
      const same = firstW.every((v, i) => Math.abs(v - lastW[i]) < 1e-5);
      if (!same) {
        animTimes.push(icon.frameLength / (60 * speed));
        animWeights.push(...firstW);
      }
    }
  }

  const png = icon.texture ? encodePng(TEX_W, TEX_H, textureToRgba(icon.texture)) : null;
  const hasTex = png !== null;

  const binParts: Uint8Array[] = [];
  const views: Array<{ offset: number; length: number; stride?: number; target?: number }> = [];
  let binOffset = 0;
  const addView = (bytes: Uint8Array, stride?: number, target?: number) => {
    const offset = binOffset;
    binParts.push(bytes);
    binOffset += bytes.byteLength;
    views.push({ offset, length: bytes.byteLength, stride, target });
    return views.length - 1;
  };

  const posView = addView(new Uint8Array(new Float32Array(positions).buffer), 12, 34962);
  const morphViews = morphs.map((m) =>
    addView(new Uint8Array(new Float32Array(m).buffer), 12, 34962)
  );
  const nrmView = addView(new Uint8Array(new Float32Array(normals).buffer), 12, 34962);
  const uvView = addView(new Uint8Array(new Float32Array(uvs).buffer), 8, 34962);
  const colView = addView(new Uint8Array(new Float32Array(colors).buffer), 12, 34962);
  let timeView = -1;
  let weightView = -1;
  if (animated && animTimes.length > 0) {
    timeView = addView(new Uint8Array(new Float32Array(animTimes).buffer));
    weightView = addView(new Uint8Array(new Float32Array(animWeights).buffer));
  }
  let imgView = -1;
  if (hasTex && png) {
    imgView = addView(png);
  }

  // concat
  const bin = new Uint8Array(binOffset);
  let w = 0;
  for (const part of binParts) {
    bin.set(part, w);
    w += part.byteLength;
  }

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
  if (animated && animTimes.length > 0) {
    timeAcc = accessors.length;
    accessors.push({
      name: 'animTime',
      bufferView: timeView,
      componentType: 5126,
      count: animTimes.length,
      type: 'SCALAR',
      min: [animTimes[0]],
      max: [animTimes[animTimes.length - 1]],
    });
    weightAcc = accessors.length;
    accessors.push({
      name: 'animWeights',
      bufferView: weightView,
      componentType: 5126,
      count: animWeights.length,
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

  const material: Record<string, unknown> = {
    name: 'ps2-icon',
    pbrMetallicRoughness: {
      metallicFactor: 0,
      roughnessFactor: 1,
      baseColorFactor: [1, 1, 1, 1],
    },
    extensions: { KHR_materials_unlit: {} },
  };
  if (hasTex) {
    (material.pbrMetallicRoughness as Record<string, unknown>).baseColorTexture = { index: 0 };
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

  if (hasTex) {
    gltf.images = [{ bufferView: imgView, mimeType: 'image/png' }];
    gltf.textures = [{ source: 0 }];
    gltf.samplers = [{ magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }];
    (gltf.textures as object[])[0] = { source: 0, sampler: 0 };
  }

  if (animated && timeAcc >= 0) {
    gltf.animations = [{
      name: 'idle',
      samplers: [{ input: timeAcc, output: weightAcc, interpolation: 'LINEAR' }],
      channels: [{ sampler: 0, target: { node: 0, path: 'weights' } }],
    }];
  }

  return packGlb(gltf, bin);
}

function pad4(n: number): number {
  return (4 - (n % 4)) % 4;
}

function packGlb(json: object, binary: Uint8Array): Uint8Array {
  const jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = pad4(jsonBytes.length);
  const binPad = pad4(binary.length);
  const jsonChunkLen = jsonBytes.length + jsonPad;
  const binChunkLen = binary.length + binPad;
  const total = 12 + 8 + jsonChunkLen + 8 + binChunkLen;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  view.setUint32(0, 0x46546c67, true); // glTF
  view.setUint32(4, 2, true);
  view.setUint32(8, total, true);
  view.setUint32(12, jsonChunkLen, true);
  view.setUint32(16, 0x4e4f534a, true); // JSON
  out.set(jsonBytes, 20);
  for (let i = 0; i < jsonPad; i++) out[20 + jsonBytes.length + i] = 0x20;
  const binHeader = 20 + jsonChunkLen;
  view.setUint32(binHeader, binChunkLen, true);
  view.setUint32(binHeader + 4, 0x004e4942, true); // BIN
  out.set(binary, binHeader + 8);
  return out;
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + data.length + 4);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length, false);
  out[4] = type.charCodeAt(0);
  out[5] = type.charCodeAt(1);
  out[6] = type.charCodeAt(2);
  out[7] = type.charCodeAt(3);
  out.set(data, 8);
  const crcSrc = out.subarray(4, 8 + data.length);
  view.setUint32(8 + data.length, crc32(crcSrc), false);
  return out;
}

export function encodePng(width: number, height: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 4)] = 0;
    raw.set(rgba.subarray(y * width * 4, (y + 1) * width * 4), y * (1 + width * 4) + 1);
  }
  const ihdr = new Uint8Array(13);
  const ihdrView = new DataView(ihdr.buffer);
  ihdrView.setUint32(0, width, false);
  ihdrView.setUint32(4, height, false);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  const idat = deflateSync(raw);
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const iend = pngChunk('IEND', new Uint8Array(0));
  const ihdrChunk = pngChunk('IHDR', ihdr);
  const idatChunk = pngChunk('IDAT', idat);
  const out = new Uint8Array(sig.length + ihdrChunk.length + idatChunk.length + iend.length);
  out.set(sig, 0);
  out.set(ihdrChunk, sig.length);
  out.set(idatChunk, sig.length + ihdrChunk.length);
  out.set(iend, sig.length + ihdrChunk.length + idatChunk.length);
  return out;
}

export interface PsuFile {
  name: string;
  data: Uint8Array;
}

export function parsePsu(data: Uint8Array): PsuFile[] {
  if (data.length < PSU_DIRENT * 3) {
    throw new Ps2IconError('File too small to be a PSU save');
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const fileCount = view.getUint32(4, true) - 2;
  if (fileCount < 0 || fileCount > 256) {
    throw new Ps2IconError('Not a valid PSU save');
  }
  const files: PsuFile[] = [];
  let o = PSU_DIRENT * 3;
  for (let i = 0; i < fileCount; i++) {
    if (o + PSU_DIRENT > data.length) break;
    const size = view.getUint32(o + 4, true);
    const nameBytes = data.subarray(o + 64, o + 96);
    const z = nameBytes.indexOf(0);
    const name = new TextDecoder('ascii').decode(z >= 0 ? nameBytes.subarray(0, z) : nameBytes);
    o += PSU_DIRENT;
    if (o + size > data.length) break;
    files.push({ name, data: data.subarray(o, o + size) });
    o += Math.ceil(size / PSU_CLUSTER) * PSU_CLUSTER;
  }
  return files;
}

export interface IconSysMeta {
  titleRaw: Uint8Array;
  titleLineOffset: number;
  normal: string;
  copy: string;
  delete: string;
}

function cString(bytes: Uint8Array): string {
  const z = bytes.indexOf(0);
  return new TextDecoder('ascii').decode(z >= 0 ? bytes.subarray(0, z) : bytes);
}

export function parseIconSys(data: Uint8Array): IconSysMeta {
  if (data.length < 452) {
    throw new Ps2IconError('icon.sys too small');
  }
  const magic = new TextDecoder('ascii').decode(data.subarray(0, 4));
  if (magic !== 'PS2D') {
    throw new Ps2IconError('Not an icon.sys file');
  }
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  return {
    titleRaw: data.subarray(0xc0, 0x100),
    titleLineOffset: view.getUint16(6, true),
    normal: cString(data.subarray(0x104, 0x144)),
    copy: cString(data.subarray(0x144, 0x184)),
    delete: cString(data.subarray(0x184, 0x1c4)),
  };
}

/** ASCII-only fallback for Shift-JIS titles (full decode is done in the CLI). */
export function asciiTitle(titleRaw: Uint8Array, lineOffset: number): string {
  const chars: string[] = [];
  for (const b of titleRaw) {
    if (b === 0) break;
    chars.push(b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ' ');
  }
  const s = chars.join('').replace(/\s+/g, ' ').trim();
  if (!s) return '';
  const split = Math.floor(lineOffset / 2);
  if (split > 0 && split < chars.length) {
    const a = chars.slice(0, split).join('').trim();
    const b = chars.slice(split).join('').replace(/\s+/g, ' ').trim();
    return [a, b].filter(Boolean).join(' ');
  }
  return s;
}
