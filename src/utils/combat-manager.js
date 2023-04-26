// import * as images from '../utils/images'

export function CombatManager(){
    // this.current
    this.data = null;
    this.intervalReference = null;
    this.combatOver = false;
    this.monsterHp = 0;
    this.establishMessageCallback = (cb) => {
        this.setMessage = cb;
    }
    this.establishUpdateMatrixCallback = (cb) => {
        this.updateIndicatorsMatrix = cb;
    }
    this.establishUpdateActorCallback = (cb) => {
        this.updateActor = cb
    }

    this.initializeCombat = (data) => {
        console.log('initialize combat', data)
        this.data = data;
        this.monsterHp = this.data.monster.stats.hp
        this.data.turnCount = 0;;
        this.data.turns = [];
        this.determineTurnOrder();

        // setTimeout(()=>{
        //     this.beginCombat()
        // }, 1000)
        this.delay(0.5)
        .then(()=>{
        this.triggerMonsterGreeting()
        .then(()=>{
        this.triggerFighterGreeting()
        .then(()=>{
            this.beginCombat();
        })})})
    }
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        console.log('index: ', index)
        return array[index]
    }
    this.uppercaseFirstLetter = (text) => {
        return text.charAt(0).toUpperCase() + text.slice(1);
    }
    this.processTurn = () => {
        let current = this.data.lineup[0],
        // let current = this.data.lineup.find(e=>e.isMonster),
        attack, connects = false, damage;
        
        
        this.data.turnCount++
        console.log('Turn ', this.data.turnCount)
        if(!current.isMonster){
            let target = this.data.lineup.find(e=> e.isMonster),
                level_difference = this.data.monster.level - current.level,
                dex_difference = this.data.monster.stats.dex - current.stats.dex,
                connect_variable = Math.random()*10 + (level_difference / 2) + dex_difference;
                attack = this.pickRandom(current.attacks);
                connects =  connect_variable > 5;
                damage = current.stats.str
                this.updateActor({actor: current, attackType: attack, target})
            this.setMessage({message: `${current.name} attacks with ${attack}!`, source: !!current.leader ? 'fighter-leader' : 'fighter'})
            if(connects){
                console.log('connects for ', damage, ' damage')
                this.delay(1)
                .then(()=>{ 
                    let toUpdate = this.matrix[target.type]
                    toUpdate.hp -= damage;
                    this.updateIndicatorsMatrix(this.matrix)
                    this.setMessage({message: `${current.name} hits for ${damage} damage`, source: !!current.leader ? 'fighter-leader' : 'fighter'}) 
                    this.delay(2)
                    .then(()=> { this.setMessage({message: ``, source: null})})
                })
                this.data.monster.stats.hp-= damage;
                console.log('monster is now at:', this.data.monster.stats.hp)
                if(this.data.monster.stats.hp < 1){
                    console.log('MONSTER IS KILLED')
                    this.combatOver = true;
                }
            }
            // ^ damage will factor in the weapon here ^
        } else if (current.isMonster){
            let target = this.pickRandom(this.data.lineup.filter(e=>!e.isMonster))
            // let target = this.data.lineup.find(e=>e.leader)
            let level_difference = current.level - target.level,
                dex_difference = current.stats.dex - target.stats.dex,
                connect_variable = Math.random()*10 + (level_difference) + dex_difference;
                attack = this.pickRandom(current.attacks);
                connects = connect_variable > 5;
                console.log('monster is targetting ', target)
                console.log('connect_variable: ', connect_variable, 'connects: ', connects)
                damage = current.stats.str
            this.updateActor({actor: current, attackType: attack, target})
            this.setMessage({message: `${this.uppercaseFirstLetter(current.type)} attacks with ${attack}!`, source: 'monster'})
            if(connects){
                console.log('monster connects for ', damage, ' damage')
                this.delay(1)
                .then(()=>{ 
                    let toUpdate = this.matrix[target.type]
                    toUpdate.hp -= damage;
                    this.updateIndicatorsMatrix(this.matrix)
                    this.setMessage({message: `${this.uppercaseFirstLetter(current.type)} hits for ${damage} damage`, source: 'monster'}) 
                    this.delay(2)
                    .then(()=> { this.setMessage({message: ``, source: null})})
                })
                // this.data.monster.stats.hp-= damage;


                // console.log('monster is now at:', this.data.monster.stats.hp)
                if(this.data.lineup.filter(e=>!e.isMonster).some(e=>e.stats.hp < 1)){
                    console.log('CREW IS KILLED')
                    this.combatOver = true;
                }
            } else {
                console.log('monster missed')
                this.delay(1)
                .then(()=>{ 
                    this.setMessage({message: `${current.type} missed!`, source: 'monster'}) 
                    this.delay(2)
                    .then(()=> { this.setMessage({message: ``, source: null})})
                })
            }
        }
        this.data.lineup.push(this.data.lineup.shift())
    }
    this.beginCombat = () => {
        console.log('this.data:', this.data)
        const matrix = {}
        this.data.lineup.forEach(e=>{
            matrix[e.type] =  {
                hp: e.stats.hp,
                energy: 0
            }
        })
        this.matrix = matrix;
        this.updateIndicatorsMatrix(matrix)

        this.processTurn();
        
        this.intervalReference = setInterval(()=>{
            this.processTurn();
            if(this.combatOver) clearInterval(this.intervalReference)
        }, 3000)

        

            

            // console.log('attacks!')

        // }
        // console.log('for')



        // this.data.push(this.data.shift())
    }
    this.determineTurnOrder = () => {
        this.data.monster.isMonster = true;

        console.log('determining turn order...')
        console.log('this.data:', this.data)
        // let lineup = Array.from(this.data.crew);
        // lineup.push(this.data.monster)
        let lineup = this.data.crew.concat(JSON.parse(JSON.stringify(this.data.monster)));
        
        console.log('lineup: ', lineup)
        // this.data.crew.push(this.data.monster)
        lineup = lineup.sort(function(a,b){
            return b.stats.dex - a.stats.dex
        })
        console.log('sorted lineup:', lineup)
        // console.log('monjster dex:', this.data.monster)
        this.data.lineup = lineup
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