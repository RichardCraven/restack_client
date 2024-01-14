import * as images from '../utils/images'

import { FighterAI } from './fighter-ai/fighter-ai'
import { MonsterAI } from './monster-ai/monster-ai'
import {MovementMethods} from './fighter-ai/methods/fighter-movement-methods'
// import {MovementMethods} from './methods/movement-methods';

const MAX_DEPTH = 7
const MAX_LANES = 5
const FIGHT_INTERVAL = 10
const DEBUG_STEPS = false;

export function CombatManager(){
    this.gameIsOver = true;
    this.fighterAI = new FighterAI(MAX_DEPTH, MAX_LANES, FIGHT_INTERVAL);
    this.monsterAI = new MonsterAI(MAX_DEPTH, MAX_LANES, FIGHT_INTERVAL)
    this.movementMethods = MovementMethods;
    // const attackTypes = [
    //     'psionic', 'crushing', 'cutting', 'electricity', 'fire', 'blood_magic', 'ice', 'curse', 'sickness', 'arcane', 'buff',
    //     'holy', 
    // ]
    this.combatPaused = false;
    this.pauseCombat = (val) => {
        console.log('pause combt');
        this.combatPaused = val
        Object.values(this.combatants).forEach(e=>e.combatPaused = val)
    }
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
        magic_missile: {
            name: 'magic missile',
            type: 'arcane',
            range: 'far',
            cooldown: 5,
            damage: 3
        },
        induce_madness: {
            name: 'induce madness',
            type: 'psionic',
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
            }
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
            cooldown: 12
        },
        reveal_weakness: {
            name: 'reveal weakness',
            type: 'special',
            icon: images['hamsa_charm'],
            cooldown: 12,
            effect: ['special'],
            special_instructions: 'reveal all monsters weaknesses'
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'special',
            icon: images['lundi_charm'],
            cooldown: 11,
            damage: 15,
            effect: ['damage_single_target', 'special'],
            special_instructions: 'target has 50% chance to be stunned for 1 sec * $str'
        },
        shield_wall: {
            name: 'shield wall',
            type: 'special',
            icon: images['beetle_charm'],
            cooldown: 11,
            effect: ['special'],
            special_instructions: 'shield all members for three hits'
        },
        ice_blast: {
            name: 'ice blast',
            type: 'special',
            icon: images['beetle_charm'],
            cooldown: 11,
            damage: 8,
            effect: ['damage_multi_target', 'special'],
            special_instructions: 'each enemy has a 40% chance to be frozen'
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

    this.connectAnimationManager = (instance) => {
        console.log('connecting animation manager, instance: ', instance);
        console.log('monster AI: ', this.monsterAI);
        // this.animationManager = instance;
        this.monsterAI.connectAnimationManager(instance)
    }

    this.establishMessageCallback = (cb) => {
        this.setMessage = cb;
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
            return this.attacksMatrix[e]
        })
    }
    this.formatSpecials = (stringArray) => {
        return stringArray.map(e=>{
            return this.specialsMatrix[e]
        })
    }
    //factory functions
    function createFighter(fighter, callbacks, ) {
        const {
            acquireTarget, 
            broadcastDataUpdate, 
            // pickRandom, 
            // hitsTarget, 
            // missesTarget, 
            isCombatOver, 
            getCombatant,
            // combatPaused,
            formatAttacks,
            formatSpecials,
            initiateAttack,
            checkOverlap,
            handleOverlap,
            // goToDestination,
            processActionQueue,
            processMove,
            targetInRange,
        } = callbacks;
        return {
            name: fighter.name,
            type: fighter.type,
            id: fighter.id,
            portrait: fighter.portrait,
            level: fighter.level,
            hp: fighter.stats.hp,
            starting_hp: fighter.stats.hp,
            energy: 1,
            tempo: 1,
            atk: fighter.stats.atk,
            stats: {
                str: fighter.stats.str,
                vit: fighter.stats.vit,
                fort: fighter.stats.fort,
                dex: fighter.stats.dex,
                int: fighter.stats.int,
                baseDef: fighter.stats.baseDef
            },
            inventory: fighter.inventory,
            weaknesses: fighter.weaknesses,
            targetId: null,
            position: fighter.position,
            depth: fighter.depth,
            wounded: false,
            active: false,
            pendingAttack: null,
            aiming: false,
            attacking: false,
            attackingReverse: false,
            healing: false,
            missed: false,
            attacks: formatAttacks(fighter.attacks),
            specials: formatSpecials(fighter.specials),
            targettedBy: [],
            combatPaused: false,
            readout: {action:'', result: ''},
            // readout: '',
            hasOverlap: false,
            coordinates: fighter.coordinates,
            destinationCoordinates: null,
            destinationSickness: false,
            action_queue: [],
            turnSkips: 0,
            attack: function(){
                const target = getCombatant(this.targetId);
                if(!target){
                    this.skip();
                    return
                }
                // let inRange = targetInRange(this);
                // if(this.isMonster || this.isMinion) inRange = true;

                if(this.name === 'Loryastes' && DEBUG_STEPS === true){
                    initiateAttack(this);
                    broadcastDataUpdate(this);
                    return 
                }
                if(this.type === 'djinn'){
                    console.log('djinn initiate attack, this.position === target.position: ', this.position === target.position);
                }
                if(this.position === target.position){
                    initiateAttack(this);
                    broadcastDataUpdate(this)

                } else {
                    this.skip();
                }
            },
            skip: function(){
                this.active = false;
                this.attacking = this.attackingReverse = false;
                this.tempo = 1;
                this.turnCycle();
            },
            move: function(){
                processMove(this);
            },
            turnCycle: function(){
                let count = 0,
                hasMoved = false;
                let factor = (1/this.stats.dex * 25)
                let increment = (1 / factor)
                if(this.hasOverlap) handleOverlap(this)
                this.interval = setInterval(()=>{
                    if(this.combatPaused || this.dead) return
                    count += increment;

                    // if(this.type === 'djinn'){
                    //     console.log('djinn couint ', count, 'turnscips ', this.turnSkips, 'tempo: ', this.tempo);
                    // }

                    this.tempo = Math.floor((count/100)*100);
                    if(this.tempo < 1) return;
                    if(isCombatOver() || this.dead){
                        clearInterval(this.interval)
                        return
                    }
                    if(this.isMonster && this.targetId === null){
                        // console.log('yoooo WTFFFF');
                    }
                    if((this.tempo > 2 && this.tempo < 8) && this.targetId === null && !this.destinationSickness){
                        this.aiming = false;
                        acquireTarget(this);
                        checkOverlap(this)
                    }
                    if(this.tempo > 5 && this.tempo < 10 && this.isMonster){
                        // console.log('monster is at move stage. hasMoved =', hasMoved);
                    }
                    if(this.tempo > 5 && this.tempo < 10 && this.targetId !== null && !hasMoved && !this.destinationSickness){
                        this.aiming = false;
                        this.move();
                        hasMoved = true;
                    }

                    if(count >= 90 && this.pendingAttack && targetInRange(this) && this.pendingAttack.cooldown_position > 80){
                        this.aiming = true;
                    }
                    if(count >= 100){
                        if(this.type === 'djinn'){
                            console.log('djinn at 100, CLEARING INTERVAL ');
                        }
                        clearInterval(this.interval)
                        // this.aiming = false;

                        if(this.name === "Loryastes"  && DEBUG_STEPS === true){
                            console.log('Loryastes [turn] count = 100.. sickness = ', this.destinationSickness);
                        }
                        if(this.destinationSickness){
                            this.destinationSickness = false;
                            this.skip();
                            return
                        }
                        if(this.action_queue.length > 0){
                            // clearInterval(this.interval)
                            processActionQueue(this);
                            return
                        }
                        // clearInterval(this.interval)
                        // let target = getCombatant(this.targetId)
                        // if(this.destinationCoordinates){
                        //     goToDestination(this);
                        // } else if(this.destinationSickness){
                        //     this.tempo = 1;
                        //     clearInterval(this.interval)
                            
                        //     this.turnCycle();

                            
                        //     this.destinationSickness = false;
                            
                        //     //destination dickness still not working
                        // } else 
                        if(this.pendingAttack && this.pendingAttack.cooldown_position === 100){
                            // if(this.isMonster) console.log('monster at 100, in deepest block')


                            if(this.name === "Loryastes"  && DEBUG_STEPS === true){
                                // console.log('Loryastes [IN TURN CYCLE] about to call attack');
                            }
                            const target = getCombatant(this.targetId);
                            if(this.name === 'Loryastes' && this.DEBUG_STEPS){
                                // console.log('Loryastes endcycle, target: ', target);
                            }
                            
                            if(!target){
                                this.skip();
                                if(this.name === 'Loryastes'  && DEBUG_STEPS === true){
                                    // console.log('Loryastes skipping');
                                }
                                return
                            }
                            let inRange = targetInRange(this);
                            // if(this.isMonster) console.log('monster at 100, inrange: ', inRange)
                            if(this.type === 'djinn'){
                                console.log('djinn turnSkips: ', this.turnSkips, 'inRange: ', inRange);
                            }
                            if(inRange){
                                // if(this.isMonster) console.log('monster at 100, attack')
                                this.attack(target)
                            } else {
                                // if(this.isMonster) console.log('monster at 100, else, turnskips at ', this.turnSkips)
                                
                                if((this.isMonster || this.isMinion) && this.turnSkips >= 1){
                                    if(this.type === 'djinn'){
                                        console.log('in skip block, resetting for ', this);
                                    }
                                    acquireTarget(this, target);
                                    this.turnSkips = 0;
                                    this.tempo = 1
                                    this.turnCycle();
                                } else {
                                    if(this.type === 'djinn'){
                                        console.log('djinn skipping ', this);
                                    }
                                    if(this.type === 'djinn'){
                                        console.log('djinn current turnSkips: ', this.turnSkips, 'incrementeing turnskips');
                                    }
                                    this.turnSkips++
                                    this.skip();
                                }
                                
                            }
                        } else if(this.pendingAttack && this.pendingAttack.cooldown_position !== 100){
                            if(this.name === "Loryastes"  && DEBUG_STEPS === true){
                            }
                            if(this.isMonster ||  this.isMinion){
                                console.log(this, 'monster minion waiting for attck');
                            }
                            this.waitForAttack()
                        } else {

                            console.log('uhhhhh no pending');
                            // acquireTarget(this);
                            this.skip();
                            // debugger
                        }
                    }
                    broadcastDataUpdate(this)
                }, FIGHT_INTERVAL)
            },
            waitForAttack: function(){
                this.aiming = true;
                const waitInterval = setInterval(()=>{
                    if(this.type === 'djinn'){
                        console.log('in WAIT block');
                    }
                    if(this.pendingAttack.cooldown_position === 100){
                        if(this.type === 'djinn'){
                            console.log('in ATTACK block');
                        }
                        const target = getCombatant(this.targetId)
                        this.attack(target)
                        clearInterval(waitInterval)
                    }
                }, 500)
            }
        };
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
    this.initializeCombat = (data) => {
        const callbacks = {
            broadcastDataUpdate: this.broadcastDataUpdate,
            acquireTarget: this.acquireTarget,
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
            targetInRange: this.targetInRange
            // combatPaused: this.combatPaused
        }
        this.data = data;
        this.combatants = {};
        
        this.data.crew.forEach((e, index) => {
            e.position = index;
            e.depth = 0;
            e.coordinates = {x:0, y:index}
            this.combatants[e.id] = createFighter(e, callbacks);
        })
        this.data.monster.position = 2;
        this.data.monster.depth = MAX_DEPTH;
        this.data.monster.coordinates = {x:MAX_DEPTH, y:1}
        let monster = createFighter(this.data.monster, callbacks);
        monster.isMonster = true;
        this.combatants[monster.id] = monster;


        if(this.data.minions){
            let position = MAX_LANES-1;
            this.data.minions.forEach(e=>{
                e.position = position;
                position--
                e.depth = MAX_DEPTH;
                e.coordinates = {x:MAX_DEPTH, y:position}
                let m = createFighter(e, callbacks)
                m.isMinion = true;
                this.combatants[m.id] = m;
            })
        }

        this.broadcastDataUpdate();

        this.beginGreeting()
    }
    this.targetInRange = (caller) => {
        if(!caller.pendingAttack || this.combatOver) return false
        const target = this.combatants[caller.targetId];
        // if(caller.isMonster) console.log('monster target in range check, target: ', target, 'and monster is ', caller)
        if(!target){
            // debugger
            return
        }
        const differential = Math.abs(caller.depth - target.depth);
        // 1 means target is right in front of you

        const distanceToTarget = this.getDistanceToTarget(caller, target)


        let res;
        // if(caller.isMonster) console.log('differential: ', differential, 'distance: ', distanceToTarget)
        switch(caller.pendingAttack.range){
            case 'self':
                res = true;
            break;
            case 'close':
                if(caller.name === "LORYASTES" && DEBUG_STEPS){
                    console.log('differential: ', differential);
                    // console.log('vs distance to target: ', distanceToTarget);
                }
                res = differential === 1;
            break;
            case 'medium':
                if(caller.isMonster) console.log('wiotch differential: ', differential, 'distance: ', distanceToTarget)

                res = differential <= 3;
            break;
            case 'far':
                res = differential <= 4 && differential > 1;
                // if(caller.isMonster) console.log('in far block, in range res is ', res)
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

    this.beginGreeting = () => {
        this.triggerMonsterGreeting().then(e=>{
            this.greetingComplete();
            this.kickOffTurnCycles();
            this.broadcastDataUpdate();
        })
    }
    this.kickOffTurnCycles = () => {
        Object.values(this.combatants).forEach((combatant)=>{
            combatant.attacks.forEach((a)=>{
                a.cooldown_position = 100
            })
            combatant.turnCycle();
        })
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
        caller.depth = caller.destinationCoordinates.x;
        caller.position = caller.destinationCoordinates.y;
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
        // if(this.combatPaused) return
        if(caller){
            this.checkOverlap(caller)
            this.updateCoordinates(caller)
        }
        this.updateData(this.combatants)
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        const distanceToTarget = this.getDistanceToTarget(caller, target);
        let percentCooledDown = 0,
            chosenAttack;

        if(available.length === 0){
            caller.attacks.filter(e=>e.range === 'medium' || e.range === 'far').forEach(e=>{
                if(e.cooldown_position > percentCooledDown){
                    percentCooledDown = e.cooldown_position;
                    chosenAttack = e;
                }
            })
            attack = chosenAttack;
        } else {
            if((distanceToTarget === 1 || distanceToTarget === -1) && available.find(e=>e.range === 'close')){
                attack = available.find(e=>e.range === 'close');
                return attack;
            }
            if(available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).length > 0){
                let percentCooledDown = 0;
                available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25).forEach((e)=>{
                    if(e.cooldown_position > percentCooledDown){
                        percentCooledDown = e.cooldown_position;
                        chosenAttack = e;
                    }
                })
                attack = chosenAttack;
            } else {
                attack = this.pickRandom(available);
            }
        }
        return attack
    }
    this.isSpecialAttack = (attackType) => {
        const specials = ['meditate']
        return specials.includes(attackType)
    }
    this.handleSpecialAction = (caller) => {
        console.log('pending', caller.pendingAttack);
        // switch(caller.pendingAttack)
        debugger
    }
    this.initiateAttack = (caller) => {
        if(caller.dead) return;
        if(this.fighterAI.roster[caller.name]){
            this.fighterAI.roster[caller.name].initiateAttack(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }
        // console.log('caller.type: ', caller.type)
        if(this.monsterAI.roster[caller.type]){
            // console.log('roster found for', caller.type)
            this.monsterAI.roster[caller.type].initiateAttack(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }

        let target = this.combatants[caller.targetId];
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
            this.hitsTarget(caller)
        } else {
            this.missesTarget(caller)
        }
    }
    this.kickoffAttackCooldown = (caller) => {
        const atk = caller.pendingAttack;
        atk['cooldown_position'] = 0;
        let totalTime = atk.cooldown * 1000;
        let scopeVar = 0, that = this;
        const intervalRef = setInterval(()=>{
            
            let ratio = 0;
            if(!that.combatPaused){
                scopeVar += 100;
                ratio = Math.ceil((scopeVar / totalTime) * 100);
                atk['cooldown_position'] = ratio;
            }
            if(ratio >= 100){
                scopeVar = 0;
                clearInterval(intervalRef)
            }
        },100)
    }
    this.getLaneDifferenceToTarget = (caller, target) => {
        if(!target) return 0;
        let d = target.position - caller.position
        return d
    }
    this.getDistanceToTarget = (caller, target) => {
        if(!target) return 0;
        let d = target.depth - caller.depth
        return d
        // 0 = same tile
        // 1 = 1 tile in front
        // -1 = 1 tile behind
    }
    this.getDistanceToTargetWidthString = (caller) => {
        if(!caller || !this.combatants[caller.targetId]) return '0px'
        let distanceToTarget = Math.abs(caller.depth - this.combatants[caller.targetId].depth) - 1
        // ^ needs to be the old way
        return ((distanceToTarget * 100) + 100)
    }
    this.updateCoordinates = (caller) => {
        caller.coordinates = {x: caller.depth, y: caller.position}
    }
    this.acquireTarget = (caller, targetToAvoid = null) => {
        if(this.combatPaused || caller.dead) return;

        if(this.fighterAI.roster[caller.name]){
            this.fighterAI.roster[caller.name].acquireTarget(caller, this.combatants)
            return
        }

        if(this.monsterAI.roster[caller.type]){
            this.monsterAI.roster[caller.type].acquireTarget(caller, this.combatants);
            return
        }

        // let reposition = this.pickRandom([1,2,3,4,5,6,7,8,9,10]) < 4
        
        const liveMonsters = Object.values(this.combatants).filter(e=> ((e.isMonster || e.isMinion )  && !e.dead)),
              liveFighters = Object.values(this.combatants).filter(e=> ((!e.isMonster && !e.isMinion) && !e.dead));
        let target;
        if(caller.isMonster || caller.isMinion){
            let sortedTargets = targetToAvoid && liveFighters.length > 1 ? liveFighters.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>b.depth - a.depth) : liveFighters.sort((a,b)=>b.depth - a.depth);
            console.log('target to avoid: ', targetToAvoid);
            if(caller.type === 'djinn'){
                console.log('sorted Targets: ', sortedTargets)
            }
            
            // target = this.pickRandom(sortedTargets);



            // this.pickRandom(sortedTargets.slice(0,2))
            
            target = sortedTargets.length > 1 ? sortedTargets[0] : sortedTargets[0];
            // teamates = liveMonsters.filter(e=> e.id !== caller.id);
        } else {
            target = targetToAvoid ? this.pickRandom(liveMonsters.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>b.depth - a.depth)) : this.pickRandom(liveMonsters) 
        }
        if(!target){
            this.combatOver = true;
            return
        }
        target.targettedBy.push(caller.id)
        const attack = this.chooseAttackType(caller, target);
        caller.targetId = target.id
        caller.pendingAttack = attack;
    }
    this.processMove = (caller) => {
        if(caller.dead || this.combatOver) return;

        if(this.fighterAI.roster[caller.name]){
            this.fighterAI.roster[caller.name].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }
        // console.log('caller.type: ', caller.type)
        if(this.monsterAI.roster[caller.type]){
            // console.log('roster found for', caller.type)
            this.monsterAI.roster[caller.type].processMove(caller, this.combatants, this.hitsTarget, this.missesTarget);
            return
        }


        // if(caller.isMonster) console.log('monster in process move')
        const liveCombatants = Object.values(this.combatants).filter(e=> (!e.dead && e.id !== caller.id));
        if(this.fighterAI.roster[caller.name]){
            this.fighterAI.roster[caller.name].processMove(caller, this.combatants);
            this.updateCoordinates(caller);
            liveCombatants.forEach(e=>{
                if(caller.position === e.position && caller.depth === e.depth){
                    e.hasOverlap = true;
                    this.handleOverlap(e)
                }
            });
            return
        }

        const target = this.combatants[caller.targetId]
        const distanceToTarget = this.getDistanceToTarget(caller, target),
        laneDiff = this.getLaneDifferenceToTarget(caller, target)
        let newPosition, newDepth;
        const targetInRange = this.targetInRange(caller)
        if(!targetInRange && caller.pendingAttack){
            let moveBackLots = caller.pendingAttack.range === 'far' && distanceToTarget < 2
            newDepth = caller.isMonster || caller.isMinion ? 
            (distanceToTarget > -1 ? caller.depth+1 : caller.depth-1) : 
            (moveBackLots ? caller.depth-3 :
            (distanceToTarget < 1 ? caller.depth-1 : caller.depth+1))
        } else {
            newDepth = caller.depth
        }

        // RE-POSITION
        if(laneDiff < 0){
            newPosition = caller.position - 1
        } else if(laneDiff > 0){
            newPosition = caller.position + 1
        } else {
            newPosition = caller.position
        }

        if(liveCombatants.some(e=>e.position === newPosition && e.depth === newDepth)){
            let targetPosition = {x: newDepth, y: newPosition};
            let downspace = targetPosition.y + 1;
            let upspace = targetPosition.y - 1
            let upSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y - 1);
            let downSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y + 1);
            let upPref = this.pickRandom([false, true])
            if(upPref){
                if(!upSpaceOccupied && upspace >= 0){
                    newPosition = targetPosition.y-1;
                } else if(!downSpaceOccupied && downspace <= MAX_LANES-1){
                    newPosition = targetPosition.y+1;
                } else {
                    newPosition = caller.position;
                    newDepth = caller.depth;
                }
            } else {
                if(!downSpaceOccupied && downspace <= MAX_LANES-1){
                    newPosition = targetPosition.y+1;
                } else if(!upSpaceOccupied && upspace >= 0){
                    newPosition = targetPosition.y-1;
                } else {
                    newPosition = caller.position;
                    newDepth = caller.depth;
                }
            }
        }

        if(newPosition < 0) newPosition = 0
        if(newPosition > MAX_LANES) newPosition = MAX_LANES;
        if(newDepth < 0) newDepth = 0
        if(newDepth > MAX_DEPTH) newDepth = MAX_DEPTH;

        //set new values
        if(newDepth !== undefined) caller.depth = newDepth;
        // if(caller.name === 'Sardonis'){
        //     console.log('actual setting of new position: ', newPosition);
        // }
        if(newPosition !== undefined) caller.position = newPosition;

        caller.coordinates = {x: newDepth, y: newPosition}

        if(caller.position === undefined){
            console.log('position undefined');
            debugger
        }
        
        this.updateCoordinates(caller);
        liveCombatants.forEach(e=>{
            if(caller.position === e.position && caller.depth === e.depth){
                e.hasOverlap = true;
                this.handleOverlap(e)
            }
        })
    }
    this.checkOverlap = (combatant) => {
        const liveCombatants = Object.values(this.combatants).filter(e=> (e.id !== combatant.id && !e.dead));
        if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position)) combatant.hasOverlap = true;
        if(combatant.hasOverlap) this.handleOverlap(combatant);
    }
    this.handleOverlap = (combatant) => {
        const liveCombatants = Object.values(this.combatants).filter(e=> (e.id !== combatant.id && !e.dead));
        let depthAvailable = false;
        if(combatant.isMonster || combatant.isMinion){
            while(!depthAvailable){
                if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position)){
                    depthAvailable = false;
                    if(combatant.depth !== MAX_DEPTH){
                        combatant.coordinates.x = combatant.depth + 1
                        combatant.depth ++
                    } else {
                        const goUp = this.pickRandom([true, false])
                        if(goUp && combatant.position !== 0){
                            if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position - 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.position - 1
                                combatant.position--
                            }
                        } else if(!goUp && combatant.position !== MAX_LANES-1){
                            if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position + 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.position + 1
                                combatant.position++
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
                if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position)){
                    depthAvailable = false;
                    if(combatant.depth > 0){
                        combatant.coordinates.x = combatant.depth - 1
                        combatant.depth--
                    } else {
                        const goUp = this.pickRandom([true, false])
                        if(goUp && combatant.position !== 0){
                            if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position - 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.y = combatant.position - 1
                                combatant.position--
                            }
                        } else if(!goUp && combatant.position !== MAX_LANES-1){
                            if(liveCombatants.some(e=>e.depth === combatant.depth && e.position === combatant.position + 1)){
                                depthAvailable = true;
                            } else {
                                combatant.coordinates.x = combatant.depth + 1
                                combatant.position++
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
    this.clearTargetListById = (targetId) => {
        const combatants = Object.values(this.combatants)
        combatants.forEach(e=>{
            e.targettedBy = e.targettedBy.filter(id=> id !== targetId)
            if(e.targetId === targetId) e.targetId = null;
        })
    }
    this.hitsTarget = (caller) => {
        let target = this.getCombatant(caller.targetId);
        if(!target) return
        target.wounded = true;
        let damage = caller.atk;
        if(target.weaknesses.includes[caller.pendingAttack.type]){
            damage += Math.floor(damage/2)
        }
        // if(caller.type==='sphinx'){
        //     console.log(`---------Sphinx hits ${target.name} for ${damage} damage, target: `, target, target.hp);
        // }
        caller.readout.result = `hits ${target.name} for ${damage} damage`
        target.hp -= damage;
        caller.energy += caller.stats.fort * 3 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        if(target.hp <= 0){
            target.hp = 0;
            // target.dead = true;
            caller.targetId = null;
            this.targetKilled(target);
            // setTimeout(()=>{
            // }, 750)
        } else {
            if((target.isMinion || target.isMonster) && target.depth < MAX_DEPTH && caller.pendingAttack.range !== 'far') target.depth++
            if((!target.isMinion && !target.isMonster) && target.depth > 0 && caller.pendingAttack.range !== 'far') target.depth--
            this.checkOverlap(target)
            this.updateCoordinates(caller)
        }
        setTimeout(()=>{
            caller.active = false;
            caller.tempo = 1;
            caller.turnCycle();
        }, FIGHT_INTERVAL * 50)
        setTimeout(()=>{
            caller.attacking = caller.attackingReverse = false;
            target.wounded = false;
        }, FIGHT_INTERVAL * 100)
        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
        
    }
    this.missesTarget = (caller) => {
        caller.missed = true;
        caller.readout.result = `misses`
        setTimeout(()=>{
            caller.active = false;
            caller.attacking = caller.attackingReverse = false;
            caller.missed = false;
            caller.tempo = 1;
            caller.turnCycle();
        }, FIGHT_INTERVAL * 50)

        setTimeout(()=>{
            caller.readout.action = ''
            caller.readout.result = ''
        }, 1500)
    }

    this.targetKilled = (combatant) => {
        combatant.dead = true;
        this.clearTargetListById(combatant.id)
        const allMonstersDead = Object.values(this.combatants).filter(e=> (e.isMonster || e.isMinion) && !e.dead).length === 0;
        const allCrewDead = Object.values(this.combatants).filter(e=>!e.isMonster && !e.isMinion).every(e=>e.dead)
        this.onFighterDeath(combatant.id);
        console.log('target killed, GO check: allMonstersDead, ', allMonstersDead, 'allCrewDead', allCrewDead, 'all combatants: ', this.combatants);
        if(allMonstersDead || allCrewDead){

            let outcome = allMonstersDead ? 'crewWins' : 'monstersWin';
    
                // this.onFighterDeath(outcome);
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
}