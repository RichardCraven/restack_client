
import {Methods} from '../../basic-methods';

const MAX_DEPTH = 7
const MAX_LANES = 5

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
    centerBack: (caller) => {
        console.log('centerBack');
        let targetTile = {x: 1, y: 2}
        let coords = caller.coordinates;
        let newCoords = JSON.parse(JSON.stringify(coords))
        console.log('target tile: ', targetTile);
        console.log('vs coords ', coords);
        if(targetTile.x > coords.x) newCoords.x = coords.x+1
        if(targetTile.x < coords.x) newCoords.x = coords.x-1
        if(targetTile.y > coords.y) newCoords.y = coords.y+1
        if(targetTile.y < coords.y) newCoords.y = coords.y-1
        console.log('newCoords: ', newCoords);
        caller.coordinates = newCoords;
    },
    evade: (caller, combatants) => {
        console.log('EVADE!!!!!!!!!!!!!!!!!!!!!!!!!!!');
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId),
        laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget),
        depthDiff = Methods.getDistanceToTarget(caller, enemyTarget)
        let coords = caller.coordinates;
        let newCoords = JSON.parse(JSON.stringify(coords))
        console.log('original coords', JSON.parse(JSON.stringify(caller.coordinates)));
        if(laneDiff < 0){
            // caller.position--
            caller.coordinates = {x: depthDiff > 3 ? coords.x-1 : coords.x, y: coords.y+1}
        } else if(laneDiff > 0){
            // caller.position++
            caller.coordinates = {x: depthDiff > 3 ? coords.x-1 : coords.x, y: coords.y+1}
        }
        console.log('new coordinates', caller.coordinates);
        // debugger
    },
    closeTheGap: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        console.log('close the gap, target: ', enemyTarget);
        // const distanceToTarget = Methods.getDistanceToTarget(caller, enemyTarget),
        // laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget)
        if(enemyTarget){
            // console.log('normal');
            let targetTile = {x: enemyTarget.coordinates.x, y: enemyTarget.coordinates.y}
            let coords = caller.coordinates;
            let newCoords = JSON.parse(JSON.stringify(coords))
            if(targetTile.x > coords.x) newCoords.x = coords.x+1
            if(targetTile.x < coords.x){
                console.log('going backgwards', targetTile, coords);
                debugger
                newCoords.x = coords.x-1
            }
            if(targetTile.y > coords.y) newCoords.y = coords.y+1
            if(targetTile.y < coords.y) newCoords.y = coords.y-1
            console.log('going from ', caller.coordinates, 'to ', newCoords);
            caller.coordinates = newCoords;

        } else {

            console.log('no enbemey target!!!, caller ', caller);
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