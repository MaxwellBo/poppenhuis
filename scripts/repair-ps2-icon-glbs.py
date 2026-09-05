#!/usr/bin/env python3
"""Re-light existing PS2 save-icon GLBs.

Our exporter used to write COLOR_0 as (byte/255)^2.2. PS2 icons treat 0x80 as
1.0, and many textured icons only store a flat lighting grey — the combination
crushed Tony Hawk / Medal of Honor / GTA models to ~5–20% brightness.

The 78 Blender-imported PS2IODB meshes are lit PBR with a white COLOR_0. Models
whose TIM was dropped (Ace Combat 5, …) therefore render as an untextured white
shell. We mark them unlit and restore the vertex colours from COLOR_1.
"""

from __future__ import annotations

import json
import math
import os
import struct
import sys
from pathlib import Path

ROOT = Path(os.environ.get("BUILD_WORKSPACE_DIRECTORY", "."))
GOLDENS = ROOT / 'public' / 'assets' / 'goldens'


def load_glb(path: Path):
    data = bytearray(path.read_bytes())
    json_len = struct.unpack_from('<I', data, 12)[0]
    js = json.loads(bytes(data[20:20 + json_len]))
    json_pad = (4 - (json_len % 4)) % 4
    bin_off = 20 + json_len + json_pad + 8
    return data, js, json_len, bin_off


def pack_glb(js: dict, binary: bytes) -> bytes:
    raw = json.dumps(js, separators=(',', ':')).encode()
    json_pad = (4 - (len(raw) % 4)) % 4
    json_chunk = raw + b' ' * json_pad
    bin_pad = (4 - (len(binary) % 4)) % 4
    bin_chunk = binary + b'\x00' * bin_pad
    total = 12 + 8 + len(json_chunk) + 8 + len(bin_chunk)
    out = bytearray(total)
    struct.pack_into('<III', out, 0, 0x46546C67, 2, total)
    struct.pack_into('<II', out, 12, len(json_chunk), 0x4E4F534A)
    out[20:20 + len(json_chunk)] = json_chunk
    bh = 20 + len(json_chunk)
    struct.pack_into('<II', out, bh, len(bin_chunk), 0x004E4942)
    out[bh + 8:bh + 8 + len(bin_chunk)] = bin_chunk
    return bytes(out)


def bin_slice(data: bytearray, js: dict, json_len: int) -> bytearray:
    json_pad = (4 - (json_len % 4)) % 4
    bin_off = 20 + json_len + json_pad + 8
    bin_len = js['buffers'][0]['byteLength']
    return bytearray(data[bin_off:bin_off + bin_len])


def color_scale(rgbs: list[tuple[int, int, int]], has_tex: bool) -> int:
    mins = [min(c[i] for c in rgbs) for i in range(3)]
    maxs = [max(c[i] for c in rgbs) for i in range(3)]
    min_c, max_c = min(mins), max(maxs)
    chroma = max(maxs[i] - mins[i] for i in range(3))
    spread = max_c - min_c
    if has_tex and spread <= 8 and chroma <= 8 and max_c <= 136:
        return 0
    return 255 if max_c > 160 else 128


def repair_ours(path: Path, data: bytearray, js: dict, json_len: int, bin_off: int) -> bool:
    prim = js['meshes'][0]['primitives'][0]
    attrs = prim['attributes']
    if 'COLOR_0' not in attrs:
        return False
    acc = js['accessors'][attrs['COLOR_0']]
    if acc.get('type') != 'VEC3' or acc.get('componentType') != 5126:
        return False
    bv = js['bufferViews'][acc['bufferView']]
    off = bin_off + bv.get('byteOffset', 0)
    stride = bv.get('byteStride') or 12
    n = acc['count']
    raw = []
    for i in range(n):
        r, g, b = struct.unpack_from('<fff', data, off + i * stride)
        def inv(x: float) -> int:
            x = max(0.0, min(1.0, x))
            return int(round(255 * (x ** (1 / 2.2))))
        raw.append((inv(r), inv(g), inv(b)))
    has_tex = bool(js.get('images'))
    scale = color_scale(raw, has_tex)
    changed = False
    for i, (r, g, b) in enumerate(raw):
        if scale == 0:
            nr, ng, nb = 1.0, 1.0, 1.0
        else:
            nr, ng, nb = r / scale, g / scale, b / scale
        old = struct.unpack_from('<fff', data, off + i * stride)
        if any(abs(a - b_) > 1e-5 for a, b_ in zip(old, (nr, ng, nb))):
            changed = True
        struct.pack_into('<fff', data, off + i * stride, nr, ng, nb)
    if changed:
        path.write_bytes(data)
    return changed


