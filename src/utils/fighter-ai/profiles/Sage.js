// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

export function Sage(data, utilMethods, animationManager, overlayManager){ // eslint-disable-line no-unused-vars
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME

    this.hitsTarget = (utilMethods && typeof utilMethods.hitsTarget === 'function') ? utilMethods.hitsTarget : null;
    this.missesTarget = (utilMethods && typeof utilMethods.missesTarget === 'function') ? utilMethods.missesTarget : null;
    this.hitsCombatant = (utilMethods && typeof utilMethods.hitsCombatant === 'function') ? utilMethods.hitsCombatant : null;
    this.kickoffAttackCooldown = (utilMethods && typeof utilMethods.kickoffAttackCooldown === 'function') ? utilMethods.kickoffAttackCooldown : null;
    this.runCooldownTicks = (utilMethods && typeof utilMethods.runCooldownTicks === 'function') ? utilMethods.runCooldownTicks : null;
    this.broadcastDataUpdate = (utilMethods && typeof utilMethods.broadcastDataUpdate === 'function') ? utilMethods.broadcastDataUpdate : null;
    this.useConsumable = (utilMethods && typeof utilMethods.useConsumable === 'function') ? utilMethods.useConsumable : null;
    this.getCurrentInventory = (utilMethods && typeof utilMethods.getCurrentInventory === 'function') ? utilMethods.getCurrentInventory : null;
    // Diagnostics disabled per request.
    this.debugLog = () => {};
    
    // Utility to identify friendlies (non-monsters, non-minions, alive)
    this.isFriendly = (e) => !e.isMonster && !e.isMinion && !e.dead;
    this.isFriendlyAdjacentRange = (distanceToTarget, laneDiff) => {
        return (Math.abs(distanceToTarget) === 1 && laneDiff === 0) ||
            (distanceToTarget === 0 && Math.abs(laneDiff) === 1);
    }

    this.getCombatantMaxHp = (combatant) => {
        if (!combatant) return 0;
        if (typeof combatant.starting_hp === 'number' && Number.isFinite(combatant.starting_hp)) return combatant.starting_hp;
        if (combatant.stats && typeof combatant.stats.hp === 'number' && Number.isFinite(combatant.stats.hp)) return combatant.stats.hp;
        if (typeof combatant.hp === 'number' && Number.isFinite(combatant.hp)) return combatant.hp;
        return 0;
    }

    this.getHealableFriendlies = (caller, combatants) => {
        return Object.values(combatants).filter(e =>
            this.isFriendly(e) &&
            e.id !== caller.id &&
            e.hp < this.getCombatantMaxHp(e)
        );
    }

    this.resolveHealAmount = (attack) => {
        const raw = attack && Number.isFinite(Number(attack.damage)) ? Number(attack.damage) : 10;
        return raw > 0 ? raw : 0;
    }

    this.applyHealToTarget = (caller, target, attack, contextLabel = 'heal') => {
        const maxHp = this.getCombatantMaxHp(target);
        const hpBeforeRaw = Number(target && target.hp);
        const hpBefore = Number.isFinite(hpBeforeRaw) ? hpBeforeRaw : 0;
        const requestedHeal = this.resolveHealAmount(attack);

        if (!Number.isFinite(maxHp) || maxHp <= 0) {
            this.debugLog('heal-transaction:invalid-maxHp', {
                context: contextLabel,
                callerId: caller?.id,
                callerName: caller?.name,
                targetId: target?.id,
                targetName: target?.name,
                targetHpBefore: hpBefore,
                targetMaxHp: maxHp,
                requestedHeal
            });
            return { appliedHeal: 0, hpBefore, hpAfter: hpBefore, maxHp, requestedHeal };
        }

        const normalizedBefore = Math.max(0, hpBefore);
        const hpAfter = Math.min(maxHp, normalizedBefore + requestedHeal);
        const appliedHeal = Math.max(0, hpAfter - normalizedBefore);
        target.hp = hpAfter;

        this.debugLog('heal-transaction:applied', {
            context: contextLabel,
            callerId: caller?.id,
            callerName: caller?.name,
            targetId: target?.id,
            targetName: target?.name,
            targetHpBefore: normalizedBefore,
            targetHpAfter: hpAfter,
            targetMaxHp: maxHp,
            requestedHeal,
            appliedHeal,
            wasClampedToMax: hpAfter === maxHp,
            attackName: attack?.name || null
        });

        return { appliedHeal, hpBefore: normalizedBefore, hpAfter, maxHp, requestedHeal };
    }

    this.triggerHealPulse = (target) => {
        if (!target) return;
        target.healPulse = true;
        if (typeof this.broadcastDataUpdate === 'function') {
            this.broadcastDataUpdate(target);
        }
        setTimeout(() => {
            target.healPulse = false;
            if (typeof this.broadcastDataUpdate === 'function') {
                this.broadcastDataUpdate(target);
            }
        }, 450);
    }

    this.isAttackReady = (attack) => {
        if (!attack) return false;
        return attack.cooldown_position === undefined || attack.cooldown_position >= 100;
    }

    this.tryUseConsumableForHeal = (caller) => {
        try {
            if (!caller || typeof caller.hp !== 'number') return false;
            const maxHp = this.getCombatantMaxHp(caller);
            if (!(maxHp > 0)) return false;

            // Sage uses potions more conservatively than monk/soldier.
            if (!(caller.hp < (maxHp * 0.45))) return false;
            if (!this.useConsumable) return false;

            const groupInv = (typeof this.getCurrentInventory === 'function')
                ? this.getCurrentInventory()
                : (Array.isArray(caller.inventory) ? caller.inventory : []);

            if (!groupInv || !groupInv.length) {
                this.debugLog('consumable:heal-none-available', {
                    callerId: caller?.id,
                    callerName: caller?.name,
                    hp: caller?.hp,
                    maxHp
                });
                return false;
            }

            const potionIdx = groupInv.findIndex(item =>
                item && (item.effect === 'health gain' || (item.name && item.name.toLowerCase().includes('potion')))
            );
            if (potionIdx === -1) {
                this.debugLog('consumable:heal-no-potion-found', {
                    callerId: caller?.id,
                    callerName: caller?.name,
                    hp: caller?.hp,
                    maxHp
                });
                return false;
            }

            const isGroupInventory = (typeof this.getCurrentInventory === 'function');
            let item;
            if (!isGroupInventory && Array.isArray(caller.inventory)) {
                item = caller.inventory.splice(potionIdx, 1)[0];
            } else {
                item = groupInv[potionIdx];
            }

            this.debugLog('consumable:heal-using', {
                callerId: caller?.id,
                callerName: caller?.name,
                hpBefore: caller?.hp,
                maxHp,
                itemName: item?.name || null,
                itemEffect: item?.effect || null,
                itemAmount: item?.amount || null
            });

            try { this.useConsumable(item, caller); } catch (e) {
                this.debugLog('consumable:heal-use-failed', { error: e?.message || String(e) });
                return false;
            }

            if (typeof this.broadcastDataUpdate === 'function') {
                this.broadcastDataUpdate(caller);
            }

            this.debugLog('consumable:heal-used', {
                callerId: caller?.id,
                callerName: caller?.name,
                hpAfter: caller?.hp,
                maxHp
            });
            return true;
        } catch (err) {
            return false;
        }
    }

    // combat-manager.chooseAttackType expects every profile to expose this.
    this.chooseAttackType = (caller, target, combatants = null) => { // eslint-disable-line no-unused-vars
        if (!caller || !Array.isArray(caller.attacks) || caller.attacks.length === 0) return null;

        const directDispelAttack = caller.attacks.find(a => a && a.name === 'direct_dispel') || null;
        const healAttack = caller.attacks.find(a => a && a.name === 'heal') || null;
        const meditateAttack = caller.attacks.find(a => a && a.name === 'meditate') || null;

        if (combatants) {
            if (directDispelAttack && this.isAttackReady(directDispelAttack)) {
                const needsDispel = Object.values(combatants).some(e => {
                    if (!this.isFriendly(e)) return false;
                    return (e.activeDebuffs && e.activeDebuffs.length > 0) ||
                        e.poison || e.poisoned || e.bleed || e.frozen || e.stunned ||
                        e.feared || e.asleep || e.ensnared || e.marked || e.hexed ||
                        e.betrayed || e.polymorphed || e.silenced || e.demonMarked;
                });
                if (needsDispel) {
                    return directDispelAttack;
                }
            }

            const needsHealing = Object.values(combatants).some(e =>
                this.isFriendly(e) && e.id !== caller.id && e.hp < this.getCombatantMaxHp(e)
            );
            if (needsHealing && healAttack && this.isAttackReady(healAttack)) {
                return healAttack;
            }
        }

        if (meditateAttack && this.isAttackReady(meditateAttack)) return meditateAttack;
        if (healAttack && this.isAttackReady(healAttack)) return healAttack;
        return caller.attacks.find(a => this.isAttackReady(a)) || null;
    }
    
    // Acquire target: prioritize healing friendlies over attacking enemies
    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        this.debugLog('acquireTarget:start', {
            callerId: caller?.id,
            callerName: caller?.name,
            callerCoords: caller?.coordinates,
            targetToAvoid: targetToAvoid?.id || null,
            currentTargetId: caller?.targetId || null,
            pendingAttack: caller?.pendingAttack?.name || null
        });

        // First, check if direct_dispel is ready and anyone needs a dispel
        const directDispelAttack = caller.attacks && caller.attacks.find(a => a && a.name === 'direct_dispel');
        if (directDispelAttack && this.isAttackReady(directDispelAttack)) {
            const debuffedFriendlies = Object.values(combatants).filter(e => {
                if (!this.isFriendly(e)) return false;
                return (e.activeDebuffs && e.activeDebuffs.length > 0) ||
                    e.poison || e.poisoned || e.bleed || e.frozen || e.stunned ||
                    e.feared || e.asleep || e.ensnared || e.marked || e.hexed ||
                    e.betrayed || e.polymorphed || e.silenced || e.demonMarked;
            });
            if (debuffedFriendlies.length > 0) {
                const targetToDispel = debuffedFriendlies[0];
                caller.targetId = targetToDispel.id;
                caller.pendingAttack = directDispelAttack;
                return;
            }
        }

        // First, check if any friendly needs healing (hp < max_hp)
        const healthyFriendlies = this.getHealableFriendlies(caller, combatants);

        this.debugLog('acquireTarget:healableFriendlies', healthyFriendlies.map(f => ({
            id: f.id,
            name: f.name,
            hp: f.hp,
            maxHp: this.getCombatantMaxHp(f),
            deficit: this.getCombatantMaxHp(f) - f.hp,
            coords: f.coordinates
        })));
        
        if (healthyFriendlies.length > 0) {
            // Prioritize friendly with largest HP differential (max_hp - current_hp)
            let targetToHeal = healthyFriendlies[0];
            let maxDifferential = this.getCombatantMaxHp(targetToHeal) - targetToHeal.hp;
            
            for (let friendly of healthyFriendlies) {
                const differential = this.getCombatantMaxHp(friendly) - friendly.hp;
                if (differential > maxDifferential) {
                    targetToHeal = friendly;
                    maxDifferential = differential;
                }
            }
            
            caller.targetId = targetToHeal.id;
            caller.pendingAttack = this.chooseAttackType(caller, targetToHeal, combatants);
            this.debugLog('acquireTarget:selectedHealTarget', {
                targetId: caller.targetId,
                targetName: targetToHeal.name,
                targetCoords: targetToHeal.coordinates,
                hp: targetToHeal.hp,
                maxHp: this.getCombatantMaxHp(targetToHeal),
                deficit: maxDifferential,
                pendingAttack: caller.pendingAttack?.name || null
            });
            return;
        }
        
        // No one needs healing yet: hold center-back and wait for a valid heal target.
        caller.targetId = null;
        caller.pendingAttack = null;
        this.debugLog('acquireTarget:noHealableFriendlies-idle', {
            callerId: caller?.id,
            callerName: caller?.name,
            action: 'hold-center-back'
        });
    }
    
    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            debugger;
            throw new Error('moveCooldown must be defined for all units');
        }

        // If Sage is injured and a potion is available, consume before movement/action.
        const usedPotion = this.tryUseConsumableForHeal(caller);
        if (usedPotion) {
            this.debugLog('processMove:consumable-used-skip-turn', {
                callerId: caller?.id,
                callerName: caller?.name,
                hpNow: caller?.hp,
                maxHp: this.getCombatantMaxHp(caller)
            });
            return;
        }

        this.debugLog('processMove:start', {
            callerId: caller?.id,
            callerName: caller?.name,
            callerCoords: caller?.coordinates,
            moveCooldown: caller?.moveCooldown,
            targetId: caller?.targetId || null,
            pendingAttack: caller?.pendingAttack?.name || null
        });

        const healableFriendlies = this.getHealableFriendlies(caller, combatants);
        const currentTarget = caller.targetId ? combatants[caller.targetId] : null;
        const currentTargetNeedsHeal = !!currentTarget && this.isFriendly(currentTarget) && currentTarget.hp < this.getCombatantMaxHp(currentTarget);
        const shouldForceHealRetarget = healableFriendlies.length > 0 && (
            !caller.pendingAttack ||
            caller.pendingAttack.name !== 'heal' ||
            !currentTargetNeedsHeal
        );

        if (shouldForceHealRetarget) {
            this.debugLog('processMove:force-heal-retarget', {
                healableCount: healableFriendlies.length,
                pendingAttack: caller?.pendingAttack?.name || null,
                currentTargetId: caller?.targetId || null,
                currentTargetNeedsHeal
            });
            this.acquireTarget(caller, combatants);
        }

        if (!caller.pendingAttack || !caller.targetId || !combatants[caller.targetId] || combatants[caller.targetId].dead) {
            this.debugLog('processMove:reacquireTarget-needed', {
                hadPendingAttack: !!caller.pendingAttack,
                targetId: caller?.targetId || null,
                hasLiveTarget: !!(caller?.targetId && combatants[caller.targetId] && !combatants[caller.targetId].dead)
            });
            this.acquireTarget(caller, combatants);
        }

        // If there is still no valid heal target, position at center-back and wait.
        if (!caller.pendingAttack || !caller.targetId) {
            this.debugLog('processMove:idle-center-back', {
                callerId: caller?.id,
                callerCoordsBeforeMove: caller?.coordinates
            });
            data.methods.stayOnBackRow(caller, combatants);
            this.debugLog('processMove:idle-center-back-afterMove', {
                callerCoordsAfterMove: caller?.coordinates,
                callerDepth: caller?.depth,
                callerPosition: caller?.position
            });
            return;
        }

        if (!caller.pendingAttack) {
            this.debugLog('processMove:abort-noPendingAttack-afterReacquire', { callerId: caller?.id, callerName: caller?.name });
            return;
        }
        
        // Move towards target for heal or meditate (both target friendlies)
        if (caller.pendingAttack.name === 'heal' || caller.pendingAttack.name === 'meditate') {
            const target = caller.targetId ? combatants[caller.targetId] : null;
            this.debugLog('processMove:moveTowardsFriendlyTarget', {
                targetId: caller?.targetId || null,
                targetName: target?.name || null,
                targetCoords: target?.coordinates || null,
                callerCoordsBeforeMove: caller?.coordinates
            });
            data.methods.moveTowardsCloseFriendlyTarget(caller, combatants);
            // Heal pathing catch-up: when both units advance forward at similar speed,
            // the Sage can remain perpetually 2 tiles behind. Take an extra step while
            // in heal mode if still not adjacent to the heal target.
            if (caller.pendingAttack.name === 'heal' && target) {
                const postMoveDistance = data.methods.getDistanceToTarget(caller, target);
                const postMoveLaneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
                const stillOutOfRange = !this.isFriendlyAdjacentRange(postMoveDistance, postMoveLaneDiff);
                if (stillOutOfRange) {
                    this.debugLog('processMove:heal-catchup-step', {
                        postMoveDistance,
                        postMoveLaneDiff,
                        callerCoordsBeforeCatchup: caller?.coordinates
                    });
                    data.methods.moveTowardsCloseFriendlyTarget(caller, combatants);
                }
            }
            this.debugLog('processMove:afterMoveTowardsFriendlyTarget', {
                callerCoordsAfterMove: caller?.coordinates,
                callerDepth: caller?.depth,
                callerPosition: caller?.position
            });
        } else if (caller.pendingAttack.name === 'cane_strike') {
            this.debugLog('processMove:caneStrike-branch');
            debugger;
        }

        // Attack trigger must live in processMove (eraAttack removed in factories.js)
        {
            const era = caller.eras ? caller.eras[caller.eraIndex] : null;
            if (era && !era.attacked && !caller.onGeneralAttackCooldown && !caller.attacking && caller.pendingAttack && this.isAttackReady(caller.pendingAttack)) {
                const target = combatants[caller.targetId];
                if (target && !target.dead && !target.isVCT) {
                    const distanceToTarget = data.methods.getDistanceToTarget(caller, target);
                    const laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
                    const dx = Math.abs(caller.coordinates.x - target.coordinates.x);
                    const dy = Math.abs(caller.coordinates.y - target.coordinates.y);
                    const dist = dx + dy;
                    const atkRange = caller.pendingAttack.range || 'close';
                    const attackName = caller.pendingAttack?.name || '';
                    const inRange = (attackName === 'heal' || attackName === 'meditate')
                        ? this.isFriendlyAdjacentRange(distanceToTarget, laneDiff)
                        : (atkRange === 'close' ? dist === 1 : atkRange === 'medium' ? dist <= 3 : dist <= 6);

                    this.debugLog('processMove:attackCheck', {
                        eraIndex: caller.eraIndex,
                        eraAttacked: era.attacked,
                        pendingAttack: caller.pendingAttack?.name || null,
                        atkRange,
                        distanceToTarget,
                        laneDiff,
                        dist,
                        dx,
                        dy,
                        inRange,
                        callerCoords: caller.coordinates,
                        targetId: target.id,
                        targetName: target.name,
                        targetCoords: target.coordinates,
                        onGeneralAttackCooldown: !!caller.onGeneralAttackCooldown,
                        attacking: !!caller.attacking
                    });

                    if (inRange) {
                        era.attacked = true;
                        this.debugLog('processMove:attackTriggered', {
                            pendingAttack: caller.pendingAttack?.name || null,
                            targetId: target.id,
                            targetName: target.name
                        });
                        caller.attack();
                    }
                } else {
                    this.debugLog('processMove:attackCheck-abort-invalidTarget', {
                        targetId: caller?.targetId || null,
                        hasTarget: !!target,
                        targetDead: !!(target && target.dead),
                        isVCT: !!(target && target.isVCT)
                    });
                }
            } else {
                this.debugLog('processMove:attackCheck-skipped', {
                    hasEra: !!era,
                    eraAttacked: !!(era && era.attacked),
                    onGeneralAttackCooldown: !!caller.onGeneralAttackCooldown,
                    attacking: !!caller.attacking,
                    hasPendingAttack: !!caller.pendingAttack
                });
            }
        }
    }
    
    this.initiateAttack = (caller, manualAttack, combatants) => { // eslint-disable-line no-unused-vars
        if (!caller?.pendingAttack || !this.isAttackReady(caller.pendingAttack)) {
            this.debugLog('initiateAttack:abort-attackOnCooldown', {
                callerId: caller?.id,
                callerName: caller?.name,
                pendingAttack: caller?.pendingAttack?.name || null,
                cooldownPosition: caller?.pendingAttack?.cooldown_position
            });
            return;
        }

        const target = combatants[caller.targetId];
        if (!target) {
            this.debugLog('initiateAttack:abort-noTarget', {
                callerId: caller?.id,
                callerName: caller?.name,
                targetId: caller?.targetId || null,
                pendingAttack: caller?.pendingAttack?.name || null
            });
            return;
        }
        
        const distanceToTarget = data.methods.getDistanceToTarget(caller, target);
        const laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
        this.debugLog('initiateAttack:start', {
            callerId: caller?.id,
            callerName: caller?.name,
            callerCoords: caller?.coordinates,
            targetId: target?.id,
            targetName: target?.name,
            targetCoords: target?.coordinates,
            pendingAttack: caller?.pendingAttack?.name || null,
            distanceToTarget,
            laneDiff,
            targetIsFriendly: this.isFriendly(target),
            targetIsEnemy: !!(target.isMonster || target.isMinion)
        });
        
        // Handle direct dispel attack on friendly targets
        if (caller.pendingAttack.name === 'direct_dispel') {
            if (this.isFriendly(target)) {
                const inRange = this.isFriendlyAdjacentRange(distanceToTarget, laneDiff);
                if (!inRange) {
                    if (typeof this.missesTarget === 'function') this.missesTarget(caller);
                    return;
                }
                
                caller.healing = true;
                
                if (Array.isArray(target.activeDebuffs)) {
                    target.activeDebuffs.forEach(debuff => {
                        if (debuff.statChanges) {
                            Object.entries(debuff.statChanges).forEach(([stat, amount]) => {
                                target.stats[stat] = (target.stats[stat] || 0) + amount;
                            });
                        }
                    });
                    target.activeDebuffs = [];
                }
                
                target.poison = false;
                target.poisoned = false;
                target.poisonRounds = 0;
                target.bleed = false;
                target.bleedRounds = 0;
                target.stunned = false;
                target.stunnedRounds = 0;
                target.asleep = false;
                target.sleepRounds = 0;
                target.feared = false;
                target.fearRounds = 0;
                target.frozen = false;
                target.frozenRounds = 0;
                target.ensnared = false;
                target.marked = false;
                target.hexed = false;
                target.betrayed = false;
                target.polymorphed = false;
                target.silenced = false;
                target.demonMarked = false;

                // trigger animation and pulse
                target.dispelPulse = true;
                if (typeof this.broadcastDataUpdate === 'function') {
                    this.broadcastDataUpdate(target);
                }
                setTimeout(() => {
                    target.dispelPulse = false;
                    if (typeof this.broadcastDataUpdate === 'function') {
                        this.broadcastDataUpdate(target);
                    }
                }, 550);

                if (typeof this.kickoffAttackCooldown === 'function') {
                    this.kickoffAttackCooldown(caller);
                }
                setTimeout(() => {
                    caller.healing = false;
                }, 250);
                return;
            }
        }

        // Handle heal attack on friendly targets
        if (caller.pendingAttack.name === 'heal') {
            if (this.isFriendly(target)) {
                const inHealRange = this.isFriendlyAdjacentRange(distanceToTarget, laneDiff);
                if (!inHealRange) {
                    this.debugLog('initiateAttack:heal-outOfRange', {
                        targetId: target.id,
                        targetName: target.name,
                        distanceToTarget,
                        laneDiff
                    });
                    if (typeof this.missesTarget === 'function') this.missesTarget(caller);
                    return;
                }
                this.debugLog('initiateAttack:heal-branch', {
                    note: 'Healing friendly target within adjacent range.',
                    distanceToTarget,
                    laneDiff,
                    targetHpBefore: target.hp,
                    targetMaxHp: this.getCombatantMaxHp(target),
                    healAmount: this.resolveHealAmount(caller.pendingAttack)
                });
                // Perform heal animation and apply healing
                if (animationManager && typeof animationManager.heal === 'function') {
                    const sourceCoords = { x: caller.coordinates.x, y: caller.coordinates.y };
                    const targetCoords = { x: target.coordinates.x, y: target.coordinates.y };
                    this.debugLog('initiateAttack:heal-animation-start', { sourceCoords, targetCoords });
                    animationManager.heal(sourceCoords, targetCoords, () => {
                        caller.healing = true;
                        const healResult = this.applyHealToTarget(caller, target, caller.pendingAttack, 'heal-animation');
                        this.triggerHealPulse(target);
                        this.debugLog('initiateAttack:heal-animation-complete', {
                            targetId: target.id,
                            targetName: target.name,
                            healAmountRequested: healResult.requestedHeal,
                            healAmountApplied: healResult.appliedHeal,
                            targetHpAfter: healResult.hpAfter,
                            targetMaxHp: healResult.maxHp
                        });
                        
                        if (typeof this.broadcastDataUpdate === 'function') {
                            this.debugLog('initiateAttack:heal-animation-broadcast', {
                                callerId: caller?.id,
                                targetId: target?.id,
                                targetHpNow: target?.hp
                            });
                            this.broadcastDataUpdate(caller);
                        }

                        if (typeof this.kickoffAttackCooldown === 'function') {
                            this.kickoffAttackCooldown(caller);
                        }
                        setTimeout(() => {
                            caller.healing = false;
                        }, 250);
                    });
                } else {
                    // Fallback if animation not available
                    caller.healing = true;
                    const healResult = this.applyHealToTarget(caller, target, caller.pendingAttack, 'heal-no-animation');
                    this.triggerHealPulse(target);
                    this.debugLog('initiateAttack:heal-noAnimationFallback', {
                        targetId: target.id,
                        targetName: target.name,
                        healAmountRequested: healResult.requestedHeal,
                        healAmountApplied: healResult.appliedHeal,
                        targetHpAfter: healResult.hpAfter,
                        targetMaxHp: healResult.maxHp
                    });
                    
                    if (typeof this.broadcastDataUpdate === 'function') {
                        this.debugLog('initiateAttack:heal-noAnimation-broadcast', {
                            callerId: caller?.id,
                            targetId: target?.id,
                            targetHpNow: target?.hp
                        });
                        this.broadcastDataUpdate(caller);
                    }

                    if (typeof this.kickoffAttackCooldown === 'function') {
                        this.kickoffAttackCooldown(caller);
                    }
                    setTimeout(() => {
                        caller.healing = false;
                    }, 250);
                }
                return;
            }
            this.debugLog('initiateAttack:heal-branch-nonFriendlyTarget', {
                targetId: target?.id,
                targetName: target?.name,
                targetIsFriendly: this.isFriendly(target)
            });
        }
        
        // Handle enemy targets (attack with hitsCombatant)
        if (target.isMonster || target.isMinion) {
            this.debugLog('initiateAttack:enemy-branch', { targetId: target.id, targetName: target.name });
            if (typeof this.hitsCombatant === 'function') {
                this.hitsCombatant(caller, target);
            } else if (typeof this.hitsTarget === 'function') {
                this.hitsTarget(caller);
            }
            if (typeof this.kickoffAttackCooldown === 'function') {
                this.kickoffAttackCooldown(caller);
            }
        } else {
            // Meditate on friendly targets (existing logic)
            if (distanceToTarget === 1 && laneDiff === 0) { 
                this.debugLog('initiateAttack:meditate-direct', {
                    targetId: target.id,
                    targetName: target.name,
                    targetHpBefore: target.hp,
                    targetMaxHp: this.getCombatantMaxHp(target)
                });
                caller.healing = true;
                const healResult = this.applyHealToTarget(caller, target, { name: 'meditate', damage: 10 }, 'meditate-direct');
                this.debugLog('initiateAttack:meditate-direct-complete', {
                    healAmountRequested: healResult.requestedHeal,
                    healAmountApplied: healResult.appliedHeal,
                    targetHpAfter: healResult.hpAfter,
                    targetMaxHp: healResult.maxHp
                });
                if (typeof this.kickoffAttackCooldown === 'function') {
                    this.kickoffAttackCooldown(caller);
                }
                setTimeout(() => {
                    caller.healing = false;
                }, 250);
            } else if (distanceToTarget === 0 && (laneDiff === 1 || laneDiff === -1)) {
                this.debugLog('initiateAttack:meditate-adjacent-lane-shift', {
                    targetId: target.id,
                    targetName: target.name,
                    callerPositionBefore: caller.position,
                    callerDepthBefore: caller.depth,
                    targetPosition: target.position,
                    targetDepth: target.depth
                });
                caller.position = target.position;
                caller.depth = target.depth - 1;
                setTimeout(() => {
                    caller.healing = true;
                    const healResult = this.applyHealToTarget(caller, target, { name: 'meditate', damage: 10 }, 'meditate-adjacent-lane-shift');
                    this.debugLog('initiateAttack:meditate-adjacent-heal-complete', {
                        targetId: target.id,
                        targetName: target.name,
                        healAmountRequested: healResult.requestedHeal,
                        healAmountApplied: healResult.appliedHeal,
                        targetHpAfter: healResult.hpAfter,
                        targetMaxHp: healResult.maxHp,
                        callerPositionAfter: caller.position,
                        callerDepthAfter: caller.depth
                    });
                }, 300);
                if (typeof this.kickoffAttackCooldown === 'function') {
                    this.kickoffAttackCooldown(caller);
                }
                setTimeout(() => {
                    caller.healing = false;
                }, 550);
            } else if (distanceToTarget === 1 && (laneDiff === 1 || laneDiff === -1)) {
                this.debugLog('initiateAttack:miss-diagonal', { targetId: target.id, targetName: target.name, distanceToTarget, laneDiff });
                if (typeof this.missesTarget === 'function') this.missesTarget(caller);
            } else {
                this.debugLog('initiateAttack:miss-outOfRange', { targetId: target.id, targetName: target.name, distanceToTarget, laneDiff });
                if (typeof this.missesTarget === 'function') this.missesTarget(caller);
            }
        }
    }
}