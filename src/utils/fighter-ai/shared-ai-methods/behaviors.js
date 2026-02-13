// shared-ai-methods/behaviors.js
// Abstraction for shared AI behaviors

/**
 * Handles the logic for the 'attackFromTheBack' behavior sequence.
 * @param {object} caller - The AI-controlled unit (e.g., Monk)
 * @param {object} combatants - All combatants in the battle
 * @param {object} data - Data and utility methods passed to the AI profile
 */
function attackFromTheBack(caller, combatants, data) {
    if(caller.type === 'monk'){
        
    }
    // Acquire all live enemies
    const liveEnemies = Object.values(combatants).filter(e => !e.dead && (e.isMonster || e.isMinion));
    if (liveEnemies.length === 0) return;
    // Try to find a target where caller can get to their back (right side)
    let foundBackTarget = false;
    // Sort enemies by depth (closest to front)
    const sortedByDepth = [...liveEnemies].sort((a, b) => a.depth - b.depth);
    const isOccupied = (coords) => {
        // Prefer combat-manager-provided helper when available
        if (data && data.methods && typeof data.methods.someoneIsInCoords === 'function') {
            try { return !!data.methods.someoneIsInCoords(coords, combatants); } catch (e) {}
        }
        // Fallback: check both direct coordinates and occupiedCoords arrays
        return Object.values(combatants).some(e => {
            try {
                if (!e) return false;
                if (e.coordinates && e.coordinates.x === coords.x && e.coordinates.y === coords.y) return true;
                if (Array.isArray(e.occupiedCoords) && e.occupiedCoords.some(c => c.x === coords.x && c.y === coords.y)) return true;
                return false;
            } catch (err) { return false; }
        });
    }

    for (const enemy of sortedByDepth) {
        const desiredX = enemy.coordinates.x + 1;
        const desiredY = enemy.coordinates.y;
        const isWithinBounds = desiredX < data.MAX_DEPTH;
        // Prefer AI helper that knows about occupiedCoords / virtual occupancy
        // Prefer AI helper that knows about occupiedCoords / virtual occupancy
        const occupied = isOccupied({ x: desiredX, y: desiredY });
        // If the desired tile is within bounds and not occupied (including virtual occupancy), consider it
        if (isWithinBounds && !occupied) {
            // Move only one space per turn toward the desired position
            const dx = desiredX - caller.coordinates.x;
            const dy = desiredY - caller.coordinates.y;
            let nextX = caller.coordinates.x;
            let nextY = caller.coordinates.y;
            if (dx !== 0) {
                nextX += Math.sign(dx);
            } else if (dy !== 0) {
                nextY += Math.sign(dy);
            }
            // Only move if the next tile is not occupied
            const nextOccupied = isOccupied({ x: nextX, y: nextY });
            if (!nextOccupied) {
                // move caller one step toward desired spot
                caller.coordinates.x = nextX;
                caller.coordinates.y = nextY;
            } else {
                // next tile is occupied (including virtual occupancy) - skip move
            }
            caller.facing = 'left';
            // Only set a pending attack if the caller is now adjacent to the enemy
            const adjX = Math.abs(caller.coordinates.x - enemy.coordinates.x);
            const adjY = Math.abs(caller.coordinates.y - enemy.coordinates.y);
                if (adjX <= 1 && adjY === 0) {
                    if (typeof data.chooseAttackType === 'function') {
                        caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    }
                } else {
                    // not in range after move
                }
            caller.targetId = enemy.id;
            foundBackTarget = true;
            break;
        }
    }
    if (!foundBackTarget) {
        // Prioritize enemies closest to the back line (highest x)
        const sortedByBack = [...liveEnemies].sort((a, b) => b.coordinates.x - a.coordinates.x);
        let placed = false;
            for (const enemy of sortedByBack) {
                // fallback: evaluating enemy
            // Try to move above or below the enemy if can't go past their column
            const aboveY = enemy.coordinates.y - 1;
            const belowY = enemy.coordinates.y + 1;
            const x = enemy.coordinates.x;
            // Try above (move only one space per turn)
            if (aboveY >= 0 && !isOccupied({ x, y: aboveY })) {
                // Move caller one space toward aboveY if not already there
                let nextY = caller.coordinates.y;
                if (nextY > aboveY) {
                    nextY -= 1;
                } else if (nextY < aboveY) {
                    nextY += 1;
                } else {
                    nextY = aboveY;
                }
                if (!isOccupied({ x, y: nextY })) {
                    // place caller above enemy
                    caller.coordinates.x = x;
                    caller.coordinates.y = nextY;
                } else {
                    // desired above position occupied
                }
                caller.facing = 'left';
                // Only set pending attack if in adjacency after placement
                if (Math.abs(caller.coordinates.x - enemy.coordinates.x) <= 1 && Math.abs(caller.coordinates.y - enemy.coordinates.y) === 0) {
                    if (typeof data.chooseAttackType === 'function') {
                        caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    }
                    // pendingAttack set after above placement
                } else {
                    // not adjacent after above placement
                }
                caller.targetId = enemy.id;
                placed = true;
                break;
            }
            // Try below (move only one space per turn)
            if (belowY < data.MAX_LANES && !isOccupied({ x, y: belowY })) {
                let nextY = caller.coordinates.y;
                if (nextY < belowY) {
                    nextY += 1;
                } else if (nextY > belowY) {
                    nextY -= 1;
                } else {
                    nextY = belowY;
                }
                if (!isOccupied({ x, y: nextY })) {
                    // place caller below enemy
                    caller.coordinates.x = x;
                    caller.coordinates.y = nextY;
                } else {
                    // desired below position occupied
                }
                caller.facing = 'left';
                if (Math.abs(caller.coordinates.x - enemy.coordinates.x) <= 1 && Math.abs(caller.coordinates.y - enemy.coordinates.y) === 0) {
                    if (typeof data.chooseAttackType === 'function') {
                        caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    }
                    // pendingAttack set after below placement
                } else {
                    // not adjacent after below placement
                }
                caller.targetId = enemy.id;
                placed = true;
                break;
            }
        }
        // If still not placed, just target the enemy closest to the back line
        if (!placed) {
            const enemy = sortedByBack[0];
            if (typeof data.chooseAttackType === 'function') {
                caller.pendingAttack = data.chooseAttackType(caller, enemy);
            }
            caller.targetId = enemy.id;
        }
    }
    // No return value needed
}

module.exports = {
    attackFromTheBack,
};
