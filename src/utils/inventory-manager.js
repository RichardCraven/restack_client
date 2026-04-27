function copy(item){
    // Guard against undefined/null inputs — JSON.stringify(undefined) -> undefined
    // which makes JSON.parse throw. Return null for missing items so callers
    // can choose to skip them.
    if (item === undefined || item === null) return null;
    return JSON.parse(JSON.stringify(item));
}
const swords = [ // eslint-disable-line no-unused-vars
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
    this.shields_names = []
    this.masks_names = [
        'bundu_mask',
        'crimson_mask',
        'court_mask',
        'lundi_mask',
        'mardi_mask',
        'seraphic_mask',
        'shadow_mask',
        'solomon_mask',
        'twilight_mask',
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
    this.staves_names = [
        'archmages_staff',
        'enchanters_staff',
        'imperial_mage_staff',
        'staff_of_espilon',
        'staff_of_marduk',
        'staff_of_omicron',
        'staff_of_tomorrow'
    ]
    this.misc_names = [
        'crown',
        'lantern'
    ]
    this.keys_names = [
        'minor_key',
        'major_key',
        'treasury_key',
        'lockbox_key',
        'necrotic_key',
        'necrotic_master_key',
        'violet_key',
        'rubicund_key',
        'cyan_key',
        'imperial_key',
        'dimensional_key'
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

    const GATES = [ // eslint-disable-line no-unused-vars
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
            description: 'Ornate keys open void gates and planar gates'
        },
        treasury_key: {
            effect: 'key',
            type: 'key',
            icon: 'treasury_key',
            name: 'treasury key',
            animation: null,
            description: 'Treasury keys unlock treasure vaults and secure chambers'
        },
        lockbox_key: {
            effect: 'key',
            type: 'key',
            icon: 'lockbox_key',
            name: 'lockbox key',
            animation: null,
            description: 'Lockbox keys open sealed lockboxes and personal caches'
        },
        necrotic_key: {
            effect: 'key',
            type: 'key',
            icon: 'necrotic_key',
            name: 'necrotic key',
            animation: null,
            description: 'Necrotic keys unlock cursed doors in undead lairs'
        },
        necrotic_master_key: {
            effect: 'key',
            type: 'key',
            icon: 'necrotic_master_key',
            name: 'necrotic master key',
            animation: null,
            description: 'Necrotic master keys open any necrotic seal or death chamber'
        },
        violet_key: {
            effect: 'key',
            type: 'key',
            icon: 'violet_key',
            name: 'violet key',
            animation: null,
            description: 'Violet keys are attuned to arcane vaults and mage towers'
        },
        rubicund_key: {
            effect: 'key',
            type: 'key',
            icon: 'rubicund_key',
            name: 'rubicund key',
            animation: null,
            description: 'Rubicund keys open fire-forged locks found in volcanic sanctums'
        },
        cyan_key: {
            effect: 'key',
            type: 'key',
            icon: 'cyan_key',
            name: 'cyan key',
            animation: null,
            description: 'Cyan keys are used to access aquatic passages and flooded vaults'
        },
        imperial_key: {
            effect: 'key',
            type: 'key',
            icon: 'imperial_key',
            name: 'imperial key',
            animation: null,
            description: 'Imperial keys grant access to grand halls and royal chambers'
        },
        dimensional_key: {
            effect: 'key',
            type: 'key',
            icon: 'dimensional_key',
            name: 'dimensional key',
            animation: null,
            description: 'Dimensional keys unlock portals between planes of existence'
        },
    }
    this.weapons = {
    /* named axes mapped to numbered axe icons */
    woodcutters_axe: { damage: 15, icon: 'axe_1', type: 'weapon', subtype: 'cutting', tier: 1, name: "Woodcutter's Axe", range: 'close', equippedBy: null, animation: null, description: "A sturdy woodcutter's axe +30% atk [Tier 1]" },
    bloodcleaver_axe: { damage: 18, icon: 'axe_2', type: 'weapon', subtype: 'cutting', tier: 1, name: "Bloodcleaver Axe", range: 'close', equippedBy: null, animation: null, description: 'A vicious cleaver +32% atk [Tier 1]' },
    hillbiter_axe: { damage: 19, icon: 'axe_3', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Hillbiter Axe', range: 'close', equippedBy: null, animation: null, description: 'A hillbiter axe +34% atk [Tier 1]' },
    ironcleaver_axe: { damage: 20, icon: 'axe_4', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Ironcleaver Axe', range: 'close', equippedBy: null, animation: null, description: 'An iron cleaver +36% atk [Tier 1]' },
    rune_axe: { damage: 22, icon: 'axe_5', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Rune Axe', range: 'close', equippedBy: null, animation: null, description: 'A rune-etched axe +38% atk [Tier 1]' },
    timberfall_axe: { damage: 24, icon: 'axe_6', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Timberfall Axe', range: 'close', equippedBy: null, animation: null, description: 'A timberfall axe +40% atk [Tier 1]' },
    grovehack_axe: { damage: 25, icon: 'axe_7', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Grovehack Axe', range: 'close', equippedBy: null, animation: null, description: 'A grovehack axe +42% atk [Tier 1]' },
    stormsplitter_axe: { damage: 26, icon: 'axe_8', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Stormsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A stormsplitter axe +44% atk [Tier 1]' },
    bonecutter_axe: { damage: 27, icon: 'axe_9', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Bonecutter Axe', range: 'close', equippedBy: null, animation: null, description: 'A bonecutter axe +46% atk [Tier 1]' },
    frostedge_axe: { damage: 28, icon: 'axe_10', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Frostedge Axe', range: 'close', equippedBy: null, animation: null, description: 'A frostedge axe +48% atk [Tier 1]' },
    emberchop_axe: { damage: 30, icon: 'axe_11', type: 'weapon', subtype: 'cutting', tier: 1, name: 'Emberchop Axe', range: 'close', equippedBy: null, animation: null, description: 'An emberchop axe +50% atk [Tier 1]' },
    
    razorfang_axe: { damage: 40, icon: 'axe_12', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Razorfang Axe', range: 'close', equippedBy: null, animation: null, description: 'A razorfang axe +52% atk [Tier 2]' },
    stonebreaker_axe: { damage: 42, icon: 'axe_13', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Stonebreaker Axe', range: 'close', equippedBy: null, animation: null, description: 'A stonebreaker axe +54% atk [Tier 2]' },
    mossreaper_axe: { damage: 44, icon: 'axe_14', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Mossreaper Axe', range: 'close', equippedBy: null, animation: null, description: 'A mossreaper axe +44% atk [Tier 2]' },
    warcleaver_axe: { damage: 46, icon: 'axe_15', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Warcleaver Axe', range: 'close', equippedBy: null, animation: null, description: 'A warcleaver axe +58% atk [Tier 2]' },
    blackroot_axe: { damage: 48, icon: 'axe_16', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Blackroot Axe', range: 'close', equippedBy: null, animation: null, description: 'A blackroot axe +60% atk [Tier 2]' },
    dawnsplitter_axe: { damage: 50, icon: 'axe_17', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Dawnsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A dawnsplitter axe +62% atk [Tier 2]' },
    duskbane_axe: { damage: 52, icon: 'axe_18', type: 'weapon', subtype: 'cutting', tier: 2, name: 'Duskbane Axe', range: 'close', equippedBy: null, animation: null, description: 'A dusk-bane axe +64% atk [Tier 2]' },

    thunderhewer_axe: { damage: 70, icon: 'axe_19', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Thunderhewer Axe', range: 'close', equippedBy: null, animation: null, description: 'A thunderhewer axe +66% atk [Tier 3]' },
    skullsplitter_axe: { damage: 74, icon: 'axe_20', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Skullsplitter Axe', range: 'close', equippedBy: null, animation: null, description: 'A skullsplitter axe +68% atk [Tier 3]' },
    giantsbane_axe: { damage: 78, icon: 'axe_21', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Giantsbane Axe', range: 'close', equippedBy: null, animation: null, description: 'A giantsbane axe +70% atk [Tier 3]' },
    vinecutter_axe: { damage: 84, icon: 'axe_22', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Vinecutter Axe', range: 'close', equippedBy: null, animation: null, description: 'A vinecutter axe +72% atk [Tier 3]' },
    obsidian_axe: { damage: 88, icon: 'axe_23', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Obsidian Axe', range: 'close', equippedBy: null, animation: null, description: 'An obsidian axe +74% atk [Tier 3]' },
    ashwood_axe: { damage: 98, icon: 'axe_24', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Ashwood Axe', range: 'close', equippedBy: null, animation: null, description: 'An ashwood axe +76% atk [Tier 3]' },
    drakebane_axe: { damage: 104, icon: 'axe_25', type: 'weapon', subtype: 'cutting', tier: 3, name: 'Drakebane Axe', range: 'close', equippedBy: null, animation: null, description: 'A drakebane axe +78% atk [Tier 3]' },

    
shortsword_sword: { damage: 25, icon: 'shortsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'shortsword', range: 'close', equippedBy: null, animation: null, description: 'The shortsword does +25% atk [Tier 1]' },
cutlass_sword: { damage: 30, icon: 'cutlass', type: 'weapon', subtype: 'cutting', tier: 1, name: 'cutlass', range: 'close', equippedBy: null, animation: null, description: 'The cutlass does +30% atk [Tier 1]' },
gladius_sword: { damage: 40, icon: 'gladius', type: 'weapon', subtype: 'cutting', tier: 1, name: 'gladius', range: 'close', equippedBy: null, animation: null, description: 'The gladius does +40% atk [Tier 1]' },
falchion_sword: { damage: 45, icon: 'falchion', type: 'weapon', subtype: 'cutting', tier: 1, name: 'falchion', range: 'close', equippedBy: null, animation: null, description: 'The falchion does +45% atk [Tier 1]' },
longsword_sword: { damage: 45, icon: 'longsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'longsword', range: 'close', equippedBy: null, animation: null, description: 'The longsword does +45% atk [Tier 1]' },
broadsword_sword: { damage: 50, icon: 'broadsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'broadsword', range: 'close', equippedBy: null, animation: null, description: 'The broadsword does +50% atk [Tier 1]' },
golden_gladius_sword: { damage: 55, icon: 'gladius', type: 'weapon', subtype: 'cutting', tier: 1, name: 'gladius', range: 'close', equippedBy: null, animation: null, description: 'The gladius does +40% atk [Tier 1]' },
wyrmsbane_sword: { damage: 52, icon: 'wyrmsbane', type: 'weapon', subtype: 'cutting', tier: 1, name: 'wyrmsbane', range: 'close', equippedBy: null, animation: null, description: 'The wyrmsbane does +52% atk [Tier 1]' },
katana_sword: { damage: 55, icon: 'katana', type: 'weapon', subtype: 'cutting', tier: 1, name: 'katana', range: 'close', equippedBy: null, animation: null, description: 'The katana does +55% atk [Tier 1]' },
claymore_sword: { damage: 60, icon: 'claymore', type: 'weapon', subtype: 'cutting', tier: 1, name: 'claymore', range: 'close', equippedBy: null, animation: null, description: 'The claymore does +60% atk [Tier 1]' },
greatsword_sword: { damage: 70, icon: 'greatsword', type: 'weapon', subtype: 'cutting', tier: 1, name: 'greatsword', range: 'close', equippedBy: null, animation: null, description: 'The greatsword does +70% atk [Tier 1]' },

doomreaver_sword: { damage: 78, icon: 'doomreaver', type: 'weapon', subtype: 'cutting', tier: 2, name: 'doomreaver', range: 'close', equippedBy: null, animation: null, description: 'The doomreaver does +78% atk [Tier 2]' },
nightfall_sword: { damage: 82, icon: 'nightfall', type: 'weapon', subtype: 'cutting', tier: 2, name: 'nightfall', range: 'close', equippedBy: null, animation: null, description: 'The nightfall does +82% atk [Tier 2]' },
dreadedge_sword: { damage: 88, icon: 'dreadedge', type: 'weapon', subtype: 'cutting', tier: 2, name: 'dreadedge', range: 'close', equippedBy: null, animation: null, description: 'The dreadedge does +88% atk [Tier 2]' },
sunsteel_sword: { damage: 95, icon: 'sunsteel', type: 'weapon', subtype: 'cutting', tier: 2, name: 'sunsteel', range: 'close', equippedBy: null, animation: null, description: 'The sunsteel does +95% atk [Tier 2]' },
voidrender_sword: { damage: 100, icon: 'voidrender', type: 'weapon', subtype: 'cutting', tier: 2, name: 'voidrender', range: 'close', equippedBy: null, animation: null, description: 'The voidrender does +100% atk [Tier 2]' },
warlords_cleaver_sword: { damage: 105, icon: 'warlords_cleaver', type: 'weapon', subtype: 'cutting', tier: 2, name: 'warlords_cleaver', range: 'close', equippedBy: null, animation: null, description: 'The warlords_cleaver does +105% atk [Tier 2]' },
emberbrand_sword: { damage: 110, icon: 'emberbrand', type: 'weapon', subtype: 'cutting', tier: 2, name: 'emberbrand', range: 'close', equippedBy: null, animation: null, description: 'The emberbrand does +110% atk [Tier 2]' },

frostbite_sword: { damage: 130, icon: 'frostbite', type: 'weapon', subtype: 'cutting', tier: 3, name: 'frostbite', range: 'close', equippedBy: null, animation: null, description: 'The frostbite does +130% atk [Tier 3]' },
bloodsong_sword: { damage: 140, icon: 'bloodsong', type: 'weapon', subtype: 'cutting', tier: 3, name: 'bloodsong', range: 'close', equippedBy: null, animation: null, description: 'The bloodsong does +140% atk [Tier 3]' },
shadowfang_sword: { damage: 150, icon: 'shadowfang', type: 'weapon', subtype: 'cutting', tier: 3, name: 'shadowfang', range: 'close', equippedBy: null, animation: null, description: 'The shadowfang does +150% atk [Tier 3]' },
skymourne_sword: { damage: 160, icon: 'skymourne', type: 'weapon', subtype: 'cutting', tier: 3, name: 'skymourne', range: 'close', equippedBy: null, animation: null, description: 'The skymourne does +160% atk [Tier 3]' },
opalveil_sword: { damage: 170, icon: 'opalveil', type: 'weapon', subtype: 'cutting', tier: 3, name: 'opalveil', range: 'close', equippedBy: null, animation: null, description: 'The opalveil does +170% atk [Tier 3]' },
titans_claw_sword: { damage: 180, icon: 'titans_claw', type: 'weapon', subtype: 'cutting', tier: 3, name: 'titans_claw', range: 'close', equippedBy: null, animation: null, description: 'The titans_claw does +180% atk [Tier 3]' },
entropy_sword: { damage: 190, icon: 'entropy', type: 'weapon', subtype: 'cutting', tier: 3, name: 'entropy', range: 'close', equippedBy: null, animation: null, description: 'The entropy does +190% atk [Tier 3]' },
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
        buckler: {
            tier: 1,
            armor: 20,
            type: 'armor',
            subtype: 'shield',
            icon: 'buckler',
            name: 'buckler',
            equippedBy: null,
            animation: null,
            description: 'Small parrying buckler. Defense: 20 (~14% damage reduction)'
        },
        infantry_shield: {
            tier: 1,
            armor: 35,
            type: 'armor',
            subtype: 'shield',
            icon: 'infantry_shield',
            name: 'infantry shield',
            equippedBy: null,
            animation: null,
            description: 'Standard-issue infantry kite shield. Defense: 35 (~24% damage reduction)'
        },
        cold_steel_shield: {
            tier: 1,
            armor: 50,
            type: 'armor',
            subtype: 'shield',
            icon: 'cold_steel_shield',
            name: 'cold steel shield',
            equippedBy: null,
            animation: null,
            description: 'Heavy steel campaign shield. Defense: 50 (~35% damage reduction)'
        },
        banded_steel_shield: {
            armor: 65,
            type: 'armor',
            subtype: 'shield',
            icon: 'banded_steel_shield',
            name: 'banded steel shield',
            equippedBy: null,
            animation: null,
            description: 'Reinforced banded-steel kite. Defense: 65 (~45% damage reduction)'
        },
        crusaders_shield: {
            tier: 2,
            armor: 80,
            type: 'armor',
            subtype: 'shield',
            icon: 'crusaders_shield',
            name: "crusader's shield",
            equippedBy: null,
            animation: null,
            description: "Blessed crusader tower shield. Defense: 80 (~56% damage reduction)"
        },
        dawnguard: {
            tier: 2,
            armor: 95,
            type: 'armor',
            subtype: 'shield',
            icon: 'dawnguard',
            name: 'dawnguard',
            equippedBy: null,
            animation: null,
            description: 'Elite sentinel shield of the Dawnguard order. Defense: 95 (~66% damage reduction)'
        },
        twilight_screen: {
            tier: 2,
            armor: 107,
            type: 'armor',
            subtype: 'shield',
            icon: 'twilight_screen',
            name: 'twilight screen',
            equippedBy: null,
            animation: null,
            description: 'Twilight-forged aegis of living shadow. Defense: 107 (~75% damage reduction, max)'
        },
        revenants_shield: {
            tier: 3,
            armor: 107,
            type: 'armor',
            subtype: 'shield',
            icon: 'revenants_shield',
            name: "revenant's shield",
            equippedBy: null,
            animation: null,
            description: "Undying revenant ward. Defense: 107 (~75% damage reduction, max)"
        },
        aegis_bulwark: {
            tier: 3,
            armor: 107,
            type: 'armor',
            subtype: 'shield',
            icon: 'aegis_bulwark',
            name: 'aegis bulwark',
            equippedBy: null,
            animation: null,
            description: 'The legendary Aegis — ultimate protection. Defense: 107 (~75% damage reduction, max)'
        }
    }
    
    this.magical = {
        // glindas_wand: {
        //     type: 'magical',
        //     icon: 'glindas_wand',
        //     name: 'glindas wand',
        //     equippedBy: null,
        //     subtype: 'wand',
        //     power: 4,
        //     animation: null,
        //     description: `Glinda's wand has a power of 4 and has a 60% chance to cast a minor spell on use`
        // },
        // volkas_wand: {
        //     type: 'magical',
        //     icon: 'volkas_wand',
        //     name: 'volkas wand',
        //     equippedBy: null,
        //     subtype: 'wand',
        //     power: 6,
        //     animation: null,
        //     description: `Volka's wand has a power of 6 and has a 80% chance to cast a minor spell and a 15% chance to cast a major spell on use`
        // },
        // maerlyns_rod: {
        //     type: 'magical',
        //     icon: 'maerlyns_rod',
        //     name: 'maerlyns rod',
        //     equippedBy: null,
        //     subtype: 'wand',
        //     power: 10,
        //     animation: null,
        //     description: `Maerlyn's rod has a power of 10 and has a 80% chance to cast 2 major spells and a 15% chance to cast an eldritch spell on use`
        // },
        // wands
        cloudfire_wand: {
            tier: 1,
            type: 'magical',
            icon: 'cloudfire_wand',
            name: 'Cloudfire Wand',
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        animus_wand: {
            tier: 1,
            type: 'magical',
            icon: 'animus_wand',
            name: 'Animus Wand',
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        glyndas_wand: {
            tier: 1,
            type: 'magical',
            icon: 'glyndas_wand',
            name: "Glynda's Wand",
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        justicator_wand: {
            tier: 2,
            type: 'magical',
            icon: 'justicator_wand',
            name: 'Justicator Wand',
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        volkas_wand: {
            tier: 2,            
            type: 'magical',
            icon: 'volkas_wand',
            name: "Volka's Wand",
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        willowcaster: {
            tier: 2,
            type: 'magical',
            icon: 'willowcaster',
            name: 'Willowcaster',
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        maerlyns_rod: {
            tier: 3,
            type: 'magical',
            icon: 'maerlyns_rod',
            name: "Maerlyn's Rod",
            equippedBy: null,
            subtype: 'wand',
            power: null,
            animation: null,
            description: ''
        },
        // staves
        archmages_staff: {
            tier: 1,
            type: 'magical',
            icon: 'archmages_staff',
            name: "Archmage's Staff",
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        enchanters_staff: {            
            tier: 1,
            type: 'magical',
            icon: 'enchanters_staff',
            name: "Enchanter's Staff",
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        imperial_mage_staff: {
            tier: 1,
            type: 'magical',
            icon: 'imperial_mage_staff',
            name: 'Imperial Mage Staff',
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        staff_of_espilon: {
            tier: 2,
            type: 'magical',
            icon: 'staff_of_espilon',
            name: 'Staff of Espilon',
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        staff_of_marduk: {
            tier: 2,
            type: 'magical',
            icon: 'staff_of_marduk',
            name: 'Staff of Marduk',
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        staff_of_omicron: {
            tier: 2,
            type: 'magical',
            icon: 'staff_of_omicron',
            name: 'Staff of Omicron',
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
        },
        staff_of_tomorrow: {
            tier: 3,
            type: 'magical',
            icon: 'staff_of_tomorrow',
            name: 'Staff of Tomorrow',
            equippedBy: null,
            subtype: 'staff',
            power: null,
            animation: null,
            description: ''
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
        },
        //spellbooks
        oily_manual: {
            tier: 1,
            type: 'magical',
            icon: 'oily_manual',
            name: 'Oily Manual',
            equippedBy: null,
            subtype: 'spellbook',
            power: 2,
            animation: null,
            description: `A battered manual smeared with oils and arcane ink`
        },
        bound_tome: {
            tier: 1,
            type: 'magical',
            icon: 'bound_tome',
            name: 'Bound Tome',
            equippedBy: null,
            subtype: 'spellbook',
            power: 3,
            animation: null,
            description: `A tome bound tightly with worn leather straps`
        },
        glowing_tome: {
            tier: 1,
            type: 'magical',
            icon: 'glowing_tome',
            name: 'Glowing Tome',
            equippedBy: null,
            subtype: 'spellbook',
            power: 3,
            animation: null,
            description: `A tome that pulses faintly with stored magical energy`
        },
        kelrigans_manual: {
            tier: 1,
            type: 'magical',
            icon: 'kelrigans_manual',
            name: "Kelrigan's Manual",
            equippedBy: null,
            subtype: 'spellbook',
            power: 4,
            animation: null,
            description: `A well-worn manual penned by the scholar Kelrigan`
        },
        the_watchful_eye: {
            tier: 2,
            type: 'magical',
            icon: 'the_watchful_eye',
            name: 'The Watchful Eye',
            equippedBy: null,
            subtype: 'spellbook',
            power: 4,
            animation: null,
            description: `An arcane folio said to observe its reader in return`
        },
        moonbird_folio: {
            tier: 2,
            type: 'magical',
            icon: 'moonbird_folio',
            name: 'Moonbird Folio',
            equippedBy: null,
            subtype: 'spellbook',
            power: 5,
            animation: null,
            description: `A folio covered in moonbird sigils and lunar charts`
        },
        icewing_folio: {
            tier: 2,
            type: 'magical',
            icon: 'icewing_folio',
            name: 'Icewing Folio',
            equippedBy: null,
            subtype: 'spellbook',
            power: 5,
            animation: null,
            description: `A folio inscribed with frost-laced incantations`
        },
        emerald_tablet: {
            tier: 2,
            type: 'magical',
            icon: 'emerald_tablet',
            name: 'Emerald Tablet',
            equippedBy: null,
            subtype: 'spellbook',
            power: 6,
            animation: null,
            description: `A green-jeweled tome housing ancient transmutation lore`
        },
        ruby_tablet: {
            tier: 2,
            type: 'magical',
            icon: 'ruby_tablet',
            name: 'Ruby Tablet',
            equippedBy: null,
            subtype: 'spellbook',
            power: 7,
            animation: null,
            description: `A red-gemmed tome crackling with volatile fire magic`
        },
        feldons_manual: {
            tier: 3,
            type: 'magical',
            icon: 'feldons_manual',
            name: "Feldon's Manual",
            equippedBy: null,
            subtype: 'spellbook',
            power: 7,
            animation: null,
            description: `Feldon's comprehensive manual of intermediate sorcery`
        },
        the_beast_book: {
            tier: 3,
            type: 'magical',
            icon: 'the_beast_book',
            name: 'The Beast Book',
            equippedBy: null,
            subtype: 'spellbook',
            power: 8,
            animation: null,
            description: `A tome bound in hide, filled with beast-summoning rites`
        },
        book_of_jade: {
            tier: 3,
            type: 'magical',
            icon: 'book_of_jade',
            name: 'Book of Jade',
            equippedBy: null,
            subtype: 'spellbook',
            power: 8,
            animation: null,
            description: `A jade-covered codex of eastern elemental magic`
        },
        igors_grimoire: {
            tier: 3,
            type: 'magical',
            icon: 'igors_grimoire',
            name: "Igor's Grimoire",
            equippedBy: null,
            subtype: 'spellbook',
            power: 9,
            animation: null,
            description: `Igor's personal grimoire, dense with dark experiments`
        },
        forbidden_grimoire: {
            tier: 3,
            type: 'magical',
            icon: 'forbidden_grimoire',
            name: 'Forbidden Grimoire',
            equippedBy: null,
            subtype: 'spellbook',
            power: 9,
            animation: null,
            description: `A chained grimoire whose contents are proscribed by most mage councils`
        },
        monadic_engine: {
            tier: 4,
            type: 'magical',
            icon: 'monadic_engine',
            name: 'Monadic Engine',
            equippedBy: null,
            subtype: 'spellbook',
            power: 10,
            animation: null,
            description: `A mechanical folio that computes and channels arcane formulae`
        },
        verdant_engine: {
            tier: 4,
            type: 'magical',
            icon: 'verdant_engine',
            name: 'Verdant Engine',
            equippedBy: null,
            subtype: 'spellbook',
            power: 11,
            animation: null,
            description: `A living folio woven from enchanted vines and growth magic`
        },
        crimson_engine: {
            tier: 4,
            type: 'magical',
            icon: 'crimson_engine',
            name: 'Crimson Engine',
            equippedBy: null,
            subtype: 'spellbook',
            power: 12,
            animation: null,
            description: `A blood-red engine-tome that amplifies destructive spells`
        },
        folio_of_coincidence: {
            tier: 4,
            type: 'magical',
            icon: 'folio_of_coincidence',
            name: 'Folio of Coincidence',
            equippedBy: null,
            subtype: 'spellbook',
            power: 12,
            animation: null,
            description: `A folio that bends probability, making the unlikely inevitable`
        },
        folio_of_paradox: {
            tier: 4,
            type: 'magical',
            icon: 'folio_of_paradox',
            name: 'Folio of Paradox',
            equippedBy: null,
            subtype: 'spellbook',
            power: 14,
            animation: null,
            description: `A folio containing contradictory truths that somehow all hold`
        },
        septemons_grimoire: {
            tier: 4,
            type: 'magical',
            icon: 'septemons_grimoire',
            name: "Septemon's Grimoire",
            equippedBy: null,
            subtype: 'spellbook',
            power: 15,
            animation: null,
            description: `The legendary grimoire of Septemon, architect of seven sealed dimensions`
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
        },
        crimson_mask: {
            tier: 3,
            type: 'magical',
            icon: 'crimson_mask',
            name: 'crimson mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: '50% damage reduction from demons and fire magic'
        },
        seraphic_mask: {
            tier: 3,
            type: 'magical',
            icon: 'seraphic_mask',
            name: 'seraphic mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: '50% damage reduction from undead and dark magic'
        },
        shadow_mask: {
            tier: 3,
            type: 'magical',
            icon: 'shadow_mask',
            name: 'shadow mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: '50% damage reduction from eldritch and dark magic'
        },
        twilight_mask: {
            tier: 3,
            type: 'magical',
            icon: 'twilight_mask',
            name: 'twilight mask',
            subtype: 'mask',
            equippedBy: null,
            animation: null,
            description: '50% damage reduction from all magic types'
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
        treasury_key: {
            icon: 'treasury_key',
            type: 'key',
            name: 'treasury key',
            equippedBy: null,
            animation: null
        },
        lockbox_key: {
            icon: 'lockbox_key',
            type: 'key',
            name: 'lockbox key',
            equippedBy: null,
            animation: null
        },
        necrotic_key: {
            icon: 'necrotic_key',
            type: 'key',
            name: 'necrotic key',
            equippedBy: null,
            animation: null
        },
        necrotic_master_key: {
            icon: 'necrotic_master_key',
            type: 'key',
            name: 'necrotic master key',
            equippedBy: null,
            animation: null
        },
        violet_key: {
            icon: 'violet_key',
            type: 'key',
            name: 'violet key',
            equippedBy: null,
            animation: null
        },
        rubicund_key: {
            icon: 'rubicund_key',
            type: 'key',
            name: 'rubicund key',
            equippedBy: null,
            animation: null
        },
        cyan_key: {
            icon: 'cyan_key',
            type: 'key',
            name: 'cyan key',
            equippedBy: null,
            animation: null
        },
        imperial_key: {
            icon: 'imperial_key',
            type: 'key',
            name: 'imperial key',
            equippedBy: null,
            animation: null
        },
        dimensional_key: {
            icon: 'dimensional_key',
            type: 'key',
            name: 'dimensional key',
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
    this.items = this.weapons_names.concat(this.masks_names.concat(this.helms_names.concat(this.keys_names.concat(this.amulets_names.concat(this.charms_names.concat(this.wands_names.concat(this.staves_names.concat(this.misc_names.concat(this.shields_names)))))))))
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
        this.iconToKey = {};
        for(let key in this.weapons){
            this.allItems[key] = this.weapons[key];
            // Stamp each weapon entry with its own key so saved copies can be
            // re-hydrated even without knowing the original property name.
            if (this.allItems[key] && !this.allItems[key]._im_key) {
                this.allItems[key]._im_key = key;
            }
            // Build icon→key fallback for items saved before _im_key existed.
            // First writer wins; duplicate icons (e.g. gladius) map to the
            // first definition encountered.
            const icon = this.weapons[key] && this.weapons[key].icon;
            if (icon && !this.iconToKey[icon]) this.iconToKey[icon] = key;
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
                // Prefer _im_key (stamped on weapons at initializeItems time) so
                // dropped weapons survive save/reload. Fall back to name-based lookup
                // for consumables and older saved items that lack _im_key.
                const key = (e._im_key && this.allItems[e._im_key])
                    ? e._im_key
                    : (e.name || '').replaceAll(' ', '_');
                if(this.allItems[key]){
                    const v = copy(this.allItems[key]);
                    if (v) v.equippedBy = equippedBy;
                    return v;
                } else {
                    console.warn('InventoryManager: unknown saved item key:', key, '| item:', e);
                    return null;
                }
            }).filter(v => v !== null);
            this.gold = data.gold;
            this.shimmering_dust = data.shimmering_dust;
            this.totems = data.totems;
        }
    }
    // Re-hydrate every weapon in an inventory array from the current allItems
    // definitions so that changes to damage/stats in this file are always the
    // source of truth for combat.  Non-weapon items and unknown weapons are
    // returned as-is.  Slot/equipped metadata is preserved.
    this.refreshWeaponStats = (inventory) => {
        if (!Array.isArray(inventory)) return inventory;
        return inventory.map(item => {
            if (!item || item.type !== 'weapon') return item;
            const k = (item._im_key && this.allItems[item._im_key])
                ? item._im_key
                : (item.icon && this.iconToKey && this.iconToKey[item.icon])
                    ? this.iconToKey[item.icon]
                    : null;
            if (!k || !this.allItems[k]) return item;
            const refreshed = copy(this.allItems[k]);
            if (!refreshed) return item;
            refreshed.equippedBy   = item.equippedBy   != null ? item.equippedBy   : refreshed.equippedBy;
            refreshed.equippedSlot = item.equippedSlot != null ? item.equippedSlot : refreshed.equippedSlot;
            // Auto-correct the damage number in "+N% atk" so allItems damage is always reflected.
            if (refreshed.description && refreshed.damage != null) {
                refreshed.description = refreshed.description.replace(/\+\d+% atk/, `+${refreshed.damage}% atk`);
            }
            return refreshed;
        });
    };

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
    // Remove the first occurrence of an item with the given key that is not equipped.
    this.removeItemByKey = (key) => {
        const idx = this.inventory.findIndex(item =>
            item &&
            item.equippedBy == null &&
            (item._im_key === key ||
             (item.name || '').replaceAll(' ', '_') === key ||
             item.name === key)
        );
        if (idx !== -1) this.inventory.splice(idx, 1);
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