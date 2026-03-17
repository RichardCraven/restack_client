// const clone = (val) => { return JSON.parse(JSON.stringify(val)) }
import { activeShieldWalls } from '../../shared-ai-methods/movement-methods';

// ─────────────────────────────────────────────────────────────────────────────
// Shield Wall constants
// The wall lasts for SHIELD_WALL_ERAS eras.  One era = 20 tempo ticks.
// Each tick fires every FIGHT_INTERVAL ms (default 40 ms) so a single era
// lasts 20 × FIGHT_INTERVAL ms.  We store an absolute expiry timestamp on
// the caller and clear it when it expires.
// ─────────────────────────────────────────────────────────────────────────────
const SHIELD_WALL_ERAS = 10;

export function Soldier(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    // Reference to MonsterBattle component so we can register/expire the wall there
    this.monsterBattleRef = null;

    // this.fighterFacingUp = utilMethods.fighterFacingUp;
    // this.fighterFacingDown = utilMethods.fighterFacingDown;
    // this.fighterFacingRight = utilMethods.fighterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.kickoffSpecialCooldown = utilMethods.kickoffSpecialCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.useConsumable = utilMethods.useConsumable;
    this.getCurrentInventory = utilMethods.getCurrentInventory;

    this.isFriendly = (e) => {
        return !e.isMonster && !e.isMinion;
    }
    this.friendlies = (combatants) => {
        return Object.values(combatants).filter(e=>this.isFriendly(e));
    }
    this.isEnemy = (e) => {
        return e.isMonster|| e.isMinion;
    }

    this.enemies = (combatants) => {
        return Object.values(combatants).filter(e=>this.isEnemy(e));
    }

    this.initialize = (caller) => {
        caller.behaviorSequence = 'brawler'
    }

    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>b.depth - a.depth);
        let target = sorted.length ? sorted[0] : null;
        if(!target) return;
        if(this.friendlies(combatants).some(e=>e.targetId === target.targetId) && sorted.length > 1){
            target = sorted[1]
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        target.targettedBy.push(caller.id)
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;

        const distanceToTarget = data.methods.getDistanceToTarget(caller, target);
        const laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);

        // Treat as 'close' if target is one tile in front/back (x diff = 1)
        // OR if target is in the same column but one lane up/down (vertical adjacency).
        const isCloseRange = Math.abs(distanceToTarget) === 1 || (Math.abs(distanceToTarget) === 0 && Math.abs(laneDiff) === 1);

        if(isCloseRange && available.find(e=>e.range === 'close')){
            attack = available.find(e=>e.range === 'close');
            return attack;
        }
        // console.log('soldier available attacks: ', available);
        if(available.length === 0){
            // choose the attack that is closest to 100 percent
            caller.attacks.filter(e=>e.range === 'medium' || e.range === 'far').forEach(e=>{
                if(e.cooldown_position > percentCooledDown){
                    percentCooledDown = e.cooldown_position;
                    chosenAttack = e;
                }
            })
            attack = chosenAttack;
        } else {
            let nearestRangeAttacks = available.filter(e=>(e.range === 'far' || e.range === 'medium') && e.cooldown_position > 25)
            if(nearestRangeAttacks.length > 0){
                let percentCooledDown = 0;
                // choose the attack that is closest to 100 percent
                nearestRangeAttacks.forEach((e)=>{
                    if(e.cooldown_position > percentCooledDown){
                        percentCooledDown = e.cooldown_position;
                        chosenAttack = e;
                    }
                })
                // console.log('chosen attack: ', clone(chosenAttack));
                attack = chosenAttack;
                // caller.aiming = true;
            } else {
                attack = data.methods.pickRandom(available);
            }
        }
        // console.log('attack type chosen: ', attack);
        return attack
    }
    // this.triggerSpinAttack = (callerCoords) => {
    //     const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
    //     return new Promise((resolve) => {
    //         if (sourceTileId !== null) {
    //             const data = {
    //                 sourceTileId,
    //                 type: 'spin_attack',
    //                 icon: this.animationManager.images ? this.animationManager.images['sword'] : undefined
    //             };
    //             this.animationManager.triggerTileAnimationComplex(data);
    //             setTimeout(() => resolve(), 800); // match duration
    //         }
    //     });
    // }
    this.triggerSpinAttack = async (caller, combatants) => {
        const { x, y } = caller.coordinates;
        // 8 adjacent directions, clockwise from N
        const directions = [
            { dx: 0, dy: -1 },   // N
            { dx: 1, dy: -1 },   // NE
            { dx: 1, dy: 0 },    // E
            { dx: 1, dy: 1 },    // SE
            { dx: 0, dy: 1 },    // S
            { dx: -1, dy: 1 },   // SW
            { dx: -1, dy: 0 },   // W
            { dx: -1, dy: -1 },  // NW
        ];
        // Build all possible 3-tile arcs (wrap around)
        let bestArc = null;
        let maxEnemies = -1;
        for (let i = 0; i < directions.length; i++) {
            const arc = [0,1,2].map(j => {
                const dir = directions[(i + j) % directions.length];
                return { x: x + dir.dx, y: y + dir.dy };
            });
            // Count enemies in this arc
            const enemiesHit = arc.reduce((acc, tile) => {
                const enemy = Object.values(combatants).find(e =>
                    this.isEnemy(e) &&
                    !e.dead &&
                    e.coordinates.x === tile.x &&
                    e.coordinates.y === tile.y
                );
                return acc + (enemy ? 1 : 0);
            }, 0);
            if (enemiesHit > maxEnemies) {
                maxEnemies = enemiesHit;
                bestArc = arc;
            }
        }
        // Fallback: if no enemies, just pick the first arc (N, NE, E)
        if (!bestArc) {
            bestArc = [0,1,2].map(j => {
                const dir = directions[j];
                return { x: x + dir.dx, y: y + dir.dy };
            });
        }
        const sourceTileId = this.animationManager.getTileIdByCoords(caller.coordinates);
        this.animationManager.arcAttack(
            bestArc,
            sourceTileId,
            combatants,
            (enemy) => this.hitsCombatant(caller, enemy)
        );

        // let that = this;
        // // Hit logic: hit any enemy in arcTiles
        // arcTiles.forEach(tile => {
        //     const enemy = Object.values(combatants).find(e =>
        //         that.isEnemy(e) &&
        //         !e.dead &&
        //         e.coordinates.x === tile.x &&
        //         e.coordinates.y === tile.y
        //     );
        //     if (enemy) {
        //         this.hitsCombatant(caller, enemy);
        //     }
        // });
    }
    this.isSurrounded = (caller, combatants) => {
    // Get all 8 adjacent tiles
    const getSurroundings = (coords) => {
        return [
            {x: coords.x,     y: coords.y-1},   // N
            {x: coords.x+1,   y: coords.y-1},   // NE
            {x: coords.x+1,   y: coords.y},     // E
            {x: coords.x+1,   y: coords.y+1},   // SE
            {x: coords.x,     y: coords.y+1},   // S
            {x: coords.x-1,   y: coords.y+1},   // SW
            {x: coords.x-1,   y: coords.y},     // W
            {x: coords.x-1,   y: coords.y-1},   // NW
        ];
    };

    const surroundings = getSurroundings(caller.coordinates);

    // Count adjacent enemies
    let adjacentEnemies = 0;
    surroundings.forEach(tile => {
        const enemy = Object.values(combatants).find(e =>
            this.isEnemy(e) &&
            !e.dead &&
            e.coordinates.x === tile.x &&
            e.coordinates.y === tile.y
        );
        if (enemy) adjacentEnemies++;
    });

    return adjacentEnemies >= 3;
}
    // Attempt to find and use a healing consumable for the caller.
    // Returns true if a consumable was used (so caller's behavior can break/stop).
    this.tryUseConsumableForHeal = (caller) => {
        try {
            if (!caller || typeof caller.hp === 'undefined' || typeof caller.starting_hp === 'undefined') return false;
            
            // threshold: 50% of starting HP
            if (!(caller.hp < (caller.starting_hp * 0.5))) return false;
            if (!this.useConsumable) return false;
            const groupInv = (typeof this.getCurrentInventory === 'function') ? this.getCurrentInventory() : (Array.isArray(caller.inventory) ? caller.inventory : []);
            if (!groupInv || !groupInv.length) return false;
            const pIdx = groupInv.findIndex(i => i && (i.effect === 'health gain' || (i.name && i.name.toLowerCase().includes('potion'))));
            // no potion found
            
            if (pIdx === -1) return false;
            const isGroup = (typeof this.getCurrentInventory === 'function');
            let item;
            if (!isGroup && Array.isArray(caller.inventory)) {
                item = caller.inventory.splice(pIdx, 1)[0];
            } else {
                item = groupInv[pIdx];
            }
            try { this.useConsumable(item, caller); } catch (e) {}
            try { if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(caller); } catch (e) {}
            return true;
        } catch (err) {
            console.warn('tryUseConsumableForHeal failed', err);
            return false;
        }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // SHIELD WALL
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Evaluate whether Shield Wall should fire.
     * Conditions:
     *  - The special's cooldown_position === 100
     *  - The Soldier is facing RIGHT (away from his own backline).
     *    Facing left means he has turned around to chase a target that passed
     *    him — not an appropriate moment to plant a wall.
     *    FUTURE: allow facing-left when the Soldier has positioned himself
     *    between the enemies and a soft friendly (Wizard/Sage) behind him,
     *    i.e. the soft fighter's x < caller.x < nearest enemy's x (facing left).
     *  - The Soldier has advanced at least halfway across the board
     *    (x >= MAX_DEPTH/2) so he doesn't plant the wall immediately at spawn.
     *  - At least one enemy is within IMMINENT_RANGE tiles of the wall column
     *    (the tile directly in front of the Soldier), meaning they are about
     *    to cross the threshold — the "last second" trigger.
     *  - The Soldier is not already in an active wall.
     */
    this.shouldUseShieldWall = (caller, combatants) => {
        // Must have the special ready
        const shieldWall = caller.specials && caller.specials.find(s => s && s.name === 'shield wall');
        if (!shieldWall || shieldWall.cooldown_position !== 100) return false;
        // Must not already be in a wall
        if (caller.shieldWallActive) return false;

        // ── Guard: don't wall if there's nobody left to protect ────────────
        const SOFT_CLASSES = ['wizard', 'sage', 'rogue'];
        const liveFriendlies = Object.values(combatants).filter(
            e => !e.dead && !e.isMonster && !e.isMinion && e.id !== caller.id
        );
        // Last crew member standing — no point walling for nobody
        if (liveFriendlies.length === 0) return false;
        // No soft-target or ranged fighters left to defend — wall is pointless
        const hasDefendable = liveFriendlies.some(e => {
            if (SOFT_CLASSES.includes(e.type)) return true;
            if (e.attacks && e.attacks.some(a => a.range === 'far' || a.range === 'medium')) return true;
            return false;
        });
        if (!hasDefendable) return false;

        const liveEnemies = Object.values(combatants).filter(e => !e.dead && (e.isMonster || e.isMinion));
        if (liveEnemies.length === 0) return false;

        const isFacingRight = (caller.facing !== 'left');

        // ── Condition 1: Must be facing away from the backline ─────────────
        // Only raise the wall when facing right (toward the enemy advance).
        // TODO: extend this to allow facing-left when the Soldier is acting as
        // a bodyguard — positioned between enemies and a soft friendly — by
        // checking that a friendly with low def (wizard, sage) is behind him
        // at a lower x and at least one enemy is ahead at a higher x.
        if (!isFacingRight) return false;

        // ── Condition 2: Soldier must not be at spawn ─────────────────────
        // Prevent raising the wall in the first two columns (spawn area) where
        // it would trap friendly fighters before the battle even starts.
        // Column 2+ is far enough from the spawn edge to be tactically valid.
        const callerX = caller.coordinates.x;
        if (callerX < 2) return false;

        // ── Condition 3: An enemy is about to reach the wall column ────────
        // The wall appears one tile in front of the Soldier (callerX + 1).
        // Fire when the closest approaching enemy is within IMMINENT_RANGE of
        // that wall column — i.e. they are close enough to be a genuine threat.
        // We use a signed distance check: distToWall >= -1 catches enemies that
        // have just crossed the wall line (e.g. already adjacent to the Soldier)
        // as well as those still approaching from the far side.
        const wallX = callerX + 1;
        const IMMINENT_RANGE = 3; // tiles ahead of the wall column

        const imminentEnemies = liveEnemies.filter(e => {
            const distToWall = e.coordinates.x - wallX; // positive = enemy is ahead of wall
            return distToWall >= -1 && distToWall <= IMMINENT_RANGE;
        });

        return imminentEnemies.length >= 1;
    }

    /**
     * Returns the x-coordinate of the column boundary where the wall would
     * appear (the tile edge in front of the Soldier).
     */
    this._wallColumnForCaller = (caller) => {
        const isFacingRight = (caller.facing !== 'left');
        // The wall sits at the leading edge of the tile in front of the Soldier
        return isFacingRight
            ? caller.coordinates.x + 1
            : caller.coordinates.x - 1;
    }

    /**
     * Activate the shield wall.
     * - Freezes the Soldier (no movement, no attacks)
     * - Registers the wall in MonsterBattle for visual rendering
     * - Sets a timeout to expire the wall after SHIELD_WALL_ERAS eras
     */
    this.triggerShieldWall = (caller, combatants) => {
        const shieldWall = caller.specials && caller.specials.find(s => s && s.name === 'shield wall');
        if (!shieldWall) return;

        const wallX = this._wallColumnForCaller(caller);
        const centerY = caller.coordinates.y;

        // Wall covers 5 tiles: centerY-2 to centerY+2 (clamped to board)
        const lanesAffected = [];
        for (let dy = -2; dy <= 2; dy++) {
            const lane = centerY + dy;
            if (lane >= 0 && lane < data.MAX_LANES) {
                lanesAffected.push(lane);
            }
        }

        // The wall data object is shared so MonsterBattle and movement-methods
        // can both reference it.
        const liveInterval = (typeof data.methods.getFightInterval === 'function')
            ? data.methods.getFightInterval()
            : (data.INTERVAL_TIME || 500);
        const eraDurationMs = SHIELD_WALL_ERAS * 20 * liveInterval;
        const wallData = {
            x: wallX,                         // column boundary (between x-1 and x)
            lanesAffected,
            isFacingRight: (caller.facing !== 'left'),
            callerId: caller.id,
            expiresAt: Date.now() + eraDurationMs
        };

        // Flag the Soldier so processMove / initiateAttack skips him
        caller.shieldWallActive = true;
        caller.shieldWallData = wallData;

        // Register in the global movement registry so all AI movement respects the wall
        activeShieldWalls.push(wallData);

        // Put the special on cooldown
        shieldWall.cooldown_position = 0;

        // Notify MonsterBattle so it can render the wall and track expiry
        if (this.monsterBattleRef && typeof this.monsterBattleRef.registerShieldWall === 'function') {
            this.monsterBattleRef.registerShieldWall(wallData, caller);
        }

        // Schedule expiry
        const expiryTimer = setTimeout(() => {
            this._expireShieldWall(caller, combatants);
        }, eraDurationMs);
        caller._shieldWallExpiryTimer = expiryTimer;
    }

    /**
     * Expire an active shield wall: un-freeze the Soldier, clear the wall data,
     * and notify MonsterBattle to remove the visual overlay.
     */
    this._expireShieldWall = (caller, combatants) => { // eslint-disable-line no-unused-vars
        caller.shieldWallActive = false;
        if (caller._shieldWallExpiryTimer) {
            clearTimeout(caller._shieldWallExpiryTimer);
            caller._shieldWallExpiryTimer = null;
        }
        const wallData = caller.shieldWallData;
        caller.shieldWallData = null;

        // Remove from global movement registry
        const idx = activeShieldWalls.indexOf(wallData);
        if (idx !== -1) activeShieldWalls.splice(idx, 1);

        if (this.monsterBattleRef && typeof this.monsterBattleRef.expireShieldWall === 'function') {
            this.monsterBattleRef.expireShieldWall(wallData, caller);
        }
        // Restart the cooldown interval so the special can be used again
        const shieldWall = caller.specials && caller.specials.find(s => s && s.name === 'shield wall');
        if (shieldWall && typeof this.kickoffSpecialCooldown === 'function') {
            this.kickoffSpecialCooldown(shieldWall);
        }
        // Broadcast so the UI refreshes the cooldown bar
        if (typeof this.broadcastDataUpdate === 'function') {
            try { this.broadcastDataUpdate(caller); } catch (e) { /* non-fatal */ }
        }
    }

    this.processMove = (caller, combatants) => {
        // console.log('current inventory: ', this.getCurrentInventory());
        // debugger
        if (caller.stunned) return; // stunned: skip all movement this tick
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        // While shield wall is active the Soldier stands perfectly still
        if (caller.shieldWallActive) return;

        // transition-duration is now set via CSS variable --move-duration, which should match moveCooldown

        switch(caller.behaviorSequence){
            case 'brawler':
                
                // ── Shield Wall check ───────────────────────────────────────
                if (this.shouldUseShieldWall(caller, combatants)) {
                    this.triggerShieldWall(caller, combatants);
                    break;
                }
                // ────────────────────────────────────────────────────────────

                switch(caller.eraIndex){
                    case 0:
                        if(this.isSurrounded(caller, combatants)){
                            
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGapForwardFirst(caller, combatants)
                    break;
                    case 1:
                        if(this.isSurrounded(caller, combatants)){
                            
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        this.tryUseConsumableForHeal(caller);
                        data.methods.closeTheGapForwardFirst(caller, combatants)
                    break;
                    case 2:
                        
                        if(this.isSurrounded(caller, combatants)){
                            
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        
                        // Era 2: attempt to drink a health potion if low (50% threshold)
                        this.tryUseConsumableForHeal(caller);
                        data.methods.closeTheGapForwardFirst(caller, combatants)
                    break;
                    case 3:
                        if(this.isSurrounded(caller, combatants)){
                            
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        this.tryUseConsumableForHeal(caller);
                        data.methods.closeTheGapForwardFirst(caller, combatants)
                    break;
                    case 4:
                        if(this.isSurrounded(caller, combatants)){
                            
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        this.tryUseConsumableForHeal(caller);
                        data.methods.closeTheGapForwardFirst(caller, combatants)
                    break;
                    default: 
                    break;
                }
            break;
            case 'panicked':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
            case 'melee':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
            default:
            break;
        }
    }
    this.initiateAttack = async (caller, manualAttack, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        // Cannot attack while shield wall is active
        if (caller.shieldWallActive) return;

        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        // Helper for facing
        const callerFacing = (caller, target) => {
            let val;
            if(!target) return null;
            const targX = target.coordinates.x,
                  targY = target.coordinates.y,
                  callX = caller.coordinates.x,
                  callY = caller.coordinates.y;
            if(targX === callX){
                val = targY > callY ? 'down' : 'up';
            } else {
                val = targX > callX ? 'right' : 'left';
            }
            return val;
        };
        const facingRight = caller.facing === 'right'; // eslint-disable-line no-unused-vars
        const target = combatants[caller.targetId];
        // Prefer a facing derived from the current target position when a target exists
        // so vertical (up/down) attacks are used when appropriate.
        const computedFacing = callerFacing(caller, target);
        const facing = target ? (computedFacing || caller.facing) : (caller.facing || computedFacing);

        caller.attacking = true;

        if(manualAttack){
            if(caller.pendingAttack && caller.pendingAttack.cooldown_position < 99){
                return;
            } else if (caller.pendingAttack && caller.pendingAttack.cooldown_position === 100){
                if (facing === 'up'){
                    
                    // debugger;
                }
                const combatantHit = await this.triggerSwordSwing(caller.coordinates, facing);
                if(combatantHit){
                    this.hitsCombatant(caller, combatantHit);
                    this.kickoffAttackCooldown(caller);
                } else {
                    this.missesTarget(caller);
                    this.kickoffAttackCooldown(caller);
                }
            }
        } else {
            await (async () => {
                const distanceToTarget = data.methods.getDistanceToTarget(caller, target), // eslint-disable-line no-unused-vars
                laneDiff = data.methods.getLaneDifferenceToTarget(caller, target); // eslint-disable-line no-unused-vars
                // debugger
                switch(caller.pendingAttack.name){
                    case 'sword swing': {
                        // console.log('SWING ', facing);
                        // if (facing === 'up'){
                        //     console.log('********************************SOLDIER: about to swing UP (AI)', { callerId: caller.id, callerCoords: caller.coordinates, targetId: caller.targetId, targetCoords: target ? target.coordinates : null, pendingAttack: caller.pendingAttack });
                        //     // debugger;
                        // }
                        const combatantHit = await this.triggerSwordSwing(caller.coordinates, facing);
                        if(combatantHit){
                            this.hitsCombatant(caller, combatantHit);
                        } else {
                            this.missesTarget(caller);
                        }
                        break;
                    }
                    case 'sword thrust':
                        // console.log('SWORD THRUST');
                        break;
                    case 'shield bash':
                        // console.log('SHIELD BASH');
                        break;
                    default:
                        break;
                }
            })();
        }
    }
    this.triggerSwordSwing = (callerCoords, facing) => {
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
        let targetTileId;
        if(facing){
            switch(facing){
                case 'right':
                    if(callerCoords.x === this.MAX_DEPTH){
                        targetTileId = null;
                    } else {
                        let coordsToCheck = {x: callerCoords.x+1, y: callerCoords.y}
                        targetTileId = this.animationManager.getTileIdByCoords(coordsToCheck);
                    }
                break;
                case 'left':
                    if(callerCoords.x === 0){
                        targetTileId = null;
                    } else {
                        let coordsToCheck = {x: callerCoords.x-1, y: callerCoords.y}
                        targetTileId = this.animationManager.getTileIdByCoords(coordsToCheck);
                    }
                break;
                case 'up':
                    if(callerCoords.y === 0){
                        targetTileId = null;
                    } else {
                        let coordsToCheck = {x: callerCoords.x, y: callerCoords.y-1}
                        targetTileId = this.animationManager.getTileIdByCoords(coordsToCheck);
                    }
                break;
                case 'down':
                    if(callerCoords.y === this.MAX_LANES-1){
                        targetTileId = null;
                    } else {
                        let coordsToCheck = {x: callerCoords.x, y: callerCoords.y+1}
                        targetTileId = this.animationManager.getTileIdByCoords(coordsToCheck);
                    }
                break;
                default:
                break;
            }
        }
        // const targetTileId = facing ? (true) : sourceTileId + 1
        // const targetTileId = facing === '' ? sourceTileId + 1 : sourceTileId - 1;
        return new Promise((resolve) => {
            if(sourceTileId !== null){
                // console.log('sourceTileId: ', sourceTileId);
                this.animationManager.swordSwing(targetTileId, sourceTileId, facing, resolve)
            }
        })
    }   
}
    

