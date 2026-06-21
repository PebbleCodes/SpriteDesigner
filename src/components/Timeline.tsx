import { useStore, getActiveAnimation } from '../store';
import { getAnimationLength } from '../renderer/renderer';
import { PlayIcon, PauseIcon, StepBackIcon, StepForwardIcon, ResetIcon } from './Icons.tsx';

const LOOP_MODES = ['continuous', 'once', 'bounce'] as const;

export function Timeline() {
  const project = useStore(s => s.project);
  const playing = useStore(s => s.playing);
  const currentFrame = useStore(s => s.currentFrame);
  const setCurrentFrame = useStore(s => s.setCurrentFrame);
  const setPlaying = useStore(s => s.setPlaying);
  const updateAnimation = useStore(s => s.updateAnimation);

  const animation = getActiveAnimation(useStore(s => s));
  const visibleLayers = project.layers.filter(l => l.visible);
  const totalFrames = getAnimationLength(visibleLayers, animation);

  function step(delta: number) {
    setPlaying(false);
    setCurrentFrame((currentFrame + delta + totalFrames) % totalFrames);
  }

  return (
    <div className="timeline-panel">
      <div className="timeline-controls">
        <button onClick={() => step(-1)} title="Step back"><StepBackIcon /></button>
        <button
          className={playing ? 'active' : ''}
          onClick={() => setPlaying(!playing)}
          title={playing ? 'Pause' : 'Play'}
        >
          {playing ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button onClick={() => step(1)} title="Step forward"><StepForwardIcon /></button>
        <button onClick={() => { setPlaying(false); setCurrentFrame(0); }} title="Reset"><ResetIcon /></button>

        <div className="toolbar-sep" />

        <label>FPS
          <input
            type="range" min={1} max={120} value={animation.fps} style={{ width: 80 }}
            onChange={e => updateAnimation(animation.id, { fps: +e.target.value })}
          />
          <input type="number" value={animation.fps} min={1} max={120} style={{ width: 60 }}
                 onChange={e => updateAnimation(animation.id, { fps: +e.target.value })} />
        </label>

        <div className="toolbar-sep" />

        <label>Loop</label>
        {LOOP_MODES.map(m => (
          <button
            key={m}
            className={animation.loopMode === m ? 'active' : ''}
            onClick={() => updateAnimation(animation.id, { loopMode: m })}
          >
            {m}
          </button>
        ))}

        <div style={{ marginLeft: 'auto', color: 'var(--text-dim)', fontSize: 11 }}>
          {currentFrame + 1} / {totalFrames}
        </div>
      </div>

      <div className="timeline-track" style={{ overflowX: 'auto' }}>
        {Array.from({ length: totalFrames }, (_, i) => {
          const hasOverride = project.layers.some(l =>
            l.frameDurations.some(d => d.frameIndex === i)
          );
          return (
            <div
              key={i}
              className={`frame-cell${i === currentFrame ? ' current' : ''}${hasOverride ? ' has-override' : ''}`}
              onClick={() => { setPlaying(false); setCurrentFrame(i); }}
              title={`Frame ${i + 1}${hasOverride ? ' (custom duration)' : ''}`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
}
