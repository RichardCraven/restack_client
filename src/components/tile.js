import React from 'react';
import * as images from '../utils/images'


export default function Tile(props) {
    return (
        <div style={{
            cursor: 'pointer',
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundImage: "url(" + images[props.image] + ")",
            backgroundColor: (props.hovered && props.type === 'board-tile') ? '#8080807a' : props.color,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            fontSize: '0.7em',
            position: 'relative',
            borderLeft: (props.type === 'palette-tile' && !props.hovered) ? '2px solid transparent' : 
            (props.type === 'palette-tile' && props.hovered ? '2px solid red' : 'none')
            }}
            onMouseEnter={() => {
                if(props.handleHover){
                    return props.handleHover(props.id, props.type)
                } else {
                    return null
                }
            }}
            onMouseDown={() => {
                if(props.handleClick){
                    console.log('why', props)
                    return props.handleClick(props)
                } else {
                    return null
                }
            }}
        >
           {props.showCoordinates && 
                <div style={{color: 'blue', userSelect: 'none'}}>
                    {props.coordinates[0]},{props.coordinates[1]} <span style={{color: 'red'}}>{props.index}</span>
               </div>
            }
        </div>
    )
}