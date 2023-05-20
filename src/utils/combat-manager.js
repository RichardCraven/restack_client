// import * as images from '../utils/images'

export function CombatManager(){
    // const attackTypes = [
    //     'psionic', 'crushing', 'cutting', 'electricity', 'fire', 'blood_magic', 'ice', 'curse', 'sickness', 'arcane', 'buff',
    //     'holy', 
    // ]
    this.combatPaused = false;
    this.pauseCombat = (val) => {
        console.log('PAUSE COMBAT')
        this.combatPaused = val
        Object.values(this.combatants).forEach(e=>e.combatPaused = val)
    }
    this.attacksMatrix = {
        claws: {
            name: 'claws',
            type: 'cutting',
            range: 'close',
            cooldown: 3,
            damage: 2
        },
        bite: {
            name: 'bite',
            type: 'cutting',
            range: 'close',
            cooldown: 3,
            damage: 2
        },
        crush: {
            name: 'crush',
            type: 'crushing',
            range: 'close',
            cooldown: 5,
            damage: 3
        },
        tackle: {
            name: 'tackle',
            type: 'crushing',
            range: 'close',
            cooldown: 5,
            damage: 2
        },
        grasp: {
            name: 'grasp',
            type: 'crushing',
            range: 'close',
            cooldown: 6,
            damage: 2
        },
        energy_drain: {
            name: 'energy drain',
            type: 'curse',
            range: 'medium',
            cooldown: 6,
            damage: 2
        },
        fire_breath: {
            name: 'fire breath',
            type: 'fire',
            range: 'medium',
            cooldown: 6,
            damage: 4
        },
        void_lance: {
            name: 'void lance',
            type: 'psionic',
            range: 'medium',
            cooldown: 6,
            damage: 6
        },
        magic_missile: {
            name: 'magic missile',
            type: 'arcane',
            range: 'far',
            cooldown: 5,
            damage: 3
        },
        induce_madness: {
            name: 'induce weakness',
            type: 'psionic',
            range: 'far',
            cooldown: 5,
            damage: 0
        },
        lightning: {
            name: 'lightning',
            type: 'electricity',
            range: 'far',
            cooldown: 6,
            damage: 5
        },
        sword_swing: {
            name: 'sword swing',
            type: 'cutting',
            range: 'close',
            icon: 'sword',
            cooldown: 5,
            damage: 3
        },
        sword_thrust: {
            name: 'sword thrust',
            type: 'cutting',
            range: 'close',
            icon: 'sword',
            cooldown: 4.5,
            damage: 2
        },
        dragon_punch: {
            name: 'dragon punch',
            type: 'crushing',
            range: 'close',
            icon: 'scepter',
            cooldown: 5,
            damage: 3
        },
        meditate: {
            name: 'meditate',
            type: 'buff',
            range: 'close',
            icon: 'scepter',
            cooldown: 5.5,
            damage: 0
        },
        fire_arrow: {
            name: 'fire arrow',
            type: 'fire',
            range: 'far',
            icon: 'scepter',
            cooldown: 5,
            damage: 3
        },
        axe_throw: {
            name: 'axe throw',
            type: 'cutting',
            range: 'medium',
            icon: 'axe',
            cooldown: 5,
            damage: 2
        },
        axe_swing: {
            name: 'axe swing',
            type: 'cutting',
            range: 'close',
            icon: 'axe',
            cooldown: 3.5,
            damage: 3
        },
        spear_throw: {
            name: 'spear throw',
            type: 'cutting',
            range: 'far',
            icon: 'spear',
            cooldown: 3.2,
            damage: 4
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'crushing',
            range: 'medium',
            icon: 'scepter',
            cooldown: 4.5,
            damage: 4
        },
        shield_bash: {
            name: 'shield bash',
            type: 'crushing',
            range: 'close',
            icon: 'basic_shield',
            cooldown: 4.5,
            damage: 2
        },
        cane_strike: {
            name: 'cane strike',
            type: 'crushing',
            range: 'far',
            icon: 'basic_shield',
            cooldown: 3,
            damage: 1
        }
    }

    this.specialsMatrix = {
        deadeye_shot: {
            name: 'deadeye shot',
            type: 'special',
            icon: 'evilai_charm',
            cooldown: 10,
            damage: 10,
            effect: ['damage_single_target'],
        },
        berserker_rage: {
            name: 'berserker rage',
            type: 'special',
            icon: 'demonskull_charm',
            cooldown: 10,
            effect: ['buff_self', 'nerf_self'],
            duration: 18,
            buff: {
                increase_stats: {
                    stats: [
                        {stat: 'str', amount: 5},
                        {stat:'dex',amount:3},
                        {stat: 'atk', amount: 7}
                    ]
                }
            },
            nerf: {
                decrease_stats:{
                    stats: [
                        {stat: 'int', amount: 3}
                    ]
                }
            }
        },
        healing_hymn: {
            name: 'healing hymn',
            type: 'special',
            icon: 'lundi_charm',
            effect: ['buff_all_friendly'],
            buff: {
                heal: {
                    amount: 12 
                }
            },
            cooldown: 12
        },
        reveal_weakness: {
            name: 'reveal weakness',
            type: 'special',
            icon: 'hamsa_charm',
            cooldown: 12,
            effect: ['special'],
            special_instructions: 'reveal all monsters weaknesses'
        },
        flying_lotus: {
            name: 'flying lotus',
            type: 'special',
            icon: 'lundi_charm',
            cooldown: 11,
            damage: 15,
            effect: ['damage_single_target', 'special'],
            special_instructions: 'target has 50% chance to be stunned for 1 sec * $str'
        },
        shield_wall: {
            name: 'shield wall',
            type: 'special',
            icon: 'beetle_charm',
            cooldown: 11,
            effect: ['special'],
            special_instructions: 'shield all members for three hits'
        },
        ice_blast: {
            name: 'ice blast',
            type: 'special',
            icon: 'beetle_charm',
            cooldown: 11,
            damage: 8,
            effect: ['damage_multi_target', 'special'],
            special_instructions: 'each enemy has a 40% chance to be frozen'
        },
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

    this.formatAttacks = (stringArray) => {
        return stringArray.map(e=>{
            return this.attacksMatrix[e]
        })
    }
    this.formatSpecials = (stringArray) => {
        return stringArray.map(e=>{
            return this.specialsMatrix[e]
        })
    }
    //factory functions
    function createFighter(fighter, callbacks, ) {
        const {
            acquireTarget, 
            broadcastDataUpdate, 
            pickRandom, 
            hitsTarget, 
            missesTarget, 
            isCombatOver, 
            getTarget,
            combatPaused,
            formatAttacks,
            formatSpecials,
            initiateAttack
        } = callbacks;
        return {
            name: fighter.name,
            id: fighter.id,
            portrait: fighter.portrait,
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
                int: fighter.stats.int
            },
            inventory: fighter.inventory,
            specials: fighter.specials,
            weaknesses: fighter.weaknesses,
            targetId: null,
            position: fighter.position,
            depth: fighter.depth,
            wounded: false,
            active: false,
            pendingAttack: null,
            attacking: false,
            attacks: formatAttacks(fighter.attacks),
            specials: formatSpecials(fighter.specials),
            targettedBy: [],
            combatPaused: false,
            readout: '',
            talk: function () {
                console.log('My name is ' 
                + fighter.name + '!');
            },
            attack: function () {
                initiateAttack(this);
                broadcastDataUpdate(this)
            },
            turnCycle: function(){
                let count = 0;
                let factor = (1/this.stats.dex * 25)
                // let timeToFill = factor * 1000;
                let increment = (1 / factor)
                // let increment = Math.floor(10);
                //     if(this.level > 5) increment = 15
                //     if(this.level > 10) increment = 20
                //     if(this.level > 15) increment = 25
                //     if(this.level > 20) increment = 30
                
                

                /// monster target offsets monster by 110 * target index
                
                this.interval = setInterval(()=>{
                    if(this.combatPaused) return
                    count += increment
                    
                    this.tempo = Math.floor((count/100)*100);

                    if(isCombatOver() || this.dead) clearInterval(this.interval)
                    if(count > 10 && this.targetId === null){
                        // callbacks['acquireTargetCallback'](this);
                        acquireTarget(this);
                    }
                    if(count >= 100){
                        clearInterval(this.interval)
                        let target = getTarget(this.targetId)
                        // if(this.isMonster){
                            // }
                        if(this.pendingAttack.cooldown_position !== 100){
                            
                        } else {
                            this.attack(target)
                        }
                    }
                    // callbacks['acquireTargetCallback'](this);
                    broadcastDataUpdate(this)
                }, 10)
            },
            waitForAttack: function(){
                const waitInterval = setInterval(()=>{
                    if(this.pendingAttack.cooldown_position === 100){
                        let target = getTarget(this.targetId)
                        this.attack(target)
                        clearInterval(waitInterval)
                    }
                }, 500)
            }
        };
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
            getTarget: this.getTarget,
            formatAttacks: this.formatAttacks,
            formatSpecials: this.formatSpecials,
            initiateAttack: this.initiateAttack
            // combatPaused: this.combatPaused
        }
        this.data = data;
        this.combatants = {};
        
        this.data.crew.forEach((e, index) => {
            e.position = index;
            e.depth = 0;
            // if(e.name === 'Ulaf'){
            //     e.stats.hp = 500
            // }
            // if(e.name === 'Yu'){
            //     e.stats.hp = 100
            // }
            if(e.name === 'Greco'){
                e.stats.hp = 500
                this.combatants[e.id] = createFighter(e, callbacks);
            }
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
        console.log('combatants:', this.combatants)

        Object.values(this.combatants).forEach((combatant)=>{
            combatant.attacks.forEach((a)=>{
                a.cooldown_position = 100
            })
            combatant.turnCycle();
        })
        this.broadcastDataUpdate();
    }

    this.getTarget = (id) => {
        return Object.values(this.combatants).find(e=> e.id === id)
    }


    this.broadcastDataUpdate = (caller) => {
        // if(this.combatPaused) return
        this.updateData(this.combatants)
    }
    this.chooseAttackType = (caller, target) => {
        let attack, available = caller.attacks.filter(e=>e.cooldown_position === 100)
        if(available.length === 0){
            let percentCooledDown = 0,
            chosenAttack;
            caller.attacks.forEach(e=>{
                if(e.cooldown_position > percentCooledDown){
                    percentCooledDown = e.cooldown_position;
                    chosenAttack = e;
                }
            })
            attack = chosenAttack;
        } else {
            attack = this.pickRandom(available);
        }
        return attack
    }
    this.initiateAttack = (caller) => {
        // console.log('caller attacking: ', caller);
        let connects = this.pickRandom([true, false]),
        target = this.combatants[caller.targetId];
        if(!caller.pendingAttack){
            console.log('WHOOA there. someone is trying to attack with nothing');
        }
        caller.active = true;
        caller.attacking = true;
        caller.readout = ` attacks with ${caller.pendingAttack.name}`
        this.kickoffAttackCooldown(caller)
        // if(caller.name === 'Sardonis' || caller.name === 'Greco'){
        //     console.log('pending attack: ', caller.pendingAttack, 'target: ', target)
        // }
        if(connects || this.isMonster){
            this.hitsTarget(caller)
        } else {
            this.missesTarget(caller)
        }
    }
    this.kickoffAttackCooldown = (caller) => {
        const atk = caller.pendingAttack;
        atk['cooldown_position'] = 0;
        // val = atk.cooldown
        let totalTime = atk.cooldown * 1000;
        let scopeVar = 0;
        const intervalRef = setInterval(()=>{
            scopeVar += 100;
            // if(caller.name === 'Greco')console.log('scope var:', scopeVar)
            // if(caller.name === 'Greco') console.log('totalTime:', totalTime)
            // console.log('scopeVar / totalTime:', scopeVar / totalTime)
            let ratio = Math.ceil((scopeVar / totalTime) * 100);

            atk['cooldown_position'] = ratio;
            // if(caller.name === 'Greco')console.log('ratio:', ratio)
            if(ratio >= 100){
                scopeVar = 0;
                clearInterval(intervalRef)
            }
        },100)
    }
    this.getDistanceToTarget = (caller, targetId) => {
        let callerDepth, targetDepth, target = this.combatants[targetId];
        if(!target) return 0;
        const factor = caller.isMonster ? 100 : 100
        if(caller.isMonster || caller.isMinion){
            callerDepth = (caller.depth+1) * factor;
            targetDepth = (target.depth+1) * 100;
        } else {
            callerDepth = (caller.depth+1) * 100;
            targetDepth = (target.depth+1) * factor;
        }
        return callerDepth + targetDepth;
    }
    this.getDistanceToTargetWidthString = (caller) => {
        if(!caller) return '0px'
        let distanceToTarget = this.getDistanceToTarget(caller, caller.targetId),
        isMonster = this.combatants[caller.targetId].isMonster
        // if(caller.name === 'Greco'){
        //     console.log('distanceToTarget: ', distanceToTarget, 'isMonster:', isMonster, 'returning :',`calc(100% - ${distanceToTarget + 100}px)` )
        // }
        // return `calc(100% - ${distanceToTarget + (isMonster ? 200 : 100)}px)`
        return `calc(100% - ${distanceToTarget + 100}px)`
    }
    this.acquireTarget = (caller) => {
        // if(this.combatPaused) return
        
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
                        let reference = availableSlot
                        if(teamates.some(t=>t.position === reference)){
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
        this.clearTargetListById(caller.id)
        target.targettedBy.push(caller.id)

        


        let attack = this.chooseAttackType(caller, target);
        caller.pendingAttack = attack;
        let distanceToTarget = this.getDistanceToTarget(caller, target.id);
        if(caller.name === 'Sardonis' || caller.name === 'Greco'){

            // console.log('attack: ', attack, 'target: ', target, 'caller:', caller)
        }
        if(attack.range === 'close' && distanceToTarget < 550){
            while(distanceToTarget < 600){
                caller.depth++
                distanceToTarget = this.getDistanceToTarget(caller, target.id);
            }
        }
        caller.targetId = target.id;
    }
    this.clearTargetListById = (targetId) => {
        const enemies = Object.values(this.combatants).filter(e=>e.isMonster || e.isMinion )
        enemies.forEach(e=>{
            e.targettedBy = e.targettedBy.filter(id=> id !== targetId)
        })
    }
    // this.initiateAttack = (id) => {
    //     let combatant = this.combatants[id];
    //     if(combatant.tempo === 100 && !combatant.dead){
    //         combatant.attack()
    //     }
    // }
    this.hitsTarget = (caller) => {
        let target = this.getTarget(caller.targetId);
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
        if(target.wounded){
            
            // console.log('target:', target)
        }
        setTimeout(()=>{
            caller.active = false;
            caller.attacking = false;
            caller.tempo = 1;
            caller.targetId = null;
            caller.turnCycle();
        }, 500)
        setTimeout(()=>{
            target.wounded = false;
        }, 1000)
    }
    this.missesTarget = (caller) => {
        // let target = getTarget(caller.targetId)
        setTimeout(()=>{
            caller.active = false;
            caller.attacking = false;
            caller.tempo = 1;
            caller.targetId = null;
            caller.turnCycle();
        }, 500)
    }

    this.targetKilled = (combatant) => {
        combatant.dead = true;
        this.clearTargetListById(combatant.id)

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