// Basic AI profile scaffold for the Engineer class.
export function Engineer(data, utilMethods, animationManager, overlayManager) { // eslint-disable-line no-unused-vars
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.hitsTarget = (utilMethods && typeof utilMethods.hitsTarget === 'function') ? utilMethods.hitsTarget : null;
    this.missesTarget = (utilMethods && typeof utilMethods.missesTarget === 'function') ? utilMethods.missesTarget : null;
    this.hitsCombatant = (utilMethods && typeof utilMethods.hitsCombatant === 'function') ? utilMethods.hitsCombatant : null;
    this.kickoffAttackCooldown = (utilMethods && typeof utilMethods.kickoffAttackCooldown === 'function') ? utilMethods.kickoffAttackCooldown : null;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'tactical-frontliner';
    };

    this.isEnemy = (e) => !!(e && (e.isMonster || e.isMinion));

    this.acquireTarget = (caller, combatants) => {
        const liveEnemies = Object.values(combatants || {}).filter(e => this.isEnemy(e) && !e.dead && !e.isVCT);
        if (!liveEnemies.length) return;

        let target = liveEnemies[0];
        let bestDistance = Number.POSITIVE_INFINITY;
        liveEnemies.forEach((enemy) => {
            const distance = Math.abs(enemy.coordinates.x - caller.coordinates.x) + Math.abs(enemy.coordinates.y - caller.coordinates.y);
            if (distance < bestDistance) {
                bestDistance = distance;
                target = enemy;
            }
        });

        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target);
    };

    this.chooseAttackType = (caller, target) => {
        const available = (caller.attacks || []).filter(a => a && a.cooldown_position === 100);
        if (!available.length) return null;

        const distanceToTarget = data.methods.getDistanceToTarget(caller, target);
        const closeAttack = available.find(a => a.range === 'close');
        if ((distanceToTarget === 1 || distanceToTarget === -1) && closeAttack) return closeAttack;

        const ranged = available.filter(a => a.range === 'far' || a.range === 'medium');
        if (ranged.length) {
            return ranged.sort((a, b) => (b.cooldown_position || 0) - (a.cooldown_position || 0))[0];
        }

        return data.methods.pickRandom(available);
    };

    this.processMove = (caller, combatants) => {
        if (!caller.pendingAttack) {
            this.acquireTarget(caller, combatants);
            if (!caller.pendingAttack) return;
        }

        const target = combatants && caller.targetId ? combatants[caller.targetId] : null;
        if (!target || target.dead || target.isVCT) {
            this.acquireTarget(caller, combatants);
            return;
        }

        const inRange = data.methods.targetInRange(caller, target);
        if (inRange && !caller.attacking) {
            caller.attack();
            return;
        }

        data.methods.closeTheGapForwardFirst(caller, combatants);
    };

    this.initiateAttack = (caller, manualAttack, combatants) => { // eslint-disable-line no-unused-vars
        if (!caller) return;
        caller.attacking = true;

        try {
            const target = combatants && caller.targetId ? combatants[caller.targetId] : null;
            if (!target || target.dead || target.isVCT || !caller.pendingAttack) {
                if (typeof this.missesTarget === 'function') this.missesTarget(caller);
                return;
            }

            if (typeof this.hitsCombatant === 'function') this.hitsCombatant(caller, target);
            else if (typeof this.hitsTarget === 'function') this.hitsTarget(caller);

            if (typeof this.kickoffAttackCooldown === 'function') this.kickoffAttackCooldown(caller);
        } finally {
            caller.attacking = false;
        }
    };
}
