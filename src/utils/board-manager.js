export function BoardManager(){
    console.log('creating board manager')
    this.tiles = [];
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
        'white_banshee',
        'white_djinn',
        'white_wraith',
        'white_gorgon',
        'white_vampire',
        'white_kronos',
        'white_minotaur',
        'wyvern',
        'wyvern_alt',
        'goloth_devil',
        'zul_devil',
        'mordu_devil',
        'vukular_devil',
        'ishtar_devil',
        'black_demon',
        'dulu_demon',
        'golden_demon',
        'kabuki_demon',

        // 'imp',
        // 'imp_overlord',
        // 'beholder','dragon','goblin','horror','ogre',
        // 'sphinx','troll','slime_mold','black_vampire','black_gorgon',
        // 'mummy','naiad','wyvern','skeleton','giant_scorpion','black_djinn','black_kronos',
        // 'black_banshee','black_wraith', 'manticore','black_minotaur'
    ];

    this.playerTile = {
        location: [0,0],
        boardIndex: null
    }
    this.dungeon = {};
    this.currentMap = {};
    
    this.getCoordinatesFromIndex = (index) =>{
        let row = Math.floor(index/15);
        let col = index%15;
        let x = 15 + row;
        let y = 15 + col;
        return [x, y]
    }
    this.getIndexFromCoordinates = (coordinates) =>{
        let x = coordinates[0], y = coordinates[1];
        let row = x%15
        let col = y%15
        let index = row*15 + col;
        return index
    }
    this.setDungeon = (dungeon) => {
        console.log('setting dungeon', dungeon);
        this.dungeon = dungeon;
    }
    this.initializeTilesFromMap = (boardIndex, spawnTileIndex) => {
        const getRandomMonster = () => {
            let idx = Math.floor(Math.random()*this.monstersArr.length);
            const monster = this.monstersArr[idx]
            // console.log('monster:', monster, this.getImage(monster));
            return monster
        }
        let spawnCoords = this.getCoordinatesFromIndex(spawnTileIndex);
        let map = this.dungeon.miniboards[boardIndex]
        this.currentMap = map;
        this.tiles = [];
        this.playerTile = {
            location: spawnCoords,
            boardIndex: boardIndex
        }
        // console.log(map, 'map.tiles filtered:', map.tiles.filter(e=> e.contains !== 'void' && e.contains !== null));
        for(let i = 0; i< map.tiles.length; i++){
            let tile = map.tiles[i]
            if(tile.contains === 'monster') tile.contains = getRandomMonster();
            this.tiles.push({
                type: 'board-tile',
                id: tile.id,
                color: tile.color,
                showCoordinates: false,
                contains: tile.contains,
                image: this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains,
                borders: null
            })
        }
        // console.log('RILES: ', this.tiles.filter(e=> e.contains !== 'void' && e.contains !== null));
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
        this.tiles[index].playerTile = true;
        this.tiles[index].image = 'avatar'
    }
    this.moveUp = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        if(this.playerTile.location[0] === 15){
            this.moveMapUp()
            return
        }
        let destinationCoords = [(this.playerTile.location[0]- 1),this.playerTile.location[1]];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        // let playerTile = this.playerTile;
        if(this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.handleFogOfWar(this.currentMap.tiles[destinationIndex])

        this.playerTile.location[0] = (this.playerTile.location[0]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
        // console.log('***** new location: ',this.playerTile.location[0], this.playerTile.location[1])
    }
    this.moveDown = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        if(this.playerTile.location[0] === 29){
            this.moveMapDown()
            return
        }
        let destinationCoords = [(this.playerTile.location[0]+ 1),this.playerTile.location[1]];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.handleFogOfWar(this.currentMap.tiles[destinationIndex])

        this.playerTile.location[0] = (this.playerTile.location[0]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveLeft = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        if(this.playerTile.location[1] === 15){
            this.moveMapLeft()
            return
        }
        let destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]- 1)];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.tiles[destinationIndex].contains === 'void') return
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;
        
        this.handleFogOfWar(this.currentMap.tiles[destinationIndex])
        
        this.playerTile.location[1] = (this.playerTile.location[1]- 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveRight = () => {
        let tile = this.tiles[this.getIndexFromCoordinates(this.playerTile.location)];
        if(this.playerTile.location[1] === 29){
            this.moveMapRight()
            return
        }
        let destinationCoords = [this.playerTile.location[0],(this.playerTile.location[1]+ 1)];
        let destinationIndex = this.getIndexFromCoordinates(destinationCoords);
        if(this.tiles[destinationIndex].contains === 'void') return
        //remove avatar from current tile
        tile.image = 
        this.getImage(tile.contains) ? this.getImage(tile.contains) : tile.contains;

        this.handleFogOfWar(this.currentMap.tiles[destinationIndex])

        this.playerTile.location[1] = (this.playerTile.location[1]+ 1)

        this.tiles[this.getIndexFromCoordinates(this.playerTile.location)].image = 'avatar'
    }
    this.moveMapLeft = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]+14]))
    }
    this.moveMapRight = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex+1, this.getIndexFromCoordinates([this.playerTile.location[0], this.playerTile.location[1]-14]))
    }
    this.moveMapUp = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex-3, this.getIndexFromCoordinates([this.playerTile.location[0]+14, this.playerTile.location[1]]))
    }
    this.moveMapDown = () => {
        this.tiles = [];
        this.initializeTilesFromMap(this.playerTile.boardIndex+3, this.getIndexFromCoordinates([this.playerTile.location[0]-14, this.playerTile.location[1]]))
    }
    this.getImage = (key) => {
        //this switch case renames images so they can fit in a 2 tile space
        // console.log('key: ', key);
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
            e.borders = null;
        })
        this.tiles.forEach((e)=> {
            // function sameRow(){
            //     return e.coordinates[0] === destinationTile.coordinates[0]
            // }

            if(e.id > destinationTile.id - 3 && e.id < destinationTile.id + 3 ){
                e.color = this.currentMap.tiles[e.id].color
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
                e.color = this.currentMap.tiles[e.id].color
            }
            // eslint-disable-next-line
            if( (e.id === destinationTile.id - 14 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id + 1].contains !== 'void') || 
                // eslint-disable-next-line
                e.id === destinationTile.id - 16 && this.tiles[destinationTile.id - 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void' ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 14 && this.tiles[destinationTile.id + 15].contains !== 'void' && this.tiles[destinationTile.id - 1].contains !== 'void' ||
                // eslint-disable-next-line
                e.id === destinationTile.id + 16 && this.tiles[destinationTile.id + 15].contains !== 'void' && this.tiles[destinationTile.id + 1].contains !== 'void'){
               e.color = this.currentMap.tiles[e.id].color
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