import * as images from '../utils/images'

import { FighterAI } from './fighter-ai/fighter-ai'
import { MonsterAI } from './monster-ai/monster-ai'
import {createFighter} from './factories'
import specialsMatrix from './specials-matrix'
import { activeShieldWalls } from './shared-ai-methods/movement-methods'
// import { cilLifeRing } from '@coreui/icons'
import { INTERVALS, ROCK_DURATION, CRIT_THRESHOLD_DEFAULT, CRIT_THRESHOLD_INCREASED, CRITICAL_DAMAGE_MULTIPLIER } from './shared-constants';
// import test from './factories'
// import {MovementMethods} from './methods/movement-methods';

const MAX_DEPTH = 7
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left
const MAX_LANES = 5
// const this.FIGHT_INTERVAL = 8;
// const intervals = [5, 10, 40, 90]
const FIGHT_INTERVAL = INTERVALS[1]; // 'Slow' (40)
// Number of FIGHT_INTERVAL ticks in one era, based on a reference speed-10 combatant
// (increment = 1/(1/10*25) = 0.4 → 100/0.4 = 250 ticks to complete a full turn cycle).
// Used by kickoffSpecialCooldown so special cooldowns are expressed in eras and
// automatically stretch/compress when game speed changes.
const TICKS_PER_ERA = 250;
const DEBUG_STEPS = false;
const RANGES = {
    close: 1,
    medium: 3,
    far: 5
}

const clone = (val) => {
    if (val === undefined || val === null) return val;
    return JSON.parse(JSON.stringify(val));
}

