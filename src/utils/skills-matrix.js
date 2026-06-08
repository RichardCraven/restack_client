import * as images from './images';

const skillsMatrix = {
    // === RANGER ===
    notch: {
        id: 'notch',
        tier: 1,
        name: 'Notch',
        desc: 'Select arrow type to load.',
        icon: images['ranger_notch'],
        cooldown: 0,
        duration: 'instant',
        range: 'self',
        type: 'utility'
    },
    loose: {
        id: 'loose',
        tier: 1,
        name: 'Loose',
        desc: 'Shoot the selected notched arrow.',
        icon: images['ranger_loose'],
        cooldown: 2,
        duration: 'instant',
        range: 'far',
        type: 'damage'
    },
    mark: {
        id: 'mark',
        tier: 1,
        name: 'Mark',
        desc: 'Place a target mark on the enemy.',
        icon: images['ranger_mark'],
        cooldown: 6,
        duration: 'long',
        range: 'far',
        type: 'debuff',
        effect: ['target_marked']
    },
    execute: {
        id: 'execute',
        tier: 3,
        name: 'Execute',
        desc: 'Shoot three arrows in rapid succession.',
        icon: images['ranger_execute'],
        cooldown: 10,
        duration: 'instant',
        range: 'far',
        type: 'damage'
    },
    ensnare: {
        id: 'ensnare',
        tier: 2,
        name: 'Ensnare',
        desc: 'Entangle the target, paralyzing them.',
        icon: images['ranger_ensnare'],
        cooldown: 6,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'ensnared', chance: 100, duration: 2 }
    },

    // === SAGE ===
    heal: {
        id: 'heal',
        tier: 1,
        name: 'Heal',
        desc: 'Cast restorative magic on an ally.',
        icon: images['healing_hands'],
        cooldown: 6,
        duration: 'instant',
        range: 'medium',
        type: 'heal',
        damage: -30, // negative damage is healing
        regeneration_percent: 30
    },
    circle_of_protection: {
        id: 'circle_of_protection',
        tier: 1,
        name: 'Circle of Protection',
        desc: 'Create a sanctuary shielding allies.',
        icon: images['circle_of_protection'],
        cooldown: 12,
        duration: 'long',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['def'],
                amounts: [15]
            }
        }
    },
    perceive: {
        id: 'perceive',
        tier: 2,
        name: 'Perceive',
        desc: 'Doubles the weakness of each enemy.',
        icon: images['perceive'],
        cooldown: 12,
        duration: '2x-long',
        range: 'far',
        type: 'debuff',
        effect: ['weakness_doubled']
    },

    // === SOLDIER ===
    slash: {
        id: 'slash',
        tier: 1,
        name: 'Slash',
        desc: 'Execute a heavy steel blade slash.',
        icon: images['soldier_slash'],
        cooldown: 1,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    shield_wall: {
        id: 'shield_wall',
        tier: 2,
        name: 'Shield Wall',
        desc: 'Deploy a protective energetic wall overlay.',
        icon: images['shield_wall'],
        cooldown: 12,
        duration: 'long',
        range: 'self',
        type: 'buff'
    },
    shield_slam: {
        id: 'shield_slam',
        tier: 1,
        name: 'Shield Slam',
        desc: 'Ram target, causing heavy structural shake.',
        icon: images['shield_slam'],
        cooldown: 4,
        duration: 'instant',
        range: 'close',
        type: 'damage',
        effect: { type: 'stun', chance: 100, duration: 1 }
    },
    defensive_stance: {
        id: 'defensive_stance',
        tier: 2,
        name: 'Defensive Stance',
        desc: 'Adopt a defensive stance to absorb damage.',
        icon: images['soldier_defensive_stance'],
        cooldown: 6,
        duration: 'short',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['def'],
                amounts: [10]
            }
        }
    },
    fist_of_honor: {
        id: 'fist_of_honor',
        tier: 1,
        name: 'Fist of Honor',
        desc: 'Strike with a fist of pure honor.',
        icon: images['soldier_fist_of_honor'],
        cooldown: 4,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    imbued_strike: {
        id: 'imbued_strike',
        tier: 1,
        name: 'Imbued Strike',
        desc: 'Strike with an energy-imbued blade.',
        icon: images['soldier_imbued_strike'],
        cooldown: 4,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    one_man_army: {
        id: 'one_man_army',
        tier: 4,
        name: 'One Man Army',
        desc: 'Summon the strength of a one-man army.',
        icon: images['soldier_one_man_army'],
        cooldown: 16,
        duration: 'long',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['atk', 'def'],
                amounts: [10, 10]
            }
        }
    },
    inspire: {
        id: 'inspire',
        tier: 2,
        name: 'Inspire',
        desc: 'Inspire nearby allies to fight harder.',
        icon: images['inspire'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'buff'
    },
    battlecry: {
        id: 'battlecry',
        tier: 3,
        name: 'Battlecry',
        desc: 'Unleash a roar, amplifying size and damage.',
        icon: images['soldier_battlecry'],
        cooldown: 10,
        duration: 'short',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['atk'],
                amounts: [8]
            }
        }
    },

    // === WIZARD ===
    fireball: {
        id: 'fireball',
        tier: 1,
        name: 'Fireball',
        desc: 'Launch an explosive orb of flame.',
        icon: images['fireball'],
        cooldown: 4,
        duration: 'instant',
        range: 'far',
        type: 'damage',
        damage: 15
    },
    ice_blast: {
        id: 'ice_blast',
        tier: 1,
        name: 'Ice Blast',
        desc: 'Freeze target in a block of absolute-zero ice.',
        icon: images['ice_blast_icon'],
        cooldown: 6,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        damage: 22,
        effect: { type: 'frozen', chance: 100, duration: 2 }
    },
    magic_missile: {
        id: 'magic_missile',
        tier: 1,
        name: 'Magic Missile',
        desc: 'Fire three seeking missiles in sequence.',
        icon: images['magic_missile_icon'],
        cooldown: 2,
        duration: 'instant',
        range: 'far',
        type: 'damage',
        damage: 10
    },
    lightning_strike: {
        id: 'lightning_strike',
        tier: 2,
        name: 'Lightning',
        desc: 'Strike the target with electrical charge.',
        icon: images['lightning'],
        cooldown: 6,
        duration: 'instant',
        range: 'far',
        type: 'damage',
        damage: 22
    },
    acid_blast: {
        id: 'acid_blast',
        tier: 2,
        name: 'Acid Blast',
        desc: 'Conical green projectile that poisons the target.',
        icon: images['wizard_acid_blast'],
        cooldown: 4,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        damage: 12,
        effect: { type: 'poison', chance: 100, duration: 2 }
    },
    disintegrate: {
        id: 'disintegrate',
        tier: 3,
        name: 'Disintegrate',
        desc: 'Call a white-red beam that expands and shakes target.',
        icon: images['wizard_disintegrate'],
        cooldown: 8,
        duration: 'instant',
        range: 'medium',
        type: 'damage',
        damage: 30
    },
    sleep: {
        id: 'sleep',
        tier: 2,
        name: 'Sleep',
        desc: 'Cast a soothing spell that puts the target to sleep. Broken by damage.',
        icon: images['wizard_sleep'],
        cooldown: 10,
        duration: 'long',
        range: 'medium',
        type: 'debuff',
        mentalityDebuff: true,
        power: 40,
        effect: { type: 'sleep', duration: 8 }
    },
    annihilation: {
        id: 'annihilation',
        tier: 3,
        name: 'Annihilation',
        desc: 'Unleash a devastating burst of pure energy.',
        icon: images['wizard_annihilation'],
        cooldown: 14,
        duration: 'instant',
        range: 'far',
        type: 'damage',
        damage: 40
    },
    vortex: {
        id: 'vortex',
        tier: 4,
        name: 'Vortex',
        desc: 'Create a swirling maelstrom at the target location.',
        icon: images['wizard_vortex'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'debuff'
    },

    // === BARBARIAN ===
    barbarian_slash: {
        id: 'barbarian_slash',
        tier: 1,
        name: 'Slash',
        desc: 'Execute a fast horizontal slash.',
        icon: images['barbarian_slash'],
        cooldown: 0,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    barbarian_cleave: {
        id: 'barbarian_cleave',
        tier: 1,
        name: 'Cleave',
        desc: 'Crush target skull with axe, causing bleed.',
        icon: images['barbarian_cleave'],
        cooldown: 4,
        duration: 'short',
        range: 'close',
        type: 'damage',
        effect: { type: 'bleed', chance: 100, duration: 2 }
    },
    barbarian_axe_throw: {
        id: 'barbarian_axe_throw',
        tier: 2,
        name: 'Axe Throw',
        desc: 'Hurl a spinning axe at the target.',
        icon: images['barbarian_axe_throw'],
        cooldown: 2,
        duration: 'instant',
        range: 'medium',
        type: 'damage'
    },
    barbarian_berserker: {
        id: 'barbarian_berserker',
        tier: 1,
        name: 'Berserker',
        desc: 'Enter a state of absolute fury.',
        icon: images['barbarian_berserker'],
        cooldown: 12,
        duration: 'long',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['atk'],
                amounts: [12]
            }
        }
    },
    barbarian_leap_attack: {
        id: 'barbarian_leap_attack',
        tier: 2,
        name: 'Leap Attack',
        desc: 'Leap onto target, knocking back and stunning.',
        icon: images['barbarian_leap_attack'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'damage',
        effect: { type: 'stun', chance: 100, duration: 2 }
    },

    // === MONK ===
    monk_ethereal_speed: {
        id: 'monk_ethereal_speed',
        tier: 1,
        name: 'Ethereal Speed',
        desc: 'Flow like wind, gaining extreme speed.',
        icon: images['monk_ethereal_speed'],
        cooldown: 6,
        duration: 'short',
        range: 'self',
        type: 'buff',
        effect: ['buff_self']
    },
    monk_astral_focus: {
        id: 'monk_astral_focus',
        tier: 3,
        name: 'Astral Focus',
        desc: 'Enter astral focus, boosting concentration.',
        icon: images['monk_astral_focus'],
        cooldown: 12,
        duration: 'short',
        range: 'self',
        type: 'buff'
    },
    monk_astral_projection: {
        id: 'monk_astral_projection',
        tier: 3,
        name: 'Astral Projection',
        desc: 'Project spirit forward to strike.',
        icon: images['monk_astral_projection'],
        cooldown: 4,
        duration: 'instant',
        range: 'medium',
        type: 'damage'
    },
    monk_force_punch_flurry: {
        id: 'monk_force_punch_flurry',
        tier: 2,
        name: 'Force Punch Flurry',
        desc: 'Unleash a flurry of force punches.',
        icon: images['monk_force_punch_flurry'],
        cooldown: 6,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    monk_third_eye: {
        id: 'monk_third_eye',
        tier: 3,
        name: 'Third Eye',
        desc: 'Open third eye, doubling evasion.',
        icon: images['monk_third_eye'],
        cooldown: 10,
        duration: 'short',
        range: 'self',
        type: 'buff'
    },
    monk_twin_finger_authority: {
        id: 'monk_twin_finger_authority',
        tier: 3,
        name: 'Twin Finger Authority',
        desc: 'Strike critical chakra points, stunning and weakening the target\'s resolve.',
        icon: images['monk_twin_finger_authority'],
        cooldown: 8,
        duration: 'short',
        range: 'close',
        type: 'damage/debuff',
        mentalityDebuff: true,
        power: 45,
        effect: { type: 'twin_finger_stun', duration: 3, atkReductionPercent: 20 }
    },
    monk_inner_fire: {
        id: 'monk_inner_fire',
        tier: 4,
        name: 'Inner Fire',
        desc: 'Awaken the inner blaze for fiery attacks.',
        icon: images['monk_inner_fire'],
        cooldown: 12,
        duration: 'long',
        range: 'self',
        type: 'buff',
        effect: ['buff_self'],
        buff: {
            increase_stats: {
                stats: ['atk'],
                amounts: [10]
            }
        }
    },
    monk_meditate: {
        id: 'monk_meditate',
        tier: 1,
        name: 'Meditate',
        desc: 'Restores chi and heals deep wounds.',
        icon: images['monk_meditate'],
        cooldown: 8,
        duration: 'instant',
        range: 'self',
        type: 'heal',
        damage: -25
    },
    monk_whirlwind: {
        id: 'monk_whirlwind',
        tier: 2,
        name: 'Whirlwind',
        desc: 'Attack all adjacent units in a spin.',
        icon: images['monk_whirlwind'],
        cooldown: 6,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    monk_force_punch: {
        id: 'monk_force_punch',
        tier: 1,
        name: 'Force Punch',
        desc: 'Concentrate force to strike.',
        icon: images['monk_force_punch'],
        cooldown: 2,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    monk_flurry: {
        id: 'monk_flurry',
        tier: 1,
        name: 'Flurry',
        desc: 'Unleash a rapid flurry of strikes.',
        icon: images['monk_flurry'],
        cooldown: 2,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    monk_punch: {
        id: 'monk_punch',
        tier: 1,
        name: 'Punch',
        desc: 'Deliver a powerful, centered chi punch.',
        icon: images['monk_punch'],
        cooldown: 0,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },

    // === SUMMONER ===
    open_rift: {
        id: 'open_rift',
        tier: 3,
        name: 'Open the Rift',
        desc: 'Summon a rift portal for 3 long durations.',
        icon: images['open_rift_icon'],
        cooldown: 12,
        duration: '3x-long',
        range: 'medium',
        type: 'utility'
    },
    summon_skeleton: {
        id: 'summon_skeleton',
        tier: 1,
        name: 'Summon Skeleton',
        desc: 'Summon a skeleton warrior to the field.',
        icon: images['summon_skeleton_icon'],
        cooldown: 6,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_imp: {
        id: 'summon_imp',
        tier: 1,
        name: 'Summon Imp',
        desc: 'Summon a fiery imp minion.',
        icon: images['summon_imp_icon'],
        cooldown: 6,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_skeleton_knight: {
        id: 'summon_skeleton_knight',
        tier: 2,
        name: 'Summon Skeleton Knight',
        desc: 'Summon a heavily armored skeleton knight.',
        icon: images['summon_skeleton_knight_icon'],
        cooldown: 10,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_zombie: {
        id: 'summon_zombie',
        tier: 2,
        name: 'Summon Zombie',
        desc: 'Summon a plague-carrying zombie.',
        icon: images['summon_zombie_icon'],
        cooldown: 10,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_ghoul: {
        id: 'summon_ghoul',
        tier: 2,
        name: 'Summon Ghoul',
        desc: 'Summon a ravenous flesh-eating ghoul.',
        icon: images['summon_ghoul_icon'],
        cooldown: 10,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_imp_army: {
        id: 'summon_imp_army',
        tier: 3,
        name: 'Summon Imp Army',
        desc: 'Summon a swarm of imp minions.',
        icon: images['summon_imp_army_icon'],
        cooldown: 14,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_skeleton_army: {
        id: 'summon_skeleton_army',
        tier: 3,
        name: 'Summon Skeleton Army',
        desc: 'Summon a legion of skeleton warriors.',
        icon: images['summon_skeleton_army_icon'],
        cooldown: 14,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summon_devil: {
        id: 'summon_devil',
        tier: 4,
        name: 'Summon Devil',
        desc: 'Summon a high devil minion.',
        icon: images['summon_devil_icon'],
        cooldown: 16,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summoner_duplicate: {
        id: 'summoner_duplicate',
        tier: 1,
        name: 'Duplicate',
        desc: 'Create a duplicate of the summoned minion.',
        icon: images['duplicate_icon'],
        cooldown: 4,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },
    summoner_triplicate: {
        id: 'summoner_triplicate',
        tier: 3,
        name: 'Triplicate',
        desc: 'Create two duplicates of the summoned minion.',
        icon: images['triplicate_icon'],
        cooldown: 8,
        duration: 'instant',
        range: 'medium',
        type: 'utility'
    },

    // === MONSTERS ===
    // Goblin
    goblin_slash: {
        id: 'goblin_slash',
        tier: 1,
        name: 'Slash',
        desc: 'Execute a claw strike.',
        icon: images['claw_strike'],
        cooldown: 0,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    goblin_bite: {
        id: 'goblin_bite',
        tier: 1,
        name: 'Bite',
        desc: 'Savage bite attack.',
        icon: images['monster_bite'],
        cooldown: 4,
        duration: 'short',
        range: 'close',
        type: 'damage',
        effect: { type: 'bleed', chance: 100, duration: 2 }
    },
    claw_strike: {
        id: 'claw_strike',
        tier: 1,
        name: 'Claw Strike',
        desc: 'Execute a savage claw strike.',
        icon: images['claw_strike'],
        cooldown: 0,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    bite: {
        id: 'bite',
        tier: 1,
        name: 'Bite',
        desc: 'Savage bite attack.',
        icon: images['monster_bite'],
        cooldown: 4,
        duration: 'short',
        range: 'close',
        type: 'damage',
        effect: { type: 'bleed', chance: 40, duration: 2 }
    },
    // Skeleton
    reassembly: {
        id: 'reassembly',
        tier: 1,
        name: 'Reassembly',
        desc: 'Collapse and reassemble upon death.',
        icon: images['reassembly'],
        cooldown: 12,
        duration: 'long',
        range: 'self',
        type: 'passive',
        isPassive: true
    },
    // Mummy
    induce_fear: {
        id: 'induce_fear',
        tier: 1,
        name: 'Induce Fear',
        desc: 'Scream, filling targets with dread. Reduces ATK and DEF.',
        icon: images['induce_fear'],
        cooldown: 16,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        mentalityDebuff: true,
        power: 30,
        effect: { type: 'fear', duration: 2, atkReductionPercent: 30, defReductionPercent: 30 }
    },
    energy_drain: {
        id: 'energy_drain',
        tier: 1,
        name: 'Energy Drain',
        desc: 'Drain vitality from target at range.',
        icon: images['energy_drain'],
        cooldown: 6,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'poison', chance: 100, duration: 2 }
    },
    // Ogre
    stomp: {
        id: 'stomp',
        tier: 1,
        name: 'Stomp',
        desc: 'Leap and slam, stunning adjacent units.',
        icon: images['stomp'],
        cooldown: 8,
        duration: 'short',
        range: 'close',
        type: 'damage',
        effect: { type: 'stun', chance: 100, duration: 2 }
    },
    head_butt: {
        id: 'head_butt',
        tier: 1,
        name: 'Headbutt',
        desc: 'Powerful headbutt pushing target back.',
        icon: images['head_butt'],
        cooldown: 6,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    // Vampire
    vampiric_bite: {
        id: 'vampiric_bite',
        tier: 1,
        name: 'Vampiric Bite',
        desc: 'Savage bite that drains vitality.',
        icon: images['vampiric_bite'],
        cooldown: 4,
        duration: 'instant',
        range: 'close',
        type: 'damage',
        damage: 15,
        effect: { type: 'bleed', chance: 100, duration: 'medium' }
    },
    bat_fly: {
        id: 'bat_fly',
        tier: 1,
        name: 'Bat Fly',
        desc: 'Transform into bats to relocate.',
        icon: images['bat_fly'],
        cooldown: 8,
        duration: 'instant',
        range: 'far',
        type: 'utility'
    },
    crimson_sight: {
        id: 'crimson_sight',
        tier: 1,
        name: 'Crimson Sight',
        desc: 'Pierce the target\'s mind, exposing critical vulnerabilities and reducing their defense.',
        icon: images['crimson_sight'],
        cooldown: 10,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        mentalityDebuff: true,
        power: 25,
        effect: { type: 'crimson_sight', duration: 3, defReductionPercent: 40 }
    },
    soul_suck: {
        id: 'soul_suck',
        tier: 3,
        name: 'Soul Suck',
        desc: 'Drain target\'s soul energy.',
        icon: images['soul_suck'],
        cooldown: 12,
        duration: 'short',
        range: 'medium',
        type: 'damage/debuff',
        effect: { type: 'stun', chance: 10, duration: 4 }
    },
    // Djinn
    betrayal: {
        id: 'betrayal',
        tier: 1,
        name: 'Betrayal',
        desc: 'Sow discord in the target\'s mind, forcing them to switch sides and fight their allies.',
        icon: images['betrayal'],
        cooldown: 12,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        mentalityDebuff: true,
        power: 50,
        effect: { type: 'betrayal', duration: 4 }
    },
    arcane_barrier: {
        id: 'arcane_barrier',
        tier: 1,
        name: 'Arcane Barrier',
        desc: 'Shield in pure arcane force.',
        icon: images['arcane_barrier'],
        cooldown: 10,
        duration: 'long',
        range: 'self',
        type: 'buff'
    },
    death_missile: {
        id: 'death_missile',
        tier: 1,
        name: 'Death Missile',
        desc: 'Fires skull missile that curses target.',
        icon: images['death_missile'],
        cooldown: 8,
        duration: 'short',
        range: 'far',
        type: 'debuff',
        effect: { type: 'poison', chance: 100, duration: 2 }
    },
    bind: {
        id: 'bind',
        tier: 1,
        name: 'Bind',
        desc: 'Restrict target movement with psychic shackles.',
        icon: images['bind'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        mentalityDebuff: true,
        power: 35,
        effect: { type: 'ensnared', duration: 2 }
    }
};

export default skillsMatrix;
