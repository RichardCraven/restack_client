import React from 'react';
import * as images from '../utils/images'


export default function Tile(props) {
    if(props.borderLeft){
        console.log('eyy', props.borderLeft)
    }
    return (
        <div style={{
            boxSizing: 'border-box',
            transition: 'background-color 0.25s',
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
            (props.type === 'palette-tile' && props.hovered ? '2px solid red' : ((props.borders && props.borders.left) ? props.borders.left : 'none')),
            borderRight: (props.borders && props.borders.right) ? props.borders.right : 'none',
            borderTop: (props.borders && props.borders.top) ? props.borders.top : 'none',
            borderBottom: (props.borders && props.borders.bottom) ? props.borders.bottom : 'none'
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