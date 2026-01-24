import * as images from './images'

// Centralized canonical specials matrix. Exporting as default so other
// modules (CombatManager, UIs, AI) import the authoritative data.
const specialsMatrix = {
    deadeye_shot: {
        name: 'deadeye shot',
        type: 'special',
        icon: images['evilai_charm'],
        cooldown: 10,
        damage: 10,
        effect: ['damage_single_target'],
        level: 1
    },
    berserker_rage: {
        name: 'berserker rage',
        type: 'special',
        icon: images['demonskull_charm'],
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
        },
        level: 1
    },
    healing_hymn: {
        name: 'healing hymn',
        type: 'special',
        icon: images['lundi_charm'],
        effect: ['buff_all_friendly'],
        buff: {
            heal: {
                amount: 12 
            }
        },
        cooldown: 12,
        level: 1
    },
    reveal_weakness: {
        name: 'reveal weakness',
        type: 'special',
        icon: images['hamsa_charm'],
        cooldown: 12,
        effect: ['special'],
        special_instructions: 'reveal all monsters weaknesses',
        level: 1
    },
    flying_lotus: {
        name: 'flying lotus',
        type: 'special',
        icon: images['lundi_charm'],
        cooldown: 11,
        damage: 15,
        effect: ['damage_single_target', 'special'],
        special_instructions: 'target has 50% chance to be stunned for 1 sec * $str',
        level: 1
    },
    shield_wall: {
        name: 'shield wall',
        type: 'special',
        icon: images['beetle_charm'],
        cooldown: 11,
        effect: ['special'],
        special_instructions: 'shield all members for three hits',
        level: 1
    },
    ice_blast: {
        name: 'ice blast',
        type: 'special',
        icon: images['ice_blast'],
        cooldown: 18,
        damage: 5,
        energy_cost: 80,
        effect: ['damage_single_target', 'special'],
        special_instructions: 'each enemy has a 40% chance to be frozen',
        level: 1
    },
    fire_blast: {
        name: 'fire blast',
        type: 'special',
        icon: images['fire_blast'],
        energy_cost: 30,
        cooldown: 4,
        damage: 7,
        effect: ['damage_multi_target', 'special'],
        special_instructions: 'each enemy has a 40% chance to be lit aflame',
        level: 1
    },
}

export default specialsMatrix;
