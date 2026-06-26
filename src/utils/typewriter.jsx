import React from 'react';

const Typewriter = ({ text, delay }) => {
  const durationMs = text ? text.length * (delay || 30) : 1000;
  // Clamp the duration between 1.0s and 3.0s to keep it readable and smooth
  const duration = Math.min(3000, Math.max(1000, durationMs));

  return (
    <div style={{ position: 'relative', display: 'block', width: '100%' }}>
      <style>{`
        @keyframes smoothReveal {
          from {
            clip-path: inset(0 100% 0 0);
          }
          to {
            clip-path: inset(0 0 0 0);
          }
        }
      `}</style>
      <div 
        key={text}
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          whiteSpace: 'pre-wrap',
          clipPath: 'inset(0 100% 0 0)',
          animation: `smoothReveal ${duration}ms cubic-bezier(0.4, 0, 0.2, 1) forwards`
        }}
      >
        {text}
      </div>
    </div>
  );
};

export default Typewriter;