import React from 'react';
import * as images from '../../utils/images';
import Overlay from '../Overlay'

const MAX_DEPTH = 7;
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left
const MAX_ROWS = 5;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = false;
const SHOW_COMBAT_BORDER_COLORS = true;
const SHOW_INTERACTION_PANE=true


export default function FightersCombatGrid(props) {
    // Delay removal of fighter portrait after death for death animation
    const [showDeathAnimation, setShowDeathAnimation] = React.useState({});
    const [fullyDead, setFullyDead] = React.useState({});

    React.useEffect(() => {
        props.crew.forEach(fighter => {
            const details = props.getFighterDetails(fighter);
            if (details?.dead && !showDeathAnimation[fighter.id] && !fullyDead[fighter.id]) {
                setShowDeathAnimation(prev => ({ ...prev, [fighter.id]: true }));
            } else if (!details?.dead && (showDeathAnimation[fighter.id] || fullyDead[fighter.id])) {
                setShowDeathAnimation(prev => ({ ...prev, [fighter.id]: false }));
                setFullyDead(prev => ({ ...prev, [fighter.id]: false }));
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.crew, props.battleData]);

    // Only render fighters still present in battleData (i.e., not removed from combat),
    // and if dead, only if showDeathAnimation is true and not fullyDead
    const activeCrew = props.crew.filter(f => props.battleData[f.id] && (!props.getFighterDetails(f)?.dead || (showDeathAnimation[f.id] && !fullyDead[f.id])));
    return (
        <div className="mb-col fighter-pane">
            <div className="fighter-content">
                {activeCrew.map((fighter) => {
                    const isTeleporting = props.teleportingFighterId === fighter.id;
                    const transitionStyle = { transition: isTeleporting ? 'none' : '1s' };
                    return  <div key={fighter.id}  className={`lane-wrapper ${isTeleporting ? ' teleporting' : ''}`}
                                style={{ 
                                    top: `${props.battleData[fighter.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? props.battleData[fighter.id]?.coordinates.y * 2 : 0)}px`,
                                    height: `${TILE_SIZE}px`,
                                    ...transitionStyle
                                }}>
                                <div 
                                className={`fighter-wrapper${fighter.isLeader ? ' leader-wrapper' : ''}${isTeleporting ? ' teleporting' : ''}`}
                                >
                                    <div className={`portrait-wrapper${isTeleporting ? ' teleporting' : ''}`}
                                    style={{
                                        left: `${props.battleData[fighter.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? props.battleData[fighter.id]?.coordinates.x * 2 : 0)}px`,
                                        zIndex: 300, // Always above monsters/minions
                                        ...transitionStyle
                                    }}
                                    >
                                        <div 
                                        className={
                                            [
                                                'portrait',
                                                'fighter-portrait',
                                                isTeleporting ? 'teleporting' : '',
                                                props.selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : '',
                                                props.getFighterDetails(fighter)?.wounded ? (props.getFighterDetails(fighter)?.facing === 'right' ? 'hit-from-right-minor' : 'hit-from-left-minor') : '',
                                                props.getFighterDetails(fighter)?.woundedHeavily ? (props.getFighterDetails(fighter)?.facing === 'right' ? 'hit-from-right-severe' : 'hit-from-left-severe') : '',
                                                props.getFighterDetails(fighter)?.woundedLethal ? (props.getFighterDetails(fighter)?.facing === 'right' ? 'hit-from-right-lethal' : 'hit-from-left-lethal') : '',
                                                props.getFighterDetails(fighter)?.rocked ? 'rocked' : '',
                                                // up/down facing classes removed; add if you have a new property for this
                                                // props.getFighterDetails(fighter)?.missed ? (props.getFighterDetails(fighter)?.facing === 'right' ? 'missed' : 'missed-reversed') : '',
                                                fighter.isLeader ? 'leader-portrait' : '',
                                                props.getFighterDetails(fighter)?.dead ? 'dead fighterDeadAnimation' : '',
                                                (props.selectedFighter?.targetId === fighter.id || props.selectedMonster?.targetId === fighter.id) && !props.getFighterDetails(fighter)?.dead ? 'targetted' : '',
                                                props.getFighterDetails(fighter)?.active ? 'active' : '',
                                                props.getFighterDetails(fighter)?.facing === 'right' ? '' : 'reversed',
                                                props.getFighterDetails(fighter)?.locked ? 'locked' : '',
                                                props.getFighterDetails(fighter)?.chargingUpActive ? 'charging-up' : '',
                                            ].filter(Boolean).join(' ')
                                        }
                                        style={{
                                            backgroundImage: "url(" + fighter.portrait + ")",
                                            filter: [
                                                props.getFighterDetails(fighter)?.chargingUpActive ? "url('#ripple-effect')" : null,
                                                `saturate(${((props.getFighterDetails(fighter)?.hp / fighter.stats.hp) * 100) / 2}) sepia(${props.portraitHoveredId === fighter.id ? '2' : '0'})`
                                            ].filter(Boolean).join(' '),
                                            zIndex: 300 // Always above monsters/minions
                                        }} 
                                        onClick={() => props.fighterPortraitClicked(fighter.id)}
                                        onMouseEnter={() => props.portraitHovered(fighter.id)} 
                                        onMouseLeave={() => props.portraitHovered(null)}
                                        onDragStart = {(event) => props.onDragStart(fighter)}
                                        draggable
                                        onAnimationEnd={e => {
                                            if (
                                                props.getFighterDetails(fighter)?.dead &&
                                                e.animationName &&
                                                e.animationName.includes('meltDownDeath') &&
                                                showDeathAnimation[fighter.id]
                                            ) {
                                                setFullyDead(prev => ({ ...prev, [fighter.id]: true }));
                                                setShowDeathAnimation(prev => ({ ...prev, [fighter.id]: false }));
                                            }
                                        }}
                                        >
                                            <div className="color-glow" style={{color: props.getFighterDetails(fighter)?.color}}></div>
                                        </div>
                                        {props.animationOverlays[fighter.id] && props.getAllOverlaysById(fighter.id).map((overlay, i) => {
                                            const overlayData = {
                                                ...overlay.data,
                                                dead: props.getFighterDetails(fighter)?.dead
                                            };
                                            return <Overlay key={i} animationType={overlay.type} data={overlayData} />;
                                        })}
                                        <div className={`portrait-overlay`} >
                                            <div className="damage-indicator-container">
                                                {props.getFighterDetails(fighter)?.damageIndicators.map((e,i)=>{
                                                    return <div key={i} className="damage-indicator">
                                                        {e}
                                                    </div>
                                                })}
                                            </div>
                                            <div className={`circular-progress ${props.selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : ''}`} style={{
                                                background: `conic-gradient(${props.getManualMovementArcColor(props.getFighterDetails(fighter))} ${props.getManualMovementArc(props.getFighterDetails(fighter))}deg, black 0deg)`,
                                            }}  data-inner-circle-color="lightgrey" data-percentage="80" data-progress-color="crimson" data-bg-color="black">
                                                <div className="inner-circle"></div>
                                            </div>
                                        </div>
                                        <div className="hp-bar">
                                        {!props.getFighterDetails(fighter)?.dead && <div className="red-fill" 
                                            style={{width: `${(props.getFighterDetails(fighter)?.hp / fighter.stats.hp) * 100}%`}}
                                            ></div>}
                                        </div>
                                        <div className="energy-bar">
                                            {!props.getFighterDetails(fighter)?.dead && <div className="yellow-fill" style={{width: `calc(${props.getFighterDetails(fighter)?.energy}%)`}}></div>}
                                        </div>
                                        <div className="tempo-bar">
                                            {!props.getFighterDetails(fighter)?.dead &&  <div className="tempo-indicator" style={{left: `calc(${props.getFighterDetails(fighter)?.tempo}% - 4px)`}}></div>}

                                        </div>
                                    </div>
                                    { props.getFighterDetails(fighter) && props.getFighterDetails(fighter).pendingAttack && !props.getFighterDetails(fighter).dead && (() => {
                                        const details = props.getFighterDetails(fighter);
                                        const isMonk = fighter.type === 'monk';
                                        const isBasicPunch = isMonk && details.pendingAttack.range === 'close' && details.pendingAttack.name !== 'dragon punch';
                                        const icon = isBasicPunch ? images.fist_punch : props.battleData[fighter.id].pendingAttack.icon;

                                        return (
                                            <div className={`weapon-wrapper
                                                ${props.getFighterDetails(fighter)?.facing === 'right' ? '' : 'reversed'}
                                                ${details?.aiming ? 'aiming' : ''}
                                                ${(details?.attacking && details?.pendingAttack.range === 'close') ? (details?.facing === 'right' ? 'swinging-right' : 'swinging-left') 
                                                : (details?.attacking && details?.pendingAttack.range === 'far' ? 'shooting' : '')}
                                                // up/down pointing classes removed; add if you have a new property for this
                                                medium`}
                                                style={{
                                                left: details?.facing === 'right' ?
                                                `${details?.coordinates.x * 100 + 45 + (details?.coordinates.x * 2)}px` :
                                                `${details?.coordinates.x * 100 - 65 + (details?.coordinates.x * 2)}px`,
                                                backgroundImage: `url(${icon})`
                                            }}>
                                            </div>
                                        );
                                    })()}
                                    <div className={`action-bar-wrapper`} 
                                        style={{
                                        zIndex: 1001,
                                        height: '100%',
                                        width: !!props.getFighterDetails(fighter)?.pendingAttack ? `${props.combatManager.getRangeWidthVal(props.getFighterDetails(fighter)) * 100}px` : '0px',
                                        left: 
                                            props.getFighterDetails(fighter)?.pendingAttack ? 
                                        `${props.getActionBarLeftValForFighter(props.getFighterDetails(fighter)?.id)}px`
                                        : 0
                                    }}
                                    
                                    >
                                        <div className={`
                                        action-bar 
                                        ${(props.getFighterDetails(fighter)?.attacking) ? (props.getFighterDetails(fighter)?.facing === 'right' ? 'fighterHitsAnimation' : 'fighterHitsAnimation_RtoL') : ''}
                                        ${(props.getFighterDetails(fighter)?.healing) ? 'fighterHealsAnimation' : ''}
                                        `}></div>
                                    </div>
                                </div>
                            </div>    
                        })}
            </div>
        </div>
    )
}