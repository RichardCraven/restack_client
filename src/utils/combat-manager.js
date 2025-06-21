import * as images from '../utils/images'

import { FighterAI } from './fighter-ai/fighter-ai'
import { MonsterAI } from './monster-ai/monster-ai'
import {MovementMethods} from './fighter-ai/methods/fighter-movement-methods'
import {createFighter, test} from './factories'
import { cilLifeRing } from '@coreui/icons'
// import test from './factories'
// import {MovementMethods} from './methods/movement-methods';

const MAX_DEPTH = 7
const NUM_COLUMNS = 8;
// ^ means 8 squares, account for depth of 0 is far left
const MAX_LANES = 5
// const FIGHT_INTERVAL = 8;
const FIGHT_INTERVAL = 10;
const DEBUG_STEPS = false;
const RANGES = {
    close: 1,
    medium: 3,
    far: 5
}

const clone = (val) => {
    return JSON.parse(JSON.stringify(val))
}

export function CombatManager(){
    this.fighterAI = new FighterAI(NUM_COLUMNS, MAX_LANES, FIGHT_INTERVAL);
    this.monsterAI = new MonsterAI(NUM_COLUMNS, MAX_LANES, FIGHT_INTERVAL);
    
    this.movementMethods = MovementMethods;
    this.overlayManager = null;
    this.selectedFighter = null;
    this.combatPaused = false;
    this.pauseCombat = (val) => {
        console.log('pause combt');
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

    this.specialsMatrix = {
        deadeye_shot: {
            name: 'deadeye shot',
            type: 'special',
            icon: images['evilai_charm'],
            cooldown: 10,
            damage: 10,
            effect: ['damage_single_target'],
            level: 1
        },
        berserker_rage: {
            name: 'berserker rage',
            type: 'special',
            icon: images['demonskull_charm'],
            cooldown: 10,
            effect: ['buff_self', 'nerf_self'],
            duration: 18,
            buff: {
                increase_stats: {
                    stats: [
                        {stat: 'str', amount: 5},
                        {stat:'dex',amount:3},
                        {stat: 'atk', amount: 7}
                    ]
                }
            },
            nerf: {
                decrease_stats:{
                    stats: [
                        {stat: 'int', amount: 3}
                    ]
                }
            },
            level: 1
        },
        healing_hymn: {
            name: 'healing hymn',
            type: 'special',
            icon: images['lundi_charm'],
            effect: ['buff_all_friendly'],
            buff: {
                heal: {
                    amount: 12 
                }
            },
            cooldown: 12,
            level: 1
        },
        reveal_weakness: {
            name: 'reveal weakness',
            type: 'special',
            icon: images['hamsa_charm'],
            cooldown: 12,
            effect: ['special'],
            special_instructions: 'reveal all monsters weaknesses',
            level: 1
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'special',
            icon: images['lundi_charm'],
            cooldown: 11,
            damage: 15,
            effect: ['damage_single_target', 'special'],
            special_instructions: 'target has 50% chance to be stunned for 1 sec * $str',
            level: 1
        },
        shield_wall: {
            name: 'shield wall',
            type: 'special',
            icon: images['beetle_charm'],
            cooldown: 11,
            effect: ['special'],
            special_instructions: 'shield all members for three hits',
            level: 1
        },
        ice_blast: {
            name: 'ice blast',
            type: 'special',
            icon: images['ice_blast'],
            cooldown: 11,
            damage: 8,
            effect: ['damage_single_target', 'special'],
            special_instructions: 'each enemy has a 40% chance to be frozen',
            level: 1
        },
        fire_blast: {
            name: 'fire blast',
            type: 'special',
            icon: images['fire_blast'],
            cooldown: 11,
            damage: 8,
            effect: ['damage_multi_target', 'special'],
            special_instructions: 'each enemy has a 40% chance to be lit aflame',
            level: 1
        },
    }
    
    
    this.data = null;
    this.intervalReference = null;
    this.combatOver = false;

    this.initialize = () => {
        this.data = null;
        this.intervalReference = null;
        this.combatOver = false;
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
        return stringArray.map(e=>{
            return this.specialsMatrix[e]
        })
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
                debugger
        }
        caller.action_queue.shift();
    }
    this.getSelectedFighter = () => {
        return this.selectedFighter
    }
    this.initializeCombat = (data) => {
        test();
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
        this.data.crew.forEach((e, index) => {
            e.coordinates = {x:0,y:0}
            e.coordinates.y = index;
            e.coordinates.x = 0;
            // e.coordinates = {x:0, y:index}
            e.manualMovesCurrent = 20;
            e.manualMovesTotal = 25
            this.combatants[e.id] = createFighter(e, callbacks, FIGHT_INTERVAL);
        })
        this.data.monster.coordinates = {x:0,y:0}
        this.data.monster.coordinates.y = 2;
        this.data.monster.coordinates.x = MAX_DEPTH;
        // this.data.monster.coordinates = {x:MAX_DEPTH, y:2}
        let monster = createFighter(this.data.monster, callbacks, FIGHT_INTERVAL);
        monster.isMonster = true;
        this.combatants[monster.id] = monster;

        if(this.data.minions){
            let position = MAX_LANES-1;
            this.data.minions.forEach(e=>{
                e.coordinates = {x:0,y:0}
                e.coordinates.y = position;
                position--
                e.coordinates.x = MAX_DEPTH;
                // e.coordinates = {x:MAX_DEPTH+1, y:position}
                let m = createFighter(e, callbacks, FIGHT_INTERVAL)
                m.isMinion = true;
                this.combatants[m.id] = m;
            })
        }

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
        const differential = this.fighterFacingUp(caller) || this.fighterFacingDown(caller) ? Math.abs(caller.coordinates.y - target.coordinates.y) : Math.abs(caller.coordinates.x - target.coordinates.x);
        // 1 means target is right in front of you

        let res;
        res = differential <= 3;
        switch(caller.pendingAttack.range){
            case 'self':
                res = true;
            break;
            case 'close':
                if(caller.name === "LORYASTES" && DEBUG_STEPS){

                }
                res = differential === 1;
            break;
            case 'medium':
                // if(caller.isMonster) console.log('wiotch differential: ', differential, 'distance: ', distanceToTarget)
            break;
            case 'far':
                // if(caller.type === 'sphinx'){
                //     console.log('sphinx differential', differential);
                // }
                res = caller.coordinates.y === target.coordinates.y;
            break;
            default:
                console.log('somehow attack had no range');
                debugger
            break;
        }
        return !!res;
    }
    this.getLiveFighters = () => {
        return Object.values(this.combatants).filter(e=> !e.isMonster && !e.isMinion && !e.dead)
    }
    this.itemUsed = (item, userInput) => {
        const user = this.combatants[userInput.id];
        switch(item.effect){
            case 'health gain': 
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
            // setTimeout(()=>{
                // combatant.turnCycle();
            // },8000)
        })
        let c = 0;
        const int = setInterval(()=>{
            c++
            let combatant = arr.pop()
            combatant.turnCycle();
            if(!arr.length) clearInterval(int)
        },10)
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
        if(this.type === 'monk') console.log('monk go to dest????');
        caller.coordinates.x = caller.destinationCoordinates.x;
        caller.coordinates.y = caller.destinationCoordinates.y;
        caller.coordinates = {x: caller.destinationCoordinates.x, y: caller.destinationCoordinates.y}
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
        this.updateData(this.combatants)
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
        debugger
    }
    this.moveFighterOneSpace = (direction) => {
        let pendingCoordinates, spaceOccupier;

        if(!this.selectedFighter) return 
        const fighter = this.combatants[this.selectedFighter.id]
        if(!fighter || fighter.dead || fighter.locked) return;
        if(fighter.manualMovesCurrent < 1){
            return
        } else {
            fighter.manualMovesCurrent--
            console.log('restart manual');
            fighter.restartTurnCycle();
        }
        switch(direction){
            case 'up':
                if(fighter.coordinates.y === 0) return
                if(this.type === 'monk') console.log('monk key up????');
                pendingCoordinates = {x: fighter.coordinates.x , y: fighter.coordinates.y-1}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                fighter.coordinates.y--
                fighter.manualMoveCooldown()
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
                fighter.manualMoveCooldown()
            break;
            case 'right':
                if(fighter.coordinates.x === MAX_DEPTH) return
                pendingCoordinates = {x: fighter.coordinates.x+1 , y: fighter.coordinates.y}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                
                fighter.coordinates.x++

                fighter.manualMoveCooldown()
            break;
            case 'left':
                if(fighter.coordinates.x === 0) return
                pendingCoordinates = {x: fighter.coordinates.x-1 , y: fighter.coordinates.y}
                spaceOccupier = Object.values(this.combatants).find(e=>{
                    return e.coordinates.x === pendingCoordinates.x && e.coordinates.y === pendingCoordinates.y && !e.dead
                })
                if(spaceOccupier) return
                fighter.coordinates.x--
                fighter.manualMoveCooldown()
            break;
            default:
            break;
        }
        console.log('restart this one');
        fighter.restartTurnCycle()
    }
    this.fighterFacingRight = (caller) => {
        const f = this.combatants[caller.id]
        if(!f) return;
        const target = this.combatants[f.targetId]
        if(target){
            return f.coordinates.x <= target.coordinates.x
        }
        else return true
    }
    this.fighterFacingUp = (caller) => {
        const f = this.combatants[caller.id]
        if(!f) return;
        const target = this.combatants[f.targetId]
        if(target){
            return f.coordinates.y > target.coordinates.y && f.coordinates.x === target.coordinates.x
        }
        else return false
    }
    this.fighterFacingDown = (caller) => {
        const f = this.combatants[caller.id]
        if(!f) return;
        const target = this.combatants[f.targetId]
        if(target){
            return f.coordinates.y < target.coordinates.y && f.coordinates.x === target.coordinates.x
        }
        else return false
    }
    this.monsterFacingUp = (caller) => {
        if(!caller || !this.combatants[caller.id]) return;
        const monster = Object.values(this.combatants[caller.id])
        const target = this.combatants[monster.targetId]
        if(target){
            return monster.coordinates.y > target.coordinates.y && monster.coordinates.x === target.coordinates.x
        }
        else return false
    }
    this.monsterFacingDown = (caller) => {
        if(!caller || !this.combatants[caller.id]) return;
        const monster = Object.values(this.combatants[caller.id])
        const target = this.combatants[monster.targetId]
        if(target){
            return monster.coordinates.y < target.coordinates.y && monster.coordinates.x === target.coordinates.x
        }
        else return false
    }
    this.manualRetarget = (caller) => {
        const targetOptions = Object.values(this.combatants).filter(e=>(e.isMinion || e.isMonster) && !e.dead)
        const currentTarget = targetOptions.find(e=>e.id===caller.targetId)
        this.acquireTargetManually(caller, currentTarget)

    }
    this.initiateAttack = (caller, manualAttack = false) => {
       let manualTarget = false;
       if(caller.type === 'soldier'){

           console.log('soldier initiates attack');
        //    debugger
       }
        const targetInRange = (caller, target) => {
            const pendingAttack = caller.pendingAttack
            const rangeDiff = this.fighterFacingUp(caller) || this.fighterFacingDown(caller) ?
             Math.abs(caller.coordinates.y - target.coordinates.y) 
             : Math.abs(caller.coordinates.x - target.coordinates.x);


            if(manualAttack){
                // console.group('TARGET IN RANGE BLock');

                // console.log('caller', caller, 'target: ', target);
                // console.log('pendingAttack', pendingAttack);
                // console.log('pendingAttack range ', RANGES[caller.pendingAttack.range], 'vs rangeDiff: ', rangeDiff);

                // console.groupEnd()
            }
            return rangeDiff <= RANGES[caller.pendingAttack.range]
        }

        if(this.fighterAI.roster[caller.type]){
            console.log('this.fighterAI.roster[soldier]', this.fighterAI.roster[caller.type]);
            this.fighterAI.roster[caller.type].initiateAttack(caller, manualAttack, this.combatants);
            return
        }
        
        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].initiateAttack(caller, this.combatants);
            return
        }

        let target = this.combatants[caller.targetId];
        if(!target || !targetInRange(caller, target)){
            if(!manualAttack){
                console.log('somehow this fighter initiated an attack without a target/range and NOT manually! investigate');
                debugger
            }
            const attack = caller.pendingAttack,
            range = RANGES[attack.range]
            if(range === 1){
                console.log('*************** ranfge is 1');

                // will need to handle facing up/down
                let coordinatesAttacked = {x: this.fighterFacingRight(caller) ? caller.coordinates.x+1 : caller.coordinates.x-1, y: caller.coordinates.y};
                let occupier = this.coordinatesOccupied(coordinatesAttacked);
                if(occupier && (occupier.isMinion || occupier.isMonster)){
                    console.log('enemy occupier: ', occupier);
                    target = occupier;
                    manualTarget = true;
                } else {
                    console.log('SWINGING AT NOTHING $$$$$$$$$$$');
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
        // if(caller.isMonster) console.log('monster cooldown begins');
        const atk = caller.pendingAttack;
        if(!atk) return
        // console.log(caller.type,'kick off attack cooldown for ', atk);
        const generalCooldown = (10/caller.stats.dex) * 1000
        // console.log('SET GENERAL ATTACK COOLDOWN: ',generalCooldown, 'from ', 10/caller.stats.dex);
        atk['cooldown_position'] = 0;
        let totalTime = atk.cooldown * 1000;
        let scopeVar = 0, that = this;
        caller.onGeneralAttackCooldown = true;
        const generalAttackCooldown = setTimeout(()=>{
            // console.log(caller.type, 'done with gen atk cooldown');
            caller.onGeneralAttackCooldown = false;
        }, generalCooldown)
        const intervalRef = setInterval(()=>{
            // if(caller.type === 'sphinx'){
            //     console.log('sphinx cooldown attack: ', atk);
            // }
            let ratio = 0;
            if(!that.combatPaused){
                scopeVar += 100;
                ratio = Math.ceil((scopeVar / totalTime) * 100);
                atk['cooldown_position'] = ratio;
                // if(caller.type === 'sphinx'){
                //     console.log('sphinx CLONED attack cooldown obj ', JSON.parse(JSON.stringify(atk)));
                //     console.log('ratio', ratio);
                //     console.log('sphinx atk.cooldown_position: ', JSON.parse(JSON.stringify(atk['cooldown_position'])));
                // }
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
            // console.log('range: ', caller.pendingAttack.range, 'translates to', RANGES[caller.pendingAttack.range] )
            // console.log(caller.name, 'depth: ', caller.coordinates.x, 'range width: ', RANGES[caller.pendingAttack.range]);
            // console.log('therfor finsl calc: ', caller.coordinates.x * 100 - RANGES[caller.pendingAttack.range]*100)
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
            //facing right
            return `${(caller?.coordinates.x * 100)}px`
        }
        return `${(caller?.coordinates.x * 100) - RANGES[caller.pendingAttack.range]*100}px`
    }
 
    this.getFighterActionBarLeftValue = (caller) => {
        const trueFighterRef = this.combatants[caller.id];
        let target = this.getCombatant(trueFighterRef?.targetId)
        if(target && target.coordinates.x > trueFighterRef?.coordinates.x){
            // normal scenario
            // return `calc(100px * ${this.state.battleData[fighter.id]?.coordinates.x} + 50px)`
            return `calc(100px * ${trueFighterRef?.coordinates.x} + 50px)`
        }
        // console.log('this.getCombatant(trueFighterRef?.targetId)?.coordinates.x ', this.getCombatant(trueFighterRef?.targetId)?.coordinates.x);
        return `calc(100px * ${this.getCombatant(trueFighterRef?.targetId)?.coordinates.x} + 50px)`
    }
    this.updateCoordinates = (caller) => {
        caller.coordinates = {x: caller.coordinates.x, y: caller.coordinates.y}
    }
    this.acquireTarget = (caller, targetToAvoid = null) => {
        if(this.combatPaused || caller.dead) return;
        if(this.fighterAI.roster[caller.type]){
            this.fighterAI.roster[caller.type].acquireTarget(caller, this.combatants, targetToAvoid)
            if(caller.targetId){
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: 'white'
                    }
                }
                this.overlayManager.addAnimation(animation)
            }
            return
        }
        
        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].acquireTarget(caller, this.combatants);
            if(caller.targetId){
                const animation = {
                    type: 'targetted',
                    id: caller.targetId,
                    data:{
                        color: caller.isMonster ? 'red' : 'lightred'
                    }
                }
                this.overlayManager.addAnimation(animation)
            }
            return
        }
        
        // console.log(caller.name, 'acquires target');

        // let reposition = this.pickRandom([1,2,3,4,5,6,7,8,9,10]) < 4
        
        const liveMonsters = Object.values(this.combatants).filter(e=> ((e.isMonster || e.isMinion )  && !e.dead)),
              liveFighters = Object.values(this.combatants).filter(e=> ((!e.isMonster && !e.isMinion) && !e.dead));
        let target;
        if(caller.isMonster || caller.isMinion){
            if(caller.targetId){
            console.log('already has target, just choose new attack');
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
            debugger
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
        let currentTarget = this.combatants[caller.targetId]
        const liveEnemies = Object.values(this.combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const targetsSortedVertically = liveEnemies.sort((a,b)=>a.coordinates.y - b.coordinates.y);
        let currentTargetIndex = targetsSortedVertically.indexOf(currentTarget)
        if(targetsSortedVertically[currentTargetIndex+1]){
            caller.targetId = targetsSortedVertically[currentTargetIndex+1].id;
        } else {
            caller.targetId = targetsSortedVertically[0].id
        }

    }
    this.processMove = (caller) => {
        if(caller.type === 'monk') console.log('monk process move precheck');
        if(caller.dead) return;
        if(this.fighterAI.roster[caller.type]){
            if(caller.type === 'monk') console.log('monk process move', 'targetInRange? ');
            this.fighterAI.roster[caller.type].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }
        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }

        const liveCombatants = Object.values(this.combatants).filter(e=> (!e.dead && e.id !== caller.id));

        const target = this.combatants[caller.targetId]
        const distanceToTarget = this.getDistanceToTarget(caller, target),
        laneDiff = this.getLaneDifferenceToTarget(caller, target)

        
        
        let newPosition, newDepth;
        const targetInRange = this.targetInRange(caller)
        
        if(caller.type === 'monk') console.log('monk process move', 'targetInRange? ', targetInRange);
        if(!targetInRange && caller.pendingAttack){
            if(caller.type === 'monk') console.log('monk zebber 1');
            let moveBackLots = caller.pendingAttack.range === 'far' && distanceToTarget < 2
            newDepth = caller.isMonster || caller.isMinion ? 
            (distanceToTarget > -1 ? caller.coordinates.x+1 : caller.coordinates.x-1) : 
            (moveBackLots ? caller.coordinates.x-3 :
            (distanceToTarget < 1 ? caller.coordinates.x-1 : caller.coordinates.x+1))
        } else {
            if(caller.type === 'monk') console.log('monk zebber 2');
            newDepth = caller.coordinates.x
        }

        // if(this.type === 'monk') console.log('monk process move ????');

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
        const liveCombatants = Object.values(this.combatants).filter(e=> (e.id !== combatant.id && !e.dead));
        if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)){
            // console.log('LIVE COMB', liveCombatants, 'combatant.coordinates.x', combatant, liveCombatants.filter(e=>(e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)));
            combatant.hasOverlap = true
        }
        if(combatant.hasOverlap){
            overlapper = liveCombatants.find(e=>(e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y))
            if(overlapper){
                console.log(`${combatant.name} ${combatant.id} HAS OVERLAP with`, overlapper, overlapper.id );
                if(combatant.id === 816) debugger
                // this.handleOverlap(combatant);
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
            console.log('do I have access to monsters behavior? ', combatant);
            // debugger
            if(this.monsterAI.roster[combatant.type] && this.monsterAI.roster[combatant.type].handleOverlap){
                this.monsterAI.roster[combatant.type].handleOverlap(combatant, this.combatants)
                // handleOverlap
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
            console.log('fighter overlap');
            while(!depthAvailable){
                if(liveCombatants.some(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)){
                    let blockerCombatant = liveCombatants.find(e=>e.coordinates.x === combatant.coordinates.x && e.coordinates.y === combatant.coordinates.y)
                    console.log('blocker combatant: ', blockerCombatant);
                    let blockerDistanceToTarget = this.getDistanceToTarget(blockerCombatant, this.combatants[blockerCombatant.targetId])
                    console.log('blocker distance', blockerDistanceToTarget);
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
        return Object.values(this.combatants).find(e=> e.coordinates.x === coordinates.x && e.coordinates.y === coordinates.y)
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
        return Object.values(this.combatants).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
    }
    this.someoneElseIsInCoords = (caller, coords)=>{
        return Object.values(this.combatants).filter(c=>c.id!==caller.id).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
    }
    this.hitsCombatant = (caller, combatantHit, supplementalData = null) => {
        // this is an improved version of hitsTarget, that can handle anything getting hit in the line of fire, does
        // not have to be targetted

        let r = Math.random()
        let criticalHit = (supplementalData && supplementalData.increasedCritChance) ? r*100 > 50  : r*100 > 80;
        // let criticalHit = true
        let damage = criticalHit ? caller.atk*3 : caller.atk
        if(!caller.pendingAttack){
            console.log('HOW CAN YOU HIT WITH NO PENDING ATTACK??>', caller);
        } else {
            if(combatantHit.weaknesses.includes[caller.pendingAttack.type]){
                damage += Math.floor(damage/2)
            }
        }
        caller.readout.result = `${caller.name} hits ${combatantHit.name} for ${damage} damage`
        combatantHit.hp -= damage;
        combatantHit.damageIndicators.push(damage);
        caller.energy += caller.stats.fort * 3 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        
        combatantHit.wounded = {
            severity: criticalHit ? 'severe' : 'minor',
            damage
        }


        if(caller.coordinates.x < combatantHit.coordinates.x){
            combatantHit.wounded.sourceDirection = 'left';
            if(criticalHit){
                const {E} = this.getSurroundings(caller.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(caller, E);
                if(!someoneElseIsInCoords){
                    combatantHit.coordinates.x++
                    this.checkOverlap(combatantHit)
                }
            }
        } else {
            combatantHit.wounded.sourceDirection = 'right';
            if(criticalHit){
                const {W} = this.getSurroundings(caller.coordinates),
                someoneElseIsInCoords = this.someoneElseIsInCoords(caller, W);
                if(!someoneElseIsInCoords){
                    combatantHit.coordinates.x++
                    this.checkOverlap(combatantHit)
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
            combatantHit.wounded = false;
        }, FIGHT_INTERVAL * 30)
    }
    this.hitsTarget = (caller, tempTarget = null) => {
        let target = tempTarget ? tempTarget : this.getCombatant(caller.targetId);
        if(!target) return
        let r = Math.random()
        let criticalHit = r*100 > 80;
        let damage = criticalHit ? caller.atk*3 : caller.atk
        if(criticalHit){
            target.woundedHeavily = true;
        } else {
            target.wounded = true;
        }
        if(target.weaknesses.includes[caller.pendingAttack.type]){
            damage += Math.floor(damage/2)
        }
        caller.readout.result = `${caller.name} hits ${target.name} for ${damage} damage`
        target.hp -= damage;
        target.damageIndicators.push(damage);
        caller.energy += caller.stats.fort * 3 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        if(target.hp <= 0){
            target.hp = 0;
            caller.targetId = null;
            target.woundedLethal = true;
            this.targetKilled(target);
        } else if(criticalHit) {
            // HANDLE PUSHBACK OF TARGET

            let hitsFromLeftToRight = caller.coordinates.x < target.coordinates.x;
            // hits from the left
            if(hitsFromLeftToRight && target.coordinates.x < MAX_DEPTH && caller.pendingAttack.range === 'close') target.coordinates.x++
            // hits from the right
            if(!hitsFromLeftToRight && target.coordinates.x > 0 && caller.pendingAttack.range === 'close') target.coordinates.x--
            
            this.checkOverlap(target)
            this.updateCoordinates(caller)
        }
        setTimeout(()=>{
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



            caller.active = caller.aiming = false;
            
            // setTimeout(()=>{
            //     caller.restartTurnCycle();
            // }, 500)
        }, FIGHT_INTERVAL * 100)
        setTimeout(()=>{
            caller.attacking = caller.attackingReverse = false;
            target.wounded = false;
            target.woundedHeavily = false;
            // setTimeout(()=>{
            //     target.woundedLethal = false;
            // },1200)
        }, FIGHT_INTERVAL * 30)
        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
        

        // this.overlayManager.addAnimation(this.combatants[target.id], 'blinded')
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

        }, FIGHT_INTERVAL * 50)

        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
    }

    this.targetKilled = (combatant) => {
        combatant.aiming = false;
        combatant.dead = true;
        combatant.locked = combatant.frozen = false;
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

            setTimeout(()=>{
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
        monsterFacingDown:this.monsterFacingDown,
        monsterFacingUp: this.monsterFacingUp,
        broadcastDataUpdate: this.broadcastDataUpdate,
        kickoffAttackCooldown: this.kickoffAttackCooldown,
        missesTarget: this.missesTarget,
        hitsTarget: this.hitsTarget,
        hitsCombatant: this.hitsCombatant,
        targetKilled: this.targetKilled
    }
    this.fighterAI.connectUtilMethods(utilMethods)
    this.monsterAI.connectUtilMethods(utilMethods)
}