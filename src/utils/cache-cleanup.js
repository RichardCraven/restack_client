/**
 * cache-cleanup.js
 *
 * Methods for migrating stale dungeon data retrieved from the cached meta object
 * into the current data schema on dungeon load.
 *
 * When game objects are removed or renamed (e.g. 'master key' -> 'treasury key'),
 * boards stored in the database will still reference the old object keys.
 * The methods here scan and replace those references so the dungeon loads cleanly.
 */

/**
 * Tests whether a tile's `contains` value represents the old master key.
 * The master key was placed as { type: 'item', subtype: 'ornate_key' } or
 * { type: 'item', subtype: 'master_key' } depending on when the board was saved.
 */
function isMasterKey(contains) {
    if (!contains) return false;
    if (typeof contains === 'string') {
        return contains === 'ornate_key' || contains === 'master_key';
    }
    const sub = contains.subtype;
    return sub === 'ornate_key' || sub === 'master_key';
}

/**
 * Scans every miniboard tile in every level of the dungeon.
 * Replaces any instance of the old 'master key' tile with 'treasury key'.
 *
 * @param {Object} dungeon - The parsed dungeon object (as loaded from the server).
 * @returns {number} The number of tiles that were replaced.
 */
export function keyCleanup(dungeon) {
    let replacedCount = 0;

    if (!dungeon || !Array.isArray(dungeon.levels)) {
        console.warn('cache-cleanup.keyCleanup: no dungeon levels to scan');
        return replacedCount;
    }

    dungeon.levels.forEach(level => {
        ['front', 'back'].forEach(side => {
            const sideData = level[side];
            if (!sideData || !Array.isArray(sideData.miniboards)) return;

            sideData.miniboards.forEach(miniboard => {
                if (!miniboard || !Array.isArray(miniboard.tiles)) return;

                miniboard.tiles.forEach(tile => {
                    if (isMasterKey(tile.contains)) {
                        tile.contains = { type: 'item', subtype: 'treasury_key' };
                        // Clear any legacy image path; the renderer will resolve it from images.js
                        tile.image = null;
                        replacedCount++;
                    }
                });
            });
        });
    });

    if (replacedCount > 0) {
        console.log(`cache-cleanup.keyCleanup: replaced ${replacedCount} master key tile(s) with treasury key`);
    } else {
        console.log('cache-cleanup.keyCleanup: no master key tiles found — nothing replaced');
    }

    return replacedCount;
}
