import React, {useState, useEffect} from 'react';
import monsterImage from '../assets/icons/monster.png'
import * as images from '../utils/images'


export default function Tile(props) {
    return (
        <div style={{
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundImage: "url(" + images[props.image] + ")",
            backgroundColor: props.hovered ? '#8080807a' : props.color,
            backgroundSize: '100% 100%',
            fontSize: '0.7em',
            position: 'relative'
            }}
            onMouseEnter={() => {return props.handleHover(props.id)}}
            onClick={() => {return props.handleClick(props.id)}}
        >
           {props.showCoordinates && 
                <div>
                    {props.coordinates[0]},{props.coordinates[1]} <span>{props.index}</span>
               </div>
            }
        </div>
    )
}