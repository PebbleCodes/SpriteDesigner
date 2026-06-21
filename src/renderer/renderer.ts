import type { Layer, SpriteSheet, AnimationSequence } from '../types';
import { getLayerFrameRange } from '../store';

const imageCache = new Map<string, HTMLImageElement>();

export async function loadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) return imageCache.get(src)!;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => { imageCache.set(src, img); resolve(img); };
    img.onerror = reject;
    img.src = src;
  });
}

export function clearImageCache() { imageCache.clear(); }

/** Get the source rect (sx,sy,sw,sh) for a given absolute frame index */
export function getFrameRect(sheet: SpriteSheet, frameIndex: number) {
  const col = frameIndex % sheet.cols;
  const row = Math.floor(frameIndex / sheet.cols);
  return {
    sx: col * sheet.frameWidth,
    sy: row * sheet.frameHeight,
    sw: sheet.frameWidth,
    sh: sheet.frameHeight,
  };
}

interface RenderOptions {
  layers: Layer[];
  sheets: Record<string, SpriteSheet>;
  animation: AnimationSequence;
  globalFrame: number;  // current playback frame (0-based within animation length)
  canvasWidth: number;
  canvasHeight: number;
  soloLayerId: string | null;
}

/**
 * Composites all layers onto the target canvas for the given global frame.
 * Masking: a layer with isMask=true is used as mask for the layer directly below it.
 */
export async function renderFrame(
  ctx: CanvasRenderingContext2D,
  opts: RenderOptions,
): Promise<void> {
  const { layers, sheets, animation, globalFrame, canvasWidth, canvasHeight, soloLayerId } = opts;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  const visibleLayers = soloLayerId
    ? layers.filter(l => l.id === soloLayerId)
    : layers.filter(l => l.visible);

  for (let i = 0; i < visibleLayers.length; i++) {
    const layer = visibleLayers[i];
    const nextLayer = visibleLayers[i + 1];

    const sheet = layer.spriteSheetId ? sheets[layer.spriteSheetId] : null;
    if (!sheet) continue;

    const img = await loadImage(sheet.src).catch(() => null);
    if (!img) continue;

    const range = getLayerFrameRange(layer, animation);
    const rangeLen = range.end - range.start + 1;
    const localFrame = globalFrame % rangeLen;
    const absoluteFrame = range.start + localFrame;
    const { sx, sy, sw, sh } = getFrameRect(sheet, absoluteFrame);

    // If this layer is a mask for the one above, skip drawing it directly
    if (layer.isMask) continue;

    // Check if the *next* layer is a mask for this one
    const maskLayer = nextLayer?.isMask ? nextLayer : null;

    if (maskLayer) {
      // Off-screen: draw this layer, then apply mask
      const offMain = new OffscreenCanvas(canvasWidth, canvasHeight);
      const offMask = new OffscreenCanvas(canvasWidth, canvasHeight);
      const ctxMain = offMain.getContext('2d')!;
      const ctxMask = offMask.getContext('2d')!;

      drawLayer(ctxMain, img, layer, sx, sy, sw, sh);

      const maskSheet = maskLayer.spriteSheetId ? sheets[maskLayer.spriteSheetId] : null;
      if (maskSheet) {
        const maskImg = await loadImage(maskSheet.src).catch(() => null);
        if (maskImg) {
          const mRange = getLayerFrameRange(maskLayer, animation);
          const mLocal = globalFrame % (mRange.end - mRange.start + 1);
          const mAbs = mRange.start + mLocal;
          const mRect = getFrameRect(maskSheet, mAbs);
          drawLayer(ctxMask, maskImg, maskLayer, mRect.sx, mRect.sy, mRect.sw, mRect.sh);
        }
      }

      // Apply mask via destination-in / destination-out
      ctxMain.globalCompositeOperation = maskLayer.invertMask ? 'destination-out' : 'destination-in';
      ctxMain.drawImage(offMask, 0, 0);
      ctxMain.globalCompositeOperation = 'source-over';

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      ctx.drawImage(offMain, 0, 0);
      ctx.restore();

      i++; // skip the mask layer
    } else {
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode as GlobalCompositeOperation;
      drawLayer(ctx, img, layer, sx, sy, sw, sh);
      ctx.restore();
    }
  }
}

function drawLayer(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  img: HTMLImageElement,
  layer: Layer,
  sx: number, sy: number, sw: number, sh: number,
) {
  const dw = sw * layer.scale;
  const dh = sh * layer.scale;
  const cx = layer.x + dw / 2;
  const cy = layer.y + dh / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((layer.rotation * Math.PI) / 180);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, sx, sy, sw, sh, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
}

/** Total number of frames in an animation (max across all active layers) */
export function getAnimationLength(layers: Layer[], animation: AnimationSequence): number {
  if (!layers.length) return 1;
  return Math.max(...layers.map(l => {
    const r = getLayerFrameRange(l, animation);
    return r.end - r.start + 1;
  }));
}
