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
    this.weapons_names = [
        'axe',
        'flail',
        'scepter',
        'scimitar',
        'spear',
        'sword',
        'longbow'
    ]
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
            amount: 55,
            icon: 'potion',
            type: 'consumable',
            name: 'minor health potion',
            equippedBy: null,
            animation: null,
            description: 'Minor health potions replenish 10% total hp'
        },
        major_health_potion: {
            effect: 'health gain',
            amount: 80,
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
        axe: {
            damage: 3,
            icon: 'axe',
            type: 'weapon',
            subtype: 'cutting',
            name: 'axe',
            range: 'close',
            equippedBy: null,
            animation: null,
            description: 'The basic axe does 3 damage'
        },
        flail: {
            damage: 3,
            icon: 'flail',
            type: 'weapon',
            subtype: 'crushing',
            name: 'flail',
            range: 'close',
            equippedBy: null,
            animation: null,
            description: 'The basic flail does 3 damage'
        },
        spear: {
            damage: 3,
            icon: 'spear',
            type: 'weapon',
            subtype: 'cutting',
            name: 'spear',
            range: 'medium',
            equippedBy: null,
            animation: null,
            description: 'The basic spear does 3 damage'
        },
        sword: {
            damage: 3,
            icon: 'sword',
            type: 'weapon',
            subtype: 'cutting',
            name: 'sword',
            range: 'close',
            equippedBy: null,
            animation: null,
            description: 'The basic sword does 3 damage'
        },
        scimitar: {
            damage: 3,
            icon: 'scimitar',
            type: 'weapon',
            subtype: 'cutting',
            name: 'scimitar',
            range: 'close',
            equippedBy: null,
            animation: null,
            description: 'The basic scimitar does 3 damage'
        },
        scepter: {
            damage: 3,
            icon: 'scepter',
            type: 'weapon',
            subtype: 'crushing',
            name: 'scepter',
            range: 'close',
            equippedBy: null,
            animation: null,
            description: 'The basic scepter does 3 damage'
        },
        longbow: {
            damage: 3,
            icon: 'longbow',
            type: 'weapon',
            subtype: 'cutting',
            name: 'longbow',
            range: 'far',
            equippedBy: null,
            animation: null,
            description: 'The basic longbow does 3 damage'
        }
    }
    
    this.armor= {
        basic_helm: {
            armor: 3,
            type: 'armor',
            icon: 'basic_helm',
            name: 'basic helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: 'The basic helm absorbs 3 damage'
        },
        cretan_helm: {
            armor: 4,
            type: 'armor',
            icon: 'cretan_helm',
            name: 'cretan helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: 'The cretan helm absorbs 4 damage'
        },
        knight_helm: {
            armor: 5,
            type: 'armor',
            icon: 'knight_helm',
            name: 'knight helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: `The knight's helm absorbs 5 damage`
        },
        legionaire_helm: {
            armor: 6,
            type: 'armor',
            icon: 'legionaire_helm',
            name: 'legionaire helm',
            equippedBy: null,
            subtype: 'helm',
            animation: null,
            description: `The legionaire's helm absorbs 6 damage`
        },
        spartan_helm: {
            armor: 7,
            type: 'armor',
            icon: 'spartan_helm',
            name: 'spartan helm',
            equippedBy: null,
            animation: null,
            subtype: 'helm',
            description: `The spartan's helm absorbs 7 damage`
        },
        basic_shield: {
            armor: 4,
            type: 'armor',
            subtype: 'shield',
            icon: 'basic_shield',
            name: 'basic shield',
            equippedBy: null,
            animation: null,
            description: `The basic shield absorbs 4 damage`
        },
        seeing_shield: {
            armor: 6,
            type: 'armor',
            subtype: 'shield',
            icon: 'seeing_shield',
            name: 'seeing shield',
            equippedBy: null,
            animation: null,
            description: `The seeing shield absorbs 6 damage, and increases sight radius by 1`
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
            description: `Beetle charms have a power of 2 and a 60% chance to cast a minor boon on use. <br/> Passive: +2 damage absorbtion for the user and all adjacent allies`
        },
        evilai_charm: {
            type: 'magical',
            icon: 'evilai_charm',
            name: 'evilai charm',
            equippedBy: null,
            subtype: 'charm',
            power: 4,
            animation: null,
            description: `Evilai charms have a power of 4 and a 100% chance to cast a 2 minor boons and 1 minor curse on use. <br/> Passive: +3 damage and for the user and all adjacent allies & every time user is hit, 35% chance of casting minor curse on wearer`
        },
        nukta_charm: {
            type: 'magical',
            icon: 'nukta_charm',
            name: 'nukta charm',
            equippedBy: null,
            subtype: 'charm',
            power: 6,
            animation: null,
            description: `Nukta charms have a power of 6 and a 50% chance to cast a 1 major boon. <br/> Passive: +4 dexterity for entire crew.`
        },
        lundi_charm: {
            type: 'magical',
            icon: 'lundi_charm',
            name: 'lundi charm',
            equippedBy: null,
            subtype: 'charm',
            power: 8,
            animation: null,
            description: `Lundi charms have a power of 8. <br/>  On Use: 4x(70% chance to cast minor boon) <br/> Passive: +4 dexterity for entire crew.`
        },
        hamsa_charm: {
            type: 'magical',
            icon: 'hamsa_charm',
            name: 'hamsa charm',
            equippedBy: null,
            subtype: 'charm',
            power: 9,
            animation: null,
            description: `Hamsa charms have a power of 9. <br/>  On Use: Summon 2 spirit warriors to fight for you <br/> Passive: On being hit, 20% to negate and teleport back 1 space, applies to entire crew.`
        },
        scarab_charm: {
            type: 'magical',
            icon: 'scarab_charm',
            name: 'scarab charm',
            equippedBy: null,
            subtype: 'charm',
            power: 10,
            animation: null,
            description: `Scarab charms have a power of 10. <br/>  On Use: Summon 1 djinn to fight for you <br/> Passive: On hit, 20% to cast minor boon, 5% chance cast major boon.`
        },
        demonskull_charm: {
            type: 'magical',
            icon: 'demonskull_charm',
            name: 'demonskull charm',
            equippedBy: null,
            subtype: 'charm',
            power: 12,
            animation: null,
            description: `Demonskull charms have a power of 12. <br/>  On Use: Cast 2 random eldritch spells <br/> Passive: Skill cooldowns are doubled, -1 to all stats for wearer.`
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

    this.ornaments = {
        mardi_mask: {
            power: 1,
            icon: 'mardi_mask',
            type: 'ancillary',
            name: 'mardi mask',
            equippedBy: null,
            animation: null,
            description: `Court masks have a power of 1 and a give +15 max hp. <br /> Passive: 10% chance of healing 15 hp on being hit.`
        },
        court_mask: {
            power: 1,
            icon: 'court_mask',
            type: 'ancillary',
            name: 'court mask',
            equippedBy: null,
            animation: null,
            description: `Court masks have a power of 1 and a give +1 magic resistance to the wearer. <br /> Passive: 80% chance of negating an enemy hex if wearer is within 4 tiles of caster.`
        },
        zul_mask: {
            power: 2,
            icon: 'zul_mask',
            type: 'ancillary',
            name: 'zul mask',
            equippedBy: null,
            animation: null,
            description: `Zul masks have a power of 2 and a give immunity from demobilization and mind control. <br /> Passive: 50% chance of negating a successful hit on wearer and teleporting to a random empty space`
        },
        bundu_mask: {
            power: 2,
            icon: 'bundu_mask',
            type: 'ancillary',
            name: 'bundu mask',
            equippedBy: null,
            animation: null,
            description: `Bundu masks have a power of 2 and a give +2 magic resistance to the wearer. <br /> Passive: 80% chance of negating an enemy hex if wearer is within 3 tiles of caster.`
        },
        lundi_mask: {
            power: 3,
            icon: 'lundi_mask',
            type: 'ancillary',
            name: 'lundi mask',
            equippedBy: null,
            animation: null,
            description: `Lundi masks have a power of 3 and a give +4 magic resistance to the wearer. <br /> Passive: If a boon is cast, 50% to recast after 5 seconds.`
        },
        solomon_mask: {
            power: 5,
            icon: 'solomon_mask',
            type: 'ancillary',
            name: 'solomon mask',
            equippedBy: null,
            animation: null,
            description: `Solomon masks have a power of 5 and a give +10 magic resistance to the wearer. <br /> Passive: 1/2 cooldown time for all of wearer's skills, 2x gold drop.`
        }
    }
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
            this.shimmering_dust = 0
            this.totems = 0
        } else {
            this.inventory = data.items.map(e=> {
                const equippedBy = e.equippedBy;
                let v;
                if(this.allItems[(e.name.replaceAll(' ', '_'))]){
                    v = this.allItems[e.name.replaceAll(' ', '_')];
                    v.equippedBy = equippedBy;
                }
                return v;
            })
            console.log('inventory: ', this.inventory   );
            this.gold = data.gold;
            this.shimmering_dust = data.shimmering_dust;
            this.totems = data.totems;
        }
    }
    this.addItemsByName = (items) => {
        let arr = [];
        items.forEach(e=>{
            arr.push(this.allItems[e])
        })
        this.inventory = this.inventory.concat(arr);
    }
    this.addItems = (items) => {
        this.inventory.concat(items)
    }
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