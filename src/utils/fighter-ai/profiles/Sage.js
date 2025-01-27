export function Sage(data){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
            if(data.methods.isAnEnemyDirectlyInFrontOfMe(caller, combatants)){
                caller.targetId = data.methods.isAnEnemyDirectlyInFrontOfMe().id;
                caller.pendingAttack = caller.attacks.find(e=>e.name === 'meditate')
            } else {
                const protectee = data.methods.pickRandom(Object.values(combatants).filter(e=>!e.isMonster && !e.isMinion && !e.dead && e.id !== caller.id))
                if(!protectee) return
                caller.targetId = protectee.id;
                caller.pendingAttack = caller.attacks.find(e=>e.name === 'meditate');
            }
        }
    this.processMove = (caller, combatants) => {
            if(!caller.pendingAttack){
                console.log('no pending attack ', caller);
                // debugger
                return
            }
            if(caller.pendingAttack.name === 'meditate'){
                data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
            } else if(caller.pendingAttack.name === 'cane_strike'){
                console.log('MAFUCKIN CAAAANNNEEE STRIKE!');
                debugger
            }
        }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
            const target = combatants[caller.targetId];
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            if(target.isMonster || target.isMinion){
                hitsTarget(caller);
            } else {
                if(distanceToTarget === 1 && laneDiff === 0){ 
                    caller.healing = true
                    target.hp += 10;
                    if(target.hp > target.starting_hp) target.hp = target.starting_hp;
                    setTimeout(()=>{
                        // console.log('why no healing animation');
                        // debugger
                        caller.healing = false
                        caller.active = false;
                        caller.tempo = 1;
                        caller.turnCycle();
                    }, this.INTERVAL_TIME * 50)
                    // debugger
                } else if(distanceToTarget === 0 && (laneDiff === 1 || laneDiff === -1)){
                    console.log('LORYASTES: adjacent heal');
                    caller.position = target.position;
                    caller.depth = target.depth - 1
                    setTimeout(()=>{
                        caller.healing = true
                        target.hp += 10;
                        if(target.hp > target.starting_hp) target.hp = target.starting_hp;
                    }, 300)
                    setTimeout(()=>{
                        caller.healing = false
                        caller.active = false;
                        caller.tempo = 1;
                        caller.turnCycle();
                    }, this.INTERVAL_TIME * 50)
                } else if(distanceToTarget === 1 && (laneDiff === 1 || laneDiff === -1)){
                    missesTarget(caller)
                    // caller.position = (laneDiff === 1) ? caller.position -1 : caller.position + 1;
                    // setTimeout(()=>{
                    //     caller.tempo = 1;
                    //     caller.turnCycle();
                    // }, 500)
                } else {
                    missesTarget(caller)
                }
            }
    }
}