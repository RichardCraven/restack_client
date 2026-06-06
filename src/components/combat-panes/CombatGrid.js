/**
 * CombatGrid — Unified grid that renders ALL combatants (fighters, monsters,
 * minions) in a single absolute-positioned layer.
 *
 * DOM structure (Sandbox-style, no lane-wrapper or monster-wrapper):
 *   .combat-units-layer
 *     .unit-tile  (position: absolute, left: xPos, top: yPos, TILE_SIZE × TILE_SIZE)
 *       .portrait + overlays
 */
import React from 'react';
import * as images from '../../utils/images';
import Overlay from '../Overlay';
import { FIGHTER_MOVE_TRANSITION_MS, ROCK_DURATION } from '../../utils/shared-constants';

const TILE_SIZE = 100;
const SHOW_TILE_BORDERS = true;

// ── Shared helpers ────────────────────────────────────────────────────────────

const getActiveEffects = (combatant, combatManager) => {
    const list = [];
    if (!combatant) return list;
    const liveUnit = combatManager?.getCombatant?.(combatant.id) || combatant;

    if (liveUnit.frozen) list.push({ key: 'frozen', icon: images.frozen, border: '#00bfff' });
    if (liveUnit.stunned) list.push({ key: 'stunned', icon: images.whiteskull || images.induce_fear, border: '#f5c842' });
    if (liveUnit.bleed) list.push({ key: 'bleed', icon: images.bleeding, border: '#e05555' });
    if (liveUnit.poison) list.push({ key: 'poison', icon: images.poison, border: '#7affa0' });
    if (liveUnit.shieldWallActive) list.push({ key: 'shield_wall', icon: images.shield_wall, border: '#90c4ff' });
    if (liveUnit.defensiveStanceActive || liveUnit.defensiveStance) list.push({ key: 'defensive_stance', icon: images.soldier_defensive_stance, border: '#cccccc' });
    if (liveUnit.berserkerActive) list.push({ key: 'berserker', icon: images.barbarian_berserker, border: '#ff4444' });
    if (liveUnit.weaknessRevealed) list.push({ key: 'weakness', icon: images.weakness_doubled, border: '#cc44ff' });
    if (liveUnit.marked) list.push({ key: 'marked', icon: images.ranger_mark, border: '#ffaa00' });
    if (liveUnit.ensnared) list.push({ key: 'ensnared', icon: images.ranger_ensnare, border: '#00ff00' });
    if (liveUnit.astralBeingActive) list.push({ key: 'astral_being', icon: images.monk_astral_being, border: '#21e6c1' });
    if (liveUnit.thirdEyeActive) list.push({ key: 'third_eye', icon: images.monk_third_eye, border: '#21e6c1' });

    return list;
};

const formatDamageValue = (value) => {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);
    if (typeof value === 'string') {
        const n = Number(value);
        if (value.trim() !== '' && Number.isFinite(n)) return Math.round(n);
    }
    return value;
};

// ── Hit animation CSS variable helpers ───────────────────────────────────────
const DEBUG_FORCE_BIG_BULGE = true;
const MINION_DEBUG_FACTOR = 0.3;

