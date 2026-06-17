import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';

export function Wraith(data, utilMethods, animationManager, overlayManager) {
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;

    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffSpecialCooldown = utilMethods.kickoffSpecialCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackTypeDefault = utilMethods.chooseAttackType;

    const { resolveTarget, isTargetInRange } = MonsterTargetingHelpers;

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
    };

    this.initialize = (caller) => {
        caller.behaviorSequence = 'spellcaster';
    };

    this.acquireTarget = (caller, combatants) => {
        const { AcquireTargetMethods } = require('../../shared-ai-methods/acquire-target-methods');
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) return;
        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target, combatants);
        this.faceTargetImmediately(caller, combatants);
    };

    this.handleOverlap = (caller, combatants) => {
        data.methods.closeTheGap(caller, combatants);
        if (caller.targetId) {
            data.methods.evade(caller, combatants);
        }
    };

    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        this.faceTargetImmediately(caller, combatants);
        // Keep a distance for spellcasting if possible, otherwise move towards target
        data.methods.closeTheGap(caller, combatants);
        this.faceTargetImmediately(caller, combatants);

        // Attack trigger
        const era = caller.eras ? caller.eras[caller.eraIndex] : null;
        if (!caller.pendingAttack) {
            const repopTarget = resolveTarget(caller, combatants);
            if (repopTarget) {
                caller.pendingAttack = this.chooseAttackType(caller, repopTarget, combatants);
            }
        }
        if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking && caller.pendingAttack) {
            const target = resolveTarget(caller, combatants);
            if (target && isTargetInRange(caller, target, caller.pendingAttack)) {
                era.attacked = true;
                this.initiateAttack(caller, combatants);
            }
        }
        this.faceTargetImmediately(caller, combatants);
    };

    this.chooseAttackType = (caller, target, combatants = {}) => {
        if (!target) return null;
        const specials = Array.isArray(caller.specials) ? caller.specials : [];
        const invokeDarkness = specials.find(s => s.id === 'invoke_darkness');
        const netherBolt = specials.find(s => s.id === 'nether_bolt');
        const undeadGrasp = specials.find(s => s.id === 'undead_grasp');

        const distance = Math.abs(target.depth - caller.depth);
        const sphereActive = Object.values(combatants).some(c =>
            c && !c.dead && c.type === 'darkness_sphere' && !!c.isMonster === !!caller.isMonster
        );

        // Prioritize invoke darkness if target is close-medium (distance <= 3) and sphere is not active
        if (distance <= 3 && !sphereActive && invokeDarkness && invokeDarkness.cooldown_position === 100) {
            return invokeDarkness;
        }

        // Prioritize undead grasp if adjacent (distance === 1)
        if (distance === 1 && undeadGrasp && undeadGrasp.cooldown_position === 100) {
            return undeadGrasp;
        }

        // Prioritize nether bolt if ready
        if (netherBolt && netherBolt.cooldown_position === 100) {
            return netherBolt;
        }

        // Fallback to any ready special that isn't passive
        const available = specials.filter(s => s.cooldown_position === 100 && s.type !== 'passive' && s.id !== 'shadow_armor' && s.id !== 'invoke_darkness');
        if (available.length > 0) {
            return available[0];
        }

        return null;
    };

    this.initiateAttack = async (caller, combatants) => {
        if (caller.attacking) return;
        const target = resolveTarget(caller, combatants);
        if (!target || target.dead) return;

        caller.attacking = true;
        try {
            const ability = caller.pendingAttack;
            if (!ability) return;

            if (ability.id === 'invoke_darkness') {
                const adjacentTiles = [
                    { x: caller.depth - 1, y: caller.position },
                    { x: caller.depth,     y: caller.position - 1 },
                    { x: caller.depth,     y: caller.position + 1 },
                    { x: caller.depth + 1, y: caller.position },
                ].filter(t => t.x >= 0 && t.x <= this.MAX_DEPTH && t.y >= 0 && t.y < this.MAX_LANES);

                const isTileOccupied = (x, y) => {
                    return Object.values(combatants).some(c => {
                        if (!c || c.dead) return false;
                        if (c.depth === x && c.position === y) return true;
                        if (Array.isArray(c.occupiedCoords)) {
                            return c.occupiedCoords.some(coord => coord.x === x && coord.y === y);
                        }
                        return false;
                    });
                };

                const freeTile = adjacentTiles.find(t => !isTileOccupied(t.x, t.y));
                if (!freeTile) {
                    if (utilMethods.appendCombatLog) {
                        utilMethods.appendCombatLog(`${caller.name} tried to summon a Sphere of Darkness, but no adjacent tile was free.`);
                    }
                    return;
                }

                const template = {
                    type: 'darkness_sphere',
                    name: 'Darkness Sphere',
                    portrait: ability.icon,
                    stats: { hp: 9999, atk: 0, def: 99, speed: 1 },
                    specials: [],
                    attacks: []
                };

                const sphere = utilMethods.spawnMinion(template, {
                    coordinates: freeTile,
                    hp: 9999,
                    starting_hp: 9999,
                    darknessRoundsLeft: 5,
                    isMonster: !!caller.isMonster,
                    unkillable: true,
                    dead: false
                });

                if (utilMethods.appendCombatLog) {
                    utilMethods.appendCombatLog(`${caller.name} summons a Sphere of Darkness at (${freeTile.x}, ${freeTile.y})!`);
                }

                // Trigger summon animation (legacy)
                if (this.animationManager && typeof this.animationManager.tileOn === 'function') {
                    const tileId = this.animationManager.getTileIdByCoords(freeTile);
                    if (tileId != null) {
                        this.animationManager.tileOn(tileId, 'summon', 'purple');
                        setTimeout(() => {
                            this.animationManager.tileOff(tileId);
                        }, 1000);
                    }
                }

                this.kickoffSpecialCooldown(ability);
                caller.pendingAttack = null;
            } else if (ability.id === 'undead_grasp') {
                // Purple close-range swipe
                const targetTileId = this.animationManager ? this.animationManager.getTileIdByCoords(target.coordinates || {x: target.depth, y: target.position}) : null;
                const sourceTileId = this.animationManager ? this.animationManager.getTileIdByCoords(caller.coordinates || {x: caller.depth, y: caller.position}) : null;

                if (this.animationManager && typeof this.animationManager.clawSwipe === 'function' && targetTileId != null && sourceTileId != null) {
                    await new Promise(resolve => {
                        this.animationManager.clawSwipe(targetTileId, sourceTileId, caller.facing, resolve, 'purple');
                    });
                }

                // Calculate damage: 100% of atk
                const clonedAbility = { ...ability, damage: Math.round(caller.atk * 1.00) };
                this.hitsCombatant(caller, target, clonedAbility);

                this.kickoffSpecialCooldown(ability);
                caller.pendingAttack = null;
            } else if (ability.id === 'nether_bolt') {
                // Projectile firing
                const sourceCoords = { x: caller.depth, y: caller.position };
                const targetCoords = target.coordinates || { x: target.depth, y: target.position };

                // Projectile deflection check: if there is an active sphere of darkness on the board
                const activeSphere = Object.values(combatants).find(c =>
                    c && !c.dead && c.type === 'darkness_sphere' && !!c.isMonster === !!target.isMonster
                );

                if (this.animationManager && typeof this.animationManager.magicMissile === 'function') {
                    const options = {};
                    if (activeSphere) {
                        options.bendTo = activeSphere.coordinates || { x: activeSphere.depth, y: activeSphere.position };
                    }
                    this.animationManager.magicMissile(sourceCoords, targetCoords, 'major', options);
                }

                if (activeSphere) {
                    if (utilMethods.appendCombatLog) {
                        utilMethods.appendCombatLog(`The Nether Bolt is sucked into the Sphere of Darkness and swallowed!`);
                    }
                } else {
                    // Calculate damage: 115% ATK + 8 flat
                    const clonedAbility = { ...ability, damage: Math.round(caller.atk * 1.15 + 8) };
                    this.hitsCombatant(caller, target, clonedAbility);
                }

                this.kickoffSpecialCooldown(ability);
                caller.pendingAttack = null;
            } else {
                // Fallback generic attack
                if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                    await this.animationManager.triggerAttackAnimation({
                        coordinates: { x: caller.depth, y: caller.position },
                        facing: caller.facing,
                        icon: ability.icon,
                        type: ability.name,
                        selectedAction: ability
                    });
                }
                this.hitsCombatant(caller, target, ability);
                this.kickoffSpecialCooldown(ability);
                caller.pendingAttack = null;
            }
        } finally {
            caller.attacking = false;
            if (this.broadcastDataUpdate) this.broadcastDataUpdate();
        }
    };
}
