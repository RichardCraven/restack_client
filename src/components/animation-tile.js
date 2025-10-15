import React from 'react';
import * as images from '../utils/images'


export default function AnimationTile(props) {
    // console.log('AnimationTile props', props);
    let image, facing, keyframe, duration;
    facing = props.animationData?.facing
    duration = props.animationData?.duration

    switch(props.animationType){
        case 'claw':
            image = images['claws']
            keyframe = `ClawAnimation_${facing}`
        break;
        case 'sword_swing':
            image = images['sword_white']
            facing = props.animationData?.facing
            keyframe = `ArcAnimation_${facing}`
        break;
        case 'spin_attack':
            image = images['sword_white']
            keyframe = 'spin-attack'
        break;
        case 'spin_attack_arc':
            image = images['sword_white'];
            keyframe = 'spin-arc-sweep';
        break;
        default:
            break;

    }
    const infiniteLoop = false
    return (
        <div style={{
            border: '1px solid transparent',
            transition: 'background-color 0.25s',
            cursor: 'pointer',
            height: props.tileSize+'px',
            width: props.tileSize+'px',
            backgroundImage: image && props.animationType !== 'spin_attack' ? "url(" + image + ")" : '',
            animation: keyframe && props.animationType !== 'spin_attack' ? `${keyframe} ${duration/1000}s linear 0s ${infiniteLoop ? 'infinite' : ''} forwards` : '',
            WebkitAnimation: keyframe && props.animationType !== 'spin_attack' ? `${keyframe} ${duration/1000}s linear 0s ${infiniteLoop ? 'infinite' : ''} forwards` : '',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            fontSize: '0.7em',
            position: 'relative',
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
            className={`animation-tile 
            ${props.animationOn ? 'animated' : ''}
            ${props.animationType ? props.animationType+'-'+props.transitionType : ''}
            `}
        >   
            <div className="animation-tile-id">{props.id}</div>
            {props.animationType === 'spin_attack' && (
                <img
                    src={images['spear_white']}
                    alt="spin"
                    className="spin-attack-icon"
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '20%',
                        width: '60%',
                        height: '60%',
                        pointerEvents: 'none'
                    }}
                />
            )}
            {props.animationType === 'spin_attack_arc' && image && (
                <img
                    src={image}
                    alt="spin arc"
                    className="spin-arc-sweep-icon"
                    style={{
                        position: 'absolute',
                        top: '20%',
                        left: '20%',
                        width: '60%',
                        height: '60%',
                        pointerEvents: 'none'
                    }}
                />
            )}
            {/* <CanvasMagicMissile 
                width={100}
                height={100}
                connectParticlesActive={this.state.magicMissile_connectParticles}
                targetDistance={this.state.magicMissile_targetDistance}
                targetLaneDiff={this.state.magicMissile_targetLaneDiff}
            /> */}
        </div>
    )
}