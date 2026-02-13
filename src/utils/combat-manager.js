import * as images from '../utils/images'

import { FighterAI } from './fighter-ai/fighter-ai'
import { MonsterAI } from './monster-ai/monster-ai'
import {createFighter, test} from './factories'
import specialsMatrix from './specials-matrix'
import { cilLifeRing } from '@coreui/icons'
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
            damage: 2
        },
        bite: {
            name: 'bite',
            type: 'cutting',
            icon: images['bite'],
            range: 'close',
            cooldown: 3,
            damage: 2
        },
        crush: {
            name: 'crush',
            type: 'crushing',
            icon: images['crushing'],
            range: 'close',
            cooldown: 5,
            damage: 3
        },
        tackle: {
            name: 'tackle',
            type: 'crushing',
            range: 'close',
            cooldown: 5,
            damage: 2
        },
        grasp: {
            name: 'grasp',
            type: 'crushing',
            range: 'close',
            cooldown: 6,
            damage: 2
        },
        energy_drain: {
            name: 'energy drain',
            type: 'curse',
            range: 'medium',
            cooldown: 6,
            damage: 2
        },
        fire_breath: {
            name: 'fire breath',
            type: 'fire',
            icon: images['fire_breath'],
            range: 'medium',
            cooldown: 6,
            damage: 4
        },
        void_lance: {
            name: 'void lance',
            icon: images['void_lance'],
            type: 'psionic',
            range: 'medium',
            cooldown: 6,
            damage: 6
        },
        energy_blast: {
            name: 'energy blast',
            type: 'arcane',
            range: 'far',
            icon: images['void_lance'],
            cooldown: 3,
            damage: 3
        },
        magic_missile: {
            name: 'magic missile',
            type: 'arcane',
            range: 'far',
            icon: images['magic_missile'],
            cooldown: 5,
            damage: 3
        },
        induce_madness: {
            name: 'induce madness',
            type: 'psionic',
            icon: images['lundi_mask'],
            range: 'far',
            cooldown: 5,
            damage: 3
        },
        lightning: {
            name: 'lightning',
            type: 'electricity',
            icon: images['lightning'],
            range: 'far',
            cooldown: 6,
            damage: 5
        },
        sword_swing: {
            name: 'sword swing',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 5,
            damage: 3
        },
        sword_thrust: {
            name: 'sword thrust',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 4.5,
            damage: 2
        },
        dragon_punch: {
            name: 'dragon punch',
            type: 'crushing',
            range: 'close',
            icon: images['scepter'],
            cooldown: 5,
            damage: 3
        },
        meditate: {
            name: 'meditate',
            type: 'buff',
            range: 'self',
            icon: images['basic_shield'],
            cooldown: 5.5,
            damage: 0
        },
        heal: {
            name: 'heal',
            type: 'buff',
            range: 'close',
            icon: images['basic_shield'],
            cooldown: 5.5,
            damage: 0
        },
        fire_arrow: {
            name: 'fire arrow',
            type: 'fire',
            range: 'far',
            icon: images['bow_and_arrow'],
            cooldown: 5,
            damage: 3
        },
        axe_throw: {
            name: 'axe throw',
            type: 'cutting',
            range: 'medium',
            icon: images['axe'],
            cooldown: 5,
            damage: 2
        },
        axe_swing: {
            name: 'axe swing',
            type: 'cutting',
            range: 'close',
            icon: images['axe'],
            cooldown: 3.5,
            damage: 3
        },
        spear_throw: {
            name: 'spear throw',
            type: 'cutting',
            range: 'far',
            icon: images['spear'],
            cooldown: 3.2,
            damage: 4
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'crushing',
            range: 'medium',
            icon: images['scepter'],
            cooldown: 4.5,
            damage: 4
        },
        shield_bash: {
            name: 'shield bash',
            type: 'crushing',
            range: 'close',
            icon: images['basic_shield'],
            cooldown: 4.5,
            damage: 2
        },
        cane_strike: {
            name: 'cane strike',
            type: 'crushing',
            range: 'far',
            icon: images['scepter'],
            cooldown: 3,
            damage: 2
        },
        dagger_stab: {
            name: 'dagger_stab',
            type: 'cutting',
            range: 'close',
            icon: images['sword'],
            cooldown: 2,
            damage: 2
        },
        snake_strike: {
            name: 'snake_strike',
            type: 'cutting',
            range: 'medium',
            icon: images['sword'],
            cooldown: 2,
            damage: 5
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
                // Normalize `specials` (learned/innate specials)
                if (Array.isArray(combatant.specials)) {
                    try {
                        combatant.specials = this.formatSpecials(combatant.specials);
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
            const isLarge = (typeof combatant.large === 'boolean' && combatant.large === true) || (combatant.type && LARGE_COMBAT_KEYS.includes(combatant.type));
            if (isLarge) {
                const above = { x: combatant.coordinates.x, y: combatant.coordinates.y - 1 };
                if (above.y >= 0) combatant.occupiedCoords.push(above);
            }
        } catch (e) {
            // best-effort
        }
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
        try {
            console.log('returning ', mapped);
        } catch (e) {}
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
        this.data = data;
        this.combatants = {};
        const colors_withColorSquare = [' #b710d5',' #6495ed',' #73b746',' #f4d013']
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
            let position = MAX_LANES-1;
            this.data.minions.forEach(e=>{
                e.isMinion = true;
                e.coordinates = {x:0,y:0}
                e.coordinates.y = position;
                position--
                e.coordinates.x = MAX_DEPTH;
                // e.coordinates = {x:MAX_DEPTH+1, y:position}
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

        Object.values(this.combatants).forEach(combatant => {
            if (combatant.specials && Array.isArray(combatant.specials)) {
                combatant.specials.forEach(action => {
                    try {
                        this.kickoffSpecialCooldown(action);
                    } catch (err) {
                        // non-fatal: log and continue
                        console.warn('kickoffSpecialCooldown error for', combatant.id, err);
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
        let attackRange = RANGES[caller.pendingAttack.range]
        if(!caller.pendingAttack || this.combatOver) return false
        if(!target){
            return
        }
    // Compute x and y differences explicitly so we can correctly check orthogonal adjacency
    const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
    const dy = Math.abs(caller.coordinates.y - target.coordinates.y);

    // 1 in either axis indicates adjacent in that axis
    let res;
    res = dx <= 3;

    switch(caller.pendingAttack.range){
            case 'self':
                res = true;
            break;
            case 'close':
                // Close means orthogonally adjacent (left/right OR up/down), not diagonal.
                // dx === 1 && dy === 0 -> horizontal neighbor
                // dx === 0 && dy === 1 -> vertical neighbor
                res = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
            break;
            case 'medium':
                        // Medium range: primarily based on horizontal (x) distance from caller
                        // Use the x-axis differential (dx) to decide if the target is within
                        // medium reach (greater than close but within medium range).
                        res = dx > 1 && dx <= 3;
            break;
            case 'far':
                // if(caller.type === 'sphinx'){
                //     console.log('sphinx differential', differential);
                // }
                res = caller.coordinates.y === target.coordinates.y;
            break;
            default:
                console.log('somehow attack had no range');
            break;
        }
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
            case 'wizard':
                switch(special.name){
                    case 'ice blast':
                        this.fighterAI.roster['wizard'].triggerIceBlast(this.selectedFighter, target)
                    break;
                }
            break;
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
        let c = 0;
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
    this.chooseAttackType = (caller, target) => {
        if(this.fighterAI.roster[caller.type]){
            caller.pendingAttack = this.fighterAI.roster[caller.type].chooseAttackType(caller, target);
            return
        }

        if(this.monsterAI.roster[caller.type]){
            caller.pendingAttack = this.monsterAI.roster[caller.type].chooseAttackType(caller, target);
            return
        }

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
                let percentCooledDown = 0, distanceAttackRelevance = -100, mostRelevantAttack;
                available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).forEach((e)=>{
                    const distance = RANGES[e.range], range = RANGES[e.range];
                    const distanceGreaterThanAtkRange = distance > range
                    const distanceLessThanAtkRange = distance < range

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

        if(!this.selectedFighter) return 
        const fighter = this.combatants[this.selectedFighter.id]
        if(!fighter || fighter.dead || fighter.locked) return;
        if(fighter.manualMovesCurrent < 1){
            return
        } else {
            // fighter.manualMovesCurrent--
            // console.log('restart manual');
            // fighter.restartTurnCycle();
        }
        switch(direction){
            case 'up':
                if(fighter.coordinates.y === 0) return;
                pendingCoordinates = {x: fighter.coordinates.x , y: fighter.coordinates.y-1}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                fighter.coordinates.y--
                fighter.manualMovesCurrent--
                fighter.manualMoveCooldown()
                fighter.restartTurnCycle();
            break;
            case 'down':
                if(fighter.coordinates.y >= MAX_LANES - 1) return
                pendingCoordinates = {x: fighter.coordinates.x , y: fighter.coordinates.y+1}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                fighter.coordinates.y++
                console.log(fighter.type, 'fighter.coordinates.y: ', fighter.coordinates.y);
                fighter.manualMovesCurrent--
                fighter.manualMoveCooldown()
                fighter.restartTurnCycle();
            break;
            case 'right':
                if(fighter.coordinates.x === MAX_DEPTH) return
                pendingCoordinates = {x: fighter.coordinates.x+1 , y: fighter.coordinates.y}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                
                fighter.coordinates.x++
                fighter.manualMovesCurrent--
                fighter.manualMoveCooldown()
                fighter.restartTurnCycle();
            break;
            case 'left':
                if(fighter.coordinates.x === 0) return
                pendingCoordinates = {x: fighter.coordinates.x-1 , y: fighter.coordinates.y}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                fighter.coordinates.x--
                fighter.manualMovesCurrent--
                fighter.manualMoveCooldown()
            break;
            default:
            break;
        }
        fighter.restartTurnCycle()
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
       let manualTarget = false;
        const targetInRange = (caller, target) => {
            const pendingAttack = caller.pendingAttack;
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

    return



        let target = this.combatants[caller.targetId];
        if(!target || !targetInRange(caller, target)){
            if(!manualAttack){
                console.log('somehow this fighter initiated an attack without a target/range and NOT manually! investigate');
                debugger
            }
            const attack = caller.pendingAttack,
            range = RANGES[attack.range]
            if(range === 1){
                // will need to handle facing up/down
                let coordinatesAttacked = {x: this.fighterFacingRight(caller) ? caller.coordinates.x+1 : caller.coordinates.x-1, y: caller.coordinates.y};
                let occupier = this.coordinatesOccupied(coordinatesAttacked);
                if(occupier && (occupier.isMinion || occupier.isMonster)){
                    target = occupier;
                    manualTarget = true;
                } else {
                    caller.active = true;
                    caller.attacking = true;
                    this.broadcastDataUpdate();
                    caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
                    this.kickoffAttackCooldown(caller)
                    return
                }
            }
        }
        let defenseFactor = target.stats.dex ** 2 + target.stats.baseDef;
        if(defenseFactor > 99) defenseFactor = 90;
        let attackFactor = Math.floor(Math.sqrt(caller.atk));

        const results = [], diceRoll = function(){
            return Math.random() * 100
        };
        
        for(let i = 0; i < attackFactor; i++){
            results.push(diceRoll())
        }
        const connects = results.some(e=>e>defenseFactor);
        if(caller.type === 'monk'){
            console.log('monk initiates attack. attackFactor: ', attackFactor, 'connects: ', connects, 'with target: ', target);
        }
        if(!caller.pendingAttack){
            console.log('WHOOA there. someone is trying to attack with nothing');
            return
        }
        caller.active = true;
        caller.attacking = true;
        if(caller.type === 'monk'){
            console.log('***monk attacking: ', caller);
        }
        this.broadcastDataUpdate();
        caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
        this.kickoffAttackCooldown(caller)
        if(connects){
            if(manualAttack){
                if(caller.type === 'monk'){
                    console.log('monk hits target [manually]');
                }
                this.hitsTarget(caller, target)
            } else {
                if(caller.type === 'monk'){
                    console.log('monk hits target');
                }
                this.hitsTarget(caller)
            }
        } else {
            if(manualAttack){
                this.missesTarget(caller, target)
            } else {
                this.missesTarget(caller)
            }
            
        }
    }
    this.kickoffAttackCooldown = (caller) => {
        const atk = caller.pendingAttack;
        if(!atk) return
        const generalCooldown = (10/caller.stats.dex) * 1000
        atk['cooldown_position'] = 0;
        let totalTime = atk.cooldown * 1000;
        let scopeVar = 0, that = this;
        caller.onGeneralAttackCooldown = true;
        const generalAttackCooldown = setTimeout(()=>{
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
        let totalTime = specialAction.cooldown * 1000;
        let scopeVar = 0, that = this;
        // caller.onGeneralAttackCooldown = true;
        // const generalAttackCooldown = setTimeout(()=>{
        //     caller.onGeneralAttackCooldown = false;
        // }, generalCooldown)
        const intervalRef = setInterval(()=>{
            let ratio = 0;
            if(!that.combatPaused){
                scopeVar += 100;
                ratio = Math.ceil((scopeVar / totalTime) * 100);
                specialAction['cooldown_position'] = ratio;
            }
            if(ratio >= 100){
                scopeVar = 0;
                // console.log(caller.type, 'done with cooldown for ', atk);
                clearInterval(intervalRef)
            }
        },100)
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
                if (target) {
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: caller.color
                    }
                }
                this.overlayManager.addAnimation(animation)
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
                if (target) {
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: caller.isMonster ? 'red' : 'lightred'
                    }
                }
                this.overlayManager.addAnimation(animation)
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
            return Object.values(this.combatants).find(e=>e.coordinates.x === coordinates.x && e.coordinates.y === coordinates.y)
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
        if(coordinatesOccupiedBy(newCoordinates)){
            return
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
        return Object.values(this.combatants).find(e=>{
            try {
                if(!e) return false;
                if (e.coordinates && e.coordinates.x === coordinates.x && e.coordinates.y === coordinates.y) return true;
                if (Array.isArray(e.occupiedCoords)) return e.occupiedCoords.some(c => c.x === coordinates.x && c.y === coordinates.y);
                return false;
            } catch (err) { return false; }
        })
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
        return Object.values(this.combatants).filter(c=>c.id!==caller.id).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
    }
    this.hitsCombatant = (caller, combatantHit, supplementalData = null, options = {}) => {
        if(caller.type === 'wizard'){
            console.log('WIZARD HITS');
        }
        if(supplementalData){
            console.log('supplementalData: ', supplementalData);
        }
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
        let r = Math.random();
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
        if(target.weaknesses.includes[caller.pendingAttack.type]){
            damage += Math.floor(damage/2);
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
            caller.active = caller.aiming = false;
        }, this.FIGHT_INTERVAL * 100);
        setTimeout(()=>{
            caller.attacking = caller.attackingReverse = false;
            // Clear the unified wounded state after the hit-flash window
            target.wounded = false;
        }, this.FIGHT_INTERVAL * 30)
        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
    }
    this.hasOnlyOneValidTarget = (caller) => {
        if(!caller.isMonster && !caller.isMinion && Object.values(this.combatants).filter(e=>e.isMonster || e.isMinion).length === 1) return true;
        if(caller.isMonster || caller.isMinion && Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).length === 1) return true;
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
        targetKilled: this.targetKilled
    }
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