const computeHitVars = (combatant, getHitAnimation) => {
    const baseScale = (combatant && combatant.isMinion) ? '1' : '2';
    const flip = (combatant && combatant.facing === 'right') ? '-1' : '1';
    if (!combatant || !combatant.wounded) return { '--portrait-base-scale': baseScale, '--portrait-flip': flip };
    const hc = (getHitAnimation && getHitAnimation(combatant)) || '';
    let severity = 'minor';
    if (hc.indexOf('severe') !== -1) severity = 'severe';
    if (hc.indexOf('lethal') !== -1) severity = 'lethal';
    const dirLeft = hc.indexOf('left') !== -1;
    const dirRight = hc.indexOf('right') !== -1;
    const dirTop = hc.indexOf('top') !== -1;
    const dirBottom = hc.indexOf('bottom') !== -1;
    const perspective = severity === 'minor' ? '600px' : severity === 'severe' ? '800px' : '1000px';
    let rotateY = '0deg', translateX = '0px';
    if (dirLeft) { rotateY = '-10deg'; translateX = '4px'; }
    else if (dirRight) { rotateY = '10deg'; translateX = '-4px'; }

    const interp = (base, debug) => {
        const b = parseFloat(base), d = parseFloat(debug);
        if (isNaN(b) || isNaN(d)) return base;
        return String((b * (1 - MINION_DEBUG_FACTOR) + d * MINION_DEBUG_FACTOR).toFixed(3));
    };

    let baseBulgeMinor = '1.003', baseBulgeSevere = '1.006', baseBulgeLethal = '1.01';
    if (combatant && combatant.isMinion) { baseBulgeMinor = '1.02'; baseBulgeSevere = '1.03'; baseBulgeLethal = '1.05'; }

    let bulgeMinor = baseBulgeMinor, bulgeSevere = baseBulgeSevere, bulgeLethal = baseBulgeLethal;
    if (DEBUG_FORCE_BIG_BULGE && combatant && combatant.isMinion) {
        bulgeMinor = interp(baseBulgeMinor, '1.6'); bulgeSevere = interp(baseBulgeSevere, '1.9'); bulgeLethal = interp(baseBulgeLethal, '2.2');
    } else if (DEBUG_FORCE_BIG_BULGE) {
        bulgeMinor = '1.6'; bulgeSevere = '1.9'; bulgeLethal = '2.2';
    }

    const bulgeValue = severity === 'minor' ? bulgeMinor : severity === 'severe' ? bulgeSevere : bulgeLethal;
    let bulgeX = '1', bulgeY = '1', transformOrigin = '50% 80%';
    if (dirLeft) { bulgeX = bulgeValue; transformOrigin = '0% 50%'; }
    else if (dirRight) { bulgeX = bulgeValue; transformOrigin = '100% 50%'; }
    else if (dirTop) { bulgeY = bulgeValue; transformOrigin = '50% 0%'; }
    else if (dirBottom) { bulgeY = bulgeValue; transformOrigin = '50% 100%'; }
    else { bulgeX = bulgeValue; bulgeY = bulgeValue; }

    return {
        '--portrait-perspective': perspective,
        '--portrait-rotateY': rotateY,
        '--portrait-translateX': translateX,
        '--portrait-bulge-x': bulgeX,
        '--portrait-bulge-y': bulgeY,
        '--portrait-transform-origin': transformOrigin,
        '--portrait-base-scale': combatant.isMinion ? '1' : '2',
        '--portrait-flip': combatant.facing === 'right' ? '-1' : '1',
        '--portrait-animation-duration': combatant.isMinion ? '520ms' : '420ms',
        '--portrait-animation-timing': combatant.isMinion ? 'cubic-bezier(.18,.9,.22,1)' : 'cubic-bezier(.2,.8,.2,1)'
    };
};

// Compute pixel position for a tile coordinate
const tilePos = (coord) => coord * TILE_SIZE + (SHOW_TILE_BORDERS ? coord * 2 : 0);

// ── Main component ────────────────────────────────────────────────────────────

