import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePs2Icon, parsePsu, parseIconSys, ps2IconToGlb, ps2VertexColor, ps2VertexColorScale, ps2IconXform, ps2iodbObjUvToGltf } from './ps2-icon';

const fixture = (...parts: string[]) =>
  join(process.cwd(), 'src/utils/testdata/ps2-icon', ...parts);

describe('parsePs2Icon', () => {
  it('parses a tiny untextured tetrahedron', () => {
    const icon = parsePs2Icon(readFileSync(fixture('example_001.icn')));
    expect(icon.animationShapes).toBe(1);
    expect(icon.vertexCount).toBe(12);
    expect(icon.texture).toBeNull();
    expect(icon.vertexCount % 3).toBe(0);
  });

  it('parses a real textured save icon (Rez)', () => {
    const icon = parsePs2Icon(readFileSync(fixture('rez.ico')));
    expect(icon.animationShapes).toBe(1);
    expect(icon.vertexCount).toBe(564);
    expect(icon.texture).not.toBeNull();
    expect(icon.texture!.length).toBe(128 * 128 * 2);
  });
});

describe('ps2VertexColorScale', () => {
  const colors = (rgb: number[], n: number, texture: Uint8Array | null = new Uint8Array(1)) => ({
    colorData: Uint8Array.from({ length: n * 4 }, (_, i) => rgb[i % 4]),
    vertexCount: n,
    texture,
  });

  it('treats 0x80 as 1.0 (PS2 GS modulate)', () => {
    expect(ps2VertexColor(128, 64, 0, 128)).toEqual([1, 0.5, 0]);
  });

  it('uses 0–255 when authors filled the full range', () => {
    const scale = ps2VertexColorScale(colors([255, 200, 10, 255], 3));
    expect(scale).toBe(255);
    expect(ps2VertexColor(255, 200, 10, scale)[0]).toBe(1);
  });

  it('does not dim a textured icon that only has flat lighting-grey vertices', () => {
    // THPS / GTA-style: every vertex is ~80 and the TIM has the real art.
    expect(ps2VertexColorScale(colors([80, 80, 80, 255], 12))).toBe(0);
    expect(ps2VertexColor(80, 80, 80, 0)).toEqual([1, 1, 1]);
  });

  it('keeps per-vertex variation on the 128-scale (Medal of Honor grenade)', () => {
    const colorData = new Uint8Array(8 * 4);
    for (let i = 0; i < 8; i++) {
      colorData[i * 4] = i * 16;
      colorData[i * 4 + 1] = 40;
      colorData[i * 4 + 2] = 80;
      colorData[i * 4 + 3] = 255;
    }
    expect(ps2VertexColorScale({ colorData, vertexCount: 8, texture: new Uint8Array(1) })).toBe(128);
  });
});

describe('parsePsu', () => {
  it('extracts icon.sys and the icon model from a PSU', () => {
    const files = parsePsu(readFileSync(fixture('example_001.psu')));
    const names = files.map((f) => f.name);
    expect(names).toContain('icon.sys');
    expect(names.some((n) => n.endsWith('.icn') || n.endsWith('.ico'))).toBe(true);
  });

  it('reads icon.sys metadata for Rez', () => {
    const sys = parseIconSys(readFileSync(fixture('rez.icon.sys')));
    expect(sys.normal.toLowerCase()).toBe('rez.ico');
  });
});

