import React from 'react';
import Overlay from '../Overlay'
// import * as images from '../utils/images'

const MAX_DEPTH = 7;
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left
const MAX_ROWS = 5;
const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;
const SHOW_COMBAT_BORDER_COLORS = true;
const SHOW_INTERACTION_PANE=true

export default function FightersCombatGrid(props) {
    // props = props;
    // console.log('fighter combat grid, props: ', props);
    // debugger
    return (
        <div className="mb-col fighter-pane">
            <div className="fighter-content">
                {props.crew.map((fighter, i) => {
                    return  <div key={i}  className='lane-wrapper' 
                                style={{ 
                                    top: `${props.battleData[fighter.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? props.battleData[fighter.id]?.coordinates.y * 2 : 0)}px`,
                                    height: `${TILE_SIZE}px`
                                }}>
                                <div 
                                className={`fighter-wrapper ${fighter.isLeader ? 'leader-wrapper' : ''}`} 
                                >
                                    <div className="portrait-wrapper"
                                    style={{
                                        left: `${props.battleData[fighter.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? props.battleData[fighter.id]?.coordinates.x * 2 : 0)}px`,
                                        zIndex: `${props.battleData[fighter.id]?.dead ? '0' : '101'}`
                                    }}
                                    >
                                        <div 
                                        className={
                                            `portrait fighter-portrait 
                                            ${props.selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : ''}
                                            ${props.getFighterDetails(fighter)?.wounded ? (props.fighterFacingRight(fighter) ? 'hit-from-right-minor' : 'hit-from-left-minor') : ''} 
                                            ${props.getFighterDetails(fighter)?.woundedHeavily ? (props.fighterFacingRight(fighter) ? 'hit-from-right-severe' : 'hit-from-left-severe') : ''} 
                                            ${props.getFighterDetails(fighter)?.woundedLethal ? (props.fighterFacingRight(fighter) ? 'hit-from-right-lethal' : 'hit-from-left-lethal') : ''}
                                            ${props.getFighterDetails(fighter)?.rocked ? 'rocked' : ''}
                                            ${props.fighterFacingUp(props.getFighterDetails(fighter)) ? 'facing-up' : (props.fighterFacingDown(props.getFighterDetails(fighter)) ? 'facing-down' : '')}

                                            ${props.getFighterDetails(fighter)?.missed ? (props.fighterFacingRight(fighter) ? 'missed' : 'missed-reversed') : ''} 
                                            ${fighter.isLeader ? 'leader-portrait' : ''} 
                                            ${props.getFighterDetails(fighter)?.dead ? 'dead fighterDeadAnimation' : ''} 
                                            ${(props.selectedMonster?.targetId === fighter.id || props.selectedFighter?.targetId === fighter.id) ? 'targetted' : ''}
                                            ${props.getFighterDetails(fighter)?.active ? 'active' : ''}
                                            ${props.fighterFacingRight(fighter) ? '' : 'reversed'}

                                            ${props.getFighterDetails(fighter)?.locked ? 'locked' : ''}

                                            `
                                        } 
                                        style={{
                                            backgroundImage: "url(" + fighter.portrait + ")", 
                                            filter: `saturate(${((props.getFighterDetails(fighter)?.hp / fighter.stats.hp) * 100) / 2}) 
                                                    sepia(${props.portraitHoveredId === fighter.id ? '2' : '0'})`,
                                        }} 
                                        onClick={() => props.fighterPortraitClicked(fighter.id)}
                                        onMouseEnter={() => props.portraitHovered(fighter.id)} 
                                        onMouseLeave={() => props.portraitHovered(null)}
                                        onDragStart = {(event) => props.onDragStart(fighter)}
                                        draggable
                                        >
                                            <div className="color-glow" style={{color: props.getFighterDetails(fighter)?.color}}></div>
                                        </div>
                                        {props.animationOverlays[fighter.id] && props.getAllOverlaysById(fighter.id).map((overlay, i) => {
                                            return <Overlay key={i} animationType={overlay.type} data={overlay.data}/>
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
                                    { props.getFighterDetails(fighter) && props.getFighterDetails(fighter).pendingAttack && !props.getFighterDetails(fighter).dead && 
                                    <div className={`weapon-wrapper
                                        ${!props.fighterFacingRight(fighter) ? 'reversed' : ''}
                                        ${props.getFighterDetails(fighter)?.aiming ? 'aiming' : ''}
                                        ${(props.getFighterDetails(fighter)?.attacking && props.getFighterDetails(fighter)?.pendingAttack.range === 'close') ? (props.fighterFacingRight(fighter) ? 'swinging-right' : 'swinging-left') 
                                        : (props.getFighterDetails(fighter)?.attacking && props.getFighterDetails(fighter)?.pendingAttack.range === 'far' ? 'shooting' : '')}
                                        ${props.fighterFacingUp(props.getFighterDetails(fighter)) ? 'pointing-up' : (props.fighterFacingDown(props.getFighterDetails(fighter)) ? 'pointing-down' : '')}
                                        medium`}
                                        style={{
                                        left: props.fighterFacingRight(fighter) ?
                                        `${props.getFighterDetails(fighter)?.coordinates.x * 100 + 45 + (props.getFighterDetails(fighter)?.coordinates.x * 2)}px` :
                                        `${props.getFighterDetails(fighter)?.coordinates.x * 100 - 65 + (props.getFighterDetails(fighter)?.coordinates.x * 2)}px`
                                        ,
                                        backgroundImage: "url(" + props.battleData[fighter.id].pendingAttack.icon + ")"
                                    }}>
                                    </div>}
                                    <div className={`action-bar-wrapper ${props.fighterFacingUp(props.getFighterDetails(fighter)) ? 'pointing-up' : (props.fighterFacingDown(props.getFighterDetails(fighter)) ? 'pointing-down' : '')}`} 
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
                                        ${(props.getFighterDetails(fighter)?.attacking) ? (props.fighterFacingRight(fighter) ? 'fighterHitsAnimation' : 'fighterHitsAnimation_RtoL') : ''}
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