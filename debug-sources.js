// Debug script to check source map availability
// Paste this in Chrome DevTools Console

console.log('🔍 Checking source map availability...');

// Check if source maps are working
const scripts = Array.from(document.scripts);
const hasSourceMaps = scripts.some(script => 
  script.src && script.src.includes('/_next/static/chunks/')
);

console.log('Scripts with potential source maps:', scripts.length);
console.log('Has Next.js chunks:', hasSourceMaps);

// Check webpack sources
if (typeof window !== 'undefined' && window.performance) {
  const entries = performance.getEntriesByType('resource');
  const jsFiles = entries.filter(entry => entry.name.includes('.js'));
  console.log('JS files loaded:', jsFiles.length);
  
  jsFiles.forEach(file => {
    if (file.name.includes('client-canvas-generator')) {
      console.log('✅ Found client-canvas-generator in loaded files:', file.name);
    }
  });
}

// Check if our debug canvases are available
if (window.debugCanvases) {
  console.log('✅ Debug canvases are available');
  console.log('Available canvas objects:', Object.keys(window.debugCanvases));
} else {
  console.log('❌ Debug canvases not found - canvas generation may not have started');
}

// Instructions
console.log('\n📋 Next steps:');
console.log('1. Restart dev server: npm run dev');
console.log('2. Hard refresh: Ctrl+Shift+R');
console.log('3. Look in Sources tab under webpack:// folder');
console.log('4. If still not visible, use console.log debugging');