describe('ps2IconToGlb', () => {
  it('writes a glTF-binary file with a JSON chunk', () => {
    const icon = parsePs2Icon(readFileSync(fixture('example_001.icn')));
    const glb = ps2IconToGlb(icon, 'example');
    const magic = new TextDecoder('ascii').decode(glb.subarray(0, 4));
    expect(magic).toBe('glTF');
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    expect(view.getUint32(4, true)).toBe(2);
    expect(view.getUint32(8, true)).toBe(glb.byteLength);
    const jsonLen = view.getUint32(12, true);
    const jsonType = view.getUint32(16, true);
    expect(jsonType).toBe(0x4e4f534a);
    const json = new TextDecoder().decode(glb.subarray(20, 20 + jsonLen));
    const doc = JSON.parse(json);
    expect(doc.asset.version).toBe('2.0');
    expect(doc.meshes[0].primitives[0].attributes.POSITION).toBe(0);
    expect(doc.extensionsUsed).toContain('KHR_materials_unlit');
  });

  it('embeds a PNG texture for Rez', () => {
    const icon = parsePs2Icon(readFileSync(fixture('rez.ico')));
    const glb = ps2IconToGlb(icon, 'rez');
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    const jsonLen = view.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
    expect(json.images).toHaveLength(1);
    expect(json.images[0].mimeType).toBe('image/png');
    expect(glb.byteLength).toBeGreaterThan(1000);
  });

  it('writes Rez vertex colours at full brightness (not gamma-crushed)', () => {
    const icon = parsePs2Icon(readFileSync(fixture('rez.ico')));
    const glb = ps2IconToGlb(icon, 'rez');
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    const jsonLen = view.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
    const jsonPad = (4 - (jsonLen % 4)) % 4;
    const binOffset = 20 + jsonLen + jsonPad + 8;
    const colAcc = json.accessors.find((a: { name?: string }) => a.name === 'COLOR_0');
    const bv = json.bufferViews[colAcc.bufferView];
    const r0 = view.getFloat32(binOffset + bv.byteOffset, true);
    expect(r0).toBeCloseTo(1, 5);
  });

  it('writes UVs as authored (glTF top-left matches the PNG)', () => {
    const icon = parsePs2Icon(readFileSync(fixture('rez.ico')));
    const glb = ps2IconToGlb(icon, 'rez');
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    const jsonLen = view.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
    const jsonPad = (4 - (jsonLen % 4)) % 4;
    const binOffset = 20 + jsonLen + jsonPad + 8;
    const uvAcc = json.accessors.find((a: { name?: string }) => a.name === 'TEXCOORD_0');
    const bv = json.bufferViews[uvAcc.bufferView];
    const u0 = view.getFloat32(binOffset + bv.byteOffset, true);
    const v0 = view.getFloat32(binOffset + bv.byteOffset + 4, true);
    expect(u0).toBeCloseTo(icon.uvData[0] / 4096, 5);
    expect(v0).toBeCloseTo(icon.uvData[1] / 4096, 5);
  });

  it('applies the PS2IODB three.js vertex transform (-x, -y, z)', () => {
    const icon = parsePs2Icon(readFileSync(fixture('rez.ico')));
    const glb = ps2IconToGlb(icon, 'rez');
    const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
    const jsonLen = view.getUint32(12, true);
    const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
    const jsonPad = (4 - (jsonLen % 4)) % 4;
    const binOffset = 20 + jsonLen + jsonPad + 8;
    const posAcc = json.accessors.find((a: { name?: string }) => a.name === 'POSITION');
    const bv = json.bufferViews[posAcc.bufferView];
    const x = view.getFloat32(binOffset + bv.byteOffset, true);
    const y = view.getFloat32(binOffset + bv.byteOffset + 4, true);
    const z = view.getFloat32(binOffset + bv.byteOffset + 8, true);
    const [ex, ey, ez] = ps2IconXform(icon.vertexData[0] / 4096, icon.vertexData[1] / 4096, icon.vertexData[2] / 4096);
    expect(x).toBeCloseTo(ex, 5);
    expect(y).toBeCloseTo(ey, 5);
    expect(z).toBeCloseTo(ez, 5);
    expect(ps2IconXform(1, 2, 3)).toEqual([-1, -2, 3]);
  });
});

describe('ps2iodbObjUvToGltf', () => {
  it('inverts V so OpenGL-flipped PS2IODB PNGs sample correctly in glTF', () => {
    expect(ps2iodbObjUvToGltf(0.25, 0.75)).toEqual([0.25, 0.25]);
    expect(ps2iodbObjUvToGltf(0, 0)).toEqual([0, 1]);
    expect(ps2iodbObjUvToGltf(1, 1)).toEqual([1, 0]);
  });
});
