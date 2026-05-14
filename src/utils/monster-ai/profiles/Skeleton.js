// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';

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

    const { resolveTarget, isTargetInRange, getBestAttackSourceTile } = MonsterTargetingHelpers;

    this.faceTargetImmediately = (caller, combatants) => {
        if (!caller || !caller.targetId || !combatants) return;
        const target = combatants[caller.targetId];
        if (!target || target.dead || target.isVCT || !target.coordinates || !caller.coordinates) return;

        if (target.coordinates.x === caller.coordinates.x) {
            caller.facing = target.coordinates.y > caller.coordinates.y ? 'down' : 'up';
        } else {
            caller.facing = target.coordinates.x > caller.coordinates.x ? 'right' : 'left';
        }

        // Clear pending/debounced facing state so this immediate update is not
        // delayed or overridden by the global recalculateFacing debounce.
        caller._pendingFacing = null;
        caller._pendingFacingCount = 0;
    }

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler'
    }
    this.acquireTarget = (caller, combatants) => {
    const { AcquireTargetMethods } = require('../../shared-ai-methods/acquire-target-methods');
    const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        this.faceTargetImmediately(caller, combatants);
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
            case 'brawler': {
                this.faceTargetImmediately(caller, combatants);
                // Close in on target every era
                data.methods.closeTheGap(caller, combatants);
                this.faceTargetImmediately(caller, combatants);

                // Attack trigger
                const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                // Repopulate pendingAttack if cleared by restartTurnCycle
                if (!caller.pendingAttack) {
                    const repopTarget = resolveTarget(caller, combatants);
                    if (repopTarget) {
                        caller.pendingAttack = this.chooseAttackType(caller, repopTarget);
                    }
                }
                if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking && caller.pendingAttack) {
                    const target = resolveTarget(caller, combatants);
                    if (target && isTargetInRange(caller, target, caller.pendingAttack)) {
                        era.attacked = true;
                        this.initiateAttack(caller, combatants);
                    }
                }
                break;
            }
            case 'panicked':
            case 'melee':
            default:
                break;
        }
        this.faceTargetImmediately(caller, combatants);
    }

    this.triggerClawAttack = async (caller, target) => {
        // Use the animation manager's canvas-based clawSwipe
        if (this.animationManager && typeof this.animationManager.clawSwipe === 'function') {
            const sourceCoords = getBestAttackSourceTile(caller, target);
            const sourceTileId = this.animationManager.getTileIdByCoords(sourceCoords);
            const targetTileId = this.animationManager.getTileIdByCoords(target.coordinates);
            if (sourceTileId == null || targetTileId == null) return target;
            await new Promise(resolve => {
                this.animationManager.clawSwipe(targetTileId, sourceTileId, caller.facing, resolve);
            });
        }
        return target;
    }
    this.initiateAttack = async (caller, combatants) => {
        if (caller.attacking) return;
        const target = resolveTarget(caller, combatants);
        caller.attacking = true;
        try {
        if (!target || target.dead) {
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
                        const bestSource = getBestAttackSourceTile(caller, target);

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
        } finally {
            caller.attacking = false;
        }
    }
}