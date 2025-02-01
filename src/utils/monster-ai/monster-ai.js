import { Djinn } from './profiles/Djinn'
import { Sphinx } from './profiles/Sphinx'
import {Methods} from './methods/basic-methods';
import {MonsterMovementMethods} from './methods/monster-movement-methods';

export function MonsterAI(MAX_DEPTH, MAX_LANES, INTERVAL_TIME){
    this.MAX_DEPTH = MAX_DEPTH;
    this.MAX_LANES = MAX_LANES;
    this.INTERVAL_TIME = INTERVAL_TIME

    const data = {
        methods: {
            ...Methods,
            ...MonsterMovementMethods,

        },
        MAX_DEPTH: this.MAX_DEPTH,
        MAX_LANES: this.MAX_LANES,
        INTERVAL_TIME: this.INTERVAL_TIME
    }

    // this.roster = {
    //     djinn: new Djinn(data)
    // }
    this.connectUtilMethods = (utilMethods) => {
        // console.log('util methods: ', utilMethods);
        this.monsterFacingUp = utilMethods.monsterFacingUp;
        this.monsterFacingDown = utilMethods.monsterFacingDown;
        this.monsterFacingRight = utilMethods.monsterFacingRight;
        this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
        this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
        this.missesTarget = utilMethods.missesTarget;
        this.hitsTarget = utilMethods.hitsTarget;
        this.utilMethods = {
            monsterFacingDown:this.monsterFacingDown,
            monsterFacingUp: this.monsterFacingUp,
            monsterFacingRight: this.monsterFacingRight,
            broadcastDataUpdate: this.broadcastDataUpdate,
            kickoffAttackCooldown: this.kickoffAttackCooldown,
            missesTarget: this.missesTarget,
            hitsTarget: this.hitsTarget
        }
    }

    this.connectOverlayManager = (instance) => {
        this.overlayManager = instance;
    }
    this.connectAnimationManager = (instance) => {
        this.animationManager = instance;
    }

    this.initializeRoster = () => {
        this.roster = {
            djinn: new Djinn(data, this.utilMethods, this.animationManager, this.overlayManager),
            sphinx: new Sphinx(data, this.utilMethods, this.animationManager, this.overlayManager)
        }
    }

    this.methods = {
        ...Methods,
        ...MonsterMovementMethods
    }

    //UTILS
    this.getLaneDifferenceToTarget = (caller, target) => {
        if(!target) return 0;
        let d =  target.position - caller.position
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
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;
        const distanceToTarget = this.methods.getDistanceToTarget(caller, target);

        if(distanceToTarget === 1 && available.find(e=>e.range === 'close')){
            attack = available.find(e=>e.range === 'close');
            return attack;
        }

        if(available.length === 0){
            // choose the attack that is closest to 100 percent
            
            caller.attacks.filter(e=>e.range === 'medium' || e.range === 'far').forEach(e=>{
                if(e.cooldown_position > percentCooledDown){
                    percentCooledDown = e.cooldown_position;
                    chosenAttack = e;
                }
            })
            attack = chosenAttack;
        } else {
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
                attack = data.methods.pickRandom(available);
            }
        }
        return attack
    }
    this.isAnEnemyDirectlyInFrontOfMe = function(caller, combatants){
        if(!combatants) return false
        const liveEnemies = Object.values(combatants).filter(e=>e.isMonster || (e.isMinion && !e.dead)),
        directlyInFront = liveEnemies.some(e=>e.depth === caller.depth + 1 && e.position === caller.position);
        return directlyInFront ? liveEnemies.find(e=>e.depth === caller.depth + 1 && e.position === caller.position) : null;
    }
    this.moveTowardsCloseFriendlyTarget = (caller, combatants) => {
        let newPosition, newDepth;
        let liveCombatants = Object.values(combatants).filter(e=>!e.dead)
        const friendlyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = this.methods.getDistanceToTarget(caller, friendlyTarget),
        laneDiff = this.methods.getLaneDifferenceToTarget(caller, friendlyTarget)
        if(laneDiff === 1 || laneDiff === -1){
            console.log('LORYASTES: adjacent lane');
            if(distanceToTarget === 0){
                console.log('LORYASTES: UP OR DOWN ADJACENT');


            }
        } else if(laneDiff < -1){
            newPosition = caller.position - 1
        } else if(laneDiff > 1){
            newPosition = caller.position + 1
        } else if(laneDiff === 0 && distanceToTarget === 1){
            console.log('LORYASTES: BEHIND ADJACENT!');
            newPosition = caller.position - 1
        }
        if((distanceToTarget < 0 && laneDiff) !== 0 ||  
        (distanceToTarget < -1 && laneDiff === 0 && caller.depth > 1)){
            caller.depth--
        } else if(distanceToTarget > 1){
            caller.depth++
        }

        if(liveCombatants.some(e=>e.position === newPosition && e.depth === newDepth)){
            let targetPosition = {x: newDepth, y: newPosition};
            let upSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y - 1);
            let downSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y + 1);
            if(!upSpaceOccupied){
                newPosition = targetPosition.y-1;
            } else if(!downSpaceOccupied){
                newPosition = targetPosition.y+1;
            } else {
                newPosition = caller.position;
                newDepth = caller.depth;
            }
        }
        
        if(newPosition < 0) newPosition = 0
        if(newPosition > this.MAX_LANES) newPosition = this.MAX_LANES;
        if(newDepth < 0) newDepth = 0
        if(newDepth > this.MAX_DEPTH) newDepth = this.MAX_DEPTH;

        //set new values
        if(newDepth !== undefined) caller.depth = newDepth;
        if(newPosition !== undefined) caller.position = newPosition;
    }

    this.moveTowardsCloseEnemyTarget = (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = this.methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = this.methods.getLaneDifferenceToTarget(caller, enemyTarget)

        // handle position

        if(laneDiff === 1 || laneDiff === -1){
            console.log('adjacent lane');
            if(distanceToTarget === 0){
                console.log('UP OR DOWN ADJACENT');
                if(caller.depth !== 0) caller.depth--
            } else if(distanceToTarget === 1){
                if(laneDiff === 1){
                    caller.position++
                } else if(laneDiff === -1){
                    caller.position--
                }
            }
        } else if(laneDiff < -1){
            caller.position--
        } else if(laneDiff > 1){
            caller.position++
        } else if(laneDiff === 0 && distanceToTarget === 1){
            console.log('********enemy right in front, dont move!')
            return
        }

        // now handle depth

        if((distanceToTarget < 0 && laneDiff !== 0) ||  
        (distanceToTarget < -1 && laneDiff === 0 && caller.depth > 1)){
            caller.depth--
        }else if(distanceToTarget === -1 && laneDiff === 0){
            console.log('enemy behind, hopscotch over');
            if(caller.depth > 1) caller.depth -= 2
        } else if(distanceToTarget > 1){
            caller.depth++
        }
    }

    this.defaultAquireTarget = (caller, combatants) => {
        // const target = combatants[caller.targetId],
        // distanceToTarget = this.methods.getDistanceToTarget(caller, target),
        // laneDiff = this.methods.getLaneDifferenceToTarget(caller, target);
        // let newPosition, newDepth;
    }
}