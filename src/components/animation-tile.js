import React from 'react';
import * as images from '../utils/images'


export default function AnimationTile(props) {
    return (
        <div style={{
            border: '1px solid transparent',
            // boxSizing: 'border-box',
            transition: 'background-color 0.25s',
            cursor: 'pointer',
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            // backgroundImage: props.imageOverride ? "url(" + props.imageOverride + ")" : "url(" + images[props.image] + ")",
            // backgroundColor: 
            //     (props.hovered && props.type === 'board-tile') ? 
            //     '#8080807a' : 
            //     ( props.type === 'overlay-tile' ? 
            //         'transparent': 
            //         (props.isActiveInventory && props.type === 'inventory-tile' ? 'lightgreen' : props.color)),
            // backgroundSize: props.image === 'avatar' ? '100% 80%' : '100% 100%',
            // backgroundPosition: props.image === 'avatar' ? 'center bottom' : 'inherit',
            // background-size: 100% 80%;
    // background-position: center bottom;
            backgroundRepeat: 'no-repeat',
            fontSize: '0.7em',
            position: 'relative',
            // borderLeft: (props.type === 'palette-tile' && !props.hovered) ? '2px solid transparent' : 
            // (props.type === 'palette-tile' && props.hovered ? '2px solid red' : ((props.borders && props.borders.left) ? props.borders.left : 'none')),
            // borderRight: (props.borders && props.borders.right) ? props.borders.right : 'none',
            // borderTop: (props.borders && props.borders.top) ? props.borders.top : 'none',
            // borderBottom: (props.borders && props.borders.bottom) ? props.borders.bottom : 'none'
            }}
            onMouseEnter={() => {
                // if(props.type === 'crew-tile'){
                //     return props.handleHover(props)
                // } else if(props.handleHover && props.type !== 'inventory-tile'){
                //     return props.handleHover(props.id, props.type, this)
                // } else if(props.handleHover && props.type === 'inventory-tile'){
                //     return props.handleHover(props)
                // } else{
                //     return null
                // }
            }}
            onMouseLeave={() => {
                // if(props.type === 'crew-tile' || props.type === 'inventory-tile'){
                //     return props.handleHover(null)
                // } 
                // else if(props.handleHover && props.type !== 'inventory-tile'){
                //     return props.handleHover(props.id, props.type, this)
                // } else if(props.handleHover && props.type === 'inventory-tile'){
                //     return props.handleHover(props)
                // } else{
                //     return null
                // }
            }}
            onMouseDown={() => {
                console.log('tile clicked', props.id, props);
                if(props.handleClick){
                    console.log('inside');
                    return props.handleClick(props)
                } else {
                    return null
                }
            }}
            // className={`animation-tile ${props.animationOn ? 'animated' : ''}`}
            className={`animation-tile 
            ${props.animationOn ? 'animated' : ''}
            ${props.animationType}
            `}
        >
           {/* <div style={{color: 'yellow', userSelect: 'none'}}>
                    {props.x},{props.y} <span style={{color: 'red'}}>{props.index}</span>
            </div> */}
        </div>
    )
}