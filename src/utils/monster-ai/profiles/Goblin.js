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
        try { inventory = this.getCurrentInventory() || []; } catch (e) { console.warn('[Goblin] getCurrentInventory threw:', e); }

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
            const indObj = { id: indId, value: 'Robbed!', source: 'Goblin', type: 'robbed' };
            target.damageIndicators.push(indObj);
            setTimeout(() => {
                const idx = target.damageIndicators.findIndex(e => e && e.id === indId);
                if (idx !== -1) target.damageIndicators.splice(idx, 1);
                if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
            }, 2000);
        }

        // Remove item from inventory and report for battle summary
        try { this.stealItem(itemKey, displayName); } catch (e) {}

        // Record stolen item on the goblin and switch to flee behavior
        caller.stolenItem = displayName;
        caller.stolenItemIcon = stolen._im_key || stolen.icon || null;
        caller.isFleeing = true;
        caller.behaviorSequence = 'flee';
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

        switch (caller.behaviorSequence) {
            case 'brawler': {
                // Move toward target if not adjacent
                if (!this._isAdjacentToTarget(caller, combatants)) {
                    data.methods.closeTheGap(caller, combatants);
                }

                // Sticky fingers check: per-era 15% chance when adjacent, energy available, off cooldown
                const target = Object.values(combatants).find(e => e.id === caller.targetId);
                const isAdj = this._isAdjacentToTarget(caller, combatants);
                if (target && !target.dead && !target.isVCT && isAdj) {
                    const allSpecials = caller.specials;
                    const sf = Array.isArray(allSpecials)
                        ? allSpecials.find(s => s && (s.name === 'sticky_fingers' || s.name === 'sticky fingers'))
                        : null;
                    const stickySpecial = sf && sf.cooldown_position >= 100 ? sf : null;
                    const energyCost = stickySpecial ? (stickySpecial.energy_cost || 100) : 100;
                    const roll = Math.random();
                    if (stickySpecial && (caller.energy || 0) >= energyCost && roll < 0.15) {
                        const stole = this.triggerStickyFingers(caller, target, stickySpecial);
                        if (stole) return; // behaviorSequence now 'flee', skip attack this era
                    }
                }

                // Attack trigger
                {
                    const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                    const attackTarget = Object.values(combatants).find(e => e.id === caller.targetId);
                    if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking &&
                            caller.pendingAttack && attackTarget && !attackTarget.dead && !attackTarget.isVCT) {
                        const dx = Math.abs(caller.coordinates.x - attackTarget.coordinates.x);
                        const dy = Math.abs(caller.coordinates.y - attackTarget.coordinates.y);
                        const dist = dx + dy;
                        const atkRange = caller.pendingAttack.range || 'close';
                        const inRange = atkRange === 'close' ? dist === 1 : atkRange === 'medium' ? dist <= 3 : dist <= 6;
                        if (inRange) {
                            era.attacked = true;
                            this.initiateAttack(caller, combatants);
                        }
                    }
                }
                break;
            }
            case 'flee': {
                const backlineX = this.MAX_DEPTH - 1;
                if (caller.coordinates.x >= backlineX) {
                    // Reached edge — escape from combat
                    try { this.escapeFromCombat(caller.id); } catch (e) {}
                } else {
                    // Use proper pathfinding toward the backline; forwardFirst=true
                    // biases movement toward East when navigating around obstacles.
                    const backlineTile = { x: backlineX, y: caller.coordinates.y };
                    data.methods.goTowards(caller, combatants, backlineTile, true);
                    if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
                    // Escape immediately if the move brought us to the backline
                    if (caller.coordinates.x >= backlineX) {
                        try { this.escapeFromCombat(caller.id); } catch (e) {}
                    }
                }
                break;
            }
            default:
                break;
        }
    }

    this.initiateAttack = (caller, combatants) => {
        if (caller.behaviorSequence === 'flee') return;

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

