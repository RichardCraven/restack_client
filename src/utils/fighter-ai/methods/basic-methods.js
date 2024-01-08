// const getLaneDifferenceToTarget = (caller, target) => {
//     if(!target) return 0;
//     let d =  target.position - caller.position
//     return d
// }
// const getDistanceToTarget =  (caller, target) => {
//     if(!target) return 0;
//     let d = target.depth - caller.depth
//     return d
//     // 0 = same tile
//     // 1 = 1 tile in front
//     // -1 = 1 tile behind
// }
// const pickRandom = (array) => {
//     let index = Math.floor(Math.random() * array.length)
//     return array[index]
// }
// const isAnEnemyDirectlyInFrontOfMe = (caller, combatants) => {
//     if(!combatants) return false
//     const liveEnemies = Object.values(combatants).filter(e=>e.isMonster || e.isMinion && !e.dead),
//     directlyInFront = liveEnemies.some(e=>e.depth === caller.depth + 1 && e.position === caller.position);
//     return directlyInFront ? liveEnemies.find(e=>e.depth === caller.depth + 1 && e.position === caller.position) : null;
// }

// export default Methods = { _
export const Methods = {
    getLaneDifferenceToTarget: (caller, target) => {
        if(!target) return 0;
        let d =  target.position - caller.position
        return d
    },
    getDistanceToTarget: (caller, target) => {
        if(!target) return 0;
        let d = target.depth - caller.depth
        return d
        // 0 = same tile
        // 1 = 1 tile in front
        // -1 = 1 tile behind
    },
    pickRandom: (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    },
    isAnEnemyDirectlyInFrontOfMe: (caller, combatants) => {
        if(!combatants) return false
        const liveEnemies = Object.values(combatants).filter(e=>e.isMonster || (e.isMinion && !e.dead)),
        directlyInFront = liveEnemies.some(e=>e.depth === caller.depth + 1 && e.position === caller.position);
        return directlyInFront ? liveEnemies.find(e=>e.depth === caller.depth + 1 && e.position === caller.position) : null;
    }
}