import backgrounds from '../ps2-icon-backgrounds.json';

/** One icon.sys corner, raw R, G, B. Sony's full intensity is 0x80. */
export type IconSysRgb = [number, number, number];

/**
 * icon.sys channels run 0x00–0x80, with 0x80 as full intensity.
 * Values past that, which some games write, saturate.
 */
export function iconSysChannel(raw: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  return Math.min(255, Math.round((raw / 0x80) * 255));
}

/**
 * Raw icon.sys background for one save, recovered from PS2IODB's iconsys.json.
 * Channels are the file's integers, not display bytes. 0x80 is full intensity.
 * Packed as [opacity, tlR, tlG, tlB, trR, trG, trB, blR, blG, blB, brR, brG, brB].
 */
export type PackedIconBackground = [
  number,
  number, number, number,
  number, number, number,
  number, number, number,
  number, number, number,
];

const BACKGROUNDS = backgrounds as Record<string, PackedIconBackground>;

export interface IconBackground {
  opacity: number;
  tl: IconSysRgb;
  tr: IconSysRgb;
  bl: IconSysRgb;
  br: IconSysRgb;
}

export function iconBackgroundForSlug(slug: string | undefined): IconBackground | undefined {
  if (!slug) return undefined;
  const packed = BACKGROUNDS[slug];
  if (!packed) return undefined;
  return {
    opacity: packed[0],
    tl: [packed[1], packed[2], packed[3]],
    tr: [packed[4], packed[5], packed[6]],
    bl: [packed[7], packed[8], packed[9]],
    br: [packed[10], packed[11], packed[12]],
  };
}

/** Premultiply a corner over black. Opacity 0 leaves the backdrop clear. */
export function iconSysDisplayHex(rgb: IconSysRgb, opacity: number): string {
  const alpha = iconSysChannel(opacity);
  const byte = (raw: number) => {
    const n = Math.round(iconSysChannel(raw) * alpha / 255);
    return n.toString(16).padStart(2, '0');
  };
  return `#${byte(rgb[0])}${byte(rgb[1])}${byte(rgb[2])}`;
}

/**
 * Bilinear blend of the four corners, matching the full-screen quad the
 * browser draws: top edge TL→TR, bottom edge BL→BR, faded top to bottom.
 * The result is an SVG data URL for the page background.
 */
export function iconSysBackgroundImage(background: IconBackground): string {
  const { opacity, tl, tr, bl, br } = background;
  const corner = (rgb: IconSysRgb) => iconSysDisplayHex(rgb, opacity);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' viewBox='0 0 2 2'>`
    + `<defs>`
    + `<linearGradient id='t' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${corner(tl)}'/><stop offset='1' stop-color='${corner(tr)}'/></linearGradient>`
    + `<linearGradient id='b' x1='0' y1='0' x2='1' y2='0'><stop offset='0' stop-color='${corner(bl)}'/><stop offset='1' stop-color='${corner(br)}'/></linearGradient>`
    + `<linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='1' stop-color='#fff'/></linearGradient>`
    + `<mask id='fade'><rect width='2' height='2' fill='url(#m)'/></mask>`
    + `</defs>`
    + `<rect width='2' height='2' fill='url(#t)'/>`
    + `<rect width='2' height='2' fill='url(#b)' mask='url(#fade)'/>`
    + `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