def add_unlit(js: dict) -> None:
    used = js.setdefault('extensionsUsed', [])
    if 'KHR_materials_unlit' not in used:
        used.append('KHR_materials_unlit')
    for mat in js.get('materials', []):
        ext = mat.setdefault('extensions', {})
        ext['KHR_materials_unlit'] = {}
        pbr = mat.setdefault('pbrMetallicRoughness', {})
        pbr.setdefault('metallicFactor', 0)
        pbr.setdefault('roughnessFactor', 1)


def restore_blender_colors(js: dict, binary: bytearray) -> bool:
    prim = js['meshes'][0]['primitives'][0]
    attrs = prim['attributes']
    if 'COLOR_0' not in attrs or 'COLOR_1' not in attrs:
        return False
    images = js.get('images') or []
    if not images:
        return False
    img_bv = js['bufferViews'][images[0]['bufferView']]
    if img_bv['byteLength'] > 2048:
        return False  # real TIM already embedded; leave white COLOR_0

    c1 = js['accessors'][attrs['COLOR_1']]
    bv1 = js['bufferViews'][c1['bufferView']]
    off1 = bv1.get('byteOffset', 0)
    stride1 = bv1.get('byteStride') or 8
    peak = 0.0
    restored = []
    for i in range(c1['count']):
        r, g, b, _a = struct.unpack_from('<HHHH', binary, off1 + i * stride1)
        lin = (r / 65535.0, g / 65535.0, b / 65535.0)
        peak = max(peak, *lin)
        srgb = tuple(int(round(255 * (c ** (1 / 2.2)))) for c in lin)
        restored.append(srgb)
    if peak < 0.02:
        return False  # ICO-style: vertex colours were lost

    c0 = js['accessors'][attrs['COLOR_0']]
    bv0 = js['bufferViews'][c0['bufferView']]
    off0 = bv0.get('byteOffset', 0)
    stride0 = bv0.get('byteStride') or 4
    for i, (r, g, b) in enumerate(restored):
        binary[off0 + i * stride0 + 0] = r
        binary[off0 + i * stride0 + 1] = g
        binary[off0 + i * stride0 + 2] = b
        if stride0 >= 4:
            binary[off0 + i * stride0 + 3] = 255
    return True


def repair_blender(path: Path, data: bytearray, js: dict, json_len: int) -> bool:
    binary = bin_slice(data, js, json_len)
    restore_blender_colors(js, binary)
    add_unlit(js)
    path.write_bytes(pack_glb(js, bytes(binary)))
    return True


def main() -> int:
    files = sorted(GOLDENS.glob('ps2_save-icons_*.glb'))
    if not files:
        print('no PS2 GLBs found', file=sys.stderr)
        return 1
    ours = blend = 0
    for path in files:
        data, js, json_len, bin_off = load_glb(path)
        gen = js.get('asset', {}).get('generator', '')
        if 'poppenhuis' in gen:
            if repair_ours(path, data, js, json_len, bin_off):
                ours += 1
                print(f'ours   {path.name}')
        elif 'Blender' in gen:
            repair_blender(path, data, js, json_len)
            blend += 1
            print(f'blend  {path.name}')
    print(f'\npatched {ours} converter GLBs and {blend} Blender GLBs')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
