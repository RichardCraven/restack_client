// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';
import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';

export function Hagigah(data, utilMethods, animationManager, overlayManager) {
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

    this._debug = () => {};

    // ── initialize ───────────────────────────────────────────────────────────
    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    };

    // ── acquireTarget ─────────────────────────────────────────────────────────
    this.acquireTarget = (caller, combatants) => {
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target);
    };

    // ── chooseAttackType ──────────────────────────────────────────────────────
    // Priority:
    //   1. If destitution is ready and there are any enemies, fire it (global AoE).
    //   2. If demon_mark is ready, fire it to mark all enemies for extra demon damage.
    //   3. If summon_skulls is ready and no skulls are alive, summon skulls.
    //   4. If hagigah_spineskin is ready and not already active, activate it.
    //   5. If invoke_darkness is ready, summon a darkness sphere.
    //   6. Otherwise fall back to default (stomp / rake / claw).
    this.chooseAttackType = (caller, target) => {
        if (!caller || !Array.isArray(caller.attacks)) return null;

        const findSpecial = (id) => Array.isArray(caller.specials)
            ? caller.specials.find((s) => s && (s.id === id || s.name === id) && s.cooldown_position === 100)
            : null;

        // 1. Destitution — global stamina drain / damage, cast eagerly
        const destitution = findSpecial('destitution');
        if (destitution && target) return destitution;

        // 2. Demon Mark — debuff all enemies so demons deal double damage
        const demonMark = findSpecial('demon_mark');
        if (demonMark && target) return demonMark;

        // 3. Summon Skulls — only if no flaming skulls are already alive
        const summonSkulls = findSpecial('summon_skulls');
        if (summonSkulls) return summonSkulls;

        // 4. Spineskin — if not currently active
        const spineskin = findSpecial('hagigah_spineskin');
        if (spineskin && !caller.spineskinActive) return spineskin;

        // 5. Invoke Darkness
        const invokeDarkness = findSpecial('invoke_darkness');
        if (invokeDarkness && target) return invokeDarkness;

        // 6. Default attack selection (stomp, rake, claw_strike…)
        return this.chooseAttackTypeDefault(caller, target);
    };

    // ── processMove ───────────────────────────────────────────────────────────
    this.processMove = (caller, combatants) => {
        if (caller && caller.dead) return;

        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        switch (caller.behaviorSequence) {
            case 'brawler': {
                const target = resolveTarget(caller, combatants);
                if (!target) {
                    this.acquireTarget(caller, combatants);
                    break;
                }

                // Always try to close the gap — Hagigah is a melee brawler at heart.
                data.methods.closeTheGap(caller, combatants);

                const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                if (!era || era.attacked || caller.onGeneralAttackCooldown || caller.attacking) {
                    break;
                }

                if (!caller.pendingAttack) {
                    caller.pendingAttack = this.chooseAttackType(caller, target);
                }

                if (caller.pendingAttack && isTargetInRange(caller, target, caller.pendingAttack)) {
                    era.attacked = true;
                    this.initiateAttack(caller, combatants);
                }
                break;
            }
            default:
                break;
        }
    };

    // ── initiateAttack ────────────────────────────────────────────────────────
    this.initiateAttack = async (caller, combatants) => {
        if (caller && caller.dead) return;
        if (caller.attacking) return;

        const target = resolveTarget(caller, combatants);
        if (!target || !caller.pendingAttack) return;

        caller.attacking = true;
        try {
            const attack = caller.pendingAttack;

            // ── Special abilities ─────────────────────────────────────────────
            // These are handled by combat-manager-redux useAbility() / the skill
            // handler block. We just need to trigger hitsCombatant (which routes
            // to useAbility) and kick the cooldown.

            const specialIds = [
                'destitution',
                'demon_mark',
                'summon_skulls',
                'hagigah_spineskin',
                'invoke_darkness',
                'stomp',
            ];

            const isSpecialById = specialIds.includes(attack.id || attack.name);

            if (isSpecialById || attack.type === 'special') {
                this.hitsCombatant(caller, target, attack);
                caller.energy = Math.max(0, (caller.energy || 0) - (attack.energy_cost || 0));
                this.kickoffSpecialCooldown(attack);
                caller.pendingAttack = null;
                return;
            }

            // ── Standard melee / ranged attack ───────────────────────────────
            try {
                const bestSource = getBestAttackSourceTile(caller, target);
                if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                    await this.animationManager.triggerAttackAnimation({
                        coordinates: bestSource,
                        facing: caller.facing,
                        icon: attack.icon,
                        type: attack.name || 'claw_strike',
                        selectedAction: attack,
                    });
                }
            } catch (e) {
                // Non-fatal animation failure; continue applying combat effects.
            }

            this.hitsCombatant(caller, target);
            this.kickoffAttackCooldown(caller);
            caller.pendingAttack = null;
        } finally {
            caller.attacking = false;
        }
    };
}
