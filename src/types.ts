export type BlendMode =
  | 'source-over' | 'multiply' | 'screen' | 'overlay'
  | 'darken' | 'lighten' | 'color-dodge' | 'color-burn'
  | 'hard-light' | 'soft-light' | 'difference' | 'exclusion';

export type LoopMode = 'continuous' | 'once' | 'bounce';

export interface FrameRange {
  start: number;
  end: number;
}

export interface SpriteSheet {
  id: string;
  name: string;
  src: string;        // object URL or data URL
  frameWidth: number;
  frameHeight: number;
  cols: number;
  rows: number;
  totalFrames: number;
}

export interface FrameDuration {
  frameIndex: number; // absolute frame index in layer's sequence
  durationMs: number;
}

export interface Layer {
  id: string;
  name: string;
  spriteSheetId: string | null;
  frameRange: FrameRange;
  frameDurations: FrameDuration[]; // per-frame overrides
  visible: boolean;
  locked: boolean;
  opacity: number;       // 0-1
  blendMode: BlendMode;
  isMask: boolean;       // this layer masks the one below
  invertMask: boolean;
  clipToBelow: boolean;
  x: number;
  y: number;
  rotation: number;      // degrees
  scale: number;         // integer multiples only
}

export interface AnimationSequence {
  id: string;
  name: string;
  fps: number;
  loopMode: LoopMode;
  layerRanges: Record<string, FrameRange>; // layerId -> range override
}

export interface ProjectState {
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  backgroundColor: string;
  spriteSheets: SpriteSheet[];
  layers: Layer[];           // bottom to top
  animations: AnimationSequence[];
  activeAnimationId: string | null;
}
