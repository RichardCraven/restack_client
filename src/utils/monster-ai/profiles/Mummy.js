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

        // --- BEGIN 2x ADJACENCY LOGIC ---
        // For 2x monsters, check adjacency to all occupied tiles
        // Assume scale=2 means 2x2, anchor at (x, y)
        const occupiedTiles = [];
        const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
        const baseX = caller.coordinates.x;
        const baseY = caller.coordinates.y;
        for (let dx = 0; dx < scale; dx++) {
            for (let dy = 0; dy < scale; dy++) {
                occupiedTiles.push({ x: baseX + dx, y: baseY + dy });
            }
        }

        // Check if target is adjacent to any occupied tile
        const isAdjacent = occupiedTiles.some(tile => {
            const dx = Math.abs(target.coordinates.x - tile.x);
            const dy = Math.abs(target.coordinates.y - tile.y);
            return (dx + dy === 1); // 4-way adjacency
        });

        const available = caller.attacks.filter(e => e.cooldown_position === 100);
        const mostRecovered = (list) => list.reduce((best, a) => (a.cooldown_position > best.cooldown_position ? a : best), list[0]);

        if (isAdjacent) {
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
        // Find all valid enemies (guaranteed VCT exclusion)
        const isMonsterOrMinion = caller.isMonster || caller.isMinion;
        const enemies = Object.values(combatants).filter(e => {
            if (isMonsterOrMinion) {
                return !e.dead && e.id !== caller.id && !e.isMonster && !e.isMinion && !e.isVCT;
            } else {
                return !e.dead && e.id !== caller.id && (e.isMonster || e.isMinion) && !e.isVCT;
            }
        });
        // Use virtually occupied tiles for adjacency checks (for 2x2 monsters)
        let occupiedTiles = Array.isArray(caller.occupiedTiles) && caller.occupiedTiles.length > 0
            ? caller.occupiedTiles
            : (() => {
                const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
                const baseX = caller.coordinates.x;
                const baseY = caller.coordinates.y;
                const tiles = [];
                for (let dx = 0; dx < scale; dx++) {
                    for (let dy = 0; dy < scale; dy++) {
                        tiles.push({ x: baseX + dx, y: baseY + dy });
                    }
                }
                return tiles;
            })();

        // Scan all enemies for best possible target/attack pair
        let best = null;
        for (const enemy of enemies) {
            if (enemy.isVCT) continue; // Extra guard
            // For each attack, check if enemy is in range and attack is ready
            for (const attack of caller.attacks) {
                if (attack.cooldown_position < 100) continue;
                let inRange = false;
                if (attack.range === 'close') {
                    inRange = occupiedTiles.some(tile => {
                        const dx = Math.abs(enemy.coordinates.x - tile.x);
                        const dy = Math.abs(enemy.coordinates.y - tile.y);
                        return (dx + dy === 1);
                    });
                } else if (attack.range === 'medium') {
                    const minDist = Math.min(...occupiedTiles.map(tile => {
                        const dx = Math.abs(enemy.coordinates.x - tile.x);
                        const dy = Math.abs(enemy.coordinates.y - tile.y);
                        return dx + dy;
                    }));
                    inRange = minDist <= 3;
                } else if (attack.range === 'far') {
                    const minDist = Math.min(...occupiedTiles.map(tile => {
                        const dx = Math.abs(enemy.coordinates.x - tile.x);
                        const dy = Math.abs(enemy.coordinates.y - tile.y);
                        return dx + dy;
                    }));
                    inRange = minDist <= 6;
                }
                if (inRange) {
                    // Prefer adjacent/close, then medium, then far, then most recovered
                    if (!best || (attack.range === 'close' && best.attack.range !== 'close') ||
                        (attack.range === 'medium' && best.attack.range === 'far') ||
                        (attack.cooldown_position > best.attack.cooldown_position)) {
                        best = { enemy, attack };
                    }
                }
            }
        }
        if (best && !best.enemy.isVCT) {
            caller.targetId = best.enemy.id;
            caller.pendingAttack = best.attack;
            return;
        }
        // Fallback: no one in range, use closest soft target (guaranteed VCT exclusion)
        let fallbackTarget = AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (fallbackTarget) {
            if (fallbackTarget.isVCT) {
                if (typeof console !== 'undefined') {
                    console.warn('[Mummy AI] Fallback target is a VCT! Excluding. id:', fallbackTarget.id, fallbackTarget);
                }
                fallbackTarget = null;
            }
        }
        if (fallbackTarget) {
            caller.targetId = fallbackTarget.id;
            caller.pendingAttack = this.chooseAttackType(caller, fallbackTarget);
        } else {
            caller.targetId = null;
            caller.pendingAttack = null;
        }
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

        // Apply 50% ATK and DEF reduction to all non-monster, non-minion combatants, excluding VCTs
        const enemies = Object.values(combatants).filter(c => !c.dead && !c.isMonster && !c.isMinion && !c.isVCT);
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
            const atkId = Date.now() + Math.random();
            const atkObj = { id: atkId, value: 'ATK ↓', source: 'Mummy' };
            enemy.damageIndicators.push(atkObj);
            console.log('[DIAG][Mummy] Pushed to enemy.damageIndicators:', atkObj, 'Current:', enemy.damageIndicators);
            setTimeout(() => {
                const idx = enemy.damageIndicators.findIndex(e => e && e.id === atkId);
                if (idx !== -1) enemy.damageIndicators.splice(idx, 1);
                if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
            }, 1800);
        });
        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate();
        setTimeout(() => {
            enemies.forEach(enemy => {
                if (enemy.dead) return;
                if (!Array.isArray(enemy.damageIndicators)) enemy.damageIndicators = [];
                const defId = Date.now() + Math.random();
                const defObj = { id: defId, value: 'DEF ↓', source: 'Mummy' };
                enemy.damageIndicators.push(defObj);
                setTimeout(() => {
                    const idx = enemy.damageIndicators.findIndex(e => e && e.id === defId);
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

        // Safety-net removed: fear is now only cleared by tick-based logic in restartTurnCycle.

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

        // --- DIAGNOSTIC: Log before acquireTarget ---
        if (typeof console !== 'undefined') {
            const t = caller.targetId && combatants[caller.targetId] ? combatants[caller.targetId] : null;
            console.log('[Mummy][DIAG] BEFORE acquireTarget:', {
                targetId: caller.targetId,
                targetIsVCT: t ? !!t.isVCT : null,
                target: t
            });
        }

        // Retarget every turn to always track the closest enemy
        this.acquireTarget(caller, combatants);

        // --- DIAGNOSTIC: Log after acquireTarget ---
        if (typeof console !== 'undefined') {
            const t = caller.targetId && combatants[caller.targetId] ? combatants[caller.targetId] : null;
            console.log('[Mummy][DIAG] AFTER acquireTarget:', {
                targetId: caller.targetId,
                targetIsVCT: t ? !!t.isVCT : null,
                target: t
            });
        }

        // --- FINAL UNCONDITIONAL VCT GUARD ---
        if (caller.targetId && combatants[caller.targetId] && combatants[caller.targetId].isVCT) {
            if (typeof console !== 'undefined') {
                console.warn('[Mummy][VCT-GUARD] TargetId was set to a VCT after acquireTarget! Forcing to null.', {
                    targetId: caller.targetId,
                    target: combatants[caller.targetId]
                });
            }
            caller.targetId = null;
            caller.pendingAttack = null;
        }

        //console.log(`[Mummy] processMove — eraIndex=${caller.eraIndex}, targetId=${caller.targetId}, pendingAttack=${caller.pendingAttack?.name}, attacking=${caller.attacking}, moveCooldown=${caller.moveCooldown}, energy=${Math.floor(caller.energy || 0)}`);
        //console.log('[Mummy][DEBUG] State at processMove:', {
        //    pendingAttack: caller.pendingAttack,
        //    attacking: caller.attacking,
        //    moveCooldown: caller.moveCooldown,
        //    onMoveCooldown: caller.onMoveCooldown,
        //    targetId: caller.targetId,
        //    hp: caller.hp,
        //    energy: caller.energy
        //});

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

        // Prevent movement if already adjacent to any enemy (stand and fight)
        if (!caller.castingLock) {
            // Use virtually occupied tiles for adjacency checks
            let occupiedTiles = Array.isArray(caller.occupiedTiles) && caller.occupiedTiles.length > 0
                ? caller.occupiedTiles
                : (() => {
                    const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
                    const baseX = caller.coordinates.x;
                    const baseY = caller.coordinates.y;
                    const tiles = [];
                    for (let dx = 0; dx < scale; dx++) {
                        for (let dy = 0; dy < scale; dy++) {
                            tiles.push({ x: baseX + dx, y: baseY + dy });
                        }
                    }
                    return tiles;
                })();
            // Only check adjacency to the current target
            let target = caller.targetId && combatants[caller.targetId] ? combatants[caller.targetId] : null;
            let isAdjacentToTarget = false;
            if (target) {
                isAdjacentToTarget = occupiedTiles.some(tile => {
                    const dx = Math.abs(target.coordinates.x - tile.x);
                    const dy = Math.abs(target.coordinates.y - tile.y);
                    return (dx + dy === 1);
                });
            }
            if (!isAdjacentToTarget) {
                // Try to move toward the target; if blocked, try to move around blocker
                const prevX = caller.coordinates.x;
                const prevY = caller.coordinates.y;
                // --- Enhanced: Prevent overlap for large monsters ---
                const tryMove = (moveFn) => {
                    // Simulate move
                    const origX = caller.coordinates.x;
                    const origY = caller.coordinates.y;
                    moveFn();
                    // Calculate new virtually occupied tiles
                    const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
                    const newTiles = [];
                    for (let dx = 0; dx < scale; dx++) {
                        for (let dy = 0; dy < scale; dy++) {
                            newTiles.push({ x: caller.coordinates.x + dx, y: caller.coordinates.y + dy });
                        }
                    }
                    // Check for overlap with any other unit
                    let overlap = false;
                    Object.values(combatants).forEach(e => {
                        if (e.dead || e.id === caller.id) return;
                        // Check anchor
                        if (newTiles.some(t => t.x === e.coordinates.x && t.y === e.coordinates.y)) overlap = true;
                        // Check virtually occupied tiles if present
                        if (Array.isArray(e.occupiedTiles)) {
                            if (newTiles.some(t => e.occupiedTiles.some(et => et.x === t.x && et.y === t.y))) overlap = true;
                        }
                    });
                    // Undo move if overlap
                    if (overlap) {
                        caller.coordinates.x = origX;
                        caller.coordinates.y = origY;
                        return false;
                    }
                    return true;
                };
                // Try closeTheGap
                const moved = tryMove(() => data.methods.closeTheGap(caller, combatants));
                if (!moved) {
                    // Movement was blocked or would overlap, try to move around blocker
                    tryMove(() => this.tryMoveAroundBlocker(caller, combatants));
                }
            }
        }

        // Keep facing toward target
        if (caller.targetId && combatants[caller.targetId]) {
            const target = combatants[caller.targetId];
            // --- Improved: For 2x monsters, if target is in any column of the Mummy and directly above or below, do not update facing ---
            const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
            const is2x = scale === 2;
            let skipFacing = false;
            if (is2x) {
                const x0 = caller.coordinates.x;
                const x1 = x0 + 1;
                const y0 = caller.coordinates.y;
                const y1 = y0 + 1;
                const inMummyColumn = (target.coordinates.x === x0 || target.coordinates.x === x1);
                const directlyAbove = target.coordinates.y === y0 - 1;
                const directlyBelow = target.coordinates.y === y1 + 1;
                if (inMummyColumn && (directlyAbove || directlyBelow)) {
                    skipFacing = true;
                }
            }
            if (!skipFacing) {
                caller.facing = (caller.coordinates.x <= target.coordinates.x) ? 'right' : 'left';
            }
            // --- Robust attack trigger: allow attack if target is adjacent to any occupied tile ---
            const occupiedTiles = Array.isArray(caller.occupiedTiles) && caller.occupiedTiles.length > 0
                ? caller.occupiedTiles
                : (() => {
                    const scale = caller.scale || caller["main-monster"] || caller.isMainMonster ? 2 : 1;
                    const baseX = caller.coordinates.x;
                    const baseY = caller.coordinates.y;
                    const tiles = [];
                    for (let dx = 0; dx < scale; dx++) {
                        for (let dy = 0; dy < scale; dy++) {
                            tiles.push({ x: baseX + dx, y: baseY + dy });
                        }
                    }
                    return tiles;
                })();
            let isAdjacentToTarget = false;
            if (target) {
                isAdjacentToTarget = occupiedTiles.some(tile => {
                    const dx = Math.abs(target.coordinates.x - tile.x);
                    const dy = Math.abs(target.coordinates.y - tile.y);
                    return (dx + dy === 1);
                });
            }
            if (
                caller.pendingAttack &&
                !caller.attacking &&
                (!caller.castingLock) &&
                caller.pendingAttack.cooldown_position === 100 &&
                isAdjacentToTarget
            ) {
                this.initiateAttack(caller, combatants);
            }
            // (skip the old attack trigger logic)
            // --- Attack trigger logic ---
            // If we have a pendingAttack and are not already attacking, check if we can attack now
            if (
                caller.pendingAttack &&
                !caller.attacking &&
                (!caller.castingLock) &&
                caller.pendingAttack.cooldown_position === 100 // attack is ready
            ) {
                // Check if target is in range for the pending attack
                const attackRange = caller.pendingAttack.range;
                // For 2x monsters, check adjacency to all occupied tiles
                const occupiedTiles = (caller.scale === 2 && Array.isArray(caller.occupiedTiles))
                    ? caller.occupiedTiles
                    : [caller.coordinates];
                let inRange = false;
                if (attackRange === 'close') {
                    // Adjacent to any occupied tile
                    inRange = occupiedTiles.some(tile => {
                        const dx = Math.abs(tile.x - target.coordinates.x);
                        const dy = Math.abs(tile.y - target.coordinates.y);
                        return (dx + dy === 1); // 4-way adjacency
                    });
                } else if (attackRange === 'medium' || attackRange === 'far') {
                    // Use Manhattan distance for range
                    const minDist = Math.min(...occupiedTiles.map(tile => {
                        const dx = Math.abs(tile.x - target.coordinates.x);
                        const dy = Math.abs(tile.y - target.coordinates.y);
                        return dx + dy;
                    }));
                    if (attackRange === 'medium') inRange = minDist <= 3;
                    if (attackRange === 'far') inRange = minDist <= 6;
                }
                if (inRange) {
                    // Fire the attack!
                    this.initiateAttack(caller, combatants);
                }
            }
        }
    }

    this.initiateAttack = async (caller, combatants) => {
        const target = combatants[caller.targetId];
        //console.log('[Mummy][DEBUG] initiateAttack called', {
        //    pendingAttack: caller.pendingAttack,
        //    attacking: caller.attacking,
        //    moveCooldown: caller.moveCooldown,
        //    onMoveCooldown: caller.onMoveCooldown,
        //    targetId: caller.targetId,
        //    hp: caller.hp,
        //    energy: caller.energy
        //});
        caller.attacking = true;
        if (!target) {
            console.log('[Mummy] initiateAttack — NO TARGET!');
            return;
        }

        const attackName = caller.pendingAttack?.name;
        //console.log(`[Mummy] initiateAttack — attack=${attackName}, target=${target.name || target.type || target.id}`);

        // Log before executing the attack
        //console.log('[Mummy][DEBUG] About to execute attack', {
        //    attackName,
        //    pendingAttack: caller.pendingAttack,
        //    attacking: caller.attacking,
        //    moveCooldown: caller.moveCooldown,
        //    onMoveCooldown: caller.onMoveCooldown,
        //    targetId: caller.targetId,
        //    hp: caller.hp,
        //    energy: caller.energy
        //});
        switch (attackName) {
            case 'grasp': {
                const attackEffect = caller.pendingAttack.effect;
                // Find which occupied tile is adjacent to the target
                let graspTile = caller.coordinates;
                if (Array.isArray(caller.occupiedTiles) && caller.occupiedTiles.length > 1) {
                    const adjTile = caller.occupiedTiles.find(tile => {
                        const dx = Math.abs(tile.x - target.coordinates.x);
                        const dy = Math.abs(tile.y - target.coordinates.y);
                        return (dx + dy === 1);
                    });
                    if (adjTile) graspTile = adjTile;
                }
                // Trigger grasp animation using animationManager at the correct tile
                if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                    await this.animationManager.triggerAttackAnimation({
                        coordinates: graspTile,
                        facing: caller.facing,
                        icon: caller.pendingAttack.icon,
                        type: 'grasp',
                        animationType: 'grasp'
                    });
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
                    const { applyDrainedEffect } = require('../../combat-effects');
                    applyDrainedEffect(target, this.broadcastDataUpdate);
                    // Boost mummy energy by 40 (capped at 100)
                    caller.energy = Math.min(100, (caller.energy || 0) + 40);
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
        caller.attacking = false;
        //console.log('[Mummy][DEBUG] Attack complete. State after attack:', {
        //    pendingAttack: caller.pendingAttack,
        //    attacking: caller.attacking,
        //    moveCooldown: caller.moveCooldown,
        //    onMoveCooldown: caller.onMoveCooldown,
        //    targetId: caller.targetId,
        //    hp: caller.hp,
        //    energy: caller.energy
        //});
    }
}
