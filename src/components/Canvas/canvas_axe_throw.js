import React, { useRef, useEffect } from 'react';
import axeImg from '../../assets/icons/items/weapons/axe.png';

/**
 * CanvasAxeThrow
 *
 * Props:
 *   origin              – {x, y} tile coordinates of the thrower
 *   target              – {x, y} tile coordinates of the target
 *   height / width      – canvas size in px (typically 100×100)
 */
const CanvasAxeThrow = ({ origin, target, height = 100, width = 100 }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        let animationFrameId;
        const duration = 700; // ms
        const startTime = performance.now();

        // Calculate pixel positions
        const startX = origin.x * width + width / 2;
        const startY = origin.y * height + height / 2;
        const endX = target.x * width + width / 2;
        const endY = target.y * height + height / 2;

        function drawAxe(x, y, angle) {
            const img = new window.Image();
            img.src = axeImg;
            img.onload = () => {
                context.save();
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.translate(x, y);
                context.rotate(angle);
                context.drawImage(img, -width / 4, -height / 4, width / 2, height / 2);
                context.restore();
            };
        }

        function animate(now) {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Linear interpolation
            const x = startX + (endX - startX) * t;
            const y = startY + (endY - startY) * t;
            // Spin the axe as it flies
            const angle = t * 4 * Math.PI;
            drawAxe(x, y, angle);
            if (t < 1) {
                animationFrameId = window.requestAnimationFrame(animate);
            }
        }
        animationFrameId = window.requestAnimationFrame(animate);
        return () => {
            window.cancelAnimationFrame(animationFrameId);
        };
    }, [origin, target, height, width]);

    return (
        <canvas
            className="axe-throw-animation"
            height={height * 5}
            width={width * 5}
            ref={canvasRef}
            style={{ position: 'absolute', pointerEvents: 'none', zIndex: 20 }}
        />
    );
};

export default CanvasAxeThrow;
