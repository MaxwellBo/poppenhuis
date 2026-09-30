import { describe, it, expect } from 'vitest';
import { iconBackgroundForSlug, iconSysBackgroundImage, iconSysDisplayHex } from './ps2-icon-background';

describe('iconSysDisplayHex', () => {
  it('scales 0x80 to full intensity and composites opacity over black', () => {
    // Indigo Prophecy: opacity 96, corners at Sony full intensity.
    expect(iconSysDisplayHex([0x80, 0, 0], 96)).toBe('#bf0000');
    expect(iconSysDisplayHex([0, 0x80, 0], 96)).toBe('#00bf00');
    expect(iconSysDisplayHex([0, 0, 0x80], 96)).toBe('#0000bf');
    expect(iconSysDisplayHex([0x80, 0x80, 0x80], 96)).toBe('#bfbfbf');
  });

  it('leaves a clear background black', () => {
    expect(iconSysDisplayHex([0x80, 0, 0], 0)).toBe('#000000');
  });
});

describe('iconSysBackgroundImage', () => {
  it('places each corner on the quad PS2IODB recovered for Indigo Prophecy', () => {
    const background = iconBackgroundForSlug('indigoprophecy');
    expect(background).toMatchObject({
      opacity: 96,
      tl: [0x80, 0, 0],
      tr: [0, 0x80, 0],
      bl: [0, 0, 0x80],
      br: [0x80, 0x80, 0x80],
    });
    const svg = decodeURIComponent(iconSysBackgroundImage(background!).slice('url("data:image/svg+xml,'.length, -2));
    expect(svg).toContain("stop-color='#bf0000'");
    expect(svg).toContain("stop-color='#00bf00'");
    expect(svg).toContain("stop-color='#0000bf'");
    expect(svg).toContain("stop-color='#bfbfbf'");
    // Top edge is TL → TR, bottom edge is BL → BR.
    expect(svg.indexOf("stop-color='#bf0000'")).toBeLessThan(svg.indexOf("stop-color='#00bf00'"));
    expect(svg.indexOf("stop-color='#0000bf'")).toBeLessThan(svg.indexOf("stop-color='#bfbfbf'"));
  });
});
