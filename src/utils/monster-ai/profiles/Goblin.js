import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';

export function Goblin(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.kickoffSpecialCooldown = utilMethods.kickoffSpecialCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackType = utilMethods.chooseAttackType;
    this.getCurrentInventory = utilMethods.getCurrentInventory;
    this.stealItem = utilMethods.stealItem;
    this.escapeFromCombat = utilMethods.escapeFromCombat;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    }

    this.acquireTarget = (caller, combatants) => {
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        if (target.isVCT) {
            caller.targetId = null;
            caller.pendingAttack = null;
            return;
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }

    // Returns true when the goblin is orthogonally adjacent to its target.
    this._isAdjacentToTarget = (caller, combatants) => {
        const target = Object.values(combatants).find(e => e.id === caller.targetId);
        if (!target || target.isVCT) return false;
        const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
        const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
        return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
    }

    // Steal a random non-equipped item from the communal inventory.
    // Returns true if a theft occurred.
    this.triggerStickyFingers = (caller, target, stickySpecial) => {
        // Deduct energy cost and start cooldown
        if (stickySpecial) {
            caller.energy = Math.max(0, (caller.energy || 0) - (stickySpecial.energy_cost || 100));
            this.kickoffSpecialCooldown(stickySpecial);
        }

        let inventory = [];
        try { inventory = this.getCurrentInventory() || []; } catch (e) {}

        // Only steal non-equipped, non-null items
        const stealable = inventory.filter(item =>
            item &&
            item.equippedSlot == null &&
            item.equippedBy == null
        );

        if (stealable.length === 0) return false;

        const stolen = stealable[Math.floor(Math.random() * stealable.length)];
        const itemKey = stolen._im_key || stolen.name || 'item';
        const displayName = stolen.name || itemKey.replaceAll('_', ' ');

        // Push "Robbed!" floating indicator on the victim
        if (target) {
            if (!Array.isArray(target.damageIndicators)) target.damageIndicators = [];
            const indId = Date.now() + Math.random();
            const indObj = { id: indId, value: 'Robbed!', source: 'Goblin' };
            target.damageIndicators.push(indObj);
            setTimeout(() => {
                const idx = target.damageIndicators.findIndex(e => e && e.id === indId);
                if (idx !== -1) target.damageIndicators.splice(idx, 1);
                if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
            }, 2000);
        }

        // Remove item from inventory and report for battle summary
        try { this.stealItem(itemKey, displayName); } catch (e) {}

        // Record stolen item on the goblin so it flees with it
        caller.stolenItem = displayName;
        caller.isFleeing = true;
        caller.targetId = null;

        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
        return true;
    }

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        // If fleeing with stolen goods, move toward the backline (increasing x).
        if (caller.isFleeing) {
            const backlineX = this.MAX_DEPTH - 1;
            if (caller.coordinates.x >= backlineX) {
                // Reached edge — escape from combat
                try { this.escapeFromCombat(caller.id); } catch (e) {}
            } else {
                caller.coordinates = { x: caller.coordinates.x + 1, y: caller.coordinates.y };
                if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
            }
            return;
        }

        if (this._isAdjacentToTarget(caller, combatants)) {
            return;
        }

        data.methods.closeTheGap(caller, combatants);
    }

    this.initiateAttack = (caller, combatants) => {
        if (caller.isFleeing) return;

        const target = Object.values(combatants).find(e => e.id === caller.targetId);
        if (!target || target.dead || target.isVCT) return;

        if (!caller.pendingAttack) {
            caller.pendingAttack = this.chooseAttackType(caller, target);
        }
        if (!caller.pendingAttack) return;

        const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
        const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
        const inRange = (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
        if (!inRange) return;

        // 15% chance to attempt sticky fingers when adjacent, energy available, and off cooldown
        const stickySpecial = Array.isArray(caller.specials)
            ? caller.specials.find(s => s && s.name === 'sticky_fingers' && s.cooldown_position >= 100)
            : null;
        const energyCost = stickySpecial ? (stickySpecial.energy_cost || 100) : 100;

        if (stickySpecial && (caller.energy || 0) >= energyCost && Math.random() < 0.15) {
            this.triggerStickyFingers(caller, target, stickySpecial);
            return;
        }

        const hitRoll = Math.random();
        if (hitRoll > 0.25) {
            this.hitsTarget(caller, target, caller.pendingAttack);
        } else {
            this.missesTarget(caller, target, caller.pendingAttack);
        }
        this.kickoffAttackCooldown(caller, caller.pendingAttack);
    }

    this.handleOverlap = (caller, combatants) => {
        if (caller.isFleeing) return;
        data.methods.closeTheGap(caller, combatants);
    }
}

