export function Wizard(data, utilMethods, animationManager, overlayManager){
    this.MAX_DEPTH = data.MAX_DEPTH;
    this.MAX_LANES = data.MAX_LANES;
    this.INTERVAL_TIME = data.INTERVAL_TIME
    
    this.animationManager = animationManager;
    this.overlayManager = overlayManager;

    this.fighterFacingUp = utilMethods.fighterFacingUp;
    this.fighterFacingDown = utilMethods.fighterFacingDown;
    this.fighterFacingRight = utilMethods.fighterFacingRight;
    this.broadcastDataUpdate = utilMethods.broadcastDataUpdate;
    this.kickoffAttackCooldown = utilMethods.kickoffAttackCooldown;
    this.missesTarget = utilMethods.missesTarget;
    this.hitsTarget = utilMethods.hitsTarget;

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

    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        const sorted = liveEnemies.sort((a,b)=>b.depth - a.depth);
        let target = sorted.length ? sorted[0] : null;
        if(!target) return;
        if(this.friendlies(combatants).some(e=>e.targetId === target.targetId) && sorted.length > 1){
            target = sorted[1]
        }
        caller.pendingAttack = this.chooseAttackType(caller, target);
        caller.targetId = target.id;
        target.targettedBy.push(caller.id)
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
            console.log('in this weird block. investigate!');
            caller.position = 2
            debugger
        } else {
            data.methods.stayOnBackRow(caller,combatants)
        }


        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
    }
    this.triggerMagicMissile = (caller, target, travelTime) => {
        console.log('zildjikan triggering magic missile against', target);
        // const tileId = this.animationManager.getTileIdByCoords(coords);
        // if(tileId !== null){
        //     this.animationManager.rippleAnimation(tileId, 'red')
        // }
        caller.lock();
        const damageSequence = () => {
            let r = Math.random()
            let criticalHit = r*100 > 80;
            let damage = criticalHit ? caller.atk*3 : caller.atk
            target.damageIndicators.push(damage);
            target.hp -= damage;
        }
        setTimeout(()=>{
            target.rockAnimationOn()
            damageSequence();
            setTimeout(()=>{
                damageSequence();
            },500)
            setTimeout(()=>{
                damageSequence();
            },1000)
            setTimeout(()=>{
                damageSequence();
            },1250)
        },travelTime)
        // ^ 1.5 seconds of travel time for missiles

        setTimeout(()=>{
            if(target) target.rockAnimationOff();
            caller.unlock();
        }, travelTime + 1000)
        // ^ travel time + 1 second of damage animation

    }
    this.triggerBeamAttack = (callerCoords, targetCoords, color = 'purple') => {
        const targetTileId = this.animationManager.getTileIdByCoords(targetCoords)
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        return new Promise((resolve) => {
            if(targetTileId !== null && sourceTileId !== null){
                console.log('booko');
                this.animationManager.beamAnimation(targetTileId, sourceTileId, color, resolve)
            }
        })
    }
    this.triggerIceBlast = (caller, target) => {

        const callerCoords = caller.coordinates, targetCoords = target.coordinates;

        this.triggerBeamAttack(callerCoords, targetCoords, 'lightblue').then(e=>{
            const hitsTarget = true;
            // ^ need to allow for missing 
            if(hitsTarget){
                let r = Math.random()
                let criticalHit = r*100 > 80;
                let damage = criticalHit ? caller.atk*(1.5)*3 : caller.atk*(1.5)
                if(criticalHit){
                    // target.woundedHeavily = true;
                } else {
                    // target.wounded = true;
                }
                target.hp -= damage;
                target.damageIndicators.push(damage);
                
                target.setToFrozen();
            }
            caller.energy -= 75;
            if(caller.energy < 0) caller.energy = 0; 
        })
    }
    this.initiateAttack = async (caller, manualAttack, combatants) => {
        if(!caller) return
        const target = combatants[caller.targetId];
        
        if(manualAttack){
            if(caller.pendingAttack && caller.pendingAttack.cooldown_position < 99){
                console.log('ruh roh');
                // debugger
                return
            }
        }
        if(!target) return
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            console.log('pending attack name ', caller.pendingAttack.name);
            switch(caller.pendingAttack.name){
                case 'energy blast':
                    if(laneDiff === 0){
                        console.log('okay go w beam attack!');
                        await this.triggerBeamAttack(caller.coordinates, target.coordinates)
                        console.log('hits');
                        this.hitsTarget(caller)
                        this.kickoffAttackCooldown(caller)
                    } else {
                        this.missesTarget(caller);
                    }
                break;
                // case 'magic missile':
                //     debugger
                //     // console.log('launching magic missiles');
                //     // console.log('caller.coordinates', caller.coordinates);
                //     // console.log('LANE DIFF IS ', laneDiff);
                //     if(laneDiff === 0){
                //         await this.triggerBeamAttack(caller.coordinates, target.coordinates)
                //         // console.log('magic missile hits');
                //         this.hitsTarget(caller)
                //     } else {
                //         this.missesTarget(caller);
                //     }
    
                break;
                case 'lightning':
                    console.log('LIGHTNING');
                    debugger
                    if(laneDiff === 0){
                        console.log('lightning hits');
                        this.hitsTarget(caller)
                    } else {
                        this.missesTarget(caller);
                    }
                break;
                default:
                    break;
            }
    }
}