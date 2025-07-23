
import {Methods} from './basic-methods';

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
        if(targetIsInCoords(NW)){
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
        if(targetIsInCoords(NE)){
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
            // space available go NW
            newCoords = NE;
        }
    } else if(targetIsSouthWest){ ////////////////////////////////////// SW
        if(targetIsInCoords(SW)){
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
        if(targetIsInCoords(SE)){
            if(isAvailableToMoveInto(E, combatants)){
                newCoords = E;
            } else if(isAvailableToMoveInto(S, combatants)){
                newCoords = S;
            } else {
                console.log('TARGET DIRECTLY SE, but Im stuck');
            }
        } else if(someoneIsInCoords(SE, combatants)){
            //go down or right
            if(isAvailableToMoveInto(S, combatants)){
                newCoords = S
            } else if(isAvailableToMoveInto(E, combatants)){
                newCoords = E
            } else {
                console.log('nowhere to go, stay put');
                return
            }
        } else {
            // space available go SW
            newCoords = SE;
        }
    } else if(targetIsNorth){ ////////// N
        if(targetIsInCoords(N)){
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
            // space available go SW
            newCoords = N;
        }
    } else if(targetIsSouth){ //////////// S
        if(targetIsInCoords(S)){
            // console.log('TARGET DIRECTLY South');
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
        if(targetIsInCoords(E, combatants)){
            // console.log('TARGET DIRECTLY east');
        } else if(someoneIsInCoords(E, combatants)){
            //go NE or SE
            if(isAvailableToMoveInto(NE, combatants)){
                newCoords = NE
            } else if(isAvailableToMoveInto(SE, combatants)){
                newCoords = SE
            } else {
                console.log('nowhere to go, stay put');
                return
            }
        } else {
            // space available go South
            newCoords = E;
        }
    } else if(targetIsWest){
        if(targetIsInCoords(W)){
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
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)

        const {N,E,S,W,NW,SW,NE,SE} = getSurroundings(caller.coordinates)

        

        let centerTile = {x: 1, y: 2}
        let targetTile = centerTile;
        if(enemyTarget){
            const enemyTargetY = enemyTarget.coordinates.y
            const enemyTile = {x: enemyTarget.coordinates.x,y: enemyTarget.coordinates.y}
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
        console.log('EVADE!!!!!!!!!!!!!!!!!!!!!!!!!!!');
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