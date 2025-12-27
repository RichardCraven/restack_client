export function createFighter(fighter, callbacks, FIGHT_INTERVAL) {
    const {
        acquireTarget, 
        chooseAttackType,
        broadcastDataUpdate, 
        // pickRandom, 
        // hitsTarget, 
        // missesTarget, 
        isCombatOver, 
        getCombatant,
        // combatPaused,
        formatAttacks,
        formatSpecials,
        initiateAttack,
        checkOverlap,
        handleOverlap,
        // goToDestination,
        processActionQueue,
        processMove,
        targetInRange,
        getSelectedFighter
    } = callbacks;
    // Determine initial facing: right for fighters, left for monsters/minions
    let initialFacing = 'right';
    console.log('fighter in createFighter: ', fighter);
    if (fighter.isMonster || fighter.isMinion) {
        console.log('*****fighter: ', fighter);
        initialFacing = 'left';
    }
    return {
        name: fighter.name,
        type: fighter.type,
        combatStyle: fighter.combatStyle,
        id: fighter.id,
        portrait: fighter.portrait,
        level: fighter.level,
        hp: fighter.stats.hp,
        starting_hp: fighter.stats.hp,
        energy: 100,
        tempo: 1,
        atk: fighter.stats.atk,
        stats: {
            str: fighter.stats.str,
            vit: fighter.stats.vit,
            fort: fighter.stats.fort,
            dex: fighter.stats.dex,
            int: fighter.stats.int,
            baseDef: fighter.stats.baseDef,
            hp: fighter.stats.hp,
            atk: fighter.stats.atk
        },
        inventory: fighter.inventory,
        weaknesses: fighter.weaknesses,
        targetId: null,
        position: fighter.coordinates.y,
        depth: fighter.coordinates.x,
        active: false,
        pendingAttack: null,
        aiming: false,
        attacking: false,
        attackingReverse: false,
        healing: false,
        missed: false,
        attacks: formatAttacks(fighter.attacks),
        specials: formatSpecials(fighter.specials),
        specialActions: fighter.specialActions,
        targettedBy: [],
        combatPaused: false,
        readout: {action:'', result: ''},
        // readout: '',
        hasOverlap: false,
        coordinates: fighter.coordinates,
        destinationCoordinates: null,
        destinationSickness: false,
        action_queue: [],
        turnSkips: 0,
        isOnManualMoveCooldown: false,
        manualCount: 0,
        timeAhead: null,
        damageIndicators: [],
        manualMovesTotal: fighter.manualMovesTotal,
        manualMovesCurrent: fighter.manualMovesCurrent,
        frozenPoints: 0,
        targetAcquired: null,
        movesPerTurnCycle: fighter.stats.dex * 2,
        movesLeft: 0,
        moveCooldown: 1/fighter.dex * 5000, // Higher dex = lower cooldown
        eras: [
            {
                moved: false,
                attacked: false
            },
            {
                moved: false,
                attacked: false
            },
            {
                moved: false,
                attacked: false
            },
            {
                moved: false,
                attacked: false
            },
            {
                moved: false,
                attacked: false
            }
        ],
        eraIndex: null,
        behaviorSequence: '',
        wounded: false,
        onGeneralAttackCooldown: false,
        onMoveCooldown: false,
        color: fighter.color,
        facing: initialFacing, // persistent facing property
        attack: function(){
            const target = getCombatant(this.targetId);
            if(!target) return
            if(!target){
                this.skip();
                return
            }
            initiateAttack(this);
        },
        manualAttack: function(){
            this.manualMovesCurrent-= 2
            initiateAttack(this, true);
        },
        manualMoveCooldown: function(){
            function addSeconds(date, seconds) {
                date.setSeconds(date.getSeconds() + seconds);
                return date;
            }
            const now = new Date();
            const newDate = addSeconds(now, 1).getTime();
            this.timeAhead = newDate;
            
            this.isOnManualMoveCooldown = true;
            let interval = setTimeout(()=>{
                let now = new Date() 
                let time = now.getTime();
                if(time > this.timeAhead){
                    this.isOnManualMoveCooldown = false;
                    clearInterval(interval)
                }
            },1000)
        },
        skip: function(){
            this.active = false;
            this.attacking = this.attackingReverse = false;
            this.tempo = 1;
            this.turnCycle();
        },
        move: function(){
            //only ever triggered from turn cycle AI method
            
            processMove(this);
        },
        setToFrozen: function(val){
            this.frozen = true;
            this.wounded = false;
            this.frozenPoints += val
        },
        turnCycle: function(){
            let count = 0,
            hasMoved = false, hasMovedSecondTime = false;
            let factor = (1/this.stats.dex * 25)
            let increment = (1 / factor)
            if(this.hasOverlap) handleOverlap(this)

            this.movesLeft = this.movesPerTurnCycle;
            
            this.interval = setInterval(()=>{
                if(this.combatPaused || this.dead || this.locked) return
                if(this.isOnManualMoveCooldown){
                    if(this.tempo > 100) this.tempo = 100;
                    broadcastDataUpdate(this)
                    return
                }
                
                this.manualMovesCurrent += this.manualMovesTotal/2000
                if(this.manualMovesCurrent > this.manualMovesTotal) this.manualMovesCurrent = this.manualMovesTotal
                
                if(getSelectedFighter() && this.type === getSelectedFighter().type){
                    if(!this.pendingAttack){
                        acquireTarget(this);
                    }
                    broadcastDataUpdate(this)
                    return
                }
                count += increment;
                if(this.frozen){
                    debugger
                    this.tempo = Math.floor((count/100)*100);
                    if(count >= 100){
                        this.frozenPoints--
                        if(this.frozenPoints <= 0){
                            this.frozenPoints = 0;
                            this.frozen =  false;
                        }
                        clearInterval(this.interval)
                        this.turnSkips = 0;
                        this.tempo = 1
                        this.turnCycle();
                    }
                    broadcastDataUpdate()
                    return
                }
                this.tempo = Math.floor((count/100)*100);
                if(this.tempo < 1) return;

                if(isCombatOver() || this.dead){
                    clearInterval(this.interval)
                    return
                }
                // ------------------------------------------------------------------------------------------------------------------
                // posiibilities:
                // this.aiming = false;
                // acquireTarget(this);
                // checkOverlap(this)
                // this.move();
                // this.aiming = true;
                // clearInterval(this.interval)
                // this.skip();
                // processActionQueue(this);
                // const target = getCombatant(this.targetId);
                // let inRange = targetInRange(this);
                // this.attack(target)
                // this.waitForAttack()
                // this.turnSkips++
                // acquireTarget(this, target);  <--- this is to avoid the current target, find another one. Useful if target is out of range
                // this.turnSkips = 0;
                // this.tempo = 1
                // this.turnCycle();


                
                // ------------------------------------------------------------------------------------------------------------------
                // era 1 = 1-20
                // era 2 = 21-40
                // era 3 = 41-60
                // era 4 = 61-80
                // era 5 = 81-100
                let target, inRange;
                const eraIndex = this.tempo < 21 ? 0 :
                (this.tempo < 41 ? 1 :
                (this.tempo < 61 ? 2 :
                (this.tempo < 81 ? 3 :
                (this.tempo < 101 ? 4 : 0))))
                const era = this.eras[eraIndex]
                this.eraIndex = eraIndex;

                const eraMove = () => {
                    if(this.movesLeft && !era.moved && !this.onMoveCooldown){
                        era.moved = true;
                        this.movesLeft--
                        this.move()
                    }
                }
                const eraAttack = () => {
                    if(!this.targetId) acquireTarget(this);
                    target = getCombatant(this.targetId)
                    if(!this.pendingAttack) chooseAttackType(this, target)
                    inRange = targetInRange(this);
                    if(inRange && this.movesLeft && !era.attacked && !this.onGeneralAttackCooldown && !this.onMoveCooldown){
                        era.attacked = true;
                        this.movesLeft--
                        this.attack(target);
                    }
                }
                // let target;
                switch(eraIndex){
                    case 0: 
                        if(!this.targetId) acquireTarget(this);
                        eraMove();
                        if(this.tempo > 10){
                            
                            eraAttack();
                        }
                    break;
                    case 1: 
                        eraMove();
                        
                        eraAttack();
                    break;
                    case 2: 
                        eraMove();
                        
                        eraAttack();
                    break;
                    case 3: 
                        eraMove();
                        
                        eraAttack();
                    break;
                    case 4: 
                        eraMove();
                        
                        eraAttack();
                    break;
                }
                if(this.tempo >= 100){
                    this.restartTurnCycle();
                }
                broadcastDataUpdate(this)
            }, this.FIGHT_INTERVAL)
        },
        restartTurnCycle: function(){
            clearInterval(this.interval)
            this.tempo = 0;
            this.movesLeft = this.movesPerTurnCycle;
            this.eras.forEach(e=>e.moved = e.attacked = false)
            this.pendingAttack = null;
            this.turnCycle();
        },
        waitForAttack: function(){
            // this.aiming = true;
            const waitInterval = setInterval(()=>{
                if(this.type === 'djinn'){
                    console.log('in WAIT block');
                }
                if(this.pendingAttack.cooldown_position === 100){
                    if(this.type === 'djinn'){
                        console.log('in ATTACK block');
                    }
                    const target = getCombatant(this.targetId)
                    this.attack(target)
                    clearInterval(waitInterval)
                }
            }, 500)
        },
        rockAnimationOn : function(){
            this.rocked = true;
        },
        rockAnimationOff : function(){
            this.rocked = false;
        },
        lock: function(){
            this.locked = true;
        },
        unlock: function(){
            this.locked = false;
        },
        // Allow updating the fighter's interval dynamically
        setFightInterval: function(newInterval) {
            console.log('setFighterInterval called with: ', newInterval, 'for ', this.type, 'this.interval identifier: ', this.interval, 'current this.FIGHT_INTERVAL: ', this.FIGHT_INTERVAL  );
            this.FIGHT_INTERVAL = newInterval;
            // If a turn cycle is running, restart it with the new interval
            if (this.interval) {
                clearInterval(this.interval);
                this.restartTurnCycle();
            }
        }
    };
}