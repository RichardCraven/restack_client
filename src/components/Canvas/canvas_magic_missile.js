import React, { useRef, useEffect } from 'react'

/**
 * CanvasMagicMissile
 *
 * Props:
 *   origin              – {x, y} tile coordinates of the caster
 *   height / width      – canvas size in px (typically 100×100)
 *   connectParticlesActive – whether to draw lines between particles
 *   targetDistance      – signed tile distance on the x axis (negative = firing leftward)
 *   targetLaneDiff      – signed tile distance on the y axis
 *   variant             – 'major' (default, purple/magenta, 5 particles)
 *                         'minor'           (green, 3 particles)
 */
const CanvasMagicMissile = ({origin, height, width, connectParticlesActive, targetDistance, targetLaneDiff, variant = 'major'}) => {

    const canvasRef = useRef(null)

    const isMinor = variant === 'minor';

    useEffect(() => {
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')

        // ── Particle color palette ──────────────────────────────────────────
        // major: purple → magenta → blue
        // minor: lime → teal → dark green
        const gradientStops = isMinor
            ? [['#afffaf', 0], ['#00e887', 0.5], ['#007a3d', 1]]
            : [['#fff',    0], ['magenta',  0.5], ['blue',    1]];

        class Particle {
            constructor(effect) {
              this.effect = effect;
              this.radius = Math.floor(Math.random() * 5 + 2);
              this.x =
                this.radius + Math.random() * (this.effect.width - this.radius * 2);
              this.y =
                this.radius + Math.random() * (this.effect.height - this.radius * 2);
              this.vx = Math.random() * 4 - 2;
              this.vy = Math.random() * 4 - 2;
            }

            draw(context) {
              context.beginPath();
              context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
              context.fill();
            }
            update() {
              this.x += this.vx;
              this.y += this.vy;
              if (this.x > this.effect.width || this.x < 0) this.vx *= -1;
              if (this.y > this.effect.height || this.y < 0) this.vy *= -1;
            }
        }
        class Effect {
            constructor(canvas) {
              this.canvas = canvas;
              this.width = this.canvas.width;
              this.height = this.canvas.height;
              this.particles = [];
              // minor missile: 3 particles; major: 5
              this.numberOfParticles = isMinor ? 3 : 5;
              this.createParticles();
            }
            createParticles() {
              for (let i = 0; i < this.numberOfParticles; i++) {
                this.particles.push(new Particle(this));
              }
            }
            handleParticles(context, connect) {
              this.particles.forEach((particle) => {
                particle.draw(context);
                particle.update();
                if(connect){
                    this.connectParticles(context);
                }
              });
            }

            connectParticles(context) {
              const maxDistance = 200;
              for (let a = 0; a < this.particles.length; a++) {
                for (let b = a; b < this.particles.length; b++) {
                  const dx = this.particles[a].x - this.particles[b].x;
                  const dy = this.particles[a].y - this.particles[b].y;
                  const distance = Math.hypot(dx, dy);
                  if (distance < maxDistance) {
                    const opacity = 1 - distance / maxDistance;
                    context.globalAlpha = opacity;
                    context.beginPath();
                    context.moveTo(this.particles[a].x, this.particles[a].y);
                    context.lineTo(this.particles[b].x, this.particles[b].y);
                    context.stroke();
                    context.restore();
                  }
                }
              }
            }
        }

        const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradientStops.forEach(([color, stop]) => gradient.addColorStop(stop, color));
        context.fillStyle = gradient;
        context.strokeStyle = gradient;

        const effect = new Effect(canvas);

        // Total CSS animation duration (ms) — must match the `missileTravel` keyframes below.
        const MISSILE_DURATION_MS = 1500;
        // Lines disconnect when the missile has travelled this fraction of the full flight.
        // 0.72 ≈ halfway between the 50% peak and the 100% impact, so the dots are already
        // spreading out by the time they arrive and the connection lines vanish just before impact.
        const LINES_CUTOFF_FRACTION = 0.72;

        const startTime = performance.now();

        let animationFrameId;
        function animate(now) {
          const elapsed = now - startTime;
          // Draw connecting lines only while the missile is still in flight (before cutoff).
          const shouldConnect = connectParticlesActive && (elapsed < MISSILE_DURATION_MS * LINES_CUTOFF_FRACTION);
          context.clearRect(0, 0, canvas.width, canvas.height);
          effect.handleParticles(context, shouldConnect);
          animationFrameId = window.requestAnimationFrame(animate);
        }
        animationFrameId = window.requestAnimationFrame(animate);

        return () => {
          window.cancelAnimationFrame(animationFrameId)
        }
    }, [connectParticlesActive, origin, height, width, targetDistance, targetLaneDiff, isMinor])

    // ── Direction-aware initial nudge ───────────────────────────────────────
    // The missile spawns at the caster's tile and does a short "warm-up" drift
    // in the direction of the target before the main flight arc kicks in.
    // targetDistance is signed: positive = target is to the right, negative = left.
    // We nudge 50px in the direction of travel so the initial motion always
    // points toward the enemy regardless of which side the caster is on.
    const dirSign = targetDistance >= 0 ? 1 : -1;
    const nudgeX = dirSign * 50;   // px — same magnitude as before, now directional
    // Small vertical nudge proportional to the lane difference (capped at ±30px)
    const nudgeY = targetLaneDiff !== 0
        ? Math.sign(targetLaneDiff) * Math.min(Math.abs(targetLaneDiff) * 10, 30)
        : 0;

    const startX  = origin.x * 100;
    const startY  = origin.y * 100;
    const mid1X   = startX + nudgeX;
    const mid1Y   = startY + nudgeY;
    const mid2X   = startX + nudgeX * 2;
    const mid2Y   = startY + nudgeY * 2;
    const finalX  = (origin.x + targetDistance) * 100;
    const finalY  = (origin.y + targetLaneDiff) * 100;

    return <canvas
        style={{ animation: 'missileTravel 1.5s linear forwards' }}
        className='spell-animation'
        height={height}
        width={width}
        ref={canvasRef}>
        <style>{`
            @keyframes missileTravel {
              0%   { transform: translateX(${startX}px) translateY(${startY}px) scale(0.1) }
              25%  { transform: translateX(${mid1X}px)  translateY(${mid1Y}px)  scale(1)   }
              50%  { transform: translateX(${mid2X}px)  translateY(${mid2Y}px)  scale(2.75)}
              100% { transform: translateX(${finalX}px) translateY(${finalY}px) scale(1.5) }
            }
        `}</style>
    </canvas>
}

export default CanvasMagicMissile
