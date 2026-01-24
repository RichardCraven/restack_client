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
    this.useSpell = (caller, combatants) => {
        console.log('USE SPELL', caller);
        // const getGlyph = () => {

        // }
        // console.log('caller.specialActions: ', caller.specialActions);
        // debugger

        // Find a spell of subtype 'magic missile'
        const magicMissile = caller.specialActions && caller.specialActions.find(
            a => a.type === 'spell' && a.subtype === 'magic missile' && a.cooldown_position === 100
        );
        console.log('magic missile: ', magicMissile, 'cooldown: ', magicMissile ? magicMissile.cooldown_position : 'N/A');
        const magicMissileAvailable = magicMissile && (magicMissile.cooldown_position === 100) && caller.energy > 33
        if (magicMissileAvailable) {
            // Acquire a target (closest enemy)
            const liveEnemies = Object.values(combatants).filter(e => !e.dead && (e.isMonster || e.isMinion));
            if (liveEnemies.length > 0) {
                // Sort by distance
                const getDist = (a, b) => Math.sqrt(Math.pow(a.coordinates.x - b.coordinates.x, 2) + Math.pow(a.coordinates.y - b.coordinates.y, 2));
                const target = liveEnemies.sort((a, b) => getDist(a, caller) - getDist(b, caller))[0];
                // Use MonsterBattle's fireSpecialForAI if available
                if (this.monsterBattleRef && typeof this.monsterBattleRef.fireSpecialForAI === 'function') {
                    caller.targetId = target.id;
                    this.monsterBattleRef.fireSpecialForAI(caller, magicMissile);
                } else if (this.useSpellMagicMissile) {
                    this.useSpellMagicMissile(caller, target, magicMissile);
                } else {
                    console.log('about to TREIGGER magic missile, this.monsterBattleRef: ', this.monsterBattleRef);
                    caller.specialActions = caller.specialActions.filter(a => a !== magicMissile)
                    // notify host/owner that caller data changed so UI can re-render
                    if (typeof this.broadcastDataUpdate === 'function') {
                        try {
                            this.broadcastDataUpdate(caller);
                        } catch (e) {
                            try { this.broadcastDataUpdate(); } catch (e2) { /* ignore */ }
                        }
                    }
                    // Additionally, if a MonsterBattle ref is wired in, call its
                    // update hook so the component can reconcile the change and
                    // refresh the interaction pane count directly.
                    if (this.monsterBattleRef && typeof this.monsterBattleRef.applyFighterUpdate === 'function') {
                        try {
                            this.monsterBattleRef.applyFighterUpdate(caller);
                        } catch (err) {
                            console.warn('monsterBattleRef.applyFighterUpdate failed', err);
                        }
                    }
                    caller.energy -= 50;
                    this.triggerMagicMissile(caller, target, 1500);
                    console.log('now speical actions: ', caller.specialActions);
                }
                // magicMissile.cooldown_position = magicMissile.cooldown || 3;
                // console.log('spell available');
                return true;
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
            switch(special.name){
                case "ice blast":
                    this.triggerIceBlast(caller, target);
                    
                break;
                case "fire blast":
                    this.triggerFireBlast(caller, target);
                break;
            }
        }
        return false;
    }
    this.processMove = (caller, combatants) => {
        if (typeof caller.moveCooldown === 'undefined') {
            debugger;
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
                spells = caller.specialActions && caller.specialActions.filter(action => action.type === 'spell'),
                spellAvailable = caller.specialActions && caller.specialActions.find(action => action.type === 'spell' && action.available);
                // debugger
                

                const magicMissile = caller.specialActions && caller.specialActions.find(
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
                    target.damageIndicators.push(damage);
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
        const callerCoords = caller.coordinates, targetCoords = target.coordinates;
        // Defensive resolution for ice blast (same rationale as fireBlast)
        const resolveLocalSpecial = (caller, specialKey) => {
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
                    target.damageIndicators.push(damage);
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
            perTileMs: 80
        })


    }
    this.triggerFireBlast = (caller, target) => {
        const callerCoords = caller.coordinates, targetCoords = target.coordinates;
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
                    target.damageIndicators.push(damage);
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
            perTileMs: 80
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
            const distanceToTarget = data.methods.getDistanceToTarget(caller, target),
            laneDiff = data.methods.getLaneDifferenceToTarget(caller, target);
            switch(caller.pendingAttack.name){
                case 'energy blast':
                    if(laneDiff === 0){
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
