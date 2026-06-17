// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';

export function Ogre(data, utilMethods, animationManager, overlayManager){
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
        caller._pendingFacing = null;
        caller._pendingFacingCount = 0;
    }

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    }

    this.acquireTarget = (caller, combatants) => {
        const { AcquireTargetMethods } = require('../../shared-ai-methods/acquire-target-methods');
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target);
        this.faceTargetImmediately(caller, combatants);
    }

    this.chooseAttackType = (caller, target) => {
        if (!target || !caller) return null;
        caller.targetId = target.id;

        // Resolve Ogre's abilities
        const stomp = (caller.specials || []).find(s => s && (s.id === 'stomp' || s.name === 'Stomp'));
        const headButt = (caller.specials || []).find(s => s && (s.id === 'head_butt' || s.name === 'Headbutt'));
        const bite = (caller.attacks || []).find(a => a && (a.id === 'bite' || a.name === 'Bite'));
        const clawStrike = (caller.attacks || []).find(a => a && (a.id === 'claw_strike' || a.name === 'Claw Strike'));

        // Prioritize stomp -> head_butt -> bite -> claw_strike depending on cooldown
        if (stomp && stomp.cooldown_position === 100) return stomp;
        if (headButt && headButt.cooldown_position === 100) return headButt;
        if (bite && bite.cooldown_position === 100) return bite;
        return clawStrike || caller.attacks[0] || null;
    }

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        this.faceTargetImmediately(caller, combatants);
        
        // Close in on target
        data.methods.closeTheGap(caller, combatants);
        this.faceTargetImmediately(caller, combatants);

        const target = resolveTarget(caller, combatants);
        if (!target) return;

        caller.pendingAttack = this.chooseAttackType(caller, target);

        const era = caller.eras ? caller.eras[caller.eraIndex] : null;
        if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking && caller.pendingAttack) {
            if (isTargetInRange(caller, target, caller.pendingAttack)) {
                era.attacked = true;
                this.initiateAttack(caller, combatants);
            }
        }
    }

    this.initiateAttack = async (caller, combatants) => {
        if (caller.attacking) return;
        const target = resolveTarget(caller, combatants);
        caller.attacking = true;

        try {
            if (!target || target.dead || caller.dead) return;

            const attack = caller.pendingAttack;
            if (!attack) return;

            // Trigger visual attack animation
            try {
                const bestSource = getBestAttackSourceTile(caller, target);
                if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                    await this.animationManager.triggerAttackAnimation({
                        coordinates: bestSource,
                        facing: caller.facing,
                        icon: attack.icon,
                        type: attack.name || 'grasp',
                        selectedAction: attack
                    });
                }
            } catch (e) {
                console.warn('Ogre attack animation failed', e);
            }

            if (caller.dead) return;

            // Apply hits/damage
            this.hitsCombatant(caller, target);

            // Simple pushback effect logic for Headbutt
            if (attack.id === 'head_butt' || attack.name === 'Headbutt') {
                const dx = target.coordinates.x - caller.coordinates.x;
                const dy = target.coordinates.y - caller.coordinates.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    const pushX = Math.round(dx / dist);
                    const pushY = Math.round(dy / dist);
                    const newX = Math.max(0, Math.min(this.MAX_DEPTH, target.coordinates.x + pushX));
                    const newY = Math.max(0, Math.min(this.MAX_LANES - 1, target.coordinates.y + pushY));
                    
                    const blocked = Object.values(combatants).some(e => e && !e.dead && e.id !== target.id && e.coordinates.x === newX && e.coordinates.y === newY);
                    if (!blocked) {
                        target.coordinates.x = newX;
                        target.coordinates.y = newY;
                        this.faceTargetImmediately(target, combatants);
                        this.broadcastDataUpdate();
                    }
                }
            }

            if (attack.type === 'spell' || (caller.specials || []).includes(attack)) {
                this.kickoffSpecialCooldown(attack);
            } else {
                this.kickoffAttackCooldown(caller);
            }
        } finally {
            caller.attacking = false;
        }
    }
}
