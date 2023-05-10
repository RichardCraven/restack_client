// import * as images from '../utils/images'

export function CombatManager(){
    // this.current
    const attackTypes = [
        'psionic', 'crushing', 'cutting', 'electricity', 'fire', 'blood_magic', 'ice', 'curse', 'sickness', 'arcane', 'buff',
        'holy', 
    ]
    const attacksMatrix = {
        claws: {
            type: 'cutting',
            range: 'close'
        },
        bite: {
            type: 'cutting',
            range: 'close'
        },
        crush: {
            type: 'crushing',
            range: 'close'
        },
        tackle: {
            type: 'crushing',
            range: 'close'
        },
        grasp: {
            type: 'crushing',
            range: 'close'
        },
        energy_drain: {
            type: 'curse',
            range: 'medium'
        },
        fire_breath: {
            type: 'fire',
            range: 'medium'
        },
        void_lance: {
            type: 'psionic',
            range: 'medium'
        },
        magic_missile: {
            type: 'arcane',
            range: 'far'
        },
        induce_madness: {
            type: 'psionic',
            range: 'far'
        },
        lightning: {
            type: 'electricity',
            range: 'far'
        },
        sword_swing: {
            type: 'cutting',
            range: 'close'
        },
        sword_thrust: {
            type: 'cutting',
            range: 'close'
        },
        dragon_punch: {
            type: 'crushing',
            range: 'close'
        },
        meditate: {
            type: 'buff',
            range: 'close'
        },
        fire_arrow: {
            type: 'fire',
            range: 'far'
        },
        axe_throw: {
            type: 'cutting',
            range: 'medium'
        },
        axe_swing: {
            type: 'cutting',
            range: 'close'
        },
        spear_throw: {
            type: 'cutting',
            range: 'far'
        },
        flying_lotus: {
            type: 'crushing',
            range: 'medium'
        },
        shield_bash: {
            type: 'crushing',
            range: 'close'
        }
    }
    
    this.data = null;
    this.intervalReference = null;
    this.combatOver = false;

    this.initialize = () => {
        this.data = null;
        this.intervalReference = null;
        this.combatOver = false;
    }

    this.combatants = {};

    this.establishMessageCallback = (cb) => {
        this.setMessage = cb;
    }
    this.establishUpdateMatrixCallback = (cb) => {
        this.updateIndicatorsMatrix = cb;
    }
    this.establishUpdateActorCallback = (cb) => {
        this.updateActor = cb
    }
    this.establishUpdateDataCallback = (cb) => {
        this.updateData = cb
    }
    this.establishGameOverCallback = (cb) => {
        this.gameOver = cb
    }

    //factory functions
    function createFighter(fighter, callbacks, ) {
        const {acquireTarget, broadcastDataUpdate, pickRandom, hitsTarget, missesTarget, isCombatOver, getTarget} = callbacks;
        return {
            name: fighter.name,
            id: fighter.id,
            level: fighter.level,
            hp: fighter.stats.hp,
            energy: 1,
            tempo: 1,
            atk: fighter.stats.atk,
            stats: {
                str: fighter.stats.str,
                vit: fighter.stats.vit,
                fort: fighter.stats.fort,
                dex: fighter.stats.dex,
                vit: fighter.stats.vit,
                int: fighter.stats.int
            },
            inventory: fighter.inventory,
            specials: fighter.specials,
            weaknesses: fighter.weaknesses,
            nextTargetId: null,
            position: fighter.position,
            depth: fighter.depth,
            wounded: false,
            active: false,
            pendingAttack: null,
            attacking: false,
            attacks: fighter.attacks,
            talk: function () {
                console.log('My name is ' 
                + fighter.name + '!');
            },
            attack: function () {
                let connects = pickRandom([true, false])
                this.active = true;
                this.attacking = true;
                if(connects){
                    hitsTarget(this)
                } else {
                    missesTarget(this)
                }
                broadcastDataUpdate(this)
            },
            turnCycle: function(){
                let count = 0;
                let factor = (1/this.stats.dex * 25)
                let timeToFill = factor * 1000;
                let increment = (1 / factor)
                // let increment = Math.floor(10);
                //     if(this.level > 5) increment = 15
                //     if(this.level > 10) increment = 20
                //     if(this.level > 15) increment = 25
                //     if(this.level > 20) increment = 30
                
                

                /// monster target offsets monster by 110 * target index
                
                let interval = setInterval(()=>{
                    count += increment
                    
                    this.tempo = Math.floor((count/100)*100);

                    if(isCombatOver() || this.dead) clearInterval(interval)
                    if(count > 10 && this.nextTargetId === null){
                        // callbacks['acquireTargetCallback'](this);
                        acquireTarget(this);
                    }
                    if(count >= 100){
                        let target = getTarget(this.nextTargetId)
                        // if(this.isMonster){
                            this.attack(target)
                        // }
                        clearInterval(interval)
                    }
                    // callbacks['acquireTargetCallback'](this);
                    broadcastDataUpdate(this)
                }, 10)
            }
        };
    }

    this.getTarget = (id) => {
        return Object.values(this.combatants).find(e=> e.id === id)
    }


    this.broadcastDataUpdate = (caller) => {
        this.updateData(this.combatants)
    }
    this.chooseAttackType = (caller, target) => {
        return this.pickRandom(caller.attacks)
    }
    this.acquireTarget = (caller) => {
        const factor = caller.isMonster ? 100 : 100
        const getDistanceToTarget = (caller, target) => {
            let callerDepth, targetDepth;
            if(caller.isMonster || caller.isMinion){
                callerDepth = (caller.depth+1) * factor;
                targetDepth = (target.depth+1) * 100;
            } else {
                callerDepth = (caller.depth+1) * 100;
                targetDepth = (target.depth+1) * factor;
            }
            return callerDepth + targetDepth;
        }
        let target;
        if(caller.isMonster || caller.isMinion){
            target = this.pickRandom(Object.values(this.combatants).filter(e=> (!e.isMonster && !e.dead)))
            let sorted = Object.values(this.combatants).filter(e=> (!e.isMonster && !e.dead)).sort((a,b)=>b.depth - a.depth)
            target = sorted[0]
            if(!target){
                console.log('NO MORE TARGETS FOR MONSTER!')
                this.combatOver = true;
                return
            }
            let position = target.position
            caller.position = position;

        } else{
            target = this.pickRandom(Object.values(this.combatants).filter(e=> (e.isMonster  && !e.dead)))
            if(!target){
                console.log('NO MORE TARGETS FOR FIGHTER!')
                this.combatOver = true;
                return
            }
            let teamates = Object.values(this.combatants).filter(e=> !e.isMonster && e.id !== caller.id);
            let position = target.position;
            const oldPosition = caller.position;
            caller.position = position;
            teamates.forEach((e)=>{
                if(e.position === caller.position){
                    let goDown = this.pickRandom([true,false])
                    let availableSlot = goDown ? caller.position + 1 : caller.position - 1;
                    let slotFound = false;
                    while(!slotFound && availableSlot ){
                        if(teamates.some(t=>t.position === availableSlot)){
                            if(goDown){
                                availableSlot++
                            } else if(!goDown){
                                availableSlot--
                            }
                        } else {
                            slotFound = true;
                        }
                    }
                    if(availableSlot < 0 || availableSlot > 4) availableSlot = oldPosition;
                    e.position = availableSlot;
                }
            })
            // targetIndex = Object.values(this.combatants).filter(e=> e.isMonster).indexOf(target)
        }

        let attack = this.chooseAttackType(caller, target)
        caller.pendingAttack = attacksMatrix[attack];
        let distanceToTarget = getDistanceToTarget(caller, target);
        if(attacksMatrix[attack].range === 'close' && distanceToTarget < 500){
            while(distanceToTarget < 550){
                caller.depth++
                distanceToTarget = getDistanceToTarget(caller, target);
            }
        }
        caller.distanceToTarget = `calc(100% - ${distanceToTarget}px)`
        caller.nextTargetId = target.id;
    }
    this.initiateAttack = (id) => {
        let combatant = this.combatants[id];
        if(combatant.tempo === 100 && !combatant.dead){
            combatant.attack()
        }
    }
    this.hitsTarget = (caller) => {
        let target = this.getTarget(caller.nextTargetId);
        if(!target) return
        target.wounded = true;
        let damage = caller.atk;
        if(target.weaknesses.includes[caller.pendingAttack.type]){
            console.log('weakness exploited! extra damage!!!', caller,'vs', target)
            damage += Math.floor(damage/2)
        }
        target.hp -= damage;
        caller.energy += caller.stats.fort * 3 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        if(target.hp <= 0){
            target.hp = 0;
            this.targetKilled(target)
        }
        if(target.depth > 0) target.depth--
        // caller.tempo = 1;
        setTimeout(()=>{
            caller.active = false;
            caller.attacking = false;
            caller.tempo = 1;
            caller.nextTargetId = null;
            target.wounded = false;
            caller.turnCycle();
        }, 500)
    }
    this.missesTarget = (caller) => {
        // let target = getTarget(caller.nextTargetId)
        setTimeout(()=>{
            caller.active = false;
            caller.attacking = false;
            caller.tempo = 1;
            caller.nextTargetId = null;
            caller.turnCycle();
        }, 500)
    }

    this.targetKilled = (combatant) => {
        combatant.dead = true;
        const allMonstersDead = Object.values(this.combatants).filter(e=>e.isMonster && !e.dead).length === 0;
        const allCrewDead = Object.values(this.combatants).filter(e=>!e.isMonster && !e.dead).length === 0;
        if(allMonstersDead || allCrewDead){
            console.log('COMBAT IS OVER')
            this.combatOver = true;

            setTimeout(()=>{
                this.gameOver();
            }, 6000)
        }
        
    }
    this.combatOverCheck = () => {
        return this.combatOver;
    }
    this.initializeCombat = (data) => {
        const callbacks = {
            broadcastDataUpdate: this.broadcastDataUpdate,
            acquireTarget: this.acquireTarget,
            hitsTarget: this.hitsTarget,
            pickRandom: this.pickRandom,
            missesTarget: this.missesTarget,
            // combatOver: this.combatOver
            isCombatOver: this.combatOverCheck,
            getTarget: this.getTarget
        }
        this.data = data;
        this.combatants = {};
        
        this.data.crew.forEach((e, index) => {
            e.position = index;
            e.depth = 0;
            if(e.name === 'Ulaf'){
                e.stats.hp = 500
            }
            if(e.name === 'Yu'){
                e.stats.hp = 100
            }
            this.combatants[e.id] = createFighter(e, callbacks);
        })
        this.data.monster.position = 0;
        this.data.monster.depth = 0;
        // if(this.data.monster.closeRange)

        let monster = createFighter(this.data.monster, callbacks);
        monster.isMonster = true;

        // let minions = [];
        // monions.forEach(m=>{
        //     m.isMinion = true;
        // })

        this.combatants[monster.id] = monster;
        this.broadcastDataUpdate();
        Object.values(this.combatants).forEach((combatant)=>{
            combatant.turnCycle();
        })
    }
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }

    this.delay = (numSeconds) => {
        return new Promise((resolve) => {
            setTimeout(()=>{
                resolve(numSeconds, ' complete')
            }, numSeconds * 1000)
        })
    }

    this.triggerMonsterGreeting = () => {
        return new Promise((resolve, reject) => {
            this.delay(0.5).then(()=>{
                this.setMessage({message: this.data.monster.greetings[0], source: 'monster'})
                this.delay(2).then(()=>{
                    this.setMessage({message: '', source: null})
                        this.delay(0.5).then(()=>{
                            resolve()
                        })
                })
            })
        })
    }

    this.triggerFighterGreeting = () => {
        return new Promise((resolve)=>{
            this.setMessage({message: 'Die, foul beast!', source: 'fighter-leader'})
            this.delay(2).then(()=>{
                this.setMessage({message: '', source: null})
                resolve()
            })
        })
    }



}