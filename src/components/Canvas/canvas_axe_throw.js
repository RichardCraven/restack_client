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
/**
 * CanvasAxeThrow
 *
 * Props:
 *   origin              – {x, y} tile coordinates of the thrower
 *   target              – {x, y} tile coordinates of the target
 *   height / width      – canvas size in px (typically 100×100)
 *   targetDistance      – signed tile distance on the x axis (negative = leftward)
 *   onComplete          – callback when animation completes
 */
const CanvasAxeThrow = ({ origin, target, height = 100, width = 100, targetDistance = null, onComplete }) => {
    const canvasRef = useRef(null);
    const [canvasPos, setCanvasPos] = React.useState({ x: origin.x * width, y: origin.y * height });

    useEffect(() => {
        console.log('[CanvasAxeThrow] component mount', { origin, target, height, width, targetDistance });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        let animationFrameId;
        const startX = origin.x * width + width / 2;
        const startY = origin.y * height + height / 2;
        let startTime = performance.now();
        // Store initial target position for diagnostics
        let initialTargetX = target.x * width + width / 2;
        let initialTargetY = target.y * height + height / 2;
        // Animation duration: increase speed by reducing to 900ms
        // Log raw input values for origin and target
        console.log('[CanvasAxeThrow] raw input', { originX: origin.x, originY: origin.y, targetX: target.x, targetY: target.y });
        // Calculate tile distance (Euclidean and Manhattan)
        const euclideanTileDistance = Math.sqrt(
            Math.pow((target.x - origin.x), 2) + Math.pow((target.y - origin.y), 2)
        );
        const manhattanTileDistance = Math.abs(target.x - origin.x) + Math.abs(target.y - origin.y);
        const speedPerTile = 900 / euclideanTileDistance;
        const duration = 900;
        console.log('[CanvasAxeThrow] duration calculation', {
            speedPerTile: Math.round(speedPerTile),
            euclideanTileDistance,
            manhattanTileDistance,
            origin,
            target,
            duration
        });
        // Calculate dx/dy using targetDistance if provided
        let endX, endY, dx, dy, distance;
        if (targetDistance !== null) {
            endX = (origin.x + targetDistance) * width + width / 2;
            endY = target.y * height + height / 2;
            dx = endX - startX;
            dy = endY - startY;
            distance = Math.sqrt(dx * dx + dy * dy);
        } else {
            endX = target.x * width + width / 2;
            endY = target.y * height + height / 2;
            dx = endX - startX;
            dy = endY - startY;
            distance = Math.sqrt(dx * dx + dy * dy);
        }
        const speed = distance / duration;
        console.log('[CanvasAxeThrow] coords', { startX, startY, endX, endY, dx, dy, distance });
        console.log('[CanvasAxeThrow] calculated duration', { distance, speed, duration });

        const img = new window.Image();
        img.src = axeImg;
        let imgLoaded = false;
        img.onload = () => {
            imgLoaded = true;
        };

        function drawAxe(angle) {
                        // Paint a big red dot at the target center for diagnostics
                        const targetCenterX = target.x * width + width / 2;
                        const targetCenterY = target.y * height + height / 2;
                        context.beginPath();
                        context.arc(targetCenterX - canvasPos.x, targetCenterY - canvasPos.y, width / 6, 0, 2 * Math.PI);
                        context.fillStyle = 'red';
                        context.globalAlpha = 0.7;
                        context.fill();
                        context.globalAlpha = 1.0;
                        // Log and debugger for diagnostics
                        console.log('[CanvasAxeThrow] Target center (board coords):', { targetCenterX, targetCenterY, canvasPos });
                        // debugger;
            context.save();
            context.clearRect(0, 0, canvas.width, canvas.height);
            // Paint a big red dot at the target center for diagnostics
            if (canvasPos.x === target.x * width && canvasPos.y === target.y * height) {
                context.save();
                context.globalAlpha = 1.0;
                context.beginPath();
                context.arc(width / 2, height / 2, 100, 0, 2 * Math.PI);
                context.fillStyle = 'red';
                context.shadowColor = 'black';
                context.shadowBlur = 20;
                context.fill();
                context.restore();
            }
            // Draw axe
            context.translate(width / 2, height / 2);
            context.rotate(angle);
            if (img && img.complete && img.naturalWidth !== 0) {
                // Draw image to offscreen canvas, invert, then draw to main canvas
                const offCanvas = document.createElement('canvas');
                offCanvas.width = width / 2;
                offCanvas.height = height / 2;
                const offCtx = offCanvas.getContext('2d');
                offCtx.drawImage(img, 0, 0, width / 2, height / 2);
                // Invert colors
                const imageData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
                for (let i = 0; i < imageData.data.length; i += 4) {
                    imageData.data[i] = 255 - imageData.data[i];     // R
                    imageData.data[i+1] = 255 - imageData.data[i+1]; // G
                    imageData.data[i+2] = 255 - imageData.data[i+2]; // B
                }
                offCtx.putImageData(imageData, 0, 0);
                context.drawImage(offCanvas, -width / 4, -height / 4, width / 2, height / 2);
            } else {
                context.fillStyle = 'gray';
                context.beginPath();
                context.arc(0, 0, width / 4, 0, 2 * Math.PI);
                context.fill();
            }
            context.restore();
        }

        function animate(now) {
            // Target tile bounds (declare before first use)
            const targetLeft = target.x * width;
            const targetTop = target.y * height;
            const targetRight = targetLeft + width;
            const targetBottom = targetTop + height;
            // Use precomputed endX, endY, dx, dy, distance from useEffect scope
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);
            // Move canvas across the board, not just tile-local
            const x = startX + dx * t;
            const y = startY + dy * t;
            const angle = t * 4 * Math.PI;
            drawAxe(angle);
            // Diagnostic log
            console.log('[CanvasAxeThrow] animate', { t, x, y, canvasPos: { x: x - width / 2, y: y - height / 2 }, duration, elapsed, targetBounds: { targetLeft, targetTop, targetRight, targetBottom }, targetPos: { x: target.x, y: target.y } });
            setCanvasPos({ x: x - width / 2, y: y - height / 2 });
            if (t < 1) {
                animationFrameId = window.requestAnimationFrame(animate);
            } else {
                // Ensure axe lands exactly on target
                setCanvasPos({ x: endX - width / 2, y: endY - height / 2 });
                console.log('[CanvasAxeThrow] animation complete', { t, endX, endY, x, y });
                if (onComplete) onComplete();
            }
        }
        function startAnimation() {
            console.log('[CanvasAxeThrow] animation start', { duration, speedPerTile: Math.round(speedPerTile), euclideanTileDistance, manhattanTileDistance });
            if (imgLoaded) {
                animationFrameId = window.requestAnimationFrame(animate);
                // Remove animation after fixed duration
                setTimeout(() => {
                    console.log('[CanvasAxeThrow] timeout complete', { duration });
                    if (onComplete) onComplete();
                }, duration);
            } else {
                img.onload = () => {
                    imgLoaded = true;
                    animationFrameId = window.requestAnimationFrame(animate);
                    setTimeout(() => {
                        console.log('[CanvasAxeThrow] timeout complete', { duration });
                        if (onComplete) onComplete();
                    }, duration);
                };
            }
        }
        startAnimation();
        return () => {
            window.cancelAnimationFrame(animationFrameId);
            console.log('[CanvasAxeThrow] component unmount', { origin, target, height, width, targetDistance });
        };
    }, [origin, target, height, width, targetDistance]);

    return (
        <>
            <canvas
                className="axe-throw-animation"
                height={height}
                width={width}
                ref={canvasRef}
                style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    zIndex: 20,
                    border: '2px solid red',
                    background: 'rgba(255,0,0,0.15)',
                    left: `${canvasPos.x}px`,
                    top: `${canvasPos.y}px`
                }}
            />
            <canvas
                className="axe-throw-target-dot"
                height={height}
                width={width}
                style={{
                    position: 'absolute',
                    pointerEvents: 'none',
                    zIndex: 30,
                    left: (() => {
                        const board = document.querySelector('.animation-grid');
                        if (board) {
                            const rect = board.getBoundingClientRect();
                            return `${rect.left + target.x * width}px`;
                        }
                        return `${target.x * width}px`;
                    })(),
                    top: (() => {
                        const board = document.querySelector('.animation-grid');
                        if (board) {
                            const rect = board.getBoundingClientRect();
                            return `${rect.top + target.y * height}px`;
                        }
                        return `${target.y * height}px`;
                    })(),
                }}
                ref={el => {
                    if (el) {
                        const ctx = el.getContext('2d');
                        ctx.clearRect(0, 0, width, height);
                        ctx.save();
                        ctx.globalAlpha = 1.0;
                        ctx.fillStyle = 'red';
                        ctx.shadowColor = 'black';
                        ctx.shadowBlur = 20;
                        ctx.fillRect(0, 0, width, height);
                        ctx.restore();
                    }
                }}
            />
        </>
    );
}

export default CanvasAxeThrow;
