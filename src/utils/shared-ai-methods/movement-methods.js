import {Methods} from './basic-methods';


// Teleport the caller to an empty tile on the back line (or next available column)
// Optionally accepts a callback (onTeleport) to notify when teleport occurs
const teleportToBackLine = (caller, combatants, onTeleport) => {
    const isMonsterOrMinion = caller.isMonster || caller.isMinion;
    const backCol = isMonsterOrMinion ? 0 : MAX_DEPTH;
    const secondBackCol = isMonsterOrMinion ? 1 : MAX_DEPTH - 1;
    const startLane = caller.coordinates.y;
    // Helper to find available tile in a column, searching vertically from startLane
    function findAvailableInCol(col) {
        for (let offset = 0; offset <= MAX_LANES; offset++) {
            // Try up and down from startLane
            const up = startLane - offset;
            const down = startLane + offset;
            if (up >= 0 && up < MAX_LANES && isAvailableToMoveInto({x: col, y: up}, combatants)) {
                return {x: col, y: up};
            }
            if (offset !== 0 && down >= 0 && down < MAX_LANES && isAvailableToMoveInto({x: col, y: down}, combatants)) {
                return {x: col, y: down};
            }
        }
        return null;
    }
    let dest = findAvailableInCol(backCol);
    if (!dest) dest = findAvailableInCol(secondBackCol);
    if (dest) {
        caller.coordinates = dest;
        if (typeof onTeleport === 'function') {
            onTeleport(caller);
        }
    }
}
const clone = (val) => {
    return JSON.parse(JSON.stringify(val))
}
const MAX_DEPTH = 7
// ^ index 7, actual col count is 8
const MAX_LANES = 5
const getSurroundings = (coords) => {
    const N = {x: coords.x, y: coords.y-1},
              S = {x: coords.x, y: coords.y+1},
              W = {x: coords.x-1, y: coords.y},
              E = {x: coords.x+1, y: coords.y},
              NW = {x: coords.x-1, y: coords.y-1},
              NE = {x: coords.x+1, y: coords.y-1},
              SW = {x: coords.x-1, y: coords.y+1},
              SE = {x: coords.x+1, y: coords.y+1}
    return {N,S,E,W,NW,NE,SW,SE}
}
const PC_TYPES = ['soldier','rogue','wizard', 'monk', 'sage', 'barbarian']
const someoneIsInCoords = (coords, combatants)=>{
    if(!combatants) return false
    return Object.values(combatants).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
}
const isOutOfBounds = (coords) => {
    return coords.x >= MAX_DEPTH || coords.y > MAX_LANES || coords.x < 0 || coords.y < 0
}
const isAvailableToMoveInto = (coords, combatants) => {
    return !isOutOfBounds(coords) && !someoneIsInCoords(coords, combatants)
}
const someoneElseIsInCoords = (caller, coords)=>{
    return Object.values(this.combatants).filter(c=>c.id!==caller.id).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
}

