export function Mummy(data, utilMethods, animationManager, overlayManager) {
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
    this.getCombatants = utilMethods.getCombatants;
    this.triggerBoardEvent = utilMethods.triggerBoardEvent;

    // ── Custom attack selection ──────────────────────────────────────────────
    // Prefer grasp when the target is adjacent (distance ≤ 1).
    // Prefer energy_drain when the target is at medium range.
    // Falls back to whatever is off cooldown (most recovered first).
    this.chooseAttackType = (caller, target) => {
        if (!target || !target.coordinates || !caller.coordinates) {
            // No valid target yet — fall back to most-recovered attack
            return caller.attacks.reduce((best, a) => (a.cooldown_position > best.cooldown_position ? a : best), caller.attacks[0]);
        }
        const dx = target.coordinates.x - caller.coordinates.x;
        const absDistance = Math.abs(dx);

        const available = caller.attacks.filter(e => e.cooldown_position === 100);

        // Helper: pick the attack with the highest cooldown_position among a list
        const mostRecovered = (list) => list.reduce((best, a) => (a.cooldown_position > best.cooldown_position ? a : best), list[0]);

        if (absDistance <= 1) {
            // Adjacent — always try grasp first
            const grasp = available.find(a => a.name === 'grasp');
            if (grasp) return grasp;
            // grasp on cooldown — pick most-recovered close attack, then any
            const closeAttacks = caller.attacks.filter(a => a.range === 'close');
            if (closeAttacks.length) return mostRecovered(closeAttacks);
        }

        // Medium/far range — try energy_drain first
        const drain = available.find(a => a.name === 'energy drain' || a.name === 'energy_drain');
        if (drain) return drain;

        // energy_drain on cooldown — pick most-recovered medium/far, else most-recovered overall
        const rangedAttacks = caller.attacks.filter(a => a.range === 'medium' || a.range === 'far');
        if (rangedAttacks.length) return mostRecovered(rangedAttacks);

        // Absolute fallback
        return mostRecovered(caller.attacks);
    }

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    }

    this.acquireTarget = (caller, combatants) => {
        const { AcquireTargetMethods } = require('../../shared-ai-methods/acquire-target-methods');
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) {
            console.log(`[Mummy] acquireTarget — no soft target found`);
            return;
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        console.log(`[Mummy] acquireTarget → target=${target.name || target.type || target.id}, pendingAttack=${caller.pendingAttack?.name}`);
    }

    this.handleOverlap = (caller, combatants) => {
        data.methods.closeTheGap(caller, combatants);
        if (caller.targetId) {
            data.methods.evade(caller, combatants);
        }
    }

    // ── induce_fear helper ───────────────────────────────────────────────────
    this.triggerInduceFear = (caller, combatants, fearSpecial) => {
        if (!fearSpecial || fearSpecial.cooldown_position < 100) return;
        if ((caller.energy || 0) < 90) return;

        const FIGHT_INTERVAL = utilMethods.getFightInterval ? utilMethods.getFightInterval() : 40;
        const eraDuration = 5 * 100 * FIGHT_INTERVAL;

        console.log(`[Mummy] *** INDUCE FEAR activated! energy=${caller.energy} ***`);

        // Spend energy
        caller.energy = (caller.energy || 0) - 90;

        // Apply 50% ATK and DEF reduction to all non-monster, non-minion combatants
        const enemies = Object.values(combatants).filter(c => !c.dead && !c.isMonster && !c.isMinion);
        enemies.forEach(enemy => {
            // Store originals before first application (guard against double-stack)
            if (!enemy._fearOriginalAtk) enemy._fearOriginalAtk = enemy.atk;
            if (!enemy._fearOriginalDef) enemy._fearOriginalDef = enemy.def;

            enemy.atk = Math.max(1, Math.floor(enemy._fearOriginalAtk * 0.5));
            enemy.def = Math.max(0, Math.floor(enemy._fearOriginalDef * 0.5));
            enemy.feared = true;
            enemy.feared_eras = 5; // decremented in restartTurnCycle — speed-agnostic

            console.log(`[Mummy] FEAR applied to ${enemy.name || enemy.type}: atk ${enemy._fearOriginalAtk}→${enemy.atk}, def ${enemy._fearOriginalDef}→${enemy.def}`);
        });

        // Broadcast immediately so UI reflects reduced stats
        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();

        // Push floating stat-debuff indicators above each affected fighter
        enemies.forEach(enemy => {
            if (!Array.isArray(enemy.damageIndicators)) enemy.damageIndicators = [];
            enemy.damageIndicators.push('ATK ↓');
            setTimeout(() => {
                const idx = enemy.damageIndicators.indexOf('ATK ↓');
                if (idx !== -1) enemy.damageIndicators.splice(idx, 1);
                if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
            }, 1800);
        });
        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
        setTimeout(() => {
            enemies.forEach(enemy => {
                if (enemy.dead) return;
                if (!Array.isArray(enemy.damageIndicators)) enemy.damageIndicators = [];
                enemy.damageIndicators.push('DEF ↓');
                setTimeout(() => {
                    const idx = enemy.damageIndicators.indexOf('DEF ↓');
                    if (idx !== -1) enemy.damageIndicators.splice(idx, 1);
                    if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
                }, 1800);
            });
            if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
        }, 600);

        // Fire board-wide visual event
        if (typeof this.triggerBoardEvent === 'function') {
            this.triggerBoardEvent('induce_fear', { duration: eraDuration });
        }

        // Safety-net: forcibly clear the 'feared' visual flag on all affected fighters
        // after eraDuration ms, in case the era-tick path in restartTurnCycle misses it
        // (e.g. a fighter dies and restartTurnCycle never runs again, or timing drift).
        setTimeout(() => {
            console.log('*********INDUCED FEAR FINISHED********');
            enemies.forEach(enemy => {
                if (!enemy.feared) return; // already cleared by era ticks — nothing to do
                enemy.feared = false;
                enemy.feared_eras = 0;
                if (enemy._fearOriginalAtk != null) { enemy.atk = enemy._fearOriginalAtk; delete enemy._fearOriginalAtk; }
                if (enemy._fearOriginalDef != null) { enemy.def = enemy._fearOriginalDef; delete enemy._fearOriginalDef; }
                console.log(`[Mummy] safety-net cleared FEAR on ${enemy.name || enemy.type}`);
            });
            if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
        }, eraDuration);

        // Lock movement for the duration of the cast glow animation (matches fearCastingActive in UI)
        caller.castingLock = true;
        setTimeout(() => {
            caller.castingLock = false;
        }, 1800);

        // Start special cooldown recharge
        this.kickoffSpecialCooldown(fearSpecial);
    }

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }

        // Retarget every turn to always track the closest enemy
        this.acquireTarget(caller, combatants);

        console.log(`[Mummy] processMove — eraIndex=${caller.eraIndex}, targetId=${caller.targetId}, pendingAttack=${caller.pendingAttack?.name}, energy=${Math.floor(caller.energy || 0)}`);

        // Check if induce_fear should fire (energy ≥ 90 and special ready)
        const fearSpecial = Array.isArray(caller.specials)
            ? caller.specials.find(s => s && (s.name === 'induce fear' || s.name === 'induce_fear'))
            : null;
        if (fearSpecial) {
            this.triggerInduceFear(caller, combatants, fearSpecial);
        }

        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        // Always close the gap regardless of eraIndex — unless casting lock is active
        if (!caller.castingLock) {
            data.methods.closeTheGap(caller, combatants);
        }

        // Keep facing toward target
        if (caller.targetId && combatants[caller.targetId]) {
            const target = combatants[caller.targetId];
            caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
        }
    }

    this.initiateAttack = async (caller, combatants) => {
        const target = combatants[caller.targetId];
        caller.attacking = true;
        if (!target) {
            console.log('[Mummy] initiateAttack — NO TARGET!');
            return;
        }

        const attackName = caller.pendingAttack?.name;
        console.log(`[Mummy] initiateAttack — attack=${attackName}, target=${target.name || target.type || target.id}`);

        switch (attackName) {
            case 'grasp': {
                const attackEffect = caller.pendingAttack.effect;
                if (attackEffect && attackEffect.type === 'stun') {
                    console.log(`*** MUMMY GRASP (STUN attempt, 50%) → ${target.name || target.type || target.id} ***`);
                }
                this.hitsCombatant(caller, target);
                break;
            }

            case 'energy drain':
            case 'energy_drain': {
                // Apply hit damage first
                this.hitsCombatant(caller, target);

                // Only drain energy if the target survived
                if (target && !target.dead && target.hp > 0) {
                    const drainedAmount = target.energy || 0;
                    target.energy = 0;
                    target.drained = true;
                    target.drained_eras = 1; // cleared in restartTurnCycle — speed-agnostic

                    // Boost mummy energy by 40 (capped at 100)
                    caller.energy = Math.min(100, (caller.energy || 0) + 40);

                    console.log(`[Mummy] Energy Drain: drained ${drainedAmount} energy from ${target.name || target.type}, mummy energy now ${caller.energy}`);

                    if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
                }
                break;
            }

            default: {
                try {
                    this.hitsCombatant(caller, target);
                } catch (e) {
                    console.warn('[Mummy] Fallback attack failed in initiateAttack', e);
                }
                break;
            }
        }

        this.kickoffAttackCooldown(caller);
        caller.pendingAttack = null;
    }
}
