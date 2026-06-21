import { useEffect, useRef, useCallback, useState } from 'react';
import { useStore, getActiveAnimation } from '../store';
import { renderFrame, getAnimationLength } from '../renderer/renderer';

interface Props {
  selectedLayerId: string | null;
}

export function CanvasPreview({ selectedLayerId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [dragging, setDragging] = useState<{ startX: number; startY: number; layerX: number; layerY: number } | null>(null);

  const project = useStore(s => s.project);
  const playing = useStore(s => s.playing);
  const currentFrame = useStore(s => s.currentFrame);
  const currentDirection = useStore(s => s.currentDirection);
  const zoom = useStore(s => s.zoom);
  const showCheckerboard = useStore(s => s.showCheckerboard);
  const showGrid = useStore(s => s.showGrid);
  const soloLayerId = useStore(s => s.soloLayerId);
  const setCurrentFrame = useStore(s => s.setCurrentFrame);
  const setCurrentDirection = useStore(s => s.setCurrentDirection);
  const setPlaying = useStore(s => s.setPlaying);
  const updateLayer = useStore(s => s.updateLayer);

  const animation = getActiveAnimation(useStore(s => s));
  const sheets = Object.fromEntries(project.spriteSheets.map(s => [s.id, s]));
  const totalFrames = getAnimationLength(project.layers.filter(l => l.visible), animation);

  const draw = useCallback(async (frame: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    await renderFrame(ctx, {
      layers: project.layers,
      sheets,
      animation,
      globalFrame: frame,
      canvasWidth: project.canvasWidth,
      canvasHeight: project.canvasHeight,
      soloLayerId,
    });
  }, [project, sheets, animation, soloLayerId]);

  useEffect(() => { draw(currentFrame); }, [draw, currentFrame]);

  // Playback loop
  useEffect(() => {
    if (!playing) { cancelAnimationFrame(animRef.current); return; }

    let frame = currentFrame;
    let direction = currentDirection;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - lastTime;
      const frameDuration = 1000 / animation.fps;

      if (elapsed >= frameDuration) {
        lastTime = now - (elapsed % frameDuration);
        let next = frame;
        if (direction === 'forward') {
          next++;
        } else {
          next--;
        }

        if (animation.loopMode === 'once' && next >= totalFrames) {
          direction = 'forward';
          setPlaying(false);
          return;
        }
        if (animation.loopMode === 'bounce') {
          if (frame >= totalFrames - 2) {
            direction = 'backward';
          } else if (frame <= 1) {
            direction = 'forward';
          }
        } else {
          direction = 'forward';
          if (next >= totalFrames) {
            next = 0;
          }
        }
        frame = next;
        setCurrentFrame(frame);
        setCurrentDirection(direction);
      }
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, animation.fps, animation.loopMode, totalFrames, currentDirection, setCurrentDirection, setCurrentFrame, setPlaying]);

  // Grid overlay
  useEffect(() => {
    if (!showGrid) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    const step = 16;
    for (let x = 0; x <= project.canvasWidth; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, project.canvasHeight); ctx.stroke();
    }
    for (let y = 0; y <= project.canvasHeight; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(project.canvasWidth, y); ctx.stroke();
    }
    ctx.restore();
  }, [showGrid, project.canvasWidth, project.canvasHeight, currentFrame]);

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedLayerId) return;
    const layer = project.layers.find(l => l.id === selectedLayerId);
    if (!layer || layer.locked) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setDragging({ startX: x, startY: y, layerX: layer.x, layerY: layer.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !selectedLayerId) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const dx = x - dragging.startX;
    const dy = y - dragging.startY;
    updateLayer(selectedLayerId, { x: dragging.layerX + dx, y: dragging.layerY + dy });
  };

  const handleMouseUp = () => setDragging(null);

  return (
    <div
      className={`canvas-area ${showCheckerboard ? 'checkerboard' : ''}`}
      style={{ background: !showCheckerboard ? project.backgroundColor : undefined }}
    >
      <canvas
        ref={canvasRef}
        width={project.canvasWidth}
        height={project.canvasHeight}
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'center',
          imageRendering: 'pixelated',
          cursor: selectedLayerId && !project.layers.find(l => l.id === selectedLayerId)?.locked ? 'move' : 'default',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="debug-overlay">
        Frame {currentFrame + 1}/{totalFrames} · {animation.fps}fps · {zoom}x
      </div>
    </div>
  );
}
