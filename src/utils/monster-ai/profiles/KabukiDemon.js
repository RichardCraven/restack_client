// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';
import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';
import { applyDefenseBreakEffect } from '../../combat-effects';

export function KabukiDemon(data, utilMethods, animationManager, overlayManager) {
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

    const { resolveTarget, isTargetInRange, getBestAttackSourceTile, getForwardLineTargets, getCombatantTiles } = MonsterTargetingHelpers;

    this._debug = (label, payload = null) => {
        try {
            if (payload) console.log(`[KABUKI AI] ${label}`, payload);
            else console.log(`[KABUKI AI] ${label}`);
        } catch (e) {
            // no-op
        }
    };

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler';
    };

    this.acquireTarget = (caller, combatants) => {
        const target = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) {
            // this._debug('acquireTarget: no valid target found', { callerId: caller && caller.id });
            return;
        }
        caller.targetId = target.id;
        caller.pendingAttack = this.chooseAttackType(caller, target);
        // this._debug('acquireTarget: selected target', {
        //     callerId: caller && caller.id,
        //     targetId: target.id,
        //     pendingAttack: caller.pendingAttack && caller.pendingAttack.name,
        // });
    };

    // CombatManager expects every AI profile to expose chooseAttackType.
    this.chooseAttackType = (caller, target) => {
        if (!caller || !Array.isArray(caller.attacks)) return null;

        const available = caller.attacks.filter((a) => a && a.cooldown_position === 100);
        if (available.length === 0) return null;

        const obliterateReady = Array.isArray(caller.specials)
            ? caller.specials.find((s) => s && s.name === 'obliterate' && s.cooldown_position === 100)
            : null;
        if (obliterateReady && (caller.energy || 0) >= (obliterateReady.energy_cost || 0) && target) {
            // this._debug('chooseAttackType: selecting obliterate', {
            //     callerId: caller.id,
            //     targetId: target.id,
            //     energy: caller.energy,
            //     energyCost: obliterateReady.energy_cost,
            // });
            return obliterateReady;
        }

        return this.chooseAttackTypeDefault(caller, target);
    };

    this._getLineTargetsForObliterate = (caller, combatants, target) => {
        if (!caller || !combatants || !target || !caller.coordinates) return [];

        const { lineTargets } = getForwardLineTargets(caller, target, combatants);

        // this._debug('obliterate line-target scan', {
        //     callerId: caller.id,
        //     targetId: target.id,
        //     callerCoords: caller.coordinates,
        //     targetCoords: target.coordinates,
        //     targetTiles,
        //     facingRight,
        //     lanes: targetLanes,
        //     targetCount: lineTargets.length,
        //     targetIds: lineTargets.map((e) => e.id),
        // });
        return lineTargets;
    };

    this._triggerObliterateAnimation = async (caller, target, lineTargets, combatants) => {
        if (!this.animationManager || !caller || !caller.coordinates || !target || !target.coordinates) return;
        const sourceTileId = this.animationManager.getTileIdByCoords(caller.coordinates);
        if (sourceTileId == null) return;

        const direction = target.coordinates.x >= caller.coordinates.x ? 'left-to-right' : 'right-to-left';
        try {
            await this.animationManager.straightBeamNoTarget(sourceTileId, direction, 'purple');
        } catch (e) {
            // Non-fatal animation failure; keep combat flow running.
        }

        // Follow up with a lane-sweep burst so Obliterate is visually distinct
        // from a normal void lance cast.
        const orderedTargets = [...lineTargets].sort((a, b) => (
            direction === 'left-to-right'
                ? Math.min(...getCombatantTiles(a, combatants).map((t) => t.x)) - Math.min(...getCombatantTiles(b, combatants).map((t) => t.x))
                : Math.max(...getCombatantTiles(b, combatants).map((t) => t.x)) - Math.max(...getCombatantTiles(a, combatants).map((t) => t.x))
        ));

        orderedTargets.forEach((enemy, index) => {
            const delay = index * 70;
            setTimeout(() => {
                try {
                    const enemyTiles = getCombatantTiles(enemy, combatants);
                    const centerTile = enemyTiles[0] || enemy.coordinates;
                    const centerId = this.animationManager.getTileIdByCoords(centerTile);
                    if (centerId == null) return;

                    // Purple beam pass through impacted tiles.
                    this.animationManager.triggerTileAnimation_line(centerId, 'purple');
                    // Red/purple flare reads as "flame" over the beam.
                    this.animationManager.triggerTileAnimation(centerId, 'red');

                    const upId = this.animationManager.getTileIdByCoords({ x: centerTile.x, y: centerTile.y - 1 });
                    const downId = this.animationManager.getTileIdByCoords({ x: centerTile.x, y: centerTile.y + 1 });
                    if (upId != null) this.animationManager.triggerTileAnimation(upId, 'red');
                    if (downId != null) this.animationManager.triggerTileAnimation(downId, 'red');
                } catch (e) {
                    // Best effort only.
                }
            }, delay);
        });

        if (orderedTargets.length > 0) {
            await new Promise((resolve) => setTimeout(resolve, (orderedTargets.length * 70) + 180));
        }

        // Obliterate gets a guaranteed target circle on every impacted tile.
        lineTargets.forEach((enemy) => {
            try {
                const enemyTiles = getCombatantTiles(enemy, combatants);
                enemyTiles.forEach((tile) => {
                    if (tile && typeof this.animationManager.triggerObliterateCircle === 'function') {
                        this.animationManager.triggerObliterateCircle(tile, caller.coordinates);
                    }
                });
                if (enemyTiles.length === 0) {
                    if (enemy.coordinates && typeof this.animationManager.triggerObliterateCircle === 'function') {
                        this.animationManager.triggerObliterateCircle(enemy.coordinates, caller.coordinates);
                    }
                }
            } catch (e) {
                // Best effort only.
            }
        });
    };

    this.processMove = (caller, combatants) => {
        // Defensive: skip if Kabuki is already dead
        if (caller && caller.dead) {
            return;
        }
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
                    // this._debug('processMove: no resolved target, reacquiring', {
                    //     callerId: caller.id,
                    //     targetId: caller.targetId,
                    // });
                    this.acquireTarget(caller, combatants);
                    break;
                }

                // Move into better position first.
                data.methods.closeTheGap(caller, combatants);

                const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                if (!era || era.attacked || caller.onGeneralAttackCooldown || caller.attacking) {
                    // this._debug('processMove: attack gate blocked', {
                    //     callerId: caller.id,
                    //     eraIndex: caller.eraIndex,
                    //     hasEra: !!era,
                    //     eraAttacked: !!(era && era.attacked),
                    //     onGeneralAttackCooldown: !!caller.onGeneralAttackCooldown,
                    //     attacking: !!caller.attacking,
                    //     pendingAttack: caller.pendingAttack && caller.pendingAttack.name,
                    // });
                    break;
                }

                const obliterate = Array.isArray(caller.specials)
                    ? caller.specials.find((s) => s && s.name === 'obliterate')
                    : null;
                const obliterateReady = !!obliterate && obliterate.cooldown_position === 100 && (caller.energy || 0) >= (obliterate.energy_cost || 0);
                const lineTargets = obliterateReady ? this._getLineTargetsForObliterate(caller, combatants, target) : [];

                // this._debug('processMove: obliterate readiness', {
                //     callerId: caller.id,
                //     targetId: target.id,
                //     energy: caller.energy || 0,
                //     hasObliterate: !!obliterate,
                //     obliterateCooldown: obliterate ? obliterate.cooldown_position : null,
                //     obliterateEnergyCost: obliterate ? obliterate.energy_cost : null,
                //     obliterateReady,
                //     lineTargetCount: lineTargets.length,
                // });

                if (obliterateReady && lineTargets.length > 0) {
                    caller.pendingAttack = obliterate;
                    era.attacked = true;
                    // this._debug('processMove: casting obliterate', {
                    //     callerId: caller.id,
                    //     targetId: target.id,
                    //     targetIds: lineTargets.map((e) => e.id),
                    // });
                    this.initiateAttack(caller, combatants);
                    break;
                }

                if (!caller.pendingAttack) {
                    caller.pendingAttack = this.chooseAttackType(caller, target);
                }

                if (caller.pendingAttack && isTargetInRange(caller, target, caller.pendingAttack)) {
                    era.attacked = true;
                    // this._debug('processMove: casting non-obliterate attack', {
                    //     callerId: caller.id,
                    //     targetId: target.id,
                    //     attack: caller.pendingAttack && caller.pendingAttack.name,
                    // });
                    this.initiateAttack(caller, combatants);
                } else if (!caller.pendingAttack) {
                    // this._debug('processMove: no ready attack selected', {
                    //     callerId: caller.id,
                    //     targetId: target.id,
                    //     attackCooldowns: Array.isArray(caller.attacks)
                    //         ? caller.attacks.map((a) => ({ name: a.name, cooldown: a.cooldown_position }))
                    //         : [],
                    // });
                } else {
                    // this._debug('processMove: pending attack not in range', {
                    //     callerId: caller.id,
                    //     targetId: target.id,
                    //     attack: caller.pendingAttack && caller.pendingAttack.name,
                    //     callerCoords: caller.coordinates,
                    //     targetCoords: target.coordinates,
                    // });
                }
                break;
            }
            default:
                break;
        }
    };

    this.initiateAttack = async (caller, combatants) => {
        // Defensive: skip if Kabuki is already dead
        if (caller && caller.dead) {
            this._debug('initiateAttack: skipped because Kabuki is dead', { callerId: caller && caller.id });
            return;
        }
        if (caller.attacking) {
            this._debug('initiateAttack: skipped because already attacking', { callerId: caller && caller.id });
            return;
        }
        const target = resolveTarget(caller, combatants);
        if (!target || !caller.pendingAttack) {
            this._debug('initiateAttack: skipped because target or pendingAttack missing', {
                callerId: caller && caller.id,
                hasTarget: !!target,
                pendingAttack: caller && caller.pendingAttack ? caller.pendingAttack.name : null,
            });
            return;
        }

        caller.attacking = true;
        try {
            const attack = caller.pendingAttack;
            this._debug('initiateAttack: begin', {
                callerId: caller.id,
                targetId: target.id,
                attack: attack.name,
                energy: caller.energy,
            });

            if (attack.type === 'special' && attack.name === 'obliterate') {
                const lineTargets = this._getLineTargetsForObliterate(caller, combatants, target);
                if (lineTargets.length === 0) {
                    this._debug('initiateAttack: obliterate aborted, no line targets at cast time', {
                        callerId: caller.id,
                        targetId: target.id,
                    });
                    this.missesTarget(caller, target, attack);
                    return;
                }

                console.log('[KABUKI AI] OBLITERATE cast', {
                    callerId: caller.id,
                    targetId: target.id,
                    targetsHit: lineTargets.map((t) => t.id),
                    lane: target.coordinates.y,
                });

                await this._triggerObliterateAnimation(caller, target, lineTargets, combatants);

                const defBreakDuration = Number(attack.def_reduction_duration) || 5;
                const defBreakPercent = Number(attack.def_reduction_percent) || 50;

                lineTargets.forEach((enemy) => {
                    this.hitsCombatant(caller, enemy, attack, { forceHit: true });
                    applyDefenseBreakEffect(enemy, defBreakDuration, defBreakPercent, this.broadcastDataUpdate);
                    
                    // Push visual DEF ↓ indicator to match Mummy's induce_fear feedback
                    if (!Array.isArray(enemy.damageIndicators)) enemy.damageIndicators = [];
                    const defBreakId = Date.now() + Math.random();
                    const defBreakObj = { id: defBreakId, value: 'DEF ↓', source: 'Kabuki Demon' };
                    enemy.damageIndicators.push(defBreakObj);
                    setTimeout(() => {
                        const idx = enemy.damageIndicators.findIndex(e => e && e.id === defBreakId);
                        if (idx !== -1) enemy.damageIndicators.splice(idx, 1);
                        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
                    }, 1800);
                });

                caller.energy = Math.max(0, (caller.energy || 0) - (attack.energy_cost || 0));
                this.kickoffSpecialCooldown(attack);
                caller.pendingAttack = null;
                return;
            }

            if (attack.type === 'special') {
                if (attack.name === 'major magic missile' && this.animationManager && typeof this.animationManager.magicMissile === 'function') {
                    this.animationManager.magicMissile(caller.coordinates, target.coordinates, 'major');
                }
                this.hitsCombatant(caller, target, attack);
                caller.energy = Math.max(0, (caller.energy || 0) - (attack.energy_cost || 0));
                this.kickoffSpecialCooldown(attack);
                caller.pendingAttack = null;
                return;
            }

            if (attack.name === 'void lance' && this.animationManager && typeof this.animationManager.voidLance === 'function') {
                try {
                    const travelMs = await this.animationManager.voidLance(caller.coordinates, target.coordinates);
                    const settleDelay = Math.max(80, Number(travelMs) || 0);
                    if (settleDelay > 0) {
                        await new Promise((resolve) => setTimeout(resolve, settleDelay));
                    }
                } catch (e) {
                    // Non-fatal animation failure; continue and apply combat effects.
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
                    if (sourceTileId !== null && targetTileId !== null) {
                        await new Promise((resolve) => {
                            this.animationManager.clawSwipe(targetTileId, sourceTileId, caller.facing, resolve);
                        });
                    }
                } catch (e) {
                    // Non-fatal animation failure; continue and apply combat effects.
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