const goTowards = (caller, combatants, targetTile) => {
    const isTargetTileOccupied = someoneIsInCoords(targetTile, combatants);
    const {N,E,S,W,NW,SW,NE,SE} = getSurroundings(caller.coordinates)

    // overwriting
    // let someoneIsInCoords = (coords)=>{
    //     return Object.values(combatants).filter(c=>c.id!==caller.id).some(e=>JSON.stringify(e.coordinates) == JSON.stringify(coords))
    // }
    const targetIsInCoords = (coords)=>{
        return JSON.stringify(targetTile) == JSON.stringify(coords);
    }

    const targetIsNorthWest = targetTile.y < caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsNorth = targetTile.y < caller.coordinates.y && targetTile.x === caller.coordinates.x,
        targetIsNorthEast = targetTile.y < caller.coordinates.y && targetTile.x > caller.coordinates.x,
        targetIsWest = targetTile.y === caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsEast = targetTile.y === caller.coordinates.y && targetTile.x > caller.coordinates.x,
        targetIsSouthWest = targetTile.y > caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsSouth = targetTile.y > caller.coordinates.y && targetTile.x === caller.coordinates.x,
        targetIsSouthEast = targetTile.y > caller.coordinates.y && targetTile.x > caller.coordinates.x;

    let newCoords = JSON.parse(JSON.stringify(caller.coordinates))

    if(targetIsNorthWest){ /////////////////////////////////////  NW
        if(targetIsInCoords(NW) && !isTargetTileOccupied){
            newCoords = NW;
        } else if(targetIsInCoords(NW)){
            if(isAvailableToMoveInto(W, combatants)){
                newCoords = W;
            } else if(isAvailableToMoveInto(N, combatants)){
                newCoords = N;
            } else {
            }
        } else if(someoneIsInCoords(NW, combatants)){
            //go up or left
            if(isAvailableToMoveInto(N, combatants)){
                newCoords = N
            } else if(isAvailableToMoveInto(W, combatants)){
                newCoords = W
            } else {
                return
            }
        } else {
            // space available go NW
            newCoords = NW;
        }
    } else if(targetIsNorthEast){ /////////////////////// NE
        if(targetIsInCoords(NE) && !isTargetTileOccupied){
            newCoords = NE;
        } else if(targetIsInCoords(NE)){
            if(isAvailableToMoveInto(E, combatants)){
                newCoords = E;
            } else if(isAvailableToMoveInto(N, combatants)){
                newCoords = N;
            } else {
            }
        } else if(someoneIsInCoords(NE, combatants)){
            //go up or right
            if(isAvailableToMoveInto(N, combatants)){
                newCoords = N
            } else if(isAvailableToMoveInto(E, combatants)){
                newCoords = E
            } else {
                return
            }
        } else {
            // space available go NE
            newCoords = NE;
        }
    } else if(targetIsSouthWest){ ////////////////////////////////////// SW
        if(targetIsInCoords(SW) && !isTargetTileOccupied){
            newCoords = SW;
        } else if(targetIsInCoords(SW)){
            if(isAvailableToMoveInto(W, combatants)){
                newCoords = W;
            } else if(isAvailableToMoveInto(S, combatants)){
                newCoords = S;
            } else {
            }
        } else if(someoneIsInCoords(SW, combatants)){
            //go down or left
            if(isAvailableToMoveInto(S, combatants)){
                newCoords = S
            } else if(isAvailableToMoveInto(W, combatants)){
                newCoords = W
            } else {
                return
            }
        } else {
            // space available go SW
            newCoords = SW;
        }
    } else if(targetIsSouthEast){ //////////////////////// SE
        if(targetIsInCoords(SE) && !isTargetTileOccupied){
            newCoords = SE;
        } else if(someoneIsInCoords(SE, combatants)){
            //go down or right
            if(isAvailableToMoveInto(S, combatants)){
                newCoords = S
            } else if(isAvailableToMoveInto(E, combatants)){
                newCoords = E
            } else {
                return
            }
        } else {
            // space available go SE
            newCoords = SE;
        }
    } else if(targetIsNorth){ ////////// N
        if(targetIsInCoords(N) && !isTargetTileOccupied){
            newCoords = N;
        } else if(targetIsInCoords(N)){
            // do nothing (original code is empty here)
        } else if(someoneIsInCoords(N, combatants)){
            //go NW or NE
            if(isAvailableToMoveInto(NW, combatants)){
                newCoords = NW
            } else if(isAvailableToMoveInto(NE, combatants)){
                newCoords = NE
            } else {
                return
            }
        } else {
            // space available go N
            newCoords = N;
        }
    } else if(targetIsSouth){ //////////// S
        if(targetIsInCoords(S) && !isTargetTileOccupied){
            newCoords = S;
        } else if(targetIsInCoords(S)){
            // do nothing (original code is empty here)
        } else if(someoneIsInCoords(S, combatants)){
            //go SW or SE
            if(isAvailableToMoveInto(SW, combatants)){
                newCoords = SW
            } else if(isAvailableToMoveInto(SE, combatants)){
                newCoords = SE
            } else {
                return
            }
        } else {
            // space available go South
            newCoords = S;
        }
    } else if(targetIsEast){ ///////////  E
        if(targetIsInCoords(E) && !isTargetTileOccupied){
            newCoords = E;
        } else if(targetIsInCoords(E)){
        } else if(someoneIsInCoords(E, combatants)){
            //go NE or SE
            if(isAvailableToMoveInto(NE, combatants)){
                newCoords = NE
            } else if(isAvailableToMoveInto(SE, combatants)){
                newCoords = SE
            } else {
                return
            }
        } else {
            // space available go East
            newCoords = E;
        }
    } else if(targetIsWest){
        if(targetIsInCoords(W) && !isTargetTileOccupied){
            newCoords = W;
        } else if(targetIsInCoords(W)){
            // do nothing (original code is empty here)
        } else if(someoneIsInCoords(W, combatants)){
            //go NW or SW
            if(isAvailableToMoveInto(NW, combatants)){
                newCoords = NW
            } else if(isAvailableToMoveInto(SW, combatants)){
                newCoords = SW
            } else {
                return
            }
        } else {
            // space available go West
            newCoords = W;
        }
    }
    if(newCoords.x > MAX_DEPTH-1) newCoords.x = MAX_DEPTH -1;
    if(newCoords.x < 0) newCoords.x = 0
    if(newCoords.y > MAX_LANES-1) newCoords.y = MAX_LANES -1;
    if(newCoords.y < 0) newCoords.y = 0;
    caller.coordinates = newCoords;
}