export function CombatManager(){
    // Update all combatants' intervals and restart their turn cycles
    this.updateAllFightIntervals = (newInterval) => {
        this.FIGHT_INTERVAL = newInterval;
        Object.values(this.combatants).forEach(c => {
            if (typeof c.setFightInterval === 'function') {
                c.setFightInterval(newInterval);
            }
        });
        // Notify AI modules so their internal data.INTERVAL_TIME stays in sync
        if (this._intervalTimeListeners) {
            this._intervalTimeListeners.forEach(cb => { try { cb(newInterval); } catch (e) {} });
        }
    }
    // Assign this.FIGHT_INTERVAL to the instance for external access
    this.FIGHT_INTERVAL = FIGHT_INTERVAL;
    this.fighterAI = new FighterAI(NUM_COLUMNS, MAX_LANES, this.FIGHT_INTERVAL);
    /**
     * Remove a combatant from the combatants object by id.
     * This should be called after the death animation/fade-out completes in the UI.
     */
    this.removeCombatant = (id) => {
        if (this.combatants && this.combatants[id]) {
            // Remove from target lists of other combatants
            Object.values(this.combatants).forEach(e => {
                if (Array.isArray(e.targettedBy)) {
                    e.targettedBy = e.targettedBy.filter(tid => tid !== id);
                }
                if (e.targetId === id) {
                    e.targetId = null;
                }
            });
            delete this.combatants[id];
            // Broadcast update to ensure UI sync
            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        }
    }
    this.monsterAI = new MonsterAI(NUM_COLUMNS, MAX_LANES, this.FIGHT_INTERVAL);
    this.overlayManager = null;
    this.selectedFighter = null;
    this.combatPaused = false;
    this.pauseCombat = (val) => {
        this.combatPaused = val
        Object.values(this.combatants).forEach(e=>e.combatPaused = val)
    }
    this.reset = () => {
        this.combatPaused = false;
        this.combatants = {};
    }
    // this.combatStyles = {
    //     prioritizeClosestEnemy,
    //     default
    // }
    this.attacksMatrix = {
        claws: {
            name: 'claws',
            type: 'cutting',
            range: 'close',
            icon: images['claws'],
            cooldown: 3,
        },
        bite: {
            name: 'bite',
            type: 'cutting',
            icon: images['bite'],
            range: 'close',
            cooldown: 3,
        },
        crush: {
            name: 'crush',
            type: 'crushing',
            icon: images['crushing'],
            range: 'close',
            cooldown: 5,
        },
        tackle: {
            name: 'tackle',
            type: 'crushing',
            range: 'close',
            cooldown: 2,
        },
        grasp: {
            name: 'grasp',
            type: 'crushing',
            range: 'close',
            cooldown: 3,
            effect: { type: 'stun', chance: 20, duration: 2 },
        },
        energy_drain: {
            name: 'energy drain',
            type: 'curse',
            range: 'medium',
            cooldown: 3,
        },
        fire_breath: {
            name: 'fire breath',
            type: 'fire',
            icon: images['fire_breath'],
            range: 'medium',
            cooldown: 3,
        },
        void_lance: {
            name: 'void lance',
            icon: images['void_lance'],
            type: 'psionic',
            range: 'medium',
            cooldown: 3,
        },
        energy_blast: {
            name: 'energy blast',
            type: 'arcane',
            range: 'far',
            icon: images['void_lance'],
            cooldown: 3,
        },
        major_magic_missile: {
            name: 'major magic missile',
            type: 'arcane',
            range: 'far',
            icon: images['magic_missile'],
            cooldown: 5,
        },
        minor_magic_missile: {
            name: 'minor magic missile',
            type: 'arcane',
            range: 'far',
            icon: images['magic_missile'],
            cooldown: 7,
        },
        induce_madness: {
            name: 'induce madness',
            type: 'psionic',
            icon: images['lundi_mask'],
            range: 'far',
            cooldown: 2.5,
        },
        lightning: {
            name: 'lightning',
            type: 'electricity',
            icon: images['lightning'],
            range: 'far',
            cooldown: 3,
        },
        sword_swing: {
            name: 'sword swing',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 2.5,
        },
        sword_thrust: {
            name: 'sword thrust',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 2,
        },
        dragon_punch: {
            name: 'dragon punch',
            type: 'crushing',
            range: 'close',
            icon: images['hand_7'],
            cooldown: 3,
        },
        meditate: {
            name: 'meditate',
            type: 'buff',
            range: 'self',
            icon: images['basic_shield'],
            cooldown: 3,
        },
        heal: {
            name: 'heal',
            type: 'buff',
            range: 'close',
            icon: images['basic_shield'],
            cooldown: 3,
        },
        fire_arrow: {
            name: 'fire arrow',
            type: 'fire',
            range: 'far',
            icon: images['bow_and_arrow'],
            cooldown: 2,
        },
        axe_throw: {
            name: 'axe throw',
            type: 'cutting',
            range: 'medium',
            icon: images['axe'],
            cooldown: 2.5,
        },
        axe_swing: {
            name: 'axe swing',
            type: 'cutting',
            range: 'close',
            icon: images['axe'],
            cooldown: 2,
        },
        spear_throw: {
            name: 'spear throw',
            type: 'cutting',
            range: 'far',
            icon: images['spear'],
            cooldown: 3.2,
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'crushing',
            range: 'medium',
            icon: images['scepter'],
            cooldown: 4.5,
        },
        shield_bash: {
            name: 'shield bash',
            type: 'crushing',
            range: 'close',
            icon: images['basic_shield'],
            cooldown: 4.5,
        },
        cane_strike: {
            name: 'cane strike',
            type: 'crushing',
            range: 'far',
            icon: images['scepter'],
            cooldown: 3,
        },
        dagger_stab: {
            name: 'dagger_stab',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 2,
        },
        snake_strike: {
            name: 'snake_strike',
            type: 'cutting',
            range: 'medium',
            icon: images['sword'],
            cooldown: 2,
        }
    }

    // Use the centralized canonical specials matrix so other modules import
    // the same authoritative data. Keep on the instance for compatibility.
    this.specialsMatrix = specialsMatrix;

    // Sync any already-instantiated combatants' specials/specialActions
    // with the canonical matrix to avoid stale data.
    this.syncSpecials = () => {
        try {
            Object.values(this.combatants).forEach(combatant => {
                if (!combatant) return;
                // Normalize `specials` (learned/innate specials) — re-merge from the
                // canonical matrix but preserve any in-progress cooldown_position so
                // a running kickoffSpecialCooldown interval is not orphaned.
                if (Array.isArray(combatant.specials)) {
                    try {
                        combatant.specials = combatant.specials.map(s => {
                            if (!s) return s;
                            // If it's still a raw string key, expand it fully
                            if (typeof s === 'string') {
                                return this.formatSpecials([s])[0] || s;
                            }
                            // Already an object — re-merge from canonical but keep cooldown_position
                            const lookupKey = s.name
                                ? s.name.replace(/\s+/g, '_').toLowerCase()
                                : null;
                            const canonical = lookupKey ? this.formatSpecials([lookupKey])[0] : null;
                            if (canonical) {
                                const instanceProps = {};
                                if (s.cooldown_position !== undefined) instanceProps.cooldown_position = s.cooldown_position;
                                return Object.assign({}, canonical, instanceProps);
                            }
                            return s;
                        });
                    } catch (err) {
                        console.warn('syncSpecials: failed to format specials for', combatant.id, err);
                    }
                }

                // Normalize `specialActions` (consumable instances) while
                // preserving instance-specific fields (count, id, etc.)
                if (Array.isArray(combatant.specialActions)) {
                    combatant.specialActions = combatant.specialActions.map(sa => {
                        if (!sa) return sa;
                        if (typeof sa === 'string') {
                            return this.formatSpecials([sa])[0] || sa;
                        }
                        // Try to resolve by common keys
                        const lookupKey = sa.key || sa.name || sa.subtype || (sa.type === 'special' && sa.name) || null;
                        const canonical = lookupKey ? this.formatSpecials([lookupKey])[0] : null;
                        if (canonical) {
                            // Keep prefs from instance (counts, dynamic props) but
                            // merge canonical data for missing fields.
                            const instanceProps = {};
                            ['count','uses','id','cooldown_position','romanCount','stackCount'].forEach(k => {
                                if (sa[k] !== undefined) instanceProps[k] = sa[k];
                            });
                            return Object.assign({}, canonical, instanceProps);
                        }
                        return sa;
                    });
                }
            });
        } catch (e) {
            console.warn('syncSpecials failed', e);
        }
    }
    
    
    this.data = null;
    this.intervalReference = null;
    this.combatOver = false;

    this.initialize = () => {
        this.data = null;
        this.intervalReference = null;
        this.combatOver = false;
        // Clear the module-level shield wall registry so walls from a previous
        // combat don't persist into the next one.
        activeShieldWalls.splice(0, activeShieldWalls.length);
    }

    // Helper: set occupiedCoords for a combatant, honoring large monsters that
    // should occupy the tile above them as well.
    this._setCombatantOccupiedCoords = (combatant) => {
        if(!combatant) return;
        try {
            combatant.occupiedCoords = [];
            if (combatant.coordinates) combatant.occupiedCoords.push(combatant.coordinates);
            // Lightweight large-monster detection: allow combatant.large flag or known subtype keys
            const LARGE_COMBAT_KEYS = ['dragon','beholder','ogre','sphinx','manticore','wyvern','wyvern_alt'];
            // Treat as large if explicitly marked, if type is known-large, or if
            // the combatant has a size/scale >= 2 (common sprite/scaling markers).
            const isLarge = (
                // explicit flag
                (typeof combatant.large === 'boolean' && combatant.large === true)
                // fallback for historically-known large types
                || (combatant.type && LARGE_COMBAT_KEYS.includes(combatant.type))
                // scaled or sized sprites
                || (typeof combatant.size === 'number' && combatant.size >= 2)
                || (typeof combatant.scale === 'number' && combatant.scale >= 2)
                // treat the main monster (the battle's primary monster) as "large" so
                // it virtually occupies the tile above it. Minions (isMinion===true)
                // will not be treated as large.
                || (combatant.isMonster === true && combatant.isMinion !== true)
            );
            if (isLarge) {
                const above = { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 };
                if (above.y >= 0) combatant.occupiedCoords.push(above);
            }
            // debug logs removed
        } catch (e) {
            // best-effort
        }
    }

    // Returns true if combatant is a large (2-tile-tall) creature.
    this._isLargeCombatant = (combatant) => {
        if (!combatant) return false;
        const LARGE_KEYS = ['dragon','beholder','ogre','sphinx','manticore','wyvern','wyvern_alt'];
        return (
            (typeof combatant.large === 'boolean' && combatant.large === true)
            || (combatant.type && LARGE_KEYS.includes(combatant.type))
            || (typeof combatant.size === 'number' && combatant.size >= 2)
            || (typeof combatant.scale === 'number' && combatant.scale >= 2)
            || (combatant.isMonster === true && combatant.isMinion !== true)
        );
    }

    /**
     * Checks whether `caller` can legally move to `coords`.
     * - The tile must be in-bounds and unoccupied (checking occupiedCoords too).
     * - If `caller` is a large combatant, the tile directly above `coords`
     *   must also be in-bounds and unoccupied (no one else occupies it).
     */
    this._canMoveToCoords = (caller, coords) => {
        if (!coords || typeof coords.x !== 'number' || typeof coords.y !== 'number') return false;
        const MAX_D = 7, MAX_L = 5;
        if (coords.x < 0 || coords.x > MAX_D || coords.y < 0 || coords.y > MAX_L) return false;
        // Check destination tile itself
        const destOccupied = Object.values(this.combatants).some(e => {
            if (!e || e.id === caller.id) return false;
            if (e.coordinates && e.coordinates.x === coords.x && e.coordinates.y === coords.y) return true;
            if (Array.isArray(e.occupiedCoords)) return e.occupiedCoords.some(c => c.x === coords.x && c.y === coords.y);
            return false;
        });
        if (destOccupied) return false;
        // For large combatants, also check the tile above the destination
        if (this._isLargeCombatant(caller)) {
            const above = { x: coords.x, y: coords.y - 1 };
            if (above.y < 0) return false; // can't fit — top of board
            const aboveOccupied = Object.values(this.combatants).some(e => {
                if (!e || e.id === caller.id) return false;
                if (e.coordinates && e.coordinates.x === above.x && e.coordinates.y === above.y) return true;
                if (Array.isArray(e.occupiedCoords)) return e.occupiedCoords.some(c => c.x === above.x && c.y === above.y);
                return false;
            });
            if (aboveOccupied) return false;
        }
        return true;
    }

    this.combatants = {};

    this.initializeOverlayManager = (combatants) => {
        combatants.forEach(c=>{
            this.overlayManager.addCombatant(c)
        })
    }
    this.connectOverlayManager = (instance) => {
        this.overlayManager = instance;
        this.monsterAI.connectOverlayManager(instance);
    }
    this.connectAnimationManager = (instance) => {
        this.monsterAI.connectAnimationManager(instance)
        this.fighterAI.connectAnimationManager(instance)
        this.monsterAI.initializeRoster();
        instance.connectCombatMethods(this.checkForCollision)
    }
    this.checkForCollision = (coordinates) => {
        let found;
        Object.values(this.combatants).forEach(e=>{
            if(JSON.stringify(e.coordinates) === JSON.stringify(coordinates) && !e.dead){
                found = e;
            }
        })
        return found;
    }

    this.establishMessageCallback = (cb) => {
        this.setMessage = cb;
    }
    this.setSelectedFighter = (selectedFighter) => {
        this.selectedFighter = selectedFighter;
        // NOTE: selecting a fighter should NOT automatically enable manual control.
        // Manual control is an explicit user action (e.g., pressing Enter). Keep
        // the selectedFighter reference here but do not toggle `manualControl`.
    }

    // Explicit API to enable/disable manual control for a single fighter.
    // When enabling manual control for a fighter we disable manual control for others.
    this.setManualControl = (fighterId, enabled) => {
        Object.values(this.combatants).forEach(f => {
            if (!f.isMonster && !f.isMinion) {
                f.manualControl = (enabled && f.id === fighterId);
            }
        });
    }
    this.establishUpdateMatrixCallback = (cb) => {
        this.updateIndicatorsMatrix = cb;
    }
    this.establishUpdateActorCallback = (cb) => {
        this.updateActor = cb
    }
    this.establishUpdateDataCallback = (cb) => {
        this.updateData = cb
    }
    this.establishBoardEventCallback = (cb) => {
        this.triggerBoardEvent = cb;
    }
    this.establishGameOverCallback = (cb) => {
        this.gameOver = cb
    }
    this.establishGreetingCompleteCallback = (cb) => {
        this.greetingComplete = cb
    }
    this.establishOnFighterMovedToDestinationCallback = (cb) => {
        this.fighterMovedToDestination = cb;
    }
    this.establishOnFighterDeathCallback = (cb) => {
        this.onFighterDeath = cb;
    }
    this.establishMorphPortraitCallback = (cb) => {
        this.morphPortrait = cb;
    }

    this.formatAttacks = (stringArray) => {
        return stringArray.map(e=>{
            return clone(this.attacksMatrix[e])
        })
    }
    this.formatSpecials = (stringArray) => {
        // Defensive formatter: accept either an array of keys (strings) or
        // an array of already-formatted special objects. Return an array of
        // special objects (cloned) and tolerate malformed inputs.
        if (!Array.isArray(stringArray)) return [];
        const mapped = stringArray.map(keyOrObj => {
            
            if (!keyOrObj) return undefined;
            if (typeof keyOrObj === 'string') {
                const def = this.specialsMatrix[keyOrObj];
                if (!def) {
                    console.warn('formatSpecials: unknown special key', keyOrObj);
                    return undefined;
                }
                return clone(def);
            }
            if (typeof keyOrObj === 'object') {
                // assume already formatted; return as-is (clone to be safe)
                return clone(keyOrObj);
            }
            return undefined;
        });
        // debug logs removed
        return mapped;
    }
    // Resolve a special by key from either a caller's `specials` array or an
    // arbitrary array of keys/objects. This centralizes the logic so callers
    // (AI modules, UI) can reliably obtain a canonical special object.
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
                    const expanded = this.formatSpecials([s]);
                    if (Array.isArray(expanded) && expanded[0]) return expanded[0];
                    return { name: key };
                }
            } else if (typeof s === 'object') {
                if (s.name && (s.name.toLowerCase() === key.toLowerCase() || s.name.toLowerCase() === normalized)) return s;
                if (s.key && s.key.toLowerCase() === normalized) return s;
            }
        }

        const expanded = this.formatSpecials([normalized]);
        if (Array.isArray(expanded) && expanded[0]) return expanded[0];
        return null;
    }
    this.processActionQueue = (caller) => {
        const action = caller.action_queue[0],
        instruction = action.instruction;
        switch(instruction.type){
            case 'move':
                caller.destinationCoordinates = instruction.destinationCoordinates
                this.goToDestination(caller);
            break;
            case 'attack':
                caller.targetId = instruction.targetId;
                caller.pendingAttack = instruction.selectedAction;
                caller.attack();
            break;
        default:
            console.log('no valid action type sepcificied');
        }
        caller.action_queue.shift();
    }
    this.getSelectedFighter = () => {
        return this.selectedFighter
    }
    this.initializeCombat = (data) => {
        const callbacks = {
            broadcastDataUpdate: this.broadcastDataUpdate,
            acquireTarget: this.acquireTarget,
            chooseAttackType: this.chooseAttackType,
            hitsTarget: this.hitsTarget,
            pickRandom: this.pickRandom,
            missesTarget: this.missesTarget,
            // combatOver: this.combatOver
            isCombatOver: this.combatOverCheck,
            getCombatant: this.getCombatant,
            formatAttacks: this.formatAttacks,
            formatSpecials: this.formatSpecials,
            resolveSpecial: this.resolveSpecial,
            initiateAttack: this.initiateAttack,
            checkOverlap: this.checkOverlap,
            handleOverlap: this.handleOverlap,
            goToDestination: this.goToDestination,
            processActionQueue: this.processActionQueue,
            processMove: this.processMove,
            targetInRange: this.targetInRange,
            getSelectedFighter: this.getSelectedFighter
            // combatPaused: this.combatPaused
        }
        // Store on `this` so runtime methods like spawnMinion (defined outside
        // initializeCombat's scope) can pass the same callbacks to createFighter.
        this._callbacks = callbacks;
        this.data = data;
        this.combatants = {};
        // const colors_withColorSquare = [' #b710d5',' #6495ed',' #73b746',' #f4d013']
        const colors = ['#b710d5', '#6495ed', '#73b746', '#f4d013']

        this.data.crew.forEach((e, index) => {
            // Do not add dead crew members to combat — they should not participate
            if (e && (e.dead === true || e.hp === 0)) {
                return;
            }
            e.coordinates = {x:0,y:0}
            e.coordinates.y = index;
            e.coordinates.x = 0;
            // e.coordinates = {x:0, y:index}
            e.manualMovesCurrent = 20;
            // e.manualMovesTotal = 25
            e.manualMovesTotal = 100
            e.color = colors[index]

            e.specialActions && e.specialActions.forEach(action => {
                action.cooldown_position = 100;
            })
            this.combatants[e.id] = createFighter(e, callbacks, this.FIGHT_INTERVAL);
            // mark occupiedCoords for multi-tile occupancy (large creature support)
            try { this._setCombatantOccupiedCoords(this.combatants[e.id]); } catch (err) {}
        })

        this.data.monster.coordinates = {x:0,y:0}
        this.data.monster.coordinates.y = 2;
        this.data.monster.coordinates.x = MAX_DEPTH;
        this.data.monster.isMonster = true;
        if(this.data.monster.specials){
            // console.log('monster specials: ', this.data.monster.specials);
        }
        
        
        // this.data.monster.coordinates = {x:MAX_DEPTH, y:2}
    let monster = createFighter(this.data.monster, callbacks, this.FIGHT_INTERVAL);
    monster.isMonster = true;
    this.combatants[monster.id] = monster;
    try { this._setCombatantOccupiedCoords(this.combatants[monster.id]); } catch (err) {}

        if(this.data.minions){
            const monsterLane = this.data.monster.coordinates.y; // e.g. 2
            // The main monster is always 2x scale — it virtually occupies the tile
            // directly above it (monsterLane - 1) as well. Exclude both tiles so
            // no minion is placed inside the monster's virtual space.
            const monsterVirtualLane = monsterLane - 1; // tile above (may be -1 if monster is at row 0, handled below)
            // All valid lanes 0..MAX_LANES-1, excluding the main monster's lane and its virtual tile above
            const availableLanes = [];
            for (let i = MAX_LANES - 1; i >= 0; i--) {
                if (i !== monsterLane && i !== monsterVirtualLane) availableLanes.push(i);
            }
            // availableLanes has MAX_LANES-1 slots. If there are more minions than that,
            // overflow minions are placed one column behind (MAX_DEPTH-1) to avoid overlap.
            this.data.minions.forEach((e, i)=>{
                e.isMinion = true;
                e.coordinates = {x:0,y:0}
                const laneIndex = i % availableLanes.length;
                const columnOffset = Math.floor(i / availableLanes.length); // 0 for first batch, 1 for overflow
                e.coordinates.y = availableLanes[laneIndex];
                e.coordinates.x = MAX_DEPTH - columnOffset;
                let m = createFighter(e, callbacks, this.FIGHT_INTERVAL)
                m.isMinion = true;
                this.combatants[m.id] = m;
                try { this._setCombatantOccupiedCoords(this.combatants[m.id]); } catch (err) {}
            })
        }

        // Start cooldowns for any formatted specials now that fighters are created
        // Ensure combatants' specials reflect the canonical matrix to avoid
        // using stale values persisted from earlier runs.
        try { this.syncSpecials(); } catch (e) { console.warn('syncSpecials error', e); }

        // Initialize specials to fully ready (cooldown_position = 100) so they
        // are available at the start of combat. The recharge interval is only
        // started AFTER a special is triggered — NOT here. (Previously this loop
        // called kickoffSpecialCooldown which immediately set cooldown_position = 0
        // and ticked up over 20s, making auto-trigger specials like berserker
        // unreachable on the very first processMove tick.)
        Object.values(this.combatants).forEach(combatant => {
            if (combatant.specials && Array.isArray(combatant.specials)) {
                combatant.specials.forEach(action => {
                    if (action && typeof action === 'object') {
                        action.cooldown_position = 100;
                        console.log(`[initializeCombat] ${combatant.type} special "${action.name}" → cooldown_position set to 100 (ready)`);
                    }
                });
            }
        });

        // Ensure all fighters use the correct interval
        this.updateAllFightIntervals(this.FIGHT_INTERVAL);

        this.initializeOverlayManager(Object.values(this.combatants))
        this.broadcastDataUpdate();

        // initialize behaviors
        Object.values(this.combatants).forEach(combatant=>{
            if(combatant.isMinion || combatant.isMonster){
                const ai = this.monsterAI.roster[combatant.type]
                if(ai && ai.initialize) ai.initialize(combatant);
            } else {
                const ai = this.fighterAI.roster[combatant.type]
                if(ai && ai.initialize) ai.initialize(combatant);
                // Ensure manualControl is initialized to false
                combatant.manualControl = false;
            }
        })

        this.beginGreeting()
    }
    this.targetInRange = (caller) => {
        const target = this.combatants[caller.targetId];
        if(!caller.pendingAttack) return false;
        let attackRange = RANGES[caller.pendingAttack.range]; // eslint-disable-line no-unused-vars
        if(!caller.pendingAttack || this.combatOver) return false
        if(!target){
            return
        }

        // For large targets (2-tile monsters), check range against every occupied tile —
        // not just target.coordinates. This lets fighters adjacent to the virtual top tile
        // also trigger attacks and have them register as hits.
        const targetTiles = (Array.isArray(target.occupiedCoords) && target.occupiedCoords.length > 0)
            ? target.occupiedCoords
            : [target.coordinates];

        // For large callers (e.g. the Mummy attacking a fighter standing on its virtual
        // top tile), also check range from every tile the caller occupies — not just its
        // foot tile. This is the symmetric fix to the target-side occupiedCoords check.
        const callerTiles = (Array.isArray(caller.occupiedCoords) && caller.occupiedCoords.length > 0)
            ? caller.occupiedCoords
            : [caller.coordinates];

        // Helper: test one caller tile vs one target tile for the pending attack range
        const tileInRange = (cc, tc) => {
            const dx = Math.abs(cc.x - tc.x);
            const dy = Math.abs(cc.y - tc.y);
            switch(caller.pendingAttack.range){
                case 'self':
                    return true;
                case 'close':
                    // Orthogonally adjacent (left/right OR up/down)
                    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
                case 'medium':
                    return dx > 1 && dx <= 3;
                case 'far':
                    // Far range: must share the same lane (y row)
                    return cc.y === tc.y;
                default:
                    return false;
            }
        };

        const res = callerTiles.some(cc => targetTiles.some(tc => tileInRange(cc, tc)));
        return !!res;
    }
    this.getLiveFighters = () => {
        return Object.values(this.combatants).filter(e=> !e.isMonster && !e.isMinion && !e.dead)
    }
    this.itemUsed = (item, userInput) => {
        console.log('item used, ', item);
        const user = this.combatants[userInput.id];
        switch(item.effect){
            case 'health gain': 
                console.log('inside health gain')
                const healthGain = Math.ceil(user.starting_hp * 0.01 * item.amount)
                user.hp += healthGain
                if(user.hp > user.starting_hp) user.hp = user.starting_hp
                // this needs to change to 'MAX HP, not starting
            break;
            default:
                console.log('CONSUMABLE USED THAT HAS NO .EFFECT');
        }
    }
    this.fighterManualAttack = () =>{
        if(!this.selectedFighter) return 
        const fighter = this.combatants[this.selectedFighter.id]
        fighter.manualAttack();
    }
    this.fighterSpecialAttack = (special) => {
        if(!this.selectedFighter) return 
        const target = this.combatants[this.selectedFighter.targetId];
        switch(this.selectedFighter.type){
            case 'soldier':
                switch(special.name){
                    case 'shield wall': {
                        const soldierAI = this.fighterAI && this.fighterAI.roster && this.fighterAI.roster['soldier'];
                        if (soldierAI) {
                            const fighter = this.selectedFighter;
                            const sw = fighter.specials && fighter.specials.find(s => s && s.name === 'shield wall');
                            const ready = sw && sw.cooldown_position === 100;
                            if (ready && !fighter.shieldWallActive) {
                                soldierAI.triggerShieldWall(fighter, this.combatants);
                            }
                        }
                        break;
                    }
                    case 'force back':
                        // stub — not yet implemented
                    break;
                    default:
                    break;
                }
            break;
            case 'wizard':
                switch(special.name){
                    case 'ice blast':
                        this.fighterAI.roster['wizard'].triggerIceBlast(this.selectedFighter, target)
                    break;
                    default:
                    break;
                }
            break;
            case 'monk': {
                const monkAI = this.fighterAI && this.fighterAI.roster && this.fighterAI.roster['monk'];
                if (monkAI) {
                    switch (special.name) {
                        case 'windmill': {
                            const fighter = this.combatants[this.selectedFighter.id];
                            const ws = fighter.specials && fighter.specials.find(s => s && s.name === 'windmill');
                            if (ws && ws.cooldown_position === 100 && !fighter.windmillActive) {
                                monkAI.triggerWindmill(fighter, this.combatants);
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
                break;
            }
            case 'barbarian': {
                const barbarianAI = this.fighterAI?.roster?.['barbarian'];
                if (barbarianAI && special) {
                    switch (special.name) {
                        case 'berserker': {
                            const fighter = this.combatants[this.selectedFighter?.id];
                            if (fighter && barbarianAI.shouldUseBerserker(fighter, this.combatants)) {
                                barbarianAI.triggerBerserker(fighter, this.combatants);
                            }
                            break;
                        }
                        default:
                            break;
                    }
                }
                break;
            }
            default:
                break;
        }
    }
    this.beginGreeting = () => {
        this.triggerMonsterGreeting().then(e=>{
            this.greetingComplete();
            this.kickOffTurnCycles();
            this.broadcastDataUpdate();
        })
    }
    this.kickOffTurnCycles = () => {
        let arr = Object.values(this.combatants)
        Object.values(this.combatants).forEach((combatant)=>{
            combatant.attacks.forEach((a)=>{
                a.cooldown_position = 100
            })
        })
        let c = 0; // eslint-disable-line no-unused-vars
        const int = setInterval(()=>{
            c++
            let combatant = arr.pop()
            // Skip AI turnCycle for fighters under manual control
            if (!(combatant.manualControl && !combatant.isMonster && !combatant.isMinion)) {
                combatant.turnCycle();
            }
            if(!arr.length) clearInterval(int)
        },100)
        // while (arr.length){
        //     let combatant = arr.pop()
        //     combatant.turnCycle();
        // }
    }
    this.setFighterDestination = (id, coordinates) => {
        const fighter = this.combatants[id];
        fighter.targetId = null;
        const action = {
            name: 'Move to',
            icon: 'basic_shield',
            instruction: {
                type: 'move',
                destinationCoordinates: coordinates
            } 
        }
        if(fighter.name === "Loryastes" && DEBUG_STEPS){
            console.log('pushing destination to queue: ', action);
        }
        fighter.action_queue.push(action)
    }
    this.goToDestination = (caller) => {
        // Defensive: if the caller is already dead (killed just before moving),
        // abort the move so dead units don't appear to reposition.
        if (!caller || caller.dead) {
            console.warn('goToDestination aborted for dead or missing caller:', caller && caller.id);
            return;
        }
    caller.coordinates.x = caller.destinationCoordinates.x;
    caller.coordinates.y = caller.destinationCoordinates.y;
    caller.coordinates = {x: caller.destinationCoordinates.x, y: caller.destinationCoordinates.y}
    try { this._setCombatantOccupiedCoords(caller); } catch (e) {}
        this.fighterMovedToDestination(caller.destinationCoordinates);
        caller.destinationCoordinates = null;
        caller.attacking = caller.attackingReverse = false;
        caller.destinationSickness = true;
        this.checkOverlap(caller)

        caller.tempo = 1;
        caller.turnCycle();
    }
    this.getCombatant = (id) => {
        return Object.values(this.combatants).find(e=> e.id === id)
    }
    this.queueAction = (callerId, targetId, selectedAction) => {
        const caller = this.getCombatant(callerId);
        const action = {
            name: 'Attack',
            icon: selectedAction.icon,
            instruction: {
                type: 'attack',
                selectedAction,
                targetId
            } 
        }
        caller.action_queue.push(action)
    }
    this.setTargetFromClick = (callerId, targetId) => {
        const caller = this.getCombatant(callerId)
        caller.targetId = targetId
    }
    this.broadcastDataUpdate = (caller = null) => {
        if(caller){
            this.checkOverlap(caller)
            this.updateCoordinates(caller)
        }
        this.updateData(clone(this.combatants))
    }
    this.genericChooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        const distanceToTarget = this.getDistanceToTarget(caller, target);
        let percentCooledDown = 0,
        chosenAttack;
        if(caller.isMonster){
        }
        if(caller.combatStyle){
        }
        if(available.length === 0){
            if(caller.combatStyle === 'prioritizeClosestEnemy'){
                caller.attacks.filter(e=>e.range === 'close').forEach(e=>{
                    if(e.cooldown_position > percentCooledDown){
                        percentCooledDown = e.cooldown_position;
                        chosenAttack = e;
                    }
                })
            } else {
                caller.attacks.filter(e=>e.range === 'medium' || e.range === 'far').forEach(e=>{
                    if(e.cooldown_position > percentCooledDown){
                        percentCooledDown = e.cooldown_position;
                        chosenAttack = e;
                    }
                })
                if(!chosenAttack) chosenAttack = caller.attacks[0]
            }
            attack = chosenAttack;
        } else {
            if((distanceToTarget === 1 || distanceToTarget === -1) && available.find(e=>e.range === 'close')){
                attack = available.find(e=>e.range === 'close');
                return attack;
            }
            if(available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).length > 0){
                let percentCooledDown = 0, distanceAttackRelevance = -100, mostRelevantAttack; // eslint-disable-line no-unused-vars
                available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).forEach((e)=>{
                    const distance = RANGES[e.range], range = RANGES[e.range];
                    const distanceGreaterThanAtkRange = distance > range; // eslint-disable-line no-unused-vars
                    const distanceLessThanAtkRange = distance < range; // eslint-disable-line no-unused-vars

                    let a = RANGES[e.range] - Math.abs(distanceToTarget)
                    // get relevance score, if distance is 8 and range is 5 that equals -3, which is preferrable
                    // to 8 and 3 which is -5. so the most positive score wins
                    if(a < 0  && a > distanceAttackRelevance)  distanceAttackRelevance = a;

                    // if distance is greatar than attack range, you want highest attack range
                    // if distance is less than attack range, you want highest attack range that is less than distance
                    // if distance is equal to attack range, choose this
                })
                
                available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).forEach((e)=>{

                    // THIS WHOLE THING IS REDUNDANT. ALL OF AFVAILABLE HAS 100

                    if(e.cooldown_position > percentCooledDown){
                        percentCooledDown = e.cooldown_position;
                        chosenAttack = e;
                    } else if(e.cooldown_position === percentCooledDown){
                        chosenAttack = e;
                    }
                })
                // ^ this chooses based on whoever has the most cooldown this.greetingComplete, 
                // but if multiple have the SVGMaskElement, then you want to choose the more appropriate range
                attack = chosenAttack;
            } else {
                attack = this.pickRandom(available);
            }
        }
        if(!attack){
            console.log('hmmm, wasnt able to find an appropriate attack');
        }
        return attack
    }
    this.chooseAttackType = (caller, target) => {
        if(this.fighterAI.roster[caller.type]){
            caller.pendingAttack = this.fighterAI.roster[caller.type].chooseAttackType(caller, target);
            return
        }
        if(this.monsterAI.roster[caller.type]){
            caller.pendingAttack = this.monsterAI.roster[caller.type].chooseAttackType(caller, target);
            return
        }
        caller.pendingAttack = this.genericChooseAttackType(caller, target);
    }
    this.isSpecialAttack = (attackType) => {
        const specials = ['meditate']
        return specials.includes(attackType)
    }
    this.handleSpecialAction = (caller) => {
        // console.log('pending', caller.pendingAttack);
        // switch(caller.pendingAttack)
    }
    this.moveFighterOneSpace = (direction) => {
        let pendingCoordinates, spaceOccupier;

        // debug logs removed

        if(!this.selectedFighter) {
            try { console.warn('moveFighterOneSpace: no selectedFighter'); } catch(e){}
            return;
        }

        const fighter = this.combatants[this.selectedFighter.id]

        if(!fighter) {
            try { console.warn('moveFighterOneSpace: selected fighter not found in combatants'); } catch(e){}
            return;
        }
        if(fighter.dead) {
            try { console.warn('moveFighterOneSpace: fighter is dead, move aborted'); } catch(e){}
            return;
        }
        if(fighter.locked) {
            try { console.warn('moveFighterOneSpace: fighter is locked, move aborted'); } catch(e){}
            return;
        }
        if(typeof fighter.manualMovesCurrent === 'number' && fighter.manualMovesCurrent < 1){
            try { console.warn('moveFighterOneSpace: no manual moves left (manualMovesCurrent=', fighter.manualMovesCurrent, ')'); } catch(e){}
            return
        }

        // compute pending coordinates, occupancy, and decision for each direction
        switch(direction){
            case 'up':
                if(fighter.coordinates.y === 0) {
                    console.warn('moveFighterOneSpace: already at top row (y=0)');
                    break;
                }
                pendingCoordinates = {x: fighter.coordinates.x , y: fighter.coordinates.y-1}
                try { spaceOccupier = this.coordinatesOccupied(pendingCoordinates) } catch(e){ spaceOccupier = null; console.warn('coordinatesOccupied threw', e) }
                if(spaceOccupier && !spaceOccupier.dead) {
                    console.warn('move blocked: space occupied by', spaceOccupier);
                    break;
                }
                fighter.coordinates.y--
                fighter.manualMovesCurrent--
                try { fighter.manualMoveCooldown && fighter.manualMoveCooldown(); } catch(e){}
                try { fighter.restartTurnCycle && fighter.restartTurnCycle(); } catch(e){}
            break;
            case 'down':
                if(fighter.coordinates.y >= MAX_LANES - 1) {
                    console.warn('moveFighterOneSpace: already at bottom row (y >= MAX_LANES-1)');
                    break;
                }
                pendingCoordinates = {x: fighter.coordinates.x , y: fighter.coordinates.y+1}
                try { spaceOccupier = this.coordinatesOccupied(pendingCoordinates) } catch(e){ spaceOccupier = null; console.warn('coordinatesOccupied threw', e) }
                if(spaceOccupier && !spaceOccupier.dead) {
                    console.warn('move blocked: space occupied by', spaceOccupier);
                    break;
                }
                fighter.coordinates.y++
                fighter.manualMovesCurrent--
                try { fighter.manualMoveCooldown && fighter.manualMoveCooldown(); } catch(e){}
                try { fighter.restartTurnCycle && fighter.restartTurnCycle(); } catch(e){}
            break;
            case 'right':
                if(fighter.coordinates.x === MAX_DEPTH) {
                    console.warn('moveFighterOneSpace: already at max depth (x == MAX_DEPTH)');
                    break;
                }
                pendingCoordinates = {x: fighter.coordinates.x+1 , y: fighter.coordinates.y}
                try { spaceOccupier = this.coordinatesOccupied(pendingCoordinates) } catch(e){ spaceOccupier = null; console.warn('coordinatesOccupied threw', e) }
                if(spaceOccupier && !spaceOccupier.dead) {
                    console.warn('move blocked: space occupied by', spaceOccupier);
                    break;
                }
                fighter.coordinates.x++
                fighter.manualMovesCurrent--
                try { fighter.manualMoveCooldown && fighter.manualMoveCooldown(); } catch(e){}
                try { fighter.restartTurnCycle && fighter.restartTurnCycle(); } catch(e){}
            break;
            case 'left':
                if(fighter.coordinates.x === 0) {
                    console.warn('moveFighterOneSpace: already at leftmost (x == 0)');
                    break;
                }
                pendingCoordinates = {x: fighter.coordinates.x-1 , y: fighter.coordinates.y}
                try { spaceOccupier = this.coordinatesOccupied(pendingCoordinates) } catch(e){ spaceOccupier = null; console.warn('coordinatesOccupied threw', e) }
                if(spaceOccupier && !spaceOccupier.dead) {
                    console.warn('move blocked: space occupied by', spaceOccupier);
                    break;
                }
                fighter.coordinates.x--
                fighter.manualMovesCurrent--
                try { fighter.manualMoveCooldown && fighter.manualMoveCooldown(); } catch(e){}
            break;
            default:
                console.warn('moveFighterOneSpace: unknown direction', direction);
            break;
        }

        try { this.broadcastDataUpdate && this.broadcastDataUpdate(); } catch(e){}
    }
    // this.fighterFacingRight = (caller) => {
    //     const f = this.combatants[caller.id]
    //     if(!f) return;
    //     const target = this.combatants[f.targetId]
    //     if(target){
    //         return f.coordinates.x <= target.coordinates.x
    //     }
    //     else return true
    // }
    // this.fighterFacingUp = (caller) => {
    //     const f = this.combatants[caller.id]
    //     if(!f) return;
    //     const target = this.combatants[f.targetId]
    //     if(target){
    //         return f.coordinates.y > target.coordinates.y && f.coordinates.x === target.coordinates.x
    //     }
    //     else return false
    // }
    // this.fighterFacingDown = (caller) => {
    //     const f = this.combatants[caller.id]
    //     if(!f) return;
    //     const target = this.combatants[f.targetId]
    //     if(target){
    //         return f.coordinates.y < target.coordinates.y && f.coordinates.x === target.coordinates.x
    //     }
    //     else return false
    // }
    // this.monsterFacingUp = (caller) => {
    //     if(!caller || !this.combatants[caller.id]) return;
    //     const monster = Object.values(this.combatants[caller.id])
    //     const target = this.combatants[monster.targetId]
    //     if(target){
    //         return monster.coordinates.y > target.coordinates.y && monster.coordinates.x === target.coordinates.x
    //     }
    //     else return false
    // }
    // this.monsterFacingDown = (caller) => {
    //     if(!caller || !this.combatants[caller.id]) return;
    //     const monster = Object.values(this.combatants[caller.id])
    //     const target = this.combatants[monster.targetId]
    //     if(target){
    //         return monster.coordinates.y < target.coordinates.y && monster.coordinates.x === target.coordinates.x
    //     }
    //     else return false
    // }
    this.manualRetarget = (caller) => {
        const targetOptions = Object.values(this.combatants).filter(e=>(e.isMinion || e.isMonster) && !e.dead)
        const currentTarget = targetOptions.find(e=>e.id===caller.targetId)
        this.acquireTargetManually(caller, currentTarget)

    }
    // Recalculate and persist facing for a combatant based on its current target (if any).
    // This should be called before attacks or moves to avoid stale facing values.
    this.recalculateFacing = (caller) => {
        if(!caller) return;
        const target = caller && caller.targetId ? this.combatants[caller.targetId] : null;
        if(!target) return;
        try {
            if (target.coordinates.x === caller.coordinates.x) {
                // Same column -> vertical facing
                caller.facing = target.coordinates.y > caller.coordinates.y ? 'down' : 'up';
            } else {
                caller.facing = target.coordinates.x > caller.coordinates.x ? 'right' : 'left';
            }
        } catch (e) {
            // be defensive
            // console.warn('recalculateFacing error', e);
        }
    }
    this.initiateAttack = (caller, manualAttack = false) => {
       // let manualTarget = false;
        const targetInRange = (caller, target) => { // eslint-disable-line no-unused-vars
            const pendingAttack = caller.pendingAttack; // eslint-disable-line no-unused-vars
            // Use only x-differential for range, as facing is now left/right only
            const rangeDiff = Math.abs(caller.coordinates.x - target.coordinates.x);
            if(manualAttack){
                // console.group('TARGET IN RANGE BLock');
                // console.log('caller', caller, 'target: ', target);
                // console.log('pendingAttack', pendingAttack);
                // console.log('pendingAttack range ', RANGES[caller.pendingAttack.range], 'vs rangeDiff: ', rangeDiff);

                // console.groupEnd()
            }
            return rangeDiff <= RANGES[caller.pendingAttack.range]
        }

        // Always recompute facing from target immediately before initiating an attack
        try { this.recalculateFacing(caller); } catch (e) {}

        if(this.fighterAI.roster[caller.type]){
            this.fighterAI.roster[caller.type].initiateAttack(caller, manualAttack, this.combatants);
            return
        }
        
        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].initiateAttack(caller, this.combatants);
            return
        } else {
            this.monsterAI.roster['skeleton'].initiateAttack(caller, this.combatants);
            return
        }

    // this should only happern for minions with no ai

    // return (dead code below kept for reference)

        // let target = this.combatants[caller.targetId];
        // if(!target || !targetInRange(caller, target)){
        //     if(!manualAttack){
        //         console.log('somehow this fighter initiated an attack without a target/range and NOT manually! investigate');
        //         debugger
        //     }
        //     const attack = caller.pendingAttack,
        //     range = RANGES[attack.range]
        //     if(range === 1){
        //         let coordinatesAttacked = {x: this.fighterFacingRight(caller) ? caller.coordinates.x+1 : caller.coordinates.x-1, y: caller.coordinates.y};
        //         let occupier = this.coordinatesOccupied(coordinatesAttacked);
        //         if(occupier && (occupier.isMinion || occupier.isMonster)){
        //             target = occupier;
        //             // manualTarget = true;
        //         } else {
        //             caller.active = true;
        //             caller.attacking = true;
        //             this.broadcastDataUpdate();
        //             caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
        //             this.kickoffAttackCooldown(caller)
        //             return
        //         }
        //     }
        // }
    // const targetSpeed = (target.stats && (typeof target.stats.speed === 'number')) ? target.stats.speed : (target.stats && target.stats.dex) || 1;
    // let defenseFactor = (targetSpeed * 4) + (target.stats.def || 0);
    // if (defenseFactor > 99) defenseFactor = 90;
    //     let attackFactor = Math.floor(Math.sqrt(caller.atk));
    //     const results = [], diceRoll = function(){ return Math.random() * 100 };
    //     for(let i = 0; i < attackFactor; i++){ results.push(diceRoll()) }
    //     const connects = results.some(e=>e>defenseFactor);
    //     if(!caller.pendingAttack){ return }
    //     caller.active = true;
    //     caller.attacking = true;
    //     this.broadcastDataUpdate();
    //     caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
    //     this.kickoffAttackCooldown(caller)
    //     if(connects){
    //         if(manualAttack){ this.hitsTarget(caller, target) } else { this.hitsTarget(caller) }
    //     } else {
    //         if(manualAttack){ this.missesTarget(caller, target) } else { this.missesTarget(caller) }
    //     }
    }
    this.kickoffAttackCooldown = (caller) => {
        const atk = caller.pendingAttack;
        if(!atk) return
    // Use speed for cooldown calculations (monsters use speed, fighters may have dex-derived speed)
    const callerSpeed = (caller.stats && (typeof caller.stats.speed === 'number') && caller.stats.speed > 0) ? caller.stats.speed : ((caller.stats && (typeof caller.stats.dex === 'number') && caller.stats.dex > 0) ? caller.stats.dex : 1);
    // attackSpeedMult allows per-fighter attack frequency tuning without touching dex/movement
    const attackSpeedMult = (typeof caller.stats.attackSpeedMult === 'number' && caller.stats.attackSpeedMult > 0) ? caller.stats.attackSpeedMult : 1;
    const generalCooldown = (10 / callerSpeed) * 1000 / attackSpeedMult;
        atk['cooldown_position'] = 0;
        let totalTime = atk.cooldown * 1000;
        let scopeVar = 0, that = this;
        caller.onGeneralAttackCooldown = true;
        const generalAttackCooldown = setTimeout(()=>{ // eslint-disable-line no-unused-vars
            caller.onGeneralAttackCooldown = false;
        }, generalCooldown)
        const intervalRef = setInterval(()=>{
            let ratio = 0;
            if(!that.combatPaused){
                scopeVar += 100;
                ratio = Math.ceil((scopeVar / totalTime) * 100);
                atk['cooldown_position'] = ratio;
            }
            if(ratio >= 100){
                scopeVar = 0;
                // console.log(caller.type, 'done with cooldown for ', atk);
                clearInterval(intervalRef)
            }
        },100)
    }
    this.kickoffSpecialCooldown = (specialAction) => {
        if(!specialAction) return

        specialAction['cooldown_position'] = 0;
        // cooldown is expressed in eras. One era = TICKS_PER_ERA ticks of FIGHT_INTERVAL ms each.
        // Reading this.FIGHT_INTERVAL live inside the interval means the cooldown rate
        // automatically adjusts when the player changes game speed mid-combat.
        const totalTicks = specialAction.cooldown * TICKS_PER_ERA;
        let ticksElapsed = 0, that = this;
        const intervalRef = setInterval(()=>{
            let ratio = 0;
            if(!that.combatPaused){
                ticksElapsed++;
                ratio = Math.ceil((ticksElapsed / totalTicks) * 100);
                specialAction['cooldown_position'] = ratio;
            }
            if(ratio >= 100){
                ticksElapsed = 0;
                clearInterval(intervalRef)
            }
        }, this.FIGHT_INTERVAL)
    }
    this.getLaneDifferenceToTarget = (caller, target) => {
        if(!target) return 0;
        let d = target.coordinates.y - caller.coordinates.y
        return d
    }
    this.getDistanceToTarget = (caller, target) => {
        if(!target) return 0;
        let d = target.coordinates.x - caller.coordinates.x
        return d
    }
    this.getDistanceToTargetWidthString = (caller) => {
        if(!caller || !this.combatants[caller.targetId]) return '0px'
        let distanceToTarget = Math.abs(caller.coordinates.x - this.combatants[caller.targetId].coordinates.x) - 1
        // ^ needs to be the old way
        return ((distanceToTarget * 100) + 100)
    }
    this.getRangeWidthVal = (caller) => {
        if(caller.pendingAttack){
            return RANGES[caller.pendingAttack.range]
        }
        return 0
    }
    this.getMonsterActionBarLeftValue = (caller) => {
        let target = this.getCombatant(caller?.targetId)

        if(!target || !caller.pendingAttack) return `calc(100px * ${this.getCombatant(caller?.targetId)?.coordinates.x} + 50px)`

        let unitDistanceToTarget;
        if(target){
            unitDistanceToTarget = caller.coordinates.x - target.coordinates.x;
        }
        if(target && target.coordinates.x > caller?.coordinates.x){
            // face right
            unitDistanceToTarget = target.coordinates.x - caller.coordinates.x;
            if(unitDistanceToTarget > RANGES[caller.pendingAttack.range]){
                let unitDiff = unitDistanceToTarget - RANGES[caller.pendingAttack.range]
                return `calc(100px * ${caller?.coordinates.x + unitDiff} + 50px)`
            }
            return `calc(100px * ${caller?.coordinates.x} + 50px)`
        }
        if(target && unitDistanceToTarget > RANGES[caller.pendingAttack.range]){
            // if width of range ids less than distance to target, add difference to left value
            let unitDiff = unitDistanceToTarget - RANGES[caller.pendingAttack.range]
            return `calc(100px * ${this.getCombatant(caller?.targetId)?.coordinates.x + unitDiff} + 50px)`
        }
        return `calc(100px * ${this.getCombatant(caller?.targetId)?.coordinates.x} + 50px)`
    }
    this.getMonsterRangeBarLeftValue = (caller) => {
        let target = this.getCombatant(caller?.targetId)
        if(target && target.coordinates.x > caller?.coordinates.x){
            return `${(caller?.coordinates.x * 100)}px`
        }
        return `${(caller?.coordinates.x * 100) - RANGES[caller.pendingAttack.range]*100}px`
    }
 
    this.getFighterActionBarLeftValue = (caller) => {
        const trueFighterRef = this.combatants[caller.id];
        let target = this.getCombatant(trueFighterRef?.targetId)
        if(target && target.coordinates.x > trueFighterRef?.coordinates.x){
            return `calc(100px * ${trueFighterRef?.coordinates.x} + 50px)`
        }
        return `calc(100px * ${this.getCombatant(trueFighterRef?.targetId)?.coordinates.x} + 50px)`
    }
    this.updateCoordinates = (caller) => {
        caller.coordinates = {x: caller.coordinates.x, y: caller.coordinates.y}
        try { this._setCombatantOccupiedCoords(caller); } catch (e) {}
    }
    this.acquireTarget = (caller, targetToAvoid = null) => {
        if(this.combatPaused || caller.dead) return;
        if(this.fighterAI.roster[caller.type]){
            const prevTargetId = caller.targetId;
            this.fighterAI.roster[caller.type].acquireTarget(caller, this.combatants, targetToAvoid)
            if(caller.targetId && caller.targetId !== prevTargetId){
                // Set facing based on target position ONLY if targetId changed
                const target = this.combatants[caller.targetId];
                if (target && !caller.facingLocked) {
                    // If not locked, update facing as usual
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: caller.color
                    }
                }
                if (this.overlayManager && this.overlayManager.overlays && this.overlayManager.overlays[caller.targetId]) {
                    this.overlayManager.addAnimation(animation)
                }
            }
            // If no new target, do not change facing (persist last direction)
            return
        }
        
        if(this.monsterAI.roster[caller.type]){
            const prevTargetId = caller.targetId;
            this.monsterAI.roster[caller.type].acquireTarget(caller, this.combatants);
            if(caller.targetId && caller.targetId !== prevTargetId){
                // Set facing based on target position ONLY if targetId changed
                const target = this.combatants[caller.targetId];
                if (target && !caller.facingLocked) {
                    // If not locked, update facing as usual
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: caller.isMonster ? 'red' : 'lightred'
                    }
                }
                if (this.overlayManager && this.overlayManager.overlays && this.overlayManager.overlays[caller.targetId]) {
                    this.overlayManager.addAnimation(animation)
                }
            }
            // If no new target, do not change facing (persist last direction)
            return
        }
        const liveMonsters = Object.values(this.combatants).filter(e=> ((e.isMonster || e.isMinion )  && !e.dead)),
              liveFighters = Object.values(this.combatants).filter(e=> ((!e.isMonster && !e.isMinion) && !e.dead));
        let target;
        if(caller.isMonster || caller.isMinion){
            if(caller.targetId){
            caller.pendingAttack = this.chooseAttackType(caller, target);
            return
        }
            let sortedTargets = targetToAvoid && liveFighters.length > 1 ? liveFighters.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>b.coordinates.x - a.coordinates.x) : liveFighters.sort((a,b)=>b.coordinates.x - a.coordinates.x);

            target = sortedTargets.length > 1 ? sortedTargets[0] : sortedTargets[0];
            // teamates = liveMonsters.filter(e=> e.id !== caller.id);
        } else {
            target = targetToAvoid ? this.pickRandom(liveMonsters.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>b.coordinates.x - a.coordinates.x)) : this.pickRandom(liveMonsters) 
        }
        if(!target){
            this.combatOver = true;
            return
        }
        this.clearTargetListById(caller.id)
        target.targettedBy.push(caller.id)
        const attack = this.chooseAttackType(caller, target);
        caller.targetId = target.id
            if(!attack){
            console.log('whoa! about to assign an undefined attackj to pending');
            console.log('details: ', 'caller:',caller,'target', target);
        }
        caller.pendingAttack = attack;
        if(caller.targetId){
            const animation = {
                type: 'targetted',
                id: caller.targetId,
                data:{
                    color: 'light-red'
                }
            }
            this.overlayManager.addAnimation(animation)
        }
    }
    this.acquireTargetManually = (caller) => {
        console.log('manual');
        let currentTarget = this.combatants[caller.targetId]
        const liveEnemies = Object.values(this.combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const targetsSortedVertically = liveEnemies.sort((a,b)=>a.coordinates.y - b.coordinates.y);
        let currentTargetIndex = targetsSortedVertically.indexOf(currentTarget)
        if(targetsSortedVertically[currentTargetIndex+1]){
            caller.targetId = targetsSortedVertically[currentTargetIndex+1].id;
                // If no target, do not change facing (persist last direction)
            caller.targetId = targetsSortedVertically[0].id
        }
        if(caller.targetId){
            // Set facing based on target position
            const target = this.combatants[caller.targetId];
            if (target) {
                caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
            }
            console.log('MANUAL in here, target', caller, caller.targetId);
            const animation = {
                type: 'targetted',
                id: caller.targetId,
                data:{
                    color: caller.color
                }
            }
            this.overlayManager.addAnimation(animation)
        }

    }
    this.processMove = (caller) => {
        if(caller.dead) return;
        if(caller.stunned) return; // stunned: skip all movement and AI logic this tick
    // Recompute facing before attempting movement so facing isn't stale as units shift around
    try { this.recalculateFacing(caller); } catch (e) {}
        if(this.fighterAI.roster[caller.type]){
            this.fighterAI.roster[caller.type].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            try { this._setCombatantOccupiedCoords(caller); } catch (e) {}
            return
        }
        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            try { this._setCombatantOccupiedCoords(caller); } catch (e) {}
            return
        }

        const liveCombatants = Object.values(this.combatants).filter(e=> (!e.dead && e.id !== caller.id));

        const target = this.combatants[caller.targetId]
        const distanceToTarget = this.getDistanceToTarget(caller, target),
        laneDiff = this.getLaneDifferenceToTarget(caller, target)

        // If this is a monster/minion already adjacent to its target with a close-range
        // attack selected, skip repositioning entirely — no dancing in place.
        if((caller.isMonster || caller.isMinion) && target && caller.pendingAttack){
            const pendingRange = caller.pendingAttack.range;
            if(pendingRange === 'close' || !pendingRange){
                const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
                const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
                if((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) return;
            }
        }

        
        
        let newPosition, newDepth;
        const targetInRange = this.targetInRange(caller)
        
        if(!targetInRange && caller.pendingAttack){
            let moveBackLots = caller.pendingAttack.range === 'far' && distanceToTarget < 2
            newDepth = caller.isMonster || caller.isMinion ? 
            (distanceToTarget > -1 ? caller.coordinates.x+1 : caller.coordinates.x-1) : 
            (moveBackLots ? caller.coordinates.x-3 :
            (distanceToTarget < 1 ? caller.coordinates.x-1 : caller.coordinates.x+1))
        } else {
            newDepth = caller.coordinates.x
        }
        const coordinatesOccupiedBy = (coordinates) => {
            return Object.values(this.combatants).find(e => {
                if (e.coordinates.x === coordinates.x && e.coordinates.y === coordinates.y) return true;
                if (Array.isArray(e.occupiedCoords) && e.occupiedCoords.some(c => c.x === coordinates.x && c.y === coordinates.y)) return true;
                return false;
            });
        }

        // RE-POSITION
        if(laneDiff < 0 ){
            newPosition = caller.coordinates.y - 1
        } else if(laneDiff > 0){
            newPosition = caller.coordinates.y + 1
        } else {
            newPosition = caller.coordinates.y
        }
        const newCoordinates = {x: newDepth, y: newPosition}
        // If the intended tile is occupied, attempt a diagonal forward move toward
        // the target. If that is blocked, try the other diagonal, then attempt
        // to route around by moving down or up at the caller's current depth.
        if(coordinatesOccupiedBy(newCoordinates)){
            const target = this.combatants[caller.targetId];
            const verticalDir = target ? Math.sign(target.coordinates.y - caller.coordinates.y) : 0;
            // Prefer a diagonal that moves toward the target vertically.
            const diagY = (typeof newPosition === 'number' ? newPosition : caller.coordinates.y) + (verticalDir !== 0 ? verticalDir : 1);
            const diag = { x: newDepth, y: diagY };
            const oppositeDiagY = (typeof newPosition === 'number' ? newPosition : caller.coordinates.y) - (verticalDir !== 0 ? verticalDir : 1);
            const oppDiag = { x: newDepth, y: oppositeDiagY };

            const inBounds = (c) => {
                if(c.x === undefined || c.y === undefined) return false;
                if(c.x < 0 || c.y < 0) return false;
                if(c.x > MAX_DEPTH) return false;
                if(c.y > MAX_LANES) return false;
                return true;
            }

            if(inBounds(diag) && !coordinatesOccupiedBy(diag)){
                newPosition = diag.y;
                newDepth = diag.x;
            } else if(inBounds(oppDiag) && !coordinatesOccupiedBy(oppDiag)){
                newPosition = oppDiag.y;
                newDepth = oppDiag.x;
            } else {
                // Try to move vertically in-place to route around (down then up)
                const tryDown = { x: caller.coordinates.x, y: caller.coordinates.y + 1 };
                const tryUp = { x: caller.coordinates.x, y: caller.coordinates.y - 1 };
                if(inBounds(tryDown) && !coordinatesOccupiedBy(tryDown)){
                    newDepth = tryDown.x;
                    newPosition = tryDown.y;
                } else if(inBounds(tryUp) && !coordinatesOccupiedBy(tryUp)){
                    newDepth = tryUp.x;
                    newPosition = tryUp.y;
                } else {
                    // Couldn't find an alternate route; abort movement this tick.
                    return
                }
            }
        }

        if(liveCombatants.some(e=>e.coordinates.y === newPosition && e.coordinates.x === newDepth)){
            let targetPosition = {x: newDepth, y: newPosition};
            let downspace = targetPosition.y + 1;
            let upspace = targetPosition.y - 1
            let upSpaceOccupied = liveCombatants.some(e=>e.coordinates.x === targetPosition.x && e.coordinates.y === targetPosition.y - 1);
            let downSpaceOccupied = liveCombatants.some(e=>e.coordinates.x === targetPosition.x && e.coordinates.y === targetPosition.y + 1);
            let upPref = this.pickRandom([false, true])
            if(upPref){
                if(!upSpaceOccupied && upspace >= 0){
                    newPosition = targetPosition.y-1;
                } else if(!downSpaceOccupied && downspace <= MAX_LANES-1){
                    newPosition = targetPosition.y+1;
                } else {
                    newPosition = caller.coordinates.y;
                    newDepth = caller.coordinates.x;
                }
            } else {
                if(!downSpaceOccupied && downspace <= MAX_LANES-1){
                    newPosition = targetPosition.y+1;
                } else if(!upSpaceOccupied && upspace >= 0){
                    newPosition = targetPosition.y-1;
                } else {
                    newPosition = caller.coordinates.y;
                    newDepth = caller.coordinates.x;
                }
            }
        }

        if(newPosition < 0) newPosition = 0
        if(newPosition > MAX_LANES) newPosition = MAX_LANES;
        if(newDepth < 0) newDepth = 0
        if(newDepth > MAX_DEPTH) newDepth = MAX_DEPTH;

        // For large combatants (main monster, 2-tile-tall creatures), make sure
        // the tile above the destination is also free before committing the move.
        if (this._isLargeCombatant && this._isLargeCombatant(caller)) {
            const destAbove = { x: newDepth, y: newPosition - 1 };
            if (destAbove.y < 0 || coordinatesOccupiedBy(destAbove)) {
                // Can't fit — abort this tick's movement
                return;
            }
        }

        //set new values
        if(newDepth !== undefined) caller.coordinates.x = newDepth;
        if(newPosition !== undefined) caller.coordinates.y = newPosition;

        caller.coordinates = {x: newDepth, y: newPosition}

        if(caller.coordinates.y === undefined){
            console.log('position undefined');
            debugger
        }
        
        this.updateCoordinates(caller);
        liveCombatants.forEach(e=>{
            if(caller.coordinates.y === e.coordinates.y && caller.coordinates.x === e.coordinates.x){
                e.hasOverlap = true;
                this.handleOverlap(e)
            }
        })
    }
    this.checkOverlap = (combatant) => {
        let overlapper;
        // setTimeout(()=>{
            // console.log('x: ', combatant.coordinates.x, 'vs max: ', MAX_DEPTH);
            if(combatant.coordinates.x > MAX_DEPTH) combatant.coordinates.x = MAX_DEPTH;
            if(combatant.coordinates.x < 0)combatant.coordinates.x = 0;
        // },800)
        if (combatant.dead) {
            // Defensive: checkOverlap should never be invoked for dead combatants.
            // Instead of breaking in the debugger, clear overlap and return.
            console.warn('checkOverlap called for dead combatant:', combatant && combatant.id);
            combatant.hasOverlap = false;
            return;
        }
        const liveCombatants = Object.values(this.combatants).filter(e=> (e.id !== combatant.id && !e.dead));
        if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)){
            // console.log('LIVE COMB', liveCombatants, 'combatant.coordinates.x', combatant, liveCombatants.filter(e=>(e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)));
            combatant.hasOverlap = true
        }
        if(combatant.hasOverlap){
            overlapper = liveCombatants.find(e=>(e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y))
            if(overlapper){
                console.log(`${combatant.name} ${combatant.id} HAS OVERLAP with`, overlapper, overlapper.id );
                // if(combatant.id === 816) debugger
                this.handleOverlap(combatant);
            } else {
                console.log('uhhh, how?');
            }
        }
    }
    this.handleOverlap = (combatant) => {
        // return
        const liveCombatants = Object.values(this.combatants).filter(e=> (e.id !== combatant.id && !e.dead));
        let depthAvailable = false;
        if(combatant.isMonster || combatant.isMinion){
            // debugger
            if(this.monsterAI.roster[combatant.type] && this.monsterAI.roster[combatant.type].handleOverlap){
                this.monsterAI.roster[combatant.type].handleOverlap(combatant, this.combatants)
                // handleOverlap
                combatant.hasOverlap = false;
                return
            }
            while(!depthAvailable){
                if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)){
                    depthAvailable = false;
                    if(combatant.coordinates.x !== MAX_DEPTH){
                        combatant.coordinates.x = combatant.coordinates.x + 1
                        combatant.coordinates.x ++
                    } else {
                        const goUp = this.pickRandom([true, false])
                        if(goUp && combatant.coordinates.y !== 0){
                            if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y - 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.coordinates.y - 1
                                combatant.coordinates.y--
                            }
                        } else if(!goUp && combatant.coordinates.y !== MAX_LANES-1){
                            if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y + 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.coordinates.y + 1
                                combatant.coordinates.y++
                            }
                        } else {
                            depthAvailable = true;
                        }
                    }
                } else {
                    depthAvailable = true;
                }
            }
        } else {
            while(!depthAvailable){
                if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)){
                    let blockerCombatant = liveCombatants.find(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)
                    let blockerDistanceToTarget = this.getDistanceToTarget(blockerCombatant, this.combatants[blockerCombatant.targetId])
                    depthAvailable = false;
                    switch(combatant.type){
                        case 'rogue':
                            if(blockerCombatant.pendingAttack.range === 'close' && blockerDistanceToTarget > 2){
                                combatant.coordinates.x = 2;
                                blockerCombatant.coordinates.x++
                            }
                        break;
                        default:
                            break;
                    }
                    if(combatant.coordinates.x > 0){
                        combatant.coordinates.x--
                    } else {
                        const goUp = this.pickRandom([true, false])
                        if(goUp && combatant.coordinates.y !== 0){
                            if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y - 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.coordinates.y - 1
                                combatant.coordinates.y--
                            }
                        } else if(!goUp && combatant.coordinates.y !== MAX_LANES-1){
                            if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y + 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.x = combatant.coordinates.x + 1
                                combatant.coordinates.y++
                            }
                        } else {
                            depthAvailable = true;
                        }
                    }
                } else {
                    depthAvailable = true;
                }
            }
        }
        combatant.hasOverlap = false;
        this.broadcastDataUpdate();
    }
    this.coordinatesOccupied = (coordinates) => {
        try {
            const combatants = Object.values(this.combatants || {});
            for (let i = 0; i < combatants.length; i++) {
                const e = combatants[i];
                try {
                    if (!e) continue;
                    if (e.coordinates && e.coordinates.x === coordinates.x && e.coordinates.y === coordinates.y) {
                        return e;
                    }
                    if (Array.isArray(e.occupiedCoords)) {
                        for (let j = 0; j < e.occupiedCoords.length; j++) {
                            const c = e.occupiedCoords[j];
                            if (c && c.x === coordinates.x && c.y === coordinates.y) {
                                return e;
                            }
                        }
                    }
                } catch (err) {
                    // continue to next combatant
                }
            }
        } catch (err) {
            console.warn('coordinatesOccupied: unexpected error', err);
        }
        return null;
    }
    this.clearTargetListById = (targetId) => {
        const combatants = Object.values(this.combatants)
        combatants.forEach(e=>{
            e.targettedBy = e.targettedBy.filter(id=> id !== targetId)
            if(e.targetId === targetId){
                e.targetId = null;
            }
        })
    }
    this.getSurroundings = (coords) => {
        const N = {x: coords.x, y: coords.y-1},
                  S = {x: coords.x, y: coords.y+1},
                  W = {x: coords.x-1, y: coords.y},
                  E = {x: coords.x+1, y: coords.y},
                  NW = {x: coords.x-1, y: coords.y-1},
                  NE = {x: coords.x+1, y: coords.y-1},
                  SW = {x: coords.x-1, y: coords.y+1},
                  SE = {x: coords.x+1, y: coords.y+1}
        return {N,S,E,W,NW,NE,SW,SE}
    }
    this.someoneIsInCoords = (coords)=>{
        return Object.values(this.combatants).some(e=>{
            try {
                if(!e) return false;
                if (e.coordinates && JSON.stringify(e.coordinates) === JSON.stringify(coords)) return true;
                if (Array.isArray(e.occupiedCoords)) return e.occupiedCoords.some(c => JSON.stringify(c) === JSON.stringify(coords));
                return false;
            } catch (err) { return false; }
        })
    }
    this.someoneElseIsInCoords = (caller, coords)=>{
        // console.log('In someoneelse... Object.values(this.combatants).filter(c=>c.id!==caller.id)', Object.values(this.combatants).filter(c=>c.id!==caller.id), 'JSON.stringify(coords)', JSON.stringify(coords));
        return Object.values(this.combatants).filter(c=>c.id!==caller.id).some(e=>JSON.stringify(e.coordinates) === JSON.stringify(coords))
    }
    this.hitsCombatant = (caller, combatantHit, supplementalData = null, options = {}) => {
        // Guard: never apply damage to an already-dead combatant (race condition safety)
        if (!combatantHit || combatantHit.dead) return;
        // if(caller.type === 'wizard'){
        //     console.log('WIZARD HITS');
        // }
        // if(supplementalData){
        //     console.log('supplementalData: ', supplementalData);
        // }


        // Unified damage application used by many attack paths.
        // options.forceCritical: boolean to force a critical hit
        // supplementalData.increasedCritChance: legacy flag that increases crit chance
        let r = Math.random();
        let criticalHit;
        if (typeof options.forceCritical === 'boolean') {
            criticalHit = !!options.forceCritical;
        } else {
            const threshold = (supplementalData && supplementalData.increasedCritChance) ? CRIT_THRESHOLD_INCREASED : CRIT_THRESHOLD_DEFAULT;
            criticalHit = r * 100 > threshold;
        }

        // Determine base damage. If supplementalData (special) provides a damage
        // field, prefer that as the baseline. Otherwise compute damage using
        // the caller's atk and any equipped weapon percent (weapon.damage is
        // now expressed in percentage-points, e.g. 30 === +30% of atk).
        const isSpecial = supplementalData && typeof supplementalData === 'object' && (typeof supplementalData.damage === 'number' || typeof supplementalData.base_damage === 'number' || supplementalData.energy_cost || supplementalData.effect);
        let baseDamage;
        if (isSpecial) {
            baseDamage = (typeof supplementalData.damage === 'number') ? supplementalData.damage : ((typeof supplementalData.base_damage === 'number') ? supplementalData.base_damage : caller.atk);
        } else {
            // find equipped weapon (right/left) or by equippedBy marker
            let weaponPercent = 0;
            try {
                const inv = caller.inventory || [];
                const weapon = inv.find(i => i && i.type === 'weapon' && (i.equippedSlot === 'right' || i.equippedSlot === 'left' || i.equippedBy === caller.id));
                if (weapon && typeof weapon.damage === 'number') weaponPercent = weapon.damage;
            } catch (e) {
                // defensive: ignore inventory errors and treat as no weapon
                weaponPercent = 0;
            }
            baseDamage = caller.atk + Math.floor((caller.atk * (weaponPercent || 0)) / 100);
        }

        let damage = criticalHit ? baseDamage * CRITICAL_DAMAGE_MULTIPLIER : baseDamage;
        // Safety net: if damage is NaN (e.g. caller.atk is undefined), default to 1
        // so the hit still registers and the hp <= 0 death check can fire correctly.
        if (!Number.isFinite(damage) || damage < 0) damage = 1;

        // Determine attack type for weakness checks: prefer pendingAttack.type, but
        // if this is a special use supplementalData.type when available.
        const attackType = (caller.pendingAttack && caller.pendingAttack.type) || (supplementalData && supplementalData.type) || null;

        if (!caller.pendingAttack && !isSpecial) {
            console.log('HOW CAN YOU HIT WITH NO PENDING ATTACK??>', caller);
        } else {
            if (attackType && Array.isArray(combatantHit.weaknesses) && combatantHit.weaknesses.includes(attackType)) {
                damage += Math.floor(damage / 2);
            }
        }
        // Apply equipped armor percent reduction (if any) to the damage
        let armorPercentTarget = 0;
        try {
            const inv = combatantHit.inventory || [];
            armorPercentTarget = inv.filter(i => i && i.type === 'armor' && (i.equippedSlot || i.equippedBy === combatantHit.id)).reduce((acc, a) => acc + (typeof a.armor === 'number' ? a.armor : 0), 0);
        } catch (e) { armorPercentTarget = 0 }
        if (armorPercentTarget > 0) {
            const reduction = Math.floor(damage * (armorPercentTarget / 100));
            damage = Math.max(0, damage - reduction);
            console.log('armor reduction applied, ', armorPercentTarget, '% reduced damage by', reduction, 'to', damage);
        }

        // Save readout and apply damage
        caller.readout.result = `${caller.name} hits ${combatantHit.name} for ${damage} damage`;
        combatantHit.hp -= damage;
        combatantHit.damageIndicators.push(damage);
        caller.energy += caller.stats.fort * 1 + (1 / 2 * caller.level);
        if (caller.energy > 100) caller.energy = 100;

        // compute sourceDirection for animation purposes
        const sourceDirection = caller.coordinates.x < combatantHit.coordinates.x ? 'left' : (caller.coordinates.x > combatantHit.coordinates.x ? 'right' : (caller.coordinates.y > combatantHit.coordinates.y ? 'bottom' : 'top'));

        // set unified wounded objectF
        combatantHit.wounded = {
            severity: criticalHit ? 'severe' : 'minor',
            damage,
            sourceDirection
        };

        // trigger rocked animation on severe (critical) hits
        if (criticalHit && typeof combatantHit.rockAnimationOn === 'function') {
            try {
                combatantHit.rockAnimationOn();
            } catch (e) {}
            setTimeout(() => {
                if (typeof combatantHit.rockAnimationOff === 'function') combatantHit.rockAnimationOff();
            }, ROCK_DURATION);
        }

        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }

        // NEED TO HANDLE CRIT FROM TOP AND BOTTOM

        if(caller.coordinates.x < combatantHit.coordinates.x){
            combatantHit.wounded.sourceDirection = 'left';
            if(criticalHit){
                const {E} = this.getSurroundings(combatantHit.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(combatantHit.coordinates, E);
                if(!someoneElseIsInCoords && combatantHit.coordinates.x !== MAX_DEPTH){
                    combatantHit.coordinates.x++
                    this.checkOverlap(combatantHit)
                }
            }
        } else if((caller.coordinates.x === combatantHit.coordinates.x) && caller.coordinates.y > combatantHit.coordinates.y){
            combatantHit.wounded.sourceDirection = 'bottom';
            if(criticalHit){
                const {S} = this.getSurroundings(combatantHit.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(combatantHit, S);
                if(!someoneElseIsInCoords && combatantHit.coordinates.y !== 0){
                    combatantHit.coordinates.y--
                    this.checkOverlap(combatantHit)
                }
            }
        } else if((caller.coordinates.x === combatantHit.coordinates.x) && caller.coordinates.y < combatantHit.coordinates.y){
            combatantHit.wounded.sourceDirection = 'top';
            if(criticalHit){
                const {S} = this.getSurroundings(combatantHit.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(combatantHit, S);
                if(!someoneElseIsInCoords && combatantHit.coordinates.y !== MAX_LANES-1){
                    combatantHit.coordinates.y++
                    this.checkOverlap(combatantHit)
                }
            }
        } else if(caller.coordinates.x > combatantHit.coordinates.x){
            combatantHit.wounded.sourceDirection = 'right';
            if(criticalHit){
                const {W} = this.getSurroundings(combatantHit.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(combatantHit, W);
                console.log(caller.name, '>', combatantHit.name,'crit from right, someoneElseIsInCoords', someoneElseIsInCoords);
                if(!someoneElseIsInCoords && combatantHit.coordinates.x !== 0){
                    combatantHit.coordinates.x--
                    this.checkOverlap(combatantHit)
                }
            }
        }

        // Cleanup wounded property after hit-flash duration (monsters and minions)
        setTimeout(() => {
            combatantHit.wounded = false;
            if (typeof this.updateData === 'function') {
                this.updateData(clone(this.combatants));
            }
        }, ROCK_DURATION);
        // (Critical movement handled above; duplicated block removed)

        // ── Attack effect: stun ──────────────────────────────────────────
        // If the attack that just landed has an effect of type 'stun', roll
        // the chance and apply the stun flag for the specified era duration.
        // Duration is stored as an era counter (stunned_eras) and decremented
        // in restartTurnCycle — so it tracks correctly regardless of game speed.
        const attackEffect = caller.pendingAttack && caller.pendingAttack.effect;
        if (attackEffect && attackEffect.type === 'stun' && combatantHit.hp > 0) {
            // Only attempt to stun if the target is not already stunned —
            // prevents repeated hits from indefinitely refreshing the timer.
            if (!combatantHit.stunned) {
                const roll = Math.random() * 100;
                if (roll < attackEffect.chance) {
                    combatantHit.stunned = true;
                    combatantHit.stunned_eras = (attackEffect.duration || 1);
                    if (typeof this.updateData === 'function') this.updateData(clone(this.combatants));
                }
            }
        }

        if(combatantHit.hp <= 0){
            combatantHit.hp = 0;
            if(caller.targetId === combatantHit.id) caller.targetId = null;
            combatantHit.wounded.severity = 'lethal';
            this.targetKilled(combatantHit);
        }
        setTimeout(()=>{
            // combatantHit.wounded = false;
        }, this.FIGHT_INTERVAL * 30)
    }
    this.hitsTarget = (caller, tempTarget = null) => {
        let target = tempTarget ? tempTarget : this.getCombatant(caller.targetId);
        if (!target) return;
        // If the target is a monster or minion, use hitsCombatant to ensure .wounded is set and hit-flash is triggered
        if (target.isMonster || target.isMinion) {
            this.hitsCombatant(caller, target);
            return;
        }
        // Otherwise, fallback to the original logic (for non-monster/minion targets)
        // let r = Math.random();
        let criticalHit = false;
        // For non-monster/non-minion targets, compute base using equipped
        // weapon percentage (if any) so fighters without weapons still use atk.
        let weaponPercent = 0;
        try {
            const inv = caller.inventory || [];
            const weapon = inv.find(i => i && i.type === 'weapon' && (i.equippedSlot === 'right' || i.equippedSlot === 'left' || i.equippedBy === caller.id));
            if (weapon && typeof weapon.damage === 'number') weaponPercent = weapon.damage;
        } catch (e) {
            weaponPercent = 0;
        }
        const base = caller.atk + Math.floor((caller.atk * (weaponPercent || 0)) / 100);
        let damage = criticalHit ? base * CRITICAL_DAMAGE_MULTIPLIER : base;
        let sourceDirection = 'left';
        if (caller.coordinates.x < target.coordinates.x) {
            sourceDirection = 'left';
        } else if ((caller.coordinates.x === target.coordinates.x) && caller.coordinates.y > target.coordinates.y) {
            sourceDirection = 'bottom';
        } else if ((caller.coordinates.x === target.coordinates.x) && caller.coordinates.y < target.coordinates.y) {
            sourceDirection = 'top';
        } else if (caller.coordinates.x > target.coordinates.x) {
            sourceDirection = 'right';
        }
        target.wounded = {
            severity: criticalHit ? 'severe' : 'minor',
            damage,
            sourceDirection
        };
        if(Array.isArray(target.weaknesses) && caller.pendingAttack && typeof caller.pendingAttack.type === 'string'){
            if(target.weaknesses.includes(caller.pendingAttack.type)){
                damage += Math.floor(damage/2);
            }
        }
        // Apply equipped armor percent reduction (if any) to the damage for non-monster targets
        let armorPercentTarget = 0;
        try {
            const inv = target.inventory || [];
            armorPercentTarget = inv.filter(i => i && i.type === 'armor' && (i.equippedSlot || i.equippedBy === target.id)).reduce((acc, a) => acc + (typeof a.armor === 'number' ? a.armor : 0), 0);
        } catch (e) { armorPercentTarget = 0 }
        if (armorPercentTarget > 0) {
            const reduction = Math.floor(damage * (armorPercentTarget / 100));
            damage = Math.max(0, damage - reduction);
        }

        caller.readout.result = `${caller.name} hits ${target.name} for ${damage} damage`;
        target.hp -= damage;
        target.damageIndicators.push(damage);
        if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        }
        caller.energy += caller.stats.fort * 1 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        if(target.hp <= 0){
            target.hp = 0;
            caller.targetId = null;
            target.woundedLethal = true;
            this.targetKilled(target);
        } else if(criticalHit) {
            // HANDLE PUSHBACK OF TARGET
        }
        setTimeout(()=>{
            caller.active = caller.aiming = false;
            caller.attacking = caller.attackingReverse = false;
            caller.missed = false;
            
            if(!this.isMonster && !this.isMinion){
                const hasValidTargets = Object.values(this.combatants).filter(e=>e.isMonster || e.isMinion).length >= 1;
                if(hasValidTargets){
                    const attack = this.chooseAttackType(caller, target);
                    caller.pendingAttack = attack;
                } else {
                    this.clearTargetListById(caller.id);
                    caller.targetId = null;
                }
            } else {
                //is monster or minion
                const hasValidTargets = Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).length >= 1;
                if(hasValidTargets){
                    const attack = this.chooseAttackType(caller, target);
                    caller.pendingAttack = attack;
                } else {
                    this.clearTargetListById(caller.id);
                    caller.targetId = null;
                }
            }
            
            // setTimeout(()=>{
            //     caller.restartTurnCycle();
            // }, 250)

        }, this.FIGHT_INTERVAL * 50)

        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
    }
    this.hasOnlyOneValidTarget = (caller) => {
        if(!caller.isMonster && !caller.isMinion && Object.values(this.combatants).filter(e=>e.isMonster || e.isMinion).length === 1) return true;
        if((caller.isMonster || caller.isMinion) && Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).length === 1) return true;
        return false;
    }
    this.missesTarget = (caller, tempTarget = null) => {
        caller.missed = true;
        caller.readout.result = `misses`
        let target = tempTarget ? tempTarget : this.getCombatant(caller.targetId);
        if(target) target.damageIndicators.push('miss');
        setTimeout(()=>{
            caller.active = caller.aiming = false;
            caller.attacking = caller.attackingReverse = false;
            caller.missed = false;
            
            if(!this.isMonster && !this.isMinion){
                const hasValidTargets = Object.values(this.combatants).filter(e=>e.isMonster || e.isMinion).length >= 1
                if(hasValidTargets){
                    const attack = this.chooseAttackType(caller, target);
                    caller.pendingAttack = attack;
                } else {
                    this.clearTargetListById(caller.id)
                    caller.targetId = null
                }
            } else {
                //is monster or minion
                const hasValidTargets = Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).length >= 1
                if(hasValidTargets){
                    const attack = this.chooseAttackType(caller, target);
                    caller.pendingAttack = attack;
                } else {
                    this.clearTargetListById(caller.id)
                    caller.targetId = null
                }
            }
            
            // setTimeout(()=>{
            //     caller.restartTurnCycle();
            // }, 250)

        }, this.FIGHT_INTERVAL * 50)

        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
    }

    this.targetKilled = (combatant) => {
    // If combat is already over, ignore in-flight death calls to prevent
    // duplicate gameOver triggers and stale combatant state mutations.
    if (this.combatOver) return;
    // Guard against double-death (e.g. two fighters attack simultaneously)
    if (combatant.dead) return;
    // Ensure the combatant stops all activity immediately.
    combatant.aiming = false;
    combatant.active = false;
    combatant.attacking = combatant.attackingReverse = false;
    combatant.pendingAttack = null;
    combatant.destinationCoordinates = null;
    if (Array.isArray(combatant.action_queue)) combatant.action_queue.length = 0;
    combatant.manualControl = false;
    combatant.manualMovesCurrent = 0;
    combatant.dead = true;
        // Lock the combatant to prevent any further movement/turns.
        combatant.locked = true;
        combatant.frozen = false;
        // Immediately clear targettedBy so reticle is removed
        if (Array.isArray(combatant.targettedBy)) {
            combatant.targettedBy = [];
        }
        // Immediately broadcast update so UI sees dead state instantly
        // if (typeof this.updateData === 'function') {
            this.updateData(clone(this.combatants));
        // }
        setTimeout(()=>{
            combatant.wounded = false;
        },1000)
        this.clearTargetListById(combatant.id)
        const allMonstersDead = Object.values(this.combatants).filter(e=> (e.isMonster || e.isMinion) && !e.dead).length === 0;
        const allCrewDead = Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).every(e=>e.dead)
        this.onFighterDeath(combatant.id);

        if(allMonstersDead || allCrewDead){
            let outcome = allMonstersDead ? 'crewWins' : 'monstersWin';
            Object.values(this.combatants).forEach(e=>{
                e.aiming = false
            })
            this.combatOver = true;

            // Diagnostic logging to help trace duplicate gameOver triggers
            try {
                const remainingMonsters = Object.values(this.combatants).filter(e => (e.isMonster || e.isMinion) && !e.dead).map(m => m.id);
                const remainingCrew = Object.values(this.combatants).filter(e => !e.isMonster && !e.isMinion && !e.dead).map(c => c.id);
                console.log('targetKilled: allMonstersDead=', allMonstersDead, 'allCrewDead=', allCrewDead, 'remainingMonsters=', remainingMonsters, 'remainingCrew=', remainingCrew, 'outcome=', outcome);
            } catch (err) { console.warn('targetKilled: diagnostic logging failed', err); }

            setTimeout(()=>{
                try { console.log('combat-manager: invoking gameOver callback with outcome=', outcome); } catch(e){}
                this.gameOver(outcome)
            }, 2000)
        }
    }
    this.combatOverCheck = () => {
        return this.combatOver;
    }
    
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    this.delay = (numSeconds) => {
        return new Promise((resolve) => {
            setTimeout(()=>{
                resolve(numSeconds, ' complete')
            }, numSeconds * 1000)
        })
    }

    this.triggerMonsterGreeting = () => {
        // morphPortrait
        return new Promise((resolve, reject) => {
            if(this.data.monster.type === 'witch'){
                this.delay(0.5).then(()=>{
                    this.setMessage({message: this.data.monster.greetings[0], source: 'monster'})
                    this.delay(2).then(()=>{
                        this.morphPortrait();
                    })
                    this.delay(5).then(()=>{
                        this.setMessage({message: '', source: null})
                            this.delay(0.5).then(()=>{
                                resolve()
                            })
                    })
                })
            } else {
                this.delay(0.5).then(()=>{
                    this.setMessage({message: this.data.monster.greetings[0], source: 'monster'})
                    this.delay(2).then(()=>{
                        this.setMessage({message: '', source: null})
                            this.delay(0.5).then(()=>{
                                resolve()
                            })
                    })
                })
            }
        })
    }

    this.triggerFighterGreeting = () => {
        return new Promise((resolve)=>{
            this.setMessage({message: 'Die, foul beast!', source: 'fighter-leader'})
            this.delay(2).then(()=>{
                this.setMessage({message: '', source: null})
                resolve()
            })
        })
    }

    this.lockFighter = (fighterId) => {
        this.combatants[fighterId].locked = true;
    }
    this.unlockFighter = (fighterId) => {
        this.combatants[fighterId].locked = false;
    }
    
    
    const utilMethods = {
        fighterFacingDown: this.fighterFacingDown, 
        fighterFacingUp: this.fighterFacingUp, 
        fighterFacingRight: this.fighterFacingRight,
        // monsterFacingDown:this.monsterFacingDown,
        // monsterFacingUp: this.monsterFacingUp,
        broadcastDataUpdate: this.broadcastDataUpdate,
        kickoffAttackCooldown: this.kickoffAttackCooldown,
        missesTarget: this.missesTarget,
        hitsTarget: this.hitsTarget,
        hitsCombatant: this.hitsCombatant,
        targetKilled: this.targetKilled,
        kickoffSpecialCooldown: this.kickoffSpecialCooldown,
        chooseAttackType: this.genericChooseAttackType,
        getCombatants: () => this.combatants,
        triggerBoardEvent: (eventType, data) => { if (typeof this.triggerBoardEvent === 'function') this.triggerBoardEvent(eventType, data); },
        // Returns the current live fight interval so AI profiles always use the
        // correct value even after updateAllFightIntervals changes the speed.
        getFightInterval: () => this.FIGHT_INTERVAL,
        // Lets fighter-ai.js register a callback to sync its internal data.INTERVAL_TIME
        // whenever the combat speed changes.
        updateIntervalTime: (cb) => { this._intervalTimeListeners = this._intervalTimeListeners || []; this._intervalTimeListeners.push(cb); }
    }
    // Allow monster AI to spawn a new minion at runtime (used by duplicate / bifurcate).
    // `template` is a plain data object shaped like a monster-manager entry.
    // `overrides` is merged on top before createFighter so the caller can set
    // coordinates, hp, specials, etc. without mutating the original template.
    utilMethods.spawnMinion = (template, overrides = {}) => {
        try {
            // Build the raw data object that createFighter expects
            const rawId = (template.id || template.type || 'minion') + '_clone_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
            const rawMinion = Object.assign({}, template, overrides, { id: rawId });

            // Ensure coordinates exist
            if (!rawMinion.coordinates) rawMinion.coordinates = { x: MAX_DEPTH - 1, y: 0 };

            // Ensure stats object exists (createFighter reads from stats.*)
            if (!rawMinion.stats) {
                rawMinion.stats = {
                    hp: rawMinion.hp || 10,
                    atk: rawMinion.atk || 1,
                    def: rawMinion.def || 0,
                    speed: rawMinion.speed || 5,
                    willpower: 0
                };
            }

            rawMinion.isMinion = true;

            const newCombatant = createFighter(rawMinion, this._callbacks, this.FIGHT_INTERVAL);
            newCombatant.isMinion = true;

            this.combatants[newCombatant.id] = newCombatant;
            try { this._setCombatantOccupiedCoords(this.combatants[newCombatant.id]); } catch (err) {}

            // Register with overlay manager so targeting animations don't crash
            try {
                if (this.overlayManager && typeof this.overlayManager.addCombatant === 'function') {
                    this.overlayManager.addCombatant(newCombatant);
                }
            } catch (err) { console.warn('[spawnMinion] overlayManager.addCombatant failed', err); }

            // Set specials to fully ready
            if (Array.isArray(newCombatant.specials)) {
                newCombatant.specials.forEach(s => { if (s && typeof s === 'object') s.cooldown_position = 100; });
            }

            console.log(`[spawnMinion] spawned ${newCombatant.type} id=${newCombatant.id} at (${newCombatant.coordinates.x},${newCombatant.coordinates.y})`);

            // Initialize AI behavior for the new minion
            const ai = this.monsterAI && this.monsterAI.roster && this.monsterAI.roster[newCombatant.type];
            if (ai && typeof ai.initialize === 'function') {
                try { ai.initialize(newCombatant); } catch (e) { console.warn('[spawnMinion] ai.initialize failed', e); }
            }

            // Set all attacks to ready so the minion can act immediately
            if (Array.isArray(newCombatant.attacks)) {
                newCombatant.attacks.forEach(a => { if (a && typeof a === 'object') a.cooldown_position = 100; });
            }

            // Push to UI immediately
            if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();

            // Kick off the turn cycle so the new minion starts acting
            try { newCombatant.turnCycle(); } catch (e) { console.warn('[spawnMinion] turnCycle failed', e); }

            return newCombatant;
        } catch (err) {
            console.error('[spawnMinion] error:', err);
            return null;
        }
    };

    // Allow AI to consume consumables and notify UI (DungeonPage) to remove one item
    utilMethods.useConsumable = (item, user) => {
        try {
            // Apply the item effect to the combatant
            this.itemUsed(item, user);
        } catch (e) { console.warn('useConsumable: itemUsed failed', e); }
        try {
            if (this.useConsumableCallback) this.useConsumableCallback(item);
        } catch (e) { console.warn('useConsumable: useConsumableCallback failed', e); }
        try { if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(user); } catch (e) {}
    }
    // Allow AI to query the current (communal) inventory via a registered callback
    utilMethods.getCurrentInventory = () => {
        try {
            return (this.getCurrentInventoryCallback && typeof this.getCurrentInventoryCallback === 'function') ? this.getCurrentInventoryCallback() : [];
        } catch (e) { return []; }
    }
    this.fighterAI.connectUtilMethods(utilMethods)
    this.monsterAI.connectUtilMethods(utilMethods)

    this.establishUseConsumableCallback = (cb) => {
        this.useConsumableCallback = cb;
    }
    this.establishGetCurrentInventoryCallback = (cb) => {
        this.getCurrentInventoryCallback = cb;
    }
}