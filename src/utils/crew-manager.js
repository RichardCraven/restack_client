import * as images from '../utils/images'

Date.prototype.addHours= function(h){
    this.setHours(this.getHours()+h);
    return this;
}

const EXP_TABLE = [
    0,
    120,
    300,
    700,
    1500,
    3200,
    7000
]

export function CrewManager(){
    // this.tiles = [];
    this.memberTypes = [
        'monk',
        'barbarian',
        'wizard',
        // 'sorceress',
        'rogue',
        'sage',
        'soldier'
    ]
    this.crew = [];
    
    this.initializeCrew = (crew) => {
        this.crew = [];
        crew.forEach(member=> { 
            // console.log('special actions: ', member.specialActions);
            if(!member.specialActions) return
            member.specialActions.forEach(a=>{

                let end = new Date(a.endDate),
                now = new Date();
                if(end - now < 0){
                    a.available = true;
                }
            })
            if(this.memberTypes.includes(member.image)){
                this.crew.push(member)
            }
        })
        this.checkForLevelUp(this.crew)
    }

    this.addCrewMember = (member) => {
        this.crew.push(member)
    }

    this.addExperience = (memberArray, experienceValue) => {
        memberArray.forEach(m=>{
            let nextLevelExp = EXP_TABLE[m.level]
            let member = this.crew.find(c=>c.type === m.type)
            member.stats.experience += experienceValue
        })
    }

    this.checkForLevelUp = (memberArray) => {
        memberArray.forEach(m=>{
            let nextLevelExp = EXP_TABLE[m.level]
            let member = this.crew.find(c=>c.type === m.type)
            if(member.stats.experience >= nextLevelExp){
                this.levelUp(member)
            }
        })
    }

    this.levelUp = (crewMember) => {
        switch(crewMember.type){
            case 'wizard':
                crewMember.stats.int++
            break;
            case 'rogue':
                crewMember.stats.dex++
            break;
            case 'sage':
                crewMember.stats.int++
            break;
            case 'monk':
                crewMember.stats.dex++
            break;
            case 'soldier':
                crewMember.stats.str++
            break;
            case 'barbarian':
                crewMember.stats.str++
            break;
        }
        crewMember.level++

    }

    this.calculateExpPercentage = (crewMember) => {
        let foundMember = this.crew.find(e=>e.name === crewMember.name)
        let nextLevelExp = EXP_TABLE[foundMember.level]
        let percentage = Math.ceil(((foundMember.stats.experience - EXP_TABLE[foundMember.level-1]) / (nextLevelExp - EXP_TABLE[foundMember.level-1])) * 100);
        if(percentage > 100) percentage = 100;
        return percentage;
    }

    this.beginSpecialAction = (member, actionType, actionSubtype) => {
        console.log('BEGIN SPECIAL ACTION: ', member, actionType, actionSubtype);
        const startDate = new Date();
        let endDate;
        switch(actionType.type){
            case 'glyph':
                switch(actionSubtype.type){
                    case 'magic missile':
                        // endDate = new Date().addHours(4);
                        endDate = new Date().addHours(1);

                        console.log('MAGIC MISSILE BEGIN!');
                        console.log('date + 1 hrs:', new Date().addHours(1));
                        member.specialActions.push({
                            actionType,
                            actionSubtype,
                            startDate,
                            endDate,
                            // available: false,
                            available: true,
                            notified: false,
                        })
                    break;
                    default:
                        break;
                }
            break;
            default:
                break;
        }
    }

    this.adventurers = [
        {
            image: 'wizard', 
            type: 'wizard',
            name: 'Zildjikan',
            level: 1,
            id: 33344,
            stats: {
                str: 3,
                int: 7,
                dex: 5,
                vit: 4,
                fort: 7,
                hp:20,
                atk:12,
                baseDef: 9,
                energy: 100,
                experience: 0
            }, 
            portrait: images['wizard_portrait'],
            inventory: [],
            specials: ['ice_blast', 'fire_blast'],
            attacks: ['energy_blast'],
            passives: ['magic_affinity'],
            weaknesses: ['ice', 'fire', 'electricity', 'blood_magic'],
            description: "Hailing from the magister's college, Zildjikan was the dean of transmutation. A powerful magic user, he has been known to linger for long periods in the silent realm, searching for secret truths.",
            specialActions: [],
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
        },
        {
            image: 'soldier', 
            type: 'soldier',
            name: 'Sardonis',
            id: 123,
            level: 1,
            stats: {
                str: 8,
                int: 5,
                dex: 6,
                vit: 4,
                fort: 7,
                hp: 1000,
                atk: 8,
                baseDef: 12,
                energy: 0,
                experience: 0
            }, 
            isLeader: true,
            portrait: images['soldier_portrait'],
            inventory: [],
            passives: ['inspiring_force'],
            specials: ['shield_wall'],
            // attacks: ['sword_swing', 'sword_thrust', 'shield_bash'],
            attacks: ['sword_swing', 'sword_swing', 'sword_swing'],
            weaknesses: ['ice', 'electricity', 'blood_magic'],
            description: "Once the captain of the royal army's legendary vangard battalion, Sardonis has a reputation for fair leadership and honor.",
            specialActions: [],
            combatStyle: 'prioritizeClosestEnemy',
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
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
                hp: 23,
                atk: 6,
                baseDef: 11,
                energy: 0,
                experience: 0
            }, 
            portrait: images['monk_portrait'],
            inventory: [],
            passives: ['diamond_skin'],
            specials: ['flying_lotus'],
            attacks: ['dragon_punch', 'dragon_punch', 'dragon_punch'],
            weaknesses: ['fire', 'electricity', 'ice', 'blood_magic', 'crushing'],
            description: "Yu was born into the dynastic order of the White Serpent, inheriting the secrets of absolute stillness and unyielding motion",
            specialActions: [],
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
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
                hp: 19,
                atk: 4,
                baseDef: 5,
                energy: 0,
                experience: 0
            }, 
            portrait: images['sage_portrait'],
            inventory: [],
            specials: ['healing_hymn'],
            attacks: ['meditate', 'heal'],
            passives: ["owls_insight"],
            weaknesses: ['fire', 'electricity', 'ice', 'blood_magic', 'crushing'],
            description: "Loryastes is the headmaster of Citadel library, chronicled the histories of three monarchies, and a pupil of The Great Scribe",
            specialActions: [],
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
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
                hp: 22,
                atk: 6,
                baseDef: 10,
                energy: 0,
                experience: 0
            }, 
            portrait: images['rogue_portrait'],
            inventory: [],
            specials: ['deadeye_shot'],
            attacks: ['fire_arrow', 'dagger_stab'],
            passives: ['nimble_dodge'],
            weaknesses: ['ice', 'curse', 'crushing'],
            description: "Tyra was born a slave, surviving and advancing through sheer cunning and a ruthless will",
            specialActions: [],
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
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
                hp: 27,
                atk: 9,
                baseDef: 12,
                energy: 0,
                experience: 0
            }, 
            portrait: images['barbarian_portrait'],
            inventory: [],
            specials: ['berserker_rage'],
            attacks: ['axe_throw', 'axe_swing', 'spear_throw'],
            passives: ['fury'],
            weaknesses: ['ice', 'curse', 'psionic'],
            description: "Ulaf is the son of the chieftan of the Rootsnarl Clan. He is on a journey to prove his mettle and one day take his father's place",
            specialActions: [],
            actionsTrayExpanded: false,
            actionMenuTypeExpanded: false
        },
    ]
}