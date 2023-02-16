export function InventoryManager(){
    this.tiles = [];
    this.amulets = [
        'evilai_amulet',
        'lundi_amulet',
        'nukta_amulet',
        'sayan_amulet'
    ]
    this.charms = [
        'beetle_charm',
        'demonskull_charm',
        'evilai_charm',
        'hamsa_charm',
        'lundi_charm',
        'nukta_charm',
        'scarab_charm'
    ]
    this.shields = [
        'seeing_shield',
        'basic_shield'
    ]
    this.masks = [
        'bundu_mask',
        'court_mask',
        'lundi_mask',
        'mardi_mask',
        'solomon_mask',
        'zul_mask'
    ]
    this.helms = [
        'basic_helm',
        'knight_helm',
        'spartan_helm',
        'legionaire_helm',
        'cretan_helm'
    ]
    this.wands = [
        'glindas_wand',
        'volkas_wand',
        'maerlyns_rod'
    ]
    this.misc = [
        'crown',
        'potion',
        'lantern'
    ]
    this.keys = [
        'ornate_key',
        'minor_key',
        'major_key'
    ]
    this.weapons = [
        'axe',
        'flail',
        'scepter',
        'scimitar',
        'spear',
        'sword'
    ]
    this.items = this.weapons.concat(this.masks.concat(this.helms.concat(this.keys.concat(this.amulets.concat(this.charms.concat(this.wands.concat(this.misc.concat(this.shields))))))))
    this.inventory = []
    this.initializeItems = (items) => {
        items.forEach(i=> {if(this.items.includes(i.contains)) this.inventory.push({image: i.image, contains: i.contains})})
    }
    this.addItem = (item) => {
        this.inventory.push({image: item, contains: item})
    }
}