import * as images from '../utils/images'

const getMinorWeapon = () => {
    const arr = ['axe',
        'flail',
        'spear',
        'sword',
        'longbow']
    return arr
}
const getMajorWeapon = () => {
    const arr = ['scepter']
}
export function MonsterManager(){
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.battleMonster = null;
    this.monsters = {
        witch: {
            type: 'witch',
            key: 'witch',
            image_names: ['witch_p1_1'],
            monster_names: ['Rhea', 'BabaYaga'],
            stats: {
                hp: 160,
                atk: 13,
                def: 8,
                speed: 10,
                willpower: 0
            },
            level: 12,
            portrait: images['witch_p1_1'],
            greetings: ['Thy blood is quickening'],
            deathCries: ['Mercy'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['void_lance', 'magic_missile'],
            weaknesses: ['arcane', 'holy-aura'],
            drops: [
                {item: 'volkas_wand', percentChance: 35},
                {item: 'maerlyns_rod', percentChance: 35},
                {item: 'evilai_charm', percentChance: 35}
            ]
        },
        beholder: {
            type: 'beholder',
            key: 'beholder',
            image_names: ['beholder'],
            monster_names: ['Nirnuceks', 'Adalak', 'Vemrindon', 'Sardaresh'],
            stats: {
                hp: 110,
                atk: 15,
                def: 5,
                speed: 10,
                willpower: 0
            },
            level: 14,
            portrait: images['beholder_portrait'],
            greetings: ['Vukudaj kolo gurdu'],
            deathCries: ['Urdu meklak milnaurku...'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['void_lance', 'magic_missile'],
            // attacks: ['magic_missile'],
            weaknesses: ['arcane', 'holy-aura'],
            minions: ['beholder_minion', 'beholder_minion'],
            drops: [
                {item: 'volkas_wand', percentChance: 35},
                {item: 'maerlyns_rod', percentChance: 35},
                {item: 'evilai_charm', percentChance: 35}
            ]
        },
        beholder_minion: {
            type: 'beholder_minion',
            key: 'beholder_minion',
            image_names: ['beholder_minion'],
            monster_names: ['Nirnuceks', 'Adalak', 'Vemrindon'],
            stats: {
                hp: 60,
                atk: 7,
                def: 2,
                speed: 10,
                willpower: 0
            },
            level: 5,
            portrait: images['beholder_minion_portrait'],
            greetings: ['Vukdaj kolo gurdu'],
            deathCries: ['Urdu meklak milnaurku...'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['void_lance', 'magic_missile'],
            weaknesses: ['arcane', 'holy-aura'],
            drops: []
        },
        kabuki_demon: {
            type: 'demon',
            key: 'kabuki_demon',
            image_names: ['kabuki_demon_portrait'],
            monster_names: ['Ikiro', 'Jimbu'],
            stats: {
                hp: 140,
                atk: 13,
                def: 3,
                speed: 10,
                willpower: 0
            },
            level: 15,
            portrait: images['kabuki_demon_portrait'],
            greetings: ['Assaaa'],
            deathCries: ['No! Impossible!'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['void_lance', 'magic_missile'],
            weaknesses: ['arcane', 'holy-aura'],
            minions: ['kabuki_demon_minion', 'kabuki_demon_minion'],
            drops: [
                {item: 'volkas_wand', percentChance: 35},
                {item: 'maerlyns_rod', percentChance: 35},
                {item: 'evilai_charm', percentChance: 35}
            ]
        },
        kabuki_demon_minion: {
            type: 'demon',
            key: 'kabuki_demon_minion',
            image_names: ['kabuki_demon_minion'],
            monster_names: ['Ikiro', 'Jimbu'],
            stats: {
                hp: 50,
                atk: 5,
                def: 3,
                speed: 10,
                willpower: 0
            },
            level: 4,
            portrait: images['kabuki_demon_minion_portrait'],
            greetings: ['Assaaa'],
            deathCries: ['No! Impossible!'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['void_lance', 'magic_missile'],
            weaknesses: ['arcane', 'holy-aura'],
            drops: []
        },
        vampire: {
            type: 'vampire',
            key: 'vampire',
            image_names: ['black_vampire'],
            monster_names: ['Vukodlak', 'Morias', 'Roterach'],
            stats: {
                hp: 84,
                atk: 9,
                def: 12,
                speed: 10,
                willpower: 0
            },
            level: 10,
            portrait: images['vampire_portrait'],
            greetings: ['My hunger sees you'],
            deathCries: ['Peace at last...'],
            specials: ['obliterate', 'flying', 'invisibility'],
            attacks: ['claws', 'bite'],
            weaknesses: ['arcane', 'holy-aura'],
            drops: [
                {item: 'court_mask', percentChance: 35},
                {item: 'minor_health_potion', percentChance: 55},
            ]
        },
        ogre: {
            type: 'ogre',
            key: 'ogre',
            image_names: ['ogre'],
            monster_names: ['Uggo', 'Tubodu', 'Gumluk'],
            stats: {
                hp: 172,
                atk: 9,
                def: 11,
                speed: 10,
                willpower: 0
            },
            level: 8,
            portrait: images['ogre_portrait'],
            greetings: ['Guarkog buzu', 'Mogab burdu'],
            deathCries: ['*gurgle*'],
            specials: ['berserk'],
            attacks: ['crush', 'bite', 'tackle'],
            weaknesses: ['fire', 'psionic'],
            drops: [
                {item: 'minor_health_potion', percentChance: 55},
            ]
        },
        gorgon: {
            type: 'gorgon',
            key: 'gorgon',
            image_names: ['gorgon'],
            monster_names: ['Lithios', 'Merkaba', 'Axolus'],
            stats: {
                hp: 62,
                atk: 8,
                def: 9,
                speed: 10,
                willpower: 0
            },
            level: 9,
            portrait: images['gorgon_portrait'],
            greetings: ['Ssssurrenderrrr', 'Be ssstill'],
            deathCries: ['Arrrghhh!'],
            specials: ['petrify'],
            attacks: ['snake_strike', 'bite'],
            weaknesses: ['ice', 'psionic'],
            drops: [
                {item: 'minor_health_potion', percentChance: 55},
                {item: 'lundi_amulet', percentChance: 25}
            ]
        },
        goat_demon: {
            type: 'demon',
            key: 'goat_demon',
            image_names: ['goat_demon'],
            monster_names: ['ur-Xulu', 'ur-Baba', 'ur-Zuzu'],
            stats: {
                hp: 92,
                atk: 11,
                def: 11,
                speed: 10,
                willpower: 0
            },
            level: 11,
            portrait: images['goat_demon_portrait'],
            greetings: ['More ingredients for my ritual..'],
            deathCries: ['Arrrghhh!'],
            specials: ['petrify'],
            attacks: ['snake_strike', 'bite'],
            weaknesses: ['ice', 'psionic'],
            minions: ['goblin', 'goblin'],
            drops: [
                {item: 'minor_health_potion', percentChance: 55},
                {item: 'lundi_amulet', percentChance: 25}
            ]
        },
        wraith: {
            type: 'wraith',
            key: 'wraith',
            image_names: ['wraith'],
            monster_names: ['Sicirath', 'Olnuk', 'Ygra'],
            stats: {
                hp: 82,
                atk: 9,
                def: 8,
                speed: 10,
                willpower: 0
            },
            level: 8,
            portrait: images['wraith_portrait'],
            greetings: ['*hissssss*', 'come to the silence'],
            deathCries: ['*screams*'],
            specials: ['banshee wail'],
            attacks: ['grasp', 'energy_drain'],
            weaknesses: ['holy', 'psionic'],
            drops: [
                {item: 'lundi_amulet', percentChance: 25}
            ]
        },
        dragon: {
            type: 'dragon',
            key: 'dragon',
            image_names: ['dragon'],
            monster_names: ['Theraxes', 'Daedron', 'Kykerod'],
            stats: {
                hp: 255,
                atk: 18,
                def: 17,
                speed: 10,
                willpower: 0
            },
            level: 16,
            portrait: images[this.pickRandom(['wyvern_portrait', 'wyvern_portrait2'])],
            greetings: ['*roar*'],
            deathCries: ['*scream*'],
            specials: ['firestorm'],
            attacks: ['claws', 'bite', 'fire_breath'],
            weaknesses: ['psionic'],
            drops: [
                {item: 'major_key', percentChance: 45},
                {item: 'glindas_wand', percentChance: 25},
                {item: 'major_health_potion', percentChance: 75},
            ]
        },
        djinn: {
            type: 'djinn',
            key: 'djinn',
            image_names: ['djinn'],
            monster_names: ['Murmeros', 'Ixcalot', 'il Hagan'],
            stats: {
                hp: 175,
                atk: 10,
                def: 11,
                speed: 10,
                willpower: 0
            },
            level: 19,
            portrait: images['djinn_portrait'],
            greetings: ['your fate leads you here, now it will all end'],
            deathCries: ['it seems your fate has other plans'],
            specials: ['duplicate', 'meditate', 'tesseract'],
            attacks: ['claws', 'void_lance', 'fire_breath'],
            weaknesses: ['arcane'],
            drops: [
                {item: 'minor_key', percentChance: 35},
                {item: 'bundu_mask', percentChance: 55},
                {item: 'major_health_potion', percentChance: 75}
            ]
        },
        sphinx: {
            type: 'sphinx',
            key: 'sphinx',
            image_names: ['sphinx'],
            monster_names: ['Nunufet', 'Ipalot', 'Vizieros'],
            stats: {
                hp: 325,
                atk: 13,
                // atk: 2,
                def: 13,
                speed: 10,
                willpower: 0
            },
            level: 29,
            // portrait: images[this.pickRandom(['sphinx_portrait', 'sphinx_portrait2'])],
            portrait: images['sphinx_portrait2'],
            greetings: ['be thee worthy?'],
            deathCries: ['you may pass'],
            specials: ['possess', 'tesseract'],
            // attacks: ['claws', 'claws', 'claws'],
            attacks: ['claws', 'claws', 'induce_madness', 'lightning'],
            weaknesses: ['arcane'],
            minions: ['djinn'],
            drops: [
                {item: 'scarab_charm', percentChance: 85},
                {item: 'nukta_amulet', percentChance: 35},
                {item: 'major_health_potion', percentChance: 75}
            ]
        },
        goblin: {
            type: 'goblin',
            key: 'goblin',
            image_names: ['goblin'],
            monster_names: ['Wiggit', 'Miggi', "Gurnak"],
            stats: {
                hp: 38,
                atk: 3,
                def: 5,
                speed: 10,
                willpower: 0
            },
            level: 2,
            portrait: images['goblin_portrait'],
            greetings: ['bones for my master!'],
            deathCries: ['nooooooo'],
            specials: ['zealotry'],
            attacks: ['claws', 'bite'],
            weaknesses: ['crushing', 'cutting', 'fire', 'electricity'],
            drops: [
                {item: 'minor_health_potion', percentChance: 45}
            ]
        },
        mummy: {
            type: 'mummy',
            key: 'mummy',
            image_names: ['mummy'],
            monster_names: ['Kufu', 'Razeset'],
            stats: {
                hp: 80,
                atk: 10,
                def: 13,
                speed: 10,
                willpower: 0
            },
            level: 6,
            portrait: images['mummy_portrait'],
            greetings: ['time is unravelling'],
            deathCries: ['at last'],
            specials: ['induce_fear'],
            attacks: ['grasp', 'energy_drain'],
            weaknesses: ['arcane', 'fire', 'electricity'],
            minions: ['skeleton', 'skeleton'],
            drops: [
                {item: 'scarab_charm', percentChance: 55},
                {item: 'minor_health_potion', percentChance: 55}
            ]
        },
        troll: {
            type: 'troll',
            key: 'troll',
            image_names: ['troll'],
            monster_names: ['Mundzungu', 'Wugum'],
            stats: {
                hp: 78,
                atk: 10,
                def: 13,
                speed: 10,
                willpower: 0
            },
            level: 6,
            portrait: images['troll_portrait'],
            greetings: ['you stink of fresh meat'],
            deathCries: ['*gurgle*'],
            specials: ['regenerate'],
            attacks: ['crush', 'bite', 'tackle'],
            weaknesses: ['fire'],
            drops: [
                {item: 'zul_mask', percentChance: 15},
                {item: 'minor_health_potion', percentChance: 55}
            ]
        },
        skeleton: {
            type: 'skeleton',
            key: 'skeleton',
            image_names: ['skeleton'],
            monster_names: ['bones'],
            stats: {
                hp: 35,
                atk: 5,
                def: 7,
                speed: 10,
                willpower: 0
            },
            level: 3,
            portrait: images['skeleton_portrait'],
            greetings: ['*screech*'],
            deathCries: ['*screech*'],
            specials: ['induce_fear'],
            attacks: ['claws', 'claws', 'claws'],
            minions: ['skeleton', 'skeleton'],
            weaknesses: ['fire'],
            drops: [
                {item: 'minor_health_potion', percentChance: 5},
                {item: this.pickRandom(getMinorWeapon()), percentChance: 40}
                // {item: 'sword', percentChance: 85},
                // {item: 'nukta_amulet', percentChance: 85},
                // {item: 'basic_helm', percentChance: 75},
                // {item: 'scarab_charm', percentChance: 55},
                // {item: 'seeing_shield', percentChance: 85},
                // {item: 'glindas_wand', percentChance: 85},
                // {item: 'zul_mask', percentChance: 75}
            ]
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
        // console.log('this.monsters', this.monsters);
        match = this.monsters[monsterString];
        return match ? JSON.parse(JSON.stringify(match)) : null;
    }
    this.getRandomMonster = () => {
        // return this.monsters['sphinx']
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