export const MovementMethods = {
    teleportToBackLine,
    goUp: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId);
        let coords = caller.coordinates;
        let newCoords = JSON.parse(JSON.stringify(coords))
        let amount = window.pickRandom([1,2])
        newCoords.y += amount
        if(newCoords.y < 0){
            newCoords.y = 0;
        } else if(newCoords.y > MAX_LANES){
            newCoords.y = MAX_LANES
        }
        caller.coordinates = newCoords;
    },
    goDown: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId);
        let coords = caller.coordinates;
        let newCoords = JSON.parse(JSON.stringify(coords))
        let amount = window.pickRandom([1,2])
        newCoords.y -= amount
        if(newCoords.y < 0){
            newCoords.y = 0;
        } else if(newCoords.y > MAX_LANES){
            newCoords.y = MAX_LANES
        }
        caller.coordinates = newCoords;
    },
    centerBack: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId);
        const {N,E,S,W,NW,SW,NE,SE} = getSurroundings(caller.coordinates)

        let centerTile;
        if(PC_TYPES.includes(caller.type)){
            // PC always go to x:1
            // let newCoords = JSON.parse(JSON.stringify(caller.coordinates))
            // newCoords.x = 1;
            // if(newCoords.x > MAX_DEPTH) newCoords.x = MAX_DEPTH
            // if(newCoords.x < 0) newCoords.x = 0
            // caller.coordinates = newCoords;
            // return
            let centerTile = {x: 1, y: 2}
        } else {
            // NPC always go to x:6
            // let newCoords = JSON.parse(JSON.stringify(caller.coordinates))
            // newCoords.x = 6;
            // if(newCoords.x > MAX_DEPTH) newCoords.x = MAX_DEPTH
            // if(newCoords.x < 0) newCoords.x = 0
            // caller.coordinates = newCoords;
            // return
            let centerTile = {x: 6, y: 2}
        }
        // let centerTile = {x: 1, y: 2}
        let targetTile = centerTile;
        if(enemyTarget){
            targetTile = {x: 1, y: enemyTarget.coordinates.y}
        }
        goTowards(caller, combatants, targetTile);
    },
    evade: (caller, combatants) => {
        if(!caller.targetId){
            // remove this when you figure how to dodge projectiles or something
            return
        }
        let newCoords = JSON.parse(JSON.stringify(caller.coordinates))
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        let targetTile = {x: enemyTarget.coordinates.x, y: enemyTarget.coordinates.y}
        const {N,E,S,W,NW,SW,NE,SE} = getSurroundings(caller.coordinates)

        const targetIsNorthWest = targetTile.y < caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsNorth = targetTile.y < caller.coordinates.y && targetTile.x === caller.coordinates.x,
        targetIsNorthEast = targetTile.y < caller.coordinates.y && targetTile.x > caller.coordinates.x,
        targetIsWest = targetTile.y === caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsEast = targetTile.y === caller.coordinates.y && targetTile.x > caller.coordinates.x,
        targetIsSouthWest = targetTile.y > caller.coordinates.y && targetTile.x < caller.coordinates.x,
        targetIsSouth = targetTile.y > caller.coordinates.y && targetTile.x === caller.coordinates.x,
        targetIsSouthEast = targetTile.y > caller.coordinates.y && targetTile.x > caller.coordinates.x;


        if(targetIsNorth){
            if(isAvailableToMoveInto(S)){
                newCoords = S
            }
        } else if(targetIsSouth){
            if(isAvailableToMoveInto(N)){
                newCoords = N
            }
        } else if(targetIsWest){
            if(isAvailableToMoveInto(E)){
                newCoords = E
            }
        } else {
            if(isAvailableToMoveInto(NE)){
                newCoords = NE
            } else if(isAvailableToMoveInto(SE)){
                newCoords = SE
            } else if(isAvailableToMoveInto(NW)){
                newCoords = NW
            }else if(isAvailableToMoveInto(SW)){
                newCoords = SW
            }
        }
        caller.coordinates = newCoords;
    },
    evadeBack: (caller, combatants) => {
        // Determine if caller is a monster/minion or a fighter
        // Fighters: back is x = 0 (left side)
        // Monsters/Minions: back is x = MAX_DEPTH (right side)
        const isMonsterOrMinion = caller.isMonster || caller.isMinion;
        const targetX = isMonsterOrMinion ? MAX_DEPTH : 0;
        let newCoords = { ...caller.coordinates };
        const atBack = caller.coordinates.x === targetX;
        // Helper to check if enemy is directly in front
        const inFront = isMonsterOrMinion
            ? { x: caller.coordinates.x - 1, y: caller.coordinates.y }
            : { x: caller.coordinates.x + 1, y: caller.coordinates.y };
        const enemyInFront = Object.values(combatants).some(e =>
            (e.isMonster || e.isMinion || e.isFighter) && !e.dead && e.coordinates.x === inFront.x && e.coordinates.y === inFront.y
        );
        if (!atBack) {
            // Move toward back
            if (isMonsterOrMinion) {
                const nextCoords = { x: caller.coordinates.x + 1, y: caller.coordinates.y };
                if (isAvailableToMoveInto(nextCoords, combatants)) {
                    newCoords = nextCoords;
                }
            } else {
                const nextCoords = { x: caller.coordinates.x - 1, y: caller.coordinates.y };
                if (isAvailableToMoveInto(nextCoords, combatants)) {
                    newCoords = nextCoords;
                }
            }
        } else if (enemyInFront) {
            // At back and enemy in front: try to move up or down
            const up = { x: caller.coordinates.x, y: caller.coordinates.y - 1 };
            const down = { x: caller.coordinates.x, y: caller.coordinates.y + 1 };
            if (isAvailableToMoveInto(up, combatants)) {
                newCoords = up;
            } else if (isAvailableToMoveInto(down, combatants)) {
                newCoords = down;
            }
        }
        caller.coordinates = newCoords;
    },
    closeTheGap: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const isDirectlyAboveCaller = (caller, combatant) => {
            const combatantIsDirectlyAbove = (combatant.coordinates.y === caller.coordinates.y-1 && combatant.coordinates.x === caller.coordinates.x)
            return combatantIsDirectlyAbove;
        }
        const isDirectlyBelowCaller = (caller, combatant) => {
            const combatantIsDirectlyBelow = (combatant.coordinates.y === caller.coordinates.y+1 && combatant.coordinates.x === caller.coordinates.x)
            return combatantIsDirectlyBelow;
        }
        if(enemyTarget){
            const coords = caller.coordinates;
            let targetTile = {x: enemyTarget.coordinates.x, y: enemyTarget.coordinates.y}
            let newCoords = JSON.parse(JSON.stringify(coords))
            goTowards(caller, combatants, targetTile);
        } else {
            
        }
    },
    moveTowardsCloseEnemyTarget: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        // const distanceToTarget = Methods.getDistanceToTarget(caller, enemyTarget),
        // laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget)
        let targetTile = {x: enemyTarget.coordinates.x, y: enemyTarget.coordinates.y}
        let coords = caller.coordinates;

        let newCoords = JSON.parse(JSON.stringify(coords))
        if(targetTile.x > coords.x) newCoords.x = coords.x+1
        if(targetTile.x < coords.x) newCoords.x = coords.x-1
        if(targetTile.y > coords.y) newCoords.y = coords.y+1
        if(targetTile.y < coords.y) newCoords.y = coords.y-1
        caller.coordinates = newCoords;

        // if(laneDiff === 1 || laneDiff === -1){
        //     if(distanceToTarget === 0){
        //         if(caller.depth !== 0) caller.depth--
        //     } else if(distanceToTarget === 1){
        //         if(laneDiff === 1){
        //             caller.position++
        //         } else if(laneDiff === -1){
        //             caller.position--
        //         }
        //     }
        // } else if(laneDiff < -1){
        //     caller.position--
        // } else if(laneDiff > 1){
        //     caller.position++
        // } else if(laneDiff === 0 && distanceToTarget === 1){
        //     return
        // }


        // if((distanceToTarget < 0 && laneDiff) !== 0 ||  
        // (distanceToTarget < -1 && laneDiff === 0 && caller.depth > 1)){
        //     caller.depth++
        // }else if(distanceToTarget === -1 && laneDiff === 0){
        //     if(caller.depth > 1) caller.depth += 2
        // } else if(distanceToTarget === 2){
        //     caller.depth--
        // } else if(distanceToTarget > 2){
        //     caller.depth -= 2
        // }
    },
    stayOnBackRow: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = Methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget)

        if(enemyTarget){
            if(laneDiff > 0){
                caller.position ++
            } else if(laneDiff < 0){
                caller.position --
            }
            // if(laneDiff === 1 || laneDiff === -1){
            //     caller.position = enemyTarget.position;
            // } else if(laneDiff < -1){
            //     caller.position-= 2
            // } else if(laneDiff > 1){
            //     caller.position+= 2
            // } else if(laneDiff === 0 && distanceToTarget === 1){
            //     return
            // }
        } else {
            if(caller.position > 2){
                caller.position --
            } else if(caller.position < 2){
                caller.position ++
            }
        }
        if(caller.depth > 0){
            caller.depth -= 1
        } else {
            caller.depth = 0;
        }

        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    },
    stayOnX1: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = Methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget)

        if(laneDiff === 1 || laneDiff === -1){
            caller.position = enemyTarget.position;
        } else if(laneDiff < -1){
            caller.position-= 2
        } else if(laneDiff > 1){
            caller.position+= 2
        } else if(laneDiff === 0 && distanceToTarget === 1){
            return
        }
        caller.depth = 1;
        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    },
    moveTowardsCloseFriendlyTarget: (caller, combatants) => {
        let newPosition, newDepth;
        let liveCombatants = Object.values(combatants).filter(e=>!e.dead)
        const friendlyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = Methods.getDistanceToTarget(caller, friendlyTarget),
        laneDiff = Methods.getLaneDifferenceToTarget(caller, friendlyTarget);
        if(!friendlyTarget) return

        const finalize = () => {
            if(newPosition < 0) newPosition = 0
            if(newPosition > MAX_LANES) newPosition = MAX_LANES;
            if(newDepth < 0) newDepth = 0
            if(newDepth > MAX_DEPTH) newDepth = MAX_DEPTH;

            //set new values
            if(newDepth !== undefined) caller.depth = newDepth;
            if(newPosition !== undefined) caller.position = newPosition;
        }

        if((laneDiff === 1 || laneDiff === -1 || laneDiff === 0) && Math.abs(distanceToTarget) < 2){
            newPosition = friendlyTarget.position
            newDepth = friendlyTarget.depth - 1;
            finalize();
            return
        } else if(laneDiff < -1){
            newPosition = caller.position - 1
        } else if(laneDiff > 1){
            newPosition = caller.position + 1
        } else if(laneDiff === 0 && distanceToTarget === 1){
            console.log('LORYASTES: BEHIND ADJACENT!');
            // newPosition = caller.position - 1
        }
        if((distanceToTarget < 0 && laneDiff !== 0) ||  
        (distanceToTarget < -1 && laneDiff === 0 && caller.depth > 1)){
            newDepth = caller.depth - 1
        } else if(distanceToTarget > 1){
            newDepth = caller.depth + 1
        }

        if(liveCombatants.some(e=>e.position === newPosition && e.depth === newDepth)){
            let targetPosition = {x: newDepth, y: newPosition};
            let upSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y - 1);
            let downSpaceOccupied = liveCombatants.some(e=>e.depth === targetPosition.x && e.position === targetPosition.y + 1);
            if(!upSpaceOccupied){
                newPosition = targetPosition.y-1;
            } else if(!downSpaceOccupied){
                newPosition = targetPosition.y+1;
            } else {
                newPosition = caller.position;
                newDepth = caller.depth;
            }
        }
        
        finalize();
    }
}