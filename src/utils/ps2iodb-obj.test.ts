import { describe, it, expect } from 'vitest';
import { objToGlb } from '../../scripts/import-ps2iodb';

function glbAccessor(glb: Uint8Array, name: string): { values: number[]; componentCount: number } {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  const jsonLen = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
  const jsonPad = (4 - (jsonLen % 4)) % 4;
  const binOffset = 20 + jsonLen + jsonPad + 8;
  const acc = json.accessors.find((a: { name?: string }) => a.name === name);
  const bv = json.bufferViews[acc.bufferView];
  const width = acc.type === 'VEC2' ? 2 : acc.type === 'VEC3' ? 3 : 1;
  const values: number[] = [];
  for (let i = 0; i < acc.count * width; i++) {
    values.push(view.getFloat32(binOffset + bv.byteOffset + i * 4, true));
  }
  return { values, componentCount: width };
}

describe('objToGlb', () => {
  it('inverts OBJ V coordinates for glTF (PS2IODB PNG is OpenGL-flipped)', () => {
    const obj = [
      'v 0 0 0 1 1 1',
      'v 1 0 0 1 1 1',
      'v 0 1 0 1 1 1',
      'vt 0.25 0.75',
      'vt 0.5 0.125',
      'vt 0 1',
      'vn 0 1 0',
      'vn 0 1 0',
      'vn 0 1 0',
      'f 1/1/1 2/2/2 3/3/3',
      '',
    ].join('\n');
    const glb = objToGlb(obj, null, 'test');
    const uv = glbAccessor(glb, 'TEXCOORD_0').values;
    expect(uv[0]).toBeCloseTo(0.25, 5);
    expect(uv[1]).toBeCloseTo(0.25, 5);
    expect(uv[2]).toBeCloseTo(0.5, 5);
    expect(uv[3]).toBeCloseTo(0.875, 5);
    expect(uv[4]).toBeCloseTo(0, 5);
    expect(uv[5]).toBeCloseTo(0, 5);
  });
});
