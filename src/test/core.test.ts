import { describe, it, expect } from 'vitest';
import { detectFrameGrid } from '../renderer/spriteLoader';
import { getFrameRect } from '../renderer/renderer';
import { getAnimationLength } from '../renderer/renderer';
import type { Layer, SpriteSheet, AnimationSequence } from '../types';

describe('detectFrameGrid', () => {
  it('detects single frame from 64x64 image (largest clean divisor = image itself)', () => {
    const result = detectFrameGrid(64, 64);
    // Heuristic: largest candidate ≤ size that divides evenly → 64
    expect(result.frameWidth).toBe(64);
    expect(result.frameHeight).toBe(64);
    expect(result.cols).toBe(1);
    expect(result.rows).toBe(1);
  });

  it('returns square frame when width equals a candidate exactly', () => {
    // 256x64: largest divisor of 256 from candidates is 256, of 64 is 64 → single wide frame
    const result = detectFrameGrid(256, 64);
    expect(result.frameWidth).toBe(256);
    expect(result.frameHeight).toBe(64);
    expect(result.cols).toBe(1);
    expect(result.rows).toBe(1);
  });

  it('leaves single-frame images intact', () => {
    const result = detectFrameGrid(37, 50); // odd sizes — no clean divisor
    expect(result.frameWidth).toBe(37);
    expect(result.frameHeight).toBe(50);
    expect(result.cols).toBe(1);
    expect(result.rows).toBe(1);
  });

  it('detects strip (single row)', () => {
    const result = detectFrameGrid(128, 32);
    expect(result.frameHeight).toBe(32);
    expect(result.rows).toBe(1);
  });
});

describe('getFrameRect', () => {
  const sheet: SpriteSheet = {
    id: 's1', name: 'test', src: '',
    frameWidth: 16, frameHeight: 16,
    cols: 4, rows: 2, totalFrames: 8,
  };

  it('first frame is at 0,0', () => {
    expect(getFrameRect(sheet, 0)).toEqual({ sx: 0, sy: 0, sw: 16, sh: 16 });
  });

  it('second row starts at correct y', () => {
    expect(getFrameRect(sheet, 4)).toEqual({ sx: 0, sy: 16, sw: 16, sh: 16 });
  });

  it('frame 5 is at col 1, row 1', () => {
    expect(getFrameRect(sheet, 5)).toEqual({ sx: 16, sy: 16, sw: 16, sh: 16 });
  });
});

describe('getAnimationLength', () => {
  const anim: AnimationSequence = {
    id: 'a1', name: 'test', fps: 12,
    loopMode: 'loop', layerRanges: {},
  };

  const makeLayer = (start: number, end: number): Layer => ({
    id: `l_${start}`, name: '', spriteSheetId: 's1',
    frameRange: { start, end }, frameDurations: [],
    visible: true, locked: false, opacity: 1,
    blendMode: 'source-over', isMask: false, invertMask: false,
    clipToBelow: false, x: 0, y: 0, rotation: 0, scale: 1,
  });

  it('returns max range across layers', () => {
    expect(getAnimationLength([makeLayer(0, 3), makeLayer(0, 7)], anim)).toBe(8);
  });

  it('uses animation layerRange overrides', () => {
    const animWithOverride: AnimationSequence = {
      ...anim,
      layerRanges: { l_0: { start: 0, end: 11 } },
    };
    expect(getAnimationLength([makeLayer(0, 3)], animWithOverride)).toBe(12);
  });

  it('defaults to 1 for empty layers', () => {
    expect(getAnimationLength([], anim)).toBe(1);
  });
});