export default function CombatGrid(props) {
    const {
        crew = [],
        combatManager,
        battleData = {},
        selectedFighter,
        selectedMonster,
        portraitHoveredId,
        animationOverlays = {},
        getAllOverlaysById,
        portraitHovered,
        fighterPortraitClicked,
        monsterCombatPortraitClicked,
        onDragStart,
        getManualMovementArc,
        getManualMovementArcColor,
        getFighterDetails,
        getHitAnimation,
        teleportingFighterId,
        fearCastingActive,
        greetingInProcess,
        SHOW_MONSTER_IDS = false,
    } = props;

    // ── Death animation state ─────────────────────────────────────────────────
    const [showDeathAnimation, setShowDeathAnimation] = React.useState({});
    const [fullyDead, setFullyDead] = React.useState({});

    React.useEffect(() => {
        const allUnits = Object.values(battleData);
        allUnits.forEach(unit => {
            if (!unit) return;
            if (unit.dead && !showDeathAnimation[unit.id] && !fullyDead[unit.id]) {
                setShowDeathAnimation(prev => ({ ...prev, [unit.id]: true }));
                const id = unit.id;
                const t = setTimeout(() => {
                    setFullyDead(prev => { if (!prev[id]) return { ...prev, [id]: true }; return prev; });
                    setShowDeathAnimation(prev => ({ ...prev, [id]: false }));
                }, 2400);
                return () => clearTimeout(t);
            } else if (!unit.dead && (showDeathAnimation[unit.id] || fullyDead[unit.id])) {
                setShowDeathAnimation(prev => ({ ...prev, [unit.id]: false }));
                setFullyDead(prev => ({ ...prev, [unit.id]: false }));
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleData]);

    // ── Damage indicator system ───────────────────────────────────────────────
    const [visibleDamageIndicators, setVisibleDamageIndicators] = React.useState({});
    const [indicatorQueues, setIndicatorQueues] = React.useState({});
    const indicatorTimeouts = React.useRef({});
    const STAGGER_DELAY = 150;

    React.useEffect(() => {
        Object.values(battleData).forEach(entity => {
            if (!entity || !Array.isArray(entity.damageIndicators)) return;
            const id = entity.id;
            setIndicatorQueues(prev => {
                const prevQueue = prev[id] || [];
                const visibleIds = (visibleDamageIndicators[id] || []).map(e => e.id);
                const queueIds = prevQueue.map(e => e.id);
                const newIndicators = entity.damageIndicators
                    .filter(e => e && !visibleIds.includes(e.id) && !queueIds.includes(e.id))
                    .map(e => e.timestamp ? e : { ...e, timestamp: Date.now() });
                if (newIndicators.length === 0) return prev;
                return { ...prev, [id]: [...prevQueue, ...newIndicators] };
            });
        });
        const timeoutsToClean = indicatorTimeouts.current;
        return () => { Object.values(timeoutsToClean).forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleData]);

    React.useEffect(() => {
        Object.keys(indicatorQueues).forEach(id => {
            if (!indicatorQueues[id] || indicatorQueues[id].length === 0) return;
            const visibleArr = visibleDamageIndicators[id] || [];
            const lastTimestamp = visibleArr.length > 0 ? Math.max(...visibleArr.map(e => e.timestamp)) : 0;
            if (visibleArr.length === 0 || (Date.now() - lastTimestamp >= STAGGER_DELAY)) {
                const [next, ...rest] = indicatorQueues[id];
                setVisibleDamageIndicators(prev => ({ ...prev, [id]: [...(prev[id] || []), next] }));
                setIndicatorQueues(prev => ({ ...prev, [id]: rest }));
                if (!indicatorTimeouts.current[next.id]) {
                    indicatorTimeouts.current[next.id] = setTimeout(() => {
                        setVisibleDamageIndicators(current => {
                            const arr = (current[id] || []).filter(e => e.id !== next.id);
                            return { ...current, [id]: arr };
                        });
                        const entityRef = battleData[id];
                        if (entityRef && Array.isArray(entityRef.damageIndicators)) {
                            entityRef.damageIndicators = entityRef.damageIndicators.filter(e => e && e.id !== next.id);
                        }
                        delete indicatorTimeouts.current[next.id];
                    }, ROCK_DURATION || 1800);
                }
            }
        });
    }, [indicatorQueues, visibleDamageIndicators, battleData]);

    // ── Refs ─────────────────────────────────────────────────────────────────
    // portraitWrapperRefs kept for any external code that reads them
    const portraitWrapperRefs = React.useRef({});
    // fighterWrapperRefs no longer needed (no fighter-wrapper element) but kept
    // so any ref captures still get a no-op assignment
    const fighterWrapperRefs = React.useRef({}); // eslint-disable-line no-unused-vars

    const [consumableFlashes, setConsumableFlashes] = React.useState({});
    const prevConsumableFlashRef = React.useRef({});

    React.useEffect(() => {
        crew.forEach(fighter => {
            const details = getFighterDetails(fighter);
            if (!details) return;
            const flashTs = details.consumableFlash?.timestamp;
            const prevFlashTs = prevConsumableFlashRef.current[fighter.id];
            if (flashTs && flashTs !== prevFlashTs) {
                prevConsumableFlashRef.current[fighter.id] = flashTs;
                setConsumableFlashes(prev => ({ ...prev, [fighter.id]: details.consumableFlash.iconKey }));
                setTimeout(() => { setConsumableFlashes(prev => ({ ...prev, [fighter.id]: null })); }, 1500);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleData, crew]);

    const isTeleporting = (id) => teleportingFighterId === id;

    // ── Build unit collections ───────────────────────────────────────────────
    const crewIds = new Set(crew.map(f => f.id));

    // ── Shared: effect icon row ───────────────────────────────────────────────
    const renderEffectIcons = (unit) => (
        <div style={{ position: 'absolute', top: '-6px', right: '-6px', display: 'flex', gap: '2px', zIndex: 350, pointerEvents: 'none' }}>
            {getActiveEffects(unit, combatManager).map((eff) => (
                <div key={eff.key} className="effect-icon-active" style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    backgroundColor: '#111', border: `2px solid ${eff.border}`,
                    backgroundImage: `url(${eff.icon})`, backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }} />
            ))}
        </div>
    );

    // ── Shared: stacked damage indicators ────────────────────────────────────
    const renderDamageIndicators = (unitId) => {
        const indicators = visibleDamageIndicators[unitId] || [];
        return (
            <div className="damage-indicator-container" style={{ overflow: 'visible' }}>
                {indicators.map((indicator, idx, arr) => {
                    const isStatDebuff = !indicator.isCrit && !indicator.isMiss && typeof indicator.value === 'string' && indicator.type !== 'robbed';
                    const yOffset = idx * 28;
                    return (
                        <div
                            key={indicator.id}
                            className={`damage-indicator${isStatDebuff ? ' stat-debuff' : ''}${indicator.isCrit ? ' crit' : ''}${indicator.type === 'heal' ? ' heal' : ''}${indicator.type === 'robbed' ? ' robbed' : ''}${indicator.isMiss ? ' miss' : ''}`}
                            style={{ transform: `translateY(-${yOffset}px)`, zIndex: 10 + (arr.length - idx), position: 'absolute', left: 0, right: 0, margin: '0 auto', pointerEvents: 'none' }}
                        >
                            {formatDamageValue(indicator.value)}
                        </div>
                    );
                })}
            </div>
        );
    };

    // ── Fighter rendering ─────────────────────────────────────────────────────
    const activeCrew = crew.filter(f => {
        const details = getFighterDetails(f);
        return battleData[f.id] && !details?.invisible && (!details?.dead || (showDeathAnimation[f.id] && !fullyDead[f.id]));
    });

    const renderFighter = (fighter) => {
        const details = getFighterDetails(fighter);
        const facingClass = details?.facing === 'left' ? 'reversed' : '';
        const verticalFacingClass = details?.facing === 'up' ? 'facing-up' : (details?.facing === 'down' ? 'facing-down' : '');
        const isTelep = isTeleporting(fighter.id);
        const coords = battleData[fighter.id]?.coordinates;
        if (!coords) return null;
        const xPos = tilePos(coords.x);
        const yPos = tilePos(coords.y);

        // All visual-state classes go on the unit-tile (100×100) — no full-width ancestors
        const unitTileClasses = [
            'unit-tile',
            'fighter-unit-tile',
            fighter.isLeader ? 'leader-unit-tile' : '',
            isTelep ? 'teleporting' : '',
            details?.rocked ? 'rocked' : '',
            details?.wounded ? 'hit' : '',
            details?.wounded ? (getHitAnimation ? getHitAnimation(details) : '') : '',
            details?.wounded ? 'hit-flash' : '',
            details?.facing === 'right' ? 'reversed' : '',
            details?.stunned ? 'stunned' : '',
        ].filter(Boolean).join(' ');

        const portraitClasses = [
            'portrait', 'fighter-portrait',
            isTelep ? 'teleporting' : '',
            selectedFighter?.id === fighter.id && !fighter.dead ? 'selected' : '',
            details?.dead ? 'dead fighterDeadAnimation' : '',
            details?.active ? 'active' : '',
            facingClass, verticalFacingClass,
            details?.locked ? 'locked' : '',
            details?.chargingUpActive ? 'charging-up' : '',
            details?.berserkerActive && details?.feared && !details?.stunned ? 'berserk-feared' : '',
            details?.berserkerActive && (!details?.feared || details?.stunned) ? 'berserk-active' : '',
            !details?.berserkerActive && details?.feared ? 'feared' : '',
            combatManager.getCombatant(fighter.id)?.shieldWallActive ? 'shield-wall-active' : '',
            details?.drained ? 'drained' : '',
            details?.regenerating ? 'regenerating' : '',
            details?.healPulse ? 'heal-pulse' : '',
            details?.bleed ? 'bleeding' : '',
            details?.frozen ? 'frozen' : '',
            combatManager.getCombatant(fighter.id)?.astralBeingActive ? 'astral-being' : '',
            combatManager.getCombatant(fighter.id)?.astralProjectionActive ? 'astral-projection-active' : '',
            fighter.isLeader ? 'leader-portrait' : '',
        ].filter(Boolean).join(' ');

        return (
            <div
                key={fighter.id}
                className={unitTileClasses}
                style={{
                    position: 'absolute',
                    left: `${xPos}px`,
                    top: `${yPos}px`,
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    overflow: 'visible',
                    pointerEvents: 'none',
                    zIndex: 300,
                    transition: isTelep ? 'none' : `left ${FIGHTER_MOVE_TRANSITION_MS}ms, top ${FIGHTER_MOVE_TRANSITION_MS}ms`,
                    ...computeHitVars(details || fighter, getHitAnimation),
                }}
                ref={el => { portraitWrapperRefs.current[fighter.id] = el; }}
            >
                {renderEffectIcons(details || fighter)}
                <div className="portrait-relative-container" style={{ position: 'relative', pointerEvents: 'auto' }}>
                    <div
                        className={portraitClasses}
                        style={{
                            backgroundImage: `url(${fighter.portrait})`,
                            opacity: combatManager.getCombatant(fighter.id)?.astralBeingActive ? 0.55 : 1,
                            filter: [
                                details?.chargingUpActive ? "url('#ripple-effect')" : null,
                                `sepia(${portraitHoveredId === fighter.id ? '2' : '0'})`,
                                details?.frozen ? 'hue-rotate(165deg) saturate(1.35) brightness(1.08) contrast(1.05)' : '',
                                (details?.berserkerActive && details?.feared && !details?.stunned) ? 'brightness(1.18)' : ''
                            ].filter(Boolean).join(' '),
                            zIndex: 300,
                            animation: (details?.wounded && !details?.dead) ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1))' : undefined,
                            animationFillMode: (details?.wounded && !details?.dead) ? 'forwards' : undefined,
                        }}
                        onClick={() => fighterPortraitClicked(fighter.id)}
                        onMouseEnter={() => portraitHovered(fighter.id)}
                        onMouseLeave={() => portraitHovered(null)}
                        onDragStart={(event) => onDragStart(fighter)}
                        draggable
                        onAnimationEnd={e => {
                            if (details?.dead && e.animationName && e.animationName.includes('meltDownDeath') && showDeathAnimation[fighter.id]) {
                                setFullyDead(prev => ({ ...prev, [fighter.id]: true }));
                                setShowDeathAnimation(prev => ({ ...prev, [fighter.id]: false }));
                            }
                        }}
                    />
                    {details?.wounded && <div className="hit-flash-overlay" />}
                </div>
                {animationOverlays[fighter.id] && getAllOverlaysById(fighter.id).map((overlay, i) => (
                    <Overlay key={i} animationType={overlay.type} data={{ ...overlay.data, dead: details?.dead }} />
                ))}
                <div className={`portrait-overlay${details?.drained ? ' drained' : ''}${details?.frozen ? ' frozen' : ''}`}>
                    <div className="damage-indicator-container">
                        {getFighterDetails(fighter)?.damageIndicators.map((e, i) => {
                            const isStatDebuff = !e.isCrit && !e.isMiss && typeof e.value === 'string';
                            return <div key={e.id || i} className={`damage-indicator${isStatDebuff ? ' stat-debuff' : ''}${e.isCrit ? ' crit' : ''}${e.isMiss ? ' miss' : ''}`}>{formatDamageValue(e.value)}</div>;
                        })}
                    </div>
                    {selectedFighter?.id === fighter.id && !fighter.dead && (
                        <div className="circular-progress selected" style={{
                            background: `conic-gradient(${getManualMovementArcColor(getFighterDetails(fighter))} ${getManualMovementArc(getFighterDetails(fighter))}deg, black 0deg)`,
                        }}>
                            <div className="inner-circle" />
                        </div>
                    )}
                </div>
                {/* Target indicator */}
                {(() => {
                    const liveFighter = combatManager.getCombatant(fighter.id);
                    const target = liveFighter?.targetId ? combatManager.getCombatant(liveFighter.targetId) : null;
                    return target?.portrait && !target?.invisible && !details?.dead ? (
                        <div className="monster-target-indicator" style={{ zIndex: 310, position: 'absolute' }}>
                            <div className="monster-target-portrait" style={{ backgroundImage: `url(${target.portrait})` }} />
                        </div>
                    ) : null;
                })()}
                {consumableFlashes[fighter.id] && !details?.dead && (
                    <div className="fighter-consumable-indicator" style={{ zIndex: 310, position: 'absolute' }}>
                        <div className="fighter-consumable-portrait" style={{ backgroundImage: `url(${images[consumableFlashes[fighter.id]]})` }} />
                    </div>
                )}
                <div className="hp-bar">
                    {!getFighterDetails(fighter)?.dead && (
                        <div className="red-fill" style={{ width: `${(getFighterDetails(fighter)?.hp / fighter.stats.hp) * 100}%` }} />
                    )}
                </div>
                {combatManager && combatManager.round !== undefined ? (
                    <div className="endurance-bar" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginTop: '2px', position: 'relative' }}>
                        {!getFighterDetails(fighter)?.dead && (
                            <div className="white-fill" style={{ height: '100%', backgroundColor: '#ffffff', width: `${(getFighterDetails(fighter)?.endurance / getFighterDetails(fighter)?.maxEndurance) * 100}%` }} />
                        )}
                    </div>
                ) : null}
            </div>
        );
    };

    // ── Monster/minion rendering ──────────────────────────────────────────────
    const renderMonsterUnit = (unit) => {
        const isMonster = unit.isMonster;
        const isMinion = unit.isMinion;
        const isDead = unit.dead;
        const shouldShow = !unit.invisible && (!isDead || unit.bifurcating || (showDeathAnimation[unit.id] && !fullyDead[unit.id]));
        if (!shouldShow) return null;
        if (!unit.coordinates) return null;

        const hitAnim = getHitAnimation ? getHitAnimation(unit) : '';
        const xPos = tilePos(unit.coordinates.x);
        const yPos = tilePos(unit.coordinates.y);
        const isTelep = isTeleporting(unit.id);

        // All state classes go on unit-tile (100×100) — not on any full-width wrapper
        const unitTileClasses = [
            'unit-tile',
            isMinion ? 'minion-unit-tile' : 'monster-unit-tile',
            unit.rocked ? 'rocked' : '',
            unit.wounded ? 'hit' : '',
            unit.wounded ? hitAnim : '',
            unit.wounded ? 'hit-flash' : '',
            unit.facing === 'right' ? 'reversed' : '',
            unit.stunned ? 'stunned' : '',
        ].filter(Boolean).join(' ');

        const portraitClasses = [
            'portrait',
            isMinion ? 'minion-portrait' : 'monster-portrait',
            greetingInProcess ? 'enlarged' : '',
            unit.active ? 'active' : '',
            portraitHoveredId === unit.id ? 'hover-linked-target' : '',
            unit.bifurcating ? 'bifurcatingAnimation' : (isDead ? 'dead monsterDeadAnimation' : ''),
            unit.isBifurcateSmall ? 'bifurcate-copy' : '',
            unit.isBifurcateCopy ? 'bifurcate-copy-spawning' : '',
            unit.missed ? (unit.facing === 'right' ? 'missed-reversed' : 'missed') : '',
            selectedMonster?.id === unit.id ? 'selected' : '',
            unit.facing === 'right' ? 'reversed' : '',
            unit.facing === 'up' ? 'facing-up' : '',
            unit.facing === 'down' ? 'facing-down' : '',
            unit.chargingUpActive ? 'charging-up' : '',
            unit.regenerating ? 'regenerating' : '',
            unit.bleed ? 'bleeding' : '',
        ].filter(Boolean).join(' ');

        return (
            <div
                key={unit.id}
                className={unitTileClasses}
                style={{
                    position: 'absolute',
                    left: `${xPos}px`,
                    top: `${yPos}px`,
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                    overflow: 'visible',
                    pointerEvents: 'none',
                    zIndex: isDead ? 0 : (isMonster ? 200 : 100),
                    transition: isTelep ? 'none' : '1s',
                    ...computeHitVars(unit, getHitAnimation),
                }}
            >
                {renderEffectIcons(unit)}
                <div
                    className="portrait-relative-container"
                    onMouseEnter={() => portraitHovered(unit.id)}
                    onMouseLeave={() => portraitHovered(null)}
                    onClick={() => monsterCombatPortraitClicked(unit.id)}
                    style={{ position: 'relative', pointerEvents: 'auto' }}
                >
                    <div
                        className={portraitClasses}
                        style={{
                            backgroundImage: unit.portrait ? `url(${unit.portrait})` : 'none',
                            filter: `${unit.portraitFilter || ''} sepia(${portraitHoveredId === unit.id ? '2' : '0'}) ${unit.frozen ? 'hue-rotate(165deg) saturate(1.35) brightness(1.08) contrast(1.05)' : ''}`,
                            zIndex: isMinion ? 2 : 1,
                            position: 'relative',
                            animation: (unit.wounded && !isDead) ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1))' : undefined,
                            animationFillMode: (unit.wounded && !isDead) ? 'forwards' : undefined
                        }}
                        onAnimationEnd={e => {
                            if (isDead && e.animationName && e.animationName.includes('meltDownDeath') && showDeathAnimation[unit.id]) {
                                setFullyDead(prev => ({ ...prev, [unit.id]: true }));
                                setShowDeathAnimation(prev => ({ ...prev, [unit.id]: false }));
                            }
                            if (e.animationName && e.animationName.includes('bifurcateShrink')) {
                                setFullyDead(prev => ({ ...prev, [unit.id]: true }));
                            }
                        }}
                    >
                        {SHOW_MONSTER_IDS ? unit.id : null}
                        {unit.wounded && <div className="hit-flash-overlay" />}
                    </div>
                    {fearCastingActive && !unit.isMinion && <div className="fear-cast-glow" />}
                    <div className={`portrait-overlay ${unit.frozen ? 'frozen' : ''}`} style={{ zIndex: 2, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                        {renderDamageIndicators(unit.id)}
                    </div>
                    {/* Target indicator */}
                    {(() => {
                        const target = unit.targetId ? combatManager?.getCombatant?.(unit.targetId) : null;
                        return target?.portrait && !isDead ? (
                            <div className="monster-target-indicator" style={{ zIndex: 10 }}>
                                <div className="monster-target-portrait" style={{ backgroundImage: `url(${target.portrait})` }} />
                            </div>
                        ) : null;
                    })()}
                    {/* Stolen item */}
                    {(() => {
                        const stolenImg = unit.stolenItemIcon ? (images[unit.stolenItemIcon] || unit.stolenItemIcon) : null;
                        return stolenImg && !isDead ? (
                            <div className="monster-stolen-item-indicator" style={{ zIndex: 10 }}>
                                <div className="monster-stolen-item-portrait" style={{ backgroundImage: `url(${stolenImg})` }} />
                            </div>
                        ) : null;
                    })()}
                </div>
                {animationOverlays[unit.id] && getAllOverlaysById(unit.id).map((overlay, i) => (
                    <Overlay key={i} animationType={overlay.type} data={{ ...overlay.data, dead: isDead }} />
                ))}
                <div className="indicators-wrapper">
                    <div className="monster-hp-bar hp-bar">
                        {!isDead && <div className="red-fill" style={{ width: `${(unit.hp / unit.stats?.hp) * 100}%` }} />}
                    </div>
                    {combatManager && combatManager.round !== undefined ? (
                        <div className="endurance-bar" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginTop: '2px', position: 'relative' }}>
                            {!isDead && <div className="white-fill" style={{ height: '100%', backgroundColor: '#ffffff', width: `${(unit.endurance / unit.maxEndurance) * 100}%` }} />}
                        </div>
                    ) : (
                        <>
                            <div className="monster-energy-bar energy-bar">
                                {!isDead && <div className="yellow-fill" style={{ width: `calc(${unit.energy}%)` }} />}
                            </div>
                            <div className="tempo-bar">
                                {!isDead && <div className="tempo-indicator" style={{ left: `calc(${unit.tempo}% - 4px)` }} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    };

    // ── Rift portal ──────────────────────────────────────────────────────────
    const renderRiftPortal = () => {
        const summoner = crew.find(f => f.type === 'summoner');
        if (!summoner) return null;
        const liveSummoner = combatManager.getCombatant(summoner.id);
        if (!liveSummoner?.riftPortalActive || !liveSummoner?.riftPortalPos) return null;
        const { x, y } = liveSummoner.riftPortalPos;
        const portalLeft = tilePos(x);
        const portalTop = tilePos(y);
        const roundsLeft = liveSummoner.riftPortalRoundsLeft ?? 3;
        return (
            <div className="rift-portal-tile" style={{ position: 'absolute', left: portalLeft + 'px', top: portalTop + 'px', width: TILE_SIZE + 'px', height: TILE_SIZE + 'px', zIndex: 350, pointerEvents: 'none' }}>
                <div className="rift-portal-inner">
                    <div className="rift-portal-rounds">{roundsLeft}</div>
                </div>
            </div>
        );
    };

    // ── VCT units — damage indicators only, no portrait ──────────────────────
    const vctUnits = Object.values(battleData).filter(u => u && u.isVCT);

    // ── Monster units — exclude VCT ───────────────────────────────────────────
    const monsterUnits = Object.values(battleData).filter(u => u && (u.isMonster || u.isMinion) && !crewIds.has(u.id) && !u.isVCT);

    // ── Main render ───────────────────────────────────────────────────────────
    return (
        <div className="combat-units-layer" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
            {/* Fighters */}
            {activeCrew.map(renderFighter)}
            {renderRiftPortal()}

            {/* VCT damage indicators only */}
            {vctUnits.map(vct => {
                if (!vct.coordinates) return null;
                return (
                    <div key={vct.id} className="vct-unit-tile" style={{
                        position: 'absolute',
                        left: `${tilePos(vct.coordinates.x)}px`,
                        top: `${tilePos(vct.coordinates.y)}px`,
                        width: `${TILE_SIZE}px`,
                        height: `${TILE_SIZE}px`,
                        overflow: 'visible',
                        zIndex: 300,
                        pointerEvents: 'none',
                    }}>
                        <div className="portrait-overlay" style={{ zIndex: 301, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                            {renderDamageIndicators(vct.id)}
                        </div>
                    </div>
                );
            })}

            {/* Monsters + Minions */}
            {monsterUnits.map(renderMonsterUnit)}
        </div>
    );
}
