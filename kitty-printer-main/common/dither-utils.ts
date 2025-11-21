// Dithering utilities extracted from image_worker.js for TypeScript usage

export function rgbaToGray(rgba: Uint32Array, brightness = 0x80, alpha_as_white = true): Uint8ClampedArray {
  const mono = new Uint8ClampedArray(rgba.length);
  let r = 0.0, g = 0.0, b = 0.0, a = 0.0, m = 0.0, n = 0;
  for (let i = 0; i < mono.length; ++i) {
    n = rgba[i];
    // little endian
    r = (n & 0xff), g = (n >> 8 & 0xff), b = (n >> 16 & 0xff);
    a = (n >> 24 & 0xff) / 0xff;
    if (a < 1 && alpha_as_white) {
      a = 1 - a;
      r += (0xff - r) * a;
      g += (0xff - g) * a;
      b += (0xff - b) * a;
    } else { r *= a; g *= a; b *= a; }
    m = r * 0.2125 + g * 0.7154 + b * 0.0721;
    m += (brightness - 0x80) * (1 - m / 0xff) * (m / 0xff) * 2;
    mono[i] = m;
  }
  return mono;
}

export function grayToRgba(mono: Uint8ClampedArray, white_as_transparent = false): Uint32Array {
  const rgba = new Uint32Array(mono.length);
  for (let i = 0; i < mono.length; ++i) {
    const base = (mono[i] === 0xff && white_as_transparent) ? 0 : 0xff000000;
    // little endian
    rgba[i] = base | (mono[i] << 16) | (mono[i] << 8) | mono[i];
  }
  return rgba;
}

export function ditherSteinberg(mono: Uint8ClampedArray, w: number, h: number): Uint8ClampedArray {
  let p = 0, m, n, o;
  for (let j = 0; j < h; ++j) {
    for (let i = 0; i < w; ++i) {
      m = mono[p];
      n = mono[p] > 0x80 ? 0xff : 0x00;
      o = m - n;
      mono[p] = n;
      if (i >= 0 && i < w - 1 && j >= 0 && j < h) mono[p + 1] += o * 7 / 16;
      if (i >= 1 && i < w && j >= 0 && j < h - 1) mono[p + w - 1] += o * 3 / 16;
      if (i >= 0 && i < w && j >= 0 && j < h - 1) mono[p + w] += o * 5 / 16;
      if (i >= 0 && i < w - 1 && j >= 0 && j < h - 1) mono[p + w + 1] += o * 1 / 16;
      ++p;
    }
  }
  return mono;
}
