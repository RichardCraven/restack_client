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
    for (const enemy of sortedByDepth) {
        const desiredX = enemy.coordinates.x + 1;
        const desiredY = enemy.coordinates.y;
        const isWithinBounds = desiredX < data.MAX_DEPTH;
        const occupied = Object.values(combatants).some(e => !e.dead && e.coordinates.x === desiredX && e.coordinates.y === desiredY);
        console.log('attackFromTheBack: considering enemy', { id: enemy.id, name: enemy.name, enemyCoords: enemy.coordinates, desiredX, desiredY, isWithinBounds, occupied });
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
            const nextOccupied = Object.values(combatants).some(e => !e.dead && e.coordinates.x === nextX && e.coordinates.y === nextY);
            if (!nextOccupied) {
                console.log('attackFromTheBack: moving caller', { callerId: caller.id, from: { x: caller.coordinates.x, y: caller.coordinates.y }, to: { x: nextX, y: nextY }, enemyId: enemy.id });
                caller.coordinates.x = nextX;
                caller.coordinates.y = nextY;
            } else {
                console.log('attackFromTheBack: next tile occupied, skipping move', { callerId: caller.id, nextX, nextY });
            }
            caller.facing = 'left';
            // Only set a pending attack if the caller is now adjacent to the enemy
            const adjX = Math.abs(caller.coordinates.x - enemy.coordinates.x);
            const adjY = Math.abs(caller.coordinates.y - enemy.coordinates.y);
            if (adjX <= 1 && adjY === 0) {
                if (typeof data.chooseAttackType === 'function') {
                    caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    console.log('attackFromTheBack: pendingAttack set', { callerId: caller.id, pendingAttack: caller.pendingAttack && caller.pendingAttack.name });
                }
            } else {
                console.log('attackFromTheBack: not in attack range after move', { callerId: caller.id, callerCoords: caller.coordinates, enemyCoords: enemy.coordinates });
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
                console.log('attackFromTheBack (fallback): evaluating enemy', { id: enemy.id, name: enemy.name, coords: enemy.coordinates });
            // Try to move above or below the enemy if can't go past their column
            const aboveY = enemy.coordinates.y - 1;
            const belowY = enemy.coordinates.y + 1;
            const x = enemy.coordinates.x;
            // Try above (move only one space per turn)
                if (aboveY >= 0 && !Object.values(combatants).some(e => !e.dead && e.coordinates.x === x && e.coordinates.y === aboveY)) {
                // Move caller one space toward aboveY if not already there
                let nextY = caller.coordinates.y;
                if (nextY > aboveY) {
                    nextY -= 1;
                } else if (nextY < aboveY) {
                    nextY += 1;
                } else {
                    nextY = aboveY;
                }
                if (!Object.values(combatants).some(e => !e.dead && e.coordinates.x === x && e.coordinates.y === nextY)) {
                    console.log('attackFromTheBack: placing caller above enemy', { callerId: caller.id, to: { x, y: nextY }, enemyId: enemy.id });
                    caller.coordinates.x = x;
                    caller.coordinates.y = nextY;
                } else {
                    console.log('attackFromTheBack: desired above position occupied', { x, nextY });
                }
                caller.facing = 'left';
                // Only set pending attack if in adjacency after placement
                if (Math.abs(caller.coordinates.x - enemy.coordinates.x) <= 1 && Math.abs(caller.coordinates.y - enemy.coordinates.y) === 0) {
                    if (typeof data.chooseAttackType === 'function') {
                        caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    }
                    console.log('attackFromTheBack: pendingAttack set after above placement', { callerId: caller.id, pendingAttack: caller.pendingAttack && caller.pendingAttack.name });
                } else {
                    console.log('attackFromTheBack: not adjacent after above placement', { callerCoords: caller.coordinates, enemyCoords: enemy.coordinates });
                }
                caller.targetId = enemy.id;
                placed = true;
                break;
            }
            // Try below (move only one space per turn)
            if (belowY < data.MAX_LANES && !Object.values(combatants).some(e => !e.dead && e.coordinates.x === x && e.coordinates.y === belowY)) {
                let nextY = caller.coordinates.y;
                if (nextY < belowY) {
                    nextY += 1;
                } else if (nextY > belowY) {
                    nextY -= 1;
                } else {
                    nextY = belowY;
                }
                if (!Object.values(combatants).some(e => !e.dead && e.coordinates.x === x && e.coordinates.y === nextY)) {
                    console.log('attackFromTheBack: placing caller below enemy', { callerId: caller.id, to: { x, y: nextY }, enemyId: enemy.id });
                    caller.coordinates.x = x;
                    caller.coordinates.y = nextY;
                } else {
                    console.log('attackFromTheBack: desired below position occupied', { x, nextY });
                }
                caller.facing = 'left';
                if (Math.abs(caller.coordinates.x - enemy.coordinates.x) <= 1 && Math.abs(caller.coordinates.y - enemy.coordinates.y) === 0) {
                    if (typeof data.chooseAttackType === 'function') {
                        caller.pendingAttack = data.chooseAttackType(caller, enemy);
                    }
                    console.log('attackFromTheBack: pendingAttack set after below placement', { callerId: caller.id, pendingAttack: caller.pendingAttack && caller.pendingAttack.name });
                } else {
                    console.log('attackFromTheBack: not adjacent after below placement', { callerCoords: caller.coordinates, enemyCoords: enemy.coordinates });
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
