export function Djinn(data){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
 
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
            if(caller.pendingAttack.name === 'meditate'){
                data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
            } else if(caller.pendingAttack.name === 'cane_strike'){
                // console.log('MAFUCKIN CAAAANNNEEE STRIKE!');
                debugger
            }
        }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
            

        caller.attacking = true;
        const target = combatants[caller.targetId];
        const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
        if(distanceToTarget === 1 && laneDiff === 0){
            console.log('SWING!!!! (Greco always hits)');
            hitsTarget(caller)
        } else {
            missesTarget(caller);
        }



        // return
        // const target = combatants[caller.targetId];
        //     const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
        //     laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
        //     if(target.isMonster || target.isMinion){
        //         hitsTarget(caller);
        //     } else {
        //         if(distanceToTarget === 1 && laneDiff === 0){ 
        //             caller.healing = true
        //             target.hp += 10;
        //             if(target.hp > target.starting_hp) target.hp = target.starting_hp;
        //             setTimeout(()=>{
        //                 // console.log('why no healing animation');
        //                 // debugger
        //                 caller.healing = false
        //                 caller.active = false;
        //                 caller.tempo = 1;
        //                 caller.turnCycle();
        //             }, this.INTERVAL_TIME * 50)
        //             // debugger
        //         } else if(distanceToTarget === 0 && (laneDiff === 1 || laneDiff === -1)){
        //             console.log('LORYASTES: adjacent heal');
        //             caller.position = target.position;
        //             caller.depth = target.depth - 1
        //             setTimeout(()=>{
        //                 caller.healing = true
        //                 target.hp += 10;
        //                 if(target.hp > target.starting_hp) target.hp = target.starting_hp;
        //             }, 300)
        //             setTimeout(()=>{
        //                 caller.healing = false
        //                 caller.active = false;
        //                 caller.tempo = 1;
        //                 caller.turnCycle();
        //             }, this.INTERVAL_TIME * 50)
        //         } else if(distanceToTarget === 1 && (laneDiff === 1 || laneDiff === -1)){
        //             missesTarget(caller)
        //             // caller.position = (laneDiff === 1) ? caller.position -1 : caller.position + 1;
        //             // setTimeout(()=>{
        //             //     caller.tempo = 1;
        //             //     caller.turnCycle();
        //             // }, 500)
        //         } else {
        //             missesTarget(caller)
        //         }
        //     }
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100);
        let percentCooledDown = 0,
            chosenAttack;

        // console.log('djinn available attacks', available, 'caller.attacks', caller.attacks)
        // debugger
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
                // console.log('djinn picking random attack: ', attack);
            }
        }
        // console.log('chosen attack: ', attack);
        return attack
    }
}