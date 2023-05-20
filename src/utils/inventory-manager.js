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
    this.potions = [
        'minor_health_potion',
        'major_health_potion',
        'grand_health_potion',
    ]


    this.consumables = {
        minor_health_potion: {
            effect: 'health gain',
            amount: 25,
            icon: 'potion',
            type: 'consumable',
            name: 'minor health potion'
        },
        major_health_potion: {
            effect: 'health gain',
            amount: 50,
            icon: 'potion',
            type: 'consumable',
            name: 'major health potion'
        },
        grand_health_potion: {
            effect: 'health gain',
            amount: 100,
            icon: 'potion',
            type: 'consumable',
            name: 'grand health potion'
        }
    }
    this.true_weapons = {
        axe: {
            damage: 3,
            icon: 'axe',
            type: 'weapon',
            subtype: 'cutting',
            name: 'axe'
        },
        flail: {
            damage: 3,
            icon: 'flail',
            type: 'weapon',
            subtype: 'crushing',
            name: 'flail'
        },
        spear: {
            damage: 3,
            icon: 'spear',
            type: 'weapon',
            subtype: 'cutting',
            name: 'spear'
        },
        sword: {
            damage: 3,
            icon: 'sword',
            type: 'weapon',
            subtype: 'cutting',
            name: 'sword'
        }
    }
    this.ornaments = {
        zul_mask: {
            power: 2,
            icon: 'zul_mask',
            type: 'ornament',
            name: 'zul mask'
        },
        bundu_mask: {
            power: 2,
            icon: 'bundu_mask',
            type: 'ornament',
            name: 'bundu mask'
        },
        court_mask: {
            power: 1,
            icon: 'court_mask',
            type: 'ornament',
            name: 'court mask'
        },
        solomon_mask: {
            power: 3,
            icon: 'solomon_mask',
            type: 'ornament',
            name: 'solomon mask'
        },
        lundi_mask: {
            power: 1,
            icon: 'lundi_mask',
            type: 'ornament',
            name: 'lundi mask'
        },
        mardi_mask: {
            power: 0,
            icon: 'mardi_mask',
            type: 'ornament',
            name: 'mardi mask'
        }
    }
    this.allItems = {};
    this.items = this.weapons.concat(this.masks.concat(this.helms.concat(this.keys.concat(this.amulets.concat(this.charms.concat(this.wands.concat(this.misc.concat(this.shields))))))))
    this.initializeItems = (items) => {
        for(let key in this.consumables){
            this.allItems[key] = this.consumables[key]
        }
        for(let key in this.ornaments){
            this.allItems[key] = this.ornaments[key]
        }
        this.inventory = [];
        console.log('initialized with items:', items)
        let newItems = items.map(e=> {
            if(this.weapons.includes(e.contains)){
                return this.true_weapons[e.contains]
            }
            if(this.masks.includes(e.contains)){
                return this.ornaments[e.contains]
            }
            if(this.potions.includes(e.contains)){
                return this.consumables[e.contains]
            }
        })
        console.log('now items:', newItems)
        // items.forEach(i=> {
        //     if(this.items.includes(i.contains)) this.inventory.push({image: i.image, contains: i.contains})
        // })
        this.inventory = newItems
        console.log('final items:', this.inventory)
    }
    this.addItem = (item) => {
        console.log('adding: ', item)
        this.inventory.push({image: item, contains: item})
        console.log('this.inventory: ', this.inventory)
        debugger
    }
}