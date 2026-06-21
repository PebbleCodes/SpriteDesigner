import type { SpriteSheet, Layer, BlendMode } from '../types';

let idCounter = 0;
export function uid() { return `id_${++idCounter}_${Math.random().toString(36).slice(2)}`; }

/**
 * Auto-detect frame grid from image dimensions.
 * Tries common pixel-art frame sizes that divide evenly.
 */
export function detectFrameGrid(width: number, height: number): { cols: number; rows: number; frameWidth: number; frameHeight: number } {
  const candidates = [8, 16, 24, 32, 48, 64, 96, 128, 256];
  let bestW = width, bestH = height;
  for (const c of candidates) {
    if (width % c === 0 && c <= width) bestW = c;
    if (height % c === 0 && c <= height) bestH = c;
  }
  return {
    frameWidth: bestW,
    frameHeight: bestH,
    cols: width / bestW,
    rows: height / bestH,
  };
}

export async function fileToSpriteSheet(file: File): Promise<SpriteSheet> {
  const src = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });

  const { frameWidth, frameHeight, cols, rows } = detectFrameGrid(img.naturalWidth, img.naturalHeight);
  return {
    id: uid(),
    name: file.name,
    src,
    frameWidth,
    frameHeight,
    cols,
    rows,
    totalFrames: cols * rows,
  };
}

export function makeDefaultLayer(sheetId: string, totalFrames: number, name: string): Layer {
  return {
    id: uid(),
    name,
    spriteSheetId: sheetId,
    frameRange: { start: 0, end: totalFrames - 1 },
    frameDurations: [],
    visible: true,
    locked: false,
    opacity: 1,
    blendMode: 'source-over' as BlendMode,
    isMask: false,
    invertMask: false,
    clipToBelow: false,
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
  };
}
