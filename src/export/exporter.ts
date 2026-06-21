import type { ProjectState } from '../types';
import { renderFrame, getAnimationLength } from '../renderer/renderer';

/** Export full project as JSON (all layer/mask/blend data, file refs) */
export function exportProjectJSON(project: ProjectState): void {
  const json = JSON.stringify(project, null, 2);
  download(new Blob([json], { type: 'application/json' }), `${project.name}.sprite.json`);
}

/** Export current animation as a flattened sprite sheet PNG */
export async function exportSpriteSheet(
  project: ProjectState,
  soloLayerId: string | null = null,
): Promise<void> {
  const animation = project.animations.find(a => a.id === project.activeAnimationId)
    ?? project.animations[0];
  const sheets = Object.fromEntries(project.spriteSheets.map(s => [s.id, s]));
  const totalFrames = getAnimationLength(project.layers, animation);
  const { canvasWidth, canvasHeight } = project;

  const out = document.createElement('canvas');
  out.width = canvasWidth * totalFrames;
  out.height = canvasHeight;
  const ctx = out.getContext('2d')!;

  for (let f = 0; f < totalFrames; f++) {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = canvasWidth;
    frameCanvas.height = canvasHeight;
    const fCtx = frameCanvas.getContext('2d')!;
    await renderFrame(fCtx, { layers: project.layers, sheets, animation, globalFrame: f, canvasWidth, canvasHeight, soloLayerId });
    ctx.drawImage(frameCanvas, f * canvasWidth, 0);
  }

  out.toBlob(blob => { if (blob) download(blob, `${project.name}_sheet.png`); }, 'image/png');
}

/** Export as animated GIF using gif.js */
export async function exportGIF(
  project: ProjectState,
  onProgress?: (p: number) => void,
): Promise<void> {
  // @ts-ignore – gif.js has no types bundle
  const GIF = (await import('gif.js')).default;
  const animation = project.animations.find(a => a.id === project.activeAnimationId)
    ?? project.animations[0];
  const sheets = Object.fromEntries(project.spriteSheets.map(s => [s.id, s]));
  const totalFrames = getAnimationLength(project.layers, animation);
  const { canvasWidth, canvasHeight } = project;

  const gif = new GIF({ workers: 2, quality: 10, width: canvasWidth, height: canvasHeight, workerScript: '/gif.worker.js' });

  for (let f = 0; f < totalFrames; f++) {
    const c = document.createElement('canvas');
    c.width = canvasWidth; c.height = canvasHeight;
    const ctx = c.getContext('2d')!;
    await renderFrame(ctx, { layers: project.layers, sheets, animation, globalFrame: f, canvasWidth, canvasHeight, soloLayerId: null });
    const delay = Math.round(1000 / animation.fps);
    gif.addFrame(c, { delay, copy: true });
  }

  gif.on('progress', (p: number) => onProgress?.(p));
  gif.on('finished', (blob: Blob) => download(blob, `${project.name}.gif`));
  gif.render();
}

/** Export Phaser-compatible JSON atlas */
export function exportPhaserJSON(project: ProjectState): void {
  const animation = project.animations.find(a => a.id === project.activeAnimationId)
    ?? project.animations[0];
  const totalFrames = getAnimationLength(project.layers, animation);
  const { canvasWidth, canvasHeight } = project;

  const frames: Record<string, object> = {};
  for (let f = 0; f < totalFrames; f++) {
    frames[`frame_${f}`] = {
      frame: { x: f * canvasWidth, y: 0, w: canvasWidth, h: canvasHeight },
      rotated: false, trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: canvasWidth, h: canvasHeight },
      sourceSize: { w: canvasWidth, h: canvasHeight },
    };
  }

  const atlas = {
    frames,
    meta: { image: `${project.name}_sheet.png`, size: { w: canvasWidth * totalFrames, h: canvasHeight }, scale: '1' },
  };
  download(new Blob([JSON.stringify(atlas, null, 2)], { type: 'application/json' }), `${project.name}_phaser.json`);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
