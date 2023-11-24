export function InventoryManager(){
    this.tiles = [];
    this.gold = 0;
    this.shimmeringDust = 0;
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
        },
        scimitar: {
            damage: 3,
            icon: 'scimitar',
            type: 'weapon',
            subtype: 'cutting',
            name: 'scimitar',
            equippedBy: null
        },
        scepter: {
            damage: 3,
            icon: 'scepter',
            type: 'weapon',
            subtype: 'crushing',
            name: 'scepter',
            equippedBy: null
        }
    }
    
    this.armor= {
        basic_helm: {
            armor: 3,
            type: 'armor',
            icon: 'basic_helm',
            name: 'basic helm',
            equippedBy: null,
            subtype: 'helm'
        },
        cretan_helm: {
            armor: 4,
            type: 'armor',
            icon: 'cretan_helm',
            name: 'cretan helm',
            equippedBy: null,
            subtype: 'helm'
        },
        knight_helm: {
            armor: 5,
            type: 'armor',
            icon: 'knight_helm',
            name: 'knight helm',
            equippedBy: null,
            subtype: 'helm'
        },
        legionaire_helm: {
            armor: 6,
            type: 'armor',
            icon: 'legionaire_helm',
            name: 'legionaire helm',
            equippedBy: null,
            subtype: 'helm'
        },
        spartan_helm: {
            armor: 7,
            type: 'armor',
            icon: 'spartan_helm',
            name: 'spartan helm',
            equippedBy: null,
            subtype: 'helm'
        },
        // shield
        basic_shield: {
            armor: 4,
            type: 'armor',
            subtype: 'shield',
            icon: 'basic_shield',
            name: 'basic shield',
            equippedBy: null,
        },
        seeing_shield: {
            armor: 6,
            type: 'armor',
            subtype: 'shield',
            icon: 'seeing_shield',
            name: 'seeing shield',
            equippedBy: null,
        }
    }
    
    this.magical = {
        glindas_wand: {
            type: 'magical',
            icon: 'glindas_wand',
            name: 'glindas wand',
            equippedBy: null,
            subtype: 'wand',
            power: 4
        },
        volkas_wand: {
            type: 'magical',
            icon: 'volkas_wand',
            name: 'volkas wand',
            equippedBy: null,
            subtype: 'wand',
            power: 6
        },
        maerlyns_rod: {
            type: 'magical',
            icon: 'maerlyns_rod',
            name: 'maerlyns rod',
            equippedBy: null,
            subtype: 'wand',
            power: 10
        },
        //charms
        beetle_charm: {
            type: 'magical',
            icon: 'beetle_charm',
            name: 'beetle charm',
            equippedBy: null,
            subtype: 'charm',
            power: 2
        },
        evilai_charm: {
            type: 'magical',
            icon: 'evilai_charm',
            name: 'evilai charm',
            equippedBy: null,
            subtype: 'charm',
            power: 4
        },
        nukta_charm: {
            type: 'magical',
            icon: 'nukta_charm',
            name: 'nukta charm',
            equippedBy: null,
            subtype: 'charm',
            power: 6
        },
        lundi_charm: {
            type: 'magical',
            icon: 'lundi_charm',
            name: 'lundi charm',
            equippedBy: null,
            subtype: 'charm',
            power: 8
        },
        hamsa_charm: {
            type: 'magical',
            icon: 'hamsa_charm',
            name: 'hamsa charm',
            equippedBy: null,
            subtype: 'charm',
            power: 9
        },
        scarab_charm: {
            type: 'magical',
            icon: 'scarab_charm',
            name: 'scarab charm',
            equippedBy: null,
            subtype: 'charm',
            power: 10
        },
        demonskull_charm: {
            type: 'magical',
            icon: 'demonskull_charm',
            name: 'demonskull charm',
            equippedBy: null,
            subtype: 'charm',
            power: 12
        },
        //amulets
        lundi_amulet: {
            type: 'magical',
            icon: 'lundi_amulet',
            name: 'lundi amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 3
        },
        sayan_amulet: {
            type: 'magical',
            icon: 'sayan_amulet',
            name: 'sayan amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 5
        },
        nukta_amulet: {
            type: 'magical',
            icon: 'nukta_amulet',
            name: 'nukta amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 7
        },
        evilai_amulet: {
            type: 'magical',
            icon: 'evilai_amulet',
            name: 'evilai amulet',
            equippedBy: null,
            subtype: 'amulet',
            power: 9
        }
    }

    this.ornaments = {
        zul_mask: {
            power: 2,
            icon: 'zul_mask',
            type: 'ancillary',
            name: 'zul mask',
            equippedBy: null
        },
        bundu_mask: {
            power: 2,
            icon: 'bundu_mask',
            type: 'ancillary',
            name: 'bundu mask',
            equippedBy: null
        },
        court_mask: {
            power: 1,
            icon: 'court_mask',
            type: 'ancillary',
            name: 'court mask',
            equippedBy: null
        },
        solomon_mask: {
            power: 3,
            icon: 'solomon_mask',
            type: 'ancillary',
            name: 'solomon mask',
            equippedBy: null
        },
        lundi_mask: {
            power: 1,
            icon: 'lundi_mask',
            type: 'ancillary',
            name: 'lundi mask',
            equippedBy: null
        },
        mardi_mask: {
            power: 0,
            icon: 'mardi_mask',
            type: 'ancillary',
            name: 'mardi mask',
            equippedBy: null
        }
    }
    this.misc = {
        ornate_key: {
            icon: 'ornate_key',
            type: 'key',
            name: 'ornate key',
            equippedBy: null
        },
        minor_key: {
            icon: 'minor_key',
            type: 'key',
            name: 'minor key',
            equippedBy: null
        },
        major_key: {
            icon: 'major_key',
            type: 'key',
            name: 'major key',
            equippedBy: null
        },
        crown: {
            icon: 'crown',
            type: 'crown',
            name: 'crown',
            equippedBy: null
        },
        lanern: {
            icon: 'lantern',
            type: 'lantern',
            name: 'lantern',
            equippedBy: null
        }
    }
    this.allItems = {};
    this.items = this.weapons_names.concat(this.masks_names.concat(this.helms_names.concat(this.keys_names.concat(this.amulets_names.concat(this.charms_names.concat(this.wands_names.concat(this.misc_names.concat(this.shields_names))))))))
    this.initializeItems = (data) => {
        console.log('items: ', this.items, 'vs all items: ', this.allItems);
        for(let key in this.consumables){
            this.allItems[key] = this.consumables[key]
        }
        for(let key in this.ornaments){
            this.allItems[key] = this.ornaments[key]
        }
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
            this.shimmeringDust = 0
            this.totems = 0
        } else {
            console.log('initialized with items:', data.items)
            // console.log('all items $$$$$$', this.allItems);
            this.inventory = data.items.map(e=> {
                const equippedBy = e.equippedBy
                if(this.allItems[(e.name.replaceAll(' ', '_'))]){
                    let v = this.allItems[e.name.replaceAll(' ', '_')];
                    v.equippedBy = equippedBy;
                    return v;
                }
            })
            this.gold = data.gold;
            this.shimmeringDust = data.shimmeringDust;
            this.totems = data.totems;
        }
        
    }
    this.addItemsByName = (items) => {
        let arr = [];
        items.forEach(e=>{
            arr.push(this.allItems[e])
        })
        console.log('concatting ', arr);
        this.inventory = this.inventory.concat(arr)
        console.log('inventory is now', this.inventory);
    }
    this.addItems = (items) => {
        this.inventory.concat(items)
    }
    this.addItem = (item) => {
        console.log('adding: ', item, 'this.inventory: ', this.inventory)
        // if(typeof item === 'string'){
        //     // handle item coming from board tile
        //     this.inventory.push(this.allItems[item.contains])
        // } else {
            this.inventory.push(item)
        // }


        // console.log('all items version', this.allItems[item]);
        console.log('this.inventory: ', this.inventory)
        // debugger
    }
    this.removeItemByIndex = (index) => {
        this.inventory.splice(index, 1)
    }
    this.addCurrency = (data) => {
        switch(data.type){
            case 'gold':
            this.gold += data.amount;
            break;
            case 'shimmeringDust':
            this.shimmeringDust += data.amount;
            break;
            case 'totems':
            this.totems += data.amount;
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