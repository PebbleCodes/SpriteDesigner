# SpriteViewer

Web-based sprite animator and composition tool with multi-layer support, advanced blending, masking, and export capabilities.

## Features

### Layer Management
- **Drag-and-drop layers** to reorder (bottom → top rendering order)
- **Per-layer controls**: visibility, opacity (0-100%), lock state
- **Position layers** by dragging them directly on the canvas
- **Transform tools**: X/Y position, rotation, integer-scale for pixel art
- **Solo mode**: isolate a single layer for debugging

### Blending & Masking
- **12 blend modes**: Normal, Multiply, Screen, Overlay, Darken, Lighten, Color Dodge, Color Burn, Hard Light, Soft Light, Difference, Exclusion
- **Layer masking**: any layer can mask the one below it
- **Invert mask** option for creative effects

### Animation
- **Adjustable FPS** (1-120) with real-time preview
- **Loop modes**: loop, once, ping-pong
- **Frame range selection**: choose which frames from a sprite sheet play per layer
- **Frame selector grid**: click frames to quickly set animation range
- **Play/pause/step controls** with timeline scrubber

### Import & Export
- **Drag-and-drop** images (PNG, GIF, JPG, WebP, SVG) or project JSON files
- **Auto-detect frame grid** from sprite sheets (manual override available)
- **Export formats**:
  - JSON project file (includes all layer/mask/blend data)
  - Flattened sprite sheet PNG
  - Animated GIF
  - Phaser-ready JSON atlas

### Workflow
- **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- **Keyboard shortcuts**:
  - `Space` — Play/pause
  - `1`, `2`, `4`, `8` — Zoom levels
  - `V` — Toggle selected layer visibility
- **Autosave** to localStorage (survives page refresh)
- **Pixel-perfect rendering** with checkerboard background and grid overlay

## Getting Started

```bash
npm install
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Production build
npm test         # Run unit tests
```

## Usage

1. **Import sprites**: Drag PNG files onto the app or click "📁 Open"
2. **Adjust frame detection**: Fine-tune frame width/height and cols/rows in Properties panel
3. **Position layers**: Select a layer and drag it on the canvas to reposition
4. **Select animation frames**: Use the frame selector grid to choose which frames animate
5. **Set blend modes**: Experiment with different blending for effects (shadows, glows, etc.)
6. **Add masks**: Check "Act as mask for layer below" to create cutouts or highlights
7. **Preview**: Hit `Space` to play, adjust FPS, toggle loop modes
8. **Export**: Choose JSON (save project), Sheet (PNG), GIF, or Phaser format

## Technical Details

- **Rendering**: HTML5 Canvas with `globalCompositeOperation` for blend modes
- **Masking**: Off-screen canvas composition with `destination-in`/`destination-out`
- **State**: Zustand with undo/redo stack (50 history entries)
- **UI**: React + dnd-kit for drag-and-drop
- **Tests**: Vitest + Testing Library
- **Export**: gif.js for GIF encoding (WebWorker-based)

## Browser Compatibility

Modern browsers with Canvas 2D support. Tested on Firefox.

