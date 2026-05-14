import * as images from './images';

// Attack cooldowns are authored in eras to stay aligned with combat tick speed.
// Existing values are normalized so current timings at the default speed stay intact.

const attacksMatrix = {
    claws: {
        name: 'claws',
        type: 'cutting',
        range: 'close',
        icon: images['claws'],
        cooldown: 1.5,
    },
    bite: {
        name: 'bite',
        type: 'cutting',
        icon: images['bite'],
        range: 'close',
        cooldown: 1.5,
        effect: { type: 'bleed', chance: 40, duration: 5 }
    },
    crush: {
        name: 'crush',
        type: 'crushing',
        icon: images['crushing'],
        range: 'close',
        cooldown: 2.5,
        effect: { type: 'stun', chance: 40, duration: 5 }
    },
    tackle: {
        name: 'tackle',
        type: 'crushing',
        icon: images['tackle'],
        range: 'close',
        cooldown: 2,
        effect: { type: 'stun', chance: 30, duration: 3 }
    },
    grasp: {
        name: 'grasp',
        type: 'crushing',
        icon: images['grasp'],
        isGif: true,
        range: 'close',
        cooldown: 1.5,
        effect: { type: 'stun', chance: 20, duration: 2 },
    },
    energy_drain: {
        name: 'energy drain',
        type: 'curse',
        icon: images['energy_drain'],
        range: 'medium',
        cooldown: 1.5,
        effect: { type: 'energy drain', chance: 100, duration: 4 },
    },
    fire_breath: {
        name: 'fire breath',
        type: 'fire',
        icon: images['fire_breath'],
        range: 'medium',
        cooldown: 1.5,
    },
    void_lance: {
        name: 'void lance',
        icon: images['void_lance'],
        type: 'psionic',
        range: 'medium',
        cooldown: 1.5,
    },
    energy_blast: {
        name: 'energy blast',
        type: 'arcane',
        range: 'far',
        icon: images['void_lance'],
        cooldown: 3,
    },
    lightning: {
        name: 'lightning',
        type: 'electricity',
        icon: images['lightning'],
        range: 'far',
        cooldown: 1.5,
    },
    sword_swing: {
        name: 'sword swing',
        type: 'cutting',
        range: 'close',
        icon: images['sword'],
        cooldown: 1,
    },
    sword_thrust: {
        name: 'sword thrust',
        type: 'cutting',
        range: 'close',
        icon: images['sword'],
        cooldown: 1,
    },
    dragon_punch: {
        name: 'dragon punch',
        type: 'crushing',
        range: 'close',
        icon: images['hand_7'],
        cooldown: 1.5,
    },
    meditate: {
        name: 'meditate',
        type: 'buff',
        range: 'self',
        icon: images['buckler'],
        cooldown: 1.5,
    },
    heal: {
        name: 'heal',
        type: 'buff',
        range: 'close',
        icon: images['buckler'],
        cooldown: 1.5,
    },
    fire_arrow: {
        name: 'fire arrow',
        type: 'fire',
        range: 'far',
        icon: images['bow_and_arrow'],
        cooldown: 1,
    },
    axe_throw: {
        name: 'axe throw',
        type: 'cutting',
        range: 'medium',
        icon: images['axe'],
        cooldown: 1,
    },
    axe_swing: {
        name: 'axe swing',
        type: 'cutting',
        range: 'close',
        icon: images['axe'],
        cooldown: 0.5,
    },
    spear_throw: {
        name: 'spear throw',
        type: 'cutting',
        range: 'far',
        icon: images['spear'],
        cooldown: 1.6,
    },
    flying_lotus: {
        name: 'flying lotus',
        type: 'crushing',
        range: 'medium',
        icon: images['scepter'],
        cooldown: 2.25,
    },
    shield_bash: {
        name: 'shield bash',
        type: 'crushing',
        range: 'close',
        icon: images['buckler'],
        cooldown: 2.25,
    },
    cane_strike: {
        name: 'cane strike',
        type: 'crushing',
        range: 'far',
        icon: images['scepter'],
        cooldown: 1.5,
    },
    dagger_stab: {
        name: 'dagger_stab',
        type: 'cutting',
        range: 'close',
        icon: images['sword'],
        cooldown: 1,
    },
    snake_strike: {
        name: 'snake_strike',
        type: 'cutting',
        range: 'medium',
        icon: images['sword'],
        cooldown: 1,
    }
};

export default attacksMatrix;
