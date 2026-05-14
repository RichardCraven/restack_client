// Shared helpers for monster AI targeting/range/animation origin.
// Designed to mirror Mummy's VCT + occupied-tile logic so new monster profiles
// can include this once and avoid custom per-profile implementations.

export const MonsterTargetingHelpers = {
    getOccupiedTiles: (caller) => {
        if (Array.isArray(caller?.occupiedCoords) && caller.occupiedCoords.length > 0) return caller.occupiedCoords;
        if (Array.isArray(caller?.occupiedTiles) && caller.occupiedTiles.length > 0) return caller.occupiedTiles;
        return caller?.coordinates ? [caller.coordinates] : [];
    },

    resolveTarget: (caller, combatants) => {
        if (!caller || !combatants || !caller.targetId) return null;

        let target = combatants[caller.targetId] || Object.values(combatants).find((e) => e && e.id === caller.targetId);

        // Redirect VCT targets to their parent combatant so attack/range checks use
        // the real unit (Mummy-style behavior).
        if (target && target.isVCT && target.parentMonsterId && combatants[target.parentMonsterId]) {
            target = combatants[target.parentMonsterId];
            caller.targetId = target ? target.id : null;
        }

        if (!target || target.dead || target.isVCT) return null;
        return target;
    },

    getDistanceToTarget: (caller, target) => {
        const occupiedTiles = MonsterTargetingHelpers.getOccupiedTiles(caller);
        if (!target || !target.coordinates || occupiedTiles.length === 0) return Infinity;

        return Math.min(...occupiedTiles.map((tile) => (
            Math.abs(tile.x - target.coordinates.x) + Math.abs(tile.y - target.coordinates.y)
        )));
    },

    isTargetInRange: (caller, target, attack) => {
        if (!caller || !target || !attack) return false;

        const attackRange = attack.range || 'close';
        const dist = MonsterTargetingHelpers.getDistanceToTarget(caller, target);

        if (attackRange === 'close') return dist === 1;
        if (attackRange === 'medium') return dist <= 3;
        return dist <= 6;
    },

    getBestAttackSourceTile: (caller, target) => {
        const occupiedTiles = MonsterTargetingHelpers.getOccupiedTiles(caller);
        if (!target || !target.coordinates || occupiedTiles.length === 0) return caller.coordinates;

        let best = occupiedTiles[0];
        let minDist = Infinity;

        occupiedTiles.forEach((tile) => {
            const d = Math.abs(tile.x - target.coordinates.x) + Math.abs(tile.y - target.coordinates.y);
            if (d < minDist) {
                minDist = d;
                best = tile;
            }
        });

        return best;
    }
};
