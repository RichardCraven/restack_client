export function Wizard(data, utilMethods, animationManager, overlayManager){
    // Reference to MonsterBattle component for AI-triggered glyph casting
    this.monsterBattleRef = null;
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
    this.hitsCombatant = utilMethods.hitsCombatant;
    // Override targetKilled to match monster/minion death animation and removal
    this.targetKilled = (target) => {
        // Blue ripple animation on death
        if (this.animationManager && target && target.coordinates) {
            const tileId = this.animationManager.getTileIdByCoords(target.coordinates);
            if (tileId !== null && tileId !== undefined) {
                this.animationManager.rippleAnimation(tileId, 'blue');
            }
        }
        // Mark as dead and trigger removal (customize as needed for your game logic)
        target.dead = true;
        // Optionally: add overlay animation or fade-out here if desired
        // Remove from combatants or trigger any additional cleanup as needed
        // ...existing utilMethods.targetKilled logic if needed...
        if (utilMethods.targetKilled) {
            utilMethods.targetKilled(target);
        }
    };

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
        caller.behaviorSequence = 'center-spellcaster';
        // Default facing right
        caller.facing = 'right';
    }

    this.acquireTarget = (caller, combatants, targetToAvoid = null) => {
        const liveEnemies = Object.values(combatants).filter(e=>!e.dead && (e.isMonster || e.isMinion));
        // c2 = a2 + b2
        // c (hypotenuse) = square root of a squared plus b squared
        // Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))

        const getClosestEnemy = () => {
            let closestEnemy = {enemy: null, distance: Infinity}
            let arr = []
            liveEnemies.forEach(e=>{
                let distanceToEnemy = Math.sqrt(Math.pow(e.coordinates.x - caller.coordinates.x, 2) + Math.pow(e.coordinates.y - caller.coordinates.y, 2))
                if(distanceToEnemy < closestEnemy.distance) closestEnemy = {enemy: e, distance: distanceToEnemy}
                arr.push({enemy: e, distance: distanceToEnemy})
            })
            // console.log('distance arr: ', arr);
            return closestEnemy
        }
        const closestEnemy = getClosestEnemy();
        const sorted = liveEnemies.sort((a,b)=>b.depth - a.depth);
        let target = closestEnemy.enemy;
        if(!target) return;
        const attack = this.chooseAttackType(caller, target);
        caller.pendingAttack = attack || null;
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
    return attack;
    }
    this.useGlyph = (caller, combatants) => {
        const glyphAction = caller.specialActions && caller.specialActions.find(
            a => a.type === 'glyph' && a.subTypes && a.subTypes[0] && a.subTypes[0].type === 'magic missile'
        );
        if (glyphAction && (!glyphAction.cooldown_position || glyphAction.cooldown_position === 0)) {
            // Acquire a target (closest enemy)
            const liveEnemies = Object.values(combatants).filter(e => !e.dead && (e.isMonster || e.isMinion));
            if (liveEnemies.length > 0) {
                // Sort by distance
                const getDist = (a, b) => Math.sqrt(Math.pow(a.coordinates.x - b.coordinates.x, 2) + Math.pow(a.coordinates.y - b.coordinates.y, 2));
                const target = liveEnemies.sort((a, b) => getDist(a, caller) - getDist(b, caller))[0];
                // Use MonsterBattle's fireSpecialForAI if available
                if (this.monsterBattleRef && typeof this.monsterBattleRef.fireSpecialForAI === 'function') {
                    // Set the targetId so fireGlyph uses the correct target
                    caller.targetId = target.id;
                    this.monsterBattleRef.fireSpecialForAI(caller, glyphAction.subTypes[0]);
                } else if (this.useGlyphMagicMissile) {
                    this.useGlyphMagicMissile(caller, target, glyphAction);
                } else {
                    // fallback: triggerMagicMissile for compatibility
                    this.triggerMagicMissile(caller, target, 1500);
                }
                // Set glyph on cooldown if needed
                glyphAction.cooldown_position = glyphAction.cooldown || 3;
                return true;
            }
        }
        return false;
    }
    this.processMove = (caller, combatants) => {
        caller.onMoveCooldown = true;
        setTimeout(()=>{
            caller.onMoveCooldown = false;
            // 1 second is how long it takes for lane-wrapper and portrait-wrapper to finish CSS transition
        }, 1000)


        switch(caller.behaviorSequence){
            case 'center-spellcaster': {
                // Helper to check for adjacent enemies
                const {N, S, E, W, NW, NE, SW, SE} = data.methods.getSurroundings(caller.coordinates);
                const adjacentCoords = [N, S, E, W, NW, NE, SW, SE];
                const isEnemy = (e) => e && (e.isMonster || e.isMinion) && !e.dead;
                const enemyIsAdjacent = adjacentCoords.some(coord => {
                    return Object.values(combatants).some(e => isEnemy(e) && e.coordinates.x === coord.x && e.coordinates.y === coord.y);
                });
                switch(caller.eraIndex){
                    case 0:
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
                    case 1:
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
                    case 2:
                        if (this.useGlyph(caller, combatants)) {
                            break;
                        }
                        // If can't cast glyph, fallback to movement/positioning
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
    // Abstracted glyph action block for center-spellcaster era 2
    
                    case 3:
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
                    case 4:
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
                    default:
                    break;
                }
            }
            break;
            case 'panicked':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
            case 'melee':
                switch(caller.eraIndex){
                    case 0:

                    break;
                    case 1:

                    break;
                    case 2:

                    break;
                    case 3:

                    break;
                    case 4:

                    break;
                    default: 
                    break;
                }
            break;
        }

        return
        let originalCoords = JSON.parse(JSON.stringify(caller.coordinates));
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
        data.methods.stayOnBackRow(caller,combatants)

        caller.coordinates.y = caller.position
        caller.coordinates.x = caller.depth
        let moved = JSON.stringify(originalCoords) !== JSON.stringify(caller.coordinates);
        if(moved){
            caller.movesLeft--
        }
    }
    this.triggerMagicMissile = (caller, target, travelTime) => {

        // Trigger the animation when the spell is cast
        if (this.animationManager && caller && target) {
            this.animationManager.magicMissile(caller.coordinates, target.coordinates);
        }

        // caller.lock();
        const damageSequence = () => {
            let r = Math.random()
            let criticalHit = r*100 > 80;
            let damage = criticalHit ? caller.atk*3 : caller.atk
            target.damageIndicators.push(damage);
            target.hp -= damage;
            if(target.hp <= 0){
                target.hp = 0;
                caller.targetId = null;
                target.woundedLethal = true;
                this.targetKilled(target);
            }
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
                // this.animationManager.beamAnimation(targetTileId, sourceTileId, color, resolve)
                this.animationManager.straightBeamNoTarget(sourceTileId, 'left-to-right', color, resolve)
            }
        })
    }
    this.triggerBeamAttackManual = (callerCoords, color = 'purple') => {
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        return new Promise((resolve) => {
            this.animationManager.straightBeamNoTarget(sourceTileId, 'left-to-right', color, resolve)
        })
    }
    this.triggerIceBlast = (caller, target) => {
        const callerCoords = caller.coordinates, targetCoords = target.coordinates;
        const iceBlast = caller.specials.find(e=>e.name === "ice blast")
        // lvl 1 -> 1 TC, 1x damage
        // lvl 2 -> 1 TC, 1.5x damage
        // lvl 3 -> 2 TC, 1.75x damage
        // lvl 4 -> 2 TC, 2x damage
        // lvl 5 -> 3 TC, 2.5x damage

        const levelMatrix = {
            1: {TC: 1, multiplier: 1},
            2: {TC: 1, multiplier: 1.5},
            3: {TC: 2, multiplier: 1.75},
            4: {TC: 2, multiplier: 2},
            5: {TC: 3, multiplier: 2.5},
        }
        this.triggerBeamAttack(callerCoords, targetCoords, 'lightblue').then(res=>{
            const hitsTarget = true;
            // ^ need to allow for missing 
            if(hitsTarget){
                let r = Math.random()
                let criticalHit = r*100 > 80;
                let baseDmg = levelMatrix[iceBlast.level].multiplier * caller.atk
                let damage = criticalHit ? baseDmg*3 : baseDmg
                if(criticalHit){
                    target.woundedHeavily = true;
                } else {
                    target.wounded = true;
                }
                target.hp -= damage;
                target.damageIndicators.push(damage);
                target.setToFrozen(levelMatrix[iceBlast.level].TC);
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
                console.log('pending attack not charged fully');
                return
            } else if (caller.pendingAttack && caller.pendingAttack.cooldown_position === 100){
                let combatantHit = await this.triggerBeamAttackManual(caller.coordinates)
                if(combatantHit){
                    this.hitsCombatant(caller, combatantHit)
                    // this.hitsTarget(caller)
                    
                } else {
                    this.missesTarget(caller);
                }
                this.kickoffAttackCooldown(caller)
            }
        } else {
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            switch(caller.pendingAttack.name){
                case 'energy blast':
                    if(laneDiff === 0){
                        let combatantHit  = await this.triggerBeamAttack(caller.coordinates, target.coordinates);
                        if(combatantHit){
                            this.hitsCombatant(caller, combatantHit)
                            this.kickoffAttackCooldown(caller)
                        } else {
                            this.missesTarget(caller);
                            this.kickoffAttackCooldown(caller)
                        }
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
                    debugger
                    if(laneDiff === 0){
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
}
