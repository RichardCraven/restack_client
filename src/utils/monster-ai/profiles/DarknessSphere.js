export function DarknessSphere(data, utilMethods, animationManager, overlayManager) {
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.appendCombatLog = utilMethods.appendCombatLog;
    this.targetKilled = utilMethods.targetKilled;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'stationary';
    };

    this.acquireTarget = (caller, combatants) => {
        // Darkness Sphere does not acquire targets
    };

    this.handleOverlap = (caller, combatants) => {
        // Stationary
    };

    this.processMove = (caller, combatants) => {
        // Stationary, do not move
    };

    this.onEraTransition = (caller, combatants) => {
        caller.darknessRoundsLeft = (caller.darknessRoundsLeft || 6) - 1;
        if (caller.darknessRoundsLeft <= 0) {
            caller.hp = 0;
            caller.dead = true;
            caller.locked = true;
            if (this.appendCombatLog) {
                this.appendCombatLog(`The Sphere of Darkness fades away.`);
            }
            // Remove from combatants map
            if (combatants[caller.id]) {
                delete combatants[caller.id];
            }
            if (this.overlayManager && typeof this.overlayManager.removeCombatant === 'function') {
                try { this.overlayManager.removeCombatant(caller); } catch (e) {}
            }
            if (this.broadcastDataUpdate) this.broadcastDataUpdate();
        } else {
            // Deal 5 damage to adjacent enemies
            Object.values(combatants).forEach(enemy => {
                if (!enemy || enemy.dead || enemy.isVCT || !!enemy.isMonster === !!caller.isMonster) return;
                const dx = Math.abs(enemy.depth - caller.depth);
                const dy = Math.abs(enemy.position - caller.position);
                if (dx <= 1 && dy <= 1) {
                    enemy.hp = Math.max(0, enemy.hp - 5);
                    enemy.damageIndicators = enemy.damageIndicators || [];
                    enemy.damageIndicators.push({
                        id: Date.now() + Math.random(),
                        value: 5,
                        source: 'Darkness Sphere'
                    });
                    if (this.appendCombatLog) {
                        const enemyName = enemy.name || enemy.type || 'Enemy';
                        this.appendCombatLog(`Sphere of Darkness deals 5 damage to adjacent enemy ${enemyName}!`);
                    }
                    if (enemy.hp <= 0 && this.targetKilled) {
                        this.targetKilled(enemy);
                    }
                }
            });
            if (this.broadcastDataUpdate) this.broadcastDataUpdate();
        }
    };
}
