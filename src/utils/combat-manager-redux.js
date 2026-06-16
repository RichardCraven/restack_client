import { createFighter } from './factories';
import attacksMatrix from './attacks-matrix';
import specialsMatrix from './specials-matrix';
import { activeShieldWalls, crossesShieldWall } from './shared-ai-methods/movement-methods';
import { INTERVALS, getDurationRounds } from './shared-constants';
import * as images from './images';
import { getMeta, storeMeta, applyResolvePenalty } from './session-handler';

const MAX_DEPTH = 7;
const MAX_LANES = 6;


const clone = (val) => {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
};

const formatCombatText = (value) => String(value || '')
    .replace(/_/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function CombatManagerRedux() {
    this.DEATH_ANIMATION_MS = 2200;
    this.FIGHT_INTERVAL = INTERVALS[1]; // default Slow
    this.combatants = {};
    this.round = 1;
    this.roundTimeRemainingRatio = 1.0;
    this.roundTimeElapsedMs = 0;
    this.gameSpeed = 'slow'; // 'slowest' | 'slow' | 'fast'
    this.roundDurationMs = 2000;
    this.combatPaused = false;
    this.combatOver = false;
    this.combatLog = [];
    this.combatLogSequence = 0;
    this.selectedFighter = null;
    this.vctByMonster = {};
    this.pendingBombardments = [];
    this.bombardWarnings = null;

    // Mummy status change logging/diagnostic helper
    let lastMummyState = null;
    const checkMummyState = (context) => {
        const mummy = Object.values(this.combatants || {}).find(c => c && (c.id === 'mummy' || c.type === 'mummy' || c.key === 'mummy' || String(c.id).includes('mummy')));
        if (mummy) {
            const currentState = {
                id: mummy.id,
                hp: mummy.hp,
                dead: !!mummy.dead,
                poison: !!mummy.poison,
                poisonRounds: mummy.poisonRounds || 0,
                frozen: !!mummy.frozen,
                frozenRounds: mummy.frozenRounds || 0,
                ensnared: !!mummy.ensnared,
                ensnaredRounds: mummy.ensnaredRounds || 0,
                marked: !!mummy.marked,
                markedRounds: mummy.markedRounds || 0,
                stunned: !!mummy.stunned,
                stunnedRounds: mummy.stunnedRounds || 0,
                asleep: !!mummy.asleep,
                sleepRounds: mummy.sleepRounds || 0,
                feared: !!mummy.feared,
                fearRounds: mummy.fearRounds || 0,
                activeDebuffs: Array.isArray(mummy.activeDebuffs) ? mummy.activeDebuffs.map(d => ({ name: d.name, roundsLeft: d.roundsLeft })) : [],
                activeBuffs: Array.isArray(mummy.activeBuffs) ? mummy.activeBuffs.map(b => ({ name: b.name, roundsLeft: b.roundsLeft })) : [],
                coordinates: mummy.coordinates ? { ...mummy.coordinates } : null,
            };

            if (lastMummyState) {
                const changes = [];
                const checkProp = (prop) => {
                    if (currentState[prop] !== lastMummyState[prop]) {
                        changes.push(`${prop}: ${JSON.stringify(lastMummyState[prop])} -> ${JSON.stringify(currentState[prop])}`);
                    }
                };

                checkProp('poison');
                checkProp('poisonRounds');
                checkProp('frozen');
                checkProp('frozenRounds');
                checkProp('ensnared');
                checkProp('ensnaredRounds');
                checkProp('marked');
                checkProp('markedRounds');
                checkProp('stunned');
                checkProp('stunnedRounds');
                checkProp('asleep');
                checkProp('sleepRounds');
                checkProp('feared');
                checkProp('fearRounds');
                checkProp('dead');
                checkProp('hp');

                if (JSON.stringify(currentState.coordinates) !== JSON.stringify(lastMummyState.coordinates)) {
                    changes.push(`coordinates: ${JSON.stringify(lastMummyState.coordinates)} -> ${JSON.stringify(currentState.coordinates)}`);
                }
                if (JSON.stringify(currentState.activeDebuffs) !== JSON.stringify(lastMummyState.activeDebuffs)) {
                    changes.push(`activeDebuffs: ${JSON.stringify(lastMummyState.activeDebuffs)} -> ${JSON.stringify(currentState.activeDebuffs)}`);
                }
                if (JSON.stringify(currentState.activeBuffs) !== JSON.stringify(lastMummyState.activeBuffs)) {
                    changes.push(`activeBuffs: ${JSON.stringify(lastMummyState.activeBuffs)} -> ${JSON.stringify(currentState.activeBuffs)}`);
                }

                if (changes.length > 0) {
                    console.log(`[MUMMY-DIAG][CombatManagerRedux][${context}] Mummy state changed! Changes:\n  - ${changes.join('\n  - ')}\nCall stack:\n${new Error().stack}`);
                }
            } else {
                console.log(`[MUMMY-DIAG][CombatManagerRedux][${context}] Initial Mummy state captured:`, JSON.stringify(currentState, null, 2));
            }
            lastMummyState = currentState;
        } else if (lastMummyState) {
            console.log(`[MUMMY-DIAG][CombatManagerRedux][${context}] Mummy is no longer present in combatants! Call stack:\n${new Error().stack}`);
            lastMummyState = null;
        }
    };

    const getRoundDurationMs = () => this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000);
    const getDurationMsFromRounds = (rounds) => Math.max(0, (rounds || 0) * getRoundDurationMs());

    const getUnitStaggerDelay = (unit) => {
        if (!unit) return 0;
        const activeUnits = Object.values(this.combatants).filter(c => c && !c.dead && c.hp > 0 && !c.isVCT && !c.skipAI && typeof c.inTrial !== 'number');
        activeUnits.sort((a, b) => {
            const speedA = a.stats.speed || a.stats.dex || 1;
            const speedB = b.stats.speed || b.stats.dex || 1;
            return speedB - speedA;
        });
        const index = activeUnits.findIndex(c => c.id === unit.id);
        return Math.max(0, index) * 220;
    };

    const getTimeUntilNextTurn = (unit) => {
        const roundDurationMs = getRoundDurationMs();
        const elapsed = this.roundTimeElapsedMs || 0;
        const stagger = getUnitStaggerDelay(unit);
        if (stagger > elapsed) {
            return stagger - elapsed;
        } else {
            return (roundDurationMs - elapsed) + stagger;
        }
    };

    const getStatusDurationMs = (unit, rounds) => {
        const timeUntilNextTurn = getTimeUntilNextTurn(unit);
        const roundDurationMs = getRoundDurationMs();
        return timeUntilNextTurn + Math.max(0, rounds - 1) * roundDurationMs;
    };

    this.ACTION_ENDURANCE_COST = 2;
    this.MOVE_ENDURANCE_COST = 2;

    this.applyEnduranceCost = (unit, cost = this.ACTION_ENDURANCE_COST, source = 'action') => {
        if (!unit) return;
        if ((unit.endurance || 0) <= 0 && unit.exhausted) return;

        let actualCost = cost;
        if (unit.activeDebuffs && unit.activeDebuffs.some(d => d.name === 'shadow_curse')) {
            actualCost = cost * 3;
        }

        unit.endurance = Math.max(0, (unit.endurance || 0) - actualCost);
        if (unit.endurance > 0) return;

        const longDuration = getDurationRounds('long');
        const now = Date.now();
        unit.exhausted = true;
        unit.asleep = true;
        unit.sleepRounds = Math.max(unit.sleepRounds || 0, longDuration);
        unit.sleepTotalRounds = Math.max(unit.sleepTotalRounds || 0, longDuration);
        const sleepDurMs = getStatusDurationMs(unit, unit.sleepRounds);
        unit.sleepTotalDurationMs = sleepDurMs;
        unit.sleepEndTimeMs = now + sleepDurMs;
        unit.stunned = true;
        unit.stunnedRounds = Math.max(unit.stunnedRounds || 0, longDuration);
        unit.stunnedTotalRounds = Math.max(unit.stunnedTotalRounds || 0, longDuration);
        unit.stunnedStackDuration = longDuration;
        const stunDurMs = getStatusDurationMs(unit, unit.stunnedRounds);
        unit.stunnedTotalDurationMs = stunDurMs;
        unit.stunnedEndTimeMs = now + stunDurMs;
        if (unit.enduranceFrozenRounds <= 0) unit.enduranceFrozenRounds = longDuration;
        this.appendCombatLog(`${this.getCombatantLogName(unit)} is exhausted and collapses into sleep.`);
    };

    this.getCombatLog = () => this.combatLog.slice();

    this.getCombatantLogName = (combatant) => {
        if (!combatant) return 'Unknown';
        if (combatant.isMinion) return formatCombatText(combatant.type || combatant.name || 'minion');
        return combatant.name || formatCombatText(combatant.type || 'unknown');
    };

    this.getCombatActionName = (action) => {
        if (!action) return 'Attack';
        return formatCombatText(action.name || action.subtype || action.type || 'attack');
    };

    this.appendCombatLog = (message) => {
        if (!message) return;
        this.combatLogSequence += 1;
        this.combatLog.push({
            id: `combat_log_${this.combatLogSequence}`,
            message
        });
        if (this.combatLog.length > 200) {
            this.combatLog.splice(0, this.combatLog.length - 200);
        }
    };

    this.pauseCombat = (val) => {
        this.combatPaused = val;
        Object.values(this.combatants).forEach(e => e.combatPaused = val);
        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
    };

    this.reset = () => {
        if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
        this.combatPaused = false;
        this.combatOver = false;
        this.combatLog = [];
        this.combatLogSequence = 0;
        this.round = 1;
        this.roundTimeRemainingRatio = 1.0;
        this.roundTimeElapsedMs = 0;
        this.gameSpeed = 'slow';
        this.roundDurationMs = 2000;
        this.combatants = {};
        this.vctByMonster = {};
        this.pendingBombardments = [];
        this.bombardWarnings = null;
        if (typeof this.updateData === 'function') this.updateData({});
    };

    // Direct accessor methods — available without calling initialize()
    this.getCombatant = (id) => this.combatants[id] || null;
    this.specialsMatrix = specialsMatrix;

    const RANGES = {
        close: 1,
        medium: 3,
        far: 5
    };

    this.getDistanceToTargetWidthString = (caller) => {
        if (!caller || !this.combatants[caller.targetId]) return '0';
        let distanceToTarget = Math.abs(caller.coordinates.x - this.combatants[caller.targetId].coordinates.x) - 1;
        return String((distanceToTarget * 100) + 100);
    };

    this.getRangeWidthVal = (caller) => {
        if (caller && caller.activeAbility) {
            return RANGES[caller.activeAbility.range] || 0;
        }
        return 0;
    };


    this.resolveSpecial = (callerOrArray, specialKey) => {
        const key = (specialKey || '').toString();
        const normalized = key.replace(/\s+/g, '_').toLowerCase();
        let arr = [];
        if (callerOrArray) {
            if (Array.isArray(callerOrArray.specials)) arr = arr.concat(callerOrArray.specials);
            if (Array.isArray(callerOrArray.attacks)) arr = arr.concat(callerOrArray.attacks);
            if (Array.isArray(callerOrArray.specialActions)) arr = arr.concat(callerOrArray.specialActions);
            if (Array.isArray(callerOrArray)) arr = arr.concat(callerOrArray);
        }
        if (!Array.isArray(arr) || arr.length === 0) return null;

        for (let s of arr) {
            if (!s) continue;
            if (typeof s === 'string') {
                const sNorm = s.replace(/\s+/g, '_').toLowerCase();
                if (s.toLowerCase() === key.toLowerCase() || sNorm === normalized) {
                    const expanded = specialsMatrix[normalized] || attacksMatrix[normalized];
                    if (expanded) return clone(expanded);
                    if (normalized === 'loose') {
                        return {
                            id: 'loose',
                            name: 'Loose',
                            range: 'far',
                            type: 'damage',
                            cooldown: 2
                        };
                    }
                    return { name: key };
                }
            } else if (typeof s === 'object') {
                if (s.name && (s.name.toLowerCase() === key.toLowerCase() || s.name.toLowerCase() === normalized)) return s;
                if (s.key && s.key.toLowerCase() === normalized) return s;
            }
        }
        const expanded = specialsMatrix[normalized] || attacksMatrix[normalized];
        if (expanded) return clone(expanded);
        if (normalized === 'loose') {
            return {
                id: 'loose',
                name: 'Loose',
                range: 'far',
                type: 'damage',
                cooldown: 2
            };
        }
        return null;
    };

    this.updateAllFightIntervals = (newInterval) => {
        this.FIGHT_INTERVAL = newInterval;
        if (newInterval === INTERVALS[0]) {
            this.gameSpeed = 'slowest';
            this.roundDurationMs = 3000;
        } else if (newInterval === INTERVALS[1]) {
            this.gameSpeed = 'slow';
            this.roundDurationMs = 2000;
        } else {
            this.gameSpeed = 'fast';
            this.roundDurationMs = 1000;
        }
    };

    this.setSelectedFighter = (selectedFighter) => {
        this.selectedFighter = selectedFighter;
    };

    this.removeCombatant = (id) => {
        if (id === 'mummy' || String(id).includes('mummy')) {
            console.log(`[MUMMY-DIAG] removeCombatant called for ${id}. Call stack:\n${new Error().stack}`);
        }
        if (this.combatants && this.combatants[id]) {
            Object.values(this.combatants).forEach(e => {
                if (Array.isArray(e.targettedBy)) {
                    e.targettedBy = e.targettedBy.filter(tid => tid !== id);
                }
                if (e.targetId === id) {
                    e.targetId = null;
                }
            });
            if (this.vctByMonster && this.vctByMonster[id]) {
                const vctId = `${id}_VCT`;
                if (this.combatants[vctId]) delete this.combatants[vctId];
                delete this.vctByMonster[id];
            }
            delete this.combatants[id];
            checkMummyState('removeCombatant');
            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        }
    };

    this.beginGreeting = () => {
        const monster = this.data?.monster;
        if (!monster) {
            if (typeof this.greetingComplete === 'function') this.greetingComplete();
            this.appendCombatLog('Combat started. Round 1 begins.');
            this.startRoundTimer();
            this.processRoundTurns();
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        const greetingMsg = monster.greetings && monster.greetings[0] ? monster.greetings[0] : "Prepare to battle!";
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        Promise.resolve().then(async () => {
            await delay(500);
            if (typeof this.setMessage === 'function') {
                this.setMessage({ message: greetingMsg, source: 'monster' });
            }

            if (monster.type === 'witch') {
                await delay(2000);
                if (typeof this.morphPortrait === 'function') {
                    this.morphPortrait();
                }
                await delay(3000);
            } else {
                await delay(2500);
            }

            if (typeof this.setMessage === 'function') {
                this.setMessage({ message: '', source: null });
            }
            await delay(500);

            if (typeof this.greetingComplete === 'function') {
                this.greetingComplete();
            }

            this.appendCombatLog('Combat started. Round 1 begins.');
            this.startRoundTimer();
            this.processRoundTurns();

            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        });
    };

    this.initializeCombat = (data) => {
        this.data = data;
        this.combatants = {};
        this.vctByMonster = {};
        this.pendingBombardments = [];
        this.bombardWarnings = null;
        this.round = 1;
        this.roundTimeRemainingRatio = 1.0;
        this.roundTimeElapsedMs = 0;
        this.combatOver = false;

        const callbacks = {
            broadcastDataUpdate: (c) => {
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            },
            acquireTarget: this.acquireTarget,
            chooseAttackType: () => {},
            hitsTarget: () => true,
            pickRandom: (arr) => arr[Math.floor(Math.random() * arr.length)],
            missesTarget: () => false,
            hitCheck: this.hitCheck,
            damageCheck: this.damageCheck,
            isCombatOver: this.combatOverCheck,
            getCombatant: (id) => this.combatants[id],
            formatAttacks: (arr) => arr.map(a => {
                const match = attacksMatrix[a];
                return match ? { ...clone(match), id: a, key: a } : { name: a, id: a, key: a };
            }),
            formatSpecials: (arr) => arr.map(s => {
                const match = specialsMatrix[s];
                return match ? { ...clone(match), id: s, key: s } : { name: s, id: s, key: s };
            }),
            resolveSpecial: this.resolveSpecial,
            initiateAttack: () => {},
            checkOverlap: () => false,
            handleOverlap: () => {},
            goToDestination: () => {},
            processActionQueue: () => {},
            processMove: () => {},
            targetInRange: this.targetInRange,
            getSelectedFighter: () => this.selectedFighter,
            onEraTransition: () => {},
            targetKilled: this.targetKilled,
            setTargetId: (c, tid) => { c.targetId = tid; },
            getAllCombatants: () => this.combatants
        };

        const colors = ['#b710d5', '#6495ed', '#73b746', '#f4d013'];

        this.data.crew.forEach((e, index) => {
            if (e && (e.dead === true || e.hp === 0)) return;

            // Ensure fundamental abilities are always available
            if (e.type === 'ranger') {
                e.specials = e.specials || [];
                if (!e.specials.includes('notch')) e.specials.push('notch');
                e.attacks = e.attacks || [];
                if (!e.attacks.includes('loose')) e.attacks.push('loose');
            } else if (e.type === 'sage') {
                e.attacks = e.attacks || [];
                if (!e.attacks.includes('heal')) e.attacks.push('heal');
            } else if (e.type === 'soldier') {
                e.attacks = e.attacks || [];
                if (!e.attacks.includes('slash')) e.attacks.push('slash');
            } else if (e.type === 'barbarian') {
                e.attacks = e.attacks || [];
                if (!e.attacks.includes('barbarian_slash')) e.attacks.push('barbarian_slash');
            }

            e.coordinates = { x: 0, y: index };
            e.color = colors[index % colors.length];

            const fighter = createFighter(e, callbacks, this.FIGHT_INTERVAL);
            fighter.maxEndurance = e.stats.vitality || 30;
            fighter.endurance = fighter.maxEndurance;
            fighter.enduranceFrozenRounds = 0;
            fighter.cooldowns = {};
            fighter.movesTakenThisRound = 0;
            fighter.actionsTakenThisRound = 0;

            this.combatants[e.id] = fighter;
            this._initializeInitialCooldowns(fighter);
            this._setCombatantOccupiedCoords(fighter);
        });

        const m = this.data.monster;
        m.isMonster = true; // Mark as monster early so isLarge/isHuge sizing evaluates correctly for VCT occupied lanes
        const isHuge = (
            (typeof m.huge === 'boolean' && m.huge === true)
            || (m.type === 'dragon')
            || (m.tier === 4)
            || (typeof m.size === 'number' && m.size === 3)
            || (typeof m.scale === 'number' && m.scale === 3)
        );
        const LARGE_COMBAT_KEYS = ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire', 'summoned_djinn', 'summoned_mummy', 'summoned_ogre', 'summoned_vampire'];
        const isLarge = (
            !isHuge && (
                (typeof m.large === 'boolean' && m.large === true)
                || (m.type && LARGE_COMBAT_KEYS.includes(m.type) && m.isMinion !== true)
                || (typeof m.size === 'number' && m.size >= 2)
                || (typeof m.scale === 'number' && m.scale >= 2)
                || (m.isMonster === true && m.isMinion !== true)
            )
        );

        let monsterY = 2;
        const minionCount = this.data.minions ? this.data.minions.length : 0;
        if ((isHuge || isLarge) && minionCount <= 2) {
            monsterY = 3;
        }

        // Set up main monster
        this.data.monster.coordinates = { x: MAX_DEPTH, y: monsterY };
        this.data.monster.isMonster = true;
        const monster = createFighter(this.data.monster, callbacks, this.FIGHT_INTERVAL);
        monster.isMonster = true;
        monster.tier = this.data.monster.tier;
        monster.maxEndurance = this.data.monster.stats.vitality || Math.round(20 + (this.data.monster.stats.def || 5) * 2);
        monster.endurance = monster.maxEndurance;
        monster.enduranceFrozenRounds = 0;
        monster.cooldowns = {};
        monster.movesTakenThisRound = 0;
        monster.actionsTakenThisRound = 0;

        this.combatants[monster.id] = monster;
        this._initializeInitialCooldowns(monster);
        this._setCombatantOccupiedCoords(monster, this.combatants);

        console.log('[DEBUG][CombatManagerRedux] initializeCombat incoming monster:', this.data.monster, 'minions:', this.data.minions);
        // Set up minions
        if (this.data.minions) {
            const occupiedLanes = [monsterY];
            if (isHuge) {
                occupiedLanes.push(monsterY - 1);
                occupiedLanes.push(monsterY - 2);
            } else if (isLarge) {
                occupiedLanes.push(monsterY - 1);
            }
            // Distribute available lanes above and below the boss as evenly as possible to flank the boss
            const bossMinY = Math.min(...occupiedLanes);
            const bossMaxY = Math.max(...occupiedLanes);
            const aboveLanes = [];
            const belowLanes = [];
            for (let y = 0; y < MAX_LANES; y++) {
                if (!occupiedLanes.includes(y)) {
                    if (y < bossMinY) {
                        aboveLanes.push(y);
                    } else if (y > bossMaxY) {
                        belowLanes.push(y);
                    }
                }
            }
            // Sort aboveLanes descending (closest to boss first) and belowLanes ascending (closest to boss first)
            aboveLanes.sort((a, b) => b - a);
            belowLanes.sort((a, b) => a - b);

            const availableLanes = [];
            let aboveIdx = 0;
            let belowIdx = 0;
            while (aboveIdx < aboveLanes.length || belowIdx < belowLanes.length) {
                if (belowIdx < belowLanes.length) {
                    availableLanes.push(belowLanes[belowIdx++]);
                }
                if (aboveIdx < aboveLanes.length) {
                    availableLanes.push(aboveLanes[aboveIdx++]);
                }
            }
            console.log('[DEBUG][CombatManagerRedux] occupiedLanes:', occupiedLanes, 'availableLanes:', availableLanes);

            this.data.minions.forEach((e, i) => {
                e.isMinion = true;
                e.isMonster = true; // Starting boss minions are hostile monsters
                const laneIndex = i % availableLanes.length;
                const columnOffset = Math.floor(i / availableLanes.length);
                e.coordinates = { x: MAX_DEPTH - columnOffset, y: availableLanes[laneIndex] };
                console.log(`[DEBUG][CombatManagerRedux] minion index ${i} key ${e.key} resolved coordinates:`, e.coordinates);

                const minion = createFighter(e, callbacks, this.FIGHT_INTERVAL);
                minion.isMinion = true;
                minion.isMonster = true; // Starting boss minions are hostile monsters
                minion.tier = e.tier || 1;
                minion.maxEndurance = e.stats.vitality || Math.round(20 + (e.stats.def || 5) * 2);
                minion.endurance = minion.maxEndurance;
                minion.enduranceFrozenRounds = 0;
                minion.cooldowns = {};
                minion.movesTakenThisRound = 0;
                minion.actionsTakenThisRound = 0;

                this.combatants[minion.id] = minion;
                this._initializeInitialCooldowns(minion);
                this._setCombatantOccupiedCoords(minion, this.combatants);
            });
            console.log('[DEBUG][CombatManagerRedux] final combatants list:', Object.keys(this.combatants));
        }

        checkMummyState('initializeCombat');

        // Initialize round clock & begin greeting sequence
        this.beginGreeting();

        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
    };

    this._setCombatantOccupiedCoords = (combatant, battleData) => {
        if (!combatant) return;
        combatant.occupiedCoords = [];
        if (combatant.coordinates) combatant.occupiedCoords.push({ x: combatant.coordinates.x, y: combatant.coordinates.y });

        const isHuge = (
            (typeof combatant.huge === 'boolean' && combatant.huge === true)
            || (combatant.type === 'dragon')
            || (combatant.tier === 4)
            || (typeof combatant.size === 'number' && combatant.size === 3)
            || (typeof combatant.scale === 'number' && combatant.scale === 3)
        );

        const LARGE_COMBAT_KEYS = ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire', 'summoned_djinn', 'summoned_mummy', 'summoned_ogre', 'summoned_vampire'];
        const isLarge = (
            !isHuge && (
                (typeof combatant.large === 'boolean' && combatant.large === true)
                || (combatant.type && LARGE_COMBAT_KEYS.includes(combatant.type) && combatant.isMinion !== true)
                || (typeof combatant.size === 'number' && combatant.size >= 2)
                || (typeof combatant.scale === 'number' && combatant.scale >= 2)
                || (combatant.isMonster === true && combatant.isMinion !== true)
            )
        );

        if (isHuge && combatant.coordinates) {
            const hOffset = (combatant.coordinates.x >= 4) ? -1 : 1;
            const extraCoords = [
                { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 },
                { x: combatant.coordinates.x, y: combatant.coordinates.y - 2 },
                { x: combatant.coordinates.x + hOffset, y: combatant.coordinates.y },
                { x: combatant.coordinates.x + hOffset, y: combatant.coordinates.y - 1 },
                { x: combatant.coordinates.x + hOffset, y: combatant.coordinates.y - 2 },
                { x: combatant.coordinates.x + 2 * hOffset, y: combatant.coordinates.y },
                { x: combatant.coordinates.x + 2 * hOffset, y: combatant.coordinates.y - 1 },
                { x: combatant.coordinates.x + 2 * hOffset, y: combatant.coordinates.y - 2 }
            ];
            extraCoords.forEach(coord => {
                if (coord.x >= 0 && coord.x < 8 && coord.y >= 0 && coord.y < 6) {
                    if (!combatant.occupiedCoords.some(c => c.x === coord.x && c.y === coord.y)) {
                        combatant.occupiedCoords.push(coord);
                    }
                }
            });

            this.vctByMonster[combatant.id] = [];
            const vcts = [
                { suffix: '_VCT', offset: 1 },
                { suffix: '_VCT2', offset: 2 }
            ];
            vcts.forEach(({ suffix, offset }) => {
                const targetY = combatant.coordinates.y - offset;
                if (targetY >= 0) {
                    const coord = { x: combatant.coordinates.x, y: targetY };
                    const vctObj = {
                        monsterId: combatant.id,
                        coordinates: { ...coord },
                        get isVCT() { return true; },
                        get parentMonster() { return combatant; }
                    };
                    this.vctByMonster[combatant.id].push(vctObj);

                    if (battleData) {
                        const vctId = `${combatant.id}${suffix}`;
                        battleData[vctId] = {
                            id: vctId,
                            isVCT: true,
                            parentMonsterId: combatant.id,
                            coordinates: { ...coord },
                            hp: null,
                            stats: {},
                            dead: false,
                            portrait: null,
                            type: 'virtual',
                            scale: 1,
                            isMonster: combatant.isMonster === true,
                            isMinion: combatant.isMinion === true,
                            damageIndicators: [],
                        };
                    }
                }
            });
        }
        else if (isLarge && combatant.coordinates) {
            const hOffset = (combatant.coordinates.x >= 4) ? -1 : 1;
            const extraCoords = [
                { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 },
                { x: combatant.coordinates.x + hOffset, y: combatant.coordinates.y },
                { x: combatant.coordinates.x + hOffset, y: combatant.coordinates.y - 1 }
            ];
            extraCoords.forEach(coord => {
                if (coord.x >= 0 && coord.x < 8 && coord.y >= 0 && coord.y < 6) {
                    if (!combatant.occupiedCoords.some(c => c.x === coord.x && c.y === coord.y)) {
                        combatant.occupiedCoords.push(coord);
                    }
                }
            });

            this.vctByMonster[combatant.id] = [];
            const above = { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 };
            if (above.y >= 0) {
                this.vctByMonster[combatant.id].push({
                    monsterId: combatant.id,
                    coordinates: { ...above },
                    get isVCT() { return true; },
                    get parentMonster() { return combatant; }
                });
                if (battleData) {
                    const vctId = `${combatant.id}_VCT`;
                    battleData[vctId] = {
                        id: vctId,
                        isVCT: true,
                        parentMonsterId: combatant.id,
                        coordinates: { ...above },
                        hp: null,
                        stats: {},
                        dead: false,
                        portrait: null,
                        type: 'virtual',
                        scale: 1,
                        isMonster: combatant.isMonster === true,
                        isMinion: combatant.isMinion === true,
                        damageIndicators: [],
                    };
                }
            }
        }
    };

    this.syncVCTs = () => {
        if (!this.vctByMonster) return;
        Object.values(this.combatants).forEach(combatant => {
            if (!combatant || !this.vctByMonster[combatant.id]) return;
            const vcts = this.vctByMonster[combatant.id];
            if (Array.isArray(vcts) && combatant.coordinates) {
                vcts.forEach((vct, index) => {
                    const suffix = index === 0 ? '_VCT' : '_VCT2';
                    const offset = index === 0 ? 1 : 2;
                    vct.coordinates = { x: combatant.coordinates.x, y: combatant.coordinates.y - offset };
                    const vctId = `${combatant.id}${suffix}`;
                    if (this.combatants[vctId]) {
                        this.combatants[vctId].coordinates = { ...vct.coordinates };
                    }
                });
            }
        });
    };

    this.isTileOccupied = (x, y, excludeUnitId = null) => {
        return Object.values(this.combatants).some(c => {
            if (!c || c.dead) return false;
            if (c.id === excludeUnitId) return false;
            if (c.isVCT && c.parentMonsterId === excludeUnitId) return false;
            if (c.coordinates && c.coordinates.x === x && c.coordinates.y === y) return true;
            if (Array.isArray(c.occupiedCoords) && c.occupiedCoords.some(coord => coord.x === x && coord.y === y)) return true;
            return false;
        });
    };
    this.shouldPushbackSucceed = (target, forceBoost = false) => {
        if (!target) return true;
        const isMonster = target.isMonster === true;
        const isMinion = target.isMinion === true;
        if (isMonster && !isMinion) {
            const targetIsHuge = (
                (typeof target.huge === 'boolean' && target.huge === true)
                || (target.type === 'dragon')
                || (target.tier === 4)
                || (typeof target.size === 'number' && target.size === 3)
                || (typeof target.scale === 'number' && target.scale === 3)
            );
            if (targetIsHuge) {
                return forceBoost ? Math.random() >= 0.50 : Math.random() >= 0.90; // 50% fail if forced, else 90%
            }
            return forceBoost ? true : Math.random() >= 0.70; // 0% fail if forced, else 70%
        }
        return true;
    };

    this.canFitAt = (unit, x, y) => {
        if (!unit) return false;
        if (x < 0 || x > MAX_DEPTH || y < 0 || y >= MAX_LANES) return false;

        // Block moves that cross an active shield wall
        if (unit.coordinates && (unit.isMonster || unit.isMinion) && crossesShieldWall(unit.coordinates, { x, y })) {
            return false;
        }

        if (this.isTileOccupied(x, y, unit.id)) return false;

        const isHuge = (
            (typeof unit.huge === 'boolean' && unit.huge === true)
            || (unit.type === 'dragon')
            || (unit.tier === 4)
            || (typeof unit.size === 'number' && unit.size === 3)
            || (typeof unit.scale === 'number' && unit.scale === 3)
        );

        const LARGE_COMBAT_KEYS = ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire', 'summoned_djinn', 'summoned_mummy', 'summoned_ogre', 'summoned_vampire'];
        const isLarge = (
            !isHuge && (
                (typeof unit.large === 'boolean' && unit.large === true)
                || (unit.type && LARGE_COMBAT_KEYS.includes(unit.type) && unit.isMinion !== true)
                || (typeof unit.size === 'number' && unit.size >= 2)
                || (typeof unit.scale === 'number' && unit.scale >= 2)
                || (unit.isMonster === true && unit.isMinion !== true)
            )
        );

        if (isHuge) {
            const hOffset = (x >= 4) ? -1 : 1;
            const extraCoords = [
                { x: x, y: y - 1 },
                { x: x, y: y - 2 },
                { x: x + hOffset, y: y },
                { x: x + hOffset, y: y - 1 },
                { x: x + hOffset, y: y - 2 },
                { x: x + 2 * hOffset, y: y },
                { x: x + 2 * hOffset, y: y - 1 },
                { x: x + 2 * hOffset, y: y - 2 }
            ];
            for (let coord of extraCoords) {
                if (coord.x < 0 || coord.x > MAX_DEPTH || coord.y < 0 || coord.y >= MAX_LANES) return false;
                if (unit.coordinates && (unit.isMonster || unit.isMinion) && crossesShieldWall(unit.coordinates, coord)) return false;
                if (this.isTileOccupied(coord.x, coord.y, unit.id)) return false;
            }
        } else if (isLarge) {
            const hOffset = (x >= 4) ? -1 : 1;
            const extraCoords = [
                { x: x, y: y - 1 },
                { x: x + hOffset, y: y },
                { x: x + hOffset, y: y - 1 }
            ];
            for (let coord of extraCoords) {
                if (coord.x < 0 || coord.x > MAX_DEPTH || coord.y < 0 || coord.y >= MAX_LANES) return false;
                if (unit.coordinates && (unit.isMonster || unit.isMinion) && crossesShieldWall(unit.coordinates, coord)) return false;
                if (this.isTileOccupied(coord.x, coord.y, unit.id)) return false;
            }
        }
        return true;
    };

    this.updateUnitCoordinates = (unit, nx, ny) => {
        if (!unit) return;
        if (unit.type === 'dragon_egg' || unit.type === 'trials_icon' || unit.isTrialIcon) {
            return;
        }
        const ox = unit.coordinates.x;
        const oy = unit.coordinates.y;
        unit.coordinates.x = nx;
        unit.coordinates.y = ny;
        if (nx !== ox) {
            unit.facing = nx > ox ? 'right' : 'left';
        } else if (ny !== oy) {
            unit.facing = ny > oy ? 'down' : 'up';
        }
        this._setCombatantOccupiedCoords(unit, this.combatants);
        this.syncVCTs();

        // If Sage has Circle active and actually moved/repositioned, end the Circles immediately
        if (unit.type === 'sage' && (ox !== nx || oy !== ny)) {
            const hasCircle = unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'circle_of_protection' || b.name === 'circle_of_deflection');
            if (hasCircle) {
                this._endSageCircles(unit, 'Sage moved');
            }
        }
    };

    this.hitCheck = (caller, target) => {
        if (!target || !caller) return true;
        // Dex is the primary dodge stat; fall back to speed for backward compat
        const targetDex = target.stats.dex || target.stats.speed || 1;
        const targetSpeed = target.stats.speed || targetDex;
        // Combine dex and speed for dodge: dex contributes 2% per point, speed 1%
        const baseMissChance = (targetDex * 2.0) + (targetSpeed * 1.0);
        let missChance = Math.min(baseMissChance, 45); // cap at 45% normally

        // Monk's Third Eye: doubles the chance that enemy attack will miss
        if (target.thirdEyeActive && caller.isMonster) {
            missChance = Math.min(missChance * 2.0, 75);
        }

        // Morale Dodge Modifier (applied to target if target is a crew member)
        if (target && !target.isMonster) {
            const meta = getMeta();
            const resolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            if (resolve >= 80) {
                missChance += 5;
            } else if (resolve >= 20 && resolve <= 39) {
                missChance -= 5;
            } else if (resolve < 20) {
                missChance -= 10;
            }
            missChance = Math.max(0, Math.min(missChance, 95));
        }

        return (Math.random() * 100) >= missChance;
    };

    this.damageCheck = (caller, target, rawDamage, isMagical = false) => {
        if (!target || typeof rawDamage !== 'number' || rawDamage <= 0) return rawDamage || 0;

        // STR-based flat damage reduction: 1 point reduced per 2 STR
        const targetStr = (target.stats && typeof target.stats.str === 'number') ? target.stats.str : 0;
        const strReduction = Math.floor(targetStr / 2);
        let damage = Math.max(1, rawDamage - strReduction);

        let equippedArmor = 0;
        try {
            const inv = target.inventory || [];
            equippedArmor = inv
                .filter(i => i && i.type === 'armor' && (i.equippedSlot || i.equippedBy === target.id))
                .reduce((acc, a) => acc + (typeof a.armor === 'number' ? a.armor : 0), 0);
        } catch (e) { equippedArmor = 0; }
        let copMultiplier = 1.0;
        const hasCop = target.activeBuffs && target.activeBuffs.some(b => b.name === 'circle_of_protection');
        if (hasCop) {
            const sameTeamSage = Object.values(this.combatants).find(c => {
                if (!c || c.dead || c.isVCT) return false;
                const sameTeam = (!!target.isMonster === !!c.isMonster);
                return sameTeam && c.type === 'sage';
            });
            if (sameTeamSage) {
                const dx = target.coordinates.x - sameTeamSage.coordinates.x;
                const dy = target.coordinates.y - sameTeamSage.coordinates.y;
                const d = Math.sqrt(dx * dx + dy * dy);
                if (d < 1.9) {
                    copMultiplier = 2.0;
                } else if (d <= 2.25) {
                    copMultiplier = 1.5;
                }
            }
        }
        const naturalArmor = (target.stats && typeof target.stats.def === 'number' && target.stats.def > 0)
            ? target.stats.def * 4 * copMultiplier : 0;
        const totalArmor = Math.min(equippedArmor + naturalArmor, 200);
        
        let finalDamage = damage;
        if (totalArmor > 0) {
            const reduction = Math.min(totalArmor / 2.5, 75); // max 75% reduction
            finalDamage = Math.max(1, Math.round(damage * (1 - reduction / 100)));
        }

        // --- SHADOW ARMOR (Passive) ---
        // Provides 15% damage reduction from physical attacks.
        if (target.type === 'wraith' && !isMagical) {
            const hasShadowArmor = target.specials && target.specials.some(s => s && (s === 'shadow_armor' || s.id === 'shadow_armor' || s.key === 'shadow_armor'));
            if (hasShadowArmor) {
                // Reduce by 15%
                finalDamage = Math.max(1, Math.round(finalDamage * 0.85));
            }
        }

        // Morale Damage Modifier (applied if caller is a crew member)
        if (caller && !caller.isMonster) {
            const meta = getMeta();
            const resolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            if (resolve >= 80) {
                finalDamage = Math.round(finalDamage * 1.10);
            } else if (resolve >= 20 && resolve <= 39) {
                finalDamage = Math.round(finalDamage * 0.90);
            } else if (resolve < 20) {
                finalDamage = Math.round(finalDamage * 0.80);
            }
        }
        if (target.demonMarked && caller && (caller.subtype === 'demon' || caller.type === 'goat_demon' || caller.key === 'goat_demon')) {
            finalDamage = Math.round(finalDamage * 1.50);
        }
        return Math.max(1, finalDamage);
    };

    this.targetInRange = (caller, target, rangeType) => {
        if (!caller || !target) return false;
        
        // Support multi-tile large callers/targets by checking range from every occupied tile
        const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0)
            ? target.occupiedCoords
            : [target.coordinates];
        const callerTiles = (Array.isArray(caller.occupiedCoords) && caller.occupiedCoords.length > 0)
            ? caller.occupiedCoords
            : [caller.coordinates];

        const tileInRange = (cc, tc) => {
            const dx = Math.abs(cc.x - tc.x);
            const dy = Math.abs(cc.y - tc.y);
            const dist = dx + dy; // Manhattan distance
            
            if (rangeType === 'close') {
                // Adjacent orthogonally (Manhattan distance of 1) or Chebyshev distance of 1 (diagonals included)
                // Let's support both cardinally and diagonally adjacent close range (dx <= 1 && dy <= 1)
                return dx <= 1 && dy <= 1;
            }
            if (rangeType === 'medium') return dist <= 3;
            return true; // far/any
        };

        return callerTiles.some(cc => targetTiles.some(tc => tileInRange(cc, tc)));
    };

    // ── Target Acquisition ────────────────────────────────────────────────────
    // Acquire an attack target using threat-weighted scoring.
    // Prioritizes: lowest HP% target, then healer/support classes, then closest.
    this.acquireTarget = (caller, preferWeakest = true) => {
        let bestTarget = null;
        let bestScore = -Infinity;

        // Healers are high-value targets for enemies
        const HEALER_TYPES = new Set(['sage', 'summoner', 'wizard']);

        const candidateTargets = Object.values(this.combatants).filter(c => {
            if (!c || c.dead || c.isVCT || typeof c.inTrial === 'number') return false;
            const callerIsEnemy = !!caller.isMonster;
            const cIsEnemy = !!c.isMonster;
            return callerIsEnemy !== cIsEnemy;
        });
        const callerIsEnemy = !!caller.isMonster;
        const awakeTargetsExist = !callerIsEnemy && candidateTargets.some(c => !c.asleep);

        candidateTargets.forEach(c => {
            if (!callerIsEnemy && awakeTargetsExist && c.asleep) return;

            const dist = Math.abs(caller.coordinates.x - c.coordinates.x)
                       + Math.abs(caller.coordinates.y - c.coordinates.y);
            const hpPct  = c.starting_hp > 0 ? (c.hp / c.starting_hp) : 1;

            // Score: closer is better, lower HP is better, healers are more tempting
            let score = 0;
            score -= dist * 2;                          // prefer close targets
            if (preferWeakest) score += (1 - hpPct) * 10; // prefer wounded targets
            if (!callerIsEnemy && HEALER_TYPES.has(c.type)) score += 5;
            if (!callerIsEnemy && c.isBones) score += 18; // aggressive but not full tunnel-vision

            if (score > bestScore) {
                bestScore = score;
                bestTarget = c;
            }
        });
        if (bestTarget) {
            caller.targetId = bestTarget.id;
        }
        return bestTarget;
    };

    this.wakeSleepingTarget = (target, sourceName = 'damage') => {
        if (!target || !target.asleep) return false;
        target.asleep = false;
        target.sleepRounds = 0;
        target.sleepTotalRounds = 0;
        target.sleepTotalDurationMs = 0;
        target.sleepEndTimeMs = 0;
        target.stunned = false;
        target.stunnedRounds = 0;
        target.stunnedTotalRounds = 0;
        target.stunnedStackDuration = 0;
        target.stunnedTotalDurationMs = 0;
        target.stunnedEndTimeMs = 0;
        this.appendCombatLog(`${this.getCombatantLogName(target)} wakes up from ${sourceName}.`);
        return true;
    };

    // Find the friendliest ally who needs healing (lowest HP%)
    this.findWoundedAlly = (unit) => {
        let worst = null;
        let worstPct = 1.0;
        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT || c.id === unit.id) return;
            // Same faction check
            const sameTeam = (!!unit.isMonster === !!c.isMonster);
            if (!sameTeam) return;
            const pct = c.starting_hp > 0 ? (c.hp / c.starting_hp) : 1;
            if (pct < worstPct) { worstPct = pct; worst = c; }
        });
        return worst;
    };

    // Count live enemies of the caller's faction
    this.countEnemies = (unit) => {
        return Object.values(this.combatants).filter(c => {
            if (!c || c.dead || c.isVCT) return false;
            if (unit.isMonster) return !c.isMonster;
            return !!c.isMonster;
        }).length;
    };

    this.targetKilled = (target) => {
        // Special: if the trial effect icon is destroyed, trigger death animation then end trials
        if (target && target.isTrialIcon) {
            // Mark dying so CombatGrid renders the death animation
            if (this.combatants['trials_icon']) {
                this.combatants['trials_icon'].dying = true;
                this.combatants['trials_icon'].dead = true; // Mark dead immediately so combat count filters it out
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }
            // Delay actual cleanup so the 2.5s death animation plays out
            setTimeout(() => {
                if (this.combatOver && Object.keys(this.combatants).length === 0) return; // already reset
                const sphinx = this._getSphinx();
                if (sphinx) {
                    this._endTrials(sphinx, 'trial icon destroyed');
                } else {
                    delete this.combatants['trials_icon'];
                    Object.values(this.combatants).forEach(c => {
                        if (c && typeof c.inTrial === 'number') this._returnFromTrial(c);
                    });
                }
                this.combatOverCheck(); // Trigger combat over check after trials end and fighters return!
            }, 2500);
            return;
        }

        if (this.tryTriggerReassemble(target)) {
            return;
        }
        if (!target || target.dead) {
            return;
        }
        target.dead = true;

        const isSphinx = target && (target.type === 'sphinx' || target.key === 'sphinx' || (target.id && target.id.toString().includes('sphinx')));
        if (isSphinx) {
            const trialsIcon = this.combatants['trials_icon'];
            if (trialsIcon && !trialsIcon.dead) {
                // Mark trial icon dying/dead immediately so it plays the death/fade animation
                // and gets excluded from combatOverCheck monsters count.
                trialsIcon.dying = true;
                trialsIcon.dead = true;
                
                // Return all crew members in trial immediately so their state is saved correctly on game over.
                Object.values(this.combatants).forEach(c => {
                    if (c && typeof c.inTrial === 'number') {
                        this._returnFromTrial(c);
                    }
                });
                
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                
                setTimeout(() => {
                    if (this.combatOver && Object.keys(this.combatants).length === 0) return; // already reset
                    this._endTrials(target, 'Sphinx was defeated');
                    this.combatOverCheck();
                }, 2500);
            }
        }

        target.locked = true;
        target.deathRemovalScheduled = true;
        this.appendCombatLog(`${this.getCombatantLogName(target)} has been defeated.`);

        if (target.type === 'sage') {
            this._endSageCircles(target, 'Sage was defeated');
        }

        // Decrement Resolve by 10 on crew member death
        if (target && !target.isMonster) {
            const meta = getMeta();
            const currentResolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            const penalty = applyResolvePenalty(10);
            meta.resolve = Math.max(0, currentResolve - penalty);
            storeMeta(meta);
            this.appendCombatLog(`Resolve decreased by ${penalty}. Current Resolve: ${meta.resolve}`);
        }

        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
        setTimeout(() => {
            const live = this.combatants[target.id];
            if (live && live.dead) {
                this.removeCombatant(target.id);
            }
        }, this.DEATH_ANIMATION_MS);
        this.combatOverCheck();
    };


    this.tryTriggerReassemble = (combatant) => {
        if (!combatant) return false;
        if ((combatant.type || '').toLowerCase() !== 'skeleton') return false;
        if (combatant.reassembleUsed) return false;
        combatant.reassembleUsed = true;

        if (Math.random() > 0.50) {
            return false;
        }

        combatant.isBones = true;
        combatant.bonesRoundsLeft = 4;
        combatant.bonesTotalRounds = 4;
        combatant.bonesTotalDurationMs = getDurationMsFromRounds(4);
        combatant.bonesEndTimeMs = Date.now() + combatant.bonesTotalDurationMs;
        combatant.bonesMaxHp = 10;
        combatant.originalPortrait = combatant.portrait;
        combatant.portrait = images.bones;
        combatant.originalName = combatant.name;
        combatant.name = `${combatant.name || 'Skeleton'} (Bones)`;
        combatant.originalStartingHp = combatant.starting_hp;
        combatant.starting_hp = combatant.bonesMaxHp;
        if (combatant.stats) {
            combatant.originalStatsHp = combatant.stats.hp;
            combatant.stats.hp = combatant.bonesMaxHp;
        }
        combatant.hp = combatant.bonesMaxHp;

        if (this.animationManager && typeof this.animationManager.triggerVisualAbility === 'function') {
            this.animationManager.triggerVisualAbility(combatant.id, combatant.id, { name: 'reassembly' });
        }

        this.appendCombatLog(`${this.getCombatantLogName(combatant)} collapsed into a pile of bones.`);
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        return true;
    };

    this.combatOverCheck = () => {
        let crewAlive = false;
        let monstersAlive = false;

        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT) return;
            if (c.isMonster) {
                monstersAlive = true;
            } else {
                crewAlive = true;
            }
        });

        if (!crewAlive) {
            this.combatOver = true;
            this.appendCombatLog('Defeat! The crew has fallen.');
            if (this.gameOver) this.gameOver('monstersWin');
            return true;
        }
        if (!monstersAlive) {
            this.combatOver = true;
            this.appendCombatLog('Victory! All enemies defeated.');
            if (this.gameOver) this.gameOver('crewWins');
            return true;
        }
        return false;
    };

    this.connectAnimationManager = (instance) => {
        this.animationManager = instance;
        if (instance) {
            instance.triggerVisualAbility = (unitId, targetId, ability) => {
                this.triggerVisualAbility(unitId, targetId, ability);
            };
        }
    };

    /** Wire the new Sandbox-style AnimationManagerRedux (pure state, no canvas) */
    this.connectAnimationManagerRedux = (instance) => {
        this.animManagerRedux = instance;
    };

    this.triggerVisualAbility = (unitId, targetId, ability) => {
        if (!this.animationManager) return;
        const unit = this.getCombatant(unitId);
        const target = this.getCombatant(targetId);
        if (!unit || !target) return;

        const sourceTileId = this.animationManager.getTileIdByCoords(unit.coordinates);
        let targetCoords = target.coordinates;
        if (target.occupiedCoords && target.occupiedCoords.length > 0) {
            let minDistance = Infinity;
            target.occupiedCoords.forEach(tc => {
                const dist = Math.abs(unit.coordinates.x - tc.x) + Math.abs(unit.coordinates.y - tc.y);
                if (dist < minDistance) {
                    minDistance = dist;
                    targetCoords = tc;
                }
            });
        }
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords);
        
        let facing;
        if (targetCoords.x === unit.coordinates.x) {
            facing = targetCoords.y > unit.coordinates.y ? 'down' : 'up';
        } else {
            facing = targetCoords.x > unit.coordinates.x ? 'right' : 'left';
        }

        let rawName = '';
        if (ability) {
            if (typeof ability === 'string') {
                rawName = ability;
            } else if (typeof ability === 'object') {
                rawName = ability.name || ability.id || '';
            }
        }
        const name = String(rawName).toLowerCase().replace(/\s+/g, '_');

        if (name === 'sword_swing' || name === 'slash') {
            if (typeof this.animationManager.swordSwing === 'function') {
                this.animationManager.swordSwing(targetTileId, sourceTileId, facing);
            }
        } else if (name === 'axe_swing' || name === 'barbarian_slash') {
            if (typeof this.animationManager.axeSwing === 'function') {
                this.animationManager.axeSwing(targetTileId, sourceTileId, facing);
            }
        } else if (name === 'axe_throw') {
            if (typeof this.animationManager.axeThrow === 'function') {
                this.animationManager.axeThrow(targetTileId, sourceTileId, null, null, 'barbarian', 'cutting');
            }
        } else if (name === 'claws' || name === 'bite' || name === 'crush' || name === 'tackle' || name === 'grasp') {
            if (typeof this.animationManager.clawSwipe === 'function') {
                this.animationManager.clawSwipe(targetTileId, sourceTileId, facing);
            }
        } else if (name === 'magic_missile') {
            if (typeof this.animationManager.magicMissile === 'function') {
                this.animationManager.magicMissile(unit.coordinates, target.coordinates, 'major');
            }
        } else if (name === 'energy_blast') {
            if (typeof this.animationManager.energyBlast === 'function') {
                this.animationManager.energyBlast(unit.coordinates, target.coordinates);
            }
        } else if (name === 'fireball') {
            if (typeof this.animationManager.fireball === 'function') {
                this.animationManager.fireball(unit.coordinates, target.coordinates);
            }
        } else if (name === 'heal' || name === 'healing_hymn') {
            if (typeof this.animationManager.magicCircle === 'function') {
                this.animationManager.magicCircle(unit.coordinates, target.coordinates);
            }
        } else if (name === 'deadeye_shot' || name === 'spear_throw') {
            if (typeof this.animationManager.narrowBeamAnimation === 'function') {
                this.animationManager.narrowBeamAnimation(targetTileId, sourceTileId, 'white');
            }
        } else if (name === 'reveal_weakness' || name === 'ice_blast') {
            if (typeof this.animationManager.rippleAnimation === 'function') {
                this.animationManager.rippleAnimation(targetTileId, 'lightblue');
            }
        } else if (name === 'energy_drain') {
            // Use canvas beam animation for visual energy drain
            if (typeof this.animationManager.energyBlast === 'function') {
                this.animationManager.energyBlast(unit.coordinates, target.coordinates);
            } else if (typeof this.animationManager.straightBeamTo === 'function') {
                this.animationManager.straightBeamTo(targetTileId, sourceTileId, 'purple');
            }
        } else if (name === 'induce_fear') {
            // Board-wide ripple on all enemy tiles
            if (typeof this.animationManager.rippleAnimation === 'function') {
                this.animationManager.rippleAnimation(sourceTileId, 'red');
            }
        } else if (name === 'claw_strike') {
            // Canvas claw swipe projectile
            if (typeof this.animationManager.clawSwipe === 'function') {
                this.animationManager.clawSwipe(targetTileId, sourceTileId, facing);
            }
        } else if (['cleave', 'leap_attack', 'disintegrate', 'one_man_army', 'inspire', 'annihilation', 'berserker'].includes(name)) {
            if (typeof this.animationManager.triggerTileAnimationComplex === 'function') {
                this.animationManager.triggerTileAnimationComplex({
                    sourceTileId,
                    targetTileId: ['berserker', 'one_man_army', 'inspire'].includes(name) ? sourceTileId : targetTileId,
                    type: name,
                    facing
                });
            }
        } else if (name === 'whirlwind') {
            if (typeof this.animationManager.triggerWhirlwind === 'function') {
                this.animationManager.triggerWhirlwind(unit, Object.values(this.combatants), () => {});
            }
        } else if (name === 'windmill') {
            if (typeof this.animationManager.triggerWindmill === 'function') {
                this.animationManager.triggerWindmill(unit, Object.values(this.combatants), () => {});
            }
        } else {
            if (typeof this.animationManager.triggerAttackAnimation === 'function') {
                this.animationManager.triggerAttackAnimation({
                    type: name,
                    coordinates: unit.coordinates,
                    facing
                });
            } else if (typeof this.animationManager.clawSwipe === 'function') {
                this.animationManager.clawSwipe(targetTileId, sourceTileId, facing);
            }
        }
    };

    this.connectOverlayManager = (instance) => {
        this.overlayManager = instance;
    };

    // ── Round Turn Processing ─────────────────────────────────────────────────
    // Stagger AI turns by initiative (speed/dexterity); tick down buff durations.
    this.processRoundTurns = () => {
        console.log(`[DEBUG][CombatManagerRedux] processRoundTurns called for round ${this.round}. combatants keys:`, Object.keys(this.combatants));
        Object.values(this.combatants).forEach(c => {
            if (c) {
                console.log(`[DEBUG][CombatManagerRedux] Combatant details - ID: ${c.id}, Name: ${c.name}, Type: ${c.type}, Dead: ${c.dead}, isVCT: ${c.isVCT}, skipAI: ${c.skipAI}, inTrial: ${c.inTrial}, Specials:`, c.specials);
            }
        });

        const activeUnits = Object.values(this.combatants).filter(c => c && !c.dead && c.hp > 0 && !c.isVCT && !c.skipAI && typeof c.inTrial !== 'number');
        console.log('[DEBUG][CombatManagerRedux] activeUnits sorted keys:', activeUnits.map(u => u.id));

        // Sort by speed/dexterity descending (higher dex acts first)
        activeUnits.sort((a, b) => {
            const speedA = a.stats.speed || a.stats.dex || 1;
            const speedB = b.stats.speed || b.stats.dex || 1;
            return speedB - speedA;
        });

        activeUnits.forEach((unit, index) => {
            setTimeout(() => {
                console.log(`[DEBUG][CombatManagerRedux] setTimeout callback fired for unit: ${unit.id} (${unit.type}), dead: ${unit.dead}`);
                try {
                    if (unit.hp <= 0 && !unit.dead) {
                        this.targetKilled(unit);
                    }
                    if (this.combatPaused || this.combatOver || unit.dead) {
                        this.appendCombatLog(`DEBUG: Skip turn for ${unit.name} - paused: ${this.combatPaused}, over: ${this.combatOver}, dead: ${unit.dead}`);
                        return;
                    }

                    // Tick down active buff/debuff durations
                    this._tickUnitBuffs(unit);
                    this._tickUnitDebuffs(unit);

                    // --- SHADOW ARMOR DISPEL CHECK ---
                    if (unit.type === 'wraith' && unit.specials && unit.specials.some(s => s && (s === 'shadow_armor' || s.id === 'shadow_armor' || s.key === 'shadow_armor'))) {
                        const roll = Math.random();
                        const rollSuccess = roll <= 0.35;
                        const hadDebuffs = (unit.activeDebuffs && unit.activeDebuffs.length > 0) || unit.poisoned || unit.bleed || unit.frozen || unit.stunned || unit.feared || unit.asleep || unit.ensnared || unit.marked;
                        console.log(`[DEBUG][Wraith] Dispel check: Wraith ${unit.id} rolled ${roll.toFixed(3)} (needs <= 0.35: ${rollSuccess ? 'SUCCESS' : 'FAILED'}). Had debuffs to dispel: ${hadDebuffs ? 'YES' : 'NO'}`);
                        if (rollSuccess) {
                            if (hadDebuffs) {
                                if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                                    const isLarge = !!(
                                        (typeof unit.large === 'boolean' && unit.large === true)
                                        || (unit.isMonster && unit.isMinion !== true)
                                        || (Array.isArray(unit.occupiedCoords) && unit.occupiedCoords.length > 1)
                                    );
                                    this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'shadow_armor_dispel', isLarge, unit.occupiedCoords, unit.id);
                                }
                                
                                unit.activeDebuffs = [];
                                unit.poisoned = false; unit.poisonRounds = 0; unit.poisonTotalRounds = 0; unit.poisonStackDuration = 0; unit.poisonTotalDurationMs = 0; unit.poisonEndTimeMs = 0;
                                unit.bleed = false; unit.bleedRounds = 0; unit.bleedTotalRounds = 0; unit.bleedStackDuration = 0; unit.bleedTotalDurationMs = 0; unit.bleedEndTimeMs = 0;
                                unit.frozen = false; unit.frozenRounds = 0; unit.frozenTotalRounds = 0; unit.frozenStackDuration = 0; unit.frozenTotalDurationMs = 0; unit.frozenEndTimeMs = 0;
                                unit.stunned = false; unit.stunnedRounds = 0; unit.stunnedTotalRounds = 0; unit.stunnedStackDuration = 0; unit.stunnedTotalDurationMs = 0; unit.stunnedEndTimeMs = 0;
                                unit.feared = false; unit.fearRounds = 0; unit.fearTotalRounds = 0; unit.fearStackDuration = 0; unit.fearTotalDurationMs = 0; unit.fearEndTimeMs = 0;
                                unit.asleep = false; unit.sleepRounds = 0; unit.sleepTotalRounds = 0; unit.sleepTotalDurationMs = 0; unit.sleepEndTimeMs = 0;
                                unit.ensnared = false; unit.ensnaredRounds = 0; unit.ensnaredTotalRounds = 0; unit.ensnaredStackDuration = 0; unit.ensnaredTotalDurationMs = 0; unit.ensnaredEndTimeMs = 0;
                                unit.marked = false; unit.markedRounds = 0; unit.markedTotalRounds = 0; unit.markedStackDuration = 0; unit.markedTotalDurationMs = 0; unit.markedEndTimeMs = 0;
                                
                                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Shadow Armor dispelled all debuffs!`);
                                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                            }
                        }
                    }

                    // Incapacitation check
                    if (unit.frozen || (unit.stunned && !unit.feared) || unit.petrified || unit.isBones) {
                        if (unit.isBones) {
                            this.appendCombatLog(`${this.getCombatantLogName(unit)} is a pile of bones and cannot act.`);
                            return;
                        }
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} is incapacitated and skips this round.`);
                        // Still tick down the incapacitation
                        if (unit.frozenRounds > 0) {
                            unit.frozenRounds--;
                            if (unit.frozenRounds <= 0) {
                                unit.frozen = false;
                                unit.frozenRounds = 0;
                                unit.frozenTotalRounds = 0;
                                unit.frozenStackDuration = 0;
                                unit.frozenTotalDurationMs = 0;
                                unit.frozenEndTimeMs = 0;
                            }
                        }
                        if (unit.stunnedRounds > 0) {
                            unit.stunnedRounds--;
                            if (unit.stunnedRounds <= 0) {
                                unit.stunned = false;
                                unit.stunnedRounds = 0;
                                unit.stunnedTotalRounds = 0;
                                unit.stunnedStackDuration = 0;
                                unit.stunnedTotalDurationMs = 0;
                                unit.stunnedEndTimeMs = 0;
                                unit.feared = false;
                                unit.fearRounds = 0;
                                unit.fearTotalRounds = 0;
                                unit.fearTotalDurationMs = 0;
                                unit.fearEndTimeMs = 0;
                                unit.asleep = false;
                                unit.sleepRounds = 0;
                                unit.sleepTotalRounds = 0;
                                unit.sleepTotalDurationMs = 0;
                                unit.sleepEndTimeMs = 0;
                            }
                        }
                        if (unit.petrifiedRounds > 0) { unit.petrifiedRounds--; if (unit.petrifiedRounds <= 0) { unit.petrified = false; } }
                        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                        return;
                    }

                    // Morale Broken check: 10% chance to skip turn entirely
                    if (unit && !unit.isMonster) {
                        const meta = getMeta();
                        const resolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
                        // Inspired units are immune to resolve breaks
                        const isInspired = unit.inspiredActive ||
                            (unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'Inspire'));
                        if (!isInspired && resolve < 20 && Math.random() < 0.10) {
                            this.appendCombatLog(`${this.getCombatantLogName(unit)}'s resolve is broken! They refuse to act this turn.`);
                            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                            return;
                        }
                    }

                    // Execute class-specific AI decision tree if not under manual control
                    if (!unit.manualControl) {
                        this.executeUnitAI(unit);
                    }
                } catch (err) {
                    this.appendCombatLog(`ERROR in unit ${unit.name} AI: ${err.message}`);
                    console.error(err);
                }
            }, index * 220); // 220ms stagger between unit turns
        });
    };

    // ── Buff Duration Tick ────────────────────────────────────────────────────
    this._tickUnitBuffs = (unit) => {
        if (!unit.activeBuffs) unit.activeBuffs = [];
        unit.activeBuffs = unit.activeBuffs.filter(buff => {
            if (buff.roundsLeft <= 0) {
                // Revert stat changes when buff expires
                this._revertBuff(unit, buff);
                // Clear inspire flag on expiry
                if (buff.name === 'Inspire') {
                    unit.inspiredActive = false;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer Inspired.`);
                } else if (buff.name === 'barbarian_berserker') {
                    unit.berserkerActive = false;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer Berserk.`);
                } else if (buff.name === 'New Moon') {
                    unit.newMoonBuff = false;
                    unit.newMoonAtkBoost = 0;
                    unit.newMoonFearChance = 0;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer under the New Moon.`);
                } else {
                    this.appendCombatLog(`${this.getCombatantLogName(unit)}'s ${buff.name} has worn off.`);
                }
                return false;
            }
            // Per-round Inspire effects: endurance regen + flag
            if (buff.name === 'Inspire') {
                unit.inspiredActive = true;
                const regenAmt = Math.round((unit.maxEndurance || 100) * 0.10);
                unit.endurance = Math.min(unit.maxEndurance || 100, (unit.endurance || 0) + regenAmt);
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is Inspired — stamina restored by ${regenAmt}.`);
            }
            buff.roundsLeft--;
            return true;
        });
    };

    this._tickUnitDebuffs = (unit) => {
        if (!unit.activeDebuffs) unit.activeDebuffs = [];
        unit.activeDebuffs = unit.activeDebuffs.filter(debuff => {
            if (debuff.roundsLeft <= 0) {
                // Revert stat changes when debuff expires
                this._revertDebuff(unit, debuff);
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s ${debuff.name} has worn off.`);
                return false;
            }
            debuff.roundsLeft--;
            return true;
        });

        // Tick down custom debuffs
        if (unit.weaknessRevealed && typeof unit.weaknessRevealedRounds === 'number') {
            unit.weaknessRevealedRounds--;
            if (unit.weaknessRevealedRounds <= 0) {
                unit.weaknessRevealed = false;
                unit.weaknessRevealedRounds = 0;
                unit.weaknessRevealedTotalRounds = 0;
                unit.weaknessRevealedStackDuration = 0;
                unit.weaknessRevealedTotalDurationMs = 0;
                unit.weaknessRevealedEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s exposed weakness has faded.`);
            }
        }
        if (unit.ensnared && typeof unit.ensnaredRounds === 'number') {
            unit.ensnaredRounds--;
            if (unit.ensnaredRounds <= 0) {
                unit.ensnared = false;
                unit.ensnaredRounds = 0;
                unit.ensnaredTotalRounds = 0;
                unit.ensnaredStackDuration = 0;
                unit.ensnaredTotalDurationMs = 0;
                unit.ensnaredEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer ensnared.`);
            }
        }
        if (unit.marked && typeof unit.markedRounds === 'number') {
            unit.markedRounds--;
            if (unit.markedRounds <= 0) {
                unit.marked = false;
                unit.markedRounds = 0;
                unit.markedTotalRounds = 0;
                unit.markedStackDuration = 0;
                unit.markedTotalDurationMs = 0;
                unit.markedEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s mark has expired.`);
            }
        }
        if (unit.hexed && typeof unit.hexRounds === 'number') {
            unit.hexRounds--;
            if (unit.hexRounds <= 0) {
                unit.hexed = false;
                unit.hexRounds = 0;
                unit.hexTotalRounds = 0;
                unit.hexTotalDurationMs = 0;
                unit.hexEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Hex has expired.`);
            }
        }
        if (unit.silenced && typeof unit.silenceRounds === 'number') {
            unit.silenceRounds--;
            if (unit.silenceRounds <= 0) {
                unit.silenced = false;
                unit.silenceRounds = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer silenced.`);
            }
        }
        if (unit.demonMarked && typeof unit.demonMarkedRounds === 'number') {
            unit.demonMarkedRounds--;
            if (unit.demonMarkedRounds <= 0) {
                unit.demonMarked = false;
                unit.demonMarkedRounds = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Demon Mark has faded.`);
            }
        }
        if (unit.feared && typeof unit.fearRounds === 'number') {
            unit.fearRounds--;
            if (unit.stunnedRounds > 0) unit.stunnedRounds--;
            if (unit.fearRounds <= 0 || unit.stunnedRounds <= 0) {
                unit.feared = false;
                unit.fearRounds = 0;
                unit.stunned = false;
                unit.stunnedRounds = 0;
                unit.stunnedTotalRounds = 0;
                unit.stunnedStackDuration = 0;
                unit.stunnedTotalDurationMs = 0;
                unit.stunnedEndTimeMs = 0;
                unit.fearTotalRounds = 0;
                unit.fearTotalDurationMs = 0;
                unit.fearEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer terrified.`);
            }
        }
        if (unit.polymorphed && typeof unit.polymorphRounds === 'number') {
            unit.polymorphRounds--;
            if (unit.polymorphRounds <= 0) {
                unit.polymorphed = false;
                unit.polymorphRounds = 0;
                unit.stunned = false;
                unit.stunnedRounds = 0;
                unit.stunnedTotalRounds = 0;
                unit.stunnedStackDuration = 0;
                unit.stunnedTotalDurationMs = 0;
                unit.stunnedEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer polymorphed.`);
            }
        }
        if (unit.poison && typeof unit.poisonRounds === 'number') {
            unit.poisonRounds--;
            const poisonDmg = 4;
            unit.hp = Math.max(0, unit.hp - poisonDmg);
            unit.damageIndicators = unit.damageIndicators || [];
            unit.damageIndicators.push({
                id: Date.now() + Math.random(),
                value: `-${poisonDmg}`,
                source: 'Poison',
                type: 'damage'
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} takes ${poisonDmg} poison damage.`);
            if (unit.hp <= 0) {
                this.targetKilled(unit);
            }
            if (unit.poisonRounds <= 0) {
                unit.poison = false;
                unit.poisonRounds = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer poisoned.`);
            }
        }
        if (unit.bleed && typeof unit.bleedRounds === 'number') {
            unit.bleedRounds--;
            const isAffectedByCrimsonSight = Object.values(this.combatants).some(enemy =>
                enemy && !enemy.dead && (!!enemy.isMonster !== !!unit.isMonster) &&
                enemy.activeBuffs && enemy.activeBuffs.some(b => b.name === 'Crimson Sight')
            );
            const bleedDebuff = unit.activeDebuffs ? unit.activeDebuffs.find(d => d.name === 'bleed') : null;
            const stacks = bleedDebuff && bleedDebuff.stacks ? bleedDebuff.stacks : 1;
            const bleedDmg = (isAffectedByCrimsonSight ? 10 : 5) * stacks;
            unit.hp = Math.max(0, unit.hp - bleedDmg);
            unit.damageIndicators = unit.damageIndicators || [];
            unit.damageIndicators.push({
                id: Date.now() + Math.random(),
                value: `-${bleedDmg}`,
                source: 'Bleed',
                type: 'damage'
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} takes ${bleedDmg} bleed damage${isAffectedByCrimsonSight ? ' (Crimson Sight double damage!)' : ''}.`);
            if (unit.hp <= 0) {
                this.targetKilled(unit);
            }
            if (unit.bleedRounds <= 0) {
                unit.bleed = false;
                unit.bleedRounds = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer bleeding.`);
            }
        }
    };

    this._revertDebuff = (unit, debuff) => {
        if (!debuff.statChanges) return;
        Object.entries(debuff.statChanges).forEach(([stat, amount]) => {
            unit.stats[stat] = (unit.stats[stat] || 0) + amount;
        });
    };

    this._applyBuff = (unit, buffDef, name, durationRounds) => {
        if (!unit.activeBuffs) unit.activeBuffs = [];
        const durationMs = getStatusDurationMs(unit, durationRounds);
        const now = Date.now();
        const existing = unit.activeBuffs.find(b => b.name === name);
        if (existing) {
            existing.roundsLeft += durationRounds;
            existing.totalRounds = (existing.totalRounds || existing.roundsLeft) + durationRounds;
            existing.singleDurationRounds = durationRounds;
            const newDurationMs = getStatusDurationMs(unit, existing.roundsLeft);
            existing.totalDurationMs = newDurationMs;
            existing.endTimeMs = now + newDurationMs;
            return;
        }

        const applied = {
            name,
            roundsLeft: durationRounds,
            totalRounds: durationRounds,
            singleDurationRounds: durationRounds,
            totalDurationMs: durationMs,
            endTimeMs: now + durationMs,
            statChanges: {}
        };
        if (buffDef && buffDef.increase_stats && Array.isArray(buffDef.increase_stats.stats)) {
            buffDef.increase_stats.stats.forEach((entry, idx) => {
                let statName, amount;
                if (typeof entry === 'object' && entry !== null) {
                    // New format: { stat: 'atk', amount: 12 }
                    statName = entry.stat;
                    amount = entry.amount;
                } else {
                    // Legacy format: stats: ['atk'], amounts: [12]
                    statName = entry;
                    amount = Array.isArray(buffDef.increase_stats.amounts)
                        ? buffDef.increase_stats.amounts[idx]
                        : 0;
                }
                if (statName && amount) {
                    unit.stats[statName] = (unit.stats[statName] || 0) + amount;
                    applied.statChanges[statName] = (applied.statChanges[statName] || 0) + amount;
                }
            });
        }
        if (name === 'barbarian_berserker') {
            unit.berserkerActive = true;
        }
        unit.activeBuffs.push(applied);
    };

    this._revertBuff = (unit, buff) => {
        if (!buff.statChanges) return;
        Object.entries(buff.statChanges).forEach(([stat, amount]) => {
            unit.stats[stat] = Math.max(0, (unit.stats[stat] || 0) - amount);
        });
    };

    this._applyDebuff = (unit, nerfDef, name, durationRounds) => {
        if (!unit.activeDebuffs) unit.activeDebuffs = [];
        const durationMs = getStatusDurationMs(unit, durationRounds);
        const now = Date.now();
        const existing = unit.activeDebuffs.find(d => d.name === name);
        if (existing) {
            if (name === 'bleed') {
                existing.stacks = (existing.stacks || 1) + 1;
            } else {
                existing.roundsLeft += durationRounds;
                existing.totalRounds = (existing.totalRounds || existing.roundsLeft) + durationRounds;
                existing.singleDurationRounds = durationRounds;
                const newDurationMs = getStatusDurationMs(unit, existing.roundsLeft);
                existing.totalDurationMs = newDurationMs;
                existing.endTimeMs = now + newDurationMs;
            }
            return;
        }

        const applied = {
            name,
            stacks: 1,
            roundsLeft: durationRounds,
            totalRounds: durationRounds,
            singleDurationRounds: durationRounds,
            totalDurationMs: durationMs,
            endTimeMs: now + durationMs,
            statChanges: {}
        };
        if (nerfDef && nerfDef.decrease_stats && Array.isArray(nerfDef.decrease_stats.stats)) {
            nerfDef.decrease_stats.stats.forEach(({ stat, amount, isPercent }) => {
                const reduction = isPercent ? Math.round((unit.stats[stat] || 0) * (amount / 100)) : amount;
                unit.stats[stat] = Math.max(0, (unit.stats[stat] || 0) - reduction);
                applied.statChanges[stat] = (applied.statChanges[stat] || 0) + reduction;
            });
        }
        unit.activeDebuffs.push(applied);
    };

    // ── Main AI Entry Point ───────────────────────────────────────────────────
    // Routes each unit through their class-specific decision logic.
    this.executeUnitAI = (unit) => {
        if (!unit || unit.dead) return;

        // Fear movement override
        if (unit.feared) {
            unit.targetId = null;
            const targetX = unit.isMonster ? MAX_DEPTH : 0;
            const cornerY = Math.abs(unit.coordinates.y - 0) <= Math.abs(unit.coordinates.y - (MAX_LANES - 1)) ? 0 : MAX_LANES - 1;
            this.moveCloserToCoord(unit, targetX, cornerY);
            return;
        }

        const unitType = unit.type || unit.image || '';
        if (unitType === 'dragon_egg' || unitType === 'trials_icon' || unit.isTrialIcon) {
            return;
        }

        switch (unitType) {
            case 'monk':     return this._aiMonk(unit);
            case 'soldier':  return this._aiSoldier(unit);
            case 'barbarian':return this._aiBarbarian(unit);
            case 'wizard':   return this._aiWizard(unit);
            case 'sage':     return this._aiSage(unit);
            case 'ranger':   return this._aiRanger(unit);
            case 'summoner': return this._aiSummoner(unit);
            case 'vampire':  return this._aiVampire(unit);
            case 'sphinx':   return this._aiSphinx(unit);
            case 'ogre':     return this._aiOgre(unit);
            case 'dragon':   return this._aiDragon(unit);
            case 'beholder_minion': return this._aiBeholderMinion(unit);
            case 'goat_demon': return this._aiGoatDemon(unit);
            default:         return this._aiGeneric(unit);
        }
    };

    // ── Utility: resolve ability key from specials array ──────────────────────
    this._initializeInitialCooldowns = (combatant) => {
        if (!combatant || !Array.isArray(combatant.specials)) return;
        combatant.cooldowns = combatant.cooldowns || {};
        const roundDurSec = this.roundDurationMs / 1000;
        combatant.specials.forEach(s => {
            const key = this._resolveAbilityKey(s);
            if (!key) return;
            const resolved = this.resolveSpecial(combatant, key);
            if (resolved && key !== 'slash') {
                let initial = 0;
                if (typeof resolved.initialCooldown === 'number') {
                    initial = resolved.initialCooldown;
                } else if (typeof resolved.tier === 'number' && resolved.tier >= 1) {
                    initial = (resolved.tier * 2) - 1;
                }
                
                if (initial > 0) {
                    combatant.cooldowns[key] = initial * roundDurSec;
                }
            }
            // Custom Sphinx magic_missile initial cooldown wait period of 4 rounds
            const isSphinx = combatant.type === 'sphinx' || combatant.key === 'sphinx' || (combatant.id && combatant.id.toString().includes('sphinx'));
            if (isSphinx && key === 'magic_missile') {
                combatant.cooldowns[key] = 4 * roundDurSec;
            }
        });
    };

    this._resolveAbilityKey = (s) => {
        if (!s) return null;
        if (typeof s === 'string') return s.replace(/\s+/g, '_').toLowerCase();
        return (s.id || s.key || (s.name && typeof s.name === 'string' && s.name.replace(/\s+/g, '_').toLowerCase()) || null);
    };

    // Returns true if the ability is off cooldown and available
    this._abilityReady = (unit, abilityKey) => {
        if (!abilityKey) return false;
        if (unit.cooldowns[abilityKey]) return false;

        const normalize = (s) => String(s || '').replace(/\s+/g, '_').toLowerCase();
        const normKey = normalize(abilityKey);

        const hasSpecial = Array.isArray(unit.specials) && unit.specials.some(s => {
            if (typeof s === 'string') return normalize(s) === normKey;
            if (typeof s === 'object' && s) return normalize(s.id || s.key || s.name) === normKey;
            return false;
        });
        const hasAttack = Array.isArray(unit.attacks) && unit.attacks.some(a => {
            if (typeof a === 'string') return normalize(a) === normKey;
            if (typeof a === 'object' && a) return normalize(a.id || a.key || a.name) === normKey;
            return false;
        });

        return hasSpecial || hasAttack;
    };

    // Returns first ready special matching any of the provided keys
    this._pickReadyAbility = (unit, ...keys) => {
        for (const key of keys) {
            if (!key) continue;
            const normalized = key.replace(/\s+/g, '_').toLowerCase();
            if (!this._abilityReady(unit, normalized)) continue;
            const resolved = this.resolveSpecial(unit, normalized);
            if (resolved) return { resolved, key: normalized };
        }
        return null;
    };

    // Scores all ready specials and returns the highest-utility one
    this._scoredAbilityPick = (unit, target) => {
        if (unit.silenced) return null;
        if (!Array.isArray(unit.specials) || unit.specials.length === 0) return null;

        const selfHpPct = unit.starting_hp > 0 ? unit.hp / unit.starting_hp : 1;
        const enemyCount = this.countEnemies(unit);
        const woundedAlly = this.findWoundedAlly(unit);

        let best = null;
        let bestScore = -Infinity;

        unit.specials.forEach(s => {
            const key = this._resolveAbilityKey(s);
            if (!key || !this._abilityReady(unit, key)) return;
            if (key === 'barbarian_leap_attack' && target && this.targetInRange(unit, target, 'close')) return;
            const resolved = this.resolveSpecial(unit, key);
            if (!resolved || resolved.type === 'passive' || resolved.isPassive) return;

            let score = 0;
            const effects = Array.isArray(resolved.effect) ? resolved.effect : (resolved.effect ? [resolved.effect] : []);

            // Healing
            if (resolved.type === 'heal' || key === 'heal' || key === 'monk_meditate') {
                const woundedPct = woundedAlly ? (woundedAlly.hp / woundedAlly.starting_hp) : 1;
                score += (1 - woundedPct) * 30;
                if (woundedPct < 0.4) score += 20; // urgent heal bonus
            }

            // Self-buffs / Buffs
            else if (resolved.type === 'buff' || effects.some(e => typeof e === 'string' && e.includes('buff_self'))) {
                score += selfHpPct > 0.3 ? 12 : 4;
            }

            // Debuffs
            else if (resolved.type === 'debuff' || (resolved.type && resolved.type.includes('debuff')) || effects.some(e => typeof e === 'object' && e.type)) {
                score += 10 + enemyCount * 2;
                if (target) {
                    const isStunnedOrFrozen = target.stunned || target.frozen;
                    if (!isStunnedOrFrozen) score += 8;
                }
            }

            // Damage
            else if (resolved.type === 'damage' || (resolved.type && resolved.type.includes('damage'))) {
                score += 8;
                if (resolved.damage > 25) score += 6;
                if (target) {
                    const targetHpPct = target.starting_hp > 0 ? target.hp / target.starting_hp : 1;
                    if (targetHpPct < 0.25) score += 10;
                }
            }

            // Utility (like summons)
            else if (resolved.type === 'utility') {
                score += 10;
                const minionCount = Object.values(this.combatants).filter(c => c && !c.dead && c.isMinion).length;
                if (minionCount < 3) score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                best = { resolved, key };
            }
        });
        return best;
    };

    // ── Class AI Implementations ──────────────────────────────────────────────

    // MONK: Close-range brawler with astral state gating for advanced skills
    this._aiMonk = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const isLowHp = unit.hp <= (unit.starting_hp || 1) * 0.4;
        const meditateReady = this._abilityReady(unit, 'monk_meditate');
        
        if (isLowHp && meditateReady) {
            // Find if we are already in one of the corners of the grid
            const corners = [
                { x: 0, y: 0 },
                { x: 0, y: MAX_LANES - 1 },
                { x: MAX_DEPTH, y: 0 },
                { x: MAX_DEPTH, y: MAX_LANES - 1 }
            ];
            const inCorner = corners.some(c => c.x === unit.coordinates.x && c.y === unit.coordinates.y);
            
            if (!inCorner && this._abilityReady(unit, 'monk_astral_projection')) {
                // Find an unoccupied corner to project to
                const targetCorner = corners.find(c => !this.isTileOccupied(c.x, c.y, unit.id));
                if (targetCorner) {
                    const pick = this.resolveSpecial(unit, 'monk_astral_projection');
                    if (pick) {
                        unit.astralProjectionActive = true;
                        this.updateUnitCoordinates(unit, targetCorner.x, targetCorner.y);
                        unit.movesTakenThisRound += 1;
                        this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'astral_projection_move');
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} projects to safety in the corner (${targetCorner.x},${targetCorner.y}).`);
                        this.useAbility(unit, pick, target);
                        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                        setTimeout(() => {
                            if (this.combatants[unit.id]) {
                                this.combatants[unit.id].astralProjectionActive = false;
                                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                            }
                        }, 1300);
                        return;
                    }
                }
            }
            
            // Meditate if already in corner, or if projection failed/not ready
            const meditate = this.resolveSpecial(unit, 'monk_meditate');
            if (meditate) {
                this.useAbility(unit, meditate, unit);
                return;
            }
        }

        // Keep standard fallback meditate if endurance is low
        if (unit.endurance <= (unit.maxEndurance || 1) * 0.4 && meditateReady) {
            const meditate = this.resolveSpecial(unit, 'monk_meditate');
            if (meditate) {
                this.useAbility(unit, meditate, unit);
                return;
            }
        }

        // Priority 0: Ethereal Speed (speed buff and yellow glow)
        if (this._abilityReady(unit, 'monk_ethereal_speed') && !unit.etherealSpeedActive) {
            const pick = this.resolveSpecial(unit, 'monk_ethereal_speed');
            if (pick) {
                const dur = getDurationRounds(pick.duration || 'short');
                const durMs = getDurationMsFromRounds(dur);
                unit.etherealSpeedActive = true;
                unit.etherealSpeedRoundsLeft = dur;
                unit.etherealSpeedTotalRounds = dur;
                unit.etherealSpeedTotalDurationMs = durMs;
                unit.etherealSpeedEndTimeMs = Date.now() + durMs;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} activates Ethereal Speed — glowing with power!`);
                this._setCooldown(unit, 'monk_ethereal_speed', pick.cooldown || 15);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }
        }

        // Tick Ethereal Speed timer
        if (unit.etherealSpeedActive) {
            unit.etherealSpeedRoundsLeft = (unit.etherealSpeedRoundsLeft || 1) - 1;
            if (unit.etherealSpeedRoundsLeft <= 0) {
                unit.etherealSpeedActive = false;
                unit.etherealSpeedRoundsLeft = 0;
                unit.etherealSpeedTotalRounds = 0;
                unit.etherealSpeedTotalDurationMs = 0;
                unit.etherealSpeedEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Ethereal Speed fades.`);
            }
        }

        // Astral Being: required for third_eye and projection; entered via astral_focus
        const astralActive = !!unit.astralBeingActive;

        // Priority 1: Scored ability selection (punch, flurry, force punch flurry, etc.)
        const scored = this._scoredAbilityPick(unit, target);
        const inRange = target && this.targetInRange(unit, target, 'close');

        // Prioritize punch and close melee attacks if ready and in range
        if (inRange && scored && scored.resolved.range === 'close') {
            this.useAbility(unit, scored.resolved, target);
            return;
        }

        // Priority 2: If not in astral mode and no close attack was triggered, consider entering astral focus
        if (!astralActive && this._abilityReady(unit, 'monk_astral_focus')) {
            const pick = this.resolveSpecial(unit, 'monk_astral_focus');
            if (pick && unit.hp / unit.starting_hp > 0.5) { // don't focus if low HP
                const dur = getDurationRounds(pick.duration || 'long');
                const durMs = getDurationMsFromRounds(dur);
                this._applyBuff(unit, pick.buff || {}, 'astral_being', dur);
                unit.astralBeingActive = true;
                unit.astralBeingRoundsLeft = dur;
                unit.astralBeingTotalRounds = dur;
                unit.astralBeingTotalDurationMs = durMs;
                unit.astralBeingEndTimeMs = Date.now() + durMs;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} enters Astral Being mode.`);
                this._setCooldown(unit, 'monk_astral_focus', pick.cooldown || 60);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                // Astral focus is a concentrative action — no attack this round
                return;
            }
        }

        // Tick astral being timer
        if (astralActive) {
            unit.astralBeingRoundsLeft = (unit.astralBeingRoundsLeft || 1) - 1;
            if (unit.astralBeingRoundsLeft <= 0) {
                unit.astralBeingActive = false;
                unit.astralBeingRoundsLeft = 0;
                unit.astralBeingTotalRounds = 0;
                unit.astralBeingTotalDurationMs = 0;
                unit.astralBeingEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Astral Being mode ends.`);
                // Cancel any active astral skills
                ['monk_third_eye', 'monk_astral_projection'].forEach(k => {
                    if (unit.astralSkills && unit.astralSkills[k]) {
                        unit.astralSkills[k] = false;
                        this.appendCombatLog(`${this.getCombatantLogName(unit)}'s ${k.replace(/_/g,' ')} ends with Astral Being.`);
                    }
                });
            }
        }

        // Priority 2: Third Eye (astral mode, evasion buff)
        if (astralActive && this._abilityReady(unit, 'monk_third_eye') && !unit.thirdEyeActive) {
            const pick = this.resolveSpecial(unit, 'monk_third_eye');
            if (pick) {
                const dur = getDurationRounds(pick.duration || 'short');
                const durMs = getDurationMsFromRounds(dur);
                unit.thirdEyeActive = true;
                unit.thirdEyeRoundsLeft = dur;
                unit.thirdEyeTotalRounds = dur;
                unit.thirdEyeTotalDurationMs = durMs;
                unit.thirdEyeEndTimeMs = Date.now() + durMs;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} activates Third Eye — evasion doubled.`);
                this._setCooldown(unit, 'monk_third_eye', pick.cooldown || 15);
                if (!unit.astralSkills) unit.astralSkills = {};
                unit.astralSkills.monk_third_eye = true;
            }
        }

        // Tick third eye duration
        if (unit.thirdEyeActive) {
            unit.thirdEyeRoundsLeft = (unit.thirdEyeRoundsLeft || 1) - 1;
            if (unit.thirdEyeRoundsLeft <= 0) {
                unit.thirdEyeActive = false;
                unit.thirdEyeRoundsLeft = 0;
                unit.thirdEyeTotalRounds = 0;
                unit.thirdEyeTotalDurationMs = 0;
                unit.thirdEyeEndTimeMs = 0;
                if (unit.astralSkills) unit.astralSkills.monk_third_eye = false;
            }
        }

        // Priority 3: Astral Projection (dash strike)
        if (astralActive && this._abilityReady(unit, 'monk_astral_projection')) {
            const pick = this.resolveSpecial(unit, 'monk_astral_projection');
            if (pick) {
                // Move to random tile within 2 steps toward target
                this._astralProjectionMove(unit, target);
                this.useAbility(unit, pick, target);
                if (!unit.astralSkills) unit.astralSkills = {};
                unit.astralSkills.monk_astral_projection = true;
                return;
            }
        }

        // Fallback: If not in range, move closer and attack if possible
        if (!inRange) {
            this.moveCloser(unit, target);
            const nowInRange = this.targetInRange(unit, target, 'close');
            if (nowInRange) {
                if (scored) this.useAbility(unit, scored.resolved, target);
                else this._basicAttack(unit, target);
            }
        } else {
            // Already in range but scored close attack was not used (or none ready); basic attack.
            this._basicAttack(unit, target);
        }
    };

    this._astralProjectionMove = (unit, target) => {
        // Flag for CSS shimmer animation during the slide
        unit.astralProjectionActive = true;
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));

        // Move to a random tile within 2 steps in any direction
        const offsets = [];
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                if (Math.abs(dx) + Math.abs(dy) <= 2 && (dx !== 0 || dy !== 0)) {
                    offsets.push({ dx, dy });
                }
            }
        }
        // Shuffle and find first unoccupied tile
        offsets.sort(() => Math.random() - 0.5);
        for (const { dx, dy } of offsets) {
            const nx = unit.coordinates.x + dx;
            const ny = unit.coordinates.y + dy;
            if (nx < 0 || nx > MAX_DEPTH || ny < 0 || ny >= MAX_LANES) continue;
            const blocked = this.isTileOccupied(nx, ny, unit.id);
            if (!blocked) {
                this.updateUnitCoordinates(unit, nx, ny);
                unit.movesTakenThisRound += 1;
                this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'astral_projection_move');
                this.appendCombatLog(`${this.getCombatantLogName(unit)} projects to (${nx},${ny}).`);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                break;
            }
        }

        // Clear astral projection flag after the CSS slide completes (~1.3s)
        setTimeout(() => {
            if (this.combatants[unit.id]) {
                this.combatants[unit.id].astralProjectionActive = false;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }
        }, 1300);
    };


    // SOLDIER: Frontline tank. Shield wall when multiple enemies, force back to create space.
    this._aiSoldier = (unit) => {
        // Tick shield wall timer
        if (unit.shieldWallActive) {
            unit.shieldWallRoundsLeft = (unit.shieldWallRoundsLeft || 1) - 1;
            if (unit.shieldWallRoundsLeft <= 0) {
                unit.shieldWallActive = false;
                unit.shieldWallRoundsLeft = 0;
                unit.shieldWallTotalRounds = 0;
                unit.shieldWallTotalDurationMs = 0;
                unit.shieldWallEndTimeMs = 0;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Shield Wall collapses.`);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} maintains Shield Wall.`);
                return; // stands perfectly still, skips turn actions/movement
            }
        }

        this.acquireTarget(unit, false); // soldiers go for closest, not weakest
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const enemyCount = this.countEnemies(unit);
        const selfHpPct = unit.starting_hp > 0 ? unit.hp / unit.starting_hp : 1;

        // Priority 1: Shield wall when facing 3+ enemies and HP decent
        if (enemyCount >= 3 && selfHpPct > 0.5 && this._abilityReady(unit, 'shield_wall')) {
            const pick = this.resolveSpecial(unit, 'shield_wall');
            if (pick) {
                const durationRounds = pick.duration || 4;
                const durMs = getDurationMsFromRounds(durationRounds);
                unit.shieldWallActive = true;
                unit.shieldWallRoundsLeft = durationRounds;
                unit.shieldWallTotalRounds = durationRounds;
                unit.shieldWallTotalDurationMs = durMs;
                unit.shieldWallEndTimeMs = Date.now() + durMs;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} erects Shield Wall!`);
                this._setCooldown(unit, 'shield_wall', pick.cooldown || 15);
                unit.actionsTakenThisRound += 1;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 2: Inspire — use when: ability is ready AND (resolve is low OR any ally has low endurance)
        if (this._abilityReady(unit, 'inspire')) {
            const meta = getMeta();
            const partyResolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            const allies = Object.values(this.combatants).filter(
                c => c && !c.dead && !c.isMonster && !c.isMinion && c.id !== unit.id
            );
            const anyAllyLowEndurance = allies.some(
                c => (c.endurance || 0) < (c.maxEndurance || 100) * 0.5
            );
            const shouldInspire = partyResolve < 60 || anyAllyLowEndurance || allies.length >= 2;
            if (shouldInspire) {
                const pick = this.resolveSpecial(unit, 'inspire') || {
                    id: 'inspire', name: 'Inspire', cooldown: 10, range: 'medium', duration: 'long'
                };
                return this.useAbility(unit, pick, unit);
            }
        }

        // Priority 3: Force back to push enemies away
        if (this._abilityReady(unit, 'force_back') && this.targetInRange(unit, target, 'close')) {
            const pick = this.resolveSpecial(unit, 'force_back');
            if (pick) {
                this._pushEnemies(unit);
                this.useAbility(unit, pick, target);
                return;
            }
        }

        // Default: advance and attack
        if (!this.targetInRange(unit, target, 'close')) {
            this.moveCloser(unit, target);
        }
        if (this.targetInRange(unit, target, 'close')) {
            const scored = this._scoredAbilityPick(unit, target);
            if (scored) this.useAbility(unit, scored.resolved, target);
            else this._basicAttack(unit, target);
        }
    };

    this._pushEnemies = (unit) => {
        // Push all enemies in the 3 forward-facing tiles one tile away
        const forwardDir = unit.isMonster ? -1 : 1;
        Object.values(this.combatants).forEach(c => {
            const isEnemy = (!!unit.isMonster !== !!c.isMonster);
            if (!isEnemy) return;
            const dx = c.coordinates.x - unit.coordinates.x;
            const dy = Math.abs(c.coordinates.y - unit.coordinates.y);
            if (Math.abs(dx) <= 1 && dy <= 1) {
                // Push one tile further away
                const nx = c.coordinates.x + forwardDir;
                if (this.canFitAt(c, nx, c.coordinates.y)) {
                    if (this.shouldPushbackSucceed(c)) {
                        this.updateUnitCoordinates(c, nx, c.coordinates.y);
                        this.appendCombatLog(`${this.getCombatantLogName(c)} is pushed back!`);
                    } else {
                        this.appendCombatLog(`${this.getCombatantLogName(c)} resisted the push back!`);
                    }
                }
            }
        });
    };

    // BARBARIAN: High-damage melee. Berserks when hp < 40% or 3+ enemies.
    this._aiBarbarian = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const selfHpPct = unit.starting_hp > 0 ? unit.hp / unit.starting_hp : 1;
        const enemyCount = this.countEnemies(unit);

        // Priority 1: Berserker mode when low HP or many enemies
        if ((selfHpPct < 0.4 || enemyCount >= 3) && this._abilityReady(unit, 'barbarian_berserker')) {
            const pick = this.resolveSpecial(unit, 'barbarian_berserker');
            if (pick) {
                this._applyBuff(unit, pick.buff || {}, 'barbarian_berserker', getDurationRounds(pick.duration || 'long'));
                this.appendCombatLog(`${this.getCombatantLogName(unit)} enters BERSERKER rage!`);
                this._setCooldown(unit, 'barbarian_berserker', pick.cooldown || 12);
            }
        }

        // Priority 2: Leap Attack to close the gap if not adjacent but within medium range (3 tiles)
        const isAdjacent = this.targetInRange(unit, target, 'close');
        const leapReady = this._abilityReady(unit, 'barbarian_leap_attack');
        if (!isAdjacent && leapReady && this.targetInRange(unit, target, 'far')) {
            const pick = this.resolveSpecial(unit, 'barbarian_leap_attack');
            if (pick) {
                this.useAbility(unit, pick, target);
                return;
            }
        }

        // Default: charge and attack using scored ability
        const scored = this._scoredAbilityPick(unit, target);
        const range = (scored && scored.resolved.range) || 'close';

        if (!this.targetInRange(unit, target, range)) {
            this.moveCloser(unit, target);
        }
        if (this.targetInRange(unit, target, range)) {
            if (scored) this.useAbility(unit, scored.resolved, target);
            else this._basicAttack(unit, target);
        }
    };

    // WIZARD: Ranged caster. Stays at distance, uses AoE and single-target spells.
    this._aiWizard = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        // Wizards prefer medium/long range. If an active enemy is adjacent (Manhattan/Chebyshev distance <= 1), Wizard flees.
        const isEnemyAdjacent = Object.values(this.combatants).some(c => {
            if (!c || c.dead || c.isVCT || !c.isMonster) return false;
            // Support large monsters by checking all their occupied coordinates
            const enemyTiles = (Array.isArray(c.occupiedCoords) && c.occupiedCoords.length > 0) ? c.occupiedCoords : [c.coordinates];
            return enemyTiles.some(tile => {
                const dx = Math.abs(unit.coordinates.x - tile.x);
                const dy = Math.abs(unit.coordinates.y - tile.y);
                return dx <= 1 && dy <= 1; // Adjacent horizontally, vertically, or diagonally
            });
        });

        if (isEnemyAdjacent && unit.movesTakenThisRound === 0) {
            // Find a tile {x, y} that is within 1 step (left, right, up, down)
            // which is a valid fit, and has NO adjacent enemies.
            // For fighters, "retreat" usually means moving left (away from depth MAX_DEPTH)
            // Let's determine direction. If unit.coordinates.x > 0, backing up is -1.
            const preferredDx = -1;
            const sortedDirections = [
                { dx: preferredDx, dy: 0 },
                { dx: 0, dy: -1 },
                { dx: 0, dy: 1 },
                { dx: -preferredDx, dy: 0 }
            ];

            let fled = false;
            for (let dir of sortedDirections) {
                const nx = unit.coordinates.x + dir.dx;
                const ny = unit.coordinates.y + dir.dy;
                if (this.canFitAt(unit, nx, ny)) {
                    // Check if this new position nx, ny is adjacent to any active enemy
                    const anyEnemyNear = Object.values(this.combatants).some(c => {
                        if (!c || c.dead || c.isVCT || !c.isMonster) return false;
                        const enemyTiles = (Array.isArray(c.occupiedCoords) && c.occupiedCoords.length > 0) ? c.occupiedCoords : [c.coordinates];
                        return enemyTiles.some(tile => {
                            const adx = Math.abs(nx - tile.x);
                            const ady = Math.abs(ny - tile.y);
                            return adx <= 1 && ady <= 1;
                        });
                    });

                    if (!anyEnemyNear) {
                        this.updateUnitCoordinates(unit, nx, ny);
                        unit.movesTakenThisRound += 1;
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} flees to safety at (${nx}, ${ny}).`);
                        fled = true;
                        break;
                    }
                }
            }

            if (!fled) {
                // Default fallback retreat reposition if no perfectly safe adjacent tile is found
                this.repositionUnit(unit, target, 'retreat');
            }
        } else if (unit.coordinates.y !== target.coordinates.y && unit.movesTakenThisRound === 0) {
            // Strives to be in line with target but doesn't necessarily need to be in line to use his skills
            const targetY = target.coordinates.y;
            const newY = unit.coordinates.y + Math.sign(targetY - unit.coordinates.y);
            const backlineX = unit.coordinates.x;
            if (this.canFitAt(unit, backlineX, newY)) {
                this.updateUnitCoordinates(unit, backlineX, newY);
                unit.movesTakenThisRound += 1;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} shifts position to align with ${this.getCombatantLogName(target)}.`);
            }
        }

        if (this._abilityReady(unit, 'lightning_strike')) {
            const lightning = this.resolveSpecial(unit, 'lightning_strike');
            if (lightning && this.targetInRange(unit, target, lightning.range || 'medium')) {
                this.useAbility(unit, lightning, target);
                return;
            }
        }

        if (this._abilityReady(unit, 'vortex')) {
            const vortex = this.resolveSpecial(unit, 'vortex');
            if (vortex) {
                const nearbyEnemies = Object.values(this.combatants).filter(c => {
                    const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                    if (!isEnemy) return false;
                    const dist = Math.abs(unit.coordinates.x - c.coordinates.x) + Math.abs(unit.coordinates.y - c.coordinates.y);
                    return dist <= 3;
                }).length;
                if (nearbyEnemies >= 2) {
                    this.useAbility(unit, vortex, target);
                    return;
                }
            }
        }

        if (this._abilityReady(unit, 'annihilation')) {
            const annihilation = this.resolveSpecial(unit, 'annihilation');
            if (annihilation && this.targetInRange(unit, target, annihilation.range || 'far')) {
                this.useAbility(unit, annihilation, target);
                return;
            }
        }

        const scored = this._scoredAbilityPick(unit, target);
        if (scored) {
            this.useAbility(unit, scored.resolved, target);
        } else if (target) {
            // Ranged basic attack
            this._basicAttack(unit, target);
        }
    };

    // SAGE: Support/healer. Top priority is healing allies, then defensive shielding, then perceive.
    this._aiSage = (unit) => {
        const woundedAlly = this.findWoundedAlly(unit);
        const woundedPct = woundedAlly && woundedAlly.starting_hp > 0
            ? woundedAlly.hp / woundedAlly.starting_hp : 1;

        // Priority 1: Healing Hands (heal) if any ally is below 70% HP
        if (woundedPct < 0.7 && this._abilityReady(unit, 'heal')) {
            const pick = this.resolveSpecial(unit, 'heal');
            if (pick && woundedAlly) {
                const healAmount = 30; // base healing
                woundedAlly.hp = Math.min(woundedAlly.starting_hp || woundedAlly.hp, woundedAlly.hp + healAmount);
                woundedAlly.damageIndicators = woundedAlly.damageIndicators || [];
                woundedAlly.damageIndicators.push({ id: Date.now() + Math.random(), value: `+${healAmount}`, source: 'Healing Hands', type: 'heal' });
                this.appendCombatLog(`${this.getCombatantLogName(unit)} uses Healing Hands on ${this.getCombatantLogName(woundedAlly)} for +${healAmount} HP.`);
                this._setCooldown(unit, 'heal', typeof pick.cooldown === 'number' ? pick.cooldown : 4);
                unit.actionsTakenThisRound += 1;
                
                // Trigger animation
                if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                    this.animManagerRedux.triggerAbility(unit.coordinates, woundedAlly.coordinates, 'heal', false, null, unit.id);
                }

                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 2: Circle of Protection if combat has started to develop (round > 1)
        if (this.round > 1 && this._abilityReady(unit, 'circle_of_protection')) {
            const pick = this.resolveSpecial(unit, 'circle_of_protection');
            if (pick) {
                const getScore = (nx, ny) => {
                    let score = 0;
                    Object.values(this.combatants).forEach(c => {
                        if (!c || c.dead || c.isVCT) return;
                        const sameTeam = (!!unit.isMonster === !!c.isMonster);
                        if (!sameTeam) return;

                        // Euclidean distance
                        const dx = c.coordinates.x - nx;
                        const dy = c.coordinates.y - ny;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 1.9) {
                            score += 2; // Fully covered
                        } else if (dist <= 2.25) {
                            score += 1; // Partially covered
                        }
                    });
                    return score;
                };

                const countOtherAlliesCovered = (nx, ny) => {
                    let count = 0;
                    Object.values(this.combatants).forEach(c => {
                        if (!c || c.dead || c.isVCT || c.id === unit.id) return;
                        const sameTeam = (!!unit.isMonster === !!c.isMonster);
                        if (!sameTeam) return;

                        const dx = c.coordinates.x - nx;
                        const dy = c.coordinates.y - ny;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= 2.25) {
                            count++;
                        }
                    });
                    return count;
                };

                let bestTile = { x: unit.coordinates.x, y: unit.coordinates.y };
                let maxScore = getScore(bestTile.x, bestTile.y);
                let shouldCastThisRound = true;

                if (!unit.ensnared && !unit.shieldWallActive && unit.movesTakenThisRound < 1) {
                    let idealTile = null;
                    let maxIdealScore = -1;

                    for (let tx = 0; tx <= MAX_DEPTH; tx++) {
                        for (let ty = 0; ty < MAX_LANES; ty++) {
                            if (tx !== unit.coordinates.x || ty !== unit.coordinates.y) {
                                if (!this.canFitAt(unit, tx, ty)) continue;
                            }
                            const dist = Math.abs(tx - unit.coordinates.x) + Math.abs(ty - unit.coordinates.y);
                            if (dist > 3) continue;

                            if (countOtherAlliesCovered(tx, ty) >= 2) {
                                const score = getScore(tx, ty);
                                if (score > maxIdealScore) {
                                    maxIdealScore = score;
                                    idealTile = { x: tx, y: ty };
                                } else if (score === maxIdealScore) {
                                    const currentIdealDist = Math.abs(idealTile.x - unit.coordinates.x) + Math.abs(idealTile.y - unit.coordinates.y);
                                    if (dist < currentIdealDist) {
                                        idealTile = { x: tx, y: ty };
                                    }
                                }
                            }
                        }
                    }

                    if (idealTile) {
                        if (idealTile.x === unit.coordinates.x && idealTile.y === unit.coordinates.y) {
                            shouldCastThisRound = true;
                        } else {
                            const candidates = [
                                { x: unit.coordinates.x + 1, y: unit.coordinates.y },
                                { x: unit.coordinates.x - 1, y: unit.coordinates.y },
                                { x: unit.coordinates.x, y: unit.coordinates.y + 1 },
                                { x: unit.coordinates.x, y: unit.coordinates.y - 1 }
                            ];

                            let bestStep = null;
                            let minStepDist = Infinity;

                            candidates.forEach(cand => {
                                if (cand.x < 0 || cand.x > MAX_DEPTH || cand.y < 0 || cand.y >= MAX_LANES) return;
                                if (!this.canFitAt(unit, cand.x, cand.y)) return;

                                const dist = Math.abs(cand.x - idealTile.x) + Math.abs(cand.y - idealTile.y);
                                if (dist < minStepDist) {
                                    minStepDist = dist;
                                    bestStep = cand;
                                }
                            });

                            if (bestStep) {
                                bestTile = bestStep;
                                shouldCastThisRound = false;
                            } else {
                                shouldCastThisRound = true;
                            }
                        }
                    } else {
                        let targetTile = { x: unit.coordinates.x, y: unit.coordinates.y };
                        let maxTargetScore = maxScore;

                        const candidates = [
                            { x: unit.coordinates.x + 1, y: unit.coordinates.y },
                            { x: unit.coordinates.x - 1, y: unit.coordinates.y },
                            { x: unit.coordinates.x, y: unit.coordinates.y + 1 },
                            { x: unit.coordinates.x, y: unit.coordinates.y - 1 }
                        ];

                        candidates.forEach(cand => {
                            if (cand.x < 0 || cand.x > MAX_DEPTH || cand.y < 0 || cand.y >= MAX_LANES) return;
                            if (!this.canFitAt(unit, cand.x, cand.y)) return;
                            const score = getScore(cand.x, cand.y);
                            if (score > maxTargetScore) {
                                maxTargetScore = score;
                                targetTile = cand;
                            }
                        });

                        bestTile = targetTile;
                        shouldCastThisRound = true;
                    }
                }

                if (bestTile.x !== unit.coordinates.x || bestTile.y !== unit.coordinates.y) {
                    this.updateUnitCoordinates(unit, bestTile.x, bestTile.y);
                    unit.movesTakenThisRound += 1;
                    this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'move');
                    if (shouldCastThisRound) {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} repositions to optimize Circle of Protection.`);
                    } else {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} moves towards ideal Circle of Protection location.`);
                    }
                }

                if (!shouldCastThisRound) {
                    if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                    return;
                }

                const dur = getDurationRounds(pick.duration || 'long');
                Object.values(this.combatants).forEach(c => {
                    const sameTeam = (!!unit.isMonster === !!c.isMonster);
                    if (!sameTeam) return;
                    this._applyBuff(c, pick.buff || {}, 'circle_of_protection', dur);
                });

                this.appendCombatLog(`${this.getCombatantLogName(unit)} casts Circle of Protection.`);
                this._setCooldown(unit, 'circle_of_protection', pick.cooldown || 8);
                unit.actionsTakenThisRound += 1;

                // Trigger animation
                if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                    this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'circle_of_protection', false, null, unit.id);
                }

                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 3: Circle of Deflection (tier 3) — teal ranged-deflection barrier
        if (this.round > 1 && this._abilityReady(unit, 'circle_of_deflection')) {
            const pick = this.resolveSpecial(unit, 'circle_of_deflection');
            if (pick) {
                const getScore = (nx, ny) => {
                    let score = 0;
                    Object.values(this.combatants).forEach(c => {
                        if (!c || c.dead || c.isVCT) return;
                        const sameTeam = (!!unit.isMonster === !!c.isMonster);
                        if (!sameTeam) return;
                        const dx = c.coordinates.x - nx;
                        const dy = c.coordinates.y - ny;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 1.9) score += 2;
                        else if (dist <= 2.25) score += 1;
                    });
                    return score;
                };

                const countOtherAlliesCovered = (nx, ny) => {
                    let count = 0;
                    Object.values(this.combatants).forEach(c => {
                        if (!c || c.dead || c.isVCT || c.id === unit.id) return;
                        const sameTeam = (!!unit.isMonster === !!c.isMonster);
                        if (!sameTeam) return;
                        const dx = c.coordinates.x - nx;
                        const dy = c.coordinates.y - ny;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= 2.25) {
                            count++;
                        }
                    });
                    return count;
                };

                let bestTile = { x: unit.coordinates.x, y: unit.coordinates.y };
                let maxScore = getScore(bestTile.x, bestTile.y);
                let shouldCastThisRound = true;

                if (!unit.ensnared && !unit.shieldWallActive && unit.movesTakenThisRound < 1) {
                    let idealTile = null;
                    let maxIdealScore = -1;

                    for (let tx = 0; tx <= MAX_DEPTH; tx++) {
                        for (let ty = 0; ty < MAX_LANES; ty++) {
                            if (tx !== unit.coordinates.x || ty !== unit.coordinates.y) {
                                if (!this.canFitAt(unit, tx, ty)) continue;
                            }
                            const dist = Math.abs(tx - unit.coordinates.x) + Math.abs(ty - unit.coordinates.y);
                            if (dist > 3) continue;

                            if (countOtherAlliesCovered(tx, ty) >= 2) {
                                const score = getScore(tx, ty);
                                if (score > maxIdealScore) {
                                    maxIdealScore = score;
                                    idealTile = { x: tx, y: ty };
                                } else if (score === maxIdealScore) {
                                    const currentIdealDist = Math.abs(idealTile.x - unit.coordinates.x) + Math.abs(idealTile.y - unit.coordinates.y);
                                    if (dist < currentIdealDist) {
                                        idealTile = { x: tx, y: ty };
                                    }
                                }
                            }
                        }
                    }

                    if (idealTile) {
                        if (idealTile.x === unit.coordinates.x && idealTile.y === unit.coordinates.y) {
                            shouldCastThisRound = true;
                        } else {
                            const candidates = [
                                { x: unit.coordinates.x + 1, y: unit.coordinates.y },
                                { x: unit.coordinates.x - 1, y: unit.coordinates.y },
                                { x: unit.coordinates.x, y: unit.coordinates.y + 1 },
                                { x: unit.coordinates.x, y: unit.coordinates.y - 1 }
                            ];

                            let bestStep = null;
                            let minStepDist = Infinity;

                            candidates.forEach(cand => {
                                if (cand.x < 0 || cand.x > MAX_DEPTH || cand.y < 0 || cand.y >= MAX_LANES) return;
                                if (!this.canFitAt(unit, cand.x, cand.y)) return;

                                const dist = Math.abs(cand.x - idealTile.x) + Math.abs(cand.y - idealTile.y);
                                if (dist < minStepDist) {
                                    minStepDist = dist;
                                    bestStep = cand;
                                }
                            });

                            if (bestStep) {
                                bestTile = bestStep;
                                shouldCastThisRound = false;
                            } else {
                                shouldCastThisRound = true;
                            }
                        }
                    } else {
                        let targetTile = { x: unit.coordinates.x, y: unit.coordinates.y };
                        let maxTargetScore = maxScore;

                        const candidates = [
                            { x: unit.coordinates.x + 1, y: unit.coordinates.y },
                            { x: unit.coordinates.x - 1, y: unit.coordinates.y },
                            { x: unit.coordinates.x, y: unit.coordinates.y + 1 },
                            { x: unit.coordinates.x, y: unit.coordinates.y - 1 }
                        ];

                        candidates.forEach(cand => {
                            if (cand.x < 0 || cand.x > MAX_DEPTH || cand.y < 0 || cand.y >= MAX_LANES) return;
                            if (!this.canFitAt(unit, cand.x, cand.y)) return;
                            const score = getScore(cand.x, cand.y);
                            if (score > maxTargetScore) {
                                maxTargetScore = score;
                                targetTile = cand;
                            }
                        });

                        bestTile = targetTile;
                        shouldCastThisRound = true;
                    }
                }

                if (bestTile.x !== unit.coordinates.x || bestTile.y !== unit.coordinates.y) {
                    this.updateUnitCoordinates(unit, bestTile.x, bestTile.y);
                    unit.movesTakenThisRound += 1;
                    this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'move');
                    if (shouldCastThisRound) {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} repositions to optimize Circle of Deflection.`);
                    } else {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} moves towards ideal Circle of Deflection location.`);
                    }
                }

                if (!shouldCastThisRound) {
                    if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                    return;
                }
                const dur = getDurationRounds(pick.duration || 'long');
                Object.values(this.combatants).forEach(c => {
                    const sameTeam = (!!unit.isMonster === !!c.isMonster);
                    if (!sameTeam) return;
                    this._applyBuff(c, pick.buff || {}, 'circle_of_deflection', dur);
                });
                this.appendCombatLog(`${this.getCombatantLogName(unit)} erects a Circle of Deflection — ranged attacks may be reflected!`);
                this._setCooldown(unit, 'circle_of_deflection', pick.cooldown || 14);
                unit.actionsTakenThisRound += 1;
                if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                    this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'circle_of_deflection', false, null, unit.id);
                }
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 4: Perceive (doubles weakness of all enemies for 2x-long duration: 8 rounds)
        if (this._abilityReady(unit, 'perceive')) {
            const pick = this.resolveSpecial(unit, 'perceive');
            if (pick) {
                const dur = getDurationRounds(pick.duration || '2x-long');
                const durMs = getDurationMsFromRounds(dur);
                Object.values(this.combatants).forEach(c => {
                    const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                    if (!isEnemy) return;
                    c.weaknessRevealed = true;
                    c.weaknessRevealedRounds = dur;
                    c.weaknessRevealedTotalRounds = dur;
                    c.weaknessRevealedStackDuration = dur;
                    c.weaknessRevealedTotalDurationMs = durMs;
                    c.weaknessRevealedEndTimeMs = Date.now() + durMs;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} perceives ${this.getCombatantLogName(c)} — weakness exposed!`);
                });
                this._setCooldown(unit, 'perceive', pick.cooldown || 12);
                unit.actionsTakenThisRound += 1;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Fallback: stay near allies and pass turn (Sage has no basic attacks)
        const circleActive = unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'circle_of_protection' || b.name === 'circle_of_deflection');
        if (woundedAlly && unit.movesTakenThisRound < 1 && !unit.ensnared && !circleActive) {
            this.moveCloser(unit, woundedAlly);
            this.appendCombatLog(`${this.getCombatantLogName(unit)} moves to support ${this.getCombatantLogName(woundedAlly)}.`);
        }
        
        // Pass action
        if (unit.actionsTakenThisRound < 1) {
            unit.actionsTakenThisRound += 1;
        }
    };

    // RANGER: Ranged DPS. Prioritizes execute and mark.
    this._aiRanger = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        // Retreat if enemy gets too close
        const dist = Math.abs(unit.coordinates.x - target.coordinates.x)
                   + Math.abs(unit.coordinates.y - target.coordinates.y);
        if (dist <= 1) {
            this.repositionUnit(unit, target, 'retreat');
        }

        // Fire Phase (arrow is notched)
        if (unit.arrowNotched) {
            // Priority 1: Execute if ready
            if (this._abilityReady(unit, 'execute')) {
                const pick = this.resolveSpecial(unit, 'execute');
                if (pick) {
                    this.useAbility(unit, pick, target);
                    this._setCooldown(unit, 'execute', pick.cooldown || 8);
                    unit.arrowNotched = false;
                    return;
                }
            }

            // Default fire action: Loose
            const pick = this.resolveSpecial(unit, 'loose') || {
                id: 'loose',
                name: 'Loose',
                range: 'far',
                type: 'damage',
                cooldown: 2
            };
            const looseAttack = { ...pick, cooldown: 2, range: 'far' };
            this.useAbility(unit, looseAttack, target);
            unit.arrowNotched = false;
            return;
        }

        // Setup Phase (no arrow notched yet)
        // Priority 2: Ensnare if target is not ensnared
        if (this._abilityReady(unit, 'ensnare') && !target.ensnared) {
            const pick = this.resolveSpecial(unit, 'ensnare');
            if (pick) {
                this.useAbility(unit, pick, target);
                if (target.type === 'dragon' && Math.random() < 0.5) {
                    this.appendCombatLog(`${this.getCombatantLogName(target)} resists Ensnare! (Dragon CC Immunity)`);
                } else {
                    target.ensnared = true;
                    target.ensnaredRounds = getDurationRounds(pick.duration || 'short');
                    target.ensnaredTotalRounds = target.ensnaredRounds;
                    target.ensnaredStackDuration = target.ensnaredRounds;
                    const durMs = getDurationMsFromRounds(target.ensnaredRounds);
                    target.ensnaredTotalDurationMs = durMs;
                    target.ensnaredEndTimeMs = Date.now() + durMs;
                }
                this._setCooldown(unit, 'ensnare', pick.cooldown || 6);
                return;
            }
        }

        // Priority 3: Mark target
        if (this._abilityReady(unit, 'mark') && !target.marked) {
            const pick = this.resolveSpecial(unit, 'mark');
            if (pick) {
                this.useAbility(unit, pick, target);
                target.marked = true;
                target.markedRounds = getDurationRounds(pick.duration || 'long');
                target.markedTotalRounds = target.markedRounds;
                target.markedStackDuration = target.markedRounds;
                const durMs = getDurationMsFromRounds(target.markedRounds);
                target.markedTotalDurationMs = durMs;
                target.markedEndTimeMs = Date.now() + durMs;
                this._setCooldown(unit, 'mark', pick.cooldown || 4);
                return;
            }
        }

        // If no setup action is taken, notch an arrow!
        const pick = this.resolveSpecial(unit, 'notch') || {
            id: 'notch',
            name: 'Notch',
            range: 'self',
            type: 'utility',
            cooldown: 0
        };
        const notchAction = { ...pick, cooldown: 0 };
        this.useAbility(unit, notchAction, unit);
        unit.arrowNotched = true;
    };

    // SUMMONER: Support/summon. Opens rift first, then summons minions based on priority.
    this._aiSummoner = (unit) => {
        // Track rift portal state on the unit
        if (unit.riftPortalRoundsLeft > 0) {
            unit.riftPortalRoundsLeft--;
            if (unit.riftPortalRoundsLeft <= 0) {
                unit.riftPortalActive = false;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Rift Portal collapses.`);
            }
        }

        // Priority 1: Open rift if not active
        if (!unit.riftPortalActive && this._abilityReady(unit, 'open_rift')) {
            const pick = this.resolveSpecial(unit, 'open_rift');
            if (pick) {
                // Pick a random free tile on the enemy half of the board (right side x >= 4)
                const occupied = new Set(
                    Object.values(this.combatants)
                        .filter(c => c && !c.dead)
                        .map(c => `${c.coordinates.x}-${c.coordinates.y}`)
                );
                const candidateTiles = [];
                for (let x = 4; x <= MAX_DEPTH; x++) {
                    for (let y = 0; y < MAX_LANES; y++) {
                        if (!occupied.has(`${x}-${y}`)) {
                            candidateTiles.push({ x, y });
                        }
                    }
                }
                const portalPos = candidateTiles.length > 0
                    ? candidateTiles[Math.floor(Math.random() * candidateTiles.length)]
                    : { x: Math.min(MAX_DEPTH, unit.coordinates.x + 2), y: unit.coordinates.y };

                unit.riftPortalActive = true;
                unit.riftPortalRoundsLeft = 3;
                unit.riftPortalPos = portalPos;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} tears open a Rift Portal!`);
                this._setCooldown(unit, 'open_rift', pick.cooldown || 15);
                unit.actionsTakenThisRound += 1;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }


        // Priority 2: Rift-tier summons (require active rift)
        if (unit.riftPortalActive) {
            const riftSummons = ['summon_devil', 'summon_imp_army', 'summon_skeleton_army'];
            for (const key of riftSummons) {
                if (this._abilityReady(unit, key)) {
                    const pick = this.resolveSpecial(unit, key);
                    if (pick) {
                        this._executeSummon(unit, pick, key);
                        return;
                    }
                }
            }
        }

        // Priority 3: Basic summons (no rift required)
        const basicSummons = ['summon_skeleton', 'summon_imp', 'summon_zombie', 'summon_ghoul', 'summon_skeleton_knight'];
        for (const key of basicSummons) {
            if (this._abilityReady(unit, key)) {
                const pick = this.resolveSpecial(unit, key);
                if (pick) {
                    this._executeSummon(unit, pick, key);
                    return;
                }
            }
        }

        // Priority 3b: Dominate an enemy minion if one exists and ability is ready
        if (this._abilityReady(unit, 'dominate_minion')) {
            const dominatePick = this.resolveSpecial(unit, 'dominate_minion');
            const isUnitMonster = !!unit.isMonster;
            const enemyMinion = Object.values(this.combatants).find(
                c => c && !c.dead && c.isMinion && !!c.isMonster !== isUnitMonster && !c.dominatedBy
            );
            if (dominatePick && enemyMinion) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} targets ${this.getCombatantLogName(enemyMinion)} with Dominate Minion!`);
                this.useAbility(unit, dominatePick, enemyMinion);
                unit.actionsTakenThisRound += 1;
                return;
            }
        }

        // Priority 4: Duplicate/triplicate existing minions
        const hasMinions = Object.values(this.combatants).some(
            c => c && !c.dead && c.isMinion
        );
        if (hasMinions && this._abilityReady(unit, 'summoner_duplicate')) {
            const pick = this.resolveSpecial(unit, 'summoner_duplicate');
            if (pick) {
                this._duplicateMinion(unit, pick, false);
                return;
            }
        }
        if (hasMinions && this._abilityReady(unit, 'summoner_triplicate')) {
            const pick = this.resolveSpecial(unit, 'summoner_triplicate');
            if (pick) {
                this._duplicateMinion(unit, pick, true);
                return;
            }
        }

        // Fallback: basic attack if nothing else available
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (target) this._basicAttack(unit, target);
    };

    this._executeSummon = (unit, ability, abilityKey) => {
        // Find a free adjacent tile to place the summoned minion
        const adjacentTiles = [
            { x: unit.coordinates.x - 1, y: unit.coordinates.y },
            { x: unit.coordinates.x,     y: unit.coordinates.y - 1 },
            { x: unit.coordinates.x,     y: unit.coordinates.y + 1 },
            { x: unit.coordinates.x + 1, y: unit.coordinates.y },
        ].filter(t => t.x >= 0 && t.x <= MAX_DEPTH && t.y >= 0 && t.y < MAX_LANES);

        const freeTile = adjacentTiles.find(t => !this.isTileOccupied(t.x, t.y));

        if (!freeTile) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} tried to summon but no free tile available.`);
            return;
        }

        const minionType = abilityKey.replace('summon_', '').replace('_army', '');
        const minionId = `minion_${minionType}_${Date.now()}`;
        const hpBase = 20 + Math.round((unit.stats.int || 5) * 2);

        let portraitKey = `summon_${minionType}_icon`;
        if (minionType === 'skeleton_army') {
            portraitKey = 'summon_skeleton_army_icon';
        } else if (minionType === 'imp_army') {
            portraitKey = 'summon_imp_army_icon';
        }

        const newMinion = {
            id: minionId,
            type: minionType,
            name: minionType.replace(/_/g, ' '),
            isMinion: true,
            isMonster: !!unit.isMonster,
            dead: false,
            coordinates: { ...freeTile },
            hp: hpBase,
            starting_hp: hpBase,
            stats: { str: 3, dex: 3, atk: 4, def: 2, speed: 3 },
            attacks: [minionType.includes('skeleton') ? 'sword_swing' : 'claw_strike'],
            specials: ['reassembly'],
            portrait: images[portraitKey] || images['summon_skeleton_icon'],
            cooldowns: {},
            movesTakenThisRound: 0,
            actionsTakenThisRound: 0,
            endurance: 20,
            maxEndurance: 20,
            enduranceFrozenRounds: 0,
            damageIndicators: [],
            activeBuffs: [],
            activeDebuffs: [],
            invisible: true // starts invisible during portal animation
        };

        this.combatants[minionId] = newMinion;
        this._setCombatantOccupiedCoords(newMinion);
        this._triggerEagleEyePassives(newMinion);
        this._setCooldown(unit, abilityKey, ability.cooldown || 8);
        unit.actionsTakenThisRound += 1;
        this.appendCombatLog(`${this.getCombatantLogName(unit)} summons a ${newMinion.name}!`);

        // Trigger portal animation
        let transitionIcon = images['summon_icon'];
        if (ability.tier === 2) {
            transitionIcon = images['summon2_icon'];
        } else if (ability.tier >= 3) {
            transitionIcon = images['summon3_icon'];
        }

        if (this.animManagerRedux && typeof this.animManagerRedux.triggerSummon === 'function') {
            this.animManagerRedux.triggerSummon(freeTile, minionType, transitionIcon);
        }

        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));

        setTimeout(() => {
            newMinion.invisible = false;
            newMinion.fadingIn = true;
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            setTimeout(() => {
                newMinion.fadingIn = false;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }, 500);
        }, 1200);
    };

    this._duplicateMinion = (unit, ability, isTriplicate) => {
        // Find the most recent living minion to duplicate
        const minionsToDupe = Object.values(this.combatants).filter(
            c => c && !c.dead && c.isMinion
        );
        if (minionsToDupe.length === 0) return;

        const source = minionsToDupe[0];
        const copies = isTriplicate ? 2 : 1;
        let spawned = 0;

        const offsets = [
            { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

        const transitionIcon = isTriplicate ? images['triplicate_transition_icon'] : images['duplicate_transition_icon'];
        const summonType = isTriplicate ? 'triplicate' : 'duplicate';

        for (const { dx, dy } of offsets) {
            if (spawned >= copies) break;
            const nx = source.coordinates.x + dx;
            const ny = source.coordinates.y + dy;
            if (nx < 0 || nx > MAX_DEPTH || ny < 0 || ny >= MAX_LANES) continue;
            const blocked = this.isTileOccupied(nx, ny);
            if (blocked) continue;

            const copyId = `minion_${source.type}_copy_${Date.now()}_${spawned}`;
            const copy = { ...clone(source), id: copyId, coordinates: { x: nx, y: ny } };
            copy.cooldowns = {};
            copy.movesTakenThisRound = 0;
            copy.actionsTakenThisRound = 0;
            copy.damageIndicators = [];
            copy.invisible = true; // start invisible during portal animation
            // Copies cannot inherit duplicate/triplicate
            copy.specials = (copy.specials || []).filter(
                s => s !== 'summoner_duplicate' && s !== 'summoner_triplicate'
            );
            this.combatants[copyId] = copy;
            this._triggerEagleEyePassives(copy);
            spawned++;
            this.appendCombatLog(`${this.getCombatantLogName(unit)} duplicates a ${source.name}!`);

            // Trigger portal animation for this duplicated copy
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerSummon === 'function') {
                this.animManagerRedux.triggerSummon({ x: nx, y: ny }, summonType, transitionIcon);
            }

            // Stagger fade-in of duplicated copy
            const currentCopy = copy;
            setTimeout(() => {
                currentCopy.invisible = false;
                currentCopy.fadingIn = true;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                setTimeout(() => {
                    currentCopy.fadingIn = false;
                    if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                }, 500);
            }, 1200);
        }

        const abilityKey = isTriplicate ? 'summoner_triplicate' : 'summoner_duplicate';
        this._setCooldown(unit, abilityKey, ability.cooldown || (isTriplicate ? 12 : 8));
        unit.actionsTakenThisRound += 1;
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    // SPHINX: priority is Hex, then Trials, then Claw Strike or Polymorph, with post-claw retreat.
    this._aiSphinx = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const hexSpec = this.resolveSpecial(unit, 'hex');
        const trialsSpec = this.resolveSpecial(unit, 'begin_the_trials');
        const clawSpec = this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 0, atkPercentage: 100 };
        const polymorphSpec = this.resolveSpecial(unit, 'polymorph');
        const mmSpec = this.resolveSpecial(unit, 'magic_missile');

        const hexReady = hexSpec && this._abilityReady(unit, 'hex');
        const trialsReady = trialsSpec && this._abilityReady(unit, 'begin_the_trials') && !this.combatants['trials_icon'];
        const clawReady = clawSpec && this._abilityReady(unit, 'claw_strike');
        const polymorphReady = polymorphSpec && this._abilityReady(unit, 'polymorph');
        const mmReady = mmSpec && this._abilityReady(unit, 'magic_missile');

        // Helper function for post-claw-strike retreat
        const attemptClawRetreat = () => {
            if (unit.movesTakenThisRound < 1) {
                const currentX = unit.coordinates.x;
                const currentY = unit.coordinates.y;
                let retreatDest = null;
                const candidateOffsets = [
                    { dx: 2, dy: 0 }, { dx: 2, dy: -1 }, { dx: 2, dy: 1 },
                    { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 }
                ];
                for (const offset of candidateOffsets) {
                    const rx = currentX + offset.dx;
                    const ry = currentY + offset.dy;
                    if (rx >= 0 && rx <= MAX_DEPTH && ry >= 0 && ry < MAX_LANES) {
                        if (this.canFitAt(unit, rx, ry)) {
                            retreatDest = { x: rx, y: ry };
                            break;
                        }
                    }
                }
                if (retreatDest) {
                    this.updateUnitCoordinates(unit, retreatDest.x, retreatDest.y);
                    unit.movesTakenThisRound += 1;
                    this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'retreat');
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} retreats back to (${retreatDest.x}, ${retreatDest.y}) to maintain distance.`);
                }
            }
        };

        // 1. Prioritize Hex
        if (hexReady) {
            if (this.targetInRange(unit, target, hexSpec.range || 'medium')) {
                this.useAbility(unit, hexSpec, target);
                return;
            } else if (unit.movesTakenThisRound < 1) {
                this.moveCloser(unit, target);
                if (this.targetInRange(unit, target, hexSpec.range || 'medium')) {
                    this.useAbility(unit, hexSpec, target);
                }
                return;
            }
        }

        // 2. Prioritize Trials (Begin the Trials)
        if (trialsReady) {
            const liveFighters = Object.values(this.combatants).filter(
                c => c && !c.dead && !c.isMonster && !c.isMinion && !c.isVCT && !c.inTrial
            );
            if (liveFighters.length >= 1) {
                const anchorCoords = this._getSphinxAnchorCoords(unit);
                const topRow = anchorCoords ? anchorCoords.y : unit.coordinates.y;

                if (topRow >= 2) {
                    this.useAbility(unit, trialsSpec, unit);
                    return;
                } else if (unit.movesTakenThisRound < 1) {
                    const newY = unit.coordinates.y + 1;
                    const newX = unit.coordinates.x;
                    if (this.canFitAt(unit, newX, newY)) {
                        this.updateUnitCoordinates(unit, newX, newY);
                        unit.movesTakenThisRound += 1;
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} repositions to make room for the Trials.`);
                        return;
                    }
                }
            }
        }

        // 2.5 Prioritize Magic Missile at medium-to-far range (not adjacent/close)
        if (mmReady && !this.targetInRange(unit, target, 'close')) {
            this.useAbility(unit, mmSpec, target);
            return;
        }

        // 3. Claw Strike (close range) or Polymorph (medium range)
        const adjacent = this.targetInRange(unit, target, 'close');
        if (adjacent && clawReady) {
            this.useAbility(unit, clawSpec, target);
            attemptClawRetreat();
            return;
        }

        const mediumRange = this.targetInRange(unit, target, 'medium');
        if (mediumRange && polymorphReady) {
            this.useAbility(unit, polymorphSpec, target);
            return;
        }

        // 4. Movement and Fallback
        if (unit.movesTakenThisRound < 1) {
            this.moveCloser(unit, target);
            
            // Re-evaluate in range options after moving
            const nowAdjacent = this.targetInRange(unit, target, 'close');
            if (nowAdjacent && clawReady) {
                this.useAbility(unit, clawSpec, target);
                attemptClawRetreat();
                return;
            }
            const nowMedium = this.targetInRange(unit, target, 'medium');
            if (nowMedium && polymorphReady) {
                this.useAbility(unit, polymorphSpec, target);
                return;
            }
        }

        // Fall through to generic scored ability selection or basic attack
        const scored = this._scoredAbilityPick(unit, target);
        const rangeType = scored ? (scored.resolved.range || 'medium') : 'medium';
        const finalInRange = this.targetInRange(unit, target, rangeType);

        if (finalInRange) {
            if (scored && scored.resolved.id !== 'begin_the_trials') {
                this.useAbility(unit, scored.resolved, target);
            } else {
                this._basicAttack(unit, target);
            }
        } else if (unit.movesTakenThisRound < 1) {
            this.moveCloser(unit, target);
        }
    };


    // ── Trials Helper Methods ─────────────────────────────────────────────────

    /** Get the Sphinx unit from combatants (first found) */
    this._getSphinx = () => {
        return Object.values(this.combatants).find(
            c => c && (c.type === 'sphinx' || c.key === 'sphinx' || (c.id && c.id.toString().includes('sphinx')))
        ) || null;
    };

    /**
     * Returns the best coordinates to anchor the trials icon above the Sphinx.
     * Uses the top-left tile of the Sphinx's 2x2 block.
     */
    this._getSphinxAnchorCoords = (sphinx) => {
        if (!sphinx) return null;
        if (Array.isArray(sphinx.occupiedCoords) && sphinx.occupiedCoords.length > 0) {
            // Topmost, leftmost occupied tile
            const sorted = [...sphinx.occupiedCoords].sort((a, b) =>
                a.y !== b.y ? a.y - b.y : a.x - b.x
            );
            return sorted[0];
        }
        return sphinx.coordinates || null;
    };

    /**
     * Willpower check: returns true if the fighter FAILS the check (is sent to trial).
     * Medium power = ~55% base fail rate, modified by wits differential.
     */
    this._willpowerCheck = (fighter, sphinx) => {
        const fighterWP = (fighter.stats && (fighter.stats.wits || fighter.stats.int)) || 10;
        const sphinxWP  = (sphinx.stats && (sphinx.stats.wits || sphinx.stats.int)) || 15;
        const diff = sphinxWP - fighterWP; // positive = sphinx stronger
        // Base fail rate 55% (medium power mentality effect), 2% shift per point diff
        const failChance = Math.min(0.90, Math.max(0.15, 0.55 + diff * 0.02));
        return Math.random() < failChance; // true = fail = sent to trial
    };

    this._endSageCircles = (sageUnit, reason) => {
        this.appendCombatLog(`The Sage's circle collapses because: ${reason}.`);
        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT) return;
            const sameTeam = (!!sageUnit.isMonster === !!c.isMonster);
            if (!sameTeam) return;
            if (c.activeBuffs) {
                const hadCircle = c.activeBuffs.some(b => b.name === 'circle_of_protection' || b.name === 'circle_of_deflection');
                if (hadCircle) {
                    c.activeBuffs = c.activeBuffs.filter(b => b.name !== 'circle_of_protection' && b.name !== 'circle_of_deflection');
                }
            }
        });
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    /** Remove a fighter from the grid and send them to a trial */
    this._sendToTrial = (fighter, trialIndex) => {
        fighter.inTrial = trialIndex;              // 0=first, 1=second, 2=third
        fighter.trialSuccesses = 0;
        fighter.preTrialCoordinates = { ...fighter.coordinates };
        // Move them off-grid (large negative coordinate so they're hidden)
        fighter.coordinates = { x: -99, y: -99 + trialIndex };
        fighter.inTrialSince = this.round;

        if (fighter.type === 'sage') {
            this._endSageCircles(fighter, 'Sage was seized by the Trial');
        } else {
            // If the fighter has Circle of Protection active, dispel it immediately —
            // a combatant ripped from the battlefield cannot maintain the barrier.
            if (fighter.activeBuffs && fighter.activeBuffs.some(b => b.name === 'circle_of_protection')) {
                fighter.activeBuffs = fighter.activeBuffs.filter(b => b.name !== 'circle_of_protection');
                this.appendCombatLog(`${this.getCombatantLogName(fighter)}'s Circle of Protection is dispelled as they are seized by the Trial!`);
            }
            // Likewise dispel Circle of Deflection
            if (fighter.activeBuffs && fighter.activeBuffs.some(b => b.name === 'circle_of_deflection')) {
                fighter.activeBuffs = fighter.activeBuffs.filter(b => b.name !== 'circle_of_deflection');
                this.appendCombatLog(`${this.getCombatantLogName(fighter)}'s Circle of Deflection is dispelled as they are seized by the Trial!`);
            }
        }

        this.appendCombatLog(`${this.getCombatantLogName(fighter)} has been seized by the ${trialIndex === 0 ? 'First' : trialIndex === 1 ? 'Second' : 'Third'} Trial!`);
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    /** Return a fighter from their trial back to the board */
    this._returnFromTrial = (fighter) => {
        const trialIndex = fighter.inTrial;
        const returnCoords = fighter.preTrialCoordinates || fighter.coordinates;

        fighter.coordinates = returnCoords;
        delete fighter.inTrial;
        delete fighter.trialSuccesses;
        delete fighter.preTrialCoordinates;
        delete fighter.inTrialSince;

        const trialNames = ['First', 'Second', 'Third'];
        this.appendCombatLog(`${this.getCombatantLogName(fighter)} has survived the ${trialNames[trialIndex] || ''} Trial and returned!`);

        // Trigger return overlay animation
        if (this.animManagerRedux && typeof this.animManagerRedux.triggerReturnFromTrial === 'function') {
            this.animManagerRedux.triggerReturnFromTrial(returnCoords, trialIndex, fighter.id);
        }
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    /** End all active trials (destroy icon, return all off-board fighters) */
    this._endTrials = (sphinx, reason) => {
        this.appendCombatLog(`The Trials of the Sphinx have ended (${reason || 'completed'}).`);

        // Return all fighters still in a trial
        Object.values(this.combatants).forEach(c => {
            if (c && typeof c.inTrial === 'number') {
                this._returnFromTrial(c);
            }
        });

        // Remove the trials icon pseudo-combatant
        if (this.combatants['trials_icon']) {
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerTrialIconDestroy === 'function') {
                const anchorCoords = this._getSphinxAnchorCoords(sphinx);
                if (anchorCoords) this.animManagerRedux.triggerTrialIconDestroy(anchorCoords);
            }
            delete this.combatants['trials_icon'];
        }

        // Clear trial schedule on sphinx
        if (sphinx) {
            sphinx.trialsActive = null;
        }

        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    /**
     * Fire a single trial beam at a random fighter.
     * If the fighter fails the willpower check, they go to the trial.
     * @param {object} sphinx
     * @param {number} phaseIndex  0, 1, or 2
     */
    this._beginTrialPhase = (sphinx, phaseIndex) => {
        if (!sphinx || sphinx.dead) return;
        if (!this.combatants['trials_icon']) return; // trials already ended

        const liveFighters = Object.values(this.combatants).filter(
            c => c && !c.dead && !c.isMonster && !c.isMinion && !c.isVCT
                && typeof c.inTrial !== 'number' // not already in a trial
        );

        if (liveFighters.length === 0) {
            // No targets; end trials
            this._endTrials(sphinx, 'no targets remaining');
            return;
        }

        // Pick a random fighter
        const targetFighter = liveFighters[Math.floor(Math.random() * liveFighters.length)];
        const trialsIcon = this.combatants['trials_icon'];
        const srcCoords = trialsIcon && trialsIcon.coordinates 
            ? { x: trialsIcon.coordinates.x + 0.5, y: trialsIcon.coordinates.y + 0.5 }
            : this._getSphinxAnchorCoords(sphinx);

        this.appendCombatLog(`The Trial Effect Icon fires a mystical beam at ${this.getCombatantLogName(targetFighter)}!`);

        if (this.animManagerRedux && srcCoords && targetFighter.coordinates) {
            this.animManagerRedux.triggerAbility(srcCoords, targetFighter.coordinates, 'trials_beam');
        }

        // After 1s (beam travel), resolve willpower check
        setTimeout(() => {
            if (!targetFighter || targetFighter.dead) return;
            const fails = this._willpowerCheck(targetFighter, sphinx);
            if (fails) {
                this._sendToTrial(targetFighter, phaseIndex);
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(targetFighter)} resists the Trial beam!`);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }
        }, 1100);
    };

    /**
     * Called each round from incrementRound to:
     * 1. Check if trial phase schedule is due
     * 2. Process off-board willpower checks for fighters in trials
     * 3. Check if trials_icon HP <= 0
     */
    this._processTrialRound = () => {
        const sphinx = this._getSphinx();
        if (!sphinx || sphinx.dead || !sphinx.trialsActive) return;

        const trialsIcon = this.combatants['trials_icon'];
        if (!trialsIcon) {
            sphinx.trialsActive = null;
            return;
        }

        // Check icon HP
        if (trialsIcon.hp <= 0) {
            this._endTrials(sphinx, 'trial icon destroyed');
            return;
        }

        const ta = sphinx.trialsActive;
        const roundsSinceStart = this.round - ta.startRound;

        // Phase schedule: +1, +3, +5 rounds after start; auto-end at +9
        const phaseSchedule = [1, 3, 5];
        phaseSchedule.forEach((offset, phaseIdx) => {
            if (roundsSinceStart === offset && !ta.phaseFired[phaseIdx]) {
                ta.phaseFired[phaseIdx] = true;
                this._beginTrialPhase(sphinx, phaseIdx);
            }
        });

        // Auto-end after 9 rounds
        if (roundsSinceStart >= 9) {
            this._endTrials(sphinx, 'trials expired');
            return;
        }

        // Off-board willpower checks for each fighter currently in a trial
        Object.values(this.combatants).forEach(fighter => {
            if (!fighter || typeof fighter.inTrial !== 'number' || fighter.dead) return;
            const fails = this._willpowerCheck(fighter, sphinx);
            if (!fails) {
                fighter.trialSuccesses = (fighter.trialSuccesses || 0) + 1;
                const trialNames = ['First', 'Second', 'Third'];
                this.appendCombatLog(`${this.getCombatantLogName(fighter)} passes a willpower check in the ${trialNames[fighter.inTrial] || ''} Trial (${fighter.trialSuccesses}/2 successes).`);
                if (fighter.trialSuccesses >= 2) {
                    this._returnFromTrial(fighter);
                }
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(fighter)} fails their willpower check in the Trial.`);
            }
        });

        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    // GENERIC: Used for monsters and unrecognized unit types
    this._aiGeneric = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const scored = this._scoredAbilityPick(unit, target);
        let rangeType = 'close';
        if (scored) {
            rangeType = scored.resolved.range || 'close';
        } else {
            const baseAttack = Array.isArray(unit.attacks) && unit.attacks.length > 0 ? unit.attacks[0] : null;
            if (baseAttack) {
                if (typeof baseAttack === 'object') {
                    if (baseAttack.range) rangeType = baseAttack.range;
                } else if (typeof baseAttack === 'string') {
                    const resolved = this.resolveSpecial(unit, baseAttack);
                    if (resolved && resolved.range) {
                        rangeType = resolved.range;
                    }
                }
            }
        }
        const inRange = this.targetInRange(unit, target, rangeType);

        if (inRange) {
            if (scored) this.useAbility(unit, scored.resolved, target);
            else this._basicAttack(unit, target);
        } else {
            this.moveCloser(unit, target);
            if (this.targetInRange(unit, target, rangeType)) {
                if (scored) this.useAbility(unit, scored.resolved, target);
                else this._basicAttack(unit, target);
            }
        }
    };

    this._aiGoatDemon = (unit) => {
        this.acquireTarget(unit, true);
        let target = this.combatants[unit.targetId];
        if (!target) return;

        // Try to cast silence if ready and magic user is present
        const silenceSpec = this.resolveSpecial(unit, 'silence');
        if (silenceSpec && this._abilityReady(unit, 'silence')) {
            const magicUsers = Object.values(this.combatants).filter(c =>
                c && !c.dead && !c.isVCT && (!!c.isMonster !== !!unit.isMonster) &&
                ['summoner', 'wizard', 'sage'].includes(c.type)
            );
            if (magicUsers.length > 0) {
                const silenceTarget = magicUsers[Math.floor(Math.random() * magicUsers.length)];
                this.useAbility(unit, silenceSpec, silenceTarget);
                return;
            }
        }

        let scored = this._scoredAbilityPick(unit, target);
        let resolvedPick = scored?.resolved;
        let abilityKey = scored?.key;
        if (abilityKey === 'silence') {
            // Re-evaluate without silence
            resolvedPick = null;
            abilityKey = null;
            let best = null;
            let bestScore = -Infinity;
            unit.specials.forEach(s => {
                const key = this._resolveAbilityKey(s);
                if (key === 'silence') return;
                if (!key || !this._abilityReady(unit, key)) return;
                const resolved = this.resolveSpecial(unit, key);
                if (!resolved || resolved.type === 'passive' || resolved.isPassive) return;
                let score = 10;
                if (score > bestScore) {
                    bestScore = score;
                    best = { resolved, key };
                }
            });
            if (best) {
                resolvedPick = best.resolved;
                abilityKey = best.key;
            }
        }

        let rangeType = 'close';
        if (resolvedPick) {
            rangeType = resolvedPick.range || 'close';
        } else {
            const baseAttack = Array.isArray(unit.attacks) && unit.attacks.length > 0 ? unit.attacks[0] : null;
            if (baseAttack) {
                if (typeof baseAttack === 'object') {
                    if (baseAttack.range) rangeType = baseAttack.range;
                } else if (typeof baseAttack === 'string') {
                    const resolved = this.resolveSpecial(unit, baseAttack);
                    if (resolved && resolved.range) {
                        rangeType = resolved.range;
                    }
                }
            }
        }
        const inRange = this.targetInRange(unit, target, rangeType);

        if (inRange) {
            if (resolvedPick) this.useAbility(unit, resolvedPick, target);
            else this._basicAttack(unit, target);
        } else {
            this.moveCloser(unit, target);
            if (this.targetInRange(unit, target, rangeType)) {
                if (resolvedPick) this.useAbility(unit, resolvedPick, target);
                else this._basicAttack(unit, target);
            }
        }
    };

    // OGRE: stomping, headbutting, biting at adjacent range
    this._aiOgre = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const stompSpec = this.resolveSpecial(unit, 'stomp');
        const hbSpec = this.resolveSpecial(unit, 'head_butt');
        const biteSpec = this.resolveSpecial(unit, 'bite');

        const stompReady = stompSpec && this._abilityReady(unit, 'stomp');
        const hbReady = hbSpec && this._abilityReady(unit, 'head_butt');
        const biteReady = biteSpec && this._abilityReady(unit, 'bite');

        const inClose = this.targetInRange(unit, target, 'close');

        if (inClose) {
            if (stompReady) {
                this.useAbility(unit, stompSpec, target);
                return;
            }
            if (hbReady) {
                this.useAbility(unit, hbSpec, target);
                return;
            }
            if (biteReady) {
                this.useAbility(unit, biteSpec, target);
                return;
            }
            this._basicAttack(unit, target);
        } else {
            if (unit.movesTakenThisRound < 1) {
                this.moveCloser(unit, target);
                const nowClose = this.targetInRange(unit, target, 'close');
                if (nowClose) {
                    if (stompReady) {
                        this.useAbility(unit, stompSpec, target);
                        return;
                    }
                    if (hbReady) {
                        this.useAbility(unit, hbSpec, target);
                        return;
                    }
                    if (biteReady) {
                        this.useAbility(unit, biteSpec, target);
                        return;
                    }
                    this._basicAttack(unit, target);
                }
            }
        }
    };


    // VAMPIRE: relocation, health-drain, debuffing
    this._aiVampire = (unit) => {
        this.acquireTarget(unit, true);
        let target = this.combatants[unit.targetId];
        if (!target) return;

        // Melee players alive?
        const meleeAlive = Object.values(this.combatants).some(c =>
            c && !c.dead && !c.isVCT && !c.isMonster &&
            ['soldier', 'monk', 'barbarian'].includes(c.type)
        );

        const batFlyReady = this._abilityReady(unit, 'bat_fly');
        const crimsonSightReady = this._abilityReady(unit, 'crimson_sight');
        const biteReady = this._abilityReady(unit, 'vampiric_bite');
        const clawReady = this._abilityReady(unit, 'claw_strike');
        const soulSuckReady = this._abilityReady(unit, 'soul_suck');

        const squishies = Object.values(this.combatants).filter(c =>
            c && !c.dead && !c.isVCT && !c.isMonster &&
            ['sage', 'wizard', 'ranger'].includes(c.type)
        );

        // 1. CLEVER CHAIN COMBO (Crimson Sight -> Bat Fly -> Bite/Claw Strike)
        if (crimsonSightReady && batFlyReady && (biteReady || clawReady) && squishies.length > 0) {
            let bestDest = null;
            let targetSquishy = null;
            for (const sq of squishies) {
                const adjDirections = [
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                ];
                for (const dir of adjDirections) {
                    const tx = sq.coordinates.x + dir.dx;
                    const ty = sq.coordinates.y + dir.dy;
                    if (tx >= 0 && tx < MAX_DEPTH && ty >= 0 && ty < MAX_LANES) {
                        if (this.canFitAt(unit, tx, ty)) {
                            bestDest = { x: tx, y: ty };
                            targetSquishy = sq;
                            break;
                        }
                    }
                }
                if (bestDest) break;
            }
            if (bestDest && targetSquishy) {
                const crimsonSightSpec = this.resolveSpecial(unit, 'crimson_sight');
                const batFlySpec = this.resolveSpecial(unit, 'bat_fly');
                const strikeSpec = biteReady 
                    ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', flatDamage: 15, atkPercentage: 100 })
                    : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 10, atkPercentage: 100 });

                if (crimsonSightSpec && batFlySpec && strikeSpec) {
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} initiates a clever combo chain!`);
                    
                    // Crimson Sight (Reset action count to execute in one turn)
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, crimsonSightSpec, unit);

                    // Bat Fly (Delay to let Crimson Sight animation resolve, ~1550ms)
                    setTimeout(() => {
                        if (unit.dead || (targetSquishy && targetSquishy.dead)) return;
                        unit.batFlyCustomDest = bestDest;
                        unit.actionsTakenThisRound = 0;
                        this.useAbility(unit, batFlySpec, targetSquishy);
                        unit.targetId = targetSquishy.id;

                        // Bite / Claw (Delay to let Bat Fly animation resolve, ~1250ms)
                        setTimeout(() => {
                            if (unit.dead || (targetSquishy && targetSquishy.dead)) return;
                            unit.actionsTakenThisRound = 0;
                            this.useAbility(unit, strikeSpec, targetSquishy);

                            if (meleeAlive) {
                                unit.vampireState = 'retreat';
                            }
                        }, 1250);
                    }, 1550);

                    return;
                }
            }
        }

        // 2. BAT FLY IN AND STRIKE (Bat Fly -> Bite/Claw Strike)
        if (batFlyReady && squishies.length > 0) {
            let bestDest = null;
            let targetSquishy = null;
            for (const sq of squishies) {
                const adjDirections = [
                    { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
                    { dx: 0, dy: -1 }, { dx: 0, dy: 1 }
                ];
                for (const dir of adjDirections) {
                    const tx = sq.coordinates.x + dir.dx;
                    const ty = sq.coordinates.y + dir.dy;
                    if (tx >= 0 && tx < MAX_DEPTH && ty >= 0 && ty < MAX_LANES) {
                        if (this.canFitAt(unit, tx, ty)) {
                            bestDest = { x: tx, y: ty };
                            targetSquishy = sq;
                            break;
                        }
                    }
                }
                if (bestDest) break;
            }
            if (bestDest && targetSquishy) {
                const batFlySpec = this.resolveSpecial(unit, 'bat_fly');
                const strikeSpec = biteReady
                    ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', flatDamage: 15, atkPercentage: 100 })
                    : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 10, atkPercentage: 100 });

                if (batFlySpec && strikeSpec) {
                    // Bat Fly
                    unit.batFlyCustomDest = bestDest;
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, batFlySpec, targetSquishy);
                    unit.targetId = targetSquishy.id;

                    // Bite / Claw (Delay to let Bat Fly animation resolve, ~1250ms)
                    setTimeout(() => {
                        if (unit.dead || (targetSquishy && targetSquishy.dead)) return;
                        unit.actionsTakenThisRound = 0;
                        this.useAbility(unit, strikeSpec, targetSquishy);

                        if (meleeAlive) {
                            unit.vampireState = 'retreat';
                        }
                    }, 1250);

                    return;
                }
            }
        }

        // 3. CLOSE RANGE COMBAT & RETREAT
        const inRange = this.targetInRange(unit, target, 'close');
        if (inRange) {
            const strikeSpec = biteReady
                ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', flatDamage: 15, atkPercentage: 100 })
                : (clawReady ? (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 10, atkPercentage: 100 }) : null);

            if (strikeSpec) {
                this.useAbility(unit, strikeSpec, target);
            } else {
                this._basicAttack(unit, target);
            }

            // Retreat after striking if melee are alive to threaten him
            if (meleeAlive) {
                const currentX = unit.coordinates.x;
                const currentY = unit.coordinates.y;
                let retreatDest = null;
                const candidateOffsets = [
                    { dx: 2, dy: 0 }, { dx: 2, dy: -1 }, { dx: 2, dy: 1 },
                    { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 },
                    { dx: 3, dy: 0 }
                ];
                for (const offset of candidateOffsets) {
                    const rx = currentX + offset.dx;
                    const ry = currentY + offset.dy;
                    if (rx >= 0 && rx <= MAX_DEPTH && ry >= 0 && ry < MAX_LANES) {
                        if (this.canFitAt(unit, rx, ry)) {
                            retreatDest = { x: rx, y: ry };
                            break;
                        }
                    }
                }
                if (retreatDest) {
                    this.updateUnitCoordinates(unit, retreatDest.x, retreatDest.y);
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} retreats back to (${retreatDest.x}, ${retreatDest.y}) to maintain distance.`);
                }
            }
            return;
        }

        // 4. MEDIUM RANGE SPELLS
        if (crimsonSightReady) {
            const crimsonSightSpec = this.resolveSpecial(unit, 'crimson_sight');
            if (crimsonSightSpec) {
                this.useAbility(unit, crimsonSightSpec, unit);
                return;
            }
        }

        if (soulSuckReady && this.targetInRange(unit, target, 'medium')) {
            const soulSuckSpec = this.resolveSpecial(unit, 'soul_suck');
            if (soulSuckSpec) {
                this.useAbility(unit, soulSuckSpec, target);
                return;
            }
        }

        // Fallback: move closer or basic attack
        this.moveCloser(unit, target);
        if (this.targetInRange(unit, target, 'close')) {
            const strikeSpec = biteReady
                ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', flatDamage: 15, atkPercentage: 100 })
                : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 10, atkPercentage: 100 });
            this.useAbility(unit, strikeSpec, target);
        }
    };

    // DRAGON: whirlwinds, bombardments, dispels, laying eggs, claws/bites/fire breath
    this._aiDragon = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        // Resolve all specials
        const whirlwindSpec = this.resolveSpecial(unit, 'dragon_whirlwind');
        const bombardSpec = this.resolveSpecial(unit, 'bombard');
        const dispellSpec = this.resolveSpecial(unit, 'dragon_dispell');
        const layEggsSpec = this.resolveSpecial(unit, 'lay_eggs');

        // Resolve attacks
        const blueDragonBreathSpec = this.resolveSpecial(unit, 'blue_dragon_breath');
        const biteSpec = this.resolveSpecial(unit, 'bite');
        const clawSpec = this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', flatDamage: 0, atkPercentage: 100 };

        // Check readiness
        const whirlwindReady = whirlwindSpec && this._abilityReady(unit, 'dragon_whirlwind');
        const bombardReady = bombardSpec && this._abilityReady(unit, 'bombard');
        const dispellReady = dispellSpec && this._abilityReady(unit, 'dragon_dispell');
        const layEggsReady = layEggsSpec && this._abilityReady(unit, 'lay_eggs');
        const blueDragonBreathReady = blueDragonBreathSpec && this._abilityReady(unit, 'blue_dragon_breath');
        const biteReady = biteSpec && this._abilityReady(unit, 'bite');
        const clawReady = clawSpec && this._abilityReady(unit, 'claw_strike');

        // Count how many minions the dragon has alive
        const minionCount = Object.values(this.combatants).filter(c =>
            c && !c.dead && c.isMinion && c.isMonster
        ).length;

        // Check if any enemy is adjacent (close range) to the dragon
        const enemiesClose = Object.values(this.combatants).some(c =>
            c && !c.dead && !c.isMonster && !c.isVCT && this.targetInRange(unit, c, 'close')
        );

        // Check if any enemy has active buffs to dispel
        const enemiesWithBuffs = Object.values(this.combatants).filter(c => {
            if (!c || c.dead || c.isMonster || c.isVCT) return false;
            if (Array.isArray(c.activeBuffs) && c.activeBuffs.length > 0) return true;
            const flagsToCheck = [
                'inspiredActive',
                'berserkerActive',
                'etherealSpeedActive',
                'astralBeingActive',
                'thirdEyeActive',
                'defensiveStanceActive',
                'defensiveStance'
            ];
            return flagsToCheck.some(flag => c[flag]);
        });

        // 1. Prioritize Lay Eggs if minion count is low (max 2 active minions)
        if (layEggsReady && minionCount < 2) {
            // Find an adjacent cell to place the egg
            const adjacentCells = [];
            const occupied = unit.occupiedCoords || [unit.coordinates];
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            occupied.forEach(c => {
                if (c.x < minX) minX = c.x;
                if (c.x > maxX) maxX = c.x;
                if (c.y < minY) minY = c.y;
                if (c.y > maxY) maxY = c.y;
            });
            const tryX = minX - 1;
            for (let y = minY; y <= maxY; y++) {
                if (tryX >= 0 && tryX < MAX_DEPTH && y >= 0 && y < MAX_LANES) {
                    if (this.canFitAt({ size: 1 }, tryX, y)) {
                        adjacentCells.push({ x: tryX, y });
                    }
                }
            }
            if (adjacentCells.length > 0) {
                const spawnCoord = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
                const eggTarget = { id: 'egg_vct', coordinates: spawnCoord, name: 'Egg Spot', dead: false, isVCT: true };
                this.useAbility(unit, layEggsSpec, eggTarget);
                return;
            }
        }

        // 2. Dispel enemy buffs if any are active and dispell is ready
        if (dispellReady && enemiesWithBuffs.length > 0) {
            const targetEnemy = enemiesWithBuffs[0];
            if (this.targetInRange(unit, targetEnemy, 'medium')) {
                this.useAbility(unit, dispellSpec, targetEnemy);
                return;
            }
        }

        // 3. Whirlwind to push back enemies if they get too close
        if (whirlwindReady && enemiesClose) {
            this.useAbility(unit, whirlwindSpec, target);
            return;
        }

        // 4. Bombard (devastating range attack, priority over other actions)
        if (bombardReady) {
            let bombardTarget = target;
            if (!this.targetInRange(unit, bombardTarget, 'medium') || this.targetInRange(unit, bombardTarget, 'close')) {
                // Primary target is either out of range or adjacent. Find another enemy in range that is not adjacent.
                bombardTarget = Object.values(this.combatants).find(c =>
                    c && !c.dead && !c.isMonster && !c.isVCT &&
                    this.targetInRange(unit, c, 'medium') &&
                    !this.targetInRange(unit, c, 'close')
                );
            }
            if (bombardTarget) {
                this.useAbility(unit, bombardSpec, bombardTarget);
                return;
            }
        }

        // 5. Blue Dragon Breath (medium range cone attack)
        if (blueDragonBreathReady && this.targetInRange(unit, target, 'medium')) {
            this.useAbility(unit, blueDragonBreathSpec, target);
            return;
        }

        // 6. Close range combat: Claw Strike or Bite
        if (this.targetInRange(unit, target, 'close')) {
            if (clawReady) {
                this.useAbility(unit, clawSpec, target);
            } else if (biteReady) {
                this.useAbility(unit, biteSpec, target);
            } else {
                this._basicAttack(unit, target);
            }
            return;
        }

        // 7. If not in range of anything, move closer to the target
        this.moveCloser(unit, target);
        // After moving, check if we can attack
        if (this.targetInRange(unit, target, 'close')) {
            if (clawReady) {
                this.useAbility(unit, clawSpec, target);
            } else if (biteReady) {
                this.useAbility(unit, biteSpec, target);
            } else {
                this._basicAttack(unit, target);
            }
        } else if (blueDragonBreathReady && this.targetInRange(unit, target, 'medium')) {
            this.useAbility(unit, blueDragonBreathSpec, target);
        }
    };

    // BEHOLDER MINION: splitting / bifurcating, long range magic missile, claws
    this._aiBeholderMinion = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const bifurcateSpec = this.resolveSpecial(unit, 'bifurcate');
        const mmSpec = this.resolveSpecial(unit, 'minor_magic_missile');

        const bifurcateReady = bifurcateSpec && this._abilityReady(unit, 'bifurcate');
        const mmReady = mmSpec && this._abilityReady(unit, 'minor_magic_missile');

        // Simulate energy accumulation (starts at 0, builds +20 each turn/action)
        unit.energy = (unit.energy || 0) + 20;

        // 1. Bifurcate triggers at 100 energy OR if health drops below 75%
        if (bifurcateReady && !unit._hasCloned && ((unit.energy || 0) >= 100 || unit.hp < unit.starting_hp * 0.75)) {
            this.useAbility(unit, bifurcateSpec, unit);
            return;
        }

        // 2. Minor Magic Missile: 33% chance if ready and target is at far range
        if (mmReady && this.targetInRange(unit, target, 'far') && Math.random() < 0.33) {
            this.useAbility(unit, mmSpec, target);
            return;
        }

        // 3. Melee attack or move closer
        if (this.targetInRange(unit, target, 'close')) {
            this._basicAttack(unit, target);
        } else {
            this.moveCloser(unit, target);
            if (this.targetInRange(unit, target, 'close')) {
                this._basicAttack(unit, target);
            }
        }
    };

    // ── Cooldown Helper ───────────────────────────────────────────────────────
    this._setCooldown = (unit, key, rounds) => {
        const normalized = key.replace(/\s+/g, '_').toLowerCase();
        unit.cooldowns[normalized] = rounds;
    };

    this.dispelTarget = (target) => {
        if (!target) return 0;
        let dispelledCount = 0;
        if (Array.isArray(target.activeBuffs)) {
            const buffsToRevert = [...target.activeBuffs];
            buffsToRevert.forEach(buff => {
                this._revertBuff(target, buff);
                dispelledCount++;
            });
            target.activeBuffs = [];
        }
        const flagsToCheck = [
            'inspiredActive',
            'berserkerActive',
            'etherealSpeedActive',
            'astralBeingActive',
            'thirdEyeActive',
            'defensiveStanceActive',
            'defensiveStance'
        ];
        flagsToCheck.forEach(flag => {
            if (target[flag]) {
                target[flag] = false;
                dispelledCount++;
            }
        });
        target.berserkerRoundsLeft = 0;
        target.berserkerRounds = 0;
        target.berserkerTotalRounds = 0;
        target.etherealSpeedRoundsLeft = 0;
        target.etherealSpeedTotalRounds = 0;
        target.etherealSpeedTotalDurationMs = 0;
        target.etherealSpeedEndTimeMs = 0;
        target.astralBeingRoundsLeft = 0;
        target.astralBeingTotalRounds = 0;
        target.astralBeingTotalDurationMs = 0;
        target.astralBeingEndTimeMs = 0;
        target.thirdEyeRoundsLeft = 0;
        target.thirdEyeRounds = 0;
        target.thirdEyeTotalRounds = 0;
        target.thirdEyeEndTimeMs = 0;
        target.thirdEyeTotalDurationMs = 0;
        target.defensiveStanceRoundsLeft = 0;
        target.defensiveStanceRounds = 0;
        target.defensiveStanceTotalRounds = 0;
        return dispelledCount;
    };

    this._hatchEgg = (egg) => {
        const coords = { ...egg.coordinates };
        const id = egg.id;
        delete this.combatants[id];
        const hatchlingId = `hatchling_${Date.now()}`;
        const hpBase = 80;
        const newMinion = {
            id: hatchlingId,
            type: 'dragon_hatchling',
            name: 'Dragon Hatchling',
            isMinion: true,
            isMonster: true,
            dead: false,
            image_names: ['dragon_hatchling'],
            coordinates: coords,
            hp: hpBase,
            starting_hp: hpBase,
            stats: { str: 5, dex: 4, atk: 8, def: 5, speed: 6 },
            attacks: ['claw_strike', 'bite'],
            specials: [],
            portrait: images['dragon_hatchling'],
            cooldowns: {},
            movesTakenThisRound: 0,
            actionsTakenThisRound: 0,
            endurance: 40,
            maxEndurance: 40,
            damageIndicators: [],
            activeBuffs: [],
            activeDebuffs: [],
            invisible: false
        };
        this.combatants[hatchlingId] = newMinion;
        this._setCombatantOccupiedCoords(newMinion);
        this.appendCombatLog(`A Dragon Hatchling hatches from the egg!`);
        if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
            this.animManagerRedux.triggerAbility(coords, coords, 'summon', false, null, hatchlingId);
        }
    };

    this._resolveBombardmentStrike = (pb) => {
        const caster = this.combatants[pb.casterId];
        this.bombardWarnings = null;
        const targetCoords = pb.tiles.map(t => ({ x: t.x, y: t.y }));
        if (this.animManagerRedux && typeof this.animManagerRedux.triggerBombardStrike === 'function') {
            this.animManagerRedux.triggerBombardStrike(targetCoords);
        }
        setTimeout(() => {
            if (this.combatOver) return;
            const baseDamage = 35;
            const hitNames = [];
            pb.tiles.forEach(tile => {
                Object.values(this.combatants).forEach(c => {
                    if (!c || c.dead || c.isVCT) return;
                    const occupied = Array.isArray(c.occupiedCoords) ? c.occupiedCoords : [c.coordinates];
                    const standsOnTile = occupied.some(oc => oc.x === tile.x && oc.y === tile.y);
                    if (standsOnTile) {
                        const isEnemy = caster ? (!!caster.isMonster !== !!c.isMonster) : true;
                        if (isEnemy) {
                            const hit = this.hitCheck(caster || { stats: { dex: 8 } }, c);
                            if (hit) {
                                let finalDmg = this.damageCheck(caster || { stats: { atk: 15 } }, c, baseDamage);
                                c.hp = Math.max(0, c.hp - finalDmg);
                                if (finalDmg > 0) {
                                    this.wakeSleepingTarget(c, 'Bombardment');
                                }
                                c.damageIndicators = c.damageIndicators || [];
                                c.damageIndicators.push({
                                    id: Date.now() + Math.random(),
                                    value: `-${finalDmg}`,
                                    source: 'Bombardment',
                                    type: 'damage'
                                });
                                hitNames.push(`${this.getCombatantLogName(c)} (${finalDmg} dmg)`);
                                if (c.hp <= 0) {
                                    this.targetKilled(c);
                                }
                            }
                        }
                    }
                });
            });
            if (hitNames.length > 0) {
                this.appendCombatLog(`Bombardment strikes: ${hitNames.join(', ')}.`);
            } else {
                this.appendCombatLog(`Bombardment strikes empty ground.`);
            }
            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        }, 1000);
    };

    // ── Ability Use ───────────────────────────────────────────────────────────
    this.useAbility = (unit, ability, target) => {
        if (!ability || !target) return;

        const activeArrowType = unit.notchedArrowType;

        if (target && target.isVCT && target.parentMonsterId && this.combatants[target.parentMonsterId]) {
            target = this.combatants[target.parentMonsterId];
        }

        if (target && target.id !== unit.id && ability.range !== 'self') {
            let targetCoords = target.coordinates;
            if (targetCoords && unit.coordinates) {
                if (target.occupiedCoords && target.occupiedCoords.length > 0) {
                    let minDistance = Infinity;
                    target.occupiedCoords.forEach(tc => {
                        const dist = Math.abs(unit.coordinates.x - tc.x) + Math.abs(unit.coordinates.y - tc.y);
                        if (dist < minDistance) {
                            minDistance = dist;
                            targetCoords = tc;
                        }
                    });
                }
                if (targetCoords.x !== unit.coordinates.x) {
                    unit.facing = targetCoords.x > unit.coordinates.x ? 'right' : 'left';
                } else {
                    unit.facing = targetCoords.y > unit.coordinates.y ? 'down' : 'up';
                }
            }
        }

        const origCallerCoords = { x: unit.coordinates.x, y: unit.coordinates.y };
        const origCallerOccupied = Array.isArray(unit.occupiedCoords) ? clone(unit.occupiedCoords) : null;

        // Morale Shaken check: 5% chance to refuse to use a special ability and use basic attack instead
        const abilityId = ability.id || ability.key || (ability.name && ability.name.replace(/\s+/g, '_').toLowerCase()) || 'ability';
        const isSelfTarget = target.id === unit.id || ability.range === 'self';
        const isMagicMissile = ['magic_missile', 'minor_magic_missile', 'major_magic_missile'].includes(abilityId);
        const preRolledHits = [];
        if (isMagicMissile) {
            for (let h = 0; h < 3; h++) {
                preRolledHits.push(isSelfTarget ? true : this.hitCheck(unit, target));
            }
        } else if (abilityId === 'acid_blast') {
            preRolledHits.push(isSelfTarget ? true : this.hitCheck(unit, target));
        }
        const isMeleeAbility = [
            'claw_strike', 'claws', 'bite', 'crush', 'tackle', 'stomp', 'head_butt',
            'slash', 'barbarian_slash', 'cleave', 'barbarian_cleave', 'imbued_strike',
            'monk_punch', 'punch', 'force_punch', 'shield_slam', 'shield_bash',
            'sword_swing', 'rake', 'gore_horns'
        ].includes(abilityId);
        if (abilityId === 'notch') {
            unit.arrowNotched = true;
            unit.notchedArrowType = ['force', 'ice', 'poison', 'celestial'][Math.floor(Math.random() * 4)];
        }
        const isBasicAttack = unit.attacks && unit.attacks.includes(abilityId);
        if (unit.silenced && !isBasicAttack && abilityId !== 'meditate' && abilityId !== 'monk_meditate') {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is silenced and cannot cast specials!`);
            return;
        }
        if (unit && !unit.isMonster && !isBasicAttack) {
            const meta = getMeta();
            const resolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            if (resolve >= 20 && resolve <= 39 && Math.random() < 0.05) {
                const basicAttackKey = (unit.attacks && unit.attacks[0]) || 'slash';
                const basicAttack = this.resolveSpecial(unit.attacks, basicAttackKey) || attacksMatrix[basicAttackKey] || { id: basicAttackKey, name: basicAttackKey, range: 'close', type: 'damage' };
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is shaken and refuses to use ${ability.name || abilityId}! They use ${basicAttack.name || basicAttackKey} instead.`);
                return this.useAbility(unit, basicAttack, target);
            }
        }
        
        unit.attacking = true;
        unit.activeAbility = ability;
        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
        setTimeout(() => {
            unit.attacking = false;
            unit.activeAbility = null;
            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        }, 350);

        if (unit.actionsTakenThisRound >= 1) return;
        unit.actionsTakenThisRound += 1;
        this.applyEnduranceCost(unit, this.ACTION_ENDURANCE_COST, ability.id || ability.name || 'ability');

        // Endurance-penalty cooldown scaling
        const baseCooldown = (typeof ability.cooldown === 'number') ? ability.cooldown : 5;
        let cooldownPenalty = unit.exhausted ? 2.0 : 1.0;
        if (!unit.exhausted && unit.endurance <= unit.maxEndurance * 0.5) {
            cooldownPenalty = 1.5;
        }
        const finalCooldown = Math.round(baseCooldown * cooldownPenalty);
        unit.cooldowns[abilityId] = finalCooldown;

        if (abilityId === 'dragon_dispell' || abilityId === 'dispell') {
            const count = this.dispelTarget(target);
            this.appendCombatLog(`${this.getCombatantLogName(unit)} dispels magical effects from ${this.getCombatantLogName(target)}! (Removed ${count} buffs/effects)`);
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'dragon_dispell', false, null, unit.id);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // ── SILENCE ─────────────────────────────────────────────────────────────
        if (abilityId === 'silence') {
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'silence', false, null, unit.id);
            }
            const dur = getDurationRounds(ability.duration || 'short') || 2;
            target.silenced = true;
            target.silenceRounds = dur;
            this._applyDebuff(target, null, 'silenced', dur);
            this.appendCombatLog(`${this.getCombatantLogName(target)} is silenced and cannot use skills!`);
            
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // ── DEMON MARK ──────────────────────────────────────────────────────────
        if (abilityId === 'demon_mark') {
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'demon_mark', false, null, unit.id);
            }
            const dur = getDurationRounds(ability.duration || 'long') || 4;
            
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (isEnemy) {
                    c.demonMarked = true;
                    c.demonMarkedRounds = dur;
                    this._applyDebuff(c, null, 'demon_mark', dur);
                    this.appendCombatLog(`${this.getCombatantLogName(c)} is marked by the Demon Mark!`);
                    
                    if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                        this.animManagerRedux.triggerAbility(unit.coordinates, c.coordinates, 'demon_mark_hit', false, null, unit.id);
                    }
                }
            });
            
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // ── NEW MOON ────────────────────────────────────────────────────────────
        if (abilityId === 'new_moon') {
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'new_moon', false, null, unit.id);
            }
            const dur = getDurationRounds(ability.duration || 'long') || 4;
            
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isAlly = (!!unit.isMonster === !!c.isMonster);
                const isDemon = c.subtype === 'demon' || c.type === 'goat_demon' || c.key === 'goat_demon';
                if (isAlly && isDemon) {
                    const isDemonKid = c.type && c.type.includes('demon_kid');
                    const atkPct = isDemonKid ? 0.60 : 0.40;
                    const fearChance = isDemonKid ? 50 : 40;
                    const flatAtkBoost = Math.round((c.stats.atk || 10) * atkPct);
                    
                    c.newMoonBuff = true;
                    c.newMoonAtkBoost = flatAtkBoost;
                    c.newMoonFearChance = fearChance;
                    c.newMoonRounds = dur;
                    
                    this._applyBuff(c, {
                        increase_stats: {
                            stats: [
                                { stat: 'atk', amount: flatAtkBoost }
                            ]
                        }
                    }, 'New Moon', dur);
                    
                    this.appendCombatLog(`${this.getCombatantLogName(c)} gets +${isDemonKid ? '60%' : '40%'} Attack boost from New Moon!`);
                }
            });
            
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // ── DOMINATE MINION ─────────────────────────────────────────────────────
        if (abilityId === 'dominate_minion') {
            if (!target || !target.isMinion) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} tries to dominate, but finds no minion to control.`);
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
            // Willpower check: summoner INT vs target willpower (or int if willpower absent)
            const summonerINT = (unit.stats && unit.stats.int) || 8;
            const minionWP   = (target.stats && (target.stats.willpower || target.stats.int)) || 5;
            // Roll: summoner INT + 1d10 vs minion WP + 1d10
            const attackRoll  = summonerINT + Math.floor(Math.random() * 10) + 1;
            const defenseRoll = minionWP    + Math.floor(Math.random() * 10) + 1;
            const success = attackRoll > defenseRoll;
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'dominate_minion', false, null, unit.id);
            }
            if (success) {
                // Switch sides: flip isMonster flag and clear targeting
                target.isMonster = !unit.isMonster; // now on same team as summoner's allies
                target.dominatedBy = unit.id;
                target.targetId = null;
                // Restore a burst of HP to the dominated minion (25% max)
                const hpBoost = Math.round((target.starting_hp || target.hp || 20) * 0.25);
                target.hp = Math.min(target.starting_hp || 999, (target.hp || 0) + hpBoost);
                this.appendCombatLog(
                    `${this.getCombatantLogName(unit)} DOMINATES ${this.getCombatantLogName(target)}! ` +
                    `(Roll ${attackRoll} vs ${defenseRoll}) — it now fights for your side! (+${hpBoost} HP)`
                );
            } else {
                // Failed: minion resists, summoner takes minor psychic backlash damage
                const backlash = Math.max(2, Math.floor(minionWP * 0.4));
                unit.hp = Math.max(0, (unit.hp || 0) - backlash);
                this.appendCombatLog(
                    `${this.getCombatantLogName(unit)}'s Dominate Minion RESISTED by ${this.getCombatantLogName(target)}! ` +
                    `(Roll ${attackRoll} vs ${defenseRoll}) — psychic backlash deals ${backlash} damage!`
                );
                if (unit.hp <= 0) this.targetKilled(unit);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'bifurcate') {
            if (unit._hasCloned) return;
            unit._hasCloned = true;

            const findSpawnCoords = (caller) => {
                const occupiedYs = new Set(
                    Object.values(this.combatants).filter(c => c && !c.dead && !c.isVCT).map(c => c.coordinates.y)
                );
                const preferredXs = [caller.coordinates.x, Math.max(0, caller.coordinates.x - 1), Math.min(MAX_DEPTH, caller.coordinates.x + 1)];
                for (const x of preferredXs) {
                    for (let y = 0; y < MAX_LANES; y++) {
                        if (!occupiedYs.has(y) && !this.isTileOccupied(x, y)) {
                            return { x, y };
                        }
                    }
                }
                // Fallback: search any free tile on right side (x >= 3)
                for (let x = 3; x <= MAX_DEPTH; x++) {
                    for (let y = 0; y < MAX_LANES; y++) {
                        if (!this.isTileOccupied(x, y)) {
                            return { x, y };
                        }
                    }
                }
                return null;
            };

            const coords1 = findSpawnCoords(unit);
            if (!coords1) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} tried to bifurcate, but no free tile was found.`);
                return;
            }

            const tempId = `__bif_temp_${Date.now()}`;
            this.combatants[tempId] = { dead: false, coordinates: coords1 };
            const coords2 = findSpawnCoords(unit);
            delete this.combatants[tempId];

            if (!coords2) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} tried to bifurcate, but couldn't find a second free tile.`);
                return;
            }

            this.appendCombatLog(`${this.getCombatantLogName(unit)} splits into two smaller copies!`);

            const originalHp = unit.hp;
            const halfHp = Math.max(1, Math.floor(originalHp / 2));

            // Set original to dead / bifurcating
            unit.hp = 0;
            unit.dead = true;
            unit.bifurcating = true;

            const makeCopy = (idSuffix, coords, nameSuffix) => {
                const copyId = `${unit.id}_bif_${idSuffix}`;
                const copy = {
                    ...clone(unit),
                    id: copyId,
                    name: `${unit.name || 'Beholder Minion'}${nameSuffix}`,
                    hp: halfHp,
                    starting_hp: halfHp,
                    stats: {
                        ...unit.stats,
                        hp: halfHp
                    },
                    coordinates: coords,
                    dead: false,
                    bifurcating: false,
                    _hasCloned: true,
                    isBifurcateCopy: true,
                    isBifurcateSmall: true,
                    specials: (unit.specials || []).filter(s => {
                        const name = typeof s === 'string' ? s : (s.id || s.key || s.name || '');
                        const norm = name.replace(/\s+/g, '_').toLowerCase();
                        return norm !== 'bifurcate' && norm !== 'duplicate';
                    }),
                    attacks: ['claws'],
                    actionsTakenThisRound: 0,
                    movesTakenThisRound: 0,
                    damageIndicators: [],
                    activeBuffs: [],
                    activeDebuffs: [],
                    invisible: false,
                    fadingIn: true
                };
                return copy;
            };

            const copy1 = makeCopy('1', coords1, ' α');
            const copy2 = makeCopy('2', coords2, ' β');

            this.combatants[copy1.id] = copy1;
            this.combatants[copy2.id] = copy2;
            this._setCombatantOccupiedCoords(copy1);
            this._setCombatantOccupiedCoords(copy2);

            setTimeout(() => {
                copy1.fadingIn = false;
                copy2.fadingIn = false;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            }, 600);

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'dragon_whirlwind') {
            const hOffset = (unit.coordinates.x >= 4) ? -1 : 1;
            const centerX = unit.coordinates.x + hOffset;
            const centerY = unit.coordinates.y - 1;
            const dragonOccupied = unit.occupiedCoords || [unit.coordinates];
            const pushedUnitIds = new Set();

            const pushUnitCascade = (unitToPush, px, py) => {
                if (pushedUnitIds.has(unitToPush.id)) return true;

                const targetX = unitToPush.coordinates.x + px;
                const targetY = unitToPush.coordinates.y + py;

                if (targetX < 0 || targetX > MAX_DEPTH || targetY < 0 || targetY >= MAX_LANES) {
                    return false;
                }

                const occupier = Object.values(this.combatants).find(c => {
                    if (!c || c.dead || c.isVCT || c.id === unitToPush.id) return false;
                    const occupied = Array.isArray(c.occupiedCoords) ? c.occupiedCoords : [c.coordinates];
                    return occupied.some(coord => coord.x === targetX && coord.y === targetY);
                });

                if (occupier) {
                    const occupierPushed = pushUnitCascade(occupier, px, py);
                    if (!occupierPushed) {
                        return false;
                    }
                }

                if (this.canFitAt(unitToPush, targetX, targetY)) {
                    this.updateUnitCoordinates(unitToPush, targetX, targetY);
                    pushedUnitIds.add(unitToPush.id);
                    this.appendCombatLog(`${this.getCombatantLogName(unitToPush)} is pushed back by the Whirlwind!`);
                    return true;
                }
                return false;
            };

            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (!isEnemy) return;
                if (pushedUnitIds.has(c.id)) return;

                const isAdjacent = dragonOccupied.some(oc => 
                    Math.abs(oc.x - c.coordinates.x) <= 2 && Math.abs(oc.y - c.coordinates.y) <= 2
                );

                if (isAdjacent) {
                    if (this.shouldPushbackSucceed(c)) {
                        const dx = c.coordinates.x - centerX;
                        const dy = c.coordinates.y - centerY;
                        let pushX = 0;
                        let pushY = 0;

                        if (Math.abs(dx) >= Math.abs(dy)) {
                            pushX = dx >= 0 ? 1 : -1;
                        } else {
                            pushY = dy >= 0 ? 1 : -1;
                        }

                        pushUnitCascade(c, pushX, pushY);
                    } else {
                        this.appendCombatLog(`${this.getCombatantLogName(c)} resisted the push back from the Whirlwind!`);
                    }
                }
            });

            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, unit.coordinates, 'dragon_whirlwind', false, null, unit.id);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'lay_eggs') {
            const eggId = `dragon_egg_${Date.now()}`;
            const hpBase = 50;

            const eggMinion = {
                id: eggId,
                type: 'dragon_egg',
                name: 'Dragon Egg',
                isMinion: true,
                isMonster: true,
                dead: false,
                coordinates: { ...target.coordinates },
                hp: hpBase,
                starting_hp: hpBase,
                stats: { str: 1, dex: 0, atk: 0, def: 5, speed: 0, fort: 10 },
                attacks: [],
                specials: [],
                portrait: 'egg_1',
                cooldowns: {},
                movesTakenThisRound: 0,
                actionsTakenThisRound: 0,
                endurance: 0,
                maxEndurance: 0,
                damageIndicators: [],
                activeBuffs: [],
                activeDebuffs: [],
                hatchTimer: 6,
                invisible: false
            };

            this.combatants[eggId] = eggMinion;
            this._setCombatantOccupiedCoords(eggMinion);
            this.appendCombatLog(`${this.getCombatantLogName(unit)} lays a Dragon Egg!`);

            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'lay_eggs', false, null, unit.id);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'bombard') {
            const center = { x: target.coordinates.x, y: target.coordinates.y };

            // Safeguard: Ensure center is never adjacent to or on the caster
            const casterCoords = unit.occupiedCoords || [unit.coordinates];
            const isAdjacentOrOccupied = (x, y) => casterCoords.some(cc =>
                Math.abs(cc.x - x) <= 1 && Math.abs(cc.y - y) <= 1
            );

            if (isAdjacentOrOccupied(center.x, center.y)) {
                let foundSafe = false;
                for (let d = 1; d < Math.max(MAX_DEPTH, MAX_LANES); d++) {
                    for (let dx = -d; dx <= d; dx++) {
                        for (let dy = -d; dy <= d; dy++) {
                            if (Math.abs(dx) === d || Math.abs(dy) === d) {
                                const tx = center.x + dx;
                                const ty = center.y + dy;
                                if (tx >= 0 && tx < MAX_DEPTH && ty >= 0 && ty < MAX_LANES) {
                                    if (!isAdjacentOrOccupied(tx, ty)) {
                                        center.x = tx;
                                        center.y = ty;
                                        foundSafe = true;
                                        break;
                                    }
                                }
                            }
                        }
                        if (foundSafe) break;
                    }
                    if (foundSafe) break;
                }
            }

            const candidates = [];
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    const tx = center.x + dx;
                    const ty = center.y + dy;
                    if (tx >= 0 && tx < MAX_DEPTH && ty >= 0 && ty < MAX_LANES) {
                        if (!isAdjacentOrOccupied(tx, ty)) {
                            candidates.push({ x: tx, y: ty });
                        }
                    }
                }
            }
            const shuffled = [...candidates].sort(() => 0.5 - Math.random());
            const strike1 = shuffled[0] || center;
            const strike2 = shuffled[1] || strike1;
            const strike3 = shuffled[2] || strike2;

            const tiles = [
                { x: strike1.x, y: strike1.y, col: strike1.x, row: strike1.y, key: 'main' },
                { x: strike2.x, y: strike2.y, col: strike2.x, row: strike2.y, key: 'adj1' },
                { x: strike3.x, y: strike3.y, col: strike3.x, row: strike3.y, key: 'adj2' }
            ];

            this.bombardWarnings = { tiles };

            this.pendingBombardments.push({
                roundsRemaining: 1,
                tiles,
                casterId: unit.id
            });

            this.appendCombatLog(`${this.getCombatantLogName(unit)} launches a devastating Bombardment! Warning shimmers appear on targeted tiles.`);
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, center, 'bombard', false, null, unit.id);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'fire_breath' || abilityId === 'blue_dragon_breath') {
            const rawDamage = ability.damage || 25;
            let hitCount = 0;
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (!isEnemy) return;

                if (this.targetInRange(unit, c, 'medium')) {
                    const hit = this.hitCheck(unit, c);
                    if (hit) {
                        let finalDmg = this.damageCheck(unit, c, rawDamage);
                        c.hp = Math.max(0, c.hp - finalDmg);
                        if (finalDmg > 0) this.wakeSleepingTarget(c, 'Blue Dragon Breath');
                        c.damageIndicators = c.damageIndicators || [];
                        c.damageIndicators.push({
                            id: Date.now() + Math.random(),
                            value: `-${finalDmg}`,
                            source: 'Blue Dragon Breath',
                            type: 'damage'
                        });
                        hitCount++;
                        if (c.hp <= 0) this.targetKilled(c);
                    }
                }
            });

            this.appendCombatLog(`${this.getCombatantLogName(unit)} unleashes Blue Dragon Breath! Hits ${hitCount} enemies.`);
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'blue_dragon_breath', false, null, unit.id);
            }
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'induce_fear') {
            if (typeof this.triggerBoardEvent === 'function') {
                this.triggerBoardEvent('induce_fear', { duration: 1800 });
            }
            const dur = getDurationRounds(ability.duration || 'short') || 2;
            const now = Date.now();

            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (isEnemy) {
                    if (c.type === 'dragon' && Math.random() < 0.5) {
                        this.appendCombatLog(`${this.getCombatantLogName(c)} resists Induce Fear! (Dragon CC Immunity)`);
                    } else {
                        this._applyDebuff(c, {
                            decrease_stats: {
                                stats: [
                                    { stat: 'atk', amount: 30, isPercent: true },
                                    { stat: 'def', amount: 30, isPercent: true }
                                ]
                            }
                        }, 'Induce Fear', dur);

                        const finalDurMs = getStatusDurationMs(c, dur);
                        c.stunned = true;
                        c.stunnedRounds = dur;
                        c.stunnedTotalRounds = dur;
                        c.stunnedStackDuration = dur;
                        c.stunnedTotalDurationMs = finalDurMs;
                        c.stunnedEndTimeMs = now + finalDurMs;

                        c.feared = true;
                        c.fearRounds = dur;
                        c.fearTotalRounds = dur;
                        c.fearTotalDurationMs = finalDurMs;
                        c.fearEndTimeMs = now + finalDurMs;

                        c.asleep = false;
                        c.sleepTotalDurationMs = 0;
                        c.sleepEndTimeMs = 0;

                        this.appendCombatLog(`${this.getCombatantLogName(c)} is terrified by Mummy's scream!`);
                    }
                }
            });
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        }

        if (abilityId === 'despair' || abilityId === 'dispair') {
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'despair', false, null, unit.id);
            }

            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (isEnemy) {
                    c.endurance = Math.max(0, (c.endurance || 0) - 30);
                    c.damageIndicators = c.damageIndicators || [];
                    c.damageIndicators.push({
                        id: Date.now() + Math.random(),
                        value: '-30 Stamina',
                        source: 'Despair',
                        type: 'debuff'
                    });

                    if (c.endurance <= 0 && !c.exhausted) {
                        this.applyEnduranceCost(c, 0, 'Despair');
                    }
                }
            });

            const meta = getMeta();
            const currentResolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            const penalty = applyResolvePenalty(20);
            meta.resolve = Math.max(0, currentResolve - penalty);
            storeMeta(meta);

            this.appendCombatLog(`${this.getCombatantLogName(unit)} casts Despair! Drains 30 stamina from all enemies and reduces resolve by ${penalty} (Current: ${meta.resolve}).`);

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'begin_the_trials') {
            // Create the trial effect icon pseudo-combatant
            const trialHp = Math.max(10, Math.round((unit.hp || 100) / 3));

            // anchorCoords is the topmost, leftmost tile the Sphinx occupies.
            // The 2×2 icon must spawn ABOVE the Sphinx — 2 rows up from the anchor.
            // The AI gate (topRow >= 2) already guarantees these rows are on-screen.
            const anchorCoords = this._getSphinxAnchorCoords(unit);
            const iconCoords = anchorCoords
                ? { x: anchorCoords.x, y: anchorCoords.y - 2 }
                : { x: -10, y: -10 };

            this.combatants['trials_icon'] = {
                id: 'trials_icon',
                name: 'Trial Effect',
                type: 'trials_icon',
                isTrialIcon: true,
                isMonster: true,        // so fighters can target it
                isMinion: true,         // exclude from VCT handling
                hp: trialHp,
                maxHp: trialHp,
                starting_hp: trialHp,
                coordinates: iconCoords,
                dead: false,
                stats: { atk: 0, def: 0, spd: 0 },
                cooldowns: {},
                movesTakenThisRound: 0,
                actionsTakenThisRound: 0,
                damageIndicators: [],
                manualControl: false,
                skipAI: true,
            };

            this._triggerEagleEyePassives(this.combatants['trials_icon']);

            // Initialize trial schedule on sphinx
            unit.trialsActive = {
                startRound: this.round,
                phaseFired: [false, false, false],
            };

            this.appendCombatLog(`${this.getCombatantLogName(unit)} begins the Trials of the Sphinx! A mystical Trial Effect Icon appears above the Sphinx.`);

            // Trigger appear animation at the icon's fixed position
            if (this.animManagerRedux && typeof this.animManagerRedux.triggerTrialIconAppear === 'function' && anchorCoords) {
                this.animManagerRedux.triggerTrialIconAppear(iconCoords);
            }

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }


        if (abilityId === 'monk_meditate') {
            unit.endurance = unit.maxEndurance;
            unit.asleep = false;
            unit.sleepRounds = 0;
            unit.sleepTotalRounds = 0;
            unit.sleepTotalDurationMs = 0;
            unit.sleepEndTimeMs = 0;
            unit.stunned = false;
            unit.stunnedRounds = 0;
            unit.stunnedTotalRounds = 0;
            unit.stunnedStackDuration = 0;
            unit.stunnedTotalDurationMs = 0;
            unit.stunnedEndTimeMs = 0;
            // Restore 25% HP
            const healAmt = Math.round((unit.starting_hp || unit.hp || 100) * 0.25);
            unit.hp = Math.min(unit.starting_hp || unit.hp, unit.hp + healAmt);
            unit.damageIndicators = unit.damageIndicators || [];
            unit.damageIndicators.push({ id: Date.now() + Math.random(), value: `+${healAmt}`, source: 'Meditate', type: 'heal' });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} meditates, restoring stamina to full and +${healAmt} HP.`);
        }

        if (abilityId === 'barbarian_leap_attack') {
            const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0)
                ? target.occupiedCoords
                : [target.coordinates];
            
            let bestAdj = null;
            let minSelfDist = Infinity;
            for (const tile of targetTiles) {
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = tile.x + dx;
                        const ny = tile.y + dy;
                        if (nx < 0 || nx > MAX_DEPTH || ny < 0 || ny >= MAX_LANES) continue;
                        if (this.isTileOccupied(nx, ny, unit.id)) continue;
                        const dSelf = Math.abs(origCallerCoords.x - nx) + Math.abs(origCallerCoords.y - ny);
                        if (dSelf < minSelfDist) {
                            minSelfDist = dSelf;
                            bestAdj = { x: nx, y: ny };
                        }
                    }
                }
            }
            if (bestAdj) {
                this.updateUnitCoordinates(unit, bestAdj.x, bestAdj.y);
            }
        }

        if (abilityId === 'bat_fly') {
            let foundDest = null;
            if (unit.batFlyCustomDest) {
                foundDest = unit.batFlyCustomDest;
                delete unit.batFlyCustomDest;
            } else {
                const checkCols = [MAX_DEPTH, MAX_DEPTH - 1, MAX_DEPTH - 2];
                outerLoop: for (const col of checkCols) {
                    for (let lane = 0; lane < MAX_LANES; lane++) {
                        if (this.canFitAt(unit, col, lane)) {
                            foundDest = { x: col, y: lane };
                            break outerLoop;
                        }
                    }
                }
            }
            if (foundDest) {
                this.updateUnitCoordinates(unit, foundDest.x, foundDest.y);
                this.appendCombatLog(`${this.getCombatantLogName(unit)} transforms into bats and teleports to (${foundDest.x}, ${foundDest.y}).`);
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} fails to find space to fly to.`);
            }
        }

        if (abilityId === 'soul_suck') {
            const drainAmt = 8;
            target.hp = Math.max(0, target.hp - drainAmt);
            unit.hp = Math.min(unit.starting_hp || unit.hp, unit.hp + drainAmt);
            target.damageIndicators = target.damageIndicators || [];
            target.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${drainAmt}`, source: 'Soul Suck', type: 'damage' });
            unit.damageIndicators = unit.damageIndicators || [];
            unit.damageIndicators.push({ id: Date.now() + Math.random(), value: `+${drainAmt}`, source: 'Soul Suck', type: 'heal' });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} sucks the soul of ${this.getCombatantLogName(target)} for ${drainAmt} drain.`);
            if (target.hp <= 0) {
                this.targetKilled(target);
            }
        }

        if (abilityId === 'crimson_sight') {
            this._applyBuff(unit, { increase_stats: { stats: [{ stat: 'atk', amount: 5 }, { stat: 'dex', amount: 5 }] } }, 'Crimson Sight', 2);
            this.appendCombatLog(`${this.getCombatantLogName(unit)} focuses with Crimson Sight, gaining increased attack and dexterity!`);
        }

        // Visual animation hook (legacy canvas system)
        if (this.animationManager && typeof this.animationManager.triggerVisualAbility === 'function') {
            this.animationManager.triggerVisualAbility(unit.id, target.id, ability);
        }
        // Sandbox-style Redux animation hook (pure CSS/state)
        if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
            const isTargetLarge = target.isLarge 
                || target.size === 2 
                || (target.isMonster === true && target.isMinion !== true)
                || (target.type && ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire', 'summoned_djinn', 'summoned_mummy', 'summoned_ogre', 'summoned_vampire'].includes(target.type) && target.isMinion !== true);
            // Find closest tiles between caller and target
            const callerTiles = (origCallerOccupied && origCallerOccupied.length > 0) ? origCallerOccupied : [origCallerCoords];
            const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0) ? target.occupiedCoords : [target.coordinates];
            let bestCallerCoord = origCallerCoords;
            let bestTargetCoord = target.coordinates;
            let minDistance = Infinity;
            callerTiles.forEach(cc => {
                targetTiles.forEach(tc => {
                    const dist = Math.abs(cc.x - tc.x) + Math.abs(cc.y - tc.y);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestCallerCoord = cc;
                        bestTargetCoord = tc;
                    }
                });
            });

            const isCallerLarge = unit.isMonster && !unit.isMinion && (
                unit.tier === 4 || unit.type === 'dragon' || unit.key === 'dragon' || unit.huge === true || unit.size === 3 ||
                unit.type === 'sphinx' || unit.key === 'sphinx' ||
                ['beholder', 'ogre', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire'].includes(unit.type)
            );
            // isMeleeAbility is defined in outer useAbility scope

            let sourceCoord = bestCallerCoord;
            if (isCallerLarge && !isMeleeAbility) {
                sourceCoord = unit.coordinates;
            }

            let targetCoord = bestTargetCoord;
            if (isTargetLarge && !isMeleeAbility) {
                targetCoord = target.coordinates;
            }
            if (abilityId === 'barbarian_leap_attack') {
                targetCoord = { x: unit.coordinates.x, y: unit.coordinates.y };
            }
            this.animManagerRedux.triggerAbility(sourceCoord, targetCoord, abilityId, isTargetLarge, targetTiles, unit.id, activeArrowType, null, preRolledHits);
        }

        if (abilityId === 'loose' || abilityId === 'execute' || abilityId === 'deadeye_shot') {
            unit.arrowNotched = false;
            unit.notchedArrowType = null;
        }

        // Apply self-buffs
        const effects = Array.isArray(ability.effect) ? ability.effect : (ability.effect ? [ability.effect] : []);
        if (effects.some(e => typeof e === 'string' && e.includes('buff_self')) && ability.buff) {
            this._applyBuff(unit, ability.buff.increase_stats ? ability.buff : { increase_stats: { stats: [] } },
                ability.name, getDurationRounds(ability.duration || 'long'));
        }

        const selfBuffDuration = getDurationRounds(ability.duration || 'long');
        const selfBuffDurationMs = getDurationMsFromRounds(selfBuffDuration);
        if (abilityId === 'inspire') {
            // Apply Inspire buff to all allied units within medium range (~3 tiles)
            const inspireRange = 3;
            const durationRounds = getDurationRounds('long');
            let inspiredCount = 0;
            Object.values(this.combatants).forEach(ally => {
                if (!ally || ally.dead || ally.isMonster || ally.isMinion || ally.isVCT) return;
                const dx = Math.abs((ally.coordinates?.x || 0) - (unit.coordinates?.x || 0));
                const dy = Math.abs((ally.coordinates?.y || 0) - (unit.coordinates?.y || 0));
                if (dx + dy <= inspireRange) {
                    this._applyBuff(ally, { increase_stats: { stats: [] } }, 'Inspire', durationRounds);
                    ally.inspiredActive = true;
                    inspiredCount++;
                }
            });
            // Always inspire self too
            this._applyBuff(unit, { increase_stats: { stats: [] } }, 'Inspire', durationRounds);
            unit.inspiredActive = true;
            this.appendCombatLog(`${this.getCombatantLogName(unit)} Inspires the party! ${inspiredCount} allies are filled with resolve.`);
        }
        if (abilityId === 'monk_ethereal_speed') {
            unit.etherealSpeedActive = true;
            unit.etherealSpeedRoundsLeft = selfBuffDuration;
            unit.etherealSpeedTotalRounds = selfBuffDuration;
            unit.etherealSpeedTotalDurationMs = selfBuffDurationMs;
            unit.etherealSpeedEndTimeMs = Date.now() + selfBuffDurationMs;
        }
        if (abilityId === 'monk_astral_focus') {
            this._applyBuff(unit, { increase_stats: { stats: [] } }, 'astral_being', selfBuffDuration);
            unit.astralBeingActive = true;
            unit.astralBeingRoundsLeft = selfBuffDuration;
            unit.astralBeingTotalRounds = selfBuffDuration;
            unit.astralBeingTotalDurationMs = selfBuffDurationMs;
            unit.astralBeingEndTimeMs = Date.now() + selfBuffDurationMs;
        }
        if (abilityId === 'monk_third_eye') {
            unit.thirdEyeActive = true;
            unit.thirdEyeRoundsLeft = selfBuffDuration;
            unit.thirdEyeTotalRounds = selfBuffDuration;
            unit.thirdEyeTotalDurationMs = selfBuffDurationMs;
            unit.thirdEyeEndTimeMs = Date.now() + selfBuffDurationMs;
        }

        // Apply all-enemy debuffs
        if (effects.some(e => typeof e === 'string' && e.includes('nerf_all_enemies')) && ability.nerf) {
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (isEnemy) this._applyDebuff(c, ability.nerf.decrease_stats ? ability.nerf : { decrease_stats: { stats: [] } },
                    ability.name, getDurationRounds(ability.duration || 'long'));
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} uses ${ability.name}!`);
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // Heal-self-over-time (regen)
        if (effects.some(e => typeof e === 'string' && e.includes('heal_self'))) {
            const regenPct = ability.regeneration_percent || 3;
            const heal = Math.round((unit.starting_hp || unit.hp) * (regenPct / 100));
            unit.hp = Math.min(unit.starting_hp || unit.hp, unit.hp + heal);
            unit.damageIndicators = unit.damageIndicators || [];
            unit.damageIndicators.push({ id: Date.now() + Math.random(), value: `+${heal}`, source: ability.name, type: 'heal' });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} heals for ${heal} (${ability.name}).`);
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        if (abilityId === 'vortex') {
            const base = typeof ability.flatDamage === 'number' ? ability.flatDamage : 10;
            const splash = Math.max(1, Math.round(base));
            let totalHits = 0;
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (!isEnemy) return;
                const dist = Math.abs(target.coordinates.x - c.coordinates.x) + Math.abs(target.coordinates.y - c.coordinates.y);
                if (dist > 1) return;
                c.hp = Math.max(0, c.hp - splash);
                this.wakeSleepingTarget(c, ability.name || this.getCombatActionName(ability));
                c.damageIndicators = c.damageIndicators || [];
                c.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${splash}`, source: ability.name, type: 'damage' });
                totalHits++;
                if (c.hp <= 0) this.targetKilled(c);
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} tears a Vortex through nearby enemies (${totalHits} hit).`);
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // AoE damage — hits all enemies in range
        if (effects.some(e => typeof e === 'string' && e.includes('multi_target'))) {
            const isDamageType = ability.type === 'damage' || (ability.type && ability.type.includes('damage'));
            const hasFlatDamageProp = (typeof ability.flatDamage === 'number');
            const hasLegacyDamageProp = (typeof ability.damage === 'number');
            const hasAtkPctProp = (typeof ability.atkPercentage === 'number');

            let rawDamage = 0;
            if (hasFlatDamageProp) {
                rawDamage = ability.flatDamage;
                if (isDamageType) {
                    const pct = hasAtkPctProp ? ability.atkPercentage : 100;
                    rawDamage += (unit.stats.atk || 5) * (pct / 100);
                }
            } else if (hasLegacyDamageProp) {
                rawDamage = ability.damage;
            } else if (isDamageType) {
                const pct = hasAtkPctProp ? ability.atkPercentage : 100;
                rawDamage += (unit.stats.atk || 5) * (pct / 100);
            }
            let totalHits = 0;
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                if (!isEnemy) return;
                const dist = Math.abs(unit.coordinates.x - c.coordinates.x) + Math.abs(unit.coordinates.y - c.coordinates.y);
                if (dist > 2) return;
                const hit = this.hitCheck(unit, c);
                if (hit) {
                    let finalDmg = this.damageCheck(unit, c, rawDamage);
                    const isVampire = unit.type === 'vampire' || unit.key === 'vampire' || unit.id === 'vampire';
                    const hasCrimsonSight = unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'Crimson Sight');
                    if (isVampire && hasCrimsonSight && Math.random() < 0.5) {
                        finalDmg = finalDmg * 2;
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} crits for DOUBLE damage from Crimson Sight!`);
                    }
                    c.hp = Math.max(0, c.hp - finalDmg);
                    if (finalDmg > 0) this.wakeSleepingTarget(c, ability.name || this.getCombatActionName(ability));
                    c.damageIndicators = c.damageIndicators || [];
                    c.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${finalDmg}`, source: ability.name, type: 'damage' });
                    totalHits++;
                    if (c.hp <= 0) this.targetKilled(c);
                }
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} uses ${ability.name} — hits ${totalHits} enemies.`);
            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
            return;
        }

        // Single-target damage (default path)
        const isDamageType = ability.type === 'damage' || (ability.type && ability.type.includes('damage'));
        const hasFlatDamageProp = (typeof ability.flatDamage === 'number');
        const hasLegacyDamageProp = (typeof ability.damage === 'number');
        const hasAtkPctProp = (typeof ability.atkPercentage === 'number');

        let rawDamage = 0;
        if (hasFlatDamageProp) {
            rawDamage = ability.flatDamage;
            if (isDamageType) {
                const pct = hasAtkPctProp ? ability.atkPercentage : 100;
                rawDamage += (unit.stats.atk || 5) * (pct / 100);
            }
        } else if (hasLegacyDamageProp) {
            rawDamage = ability.damage;
        } else if (isDamageType) {
            const pct = hasAtkPctProp ? ability.atkPercentage : 100;
            rawDamage += (unit.stats.atk || 5) * (pct / 100);
        }

        // INT-based spell damage scaling for spellcaster classes
        const SPELLCASTER_TYPES = new Set(['wizard', 'sage', 'summoner']);
        const unitInt = (unit.stats && typeof unit.stats.int === 'number') ? unit.stats.int : 0;
        if (SPELLCASTER_TYPES.has(unit.type) && unitInt > 0) {
            rawDamage = Math.round(rawDamage * (1 + unitInt * 0.05));
        }
        const dmgMult = target.weaknessRevealed ? 1.25 : 1.0;
        const arrowType = (abilityId === 'loose' || abilityId === 'execute') ? (activeArrowType || 'force') : null;
        const hitCount = (abilityId === 'execute' || isMagicMissile) ? 3 : 1;
        let hitsSucceeded = 0;
        let anyHitConnected = false;

        const performHit = (h) => {
            if (target.hp <= 0 || target.dead) return;

            let hit;
            if (isMagicMissile && Array.isArray(preRolledHits)) {
                hit = preRolledHits[h];
            } else if (abilityId === 'acid_blast' && Array.isArray(preRolledHits)) {
                hit = preRolledHits[0];
            } else {
                hit = isSelfTarget ? true : this.hitCheck(unit, target);
            }
            if (hit) {
                anyHitConnected = true;
                let currentRawDmg = rawDamage;
                if (abilityId === 'execute') {
                    currentRawDmg = Math.round(rawDamage * 0.75);
                }

                let finalDmg = Math.round(this.damageCheck(unit, target, currentRawDmg) * dmgMult);
                if (arrowType === 'celestial' && target.subtype === 'undead') {
                    finalDmg = Math.round(finalDmg * 1.5);
                }
                const isVampire = unit.type === 'vampire' || unit.key === 'vampire' || unit.id === 'vampire';
                const hasCrimsonSight = unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'Crimson Sight');
                if (isVampire && hasCrimsonSight && Math.random() < 0.5) {
                    finalDmg = finalDmg * 2;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} crits for DOUBLE damage from Crimson Sight!`);
                }

                if (finalDmg > 0) {
                    // ── Circle of Deflection: ranged attacks may reflect back to the attacker ──
                    const hasCod = target.activeBuffs && target.activeBuffs.some(b => b.name === 'circle_of_deflection');
                    const isRangedAttack = ability.range && ability.range !== 'close';
                    if (hasCod && isRangedAttack && !isSelfTarget) {
                        const sameTeamSage = Object.values(this.combatants).find(c => {
                            if (!c || c.dead || c.isVCT) return false;
                            const sameTeam = (!!target.isMonster === !!c.isMonster);
                            if (!sameTeam || c.type !== 'sage') return false;
                            const dx = target.coordinates.x - c.coordinates.x;
                            const dy = target.coordinates.y - c.coordinates.y;
                            return Math.sqrt(dx * dx + dy * dy) < 1.9;
                        });
                        if (sameTeamSage && Math.random() < 0.5) {
                            // Reflect: damage hits the attacker instead
                            unit.hp = Math.max(0, unit.hp - finalDmg);
                            unit.damageIndicators = unit.damageIndicators || [];
                            unit.damageIndicators.push({
                                id: Date.now() + Math.random() + h,
                                value: `-${finalDmg}`,
                                source: 'Deflected!',
                                type: 'damage'
                            });
                            this.appendCombatLog(`${this.getCombatantLogName(unit)}'s ranged attack is DEFLECTED by the Circle of Deflection! ${finalDmg} damage reflects back!`);
                            hitsSucceeded++;
                            if (unit.hp <= 0) this.targetKilled(unit);
                            return; // skip normal damage application
                        }
                    }
                    target.hp = Math.max(0, target.hp - finalDmg);
                    this.wakeSleepingTarget(target, ability.name || this.getCombatActionName(ability));
                    target.damageIndicators = target.damageIndicators || [];
                    target.damageIndicators.push({
                        id: Date.now() + Math.random() + h,
                        value: `-${finalDmg}`,
                        source: ability.name,
                        type: 'damage'
                    });
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} uses ${this.getCombatActionName(ability)} on ${this.getCombatantLogName(target)} for ${finalDmg} damage${target.weaknessRevealed ? ' (weakness exposed!)' : ''}.`);

                    hitsSucceeded++;

                    if (abilityId === 'vampiric_bite') {
                        const healAmt = 10;
                        unit.hp = Math.min(unit.starting_hp || unit.hp, unit.hp + healAmt);
                        unit.damageIndicators = unit.damageIndicators || [];
                        unit.damageIndicators.push({ id: Date.now() + Math.random() + 50, value: `+${healAmt}`, source: 'Vampiric Bite', type: 'heal' });
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} heals for ${healAmt} from Vampiric Bite.`);
                    }

                    if (abilityId === 'shield_slam') {
                        const dx = target.coordinates.x - unit.coordinates.x;
                        const dy = target.coordinates.y - unit.coordinates.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            const pushX = Math.round(dx / dist);
                            const pushY = Math.round(dy / dist);
                            const newX = Math.max(0, Math.min(MAX_DEPTH, target.coordinates.x + pushX));
                            const newY = Math.max(0, Math.min(MAX_LANES - 1, target.coordinates.y + pushY));

                            if ((newX !== target.coordinates.x || newY !== target.coordinates.y)) {
                                if (this.shouldPushbackSucceed(target)) {
                                    if (!this.isTileOccupied(newX, newY, target.id)) {
                                        this.updateUnitCoordinates(target, newX, newY);
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} is pushed back 1 space by Shield Slam!`);
                                    } else {
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} could not be pushed back because the space was occupied!`);
                                    }
                                } else {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resisted the push back from Shield Slam!`);
                                }
                            }
                        }
                    }

                    if (abilityId === 'soul_suck') {
                        unit.soulSuckChanneling = {
                            targetId: target.id,
                            startHp: unit.hp,
                            maxHp: unit.starting_hp || unit.hp || 100,
                            elapsedMs: 0,
                            tickTimerMs: 0
                        };
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} starts channeling Soul Suck on ${this.getCombatantLogName(target)}!`);
                    }

                    // Consume mark on the first hit that connects
                    if (target.marked && hitsSucceeded === 1) {
                        target.marked = false;
                        target.markedRounds = 0;
                        const markBonus = 15;
                        target.hp = Math.max(0, target.hp - markBonus);
                        target.damageIndicators.push({
                            id: Date.now() + Math.random() + 99,
                            value: `+${markBonus}`,
                            source: 'Mark detonated',
                            type: 'crit'
                        });
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} detonates the mark on ${this.getCombatantLogName(target)} for +${markBonus} bonus damage.`);
                        if (target.hp <= 0) {
                            this.targetKilled(target);
                        }
                    }

                    if (abilityId === 'hex') {
                        const dur = getDurationRounds(ability.duration || 'medium');
                        const durMs = dur * (this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000));
                        target.hexed = true;
                        target.hexRounds = dur;
                        target.hexTotalRounds = dur;
                        target.hexTotalDurationMs = durMs;
                        target.hexEndTimeMs = Date.now() + durMs;
                        this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 2 }] } }, 'Hexed', dur);
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is HEXED!`);
                    }

                    if (abilityId === 'polymorph') {
                        if (target.type === 'dragon' && Math.random() < 0.5) {
                            this.appendCombatLog(`${this.getCombatantLogName(target)} resists Polymorph! (Dragon CC Immunity)`);
                        } else {
                            const dur = getDurationRounds(ability.duration || 'long');
                            target.polymorphed = true;
                            target.polymorphRounds = dur;
                            target.stunned = true;
                            target.stunnedRounds = dur;
                            this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'def', amount: 4 }] } }, 'Polymorphed', dur);
                            this.appendCombatLog(`${this.getCombatantLogName(target)} is turned into a helpless frog (Polymorphed)!`);
                        }
                    }

                    if (abilityId === 'fireball') {
                        const splashDamage = Math.max(1, Math.round(finalDmg * 0.5));
                        const targetMainId = target.parentMonsterId || target.parentId || target.id;
                        const hitIds = new Set([targetMainId]);
                        
                        Object.values(this.combatants).forEach(c => {
                            if (!c || c.dead || c.isVCT) return;
                            const cMainId = c.parentMonsterId || c.parentId || c.id;
                            if (hitIds.has(cMainId)) return;
                            
                            const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                            if (!isEnemy) return;
                            
                            const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0) ? target.occupiedCoords : [target.coordinates];
                            const cTiles = (Array.isArray(c.occupiedCoords) && c.occupiedCoords.length > 0) ? c.occupiedCoords : [c.coordinates];
                            const isAdjacent = targetTiles.some(t1 => cTiles.some(t2 => Math.abs(t1.x - t2.x) <= 1 && Math.abs(t1.y - t2.y) <= 1));
                            
                            if (isAdjacent) {
                                hitIds.add(cMainId);
                                const mainEntity = this.combatants[cMainId];
                                if (!mainEntity || mainEntity.dead) return;
                                
                                mainEntity.hp = Math.max(0, mainEntity.hp - splashDamage);
                                this.wakeSleepingTarget(mainEntity, `${ability.name || this.getCombatActionName(ability)} splash`);
                                mainEntity.damageIndicators = mainEntity.damageIndicators || [];
                                mainEntity.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${splashDamage}`, source: `${ability.name} splash`, type: 'damage' });
                                if (mainEntity.hp <= 0) this.targetKilled(mainEntity);
                            }
                        });
                        this.appendCombatLog(`${this.getCombatantLogName(unit)}'s fireball secondary ring scorches adjacent enemies.`);
                    }

                    if (target.hp <= 0) {
                        this.targetKilled(target);
                    }
                }
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} missed ${this.getCombatActionName(ability)} on ${this.getCombatantLogName(target)}.`);
            }

            // Apply arrow effects when they hit
            if (h === hitCount - 1) {
                if (anyHitConnected) {
                    if (arrowType === 'ice' && hitsSucceeded > 0 && !target.dead && target.hp > 0) {
                        effects.push({ type: 'frozen', duration: 'short' });
                    }
                    if (arrowType === 'poison' && hitsSucceeded > 0 && !target.dead && target.hp > 0) {
                        effects.push({ type: 'poison', duration: 'medium' });
                    }
                    if (arrowType === 'force' && hitsSucceeded > 0 && !target.dead && target.hp > 0) {
                        const dx = target.coordinates.x - unit.coordinates.x;
                        const dy = target.coordinates.y - unit.coordinates.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            const pushX = Math.round(dx / dist);
                            const pushY = Math.round(dy / dist);
                            const newX = Math.max(0, Math.min(MAX_DEPTH, target.coordinates.x + pushX));
                            const newY = Math.max(0, Math.min(MAX_LANES - 1, target.coordinates.y + pushY));

                            if ((newX !== target.coordinates.x || newY !== target.coordinates.y)) {
                                if (this.shouldPushbackSucceed(target, true)) {
                                    if (!this.isTileOccupied(newX, newY, target.id)) {
                                        this.updateUnitCoordinates(target, newX, newY);
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} is pushed back by the force arrow!`);
                                    } else {
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} could not be pushed back by the force arrow because the space was occupied!`);
                                    }
                                } else {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resisted the push back from the force arrow!`);
                                }
                            }
                        }
                    }

                    if (arrowType === 'celestial' && hitsSucceeded > 0 && Math.random() < 0.5) {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)}'s celestial arrow triggers a holy explosion!`);
                        const splashTargets = Object.values(this.combatants).filter(c => {
                            if (!c || c.dead || c.id === target.id) return false;
                            const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                            if (!isEnemy) return false;
                            const dx = Math.abs(c.coordinates.x - target.coordinates.x);
                            const dy = Math.abs(c.coordinates.y - target.coordinates.y);
                            return dx <= 1 && dy <= 1;
                        });
                        const splashDamage = Math.max(1, Math.round((rawDamage || 10) * 0.5));
                        splashTargets.forEach(c => {
                            c.hp = Math.max(0, c.hp - splashDamage);
                            this.wakeSleepingTarget(c, 'Celestial Explosion');
                            c.damageIndicators = c.damageIndicators || [];
                            c.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${splashDamage}`, source: 'Celestial Explosion', type: 'damage' });
                            if (c.hp <= 0) this.targetKilled(c);
                        });
                        if (typeof this.addAnimation === 'function') {
                            this.addAnimation({ type: 'celestial_arrow_hit', x: target.coordinates.x, y: target.coordinates.y, id: Date.now() });
                        }
                    }
                    // Process side effects (stun, frozen, ensnared, fear, poison, bleed, sleep)
                    const localEffects = [...effects];
                    if (unit.newMoonBuff && isMeleeAbility) {
                        const chance = unit.newMoonFearChance || 40;
                        if (Math.random() * 100 <= chance) {
                            localEffects.push({ type: 'fear', duration: 'short' });
                        }
                    }
                    const resolvedEffects = localEffects.filter(e => typeof e === 'object' && e && e.type);
                    // Fortitude-based resistance: target's fort stat grants % chance to resist certain ailments
                    const targetFort = (target.stats && typeof target.stats.fort === 'number') ? target.stats.fort : 0;
                    resolvedEffects.forEach(eff => {
                        const chance = typeof eff.chance === 'number' ? eff.chance : 100;
                        if (Math.random() * 100 <= chance) {
                            if (target.type === 'dragon' && ['frozen', 'stun', 'sleep', 'fear', 'ensnared', 'polymorph'].includes(eff.type)) {
                                if (Math.random() < 0.5) {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resists ${formatCombatText(eff.type)}! (Dragon CC Immunity)`);
                                    return;
                                }
                            }
                            // Fortitude resistance check for applicable effects
                            if (eff.type === 'poison' && targetFort > 0) {
                                const resistChance = targetFort * 3; // 3% per fort point
                                if (Math.random() * 100 < resistChance) {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resists the poison! (Fortitude)`);
                                    return;
                                }
                            }
                            if (eff.type === 'stun' && targetFort > 0) {
                                const resistChance = targetFort * 2; // 2% per fort point
                                if (Math.random() * 100 < resistChance) {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resists the stun! (Fortitude)`);
                                    return;
                                }
                            }
                            if (eff.type === 'sleep' && targetFort > 0) {
                                const resistChance = targetFort * 2; // 2% per fort point
                                if (Math.random() * 100 < resistChance) {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resists sleep! (Fortitude)`);
                                    return;
                                }
                            }
                            const dur = getDurationRounds(eff.duration || 'short');
                            const now = Date.now();
                            if (eff.type === 'frozen') {
                                target.frozen = true;
                                target.frozenRounds = (target.frozenRounds || 0) + dur;
                                target.frozenTotalRounds = (target.frozenTotalRounds || 0) + dur;
                                target.frozenStackDuration = dur;
                                const finalDurMs = getStatusDurationMs(target, target.frozenRounds);
                                target.frozenTotalDurationMs = finalDurMs;
                                target.frozenEndTimeMs = now + finalDurMs;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is frozen!`);
                            } else if (eff.type === 'ensnared') {
                                target.ensnared = true;
                                target.ensnaredRounds = dur;
                                target.ensnaredTotalRounds = dur;
                                target.ensnaredStackDuration = dur;
                                const finalDurMs = getStatusDurationMs(target, dur);
                                target.ensnaredTotalDurationMs = finalDurMs;
                                target.ensnaredEndTimeMs = now + finalDurMs;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is ensnared!`);
                            } else if (eff.type === 'fear') {
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                const finalDurMs = getStatusDurationMs(target, dur);
                                target.stunnedTotalDurationMs = finalDurMs;
                                target.stunnedEndTimeMs = now + finalDurMs;
                                target.feared = true;
                                target.fearRounds = dur;
                                target.fearTotalRounds = dur;
                                target.fearTotalDurationMs = finalDurMs;
                                target.fearEndTimeMs = now + finalDurMs;
                                target.asleep = false;
                                target.sleepTotalDurationMs = 0;
                                target.sleepEndTimeMs = 0;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is terrified and cannot act.`);
                            } else if (eff.type === 'stun') {
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                const finalDurMs = getStatusDurationMs(target, dur);
                                target.stunnedTotalDurationMs = finalDurMs;
                                target.stunnedEndTimeMs = now + finalDurMs;
                                target.feared = false;
                                target.fearTotalDurationMs = 0;
                                target.fearEndTimeMs = 0;
                                target.asleep = false;
                                target.sleepTotalDurationMs = 0;
                                target.sleepEndTimeMs = 0;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is stunned!`);
                            } else if (eff.type === 'poison') {
                                target.poison = true;
                                target.poisonRounds = dur;
                                this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 3 }] } }, 'poison', dur);
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is poisoned!`);
                            } else if (eff.type === 'bleed') {
                                if (target.subtype === 'undead') {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} does not bleed.`);
                                } else {
                                    target.bleed = true;
                                    if (!target.bleedRounds) target.bleedRounds = dur;
                                    this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 2 }] } }, 'bleed', dur);
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} is bleeding!`);
                                }
                            } else if (eff.type === 'sleep') {
                                const finalDurMs = getStatusDurationMs(target, dur);
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                target.stunnedTotalDurationMs = finalDurMs;
                                target.stunnedEndTimeMs = now + finalDurMs;
                                target.asleep = true;
                                target.sleepRounds = dur;
                                target.sleepTotalRounds = dur;
                                target.sleepTotalDurationMs = finalDurMs;
                                target.sleepEndTimeMs = now + finalDurMs;
                                target.feared = false;
                                target.fearTotalDurationMs = 0;
                                target.fearEndTimeMs = 0;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is put to sleep!`);
                            } else if (eff.type === 'shadow_curse') {
                                this._applyDebuff(target, null, 'shadow_curse', dur);
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is cursed by shadow!`);
                            }
                        }
                    });

                    if (target.hp <= 0) this.targetKilled(target);
                }
            }

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        };

        if (abilityId === 'rake') {
            performHit(0);
            if (Math.random() < 0.50) {
                setTimeout(() => {
                    if (target && !target.dead && target.hp > 0 && unit && !unit.dead && unit.hp > 0) {
                        const isTargetLarge = target.isLarge 
                            || target.size === 2 
                            || (target.isMonster === true && target.isMinion !== true)
                            || (target.type && ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy', 'djinn', 'vampire', 'summoned_djinn', 'summoned_mummy', 'summoned_ogre', 'summoned_vampire'].includes(target.type) && target.isMinion !== true);
                        const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0) ? target.occupiedCoords : [target.coordinates];
                        
                        if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                            this.animManagerRedux.triggerAbility(unit.coordinates, target.coordinates, 'rake', isTargetLarge, targetTiles, unit.id);
                        }
                        performHit(1);
                        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                    }
                }, 750);
            }
        } else if (abilityId === 'loose' || abilityId === 'deadeye_shot') {
            setTimeout(() => performHit(0), 700);
        } else if (abilityId === 'execute') {
            setTimeout(() => performHit(0), 700);
            setTimeout(() => performHit(1), 950);
            setTimeout(() => performHit(2), 1200);
        } else if (abilityId === 'ice_blast' || abilityId === 'acid_blast') {
            setTimeout(() => performHit(0), 600);
        } else if (isMagicMissile) {
            setTimeout(() => performHit(0), 400);
            setTimeout(() => performHit(1), 600);
            setTimeout(() => performHit(2), 800);
        } else {
            for (let h = 0; h < hitCount; h++) {
                performHit(h);
            }
        }
    };
    
    this._triggerEagleEyePassives = (summonedUnit) => {
        if (!summonedUnit || summonedUnit.dead || summonedUnit.hp <= 0) return;
        const oppositeSideIsMonster = !summonedUnit.isMonster;

        const rangers = Object.values(this.combatants).filter(c =>
            c &&
            !c.dead &&
            (!!c.isMonster === oppositeSideIsMonster) &&
            Array.isArray(c.passives) &&
            c.passives.includes('eagle_eye')
        );

        rangers.forEach(ranger => {
            this._fireEagleEyeArrows(ranger, summonedUnit);
        });
    };

    this._fireEagleEyeArrows = (ranger, target) => {
        const arrowTypes = ['force', 'ice', 'poison', 'celestial'];
        const firstArrow = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];
        const secondArrow = arrowTypes[Math.floor(Math.random() * arrowTypes.length)];

        // Fire first arrow immediately
        this._fireSingleEagleEyeArrow(ranger, target, firstArrow);

        // Fire second arrow after 300ms delay
        setTimeout(() => {
            if (!target || target.dead || target.hp <= 0) return;
            if (!ranger || ranger.dead || ranger.hp <= 0) return;
            this._fireSingleEagleEyeArrow(ranger, target, secondArrow);
        }, 300);
    };

    this._fireSingleEagleEyeArrow = (ranger, target, arrowType) => {
        if (!target || target.dead || target.hp <= 0) return;

        if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
            const sourceCoords = ranger.coordinates;
            const targetCoords = target.coordinates;
            const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0) ? target.occupiedCoords : [target.coordinates];
            const isTargetLarge = targetTiles.length > 1;
            this.animManagerRedux.triggerAbility(sourceCoords, targetCoords, 'loose', isTargetLarge, targetTiles, ranger.id, arrowType);
        }

        setTimeout(() => {
            if (!target || target.dead || target.hp <= 0) return;

            const hit = this.hitCheck(ranger, target);
            if (hit) {
                const rangerAtk = ranger.stats ? (ranger.stats.atk || 8) : 8;
                const baseDamage = Math.round(rangerAtk * 1.0);
                const dmgMult = target.weaknessRevealed ? 1.25 : 1.0;
                let finalDmg = Math.round(this.damageCheck(ranger, target, baseDamage) * dmgMult);

                if (arrowType === 'celestial' && target.subtype === 'undead') {
                    finalDmg = Math.round(finalDmg * 1.5);
                }

                if (finalDmg > 0) {
                    const hasCod = target.activeBuffs && target.activeBuffs.some(b => b.name === 'circle_of_deflection');
                    if (hasCod && Math.random() < 0.5) {
                        ranger.hp = Math.max(0, ranger.hp - finalDmg);
                        ranger.damageIndicators = ranger.damageIndicators || [];
                        ranger.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${finalDmg}`, source: 'Reflected Arrow', type: 'damage' });
                        this.appendCombatLog(`Eagle Eye arrow reflected! ${this.getCombatantLogName(ranger)} takes ${finalDmg} damage.`);
                        if (ranger.hp <= 0) this.targetKilled(ranger);
                    } else {
                        target.hp = Math.max(0, target.hp - finalDmg);
                        this.wakeSleepingTarget(target, 'Eagle Eye');
                        target.damageIndicators = target.damageIndicators || [];
                        target.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${finalDmg}`, source: 'Eagle Eye', type: 'damage' });
                        this.appendCombatLog(`${this.getCombatantLogName(ranger)}'s Eagle Eye passive fires a ${arrowType} arrow and hits ${this.getCombatantLogName(target)} for ${finalDmg} damage!`);
                        if (target.hp <= 0) this.targetKilled(target);
                    }
                }

                if (target.hp > 0 && !target.dead) {
                    const now = Date.now();
                    if (arrowType === 'ice') {
                        if (target.type === 'dragon' && Math.random() < 0.5) {
                            this.appendCombatLog(`${this.getCombatantLogName(target)} resists the ice arrow freeze! (Dragon CC Immunity)`);
                        } else {
                            const dur = getDurationRounds('short');
                            target.frozen = true;
                            target.frozenRounds = (target.frozenRounds || 0) + dur;
                            target.frozenTotalRounds = (target.frozenTotalRounds || 0) + dur;
                            target.frozenStackDuration = dur;
                            const finalDurMs = getStatusDurationMs(target, target.frozenRounds);
                            target.frozenTotalDurationMs = finalDurMs;
                            target.frozenEndTimeMs = now + finalDurMs;
                            this.appendCombatLog(`${this.getCombatantLogName(target)} is frozen by the Eagle Eye ice arrow!`);
                        }
                    } else if (arrowType === 'poison') {
                        const dur = getDurationRounds('medium');
                        target.poison = true;
                        target.poisonRounds = dur;
                        this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 3 }] } }, 'poison', dur);
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is poisoned by the Eagle Eye poison arrow!`);
                    } else if (arrowType === 'force') {
                        const dx = target.coordinates.x - ranger.coordinates.x;
                        const dy = target.coordinates.y - ranger.coordinates.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist > 0) {
                            const pushX = Math.round(dx / dist);
                            const pushY = Math.round(dy / dist);
                            const newX = Math.max(0, Math.min(MAX_DEPTH, target.coordinates.x + pushX));
                            const newY = Math.max(0, Math.min(MAX_LANES - 1, target.coordinates.y + pushY));
                            if ((newX !== target.coordinates.x || newY !== target.coordinates.y)) {
                                if (this.shouldPushbackSucceed(target, true)) {
                                    if (!this.isTileOccupied(newX, newY, target.id)) {
                                        this.updateUnitCoordinates(target, newX, newY);
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} is pushed back by the force arrow!`);
                                    } else {
                                        this.appendCombatLog(`${this.getCombatantLogName(target)} could not be pushed back by the force arrow because the space was occupied!`);
                                    }
                                } else {
                                    this.appendCombatLog(`${this.getCombatantLogName(target)} resisted the push back from the force arrow!`);
                                }
                            }
                        }
                    }
                    if (arrowType === 'celestial' && Math.random() < 0.5) {
                        this.appendCombatLog(`${this.getCombatantLogName(ranger)}'s celestial arrow triggers a holy explosion!`);
                        const splashTargets = Object.values(this.combatants).filter(c => {
                            if (!c || c.dead || c.id === target.id) return false;
                            const isEnemy = (!!ranger.isMonster !== !!c.isMonster);
                            if (!isEnemy) return false;
                            const dx = Math.abs(c.coordinates.x - target.coordinates.x);
                            const dy = Math.abs(c.coordinates.y - target.coordinates.y);
                            return dx <= 1 && dy <= 1;
                        });
                        const splashDamage = Math.max(1, Math.round((baseDamage || 10) * 0.5));
                        splashTargets.forEach(c => {
                            c.hp = Math.max(0, c.hp - splashDamage);
                            this.wakeSleepingTarget(c, 'Celestial Explosion');
                            c.damageIndicators = c.damageIndicators || [];
                            c.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${splashDamage}`, source: 'Celestial Explosion', type: 'damage' });
                            if (c.hp <= 0) this.targetKilled(c);
                        });
                        if (typeof this.addAnimation === 'function') {
                            this.addAnimation({ type: 'celestial_arrow_hit', x: target.coordinates.x, y: target.coordinates.y, id: Date.now() });
                        }
                    }
                }
            } else {
                this.appendCombatLog(`${this.getCombatantLogName(ranger)}'s Eagle Eye passive fires a ${arrowType} arrow but misses ${this.getCombatantLogName(target)}.`);
            }

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        }, 700);
    };

    // Basic attack wrapper (respects cooldowns defined in skills matrix)
    this._basicAttack = (unit, target) => {
        if (!target || unit.actionsTakenThisRound >= 1) return;
        if (target && target.isVCT && target.parentMonsterId && this.combatants[target.parentMonsterId]) {
            target = this.combatants[target.parentMonsterId];
        }
        const baseAttack = Array.isArray(unit.attacks) && unit.attacks.length > 0 ? unit.attacks[0] : null;
        if (!baseAttack) return;

        const attackKey = typeof baseAttack === 'string' ? baseAttack : baseAttack.id;
        if (attackKey && !this._abilityReady(unit, attackKey)) {
            return;
        }

        let attack;
        if (baseAttack && typeof baseAttack === 'object') {
            attack = {
                ...baseAttack,
                damage: unit.stats.atk || baseAttack.damage || 5,
                cooldown: baseAttack.cooldown !== undefined ? baseAttack.cooldown : 0
            };
        } else if (typeof baseAttack === 'string') {
            const resolved = this.resolveSpecial(unit, baseAttack);
            if (resolved) {
                attack = {
                    ...resolved,
                    id: resolved.id || baseAttack,
                    damage: unit.stats.atk || resolved.damage || 5,
                    cooldown: resolved.cooldown !== undefined ? resolved.cooldown : 0
                };
            } else {
                attack = {
                    id: baseAttack,
                    name: baseAttack,
                    range: 'close',
                    type: 'cutting',
                    damage: unit.stats.atk || 5,
                    cooldown: 0
                };
            }
        } else {
            attack = {
                id: 'attack',
                name: 'attack',
                range: 'close',
                type: 'cutting',
                damage: unit.stats.atk || 5,
                cooldown: 0
            };
        }
        this.useAbility(unit, attack, target);
    };

    // ── Movement ──────────────────────────────────────────────────────────────
    this.moveCloser = (unit, target) => {
        if (unit.ensnared) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is ensnared and cannot move!`);
            return;
        }
        if (unit.shieldWallActive) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} cannot move while Shield Wall is active!`);
            return;
        }
        if (unit.movesTakenThisRound >= 1 || !target) return;

        if (target && target.isVCT && target.parentMonsterId && this.combatants[target.parentMonsterId]) {
            target = this.combatants[target.parentMonsterId];
        }

        // Support multi-tile large targets: find the closest occupied coordinate of the target to the unit
        const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0)
            ? target.occupiedCoords
            : [target.coordinates];

        let closestTile = targetTiles[0];
        let minDist = Infinity;
        targetTiles.forEach(tile => {
            const dist = Math.abs(unit.coordinates.x - tile.x) + Math.abs(unit.coordinates.y - tile.y);
            if (dist < minDist) {
                minDist = dist;
                closestTile = tile;
            }
        });

        const dx = closestTile.x - unit.coordinates.x;
        const dy = closestTile.y - unit.coordinates.y;
        let newX = unit.coordinates.x;
        let newY = unit.coordinates.y;

        // Prefer whichever axis needs more correction; try the other if blocked
        const tryMove = (ax, ay) => {
            if (this.canFitAt(unit, ax, ay)) {
                return { x: ax, y: ay };
            }
            return null;
        };

        let moved = null;
        if (Math.abs(dx) >= Math.abs(dy)) {
            moved = tryMove(newX + Math.sign(dx), newY)
                 || tryMove(newX, newY + Math.sign(dy))
                 || tryMove(newX, newY - Math.sign(dy));
        } else {
            moved = tryMove(newX, newY + Math.sign(dy))
                 || tryMove(newX + Math.sign(dx), newY)
                 || moved || tryMove(newX - Math.sign(dx), newY);
        }

        if (moved) {
            this.updateUnitCoordinates(unit, moved.x, moved.y);
            unit.movesTakenThisRound += 1;
            this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'move');
            this.appendCombatLog(`${this.getCombatantLogName(unit)} moves toward ${this.getCombatantLogName(target)}.`);
        }
    };

    this.moveCloserToCoord = (unit, targetX, targetY) => {
        if (unit.ensnared) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is ensnared and cannot move!`);
            return;
        }
        if (unit.shieldWallActive) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} cannot move while Shield Wall is active!`);
            return;
        }
        if (unit.movesTakenThisRound >= 1) return;

        const dx = targetX - unit.coordinates.x;
        const dy = targetY - unit.coordinates.y;
        let newX = unit.coordinates.x;
        let newY = unit.coordinates.y;

        const tryMove = (ax, ay) => {
            if (this.canFitAt(unit, ax, ay)) {
                return { x: ax, y: ay };
            }
            return null;
        };

        let moved = null;
        if (Math.abs(dx) >= Math.abs(dy)) {
            moved = tryMove(newX + Math.sign(dx), newY)
                 || tryMove(newX, newY + Math.sign(dy))
                 || tryMove(newX, newY - Math.sign(dy));
        } else {
            moved = tryMove(newX, newY + Math.sign(dy))
                 || tryMove(newX + Math.sign(dx), newY)
                 || tryMove(newX - Math.sign(dx), newY);
        }

        if (moved) {
            this.updateUnitCoordinates(unit, moved.x, moved.y);
            unit.movesTakenThisRound += 1;
            this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'move');
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is terrified and runs away toward (${targetX}, ${targetY}).`);
        }
    };

    // Reposition: ranged units try to move away from close enemies
    this.repositionUnit = (unit, enemyTarget, mode = 'reposition') => {
        if (unit.ensnared) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is ensnared and cannot move!`);
            return;
        }
        if (unit.shieldWallActive) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} cannot move while Shield Wall is active!`);
            return;
        }
        if (unit.movesTakenThisRound >= 1 || !enemyTarget) return;
        if (mode === 'retreat') {
            // Move away from the enemy
            const dx = unit.coordinates.x - enemyTarget.coordinates.x;
            const dy = unit.coordinates.y - enemyTarget.coordinates.y;
            const newX = unit.coordinates.x + Math.sign(dx);
            const newY = unit.coordinates.y + Math.sign(dy || 0);

            if (this.canFitAt(unit, newX, newY)) {
                this.updateUnitCoordinates(unit, newX, newY);
                unit.movesTakenThisRound += 1;
                this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'retreat');
                this.appendCombatLog(`${this.getCombatantLogName(unit)} retreats from ${this.getCombatantLogName(enemyTarget)}.`);
            }
        }
    };

    this.updateTick = (deltaMs) => {
        // Tick down cooldown durations
        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead) return;
            if (c.cooldowns) {
                Object.keys(c.cooldowns).forEach(skillId => {
                    c.cooldowns[skillId] = Math.max(0, c.cooldowns[skillId] - (deltaMs / 1000));
                    if (c.cooldowns[skillId] === 0) {
                        delete c.cooldowns[skillId];
                    }
                });
            }
        });

        // Tick down active Soul Suck channeling channels
        Object.values(this.combatants).forEach(unit => {
            if (!unit || unit.dead || !unit.soulSuckChanneling) return;
            const target = this.combatants[unit.soulSuckChanneling.targetId];
            if (!target || target.dead) {
                delete unit.soulSuckChanneling;
                return;
            }

            // Check damage threshold: 10% of max HP taken since start
            const maxHp = unit.soulSuckChanneling.maxHp;
            const dmgTaken = unit.soulSuckChanneling.startHp - unit.hp;
            if (dmgTaken >= maxHp * 0.1) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s Soul Suck channel was broken by taking too much damage!`);
                delete unit.soulSuckChanneling;
                return;
            }

            const roundDurationMs = this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000);
            const quarterRoundMs = roundDurationMs / 4;

            unit.soulSuckChanneling.elapsedMs += deltaMs;
            unit.soulSuckChanneling.tickTimerMs += deltaMs;

            if (unit.soulSuckChanneling.tickTimerMs >= quarterRoundMs) {
                unit.soulSuckChanneling.tickTimerMs -= quarterRoundMs;

                // Perform the tick damage & heal (0.5x attack)
                const atk = unit.stats?.atk || unit.atk || 10;
                const finalDmg = Math.round(atk * 0.5);

                target.hp = Math.max(0, target.hp - finalDmg);
                target.stamina = Math.max(0, (target.stamina || 0) - finalDmg);
                unit.hp = Math.min(unit.starting_hp || unit.hp, unit.hp + finalDmg);
                unit.stamina = Math.min(unit.starting_stamina || unit.stamina || 100, (unit.stamina || 0) + finalDmg);

                // Add indicators
                target.damageIndicators = target.damageIndicators || [];
                target.damageIndicators.push({
                    id: Date.now() + Math.random(),
                    value: `-${finalDmg}`,
                    source: 'Soul Suck',
                    type: 'damage'
                });

                unit.damageIndicators = unit.damageIndicators || [];
                unit.damageIndicators.push({
                    id: Date.now() + Math.random(),
                    value: `+${finalDmg}`,
                    source: 'Soul Suck',
                    type: 'heal'
                });

                // Stun chance: 5%
                if (Math.random() < 0.05) {
                    if (target.type === 'dragon' && Math.random() < 0.5) {
                        this.appendCombatLog(`${this.getCombatantLogName(target)} resists the Soul Suck stun! (Dragon CC Immunity)`);
                    } else {
                        target.stunned = true;
                        target.stunnedRounds = Math.max(target.stunnedRounds || 0, 1);
                        const durMs = getDurationMsFromRounds(1);
                        target.stunnedEndTimeMs = target.stunnedEndTimeMs && target.stunnedEndTimeMs > Date.now() ? target.stunnedEndTimeMs + durMs : Date.now() + durMs;
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is STUNNED by Soul Suck!`);
                    }
                }

                this.appendCombatLog(`${this.getCombatantLogName(unit)} drains the soul of ${this.getCombatantLogName(target)} for ${finalDmg} damage & stamina, healing/replenishing self.`);

                if (target.hp <= 0) {
                    this.targetKilled(target);
                    delete unit.soulSuckChanneling;
                    return;
                }
            }

            if (unit.soulSuckChanneling.elapsedMs >= roundDurationMs * 2) {
                this.appendCombatLog(`${this.getCombatantLogName(unit)} finishes channeling Soul Suck.`);
                delete unit.soulSuckChanneling;
            }
        });
        
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    this.startRoundTimer = () => {
        if (this.roundTimerInterval) clearInterval(this.roundTimerInterval);
        
        let lastTickTime = Date.now();
        this.roundTimeElapsedMs = 0;
        this.roundTimerInterval = setInterval(() => {
            const now = Date.now();
            const deltaMs = now - lastTickTime;
            lastTickTime = now;

            if (this.combatPaused || this.combatOver || Object.keys(this.combatants).length === 0) return;
            
            const roundDurationMs = this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000);
            this.roundTimeElapsedMs += deltaMs;
            
            if (this.roundTimeElapsedMs >= roundDurationMs) {
                this.roundTimeElapsedMs = 0;
                this.incrementRound();
            }
            
            this.roundTimeRemainingRatio = Math.max(0, 1 - (this.roundTimeElapsedMs / roundDurationMs));
            this.updateTick(deltaMs);
            
        }, 50);
    };

    this.incrementRound = () => {
        this.round += 1;

        // Malevolent Presence (goat demon passive) check
        const goatDemons = Object.values(this.combatants).filter(c => c && !c.dead && !c.isVCT && (c.type === 'goat_demon' || c.key === 'goat_demon'));
        if (goatDemons.length > 0) {
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                goatDemons.forEach(gd => {
                    const isEnemy = (!!gd.isMonster !== !!c.isMonster);
                    if (isEnemy) {
                        const dx = Math.abs(c.coordinates.x - gd.coordinates.x);
                        const dy = Math.abs(c.coordinates.y - gd.coordinates.y);
                        if (dx <= 1 && dy <= 1) {
                            if (Math.random() < 0.20) {
                                const dur = 2; // short duration
                                const durMs = dur * this.roundDurationMs;
                                const now = Date.now();
                                
                                c.stunned = true;
                                c.stunnedRounds = dur;
                                c.stunnedTotalRounds = dur;
                                c.stunnedStackDuration = dur;
                                c.stunnedTotalDurationMs = durMs;
                                c.stunnedEndTimeMs = now + durMs;
                                c.feared = true;
                                c.fearRounds = dur;
                                c.fearTotalRounds = dur;
                                c.fearTotalDurationMs = durMs;
                                c.fearEndTimeMs = now + durMs;
                                
                                this._applyDebuff(c, null, 'malevolent_presence_fear', dur);
                                this.appendCombatLog(`${this.getCombatantLogName(c)} is terrified by the Goat Demon's Malevolent Presence!`);
                                
                                if (this.animManagerRedux && typeof this.animManagerRedux.triggerAbility === 'function') {
                                    this.animManagerRedux.triggerAbility(gd.coordinates, c.coordinates, 'malevolent_presence_fear', false, null, gd.id);
                                }
                            }
                        }
                    }
                });
            });
        }
        
        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT) return;
            c.movesTakenThisRound = 0;
            c.actionsTakenThisRound = 0;
            
            // Endurance recovery every 2 rounds
            if (this.round % 2 === 0) {
                if (c.enduranceFrozenRounds > 0) {
                    c.enduranceFrozenRounds--;
                }
            }
            // Recovery happens every 4 rounds (half as often)
            // Commented out to turn off stamina recovery for now
            /*
            if (this.round % 4 === 0) {
                if (c.enduranceFrozenRounds <= 0 && c.endurance < c.maxEndurance) {
                    const recovery = Math.floor(c.maxEndurance * 0.01);
                    c.endurance = Math.min(c.maxEndurance, c.endurance + Math.max(1, recovery));
                }
            }
            */

            // Tick down skeleton reassembly bones duration
            if (c.isBones) {
                c.bonesRoundsLeft--;
                if (c.bonesRoundsLeft <= 0) {
                    c.isBones = false;
                    c.bonesRoundsLeft = 0;
                    c.bonesTotalRounds = 0;
                    c.bonesTotalDurationMs = 0;
                    c.bonesEndTimeMs = 0;
                    c.portrait = c.originalPortrait || c.portrait;
                    c.name = c.originalName || c.name;
                    if (typeof c.originalStartingHp === 'number') {
                        c.starting_hp = c.originalStartingHp;
                    }
                    if (c.stats && typeof c.originalStatsHp === 'number') {
                        c.stats.hp = c.originalStatsHp;
                    }
                    c.hp = c.starting_hp || c.stats?.hp || 30;
                    delete c.bonesMaxHp;
                    delete c.originalStartingHp;
                    delete c.originalStatsHp;
                    this.appendCombatLog(`${this.getCombatantLogName(c)} has reassembled with full health!`);
                    if (this.animationManager && typeof this.animationManager.triggerVisualAbility === 'function') {
                        this.animationManager.triggerVisualAbility(c.id, c.id, { name: 'reassembly' });
                    }
                }
            }

            // Tick down dragon egg hatch timer
            if (c.type === 'dragon_egg' && typeof c.hatchTimer === 'number') {
                c.hatchTimer--;
                if (c.hatchTimer <= 0) {
                    this._hatchEgg(c);
                }
            }
        });

        // Process pending bombardments
        if (Array.isArray(this.pendingBombardments) && this.pendingBombardments.length > 0) {
            const resolved = [];
            this.pendingBombardments.forEach(pb => {
                pb.roundsRemaining--;
                if (pb.roundsRemaining <= 0) {
                    this._resolveBombardmentStrike(pb);
                } else {
                    resolved.push(pb);
                }
            });
            this.pendingBombardments = resolved;
        }
        
        this.appendCombatLog(`Round ${this.round} begins.`);
        
        // Execute AI turns
        this.processRoundTurns();

        // Process trials (Sphinx ability): phase schedule & off-board checks
        this._processTrialRound();
        
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };


    // Legacy callbacks & interfaces mapping
    this.attacksMatrix = attacksMatrix;
    this.specialsMatrix = specialsMatrix;
    this.fighterAI = {
        roster: {
            wizard: {
                monsterBattleRef: null,
                triggerMagicMissile: (wizard, target, travelTime) => {
                    if (wizard.monsterBattleRef && typeof wizard.monsterBattleRef.triggerMagicMissileAnimation === 'function') {
                        wizard.monsterBattleRef.triggerMagicMissileAnimation(wizard, target, travelTime);
                    }
                }
            },
            soldier: { monsterBattleRef: null },
            monk: { monsterBattleRef: null },
            barbarian: { monsterBattleRef: null },
            summoner: { monsterBattleRef: null },
            sage: { monsterBattleRef: null },
            ranger: { monsterBattleRef: null }
        }
    };

    // Callback registers
    this.establishMessageCallback = (cb) => { this.setMessage = cb; };
    this.establishUpdateMatrixCallback = (cb) => { this.updateIndicatorsMatrix = cb; };
    this.establishUpdateActorCallback = (cb) => { this.updateActor = cb; };
    this.establishUpdateDataCallback = (cb) => {
        this.updateData = (battleData) => {
            checkMummyState('updateData');
            if (cb) cb(battleData);
        };
    };
    this.establishBoardEventCallback = (cb) => { this.triggerBoardEvent = cb; };
    this.establishGameOverCallback = (cb) => { this.gameOver = cb; };
    this.establishGreetingCompleteCallback = (cb) => { this.greetingComplete = cb; };
    this.establishOnFighterMovedToDestinationCallback = (cb) => { this.fighterMovedToDestination = cb; };
    this.establishOnFighterDeathCallback = (cb) => { this.onFighterDeath = cb; };
    this.establishMorphPortraitCallback = (cb) => { this.morphPortrait = cb; };
    this.establishUseConsumableCallback = (cb) => { this.useConsumable = cb; };
    this.establishGetCurrentInventoryCallback = (cb) => { this.getCurrentInventory = cb; };
    this.establishStolenItemCallback = (cb) => { this.stolenItem = cb; };

    // Initialization & lifecycle
    this.initialize = () => {
        this.data = null;
        this.combatOver = false;
        activeShieldWalls.splice(0, activeShieldWalls.length);
    };
    this.shutdown = () => {
        if (this.roundTimerInterval) {
            clearInterval(this.roundTimerInterval);
            this.roundTimerInterval = null;
        }
        this.combatOver = true;
        this.setMessage = null;
        this.updateIndicatorsMatrix = null;
        this.updateActor = null;
        this.updateData = null;
        this.triggerBoardEvent = null;
        this.gameOver = null;
        this.greetingComplete = null;
        this.fighterMovedToDestination = null;
        this.onFighterDeath = null;
        this.morphPortrait = null;
    };
    this.disconnectOverlayManager = () => { this.overlayManager = null; };

    // Action and control stubs to avoid crash
    this.setManualControl = (fighterId, enabled) => {
        Object.values(this.combatants).forEach(f => {
            if (!f.isMonster && !f.isMinion) {
                f.manualControl = (enabled && f.id === fighterId);
            }
        });
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };
    this.manualRetarget = (fighter) => {};
    this.getRangeWidthVal = (details) => 0;
    this.queueAction = (fighterId, actionId, action) => {};
    this.fighterManualAttack = () => {
        if (!this.selectedFighter) return;
        const fighter = this.combatants[this.selectedFighter.id];
        if (!fighter || fighter.dead) return;

        const target = fighter.targetId ? this.combatants[fighter.targetId] : null;
        if (!target) return;

        this._basicAttack(fighter, target);
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };
    this.fighterSpecialAttack = (special) => {
        if (!this.selectedFighter) return;
        const fighter = this.combatants[this.selectedFighter.id];
        if (!fighter || fighter.dead) return;

        const resolved = this.resolveSpecial(fighter, special.id || special.name || special);
        if (!resolved) return;

        const target = fighter.targetId ? this.combatants[fighter.targetId] : null;
        
        // Some abilities (self utility) don't need a hostile target
        const isSelfTarget = resolved.range === 'self' || resolved.id === 'notch' || resolved.id === 'monk_meditate' || resolved.id === 'monk_ethereal_speed';
        
        const targetUnit = isSelfTarget ? fighter : target;
        if (!targetUnit) return;

        this.useAbility(fighter, resolved, targetUnit);

        // Custom Notch / Loose manual check
        if (resolved.id === 'notch') {
            fighter.arrowNotched = true;
        } else if (resolved.id === 'loose') {
            fighter.arrowNotched = false;
        }

        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };
    this.setTargetFromClick = (fighterId, targetId) => {
        const fighter = this.combatants[fighterId];
        if (!fighter) return;
        let finalTargetId = targetId;
        const targetObj = this.combatants[targetId];
        if (targetObj && targetObj.isVCT && targetObj.parentMonsterId && this.combatants[targetObj.parentMonsterId]) {
            finalTargetId = targetObj.parentMonsterId;
        }
        fighter.targetId = finalTargetId;
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };
    this.setFighterDestination = (fighterId, coords) => {};
    this.chooseAttackType = (fighter, target) => {};
    this.startManualCommandCooldown = (fighterId, durationMs = null) => {};

    this.getLiveFighters = () => {
        return Object.values(this.combatants).filter(e => !e.isMonster && !e.isMinion && !e.dead && !e.invisible);
    };

    this.itemUsed = (item, userInput) => {
        const user = this.combatants[userInput.id];
        if (!user) return;
        switch (item.effect) {
            case 'health gain':
                const healthGain = Math.ceil(user.starting_hp * 0.01 * item.amount);
                user.hp += healthGain;
                if (user.hp > user.starting_hp) user.hp = user.starting_hp;
                break;
            default:
                break;
        }
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };
}

