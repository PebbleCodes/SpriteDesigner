import { useState, useEffect } from 'react';
import './styles.css';
import { useStore } from './store';
import { Toolbar } from './components/Toolbar';
import { LayersPanel } from './components/LayersPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { PropsPanel } from './components/PropsPanel';
import { Timeline } from './components/Timeline';
import { DropZone } from './components/DropZone';

export default function App() {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);
  const setPlaying = useStore(s => s.setPlaying);
  const playing = useStore(s => s.playing);
  const setZoom = useStore(s => s.setZoom);
  const layers = useStore(s => s.project.layers);
  const updateLayer = useStore(s => s.updateLayer);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') { e.preventDefault(); undo(); }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if (e.key === ' ') { e.preventDefault(); setPlaying(!playing); }
      if (e.key === '1') setZoom(1);
      if (e.key === '2') setZoom(2);
      if (e.key === '4') setZoom(4);
      if (e.key === '8') setZoom(8);

      // Toggle selected layer visibility
      if (e.key === 'v' && selectedLayerId) {
        const l = layers.find(l => l.id === selectedLayerId);
        if (l) updateLayer(l.id, { visible: !l.visible });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, setPlaying, playing, setZoom, selectedLayerId, layers, updateLayer]);

  return (
    <DropZone>
      <div className="app-layout">
        <Toolbar />
        <LayersPanel selectedLayerId={selectedLayerId} onSelectLayer={setSelectedLayerId} />
        <CanvasPreview selectedLayerId={selectedLayerId} />
        <PropsPanel selectedLayerId={selectedLayerId} />
        <Timeline />
      </div>
    </DropZone>
  );
}
