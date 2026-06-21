import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useStore } from '../store';
import { EyeIcon, EyeOffIcon, DeleteIcon, DragIcon } from './Icons.tsx';
import type { Layer } from '../types';

interface LayerItemProps {
  layer: Layer;
  selected: boolean;
  onSelect: () => void;
}

function SortableLayerItem({ layer, selected, onSelect }: LayerItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: layer.id });
  const updateLayer = useStore(s => s.updateLayer);
  const removeLayer = useStore(s => s.removeLayer);
  const soloLayerId = useStore(s => s.soloLayerId);
  const setSoloLayer = useStore(s => s.setSoloLayer);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`layer-item${selected ? ' selected' : ''}${isDragging ? ' dragging' : ''}`}
      onClick={onSelect}
    >
      <span {...attributes} {...listeners} style={{ cursor: 'grab', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
        <DragIcon />
      </span>
      <button
        className="icon-btn"
        title="Toggle visibility"
        onClick={e => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }); }}
      >
        {layer.visible ? <EyeIcon /> : <EyeOffIcon />}
      </button>
      <span className="layer-name" title={layer.name}>{layer.name}</span>
      {layer.isMask && <span title="Mask" style={{ fontSize: 10, color: '#fa0' }}>MASK</span>}
      <button
        className="icon-btn"
        title={soloLayerId === layer.id ? 'Un-solo' : 'Solo this layer'}
        onClick={e => { e.stopPropagation(); setSoloLayer(soloLayerId === layer.id ? null : layer.id); }}
        style={{ color: soloLayerId === layer.id ? '#f90' : undefined }}
      >
        S
      </button>
      <button
        className="icon-btn danger"
        title="Delete layer"
        onClick={e => { e.stopPropagation(); removeLayer(layer.id); }}
      >
        <DeleteIcon />
      </button>
    </div>
  );
}

interface Props {
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
}

export function LayersPanel({ selectedLayerId, onSelectLayer }: Props) {
  const layers = useStore(s => s.project.layers);
  const reorderLayers = useStore(s => s.reorderLayers);
  const addLayer = useStore(s => s.addLayer);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = layers.map(l => l.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    reorderLayers(arrayMove(ids, from, to));
  }

  function addEmptyLayer() {
    const id = `layer_${Date.now()}`;
    addLayer({
      id,
      name: `Layer ${layers.length + 1}`,
      spriteSheetId: null,
      frameRange: { start: 0, end: 0 },
      frameDurations: [],
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      isMask: false,
      invertMask: false,
      clipToBelow: false,
      x: 0, y: 0, rotation: 0, scale: 1,
    });
  }

  return (
    <div className="layers-panel">
      <div className="panel-header">
        Layers
        <button onClick={addEmptyLayer} title="Add layer">+</button>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={layers.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {[...layers].reverse().map(layer => (
            <SortableLayerItem
              key={layer.id}
              layer={layer}
              selected={selectedLayerId === layer.id}
              onSelect={() => onSelectLayer(layer.id)}
            />
          ))}
        </SortableContext>
      </DndContext>
      {layers.length === 0 && (
        <div style={{ padding: 12, color: 'var(--text-dim)', fontSize: 11 }}>
          Drop images or add a layer
        </div>
      )}
    </div>
  );
}
