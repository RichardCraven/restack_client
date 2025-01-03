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
    }
    this.setCurrentLevel = (level) => {
        this.currentLevel = level;
    }
    this.setCurrentOrientation = (orientation) => {
        this.currentOrientation = orientation;
    }
    this.respawnMonsters = (template) => {
        console.log('respawn monsters, template: ', template);
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
        templateBoard.tiles.forEach(templateTile=>{
            let equivalentTile = currentLevel.miniboards[this.playerTile.boardIndex].tiles.find(tile=> tile.id === templateTile.id)
            if(templateTile.contains === 'monster' && !this.isMonster(equivalentTile) && this.getIndexFromCoordinates(this.playerTile.location) !== templateTile.id) {
                
                equivalentTile.contains = this.getRandomMonster()
                equivalentTile.image = this.getImage(equivalentTile.contains) ? this.getImage(equivalentTile.contains) : equivalentTile.contains
                this.tiles[templateTile.id] = equivalentTile;
            }
        })
        this.updateDungeon(this.dungeon);
        this.refreshTiles()
    }
    this.initializeTilesFromMap = (boardIndex, spawnTileIndex) => {
        const getRandomItem = () => {
            const idx = Math.floor(Math.random()*this.availableItems.length),
            item = this.availableItems[idx];
            return item;
        }
        let spawnCoords = this.getCoordinatesFromIndex(spawnTileIndex);
        let board = this.currentOrientation === 'F' ? this.currentLevel.front.miniboards[boardIndex] : this.currentLevel.back.miniboards[boardIndex]

        this.currentBoard = board;
        this.tiles = [];
        this.overlayTiles = [];
        this.playerTile = {
            location: spawnCoords,
            boardIndex: boardIndex
        }
        for(let i = 0; i< board.tiles.length; i++){
            let tile = board.tiles[i]
            if(tile.contains === 'monster'){
                tile.contains = this.getRandomMonster();
            }
            if(tile.contains === 'gate') tile.contains = 'minor_gate';
            if(tile.contains === 'lantern'){
                tile.contains = getRandomItem();
            }
            this.tiles.push({
                type: 'board-tile',
                id: tile.id,
                color: tile.color,
                showCoordinates: false,
                contains: tile.contains,
                image: this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains,
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
        return this.monstersArr.includes(tile.contains)
    })
    this.handleInteraction = (destinationTile) => {
        let val = destinationTile.contains
        if(this.monstersArr.includes(destinationTile.contains)) val = 'monster'
        if(this.availableItems.includes(destinationTile.contains)) val = 'item'
        switch(val){
            case 'door':
                return 'door';
            case 'way_up':
                return 'way_up';
            case 'way_down':
                return 'way_down';
            case 'monster':
                this.setMonster(destinationTile.contains)
                this.triggerMonsterBattle(true, destinationTile.id)
                return 'impassable';
            case 'minor_gate':
                this.handleGate(destinationTile);
                return 'impassable';
            case 'item':
                this.addItemToInventory(destinationTile)
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
        console.log('remove monster tile', tileId);
        const tile = this.tiles[tileId];
        this.removeTileFromBoard(tile);
    }
    this.removeTileFromBoard = (tile) => {
        tile.image = null;
        tile.contains = null;
        tile.color = null; 
        this.tiles[tile.id] = tile;
        if(this.currentOrientation === 'F'){
            this.dungeon.levels.find(e=>e.id === this.currentLevel.id).front.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = null;
        } else {
            this.dungeon.levels.find(e=>e.id === this.currentLevel.id).back.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = null;
        }
        // debugger
        this.updateDungeon(this.dungeon);
        this.refreshTiles();
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
            if(this.monstersArr.includes(tile.contains)) color = '#ff000078'
            if(this.availableItems.includes(tile.contains)) color = 'lightyellow'
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
                if(topRow[1].contains === 'void' && leftTile.contains === 'void') return
            }
            if(i === 2){
                if(topRow[1].contains === 'void' && rightTile.contains === 'void') return
            }
            if(highlightColor(t))t.color = highlightColor(t)
        })
        if(bottomRow) bottomRow.forEach((t, i)=>{if(highlightColor(t)){
            if(i === 0){
                if(bottomRow[1].contains === 'void' && leftTile.contains === 'void') return
            }
            if(i === 2){
                if(bottomRow[1].contains === 'void' && rightTile.contains === 'void') return
            }
            t.color = highlightColor(t)}
        })


    }
    this.move = (destinationCoords, direction) => {
        const tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        const destinationIndex = this.getIndexFromCoordinates(destinationCoords),
        destinationTile = this.tiles[destinationIndex];
        if(destinationTile.contains === 'void') return
        let interaction = '';
        if(destinationTile.contains){
          interaction = this.handleInteraction(destinationTile)
        }
        if(interaction === 'impassable') return
       
        tile.image = this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        

        this.handleFogOfWar(this.currentBoard.tiles[destinationIndex])

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
        this.tiles.forEach((e)=> {
            e.color = 'black';
            e.image = null;
            e.borders = null;
        })
        this.tiles.forEach((e)=> {
            if(e.id > destinationTile.id - 3 && e.id < destinationTile.id + 3 ){
                let isWrapAroundTile = (e.id === destinationTile.id + 2 || e.id === destinationTile.id -2 || destinationTile.id + 1 || e.id === destinationTile.id - 1) && (this.getCoordinatesFromIndex(e.id)[0] !== this.getCoordinatesFromIndex(destinationTile.id)[0]);
                if(!isWrapAroundTile){
                    e.color = this.currentBoard.tiles[e.id].color;
                    e.image = e.contains;
                }
            } 
            
            if(e.id === destinationTile.id - 2 && this.tiles[destinationTile.id - 1].contains === 'void'){
                //prevent seeing past walls
                e.color = 'black'
                e.image = null;
            } 
            if(e.id === destinationTile.id + 2 && this.tiles[destinationTile.id + 1].contains === 'void'){
                //prevent seeing past walls
                e.color = 'black'
                e.image = null;
            } 
            // eslint-disable-next-line
            if( e.id === destinationTile.id - 15 || 
                // eslint-disable-next-line
                e.id === destinationTile.id - 30 &&  this.tiles[destinationTile.id - 15].contains !== 'void' ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 15 ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 30 &&  this.tiles[destinationTile.id + 15].contains !== 'void') {
                e.color = this.currentBoard.tiles[e.id].color
                e.image = e.contains;
            }
            if( (e.id === destinationTile.id - 14 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id + 1].contains !== 'void') || 
                // eslint-disable-next-line
                (e.id === destinationTile.id - 16 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void') ||
                // eslint-disable-next-line
                (e.id === destinationTile.id + 14 && this.tiles[destinationTile.id + 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void') ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 16 && this.tiles[destinationTile.id + 15].contains !== 'void' && this.tiles[destinationTile.id + 1].contains !== 'void'){   
                e.color = this.currentBoard.tiles[e.id].color
                e.image = e.contains;
            }
            //handle left side mapscroll border
            if(e.id === destinationTile.id - 1 && this.tiles[e.id].contains !== 'void' && this.getCoordinatesFromIndex(e.id)[0] !== this.getCoordinatesFromIndex(e.id-1)[0]){
                e.borders = {left: '1px solid red'}
                if(this.tiles[e.id - 15]) this.tiles[e.id - 15].borders = {left: '1px solid red'}
                if(this.tiles[e.id + 15]) this.tiles[e.id + 15].borders = {left: '1px solid red'}
            }
            if(e.id === destinationTile.id &&  this.getCoordinatesFromIndex(e.id)[0] !== this.getCoordinatesFromIndex(e.id-1)[0]){
                e.borders = {left: '1px solid red'}
                if(this.tiles[e.id - 15]) this.tiles[e.id - 15].borders = {left: '1px solid red'}
                if(this.tiles[e.id + 15]) this.tiles[e.id + 15].borders = {left: '1px solid red'}
            } 

            //handle right side mapscroll border
            if(e.id === destinationTile.id + 1 && this.tiles[e.id].contains !== 'void' &&  this.getCoordinatesFromIndex(e.id)[0] !== this.getCoordinatesFromIndex(e.id+1)[0]){
                e.borders = {right: '1px solid red'}
                if(this.tiles[e.id - 15]) this.tiles[e.id - 15].borders = {right: '1px solid red'}
                if(this.tiles[e.id + 15]) this.tiles[e.id + 15].borders = {right: '1px solid red'}
            }
            if(e.id === destinationTile.id &&  this.getCoordinatesFromIndex(e.id)[0] !== this.getCoordinatesFromIndex(e.id+1)[0]){
                e.borders = {right: '1px solid red'}
                if(this.tiles[e.id - 15]) this.tiles[e.id - 15].borders = {right: '1px solid red'}
                if(this.tiles[e.id + 15]) this.tiles[e.id + 15].borders = {right: '1px solid red'}
            } 

            //handle top side mapscroll border
            if(e.id === destinationTile.id - 15 && this.tiles[e.id].contains !== 'void' && !this.tiles[destinationTile.id - 30]){
                e.borders = {top: '1px solid red'}
                if(this.tiles[e.id - 1]) this.tiles[e.id - 1].borders = {top: '1px solid red'}
                if(this.tiles[e.id + 1]) this.tiles[e.id + 1].borders = {top: '1px solid red'}
            }
            if(e.id === destinationTile.id && !this.tiles[destinationTile.id - 15]){
                e.borders = {top: '1px solid red'}
                if(this.tiles[e.id - 1]) this.tiles[e.id - 1].borders = {top: '1px solid red'}
                if(this.tiles[e.id + 1]) this.tiles[e.id + 1].borders = {top: '1px solid red'}
            } 
            
            //handle bottom side mapscroll border
            if(e.id === destinationTile.id + 15 && this.tiles[e.id].contains !== 'void' && !this.tiles[destinationTile.id + 30]){
                e.borders = {bottom: '1px solid red'}
                if(this.tiles[e.id - 1]) this.tiles[e.id - 1].borders = {bottom: '1px solid red'}
                if(this.tiles[e.id + 1]) this.tiles[e.id + 1].borders = {bottom: '1px solid red'}
            }
            if(e.id === destinationTile.id && !this.tiles[destinationTile.id + 15]){
                e.borders = {bottom: '1px solid red'}
                if(this.tiles[e.id - 1]) this.tiles[e.id - 1].borders = {bottom: '1px solid red'}
                if(this.tiles[e.id + 1]) this.tiles[e.id + 1].borders = {bottom: '1px solid red'}
            } 
        })
        return true
    }
}