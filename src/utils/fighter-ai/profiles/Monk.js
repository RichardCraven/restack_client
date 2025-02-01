export function Monk(data, animationManager){
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

    this.processMove = (caller, combatants) => {
        this.methods.moveTowardsCloseEnemyTarget(caller, combatants);
    }
    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const sorted = (targetToAvoid && liveEnemies.length > 1) ?  liveEnemies.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>a.depth - b.depth) : liveEnemies.sort((a,b)=>a.depth - b.depth);
        const target = sorted[0];
        // console.log('soldiers target: ', target);

        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
    }
    this.initiateAttack = (caller, combatants, hitsTarget, missesTarget) => {
        if(!caller) return
        const target = combatants[caller.targetId];
        if(!target) return
        let defenseFactor = target.stats.dex ** 2 + target.stats.baseDef;
        if(defenseFactor > 99) defenseFactor = 90;
        let attackFactor = Math.floor(Math.sqrt(caller.atk));
        const results = [], diceRoll = function(){
            return Math.random() * 100
        };
        
        for(let i = 0; i < attackFactor; i++){
            results.push(diceRoll())
        }
        const connects = results.some(e=>e>defenseFactor);
        caller.active = true;
        caller.attacking = true;
        this.broadcastDataUpdate();
        caller.readout.action = ` attacks with ${caller.pendingAttack.name}`
        this.kickoffAttackCooldown(caller)
        if(connects){
            if(manualAttack){
                this.hitsTarget(caller, target)
            } else {
                this.hitsTarget(caller)
            }
        } else {
            if(manualAttack){
                this.missesTarget(caller, target)
            } else {
                this.missesTarget(caller)
            }
            
        }
    }
}