import React, { useEffect } from 'react';
// import * as images from '../utils/images'
import AnimationTile from '../components/animation-tile';

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
        </div>
    )
    // }
}

export default AnimationGrid;