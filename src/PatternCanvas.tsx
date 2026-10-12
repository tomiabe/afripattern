import { useEffect, useRef } from 'react';
import p5 from 'p5';
import { PatternOptions, renderPattern } from './pattern-engine';

type Props = { options: PatternOptions; label: string; className?: string; onCanvas?: (canvas: HTMLCanvasElement) => void };

export function PatternCanvas({ options, label, className = '', onCanvas }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sketchRef = useRef<p5 | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const sketch = new p5((p) => {
      p.setup = () => {
        const size = Math.max(1, Math.floor(host.clientWidth || 720));
        p.pixelDensity(1);
        p.createCanvas(size, size);
        p.noLoop();
        const canvas = (p as p5 & { canvas: HTMLCanvasElement }).canvas;
        canvas.setAttribute('role', 'img');
        canvas.setAttribute('aria-label', label);
        onCanvas?.(canvas);
      };
      p.draw = () => {
        const ctx = (p as p5 & { drawingContext: CanvasRenderingContext2D }).drawingContext;
        const current = optionsRef.current;
        renderPattern(ctx, p.width, p.height, current, current.animate ? p.millis() / 1000 : 0);
      };
    }, host);
    sketchRef.current = sketch;
    const observer = new ResizeObserver((entries) => {
      const width = Math.max(1, Math.floor(entries[0]?.contentRect.width || host.clientWidth));
      if (width && sketch.width !== width) sketch.resizeCanvas(width, width, true);
      sketch.redraw();
    });
    observer.observe(host);
    return () => { observer.disconnect(); sketch.remove(); sketchRef.current = null; };
  }, []);

  useEffect(() => {
    const sketch = sketchRef.current;
    if (!sketch) return;
    if (options.animate) sketch.loop();
    else { sketch.noLoop(); sketch.redraw(); }
  }, [options]);

  return <div className={`pattern-canvas ${className}`} ref={hostRef} aria-label={label} />;
}
