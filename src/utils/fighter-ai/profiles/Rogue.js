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
        console.log('Rogue sorted targets: ', sorted);
        let target = sorted.length ? sorted[0] : null;
        if(!target) return
        // if(Object.values(combatants).filter(e=>e.isMonster||e.isMinion).some(e=>e.targetId === target.targetId) && sorted.length > 1){
        if(this.friendlies(combatants).some(e=>e.targetId === target.targetId) && sorted.length > 1){
            console.log('SAME target! find new target');
            target = sorted[1]
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        console.log('Rogue target: ', target);
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;

        const distanceToTarget = data.methods.getDistanceToTarget(caller, target);

        if(distanceToTarget === 1 && available.find(e=>e.range === 'close')){
            attack = available.find(e=>e.range === 'close');
            // console.log('chosen attack: ', attack);
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
                caller.aiming = true;
            } else {
                attack = data.methods.pickRandom(available);
            }
        }
        console.log('Rogues attack: ', attack);
        return attack
    }
    this.processMove = (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = data.methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, enemyTarget)

        console.log('Rogue process move, pending attack: ', caller.pendingAttack);
        if(!caller.pendingAttack){
            console.log('no pending attack ', caller);
            return
        }
        caller.energy+=5
        // data.methods.moveTowardsCloseEnemyTarget(caller, combatants)

        if(
            // laneDiff === -1 && this.friendlies(combatants).some(e=>e.position === caller.position-1) ||
            // laneDiff === 1 && this.friendlies(combatants).some(e=>e.position === caller.position+1)
            data.methods.isFriendlyAtCoordinates({x: caller.coordinates.x, y: caller.coordinates.y}, data.methods.getFriendlies(caller, combatants))
        ){
            console.log('rogue POSITION BLOCKED', 'lane diff: ', laneDiff);
            debugger
            caller.position = 2
        } else {
            console.log('stay on x1');
            data.methods.stayOnX1(caller,combatants)
        }


        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    }
    this.triggerNarrowBeamAttack = (callerCoords, targetCoords) => {
        console.log('narrow beam attack!-----------------------');
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        console.log('targetTileId: ', targetTileId, 'sourceTileId:', sourceTileId);
        if(targetTileId !== null && sourceTileId !== null){
            console.log('GO.');
            this.animationManager.narrowBeamAnimation(targetTileId, sourceTileId, 'white')
        }
    }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
        console.log('Rogue initiate attack!!!!!!!!!', caller.pendingAttack);
            const target = combatants[caller.targetId];
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);

            switch(caller.pendingAttack.name){
                case 'fire arrow':
                    console.log('-FIRE ARROW-');
                    console.log('caller.coordinates', caller.coordinates);
                    if(laneDiff === 0){
                        this.triggerNarrowBeamAttack(caller.coordinates, target.coordinates)
                        console.log('fire arrow hits');
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