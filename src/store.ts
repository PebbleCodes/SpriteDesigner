import { create } from 'zustand';
import type { Layer, SpriteSheet, AnimationSequence, ProjectState, BlendMode, FrameRange } from './types';

const DEFAULT_ANIMATION_ID = 'default';

function defaultProject(): ProjectState {
  return {
    name: 'Untitled',
    canvasWidth: 128,
    canvasHeight: 128,
    backgroundColor: 'transparent',
    spriteSheets: [],
    layers: [],
    animations: [{
      id: DEFAULT_ANIMATION_ID,
      name: 'Default',
      fps: 12,
      loopMode: 'continuous',
      layerRanges: {},
    }],
    activeAnimationId: DEFAULT_ANIMATION_ID,
  };
}

interface UndoEntry { project: ProjectState }

interface AppState {
  project: ProjectState;
  past: UndoEntry[];
  future: UndoEntry[];
  // playback
  playing: boolean;
  currentFrame: number;
  currentDirection: 'forward' | 'backward';
  zoom: number;
  showGrid: boolean;
  showCheckerboard: boolean;
  soloLayerId: string | null;
  // actions
  setProject: (p: ProjectState) => void;
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;
  addSpriteSheet: (sheet: SpriteSheet) => void;
  removeSpriteSheet: (id: string) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  reorderLayers: (ids: string[]) => void;
  updateAnimation: (id: string, patch: Partial<AnimationSequence>) => void;
  setActiveAnimation: (id: string) => void;
  addAnimation: (anim: AnimationSequence) => void;
  setPlaying: (v: boolean) => void;
  setCurrentFrame: (f: number) => void;
  setCurrentDirection: (d: 'forward' | 'backward') => void;
  setZoom: (z: number) => void;
  setShowGrid: (v: boolean) => void;
  setShowCheckerboard: (v: boolean) => void;
  setSoloLayer: (id: string | null) => void;
  loadProject: (p: ProjectState) => void;
}

const AUTOSAVE_KEY = 'spriteviewer_autosave';

export const useStore = create<AppState>((set, get) => ({
  project: (() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      return saved ? JSON.parse(saved) : defaultProject();
    } catch { return defaultProject(); }
  })(),
  past: [],
  future: [],
  playing: false,
  currentFrame: 0,
  currentDirection: 'forward',
  zoom: 2,
  showGrid: false,
  showCheckerboard: true,
  soloLayerId: null,

  setProject: (project) => set({ project }),

  pushUndo: () => {
    const { project, past } = get();
    set({ past: [...past.slice(-49), { project }], future: [] });
  },

  undo: () => {
    const { past, project, future } = get();
    if (!past.length) return;
    const entry = past[past.length - 1];
    set({ project: entry.project, past: past.slice(0, -1), future: [{ project }, ...future] });
  },

  redo: () => {
    const { future, project, past } = get();
    if (!future.length) return;
    const entry = future[0];
    set({ project: entry.project, future: future.slice(1), past: [...past, { project }] });
  },

  addSpriteSheet: (sheet) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = { ...project, spriteSheets: [...project.spriteSheets, sheet] };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  removeSpriteSheet: (id) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = { ...project, spriteSheets: project.spriteSheets.filter(s => s.id !== id) };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  addLayer: (layer) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = { ...project, layers: [...project.layers, layer] };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  removeLayer: (id) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = { ...project, layers: project.layers.filter(l => l.id !== id) };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  updateLayer: (id, patch) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = {
      ...project,
      layers: project.layers.map(l => l.id === id ? { ...l, ...patch } : l),
    };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  reorderLayers: (ids) => {
    const { project, pushUndo } = get();
    pushUndo();
    const map = Object.fromEntries(project.layers.map(l => [l.id, l]));
    const updated = { ...project, layers: ids.map(id => map[id]).filter(Boolean) };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  updateAnimation: (id, patch) => {
    const { project, pushUndo } = get();
    pushUndo();
    const updated = {
      ...project,
      animations: project.animations.map(a => a.id === id ? { ...a, ...patch } : a),
    };
    set({ project: updated });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(updated));
  },

  setActiveAnimation: (id) => set(s => ({ project: { ...s.project, activeAnimationId: id } })),

  addAnimation: (anim) => {
    const { project, pushUndo } = get();
    pushUndo();
    set({ project: { ...project, animations: [...project.animations, anim] } });
  },

  setPlaying: (playing) => set({ playing }),
  setCurrentFrame: (currentFrame) => set({ currentFrame }),
  setCurrentDirection: (currentDirection) => set({ currentDirection }),
  setZoom: (zoom) => set({ zoom }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setShowCheckerboard: (showCheckerboard) => set({ showCheckerboard }),
  setSoloLayer: (soloLayerId) => set({ soloLayerId }),

  loadProject: (project) => {
    set({ project, past: [], future: [], currentFrame: 0, playing: false });
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(project));
  },
}));

// Derived helpers
export function getActiveAnimation(state: AppState) {
  return state.project.animations.find(a => a.id === state.project.activeAnimationId)
    ?? state.project.animations[0];
}

export function getLayerFrameRange(layer: Layer, anim: AnimationSequence): FrameRange {
  return anim.layerRanges[layer.id] ?? layer.frameRange;
}

export function getFrameDurationMs(layer: Layer, localFrame: number, defaultFps: number): number {
  const override = layer.frameDurations.find(d => d.frameIndex === localFrame);
  return override?.durationMs ?? Math.round(1000 / defaultFps);
}

export { defaultProject };
export type { BlendMode };
