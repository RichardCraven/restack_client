import React, { useEffect, useRef } from 'react';

/**
 * CanvasWhirlwind
 * Renders a short-lived spinning cyclone centered on a combatant tile.
 */
export default function CanvasWhirlwind({
  origin,
  width = 100,
  height = 100,
  duration = 650,
  onComplete = () => {},
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !origin) return;

    const ctx = canvas.getContext('2d');
    let raf = null;
    let startTime = null;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    const draw = (ts) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(elapsed / duration, 1);

      ctx.clearRect(0, 0, w, h);

      const alpha = 1 - progress;
      const spin = progress * Math.PI * 8;

      // Core glow
      const coreGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
      coreGradient.addColorStop(0, `rgba(255,255,255,${0.6 * alpha})`);
      coreGradient.addColorStop(0.45, `rgba(230,240,255,${0.32 * alpha})`);
      coreGradient.addColorStop(1, 'rgba(230,240,255,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, w * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGradient;
      ctx.fill();

      // Swirling streaks
      const streakCount = 14;
      for (let i = 0; i < streakCount; i++) {
        const t = i / streakCount;
        const a = spin + t * Math.PI * 2;
        // Push the spin path outward so the effect traces the portrait edge.
        const innerR = w * (0.22 + t * 0.12);
        const outerR = w * (0.34 + t * 0.12);

        const x1 = cx + Math.cos(a) * innerR;
        const y1 = cy + Math.sin(a) * innerR;
        const x2 = cx + Math.cos(a + 0.55) * outerR;
        const y2 = cy + Math.sin(a + 0.55) * outerR;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx, cy, x2, y2);
        ctx.lineWidth = 1.5 + (1 - t) * 2.5;
        ctx.strokeStyle = `rgba(245,248,255,${(0.25 + (1 - t) * 0.45) * alpha})`;
        ctx.shadowColor = 'rgba(255,255,255,0.9)';
        ctx.shadowBlur = 7;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Ring pulse
      ctx.beginPath();
      ctx.arc(cx, cy, w * (0.26 + progress * 0.22), 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(255,255,255,${0.55 * alpha})`;
      ctx.stroke();

      if (progress < 1) {
        raf = requestAnimationFrame(draw);
      }
    };

    raf = requestAnimationFrame(draw);

    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [origin, duration, onComplete]);

  const tileSize = width;
  const canvasSize = Math.round(tileSize * 1.9);
  const offset = (canvasSize - tileSize) / 2;
  const left = origin.x * tileSize - offset;
  const top = origin.y * height - offset;

  return (
    <canvas
      ref={canvasRef}
      width={canvasSize}
      height={canvasSize}
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${canvasSize}px`,
        height: `${canvasSize}px`,
        pointerEvents: 'none',
        zIndex: 35,
      }}
    />
  );
}
