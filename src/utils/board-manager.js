export function BoardManager(){
    this.pickRandom = (array) => {
        let index = Math.floor(Math.random() * array.length)
        return array[index]
    }
    this.tiles = [];
    this.overlayTiles = [];
    this.options = [
        'delete',
        'void',
        'door',
        'pit',
        'stairs',
        'cloud',
        'spawn',
        
        'monster',
        'item',
        'magic',
        'key',
        'masterkey',
        
        'gate',
        'treasure',
        'gold',
        'oracle',
        'dream den',

        'devil'
    ]
    this.monstersArr = [
        'witch',
        'beholder',
        // 'black_banshee',
        // 'black_djinn',
        // 'black_gorgon',
        // 'black_kronos',
        // 'black_minotaur',
        // 'black_vampire',
        // 'black_wraith',
        'dragon',
        // 'giant_scorpion',
        'goblin',
        'horror',
        'imp',
        'imp_overlord',
        'manticore',
        'mummy',
        'naiad',
        'ogre',
        'skeleton',
        'sphinx',
        'troll',
        // 'white_banshee',
        // 'white_djinn',
        // 'white_wraith',
        // 'white_gorgon',
        // 'white_vampire',
        // 'white_kronos',
        // 'white_minotaur',
        'wyvern',
        'wyvern_alt',
        'goloth_devil',
        'zul_devil',
        'mordu_devil',
        'vukular_devil',
        'ishtar_devil',
        'black_demon',
        'goat_demon',
        'golden_demon',
        'kabuki_demon',

        // 'imp',
        // 'imp_overlord',
        // 'beholder','dragon','goblin','horror','ogre',
        // 'sphinx','troll','slime_mold','black_vampire','black_gorgon',
        // 'mummy','naiad','wyvern','skeleton','giant_scorpion','black_djinn','black_kronos',
        // 'black_banshee','black_wraith', 'manticore','black_minotaur'
    ];
    this.availableItems = [];
    this.activeInteractionTile = null;
    this.pending = null;

    this.establishBoardTransitionCallback = (cb) => {
        this.boardTransition = cb;
    }
    this.establishAddTreasureToInventoryCallback = (callback) => {
        this.addTreasureToInventory = callback;
    }
    this.establishAddItemToInventoryCallback = (callback) => {
        this.addItemToInventory = callback;
    }
    this.establishAddCurrencyToInventoryCallback = (callback) => {
        this.addCurrencyToInventory = callback
    }
    this.establishUpdateDungeonCallback = (callback) => {
        this.updateDungeon = callback;
    }
    this.establishMessagingCallback = (callback) => {
        this.messaging = callback;
    }
    this.establishPendingCallback = (callback) => {
        this.setPending = callback;
    }
    this.establishRefreshCallback = (callback) => {
        this.refreshTiles = callback;
    }
    this.establishTriggerMonsterBattleCallback = (callback) => {
        this.triggerMonsterBattle = callback;
    }
    this.setActiveInventoryItem = (e) => {
        this.activeInventoryItem = e;
    }
    this.establishGetCurrentInventoryCallback = (callback) => {
        this.getCurrentInventory = callback
    }
    this.establishRitualEncounterCallback = (callback) => {
        this.triggerRitualEncounter = callback
    }
    this.establishSetMonsterCallback = (callback) => {
        this.setMonster = callback;
    }
    this.establishLevelChangeCallback = (callback) => {
        this.broadcastLevelChange = callback;
    }
    this.establishUseConsumableFromInventoryCallback = (callback) => {
        this.broadcastUseConsumableFromInventory = callback;
    }
    this.playerTile = {
        location: [0,0],
        boardIndex: null,
        levelId: 0
    }
    this.getRandomMonster = () => {
        // return this.monstersArr[0]


        let idx = Math.floor(Math.random()*this.monstersArr.length);
        const monster = this.monstersArr[idx];
        return monster
    }
    this.dungeon = {};
    this.currentBoard = {};
    this.currentOrientation = 'F'
    this.currentLevel = {}
    
    this.getActiveDungeon = () => {
        // nothin
    }
    
    this.getCoordinatesFromIndex = (index) =>{
        let row = Math.floor(index/15);
        let col = index%15;
        let x = 15 + row;
        let y = 15 + col;
        // let x = row;
        // let y = col;
        return [x, y]
    }
    // Helpers for new contains format and backwards compatibility
    // New format for tile.contains: { type: 'monster'|'item'|... , subtype: 'skeleton'|null }
    this.getContainsType = (contains) => {
        if (!contains && contains !== null) return null;
        if (typeof contains === 'object' && contains !== null) {
            // special-case older 'gate' -> 'minor_gate' naming used elsewhere
            if (contains.type === 'gate' && contains.subtype === 'minor') return 'minor_gate';
            return contains.type;
        }
        // string legacy format
        if (typeof contains === 'string') {
            if (this.monstersArr.includes(contains)) return 'monster';
            return contains;
        }
        return null;
    }
    this.getContainsSubtype = (contains) => {
        if (!contains && contains !== null) return null;
        if (typeof contains === 'object' && contains !== null) return contains.subtype || null;
        if (typeof contains === 'string') return contains;
        return null;
    }
    this.getImageForContains = (contains) => {
        const type = this.getContainsType(contains);
        const subtype = this.getContainsSubtype(contains);
        if (!type) return null;
        // monsters should render subtype image
        if (type === 'monster') {
            const key = subtype || this.getRandomMonster();
            return this.getImage(key) ? this.getImage(key) : key;
        }
        // items/other types - prefer subtype when present
        const key = subtype || type;
        return this.getImage(key) ? this.getImage(key) : key;
    }

    // Normalize a single board's tiles from legacy string format into object format
    this.normalizeBoardTiles = (board) => {
        if (!board || !board.tiles) return;
        for (let i = 0; i < board.tiles.length; i++) {
            let t = board.tiles[i];
            if (!t) continue;
            // if already object format, ensure minimal shape
            if (typeof t.contains === 'object' && t.contains !== null && t.contains.type) {
                // nothing to do
                continue;
            }
            const legacy = t.contains;
            // Handle legacy strings
            if (typeof legacy === 'string') {
                if (legacy === 'monster') {
                    t.contains = { type: 'monster', subtype: this.getRandomMonster() };
                } else if (this.monstersArr.includes(legacy)) {
                    t.contains = { type: 'monster', subtype: legacy };
                } else if (legacy === 'gate') {
                    t.contains = { type: 'gate', subtype: 'minor' };
                } else if (legacy === 'lantern') {
                    t.contains = { type: 'item', subtype: (this.pickRandom(this.availableItems) || null) };
                } else {
                    // generic mapping: keep type as legacy and no subtype
                    t.contains = { type: legacy, subtype: null };
                }
            } else {
                // null/undefined -> leave as null
                t.contains = null;
            }
        }
    }

    // Normalize entire dungeon (all levels/miniboards). Returns true if any change is made.
    this.normalizeDungeon = () => {
        if (!this.dungeon || !this.dungeon.levels) return false;
        let changed = false;
        this.dungeon.levels.forEach(level => {
            if (level.front && level.front.miniboards) {
                level.front.miniboards.forEach(b => { this.normalizeBoardTiles(b); changed = true });
            }
            if (level.back && level.back.miniboards) {
                level.back.miniboards.forEach(b => { this.normalizeBoardTiles(b); changed = true });
            }
        });
        return changed;
    }
    this.establishAvailableItems = (items) => {
        this.availableItems = items;
    }
    this.getBoardIndexFromBoard = (board) => {
        let v;
        if(this.currentLevel && this.currentOrientation){
            if(this.currentOrientation === 'F'){
                v = this.currentLevel.front.miniboards.findIndex(e=>e.id === board.id)
            } else {
                v = this.currentLevel.back.miniboards.findIndex(e=>e.id === board.id)
            }
        }
        return v;
    }
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        return index
    }
    this.setDungeon = (dungeon) => {
        this.dungeon = dungeon;
        // Normalize any legacy string-based contains into object shape
        try {
            const changed = this.normalizeDungeon();
            // persist normalized dungeon if callback available
            if (changed && this.updateDungeon) {
                this.updateDungeon(this.dungeon);
            }
        } catch (e) {
            // ignore normalization errors
        }
    }
    this.setCurrentLevel = (level) => {
        this.currentLevel = level;
    }
    this.setCurrentOrientation = (orientation) => {
        this.currentOrientation = orientation;
    }
    this.respawnMonsters = (template) => {
        if(!template || !template.levels) return
        let currentOrientation = this.currentOrientation
        let currentLevel = currentOrientation === 'F' ? this.currentLevel.front : this.currentLevel.back
        let foundTemplatePlane;
        template.levels.forEach((templateLevel, templateIndex)=>{
            let front = templateLevel.front
            let back = templateLevel.back
            let relevantPlane = currentOrientation === 'F' ? front : back
            if(relevantPlane.name === currentLevel.name){
                foundTemplatePlane = relevantPlane
            }
        })
        let templateBoard = foundTemplatePlane.miniboards[this.playerTile.boardIndex]
        // console.log('templateLevel');
        // Make sure templateBoard is normalized for legacy templates
        try { this.normalizeBoardTiles(templateBoard); } catch (e) {}
    
        templateBoard.tiles.forEach(templateTile=>{
            let equivalentTile = currentLevel.miniboards[this.playerTile.boardIndex].tiles.find(tile=> tile.id === templateTile.id)
            if(this.getContainsType(templateTile.contains) === 'monster' && !this.isMonster(equivalentTile) && this.getIndexFromCoordinates(this.playerTile.location) !== templateTile.id) {
                // assign a monster object shape — prefer the template's subtype when available
                const monsterSubtype = this.getContainsSubtype(templateTile.contains) || this.getRandomMonster();
                equivalentTile.contains = { type: 'monster', subtype: monsterSubtype };
                equivalentTile.image = this.getImageForContains(equivalentTile.contains);
                // Determine a color for the respawned tile. Prefer the template's color, then
                // the current board definition, then a sensible monster highlight so it won't
                // remain black after fog-of-war overwrites runtime tile state.
                try {
                    const templateColor = templateTile && templateTile.color;
                    const boardColor = this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[templateTile.id] && this.currentBoard.tiles[templateTile.id].color;
                    // sensible default for monsters so they show up if no color is present
                    const defaultMonsterColor = '#ff000078';
                    const isValidColor = (c) => (c !== null && c !== undefined && c !== '' && c !== 'black');
                    // Prefer a non-black template color, then a non-black board color, otherwise default
                    const colorToUse = isValidColor(templateColor) ? templateColor : (isValidColor(boardColor) ? boardColor : defaultMonsterColor);
                    equivalentTile.color = colorToUse;
                    // Persist the color into the in-memory currentBoard and dungeon so
                    // handleFogOfWar (which reads from currentBoard.tiles) will apply it
                    // when recalculating visibility.
                    try {
                        if (this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[templateTile.id]) {
                            this.currentBoard.tiles[templateTile.id].color = colorToUse;
                        }
                        if (this.currentOrientation === 'F') {
                            const levelEntry = this.dungeon.levels.find(e => e.id === this.currentLevel.id);
                            if (levelEntry && levelEntry.front && levelEntry.front.miniboards) {
                                const b = levelEntry.front.miniboards.find(bi => bi.id === this.currentBoard.id);
                                if (b && b.tiles && b.tiles[templateTile.id]) b.tiles[templateTile.id].color = colorToUse;
                            }
                        } else {
                            const levelEntry = this.dungeon.levels.find(e => e.id === this.currentLevel.id);
                            if (levelEntry && levelEntry.back && levelEntry.back.miniboards) {
                                const b = levelEntry.back.miniboards.find(bi => bi.id === this.currentBoard.id);
                                if (b && b.tiles && b.tiles[templateTile.id]) b.tiles[templateTile.id].color = colorToUse;
                            }
                        }
                    } catch (e) {}
                } catch (e) {}
                
                // also reflect into the currentLevel/dungeon structure so persistence will work
                try {
                    if (this.currentOrientation === 'F') {
                        this.dungeon.levels.find(e=>e.id === this.currentLevel.id).front.miniboards.find(b=>b.id === this.currentBoard.id).tiles[templateTile.id].contains = equivalentTile.contains;
                    } else {
                        this.dungeon.levels.find(e=>e.id === this.currentLevel.id).back.miniboards.find(b=>b.id === this.currentBoard.id).tiles[templateTile.id].contains = equivalentTile.contains;
                    }
                } catch (e) {}
                this.tiles[templateTile.id] = equivalentTile;
            }
        })
        try { if (this.updateDungeon) this.updateDungeon(this.dungeon); } catch (e) {}
        // Recompute fog-of-war visibility after respawn so newly-placed monsters are visible when appropriate
        try {
            const playerIdx = this.getIndexFromCoordinates(this.playerTile.location);
            if (this.tiles[playerIdx]) this.handleFogOfWar(this.tiles[playerIdx]);
        } catch (e) {}
        try { if (this.refreshTiles) this.refreshTiles(); } catch (e) {}
    }
    this.initializeTilesFromMap = (boardIndex, spawnTileIndex) => {
        const getRandomItem = () => {
            const idx = Math.floor(Math.random()*this.availableItems.length),
            item = this.availableItems[idx];
            return item;
        }
        let spawnCoords = this.getCoordinatesFromIndex(spawnTileIndex);
    let board = this.currentOrientation === 'F' ? this.currentLevel.front.miniboards[boardIndex] : this.currentLevel.back.miniboards[boardIndex]

    // Normalize the board tiles in-place (backwards-compatibility)
    try { this.normalizeBoardTiles(board); } catch (e) {}

        this.currentBoard = board;
        this.tiles = [];
        this.overlayTiles = [];
        this.playerTile = {
            location: spawnCoords,
            boardIndex: boardIndex
        }
    
        for(let i = 0; i< board.tiles.length; i++){
            let tile = board.tiles[i]
            // ensure tile.contains is object-shaped (normalizeBoardTiles already attempted this)
            if (typeof tile.contains === 'string') {
                // defensive fallback
                if (tile.contains === 'monster') tile.contains = { type: 'monster', subtype: this.getRandomMonster() };
                else tile.contains = { type: tile.contains, subtype: null };
            }
            // for monster entries with missing subtype, assign one
            if (tile.contains && tile.contains.type === 'monster' && !tile.contains.subtype) {
                tile.contains.subtype = this.getRandomMonster();
            }
            // for lantern legacy random item, ensure subtype is present
            if (tile.contains && tile.contains.type === 'item' && !tile.contains.subtype && tile.original && tile.original === 'lantern') {
                tile.contains.subtype = getRandomItem();
            }
            const imageKey = this.getImageForContains(tile.contains);
            // Log monster tiles on initialization to verify contains/image are correct
            if (tile.contains && tile.contains.type === 'monster' && tile.contains.subtype) {
                // regular init tile
                try { /* no-op */ } catch (e) {}
            }
            if (this.getContainsType(tile.contains) === 'monster') {
                try { /* debug removed */ } catch (e) {}
            }
            this.tiles.push({
                type: 'board-tile',
                id: tile.id,
                color: tile.color,
                showCoordinates: false,
                contains: tile.contains,
                image: imageKey,
                borders: null
            })
            this.overlayTiles.push({
                type: 'board-tile',
                id: tile.id,
                color: null,
                image: null,
                borders: null
            })
        }
        // persist any normalizations made to the dungeon tiles
        try { if (this.updateDungeon) this.updateDungeon(this.dungeon); } catch (e) {}
        for(let j = 0; j < 15; j++){
            for(let p = 0; p<15; p++){
                this.tiles[p+(15*j)].coordinates = [(j+1*15), p+1*15]
            }
        }
        this.placePlayer(this.playerTile.location)
        this.handleFogOfWar(this.tiles[this.getIndexFromCoordinates(this.playerTile.location)])
    }
    this.placePlayer = (coordinates) => {
        let index = this.getIndexFromCoordinates(coordinates)
        this.overlayTiles[index].image = 'avatar'
        this.tiles[index].playerTile = true;
        this.tiles[index].image = 'avatar'
    }
    this.isMonster = (tile => {
        if (!tile) return false;
        const c = tile.contains;
        if (!c) return false;
        if (typeof c === 'object') return c.type === 'monster';
        return this.monstersArr.includes(c);
    })
    this.handleInteraction = (destinationTile) => {
        const type = this.getContainsType(destinationTile.contains);
        const subtype = this.getContainsSubtype(destinationTile.contains);
        switch(type){
            case 'door':
                return 'door';
            case 'way_up':
                return 'way_up';
            case 'way_down':
                return 'way_down';
            case 'monster':
                // pass subtype string to monster handler
                this.setMonster(subtype)
                this.triggerMonsterBattle(true, destinationTile.id)
                return 'impassable';
            case 'minor_gate':
                this.handleGate(destinationTile);
                return 'impassable';
            case 'item':
                // destinationTile.contains may be object; callers expect string contains
                try {
                    const tileForCallback = Object.assign({}, destinationTile, { contains: subtype });
                    this.addItemToInventory(tileForCallback)
                } catch (e) {
                    this.addItemToInventory(destinationTile)
                }
                this.removeTileFromBoard(destinationTile)
                return 'item';
            case 'spell':
                this.triggerRitualEncounter();
            break;
            case 'gold':
                let factor, num = Math.random();
                if(num > .85){
                    factor = 500
                } else if(num > .60){
                    factor = 250
                } else if(num > .35){
                    factor = 100
                } else{
                    factor = 50
                }
                const amount = Math.floor(Math.random() * factor);
                this.addCurrencyToInventory({
                    type: 'gold',
                    amount
                })
                this.removeTileFromBoard(destinationTile)
            break;
            case 'treasure':
                let treasureFactor, treasureNum = Math.random();
                if(treasureNum > .85){
                    treasureFactor = 4
                } else if(treasureNum > .60){
                    treasureFactor = 3
                } else if(treasureNum > .35){
                    treasureFactor = 2
                } else{
                    treasureFactor = 1
                }
                let treasureItems;
                switch (treasureFactor){
                    case 4:
                        treasureItems = ['sayan_amulet', 'solomon_mask', 'major_key', 'nukta_charm', 'scepter', 'grand_health_potion']
                        this.addTreasureToInventory({
                            item: this.pickRandom(treasureItems),
                            currency: {
                                type: 'shimmering dust',
                                amount: Math.floor(Math.random() * 30)
                            }
                        })
                    break;
                    case 3:
                        treasureItems = ['glindas_wand', 'knight_helm', 'hamsa_charm', 'grand_health_potion']
                        this.addTreasureToInventory({
                            item: this.pickRandom(treasureItems),
                            currency: {
                                type: 'shimmering dust',
                                amount: Math.floor(Math.random() * 10)
                            }
                        })
                    break;
                    case 2:
                        treasureItems = ['minor_key', 'scimitar', 'cretan_helm', 'major_health_potion']
                        this.addTreasureToInventory({
                            item: this.pickRandom(treasureItems),
                            currency: {
                                type: 'gold',
                                amount: Math.floor(Math.random() * 250)
                            }
                        })
                    break;
                    case 1:
                        treasureItems = ['seeing_shield', 'court_mask', 'mardi_mask', 'basic_helm', 'axe', 'minor_health_potion']
                        this.addTreasureToInventory({
                            item: this.pickRandom(treasureItems),
                            currency: {
                                type: 'gold',
                                amount: Math.floor(Math.random() * 100)
                            }
                        })
                    break;
                    default:

                    break;
                }
                this.removeTileFromBoard(destinationTile)
            break;
            default:
                break;
        }
    }
    this.removeDefeatedMonsterTile = (tileId) => {
    
        const tile = this.tiles[tileId];
        this.removeTileFromBoard(tile);
    }
    this.removeTileFromBoard = (tile) => {
        // Clear runtime monster/image but preserve or restore an appropriate base color
        tile.image = null;
        tile.contains = null;
        // Prefer the currentBoard's color for this tile, otherwise fallback to white
        // try {
        //     const boardColor = this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[tile.id] && this.currentBoard.tiles[tile.id].color;
        //     tile.color = boardColor || 'white';
        // } catch (e) {
            tile.color = 'white';
        // }
        this.tiles[tile.id] = tile;
        // Persist the cleared contains and ensure the dungeon/currentBoard tile has a usable color
        try {
            // Update the in-memory currentBoard entry so fog uses the right color immediately
            if (this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[tile.id]) {
                this.currentBoard.tiles[tile.id].contains = null;
                this.currentBoard.tiles[tile.id].color = tile.color;
            }
            // Also update the dungeon structure so persistence will include the cleared tile
            const levelEntry = this.dungeon.levels.find(e => e.id === this.currentLevel.id);
            if (levelEntry) {
                if (this.currentOrientation === 'F' && levelEntry.front && levelEntry.front.miniboards) {
                    const b = levelEntry.front.miniboards.find(bi => bi.id === this.currentBoard.id);
                    if (b && b.tiles && b.tiles[tile.id]) {
                        b.tiles[tile.id].contains = null;
                        b.tiles[tile.id].color = tile.color;
                    }
                } else if (this.currentOrientation === 'B' && levelEntry.back && levelEntry.back.miniboards) {
                    const b = levelEntry.back.miniboards.find(bi => bi.id === this.currentBoard.id);
                    if (b && b.tiles && b.tiles[tile.id]) {
                        b.tiles[tile.id].contains = null;
                        b.tiles[tile.id].color = tile.color;
                    }
                }
            }
        } catch (e) {}
        try { if (this.updateDungeon) this.updateDungeon(this.dungeon); } catch (e) {}
        // debugger
        // return;  
        // Recompute fog-of-war after removing the tile so visibility updates immediately
        try {
            const playerIdx = this.getIndexFromCoordinates(this.playerTile.location);
            if (this.tiles[playerIdx]) this.handleFogOfWar(this.tiles[playerIdx]);
            else if (this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[playerIdx]) this.handleFogOfWar(this.currentBoard.tiles[playerIdx]);
        } catch (e) {}
        // Ensure UI refresh in case handleFogOfWar did not run for any reason
        try { if (this.refreshTiles) this.refreshTiles(); } catch (e) {}
    }
    this.handleGate = (tile) => {
        if(!this.activeInteractionTile) this.activeInteractionTile = tile;
        if(this.pending && this.pending.type === 'minor_gate'){
            this.messaging('This gate requires a minor key');
            let hasKey = false, key;
            if(this.getCurrentInventory().find(e=>e.name==='minor key')){
                hasKey = true;
                key = this.getCurrentInventory().find(e=>e.name==='minor key');
            }
            if(hasKey){
                this.messaging('Minor gate rattles open')
                tile.contains = 'minor_gate_open'
                tile.image = 'minor_gate_open'
                this.activeInteractionTile = tile;
                this.broadcastUseConsumableFromInventory(key)
                this.refreshTiles();
                this.tiles[tile.id] = tile;
                if(this.currentOrientation === 'F'){
                    this.dungeon.levels.find(e=>e.id === this.currentLevel.id).front.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = tile.contains;
                } else {
                    this.dungeon.levels.find(e=>e.id === this.currentLevel.id).back.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = tile.contains;
                }
                this.updateDungeon(this.dungeon);
            } else {
                tile.color = 'lightyellow';
            }
        } else if(this.pending === null){
            tile.color = 'lightyellow'
            this.messaging('This gate requires a minor key')
            let p = {
                type: 'minor_gate'
            }
            this.pending = p;
            this.setPending(p)
        }

    }
    this.handlePassingThroughDoor = () => {
        if(this.currentOrientation === 'F'){
            this.currentOrientation = 'B'
        } else if(this.currentOrientation === 'B'){
            this.currentOrientation = 'F'
        }
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]]))
    }
    
    this.handlePassingThroughWayUp = () => {
        const incomingLevel = this.dungeon.levels.find(l => l.id === this.currentLevel.id+1)
        if(!incomingLevel){
            alert('trying to travel to a level that doesnt exist!')
            return
        }
        this.currentLevel = incomingLevel;
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]]))
        this.broadcastLevelChange(this.currentLevel.id)
    }
    this.handlePassingThroughWayDown = () => {
        const incomingLevel = this.dungeon.levels.find(l => l.id === this.currentLevel.id-1)
        if(!incomingLevel){
            alert('trying to travel to a level that doesnt exist!')
            return
        }
        this.currentLevel = incomingLevel;
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]]))
        this.broadcastLevelChange(this.currentLevel.id)
    }
    this.checkAdjacency = () => {
        const highlightColor = (tile) => {
            let color = null;
            if(this.isMonster(tile)) color = '#ff000078'
            const subtype = this.getContainsSubtype(tile.contains);
            if(subtype && this.availableItems.includes(subtype)) color = 'lightyellow'
            return color;
        }
        const curIndex = this.getIndexFromCoordinates(this.playerTile.location);
        const leftTile = this.tiles[curIndex-1];
        const rightTile = this.tiles[curIndex+1];
        const topRow = !!this.tiles[curIndex - 15] ? this.tiles.filter(t=>t.id >= curIndex-16 && t.id <= curIndex-14) : null
        const bottomRow = !!this.tiles[curIndex + 15] ? this.tiles.filter(t=>t.id >= curIndex+14 && t.id <= curIndex+16) : null

        if(leftTile && highlightColor(leftTile)) leftTile.color = highlightColor(leftTile)
        if(rightTile && highlightColor(rightTile)) rightTile.color = highlightColor(rightTile);
        if(topRow) topRow.forEach((t, i)=>{ 
            if(i === 0){
                if(this.getContainsType(topRow[1].contains) === 'void' && this.getContainsType(leftTile.contains) === 'void') return
            }
            if(i === 2){
                if(this.getContainsType(topRow[1].contains) === 'void' && this.getContainsType(rightTile.contains) === 'void') return
            }
            if(highlightColor(t))t.color = highlightColor(t)
        })
        if(bottomRow) bottomRow.forEach((t, i)=>{if(highlightColor(t)){
            if(i === 0){
                if(this.getContainsType(bottomRow[1].contains) === 'void' && this.getContainsType(leftTile.contains) === 'void') return
            }
            if(i === 2){
                if(this.getContainsType(bottomRow[1].contains) === 'void' && this.getContainsType(rightTile.contains) === 'void') return
            }
            t.color = highlightColor(t)}
        })


    }
    this.move = (destinationCoords, direction) => {
        const tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        const destinationIndex = this.getIndexFromCoordinates(destinationCoords),
        destinationTile = this.tiles[destinationIndex];
                if(this.getContainsType(destinationTile.contains) === 'void') return
        let interaction = '';
        if(destinationTile.contains){
          interaction = this.handleInteraction(destinationTile)
        }
        if(interaction === 'impassable') return
       
                tile.image = this.getImageForContains(tile.contains);
        

        switch(direction){
            case 'up':
                this.playerTile.location[0] = (this.playerTile.location[0]- 1)
            break;
            case 'down':
                this.playerTile.location[0] = (this.playerTile.location[0]+ 1)
            break;
            case 'left':
                this.playerTile.location[1] = (this.playerTile.location[1]- 1)
            break;
            case 'right':
                this.playerTile.location[1] = (this.playerTile.location[1]+ 1)
            break;
            default:
            break;
        }
        // Recompute fog after updating the player's location so fog centers on the player
        try {
            const playerIdx = this.getIndexFromCoordinates(this.playerTile.location);
            if (this.tiles[playerIdx]) this.handleFogOfWar(this.tiles[playerIdx]);
            else this.handleFogOfWar(this.currentBoard.tiles[playerIdx]);
        } catch (e) {}
        if(interaction === 'door'){
            this.handlePassingThroughDoor();
        }
        if(interaction === 'way_up'){
            this.handlePassingThroughWayUp();
        }
        if(interaction === 'way_down'){
            this.handlePassingThroughWayDown();
        }
        this.overlayTiles.forEach(t=>t.image = null)
        this.overlayTiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
        this.checkAdjacency();
    }
    this.moveUp = () => {
        if(this.playerTile.location[0] === 15){
            this.moveBoardUp()
            return
        }
        const destinationCoords = [(this.playerTile.location[0]- 1),this.playerTile.location[1]];
        this.move(destinationCoords, 'up');
    }
    this.moveDown = () => {
        if(this.playerTile.location[0] === 29){
            this.moveBoardDown()
            return
        }
        const destinationCoords = [(this.playerTile.location[0]+ 1),this.playerTile.location[1]];
        this.move(destinationCoords, 'down')
    }
    this.moveLeft = () => {
        if(this.playerTile.location[1] === 15){
            this.moveBoardLeft()
            return
        }
        const destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]- 1)];
        this.move(destinationCoords, 'left')
    }
    this.moveRight = () => {
        if(this.playerTile.location[1] === 29){
            this.moveBoardRight()
            return
        }
        const destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]+ 1)];
        this.move(destinationCoords, 'right')
    }
    this.moveBoardLeft = () => {
        this.boardTransition('left')
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]+14]))
    }
    this.moveBoardRight = () => {
        this.boardTransition('right')
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex+1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]-14]))
    }
    this.moveBoardUp = () => {
        this.boardTransition('up')
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-3, this.getIndexFromCoordinates([this.playerTile.location[0]+14, this.playerTile.location[1]]))
    }
    this.moveBoardDown = () => {
        this.boardTransition('down')
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex+3, this.getIndexFromCoordinates([this.playerTile.location[0]-14, this.playerTile.location[1]]))
    }
    this.getImage = (key) => {
        switch(key){
            case 'delete':
                return 'trash'
            // case 'monster':
            //     return 'monster'
            case 'item':
                return 'lantern'
            case 'magic':
                return 'spell'
            case 'stairs':
                return 'stairs_down'
            case 'door':
                return 'closed_door'
            case 'dream den':
                return 'moon_castle'
            case 'masterkey':
                return 'ornate_key'  
            case 'devil':
                return 'mordu_devil'
            case 'spawn':
                return 'spawn_point'    
            default:
                return key
        }
    } 
    this.handleFogOfWar = (destinationTile) => {
        // Reset all tiles to hidden
        this.tiles.forEach((e) => {
            e.color = 'black';
            e.image = null;
            e.borders = null;
        });

        // Bresenham line algorithm to check for blocking 'void' tiles between two coordinates
        const isBlockedBetween = (fromIdx, toIdx) => {
            try {
                const from = this.getCoordinatesFromIndex(fromIdx);
                const to = this.getCoordinatesFromIndex(toIdx);
                let x0 = from[0], y0 = from[1];
                let x1 = to[0], y1 = to[1];
                let dx = Math.abs(x1 - x0);
                let dy = Math.abs(y1 - y0);
                let sx = (x0 < x1) ? 1 : -1;
                let sy = (y0 < y1) ? 1 : -1;
                let err = dx - dy;
                // step through intermediate points (excluding endpoints)
                while (!(x0 === x1 && y0 === y1)) {
                    const e2 = err * 2;
                    if (e2 > -dy) { err -= dy; x0 += sx; }
                    if (e2 < dx) { err += dx; y0 += sy; }
                    // if we've reached the target, break before checking
                    if (x0 === x1 && y0 === y1) break;
                    const idx = this.getIndexFromCoordinates([x0, y0]);
                    const tile = this.tiles[idx];
                    if (!tile) continue;
                    if (this.getContainsType(tile.contains) === 'void') return true;
                }
            } catch (e) { /* ignore errors and assume not blocked */ }
            return false;
        };

        const destCoords = this.getCoordinatesFromIndex(destinationTile.id);
        this.tiles.forEach((e) => {
            try {
                const coords = this.getCoordinatesFromIndex(e.id);
                const dx = Math.abs(coords[0] - destCoords[0]);
                const dy = Math.abs(coords[1] - destCoords[1]);
                const manhattan = dx + dy;
                // reveal tiles within radius 2 (Manhattan distance) if not blocked
                if (manhattan <= 2 && this.getContainsType(e.contains) !== 'void') {
                    if (!isBlockedBetween(destinationTile.id, e.id)) {
                        const persistedColor = (this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[e.id] && this.currentBoard.tiles[e.id].color);
                        const runtimeColor = (e.color && e.color !== 'black') ? e.color : null;
                        const boardColor = (persistedColor && persistedColor !== 'black') ? persistedColor : (runtimeColor || null);
                        e.color = boardColor || 'white';
                        e.image = this.getImageForContains(e.contains);
                    }
                }
                // also reveal the tile in the same column up/down up to 30/15 offsets if not blocked (preserve some original behavior)
                if ((e.id === destinationTile.id - 15 || e.id === destinationTile.id + 15) && !isBlockedBetween(destinationTile.id, e.id) && this.getContainsType(e.contains) !== 'void') {
                    const persistedColor = (this.currentBoard && this.currentBoard.tiles && this.currentBoard.tiles[e.id] && this.currentBoard.tiles[e.id].color);
                    const runtimeColor = (e.color && e.color !== 'black') ? e.color : null;
                    const boardColor = (persistedColor && persistedColor !== 'black') ? persistedColor : (runtimeColor || null);
                    e.color = boardColor || 'white';
                    e.image = this.getImageForContains(e.contains);
                }
            } catch (err) {}
    });
        try { if (this.refreshTiles) this.refreshTiles(); } catch (e) {}

        return true
    }
}