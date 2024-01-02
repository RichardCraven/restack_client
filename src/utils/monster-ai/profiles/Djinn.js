export function Djinn(data, animationManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
 
    this.acquireTarget = (caller, combatants) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (!e.isMonster && !e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>a.depth - b.depth);
        const target = sorted[0];
        if(!target) return
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;

        
        // 



            // if(data.methods.isAnEnemyDirectlyInFrontOfMe(caller, combatants)){
            //     caller.targetId = data.methods.isAnEnemyDirectlyInFrontOfMe().id;
            //     caller.pendingAttack = caller.attacks.find(e=>e.name === 'meditate')
            // } else {
            //     const protectee = data.methods.pickRandom(Object.values(combatants).filter(e=>!e.isMonster && !e.isMinion && !e.dead && e.id !== caller.id))
            //     if(!protectee) return
            //     caller.targetId = protectee.id;
            //     caller.pendingAttack = caller.attacks.find(e=>e.name === 'meditate');
            // }
    }
    this.processMove = (caller, combatants) => {
            if(!caller.pendingAttack){
                return
            }
            data.methods.moveTowardsCloseEnemyTarget(caller, combatants)
        }
    this.triggerVoidLance = (coords) => {
        const tileId = this.animationManager.getTileIdByCoords(coords)
        // console.log('tileId: ', tileId);
        if(tileId !== null){
            this.animationManager.rippleAnimation(tileId, 'red')
        }
    }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
            
        // console.log('DJINN INITIATE ATTACK', caller.pendingAttack);
        

        caller.attacking = true;
        const target = combatants[caller.targetId];

        
        // console.log('DJINN SWING', caller, 'target: ', target);
        


        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
        if(distanceToTarget === 1 && laneDiff === 0){
            this.triggerVoidLance(target.coordinates);
            hitsTarget(caller)
        } else {
            missesTarget(caller);
        }
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;

        // console.log('djinn available attacks', available, 'caller.attacks', caller.attacks)

        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);

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
        return attack
    }
}