import { Sage } from './profiles/Sage'
import { Wizard } from './profiles/Wizard'
import { Rogue } from './profiles/Rogue'
import { Soldier } from './profiles/Soldier'
import {Methods} from '../shared-ai-methods/basic-methods';
import {MovementMethods} from '../shared-ai-methods/movement-methods';

export function FighterAI(MAX_DEPTH, MAX_LANES, INTERVAL_TIME){
    this.MAX_DEPTH = MAX_DEPTH;
    this.MAX_LANES = MAX_LANES;
    this.INTERVAL_TIME = INTERVAL_TIME

    this.methods = {
        ...Methods,
        ...MovementMethods
    }

    this.connectAnimationManager = (instance) => {
        this.initializeRoster(instance)
    }
    this.connectUtilMethods = (utilMethods) => {
        this.fighterFacingUp = utilMethods.fighterFacingUp;
        this.fighterFacingDown = utilMethods.fighterFacingDown;
        this.fighterFacingRight = utilMethods.fighterFacingRight;
        this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
        this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
        this.missesTarget = utilMethods.missesTarget;
        this.hitsTarget = utilMethods.hitsTarget;
        this.hitsCombatant = utilMethods.hitsCombatant;
        this.targetKilled = utilMethods.targetKilled;
        this.utilMethods = {
            fighterFacingDown:this.monsterFacingDown,
            fighterFacingUp: this.monsterFacingUp,
            fighterFacingRight: this.fighterFacingRight,
            broadcastDataUpdate: this.broadcastDataUpdate,
            kickoffAttackCooldown: this.kickoffAttackCooldown,
            missesTarget: this.missesTarget,
            hitsTarget: this.hitsTarget,
            hitsCombatant: this.hitsCombatant,
            targetKilled: this.targetKilled
        }
    }
    this.initializeRoster = (animationManager) => {
        this.roster = {
            sage: new Sage(data, this.utilMethods, this.animationManager, this.overlayManager),
            wizard: new Wizard(data, this.utilMethods, animationManager),
            soldier: new Soldier(data, this.utilMethods, animationManager),
            rogue: new Rogue(data, this.utilMethods, this.animationManager, this.overlayManager)
        }
    }

    //UTILS
    this.getLaneDifferenceToTarget = (caller, target) => {
        //THIS SHOULDNT NEED TO BE HERE, REMOVE
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
        if((distanceToTarget < 0 && laneDiff !== 0) ||  
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
        // const target = combatants[caller.targetId];
    }

    const soldier = {
        processMove: (caller, combatants) => {
            this.methods.moveTowardsCloseEnemyTarget(caller, combatants);
        },
        acquireTarget: (caller, combatants, targetToAvoid = null) => {
            const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
            const sorted = (targetToAvoid && liveEnemies.length > 1) ?  liveEnemies.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>a.depth - b.depth) : liveEnemies.sort((a,b)=>a.depth - b.depth);
            const target = sorted[0];
            // console.log('soldiers target: ', target);

            caller.pendingAttack = this.chooseAttackType(caller, target);
            caller.targetId = target.id;
        },
        initiateAttack: (caller, manualAttack, combatants) => {
            if(!caller) return
            const target = combatants[caller.targetId];
            if(!target) return
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
            caller.active = true;
            caller.attacking = true;
            this.broadcastDataUpdate();
            caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
            this.kickoffAttackCooldown(caller)
            if(connects){
                if(manualAttack){
                    this.hitsTarget(caller, target)
                } else {
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
    }

    const data = {
        methods: {
            ...Methods,
            ...MovementMethods
        },
        MAX_DEPTH: this.MAX_DEPTH,
        MAX_Lanes: this.MAX_LANES,
        INTERVAL_TIME: this.INTERVAL_TIME
    }
}