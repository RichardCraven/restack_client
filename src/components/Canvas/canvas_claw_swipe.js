import React, { useRef, useEffect } from 'react';
import { claws } from '../../utils/images';

// CanvasClawSwipe: animates the claws.gif from attacker to target
export default function CanvasClawSwipe({
  origin, // {x, y} tile coordinates of the attacker
  target, // {x, y} tile coordinates of the target
  width = 100,
  height = 100,
  duration = 10000, // TEST: very large duration to check persistence
  onComplete = () => {}
}) {
  const imgRef = useRef();
  // Compute bounding box covering both tiles
  const minX = Math.min(origin.x, target.x);
  const minY = Math.min(origin.y, target.y);
  const maxX = Math.max(origin.x, target.x);
  const maxY = Math.max(origin.y, target.y);
  const canvasWidth = (maxX - minX + 1) * width;
  const canvasHeight = (maxY - minY + 1) * height;
  // Start/end points relative to bounding box
  const startX = (origin.x - minX) * width + width / 2;
  const startY = (origin.y - minY) * height + height / 2;
  const endX = (target.x - minX) * width + width / 2;
  const endY = (target.y - minY) * height + height / 2;
  const halfX = startX + (endX - startX) * 0.5;
  const halfY = startY + (endY - startY) * 0.5;
  const dx = halfX - startX;
  const dy = halfY - startY;

  useEffect(() => {
    let running = true;
    let startTime = null;
    function animate(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      // Always interpolate from 0 to halfway over the full duration
      const progress = Math.min(elapsed / duration, 1);
      if (imgRef.current) {
        imgRef.current.style.transform =
          `translate(${dx * progress}px, ${dy * progress}px)`;
        imgRef.current.style.opacity = 1 - 0.2 * progress;
      }
      if (progress < 1 && running) {
        requestAnimationFrame(animate);
      }
    }
    requestAnimationFrame(animate);
    // Only call onComplete after the full duration, not when the image reaches its destination
    const timeout = setTimeout(() => {
      if (imgRef.current) {
        imgRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        imgRef.current.style.opacity = 0.8;
      }
      if (onComplete) onComplete();
    }, duration);
    return () => { running = false; clearTimeout(timeout); };
    // eslint-disable-next-line
  }, [origin, target, width, height, duration]);

  // Position the container absolutely at the bounding box
  const left = minX * width;
  const top = minY * height;

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 21,
        left: `${left}px`,
        top: `${top}px`,
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        overflow: 'visible',
        background: 'transparent',
      }}
    >
      {/* Add cache buster to GIF src to force restart */}
      <img
        ref={imgRef}
        src={claws + '?cb=' + React.useMemo(() => Date.now() + '_' + Math.floor(Math.random() * 100000), [])}
        alt="claw swipe"
        style={{
          position: 'absolute',
          left: `${startX - width / 2}px`,
          top: `${startY - height / 2}px`,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: 'none',
          opacity: 1,
          filter: 'drop-shadow(0 2px 6px #000)',
          transition: 'none',
        }}
        draggable={false}
      />
    </div>
  );
}
