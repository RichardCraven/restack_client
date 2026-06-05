import { createFighter } from './factories';
import attacksMatrix from './attacks-matrix';
import specialsMatrix from './specials-matrix';
import { activeShieldWalls } from './shared-ai-methods/movement-methods';
import { INTERVALS } from './shared-constants';

const MAX_DEPTH = 7;
const MAX_LANES = 5;


const clone = (val) => {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
};

const DURATION_ROUNDS = {
    'instant': 0,
    'short': 2,
    'long': 4,
    '2x-long': 8,
    '3x-long': 12
};

const formatCombatText = (value) => String(value || '')
    .replaceAll('_', ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

export function CombatManagerRedux() {
    this.FIGHT_INTERVAL = INTERVALS[1]; // default Slow
    this.combatants = {};
    this.round = 1;
    this.roundTimeRemainingRatio = 1.0;
    this.roundTimeElapsedMs = 0;
    this.gameSpeed = 'slow'; // 'slow' or 'fast'
    this.combatPaused = false;
    this.combatOver = false;
    this.combatLog = [];
    this.combatLogSequence = 0;
    this.selectedFighter = null;
    this.vctByMonster = {};

    const getDurationRounds = (dur) => {
        if (typeof dur === 'number') return dur;
        if (typeof dur === 'string') {
            return DURATION_ROUNDS[dur] !== undefined ? DURATION_ROUNDS[dur] : 4;
        }
        return 4;
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
        let arr = null;
        if (callerOrArray) {
            if (Array.isArray(callerOrArray.specials)) arr = callerOrArray.specials;
            else if (Array.isArray(callerOrArray)) arr = callerOrArray;
        }
        if (!Array.isArray(arr)) return null;

        for (let s of arr) {
            if (!s) continue;
            if (typeof s === 'string') {
                const sNorm = s.replace(/\s+/g, '_').toLowerCase();
                if (s.toLowerCase() === key.toLowerCase() || sNorm === normalized) {
                    const expanded = specialsMatrix[normalized];
                    return expanded ? clone(expanded) : { name: key };
                }
            } else if (typeof s === 'object') {
                if (s.name && (s.name.toLowerCase() === key.toLowerCase() || s.name.toLowerCase() === normalized)) return s;
                if (s.key && s.key.toLowerCase() === normalized) return s;
            }
        }
        const expanded = specialsMatrix[normalized];
        return expanded ? clone(expanded) : null;
    };

    this.updateAllFightIntervals = (newInterval) => {
        this.FIGHT_INTERVAL = newInterval;
        if (newInterval === INTERVALS[0] || newInterval === INTERVALS[1]) {
            this.gameSpeed = 'slow';
        } else {
            this.gameSpeed = 'fast';
        }
    };

    this.setSelectedFighter = (selectedFighter) => {
        this.selectedFighter = selectedFighter;
    };

    this.removeCombatant = (id) => {
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
                const laneIndex = i % availableLanes.length;
                const columnOffset = Math.floor(i / availableLanes.length);
                e.coordinates = { x: MAX_DEPTH - columnOffset, y: availableLanes[laneIndex] };

                const minion = createFighter(e, callbacks, this.FIGHT_INTERVAL);
                minion.isMinion = true;
                minion.maxEndurance = e.stats.vitality || Math.round(20 + (e.stats.def || 5) * 2);
                minion.endurance = minion.maxEndurance;
                minion.enduranceFrozenRounds = 0;
                minion.cooldowns = {};
                minion.movesTakenThisRound = 0;
                minion.actionsTakenThisRound = 0;

                this.combatants[minion.id] = minion;
                this._setCombatantOccupiedCoords(minion, this.combatants);
            });
        }

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
        const LARGE_COMBAT_KEYS = ['dragon', 'beholder', 'ogre', 'sphinx', 'manticore', 'wyvern', 'wyvern_alt', 'mummy'];
        const isLarge = (
            (typeof combatant.large === 'boolean' && combatant.large === true)
            || (combatant.type && LARGE_COMBAT_KEYS.includes(combatant.type))
            || (typeof combatant.size === 'number' && combatant.size >= 2)
            || (typeof combatant.scale === 'number' && combatant.scale >= 2)
            || (combatant.isMonster === true && combatant.isMinion !== true)
        );
        if (isLarge && combatant.coordinates) {
            const above = { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 };
            if (above.y >= 0 && !combatant.occupiedCoords.some(c => c.x === above.x && c.y === above.y)) {
                combatant.occupiedCoords.push(above);
                this.vctByMonster[combatant.id] = {
                    monsterId: combatant.id,
                    coordinates: { ...above },
                    get isVCT() { return true; },
                    get parentMonster() { return combatant; }
                };
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
            const vct = this.vctByMonster[combatant.id];
            if (combatant.coordinates) {
                vct.coordinates = { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 };
                const vctId = `${combatant.id}_VCT`;
                if (this.combatants[vctId]) {
                    this.combatants[vctId].coordinates = { ...vct.coordinates };
                }
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

    this.updateUnitCoordinates = (unit, nx, ny) => {
        unit.coordinates.x = nx;
        unit.coordinates.y = ny;
        this._setCombatantOccupiedCoords(unit, this.combatants);
        this.syncVCTs();
    };

    this.hitCheck = (caller, target) => {
        if (!target || !caller) return true;
        const targetSpeed = target.stats.speed || target.stats.dex || 1;
        const baseMissChance = targetSpeed * 3.0; // scales with speed
        let missChance = Math.min(baseMissChance, 45); // cap at 45% normally

        // Monk's Third Eye: doubles the chance that enemy attack will miss
        if (target.thirdEyeActive && caller.isMonster) {
            missChance = Math.min(missChance * 2.0, 75);
        }

        return (Math.random() * 100) >= missChance;
    };

    this.damageCheck = (caller, target, rawDamage) => {
        if (!target || typeof rawDamage !== 'number' || rawDamage <= 0) return rawDamage || 0;
        let equippedArmor = 0;
        try {
            const inv = target.inventory || [];
            equippedArmor = inv
                .filter(i => i && i.type === 'armor' && (i.equippedSlot || i.equippedBy === target.id))
                .reduce((acc, a) => acc + (typeof a.armor === 'number' ? a.armor : 0), 0);
        } catch (e) { equippedArmor = 0; }
        const naturalArmor = (target.stats && typeof target.stats.def === 'number' && target.stats.def > 0)
            ? target.stats.def * 4 : 0;
        const totalArmor = Math.min(equippedArmor + naturalArmor, 200);
        if (totalArmor <= 0) return rawDamage;
        const reduction = Math.min(totalArmor / 2.5, 75); // max 75% reduction
        return Math.max(1, Math.round(rawDamage * (1 - reduction / 100)));
    };

    this.targetInRange = (caller, target, rangeType) => {
        if (!caller || !target) return false;
        const distance = Math.abs(caller.coordinates.x - target.coordinates.x) + Math.abs(caller.coordinates.y - target.coordinates.y);
        if (rangeType === 'close') return distance <= 1;
        if (rangeType === 'medium') return distance <= 3;
        return true; // far/any
    };

    // ── Target Acquisition ────────────────────────────────────────────────────
    // Acquire an attack target using threat-weighted scoring.
    // Prioritizes: lowest HP% target, then healer/support classes, then closest.
    this.acquireTarget = (caller, preferWeakest = true) => {
        let bestTarget = null;
        let bestScore = -Infinity;

        // Healers are high-value targets for enemies
        const HEALER_TYPES = new Set(['sage', 'summoner', 'wizard']);

        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT) return;
            // Crew targets monsters/minions, monsters/minions target crew
            const callerIsEnemy = !!(caller.isMonster || caller.isMinion);
            const cIsEnemy = !!(c.isMonster || c.isMinion);
            if (callerIsEnemy === cIsEnemy) return;

            const dist = Math.abs(caller.coordinates.x - c.coordinates.x)
                       + Math.abs(caller.coordinates.y - c.coordinates.y);
            const hpPct  = c.starting_hp > 0 ? (c.hp / c.starting_hp) : 1;

            // Score: closer is better, lower HP is better, healers are more tempting
            let score = 0;
            score -= dist * 2;                          // prefer close targets
            if (preferWeakest) score += (1 - hpPct) * 10; // prefer wounded targets
            if (!callerIsEnemy && HEALER_TYPES.has(c.type)) score += 5;

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

    // Find the friendliest ally who needs healing (lowest HP%)
    this.findWoundedAlly = (unit) => {
        let worst = null;
        let worstPct = 1.0;
        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT || c.id === unit.id) return;
            // Same faction check
            const sameTeam = (unit.isMonster || unit.isMinion)
                ? (c.isMonster || c.isMinion)
                : (!c.isMonster && !c.isMinion);
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
            if (unit.isMonster || unit.isMinion) return !c.isMonster && !c.isMinion;
            return c.isMonster || c.isMinion;
        }).length;
    };

    this.targetKilled = (target) => {
        if (this.tryTriggerReassemble(target)) {
            return;
        }
        target.dead = true;
        target.locked = true;
        this.appendCombatLog(`${this.getCombatantLogName(target)} has been defeated.`);
        this.removeCombatant(target.id);
        this.combatOverCheck();
    };

    this.tryTriggerReassemble = (combatant) => {
        if (!combatant) return false;
        if ((combatant.type || '').toLowerCase() !== 'skeleton') return false;
        const hasReassemble = Array.isArray(combatant.specials) && combatant.specials.includes('reassembly');
        if (!hasReassemble) return false;
        if (combatant.reassembleUsed || combatant.hasReassembled) return false;

        combatant.reassembleUsed = true;
        if (Math.random() > 0.40) {
            return false;
        }

        const reviveHp = Math.max(1, Math.floor((combatant.starting_hp || combatant.stats?.hp || 1) * 0.30));
        combatant.hp = reviveHp;
        combatant.hasReassembled = true;
        combatant.dead = false;
        combatant.locked = false;
        combatant.wounded = false;
        combatant.frozen = false;
        combatant.petrified = false;

        combatant.specials = [];
        
        const currentAtk = typeof combatant.stats?.atk === 'number' ? combatant.stats.atk : 5;
        const currentSpeed = typeof combatant.stats?.speed === 'number' ? combatant.stats.speed : 7;

        if (combatant.stats) {
            combatant.stats.atk = Math.max(1, Math.round(currentAtk * 2));
            combatant.stats.speed = Math.max(1, Math.round(currentSpeed * 2));
        }

        this.appendCombatLog(`${this.getCombatantLogName(combatant)} reassembles with berserk fury!`);
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
        return true;
    };

    this.combatOverCheck = () => {
        let crewAlive = false;
        let monstersAlive = false;

        Object.values(this.combatants).forEach(c => {
            if (!c || c.dead || c.isVCT) return;
            if (c.isMonster || c.isMinion) {
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

    this.triggerVisualAbility = (unitId, targetId, ability) => {
        if (!this.animationManager) return;
        const unit = this.getCombatant(unitId);
        const target = this.getCombatant(targetId);
        if (!unit || !target) return;

        const sourceTileId = this.animationManager.getTileIdByCoords(unit.coordinates);
        const targetTileId = this.animationManager.getTileIdByCoords(target.coordinates);
        const facing = target.coordinates.x >= unit.coordinates.x ? 'right' : 'left';

        const name = (ability.name || ability.id || '').toLowerCase().replace(/\s+/g, '_');

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
                this.animationManager.rippleAnimation(targetTileId, 'blue');
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
                    this.appendCombatLog(`DEBUG: Turn started for ${unit.name} (${unit.type})`);
                    if (this.combatPaused || this.combatOver || unit.dead) {
                        this.appendCombatLog(`DEBUG: Skip turn for ${unit.name} - paused: ${this.combatPaused}, over: ${this.combatOver}, dead: ${unit.dead}`);
                        return;
                    }

                    // Tick down active buff/debuff durations
                    this._tickUnitBuffs(unit);
                    this._tickUnitDebuffs(unit);

                    // Incapacitation check
                    if (unit.frozen || unit.stunned || unit.petrified) {
                        this.appendCombatLog(`${this.getCombatantLogName(unit)} is incapacitated and skips this round.`);
                        // Still tick down the incapacitation
                        if (unit.frozenRounds > 0) { unit.frozenRounds--; if (unit.frozenRounds <= 0) { unit.frozen = false; } }
                        if (unit.stunnedRounds > 0) { unit.stunnedRounds--; if (unit.stunnedRounds <= 0) { unit.stunned = false; } }
                        if (unit.petrifiedRounds > 0) { unit.petrifiedRounds--; if (unit.petrifiedRounds <= 0) { unit.petrified = false; } }
                        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                        return;
                    }

                    // Execute class-specific AI decision tree
                    this.executeUnitAI(unit);
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
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s exposed weakness has faded.`);
            }
        }
        if (unit.ensnared && typeof unit.ensnaredRounds === 'number') {
            unit.ensnaredRounds--;
            if (unit.ensnaredRounds <= 0) {
                unit.ensnared = false;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} is no longer ensnared.`);
            }
        }
        if (unit.marked && typeof unit.markedRounds === 'number') {
            unit.markedRounds--;
            if (unit.markedRounds <= 0) {
                unit.marked = false;
                this.appendCombatLog(`${this.getCombatantLogName(unit)}'s mark has expired.`);
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
        // Don't stack the same buff type
        if (unit.activeBuffs.some(b => b.name === name)) return;

        const applied = { name, roundsLeft: durationRounds, statChanges: {} };
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
        if (unit.activeDebuffs.some(d => d.name === name)) return;

        const applied = { name, roundsLeft: durationRounds, statChanges: {} };
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
            default:         return this._aiGeneric(unit);
        }
    };

    // ── Utility: resolve ability key from specials array ──────────────────────
    this._resolveAbilityKey = (s) => {
        if (!s) return null;
        if (typeof s === 'string') return s.replace(/\s+/g, '_').toLowerCase();
        return (s.id || s.key || (s.name && typeof s.name === 'string' && s.name.replace(/\s+/g, '_').toLowerCase()) || null);
    };

    // Returns true if the ability is off cooldown and available
    this._abilityReady = (unit, abilityKey) => {
        if (!abilityKey) return false;
        return !unit.cooldowns[abilityKey];
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
            if (!resolved) return;

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
            else if (resolved.type === 'debuff' || effects.some(e => typeof e === 'object' && e.type)) {
                score += 10 + enemyCount * 2;
                if (target) {
                    const isStunnedOrFrozen = target.stunned || target.frozen;
                    if (!isStunnedOrFrozen) score += 8;
                }
            }

            // Damage
            else if (resolved.type === 'damage') {
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

        // Astral Being: required for third_eye and projection; entered via astral_focus
        const astralActive = !!unit.astralBeingActive;

        // Priority 1: If not in astral mode, consider monk_astral_focus
        if (!astralActive && this._abilityReady(unit, 'monk_astral_focus')) {
            const pick = this.resolveSpecial(unit, 'monk_astral_focus');
            if (pick && unit.hp / unit.starting_hp > 0.5) { // don't focus if low HP
                this._applyBuff(unit, pick.buff || {}, 'astral_being', 6);
                unit.astralBeingActive = true;
                unit.astralBeingRoundsLeft = 6;
                this.appendCombatLog(`${this.getCombatantLogName(unit)} enters Astral Being mode.`);
                this._setCooldown(unit, 'monk_astral_focus', pick.cooldown || 20);
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
                unit.thirdEyeActive = true;
                unit.thirdEyeRoundsLeft = 4;
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

        // Priority 4: Standard scored ability selection
        const scored = this._scoredAbilityPick(unit, target);
        const inRange = target && this.targetInRange(unit, target, 'close');

        if (inRange) {
            if (scored) this.useAbility(unit, scored.resolved, target);
            else this._basicAttack(unit, target);
        } else {
            this.moveCloser(unit, target);
            const nowInRange = this.targetInRange(unit, target, 'close');
            if (nowInRange) {
                if (scored) this.useAbility(unit, scored.resolved, target);
                else this._basicAttack(unit, target);
            }
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
        this.acquireTarget(unit, false); // soldiers go for closest, not weakest
        const target = this.combatants[unit.targetId];
        if (!target) return;

        const enemyCount = this.countEnemies(unit);
        const selfHpPct = unit.starting_hp > 0 ? unit.hp / unit.starting_hp : 1;

        // Priority 1: Shield wall when facing 3+ enemies and HP decent
        if (enemyCount >= 3 && selfHpPct > 0.5 && this._abilityReady(unit, 'shield_wall')) {
            const pick = this.resolveSpecial(unit, 'shield_wall');
            if (pick) {
                unit.shieldWallActive = true;
                unit.shieldWallRoundsLeft = pick.duration || 4;
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
            if (!c || c.dead || c.isVCT) return;
            const isEnemy = (unit.isMonster || unit.isMinion) ? (!c.isMonster && !c.isMinion) : (c.isMonster || c.isMinion);
            if (!isEnemy) return;
            const dx = c.coordinates.x - unit.coordinates.x;
            const dy = Math.abs(c.coordinates.y - unit.coordinates.y);
            if (Math.abs(dx) <= 1 && dy <= 1) {
                // Push one tile further away
                const nx = c.coordinates.x + forwardDir;
                if (nx >= 0 && nx <= MAX_DEPTH) {
                    const blocked = Object.values(this.combatants).some(
                        e => e && !e.dead && e.id !== c.id && e.coordinates && e.coordinates.x === nx && e.coordinates.y === c.coordinates.y
                    );
                    if (!blocked) {
                        c.coordinates.x = nx;
                        this.appendCombatLog(`${this.getCombatantLogName(c)} is pushed back!`);
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

        // Wizards prefer medium range — retreat if enemy is too close
        const dist = target ? Math.abs(unit.coordinates.x - target.coordinates.x)
                            + Math.abs(unit.coordinates.y - target.coordinates.y) : 999;
        if (dist <= 1) {
            // Too close — try to back away
            this.repositionUnit(unit, target, 'retreat');
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
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 2: Circle of Protection if we have 2+ allies
        if (this._abilityReady(unit, 'circle_of_protection')) {
            const pick = this.resolveSpecial(unit, 'circle_of_protection');
            if (pick) {
                const dur = getDurationRounds(pick.duration || 'long');
                Object.values(this.combatants).forEach(c => {
                    if (!c || c.dead || c.isVCT) return;
                    const sameTeam = (unit.isMonster || unit.isMinion)
                        ? (c.isMonster || c.isMinion) : (!c.isMonster && !c.isMinion);
                    if (!sameTeam) return;
                    this._applyBuff(c, pick.buff || {}, 'circle_of_protection', dur);
                });
                this.appendCombatLog(`${this.getCombatantLogName(unit)} casts Circle of Protection on allies.`);
                this._setCooldown(unit, 'circle_of_protection', pick.cooldown || 8);
                unit.actionsTakenThisRound += 1;
                if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                return;
            }
        }

        // Priority 3: Perceive (doubles weakness of all enemies for 2x-long duration: 8 rounds)
        if (this._abilityReady(unit, 'perceive')) {
            const pick = this.resolveSpecial(unit, 'perceive');
            if (pick) {
                const dur = getDurationRounds(pick.duration || '2x-long');
                Object.values(this.combatants).forEach(c => {
                    if (!c || c.dead || c.isVCT) return;
                    const isEnemy = (unit.isMonster || unit.isMinion)
                        ? (!c.isMonster && !c.isMinion) : (c.isMonster || c.isMinion);
                    if (!isEnemy) return;
                    c.weaknessRevealed = true;
                    c.weaknessRevealedRounds = dur;
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

        // Priority 1: Ensnare if target is not ensnared
        if (this._abilityReady(unit, 'ensnare') && !target.ensnared) {
            const pick = this.resolveSpecial(unit, 'ensnare');
            if (pick) {
                this.useAbility(unit, pick, target);
                target.ensnared = true;
                target.ensnaredRounds = getDurationRounds(pick.duration || 'short');
                this._setCooldown(unit, 'ensnare', pick.cooldown || 6);
                return;
            }
        }

        // Priority 2: Mark target
        if (this._abilityReady(unit, 'mark') && !target.marked) {
            const pick = this.resolveSpecial(unit, 'mark');
            if (pick) {
                this.useAbility(unit, pick, target);
                target.marked = true;
                target.markedRounds = getDurationRounds(pick.duration || 'long');
                this._setCooldown(unit, 'mark', pick.cooldown || 4);
                return;
            }
        }

        // Priority 3: Execute (rapid three arrows)
        if (this._abilityReady(unit, 'execute')) {
            const pick = this.resolveSpecial(unit, 'execute');
            if (pick) {
                this.useAbility(unit, pick, target);
                this._setCooldown(unit, 'execute', pick.cooldown || 8);
                return;
            }
        }

        // Default: loose (basic attack)
        this._basicAttack(unit, target);
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
            attacks: ['slash'],
            specials: [],
            cooldowns: {},
            movesTakenThisRound: 0,
            actionsTakenThisRound: 0,
            endurance: 20,
            maxEndurance: 20,
            enduranceFrozenRounds: 0,
            damageIndicators: [],
            activeBuffs: [],
            activeDebuffs: [],
        };

        this.combatants[minionId] = newMinion;
        this._setCombatantOccupiedCoords(newMinion);
        this._setCooldown(unit, abilityKey, ability.cooldown || 8);
        unit.actionsTakenThisRound += 1;
        this.appendCombatLog(`${this.getCombatantLogName(unit)} summons a ${newMinion.name}!`);
        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
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
            // Copies cannot inherit duplicate/triplicate
            copy.specials = (copy.specials || []).filter(
                s => s !== 'summoner_duplicate' && s !== 'summoner_triplicate'
            );
            this.combatants[copyId] = copy;
            spawned++;
            this.appendCombatLog(`${this.getCombatantLogName(unit)} duplicates a ${source.name}!`);
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

    // ── Cooldown Helper ───────────────────────────────────────────────────────
    this._setCooldown = (unit, key, rounds) => {
        const normalized = key.replace(/\s+/g, '_').toLowerCase();
        unit.cooldowns[normalized] = rounds;
    };

    // ── Ability Use ───────────────────────────────────────────────────────────
    this.useAbility = (unit, ability, target) => {
        if (!ability || !target) return;
        if (unit.actionsTakenThisRound >= 1) return;
        unit.actionsTakenThisRound += 1;
        unit.endurance = Math.max(0, unit.endurance - 1);

        // Endurance-penalty cooldown scaling
        const baseCooldown = (typeof ability.cooldown === 'number') ? ability.cooldown : 5;
        let cooldownPenalty = 1.0;
        if (unit.endurance <= 0) {
            cooldownPenalty = 2.0;
            if (unit.enduranceFrozenRounds <= 0) unit.enduranceFrozenRounds = 4;
        } else if (unit.endurance <= unit.maxEndurance * 0.5) {
            cooldownPenalty = 1.5;
        }
        const finalCooldown = Math.round(baseCooldown * cooldownPenalty);
        const abilityId = ability.id || ability.key
            || (ability.name && ability.name.replace(/\s+/g, '_').toLowerCase())
            || 'ability';
        unit.cooldowns[abilityId] = finalCooldown;

        // Visual animation hook
        if (this.animationManager && typeof this.animationManager.triggerVisualAbility === 'function') {
            this.animationManager.triggerVisualAbility(unit.id, target.id, ability);
        }

        // Apply self-buffs
        const effects = Array.isArray(ability.effect) ? ability.effect : (ability.effect ? [ability.effect] : []);
        if (effects.some(e => typeof e === 'string' && e.includes('buff_self')) && ability.buff) {
            this._applyBuff(unit, ability.buff.increase_stats ? ability.buff : { increase_stats: { stats: [] } },
                ability.name, getDurationRounds(ability.duration || 'long'));
        }

        // Apply all-enemy debuffs
        if (effects.some(e => typeof e === 'string' && e.includes('nerf_all_enemies')) && ability.nerf) {
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (unit.isMonster || unit.isMinion) ? (!c.isMonster && !c.isMinion) : (c.isMonster || c.isMinion);
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

        // AoE damage — hits all enemies in range
        if (effects.some(e => typeof e === 'string' && e.includes('multi_target'))) {
            const rawDamage = ability.damage || unit.stats.atk || 5;
            let totalHits = 0;
            Object.values(this.combatants).forEach(c => {
                if (!c || c.dead || c.isVCT) return;
                const isEnemy = (unit.isMonster || unit.isMinion) ? (!c.isMonster && !c.isMinion) : (c.isMonster || c.isMinion);
                if (!isEnemy) return;
                const dist = Math.abs(unit.coordinates.x - c.coordinates.x) + Math.abs(unit.coordinates.y - c.coordinates.y);
                if (dist > 2) return;
                const hit = this.hitCheck(unit, c);
                if (hit) {
                    const finalDmg = this.damageCheck(unit, c, rawDamage);
                    c.hp = Math.max(0, c.hp - finalDmg);
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
        const rawDamage = (typeof ability.damage === 'number') ? ability.damage : (unit.stats.atk || 5);
        const dmgMult = target.weaknessRevealed ? 1.25 : 1.0;
        const hit = this.hitCheck(unit, target);
        if (hit) {
            const finalDmg = Math.round(this.damageCheck(unit, target, rawDamage) * dmgMult);
            target.hp = Math.max(0, target.hp - finalDmg);
            target.damageIndicators = target.damageIndicators || [];
            target.damageIndicators.push({
                id: Date.now() + Math.random(),
                value: `-${finalDmg}`,
                source: ability.name,
                type: 'damage'
            });
            this.appendCombatLog(`${this.getCombatantLogName(unit)} uses ${this.getCombatActionName(ability)} on ${this.getCombatantLogName(target)} for ${finalDmg} damage${target.weaknessRevealed ? ' (weakness exposed!)' : ''}.`);

            // Process side effects (stun, frozen, ensnared, fear, poison, bleed)
            const resolvedEffects = effects.filter(e => typeof e === 'object' && e && e.type);
            resolvedEffects.forEach(eff => {
                const chance = typeof eff.chance === 'number' ? eff.chance : 100;
                if (Math.random() * 100 <= chance) {
                    const dur = getDurationRounds(eff.duration || 'short');
                    if (eff.type === 'frozen') {
                        target.frozen = true;
                        target.frozenRounds = dur;
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is frozen!`);
                    } else if (eff.type === 'ensnared') {
                        target.ensnared = true;
                        target.ensnaredRounds = dur;
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is ensnared!`);
                    } else if (eff.type === 'fear') {
                        target.stunned = true;
                        target.stunnedRounds = dur;
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is terrified and cannot act.`);
                    } else if (eff.type === 'stun') {
                        target.stunned = true;
                        target.stunnedRounds = dur;
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is stunned!`);
                    } else if (eff.type === 'poison') {
                        this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 3 }] } }, 'poison', dur);
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is poisoned!`);
                    } else if (eff.type === 'bleed') {
                        this._applyDebuff(target, { decrease_stats: { stats: [{ stat: 'atk', amount: 2 }] } }, 'bleed', dur);
                        this.appendCombatLog(`${this.getCombatantLogName(target)} is bleeding!`);
                    }
                }
            });

            if (target.hp <= 0) this.targetKilled(target);
        } else {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} attacks ${this.getCombatantLogName(target)} but misses!`);
            target.damageIndicators = target.damageIndicators || [];
            target.damageIndicators.push({ id: Date.now() + Math.random(), value: 'MISS', source: ability.name, type: 'miss' });
        }

        if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
    };

    // Basic attack wrapper (no cooldown for basic attacks)
    this._basicAttack = (unit, target) => {
        if (!target || unit.actionsTakenThisRound >= 1) return;
        const baseAttack = Array.isArray(unit.attacks) && unit.attacks.length > 0 ? unit.attacks[0] : null;
        let attack;
        if (baseAttack && typeof baseAttack === 'object') {
            attack = {
                ...baseAttack,
                damage: unit.stats.atk || baseAttack.damage || 5,
                cooldown: 0
            };
        } else {
            attack = {
                name: typeof baseAttack === 'string' ? baseAttack : 'attack',
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
        if (unit.movesTakenThisRound >= 1 || !target) return;

        const dx = target.coordinates.x - unit.coordinates.x;
        const dy = target.coordinates.y - unit.coordinates.y;
        let newX = unit.coordinates.x;
        let newY = unit.coordinates.y;

        // Prefer whichever axis needs more correction; try the other if blocked
        const tryMove = (ax, ay) => {
            const blocked = this.isTileOccupied(ax, ay, unit.id);
            if (!blocked && ax >= 0 && ax <= MAX_DEPTH && ay >= 0 && ay < MAX_LANES) {
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
            unit.endurance = Math.max(0, unit.endurance - 1);
            if (unit.endurance <= 0 && unit.enduranceFrozenRounds <= 0) unit.enduranceFrozenRounds = 4;
            this.appendCombatLog(`${this.getCombatantLogName(unit)} moves toward ${this.getCombatantLogName(target)}.`);
        }
    };

    // Reposition: ranged units try to move away from close enemies
    this.repositionUnit = (unit, enemyTarget, mode = 'reposition') => {
        if (unit.ensnared) {
            this.appendCombatLog(`${this.getCombatantLogName(unit)} is ensnared and cannot move!`);
            return;
        }
        if (unit.movesTakenThisRound >= 1 || !enemyTarget) return;
        if (mode === 'retreat') {
            // Move away from the enemy
            const dx = unit.coordinates.x - enemyTarget.coordinates.x;
            const dy = unit.coordinates.y - enemyTarget.coordinates.y;
            const newX = unit.coordinates.x + Math.sign(dx);
            const newY = unit.coordinates.y + Math.sign(dy || 0);

            const blocked = this.isTileOccupied(newX, newY, unit.id);
            if (!blocked && newX >= 0 && newX <= MAX_DEPTH && newY >= 0 && newY < MAX_LANES) {
                this.updateUnitCoordinates(unit, newX, newY);
                unit.movesTakenThisRound += 1;
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
            
            const roundDurationMs = this.gameSpeed === 'fast' ? 1000 : 2000;
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
                } else if (c.endurance < c.maxEndurance) {
                    const recovery = Math.floor(c.maxEndurance * 0.01);
                    c.endurance = Math.min(c.maxEndurance, c.endurance + Math.max(1, recovery));
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
    this.establishUpdateDataCallback = (cb) => { this.updateData = cb; };
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
    };
    this.disconnectOverlayManager = () => { this.overlayManager = null; };

    // Action and control stubs to avoid crash
    this.setManualControl = (fighterId, enabled) => {};
    this.manualRetarget = (fighter) => {};
    this.getRangeWidthVal = (details) => 0;
    this.queueAction = (fighterId, actionId, action) => {};
    this.fighterManualAttack = () => {};
    this.fighterSpecialAttack = (special) => {};
    this.setTargetFromClick = (fighterId, tileId) => {};
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

