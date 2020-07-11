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
            fontSize: '0.7em',
            position: 'relative',
            borderLeft: (props.type === 'palette-tile' && !props.hovered) ? '2px solid transparent' : 
            (props.type === 'palette-tile' && props.hovered ? '2px solid red' : 'none')
            }}
            onMouseEnter={() => {return props.handleHover(props.id, props.type)}}
            onMouseDown={() => {return props.handleClick(props)}}
        >
           {props.showCoordinates && 
                <div>
                    {props.coordinates[0]},{props.coordinates[1]} <span>{props.index}</span>
               </div>
            }
        </div>
    )
}