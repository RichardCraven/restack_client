function copy(item){
    // Guard against undefined/null inputs — JSON.stringify(undefined) -> undefined
    // which makes JSON.parse throw. Return null for missing items so callers
    // can choose to skip them.
    if (item === undefined || item === null) return null;
    return JSON.parse(JSON.stringify(item));
}
const swords = [
    'longsword_sword',
    'broadsword_sword',
    'golden_gladius_sword',
    'claymore_sword',
    'katana_sword',
    'falchion_sword',
    'cutlass_sword',
    'gladius_sword',
    'greatsword_sword',
    'shortsword_sword',
    'wyrmsbane_sword',
    'doomreaver_sword',
    'nightfall_sword',
    'dreadedge_sword',
    'sunsteel_sword',
    'voidrender_sword',
    'warlords_cleaver_sword',
    'emberbrand_sword',
    'frostbite_sword',
    'bloodsong_sword',
    'shadowfang_sword',
    'skymourne_sword',
    'opalveil_sword',
    'titans_claw_sword',
    'entropy_sword',
]

const axes = [
    'woodcutters_axe',
    'bloodcleaver_axe',
    'hillbiter_axe',
    'ironcleaver_axe',
    'rune_axe',
    'timberfall_axe',
    'grovehack_axe',
    'stormsplitter_axe',
    'bonecutter_axe',
    'frostedge_axe',
    'emberchop_axe',
    'razorfang_axe',
    'stonebreaker_axe',
    'mossreaper_axe',
    'warcleaver_axe',
    'blackroot_axe',
    'dawnsplitter_axe',
    'duskbane_axe',
    'thunderhewer_axe',
    'skullsplitter_axe',
    'giantsbane_axe',
    'vinecutter_axe',
    'obsidian_axe',
    'ashwood_axe',
    'drakebane_axe'
];

