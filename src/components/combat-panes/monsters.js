import React from 'react';
import Overlay from '../Overlay';
import { ROCK_DURATION } from '../../utils/shared-constants';

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
    const monsterDiagInterval = React.useRef();
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
            }, ROCK_DURATION);
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
                    }, ROCK_DURATION);
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
    // Helper: compute inline CSS vars for hit animations so wrappers always expose
    // --portrait-* properties even if stylesheet selectors fail to match.
    // DEBUG: toggle to temporarily increase bulge so the effect is visible while testing.
    // Set to true for a very large debug bulge; remember to set back to false afterwards.
    const DEBUG_FORCE_BIG_BULGE = true;
    // When DEBUG is enabled, control how strongly minion bulge moves toward the
    // extreme debug values. 0 = keep base minion value, 1 = use full debug value.
    // Set to 0.5 to pick a halfway intensity as requested.
    const MINION_DEBUG_FACTOR = 0.3;
    const computeHitVars = (combatant) => {
        if (!combatant || !combatant.wounded) return {};
        const hc = getHitAnimation(combatant) || '';
        let severity = 'minor';
        if (hc.indexOf('severe') !== -1) severity = 'severe';
        if (hc.indexOf('lethal') !== -1) severity = 'lethal';
        const dirLeft = hc.indexOf('left') !== -1;
        const dirRight = hc.indexOf('right') !== -1;
        const dirTop = hc.indexOf('top') !== -1;
        const dirBottom = hc.indexOf('bottom') !== -1;
        const perspective = severity === 'minor' ? '600px' : severity === 'severe' ? '800px' : '1000px';
        let rotateY = '0deg';
        let translateX = '0px';
        if (dirLeft) {
            rotateY = '-10deg';
            translateX = '4px';
        } else if (dirRight) {
            rotateY = '10deg';
            translateX = '-4px';
        }
        // Default small bulge values (subtle)
        let baseBulgeMinor = '1.003';
        let baseBulgeSevere = '1.006';
        let baseBulgeLethal = '1.01';
        // Slightly increase base bulge intensity for minions so direction is more visible
        if (combatant && combatant.isMinion) {
            baseBulgeMinor = '1.02';
            baseBulgeSevere = '1.03';
            baseBulgeLethal = '1.05';
        }

        // Extreme debug values (only used when DEBUG_FORCE_BIG_BULGE is true)
        const debugBulgeMinor = '1.6';
        const debugBulgeSevere = '1.9';
        const debugBulgeLethal = '2.2';

        // Compute final bulge values. If debug is enabled, interpolate between
        // the base minion value and the debug extreme using MINION_DEBUG_FACTOR.
        const interp = (base, debug) => {
            try {
                const b = parseFloat(base);
                const d = parseFloat(debug);
                if (Number.isNaN(b) || Number.isNaN(d)) return base;
                return String((b * (1 - MINION_DEBUG_FACTOR) + d * MINION_DEBUG_FACTOR).toFixed(3));
            } catch (err) {
                return base;
            }
        };

        let bulgeMinor = baseBulgeMinor;
        let bulgeSevere = baseBulgeSevere;
        let bulgeLethal = baseBulgeLethal;
        if (DEBUG_FORCE_BIG_BULGE && combatant && combatant.isMinion) {
            bulgeMinor = interp(baseBulgeMinor, debugBulgeMinor);
            bulgeSevere = interp(baseBulgeSevere, debugBulgeSevere);
            bulgeLethal = interp(baseBulgeLethal, debugBulgeLethal);
        } else if (DEBUG_FORCE_BIG_BULGE) {
            // If debug is enabled but not a minion, use the full debug values for visibility.
            bulgeMinor = debugBulgeMinor;
            bulgeSevere = debugBulgeSevere;
            bulgeLethal = debugBulgeLethal;
        }

        const bulgeValue = severity === 'minor' ? bulgeMinor : severity === 'severe' ? bulgeSevere : bulgeLethal;

        // Axis-specific bulge and transform-origin so bulge direction matches hit side
        let bulgeX = '1';
        let bulgeY = '1';
        let transformOrigin = '50% 80%';
        if (dirLeft) {
            bulgeX = bulgeValue;
            bulgeY = '1';
            transformOrigin = '0% 50%';
        } else if (dirRight) {
            bulgeX = bulgeValue;
            bulgeY = '1';
            transformOrigin = '100% 50%';
        } else if (dirTop) {
            bulgeY = bulgeValue;
            bulgeX = '1';
            transformOrigin = '50% 0%';
        } else if (dirBottom) {
            bulgeY = bulgeValue;
            bulgeX = '1';
            transformOrigin = '50% 100%';
        } else {
            // Fallback: small uniform bulge
            bulgeX = bulgeValue;
            bulgeY = bulgeValue;
        }

        // If it's a minion and the hit is vertical, nudge the vertical bulge a bit
        // to make the direction more visible (minion portraits are smaller).
        if (combatant && combatant.isMinion && (dirTop || dirBottom)) {
            // bump by a small factor depending on severity
            const bump = severity === 'minor' ? 1.03 : severity === 'severe' ? 1.06 : 1.08;
            // parse and multiply numeric value (strings like '1.02')
            try {
                const n = parseFloat(bulgeY);
                if (!Number.isNaN(n)) {
                    bulgeY = String(Math.max(n * bump, n + 0.02).toFixed(3));
                }
            } catch (err) {
                // ignore parse errors, keep existing value
            }
        }

        return {
            '--portrait-perspective': perspective,
            '--portrait-rotateY': rotateY,
            '--portrait-translateX': translateX,
            '--portrait-bulge-x': bulgeX,
            '--portrait-bulge-y': bulgeY,
            '--portrait-transform-origin': transformOrigin,
            // Preserve the base scale for main monsters so animations don't reset scale(2)
            '--portrait-base-scale': combatant.isMinion ? '1' : '2',
            // Per-element animation tuning: make minions a touch slower/smoother
            '--portrait-animation-duration': combatant.isMinion ? '520ms' : '420ms',
            '--portrait-animation-timing': combatant.isMinion ? 'cubic-bezier(.18,.9,.22,1)' : 'cubic-bezier(.2,.8,.2,1)'
        };
    };
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
                    <div
                        className={`monster-wrapper ${battleData[monster.id]?.rocked ? 'rocked' : ''} ${battleData[monster.id]?.wounded ? 'hit' : ''} ${battleData[monster.id]?.wounded ? getHitAnimation(battleData[monster.id]) : ''} ${battleData[monster.id]?.wounded ? 'hit-flash' : ''} ${battleData[monster.id]?.facing === 'right' ? 'reversed' : ''}`}
                        style={computeHitVars(battleData[monster.id])}
                    >
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
                                        ${battleData[monster.id]?.missed ? (battleData[monster.id]?.facing === 'right' ? 'missed-reversed' : 'missed') : ''}
                                        ${selectedMonster?.id === monster.id ? 'selected' : ''}
                                        ${selectedFighter?.targetId === monster.id ? 'targetted' : ''}
                                        ${battleData[monster.id]?.facing === 'right' ? 'reversed' : ''}
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
                                        ,
                                        animation: battleData[monster.id]?.wounded ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1))' : undefined,
                                        animationFillMode: battleData[monster.id]?.wounded ? 'forwards' : undefined
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
                                    onAnimationStart={e => {
                                        // try {
                                        //     if (e && e.animationName && e.animationName.includes('BulgePortrait')) {
                                        //         // eslint-disable-next-line no-console
                                        //         console.log('ANIM START: BulgePortrait on monster', monster.id, 'event:', e);
                                        //     }
                                        // } catch (err) {
                                        //     // eslint-disable-next-line no-console
                                        //     console.error('Error in onAnimationStart (monster)', err);
                                        // }
                                    }}
                                >
                                    {SHOW_MONSTER_IDS ? monster.id : null}
                                    {/* Blue hit-flash overlay: show for transient flash OR when wounded (keeps behavior consistent with minions) */}
                                    {(showMonsterHitFlash || battleData[monster.id]?.wounded) && (
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
                        <div
                            className={`monster-wrapper ${minion.rocked ? 'rocked' : ''} ${minion.wounded ? 'hit' : ''} ${minion.wounded ? getHitAnimation(minion) : ''} ${minion.wounded ? 'hit-flash' : ''} ${minion.facing === 'right' ? 'reversed' : ''}`}
                            style={computeHitVars(minion)}
                        >
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
                                            ${minion.missed ? (minion.facing === 'right' ? 'missed-reversed' : 'missed') : ''}
                                            ${selectedMonster?.id === minion.id ? 'selected' : ''}
                                            ${selectedFighter?.targetId === minion.id ? 'targetted' : ''}
                                            ${minion.facing === 'right' ? 'reversed' : ''}`
                                        }
                                    style={{
                                        backgroundImage: `url(${minion.portrait})`,
                                        filter: `saturate(${((minion.hp / minion.stats.hp) * 100) / 2}) sepia(${portraitHoveredId === minion.id ? '2' : '0'})`,
                                        zIndex: 2 // Always below fighter portraits
                                        ,
                                        animation: minion.wounded ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1))' : undefined,
                                        animationFillMode: minion.wounded ? 'forwards' : undefined
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
                                        onAnimationStart={e => {
                                            // try {
                                            //     if (e && e.animationName && e.animationName.includes('BulgePortrait')) {
                                            //         // eslint-disable-next-line no-console
                                            //         console.log('ANIM START: BulgePortrait on minion', minion.id, 'event:', e);
                                            //     }
                                            // } catch (err) {
                                            //     // eslint-disable-next-line no-console
                                            //     console.error('Error in onAnimationStart (minion)', err);
                                            // }
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
