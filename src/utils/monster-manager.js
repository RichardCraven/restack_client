import * as images from '../utils/images'

export function MonsterManager(){
    this.battleMonster = null;
    this.monsters = {
        vampire: {
            type: 'vampire',
            image_names: ['white_vampire', 'black_vampire'],
            stats: {
                str: 7,
                int:7,
                dex:6,
                vit:6,
                fort:6,
                hp: 30,
                atk: 8
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
            stats: {
                str: 7,
                int:7,
                dex:6,
                vit:6,
                fort:6,
                hp: 22,
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
        dragon: {
            type: 'dragon',
            image_names: ['dragon'],
            stats: {
                str: 10,
                int:9,
                dex:5,
                vit:8,
                fort:8,
                hp: 55,
                atk: 18
            },
            level: 16,
            portrait: images['wyvern_portrait2'],
            greetings: ['*roar*'],
            deathCries: ['*scream*'],
            specials: ['firestorm'],
            attacks: ['claws', 'bite', 'fire-breath'],
            weaknesses: []
        }
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