const clone = (val) => {
    return JSON.parse(JSON.stringify(val))
}

export function Soldier(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.fighterFacingUp = utilMethods.fighterFacingUp;
    this.fighterFacingDown = utilMethods.fighterFacingDown;
    this.fighterFacingRight = utilMethods.fighterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;

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

        if(distanceToTarget === 1 && available.find(e=>e.range === 'close')){
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
    this.processMove = (caller, combatants) => {
        caller.onMoveCooldown = true;
        setTimeout(()=>{
            caller.onMoveCooldown = false;
            // 1 second is how long it takes for lane-wrapper and portrait-wrapper to finish CSS transition
        }, 1000)
        switch(caller.behaviorSequence){
            case 'brawler':
                switch(caller.eraIndex){
                    case 0:
                        if(this.isSurrounded(caller, combatants)){
                            console.log('soldier is surrounded, do spin move');
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 1:
                        if(this.isSurrounded(caller, combatants)){
                            console.log('soldier is surrounded, do spin move. combatants:', combatants );
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 2:
                        if(this.isSurrounded(caller, combatants)){
                            console.log('soldier is surrounded, do spin move. combatants:', combatants);
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 3:
                        if(this.isSurrounded(caller, combatants)){
                            console.log('soldier is surrounded, do spin move. combatants:', combatants );
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 4:
                        if(this.isSurrounded(caller, combatants)){
                            console.log('soldier is surrounded, do spin move. combatants:', combatants );
                            this.triggerSpinAttack(caller, combatants).then((combatantHit)=>{
                                // if(combatantHit){
                                //     this.hitsCombatant(caller, combatantHit);
                                // } else {
                                //     console.log('spin move missed');
                                // }
                            });
                            break;
                        }
                        data.methods.closeTheGap(caller, combatants)
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
        }
    }
    this.initiateAttack = async (caller, manualAttack, combatants) => {
        if(!caller) return
        const callerFacing = (caller, target) => {
            let val;
            if(!target) return null;
            const targX = target.coordinates.x,
                  targY = target.coordinates.y,
                  callX = caller.coordinates.x,
                  callY = caller.coordinates.y
            if(targX === callX){
                val = targY > callY ? 'down' : 'up'
            } else {
                val = targX > callX ? 'right' : 'left'
            }
            return val;
        }
        const facingRight = this.fighterFacingRight(caller)
        const target = combatants[caller.targetId];
        const facing = caller.facing ? caller.facing : callerFacing(caller,target)
        if(manualAttack){
            if(caller.pendingAttack && caller.pendingAttack.cooldown_position < 99){
                return
            } else if (caller.pendingAttack && caller.pendingAttack.cooldown_position === 100){
                const combatantHit = await this.triggerSwordSwing(caller.coordinates, facing)
                if(combatantHit){
                    this.hitsCombatant(caller, combatantHit)
                    this.kickoffAttackCooldown(caller)
                } else {
                    this.missesTarget(caller);
                    this.kickoffAttackCooldown(caller)
                }
            }
        } else {
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            // debugger
            switch(caller.pendingAttack.name){
                case 'sword swing':
                    const combatantHit = await this.triggerSwordSwing(caller.coordinates, facing)
                    if(combatantHit){
                        this.hitsCombatant(caller, combatantHit);
                    } else {
                        this.missesTarget(caller);
                    }
                break;
                case 'sword thrust':
                    // console.log('SWORD THRUST');
                break;
                case 'shield bash':
                    // console.log('SHIELD BASH');
                break;
                default:
                    break;
            }

        }
    }
    this.triggerSwordSwing = (callerCoords, facing) => {
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
        let targetTileId;
        if(facing){
            let id;
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
