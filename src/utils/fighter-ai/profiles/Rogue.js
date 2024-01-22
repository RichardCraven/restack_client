export function Rogue(data, animationManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;

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
    this.acquireTarget = (caller, combatants) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>b.depth - a.depth);
        let target = sorted.length ? sorted[0] : null;
        if(!target) return
        // if(Object.values(combatants).filter(e=>e.isMonster||e.isMinion).some(e=>e.targetId === target.targetId) && sorted.length > 1){
        if(this.friendlies(combatants).some(e=>e.targetId === target.targetId) && sorted.length > 1){

            target = sorted[1]
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
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
                attack = chosenAttack;
                // caller.aiming = true;
            } else {
                attack = data.methods.pickRandom(available);
            }
        }
        return attack
    }
    this.processMove = (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = data.methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, enemyTarget)

        // console.log('Rogue process move, pending attack: ', caller.pendingAttack);
        if(!caller.pendingAttack){
            return
        }
        caller.energy+=5

        // data.methods.moveTowardsCloseEnemyTarget(caller, combatants)

        if(
            // laneDiff === -1 && this.friendlies(combatants).some(e=>e.position === caller.position-1) ||
            // laneDiff === 1 && this.friendlies(combatants).some(e=>e.position === caller.position+1)
            data.methods.isFriendlyAtCoordinates({x: caller.coordinates.x, y: caller.coordinates.y}, data.methods.getFriendlies(caller, combatants))
        ){
            caller.position = 2
        } else {
            data.methods.stayOnX1(caller,combatants)
        }


        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    }
    this.triggerNarrowBeamAttack = (callerCoords, targetCoords) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        return new Promise((resolve) => {
            if(targetTileId !== null && sourceTileId !== null){
                this.animationManager.narrowBeamAnimation(targetTileId, sourceTileId, 'white', resolve)
            }
        })
    }
    this.initiateAttack = async (caller, combatants, hitsTarget, missesTarget) => {
            const target = combatants[caller.targetId];
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);

            switch(caller.pendingAttack.name){
                case 'fire arrow':
                    if(laneDiff === 0){
                        await this.triggerNarrowBeamAttack(caller.coordinates, target.coordinates)
                        hitsTarget(caller)
                    } else {
                        missesTarget(caller);
                    }
                break;
                default:
                    hitsTarget(caller);
                    break;
            }
    }
}