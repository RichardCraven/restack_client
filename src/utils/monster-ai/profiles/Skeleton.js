export function Skeleton(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;
    
    // this.monsterFacingUp = utilMethods.monsterFacingUp;
    // this.monsterFacingDown = utilMethods.monsterFacingDown;
    // this.monsterFacingRight = utilMethods.monsterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackType = utilMethods.chooseAttackType

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler'
    }
    this.acquireTarget = (caller, combatants) => {
    const { AcquireTargetMethods } = require('../../shared-ai-methods/acquire-target-methods');
    const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }
    this.handleOverlap = (caller,combatants) => {
        data.methods.closeTheGap(caller, combatants)
        if(caller.targetId){
            // data.methods.
            data.methods.evade(caller, combatants)
        }
    }
    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            debugger;
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);
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
            default:
            break;
        }
        // After moving, update facing to face target if one exists
        if (caller.targetId && combatants[caller.targetId] && !caller.facingLocked) {
            const target = combatants[caller.targetId];
            // Only update facing if not currently facing up/down, or if target is not above/below
            if (caller.facing === 'up' || caller.facing === 'down') {
                // If still targeting up/down, keep facing
                if (caller.coordinates.x === target.coordinates.x) {
                    caller.facing = (caller.coordinates.y > target.coordinates.y) ? 'up' : 'down';
                } else {
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
            } else {
                // If targeting up/down, set facing up/down
                if (caller.coordinates.x === target.coordinates.x) {
                    caller.facing = (caller.coordinates.y > target.coordinates.y) ? 'up' : 'down';
                } else {
                    caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
                }
            }
        }
    }

    this.triggerClawAttack = (callerCoords, targetCoords, id = null) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
        // Lock facing for the duration of the animation
        const monster = id ? (typeof id === 'string' ? id : null) : null;
        let originalFacing = null;
        if (monster) {
            // If we have a monster id, try to lock its facing
            const combatant = typeof monster === 'string' && window?.combatManager?.combatants?.[monster];
            if (combatant) {
                originalFacing = combatant.facing;
            }
        }
        return new Promise((resolve) => {
            if(sourceTileId !== null){
                // Prevent facing changes for the duration of the animation
                if (monster && window?.combatManager?.combatants?.[monster]) {
                    window.combatManager.combatants[monster].facingLocked = true;
                }
                this.animationManager.clawToTarget(targetTileId, sourceTileId, (result) => {
                    // Unlock facing after animation
                    if (monster && window?.combatManager?.combatants?.[monster]) {
                        window.combatManager.combatants[monster].facingLocked = false;
                    }
                    resolve(result);
                });
            }
        })
    }
    this.initiateAttack = async (caller, combatants) => {
        const target = combatants[caller.targetId];
        caller.attacking = true
        if(!target){
            console.log('NO TARGET!');
            return;
        }
        let combatantHit;
        switch(caller.pendingAttack.name){
            case 'claws':
                combatantHit = await this.triggerClawAttack(caller.coordinates, target.coordinates, caller.id)
                if(combatantHit){
                    const supplementalData = {increasedCritChance: false}
                    this.hitsCombatant(caller, combatantHit, supplementalData);
                } else {
                    this.missesTarget(caller);
                }

            break;
            default:
                // Fallback: for attacks not explicitly animated here (eg. void_lance,
                // magic_missile when using the skeleton AI as a fallback), apply
                // damage directly so monsters still hurt players.
                try {
                    if (target) {
                        // Use hitsCombatant to ensure wounded/damageIndicators are set
                        this.hitsCombatant(caller, target);
                    }
                } catch (e) {
                    console.warn('Fallback attack failed in Skeleton.initiateAttack', e);
                }
            break;
        }
        this.kickoffAttackCooldown(caller)
        caller.pendingAttack = null;
    }
}