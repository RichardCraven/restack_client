export function InventoryManager(){
    this.tiles = [];
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
        'potion',
        'lantern'
    ]
    this.keys_names = [
        'ornate_key',
        'minor_key',
        'major_key'
    ]
    this.weapons_names = [
        'axe',
        'flail',
        'scepter',
        'scimitar',
        'spear',
        'sword'
    ]
    this.potions_names = [
        'minor_health_potion',
        'major_health_potion',
        'grand_health_potion',
    ]


    this.consumables = {
        minor_health_potion: {
            effect: 'health gain',
            amount: 55,
            icon: 'potion',
            type: 'consumable',
            name: 'minor health potion',
            equippedBy: null
        },
        major_health_potion: {
            effect: 'health gain',
            amount: 80,
            icon: 'potion',
            type: 'consumable',
            name: 'major health potion',
            equippedBy: null
        },
        grand_health_potion: {
            effect: 'health gain',
            amount: 100,
            icon: 'potion',
            type: 'consumable',
            name: 'grand health potion',
            equippedBy: null
        },
        minor_key: {
            effect: 'key',
            type: 'key',
            icon: 'minor_key',
            name: 'minor key'
        },
        major_key: {
            effect: 'key',
            type: 'key',
            icon: 'major_key',
            name: 'major key'
        },
        ornate_key: {
            effect: 'key',
            type: 'key',
            icon: 'ornate_key',
            name: 'ornate key'
        },
    }
    this.weapons = {
        axe: {
            damage: 3,
            icon: 'axe',
            type: 'weapon',
            subtype: 'cutting',
            name: 'axe',
            equippedBy: null
        },
        flail: {
            damage: 3,
            icon: 'flail',
            type: 'weapon',
            subtype: 'crushing',
            name: 'flail',
            equippedBy: null
        },
        spear: {
            damage: 3,
            icon: 'spear',
            type: 'weapon',
            subtype: 'cutting',
            name: 'spear',
            equippedBy: null
        },
        sword: {
            damage: 3,
            icon: 'sword',
            type: 'weapon',
            subtype: 'cutting',
            name: 'sword',
            equippedBy: null
        }
    }
    this.protection= {

    }
    this.magical = {
        glindas_wand: {
            type: 'magical',
            icon: 'glindas_wand',
            name: 'glindas wand',
            equippedBy: null,
        },
        volkas_wand: {
            type: 'magical',
            icon: 'volkas_wand',
            name: 'volkas wand',
            equippedBy: null
        },
        maerlyns_rod: {
            type: 'magical',
            icon: 'maerlyns_rod',
            name: 'maerlyns rod',
            equippedBy: null
        }
    }
    this.ornaments = {
        zul_mask: {
            power: 2,
            icon: 'zul_mask',
            type: 'ornament',
            name: 'zul mask',
            equippedBy: null
        },
        bundu_mask: {
            power: 2,
            icon: 'bundu_mask',
            type: 'ornament',
            name: 'bundu mask',
            equippedBy: null
        },
        court_mask: {
            power: 1,
            icon: 'court_mask',
            type: 'ornament',
            name: 'court mask',
            equippedBy: null
        },
        solomon_mask: {
            power: 3,
            icon: 'solomon_mask',
            type: 'ornament',
            name: 'solomon mask',
            equippedBy: null
        },
        lundi_mask: {
            power: 1,
            icon: 'lundi_mask',
            type: 'ornament',
            name: 'lundi mask',
            equippedBy: null
        },
        mardi_mask: {
            power: 0,
            icon: 'mardi_mask',
            type: 'ornament',
            name: 'mardi mask',
            equippedBy: null
        }
    }
    this.allItems = {};
    this.items = this.weapons_names.concat(this.masks_names.concat(this.helms_names.concat(this.keys_names.concat(this.amulets_names.concat(this.charms_names.concat(this.wands_names.concat(this.misc_names.concat(this.shields_names))))))))
    this.initializeItems = (items) => {
        for(let key in this.consumables){
            this.allItems[key] = this.consumables[key]
        }
        for(let key in this.ornaments){
            this.allItems[key] = this.ornaments[key]
        }
        for(let key in this.protection){
            this.allItems[key] = this.protection[key]
        }
        for(let key in this.magical){
            this.allItems[key] = this.magical[key]
        }
        for(let key in this.weapons){
            this.allItems[key] = this.weapons[key]
        }
        this.inventory = [];
        console.log('initialized with items:', items)
        let newItems = items.map(e=> {
            if(this.weapons_names.includes(e.name.replaceAll(' ', '_'))){
                return this.allItems[e.name.replaceAll(' ', '_')]
            }
            if(this.masks_names.includes(e.name.replaceAll(' ', '_'))){
                return this.allItems[e.name.replaceAll(' ', '_')]
            }
            if(this.potions_names.includes(e.name.replaceAll(' ', '_'))){
                return this.allItems[e.name.replaceAll(' ', '_')]
            }
            if(this.keys_names.includes(e.name.replaceAll(' ', '_'))){
                return this.allItems[e.name.replaceAll(' ', '_')]
            }
            if(this.wands_names.includes(e.name.replaceAll(' ', '_'))){
                return this.allItems[e.name.replaceAll(' ', '_')]
            }
        })
        console.log('now items:', newItems)
        // items.forEach(i=> {
        //     if(this.items.includes(i.icon)) this.inventory.push({image: i.image, contains: i.contains})
        // })
        this.inventory = newItems
        console.log('final items:', this.inventory)
    }
    this.addItem = (item) => {
        console.log('adding: ', item)
        console.log('all items version', this.allItems[item]);
        this.inventory.push(this.allItems[item])
        console.log('this.inventory: ', this.inventory)
        // debugger
    }
}