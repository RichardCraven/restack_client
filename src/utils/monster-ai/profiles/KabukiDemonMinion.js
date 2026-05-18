// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';
import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';

export function KabukiDemonMinion(data, utilMethods, animationManager, overlayManager) {
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.kickoffSpecialCooldown = utilMethods.kickoffSpecialCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackTypeDefault = utilMethods.chooseAttackType;

    const { resolveTarget, isTargetInRange, getBestAttackSourceTile } = MonsterTargetingHelpers;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'skirmisher';
    };

    this.acquireTarget = (caller, combatants) => {
        const currentTarget = caller && caller.targetId ? combatants[caller.targetId] : null;
        const currentTargetIsValid = !!(
            currentTarget &&
            !currentTarget.dead &&
            !currentTarget.invisible &&
            !currentTarget.isVCT &&
            !currentTarget.isMonster &&
            !currentTarget.isMinion
        );

        if (currentTargetIsValid) {
            if (!caller.pendingAttack) {
                caller.pendingAttack = this.chooseAttackType(caller, currentTarget);
            }
            return;
        }

        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants)
            || AcquireTargetMethods.acquireClosestEnemy(caller, combatants);
        if (!target) {
            caller.targetId = null;
            caller.pendingAttack = null;
            return;
        }

        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target);
    };

    this.chooseAttackType = (caller, target) => {
        if (!caller || !Array.isArray(caller.attacks) || !target) return null;

        const available = caller.attacks.filter((a) => a && a.cooldown_position === 100);
        if (available.length === 0) return null;

        const byName = (name) => available.find((a) => a.name === name);
        const dx = Math.abs((caller.coordinates?.x || 0) - (target.coordinates?.x || 0));
        const dy = Math.abs((caller.coordinates?.y || 0) - (target.coordinates?.y || 0));
        const dist = dx + dy;

        if (dist === 1) return byName('claws') || this.chooseAttackTypeDefault(caller, target);
        if (dist <= 3) return byName('major magic missile') || byName('void lance') || this.chooseAttackTypeDefault(caller, target);
        return byName('void lance') || byName('major magic missile') || this.chooseAttackTypeDefault(caller, target);
    };

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }

        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        switch (caller.behaviorSequence) {
            case 'skirmisher':
            default: {
                let target = resolveTarget(caller, combatants);
                if (!target || target.dead) {
                    this.acquireTarget(caller, combatants);
                    target = resolveTarget(caller, combatants);
                }
                if (!target || target.dead) break;

                data.methods.closeTheGap(caller, combatants);

                const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                if (!caller.pendingAttack) {
                    caller.pendingAttack = this.chooseAttackType(caller, target);
                }

                if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking && caller.pendingAttack) {
                    target = resolveTarget(caller, combatants);
                    if (target && isTargetInRange(caller, target, caller.pendingAttack)) {
                        era.attacked = true;
                        this.initiateAttack(caller, combatants);
                    }
                }
                break;
            }
        }
    };

    this.initiateAttack = async (caller, combatants) => {
        if (caller.attacking) return;
        const target = resolveTarget(caller, combatants);
        if (!target || !caller.pendingAttack || caller.dead) return;

        caller.attacking = true;
        try {
            const attack = caller.pendingAttack;

            if (attack.type === 'special' && attack.name === 'invisibility') {
                if (caller.energy >= (attack.energy_cost || 0)) {
                    caller.invisible = true;
                    caller.invisible_eras = Number(attack.duration) || 3;
                    caller.energy = Math.max(0, (caller.energy || 0) - (attack.energy_cost || 0));
                    this.kickoffSpecialCooldown(attack);
                    if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(caller);
                }
                caller.pendingAttack = null;
                return;
            }

            if (attack.name === 'void lance' && this.animationManager && typeof this.animationManager.voidLance === 'function') {
                try {
                    const travelMs = await this.animationManager.voidLance(caller.coordinates, target.coordinates);
                    const settleDelay = Math.max(80, Number(travelMs) || 0);
                    if (settleDelay > 0) await new Promise((resolve) => setTimeout(resolve, settleDelay));
                } catch (e) {
                    // Non-fatal animation failure; continue combat flow.
                }
                this.hitsCombatant(caller, target);
                this.kickoffAttackCooldown(caller);
                caller.pendingAttack = null;
                return;
            }

            if (attack.name === 'claws' && this.animationManager && typeof this.animationManager.clawSwipe === 'function') {
                try {
                    const sourceTileId = this.animationManager.getTileIdByCoords(caller.coordinates);
                    const targetTileId = this.animationManager.getTileIdByCoords(target.coordinates);
                    if (sourceTileId != null && targetTileId != null) {
                        await new Promise((resolve) => {
                            this.animationManager.clawSwipe(targetTileId, sourceTileId, caller.facing, resolve);
                        });
                    }
                } catch (e) {
                    // Non-fatal animation failure; continue combat flow.
                }
                this.hitsCombatant(caller, target);
                this.kickoffAttackCooldown(caller);
                caller.pendingAttack = null;
                return;
            }

            try {
                const bestSource = getBestAttackSourceTile(caller, target);
                if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                    await this.animationManager.triggerAttackAnimation({
                        coordinates: bestSource,
                        facing: caller.facing,
                        icon: attack.icon,
                        type: attack.name || 'grasp',
                        selectedAction: attack,
                    });
                }
            } catch (e) {
                // Keep going even if visuals fail.
            }

            this.hitsCombatant(caller, target);
            this.kickoffAttackCooldown(caller);
            caller.pendingAttack = null;
        } finally {
            caller.attacking = false;
        }
    };
}
