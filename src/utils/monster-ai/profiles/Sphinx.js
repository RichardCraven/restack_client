export function Sphinx(data, animationManager){
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
                // console.log('no pending attack ', caller);
                // debugger
                return
            }
            console.log('SPHIUNX PROCESS MOVE');
            switch(caller.pendingAttack.name){
                case 'induce madness':
                    console.log('---INDUCE MADNESSS MOVE---');

                    data.methods.stayInColumn(6, caller, combatants)
                
                break;
                case 'claws':
                    console.log('CLAWS');
                    debugger

                break;
                case 'lightning':
                    console.log('LIGHTNING');
                    debugger
                break;

            }
            // if(caller.pendingAttack.name === 'meditate'){
            //     data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
            // }
        }
    this.triggerInduceMadness = (callerCoords, targetCoords) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        
        if(targetTileId !== null && sourceTileId !== null){
            this.animationManager.zapBurstAnimation(targetTileId, sourceTileId, 'white')
        }
    }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
            
        console.log('SPHINX INITIATE ATTACK', caller.pendingAttack);
        

        caller.attacking = true;
        const target = combatants[caller.targetId];

        
        console.log('SPHINX SWING', caller, 'target: ', target);
        // this.triggerVoidLance(target.coordinates);

        

        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);


        switch(caller.pendingAttack.name){
            case 'induce madness':
                console.log('INDUCE MADNESSS!!!!!!');
                console.log('caller.coordinates', caller.coordinates);
                if(laneDiff === 0){
                    console.log('LANE DIFF IS ', laneDiff);
                    this.triggerInduceMadness(caller.coordinates, target.coordinates)
                    console.log('induce madness hits');
                    hitsTarget(caller)
                } else {
                    missesTarget(caller);
                }
            break;
            case 'claws':
                console.log('CLAWS');

                if(distanceToTarget === 1 && laneDiff === 0){
                    console.log('claws hits');
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