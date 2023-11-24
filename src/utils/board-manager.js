export function BoardManager(){
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
        'beholder',
        'black_banshee',
        'black_djinn',
        'black_gorgon',
        'black_kronos',
        'black_minotaur',
        'black_vampire',
        'black_wraith',
        'dragon',
        'giant_scorpion',
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
        console.log('setting avtive inv item:', e, 'is this necessary???')
        this.activeInventoryItem = e;
    }
    this.establishSetMonsterCallback = (callback) => {
        this.setMonster = callback;
    }
    this.playerTile = {
        location: [0,0],
        boardIndex: null,
        levelId: 0
    }
    this.dungeon = {};
    this.currentBoard = {};
    this.currentOrientation = 'F'
    this.currentLevel = {}
    
    this.getCoordinatesFromIndex = (index) =>{
        let row = Math.floor(index/15);
        let col = index%15;
        let x = 15 + row;
        let y = 15 + col;
        return [x, y]
    }
    this.establishAvailableItems = (items) => {
        this.availableItems = items;
        console.log('board manager available items: ', this.availableItems);
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
    this.initializeTilesFromMap = (boardIndex, spawnTileIndex) => {
        const getRandomMonster = () => {
            let idx = Math.floor(Math.random()*this.monstersArr.length);
            const monster = this.monstersArr[idx]
            // console.log('monster:', monster, this.getImage(monster));
            return monster
        }
        // console.log('this.available items:', this.availableItems)
        const getRandomItem = () => {
            const idx = Math.floor(Math.random()*this.availableItems.length),
            item = this.availableItems[idx];
            // console.log('random idx:', idx)
            return item;
        }
        // console.log('random item: ', getRandomItem())
        let spawnCoords = this.getCoordinatesFromIndex(spawnTileIndex);
        let board = this.currentOrientation === 'F' ? this.currentLevel.front.miniboards[boardIndex] : this.currentLevel.back.miniboards[boardIndex]
        this.currentBoard = board;
        this.tiles = [];
        this.overlayTiles = [];
        this.playerTile = {
            location: spawnCoords,
            boardIndex: boardIndex
        }
        // console.log('board.tiles:', board.tiles)
        for(let i = 0; i< board.tiles.length; i++){
            let tile = board.tiles[i]
            if(tile.contains === 'monster') tile.contains = getRandomMonster();
            if(tile.contains === 'gate') tile.contains = 'minor_gate';
            if(tile.contains === 'lantern'){
                // console.log('yooooo')
                tile.contains = getRandomItem();
                // console.log('now tile contains:', tile.contains)
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


        // for(let t = 0; t<this.tiles.length; t++){
        //     const tile = this.tiles[t];
        //     if(t%2 === 0){
        //         tile.color = 'lightcoral'
        //         tile.color = 'lightseagreen'
        //         tile.color = 'lightsteelblue'
        //     }
        //     if(t%2 !== 0){
        //         tile.color = 'lightsalmon'
        //     }
        // }
    }
    this.placePlayer = (coordinates) => {
        let index = this.getIndexFromCoordinates(coordinates)
        this.overlayTiles[index].image = 'avatar'
        this.tiles[index].playerTile = true;
        this.tiles[index].image = 'avatar'
    }
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
                this.triggerMonsterBattle(true)
            break;
            case 'minor_gate':
                console.log('handle gate')
                this.handleGate(destinationTile);
                return 'impassable';
            case 'item':
                console.log('handle item', destinationTile)
                this.addItemToInventory(destinationTile)
                this.removeTileFromBoard(destinationTile)
                return 'item';
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
                console.log('factor: ', factor);
                const amount = Math.floor(Math.random() * factor);
                console.log('found gold: ', amount);
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
                console.log('treasureFactor: ', treasureFactor);
                // const amount = Math.floor(Math.random() * factor);
                // console.log('found gold: ', amount);
                // this.addCurrencyToInventory({
                //     type: 'gold',
                //     amount
                // })
                // this.removeTileFromBoard(destinationTile)
            break;
            default:
                break;
        }
    }
    this.removeDefeatedMonsterTile = () => {
        const tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        this.removeTileFromBoard(tile);
    }
    this.removeTileFromBoard = (tile) => {
        console.log('removing item from board');
        tile.image = null;
        tile.contains = null;
        tile.color = null; 
        this.tiles[tile.id] = tile;
        if(this.currentOrientation === 'F'){
            this.dungeon.levels.find(e=>e.id === this.currentLevel.id).front.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = null;
        } else {
            this.dungeon.levels.find(e=>e.id === this.currentLevel.id).back.miniboards.find(b=>b.id === this.currentBoard.id).tiles[tile.id].contains = null;
        }
        this.updateDungeon(this.dungeon)
        console.log('updated?');
    }
    this.handleGate = (tile) => {
        if(!this.activeInteractionTile) this.activeInteractionTile = tile;
        console.log('pending: ', this.pending)
        if(this.pending && this.pending.type === 'minor_gate'){
            this.messaging('This gate requires a minor key')
            console.log('check for key')
            let hasKey = false
            if(this.activeInventoryItem){
                console.log('checking...', this.activeInventoryItem)
                if(this.activeInventoryItem.contains === 'minor_key') hasKey = true;
            }
            if(hasKey){
                console.log('open gate')
                this.messaging('Minor gate rattles open')
                tile.contains = 'minor_gate_open'
                tile.image = 'minor_gate_open'
                this.activeInteractionTile = tile;
                console.log('this.tiles: ', this.tiles)
                // this.tiles[tile.index].contains = 'minor_gate_open';
                this.refreshTiles()
                // this.initializeTilesFromMap(this.playerTile.boardIndex, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]]))
            } else {
                tile.color = 'lightyellow'
                // this.pending = null;
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
        if(topRow) topRow.forEach(t=>{ if(highlightColor(t))t.color = highlightColor(t)})
        if(bottomRow) bottomRow.forEach(t=>{if(highlightColor(t)) t.color = highlightColor(t)})
    }
    this.move = (destinationCoords, direction) => {
        // this.messaging(null)
        const tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        const destinationIndex = this.getIndexFromCoordinates(destinationCoords),
        destinationTile = this.tiles[destinationIndex];
        if(destinationTile.contains === 'void') return
        let interaction = '';
        if(destinationTile.contains){

            console.log('destinationTile: ', destinationTile);
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
            // case 'item':
            //     console.log('please work')
            //     // this.addItemToInventory(destinationTile)
            //     this.removeTileFromBoard(destinationTile)
            //     // return 'item';
            // break;
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
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]+14]))
    }
    this.moveBoardRight = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex+1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]-14]))
    }
    this.moveBoardUp = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-3, this.getIndexFromCoordinates([this.playerTile.location[0]+14, this.playerTile.location[1]]))
    }
    this.moveBoardDown = () => {
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
            // if(e.id === 175) console.log('setting to black')
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
                e.color = 'black'
            } 
            if(e.id === destinationTile.id + 2 && this.tiles[destinationTile.id + 1].contains === 'void'){
                e.color = 'black'
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
            // eslint-disable-next-line
            if( (e.id === destinationTile.id - 14 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id + 1].contains !== 'void') || 
                // eslint-disable-next-line
                e.id === destinationTile.id - 16 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void' ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 14 && this.tiles[destinationTile.id + 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void' ||
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