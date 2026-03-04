import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';

export function Goblin(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackType = utilMethods.chooseAttackType;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    }

    this.acquireTarget = (caller, combatants) => {
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }

    // Returns true when the goblin is orthogonally adjacent (close range) to its target.
    this._isAdjacentToTarget = (caller, combatants) => {
        const target = Object.values(combatants).find(e => e.id === caller.targetId);
        if (!target) return false;
        const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
        const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
        // Orthogonally adjacent = exactly 1 step in one axis, same position in the other.
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        // Already adjacent — stay in place and let the attack system handle damage.
        // Without this guard, closeTheGap keeps being called every tick and the goblin
        // oscillates (steps down then back up, etc.) even when it's right next to its target.
        if (this._isAdjacentToTarget(caller, combatants)) {
            return;
        }

        switch (caller.behaviorSequence) {
            case 'brawler':
                data.methods.closeTheGap(caller, combatants);
                break;
            default:
                data.methods.closeTheGap(caller, combatants);
                break;
        }
    }

    this.initiateAttack = (caller, combatants) => {
        const target = Object.values(combatants).find(e => e.id === caller.targetId);
        if (!target || target.dead) return;
        if (!caller.pendingAttack) {
            caller.pendingAttack = this.chooseAttackType(caller, target);
        }
        if (!caller.pendingAttack) return;

        const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
        const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
        const inRange = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);

        if (!inRange) return;

        const hitRoll = Math.random();
        if (hitRoll > 0.25) {
            this.hitsTarget(caller, target, caller.pendingAttack);
        } else {
            this.missesTarget(caller, target, caller.pendingAttack);
        }
        this.kickoffAttackCooldown(caller, caller.pendingAttack);
    }

    this.handleOverlap = (caller, combatants) => {
        data.methods.closeTheGap(caller, combatants);
    }
}
