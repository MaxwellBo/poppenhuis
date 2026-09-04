import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parsePs2Icon, parsePsu, parseIconSys, ps2IconToGlb } from './ps2-icon';

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
});
