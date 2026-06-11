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

  return <span ref={spanRef} />;
};

export default Typewriter;