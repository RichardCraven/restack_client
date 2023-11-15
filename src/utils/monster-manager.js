import * as images from '../utils/images'

export function MonsterManager(){
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.battleMonster = null;
    this.monsters = {
        vampire: {
            type: 'vampire',
            image_names: ['white_vampire', 'black_vampire'],
            monster_names: ['Vukodlak', 'Morias', 'Roterach'],
            stats: {
                str: 7,
                int:7,
                dex:6,
                vit:6,
                fort:6,
                hp: 84,
                atk: 9,
                baseDef: 12
            },
            level: 10,
            portrait: images['vampire_portrait'],
            greetings: ['My hunger sees you'],
            deathCries: ['Peace at last...'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['claws', 'bite'],
            weaknesses: ['arcane', 'holy-aura'],

        },
        ogre: {
            type: 'ogre',
            image_names: ['ogre'],
            monster_names: ['Uggo', 'Tubodu', 'Gumluk'],
            stats: {
                str: 7,
                int:7,
                dex:6,
                vit:6,
                fort:6,
                hp: 52,
                atk: 9,
                baseDef: 11
            },
            level: 8,
            portrait: images['ogre_portrait'],
            greetings: ['Guarkog buzu', 'Mogab burdu'],
            deathCries: ['*gurgle*'],
            specials: ['berserk'],
            attacks: ['crush', 'bite', 'tackle'],
            weaknesses: ['fire', 'psionic']
        },
        wraith: {
            type: 'wraith',
            image_names: ['wraith'],
            monster_names: ['Sicirath', 'Olnuk', 'Ygra'],
            stats: {
                str: 7,
                int:7,
                dex:6,
                vit:6,
                fort:6,
                hp: 42,
                atk: 9,
                baseDef: 8
            },
            level: 8,
            portrait: images['wraith_portrait'],
            greetings: ['*hissssss*', 'come to the silence'],
            deathCries: ['*screams*'],
            specials: ['banshee wail'],
            attacks: ['grasp', 'energy_drain'],
            weaknesses: ['holy', 'psionic']
        },
        dragon: {
            type: 'dragon',
            image_names: ['dragon'],
            monster_names: ['Theraxes', 'Daedron', 'Kykerod'],
            stats: {
                str: 10,
                int:9,
                dex:7,
                vit:8,
                fort:8,
                hp: 155,
                atk: 18,
                baseDef: 17
            },
            level: 16,
            portrait: images[this.pickRandom(['wyvern_portrait', 'wyvern_portrait2'])],
            greetings: ['*roar*'],
            deathCries: ['*scream*'],
            specials: ['firestorm'],
            attacks: ['claws', 'bite', 'fire_breath'],
            weaknesses: ['psionic']
        },
        djinn: {
            type: 'djinn',
            image_names: ['djinn'],
            monster_names: ['Murmeros', 'Ixcalot', 'il Hagan'],
            stats: {
                str: 8,
                int:11,
                dex:7,
                vit:9,
                fort:8,
                hp: 75,
                atk: 10,
                baseDef: 11
            },
            level: 19,
            portrait: images['djinn_portrait'],
            greetings: ['your fate leads you here, now it will all end'],
            deathCries: ['it seems your fate has other plans'],
            specials: ['duplicate', 'meditate', 'tesseract'],
            attacks: ['claws', 'void_lance', 'fire_breath'],
            weaknesses: ['arcane']
        },
        sphinx: {
            type: 'sphinx',
            image_names: ['sphinx'],
            monster_names: ['Nunufet', 'Ipalot', 'Vizieros'],
            stats: {
                str: 5,
                int:12,
                dex:7,
                vit:10,
                fort:10,
                hp: 125,
                atk: 15,
                baseDef: 13
            },
            level: 29,
            portrait: images[this.pickRandom(['sphinx_portrait', 'sphinx_portrait2'])],
            greetings: ['be thee worthy?'],
            deathCries: ['you may pass'],
            specials: ['possess', 'tesseract'],
            attacks: ['claws', 'induce_madness', 'lightning'],
            weaknesses: ['arcane'],
            minions: ['djinn']
        },
        goblin: {
            type: 'goblin',
            image_names: ['goblin'],
            monster_names: ['Wiggit', 'Miggi'],
            stats: {
                str: 4,
                int:2,
                dex:6,
                vit:4,
                fort:3,
                hp: 18,
                atk: 3,
                baseDef: 5
            },
            level: 2,
            portrait: images['goblin_portrait'],
            greetings: ['bones for my master!'],
            deathCries: ['nooooooo'],
            specials: ['zealotry'],
            attacks: ['claws', 'bite'],
            weaknesses: ['crushing', 'cutting', 'fire', 'electricity']
        },
        mummy: {
            type: 'mummy',
            image_names: ['mummy'],
            monster_names: ['Kufu', 'Razeset'],
            stats: {
                str: 8,
                int:4,
                dex:4,
                vit:8,
                fort:6,
                hp: 40,
                atk: 7,
                baseDef: 13
            },
            level: 6,
            portrait: images['mummy_portrait'],
            greetings: ['time is unravelling'],
            deathCries: ['at last'],
            specials: ['induce_fear'],
            attacks: ['grasp', 'energy_drain'],
            weaknesses: ['arcane', 'fire', 'electricity'],
            minions: ['skeleton', 'skeleton']
        },
        troll: {
            type: 'troll',
            image_names: ['troll'],
            monster_names: ['Mundzungu', 'Wugum'],
            stats: {
                str: 6,
                int:4,
                dex:4,
                vit:10,
                fort:2,
                hp: 58,
                atk: 7,
                baseDef: 13
            },
            level: 6,
            portrait: images['troll_portrait'],
            greetings: ['you stink of fresh meat'],
            deathCries: ['*gurgle*'],
            specials: ['regenerate'],
            attacks: ['crush', 'bite', 'tackle'],
            weaknesses: ['fire']
        },
        skeleton: {
            type: 'skeleton',
            image_names: ['skeleton'],
            monster_names: ['bones'],
            stats: {
                str: 4,
                int:1,
                dex:4,
                vit:5,
                fort:5,
                hp: 20,
                atk: 5,
                baseDef: 7
            },
            level: 3,
            portrait: images['skeleton_portrait'],
            greetings: ['*screech*'],
            deathCries: ['*screech*'],
            specials: ['induce_fear'],
            attacks: ['crush', 'bite', 'tackle'],
            weaknesses: ['fire']
        }
    }
    let count = 100;
    for(let key in this.monsters){
        let m = this.monsters[key]
        m.id = count;
        count++
    }

    this.getMonster = (monsterString) => {
        // console.log('get monster:', monsterString);
        let match = null;
        for(let key in this.monsters){
            let m = this.monsters[key]
            if(m.image_names.includes(monsterString)){
                match = m
            }
        }
        // this.battleMonster = match;
        // console.log('match:', match);
        return JSON.parse(JSON.stringify(match));
    }
    this.getRandomMonster = () => {
        return this.monsters['sphinx']
        // return this.pickRandom(Object.values(this.monsters))
    }
    

    
    // this.initializeCrew = (crew) => {
    //     crew.forEach(member=> { 
    //         if(this.memberTypes.includes(member.image)){
    //             this.crew.push({image: member.image, inventory: member.inventory, data: member.data})
    //         }
    //     })
    // }
    // this.addCrewMember = (member) => {
    //     this.crew.push({image: member.image, inventory: member.inventory, data: member.data})
    // }
}