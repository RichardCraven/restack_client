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
                atk: 9
            },
            level: 10,
            portrait: images['vampire_portrait'],
            greetings: ['My hunger sees you'],
            deathCries: ['Peace at last...'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['claws', 'bite'],
            weaknesses: ['silver-weapon', 'holy-aura'],

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
                atk: 9
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
                atk: 9
            },
            level: 8,
            portrait: images['wraith_portrait'],
            greetings: ['*hissssss*', 'come to the silence'],
            deathCries: ['*screams*'],
            specials: ['banshee wail'],
            attacks: ['grasp', 'energy drain'],
            weaknesses: ['holy', 'psionic']
        },
        dragon: {
            type: 'dragon',
            image_names: ['dragon'],
            monster_names: ['Theraxes', 'Daedron', 'Kykerod'],
            stats: {
                str: 10,
                int:9,
                dex:5,
                vit:8,
                fort:8,
                hp: 155,
                atk: 18
            },
            level: 16,
            portrait: images[this.pickRandom(['wyvern_portrait', 'wyvern_portrait2'])],
            greetings: ['*roar*'],
            deathCries: ['*scream*'],
            specials: ['firestorm'],
            attacks: ['claws', 'bite', 'fire-breath'],
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
                atk: 10
            },
            level: 19,
            portrait: images['djinn_portrait'],
            greetings: ['your fate leads you here, now it will all end'],
            deathCries: ['it seems your fate has other plans'],
            specials: ['duplicate', 'meditate', 'tesseract'],
            attacks: ['claws', 'void lance', 'fire-breath'],
            weaknesses: []
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
                atk: 15
            },
            level: 29,
            portrait: images[this.pickRandom(['sphinx_portrait', 'sphinx_portrait2'])],
            greetings: ['lets see if you are worthy of the secrets'],
            deathCries: ['you may pass'],
            specials: ['possess', 'tesseract'],
            attacks: ['claws', 'induce madness', 'electricity'],
            weaknesses: []
        }
    }
    let count = 15;
    for(let key in this.monsters){
        let m = this.monsters[key]
        m.id = count;
        count++
    }

    this.check = () => {
        console.log('check!!!!!')
    }

    this.getMonster = (monsterString) => {
        let match = null;
        for(let key in this.monsters){
            let m = this.monsters[key]
            if(m.image_names.includes(monsterString)){
                match = m
            }
        }
        this.battleMonster = match;
        return match;
    }
    this.getRandomMonster = () => {
        return this.pickRandom(Object.values(this.monsters))
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