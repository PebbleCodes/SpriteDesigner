import { useRef, useState } from 'react';
import { useStore } from '../store';
import { fileToSpriteSheet } from '../renderer/spriteLoader';
import { exportProjectJSON, exportSpriteSheet, exportGIF, exportPhaserJSON } from '../export/exporter';
import { FolderIcon, SaveIcon, ImageIcon, MovieIcon, GamepadIcon, UndoIcon, RedoIcon } from './Icons.tsx';
import type { Layer } from '../types';

export function Toolbar() {
  const project = useStore(s => s.project);
  const addSpriteSheet = useStore(s => s.addSpriteSheet);
  const addLayer = useStore(s => s.addLayer);
  const loadProject = useStore(s => s.loadProject);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const past = useStore(s => s.past);
  const future = useStore(s => s.future);
  const setProject = useStore(s => s.setProject);

  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/') || file.name.endsWith('.gif')) {
        const sheet = await fileToSpriteSheet(file);
        addSpriteSheet(sheet);
        const layer: Layer = {
          id: `layer_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name.replace(/\.[^.]+$/, ''),
          spriteSheetId: sheet.id,
          frameRange: { start: 0, end: sheet.totalFrames - 1 },
          frameDurations: [],
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          isMask: false,
          invertMask: false,
          clipToBelow: false,
          x: 0, y: 0, rotation: 0, scale: 1,
        };
        addLayer(layer);
      } else if (file.name.endsWith('.sprite.json') || file.name.endsWith('.json')) {
        const text = await file.text();
        try { loadProject(JSON.parse(text)); } catch { alert('Invalid project file'); }
      }
    }
  }

  async function handleGIFExport() {
    setExporting(true);
    try { await exportGIF(project); } finally { setExporting(false); }
  }

  return (
    <div className="toolbar">
      <strong style={{ fontSize: 14 }}>SpriteViewer</strong>
      <div className="toolbar-sep" />

      <input
        ref={fileRef}
        type="file"
        accept="image/*,.json"
        multiple
        style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)}
      />
      <button onClick={() => fileRef.current?.click()}><FolderIcon /> Open</button>

      <input
        ref={importRef}
        type="file"
        accept=".json"
        style={{ display: 'none' }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (f) f.text().then(t => { try { loadProject(JSON.parse(t)); } catch { alert('Invalid JSON'); } });
        }}
      />

      <div className="toolbar-sep" />

      <button onClick={undo} disabled={!past.length} title="Undo (Ctrl+Z)"><UndoIcon /> Undo</button>
      <button onClick={redo} disabled={!future.length} title="Redo (Ctrl+Y)"><RedoIcon /> Redo</button>

      <div className="toolbar-sep" />

      <button onClick={() => exportProjectJSON(project)} title="Export project JSON"><SaveIcon /> JSON</button>
      <button onClick={() => exportSpriteSheet(project)} title="Export sprite sheet PNG"><ImageIcon /> Sheet</button>
      <button onClick={handleGIFExport} disabled={exporting} title="Export GIF">
        <MovieIcon /> {exporting ? 'Exporting...' : 'GIF'}
      </button>
      <button onClick={() => exportPhaserJSON(project)} title="Export Phaser atlas JSON"><GamepadIcon /> Phaser</button>

      <div className="toolbar-sep" />

      <label>Name
        <input
          type="text"
          value={project.name}
          style={{ width: 120 }}
          onChange={e => setProject({ ...project, name: e.target.value })}
        />
      </label>
    </div>
  );
}
