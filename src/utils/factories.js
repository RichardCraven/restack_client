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
    checkOverlap: _checkOverlap, // eslint-disable-line no-unused-vars
        handleOverlap,
        // goToDestination,
    processActionQueue: _processActionQueue, // eslint-disable-line no-unused-vars
        processMove,
        targetInRange,
        getSelectedFighter
    } = callbacks;
    // Determine initial facing: right for fighters, left for monsters/minions
    let initialFacing = 'right';
    if (fighter.isMonster || fighter.isMinion) {
        // console.log('*****fighter: ', fighter);
        initialFacing = 'left';
    }
    // Diagnostic instrumentation: if any incoming specialActions carry an unexpected
    // cooldown_position === 3, log them with a stack trace so we can find the creation site.
    try {
        if (fighter.specialActions && fighter.specialActions.some(s => s && s.cooldown_position === 3)) {
            console.warn('createFighter: incoming specialActions with cooldown_position===3 for fighter:', fighter.id || fighter.name, fighter.specialActions.filter(s => s && s.cooldown_position === 3));
            // Print stack to help locate who created/modified these objects at runtime
            console.trace();
        }
    } catch (err) {
        // Non-fatal diagnostic — don't break the game if console access fails
        // console.debug('createFighter diagnostic error', err);
    }
    return {
        name: fighter.name,
        type: fighter.type,
        combatStyle: fighter.combatStyle,
        id: fighter.id,
        portrait: fighter.portrait,
        portraitFilter: fighter.portraitFilter || null,
        level: fighter.level,
    // Use incoming current hp if provided (persisted from DungeonPage), otherwise default to stats.hp
    hp: (typeof fighter.hp === 'number') ? fighter.hp : fighter.stats.hp,
    // starting_hp represents the max HP for the fighter (may be provided or fall back to stats.hp)
    starting_hp: (typeof fighter.starting_hp === 'number') ? fighter.starting_hp : fighter.stats.hp,
        // Minions start with 0 energy so they must earn a full pool before their
        // special abilities (e.g. bifurcate) can fire. Monsters and fighters start
        // with a full pool so their openers are immediately available.
        energy: fighter.isMinion ? 0 : 100,
        tempo: 1,
        atk: fighter.stats.atk,
        stats: {
            str: fighter.stats.str,
            fort: fighter.stats.fort,
            dex: fighter.stats.dex,
            int: fighter.stats.int,
            def: fighter.stats.def,
            hp: fighter.stats.hp,
            atk: fighter.stats.atk,
            // Include derived substats if present (speed/willpower). If not
            // provided, they'll be computed below via fallbacks where needed.
            // Ensure a numeric speed exists for tempo math: prefer explicit speed,
            // fall back to dex if available, otherwise default to 1.
            speed: (typeof fighter.stats.speed === 'number') ? fighter.stats.speed : ((typeof fighter.stats.dex === 'number') ? fighter.stats.dex : 1),
            willpower: (typeof fighter.stats.willpower === 'number') ? fighter.stats.willpower : undefined
        },
    inventory: fighter.inventory,
    dead: !!fighter.dead,
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
    specials: (typeof formatSpecials === 'function') ? formatSpecials(fighter.specials || []) : (fighter.specials || []),
        specialActions: fighter.specialActions, // Now uses flat structure: type, name, iconUrl, subtype, etc.
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
        damageIndicators: [], // Will store objects: { id, value, source }
    manualMovesTotal: fighter.manualMovesTotal,
    manualMovesCurrent: fighter.manualMovesCurrent,
    // New alias fields for broader use: movement points apply to both manual and AI
    movementPointsMax: typeof fighter.manualMovesTotal === 'number' ? fighter.manualMovesTotal : fighter.manualMovesTotal,
    movementPointsCurrent: typeof fighter.manualMovesCurrent === 'number' ? fighter.manualMovesCurrent : fighter.manualMovesCurrent,
        frozenPoints: 0,
        targetAcquired: null,
    // Use dex when available, otherwise fall back to speed (monsters) or 1.
    // Use explicit numeric checks to avoid treating 0/undefined incorrectly.
    movesPerTurnCycle: ( ((typeof fighter.stats.dex === 'number' && fighter.stats.dex > 0) ? fighter.stats.dex : ((typeof fighter.stats.speed === 'number' && fighter.stats.speed > 0) ? fighter.stats.speed : 1)) ) * 2,
        movesLeft: 0,
    // Compute moveCooldown from dex (fighters) or speed (monsters). Default to 1 to avoid NaN.
    moveCooldown: 1 / ( ((typeof fighter.stats.dex === 'number' && fighter.stats.dex > 0) ? fighter.stats.dex : ((typeof fighter.stats.speed === 'number' && fighter.stats.speed > 0) ? fighter.stats.speed : 1)) ) * 5000, // Higher dex/speed = lower cooldown
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
            if(!target) return;
            if(!target){
                this.skip();
                return;
            }
            // Ensure AI attack consumes move points similarly to manual attack
            try {
                const cost = 2; // match manualAttack reduction
                this.manualMovesCurrent = Math.max(0, (this.manualMovesCurrent || 0) - cost);
                this.movementPointsCurrent = Math.max(0, (this.movementPointsCurrent || 0) - cost);
                if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate(this);
            } catch (err) {
                // non-fatal
            }
            // Log attack details for debugging
            if (this.type === 'barbarian') {
                const atk = this.pendingAttack;
                console.log('[Barbarian Attack]', {
                    attackType: atk ? atk.name : 'none',
                    icon: atk ? atk.icon : 'none',
                    attackObj: atk
                });
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
            // AI moves should also consume one manual move point so the
            // manual-moves UI reflects AI actions.
            try {
                const cost = 1;
                this.manualMovesCurrent = Math.max(0, (this.manualMovesCurrent || 0) - cost);
                this.movementPointsCurrent = Math.max(0, (this.movementPointsCurrent || 0) - cost);
                if (typeof broadcastDataUpdate === 'function') broadcastDataUpdate(this);
            } catch (err) {}
            processMove(this);
        },
        setToFrozen: function(val){
            this.frozen = true;
            this.wounded = false;
            this.frozenPoints += val
        },
        turnCycle: function(){
            let count = 0;
            // Use dex when present (crew), otherwise fall back to speed (monsters). Default to 1.
            // Prefer a positive dex value; fall back to a positive speed value; otherwise default to 1
            const effectiveStat = (this.stats && (typeof this.stats.dex === 'number') && this.stats.dex > 0) ? this.stats.dex : ((this.stats && (typeof this.stats.speed === 'number') && this.stats.speed > 0) ? this.stats.speed : 1);
            let factor = (1 / effectiveStat * 25)
            let increment = (1 / factor)
            if(this.hasOverlap) handleOverlap(this)

            this.movesLeft = this.movesPerTurnCycle;
            
            this.interval = setInterval(()=>{
                if(this.combatPaused || this.dead || this.locked || isCombatOver()) return
                if(this.isOnManualMoveCooldown){
                    if(this.tempo > 100) this.tempo = 100;
                    broadcastDataUpdate(this)
                    return
                }
                
                this.manualMovesCurrent += this.manualMovesTotal/2000
                if(this.manualMovesCurrent > this.manualMovesTotal) this.manualMovesCurrent = this.manualMovesTotal
                // mirror into movementPoints
                this.movementPointsCurrent = this.manualMovesCurrent;
                this.movementPointsMax = this.manualMovesTotal;
                
                const _selected = getSelectedFighter && getSelectedFighter();
                // Do not let mere selection of a fighter pause AI. Only when the
                // fighter is both selected AND in manualControl should we short-circuit
                // the AI turn cycle behavior.
                if(_selected && _selected.id === this.id && this.manualControl){
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

                // ── Passive energy regen ───────────────────────────────────
                // Ticks every FIGHT_INTERVAL ms. Regen rate is derived from
                // stats.speed so faster combatants fill their bar quicker.
                // A combatant with speed=10 at the default 40ms interval will
                // reach 100 energy in roughly 20 seconds (matching ~one full
                // turn-cycle duration). Minions start at 0 so this is their
                // only path to triggering energy-gated abilities.
                if (!this.dead && !this.combatPaused) {
                    const speed = (this.stats && typeof this.stats.speed === 'number' && this.stats.speed > 0)
                        ? this.stats.speed
                        : 1;
                    // regenPerTick = speed * 0.02  →  speed-10 unit at 40ms ticks ≈ 20s to fill
                    // beholder_minion gets 3x regen for testing so they can reach 100 energy to bifurcate
                    const regenMult = (this.type === 'beholder_minion') ? 3 : 1;
                    const regenPerTick = speed * 0.02 * regenMult;
                    this.energy = Math.min(100, (this.energy || 0) + regenPerTick);
                }
                // ─────────────────────────────────────────────────────────

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
                    if(this.stunned) return; // stunned: cannot move
                    if(this.movesLeft && !era.moved && !this.onMoveCooldown){
                        // Diagnostic log to help trace when AI attempts to move
                        // (will show in browser console)
                        era.moved = true;
                        this.movesLeft--
                        this.move()
                    }
                }
                const eraAttack = () => {
                    if(this.stunned) return; // stunned: cannot attack
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
                                    // Ensure the chosen attack is assigned to pendingAttack so
                                    // subsequent range checks and initiateAttack have the
                                    // correct context. Previously chooseAttackType was being
                                    // invoked without storing its result, which left
                                    // pendingAttack null and prevented generic monsters
                                    // from ever attacking.
                                    target = getCombatant(this.targetId);
                                    if(!this.pendingAttack && target) this.pendingAttack = chooseAttackType(this, target);
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
                        default:
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

            // ── Tick down era-based effect counters ───────────────────────
            // Stun
            if (this.stunned && this.stunned_eras > 0) {
                this.stunned_eras--;
                if (this.stunned_eras <= 0) {
                    this.stunned = false;
                    this.stunned_eras = 0;
                    // Push immediately so the UI drops the 'stunned' CSS class right away
                    if (typeof broadcastDataUpdate === 'function' && !isCombatOver()) broadcastDataUpdate(this);
                }
            }
            // Fear (halved ATK/DEF applied by induce_fear)
            if (this.feared && this.feared_eras > 0) {
                this.feared_eras--;
                if (this.feared_eras <= 0) {
                    if (this._fearOriginalAtk != null) { this.atk = this._fearOriginalAtk; delete this._fearOriginalAtk; }
                    if (this._fearOriginalDef != null) { this.def = this._fearOriginalDef; delete this._fearOriginalDef; }
                    this.feared = false;
                    this.feared_eras = 0;
                    // Reacquire target after fear ends
                    if (!this.targetId) acquireTarget(this);
                    // Push immediately so the UI drops the 'feared' CSS class right away
                    if (typeof broadcastDataUpdate === 'function' && !isCombatOver()) broadcastDataUpdate(this);
                }
            }
            // Drained (energy drain visual flag)
            if (this.drained && this.drained_eras > 0) {
                this.drained_eras--;
                if (this.drained_eras <= 0) {
                    this.drained = false;
                    this.drained_eras = 0;
                    if (typeof broadcastDataUpdate === 'function' && !isCombatOver()) broadcastDataUpdate(this);
                }
            }
            // ─────────────────────────────────────────────────────────────

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
            this.FIGHT_INTERVAL = newInterval;
            // If a turn cycle is running, restart it with the new interval
            if (this.interval) {
                clearInterval(this.interval);
                this.restartTurnCycle();
            }
        }
    };
}