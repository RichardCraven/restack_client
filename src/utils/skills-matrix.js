import * as images from './images';

const skillsMatrix = {
    // === RANGER ===
    notch: {
        id: 'notch',
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
        name: 'Mark',
        desc: 'Place a target mark on the enemy.',
        icon: images['ranger_mark'],
        cooldown: 4,
        duration: 'long',
        range: 'far',
        type: 'debuff',
        effect: ['target_marked']
    },
    execute: {
        id: 'execute',
        name: 'Execute',
        desc: 'Shoot three arrows in rapid succession.',
        icon: images['ranger_execute'],
        cooldown: 8,
        duration: 'instant',
        range: 'far',
        type: 'damage'
    },
    ensnare: {
        id: 'ensnare',
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
        name: 'Heal',
        desc: 'Cast restorative magic on an ally.',
        icon: images['healing_hands'],
        cooldown: 4,
        duration: 'instant',
        range: 'medium',
        type: 'heal',
        damage: -30, // negative damage is healing
        regeneration_percent: 30
    },
    circle_of_protection: {
        id: 'circle_of_protection',
        name: 'Circle of Protection',
        desc: 'Create a sanctuary shielding allies.',
        icon: images['circle_of_protection'],
        cooldown: 8,
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
        name: 'Slash',
        desc: 'Execute a heavy steel blade slash.',
        icon: images['soldier_slash'],
        cooldown: 0,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    shield_wall: {
        id: 'shield_wall',
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
        name: 'Ice Blast',
        desc: 'Freeze target in a block of absolute-zero ice.',
        icon: images['ice_blast_icon'],
        cooldown: 6,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'frozen', chance: 100, duration: 2 }
    },
    magic_missile: {
        id: 'magic_missile',
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
        name: 'Acid Blast',
        desc: 'Conical green projectile that poisons the target.',
        icon: images['wizard_acid_blast'],
        cooldown: 4,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'poison', chance: 100, duration: 2 }
    },
    disintegrate: {
        id: 'disintegrate',
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
        name: 'Sleep',
        desc: 'Cast a soothing spell that puts the target to sleep.',
        icon: images['wizard_sleep'],
        cooldown: 10,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'sleep', chance: 100, duration: 2 }
    },
    annihilation: {
        id: 'annihilation',
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
        name: 'Astral Focus',
        desc: 'Enter astral focus, boosting concentration.',
        icon: images['monk_astral_focus'],
        cooldown: 4,
        duration: 'short',
        range: 'self',
        type: 'buff'
    },
    monk_astral_projection: {
        id: 'monk_astral_projection',
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
        name: 'Twin Finger Authority',
        desc: 'Strike critical chakra points.',
        icon: images['monk_twin_finger_authority'],
        cooldown: 8,
        duration: 'instant',
        range: 'close',
        type: 'damage'
    },
    monk_inner_fire: {
        id: 'monk_inner_fire',
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
        name: 'Induce Fear',
        desc: 'Scream, filling targets with dread.',
        icon: images['induce_fear'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'fear', chance: 100, duration: 2 }
    },
    energy_drain: {
        id: 'energy_drain',
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
        name: 'Vampiric Bite',
        desc: 'Savage bite that drains vitality.',
        icon: images['vampiric_bite'],
        cooldown: 4,
        duration: 'instant',
        range: 'close',
        type: 'damage',
        damage: 15
    },
    bat_fly: {
        id: 'bat_fly',
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
        name: 'Crimson Sight',
        desc: 'Perceive critical target vulnerabilities.',
        icon: images['crimson_sight'],
        cooldown: 10,
        duration: 'short',
        range: 'self',
        type: 'buff'
    },
    soul_suck: {
        id: 'soul_suck',
        name: 'Soul Suck',
        desc: 'Drain target\'s soul energy.',
        icon: images['soul_suck'],
        cooldown: 12,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'poison', chance: 100, duration: 2 }
    },
    // Djinn
    betrayal: {
        id: 'betrayal',
        name: 'Betrayal',
        desc: 'Sow discord among enemies.',
        icon: images['betrayal'],
        cooldown: 12,
        duration: 'short',
        range: 'medium',
        type: 'debuff'
    },
    arcane_barrier: {
        id: 'arcane_barrier',
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
        name: 'Bind',
        desc: 'Restrict target movement.',
        icon: images['bind'],
        cooldown: 8,
        duration: 'short',
        range: 'medium',
        type: 'debuff',
        effect: { type: 'ensnared', chance: 100, duration: 2 }
    }
};

export default skillsMatrix;
