import React, { useEffect, useRef } from 'react';

interface TubesCursorProps {
  className?: string;
  interactiveColors?: boolean;
}

export default function TubesCursor({ className = '', interactiveColors = true }: TubesCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const appRef = useRef<any>(null);

  const randomColors = (count: number): string[] => {
    return new Array(count)
      .fill(0)
      .map(() => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
  };

  useEffect(() => {
    let isMounted = true;
    const initTimer = setTimeout(() => {
      const cdnUrl = 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js';
      
      // Use dynamic import evaluation to allow build-time TypeScript compilation of CDN URL
      const dynamicImport = new Function('url', 'return import(url)');
      dynamicImport(cdnUrl)
        .then((module: any) => {
          if (!isMounted) return;
          const TubesCursorFn = module.default;

          if (canvasRef.current) {
            const app = TubesCursorFn(canvasRef.current, {
              tubes: {
                colors: ['#06b6d4', '#3b82f6', '#8b5cf6'],
                lights: {
                  intensity: 180,
                  colors: ['#06b6d4', '#60a5fa', '#a855f7', '#38bdf8']
                }
              }
            });
            appRef.current = app;
          }
        })
        .catch((err: any) => {
          console.warn('TubesCursor CDN load notice:', err);
        });
    }, 120);

    return () => {
      isMounted = false;
      clearTimeout(initTimer);
      if (appRef.current && typeof appRef.current.dispose === 'function') {
        try {
          appRef.current.dispose();
        } catch {
          // Context already cleaned up
        }
      }
    };
  }, []);

  const handleClick = () => {
    if (!interactiveColors || !appRef.current) return;
    try {
      const newTubeColors = randomColors(3);
      const newLightColors = randomColors(4);
      if (appRef.current.tubes?.setColors) {
        appRef.current.tubes.setColors(newTubeColors);
      }
      if (appRef.current.tubes?.setLightsColors) {
        appRef.current.tubes.setLightsColors(newLightColors);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 pointer-events-auto z-0 overflow-hidden ${className}`}
      title="Click to randomize WebGL tube lighting"
    >
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none opacity-50" />
    </div>
  );
}