export function InventoryManager(){
    this.tiles = [];
    this.gold = 0;
    this.shimmering_dust = 0;
    this.totems = 0;

    this.amulets_names = [
        'evilai_amulet',
        'lundi_amulet',
        'nukta_amulet',
        'sayan_amulet'
    ]
    this.charms_names = [
        'beetle_charm',
        'demonskull_charm',
        'evilai_charm',
        'hamsa_charm',
        'lundi_charm',
        'nukta_charm',
        'scarab_charm'
    ]
    this.shields_names = [
        'seeing_shield',
        'basic_shield'
    ]
    this.masks_names = [
        'bundu_mask',
        'court_mask',
        'lundi_mask',
        'mardi_mask',
        'solomon_mask',
        'zul_mask'
    ]
    this.helms_names = [
        'basic_helm',
        'knight_helm',
        'spartan_helm',
        'legionaire_helm',
        'cretan_helm'
    ]
    this.wands_names = [
        'glindas_wand',
        'volkas_wand',
        'maerlyns_rod'
    ]
    this.misc_names = [
        'crown',
        'lantern'
    ]
    this.keys_names = [
        'ornate_key',
        'minor_key',
        'major_key'
    ]
    this.weapons_names = axes.concat([
        'flail',
        'spear',
        'sword',
        'longbow',
        'scepter',
    'longsword_sword',
    'broadsword_sword',
    'golden_gladius_sword',
    'claymore_sword',
    'katana_sword',
    'falchion_sword',
    'cutlass_sword',
    'gladius_sword',
    'greatsword_sword',
    'shortsword_sword',
    'wyrmsbane_sword',
    'doomreaver_sword',
    'nightfall_sword',
    'dreadedge_sword',
    'sunsteel_sword',
    'voidrender_sword',
    'warlords_cleaver_sword',
    'emberbrand_sword',
    'frostbite_sword',
    'bloodsong_sword',
    'shadowfang_sword',
    'skymourne_sword',
    'opalveil_sword',
    'titans_claw_sword',
    'entropy_sword',
    ]);
    this.potions_names = [
        'minor_health_potion',
        'major_health_potion',
        'grand_health_potion',
    ]

    const GATES = [
        {
            key: 'archway',
            requires: ''
        },
        {
            key: 'dungeon_door',
            requires: 'minor_key'
        },
        {
            key: 'gryphon_gate',
            requires: 'major_key'
        },
        {
            key: 'bat_gate',
            requires: 'major_key'
        },
        {
            key: 'evil_gate',
            requires: 'ornate_key'
        }
      ]
    this.consumables = {
        minor_health_potion: {
            effect: 'health gain',
            amount: 20,
            icon: 'potion',
            type: 'consumable',
            name: 'minor health potion',
            equippedBy: null,
            animation: null,
            description: 'Minor health potions replenish 10% total hp'
        },
        major_health_potion: {
            effect: 'health gain',
            amount: 40,
            icon: 'potion',
            type: 'consumable',
            name: 'major health potion',
            equippedBy: null,
            animation: null,
            description: 'Major health potions replenish 35% total hp'
        },
        grand_health_potion: {
            effect: 'health gain',
            amount: 100,
            icon: 'potion',
            type: 'consumable',
            name: 'grand health potion',
            equippedBy: null,
            animation: null,
            description: 'Grand health potions replenish 70% total hp'
        },
        minor_key: {
            effect: 'key',
            type: 'key',
            icon: 'minor_key',
            name: 'minor key',
            animation: null,
            description: 'Minor keys open locked dungeon doors'
        },
        major_key: {
            effect: 'key',
            type: 'key',
            icon: 'major_key',
            name: 'major key',
            animation: null,
            description: 'Major keys open bat gates and gryphon gates'
        },
        ornate_key: {
            effect: 'key',
            type: 'key',
            icon: 'ornate_key',
            name: 'ornate key',
            animation: null,
            description: 'Orante keys open void gates and planar gates'
        },
    }
    this.weapons = {
    /* named axes mapped to numbered axe icons */
    woodcutters_axe: { damage: 30, icon: 'axe_1', type: 'weapon', subtype: 'cutting', tier: 1, name: "Woodcutter's Axe", range: 'close', equippedBy: null, animation: null, description: "A sturdy woodcutter's axe (30 percent points)" },
    bloodcleaver_axe: { damage: 32, icon: 'axe_2', type: 'weapon', subtype: 'cutting', tier: 1, name: "Bloodcleaver Axe", range: 'close', equippedBy: null, animation: null, description: 'A vicious cleaver (32 percent points)' },
    hillbiter_axe: { damage: 34, icon: 'axe_3', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Hillbiter Axe', range: 'close', equippedBy: null, animation: null, description: 'A hillbiter axe (34 percent points)' },
    ironcleaver_axe: { damage: 36, icon: 'axe_4', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Ironcleaver Axe', range: 'close', equippedBy: null, animation: null, description: 'An iron cleaver (36 percent points)' },
    rune_axe: { damage: 38, icon: 'axe_5', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Rune Axe', range: 'close', equippedBy: null, animation: null, description: 'A rune-etched axe (38 percent points)' },
    timberfall_axe: { damage: 40, icon: 'axe_6', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Timberfall Axe', range: 'close', equippedBy: null, animation: null, description: 'A timberfall axe (40 percent points)' },
    grovehack_axe: { damage: 42, icon: 'axe_7', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Grovehack Axe', range: 'close', equippedBy: null, animation: null, description: 'A grovehack axe (42 percent points)' },
    stormsplitter_axe: { damage: 44, icon: 'axe_8', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Stormsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A stormsplitter axe (44 percent points)' },
    bonecutter_axe: { damage: 46, icon: 'axe_9', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Bonecutter Axe', range: 'close', equippedBy: null, animation: null, description: 'A bonecutter axe (46 percent points)' },
    frostedge_axe: { damage: 48, icon: 'axe_10', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Frostedge Axe', range: 'close', equippedBy: null, animation: null, description: 'A frostedge axe (48 percent points)' },
    emberchop_axe: { damage: 50, icon: 'axe_11', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Emberchop Axe', range: 'close', equippedBy: null, animation: null, description: 'An emberchop axe (50 percent points)' },
    
    razorfang_axe: { damage: 72, icon: 'axe_12', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Razorfang Axe', range: 'close', equippedBy: null, animation: null, description: 'A razorfang axe (52 percent points)' },
    stonebreaker_axe: { damage: 74, icon: 'axe_13', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Stonebreaker Axe', range: 'close', equippedBy: null, animation: null, description: 'A stonebreaker axe (54 percent points)' },
    mossreaper_axe: { damage: 80, icon: 'axe_14', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Mossreaper Axe', range: 'close', equippedBy: null, animation: null, description: 'A mossreaper axe (56 percent points)' },
    warcleaver_axe: { damage: 86, icon: 'axe_15', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Warcleaver Axe', range: 'close', equippedBy: null, animation: null, description: 'A warcleaver axe (58 percent points)' },
    blackroot_axe: { damage: 90, icon: 'axe_16', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Blackroot Axe', range: 'close', equippedBy: null, animation: null, description: 'A blackroot axe (60 percent points)' },
    dawnsplitter_axe: { damage: 95, icon: 'axe_17', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Dawnsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A dawnsplitter axe (62 percent points)' },
    duskbane_axe: { damage: 100, icon: 'axe_18', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Duskbane Axe', range: 'close', equippedBy: null, animation: null, description: 'A dusk-bane axe (64 percent points)' },

    thunderhewer_axe: { damage: 120, icon: 'axe_19', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Thunderhewer Axe', range: 'close', equippedBy: null, animation: null, description: 'A thunderhewer axe (66 percent points)' },
    skullsplitter_axe: { damage: 140, icon: 'axe_20', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Skullsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A skullsplitter axe (68 percent points)' },
    giantsbane_axe: { damage: 160, icon: 'axe_21', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Giantsbane Axe', range: 'close', equippedBy: null, animation: null, description: 'A giantsbane axe (70 percent points)' },
    vinecutter_axe: { damage: 170, icon: 'axe_22', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Vinecutter Axe', range: 'close', equippedBy: null, animation: null, description: 'A vinecutter axe (72 percent points)' },
    obsidian_axe: { damage: 180, icon: 'axe_23', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Obsidian Axe', range: 'close', equippedBy: null, animation: null, description: 'An obsidian axe (74 percent points)' },
    ashwood_axe: { damage: 190, icon: 'axe_24', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Ashwood Axe', range: 'close', equippedBy: null, animation: null, description: 'An ashwood axe (76 percent points)' },
    drakebane_axe: { damage: 200, icon: 'axe_25', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Drakebane Axe', range: 'close', equippedBy: null, animation: null, description: 'A drakebane axe (78 percent points)' },

    
    shortsword_sword: { damage: 25, icon: 'shortsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'shortsword', range: 'close', equippedBy: null, animation: null, description: 'The shortsword does 25 (percent points)' },
    cutlass_sword: { damage: 30, icon: 'cutlass', type: 'weapon', subtype: 'cutting', tier: 1, name: 'cutlass', range: 'close', equippedBy: null, animation: null, description: 'The cutlass does 30 (percent points)' },
    gladius_sword: { damage: 40, icon: 'gladius', type: 'weapon', subtype: 'cutting', tier: 1, name: 'gladius', range: 'close', equippedBy: null, animation: null, description: 'The gladius does 40 (percent points)' },
    falchion_sword: { damage: 45, icon: 'falchion', type: 'weapon', subtype: 'cutting', tier: 1, name: 'falchion', range: 'close', equippedBy: null, animation: null, description: 'The falchion does 45 (percent points)' },
    longsword_sword: { damage: 45, icon: 'longsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'longsword', range: 'close', equippedBy: null, animation: null, description: 'The longsword does 45 (percent points)' },
    broadsword_sword: { damage: 50, icon: 'broadsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'broadsword', range: 'close', equippedBy: null, animation: null, description: 'The broadsword does 50 (percent points)' },
    golden_gladius_sword: { damage: 55, icon: 'gladius', type: 'weapon', subtype: 'cutting', tier: 1, name: 'gladius', range: 'close', equippedBy: null, animation: null, description: 'The gladius does 40 (percent points)' },
    wyrmsbane_sword: { damage: 52, icon: 'wyrmsbane', type: 'weapon', subtype: 'cutting', tier: 1, name: 'wyrmsbane', range: 'close', equippedBy: null, animation: null, description: 'The wyrmsbane does 52 (percent points)' },
    katana_sword: { damage: 55, icon: 'katana', type: 'weapon', subtype: 'cutting', tier: 1, name: 'katana', range: 'close', equippedBy: null, animation: null, description: 'The katana does 55 (percent points)' },
    claymore_sword: { damage: 60, icon: 'claymore', type: 'weapon', subtype: 'cutting', tier: 1, name: 'claymore', range: 'close', equippedBy: null, animation: null, description: 'The claymore does 60 (percent points)' },
    greatsword_sword: { damage: 70, icon: 'greatsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'greatsword', range: 'close', equippedBy: null, animation: null, description: 'The greatsword does 70 (percent points)' },
    doomreaver_sword: { damage: 78, icon: 'doomreaver', type: 'weapon', subtype: 'cutting', tier: 2, name: 'doomreaver', range: 'close', equippedBy: null, animation: null, description: 'The doomreaver does 78 (percent points)' },
    nightfall_sword: { damage: 82, icon: 'nightfall', type: 'weapon', subtype: 'cutting', tier: 2, name: 'nightfall', range: 'close', equippedBy: null, animation: null, description: 'The nightfall does 82 (percent points)' },
    dreadedge_sword: { damage: 88, icon: 'dreadedge', type: 'weapon', subtype: 'cutting', tier: 2, name: 'dreadedge', range: 'close', equippedBy: null, animation: null, description: 'The dreadedge does 88 (percent points)' },
    sunsteel_sword: { damage: 95, icon: 'sunsteel', type: 'weapon', subtype: 'cutting', tier: 2, name: 'sunsteel', range: 'close', equippedBy: null, animation: null, description: 'The sunsteel does 95 (percent points)' },
    voidrender_sword: { damage: 100, icon: 'voidrender', type: 'weapon', subtype: 'cutting', tier: 2, name: 'voidrender', range: 'close', equippedBy: null, animation: null, description: 'The voidrender does 100 (percent points)' },
    warlords_cleaver_sword: { damage: 105, icon: 'warlords_cleaver', type: 'weapon', subtype: 'cutting', tier: 2, name: 'warlords_cleaver', range: 'close', equippedBy: null, animation: null, description: 'The warlords_cleaver does 105 (percent points)' },
    emberbrand_sword: { damage: 110, icon: 'emberbrand', type: 'weapon', subtype: 'cutting', tier: 2, name: 'emberbrand', range: 'close', equippedBy: null, animation: null, description: 'The emberbrand does 110 (percent points)' },
    frostbite_sword: { damage: 130, icon: 'frostbite', type: 'weapon', subtype: 'cutting', tier: 3, name: 'frostbite', range: 'close', equippedBy: null, animation: null, description: 'The frostbite does 130 (percent points)' },
    bloodsong_sword: { damage: 140, icon: 'bloodsong', type: 'weapon', subtype: 'cutting', tier: 3, name: 'bloodsong', range: 'close', equippedBy: null, animation: null, description: 'The bloodsong does 140 (percent points)' },
    shadowfang_sword: { damage: 150, icon: 'shadowfang', type: 'weapon', subtype: 'cutting', tier: 3, name: 'shadowfang', range: 'close', equippedBy: null, animation: null, description: 'The shadowfang does 150 (percent points)' },
    skymourne_sword: { damage: 160, icon: 'skymourne', type: 'weapon', subtype: 'cutting', tier: 3, name: 'skymourne', range: 'close', equippedBy: null, animation: null, description: 'The skymourne does 160 (percent points)' },
    opalveil_sword: { damage: 170, icon: 'opalveil', type: 'weapon', subtype: 'cutting', tier: 3, name: 'opalveil', range: 'close', equippedBy: null, animation: null, description: 'The opalveil does 170 (percent points)' },
    titans_claw_sword: { damage: 180, icon: 'titans_claw', type: 'weapon', subtype: 'cutting', tier: 3, name: 'titans_claw', range: 'close', equippedBy: null, animation: null, description: 'The titans_claw does 180 (percent points)' },
    entropy_sword: { damage: 190, icon: 'entropy', type: 'weapon', subtype: 'cutting', tier: 3, name: 'entropy', range: 'close', equippedBy: null, animation: null, description: 'The entropy does 190 (percent points)' },
    // flail: {
    //         damage: 50,
    //         icon: 'flail',
    //         type: 'weapon',
    //         subtype: 'crushing',
    //         name: 'flail',
    //         range: 'close',
    //         equippedBy: null,
    //         animation: null,
    //         description: 'The basic flail does 50 (percent points)'
    // },
    // spear: {
    //     damage: 50,
    //     icon: 'spear',
    //     type: 'weapon',
    //     subtype: 'cutting',
    //     name: 'spear',
    //     range: 'medium',
    //     equippedBy: null,
    //     animation: null,
    //     description: 'The basic spear does 50 (percent points)'
    // },
    // sword: {
    //     damage: 40,
    //     icon: 'sword',
    //     type: 'weapon',
    //     subtype: 'cutting',
    //     name: 'sword',
    //     range: 'close',
    //     equippedBy: null,
    //     animation: null,
    //     description: 'The basic sword does 40 (percent points)'
    // },
    // scimitar: {
    //     damage: 30,
    //     icon: 'scimitar',
    //     type: 'weapon',
    //     subtype: 'cutting',
    //     name: 'scimitar',
    //     range: 'close',
    //     equippedBy: null,
    //     animation: null,
    //     description: 'The basic scimitar does 30 (percent points)'
    // },
    // scepter: {
    //     damage: 30,
    //     icon: 'scepter',
    //     type: 'weapon',
    //     subtype: 'crushing',
    //     name: 'scepter',
    //     range: 'close',
    //     equippedBy: null,
    //     animation: null,
    //     description: 'The basic scepter does 30 (percent points)'
    // },
    // longbow: {
    //     damage: 30,
    //     icon: 'longbow',
    //     type: 'weapon',
    //     subtype: 'cutting',
    //     name: 'longbow',
    //     range: 'far',
    //     equippedBy: null,
    //     animation: null,
    //     description: 'The basic longbow does 30 (percent points)'
    // },
    }
    
    this.armor= {
        basic_helm: {
            armor: 30,
            type: 'armor',
            icon: 'basic_helm',
            name: 'basic helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: 'The basic helm absorbs 30 (percent points)'
        },
        cretan_helm: {
            armor: 40,
            type: 'armor',
            icon: 'cretan_helm',
            name: 'cretan helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: 'The cretan helm absorbs 40 (percent points)'
        },
        knight_helm: {
            armor: 50,
            type: 'armor',
            icon: 'knight_helm',
            name: 'knight helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: `The knight's helm absorbs 50 (percent points)`
        },
        legionaire_helm: {
            armor: 60,
            type: 'armor',
            icon: 'legionaire_helm',
            name: 'legionaire helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: `The legionaire's helm absorbs 60 (percent points)`
        },
        spartan_helm: {
            armor: 70,
            type: 'armor',
            icon: 'spartan_helm',
            name: 'spartan helm',
            equippedBy: null,
            animation: null,
            subtype: 'helm',
            description: `The spartan's helm absorbs 70 (percent points)`
        },
        basic_shield: {
            armor: 40,
            type: 'armor',
            subtype: 'shield',
            icon: 'basic_shield',
            name: 'basic shield',
            equippedBy: null,
            animation: null,
            description: `The basic shield absorbs 40 (percent points)`
        },
        seeing_shield: {
            armor: 60,
            type: 'armor',
            subtype: 'shield',
            icon: 'seeing_shield',
            name: 'seeing shield',
            equippedBy: null,
            animation: null,
            description: `The seeing shield absorbs 60 (percent points), and increases sight radius by 1`
        }
    }
    
    this.magical = {
        glindas_wand: {
            type: 'magical',
            icon: 'glindas_wand',
            name: 'glindas wand',
            equippedBy: null,
            subtype: 'wand',
            power: 4,
            animation: null,
            description: `Glinda's wand has a power of 4 and has a 60% chance to cast a minor spell on use`
        },
        volkas_wand: {
            type: 'magical',
            icon: 'volkas_wand',
            name: 'volkas wand',
            equippedBy: null,
            subtype: 'wand',
            power: 6,
            animation: null,
            description: `Volka's wand has a power of 6 and has a 80% chance to cast a minor spell and a 15% chance to cast a major spell on use`
        },
        maerlyns_rod: {
            type: 'magical',
            icon: 'maerlyns_rod',
            name: 'maerlyns rod',
            equippedBy: null,
            subtype: 'wand',
            power: 10,
            animation: null,
            description: `Maerlyn's rod has a power of 10 and has a 80% chance to cast 2 major spells and a 15% chance to cast an eldritch spell on use`
        },
        //charms < charms can only be used once per battle
        beetle_charm: {
            type: 'magical',
            icon: 'beetle_charm',
            name: 'beetle charm',
            equippedBy: null,
            subtype: 'charm',
            power: 2,
            animation: null,
            description: `Beetle charms have a power of 2 and a 60% chance to cast a minor boon on use. Passive: +2 damage absorbtion for the user and all adjacent allies`
        },
        evilai_charm: {
            type: 'magical',
            icon: 'evilai_charm',
            name: 'evilai charm',
            equippedBy: null,
            subtype: 'charm',
            power: 4,
            animation: null,
            description: `Evilai charms have a power of 4 and a 100% chance to cast 2 minor boons and 1 minor curse on use. Passive: +3 damage for the user and all adjacent allies & every time user is hit, 20% chance of casting minor curse on wearer`
        },
        nukta_charm: {
            type: 'magical',
            icon: 'nukta_charm',
            name: 'nukta charm',
            equippedBy: null,
            subtype: 'charm',
            power: 6,
            animation: null,
            description: `Nukta charms have a power of 6 and a 50% chance to cast a 1 major boon. Passive: +4 dexterity for entire crew.`
        },
        lundi_charm: {
            type: 'magical',
            icon: 'lundi_charm',
            name: 'lundi charm',
            equippedBy: null,
            subtype: 'charm',
            power: 8,
            animation: null,
            description: `Lundi charms have a power of 8.  On Use: 4x(70% chance to cast minor boon) Passive: +4 dexterity for entire crew.`
        },
        hamsa_charm: {
            type: 'magical',
            icon: 'hamsa_charm',
            name: 'hamsa charm',
            equippedBy: null,
            subtype: 'charm',
            power: 9,
            animation: null,
            description: `Hamsa charms have a power of 9.  On Use: Summon 2 spirit warriors to fight for you Passive: On being hit, 20% to negate and teleport back 1 space, applies to entire crew.`
        },
        scarab_charm: {
            type: 'magical',
            icon: 'scarab_charm',
            name: 'scarab charm',
            equippedBy: null,
            subtype: 'charm',
            power: 10,
            animation: null,
            description: `Scarab charms have a power of 10.  On Use: Summon 1 djinn to fight for you Passive: On hit, 20% to cast minor boon, 5% chance cast major boon.`
        },
        demonskull_charm: {
            type: 'magical',
            icon: 'demonskull_charm',
            name: 'demonskull charm',
            equippedBy: null,
            subtype: 'charm',
            power: 12,
            animation: null,
            description: `Demonskull charms have a power of 12.  On Use: Cast 2 random eldritch spells Passive: Skill cooldowns are doubled, -1 to all stats for wearer.`
        },
        //amulets
        lundi_amulet: {
            type: 'magical',
            icon: 'lundi_amulet',
            name: 'lundi amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 3,
            animation: null,
            description: `Lundi amulets have a power of 3. Reflects 20% damage back on all attacks, +1 to all stats`
        },
        sayan_amulet: {
            type: 'magical',
            icon: 'sayan_amulet',
            name: 'sayan amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 5,
            animation: null,
            description: `Sayan amulets have a power of 5. Doubles intelligence for entire crew`
        },
        nukta_amulet: {
            type: 'magical',
            icon: 'nukta_amulet',
            name: 'nukta amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 7,
            animation: null,
            description: `Nukta amulets have a power of 7. On combat start, 30% chance no minions spawn`
        },
        evilai_amulet: {
            type: 'magical',
            icon: 'evilai_amulet',
            name: 'evilai amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 9,
            animation: null,
            description: `Nukta amulets have a power of 9. Doubles experience gained for wearer, -3 to all stats`
        }
    }
    // Move mask/ornament items into the magical collection so they are available
    // via the same initialization loop as other magical items. This replaces
    // the previous `this.ornaments` object.
    this.magical = Object.assign({}, this.magical, {
        mardi_mask: {
            power: 1,
            icon: 'mardi_mask',
            type: 'ancillary',
            name: 'mardi mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Court     masks have a power of 1 and a give +15 max hp. <br /> Passive: 10% chance of healing 15 hp on being hit.`
        },
        court_mask: {
            power: 1,
            icon: 'court_mask',
            type: 'ancillary',
            name: 'court mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Court masks have a power of 1 and a give +1 magic resistance to the wearer. <br /> Passive: 80% chance of negating an enemy hex if wearer is within 4 tiles of caster.`
        },
        zul_mask: {
            power: 2,
            icon: 'zul_mask',
            type: 'ancillary',
            name: 'zul mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Zul masks have a power of 2 and a give immunity from demobilization and mind control. <br /> Passive: 50% chance of negating a successful hit on wearer and teleporting to a random empty space`
        },
        bundu_mask: {
            power: 2,
            icon: 'bundu_mask',
            type: 'ancillary',
            name: 'bundu mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Bundu masks have a power of 2 and a give +2 magic resistance to the wearer. <br /> Passive: 80% chance of negating an enemy hex if wearer is within 3 tiles of caster.`
        },
        lundi_mask: {
            power: 3,
            icon: 'lundi_mask',
            type: 'ancillary',
            name: 'lundi mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Lundi masks have a power of 3 and a give +4 magic resistance to the wearer. <br /> Passive: If a boon is cast, 50% to recast after 5 seconds.`
        },
        solomon_mask: {
            power: 5,
            icon: 'solomon_mask',
            type: 'ancillary',
            name: 'solomon mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: `Solomon masks have a power of 5 and a give +10 magic resistance to the wearer. <br /> Passive: 1/2 cooldown time for all of wearer's skills, 2x gold drop.`
        }
    });
    this.misc = {
        ornate_key: {
            icon: 'ornate_key',
            type: 'key',
            name: 'ornate key',
            equippedBy: null,
            animation: null
        },
        minor_key: {
            icon: 'minor_key',
            type: 'key',
            name: 'minor key',
            equippedBy: null,
            animation: null
        },
        major_key: {
            icon: 'major_key',
            type: 'key',
            name: 'major key',
            equippedBy: null,
            animation: null
        },
        crown: {
            icon: 'crown',
            type: 'crown',
            name: 'crown',
            equippedBy: null,
            animation: null
        },
        lantern: {
            icon: 'lantern',
            type: 'lantern',
            name: 'lantern',
            equippedBy: null,
            animation: null
        }
    }
    this.allItems = {};
    this.items = this.weapons_names.concat(this.masks_names.concat(this.helms_names.concat(this.keys_names.concat(this.amulets_names.concat(this.charms_names.concat(this.wands_names.concat(this.misc_names.concat(this.shields_names))))))))
    this.initializeItems = (data = null) => {
        for(let key in this.consumables){
            this.allItems[key] = this.consumables[key]
        }
        // Masks/ornaments were merged into `this.magical` above. We no longer
        // iterate `this.ornaments` here.
        for(let key in this.armor){
            this.allItems[key] = this.armor[key]
        }
        for(let key in this.magical){
            this.allItems[key] = this.magical[key]
        }
        for(let key in this.weapons){
            this.allItems[key] = this.weapons[key]
        }
        for(let key in this.misc){
            this.allItems[key] = this.misc[key]
        }
        this.inventory = [];
        if(!data){
            this.inventory = this.getStarterPack();
            this.gold = 0
            this.shimmering_dust = 0
            this.totems = 0
        } else {
            this.inventory = data.items.map(e=> {
                const equippedBy = e.equippedBy;
                const key = (e.name || '').replaceAll(' ', '_');
                if(this.allItems[key]){
                    const v = copy(this.allItems[key]);
                    if (v) v.equippedBy = equippedBy;
                    return v;
                } else {
                    console.warn('InventoryManager: unknown saved item key:', key);
                    return null;
                }
            }).filter(v => v !== null);
            this.gold = data.gold;
            this.shimmering_dust = data.shimmering_dust;
            this.totems = data.totems;
        }
    }
    this.addItemsByName = (items) => {
        let arr = [];
        items.forEach(e=>{
            if (this.allItems[e]) {
                const v = copy(this.allItems[e]);
                if (v) arr.push(v);
            } else {
                console.warn('addItemsByName: unknown item key:', e);
            }
        })
        this.inventory = this.inventory.concat(arr);
    }
    // this.addItems = (items) => {
    //     this.inventory.concat(items)
    // }
    this.addItem = (item) => {
        this.inventory.push(item);
    }
    this.removeItemByIndex = (index) => {
        this.inventory.splice(index, 1)
    }
    this.addCurrency = (data) => {
        switch(data.type){
            case 'gold':
            this.gold += data.amount;
            break;
            case 'shimmering_dust':
            this.shimmering_dust += data.amount;
            break;
            case 'shimmering dust':
            this.shimmering_dust += data.amount;
            break;
            case 'totems':
            this.totems += data.amount;
            break;
            default:
                break;
        }
    }
    this.getStarterPack = () => {
        return [
            {
                effect: 'health gain',
                amount: 55,
                icon: 'potion',
                type: 'consumable',
                name: 'minor health potion',
                equippedBy: null
            }, 
            {
                effect: 'health gain',
                amount: 55,
                icon: 'potion',
                type: 'consumable',
                name: 'minor health potion',
                equippedBy: null
            },
        ]
    }
}