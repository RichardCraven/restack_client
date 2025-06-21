export function Skeleton(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;
    
    this.monsterFacingUp = utilMethods.monsterFacingUp;
    this.monsterFacingDown = utilMethods.monsterFacingDown;
    this.monsterFacingRight = utilMethods.monsterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackType = utilMethods.chooseAttackType

    this.initialize = (caller) => {
        console.log('skelly initializing')
        caller.behaviorSequence = 'brawler'
    }
    this.acquireTarget = (caller, combatants) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (!e.isMonster && !e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>a.depth - b.depth);
        const target = sorted[0];
        if(!target) return
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }
    this.handleOverlap = (caller,combatants) => {
        console.log('SKELLY handle overlap');
        debugger
    }
    this.processMove = (caller, combatants) => {
        caller.onMoveCooldown = true;
        setTimeout(()=>{
            caller.onMoveCooldown = false;
        }, 1000)
        switch(caller.behaviorSequence){
            case 'brawler':
                switch(caller.eraIndex){
                    case 0:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 1:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 2:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 3:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 4:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    default: 
                    break;
                }
            break;
            
            case 'panicked':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
            case 'melee':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
        }
    }

    this.triggerClawAttack = (callerCoords, targetCoords) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
        return new Promise((resolve) => {
            if(sourceTileId !== null){
                this.animationManager.clawToTarget(targetTileId, sourceTileId, resolve)
            }
        })
    }
    this.initiateAttack = async (caller, combatants) => {
        const target = combatants[caller.targetId];
        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);

        let combatantHit;
        if(caller.id === 817 || caller.id === 816){
            console.log('SKELLY initiate attack');
        }
        switch(caller.pendingAttack.name){
            case 'claws':
                combatantHit = await this.triggerClawAttack(caller.coordinates, target.coordinates)
                if(combatantHit){
                    const supplementalData = {increasedCritChance: false}
                    this.hitsCombatant(caller, combatantHit, supplementalData);
                } else {
                    this.missesTarget(caller);
                }

            break;
            default:
                break;
        }
        this.kickoffAttackCooldown(caller)
        caller.pendingAttack = null;
    }
}