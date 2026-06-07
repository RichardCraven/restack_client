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

const getRadialLineCoordsFromPct = (pct) => {
    const ratio = pct / 100;
    const angle = (1 - ratio) * 360;
    const rad = angle * (Math.PI / 180);
    return {
        x2: 10 + 10 * Math.cos(rad),
        y2: 10 + 10 * Math.sin(rad)
    };
};

const getActiveEffects = (combatant, combatManager) => {
    const list = [];
    if (!combatant) return list;
    const liveUnit = combatManager?.getCombatant?.(combatant.id) || combatant;

    // Helper to extract debuff rounds
    const getDebuffRounds = (name) => {
        if (Array.isArray(liveUnit.activeDebuffs)) {
            const match = liveUnit.activeDebuffs.find(d => d && d.name === name);
            return match ? match.roundsLeft || 0 : 0;
        }
        return 0;
    };

    const getBuffRounds = (name) => {
        if (Array.isArray(liveUnit.activeBuffs)) {
            const match = liveUnit.activeBuffs.find(b => b && b.name === name);
            return match ? match.roundsLeft || 0 : 0;
        }
        return 0;
    };

    if (liveUnit.frozen) {
        const frozenRounds = liveUnit.frozenRounds || 0;
        const frozenStackDuration = liveUnit.frozenStackDuration || frozenRounds || 1;
        list.push({
            key: 'frozen',
            icon: images.frozen,
            border: '#00bfff',
            roundsLeft: frozenRounds,
            totalDuration: liveUnit.frozenTotalRounds || frozenRounds || frozenStackDuration,
            stackDuration: frozenStackDuration,
            stacks: Math.ceil(frozenRounds / frozenStackDuration)
        });
    }
    if (liveUnit.stunned) {
        list.push({
            key: 'stunned',
            icon: images.whiteskull || images.induce_fear,
            border: '#f5c842',
            roundsLeft: liveUnit.stunnedRounds || 0,
            totalDuration: liveUnit.stunnedTotalRounds || liveUnit.stunnedRounds || 4
        });
    }
    if (liveUnit.asleep) {
        list.push({
            key: 'sleep',
            icon: images.wizard_sleep,
            border: '#90caf9',
            roundsLeft: liveUnit.sleepRounds || liveUnit.stunnedRounds || 0,
            totalDuration: liveUnit.sleepTotalRounds || liveUnit.stunnedTotalRounds || liveUnit.sleepRounds || liveUnit.stunnedRounds || 4
        });
    }
    if (liveUnit.feared) {
        list.push({
            key: 'fear',
            icon: images.induce_fear,
            border: '#8e2de2',
            roundsLeft: liveUnit.fearRounds || liveUnit.stunnedRounds || 0,
            totalDuration: liveUnit.fearTotalRounds || liveUnit.stunnedTotalRounds || liveUnit.fearRounds || liveUnit.stunnedRounds || 4
        });
    }
    if (liveUnit.bleed) {
        const bleedDebuff = Array.isArray(liveUnit.activeDebuffs) ? liveUnit.activeDebuffs.find(d => d && d.name === 'bleed') : null;
        list.push({
            key: 'bleed',
            icon: images.bleeding,
            border: '#e05555',
            roundsLeft: bleedDebuff?.roundsLeft || getDebuffRounds('bleed'),
            totalDuration: bleedDebuff?.totalRounds || bleedDebuff?.roundsLeft || 4
        });
    }
    if (liveUnit.poison) {
        const poisonDebuff = Array.isArray(liveUnit.activeDebuffs) ? liveUnit.activeDebuffs.find(d => d && d.name === 'poison') : null;
        const poisonRounds = poisonDebuff?.roundsLeft || getDebuffRounds('poison');
        const poisonSingleDuration = poisonDebuff?.singleDurationRounds || poisonRounds || 1;
        list.push({
            key: 'poison',
            icon: images.poison,
            border: '#7affa0',
            roundsLeft: poisonRounds,
            totalDuration: poisonDebuff?.totalRounds || poisonRounds || poisonSingleDuration,
            stackDuration: poisonSingleDuration,
            stacks: Math.ceil(poisonRounds / poisonSingleDuration),
            segmented: true
        });
    }
    if (liveUnit.shieldWallActive) {
        list.push({
            key: 'shield_wall',
            icon: images.shield_wall,
            border: '#90c4ff',
            roundsLeft: liveUnit.shieldWallRoundsLeft || liveUnit.shieldWallRounds || 0,
            totalDuration: liveUnit.shieldWallTotalRounds || liveUnit.shieldWallRoundsLeft || liveUnit.shieldWallRounds || 4
        });
    }
    if (liveUnit.defensiveStanceActive || liveUnit.defensiveStance) {
        list.push({
            key: 'defensive_stance',
            icon: images.soldier_defensive_stance,
            border: '#cccccc',
            roundsLeft: liveUnit.defensiveStanceRoundsLeft || liveUnit.defensiveStanceRounds || 0,
            totalDuration: liveUnit.defensiveStanceTotalRounds || liveUnit.defensiveStanceRoundsLeft || liveUnit.defensiveStanceRounds || 4
        });
    }
    if (liveUnit.berserkerActive) {
        const berserkerBuff = Array.isArray(liveUnit.activeBuffs) ? liveUnit.activeBuffs.find(b => b && (b.name === 'barbarian_berserker' || b.name === 'berserker')) : null;
        list.push({
            key: 'berserker',
            icon: images.barbarian_berserker,
            border: '#ff4444',
            roundsLeft: liveUnit.berserkerRoundsLeft || liveUnit.berserkerRounds || berserkerBuff?.roundsLeft || getBuffRounds('barbarian_berserker') || getBuffRounds('berserker') || 0,
            totalDuration: berserkerBuff?.totalRounds || liveUnit.berserkerTotalRounds || liveUnit.berserkerRoundsLeft || liveUnit.berserkerRounds || 4
        });
    }
    if (liveUnit.weaknessRevealed) {
        const weaknessRounds = liveUnit.weaknessRevealedRounds || liveUnit.weaknessRounds || 0;
        const weaknessSingleDuration = liveUnit.weaknessRevealedStackDuration || weaknessRounds || 1;
        list.push({
            key: 'weakness',
            icon: images.weakness_doubled,
            border: '#cc44ff',
            roundsLeft: weaknessRounds,
            totalDuration: liveUnit.weaknessRevealedTotalRounds || weaknessRounds || weaknessSingleDuration,
            stackDuration: weaknessSingleDuration,
            stacks: Math.max(1, Math.ceil(weaknessRounds / weaknessSingleDuration)),
            segmented: true,
            alwaysShowBadge: true,
            badgeBackground: '#000',
            badgeBorder: '#ff007f'
        });
    }
    if (liveUnit.marked) {
        list.push({
            key: 'marked',
            icon: images.ranger_mark,
            border: '#ffaa00',
            roundsLeft: liveUnit.markedRounds || 0,
            totalDuration: liveUnit.markedTotalRounds || liveUnit.markedRounds || 4
        });
    }
    if (liveUnit.ensnared) {
        list.push({
            key: 'ensnared',
            icon: images.ranger_ensnare,
            border: '#00ff00',
            roundsLeft: liveUnit.ensnaredRounds || 0,
            totalDuration: liveUnit.ensnaredTotalRounds || liveUnit.ensnaredRounds || 3
        });
    }
    if (liveUnit.astralBeingActive) {
        list.push({
            key: 'astral_being',
            icon: images.monk_astral_being,
            border: '#21e6c1',
            roundsLeft: liveUnit.astralBeingRoundsLeft || liveUnit.astralBeingRounds || 0,
            totalDuration: liveUnit.astralBeingTotalRounds || liveUnit.astralBeingRoundsLeft || liveUnit.astralBeingRounds || 6
        });
    }
    if (liveUnit.etherealSpeedActive) {
        list.push({
            key: 'ethereal_speed',
            icon: images.monk_ethereal_speed,
            border: '#ffdd57',
            roundsLeft: liveUnit.etherealSpeedRoundsLeft || 0,
            totalDuration: liveUnit.etherealSpeedTotalRounds || liveUnit.etherealSpeedRoundsLeft || 4
        });
    }
    if (liveUnit.thirdEyeActive) {
        list.push({
            key: 'third_eye',
            icon: images.monk_third_eye,
            border: '#21e6c1',
            roundsLeft: liveUnit.thirdEyeRoundsLeft || liveUnit.thirdEyeRounds || 0,
            totalDuration: liveUnit.thirdEyeTotalRounds || liveUnit.thirdEyeRoundsLeft || liveUnit.thirdEyeRounds || 4
        });
    }

    return list.filter((eff, index, arr) => arr.findIndex(candidate => candidate.key === eff.key) === index);
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
        // Sandbox-style CSS animation events from AnimationManagerRedux
        activeAnimations = [],
    } = props;

    // ── Death animation state ─────────────────────────────────────────────────
    const [showDeathAnimation, setShowDeathAnimation] = React.useState({});
    const [fullyDead, setFullyDead] = React.useState({});
    const deathTimeoutsRef = React.useRef({});
    const consumableTimeoutsRef = React.useRef({});

    React.useEffect(() => {
        const allUnits = Object.values(battleData);
        allUnits.forEach(unit => {
            if (!unit) return;
            if (unit.dead && !showDeathAnimation[unit.id] && !fullyDead[unit.id]) {
                setShowDeathAnimation(prev => ({ ...prev, [unit.id]: true }));
                const id = unit.id;
                if (deathTimeoutsRef.current[id]) {
                    clearTimeout(deathTimeoutsRef.current[id]);
                }
                const t = setTimeout(() => {
                    setFullyDead(prev => { if (!prev[id]) return { ...prev, [id]: true }; return prev; });
                    setShowDeathAnimation(prev => ({ ...prev, [id]: false }));
                    delete deathTimeoutsRef.current[id];
                }, 2400);
                deathTimeoutsRef.current[id] = t;
            } else if (!unit.dead && (showDeathAnimation[unit.id] || fullyDead[unit.id])) {
                if (deathTimeoutsRef.current[unit.id]) {
                    clearTimeout(deathTimeoutsRef.current[unit.id]);
                    delete deathTimeoutsRef.current[unit.id];
                }
                setShowDeathAnimation(prev => ({ ...prev, [unit.id]: false }));
                setFullyDead(prev => ({ ...prev, [unit.id]: false }));
            }
        });
        return () => {
            Object.values(deathTimeoutsRef.current).forEach(clearTimeout);
            deathTimeoutsRef.current = {};
        };
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
                if (consumableTimeoutsRef.current[fighter.id]) {
                    clearTimeout(consumableTimeoutsRef.current[fighter.id]);
                }
                consumableTimeoutsRef.current[fighter.id] = setTimeout(() => {
                    setConsumableFlashes(prev => ({ ...prev, [fighter.id]: null }));
                    delete consumableTimeoutsRef.current[fighter.id];
                }, 1500);
            }
        });
        return () => {
            Object.values(consumableTimeoutsRef.current).forEach(clearTimeout);
            consumableTimeoutsRef.current = {};
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [battleData, crew]);

    const isTeleporting = (id) => teleportingFighterId === id;

    // ── Build unit collections ───────────────────────────────────────────────
    const crewIds = new Set(crew.map(f => f.id));

    // ── Shared: effect icon row ───────────────────────────────────────────────
    const renderEffectIcons = (unit) => (
        <div style={{ position: 'absolute', top: '-6px', right: '-6px', display: 'flex', gap: '2px', zIndex: 350, pointerEvents: 'none' }}>
            {getActiveEffects(unit, combatManager).map((eff) => {
                const roundsLeft = eff.roundsLeft || 0;
                const total = eff.totalDuration || 4;
                const roundDurationMs = combatManager?.roundDurationMs || (combatManager?.gameSpeed === 'fast' ? 1000 : 2000);
                const roundProgress = (combatManager?.roundTimeElapsedMs || 0) / roundDurationMs;
                const preciseRoundsLeft = roundsLeft > 0 ? Math.max(0, roundsLeft - roundProgress) : 0;
                const segmentedDuration = eff.stackDuration || 0;
                const segmentedRoundsLeft = eff.segmented && segmentedDuration > 0
                    ? (() => {
                        const modulo = preciseRoundsLeft % segmentedDuration;
                        return modulo === 0 && preciseRoundsLeft > 0 ? segmentedDuration : modulo;
                    })()
                    : preciseRoundsLeft;
                const pctBase = eff.segmented && segmentedDuration > 0 ? segmentedDuration : total;
                const pct = pctBase > 0 ? Math.min(100, Math.max(0, (segmentedRoundsLeft / pctBase) * 100)) : 0;
                // Radial cooldown sweep math: radius=5, circumference=31.42
                const dashOffset = (pct / 100) * 31.42;
                const coords = getRadialLineCoordsFromPct(pct);
                const showBadge = eff.alwaysShowBadge ? (eff.stacks || 0) > 0 : (eff.stacks || 0) > 1;

                return (
                    <div key={eff.key} className="effect-icon-active" style={{
                        width: '20px', height: '20px', borderRadius: '50%',
                        backgroundColor: '#111', border: `2px solid ${eff.border}`,
                        backgroundImage: `url(${eff.icon})`, backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        position: 'relative',
                        overflow: 'visible'
                    }}>
                        {roundsLeft > 0 && (
                            <svg 
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    transform: 'rotate(-90deg)',
                                    pointerEvents: 'none',
                                    zIndex: 10
                                }}
                                viewBox="0 0 20 20"
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="5"
                                    fill="none"
                                    stroke="rgba(0, 0, 0, 0.4)"
                                    strokeWidth="10"
                                    strokeDasharray="31.42"
                                    strokeDashoffset={dashOffset}
                                />
                                {coords && (
                                    <line
                                        x1="10"
                                        y1="10"
                                        x2={coords.x2}
                                        y2={coords.y2}
                                        stroke="#ffffff"
                                        strokeWidth="0.8"
                                    />
                                )}
                            </svg>
                        )}
                        {showBadge && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '-8px',
                                background: eff.badgeBackground || eff.border,
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: 'bold',
                                borderRadius: '50%',
                                width: '12px',
                                height: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: `1px solid ${eff.badgeBorder || '#111'}`,
                                zIndex: 11
                            }}>
                                {eff.stacks}
                            </div>
                        )}
                    </div>
                );
            })}
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
        const activeLeapAnim = activeAnimations.find((anim) => {
            if (anim.type !== 'leap_attack_jump') return false;
            if (anim.sourceUnitId) return anim.sourceUnitId === fighter.id;
            if (!anim.srcPx) return false;
            return Math.abs(anim.srcPx.x - (xPos + TILE_SIZE / 2)) < 1 && Math.abs(anim.srcPx.y - (yPos + TILE_SIZE / 2)) < 1;
        });

        // All visual-state classes go on the unit-tile (100×100) — no full-width ancestors
        const isDisintegrating = activeAnimations.some(a => a.type === 'disintegrate_beam' && a.tgtPx && Math.abs(a.tgtPx.x - xPos - TILE_SIZE/2) < 5 && Math.abs(a.tgtPx.y - yPos - TILE_SIZE/2) < 5);
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
            isDisintegrating ? 'disintegrate-shaking' : '',
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
                <div
                    className="portrait-relative-container"
                    style={{
                        position: 'relative',
                        pointerEvents: 'auto',
                        overflow: 'visible',
                        animation: activeLeapAnim ? 'barbarianLeapTravel 1.65s ease-in-out' : undefined,
                        '--leap-dx': activeLeapAnim ? `${activeLeapAnim.dx}px` : '0px',
                        '--leap-dy': activeLeapAnim ? `${activeLeapAnim.dy}px` : '0px',
                        transformOrigin: '50% 50%',
                        zIndex: activeLeapAnim ? 4500 : undefined,
                    }}
                >
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
                            animation: (details?.stunned && !details?.dead)
                                ? 'stunWobble 0.6s ease-in-out infinite'
                                : ((details?.wounded && !details?.dead)
                                    ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1)) forwards'
                                    : undefined),
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
                    {(() => {
                        const liveUnit = combatManager.getCombatant(fighter.id) || fighter;
                        const getDebuffRounds = (name) => {
                            if (Array.isArray(liveUnit.activeDebuffs)) {
                                const match = liveUnit.activeDebuffs.find(d => d && d.name && d.name.toLowerCase() === name.toLowerCase());
                                return match ? match.roundsLeft || 0 : 0;
                            }
                            return 0;
                        };
                        const isAsleep = getDebuffRounds('sleep') > 0 || getDebuffRounds('sleep_spell') > 0;
                        if (isAsleep && !details?.dead) {
                            return (
                                <>
                                    <div style={{ position: 'absolute', right: '15%', top: '20%', color: '#90caf9', fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                    <div style={{ position: 'absolute', right: '35%', top: '30%', color: '#90caf9', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 0.6s', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                    <div style={{ position: 'absolute', right: '22%', top: '42%', color: '#42a5f5', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 1.2s', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                </>
                            );
                        }
                        return null;
                    })()}
                    {fighter.type === 'monk' && combatManager.getCombatant(fighter.id)?.etherealSpeedActive && (
                        <div style={{
                            position: 'absolute',
                            top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                            zIndex: 290,
                            border: '3px solid rgba(255, 221, 87, 0.95)',
                            boxShadow: '0 0 25px 8px #ffdd57, inset 0 0 12px 4px #ffdd57',
                            background: 'rgba(255, 221, 87, 0.15)',
                            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                            animation: 'organicGlow 4s linear infinite',
                            pointerEvents: 'none'
                        }} />
                    )}
                    <div className="indicators-wrapper" style={{ zIndex: 310, position: 'absolute', bottom: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
                        <div className="hp-bar">
                            {!getFighterDetails(fighter)?.dead && (
                                <div className="red-fill" style={{ width: `${(getFighterDetails(fighter)?.hp / fighter.stats.hp) * 100}%` }} />
                            )}
                        </div>
                        {combatManager && combatManager.round !== undefined ? (
                            <div className="endurance-bar" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginTop: '2px', position: 'relative' }}>
                                {!getFighterDetails(fighter)?.dead && (
                                    <div className="white-fill" style={{ height: '100%', backgroundColor: '#ffffff', width: `${(getFighterDetails(fighter)?.endurance / getFighterDetails(fighter)?.maxEndurance) * 100}%` }} />
                                )}
                            </div>
                        ) : null}
                    </div>
                    {details?.stunned && !details?.dead && (
                        <div style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60px',
                            height: '20px',
                            pointerEvents: 'none',
                            zIndex: 350,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Tilted Ellipse Ring */}
                            <div style={{
                                position: 'absolute',
                                width: '50px',
                                height: '12px',
                                borderRadius: '50%',
                                border: '1.2px dashed rgba(255, 221, 87, 0.45)',
                                boxShadow: '0 0 4px rgba(255, 221, 87, 0.15)',
                                pointerEvents: 'none'
                            }} />
                            {/* Orbiting Star 1 */}
                            <div style={{
                                position: 'absolute',
                                fontSize: '12px',
                                color: '#ffe600',
                                textShadow: '0 0 5px #ffe600',
                                animation: 'birdieOrbit1 1.6s linear infinite',
                                fontWeight: 'bold',
                                userSelect: 'none'
                            }}>
                                ✦
                            </div>
                            {/* Orbiting Star 2 */}
                            <div style={{
                                position: 'absolute',
                                fontSize: '12px',
                                color: '#ffdd57',
                                textShadow: '0 0 5px #ffdd57',
                                animation: 'birdieOrbit2 1.6s linear infinite',
                                fontWeight: 'bold',
                                userSelect: 'none'
                            }}>
                                ✦
                            </div>
                        </div>
                    )}
                </div>
                {animationOverlays[fighter.id] && getAllOverlaysById(fighter.id).map((overlay, i) => (
                    <Overlay key={i} animationType={overlay.type} data={{ ...overlay.data, dead: details?.dead }} />
                ))}
                <div className={`portrait-overlay${details?.drained ? ' drained' : ''}${details?.frozen ? ' frozen' : ''}`} style={{ overflow: 'visible' }}>
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
                {/* Attack Weapon Swing Animation (par parity with Sandbox / fighters.js) */}
                {details && details.pendingAttack && details.attacking && !details.dead && (() => {
                    const isMonk = fighter.type === 'monk';
                    const isBarbarian = fighter.type === 'barbarian';
                    
                    let icon = details.pendingAttack.icon;
                    if (isMonk) {
                        const isBasicPunch = details.pendingAttack.range === 'close' && details.pendingAttack.name !== 'dragon punch';
                        icon = isBasicPunch ? images['fist_punch'] : (details.pendingAttack.icon || images['fist_punch']);
                    } else {
                        const equippedWeapon = (fighter.inventory || []).find(i => i && i.type === 'weapon' && (i.equippedSlot === 'right' || i.equippedSlot === 'left' || i.equippedBy === fighter.id));
                        if (equippedWeapon) {
                            icon = images[equippedWeapon.icon] || equippedWeapon.icon || images[equippedWeapon.id] || equippedWeapon.image || images[equippedWeapon.name] || details.pendingAttack.icon;
                        }
                        if (!icon) {
                            icon = isBarbarian ? (images['axe'] || details.pendingAttack.icon) : (images['shortsword'] || images['sword'] || details.pendingAttack.icon);
                        }
                    }

                    const tileW = 100;
                    const weaponW = 90;
                    let weaponStyle = {};
                    if (details.facing === 'right') {
                        weaponStyle = { left: `${tileW - weaponW}px`, opacity: 1, backgroundImage: `url(${icon})` };
                    } else if (details.facing === 'left') {
                        weaponStyle = { left: '0px', opacity: 1, backgroundImage: `url(${icon})` };
                    } else if (details.facing === 'up') {
                        weaponStyle = { left: `${(tileW / 2) - (weaponW / 2)}px`, top: '-40px', opacity: 1, backgroundImage: `url(${icon})`, transform: 'rotate(-90deg)' };
                    } else if (details.facing === 'down') {
                        weaponStyle = { left: `${(tileW / 2) - (weaponW / 2)}px`, top: '110px', opacity: 1, backgroundImage: `url(${icon})`, transform: 'rotate(90deg)' };
                    } else {
                        weaponStyle = { left: `${(tileW / 2) - (weaponW / 2)}px`, top: '50px', opacity: 1, backgroundImage: `url(${icon})` };
                    }

                    const verticalFacingClass = details.facing === 'up' ? 'facing-up' : (details.facing === 'down' ? 'facing-down' : '');

                    return (
                        <div
                            className={`weapon-wrapper ${details.facing === 'left' ? 'reversed' : ''} ${verticalFacingClass} ${details.aiming ? 'aiming' : ''} medium`}
                            style={weaponStyle}
                        />
                    );
                })()}
                {(() => {
                    const hasPerceiveActive = details && activeAnimations.some(anim => anim.type === 'perceive_anim' && Math.floor(anim.srcPx.x / 102) === details.coordinates.x && Math.floor(anim.srcPx.y / 102) === details.coordinates.y);
                    const hasEnergyDrainActive = details && activeAnimations.some(anim => anim.type === 'energy_drain_beam' && Math.floor(anim.tgtPx.x / 102) === details.coordinates.x && Math.floor(anim.tgtPx.y / 102) === details.coordinates.y);
                    const hasCrimsonSightActive = details && activeAnimations.some(anim => anim.type === 'crimson_sight_anim' && Math.floor(anim.tgtPx.x / 102) === details.coordinates.x && Math.floor(anim.tgtPx.y / 102) === details.coordinates.y);

                    return (
                        <>
                            {hasPerceiveActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    border: '2px solid #ff007f',
                                    backgroundImage: `url(${images.perceive})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 0 10px #ff007f',
                                    zIndex: 320,
                                    animation: 'hoverFloat 2s ease-in-out forwards'
                                }} />
                            )}
                            {hasEnergyDrainActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    border: '2px solid #ff00ff',
                                    backgroundImage: `url(${images.energy_drain})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 0 10px #ff00ff',
                                    zIndex: 320,
                                    animation: 'hoverFloat 1.5s ease-in-out forwards'
                                }} />
                            )}
                            {hasCrimsonSightActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-21px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '42px',
                                    height: '42px',
                                    backgroundImage: `url(${images.heartbeat})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    zIndex: 320,
                                    animation: 'heartbeatPulse 0.9s infinite ease-in-out'
                                }} />
                            )}
                        </>
                    );
                })()}
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

        const isLarge = isMonster && !isMinion;
        const width = isLarge ? TILE_SIZE * 2 + (SHOW_TILE_BORDERS ? 2 : 0) : TILE_SIZE;
        const height = isLarge ? TILE_SIZE * 2 + (SHOW_TILE_BORDERS ? 2 : 0) : TILE_SIZE;

        // Large monsters position is anchor at bottom-right or bottom-left depending on side.
        // If x >= 4, anchor col is the right col of the 2x2. Left should be shifted left by TILE_SIZE.
        // Since anchor row y is the bottom row of the 2x2, top should be shifted up by TILE_SIZE.
        const hOffset = (isLarge && unit.coordinates.x >= 4) ? -TILE_SIZE - (SHOW_TILE_BORDERS ? 2 : 0) : 0;
        const vOffset = isLarge ? -TILE_SIZE - (SHOW_TILE_BORDERS ? 2 : 0) : 0;

        const leftPos = xPos + hOffset;
        const topPos = yPos + vOffset;

        const isDisintegrating = activeAnimations.some(a => a.type === 'disintegrate_beam' && a.tgtPx && Math.abs(a.tgtPx.x - (leftPos + width/2)) < 15 && Math.abs(a.tgtPx.y - (topPos + height/2)) < 15);
        // All state classes go on unit-tile — not on any full-width wrapper
        const unitTileClasses = [
            'unit-tile',
            isMinion ? 'minion-unit-tile' : 'monster-unit-tile',
            isLarge ? 'large-monster-unit-tile' : '',
            unit.rocked ? 'rocked' : '',
            unit.wounded ? 'hit' : '',
            unit.wounded ? hitAnim : '',
            unit.wounded ? 'hit-flash' : '',
            unit.facing === 'right' ? 'reversed' : '',
            unit.stunned ? 'stunned' : '',
            isDisintegrating ? 'disintegrate-shaking' : '',
        ].filter(Boolean).join(' ');

        const portraitClasses = [
            'portrait',
            isMinion ? 'minion-portrait' : 'monster-portrait',
            isLarge ? 'large-portrait' : '',
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
                    left: `${leftPos}px`,
                    top: `${topPos}px`,
                    width: `${width}px`,
                    height: `${height}px`,
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
                    style={{
                        position: 'relative',
                        pointerEvents: 'auto',
                        width: '100%',
                        height: '100%',
                        borderRadius: '8px',
                        overflow: 'visible',
                    }}
                >
                    <div
                        className={portraitClasses}
                        style={{
                            backgroundImage: unit.portrait ? `url(${unit.portrait})` : 'none',
                            filter: `${unit.portraitFilter || ''} sepia(${portraitHoveredId === unit.id ? '2' : '0'}) ${unit.frozen ? 'hue-rotate(165deg) saturate(1.35) brightness(1.08) contrast(1.05)' : ''}`,
                            zIndex: isMinion ? 2 : 1,
                            position: 'relative',
                            width: '100%',
                            height: '100%',
                            transform: 'none', // skip CSS transform scale(2)
                            borderRadius: '0',
                            animation: (unit.stunned && !isDead)
                                ? 'stunWobble 0.6s ease-in-out infinite'
                                : ((unit.wounded && !isDead)
                                    ? 'BulgePortrait var(--portrait-animation-duration, 420ms) var(--portrait-animation-timing, cubic-bezier(.2,.8,.2,1)) forwards'
                                    : undefined)
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
                        {(() => {
                            const liveUnit = combatManager.getCombatant(unit.id) || unit;
                            const getDebuffRounds = (name) => {
                                if (Array.isArray(liveUnit.activeDebuffs)) {
                                    const match = liveUnit.activeDebuffs.find(d => d && d.name && d.name.toLowerCase() === name.toLowerCase());
                                    return match ? match.roundsLeft || 0 : 0;
                                }
                                return 0;
                            };
                            const isAsleep = getDebuffRounds('sleep') > 0 || getDebuffRounds('sleep_spell') > 0;
                            if (isAsleep && !isDead) {
                                return (
                                    <>
                                        <div style={{ position: 'absolute', right: '15%', top: '20%', color: '#90caf9', fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                        <div style={{ position: 'absolute', right: '35%', top: '30%', color: '#90caf9', fontSize: '14px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 0.6s', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                        <div style={{ position: 'absolute', right: '22%', top: '42%', color: '#42a5f5', fontSize: '11px', fontWeight: 'bold', fontFamily: 'monospace', animation: 'zzzFloat 2s infinite 1.2s', textShadow: '0 0 4px rgba(0,0,0,0.8)', zIndex: 320 }}>Z</div>
                                    </>
                                );
                            }
                            return null;
                        })()}
                    </div>
                    {unit.stunned && !isDead && (
                        <div style={{
                            position: 'absolute',
                            top: '-12px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60px',
                            height: '20px',
                            pointerEvents: 'none',
                            zIndex: 350,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {/* Tilted Ellipse Ring */}
                            <div style={{
                                position: 'absolute',
                                width: '50px',
                                height: '12px',
                                borderRadius: '50%',
                                border: '1.2px dashed rgba(255, 221, 87, 0.45)',
                                boxShadow: '0 0 4px rgba(255, 221, 87, 0.15)',
                                pointerEvents: 'none'
                            }} />
                            {/* Orbiting Star 1 */}
                            <div style={{
                                position: 'absolute',
                                fontSize: '12px',
                                color: '#ffe600',
                                textShadow: '0 0 5px #ffe600',
                                animation: 'birdieOrbit1 1.6s linear infinite',
                                fontWeight: 'bold',
                                userSelect: 'none'
                            }}>
                                ✦
                            </div>
                            {/* Orbiting Star 2 */}
                            <div style={{
                                position: 'absolute',
                                fontSize: '12px',
                                color: '#ffdd57',
                                textShadow: '0 0 5px #ffdd57',
                                animation: 'birdieOrbit2 1.6s linear infinite',
                                fontWeight: 'bold',
                                userSelect: 'none'
                            }}>
                                ✦
                            </div>
                        </div>
                    )}
                    {fearCastingActive && !unit.isMinion && <div className="fear-cast-glow" />}
                    <div className={`portrait-overlay ${unit.frozen ? 'frozen' : ''}`} style={{ zIndex: 2, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 0, overflow: 'visible' }}>
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
                {(() => {
                    const hasPerceiveActive = activeAnimations.some(anim => anim.type === 'perceive_anim' && Math.floor(anim.srcPx.x / 102) === unit.coordinates.x && Math.floor(anim.srcPx.y / 102) === unit.coordinates.y);
                    const hasEnergyDrainActive = activeAnimations.some(anim => anim.type === 'energy_drain_beam' && Math.floor(anim.tgtPx.x / 102) === unit.coordinates.x && Math.floor(anim.tgtPx.y / 102) === unit.coordinates.y);
                    const hasCrimsonSightActive = activeAnimations.some(anim => anim.type === 'crimson_sight_anim' && Math.floor(anim.tgtPx.x / 102) === unit.coordinates.x && Math.floor(anim.tgtPx.y / 102) === unit.coordinates.y);

                    return (
                        <>
                            {hasPerceiveActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    border: '2px solid #ff007f',
                                    backgroundImage: `url(${images.perceive})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 0 10px #ff007f',
                                    zIndex: 320,
                                    animation: 'hoverFloat 2s ease-in-out forwards'
                                }} />
                            )}
                            {hasEnergyDrainActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-14px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '4px',
                                    border: '2px solid #ff00ff',
                                    backgroundImage: `url(${images.energy_drain})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    boxShadow: '0 0 10px #ff00ff',
                                    zIndex: 320,
                                    animation: 'hoverFloat 1.5s ease-in-out forwards'
                                }} />
                            )}
                            {hasCrimsonSightActive && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-21px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '42px',
                                    height: '42px',
                                    backgroundImage: `url(${images.heartbeat})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    zIndex: 320,
                                    animation: 'heartbeatPulse 0.9s infinite ease-in-out'
                                }} />
                            )}
                        </>
                    );
                })()}
                <div className="indicators-wrapper" style={{ zIndex: 10 }}>
                    <div className="monster-hp-bar hp-bar">
                        {!isDead && <div className="red-fill" style={{ width: `${(unit.hp / unit.stats?.hp) * 100}%` }} />}
                    </div>
                    {combatManager && combatManager.round !== undefined ? (
                        <div className="endurance-bar" style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginTop: '2px', position: 'relative' }}>
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

    // ── Sandbox-style CSS animation overlay ───────────────────────────────────
    const renderAnimation = (anim) => {
        if (!anim) return null;
        const key = anim.id;

        if (anim.type === 'claw_swipe' && anim.midPx && anim.icon) {
            // Rotated claw image placed between attacker and target
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.midPx.x}px`,
                    top: `${anim.midPx.y}px`,
                    width: '60px',
                    height: '60px',
                    transform: `translate(-50%, -50%) rotate(${anim.angle}deg)`,
                    pointerEvents: 'none',
                    zIndex: 5000,
                }}>
                    <img
                        src={anim.icon}
                        alt="claw swipe"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transformOrigin: '80px 30px',
                            animation: 'leftFacingClawArc 0.75s ease-in-out forwards'
                        }}
                    />
                </div>
            );
        }

        if (anim.type === 'claw_hit' && anim.tgtPx && anim.icon) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x - 40}px`,
                    top: `${anim.tgtPx.y - 40}px`,
                    width: '80px',
                    height: '80px',
                    backgroundImage: `url(${anim.icon})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    pointerEvents: 'none',
                    zIndex: 5000,
                    animation: 'fadeInOut 0.4s ease-in-out forwards',
                }} />
            );
        }

        if (anim.type === 'energy_drain_beam' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: `${anim.length}px`,
                    height: '8px',
                    background: 'linear-gradient(to right, rgba(255, 105, 180, 0.1), #ff69b4, #fff, #ff69b4, rgba(255, 105, 180, 0.1))',
                    boxShadow: '0 0 10px #ff69b4, 0 0 20px #ff1493',
                    transformOrigin: '0 50%',
                    transform: `rotate(${anim.angle}deg) translateY(-50%)`,
                    zIndex: 4000,
                    pointerEvents: 'none',
                    filter: 'blur(1.5px)',
                    animation: 'pinkBeamPulse 1.5s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'induce_fear_overlay') {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '380px',
                    height: '380px',
                    backgroundImage: anim.icon ? `url(${anim.icon})` : `url(${images.induce_fear})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    opacity: 0.5,
                    pointerEvents: 'none',
                    zIndex: 3500,
                    maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 70%)',
                    WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 70%)',
                    animation: 'fearOverlayPulse 1.5s ease-in-out forwards',
                }} />
            );
        }

        if (anim.type === 'fireball_projectile' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #fff 0%, #ff6600 40%, #ff2200 70%, transparent 100%)',
                    boxShadow: '0 0 16px #ff4400, 0 0 32px #ff2200',
                    transform: `translate(-50%, -50%)`,
                    transformOrigin: 'center',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: `fireballTravel 1s cubic-bezier(0.25,0.46,0.45,0.94) forwards`,
                    '--fb-dx': `${anim.tgtPx.x - anim.srcPx.x}px`,
                    '--fb-dy': `${anim.tgtPx.y - anim.srcPx.y}px`,
                }} />
            );
        }

        if (anim.type === 'explosion' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x - 50}px`,
                    top: `${anim.tgtPx.y - 50}px`,
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #fff 0%, #ffaa00 30%, #ff4400 60%, transparent 100%)',
                    boxShadow: '0 0 30px #ff6600, 0 0 60px #ff2200',
                    pointerEvents: 'none',
                    zIndex: 4500,
                    animation: 'explosionPop 0.6s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'magic_missile_projectile' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #fff 0%, #9b59b6 60%, transparent 100%)',
                    boxShadow: '0 0 8px #9b59b6, 0 0 16px #6c3483',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'fireballTravel 0.8s ease-in forwards',
                    '--fb-dx': `${anim.tgtPx.x - anim.srcPx.x}px`,
                    '--fb-dy': `${anim.tgtPx.y - anim.srcPx.y}px`,
                }} />
            );
        }

        if (anim.type === 'ice_projectile' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #fff 0%, #00bfff 50%, #0080ff 100%)',
                    boxShadow: '0 0 12px #00bfff, 0 0 24px #0080ff',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'fireballTravel 0.7s ease-in forwards',
                    '--fb-dx': `${anim.tgtPx.x - anim.srcPx.x}px`,
                    '--fb-dy': `${anim.tgtPx.y - anim.srcPx.y}px`,
                }} />
            );
        }

        if (anim.type === 'ice_burst' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x}px`,
                    top: `${anim.tgtPx.y}px`,
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #e0f7fa 20%, #80deea 70%, transparent 100%)',
                    boxShadow: '0 0 20px #80deea',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4100,
                    animation: 'explode 0.3s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'acid_projectile' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #d8f3dc 0%, #70e000 50%, #38b000 100%)',
                    boxShadow: '0 0 12px #70e000, 0 0 24px #38b000',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'fireballTravel 0.7s ease-in forwards',
                    '--fb-dx': `${anim.tgtPx.x - anim.srcPx.x}px`,
                    '--fb-dy': `${anim.tgtPx.y - anim.srcPx.y}px`,
                }} />
            );
        }

        if (anim.type === 'poison_burst' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x}px`,
                    top: `${anim.tgtPx.y}px`,
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #70e000 20%, #38b000 70%, transparent 100%)',
                    boxShadow: '0 0 25px #38b000',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4100,
                    animation: 'explode 0.3s ease-out forwards',
                }} />
            );
        }
        if (anim.type === 'generic_projectile' && anim.srcPx && anim.tgtPx) {
            let projectileImage = images.barbarian_axe_throw || images.axe_throw || images.axe || '';
            if (anim.subtype === 'spear_throw') {
                projectileImage = images.spear || '';
            }
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: '32px',
                    height: '32px',
                    backgroundImage: projectileImage ? `url(${projectileImage})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'fireballTravel 0.7s linear forwards, spinAxis 0.7s linear infinite',
                    '--fb-dx': `${anim.tgtPx.x - anim.srcPx.x}px`,
                    '--fb-dy': `${anim.tgtPx.y - anim.srcPx.y}px`,
                }} />
            );
        }


        if (anim.type === 'sword_slash' && anim.srcPx && anim.tgtPx) {
            const dx = anim.tgtPx.x - anim.srcPx.x;
            const dy = anim.tgtPx.y - anim.srcPx.y;
            const midX = anim.srcPx.x + dx * 0.5;
            const midY = anim.srcPx.y + dy * 0.5;
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${midX}px`,
                    top: `${midY}px`,
                    width: '70px',
                    height: '6px',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.9), transparent)',
                    boxShadow: '0 0 8px rgba(255,255,255,0.8)',
                    transform: `translate(-50%, -50%) rotate(${anim.angle}deg)`,
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'beamShrink 0.6s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'heal_glow' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x - 40}px`,
                    top: `${anim.tgtPx.y - 40}px`,
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(100,255,150,0.6) 0%, rgba(0,200,100,0.1) 70%, transparent 100%)',
                    boxShadow: '0 0 20px rgba(100,255,150,0.5)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'healGlowPop 0.8s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'annihilation_beam' && anim.srcPx && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    width: `${anim.length}px`,
                    height: '10px',
                    background: 'linear-gradient(to right, rgba(142, 45, 226, 0.2), #ff007f, #fff, #ff007f, rgba(142, 45, 226, 0.2))',
                    boxShadow: '0 0 12px #ff007f, 0 0 24px #8e2de2',
                    transformOrigin: '0 50%',
                    transform: `rotate(${anim.angle}deg) translateY(-50%)`,
                    zIndex: 4000,
                    pointerEvents: 'none',
                    filter: 'blur(1px)',
                    animation: 'pinkBeamPulse 1.2s ease-out forwards',
                }} />
            );
        }

        if (anim.type === 'annihilation_burst' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x}px`,
                    top: `${anim.tgtPx.y}px`,
                    width: '0px',
                    height: '0px',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 4500,
                    animation: 'annihilationRing 0.7s cubic-bezier(0.1, 0.8, 0.3, 1) forwards'
                }} />
            );
        }

        if (anim.type === 'annihilation_portal' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x}px`,
                    top: `${anim.tgtPx.y}px`,
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4500
                }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '100%',
                                height: '100%',
                                border: '2.5px solid #ff007f',
                                borderRadius: '50%',
                                boxShadow: '0 0 15px #8e2de2, inset 0 0 10px #ff007f',
                                animation: 'organicGlow 3s linear infinite, collapsarRing 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite',
                                animationDelay: `${i * 0.5}s`,
                                opacity: 0,
                                boxSizing: 'border-box'
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (anim.type === 'sleep_rings' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x}px`,
                    top: `${anim.tgtPx.y}px`,
                    width: '100px',
                    height: '100px',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 4500
                }}>
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                                width: '100%',
                                height: '100%',
                                border: '2.2px dashed rgba(160, 160, 165, 0.75)',
                                borderRadius: '60% 40% 50% 50% / 40% 50% 60% 50%',
                                boxShadow: '0 0 10px rgba(160, 160, 165, 0.35), inset 0 0 6px rgba(160, 160, 165, 0.25)',
                                animation: 'sleepShrinkRing 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
                                animationDelay: `${i * 0.4}s`,
                                opacity: 0,
                                boxSizing: 'border-box'
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (anim.type === 'disintegrate_beam' && anim.tgtPx) {
            return (
                <React.Fragment key={key}>
                    {/* Vertical beam */}
                    <div style={{
                        position: 'absolute',
                        left: `${anim.tgtPx.x}px`,
                        width: '8px',
                        background: 'linear-gradient(to right, #ff1a1a, #ffffff 40%, #ffffff 60%, #ff1a1a)',
                        top: 0,
                        height: `${anim.tgtPx.y}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 4000,
                        pointerEvents: 'none',
                        animation: 'disintegrateBeam 2.2s linear forwards'
                    }} />
                    {/* Wobbly organic glow ball tip */}
                    <div style={{
                        position: 'absolute',
                        left: `${anim.tgtPx.x}px`,
                        top: `${anim.tgtPx.y}px`,
                        transform: 'translate(-50%, -50%)',
                        width: '45px',
                        height: '45px',
                        zIndex: 4100,
                        pointerEvents: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            background: 'radial-gradient(circle, #ffffff 20%, #ff1a1a 60%, rgba(255, 26, 26, 0) 100%)',
                            borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                            animation: 'organicGlow 1.5s linear infinite',
                            boxShadow: '0 0 15px #ff1a1a, 0 0 30px #ff1a1a',
                            opacity: 0.95
                        }} />
                    </div>
                </React.Fragment>
            );
        }

        if (anim.type === 'berserker_rage' && anim.srcPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.srcPx.x}px`,
                    top: `${anim.srcPx.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    border: '4px solid #ff3333',
                    boxShadow: '0 0 20px #ff3333, inset 0 0 20px #ff3333',
                    pointerEvents: 'none',
                    zIndex: 4200,
                    animation: 'berserkerRageExpansion 1.0s ease-out forwards'
                }} />
            );
        }

        if (anim.type === 'leap_attack_jump' && anim.srcPx && anim.tgtPx) {
            return null;
        }

        if ((anim.type === 'monk_punch_effect' || anim.type === 'monk_force_punch_effect') && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x + anim.leftOffset}px`,
                    top: `${anim.tgtPx.y + anim.topOffset}px`,
                    width: '56px',
                    height: '56px',
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 5000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={anim.icon || images['monk_punch']}
                        alt="monk punch connect"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            animation: 'scaleUp 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275) both'
                        }}
                    />
                </div>
            );
        }

        if (anim.type === 'barbarian_cleave_effect' && anim.tgtPx) {
            const barbarianUnit = crew.find(f => f.type === 'barbarian');
            const equippedWeapon = barbarianUnit ? (barbarianUnit.inventory || []).find(i => i && i.type === 'weapon' && (i.equippedSlot === 'right' || i.equippedSlot === 'left' || i.equippedBy === barbarianUnit.id)) : null;
            const weaponIcon = equippedWeapon ? (images[equippedWeapon.icon] || equippedWeapon.icon || images[equippedWeapon.id] || equippedWeapon.image || images[equippedWeapon.name]) : images['axe'];

            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x + anim.leftOffset}px`,
                    top: `${anim.tgtPx.y + anim.topOffset}px`,
                    width: '60px',
                    height: '60px',
                    transform: `translate(-50%, -50%) rotate(${anim.baseAngle}deg)`,
                    pointerEvents: 'none',
                    zIndex: 5000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={weaponIcon}
                        alt="cleave weapon"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            transformOrigin: `${30 - anim.halfDistPx}px 30px`,
                            animation: 'cleaveStuck 1.1s ease-in-out forwards'
                        }}
                    />
                </div>
            );
        }

        if (anim.type === 'generic_hit' && anim.tgtPx) {
            return (
                <div key={key} style={{
                    position: 'absolute',
                    left: `${anim.tgtPx.x - 25}px`,
                    top: `${anim.tgtPx.y - 25}px`,
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(255,255,100,0.7) 0%, transparent 70%)',
                    pointerEvents: 'none',
                    zIndex: 4000,
                    animation: 'explosionPop 0.4s ease-out forwards',
                }} />
            );
        }

        return null;
    };

    // ── VCT units — damage indicators only, no portrait ──────────────────────
    const vctUnits = Object.values(battleData).filter(u => u && u.isVCT);

    // ── Rift Portal rendering helper ─────────────────────────────────────────
    const renderRiftPortal = () => {
        // Find any crew Summoner with an active rift portal
        const summoner = crew.find(f => f.type === 'summoner');
        if (!summoner) return null;
        const liveSummoner = combatManager.getCombatant(summoner.id);
        if (!liveSummoner?.riftPortalActive || !liveSummoner?.riftPortalPos) return null;
        const { x, y } = liveSummoner.riftPortalPos; // {x, y} tile coords
        const portalLeft = x * TILE_SIZE + (SHOW_TILE_BORDERS ? x * 2 : 0);
        const portalTop  = y * TILE_SIZE + (SHOW_TILE_BORDERS ? y * 2 : 0);
        const roundsLeft = liveSummoner.riftPortalRoundsLeft ?? 3;
        return (
            <div
                className="rift-portal-tile"
                style={{
                    position: 'absolute',
                    left: portalLeft + 'px',
                    top: portalTop + 'px',
                    width: TILE_SIZE + 'px',
                    height: TILE_SIZE + 'px',
                    zIndex: 350,
                    pointerEvents: 'none',
                }}
            >
                <div className="rift-portal-inner">
                    <div className="rift-portal-rounds">{roundsLeft}</div>
                </div>
            </div>
        );
    };

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

            {/* Sandbox-style CSS animation overlays from AnimationManagerRedux */}
            {activeAnimations.map(renderAnimation)}
        </div>
    );
}
