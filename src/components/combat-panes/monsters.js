import React from 'react';
import Overlay from '../Overlay';

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
    // minionDirectionReversed removed, use facing property instead
    getMonsterWeaponAnimation,
    getHitAnimation,
    // monsterFacingUp,
    // monsterFacingDown,
    greetingInProcess,
    SHOW_MONSTER_IDS = false,
    teleportingFighterId
}) => {
    const [monsterHitFlashKey, setMonsterHitFlashKey] = React.useState(0);
    const [showMonsterHitFlash, setShowMonsterHitFlash] = React.useState(false);
    const prevMonsterWounded = React.useRef(false);
    const monsterFlashTimeout = React.useRef();
    const monsterFlashHasOccurred = React.useRef(false); // tracker for first hit-flash only
    const [minionHitFlash, setMinionHitFlash] = React.useState({});
    const prevMinionWounded = React.useRef({});

    // Effect for main monster hit flash (trigger on every wound event)
    React.useEffect(() => {
        const wounded = !!battleData[monster?.id]?.wounded;
        if (wounded && !prevMonsterWounded.current) {
            setShowMonsterHitFlash(true);
            setMonsterHitFlashKey(k => k + 1);
            if (monsterFlashTimeout.current) {
                clearTimeout(monsterFlashTimeout.current);
            }
            const timeout = setTimeout(() => {
                setShowMonsterHitFlash(false);
                monsterFlashTimeout.current = null;
            }, 750);
            monsterFlashTimeout.current = timeout;
            prevMonsterWounded.current = true;
        } else if (!wounded && prevMonsterWounded.current) {
            setShowMonsterHitFlash(false);
            prevMonsterWounded.current = false;
            if (monsterFlashTimeout.current) {
                clearTimeout(monsterFlashTimeout.current);
                monsterFlashTimeout.current = null;
            }
        }
        // Cleanup on unmount
        return () => {
            if (monsterFlashTimeout.current) {
                clearTimeout(monsterFlashTimeout.current);
                setShowMonsterHitFlash(false);
                monsterFlashTimeout.current = null;
            }
        };
    }, [battleData[monster?.id]?.wounded, monster?.id]);

    // Effect for minion hit flash (only on new wound event, and clean up removed minions)
    React.useEffect(() => {
        const newFlashes = {};
        const newPrev = {};
        // Only keep minions currently in battleData
        const minionIds = Object.values(battleData).filter(m => m.isMinion).map(m => m.id);
        Object.values(battleData).forEach(minion => {
            if (minion.isMinion) {
                const wounded = !!minion.wounded;
                if (wounded && !prevMinionWounded.current[minion.id]) {
                    // console.log('[MINION FLASH TRIGGER]', minion.id, 'wounded:', minion.wounded, 'prev:', prevMinionWounded.current[minion.id]);
                    newFlashes[minion.id] = true;
                    setTimeout(() => {
                        setMinionHitFlash(prev => ({ ...prev, [minion.id]: false }));
                    }, 750);
                    newPrev[minion.id] = true;
                } else if (!wounded) {
                    newFlashes[minion.id] = false;
                    newPrev[minion.id] = false;
                } else if (prevMinionWounded.current[minion.id]) {
                    // Maintain previous state if still wounded
                    newPrev[minion.id] = true;
                }
            }
        });
        // Remove state for minions that no longer exist
        setMinionHitFlash(prev => {
            const cleaned = {};
            minionIds.forEach(id => {
                cleaned[id] = (id in newFlashes) ? newFlashes[id] : prev[id];
            });
            return cleaned;
        });
        prevMinionWounded.current = newPrev;
    }, [battleData]);

    // Delay removal of monster/minion portrait after death for death animation
    const [showDeathAnimation, setShowDeathAnimation] = React.useState({});
    const [fullyDead, setFullyDead] = React.useState({});

    React.useEffect(() => {
        // Main monster
        if (monster && battleData[monster.id]) {
            if (battleData[monster.id].dead && !showDeathAnimation[monster.id] && !fullyDead[monster.id]) {
                setShowDeathAnimation(prev => ({ ...prev, [monster.id]: true }));
            } else if (!battleData[monster.id].dead && (showDeathAnimation[monster.id] || fullyDead[monster.id])) {
                setShowDeathAnimation(prev => ({ ...prev, [monster.id]: false }));
                setFullyDead(prev => ({ ...prev, [monster.id]: false }));
            }
        }
        // Minions
        Object.values(battleData).forEach(minion => {
            if (minion.isMinion) {
                if (minion.dead && !showDeathAnimation[minion.id] && !fullyDead[minion.id]) {
                    setShowDeathAnimation(prev => ({ ...prev, [minion.id]: true }));
                } else if (!minion.dead && (showDeathAnimation[minion.id] || fullyDead[minion.id])) {
                    setShowDeathAnimation(prev => ({ ...prev, [minion.id]: false }));
                    setFullyDead(prev => ({ ...prev, [minion.id]: false }));
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleData, monster]);

    // Determine if monster or minion is teleporting (by id)
    const isTeleporting = (id) => {
        // Accept teleportingFighterId as a prop (passed in destructured args)
        return (typeof teleportingFighterId !== 'undefined' && teleportingFighterId === id);
    };
    const transitionStyle = (id) => ({ transition: isTeleporting(id) ? 'none' : '1s' });
    return (
        <div className="mb-col monster-pane">
            {/* Main Monster: only render if not dead, or if dead but still animating */}
            {monster && battleData[monster.id] && (!battleData[monster.id].dead || (showDeathAnimation[monster.id] && !fullyDead[monster.id])) && (
                <div
                    className="lane-wrapper"
                    style={{
                        top: `${battleData[monster.id]?.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? battleData[monster.id]?.coordinates.y * 2 : 0)}px`,
                        height: `${TILE_SIZE}px`,
                        ...transitionStyle(monster.id)
                    }}
                >
                    <div className="monster-wrapper">
                        <div
                            className="action-bar-wrapper"
                            style={{
                                width: !!battleData[monster.id]?.targetId ? `${combatManager.getDistanceToTargetWidthString(battleData[monster.id])}px` : '5px',
                                left: `calc(100px * ${combatManager.getCombatant(battleData[monster.id]?.targetId)?.coordinates.x} + 50px)`
                            }}
                        >
                            <div className={`action-bar ${battleData[monster.id]?.attacking ? (battleData[monster.id]?.facing === 'right' ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}></div>
                        </div>
                        {battleData[monster.id] && battleData[monster.id].pendingAttack && (
                            <div
                                className={`weapon-wrapper
                                    ${getMonsterWeaponAnimation(battleData[monster.id])}
                                    ${battleData[monster.id]?.aiming ? 'aiming' : ''}
                                    small`}
                                style={{
                                    left: battleData[monster.id]?.facing === 'right'
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
                                zIndex: `${battleData[monster.id]?.dead ? '0' : '200'}`,
                                ...transitionStyle(monster.id)
                            }}
                        >
                            <div
                                className="portrait-relative-container"
                                onMouseEnter={() => portraitHovered(monster.id)}
                                onMouseLeave={() => portraitHovered(null)}
                                onClick={() => monsterCombatPortraitClicked(monster.id)}
                                style={{ position: 'relative' }}
                            >
                                {/* Portrait at the bottom (lowest z-index) */}
                                <div
                                    className={`portrait monster-portrait
                                        ${greetingInProcess ? 'enlarged' : ''}
                                        ${battleData[monster.id]?.active ? 'active' : ''}
                                        ${battleData[monster.id]?.dead ? 'dead monsterDeadAnimation' : ''}
                                        ${battleData[monster.id]?.wounded ? 'hit' : ''}
                                        ${battleData[monster.id]?.wounded ? (battleData[monster.id]?.facing === 'right' ? 'hit-from-right-minor' : 'hit-from-left-minor') : ''}
                                        ${battleData[monster.id]?.rocked ? 'rocked' : ''}
                                        ${battleData[monster.id]?.missed ? (battleData[monster.id]?.facing === 'right' ? 'missed-reversed' : 'missed') : ''}
                                        ${selectedMonster?.id === monster.id ? 'selected' : ''}
                                        ${selectedFighter?.targetId === monster.id ? 'targetted' : ''}
                                        ${battleData[monster.id]?.facing === 'right' ? 'reversed' : ''}
                                        ${battleData[monster.id]?.wounded ? 'hit-flash' : ''}
                                        ${battleData[monster.id]?.chargingUpActive ? 'charging-up' : ''}`}
                                    ref={el => {
                                        if (battleData[monster.id]?.wounded) {
                                            // console.log('MONSTER WOUNDED:', battleData[monster.id]?.wounded, 'classes:',
                                            //     `hit`,
                                            //     minionDirectionReversed(monster) ? 'hit-from-right-minor' : 'hit-from-left-minor',
                                            //     'hit-flash');
                                        }
                                    }}
                                    style={{
                                        backgroundImage: monster.portrait ? `url(${monster.portrait})` : 'none',
                                        filter: `saturate(${((battleData[monster.id]?.hp / monster.stats.hp) * 100) / 2}) sepia(${portraitHoveredId === monster.id ? '2' : '0'})`,
                                        zIndex: 1,
                                        position: 'relative'
                                    }}
                                    onAnimationEnd={e => {
                                        if (
                                            battleData[monster.id]?.dead &&
                                            e.animationName &&
                                            e.animationName.includes('meltDownDeath') &&
                                            showDeathAnimation[monster.id]
                                        ) {
                                            setFullyDead(prev => ({ ...prev, [monster.id]: true }));
                                            setShowDeathAnimation(prev => ({ ...prev, [monster.id]: false }));
                                        }
                                    }}
                                >
                                    {SHOW_MONSTER_IDS ? monster.id : null}
                                    {/* White hit-flash overlay */}
                                    {showMonsterHitFlash && (
                                        <div className="hit-flash-overlay" key={monsterHitFlashKey} />
                                    )}
                                </div>
                                {/* Overlay and indicators above portrait */}
                                <div className={`portrait-overlay ${battleData[monster.id]?.frozen ? 'frozen' : ''}`} style={{zIndex: 2, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
                                    <div className="damage-indicator-container">
                                        {battleData[monster.id]?.damageIndicators.map((e, i) => (
                                            <div key={i} className="damage-indicator">
                                                {e}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* { !battleData[monster.id]?.dead && (
                                  <div className="targetted-by-container" style={{zIndex: 3, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}>
                                    {battleData[monster.id]?.targettedBy.map((e, i) => (
                                        <div
                                            key={i}
                                            className="targetted-by-portrait"
                                            style={{ backgroundImage: `url(${images[battleData[e]?.portrait]})` }}
                                        ></div>
                                    ))}
                                  </div>
                                )} */}
                            </div>
                            {battleData[monster.id] && !battleData[monster.id]?.dead && animationOverlays[monster.id] && getAllOverlaysById(monster.id).map((overlay, i) => {
                                // Ensure overlay.data contains up-to-date 'dead' property
                                const overlayData = {
                                    ...overlay.data,
                                    dead: battleData[monster.id]?.dead
                                };
                                return <Overlay key={i} animationType={overlay.type} data={overlayData} />;
                            })}
                            <div className="indicators-wrapper">
                                <div className="monster-hp-bar hp-bar">
                                    {!battleData[monster.id]?.dead && (
                                        <div className="red-fill" style={{ width: `${(battleData[monster.id]?.hp / battleData[monster.id]?.stats.hp) * 100}%` }}></div>
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
                {/* Minions: render only those present in battleData and flagged as isMinion */}
                                {Object.values(battleData).filter(m => m.isMinion && (!m.dead || (showDeathAnimation[m.id] && !fullyDead[m.id]))).map((minion) => (
                    <div
                        key={minion.id}
                        className="lane-wrapper"
                        style={{
                            top: `${minion.coordinates.y * TILE_SIZE + (SHOW_TILE_BORDERS ? minion.coordinates.y * 2 : 0)}px`,
                            height: `${TILE_SIZE}px`,
                            ...transitionStyle(minion.id)
                        }}
                    >
                        <div className="monster-wrapper">
                            <div
                                className="action-bar-wrapper"
                                style={{
                                    width: !!minion.targetId ? `${combatManager.getDistanceToTargetWidthString(minion)}px` : '5px',
                                    left: `calc(100px * ${combatManager.getCombatant(minion.targetId)?.coordinates.x} + 50px)`
                                }}
                            >
                                <div className={`action-bar ${minion.attacking ? (minion.facing === 'right' ? 'monsterHitsAnimation_LtoR' : 'monsterHitsAnimation') : ''}`}></div>
                            </div>
                            {minion.pendingAttack && (
                                <div
                                    className={`weapon-wrapper
                                        ${getMonsterWeaponAnimation(minion)}
                                        ${minion.aiming ? 'aiming' : ''}
                                        small`}
                                    style={{
                                        left: minion.facing === 'right'
                                            ? `${minion.coordinates.x * 100 + 65 + (minion.coordinates.x * 2)}px`
                                            : `${minion.coordinates.x * 100 - 45 + (minion.coordinates.x * 2)}px`,
                                        backgroundImage: `url(${minion.pendingAttack.icon})`
                                    }}
                                ></div>
                            )}
                            <div
                                className="portrait-wrapper"
                                style={{
                                    left: `${minion.coordinates.x * 100 + (SHOW_TILE_BORDERS ? minion.coordinates.x * 2 : 0)}px`,
                                    zIndex: `${minion.dead ? '0' : '100'}`,
                                    ...transitionStyle(minion.id)
                                }}
                            >
                                <div
                                    className={`portrait minion-portrait
                                        ${minion.active ? 'active' : ''}
                                        ${minion.dead ? 'dead monsterDeadAnimation' : ''}
                                        ${minion.wounded ? 'hit' : ''}
                                        ${minion.wounded ? getHitAnimation(minion) : ''}
                                        ${minion.missed ? (minion.facing === 'right' ? 'missed-reversed' : 'missed') : ''}
                                        ${minion.rocked ? 'rocked' : ''}
                                        ${selectedMonster?.id === minion.id ? 'selected' : ''}
                                        ${selectedFighter?.targetId === minion.id ? 'targetted' : ''}
                                        ${minion.facing === 'right' ? 'reversed' : ''}`
                                    }
                                    style={{
                                        backgroundImage: `url(${minion.portrait})`,
                                        filter: `saturate(${((minion.hp / minion.stats.hp) * 100) / 2}) sepia(${portraitHoveredId === minion.id ? '2' : '0'})`,
                                        zIndex: 2 // Always below fighter portraits
                                    }}
                                    onClick={() => monsterCombatPortraitClicked(minion.id)}
                                    ref={el => {
                                        if (minion.wounded) {
                                            // console.log('MINION WOUNDED:', minion.id, minion.wounded, 'class:', getHitAnimation(minion));
                                        }
                                    }}
                                    onAnimationEnd={e => {
                                        if (
                                            minion.dead &&
                                            e.animationName &&
                                            e.animationName.includes('meltDownDeath') &&
                                            showDeathAnimation[minion.id]
                                        ) {
                                            setFullyDead(prev => ({ ...prev, [minion.id]: true }));
                                            setShowDeathAnimation(prev => ({ ...prev, [minion.id]: false }));
                                        }
                                    }}
                                >
                                    {SHOW_MONSTER_IDS ? minion.id : null}
                                    {/* White hit-flash overlay for minions */}
                                    {minionHitFlash[minion.id] && (
                                        <div className="hit-flash-overlay" />
                                    )}
                                </div>
                                {animationOverlays[minion.id] && getAllOverlaysById(minion.id).map((overlay, i) => {
                                    const overlayData = {
                                        ...overlay.data,
                                        dead: minion.dead
                                    };
                                    return <Overlay key={i} animationType={overlay.type} data={overlayData} />;
                                })}
                                <div
                                    className="portrait-relative-container"
                                    onMouseEnter={() => portraitHovered(minion.id)}
                                    onMouseLeave={() => portraitHovered(null)}
                                    onClick={() => monsterCombatPortraitClicked(minion.id)}
                                >
                                    <div className="targetted-by-container">
                                        {minion.targettedBy && minion.targettedBy.map((e, i) => (
                                            <div
                                                key={i}
                                                className="targetted-by-portrait"
                                                // style={{ backgroundImage: `url(${images[battleData[e]?.portrait]})` }}
                                            ></div>
                                        ))}
                                    </div>
                                </div>
                                <div className={`portrait-overlay ${minion.frozen ? 'frozen' : ''}`}> 
                                    <div className="damage-indicator-container">
                                        {minion.damageIndicators && minion.damageIndicators.map((e, i) => (
                                            <div key={i} className="damage-indicator">
                                                {e}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="indicators-wrapper">
                                    <div className="monster-hp-bar hp-bar">
                                        {!minion.dead && (
                                            <div className="red-fill" style={{ width: `${(minion.hp / minion.stats.hp) * 100}%` }}></div>
                                        )}
                                    </div>
                                    <div className="monster-energy-bar energy-bar">
                                        {!minion.dead && (
                                            <div className="yellow-fill" style={{ width: `calc(${minion.energy}%)` }}></div>
                                        )}
                                    </div>
                                    <div className="tempo-bar">
                                        {!minion.dead && (
                                            <div className="tempo-indicator" style={{ right: `calc(${minion.tempo}% - 4px)` }}></div>
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
