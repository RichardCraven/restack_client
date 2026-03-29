const pickRandom = (array) => {
    let index = Math.floor(Math.random() * array.length)
    return array[index]
}

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
    this.useConsumable = utilMethods.useConsumable;
    this.getCurrentInventory = utilMethods.getCurrentInventory;
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
        const sorted = liveEnemies.sort((a,b)=>b.depth - a.depth); // eslint-disable-line no-unused-vars
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
    // Import SPELLS table for spell metadata
    const { SPELLS } = require('../../spells-table');
    this.useSpell = (caller, combatants) => {
        // Diagnostic: log spell state and decision
        const magicMissile = caller.specialActions && caller.specialActions.find(
            a => a.type === 'spell' && a.subtype === 'magic missile'
        );
        if (magicMissile) {
            // Use energyCost from spells-table if defined, else fallback
            if (typeof magicMissile.energy_cost === 'undefined') {
                magicMissile.energy_cost = (SPELLS.magicMissile && SPELLS.magicMissile.energyCost) || 30;
            }
            const maxPts = (typeof caller.movementPointsMax === 'number') ? caller.movementPointsMax : (caller.manualMovesTotal || 1);
            if (typeof magicMissile.movement_point_cost === 'undefined') magicMissile.movement_point_cost = Math.ceil(maxPts * 0.25);
        }
        const magicMissileAvailable = magicMissile && (magicMissile.cooldown_position === 100) && (typeof magicMissile.energy_cost === 'number' ? caller.energy >= magicMissile.energy_cost : true) && (typeof magicMissile.movement_point_cost === 'number' ? ((typeof caller.movementPointsCurrent === 'number' ? caller.movementPointsCurrent : caller.manualMovesCurrent || 0) >= magicMissile.movement_point_cost) : true);
        if (typeof console !== 'undefined') {
            console.log('[Wizard AI][useSpell] magicMissile:', magicMissile, 'available:', magicMissileAvailable, 'energy:', caller.energy, 'movePts:', caller.movementPointsCurrent, 'manualMoves:', caller.manualMovesCurrent);
        }
        if (magicMissileAvailable) {
            const liveEnemies = Object.values(combatants).filter(e => !e.dead && (e.isMonster || e.isMinion));
            if (liveEnemies.length > 0) {
                const getDist = (a, b) => Math.sqrt(Math.pow(a.coordinates.x - b.coordinates.x, 2) + Math.pow(a.coordinates.y - b.coordinates.y, 2));
                const target = liveEnemies.sort((a, b) => getDist(a, caller) - getDist(b, caller))[0];
                if (typeof console !== 'undefined') {
                    console.log('[Wizard AI][useSpell] Firing magic missile at', target?.id, target);
                }
                if (this.monsterBattleRef && typeof this.monsterBattleRef.fireSpecialForAI === 'function') {
                    caller.targetId = target.id;
                    this.monsterBattleRef.fireSpecialForAI(caller, magicMissile);
                } else if (this.useSpellMagicMissile) {
                    this.useSpellMagicMissile(caller, target, magicMissile);
                } else {
                    caller.specialActions = caller.specialActions.filter(a => a !== magicMissile)
                    if (typeof this.broadcastDataUpdate === 'function') {
                        try {
                            this.broadcastDataUpdate(caller);
                        } catch (e) {
                            try { this.broadcastDataUpdate(); } catch (e2) { /* ignore */ }
                        }
                    }
                    if (this.monsterBattleRef && typeof this.monsterBattleRef.applyFighterUpdate === 'function') {
                        try {
                            this.monsterBattleRef.applyFighterUpdate(caller);
                        } catch (err) {
                            console.warn('monsterBattleRef.applyFighterUpdate failed', err);
                        }
                    }
                    caller.energy -= (magicMissile.energy_cost || 50);
                    try {
                        const reduce = magicMissile.movement_point_cost || Math.ceil(((typeof caller.movementPointsMax === 'number' ? caller.movementPointsMax : (caller.manualMovesTotal || 1)) * 0.25));
                        caller.manualMovesCurrent = Math.max(0, (caller.manualMovesCurrent || 0) - reduce);
                        caller.movementPointsCurrent = Math.max(0, (caller.movementPointsCurrent || 0) - reduce);
                        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(caller);
                        if (this.monsterBattleRef && typeof this.monsterBattleRef.applyFighterUpdate === 'function') {
                            try { this.monsterBattleRef.applyFighterUpdate(caller); } catch (err) { /* ignore */ }
                        }
                    } catch (err) { /* non-fatal */ }
                    this.triggerMagicMissile(caller, target, 1500);
                }
                return true;
            }
        } else {
            if (typeof console !== 'undefined') {
                console.log('[Wizard AI][useSpell] Magic missile NOT available. Reason:', {
                    hasMagicMissile: !!magicMissile,
                    cooldown: magicMissile?.cooldown_position,
                    enoughEnergy: magicMissile ? caller.energy >= magicMissile.energy_cost : false,
                    enoughMove: magicMissile ? ((typeof caller.movementPointsCurrent === 'number' ? caller.movementPointsCurrent : caller.manualMovesCurrent || 0) >= magicMissile.movement_point_cost) : false
                });
            }
        }
        if(caller.energy > 50){
            const pickRandomSpecial = () => {
                const availableSpecials = caller.specials.filter(e=>e.cooldown_position >= 100)
                const special = pickRandom(availableSpecials)
                return special
            }
            const special = pickRandomSpecial();
            const target = Object.values(combatants).find(e=>e.id === caller.targetId)
            // Before invoking a chosen special, ensure it meets the three conditions
            if (special) {
                if (typeof special.energy_cost === 'undefined') special.energy_cost = special.energy_cost || 30;
                const maxPts = (typeof caller.movementPointsMax === 'number') ? caller.movementPointsMax : (caller.manualMovesTotal || 1);
                if (typeof special.movement_point_cost === 'undefined') special.movement_point_cost = Math.ceil(maxPts * 0.25);
                const canCast = special.cooldown_position >= 100 && (caller.energy >= (special.energy_cost || 0)) && ((typeof caller.movementPointsCurrent === 'number' ? caller.movementPointsCurrent : caller.manualMovesCurrent || 0) >= (special.movement_point_cost || 0));
                if (canCast) {
                    // Deduct energy and movement points
                    try {
                        caller.energy -= (special.energy_cost || 0);
                        const reduce = special.movement_point_cost || Math.ceil(maxPts * 0.25);
                        caller.manualMovesCurrent = Math.max(0, (caller.manualMovesCurrent || 0) - reduce);
                        caller.movementPointsCurrent = Math.max(0, (caller.movementPointsCurrent || 0) - reduce);
                        if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(caller);
                        if (this.monsterBattleRef && typeof this.monsterBattleRef.applyFighterUpdate === 'function') {
                            try { this.monsterBattleRef.applyFighterUpdate(caller); } catch (err) { /* ignore */ }
                        }
                    } catch (err) {}
                    switch(special.name){
                        case "ice blast":
                            this.triggerIceBlast(caller, target);
                            break;
                        case "fire blast":
                            this.triggerFireBlast(caller, target);
                            break;
                        default:
                            // fallback: try to trigger by name if supported
                            if (special.name && special.name.toLowerCase().includes('fire')) this.triggerFireBlast(caller, target);
                            else if (special.name && special.name.toLowerCase().includes('ice')) this.triggerIceBlast(caller, target);
                            break;
                    }
                }
            }
        }
        return false;
    }
    this.tryUseConsumableForHeal = (caller) => {
        try {
            if (!caller || typeof caller.hp === 'undefined' || typeof caller.starting_hp === 'undefined') return false;
            // threshold: 50% of starting HP
            if (!(caller.hp < (caller.starting_hp * 0.5))) return false;
            if (!this.useConsumable) return false;
            const groupInv = (typeof this.getCurrentInventory === 'function') ? this.getCurrentInventory() : (Array.isArray(caller.inventory) ? caller.inventory : []);
            if (!groupInv || !groupInv.length) return false;
            const pIdx = groupInv.findIndex(i => i && (i.effect === 'health gain' || (i.name && i.name.toLowerCase().includes('potion'))));
            if (pIdx === -1) return false;
            const isGroup = (typeof this.getCurrentInventory === 'function');
            let item;
            if (!isGroup && Array.isArray(caller.inventory)) {
                item = caller.inventory.splice(pIdx, 1)[0];
            } else {
                item = groupInv[pIdx];
            }
            console.log('AI using consumable item', item);
            try { this.useConsumable(item, caller); } catch (e) {}
            try { if (typeof this.broadcastDataUpdate === 'function') this.broadcastDataUpdate(caller); } catch (e) {}
            return true;
        } catch (err) {
            console.warn('tryUseConsumableForHeal failed', err);
            return false;
        }
    };
    this.processMove = (caller, combatants) => {
        if (typeof console !== 'undefined') {
            console.log('[Wizard AI][processMove] called for', caller?.id, 'eraIndex:', caller?.eraIndex, 'energy:', caller?.energy, 'moveCooldown:', caller?.moveCooldown, 'specialActions:', caller?.specialActions);
        }
        if (caller.stunned) return; // stunned: skip all movement this tick
        if (typeof caller.moveCooldown === 'undefined') {
            throw new Error('moveCooldown must be defined for all units');
        }
        caller.onMoveCooldown = true;
        setTimeout(() => {
            caller.onMoveCooldown = false;
        }, caller.moveCooldown);

        switch(caller.behaviorSequence){
            case 'center-spellcaster': {
                // Helper to check for adjacent enemies
                const {N, S, E, W, NW, NE, SW, SE} = data.methods.getSurroundings(caller.coordinates);
                const adjacentCoords = [N, S, E, W, NW, NE, SW, SE];
                const isEnemy = (e) => e && (e.isMonster || e.isMinion) && !e.dead;
                const enemyIsAdjacent = adjacentCoords.some(coord => {
                    return Object.values(combatants).some(e => isEnemy(e) && e.coordinates.x === coord.x && e.coordinates.y === coord.y);
                });
                const target = Object.values(combatants).find(e=>e.id === caller.targetId),
                targetHasMoreThanHalfHp = target && target.hp > (target.starting_hp / 2),
                spells = caller.specialActions && caller.specialActions.filter(action => action.type === 'spell'), // eslint-disable-line no-unused-vars
                spellAvailable = caller.specialActions && caller.specialActions.find(action => action.type === 'spell' && action.available); // eslint-disable-line no-unused-vars

                const magicMissile = caller.specialActions && caller.specialActions.find( // eslint-disable-line no-unused-vars
                    a => a.type === 'spell' && a.subtype === 'magic missile'
                );


                switch(caller.eraIndex){
                    case 0:
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }
                    break;
                    case 1:
                        this.tryUseConsumableForHeal(caller);
                        if (target && targetHasMoreThanHalfHp && this.useSpell(caller, combatants)) {
                            break;
                        }
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }

                        if (target && this.useSpell(caller, combatants)) {
                            break;
                        }
                    break;
                    case 2:
                        // If low HP, attempt to consume a health potion before other actions
                        this.tryUseConsumableForHeal(caller);
                        if (target && targetHasMoreThanHalfHp &&  this.useSpell(caller, combatants)) {
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
                        // era 3: attempt to use a health potion if dangerously low
                        this.tryUseConsumableForHeal(caller);
                        if(enemyIsAdjacent) {
                            data.methods.evadeBack(caller, combatants);
                        } else {
                            data.methods.centerBack(caller, combatants);
                        }

                        if (target && this.useSpell(caller, combatants)) {
                            break;
                        }
                    break;
                    case 4:
                        // era 4: attempt to use a health potion if dangerously low
                        this.tryUseConsumableForHeal(caller);
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
            default:
            break;
        }

        return
        // let originalCoords = JSON.parse(JSON.stringify(caller.coordinates));
        // const enemyTarget = Object.values(combatants).find(e=>e.id === caller.targetId)
        // const distanceToTarget = data.methods.getDistanceToTarget(caller, enemyTarget),
        // laneDiff = data.methods.getLaneDifferenceToTarget(caller, enemyTarget)
        // if(!caller.pendingAttack){ return }
        // if(caller.pendingAttack.name === 'meditate'){
        //     data.methods.moveTowardsCloseFriendlyTarget(caller, combatants)
        // } else if(caller.pendingAttack.name === 'cane_strike'){ }
        // data.methods.stayOnBackRow(caller,combatants)
        // caller.coordinates.y = caller.position
        // caller.coordinates.x = caller.depth
        // let moved = JSON.stringify(originalCoords) !== JSON.stringify(caller.coordinates);
        // if(moved){ caller.movesLeft-- }
    }
    this.triggerMagicMissile = (caller, target, travelTime) => {
        console.log('triggering***');
        // Trigger the animation when the spell is cast
        if (this.animationManager && caller && target) {
            this.animationManager.magicMissile(caller.coordinates, target.coordinates);
        }

        // caller.lock();
        // Use the centralized damage handler for each missile hit so we keep
        // critical logic, wounded state, and rock animation consistent.
        const damageSequence = () => {
            if (!caller || !target) return;
            try {
                // hitsCombatant handles crit chance, damage application, wounded, and rock animation
                if (typeof this.hitsCombatant === 'function') {
                    this.hitsCombatant(caller, target);
                } else {
                    // fallback: apply simple damage
                    let r = Math.random();
                    let criticalHit = r * 100 > 80;
                    let damage = criticalHit ? caller.atk * 3 : caller.atk;
                    const indicatorId = Date.now() + Math.random();
                    const indicatorObj = { id: indicatorId, value: damage, source: caller?.name || 'Wizard' };
                    target.damageIndicators.push(indicatorObj);
                    console.log('[DIAG][Wizard] Pushed to target.damageIndicators:', indicatorObj, 'Current:', target.damageIndicators);
                    target.hp -= damage;
                    if (target.hp <= 0) {
                        target.hp = 0;
                        caller.targetId = null;
                        this.targetKilled(target);
                    }
                }
            } catch (err) {
                console.warn('magic missile damage handler failed', err);
            }
        };

        setTimeout(() => {
            damageSequence();
            setTimeout(() => {
                damageSequence();
            }, 500);
            setTimeout(() => {
                damageSequence();
            }, 1000);
            setTimeout(() => {
                damageSequence();
            }, 1250);
        }, travelTime);
        // ^ 1.5 seconds of travel time for missiles

        setTimeout(() => {
            caller.unlock();
        }, travelTime + 1000);
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
    // this.triggerBeamAttack(callerCoords, targetCoords, 'lightblue').then(res=>{
    //         const hitsTarget = true;
    //         // ^ need to allow for missing 
    //         console.log('TRIGGER BEAM');
    //         if(hitsTarget){
    //             let r = Math.random()
    //             console.log('r: ', r);
    //             let criticalHit = r*100 > 10;
    //             let baseDmg = levelMatrix[iceBlast.level].multiplier * caller.atk
    //             let damage = criticalHit ? baseDmg*3 : baseDmg
    //             if (criticalHit) {
    //                 console.log('CRIT ON ', target.id);
    //                 // set unified wounded object with severity and damage
    //                 const sourceDirection = caller.coordinates.x < target.coordinates.x ? 'left' : (caller.coordinates.x > target.coordinates.x ? 'right' : (caller.coordinates.y > target.coordinates.y ? 'bottom' : 'top'));
    //                 target.wounded = {
    //                     severity: 'severe',
    //                     damage,
    //                     sourceDirection
    //                 };
    //                 // temporarily trigger rocked animation
    //                 if (typeof target.rockAnimationOn === 'function') target.rockAnimationOn();
    //                 setTimeout(() => {
    //                     if (typeof target.rockAnimationOff === 'function') target.rockAnimationOff();
    //                 }, 750);
    //             } else {
    //                 target.wounded = {
    //                     severity: 'minor',
    //                     damage
    //                 };
    //             }
    //             target.hp -= damage;
    //             target.damageIndicators.push(damage);
    //             target.setToFrozen(levelMatrix[iceBlast.level].TC);
    //         }
    //         caller.energy -= 75;
    //         if(caller.energy < 0) caller.energy = 0; 
    //     })
    this.triggerBeamAttackManual = (callerCoords, color = 'purple') => {
        const sourceTileId = this.animationManager.getTileIdByCoords(callerCoords)
        return new Promise((resolve) => {
            this.animationManager.straightBeamNoTarget(sourceTileId, 'left-to-right', color, resolve)
        })
    }
    this.triggerIceBlast = (caller, target) => {
        const callerCoords = caller.coordinates, targetCoords = target.coordinates; // eslint-disable-line no-unused-vars
        // Defensive resolution for ice blast (same rationale as fireBlast)
        const resolveLocalSpecial = (caller, specialKey) => { // eslint-disable-line no-unused-vars
            const key = (specialKey || '').toString();
            const normalized = key.replace(/\s+/g, '_').toLowerCase();
            if (!Array.isArray(caller.specials)) return null;
            for (let s of caller.specials) {
                if (!s) continue;
                if (typeof s === 'string') {
                    const sNorm = s.replace(/\s+/g, '_').toLowerCase();
                    if (s.toLowerCase() === key.toLowerCase() || sNorm === normalized) {
                        if (data && data.methods && typeof data.methods.formatSpecials === 'function') {
                            const expanded = data.methods.formatSpecials([s]);
                            if (Array.isArray(expanded) && expanded[0]) return expanded[0];
                        }
                        return { name: key };
                    }
                } else if (typeof s === 'object') {
                    if (s.name && (s.name.toLowerCase() === key.toLowerCase() || s.name.toLowerCase() === normalized)) return s;
                    if (s.key && s.key.toLowerCase() === normalized) return s;
                }
            }
            if (data && data.methods && typeof data.methods.formatSpecials === 'function') {
                const expanded = data.methods.formatSpecials([normalized]);
                if (Array.isArray(expanded) && expanded[0]) return expanded[0];
            }
            return null;
        }

        let iceBlast = null;
        if (data && data.methods && typeof data.methods.resolveSpecial === 'function') {
            iceBlast = data.methods.resolveSpecial(caller, 'ice blast');
        }
        if (!iceBlast && Array.isArray(caller.specials)) {
            iceBlast = caller.specials.find(s => {
                if (!s) return false;
                if (typeof s === 'string') return s.toLowerCase().includes('ice');
                if (typeof s === 'object' && s.name) return s.name.toLowerCase().includes('ice');
                return false;
            }) || null;
        }
        if (!iceBlast) {
            console.warn('triggerIceBlast: could not resolve ice blast special for', caller && (caller.id || caller.name));
            return;
        }
        if (typeof iceBlast.energy_cost === 'undefined') {
            console.warn('triggerIceBlast: energy_cost missing on resolved iceBlast, falling back to 50', iceBlast);
            iceBlast.energy_cost = 50;
        }
        caller.energy -= iceBlast.energy_cost;
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
        this.animationManager.magicCircle(caller.coordinates, target.coordinates, {
            // fire the hit logic when the circle visual reaches the target
            onComplete: () => {
                try {
                    if (!caller || !target) return;
                    if (typeof this.hitsCombatant === 'function') {
                        try {
                            this.hitsCombatant(caller, target, iceBlast);
                            return;
                        } catch (err) {
                            try {
                                this.hitsCombatant(caller, target);
                                return;
                            } catch (err2) {
                                console.warn('hitsCombatant failed when applying iceBlast, falling back to inline damage', err2);
                            }
                        }
                    }

                    // Inline fallback damage calculation using iceBlast.damage and levelMatrix
                    const level = (iceBlast && (iceBlast.level || iceBlast.lvl)) || 1;
                    const multiplier = (levelMatrix[level] && levelMatrix[level].multiplier) || levelMatrix[1].multiplier;
                    const baseDamage = (iceBlast && (typeof iceBlast.damage === 'number' ? iceBlast.damage : (iceBlast.base_damage || null))) || ((caller && caller.atk) || 1);
                    const r = Math.random();
                    const critical = r * 100 > 80;
                    const damage = Math.round((critical ? baseDamage * multiplier * 3 : baseDamage * multiplier));
                    if (!Array.isArray(target.damageIndicators)) target.damageIndicators = [];
                    const indicatorId = Date.now() + Math.random();
                    const indicatorObj = { id: indicatorId, value: damage, source: caller?.name || 'Wizard' };
                    target.damageIndicators.push(indicatorObj);
                    target.hp -= damage;
                    if (target.hp <= 0) {
                        target.hp = 0;
                        caller.targetId = null;
                        this.targetKilled(target);
                    }
                } catch (err) {
                    console.warn('triggerIceBlast onComplete handler failed', err);
                }
            },
            // halve perTileMs to make fireball/magic visuals faster
            perTileMs: 80
        })


    }
    this.triggerFireBlast = (caller, target) => {
        const callerCoords = caller.coordinates, targetCoords = target.coordinates; // eslint-disable-line no-unused-vars
        // Prefer the centralized resolver when available.
        let fireBlast = null;
        if (data && data.methods && typeof data.methods.resolveSpecial === 'function') {
            fireBlast = data.methods.resolveSpecial(caller, 'fire blast');
        }
        // Fallback: shallow find on caller.specials
        if (!fireBlast && Array.isArray(caller.specials)) {
            fireBlast = caller.specials.find(s => {
                if (!s) return false;
                if (typeof s === 'string') return s.toLowerCase().includes('fire');
                if (typeof s === 'object' && s.name) return s.name.toLowerCase().includes('fire');
                return false;
            }) || null;
        }
        if (!fireBlast) {
            console.warn('triggerFireBlast: could not resolve fire blast special for', caller && (caller.id || caller.name));
            return;
        }
        if (typeof fireBlast.energy_cost === 'undefined') {
            console.warn('triggerFireBlast: energy_cost missing on resolved fireBlast, falling back to 30', fireBlast);
            fireBlast.energy_cost = 30;
        }
        console.log('fireBlast.energy_cost', fireBlast.energy_cost);
        caller.energy -= fireBlast.energy_cost;
        // lvl 1 -> 2 TC, 2x damage
        // lvl 2 -> 2 TC, 2.5x damage
        // lvl 3 -> 3 TC, 3x damage
        // lvl 4 -> 3 TC, 3.5x damage
        // lvl 5 -> 4 TC, 4x damage

        const levelMatrix = {
            1: {TC: 2, multiplier: 2},
            2: {TC: 2, multiplier: 2.5},
            3: {TC: 3, multiplier: 3},
            4: {TC: 3, multiplier: 3.5},
            5: {TC: 4, multiplier: 4},
        }
    this.animationManager.fireball(caller.coordinates, target.coordinates, {
            // when animation reaches the target, invoke hit callback
            onComplete: () => {
        console.log('triggerFireBlast: fireball reached target for', caller && (caller.id || caller.name), 'target', target && (target.id || target.name));
                try {
                    if (!caller || !target) return;
                    // Prefer centralized handler if available. Pass the resolved special so handlers
                    // that support it can use canonical damage/TC/etc.
                    if (typeof this.hitsCombatant === 'function') {
                        // Many callers use hitsCombatant(caller, target). Passing the special as a third
                        // argument is a non-breaking enhancement for handlers that accept it.
                        try {
                            this.hitsCombatant(caller, target, fireBlast);
                            return;
                        } catch (err) {
                            // If the handler doesn't accept the third arg, fall back to two-arg call
                            try {
                                this.hitsCombatant(caller, target);
                                return;
                            } catch (err2) {
                                console.warn('hitsCombatant failed when applying fireBlast, falling back to inline damage', err2);
                            }
                        }
                    }

                    // Fallback: inline damage application using the levelMatrix defined above
                    const level = (fireBlast && (fireBlast.level || fireBlast.lvl)) || 1;
                    const multiplier = (levelMatrix[level] && levelMatrix[level].multiplier) || levelMatrix[1].multiplier;
                    // Prefer canonical damage from the special definition. Fall back to caller.atk if missing.
                    const baseDamage = (fireBlast && (typeof fireBlast.damage === 'number' ? fireBlast.damage : (fireBlast.base_damage || null))) || ((caller && caller.atk) || 1);
                    const r = Math.random();
                    const critical = r * 100 > 80;
                    const damage = Math.round((critical ? baseDamage * multiplier * 3 : baseDamage * multiplier));
                    if (!Array.isArray(target.damageIndicators)) target.damageIndicators = [];
                    const indicatorId = Date.now() + Math.random();
                    const indicatorObj = { id: indicatorId, value: damage, source: caller?.name || 'Wizard' };
                    target.damageIndicators.push(indicatorObj);
                    target.hp -= damage;
                    if (target.hp <= 0) {
                        target.hp = 0;
                        caller.targetId = null;
                        this.targetKilled(target);
                    }
                } catch (err) {
                    console.warn('triggerFireBlast onComplete handler failed', err);
                }
            },
            // halve perTileMs to make fireball/magic visuals faster
            perTileMs: 40
        })
    }
    this.initiateAttack = async (caller, manualAttack, combatants) => {
        if(!caller) return
        let target = combatants ? combatants[caller.targetId] : null;
        // Helper: check for any friendly combatant strictly between caller and target on same row
        const friendlyInLineBetween = (caller, target, combatants) => {
            if(!caller || !target || !combatants) return false;
            if (caller.coordinates.y !== target.coordinates.y) return false;
            const y = caller.coordinates.y;
            const startX = Math.min(caller.coordinates.x, target.coordinates.x) + 1;
            const endX = Math.max(caller.coordinates.x, target.coordinates.x) - 1;
            if (startX > endX) return false;
            for (let x = startX; x <= endX; x++) {
                const found = Object.values(combatants).find(e => e && !e.dead && e.coordinates.x === x && e.coordinates.y === y);
                if (found && (!found.isMonster && !found.isMinion)) {
                    return true;
                }
            }
            return false;
        }

        // Helper: find an enemy on the same row that has a clear path (no friendlies between)
        const findEnemyWithClearPath = (caller, combatants, preferDirection = null) => {
            if(!caller || !combatants) return null;
            const y = caller.coordinates.y;
            const enemies = Object.values(combatants).filter(e => e && !e.dead && (e.isMonster || e.isMinion) && e.coordinates.y === y);
            if(enemies.length === 0) return null;
            // Sort by distance from caller
            enemies.sort((a,b) => Math.abs(a.coordinates.x - caller.coordinates.x) - Math.abs(b.coordinates.x - caller.coordinates.x));
            // If preferDirection provided ('left' or 'right'), try those first
            if (preferDirection === 'right') {
                const rightFirst = enemies.filter(e => e.coordinates.x > caller.coordinates.x).sort((a,b)=>a.coordinates.x - b.coordinates.x);
                for (const cand of rightFirst) {
                    const startX = Math.min(caller.coordinates.x, cand.coordinates.x) + 1;
                    const endX = Math.max(caller.coordinates.x, cand.coordinates.x) - 1;
                    let blocked = false;
                    for (let x = startX; x <= endX; x++) {
                        const found = Object.values(combatants).find(c => c && !c.dead && c.coordinates.x === x && c.coordinates.y === y);
                        if (found && (!found.isMonster && !found.isMinion)) { blocked = true; break; }
                    }
                    if (!blocked) return cand;
                }
            } else if (preferDirection === 'left') {
                const leftFirst = enemies.filter(e => e.coordinates.x < caller.coordinates.x).sort((a,b)=>b.coordinates.x - a.coordinates.x);
                for (const cand of leftFirst) {
                    const startX = Math.min(caller.coordinates.x, cand.coordinates.x) + 1;
                    const endX = Math.max(caller.coordinates.x, cand.coordinates.x) - 1;
                    let blocked = false;
                    for (let x = startX; x <= endX; x++) {
                        const found = Object.values(combatants).find(c => c && !c.dead && c.coordinates.x === x && c.coordinates.y === y);
                        if (found && (!found.isMonster && !found.isMinion)) { blocked = true; break; }
                    }
                    if (!blocked) return cand;
                }
            }
            // Fallback: any enemy with clear path
            for (const cand of enemies) {
                const startX = Math.min(caller.coordinates.x, cand.coordinates.x) + 1;
                const endX = Math.max(caller.coordinates.x, cand.coordinates.x) - 1;
                let blocked = false;
                for (let x = startX; x <= endX; x++) {
                    const found = Object.values(combatants).find(c => c && !c.dead && c.coordinates.x === x && c.coordinates.y === y);
                    if (found && (!found.isMonster && !found.isMinion)) { blocked = true; break; }
                }
                if (!blocked) return cand;
            }
            return null;
        }
        if(manualAttack){
            if(caller.pendingAttack && caller.pendingAttack.cooldown_position < 99){
                console.log('pending attack not charged fully');
                return
            } else if (caller.pendingAttack && caller.pendingAttack.cooldown_position === 100){
                // For manual beam attacks, check the line of fire along the wizard's facing for any friendlies
                if (combatants) {
                    const facing = caller.facing || 'right';
                    // If there's a friendly in the direct beam path, try to find another enemy in the lane with a clear path
                    const firstEnemyClear = findEnemyWithClearPath(caller, combatants, facing === 'right' ? 'right' : 'left');
                    if (!firstEnemyClear) {
                        // no clear enemy in preferred direction; try opposite direction
                        const opposite = facing === 'right' ? 'left' : 'right';
                        const alt = findEnemyWithClearPath(caller, combatants, opposite);
                        if (alt) {
                            // Fire beam towards alt enemy
                            let combatantHit = await this.triggerBeamAttack(caller.coordinates, alt.coordinates);
                            if (combatantHit) {
                                try { this.hitsCombatant(caller, combatantHit); } catch (err) { this.hitsCombatant(caller, combatantHit); }
                            } else {
                                this.missesTarget(caller);
                            }
                            this.kickoffAttackCooldown(caller);
                            return;
                        }
                        // No valid alternative enemy with clear path; treat as miss
                        this.missesTarget(caller);
                        this.kickoffAttackCooldown(caller);
                        return;
                    } else {
                        // There is at least one enemy with a clear path in preferred direction; fire normally (beam will hit first occupant)
                    }
                }
                let combatantHit = await this.triggerBeamAttackManual(caller.coordinates)
                if(combatantHit){
                    // Delegate to centralized hitsCombatant so damage, crits, and animations are consistent
                    try {
                        if (typeof this.hitsCombatant === 'function') {
                            this.hitsCombatant(caller, combatantHit);
                        } else {
                            this.hitsCombatant(caller, combatantHit);
                        }
                    } catch (err) {
                        console.warn('apply beam manual hit error', err);
                        // fallback defensively
                        if (typeof this.hitsCombatant === 'function') this.hitsCombatant(caller, combatantHit);
                    }
                } else {
                    this.missesTarget(caller);
                }
                this.kickoffAttackCooldown(caller)
            }
        } else {
        const distanceToTarget = data.methods.getDistanceToTarget(caller, target), // eslint-disable-line no-unused-vars
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            switch(caller.pendingAttack.name){
                case 'energy blast':
                    if(laneDiff === 0){
                        // If there's any friendly between caster and target on same plane, try to retarget
                        if (friendlyInLineBetween(caller, target, combatants)) {
                            // Prefer enemies in the original direction
                            const preferDir = (target.coordinates.x > caller.coordinates.x) ? 'right' : 'left';
                            const alt = findEnemyWithClearPath(caller, combatants, preferDir);
                            if (alt) {
                                target = alt;
                                caller.targetId = alt.id;
                            } else {
                                // No alternative enemy with a clear path; treat as miss
                                this.missesTarget(caller);
                                this.kickoffAttackCooldown(caller);
                                break;
                            }
                        }
                        let combatantHit  = await this.triggerBeamAttack(caller.coordinates, target.coordinates);
                        if(combatantHit){
                            // Apply unified wounded/damage logic for AI beam hit
                            try {
                                if (typeof this.hitsCombatant === 'function') {
                                    this.hitsCombatant(caller, combatantHit);
                                } else {
                                    this.hitsCombatant(caller, combatantHit);
                                }
                            } catch (err) {
                                console.warn('apply beam AI hit error', err);
                                if (typeof this.hitsCombatant === 'function') this.hitsCombatant(caller, combatantHit);
                            }
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
    
                // break;
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
