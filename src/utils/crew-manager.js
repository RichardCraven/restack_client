import * as images from '../utils/images'

export function CrewManager(){
    // this.tiles = [];
    this.memberTypes = [
        'monk',
        'barbarian',
        'wizard',
        'sorceress',
        'rogue',
        'archer',
        'sage',
        'soldier'
    ]
    this.crew = [];
    
    this.initializeCrew = (crew) => {
        this.crew = [];
        crew.forEach(member=> { 
            if(this.memberTypes.includes(member.image)){
                // member.inventory = [
                //     'major_health_potion'
                // ]
                this.crew.push(member)
            }
        })
    }
    this.addCrewMember = (member) => {
        this.crew.push(member)
    }

    this.adventurers = [
        {
            image: 'wizard', 
            type: 'wizard',
            name: 'Pendicus',
            level: 1,
            id: 33344,
            stats: {
                str: 3,
                int: 7,
                dex: 5,
                vit: 4,
                fort: 7,
                hp:10,
                atk:120,
                baseDef: 9,
                energy: 0
            }, 
            portrait: images['wizard_portrait'],
            inventory: [],
            specials: ['ice_blast'],
            attacks: ['magic_missile'],
            passives: ['magic_affinity'],
            weaknesses: ['ice', 'fire', 'electricity', 'blood_magic'],
            description: "Hailing from the magister's college, Pendicus was the dean of transmutation. A powerful magic user, he has been known to linger for long periods in the silent realm, searching for secret truths."
        },
        {
            image: 'soldier', 
            type: 'soldier',
            name: 'Sardonis',
            id: 123,
            level: 1,
            stats: {
                str: 7,
                int: 5,
                dex: 5,
                vit: 4,
                fort: 7,
                hp: 15,
                atk: 8,
                baseDef: 12,
                energy: 0
            }, 
            isLeader: true,
            portrait: images['soldier_portrait'],
            inventory: [],
            passives: ['inspiring_force'],
            specials: ['shield_wall'],
            attacks: ['sword_swing', 'sword_thrust', 'shield_bash'],
            weaknesses: ['ice', 'electricity', 'blood_magic'],
            description: "Once the captain of the royal army's legendary vangard battalion, Sardonis has a reputation for fair leadership and honor."
        },
        {
            image: 'monk', 
            type: 'monk',
            name: 'Yu',
            level: 1,
            id: 8080,
            stats: {
                str: 5,
                int: 6,
                dex: 9,
                vit: 4,
                fort: 7,
                hp: 13,
                atk: 6,
                baseDef: 11,
                energy: 0
            }, 
            portrait: images['monk_portrait'],
            inventory: [],
            passives: ['diamond_skin'],
            specials: ['flying_lotus'],
            attacks: ['meditate', 'dragon_punch'],
            weaknesses: ['fire', 'electricity', 'ice', 'blood_magic', 'crushing'],
            description: "Yu was born into the dynastic order of the White Serpent, inheriting the secrets of absolute stillness and unyielding motion"
        },
        {
            image: 'sage', 
            type: 'sage',
            name: 'Loryastes',
            level: 1,
            id: 456,
            stats: {
                str: 3,
                int: 7,
                dex: 5,
                vit: 4,
                fort: 7,
                hp: 9,
                atk: 4,
                baseDef: 5,
                energy: 0
            }, 
            portrait: images['sage_portrait'],
            inventory: [],
            specials: ['healing_hymn'],
            attacks: ['meditate', 'heal'],
            passives: ["owls_insight"],
            weaknesses: ['fire', 'electricity', 'ice', 'blood_magic', 'crushing'],
            description: "Loryastes is the headmaster of Citadel library, chronicled the histories of three monarchies, and a pupil of The Great Scribe"
        },
        {
            image: 'rogue', 
            type: 'rogue',
            name: 'Tyra',
            level: 1,
            id: 789,
            stats: {
                str: 5,
                int: 5,
                dex: 6,
                vit: 6,
                fort: 3,
                hp: 12,
                atk: 6,
                baseDef: 10,
                energy: 0
            }, 
            portrait: images['rogue_portrait'],
            inventory: [],
            specials: ['deadeye_shot'],
            attacks: ['fire_arrow', 'dagger_stab'],
            passives: ['nimble_dodge'],
            weaknesses: ['ice', 'curse', 'crushing'],
            description: "Tyra was born a slave, surviving and advancing through sheer cunning and a ruthless will"
        },
        {
            image: 'barbarian', 
            type: 'barbarian',
            name: 'Ulaf',
            level: 1,
            id: 8822,
            stats: {
                str: 8,
                int: 3,
                dex: 4,
                vit: 6,
                fort: 6,
                hp: 16,
                atk: 9,
                baseDef: 12,
                energy: 0
            }, 
            portrait: images['barbarian_portrait'],
            inventory: [],
            specials: ['berserker_rage'],
            attacks: ['axe_throw', 'axe_swing', 'spear_throw'],
            passives: ['fury'],
            weaknesses: ['ice', 'curse', 'psionic'],
            description: "Ulaf is the son of the chieftan of the Rootsnarl Clan. He is on a journey to prove his mettle and one day take his father's place"
        },
    ]
}