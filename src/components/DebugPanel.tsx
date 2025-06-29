"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV === 'development') {
      setIsVisible(true);
      
      // Check for debug canvases periodically
      const interval = setInterval(() => {
        const debugCanvases = (window as any).debugCanvases;
        if (debugCanvases) {
          setDebugInfo({
            hasCanvases: true,
            frontCanvas: !!debugCanvases.front,
            backCanvas: !!debugCanvases.back,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, []);

  const saveCanvasAsImage = (type: 'front' | 'back') => {
    const debugCanvases = (window as any).debugCanvases;
    if (debugCanvases && debugCanvases[type]) {
      const link = document.createElement('a');
      link.download = `debug-${type}-canvas-${Date.now()}.png`;
      link.href = debugCanvases[type].toDataURL();
      link.click();
    }
  };

  const logCanvasState = () => {
    const debugCanvases = (window as any).debugCanvases;
    if (debugCanvases) {
      console.group('🐛 Debug Canvas State');
      console.log('Front Canvas:', debugCanvases.front);
      console.log('Back Canvas:', debugCanvases.back);
      console.log('Front Context:', debugCanvases.frontCtx);
      console.log('Back Context:', debugCanvases.backCtx);
      console.groupEnd();
    }
  };

  const clearDebugPanels = () => {
    const debugDiv = document.getElementById('debug-canvases');
    if (debugDiv) {
      debugDiv.remove();
    }
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 left-4 w-80 z-50 bg-yellow-50 border-yellow-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          🐛 Debug Tools
          <Badge variant="outline" className="text-xs">DEV</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {debugInfo?.hasCanvases ? (
          <div className="space-y-2">
            <p className="text-xs text-green-600">
              ✅ Canvas generator active ({debugInfo.timestamp})
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => saveCanvasAsImage('front')}
                className="text-xs"
              >
                Save Front
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => saveCanvasAsImage('back')}
                className="text-xs"
              >
                Save Back
              </Button>
            </div>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={logCanvasState}
                className="text-xs"
              >
                Log State
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={clearDebugPanels}
                className="text-xs"
              >
                Clear Panel
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            No active canvas generator detected
          </p>
        )}
        
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>• Open DevTools Sources tab</p>
          <p>• Set breakpoints in client-canvas-generator.ts</p>
          <p>• Check console for debug logs</p>
        </div>
      </CardContent>
    </Card>
  );
}