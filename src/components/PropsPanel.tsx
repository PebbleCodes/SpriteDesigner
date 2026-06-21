import { useStore } from '../store';
import type { BlendMode, Layer } from '../types';

const BLEND_MODES: BlendMode[] = [
  'source-over', 'multiply', 'screen', 'overlay', 'darken', 'lighten',
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion',
];

const BLEND_LABELS: Record<BlendMode, string> = {
  'source-over': 'Normal', multiply: 'Multiply', screen: 'Screen', overlay: 'Overlay',
  darken: 'Darken', lighten: 'Lighten', 'color-dodge': 'Color Dodge', 'color-burn': 'Color Burn',
  'hard-light': 'Hard Light', 'soft-light': 'Soft Light', difference: 'Difference', exclusion: 'Exclusion',
};

const ZOOM_LEVELS = [1, 2, 4, 8];

interface Props { selectedLayerId: string | null }

export function PropsPanel({ selectedLayerId }: Props) {
  const project = useStore(s => s.project);
  const updateLayer = useStore(s => s.updateLayer);
  const setZoom = useStore(s => s.setZoom);
  const zoom = useStore(s => s.zoom);
  const showGrid = useStore(s => s.showGrid);
  const setShowGrid = useStore(s => s.setShowGrid);
  const showCheckerboard = useStore(s => s.showCheckerboard);
  const setShowCheckerboard = useStore(s => s.setShowCheckerboard);
  const setProject = useStore(s => s.setProject);

  const layer = project.layers.find(l => l.id === selectedLayerId);
  const sheet = layer?.spriteSheetId ? project.spriteSheets.find(s => s.id === layer.spriteSheetId) : null;

  function upd(patch: Partial<Layer>) {
    if (!layer) return;
    updateLayer(layer.id, patch);
  }

  return (
    <div className="props-panel">
      {/* Canvas Settings */}
      <div>
        <div className="section-title">Canvas</div>
        <div className="prop-row">
          <label>W</label>
          <input type="number" value={project.canvasWidth} min={1} style={{ width: 60 }}
            onChange={e => setProject({ ...project, canvasWidth: +e.target.value })} />
          <label>H</label>
          <input type="number" value={project.canvasHeight} min={1} style={{ width: 60 }}
            onChange={e => setProject({ ...project, canvasHeight: +e.target.value })} />
        </div>
        <div className="prop-row" style={{ marginTop: 6 }}>
          <label>BG</label>
          <input type="color" value={project.backgroundColor === 'transparent' ? '#000000' : project.backgroundColor}
            onChange={e => setProject({ ...project, backgroundColor: e.target.value })} />
        </div>
        <div className="prop-row" style={{ marginTop: 6 }}>
          <label><input type="checkbox" checked={showCheckerboard} onChange={e => setShowCheckerboard(e.target.checked)} />Checkerboard</label>
          <label><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />Grid</label>
        </div>
        <div className="prop-row" style={{ marginTop: 6 }}>
          <label>Zoom</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {ZOOM_LEVELS.map(z => (
              <button key={z} className={zoom === z ? 'active' : ''} onClick={() => setZoom(z)}>{z}x</button>
            ))}
          </div>
        </div>
      </div>

      {/* Layer Properties */}
      {layer && (
        <div>
          <div className="section-title">Layer: {layer.name}</div>

          <div className="prop-row">
            <label>Name</label>
            <input type="text" value={layer.name} style={{ flex: 1 }}
              onChange={e => upd({ name: e.target.value })} />
          </div>

          <div className="prop-row" style={{ marginTop: 6 }}>
            <label>Opacity</label>
            <input type="range" min={0} max={1} step={0.01} value={layer.opacity}
              onChange={e => upd({ opacity: +e.target.value })} />
            <span style={{ minWidth: 30 }}>{Math.round(layer.opacity * 100)}%</span>
          </div>

          <div className="prop-row" style={{ marginTop: 6 }}>
            <label>Blend</label>
            <select value={layer.blendMode} onChange={e => upd({ blendMode: e.target.value as BlendMode })}>
              {BLEND_MODES.map(m => <option key={m} value={m}>{BLEND_LABELS[m]}</option>)}
            </select>
          </div>

          <div className="prop-row" style={{ marginTop: 6 }}>
            <label>X</label>
            <input type="number" value={layer.x} style={{ width: 60 }} onChange={e => upd({ x: +e.target.value })} />
            <label>Y</label>
            <input type="number" value={layer.y} style={{ width: 60 }} onChange={e => upd({ y: +e.target.value })} />
          </div>

          <div className="prop-row" style={{ marginTop: 6 }}>
            <label>Rot°</label>
            <input type="number" value={layer.rotation} style={{ width: 60 }} onChange={e => upd({ rotation: +e.target.value })} />
            <label>Scale</label>
            <input type="number" value={layer.scale} min={1} step={1} style={{ width: 60 }}
              onChange={e => upd({ scale: Math.max(1, Math.round(+e.target.value)) })} />
          </div>

          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label><input type="checkbox" checked={layer.isMask} onChange={e => upd({ isMask: e.target.checked })} />Act as mask for layer below</label>
            {layer.isMask && (
              <label><input type="checkbox" checked={layer.invertMask} onChange={e => upd({ invertMask: e.target.checked })} />Invert mask</label>
            )}
            <label><input type="checkbox" checked={layer.locked} onChange={e => upd({ locked: e.target.checked })} />Locked</label>
          </div>
          {/* Sheet Properties */}
          {sheet && (
            <div style={{ marginTop: 8 }}>
              <div className="section-title">Sprite Sheet</div>
              <div className="prop-row">
                <label>Frame W</label>
                <input type="number" value={sheet.frameWidth} min={1} style={{ width: 60 }}
                  onChange={e => {
                    const updated = { ...sheet, frameWidth: +e.target.value, cols: Math.floor(sheet.frameWidth / +e.target.value * sheet.cols) };
                    setProject({ ...project, spriteSheets: project.spriteSheets.map(s => s.id === sheet.id ? updated : s) });
                  }} />
                <label>H</label>
                <input type="number" value={sheet.frameHeight} min={1} style={{ width: 60 }}
                  onChange={e => {
                    const updated = { ...sheet, frameHeight: +e.target.value };
                    setProject({ ...project, spriteSheets: project.spriteSheets.map(s => s.id === sheet.id ? updated : s) });
                  }} />
              </div>
              <div style={{ marginTop: 4, color: 'var(--text-dim)', fontSize: 11 }}>
                {sheet.cols}×{sheet.rows} = {sheet.totalFrames} frames
              </div>
              <div className="prop-row" style={{ marginTop: 6 }}>
                <label>Frame start</label>
                <input type="number" value={layer.frameRange.start + 1} min={1} max={sheet.totalFrames} style={{ width: 60 }}
                  onChange={e => upd({ frameRange: { ...layer.frameRange, start: +e.target.value - 1 } })} />
                <label>end</label>
                <input type="number" value={layer.frameRange.end + 1} min={1} max={sheet.totalFrames} style={{ width: 60 }}
                  onChange={e => upd({ frameRange: { ...layer.frameRange, end: +e.target.value - 1 } })} />
              </div>

              {/* Frame Selector Grid */}
              <div style={{ marginTop: 8 }}>
                <div className="section-title">Frame Selector</div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(sheet.cols, 8)}, 1fr)`, gap: 2, marginTop: 4 }}>
                  {Array.from({ length: sheet.totalFrames }, (_, i) => {
                    const isInRange = i >= layer.frameRange.start && i <= layer.frameRange.end;
                    return (
                      <button
                        key={i}
                        style={{
                          padding: 4,
                          fontSize: 9,
                          background: isInRange ? 'var(--accent)' : 'var(--bg)',
                          color: isInRange ? '#fff' : 'var(--text-dim)',
                          border: '1px solid var(--border)',
                        }}
                        onClick={() => {
                          if (i < layer.frameRange.start) upd({ frameRange: { start: i, end: layer.frameRange.end } });
                          else if (i > layer.frameRange.end) upd({ frameRange: { start: layer.frameRange.start, end: i } });
                          else upd({ frameRange: { start: i, end: i } });
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
