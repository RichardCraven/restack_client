import React, { useRef, useEffect } from 'react'

// var connect = true
// setTimeout(()=>{
//     connect = false
// }, 1000)

const CanvasMagicMissile = ({origin, height, width, connectParticlesActive, targetDistance, targetLaneDiff}) => {

    // const { connectParticlesActive } = props
    // console.log('connectParticlesActive === ', connectParticlesActive)
    // console.log('height: ', height);
    const canvasRef = useRef(null)

    

    // const draw = (context, canvas) => {
    //     const gradient = context.createLinearGradient(
    //         0,
    //         0,
    //         canvas.width,
    //         canvas.height
    //       );
    //     gradient.addColorStop(0, "#fff");
    //     gradient.addColorStop(0.5, "magenta");
    //     gradient.addColorStop(1, "blue");
    //     context.fillStyle = gradient;
    //     context.strokeStyle = gradient;


    //     context.clearRect(0, 0, canvas.width, canvas.height);
    //     // window.requestAnimationFrame(animate);
    //     effect.handleParticles(context);
    // }

    

    useEffect(() => {
        console.log('connectParticlesActive ', connectParticlesActive)
        console.log('*****************origin: ', origin, `translateX(${origin.x * 100}px) translateY(${origin.y * 100}px)`);
        console.log(`transform: translateX(${origin.x * 100 + 50}px) translateY(${origin.y * 100}px scale(1)`);
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')


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
              this.numberOfParticles = 5;
              this.createParticles();
            }
            createParticles() {
              for (let i = 0; i < this.numberOfParticles; i++) {
                this.particles.push(new Particle(this));
              }
            }
            handleParticles(context, connect) {
                // console.log('!!! uhh connectParticlesActive', connect);
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
        // const effect = new Effect(canvas);












        let frameCount = 0
        let animationFrameId
        
        //Our draw came here
        // const render = () => {
        // frameCount++
        // // if(props.data){
        // //     draw(context, frameCount, props.data)
        // // } else {
        // draw(context, frameCount)
        // // }
        // animationFrameId = window.requestAnimationFrame(render)
        // }
        // render()


        const gradient = context.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height
          );
        gradient.addColorStop(0, "#fff");
        gradient.addColorStop(0.5, "magenta");
        gradient.addColorStop(1, "blue");
        context.fillStyle = gradient;
        context.strokeStyle = gradient;


        // window.requestAnimationFrame(animate);
        // effect.handleParticles(context);



        const effect = new Effect(canvas);
        
        function animate() {
            context.clearRect(0, 0, canvas.width, canvas.height);
            window.requestAnimationFrame(animate);
            effect.handleParticles(context, connectParticlesActive);
        }
        animate();
        
        return () => {
            window.cancelAnimationFrame(animationFrameId)
        }
    }, [connectParticlesActive])
  
    return <canvas 
    style={{
      animation: 'moveRight 1.5s linear forwards',
    }} 
    // transform: `translateX(${origin.x * 100}px) translateY(${origin.y * 100}px)`
    className='spell-animation' 
    height={height} 
    width={width} 
    ref={canvasRef}>
        <style>{`
            @keyframes moveRight {
              0% { transform: translateX(${origin.x * 100}px) translateY(${origin.y * 100}px) scale(0.1) }
              25% { transform: translateX(${origin.x * 100 + 50}px) translateY(${origin.y * 100}px) scale(1) }
              50% { transform: translateX(${origin.x * 100 + 100}px) translateY(${origin.y * 100}px) scale(2.75)}
              100% { transform: translateX(${(origin.x + targetDistance) * 100}px) translateY(${(origin.y + targetLaneDiff) * 100}px) scale(1.5)}
              }
              `}</style>
        {/* 100% { transform: translateX(${targetDistance * 100}px) translateY(${targetLaneDiff * 100}px)   scale(1.5)} */}

              {/* 0% { transform: translateX(0%) scale(0.1) }
              25% { transform: translateX(50%) scale(1) }
              50% { transform: translateX(100%) scale(2.75) }
              100% { transform: translateX(${targetDistance * 100}%) translateY(${targetLaneDiff * 100}%)   scale(1.5)} */}

    </canvas>
    // 0% { transform: translateX(0%) scale(0.1) }
    // 10% { transform: translateX(100%) scale(0.5) }
    // 20% { transform: translateX(150%) scale(1) }
    // 30% { transform: translateX(180%) scale(1) }
    // 40% { transform: translateX(200%) scale(1.3) }
    // 50% { transform: translateX(250%) scale(1.5) }
    // 60% { transform: translateX(300%) scale(1.7) }
    // 70% { transform: translateX(400%) scale(1.8) }
    // 80% { transform: translateX(450%) scale(1.9) }
    // 100% { transform: translateX(500%) scale(2)}
}

export default CanvasMagicMissile

// import React from 'react'
// import useCanvas from './useCanvas'

// const Canvas = props => {  
  
//   const { draw, ...rest } = props
//   const canvasRef = useCanvas(draw)
  
//   return <canvas height={props.size} width={props.size} ref={canvasRef} {...rest}/>
// }

// export default Canvas