import React, { useEffect } from 'react';
// import * as images from '../utils/images'
import AnimationTile from '../components/animation-tile';
import CanvasMagicMissile from '../components/Canvas/canvas_magic_missile'

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
    return (
        <div className="animation-grid" style={{width: tileProps.TILE_SIZE * tileProps.MAX_DEPTH + (tileProps.SHOW_TILE_BORDERS ? tileProps.MAX_DEPTH * 2 : 0) + 'px'}}>
            {animationData.tiles.map((t,i)=>{
                return <AnimationTile
                    key={i}
                    id={i}
                    x={t.x}
                    y={t.y}
                    animationOn = {t.animationOn}
                    animationType = {t.animationType}
                    transitionType = {t.transitionType}
                    handleClick={handleClickWrapper}
                    tileSize={tileProps.TILE_SIZE}

                >  </AnimationTile>
            })}
            <div className="canvas-grid-container">
                <div className="canvas-grid">
                    {animationData.canvasAnimations?.length > 0 && <CanvasMagicMissile 
                    origin={animationData?.canvasAnimations[0].origin}
                    width={100}
                    height={100}
                    connectParticlesActive={true}
                    targetDistance={animationData?.canvasAnimations[0].distanceToTarget}
                    targetLaneDiff={animationData?.canvasAnimations[0].verticalDistanceToTarget}
                    />}
                </div>
            </div>
        </div>
    )
    // }
}

export default AnimationGrid;