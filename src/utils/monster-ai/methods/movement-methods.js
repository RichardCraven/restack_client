
import {Methods} from './basic-methods';

const MAX_DEPTH = 7
const MAX_LANES = 5

export const MonsterMovementMethods = {
    moveTowardsCloseEnemyTarget: (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = Methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = Methods.getLaneDifferenceToTarget(caller, enemyTarget)

        // handle position

        if(laneDiff === 1 || laneDiff === -1){
            if(distanceToTarget === 0){
                if(caller.depth !== 0) caller.depth--
            } else if(distanceToTarget === 1){
                if(laneDiff === 1){
                    caller.position++
                } else if(laneDiff === -1){
                    caller.position--
                }
            }
        } else if(laneDiff < -1){
            caller.position--
        } else if(laneDiff > 1){
            caller.position++
        } else if(laneDiff === 0 && distanceToTarget === 1){
            console.log('********enemy right in front, dont move!')
            return
        }

        // now handle depth


        if(distanceToTarget < 0 && laneDiff !== 0 ||  
        (distanceToTarget < -1 && laneDiff === 0 && caller.depth > 1)){
            caller.depth--
        }else if(distanceToTarget === -1 && laneDiff === 0){
            if(caller.depth > 1) caller.depth -= 2
        } else if(distanceToTarget === 2){
            caller.depth++
        } else if(distanceToTarget > 2){
            caller.depth += 2
        }
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
        if(distanceToTarget < 0 && laneDiff !== 0 ||  
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