export function Sphinx(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;
    
    this.monsterFacingUp = utilMethods.monsterFacingUp;
    this.monsterFacingDown = utilMethods.monsterFacingDown;
    this.monsterFacingRight = utilMethods.monsterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;

    this.acquireTarget = (caller, combatants) => {
        // console.log('SPHINX TARGETTing. animation manager: ', this.animationManager, 'overlay manager: ', this.overlayManager);
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (!e.isMonster && !e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>a.depth - b.depth);
        const target = sorted[0];
        if(!target) return
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }
    this.processMove = (caller, combatants) => {
            if(!caller.pendingAttack){
                // console.log('no pending attack ', caller);
                // debugger
                return
            }
            // console.log('SPHIUNX PROCESS MOVE');
            switch(caller.pendingAttack.name){
                case 'induce madness':
                    // console.log('---INDUCE MADNESSS MOVE---');

                    data.methods.stayInColumn(6, caller, combatants)
                
                break;
                case 'claws':
                    // console.log('CLAWS');
                    // debugger

                break;
                case 'lightning':
                    // console.log('LIGHTNING');
                    // debugger
                break;
                default:
                    break;

            }
            // if(caller.pendingAttack.name === 'meditate'){
            //     data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
            // }
        }
        // return new Promise((resolve) => {
        //     setTimeout(()=>{
        //         resolve(numSeconds, ' complete')
        //     }, numSeconds * 1000)
        // })
    this.triggerInduceMadness = (callerCoords, targetCoords) => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords);
        return new Promise((resolve) => {
            if(targetTileId !== null && sourceTileId !== null){
                this.animationManager.zapBurstAnimation(targetTileId, sourceTileId, 'white', resolve)
            }
        })
    }
    this.initiateAttack = async (caller, combatants) => {
        caller.attacking = true;
        const target = combatants[caller.targetId];
        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);


        const animation = {
            type: 'glowing-eyes',
            id: caller.id,
            data:{
                // color: caller.isMonster ? 'red' : 'lightred'
                color: 'white'
            }
        }
        this.overlayManager.addAnimation(animation)

        switch(caller.pendingAttack.name){
            case 'induce madness':
                if(laneDiff === 0){
                    await this.triggerInduceMadness(caller.coordinates, target.coordinates)
                    this.hitsTarget(caller)
                } else {
                    this.missesTarget(caller);
                }
            break;
            case 'claws':
                if(distanceToTarget === 1 && laneDiff === 0){
                    this.hitsTarget(caller)
                } else {
                    this.missesTarget(caller);
                }


            break;
            case 'lightning':
                // console.log('LIGHTNING');

                if(laneDiff === 0){
                    // console.log('lightning hits');
                    this.hitsTarget(caller)
                } else {
                    this.missesTarget(caller);
                }
            break;
            default:
                break;
        }



        
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;

        // console.log('djinn available attacks', available, 'caller.attacks', caller.attacks)

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
            } else {
                attack = data.methods.pickRandom(available);
            }
        }
        return attack
    }
}