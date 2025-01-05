import * as images from '../utils/images'

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
            monster_names: ['Rhea', 'Eundu'],
            stats: {
                str: 10,
                int:12,
                dex:5,
                vit:7,
                fort:5,
                hp: 60,
                atk: 13,
                baseDef: 8
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
                str: 10,
                int: 10,
                dex:6,
                vit:9,
                fort:5,
                hp: 110,
                atk: 15,
                baseDef: 5
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
                str: 5,
                int: 5,
                dex:3,
                vit:3,
                fort:2,
                hp: 40,
                atk: 7,
                baseDef: 2
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
                str: 13,
                int: 12,
                dex:8,
                vit:8,
                fort:7,
                hp: 120,
                atk: 13,
                baseDef: 3
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
                str: 6,
                int: 2,
                dex:4,
                vit:4,
                fort:3,
                hp: 20,
                atk: 5,
                baseDef: 3
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
                str: 8,
                int:5,
                dex:4,
                vit:5,
                fort:7,
                hp: 42,
                atk: 8,
                baseDef: 9
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
                str: 9,
                int:6,
                dex:5,
                vit:9,
                fort:8,
                hp: 82,
                atk: 11,
                baseDef: 11
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
                str: 5,
                int:12,
                dex:7,
                vit:10,
                fort:10,
                hp: 125,
                atk: 13,
                baseDef: 13
            },
            level: 29,
            portrait: images[this.pickRandom(['sphinx_portrait', 'sphinx_portrait2'])],
            greetings: ['be thee worthy?'],
            deathCries: ['you may pass'],
            specials: ['possess', 'tesseract'],
            attacks: ['claws', 'induce_madness', 'lightning'],
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
            minions: ['skeleton', 'skeleton'],
            weaknesses: ['fire'],
            drops: [
                {item: 'minor_health_potion', percentChance: 55}
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