import React from 'react';
import * as images from '../utils/images'


export default function Tile(props) {
    if(props.image === 'void_fill'){
        console.log('void fill ', images[props.image]);
    }
    // Normalize coordinates for display only.
    // Engine uses a world-offset coordinate system (tiles often start at 15..29).
    // We expose zero-based coordinates for UI without changing game logic.
    const getDisplayCoords = (coords) => {
        if (!coords) return null;
        // support [x,y] arrays
        if (Array.isArray(coords) && coords.length >= 2) {
            const x = coords[0];
            const y = coords[1];
            const displayX = (typeof x === 'number' && x >= 15) ? x - 15 : x;
            const displayY = (typeof y === 'number' && y >= 15) ? y - 15 : y;
            return [displayX, displayY];
        }
        // support {x,y} objects
        if (typeof coords === 'object' && coords !== null && coords.x != null && coords.y != null) {
            const x = coords.x;
            const y = coords.y;
            const displayX = (typeof x === 'number' && x >= 15) ? x - 15 : x;
            const displayY = (typeof y === 'number' && y >= 15) ? y - 15 : y;
            return [displayX, displayY];
        }
        return null;
    }
    return (
        <div style={{
            pointerEvents: props.passThrough ? 'none' : 'inherit',
            boxSizing: 'border-box',
            transition: 'background-color 0.25s',
            cursor: props.cursor ? props.cursor : 'pointer',
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundImage: props.imageOverride ? "url(" + props.imageOverride + ")" : "url(" + images[props.image] + ")",
            backgroundColor: 
                props.backgroundColor ? props.backgroundColor :
                (props.hovered && props.type === 'board-tile') ? 
                '#8080807a' : 
                ( props.type === 'overlay-tile' ? 
                    'transparent': 
                    (props.isActiveInventory && props.type === 'inventory-tile' ? 'lightgreen' : props.color)),
            backgroundSize: props.image === 'avatar' ? '100% 80%' : '100% 100%',
            backgroundPosition: props.image === 'avatar' ? 'center bottom' : 'inherit',
            // background-size: 100% 80%;
    // background-position: center bottom;
            backgroundRepeat: 'no-repeat',
            fontSize: '0.7em',
            position: 'relative',
            borderLeft: (props.type === 'palette-tile' && !props.hovered) ? '2px solid transparent' : 
            (props.type === 'palette-tile' && props.hovered ? '2px solid red' : ((props.borders && props.borders.left) ? props.borders.left : '1px solid transparent')),
            borderRight: (props.borders && props.borders.right) ? props.borders.right : '1px solid transparent',
            borderTop: (props.borders && props.borders.top) ? props.borders.top : '1px solid transparent',
            borderBottom: (props.borders && props.borders.bottom) ? props.borders.bottom : '1px solid transparent'
            }}
            onMouseEnter={() => {
                if(props.type === 'crew-tile'){
                    return props.handleHover(props)
                } else if(props.handleHover && props.type === 'overlay-tile'){
                    return props.handleHover(props.id)
                }  else if(props.handleHover && props.type !== 'inventory-tile'){
                    return props.handleHover(props.id, props.type, this)
                } else if(props.handleHover && props.type === 'inventory-tile'){
                    return props.handleHover(props)
                } else{
                    return null
                }
            }}
            onMouseLeave={() => {
                if(props.type === 'crew-tile' || props.type === 'inventory-tile'){
                    return props.handleHover(null)
                } 
                // else if(props.handleHover && props.type !== 'inventory-tile'){
                //     return props.handleHover(props.id, props.type, this)
                // } else if(props.handleHover && props.type === 'inventory-tile'){
                //     return props.handleHover(props)
                // } else{
                //     return null
                // }
            }}
            onMouseDown={() => {
                if(props.handleClick){
                    return props.handleClick(props)
                } else {
                    return null
                }
            }}
            className={`tile ${props.className}`}
        >
           {props.showCoordinates && (() => {
                const displayCoords = getDisplayCoords(props.coordinates);
                if (!displayCoords) return null;
                return (
                    <div style={{color: 'yellow', userSelect: 'none'}}>
                        {displayCoords[0]},{displayCoords[1]} <span style={{color: 'red'}}>{props.index}</span>
                    </div>
                )
           })()}
        </div>
    )
}