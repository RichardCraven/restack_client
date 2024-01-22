export function Zildjikan(data, animationManager){
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
        // console.log('Zildjikan sorted targets: ', sorted);
        let target = sorted.length ? sorted[0] : null;
        if(!target) return
        // if(Object.values(combatants).filter(e=>e.isMonster||e.isMinion).some(e=>e.targetId === target.targetId) && sorted.length > 1){
        if(this.friendlies(combatants).some(e=>e.targetId === target.targetId) && sorted.length > 1){
            // console.log('SAME target! find new target');
            target = sorted[1]
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        // console.log('Zildjikan target: ', target);
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
                // caller.aiming = true;
            } else {
                attack = data.methods.pickRandom(available);
            }
        }
        // console.log('Zildjiakans attack: ', attack);
        return attack
    }
    this.processMove = (caller, combatants) => {
        const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        const distanceToTarget = data.methods.getDistanceToTarget(caller, enemyTarget),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, enemyTarget)
        if(!caller.pendingAttack){
            return
        }
        if(caller.pendingAttack.name === 'meditate'){
            data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
        } else if(caller.pendingAttack.name === 'cane_strike'){
            debugger
        }

        // data.methods.moveTowardsCloseEnemyTarget(caller, combatants)

        if(
            // laneDiff === -1 && this.friendlies(combatants).some(e=>e.position === caller.position-1) ||
            // laneDiff === 1 && this.friendlies(combatants).some(e=>e.position === caller.position+1)
            data.methods.isFriendlyAtCoordinates({x: caller.coordinates.x, y: caller.coordinates.y}, data.methods.getFriendlies(caller, combatants))
        ){
            caller.position = 2
        } else {
            data.methods.stayOnBackRow(caller,combatants)
        }


        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    }
    this.triggerMagicMissile = (coords) => {
        const tileId = this.animationManager.getTileIdByCoords(coords);
        if(tileId !== null){
            this.animationManager.rippleAnimation(tileId, 'red')
        }
    }
    this.triggerBeamAttack = (callerCoords, targetCoords) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        return new Promise((resolve) => {
            if(targetTileId !== null && sourceTileId !== null){
                this.animationManager.beamAnimation(targetTileId, sourceTileId, 'purple', resolve)
            }
        })
    }
    this.initiateAttack = async (caller, combatants, hitsTarget, missesTarget) => {
            const target = combatants[caller.targetId];
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
        // return
            switch(caller.pendingAttack.name){
                case 'energy blast':
                    if(laneDiff === 0){
                        await this.triggerBeamAttack(caller.coordinates, target.coordinates)
                        // console.log('energy blast hits');
                        hitsTarget(caller)
                    } else {
                        missesTarget(caller);
                    }
                break;
                case 'magic missile':
                    // console.log('launching magic missiles');
                    // console.log('caller.coordinates', caller.coordinates);
                    // console.log('LANE DIFF IS ', laneDiff);
                    if(laneDiff === 0){
                        await this.triggerBeamAttack(caller.coordinates, target.coordinates)
                        // console.log('magic missile hits');
                        hitsTarget(caller)
                    } else {
                        missesTarget(caller);
                    }
    
                break;
                case 'lightning':
                    console.log('LIGHTNING');
    
                    if(laneDiff === 0){
                        console.log('lightning hits');
                        hitsTarget(caller)
                    } else {
                        missesTarget(caller);
                    }
                break;
                default:
                    break;
            }
    }
}