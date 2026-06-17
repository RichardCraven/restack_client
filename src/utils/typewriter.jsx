import React, { useEffect, useRef } from 'react';

const Typewriter = ({ text, delay }) => {
  const spanRef = useRef(null);

  useEffect(() => {
    if (!spanRef.current) return;
    spanRef.current.textContent = '';
    
    let currentIndex = 0;
    let lastTime = performance.now();
    let frameId;

    const tick = (now) => {
      const elapsed = now - lastTime;
      const charsToType = Math.floor(elapsed / delay);

      if (charsToType > 0) {
        currentIndex = Math.min(text.length, currentIndex + charsToType);
        spanRef.current.textContent = text.slice(0, currentIndex);
        lastTime = now - (elapsed % delay);
      }

      if (currentIndex < text.length) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [text, delay]);

  return (
    <div style={{ position: 'relative', display: 'block', width: '100%', textAlign: 'center' }}>
      <div style={{ opacity: 0, display: 'block', textAlign: 'center', whiteSpace: 'pre-wrap' }}>{text}</div>
      <div ref={spanRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, whiteSpace: 'pre-wrap', textAlign: 'center', display: 'block' }} />
    </div>
  );
};

export default Typewriter;