export function Monk(data, utilMethods, animationManager, overlayManager){
    

    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME;
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    // Assign utility methods (match Soldier/Wizard)
    this.fighterFacingUp = utilMethods.fighterFacingUp;
    this.fighterFacingDown = utilMethods.fighterFacingDown;
    this.fighterFacingRight = utilMethods.fighterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;
    this.hitsCombatant = utilMethods.hitsCombatant;
    this.targetKilled = utilMethods.targetKilled;

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
    this.initialize = (caller) => {
        console.log('MONK INITIALIZE');
        // Default facing right
        caller.facing = 'right';


        caller.behaviorSequence = 'teleport-attacker'
    }

    this.processMove = (caller, combatants) => {
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, 1000);
        console.log('monk eraIndex:', caller.eraIndex);
        switch (caller.behaviorSequence) {
            case 'brawler':
                switch(caller.eraIndex){
                    case 0:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 1:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 2:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 3:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    case 4:
                        data.methods.closeTheGap(caller, combatants)
                    break;
                    default: 
                    break;
                }
            break;
            case 'teleport-attacker':
                switch (caller.eraIndex) {
                    case 0:
                    case 1:
                    case 2:
                    case 3:
                        this.triggerChargingUp(caller);
                        break;
                    case 4:
                        if (caller.chargingUpActive) caller.chargingUpActive = false;
                        if (data.methods.teleportToBackLine) {
                            data.methods.teleportToBackLine(caller, combatants);
                            // Immediately broadcast the new coordinates to the UI
                            if (typeof this.broadcastDataUpdate === 'function') {
                                this.broadcastDataUpdate(caller);
                            }
                            // Add a short delay to ensure UI/state is updated before triggering the attack
                            caller.behaviorSequence = 'brawler';
                            setTimeout(() => {
                                // Now trigger the dragon punch attack after teleport and update
                                if (caller.pendingAttack && caller.pendingAttack.name === 'dragon punch') {
                                    this.initiateAttack(caller, false, combatants);
                                }
                            }, 50); // 50ms delay to allow UI/state to update
                        } else {
                            data.methods.closeTheGap(caller, combatants);
                            caller.behaviorSequence = 'brawler';
                        }
                        break;
                    default:
                        if (caller.chargingUpActive) caller.chargingUpActive = false;
                        data.methods.closeTheGap(caller, combatants);
                }
                break;
            default:
                data.methods.closeTheGap(caller, combatants);
        }
    }
    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const sorted = (targetToAvoid && liveEnemies.length > 1) ?  liveEnemies.filter(e => e.id !== targetToAvoid.id).sort((a,b)=>a.depth - b.depth) : liveEnemies.sort((a,b)=>a.depth - b.depth);
        const target = sorted[0];
        // console.log('monk target: ', target);

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
            } else {
                attack = available[0];
            }
        }
        return attack;
    }
    this.triggerDragonPunch = async (coordinates, facing) => {
        // AnimationManager should handle the animation and return the hit combatant if any
        if (!this.animationManager || !this.animationManager.triggerAttackAnimation) {
            console.warn('No animationManager or triggerAttackAnimation method found');
            return null;
        }
        console.log('************* TRIGGER MONK DRAGON PUNCH ANIMATION *************');
        return await this.animationManager.triggerAttackAnimation({
            coordinates,
            facing,
            type: 'dragon_punch',
            animationType: 'dragon_punch',
        });
        }
    this.triggerChargingUp = (caller) => {
        if (!caller.chargingUpActive) {
            console.log('************* TRIGGER MONK CHARGING UP ANIMATION *************');
            caller.chargingUpActive = true;
            caller.chargingUpKey = (caller.chargingUpKey || 0) + 1;
            caller.chargingUpStartedAt = Date.now();
            caller.chargingUpDuration = (this.INTERVAL_TIME || 1) * 0.95 * 1000;
        }
    }
    this.initiateAttack = async (caller, manualAttack, combatants) => {
        if(!caller) return
        
        const callerFacing = (caller, target) => {
            let val;
            if(!target) return null;
            const targX = target.coordinates.x,
                  targY = target.coordinates.y,
                  callX = caller.coordinates.x,
                  callY = caller.coordinates.y
            if(targX === callX){
                val = targY > callY ? 'down' : 'up'
            } else {
                val = targX > callX ? 'right' : 'left'
            }
            return val;
        }

        
        
        const facingRight = this.fighterFacingRight(caller)
        const target = combatants[caller.targetId];
        const facing = caller.facing ? caller.facing : callerFacing(caller,target)
        console.log('MONK INITIATE ATTACK, caller.pendingAttack:', caller.pendingAttack);
        if(manualAttack){
            if(caller.pendingAttack && caller.pendingAttack.cooldown_position < 99){
                return
            } else if (caller.pendingAttack && caller.pendingAttack.cooldown_position === 100){
                const combatantHit = await this.triggerSwordSwing(caller.coordinates, facing)
                if(combatantHit){
                    this.hitsCombatant(caller, combatantHit)
                    this.kickoffAttackCooldown(caller)
                } else {
                    this.missesTarget(caller);
                    this.kickoffAttackCooldown(caller)
                }
            }
        } else {
            console.log('should be in here...');
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            // debugger
            switch(caller.pendingAttack.name){
                case 'dragon punch':
                    console.log('about to trigger dragon punch...');
                    const combatantHit = await this.triggerDragonPunch(caller.coordinates, facing)
                    if(combatantHit){
                        this.hitsCombatant(caller, combatantHit);
                    } else {
                        this.missesTarget(caller);
                    }
                // break;
                // case 'sword thrust':
                //     // console.log('SWORD THRUST');
                // break;
                // case 'shield bash':
                //     // console.log('SHIELD BASH');
                // break;
                default:
                    break;
            }

        }
    }
}
