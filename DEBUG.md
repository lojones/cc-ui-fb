# Client-Side Debugging Guide

This guide explains how to debug the client-side canvas card generation in Chrome DevTools.

## Setup

1. **Source Maps Enabled**: The `next.config.ts` has been configured to enable source maps in development mode
2. **Debug Mode**: Automatically enabled when `NODE_ENV === 'development'`

## Debugging Features

### 1. Chrome DevTools Source Debugging

**To set breakpoints in your TypeScript code:**

1. Open Chrome DevTools (F12)
2. Go to **Sources** tab
3. Navigate to `webpack://` → `./src/lib/client-canvas-generator.ts`
4. Click line numbers to set breakpoints
5. Click "Generate with Canvas" to trigger the debugger

### 2. Automatic Debug Logging

When in development mode, the canvas generator will:
- Log each layer as it's being generated
- Show canvas state at each step
- Make canvases available globally for inspection

**Console messages to look for:**
```
🐛 [DEBUG] Canvas generator initialized. Access via window.debugCanvases
🐛 [DEBUG] Building front card layers...
🐛 [DEBUG] Starting Layer 1: Base Background
🐛 [DEBUG] Pausing at layer: Layer 1: Base Background
```

### 3. Global Canvas Access

In the browser console, you can access:
```javascript
// Access the canvas elements
window.debugCanvases.front    // Front canvas element
window.debugCanvases.back     // Back canvas element
window.debugCanvases.frontCtx // Front canvas context
window.debugCanvases.backCtx  // Back canvas context

// Example: Save current canvas state as image
const link = document.createElement('a');
link.download = 'debug-canvas.png';
link.href = window.debugCanvases.front.toDataURL();
link.click();
```

### 4. Visual Canvas Debugging

A debug panel will appear in the top-right corner showing:
- Canvas state after each layer
- Thumbnail previews of the card as it's built
- Layer-by-layer progression

### 5. Manual Breakpoints

To add automatic breakpoints, uncomment this line in `client-canvas-generator.ts`:
```typescript
// debugger; // Uncomment this line to add automatic breakpoints
```

This will pause execution at each layer for detailed inspection.

## Advanced Debugging

### Inspect Canvas Context State

```javascript
// In browser console during breakpoint:
const ctx = window.debugCanvases.frontCtx;
console.log('Current transform:', ctx.getTransform());
console.log('Current fill style:', ctx.fillStyle);
console.log('Current stroke style:', ctx.strokeStyle);
console.log('Current font:', ctx.font);
```

### Save Intermediate States

```javascript
// Save canvas at any point during generation
function saveDebugCanvas(name) {
  const link = document.createElement('a');
  link.download = `debug-${name}-${Date.now()}.png`;
  link.href = window.debugCanvases.front.toDataURL();
  link.click();
}

// Call from console: saveDebugCanvas('after-background');
```

### Inspect Player Data

```javascript
// Access the player data being used
console.log(window.debugCanvases.playerData);
```

## Common Debugging Scenarios

### 1. **Player Photo Not Appearing**
- Set breakpoint in `renderPlayerImage` method
- Check if `this.playerData.playerPhotoDataUri` has valid data
- Inspect image loading in the `loadImage` helper

### 2. **Layout Issues**
- Set breakpoints after each layer
- Check calculated positions and dimensions
- Use visual debug panel to see layer progression

### 3. **Text Rendering Problems**
- Breakpoint in `renderPlayerInformation` or `renderTeamInformation`
- Check font settings and text measurements
- Inspect `wrapText` function for text wrapping issues

### 4. **Performance Issues**
- Use Chrome DevTools Performance tab
- Profile the `generateCard` method
- Check for memory leaks in canvas creation

## Environment Variables

You can also control debugging with environment variables:

```bash
# In .env.local
NEXT_PUBLIC_CANVAS_DEBUG=true
```

Then check in code:
```typescript
const debug = process.env.NEXT_PUBLIC_CANVAS_DEBUG === 'true';
```

## Tips

1. **Network Tab**: Monitor any image loading (player photos, team logos)
2. **Console Tab**: Watch for debug messages and errors
3. **Elements Tab**: Inspect the debug canvas panel when it appears
4. **Application Tab**: Check Local Storage for any cached data
5. **Performance Tab**: Profile canvas operations for optimization

## Troubleshooting

- **Source maps not working**: Restart the dev server after config changes
- **Breakpoints not hitting**: Ensure you're setting them in the webpack:// files, not the raw TypeScript
- **Debug panel not appearing**: Check console for errors in debug panel creation
- **Canvas access undefined**: Make sure you're in development mode and canvas generation has started