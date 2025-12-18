import React, { useEffect } from 'react';
// import * as images from '../utils/images'
import AnimationTile from '../components/animation-tile';
import CanvasMagicMissile from '../components/Canvas/canvas_magic_missile'
import CanvasMagicCircle from '../components/Canvas/canvas_magic_circle'
import CanvasMagicTriangle from '../components/Canvas/canvas_magic_triangle'

// class AnimationGrid extends React.Component {
    // constructor(props){
    //     super(props)
    //     console.log('animation grid props: ', props);
    //     this.state = {
    //         initialized: false
    //     }
    // }

const AnimationGrid = ({
    animationManager,
    animationData,
    tileProps
}) => {
    useEffect(() => {
        // console.log('animation data: ', animationData);
    }, [animationData])

    const handleClickWrapper = (tile) => {
        animationManager.handleTileClick(tile.id)
    }
    // Grid width: if borders, add offset; if not, use exact tile width
    const gridWidth = tileProps.SHOW_TILE_BORDERS
        ? tileProps.TILE_SIZE * tileProps.MAX_DEPTH + tileProps.MAX_DEPTH * 2
        : tileProps.TILE_SIZE * tileProps.MAX_DEPTH;
    return (
        <div className="animation-grid" style={{width: gridWidth + 'px'}}>
            {animationData.tiles.map((t,i)=>{
                return <AnimationTile
                    key={i}
                    id={i}
                    x={t.x}
                    y={t.y}
                    animationOn = {t.animationOn}
                    animationType = {t.animationType}
                    animationData = {t.animationData}
                    transitionType = {t.transitionType}
                    handleClick={handleClickWrapper}
                    tileSize={tileProps.TILE_SIZE}

                >  </AnimationTile>
            })}
            <div className="canvas-grid-container">
                <div className="canvas-grid">
                    {animationData.canvasAnimations?.map((anim, idx) => {
                        const TILE_SIZE = typeof tileProps.TILE_SIZE === 'number' && !isNaN(tileProps.TILE_SIZE) ? tileProps.TILE_SIZE : 100;
                        const MAX_DEPTH = typeof tileProps.MAX_DEPTH === 'number' && !isNaN(tileProps.MAX_DEPTH) ? tileProps.MAX_DEPTH : 5;
                        const MAX_ROWS = typeof tileProps.MAX_ROWS === 'number' && !isNaN(tileProps.MAX_ROWS) ? tileProps.MAX_ROWS : 5;
                        const width = TILE_SIZE * MAX_DEPTH;
                        const height = TILE_SIZE * MAX_ROWS;
                        if (anim.type === 'magicCircle') {
                            return <CanvasMagicCircle
                                key={idx}
                                center={anim.center}
                                radius={anim.radius}
                                numParticles={anim.numParticles}
                                color={anim.color}
                                width={width}
                                height={height}
                                origin={anim.origin}
                                targetDistance={anim.targetDistance}
                                targetLaneDiff={anim.targetLaneDiff}
                                duration={anim.duration}
                            />
                        } else if (anim.type === 'magicTriangle') {
                            return <CanvasMagicTriangle
                                key={idx}
                                center={anim.center}
                                radius={anim.radius}
                                numParticles={anim.numParticles}
                                color={anim.color}
                                width={width}
                                height={height}
                                origin={anim.origin}
                                targetDistance={anim.targetDistance}
                                targetLaneDiff={anim.targetLaneDiff}
                                duration={anim.duration}
                            />
                        } else {
                            return <CanvasMagicMissile
                                key={idx}
                                origin={anim.origin}
                                width={100}
                                height={100}
                                connectParticlesActive={true}
                                targetDistance={anim.distanceToTarget}
                                targetLaneDiff={anim.verticalDistanceToTarget}
                            />
                        }
                    })}
                </div>
            </div>
        </div>
    )
    // }
}

export default AnimationGrid;