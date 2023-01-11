import React, { useRef, useEffect } from 'react'

const Canvas = props => {
  
    const { draw, ...rest } = props
    const canvasRef = useRef(null)

    useEffect(() => {
        console.log('firing draw')
        const canvas = canvasRef.current
        const context = canvas.getContext('2d')
        let frameCount = 0
        let animationFrameId
        
        //Our draw came here
        const render = () => {
        frameCount++
        draw(context, frameCount, props.data)
        animationFrameId = window.requestAnimationFrame(render)
        }
        render()
        
        return () => {
        window.cancelAnimationFrame(animationFrameId)
        }
    }, [draw])
  
    return <canvas height={props.height} width={props.width} ref={canvasRef} {...props}/>
}

export default Canvas

// import React from 'react'
// import useCanvas from './useCanvas'

// const Canvas = props => {  
  
//   const { draw, ...rest } = props
//   const canvasRef = useCanvas(draw)
  
//   return <canvas height={props.size} width={props.size} ref={canvasRef} {...rest}/>
// }

// export default Canvas