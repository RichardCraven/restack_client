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
        // facing is handled by recalculateFacing in combat-manager.processMove
    }

    this.triggerClawAttack = async (caller, target) => {
        // Use the animation manager's canvas-based clawSwipe
        if (this.animationManager && typeof this.animationManager.clawSwipe === 'function') {
            const sourceTileId = this.animationManager.getTileIdByCoords(caller.coordinates);
            const targetTileId = this.animationManager.getTileIdByCoords(target.coordinates);
            if (sourceTileId == null || targetTileId == null) return target;
            await new Promise(resolve => {
                this.animationManager.clawSwipe(targetTileId, sourceTileId, caller.facing, resolve);
            });
        }
        return target;
    }
    this.initiateAttack = async (caller, combatants) => {
        const target = combatants[caller.targetId];
        caller.attacking = true;
        if (!target || target.dead) {
            caller.attacking = false;
            return;
        }
        let combatantHit;
        switch (caller.pendingAttack.name) {
            case 'claws':
                combatantHit = await this.triggerClawAttack(caller, target);
                if (combatantHit) {
                    const supplementalData = { increasedCritChance: false };
                    this.hitsCombatant(caller, combatantHit, supplementalData);
                } else {
                    this.missesTarget(caller);
                }
                break;
            default:
                // Fallback: for attacks not explicitly animated here (eg. bite, crush, tackle),
                // trigger a generic attack animation so humans can see the icon and timing.
                try {
                    if (target) {
                        // Determine the best source tile for the animation (for large monsters)
                        const allSourceCoords = (Array.isArray(caller.occupiedCoords) && caller.occupiedCoords.length > 0)
                            ? caller.occupiedCoords
                            : [caller.coordinates];

                        // Pick the tile closest to the target
                        let bestSource = caller.coordinates;
                        let minDist = Infinity;
                        allSourceCoords.forEach(c => {
                            const d = Math.abs(c.x - target.coordinates.x) + Math.abs(c.y - target.coordinates.y);
                            if (d < minDist) {
                                minDist = d;
                                bestSource = c;
                            }
                        });

                        // Trigger the visual icon flash/animation
                        if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                            await this.animationManager.triggerAttackAnimation({
                                coordinates: bestSource,
                                facing: caller.facing,
                                icon: caller.pendingAttack?.icon,
                                type: caller.pendingAttack?.name || 'grasp', // fallback animation type
                                selectedAction: caller.pendingAttack
                            });
                        }

                        // Use hitsCombatant to ensure wounded/damageIndicators are set
                        this.hitsCombatant(caller, target);
                    }
                } catch (e) {
                    console.warn('Fallback attack failed in Skeleton.initiateAttack', e);
                }
                break;
        }
        this.kickoffAttackCooldown(caller);
        caller.pendingAttack = null;
        caller.attacking = false;
    }
}