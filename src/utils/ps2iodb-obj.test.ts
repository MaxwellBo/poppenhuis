import { describe, it, expect } from 'vitest';
import { objToGlb } from '../../scripts/import-ps2iodb';

function glbJson(glb: Uint8Array): Record<string, unknown> {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  const jsonLen = view.getUint32(12, true);
  return JSON.parse(new TextDecoder().decode(glb.subarray(20, 20 + jsonLen)));
}

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

const triangleObj = [
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

describe('objToGlb', () => {
  it('inverts OBJ V coordinates for glTF (PS2IODB PNG is OpenGL-flipped)', () => {
    const glb = objToGlb(triangleObj, null, 'test');
    const uv = glbAccessor(glb, 'TEXCOORD_0').values;
    expect(uv[0]).toBeCloseTo(0.25, 5);
    expect(uv[1]).toBeCloseTo(0.25, 5);
    expect(uv[2]).toBeCloseTo(0.5, 5);
    expect(uv[3]).toBeCloseTo(0.875, 5);
    expect(uv[4]).toBeCloseTo(0, 5);
    expect(uv[5]).toBeCloseTo(0, 5);
  });

  it('embeds morph targets and a looping weights clip from a v3 .anim', () => {
    // OBJ verts are already (-x, -y, z). Raw anim verts are untransformed.
    const anim = JSON.stringify({
      version: 3,
      frameLength: 60,
      animSpeed: 1,
      frames: [
        {
          shapeId: 0,
          keys: [{ time: 0, value: 1 }, { time: 60, value: 0 }],
          vertexData: [0, 0, 0, -1, 0, 0, 0, -1, 0],
        },
        {
          shapeId: 1,
          keys: [{ time: 0, value: 0 }, { time: 60, value: 1 }],
          vertexData: [0, 0, 1, -1, 0, 1, 0, -1, 1],
        },
      ],
    });
    const glb = objToGlb(triangleObj, null, 'test', anim);
    const json = glbJson(glb);
    const mesh = (json.meshes as Array<{ primitives: Array<{ targets?: unknown[] }>; weights?: number[] }>)[0];
    expect(mesh.primitives[0].targets).toHaveLength(1);
    expect(mesh.weights).toEqual([0]);
    expect(json.animations).toHaveLength(1);
    const channel = (json.animations as Array<{ channels: Array<{ target: { path: string } }> }>)[0];
    expect(channel.channels[0].target.path).toBe('weights');
    const morph = glbAccessor(glb, 'MORPH_0').values;
    expect(morph[2]).toBeCloseTo(1, 5);
    expect(morph[5]).toBeCloseTo(1, 5);
    expect(morph[8]).toBeCloseTo(1, 5);
    const times = glbAccessor(glb, 'animTime').values;
    expect(times[0]).toBeCloseTo(0, 5);
    expect(times[times.length - 1]).toBeCloseTo(1, 5);
  });

  it('skips morphs when animation shapes are identical (Champions of Norrath)', () => {
    const verts = [0, 0, 0, -1, 0, 0, 0, -1, 0];
    const anim = JSON.stringify({
      version: 1,
      frameLength: 8,
      animSpeed: 1,
      frames: [
        { shapeId: 0, keys: [{ time: 0, value: 1 }], vertexData: verts },
        { shapeId: 1, keys: [{ time: 0, value: 0 }], vertexData: verts.slice() },
      ],
    });
    const glb = objToGlb(triangleObj, null, 'test', anim);
    const json = glbJson(glb);
    expect((json.meshes as Array<{ primitives: Array<{ targets?: unknown }> }>)[0].primitives[0].targets).toBeUndefined();
    expect(json.animations).toBeUndefined();
  });
});
