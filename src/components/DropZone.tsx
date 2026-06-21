import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { fileToSpriteSheet } from '../renderer/spriteLoader';
import type { Layer } from '../types';

interface Props { children: React.ReactNode }

export function DropZone({ children }: Props) {
  const [dragging, setDragging] = useState(false);
  const addSpriteSheet = useStore(s => s.addSpriteSheet);
  const addLayer = useStore(s => s.addLayer);
  const loadProject = useStore(s => s.loadProject);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
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
      } else if (file.name.endsWith('.json')) {
        const text = await file.text();
        try { loadProject(JSON.parse(text)); } catch { /* ignore */ }
      }
    }
  }, [addSpriteSheet, addLayer, loadProject]);

  return (
    <div
      style={{ display: 'contents' }}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {dragging && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(79,142,247,0.15)',
          border: '3px dashed var(--accent)',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, color: 'var(--accent)',
        }}>
          Drop images or project JSON
        </div>
      )}
      {children}
    </div>
  );
}
