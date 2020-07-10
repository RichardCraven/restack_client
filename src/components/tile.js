import React, {useState, useEffect} from 'react';
import monsterImage from '../assets/icons/monster.png'
import * as images from '../utils/images'

export default function Tile(props) {
    return (
        <div style={{
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundImage: "url(" + images[props.image] + ")",
            backgroundColor: props.color,
            backgroundSize: '100% 100%',
            position: 'relative'
        }}>
            {props.coordinates[0]},{props.coordinates[1]} <span>{props.index}</span>
        </div>
    )
}