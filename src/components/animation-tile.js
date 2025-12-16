import React from 'react';
import * as images from '../utils/images'

export default function AnimationTile(props) {
    const [hitFlashing, setHitFlashing] = React.useState(false);
    React.useEffect(() => {
        if (props.animationType === 'hit-flash') {
            setHitFlashing(true);
            const timeout = setTimeout(() => setHitFlashing(false), 500);
            return () => clearTimeout(timeout);
        } else {
            setHitFlashing(false);
        }
    }, [props.animationType, props.animationData]);
    // ...existing code...
    let image, facing, keyframe, duration;
    facing = props.animationData?.facing
    duration = props.animationData?.duration
    let swordX, swordY;
    // Charging up animation state
    const [chargingUp, setChargingUp] = React.useState(false);
    React.useEffect(() => {
        if (props.animationType === 'charging-up') {
            setChargingUp(true);
            let timeout;
            if (props.animationData?.chargingUpDuration) {
                timeout = setTimeout(() => setChargingUp(false), props.animationData.chargingUpDuration);
            }
            return () => timeout && clearTimeout(timeout);
        } else {
            setChargingUp(false);
        }
    }, [props.animationType, props.animationData?.chargingUpKey]);
    // Always use coordinate lookups for tile id
    // If AnimationManager is available via props, use getTileIdByCoords
    let tileIdFromCoords = null;
    if (props.animationManager && typeof props.animationManager.getTileIdByCoords === 'function' && props.x !== undefined && props.y !== undefined) {
        tileIdFromCoords = props.animationManager.getTileIdByCoords({ x: props.x, y: props.y });
    }
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
        case 'dragon_punch':
            image = images['scepter_white']
            keyframe = 'dragon-punch'
        break;
        case 'spin_attack_arc':
            if (
                props.animationData?.arcTiles &&
                typeof props.animationData.currentFrame === 'number'
            ) {
                // Arc parameters
                const totalFrames = props.animationData.arcTiles.length;
                const frame = props.animationData.currentFrame;
                const tileSize = props.tileSize;
                const radius = tileSize * 0.9; // or tileSize * 1.1 for a slightly larger arc

                // Angles in radians: 12 o'clock (-90deg) to 9 o'clock (180deg)
                const startAngle = -Math.PI / 2;
                const endAngle = Math.PI;
                const angle = startAngle + (endAngle - startAngle) * (frame / (totalFrames - 1));

                // Center of the source tile
                const centerX = tileSize / 2;
                const centerY = tileSize / 2;
                // ...existing code...
                // Sword position relative to the source tile
                swordX = centerX + radius * Math.cos(angle) - tileSize * 0.3; // adjust offset for icon size
                swordY = centerY + radius * Math.sin(angle) - tileSize * 0.3;
                // ...existing code...
                // debugger
                if(!swordX || !swordY){
                    let a = centerX
                    let b = radius * Math.cos(angle)
                    let c = tileSize * 0.3
                    // ...existing code...
                    debugger
                }
                image = images['sword_white'];
                keyframe = null;
            }
        break;
        default:
            break;
    }
    const infiniteLoop = false
    // Determine if this tile is teleporting (for instant transition)
    const isTeleporting = props.animationType === 'teleport' || props.transitionType === 'teleport';
    return (
        <div
            style={{
                border: '1px solid transparent',
                transition: isTeleporting ? 'none' : 'background-color 0.25s',
                cursor: 'pointer',
                height: props.tileSize + 'px',
                width: props.tileSize + 'px',
                backgroundImage: image && props.animationType !== 'spin_attack_arc' && props.animationType !== 'spin_attack' ? "url(" + image + ")" : '',
                animation: keyframe && props.animationType !== 'spin_attack' ? `${keyframe} ${duration / 1000}s linear 0s ${infiniteLoop ? 'infinite' : ''} forwards` : '',
                WebkitAnimation: keyframe && props.animationType !== 'spin_attack' ? `${keyframe} ${duration / 1000}s linear 0s ${infiniteLoop ? 'infinite' : ''} forwards` : '',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                fontSize: '0.7em',
                position: 'relative',
                filter: chargingUp ? 'url(#chargingUpFilter)' : undefined,
                transform: chargingUp ? 'matrix3d(1,0,0,0.05,0,1,0,0.05,0,0,1,0,0,0,0,1) scale(1.04,0.96)' : undefined,
                willChange: chargingUp ? 'filter, transform' : undefined
            }}
            onMouseEnter={() => {/* ...existing code... */}}
            onMouseLeave={() => {/* ...existing code... */}}
            onMouseDown={() => {/* ...existing code... */}}
            className={`animation-tile 
                ${props.animationOn ? 'animated' : ''}
                ${props.animationType ? props.animationType + '-' + props.transitionType : ''}
                ${props.animationType === 'hit-flash' ? 'hit-flash' : ''}
                ${hitFlashing ? 'hit-flashing' : ''}
                ${chargingUp ? 'charging-up' : ''}
                ${isTeleporting ? 'instant-teleport' : ''}
            `}
        >
            <div className="animation-tile-id">{tileIdFromCoords !== null ? tileIdFromCoords : props.id}</div>
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
                                    pointerEvents: 'none',
                                    zIndex: 5000
                                }}
                            />
                        )}
                        {props.animationType === 'dragon_punch' && (
                            <img
                                src={images['scepter_white']}
                                alt="dragon punch"
                                className="dragon-punch-icon"
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    left: '20%',
                                    width: '60%',
                                    height: '60%',
                                    pointerEvents: 'none',
                                    zIndex: 5000
                                }}
                            />
                        )}
                        {props.animationType === 'spin_attack_arc' && image && (
    <div
        className="spin-arc-orbit"
        style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 0,
            height: 0,
            pointerEvents: 'none',
            animation: `sword-arc-orbit 0.8s linear forwards`,
            zIndex: 5000
        }}
    >
        <img
            src={image}
            alt="spin arc"
            className="spin-arc-sweep-icon"
            style={{
                position: 'absolute',
                left: '-30px', // half icon width, adjust as needed
                top: '-60px',  // full icon height, adjust as needed
                width: '60px',
                height: '60px',
                pointerEvents: 'none',
                animation: `sword-arc-spin 2s linear forwards`,
                zIndex: 5000
            }}
        />
    </div>
)}
            {/* {props.animationType === 'spin_attack_arc' && image && (
                <img
                    src={image}
                    alt="spin arc"
                    className="spin-arc-sweep-icon"
                    style={{
                        position: 'absolute',
                        left: swordX !== undefined ? `${swordX}px` : '0px',
                        top: swordY !== undefined ? `${swordY}px` : '0px',
                        width: '60%',
                        height: '60%',
                        pointerEvents: 'none',
                        border: '2px solid red', // for debugging
                        background: 'rgba(255,0,0,0.2)' // for debugging
                        // transition: `left ${props.animationData.frameDuration}ms linear, top ${props.animationData.frameDuration}ms linear`
                    }}
                />
            )} */}


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