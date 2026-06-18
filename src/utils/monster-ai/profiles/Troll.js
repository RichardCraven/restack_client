// ⚠️  AGENTS: Before writing any attack logic, read the "Required Patterns for All AI Profiles"
//    section at the top of CHANGELOG.md — pendingAttack guard, attacking flag, resolve(null)
//    fallbacks, and attack-in-processMove are all mandatory.

import { AcquireTargetMethods } from '../../shared-ai-methods/acquire-target-methods';
import { applyAttackEffect } from '../../combat-effects';
import { MonsterTargetingHelpers } from '../../shared-ai-methods/monster-targeting-methods';
import { crossesShieldWall } from '../../shared-ai-methods/movement-methods';

export function Troll(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;
    
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.kickoffSpecialCooldown = utilMethods.kickoffSpecialCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.chooseAttackTypeDefault = utilMethods.chooseAttackType;

    const { resolveTarget, isTargetInRange, getBestAttackSourceTile } = MonsterTargetingHelpers;

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler'
        caller.disableCloserRetarget = true;
    }

    this.onEraTransition = (caller, combatants) => {
        // --- Tactical Logic: Regeneration ---
        // If HP drops below 50%, try to activate regeneration independently across eras
        if (caller.hp < caller.starting_hp * 0.5 && !caller.regenerating && !caller.dead) {
            const specials = Array.isArray(caller.specials) ? caller.specials : [];
            const regenSpecials = specials.filter(s => {
                const sName = (s.name || '').toLowerCase();
                return (sName === 'regenerate' || sName === 'regeneration' || sName === 'greater_regeneration' || sName === 'greater regeneration') && 
                       s.cooldown_position === 100 && 
                       caller.energy >= (s.energy_cost || 0);
            });

            if (regenSpecials.length > 0) {
                const chosenRegen = regenSpecials.find(s => (s.name || '').toLowerCase().includes('greater')) || regenSpecials[0];
                
                // Route directly to the application layer!
                applyAttackEffect(caller, chosenRegen, this.broadcastDataUpdate);
                this.kickoffSpecialCooldown(chosenRegen);
                caller.energy -= (chosenRegen.energy_cost || 0);
            }
        }
    }

    this.chooseAttackType = (caller, target) => {
        // Standard attack choice
        caller.targetId = target ? target.id : caller.targetId;
        return this.chooseAttackTypeDefault(caller, target);
    }

    this.getEntityTiles = (entity) => {
        if (!entity) return [];
        if (Array.isArray(entity.occupiedCoords) && entity.occupiedCoords.length > 0) {
            return entity.occupiedCoords.map(c => ({ x: c.x, y: c.y }));
        }
        if (entity.coordinates && typeof entity.coordinates.x === 'number' && typeof entity.coordinates.y === 'number') {
            return [{ x: entity.coordinates.x, y: entity.coordinates.y }];
        }
        return [];
    };

    this.isTileEnterable = (caller, tile, combatants) => {
        if (!tile || typeof tile.x !== 'number' || typeof tile.y !== 'number') return false;
        if (tile.x < 0 || tile.x > this.MAX_DEPTH || tile.y < 0 || tile.y > this.MAX_LANES) return false;

        // Check shield wall crossing
        if (caller.coordinates && crossesShieldWall(caller.coordinates, tile)) {
            return false;
        }

        // Main monsters are 2-tile tall in this combat system.
        const callerIsLarge = (caller.isMonster === true && caller.isMinion !== true) || caller.large === true;
        if (callerIsLarge && tile.y - 1 < 0) return false;

        const blocked = Object.values(combatants || {}).some((e) => {
            if (!e || e.dead || e.id === caller.id) return false;
            const tiles = this.getEntityTiles(e);
            return tiles.some(t => t.x === tile.x && t.y === tile.y);
        });
        if (blocked) return false;

        if (callerIsLarge) {
            const above = { x: tile.x, y: tile.y - 1 };
            if (caller.coordinates && crossesShieldWall(caller.coordinates, above)) {
                return false;
            }
            const aboveBlocked = Object.values(combatants || {}).some((e) => {
                if (!e || e.dead || e.id === caller.id) return false;
                const tiles = this.getEntityTiles(e);
                return tiles.some(t => t.x === above.x && t.y === above.y);
            });
            if (aboveBlocked) return false;
        }

        return true;
    };

    this.getAdjacencyGoalsForTarget = (target) => {
        const targetTiles = this.getEntityTiles(target);
        const goals = [];
        targetTiles.forEach((tile) => {
            goals.push({ x: tile.x + 1, y: tile.y });
            goals.push({ x: tile.x - 1, y: tile.y });
            goals.push({ x: tile.x, y: tile.y + 1 });
            goals.push({ x: tile.x, y: tile.y - 1 });
        });
        const uniq = new Map();
        goals.forEach(g => uniq.set(`${g.x},${g.y}`, g));
        return Array.from(uniq.values()).filter(g =>
            g.x >= 0 && g.x <= this.MAX_DEPTH && g.y >= 0 && g.y <= this.MAX_LANES
        );
    };

    this.findPathToTargetAdjacency = (caller, target, combatants, maxPathLen = 18, options = {}) => {
        if (!caller || !caller.coordinates || !target) return null;

        const start = { x: caller.coordinates.x, y: caller.coordinates.y };
        const goals = this.getAdjacencyGoalsForTarget(target);
        if (!goals.length) return null;
        const avoidFirstStep = options && options.avoidFirstStep
            ? { x: options.avoidFirstStep.x, y: options.avoidFirstStep.y }
            : null;

        const isGoal = (node) => goals.some(g => g.x === node.x && g.y === node.y);
        if (isGoal(start)) return [start];

        const q = [start];
        const visited = new Set([`${start.x},${start.y}`]);
        const parent = new Map();

        const desiredDx = target.coordinates.x > start.x ? 1 : -1;
        const dirs = [
            { x: desiredDx, y: 0 },
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -desiredDx, y: 0 }
        ];

        let foundKey = null;
        while (q.length > 0) {
            const cur = q.shift();
            const curKey = `${cur.x},${cur.y}`;

            const pathDepth = (() => {
                let d = 0;
                let k = curKey;
                while (parent.has(k)) {
                    d += 1;
                    k = parent.get(k);
                }
                return d;
            })();
            if (pathDepth >= maxPathLen) continue;

            for (const d of dirs) {
                const nxt = { x: cur.x + d.x, y: cur.y + d.y };
                const nKey = `${nxt.x},${nxt.y}`;
                if (avoidFirstStep && cur.x === start.x && cur.y === start.y && nxt.x === avoidFirstStep.x && nxt.y === avoidFirstStep.y) {
                    continue;
                }
                if (visited.has(nKey)) continue;
                if (!this.isTileEnterable(caller, nxt, combatants)) continue;
                visited.add(nKey);
                parent.set(nKey, curKey);

                if (isGoal(nxt)) {
                    foundKey = nKey;
                    q.length = 0;
                    break;
                }
                q.push(nxt);
            }
        }

        if (!foundKey) return null;

        const path = [];
        let key = foundKey;
        while (key) {
            const [x, y] = key.split(',').map(Number);
            path.push({ x, y });
            key = parent.get(key);
        }
        path.reverse();
        return path;
    };

    this.areSameTile = (a, b) => {
        if (!a || !b) return false;
        return a.x === b.x && a.y === b.y;
    };

    this.getPathComplexityToTarget = (caller, target, combatants) => {
        const path = this.findPathToTargetAdjacency(caller, target, combatants);
        if (!path || path.length === 0) return Number.POSITIVE_INFINITY;
        return Math.max(0, path.length - 1);
    };

    this.selectMostAccessibleTarget = (caller, combatants) => {
        const candidates = Object.values(combatants || {}).filter(e =>
            e &&
            !e.dead &&
            !e.invisible &&
            !e.isVCT &&
            !e.isMonster &&
            !e.isMinion
        );
        if (candidates.length === 0) return null;

        const ranked = candidates.map(enemy => {
            const complexity = this.getPathComplexityToTarget(caller, enemy, combatants);
            const manhattan = Math.abs((enemy.coordinates?.x || 0) - (caller.coordinates?.x || 0))
                + Math.abs((enemy.coordinates?.y || 0) - (caller.coordinates?.y || 0));
            return { enemy, complexity, manhattan };
        }).sort((a, b) => {
            if (a.complexity !== b.complexity) return a.complexity - b.complexity;
            return a.manhattan - b.manhattan;
        });

        const bestFinite = ranked.find(r => Number.isFinite(r.complexity));
        return bestFinite ? bestFinite.enemy : ranked[0].enemy;
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

        const target = this.selectMostAccessibleTarget(caller, combatants)
            || AcquireTargetMethods.acquireClosestEnemy(caller, combatants)
            || AcquireTargetMethods.acquireClosestSoftTarget(caller, combatants);
        if (!target) {
            caller.targetId = null;
            caller.pendingAttack = null;
            return;
        }

        caller.pendingAttack = this.chooseAttackType(caller, target);
    }

    this.handleOverlap = (caller, combatants) => {
        data.methods.closeTheGap(caller, combatants)
        if(caller.targetId && caller.targetId !== caller.id){
            data.methods.evade(caller, combatants)
        }
    }

    this.processMove = (caller, combatants) => {
        if (!caller.behaviorSequence) {
            caller.behaviorSequence = 'brawler';
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
                let target = resolveTarget(caller, combatants);
                if (!target || target.dead) {
                    this.acquireTarget(caller, combatants);
                    target = resolveTarget(caller, combatants);
                }
                if (!target || target.dead) {
                    // Nothing valid to pursue this era.
                    break;
                }

                const beforeMove = caller.coordinates ? { x: caller.coordinates.x, y: caller.coordinates.y } : null;

                // Path-first movement: explicitly route around blockers before fallback heuristics.
                let pathCandidate = this.findPathToTargetAdjacency(caller, target, combatants);
                if (pathCandidate && pathCandidate.length > 1) {
                    const nextStep = pathCandidate[1];
                    const previousTile = caller._trollPreviousTile || null;
                    // If this step is an immediate backtrack, try an alternate path that avoids that first step.
                    if (previousTile && this.areSameTile(nextStep, previousTile)) {
                        const alternatePath = this.findPathToTargetAdjacency(caller, target, combatants, 18, {
                            avoidFirstStep: previousTile
                        });
                        if (alternatePath && alternatePath.length > 1) {
                            pathCandidate = alternatePath;
                        }
                    }
                }

                if (pathCandidate && pathCandidate.length > 1) {
                    const nextStep = pathCandidate[1];
                    if (this.isTileEnterable(caller, nextStep, combatants)) {
                        caller.coordinates = { x: nextStep.x, y: nextStep.y };
                        caller.depth = nextStep.x;
                        caller.position = nextStep.y;
                    }
                } else {
                    // Fallback movement if pathing fails.
                    data.methods.closeTheGapForwardFirst(caller, combatants);
                    const fallbackMove = caller.coordinates ? { x: caller.coordinates.x, y: caller.coordinates.y } : null;
                    if (beforeMove && fallbackMove && beforeMove.x === fallbackMove.x && beforeMove.y === fallbackMove.y) {
                        data.methods.closeTheGap(caller, combatants);
                    }
                }

                const afterMove = caller.coordinates ? { x: caller.coordinates.x, y: caller.coordinates.y } : null;

                if (beforeMove && afterMove && beforeMove.x === afterMove.x && beforeMove.y === afterMove.y) {
                    const movedAfterRecovery = false;

                    if (movedAfterRecovery) {
                        caller._trollStallCount = 0;
                    } else {
                        caller._trollStallCount = (caller._trollStallCount || 0) + 1;
                    }

                    if (!movedAfterRecovery && caller._trollStallCount >= 3) {
                        const currentPathComplexity = this.getPathComplexityToTarget(caller, target, combatants);
                        const alternatives = Object.values(combatants || {}).filter(e =>
                            e &&
                            !e.dead &&
                            !e.invisible &&
                            !e.isVCT &&
                            !e.isMonster &&
                            !e.isMinion &&
                            e.id !== target.id
                        );
                        const alternativeWithComplexity = alternatives.map(enemy => ({
                            enemy,
                            complexity: this.getPathComplexityToTarget(caller, enemy, combatants)
                        })).filter(entry => Number.isFinite(entry.complexity));

                        alternativeWithComplexity.sort((a, b) => a.complexity - b.complexity);

                        const bestAlternative = alternativeWithComplexity.length > 0 ? alternativeWithComplexity[0] : null;
                        const currentUnreachable = !Number.isFinite(currentPathComplexity);
                        const bestIsClearlyBetter = !!(bestAlternative && (
                            currentUnreachable ||
                            bestAlternative.complexity + 2 < currentPathComplexity
                        ));

                        if (bestIsClearlyBetter) {
                            const forcedTarget = bestAlternative.enemy;
                            caller.targetId = forcedTarget.id;
                            caller.pendingAttack = this.chooseAttackType(caller, forcedTarget);
                            caller._trollStallCount = 0;
                        }
                    }
                } else {
                    caller._trollStallCount = 0;
                }

                // Store previous tile to prevent immediate back-and-forth jitter next tick.
                if (beforeMove && afterMove && (beforeMove.x !== afterMove.x || beforeMove.y !== afterMove.y)) {
                    caller._trollPreviousTile = { x: beforeMove.x, y: beforeMove.y };
                }

                // Attack trigger
                const era = caller.eras ? caller.eras[caller.eraIndex] : null;
                // Repopulate pendingAttack if cleared by restartTurnCycle
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
            default:
                break;
        }
    }

    this.initiateAttack = async (caller, combatants) => {
        if (caller.attacking) return; // Prevent concurrent calls if already animating
        const target = resolveTarget(caller, combatants);
        caller.attacking = true;

        try {
            if (caller.dead || !target || (target.dead && target.id !== caller.id)) {
                return;
            }

            const attack = caller.pendingAttack;
            if (!attack) {
                return;
            }

            // Handle Specials (Regeneration)
            if (attack.name.includes('regeneration')) {
                // Visual feedback: pulsing green (handled by .regenerating class)
                // Specials define their properties (type, duration, chance) on the main object, not within an .effect property
                applyAttackEffect(caller, attack, this.broadcastDataUpdate);

                this.kickoffSpecialCooldown(attack);
                caller.energy -= (attack.energy_cost || 0);

                // Brief "casting" pause
                await new Promise(resolve => setTimeout(resolve, 600));
            } else {
                // Standard Physical Attacks (bite, crush, tackle, etc.)
                try {
                    const bestSource = getBestAttackSourceTile(caller, target);

                    // Trigger the visual icon flash/animation
                    if (this.animationManager && typeof this.animationManager.triggerAttackAnimation === 'function') {
                        await this.animationManager.triggerAttackAnimation({
                            coordinates: bestSource,
                            facing: caller.facing,
                            icon: attack.icon,
                            type: attack.name || 'grasp',
                            selectedAction: attack
                        });
                    }

                    // If the Troll died mid-animation wait, abort so hitsCombatant doesn't throw
                    if (caller.dead) {
                        return;
                    }

                    // Apply hits/damage
                    this.hitsCombatant(caller, target);
                } catch (e) {
                    // Intentionally suppress attack animation fallback errors.
                }
                this.kickoffAttackCooldown(caller);
            }

            // We explicitly DO NOT clear caller.pendingAttack here.
            // It must be preserved so hitsCombatant can identify the attack and properly queue the next one via its setTimeout.
        } finally {
            // Always release the attack lock so the troll can attack again next era.
            caller.attacking = false;
        }
    }
}
