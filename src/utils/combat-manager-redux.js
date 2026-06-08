import { createFighter } from './factories';
import attacksMatrix from './attacks-matrix';
import specialsMatrix from './specials-matrix';
import { activeShieldWalls } from './shared-ai-methods/movement-methods';
import { INTERVALS } from './shared-constants';
import * as images from './images';
import { getMeta, storeMeta } from './session-handler';

const MAX_DEPTH = 7;
const MAX_LANES = 6;


const clone = (val) => {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
};

const DURATION_ROUNDS = {
    'instant': 0,
    'short': 2,
    'long': 4,
    '2x-long': 8,
    '3x-long': 12,
    '4x-long': 16
};

const formatCombatText = (value) => String(value || '')
    .replaceAll('_', ' ')
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

    const getDurationRounds = (dur) => {
        if (typeof dur === 'number') return dur;
        if (typeof dur === 'string') {
            return DURATION_ROUNDS[dur] !== undefined ? DURATION_ROUNDS[dur] : 4;
        }
        return 4;
    };

    const getRoundDurationMs = () => this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000);
    const getDurationMsFromRounds = (rounds) => Math.max(0, (rounds || 0) * getRoundDurationMs());

    this.ACTION_ENDURANCE_COST = 2;
    this.MOVE_ENDURANCE_COST = 2;

    this.applyEnduranceCost = (unit, cost = this.ACTION_ENDURANCE_COST, source = 'action') => {
        if (!unit) return;
        if ((unit.endurance || 0) <= 0 && unit.exhausted) return;
        unit.endurance = Math.max(0, (unit.endurance || 0) - cost);
        if (unit.endurance > 0) return;

        const longDuration = getDurationRounds('long');
        const longDurationMs = getDurationMsFromRounds(longDuration);
        const now = Date.now();
        unit.exhausted = true;
        unit.asleep = true;
        unit.sleepRounds = Math.max(unit.sleepRounds || 0, longDuration);
        unit.sleepTotalRounds = Math.max(unit.sleepTotalRounds || 0, longDuration);
        unit.sleepTotalDurationMs = Math.max(unit.sleepTotalDurationMs || 0, longDurationMs);
        unit.sleepEndTimeMs = unit.sleepEndTimeMs && unit.sleepEndTimeMs > now ? unit.sleepEndTimeMs + longDurationMs : now + longDurationMs;
        unit.stunned = true;
        unit.stunnedRounds = Math.max(unit.stunnedRounds || 0, longDuration);
        unit.stunnedTotalRounds = Math.max(unit.stunnedTotalRounds || 0, longDuration);
        unit.stunnedStackDuration = longDuration;
        unit.stunnedTotalDurationMs = Math.max(unit.stunnedTotalDurationMs || 0, longDurationMs);
        unit.stunnedEndTimeMs = unit.stunnedEndTimeMs && unit.stunnedEndTimeMs > now ? unit.stunnedEndTimeMs + longDurationMs : now + longDurationMs;
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
        if (caller && caller.pendingAttack) {
            return RANGES[caller.pendingAttack.range] || 0;
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

        // Set up main monster
        this.data.monster.coordinates = { x: MAX_DEPTH, y: 2 };
        this.data.monster.isMonster = true;
        const monster = createFighter(this.data.monster, callbacks, this.FIGHT_INTERVAL);
        monster.isMonster = true;
        monster.maxEndurance = this.data.monster.stats.vitality || Math.round(20 + (this.data.monster.stats.def || 5) * 2);
        monster.endurance = monster.maxEndurance;
        monster.enduranceFrozenRounds = 0;
        monster.cooldowns = {};
        monster.movesTakenThisRound = 0;
        monster.actionsTakenThisRound = 0;

        this.combatants[monster.id] = monster;
        this._initializeInitialCooldowns(monster);
        this._setCombatantOccupiedCoords(monster, this.combatants);

        // Set up minions
        if (this.data.minions) {
            const monsterLane = this.data.monster.coordinates.y;
            const monsterVirtualLane = monsterLane - 1;
            const availableLanes = [];
            for (let i = MAX_LANES - 1; i >= 0; i--) {
                if (i !== monsterLane && i !== monsterVirtualLane) availableLanes.push(i);
            }

            this.data.minions.forEach((e, i) => {
                e.isMinion = true;
                e.isMonster = true; // Starting boss minions are hostile monsters
                const laneIndex = i % availableLanes.length;
                const columnOffset = Math.floor(i / availableLanes.length);
                e.coordinates = { x: MAX_DEPTH - columnOffset, y: availableLanes[laneIndex] };

                const minion = createFighter(e, callbacks, this.FIGHT_INTERVAL);
                minion.isMinion = true;
                minion.isMonster = true; // Starting boss minions are hostile monsters
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
            if (!c || c.dead || c.id === excludeUnitId) return false;
            if (c.coordinates && c.coordinates.x === x && c.coordinates.y === y) return true;
            if (Array.isArray(c.occupiedCoords) && c.occupiedCoords.some(coord => coord.x === x && coord.y === y)) return true;
            return false;
        });
    };

    this.canFitAt = (unit, x, y) => {
        if (!unit) return false;
        if (x < 0 || x > MAX_DEPTH || y < 0 || y >= MAX_LANES) return false;
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
                if (this.isTileOccupied(coord.x, coord.y, unit.id)) return false;
            }
        }
        return true;
    };

    this.updateUnitCoordinates = (unit, nx, ny) => {
        unit.coordinates.x = nx;
        unit.coordinates.y = ny;
        this._setCombatantOccupiedCoords(unit, this.combatants);
        this.syncVCTs();
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

    this.damageCheck = (caller, target, rawDamage) => {
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
            if (!c || c.dead || c.isVCT) return false;
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
        if (this.tryTriggerReassemble(target)) {
            return;
        }
        if (!target || target.dead) {
            return;
        }
        target.dead = true;
        target.locked = true;
        target.deathRemovalScheduled = true;
        this.appendCombatLog(`${this.getCombatantLogName(target)} has been defeated.`);

        // Decrement Resolve by 10 on crew member death
        if (target && !target.isMonster) {
            const meta = getMeta();
            const currentResolve = (meta && typeof meta.resolve === 'number') ? meta.resolve : 100;
            meta.resolve = Math.max(0, currentResolve - 10);
            storeMeta(meta);
            this.appendCombatLog(`Resolve decreased by 10. Current Resolve: ${meta.resolve}`);
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
            if (this.gameOver) this.gameOver(false);
            return true;
        }
        if (!monstersAlive) {
            this.combatOver = true;
            this.appendCombatLog('Victory! All enemies defeated.');
            if (this.gameOver) this.gameOver(true);
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
        const targetTileId = this.animationManager.getTileIdByCoords(target.coordinates);
        const facing = target.coordinates.x >= unit.coordinates.x ? 'right' : 'left';

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
        const activeUnits = Object.values(this.combatants).filter(c => c && !c.dead && !c.isVCT);
        this.appendCombatLog(`DEBUG: processRoundTurns. activeUnits count: ${activeUnits.length}`);
        if (activeUnits.length > 0) {
            this.appendCombatLog(`DEBUG: activeUnits: ${activeUnits.map(u => `${u.name} (${u.type})`).join(', ')}`);
        }

        // Sort by speed/dexterity descending (higher dex acts first)
        activeUnits.sort((a, b) => {
            const speedA = a.stats.speed || a.stats.dex || 1;
            const speedB = b.stats.speed || b.stats.dex || 1;
            return speedB - speedA;
        });

        activeUnits.forEach((unit, index) => {
            setTimeout(() => {
                try {
                    if (this.combatPaused || this.combatOver || unit.dead) {
                        this.appendCombatLog(`DEBUG: Skip turn for ${unit.name} - paused: ${this.combatPaused}, over: ${this.combatOver}, dead: ${unit.dead}`);
                        return;
                    }

                    // Tick down active buff/debuff durations
                    this._tickUnitBuffs(unit);
                    this._tickUnitDebuffs(unit);

                    // Incapacitation check
                    if (unit.frozen || unit.stunned || unit.petrified || unit.isBones) {
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
                        if (resolve < 20 && Math.random() < 0.10) {
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
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s ${buff.name} has worn off.`);
                return false;
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
            const bleedDmg = isAffectedByCrimsonSight ? 10 : 5;
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
        const durationMs = durationRounds * (this.roundDurationMs || (this.gameSpeed === 'fast' ? 1000 : 2000));
        const now = Date.now();
        const existing = unit.activeBuffs.find(b => b.name === name);
        if (existing) {
            existing.roundsLeft += durationRounds;
            existing.totalRounds = (existing.totalRounds || existing.roundsLeft) + durationRounds;
            existing.singleDurationRounds = durationRounds;
            existing.totalDurationMs = (existing.totalDurationMs || 0) + durationMs;
            existing.endTimeMs = existing.endTimeMs && existing.endTimeMs > now ? existing.endTimeMs + durationMs : now + durationMs;
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
            buffDef.increase_stats.stats.forEach(({ stat, amount }) => {
                unit.stats[stat] = (unit.stats[stat] || 0) + amount;
                applied.statChanges[stat] = (applied.statChanges[stat] || 0) + amount;
            });
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
        const existing = unit.activeDebuffs.find(d => d.name === name);
        if (existing) {
            existing.roundsLeft += durationRounds;
            existing.totalRounds = (existing.totalRounds || existing.roundsLeft) + durationRounds;
            existing.singleDurationRounds = durationRounds;
            return;
        }

        const applied = { name, roundsLeft: durationRounds, totalRounds: durationRounds, singleDurationRounds: durationRounds, statChanges: {} };
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
        const unitType = unit.type || unit.image || '';

        switch (unitType) {
            case 'monk':     return this._aiMonk(unit);
            case 'soldier':  return this._aiSoldier(unit);
            case 'barbarian':return this._aiBarbarian(unit);
            case 'wizard':   return this._aiWizard(unit);
            case 'sage':     return this._aiSage(unit);
            case 'ranger':   return this._aiRanger(unit);
            case 'summoner': return this._aiSummoner(unit);
            case 'vampire':  return this._aiVampire(unit);
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
            if (resolved && typeof resolved.tier === 'number' && resolved.tier >= 1 && key !== 'slash') {
                combatant.cooldowns[key] = resolved.tier * roundDurSec;
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
        if (!Array.isArray(unit.specials) || unit.specials.length === 0) return null;

        const selfHpPct = unit.starting_hp > 0 ? unit.hp / unit.starting_hp : 1;
        const enemyCount = this.countEnemies(unit);
        const woundedAlly = this.findWoundedAlly(unit);

        let best = null;
        let bestScore = -Infinity;

        unit.specials.forEach(s => {
            const key = this._resolveAbilityKey(s);
            if (!key || !this._abilityReady(unit, key)) return;
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
                const durMs = getDurationMsFromRounds(4);
                unit.etherealSpeedActive = true;
                unit.etherealSpeedRoundsLeft = 4;
                unit.etherealSpeedTotalRounds = 4;
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
                const durMs = getDurationMsFromRounds(6);
                this._applyBuff(unit, pick.buff || {}, 'astral_being', 6);
                unit.astralBeingActive = true;
                unit.astralBeingRoundsLeft = 6;
                unit.astralBeingTotalRounds = 6;
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
                const durMs = getDurationMsFromRounds(4);
                unit.thirdEyeActive = true;
                unit.thirdEyeRoundsLeft = 4;
                unit.thirdEyeTotalRounds = 4;
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

        // Priority 2: Force back to push enemies away
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
                    this.updateUnitCoordinates(c, nx, c.coordinates.y);
                    this.appendCombatLog(`${this.getCombatantLogName(c)} is pushed back!`);
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
        if (!isAdjacent && leapReady && this.targetInRange(unit, target, 'medium')) {
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
                this._setCooldown(unit, 'heal', pick.cooldown || 4);
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
                // Determine best repositioning space to reach maximum allies
                const candidates = [
                    { x: unit.coordinates.x, y: unit.coordinates.y },
                    { x: unit.coordinates.x + 1, y: unit.coordinates.y },
                    { x: unit.coordinates.x - 1, y: unit.coordinates.y },
                    { x: unit.coordinates.x, y: unit.coordinates.y + 1 },
                    { x: unit.coordinates.x, y: unit.coordinates.y - 1 }
                ];

                const getScore = (nx, ny) => {
                    let score = 0;
                    Object.values(this.combatants).forEach(c => {
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

                let bestTile = { x: unit.coordinates.x, y: unit.coordinates.y };
                let maxScore = getScore(bestTile.x, bestTile.y);

                if (!unit.ensnared && !unit.shieldWallActive && unit.movesTakenThisRound < 1) {
                    candidates.forEach(cand => {
                        if (cand.x < 0 || cand.x > MAX_DEPTH || cand.y < 0 || cand.y >= MAX_LANES) return;
                        if (cand.x !== unit.coordinates.x || cand.y !== unit.coordinates.y) {
                            if (!this.canFitAt(unit, cand.x, cand.y)) return;
                        }
                        const score = getScore(cand.x, cand.y);
                        if (score > maxScore) {
                            maxScore = score;
                            bestTile = cand;
                        }
                    });
                }

                // Perform repositioning if a better tile was chosen
                if (bestTile.x !== unit.coordinates.x || bestTile.y !== unit.coordinates.y) {
                    this.updateUnitCoordinates(unit, bestTile.x, bestTile.y);
                    unit.movesTakenThisRound += 1;
                    this.applyEnduranceCost(unit, this.MOVE_ENDURANCE_COST, 'move');
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} repositions to optimize Circle of Protection.`);
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

        // Priority 3: Perceive (doubles weakness of all enemies for 2x-long duration: 8 rounds)
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

        // Fallback: stay at range and basic attack
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (target) {
            this._basicAttack(unit, target);
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
                target.ensnared = true;
                target.ensnaredRounds = getDurationRounds(pick.duration || 'short');
                target.ensnaredTotalRounds = target.ensnaredRounds;
                target.ensnaredStackDuration = target.ensnaredRounds;
                const durMs = getDurationMsFromRounds(target.ensnaredRounds);
                target.ensnaredTotalDurationMs = durMs;
                target.ensnaredEndTimeMs = Date.now() + durMs;
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
            dead: false,
            coordinates: { ...freeTile },
            hp: hpBase,
            starting_hp: hpBase,
            stats: { str: 3, dex: 3, atk: 4, def: 2, speed: 3 },
            attacks: ['claw_strike'],
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

    // GENERIC: Used for monsters and unrecognized unit types
    this._aiGeneric = (unit) => {
        this.acquireTarget(unit, true);
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const scored = this._scoredAbilityPick(unit, target);
        const rangeType = scored ? (scored.resolved.range || 'close') : 'close';
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
                    ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', damage: 15 })
                    : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', damage: 10 });

                if (crimsonSightSpec && batFlySpec && strikeSpec) {
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} initiates a clever combo chain!`);
                    
                    // Crimson Sight (Reset action count to execute in one turn)
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, crimsonSightSpec, unit);

                    // Bat Fly
                    unit.batFlyCustomDest = bestDest;
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, batFlySpec, targetSquishy);
                    unit.targetId = targetSquishy.id;

                    // Bite / Claw
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, strikeSpec, targetSquishy);

                    if (meleeAlive) {
                        unit.vampireState = 'retreat';
                    }
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
                    ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', damage: 15 })
                    : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', damage: 10 });

                if (batFlySpec && strikeSpec) {
                    // Bat Fly
                    unit.batFlyCustomDest = bestDest;
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, batFlySpec, targetSquishy);
                    unit.targetId = targetSquishy.id;

                    // Bite / Claw
                    unit.actionsTakenThisRound = 0;
                    this.useAbility(unit, strikeSpec, targetSquishy);

                    if (meleeAlive) {
                        unit.vampireState = 'retreat';
                    }
                    return;
                }
            }
        }

        // 3. CLOSE RANGE COMBAT & RETREAT
        const inRange = this.targetInRange(unit, target, 'close');
        if (inRange) {
            const strikeSpec = biteReady
                ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', damage: 15 })
                : (clawReady ? (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', damage: 10 }) : null);

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
                ? (this.resolveSpecial(unit, 'vampiric_bite') || { id: 'vampiric_bite', range: 'close', type: 'damage', damage: 15 })
                : (this.resolveSpecial(unit, 'claw_strike') || { id: 'claw_strike', range: 'close', type: 'damage', damage: 10 });
            this.useAbility(unit, strikeSpec, target);
        }
    };

    // ── Cooldown Helper ───────────────────────────────────────────────────────
    this._setCooldown = (unit, key, rounds) => {
        const normalized = key.replace(/\s+/g, '_').toLowerCase();
        unit.cooldowns[normalized] = rounds;
    };

    // ── Ability Use ───────────────────────────────────────────────────────────
    this.useAbility = (unit, ability, target) => {
        if (!ability || !target) return;

        if (target && target.isVCT && target.parentMonsterId && this.combatants[target.parentMonsterId]) {
            target = this.combatants[target.parentMonsterId];
        }

        const origCallerCoords = { x: unit.coordinates.x, y: unit.coordinates.y };
        const origCallerOccupied = Array.isArray(unit.occupiedCoords) ? clone(unit.occupiedCoords) : null;

        // Morale Shaken check: 5% chance to refuse to use a special ability and use basic attack instead
        const abilityId = ability.id || ability.key || (ability.name && ability.name.replace(/\s+/g, '_').toLowerCase()) || 'ability';
        if (abilityId === 'notch') {
            unit.arrowNotched = true;
            unit.notchedArrowType = ['force', 'ice', 'poison', 'celestial'][Math.floor(Math.random() * 4)];
        }
        const isBasicAttack = unit.attacks && unit.attacks.includes(abilityId);
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
        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
        setTimeout(() => {
            unit.attacking = false;
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

        if (abilityId === 'induce_fear') {
            if (typeof this.triggerBoardEvent === 'function') {
                this.triggerBoardEvent('induce_fear', { duration: 1800 });
            }
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
            let targetCoord = bestTargetCoord;
            if (abilityId === 'barbarian_leap_attack') {
                targetCoord = { x: unit.coordinates.x, y: unit.coordinates.y };
            }
            this.animManagerRedux.triggerAbility(bestCallerCoord, targetCoord, abilityId, isTargetLarge, targetTiles, unit.id, unit.notchedArrowType);
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
            this._applyBuff(unit, { increase_stats: { stats: [] } }, 'Inspire', selfBuffDuration);
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
            const base = typeof ability.damage === 'number' ? ability.damage : 10;
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
            const rawDamage = ability.damage || unit.stats.atk || 5;
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
        const hasDamageProp = (typeof ability.damage === 'number');
        let rawDamage = hasDamageProp ? ability.damage : ((ability.type === 'damage' || (ability.type && ability.type.includes('damage'))) ? (unit.stats.atk || 5) : 0);

        // INT-based spell damage scaling for spellcaster classes
        const SPELLCASTER_TYPES = new Set(['wizard', 'sage', 'summoner']);
        const unitInt = (unit.stats && typeof unit.stats.int === 'number') ? unit.stats.int : 0;
        if (SPELLCASTER_TYPES.has(unit.type) && unitInt > 0) {
            rawDamage = Math.round(rawDamage * (1 + unitInt * 0.05));
        }
        const dmgMult = target.weaknessRevealed ? 1.25 : 1.0;
        const isSelfTarget = target.id === unit.id || ability.range === 'self';
        const arrowType = (abilityId === 'loose' || abilityId === 'execute') ? (unit.notchedArrowType || 'force') : null;
        const hitCount = (abilityId === 'execute') ? 3 : 1;
        let hitsSucceeded = 0;
        let anyHitConnected = false;

        const performHit = (h) => {
            if (target.hp <= 0 || target.dead) return;

            const hit = isSelfTarget ? true : this.hitCheck(unit, target);
            if (hit) {
                anyHitConnected = true;
                let currentRawDmg = rawDamage;
                if (abilityId === 'execute') {
                    currentRawDmg = Math.round(rawDamage * 0.75);
                }

                let finalDmg = Math.round(this.damageCheck(unit, target, currentRawDmg) * dmgMult);
                if (arrowType === 'celestial') {
                    finalDmg = Math.round(finalDmg * 1.75);
                }
                const isVampire = unit.type === 'vampire' || unit.key === 'vampire' || unit.id === 'vampire';
                const hasCrimsonSight = unit.activeBuffs && unit.activeBuffs.some(b => b.name === 'Crimson Sight');
                if (isVampire && hasCrimsonSight && Math.random() < 0.5) {
                    finalDmg = finalDmg * 2;
                    this.appendCombatLog(`${this.getCombatantLogName(unit)} crits for DOUBLE damage from Crimson Sight!`);
                }

                if (finalDmg > 0) {
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
                    }

                    if (abilityId === 'fire_blast' || abilityId === 'fireball') {
                        const splashDamage = Math.max(1, Math.round(finalDmg * 0.5));
                        Object.values(this.combatants).forEach(c => {
                            if (!c || c.dead || c.isVCT || c.id === target.id) return;
                            const isEnemy = (!!unit.isMonster !== !!c.isMonster);
                            if (!isEnemy) return;
                            const adx = Math.abs(target.coordinates.x - c.coordinates.x);
                            const ady = Math.abs(target.coordinates.y - c.coordinates.y);
                            if (adx > 1 || ady > 1) return;
                            c.hp = Math.max(0, c.hp - splashDamage);
                            this.wakeSleepingTarget(c, `${ability.name || this.getCombatActionName(ability)} splash`);
                            c.damageIndicators = c.damageIndicators || [];
                            c.damageIndicators.push({ id: Date.now() + Math.random(), value: `-${splashDamage}`, source: `${ability.name} splash`, type: 'damage' });
                            if (c.hp <= 0) this.targetKilled(c);
                        });
                        this.appendCombatLog(`${this.getCombatantLogName(unit)}'s fire blast secondary ring scorches adjacent enemies.`);
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

                            if ((newX !== target.coordinates.x || newY !== target.coordinates.y) && !this.isTileOccupied(newX, newY, target.id)) {
                                this.updateUnitCoordinates(target, newX, newY);
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is pushed back by the force arrow!`);
                            }
                        }
                    }

                    // Process side effects (stun, frozen, ensnared, fear, poison, bleed, sleep)
                    const resolvedEffects = effects.filter(e => typeof e === 'object' && e && e.type);
                    // Fortitude-based resistance: target's fort stat grants % chance to resist certain ailments
                    const targetFort = (target.stats && typeof target.stats.fort === 'number') ? target.stats.fort : 0;
                    resolvedEffects.forEach(eff => {
                        const chance = typeof eff.chance === 'number' ? eff.chance : 100;
                        if (Math.random() * 100 <= chance) {
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
                            const durMs = getDurationMsFromRounds(dur);
                            const now = Date.now();
                            if (eff.type === 'frozen') {
                                target.frozen = true;
                                target.frozenRounds = (target.frozenRounds || 0) + dur;
                                target.frozenTotalRounds = (target.frozenTotalRounds || 0) + dur;
                                target.frozenStackDuration = dur;
                                target.frozenTotalDurationMs = (target.frozenTotalDurationMs || 0) + durMs;
                                target.frozenEndTimeMs = target.frozenEndTimeMs && target.frozenEndTimeMs > now ? target.frozenEndTimeMs + durMs : now + durMs;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is frozen!`);
                            } else if (eff.type === 'ensnared') {
                                target.ensnared = true;
                                target.ensnaredRounds = dur;
                                target.ensnaredTotalRounds = dur;
                                target.ensnaredStackDuration = dur;
                                target.ensnaredTotalDurationMs = durMs;
                                target.ensnaredEndTimeMs = now + durMs;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is ensnared!`);
                            } else if (eff.type === 'fear') {
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                target.stunnedTotalDurationMs = durMs;
                                target.stunnedEndTimeMs = now + durMs;
                                target.feared = true;
                                target.fearRounds = dur;
                                target.fearTotalRounds = dur;
                                target.fearTotalDurationMs = durMs;
                                target.fearEndTimeMs = now + durMs;
                                target.asleep = false;
                                target.sleepTotalDurationMs = 0;
                                target.sleepEndTimeMs = 0;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is terrified and cannot act.`);
                            } else if (eff.type === 'stun') {
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                target.stunnedTotalDurationMs = durMs;
                                target.stunnedEndTimeMs = now + durMs;
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
                                target.bleed = true;
                                target.bleedRounds = dur;
                                this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 2 }] } }, 'bleed', dur);
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is bleeding!`);
                            } else if (eff.type === 'sleep') {
                                target.stunned = true;
                                target.stunnedRounds = dur;
                                target.stunnedTotalRounds = dur;
                                target.stunnedStackDuration = dur;
                                target.stunnedTotalDurationMs = durMs;
                                target.stunnedEndTimeMs = now + durMs;
                                target.asleep = true;
                                target.sleepRounds = dur;
                                target.sleepTotalRounds = dur;
                                target.sleepTotalDurationMs = durMs;
                                target.sleepEndTimeMs = now + durMs;
                                target.feared = false;
                                target.fearTotalDurationMs = 0;
                                target.fearEndTimeMs = 0;
                                this.appendCombatLog(`${this.getCombatantLogName(target)} is put to sleep!`);
                            }
                        }
                    });

                    if (target.hp <= 0) this.targetKilled(target);
                }
            }

            if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        };

        if (abilityId === 'loose' || abilityId === 'deadeye_shot') {
            setTimeout(() => performHit(0), 700);
        } else if (abilityId === 'execute') {
            setTimeout(() => performHit(0), 700);
            setTimeout(() => performHit(1), 950);
            setTimeout(() => performHit(2), 1200);
        } else {
            for (let h = 0; h < hitCount; h++) {
                performHit(h);
            }
        }
    };

    // Basic attack wrapper (no cooldown for basic attacks)
    this._basicAttack = (unit, target) => {
        if (!target || unit.actionsTakenThisRound >= 1) return;
        if (target && target.isVCT && target.parentMonsterId && this.combatants[target.parentMonsterId]) {
            target = this.combatants[target.parentMonsterId];
        }
        const baseAttack = Array.isArray(unit.attacks) && unit.attacks.length > 0 ? unit.attacks[0] : null;
        let attack;
        if (baseAttack && typeof baseAttack === 'object') {
            attack = {
                ...baseAttack,
                damage: unit.stats.atk || baseAttack.damage || 5,
                cooldown: 0
            };
        } else if (typeof baseAttack === 'string') {
            const resolved = this.resolveSpecial(unit, baseAttack);
            if (resolved) {
                attack = {
                    ...resolved,
                    id: resolved.id || baseAttack,
                    damage: unit.stats.atk || resolved.damage || 5,
                    cooldown: 0
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
                    target.stunned = true;
                    target.stunnedRounds = Math.max(target.stunnedRounds || 0, 1);
                    const durMs = getDurationMsFromRounds(1);
                    target.stunnedEndTimeMs = target.stunnedEndTimeMs && target.stunnedEndTimeMs > Date.now() ? target.stunnedEndTimeMs + durMs : Date.now() + durMs;
                    this.appendCombatLog(`${this.getCombatantLogName(target)} is STUNNED by Soul Suck!`);
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
        });
        
        this.appendCombatLog(`Round ${this.round} begins.`);
        
        // Execute AI turns
        this.processRoundTurns();
        
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

