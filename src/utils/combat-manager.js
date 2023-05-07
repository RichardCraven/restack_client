// import * as images from '../utils/images'

export function CombatManager(){
    // this.current
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
            wounded: false,
            active: false,
            attacking: false,
            talk: function () {
                console.log('My name is ' 
                + fighter.name + '!');
            },
            attack: function () {
                let connects = pickRandom([true, false])
                this.active = true;
                this.attacking = true;
                // console.log(this.name, 'attacks ', target.name, `, and ${connects ? 'hits' : 'misses'}!`)
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
                    if(count > 50 && this.nextTargetId === null){
                        // callbacks['acquireTargetCallback'](this);
                        acquireTarget(this);
                    }
                    if(count >= 100){
                        let target = getTarget(this.nextTargetId)
                        if(this.isMonster){
                            this.attack(target)
                        }
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
    this.acquireTarget = (caller) => {
        let target;
        if(caller.isMonster){
            target = this.pickRandom(Object.values(this.combatants).filter(e=> (!e.isMonster && !e.dead)))
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
            // targetIndex = Object.values(this.combatants).filter(e=> e.isMonster).indexOf(target)
        }
        // caller.nextTargetId = {target, targetIndex};
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
        target.hp -= caller.atk;
        caller.energy += caller.stats.fort * 3 + (1/2 * caller.level);
        if(caller.energy > 100) caller.energy = 100;
        if(target.hp <= 0){
            target.hp = 0;
            this.targetKilled(target)
        }
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
        console.log('initializing for data:', this.data)
        this.data.crew.forEach((e, index) => {
            e.position = index;
            this.combatants[e.id] = createFighter(e, callbacks);
        })
        this.data.monster.position = 0;
        let monster = createFighter(this.data.monster, callbacks);
        monster.isMonster = true;
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