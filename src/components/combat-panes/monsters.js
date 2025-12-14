import React from 'react';
import Overlay from '../Overlay';
// import * as images from '../../utils/images'

// const MAX_DEPTH = 7;
// const NUM_COLUMNS = 8;
// // ^ means 8 squares, account for depth of 0 is far left
// const MAX_ROWS = 5;
// const TILE_SIZE = 100;
// const SHOW_TILE_BORDERS = true;
// const SHOW_COMBAT_BORDER_COLORS = true;
// const SHOW_INTERACTION_PANE=true

const MonstersCombatGrid = ({
    monster,
    minions,
    combatManager,
    selectedMonster,
    selectedFighter,
    battleData,
    portraitHoveredId,
    animationOverlays,
    getAllOverlaysById,
    monsterCombatPortraitClicked,
    portraitHovered,
    images,
    TILE_SIZE,
    SHOW_TILE_BORDERS,
    minionDirectionReversed,
    getMonsterWeaponAnimation,
    getHitAnimation,
    monsterFacingUp,
    monsterFacingDown,
    greetingInProcess
}) => {
    return (
        <div className="mb-col monster-pane">
            {/* <div className="monster-content"> */}
                {/* Main Monster */}
                {monster && (
                    <div
                        className="lane-wrapper"
                        style={{
                            top: `${battleData[monster.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? battleData[monster.id]?.coordinates.y * 2 : 0)}px`,
                            height: `${TILE_SIZE}px`
                        }}
                    >
                        <div className="monster-wrapper">
                            <div
                                className={`action-bar-wrapper ${monsterFacingUp(battleData[monster.id]) ? 'pointing-up' : (monsterFacingDown(battleData[monster.id]) ? 'pointing-down' : '')}`}
                                style={{
                                    width: !!battleData[monster.id]?.targetId ? `${combatManager.getDistanceToTargetWidthString(battleData[monster.id])}px` : '5px',
                                    left: `calc(100px * ${combatManager.getCombatant(battleData[monster.id]?.targetId)?.coordinates.x} + 50px)`
                                }}
                            >
                                <div className={`action-bar ${battleData[monster.id]?.attacking ? (minionDirectionReversed(monster) ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}></div>
                            </div>
                            {battleData[monster.id] && battleData[monster.id].pendingAttack && (
                                <div
                                    className={`weapon-wrapper
                                        ${getMonsterWeaponAnimation(battleData[monster.id])}
                                        ${battleData[monster.id]?.aiming ? 'aiming' : ''}
                                        small`}
                                    style={{
                                        left: minionDirectionReversed(monster)
                                            ? `${battleData[monster.id]?.coordinates.x * 100 + 65 + (battleData[monster.id]?.coordinates.x * 2)}px`
                                            : `${battleData[monster.id]?.coordinates.x * 100 - 45 + (battleData[monster.id]?.coordinates.x * 2)}px`,
                                        backgroundImage: `url(${battleData[monster.id].pendingAttack.icon})`
                                    }}
                                ></div>
                            )}
                            <div
                                className="portrait-wrapper monster-portrait-wrapper"
                                style={{
                                    left: `${battleData[monster.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? battleData[monster.id]?.coordinates.x * 2 : 0)}px`,
                                    zIndex: `${battleData[monster.id]?.dead ? '0' : '100'}`
                                }}
                            >
                                <div
                                    className={`portrait monster-portrait
                                        ${greetingInProcess ? 'enlarged' : ''}
                                        ${battleData[monster.id]?.active ? 'active' : ''}
                                        ${battleData[monster.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                        ${battleData[monster.id]?.wounded ? (minionDirectionReversed(monster) ? 'hit-from-right-minor' : 'hit-from-left-minor') : ''}
                                        ${battleData[monster.id]?.rocked ? 'rocked' : ''}
                                        ${battleData[monster.id]?.missed ? (minionDirectionReversed(monster) ? 'missed-reversed' : 'missed') : ''}
                                        ${selectedMonster?.id === monster.id ? 'selected' : ''}
                                        ${selectedFighter?.targetId === monster.id ? 'targetted' : ''}
                                        ${minionDirectionReversed(monster) ? 'reversed' : ''}`}
                                    style={{
                                        backgroundImage: monster.portrait ? `url(${monster.portrait})` : 'none',
                                        filter: `saturate(${((battleData[monster.id]?.hp / monster.stats.hp) * 100) / 2}) sepia(${portraitHoveredId === monster.id ? '2' : '0'})`
                                    }}
                                    onClick={() => monsterCombatPortraitClicked(monster.id)}
                                >
                                    {monster.id}
                                </div>
                                {battleData[monster.id] && animationOverlays[monster.id] && getAllOverlaysById(monster.id).map((overlay, i) => (
                                    <Overlay key={i} animationType={overlay.type} data={overlay.data} />
                                ))}
                                <div
                                    className="portrait-relative-container"
                                    onMouseEnter={() => portraitHovered(monster.id)}
                                    onMouseLeave={() => portraitHovered(null)}
                                    onClick={() => monsterCombatPortraitClicked(monster.id)}
                                >
                                    <div className="targetted-by-container">
                                        {battleData[monster.id]?.targettedBy.map((e, i) => (
                                            <div
                                                key={i}
                                                className="targetted-by-portrait"
                                                style={{ backgroundImage: `url(${images[battleData[e]?.portrait]})` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`portrait-overlay ${battleData[monster.id]?.frozen ? 'frozen' : ''}`}>
                                    <div className="damage-indicator-container">
                                        {battleData[monster.id]?.damageIndicators.map((e, i) => (
                                            <div key={i} className="damage-indicator">
                                                {e}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="indicators-wrapper">
                                    <div className="monster-hp-bar hp-bar">
                                        {!battleData[monster.id]?.dead && (
                                            <div className="red-fill" style={{ width: `${(battleData[monster.id]?.hp / monster.stats.hp) * 100}%` }}></div>
                                        )}
                                    </div>
                                    <div className="monster-energy-bar energy-bar">
                                        {!battleData[monster.id]?.dead && (
                                            <div className="yellow-fill" style={{ width: `calc(${battleData[monster.id]?.energy}%)` }}></div>
                                        )}
                                    </div>
                                    <div className="tempo-bar">
                                        {!battleData[monster.id]?.dead && (
                                            <div className="tempo-indicator" style={{ right: `calc(${battleData[monster.id]?.tempo}% - 4px)` }}></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {/* Minions */}
                {minions && minions.map((minion, i) => (
                    <div
                        key={minion.id}
                        className="lane-wrapper"
                        style={{
                            top: `${battleData[minion.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? battleData[minion.id]?.coordinates.y * 2 : 0)}px`,
                            height: `${TILE_SIZE}px`
                        }}
                    >
                        <div className="monster-wrapper">
                            <div
                                className="action-bar-wrapper"
                                style={{
                                    width: !!battleData[minion.id]?.targetId ? `${combatManager.getDistanceToTargetWidthString(battleData[minion.id])}px` : '5px',
                                    left: `calc(100px * ${combatManager.getCombatant(battleData[minion.id]?.targetId)?.coordinates.x} + 50px)`
                                }}
                            >
                                <div className={`action-bar ${battleData[minion.id]?.attacking ? (minionDirectionReversed(minion) ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}></div>
                            </div>
                            {battleData[minion.id] && battleData[minion.id].pendingAttack && (
                                <div
                                    className={`weapon-wrapper
                                        ${getMonsterWeaponAnimation(battleData[minion.id])}
                                        ${battleData[minion.id]?.aiming ? 'aiming' : ''}
                                        small`}
                                    style={{
                                        left: minionDirectionReversed(minion)
                                            ? `${battleData[minion.id]?.coordinates.x * 100 + 65 + (battleData[minion.id]?.coordinates.x * 2)}px`
                                            : `${battleData[minion.id]?.coordinates.x * 100 - 45 + (battleData[minion.id]?.coordinates.x * 2)}px`,
                                        backgroundImage: `url(${battleData[minion.id].pendingAttack.icon})`
                                    }}
                                ></div>
                            )}
                            <div
                                className="portrait-wrapper"
                                style={{
                                    left: `${battleData[minion.id]?.coordinates.x * 100 + (SHOW_TILE_BORDERS ? battleData[minion.id]?.coordinates.x * 2 : 0)}px`,
                                    zIndex: `${battleData[minion.id]?.dead ? '0' : '100'}`
                                }}
                            >
                                <div
                                    className={`portrait minion-portrait
                                        ${battleData[minion.id]?.active ? 'active' : ''}
                                        ${battleData[minion.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                        ${battleData[minion.id]?.wounded ? 'hit' : ''}
                                        ${battleData[minion.id]?.wounded ? getHitAnimation(battleData[minion.id]) : ''}
                                        ${battleData[minion.id]?.missed ? (minionDirectionReversed(minion) ? 'missed-reversed' : 'missed') : ''}
                                        ${battleData[minion.id]?.rocked ? 'rocked' : ''}
                                        ${selectedMonster?.id === minion.id ? 'selected' : ''}
                                        ${selectedFighter?.targetId === minion.id ? 'targetted' : ''}
                                        ${minionDirectionReversed(minion) ? 'reversed' : ''}`}
                                    style={{
                                        backgroundImage: `url(${minion.portrait})`,
                                        filter: `saturate(${((battleData[minion.id]?.hp / minion.stats.hp) * 100) / 2}) sepia(${portraitHoveredId === minion.id ? '2' : '0'})`
                                    }}
                                    onClick={() => monsterCombatPortraitClicked(minion.id)}
                                >
                                    {minion.id}
                                </div>
                                {battleData[minion.id] && animationOverlays[minion.id] && getAllOverlaysById(minion.id).map((overlay, i) => (
                                    <Overlay key={i} animationType={overlay.type} data={overlay.data} />
                                ))}
                                <div
                                    className="portrait-relative-container"
                                    onMouseEnter={() => portraitHovered(minion.id)}
                                    onMouseLeave={() => portraitHovered(null)}
                                    onClick={() => monsterCombatPortraitClicked(minion.id)}
                                >
                                    <div className="targetted-by-container">
                                        {battleData[minion.id]?.targettedBy.map((e, i) => (
                                            <div
                                                key={i}
                                                className="targetted-by-portrait"
                                                // style={{ backgroundImage: `url(${images[battleData[e]?.portrait]})` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`portrait-overlay ${battleData[minion.id]?.frozen ? 'frozen' : ''}`}>
                                    <div className="damage-indicator-container">
                                        {battleData[minion.id]?.damageIndicators.map((e, i) => (
                                            <div key={i} className="damage-indicator">
                                                {e}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="indicators-wrapper">
                                    <div className="monster-hp-bar hp-bar">
                                        {!battleData[minion.id]?.dead && (
                                            <div className="red-fill" style={{ width: `${(battleData[minion.id]?.hp / minion.stats.hp) * 100}%` }}></div>
                                        )}
                                    </div>
                                    <div className="monster-energy-bar energy-bar">
                                        {!battleData[minion.id]?.dead && (
                                            <div className="yellow-fill" style={{ width: `calc(${battleData[minion.id]?.energy}%)` }}></div>
                                        )}
                                    </div>
                                    <div className="tempo-bar">
                                        {!battleData[minion.id]?.dead && (
                                            <div className="tempo-indicator" style={{ right: `calc(${battleData[minion.id]?.tempo}% - 4px)` }}></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            {/* </div> */}
        </div>
    );
};

export default MonstersCombatGrid;
